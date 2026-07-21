import { useState } from 'react';
import { useI18n } from '../lib/i18n';
import { ChatPanel } from './ChatPanel';

// Floating assistant, bottom-right, for logged-in users
export function ChatWidget({ treeId }: { treeId?: string }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);

  return (
    <>
      {open && (
        <div className="fixed inset-x-3 bottom-24 z-40 sm:inset-x-auto sm:right-5 sm:w-[400px]">
          <ChatPanel treeId={treeId} />
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label={t('chatTitle')}
        aria-expanded={open}
        className="fixed bottom-5 right-5 z-40 grid size-14 place-items-center rounded-full bg-linear-to-br from-amber-500 to-amber-700 text-xl text-white shadow-lg shadow-amber-900/30 transition hover:scale-105 hover:from-amber-400 hover:to-amber-600"
      >
        {open ? (
          <svg viewBox="0 0 20 20" fill="currentColor" className="size-5">
            <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
          </svg>
        ) : (
          '✦'
        )}
      </button>
    </>
  );
}
