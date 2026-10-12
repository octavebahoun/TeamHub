"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export function RegisterSW() {
  const [waiting, setWaiting] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    let mounted = true;

    navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => {
        if (!mounted) return;
        if (reg.waiting) setWaiting(reg.waiting);

        reg.addEventListener("updatefound", () => {
          const worker = reg.installing;
          if (!worker) return;
          worker.addEventListener("statechange", () => {
            if (worker.state === "installed" && navigator.serviceWorker.controller) {
              setWaiting(worker);
            }
          });
        });
      })
      .catch(() => {});

    const onMessage = (event: MessageEvent) => {
      if (event.data?.type === "SW_UPDATED") setWaiting(null);
    };
    navigator.serviceWorker.addEventListener("message", onMessage);

    return () => {
      mounted = false;
      navigator.serviceWorker.removeEventListener("message", onMessage);
    };
  }, []);

  if (!waiting) return null;

  const refresh = () => {
    waiting.postMessage({ type: "SKIP_WAITING" });
    window.location.reload();
  };

  return (
    <div
      role="status"
      className="fixed inset-x-0 bottom-20 z-50 mx-auto flex max-w-md items-center justify-between gap-3 rounded-xl border bg-background px-4 py-3 shadow-lg sm:bottom-6"
    >
      <p className="text-sm font-medium">Nouvelle version disponible</p>
      <Button type="button" size="sm" onClick={refresh}>
        Actualiser
      </Button>
    </div>
  );
}
