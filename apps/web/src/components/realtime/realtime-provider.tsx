"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { io, type Socket } from "socket.io-client";

export type AppNotification = { id: string; type: string; payload: Record<string, unknown>; at: string; read: boolean };

type Realtime = {
  socket: Socket | null;
  connected: boolean;
  online: Set<number>;
  notifications: AppNotification[];
  markAllRead: () => void;
};

const Ctx = createContext<Realtime>({ socket: null, connected: false, online: new Set(), notifications: [], markAllRead: () => {} });

export const useRealtime = () => useContext(Ctx);

/**
 * Connexion Socket.io unique pour toute l'application (chat, présence, notifications).
 * Le serveur temps réel vérifie le jeton auprès de l'API à la connexion.
 */
export function RealtimeProvider({ url, token, organizationId, children }: { url?: string; token?: string; organizationId?: number; children: React.ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [online, setOnline] = useState<Set<number>>(new Set());
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  useEffect(() => {
    if (!url || !token) return;
    const s = io(url, { auth: { token, organization_id: organizationId }, transports: ["websocket", "polling"], reconnectionDelayMax: 10_000 });
    setSocket(s);
    s.on("connect", () => setConnected(true));
    s.on("disconnect", () => setConnected(false));
    s.on("presence:update", ({ user_id, online: isOnline }: { user_id: number; online: boolean }) =>
      setOnline((prev) => {
        const next = new Set(prev);
        if (isOnline) next.add(user_id);
        else next.delete(user_id);
        return next;
      })
    );
    s.on("notification:new", (n: { type: string; payload: Record<string, unknown>; at: string }) =>
      setNotifications((prev) => [{ ...n, id: `${n.at}-${prev.length}`, read: false }, ...prev].slice(0, 30))
    );
    return () => {
      s.close();
    };
  }, [url, token, organizationId]);

  const value = useMemo(
    () => ({ socket, connected, online, notifications, markAllRead: () => setNotifications((p) => p.map((n) => ({ ...n, read: true }))) }),
    [socket, connected, online, notifications]
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
