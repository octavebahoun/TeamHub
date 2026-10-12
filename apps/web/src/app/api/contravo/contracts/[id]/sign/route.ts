import { NextResponse, type NextRequest } from "next/server";
import { contracts } from "@/lib/contravo";
import { contravoRouteError, requireWineSession } from "@/lib/contravo/route-auth";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Ctx) {
  const denied = await requireWineSession();
  if (denied) return denied;
  try {
    const { id } = await params;
    const body = (await req.json()) as { signerName?: string; signerEmail?: string };
    if (!body.signerName?.trim()) return NextResponse.json({ message: "Nom du signataire requis." }, { status: 422 });
    return NextResponse.json(await contracts.signContract(id, body.signerName.trim(), body.signerEmail));
  } catch (e) {
    return contravoRouteError(e);
  }
}
