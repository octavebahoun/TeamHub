import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { WineLogo } from "@/components/common/wine-logo";
import { NAV } from "../content";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b bg-background/90 backdrop-blur-md dark:glass">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-2 px-3 sm:h-16 sm:gap-4 sm:px-8 md:gap-8">
        <Link href="/" aria-label="WINE, accueil" className="shrink-0 rounded-md">
          <WineLogo className="[&_span]:text-[22px] sm:[&_span]:text-[28px]" />
        </Link>
        <nav aria-label="Sections de la page" className="hidden md:block">
          <ul className="flex gap-7">
            {NAV.map((n) => (
              <li key={n.href}>
                <a href={n.href} className="text-[15px] text-muted-foreground transition-colors hover:text-foreground">
                  {n.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="ml-auto flex min-w-0 items-center gap-1.5 sm:gap-3">
          <Link
            href="/connexion"
            className="rounded-md px-2 py-2 text-[14px] font-semibold whitespace-nowrap hover:text-primary sm:text-[15px]"
          >
            Connexion
          </Link>
          <Link
            href="/inscription"
            className={buttonVariants({
              className: "h-9 shrink-0 px-3 text-[13px] sm:h-10 sm:px-4 sm:text-sm",
            })}
          >
            <span className="sm:hidden">Créer</span>
            <span className="hidden sm:inline">Créer mon espace</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
