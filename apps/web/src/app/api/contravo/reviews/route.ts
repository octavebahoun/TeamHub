import { NextResponse } from "next/server";
import { files } from "@/lib/contravo";
import { contravoRouteError, requireWineSession } from "@/lib/contravo/route-auth";

export async function GET() {
  const denied = await requireWineSession();
  if (denied) return denied;
  try {
    return NextResponse.json(await files.listReviews());
  } catch (e) {
    return contravoRouteError(e);
  }
}
