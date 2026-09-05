// Optional map authoring helper. Runtime reads public/maps/village.tmj directly.
// Re-running intentionally replaces manual Tiled edits; keep those edits in Git first.
import { mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const width = 50,
  height = 35;
const layer = (name, id) => ({
  id,
  name,
  type: "tilelayer",
  x: 0,
  y: 0,
  width,
  height,
  opacity: 1,
  visible: true,
  data: Array(width * height).fill(0),
});
const shore = layer("Shore", 1),
  grass = layer("Grass", 2),
  paths = layer("Paths", 3);
function rectangle(target, x, y, w, h, sand) {
  for (let dy = 0; dy < h; dy++)
    for (let dx = 0; dx < w; dx++) {
      const col = dx === 0 ? 0 : dx === w - 1 ? 2 : 1;
      const row = dy === 0 ? 0 : dy === h - 1 ? 2 : 1;
      target.data[(y + dy) * width + x + dx] =
        1 + (sand ? 5 : 0) + col + row * 10;
    }
}
rectangle(shore, 1, 2, 48, 32, true);
rectangle(grass, 2, 3, 46, 30, false);
// Paths are a union, so intersecting roads never contain edge seams.
const road = new Set();
function roadRect(x, y, w, h) {
  for (let j = y; j < y + h; j++)
    for (let i = x; i < x + w; i++) road.add(j * width + i);
}
roadRect(24, 7, 3, 23);
roadRect(8, 11, 34, 3);
roadRect(12, 27, 27, 3);
roadRect(19, 14, 12, 8);
for (const [x, y] of [
  [9, 10],
  [25, 6],
  [40, 10],
  [13, 26],
  [37, 26],
])
  roadRect(x - 3, y, 7, 5);
roadRect(15, 12, 3, 4); // flower garden
roadRect(31, 11, 5, 3); // market
roadRect(29, 20, 6, 4); // chest approach
for (const index of road) {
  const col = !road.has(index - 1) ? 0 : !road.has(index + 1) ? 2 : 1;
  const row = !road.has(index - width) ? 0 : !road.has(index + width) ? 2 : 1;
  paths.data[index] = 6 + col + row * 10;
}
const map = {
  compressionlevel: -1,
  height,
  width,
  infinite: false,
  orientation: "orthogonal",
  renderorder: "right-down",
  tiledversion: "1.11.2",
  tilewidth: 64,
  tileheight: 64,
  type: "map",
  version: "1.10",
  nextlayerid: 4,
  nextobjectid: 1,
  properties: [{ name: "displayScale", type: "float", value: 0.5 }],
  layers: [shore, grass, paths],
  tilesets: [
    {
      firstgid: 1,
      name: "Tiny Swords CC0 terrain",
      image: "../assets/tiny-swords/terrain.png",
      imagewidth: 640,
      imageheight: 256,
      margin: 0,
      spacing: 0,
      tilewidth: 64,
      tileheight: 64,
      tilecount: 40,
      columns: 10,
    },
  ],
};
const directory = fileURLToPath(new URL("../public/maps/", import.meta.url));
mkdirSync(directory, { recursive: true });
writeFileSync(directory + "/village.tmj", JSON.stringify(map) + "\n");
console.log("Generated public/maps/village.tmj (50 × 35 tiles)");
