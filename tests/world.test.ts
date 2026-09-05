import test from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_TEAMS } from "../src/lib/data";
import {
  canStand,
  obstaclesFor,
  regionsFor,
  roomAt,
  spawnFor,
  step,
  WORLD,
} from "../src/game/world-model";
import { validateNickname } from "../src/lib/profile";
const regions = regionsFor(DEFAULT_TEAMS),
  obstacles = obstaclesFor(regions);
test("all guild spawns are walkable and assigned to their guild", () => {
  for (const team of DEFAULT_TEAMS) {
    const spawn = spawnFor(team.id, regions);
    assert.equal(roomAt(spawn, regions), team.room_id);
    assert.equal(canStand(spawn.x, spawn.y, obstacles), true);
  }
});
test("central square and outside region detection", () => {
  assert.equal(roomAt({ x: 800, y: 640 }, regions), "main-square");
});
test("movement normalizes diagonals and limits long background frames", () => {
  const p = { x: 800, y: 640, direction: "down" as const, moving: false };
  const straight = step(p, 1, 0, 50, obstacles),
    diagonal = step(p, 1, 1, 50, obstacles);
  assert.ok(
    Math.abs(
      Math.hypot(diagonal.x - p.x, diagonal.y - p.y) - (straight.x - p.x),
    ) < 0.00001,
  );
  assert.equal(step(p, 1, 0, 10000, obstacles).x, straight.x);
});
test("world boundaries and fountain collision block passage", () => {
  const edge = {
    x: WORLD.width - 60 - WORLD.radius,
    y: 640,
    direction: "down" as const,
    moving: false,
  };
  assert.equal(step(edge, 1, 0, 50, obstacles).x, edge.x);
  let p = {
    x: 800,
    y: 640,
    direction: "up" as const,
    moving: false,
  } as Parameters<typeof step>[0];
  for (let i = 0; i < 100; i++) p = step(p, 0, -1, 16, obstacles);
  assert.ok(p.y >= 582);
  assert.ok(canStand(p.x, p.y, obstacles));
});
test("nickname rejects empty, long and control input", () => {
  assert.ok(validateNickname(" "));
  assert.ok(validateNickname("x".repeat(21)));
  assert.ok(validateNickname("aa\n"));
  assert.ok(validateNickname("a<b"));
  assert.equal(validateNickname("별빛 모험가"), null);
});
