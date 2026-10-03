import { NextResponse, type NextRequest } from "next/server";
import { conversations } from "@/lib/contravo";
import { contravoRouteError, requireWineSession } from "@/lib/contravo/route-auth";

export async function GET(req: NextRequest) {
  const denied = await requireWineSession();
  if (denied) return denied;
  try {
    const clientId = req.nextUrl.searchParams.get("clientId") ?? undefined;
    return NextResponse.json(await conversations.listConversations({ clientId }));
  } catch (e) {
    return contravoRouteError(e);
  }
}
