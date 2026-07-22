import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { ReactNode } from 'react';
import { displayName, type DisplayNameParts } from '../../lib/genealogy';
import { icons } from '../../lib/icons';

export const fieldClass =
  'w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-stone-700 dark:bg-stone-950 dark:text-stone-100 dark:placeholder:text-stone-600';

export const smallButton =
  'rounded-lg bg-linear-to-b from-amber-600 to-amber-700 px-3 py-1.5 text-sm font-medium text-white shadow-sm transition hover:from-amber-500 hover:to-amber-600 disabled:cursor-not-allowed disabled:opacity-40';

export const ghostButton =
  'rounded-lg px-2 py-1 text-xs text-stone-400 transition hover:bg-stone-100 hover:text-stone-600 dark:hover:bg-stone-800';

export function Section({
  title,
  action,
  children,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="mt-5 border-t border-stone-200 pt-4 dark:border-stone-700">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-stone-400">
          {title}
        </h3>
        {action}
      </div>
      {children}
    </section>
  );
}

export function Chip({
  children,
  onRemove,
}: {
  children: ReactNode;
  onRemove?: () => void;
}) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs text-stone-700 dark:bg-stone-800 dark:text-stone-200">
      {children}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="text-stone-400 transition hover:text-red-600"
          aria-label="remove"
        >
          <FontAwesomeIcon icon={icons.xmark} />
        </button>
      )}
    </span>
  );
}

export const personName = (p?: DisplayNameParts) => displayName(p) || '(?)';
