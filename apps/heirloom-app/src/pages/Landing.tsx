import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Link } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { icons } from '../lib/icons';
import { useI18n } from '../lib/i18n';
import { useTitle } from '../lib/useTitle';

const primaryCta =
  'rounded-full bg-linear-to-b from-amber-600 to-amber-700 px-6 py-3 text-sm font-medium text-white shadow-md shadow-amber-900/20 transition hover:from-amber-500 hover:to-amber-600';
const secondaryCta =
  'rounded-full border border-amber-700/25 px-6 py-3 text-sm font-medium text-amber-800 transition hover:bg-amber-100/60 dark:border-amber-500/30 dark:text-amber-300 dark:hover:bg-stone-800';

function Feature({
  icon,
  title,
  text,
}: {
  icon: IconDefinition;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-2xl bg-white/70 p-4 ring-1 ring-amber-900/10 dark:bg-stone-900/70 dark:ring-stone-800">
      <div className="flex items-center gap-2.5">
        <span className="grid size-8 place-items-center rounded-lg bg-amber-100 text-amber-700 dark:bg-stone-800 dark:text-amber-400">
          <FontAwesomeIcon icon={icon} />
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
  useTitle();

  return (
    <main className="mx-auto flex max-w-5xl flex-col items-center px-4 pb-20 pt-14 sm:px-6 sm:pt-20">
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

        <div className="mt-8 flex flex-col items-center gap-3">
          {user ? (
            <>
              <Link to="/trees" className={primaryCta}>
                <FontAwesomeIcon icon={icons.tree} className="mr-2" />
                {t('treesTitle')}
              </Link>
              <p className="text-sm text-stone-500 dark:text-stone-400">
                {t('signInTitle')}, {user.displayName ?? user.email}
              </p>
            </>
          ) : (
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link to="/login" className={primaryCta}>
                {t('login')}
              </Link>
              <Link to="/signup" className={secondaryCta}>
                {t('createInstance')}
              </Link>
            </div>
          )}
        </div>
      </div>

      <div className="mt-14 grid w-full max-w-3xl gap-3 sm:grid-cols-3">
        <Feature
          icon={icons.tree}
          title={t('featureTree')}
          text={t('featureTreeText')}
        />
        <Feature
          icon={icons.house}
          title={t('featureSelfHosted')}
          text={t('featureSelfHostedText')}
        />
        <Feature
          icon={icons.assistant}
          title={t('featureAssistant')}
          text={t('featureAssistantText')}
        />
      </div>
    </main>
  );
}
