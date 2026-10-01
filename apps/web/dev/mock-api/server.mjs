/**
 * Mock de l'API WINE pour le développement du frontend (aucune dépendance au
 * backend Laravel). Reproduit le contrat de `apps/api` (snake_case, pagination
 * Laravel, erreurs 422) ET les extensions proposées dans docs/api-gaps.md.
 * Sert aussi Socket.io (chat, présence, notifications) sur le même port.
 *
 *   npm run mock:api            → http://localhost:8000/api  (+ ws://localhost:8000)
 *   Connexion : octave@exemple.com / password  (aussi aicha@, koffi@, mariam@, nadege@ …)
 */
import { createServer } from "node:http";
import { randomBytes } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { Server } from "socket.io";
import * as db from "./seed.mjs";

const PORT = Number(process.env.MOCK_PORT ?? 8000);
// Jetons persistés entre deux redémarrages du mock (la session du navigateur survit).
const TOKENS_FILE = new URL("./.tokens.json", import.meta.url);
const tokens = new Map(existsSync(TOKENS_FILE) ? JSON.parse(readFileSync(TOKENS_FILE, "utf8")) : [["demo-token", 1]]);
const saveTokens = () => writeFileSync(TOKENS_FILE, JSON.stringify([...tokens]));
const notificationPrefs = new Map();

// --- Sérialisation ----------------------------------------------------------
const user = (id) => db.users.find((u) => u.id === id);
const ref = (id) => {
  const u = user(id);
  return u ? { id: u.id, name: u.name, avatar: u.avatar } : null;
};
const fullUser = (u) => ({
  id: u.id, name: u.name, email: u.email, email_verified_at: null, avatar: u.avatar, title: u.title, phone: u.phone ?? null,
  current_organization_id: u.current_organization_id, created_at: u.created_at, updated_at: u.created_at,
});
const roleOf = (uid, orgId = 1) => db.memberships.find((m) => m.user_id === uid && m.organization_id === orgId)?.role;
const org = (o, uid) => ({ ...o, updated_at: o.created_at, pivot: { user_id: uid, organization_id: o.id, role: roleOf(uid, o.id) } });
const topTasks = (pid) => db.tasks.filter((t) => t.project_id === pid && !t.parent_id);
const projectJson = (p, detail = false) => {
  const { members, milestones, files, client_id, ...rest } = p;
  const c = db.clients.find((x) => x.id === client_id);
  const out = {
    ...rest,
    owner: ref(p.owner_id),
    members: members.map((id) => ({ ...ref(id), email: user(id).email })),
    tasks_count: topTasks(p.id).length,
    done_tasks_count: topTasks(p.id).filter((t) => t.status === "done").length,
    client: c ? { id: c.id, name: c.name, company: c.company } : null,
  };
  if (detail) {
    out.milestones = milestones.map(([code, title, done, current]) => ({ code, title, done: !!done, current: !!current }));
    out.attachments = files.map(([kind, name, size], i) => ({ id: i + 1, kind, name, size }));
  }
  return out;
};
const taskJson = (t, detail = false) => {
  const subs = db.tasks.filter((s) => s.parent_id === t.id);
  const out = {
    ...t,
    assignee: ref(t.assignee_id),
    subtasks_count: subs.length,
    done_subtasks_count: subs.filter((s) => s.status === "done").length,
    comments_count: db.comments.filter((c) => c.task_id === t.id).length,
    project: (({ id, name }) => ({ id, name }))(db.projects.find((p) => p.id === t.project_id)),
  };
  if (detail) {
    out.creator = ref(t.created_by);
    out.subtasks = subs.map((s) => ({ ...s, assignee: ref(s.assignee_id) }));
    out.comments = db.comments.filter((c) => c.task_id === t.id).map((c) => ({ ...c, author: ref(c.user_id) }));
  }
  return out;
};
const oppJson = (o) => {
  const c = db.clients.find((x) => x.id === o.client_id);
  const p = db.projects.find((x) => x.id === o.project_id);
  return { ...o, client: c && { id: c.id, name: c.name, company: c.company }, owner: ref(o.owner_id), project: p ? { id: p.id, name: p.name } : null };
};
const postJson = (p, me, detail = false) => {
  const { reactions, comments, ...rest } = p;
  const out = { ...rest, author: { ...ref(p.author_id), role: roleOf(p.author_id) }, reactions_count: reactions.length, comments_count: comments.length, reacted: reactions.includes(me) };
  if (detail) {
    out.reactions = reactions.map((uid, i) => ({ id: i + 1, post_id: p.id, user_id: uid, emoji: "bravo" }));
    out.comments = comments.map(([uid, body], i) => ({ id: i + 1, post_id: p.id, author_id: uid, body, created_at: p.created_at, author: ref(uid) }));
  }
  return out;
};
function paginate(items, query, per = 20) {
  const page = Math.max(1, Number(query.get("page") ?? 1));
  const last = Math.max(1, Math.ceil(items.length / per));
  return {
    current_page: page, data: items.slice((page - 1) * per, page * per), last_page: last, per_page: per, total: items.length,
    from: items.length ? (page - 1) * per + 1 : null, to: Math.min(page * per, items.length),
    next_page_url: page < last ? `?page=${page + 1}` : null, prev_page_url: page > 1 ? `?page=${page - 1}` : null,
  };
}

