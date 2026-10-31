// Geography for the 3D map: a simplified outline of Egypt, the Nile and the
// journey's road, as longitude and latitude, projected onto the x-z plane.
import * as THREE from "three";
export { JOURNEY } from "../data/journey.js";

export const MAP_SCALE = 1.25;
const CENTER = { lon: 30.4, lat: 26.9 };

export function project(lon, lat, y = 0) {
  return new THREE.Vector3((lon - CENTER.lon) * MAP_SCALE, y, -(lat - CENTER.lat) * MAP_SCALE);
}

// Coastline and borders, simplified; Sinai is joined at Suez
export const EGYPT = [
  [25.0, 31.6], [27.3, 31.35], [28.9, 30.85], [29.9, 31.2], [30.4, 31.5], [31.0, 31.6], [31.8, 31.5],
  [32.3, 31.3], [33.2, 31.1], [34.2, 31.3], [34.9, 29.5], [34.6, 28.9], [34.25, 27.73], [33.75, 28.2],
  [33.2, 28.9], [32.65, 29.95], [32.4, 29.6], [32.7, 29.1], [33.2, 28.4], [33.8, 27.3], [34.0, 26.6],
  [34.3, 26.1], [34.9, 25.1], [35.5, 24.0], [35.8, 23.4], [36.9, 22.0], [31.4, 22.0], [25.0, 22.0],
];

export const NILE = [
  [32.85, 22.4], [32.95, 23.2], [32.9, 24.09], [32.87, 24.98], [32.64, 25.69], [32.72, 26.16],
  [32.2, 26.3], [31.7, 26.56], [31.18, 27.18], [30.85, 27.9], [30.75, 28.1], [31.1, 29.07], [31.24, 30.04],
];
export const NILE_ROSETTA = [[31.24, 30.04], [30.95, 30.6], [30.55, 31.1], [30.4, 31.45]];
export const NILE_DAMIETTA = [[31.24, 30.04], [31.35, 30.6], [31.55, 31.1], [31.8, 31.45]];
export const DELTA = [[31.24, 30.04], [30.0, 31.15], [30.4, 31.5], [31.0, 31.6], [31.8, 31.5], [32.25, 31.25]];
// The Gulf of Suez, between Sinai and the mainland
export const GULF_OF_SUEZ = [[34.25, 27.73], [33.75, 28.2], [33.2, 28.9], [32.65, 29.95], [32.4, 29.6], [32.7, 29.1], [33.2, 28.4], [33.8, 27.3]];
export const LAKE_NASSER = [[32.7, 22.1], [32.4, 22.6], [32.75, 23.2], [32.95, 23.75], [33.1, 23.2], [33.0, 22.5]];


export function shapeFrom(points) {
  const shape = new THREE.Shape();
  points.forEach(([lon, lat], i) => {
    const v = project(lon, lat);
    // The shape is drawn in x-y and later laid flat, so -z becomes y
    if (i === 0) shape.moveTo(v.x, -v.z);
    else shape.lineTo(v.x, -v.z);
  });
  return shape;
}

export function curveFrom(points, y) {
  return new THREE.CatmullRomCurve3(
    points.map((p) => (Array.isArray(p) ? project(p[0], p[1], y) : project(p.lon, p.lat, y))),
    false,
    "centripetal"
  );
}

// Where each stop sits along the journey curve (0..1), measured by distance
export function stopFractions(curve, points, y) {
  const samples = 400;
  const pts = curve.getSpacedPoints(samples);
  return points
    .filter((p) => p.stop)
    .map((p) => {
      const target = project(p.lon, p.lat, y);
      let best = 0;
      let bestD = Infinity;
      pts.forEach((q, i) => {
        const d = q.distanceToSquared(target);
        if (d < bestD) {
          bestD = d;
          best = i;
        }
      });
      return { id: p.stop, t: best / samples };
    });
}
