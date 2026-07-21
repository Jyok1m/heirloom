import { useMutation, useQuery } from '@apollo/client/react';
import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { inputClass, primaryButtonClass } from '../components/forms';
import { layoutTree, type TreePerson } from '../components/tree3d/layout';
import { TreeScene } from '../components/tree3d/TreeScene';
import { graphql } from '../generated';
import { useAuth } from '../lib/auth';
import { useI18n, type TranslationKey } from '../lib/i18n';

const TREE_DETAIL = graphql(`
  query TreeDetail($id: ID!) {
    tree(id: $id) {
      id
      name
      persons {
        id
        firstName
        lastName
        sex
        notes
      }
      unions {
        id
        type
        partners {
          id
        }
        children {
          person {
            id
          }
        }
      }
    }
  }
`);

const CREATE_PERSON = graphql(`
  mutation CreatePersonM($input: CreatePersonInput!) {
    createPerson(input: $input) {
      id
    }
  }
`);

const UPDATE_PERSON = graphql(`
  mutation UpdatePersonM($id: ID!, $input: UpdatePersonInput!) {
    updatePerson(id: $id, input: $input) {
      id
    }
  }
`);

const DELETE_PERSON = graphql(`
  mutation DeletePersonM($id: ID!) {
    deletePerson(id: $id) {
      id
    }
  }
`);

const CREATE_UNION = graphql(`
  mutation CreateUnionM($input: CreateUnionInput!) {
    createUnion(input: $input) {
      id
    }
  }
`);

const ADD_PARTNER = graphql(`
  mutation AddUnionPartnerM($unionId: ID!, $personId: ID!) {
    addUnionPartner(unionId: $unionId, personId: $personId) {
      id
    }
  }
`);

const ADD_CHILD = graphql(`
  mutation AddUnionChildM($input: UnionChildInput!) {
    addUnionChild(input: $input) {
      id
    }
  }
`);

const SEXES = ['MALE', 'FEMALE', 'OTHER', 'UNKNOWN'] as const;
const REFETCH = ['TreeDetail'];

function PersonForm({
  initial,
  busy,
  submitLabel,
  onSubmit,
}: {
  initial?: { firstName: string; lastName: string; sex: string; notes: string };
  busy: boolean;
  submitLabel: string;
  onSubmit(values: {
    firstName?: string;
    lastName?: string;
    sex: (typeof SEXES)[number];
    notes?: string;
  }): void;
}) {
  const { t } = useI18n();
  const [firstName, setFirstName] = useState(initial?.firstName ?? '');
  const [lastName, setLastName] = useState(initial?.lastName ?? '');
  const [sex, setSex] = useState(initial?.sex ?? 'UNKNOWN');
  const [notes, setNotes] = useState(initial?.notes ?? '');

  return (
    <form
      className="flex flex-col gap-2.5"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit({
          firstName: firstName || undefined,
          lastName: lastName || undefined,
          sex: sex as (typeof SEXES)[number],
          notes: notes || undefined,
        });
      }}
    >
      <div className="grid grid-cols-2 gap-2">
        <input
          placeholder={t('firstNameL')}
          aria-label={t('firstNameL')}
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          className={inputClass}
        />
        <input
          placeholder={t('lastNameL')}
          aria-label={t('lastNameL')}
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          className={inputClass}
        />
      </div>
      <select
        aria-label={t('sexL')}
        value={sex}
        onChange={(e) => setSex(e.target.value)}
        className={inputClass}
      >
        {SEXES.map((value) => (
          <option key={value} value={value}>
            {t(`sex${value}` as TranslationKey)}
          </option>
        ))}
      </select>
      <textarea
        placeholder={t('notesL')}
        aria-label={t('notesL')}
        value={notes}
        rows={2}
        onChange={(e) => setNotes(e.target.value)}
        className={inputClass}
      />
      <button type="submit" disabled={busy} className={primaryButtonClass}>
        {busy ? t('submitting') : submitLabel}
      </button>
    </form>
  );
}

