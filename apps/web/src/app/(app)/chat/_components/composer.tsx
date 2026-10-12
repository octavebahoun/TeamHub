"use client";

import dynamic from "next/dynamic";
import { useRef, useState } from "react";
import { ArrowUp, Paperclip } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { userFacingError } from "@/lib/errors/user-facing";
import { validateUploadFile } from "@/lib/uploads/client";

const VoiceRecorder = dynamic(() => import("@/components/media/voice-recorder").then((m) => ({ default: m.VoiceRecorder })), {
  ssr: false,
  loading: () => null,
});

export function Composer({
  channelName,
  onSend,
  onTyping,
  onSendAttachment,
  onSendVoice,
}: {
  channelName: string;
  onSend: (body: string) => Promise<boolean>;
  onTyping: () => void;
  onSendAttachment?: (file: File) => Promise<boolean>;
  onSendVoice?: (blob: Blob, mimeType: string) => Promise<boolean>;
}) {
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const lastTyping = useRef(0);
  const fileRef = useRef<HTMLInputElement>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = body.trim();
    if (!text) return;
    setSending(true);
    const ok = await onSend(text);
    setSending(false);
    if (ok) setBody("");
    else toast.error("Message non envoyé. Vérifiez votre connexion.");
  };

  const attach = async (list: FileList | null) => {
    const file = list?.[0];
    if (!file || !onSendAttachment) return;
    const invalid = validateUploadFile(file, "attachment");
    if (invalid) {
      toast.error(invalid);
      if (fileRef.current) fileRef.current.value = "";
      return;
    }
    setSending(true);
    try {
      const ok = await onSendAttachment(file);
      if (!ok) toast.error(userFacingError("Pièce jointe non envoyée."));
    } catch (e) {
      toast.error(userFacingError(e));
    }
    setSending(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  const sendVoice = async (blob: Blob, mime: string) => {
    if (!onSendVoice) return;
    setSending(true);
    const ok = await onSendVoice(blob, mime);
    setSending(false);
    if (ok) toast.success("Message vocal envoyé.");
    else toast.error("Message vocal non envoyé.");
  };

  return (
    <form onSubmit={submit} className="min-w-0 space-y-3 border-t px-4 py-5 sm:px-8">
      <div className="flex min-w-0 items-center gap-2 rounded-2xl border bg-background py-2 pr-2 pl-3 focus-within:ring-2 focus-within:ring-ring sm:gap-3 sm:pl-4">
        <input
          ref={fileRef}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,.webp,.gif,.zip,.doc,.docx,.xls,.xlsx,image/*,application/pdf"
          className="sr-only"
          onChange={(e) => void attach(e.target.files)}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Joindre un fichier"
          disabled={!onSendAttachment || sending}
          onClick={() => fileRef.current?.click()}
        >
          <Paperclip aria-hidden />
        </Button>
        {onSendVoice && <VoiceRecorder onSend={sendVoice} />}
        <label htmlFor="chat-input" className="sr-only">
          Écrire dans #{channelName}
        </label>
        <input
          id="chat-input"
          value={body}
          autoComplete="off"
          onChange={(e) => {
            setBody(e.target.value);
            if (Date.now() - lastTyping.current > 1500) {
              lastTyping.current = Date.now();
              onTyping();
            }
          }}
          placeholder={`Écrire dans #${channelName}…`}
          className="h-10 min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-subtle-foreground"
        />
        <Button type="submit" size="icon" aria-label="Envoyer" disabled={sending || !body.trim()}>
          <ArrowUp aria-hidden />
        </Button>
      </div>
    </form>
  );
}
