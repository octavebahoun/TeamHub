import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/** Carte KPI réutilisable (tableau de bord, résumés). */
export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  active,
  className,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  icon?: LucideIcon;
  /** Met en avant avec une lueur orange discrète. */
  active?: boolean;
  className?: string;
}) {
  return (
    <article
      className={cn(
        "rounded-xl border bg-card p-5 transition-shadow",
        active && "glow-active border-primary/25",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        {Icon ? <Icon className="size-5 shrink-0 text-subtle-foreground" aria-hidden /> : null}
      </div>
      <p className="mt-2 font-heading text-[32px] leading-none tabular-nums tracking-tight">{value}</p>
      {hint ? <p className="mt-2 text-xs text-muted-foreground">{hint}</p> : null}
    </article>
  );
}
