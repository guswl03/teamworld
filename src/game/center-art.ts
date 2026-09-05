import * as Phaser from "phaser";
import { CENTER_OBJECTS, CENTER_ROOMS, CENTER_DOORS } from "./center-model";
import { WORLD, type Region } from "./world-model";

// Original deterministic pixel furniture: shared solid footprints match collision.
export function drawCenter(scene: Phaser.Scene, regions: Region[]) {
  const floor = scene.add.graphics().setDepth(-100);
  const rect = (color: number, x: number, y: number, w: number, h: number) =>
    floor.fillStyle(color).fillRect(x, y, w, h);
  const text = (
    x: number,
    y: number,
    value: string,
    size = 16,
    color = "#406175",
    background?: string,
  ) =>
    scene.add
      .text(x, y, value, {
        fontFamily: "Arial, sans-serif",
        fontSize: `${size}px`,
        color,
        backgroundColor: background,
        padding: { x: 8, y: 5 },
      })
      .setOrigin(0.5)
      .setDepth(5);
  rect(0x132b42, 0, 0, WORLD.width, WORLD.height);
  rect(0x879dae, 56, 71, 1488, 998);
  rect(0xd9e3e9, 60, 75, 1480, 990);
  for (let y = 80; y < 1060; y += 40)
    for (let x = 60; x < 1540; x += 40) {
      rect((x + y) % 80 === 0 ? 0xe3ebef : 0xdde6eb, x, y, 39, 39);
      rect(0xcad7df, x, y, 1, 40);
    }
  rect(0xc6d8e0, 650, 400, 300, 590);
  rect(0xc6d8e0, 120, 465, 1360, 190);
  for (let y = 410; y < 920; y += 34) rect(0xb6cdd7, 796, y, 8, 16);
  for (let x = 90; x < 1520; x += 100) {
    rect(0x526f85, x, 78, 76, 12);
    rect(0xe6f9ff, x + 4, 80, 68, 5);
  }
  // Recessed clerestory windows with an abstract skyline; purely wall decoration.
  for (const x of [505, 1000]) {
    rect(0x5d8098, x, 97, 95, 68);
    rect(0xafd6e4, x + 4, 101, 87, 60);
    for (let i = 0; i < 5; i++) {
      rect(0x88b2c8, x + 8 + i * 16, 135 - (i % 3) * 9, 12, 24 + (i % 3) * 9);
      rect(0xd2edf1, x + 11 + i * 16, 139 - (i % 3) * 9, 3, 4);
    }
    rect(0x4a728b, x + 45, 99, 4, 64);
    rect(0xe2f2f2, x + 4, 112, 87, 3);
  }
  for (const r of CENTER_ROOMS) {
    rect(0xe8edf0, r.x + 12, r.y + 12, r.width - 24, r.height - 24);
    for (let y = r.y + 18; y < r.y + r.height - 15; y += 18)
      rect(0xdbe3e8, r.x + 14, y, r.width - 28, 1);
    // Wall-mounted teaching display and pinboard do not consume floor space.
    rect(0xb9cbd6, r.x + 45, r.y + 22, r.width - 110, 51);
    rect(0x254257, r.x + 48, r.y + 24, r.width - 116, 44);
    rect(0x72c8d3, r.x + 58, r.y + 33, 42, 4);
    for (let i = 0; i < 3; i++)
      rect(0x57788b, r.x + 58, r.y + 43 + i * 6, r.width - 170 - i * 18, 2);
    text(r.x + r.width / 2, r.y - 18, r.name, 18, "#f0faff", "#25485f");
    rect(0xa7c0ce, r.x + 30, r.y + 158, r.width - 60, 3);
    for (let i = 0; i < 3; i++)
      rect(
        [0xf3cf80, 0x94d1c9, 0xa7bbdf][i],
        r.x + 22 + i * 19,
        r.y + r.height - 57,
        14,
        16,
      );
    // A framed noticeboard on the room wall with paper and pin pixels.
    rect(0x8c765e, r.x + 18, r.y + r.height - 63, 65, 37);
    rect(0xc6b294, r.x + 21, r.y + r.height - 60, 59, 31);
    for (let i = 0; i < 3; i++) {
      rect(
        [0xf3dfad, 0xc0e3d8, 0xc7d7ee][i],
        r.x + 24 + i * 18,
        r.y + r.height - 56,
        14,
        22,
      );
      rect(0x5c8d95, r.x + 30 + i * 18, r.y + r.height - 56, 3, 3);
      rect(0x9da7a5, r.x + 27 + i * 18, r.y + r.height - 47, 8, 2);
    }
  }
  for (const o of CENTER_OBJECTS) {
    const g = scene.add
      .graphics()
      .setDepth(o.kind === "wall" ? 10 : o.y + o.height);
    const r = (c: number, x: number, y: number, w: number, h: number) =>
      g.fillStyle(c).fillRect(x, y, w, h);
    const { x, y, width: w, height: h } = o;
    if (o.kind === "wall") {
      r(0x426b82, x, y, w, h);
      r(0x93c5d6, x + 2, y + 2, w - 4, h - 4);
      if (w > h) {
        r(0xd9f0f3, x + 2, y + 2, w - 4, 2);
        for (let sx = x + 22; sx < x + w - 4; sx += 44)
          r(0x547d91, sx, y, 3, h);
      } else {
        r(0xd9f0f3, x + 2, y + 2, 2, h - 4);
        for (let sy = y + 22; sy < y + h - 4; sy += 44)
          r(0x547d91, x, sy, w, 3);
      }
    } else if (o.kind === "desk" || o.kind === "reception") {
      r(0x78909e, x, y, w, h);
      r(0xc5a679, x + 2, y + 2, w - 4, h - 9);
      r(0xe7cb9b, x + 3, y + 3, w - 6, 4);
      r(0x2d4a60, x + 12, y + 7, 31, 19);
      r(0x80d0d5, x + 15, y + 10, 25, 12);
      r(0x466276, x + 25, y + 26, 5, 4);
      r(0xe3eaf0, x + 10, y + 32, 37, 6);
      for (let k = 0; k < 7; k++) r(0x9bafbf, x + 12 + k * 5, y + 33, 2, 2);
      r(0xf7f8ef, x + w - 24, y + 17, 10, 12);
      r(0x658e98, x + w - 22, y + 18, 6, 3);
      if (o.kind === "reception") {
        // Espresso machine, two cups, leaflet stack and an ID-card reader.
        r(0x33566d, x + 77, y + 7, 35, 28);
        r(0xadc2ca, x + 80, y + 10, 29, 12);
        r(0x283d4e, x + 86, y + 21, 17, 10);
        r(0xf0eee3, x + 88, y + 26, 6, 6);
        r(0xd7e4e7, x + 79, y + 34, 33, 3);
        r(0x7ecabf, x + 102, y + 12, 4, 4);
        r(0xf6f2da, x + 123, y + 22, 15, 13);
        r(0x73a5b4, x + 125, y + 24, 11, 3);
        text(x + w / 2, y + h + 21, "RECEPTION · 안내 데스크", 16, "#294f64");
      }
    } else if (o.kind === "sofa") {
      r(0x315e73, x, y, w, h);
      r(0x548c9b, x + 4, y + 4, w - 8, h - 8);
      r(0x7bb0b7, x + 8, y + 6, w - 16, h - 12);
      r(0x3b7385, x + 6, y + h / 2, w - 12, 3);
      r(0xb8d6d6, x + 9, y + 10, w - 18, 14);
    } else if (o.kind === "table") {
      r(0x9e8b72, x, y, w, h);
      r(0xe4caa2, x + 3, y + 3, w - 6, h - 6);
      r(0x29495c, x + 12, y + 9, 23, 18);
      r(0x67bcc8, x + 15, y + 12, 17, 10);
      r(0xf3f4e7, x + 43, y + 17, 13, 18);
      r(0x80a6b0, x + 45, y + 20, 9, 3);
      r(0xf4f7f0, x + 12, y + 35, 8, 8);
    } else {
      r(0x5f8490, x, y, w, h);
      r(0xd9e5e5, x + 3, y + h - 11, w - 6, 9);
      r(0x397c6c, x + 4, y + 3, w - 8, h - 14);
      r(0x61aa83, x + 9, y, w - 15, h - 12);
      r(0x94c49e, x + 5, y + 6, 7, 6);
      r(0x266c62, x + w - 12, y + 9, 8, 8);
    }
  }
  for (const d of CENTER_DOORS) {
    rect(0x65a9b0, d.x - 48, d.y - 8, 96, 8);
    rect(0xc7ecea, d.x - 39, d.y - 6, 78, 3);
  }
  text(800, 443, "CENTRAL LOUNGE", 20, "#31556b");
  text(800, 745, "LEARN · BUILD · SHARE", 18, "#466d82");
  text(800, 1040, "TEAMWORLD / 교육센터", 24, "#254b63");
  // Reception carpet with a woven floor insignia.
  rect(0xadc8d4, 721, 809, 158, 61);
  rect(0xc7dde3, 725, 813, 150, 53);
  for (const [i, region] of regions.entries()) {
    const r = CENTER_ROOMS[i];
    if (r)
      text(r.doorX, r.y + r.height + 28, region.name, 16, "#effcff", "#346878");
  }
}
