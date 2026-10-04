"use client";

import { useCallback, useEffect, useState } from "react";
import { loadPipelineSummary } from "@/lib/actions/analytics-board";
import type { AiSummary, AiSummaryScope } from "@/lib/data/types";

export function useAiSummary(scope: AiSummaryScope, scopeId: string | number | null, { enabled = true }: { enabled?: boolean } = {}) {
  const [summary, setSummary] = useState<AiSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (scopeId == null) {
      setSummary(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setSummary(await loadPipelineSummary());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Résumé indisponible.");
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }, [scope, scopeId]);

  useEffect(() => {
    if (!enabled || scopeId == null) return;
    void refresh();
  }, [enabled, scopeId, refresh]);

  return { summary, loading, error, refresh };
}