// --- Routeur ----------------------------------------------------------------
class HttpError extends Error {
  constructor(status, message, errors) {
    super(message);
    this.status = status;
    this.errors = errors;
  }
}
const fail = (status, message, errors) => {
  throw new HttpError(status, message, errors);
};
const invalid = (errors) => fail(422, Object.values(errors)[0][0], errors);
const required = (body, fields) => {
  const errors = {};
  for (const f of fields) if (body[f] === undefined || body[f] === null || body[f] === "") errors[f] = [`Le champ ${f} est obligatoire.`];
  if (Object.keys(errors).length) invalid(errors);
};
const allow = (role, roles) => {
  if (!roles.includes(role)) fail(403, "Cette action n'est pas autorisée.");
};

const routes = [];
const route = (method, pattern, handler, opts = {}) => {
  const keys = [];
  const re = new RegExp("^" + pattern.replace(/:(\w+)/g, (_, k) => (keys.push(k), "([^/]+)")) + "$");
  routes.push({ method, re, keys, handler, ...opts });
};

// Auth
route("POST", "auth/register", ({ body }) => {
  required(body, ["name", "email", "password", "organization_name"]);
  if (db.users.some((u) => u.email === body.email)) invalid({ email: ["Cette adresse e-mail est déjà utilisée."] });
  if (String(body.password).length < 8) invalid({ password: ["Le mot de passe doit contenir au moins 8 caractères."] });
  const o = { id: db.nextId(), name: body.organization_name, slug: body.organization_name.toLowerCase().replace(/\W+/g, "-"), owner_id: 0, plan: null, created_at: db.iso() };
  const u = { id: db.nextId(), name: body.name, email: body.email, password: body.password, avatar: null, title: null, current_organization_id: o.id, created_at: db.iso() };
  o.owner_id = u.id;
  db.users.push(u);
  db.organizations.push(o);
  db.memberships.push({ user_id: u.id, organization_id: o.id, role: "owner", created_at: db.iso() });
  const token = randomBytes(16).toString("hex");
  tokens.set(token, u.id);
  saveTokens();
  return [201, { token, user: fullUser(u), organization: o }];
}, { public: true });

route("POST", "auth/login", ({ body }) => {
  const u = db.users.find((x) => x.email === body.email && x.password === body.password);
  if (!u) invalid({ email: ["Identifiants invalides."] });
  const token = randomBytes(16).toString("hex");
  tokens.set(token, u.id);
  saveTokens();
  return { token, user: fullUser(u) };
}, { public: true });

route("POST", "auth/logout", ({ token }) => (tokens.delete(token), { message: "Déconnecté." }), { noOrg: true });

route("GET", "me", ({ me }) => {
  const orgs = db.organizations.filter((o) => roleOf(me.id, o.id)).map((o) => org(o, me.id));
  return { user: fullUser(me), organizations: orgs, current_organization: orgs.find((o) => o.id === me.current_organization_id) ?? null };
}, { noOrg: true });

route("PATCH", "me", ({ me, body }) => {
  if (body.email && db.users.some((u) => u.email === body.email && u.id !== me.id)) invalid({ email: ["Cette adresse e-mail est déjà utilisée."] });
  for (const k of ["name", "email", "title", "phone"]) if (body[k] !== undefined) me[k] = body[k];
  return { user: fullUser(me) };
}, { noOrg: true });

route("PUT", "me/password", ({ me, body }) => {
  if (body.current_password !== me.password) invalid({ current_password: ["Le mot de passe actuel est incorrect."] });
  if (String(body.password ?? "").length < 8) invalid({ password: ["Le mot de passe doit contenir au moins 8 caractères."] });
  me.password = body.password;
  return { message: "Mot de passe modifié." };
}, { noOrg: true });

