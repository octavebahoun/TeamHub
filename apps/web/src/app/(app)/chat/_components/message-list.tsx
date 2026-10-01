"use client";

import { useEffect, useRef } from "react";
import { isSameDay } from "date-fns";
import type { ChatMessage } from "@/lib/api/types";
import { shortDate, time, toDate } from "@/lib/format";
import { UserAvatar } from "@/components/common/user-avatar";

const dayLabel = (d: Date) => (isSameDay(d, new Date()) ? "Aujourd'hui" : isSameDay(d, new Date(Date.now() - 86_400_000)) ? "Hier" : shortDate(d.toISOString()));
const size = (bytes: number) => (bytes > 1_000_000 ? `${(bytes / 1_048_576).toFixed(1)} Mo` : `${Math.round(bytes / 1024)} Ko`);

/** Fil de messages ; annoncé aux lecteurs d'écran (role=log, aria-live). */
export function MessageList({ messages, meId, nameOf, typingNames }: { messages: ChatMessage[]; meId: number; nameOf: (id: number) => string; typingNames: string[] }) {
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => {
    end.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  return (
    <div role="log" aria-live="polite" aria-label="Messages" tabIndex={0} className="flex-1 space-y-6 overflow-y-auto px-6 py-6 sm:px-8">
      {messages.map((m, i) => {
        const d = toDate(m.created_at)!;
        const prev = messages[i - 1];
        const newDay = !prev || !isSameDay(toDate(prev.created_at)!, d);
        const mine = m.sender_id === meId;
        const read = m.read_by.some((r) => r.user_id !== meId);
        return (
          <div key={m._id}>
            {newDay && (
              <p className="relative my-2 text-center text-sm text-muted-foreground before:absolute before:top-1/2 before:left-0 before:h-px before:w-full before:bg-border">
                <span className="relative bg-background px-4">{dayLabel(d)}</span>
              </p>
            )}
            {mine ? (
              <div className="ml-auto max-w-[75%] text-right">
                <p className="mb-1.5 text-xs text-muted-foreground">
                  {time(m.created_at)}
                  {read && " · Lu"}
                </p>
                <p className="inline-block rounded-2xl rounded-br-md bg-primary px-5 py-3 text-left text-primary-foreground">{m.body}</p>
              </div>
            ) : (
              <div className="flex max-w-[80%] gap-3.5">
                <UserAvatar name={nameOf(m.sender_id)} decorative />
                <div>
                  <p className="mb-1.5 text-sm">
                    <span className="font-semibold">{nameOf(m.sender_id)}</span> <span className="text-muted-foreground">{time(m.created_at)}</span>
                  </p>
                  {m.body && <p className="inline-block rounded-2xl rounded-tl-md bg-secondary px-5 py-3">{m.body}</p>}
                  {m.attachments.map((a) => (
                    <p key={a.path} className="mt-2 flex w-72 items-center gap-3 rounded-xl border px-4 py-3">
                      <span aria-hidden className="rounded-md bg-brand-soft px-2 py-2 text-xs font-bold text-brand-soft-foreground">
                        {a.name.split(".").pop()?.toUpperCase()}
                      </span>
                      <span className="leading-tight">
                        <span className="block font-semibold">{a.name}</span>
                        <span className="text-xs text-muted-foreground">{size(a.size)}</span>
                      </span>
                    </p>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
      {typingNames.length > 0 && (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <span aria-hidden className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <span key={i} className="size-1.5 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: `${i * 120}ms` }} />
            ))}
          </span>
          {typingNames.join(", ")} écrit…
        </p>
      )}
      <div ref={end} />
    </div>
  );
}
