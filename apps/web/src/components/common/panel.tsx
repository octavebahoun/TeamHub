import { cn } from "@/lib/utils";

/** Carte premium — bordure dégradée discrète, glass, reveal + lift. */
export function Panel({
  className,
  as: Tag = "section",
  reveal = true,
  lift = true,
  ...props
}: React.HTMLAttributes<HTMLElement> & {
  as?: "section" | "div" | "article" | "aside" | "li";
  reveal?: boolean;
  lift?: boolean;
}) {
  return (
    <Tag
      data-reveal={reveal ? "" : undefined}
      className={cn(
        "panel-premium rounded-2xl",
        reveal && "reveal",
        lift && "surface-lift",
        className
      )}
      {...props}
    />
  );
}

export function PanelTitle({ className, as: Tag = "h2", ...props }: React.HTMLAttributes<HTMLHeadingElement> & { as?: "h2" | "h3" }) {
  return <Tag className={cn("font-heading text-[22px] leading-tight tracking-tight", className)} {...props} />;
}
