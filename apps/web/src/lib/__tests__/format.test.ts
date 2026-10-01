import { describe, expect, it } from "vitest";
import { compactMoney, dueLabel, initials, isOverdue, longToday, money, plural } from "@/lib/format";

const NOW = new Date("2026-10-01T09:00:00");

describe("format", () => {
  it("formate les montants en FCFA avec espaces simples", () => {
    expect(money("1200000.00")).toBe("1 200 000 FCFA");
    expect(money(null)).toBe("0 FCFA");
    expect(compactMoney(6_950_000)).toBe("6,95 M");
  });
  it("donne des échéances relatives lisibles", () => {
    expect(dueLabel("2026-09-30", NOW)).toBe("Hier");
    expect(dueLabel("2026-10-01", NOW)).toBe("Aujourd'hui");
    expect(dueLabel("2026-10-02", NOW)).toBe("Demain");
    expect(dueLabel("2026-10-05", NOW)).toMatch(/^Lun\.? 5 oct\.?$/);
    expect(dueLabel(null, NOW)).toBe("Sans échéance");
    expect(isOverdue("2026-09-30", NOW)).toBe(true);
  });
  it("écrit la date du jour à la française", () => {
    expect(longToday(NOW)).toBe("Jeudi 1er octobre");
  });
  it("calcule initiales et pluriels", () => {
    expect(initials("Octave Bahoun")).toBe("OB");
    expect(initials("Aïcha")).toBe("AÏ");
    expect(plural(1, "tâche", "tâches")).toBe("1 tâche");
    expect(plural(3, "tâche", "tâches")).toBe("3 tâches");
  });
});
