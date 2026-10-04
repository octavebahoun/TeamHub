"use client";

import { useState } from "react";
import { Check, Copy, Pencil } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Panel, PanelTitle } from "@/components/common/panel";

type Suggestion = { id: string; client: string; channel: string; message: string };

const SEED: Suggestion[] = [
  {
    id: "1",
    client: "Porto-Novo Digital",
    channel: "WhatsApp",
    message:
      "Bonjour, je me permets de revenir vers vous concernant la facture FAC-2026-008 (1 200 000 XOF). Pouvez-vous confirmer le paiement via MTN MoMo ou Moov Money ? Merci.",
  },
  {
    id: "2",
    client: "Maison Akwa — Abidjan",
    channel: "Email",
    message:
      "Bonjour, le devis DEV-2026-019 est toujours en attente. Souhaitez-vous qu’on ajuste les lignes ou qu’on planifie une signature électronique cette semaine ?",
  },
  {
    id: "3",
    client: "Celtiis Cotonou",
    channel: "Telegram",
    message:
      "Bonjour l’équipe Celtiis, le livrable campagne Q3 est prêt pour validation. Un créneau de 15 min vous conviendrait-il demain ?",
  },
];

/** Assistant de relances clients — suggestions éditables / copiables. */
export function FollowUpAssistant() {
  const [items, setItems] = useState(SEED);
  const [editing, setEditing] = useState<string | null>(null);

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Message copié");
    } catch {
      toast.error("Impossible de copier");
    }
  };

  return (
    <Panel className="p-7">
      <PanelTitle className="mb-5">Assistant de relances</PanelTitle>
      <ul className="space-y-5">
        {items.map((item) => (
          <li key={item.id} className="rounded-xl border bg-muted/40 p-4">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <p className="font-medium">
                {item.client} <span className="text-sm font-normal text-muted-foreground">· {item.channel}</span>
              </p>
              <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setEditing(editing === item.id ? null : item.id)}>
                  <Pencil aria-hidden className="size-3.5" />
                  Modifier
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => void copy(item.message)}>
                  <Copy aria-hidden className="size-3.5" />
                  Copier
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => {
                    toast.success(`Relance prête pour ${item.client}`);
                  }}
                >
                  <Check aria-hidden className="size-3.5" />
                  Envoyer
                </Button>
              </div>
            </div>
            {editing === item.id ? (
              <Textarea
                value={item.message}
                rows={4}
                onChange={(e) => setItems((prev) => prev.map((x) => (x.id === item.id ? { ...x, message: e.target.value } : x)))}
                aria-label={`Message de relance pour ${item.client}`}
              />
            ) : (
              <p className="text-sm leading-relaxed text-muted-foreground">{item.message}</p>
            )}
          </li>
        ))}
      </ul>
    </Panel>
  );
}
