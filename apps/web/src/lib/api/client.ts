import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ORG_COOKIE, TOKEN_COOKIE } from "@/lib/session";

/**
 * Client HTTP de l'API Laravel, utilisable uniquement côté serveur.
 * Le jeton Sanctum vit dans un cookie httpOnly (jamais exposé au JS du
 * navigateur) ; l'organisation active part dans l'en-tête X-Organization-Id.
 */

const API_URL = (process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api").replace(/\/$/, "");

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public errors: Record<string, string[]> = {}
  ) {
    super(message);
  }

  /** Premier message d'erreur d'un champ (validation 422). */
  field(name: string): string | undefined {
    return this.errors[name]?.[0];
  }
}

type Options = {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined | null>;
  /** Sans jeton (inscription, connexion, aperçu d'invitation). */
  anonymous?: boolean;
  /** Ne pas rediriger vers /connexion sur 401 (ex. vérification de session). */
  allowUnauthorized?: boolean;
};

export async function api<T>(path: string, { method = "GET", body, query, anonymous, allowUnauthorized }: Options = {}): Promise<T> {
  const jar = await cookies();
  const token = jar.get(TOKEN_COOKIE)?.value;
  const org = jar.get(ORG_COOKIE)?.value;

  const url = new URL(`${API_URL}/v1/${path.replace(/^\//, "")}`);
  for (const [k, v] of Object.entries(query ?? {})) {
    if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, String(v));
  }

  const headers: Record<string, string> = { Accept: "application/json" };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (!anonymous && token) headers.Authorization = `Bearer ${token}`;
  if (!anonymous && org) headers["X-Organization-Id"] = org;

  const res = await fetch(url, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store",
  });

  if (res.status === 401 && !anonymous && !allowUnauthorized) redirect("/deconnexion");

  const data = res.status === 204 ? null : await res.json().catch(() => null);
  if (!res.ok) {
    throw new ApiError(res.status, data?.message ?? `Erreur ${res.status}`, data?.errors ?? {});
  }
  return data as T;
}

/** Comme `api`, mais renvoie `fallback` si l'endpoint n'existe pas encore (404/405). */
export async function apiOptional<T>(path: string, fallback: T, options?: Options): Promise<T> {
  try {
    return await api<T>(path, options);
  } catch (e) {
    if (e instanceof ApiError && (e.status === 404 || e.status === 405)) return fallback;
    throw e;
  }
}

/** Récupère toutes les pages d'une liste paginée Laravel (bornée pour rester raisonnable). */
export async function apiAll<T>(path: string, query: Options["query"] = {}, maxPages = 10): Promise<T[]> {
  const items: T[] = [];
  for (let page = 1; page <= maxPages; page++) {
    const res = await api<{ data: T[]; last_page: number }>(path, { query: { ...query, page } });
    items.push(...res.data);
    if (page >= res.last_page) break;
  }
  return items;
}
