import { Trophy, UsersRound } from "lucide-react";

export function ProofBar() {
  return (
    <section aria-label="Références" className="border-y bg-muted">
      <ul className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-12 gap-y-3 px-5 py-6 text-[16px]">
        <li className="flex items-center gap-3">
          <Trophy aria-hidden className="size-5 text-primary" strokeWidth={1.75} />
          <span>
            <strong className="font-semibold">3e place</strong> <span className="text-muted-foreground">au concours GENEB/MTN</span>
          </span>
        </li>
        <li className="flex items-center gap-3">
          <UsersRound aria-hidden className="size-5 text-primary" strokeWidth={1.75} />
          <span>
            <span className="text-muted-foreground">Utilisé chaque jour par l&apos;équipe</span> <strong className="font-semibold">Excellence Team</strong>
          </span>
        </li>
      </ul>
    </section>
  );
}
