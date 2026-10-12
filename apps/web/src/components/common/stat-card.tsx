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
  active?: boolean;
  className?: string;
}) {
  return (
    <article
      data-reveal
      className={cn(
        "panel-premium reveal relative overflow-hidden rounded-2xl p-5 transition-shadow",
        active && "glow-active",
        className
      )}
    >
      <div aria-hidden className="pointer-events-none absolute -top-8 -right-6 size-24 rounded-full bg-primary/10 blur-2xl" />
      <div className="relative flex items-start justify-between gap-3">
        <p className="text-sm font-medium tracking-wide text-muted-foreground uppercase">{label}</p>
        {Icon ? <Icon className="size-5 shrink-0 text-primary/80" aria-hidden /> : null}
      </div>
      <p className="relative mt-3 font-heading text-[clamp(1.75rem,3vw,2rem)] leading-none tabular-nums tracking-tight">{value}</p>
      {hint ? <p className="relative mt-2 text-xs text-muted-foreground">{hint}</p> : null}
    </article>
  );
}
