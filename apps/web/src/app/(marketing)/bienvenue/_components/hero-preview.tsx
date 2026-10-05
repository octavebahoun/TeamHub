"use client";

import { useEffect, useRef, useState } from "react";
import { Play } from "lucide-react";

/**
 * Vidéo produit landing — lecture forcée (muted) car l’autoplay React
 * échoue souvent, et un parent avec filter:blur bloque le décodage.
 */
export function HeroPreview() {
  const ref = useRef<HTMLVideoElement>(null);
  const [needsGesture, setNeedsGesture] = useState(false);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;

    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    video.setAttribute("muted", "");
    video.setAttribute("playsinline", "");

    const tryPlay = () => {
      const p = video.play();
      if (p) {
        p.then(() => setNeedsGesture(false)).catch(() => setNeedsGesture(true));
      }
    };

    tryPlay();
    video.addEventListener("loadeddata", tryPlay);
    video.addEventListener("canplay", tryPlay);

    return () => {
      video.removeEventListener("loadeddata", tryPlay);
      video.removeEventListener("canplay", tryPlay);
    };
  }, []);

  return (
    <div className="relative mx-auto w-full max-w-lg min-w-0 lg:max-w-none">
      <div
        aria-hidden
        className="absolute -inset-6 rounded-[2.25rem] bg-gradient-to-br from-primary/40 via-primary/10 to-info/15 blur-3xl max-sm:hidden"
      />
      <div className="relative overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-primary via-primary to-primary-hover p-[1px] shadow-[0_40px_90px_-32px_var(--primary)] sm:rounded-[2rem]">
        <div className="relative overflow-hidden rounded-[calc(1.75rem-1px)] bg-card sm:rounded-[calc(2rem-1px)]">
          <video
            ref={ref}
            className="aspect-video h-auto w-full bg-muted object-cover object-top"
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            poster="/videos/wine-product-demo-poster.jpg"
            controls={needsGesture}
            aria-label="Vidéo de démonstration WINE : accueil, tâches, chat, CRM, analytics et facturation MoMo"
          >
            {/* MP4 en premier : plus fiable que WebM selon les navigateurs */}
            <source src="/videos/wine-product-demo.mp4" type="video/mp4" />
            <source src="/videos/wine-product-demo.webm" type="video/webm" />
          </video>

          {needsGesture ? (
            <button
              type="button"
              className="absolute inset-0 z-10 flex items-center justify-center bg-background/35 backdrop-blur-[1px]"
              aria-label="Lancer la démo vidéo"
              onClick={() => {
                const video = ref.current;
                if (!video) return;
                video.muted = true;
                void video.play().then(() => setNeedsGesture(false));
              }}
            >
              <span className="inline-flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg">
                <Play className="size-6 fill-current" aria-hidden />
              </span>
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
