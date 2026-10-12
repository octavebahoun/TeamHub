import type { Metadata } from "next";
import { AuthShell, asideTitle } from "../_components/auth-shell";
import { RegisterForm } from "./_components/register-form";

export const metadata: Metadata = { title: "Créer votre espace" };

const STEPS = ["Créez votre compte et votre organisation", "Invitez votre équipe par email", "Lancez votre premier projet"];

export default function RegisterPage() {
  return (
    <AuthShell
      illustration="register"
      aside={
        <>
          <p className="mb-2 text-[11px] font-semibold tracking-[0.16em] text-primary-foreground/75 uppercase">
            Démarrage rapide
          </p>
          <p className={asideTitle}>
            Votre espace d&apos;équipe
            <br />
            prêt en deux minutes.
          </p>
          <ol className="mt-5 space-y-2.5">
            {STEPS.map((s, i) => (
              <li key={s} className="flex items-start gap-3 text-[14px]">
                <span
                  aria-hidden
                  className="inline-flex size-7 shrink-0 items-center justify-center rounded-full border border-white/40 bg-white/15 text-sm font-semibold"
                >
                  {i + 1}
                </span>
                <span className="pt-0.5 text-primary-foreground/95">{s}</span>
              </li>
            ))}
          </ol>
        </>
      }
    >
      <RegisterForm />
    </AuthShell>
  );
}
