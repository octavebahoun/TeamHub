import Link from "next/link";
import { WineLogo } from "@/components/common/wine-logo";
import { SiteFooter } from "../bienvenue/_components/site-footer";
import { SiteHeader } from "../bienvenue/_components/site-header";

export function MarketingPage({
  title,
  lead,
  children,
}: {
  title: string;
  lead?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="app-mesh min-h-dvh">
      <SiteHeader />
      <main id="contenu" className="mx-auto max-w-3xl px-5 py-12 sm:px-8 sm:py-16">
        <Link href="/" className="mb-8 inline-flex items-baseline gap-2 text-muted-foreground hover:text-foreground">
          <WineLogo className="[&>span]:text-[20px]" />
          <span className="text-sm">Retour à l&apos;accueil</span>
        </Link>
        <header className="mb-8">
          <h1 className="font-heading text-[clamp(1.75rem,4vw,2.5rem)] leading-tight">{title}</h1>
          {lead && <p className="mt-3 text-[17px] leading-relaxed text-muted-foreground">{lead}</p>}
        </header>
        <div className="prose-wine space-y-5 text-[16px] leading-relaxed text-muted-foreground">{children}</div>
      </main>
      <SiteFooter />
    </div>
  );
}
