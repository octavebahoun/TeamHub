import { describe, expect, it } from "vitest";
import { resolveDownloadHref, uploadDownloadAllowed } from "@/lib/uploads/client";

describe("uploads", () => {
  it("n'autorise jamais le téléchargement d'un fichier infecté", () => {
    expect(uploadDownloadAllowed("infected")).toBe(false);
    expect(
      resolveDownloadHref({
        status: "infected",
        download_url: "/api/contravo/uploads/evil/download",
      })
    ).toBeNull();
  });

  it("autorise le lien pour les statuts clean et ready", () => {
    expect(resolveDownloadHref({ status: "ready", download_url: "/dl/1" })).toBe("/dl/1");
    expect(resolveDownloadHref({ status: "clean", download_url: "/dl/2" })).toBe("/dl/2");
    expect(resolveDownloadHref({ status: "scanning", download_url: "/dl/3" })).toBeNull();
  });
});
