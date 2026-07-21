import type { ReactNode } from 'react';

export const inputClass =
  'w-full rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-sm text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-stone-700 dark:bg-stone-950 dark:text-stone-100 dark:placeholder:text-stone-600';

export const primaryButtonClass =
  'w-full rounded-xl bg-gradient-to-b from-amber-600 to-amber-700 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:from-amber-500 hover:to-amber-600 disabled:cursor-not-allowed disabled:opacity-40';

export function AuthCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <main className="mx-auto flex w-full max-w-md flex-col px-4 pb-16 pt-14 sm:pt-20">
      <div className="rounded-3xl bg-white p-6 shadow-xl shadow-amber-900/10 ring-1 ring-amber-900/10 sm:p-8 dark:bg-stone-900 dark:shadow-black/30 dark:ring-stone-700/60">
        <h1 className="font-display text-2xl font-semibold tracking-tight text-stone-900 dark:text-stone-50">
          {title}
        </h1>
        <p className="mt-1.5 text-sm leading-relaxed text-stone-500 dark:text-stone-400">
          {subtitle}
        </p>
        <div className="mt-6">{children}</div>
      </div>
    </main>
  );
}

export function FormError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p className="rounded-xl bg-red-50 px-3.5 py-2.5 text-sm text-red-800 ring-1 ring-red-200 dark:bg-red-950 dark:text-red-300 dark:ring-red-900">
      {message}
    </p>
  );
}
