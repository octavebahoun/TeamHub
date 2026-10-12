import type { Metadata } from "next";
import Link from "next/link";
import { MarketingPage } from "../_components/marketing-page";

export const metadata: Metadata = { title: "Mentions légales" };

export default function MentionsLegalesPage() {
  return (
    <MarketingPage
      title="Mentions légales"
      lead="Informations relatives à l'éditeur du service WINE et à son hébergement."
    >
      <section className="space-y-4">
        <h2 className="font-heading text-xl text-foreground">Éditeur</h2>
        <p>
          WINE est édité par <strong className="text-foreground">Excellence Team</strong>, société de services numériques
          dédiée aux équipes francophones et ouest-africaines.
        </p>
        <p>
          Contact :{" "}
          <Link href="/contact" className="text-primary underline underline-offset-4">
            formulaire de contact
          </Link>
          .
        </p>
      </section>
      <section className="space-y-4">
        <h2 className="font-heading text-xl text-foreground">Hébergement</h2>
        <p>
          L&apos;application et les données sont hébergées sur une infrastructure cloud sécurisée, avec chiffrement des
          échanges (HTTPS) et sauvegardes régulières.
        </p>
      </section>
      <section className="space-y-4">
        <h2 className="font-heading text-xl text-foreground">Propriété intellectuelle</h2>
        <p>
          Les marques, interfaces, textes et visuels de WINE sont protégés. Toute reproduction non autorisée est
          interdite.
        </p>
      </section>
      <section className="space-y-4">
        <h2 className="font-heading text-xl text-foreground">Signalement</h2>
        <p>
          Pour signaler un contenu illicite ou un dysfonctionnement, utilisez la page{" "}
          <Link href="/contact" className="text-primary underline underline-offset-4">
            Contact
          </Link>
          .
        </p>
      </section>
    </MarketingPage>
  );
}
