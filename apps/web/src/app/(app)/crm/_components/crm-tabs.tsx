import Link from "next/link";
import { cn } from "@/lib/utils";

export function CrmTabs({ current }: { current: "contacts" | "pipeline" }) {
  const tabs = [
    { id: "contacts", label: "Contacts", href: "/crm" },
    { id: "pipeline", label: "Pipeline", href: "/crm/pipeline" },
  ] as const;
  return (
    <nav aria-label="Sections du CRM" className="mb-6 border-b">
      <ul className="-mb-px flex gap-2">
        {tabs.map((t) => (
          <li key={t.id}>
            <Link
              href={t.href}
              aria-current={current === t.id ? "page" : undefined}
              className={cn("inline-flex h-12 items-center border-b-[3px] px-5", current === t.id ? "border-primary font-semibold" : "border-transparent text-muted-foreground hover:text-foreground")}
            >
              {t.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
