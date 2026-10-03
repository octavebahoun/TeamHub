"use server";

import { redirect } from "next/navigation";
import { api, ApiError } from "@/lib/api/client";
import type { FormState } from "@/lib/actions/session";

const fieldErrors = (e: ApiError) => Object.fromEntries(Object.entries(e.errors).map(([k, v]) => [k, v[0]]));

export async function requestPasswordReset(_: FormState, form: FormData): Promise<FormState> {
  const values = { email: String(form.get("email") ?? "") };
  try {
    await api("auth/forgot-password", { method: "POST", anonymous: true, body: values });
  } catch (e) {
    if (e instanceof ApiError && e.status === 429) return { error: "Trop de tentatives. Réessayez dans une minute.", values };
    if (e instanceof ApiError && e.status === 422) return { fields: fieldErrors(e), values };
    if (e instanceof ApiError) return { error: e.message, values };
    throw e;
  }
  return { ok: true, values };
}

export async function resetPassword(_: FormState, form: FormData): Promise<FormState> {
  const values = {
    email: String(form.get("email") ?? ""),
    token: String(form.get("token") ?? ""),
  };
  try {
    await api("auth/reset-password", {
      method: "POST",
      anonymous: true,
      body: {
        ...values,
        password: String(form.get("password") ?? ""),
        password_confirmation: String(form.get("password_confirmation") ?? ""),
      },
    });
  } catch (e) {
    if (e instanceof ApiError && e.status === 429) return { error: "Trop de tentatives. Réessayez dans une minute.", values };
    if (e instanceof ApiError && e.status === 422) return { fields: fieldErrors(e), values };
    if (e instanceof ApiError) return { error: e.message, values };
    throw e;
  }
  redirect("/connexion?reset=1");
}
