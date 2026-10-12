import { ToneBadge } from "@/components/common/tone-badge";
import { TASK_PRIORITY } from "@/lib/labels";
import type { TaskPriority } from "@/lib/api/types";

export function PriorityBadge({ priority }: { priority: TaskPriority }) {
  const p = TASK_PRIORITY[priority];
  return (
    <ToneBadge tone={p.tone}>
      <span className="sr-only">Priorité </span>
      {p.label}
    </ToneBadge>
  );
}
