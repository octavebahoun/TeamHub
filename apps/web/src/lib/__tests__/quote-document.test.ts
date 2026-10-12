import { describe, expect, it } from "vitest";
import { renderQuoteDocument } from "@/lib/contravo/quote-document";
import { wineClientRef, wineProjectRef } from "@/lib/contravo/refs";

describe("références de facturation WINE", () => {
  it("aligne les identifiants lus par Laravel", () => {
    expect(wineClientRef(12)).toBe("wine-c-12");
    expect(wineProjectRef(4)).toBe("wine-p-4");
  });
});

describe("devis imprimable", () => {
  it("échappe le HTML et affiche le total en FCFA", () => {
    const html = renderQuoteDocument({
      number: "DEV-2026-0001",
      status: "sent",
      currency: "XOF",
      validUntil: "2026-11-11",
      totalCents: "2000",
      subtotalCents: "2000",
      taxCents: "0",
      notes: "<script>",
      items: [{ description: "Site & logo", quantity: "2", unitPriceCents: "1000", totalCents: "2000" }],
    });
    expect(html).toContain("DEV-2026-0001");
    expect(html).toContain("Mobile Money");
    expect(html).toContain("Site &amp; logo");
    expect(html).not.toContain("<script>");
    expect(html).toContain("WINE");
  });

  it("porte l'émetteur de l'espace et la remise", () => {
    const html = renderQuoteDocument(
      {
        number: "DEV-2026-0001",
        status: "draft",
        currency: "XOF",
        validUntil: "2026-11-11",
        totalCents: "1800",
        subtotalCents: "2000",
        discountCents: "200",
        taxCents: "0",
        notes: null,
      },
      { name: "Espace Test Beta", city: "Cotonou", email: "facturation@beta.test" }
    );
    expect(html).toContain("Espace Test Beta");
    expect(html).toContain("Cotonou");
    expect(html).toContain("Remise");
    expect(html).not.toContain(">WINE<");
  });
});
