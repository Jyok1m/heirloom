import { useMutation, useQuery } from '@apollo/client/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { MembersPanel } from '../components/MembersPanel';
import { PersonPanel } from '../components/tree-edit/PersonPanel';
import { SourcesPanel } from '../components/tree-edit/SourcesPanel';
import {
  CREATE_PERSON,
  DELETE_PERSON,
  TREE_CANVAS,
  TREE_SOURCES,
} from '../components/tree-edit/operations';
import { fieldClass, smallButton } from '../components/tree-edit/ui';
import { UnionPanel } from '../components/tree-edit/UnionPanel';
import { TreeCanvas } from '../components/tree2d/TreeCanvas';
import {
  CARD_H,
  CARD_W,
  GAP_X,
  GEN_GAP,
  type TreePerson,
  type TreeUnion,
} from '../components/tree2d/layout';
import { usePositions } from '../components/tree2d/positions';
import type { Sex } from '../generated/graphql';
import { icons } from '../lib/icons';
import { enumLabel, SEXES } from '../lib/genealogy';
import { useAuth } from '../lib/auth';
import { useI18n } from '../lib/i18n';
import { useTitle } from '../lib/useTitle';
import { useNotify } from '../lib/notify';

const headerButton =
  'pointer-events-auto rounded-full bg-white/85 px-3.5 py-1.5 text-sm font-medium text-stone-600 shadow-sm ring-1 ring-stone-200 backdrop-blur transition hover:bg-white dark:bg-stone-800/85 dark:text-stone-300 dark:ring-stone-700';

function AddPersonForm({
  treeId,
  onDone,
  onError,
}: {
  treeId: string;
  onDone(id: string): void;
  onError(): void;
}) {
  const { t, lang } = useI18n();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [sex, setSex] = useState('UNKNOWN');
  const [createPerson, { loading }] = useMutation(CREATE_PERSON, {
    refetchQueries: ['TreeCanvas'],
  });

  return (
    <form
      className="flex flex-col gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        void createPerson({
          variables: {
            input: {
              treeId,
              firstName: firstName || null,
              lastName: lastName || null,
              sex: sex as Sex,
            },
          },
        })
          .then((result) => {
            const id = result.data?.createPerson.id;
            if (id) onDone(id);
          })
          .catch(onError);
      }}
    >
      <div className="grid grid-cols-2 gap-2">
        <input
          autoFocus
          placeholder={t('firstNameL')}
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          className={fieldClass}
        />
        <input
          placeholder={t('lastNameL')}
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          className={fieldClass}
        />
      </div>
      <select
        aria-label={t('sexL')}
        value={sex}
        onChange={(e) => setSex(e.target.value)}
        className={fieldClass}
      >
        {SEXES.map((value) => (
          <option key={value} value={value}>
            {enumLabel('sex', value, lang)}
          </option>
        ))}
      </select>
      <button type="submit" disabled={loading} className={smallButton}>
        {loading ? t('submitting') : t('createAction')}
      </button>
    </form>
  );
}

type Panel =
  | { kind: 'person'; id: string }
  | { kind: 'union'; id: string }
  | { kind: 'add' }
  | { kind: 'members' }
  | { kind: 'sources' }
  | null;

