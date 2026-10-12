"use client";

import { FileText, Wallet } from "lucide-react";
import { Panel, PanelTitle } from "@/components/common/panel";
import { fundingMessage } from "@/lib/funding";
import { cn } from "@/lib/utils";

export function ProjectFundingStatus({ hasInvoice, state = hasInvoice ? "invoiced" : "none" }: { hasInvoice: boolean; state?: "none" | "awaiting" | "unlocked" | "invoiced" }) {
  const cfg = state === "awaiting"
    ? { label: "En attente d'acompte", detail: "Le projet est en pause tant que le paiement n'est pas enregistré." }
    : state === "unlocked"
      ? { label: "Projet débloqué", detail: "Un paiement a été encaissé. Le travail peut continuer." }
      : fundingMessage(hasInvoice);
  const Icon = hasInvoice ? FileText : Wallet;

  return (
    <Panel className={cn("relative overflow-hidden p-7", (hasInvoice || state === "unlocked") && "border-info/40 bg-info-soft/40")}>
      <PanelTitle className="mb-3 flex items-center gap-2">
        <Icon aria-hidden className="size-5" /> Financement
      </PanelTitle>
      <p className="font-heading text-xl">{cfg.label}</p>
      <p className="mt-1 text-sm text-muted-foreground">{cfg.detail}</p>
    </Panel>
  );
}
