"use client";

import { useState } from "react";
import { Check, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Panel, PanelTitle } from "@/components/common/panel";
import { addMilestone, toggleMilestone } from "@/lib/actions/desk";
import { cn } from "@/lib/utils";

export type Milestone = { id?: number; code: string; title: string; done: boolean; current: boolean };

export function Milestones({ projectId, items }: { projectId: number; items: Milestone[] }) {
  const [title, setTitle] = useState("");
  const [pending, setPending] = useState(false);

  async function add() {
    const value = title.trim();
    if (!value) return;
    setPending(true);
    const res = await addMilestone(projectId, value);
    setPending(false);
    if (res.error) toast.error(res.error);
    else setTitle("");
  }

  return (
    <Panel className="p-7">
      <PanelTitle className="mb-4">Jalons</PanelTitle>
      {items.length === 0 ? (
        <p className="mb-4 text-muted-foreground">Aucun jalon pour l'instant.</p>
      ) : (
        <ol className="mb-4 divide-y border-t">
          {items.map((m) => (
            <li key={m.code + m.title} className="flex items-center gap-5 py-4">
              <button
                type="button"
                className={cn(
                  "inline-flex size-7 shrink-0 items-center justify-center rounded-full border-2",
                  m.done && "border-success bg-success text-primary-foreground",
                  m.current && "border-primary",
                  !m.done && !m.current && "border-border"
                )}
                aria-label={m.done ? `Rouvrir ${m.title}` : `Terminer ${m.title}`}
                onClick={() => {
                  if (!m.id) return;
                  void toggleMilestone(projectId, m.id, !m.done).then((res) => res.error && toast.error(res.error));
                }}
              >
                {m.done && <Check className="size-4" strokeWidth={3} />}
              </button>
              <span className="w-8 font-semibold text-muted-foreground">{m.code}</span>
              <span className="flex-1">{m.title}</span>
              <span className="sr-only">{m.done ? "terminé" : m.current ? "en cours" : "à venir"}</span>
            </li>
          ))}
        </ol>
      )}
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          void add();
        }}
      >
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Nouveau jalon" aria-label="Nouveau jalon" />
        <Button type="submit" disabled={pending}>
          <Plus aria-hidden className="size-4" /> Ajouter
        </Button>
      </form>
    </Panel>
  );
}
