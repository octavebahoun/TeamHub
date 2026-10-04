"use server";

import { api, ApiError } from "@/lib/api/client";
import { mapWineSearch, type WineSearchPayload } from "@/lib/api/wine-contract";
import type { SearchResults } from "@/lib/data/types";
import { USE_MOCKS } from "@/lib/data/mode";
import { mockSearch } from "@/lib/api/search";

/** GET /api/v1/search?q= — projets, tâches, clients. */
export async function searchWine(q: string): Promise<SearchResults> {
  const trimmed = q.trim();
  if (!trimmed) return { query: "", projects: [], tasks: [], clients: [], quotes: [] };
  if (USE_MOCKS) return mockSearch(trimmed);
  try {
    const raw = await api<WineSearchPayload>("search", { query: { q: trimmed } });
    return mapWineSearch({ ...raw, query: raw.query ?? trimmed });
  } catch (e) {
    if (e instanceof ApiError) throw new Error(e.message);
    throw e;
  }
}
