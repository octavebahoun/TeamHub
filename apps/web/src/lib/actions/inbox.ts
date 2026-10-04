"use server";

import { api, ApiError } from "@/lib/api/client";
import { mapInboxList, MARK_ALL_NOTIFICATIONS_PATH, type BellItem, type InboxListResponse } from "@/lib/api/wine-contract";
import { mockNotifications } from "@/lib/data/mocks/notifications";
import { USE_MOCKS } from "@/lib/data/mode";

function fail(e: unknown): never {
  if (e instanceof ApiError) throw new Error(e.message);
  throw e;
}

/** GET /api/v1/notifications — cloche persistée. */
export async function loadInbox(): Promise<BellItem[]> {
  if (USE_MOCKS) {
    return mockNotifications.map((n) => ({
      id: n.id,
      type: n.kind,
      title: n.title,
      body: n.body,
      href: n.href,
      read: n.read,
      at: n.created_at,
    }));
  }
  try {
    const payload = await api<InboxListResponse>("notifications");
    return mapInboxList(payload);
  } catch (e) {
    fail(e);
  }
}

/** POST /api/v1/notifications/read */
export async function markInboxAllRead(): Promise<void> {
  if (USE_MOCKS) return;
  try {
    await api(MARK_ALL_NOTIFICATIONS_PATH, { method: "POST" });
  } catch (e) {
    fail(e);
  }
}

/** POST /api/v1/notifications/{id}/read */
export async function markInboxRead(id: string): Promise<void> {
  if (USE_MOCKS) return;
  try {
    await api(`notifications/${encodeURIComponent(id)}/read`, { method: "POST" });
  } catch (e) {
    fail(e);
  }
}
