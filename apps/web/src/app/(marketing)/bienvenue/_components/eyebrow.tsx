/** Sur-titre de section : filet orange + capitales espacées. */
export function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-3 flex items-center gap-3 text-[11px] font-semibold tracking-[0.16em] text-brand-soft-foreground uppercase sm:mb-5 sm:gap-4 sm:text-[13px] sm:tracking-[0.18em]">
      <span aria-hidden className="h-px w-7 shrink-0 bg-primary sm:w-10" />
      <span className="min-w-0 leading-snug">{children}</span>
    </p>
  );
}

/** Titre de section en serif, avec une partie en italique orange. */
export function SectionTitle({ id, children }: { id?: string; children: React.ReactNode }) {
  return (
    <h2
      id={id}
      className="font-heading text-[clamp(1.75rem,5.5vw,3rem)] leading-[1.15] tracking-tight [&_em]:text-primary [&_em]:italic"
    >
      {children}
    </h2>
  );
}
