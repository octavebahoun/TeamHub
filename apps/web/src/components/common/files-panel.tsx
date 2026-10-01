import { Panel, PanelTitle } from "@/components/common/panel";

export function FilesPanel({ files, title = "Fichiers" }: { files: { id: number; kind: string; name: string; size: string }[]; title?: string }) {
  return (
    <Panel className="p-7" id="fichiers">
      <PanelTitle className="mb-5">{title}</PanelTitle>
      <ul className="space-y-4">
        {files.map((f) => (
          <li key={f.id} className="flex items-center gap-4">
            <span aria-hidden className="inline-flex h-11 w-12 items-center justify-center rounded-md bg-brand-soft text-xs font-bold text-brand-soft-foreground">
              {f.kind}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate">{f.name}</span>
              {f.size !== "—" && <span className="text-sm text-muted-foreground">{f.size}</span>}
            </span>
            <span className="sr-only">Type {f.kind}</span>
          </li>
        ))}
      </ul>
    </Panel>
  );
}
