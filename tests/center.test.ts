import test from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_TEAMS } from "../src/lib/data";
import {
  canStand,
  obstaclesFor,
  regionsFor,
  spawnFor,
} from "../src/game/world-model";
import {
  NPC,
  CHEST,
  LANDMARKS,
  restoreAdventure,
  advanceAdventure,
} from "../src/game/adventure-model";

test("center furniture blocks standing while all destinations remain reachable", async () => {
  const { CENTER_OBJECTS, CENTER_DOORS, LOBBY } =
    await import("../src/game/center-model");
  const { MENTORS, mentorAt, mentorApproach } =
    await import("../src/game/mentors");
  const regions = regionsFor(DEFAULT_TEAMS),
    obstacles = obstaclesFor(regions);
  for (const object of CENTER_OBJECTS) {
    assert.equal(
      canStand(
        object.x + object.width / 2,
        object.y + object.height / 2,
        obstacles,
      ),
      false,
      object.id,
    );
  }
  for (const door of CENTER_DOORS)
    assert.ok(canStand(door.x, door.y, obstacles), door.name);
  const seen = new Set<string>(),
    queue = [LOBBY];
  seen.add(`${LOBBY.x},${LOBBY.y}`);
  for (let i = 0; i < queue.length; i++) {
    const p = queue[i];
    for (const [dx, dy] of [
      [10, 0],
      [-10, 0],
      [0, 10],
      [0, -10],
    ]) {
      const x = p.x + dx,
        y = p.y + dy,
        key = `${x},${y}`;
      if (!seen.has(key) && canStand(x, y, obstacles)) {
        seen.add(key);
        queue.push({ x, y });
      }
    }
  }
  const targets = [
    ...DEFAULT_TEAMS.map((t) => ({ ...spawnFor(t.id, regions), name: t.name })),
    ...MENTORS.map((m) => ({ ...mentorApproach(m), name: m.name })),
    NPC,
    CHEST,
    ...LANDMARKS,
  ];
  for (const target of targets)
    assert.ok(
      queue.some((p) => Math.hypot(p.x - target.x, p.y - target.y) < 12),
      `unreachable ${target.name}`,
    );
  assert.equal(MENTORS.length, 12);
  assert.equal(mentorAt({ x: -100, y: -100 }), undefined);
  for (const mentor of MENTORS) {
    assert.equal(mentorAt(mentorApproach(mentor))?.id, mentor.id);
    assert.equal(mentorAt({ x: mentor.x, y: mentor.y + 66 }), undefined);
  }
  const first = MENTORS[0];
  const tied = [first, { ...first, id: "second" }];
  assert.equal(mentorAt(first, tied)?.id, first.id);
});

test("additional teams cannot arrive inside reception or glass walls", () => {
  const teams = Array.from({ length: 200 }, (_, i) => ({
    ...DEFAULT_TEAMS[i % 5],
    id: `extra-${i}`,
    room_id: `room-${i}`,
  }));
  const regions = regionsFor(teams),
    obstacles = obstaclesFor(regions);
  for (const index of [
    19,
    28,
    ...Array.from({ length: 195 }, (_, i) => i + 5),
  ]) {
    const arrival = spawnFor(teams[index].id, regions);
    assert.ok(
      canStand(arrival.x, arrival.y, obstacles),
      `team ${index + 1} arrival ${arrival.x},${arrival.y} is blocked`,
    );
  }
  for (const [index, point] of [
    [0, { x: 310, y: 410 }],
    [1, { x: 800, y: 290 }],
    [2, { x: 1290, y: 410 }],
    [3, { x: 420, y: 910 }],
    [4, { x: 1190, y: 910 }],
  ] as const) {
    const arrival = spawnFor(teams[index].id, regions);
    assert.equal(arrival.x, point.x);
    assert.equal(arrival.y, point.y);
    assert.equal(regions[index].id, teams[index].room_id);
  }
});

test("unusable arrival coordinates fall back to the walkable lobby", () => {
  for (const x of [Number.NaN, Number.POSITIVE_INFINITY, 1_000_000]) {
    const regions = regionsFor(DEFAULT_TEAMS);
    regions[0] = { ...regions[0], x, y: 1_000_000 };
    const arrival = spawnFor(DEFAULT_TEAMS[0].id, regions);
    assert.deepEqual(arrival, {
      x: 800,
      y: 900,
      direction: "down",
      moving: false,
    });
  }
});

test("saved village progression still completes in the center with the same IDs", () => {
  const saved = {
    version: 1,
    accepted: true,
    visited: ["garden", "market", "pond"],
    treasure: true,
    rewarded: false,
    equipped: false,
  };
  const restored = restoreAdventure(saved);
  assert.deepEqual(restored, saved);
  const rewarded = advanceAdventure(restored, "interact", NPC);
  assert.equal(rewarded.rewarded, true);
  assert.equal(advanceAdventure(rewarded, "equip", NPC).equipped, true);
});
