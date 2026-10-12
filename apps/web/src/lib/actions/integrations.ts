"use server";

import { revalidatePath } from "next/cache";
import { api, ApiError } from "@/lib/api/client";
import type { ContravoSettings } from "@/lib/contravo/client";

/** Enregistre la clé et l'identité de facturation de l'espace courant. Une clé vide n'est envoyée que pour l'effacer. */
export async function saveContravoIntegration(input: {
  apiKey?: string;
  clearKey?: boolean;
  billingName: string;
  billingCity: string;
  billingEmail: string;
}): Promise<{ error?: string }> {
  const body: Record<string, string> = {
    billing_name: input.billingName.trim(),
    billing_city: input.billingCity.trim(),
    billing_email: input.billingEmail.trim(),
  };
  if (input.clearKey) body.api_key = "";
  else if (input.apiKey?.trim()) body.api_key = input.apiKey.trim();

  try {
    await api<ContravoSettings>("integrations/contravo", { method: "PUT", body });
    revalidatePath("/parametres/integrations");
    return {};
  } catch (error) {
    if (error instanceof ApiError) return { error: error.message };
    return { error: "Enregistrement impossible." };
  }
}
