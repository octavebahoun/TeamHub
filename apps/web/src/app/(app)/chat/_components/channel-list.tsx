"use client";

import { Hash } from "lucide-react";
import type { Channel } from "@/lib/api/types";
import { cn } from "@/lib/utils";
import { UserAvatar } from "@/components/common/user-avatar";
import { NewDirectDialog } from "./new-direct-dialog";

type Props = {
  channels: Channel[];
  activeId?: string;
  onSelect: (id: string) => void;
  online: Set<number>;
  meId: number;
  people: { id: number; name: string }[];
  onOpenDirect: (userId: number) => void;
};

const Unread = ({ n }: { n?: number }) =>
  n ? (
    <span className="ml-auto inline-flex size-6 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
      {n}
      <span className="sr-only"> non lus</span>
    </span>
  ) : null;

export function ChannelList({ channels, activeId, onSelect, online, meId, people, onOpenDirect }: Props) {
  const item = (active: boolean) =>
    cn("flex h-11 w-full items-center gap-2.5 rounded-lg px-3 text-left text-[15px]", active ? "border bg-background font-semibold shadow-xs" : "hover:bg-background/70");
  const projectChannels = channels.filter((c) => c.type === "project");
  const directs = channels.filter((c) => c.type === "direct");
  return (
    <nav aria-label="Conversations" className="flex max-h-64 flex-col overflow-y-auto border-r border-b bg-muted px-3 py-6 md:h-full md:max-h-none md:border-b-0">
      <div className="mb-6 flex items-center justify-between px-2">
        <h1 className="font-heading text-[30px] leading-none">Chat</h1>
        <NewDirectDialog people={people.filter((p) => p.id !== meId)} onPick={onOpenDirect} />
      </div>
      <div className="overflow-y-auto">
        <h2 className="mb-2 px-3 text-[13px] font-semibold tracking-[0.12em] text-muted-foreground uppercase">Canaux projet</h2>
        <ul className="mb-7 space-y-1">
          {projectChannels.map((c) => (
            <li key={c.id}>
              <button type="button" className={item(c.id === activeId)} aria-current={c.id === activeId ? "true" : undefined} onClick={() => onSelect(c.id)}>
                <Hash aria-hidden className={cn("size-4", c.id === activeId ? "text-primary" : "text-muted-foreground")} />
                {c.name}
                <Unread n={c.unread_count} />
              </button>
            </li>
          ))}
        </ul>
        <h2 className="mb-2 px-3 text-[13px] font-semibold tracking-[0.12em] text-muted-foreground uppercase">Messages privés</h2>
        <ul className="space-y-1">
          {directs.map((c) => {
            const other = c.member_ids.find((id) => id !== meId);
            const isOnline = other !== undefined && online.has(other);
            return (
              <li key={c.id}>
                <button type="button" className={item(c.id === activeId)} aria-current={c.id === activeId ? "true" : undefined} onClick={() => onSelect(c.id)}>
                  <span className="relative">
                    <UserAvatar name={c.name} size="sm" decorative />
                    {isOnline && <span className="absolute -right-0.5 -bottom-0.5 size-3 rounded-full bg-success ring-2 ring-muted" />}
                  </span>
                  <span className="truncate">{c.name}</span>
                  {isOnline && <span className="sr-only">(en ligne)</span>}
                  <Unread n={c.unread_count} />
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
