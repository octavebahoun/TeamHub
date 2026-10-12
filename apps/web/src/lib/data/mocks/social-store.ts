import type { Post, PostComment } from "@/lib/api/types";
import { sortSocialFeed } from "@/lib/domain";
import { MOCK_ORG_ID } from "./clients";
import { mockPosts as seedPosts } from "./social";
import { mockUser } from "./session";

/** Store mutable en mémoire pour le mode mock (publications, réactions, commentaires). */
let posts: Post[] = structuredClone(seedPosts);
let nextPostId = Math.max(...posts.map((p) => p.id), 500) + 1;
let nextCommentId = 9000;

export function listMockPosts(): Post[] {
  return sortSocialFeed(posts).map((p) => structuredClone(p));
}

export function getMockPost(id: number): Post | undefined {
  const post = posts.find((p) => p.id === id);
  return post ? structuredClone(post) : undefined;
}

export function createMockPost(body: string, pinned = false): Post {
  const now = new Date().toISOString();
  const post: Post = {
    id: nextPostId++,
    organization_id: MOCK_ORG_ID,
    author_id: mockUser.id,
    body: body.trim(),
    pinned,
    pinned_at: pinned ? now : null,
    created_at: now,
    author: { id: mockUser.id, name: mockUser.name, role: "owner" },
    reactions_count: 0,
    comments_count: 0,
    reacted: false,
    comments: [],
    reactions: [],
  };
  posts = [post, ...posts];
  return structuredClone(post);
}

export function pinMockPost(id: number, pinned: boolean): Post {
  const post = posts.find((p) => p.id === id);
  if (!post) throw new Error("not_found");
  post.pinned = pinned;
  post.pinned_at = pinned ? new Date().toISOString() : null;
  return structuredClone(post);
}

export function deleteMockPost(id: number): void {
  posts = posts.filter((p) => p.id !== id);
}

export function setMockBravo(id: number, react: boolean): Post {
  const post = posts.find((p) => p.id === id);
  if (!post) throw new Error("not_found");
  const was = !!post.reacted;
  if (react && !was) {
    post.reacted = true;
    post.reactions_count = (post.reactions_count ?? 0) + 1;
  } else if (!react && was) {
    post.reacted = false;
    post.reactions_count = Math.max(0, (post.reactions_count ?? 0) - 1);
  }
  return structuredClone(post);
}

export function addMockComment(postId: number, body: string): PostComment {
  const post = posts.find((p) => p.id === postId);
  if (!post) throw new Error("not_found");
  const comment: PostComment = {
    id: nextCommentId++,
    post_id: postId,
    author_id: mockUser.id,
    body: body.trim(),
    created_at: new Date().toISOString(),
    author: { id: mockUser.id, name: mockUser.name },
  };
  post.comments = [...(post.comments ?? []), comment];
  post.comments_count = (post.comments_count ?? 0) + 1;
  return structuredClone(comment);
}
