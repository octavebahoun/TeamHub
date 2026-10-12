import { NextResponse, type NextRequest } from "next/server";
import { quotes } from "@/lib/contravo";
import { billingIssuer, useContravoMocks, useLocalBilling } from "@/lib/contravo/client";
import { renderQuoteDocument } from "@/lib/contravo/quote-document";
import { contravoRouteError, requireWineSession } from "@/lib/contravo/route-auth";

type Ctx = { params: Promise<{ id: string }> };

async function oneFile(body: BodyInit, contentType: string, filename: string) {
  return new NextResponse(body, {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `inline; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}

export async function GET(_req: NextRequest, { params }: Ctx) {
  const denied = await requireWineSession();
  if (denied) return denied;
  try {
    const { id } = await params;
    if (useContravoMocks() || (await useLocalBilling())) {
      const quote = await quotes.getQuote(id);
      const html = renderQuoteDocument(quote, await billingIssuer());
      return oneFile(html, "text/html; charset=utf-8", `${quote.number}.html`);
    }
    const url = await quotes.getQuotePdfDownloadUrl(id);
    const file = await fetch(url, { cache: "no-store" });
    if (!file.ok) return NextResponse.json({ message: "PDF indisponible." }, { status: file.status });
    const bytes = await file.arrayBuffer();
    return oneFile(bytes, file.headers.get("content-type") ?? "application/pdf", `devis-${id}.pdf`);
  } catch (e) {
    return contravoRouteError(e);
  }
}
