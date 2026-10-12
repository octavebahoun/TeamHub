import { USE_MOCKS } from "@/lib/data/mode";

const apiBase = () => (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api").replace(/\/$/, "");

export type PasswordResetResult = { ok: true };

/** Demande de lien de réinitialisation (réponse neutre en mode mock). */
export async function forgotPassword(email: string): Promise<PasswordResetResult> {
  if (USE_MOCKS) {
    void email;
    return { ok: true };
  }
  const res = await fetch(`${apiBase()}/v1/auth/forgot-password`, {
    method: "POST",
    credentials: "include",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) {
    const data = (await res.json().catch(() => null)) as { message?: string } | null;
    throw new Error(data?.message ?? `Erreur ${res.status}`);
  }
  return { ok: true };
}

export type ResetPasswordInput = {
  email: string;
  token: string;
  password: string;
  password_confirmation: string;
};

/** Réinitialisation du mot de passe (succès neutre en mode mock). */
export async function resetPassword(input: ResetPasswordInput): Promise<PasswordResetResult> {
  if (USE_MOCKS) {
    void input;
    return { ok: true };
  }
  const res = await fetch(`${apiBase()}/v1/auth/reset-password`, {
    method: "POST",
    credentials: "include",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const data = (await res.json().catch(() => null)) as { message?: string } | null;
    throw new Error(data?.message ?? `Erreur ${res.status}`);
  }
  return { ok: true };
}
