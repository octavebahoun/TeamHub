import { USE_MOCKS } from "@/lib/data/mode";
import { mockAnalyticsOverview, mockAnalyticsPipeline, mockStatsActivity } from "@/lib/data/mocks/analytics";
import type { AnalyticsPipeline, StatsActivityItem, StatsOverview } from "@/lib/data/types";

const apiBase = () => (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api").replace(/\/$/, "");

async function v1<T>(path: string): Promise<T> {
  const res = await fetch(`${apiBase()}/v1/${path}`, { credentials: "include", headers: { Accept: "application/json" } });
  if (!res.ok) {
    const data = (await res.json().catch(() => null)) as { message?: string } | null;
    throw new Error(data?.message ?? `Erreur ${res.status}`);
  }
  return (await res.json()) as T;
}

export async function overview(): Promise<StatsOverview> {
  if (USE_MOCKS) return structuredClone(mockAnalyticsOverview);
  return v1<StatsOverview>("analytics/overview");
}

export async function pipeline(): Promise<AnalyticsPipeline> {
  if (USE_MOCKS) return structuredClone(mockAnalyticsPipeline);
  return v1<AnalyticsPipeline>("analytics/pipeline");
}

export async function activity(): Promise<StatsActivityItem[]> {
  if (USE_MOCKS) return structuredClone(mockStatsActivity);
  return v1<StatsActivityItem[]>("analytics/activity");
}

