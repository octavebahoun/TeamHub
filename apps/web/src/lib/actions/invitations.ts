"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { api, ApiError } from "@/lib/api/client";
import type { Invitation, Organization, Role, User } from "@/lib/api/types";
import { ORG_COOKIE, SESSION_COOKIE_OPTIONS, TOKEN_COOKIE } from "@/lib/session";
import type { FormState } from "./session";
import { localizeFieldErrors } from "@/lib/validation/fr";

/** Accepter une invitation quand on est déjà connecté (avec l'adresse invitée). */
export async function acceptInvitation(token: string): Promise<FormState> {
  try {
    const res = await api<{ organization: Organization }>(`invitations/${encodeURIComponent(token)}/accept`, { method: "POST" });
    (await cookies()).set(ORG_COOKIE, String(res.organization.id), SESSION_COOKIE_OPTIONS);
  } catch (e) {
    if (e instanceof ApiError) {
      if (e.status === 410) return { error: "Cette invitation a expiré. Demandez-en une nouvelle." };
      if (e.status === 403) return { error: "Cette invitation est destinée à une autre adresse e-mail. Connectez-vous avec la bonne adresse." };
      return { error: e.message };
    }
    throw e;
  }
  redirect("/");
}

/** Créer son compte directement depuis l'invitation (extension d'API, cf. docs/api-gaps.md). */
export async function registerFromInvitation(token: string, _: FormState, form: FormData): Promise<FormState> {
  const values = { name: String(form.get("name") ?? "") };
  try {
    const res = await api<{ token: string; user: User; organization: Organization }>(`invitations/${encodeURIComponent(token)}/register`, {
      method: "POST",
      anonymous: true,
      body: { name: values.name, password: String(form.get("password") ?? "") },
    });
    const jar = await cookies();
    jar.set(TOKEN_COOKIE, res.token, SESSION_COOKIE_OPTIONS);
    jar.set(ORG_COOKIE, String(res.organization.id), SESSION_COOKIE_OPTIONS);
  } catch (e) {
    if (e instanceof ApiError && e.status === 422) return { fields: localizeFieldErrors(e.errors), values };
    if (e instanceof ApiError) return { error: e.status === 410 ? "Cette invitation a expiré." : e.message, values };
    throw e;
  }
  redirect("/");
}

// --- Gestion des invitations (page Membres) -----------------------------------
export async function inviteMember(_: FormState, form: FormData): Promise<FormState> {
  const values = { email: String(form.get("email") ?? ""), role: String(form.get("role") ?? "member") };
  try {
    await api<Invitation>("invitations", { method: "POST", body: { email: values.email, role: values.role as Role } });
    revalidatePath("/parametres/membres");
    return { ok: true };
  } catch (e) {
    if (e instanceof ApiError && e.status === 422) return { fields: localizeFieldErrors(e.errors), values };
    if (e instanceof ApiError) return { error: e.message, values };
    throw e;
  }
}

export async function resendInvitation(id: number) {
  await api(`invitations/${id}/resend`, { method: "POST" });
  revalidatePath("/parametres/membres");
}

export async function cancelInvitation(id: number) {
  await api(`invitations/${id}`, { method: "DELETE" });
  revalidatePath("/parametres/membres");
}
