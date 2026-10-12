import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { WineLogo } from "@/components/common/wine-logo";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { NAV } from "../content";

export function SiteHeader() {
  return (
    <header className="border-b bg-background px-3 sm:px-6">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-2 border-border/60 px-3 sm:h-16 sm:gap-4 sm:px-5">
        <Link href="/" aria-label="WINE, accueil" className="shrink-0 rounded-md">
          <WineLogo withMark className="[&_span]:text-[20px] sm:[&_span]:text-[26px] [&_svg]:size-6 sm:[&_svg]:size-7" />
        </Link>
        <nav aria-label="Sections de la page" className="hidden md:block">
          <ul className="flex gap-6">
            {NAV.map((n) => (
              <li key={n.href}>
                <a href={n.href} className="text-[14px] font-medium text-muted-foreground">
                  {n.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="ml-auto flex min-w-0 items-center gap-1.5 sm:gap-2.5">
          <ThemeToggle />
          <Link href="/connexion" className="rounded-xl px-2.5 py-2 text-[14px] font-semibold whitespace-nowrap sm:text-[15px]">
            Connexion
          </Link>
          <Link
            href="/inscription"
            className={buttonVariants({
              className: "h-9 shrink-0 rounded-xl px-3 text-[13px] sm:h-10 sm:px-4 sm:text-sm",
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
