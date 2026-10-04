"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Bell,
  CheckCircle2,
  Clock3,
  FileCheck2,
  MessageCircle,
  Receipt,
  Star,
  AlertCircle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { loadInbox, markInboxAllRead } from "@/lib/actions/inbox";
import type { BellItem } from "@/lib/api/wine-contract";
import { useRealtime, type AppNotification } from "@/components/realtime/realtime-provider";
import { ago } from "@/lib/format";
import { cn } from "@/lib/utils";

type NotifVisual = { text: string; href?: string; icon: LucideIcon; iconClass: string };

function describe(n: AppNotification): NotifVisual {
  const p = n.payload as Record<string, string | number>;
  if (typeof p.notice_title === "string" && p.notice_title) {
    const body = typeof p.body === "string" && p.body ? `${p.notice_title} — ${p.body}` : p.notice_title;
    const href = typeof p.link === "string" && p.link.startsWith("/") ? p.link : undefined;
    return { text: body, href, icon: Bell, iconClass: "text-muted-foreground bg-muted" };
  }
  switch (n.type) {
    case "task.assigned":
      return {
        text: `Nouvelle tâche assignée : « ${p.title} »`,
        href: `/taches/${p.task_id}`,
        icon: CheckCircle2,
        iconClass: "text-success bg-success-soft",
      };
    case "task.commented":
      return {
        text: "Nouveau commentaire sur une de vos tâches",
        href: `/taches/${p.task_id}`,
        icon: MessageCircle,
        iconClass: "text-info bg-info-soft",
      };
    case "task.reminder":
      return {
        text: `Rappel : « ${p.title ?? "tâche à traiter"} »`,
        href: p.task_id ? `/taches/${p.task_id}` : "/taches",
        icon: Clock3,
        iconClass: "text-brand-soft-foreground bg-brand-soft",
      };
    case "post.created":
      return { text: "Nouvelle publication dans le fil de l'équipe", href: "/social", icon: MessageCircle, iconClass: "text-info bg-info-soft" };
    case "invoice.paid":
      return {
        text: `Facture ${p.number ?? ""} marquée comme payée`.trim(),
        href: p.invoice_id ? `/crm/${p.invoice_id}` : "/crm",
        icon: Receipt,
        iconClass: "text-success bg-success-soft",
      };
    case "invoice.overdue":
      return {
        text: `Facture en retard : ${p.number ?? "à relancer"}`,
        href: p.invoice_id ? `/crm/${p.invoice_id}` : "/crm",
        icon: AlertCircle,
        iconClass: "text-destructive bg-destructive/10",
      };
    case "quote.accepted":
      return {
        text: `Devis accepté${p.client ? ` · ${p.client}` : ""}`,
        href: "/crm",
        icon: FileCheck2,
        iconClass: "text-success bg-success-soft",
      };
    case "whatsapp.message":
      return {
        text: `Message WhatsApp${p.from ? ` de ${p.from}` : ""}`,
        href: "/chat",
        icon: MessageCircle,
        iconClass: "text-info bg-info-soft",
      };
    case "review.new":
      return {
        text: "Nouvel avis client à modérer",
        href: "/crm",
        icon: Star,
        iconClass: "text-brand-soft-foreground bg-brand-soft",
      };
    default:
      return { text: "Nouvelle notification", icon: Bell, iconClass: "text-muted-foreground bg-muted" };
  }
}

function persistedAsLive(row: BellItem): AppNotification {
  return {
    id: `inbox-${row.id}`,
    type: row.type,
    payload: { notice_title: row.title, body: row.body, link: row.href ?? "" },
    at: row.at,
    read: row.read,
  };
}

export function NotificationsButton() {
  const { notifications: live, markAllRead } = useRealtime();
  const [inbox, setInbox] = useState<BellItem[]>([]);

  useEffect(() => {
    let cancelled = false;
    void loadInbox()
      .then((rows) => {
        if (!cancelled) setInbox(rows);
      })
      .catch(() => {
        if (!cancelled) setInbox([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const persisted = inbox.map(persistedAsLive);
  const liveOnly = live.filter((n) => !persisted.some((row) => row.id === n.id));
  const notifications = [...liveOnly, ...persisted];
  const unread = notifications.filter((n) => !n.read).length;

  const closeAndRead = (open: boolean) => {
    if (open) return;
    markAllRead();
    void markInboxAllRead().then(() => setInbox((rows) => rows.map((row) => ({ ...row, read: true }))));
  };

  return (
    <Popover onOpenChange={closeAndRead}>
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
              const Icon = d.icon;
              const body = (
                <div className="flex gap-3">
                  <span aria-hidden className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg", d.iconClass)}>
                    <Icon className="size-4" strokeWidth={1.75} />
                  </span>
                  <span className="min-w-0">
                    <p className="text-sm">{d.text}</p>
                    <p className="text-xs text-muted-foreground">{ago(n.at)}</p>
                  </span>
                </div>
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
