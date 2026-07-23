import type { Lang } from './i18n';

// Kinship of another person relative to the viewer ("moi"), derived from the
// blood graph (parents/children) plus partners for spouses and in-laws.

export interface KinPerson {
  id: string;
  sex?: string | null;
}
export interface KinUnion {
  partnerIds: string[];
  childIds: string[];
}

export type Kinship =
  | { kind: 'self' }
  | { kind: 'spouse' }
  | { kind: 'ancestor'; gen: number } // 1 = parent, 2 = grandparent…
  | { kind: 'descendant'; gen: number } // 1 = child, 2 = grandchild…
  | { kind: 'sibling'; half: boolean }
  | { kind: 'pibling'; gen: number } // 2 = aunt/uncle, 3 = great-…
  | { kind: 'nibling'; gen: number } // 2 = niece/nephew, 3 = grand-…
  | { kind: 'cousin'; degree: number; removed: number }
  | { kind: 'parent-in-law' }
  | { kind: 'child-in-law' }
  | { kind: 'sibling-in-law' };

export function computeKinships(
  selfId: string,
  persons: KinPerson[],
  unions: KinUnion[],
): Map<string, Kinship> {
  const parents = new Map<string, Set<string>>();
  const children = new Map<string, Set<string>>();
  const partners = new Map<string, Set<string>>();
  const link = (m: Map<string, Set<string>>, a: string, b: string) => {
    const set = m.get(a) ?? new Set<string>();
    set.add(b);
    m.set(a, set);
  };
  for (const union of unions) {
    for (const p of union.partnerIds)
      for (const q of union.partnerIds) if (p !== q) link(partners, p, q);
    for (const child of union.childIds)
      for (const parent of union.partnerIds) {
        link(parents, child, parent);
        link(children, parent, child);
      }
  }

  // BFS: every ancestor of `start` with its (minimum) generation distance.
  const ancestorDist = (start: string): Map<string, number> => {
    const dist = new Map<string, number>([[start, 0]]);
    const queue = [start];
    while (queue.length) {
      const cur = queue.shift() as string;
      const d = dist.get(cur) as number;
      for (const parent of parents.get(cur) ?? []) {
        if (!dist.has(parent)) {
          dist.set(parent, d + 1);
          queue.push(parent);
        }
      }
    }
    return dist;
  };

  const selfAnc = ancestorDist(selfId);
  const selfPartners = partners.get(selfId) ?? new Set<string>();
  const selfParents = parents.get(selfId) ?? new Set<string>();
  const siblingsOf = (id: string): Set<string> => {
    const out = new Set<string>();
    for (const parent of parents.get(id) ?? [])
      for (const child of children.get(parent) ?? [])
        if (child !== id) out.add(child);
    return out;
  };
  const selfSiblings = siblingsOf(selfId);

  const classify = (t: string): Kinship | null => {
    if (selfPartners.has(t)) return { kind: 'spouse' };

    // Nearest common ancestor: minimise (a + b), then the smaller removal.
    const tAnc = ancestorDist(t);
    let best: { a: number; b: number } | null = null;
    for (const [ancestor, a] of selfAnc) {
      const b = tAnc.get(ancestor);
      if (b === undefined) continue;
      if (
        !best ||
        a + b < best.a + best.b ||
        (a + b === best.a + best.b &&
          Math.abs(a - b) < Math.abs(best.a - best.b))
      )
        best = { a, b };
    }
    if (best) {
      const { a, b } = best;
      if (a === 0) return { kind: 'descendant', gen: b };
      if (b === 0) return { kind: 'ancestor', gen: a };
      if (a === 1 && b === 1) {
        const tParents = parents.get(t) ?? EMPTY;
        const shared = [...tParents].filter((p) => selfParents.has(p)).length;
        // Only claim half-sibling on positive evidence: both have two recorded
        // parents and exactly one differs. Missing parents read as full sibling.
        const half =
          tParents.size >= 2 && selfParents.size >= 2 && shared < 2;
        return { kind: 'sibling', half };
      }
      if (a === 1) return { kind: 'nibling', gen: b };
      if (b === 1) return { kind: 'pibling', gen: a };
      return {
        kind: 'cousin',
        degree: Math.min(a, b) - 1,
        removed: Math.abs(a - b),
      };
    }

    // Affinity (in-laws), only when there is no blood tie.
    for (const spouse of selfPartners)
      if ((parents.get(spouse) ?? EMPTY).has(t)) return { kind: 'parent-in-law' };
    for (const child of children.get(selfId) ?? [])
      if ((partners.get(child) ?? EMPTY).has(t)) return { kind: 'child-in-law' };
    for (const sib of selfSiblings)
      if ((partners.get(sib) ?? EMPTY).has(t))
        return { kind: 'sibling-in-law' };
    for (const spouse of selfPartners)
      if (siblingsOf(spouse).has(t)) return { kind: 'sibling-in-law' };

    return null;
  };

  const result = new Map<string, Kinship>();
  result.set(selfId, { kind: 'self' });
  for (const person of persons) {
    if (person.id === selfId) continue;
    const kin = classify(person.id);
    if (kin) result.set(person.id, kin);
  }
  return result;
}

