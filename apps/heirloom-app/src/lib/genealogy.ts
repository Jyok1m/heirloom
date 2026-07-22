import type { Lang } from './i18n';

// Enum value lists and their bilingual labels, mirroring the Prisma schema.

export const SEXES = ['MALE', 'FEMALE', 'OTHER', 'UNKNOWN'] as const;
export const UNION_TYPES = [
  'MARRIAGE',
  'CIVIL_UNION',
  'PARTNERSHIP',
  'UNKNOWN',
] as const;
export const PEDIGREES = ['BIRTH', 'ADOPTED', 'FOSTER', 'UNKNOWN'] as const;
export const MEDIA_TYPES = ['IMAGE', 'DOCUMENT', 'AUDIO', 'VIDEO'] as const;

// Events attached to a person vs to a union (backend enforces the match)
export const PERSON_EVENT_TYPES = [
  'BIRTH',
  'BAPTISM',
  'DEATH',
  'BURIAL',
  'CREMATION',
  'OCCUPATION',
  'RESIDENCE',
  'EDUCATION',
  'EMIGRATION',
  'IMMIGRATION',
  'NATURALIZATION',
  'OTHER',
] as const;
export const UNION_EVENT_TYPES = [
  'MARRIAGE',
  'MARRIAGE_BANNS',
  'ENGAGEMENT',
  'DIVORCE',
  'ANNULMENT',
  'OTHER',
] as const;

type Labels = Record<string, { en: string; fr: string }>;

const SEX: Labels = {
  MALE: { en: 'Male', fr: 'Homme' },
  FEMALE: { en: 'Female', fr: 'Femme' },
  OTHER: { en: 'Other', fr: 'Autre' },
  UNKNOWN: { en: 'Unknown', fr: 'Inconnu' },
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
  ENGAGEMENT: { en: 'Engagement', fr: 'Fiançailles' },
  DIVORCE: { en: 'Divorce', fr: 'Divorce' },
  ANNULMENT: { en: 'Annulment', fr: 'Annulation' },
  OTHER: { en: 'Other', fr: 'Autre' },
};

const GROUPS = {
  sex: SEX,
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

