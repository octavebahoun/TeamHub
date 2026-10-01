import type { Metadata } from "next";
import { AuthShell, asideTitle } from "../_components/auth-shell";
import { RegisterForm } from "./_components/register-form";

export const metadata: Metadata = { title: "Créer votre espace" };

const STEPS = ["Créez votre compte et votre organisation", "Invitez votre équipe par email", "Lancez votre premier projet"];

export default function RegisterPage() {
  return (
    <AuthShell
      aside={
        <>
          <p className={asideTitle}>
            Votre espace d&apos;équipe
            <br />
            prêt en deux minutes.
          </p>
          <ol className="mt-8 space-y-5">
            {STEPS.map((s, i) => (
              <li key={s} className="flex items-center gap-4 text-[18px]">
                <span aria-hidden className="inline-flex size-9 shrink-0 items-center justify-center rounded-full border-2 border-primary-foreground/80 font-semibold">
                  {i + 1}
                </span>
                {s}
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
