// 2D generational layout of a family graph, in pixel coordinates.
// Ancestors sit at the top, descendants flow downward. Manual position
// overrides (from drag & drop) replace the auto-computed placement.

export interface TreePerson {
  id: string;
  firstName: string | null;
  lastName: string | null;
  sex: 'MALE' | 'FEMALE' | 'OTHER' | 'UNKNOWN';
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

export const CARD_W = 178;
export const CARD_H = 68;
export const GAP_X = 36;
export const GEN_GAP = 116;
const PAD = 80;

// Order a generation so partners sit next to each other, building spouse
// chains: a remarried person ends up between both spouses (A – P – B).
function orderGeneration(
  members: TreePerson[],
  unions: TreeUnion[],
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

  const visited = new Set<string>();
  const ordered: TreePerson[] = [];
  const visit = (id: string) => {
    if (visited.has(id)) return;
    visited.add(id);
    ordered.push(byId.get(id)!);
    // Walk toward the far end of the chain first (lowest-degree partner)
    const next = [...(partners.get(id) ?? [])].sort(
      (a, b) => degree(a) - degree(b),
    );
    for (const p of next) visit(p);
  };

  // Start chains from leaves (degree 1) so couples read left-to-right,
  // then higher-degree hubs, and finally the unattached singles.
  const starts = [...members].sort((a, b) => {
    const single = (id: string) => (degree(id) === 0 ? 1 : 0);
    const sa = single(a.id);
    const sb = single(b.id);
    if (sa !== sb) return sa - sb;
    return degree(a.id) - degree(b.id);
  });
  for (const m of starts) visit(m.id);
  return ordered;
}

export function layoutTree(
  persons: TreePerson[],
  unions: TreeUnion[],
  overrides: PositionOverrides = new Map(),
): TreeLayout {
  const generation = new Map<string, number>(
    persons.map((person) => [person.id, 0]),
  );

  // Fixed-point: partners share a generation, children sit one below
  for (let i = 0; i <= persons.length + 1; i++) {
    let changed = false;
    for (const union of unions) {
      const partnerGen = Math.max(
        0,
        ...union.partnerIds.map((id) => generation.get(id) ?? 0),
      );
      for (const id of union.partnerIds) {
        if (generation.get(id) !== partnerGen) {
          generation.set(id, partnerGen);
          changed = true;
        }
      }
      for (const id of union.childIds) {
        if ((generation.get(id) ?? 0) < partnerGen + 1) {
          generation.set(id, partnerGen + 1);
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

  const orderedByGen = new Map<number, TreePerson[]>();
  for (const [gen, members] of byGeneration) {
    orderedByGen.set(gen, orderGeneration(members, unions));
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
