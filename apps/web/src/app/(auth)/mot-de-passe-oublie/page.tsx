import type { Metadata } from "next";
import { AuthShell, asideTitle } from "../_components/auth-shell";
import { ForgotForm } from "./_components/forgot-form";

export const metadata: Metadata = { title: "Mot de passe oublié" };

export default function ForgotPasswordPage() {
  return (
    <AuthShell aside={<p className={asideTitle}>On vous remet sur pied.</p>}>
      <ForgotForm />
    </AuthShell>
  );
}
