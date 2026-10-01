/**
 * Données de démonstration du mock (reprises des maquettes WINE).
 * Les dates sont relatives au jour courant pour que l'Accueil reste parlant.
 */

const DAY = 86_400_000;
const today = new Date();
export const iso = (days = 0, hours = 0) => new Date(today.getTime() + days * DAY + hours * 3_600_000).toISOString();
export const date = (days = 0) => iso(days).slice(0, 10);

let seq = 1000;
export const nextId = () => ++seq;

export const users = [
  { id: 1, name: "Octave Bahoun", email: "octave@exemple.com", role: "owner", title: "Directeur Technique", joined: -400, active: 0 },
  { id: 2, name: "Aïcha Dossou", email: "aicha@exemple.com", role: "admin", title: "Admin", joined: -380, active: -0.01 },
  { id: 3, name: "Koffi Agbessi", email: "koffi@exemple.com", role: "manager", title: "Chef de projet", joined: -360, active: -0.05 },
  { id: 4, name: "Mariam Sanni", email: "mariam@exemple.com", role: "member", title: "Membre", joined: -300, active: -0.2 },
  { id: 5, name: "Rodrigue Houngbo", email: "rodrigue@exemple.com", role: "member", title: "Membre", joined: -5, active: -1 },
  { id: 6, name: "Nadège Ahouansou", email: "nadege@exemple.com", role: "guest", title: "Invitée", joined: -3, active: -3 },
  { id: 7, name: "Sèna Hounkpè", email: "sena@exemple.com", role: "member", title: "Membre", joined: -200, active: -2 },
  { id: 8, name: "Bénédicte Agossou", email: "benedicte@exemple.com", role: "member", title: "Membre", joined: -180, active: -4 },
  { id: 9, name: "Yao Kossi", email: "yao@exemple.com", role: "member", title: "Membre", joined: -150, active: -6 },
  { id: 10, name: "Fifamè Dossa", email: "fifame@exemple.com", role: "member", title: "Membre", joined: -120, active: -8 },
  { id: 11, name: "Ulrich Zinsou", email: "ulrich@exemple.com", role: "member", title: "Membre", joined: -90, active: -10 },
].map((u) => ({ ...u, password: "password", avatar: null, current_organization_id: 1, created_at: iso(u.joined) }));

export const organizations = [{ id: 1, name: "Excellence Team", slug: "excellence-team", owner_id: 1, plan: "starter", created_at: iso(-400) }];
export const memberships = users.map((u) => ({ user_id: u.id, organization_id: 1, role: u.role, created_at: iso(u.joined) }));

export const invitations = [
  { id: 1, organization_id: 1, email: "nouveau.membre@exemple.com", role: "member", token: "demo-invitation", invited_by: 1, expires_at: iso(7), created_at: iso(-2) },
  { id: 2, organization_id: 1, email: "client@exemple.com", role: "guest", token: "demo-client", invited_by: 2, expires_at: iso(8), created_at: iso(-1) },
];

export const clients = [
  { id: 1, name: "Jean Adjovi", company: "Boutique Streetwear", email: "contact@exemple.com", phone: "+229 01 66 20 14 08", address: "Cadjèhoun, Cotonou", owner_id: 3, created_at: iso(-120) },
  { id: 2, name: "Paul Kiki", company: "Garage Auto Plus", email: "garage@exemple.com", phone: "+229 01 97 45 12 30", address: "Akpakpa, Cotonou", owner_id: 1, created_at: iso(-60), notes: "gérant" },
  { id: 3, name: "Sandra Tossou", company: "Résidence Étudiante", email: "logement@exemple.com", phone: "+229 01 90 11 23 45", address: "Abomey-Calavi", owner_id: 2, created_at: iso(-90) },
  { id: 4, name: "Eric Zinsou", company: "Cabinet Conseil", email: "cabinet@exemple.com", phone: "+229 01 95 33 21 10", address: "Ganhi, Cotonou", owner_id: 1, created_at: iso(-20) },
  { id: 5, name: "Afi Lawson", company: "Atelier Couture", email: "atelier@exemple.com", phone: "+229 01 61 44 52 87", address: "Porto-Novo", owner_id: 4, created_at: iso(-15) },
  { id: 6, name: "Luc Gnonlonfoun", company: "École Privée", email: "ecole@exemple.com", phone: "+229 01 52 70 31 66", address: "Fidjrossè, Cotonou", owner_id: 2, created_at: iso(-10) },
].map((c) => ({ notes: null, organization_id: 1, updated_at: c.created_at, ...c }));