route("GET", "me/notifications", ({ me }) => notificationPrefs.get(me.id) ?? { task_assigned: true, due_reminder: true, chat_messages: true, weekly_digest: false }, { noOrg: true });
route("PUT", "me/notifications", ({ me, body }) => (notificationPrefs.set(me.id, body), body), { noOrg: true });

route("POST", "organizations/:id/switch", ({ me, params }) => {
  const o = db.organizations.find((x) => x.id === Number(params.id));
  if (!o || !roleOf(me.id, o.id)) fail(403, "Vous n'êtes pas membre de cette organisation.");
  me.current_organization_id = o.id;
  return { current_organization: o };
}, { noOrg: true });

// Invitations
const invitationPreview = (i) => ({ email: i.email, role: i.role, expires_at: i.expires_at, organization: (({ id, name }) => ({ id, name }))(db.organizations.find((o) => o.id === i.organization_id)), invited_by: ref(i.invited_by) });
route("GET", "invitations/:token", ({ params }) => {
  const i = db.invitations.find((x) => x.token === params.token);
  if (!i) fail(404, "Invitation introuvable.");
  if (new Date(i.expires_at) < new Date()) fail(410, "Cette invitation a expiré.");
  return invitationPreview(i);
}, { public: true });
route("POST", "invitations/:token/accept", ({ me, params }) => {
  const i = db.invitations.find((x) => x.token === params.token);
  if (!i) fail(404, "Invitation introuvable.");
  if (i.email !== me.email) fail(403, "Cette invitation est destinée à une autre adresse e-mail.");
  db.memberships.push({ user_id: me.id, organization_id: i.organization_id, role: i.role, created_at: db.iso() });
  db.invitations.splice(db.invitations.indexOf(i), 1);
  me.current_organization_id = i.organization_id;
  return { organization: db.organizations.find((o) => o.id === i.organization_id) };
}, { noOrg: true });
route("POST", "invitations/:token/register", ({ params, body }) => {
  const i = db.invitations.find((x) => x.token === params.token);
  if (!i) fail(404, "Invitation introuvable.");
  required(body, ["name", "password"]);
  if (String(body.password).length < 8) invalid({ password: ["Le mot de passe doit contenir au moins 8 caractères."] });
  const u = { id: db.nextId(), name: body.name, email: i.email, password: body.password, avatar: null, title: null, current_organization_id: i.organization_id, created_at: db.iso() };
  db.users.push(u);
  db.memberships.push({ user_id: u.id, organization_id: i.organization_id, role: i.role, created_at: db.iso() });
  db.invitations.splice(db.invitations.indexOf(i), 1);
  const token = randomBytes(16).toString("hex");
  tokens.set(token, u.id);
  return [201, { token, user: fullUser(u), organization: db.organizations.find((o) => o.id === i.organization_id) }];
}, { public: true });
route("GET", "invitations", ({ role, orgId }) => (allow(role, ["owner", "admin"]), db.invitations.filter((i) => i.organization_id === orgId)));
route("POST", "invitations", ({ role, orgId, body, me }) => {
  allow(role, ["owner", "admin"]);
  required(body, ["email", "role"]);
  if (!["admin", "manager", "member", "guest"].includes(body.role)) invalid({ role: ["Rôle invalide."] });
  if (db.memberships.some((m) => m.organization_id === orgId && user(m.user_id)?.email === body.email)) invalid({ email: ["Cette personne fait déjà partie de l'organisation."] });
  const i = { id: db.nextId(), organization_id: orgId, email: body.email, role: body.role, token: randomBytes(12).toString("hex"), invited_by: me.id, expires_at: db.iso(7), created_at: db.iso() };
  db.invitations.push(i);
  return [201, i];
});
route("POST", "invitations/:id/resend", ({ role, params }) => {
  allow(role, ["owner", "admin"]);
  const i = db.invitations.find((x) => x.id === Number(params.id)) ?? fail(404, "Invitation introuvable.");
  i.expires_at = db.iso(7);
  return i;
});
route("DELETE", "invitations/:id", ({ role, params }) => {
  allow(role, ["owner", "admin"]);
  const idx = db.invitations.findIndex((x) => x.id === Number(params.id));
  if (idx < 0) fail(404, "Invitation introuvable.");
  db.invitations.splice(idx, 1);
  return { message: "Invitation annulée." };
});

