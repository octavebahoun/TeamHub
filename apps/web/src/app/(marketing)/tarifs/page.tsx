import type { Metadata } from "next";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { MarketingPage } from "../_components/marketing-page";
import { PRICING_ANSWER } from "../bienvenue/content";

export const metadata: Metadata = { title: "Tarifs" };

const PLANS = [
  {
    name: "Essai",
    price: "Gratuit",
    detail: "Créez votre espace et invitez votre équipe pendant la phase de lancement.",
  },
  {
    name: "Équipe",
    price: "Sur devis",
    detail: "Projets, tâches, chat, CRM et facturation Contravo pour les PME en croissance.",
  },
  {
    name: "Entreprise",
    price: "Sur devis",
    detail: "Accompagnement, intégrations et exigences de sécurité renforcées.",
  },
] as const;

export default function TarifsPage() {
  return (
    <MarketingPage
      title="Tarifs"
      lead={
        PRICING_ANSWER ??
        "Les offres commerciales sont en cours de finalisation. Créez votre espace dès maintenant : vous serez prévenu avant tout changement."
      }
    >
      <ul className="grid gap-4 sm:grid-cols-3">
        {PLANS.map((plan) => (
          <li key={plan.name} className="panel-premium rounded-2xl p-5">
            <h2 className="font-heading text-xl text-foreground">{plan.name}</h2>
            <p className="mt-2 text-2xl font-semibold text-primary">{plan.price}</p>
            <p className="mt-3 text-[15px]">{plan.detail}</p>
          </li>
        ))}
      </ul>
      <p>
        Besoin d&apos;une estimation pour votre structure ?{" "}
        <Link href="/contact" className="text-primary underline underline-offset-4">
          Contactez-nous
        </Link>
        .
      </p>
      <Link href="/inscription" className={buttonVariants({ size: "lg" })}>
        Créer mon espace
      </Link>
    </MarketingPage>
  );
}
