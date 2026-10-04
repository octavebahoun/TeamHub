import "server-only";
import { mockAnalyticsOverview, mockAnalyticsPipeline } from "@/lib/data/mocks/analytics";
import { mockClients } from "@/lib/data/mocks/clients";
import { mockProjects } from "@/lib/data/mocks/projects";
import {
  addMockComment,
  createMockPost,
  deleteMockPost,
  getMockPost,
  listMockPosts,
  pinMockPost,
  setMockBravo,
} from "@/lib/data/mocks/social-store";
import { mockTasks } from "@/lib/data/mocks/tasks";
import { makeMockToken, mockMe, mockMembers, mockOrganization, mockUser } from "@/lib/data/mocks/session";
import { ApiError } from "./errors";
import type { Opportunity } from "./types";

type Options = {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined | null>;
  anonymous?: boolean;
};

const mockOpportunities: Opportunity[] = [
  {
    id: 401,
    organization_id: 1,
    client_id: 101,
    owner_id: 2,
    project_id: 201,
    title: "Site e-commerce Maison Akwa",
    amount: "4850000.00",
    stage: "proposal",
    next_follow_up: "2026-10-20",
    notes: "Devis envoyé — paiement MTN MoMo.",
    closed_at: null,
    created_at: "2026-08-01T10:00:00Z",
    client: { id: 101, name: "Adjoa Kouassi", company: "Maison Akwa — Abidjan" },
    owner: { id: 2, name: "Koffi Mensah" },
  },
  {
    id: 402,
    organization_id: 1,
    client_id: 102,
    owner_id: 1,
    project_id: null,
    title: "Portail municipal Porto-Novo",
    amount: "12000000.00",
    stage: "contacted",
    next_follow_up: "2026-11-30",
    notes: null,
    closed_at: null,
    created_at: "2026-09-05T10:00:00Z",
    client: { id: 102, name: "Romuald Agbessi", company: "Porto-Novo Digital" },
    owner: { id: 1, name: "Amina Traoré" },
  },
];

function bodyOf<T extends Record<string, unknown>>(body: unknown): T {
  return (body && typeof body === "object" ? body : {}) as T;
}

function paginate<T>(items: T[], page = 1) {
  return {
    data: items,
    current_page: page,
    last_page: 1,
    per_page: items.length || 15,
    total: items.length,
    next_page_url: null,
    prev_page_url: null,
  };
}

/**
 * Répond aux appels `api()` quand NEXT_PUBLIC_USE_MOCKS=true.
 * Couvre auth + lectures principales pour naviguer sans Laravel.
 */
