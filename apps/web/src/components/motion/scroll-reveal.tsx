"use client";

import { useEffect } from "react";

function isInViewport(el: HTMLElement): boolean {
  const rect = el.getBoundingClientRect();
  const vh = window.innerHeight || document.documentElement.clientHeight;
  return rect.top < vh * 0.92 && rect.bottom > 0;
}

/**
 * Observe tous les `[data-reveal]` et ajoute `.is-inview` au scroll.
 * Monté une seule fois (layout) — tous les écrans en profitent.
 */
export function ScrollReveal() {
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const nodes = () => Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));

    const reveal = (el: HTMLElement) => {
      if (!el.classList.contains("is-inview")) el.classList.add("is-inview");
    };

    if (reduce) {
      nodes().forEach(reveal);
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          reveal(entry.target as HTMLElement);
          io.unobserve(entry.target);
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.12 }
    );

    const observeAll = () => {
      nodes().forEach((el) => {
        if (el.classList.contains("is-inview")) return;
        if (isInViewport(el)) {
          reveal(el);
          return;
        }
        io.observe(el);
      });
    };

    observeAll();

    // Pages / listes dynamiques (RSC, client nav)
    const mo = new MutationObserver(() => observeAll());
    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      io.disconnect();
      mo.disconnect();
    };
  }, []);

  return null;
}
