import type { Metadata } from "next";
import { getMe, getNotificationPrefs } from "@/lib/api/endpoints";
import { ROLE } from "@/lib/labels";
import { currentRole } from "@/lib/permissions";
import { Button } from "@/components/ui/button";
import { Panel, PanelTitle } from "@/components/common/panel";
import { ToneBadge } from "@/components/common/tone-badge";
import { UserAvatar } from "@/components/common/user-avatar";
import { OrgCard } from "@/components/shell/org-card";
import { AccountActions } from "./_components/account-actions";
import { NotificationPrefs } from "./_components/notification-prefs";
import { PasswordForm } from "./_components/password-form";
import { ProfileForm } from "./_components/profile-form";
import { SwitchOrgButton } from "./_components/switch-org-button";

export const metadata: Metadata = { title: "Mon profil" };

const DEFAULT_PREFS = { task_assigned: true, due_reminder: true, chat_messages: true, weekly_digest: false };

export default async function ProfilePage() {
  const [me, prefs] = await Promise.all([getMe(), getNotificationPrefs()]);
  const role = currentRole(me);
  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <header className="flex flex-wrap items-center gap-6">
        <UserAvatar name={me.user.name} size="xl" tone="brand" className="size-24 text-4xl" decorative />
        <div className="flex-1">
          <h1 className="font-heading text-[40px] leading-tight">{me.user.name}</h1>
          <p className="text-[17px] text-muted-foreground">{[me.user.title ?? ROLE[role].label, me.current_organization?.name].filter(Boolean).join(" · ")}</p>
        </div>
        <Button variant="outline" size="lg" disabled title="Bientôt disponible">Changer la photo</Button>
      </header>
      <ProfileForm user={me.user} />
      <PasswordForm />
      <NotificationPrefs initial={prefs ?? DEFAULT_PREFS} />
      <Panel className="p-7">
        <PanelTitle className="mb-5">Mes organisations</PanelTitle>
        <ul className="space-y-3">
          {me.organizations.map((o) => (
            <li key={o.id} className="flex flex-wrap items-center gap-4">
              <div className="flex-1"><OrgCard name={o.name} /></div>
              {o.pivot && <ToneBadge tone={o.pivot.role === "owner" ? "brand" : "neutral"}>{ROLE[o.pivot.role].label}</ToneBadge>}
              {o.id !== me.current_organization?.id && <SwitchOrgButton orgId={o.id} name={o.name} />}
            </li>
          ))}
        </ul>
      </Panel>
      <AccountActions />
    </div>
  );
}
