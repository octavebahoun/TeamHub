import { cn } from "@/lib/utils";
import type { Tone } from "@/lib/labels";

const TONES: Record<Tone, string> = {
  brand: "bg-brand-soft text-brand-soft-foreground",
  neutral: "bg-secondary text-secondary-foreground",
  success: "bg-success-soft text-success",
  info: "bg-info-soft text-info",
  danger: "bg-brand-soft-foreground text-primary-foreground",
  outline: "border border-border bg-background text-foreground",
};

/** Pastille de statut/priorité/étape. La couleur n'est jamais le seul porteur d'information : le texte reste lisible. */
export function ToneBadge({ tone, children, className }: { tone: Tone; children: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-7 shrink-0 items-center rounded-full px-3 text-[13px] font-semibold whitespace-nowrap",
        TONES[tone],
        className
      )}
    >
      {children}
    </span>
  );
}
