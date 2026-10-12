"use client";

import { useCallback, useEffect, useState } from "react";
import { loadInbox, markInboxAllRead, markInboxRead } from "@/lib/actions/inbox";
import type { BellItem } from "@/lib/api/wine-contract";

export function useNotifications() {
  const [notifications, setNotifications] = useState<BellItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setNotifications(await loadInbox());
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
      await markInboxRead(id);
      await refresh();
    },
    [refresh]
  );

  const markAllRead = useCallback(async () => {
    await markInboxAllRead();
    await refresh();
  }, [refresh]);

  return { notifications, loading, error, refresh, markAsRead, markAllRead };
}
