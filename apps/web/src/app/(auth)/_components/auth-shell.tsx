import Link from "next/link";
import Image from "next/image";
import { WineLogo } from "@/components/common/wine-logo";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import type { AuthIllustrationVariant } from "./auth-illustration";

const ILLUSTRATIONS: Record<AuthIllustrationVariant, { src: string; alt: string }> = {
  login: {
    src: "/illustrations/auth-team.jpg",
    alt: "Professionnel WINE et modules de travail",
  },
  register: {
    src: "/illustrations/auth-grow.jpg",
    alt: "Équipe lançant son espace WINE",
  },
  crm: {
    src: "/illustrations/auth-crm.jpg",
    alt: "Suivi client et CRM",
  },
};

/**
 * Auth : zone gauche = scène visuelle (image dominante) + carton glass pour le message.
 * Le formulaire reste à droite, calé sur 1 viewport.
 */
export function AuthShell({
  aside,
  children,
  illustration = "login",
}: {
  aside: React.ReactNode;
  children: React.ReactNode;
  illustration?: AuthIllustrationVariant;
}) {
  const art = ILLUSTRATIONS[illustration];

  return (
    <div className="grid h-dvh overflow-hidden lg:grid-cols-2">
      <aside className="relative hidden min-h-0 overflow-hidden bg-primary lg:block">
        {/* Scène : image dominante, légèrement teintée */}
        <div className="absolute inset-0">
          <Image
            src={art.src}
            alt=""
            fill
            priority
            sizes="50vw"
            className="object-cover object-center scale-[1.02]"
            aria-hidden
          />
          <div
            aria-hidden
            className="absolute inset-0 bg-gradient-to-t from-primary via-primary/35 to-primary/20"
          />
          <div
            aria-hidden
            className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-primary/70 to-transparent"
          />
        </div>

        <div className="relative z-10 flex h-full flex-col p-7 xl:p-9">
          <Link
            href="/"
            aria-label="WINE, retour à l'accueil"
            className="w-fit rounded-xl bg-white/15 px-3 py-2 shadow-sm ring-1 ring-white/25 backdrop-blur-md transition-opacity hover:opacity-90"
          >
            <WineLogo inverted withMark className="[&_span]:text-[24px] [&_svg]:size-6" />
          </Link>

          {/* Carton message : ancré en bas, lecture claire sans noyer l'image */}
          <div className="mt-auto">
            <div className="rounded-3xl bg-white/14 p-6 text-primary-foreground shadow-[0_24px_60px_-28px_rgb(0_0_0/0.55)] ring-1 ring-white/30 backdrop-blur-xl xl:p-7">
              <div className="max-w-md">{aside}</div>
              <p className="mt-5 text-[12px] text-primary-foreground/75">Un produit Excellence Team</p>
            </div>
          </div>
        </div>
        <span className="sr-only">{art.alt}</span>
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

export const asideTitle = "font-heading text-[clamp(1.4rem,2.2vw,2.15rem)] leading-[1.12]";
