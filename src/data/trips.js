// Generates the timetable. Trips are derived from the route, the date and a seed,
// so a trip id always resolves to the same departure, price and taken seats.
import { BUS_CLASSES, OPERATORS, OPERATOR_BY_ID, findRoute } from "./network.js";
import { pick, seeded } from "../lib/random.js";

const DEPARTURES = [360, 420, 480, 570, 660, 780, 900, 1020, 1140, 1260, 1380];

export function toDateKey(date) {
  const d = typeof date === "string" ? new Date(`${date}T00:00:00`) : date;
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

export function addDays(dateKey, days) {
  const d = new Date(`${dateKey}T00:00:00`);
  d.setDate(d.getDate() + days);
  return toDateKey(d);
}

export function todayKey() {
  return toDateKey(new Date());
}

function roundTo(value, step) {
  return Math.round(value / step) * step;
}

export function seatLabels(busClass) {
  const { rows, seats } = BUS_CLASSES[busClass].layout;
  const labels = [];
  for (let r = 0; r < rows; r++) {
    const row = String.fromCharCode(65 + r);
    seats.forEach((n) => n && labels.push(`${row}${n}`));
  }
  return labels;
}

function buildTrip(route, date, minute, operator, busClass, rand) {
  const cls = BUS_CLASSES[busClass];
  const minutes = roundTo(route.minutes / cls.speed + rand() * 40 - 10, 5);
  const depart = new Date(`${date}T00:00:00`);
  depart.setMinutes(minute);
  const arrive = new Date(depart.getTime() + minutes * 60000);
  // Busy evening and morning departures cost a little more
  const peak = minute >= 1020 || (minute >= 420 && minute <= 540) ? 1.08 : 1;
  const price = roundTo(route.km * cls.fare * peak * (0.94 + rand() * 0.12), 5);
  const hh = String(Math.floor(minute / 60)).padStart(2, "0");
  const mm = String(minute % 60).padStart(2, "0");
  const id = `${route.from}-${route.to}-${date.replaceAll("-", "")}-${hh}${mm}-${operator.id}`;
  return {
    id,
    from: route.from,
    to: route.to,
    date,
    departAt: depart.toISOString(),
    arriveAt: arrive.toISOString(),
    minutes,
    operator: operator.id,
    busClass,
    price,
    km: route.km,
    amenities: cls.amenities,
  };
}

const cache = new Map();

export function getTrips(from, to, date) {
  const key = `${from}|${to}|${date}`;
  if (cache.has(key)) return cache.get(key);
  const route = findRoute(from, to);
  if (!route) return [];
  const rand = seeded(key);
  const count = route.km < 300 ? 8 : route.km < 600 ? 6 : 5;
  const minutes = [...DEPARTURES].sort(() => rand() - 0.5).slice(0, count).sort((a, b) => a - b);
  const trips = minutes.map((minute) => {
    const operator = pick(rand, OPERATORS);
    const busClass = pick(rand, operator.classes);
    return buildTrip(route, date, minute + (rand() < 0.5 ? 0 : 15), operator, busClass, rand);
  });
  cache.set(key, trips);
  return trips;
}

export function parseTripId(id) {
  const m = /^([A-Z]{3})-([A-Z]{3})-(\d{4})(\d{2})(\d{2})-\d{4}-[a-z]+$/.exec(id ?? "");
  if (!m) return null;
  return { from: m[1], to: m[2], date: `${m[3]}-${m[4]}-${m[5]}` };
}

export function getTrip(id) {
  const parts = parseTripId(id);
  if (!parts) return null;
  return getTrips(parts.from, parts.to, parts.date).find((t) => t.id === id) ?? null;
}

// Seats other travellers have already booked on this trip
export function takenSeats(trip) {
  const rand = seeded(`seats:${trip.id}`);
  const labels = seatLabels(trip.busClass);
  const hour = new Date(trip.departAt).getHours();
  const busy = hour >= 17 || hour <= 8 ? 0.55 : 0.32;
  return new Set(labels.filter(() => rand() < busy));
}

export function seatsLeft(trip) {
  return seatLabels(trip.busClass).length - takenSeats(trip).size;
}

export function cheapestFare(from, to, date) {
  const trips = getTrips(from, to, date);
  return trips.length ? Math.min(...trips.map((t) => t.price)) : null;
}

export function operatorOf(trip) {
  return OPERATOR_BY_ID[trip.operator];
}
