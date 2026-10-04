import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { WineLogo } from "@/components/common/wine-logo";
import { HERO, TRIAL_OFFER } from "../content";
import { Eyebrow } from "./eyebrow";
import { HeroPreview } from "./hero-preview";

export function Hero() {
  return (
    <section aria-labelledby="hero-title" className="relative overflow-x-clip border-b">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="orb orb-a -top-24 left-[12%] size-[28rem] bg-primary/30" />
        <div className="orb orb-b top-28 -right-16 size-[22rem] bg-info/25" />
        <div className="orb orb-c bottom-0 left-1/3 size-[18rem] bg-primary/15" />
        <div
          className="absolute inset-0 opacity-[0.4]"
          style={{
            backgroundImage:
              "linear-gradient(color-mix(in oklch, var(--foreground), transparent 94%) 1px, transparent 1px), linear-gradient(90deg, color-mix(in oklch, var(--foreground), transparent 94%) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
            maskImage: "radial-gradient(ellipse 80% 70% at 50% 30%, #000 20%, transparent 75%)",
          }}
        />
      </div>

      <div className="relative mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 px-4 pt-10 pb-16 sm:gap-16 sm:px-8 sm:pt-16 sm:pb-28 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
        <div className="min-w-0">
          <div data-reveal className="reveal mb-5">
            <WineLogo withMark className="[&_span]:text-[clamp(2rem,6vw,2.75rem)] [&_svg]:size-8 sm:[&_svg]:size-9" />
          </div>
          <Eyebrow>{HERO.eyebrow}</Eyebrow>
          <h1
            id="hero-title"
            data-reveal
            data-reveal-delay="1"
            className="reveal mt-3 font-heading text-[clamp(2.15rem,7vw,4.1rem)] leading-[1.04] tracking-tight"
          >
            <span className="block text-foreground">{HERO.titleLead}</span>
            <em className="text-gradient italic">{HERO.titleAccent}</em>
            <span className="text-foreground">.</span>
          </h1>
          <p
            data-reveal
            data-reveal-delay="2"
            className="reveal mt-6 max-w-xl text-[16px] leading-relaxed text-muted-foreground sm:text-[18px]"
          >
            {HERO.subtitle}
          </p>
          <div data-reveal data-reveal-delay="3" className="reveal mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link
              href="/inscription"
              className={buttonVariants({
                size: "lg",
                className: "h-13 w-full justify-center gap-2 rounded-2xl px-8 text-[16px] sm:w-auto sm:text-[17px]",
              })}
            >
              {HERO.ctaPrimary}
              <ArrowRight aria-hidden className="size-4 transition-transform group-hover/button:translate-x-0.5" />
            </Link>
            <a
              href="#fonctionnalites"
              className={buttonVariants({
                size: "lg",
                variant: "outline",
                className:
                  "h-13 w-full justify-center rounded-2xl border-border/80 bg-background/50 px-8 text-[16px] backdrop-blur-md sm:w-auto sm:text-[17px]",
              })}
            >
              {HERO.ctaSecondary}
            </a>
          </div>
          <p data-reveal data-reveal-delay="4" className="reveal mt-5 text-sm text-muted-foreground">
            {[TRIAL_OFFER, "Sans installation", "PWA · MoMo · Devis XOF"].filter(Boolean).join(" · ")}
          </p>
        </div>
        <div data-reveal data-reveal-variant="scale" data-reveal-delay="2" className="reveal">
          <HeroPreview />
        </div>
      </div>
    </section>
  );
}