// Membres
route("GET", "members", ({ role, orgId }) => {
  allow(role, ["owner", "admin", "manager", "member"]);
  return db.memberships.filter((m) => m.organization_id === orgId).map((m) => {
    const u = user(m.user_id);
    return { user_id: u.id, name: u.name, email: u.email, avatar: u.avatar, role: m.role, title: u.title, joined_at: m.created_at, last_active_at: db.iso(u.active ?? -30) };
  });
});
route("PATCH", "members/:id", ({ role, orgId, params, body }) => {
  allow(role, ["owner", "admin"]);
  const m = db.memberships.find((x) => x.user_id === Number(params.id) && x.organization_id === orgId) ?? fail(404, "Membre introuvable.");
  if (m.role === "owner") fail(403, "Le rôle du propriétaire ne peut pas être modifié.");
  if (!["admin", "manager", "member", "guest"].includes(body.role)) invalid({ role: ["Rôle invalide."] });
  m.role = body.role;
  return m;
});
route("DELETE", "members/:id", ({ role, orgId, params }) => {
  allow(role, ["owner", "admin"]);
  const idx = db.memberships.findIndex((x) => x.user_id === Number(params.id) && x.organization_id === orgId);
  if (idx < 0) fail(404, "Membre introuvable.");
  if (db.memberships[idx].role === "owner") fail(403, "Le propriétaire ne peut pas être retiré.");
  db.memberships.splice(idx, 1);
  return { message: "Membre retiré." };
});

// Projets
const visibleProjects = (me, role) =>
  db.projects.filter((p) => !p.archived_at && (["owner", "admin"].includes(role) || p.members.includes(me.id) || p.owner_id === me.id));
const findProject = (id) => db.projects.find((p) => p.id === Number(id)) ?? fail(404, "Projet introuvable.");
route("GET", "projects", ({ me, role, query }) => {
  const status = query.get("status");
  return paginate(visibleProjects(me, role).filter((p) => !status || p.status === status).map((p) => projectJson(p)), query);
});
route("POST", "projects", ({ me, role, body }) => {
  allow(role, ["owner", "admin", "manager"]);
  required(body, ["name"]);
  const p = { id: db.nextId(), organization_id: 1, owner_id: me.id, client_id: null, name: body.name, description: body.description ?? null, status: body.status ?? "upcoming", start_date: body.start_date ?? null, end_date: body.end_date ?? null, archived_at: null, created_at: db.iso(), updated_at: db.iso(), members: [me.id], milestones: [], files: [] };
  db.projects.push(p);
  return [201, projectJson(p)];
});
route("GET", "projects/:id", ({ params }) => projectJson(findProject(params.id), true));
route("PATCH", "projects/:id", ({ params, body }) => {
  const p = findProject(params.id);
  for (const k of ["name", "description", "status", "start_date", "end_date"]) if (body[k] !== undefined) p[k] = body[k];
  return projectJson(p);
});
route("DELETE", "projects/:id", ({ params }) => ((findProject(params.id).archived_at = db.iso()), { message: "Projet archivé." }));
route("POST", "projects/:id/members", ({ params, body }) => {
  const p = findProject(params.id);
  if (!p.members.includes(Number(body.user_id))) p.members.push(Number(body.user_id));
  return [201, p.members.map(ref)];
});
route("DELETE", "projects/:id/members/:uid", ({ params }) => {
  const p = findProject(params.id);
  p.members = p.members.filter((u) => u !== Number(params.uid));
  return { message: "Membre retiré du projet." };
});
route("GET", "projects/:id/activity", ({ params }) => {
  const p = findProject(params.id);
  return [
    { id: 1, action: "task.done", body: "a terminé « Middleware d'organisation »", user: ref(2), created_at: db.iso(0, -0.33) },
    { id: 2, action: "task.commented", body: "a commenté « Endpoint POST /projects »", user: ref(3), created_at: db.iso(0, -1) },
    { id: 3, action: "file.added", body: "a ajouté le fichier « architecture-wine.md »", user: ref(1), created_at: db.iso(0, -3) },
    { id: 4, action: "task.moved", body: "a déplacé « Vue Kanban » vers En revue", user: ref(4), created_at: db.iso(-1) },
  ].filter(() => p.id === 1);
});
route("GET", "projects/:id/tasks", ({ params, query }) => {
  findProject(params.id);
  const status = query.get("status"), assignee = query.get("assignee_id");
  return db.tasks
    .filter((t) => t.project_id === Number(params.id) && (!status || t.status === status) && (!assignee || t.assignee_id === Number(assignee)))
    .sort((a, b) => a.position - b.position)
    .map((t) => taskJson(t));
});
route("POST", "projects/:id/tasks", ({ me, role, params, body }) => {
  allow(role, ["owner", "admin", "manager"]);
  findProject(params.id);
  required(body, ["title"]);
  const t = { id: db.nextId(), organization_id: 1, project_id: Number(params.id), parent_id: body.parent_id ?? null, assignee_id: body.assignee_id ?? null, created_by: me.id, title: body.title, description: body.description ?? null, status: body.status ?? "todo", priority: body.priority ?? "normal", due_date: body.due_date ?? null, position: db.tasks.length, completed_at: null, created_at: db.iso(), updated_at: db.iso() };
  db.tasks.push(t);
  return [201, t];
});

