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
          <p className={asideTitle}>Projets, tâches, échanges et clients au même endroit.</p>
          <p className="mt-3 max-w-md text-[15px] leading-relaxed text-primary-foreground/90 xl:text-[16px]">
            Votre équipe arrête de jongler entre WhatsApp, Excel et les carnets.
          </p>
          <ul className="mt-4 flex flex-wrap gap-1.5" aria-label="Modules">
            {MODULES.map((m) => (
              <li
                key={m}
                className="rounded-full border border-primary-foreground/65 bg-white/10 px-2.5 py-1 text-[12px] backdrop-blur-sm xl:text-[13px]"
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
