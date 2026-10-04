"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { MockRealtimeSocket } from "./mock-socket";

export type ConnectionStatus = "online" | "reconnecting" | "offline";

export type AppNotification = { id: string; type: string; payload: Record<string, unknown>; at: string; read: boolean };

type Realtime = {
  socket: Socket | MockRealtimeSocket | null;
  connected: boolean;
  connectionStatus: ConnectionStatus;
  online: Set<number>;
  notifications: AppNotification[];
  markAllRead: () => void;
};

const Ctx = createContext<Realtime>({
  socket: null,
  connected: false,
  connectionStatus: "offline",
  online: new Set(),
  notifications: [],
  markAllRead: () => {},
});

export const useRealtime = () => useContext(Ctx);

const USE_MOCKS = process.env.NEXT_PUBLIC_USE_MOCKS === "true";

/**
 * Connexion Socket.io unique pour toute l'application (chat, présence, notifications).
 * Le jeton n'est jamais exposé au JS : le navigateur envoie le cookie httpOnly
 * au handshake (même domaine) et le serveur temps réel le vérifie auprès de l'API.
 */
export function RealtimeProvider({ url, organizationId, children }: { url?: string; organizationId?: number; children: React.ReactNode }) {
  const [socket, setSocket] = useState<Socket | MockRealtimeSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("offline");
  const [online, setOnline] = useState<Set<number>>(new Set());
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  useEffect(() => {
    if (!organizationId) return;

    if (USE_MOCKS) {
      const mock = new MockRealtimeSocket(organizationId);
      setSocket(mock);
      setConnected(true);
      setConnectionStatus("online");
      setOnline(new Set([2]));

      const onPresence = ({ user_id, online: isOnline }: { user_id: number; online: boolean }) =>
        setOnline((prev) => {
          const next = new Set(prev);
          if (isOnline) next.add(user_id);
          else next.delete(user_id);
          return next;
        });
      const onNotification = (n: { type: string; payload: Record<string, unknown>; at: string }) =>
        setNotifications((prev) => [{ ...n, id: `${n.at}-${prev.length}`, read: false }, ...prev].slice(0, 30));

      mock.on("presence:update", onPresence as (...args: unknown[]) => void);
      mock.on("notification:new", onNotification as (...args: unknown[]) => void);

      return () => {
        mock.off("presence:update", onPresence as (...args: unknown[]) => void);
        mock.off("notification:new", onNotification as (...args: unknown[]) => void);
        mock.close();
        setSocket(null);
        setConnected(false);
        setConnectionStatus("offline");
      };
    }

    if (!url) return;

    const s = io(url, {
      auth: { organization_id: organizationId },
      withCredentials: true,
      transports: ["websocket", "polling"],
      reconnectionDelayMax: 10_000,
    });

    s.on("connect", () => {
      setSocket(s);
      setConnected(true);
      setConnectionStatus("online");
    });
    s.on("disconnect", () => {
      setConnected(false);
      setConnectionStatus("offline");
    });
    s.on("reconnect_attempt", () => setConnectionStatus("reconnecting"));
    s.on("reconnect", () => setConnectionStatus("online"));
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
      setSocket(null);
      setConnected(false);
      setConnectionStatus("offline");
    };
  }, [url, organizationId]);

  const value = useMemo(
    () => ({
      socket,
      connected,
      connectionStatus,
      online,
      notifications,
      markAllRead: () => setNotifications((p) => p.map((n) => ({ ...n, read: true }))),
    }),
    [socket, connected, connectionStatus, online, notifications]
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