export function TreeView() {
  const { id = '' } = useParams();
  const { t } = useI18n();
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const { data, loading, refetch } = useQuery(TREE_CANVAS, {
    variables: { id },
  });
  const { data: sourcesData } = useQuery(TREE_SOURCES, {
    variables: { id },
  });
  const [deletePerson] = useMutation(DELETE_PERSON);
  const [panel, setPanel] = useState<Panel>(null);
  const { message } = useNotify();
  const fail = () => message.error(t('forbidden'));

  // Node positions are lifted here so both the canvas and the person panel
  // share one store: a freshly created relative can be dropped next to its
  // anchor instead of falling back to the auto-layout on the far side.
  const pos = usePositions(id);

  const REL_OFFSET = {
    parent: { x: 0, y: -(CARD_H + GEN_GAP) },
    child: { x: 0, y: CARD_H + GEN_GAP },
    spouse: { x: CARD_W + GAP_X, y: 0 },
    sibling: { x: CARD_W + GAP_X, y: 0 },
  } as const;

  // Place a new relative next to its anchor — but only if the anchor has been
  // manually positioned. Otherwise the whole tree is still auto-laid-out and
  // layoutTree already puts the newcomer in a coherent spot.
  const placeRelative = (
    anchorId: string,
    newId: string,
    relation: keyof typeof REL_OFFSET,
  ) => {
    const anchor = pos.positions.get(anchorId);
    if (!anchor) return;
    const off = REL_OFFSET[relation];
    pos.place(newId, { x: anchor.x + off.x, y: anchor.y + off.y });
  };

  // Bulk removal from the canvas marquee selection
  const removePersons = async (ids: string[]) => {
    try {
      for (const personId of ids) {
        await deletePerson({ variables: { id: personId } });
      }
      if (panel?.kind === 'person' && ids.includes(panel.id)) setPanel(null);
    } catch {
      fail();
    } finally {
      await refetch();
    }
  };

  const tree = data?.tree;
  useTitle(tree?.name ?? undefined);
  const treeUnions = useMemo<TreeUnion[]>(
    () =>
      tree?.unions.map((union) => ({
        id: union.id,
        partnerIds: union.partners.map((p) => p.id),
        childIds: union.children.map((c) => c.person.id),
      })) ?? [],
    [tree],
  );
  const others = tree?.persons ?? [];
  const sources = sourcesData?.tree.sources ?? [];

  const title =
    panel?.kind === 'members'
      ? t('membersTitle')
      : panel?.kind === 'sources'
        ? t('sourcesTitle')
        : panel?.kind === 'add'
          ? t('addPerson')
          : panel?.kind === 'union'
            ? t('unionLabel')
            : panel?.kind === 'person'
              ? (() => {
                  const p = others.find((x) => x.id === panel.id);
                  return (
                    [p?.firstName, p?.lastName].filter(Boolean).join(' ') || '—'
                  );
                })()
              : '';

  return (
    <main className="relative flex-1">
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex flex-wrap items-center gap-2 px-4 py-3">
        <Link to="/trees" className={headerButton}>
          <FontAwesomeIcon icon={icons.arrowLeft} className="sm:mr-1.5" />
          <span className="hidden sm:inline">{t('backToTrees')}</span>
        </Link>
        <h1 className="font-display text-lg font-semibold text-stone-800 dark:text-stone-100">
          {tree?.name ?? '…'}
        </h1>
        <div className="pointer-events-auto ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPanel({ kind: 'sources' })}
            className={headerButton}
          >
            <FontAwesomeIcon icon={icons.book} className="sm:mr-1.5" />
            <span className="hidden sm:inline">{t('sourcesTitle')}</span>
          </button>
          {isAdmin && (
            <button
              type="button"
              onClick={() => setPanel({ kind: 'members' })}
              className={headerButton}
            >
              <FontAwesomeIcon icon={icons.users} className="sm:mr-1.5" />
              <span className="hidden sm:inline">{t('membersTitle')}</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => setPanel({ kind: 'add' })}
            className="pointer-events-auto rounded-full bg-linear-to-b from-amber-600 to-amber-700 px-3 py-1.5 text-sm font-medium text-white shadow-md transition hover:from-amber-500 hover:to-amber-600 sm:px-4"
          >
            <FontAwesomeIcon icon={icons.plus} className="sm:mr-1.5" />
            <span className="hidden sm:inline">{t('addPerson')}</span>
          </button>
        </div>
      </div>

      <div className="h-[calc(100dvh-3.5rem)] w-full bg-[#faf7f0] bg-[radial-gradient(circle_at_1px_1px,rgba(120,113,108,0.12)_1px,transparent_0)] bg-size-[22px_22px] dark:bg-stone-950 dark:bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.05)_1px,transparent_0)]">
        {loading ? (
          <div className="grid h-full place-items-center">
            <span className="size-8 animate-spin rounded-full border-2 border-amber-500/30 border-t-amber-500" />
          </div>
        ) : tree && tree.persons.length > 0 ? (
          <TreeCanvas
            persons={tree.persons as TreePerson[]}
            unions={treeUnions}
            selectedId={panel?.kind === 'person' ? panel.id : null}
            selectedUnionId={panel?.kind === 'union' ? panel.id : null}
            isAdmin={isAdmin ?? false}
            onRemovePersons={removePersons}
            positions={pos.positions}
            move={pos.move}
            commit={pos.commit}
            reset={pos.reset}
            onSelect={(value) =>
              setPanel(value ? { kind: 'person', id: value } : null)
            }
            onSelectUnion={(unionId) =>
              setPanel({ kind: 'union', id: unionId })
            }
          />
        ) : (
          tree && (
            <div className="grid h-full place-items-center px-6">
              <p className="max-w-sm text-center text-sm leading-relaxed text-stone-500 dark:text-stone-400">
                <FontAwesomeIcon icon={icons.seedling} className="mr-1.5" />
                {t('emptyTree')}
              </p>
            </div>
          )
        )}
      </div>

      {panel && (
        <aside className="absolute bottom-4 right-4 top-16 z-10 w-85 max-w-[calc(100vw-2rem)] overflow-y-auto rounded-3xl bg-white/95 p-5 shadow-2xl ring-1 ring-amber-900/10 backdrop-blur dark:bg-stone-900/95 dark:ring-stone-700">
          <div className="mb-4 flex items-start justify-between gap-2">
            <h2 className="font-display text-lg font-semibold text-stone-900 dark:text-stone-50">
              {title}
            </h2>
            <button
              type="button"
              onClick={() => setPanel(null)}
              aria-label={t('close')}
              className="rounded-lg px-2 py-1 text-sm text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800"
            >
              <FontAwesomeIcon icon={icons.xmark} />
            </button>
          </div>

          {panel.kind === 'members' && <MembersPanel treeId={id} />}
          {panel.kind === 'sources' && <SourcesPanel treeId={id} />}
          {panel.kind === 'add' && (
            <AddPersonForm
              treeId={id}
              onError={fail}
              onDone={(personId) => setPanel({ kind: 'person', id: personId })}
            />
          )}
          {panel.kind === 'person' && (
            <PersonPanel
              key={panel.id}
              personId={panel.id}
              treeId={id}
              others={others}
              sources={sources}
              isAdmin={isAdmin ?? false}
              onError={fail}
              onOpenUnion={(unionId) => setPanel({ kind: 'union', id: unionId })}
              onOpenPerson={(pid) => setPanel({ kind: 'person', id: pid })}
              onPlaceRelative={placeRelative}
            />
          )}
          {panel.kind === 'union' && (
            <UnionPanel
              key={panel.id}
              unionId={panel.id}
              others={others}
              sources={sources}
              isAdmin={isAdmin ?? false}
              onError={fail}
              onSelectPerson={(personId) =>
                setPanel({ kind: 'person', id: personId })
              }
              onDeleted={() => setPanel(null)}
            />
          )}
        </aside>
      )}
    </main>
  );
}
