"use client";

import { useState, type ReactNode } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { WineLogo } from "@/components/common/wine-logo";
import { NavLinks, SettingsLink } from "./nav-links";
import { OrgCard } from "./org-card";
import type { ShellOrg } from "./app-sidebar";

/** Navigation en tiroir sous 1024 px. */
export function MobileNav({
  org,
  hidden,
  trigger,
}: {
  org: ShellOrg;
  hidden: string[];
  /** Remplace le bouton hamburger (ex. onglet « Plus » de la barre inférieure). */
  trigger?: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {trigger ?? (
          <Button variant="outline" size="icon" className="lg:hidden" aria-label="Ouvrir le menu">
            <Menu aria-hidden />
          </Button>
        )}
      </SheetTrigger>
      <SheetContent side="left" className="flex w-[min(18rem,92vw)] flex-col gap-0 px-4 pt-6 pb-4">
        <SheetTitle className="mb-8 px-3">
          <WineLogo />
        </SheetTitle>
        <nav aria-label="Navigation principale" className="flex-1 overflow-y-auto">
          <NavLinks hidden={hidden} onNavigate={close} />
        </nav>
        <div className="mt-4 space-y-3 border-t pt-4">
          <SettingsLink href={org.settingsHref} onNavigate={close} />
          <OrgCard name={org.name} members={org.members} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
