import { WineLogo } from "@/components/common/wine-logo";

/** Écrans publics : panneau de marque orange à gauche, formulaire à droite. */
export function AuthShell({ aside, children }: { aside: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <aside className="flex flex-col bg-primary px-8 py-10 text-primary-foreground sm:px-14 lg:min-h-dvh">
        <WineLogo inverted />
        <div className="flex flex-1 flex-col justify-center py-10">{aside}</div>
        <p className="hidden text-[15px] lg:block">Un produit Excellence Team</p>
      </aside>
      <main id="contenu" className="flex items-center justify-center px-6 py-12 sm:px-12">
        <div className="w-full max-w-110">{children}</div>
      </main>
    </div>
  );
}

export function AuthHeading({ title, subtitle }: { title: string; subtitle?: React.ReactNode }) {
  return (
    <header className="mb-8">
      <h1 className="font-heading text-[40px] leading-tight">{title}</h1>
      {subtitle && <div className="mt-2 text-[17px] text-muted-foreground">{subtitle}</div>}
    </header>
  );
}

export const asideTitle = "font-heading text-[44px] leading-[1.12] sm:text-[52px]";
