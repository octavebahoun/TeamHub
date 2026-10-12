"use client";

import { Lock, LockOpen, Wallet } from "lucide-react";
import { Panel, PanelTitle } from "@/components/common/panel";
import { cn } from "@/lib/utils";
import type { ProjectStatus } from "@/lib/api/types";

type Phase = "awaiting_deposit" | "funded" | "unlocked";

function phaseFromWineStatus(status: ProjectStatus): Phase {
  if (status === "on_hold") return "awaiting_deposit";
  if (status === "in_progress") return "unlocked";
  if (status === "done") return "unlocked";
  return "funded";
}

const COPY: Record<Phase, { label: string; detail: string; icon: typeof Wallet }> = {
  awaiting_deposit: { label: "En attente d'acompte", detail: "Le projet reste en pause jusqu'au paiement Contravo.", icon: Wallet },
  funded: { label: "Acompte reçu", detail: "Fonds reçus — démarrage en cours.", icon: Lock },
  unlocked: { label: "Projet débloqué", detail: "Facturation OK, livraison en cours.", icon: LockOpen },
};

export function ProjectFundingStatus({ wineStatus, overridePhase }: { wineStatus: ProjectStatus; overridePhase?: Phase }) {
  const phase = overridePhase ?? phaseFromWineStatus(wineStatus);
  const cfg = COPY[phase];
  const Icon = cfg.icon;

  return (
    <Panel className={cn("relative overflow-hidden p-7 transition-colors", phase === "unlocked" && "border-success/40 bg-success-soft/30")}>
      <div className={cn("absolute -right-6 -top-6 size-24 rounded-full opacity-20 blur-2xl", phase === "awaiting_deposit" && "bg-brand animate-pulse", phase === "funded" && "bg-info", phase === "unlocked" && "bg-success")} aria-hidden />
      <PanelTitle className="mb-3 flex items-center gap-2">
        <Icon aria-hidden className="size-5" /> Financement Contravo
      </PanelTitle>
      <p className="font-heading text-xl">{cfg.label}</p>
      <p className="mt-1 text-sm text-muted-foreground">{cfg.detail}</p>
    </Panel>
  );
}
