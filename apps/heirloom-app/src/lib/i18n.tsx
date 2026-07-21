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
    chatTitle: 'Heirloom Assistant',
    chatSubtitle: 'Ask anything about Heirloom — or log in to talk about your tree.',
    chatPlaceholder: 'Ask something… e.g. “What is Heirloom?”',
    chatHint: 'Enter to send · Shift+Enter for a new line',
    send: 'Send',
    thinking: 'Thinking…',
    login: 'Log in',
    logout: 'Log out',
    chatEmpty:
      'Chat with the Heirloom assistant. Log in to explore and edit your family tree with it.',
    errorGeneric: 'Something went wrong. Please try again.',
    email: 'Email',
    password: 'Password',
    displayName: 'Name (optional)',
    signInTitle: 'Welcome back',
    signInSubtitle: 'Sign in to explore your family trees.',
    signUpTitle: 'Set up Heirloom',
    signUpSubtitle:
      'Create the first administrator account of this instance. Other members will join through invitation links.',
    signUp: 'Create account',
    noAccount: 'First time here?',
    haveAccount: 'Already have an account?',
    createInstance: 'Set up the instance',
    submitting: 'Please wait…',
    treesTitle: 'Your family trees',
    treesSubtitle: 'The trees you can explore and contribute to.',
    treesEmpty: 'No tree yet. Ask the assistant to create your first one!',
    created: 'Created',
    roleAdmin: 'Admin',
    roleMember: 'Member',
    newTree: 'New tree',
    addPerson: 'Add a person',
    firstNameL: 'First name',
    lastNameL: 'Last name',
    sexL: 'Sex',
    sexMALE: 'Male',
    sexFEMALE: 'Female',
    sexOTHER: 'Other',
    sexUNKNOWN: 'Unknown',
    notesL: 'Notes',
    save: 'Save',
    deleteAction: 'Delete',
    confirmDelete: 'Delete this person? This cannot be undone.',
    addPartner: 'Add a partner',
    addChild: 'Add a child',
    choosePerson: 'Choose a person…',
    unionsLabel: 'Unions',
    emptyTree: 'This tree is empty. Add its first person, or ask the assistant!',
    close: 'Close',
    backToTrees: 'All trees',
    forbidden: 'You do not have the rights for this action.',
    treeNameLabel: 'Tree name',
    treeDescLabel: 'Description (optional)',
    createAction: 'Create',
    cancel: 'Cancel',
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
    chatTitle: 'Assistant Heirloom',
    chatSubtitle:
      'Posez vos questions sur Heirloom — ou connectez-vous pour parler de votre arbre.',
    chatPlaceholder: 'Posez une question… ex. « C’est quoi Heirloom ? »',
    chatHint: 'Entrée pour envoyer · Maj+Entrée pour une nouvelle ligne',
    send: 'Envoyer',
    thinking: 'Réflexion…',
    login: 'Connexion',
    logout: 'Déconnexion',
    chatEmpty:
      'Discutez avec l’assistant Heirloom. Connectez-vous pour explorer et modifier votre arbre avec lui.',
    errorGeneric: 'Une erreur est survenue. Réessayez.',
    email: 'Email',
    password: 'Mot de passe',
    displayName: 'Nom (facultatif)',
    signInTitle: 'Bon retour',
    signInSubtitle: 'Connectez-vous pour explorer vos arbres.',
    signUpTitle: 'Installer Heirloom',
    signUpSubtitle:
      'Créez le premier compte administrateur de cette instance. Les autres membres rejoindront via des liens d’invitation.',
    signUp: 'Créer le compte',
    noAccount: 'Première visite ?',
    haveAccount: 'Déjà un compte ?',
    createInstance: 'Configurer l’instance',
    submitting: 'Un instant…',
    treesTitle: 'Vos arbres généalogiques',
    treesSubtitle: 'Les arbres que vous pouvez explorer et enrichir.',
    treesEmpty: 'Aucun arbre pour l’instant. Demandez à l’assistant d’en créer un !',
    created: 'Créé le',
    roleAdmin: 'Admin',
    roleMember: 'Membre',
    newTree: 'Nouvel arbre',
    addPerson: 'Ajouter une personne',
    firstNameL: 'Prénom',
    lastNameL: 'Nom',
    sexL: 'Sexe',
    sexMALE: 'Homme',
    sexFEMALE: 'Femme',
    sexOTHER: 'Autre',
    sexUNKNOWN: 'Inconnu',
    notesL: 'Notes',
    save: 'Enregistrer',
    deleteAction: 'Supprimer',
    confirmDelete: 'Supprimer cette personne ? Action irréversible.',
    addPartner: 'Ajouter un·e partenaire',
    addChild: 'Ajouter un enfant',
    choosePerson: 'Choisir une personne…',
    unionsLabel: 'Unions',
    emptyTree: 'Cet arbre est vide. Ajoutez sa première personne, ou demandez à l’assistant !',
    close: 'Fermer',
    backToTrees: 'Tous les arbres',
    forbidden: 'Vous n’avez pas les droits pour cette action.',
    treeNameLabel: 'Nom de l’arbre',
    treeDescLabel: 'Description (facultatif)',
    createAction: 'Créer',
    cancel: 'Annuler',
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
