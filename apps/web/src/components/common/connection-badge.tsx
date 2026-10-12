import { cn } from "@/lib/utils";

export type ConnectionStatus = "online" | "reconnecting" | "offline";

const STATUS: Record<
  ConnectionStatus,
  { label: string; dot: string; pulse?: boolean }
> = {
  online: { label: "En ligne", dot: "bg-success" },
  reconnecting: { label: "Reconnexion…", dot: "bg-brand-light", pulse: true },
  offline: { label: "Hors ligne", dot: "bg-muted-foreground/70" },
};

/** Indicateur de connexion temps réel (chat, présence). */
export function ConnectionBadge({
  status,
  className,
  compact,
}: {
  status: ConnectionStatus;
  className?: string;
  /** Masque le libellé, conserve l’indicateur pour les lecteurs d’écran. */
  compact?: boolean;
}) {
  const cfg = STATUS[status];

  return (
    <span
      className={cn("inline-flex items-center gap-2 text-sm text-muted-foreground", className)}
      role="status"
    >
      <span
        className={cn(
          "size-2.5 shrink-0 rounded-full",
          cfg.dot,
          cfg.pulse && "motion-safe:animate-pulse"
        )}
        aria-hidden
      />
      <span className={cn(compact && "sr-only")}>{cfg.label}</span>
    </span>
  );
}
