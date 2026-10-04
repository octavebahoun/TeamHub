import { describe, expect, it } from "vitest";
import { billingError, contravoClientPayload, contravoContractPayload, contravoProjectPayload } from "@/lib/contravo/provision";

describe("préparation Contravo", () => {
  it("refuse un client sans email", () => {
    const result = contravoClientPayload({ name: "Amina QA", company: "Atelier QA WINE" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/email/i);
  });

  it("crée une entreprise quand le nom de société est rempli", () => {
    const result = contravoClientPayload({
      name: "Amina QA",
      company: "Atelier QA WINE",
      email: "amina.qa@atelier-qa.test",
      phone: "+229 00 00 00",
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.body.type).toBe("company");
      expect(result.body.displayName).toBe("Atelier QA WINE");
      expect(result.body.email).toBe("amina.qa@atelier-qa.test");
      expect(result.body.notes).toContain("Amina QA");
    }
  });

  it("crée une personne quand il n'y a pas de société", () => {
    const result = contravoClientPayload({ name: "Amina QA", email: "amina.qa@atelier-qa.test" });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.body.type).toBe("individual");
      expect(result.body.displayName).toBe("Amina QA");
    }
  });

  it("reprend le nom, les dates et le statut du projet", () => {
    const body = contravoProjectPayload({
      clientId: "c-atelier",
      name: "Site vitrine QA",
      description: "Page d'accueil",
      status: "in_progress",
      startDate: "2026-10-04T00:00:00.000000Z",
      dueDate: "2026-10-31",
    });
    expect(body).toMatchObject({
      clientId: "c-atelier",
      name: "Site vitrine QA",
      status: "active",
      startDate: "2026-10-04",
      dueDate: "2026-10-31",
      currency: "XOF",
    });
  });

  it("prépare un contrat avec le titre du projet", () => {
    const body = contravoContractPayload({
      projectId: "p-1",
      clientId: "c-1",
      projectName: "Site vitrine QA",
      quoteId: "q-1",
    });
    expect(body.title).toBe("Contrat — Site vitrine QA");
    expect(body.quoteId).toBe("q-1");
    expect(body.bodyMarkdown).toContain("Site vitrine QA");
  });

  it("traduit un refus de droit sur les contrats", () => {
    expect(billingError(new Error("Missing required scope: contracts:write"))).toMatch(/contrats/);
  });
});
