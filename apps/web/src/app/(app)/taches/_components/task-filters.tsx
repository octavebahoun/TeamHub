"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { NativeSelect } from "@/components/common/native-select";
import { TASK_PRIORITY } from "@/lib/labels";

/** Filtres projet / personne / priorité, reflétés dans l'URL. */
export function TaskFilters({ projects, people }: { projects: { id: number; name: string }[]; people: { id: number; name: string }[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const set = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key === "projet") next.delete("personne");
    router.replace(`${pathname}?${next}`, { scroll: false });
  };
  return (
    <div className="flex flex-wrap gap-3">
      <label className="sr-only" htmlFor="f-projet">Projet</label>
      <NativeSelect id="f-projet" className="w-52" value={params.get("projet") ?? ""} onChange={(e) => set("projet", e.target.value)}>
        {projects.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </NativeSelect>
      <label className="sr-only" htmlFor="f-personne">Personne assignée</label>
      <NativeSelect id="f-personne" className="w-48" value={params.get("personne") ?? ""} onChange={(e) => set("personne", e.target.value)}>
        <option value="">Toute l&apos;équipe</option>
        {people.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </NativeSelect>
      <label className="sr-only" htmlFor="f-priorite">Priorité</label>
      <NativeSelect id="f-priorite" className="w-44" value={params.get("priorite") ?? ""} onChange={(e) => set("priorite", e.target.value)}>
        <option value="">Toutes priorités</option>
        {Object.entries(TASK_PRIORITY).map(([v, p]) => (
          <option key={v} value={v}>
            {p.label}
          </option>
        ))}
      </NativeSelect>
    </div>
  );
}
