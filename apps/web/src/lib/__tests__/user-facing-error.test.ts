import { describe, expect, it } from "vitest";
import { GENERIC_USER_ERROR, userFacingError, userFacingFieldError } from "@/lib/errors/user-facing";

describe("userFacingError", () => {
  it("masque une route manquante", () => {
    expect(userFacingError("Cannot GET /api/contravo/uploads/presign")).toBe(GENERIC_USER_ERROR);
    expect(userFacingError("Route [uploads.presign] not found.")).toBe(GENERIC_USER_ERROR);
    expect(userFacingError(new Error("Contravo 404: Not Found"))).toBe(GENERIC_USER_ERROR);
  });

  it("garde un message métier en français", () => {
    expect(userFacingError("La clé de facturation n'autorise pas la création de clients.")).toMatch(/clé de facturation/);
    expect(userFacingError("Le fichier dépasse la taille maximale de 25 Mo.")).toMatch(/25 Mo/);
  });

  it("traduit une validation anglaise", () => {
    expect(userFacingError("The title field is required.")).toBe("Ce champ est obligatoire.");
    expect(userFacingFieldError("The title field is required.", "title")).toBe("Le titre est obligatoire.");
  });
});
