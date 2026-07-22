// 2D generational layout of a family graph, in pixel coordinates.
// Ancestors sit at the top, descendants flow downward. Manual position
// overrides (from drag & drop) replace the auto-computed placement.

export interface TreePerson {
  id: string;
  firstName: string | null;
  usualName?: string | null;
  lastName: string | null;
  usedName?: string | null;
  sex: 'MALE' | 'FEMALE' | 'OTHER' | 'UNKNOWN';
  // Card extras (optional so callers can omit them)
  photoMediaId?: string | null;
  birthDate?: string | null;
  deceased?: boolean | null;
  religion?: 'CATHOLIC' | 'JEWISH' | 'MUSLIM' | 'NEUTRAL' | null;
}

export interface TreeUnion {
  id: string;
  partnerIds: string[];
  childIds: string[];
}

export interface PersonBox {
  person: TreePerson;
  x: number; // top-left
  y: number;
  w: number;
  h: number;
}

export interface UnionPoint {
  union: TreeUnion;
  x: number; // center
  y: number;
}

export interface Bounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export interface TreeLayout {
  boxes: PersonBox[];
  unions: UnionPoint[];
  width: number;
  height: number;
  bounds: Bounds;
}

export type PositionOverrides = Map<string, { x: number; y: number }>;

export const CARD_W = 196;
export const CARD_H = 78;
export const GAP_X = 36;
export const GEN_GAP = 116;
const PAD = 80;

// Order one generation left-to-right. Partners/remarriage stay adjacent as a
// chain (A – P – B), and the chains are then sorted by `keyOf` — a barycenter of
// each group's parent positions in the generation above — so a family's
// descendants stay under it and parent→child links stop crossing.
function orderGeneration(
  members: TreePerson[],
  unions: TreeUnion[],
  keyOf: (id: string) => number,
): TreePerson[] {
  const ids = new Set(members.map((m) => m.id));
  const byId = new Map(members.map((m) => [m.id, m]));
  const partners = new Map<string, Set<string>>();
  const add = (a: string, b: string) => {
    if (!partners.has(a)) partners.set(a, new Set());
    partners.get(a)!.add(b);
  };
  for (const union of unions) {
    const here = union.partnerIds.filter((id) => ids.has(id));
    for (const a of here) for (const b of here) if (a !== b) add(a, b);
  }
  const degree = (id: string) => partners.get(id)?.size ?? 0;

  const norm = (id: string) => {
    const k = keyOf(id);
    return Number.isNaN(k) ? Number.POSITIVE_INFINITY : k;
  };

  // Build one partner-chain starting from `start`, always stepping to the
  // remaining partner with the lowest key so the chain reads left-to-right.
  const visited = new Set<string>();
  const chainFrom = (start: string): TreePerson[] => {
    const chain: TreePerson[] = [];
    let cur: string | undefined = start;
    while (cur && !visited.has(cur)) {
      visited.add(cur);
      chain.push(byId.get(cur)!);
      cur = [...(partners.get(cur) ?? [])]
        .filter((p) => !visited.has(p))
        .sort((a, b) => norm(a) - norm(b) || degree(a) - degree(b))[0];
    }
    return chain;
  };

  // A group sits at the mean key of its keyed members (married-in members have
  // no parents → no key, and don't drag the group off its blood-relatives).
  const groupKey = (group: TreePerson[]): number => {
    const ks = group.map((p) => keyOf(p.id)).filter((k) => !Number.isNaN(k));
    if (!ks.length) return Number.POSITIVE_INFINITY;
    return ks.reduce((s, k) => s + k, 0) / ks.length;
  };

  // Seed chains from the lowest-DEGREE endpoints first (leaves before hubs), so
  // a person with several spouses keeps ALL of them adjacent — starting on the
  // hub would capture only one wing and orphan the other spouse. Lower key
  // breaks ties so chains read left→right.
  const seeds = [...members].sort(
    (a, b) => degree(a.id) - degree(b.id) || norm(a.id) - norm(b.id),
  );
  const groups: TreePerson[][] = [];
  for (const m of seeds) {
    if (!visited.has(m.id)) groups.push(chainFrom(m.id));
  }
  // Place groups left→right by the barycenter of their parents above.
  groups.sort((g1, g2) => groupKey(g1) - groupKey(g2));
  return groups.flat();
}

