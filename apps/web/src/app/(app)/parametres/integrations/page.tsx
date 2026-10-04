import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getMe } from "@/lib/api/endpoints";
import { webhooks } from "@/lib/contravo";
import { can, currentRole } from "@/lib/permissions";
import { PageHeader } from "@/components/common/page-header";
import { Panel, PanelTitle } from "@/components/common/panel";
import { buttonVariants } from "@/components/ui/button";

export const metadata: Metadata = { title: "Intégrations" };

const EVENT_LABEL: Record<string, string> = {
  "quote.accepted": "Devis accepté",
  "quote.rejected": "Devis refusé",
  "invoice.paid": "Facture payée",
  "invoice.overdue": "Facture en retard",
  "contract.signed": "Contrat signé",
  "deliverable.approved": "Livrable validé",
  "deliverable.rejected": "Livrable refusé",
  "conversation.message_received": "Message client",
  "review.submitted": "Avis client",
};

function eventLabel(event: string) {
  return EVENT_LABEL[event] ?? event.replaceAll(".", " ").replaceAll("_", " ");
}

export default async function IntegrationsPage() {
  const me = await getMe();
  const role = currentRole(me);
  if (!can(role, "members.view")) notFound();

  const endpoints = await webhooks.listWebhookEndpoints().catch(() => []);
  const notices = [...new Set(endpoints.flatMap((ep) => ep.events.map(eventLabel)))];

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        crumbs={[{ label: "Paramètres", href: "/parametres/membres" }, { label: "Intégrations" }]}
        title="Contravo"
        subtitle="Devis, factures et contrats sont gérés dans Contravo."
      />
      <Panel className="mb-8 p-7">
        <PanelTitle className="mb-3">Ouvrir la facturation</PanelTitle>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Créez et suivez les devis, factures et contrats dans Contravo. WINE reçoit ensuite les nouvelles : devis accepté, facture payée, contrat signé.
        </p>
        <Link href="https://contravo.excellenceteam.site" className={buttonVariants({ variant: "outline", size: "lg", className: "mt-4" })} target="_blank" rel="noopener noreferrer">
          Ouvrir Contravo
        </Link>
      </Panel>
      <Panel className="p-7">
        <PanelTitle className="mb-4">Nouvelles reçues</PanelTitle>
        {notices.length === 0 ? (
          <p className="text-muted-foreground">Aucune nouvelle n&apos;est reliée pour le moment.</p>
        ) : (
          <ul className="space-y-3">
            {notices.map((label) => (
              <li key={label} className="rounded-lg border px-4 py-3 text-sm">
                {label}
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
