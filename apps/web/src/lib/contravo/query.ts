import type { NextRequest } from "next/server";
import type { ListQuery } from "./types";

export function listQueryFromRequest(req: NextRequest): ListQuery {
  const sp = req.nextUrl.searchParams;
  return {
    page: sp.get("page") ? Number(sp.get("page")) : undefined,
    limit: sp.get("limit") ? Number(sp.get("limit")) : undefined,
    projectId: sp.get("projectId") ?? undefined,
    clientId: sp.get("clientId") ?? undefined,
    status: sp.get("status") ?? undefined,
  };
}
