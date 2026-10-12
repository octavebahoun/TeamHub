/**
 * Textes de la landing page WINE.
 * Les valeurs à `null` restent des décisions ouvertes : formulation neutre à l'affichage.
 */

/** Offre d'essai, ex. « 30 jours offerts ». Affichée sous les boutons du hero. */
export const TRIAL_OFFER: string | null = null;
/** Réponse à « Combien ça coûte ? ». */
export const PRICING_ANSWER: string | null = null;
/** Adresse de contact (FAQ et pied de page). */
export const CONTACT_EMAIL: string | null = null;

export const NAV = [
  { href: "#fonctionnalites", label: "Fonctionnalités" },
  { href: "#comment-ca-marche", label: "Comment ça marche" },
  { href: "#faq", label: "FAQ" },
];

export const HERO = {
  eyebrow: "Pour les équipes francophones et ouest-africaines",
  titleLead: "Toute votre équipe,",
  titleAccent: "au même endroit",
  subtitle:
    "Projets, tâches, chat, CRM et facturation (devis, contrats, Mobile Money) dans une seule plateforme. Fini les allers-retours entre WhatsApp, Excel et les carnets.",
  ctaPrimary: "Créer mon espace",
  ctaSecondary: "Voir les fonctionnalités",
};

export const BEFORE = [
  "Les décisions et les devis se perdent dans WhatsApp et les e-mails",
  "Le suivi clients, factures et acomptes vit dans un Excel ou nulle part",
  "Personne ne sait qui fait quoi, ni si le projet est financé ou bloqué",
];

export const AFTER = [
  "Chaque projet a son canal, ses fichiers scannés, ses devis et factures",
  "CRM + Contravo : pipeline, inbox WhatsApp/Telegram, relances et MoMo",
  "Chacun ouvre WINE (ou l'installe en PWA) et voit ses tâches du jour",
];

export const MODULES = [
  {
    icon: "projects",
    title: "Projets",
    text: "Jalons, équipe, livrables, fichiers et onglet Facturation (devis, contrats, factures, acompte → projet débloqué).",
  },
  {
    icon: "tasks",
    title: "Tâches",
    text: "Kanban et tableau, échéances, rappels 24 h avant, badges « en retard / proche », sous-tâches et commentaires.",
  },
  {
    icon: "chat",
    title: "Chat",
    text: "Canaux par projet, messages privés, temps réel, pièces jointes et notes vocales — sans quitter le travail.",
  },
  {
    icon: "social",
    title: "Social",
    text: "Fil d'équipe : annonces épinglées, bravos, réussites et avis clients 5/5 mis en avant.",
  },
  {
    icon: "analytics",
    title: "Analytics & IA",
    text: "Pipeline, charge, santé financière (CA, marge, cash), bilan hebdomadaire IA et assistant de relances.",
  },
  {
    icon: "crm",
    title: "CRM & Contravo",
    text: "Contacts, pipeline, devis express en XOF, inbox WhatsApp/Telegram, contrats signés et paiements Mobile Money.",
  },
] as const;

/** Capacité transverses mises en avant sous les 6 modules. */
export const HIGHLIGHTS = [
  {
    icon: "pwa",
    title: "PWA mobile",
    text: "Installez WINE sur Android ou iOS, notifications push contextuelles, shell utilisable hors-ligne.",
  },
  {
    icon: "files",
    title: "Fichiers sécurisés",
    text: "Upload pré-signé, analyse antivirus, téléchargement uniquement si le fichier est propre.",
  },
  {
    icon: "search",
    title: "Recherche globale",
    text: "Projets, tâches, clients et messages en un raccourci Ctrl/⌘ K, pensé pour le clavier et le tactile.",
  },
  {
    icon: "money",
    title: "Afrique de l'Ouest",
    text: "Montants en FCFA (XOF), MTN MoMo, Moov Money, Celtiis Cash — le quotidien de vos clients.",
  },
] as const;

export const STEPS = [
  {
    title: "Créez votre espace",
    text: "Compte et organisation en une étape. Sur mobile, vous pourrez ensuite installer WINE comme une app.",
  },
  {
    title: "Invitez votre équipe",
    text: "Par e-mail, avec le bon rôle : admin, chef de projet, membre ou invité client.",
  },
  {
    title: "Travaillez et facturez",
    text: "Lancez un projet, chattez, générez un devis Contravo, suivez l'acompte et débloquez les livrables.",
  },
];

export const FAQ = [
  {
    q: "Combien ça coûte ?",
    a:
      PRICING_ANSWER ??
      "Les offres sont en cours de finalisation. Créez votre espace dès maintenant : vous serez prévenu avant tout changement.",
  },
  {
    q: "Nos données sont-elles séparées de celles des autres équipes ?",
    a: "Oui. Chaque organisation est isolée : toutes les données sont filtrées par organisation côté serveur, et seuls vos membres y ont accès.",
  },
  {
    q: "Qu'est-ce que Contravo dans WINE ?",
    a: "Contravo est le moteur commercial connecté : devis express, contrats, factures, relances et paiements Mobile Money. Les clés API restent côté serveur ; l'équipe travaille depuis WINE sans exposer de secrets.",
  },
  {
    q: "Peut-on inviter un client ?",
    a: "Oui, avec le rôle Invité : il ne voit que les projets partagés avec lui, sans accès au reste de l'organisation.",
  },
  {
    q: "Ça marche sur téléphone ?",
    a: "Oui. WINE est une PWA : navigateur ou installation sur l'écran d'accueil (Android / iOS), barre de navigation mobile et zones tactiles adaptées.",
  },
  {
    q: "Faut-il installer quelque chose ?",
    a: "Non pour démarrer. Tout fonctionne dans le navigateur. Vous pouvez ensuite installer l'application pour un accès plus rapide et des notifications.",
  },
  {
    q: "Les fichiers sont-ils sécurisés ?",
    a: "Oui. Upload via URL pré-signée, analyse antivirus, et aucun lien de téléchargement si un fichier est signalé comme infecté.",
  },
];
