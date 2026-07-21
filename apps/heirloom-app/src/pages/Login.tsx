import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthCard, FormError, inputClass, primaryButtonClass } from '../components/forms';
import { useAuth } from '../lib/auth';
import { useI18n } from '../lib/i18n';
import { useTitle } from '../lib/useTitle';

export function Login() {
  const { t } = useI18n();
  const { login } = useAuth();
  useTitle(t('login'));
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  return (
    <AuthCard title={t('signInTitle')} subtitle={t('signInSubtitle')}>
      <form
        className="flex flex-col gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          setBusy(true);
          setError(null);
          login(email, password)
            .then(() => navigate('/trees'))
            .catch((err: Error) => setError(err.message))
            .finally(() => setBusy(false));
        }}
      >
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
          autoComplete="current-password"
          placeholder={t('password')}
          aria-label={t('password')}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className={inputClass}
        />
        <FormError message={error} />
        <button type="submit" disabled={busy} className={primaryButtonClass}>
          {busy ? t('submitting') : t('login')}
        </button>
      </form>
      <p className="mt-5 text-center text-sm text-stone-500 dark:text-stone-400">
        {t('noAccount')}{' '}
        <Link
          to="/signup"
          className="font-medium text-amber-700 hover:underline dark:text-amber-400"
        >
          {t('createInstance')}
        </Link>
      </p>
    </AuthCard>
  );
}
