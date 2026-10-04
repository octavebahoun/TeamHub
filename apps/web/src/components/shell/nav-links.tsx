"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { isActive, NAV_ITEMS } from "./nav-items";

const itemClass = (active: boolean) =>
  cn(
    "relative flex h-11 items-center gap-3 rounded-xl px-3.5 text-[15px] transition-all duration-200",
    active
      ? "glow-active bg-sidebar-accent font-semibold text-sidebar-accent-foreground before:absolute before:top-1/2 before:left-0 before:h-5 before:w-[3px] before:-translate-y-1/2 before:rounded-r-full before:bg-primary"
      : "hover:bg-muted/70 hover:translate-x-0.5"
  );

/** Liens de navigation principale ; `hidden` = entrées interdites au rôle courant. */
export function NavLinks({ hidden = [], onNavigate }: { hidden?: string[]; onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <ul className="space-y-1">
      {NAV_ITEMS.filter((i) => !hidden.includes(i.href)).map(({ href, label, icon: Icon }) => {
        const active = isActive(pathname, href);
        return (
          <li key={href}>
            <Link href={href} onClick={onNavigate} aria-current={active ? "page" : undefined} className={itemClass(active)}>
              <Icon aria-hidden className="size-5" strokeWidth={1.75} />
              {label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

/** Paramètres : la page Membres, ou le profil pour les rôles qui ne voient pas l'équipe. */
export function SettingsLink({ href = "/parametres/membres", onNavigate }: { href?: string; onNavigate?: () => void }) {
  const pathname = usePathname();
  const active = pathname.startsWith("/parametres") || (href === "/profil" && pathname === "/profil");
  return (
    <Link href={href} onClick={onNavigate} aria-current={active ? "page" : undefined} className={itemClass(active)}>
      <Settings aria-hidden className="size-5" strokeWidth={1.75} />
      Paramètres
    </Link>
  );
}
