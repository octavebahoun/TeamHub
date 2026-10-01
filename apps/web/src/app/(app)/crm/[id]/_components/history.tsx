"use client";

import { FileText, Mail, Phone, Trophy, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FieldError } from "@/components/common/field-error";
import { NativeSelect } from "@/components/common/native-select";
import { Panel, PanelTitle } from "@/components/common/panel";
import { logActivity } from "@/lib/actions/crm";
import { useFormAction } from "@/hooks/use-form-action";
import type { Activity } from "@/lib/api/types";
import { firstName, shortDate } from "@/lib/format";

const KINDS = { note: { label: "Note", icon: FileText }, call: { label: "Appel", icon: Phone }, email: { label: "Email envoyé", icon: Mail }, meeting: { label: "Rendez-vous", icon: Users } } as const;

function describe(a: Activity) {
  if (a.kind && a.kind in KINDS) return KINDS[a.kind as keyof typeof KINDS];
  if (a.action === "opportunity.stage_changed" && (a.meta as { to?: string })?.to === "won") return { label: "Opportunité gagnée", icon: Trophy };
  if (a.action.startsWith("opportunity")) return { label: "Opportunité", icon: Trophy };
  return { label: "Mise à jour", icon: FileText };
}

export function History({ clientId, items, canEdit }: { clientId: number; items: Activity[]; canEdit: boolean }) {
  const [state, action, pending] = useFormAction(logActivity.bind(null, clientId), { successMessage: "Ajouté à l'historique" });
  return (
    <Panel className="p-7">
      <PanelTitle className="mb-5">Historique</PanelTitle>
      {canEdit && (
        <form action={action} className="mb-6 space-y-3 border-b pb-6">
          <Label htmlFor="h-body" className="sr-only">Ajouter une note, un appel, un échange</Label>
          <Textarea id="h-body" name="body" rows={2} placeholder="Ajouter une note, un appel, un échange…" aria-invalid={!!state?.fields?.body || undefined} />
          <FieldError message={state?.fields?.body} />
          <div className="flex items-center justify-between gap-3">
            <label htmlFor="h-kind" className="sr-only">Type d&apos;échange</label>
            <NativeSelect id="h-kind" name="kind" defaultValue="note" className="w-44">
              <option value="note">Note</option>
              <option value="call">Appel</option>
              <option value="email">Email</option>
              <option value="meeting">Rendez-vous</option>
            </NativeSelect>
            <Button type="submit" disabled={pending}>{pending ? "Enregistrement…" : "Enregistrer"}</Button>
          </div>
        </form>
      )}
      {items.length === 0 ? (
        <p className="text-muted-foreground">Aucun échange enregistré pour l&apos;instant.</p>
      ) : (
        <ol className="divide-y">
          {items.map((a) => {
            const d = describe(a);
            const Icon = d.icon;
            return (
              <li key={a.id} className="flex gap-4 py-5 first:pt-0">
                <span aria-hidden className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand-soft-foreground">
                  <Icon className="size-4.5" strokeWidth={1.75} />
                </span>
                <div>
                  <p>
                    <span className="font-semibold">{d.label}</span>{" "}
                    <span className="text-sm text-muted-foreground">
                      {firstName(a.user?.name)} · {shortDate(a.created_at)}
                    </span>
                  </p>
                  {a.body && <p className="mt-1">{a.body}</p>}
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </Panel>
  );
}
