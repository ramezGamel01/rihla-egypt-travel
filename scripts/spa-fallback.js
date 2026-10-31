// GitHub Pages serves 404.html for unknown paths. Copying the app shell there lets
// deep links like /trips/... load the app, which then routes on the client.
import { copyFileSync } from "node:fs";

copyFileSync("dist/index.html", "dist/404.html");
console.log("dist/404.html written");
