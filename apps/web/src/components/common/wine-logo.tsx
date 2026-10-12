import { cn } from "@/lib/utils";

/** Logotype WINE : six modules autour d'un centre + mot en serif. */
export function WineLogo({ className, inverted = false, withMark = false }: { className?: string; inverted?: boolean; withMark?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      {withMark && (
        <svg viewBox="0 0 100 100" aria-hidden className="size-7">
          {[[50, 14], [81, 32], [81, 68], [50, 86], [19, 68], [19, 32]].map(([x, y]) => (
            <circle key={`${x}-${y}`} cx={x} cy={y} r="9" className={inverted ? "fill-primary-foreground" : "fill-primary"} />
          ))}
          <circle cx="50" cy="50" r="15" className="fill-inverse" />
        </svg>
      )}
      <span className={cn("font-heading text-[28px] leading-none font-semibold tracking-wide", inverted ? "text-primary-foreground" : "text-primary")}>
        WINE
      </span>
    </span>
  );
}
