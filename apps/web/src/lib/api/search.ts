import { mapWineSearch, type WineSearchPayload } from "@/lib/api/wine-contract";
import { USE_MOCKS } from "@/lib/data/mode";
import { mockClients } from "@/lib/data/mocks/clients";
import { mockProjects } from "@/lib/data/mocks/projects";
import { mockQuotes } from "@/lib/data/mocks/quotes";
import { mockTasks } from "@/lib/data/mocks/tasks";
import type { SearchResults } from "@/lib/data/types";

const apiBase = () => (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api").replace(/\/$/, "");

const includes = (haystack: string | null | undefined, needle: string) =>
  (haystack ?? "").toLowerCase().includes(needle);

export function mockSearch(q: string): SearchResults {
  const needle = q.trim().toLowerCase();
  if (!needle) {
    return { query: q, projects: [], tasks: [], clients: [], quotes: [] };
  }
  const projectById = new Map(mockProjects.map((p) => [p.id, p]));
  return {
    query: q.trim(),
    projects: mockProjects
      .filter((p) => !p.archived_at && (includes(p.name, needle) || includes(p.description, needle) || includes(p.client?.company, needle)))
      .map((p) => ({
        id: p.id,
        name: p.name,
        status: p.status,
        client_name: p.client?.company ?? p.client?.name ?? null,
      })),
    tasks: mockTasks
      .filter((t) => includes(t.title, needle) || includes(t.description, needle))
      .map((t) => {
        const project = projectById.get(t.project_id);
        return {
          id: t.id,
          title: t.title,
          status: t.status,
          project_id: t.project_id,
          project_name: project?.name ?? "Projet",
        };
      }),
    clients: mockClients
      .filter((c) => includes(c.name, needle) || includes(c.company, needle) || includes(c.email, needle))
      .map((c) => ({
        id: c.id,
        name: c.name,
        company: c.company,
        city: c.address?.split(",").pop()?.trim() ?? null,
      })),
    quotes: mockQuotes
      .filter((qu) => includes(qu.number, needle) || includes(qu.title, needle))
      .map((qu) => ({ id: qu.id, number: qu.number, title: qu.title, amount_xof: qu.amount_xof })),
  };
}

export async function search(q: string): Promise<SearchResults> {
  const trimmed = q.trim();
  if (USE_MOCKS) return mockSearch(trimmed);
  const url = new URL(`${apiBase()}/v1/search`);
  url.searchParams.set("q", trimmed);
  const res = await fetch(url, { credentials: "include", headers: { Accept: "application/json" } });
  if (!res.ok) {
    const data = (await res.json().catch(() => null)) as { message?: string } | null;
    throw new Error(data?.message ?? `Erreur ${res.status}`);
  }
  return mapWineSearch((await res.json()) as WineSearchPayload);
}
