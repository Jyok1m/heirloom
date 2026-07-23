import type { Lang } from './i18n';

// Enum value lists and their bilingual labels, mirroring the Prisma schema.

export const SEXES = ['MALE', 'FEMALE', 'NON_BINARY'] as const;

// Datalist suggestions (free text is still allowed) — GEDCOM NPFX / NSFX
export const NAME_PREFIXES = [
  'M.', 'Mme', 'Mlle', 'Dr', 'Pr', 'Me', 'Mgr', 'R.P.', 'Sœur', 'Cdt', 'Col.', 'Gén.',
] as const;
export const NAME_SUFFIXES = [
  'Jr', 'Sr', 'père', 'fils', 'aîné', 'cadet', 'II', 'III', 'IV',
] as const;

// firstName holds comma-separated given names; the first one is the everyday
// name shown on cards.
export interface DisplayNameParts {
  firstName?: string | null;
  lastName?: string | null;
}
const firstGiven = (firstName?: string | null) =>
  (firstName ?? '').split(',')[0].trim();

export function displayName(p?: DisplayNameParts): string {
  return [firstGiven(p?.firstName), p?.lastName ?? '']
    .filter(Boolean)
    .join(' ');
}
export function displayInitials(p?: DisplayNameParts): string {
  const given = firstGiven(p?.firstName);
  const family = p?.lastName ?? '';
  return ((given[0] ?? '') + (family[0] ?? '')).toUpperCase() || '·';
}

// -------------------------------------------------------------- partner guards

export interface GraphUnion {
  partnerIds: string[];
  childIds: string[];
}

// Blood relatives barred from becoming a person's partner (incest guard):
// every ancestor, every descendant, and full/half siblings.
export function bloodRelatives(
  personId: string,
  unions: GraphUnion[],
): Set<string> {
  const parentsOf = new Map<string, string[]>();
  const childrenOf = new Map<string, string[]>();
  for (const union of unions) {
    for (const childId of union.childIds) {
      parentsOf.set(childId, [
        ...(parentsOf.get(childId) ?? []),
        ...union.partnerIds,
      ]);
      for (const parentId of union.partnerIds) {
        childrenOf.set(parentId, [
          ...(childrenOf.get(parentId) ?? []),
          childId,
        ]);
      }
    }
  }

  const result = new Set<string>();
  const walk = (start: string, next: Map<string, string[]>) => {
    const stack = [start];
    while (stack.length) {
      const current = stack.pop() as string;
      for (const id of next.get(current) ?? []) {
        if (!result.has(id)) {
          result.add(id);
          stack.push(id);
        }
      }
    }
  };
  walk(personId, parentsOf); // ancestors
  walk(personId, childrenOf); // descendants
  for (const union of unions) {
    if (union.childIds.includes(personId)) {
      for (const sibling of union.childIds) result.add(sibling);
    }
  }
  result.delete(personId);
  return result;
}

// People already in a couple (a partner in a two-person union): excluded from
// the "add partner" list to keep the tree unambiguous.
export function coupledPeople(unions: GraphUnion[]): Set<string> {
  const coupled = new Set<string>();
  for (const union of unions) {
    if (union.partnerIds.length >= 2) {
      for (const id of union.partnerIds) coupled.add(id);
    }
  }
  return coupled;
}
export const RELIGIONS = ['CATHOLIC', 'JEWISH', 'MUSLIM', 'NEUTRAL'] as const;
export const UNION_TYPES = [
  'MARRIAGE',
  'CIVIL_UNION',
  'PARTNERSHIP',
  'UNKNOWN',
] as const;
export const PEDIGREES = ['BIRTH', 'ADOPTED', 'FOSTER', 'UNKNOWN'] as const;
export const MEDIA_TYPES = ['IMAGE', 'DOCUMENT', 'AUDIO', 'VIDEO'] as const;

// Simplified life-event set. Person: birth / death. Union: getting together /
// marriage / separation. (The backend enforces the person-vs-union split.)
export const PERSON_EVENT_TYPES = ['BIRTH', 'DEATH'] as const;
export const UNION_EVENT_TYPES = ['ENGAGEMENT', 'MARRIAGE', 'DIVORCE'] as const;

type Labels = Record<string, { en: string; fr: string }>;

