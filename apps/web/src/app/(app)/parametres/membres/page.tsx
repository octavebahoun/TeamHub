import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Search } from "lucide-react";
import { getMe, getMembers, getPendingInvitations } from "@/lib/api/endpoints";
import type { Role } from "@/lib/api/types";
import { plural } from "@/lib/format";
import { ROLE } from "@/lib/labels";
import { can, currentRole } from "@/lib/permissions";
import { buttonVariants } from "@/components/ui/button";
import { NativeSelect } from "@/components/common/native-select";
import { PageHeader } from "@/components/common/page-header";
import { cn } from "@/lib/utils";
import { InviteDialog } from "./_components/invite-dialog";
import { MemberRow } from "./_components/member-row";
import { PendingInvitations } from "./_components/pending-invitations";

export const metadata: Metadata = { title: "Membres" };

const PER_PAGE = 6;

export default async function MembersPage({ searchParams }: { searchParams: Promise<{ q?: string; role?: string; page?: string }> }) {
  const { q = "", role: roleFilter, page = "1" } = await searchParams;
  const me = await getMe();
  const role = currentRole(me);
  if (!can(role, "members.view")) notFound();
  const canManage = can(role, "member.manage");
  const [members, invitations] = await Promise.all([getMembers(), canManage ? getPendingInvitations() : Promise.resolve([])]);

  const order: Role[] = ["owner", "admin", "manager", "member", "guest"];
  const filtered = members
    .filter((m) => (!roleFilter || m.role === roleFilter) && (!q || `${m.name} ${m.email}`.toLowerCase().includes(q.toLowerCase())))
    .sort((a, b) => order.indexOf(a.role) - order.indexOf(b.role));
  const pages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const current = Math.min(pages, Math.max(1, Number(page) || 1));
  const shown = filtered.slice((current - 1) * PER_PAGE, current * PER_PAGE);
  const href = (p: number) => `/parametres/membres?${new URLSearchParams(Object.entries({ q, role: roleFilter, page: String(p) }).filter(([, v]) => v) as [string, string][])}`;

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Membres"
        subtitle={`${me.current_organization?.name ?? ""} · ${plural(members.length, "membre", "membres")}${invitations.length ? `, ${plural(invitations.length, "invitation", "invitations")} en attente` : ""}`}
        actions={canManage && <InviteDialog />}
      />
      <form role="search" className="mb-6 flex flex-wrap gap-3">
        <div className="relative w-full max-w-md">
          <label htmlFor="m-q" className="sr-only">Rechercher un membre</label>
          <Search aria-hidden className="pointer-events-none absolute top-1/2 left-3.5 size-4.5 -translate-y-1/2 text-muted-foreground" />
          <input id="m-q" name="q" type="search" defaultValue={q} placeholder="Rechercher un membre…" className="h-11 w-full rounded-lg border bg-background pr-4 pl-10.5 placeholder:text-subtle-foreground" />
        </div>
        <label htmlFor="m-role" className="sr-only">Filtrer par rôle</label>
        <NativeSelect id="m-role" name="role" defaultValue={roleFilter ?? ""} className="w-48">
          <option value="">Tous les rôles</option>
          {order.map((r) => <option key={r} value={r}>{ROLE[r].label}</option>)}
        </NativeSelect>
        <button type="submit" className={buttonVariants({ variant: "outline", size: "lg" })}>Filtrer</button>
      </form>
      <div className="relative overflow-x-auto rounded-xl border bg-card">
        <table className="w-full min-w-[820px] text-left">
          <caption className="sr-only">Membres de l&apos;organisation</caption>
          <thead className="border-b text-[13px] tracking-[0.1em] uppercase">
            <tr>
              {["Membre", "Rôle", "Statut", "Dernière activité"].map((h) => <th key={h} scope="col" className="px-5 py-4 font-semibold">{h}</th>)}
              <th scope="col" className="px-5 py-4"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {shown.map((m) => <MemberRow key={m.user_id} member={m} meId={me.user.id} canManage={canManage} />)}
          </tbody>
        </table>
        <nav aria-label="Pagination des membres" className="flex items-center justify-between border-t px-5 py-4">
          <p className="text-muted-foreground">
            {filtered.length ? `${(current - 1) * PER_PAGE + 1} à ${(current - 1) * PER_PAGE + shown.length} sur ${filtered.length}` : "Aucun membre"}
          </p>
          <div className="flex gap-2">
            {[
              { label: "Précédent", to: current - 1, disabled: current <= 1 },
              { label: "Suivant", to: current + 1, disabled: current >= pages },
            ].map((b) =>
              b.disabled ? (
                <span key={b.label} aria-disabled className={cn(buttonVariants({ variant: "outline" }), "pointer-events-none opacity-50")}>{b.label}</span>
              ) : (
                <Link key={b.label} href={href(b.to)} className={buttonVariants({ variant: "outline" })}>{b.label}</Link>
              )
            )}
          </div>
        </nav>
      </div>
      {invitations.length > 0 && <PendingInvitations invitations={invitations} />}
    </div>
  );
}
