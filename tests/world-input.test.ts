import test from "node:test";
import assert from "node:assert/strict";
import { createWorldInput } from "../src/game/world-input";

test("world accepts movement by default, without a canvas click", () => {
  const input = createWorldInput();
  assert.equal(input.down("ArrowRight"), "move");
  assert.deepEqual(input.read(), { dx: 1, dy: 0, buffered: false });
});
test("opening a task clears held and buffered movement until it closes", () => {
  const input = createWorldInput();
  input.down("w");
  input.up("w");
  input.enable(false);
  assert.deepEqual(input.read(), { dx: 0, dy: 0, buffered: false });
  assert.equal(input.down("d"), null);
  assert.equal(input.down("e"), null);
  input.enable(true);
  assert.deepEqual(input.read(), { dx: 0, dy: 0, buffered: false });
  input.down("a");
  assert.equal(input.read().dx, -1);
});
test("typing, IME and browser shortcuts never control the character", () => {
  const input = createWorldInput();
  for (const context of [
    { typing: true },
    { composing: true },
    { modified: true },
  ]) {
    assert.equal(input.down("w", context), null);
    assert.equal(input.down("e", context), null);
  }
  assert.deepEqual(input.read(), { dx: 0, dy: 0, buffered: false });
  assert.equal(input.down("e", { repeat: true }), null);
  assert.equal(input.down("e"), "interact");
});
test("short taps move once, and loss of focus clears movement", () => {
  const input = createWorldInput();
  input.down("s");
  input.up("s");
  assert.deepEqual(input.read(), { dx: 0, dy: 1, buffered: true });
  assert.deepEqual(input.read(), { dx: 0, dy: 0, buffered: false });
  input.down("a");
  input.clear();
  assert.equal(input.read().dx, 0);
});
