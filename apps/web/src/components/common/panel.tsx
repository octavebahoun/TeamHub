import { cn } from "@/lib/utils";

/** Carte blanche bordée, brique de base des écrans. */
export function Panel({ className, as: Tag = "section", ...props }: React.HTMLAttributes<HTMLElement> & { as?: "section" | "div" | "article" | "aside" | "li" }) {
  return <Tag className={cn("rounded-xl border bg-card", className)} {...props} />;
}

/** Titre de carte en serif (« Description », « Historique »…). */
export function PanelTitle({ className, as: Tag = "h2", ...props }: React.HTMLAttributes<HTMLHeadingElement> & { as?: "h2" | "h3" }) {
  return <Tag className={cn("font-heading text-[22px] leading-tight", className)} {...props} />;
}
