// GitHub Pages serves 404.html for unknown paths. Copying the app shell there lets
// deep links like /trip/... load the app, which then routes on the client.
// The fixed pages also get their own copy, so opening them directly returns 200, not 404.
import { copyFileSync, mkdirSync } from "node:fs";

copyFileSync("dist/index.html", "dist/404.html");
for (const route of ["trips", "bookings", "signin", "signup"]) {
  mkdirSync(`dist/${route}`, { recursive: true });
  copyFileSync("dist/index.html", `dist/${route}/index.html`);
}
console.log("dist/404.html and the page copies written");
