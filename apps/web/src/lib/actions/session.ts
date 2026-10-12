"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { api, ApiError } from "@/lib/api/client";
import type { Organization, User } from "@/lib/api/types";
import { ORG_COOKIE, SESSION_COOKIE_OPTIONS, TOKEN_COOKIE } from "@/lib/session";
import { localizeFieldErrors, localizeMessage } from "@/lib/validation/fr";

export type FormState =
  | {
      ok?: boolean;
      error?: string;
      notice?: string;
      warning?: string;
      fields?: Record<string, string>;
      values?: Record<string, string>;
    }
  | undefined;

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

function registerFieldErrors(form: FormData): Record<string, string> | null {
  const fields: Record<string, string> = {};
  const name = String(form.get("name") ?? "").trim();
  const email = String(form.get("email") ?? "").trim();
  const password = String(form.get("password") ?? "");
  const organizationName = String(form.get("organization_name") ?? "").trim();

  if (!name) fields.name = "Indiquez votre nom complet.";
  if (!email) fields.email = "Indiquez votre adresse email.";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fields.email = "Cette adresse email est invalide.";
  if (!password) fields.password = "Choisissez un mot de passe.";
  else if (password.length < 8) fields.password = "Le mot de passe doit contenir au moins 8 caractères.";
  if (!organizationName) fields.organization_name = "Indiquez le nom de votre organisation.";

  return Object.keys(fields).length ? fields : null;
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
      const banner = localized.email ?? localized.password ?? localizeMessage(e.message);
      return {
        error: banner,
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
  const required = registerFieldErrors(form);
  if (required) return { fields: required, values };
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
