// The bus network: routes with road distance and typical travel time, bus classes and operators.
// Operators are fictional; prices are sample fares in Egyptian pounds.

// [from, to, km, minutes]; every route runs in both directions
const ROUTE_TABLE = [
  ["CAI", "ALX", 220, 180],
  ["CAI", "LXR", 650, 570],
  ["CAI", "ASW", 870, 750],
  ["CAI", "HRG", 460, 360],
  ["CAI", "SSH", 500, 420],
  ["CAI", "DAH", 560, 480],
  ["CAI", "SIW", 750, 630],
  ["CAI", "PSD", 200, 180],
  ["ALX", "HRG", 680, 510],
  ["ALX", "SSH", 720, 570],
  ["ALX", "SIW", 580, 480],
  ["ALX", "PSD", 270, 210],
  ["LXR", "ASW", 220, 210],
  ["LXR", "HRG", 290, 240],
  ["ASW", "HRG", 500, 390],
  ["SSH", "DAH", 95, 90],
];

export const ROUTES = ROUTE_TABLE.flatMap(([a, b, km, minutes]) => [
  { from: a, to: b, km, minutes },
  { from: b, to: a, km, minutes },
]);

export function findRoute(from, to) {
  return ROUTES.find((r) => r.from === from && r.to === to) ?? null;
}

export function destinationsFrom(from) {
  return ROUTES.filter((r) => r.from === from).map((r) => r.to);
}

export const BUS_CLASSES = {
  standard: {
    id: "standard",
    name: { en: "Standard", ar: "عادي" },
    fare: 0.72,
    layout: { rows: 11, seats: [1, 2, null, 3, 4] },
    amenities: ["ac", "usb"],
    speed: 1,
  },
  comfort: {
    id: "comfort",
    name: { en: "Comfort", ar: "مريح" },
    fare: 0.98,
    layout: { rows: 10, seats: [1, 2, null, 3, 4] },
    amenities: ["ac", "wifi", "usb", "recline"],
    speed: 1,
  },
  vip: {
    id: "vip",
    name: { en: "VIP Sleeper", ar: "VIP سرير" },
    fare: 1.42,
    layout: { rows: 10, seats: [1, null, 2, 3] },
    amenities: ["ac", "wifi", "usb", "recline", "snacks", "toilet", "screen"],
    speed: 0.95,
  },
};

export const AMENITIES = ["ac", "wifi", "usb", "recline", "snacks", "toilet", "screen"];

export const OPERATORS = [
  { id: "nile", name: { en: "Nile Express", ar: "نايل إكسبريس" }, color: "#2a9d8f", classes: ["comfort", "vip"] },
  { id: "horus", name: { en: "Horus Coaches", ar: "حورس للنقل" }, color: "#e76f51", classes: ["standard", "comfort", "vip"] },
  { id: "sahra", name: { en: "Sahra Lines", ar: "صحراء لاينز" }, color: "#e9c46a", classes: ["standard", "comfort"] },
  { id: "lotus", name: { en: "Lotus Travel", ar: "لوتس ترافل" }, color: "#264653", classes: ["standard", "vip"] },
];

export const OPERATOR_BY_ID = Object.fromEntries(OPERATORS.map((o) => [o.id, o]));
