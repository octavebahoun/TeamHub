"use server";

import { revalidatePath } from "next/cache";
import { api, ApiError } from "@/lib/api/client";
import type { Role } from "@/lib/api/types";

export async function updateMemberRole(userId: number, role: Role): Promise<{ error?: string }> {
  try {
    await api(`members/${userId}`, { method: "PATCH", body: { role } });
  } catch (e) {
    if (e instanceof ApiError) return { error: e.message };
    throw e;
  }
  revalidatePath("/parametres/membres");
  return {};
}

export async function removeMember(userId: number): Promise<{ error?: string }> {
  try {
    await api(`members/${userId}`, { method: "DELETE" });
  } catch (e) {
    if (e instanceof ApiError) return { error: e.message };
    throw e;
  }
  revalidatePath("/parametres/membres");
  return {};
}
