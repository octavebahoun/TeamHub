"use server";

import { revalidatePath } from "next/cache";
import { api, ApiError } from "@/lib/api/client";
import type { Post, PostComment } from "@/lib/api/types";
import type { FormState } from "./session";

export async function createPost(_: FormState, form: FormData): Promise<FormState> {
  const body = String(form.get("body") ?? "").trim();
  if (!body) return { fields: { body: "Écrivez quelque chose avant de publier." } };
  try {
    const post = await api<Post>("posts", { method: "POST", body: { body } });
    if (form.get("pinned") === "on") await api(`posts/${post.id}/pin`, { method: "POST", body: { pinned: true } });
  } catch (e) {
    if (e instanceof ApiError) return { error: e.status === 403 ? "Les invités ne peuvent pas publier." : e.message };
    throw e;
  }
  revalidatePath("/social");
  return { ok: true };
}

export async function toggleBravo(postId: number, reacted: boolean) {
  await api(reacted ? `posts/${postId}/reactions/bravo` : `posts/${postId}/reactions`, {
    method: reacted ? "DELETE" : "POST",
    body: reacted ? undefined : { emoji: "bravo" },
  });
  revalidatePath("/social");
}

export async function loadComments(postId: number): Promise<PostComment[]> {
  return (await api<Post>(`posts/${postId}`)).comments ?? [];
}

export async function addPostComment(postId: number, body: string): Promise<{ comment?: PostComment; error?: string }> {
  try {
    const comment = await api<PostComment>(`posts/${postId}/comments`, { method: "POST", body: { body } });
    revalidatePath("/social");
    return { comment };
  } catch (e) {
    if (e instanceof ApiError) return { error: e.message };
    throw e;
  }
}

export async function togglePin(postId: number, pinned: boolean) {
  await api(`posts/${postId}/pin`, { method: "POST", body: { pinned } });
  revalidatePath("/social");
}

export async function deletePost(postId: number) {
  await api(`posts/${postId}`, { method: "DELETE" });
  revalidatePath("/social");
}
