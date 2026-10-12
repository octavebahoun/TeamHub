"use client";

import { useEffect, useRef, useState } from "react";
import { BellRing, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "wine-push-prompt-dismissed";

/**
 * Demande l'autorisation de notifications push de façon contextuelle
 * (après interaction utilisateur, jamais au premier chargement).
 */
export function PushPrompt() {
  const [visible, setVisible] = useState(false);
  const armed = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("Notification" in window) || Notification.permission !== "default") return;
    if (localStorage.getItem(STORAGE_KEY)) return;

    const arm = () => {
      if (armed.current) return;
      armed.current = true;
      window.setTimeout(() => setVisible(true), 800);
    };

    window.addEventListener("pointerdown", arm, { once: true });
    window.addEventListener("keydown", arm, { once: true });
    return () => {
      window.removeEventListener("pointerdown", arm);
      window.removeEventListener("keydown", arm);
    };
  }, []);

  if (!visible) return null;

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, "1");
    setVisible(false);
  };

  const enable = async () => {
    try {
      await Notification.requestPermission();
    } finally {
      dismiss();
    }
  };

  return (
    <div
      role="dialog"
      aria-labelledby="push-prompt-title"
      className="fixed top-20 right-4 z-50 w-[min(100%-2rem,22rem)] rounded-xl border bg-background p-4 shadow-lg"
    >
      <div className="flex items-start gap-3">
        <BellRing aria-hidden className="mt-0.5 size-5 text-primary" />
        <div className="min-w-0 flex-1">
          <p id="push-prompt-title" className="font-semibold">
            Activer les alertes ?
          </p>
          <p className="mt-1 text-sm text-muted-foreground">Recevez les rappels de tâches et les messages importants même lorsque WINE est en arrière-plan.</p>
          <div className="mt-3 flex gap-2">
            <Button type="button" size="sm" onClick={() => void enable()}>
              Autoriser
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={dismiss}>
              Non merci
            </Button>
          </div>
        </div>
        <Button type="button" variant="ghost" size="icon-sm" aria-label="Fermer" onClick={dismiss}>
          <X aria-hidden />
        </Button>
      </div>
    </div>
  );
}
