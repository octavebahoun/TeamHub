"use client";

import Link from "next/link";
import { useOptimistic, useState, useTransition } from "react";
import { ArrowRight, Bell } from "lucide-react";
import { toast } from "sonner";
import type { Opportunity, OpportunityStage } from "@/lib/api/types";
import { updateOpportunity } from "@/lib/actions/crm";
import { dueLabel, money } from "@/lib/format";
import { OPPORTUNITY_STAGE } from "@/lib/labels";
import { cn } from "@/lib/utils";
import { UserAvatar } from "@/components/common/user-avatar";

const NEXT: Partial<Record<OpportunityStage, OpportunityStage>> = { prospect: "contacted", contacted: "proposal", proposal: "won" };

export function PipelineBoard({ opportunities, stages, editable }: { opportunities: Opportunity[]; stages: OpportunityStage[]; editable: boolean }) {
  const [items, setStage] = useOptimistic(opportunities, (state, { id, stage }: { id: number; stage: OpportunityStage }) => state.map((o) => (o.id === id ? { ...o, stage } : o)));
  const [, start] = useTransition();
  const [dragId, setDragId] = useState<number | null>(null);
  const [over, setOver] = useState<OpportunityStage | null>(null);

  const move = (o: Opportunity, stage: OpportunityStage) =>
    start(async () => {
      setStage({ id: o.id, stage });
      const res = await updateOpportunity(o.id, o.client_id, { stage });
      if (res.error) return void toast.error(res.error);
      if (stage === "won" && res.project) toast.success(`Gagné ! Le projet « ${res.project.name} » a été créé.`);
      else toast.success(`« ${o.title} » passe en ${OPPORTUNITY_STAGE[stage].label}`);
    });

  return (
    <div className="relative -mx-4 overflow-x-auto px-4 pb-4 sm:-mx-8 sm:px-8">
      <div className="grid auto-cols-[minmax(300px,1fr)] grid-flow-col gap-5">
        {stages.map((stage) => {
          const col = items.filter((o) => o.stage === stage);
          const total = col.reduce((s, o) => s + Number(o.amount ?? 0), 0);
          return (
            <section
              key={stage}
              aria-labelledby={`stage-${stage}`}
              onDragOver={(e) => {
                if (!editable || dragId === null) return;
                e.preventDefault();
                setOver(stage);
              }}
              onDragLeave={() => setOver((s) => (s === stage ? null : s))}
              onDrop={(e) => {
                e.preventDefault();
                setOver(null);
                const o = items.find((x) => x.id === Number(e.dataTransfer.getData("text/plain")));
                if (o && o.stage !== stage) move(o, stage);
              }}
              className={cn("rounded-2xl border bg-muted p-4 transition-colors", over === stage && "border-primary bg-brand-soft/40")}
            >
              <div className="mb-4 px-1">
                <h2 id={`stage-${stage}`} className="flex items-center gap-2.5 font-sans text-[17px] font-semibold">
                  <span aria-hidden className={cn("size-2.5 rounded-full", OPPORTUNITY_STAGE[stage].dot)} />
                  {OPPORTUNITY_STAGE[stage].label}
                  <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-full border bg-background px-2 text-sm font-medium">
                    {col.length}<span className="sr-only"> opportunités</span>
                  </span>
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">{money(total)}</p>
              </div>
              <ul className="space-y-3">
                {col.map((o) => {
                  const next = NEXT[o.stage];
                  return (
                    <li key={o.id}>
                      <article
                        draggable={editable}
                        onDragStart={(e) => {
                          e.dataTransfer.setData("text/plain", String(o.id));
                          setDragId(o.id);
                        }}
                        onDragEnd={() => setDragId(null)}
                        className={cn("relative rounded-xl border bg-card p-4 focus-within:ring-2 focus-within:ring-ring", editable && "cursor-grab", dragId === o.id && "opacity-40")}
                      >
                        <h3 className="font-sans font-semibold">
                          <Link href={`/crm/${o.client_id}`} className="after:absolute after:inset-0 after:rounded-xl focus:outline-none">{o.title}</Link>
                        </h3>
                        <p className="text-sm text-muted-foreground">{o.client?.company ?? o.client?.name}</p>
                        <p className="mt-3 font-semibold">{money(o.amount)}</p>
                        <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                          <Bell aria-hidden className="size-4" strokeWidth={1.75} />
                          <span className="sr-only">Relance :</span>
                          {o.next_follow_up ? dueLabel(o.next_follow_up) : "Aucune"}
                          <span className="ml-auto flex items-center gap-2">
                            {o.owner && <UserAvatar name={o.owner.name} size="sm" tone="dark" />}
                            {editable && next && (
                              <button
                                type="button"
                                onClick={() => move(o, next)}
                                aria-label={`Passer « ${o.title} » en ${OPPORTUNITY_STAGE[next].label}`}
                                className="relative z-10 inline-flex size-9 items-center justify-center rounded-lg border bg-background text-foreground hover:bg-muted"
                              >
                                <ArrowRight aria-hidden className="size-4" />
                              </button>
                            )}
                          </span>
                        </div>
                      </article>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}
