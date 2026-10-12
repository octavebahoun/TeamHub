import { Check } from "lucide-react";
import { Panel, PanelTitle } from "@/components/common/panel";
import { cn } from "@/lib/utils";

type Milestone = { code: string; title: string; done: boolean; current: boolean };

export function Milestones({ items }: { items: Milestone[] }) {
  return (
    <Panel className="p-7">
      <PanelTitle className="mb-4">Jalons</PanelTitle>
      <ol className="divide-y border-t">
        {items.map((m) => (
          <li key={m.code} className="flex items-center gap-5 py-4">
            <span
              aria-hidden
              className={cn(
                "inline-flex size-7 shrink-0 items-center justify-center rounded-full border-2",
                m.done && "border-success bg-success text-primary-foreground",
                m.current && "border-primary",
                !m.done && !m.current && "border-border"
              )}
            >
              {m.done && <Check className="size-4" strokeWidth={3} />}
            </span>
            <span className="w-8 font-semibold text-muted-foreground">{m.code}</span>
            <span className="flex-1">{m.title}</span>
            <span className="sr-only">{m.done ? "terminé" : m.current ? "en cours" : "à venir"}</span>
          </li>
        ))}
      </ol>
    </Panel>
  );
}
