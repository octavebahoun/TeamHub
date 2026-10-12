"use client";

import { useCallback, useEffect, useState } from "react";
import { listNotifications, markAllRead as markAllReadApi, markAsRead as markAsReadApi } from "@/lib/api/notifications";
import type { Notification } from "@/lib/data/types";

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setNotifications(await listNotifications());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Impossible de charger les notifications.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const markAsRead = useCallback(
    async (id: string) => {
      await markAsReadApi(id);
      await refresh();
    },
    [refresh]
  );

  const markAllRead = useCallback(async () => {
    await markAllReadApi();
    await refresh();
  }, [refresh]);

  return { notifications, loading, error, refresh, markAsRead, markAllRead };
}
