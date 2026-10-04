import { NextResponse, type NextRequest } from "next/server";
import { contracts } from "@/lib/contravo";
import { listQueryFromRequest } from "@/lib/contravo/query";
import { contravoRouteError, requireWineSession } from "@/lib/contravo/route-auth";
import type { CreateContract } from "@/lib/contravo/types";

export async function GET(req: NextRequest) {
  const denied = await requireWineSession();
  if (denied) return denied;
  try {
    return NextResponse.json(await contracts.listContracts(listQueryFromRequest(req)));
  } catch (e) {
    return contravoRouteError(e);
  }
}

export async function POST(req: NextRequest) {
  const denied = await requireWineSession();
  if (denied) return denied;
  try {
    const body = (await req.json()) as CreateContract;
    const contract = await contracts.createContract(body);
    return NextResponse.json(contract, { status: 201 });
  } catch (e) {
    return contravoRouteError(e);
  }
}
