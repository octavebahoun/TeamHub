import Link from "next/link";
import { WineLogo } from "@/components/common/wine-logo";
import { NavLinks, SettingsLink } from "./nav-links";
import { OrgCard } from "./org-card";

export type ShellOrg = { name: string; members?: number };

/** Barre latérale fixe (écrans larges). */
export function AppSidebar({ org, hidden }: { org: ShellOrg; hidden: string[] }) {
  return (
    <aside className="sticky top-0 hidden h-dvh w-62 shrink-0 flex-col border-r bg-sidebar px-4 pt-7 pb-4 lg:flex">
      <Link href="/" className="mb-9 px-3 rounded-md" aria-label="WINE, accueil">
        <WineLogo />
      </Link>
      <nav aria-label="Navigation principale" className="flex-1">
        <NavLinks hidden={hidden} />
      </nav>
      <div className="space-y-3">
        <SettingsLink />
        <OrgCard {...org} />
      </div>
    </aside>
  );
}
