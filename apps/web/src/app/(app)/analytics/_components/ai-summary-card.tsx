"use client";

import Link from "next/link";
import { ArrowRight, RefreshCw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Panel, PanelTitle } from "@/components/common/panel";
import { ToneBadge } from "@/components/common/tone-badge";
import { useWeeklyBrief } from "@/hooks/use-ai-summary";
import { dateRange } from "@/lib/format";

/** Bilan Gemini (GET /analytics/summary), avec repli déterministe. */
export function AiSummaryCard() {
  const { brief, loading, error, refresh } = useWeeklyBrief();
  const period = brief ? dateRange(brief.from, brief.to) : "";

  return (
    <Panel className="relative overflow-hidden p-7">
      <div aria-hidden className="aurora-bg pointer-events-none absolute inset-0 opacity-40" />
      <div className="relative">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand-soft-foreground">
              <Sparkles aria-hidden className="size-4.5" />
            </span>
            <div className="min-w-0">
              <PanelTitle>Bilan hebdomadaire</PanelTitle>
              {period ? <p className="text-xs text-muted-foreground">{period}</p> : null}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {brief ? (
              <ToneBadge tone={brief.source === "gemini" ? "success" : "neutral"}>
                {brief.source === "gemini" ? "Gemini" : "Synthèse auto"}
              </ToneBadge>
            ) : null}
            <Button type="button" variant="outline" size="sm" onClick={() => void refresh()} disabled={loading} aria-label="Régénérer le bilan">
              <RefreshCw aria-hidden className={loading ? "animate-spin" : undefined} />
              Régénérer
            </Button>
          </div>
        </div>
        {loading && !brief ? (
          <p className="text-sm text-muted-foreground" role="status">
            L&apos;IA rédige votre synthèse…
          </p>
        ) : error ? (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        ) : brief ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-[15px] font-medium leading-snug">{brief.headline}</p>
              <p className="text-sm leading-relaxed text-muted-foreground">{brief.narrative}</p>
            </div>
            {brief.priorities.length > 0 ? (
              <div>
                <p className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">À faire cette semaine</p>
                <ul className="space-y-2">
                  {brief.priorities.map((item) => (
                    <li key={item.label}>
                      <Link
                        href={item.href}
                        className="flex items-center justify-between gap-3 rounded-xl border bg-background/70 px-3 py-2.5 text-sm hover:bg-muted/60"
                      >
                        <span className="min-w-0 leading-snug">{item.label}</span>
                        <ArrowRight aria-hidden className="size-4 shrink-0 text-muted-foreground" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </Panel>
  );
}
