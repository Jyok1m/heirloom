import { useMutation, useQuery } from '@apollo/client/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Input, Modal } from 'antd';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { inputClass, primaryButtonClass } from '../components/forms';
import { graphql } from '../generated';
import { useAuth } from '../lib/auth';
import { icons } from '../lib/icons';
import { useI18n } from '../lib/i18n';
import { useTitle } from '../lib/useTitle';
import { useNotify } from '../lib/notify';

const TREES_QUERY = graphql(`
  query Trees {
    trees {
      id
      name
      description
      icon
      color
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

// --- Card presentation presets (icon + colour) --------------------------
const DEFAULT_ICON = 'tree';
const DEFAULT_COLOR = 'amber';

// Preset icon keys — each must exist in the shared `icons` map.
const TREE_ICONS = [
  'tree',
  'house',
  'heart',
  'ring',
  'book',
  'star',
  'church',
  'seedling',
  'users',
  'dove',
] as const;

// Preset colours -> full Tailwind class strings (kept whole so JIT keeps them).
const TREE_COLORS: Record<
  string,
  { grad: string; text: string; swatch: string }
> = {
  amber: { grad: 'from-amber-100 to-orange-100', text: 'text-amber-700 dark:text-amber-400', swatch: 'bg-amber-500' },
  rose: { grad: 'from-rose-100 to-pink-100', text: 'text-rose-700 dark:text-rose-400', swatch: 'bg-rose-500' },
  emerald: { grad: 'from-emerald-100 to-teal-100', text: 'text-emerald-700 dark:text-emerald-400', swatch: 'bg-emerald-500' },
  sky: { grad: 'from-sky-100 to-blue-100', text: 'text-sky-700 dark:text-sky-400', swatch: 'bg-sky-500' },
  violet: { grad: 'from-violet-100 to-purple-100', text: 'text-violet-700 dark:text-violet-400', swatch: 'bg-violet-500' },
  orange: { grad: 'from-orange-100 to-amber-100', text: 'text-orange-700 dark:text-orange-400', swatch: 'bg-orange-500' },
  teal: { grad: 'from-teal-100 to-cyan-100', text: 'text-teal-700 dark:text-teal-400', swatch: 'bg-teal-500' },
  stone: { grad: 'from-stone-200 to-stone-100', text: 'text-stone-600 dark:text-stone-300', swatch: 'bg-stone-500' },
};
const COLOR_KEYS = Object.keys(TREE_COLORS);

const treeIcon = (key?: string | null) =>
  icons[(key ?? DEFAULT_ICON) as keyof typeof icons] ?? icons.tree;
const treeColor = (key?: string | null) =>
  TREE_COLORS[key ?? DEFAULT_COLOR] ?? TREE_COLORS[DEFAULT_COLOR];

type TreeEdit = {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
};

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
  const { confirmType } = useNotify();
  const { user } = useAuth();
  useTitle(t('treesTitle'));
  const { data, loading, error } = useQuery(TREES_QUERY);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<TreeEdit | null>(null);
  const [updateTree] = useMutation(UPDATE_TREE, { refetchQueries: ['Trees'] });
  const [deleteTree] = useMutation(DELETE_TREE, { refetchQueries: ['Trees'] });
  const isAdmin = user?.role === 'ADMIN';

  const submitEdit = () => {
    if (editing && editing.name.trim()) {
      void updateTree({
        variables: {
          id: editing.id,
          input: {
            name: editing.name.trim(),
            description: editing.description.trim() || null,
            icon: editing.icon,
            color: editing.color,
          },
        },
      });
    }
    setEditing(null);
  };

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
                <span
                  className={`grid size-10 place-items-center rounded-xl bg-linear-to-br text-lg dark:from-stone-800 dark:to-stone-800 ${treeColor(tree.color).grad} ${treeColor(tree.color).text}`}
                >
                  <FontAwesomeIcon icon={treeIcon(tree.icon)} />
                </span>
                <h2 className="min-w-0 flex-1 truncate font-display text-lg font-semibold text-stone-900 dark:text-stone-100">
                  {tree.name}
                </h2>
                {isAdmin && (
                  <span className="flex shrink-0 gap-0.5 opacity-0 transition group-hover:opacity-100">
                    <button
                      type="button"
                      aria-label={t('editTree')}
                      title={t('editTree')}
                      onClick={(event) => {
                        event.preventDefault();
                        setEditing({
                          id: tree.id,
                          name: tree.name,
                          description: tree.description ?? '',
                          icon: tree.icon ?? DEFAULT_ICON,
                          color: tree.color ?? DEFAULT_COLOR,
                        });
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
                        void confirmType(t('deleteWord'), {
                          danger: true,
                          title: t('confirmDeleteTree'),
                        }).then((ok) => {
                          if (ok) {
                            void deleteTree({ variables: { id: tree.id } });
                          }
                        });
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

      <Modal
        open={editing !== null}
        title={t('editTree')}
        okText={t('save')}
        cancelText={t('cancel')}
        centered
        okButtonProps={{ disabled: !editing?.name.trim() }}
        onOk={submitEdit}
        onCancel={() => setEditing(null)}
      >
        {editing && (
          <div className="flex flex-col gap-4 py-1">
            <label className="flex flex-col gap-1 text-xs font-medium text-stone-500 dark:text-stone-400">
              {t('treeNameLabel')}
              <Input
                autoFocus
                value={editing.name}
                maxLength={200}
                onChange={(e) =>
                  setEditing((s) => (s ? { ...s, name: e.target.value } : s))
                }
                onPressEnter={submitEdit}
              />
            </label>
            <label className="flex flex-col gap-1 text-xs font-medium text-stone-500 dark:text-stone-400">
              {t('treeDescLabel')}
              <Input.TextArea
                value={editing.description}
                maxLength={10_000}
                autoSize={{ minRows: 2, maxRows: 4 }}
                onChange={(e) =>
                  setEditing((s) =>
                    s ? { ...s, description: e.target.value } : s,
                  )
                }
              />
            </label>
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-stone-500 dark:text-stone-400">
                {t('treeIconLabel')}
              </span>
              <div className="flex flex-wrap gap-2">
                {TREE_ICONS.map((key) => (
                  <button
                    key={key}
                    type="button"
                    aria-label={key}
                    onClick={() =>
                      setEditing((s) => (s ? { ...s, icon: key } : s))
                    }
                    className={`grid size-9 place-items-center rounded-xl border transition ${
                      editing.icon === key
                        ? 'border-amber-500 bg-amber-50 text-amber-700 dark:bg-stone-800 dark:text-amber-300'
                        : 'border-stone-200 text-stone-500 hover:border-amber-300 dark:border-stone-700 dark:text-stone-300'
                    }`}
                  >
                    <FontAwesomeIcon icon={treeIcon(key)} />
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-stone-500 dark:text-stone-400">
                {t('treeColorLabel')}
              </span>
              <div className="flex flex-wrap gap-2">
                {COLOR_KEYS.map((key) => (
                  <button
                    key={key}
                    type="button"
                    aria-label={key}
                    onClick={() =>
                      setEditing((s) => (s ? { ...s, color: key } : s))
                    }
                    className={`size-8 rounded-full ring-2 ring-offset-2 transition dark:ring-offset-stone-900 ${TREE_COLORS[key].swatch} ${
                      editing.color === key
                        ? 'ring-stone-400 dark:ring-stone-300'
                        : 'ring-transparent'
                    }`}
                  />
                ))}
              </div>
            </div>
            <div className="mt-1 flex items-center gap-3 rounded-2xl bg-stone-50 p-3 dark:bg-stone-800/50">
              <span
                className={`grid size-10 place-items-center rounded-xl bg-linear-to-br text-lg dark:from-stone-800 dark:to-stone-800 ${treeColor(editing.color).grad} ${treeColor(editing.color).text}`}
              >
                <FontAwesomeIcon icon={treeIcon(editing.icon)} />
              </span>
              <span className="min-w-0 truncate font-display text-base font-semibold text-stone-800 dark:text-stone-100">
                {editing.name || t('treeNameLabel')}
              </span>
            </div>
          </div>
        )}
      </Modal>
    </main>
  );
}
