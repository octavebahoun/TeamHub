import type { Me, Role } from "@/lib/api/types";

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
  "post.create": ["owner", "admin", "manager", "member"],
  "post.pin": ["owner", "admin"],
};

export function currentRole(me: Me): Role {
  const id = me.current_organization?.id ?? me.user.current_organization_id;
  return me.organizations.find((o) => o.id === id)?.pivot?.role ?? "guest";
}

export const can = (role: Role, ability: Ability) => RULES[ability].includes(role);
