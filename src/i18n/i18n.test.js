import { describe, expect, it } from "vitest";
import { makeFormat, makeTranslator } from "./I18n.jsx";
import { STRINGS } from "./strings.js";

describe("translations", () => {
  it("has every English key in Arabic", () => {
    const missing = Object.keys(STRINGS.en).filter((k) => !(k in STRINGS.ar));
    expect(missing).toEqual([]);
  });

  it("uses Arabic plural forms", () => {
    const t = makeTranslator("ar");
    expect(t("trips.count", { n: 1 })).toBe("رحلة واحدة");
    expect(t("trips.count", { n: 2 })).toBe("رحلتان");
    expect(t("trips.count", { n: 5 })).toBe("٥ رحلات");
    expect(t("trips.count", { n: 12 })).toBe("١٢ رحلة");
  });

  it("fills in values and plurals in English", () => {
    const t = makeTranslator("en");
    expect(t("trips.count", { n: 1 })).toBe("1 trip");
    expect(t("trips.title", { from: "Cairo", to: "Luxor" })).toBe("Cairo to Luxor");
  });

  it("formats durations and money for each language", () => {
    expect(makeFormat("en").duration(570)).toBe("9h 30m");
    expect(makeFormat("en").duration(180)).toBe("3h");
    expect(makeFormat("ar").duration(570)).toBe("٩ س ٣٠ د");
    expect(makeFormat("en").money(450)).toMatch(/450/);
  });
});
