"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { requestPasswordReset } from "@/lib/actions/password";
import type { FormState } from "@/lib/actions/session";
import { AuthHeading } from "../../_components/auth-shell";
import { FormField } from "../../_components/form-field";

export function ForgotForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(requestPasswordReset, undefined);

  if (state?.ok) {
    return (
      <>
        <AuthHeading title="Vérifiez votre email" subtitle="Si un compte correspond à cette adresse, le lien est en route." />
        <p className="text-[17px] leading-relaxed text-muted-foreground">
          Le lien est valable 60 minutes. Pensez à regarder les courriers indésirables.
        </p>
        <Link href="/connexion" className="mt-8 inline-block text-primary underline underline-offset-4">
          Retour à la connexion
        </Link>
      </>
    );
  }

  return (
    <>
      <AuthHeading title="Mot de passe oublié" subtitle="On vous envoie un lien pour en choisir un nouveau." />
      <form action={action} className="space-y-6" noValidate>
        {state?.error && (
          <p role="alert" className="rounded-md bg-brand-soft px-4 py-3 text-sm text-brand-soft-foreground">
            {state.error}
          </p>
        )}
        <FormField
          id="email"
          name="email"
          type="email"
          label="Email"
          autoComplete="email"
          required
          placeholder="vous@entreprise.com"
          error={state?.fields?.email}
          defaultValue={state?.values?.email}
        />
        <Button type="submit" size="lg" className="h-12 w-full" disabled={pending}>
          {pending ? "Envoi…" : "Recevoir le lien"}
        </Button>
        <p className="text-center text-[15px] text-muted-foreground">
          <Link href="/connexion" className="text-primary underline underline-offset-4 hover:text-primary-hover">
            Retour à la connexion
          </Link>
        </p>
      </form>
    </>
  );
}