export const projects = [
  { id: 1, name: "WINE V1", description: "Plateforme SaaS qui regroupe projets, tâches, chat, fil social, analytics et CRM pour les équipes d'entrepreneurs francophones. Excellence Team l'utilise d'abord en interne.", status: "in_progress", owner_id: 1, client_id: null, start_date: date(-45), end_date: date(75), members: [1, 2, 3, 4], milestones: [["M0", "Socle : dépôt, CI, auth, organisations", true], ["M1", "Projets et tâches", false, true], ["M2", "Chat temps réel et notifications", false], ["M3", "CRM / BizDev", false], ["M4", "Analytics et fil social", false], ["M5", "Tests et mise en production", false]], files: [["MD", "cahier-des-charges-wine.md", "12 Ko"], ["MD", "architecture-wine.md", "9 Ko"], ["FIG", "Maquettes V1", "—"]] },
  { id: 2, name: "Site vitrine", description: "Site vitrine du Garage Auto Plus : présentation des services, prise de rendez-vous et contact WhatsApp.", status: "in_progress", owner_id: 3, client_id: 2, start_date: date(-48), end_date: date(14), members: [3, 5] },
  { id: 3, name: "Application mobile", description: "Application de réservation de chambres pour la Résidence Étudiante.", status: "in_progress", owner_id: 1, client_id: 3, start_date: date(-30), end_date: date(60), members: [1, 4, 6] },
  { id: 4, name: "Refonte du site Excellence Team", description: "Nouvelle identité et site de l'association.", status: "on_hold", owner_id: 2, client_id: null, start_date: date(-90), end_date: date(19), members: [2, 5] },
  { id: 5, name: "Plateforme e-commerce", description: "Boutique en ligne avec paiement mobile money.", status: "done", owner_id: 3, client_id: 1, start_date: date(-110), end_date: date(-19), members: [1, 3, 4] },
  { id: 6, name: "Dossier incubateur", description: "Dossier de candidature et démo pour l'incubateur.", status: "upcoming", owner_id: 1, client_id: null, start_date: date(3), end_date: date(8), members: [1, 2] },
].map((p) => ({ organization_id: 1, archived_at: null, created_at: iso(-100), updated_at: iso(-1), milestones: [], files: [], ...p }));

// --- Tâches -----------------------------------------------------------------
export const tasks = [];
export const comments = [];
const P = { low: "low", normal: "normal", high: "high", urgent: "urgent" };

function addTask(project_id, title, o = {}) {
  const id = nextId();
  const t = {
    id, organization_id: 1, project_id, parent_id: null, assignee_id: null, created_by: 1, title,
    description: null, status: "todo", priority: P.normal, due_date: null, position: tasks.length,
    completed_at: null, created_at: iso(-20), updated_at: iso(-1), ...o,
  };
  if (t.status === "done" && !t.completed_at) t.completed_at = iso(-Math.floor(Math.random() * 30));
  tasks.push(t);
  return t;
}

// WINE V1 : 30 tâches (11 à faire, 5 en cours, 2 en revue, 12 terminées)
const kanban = addTask(1, "Maquette de l'écran Kanban", {
  status: "in_progress", priority: P.high, assignee_id: 1, due_date: date(0), created_at: iso(-3), updated_at: iso(0, -0.33),
  attachments: [{ id: 1, kind: "PNG", name: "kanban-v1.png", size: "480 Ko" }, { id: 2, kind: "MD", name: "cahier-des-charges-wine.md", size: "12 Ko" }],
  description: "Dessiner l'écran Kanban du module Tâches : 4 colonnes (À faire, En cours, En revue, Terminé), filtre par étape sous le titre, et cartes avec module, priorité, échéance, sous-tâches et personne assignée.",
});
[["Structure des 4 colonnes", "done", 1], ["Carte de tâche (module, priorité, échéance)", "done", 1], ["Filtre par étape sous le titre", "todo", 1], ["Version mobile", "todo", 4]].forEach(([title, status, a], i) =>
  addTask(1, title, { parent_id: kanban.id, status, assignee_id: a, position: i })
);
[[4, "Je peux reprendre la version mobile une fois les colonnes validées.", -1, 18], [3, "Les colonnes deviennent vite chargées. Un filtre par étape aiderait.", 0, -3], [1, "Filtre ajouté sous le titre : une étape à la fois, en pleine largeur.", 0, -0.33]].forEach(([u, body, d, h]) =>
  comments.push({ id: nextId(), organization_id: 1, task_id: kanban.id, user_id: u, body, created_at: iso(d, h), updated_at: iso(d, h) })
);
addTask(1, "Corriger l'envoi des invitations", { priority: P.high, assignee_id: 1, due_date: date(-1), status: "todo" });
addTask(1, "Endpoint POST /projects", { assignee_id: 1, due_date: date(0), status: "in_progress" });
addTask(1, "Brancher Socket.io sur les canaux projet", { priority: P.high, assignee_id: 1, due_date: date(4), status: "todo" });
addTask(1, "Rédiger la doc de déploiement", { priority: P.low, assignee_id: 1, due_date: date(5), status: "todo" });
addTask(1, "Endpoint DELETE /projects/{id}", { assignee_id: 2, due_date: date(7), status: "todo" });
addTask(1, "Vue Kanban", { assignee_id: 4, due_date: date(2), status: "review" });
addTask(1, "Middleware d'organisation", { assignee_id: 2, due_date: date(1), status: "review" });
["Page de connexion", "Inscription + organisation", "Modèle de données projets", "Politiques de rôles", "CI GitHub Actions", "Dockerfile API", "Seeders de démo", "Endpoint GET /me", "Cookie de session", "Tests Pest projets", "Rate limiting", "CORS"].forEach((t, i) =>
  addTask(1, t, { status: "done", assignee_id: [1, 2, 3, 4][i % 4] })
);
["Notifications temps réel", "Pièces jointes R2", "Recherche globale", "Fil social", "Export analytics", "Tests e2e", "Page Membres", "Paramètres d'organisation"].forEach((t, i) =>
  addTask(1, t, { status: "todo", assignee_id: [2, 3, 4, null][i % 4], due_date: date(10 + i * 3), priority: i % 3 ? P.normal : P.high })
);
["Chat : canaux projet", "Analytics : charge par membre"].forEach((t, i) => addTask(1, t, { status: "in_progress", assignee_id: [3, 4][i], due_date: date(6 + i) }));

