import { NextResponse, type NextRequest } from "next/server";
import { TOKEN_COOKIE } from "@/lib/session";

/** Redirige vers /connexion toute page privée sans jeton, et inversement. */
const PUBLIC = ["/connexion", "/inscription", "/invitation", "/mot-de-passe-oublie", "/conditions", "/deconnexion"];

export function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const isPublic = PUBLIC.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  const hasToken = req.cookies.has(TOKEN_COOKIE);

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
  matcher: ["/((?!_next/|favicon.ico|.*\\.(?:png|jpg|svg|ico|webp|woff2?)$).*)"],
};
