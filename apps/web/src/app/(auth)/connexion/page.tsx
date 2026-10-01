import type { Metadata } from "next";
import { AuthShell, asideTitle } from "../_components/auth-shell";
import { LoginForm } from "./_components/login-form";

export const metadata: Metadata = { title: "Connexion" };

const MODULES = ["Projets", "Tâches", "Chat", "Social", "Analytics", "CRM"];

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return (
    <AuthShell
      aside={
        <>
          <p className={asideTitle}>Projets, tâches, échanges et clients au même endroit.</p>
          <p className="mt-6 max-w-xl text-[19px] leading-relaxed">Votre équipe arrête de jongler entre WhatsApp, Excel et les carnets.</p>
          <ul className="mt-8 flex flex-wrap gap-3" aria-label="Modules">
            {MODULES.map((m) => (
              <li key={m} className="rounded-full border border-primary-foreground/80 px-4 py-1.5 text-[15px]">
                {m}
              </li>
            ))}
          </ul>
        </>
      }
    >
      <LoginForm next={next} />
    </AuthShell>
  );
}
