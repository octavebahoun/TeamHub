import "server-only";
import { cache } from "react";
import { api, apiAll, apiOptional } from "./client";
import type {
  Activity,
  AnalyticsOverview,
  AnalyticsPipeline,
  AnalyticsProfitability,
  Relances,
  WeeklySummary,
  Client,
  Invitation,
  InvitationPreview,
  Me,
  Member,
  NotificationPrefs,
  Opportunity,
  OpportunityStage,
  Paginated,
  Post,
  Project,
  ProjectStatus,
  Task,
  TaskStatus,
} from "./types";

/**
 * Lectures de l'API, une fonction par besoin d'écran. `cache()` déduplique les
 * appels identiques au sein d'un même rendu serveur (layout + page).
 * Les endpoints marqués « extension » sont décrits dans docs/api-gaps.md :
 * l'écran reste fonctionnel (repli) tant qu'ils ne sont pas déployés.
 */

export const getMe = cache(() => api<Me>("me"));
/** Extension. */
export const getNotificationPrefs = cache(() =>
  apiOptional<NotificationPrefs | null>("me/notifications", null)
);

// --- Membres & invitations -------------------------------------------------
export const getMembers = cache(() => api<Member[]>("members"));
/** Extension. */
export const getPendingInvitations = cache(() => apiOptional<Invitation[]>("invitations", []));
/** Extension (route publique). */
export const getInvitationPreview = (token: string) =>
  apiOptional<InvitationPreview | null>(`invitations/${encodeURIComponent(token)}`, null, { anonymous: true });

// --- Projets & tâches --------------------------------------------------------
export const getProjects = cache((status?: ProjectStatus) => apiAll<Project>("projects", { status }));
export const getProject = cache((id: number) => api<Project>(`projects/${id}`));
export const getProjectTasks = cache((id: number, status?: TaskStatus) =>
  api<Task[]>(`projects/${id}/tasks`, { query: { status } })
);
export const getTask = cache((id: number) => api<Task>(`tasks/${id}`));
export const getMyTasks = cache(() => api<Task[]>("me/tasks"));
export const getProjectActivity = cache((id: number) => api<Activity[]>(`projects/${id}/activity`));

// --- CRM ---------------------------------------------------------------------
export const getClients = cache((q?: string) => apiAll<Client>("clients", { q }));
export const getClient = cache((id: number) => api<Client>(`clients/${id}`));
export const getOpportunities = cache((clientId?: number) =>
  apiAll<Opportunity>("opportunities", { client_id: clientId })
);
/** Extension : historique d'un client (notes, appels, e-mails, changements d'étape). */
export const getClientActivity = cache((id: number) => apiOptional<Activity[]>(`clients/${id}/activities`, []));

// --- Social ------------------------------------------------------------------
export const getPosts = cache(() => api<Paginated<Post>>("posts"));
export const getPost = cache((id: number) => api<Post>(`posts/${id}`));

// --- Analytics -----------------------------------------------------------------
export const getAnalyticsOverview = cache(() => api<AnalyticsOverview>("analytics/overview"));
export const getAnalyticsPipeline = cache(() => api<AnalyticsPipeline>("analytics/pipeline"));
export const getAnalyticsProfitability = cache(() =>
  apiOptional<AnalyticsProfitability | null>("analytics/profitability", null)
);
export const getWeeklySummary = cache(() => apiOptional<WeeklySummary | null>("analytics/summary", null));
export const getRelances = cache((limit?: number) =>
  apiOptional<Relances | null>("analytics/relances", null, { query: { limit } })
);

export type { OpportunityStage };
