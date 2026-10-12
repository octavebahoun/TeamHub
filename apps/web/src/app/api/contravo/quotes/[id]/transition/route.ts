import { NextResponse, type NextRequest } from "next/server";
import { quotes } from "@/lib/contravo";
import { contravoRouteError, requireWineSession } from "@/lib/contravo/route-auth";
import type { QuoteTransition } from "@/lib/contravo/types";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Ctx) {
  const denied = await requireWineSession();
  if (denied) return denied;
  try {
    const { id } = await params;
    const body = (await req.json()) as QuoteTransition;
    return NextResponse.json(await quotes.transitionQuote(id, body));
  } catch (e) {
    return contravoRouteError(e);
  }
}
