import test from "node:test";
import assert from "node:assert/strict";
import {
  freshAdventure,
  advanceAdventure,
  restoreAdventure,
  NPC,
  CHEST,
  LANDMARKS,
} from "../src/game/adventure-model";
import { canStand, obstaclesFor, regionsFor } from "../src/game/world-model";
import { DEFAULT_TEAMS } from "../src/lib/data";

test("adventure enforces proximity, quest order and one-time reward", () => {
  let state = freshAdventure();
  assert.equal(
    advanceAdventure(state, "interact", { x: 0, y: 0 }).accepted,
    false,
  );
  state = advanceAdventure(state, "interact", NPC);
  assert.equal(state.accepted, true);
  assert.equal(advanceAdventure(state, "interact", CHEST).treasure, false);
  for (const point of LANDMARKS)
    state = advanceAdventure(state, "visit", point);
  assert.equal(state.visited.length, 3);
  state = advanceAdventure(state, "interact", CHEST);
  assert.equal(state.treasure, true);
  state = advanceAdventure(state, "interact", NPC);
  assert.equal(state.rewarded, true);
  assert.deepEqual(advanceAdventure(state, "interact", NPC), state);
  assert.equal(advanceAdventure(state, "equip", NPC).equipped, true);
  assert.equal(
    advanceAdventure(freshAdventure(), "equip", NPC).equipped,
    false,
  );
});
test("visits require acceptance and cannot be duplicated or remotely triggered", () => {
  assert.deepEqual(
    advanceAdventure(freshAdventure(), "visit", LANDMARKS[0]).visited,
    [],
  );
  let state = advanceAdventure(freshAdventure(), "interact", NPC);
  state = advanceAdventure(state, "visit", LANDMARKS[0]);
  state = advanceAdventure(state, "visit", LANDMARKS[0]);
  assert.equal(state.visited.length, 1);
  assert.equal(
    advanceAdventure(state, "visit", { x: 0, y: 0 }).visited.length,
    1,
  );
});
test("malformed persistence cannot create an inconsistent inventory", () => {
  for (const value of [
    null,
    {},
    { version: 7 },
    {
      version: 1,
      accepted: false,
      visited: [],
      treasure: false,
      rewarded: true,
      equipped: true,
    },
  ])
    assert.deepEqual(restoreAdventure(value), freshAdventure());
  let state = advanceAdventure(freshAdventure(), "interact", NPC);
  for (const point of LANDMARKS)
    state = advanceAdventure(state, "visit", point);
  state = advanceAdventure(state, "interact", CHEST);
  state = advanceAdventure(state, "interact", NPC);
  assert.deepEqual(restoreAdventure(JSON.parse(JSON.stringify(state))), state);
});
test("all interaction and discovery targets are walkable", () => {
  const obstacles = obstaclesFor(regionsFor(DEFAULT_TEAMS));
  for (const point of [NPC, CHEST, ...LANDMARKS])
    assert.equal(canStand(point.x, point.y, obstacles), true);
});
