import type { Metadata } from "next";
import Link from "next/link";
import { AuthHeading, AuthShell, asideTitle } from "../_components/auth-shell";

export const metadata: Metadata = { title: "Mot de passe oublié" };

export default function ForgotPasswordPage() {
  return (
    <AuthShell aside={<p className={asideTitle}>On vous remet sur pied.</p>}>
      <AuthHeading title="Mot de passe oublié" />
      <div className="space-y-4 text-[17px] leading-relaxed text-muted-foreground">
        <p>La réinitialisation par email arrive bientôt.</p>
        <p>En attendant, demandez à un administrateur de votre organisation de vous renvoyer une invitation.</p>
      </div>
      <Link href="/connexion" className="mt-8 inline-block text-primary underline underline-offset-4">
        Retour à la connexion
      </Link>
    </AuthShell>
  );
}
