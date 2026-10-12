import "server-only";
import { ContravoError } from "./types";

export const CONTRAVO_BASE = (process.env.CONTRAVO_API_URL ?? "https://contravo.excellenceteam.site/api/v1").replace(/\/$/, "");

export function useContravoMocks(): boolean {
  return process.env.NEXT_PUBLIC_USE_MOCKS === "true";
}

type FetchOptions = {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined | null>;
  /** Ne pas parser le JSON (PDF redirect, binaire). */
  raw?: boolean;
  /** Suivre les redirections (défaut false pour lire Location). */
  redirect?: RequestRedirect;
};

function buildUrl(path: string, query?: FetchOptions["query"]): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  const url = new URL(`${CONTRAVO_BASE}${p}`);
  for (const [k, v] of Object.entries(query ?? {})) {
    if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, String(v));
  }
  return url.toString();
}

async function parseError(res: Response): Promise<string> {
  const data = await res.json().catch(() => null);
  if (data?.error?.message) return data.error.message;
  if (data?.message) return data.message;
  return res.statusText || "Erreur inconnue";
}

export async function contravoFetch<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const key = process.env.CONTRAVO_API_KEY;
  if (!key && !useContravoMocks()) {
    throw new ContravoError(503, "CONTRAVO_API_KEY manquante côté serveur.");
  }

  const url = buildUrl(path, options.query);
  const headers: Record<string, string> = { Accept: "application/json" };
  if (options.body !== undefined) headers["Content-Type"] = "application/json";
  if (key) headers.Authorization = `Bearer ${key}`;

  let lastErr: unknown;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(url, {
        method: options.method ?? "GET",
        headers,
        body: options.body === undefined ? undefined : JSON.stringify(options.body),
        cache: "no-store",
        redirect: options.redirect ?? "follow",
      });

      if (res.status === 429 && attempt < 2) {
        await new Promise((r) => setTimeout(r, 400 * (attempt + 1)));
        continue;
      }

      if (options.raw) {
        if (!res.ok) throw new ContravoError(res.status, await parseError(res));
        return res as unknown as T;
      }

      if (res.status === 204) return undefined as T;

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        const msg = data?.error?.message ?? data?.message ?? res.statusText ?? "Erreur inconnue";
        throw new ContravoError(res.status, msg);
      }
      return data as T;
    } catch (e) {
      lastErr = e;
      if (e instanceof ContravoError && e.status !== 429) throw e;
      if (attempt === 2) break;
      await new Promise((r) => setTimeout(r, 300 * (attempt + 1)));
    }
  }
  throw lastErr instanceof Error ? lastErr : new ContravoError(500, "Appel Contravo impossible.");
}

/** GET avec redirection manuelle — renvoie l'URL Location (PDF, téléchargement). */
export async function contravoFetchRedirectUrl(path: string): Promise<string> {
  const key = process.env.CONTRAVO_API_KEY;
  if (!key && !useContravoMocks()) throw new ContravoError(503, "CONTRAVO_API_KEY manquante côté serveur.");

  const url = buildUrl(path);
  const res = await fetch(url, {
    headers: { Accept: "application/json", ...(key ? { Authorization: `Bearer ${key}` } : {}) },
    redirect: "manual",
    cache: "no-store",
  });

  if (res.status >= 300 && res.status < 400) {
    const loc = res.headers.get("Location");
    if (loc) return loc;
  }
  if (!res.ok) throw new ContravoError(res.status, await parseError(res));
  const data = await res.json().catch(() => null);
  if (data?.url) return data.url as string;
  throw new ContravoError(res.status, "URL de téléchargement introuvable.");
}
