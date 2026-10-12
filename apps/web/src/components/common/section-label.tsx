import { plural } from "@/lib/format";

/** Intitulé de groupe en capitales avec compteur (« EN RETARD 1 »). */
export function SectionLabel({ id, children, count }: { id?: string; children: React.ReactNode; count?: number }) {
  return (
    <h2 id={id} className="mb-3 flex items-center gap-2 font-sans text-[13px] font-semibold tracking-[0.12em] uppercase">
      {children}
      {count !== undefined && (
        <>
          <span aria-hidden className="inline-flex size-6 items-center justify-center rounded-full bg-secondary text-xs tracking-normal">
            {count}
          </span>
          <span className="sr-only"> {plural(count, "élément", "éléments")}</span>
        </>
      )}
    </h2>
  );
}
