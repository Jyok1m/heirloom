import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { useI18n } from '../lib/i18n';
import { useTheme } from '../lib/theme';

export function Header() {
  const { lang, setLang, t } = useI18n();
  const { theme, toggle } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-10 border-b border-amber-900/10 bg-[#faf7f0]/85 backdrop-blur dark:border-stone-800 dark:bg-stone-900/85">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2.5">
          <span className="grid size-8 place-items-center rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 text-sm text-white shadow-sm">
            🌳
          </span>
          <span className="font-display text-xl font-semibold tracking-tight text-stone-800 dark:text-stone-100">
            Heirloom
          </span>
        </Link>

        <nav className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setLang(lang === 'fr' ? 'en' : 'fr')}
            className="rounded-lg px-2.5 py-1.5 text-sm font-medium text-stone-500 transition hover:bg-amber-100/60 hover:text-stone-800 dark:text-stone-300 dark:hover:bg-stone-800"
            aria-label={lang === 'fr' ? 'Switch to English' : 'Passer en français'}
          >
            {lang === 'fr' ? 'EN' : 'FR'}
          </button>
          <button
            type="button"
            onClick={toggle}
            className="rounded-lg px-2.5 py-1.5 text-sm text-stone-500 transition hover:bg-amber-100/60 dark:text-stone-300 dark:hover:bg-stone-800"
            aria-label={theme === 'dark' ? 'Light mode' : 'Dark mode'}
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>

          {user ? (
            <>
              <Link
                to="/trees"
                className="hidden rounded-lg px-2.5 py-1.5 text-sm font-medium text-stone-600 transition hover:bg-amber-100/60 sm:block dark:text-stone-300 dark:hover:bg-stone-800"
              >
                {t('treesTitle')}
              </Link>
              <button
                type="button"
                onClick={() => {
                  void logout().then(() => navigate('/'));
                }}
                className="ml-1 rounded-full border border-amber-700/20 px-3.5 py-1.5 text-sm font-medium text-amber-800 transition hover:bg-amber-100/60 dark:border-amber-500/30 dark:text-amber-300 dark:hover:bg-stone-800"
              >
                {t('logout')}
              </button>
            </>
          ) : (
            <Link
              to="/login"
              className="ml-1 rounded-full bg-gradient-to-b from-amber-600 to-amber-700 px-4 py-1.5 text-sm font-medium text-white shadow-sm transition hover:from-amber-500 hover:to-amber-600"
            >
              {t('login')}
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
