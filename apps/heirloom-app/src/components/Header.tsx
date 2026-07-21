import { useI18n } from '../lib/i18n';
import { useTheme } from '../lib/theme';

export function Header() {
  const { lang, setLang, t } = useI18n();
  const { theme, toggle } = useTheme();

  return (
    <header className="sticky top-0 z-10 border-b border-stone-200/80 bg-stone-50/80 backdrop-blur dark:border-stone-800 dark:bg-stone-950/80">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-baseline gap-3">
          <span className="font-display text-xl font-semibold tracking-tight text-stone-900 dark:text-stone-100">
            Heirloom
          </span>
          <span className="hidden text-xs text-stone-500 sm:block dark:text-stone-400">
            {t('tagline')}
          </span>
        </div>

        <nav className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setLang(lang === 'fr' ? 'en' : 'fr')}
            className="rounded-lg px-2.5 py-1.5 text-sm font-medium text-stone-600 transition hover:bg-stone-200/60 dark:text-stone-300 dark:hover:bg-stone-800"
            aria-label={lang === 'fr' ? 'Switch to English' : 'Passer en français'}
          >
            {lang === 'fr' ? 'EN' : 'FR'}
          </button>
          <button
            type="button"
            onClick={toggle}
            className="rounded-lg px-2.5 py-1.5 text-sm text-stone-600 transition hover:bg-stone-200/60 dark:text-stone-300 dark:hover:bg-stone-800"
            aria-label={theme === 'dark' ? 'Light mode' : 'Dark mode'}
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          <a
            href="/login"
            className="ml-1 rounded-lg bg-stone-900 px-3.5 py-1.5 text-sm font-medium text-stone-50 transition hover:bg-stone-700 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-stone-300"
          >
            {t('login')}
          </a>
        </nav>
      </div>
    </header>
  );
}
