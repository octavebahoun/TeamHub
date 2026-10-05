import { NextResponse, type NextRequest } from "next/server";
import { TOKEN_COOKIE } from "@/lib/session";

/**
 * « / » : landing page pour les visiteurs, Accueil pour les connectés (même URL).
 * Toute autre page privée sans jeton redirige vers /connexion, et inversement.
 */
const PUBLIC = ["/bienvenue", "/connexion", "/inscription", "/invitation", "/mot-de-passe-oublie", "/conditions", "/deconnexion", "/verifier-signature"];

export function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const isPublic = PUBLIC.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  const hasToken = req.cookies.has(TOKEN_COOKIE);

  if (pathname === "/" && !hasToken) return NextResponse.rewrite(new URL("/bienvenue", req.url));
  if (!isPublic && !hasToken) {
    const url = new URL("/connexion", req.url);
    if (pathname !== "/") url.searchParams.set("next", pathname + search);
    return NextResponse.redirect(url);
  }
  if (hasToken && (pathname === "/connexion" || pathname === "/inscription")) {
    return NextResponse.redirect(new URL("/", req.url));
  }
  return NextResponse.next();
}

export const config = {
  // Fichiers statiques (images, polices, vidéos) hors auth — sinon /videos/*.mp4 → /connexion
  matcher: ["/((?!_next/|favicon.ico|.*\\.(?:png|jpe?g|svg|ico|webp|gif|avif|mp4|webm|woff2?)$).*)"],
};
