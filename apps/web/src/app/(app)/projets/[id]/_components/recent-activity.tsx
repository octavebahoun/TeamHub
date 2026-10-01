import type { Activity } from "@/lib/api/types";
import { ago, firstName } from "@/lib/format";
import { Panel, PanelTitle } from "@/components/common/panel";
import { UserAvatar } from "@/components/common/user-avatar";

export function RecentActivity({ items }: { items: Activity[] }) {
  return (
    <Panel className="p-7">
      <PanelTitle className="mb-5">Activité récente</PanelTitle>
      <ul className="space-y-5">
        {items.map((a) => (
          <li key={a.id} className="flex gap-4">
            <UserAvatar name={a.user?.name ?? "?"} decorative />
            <div className="leading-snug">
              <p>
                <span className="font-medium">{firstName(a.user?.name)}</span> {a.body}
              </p>
              <p className="text-sm text-muted-foreground">{ago(a.created_at)}</p>
            </div>
          </li>
        ))}
      </ul>
    </Panel>
  );
}
