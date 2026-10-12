import { NextResponse, type NextRequest } from "next/server";
import { invoices } from "@/lib/contravo";
import { contravoRouteError, requireWineSession } from "@/lib/contravo/route-auth";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(_req: NextRequest, { params }: Ctx) {
  const denied = await requireWineSession();
  if (denied) return denied;
  try {
    const { id } = await params;
    return NextResponse.json(await invoices.sendInvoiceReminder(id));
  } catch (e) {
    return contravoRouteError(e);
  }
}
