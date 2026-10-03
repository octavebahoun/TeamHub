import { contravoFetch, useContravoMocks } from "./client";

export type AgentTool = { name: string; description: string };

export async function listAgentTools(): Promise<AgentTool[]> {
  if (useContravoMocks()) {
    return [
      { name: "create_quote_draft", description: "Préparer un devis à partir d'une conversation." },
      { name: "summarize_thread", description: "Résumer les besoins client." },
    ];
  }
  const res = await contravoFetch<{ tools: AgentTool[] }>("/agent/tools");
  return res.tools;
}

export async function executeAgent(input: { tool: string; input: Record<string, unknown> }) {
  if (useContravoMocks()) return { ok: true, result: { message: "Action simulée (mock)." } };
  return contravoFetch("/agent/execute", { method: "POST", body: input });
}
