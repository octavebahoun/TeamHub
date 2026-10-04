import Link from "next/link";
import { WineLogo } from "@/components/common/wine-logo";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { AuthIllustration, type AuthIllustrationVariant } from "./auth-illustration";

/** Écrans publics : panneau de marque à gauche, formulaire à droite — calé sur 1 viewport. */
export function AuthShell({
  aside,
  children,
  illustration = "login",
}: {
  aside: React.ReactNode;
  children: React.ReactNode;
  illustration?: AuthIllustrationVariant;
}) {
  return (
    <div className="grid h-dvh overflow-hidden lg:grid-cols-2">
      <aside className="relative hidden min-h-0 flex-col overflow-hidden bg-gradient-to-br from-primary via-primary to-primary-hover px-8 py-6 text-primary-foreground lg:flex lg:px-10 lg:py-7 xl:px-12">
        <div aria-hidden className="orb orb-a -top-24 -right-16 size-72 bg-white/20" />
        <div aria-hidden className="orb orb-b -bottom-28 -left-16 size-64 bg-black/25" />
        <div className="relative flex min-h-0 flex-1 flex-col">
          <Link href="/" aria-label="WINE, retour à l'accueil" className="w-fit shrink-0 rounded-md transition-opacity hover:opacity-90">
            <WineLogo inverted withMark className="[&_span]:text-[24px] [&_svg]:size-6" />
          </Link>
          <div className="flex min-h-0 flex-1 flex-col justify-center gap-4 py-4">
            <div className="shrink-0">{aside}</div>
            <AuthIllustration variant={illustration} className="min-h-0 flex-1" />
          </div>
          <p className="shrink-0 text-[13px] text-primary-foreground/75">Un produit Excellence Team</p>
        </div>
      </aside>
      <main id="contenu" className="app-mesh relative flex min-h-0 items-center justify-center overflow-y-auto px-5 py-6 sm:px-10">
        <div className="absolute top-3 right-3 z-10 sm:top-5 sm:right-5">
          <ThemeToggle />
        </div>
        <div className="absolute top-3 left-3 z-10 lg:hidden">
          <Link href="/" aria-label="WINE, retour à l'accueil">
            <WineLogo withMark className="[&_span]:text-[22px] [&_svg]:size-6" />
          </Link>
        </div>
        <div data-reveal className="reveal panel-premium my-auto w-full max-w-md rounded-2xl p-5 sm:p-7">
          {children}
        </div>
      </main>
    </div>
  );
}

export function AuthHeading({ title, subtitle }: { title: string; subtitle?: React.ReactNode }) {
  return (
    <header className="mb-5 sm:mb-6">
      <h1 className="font-heading text-[clamp(1.5rem,4vw,2.1rem)] leading-tight">{title}</h1>
      {subtitle && <div className="mt-1.5 text-[15px] text-muted-foreground sm:text-[16px]">{subtitle}</div>}
    </header>
  );
}

export const asideTitle = "font-heading text-[clamp(1.45rem,2.4vw,2.35rem)] leading-[1.12]";
