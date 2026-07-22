import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  AuthCard,
  FormError,
  inputClass,
  primaryButtonClass,
} from '../components/forms';
import { useAuth, type TreeRole } from '../lib/auth';
import { useI18n, type TranslationKey } from '../lib/i18n';
import { useTitle } from '../lib/useTitle';

interface InvitationInfo {
  treeName: string;
  role: TreeRole;
}

// Contributor invitation flow: the visitor signs up or logs in, and the tree
// is added to their account. A logged-in visitor just confirms.
export function InviteAccept() {
  const { t } = useI18n();
  const { token = '' } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading, login, acceptInvitation } = useAuth();

  const [invitation, setInvitation] = useState<InvitationInfo | null>(null);
  const [status, setStatus] = useState<'loading' | 'ok' | 'invalid'>('loading');
  const [tab, setTab] = useState<'signup' | 'login'>('signup');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useTitle(t('inviteTitle'));

  useEffect(() => {
    let cancelled = false;
    void fetch(`/api/auth/invitations/${token}`, { credentials: 'include' })
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then((data: InvitationInfo) => {
        if (cancelled) return;
        setInvitation(data);
        setStatus('ok');
      })
      .catch(() => {
        if (!cancelled) setStatus('invalid');
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  const join = async (accept: () => Promise<{ treeId: string }>) => {
    setBusy(true);
    setError(null);
    try {
      const { treeId } = await accept();
      navigate(`/trees/${treeId}`);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  if (status === 'loading' || authLoading) {
    return (
      <div className="grid flex-1 place-items-center py-20">
        <span className="size-8 animate-spin rounded-full border-2 border-amber-500/30 border-t-amber-500" />
      </div>
    );
  }

  if (status === 'invalid' || !invitation) {
    return (
      <AuthCard title={t('inviteTitle')} subtitle={t('inviteInvalid')}>
        <Link to="/" className={`${primaryButtonClass} block text-center`}>
          {t('backHome')}
        </Link>
      </AuthCard>
    );
  }

  const subtitle =
    invitation.role === 'CONTRIBUTOR'
      ? t('inviteContributorSub')
      : t('inviteViewerSub');
  const roleLabel = t(`role${invitation.role}` as TranslationKey);

  const treeBadge = (
    <div className="mb-5 rounded-2xl bg-amber-50 px-4 py-3 text-center ring-1 ring-amber-900/10 dark:bg-stone-800 dark:ring-stone-700">
      <p className="font-display text-lg font-semibold text-stone-800 dark:text-stone-100">
        {invitation.treeName}
      </p>
      <p className="mt-0.5 text-xs uppercase tracking-wide text-amber-700 dark:text-amber-400">
        {roleLabel}
      </p>
    </div>
  );

  // Already signed in: one-click join.
  if (user) {
    return (
      <AuthCard title={t('inviteTitle')} subtitle={subtitle}>
        {treeBadge}
        <p className="mb-4 text-center text-sm text-stone-500 dark:text-stone-400">
          {t('inviteLoggedInAs')}{' '}
          <span className="font-medium text-stone-700 dark:text-stone-200">
            {user.displayName ?? user.email}
          </span>
        </p>
        <FormError message={error} />
        <button
          type="button"
          disabled={busy}
          onClick={() => void join(() => acceptInvitation(token))}
          className={primaryButtonClass}
        >
          {busy ? t('submitting') : t('inviteJoinButton')}
        </button>
      </AuthCard>
    );
  }

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (tab === 'signup') {
      void join(() =>
        acceptInvitation(token, {
          email,
          password,
          displayName: displayName || undefined,
        }),
      );
    } else {
      // Log in first (sets the session), then attach the membership.
      void join(async () => {
        await login(email, password);
        return acceptInvitation(token);
      });
    }
  };

  const tabButton = (value: 'signup' | 'login', label: string) => (
    <button
      type="button"
      onClick={() => {
        setTab(value);
        setError(null);
      }}
      className={`flex-1 rounded-xl px-3 py-2 text-sm font-medium transition ${
        tab === value
          ? 'bg-amber-600 text-white shadow-sm'
          : 'text-stone-500 hover:bg-amber-100/60 dark:text-stone-300 dark:hover:bg-stone-800'
      }`}
    >
      {label}
    </button>
  );

  return (
    <AuthCard title={t('inviteTitle')} subtitle={subtitle}>
      {treeBadge}
      <div className="mb-4 flex gap-1 rounded-2xl bg-stone-100 p-1 dark:bg-stone-800/60">
        {tabButton('signup', t('signUp'))}
        {tabButton('login', t('login'))}
      </div>
      <form className="flex flex-col gap-3" onSubmit={onSubmit}>
        {tab === 'signup' && (
          <input
            type="text"
            autoComplete="name"
            placeholder={t('displayName')}
            aria-label={t('displayName')}
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            className={inputClass}
          />
        )}
        <input
          type="email"
          required
          autoComplete="email"
          placeholder={t('email')}
          aria-label={t('email')}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className={inputClass}
        />
        <input
          type="password"
          required
          minLength={tab === 'signup' ? 8 : undefined}
          autoComplete={tab === 'signup' ? 'new-password' : 'current-password'}
          placeholder={t('password')}
          aria-label={t('password')}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className={inputClass}
        />
        <FormError message={error} />
        <button type="submit" disabled={busy} className={primaryButtonClass}>
          {busy ? t('submitting') : t('inviteJoinButton')}
        </button>
      </form>
    </AuthCard>
  );
}
