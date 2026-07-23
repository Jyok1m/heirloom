import { useMemo } from 'react';
import { displayInitials, displayName } from '../../lib/genealogy';
import type { TreePerson, TreeUnion } from './layout';

// Radial ancestor ("fan") chart: the focus person at the centre, each ring a
// generation of ancestors (father's line on the left, mother's on the right).

const R0 = 52; // focus half-disc radius
const RING = 60; // width of each generation ring
const MAX_GEN = 5; // rings drawn (deeper ancestors are omitted)
const PAD = 16;

const ACCENT: Record<string, string> = {
  MALE: '#5f8a8f',
  FEMALE: '#c0714a',
  OTHER: '#8a7aa8',
  UNKNOWN: '#a8a29e',
};

const point = (cx: number, cy: number, r: number, a: number): [number, number] => [
  cx + r * Math.cos(a),
  cy + r * Math.sin(a),
];

function sectorPath(
  cx: number,
  cy: number,
  rInner: number,
  rOuter: number,
  a0: number,
  a1: number,
): string {
  const [x0o, y0o] = point(cx, cy, rOuter, a0);
  const [x1o, y1o] = point(cx, cy, rOuter, a1);
  const [x1i, y1i] = point(cx, cy, rInner, a1);
  const [x0i, y0i] = point(cx, cy, rInner, a0);
  const large = a1 - a0 > Math.PI ? 1 : 0;
  if (rInner <= 0) {
    return `M ${x0o} ${y0o} A ${rOuter} ${rOuter} 0 ${large} 1 ${x1o} ${y1o} L ${cx} ${cy} Z`;
  }
  return `M ${x0o} ${y0o} A ${rOuter} ${rOuter} 0 ${large} 1 ${x1o} ${y1o} L ${x1i} ${y1i} A ${rInner} ${rInner} 0 ${large} 0 ${x0i} ${y0i} Z`;
}

export function FanChart({
  persons,
  unions,
  focusId,
  onFocus,
  mediaUrl = (id) => `/api/media/${id}/file`,
}: {
  persons: TreePerson[];
  unions: TreeUnion[];
  focusId: string;
  onFocus: (id: string) => void;
  mediaUrl?: (mediaId: string) => string;
}) {
  const byId = useMemo(
    () => new Map(persons.map((p) => [p.id, p])),
    [persons],
  );
  const parentUnion = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const union of unions)
      for (const child of union.childIds)
        if (!map.has(child)) map.set(child, union.partnerIds);
    return map;
  }, [unions]);

  // Generation rows: gens[g] has 2^g cells (father, mother order), null if empty.
  const gens = useMemo(() => {
    const split = (id: string): [TreePerson | null, TreePerson | null] => {
      const ps = (parentUnion.get(id) ?? [])
        .map((pid) => byId.get(pid))
        .filter((p): p is TreePerson => Boolean(p));
      const father = ps.find((p) => p.sex === 'MALE') ?? ps[0] ?? null;
      const mother = ps.find((p) => p !== father) ?? null;
      return [father, mother];
    };
    const rows: (TreePerson | null)[][] = [[byId.get(focusId) ?? null]];
    for (let g = 1; g <= MAX_GEN; g++) {
      const row: (TreePerson | null)[] = [];
      for (const cell of rows[g - 1]) {
        if (!cell) row.push(null, null);
        else {
          const [f, m] = split(cell.id);
          row.push(f, m);
        }
      }
      rows.push(row);
    }
    return rows;
  }, [byId, parentUnion, focusId]);

  const R = R0 + MAX_GEN * RING;
  const cx = R + PAD;
  const cy = R + PAD;
  const width = 2 * R + 2 * PAD;
  const height = R + R0 + 2 * PAD;

  const focus = gens[0][0];

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="h-full w-full"
      preserveAspectRatio="xMidYMid meet"
    >
      {/* Ancestor rings */}
      {gens.slice(1).map((row, gi) => {
        const g = gi + 1;
        const rInner = R0 + (g - 1) * RING;
        const rOuter = R0 + g * RING;
        const step = Math.PI / row.length;
        return row.map((cell, k) => {
          const a0 = Math.PI + k * step;
          const a1 = a0 + step;
          const mid = (a0 + a1) / 2;
          const accent = ACCENT[cell?.sex ?? 'UNKNOWN'];
          const [tx, ty] = point(cx, cy, (rInner + rOuter) / 2, mid);
          let deg = (mid * 180) / Math.PI;
          if (deg > 90 && deg < 270) deg += 180;
          const label = cell
            ? g >= 4
              ? displayInitials(cell)
              : displayName(cell).split(' ')[0] || displayInitials(cell)
            : '';
          return (
            <g key={`${g}-${k}`}>
              <path
                d={sectorPath(cx, cy, rInner, rOuter, a0, a1)}
                fill={cell ? accent : 'transparent'}
                fillOpacity={cell ? 0.16 : 0}
                className="stroke-white dark:stroke-stone-900"
                strokeWidth={2}
                style={cell ? { cursor: 'pointer' } : undefined}
                onClick={cell ? () => onFocus(cell.id) : undefined}
              />
              {label && (
                <text
                  x={tx}
                  y={ty}
                  transform={`rotate(${deg} ${tx} ${ty})`}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="pointer-events-none select-none fill-stone-700 dark:fill-stone-200"
                  style={{ fontSize: g >= 4 ? 10 : 12, fontWeight: 600 }}
                >
                  {label.length > 12 ? `${label.slice(0, 11)}…` : label}
                </text>
              )}
            </g>
          );
        });
      })}

      {/* Focus half-disc */}
      <path
        d={sectorPath(cx, cy, 0, R0, Math.PI, 2 * Math.PI)}
        fill={ACCENT[focus?.sex ?? 'UNKNOWN']}
        fillOpacity={0.22}
        className="stroke-white dark:stroke-stone-900"
        strokeWidth={2}
      />
      {focus?.photoMediaId ? (
        <>
          <clipPath id="fan-focus-clip">
            <circle cx={cx} cy={cy - R0 / 2} r={R0 / 2.4} />
          </clipPath>
          <image
            href={mediaUrl(focus.photoMediaId)}
            x={cx - R0 / 2.4}
            y={cy - R0 / 2 - R0 / 2.4}
            width={(R0 / 2.4) * 2}
            height={(R0 / 2.4) * 2}
            clipPath="url(#fan-focus-clip)"
            preserveAspectRatio="xMidYMid slice"
          />
        </>
      ) : (
        <text
          x={cx}
          y={cy - R0 / 2}
          textAnchor="middle"
          dominantBaseline="middle"
          className="fill-stone-800 dark:fill-stone-100"
          style={{ fontSize: 13, fontWeight: 700 }}
        >
          {focus ? displayName(focus).split(' ')[0] : '—'}
        </text>
      )}
    </svg>
  );
}
