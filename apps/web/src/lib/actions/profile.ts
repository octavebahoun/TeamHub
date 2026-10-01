"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { api, ApiError } from "@/lib/api/client";
import type { NotificationPrefs } from "@/lib/api/types";
import { ORG_COOKIE, TOKEN_COOKIE } from "@/lib/session";
import type { FormState } from "./session";

const fields = (e: ApiError) => Object.fromEntries(Object.entries(e.errors).map(([k, v]) => [k, v[0]]));
const unavailable = "Cette fonction n'est pas encore disponible sur le serveur.";

export async function updateProfile(_: FormState, form: FormData): Promise<FormState> {
  try {
    await api("me", {
      method: "PATCH",
      body: { name: form.get("name"), title: form.get("title") || null, email: form.get("email"), phone: form.get("phone") || null },
    });
  } catch (e) {
    if (e instanceof ApiError && e.status === 422) return { fields: fields(e) };
    if (e instanceof ApiError) return { error: e.status === 404 || e.status === 405 ? unavailable : e.message };
    throw e;
  }
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function changePassword(_: FormState, form: FormData): Promise<FormState> {
  try {
    await api("me/password", { method: "PUT", body: { current_password: form.get("current_password"), password: form.get("password") } });
  } catch (e) {
    if (e instanceof ApiError && e.status === 422) return { fields: fields(e) };
    if (e instanceof ApiError) return { error: e.status === 404 || e.status === 405 ? unavailable : e.message };
    throw e;
  }
  return { ok: true };
}

export async function saveNotificationPrefs(prefs: NotificationPrefs): Promise<{ error?: string }> {
  try {
    await api("me/notifications", { method: "PUT", body: prefs });
    return {};
  } catch (e) {
    if (e instanceof ApiError) return { error: e.status === 404 || e.status === 405 ? unavailable : e.message };
    throw e;
  }
}

export async function deleteAccount(): Promise<{ error?: string }> {
  try {
    await api("me", { method: "DELETE" });
  } catch (e) {
    if (e instanceof ApiError) return { error: e.status === 404 || e.status === 405 ? unavailable : e.message };
    throw e;
  }
  const jar = await cookies();
  jar.delete(TOKEN_COOKIE);
  jar.delete(ORG_COOKIE);
  redirect("/connexion");
}
