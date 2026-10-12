"use server";

import { api, ApiError } from "@/lib/api/client";
import type { AnalyticsOverview, AnalyticsPipeline, WeeklySummary } from "@/lib/api/types";
import {
  briefFromAnalytics,
  briefFromWeeklySummary,
  financialFromAnalytics,
  type FinancialSnapshot,
  type WeeklyBrief,
} from "@/lib/api/wine-contract";
import { mockAnalyticsOverview, mockAnalyticsPipeline, mockWeeklySummary } from "@/lib/data/mocks/analytics";
import { USE_MOCKS } from "@/lib/data/mode";

async function loadAnalytics(): Promise<{ overview: AnalyticsOverview; pipeline: AnalyticsPipeline }> {
  if (USE_MOCKS) return { overview: mockAnalyticsOverview, pipeline: mockAnalyticsPipeline };
  try {
    const [overview, pipeline] = await Promise.all([
      api<AnalyticsOverview>("analytics/overview"),
      api<AnalyticsPipeline>("analytics/pipeline"),
    ]);
    return { overview, pipeline };
  } catch (e) {
    if (e instanceof ApiError) throw new Error(e.message);
    throw e;
  }
}

/** Chiffres de GET /analytics/overview et GET /analytics/pipeline. */
export async function loadFinancialSnapshot(): Promise<FinancialSnapshot> {
  const { overview, pipeline } = await loadAnalytics();
  return financialFromAnalytics(overview, pipeline);
}

/** Bilan Gemini via GET /analytics/summary. Repli local si le service data est down. */
export async function loadWeeklyBrief(): Promise<WeeklyBrief> {
  if (USE_MOCKS) return briefFromWeeklySummary(mockWeeklySummary);
  try {
    const weekly = await api<WeeklySummary>("analytics/summary");
    return briefFromWeeklySummary(weekly);
  } catch (e) {
    if (e instanceof ApiError && (e.status === 404 || e.status === 405 || e.status === 502 || e.status === 503)) {
      const { overview, pipeline } = await loadAnalytics();
      return briefFromAnalytics(overview, pipeline);
    }
    if (e instanceof ApiError) throw new Error(e.message);
    throw e;
  }
}