// Tâches
const findTask = (id) => db.tasks.find((t) => t.id === Number(id)) ?? fail(404, "Tâche introuvable.");
route("GET", "tasks/:id", ({ params }) => taskJson(findTask(params.id), true));
route("PATCH", "tasks/:id", ({ me, role, params, body }) => {
  const t = findTask(params.id);
  if (role === "guest") fail(403, "Cette action n'est pas autorisée.");
  if (role === "member" && t.assignee_id !== me.id && t.created_by !== me.id) fail(403, "Cette action n'est pas autorisée.");
  for (const k of ["title", "description", "assignee_id", "status", "priority", "due_date", "position"]) if (body[k] !== undefined) t[k] = body[k];
  t.completed_at = t.status === "done" ? t.completed_at ?? db.iso() : null;
  t.updated_at = db.iso();
  return t;
});
route("DELETE", "tasks/:id", ({ role, params }) => {
  allow(role, ["owner", "admin", "manager"]);
  const t = findTask(params.id);
  db.tasks.splice(db.tasks.indexOf(t), 1);
  return { message: "Tâche supprimée." };
});
route("POST", "tasks/:id/comments", ({ me, role, params, body }) => {
  if (role === "guest") fail(403, "Cette action n'est pas autorisée.");
  required(body, ["body"]);
  const c = { id: db.nextId(), organization_id: 1, task_id: Number(params.id), user_id: me.id, body: body.body, created_at: db.iso(), updated_at: db.iso() };
  db.comments.push(c);
  return [201, { ...c, author: ref(me.id) }];
});
route("GET", "me/tasks", ({ me, query }) => {
  const status = query.get("status");
  return db.tasks
    .filter((t) => t.assignee_id === me.id && !t.parent_id && (!status || t.status === status))
    .sort((a, b) => (a.due_date ?? "9999") < (b.due_date ?? "9999") ? -1 : 1)
    .map((t) => ({ ...t, project: (({ id, name }) => ({ id, name }))(db.projects.find((p) => p.id === t.project_id)) }));
});

