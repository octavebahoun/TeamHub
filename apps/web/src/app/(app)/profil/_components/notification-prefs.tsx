"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { Panel, PanelTitle } from "@/components/common/panel";
import { saveNotificationPrefs } from "@/lib/actions/profile";
import type { NotificationPrefs as Prefs } from "@/lib/api/types";

const ITEMS: { key: keyof Prefs; label: string; hint: string }[] = [
  { key: "task_assigned", label: "Tâche assignée", hint: "Quand quelqu'un vous confie une tâche" },
  { key: "due_reminder", label: "Rappel d'échéance", hint: "La veille d'une tâche à rendre" },
  { key: "chat_messages", label: "Messages du chat", hint: "Mentions et messages privés" },
  { key: "weekly_digest", label: "Résumé par email", hint: "Un récapitulatif chaque lundi" },
];

export function NotificationPrefs({ initial }: { initial: Prefs }) {
  const [prefs, setPrefs] = useState(initial);
  const [, start] = useTransition();
  const toggle = (key: keyof Prefs, value: boolean) => {
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    start(async () => {
      const res = await saveNotificationPrefs(next);
      if (res.error) {
        toast.error(res.error);
        setPrefs(prefs);
      }
    });
  };
  return (
    <Panel className="p-7">
      <PanelTitle className="mb-2">Notifications</PanelTitle>
      <ul className="divide-y">
        {ITEMS.map((i) => (
          <li key={i.key} className="flex items-center justify-between gap-6 py-4">
            <label htmlFor={`n-${i.key}`} className="cursor-pointer">
              <span className="block font-semibold">{i.label}</span>
              <span className="text-sm text-muted-foreground" id={`n-${i.key}-hint`}>{i.hint}</span>
            </label>
            <Checkbox id={`n-${i.key}`} checked={prefs[i.key]} onCheckedChange={(v) => toggle(i.key, v === true)} aria-describedby={`n-${i.key}-hint`} className="size-6 rounded-md" />
          </li>
        ))}
      </ul>
    </Panel>
  );
}
