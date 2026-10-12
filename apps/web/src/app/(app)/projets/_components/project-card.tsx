import Link from "next/link";
import { CalendarDays } from "lucide-react";
import type { Project } from "@/lib/api/types";
import { projectProgress } from "@/lib/domain";
import { shortDate } from "@/lib/format";
import { PROJECT_STATUS } from "@/lib/labels";
import { AvatarStack } from "@/components/common/user-avatar";
import { ProgressBar } from "@/components/common/progress-bar";
import { ToneBadge } from "@/components/common/tone-badge";

export function ProjectCard({ project: p }: { project: Project }) {
  const pr = projectProgress(p);
  const status = PROJECT_STATUS[p.status];
  const subtitle = p.client ? p.client.company ?? p.client.name : "Produit interne";
  return (
    <article className="relative flex h-full flex-col rounded-xl border bg-card p-6 transition-shadow focus-within:ring-2 focus-within:ring-ring hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <h2 className="font-heading text-[24px] leading-snug">
          <Link href={`/projets/${p.id}`} className="after:absolute after:inset-0 after:rounded-xl focus:outline-none">
            {p.name}
          </Link>
        </h2>
        <ToneBadge tone={status.tone}>{status.label}</ToneBadge>
      </div>
      <p className="mt-1 text-muted-foreground">{subtitle}</p>
      <div className="mt-6 mb-2.5 flex justify-between">
        <span>
          {pr.done} / {pr.total} tâches
        </span>
        <span className="font-semibold">{Math.round(pr.ratio * 100)}%</span>
      </div>
      <ProgressBar value={pr.ratio} label={`Avancement de ${p.name}`} />
      <div className="mt-auto flex items-center justify-between gap-3 border-t pt-5 [margin-top:max(1.5rem,auto)]">
        <AvatarStack names={(p.members ?? []).map((m) => m.name)} />
        <p className="flex items-center gap-2 text-muted-foreground">
          <CalendarDays aria-hidden className="size-4.5" strokeWidth={1.75} />
          {p.status === "done" ? `Livré le ${shortDate(p.end_date)}` : (
            <>
              <span className="sr-only">Échéance :</span> {shortDate(p.end_date)}
            </>
          )}
        </p>
      </div>
    </article>
  );
}
