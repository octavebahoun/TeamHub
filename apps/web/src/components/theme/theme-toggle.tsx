"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const isDark = mounted && resolvedTheme === "dark";

  return (
    <Button
      variant="outline"
      size="icon"
      className={cn(
        "size-9 rounded-xl border-border/70 bg-background/60 backdrop-blur-sm transition-colors hover:bg-muted hover:text-foreground",
        className
      )}
      aria-label={mounted ? (isDark ? "Activer le mode clair" : "Activer le mode sombre") : "Changer le thème"}
      title={mounted ? (isDark ? "Mode clair" : "Mode sombre") : undefined}
      onClick={() => {
        if (!mounted) return;
        setTheme(isDark ? "light" : "dark");
      }}
    >
      {isDark ? <Sun aria-hidden className="size-4" /> : <Moon aria-hidden className="size-4" />}
    </Button>
  );
}
