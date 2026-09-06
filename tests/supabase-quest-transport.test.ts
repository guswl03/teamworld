import test from "node:test";
import assert from "node:assert/strict";
import { createSupabaseTransport } from "../src/lib/supabase-transport";
import type { GitHubQuest } from "../src/lib/github-quests";
import type { Player } from "../src/lib/types";

const player: Player = {
  id: "user-a",
  session_id: "session-a",
  world_id: "11111111-1111-4111-8111-111111111111",
  nickname: "모험가",
  team_id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  avatar_type: "ranger",
  status: "online",
  x: 300,
  y: 410,
  direction: "down",
  moving: false,
  room_id: "main-square",
};

function validPacket(overrides: Record<string, unknown> = {}) {
  return {
    delivery_id: "delivery-123",
    world_id: player.world_id,
    event: "issues",
    action: "opened",
    occurred_at: "2026-09-06T03:04:05Z",
    repository: {
      id: 1358198956,
      node_id: "R_kgDOUPR4rA",
      owner: "guswl03",
      name: "teamworld",
      installation_id: null,
    },
    quest: {
      kind: "issue",
      id: 101,
      node_id: "I_kwDOExample",
      number: 12,
      title: "Ship quests",
      status: "open",
    },
    ...overrides,
  };
}

test("Supabase transport publishes only ready valid quest events from its private world channel", async () => {
  const handlers = new Map<string, (message: { payload: unknown }) => void>();
  let subscribe: ((state: string) => void) | undefined;
  const registrations: Array<[string, { event: string }]> = [];
  const channel = {
    on(
      type: string,
      filter: { event: string },
      handler: (message: { payload: unknown }) => void,
    ) {
      registrations.push([type, filter]);
      handlers.set(`${type}:${filter.event}`, handler);
      return this;
    },
    subscribe(callback: (state: string) => void) {
      subscribe = callback;
      return this;
    },
    track: async () => "ok",
    presenceState: () => ({}),
    send: async () => "ok",
  };
  const channelCalls: Array<[string, unknown]> = [];
  const client = {
    realtime: { setAuth: async () => {} },
    channel(name: string, options: unknown) {
      channelCalls.push([name, options]);
      return channel;
    },
    removeChannel: async () => "ok",
    from() {
      return {
        select() {
          return this;
        },
        async eq() {
          return { data: [], error: null };
        },
      };
    },
  };
  const snapshots: GitHubQuest[][] = [];
  const transport = createSupabaseTransport(
    player,
    {
      players: () => {},
      connection: () => {},
      quests: (quests) => snapshots.push(quests),
    },
    client as never,
  );
  try {
    assert.deepEqual(channelCalls, [
      [
        `world:${player.world_id}`,
        {
          config: {
            private: true,
            broadcast: { self: false, ack: true },
            presence: { key: player.session_id },
          },
        },
      ],
    ]);
    assert.equal(
      registrations.some(
        ([type, filter]) =>
          type === "broadcast" && filter.event === "quest_event",
      ),
      true,
    );
    const receiveQuest = handlers.get("broadcast:quest_event");
    assert.ok(receiveQuest);
    receiveQuest({ payload: validPacket() });
    assert.equal(snapshots.length, 0);

    await Promise.resolve();
    assert.ok(subscribe);
    subscribe("SUBSCRIBED");
    await Promise.resolve();
    receiveQuest({ payload: validPacket({ delivery_id: "delivery-live" }) });
    assert.equal(snapshots.at(-1)?.[0].deliveryId, "delivery-live");
    const count = snapshots.length;

    receiveQuest({ payload: validPacket({ world_id: crypto.randomUUID() }) });
    receiveQuest({ payload: { nope: true } });
    assert.equal(snapshots.length, count);

    transport.close();
    receiveQuest({ payload: validPacket({ delivery_id: "delivery-closed" }) });
    assert.equal(snapshots.length, count);
  } finally {
    transport.close();
  }
});
