// 2D generational layout of a family graph, in pixel coordinates.
// Ancestors sit at the top, descendants flow downward.

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

export interface TreeLayout {
  boxes: PersonBox[];
  unions: UnionPoint[];
  width: number;
  height: number;
}

export const CARD_W = 178;
export const CARD_H = 68;
const GAP_X = 36;
const GEN_GAP = 116;
const PAD = 80;

export function layoutTree(
  persons: TreePerson[],
  unions: TreeUnion[],
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

  // Order each generation so partners are adjacent
  const orderedByGen = new Map<number, TreePerson[]>();
  for (const [gen, members] of byGeneration) {
    const placed = new Set<string>();
    const ordered: TreePerson[] = [];
    const byId = new Map(members.map((p) => [p.id, p]));
    for (const union of unions) {
      for (const id of union.partnerIds) {
        if (byId.has(id) && !placed.has(id)) {
          placed.add(id);
          ordered.push(byId.get(id)!);
        }
      }
    }
    for (const person of members) {
      if (!placed.has(person.id)) ordered.push(person);
    }
    orderedByGen.set(gen, ordered);
  }

  const rowWidth = (count: number) =>
    count * CARD_W + (count - 1) * GAP_X;
  const maxRowWidth = Math.max(
    CARD_W,
    ...[...orderedByGen.values()].map((g) => rowWidth(g.length)),
  );

  const centers = new Map<string, { cx: number; cy: number }>();
  const boxes: PersonBox[] = [];
  for (const [gen, members] of orderedByGen) {
    const width = rowWidth(members.length);
    const startX = PAD + (maxRowWidth - width) / 2;
    const y = PAD + gen * (CARD_H + GEN_GAP);
    members.forEach((person, index) => {
      const x = startX + index * (CARD_W + GAP_X);
      centers.set(person.id, { cx: x + CARD_W / 2, cy: y + CARD_H / 2 });
      boxes.push({ person, x, y, w: CARD_W, h: CARD_H });
    });
  }

  const unionPoints: UnionPoint[] = unions.map((union) => {
    const partnerCenters = union.partnerIds
      .map((id) => centers.get(id))
      .filter((c): c is { cx: number; cy: number } => c !== undefined);
    if (partnerCenters.length === 0) {
      // Orphan union: hover above its children
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
    // Union sits on the partners' row, between them
    return { union, x: cx, y: partnerCenters[0].cy };
  });

  const maxGen = Math.max(0, ...orderedByGen.keys());
  return {
    boxes,
    unions: unionPoints,
    width: maxRowWidth + PAD * 2,
    height: PAD * 2 + (maxGen + 1) * CARD_H + maxGen * GEN_GAP,
  };
}
