import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { USE_MOCKS } from "@/lib/data/mode";
import { ORG_COOKIE, TOKEN_COOKIE } from "@/lib/session";
import { ApiError } from "./errors";
import { resolveMock } from "./mock-router";

export { ApiError };

/**
 * Client HTTP de l'API Laravel, utilisable uniquement côté serveur.
 * Le jeton Sanctum vit dans un cookie httpOnly (jamais exposé au JS du
 * navigateur) ; l'organisation active part dans l'en-tête X-Organization-Id.
 *
 * Si NEXT_PUBLIC_USE_MOCKS=true, aucune requête réseau : réponses via mock-router.
 */

const API_URL = (process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api").replace(/\/$/, "");

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
  if (USE_MOCKS) {
    return resolveMock<T>(path, { method, body, query, anonymous });
  }

  const jar = await cookies();
  const token = jar.get(TOKEN_COOKIE)?.value;
  const org = jar.get(ORG_COOKIE)?.value;

  const url = new URL(`${API_URL}/v1/${path.replace(/^\//, "")}`);
  for (const [k, v] of Object.entries(query ?? {})) {
    if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, String(v));
  }

  const isForm = typeof FormData !== "undefined" && body instanceof FormData;
  const headers: Record<string, string> = { Accept: "application/json" };
  if (body !== undefined && !isForm) headers["Content-Type"] = "application/json";
  if (!anonymous && token) headers.Authorization = `Bearer ${token}`;
  if (!anonymous && org) headers["X-Organization-Id"] = org;

  let res: Response;
  try {
    res = await fetch(url, {
      method,
      headers,
      body: body === undefined ? undefined : isForm ? body : JSON.stringify(body),
      cache: "no-store",
    });
  } catch {
    throw new ApiError(
      503,
      "API indisponible (connexion refusée). Démarrez Laravel sur le port 8000, ou activez NEXT_PUBLIC_USE_MOCKS=true dans .env.local."
    );
  }

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
    if (e instanceof ApiError && (e.status === 404 || e.status === 405 || e.status === 503)) return fallback;
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
