import { beforeEach, describe, expect, it } from "vitest";
import { _resetBookings, addBooking, bookingState, cancelBooking, getBooking, makeRef, seatsBookedOn } from "./bookings.js";

const base = { tripId: "CAI-LXR-20270314-0730-nile", seats: ["A1", "A2"], departAt: "2027-03-14T07:30:00Z", arriveAt: "2027-03-14T17:00:00Z" };

describe("bookings", () => {
  beforeEach(() => _resetBookings());

  it("makes readable references", () => {
    expect(makeRef("seed")).toMatch(/^RH-[A-HJ-NP-Z2-9]{6}$/);
    expect(makeRef("seed")).toBe(makeRef("seed"));
  });

  it("saves a booking and finds it again", () => {
    const b = addBooking(base);
    expect(getBooking(b.ref)).toMatchObject({ status: "confirmed", seats: ["A1", "A2"] });
    expect(JSON.parse(localStorage.getItem("rihla:bookings:v1"))).toHaveLength(1);
  });

  it("releases seats when a booking is cancelled", () => {
    const b = addBooking(base);
    expect(seatsBookedOn(base.tripId)).toEqual(["A1", "A2"]);
    cancelBooking(b.ref);
    expect(getBooking(b.ref).status).toBe("cancelled");
    expect(seatsBookedOn(base.tripId)).toEqual([]);
  });

  it("sorts bookings into upcoming, past and cancelled", () => {
    const b = addBooking(base);
    expect(bookingState(b, new Date("2027-01-01"))).toBe("upcoming");
    expect(bookingState(b, new Date("2027-04-01"))).toBe("past");
    expect(bookingState({ ...b, status: "cancelled" })).toBe("cancelled");
  });
});
