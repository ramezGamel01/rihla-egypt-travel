// The home page journey, kept free of three.js so the page can read it without loading 3D code.
// The journey's road: Alexandria, Cairo, along the Nile to Luxor and Aswan, then back to Qena and across to Hurghada
export const JOURNEY = [
  { lon: 29.92, lat: 31.2, stop: "ALX" },
  { lon: 30.4, lat: 30.75 },
  { lon: 31.24, lat: 30.04, stop: "CAI" },
  { lon: 31.1, lat: 29.07 },
  { lon: 30.75, lat: 28.1 },
  { lon: 31.18, lat: 27.18 },
  { lon: 31.7, lat: 26.56 },
  { lon: 32.72, lat: 26.16 },
  { lon: 32.64, lat: 25.69, stop: "LXR" },
  { lon: 32.87, lat: 24.98 },
  { lon: 32.9, lat: 24.09, stop: "ASW" },
  { lon: 33.05, lat: 24.6 },
  { lon: 33.2, lat: 25.3 },
  { lon: 33.6, lat: 26.2 },
  { lon: 33.94, lat: 26.75 },
  { lon: 33.81, lat: 27.26, stop: "HRG" },
];


export const JOURNEY_STOPS = JOURNEY.filter((p) => p.stop).map((p) => p.stop);
