"use client";

import { useActionState } from "react";
import { toast } from "sonner";
import type { FormState } from "@/lib/actions/session";
import { userFacingError } from "@/lib/errors/user-facing";

/**
 * `useActionState` + réactions au résultat (fermer un dialogue, notifier…)
 * exécutées dans la transition de l'action, plutôt que dans un effet.
 * Les erreurs générales (`error`) sont notifiées sauf si `showErrors: false`
 * (le formulaire les affiche alors lui-même).
 */
export function useFormAction(
  action: (state: FormState, form: FormData) => Promise<FormState>,
  { onSuccess, successMessage, showErrors = true }: { onSuccess?: (state: FormState) => void; successMessage?: string; showErrors?: boolean } = {}
) {
  return useActionState<FormState, FormData>(async (prev, form) => {
    const next = await action(prev, form);
    if (next?.ok) {
      if (successMessage) toast.success(successMessage);
      onSuccess?.(next);
    } else if (next?.error && showErrors) {
      toast.error(userFacingError(next.error));
    }
    return next;
  }, undefined);
}
