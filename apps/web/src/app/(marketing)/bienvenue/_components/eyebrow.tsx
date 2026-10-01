/** Sur-titre de section : filet orange + capitales espacées. */
export function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-5 flex items-center gap-4 text-[13px] font-semibold tracking-[0.18em] text-brand-soft-foreground uppercase">
      <span aria-hidden className="h-px w-10 bg-primary" />
      {children}
    </p>
  );
}

/** Titre de section en serif, avec une partie en italique orange. */
export function SectionTitle({ id, children }: { id?: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="font-heading text-[36px] leading-[1.12] sm:text-[48px] [&_em]:text-primary [&_em]:italic">
      {children}
    </h2>
  );
}
