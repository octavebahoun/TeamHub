import type { Metadata } from "next";
import Link from "next/link";
import { MarketingPage } from "../_components/marketing-page";

export const metadata: Metadata = { title: "Confidentialité" };

export default function ConfidentialitePage() {
  return (
    <MarketingPage
      title="Politique de confidentialité"
      lead="Comment WINE traite les données de votre organisation et de vos utilisateurs."
    >
      <section className="space-y-4">
        <h2 className="font-heading text-xl text-foreground">Données collectées</h2>
        <p>
          Nous traitons les informations nécessaires au fonctionnement du service : compte utilisateur (nom, email),
          contenu créé dans votre espace (projets, tâches, messages, fichiers, CRM) et journaux techniques limités à la
          sécurité et au support.
        </p>
      </section>
      <section className="space-y-4">
        <h2 className="font-heading text-xl text-foreground">Isolation par organisation</h2>
        <p>
          Chaque organisation dispose d&apos;un espace isolé. Les données d&apos;une équipe ne sont ni mélangées ni
          revendues à des tiers. Seuls les membres autorisés de votre organisation y accèdent.
        </p>
      </section>
      <section className="space-y-4">
        <h2 className="font-heading text-xl text-foreground">Finalités</h2>
        <ul className="list-disc space-y-2 pl-5">
          <li>Fourniture et amélioration du service WINE ;</li>
          <li>Authentification, invitations et notifications utiles au travail ;</li>
          <li>Support client et respect des obligations légales.</li>
        </ul>
      </section>
      <section className="space-y-4">
        <h2 className="font-heading text-xl text-foreground">Conservation et droits</h2>
        <p>
          Les données sont conservées tant que votre compte ou votre organisation est active, puis supprimées ou
          anonymisées selon les délais légaux. Vous pouvez demander l&apos;accès, la rectification ou la suppression en
          nous contactant via la page{" "}
          <Link href="/contact" className="text-primary underline underline-offset-4">
            Contact
          </Link>
          .
        </p>
      </section>
      <section className="space-y-4">
        <h2 className="font-heading text-xl text-foreground">Cookies</h2>
        <p>
          WINE utilise des cookies strictement nécessaires à la session et à vos préférences (thème, organisation
          courante). Aucun cookie publicitaire tiers n&apos;est déposé par défaut.
        </p>
      </section>
    </MarketingPage>
  );
}