function fill(project_id, total, done, assignees, titles) {
  for (let i = 0; i < total; i++) {
    const status = i < done ? "done" : i % 3 === 0 ? "in_progress" : "todo";
    addTask(project_id, titles[i % titles.length] + (i >= titles.length ? ` (${Math.floor(i / titles.length) + 1})` : ""), {
      status, assignee_id: assignees[i % assignees.length], due_date: status === "done" ? null : date(3 + i), priority: i % 4 === 0 ? P.high : P.normal,
    });
  }
}
addTask(2, "Relancer le prospect Garage Auto Plus", { assignee_id: 1, due_date: date(0), status: "todo" });
fill(2, 19, 11, [3, 5], ["Page d'accueil", "Page services", "Formulaire de rendez-vous", "Bouton WhatsApp", "Galerie photos", "SEO local", "Hébergement", "Formation du client"]);
fill(3, 18, 4, [4, 6], ["Écran de connexion", "Liste des chambres", "Réservation", "Paiement mobile money", "Notifications push", "Profil étudiant"]);
fill(4, 10, 8, [2, 5], ["Charte graphique", "Page équipe", "Page projets", "Blog", "Formulaire de contact"]);
fill(5, 24, 24, [1, 3, 4], ["Catalogue produits", "Panier", "Paiement", "Back-office", "Livraison", "Factures"]);
addTask(6, "Préparer la démo pour l'incubateur", { assignee_id: 1, due_date: date(8), status: "todo" });
fill(6, 5, 0, [2], ["Pitch deck", "Business plan", "Vidéo de démo", "Budget prévisionnel", "Lettre de motivation"]);

// --- CRM ----------------------------------------------------------------------
export const opportunities = [
  { client_id: 6, title: "Site institutionnel", amount: "1200000.00", stage: "prospect", owner_id: 2, next_follow_up: date(11) },
  { client_id: 5, title: "Gestion des commandes", amount: "850000.00", stage: "contacted", owner_id: 4, next_follow_up: date(2) },
  { client_id: 4, title: "Tableau de bord clients", amount: "1500000.00", stage: "contacted", owner_id: 1, next_follow_up: date(1) },
  { client_id: 2, title: "Maintenance annuelle", amount: "600000.00", stage: "proposal", owner_id: 1, next_follow_up: date(0) },
  { client_id: 3, title: "Application de réservation", amount: "2800000.00", stage: "proposal", owner_id: 2, next_follow_up: date(19) },
  { client_id: 2, title: "Site vitrine", amount: "950000.00", stage: "won", owner_id: 1, project_id: 2, closed_at: iso(-48) },
  { client_id: 1, title: "Plateforme e-commerce", amount: "3500000.00", stage: "won", owner_id: 3, project_id: 5, closed_at: iso(-110) },
  { client_id: 3, title: "Application mobile", amount: "2400000.00", stage: "won", owner_id: 2, project_id: 3, closed_at: iso(-30) },
  { client_id: 6, title: "Portail des parents", amount: "700000.00", stage: "lost", owner_id: 2, closed_at: iso(-5) },
].map((o) => ({ id: nextId(), organization_id: 1, project_id: null, closed_at: null, next_follow_up: null, notes: null, created_at: iso(-40), updated_at: iso(-2), ...o }));

