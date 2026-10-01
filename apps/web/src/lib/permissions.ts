import type { Me, Role } from "@/lib/api/types";
import { ASSIGNABLE_ROLES } from "@/lib/labels";

/**
 * Miroir côté interface des Policies Laravel (qui restent la seule source de
 * vérité) : sert uniquement à masquer les actions qu'un rôle ne peut pas faire.
 */

export type Ability =
  | "project.create"
  | "task.create"
  | "member.manage"
  | "crm.view"
  | "crm.edit"
  | "analytics.view"
  | "social.view"
  | "post.create"
  | "post.pin"
  | "members.view";

const RULES: Record<Ability, Role[]> = {
  "project.create": ["owner", "admin", "manager"],
  "task.create": ["owner", "admin", "manager"],
  "member.manage": ["owner", "admin"],
  "members.view": ["owner", "admin", "manager", "member"],
  "crm.view": ["owner", "admin", "manager"],
  "crm.edit": ["owner", "admin", "manager"],
  "analytics.view": ["owner", "admin", "manager"],
  "social.view": ["owner", "admin", "manager", "member"],
  "post.create": ["owner", "admin", "manager", "member"],
  "post.pin": ["owner", "admin"],
};

export function currentRole(me: Me): Role {
  const id = me.current_organization?.id ?? me.user.current_organization_id;
  return me.organizations.find((o) => o.id === id)?.pivot?.role ?? "guest";
}

export const can = (role: Role, ability: Ability) => RULES[ability].includes(role);

// Nommer ou retirer un Admin est réservé au Propriétaire (doc « Parcours par rôle »).
export const assignableRoles = (viewer: Role): Role[] =>
  viewer === "owner" ? ASSIGNABLE_ROLES : ASSIGNABLE_ROLES.filter((r) => r !== "admin");

export const canEditMember = (viewer: Role, target: Role) =>
  can(viewer, "member.manage") && target !== "owner" && (viewer === "owner" || target !== "admin");
