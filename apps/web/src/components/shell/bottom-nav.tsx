"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { isActive, NAV_ITEMS, type NavItem } from "./nav-items";
import { MobileNav } from "./mobile-nav";
import type { ShellOrg } from "./app-sidebar";

const PRIMARY = ["/", "/projets", "/taches", "/chat"] as const;

/** Barre de navigation inférieure (mobile / PWA) — zones tactiles ≥ 44 px. */
export function BottomNav({ org, hidden }: { org: ShellOrg; hidden: string[] }) {
  const pathname = usePathname();
  const items = NAV_ITEMS.filter((i) => PRIMARY.includes(i.href as (typeof PRIMARY)[number]) && !hidden.includes(i.href));

  return (
    <nav
      aria-label="Navigation rapide"
      className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 px-2 pt-1 pb-[max(0.5rem,env(safe-area-inset-bottom))] backdrop-blur lg:hidden dark:glass dark:bg-background/70"
    >
      <ul className="mx-auto flex max-w-lg items-stretch justify-around gap-0.5">
        {items.map((item) => (
          <NavTab key={item.href} item={item} active={isActive(pathname, item.href)} />
        ))}
        <li className="flex-1">
          <div className="flex h-14 flex-col items-center justify-center gap-0.5">
            <MobileNav
              org={org}
              hidden={hidden}
              trigger={
                <button
                  type="button"
                  className="flex min-h-11 min-w-11 flex-col items-center justify-center gap-0.5 rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground"
                  aria-label="Plus de menus"
                >
                  <MoreHorizontal aria-hidden className="size-5" strokeWidth={1.75} />
                  <span className="text-[11px] font-medium">Plus</span>
                </button>
              }
            />
          </div>
        </li>
      </ul>
    </nav>
  );
}

function NavTab({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = item.icon;
  return (
    <li className="flex-1">
      <Link
        href={item.href}
        className={cn(
          "flex h-14 min-w-11 flex-col items-center justify-center gap-0.5 rounded-xl text-[11px] font-medium transition-colors",
          active ? "bg-brand-soft text-brand-soft-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
        )}
        aria-current={active ? "page" : undefined}
      >
        <Icon aria-hidden className="size-5" strokeWidth={active ? 2.25 : 1.75} />
        {item.label}
      </Link>
    </li>
  );
}
