import { Panel } from "@/components/common/panel";

/** Tuile chiffre-clé : libellé, valeur en serif, précision. */
export function KpiTile({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <Panel as="div" className="p-6">
      <dl>
        <dt className="text-muted-foreground">{label}</dt>
        <dd className="mt-2 font-heading text-[44px] leading-none">{value}</dd>
        <dd className="mt-3 text-sm text-muted-foreground">{hint}</dd>
      </dl>
    </Panel>
  );
}
