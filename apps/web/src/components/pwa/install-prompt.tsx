"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";

type BeforeInstallPromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };

type InstallCtx = {
  canInstall: boolean;
  promptInstall: () => Promise<void>;
};

const Ctx = createContext<InstallCtx>({ canInstall: false, promptInstall: async () => {} });

export function usePwaInstall() {
  return useContext(Ctx);
}

export function InstallPromptProvider({ children }: { children: React.ReactNode }) {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    return () => window.removeEventListener("beforeinstallprompt", onBeforeInstall);
  }, []);

  const promptInstall = useCallback(async () => {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
    setDismissed(true);
  }, [deferred]);

  const value = useMemo(
    () => ({ canInstall: !!deferred, promptInstall }),
    [deferred, promptInstall]
  );

  const showBanner = deferred && !dismissed;

  return (
    <Ctx.Provider value={value}>
      {children}
      {showBanner && (
        <div
          role="dialog"
          aria-labelledby="pwa-install-title"
          className="fixed inset-x-4 bottom-24 z-50 mx-auto max-w-lg rounded-2xl border bg-background p-4 shadow-lg sm:bottom-6"
        >
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand-soft-foreground">
              <Download aria-hidden className="size-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p id="pwa-install-title" className="font-semibold">
                Installer WINE
              </p>
              <p className="mt-1 text-sm text-muted-foreground">Accédez à vos projets et au chat depuis l&apos;écran d&apos;accueil.</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button type="button" size="sm" onClick={() => void promptInstall()}>
                  Installer
                </Button>
                <Button type="button" size="sm" variant="ghost" onClick={() => setDismissed(true)}>
                  Plus tard
                </Button>
              </div>
            </div>
            <Button type="button" variant="ghost" size="icon-sm" aria-label="Fermer" onClick={() => setDismissed(true)}>
              <X aria-hidden />
            </Button>
          </div>
        </div>
      )}
    </Ctx.Provider>
  );
}

/** Bouton compact pour la barre latérale. */
export function SidebarInstallButton() {
  const { canInstall, promptInstall } = usePwaInstall();
  if (!canInstall) return null;
  return (
    <Button type="button" variant="outline" className="w-full justify-start gap-2" onClick={() => void promptInstall()}>
      <Download aria-hidden className="size-4" />
      Installer l&apos;application
    </Button>
  );
}
