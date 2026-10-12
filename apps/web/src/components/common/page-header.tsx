import Link from "next/link";
import { cn } from "@/lib/utils";

export type Crumb = { label: string; href?: string };

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Fil d'Ariane" className="mb-4 text-sm">
      <ol className="flex flex-wrap items-center gap-2">
        {items.map((c, i) => (
          <li key={i} className="flex items-center gap-2">
            {i > 0 && (
              <span aria-hidden className="text-muted-foreground">
                /
              </span>
            )}
            {c.href ? (
              <Link href={c.href} className="text-primary underline underline-offset-4 hover:text-primary-hover">
                {c.label}
              </Link>
            ) : (
              <span aria-current="page">{c.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

/** En-tête d'écran : titre serif, sous-titre, actions à droite. */
export function PageHeader({
  title,
  subtitle,
  actions,
  crumbs,
  badge,
  className,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  crumbs?: Crumb[];
  badge?: React.ReactNode;
  className?: string;
}) {
  return (
    <header data-reveal className={cn("reveal mb-7 sm:mb-8", className)}>
      {crumbs && <Breadcrumbs items={crumbs} />}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="title-shine font-heading text-[clamp(1.5rem,5vw,2.35rem)] leading-tight">{title}</h1>
            {badge}
          </div>
          {subtitle && <p className="mt-1.5 max-w-2xl text-muted-foreground">{subtitle}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </header>
  );
}
