import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useMutation, useQuery } from '@apollo/client/react';
import { useRef, useState } from 'react';
import type { Sex } from '../../generated/graphql';
import {
  displayName,
  enumLabel,
  NAME_PREFIXES,
  NAME_SUFFIXES,
  SEXES,
} from '../../lib/genealogy';
import { icons } from '../../lib/icons';
import { useI18n, type TranslationKey } from '../../lib/i18n';
import { useNotify } from '../../lib/notify';
import { AddressField } from './AddressField';
import { EventList } from './EventList';
import { MediaList } from './MediaList';
import {
  ADD_CHILD,
  ADD_PARTNER,
  CREATE_EVENT,
  CREATE_PERSON,
  CREATE_UNION,
  DELETE_PERSON,
  PERSON_DETAIL,
  SET_SELF_PERSON,
  UPDATE_PERSON,
  UPDATE_UNION,
} from './operations';
import { fieldClass, Section } from './ui';

const REFETCH = ['PersonDetail', 'TreeCanvas', 'UnionDetail'];

// Male/female accent colours for the relationship buttons
const M = '#5f8a8f';
const F = '#c0714a';

// A field label sitting above its input
const labelClass =
  'flex flex-col gap-1 text-xs font-medium text-stone-500 dark:text-stone-400';

