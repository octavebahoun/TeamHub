import { contravoFetch, useContravoMocks } from "./client";

export type WebhookEndpoint = {
  id: string;
  url: string;
  events: string[];
  createdAt: string;
};

export async function listWebhookEndpoints(): Promise<WebhookEndpoint[]> {
  if (useContravoMocks()) {
    return [{ id: "wh-mock-1", url: "https://api.wine.local/webhooks/contravo", events: ["quote.accepted", "invoice.paid"], createdAt: new Date().toISOString() }];
  }
  const res = await contravoFetch<{ endpoints: WebhookEndpoint[] }>("/webhooks/endpoints");
  return res.endpoints;
}

export async function testWebhookEndpoint(id: string) {
  if (useContravoMocks()) return { ok: true };
  return contravoFetch(`/webhooks/endpoints/${encodeURIComponent(id)}/test`, { method: "POST", body: {} });
}
