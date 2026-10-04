"use server";

import { api, ApiError } from "@/lib/api/client";
import type { AnalyticsOverview, AnalyticsPipeline } from "@/lib/api/types";
import { financialFromAnalytics, summaryFromAnalytics, type FinancialSnapshot } from "@/lib/api/wine-contract";
import { mockAnalyticsOverview, mockAnalyticsPipeline } from "@/lib/data/mocks/analytics";
import type { AiSummary } from "@/lib/data/types";
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

/** Bilan construit sur les mêmes endpoints. Pas de GET /ai/summary. */
export async function loadPipelineSummary(): Promise<AiSummary> {
  const { overview, pipeline } = await loadAnalytics();
  return summaryFromAnalytics(overview, pipeline);
}
