"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { api, ApiError } from "@/lib/api/client";
import type { Organization, User } from "@/lib/api/types";
import { ORG_COOKIE, SESSION_COOKIE_OPTIONS, TOKEN_COOKIE } from "@/lib/session";
import { localizeFieldErrors, localizeMessage } from "@/lib/validation/fr";

export type FormState = { ok?: boolean; error?: string; fields?: Record<string, string>; values?: Record<string, string> } | undefined;

async function openSession(token: string, orgId?: number | null) {
  const jar = await cookies();
  jar.set(TOKEN_COOKIE, token, SESSION_COOKIE_OPTIONS);
  if (orgId) jar.set(ORG_COOKIE, String(orgId), SESSION_COOKIE_OPTIONS);
}

const fieldErrors = (e: ApiError) => localizeFieldErrors(e.errors);

/** Si l'utilisateur arrive d'un lien d'invitation, on l'accepte juste après la connexion. */
function nextPath(raw: FormDataEntryValue | null) {
  const s = typeof raw === "string" ? raw : "";
  return s.startsWith("/") && !s.startsWith("//") ? s : "/";
}

export async function login(_: FormState, form: FormData): Promise<FormState> {
  const values = { email: String(form.get("email") ?? "") };
  try {
    const res = await api<{ token: string; user: User }>("auth/login", {
      method: "POST",
      anonymous: true,
      body: { email: values.email, password: String(form.get("password") ?? "") },
    });
    await openSession(res.token, res.user.current_organization_id);
  } catch (e) {
    if (e instanceof ApiError) {
      if (e.status === 429) return { error: "Trop de tentatives. Réessayez dans une minute.", values };
      if (e.status === 503) return { error: e.message, values };
      const localized = fieldErrors(e);
      return {
        error: localized.email ?? localizeMessage(e.message),
        fields: localized,
        values,
      };
    }
    return { error: "Connexion impossible pour le moment. Vérifiez que l'API est démarrée ou activez le mode mock.", values };
  }
  redirect(nextPath(form.get("next")));
}

export async function register(_: FormState, form: FormData): Promise<FormState> {
  const values = {
    name: String(form.get("name") ?? ""),
    email: String(form.get("email") ?? ""),
    organization_name: String(form.get("organization_name") ?? ""),
  };
  if (form.get("terms") !== "on") {
    return { fields: { terms: "Acceptez les conditions d'utilisation pour continuer." }, values };
  }
  try {
    const res = await api<{ token: string; user: User; organization: Organization }>("auth/register", {
      method: "POST",
      anonymous: true,
      body: { ...values, password: String(form.get("password") ?? "") },
    });
    await openSession(res.token, res.organization.id);
  } catch (e) {
    if (e instanceof ApiError && e.status === 422) return { fields: fieldErrors(e), values };
    if (e instanceof ApiError) return { error: e.message, values };
    return { error: "Inscription impossible pour le moment. Vérifiez que l'API est démarrée ou activez le mode mock.", values };
  }
  redirect("/");
}

export async function logout() {
  try {
    await api("auth/logout", { method: "POST", allowUnauthorized: true });
  } catch {
    // Jeton déjà invalide : on nettoie quand même la session locale.
  }
  const jar = await cookies();
  jar.delete(TOKEN_COOKIE);
  jar.delete(ORG_COOKIE);
  redirect("/connexion");
}

export async function switchOrganization(orgId: number) {
  await api(`organizations/${orgId}/switch`, { method: "POST" });
  (await cookies()).set(ORG_COOKIE, String(orgId), SESSION_COOKIE_OPTIONS);
  redirect("/");
}
