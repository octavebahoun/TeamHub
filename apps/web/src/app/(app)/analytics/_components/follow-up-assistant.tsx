"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, Pencil } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/common/empty-state";
import { Panel, PanelTitle } from "@/components/common/panel";
import { sendFollowUp } from "@/lib/actions/follow-ups";
import type { FollowUpItem } from "@/lib/follow-ups";

/** Relances construites depuis les factures, devis et dates CRM — jamais d'exemples figés. */
export function FollowUpAssistant({ items: initial }: { items: FollowUpItem[] }) {
  const router = useRouter();
  const [items, setItems] = useState(initial);
  const [editing, setEditing] = useState<string | null>(null);
  const [sending, start] = useTransition();

  useEffect(() => {
    setItems(initial);
  }, [initial]);

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Message copié");
    } catch {
      toast.error("Impossible de copier");
    }
  };

  const send = (item: FollowUpItem) => {
    start(async () => {
      const res = await sendFollowUp(item, item.message);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success(item.kind === "crm" ? `Relance notée pour ${item.client}` : `Relance envoyée à ${item.client}`);
      setItems((prev) => prev.filter((x) => x.id !== item.id));
      router.refresh();
    });
  };

  return (
    <Panel className="p-7">
      <PanelTitle className="mb-2">Assistant de relances</PanelTitle>
      <p className="mb-5 text-sm text-muted-foreground">
        Factures en retard, devis sans réponse et dates de relance du CRM.
      </p>
      {items.length === 0 ? (
        <EmptyState title="Aucune relance pour le moment">
          Une ligne apparaît ici dès qu’une facture est due, qu’un devis attend une réponse, ou qu’une date de relance CRM est arrivée.
        </EmptyState>
      ) : (
        <ul className="space-y-5">
          {items.map((item) => (
            <li key={item.id} className="rounded-xl border bg-muted/40 p-4">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <p className="font-medium">
                  {item.client}{" "}
                  <span className="text-sm font-normal text-muted-foreground">
                    · {item.channel} · {item.reason}
                  </span>
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
                  {item.canSend && (
                    <Button type="button" size="sm" disabled={sending} onClick={() => send(item)}>
                      <Check aria-hidden className="size-3.5" />
                      {item.sendLabel}
                    </Button>
                  )}
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
      )}
    </Panel>
  );
}
