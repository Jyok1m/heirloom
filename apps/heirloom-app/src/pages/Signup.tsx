import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthCard, FormError, inputClass, primaryButtonClass } from '../components/forms';
import { useAuth } from '../lib/auth';
import { useI18n } from '../lib/i18n';
import { useTitle } from '../lib/useTitle';

// Creates the first (admin) account of the instance; further members join
// through invitation links sent by an admin.
export function Signup() {
  const { t } = useI18n();
  const { signup } = useAuth();
  useTitle(t('signUp'));
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  return (
    <AuthCard title={t('signUpTitle')} subtitle={t('signUpSubtitle')}>
      <form
        className="flex flex-col gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          setBusy(true);
          setError(null);
          signup(email, password, displayName || undefined)
            .then(() => navigate('/trees'))
            .catch((err: Error) => setError(err.message))
            .finally(() => setBusy(false));
        }}
      >
        <input
          type="text"
          autoComplete="name"
          placeholder={t('displayName')}
          aria-label={t('displayName')}
          value={displayName}
          onChange={(event) => setDisplayName(event.target.value)}
          className={inputClass}
        />
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
          minLength={8}
          autoComplete="new-password"
          placeholder={t('password')}
          aria-label={t('password')}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className={inputClass}
        />
        <FormError message={error} />
        <button type="submit" disabled={busy} className={primaryButtonClass}>
          {busy ? t('submitting') : t('signUp')}
        </button>
      </form>
      <p className="mt-5 text-center text-sm text-stone-500 dark:text-stone-400">
        {t('haveAccount')}{' '}
        <Link
          to="/login"
          className="font-medium text-amber-700 hover:underline dark:text-amber-400"
        >
          {t('login')}
        </Link>
      </p>
    </AuthCard>
  );
}
