import { describe, expect, it } from "vitest";
import { fundingMessage } from "@/lib/funding";

describe("financement", () => {
  it("ne dit pas qu'un projet est payé s'il n'a pas de facture", () => {
    expect(fundingMessage(false)).toEqual({
      label: "Pas encore de facture",
      detail: "Aucune facture n'est liée à ce projet.",
    });
  });

  it("parle de la facture seulement quand elle est liée", () => {
    const message = fundingMessage(true);
    expect(message.label).toBe("Facture enregistrée");
    expect(message.detail).not.toMatch(/OK|débloqué/i);
  });
});
