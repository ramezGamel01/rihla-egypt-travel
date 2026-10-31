import { describe, expect, it } from "vitest";
import { formatCardNumber, formatExpiry, isEgyptianMobile, isEmail, isFullName, isFutureExpiry, luhn, normalizePhone } from "./validate.js";
import { priceBreakdown, promoRate, toggleSeat } from "./pricing.js";
import { bookingToIcs } from "./ics.js";

describe("validation", () => {
  it("accepts full names in Arabic and English", () => {
    expect(isFullName("Ramez Gamel")).toBe(true);
    expect(isFullName("رامز جميل")).toBe(true);
    expect(isFullName("Ramez")).toBe(false);
    expect(isFullName("R G")).toBe(false);
  });

  it("checks Egyptian mobile numbers in any common format", () => {
    expect(isEgyptianMobile("010 1234 5678")).toBe(true);
    expect(isEgyptianMobile("+20 112 345 6789")).toBe(true);
    expect(isEgyptianMobile("٠١٠١٢٣٤٥٦٧٨")).toBe(true);
    expect(isEgyptianMobile("0131234567")).toBe(false);
    expect(normalizePhone("+201012345678")).toBe("01012345678");
  });

  it("checks emails", () => {
    expect(isEmail("ramez@example.com")).toBe(true);
    expect(isEmail("ramez@example")).toBe(false);
  });

  it("checks card numbers and expiry dates", () => {
    expect(luhn("4242 4242 4242 4242")).toBe(true);
    expect(luhn("4242 4242 4242 4241")).toBe(false);
    expect(isFutureExpiry("12/30", new Date("2027-01-01"))).toBe(true);
    expect(isFutureExpiry("01/26", new Date("2027-01-01"))).toBe(false);
    expect(isFutureExpiry("13/30")).toBe(false);
  });

  it("formats card fields as you type", () => {
    expect(formatCardNumber("4242424242424242")).toBe("4242 4242 4242 4242");
    expect(formatExpiry("1230")).toBe("12/30");
  });
});

describe("pricing", () => {
  it("adds the service fee per seat", () => {
    expect(priceBreakdown(400, 2)).toEqual({ subtotal: 800, fee: 30, discount: 0, total: 830 });
  });

  it("applies the promo code to the fare only", () => {
    expect(promoRate(" rihla10 ")).toBe(0.1);
    expect(priceBreakdown(400, 2, "RIHLA10")).toEqual({ subtotal: 800, fee: 30, discount: 80, total: 750 });
    expect(priceBreakdown(400, 2, "NOPE").discount).toBe(0);
  });

  it("limits seats to the number of passengers", () => {
    expect(toggleSeat([], "A1", 2)).toEqual(["A1"]);
    expect(toggleSeat(["A1", "A2"], "A3", 2)).toEqual(["A1", "A2"]);
    expect(toggleSeat(["A1", "A2"], "A1", 2)).toEqual(["A2"]);
    expect(toggleSeat([], "B1", 2, new Set(["B1"]))).toEqual([]);
  });
});

describe("calendar export", () => {
  it("writes a valid event", () => {
    const ics = bookingToIcs({ ref: "RH-ABC123", departAt: "2027-03-14T07:30:00.000Z", arriveAt: "2027-03-14T17:00:00.000Z", title: "Cairo → Luxor", location: "Cairo", description: "Seats A1, A2" });
    expect(ics).toContain("DTSTART:20270314T073000Z");
    expect(ics).toContain("UID:RH-ABC123@rihla");
    expect(ics).toContain("Seats A1\\, A2");
  });
});
