import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { displayInitials, displayName } from '../../lib/genealogy';
import { DEATH_SYMBOL, icons } from '../../lib/icons';
import { useI18n } from '../../lib/i18n';
import { useNotify } from '../../lib/notify';
import {
  CARD_H,
  CARD_W,
  layoutTree,
  type PositionOverrides,
  type TreePerson,
  type TreeUnion,
} from './layout';

const SEX_ACCENT: Record<TreePerson['sex'], string> = {
  MALE: '#5f8a8f',
  FEMALE: '#c0714a',
  OTHER: '#8a7aa8',
  UNKNOWN: '#a8a29e',
};

const initials = (person: TreePerson): string => displayInitials(person);

const fullName = (person: TreePerson): string => displayName(person) || '—';

interface Transform {
  x: number;
  y: number;
  scale: number;
}

type Interaction =
  | { kind: 'pan'; sx: number; sy: number; ox: number; oy: number; moved: boolean }
  | { kind: 'marquee'; sx: number; sy: number }
  // Two-finger pinch: anchor the world point under the initial midpoint (wx,wy)
  // and scale relative to the initial finger distance.
  | { kind: 'pinch'; startDist: number; startScale: number; wx: number; wy: number }
  | {
      kind: 'card';
      ids: string[];
      personId: string;
      sx: number;
      sy: number;
      origins: Map<string, { x: number; y: number }>;
      moved: boolean;
      // Dragging enabled for this press: mouse/pen always, touch only in 'move' mode.
      draggable: boolean;
    };

