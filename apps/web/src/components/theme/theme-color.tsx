"use client";

import { useEffect } from "react";
import { useTheme } from "next-themes";

/** Met à jour theme-color du navigateur selon le thème actif. */
export function ThemeColor() {
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    const color = resolvedTheme === "light" ? "#f6f5f1" : "#0b0d12";
    let meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "theme-color");
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", color);
    document.documentElement.style.colorScheme = resolvedTheme === "light" ? "light" : "dark";
  }, [resolvedTheme]);

  return null;
}
