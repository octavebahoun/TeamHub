import { NextResponse, type NextRequest } from "next/server";
import { invoices } from "@/lib/contravo";
import { contravoRouteError, requireWineSession } from "@/lib/contravo/route-auth";
import type { InvoiceTransition } from "@/lib/contravo/types";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Ctx) {
  const denied = await requireWineSession();
  if (denied) return denied;
  try {
    const { id } = await params;
    const body = (await req.json()) as InvoiceTransition;
    return NextResponse.json(await invoices.transitionInvoice(id, body));
  } catch (e) {
    return contravoRouteError(e);
  }
}