export function layoutTree(
  persons: TreePerson[],
  unions: TreeUnion[],
  overrides: PositionOverrides = new Map(),
): TreeLayout {
  // Persons that appear as a child of some union have ancestry in the tree.
  const hasParents = new Set<string>();
  const parentsOf = new Map<string, string[]>();
  for (const union of unions) {
    for (const childId of union.childIds) {
      hasParents.add(childId);
      const list = parentsOf.get(childId) ?? [];
      list.push(...union.partnerIds);
      parentsOf.set(childId, list);
    }
  }

  const generation = new Map<string, number>(
    persons.map((person) => [person.id, 0]),
  );

  // Generation = ancestry depth: a child sits one row below its parents, so
  // siblings — children of the same union — ALWAYS share a generation. A person
  // who has parents is never moved by marriage (their sibling row stays intact);
  // only married-in partners (no parents of their own) are pulled onto their
  // spouse's row. Both rules only ever push a row down, so this converges.
  for (let i = 0; i <= persons.length + 1; i++) {
    let changed = false;
    // Children one row below their parents.
    for (const person of persons) {
      const parents = parentsOf.get(person.id);
      if (!parents || parents.length === 0) continue;
      const g = Math.max(...parents.map((id) => generation.get(id) ?? 0)) + 1;
      if ((generation.get(person.id) ?? 0) < g) {
        generation.set(person.id, g);
        changed = true;
      }
    }
    // Align married-in partners (only) onto the couple's row.
    for (const union of unions) {
      const g = Math.max(
        0,
        ...union.partnerIds.map((id) => generation.get(id) ?? 0),
      );
      for (const id of union.partnerIds) {
        if (!hasParents.has(id) && (generation.get(id) ?? 0) < g) {
          generation.set(id, g);
          changed = true;
        }
      }
    }
    if (!changed) break;
  }

  const byGeneration = new Map<number, TreePerson[]>();
  for (const person of persons) {
    const gen = generation.get(person.id) ?? 0;
    byGeneration.set(gen, [...(byGeneration.get(gen) ?? []), person]);
  }

  // Order generations top-down: each generation is sorted by the barycenter of
  // its parents' positions in the generation just placed above it, so children
  // line up under their parents and family branches don't cross.
  const orderedByGen = new Map<number, TreePerson[]>();
  const indexInGen = new Map<string, number>();
  const sortedGens = [...byGeneration.keys()].sort((a, b) => a - b);
  for (const gen of sortedGens) {
    const members = byGeneration.get(gen) ?? [];
    const keyOf =
      gen === sortedGens[0]
        ? (id: string) => persons.findIndex((p) => p.id === id)
        : (id: string) => {
            const placed = (parentsOf.get(id) ?? []).filter((pid) =>
              indexInGen.has(pid),
            );
            if (!placed.length) return Number.NaN;
            return (
              placed.reduce((s, pid) => s + (indexInGen.get(pid) ?? 0), 0) /
              placed.length
            );
          };
    const ordered = orderGeneration(members, unions, keyOf);
    orderedByGen.set(gen, ordered);
    ordered.forEach((p, i) => indexInGen.set(p.id, i));
  }

  const rowWidth = (count: number) => count * CARD_W + (count - 1) * GAP_X;
  const maxRowWidth = Math.max(
    CARD_W,
    ...[...orderedByGen.values()].map((g) => rowWidth(g.length)),
  );

  // Auto placement, then apply manual overrides on top
  const boxes: PersonBox[] = [];
  for (const [gen, members] of orderedByGen) {
    const width = rowWidth(members.length);
    const startX = PAD + (maxRowWidth - width) / 2;
    const autoY = PAD + gen * (CARD_H + GEN_GAP);
    members.forEach((person, index) => {
      const override = overrides.get(person.id);
      boxes.push({
        person,
        x: override?.x ?? startX + index * (CARD_W + GAP_X),
        y: override?.y ?? autoY,
        w: CARD_W,
        h: CARD_H,
      });
    });
  }

  const centers = new Map(
    boxes.map((b) => [b.person.id, { cx: b.x + b.w / 2, cy: b.y + b.h / 2 }]),
  );

  const unionPoints: UnionPoint[] = unions.map((union) => {
    const partnerCenters = union.partnerIds
      .map((id) => centers.get(id))
      .filter((c): c is { cx: number; cy: number } => c !== undefined);
    if (partnerCenters.length === 0) {
      const childCenters = union.childIds
        .map((id) => centers.get(id))
        .filter((c): c is { cx: number; cy: number } => c !== undefined);
      if (childCenters.length === 0) return { union, x: 0, y: 0 };
      const cx =
        childCenters.reduce((s, c) => s + c.cx, 0) / childCenters.length;
      const cy = Math.min(...childCenters.map((c) => c.cy)) - CARD_H;
      return { union, x: cx, y: cy };
    }
    const cx =
      partnerCenters.reduce((s, c) => s + c.cx, 0) / partnerCenters.length;
    const cy =
      partnerCenters.reduce((s, c) => s + c.cy, 0) / partnerCenters.length;
    return { union, x: cx, y: cy };
  });

  const bounds: Bounds =
    boxes.length === 0
      ? { minX: 0, minY: 0, maxX: PAD * 2, maxY: PAD * 2 }
      : {
          minX: Math.min(...boxes.map((b) => b.x)) - PAD,
          minY: Math.min(...boxes.map((b) => b.y)) - PAD,
          maxX: Math.max(...boxes.map((b) => b.x + b.w)) + PAD,
          maxY: Math.max(...boxes.map((b) => b.y + b.h)) + PAD,
        };

  return {
    boxes,
    unions: unionPoints,
    width: bounds.maxX,
    height: bounds.maxY,
    bounds,
  };
}
