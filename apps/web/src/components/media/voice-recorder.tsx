"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Mic, RotateCcw, Send, Square, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AudioPlayer } from "./audio-player";

const MIN_SECONDS = 1;
const MAX_SECONDS = 30;

function pickMimeType() {
  if (typeof MediaRecorder === "undefined") return "";
  const candidates = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"];
  return candidates.find((t) => MediaRecorder.isTypeSupported(t)) ?? "";
}

export function VoiceRecorder({
  onSend,
  onCancel,
  className,
}: {
  onSend: (blob: Blob, mimeType: string) => void | Promise<void>;
  onCancel?: () => void;
  className?: string;
}) {
  const [phase, setPhase] = useState<"idle" | "recording" | "preview" | "denied">("idle");
  const [seconds, setSeconds] = useState(0);
  const [levels, setLevels] = useState<number[]>(() => Array.from({ length: 24 }, () => 0.15));
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [mimeType, setMimeType] = useState("");

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const timerRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const cleanupStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (timerRef.current) window.clearInterval(timerRef.current);
    analyserRef.current = null;
    void audioCtxRef.current?.close();
    audioCtxRef.current = null;
  }, []);

  useEffect(() => () => {
    cleanupStream();
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  }, [cleanupStream, previewUrl]);

  const animateWave = useCallback(() => {
    const analyser = analyserRef.current;
    if (!analyser) return;
    const data = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(data);
    const slice = 24;
    const step = Math.floor(data.length / slice);
    const next = Array.from({ length: slice }, (_, i) => {
      const v = data[i * step] / 255;
      return 0.12 + v * 0.88;
    });
    setLevels(next);
    rafRef.current = requestAnimationFrame(animateWave);
  }, []);

  const stopRecording = useCallback(() => {
    recorderRef.current?.stop();
    cleanupStream();
    setPhase("preview");
  }, [cleanupStream]);

  const startRecording = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setPhase("denied");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mime = pickMimeType();
      setMimeType(mime);
      const recorder = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const type = mime || recorder.mimeType || "audio/webm";
        const b = new Blob(chunksRef.current, { type });
        setBlob(b);
        setPreviewUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return URL.createObjectURL(b);
        });
      };
      recorderRef.current = recorder;
      recorder.start(200);

      const ctx = new AudioContext();
      audioCtxRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      source.connect(analyser);
      analyserRef.current = analyser;
      animateWave();

      setSeconds(0);
      setPhase("recording");
      timerRef.current = window.setInterval(() => {
        setSeconds((s) => {
          if (s + 1 >= MAX_SECONDS) {
            stopRecording();
            return MAX_SECONDS;
          }
          return s + 1;
        });
      }, 1000);
    } catch {
      setPhase("denied");
    }
  };

  const reset = () => {
    cleanupStream();
    recorderRef.current = null;
    chunksRef.current = [];
    setBlob(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setSeconds(0);
    setPhase("idle");
  };

  const handleCancel = () => {
    reset();
    onCancel?.();
  };

  const handleSend = async () => {
    if (!blob) return;
    if (seconds < MIN_SECONDS && blob.size < 500) return;
    await onSend(blob, mimeType || blob.type);
    reset();
  };

  const panel =
    phase === "denied" ? (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm" role="alert">
        <p className="font-medium text-destructive">Microphone inaccessible</p>
        <p className="mt-1 text-muted-foreground">Autorisez le micro dans les paramètres du navigateur pour envoyer un message vocal.</p>
        <Button type="button" size="sm" variant="outline" className="mt-3" onClick={handleCancel}>
          Fermer
        </Button>
      </div>
    ) : phase === "preview" && previewUrl ? (
      <div className="space-y-3 rounded-xl border bg-background p-3 shadow-md">
        <AudioPlayer src={previewUrl} />
        <div className="flex justify-end gap-2">
          <Button type="button" size="sm" variant="ghost" onClick={reset}>
            <RotateCcw aria-hidden />
            Réenregistrer
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={handleCancel}>
            <X aria-hidden />
            Annuler
          </Button>
          <Button type="button" size="sm" onClick={() => void handleSend()}>
            <Send aria-hidden />
            Envoyer
          </Button>
        </div>
      </div>
    ) : phase === "recording" ? (
      <div className="flex items-center gap-3 rounded-xl border border-primary/30 bg-brand-soft/20 p-3 shadow-md">
        <Button type="button" size="icon-sm" variant="destructive" aria-label="Arrêter l'enregistrement" onClick={stopRecording}>
          <Square aria-hidden className="size-3 fill-current" />
        </Button>
        <div className="flex h-10 flex-1 items-end gap-0.5" aria-hidden>
          {levels.map((h, i) => (
            <span key={i} className="w-1 rounded-full bg-primary transition-[height] duration-75" style={{ height: `${h * 100}%` }} />
          ))}
        </div>
        <span className="tabular-nums text-sm font-semibold text-brand-soft-foreground">
          {Math.floor(seconds / 60)}:{(seconds % 60).toString().padStart(2, "0")} / 0:30
        </span>
        <Button type="button" size="icon-sm" variant="ghost" aria-label="Annuler" onClick={handleCancel}>
          <X aria-hidden />
        </Button>
      </div>
    ) : null;

  return (
    <div className={cn("relative", className)}>
      {panel && <div className="absolute right-0 bottom-full z-10 mb-2 w-[min(100vw-3rem,22rem)]">{panel}</div>}
      <Button type="button" size="icon-sm" variant="ghost" aria-label="Message vocal" disabled={phase === "recording"} onClick={() => void startRecording()}>
        <Mic aria-hidden />
      </Button>
    </div>
  );
}