// CRM
const crmRoles = ["owner", "admin", "manager"];
route("GET", "clients", ({ role, query }) => {
  allow(role, crmRoles);
  const q = (query.get("q") ?? "").toLowerCase();
  return paginate(db.clients.filter((c) => !q || [c.name, c.company, c.email].some((v) => v?.toLowerCase().includes(q))).map((c) => ({ ...c, owner: ref(c.owner_id) })), query);
});
route("POST", "clients", ({ me, role, body }) => {
  allow(role, crmRoles);
  required(body, ["name"]);
  const c = { id: db.nextId(), organization_id: 1, owner_id: me.id, name: body.name, company: body.company ?? null, email: body.email ?? null, phone: body.phone ?? null, address: body.address ?? null, notes: body.notes ?? null, created_at: db.iso(), updated_at: db.iso() };
  db.clients.push(c);
  return [201, c];
});
const findClient = (id) => db.clients.find((c) => c.id === Number(id)) ?? fail(404, "Client introuvable.");
route("GET", "clients/:id", ({ role, params }) => {
  allow(role, crmRoles);
  const c = findClient(params.id);
  return { ...c, owner: ref(c.owner_id), opportunities: db.opportunities.filter((o) => o.client_id === c.id) };
});
route("PATCH", "clients/:id", ({ role, params, body }) => {
  allow(role, crmRoles);
  const c = findClient(params.id);
  for (const k of ["name", "company", "email", "phone", "address", "notes"]) if (body[k] !== undefined) c[k] = body[k];
  return c;
});
route("DELETE", "clients/:id", ({ role, params }) => {
  allow(role, ["owner", "admin"]);
  db.clients.splice(db.clients.indexOf(findClient(params.id)), 1);
  return { message: "Client supprimé." };
});
route("GET", "clients/:id/activities", ({ role, params }) => {
  allow(role, crmRoles);
  return db.activities.filter((a) => a.client_id === Number(params.id)).sort((a, b) => (a.created_at < b.created_at ? 1 : -1)).map(({ client_id, at, user_id, ...a }) => ({ ...a, user: ref(user_id) }));
});
route("POST", "clients/:id/activities", ({ me, role, params, body }) => {
  allow(role, crmRoles);
  findClient(params.id);
  required(body, ["body"]);
  if (!["note", "call", "email", "meeting"].includes(body.kind)) invalid({ kind: ["Type invalide."] });
  const a = { id: db.nextId(), client_id: Number(params.id), user_id: me.id, kind: body.kind, action: `activity.${body.kind}`, body: body.body, meta: null, created_at: db.iso() };
  db.activities.push(a);
  return [201, { ...a, user: ref(me.id) }];
});
route("GET", "opportunities", ({ role, query }) => {
  allow(role, crmRoles);
  const stage = query.get("stage"), client = query.get("client_id");
  return paginate(db.opportunities.filter((o) => (!stage || o.stage === stage) && (!client || o.client_id === Number(client))).map(oppJson), query);
});
route("POST", "opportunities", ({ me, role, body }) => {
  allow(role, crmRoles);
  required(body, ["client_id", "title"]);
  const o = { id: db.nextId(), organization_id: 1, client_id: Number(body.client_id), owner_id: me.id, project_id: null, title: body.title, amount: body.amount != null ? Number(body.amount).toFixed(2) : null, stage: body.stage ?? "prospect", next_follow_up: body.next_follow_up ?? null, notes: body.notes ?? null, closed_at: null, created_at: db.iso(), updated_at: db.iso() };
  db.opportunities.push(o);
  return [201, oppJson(o)];
});
const findOpp = (id) => db.opportunities.find((o) => o.id === Number(id)) ?? fail(404, "Opportunité introuvable.");
route("GET", "opportunities/:id", ({ role, params }) => (allow(role, crmRoles), oppJson(findOpp(params.id))));
route("PATCH", "opportunities/:id", ({ me, role, params, body }) => {
  allow(role, crmRoles);
  const o = findOpp(params.id);
  const from = o.stage;
  for (const k of ["title", "stage", "next_follow_up", "notes"]) if (body[k] !== undefined) o[k] = body[k];
  if (body.amount !== undefined) o.amount = Number(body.amount).toFixed(2);
  if (o.stage !== from) {
    o.closed_at = ["won", "lost"].includes(o.stage) ? db.iso() : null;
    db.activities.push({ id: db.nextId(), client_id: o.client_id, user_id: me.id, kind: null, action: "opportunity.stage_changed", body: `« ${o.title} » : ${from} → ${o.stage}`, meta: { from, to: o.stage }, created_at: db.iso() });
    if (o.stage === "won" && !o.project_id) {
      const p = { id: db.nextId(), organization_id: 1, owner_id: me.id, client_id: o.client_id, name: o.title, description: null, status: "upcoming", start_date: null, end_date: null, archived_at: null, created_at: db.iso(), updated_at: db.iso(), members: [me.id], milestones: [], files: [] };
      db.projects.push(p);
      o.project_id = p.id;
    }
  }
  return oppJson(o);
});
route("DELETE", "opportunities/:id", ({ role, params }) => {
  allow(role, crmRoles);
  db.opportunities.splice(db.opportunities.indexOf(findOpp(params.id)), 1);
  return { message: "Opportunité supprimée." };
});

