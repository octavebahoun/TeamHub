import type { OpportunityStage, ProjectStatus, Role, TaskPriority, TaskStatus } from "@/lib/api/types";

/** Libellés français des énumérations de l'API, et tonalité visuelle associée. */

export type Tone = "brand" | "neutral" | "success" | "info" | "outline" | "danger";

export const PROJECT_STATUS: Record<ProjectStatus, { label: string; filter: string; tone: Tone }> = {
  in_progress: { label: "En cours", filter: "En cours", tone: "brand" },
  on_hold: { label: "En pause", filter: "En pause", tone: "neutral" },
  done: { label: "Terminé", filter: "Terminés", tone: "success" },
  upcoming: { label: "À venir", filter: "À venir", tone: "outline" },
};

export const TASK_STATUS: Record<TaskStatus, { label: string; dot: string }> = {
  todo: { label: "À faire", dot: "bg-subtle-foreground" },
  in_progress: { label: "En cours", dot: "bg-primary" },
  review: { label: "En revue", dot: "bg-info" },
  done: { label: "Terminé", dot: "bg-success" },
};

export const TASK_STATUS_ORDER: TaskStatus[] = ["todo", "in_progress", "review", "done"];

export const TASK_PRIORITY: Record<TaskPriority, { label: string; tone: Tone }> = {
  urgent: { label: "Urgente", tone: "danger" },
  high: { label: "Haute", tone: "brand" },
  normal: { label: "Moyenne", tone: "neutral" },
  low: { label: "Basse", tone: "outline" },
};

export const OPPORTUNITY_STAGE: Record<OpportunityStage, { label: string; dot: string; tone: Tone }> = {
  prospect: { label: "Prospect", dot: "bg-subtle-foreground", tone: "neutral" },
  contacted: { label: "Contacté", dot: "bg-info", tone: "info" },
  proposal: { label: "Proposition", dot: "bg-primary", tone: "brand" },
  won: { label: "Gagné", dot: "bg-success", tone: "success" },
  lost: { label: "Perdu", dot: "bg-destructive", tone: "outline" },
};

export const STAGE_ORDER: OpportunityStage[] = ["prospect", "contacted", "proposal", "won", "lost"];

export const ROLE: Record<Role, { label: string; description: string }> = {
  owner: { label: "Propriétaire", description: "Tout, y compris la facturation et la suppression" },
  admin: { label: "Admin", description: "Gère les membres, les projets et le CRM" },
  manager: { label: "Chef de projet", description: "Crée des projets et répartit les tâches" },
  member: { label: "Membre", description: "Travaille sur les projets dont il fait partie" },
  guest: { label: "Invité", description: "Lecture seule sur les projets partagés" },
};

export const ASSIGNABLE_ROLES: Role[] = ["admin", "manager", "member", "guest"];
