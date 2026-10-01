"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { isActive, NAV_ITEMS } from "./nav-items";

const itemClass = (active: boolean) =>
  cn(
    "flex h-11 items-center gap-3 rounded-lg px-3.5 text-[15px] transition-colors",
    active ? "bg-sidebar-accent font-semibold text-sidebar-accent-foreground" : "hover:bg-muted"
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

export function SettingsLink({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const active = pathname.startsWith("/parametres");
  return (
    <Link href="/parametres/membres" onClick={onNavigate} aria-current={active ? "page" : undefined} className={itemClass(active)}>
      <Settings aria-hidden className="size-5" strokeWidth={1.75} />
      Paramètres
    </Link>
  );
}
