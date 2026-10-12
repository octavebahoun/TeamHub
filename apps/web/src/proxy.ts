import { NextResponse, type NextRequest } from "next/server";
import { TOKEN_COOKIE } from "@/lib/session";

/**
 * « / » : landing page pour les visiteurs, Accueil pour les connectés (même URL).
 * Seules les zones applicatives exigent un jeton ; le reste (404, pages publiques) passe.
 */
/** Préfixes réservés à l'espace connecté (garde auth). */
const PRIVATE = ["/projets", "/taches", "/crm", "/social", "/analytics", "/recherche", "/parametres", "/profil", "/chat"];

function requiresAuth(pathname: string): boolean {
  return PRIVATE.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const hasToken = req.cookies.has(TOKEN_COOKIE);

  if (pathname === "/" && !hasToken) return NextResponse.rewrite(new URL("/bienvenue", req.url));

  if (requiresAuth(pathname) && !hasToken) {
    const url = new URL("/connexion", req.url);
    url.searchParams.set("next", pathname + search);
    return NextResponse.redirect(url);
  }

  if (hasToken && (pathname === "/connexion" || pathname === "/inscription")) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
}

export const config = {
  // Fichiers statiques + PWA hors auth — sinon manifest / SW → /connexion
  matcher: [
    "/((?!_next/|favicon.ico|manifest\\.webmanifest|sw\\.js|.*\\.(?:png|jpe?g|svg|ico|webp|gif|avif|mp4|webm|woff2?)$).*)",
  ],
};