export function resolveMock<T>(path: string, options: Options = {}): T {
  const method = options.method ?? "GET";
  const p = path.replace(/^\//, "").replace(/\?.*$/, "");
  const q = options.query ?? {};

  // --- Auth ---
  if (p === "auth/login" && method === "POST") {
    const b = bodyOf<{ email?: string; password?: string }>(options.body);
    if (!b.email || !b.password) {
      throw new ApiError(422, "Identifiants invalides.", { email: ["Email et mot de passe requis."] });
    }
    return {
      token: makeMockToken(b.email),
      user: { ...mockUser, email: b.email, name: b.email.split("@")[0] || mockUser.name },
    } as T;
  }
  if (p === "auth/register" && method === "POST") {
    const b = bodyOf<{ name?: string; email?: string; password?: string; organization_name?: string }>(options.body);
    if (!b.email || !b.password || !b.name || !b.organization_name) {
      throw new ApiError(422, "Champs incomplets.", {
        email: !b.email ? ["Email requis."] : [],
        name: !b.name ? ["Nom requis."] : [],
        organization_name: !b.organization_name ? ["Nom d'organisation requis."] : [],
        password: !b.password ? ["Mot de passe requis."] : [],
      });
    }
    const org = { ...mockOrganization, name: b.organization_name, slug: b.organization_name.toLowerCase().replace(/\s+/g, "-") };
    const user = { ...mockUser, name: b.name, email: b.email };
    return { token: makeMockToken(b.email), user, organization: org } as T;
  }
  if (p === "auth/logout" && method === "POST") return null as T;
  if (p === "auth/forgot-password" && method === "POST") return { ok: true } as T;
  if (p === "auth/reset-password" && method === "POST") return { ok: true } as T;

  // --- Session ---
  if (p === "me" && method === "GET") return structuredClone(mockMe) as T;
  if (p === "me/notifications" && method === "GET") {
    return { task_assigned: true, due_reminder: true, chat_messages: true, weekly_digest: false } as T;
  }
  if (p === "me/tasks" && method === "GET") {
    return mockTasks.filter((t) => t.assignee_id === mockUser.id || t.created_by === mockUser.id) as T;
  }
  if (p === "members" && method === "GET") return structuredClone(mockMembers) as T;
  if (p === "invitations" && method === "GET") return [] as T;

  // --- Projets / tâches ---
  if (p === "projects" && method === "GET") {
    const status = q.status ? String(q.status) : undefined;
    const items = mockProjects.filter((pr) => !status || pr.status === status);
    return paginate(items, Number(q.page ?? 1)) as T;
  }
  {
    const m = /^projects\/(\d+)$/.exec(p);
    if (m && method === "GET") {
      const project = mockProjects.find((pr) => pr.id === Number(m[1]));
      if (!project) throw new ApiError(404, "Projet introuvable.");
      return structuredClone(project) as T;
    }
  }
  {
    const m = /^projects\/(\d+)\/tasks$/.exec(p);
    if (m && method === "GET") {
      const status = q.status ? String(q.status) : undefined;
      return mockTasks.filter((t) => t.project_id === Number(m[1]) && (!status || t.status === status)) as T;
    }
  }
  {
    const m = /^projects\/(\d+)\/activity$/.exec(p);
    if (m && method === "GET") return [] as T;
  }
  {
    const m = /^tasks\/(\d+)$/.exec(p);
    if (m && method === "GET") {
      const task = mockTasks.find((t) => t.id === Number(m[1]));
      if (!task) throw new ApiError(404, "Tâche introuvable.");
      return structuredClone(task) as T;
    }
  }

  // --- CRM ---
  if (p === "clients" && method === "GET") {
    const needle = String(q.q ?? "").toLowerCase();
    const items = needle
      ? mockClients.filter((c) => c.name.toLowerCase().includes(needle) || (c.company ?? "").toLowerCase().includes(needle))
      : mockClients;
    return paginate(items, Number(q.page ?? 1)) as T;
  }
  {
    const m = /^clients\/(\d+)$/.exec(p);
    if (m && method === "GET") {
      const client = mockClients.find((c) => c.id === Number(m[1]));
      if (!client) throw new ApiError(404, "Client introuvable.");
      return structuredClone(client) as T;
    }
  }
  {
    const m = /^clients\/(\d+)\/activities$/.exec(p);
    if (m && method === "GET") return [] as T;
  }
  if (p === "opportunities" && method === "GET") {
    const clientId = q.client_id != null ? Number(q.client_id) : undefined;
    const items = clientId ? mockOpportunities.filter((o) => o.client_id === clientId) : mockOpportunities;
    return paginate(items, Number(q.page ?? 1)) as T;
  }

  // --- Social ---
  if (p === "posts" && method === "GET") {
    const data = listMockPosts();
    return paginate(data, Number(q.page ?? 1)) as T;
  }
  if (p === "posts" && method === "POST") {
    const b = bodyOf<{ body?: string }>(options.body);
    if (!b.body?.trim()) throw new ApiError(422, "Contenu requis.", { body: ["Écrivez quelque chose."] });
    return createMockPost(b.body) as T;
  }
  {
    const m = /^posts\/(\d+)$/.exec(p);
    if (m && method === "GET") {
      const post = getMockPost(Number(m[1]));
      if (!post) throw new ApiError(404, "Publication introuvable.");
      return post as T;
    }
    if (m && method === "DELETE") {
      deleteMockPost(Number(m[1]));
      return null as T;
    }
  }
  {
    const m = /^posts\/(\d+)\/pin$/.exec(p);
    if (m && method === "POST") {
      const b = bodyOf<{ pinned?: boolean }>(options.body);
      try {
        return pinMockPost(Number(m[1]), b.pinned !== false) as T;
      } catch {
        throw new ApiError(404, "Publication introuvable.");
      }
    }
  }
  {
    const m = /^posts\/(\d+)\/reactions$/.exec(p);
    if (m && method === "POST") {
      try {
        return setMockBravo(Number(m[1]), true) as T;
      } catch {
        throw new ApiError(404, "Publication introuvable.");
      }
    }
  }
  {
    const m = /^posts\/(\d+)\/reactions\/bravo$/.exec(p);
    if (m && method === "DELETE") {
      try {
        return setMockBravo(Number(m[1]), false) as T;
      } catch {
        throw new ApiError(404, "Publication introuvable.");
      }
    }
  }
  {
    const m = /^posts\/(\d+)\/comments$/.exec(p);
    if (m && method === "POST") {
      const b = bodyOf<{ body?: string }>(options.body);
      if (!b.body?.trim()) throw new ApiError(422, "Commentaire vide.");
      try {
        return addMockComment(Number(m[1]), b.body) as T;
      } catch {
        throw new ApiError(404, "Publication introuvable.");
      }
    }
  }

  {
    const m = /^projects\/(\d+)\/activity$/.exec(p);
    if (m && method === "GET") {
      return [
        {
          id: 1,
          action: "project.created",
          body: "a créé le projet",
          user: { id: 1, name: "Amina Traoré" },
          created_at: "2026-09-01T10:00:00Z",
        },
      ] as T;
    }
  }

  // --- Analytics ---
  if (p === "analytics/overview" && method === "GET") return structuredClone(mockAnalyticsOverview) as T;
  if (p === "analytics/pipeline" && method === "GET") return structuredClone(mockAnalyticsPipeline) as T;

  // Mutations génériques en mock : succès silencieux
  if (method !== "GET") {
    return { ok: true } as T;
  }

  throw new ApiError(404, `Mock non défini pour ${method} ${p}`);
}
