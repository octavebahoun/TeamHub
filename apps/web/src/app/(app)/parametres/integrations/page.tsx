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

export default async function IntegrationsPage() {
  const me = await getMe();
  const role = currentRole(me);
  if (!can(role, "members.view")) notFound();

  const endpoints = await webhooks.listWebhookEndpoints().catch(() => []);

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        crumbs={[{ label: "Paramètres", href: "/parametres/membres" }, { label: "Intégrations" }]}
        title="Intégrations Contravo"
        subtitle="Pont de facturation et webhooks — clé API uniquement côté serveur (CONTRAVO_API_KEY)."
      />
      <Panel className="mb-8 p-7">
        <PanelTitle className="mb-3">Contravo</PanelTitle>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Les appels navigateur passent par <code className="text-xs">/api/contravo/*</code>. Définissez{" "}
          <code className="text-xs">CONTRAVO_API_KEY</code> sur le conteneur Next.js et{" "}
          <code className="text-xs">NEXT_PUBLIC_USE_MOCKS=true</code> pour la démo hors ligne.
        </p>
        <Link href="https://contravo.excellenceteam.site" className={buttonVariants({ variant: "outline", size: "lg", className: "mt-4" })} target="_blank" rel="noopener noreferrer">
          Ouvrir Contravo
        </Link>
      </Panel>
      <Panel className="p-7">
        <PanelTitle className="mb-4">Webhooks sortants</PanelTitle>
        {endpoints.length === 0 ? (
          <p className="text-muted-foreground">Aucun endpoint configuré ou clé absente.</p>
        ) : (
          <ul className="space-y-3">
            {endpoints.map((ep) => (
              <li key={ep.id} className="rounded-lg border p-4 text-sm">
                <p className="font-medium break-all">{ep.url}</p>
                <p className="mt-1 text-muted-foreground">{ep.events.join(", ")}</p>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
