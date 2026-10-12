import { NextResponse, type NextRequest } from "next/server";
import { quotes } from "@/lib/contravo";
import { listQueryFromRequest } from "@/lib/contravo/query";
import { contravoRouteError, requireWineSession } from "@/lib/contravo/route-auth";
import type { CreateQuote } from "@/lib/contravo/types";

export async function GET(req: NextRequest) {
  const denied = await requireWineSession();
  if (denied) return denied;
  try {
    const rows = await quotes.listQuotes(listQueryFromRequest(req));
    return NextResponse.json(rows);
  } catch (e) {
    return contravoRouteError(e);
  }
}

export async function POST(req: NextRequest) {
  const denied = await requireWineSession();
  if (denied) return denied;
  try {
    const body = (await req.json()) as CreateQuote;
    const quote = await quotes.createQuote(body);
    return NextResponse.json(quote, { status: 201 });
  } catch (e) {
    return contravoRouteError(e);
  }
}