// Social
const findPost = (id) => db.posts.find((p) => p.id === Number(id)) ?? fail(404, "Publication introuvable.");
route("GET", "posts", ({ me, query }) => {
  const items = [...db.posts].sort((a, b) => (a.pinned !== b.pinned ? (a.pinned ? -1 : 1) : a.created_at < b.created_at ? 1 : -1));
  return paginate(items.filter((p) => !query.get("pinned_only") || p.pinned).map((p) => postJson(p, me.id)), query);
});
route("POST", "posts", ({ me, role, body }) => {
  allow(role, ["owner", "admin", "manager", "member"]);
  required(body, ["body"]);
  const p = { id: db.nextId(), organization_id: 1, author_id: me.id, body: body.body, pinned: false, pinned_at: null, kind: null, meta: null, created_at: db.iso(), updated_at: db.iso(), reactions: [], comments: [] };
  db.posts.push(p);
  if (body.pinned && ["owner", "admin"].includes(role)) (p.pinned = true), (p.pinned_at = db.iso());
  return [201, postJson(p, me.id)];
});
route("GET", "posts/:id", ({ me, params }) => postJson(findPost(params.id), me.id, true));
route("DELETE", "posts/:id", ({ params }) => (db.posts.splice(db.posts.indexOf(findPost(params.id)), 1), { message: "Publication supprimée." }));
route("POST", "posts/:id/pin", ({ role, params, body }) => {
  allow(role, ["owner", "admin"]);
  const p = findPost(params.id);
  p.pinned = body.pinned ?? !p.pinned;
  p.pinned_at = p.pinned ? db.iso() : null;
  return postJson(p, 0);
});
route("POST", "posts/:id/reactions", ({ me, params }) => {
  const p = findPost(params.id);
  if (!p.reactions.includes(me.id)) p.reactions.push(me.id);
  return [201, { id: p.reactions.length, post_id: p.id, user_id: me.id, emoji: "bravo" }];
});
route("DELETE", "posts/:id/reactions/:emoji", ({ me, params }) => {
  const p = findPost(params.id);
  p.reactions = p.reactions.filter((u) => u !== me.id);
  return { message: "Réaction retirée." };
});
route("POST", "posts/:id/comments", ({ me, params, body }) => {
  required(body, ["body"]);
  const p = findPost(params.id);
  p.comments.push([me.id, body.body]);
  return [201, { id: p.comments.length, post_id: p.id, author_id: me.id, body: body.body, created_at: db.iso(), author: ref(me.id) }];
});

// Analytics
route("GET", "analytics/overview", ({ role }) => {
  allow(role, crmRoles);
  const open = db.tasks.filter((t) => t.status !== "done" && !t.parent_id);
  const today = db.date();
  const workload = db.memberships.filter((m) => m.organization_id === 1).map((m) => ({ user_id: m.user_id, name: user(m.user_id).name, open_tasks: open.filter((t) => t.assignee_id === m.user_id).length })).filter((w) => w.open_tasks > 0).sort((a, b) => b.open_tasks - a.open_tasks);
  const late = db.projects.map((p) => ({ id: p.id, name: p.name, overdue: open.filter((t) => t.project_id === p.id && t.due_date && t.due_date < today).length })).filter((p) => p.overdue);
  return {
    active_projects: db.projects.filter((p) => !p.archived_at && ["upcoming", "in_progress"].includes(p.status)).length,
    overdue_tasks: open.filter((t) => t.due_date && t.due_date < today).length,
    workload,
    completed_tasks: 38,
    completed_per_week: [["S36", 6], ["S37", 9], ["S38", 7], ["S39", 11], ["S40", 5]].map(([week, count]) => ({ week, count })),
    late_projects: late.length ? late : [{ id: 1, name: "WINE V1", overdue: 2 }, { id: 2, name: "Site vitrine", overdue: 1 }, { id: 3, name: "Application mobile", overdue: 1 }],
  };
});
route("GET", "analytics/pipeline", ({ role }) => {
  allow(role, crmRoles);
  const by = {};
  for (const o of db.opportunities) (by[o.stage] ??= { stage: o.stage, count: 0, amount: 0 }), by[o.stage].count++, (by[o.stage].amount += Number(o.amount ?? 0));
  return { by_stage: Object.values(by) };
});
route("GET", "analytics/activity", () => ({ days: 30, events: [] }));

// --- Serveur HTTP ----------------------------------------------------------
const send = (res, status, data) => {
  res.writeHead(status, { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "*", "Access-Control-Allow-Methods": "*" });
  res.end(JSON.stringify(data));
};

const server = createServer(async (req, res) => {
  if (req.method === "OPTIONS") return send(res, 204, null);
  const url = new URL(req.url, `http://localhost:${PORT}`);
  if (url.pathname === "/api/up") return send(res, 200, { ok: true, service: "mock-api" });
  const m = url.pathname.match(/^\/api\/v1\/(.+?)\/?$/);
  if (!m) return send(res, 404, { message: "Not Found" });
  const r = routes.find((x) => x.method === req.method && x.re.test(m[1]));
  if (!r) return send(res, 404, { message: `Route ${req.method} /api/v1/${m[1]} absente du mock.` });

  let raw = "";
  for await (const chunk of req) raw += chunk;
  const token = (req.headers.authorization ?? "").replace(/^Bearer /, "");
  const me = user(tokens.get(token));
  try {
    if (!r.public && !me) fail(401, "Unauthenticated.");
    const orgId = Number(req.headers["x-organization-id"] ?? me?.current_organization_id);
    const role = me ? roleOf(me.id, orgId) : undefined;
    if (!r.public && !r.noOrg && !role) fail(403, "Vous n'êtes pas membre de cette organisation.");
    const params = Object.fromEntries(r.keys.map((k, i) => [k, decodeURIComponent(m[1].match(r.re)[i + 1])]));
    const out = await r.handler({ me, role, orgId, token, params, query: url.searchParams, body: raw ? JSON.parse(raw) : {} });
    const [status, data] = Array.isArray(out) && typeof out[0] === "number" && out.length === 2 ? out : [200, out];
    send(res, status, data);
  } catch (e) {
    if (e instanceof HttpError) send(res, e.status, { message: e.message, ...(e.errors ? { errors: e.errors } : {}) });
    else (console.error(e), send(res, 500, { message: "Erreur du mock." }));
  }
  console.log(`${req.method} ${url.pathname}${url.search}`);
});

