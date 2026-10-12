import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { differenceInCalendarDays } from "date-fns";
import { getClients, getMe, getOpportunities } from "@/lib/api/endpoints";
import { contactRows } from "@/lib/domain";
import { plural, toDate } from "@/lib/format";
import { can, currentRole } from "@/lib/permissions";
import { EmptyState } from "@/components/common/empty-state";
import { PageHeader } from "@/components/common/page-header";
import { ContactSearch } from "./_components/contact-search";
import { ContactsTable } from "./_components/contacts-table";
import { CrmTabs } from "./_components/crm-tabs";
import { NewClientDialog } from "./_components/new-client-dialog";
import Link from "next/link";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "CRM · Contacts" };

export default async function CrmContactsPage({ searchParams }: { searchParams: Promise<{ q?: string; type?: string }> }) {
  const { q, type } = await searchParams;
  const me = await getMe();
  if (!can(currentRole(me), "crm.view")) notFound();
  const [clients, opps] = await Promise.all([getClients(q), getOpportunities()]);
  const rows = contactRows(clients, opps);
  const kind = type === "clients" ? "client" : type === "prospects" ? "prospect" : undefined;
  const shown = kind ? rows.filter((r) => r.kind === kind) : rows;
  const nClients = rows.filter((r) => r.kind === "client").length;
  const followUps = rows.filter((r) => {
    const d = toDate(r.followUp);
    return d && differenceInCalendarDays(d, new Date()) <= 7;
  }).length;
  const qs = (t?: string) => `/crm?${new URLSearchParams(Object.entries({ q, type: t }).filter(([, v]) => v) as [string, string][])}`;
  const chip = (label: string, count: number, t?: string) => (
    <Link
      href={qs(t)}
      aria-current={type === t ? "page" : undefined}
      className={cn("inline-flex h-11 items-center rounded-full border px-5 font-medium", type === t ? "border-inverse bg-inverse text-inverse-foreground" : "bg-background hover:bg-muted")}
    >
      {label} · {count}
    </Link>
  );

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title="CRM"
        subtitle={`${plural(nClients, "client", "clients")} · ${plural(rows.length - nClients, "prospect", "prospects")} · ${plural(followUps, "relance", "relances")} cette semaine`}
        actions={can(currentRole(me), "crm.edit") && <NewClientDialog />}
      />
      <CrmTabs current="contacts" />
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <ContactSearch q={q} type={type} />
        <nav aria-label="Filtrer par type" className="flex flex-wrap gap-2">
          {chip("Tous", rows.length)}
          {chip("Clients", nClients, "clients")}
          {chip("Prospects", rows.length - nClients, "prospects")}
        </nav>
      </div>
      {shown.length ? <ContactsTable rows={shown} /> : <EmptyState title={q ? `Aucun contact pour « ${q} »` : "Aucun contact"} />}
    </div>
  );
}