const SEX: Labels = {
  MALE: { en: 'Male', fr: 'Homme' },
  FEMALE: { en: 'Female', fr: 'Femme' },
  NON_BINARY: { en: 'Non-binary', fr: 'Non-binaire' },
};

const RELIGION: Labels = {
  CATHOLIC: { en: 'Catholic', fr: 'Catholique' },
  JEWISH: { en: 'Jewish', fr: 'Juive' },
  MUSLIM: { en: 'Muslim', fr: 'Musulmane' },
  NEUTRAL: { en: 'None / neutral', fr: 'Neutre' },
};

const UNION_TYPE: Labels = {
  MARRIAGE: { en: 'Marriage', fr: 'Mariage' },
  CIVIL_UNION: { en: 'Civil union', fr: 'Union civile' },
  PARTNERSHIP: { en: 'Partnership', fr: 'Partenariat' },
  UNKNOWN: { en: 'Unknown', fr: 'Inconnu' },
};

const PEDIGREE: Labels = {
  BIRTH: { en: 'Biological', fr: 'Biologique' },
  ADOPTED: { en: 'Adopted', fr: 'Adopté·e' },
  FOSTER: { en: 'Foster', fr: 'Accueilli·e' },
  UNKNOWN: { en: 'Unknown', fr: 'Inconnu' },
};

const MEDIA_TYPE: Labels = {
  IMAGE: { en: 'Image', fr: 'Image' },
  DOCUMENT: { en: 'Document', fr: 'Document' },
  AUDIO: { en: 'Audio', fr: 'Audio' },
  VIDEO: { en: 'Video', fr: 'Vidéo' },
};

const EVENT_TYPE: Labels = {
  BIRTH: { en: 'Birth', fr: 'Naissance' },
  BAPTISM: { en: 'Baptism', fr: 'Baptême' },
  DEATH: { en: 'Death', fr: 'Décès' },
  BURIAL: { en: 'Burial', fr: 'Inhumation' },
  CREMATION: { en: 'Cremation', fr: 'Crémation' },
  OCCUPATION: { en: 'Occupation', fr: 'Profession' },
  RESIDENCE: { en: 'Residence', fr: 'Résidence' },
  EDUCATION: { en: 'Education', fr: 'Éducation' },
  EMIGRATION: { en: 'Emigration', fr: 'Émigration' },
  IMMIGRATION: { en: 'Immigration', fr: 'Immigration' },
  NATURALIZATION: { en: 'Naturalization', fr: 'Naturalisation' },
  MARRIAGE: { en: 'Marriage', fr: 'Mariage' },
  MARRIAGE_BANNS: { en: 'Marriage banns', fr: 'Bans de mariage' },
  ENGAGEMENT: { en: 'Getting together', fr: 'Mise en couple' },
  DIVORCE: { en: 'Separation', fr: 'Séparation' },
  ANNULMENT: { en: 'Annulment', fr: 'Annulation' },
  OTHER: { en: 'Other', fr: 'Autre' },
};

const GROUPS = {
  sex: SEX,
  religion: RELIGION,
  unionType: UNION_TYPE,
  pedigree: PEDIGREE,
  mediaType: MEDIA_TYPE,
  eventType: EVENT_TYPE,
} as const;

export function enumLabel(
  group: keyof typeof GROUPS,
  value: string,
  lang: Lang,
): string {
  return GROUPS[group][value]?.[lang] ?? value;
}

// ------------------------------------------------------------------- GEDCOM dates

const GEDCOM_MONTHS = [
  'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
  'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC',
] as const;

// 'YYYY-MM-DD' (from a calendar picker) -> GEDCOM date 'DD MON YYYY'.
// Built from the string parts so no timezone shift can move the day.
export function isoToGedcom(iso: string): string | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return null;
  const [, year, month, day] = match;
  const monthName = GEDCOM_MONTHS[Number(month) - 1];
  if (!monthName) return null;
  return `${Number(day)} ${monthName} ${year}`;
}

// Best-effort sortable date from a GEDCOM value: pull the first 4-digit year so
// approximate dates ('ABT 1850') still order roughly right. Returns an ISO date.
export function gedcomToSortIso(value: string): string | null {
  const year = /\b(\d{4})\b/.exec(value)?.[1];
  return year ? `${year}-01-01T00:00:00.000Z` : null;
}

