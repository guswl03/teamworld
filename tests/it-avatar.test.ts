import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  IT_ATLAS,
  IT_FRAMES,
  itFrameIndex,
  itFrameName,
} from "../src/game/it-avatar";

test("IT idle and walk loops stay in their own character frames", () => {
  assert.equal(itFrameIndex(false, 0, false), 0);
  assert.equal(itFrameIndex(false, 600, false), 1);
  assert.equal(itFrameIndex(true, 0, false), 2);
  assert.equal(itFrameIndex(true, 150, false), 3);
  assert.equal(itFrameIndex(true, 300, false), 2);
  for (const avatar of ["ranger", "mage", "engineer", "explorer"] as const) {
    for (const moving of [false, true]) {
      assert.equal(itFrameIndex(moving, 150, true), 0);
      assert.equal(itFrameName(avatar, moving, 150, true), `${avatar}-0`);
    }
  }
});
test("all IT sprite crops fit the shipped transparent atlas without touching other rows", () => {
  const png = readFileSync("public" + IT_ATLAS.url);
  const width = png.readUInt32BE(16),
    height = png.readUInt32BE(20);
  assert.equal(png[25], 6, "atlas must have RGBA transparency");
  for (const frames of Object.values(IT_FRAMES)) {
    assert.equal(frames.length, 4);
    for (const f of frames) {
      assert.ok(f.x >= 0 && f.y >= 0 && f.width > 0 && f.height > 0);
      assert.ok(f.x + f.width <= width && f.y + f.height <= height);
    }
    for (let i = 1; i < frames.length; i++)
      assert.ok(frames[i - 1].x + frames[i - 1].width < frames[i].x);
  }
});
