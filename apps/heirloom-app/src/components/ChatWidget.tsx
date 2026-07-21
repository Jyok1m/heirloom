import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useState } from 'react';
import { icons } from '../lib/icons';
import { useI18n } from '../lib/i18n';
import { ChatPanel } from './ChatPanel';

// Floating assistant, bottom-right, for logged-in users
export function ChatWidget({ treeId }: { treeId?: string }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);

  return (
    <>
      {open && (
        <div className="fixed inset-x-3 bottom-24 z-40 sm:inset-x-auto sm:right-5 sm:w-100">
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
        <FontAwesomeIcon
          icon={open ? icons.xmark : icons.assistant}
          className="size-5"
        />
      </button>
    </>
  );
}
