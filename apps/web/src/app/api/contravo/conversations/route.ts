import { NextResponse, type NextRequest } from "next/server";
import { conversations } from "@/lib/contravo";
import { contravoRouteError, requireWineSession } from "@/lib/contravo/route-auth";

export async function POST(req: NextRequest) {
  const denied = await requireWineSession();
  if (denied) return denied;
  try {
    const body = (await req.json()) as { clientId?: string; channel?: "whatsapp" | "telegram" };
    if (!body.clientId || (body.channel !== "whatsapp" && body.channel !== "telegram")) {
      return NextResponse.json({ message: "Conversation invalide." }, { status: 422 });
    }
    return NextResponse.json(await conversations.openConversation(body.clientId, body.channel), { status: 201 });
  } catch (e) {
    return contravoRouteError(e);
  }
}

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
