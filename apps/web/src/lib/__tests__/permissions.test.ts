import { describe, expect, it } from "vitest";
import { assignableRoles, can, canEditMember } from "@/lib/permissions";

describe("permissions — doc « Parcours par rôle »", () => {
  it("réserve la nomination d'un Admin au Propriétaire", () => {
    expect(assignableRoles("owner")).toContain("admin");
    expect(assignableRoles("admin")).not.toContain("admin");
    expect(assignableRoles("admin")).toEqual(["manager", "member", "guest"]);
  });

  it("ne laisse un Admin modifier ni le Propriétaire ni un autre Admin", () => {
    expect(canEditMember("owner", "admin")).toBe(true);
    expect(canEditMember("admin", "admin")).toBe(false);
    expect(canEditMember("admin", "member")).toBe(true);
    expect(canEditMember("admin", "owner")).toBe(false);
    expect(canEditMember("manager", "member")).toBe(false);
  });

  it("cache le fil Social à l'Invité seulement", () => {
    expect(can("guest", "social.view")).toBe(false);
    expect(can("member", "social.view")).toBe(true);
  });

  it("cache CRM et Analytics au Membre et à l'Invité", () => {
    for (const role of ["member", "guest"] as const) {
      expect(can(role, "crm.view")).toBe(false);
      expect(can(role, "analytics.view")).toBe(false);
    }
    expect(can("manager", "crm.view")).toBe(true);
  });
});