// --- Temps réel (Socket.io) ---------------------------------------------------
const io = new Server(server, { cors: { origin: true, credentials: true } });
// Comme le vrai service realtime : jeton lu dans le cookie httpOnly wine_token (auth.token toléré).
const cookieToken = (header = "") => {
  const m = header.match(/(?:^|;\s*)wine_token=([^;]*)/);
  return m ? decodeURIComponent(m[1]) : undefined;
};
io.use((socket, next) => {
  const uid = tokens.get(socket.handshake.auth?.token ?? cookieToken(socket.handshake.headers.cookie));
  if (!uid) return next(new Error("unauthorized"));
  socket.data.userId = uid;
  next();
});
const channelJson = (c, uid) => {
  const msgs = db.messages.filter((m) => m.channel_id === c.id);
  const other = c.type === "direct" ? user(c.member_ids.find((id) => id !== uid)) : null;
  return { id: c.id, type: c.type, name: other ? other.name : c.name, project_id: c.project_id, member_ids: c.member_ids, unread_count: c.unread ?? 0, last_message_at: msgs.at(-1)?.created_at ?? null };
};
io.on("connection", (socket) => {
  const uid = socket.data.userId;
  socket.join(`user:${uid}`);
  socket.join("org:1");
  io.to("org:1").emit("presence:update", { user_id: uid, online: true });
  for (const id of [2, 3]) socket.emit("presence:update", { user_id: id, online: true });
  setTimeout(() => socket.emit("notification:new", { user_id: uid, type: "task.assigned", payload: { task_id: db.tasks[0].id, title: db.tasks[0].title, project_id: 1 }, at: db.iso() }), 4000);

  socket.on("channel:list", (ack) => ack?.({ ok: true, channels: db.channels.filter((c) => c.member_ids.includes(uid)).map((c) => channelJson(c, uid)) }));
  socket.on("channel:history", ({ channel_id }, ack) => {
    const c = db.channels.find((x) => x.id === channel_id);
    if (c) c.unread = 0;
    ack?.({ ok: true, messages: db.messages.filter((m) => m.channel_id === channel_id) });
  });
  socket.on("channel:direct", ({ user_id }, ack) => {
    let c = db.channels.find((x) => x.type === "direct" && x.member_ids.includes(uid) && x.member_ids.includes(user_id));
    if (!c) db.channels.push((c = { id: `d-${uid}-${user_id}`, type: "direct", name: user(user_id).name, project_id: null, member_ids: [uid, user_id] }));
    ack?.({ ok: true, channel: channelJson(c, uid) });
  });
  socket.on("channel:join", (channelId, ack) => (socket.join(`channel:${channelId}`), ack?.({ ok: true })));
  socket.on("message:send", ({ channel_id, body, attachments = [] }, ack) => {
    if (!body?.trim()) return ack?.({ ok: false, error: "invalid" });
    const msg = { _id: `m-${db.nextId()}`, organization_id: 1, channel_id, sender_id: uid, body, attachments, read_by: [{ user_id: uid, at: db.iso() }], created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
    db.messages.push(msg);
    io.to(`channel:${channel_id}`).emit("message:new", msg);
    ack?.({ ok: true, id: msg._id });
  });
  socket.on("typing", ({ channel_id }) => socket.to(`channel:${channel_id}`).emit("typing", { channel_id, user_id: uid }));
  socket.on("message:read", () => {});
  socket.on("disconnect", () => io.to("org:1").emit("presence:update", { user_id: uid, online: false }));
});

server.listen(PORT, () => console.log(`Mock API WINE → http://localhost:${PORT}/api  (octave@exemple.com / password)`));
