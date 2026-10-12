import type { Metadata } from "next";
import { MarketingPage } from "../_components/marketing-page";
import { ContactForm } from "./_components/contact-form";
import { CONTACT_EMAIL } from "../bienvenue/content";

export const metadata: Metadata = { title: "Contact" };

export default function ContactPage() {
  return (
    <MarketingPage
      title="Contact"
      lead="Une question sur WINE, une démo ou un partenariat ? Écrivez à l'équipe Excellence Team."
    >
      {CONTACT_EMAIL ? (
        <p>
          Vous pouvez aussi nous écrire directement à{" "}
          <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary underline underline-offset-4">
            {CONTACT_EMAIL}
          </a>
          .
        </p>
      ) : (
        <p>
          Aucune adresse publique n&apos;est configurée pour le moment : utilisez le formulaire ci-dessous, nous vous
          répondrons sous 48 h ouvrées.
        </p>
      )}
      <ContactForm />
    </MarketingPage>
  );
}
