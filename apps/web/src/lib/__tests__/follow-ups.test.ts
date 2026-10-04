import { describe, expect, it } from "vitest";
import type { Client, Opportunity } from "@/lib/api/types";
import type { Invoice, Quote } from "@/lib/contravo/types";
import {
  buildCrmItems,
  buildInvoiceItems,
  buildQuoteItems,
  crmNeedsFollowUp,
  draftInvoiceMessage,
  invoiceNeedsFollowUp,
  onlyLinkedDocuments,
  quoteNeedsFollowUp,
  xofFromCents,
} from "@/lib/follow-ups";

const now = new Date("2026-10-04T12:00:00Z");

const invoice = (over: Partial<Invoice>): Invoice =>
  ({
    id: "inv-1",
    organizationId: "org",
    projectId: null,
    clientId: "c1",
    contractId: null,
    number: "FAC-2026-001",
    status: "overdue",
    currency: "XOF",
    subtotalCents: "10000000",
    discountCents: "0",
    taxRateBps: 0,
    taxCents: "0",
    totalCents: "10000000",
    amountPaidCents: "0",
    amountDueCents: "10000000",
    issueDate: "2026-09-01",
    dueDate: "2026-09-15",
    paidAt: null,
    pdfFileId: null,
    notes: null,
    createdAt: "2026-09-01T00:00:00Z",
    updatedAt: "2026-09-01T00:00:00Z",
    ...over,
  }) as Invoice;

const quote = (over: Partial<Quote>): Quote =>
  ({
    id: "q-1",
    organizationId: "org",
    projectId: "p1",
    clientId: "c1",
    number: "DEV-2026-004",
    status: "sent",
    currency: "XOF",
    subtotalCents: "0",
    discountCents: "0",
    taxRateBps: 0,
    taxCents: "0",
    totalCents: "0",
    validUntil: "2026-10-20",
    notes: null,
    terms: null,
    pdfFileId: null,
    sentAt: "2026-09-20T00:00:00Z",
    viewedAt: null,
    acceptedAt: null,
    acceptedByName: null,
    acceptedByEmail: null,
    rejectedAt: null,
    rejectionReason: null,
    pricingMode: null,
    desiredNetCents: null,
    createdAt: "2026-09-20T00:00:00Z",
    updatedAt: "2026-09-20T00:00:00Z",
    ...over,
  }) as Quote;

const opp = (over: Partial<Opportunity>): Opportunity =>
  ({
    id: 3,
    organization_id: 1,
    client_id: 9,
    owner_id: 1,
    project_id: null,
    title: "Site vitrine",
    amount: "500000",
    stage: "proposal",
    next_follow_up: "2026-10-04",
    notes: null,
    closed_at: null,
    created_at: "2026-09-01T00:00:00Z",
    ...over,
  }) as Opportunity;

describe("relances réelles", () => {
  it("convertit les centimes Contravo en FCFA", () => {
    expect(xofFromCents("120000000")).toBe(1_200_000);
  });

  it("ne retient qu'une facture impayée ou en retard", () => {
    expect(invoiceNeedsFollowUp(invoice({ status: "overdue" }), now)).toBe(true);
    expect(invoiceNeedsFollowUp(invoice({ status: "paid" }), now)).toBe(false);
    expect(invoiceNeedsFollowUp(invoice({ status: "sent", dueDate: "2026-10-20" }), now)).toBe(false);
    expect(invoiceNeedsFollowUp(invoice({ status: "sent", dueDate: "2026-09-01" }), now)).toBe(true);
  });

  it("ne retient qu'un devis envoyé ou consulté", () => {
    expect(quoteNeedsFollowUp(quote({ status: "sent" }))).toBe(true);
    expect(quoteNeedsFollowUp(quote({ status: "accepted" }))).toBe(false);
  });

  it("ignore les opportunités gagnées, perdues ou à relancer plus tard", () => {
    expect(crmNeedsFollowUp(opp({ next_follow_up: "2026-10-04" }), now)).toBe(true);
    expect(crmNeedsFollowUp(opp({ next_follow_up: "2026-10-20" }), now)).toBe(false);
    expect(crmNeedsFollowUp(opp({ stage: "won", next_follow_up: "2026-09-01" }), now)).toBe(false);
  });

  it("rédige un message avec le vrai numéro et le vrai montant", () => {
    const msg = draftInvoiceMessage("Atelier Test", "FAC-2026-001", 1_200_000);
    expect(msg).toContain("FAC-2026-001");
    expect(msg).toContain("1 200 000");
    expect(msg).not.toContain("Porto-Novo");
    expect(msg).not.toContain("Maison Akwa");
  });

  it("n'invente aucun client : la liste vient des documents fournis", () => {
    const invoices = buildInvoiceItems([invoice({})], { c1: "Atelier Test" }, now);
    const quotes = buildQuoteItems([quote({})], { c1: "Atelier Test" });
    const clients: Client[] = [{ id: 9, organization_id: 1, owner_id: 1, name: "Awa Test", company: "Atelier Test", email: null, phone: null, notes: null, created_at: "" }];
    const crm = buildCrmItems([opp({})], clients, now);
    expect(invoices[0].client).toBe("Atelier Test");
    expect(quotes[0].client).toBe("Atelier Test");
    expect(crm[0].client).toBe("Atelier Test");
    expect([...invoices, ...quotes, ...crm].map((i) => i.client).join(" ")).not.toMatch(/Porto-Novo|Maison Akwa|Celtiis/);
  });

  it("ignore un devis ou une facture dont le client n'est pas dans l'équipe", () => {
    const linked: Client[] = [
      {
        id: 9,
        organization_id: 1,
        owner_id: 1,
        name: "Amina QA",
        company: "Atelier QA WINE",
        email: null,
        phone: null,
        notes: null,
        created_at: "",
        contravo_client_id: "c-atelier",
      },
    ];
    const keptQuote = quote({ id: "q-atelier", clientId: "c-atelier", number: "DEV-2026-0002" });
    const foreignQuote = quote({ id: "q-acme", clientId: "c-acme", number: "DEV-2026-0001" });
    const keptInvoice = invoice({ id: "inv-atelier", clientId: "c-atelier" });
    const foreignInvoice = invoice({ id: "inv-acme", clientId: "c-acme", number: "FAC-2026-009" });

    expect(onlyLinkedDocuments([keptQuote, foreignQuote], linked).map((q) => q.number)).toEqual(["DEV-2026-0002"]);
    expect(onlyLinkedDocuments([keptInvoice, foreignInvoice], linked).map((i) => i.number)).toEqual(["FAC-2026-001"]);
    expect(onlyLinkedDocuments([foreignQuote], []).map((q) => q.id)).toEqual([]);
  });
});