export function TreeView() {
  const { id = '' } = useParams();
  const { t } = useI18n();
  const { user } = useAuth();
  const { data, loading } = useQuery(TREE_DETAIL, { variables: { id } });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [createPerson, createPersonState] = useMutation(CREATE_PERSON, {
    refetchQueries: REFETCH,
  });
  const [updatePerson, updatePersonState] = useMutation(UPDATE_PERSON, {
    refetchQueries: REFETCH,
  });
  const [deletePerson] = useMutation(DELETE_PERSON, {
    refetchQueries: REFETCH,
  });
  const [createUnion] = useMutation(CREATE_UNION, { refetchQueries: REFETCH });
  const [addPartner] = useMutation(ADD_PARTNER, { refetchQueries: REFETCH });
  const [addChild] = useMutation(ADD_CHILD, { refetchQueries: REFETCH });

  const tree = data?.tree;
  const layout = useMemo(() => {
    if (!tree) return null;
    return layoutTree(
      tree.persons as TreePerson[],
      tree.unions.map((union) => ({
        id: union.id,
        partnerIds: union.partners.map((p) => p.id),
        childIds: union.children.map((c) => c.person.id),
      })),
    );
  }, [tree]);

  const selected = tree?.persons.find((p) => p.id === selectedId) ?? null;
  const selectedUnions =
    tree?.unions.filter((u) => u.partners.some((p) => p.id === selectedId)) ??
    [];
  const others = tree?.persons.filter((p) => p.id !== selectedId) ?? [];
  const nameOf = (personId: string) => {
    const person = tree?.persons.find((p) => p.id === personId);
    return (
      [person?.firstName, person?.lastName].filter(Boolean).join(' ') || '(?)'
    );
  };
  const failed = () => setError(t('forbidden'));

  return (
    <main className="relative flex-1">
      <div className="absolute inset-x-0 top-0 z-10 flex flex-wrap items-center gap-2 px-4 py-3">
        <Link
          to="/trees"
          className="rounded-full bg-black/30 px-3.5 py-1.5 text-sm text-amber-100 backdrop-blur transition hover:bg-black/50"
        >
          ← {t('backToTrees')}
        </Link>
        <h1 className="font-display text-lg font-semibold text-amber-50 drop-shadow">
          {tree?.name ?? '…'}
        </h1>
        <div className="ml-auto flex items-center gap-2">
          {error && (
            <span className="rounded-full bg-red-900/70 px-3 py-1 text-xs text-red-100 backdrop-blur">
              {error}
            </span>
          )}
          <button
            type="button"
            onClick={() => {
              setError(null);
              setAdding((v) => !v);
              setSelectedId(null);
            }}
            className="rounded-full bg-linear-to-b from-amber-600 to-amber-700 px-4 py-1.5 text-sm font-medium text-white shadow-md transition hover:from-amber-500 hover:to-amber-600"
          >
            + {t('addPerson')}
          </button>
        </div>
      </div>

      <div className="h-[calc(100dvh-3.5rem)] w-full">
        {layout &&
          (layout.nodes.length > 0 ? (
            <TreeScene
              layout={layout}
              selectedId={selectedId}
              onSelect={(value) => {
                setSelectedId(value);
                setAdding(false);
                setError(null);
              }}
            />
          ) : (
            <div className="grid h-full place-items-center bg-[#191410] px-6">
              <p className="max-w-sm text-center text-sm leading-relaxed text-amber-100/70">
                🌱 {t('emptyTree')}
              </p>
            </div>
          ))}
        {loading && (
          <div className="grid h-full place-items-center bg-[#191410]">
            <span className="size-8 animate-spin rounded-full border-2 border-amber-500/30 border-t-amber-500" />
          </div>
        )}
      </div>

      {(adding || selected) && (
        <aside className="absolute bottom-4 right-4 top-16 z-10 w-[320px] max-w-[calc(100vw-2rem)] overflow-y-auto rounded-3xl bg-white/95 p-5 shadow-2xl ring-1 ring-amber-900/10 backdrop-blur dark:bg-stone-900/95 dark:ring-stone-700">
          {adding ? (
            <>
              <h2 className="mb-4 font-display text-lg font-semibold text-stone-900 dark:text-stone-50">
                {t('addPerson')}
              </h2>
              <PersonForm
                busy={createPersonState.loading}
                submitLabel={t('createAction')}
                onSubmit={(values) => {
                  void createPerson({
                    variables: { input: { treeId: id, ...values } },
                  })
                    .then(() => setAdding(false))
                    .catch(failed);
                }}
              />
            </>
          ) : selected ? (
            <>
              <div className="mb-4 flex items-start justify-between gap-2">
                <h2 className="font-display text-lg font-semibold text-stone-900 dark:text-stone-50">
                  {[selected.firstName, selected.lastName]
                    .filter(Boolean)
                    .join(' ') || '(?)'}
                </h2>
                <button
                  type="button"
                  onClick={() => setSelectedId(null)}
                  aria-label={t('close')}
                  className="rounded-lg px-2 py-1 text-sm text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800"
                >
                  ✕
                </button>
              </div>

              <PersonForm
                key={selected.id}
                initial={{
                  firstName: selected.firstName ?? '',
                  lastName: selected.lastName ?? '',
                  sex: selected.sex,
                  notes: selected.notes ?? '',
                }}
                busy={updatePersonState.loading}
                submitLabel={t('save')}
                onSubmit={(values) => {
                  void updatePerson({
                    variables: { id: selected.id, input: values },
                  }).catch(failed);
                }}
              />

              <div className="mt-5 border-t border-stone-200 pt-4 dark:border-stone-700">
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-stone-400">
                  {t('unionsLabel')}
                </h3>
                {selectedUnions.map((union) => (
                  <div key={union.id} className="mb-3 rounded-xl bg-amber-50 p-3 text-sm dark:bg-stone-800">
                    <p className="text-stone-700 dark:text-stone-200">
                      💍{' '}
                      {union.partners
                        .filter((p) => p.id !== selected.id)
                        .map((p) => nameOf(p.id))
                        .join(', ') || '—'}
                    </p>
                    <select
                      aria-label={t('addChild')}
                      className={`${inputClass} mt-2`}
                      value=""
                      onChange={(event) => {
                        if (!event.target.value) return;
                        void addChild({
                          variables: {
                            input: {
                              unionId: union.id,
                              personId: event.target.value,
                            },
                          },
                        }).catch(failed);
                      }}
                    >
                      <option value="">＋ {t('addChild')}</option>
                      {others.map((p) => (
                        <option key={p.id} value={p.id}>
                          {nameOf(p.id)}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
                <select
                  aria-label={t('addPartner')}
                  className={inputClass}
                  value=""
                  onChange={(event) => {
                    if (!event.target.value) return;
                    const partnerId = event.target.value;
                    void createUnion({
                      variables: { input: { treeId: id, type: 'MARRIAGE' } },
                    })
                      .then((result) => {
                        const unionId = result.data?.createUnion.id;
                        if (!unionId) throw new Error();
                        return addPartner({
                          variables: { unionId, personId: selected.id },
                        }).then(() =>
                          addPartner({
                            variables: { unionId, personId: partnerId },
                          }),
                        );
                      })
                      .catch(failed);
                  }}
                >
                  <option value="">💍 {t('addPartner')}</option>
                  {others.map((p) => (
                    <option key={p.id} value={p.id}>
                      {nameOf(p.id)}
                    </option>
                  ))}
                </select>
              </div>

              {user?.role === 'ADMIN' && (
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm(t('confirmDelete'))) {
                      void deletePerson({ variables: { id: selected.id } })
                        .then(() => setSelectedId(null))
                        .catch(failed);
                    }
                  }}
                  className="mt-5 w-full rounded-xl border border-red-200 px-4 py-2 text-sm font-medium text-red-700 transition hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950"
                >
                  {t('deleteAction')}
                </button>
              )}
            </>
          ) : null}
        </aside>
      )}
    </main>
  );
}
