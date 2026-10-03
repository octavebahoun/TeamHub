"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { login, type FormState } from "@/lib/actions/session";
import { AuthHeading } from "../../_components/auth-shell";
import { FormField } from "../../_components/form-field";

export function LoginForm({ next, justReset }: { next?: string; justReset?: boolean }) {
  const [state, action, pending] = useActionState<FormState, FormData>(login, undefined);
  return (
    <>
      <AuthHeading title="Connexion" subtitle="Content de vous revoir." />
      <form action={action} className="space-y-6" noValidate>
        <input type="hidden" name="next" value={next ?? "/"} />
        {justReset && !state?.error && (
          <p role="status" className="rounded-md bg-muted px-4 py-3 text-sm">
            Mot de passe mis à jour. Vous pouvez vous connecter.
          </p>
        )}
        {state?.error && (
          <p role="alert" className="rounded-md bg-brand-soft px-4 py-3 text-sm text-brand-soft-foreground">
            {state.error}
          </p>
        )}
        <FormField id="email" name="email" type="email" label="Email" autoComplete="email" required placeholder="vous@entreprise.com" defaultValue={state?.values?.email} />
        <FormField
          id="password"
          name="password"
          type="password"
          label="Mot de passe"
          autoComplete="current-password"
          required
          aside={
            <Link href="/mot-de-passe-oublie" className="text-sm text-primary underline underline-offset-4 hover:text-primary-hover">
              Mot de passe oublié ?
            </Link>
          }
        />
        <div className="flex items-center gap-3">
          <Checkbox id="remember" name="remember" defaultChecked className="size-5" />
          <Label htmlFor="remember" className="text-[15px] font-normal">
            Rester connecté
          </Label>
        </div>
        <Button type="submit" size="lg" className="h-12 w-full" disabled={pending}>
          {pending ? "Connexion…" : "Se connecter"}
        </Button>
        <p className="text-center text-[15px] text-muted-foreground">
          Pas encore de compte ?{" "}
          <Link href="/inscription" className="text-primary underline underline-offset-4 hover:text-primary-hover">
            Créer une organisation
          </Link>
        </p>
      </form>
    </>
  );
}
