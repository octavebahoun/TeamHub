import type { Metadata } from "next";
import Link from "next/link";
import { AuthHeading, AuthShell, asideTitle } from "../_components/auth-shell";

export const metadata: Metadata = { title: "Conditions d'utilisation" };

export default function TermsPage() {
  return (
    <AuthShell aside={<p className={asideTitle}>Vos données restent les vôtres.</p>}>
      <AuthHeading title="Conditions d'utilisation" />
      <div className="space-y-4 text-[16px] leading-relaxed text-muted-foreground">
        <p>WINE est édité par Excellence Team. En créant un compte, vous acceptez d&apos;utiliser le service de manière légale et loyale.</p>
        <p id="donnees">
          Les données de votre organisation sont isolées des autres organisations ; elles ne sont ni revendues ni partagées.
          Le détail figure dans la{" "}
          <Link href="/confidentialite" className="text-primary underline underline-offset-4">
            politique de confidentialité
          </Link>
          .
        </p>
        <p>
          Les{" "}
          <Link href="/mentions-legales" className="text-primary underline underline-offset-4">
            mentions légales
          </Link>{" "}
          complètent ce document. Le texte juridique définitif sera publié avant l&apos;ouverture commerciale.
        </p>
      </div>
      <Link href="/inscription" className="mt-8 inline-block text-primary underline underline-offset-4">
        Retour à l&apos;inscription
      </Link>
    </AuthShell>
  );
}
