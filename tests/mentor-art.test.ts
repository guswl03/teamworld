import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { MENTORS } from "../src/game/mentors";

test("every mentor has a distinct local RGBA portrait instead of a shared player avatar", () => {
  assert.equal(MENTORS.length, 12);
  const hashes = new Set<string>();
  for (const mentor of MENTORS) {
    assert.equal(mentor.image, `/assets/mentors/${mentor.id}.png`);
    const png = readFileSync(`public${mentor.image}`);
    assert.equal(png.toString("hex", 0, 8), "89504e470d0a1a0a");
    assert.equal(png[25], 6, `${mentor.name}: RGBA required`);
    assert.ok(png.readUInt32BE(16) > 0 && png.readUInt32BE(20) > 0);
    hashes.add(createHash("sha256").update(png).digest("hex"));
  }
  assert.equal(hashes.size, 12, "mentors must not reuse one image");
});
