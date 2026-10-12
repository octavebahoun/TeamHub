"use client";

import { useState, useTransition } from "react";
import { Bell } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { updateOpportunity } from "@/lib/actions/crm";
import { dueLabel } from "@/lib/format";
import type { Opportunity } from "@/lib/api/types";

/** Relance due (aujourd'hui ou en retard) : la marquer faite ou la reporter. */
export function FollowUpBanner({ opportunity: o, contact }: { opportunity: Opportunity; contact: string }) {
  const [pending, start] = useTransition();
  const [date, setDate] = useState("");
  const when = dueLabel(o.next_follow_up);
  const patch = (next_follow_up: string | null, message: string) =>
    start(async () => {
      const res = await updateOpportunity(o.id, o.client_id, { next_follow_up });
      if (res.error) toast.error(res.error);
      else toast.success(message);
    });
  return (
    <section aria-label="Relance" className="mb-8 flex flex-wrap items-center gap-4 rounded-xl bg-primary px-6 py-5 text-primary-foreground">
      <Bell aria-hidden className="size-6" strokeWidth={1.75} />
      <div className="flex-1">
        <p className="text-[17px] font-semibold">Relance prévue {when === "Aujourd'hui" ? "aujourd'hui" : `(${when.toLowerCase()})`}</p>
        <p>
          {o.notes ?? `Relancer ${contact} au sujet de « ${o.title} »`}.
        </p>
      </div>
      <Button variant="outline" className="border-transparent bg-background text-brand-soft-foreground hover:bg-background/90" disabled={pending} onClick={() => patch(null, "Relance marquée comme faite")}>
        Marquer comme faite
      </Button>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="border-primary-foreground bg-transparent text-primary-foreground hover:bg-primary-hover hover:text-primary-foreground">
            Reporter
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-72 space-y-3">
          <Label htmlFor="snooze">Nouvelle date de relance</Label>
          <Input id="snooze" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          <Button className="w-full" disabled={!date || pending} onClick={() => patch(date, `Relance reportée au ${dueLabel(date).toLowerCase()}`)}>
            Reporter
          </Button>
        </PopoverContent>
      </Popover>
    </section>
  );
}
