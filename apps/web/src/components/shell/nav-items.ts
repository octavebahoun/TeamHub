import { BarChart3, Briefcase, FolderClosed, House, MessageSquare, SquareCheck, Users } from "lucide-react";
import type { Ability } from "@/lib/permissions";

export type NavItem = { href: string; label: string; icon: typeof House; ability?: Ability };

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Accueil", icon: House },
  { href: "/projets", label: "Projets", icon: FolderClosed },
  { href: "/taches", label: "Tâches", icon: SquareCheck },
  { href: "/chat", label: "Chat", icon: MessageSquare },
  { href: "/social", label: "Social", icon: Users, ability: "social.view" },
  { href: "/analytics", label: "Analytics", icon: BarChart3, ability: "analytics.view" },
  { href: "/crm", label: "CRM", icon: Briefcase, ability: "crm.view" },
];

/** Une entrée est active sur sa page et ses sous-pages (« / » seulement sur l'accueil). */
export const isActive = (pathname: string, href: string) =>
  href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
