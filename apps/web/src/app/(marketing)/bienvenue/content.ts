/**
 * Textes de la landing page. Les valeurs à `null` sont des décisions encore
 * ouvertes (maquette : « [À DÉFINIR] ») : tant qu'elles sont vides, la page
 * affiche une formulation neutre au lieu d'un placeholder.
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

export const BEFORE = [
  "Les décisions sont noyées dans un groupe WhatsApp",
  "Le suivi des clients tient dans un fichier Excel",
  "Personne ne sait qui fait quoi cette semaine",
];

export const AFTER = [
  "Chaque projet a son canal, ses fichiers et son historique",
  "Les clients et les relances vivent dans le CRM",
  "Chacun ouvre WINE et voit ses tâches du jour",
];

export const MODULES = [
  { icon: "projects", title: "Projets", text: "Chaque projet avec ses jalons, son équipe, ses fichiers et son avancement calculé tout seul." },
  { icon: "tasks", title: "Tâches", text: "Un Kanban clair, filtrable par étape, avec sous-tâches, échéances et rappels." },
  { icon: "chat", title: "Chat", text: "Un canal par projet et des messages privés, en temps réel, sans quitter le travail." },
  { icon: "social", title: "Social", text: "Le fil interne de l'équipe : annonces épinglées, réussites, nouvelles." },
  { icon: "analytics", title: "Analytics", text: "Tâches terminées, charge par membre, retards : le tableau de bord du dirigeant." },
  { icon: "crm", title: "CRM", text: "Contacts, pipeline et relances. Un client gagné devient un projet en un clic." },
] as const;

export const STEPS = [
  { title: "Créez votre espace", text: "Votre compte et votre organisation en une seule étape." },
  { title: "Invitez votre équipe", text: "Par email, avec le bon rôle pour chacun : admin, chef de projet, membre ou invité." },
  { title: "Lancez votre premier projet", text: "Découpez-le en tâches, assignez-les, et suivez l'avancement en direct." },
];

export const FAQ = [
  {
    q: "Combien ça coûte ?",
    a: PRICING_ANSWER ?? "Les offres sont en cours de finalisation. Créez votre espace dès maintenant : vous serez prévenu avant tout changement.",
  },
  {
    q: "Nos données sont-elles séparées de celles des autres équipes ?",
    a: "Oui. Chaque organisation est isolée : toutes les données sont filtrées par organisation côté serveur, et seuls vos membres y ont accès.",
  },
  {
    q: "Peut-on inviter un client ?",
    a: "Oui, avec le rôle Invité : il ne voit que les projets partagés avec lui, sans accès au reste de l'organisation.",
  },
  { q: "Ça marche sur téléphone ?", a: "Oui. WINE s'utilise dans le navigateur du téléphone, de la tablette ou de l'ordinateur." },
  { q: "Faut-il installer quelque chose ?", a: "Non. Tout se passe dans le navigateur : créez votre espace, invitez l'équipe, c'est prêt." },
];
