import { USE_MOCKS } from "@/lib/data/mode";
import { mockNotifications } from "@/lib/data/mocks/notifications";
import type { Notification } from "@/lib/data/types";

const apiBase = () => (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api").replace(/\/$/, "");

let mockStore: Notification[] | null = null;

function mockList(): Notification[] {
  if (!mockStore) mockStore = structuredClone(mockNotifications);
  return mockStore;
}

async function v1<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${apiBase()}/v1/${path.replace(/^\//, "")}`, {
    credentials: "include",
    headers: { Accept: "application/json", ...(init?.body ? { "Content-Type": "application/json" } : {}) },
    ...init,
  });
  if (!res.ok) {
    const data = (await res.json().catch(() => null)) as { message?: string } | null;
    throw new Error(data?.message ?? `Erreur ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export async function listNotifications(): Promise<Notification[]> {
  if (USE_MOCKS) return mockList().map((n) => ({ ...n }));
  return v1<Notification[]>("notifications");
}

export async function markAsRead(id: string): Promise<void> {
  if (USE_MOCKS) {
    mockStore = mockList().map((n) => (n.id === id ? { ...n, read: true } : n));
    return;
  }
  await v1(`notifications/${encodeURIComponent(id)}/read`, { method: "POST" });
}

export async function markAllRead(): Promise<void> {
  if (USE_MOCKS) {
    mockStore = mockList().map((n) => ({ ...n, read: true }));
    return;
  }
  await v1("notifications/read-all", { method: "POST" });
}
