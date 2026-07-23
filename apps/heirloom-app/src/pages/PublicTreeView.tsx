import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import type { PositionOverrides, TreePerson, TreeUnion } from '../components/tree2d/layout';
import { TreeCanvas } from '../components/tree2d/TreeCanvas';
import { displayName, enumLabel } from '../lib/genealogy';
import { DEATH_SYMBOL, icons } from '../lib/icons';
import { useI18n } from '../lib/i18n';
import { useTitle } from '../lib/useTitle';

interface Snapshot {
  id: string;
  name: string;
  persons: TreePerson[];
  unions: TreeUnion[];
}

// A read-only canvas never moves cards, so it needs no position store.
const NO_POSITIONS: PositionOverrides = new Map();
const noop = () => {};
const noopAsync = async () => {};

const headerButton =
  'pointer-events-auto rounded-full bg-white/85 px-3.5 py-1.5 text-sm font-medium text-stone-600 shadow-sm ring-1 ring-stone-200 backdrop-blur transition hover:bg-white dark:bg-stone-800/85 dark:text-stone-300 dark:ring-stone-700';

// Public, unauthenticated read-only view of a shared tree (viewer link).
export function PublicTreeView() {
  const { token = '' } = useParams();
  const { t, lang } = useI18n();
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [status, setStatus] = useState<'loading' | 'ok' | 'invalid'>('loading');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useTitle(snapshot?.name);

  useEffect(() => {
    let cancelled = false;
    void fetch(`/api/public/trees/${token}`, { credentials: 'include' })
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then((data: Snapshot) => {
        if (cancelled) return;
        setSnapshot(data);
        setStatus('ok');
      })
      .catch(() => {
        if (!cancelled) setStatus('invalid');
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  const selected = useMemo(
    () => snapshot?.persons.find((person) => person.id === selectedId) ?? null,
    [snapshot, selectedId],
  );

  if (status === 'loading') {
    return (
      <div className="grid flex-1 place-items-center py-20">
        <span className="size-8 animate-spin rounded-full border-2 border-amber-500/30 border-t-amber-500" />
      </div>
    );
  }

  if (status === 'invalid' || !snapshot) {
    return (
      <div className="grid flex-1 place-items-center px-6 py-20">
        <div className="max-w-sm text-center">
          <FontAwesomeIcon
            icon={icons.seedling}
            className="mb-3 text-2xl text-stone-400"
          />
          <p className="text-sm leading-relaxed text-stone-500 dark:text-stone-400">
            {t('publicTreeInvalid')}
          </p>
          <Link to="/" className={`${headerButton} mt-4 inline-block`}>
            {t('backHome')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <main className="relative flex-1">
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex flex-wrap items-center gap-2 px-4 py-3">
        <Link to="/" className={headerButton}>
          <FontAwesomeIcon icon={icons.arrowLeft} className="sm:mr-1.5" />
          <span className="hidden sm:inline">Heirloom</span>
        </Link>
        <h1 className="font-display text-lg font-semibold text-stone-800 dark:text-stone-100">
          {snapshot.name}
        </h1>
        <span className="rounded-full bg-white/85 px-2.5 py-1 text-xs font-medium text-stone-500 ring-1 ring-stone-200 backdrop-blur dark:bg-stone-800/85 dark:text-stone-400 dark:ring-stone-700">
          <FontAwesomeIcon icon={icons.eye} className="mr-1.5" />
          {t('publicViewBadge')}
        </span>
      </div>

      <div className="h-[calc(100dvh-3.5rem)] w-full bg-[#faf7f0] bg-[radial-gradient(circle_at_1px_1px,rgba(120,113,108,0.12)_1px,transparent_0)] bg-size-[22px_22px] dark:bg-stone-950 dark:bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.05)_1px,transparent_0)]">
        {snapshot.persons.length > 0 ? (
          <TreeCanvas
            persons={snapshot.persons}
            unions={snapshot.unions}
            selectedId={selectedId}
            selectedUnionId={null}
            isAdmin={false}
            readOnly
            mediaUrl={(id) => `/api/public/trees/${token}/media/${id}/file`}
            onRemovePersons={noopAsync}
            positions={NO_POSITIONS}
            move={noop}
            commit={noop}
            reset={noop}
            resetAll={noop}
            onSelect={setSelectedId}
            onSelectUnion={noop}
          />
        ) : (
          <div className="grid h-full place-items-center px-6">
            <p className="max-w-sm text-center text-sm leading-relaxed text-stone-500 dark:text-stone-400">
              <FontAwesomeIcon icon={icons.seedling} className="mr-1.5" />
              {t('emptyTree')}
            </p>
          </div>
        )}
      </div>

      {selected && (
        <aside className="absolute bottom-4 right-4 top-16 z-10 w-72 max-w-[calc(100vw-2rem)] overflow-y-auto rounded-3xl bg-white/95 p-5 shadow-2xl ring-1 ring-amber-900/10 backdrop-blur dark:bg-stone-900/95 dark:ring-stone-700">
          <div className="mb-4 flex items-start justify-between gap-2">
            <h2 className="font-display text-lg font-semibold text-stone-900 dark:text-stone-50">
              {displayName(selected) || '—'}
            </h2>
            <button
              type="button"
              onClick={() => setSelectedId(null)}
              aria-label={t('close')}
              className="rounded-lg px-2 py-1 text-sm text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800"
            >
              <FontAwesomeIcon icon={icons.xmark} />
            </button>
          </div>
          <p className="text-sm text-stone-500 dark:text-stone-400">
            {t('sexL')}: {enumLabel('sex', selected.sex, lang)}
          </p>
          {selected.birthDate && (
            <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
              <FontAwesomeIcon icon={icons.child} className="mr-1.5" />
              {selected.birthDate}
            </p>
          )}
          {selected.deceased && (
            <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
              <FontAwesomeIcon icon={DEATH_SYMBOL.NEUTRAL} className="mr-1.5" />
              {t('deceased')}
            </p>
          )}
        </aside>
      )}
    </main>
  );
}