export function TreeCanvas({
  persons,
  unions,
  selectedId,
  selectedUnionId,
  onSelect,
  onSelectUnion,
  isAdmin,
  onRemovePersons,
  positions,
  move,
  commit,
  reset,
  resetAll,
  readOnly = false,
  mediaUrl = (id: string) => `/api/media/${id}/file`,
  kinship,
  selfId = null,
}: {
  persons: TreePerson[];
  unions: TreeUnion[];
  selectedId: string | null;
  selectedUnionId: string | null;
  onSelect: (id: string | null) => void;
  onSelectUnion: (id: string) => void;
  isAdmin: boolean;
  onRemovePersons: (ids: string[]) => Promise<void>;
  positions: PositionOverrides;
  move: (updates: Map<string, { x: number; y: number }>) => void;
  commit: () => void;
  reset: (ids: string[]) => void;
  resetAll: () => void;
  // Public share view: pan/zoom + tap-to-inspect only, no editing gestures.
  readOnly?: boolean;
  // Builds a profile-picture URL from a media id (differs on the public view).
  mediaUrl?: (mediaId: string) => string;
  // Localised kinship label per person id, relative to the viewer ("moi").
  kinship?: Map<string, string>;
  selfId?: string | null;
}) {
  const { t } = useI18n();
  const { confirm } = useNotify();
  const layout = useMemo(
    () => layoutTree(persons, unions, positions),
    [persons, unions, positions],
  );
  const centers = useMemo(
    () =>
      new Map(
        layout.boxes.map((box) => [
          box.person.id,
          { cx: box.x + box.w / 2, cy: box.y + box.h / 2 },
        ]),
      ),
    [layout],
  );

  const viewportRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState<Transform>({ x: 0, y: 0, scale: 1 });
  const [mode, setMode] = useState<'pan' | 'select'>('pan');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [marquee, setMarquee] = useState<{
    x: number;
    y: number;
    w: number;
    h: number;
  } | null>(null);
  const [removing, setRemoving] = useState(false);
  // Photo ids whose image failed to load (missing file / non-image): fall back
  // to the initials avatar instead of a broken-image glyph.
  const [failedPhotos, setFailedPhotos] = useState<Set<string>>(new Set());
  const interaction = useRef<Interaction | null>(null);
  // Active pointers that started on the background (for pan + pinch-zoom).
  const pointers = useRef<Map<number, { x: number; y: number }>>(new Map());
  // Card a background gesture started on — lets a touch tap select the card
  // while still allowing the same finger (and a second one) to pan/pinch.
  const pressedCardId = useRef<string | null>(null);
  // Card currently being dragged (for the lift/scale visual cue).
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [fitted, setFitted] = useState(false);

  const fit = useCallback(() => {
    const el = viewportRef.current;
    if (!el) return;
    const { minX, minY, maxX, maxY } = layout.bounds;
    const w = maxX - minX;
    const h = maxY - minY;
    if (w <= 0 || h <= 0) return;
    const scale = Math.min(1.1, (el.clientWidth - 40) / w, (el.clientHeight - 40) / h);
    setTransform({
      scale,
      x: (el.clientWidth - w * scale) / 2 - minX * scale,
      y: (el.clientHeight - h * scale) / 2 - minY * scale,
    });
  }, [layout.bounds]);

  useEffect(() => {
    if (!fitted && layout.boxes.length > 0) {
      fit();
      setFitted(true);
    }
  }, [fit, fitted, layout.boxes.length]);

  // Wheel = zoom the canvas only. React attaches onWheel as passive, so
  // preventDefault() there is ignored and the page scrolls — bind natively.
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const handler = (event: WheelEvent) => {
      event.preventDefault();
      const rect = el.getBoundingClientRect();
      const px = event.clientX - rect.left;
      const py = event.clientY - rect.top;
      setTransform((tr) => {
        const factor = event.deltaY < 0 ? 1.12 : 1 / 1.12;
        const scale = Math.min(2.4, Math.max(0.15, tr.scale * factor));
        const k = scale / tr.scale;
        return { scale, x: px - (px - tr.x) * k, y: py - (py - tr.y) * k };
      });
    };
    el.addEventListener('wheel', handler, { passive: false });
    return () => el.removeEventListener('wheel', handler);
  }, []);

  // --- background interactions (pan / marquee) ---
  const onBgPointerDown = (event: React.PointerEvent) => {
    const el = viewportRef.current;
    if (!el) return;
    // Which card (if any) this gesture began on — touch presses on a card bubble
    // here (they aren't captured by the card) so pan/pinch keeps working.
    pressedCardId.current =
      (event.target as HTMLElement | null)
        ?.closest?.('[data-person-id]')
        ?.getAttribute('data-person-id') ?? null;
    const rect = el.getBoundingClientRect();
    const sx = event.clientX - rect.left;
    const sy = event.clientY - rect.top;
    pointers.current.set(event.pointerId, { x: sx, y: sy });
    try {
      el.setPointerCapture(event.pointerId);
    } catch {
      /* no active pointer (synthetic event) */
    }

    // Second finger on the background → pinch-zoom (overrides any pan/marquee).
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      const mx = (a.x + b.x) / 2;
      const my = (a.y + b.y) / 2;
      setMarquee(null);
      interaction.current = {
        kind: 'pinch',
        startDist: Math.hypot(a.x - b.x, a.y - b.y) || 1,
        startScale: transform.scale,
        wx: (mx - transform.x) / transform.scale,
        wy: (my - transform.y) / transform.scale,
      };
      return;
    }

    if (!readOnly && (mode === 'select' || event.shiftKey)) {
      interaction.current = { kind: 'marquee', sx, sy };
      setMarquee({ x: sx, y: sy, w: 0, h: 0 });
    } else {
      interaction.current = {
        kind: 'pan',
        sx: event.clientX,
        sy: event.clientY,
        ox: transform.x,
        oy: transform.y,
        moved: false,
      };
    }
  };

  const onBgPointerMove = (event: React.PointerEvent) => {
    const el = viewportRef.current;
    if (el && pointers.current.has(event.pointerId)) {
      const rect = el.getBoundingClientRect();
      pointers.current.set(event.pointerId, {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      });
    }
    const it = interaction.current;
    if (!it) return;
    if (it.kind === 'pinch') {
      if (pointers.current.size < 2) return;
      const [a, b] = [...pointers.current.values()];
      const dist = Math.hypot(a.x - b.x, a.y - b.y) || 1;
      const mx = (a.x + b.x) / 2;
      const my = (a.y + b.y) / 2;
      const scale = Math.min(2.4, Math.max(0.15, it.startScale * (dist / it.startDist)));
      setTransform({ scale, x: mx - it.wx * scale, y: my - it.wy * scale });
    } else if (it.kind === 'pan') {
      const dx = event.clientX - it.sx;
      const dy = event.clientY - it.sy;
      if (Math.hypot(dx, dy) > 3) it.moved = true;
      setTransform((tr) => ({ ...tr, x: it.ox + dx, y: it.oy + dy }));
    } else if (it.kind === 'marquee') {
      const rect = viewportRef.current!.getBoundingClientRect();
      const cx = event.clientX - rect.left;
      const cy = event.clientY - rect.top;
      setMarquee({
        x: Math.min(it.sx, cx),
        y: Math.min(it.sy, cy),
        w: Math.abs(cx - it.sx),
        h: Math.abs(cy - it.sy),
      });
    }
  };

  const onBgPointerUp = (event: React.PointerEvent) => {
    pointers.current.delete(event.pointerId);
    const it = interaction.current;
    // Keep pinch alive until fewer than two fingers remain; don't fall through
    // to the marquee/pan/tap logic below.
    if (it?.kind === 'pinch') {
      if (pointers.current.size < 2) interaction.current = null;
      return;
    }
    interaction.current = null;
    if (it?.kind === 'marquee') {
      const m = marquee;
      setMarquee(null);
      if (m && (m.w > 4 || m.h > 4)) {
        const ax = (m.x - transform.x) / transform.scale;
        const ay = (m.y - transform.y) / transform.scale;
        const bx = (m.x + m.w - transform.x) / transform.scale;
        const by = (m.y + m.h - transform.y) / transform.scale;
        const sel = new Set<string>();
        for (const box of layout.boxes) {
          const cx = box.x + box.w / 2;
          const cy = box.y + box.h / 2;
          if (cx >= ax && cx <= bx && cy >= ay && cy <= by) sel.add(box.person.id);
        }
        setSelectedIds(sel);
        onSelect(null);
      } else {
        setSelectedIds(new Set());
        onSelect(null);
      }
    } else if (it?.kind === 'pan' && !it.moved) {
      // A tap that didn't pan: select the card it landed on, else clear.
      setSelectedIds(new Set());
      onSelect(pressedCardId.current);
    }
  };

  // --- card drag ---
  // Mouse/pen drag a card immediately. Touch only drags in 'move' mode (a
  // deterministic toggle) so a plain touch stays a tap/pan — no flaky
  // long-press gesture detection.
  const onCardPointerDown = (person: TreePerson, event: React.PointerEvent) => {
    // Touch: let the press bubble to the viewport so it can pan/pinch (the card
    // is identified via data-person-id for tap-to-select). Only mouse/pen drag
    // a card here.
    if (event.pointerType === 'touch') return;
    event.stopPropagation();
    const inSelection = selectedIds.has(person.id) && selectedIds.size > 1;
    const ids = inSelection ? [...selectedIds] : [person.id];
    const origins = new Map<string, { x: number; y: number }>();
    for (const id of ids) {
      const box = layout.boxes.find((b) => b.person.id === id);
      if (box) origins.set(id, { x: box.x, y: box.y });
    }
    interaction.current = {
      kind: 'card',
      ids,
      personId: person.id,
      sx: event.clientX,
      sy: event.clientY,
      origins,
      moved: false,
      // Only mouse/pen reach here (touch returned early and pans instead); the
      // read-only share view still never drags.
      draggable: !readOnly,
    };
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      /* no active pointer */
    }
  };

  const onCardPointerMove = (event: React.PointerEvent) => {
    const it = interaction.current;
    if (it?.kind !== 'card' || !it.draggable) return;
    if (!it.moved && Math.hypot(event.clientX - it.sx, event.clientY - it.sy) > 4) {
      it.moved = true;
      setDraggingId(it.personId);
    }
    if (!it.moved) return;
    const dx = (event.clientX - it.sx) / transform.scale;
    const dy = (event.clientY - it.sy) / transform.scale;
    const updates = new Map<string, { x: number; y: number }>();
    for (const [id, origin] of it.origins) {
      updates.set(id, { x: origin.x + dx, y: origin.y + dy });
    }
    move(updates);
  };

  const onCardPointerUp = () => {
    const it = interaction.current;
    // Touch pan/pinch is owned by the viewport; don't disturb it here.
    if (it?.kind !== 'card') return;
    setDraggingId(null);
    interaction.current = null;
    if (it.draggable && it.moved) {
      commit();
    } else if (!it.moved) {
      setSelectedIds(new Set());
      onSelect(it.personId);
    }
  };

  const onCardPointerCancel = () => {
    setDraggingId(null);
    interaction.current = null;
  };

  const removeSelected = () => {
    const ids = [...selectedIds];
    if (!ids.length) return;
    void confirm(
      t('confirmRemoveSelected').replace('{n}', String(ids.length)),
      { danger: true },
    ).then(async (ok) => {
      if (!ok) return;
      setRemoving(true);
      try {
        await onRemovePersons(ids);
        reset(ids);
        setSelectedIds(new Set());
      } finally {
        setRemoving(false);
      }
    });
  };

  // Discard manual positions → snap back to the top-down generational layout,
  // then re-fit the view to the fresh arrangement.
  const autoArrange = () => {
    void confirm(t('confirmAutoArrange')).then((ok) => {
      if (!ok) return;
      resetAll();
      setFitted(false);
    });
  };

  const toolButton = (active: boolean) =>
    `grid size-8 place-items-center rounded-full text-sm transition ${
      active
        ? 'bg-amber-600 text-white'
        : 'text-stone-500 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-700'
    }`;

  return (
    <div
      ref={viewportRef}
      className={`relative h-full w-full touch-none select-none overflow-hidden ${
        mode === 'select' ? 'cursor-crosshair' : 'cursor-grab active:cursor-grabbing'
      }`}
      // Guaranteed non-selection for the whole canvas: on iOS a touch drag over
      // the cards otherwise starts a text selection that kills the gesture.
      style={{
        userSelect: 'none',
        WebkitUserSelect: 'none',
        WebkitTouchCallout: 'none',
      }}
      onPointerDown={onBgPointerDown}
      onPointerMove={onBgPointerMove}
      onPointerUp={onBgPointerUp}
      onPointerLeave={onBgPointerUp}
    >
      <div
        className="absolute left-0 top-0 origin-top-left"
        style={{
          transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
          width: layout.width,
          height: layout.height,
        }}
      >
        <svg
          className="pointer-events-none absolute left-0 top-0 overflow-visible"
          width={layout.width}
          height={layout.height}
        >
          {layout.unions.map(({ union, x, y }) =>
            union.childIds.map((childId) => {
              const child = centers.get(childId);
              if (!child) return null;
              const startY = y + CARD_H / 2;
              const endY = child.cy - CARD_H / 2;
              const midY = (startY + endY) / 2;
              return (
                <path
                  key={`${union.id}-${childId}`}
                  d={`M ${x} ${startY} C ${x} ${midY}, ${child.cx} ${midY}, ${child.cx} ${endY}`}
                  fill="none"
                  className="stroke-stone-300 dark:stroke-stone-600"
                  strokeWidth={2}
                />
              );
            }),
          )}
          {layout.unions.map(({ union }) => {
            const pts = union.partnerIds
              .map((id) => centers.get(id))
              .filter((c): c is { cx: number; cy: number } => !!c);
            if (pts.length !== 2) return null;
            return (
              <path
                key={`p-${union.id}`}
                d={`M ${pts[0].cx} ${pts[0].cy} L ${pts[1].cx} ${pts[1].cy}`}
                fill="none"
                className="stroke-amber-400/70 dark:stroke-amber-600/60"
                strokeWidth={2.5}
              />
            );
          })}
          {layout.unions.map(({ union, x, y }) =>
            union.partnerIds.length >= 1 ? (
              <circle
                key={union.id}
                cx={x}
                cy={y}
                r={union.id === selectedUnionId ? 8 : 5}
                className={
                  union.id === selectedUnionId
                    ? 'fill-amber-500 stroke-amber-300'
                    : 'fill-amber-500'
                }
                strokeWidth={3}
              />
            ) : null,
          )}
        </svg>

        {layout.unions.map(({ union, x, y }) =>
          union.partnerIds.length >= 1 ? (
            <button
              type="button"
              key={union.id}
              aria-label="union"
              onPointerDown={(event) => event.stopPropagation()}
              onClick={(event) => {
                event.stopPropagation();
                onSelectUnion(union.id);
              }}
              style={{ left: x - 12, top: y - 12, width: 24, height: 24 }}
              className="absolute rounded-full"
            />
          ) : null,
        )}

        {layout.boxes.map(({ person, x, y }) => {
          const isSingle = person.id === selectedId;
          const inMarquee = selectedIds.has(person.id);
          const isDragging = person.id === draggingId;
          return (
            <div
              key={person.id}
              role="button"
              tabIndex={0}
              data-person-id={person.id}
              onPointerDown={(event) => onCardPointerDown(person, event)}
              onPointerMove={onCardPointerMove}
              onPointerUp={onCardPointerUp}
              onPointerCancel={onCardPointerCancel}
              style={{
                left: x,
                top: y,
                width: CARD_W,
                height: CARD_H,
                WebkitTouchCallout: 'none',
              }}
              className={`absolute flex touch-none select-none items-center gap-3 rounded-2xl border bg-white px-3 text-left shadow-sm transition-transform dark:bg-stone-800 ${
                isDragging
                  ? 'z-10 scale-105 border-amber-500 shadow-xl ring-2 ring-amber-500'
                  : isSingle
                    ? 'border-amber-500 ring-2 ring-amber-500/40'
                    : inMarquee
                      ? 'border-amber-400 bg-amber-50 ring-2 ring-amber-400/50 dark:bg-amber-950/40'
                      : 'border-stone-200 hover:border-amber-300 dark:border-stone-700'
              }`}
            >
              <span className="relative shrink-0">
                {person.photoMediaId &&
                !failedPhotos.has(person.photoMediaId) ? (
                  <img
                    src={mediaUrl(person.photoMediaId)}
                    alt=""
                    draggable={false}
                    onError={() =>
                      setFailedPhotos((prev) =>
                        new Set(prev).add(person.photoMediaId!),
                      )
                    }
                    className="size-9 rounded-full object-cover"
                  />
                ) : (
                  <span
                    className="grid size-9 place-items-center rounded-full text-xs font-semibold text-white"
                    style={{ backgroundColor: SEX_ACCENT[person.sex] }}
                  >
                    {initials(person)}
                  </span>
                )}
                {person.deceased && (
                  <span
                    title={t('deceased')}
                    aria-label={t('deceased')}
                    className="absolute -bottom-0.5 -right-0.5 grid size-4 place-items-center rounded-full bg-white text-stone-500 ring-1 ring-stone-200 dark:bg-stone-800 dark:text-stone-300 dark:ring-stone-600"
                  >
                    <FontAwesomeIcon
                      icon={
                        DEATH_SYMBOL[person.religion ?? 'NEUTRAL'] ??
                        DEATH_SYMBOL.NEUTRAL
                      }
                      className="text-[8px]"
                    />
                  </span>
                )}
              </span>
              {(() => {
                const kin = kinship?.get(person.id);
                const isSelf = person.id === selfId;
                return (
                  <span className="min-w-0 flex-1">
                    <span
                      className={`${kin ? 'line-clamp-1' : 'line-clamp-2'} text-sm font-medium leading-tight text-stone-800 dark:text-stone-100`}
                    >
                      {fullName(person)}
                    </span>
                    <span className="flex items-center gap-1.5 text-[11px] text-stone-400 dark:text-stone-500">
                      <FontAwesomeIcon
                        icon={
                          person.sex === 'MALE'
                            ? icons.male
                            : person.sex === 'FEMALE'
                              ? icons.female
                              : icons.genderless
                        }
                      />
                      {person.birthDate && (
                        <span className="truncate">{person.birthDate}</span>
                      )}
                    </span>
                    {kin && (
                      <span
                        title={kin}
                        className={`block truncate text-[11px] font-semibold ${
                          isSelf
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-amber-700/75 dark:text-amber-500/75'
                        }`}
                      >
                        {kin}
                      </span>
                    )}
                  </span>
                );
              })()}
            </div>
          );
        })}
      </div>

      {marquee && (
        <div
          className="pointer-events-none absolute z-10 rounded border-2 border-amber-400 bg-amber-400/10"
          style={{
            left: marquee.x,
            top: marquee.y,
            width: marquee.w,
            height: marquee.h,
          }}
        />
      )}

      {/* Toolbar */}
      <div
        onPointerDown={(event) => event.stopPropagation()}
        className="absolute bottom-4 left-4 z-20 flex items-center gap-1 rounded-full bg-white/90 p-1 shadow-sm ring-1 ring-stone-200 backdrop-blur dark:bg-stone-800/90 dark:ring-stone-700"
      >
        <button
          type="button"
          onClick={() => setMode('pan')}
          className={toolButton(mode === 'pan')}
          title={t('panMode')}
          aria-label={t('panMode')}
        >
          <FontAwesomeIcon icon={icons.pan} />
        </button>
        {!readOnly && (
          <>
            <button
              type="button"
              onClick={() => setMode('select')}
              className={toolButton(mode === 'select')}
              title={t('selectMode')}
              aria-label={t('selectMode')}
            >
              <FontAwesomeIcon icon={icons.marquee} />
            </button>
            <span className="mx-0.5 h-5 w-px bg-stone-200 dark:bg-stone-700" />
            <button
              type="button"
              onClick={autoArrange}
              className={toolButton(false)}
              title={t('autoArrange')}
              aria-label={t('autoArrange')}
            >
              <FontAwesomeIcon icon={icons.sitemap} />
            </button>
          </>
        )}
        <button
          type="button"
          onClick={fit}
          className={toolButton(false)}
          title={t('recenter')}
          aria-label={t('recenter')}
        >
          <FontAwesomeIcon icon={icons.expand} />
        </button>
      </div>

      {/* Bulk action bar */}
      {selectedIds.size > 0 && (
        <div
          onPointerDown={(event) => event.stopPropagation()}
          className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 items-center gap-3 rounded-full bg-white/95 px-4 py-2 text-sm shadow-lg ring-1 ring-stone-200 backdrop-blur dark:bg-stone-800/95 dark:ring-stone-700"
        >
          <span className="font-medium text-stone-700 dark:text-stone-200">
            {selectedIds.size} {t('selectedCount')}
          </span>
          <button
            type="button"
            onClick={() => setSelectedIds(new Set())}
            className="text-stone-500 transition hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-100"
          >
            {t('deselect')}
          </button>
          {isAdmin && (
            <button
              type="button"
              disabled={removing}
              onClick={removeSelected}
              className="font-medium text-red-600 transition hover:text-red-700 disabled:opacity-50 dark:text-red-400"
            >
              <FontAwesomeIcon icon={icons.trash} className="mr-1" />
              {t('removeSelected')}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
