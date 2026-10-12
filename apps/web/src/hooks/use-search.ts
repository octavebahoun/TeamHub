"use client";

import { useCallback, useEffect, useState } from "react";
import { search as searchApi } from "@/lib/api/search";
import type { SearchResults } from "@/lib/data/types";

const empty: SearchResults = { query: "", projects: [], tasks: [], clients: [], quotes: [] };

export function useSearch(query: string, { minLength = 2, enabled = true }: { minLength?: number; enabled?: boolean } = {}) {
  const [results, setResults] = useState<SearchResults>(empty);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(async (q: string) => {
    const trimmed = q.trim();
    if (trimmed.length < minLength) {
      setResults({ ...empty, query: trimmed });
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setResults(await searchApi(trimmed));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Recherche indisponible.");
      setResults({ ...empty, query: trimmed });
    } finally {
      setLoading(false);
    }
  }, [minLength]);

  useEffect(() => {
    if (!enabled) return;
    const t = window.setTimeout(() => void run(query), 250);
    return () => window.clearTimeout(t);
  }, [query, enabled, run]);

  return { results, loading, error, search: run };
}
