"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { isActive, NAV_ITEMS, type NavItem } from "./nav-items";
import { MobileNav } from "./mobile-nav";
import type { ShellOrg } from "./app-sidebar";

const PRIMARY = ["/", "/projets", "/taches", "/chat"] as const;

/** Barre de navigation inférieure (mobile / PWA). */
export function BottomNav({ org, hidden }: { org: ShellOrg; hidden: string[] }) {
  const pathname = usePathname();
  const items = NAV_ITEMS.filter((i) => PRIMARY.includes(i.href as (typeof PRIMARY)[number]) && !hidden.includes(i.href));

  return (
    <nav
      aria-label="Navigation rapide"
      className="fixed inset-x-0 bottom-0 z-40 px-3 pb-[max(0.55rem,env(safe-area-inset-bottom))] lg:hidden"
    >
      <ul className="glass mx-auto flex max-w-lg items-stretch justify-around gap-0.5 rounded-2xl border border-border/60 bg-background/80 p-1 shadow-lg backdrop-blur-xl">
        {items.map((item) => (
          <NavTab key={item.href} item={item} active={isActive(pathname, item.href)} />
        ))}
        <li className="flex-1">
          <div className="flex h-12 flex-col items-center justify-center">
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
                  <span className="text-[10px] font-medium">Plus</span>
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
          "flex h-12 min-w-11 flex-col items-center justify-center gap-0.5 rounded-xl text-[10px] font-medium transition-all duration-200",
          active
            ? "bg-primary text-primary-foreground shadow-[0_8px_20px_-10px_var(--primary)]"
            : "text-muted-foreground hover:bg-muted hover:text-foreground"
        )}
        aria-current={active ? "page" : undefined}
      >
        <Icon aria-hidden className="size-5" strokeWidth={active ? 2.25 : 1.75} />
        {item.label}
      </Link>
    </li>
  );
}
