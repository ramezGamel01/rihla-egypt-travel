// Bookings live in localStorage. Components subscribe with useBookings(), so a
// booking made or cancelled in one tab shows up everywhere.
import { useSyncExternalStore } from "react";
import { store } from "../lib/storage.js";
import { seeded } from "../lib/random.js";

const KEY = "rihla:bookings:v1";
const listeners = new Set();
let cache = null;

function read() {
  if (!cache) cache = store.getJSON(KEY, []);
  return cache;
}

function write(next) {
  cache = next;
  store.setJSON(KEY, next);
  listeners.forEach((fn) => fn());
}

if (typeof window !== "undefined") {
  window.addEventListener("storage", (event) => {
    if (event.key !== KEY) return;
    cache = null;
    listeners.forEach((fn) => fn());
  });
}

function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function useBookings() {
  return useSyncExternalStore(subscribe, read, () => []);
}

export function getBooking(ref) {
  return read().find((b) => b.ref === ref) ?? null;
}

// Six characters, no look-alikes (0/O, 1/I)
export function makeRef(seed = `${Date.now()}-${Math.random()}`) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const rand = seeded(seed);
  return `RH-${Array.from({ length: 6 }, () => alphabet[Math.floor(rand() * alphabet.length)]).join("")}`;
}

export function addBooking(booking) {
  const full = { ...booking, ref: booking.ref ?? makeRef(), status: "confirmed", createdAt: new Date().toISOString() };
  write([full, ...read()]);
  return full;
}

export function cancelBooking(ref) {
  write(read().map((b) => (b.ref === ref ? { ...b, status: "cancelled", cancelledAt: new Date().toISOString() } : b)));
}

export function bookingState(booking, now = new Date()) {
  if (booking.status === "cancelled") return "cancelled";
  return new Date(booking.arriveAt) < now ? "past" : "upcoming";
}

// Seats already booked by this visitor, so they show as taken on the seat map
export function seatsBookedOn(tripId) {
  return read()
    .filter((b) => b.tripId === tripId && b.status !== "cancelled")
    .flatMap((b) => b.seats);
}

export function _resetBookings() {
  cache = null;
  store.remove(KEY);
}
