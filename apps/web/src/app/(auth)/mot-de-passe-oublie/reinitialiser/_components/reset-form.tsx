"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { resetPassword } from "@/lib/actions/password";
import type { FormState } from "@/lib/actions/session";
import { AuthHeading } from "../../../_components/auth-shell";
import { FormField } from "../../../_components/form-field";

export function ResetForm({ token, email }: { token: string; email: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(resetPassword, undefined);
  const f = state?.fields ?? {};

  if (!token || !email) {
    return (
      <>
        <AuthHeading title="Lien incomplet" subtitle="Ce lien ne contient pas tout ce qu'il faut pour changer le mot de passe." />
        <Link href="/mot-de-passe-oublie" className="text-primary underline underline-offset-4">
          Demander un nouveau lien
        </Link>
      </>
    );
  }

  return (
    <>
      <AuthHeading title="Nouveau mot de passe" subtitle={email} />
      <form action={action} className="space-y-6" noValidate>
        <input type="hidden" name="token" value={token} />
        <input type="hidden" name="email" value={email} />
        {state?.error && (
          <p role="alert" className="rounded-md bg-brand-soft px-4 py-3 text-sm text-brand-soft-foreground">
            {state.error}
          </p>
        )}
        {f.email && (
          <p role="alert" className="rounded-md bg-brand-soft px-4 py-3 text-sm text-brand-soft-foreground">
            {f.email}{" "}
            <Link href="/mot-de-passe-oublie" className="underline underline-offset-4">
              Demander un nouveau lien
            </Link>
          </p>
        )}
        <FormField
          id="password"
          name="password"
          type="password"
          label="Nouveau mot de passe"
          autoComplete="new-password"
          required
          minLength={8}
          hint="8 caractères minimum"
          error={f.password}
        />
        <FormField
          id="password_confirmation"
          name="password_confirmation"
          type="password"
          label="Confirmation"
          autoComplete="new-password"
          required
          minLength={8}
        />
        <Button type="submit" size="lg" className="h-12 w-full" disabled={pending}>
          {pending ? "Enregistrement…" : "Enregistrer"}
        </Button>
      </form>
    </>
  );
}
