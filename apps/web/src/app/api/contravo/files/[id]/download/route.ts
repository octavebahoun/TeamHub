import { NextResponse, type NextRequest } from "next/server";
import { files } from "@/lib/contravo";
import { contravoRouteError, requireWineSession } from "@/lib/contravo/route-auth";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  const denied = await requireWineSession();
  if (denied) return denied;
  try {
    const { id } = await params;
    const { url } = await files.getFileDownload(id);
    return NextResponse.redirect(url);
  } catch (e) {
    return contravoRouteError(e);
  }
}
