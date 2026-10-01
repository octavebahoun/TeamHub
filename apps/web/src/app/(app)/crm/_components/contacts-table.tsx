import Link from "next/link";
import { differenceInCalendarDays } from "date-fns";
import type { ContactRow } from "@/lib/domain";
import { dueLabel, firstName, toDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { ToneBadge } from "@/components/common/tone-badge";
import { UserAvatar } from "@/components/common/user-avatar";
import { CompanyMark } from "./company-mark";

/** Relance imminente (≤ 3 jours ou en retard) : mise en avant. */
const soon = (d: string | null) => {
  const date = toDate(d);
  return !!date && differenceInCalendarDays(date, new Date()) <= 3;
};

export function ContactsTable({ rows }: { rows: ContactRow[] }) {
  return (
    <div className="relative overflow-x-auto rounded-xl border bg-card">
      <table className="w-full min-w-[860px] text-left">
        <caption className="sr-only">Contacts du CRM</caption>
        <thead className="border-b text-[13px] tracking-[0.1em] uppercase">
          <tr>
            {["Contact", "Type", "Projets", "Prochaine relance", "Responsable"].map((h) => (
              <th key={h} scope="col" className="px-6 py-4 font-semibold">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y">
          {rows.map(({ client: c, kind, projects, followUp }) => (
            <tr key={c.id} className="relative hover:bg-muted/60">
              <td className="px-6 py-4">
                <div className="flex items-center gap-4">
                  <CompanyMark name={c.company ?? c.name} />
                  <div className="leading-tight">
                    <Link href={`/crm/${c.id}`} className="font-semibold after:absolute after:inset-0 hover:underline focus:outline-none">
                      {c.company ?? c.name}
                    </Link>
                    <p className="mt-0.5 text-sm text-muted-foreground">{[c.company ? c.name : null, c.email].filter(Boolean).join(" · ")}</p>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4">
                <ToneBadge tone={kind === "client" ? "success" : "brand"}>{kind === "client" ? "Client" : "Prospect"}</ToneBadge>
              </td>
              <td className="px-6 py-4">{projects.length ? projects.join(", ") : <span className="text-muted-foreground">Aucun</span>}</td>
              <td className={cn("px-6 py-4", soon(followUp) ? "font-semibold text-danger" : "text-muted-foreground")}>{followUp ? dueLabel(followUp) : "—"}</td>
              <td className="px-6 py-4">
                {c.owner ? (
                  <span className="flex items-center gap-2.5">
                    <UserAvatar name={c.owner.name} size="sm" tone="dark" decorative />
                    {firstName(c.owner.name)}
                  </span>
                ) : (
                  "—"
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
