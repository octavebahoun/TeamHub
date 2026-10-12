"use client";

import { useCallback, useEffect, useState } from "react";
import { loadWeeklyBrief } from "@/lib/actions/analytics-board";
import type { WeeklyBrief } from "@/lib/api/wine-contract";

export function useWeeklyBrief() {
  const [brief, setBrief] = useState<WeeklyBrief | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setBrief(await loadWeeklyBrief());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Résumé indisponible.");
      setBrief(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { brief, loading, error, refresh };
}
