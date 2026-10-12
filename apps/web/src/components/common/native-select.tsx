import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Liste déroulante native stylée : accessible au clavier et aux lecteurs d'écran
 * sans JavaScript, et soumise avec les formulaires (server actions).
 */
export function NativeSelect({ className, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className={cn("relative", className)}>
      <select
        className="h-10 w-full appearance-none rounded-md border bg-background pr-9 pl-3 text-[15px] aria-invalid:border-destructive disabled:opacity-60"
        {...props}
      >
        {children}
      </select>
      <ChevronDown aria-hidden className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2" />
    </div>
  );
}
