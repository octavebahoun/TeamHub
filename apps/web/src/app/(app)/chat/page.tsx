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
    // Le chat occupe toute la hauteur disponible sous la barre du haut, sans marges de page.
    <div className="-mx-4 -my-8 h-[calc(100dvh-4.75rem)] sm:-mx-8 sm:-my-10">
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
