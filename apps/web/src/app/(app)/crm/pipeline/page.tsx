import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getClients, getMe, getOpportunities } from "@/lib/api/endpoints";
import type { OpportunityStage } from "@/lib/api/types";
import { plural } from "@/lib/format";
import { OPPORTUNITY_STAGE, STAGE_ORDER } from "@/lib/labels";
import { can, currentRole } from "@/lib/permissions";
import { FilterChips } from "@/components/common/filter-chips";
import { PageHeader } from "@/components/common/page-header";
import { CrmTabs } from "../_components/crm-tabs";
import { NewOpportunityDialog } from "../_components/new-opportunity-dialog";
import { PipelineBoard } from "./_components/pipeline-board";

export const metadata: Metadata = { title: "CRM · Pipeline" };

export default async function PipelinePage({ searchParams }: { searchParams: Promise<{ etape?: string }> }) {
  const { etape } = await searchParams;
  const me = await getMe();
  const role = currentRole(me);
  if (!can(role, "crm.view")) notFound();
  const [opps, clients] = await Promise.all([getOpportunities(), getClients()]);
  const stage = STAGE_ORDER.includes(etape as OpportunityStage) ? (etape as OpportunityStage) : undefined;
  const open = opps.filter((o) => !["won", "lost"].includes(o.stage)).length;
  const won = opps.filter((o) => o.stage === "won").length;

  return (
    <div className="mx-auto max-w-[1600px]">
      <PageHeader
        title="CRM"
        subtitle={`${plural(open, "opportunité ouverte", "opportunités ouvertes")} · ${plural(won, "gagnée", "gagnées")}`}
        actions={can(role, "crm.edit") && <NewOpportunityDialog clients={clients.map((c) => ({ id: c.id, name: c.company ?? c.name }))} />}
      />
      <CrmTabs current="pipeline" />
      <FilterChips
        label="Filtrer par étape"
        chips={[
          { label: "Toutes", count: opps.length, href: "/crm/pipeline", active: !stage },
          ...STAGE_ORDER.map((s) => ({ label: OPPORTUNITY_STAGE[s].label, count: opps.filter((o) => o.stage === s).length, href: `/crm/pipeline?etape=${s}`, active: stage === s })),
        ]}
      />
      <PipelineBoard opportunities={opps} stages={stage ? [stage] : STAGE_ORDER} editable={can(role, "crm.edit")} />
    </div>
  );
}
