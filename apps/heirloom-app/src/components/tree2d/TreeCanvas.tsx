import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { icons } from '../../lib/icons';
import {
  CARD_H,
  CARD_W,
  layoutTree,
  type TreePerson,
  type TreeUnion,
} from './layout';

const SEX_ACCENT: Record<TreePerson['sex'], string> = {
  MALE: '#5f8a8f',
  FEMALE: '#c0714a',
  OTHER: '#8a7aa8',
  UNKNOWN: '#a8a29e',
};

function initials(person: TreePerson): string {
  const a = person.firstName?.[0] ?? '';
  const b = person.lastName?.[0] ?? '';
  return (a + b).toUpperCase() || '·';
}

function fullName(person: TreePerson): string {
  return [person.firstName, person.lastName].filter(Boolean).join(' ') || '—';
}

interface Transform {
  x: number;
  y: number;
  scale: number;
}

export function TreeCanvas({
  persons,
  unions,
  selectedId,
  selectedUnionId,
  onSelect,
  onSelectUnion,
}: {
  persons: TreePerson[];
  unions: TreeUnion[];
  selectedId: string | null;
  selectedUnionId: string | null;
  onSelect: (id: string | null) => void;
  onSelectUnion: (id: string) => void;
}) {
  const layout = useMemo(
    () => layoutTree(persons, unions),
    [persons, unions],
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
  const [transform, setTransform] = useState<Transform>({
    x: 0,
    y: 0,
    scale: 1,
  });
  const drag = useRef<{ x: number; y: number; ox: number; oy: number } | null>(
    null,
  );
  const [fitted, setFitted] = useState(false);

  // Fit the whole tree in view on first render / when it grows
  const fit = useCallback(() => {
    const el = viewportRef.current;
    if (!el || layout.width === 0) return;
    const scale = Math.min(
      1.1,
      (el.clientWidth - 40) / layout.width,
      (el.clientHeight - 40) / layout.height,
    );
    setTransform({
      scale,
      x: (el.clientWidth - layout.width * scale) / 2,
      y: (el.clientHeight - layout.height * scale) / 2,
    });
  }, [layout.width, layout.height]);

  useEffect(() => {
    if (!fitted && layout.boxes.length > 0) {
      fit();
      setFitted(true);
    }
  }, [fit, fitted, layout.boxes.length]);

  const onWheel = (event: React.WheelEvent) => {
    event.preventDefault();
    const el = viewportRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = event.clientX - rect.left;
    const py = event.clientY - rect.top;
    setTransform((t) => {
      const factor = event.deltaY < 0 ? 1.12 : 1 / 1.12;
      const scale = Math.min(2.4, Math.max(0.2, t.scale * factor));
      const k = scale / t.scale;
      return {
        scale,
        x: px - (px - t.x) * k,
        y: py - (py - t.y) * k,
      };
    });
  };

  const linePaths = useMemo(() => {
    const partnerLines: string[] = [];
    const childLines: string[] = [];
    for (const { union, x, y } of layout.unions) {
      const partnerPts = union.partnerIds
        .map((id) => centers.get(id))
        .filter((c): c is { cx: number; cy: number } => !!c);
      // link between partners (horizontal)
      if (partnerPts.length === 2) {
        partnerLines.push(
          `M ${partnerPts[0].cx} ${partnerPts[0].cy} L ${partnerPts[1].cx} ${partnerPts[1].cy}`,
        );
      }
      // links down to children (smooth vertical S-curve)
      const startY = y + CARD_H / 2;
      for (const childId of union.childIds) {
        const child = centers.get(childId);
        if (!child) continue;
        const endY = child.cy - CARD_H / 2;
        const midY = (startY + endY) / 2;
        childLines.push(
          `M ${x} ${startY} C ${x} ${midY}, ${child.cx} ${midY}, ${child.cx} ${endY}`,
        );
      }
    }
    return { partnerLines, childLines };
  }, [layout.unions, centers]);

  return (
    <div
      ref={viewportRef}
      className="relative h-full w-full cursor-grab touch-none overflow-hidden active:cursor-grabbing"
      onWheel={onWheel}
      onPointerDown={(event) => {
        drag.current = {
          x: event.clientX,
          y: event.clientY,
          ox: transform.x,
          oy: transform.y,
        };
        (event.target as HTMLElement).setPointerCapture?.(event.pointerId);
      }}
      onPointerMove={(event) => {
        if (!drag.current) return;
        setTransform((t) => ({
          ...t,
          x: drag.current!.ox + (event.clientX - drag.current!.x),
          y: drag.current!.oy + (event.clientY - drag.current!.y),
        }));
      }}
      onPointerUp={() => (drag.current = null)}
      onPointerLeave={() => (drag.current = null)}
      onClick={(event) => {
        if (event.target === event.currentTarget) onSelect(null);
      }}
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
          {linePaths.childLines.map((d, i) => (
            <path
              key={`c${i}`}
              d={d}
              fill="none"
              className="stroke-stone-300 dark:stroke-stone-600"
              strokeWidth={2}
            />
          ))}
          {linePaths.partnerLines.map((d, i) => (
            <path
              key={`p${i}`}
              d={d}
              fill="none"
              className="stroke-amber-400/70 dark:stroke-amber-600/60"
              strokeWidth={2.5}
            />
          ))}
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

        {/* Clickable union hit targets */}
        {layout.unions.map(({ union, x, y }) =>
          union.partnerIds.length >= 1 ? (
            <button
              type="button"
              key={union.id}
              aria-label="union"
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
          const selected = person.id === selectedId;
          return (
            <button
              type="button"
              key={person.id}
              onClick={(event) => {
                event.stopPropagation();
                onSelect(person.id);
              }}
              style={{ left: x, top: y, width: CARD_W, height: CARD_H }}
              className={`absolute flex items-center gap-3 rounded-2xl border bg-white px-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:bg-stone-800 ${
                selected
                  ? 'border-amber-500 ring-2 ring-amber-500/40'
                  : 'border-stone-200 dark:border-stone-700'
              }`}
            >
              <span
                className="grid size-9 shrink-0 place-items-center rounded-full text-xs font-semibold text-white"
                style={{ backgroundColor: SEX_ACCENT[person.sex] }}
              >
                {initials(person)}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-stone-800 dark:text-stone-100">
                  {fullName(person)}
                </span>
                <span className="block text-[11px] text-stone-400 dark:text-stone-500">
                  <FontAwesomeIcon
                    icon={
                      person.sex === 'MALE'
                        ? icons.male
                        : person.sex === 'FEMALE'
                          ? icons.female
                          : icons.genderless
                    }
                  />
                </span>
              </span>
            </button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={fit}
        className="absolute bottom-4 left-4 rounded-full bg-white/90 px-3 py-1.5 text-xs font-medium text-stone-600 shadow-sm ring-1 ring-stone-200 backdrop-blur transition hover:bg-white dark:bg-stone-800/90 dark:text-stone-300 dark:ring-stone-700"
      >
        ⤢ Recentrer
      </button>
    </div>
  );
}
