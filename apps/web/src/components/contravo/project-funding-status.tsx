"use client";

import { FileText, Wallet } from "lucide-react";
import { Panel, PanelTitle } from "@/components/common/panel";
import { fundingMessage } from "@/lib/funding";
import { cn } from "@/lib/utils";

export function ProjectFundingStatus({ hasInvoice }: { hasInvoice: boolean }) {
  const cfg = fundingMessage(hasInvoice);
  const Icon = hasInvoice ? FileText : Wallet;

  return (
    <Panel className={cn("relative overflow-hidden p-7", hasInvoice && "border-info/40 bg-info-soft/40")}>
      <PanelTitle className="mb-3 flex items-center gap-2">
        <Icon aria-hidden className="size-5" /> Financement
      </PanelTitle>
      <p className="font-heading text-xl">{cfg.label}</p>
      <p className="mt-1 text-sm text-muted-foreground">{cfg.detail}</p>
    </Panel>
  );
}
