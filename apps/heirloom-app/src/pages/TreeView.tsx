import { useMutation, useQuery } from '@apollo/client/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { MembersPanel } from '../components/MembersPanel';
import { AddressField } from '../components/tree-edit/AddressField';
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
import { FanChart } from '../components/tree2d/FanChart';
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
import {
  displayName,
  enumLabel,
  NAME_PREFIXES,
  NAME_SUFFIXES,
  SEXES,
} from '../lib/genealogy';
import { computeKinships, kinshipLabel } from '../lib/kinship';
import { useAuth } from '../lib/auth';
import { useI18n } from '../lib/i18n';
import { useTitle } from '../lib/useTitle';
import { useNotify } from '../lib/notify';

const headerButton =
  'pointer-events-auto rounded-full bg-white/85 px-3.5 py-1.5 text-sm font-medium text-stone-600 shadow-sm ring-1 ring-stone-200 backdrop-blur transition hover:bg-white dark:bg-stone-800/85 dark:text-stone-300 dark:ring-stone-700';

const addLabelClass =
  'flex flex-col gap-1 text-xs font-medium text-stone-500 dark:text-stone-400';

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
  const [birthName, setBirthName] = useState('');
  const [sex, setSex] = useState('MALE');
  const [nickname, setNickname] = useState('');
  const [namePrefix, setNamePrefix] = useState('');
  const [nameSuffix, setNameSuffix] = useState('');
  const [notes, setNotes] = useState('');
  const [address, setAddress] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [createPerson, { loading }] = useMutation(CREATE_PERSON, {
    refetchQueries: ['TreeCanvas'],
  });

  return (
    <form
      className="flex flex-col gap-2.5"
      onSubmit={(event) => {
        event.preventDefault();
        void createPerson({
          variables: {
            input: {
              treeId,
              firstName: firstName || null,
              lastName: lastName || null,
              birthName: birthName || null,
              namePrefix: namePrefix || null,
              nameSuffix: nameSuffix || null,
              nickname: nickname || null,
              sex: sex as Sex,
              notes: notes || null,
              address: address || null,
              email: email || null,
              phone: phone || null,
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
      <label className={addLabelClass}>
        {t('firstNamesL')}
        <input
          autoFocus
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          className={fieldClass}
        />
      </label>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <label className={addLabelClass}>
          {t('familyNameL')}
          <input
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className={fieldClass}
          />
        </label>
        <label className={addLabelClass}>
          {t('maidenNameL')}
          <input
            value={birthName}
            onChange={(e) => setBirthName(e.target.value)}
            className={fieldClass}
          />
        </label>
      </div>
      <label className={addLabelClass}>
        {t('sexL')}
        <div className="grid grid-cols-3 gap-2">
          {SEXES.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setSex(value)}
              className={`rounded-lg border px-2 py-2 text-sm font-medium transition ${
                sex === value
                  ? 'border-amber-500 bg-amber-50 text-amber-800 dark:bg-stone-800 dark:text-amber-300'
                  : 'border-stone-200 text-stone-500 hover:border-amber-300 dark:border-stone-700 dark:text-stone-300'
              }`}
            >
              {enumLabel('sex', value, lang)}
            </button>
          ))}
        </div>
      </label>
      <details className="rounded-xl border border-stone-200/70 px-3 py-2 dark:border-stone-700/60">
        <summary className="cursor-pointer select-none text-xs font-medium text-stone-500 marker:text-stone-400 dark:text-stone-400">
          {t('moreInfo')}
        </summary>
        <div className="mt-2 flex flex-col gap-2">
          <input
            placeholder={t('nicknameL')}
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            className={fieldClass}
          />
          <div className="flex gap-2">
            <input
              list="add-name-prefix-options"
              placeholder={t('prefixL')}
              value={namePrefix}
              onChange={(e) => setNamePrefix(e.target.value)}
              className={`${fieldClass} flex-1`}
            />
            <input
              list="add-name-suffix-options"
              placeholder={t('suffixL')}
              value={nameSuffix}
              onChange={(e) => setNameSuffix(e.target.value)}
              className={`${fieldClass} flex-1`}
            />
            <datalist id="add-name-prefix-options">
              {NAME_PREFIXES.map((value) => (
                <option key={value} value={value} />
              ))}
            </datalist>
            <datalist id="add-name-suffix-options">
              {NAME_SUFFIXES.map((value) => (
                <option key={value} value={value} />
              ))}
            </datalist>
          </div>
          <textarea
            placeholder={t('notesL')}
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
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
            value={address}
            onChange={setAddress}
            placeholder={t('addressL')}
            className={fieldClass}
          />
          <input
            type="email"
            placeholder={t('emailL')}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={fieldClass}
          />
          <input
            type="tel"
            placeholder={t('phoneL')}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className={fieldClass}
          />
        </div>
      </details>
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
  const { t, lang } = useI18n();
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
        type: union.type,
        dissolved: union.dissolved,
        date: union.date,
        partnerIds: union.partners.map((p) => p.id),
        childIds: union.children.map((c) => c.person.id),
      })) ?? [],
    [tree],
  );
  const others = tree?.persons ?? [];
  const sources = sourcesData?.tree.sources ?? [];

  // Kinship of every person relative to the viewer's own card ("moi").
  const selfId = tree?.mySelfPersonId ?? null;
  const kinship = useMemo(() => {
    const labels = new Map<string, string>();
    if (!selfId || !tree) return labels;
    const kins = computeKinships(selfId, tree.persons, treeUnions);
    for (const person of tree.persons) {
      const kin = kins.get(person.id);
      if (kin) labels.set(person.id, kinshipLabel(kin, person.sex, lang));
    }
    return labels;
  }, [selfId, tree, treeUnions, lang]);

  // Classic tree vs radial fan (ancestors) view.
  const [view, setView] = useState<'tree' | 'fan'>('tree');
  const [fanFocusId, setFanFocusId] = useState<string | null>(null);

  // Default the fan to the person with the deepest known ancestry, so it isn't
  // empty (a random root person would have no ancestors to fan out).
  const deepestId = useMemo(() => {
    const parents = new Map<string, string[]>();
    for (const u of treeUnions) {
      for (const c of u.childIds) {
        parents.set(c, [...(parents.get(c) ?? []), ...u.partnerIds]);
      }
    }
    const memo = new Map<string, number>();
    const depth = (id: string): number => {
      const cached = memo.get(id);
      if (cached !== undefined) return cached;
      memo.set(id, 0); // guard against cycles
      const ps = parents.get(id) ?? [];
      const d = ps.length ? 1 + Math.max(...ps.map(depth)) : 0;
      memo.set(id, d);
      return d;
    };
    let best: string | null = null;
    let bestDepth = -1;
    for (const p of tree?.persons ?? []) {
      const d = depth(p.id);
      if (d > bestDepth) {
        bestDepth = d;
        best = p.id;
      }
    }
    return best;
  }, [tree, treeUnions]);

  const fanFocus =
    fanFocusId ??
    (panel?.kind === 'person' ? panel.id : null) ??
    deepestId ??
    tree?.persons[0]?.id ??
    null;

  // Fan navigation: how many generations to show, and a focus history for "back".
  const [fanGen, setFanGen] = useState(4);
  const [fanHistory, setFanHistory] = useState<string[]>([]);
  const focusFan = (id: string) => {
    if (fanFocus && fanFocus !== id) setFanHistory((h) => [...h, fanFocus]);
    setFanFocusId(id);
  };
  const fanBack = () => {
    setFanHistory((h) => {
      const prev = h[h.length - 1];
      if (prev !== undefined) setFanFocusId(prev);
      return h.slice(0, -1);
    });
  };

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
              ? displayName(others.find((x) => x.id === panel.id)) || '—'
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
            onClick={() => setView((v) => (v === 'tree' ? 'fan' : 'tree'))}
            className={headerButton}
          >
            <FontAwesomeIcon
              icon={view === 'tree' ? icons.chartPie : icons.sitemap}
              className="sm:mr-1.5"
            />
            <span className="hidden sm:inline">
              {view === 'tree' ? t('fanView') : t('treeView')}
            </span>
          </button>
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
          view === 'fan' && fanFocus ? (
            <FanChart
              persons={tree.persons as TreePerson[]}
              unions={treeUnions}
              focusId={fanFocus}
              onFocus={focusFan}
              maxGen={fanGen}
            />
          ) : (
            <TreeCanvas
              persons={tree.persons as TreePerson[]}
              unions={treeUnions}
              kinship={kinship}
              selfId={selfId}
              selectedId={panel?.kind === 'person' ? panel.id : null}
              selectedUnionId={panel?.kind === 'union' ? panel.id : null}
              isAdmin={isAdmin ?? false}
              onRemovePersons={removePersons}
              positions={pos.positions}
              move={pos.move}
              commit={pos.commit}
              reset={pos.reset}
              resetAll={pos.resetAll}
              onSelect={(value) =>
                setPanel(value ? { kind: 'person', id: value } : null)
              }
              onSelectUnion={(unionId) =>
                setPanel({ kind: 'union', id: unionId })
              }
            />
          )
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

      {view === 'fan' && tree && tree.persons.length > 0 && (
        <div className="pointer-events-auto absolute bottom-4 left-4 z-10 flex items-center gap-1 rounded-full bg-white/90 p-1 shadow-md ring-1 ring-stone-200 backdrop-blur dark:bg-stone-900/90 dark:ring-stone-700">
          <button
            type="button"
            onClick={fanBack}
            disabled={fanHistory.length === 0}
            aria-label={t('back')}
            title={t('back')}
            className="grid size-8 place-items-center rounded-full text-sm text-stone-500 transition hover:bg-stone-100 disabled:opacity-30 dark:text-stone-300 dark:hover:bg-stone-800"
          >
            <FontAwesomeIcon icon={icons.arrowLeft} />
          </button>
          <span className="mx-0.5 h-5 w-px bg-stone-200 dark:bg-stone-700" />
          <button
            type="button"
            onClick={() => setFanGen((g) => Math.max(2, g - 1))}
            disabled={fanGen <= 2}
            aria-label={t('fewerLevels')}
            title={t('fewerLevels')}
            className="grid size-8 place-items-center rounded-full text-sm text-stone-500 transition hover:bg-stone-100 disabled:opacity-30 dark:text-stone-300 dark:hover:bg-stone-800"
          >
            <FontAwesomeIcon icon={icons.minus} />
          </button>
          <span className="min-w-4 text-center text-xs font-semibold tabular-nums text-stone-600 dark:text-stone-300">
            {fanGen}
          </span>
          <button
            type="button"
            onClick={() => setFanGen((g) => Math.min(8, g + 1))}
            disabled={fanGen >= 8}
            aria-label={t('moreLevels')}
            title={t('moreLevels')}
            className="grid size-8 place-items-center rounded-full text-sm text-stone-500 transition hover:bg-stone-100 disabled:opacity-30 dark:text-stone-300 dark:hover:bg-stone-800"
          >
            <FontAwesomeIcon icon={icons.plus} />
          </button>
        </div>
      )}

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
              selfPersonId={selfId}
              sources={sources}
              isAdmin={isAdmin ?? false}
              onError={fail}
              onOpenUnion={(unionId) => setPanel({ kind: 'union', id: unionId })}
              onOpenPerson={(pid) => setPanel({ kind: 'person', id: pid })}
              onPlaceRelative={placeRelative}
              onDeleted={() => setPanel(null)}
            />
          )}
          {panel.kind === 'union' && (
            <UnionPanel
              key={panel.id}
              unionId={panel.id}
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
