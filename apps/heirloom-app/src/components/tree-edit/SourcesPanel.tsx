import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useMutation, useQuery } from '@apollo/client/react';
import { useState } from 'react';
import { icons } from '../../lib/icons';
import { useI18n } from '../../lib/i18n';
import {
  CREATE_SOURCE,
  DELETE_SOURCE,
  TREE_SOURCES,
  UPDATE_SOURCE,
} from './operations';
import type { CreateSourceInput } from '../../generated/graphql';
import { fieldClass, ghostButton, smallButton } from './ui';

interface Source {
  id: string;
  title: string;
  author?: string | null;
  publication?: string | null;
  repository?: string | null;
  notes?: string | null;
}

const REFETCH = ['TreeSources', 'PersonDetail', 'UnionDetail'];

function SourceForm({
  initial,
  busy,
  onSubmit,
  onCancel,
}: {
  initial?: Source;
  busy: boolean;
  onSubmit(values: Record<string, unknown>): void;
  onCancel(): void;
}) {
  const { t } = useI18n();
  const [title, setTitle] = useState(initial?.title ?? '');
  const [author, setAuthor] = useState(initial?.author ?? '');
  const [publication, setPublication] = useState(initial?.publication ?? '');
  const [repository, setRepository] = useState(initial?.repository ?? '');
  const [notes, setNotes] = useState(initial?.notes ?? '');

  return (
    <form
      className="flex flex-col gap-2 rounded-xl bg-amber-50/60 p-3 dark:bg-stone-800/60"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit({
          title,
          author: author || null,
          publication: publication || null,
          repository: repository || null,
          notes: notes || null,
        });
      }}
    >
      <input
        required
        placeholder={t('titleL')}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className={fieldClass}
      />
      <input
        placeholder={t('authorL')}
        value={author}
        onChange={(e) => setAuthor(e.target.value)}
        className={fieldClass}
      />
      <input
        placeholder={t('publicationL')}
        value={publication}
        onChange={(e) => setPublication(e.target.value)}
        className={fieldClass}
      />
      <input
        placeholder={t('repositoryL')}
        value={repository}
        onChange={(e) => setRepository(e.target.value)}
        className={fieldClass}
      />
      <textarea
        placeholder={t('notesL')}
        rows={2}
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        className={fieldClass}
      />
      <div className="flex gap-2">
        <button type="submit" disabled={busy} className={smallButton}>
          {busy ? t('submitting') : t('save')}
        </button>
        <button type="button" onClick={onCancel} className={ghostButton}>
          {t('cancel')}
        </button>
      </div>
    </form>
  );
}

export function SourcesPanel({ treeId }: { treeId: string }) {
  const { t } = useI18n();
  const { data } = useQuery(TREE_SOURCES, { variables: { id: treeId } });
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [createSource, createState] = useMutation(CREATE_SOURCE, {
    refetchQueries: REFETCH,
  });
  const [updateSource, updateState] = useMutation(UPDATE_SOURCE, {
    refetchQueries: REFETCH,
  });
  const [deleteSource] = useMutation(DELETE_SOURCE, { refetchQueries: REFETCH });

  const sources = data?.tree.sources ?? [];

  return (
    <div>
      {!adding && (
        <button
          type="button"
          onClick={() => {
            setAdding(true);
            setEditingId(null);
          }}
          className={`${smallButton} mb-3 w-full`}
        >
          <FontAwesomeIcon icon={icons.plus} className="mr-1" />
          {t('addSource')}
        </button>
      )}
      {adding && (
        <div className="mb-3">
          <SourceForm
            busy={createState.loading}
            onCancel={() => setAdding(false)}
            onSubmit={(values) =>
              void createSource({
                variables: {
                input: { treeId, ...values } as unknown as CreateSourceInput,
              },
              }).then(() => setAdding(false))
            }
          />
        </div>
      )}

      {sources.length === 0 && !adding && (
        <p className="text-sm text-stone-400 dark:text-stone-500">
          {t('noSources')}
        </p>
      )}

      <div className="flex flex-col gap-2">
        {sources.map((source) =>
          editingId === source.id ? (
            <SourceForm
              key={source.id}
              initial={source}
              busy={updateState.loading}
              onCancel={() => setEditingId(null)}
              onSubmit={(values) =>
                void updateSource({
                  variables: { id: source.id, input: values },
                }).then(() => setEditingId(null))
              }
            />
          ) : (
            <div
              key={source.id}
              className="rounded-xl bg-stone-50 p-3 text-sm dark:bg-stone-800/70"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-medium text-stone-800 dark:text-stone-100">
                    <FontAwesomeIcon icon={icons.book} className="mr-1.5" />
                    {source.title}
                  </p>
                  {source.author && (
                    <p className="text-xs text-stone-500 dark:text-stone-400">
                      {source.author}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 gap-0.5">
                  <button
                    type="button"
                    onClick={() => setEditingId(source.id)}
                    className={ghostButton}
                  >
                    <FontAwesomeIcon icon={icons.pen} />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(t('confirmDeleteSource'))) {
                        void deleteSource({ variables: { id: source.id } });
                      }
                    }}
                    className={ghostButton}
                  >
                    <FontAwesomeIcon icon={icons.trash} />
                  </button>
                </div>
              </div>
            </div>
          ),
        )}
      </div>
    </div>
  );
}
