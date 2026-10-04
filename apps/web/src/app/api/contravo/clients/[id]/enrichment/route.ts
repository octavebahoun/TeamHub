import { NextResponse, type NextRequest } from "next/server";
import { clients } from "@/lib/contravo";
import { contravoRouteError, requireWineSession } from "@/lib/contravo/route-auth";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  const denied = await requireWineSession();
  if (denied) return denied;
  try {
    const { id } = await params;
    const [quoteRows, invoiceRows, projects] = await Promise.all([
      clients.listClientQuotes(id),
      clients.listClientInvoices(id),
      clients.listClientProjects(id),
    ]);
    const ca = invoiceRows.filter((i) => i.status === "paid" || i.status === "partial").reduce((s, i) => s + Number(i.amountPaidCents), 0);
    const balance = invoiceRows.reduce((s, i) => s + Number(i.amountDueCents), 0);
    return NextResponse.json({
      quotes: quoteRows,
      invoices: invoiceRows,
      projects: projects.map((p) => ({ id: p.id, name: p.name, status: p.status, budgetCents: p.budgetCents })),
      stats: { caCents: String(ca), quotesCount: quoteRows.length, projectsCount: projects.length, balanceDueCents: String(balance) },
    });
  } catch (e) {
    return contravoRouteError(e);
  }
}
