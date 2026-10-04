"use client";

import { RefreshCw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Panel, PanelTitle } from "@/components/common/panel";
import { useAiSummary } from "@/hooks/use-ai-summary";

/** Bilan rédigé depuis analytics/overview et analytics/pipeline. */
export function AiSummaryCard() {
  const { summary, loading, error, refresh } = useAiSummary("pipeline", "weekly");

  return (
    <Panel className="relative overflow-hidden p-7">
      <div aria-hidden className="aurora-bg pointer-events-none absolute inset-0 opacity-40" />
      <div className="relative">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex size-9 items-center justify-center rounded-lg bg-brand-soft text-brand-soft-foreground">
              <Sparkles aria-hidden className="size-4.5" />
            </span>
            <PanelTitle>Bilan hebdomadaire IA</PanelTitle>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={() => void refresh()} disabled={loading} aria-label="Régénérer le bilan">
            <RefreshCw aria-hidden className={loading ? "animate-spin" : undefined} />
            Régénérer
          </Button>
        </div>
        {loading && !summary ? (
          <p className="text-sm text-muted-foreground" role="status">
            L&apos;IA rédige votre synthèse…
          </p>
        ) : error ? (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        ) : summary ? (
          <div className="space-y-3">
            <p className="text-[15px] leading-relaxed">{summary.summary}</p>
            {summary.bullets.length > 0 && (
              <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
                {summary.bullets.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
            )}
          </div>
        ) : null}
      </div>
    </Panel>
  );
}
