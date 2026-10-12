import { NextResponse, type NextRequest } from "next/server";
import { ORG_COOKIE, TOKEN_COOKIE } from "@/lib/session";

/** Session expirée ou révoquée : on efface les cookies puis on renvoie vers la connexion. */
export function GET(req: NextRequest) {
  const url = new URL("/connexion", req.url);
  const next = req.nextUrl.searchParams.get("next");
  if (next?.startsWith("/") && !next.startsWith("//")) url.searchParams.set("next", next);
  const res = NextResponse.redirect(url);
  res.cookies.delete(TOKEN_COOKIE);
  res.cookies.delete(ORG_COOKIE);
  return res;
}
