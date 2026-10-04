import Link from "next/link";
import { WineLogo } from "@/components/common/wine-logo";
import { NavLinks, SettingsLink } from "./nav-links";
import { OrgCard } from "./org-card";
import { SidebarInstallButton } from "@/components/pwa/install-prompt";

export type ShellOrg = { name: string; members?: number; settingsHref?: string };

/** Barre latérale fixe (écrans larges) — coque premium. */
export function AppSidebar({ org, hidden }: { org: ShellOrg; hidden: string[] }) {
  return (
    <aside className="sticky top-0 z-20 hidden h-dvh w-64 shrink-0 flex-col border-r border-sidebar-border/80 bg-sidebar/85 px-3 pt-6 pb-4 backdrop-blur-2xl lg:flex dark:bg-sidebar/60">
      <div className="relative mb-8 overflow-hidden rounded-2xl border border-sidebar-border/50 bg-gradient-to-br from-primary/20 via-primary/5 to-transparent px-3 py-4">
        <div aria-hidden className="pointer-events-none absolute -top-8 -right-6 size-24 rounded-full bg-primary/25 blur-2xl" />
        <Link href="/" className="relative rounded-md" aria-label="WINE, accueil">
          <WineLogo withMark />
        </Link>
        <p className="relative mt-2 px-0.5 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
          Work IN Excellence
        </p>
      </div>
      <nav aria-label="Navigation principale" className="flex-1 overflow-y-auto px-1">
        <NavLinks hidden={hidden} />
      </nav>
      <div className="mt-3 space-y-2.5 border-t border-sidebar-border/70 pt-3">
        <SidebarInstallButton />
        <SettingsLink href={org.settingsHref} />
        <OrgCard name={org.name} members={org.members} />
      </div>
    </aside>
  );
}
