"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { UserAvatar } from "@/components/common/user-avatar";

export function NewDirectDialog({ people, onPick }: { people: { id: number; name: string }[]; onPick: (id: number) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" aria-label="Nouveau message privé">
          <Plus aria-hidden />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading text-2xl font-normal">Nouveau message</DialogTitle>
          <DialogDescription>Choisissez la personne à qui écrire.</DialogDescription>
        </DialogHeader>
        <ul className="max-h-80 space-y-1 overflow-y-auto">
          {people.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left hover:bg-muted"
                onClick={() => {
                  onPick(p.id);
                  setOpen(false);
                }}
              >
                <UserAvatar name={p.name} size="sm" decorative />
                {p.name}
              </button>
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
