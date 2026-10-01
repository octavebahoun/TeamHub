"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { WineLogo } from "@/components/common/wine-logo";
import { NavLinks, SettingsLink } from "./nav-links";
import { OrgCard } from "./org-card";
import type { ShellOrg } from "./app-sidebar";

/** Navigation en tiroir sous 1024 px. */
export function MobileNav({ org, hidden }: { org: ShellOrg; hidden: string[] }) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="lg:hidden" aria-label="Ouvrir le menu">
          <Menu aria-hidden />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="flex w-72 flex-col gap-0 px-4 pt-6 pb-4">
        <SheetTitle className="mb-8 px-3">
          <WineLogo />
        </SheetTitle>
        <nav aria-label="Navigation principale" className="flex-1">
          <NavLinks hidden={hidden} onNavigate={close} />
        </nav>
        <div className="space-y-3">
          <SettingsLink href={org.settingsHref} onNavigate={close} />
          <OrgCard name={org.name} members={org.members} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
