import { initials, plural } from "@/lib/format";

/** Organisation active, en pied de barre latérale. */
export function OrgCard({ name, members }: { name: string; members?: number }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border bg-muted px-3.5 py-3">
      <span aria-hidden className="inline-flex size-9 items-center justify-center rounded-md bg-primary text-[13px] font-semibold text-primary-foreground">
        {initials(name)}
      </span>
      <div className="min-w-0 leading-tight">
        <p className="truncate font-semibold">{name}</p>
        {members !== undefined && <p className="text-[13px] text-muted-foreground">{plural(members, "membre", "membres")}</p>}
      </div>
    </div>
  );
}
