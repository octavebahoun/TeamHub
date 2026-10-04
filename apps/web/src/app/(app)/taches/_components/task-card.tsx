"use client";

import Link from "next/link";
import { CalendarDays, MessageSquare, MoreHorizontal, SquareCheck } from "lucide-react";
import type { Task, TaskStatus } from "@/lib/api/types";
import { isDueSoon, isOverdue, shortDate } from "@/lib/format";
import { TASK_STATUS, TASK_STATUS_ORDER } from "@/lib/labels";
import { cn } from "@/lib/utils";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ToneBadge } from "@/components/common/tone-badge";
import { UserAvatar } from "@/components/common/user-avatar";
import { PriorityBadge } from "@/components/tasks/priority-badge";

/** Carte Kanban : déplaçable à la souris, et au clavier via le menu « Déplacer vers ». */
export function TaskCard({ task, canMove, onMove, dragging, onDragStart, onDragEnd }: {
  task: Task;
  canMove: boolean;
  onMove: (status: TaskStatus) => void;
  dragging: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
}) {
  const late = task.status !== "done" && isOverdue(task.due_date);
  const dueSoon = task.status !== "done" && !late && isDueSoon(task.due_date);
  return (
    <article
      draggable={canMove}
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", String(task.id));
        e.dataTransfer.effectAllowed = "move";
        onDragStart();
      }}
      onDragEnd={onDragEnd}
      className={cn(
        "surface-lift relative rounded-xl border bg-card p-4 shadow-xs transition focus-within:ring-2 focus-within:ring-ring",
        canMove && "cursor-grab active:cursor-grabbing",
        dragging && "opacity-40",
        late && "border-danger/40",
        dueSoon && "border-primary/35 glow-active"
      )}
    >
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="flex flex-wrap gap-2">
          <PriorityBadge priority={task.priority} />
          {late && <ToneBadge tone="brand">En retard</ToneBadge>}
          {dueSoon && <ToneBadge tone="neutral">Échéance proche</ToneBadge>}
        </div>
        {canMove && (
          <DropdownMenu>
            <DropdownMenuTrigger className="relative z-10 -m-1 rounded-md p-1 hover:bg-muted" aria-label={`Déplacer « ${task.title} »`}>
              <MoreHorizontal aria-hidden className="size-4.5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Déplacer vers</DropdownMenuLabel>
              {TASK_STATUS_ORDER.filter((s) => s !== task.status).map((s) => (
                <DropdownMenuItem key={s} onSelect={() => onMove(s)}>
                  {TASK_STATUS[s].label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
      <h3 className="font-sans text-[16px] leading-snug font-semibold">
        <Link href={`/taches/${task.id}`} className="after:absolute after:inset-0 after:rounded-xl focus:outline-none">
          {task.title}
        </Link>
      </h3>
      <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
        {task.due_date && (
          <span className={cn("flex items-center gap-1.5", late && "font-semibold text-danger")}>
            <CalendarDays aria-hidden className="size-4" strokeWidth={1.75} />
            <span className="sr-only">{late ? "En retard, échéance" : "Échéance"}</span>
            {shortDate(task.due_date)}
          </span>
        )}
        {!!task.subtasks_count && (
          <span className="flex items-center gap-1.5">
            <SquareCheck aria-hidden className="size-4" strokeWidth={1.75} />
            <span className="sr-only">Sous-tâches terminées</span>
            {task.done_subtasks_count ?? 0}/{task.subtasks_count}
          </span>
        )}
        {!!task.comments_count && (
          <span className="flex items-center gap-1.5">
            <MessageSquare aria-hidden className="size-4" strokeWidth={1.75} />
            <span className="sr-only">Commentaires</span>
            {task.comments_count}
          </span>
        )}
        {task.assignee && <UserAvatar name={task.assignee.name} size="sm" tone="dark" className="ml-auto" />}
      </div>
    </article>
  );
}