export function PersonPanel({
  personId,
  treeId,
  selfPersonId,
  sources,
  isAdmin,
  onError,
  onOpenUnion,
  onOpenPerson,
  onPlaceRelative,
  onDeleted,
}: {
  personId: string;
  treeId: string;
  selfPersonId: string | null;
  sources: { id: string; title: string }[];
  isAdmin: boolean;
  onError(): void;
  onOpenUnion(id: string): void;
  onOpenPerson(id: string): void;
  onPlaceRelative(
    anchorId: string,
    newId: string,
    relation: 'parent' | 'sibling' | 'spouse' | 'child',
  ): void;
  onDeleted(): void;
}) {
  const { t, lang } = useI18n();
  const { confirmType } = useNotify();
  const { data } = useQuery(PERSON_DETAIL, { variables: { id: personId } });
  // No refetch: the mutation returns the updated fields, so Apollo's cache
  // updates the card and panel in place (no full-screen reload while typing).
  const [updatePerson] = useMutation(UPDATE_PERSON);
  const [deletePerson] = useMutation(DELETE_PERSON, { refetchQueries: REFETCH });
  const [createPerson] = useMutation(CREATE_PERSON, { refetchQueries: REFETCH });
  const [createUnion] = useMutation(CREATE_UNION, { refetchQueries: REFETCH });
  const [updateUnion] = useMutation(UPDATE_UNION, { refetchQueries: REFETCH });
  const [addPartner] = useMutation(ADD_PARTNER, { refetchQueries: REFETCH });
  const [addChild] = useMutation(ADD_CHILD, { refetchQueries: REFETCH });
  const [createEvent] = useMutation(CREATE_EVENT, { refetchQueries: REFETCH });
  const [setSelfPerson] = useMutation(SET_SELF_PERSON, {
    refetchQueries: ['TreeCanvas'],
  });

  const person = data?.person;
  const [form, setForm] = useState<Record<string, string> | null>(null);
  const [relBusy, setRelBusy] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const pending = useRef<Record<string, string> | null>(null);

  if (!person) {
    return (
      <div className="grid h-24 place-items-center">
        <span className="size-6 animate-spin rounded-full border-2 border-amber-500/30 border-t-amber-500" />
      </div>
    );
  }

  // Initialize the identity form once the person loads / changes
  const current = form ?? {
    firstName: person.firstName ?? '',
    lastName: person.lastName ?? '',
    birthName: person.birthName ?? '',
    namePrefix: person.namePrefix ?? '',
    nameSuffix: person.nameSuffix ?? '',
    nickname: person.nickname ?? '',
    sex: person.sex,
    notes: person.notes ?? '',
    address: person.address ?? '',
    email: person.email ?? '',
    phone: person.phone ?? '',
  };
  const fail = () => onError();

  // Real-time save: a field change persists after a short debounce, and leaving
  // any field (or the panel) flushes the pending change immediately. No button.
  const buildInput = (data: Record<string, string>) => ({
    firstName: data.firstName || null,
    lastName: data.lastName || null,
    birthName: data.birthName || null,
    namePrefix: data.namePrefix || null,
    nameSuffix: data.nameSuffix || null,
    nickname: data.nickname || null,
    sex: data.sex as Sex,
    notes: data.notes || null,
    address: data.address || null,
    email: data.email || null,
    phone: data.phone || null,
  });
  const flush = () => {
    if (saveTimer.current) {
      clearTimeout(saveTimer.current);
      saveTimer.current = undefined;
    }
    const data = pending.current;
    if (!data) return;
    pending.current = null;
    void updatePerson({
      variables: { id: person.id, input: buildInput(data) },
    }).catch(fail);
  };
  const set = (key: string, value: string) => {
    const next = { ...current, [key]: value };
    setForm(next);
    pending.current = next;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(flush, 1500);
  };

  // The person's union events (marriage, separation…) shown on their own life
  // timeline, read-only, opening the union to edit.
  const unionEvents = person.unions.flatMap((u) => {
    const partner = u.partners.find((p) => p.id !== person.id);
    const context = partner
      ? `${t('withPartner')} ${displayName(partner)}`
      : undefined;
    return u.events.map((e) => ({
      id: e.id,
      type: e.type,
      dateValue: e.dateValue,
      dateSort: e.dateSort,
      context,
      onOpen: () => onOpenUnion(u.id),
    }));
  });

  // Profile picture: upload the file (REST), then point the person at it. The
  // media isn't linked in the gallery — it's the dedicated avatar.
  const uploadPhoto = async (file: File) => {
    setPhotoBusy(true);
    try {
      const body = new FormData();
      body.append('file', file);
      body.append('treeId', treeId);
      body.append('title', file.name);
      const response = await fetch('/api/media/upload', {
        method: 'POST',
        credentials: 'include',
        body,
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const created = (await response.json()) as { id: string };
      await updatePerson({
        variables: { id: person.id, input: { photoMediaId: created.id } },
      });
    } catch {
      fail();
    } finally {
      setPhotoBusy(false);
    }
  };

  const removePhoto = () =>
    void updatePerson({
      variables: { id: person.id, input: { photoMediaId: null } },
    }).catch(fail);

  // "C'est moi": link the viewer to this person so cards show kinship to them.
  const isSelf = selfPersonId === person.id;
  const toggleSelf = () =>
    void setSelfPerson({
      variables: { treeId, personId: isSelf ? null : person.id },
    }).catch(fail);

  // The only way to grow the tree: one tap adds a gendered relative, wires the
  // (in)famous union/child links behind the scenes, and opens its card.
  const blankPerson = async (sex: Sex) => {
    const result = await createPerson({ variables: { input: { treeId, sex } } });
    const id = result.data?.createPerson.id;
    if (!id) throw new Error('create failed');
    return id;
  };

  const runRelative = (
    relation: 'parent' | 'sibling' | 'spouse' | 'child',
    build: () => Promise<string>,
  ) => {
    if (relBusy) return;
    setRelBusy(true);
    build()
      .then((newId) => {
        onPlaceRelative(person.id, newId, relation);
        onOpenPerson(newId);
      })
      .catch(fail)
      .finally(() => setRelBusy(false));
  };

  // A parent-union to hang parents/siblings on (created if the person has none).
  const parentUnion = async () => {
    const existing = person.parentUnions[0]?.id;
    if (existing) return existing;
    const union = await createUnion({
      variables: { input: { treeId, type: 'UNKNOWN' } },
    });
    const unionId = union.data!.createUnion.id;
    await addChild({ variables: { input: { unionId, personId: person.id } } });
    return unionId;
  };

  const addParentOf = (sex: Sex) =>
    runRelative('parent', async () => {
      const parentId = await blankPerson(sex);
      await addPartner({ variables: { unionId: await parentUnion(), personId: parentId } });
      return parentId;
    });

  const addSiblingOf = (sex: Sex) =>
    runRelative('sibling', async () => {
      const siblingId = await blankPerson(sex);
      await addChild({
        variables: { input: { unionId: await parentUnion(), personId: siblingId } },
      });
      return siblingId;
    });

  const addSpouseOf = (sex: Sex, type: 'MARRIAGE' | 'PARTNERSHIP') =>
    runRelative('spouse', async () => {
      const spouseId = await blankPerson(sex);
      // Reuse a single-parent union (so an already-added child is shared) and
      // upgrade its type; otherwise create a fresh one (+ its marriage event).
      const solo = person.unions.find((u) => u.partners.length === 1);
      let unionId = solo?.id;
      if (unionId) {
        await updateUnion({ variables: { id: unionId, input: { type } } });
      } else {
        const union = await createUnion({ variables: { input: { treeId, type } } });
        unionId = union.data!.createUnion.id;
        await addPartner({ variables: { unionId, personId: person.id } });
      }
      await addPartner({ variables: { unionId, personId: spouseId } });
      return spouseId;
    });

  const addChildOf = (sex: Sex) =>
    runRelative('child', async () => {
      const childId = await blankPerson(sex);
      // Prefer an existing couple so both partners parent the child.
      const couple = person.unions.find((u) => u.partners.length >= 2);
      let unionId = couple?.id ?? person.unions[0]?.id;
      if (!unionId) {
        const union = await createUnion({
          variables: { input: { treeId, type: 'UNKNOWN' } },
        });
        unionId = union.data!.createUnion.id;
        await addPartner({ variables: { unionId, personId: person.id } });
      }
      await addChild({ variables: { input: { unionId, personId: childId } } });
      return childId;
    });

  const addExOf = (sex: Sex) =>
    runRelative('spouse', async () => {
      const exId = await blankPerson(sex);
      const union = await createUnion({
        variables: { input: { treeId, type: 'PARTNERSHIP' } },
      });
      const unionId = union.data!.createUnion.id;
      await addPartner({ variables: { unionId, personId: person.id } });
      await addPartner({ variables: { unionId, personId: exId } });
      // Mark it dissolved so it reads as a past relationship.
      await createEvent({ variables: { input: { unionId, type: 'DIVORCE' } } });
      return exId;
    });

  // A person already has at most two parents.
  const twoParents = (person.parentUnions[0]?.partners.length ?? 0) >= 2;

  const relatives: {
    key: TranslationKey;
    male: boolean;
    disabled?: boolean;
    run: () => void;
  }[] = [
    { key: 'relFather', male: true, disabled: twoParents, run: () => addParentOf('MALE') },
    { key: 'relMother', male: false, disabled: twoParents, run: () => addParentOf('FEMALE') },
    { key: 'relBrother', male: true, run: () => addSiblingOf('MALE') },
    { key: 'relSister', male: false, run: () => addSiblingOf('FEMALE') },
    { key: 'relHusband', male: true, run: () => addSpouseOf('MALE', 'MARRIAGE') },
    { key: 'relWife', male: false, run: () => addSpouseOf('FEMALE', 'MARRIAGE') },
    { key: 'relPartnerM', male: true, run: () => addSpouseOf('MALE', 'PARTNERSHIP') },
    { key: 'relPartnerF', male: false, run: () => addSpouseOf('FEMALE', 'PARTNERSHIP') },
    { key: 'relExM', male: true, run: () => addExOf('MALE') },
    { key: 'relExF', male: false, run: () => addExOf('FEMALE') },
    { key: 'relSon', male: true, run: () => addChildOf('MALE') },
    { key: 'relDaughter', male: false, run: () => addChildOf('FEMALE') },
  ];

  return (
    <div>
      <div className="mb-4 flex flex-col items-center gap-1.5">
        <button
          type="button"
          disabled={photoBusy}
          onClick={() => photoInputRef.current?.click()}
          aria-label={t('profilePhoto')}
          title={t('profilePhoto')}
          className="group relative size-20 overflow-hidden rounded-full ring-2 ring-amber-500/30 transition hover:ring-amber-500/60 disabled:opacity-60"
        >
          {person.photoMediaId ? (
            <img
              src={`/api/media/${person.photoMediaId}/file`}
              alt=""
              className="size-full object-cover"
            />
          ) : (
            <span className="grid size-full place-items-center bg-amber-100 text-2xl text-amber-700 dark:bg-stone-800 dark:text-amber-300">
              <FontAwesomeIcon icon={icons.user} />
            </span>
          )}
          <span className="absolute inset-x-0 bottom-0 bg-black/45 py-1 text-center text-[11px] text-white opacity-0 transition group-hover:opacity-100">
            <FontAwesomeIcon icon={photoBusy ? icons.seedling : icons.image} />
          </span>
        </button>
        {person.photoMediaId && (
          <button
            type="button"
            onClick={removePhoto}
            className="text-xs text-stone-400 transition hover:text-red-600 dark:hover:text-red-400"
          >
            {t('removePhoto')}
          </button>
        )}
        <button
          type="button"
          onClick={toggleSelf}
          className={`rounded-full px-3 py-1 text-xs font-medium transition ${
            isSelf
              ? 'bg-amber-600 text-white shadow-sm'
              : 'text-amber-700 ring-1 ring-amber-300 hover:bg-amber-50 dark:text-amber-400 dark:ring-amber-500/40 dark:hover:bg-stone-800'
          }`}
        >
          {isSelf ? `✓ ${t('thisIsMe')}` : t('thisIsMe')}
        </button>
        <input
          ref={photoInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void uploadPhoto(file);
            event.target.value = '';
          }}
        />
      </div>

      <div className="flex flex-col gap-2.5" onBlur={flush}>
        <label className={labelClass}>
          {t('firstNamesL')}
          <input
            value={current.firstName}
            onChange={(e) => set('firstName', e.target.value)}
            className={fieldClass}
          />
        </label>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <label className={labelClass}>
            {t('familyNameL')}
            <input
              value={current.lastName}
              onChange={(e) => set('lastName', e.target.value)}
              className={fieldClass}
            />
          </label>
          <label className={labelClass}>
            {t('maidenNameL')}
            <input
              value={current.birthName}
              onChange={(e) => set('birthName', e.target.value)}
              className={fieldClass}
            />
          </label>
        </div>
        <label className={labelClass}>
          {t('sexL')}
          <select
            value={current.sex}
            onChange={(e) => set('sex', e.target.value)}
            className={fieldClass}
          >
            {SEXES.map((value) => (
              <option key={value} value={value}>
                {enumLabel('sex', value, lang)}
              </option>
            ))}
          </select>
        </label>
        <details className="rounded-xl border border-stone-200/70 px-3 py-2 dark:border-stone-700/60">
          <summary className="cursor-pointer select-none text-xs font-medium text-stone-500 marker:text-stone-400 dark:text-stone-400">
            {t('moreInfo')}
          </summary>
          <div className="mt-2 flex flex-col gap-2">
            <input
              placeholder={t('nicknameL')}
              value={current.nickname}
              onChange={(e) => set('nickname', e.target.value)}
              className={fieldClass}
            />
            <div className="flex gap-2">
              <input
                list="name-prefix-options"
                placeholder={t('prefixL')}
                value={current.namePrefix}
                onChange={(e) => set('namePrefix', e.target.value)}
                className={`${fieldClass} flex-1`}
              />
              <input
                list="name-suffix-options"
                placeholder={t('suffixL')}
                value={current.nameSuffix}
                onChange={(e) => set('nameSuffix', e.target.value)}
                className={`${fieldClass} flex-1`}
              />
              <datalist id="name-prefix-options">
                {NAME_PREFIXES.map((value) => (
                  <option key={value} value={value} />
                ))}
              </datalist>
              <datalist id="name-suffix-options">
                {NAME_SUFFIXES.map((value) => (
                  <option key={value} value={value} />
                ))}
              </datalist>
            </div>
            <textarea
              placeholder={t('notesL')}
              rows={2}
              value={current.notes}
              onChange={(e) => set('notes', e.target.value)}
              className={fieldClass}
            />
          </div>
        </details>
        <details className="rounded-xl border border-stone-200/70 px-3 py-2 dark:border-stone-700/60">
          <summary className="cursor-pointer select-none text-xs font-medium text-stone-500 marker:text-stone-400 dark:text-stone-400">
            {t('contactL')}
          </summary>
          <div className="mt-2 flex flex-col gap-2">
            <AddressField
              value={current.address}
              onChange={(v) => set('address', v)}
              placeholder={t('addressL')}
              className={fieldClass}
            />
            <input
              type="email"
              placeholder={t('emailL')}
              value={current.email}
              onChange={(e) => set('email', e.target.value)}
              className={fieldClass}
            />
            <input
              type="tel"
              placeholder={t('phoneL')}
              value={current.phone}
              onChange={(e) => set('phone', e.target.value)}
              className={fieldClass}
            />
          </div>
        </details>
      </div>

      <Section title={t('quickRelatives')}>
        <div className="grid grid-cols-2 gap-2">
          {relatives.map(({ key, male, disabled, run }) => (
            <button
              key={key}
              type="button"
              disabled={relBusy || disabled}
              onClick={run}
              className="flex items-center gap-2 rounded-xl border border-stone-200 px-3 py-2 text-sm font-medium text-stone-600 transition hover:border-amber-300 hover:bg-amber-50 disabled:opacity-40 dark:border-stone-700 dark:text-stone-300 dark:hover:bg-stone-800"
            >
              <FontAwesomeIcon
                icon={male ? icons.male : icons.female}
                style={{ color: male ? M : F }}
              />
              {t(key)}
            </button>
          ))}
        </div>
      </Section>

      <EventList
        ownerType="person"
        ownerId={person.id}
        events={person.events as never}
        extraEvents={unionEvents}
        sources={sources}
        isAdmin={isAdmin}
        onChange={() => {}}
        onError={fail}
      />

      <MediaList
        treeId={treeId}
        personId={person.id}
        media={person.media}
        isAdmin={isAdmin}
        onChange={() => {}}
        onError={fail}
      />

      {isAdmin && (
        <button
          type="button"
          onClick={() => {
            void confirmType(t('deleteWord'), {
              danger: true,
              title: t('confirmDelete'),
            }).then((ok) => {
              if (!ok) return;
              // Cancel any queued autosave so it can't fire against the deleted
              // person, then close the panel once the deletion succeeds.
              if (saveTimer.current) clearTimeout(saveTimer.current);
              saveTimer.current = undefined;
              pending.current = null;
              void deletePerson({ variables: { id: person.id } })
                .then(() => onDeleted())
                .catch(fail);
            });
          }}
          className="mt-5 w-full rounded-xl border border-red-200 px-4 py-2 text-sm font-medium text-red-700 transition hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950"
        >
          {t('deleteAction')}
        </button>
      )}
    </div>
  );
}
