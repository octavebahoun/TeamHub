import { AppSidebar } from "@/components/shell/app-sidebar";
import { NAV_ITEMS } from "@/components/shell/nav-items";
import { Topbar } from "@/components/shell/topbar";
import { RealtimeProvider } from "@/components/realtime/realtime-provider";
import { getMe, getMembers, getProjects } from "@/lib/api/endpoints";
import { can, currentRole } from "@/lib/permissions";

/** Coque de l'application connectée : barre latérale, barre du haut, temps réel. */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const me = await getMe();
  const role = currentRole(me);
  const canCreateTask = can(role, "task.create");
  const [members, projects] = await Promise.all([
    can(role, "members.view") ? getMembers() : Promise.resolve([]),
    canCreateTask ? getProjects() : Promise.resolve([]),
  ]);
  const org = {
    name: me.current_organization?.name ?? "Mon organisation",
    members: members.length || undefined,
    settingsHref: can(role, "members.view") ? "/parametres/membres" : "/profil",
  };
  const hidden = NAV_ITEMS.filter((i) => i.ability && !can(role, i.ability)).map((i) => i.href);

  return (
    <RealtimeProvider url={process.env.NEXT_PUBLIC_WS_URL} organizationId={me.current_organization?.id}>
      <a href="#contenu" className="sr-only z-50 rounded-md bg-primary px-4 py-2 text-primary-foreground focus:not-sr-only focus:fixed focus:top-3 focus:left-3">
        Aller au contenu
      </a>
      <div className="flex min-h-dvh">
        <AppSidebar org={org} hidden={hidden} />
        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar
            user={{ name: me.user.name, email: me.user.email, canSeeMembers: can(role, "members.view") }}
            org={org}
            hidden={hidden}
            taskOptions={
              canCreateTask
                ? {
                    projects: projects.filter((p) => !p.archived_at).map((p) => ({ id: p.id, name: p.name })),
                    members: members.map((m) => ({ id: m.user_id, name: m.name })),
                  }
                : null
            }
          />
          <main id="contenu" tabIndex={-1} className="flex-1 px-4 py-8 outline-none sm:px-8 sm:py-10">
            {children}
          </main>
        </div>
      </div>
    </RealtimeProvider>
  );
}
