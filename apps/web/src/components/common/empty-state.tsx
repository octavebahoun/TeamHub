import { cn } from "@/lib/utils";

export function EmptyState({ title, children, className }: { title: string; children?: React.ReactNode; className?: string }) {
  return (
    <div
      data-reveal
      className={cn(
        "reveal rounded-2xl border border-dashed bg-muted/80 px-6 py-12 text-center backdrop-blur-sm",
        className
      )}
    >
      <div
        aria-hidden
        className="mx-auto mb-4 flex size-12 items-center justify-center rounded-2xl bg-brand-soft text-brand-soft-foreground"
      >
        <span className="font-heading text-lg">W</span>
      </div>
      <p className="font-medium">{title}</p>
      {children && <div className="mx-auto mt-1.5 max-w-md text-sm text-muted-foreground">{children}</div>}
    </div>
  );
}
