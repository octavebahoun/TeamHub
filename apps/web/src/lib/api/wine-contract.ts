import { plural } from "@/lib/format";
import type { AnalyticsOverview, AnalyticsPipeline, ProjectStatus, TaskStatus, WeeklySummary } from "@/lib/api/types";
import type { AiSummary, AttachmentStatus, SearchResults } from "@/lib/data/types";

/** POST /api/v1/notifications/read — tout marquer lu. */
export const MARK_ALL_NOTIFICATIONS_PATH = "notifications/read";

export type InboxRow = {
  id: number | string;
  type: string;
  title: string;
  body?: string | null;
  link?: string | null;
  read_at?: string | null;
  created_at?: string | null;
};

export type InboxListResponse = {
  data?: InboxRow[];
  unread_count?: number;
};

export type BellItem = {
  id: string;
  type: string;
  title: string;
  body: string;
  href: string | null;
  read: boolean;
  at: string;
};

export function mapInboxList(payload: InboxListResponse | InboxRow[]): BellItem[] {
  const rows = Array.isArray(payload) ? payload : (payload.data ?? []);
  return rows.map((row) => ({
    id: String(row.id),
    type: row.type,
    title: row.title,
    body: row.body ?? "",
    href: row.link ?? null,
    read: row.read_at != null && row.read_at !== "",
    at: row.created_at ?? new Date(0).toISOString(),
  }));
}

export type WineSearchPayload = {
  query?: string;
  projects?: { id: number; name: string; status: ProjectStatus; client_name?: string | null }[];
  tasks?: {
    id: number;
    title: string;
    status: TaskStatus;
    project_id: number;
    project_name?: string;
    project?: { name?: string | null } | null;
  }[];
  clients?: { id: number; name: string; company?: string | null; city?: string | null }[];
  quotes?: SearchResults["quotes"];
  messages?: {
    id: string;
    body: string;
    channel?: string | null;
    channel_id?: string | null;
    client_id?: number | null;
    client_name?: string | null;
    href?: string | null;
  }[];
};

/** GET /api/v1/search renvoie projets, tâches et clients. Pas de devis. */
export function mapWineSearch(raw: WineSearchPayload): SearchResults {
  return {
    query: raw.query ?? "",
    projects: (raw.projects ?? []).map((p) => ({
      id: p.id,
      name: p.name,
      status: p.status,
      client_name: p.client_name ?? null,
    })),
    tasks: (raw.tasks ?? []).map((t) => ({
      id: t.id,
      title: t.title,
      status: t.status,
      project_id: t.project_id,
      project_name: t.project_name ?? t.project?.name ?? "Projet",
    })),
    clients: (raw.clients ?? []).map((c) => ({
      id: c.id,
      name: c.name,
      company: c.company ?? null,
      city: c.city ?? null,
    })),
    quotes: raw.quotes ?? [],
    messages: (raw.messages ?? []).map((m) => ({
      id: m.id,
      body: m.body,
      href: m.href ?? (m.client_id ? `/crm/${m.client_id}` : m.channel_id ? `/chat?canal=${m.channel_id}` : "/chat"),
      label: m.client_name ?? (m.channel === "telegram" ? "Telegram" : m.channel === "whatsapp" ? "WhatsApp" : "Message"),
    })),
  };
}

const DOWNLOADABLE: ReadonlySet<AttachmentStatus> = new Set(["clean", "ready"]);

/**
 * Téléchargement WINE : GET /api/v1/attachments/{id}/download.
 * L'API refuse (422) tant que le scan n'est pas clean ou ready.
 */
export function attachmentDownloadPath(status: AttachmentStatus, id: string): string | null {
  if (!DOWNLOADABLE.has(status)) return null;
  return `/v1/attachments/${encodeURIComponent(id)}/download`;
}

export type FinancialSnapshot = {
  activeProjects: number;
  overdueTasks: number;
  openPipelineXof: number;
  wonXof: number;
  revenueXof: number;
  cashXof: number;
  marginRate: number;
  openQuotesXof: number;
};

const OPEN_STAGES = new Set(["prospect", "contacted", "proposal"]);

