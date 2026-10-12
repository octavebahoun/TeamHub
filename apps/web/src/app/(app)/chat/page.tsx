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
    <div className="-mx-3 min-h-0 flex-1 overflow-hidden rounded-2xl border border-border/50 bg-card/40 shadow-sm backdrop-blur-sm sm:-mx-5 lg:-mx-7">
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
