"use client";

import { useEffect, useState } from "react";
import { FileCheck2, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { addDeliverable } from "@/lib/actions/desk";
import { Panel, PanelTitle } from "@/components/common/panel";
import { ToneBadge } from "@/components/common/tone-badge";
import { contravoBrowser } from "@/lib/contravo/browser";
import type { Deliverable } from "@/lib/contravo/types";
import type { Tone } from "@/lib/labels";
import { shortDate } from "@/lib/format";

const DELIVERABLE_TONE: Record<Deliverable["status"], { label: string; tone: Tone }> = {
  draft: { label: "Brouillon", tone: "neutral" },
  submitted: { label: "Soumis", tone: "info" },
  approved: { label: "Approuvé", tone: "success" },
  rejected: { label: "Refusé", tone: "danger" },
  revision_requested: { label: "Révision demandée", tone: "brand" },
};

export function DeliverablesPanel({ contravoProjectId, canAdd = false }: { contravoProjectId: string; canAdd?: boolean }) {
  const [items, setItems] = useState<Deliverable[]>([]);
  const [title, setTitle] = useState("");

  useEffect(() => {
    contravoBrowser.listDeliverables(contravoProjectId).then(setItems).catch(() => setItems([]));
  }, [contravoProjectId]);

  return (
    <Panel className="p-7">
      <PanelTitle className="mb-4 flex items-center gap-2">
        <FileCheck2 aria-hidden className="size-5" /> Livrables Contravo
      </PanelTitle>
      {canAdd && (
        <form
          className="mb-4 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            const wineId = Number(contravoProjectId.replace("wine-p-", ""));
            if (!title.trim() || !Number.isFinite(wineId)) return;
            void addDeliverable(wineId, title.trim()).then((res) => {
              if (res.error) toast.error(res.error);
              else {
                setTitle("");
                contravoBrowser.listDeliverables(contravoProjectId).then(setItems).catch(() => setItems([]));
              }
            });
          }}
        >
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Nouveau livrable" aria-label="Nouveau livrable" />
          <Button type="submit"><Plus aria-hidden className="size-4" /> Ajouter</Button>
        </form>
      )}
      {items.length === 0 ? (
        <p className="text-muted-foreground">Aucun livrable soumis.</p>
      ) : (
        <ul className="divide-y border-t">
          {items.map((d) => {
            const st = DELIVERABLE_TONE[d.status];
            return (
              <li key={d.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
                <div>
                  <p className="font-semibold">{d.title}</p>
                  <p className="text-sm text-muted-foreground">
                    v{d.version}
                    {d.submittedAt && ` · soumis ${shortDate(d.submittedAt)}`}
                    {d.fileName && ` · ${d.fileName}`}
                  </p>
                </div>
                <ToneBadge tone={st.tone}>{st.label}</ToneBadge>
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}
