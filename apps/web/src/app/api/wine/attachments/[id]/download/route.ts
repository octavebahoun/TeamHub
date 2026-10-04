import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { userFacingError } from "@/lib/errors/user-facing";
import { ORG_COOKIE, TOKEN_COOKIE } from "@/lib/session";

const API_URL = (process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api").replace(/\/$/, "");

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const jar = await cookies();
  const token = jar.get(TOKEN_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ message: "Non authentifié." }, { status: 401 });
  }

  const { id } = await params;
  const org = jar.get(ORG_COOKIE)?.value;
  const res = await fetch(`${API_URL}/v1/attachments/${encodeURIComponent(id)}/download`, {
    headers: {
      Accept: "*/*",
      Authorization: `Bearer ${token}`,
      ...(org ? { "X-Organization-Id": org } : {}),
    },
    cache: "no-store",
  });

  const contentType = res.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    const data = (await res.json().catch(() => null)) as { contravo_file_id?: string; message?: string } | null;
    if (data?.contravo_file_id) {
      return NextResponse.redirect(new URL(`/api/contravo/files/${encodeURIComponent(data.contravo_file_id)}/download`, request.url));
    }
    return NextResponse.json({ message: userFacingError(data?.message) }, { status: res.status || 500 });
  }

  return new NextResponse(res.body, {
    status: res.status,
    headers: {
      "Content-Type": contentType || "application/octet-stream",
      "Content-Disposition": res.headers.get("content-disposition") ?? "attachment",
    },
  });
}
