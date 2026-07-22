import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useMutation, useQuery } from '@apollo/client/react';
import { useRef, useState } from 'react';
import type { Pedigree, Religion, Sex } from '../../generated/graphql';
import { enumLabel, PEDIGREES, RELIGIONS, SEXES } from '../../lib/genealogy';
import { icons } from '../../lib/icons';
import { useI18n } from '../../lib/i18n';
import { useNotify } from '../../lib/notify';
import { EventList } from './EventList';
import { MediaList } from './MediaList';
import {
  ADD_CHILD,
  ADD_PARTNER,
  CREATE_PERSON,
  CREATE_UNION,
  DELETE_PERSON,
  PERSON_DETAIL,
  REMOVE_CHILD,
  SET_PEDIGREE,
  UPDATE_PERSON,
} from './operations';
import { fieldClass, ghostButton, personName, Section, smallButton } from './ui';

interface NamedPerson {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
}

const REFETCH = ['PersonDetail', 'TreeCanvas', 'UnionDetail'];

export function PersonPanel({
  personId,
  treeId,
  others,
  sources,
  isAdmin,
  onError,
  onOpenUnion,
  onOpenPerson,
  onPlaceRelative,
}: {
  personId: string;
  treeId: string;
  others: NamedPerson[];
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
}) {
  const { t, lang } = useI18n();
  const { confirm } = useNotify();
  const { data } = useQuery(PERSON_DETAIL, { variables: { id: personId } });
  const [updatePerson, updateState] = useMutation(UPDATE_PERSON, {
    refetchQueries: REFETCH,
  });
  const [deletePerson] = useMutation(DELETE_PERSON, { refetchQueries: REFETCH });
  const [createPerson] = useMutation(CREATE_PERSON, { refetchQueries: REFETCH });
  const [createUnion] = useMutation(CREATE_UNION, { refetchQueries: REFETCH });
  const [addPartner] = useMutation(ADD_PARTNER, { refetchQueries: REFETCH });
  const [addChild] = useMutation(ADD_CHILD, { refetchQueries: REFETCH });
  const [removeChild] = useMutation(REMOVE_CHILD, { refetchQueries: REFETCH });
  const [setPedigree] = useMutation(SET_PEDIGREE, { refetchQueries: REFETCH });

  const person = data?.person;
  const [form, setForm] = useState<Record<string, string> | null>(null);
  const [relBusy, setRelBusy] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

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
    namePrefix: person.namePrefix ?? '',
    nameSuffix: person.nameSuffix ?? '',
    nickname: person.nickname ?? '',
    sex: person.sex,
    religion: person.religion,
    notes: person.notes ?? '',
  };
  const set = (key: string, value: string) =>
    setForm({ ...current, [key]: value });

  const otherIds = new Set(person.unions.flatMap((u) => u.partners.map((p) => p.id)));
  const partnerCandidates = others.filter((p) => p.id !== person.id);

  const fail = () => onError();

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

  // Composite relationship shortcuts: create a blank relative, wire it up,
  // then open its panel so the user can fill in the details.
  const blankPerson = async () => {
    const result = await createPerson({
      variables: { input: { treeId, sex: 'UNKNOWN' as Sex } },
    });
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

  const addSpouse = () =>
    runRelative('spouse', async () => {
      const spouseId = await blankPerson();
      const union = await createUnion({
        variables: { input: { treeId, type: 'MARRIAGE' } },
      });
      const unionId = union.data!.createUnion.id;
      await addPartner({ variables: { unionId, personId: person.id } });
      await addPartner({ variables: { unionId, personId: spouseId } });
      return spouseId;
    });

  const addChildRelative = () =>
    runRelative('child', async () => {
      const childId = await blankPerson();
      let unionId = person.unions[0]?.id;
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

  const addParent = () =>
    runRelative('parent', async () => {
      const parentId = await blankPerson();
      let unionId = person.parentUnions[0]?.id;
      if (!unionId) {
        const union = await createUnion({
          variables: { input: { treeId, type: 'UNKNOWN' } },
        });
        unionId = union.data!.createUnion.id;
        await addChild({ variables: { input: { unionId, personId: person.id } } });
      }
      await addPartner({ variables: { unionId, personId: parentId } });
      return parentId;
    });

  const addSibling = () =>
    runRelative('sibling', async () => {
      const siblingId = await blankPerson();
      let unionId = person.parentUnions[0]?.id;
      if (!unionId) {
        const union = await createUnion({
          variables: { input: { treeId, type: 'UNKNOWN' } },
        });
        unionId = union.data!.createUnion.id;
        await addChild({ variables: { input: { unionId, personId: person.id } } });
      }
      await addChild({ variables: { input: { unionId, personId: siblingId } } });
      return siblingId;
    });

  const quickRelatives = [
    { key: 'addParent' as const, icon: icons.parent, run: addParent },
    { key: 'addSibling' as const, icon: icons.sibling, run: addSibling },
    { key: 'addSpouse' as const, icon: icons.spouse, run: addSpouse },
    { key: 'addChildRelative' as const, icon: icons.childRelative, run: addChildRelative },
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

      <form
        className="flex flex-col gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          void updatePerson({
            variables: {
              id: person.id,
              input: {
                firstName: current.firstName || null,
                lastName: current.lastName || null,
                namePrefix: current.namePrefix || null,
                nameSuffix: current.nameSuffix || null,
                nickname: current.nickname || null,
                sex: current.sex as Sex,
                religion: current.religion as Religion,
                notes: current.notes || null,
              },
            },
          }).catch(fail);
        }}
      >
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <input
            placeholder={t('firstNameL')}
            value={current.firstName}
            onChange={(e) => set('firstName', e.target.value)}
            className={fieldClass}
          />
          <input
            placeholder={t('lastNameL')}
            value={current.lastName}
            onChange={(e) => set('lastName', e.target.value)}
            className={fieldClass}
          />
          <input
            placeholder={t('prefixL')}
            value={current.namePrefix}
            onChange={(e) => set('namePrefix', e.target.value)}
            className={fieldClass}
          />
          <input
            placeholder={t('suffixL')}
            value={current.nameSuffix}
            onChange={(e) => set('nameSuffix', e.target.value)}
            className={fieldClass}
          />
        </div>
        <input
          placeholder={t('nicknameL')}
          value={current.nickname}
          onChange={(e) => set('nickname', e.target.value)}
          className={fieldClass}
        />
        <select
          aria-label={t('sexL')}
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
        <select
          aria-label={t('religionL')}
          value={current.religion}
          onChange={(e) => set('religion', e.target.value)}
          className={fieldClass}
        >
          {RELIGIONS.map((value) => (
            <option key={value} value={value}>
              {enumLabel('religion', value, lang)}
            </option>
          ))}
        </select>
        <textarea
          placeholder={t('notesL')}
          rows={2}
          value={current.notes}
          onChange={(e) => set('notes', e.target.value)}
          className={fieldClass}
        />
        <button type="submit" disabled={updateState.loading} className={smallButton}>
          {updateState.loading ? t('submitting') : t('save')}
        </button>
      </form>

      <Section title={t('quickRelatives')}>
        <div className="grid grid-cols-2 gap-2">
          {quickRelatives.map(({ key, icon, run }) => (
            <button
              key={key}
              type="button"
              disabled={relBusy}
              onClick={run}
              className="flex items-center justify-center gap-2 rounded-xl border border-stone-200 px-3 py-2 text-sm font-medium text-stone-600 transition hover:border-amber-300 hover:bg-amber-50 disabled:opacity-40 dark:border-stone-700 dark:text-stone-300 dark:hover:bg-stone-800"
            >
              <FontAwesomeIcon icon={icon} className="text-amber-600" />
              {t(key)}
            </button>
          ))}
        </div>
      </Section>

      <EventList
        ownerType="person"
        ownerId={person.id}
        events={person.events as never}
        sources={sources}
        isAdmin={isAdmin}
        onChange={() => {}}
        onError={fail}
      />

      <Section title={t('unionsLabel')}>
        {person.unions.map((union) => {
          const partners = union.partners.filter((p) => p.id !== person.id);
          return (
            <div
              key={union.id}
              className="mb-2 rounded-xl bg-amber-50 p-2.5 text-sm dark:bg-stone-800"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-stone-700 dark:text-stone-200">
                  <FontAwesomeIcon icon={icons.ring} className="mr-1.5" />{' '}
                  {partners.length
                    ? partners.map((p) => personName(p)).join(', ')
                    : '—'}
                </span>
                <button
                  type="button"
                  onClick={() => onOpenUnion(union.id)}
                  className={ghostButton}
                >
                  <FontAwesomeIcon icon={icons.pen} className="mr-1" />
                  {t('editUnion')}
                </button>
              </div>
              {union.children.length > 0 && (
                <ul className="mt-1.5 space-y-1">
                  {union.children.map((child) => (
                    <li
                      key={child.personId}
                      className="flex items-center gap-2 text-xs text-stone-500 dark:text-stone-400"
                    >
                      <span className="flex-1 truncate">
                        <FontAwesomeIcon icon={icons.child} className="mr-1" />
                        {personName(child.person)}
                      </span>
                      <select
                        aria-label={t('pedigreeL')}
                        value={child.pedigree}
                        onChange={(e) =>
                          void setPedigree({
                            variables: {
                              unionId: union.id,
                              personId: child.personId,
                              pedigree: e.target.value as Pedigree,
                            },
                          }).catch(fail)
                        }
                        className="rounded-md border border-stone-200 bg-transparent px-1 py-0.5 text-xs dark:border-stone-600"
                      >
                        {PEDIGREES.map((value) => (
                          <option key={value} value={value}>
                            {enumLabel('pedigree', value, lang)}
                          </option>
                        ))}
                      </select>
                      {isAdmin && (
                        <button
                          type="button"
                          onClick={() =>
                            void removeChild({
                              variables: {
                                unionId: union.id,
                                personId: child.personId,
                              },
                            }).catch(fail)
                          }
                          className={ghostButton}
                        >
                          <FontAwesomeIcon icon={icons.xmark} />
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              )}
              <select
                aria-label={t('addChild')}
                value=""
                className="mt-1.5 w-full rounded-md border border-dashed border-stone-300 bg-transparent px-2 py-1 text-xs text-stone-500 dark:border-stone-600"
                onChange={(e) => {
                  if (!e.target.value) return;
                  void addChild({
                    variables: {
                      input: { unionId: union.id, personId: e.target.value },
                    },
                  }).catch(fail);
                }}
              >
                <option value="">{t('addChild')}</option>
                {partnerCandidates
                  .filter((p) => !union.children.some((c) => c.personId === p.id))
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {personName(p)}
                    </option>
                  ))}
              </select>
            </div>
          );
        })}

        <select
          aria-label={t('addPartner')}
          value=""
          className="w-full rounded-lg border border-dashed border-stone-300 bg-transparent px-2 py-2 text-sm text-stone-500 dark:border-stone-600"
          onChange={(e) => {
            if (!e.target.value) return;
            const partnerId = e.target.value;
            void createUnion({ variables: { input: { treeId, type: 'MARRIAGE' } } })
              .then((result) => {
                const unionId = result.data?.createUnion.id;
                if (!unionId) throw new Error();
                return addPartner({
                  variables: { unionId, personId: person.id },
                }).then(() =>
                  addPartner({ variables: { unionId, personId: partnerId } }),
                );
              })
              .catch(fail);
          }}
        >
          <option value="">{t('addPartner')}</option>
          {partnerCandidates
            .filter((p) => !otherIds.has(p.id))
            .map((p) => (
              <option key={p.id} value={p.id}>
                {personName(p)}
              </option>
            ))}
        </select>
      </Section>

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
            void confirm(t('confirmDelete'), { danger: true }).then((ok) => {
              if (ok) {
                void deletePerson({ variables: { id: person.id } }).catch(fail);
              }
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
