import { NextResponse, type NextRequest } from "next/server";
import { conversations } from "@/lib/contravo";
import { contravoRouteError, requireWineSession } from "@/lib/contravo/route-auth";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Ctx) {
  const denied = await requireWineSession();
  if (denied) return denied;
  try {
    const { id } = await params;
    const { text } = (await req.json()) as { text?: string };
    if (!text?.trim()) return NextResponse.json({ message: "Message vide." }, { status: 422 });
    return NextResponse.json(await conversations.sendConversationMessage(id, text.trim()), { status: 201 });
  } catch (e) {
    return contravoRouteError(e);
  }
}
