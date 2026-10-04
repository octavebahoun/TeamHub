import { WineLogo } from "@/components/common/wine-logo";

/** Écrans publics : panneau de marque à gauche, formulaire à droite. */
export function AuthShell({ aside, children }: { aside: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <aside className="relative flex flex-col overflow-hidden bg-gradient-to-br from-primary via-primary to-primary-hover px-8 py-10 text-primary-foreground sm:px-14 lg:min-h-dvh">
        <div aria-hidden className="orb orb-a -top-24 -right-16 size-80 bg-white/20" />
        <div aria-hidden className="orb orb-b -bottom-28 -left-16 size-72 bg-black/25" />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "linear-gradient(rgb(255 255 255 / 0.2) 1px, transparent 1px), linear-gradient(90deg, rgb(255 255 255 / 0.2) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
            maskImage: "radial-gradient(ellipse 70% 60% at 40% 40%, #000 10%, transparent 70%)",
          }}
        />
        <div className="relative flex flex-1 flex-col">
          <WineLogo inverted withMark />
          <div className="flex flex-1 flex-col justify-center py-10">{aside}</div>
          <p className="hidden text-[15px] text-primary-foreground/80 lg:block">Un produit Excellence Team</p>
        </div>
      </aside>
      <main id="contenu" className="app-mesh flex items-center justify-center px-6 py-12 sm:px-12">
        <div data-reveal className="reveal panel-premium w-full max-w-110 rounded-2xl p-6 sm:p-8">
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
