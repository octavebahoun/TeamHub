import { cn } from "@/lib/utils";

/** Carte bordée — révélée au scroll + léger lift au survol. */
export function Panel({
  className,
  as: Tag = "section",
  reveal = true,
  lift = true,
  ...props
}: React.HTMLAttributes<HTMLElement> & {
  as?: "section" | "div" | "article" | "aside" | "li";
  /** Animation d'apparition au scroll (défaut: oui). */
  reveal?: boolean;
  /** Micro-interaction hover (défaut: oui). */
  lift?: boolean;
}) {
  return (
    <Tag
      data-reveal={reveal ? "" : undefined}
      className={cn("rounded-2xl border bg-card shadow-xs", reveal && "reveal", lift && "surface-lift", className)}
      {...props}
    />
  );
}

/** Titre de carte en serif (« Description », « Historique »…). */
export function PanelTitle({ className, as: Tag = "h2", ...props }: React.HTMLAttributes<HTMLHeadingElement> & { as?: "h2" | "h3" }) {
  return <Tag className={cn("font-heading text-[22px] leading-tight", className)} {...props} />;
}
