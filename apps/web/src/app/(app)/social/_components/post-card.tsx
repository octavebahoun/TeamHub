"use client";

import { useOptimistic, useState, useTransition } from "react";
import { Heart, MessageSquare, Pin, Trophy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Panel } from "@/components/common/panel";
import { UserAvatar } from "@/components/common/user-avatar";
import { addPostComment, loadComments, toggleBravo, togglePin } from "@/lib/actions/social";
import type { Post, PostComment } from "@/lib/api/types";
import { ago, plural } from "@/lib/format";
import { ROLE } from "@/lib/labels";
import { cn } from "@/lib/utils";

export function PostCard({ post, canPin, canComment }: { post: Post; canPin: boolean; canComment: boolean }) {
  const [bravo, setBravo] = useOptimistic({ reacted: !!post.reacted, count: post.reactions_count ?? 0 });
  const [comments, setComments] = useState<PostComment[] | null>(null);
  const [draft, setDraft] = useState("");
  const [pending, start] = useTransition();
  const commentCount = comments?.length ?? post.comments_count ?? 0;

  const react = () =>
    start(async () => {
      setBravo({ reacted: !bravo.reacted, count: bravo.count + (bravo.reacted ? -1 : 1) });
      await toggleBravo(post.id, bravo.reacted);
    });
  const toggleComments = () =>
    start(async () => {
      setComments(comments ? null : await loadComments(post.id));
    });
  const send = (e: React.FormEvent) => {
    e.preventDefault();
    const body = draft.trim();
    if (!body) return;
    start(async () => {
      const res = await addPostComment(post.id, body);
      if (res.error || !res.comment) return void toast.error(res.error ?? "Commentaire non publié");
      setComments((c) => [...(c ?? []), res.comment!]);
      setDraft("");
    });
  };

  return (
    <Panel as="article" className="p-6" aria-labelledby={`post-${post.id}-author`}>
      {post.pinned && (
        <p className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-brand-soft-foreground">
          <Pin aria-hidden className="size-4" /> Annonce épinglée
        </p>
      )}
      <header className="flex items-center gap-3.5">
        <UserAvatar name={post.author?.name ?? "?"} decorative />
        <div className="leading-tight">
          <p id={`post-${post.id}-author`} className="font-semibold">{post.author?.name}</p>
          <p className="text-sm text-muted-foreground">
            {post.author?.role ? `${ROLE[post.author.role].label} · ` : ""}
            {ago(post.created_at)}
          </p>
        </div>
        {canPin && (
          <Button variant="ghost" size="sm" className="ml-auto" onClick={() => start(() => togglePin(post.id, !post.pinned))} disabled={pending}>
            {post.pinned ? "Désépingler" : "Épingler"}
          </Button>
        )}
      </header>
      {post.kind === "project_delivered" && (
        <div className="mt-5 flex items-center gap-5 rounded-xl bg-primary px-6 py-5 text-primary-foreground">
          <Trophy aria-hidden className="size-9" strokeWidth={1.5} />
          <div>
            <p className="text-sm font-semibold tracking-[0.14em]">PROJET LIVRÉ</p>
            <p className="font-heading text-[26px] leading-tight">{post.meta?.project}</p>
          </div>
        </div>
      )}
      <p className="mt-4 leading-relaxed whitespace-pre-line">{post.body}</p>
      <footer className="mt-5 flex flex-wrap gap-3 border-t pt-4">
        <Button variant="outline" className={cn("rounded-full", bravo.reacted && "border-primary bg-brand-soft text-brand-soft-foreground hover:bg-brand-soft")} aria-pressed={bravo.reacted} onClick={react}>
          <Heart aria-hidden className={cn(bravo.reacted && "fill-primary text-primary")} /> Bravo · {bravo.count}
        </Button>
        <Button variant="outline" className="rounded-full" aria-expanded={comments !== null} onClick={toggleComments}>
          <MessageSquare aria-hidden /> {plural(commentCount, "commentaire", "commentaires")}
        </Button>
      </footer>
      {comments && (
        <div className="mt-4 space-y-4">
          <ul className="space-y-3">
            {comments.map((c) => (
              <li key={c.id} className="flex gap-3">
                <UserAvatar name={c.author?.name ?? "?"} size="sm" decorative />
                <p className="rounded-2xl bg-secondary px-4 py-2.5">
                  <span className="font-semibold">{c.author?.name}</span> {c.body}
                </p>
              </li>
            ))}
          </ul>
          {canComment && (
            <form onSubmit={send} className="flex gap-2">
              <label htmlFor={`c-${post.id}`} className="sr-only">Commenter</label>
              <Input id={`c-${post.id}`} value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Écrire un commentaire…" />
              <Button type="submit" disabled={pending || !draft.trim()}>Envoyer</Button>
            </form>
          )}
        </div>
      )}
    </Panel>
  );
}
