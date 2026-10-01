import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { WineLogo } from "@/components/common/wine-logo";
import { NAV } from "../content";

export function SiteHeader() {
  return (
    <header className="border-b bg-background">
      <div className="mx-auto flex h-18 max-w-6xl items-center gap-4 px-4 sm:px-8 md:gap-8">
        <Link href="/" aria-label="WINE, accueil" className="rounded-md">
          <WineLogo />
        </Link>
        <nav aria-label="Sections de la page" className="hidden md:block">
          <ul className="flex gap-7">
            {NAV.map((n) => (
              <li key={n.href}>
                <a href={n.href} className="text-[15px] text-muted-foreground">
                  {n.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="ml-auto flex items-center gap-2 sm:gap-4">
          <Link href="/connexion" className="rounded-md px-1 py-2 text-[15px] font-semibold whitespace-nowrap sm:px-2">
            Se connecter
          </Link>
          <Link href="/inscription" className={buttonVariants({ className: "transition-none! hover:bg-primary! max-sm:h-9 max-sm:px-3 max-sm:text-sm" })}>
            Créer mon espace
          </Link>
        </div>
      </div>
    </header>
  );
}
