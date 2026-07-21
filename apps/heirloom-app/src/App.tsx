import { ChatPanel } from './components/ChatPanel';
import { Header } from './components/Header';
import { useI18n } from './lib/i18n';

function Feature({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white/60 p-4 dark:border-stone-800 dark:bg-stone-900/60">
      <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100">
        {title}
      </h3>
      <p className="mt-1 text-sm leading-relaxed text-stone-500 dark:text-stone-400">
        {text}
      </p>
    </div>
  );
}

export function App() {
  const { t } = useI18n();

  return (
    <div className="min-h-dvh bg-stone-50 text-stone-900 antialiased dark:bg-stone-950 dark:text-stone-100">
      <Header />

      <main className="mx-auto flex max-w-5xl flex-col items-center px-4 pb-16 pt-12 sm:px-6 sm:pt-16">
        <div className="max-w-2xl text-center">
          <h1 className="font-display text-4xl font-semibold tracking-tight text-stone-900 sm:text-5xl dark:text-stone-50">
            {t('heroTitle')}
          </h1>
          <p className="mt-4 text-base leading-relaxed text-stone-600 sm:text-lg dark:text-stone-400">
            {t('heroSubtitle')}
          </p>
        </div>

        <div className="mt-10 w-full max-w-2xl">
          <ChatPanel />
        </div>

        <div className="mt-10 grid w-full max-w-3xl gap-3 sm:grid-cols-3">
          <Feature title={t('featureTree')} text={t('featureTreeText')} />
          <Feature
            title={t('featureAssistant')}
            text={t('featureAssistantText')}
          />
          <Feature
            title={t('featureSelfHosted')}
            text={t('featureSelfHostedText')}
          />
        </div>
      </main>

      <footer className="border-t border-stone-200 py-6 text-center text-xs text-stone-400 dark:border-stone-800 dark:text-stone-600">
        Heirloom — open source · self-hosted
      </footer>
    </div>
  );
}
