"use client";

import Link from "next/link";
import { Hash } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { ConnectionBadge } from "@/components/common/connection-badge";
import { EmptyState } from "@/components/common/empty-state";
import { useRealtime } from "@/components/realtime/realtime-provider";
import { plural } from "@/lib/format";
import { ChannelList } from "./channel-list";
import { Composer } from "./composer";
import { MessageList } from "./message-list";
import { useChat } from "./use-chat";

type Props = {
  meId: number;
  people: { id: number; name: string }[];
  projects: { id: number; name: string }[];
  initialChannel?: string;
  initialProjectId?: number;
};

export function ChatApp({ meId, people, projects, initialChannel, initialProjectId }: Props) {
  const chat = useChat(initialChannel, initialProjectId);
  const { online, connectionStatus } = useRealtime();
  const nameOf = (id: number) => people.find((p) => p.id === id)?.name ?? "Membre";
  const active = chat.active;
  const project = projects.find((p) => p.id === active?.project_id);

  const mocks = process.env.NEXT_PUBLIC_USE_MOCKS === "true";

  if (!mocks && !process.env.NEXT_PUBLIC_WS_URL) {
    return (
      <EmptyState title="Chat indisponible" className="m-8">
        Le chat n&apos;est pas disponible pour le moment.
      </EmptyState>
    );
  }
  if (!chat.available) {
    return <p className="m-8 text-muted-foreground">Connexion au chat…</p>;
  }

  return (
    <div className="grid h-full min-h-0 min-w-0 grid-rows-[auto_minmax(0,1fr)] md:grid-cols-[minmax(0,272px)_minmax(0,1fr)] md:grid-rows-1">
      <ChannelList
        channels={chat.channels ?? []}
        activeId={active?.id}
        onSelect={chat.setActiveId}
        online={online}
        meId={meId}
        people={people}
        onOpenDirect={chat.openDirect}
      />
      <section aria-label={active ? `Conversation ${active.name}` : "Conversation"} className="flex min-h-0 flex-col">
        {active ? (
          <>
            <header className="flex flex-wrap items-center justify-between gap-4 border-b px-4 py-4 sm:px-8">
              <div className="min-w-0">
                <h2 className="flex min-w-0 items-center gap-1 font-sans text-[20px] font-semibold">
                  {active.type === "project" && <Hash aria-hidden className="size-5 text-primary" />}
                  {active.name}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {project ? `Projet ${project.name} · ` : ""}
                  {plural(active.member_ids.length, "membre", "membres")} · {active.member_ids.filter((id) => online.has(id) || id === meId).length} en ligne
                </p>
              </div>
              <div className="flex items-center gap-3">
                <ConnectionBadge status={connectionStatus} compact />
                {project && (
                  <Link href={`/projets/${project.id}`} className={buttonVariants({ variant: "outline" })}>
                    Voir le projet
                  </Link>
                )}
              </div>
            </header>
            <MessageList
              messages={chat.messages}
              meId={meId}
              nameOf={nameOf}
              typingNames={chat.typingUserIds.filter((id) => id !== meId).map((id) => nameOf(id).split(" ")[0])}
            />
            <Composer
              channelName={active.name}
              onSend={chat.send}
              onTyping={chat.notifyTyping}
              onSendAttachment={chat.sendAttachment}
              onSendVoice={async (blob, mime) => {
                const ext = mime.includes("mp4") ? "mp4" : "webm";
                const file = new File([blob], `vocal.${ext}`, { type: mime || "audio/webm" });
                return chat.sendAttachment(file);
              }}
            />
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center p-8 text-muted-foreground">
            {chat.error ?? (chat.connected ? "Choisissez une conversation." : "Connexion au chat…")}
          </div>
        )}
      </section>
    </div>
  );
}
