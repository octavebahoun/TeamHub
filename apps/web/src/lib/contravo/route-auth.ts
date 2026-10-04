import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { userFacingError } from "@/lib/errors/user-facing";
import { TOKEN_COOKIE } from "@/lib/session";

/** Refuse les appels API Contravo sans session WINE (clé Contravo reste côté serveur). */
export async function requireWineSession(): Promise<NextResponse | null> {
  const jar = await cookies();
  if (!jar.get(TOKEN_COOKIE)?.value) {
    return NextResponse.json({ message: "Non authentifié." }, { status: 401 });
  }
  return null;
}

export function contravoRouteError(e: unknown): NextResponse {
  const message = e instanceof Error ? e.message : "Erreur Contravo.";
  const match = message.match(/^Contravo (\d+): (.+)$/);
  if (match) {
    return NextResponse.json({ message: userFacingError(match[2]) }, { status: Number(match[1]) });
  }
  return NextResponse.json({ message: userFacingError(message) }, { status: 500 });
}
