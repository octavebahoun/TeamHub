"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { acceptInvitation, registerFromInvitation } from "@/lib/actions/invitations";
import type { FormState } from "@/lib/actions/session";
import { shortDate } from "@/lib/format";
import { FormField } from "../../../_components/form-field";

const Alert = ({ message }: { message?: string }) =>
  message ? (
    <p role="alert" className="rounded-md bg-brand-soft px-4 py-3 text-sm text-brand-soft-foreground">
      {message}
    </p>
  ) : null;

export function InvitationRegisterForm({ token, email, orgName, expiresAt }: { token: string; email: string; orgName: string; expiresAt: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(registerFromInvitation.bind(null, token), undefined);
  const f = state?.fields ?? {};
  return (
    <form action={action} className="space-y-6" noValidate>
      <Alert message={state?.error} />
      <FormField id="email" label="Email" type="email" value={email} readOnly hint="L'invitation est liée à cette adresse." className="h-12 bg-secondary" />
      <FormField id="name" name="name" label="Nom complet" autoComplete="name" required error={f.name} defaultValue={state?.values?.name} />
      <FormField id="password" name="password" type="password" label="Choisir un mot de passe" autoComplete="new-password" required minLength={8} error={f.password} />
      <Button type="submit" size="lg" className="h-12 w-full" disabled={pending}>
        {pending ? "Un instant…" : `Rejoindre ${orgName}`}
      </Button>
      <p className="text-center text-[15px] text-muted-foreground">Cette invitation expire le {shortDate(expiresAt)}.</p>
      <p className="text-center text-[15px] text-muted-foreground">
        Vous avez déjà un compte ?{" "}
        <Link href={`/connexion?next=/invitation/${encodeURIComponent(token)}`} className="text-primary underline underline-offset-4">
          Se connecter pour accepter
        </Link>
      </p>
    </form>
  );
}

export function AcceptInvitation({ token, orgName }: { token: string; orgName: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(() => acceptInvitation(token), undefined);
  return (
    <form action={action} className="space-y-6">
      <Alert message={state?.error} />
      <p className="text-[17px] text-muted-foreground">Vous êtes connecté. Un clic suffit pour rejoindre l&apos;organisation.</p>
      <Button type="submit" size="lg" className="h-12 w-full" disabled={pending}>
        {pending ? "Un instant…" : `Rejoindre ${orgName}`}
      </Button>
    </form>
  );
}
