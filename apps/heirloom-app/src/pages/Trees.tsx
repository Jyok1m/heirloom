import { useMutation, useQuery } from '@apollo/client/react';
import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Link } from 'react-router-dom';
import { inputClass, primaryButtonClass } from '../components/forms';
import { graphql } from '../generated';
import { useAuth } from '../lib/auth';
import { icons } from '../lib/icons';
import { useI18n } from '../lib/i18n';

const TREES_QUERY = graphql(`
  query Trees {
    trees {
      id
      name
      description
      createdAt
      persons {
        id
      }
    }
  }
`);

const CREATE_TREE = graphql(`
  mutation CreateTree($input: CreateTreeInput!) {
    createTree(input: $input) {
      id
      name
    }
  }
`);

const UPDATE_TREE = graphql(`
  mutation UpdateTree($id: ID!, $input: UpdateTreeInput!) {
    updateTree(id: $id, input: $input) {
      id
      name
    }
  }
`);

const DELETE_TREE = graphql(`
  mutation DeleteTree($id: ID!) {
    deleteTree(id: $id) {
      id
    }
  }
`);

function NewTreeForm({ onDone }: { onDone: () => void }) {
  const { t } = useI18n();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [createTree, { loading }] = useMutation(CREATE_TREE, {
    refetchQueries: ['Trees'],
  });

  return (
    <form
      className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-amber-900/10 dark:bg-stone-900 dark:ring-stone-800"
      onSubmit={(event) => {
        event.preventDefault();
        void createTree({
          variables: {
            input: { name, description: description || undefined },
          },
        }).then(onDone);
      }}
    >
      <div className="flex flex-col gap-3">
        <input
          autoFocus
          required
          maxLength={200}
          placeholder={t('treeNameLabel')}
          aria-label={t('treeNameLabel')}
          value={name}
          onChange={(event) => setName(event.target.value)}
          className={inputClass}
        />
        <input
          placeholder={t('treeDescLabel')}
          aria-label={t('treeDescLabel')}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          className={inputClass}
        />
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={loading || !name.trim()}
            className={primaryButtonClass}
          >
            {loading ? t('submitting') : t('createAction')}
          </button>
          <button
            type="button"
            onClick={onDone}
            className="rounded-xl px-4 py-2.5 text-sm font-medium text-stone-500 transition hover:bg-stone-100 dark:text-stone-400 dark:hover:bg-stone-800"
          >
            {t('cancel')}
          </button>
        </div>
      </div>
    </form>
  );
}

export function Trees() {
  const { t, lang } = useI18n();
  const { user } = useAuth();
  const { data, loading, error } = useQuery(TREES_QUERY);
  const [creating, setCreating] = useState(false);
  const [updateTree] = useMutation(UPDATE_TREE, { refetchQueries: ['Trees'] });
  const [deleteTree] = useMutation(DELETE_TREE, { refetchQueries: ['Trees'] });
  const isAdmin = user?.role === 'ADMIN';

  return (
    <main className="mx-auto w-full max-w-5xl px-4 pb-16 pt-10 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-stone-900 dark:text-stone-50">
            {t('treesTitle')}
          </h1>
          <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
            {t('treesSubtitle')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {user && (
            <span className="rounded-full bg-amber-100/80 px-3 py-1 text-xs font-medium text-amber-800 dark:bg-amber-950 dark:text-amber-300">
              {user.displayName ?? user.email} ·{' '}
              {user.role === 'ADMIN' ? t('roleAdmin') : t('roleMember')}
            </span>
          )}
          {user?.role === 'ADMIN' && !creating && (
            <button
              type="button"
              onClick={() => setCreating(true)}
              className="rounded-full bg-linear-to-b from-amber-600 to-amber-700 px-4 py-1.5 text-sm font-medium text-white shadow-sm transition hover:from-amber-500 hover:to-amber-600"
            >
              + {t('newTree')}
            </button>
          )}
        </div>
      </div>

      {creating && (
        <div className="mt-6 max-w-md">
          <NewTreeForm onDone={() => setCreating(false)} />
        </div>
      )}

      {loading && (
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-36 animate-pulse rounded-3xl bg-stone-200/60 dark:bg-stone-800/60"
            />
          ))}
        </div>
      )}

      {error && (
        <p className="mt-10 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-800 ring-1 ring-red-200 dark:bg-red-950 dark:text-red-300 dark:ring-red-900">
          {t('errorGeneric')}
        </p>
      )}

      {data && data.trees.length === 0 && (
        <div className="mt-14 flex flex-col items-center gap-3 text-center">
          <span className="grid size-14 place-items-center rounded-2xl bg-amber-100 text-2xl text-amber-700 dark:bg-stone-800 dark:text-amber-400">
            <FontAwesomeIcon icon={icons.seedling} />
          </span>
          <p className="max-w-sm text-sm leading-relaxed text-stone-500 dark:text-stone-400">
            {t('treesEmpty')}
          </p>
        </div>
      )}

      {data && data.trees.length > 0 && (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.trees.map((tree) => (
            <Link
              key={tree.id}
              to={`/trees/${tree.id}`}
              className="group flex flex-col rounded-3xl bg-white p-5 shadow-sm ring-1 ring-amber-900/10 transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-amber-900/10 dark:bg-stone-900 dark:ring-stone-800"
            >
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-xl bg-linear-to-br from-amber-100 to-orange-100 text-lg text-amber-700 dark:from-stone-800 dark:to-stone-800 dark:text-amber-400">
                  <FontAwesomeIcon icon={icons.tree} />
                </span>
                <h2 className="min-w-0 flex-1 truncate font-display text-lg font-semibold text-stone-900 dark:text-stone-100">
                  {tree.name}
                </h2>
                {isAdmin && (
                  <span className="flex shrink-0 gap-0.5 opacity-0 transition group-hover:opacity-100">
                    <button
                      type="button"
                      aria-label={t('renameTree')}
                      title={t('renameTree')}
                      onClick={(event) => {
                        event.preventDefault();
                        const name = window.prompt(t('renameTree'), tree.name);
                        if (name?.trim()) {
                          void updateTree({
                            variables: {
                              id: tree.id,
                              input: { name: name.trim() },
                            },
                          });
                        }
                      }}
                      className="rounded-lg px-1.5 py-1 text-sm text-stone-400 transition hover:bg-amber-100 hover:text-stone-700 dark:hover:bg-stone-800"
                    >
                      <FontAwesomeIcon icon={icons.pen} />
                    </button>
                    <button
                      type="button"
                      aria-label={t('deleteTreeAction')}
                      title={t('deleteTreeAction')}
                      onClick={(event) => {
                        event.preventDefault();
                        if (window.confirm(t('confirmDeleteTree'))) {
                          void deleteTree({ variables: { id: tree.id } });
                        }
                      }}
                      className="rounded-lg px-1.5 py-1 text-sm text-stone-400 transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950"
                    >
                      <FontAwesomeIcon icon={icons.trash} />
                    </button>
                  </span>
                )}
              </div>
              {tree.description && (
                <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-stone-500 dark:text-stone-400">
                  {tree.description}
                </p>
              )}
              <div className="mt-auto flex items-center justify-between pt-4 text-xs text-stone-400 dark:text-stone-500">
                <span>
                  <FontAwesomeIcon icon={icons.user} className="mr-1" />
                  {tree.persons.length}
                </span>
                <span>
                  {t('created')}{' '}
                  {new Date(tree.createdAt as string).toLocaleDateString(
                    lang === 'fr' ? 'fr-FR' : 'en-US',
                    { year: 'numeric', month: 'short', day: 'numeric' },
                  )}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
