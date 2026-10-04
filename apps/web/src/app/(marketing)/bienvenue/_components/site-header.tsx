import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { WineLogo } from "@/components/common/wine-logo";
import { NAV } from "../content";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 px-3 pt-3 sm:px-6 sm:pt-4">
      <div className="glass mx-auto flex h-14 max-w-6xl items-center gap-2 rounded-2xl border border-border/60 bg-background/70 px-3 shadow-[0_12px_40px_-24px_rgb(0_0_0/0.45)] backdrop-blur-xl sm:h-16 sm:gap-4 sm:px-5">
        <Link href="/" aria-label="WINE, accueil" className="shrink-0 rounded-md transition-transform hover:scale-[1.02]">
          <WineLogo withMark className="[&_span]:text-[20px] sm:[&_span]:text-[26px] [&_svg]:size-6 sm:[&_svg]:size-7" />
        </Link>
        <nav aria-label="Sections de la page" className="hidden md:block">
          <ul className="flex gap-6">
            {NAV.map((n) => (
              <li key={n.href}>
                <a
                  href={n.href}
                  className="text-[14px] font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  {n.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="ml-auto flex min-w-0 items-center gap-1.5 sm:gap-2.5">
          <Link
            href="/connexion"
            className="rounded-xl px-2.5 py-2 text-[14px] font-semibold whitespace-nowrap hover:text-primary sm:text-[15px]"
          >
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
