import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

export type Lang = 'en' | 'fr';

const translations = {
  en: {
    tagline: 'Your family history, on your own server.',
    heroTitle: 'Every family has a story.',
    heroSubtitle:
      'Heirloom is an open source, self-hosted genealogy application. Build your family tree, record lives and unions, attach photos and sources — your data never leaves your machine.',
    featureTree: 'Family trees',
    featureTreeText: 'Persons, unions, filiation and life events.',
    featureAssistant: 'AI assistant',
    featureAssistantText: 'Talk to your tree: ask, record, explore.',
    featureSelfHosted: 'Self-hosted',
    featureSelfHostedText: 'Your data stays home. GEDCOM friendly.',
    chatTitle: 'Ask the assistant',
    chatPlaceholder: 'Ask something… e.g. “What is Heirloom?”',
    chatHint: 'Enter to send · Shift+Enter for a new line',
    send: 'Send',
    thinking: 'Thinking…',
    login: 'Log in',
    chatEmpty:
      'Chat with the Heirloom assistant. Log in to explore and edit your family tree with it.',
    errorGeneric: 'Something went wrong. Please try again.',
    toolRan: 'action',
  },
  fr: {
    tagline: 'Votre histoire familiale, sur votre propre serveur.',
    heroTitle: 'Chaque famille a une histoire.',
    heroSubtitle:
      'Heirloom est une application de généalogie open source et auto-hébergée. Construisez votre arbre, consignez les vies et les unions, ajoutez photos et sources — vos données ne quittent jamais votre machine.',
    featureTree: 'Arbres généalogiques',
    featureTreeText: 'Personnes, unions, filiation et événements de vie.',
    featureAssistant: 'Assistant IA',
    featureAssistantText: 'Parlez à votre arbre : demandez, enregistrez, explorez.',
    featureSelfHosted: 'Auto-hébergé',
    featureSelfHostedText: 'Vos données restent chez vous. Compatible GEDCOM.',
    chatTitle: 'Interrogez l’assistant',
    chatPlaceholder: 'Posez une question… ex. « C’est quoi Heirloom ? »',
    chatHint: 'Entrée pour envoyer · Maj+Entrée pour une nouvelle ligne',
    send: 'Envoyer',
    thinking: 'Réflexion…',
    login: 'Connexion',
    chatEmpty:
      'Discutez avec l’assistant Heirloom. Connectez-vous pour explorer et modifier votre arbre avec lui.',
    errorGeneric: 'Une erreur est survenue. Réessayez.',
    toolRan: 'action',
  },
} as const;

export type TranslationKey = keyof (typeof translations)['en'];

interface I18nValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: TranslationKey) => string;
}

const I18nContext = createContext<I18nValue | null>(null);

function detectLang(): Lang {
  const stored = localStorage.getItem('heirloom-lang');
  if (stored === 'en' || stored === 'fr') return stored;
  return navigator.language.startsWith('fr') ? 'fr' : 'en';
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(detectLang);

  const setLang = useCallback((next: Lang) => {
    localStorage.setItem('heirloom-lang', next);
    setLangState(next);
    document.documentElement.lang = next;
  }, []);

  const value = useMemo<I18nValue>(
    () => ({
      lang,
      setLang,
      t: (key) => translations[lang][key],
    }),
    [lang, setLang],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const value = useContext(I18nContext);
  if (!value) throw new Error('useI18n must be used within I18nProvider');
  return value;
}
