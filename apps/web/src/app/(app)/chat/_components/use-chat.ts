"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRealtime } from "@/components/realtime/realtime-provider";
import type { Channel, ChatMessage } from "@/lib/api/types";

type Ack<T> = { ok: boolean; error?: string } & T;

/**
 * État du chat au-dessus de la socket partagée : liste des canaux, historique du
 * canal actif, réception en direct et indicateur « … écrit ».
 * Les événements channel:list / channel:history / channel:direct sont des
 * extensions du service realtime (cf. docs/api-gaps.md).
 */
export function useChat(initialChannel?: string, initialProjectId?: number) {
  const { socket, connected } = useRealtime();
  const [channels, setChannels] = useState<Channel[] | null>(null);
  const [activeId, setActiveId] = useState<string | undefined>(initialChannel);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [typing, setTyping] = useState<Record<number, number>>({});
  const [error, setError] = useState<string | null>(null);
  const activeRef = useRef(activeId);
  useEffect(() => {
    activeRef.current = activeId;
  }, [activeId]);

  /** Change de conversation : vide le fil et remet son compteur de non-lus à zéro. */
  const select = useCallback((id: string) => {
    setMessages([]);
    setActiveId(id);
    setChannels((list) => list?.map((c) => (c.id === id ? { ...c, unread_count: 0 } : c)) ?? null);
  }, []);

  // Liste des canaux à la connexion.
  useEffect(() => {
    if (!socket || !connected) return;
    socket.timeout(5000).emit("channel:list", (err: Error | null, res?: Ack<{ channels: Channel[] }>) => {
      if (err || !res?.ok) return setError("La liste des canaux n'est pas disponible sur ce serveur.");
      const first = initialChannel ?? res.channels.find((c) => c.project_id === initialProjectId)?.id ?? res.channels[0]?.id;
      setChannels(res.channels.map((c) => (c.id === first ? { ...c, unread_count: 0 } : c)));
      setActiveId((cur) => cur ?? first);
    });
  }, [socket, connected, initialChannel, initialProjectId]);

  // Historique + abonnement au canal actif.
  useEffect(() => {
    if (!socket || !connected || !activeId) return;
    socket.emit("channel:join", activeId, () => {});
    socket.timeout(5000).emit("channel:history", { channel_id: activeId }, (err: Error | null, res?: Ack<{ messages: ChatMessage[] }>) => {
      if (!err && res?.ok) setMessages(res.messages);
    });
  }, [socket, connected, activeId]);

  // Messages et frappe en direct.
  useEffect(() => {
    if (!socket) return;
    const onMessage = (m: ChatMessage) => {
      if (m.channel_id === activeRef.current) setMessages((list) => (list.some((x) => x._id === m._id) ? list : [...list, m]));
      else setChannels((list) => list?.map((c) => (c.id === m.channel_id ? { ...c, unread_count: (c.unread_count ?? 0) + 1 } : c)) ?? null);
    };
    const onTyping = ({ channel_id, user_id }: { channel_id: string; user_id: number }) => {
      if (channel_id === activeRef.current) setTyping((t) => ({ ...t, [user_id]: Date.now() }));
    };
    socket.on("message:new", onMessage);
    socket.on("typing", onTyping);
    return () => {
      socket.off("message:new", onMessage);
      socket.off("typing", onTyping);
    };
  }, [socket]);

  // Purge des indicateurs de frappe périmés.
  useEffect(() => {
    const id = setInterval(() => setTyping((t) => Object.fromEntries(Object.entries(t).filter(([, at]) => Date.now() - at < 3000))), 1000);
    return () => clearInterval(id);
  }, []);

  const send = useCallback(
    (body: string) =>
      new Promise<boolean>((resolve) => {
        if (!socket || !activeId) return resolve(false);
        socket.timeout(5000).emit("message:send", { channel_id: activeId, body }, (err: Error | null, res?: Ack<{ id: string }>) => resolve(!err && !!res?.ok));
      }),
    [socket, activeId]
  );

  const notifyTyping = useCallback(() => activeId && socket?.emit("typing", { channel_id: activeId }), [socket, activeId]);

  const openDirect = useCallback(
    (userId: number) =>
      socket?.timeout(5000).emit("channel:direct", { user_id: userId }, (err: Error | null, res?: Ack<{ channel: Channel }>) => {
        if (err || !res?.ok) return;
        setChannels((list) => (list?.some((c) => c.id === res.channel.id) ? list : [...(list ?? []), res.channel]));
        select(res.channel.id);
      }),
    [socket, select]
  );

  return {
    connected,
    available: !!socket,
    channels,
    active: channels?.find((c) => c.id === activeId),
    setActiveId: select,
    messages,
    typingUserIds: Object.keys(typing).map(Number),
    send,
    notifyTyping,
    openDirect,
    error,
  };
}
