import { initials, plural } from "@/lib/format";

/** Organisation active, en pied de barre latérale. */
export function OrgCard({ name, members }: { name: string; members?: number }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border/70 bg-gradient-to-br from-primary/10 via-muted/80 to-muted px-3.5 py-3">
      <span
        aria-hidden
        className="inline-flex size-10 items-center justify-center rounded-xl bg-primary text-[13px] font-semibold text-primary-foreground shadow-[0_8px_20px_-10px_var(--primary)]"
      >
        {initials(name)}
      </span>
      <div className="min-w-0 leading-tight">
        <p className="truncate font-semibold">{name}</p>
        {members !== undefined && (
          <p className="text-[13px] text-muted-foreground">{plural(members, "membre", "membres")}</p>
        )}
      </div>
    </div>
  );
}
