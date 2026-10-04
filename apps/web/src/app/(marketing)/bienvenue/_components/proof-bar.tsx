import { Trophy, UsersRound } from "lucide-react";

export function ProofBar() {
  return (
    <section aria-label="Références" className="border-y bg-muted/80">
      <ul className="mx-auto flex max-w-6xl flex-col items-start gap-4 px-4 py-5 text-[15px] sm:flex-row sm:flex-wrap sm:items-center sm:justify-center sm:gap-x-12 sm:gap-y-3 sm:px-5 sm:py-6 sm:text-[16px]">
        <li className="flex items-start gap-3 sm:items-center">
          <Trophy aria-hidden className="mt-0.5 size-5 shrink-0 text-primary sm:mt-0" strokeWidth={1.75} />
          <span>
            <strong className="font-semibold">3e place</strong>{" "}
            <span className="text-muted-foreground">au concours GENEB/MTN</span>
          </span>
        </li>
        <li className="flex items-start gap-3 sm:items-center">
          <UsersRound aria-hidden className="mt-0.5 size-5 shrink-0 text-primary sm:mt-0" strokeWidth={1.75} />
          <span>
            <span className="text-muted-foreground">Utilisé chaque jour par l&apos;équipe</span>{" "}
            <strong className="font-semibold">Excellence Team</strong>
          </span>
        </li>
      </ul>
    </section>
  );
}
