import { Skeleton } from "@/components/ui/skeleton";

/** Squelette affiché pendant le chargement d'un écran. */
export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl" aria-busy aria-label="Chargement">
      <Skeleton className="mb-3 h-10 w-64" />
      <Skeleton className="mb-10 h-5 w-96" />
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-52 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
