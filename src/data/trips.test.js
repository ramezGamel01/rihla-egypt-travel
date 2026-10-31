import { describe, expect, it } from "vitest";
import { addDays, cheapestFare, getTrip, getTrips, parseTripId, seatLabels, seatsLeft, takenSeats } from "./trips.js";
import { ROUTES, findRoute } from "./network.js";
import { filterTrips } from "../pages/Trips.jsx";

const DATE = "2027-03-14";

describe("timetable", () => {
  it("runs every route in both directions", () => {
    ROUTES.forEach((r) => expect(findRoute(r.to, r.from)).not.toBeNull());
  });

  it("gives the same trips for the same search", () => {
    const a = getTrips("CAI", "LXR", DATE).map((t) => t.id);
    const b = getTrips("CAI", "LXR", DATE).map((t) => t.id);
    expect(a).toEqual(b);
    expect(a.length).toBeGreaterThan(3);
  });

  it("orders departures through the day and arrives after leaving", () => {
    const trips = getTrips("CAI", "ALX", DATE);
    const departs = trips.map((t) => t.departAt);
    expect([...departs].sort()).toEqual(departs);
    trips.forEach((t) => expect(new Date(t.arriveAt) > new Date(t.departAt)).toBe(true));
  });

  it("resolves a trip from its id", () => {
    const trip = getTrips("LXR", "ASW", DATE)[2];
    expect(parseTripId(trip.id)).toEqual({ from: "LXR", to: "ASW", date: DATE });
    expect(getTrip(trip.id)).toEqual(trip);
    expect(getTrip("nonsense")).toBeNull();
  });

  it("has no trips where there is no route", () => {
    expect(getTrips("SIW", "ASW", DATE)).toEqual([]);
    expect(cheapestFare("SIW", "ASW", DATE)).toBeNull();
  });

  it("keeps taken seats stable and within the bus", () => {
    const trip = getTrips("CAI", "HRG", DATE)[0];
    const labels = new Set(seatLabels(trip.busClass));
    const taken = takenSeats(trip);
    expect(takenSeats(trip)).toEqual(taken);
    taken.forEach((s) => expect(labels.has(s)).toBe(true));
    expect(seatsLeft(trip)).toBe(labels.size - taken.size);
  });

  it("adds days across month ends", () => {
    expect(addDays("2027-01-31", 1)).toBe("2027-02-01");
    expect(addDays("2027-03-01", -1)).toBe("2027-02-28");
  });
});

describe("filters", () => {
  const trips = getTrips("CAI", "LXR", DATE);

  it("keeps everything with no filters", () => {
    expect(filterTrips(trips, { maxPrice: null, times: [], classes: [], operators: [], amenities: [] })).toHaveLength(trips.length);
  });

  it("filters by price, class and amenities together", () => {
    const max = Math.min(...trips.map((t) => t.price));
    const cheap = filterTrips(trips, { maxPrice: max, times: [], classes: [], operators: [], amenities: [] });
    cheap.forEach((t) => expect(t.price).toBeLessThanOrEqual(max));
    const vipWifi = filterTrips(trips, { maxPrice: null, times: [], classes: ["vip"], operators: [], amenities: ["wifi", "toilet"] });
    vipWifi.forEach((t) => {
      expect(t.busClass).toBe("vip");
      expect(t.amenities).toContain("toilet");
    });
  });
});
