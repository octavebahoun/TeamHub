"use client";

import { useEffect } from "react";

/**
 * Observe tous les `[data-reveal]` et ajoute `.is-inview` au scroll.
 * Monté une seule fois (layout) — tous les écrans en profitent.
 */
export function ScrollReveal() {
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const nodes = () => Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));

    if (reduce) {
      nodes().forEach((el) => el.classList.add("is-inview"));
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add("is-inview");
          io.unobserve(entry.target);
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.12 }
    );

    const observeAll = () => {
      nodes().forEach((el) => {
        if (!el.classList.contains("is-inview")) io.observe(el);
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
