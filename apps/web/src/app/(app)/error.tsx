"use client";

import { Button } from "@/components/ui/button";

/** Erreur inattendue dans un écran (API injoignable, réponse invalide…). */
export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const isDev = process.env.NODE_ENV === "development";
  return (
    <div role="alert" className="mx-auto max-w-xl py-16 text-center">
      <h1 className="font-heading text-[36px]">Un souci est survenu</h1>
      <p className="mt-3 text-muted-foreground">
        Le serveur n&apos;a pas répondu comme prévu. Réessayez dans un instant.
        {error.digest && <span className="mt-2 block text-sm">Référence : {error.digest}</span>}
      </p>
      {isDev && error.message && (
        <pre className="mt-4 overflow-x-auto rounded-lg border bg-muted p-3 text-left text-xs text-danger">{error.message}</pre>
      )}
      <Button className="mt-8" size="lg" onClick={reset}>
        Réessayer
      </Button>
    </div>
  );
}
