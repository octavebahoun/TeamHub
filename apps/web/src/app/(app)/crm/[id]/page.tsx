import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { differenceInCalendarDays } from "date-fns";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { ApiError } from "@/lib/api/client";
import { getClient, getClientActivity, getClients, getMe, getProject, getProjects } from "@/lib/api/endpoints";
import { clientKind, projectProgress } from "@/lib/domain";
import { money, toDate } from "@/lib/format";
import { OPPORTUNITY_STAGE } from "@/lib/labels";
import { can, currentRole } from "@/lib/permissions";
import { PageHeader } from "@/components/common/page-header";
import { Panel, PanelTitle } from "@/components/common/panel";
import { ProgressBar } from "@/components/common/progress-bar";
import { ToneBadge } from "@/components/common/tone-badge";
import { CompanyMark } from "../_components/company-mark";
import { NewOpportunityDialog } from "../_components/new-opportunity-dialog";
import { CrmEnrichment } from "@/components/contravo/crm-enrichment";
import { GenerateQuoteDialog } from "@/components/contravo/generate-quote-dialog";
import { InboxPanel } from "@/components/contravo/inbox-panel";
import { useContravoMocks } from "@/lib/contravo/client";
import { resolveContravoClientId, resolveContravoProjectId } from "@/lib/contravo/resolve";
import { LinkClientBilling } from "@/components/contravo/link-client-billing";
import { FollowUpBanner } from "./_components/follow-up-banner";
import { History } from "./_components/history";

type Props = { params: Promise<{ id: string }> };

