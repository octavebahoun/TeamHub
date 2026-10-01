"use client";

import { useRef, useState } from "react";
import { ArrowUp, Paperclip } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function Composer({ channelName, onSend, onTyping }: { channelName: string; onSend: (body: string) => Promise<boolean>; onTyping: () => void }) {
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const lastTyping = useRef(0);

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

  return (
    <form onSubmit={submit} className="border-t px-6 py-5 sm:px-8">
      <div className="flex items-center gap-3 rounded-2xl border bg-background py-2 pr-2 pl-4 focus-within:ring-2 focus-within:ring-ring">
        <Button type="button" variant="ghost" size="icon-sm" aria-label="Joindre un fichier (bientôt disponible)" disabled>
          <Paperclip aria-hidden />
        </Button>
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
          className="h-10 flex-1 bg-transparent text-[15px] outline-none placeholder:text-subtle-foreground"
        />
        <Button type="submit" size="icon" aria-label="Envoyer" disabled={sending || !body.trim()}>
          <ArrowUp aria-hidden />
        </Button>
      </div>
    </form>
  );
}
