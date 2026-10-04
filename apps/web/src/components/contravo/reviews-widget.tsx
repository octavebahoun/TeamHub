"use client";

import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import { Panel, PanelTitle } from "@/components/common/panel";
import { contravoBrowser } from "@/lib/contravo/browser";
import type { Review } from "@/lib/contravo/types";
import { shortDate } from "@/lib/format";

export function ReviewsWidget({ limit = 3 }: { limit?: number }) {
  const [reviews, setReviews] = useState<Review[]>([]);

  useEffect(() => {
    contravoBrowser.listReviews().then((rows) => setReviews(rows.slice(0, limit))).catch(() => setReviews([]));
  }, [limit]);

  if (reviews.length === 0) return null;

  return (
    <Panel className="p-7">
      <PanelTitle className="mb-4">Avis clients Contravo</PanelTitle>
      <ul className="space-y-4">
        {reviews.map((r) => (
          <li key={r.id} className="rounded-lg border p-4">
            <div className="mb-2 flex items-center gap-1 text-brand">
              {Array.from({ length: r.rating }).map((_, i) => (
                <Star key={i} aria-hidden className="size-4 fill-current" />
              ))}
              <span className="sr-only">{r.rating} sur 5</span>
            </div>
            <p className="text-sm leading-relaxed">{r.comment ?? "Sans commentaire."}</p>
            <p className="mt-2 text-xs text-muted-foreground">
              {r.submittedByName} · {shortDate(r.submittedAt)}
            </p>
          </li>
        ))}
      </ul>
    </Panel>
  );
}
