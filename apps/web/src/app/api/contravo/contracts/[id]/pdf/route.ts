import { NextResponse, type NextRequest } from "next/server";
import { contracts } from "@/lib/contravo";
import { billingIssuer, useContravoMocks, useLocalBilling } from "@/lib/contravo/client";
import { renderContractDocument } from "@/lib/contravo/contract-document";
import { contravoRouteError, requireWineSession } from "@/lib/contravo/route-auth";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  const denied = await requireWineSession();
  if (denied) return denied;
  try {
    const { id } = await params;
    if (useContravoMocks() || (await useLocalBilling())) {
      const contract = await contracts.getContract(id);
      const html = renderContractDocument(contract, await billingIssuer());
      return new NextResponse(html, {
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Content-Disposition": `inline; filename="${contract.number}.html"`,
          "Cache-Control": "private, no-store",
        },
      });
    }
    const url = await contracts.getContractPdfDownloadUrl(id);
    const file = await fetch(url, { cache: "no-store" });
    if (!file.ok) return NextResponse.json({ message: "PDF indisponible." }, { status: file.status });
    return new NextResponse(await file.arrayBuffer(), {
      headers: {
        "Content-Type": file.headers.get("content-type") ?? "application/pdf",
        "Content-Disposition": `inline; filename="contrat-${id}.pdf"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (e) {
    return contravoRouteError(e);
  }
}
