"use client";

import Link from "next/link";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useRealtime, type AppNotification } from "@/components/realtime/realtime-provider";
import { ago } from "@/lib/format";

function describe(n: AppNotification): { text: string; href?: string } {
  const p = n.payload as Record<string, string | number>;
  switch (n.type) {
    case "task.assigned":
      return { text: `Nouvelle tâche assignée : « ${p.title} »`, href: `/taches/${p.task_id}` };
    case "task.commented":
      return { text: "Nouveau commentaire sur une de vos tâches", href: `/taches/${p.task_id}` };
    case "post.created":
      return { text: "Nouvelle publication dans le fil de l'équipe", href: "/social" };
    default:
      return { text: "Nouvelle notification" };
  }
}

export function NotificationsButton() {
  const { notifications, markAllRead } = useRealtime();
  const unread = notifications.filter((n) => !n.read).length;
  return (
    <Popover onOpenChange={(open) => !open && markAllRead()}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon-lg" className="relative" aria-label={unread ? `Notifications, ${unread} non lues` : "Notifications"}>
          <Bell aria-hidden className="size-5" strokeWidth={1.75} />
          {unread > 0 && <span aria-hidden className="absolute top-2 right-2.5 size-2 rounded-full bg-primary ring-2 ring-background" />}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <p className="border-b px-4 py-3 font-semibold">Notifications</p>
        {notifications.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-muted-foreground">Rien de nouveau pour le moment.</p>
        ) : (
          <ul className="max-h-96 divide-y overflow-y-auto">
            {notifications.map((n) => {
              const d = describe(n);
              const body = (
                <>
                  <p className="text-sm">{d.text}</p>
                  <p className="text-xs text-muted-foreground">{ago(n.at)}</p>
                </>
              );
              return (
                <li key={n.id} className={n.read ? "" : "bg-brand-soft/40"}>
                  {d.href ? (
                    <Link href={d.href} className="block px-4 py-3 hover:bg-muted">
                      {body}
                    </Link>
                  ) : (
                    <div className="px-4 py-3">{body}</div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  );
}
