import { Trophy, UsersRound, Zap } from "lucide-react";

export function ProofBar() {
  return (
    <section aria-label="Références" className="border-y bg-muted/50 backdrop-blur-sm">
      <ul className="mx-auto flex max-w-6xl flex-col items-stretch gap-3 px-4 py-5 text-[15px] sm:flex-row sm:flex-wrap sm:items-center sm:justify-center sm:gap-3 sm:px-5 sm:py-6 sm:text-[16px]">
        <li className="flex items-center gap-3 rounded-2xl border border-border/50 bg-card/60 px-4 py-3 backdrop-blur-sm">
          <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand-soft-foreground">
            <Trophy aria-hidden className="size-4" strokeWidth={1.75} />
          </span>
          <span>
            <strong className="font-semibold">3e place</strong>{" "}
            <span className="text-muted-foreground">au concours GENEB/MTN</span>
          </span>
        </li>
        <li className="flex items-center gap-3 rounded-2xl border border-border/50 bg-card/60 px-4 py-3 backdrop-blur-sm">
          <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand-soft-foreground">
            <UsersRound aria-hidden className="size-4" strokeWidth={1.75} />
          </span>
          <span>
            <span className="text-muted-foreground">Utilisé chaque jour par</span>{" "}
            <strong className="font-semibold">Excellence Team</strong>
          </span>
        </li>
        <li className="flex items-center gap-3 rounded-2xl border border-border/50 bg-card/60 px-4 py-3 text-muted-foreground backdrop-blur-sm sm:basis-full sm:justify-center lg:basis-auto">
          <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-xl bg-secondary text-foreground">
            <Zap aria-hidden className="size-4" strokeWidth={1.75} />
          </span>
          <span>
            <strong className="font-semibold text-foreground">Contravo</strong>
            <span className="mx-2 text-border">·</span>
            <strong className="font-semibold text-foreground">MoMo</strong>
            <span className="mx-2 text-border">·</span>
            <strong className="font-semibold text-foreground">PWA</strong>
          </span>
        </li>
      </ul>
    </section>
  );
}
