import Link from "next/link";
import { WineLogo } from "@/components/common/wine-logo";
import { CONTACT_EMAIL } from "../content";

export function SiteFooter() {
  return (
    <footer className="border-t">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-8 sm:px-8">
        <p className="flex items-baseline gap-2 text-muted-foreground">
          <WineLogo className="[&>span]:text-[22px]" />
          <span>· Un produit Excellence Team</span>
        </p>
        <nav aria-label="Liens légaux">
          <ul className="flex flex-wrap gap-6 text-[15px] text-muted-foreground">
            <li><Link href="/conditions" className="underline underline-offset-4">Mentions légales</Link></li>
            <li><Link href="/conditions#donnees" className="underline underline-offset-4">Confidentialité</Link></li>
            <li>
              <a href={CONTACT_EMAIL ? `mailto:${CONTACT_EMAIL}` : "#faq"} className="underline underline-offset-4">Contact</a>
            </li>
          </ul>
        </nav>
      </div>
    </footer>
  );
}
