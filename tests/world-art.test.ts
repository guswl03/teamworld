import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

test("village terrain is available locally and every Tiled tile fits its tileset", () => {
  const path = resolve("public/maps/village.tmj");
  assert.ok(
    existsSync(path),
    "The editable village map must ship with the app",
  );
  const map = JSON.parse(readFileSync(path, "utf8"));
  assert.equal(map.width * map.tilewidth * 0.5, 1600);
  assert.equal(map.height * map.tileheight * 0.5, 1120);
  for (const layer of map.layers.filter(
    (l: { type: string }) => l.type === "tilelayer",
  )) {
    assert.equal(layer.data.length, map.width * map.height);
    assert.ok(
      layer.data.every(
        (gid: number) => Number.isInteger(gid) && gid >= 0 && gid <= 40,
      ),
    );
  }
  for (const tileset of map.tilesets) {
    const png = readFileSync(resolve("public/maps", tileset.image));
    assert.equal(png.readUInt32BE(16), tileset.imagewidth);
    assert.equal(png.readUInt32BE(20), tileset.imageheight);
  }
});

test("all four avatar sheets have complete idle and walk frames", async () => {
  assert.ok(
    existsSync(resolve("src/game/world-art-model.ts")),
    "Sprite animation definitions must exist",
  );
  const { AVATAR_SHEETS, avatarFrame } =
    await import("../src/game/world-art-model");
  assert.equal(avatarFrame("ranger", true, 100, false), 9);
  assert.equal(avatarFrame("ranger", true, 600, false), 8);
  assert.equal(avatarFrame("mage", false, 320, false), 2);
  assert.equal(avatarFrame("explorer", true, 200, false), 8);
  for (const avatar of ["ranger", "mage", "engineer", "explorer"] as const) {
    const sheet = AVATAR_SHEETS[avatar];
    const png = readFileSync(resolve("public" + sheet.url));
    assert.equal(png.readUInt32BE(16) % 192, 0);
    assert.equal(png.readUInt32BE(20) % 192, 0);
    const columns = png.readUInt32BE(16) / 192;
    for (const time of [0, 100, 500, 600, 10000]) {
      assert.ok(avatarFrame(avatar, false, time, false) < 6);
      const walking = avatarFrame(avatar, true, time, false);
      assert.ok(walking >= columns && walking < columns + 6);
    }
    assert.equal(
      avatarFrame(avatar, true, 100, true),
      avatarFrame(avatar, true, 900, true),
    );
  }
});
