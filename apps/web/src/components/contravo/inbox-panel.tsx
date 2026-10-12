"use client";

import { useEffect, useState } from "react";
import { MessageCircle, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Panel, PanelTitle } from "@/components/common/panel";
import { ToneBadge } from "@/components/common/tone-badge";
import { contravoBrowser } from "@/lib/contravo/browser";
import type { ConversationSummary, ConversationThread } from "@/lib/contravo/types";
import { ago } from "@/lib/format";
import { cn } from "@/lib/utils";

export function InboxPanel({ contravoClientId }: { contravoClientId?: string }) {
  const [threads, setThreads] = useState<ConversationSummary[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [thread, setThread] = useState<ConversationThread | null>(null);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    contravoBrowser
      .listConversations(contravoClientId ? { clientId: contravoClientId } : undefined)
      .then(setThreads)
      .catch(() => toast.error("Boîte de réception indisponible."));
  }, [contravoClientId]);

  useEffect(() => {
    if (!activeId) {
      setThread(null);
      return;
    }
    contravoBrowser.getConversation(activeId).then(setThread).catch(() => toast.error("Conversation introuvable."));
  }, [activeId]);

  async function sendReply() {
    if (!activeId || !reply.trim()) return;
    setSending(true);
    try {
      const res = await contravoBrowser.sendMessage(activeId, reply.trim());
      setThread((t) => (t ? { ...t, messages: [...t.messages, res.message], iaActive: res.iaActive } : t));
      setReply("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Envoi impossible.");
    } finally {
      setSending(false);
    }
  }

  return (
    <Panel className="flex flex-col overflow-hidden p-0">
      <div className="border-b p-5">
        <PanelTitle className="flex items-center gap-2">
          <MessageCircle aria-hidden className="size-5" /> Inbox WhatsApp / Telegram
        </PanelTitle>
      </div>
      <div className="grid min-h-[320px] grid-cols-1 md:grid-cols-[220px_minmax(0,1fr)]">
        <ul className="border-b md:border-r md:border-b-0">
          {threads.map((t) => (
            <li key={t.id}>
              <button
                type="button"
                className={cn("w-full px-4 py-3 text-left hover:bg-muted/60", activeId === t.id && "bg-muted")}
                onClick={() => setActiveId(t.id)}
              >
                <p className="font-medium">{t.displayName}</p>
                <p className="text-xs text-muted-foreground">{t.channel === "whatsapp" ? "WhatsApp" : "Telegram"} · {t.identifierLabel}</p>
              </button>
            </li>
          ))}
          {threads.length === 0 && <p className="p-4 text-sm text-muted-foreground">Aucune conversation.</p>}
        </ul>
        <div className="flex min-h-[280px] flex-col">
          {thread ? (
            <>
              <div className="flex items-center justify-between border-b px-4 py-2 text-sm">
                <span>{thread.displayName}</span>
                <ToneBadge tone={thread.iaActive ? "success" : "neutral"}>{thread.iaActive ? "IA active" : "IA off"}</ToneBadge>
              </div>
              <ul className="flex-1 space-y-3 overflow-y-auto p-4">
                {thread.messages.map((m) => (
                  <li key={m.id} className={cn("max-w-[85%] rounded-xl px-3 py-2 text-sm", m.sender === "client" ? "bg-muted" : "ml-auto bg-brand-soft text-brand-soft-foreground")}>
                    <p className="text-[11px] opacity-70">{m.sender === "client" ? "Client" : m.sender === "ia" ? "Assistant" : "Vous"} · {ago(m.createdAt)}</p>
                    <p>{m.content}</p>
                  </li>
                ))}
              </ul>
              <div className="flex gap-2 border-t p-3">
                <Input value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Répondre au client…" onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), void sendReply())} />
                <Button type="button" size="icon" disabled={sending} aria-label="Envoyer" onClick={() => void sendReply()}>
                  <Send aria-hidden className="size-4" />
                </Button>
              </div>
            </>
          ) : (
            <p className="flex flex-1 items-center justify-center text-sm text-muted-foreground">Sélectionnez une conversation.</p>
          )}
        </div>
      </div>
    </Panel>
  );
}
