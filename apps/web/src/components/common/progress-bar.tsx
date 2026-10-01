import { cn } from "@/lib/utils";

/** Barre de progression accessible (role=progressbar). */
export function ProgressBar({ value, label, className, tone = "brand" }: { value: number; label: string; className?: string; tone?: "brand" | "strong" | "light" }) {
  const pct = Math.round(Math.min(1, Math.max(0, value)) * 100);
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={pct}
      className={cn("h-2 w-full overflow-hidden rounded-full bg-secondary", className)}
    >
      <div
        className={cn(
          "h-full rounded-full",
          tone === "brand" && "bg-primary",
          tone === "strong" && "bg-brand-soft-foreground",
          tone === "light" && "bg-brand-light"
        )}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
