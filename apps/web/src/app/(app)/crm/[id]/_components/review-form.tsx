"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Panel, PanelTitle } from "@/components/common/panel";
import { addReview } from "@/lib/actions/desk";

export function ReviewForm({ clientId }: { clientId: number }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [pending, setPending] = useState(false);

  return (
    <Panel className="p-7">
      <PanelTitle className="mb-3">Avis client</PanelTitle>
      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          setPending(true);
          void addReview(clientId, rating, comment).then((res) => {
            setPending(false);
            if (res.error) toast.error(res.error);
            else {
              setComment("");
              toast.success(rating === 5 ? "Avis 5/5 mis en avant." : "Avis enregistré.");
            }
          });
        }}
      >
        <label className="block text-sm">
          Note
          <select className="mt-1 h-11 w-full rounded-lg border bg-background px-3" value={rating} onChange={(e) => setRating(Number(e.target.value))}>
            {[5, 4, 3, 2, 1].map((n) => (
              <option key={n} value={n}>{n} / 5</option>
            ))}
          </select>
        </label>
        <Textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={3} placeholder="Ce que le client a dit…" />
        <Button type="submit" disabled={pending}>{pending ? "Enregistrement…" : "Enregistrer l'avis"}</Button>
      </form>
    </Panel>
  );
}
