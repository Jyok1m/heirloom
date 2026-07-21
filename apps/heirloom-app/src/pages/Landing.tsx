import { Link } from 'react-router-dom';
import { ChatPanel } from '../components/ChatPanel';
import { useAuth } from '../lib/auth';
import { useI18n } from '../lib/i18n';

function Feature({ icon, title, text }: { icon: string; title: string; text: string }) {
  return (
    <div className="rounded-2xl bg-white/70 p-4 ring-1 ring-amber-900/10 dark:bg-stone-900/70 dark:ring-stone-800">
      <div className="flex items-center gap-2.5">
        <span className="grid size-8 place-items-center rounded-lg bg-amber-100 text-base dark:bg-stone-800">
          {icon}
        </span>
        <h3 className="text-sm font-semibold text-stone-800 dark:text-stone-100">
          {title}
        </h3>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-stone-500 dark:text-stone-400">
        {text}
      </p>
    </div>
  );
}

export function Landing() {
  const { t } = useI18n();
  const { user } = useAuth();

  return (
    <main className="mx-auto flex max-w-5xl flex-col items-center px-4 pb-16 pt-12 sm:px-6 sm:pt-16">
      <div className="max-w-2xl text-center">
        <p className="mx-auto w-fit rounded-full bg-amber-100/80 px-3 py-1 text-xs font-medium tracking-wide text-amber-800 dark:bg-amber-950 dark:text-amber-300">
          {t('tagline')}
        </p>
        <h1 className="mt-5 font-display text-4xl font-semibold tracking-tight text-stone-900 sm:text-5xl dark:text-stone-50">
          {t('heroTitle')}
        </h1>
        <p className="mt-4 text-base leading-relaxed text-stone-600 sm:text-lg dark:text-stone-400">
          {t('heroSubtitle')}
        </p>
      </div>

      <div className="mt-10 w-full max-w-2xl">
        {user ? (
          <div className="flex justify-center">
            <Link
              to="/trees"
              className="rounded-full bg-linear-to-b from-amber-600 to-amber-700 px-6 py-3 text-sm font-medium text-white shadow-md shadow-amber-900/20 transition hover:from-amber-500 hover:to-amber-600"
            >
              {t('treesTitle')} →
            </Link>
          </div>
        ) : (
          <ChatPanel />
        )}
      </div>

      <div className="mt-10 grid w-full max-w-3xl gap-3 sm:grid-cols-3">
        <Feature icon="🌳" title={t('featureTree')} text={t('featureTreeText')} />
        <Feature
          icon="✦"
          title={t('featureAssistant')}
          text={t('featureAssistantText')}
        />
        <Feature
          icon="🏠"
          title={t('featureSelfHosted')}
          text={t('featureSelfHostedText')}
        />
      </div>
    </main>
  );
}
