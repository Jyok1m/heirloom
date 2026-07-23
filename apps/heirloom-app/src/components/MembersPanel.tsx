import { useCallback, useEffect, useState } from 'react';
import { useI18n, type TranslationKey } from '../lib/i18n';
import { useNotify } from '../lib/notify';
import { primaryButtonClass } from './forms';

interface Member {
  userId: string;
  email: string;
  displayName: string | null;
  role: 'VIEWER' | 'CONTRIBUTOR';
}

interface Invitation {
  id: string;
  role: 'VIEWER' | 'CONTRIBUTOR';
  expiresAt: string;
  url: string;
}

interface ShareState {
  enabled: boolean;
  url: string | null;
}

async function api(path: string, init?: RequestInit): Promise<unknown> {
  const response = await fetch(path, { credentials: 'include', ...init });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

// Admin-only: members of a tree, its public view link, and contributor invites.
export function MembersPanel({ treeId }: { treeId: string }) {
  const { t } = useI18n();
  const { confirm, confirmType } = useNotify();
  const [members, setMembers] = useState<Member[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [share, setShare] = useState<ShareState>({ enabled: false, url: null });
  const [copied, setCopied] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(() => {
    void api(`/api/auth/members/${treeId}`).then((data) =>
      setMembers(data as Member[]),
    );
    void api(`/api/auth/invitations/pending/${treeId}`).then((data) =>
      setInvitations(data as Invitation[]),
    );
    void api(`/api/trees/${treeId}/share`).then((data) =>
      setShare(data as ShareState),
    );
  }, [treeId]);

  useEffect(refresh, [refresh]);

  const copy = (id: string, url: string) => {
    void navigator.clipboard.writeText(url).then(() => {
      setCopied(id);
      setTimeout(() => setCopied(null), 1500);
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <section>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-stone-400">
          {t('membersTitle')}
        </h3>
        {members.length === 0 && (
          <p className="text-sm text-stone-400 dark:text-stone-500">
            {t('noMembers')}
          </p>
        )}
        {members.map((member) => (
          <div
            key={member.userId}
            className="mb-2 flex items-center justify-between gap-2 rounded-xl bg-amber-50 px-3 py-2 text-sm dark:bg-stone-800"
          >
            <div className="min-w-0">
              <p className="truncate text-stone-800 dark:text-stone-100">
                {member.displayName ?? member.email}
              </p>
              <p className="text-xs text-stone-400">
                {t(`role${member.role}` as TranslationKey)}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                void confirm(t('confirmRemoveMember'), { danger: true }).then(
                  (ok) => {
                    if (ok) {
                      void api(`/api/auth/members/${treeId}/${member.userId}`, {
                        method: 'DELETE',
                      }).then(refresh);
                    }
                  },
                );
              }}
              className="shrink-0 rounded-lg px-2 py-1 text-xs text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950"
            >
              {t('removeMember')}
            </button>
          </div>
        ))}
      </section>

      <section>
        <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-stone-400">
          {t('publicLinkTitle')}
        </h3>
        <p className="mb-2 text-xs text-stone-400 dark:text-stone-500">
          {t('publicLinkHint')}
        </p>
        {share.enabled && share.url ? (
          <>
            <div className="mb-2 flex items-center gap-2 rounded-xl bg-amber-50 px-3 py-2 text-sm dark:bg-stone-800">
              <span className="min-w-0 flex-1 truncate text-xs text-stone-500 dark:text-stone-400">
                {share.url}
              </span>
              <button
                type="button"
                onClick={() => copy('share', share.url as string)}
                className="shrink-0 rounded-lg bg-amber-100 px-2 py-1 text-xs font-medium text-amber-800 transition hover:bg-amber-200 dark:bg-stone-700 dark:text-amber-300"
              >
                {copied === 'share' ? t('copied') : t('copy')}
              </button>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  void confirmType(t('regenerateWord'), {
                    title: t('confirmRegenerateShare'),
                    okText: t('regenerate'),
                  }).then((ok) => {
                    if (ok) {
                      void api(`/api/trees/${treeId}/share/rotate`, {
                        method: 'POST',
                      }).then(refresh);
                    }
                  });
                }}
                className="rounded-lg px-2 py-1 text-xs font-medium text-stone-600 transition hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-800"
              >
                {t('regenerate')}
              </button>
              <button
                type="button"
                onClick={() => {
                  void confirm(t('confirmDisableShare'), { danger: true }).then(
                    (ok) => {
                      if (ok) {
                        void api(`/api/trees/${treeId}/share`, {
                          method: 'DELETE',
                        }).then(refresh);
                      }
                    },
                  );
                }}
                className="rounded-lg px-2 py-1 text-xs text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950"
              >
                {t('disableShare')}
              </button>
            </div>
          </>
        ) : (
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              setBusy(true);
              void api(`/api/trees/${treeId}/share`, { method: 'POST' })
                .then(refresh)
                .finally(() => setBusy(false));
            }}
            className={`${primaryButtonClass} w-auto whitespace-nowrap`}
          >
            {t('enableShare')}
          </button>
        )}
      </section>

      <section>
        <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-stone-400">
          {t('pendingInvites')}
        </h3>
        <p className="mb-2 text-xs text-stone-400 dark:text-stone-500">
          {t('contributorInviteHint')}
        </p>
        {invitations.map((invitation) => (
          <div
            key={invitation.id}
            className="mb-2 flex items-center gap-2 rounded-xl bg-amber-50 px-3 py-2 text-sm dark:bg-stone-800"
          >
            <span className="min-w-0 flex-1 truncate text-xs text-stone-500 dark:text-stone-400">
              {t(`role${invitation.role}` as TranslationKey)} ·{' '}
              {invitation.url.split('/invite/')[1]?.slice(0, 10)}…
            </span>
            <button
              type="button"
              onClick={() => copy(invitation.id, invitation.url)}
              className="shrink-0 rounded-lg bg-amber-100 px-2 py-1 text-xs font-medium text-amber-800 transition hover:bg-amber-200 dark:bg-stone-700 dark:text-amber-300"
            >
              {copied === invitation.id ? t('copied') : t('copy')}
            </button>
            <button
              type="button"
              onClick={() =>
                void api(`/api/auth/invitations/${invitation.id}`, {
                  method: 'DELETE',
                }).then(refresh)
              }
              className="shrink-0 rounded-lg px-2 py-1 text-xs text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950"
            >
              {t('revoke')}
            </button>
          </div>
        ))}

        <button
          type="button"
          disabled={busy}
          onClick={() => {
            setBusy(true);
            void api('/api/auth/invitations', {
              method: 'POST',
              headers: { 'content-type': 'application/json' },
              body: JSON.stringify({ treeId, role: 'CONTRIBUTOR' }),
            })
              .then(refresh)
              .finally(() => setBusy(false));
          }}
          className={`${primaryButtonClass} mt-1 w-auto whitespace-nowrap`}
        >
          {busy ? t('submitting') : `+ ${t('inviteContributor')}`}
        </button>
      </section>
    </div>
  );
}
