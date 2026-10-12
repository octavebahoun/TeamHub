import { initials } from "@/lib/format";
import { cn } from "@/lib/utils";

/** Pastille carrée aux initiales de l'entreprise. */
export function CompanyMark({ name, size = "md" }: { name: string; size?: "md" | "lg" }) {
  return (
    <span aria-hidden className={cn("inline-flex shrink-0 items-center justify-center rounded-lg bg-secondary font-semibold", size === "md" ? "size-11 text-sm" : "size-16 font-heading text-2xl font-normal")}>
      {initials(name)}
    </span>
  );
}
