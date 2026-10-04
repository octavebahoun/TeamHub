import Image from "next/image";
import { BarChart3, Briefcase, MessageSquare, SquareCheck, Users, Wallet } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const FLOATING: { icon: LucideIcon; label: string; className: string; delay: string }[] = [
  { icon: SquareCheck, label: "Tâches", className: "top-[6%] left-[4%]", delay: "0s" },
  { icon: MessageSquare, label: "Chat", className: "top-[2%] right-[8%]", delay: "0.4s" },
  { icon: Users, label: "Équipe", className: "top-[42%] left-0", delay: "0.8s" },
  { icon: BarChart3, label: "Analytics", className: "top-[38%] right-0", delay: "1.2s" },
  { icon: Briefcase, label: "CRM", className: "bottom-[12%] left-[8%]", delay: "0.6s" },
  { icon: Wallet, label: "MoMo", className: "bottom-[8%] right-[10%]", delay: "1s" },
];

const ILLUSTRATIONS = {
  login: {
    src: "/illustrations/auth-team.jpg",
    alt: "Professionnel WINE entouré des modules projets, tâches, chat et analytics",
  },
  register: {
    src: "/illustrations/auth-grow.jpg",
    alt: "Équipe lançant son espace WINE avec tableau de bord et croissance",
  },
  crm: {
    src: "/illustrations/auth-crm.jpg",
    alt: "Recherche et suivi client avec loupe et CRM",
  },
} as const;

export type AuthIllustrationVariant = keyof typeof ILLUSTRATIONS;

/** Scène illustrative 3D compacte — s’adapte à la hauteur disponible. */
export function AuthIllustration({
  variant = "login",
  className,
}: {
  variant?: AuthIllustrationVariant;
  className?: string;
}) {
  const art = ILLUSTRATIONS[variant];

  return (
    <div className={cn("relative mx-auto flex w-full max-w-sm min-h-0 flex-col xl:max-w-md", className)} aria-hidden>
      {FLOATING.map(({ icon: Icon, label, className: pos, delay }) => (
        <span
          key={label}
          className={cn(
            "absolute z-10 inline-flex size-9 items-center justify-center rounded-xl bg-white text-primary shadow-[0_10px_22px_-12px_rgb(0_0_0/0.5)] ring-1 ring-black/5 xl:size-10",
            "motion-safe:animate-[auth-float_4.5s_ease-in-out_infinite]",
            pos
          )}
          style={{ animationDelay: delay }}
          title={label}
        >
          <Icon className="size-4 xl:size-[1.1rem]" strokeWidth={2} />
        </span>
      ))}

      <div className="relative mx-auto h-full max-h-[min(34vh,280px)] w-full min-h-[140px] overflow-hidden rounded-2xl bg-white/95 p-1.5 shadow-[0_20px_40px_-24px_rgb(0_0_0/0.55)] ring-1 ring-white/40 xl:max-h-[min(38vh,320px)]">
        <div className="relative h-full w-full overflow-hidden rounded-[0.9rem] bg-white">
          <Image
            src={art.src}
            alt={art.alt}
            fill
            sizes="(max-width: 1280px) 360px, 420px"
            className="object-cover object-center"
            priority
          />
        </div>
      </div>
    </div>
  );
}
