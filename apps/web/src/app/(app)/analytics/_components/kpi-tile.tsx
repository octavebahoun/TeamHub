import { Panel } from "@/components/common/panel";

/** Tuile chiffre-clé premium. */
export function KpiTile({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <Panel as="div" className="relative overflow-hidden p-5 sm:p-6">
      <div aria-hidden className="pointer-events-none absolute -top-10 -right-8 size-28 rounded-full bg-primary/10 blur-2xl" />
      <dl className="relative">
        <dt className="text-sm font-medium tracking-wide text-muted-foreground uppercase">{label}</dt>
        <dd className="mt-3 font-heading text-[clamp(2rem,4vw,2.75rem)] leading-none tracking-tight">{value}</dd>
        <dd className="mt-3 text-sm text-muted-foreground">{hint}</dd>
      </dl>
    </Panel>
  );
}
