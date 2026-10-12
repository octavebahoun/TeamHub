import { NextResponse, type NextRequest } from "next/server";
import { contracts } from "@/lib/contravo";
import { listQueryFromRequest } from "@/lib/contravo/query";
import { contravoRouteError, requireWineSession } from "@/lib/contravo/route-auth";

export async function GET(req: NextRequest) {
  const denied = await requireWineSession();
  if (denied) return denied;
  try {
    return NextResponse.json(await contracts.listContracts(listQueryFromRequest(req)));
  } catch (e) {
    return contravoRouteError(e);
  }
}
