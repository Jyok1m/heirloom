// Generational layout of a family graph for the 3D scene.
// Generations flow top (ancestors) to bottom (descendants).

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

export interface PersonNode {
  person: TreePerson;
  position: [number, number, number];
}

export interface UnionPoint {
  union: TreeUnion;
  position: [number, number, number];
}

export interface TreeLayout {
  nodes: PersonNode[];
  unions: UnionPoint[];
  bounds: { width: number; height: number };
}

const SPACING_X = 3.4;
const SPACING_Y = 3.1;

export function layoutTree(
  persons: TreePerson[],
  unions: TreeUnion[],
): TreeLayout {
  const generation = new Map<string, number>(
    persons.map((person) => [person.id, 0]),
  );

  // Fixed-point iteration: partners share a generation, children sit below
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

  // Order each generation so that partners end up adjacent
  const byGeneration = new Map<number, TreePerson[]>();
  for (const person of persons) {
    const gen = generation.get(person.id) ?? 0;
    byGeneration.set(gen, [...(byGeneration.get(gen) ?? []), person]);
  }

  const orderedByGen = new Map<number, TreePerson[]>();
  for (const [gen, members] of byGeneration) {
    const placed = new Set<string>();
    const ordered: TreePerson[] = [];
    const byId = new Map(members.map((p) => [p.id, p]));
    for (const union of unions) {
      const here = union.partnerIds.filter((id) => byId.has(id));
      for (const id of here) {
        if (!placed.has(id)) {
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

  const maxGen = Math.max(0, ...orderedByGen.keys());
  const maxCount = Math.max(1, ...[...orderedByGen.values()].map((g) => g.length));

  const positions = new Map<string, [number, number, number]>();
  const nodes: PersonNode[] = [];
  for (const [gen, members] of orderedByGen) {
    members.forEach((person, index) => {
      const position: [number, number, number] = [
        (index - (members.length - 1) / 2) * SPACING_X,
        ((maxGen === 0 ? 0 : maxGen / 2) - gen) * SPACING_Y,
        // Slight depth alternation gives the scene some parallax
        (index % 2 === 0 ? 1 : -1) * 0.25,
      ];
      positions.set(person.id, position);
      nodes.push({ person, position });
    });
  }

  const unionPoints: UnionPoint[] = unions.map((union) => {
    const partnerPositions = union.partnerIds
      .map((id) => positions.get(id))
      .filter((p): p is [number, number, number] => p !== undefined);
    const fallback: [number, number, number] = [0, 0, 0];
    if (partnerPositions.length === 0) {
      return { union, position: fallback };
    }
    const x =
      partnerPositions.reduce((sum, p) => sum + p[0], 0) /
      partnerPositions.length;
    const y = partnerPositions[0][1] - 0.15;
    return { union, position: [x, y, 0.1] };
  });

  return {
    nodes,
    unions: unionPoints,
    bounds: {
      width: maxCount * SPACING_X,
      height: (maxGen + 1) * SPACING_Y,
    },
  };
}
