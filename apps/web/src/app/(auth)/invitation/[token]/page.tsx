import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { getInvitationPreview } from "@/lib/api/endpoints";
import { initials } from "@/lib/format";
import { ROLE } from "@/lib/labels";
import { TOKEN_COOKIE } from "@/lib/session";
import { ToneBadge } from "@/components/common/tone-badge";
import { AuthHeading, AuthShell, asideTitle } from "../../_components/auth-shell";
import { AcceptInvitation, InvitationRegisterForm } from "./_components/invitation-forms";

export const metadata: Metadata = { title: "Rejoindre l'équipe" };

export default async function InvitationPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const [invitation, loggedIn] = await Promise.all([getInvitationPreview(token).catch(() => null), cookies().then((c) => c.has(TOKEN_COOKIE))]);
  const orgName = invitation?.organization.name ?? "Votre équipe";

  return (
    <AuthShell
      aside={
        <>
          <span aria-hidden className="mb-8 inline-flex size-20 items-center justify-center rounded-2xl bg-background font-heading text-3xl text-primary">
            {initials(orgName)}
          </span>
          <p className={asideTitle}>{orgName} vous attend.</p>
          <p className="mt-6 max-w-xl text-[19px] leading-relaxed">
            {invitation?.invited_by ? `${invitation.invited_by.name} vous a invité` : "Vous êtes invité"} à rejoindre l&apos;équipe sur WINE.
          </p>
        </>
      }
    >
      <AuthHeading
        title="Rejoindre l'équipe"
        subtitle={
          invitation && (
            <span className="flex items-center gap-2 text-[16px]">
              Votre rôle : <ToneBadge tone="brand">{ROLE[invitation.role].label}</ToneBadge>
            </span>
          )
        }
      />
      {loggedIn ? (
        <AcceptInvitation token={token} orgName={orgName} />
      ) : invitation ? (
        <InvitationRegisterForm token={token} email={invitation.email} orgName={orgName} expiresAt={invitation.expires_at} />
      ) : (
        <div className="space-y-4 text-[17px] text-muted-foreground">
          <p>Connectez-vous avec l&apos;adresse e-mail qui a reçu l&apos;invitation pour la valider.</p>
          <Link href={`/connexion?next=/invitation/${encodeURIComponent(token)}`} className="text-primary underline underline-offset-4">
            Se connecter pour accepter
          </Link>
        </div>
      )}
    </AuthShell>
  );
}
