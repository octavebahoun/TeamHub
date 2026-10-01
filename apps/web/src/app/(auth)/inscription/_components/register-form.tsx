"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { FieldError } from "@/components/common/field-error";
import { register, type FormState } from "@/lib/actions/session";
import { AuthHeading } from "../../_components/auth-shell";
import { FormField } from "../../_components/form-field";

const legend = "mb-4 text-[13px] font-semibold tracking-[0.12em] text-muted-foreground uppercase";

export function RegisterForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(register, undefined);
  const f = state?.fields ?? {};
  return (
    <>
      <AuthHeading title="Créer votre espace" subtitle="Votre compte et votre organisation, en une seule étape." />
      <form action={action} className="space-y-7" noValidate>
        {state?.error && (
          <p role="alert" className="rounded-md bg-brand-soft px-4 py-3 text-sm text-brand-soft-foreground">
            {state.error}
          </p>
        )}
        <fieldset className="space-y-5">
          <legend className={legend}>Vous</legend>
          <FormField id="name" name="name" label="Nom complet" autoComplete="name" required error={f.name} defaultValue={state?.values?.name} />
          <FormField id="email" name="email" type="email" label="Email" autoComplete="email" required placeholder="vous@entreprise.com" error={f.email} defaultValue={state?.values?.email} />
          <FormField id="password" name="password" type="password" label="Mot de passe" autoComplete="new-password" required minLength={8} hint="8 caractères minimum" error={f.password} />
        </fieldset>
        <fieldset className="space-y-5">
          <legend className={legend}>Votre organisation</legend>
          <FormField
            id="organization_name"
            name="organization_name"
            label="Nom de l'organisation"
            required
            placeholder="Ex. Excellence Team"
            error={f.organization_name}
            defaultValue={state?.values?.organization_name}
          />
        </fieldset>
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <Checkbox id="terms" name="terms" className="size-5" aria-invalid={!!f.terms || undefined} aria-describedby={f.terms ? "terms-error" : undefined} />
            <Label htmlFor="terms" className="text-[15px] font-normal">
              J&apos;accepte les{" "}
              <Link href="/conditions" className="text-primary underline underline-offset-4">
                conditions d&apos;utilisation
              </Link>
            </Label>
          </div>
          <FieldError id="terms-error" message={f.terms} />
        </div>
        <Button type="submit" size="lg" className="h-12 w-full" disabled={pending}>
          {pending ? "Création…" : "Créer mon espace"}
        </Button>
        <p className="text-center text-[15px] text-muted-foreground">
          Déjà inscrit ?{" "}
          <Link href="/connexion" className="text-primary underline underline-offset-4 hover:text-primary-hover">
            Se connecter
          </Link>
        </p>
      </form>
    </>
  );
}
