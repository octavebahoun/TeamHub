import type { Metadata } from "next";
import { getMe, getMembers, getProjects } from "@/lib/api/endpoints";
import { can, currentRole } from "@/lib/permissions";
import { ChatApp } from "./_components/chat-app";

export const metadata: Metadata = { title: "Chat" };

export default async function ChatPage({ searchParams }: { searchParams: Promise<{ canal?: string; projet?: string }> }) {
  const sp = await searchParams;
  const me = await getMe();
  const [members, projects] = await Promise.all([can(currentRole(me), "members.view") ? getMembers() : Promise.resolve([]), getProjects()]);
  return (
    // Plein écran sous topbar + barre inférieure mobile (lg : sidebar seule).
    <div className="-mx-3 -mt-3 -mb-5 h-[calc(100dvh-3.75rem-5.25rem)] overflow-hidden rounded-2xl border border-border/50 bg-card/40 shadow-sm backdrop-blur-sm sm:-mx-5 sm:-mt-4 lg:-mx-7 lg:h-[calc(100dvh-5rem)] lg:mb-0">
      <ChatApp
        meId={me.user.id}
        people={members.map((m) => ({ id: m.user_id, name: m.name }))}
        projects={projects.map((p) => ({ id: p.id, name: p.name }))}
        initialChannel={sp.canal}
        initialProjectId={sp.projet ? Number(sp.projet) : undefined}
      />
    </div>
  );
}
