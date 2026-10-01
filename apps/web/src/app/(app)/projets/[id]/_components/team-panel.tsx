"use client";

import { useState, useTransition } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/common/native-select";
import { Panel, PanelTitle } from "@/components/common/panel";
import { UserAvatar } from "@/components/common/user-avatar";
import { addProjectMember, removeProjectMember } from "@/lib/actions/projects";

type Person = { id: number; name: string; detail: string };

/** Équipe du projet ; l'ajout/retrait est réservé aux admins et au responsable. */
export function TeamPanel({ projectId, ownerId, team, candidates, canManage }: { projectId: number; ownerId: number; team: Person[]; candidates: { id: number; name: string }[]; canManage: boolean }) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [pick, setPick] = useState<string>("");

  const add = () =>
    start(async () => {
      const res = await addProjectMember(projectId, Number(pick));
      if (res.error) return void toast.error(res.error);
      setOpen(false);
      toast.success("Membre ajouté au projet");
    });

  return (
    <Panel className="p-7">
      <div className="mb-5 flex items-center justify-between">
        <PanelTitle>Équipe</PanelTitle>
        {canManage && candidates.length > 0 && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">Ajouter</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="font-heading text-2xl font-normal">Ajouter à l&apos;équipe</DialogTitle>
                <DialogDescription>La personne aura accès au projet et à son canal.</DialogDescription>
              </DialogHeader>
              <div className="space-y-1.5">
                <Label htmlFor="team-pick">Membre</Label>
                <NativeSelect id="team-pick" value={pick} onChange={(e) => setPick(e.target.value)}>
                  <option value="" disabled>
                    Choisir…
                  </option>
                  {candidates.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </NativeSelect>
              </div>
              <DialogFooter>
                <Button onClick={add} disabled={!pick || pending}>
                  {pending ? "Ajout…" : "Ajouter"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
      <ul className="space-y-4">
        {team.map((m) => (
          <li key={m.id} className="group flex items-center gap-4">
            <UserAvatar name={m.name} decorative />
            <div className="min-w-0 flex-1 leading-tight">
              <p className="font-semibold">{m.name}</p>
              <p className="text-sm text-muted-foreground">{m.detail}</p>
            </div>
            {canManage && m.id !== ownerId && (
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`Retirer ${m.name} du projet`}
                disabled={pending}
                onClick={() =>
                  start(async () => {
                    const res = await removeProjectMember(projectId, m.id);
                    if (res.error) toast.error(res.error);
                  })
                }
              >
                <X aria-hidden />
              </Button>
            )}
          </li>
        ))}
      </ul>
    </Panel>
  );
}
