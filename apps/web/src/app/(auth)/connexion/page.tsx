import type { Metadata } from "next";
import { AuthShell, asideTitle } from "../_components/auth-shell";
import { LoginForm } from "./_components/login-form";

export const metadata: Metadata = { title: "Connexion" };

const MODULES = ["Projets", "Tâches", "Chat", "Social", "Analytics", "CRM"];

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; reset?: string }> }) {
  const { next, reset } = await searchParams;
  return (
    <AuthShell
      illustration="login"
      aside={
        <>
          <p className="mb-2 text-[11px] font-semibold tracking-[0.16em] text-primary-foreground/75 uppercase">
            Work IN Excellence
          </p>
          <p className={asideTitle}>Projets, tâches, échanges et clients au même endroit.</p>
          <p className="mt-3 text-[15px] leading-relaxed text-primary-foreground/90">
            Votre équipe arrête de jongler entre WhatsApp, Excel et les carnets.
          </p>
          <ul className="mt-5 flex flex-wrap gap-1.5" aria-label="Modules">
            {MODULES.map((m) => (
              <li
                key={m}
                className="rounded-full border border-white/35 bg-white/12 px-2.5 py-1 text-[12px] backdrop-blur-sm"
              >
                {m}
              </li>
            ))}
          </ul>
        </>
      }
    >
      <LoginForm next={next} justReset={reset === "1"} />
    </AuthShell>
  );
}