export const activities = [
  { client_id: 2, user_id: 1, kind: "call", action: "activity.call", body: "Paul est satisfait du site. Il demande un devis pour l'entretien mensuel et les mises à jour.", at: iso(-6) },
  { client_id: 2, user_id: 1, kind: "email", action: "activity.email", body: "Envoi des accès au backoffice et du guide de publication des annonces.", at: iso(-13) },
  { client_id: 2, user_id: 1, kind: null, action: "opportunity.stage_changed", body: "Site vitrine signé. Projet créé automatiquement.", meta: { from: "proposal", to: "won" }, at: iso(-48) },
  { client_id: 2, user_id: 2, kind: "note", action: "activity.note", body: "Priorité du client : être trouvé sur Google et recevoir les demandes sur WhatsApp.", at: iso(-52) },
  { client_id: 2, user_id: 1, kind: "call", action: "activity.call", body: "Recommandé par un ancien client. Rendez-vous au garage fixé.", at: iso(-60) },
].map((a) => ({ id: nextId(), created_at: a.at, meta: null, ...a }));

// --- Social -------------------------------------------------------------------
export const posts = [
  { author_id: 2, body: "Réunion du cercle décisionnel chaque lundi à 9h. Envoyez vos points bloquants dans #general avant midi.", pinned: true, created_at: iso(-3), reactions: [1, 3, 4, 5, 7, 8], comments: [[1, "Noté, merci Aïcha."], [3, "Je prépare l'ordre du jour."]] },
  { author_id: 3, body: "Livrée ce matin au client, dans les délais. Merci à toute l'équipe front et back pour ce sprint.", kind: "project_delivered", meta: { project: "Plateforme e-commerce" }, created_at: iso(0, -2), reactions: [1, 2, 4, 5, 6, 7, 8, 9, 10], comments: [[1, "Bravo l'équipe !"], [2, "Super travail."], [4, "Merci Koffi."], [9, "🎉"]] },
  { author_id: 4, body: "Première session maquettes pour WINE. On a validé la charte : blanc et orange, titres en serif.", created_at: iso(-1), reactions: [1, 2, 3, 5, 6], comments: [[2, "Très réussi."]] },
].map((p) => ({ id: nextId(), organization_id: 1, pinned: false, pinned_at: p.pinned ? p.created_at : null, kind: null, meta: null, updated_at: p.created_at, ...p }));

// --- Chat ---------------------------------------------------------------------
export const channels = [
  { id: "c-wine-v1", type: "project", name: "wine-v1", project_id: 1, member_ids: [1, 2, 3, 4] },
  { id: "c-site-vitrine", type: "project", name: "site-vitrine", project_id: 2, member_ids: [1, 3, 5], unread: 3 },
  { id: "c-app-mobile", type: "project", name: "app-mobile", project_id: 3, member_ids: [1, 4, 6] },
  { id: "c-general", type: "project", name: "general", project_id: null, member_ids: users.map((u) => u.id), unread: 1 },
  { id: "d-1-2", type: "direct", name: "Aïcha Dossou", project_id: null, member_ids: [1, 2] },
  { id: "d-1-3", type: "direct", name: "Koffi Agbessi", project_id: null, member_ids: [1, 3] },
  { id: "d-1-4", type: "direct", name: "Mariam Sanni", project_id: null, member_ids: [1, 4] },
  { id: "d-1-5", type: "direct", name: "Rodrigue Houngbo", project_id: null, member_ids: [1, 5] },
];

export const messages = [
  ["c-wine-v1", 3, "Les colonnes du Kanban deviennent vite chargées. On ajoute un filtre ?", 0, -3],
  ["c-wine-v1", 1, "Oui, un filtre par étape sous le titre. Je m'en occupe.", 0, -2.5],
  ["c-wine-v1", 2, "Le middleware d'organisation est en revue, quelqu'un peut relire ?", 0, -2],
  ["c-wine-v1", 4, "Voici la première version mobile.", 0, -1.33, [{ path: "chat/kanban-mobile.png", name: "kanban-mobile.png", mime: "image/png", size: 491520 }]],
  ["c-site-vitrine", 3, "Le client valide la page services.", -1, 2],
  ["c-site-vitrine", 5, "Je mets en ligne la galerie ce soir.", 0, -4],
  ["c-general", 2, "Pensez à vos points bloquants pour lundi.", 0, -5],
  ["d-1-2", 2, "Tu peux relire le middleware quand tu as 5 min ?", 0, -1],
].map(([channel_id, sender_id, body, d, h, attachments = []]) => ({
  _id: `m-${nextId()}`, organization_id: 1, channel_id, sender_id, body, attachments, read_by: [{ user_id: sender_id, at: iso(d, h) }], created_at: iso(d, h), updated_at: iso(d, h),
}));
