import type { Metadata } from "next";
import { differenceInCalendarDays, isSameMonth } from "date-fns";
import { getMe, getMembers, getPosts, getProjects } from "@/lib/api/endpoints";
import { ago, toDate } from "@/lib/format";
import { can, currentRole } from "@/lib/permissions";
import { EmptyState } from "@/components/common/empty-state";
import { Panel, PanelTitle } from "@/components/common/panel";
import { UserAvatar } from "@/components/common/user-avatar";
import { PostCard } from "./_components/post-card";
import { PostComposer } from "./_components/post-composer";

export const metadata: Metadata = { title: "Social" };

export default async function SocialPage() {
  const me = await getMe();
  const role = currentRole(me);
  const [posts, members, projects] = await Promise.all([getPosts(), can(role, "members.view") ? getMembers() : Promise.resolve([]), getProjects()]);
  const now = new Date();
  const orgName = me.current_organization?.name ?? "l'équipe";

  const wins = [
    ...posts.data.filter((p) => p.kind === "project_delivered" && p.meta?.project).map((p) => `Projet « ${p.meta!.project} » livré`),
    ...projects.filter((p) => p.status === "done" && isSameMonth(toDate(p.end_date) ?? 0, now)).map((p) => `${p.name} terminé`),
  ];
  const recent = members.filter((m) => m.joined_at && differenceInCalendarDays(now, toDate(m.joined_at)!) <= 30);
  if (recent.length) wins.push(`${recent.length === 1 ? "Un nouveau membre accueilli" : `${recent.length} nouveaux membres accueillis`}`);

  return (
    <div className="mx-auto grid grid-cols-1 max-w-6xl gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="min-w-0 space-y-6">
        <header>
          <h1 className="font-heading text-[36px] leading-tight">Fil de l&apos;équipe</h1>
          <p className="mt-1.5 text-muted-foreground">Annonces, réussites et nouvelles d&apos;{orgName}</p>
        </header>
        {can(role, "post.create") && <PostComposer me={me.user.name} canPin={can(role, "post.pin")} />}
        {posts.data.length === 0 ? (
          <EmptyState title="Le fil est vide">Partagez la première nouvelle de l&apos;équipe.</EmptyState>
        ) : (
          <ul className="space-y-6">
            {[...new Map(posts.data.map((p) => [p.id, p])).values()].map((p) => (
              <li key={p.id}>
                <PostCard post={p} canPin={can(role, "post.pin")} canComment />
              </li>
            ))}
          </ul>
        )}
      </div>
      <aside className="space-y-6" aria-label="En bref">
        {wins.length > 0 && (
          <Panel className="p-6">
            <PanelTitle className="mb-4">Réussites du mois</PanelTitle>
            <ul className="space-y-3">
              {wins.map((w) => (
                <li key={w} className="flex gap-3">
                  <span aria-hidden className="mt-2 size-2 shrink-0 rounded-full bg-primary" />
                  {w}
                </li>
              ))}
            </ul>
          </Panel>
        )}
        {recent.length > 0 && (
          <Panel className="p-6">
            <PanelTitle className="mb-4">Nouveaux membres</PanelTitle>
            <ul className="space-y-4">
              {recent.map((m) => (
                <li key={m.user_id} className="flex items-center gap-3">
                  <UserAvatar name={m.name} decorative />
                  <div className="leading-tight">
                    <p className="font-semibold">{m.name}</p>
                    <p className="text-sm text-muted-foreground">Arrivé·e {ago(m.joined_at).toLowerCase()}</p>
                  </div>
                </li>
              ))}
            </ul>
          </Panel>
        )}
      </aside>
    </div>
  );
}
