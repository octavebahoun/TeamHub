import { describe, expect, it } from "vitest";
import { downloadUrl, getDownloadUrl } from "@/lib/api/files";
import { mockAttachments } from "@/lib/data/mocks/files";
import type { Attachment, AttachmentStatus } from "@/lib/data/types";

const file = (status: AttachmentStatus, id = "test-file"): Attachment => ({
  id,
  organization_id: 1,
  name: "document.pdf",
  mime: "application/pdf",
  size: 1024,
  status,
  project_id: 201,
  client_id: 101,
  uploaded_by: 1,
  uploaded_at: "2026-10-01T00:00:00Z",
  scan_finished_at: null,
  scan_message: null,
});

describe("downloadUrl", () => {
  it("ne renvoie jamais d'URL pour un fichier infecté", () => {
    expect(downloadUrl(file("infected"))).toBeNull();
    const infected = mockAttachments.find((a) => a.status === "infected");
    expect(infected).toBeDefined();
    expect(downloadUrl(infected!)).toBeNull();
  });

  it("refuse pending et scanning", () => {
    expect(downloadUrl(file("pending"))).toBeNull();
    expect(downloadUrl(file("scanning"))).toBeNull();
  });

  it("autorise clean et ready", () => {
    expect(downloadUrl(file("clean"))).toMatch(/\/download$|\/mock\/fichiers\//);
    expect(downloadUrl(file("ready"))).toMatch(/\/download$|\/mock\/fichiers\//);
  });
});

describe("getDownloadUrl", () => {
  it("renvoie null pour l'identifiant infecté du jeu de démo", async () => {
    await expect(getDownloadUrl("att-infected-1")).resolves.toBeNull();
  });
});
