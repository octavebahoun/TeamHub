import { cn } from "@/lib/utils";
import { initials } from "@/lib/format";

const SIZES = { xs: "size-7 text-[11px]", sm: "size-8 text-xs", md: "size-10 text-[13px]", lg: "size-12 text-sm", xl: "size-16 text-xl" };

/** Avatar à initiales. `tone="dark"` = personne assignée / utilisateur courant, `soft` = membre. */
export function UserAvatar({
  name,
  size = "md",
  tone = "soft",
  className,
  decorative = false,
}: {
  name: string;
  size?: keyof typeof SIZES;
  tone?: "soft" | "dark" | "brand";
  className?: string;
  /** Vrai quand le nom est déjà écrit à côté : l'avatar est alors ignoré par les lecteurs d'écran. */
  decorative?: boolean;
}) {
  return (
    <span
      role={decorative ? undefined : "img"}
      aria-label={decorative ? undefined : name}
      aria-hidden={decorative || undefined}
      title={name}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-semibold select-none",
        SIZES[size],
        tone === "dark" && "bg-inverse text-inverse-foreground",
        tone === "soft" && "bg-secondary text-secondary-foreground",
        tone === "brand" && "bg-primary text-primary-foreground font-heading",
        className
      )}
    >
      {initials(name)}
    </span>
  );
}

/** Pile d'avatars qui se chevauchent (membres d'un projet). */
export function AvatarStack({ names, max = 4, size = "md" }: { names: string[]; max?: number; size?: keyof typeof SIZES }) {
  const shown = names.slice(0, max);
  const rest = names.length - shown.length;
  return (
    <ul className="flex items-center" aria-label={`Équipe : ${names.join(", ")}`}>
      {shown.map((n) => (
        <li key={n} className="-ml-2 first:ml-0">
          <UserAvatar name={n} size={size} decorative className="ring-2 ring-card" />
        </li>
      ))}
      {rest > 0 && (
        <li className="-ml-2">
          <span aria-hidden className={cn("inline-flex items-center justify-center rounded-full bg-secondary font-semibold ring-2 ring-card", SIZES[size])}>
            +{rest}
          </span>
        </li>
      )}
    </ul>
  );
}
