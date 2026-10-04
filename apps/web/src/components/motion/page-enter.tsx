"use client";

import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

/** Entrée douce à chaque navigation (clé = pathname). */
export function PageEnter({ children, className }: { children: React.ReactNode; className?: string }) {
  const pathname = usePathname();
  return (
    <div key={pathname} className={cn("page-enter flex min-h-full w-full flex-col", className)}>
      {children}
    </div>
  );
}
