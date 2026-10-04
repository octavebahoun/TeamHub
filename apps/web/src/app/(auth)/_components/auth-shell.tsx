import { WineLogo } from "@/components/common/wine-logo";

/** Écrans publics : panneau de marque à gauche, formulaire à droite. */
export function AuthShell({ aside, children }: { aside: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <aside className="relative flex flex-col overflow-hidden bg-gradient-to-br from-primary via-primary to-primary-hover px-8 py-10 text-primary-foreground sm:px-14 lg:min-h-dvh">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 -right-16 size-72 rounded-full bg-white/10 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-20 -left-10 size-64 rounded-full bg-black/10 blur-3xl"
        />
        <div className="relative">
          <WineLogo inverted />
          <div className="flex flex-1 flex-col justify-center py-10">{aside}</div>
          <p className="hidden text-[15px] text-primary-foreground/80 lg:block">Un produit Excellence Team</p>
        </div>
      </aside>
      <main id="contenu" className="app-mesh flex items-center justify-center px-6 py-12 sm:px-12">
        <div data-reveal className="reveal w-full max-w-110 rounded-2xl border bg-card/90 p-6 shadow-sm backdrop-blur-sm sm:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}

export function AuthHeading({ title, subtitle }: { title: string; subtitle?: React.ReactNode }) {
  return (
    <header className="mb-8">
      <h1 className="font-heading text-[clamp(1.75rem,5vw,2.5rem)] leading-tight">{title}</h1>
      {subtitle && <div className="mt-2 text-[17px] text-muted-foreground">{subtitle}</div>}
    </header>
  );
}

export const asideTitle = "font-heading text-[clamp(1.75rem,4vw,3.25rem)] leading-[1.12]";
