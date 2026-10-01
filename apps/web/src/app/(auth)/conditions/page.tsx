import type { Metadata } from "next";
import Link from "next/link";
import { AuthHeading, AuthShell, asideTitle } from "../_components/auth-shell";

export const metadata: Metadata = { title: "Conditions d'utilisation" };

export default function TermsPage() {
  return (
    <AuthShell aside={<p className={asideTitle}>Vos données restent les vôtres.</p>}>
      <AuthHeading title="Conditions d'utilisation" />
      <div className="space-y-4 text-[16px] leading-relaxed text-muted-foreground">
        <p>WINE est édité par Excellence Team. Les données de votre organisation ne sont ni revendues ni partagées.</p>
        <p>Le texte juridique complet sera publié avant l&apos;ouverture commerciale.</p>
      </div>
      <Link href="/inscription" className="mt-8 inline-block text-primary underline underline-offset-4">
        Retour à l&apos;inscription
      </Link>
    </AuthShell>
  );
}
