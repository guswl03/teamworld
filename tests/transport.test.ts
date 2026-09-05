import test from "node:test";
import assert from "node:assert/strict";
import { isPlayer, mergePresence } from "../src/lib/transport";
import { DEFAULT_TEAMS, WORLD_ID } from "../src/lib/data";
import { createDemoTransport } from "../src/lib/demo-transport";
import type { Player } from "../src/lib/types";
const player: Player = {
  id: "user-a",
  session_id: "session-a",
  world_id: WORLD_ID,
  nickname: "모험가",
  team_id: DEFAULT_TEAMS[0].id,
  avatar_type: "ranger",
  status: "online",
  x: 300,
  y: 410,
  direction: "down",
  moving: false,
  room_id: "team-1",
};
test("reject malformed broadcast packets and invalid coordinates", () => {
  assert.equal(isPlayer(player), true);
  for (const bad of [
    null,
    {},
    { ...player, x: NaN },
    { ...player, x: -1 },
    { ...player, y: 99999 },
    { ...player, status: "admin" },
    { ...player, avatar_type: "<script>" },
    { ...player, nickname: "a" },
    { ...player, direction: "sideways" },
  ])
    assert.equal(isPlayer(bad), false);
});
test("presence metadata updates do not rewind recently broadcast movement", () => {
  const previous = { ...player, x: 700, y: 800 };
  const result = mergePresence(
    [{ ...player, status: "meeting" }],
    [previous],
    "another",
  );
  assert.equal(result[0].x, 700);
  assert.equal(result[0].status, "meeting");
  assert.equal(mergePresence([player], [], player.session_id).length, 0);
});
test("two demo clients join, move, update status and leave", async () => {
  const target = new EventTarget();
  Object.defineProperty(globalThis, "window", {
    value: target,
    configurable: true,
  });
  let aPeers: Player[] = [],
    bPeers: Player[] = [];
  const a = createDemoTransport(player, {
    players: (p) => (aPeers = p),
    connection: () => {},
  });
  const b = createDemoTransport(
    { ...player, id: "user-b", session_id: "session-b", nickname: "동료" },
    { players: (p) => (bPeers = p), connection: () => {} },
  );
  async function until(predicate: () => boolean) {
    const end = Date.now() + 2000;
    while (!predicate()) {
      if (Date.now() > end) throw new Error("Presence did not converge");
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
  }
  try {
    await until(() => aPeers.length === 1 && bPeers.length === 1);
    a.move({ x: 900, y: 640, direction: "right", moving: true }, "main-square");
    await until(() => bPeers[0].x === 900);
    a.update({ ...player, status: "working" });
    await until(() => bPeers[0].status === "working");
    b.close();
    await until(() => aPeers.length === 0);
  } finally {
    a.close();
    b.close();
  }
});