const EMPTY: ReadonlySet<string> = new Set<string>();

const repeat = (word: string, n: number) => (n > 0 ? word.repeat(n) : '');
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

// Gender-aware, localised label for a kinship (compact enough for a card).
export function kinshipLabel(
  kin: Kinship,
  sex: string | null | undefined,
  lang: Lang,
): string {
  const g = (male: string, female: string, neutral: string) =>
    sex === 'MALE' ? male : sex === 'FEMALE' ? female : neutral;

  if (lang === 'fr') {
    switch (kin.kind) {
      case 'self':
        return 'Moi';
      case 'spouse':
        return g('Époux', 'Épouse', 'Conjoint·e');
      case 'ancestor':
        return kin.gen === 1
          ? g('Père', 'Mère', 'Parent')
          : cap(
              repeat('arrière-', kin.gen - 2) +
                g('grand-père', 'grand-mère', 'grand-parent'),
            );
      case 'descendant':
        return kin.gen === 1
          ? g('Fils', 'Fille', 'Enfant')
          : cap(
              repeat('arrière-', kin.gen - 2) +
                g('petit-fils', 'petite-fille', 'petit-enfant'),
            );
      case 'sibling':
        return cap(
          (kin.half ? 'demi-' : '') + g('frère', 'sœur', 'frère/sœur'),
        );
      case 'pibling':
        return kin.gen === 2
          ? g('Oncle', 'Tante', 'Oncle/Tante')
          : cap(
              repeat('arrière-', kin.gen - 3) +
                g('grand-oncle', 'grand-tante', 'grand-oncle/grand-tante'),
            );
      case 'nibling':
        return kin.gen === 2
          ? g('Neveu', 'Nièce', 'Neveu/Nièce')
          : cap(
              repeat('arrière-', kin.gen - 3) +
                g('petit-neveu', 'petite-nièce', 'petit-neveu/petite-nièce'),
            );
      case 'cousin':
        return kin.degree === 1 && kin.removed === 0
          ? g('Cousin germain', 'Cousine germaine', 'Cousin·e germain·e')
          : g('Cousin', 'Cousine', 'Cousin·e');
      case 'parent-in-law':
        return g('Beau-père', 'Belle-mère', 'Beau-parent');
      case 'child-in-law':
        return g('Gendre', 'Belle-fille', 'Bel·le enfant');
      case 'sibling-in-law':
        return g('Beau-frère', 'Belle-sœur', 'Beau-frère/Belle-sœur');
    }
  }

  switch (kin.kind) {
    case 'self':
      return 'Me';
    case 'spouse':
      return g('Husband', 'Wife', 'Spouse');
    case 'ancestor':
      return kin.gen === 1
        ? g('Father', 'Mother', 'Parent')
        : cap(repeat('great-', kin.gen - 2) + g('grandfather', 'grandmother', 'grandparent'));
    case 'descendant':
      return kin.gen === 1
        ? g('Son', 'Daughter', 'Child')
        : cap(repeat('great-', kin.gen - 2) + g('grandson', 'granddaughter', 'grandchild'));
    case 'sibling':
      return cap((kin.half ? 'half-' : '') + g('brother', 'sister', 'sibling'));
    case 'pibling':
      return kin.gen === 2
        ? g('Uncle', 'Aunt', 'Uncle/Aunt')
        : cap(repeat('great-', kin.gen - 2) + g('uncle', 'aunt', 'uncle/aunt'));
    case 'nibling':
      return kin.gen === 2
        ? g('Nephew', 'Niece', 'Nephew/Niece')
        : cap(repeat('great-', kin.gen - 2) + g('nephew', 'niece', 'nephew/niece'));
    case 'cousin':
      return kin.degree === 1 && kin.removed === 0 ? 'First cousin' : 'Cousin';
    case 'parent-in-law':
      return g('Father-in-law', 'Mother-in-law', 'Parent-in-law');
    case 'child-in-law':
      return g('Son-in-law', 'Daughter-in-law', 'Child-in-law');
    case 'sibling-in-law':
      return g('Brother-in-law', 'Sister-in-law', 'Sibling-in-law');
  }
}
