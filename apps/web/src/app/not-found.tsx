import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { WineLogo } from "@/components/common/wine-logo";

export default function NotFound() {
  return (
    <main id="contenu" className="flex min-h-dvh flex-col items-center justify-center gap-6 px-6 text-center">
      <WineLogo withMark />
      <h1 className="font-heading text-[40px]">Page introuvable</h1>
      <p className="max-w-md text-muted-foreground">Cette page n&apos;existe pas, ou vous n&apos;avez pas les droits pour la voir.</p>
      <Link href="/" className={buttonVariants({ size: "lg" })}>Retour à l&apos;accueil</Link>
    </main>
  );
}
