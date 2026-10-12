"use client";

import { useCallback, useRef, useState } from "react";
import { AlertTriangle, FileUp, Loader2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { Panel, PanelTitle } from "@/components/common/panel";
import { ProgressBar } from "@/components/common/progress-bar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { uploadWineFile } from "@/lib/actions/attachments";
import { userFacingError } from "@/lib/errors/user-facing";
import {
  resolveDownloadHref,
  UPLOAD_KINDS,
  type UploadKind,
  type UploadRecord,
  type UploadStatus,
  validateUploadFile,
} from "@/lib/uploads/client";

export type FilePanelItem = {
  id: number | string;
  kind: string;
  name: string;
  size: string;
  status?: UploadStatus | string;
  downloadUrl?: string | null;
};

type LocalUpload = {
  key: string;
  name: string;
  kind: UploadKind;
  progress: number;
  status: UploadStatus | "cancelled";
  record?: UploadRecord;
  error?: string;
  controller: AbortController;
};

const KIND_LABEL: Record<UploadKind, string> = {
  quote_pdf: "Devis",
  contract_pdf: "Contrat",
  contract_signed_pdf: "Contrat signé",
  invoice_pdf: "Facture",
  deliverable: "Livrable",
  expense_receipt: "Justificatif",
  attachment: "Pièce jointe",
};

function statusLabel(status?: string) {
  switch (status) {
    case "scanning":
    case "uploading":
    case "pending":
      return "Analyse en cours…";
    case "infected":
      return "Fichier bloqué";
    case "failed":
      return "Échec";
    case "clean":
    case "ready":
      return "Disponible";
    default:
      return null;
  }
}

function FileRow({ item }: { item: FilePanelItem }) {
  const status = item.status;
  const href = resolveDownloadHref({ status: status ?? "ready", download_url: item.downloadUrl });
  const canDownload = !!href;
  const infected = status === "infected";
  const scanning = status === "scanning" || status === "pending" || status === "uploading";

  return (
    <li className="flex min-w-0 items-start gap-4 rounded-lg border border-transparent p-1">
      <span aria-hidden className="inline-flex h-11 w-12 shrink-0 items-center justify-center rounded-md bg-brand-soft text-[10px] font-bold uppercase text-brand-soft-foreground">
        {(KIND_LABEL[item.kind as UploadKind] ?? item.kind).slice(0, 4)}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2">
          <span className="block truncate font-medium">{item.name}</span>
          {infected && (
            <Badge variant="destructive" className="gap-1">
              <AlertTriangle aria-hidden className="size-3" />
              Menace détectée
            </Badge>
          )}
          {scanning && (
            <Badge variant="secondary" className="gap-1">
              <Loader2 aria-hidden className="size-3 animate-spin" />
              Analyse
            </Badge>
          )}
        </span>
        {item.size !== "—" && <span className="text-sm text-muted-foreground">{item.size}</span>}
        {infected && (
          <p role="alert" className="mt-2 text-sm text-destructive">
            Ce fichier a été bloqué par l&apos;antivirus. Le téléchargement n&apos;est pas autorisé.
          </p>
        )}
        {statusLabel(status ?? undefined) && !infected && <p className="mt-1 text-xs text-muted-foreground">{statusLabel(status ?? undefined)}</p>}
      </span>
      {canDownload ? (
        <a href={href!} className="text-sm font-semibold text-primary hover:underline" download>
          Télécharger
        </a>
      ) : (
        <span className="text-sm text-muted-foreground">{infected ? "Bloqué" : scanning ? "…" : null}</span>
      )}
    </li>
  );
}

export function FilesPanel({
  files = [],
  title = "Fichiers",
  allowUpload = false,
  defaultKind = "attachment",
  uploadContext,
}: {
  files?: FilePanelItem[];
  title?: string;
  allowUpload?: boolean;
  defaultKind?: UploadKind;
  uploadContext?: Record<string, string | number>;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [kind, setKind] = useState<UploadKind>(defaultKind);
  const [local, setLocal] = useState<LocalUpload[]>([]);

  const startUpload = useCallback(
    async (file: File) => {
      const err = validateUploadFile(file, kind);
      if (err) {
        toast.error(err);
        return;
      }
      const key = `${file.name}-${Date.now()}`;
      const controller = new AbortController();
      setLocal((list) => [
        ...list,
        { key, name: file.name, kind, progress: 0, status: "uploading", controller },
      ]);

      try {
        const form = new FormData();
        form.set("file", file);
        if (uploadContext?.project_id) form.set("project_id", String(uploadContext.project_id));
        if (uploadContext?.task_id) form.set("task_id", String(uploadContext.task_id));
        const result = await uploadWineFile(form);
        if (result.error || !result.file) {
          const message = userFacingError(result.error);
          setLocal((list) => list.map((u) => (u.key === key ? { ...u, status: "failed", error: message } : u)));
          toast.error(message);
          return;
        }
        const record: UploadRecord = {
          id: String(result.file.id),
          kind,
          name: result.file.name,
          size: file.size,
          mime: file.type || "application/octet-stream",
          status: (result.file.status as UploadStatus) ?? "ready",
          download_url: result.file.download_url ?? `/api/wine/attachments/${result.file.id}/download`,
        };
        setLocal((list) => list.map((u) => (u.key === key ? { ...u, progress: 1, status: record.status, record } : u)));
        toast.success("Fichier envoyé.");
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") {
          setLocal((list) => list.filter((u) => u.key !== key));
          return;
        }
        const message = userFacingError(e);
        setLocal((list) => list.map((u) => (u.key === key ? { ...u, status: "failed", error: message } : u)));
        toast.error(message);
      }
    },
    [kind, uploadContext]
  );

  const onFiles = (list: FileList | null) => {
    if (!list?.length) return;
    void startUpload(list[0]);
  };

  const merged: FilePanelItem[] = [
    ...local.map((u) => ({
      id: u.record?.id ?? u.key,
      kind: u.kind,
      name: u.name,
      size: u.record ? `${Math.round(u.record.size / 1024)} Ko` : "—",
      status: u.status === "cancelled" ? "failed" : u.status,
      downloadUrl: u.record ? resolveDownloadHref(u.record) : null,
    })),
    ...files,
  ];

  return (
    <Panel className="p-7" id="fichiers">
      <PanelTitle className="mb-5">{title}</PanelTitle>

      {allowUpload && (
        <div
          className={`mb-6 rounded-xl border-2 border-dashed p-6 transition-colors ${dragOver ? "border-primary bg-brand-soft/30" : "border-border bg-muted/40"}`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            onFiles(e.dataTransfer.files);
          }}
        >
          <div className="flex min-w-0 flex-col items-center gap-3 text-center">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-background shadow-sm">
              <Upload aria-hidden className="size-5 text-primary" />
            </div>
            <div className="min-w-0 w-full">
              <p className="font-medium">Glissez un fichier ici</p>
              <p className="text-sm text-muted-foreground">PDF, images ou documents · 25 Mo max</p>
            </div>
            <div className="flex min-w-0 flex-wrap items-center justify-center gap-2">
              <label className="sr-only" htmlFor="files-kind">
                Type de document
              </label>
              <select
                id="files-kind"
                value={kind}
                onChange={(e) => setKind(e.target.value as UploadKind)}
                className="h-9 max-w-full min-w-0 rounded-md border bg-background px-2 text-sm"
              >
                {UPLOAD_KINDS.map((k) => (
                  <option key={k} value={k}>
                    {KIND_LABEL[k]}
                  </option>
                ))}
              </select>
              <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()}>
                <FileUp aria-hidden />
                Parcourir
              </Button>
            </div>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.webp,.gif,.zip,.doc,.docx,.xls,.xlsx,.webm,.mp4,.mp3,.m4a,image/*,application/pdf"
            className="sr-only"
            onChange={(e) => onFiles(e.target.files)}
          />
        </div>
      )}

      {local.some((u) => u.status === "uploading" || u.status === "scanning") && (
        <ul className="mb-4 space-y-3">
          {local
            .filter((u) => u.status === "uploading" || u.status === "scanning" || u.status === "pending")
            .map((u) => (
              <li key={u.key} className="rounded-lg border p-3">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-medium">{u.name}</span>
                  <Button type="button" variant="ghost" size="icon-xs" aria-label="Annuler l'envoi" onClick={() => u.controller.abort()}>
                    <X aria-hidden />
                  </Button>
                </div>
                <ProgressBar value={u.progress} label={`Envoi de ${u.name}`} />
              </li>
            ))}
        </ul>
      )}

      {merged.length === 0 ? (
        <p className="text-sm text-muted-foreground">Aucun fichier pour le moment.</p>
      ) : (
        <ul className="space-y-4">
          {merged.map((f) => (
            <FileRow key={String(f.id)} item={f} />
          ))}
        </ul>
      )}
    </Panel>
  );
}
