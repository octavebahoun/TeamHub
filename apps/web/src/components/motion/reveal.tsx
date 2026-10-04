import { cn } from "@/lib/utils";

type Delay = 0 | 1 | 2 | 3 | 4 | 5;

/**
 * Bloc révélé au scroll (via ScrollReveal global).
 * Utilisable en Server Component — pas de "use client".
 */
export function Reveal({
  children,
  className,
  as: Tag = "div",
  delay = 0,
  variant = "up",
}: {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "section" | "article" | "li" | "header" | "aside";
  delay?: Delay;
  variant?: "up" | "fade" | "scale" | "left" | "right";
}) {
  return (
    <Tag
      data-reveal
      data-reveal-variant={variant}
      data-reveal-delay={delay || undefined}
      className={cn("reveal", className)}
    >
      {children}
    </Tag>
  );
}
