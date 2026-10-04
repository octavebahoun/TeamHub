import type { TaskStatus } from "@/lib/api/types";
import type { Progress } from "@/lib/domain";
import { doneTasksLabel } from "@/lib/format";
import { TASK_STATUS, TASK_STATUS_ORDER } from "@/lib/labels";
import { Panel, PanelTitle } from "@/components/common/panel";
import { ProgressBar } from "@/components/common/progress-bar";

export function ProgressPanel({ progress, counts }: { progress: Progress; counts: Record<TaskStatus, number> }) {
  return (
    <Panel className="p-7">
      <PanelTitle>Avancement</PanelTitle>
      <p className="mt-4 mb-4 flex items-baseline gap-3">
        <span className="font-heading text-[56px] leading-none">{Math.round(progress.ratio * 100)}%</span>
        <span className="text-muted-foreground">
          {doneTasksLabel(progress.done, progress.total)}
        </span>
      </p>
      <ProgressBar value={progress.ratio} label="Avancement du projet" />
      <dl className="mt-5 grid grid-cols-2 gap-3">
        {TASK_STATUS_ORDER.map((s) => (
          <div key={s} className="rounded-lg bg-muted px-4 py-3">
            <dt className="text-sm text-muted-foreground">{TASK_STATUS[s].label}</dt>
            <dd className="text-2xl font-semibold">{counts[s]}</dd>
          </div>
        ))}
      </dl>
    </Panel>
  );
}
