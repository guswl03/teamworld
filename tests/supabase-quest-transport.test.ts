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

const projectRow = {
  id: "33333333-3333-4333-8333-333333333333",
  github_repo_id: 1358198956,
  github_node_id: "R_kgDOUPR4rA",
  github_owner: "guswl03",
  github_repo: "teamworld",
  installation_id: null,
};

function questRow(
  title: string,
  status: "open" | "completed",
  updatedAt: string,
) {
  return {
    project_id: projectRow.id,
    kind: "issue",
    github_item_id: 101,
    github_node_id: "I_kwDOExample",
    github_number: 12,
    title,
    status,
    updated_at: updatedAt,
  };
}

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
      title: "FORGED QUEST",
      status: "completed",
    },
    ...overrides,
  };
}

type QueryResult = { data: unknown[]; error: null };

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

function createHarness(
  questResponses: Array<QueryResult | Promise<QueryResult>>,
) {
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
  let questReads = 0;
  const client = {
    realtime: { setAuth: async () => {} },
    channel(name: string, options: unknown) {
      channelCalls.push([name, options]);
      return channel;
    },
    removeChannel: async () => "ok",
    from(table: string) {
      if (table === "projects")
        return {
          select() {
            return this;
          },
          async eq() {
            return { data: [projectRow], error: null };
          },
        };
      return {
        select() {
          return this;
        },
        in() {
          return this;
        },
        order() {
          return this;
        },
        limit() {
          const response = questResponses[questReads++] ?? {
            data: [],
            error: null,
          };
          return Promise.resolve(response);
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
  return {
    channelCalls,
    registrations,
    snapshots,
    transport,
    get questReads() {
      return questReads;
    },
    get receiveQuest() {
      const receive = handlers.get("broadcast:quest_event");
      assert.ok(receive);
      return receive;
    },
    async subscribe() {
      await Promise.resolve();
      assert.ok(subscribe);
      subscribe("SUBSCRIBED");
    },
  };
}

async function until(predicate: () => boolean) {
  const end = Date.now() + 2000;
  while (!predicate()) {
    if (Date.now() > end) throw new Error("Quest transport did not settle");
    await new Promise((resolve) => setTimeout(resolve, 5));
  }
}

test("Supabase transport treats valid quest broadcasts only as authoritative DB refresh hints", async () => {
  const harness = createHarness([
    { data: [], error: null },
    { data: [], error: null },
    {
      data: [
        questRow(
          "Authoritative database title",
          "open",
          "2026-09-06T08:00:00Z",
        ),
      ],
      error: null,
    },
  ]);
  try {
    assert.deepEqual(harness.channelCalls, [
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
      harness.registrations.some(
        ([type, filter]) =>
          type === "broadcast" && filter.event === "quest_event",
      ),
      true,
    );

    harness.receiveQuest({ payload: validPacket() });
    assert.equal(harness.questReads, 0);
    assert.equal(harness.snapshots.length, 0);

    await harness.subscribe();
    await until(() => harness.snapshots.length === 1);
    assert.deepEqual(harness.snapshots[0], []);

    harness.receiveQuest({ payload: validPacket() });
    assert.equal(
      harness.snapshots
        .flat()
        .some((quest) => quest.quest.title === "FORGED QUEST"),
      false,
    );
    await until(
      () => harness.questReads === 2 && harness.snapshots.length === 2,
    );
    assert.deepEqual(harness.snapshots[1], []);

    harness.receiveQuest({
      payload: validPacket({ delivery_id: "delivery-second-hint" }),
    });
    await until(
      () => harness.questReads === 3 && harness.snapshots.length === 3,
    );
    assert.equal(
      harness.snapshots
        .flat()
        .some((quest) => quest.quest.title === "FORGED QUEST"),
      false,
    );
    assert.equal(
      harness.snapshots[2][0].quest.title,
      "Authoritative database title",
    );
    assert.equal(harness.snapshots[2][0].quest.status, "open");
    assert.equal(harness.snapshots[2][0].deliveryId, null);
    assert.equal(harness.snapshots[2][0].action, null);

    const reads = harness.questReads;
    harness.receiveQuest({
      payload: validPacket({ world_id: crypto.randomUUID() }),
    });
    harness.receiveQuest({ payload: { nope: true } });
    assert.equal(harness.questReads, reads);

    harness.transport.close();
    harness.receiveQuest({
      payload: validPacket({ delivery_id: "delivery-closed" }),
    });
    assert.equal(harness.questReads, reads);
  } finally {
    harness.transport.close();
  }
});

test("quest refreshes are single-flight and skip an older snapshot when a newer hint is queued", async () => {
  const initial = deferred<QueryResult>();
  const refresh = deferred<QueryResult>();
  const harness = createHarness([initial.promise, refresh.promise]);
  try {
    await harness.subscribe();
    await until(() => harness.questReads === 1);

    harness.receiveQuest({ payload: validPacket() });
    harness.receiveQuest({
      payload: validPacket({ delivery_id: "delivery-repeat-1" }),
    });
    harness.receiveQuest({
      payload: validPacket({ delivery_id: "delivery-repeat-2" }),
    });
    assert.equal(harness.questReads, 1);

    initial.resolve({
      data: [questRow("Older initial state", "open", "2026-09-06T07:00:00Z")],
      error: null,
    });
    await until(() => harness.questReads === 2);
    assert.equal(harness.snapshots.length, 0);

    refresh.resolve({
      data: [
        questRow(
          "Latest authoritative state",
          "completed",
          "2026-09-06T08:00:00Z",
        ),
      ],
      error: null,
    });
    await until(() => harness.snapshots.length === 1);
    assert.equal(
      harness.snapshots[0][0].quest.title,
      "Latest authoritative state",
    );
    assert.equal(harness.snapshots[0][0].quest.status, "completed");
  } finally {
    harness.transport.close();
  }
});