async function load(id: number) {
  try {
    return await getClient(id);
  } catch (e) {
    if (e instanceof ApiError && (e.status === 404 || e.status === 403)) notFound();
    throw e;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const c = await load(Number((await params).id));
  return { title: c.company ?? c.name };
}

export default async function ClientPage({ params }: Props) {
  const id = Number((await params).id);
  const me = await getMe();
  const role = currentRole(me);
  if (!can(role, "crm.view")) notFound();
  const [client, activity, clients] = await Promise.all([load(id), getClientActivity(id), getClients()]);
  const opps = client.opportunities ?? [];
  const kind = clientKind(opps);
  const title = client.company ?? client.name;
  const due = opps
    .filter((o) => !["won", "lost"].includes(o.stage) && o.next_follow_up && differenceInCalendarDays(toDate(o.next_follow_up)!, new Date()) <= 0)
    .sort((a, b) => (a.next_follow_up! < b.next_follow_up! ? -1 : 1))[0];
  const linked = await Promise.all(
    [...new Set(opps.map((o) => o.project_id).filter((p): p is number => !!p))].map((pid) => getProject(pid).catch(() => null))
  );
  const won = opps.filter((o) => o.closed_at && o.stage === "won").map((o) => toDate(o.closed_at)!).sort((a, b) => +a - +b)[0];
  const since = won ?? toDate(client.created_at);
  const canEdit = can(role, "crm.edit");
  const catalog = await getProjects().catch(() => []);
  const quoteProject =
    catalog.find((p) => (p.client_id === id || p.client?.id === id) && p.contravo_project_id) ??
    linked.find((p) => p?.contravo_project_id) ??
    null;
  const contravoClientId = resolveContravoClientId(client.contravo_client_id);
  const contravoProjectId = resolveContravoProjectId(quoteProject?.contravo_project_id ?? null);
  const quoteOpp = opps.find((o) => !["won", "lost"].includes(o.stage)) ?? opps[0];

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        crumbs={[{ label: "CRM", href: "/crm" }, { label: title }]}
        title={
          <span className="flex items-center gap-5">
            <CompanyMark name={title} size="lg" />
            {title}
          </span>
        }
        badge={<ToneBadge tone={kind === "client" ? "success" : "brand"}>{kind === "client" ? "Client" : "Prospect"}</ToneBadge>}
        subtitle={[since && `${kind === "client" ? "Client" : "Contact"} depuis ${format(since, "MMMM yyyy", { locale: fr })}`, client.owner && `Responsable ${client.owner.name}`].filter(Boolean).join(" · ")}
        actions={
          canEdit && (
            <span className="flex flex-wrap gap-3">
              {contravoClientId && contravoProjectId && (
                <GenerateQuoteDialog
                  contravoClientId={contravoClientId}
                  contravoProjectId={contravoProjectId}
                  opportunityId={quoteOpp?.id}
                  defaultTitle={quoteOpp?.title}
                />
              )}
              <NewOpportunityDialog clients={clients.map((c) => ({ id: c.id, name: c.company ?? c.name }))} clientId={id} variant="outline" />
            </span>
          )
        }
      />
      {due && canEdit && <FollowUpBanner opportunity={{ ...due, client_id: id }} contact={client.name} />}
      {!useContravoMocks() && !client.contravo_client_id && canEdit && <LinkClientBilling clientId={id} hasEmail={Boolean(client.email)} />}
      <div className="grid grid-cols-1 gap-8 xl:grid-cols-[420px_minmax(0,1fr)]">
        <div className="space-y-8">
          <Panel className="p-7">
            <PanelTitle className="mb-5">Coordonnées</PanelTitle>
            <dl className="space-y-4">
              <div>
                <dt className="text-sm text-muted-foreground">Contact principal</dt>
                <dd>{[client.name, client.notes].filter(Boolean).join(", ")}</dd>
              </div>
              {client.email && (
                <div>
                  <dt className="text-sm text-muted-foreground">Email</dt>
                  <dd><a href={`mailto:${client.email}`} className="text-primary underline underline-offset-4">{client.email}</a></dd>
                </div>
              )}
              {client.phone && (
                <div>
                  <dt className="text-sm text-muted-foreground">Téléphone</dt>
                  <dd><a href={`tel:${client.phone.replace(/\s/g, "")}`} className="hover:underline">{client.phone}</a></dd>
                </div>
              )}
              {client.address && (
                <div>
                  <dt className="text-sm text-muted-foreground">Adresse</dt>
                  <dd>{client.address}</dd>
                </div>
              )}
            </dl>
          </Panel>
          <Panel className="p-7">
            <PanelTitle className="mb-4">Opportunités</PanelTitle>
            {opps.length ? (
              <ul className="divide-y border-t">
                {opps.map((o) => (
                  <li key={o.id} className="flex items-center justify-between gap-3 py-4">
                    <div>
                      <p className="font-semibold">{o.title}</p>
                      <p className="text-sm text-muted-foreground">{money(o.amount)}</p>
                    </div>
                    <ToneBadge tone={OPPORTUNITY_STAGE[o.stage].tone}>{OPPORTUNITY_STAGE[o.stage].label}</ToneBadge>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground">Aucune opportunité.</p>
            )}
          </Panel>
          {contravoClientId && <CrmEnrichment contravoClientId={contravoClientId} />}
          {linked.some(Boolean) && (
            <Panel className="p-7">
              <PanelTitle className="mb-4">Projets liés</PanelTitle>
              <ul className="space-y-3">
                {linked.filter((p) => !!p).map((p) => {
                  const pr = projectProgress(p);
                  return (
                    <li key={p.id} className="relative rounded-xl border p-4 focus-within:ring-2 focus-within:ring-ring">
                      <div className="mb-3 flex justify-between">
                        <Link href={`/projets/${p.id}`} className="font-semibold after:absolute after:inset-0 focus:outline-none">{p.name}</Link>
                        <span className="text-sm text-muted-foreground">{Math.round(pr.ratio * 100)}%</span>
                      </div>
                      <ProgressBar value={pr.ratio} label={`Avancement de ${p.name}`} />
                    </li>
                  );
                })}
              </ul>
            </Panel>
          )}
        </div>
        <div className="space-y-8">
          {contravoClientId && <InboxPanel contravoClientId={contravoClientId} />}
          <History clientId={id} items={activity} canEdit={canEdit} />
        </div>
      </div>
    </div>
  );
}
