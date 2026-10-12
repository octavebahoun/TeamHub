"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const SPEEDS = [1, 1.25, 1.5, 2] as const;

function fmt(sec: number) {
  if (!Number.isFinite(sec)) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function AudioPlayer({ src, className }: { src: string; className?: string }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [current, setCurrent] = useState(0);
  const [speed, setSpeed] = useState<(typeof SPEEDS)[number]>(1);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    const onTime = () => setCurrent(el.currentTime);
    const onMeta = () => setDuration(el.duration);
    const onEnd = () => setPlaying(false);
    el.addEventListener("timeupdate", onTime);
    el.addEventListener("loadedmetadata", onMeta);
    el.addEventListener("ended", onEnd);
    return () => {
      el.removeEventListener("timeupdate", onTime);
      el.removeEventListener("loadedmetadata", onMeta);
      el.removeEventListener("ended", onEnd);
    };
  }, [src]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.playbackRate = speed;
  }, [speed]);

  const toggle = async () => {
    const el = audioRef.current;
    if (!el) return;
    if (playing) {
      el.pause();
      setPlaying(false);
    } else {
      await el.play();
      setPlaying(true);
    }
  };

  const seek = (value: number) => {
    const el = audioRef.current;
    if (!el || !duration) return;
    el.currentTime = (value / 100) * duration;
    setCurrent(el.currentTime);
  };

  const pct = duration ? (current / duration) * 100 : 0;

  return (
    <div className={cn("flex items-center gap-3 rounded-xl border bg-muted/30 px-3 py-2", className)}>
      <audio ref={audioRef} src={src} preload="metadata" />
      <Button type="button" size="icon-sm" variant="secondary" aria-label={playing ? "Pause" : "Lecture"} onClick={() => void toggle()}>
        {playing ? <Pause aria-hidden /> : <Play aria-hidden />}
      </Button>
      <div className="min-w-0 flex-1">
        <input
          type="range"
          min={0}
          max={100}
          value={pct}
          aria-label="Position dans l'enregistrement"
          className="w-full accent-primary"
          onChange={(e) => seek(Number(e.target.value))}
        />
        <p className="text-xs text-muted-foreground">
          {fmt(current)} / {fmt(duration)}
        </p>
      </div>
      <Button
        type="button"
        size="sm"
        variant="ghost"
        className="tabular-nums"
        aria-label="Changer la vitesse de lecture"
        onClick={() => {
          const idx = SPEEDS.indexOf(speed);
          setSpeed(SPEEDS[(idx + 1) % SPEEDS.length]);
        }}
      >
        {speed}x
      </Button>
    </div>
  );
}
