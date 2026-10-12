import { USE_MOCKS } from "@/lib/data/mode";
import { mockClients } from "@/lib/data/mocks/clients";
import { mockProjects } from "@/lib/data/mocks/projects";
import type { AiSummary, AiSummaryScope } from "@/lib/data/types";

const apiBase = () => (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api").replace(/\/$/, "");

function mockSummary(scope: AiSummaryScope, scopeId: string | number): AiSummary {
  const at = new Date().toISOString();
  if (scope === "project") {
    const project = mockProjects.find((p) => p.id === Number(scopeId));
    const name = project?.name ?? "Projet";
    return {
      scope,
      scope_id: scopeId,
      summary: `${name} avance avec ${project?.done_tasks_count ?? 0} tâches terminées sur ${project?.tasks_count ?? 0}. Priorité : paiements mobile money et livrables client.`,
      bullets: [
        "Échéances cette semaine sur l'intégration MoMo / Moov.",
        "Relancer les validations client avant clôture de sprint.",
        "Surveiller les factures en retard côté CRM.",
      ],
      generated_at: at,
    };
  }
  if (scope === "client") {
    const client = mockClients.find((c) => c.id === Number(scopeId));
    const label = client?.company ?? client?.name ?? "Client";
    return {
      scope,
      scope_id: scopeId,
      summary: `${label} : relation active en Afrique de l'Ouest, devis et factures suivis dans Contravo.`,
      bullets: [
        "Vérifier le prochain jalon contractuel.",
        "Confirmer le canal de paiement (MTN MoMo, Moov, Celtiis).",
      ],
      generated_at: at,
    };
  }
  return {
    scope: "pipeline",
    scope_id: scopeId,
    summary: "Pipeline CRM : plusieurs propositions en cours à Abidjan, Porto-Novo et Lomé ; focus sur la conversion des devis envoyés.",
    bullets: [
      "2 devis en attente de signature.",
      "1 facture en retard à relancer.",
      "Opportunités gagnées concentrées sur le retail et le secteur public.",
    ],
    generated_at: at,
  };
}

export type GetSummaryParams = { scope: AiSummaryScope; scopeId: string | number };

export async function getSummary({ scope, scopeId }: GetSummaryParams): Promise<AiSummary> {
  if (USE_MOCKS) return mockSummary(scope, scopeId);
  const url = new URL(`${apiBase()}/v1/ai/summary`);
  url.searchParams.set("scope", scope);
  url.searchParams.set("scope_id", String(scopeId));
  const res = await fetch(url, { credentials: "include", headers: { Accept: "application/json" } });
  if (!res.ok) {
    const data = (await res.json().catch(() => null)) as { message?: string } | null;
    throw new Error(data?.message ?? `Erreur ${res.status}`);
  }
  return (await res.json()) as AiSummary;
}