/** Chiffres issus de GET analytics/overview et GET analytics/pipeline. */
export function financialFromAnalytics(overview: AnalyticsOverview, pipeline: AnalyticsPipeline): FinancialSnapshot {
  const openPipelineXof = pipeline.by_stage.filter((s) => OPEN_STAGES.has(s.stage)).reduce((sum, s) => sum + s.amount, 0);
  const wonXof = pipeline.by_stage.find((s) => s.stage === "won")?.amount ?? 0;
  return {
    activeProjects: overview.active_projects,
    overdueTasks: overview.overdue_tasks,
    openPipelineXof,
    wonXof,
    revenueXof: overview.finance?.revenue_xof ?? wonXof,
    cashXof: overview.finance?.cash_xof ?? 0,
    marginRate: overview.finance?.margin_rate ?? 0,
    openQuotesXof: overview.finance?.open_quotes_xof ?? 0,
  };
}

function xof(amount: number): string {
  return `${new Intl.NumberFormat("fr-FR").format(amount)} FCFA`;
}

/** Bilan rédigé à partir des analytics déjà exposées. Repli si GET /analytics/summary est indisponible. */
export function summaryFromAnalytics(overview: AnalyticsOverview, pipeline: AnalyticsPipeline): AiSummary {
  const snap = financialFromAnalytics(overview, pipeline);
  const projects = plural(snap.activeProjects, "projet actif", "projets actifs");
  const late = plural(snap.overdueTasks, "tâche en retard", "tâches en retard");
  const bullets = [
    `${projects}, ${late}.`,
    `Pipeline ouvert : ${xof(snap.openPipelineXof)}.`,
    `Opportunités gagnées : ${xof(snap.wonXof)}.`,
  ];
  if (snap.openQuotesXof > 0) bullets.push(`Devis en cours : ${xof(snap.openQuotesXof)}.`);
  if (overview.workload.length > 0) {
    const busiest = [...overview.workload].sort((a, b) => b.open_tasks - a.open_tasks)[0];
    bullets.push(`Charge la plus haute : ${busiest.name} (${plural(busiest.open_tasks, "tâche ouverte", "tâches ouvertes")}).`);
  }
  return {
    scope: "pipeline",
    scope_id: "weekly",
    summary: `${projects} et ${late}. Le pipeline ouvert représente ${xof(snap.openPipelineXof)}.`,
    bullets,
    generated_at: new Date().toISOString(),
  };
}

export type WeeklyPriority = { label: string; href: string };

export type WeeklyBrief = {
  headline: string;
  narrative: string;
  priorities: WeeklyPriority[];
  source: "gemini" | "fallback";
  from: string | null;
  to: string | null;
};

/** Relie une priorité du bilan à l'écran WINE où l'action se fait. */
export function priorityHref(label: string): string {
  const t = label.toLocaleLowerCase("fr-FR");
  if (/retard|tâche|tache|assign|clôtur|clotur/.test(t)) return "/taches";
  if (/chat|message|canal/.test(t)) return "/chat";
  if (/pipeline|opportun|affaire|relanc|devis|client|commercial/.test(t)) return "/crm/pipeline";
  if (/membre|charge|équipe|equipe/.test(t)) return "/parametres/membres";
  if (/projet/.test(t)) return "/projets";
  return "/taches";
}

export function briefFromWeeklySummary(weekly: WeeklySummary): WeeklyBrief {
  return {
    headline: weekly.headline.trim() || "Bilan de la semaine",
    narrative: weekly.narrative.trim(),
    priorities: weekly.priorities
      .map((label) => label.trim())
      .filter(Boolean)
      .slice(0, 3)
      .map((label) => ({ label, href: priorityHref(label) })),
    source: weekly.source === "gemini" ? "gemini" : "fallback",
    from: weekly.period?.from ?? null,
    to: weekly.period?.to ?? null,
  };
}

export function briefFromAnalytics(overview: AnalyticsOverview, pipeline: AnalyticsPipeline): WeeklyBrief {
  const local = summaryFromAnalytics(overview, pipeline);
  return {
    headline: "Bilan de la semaine",
    narrative: local.summary,
    priorities: local.bullets.map((label) => ({ label, href: priorityHref(label) })),
    source: "fallback",
    from: null,
    to: null,
  };
}
