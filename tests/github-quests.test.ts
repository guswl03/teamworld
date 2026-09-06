import test from "node:test";
import assert from "node:assert/strict";
import {
  GITHUB_QUEST_EMPTY_COPY,
  loadPersistedGitHubQuests,
  mergeGitHubQuests,
  presentGitHubQuest,
  validateGitHubQuestEvent,
  type GitHubQuest,
  type GitHubQuestLoaderClient,
} from "../src/lib/github-quests";

const worldId = "11111111-1111-4111-8111-111111111111";

function packet(overrides: Record<string, unknown> = {}) {
  return {
    delivery_id: "delivery-123",
    world_id: worldId,
    event: "issues",
    action: "opened",
    occurred_at: "2026-09-06T03:04:05Z",
    repository: {
      id: 1358198956,
      node_id: "R_kgDOUPR4rA",
      owner: "guswl03",
      name: "teamworld",
      installation_id: 24680,
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

function validQuest(overrides: Partial<GitHubQuest> = {}): GitHubQuest {
  const value = validateGitHubQuestEvent(packet(), worldId);
  assert.ok(value);
  return { ...value, ...overrides };
}

test("quest event validator accepts issue and pull request packets", () => {
  const issue = validateGitHubQuestEvent(packet(), worldId);
  assert.ok(issue);
  assert.equal(issue.quest.kind, "issue");
  assert.equal(issue.repository.name, "teamworld");

  const pullRequest = validateGitHubQuestEvent(
    packet({
      delivery_id: "delivery-pr",
      event: "pull_request",
      action: "closed",
      repository: {
        ...packet().repository,
        installation_id: null,
      },
      quest: {
        ...packet().quest,
        kind: "pull_request",
        id: 202,
        node_id: "PR_kwDOExample",
        number: 2147483647,
        status: "completed",
      },
    }),
    worldId,
  );
  assert.ok(pullRequest);
  assert.equal(pullRequest.quest.kind, "pull_request");
  assert.equal(pullRequest.quest.status, "completed");
});

test("quest event validator rejects wrong-world and malformed bounded values", () => {
  const invalidPackets = [
    packet({ world_id: "22222222-2222-4222-8222-222222222222" }),
    packet({ delivery_id: " " }),
    packet({ delivery_id: "x".repeat(257) }),
    packet({ event: "push" }),
    packet({ action: "" }),
    packet({ action: "x".repeat(65) }),
    packet({ occurred_at: "not-a-time" }),
    packet({ repository: { ...packet().repository, id: 0 } }),
    packet({ repository: { ...packet().repository, id: 2 ** 53 } }),
    packet({ repository: { ...packet().repository, node_id: "" } }),
    packet({
      repository: { ...packet().repository, node_id: "x".repeat(257) },
    }),
    packet({ repository: { ...packet().repository, owner: " " } }),
    packet({ repository: { ...packet().repository, owner: "x".repeat(257) } }),
    packet({ repository: { ...packet().repository, name: "" } }),
    packet({ repository: { ...packet().repository, name: "x".repeat(257) } }),
    packet({ repository: { ...packet().repository, installation_id: -1 } }),
    packet({ quest: { ...packet().quest, kind: "discussion" } }),
    packet({ quest: { ...packet().quest, id: Number.MAX_SAFE_INTEGER + 1 } }),
    packet({ quest: { ...packet().quest, node_id: "" } }),
    packet({ quest: { ...packet().quest, node_id: "x".repeat(257) } }),
    packet({ quest: { ...packet().quest, number: 2147483648 } }),
    packet({ quest: { ...packet().quest, title: " " } }),
    packet({ quest: { ...packet().quest, title: "x".repeat(257) } }),
    packet({ quest: { ...packet().quest, status: "closed" } }),
    null,
    [],
  ];
  for (const invalid of invalidPackets)
    assert.equal(validateGitHubQuestEvent(invalid, worldId), null);
});

test("quest merge replaces later updates, dedupes replays, and orders deterministically", () => {
  const opened = validQuest();
  const other = validQuest({
    deliveryId: "delivery-other",
    occurredAt: "2026-09-06T04:00:00Z",
    repository: { ...opened.repository, id: 999, nodeId: "R_other" },
    quest: { ...opened.quest, id: 999, nodeId: "I_other", number: 3 },
  });
  const completed = validQuest({
    deliveryId: "delivery-completed",
    action: "closed",
    occurredAt: "2026-09-06T05:00:00Z",
    quest: { ...opened.quest, title: "Ship quests now", status: "completed" },
  });

  const merged = mergeGitHubQuests([], [opened, opened, other, completed]);
  assert.equal(merged.length, 2);
  assert.deepEqual(
    merged.map((item) => [item.repository.id, item.quest.status]),
    [
      [opened.repository.id, "completed"],
      [other.repository.id, "open"],
    ],
  );
  assert.equal(merged[0].quest.title, "Ship quests now");

  const replayed = mergeGitHubQuests(merged, [opened, completed]);
  assert.deepEqual(replayed, merged);
});

test("quest merge retains only the newest 20 items", () => {
  const base = validQuest();
  const updates = Array.from({ length: 24 }, (_, index) => ({
    ...base,
    deliveryId: `delivery-${index}`,
    occurredAt: new Date(Date.UTC(2026, 8, 6, 0, index)).toISOString(),
    quest: {
      ...base.quest,
      id: index + 1,
      nodeId: `I_${index}`,
      number: index + 1,
    },
  }));
  const merged = mergeGitHubQuests([], updates);
  assert.equal(merged.length, 20);
  assert.deepEqual(
    merged.map((item) => item.quest.number),
    Array.from({ length: 20 }, (_, index) => 24 - index),
  );
});

type Call = { table: string; method: string; arguments: unknown[] };

function loaderClient(options: {
  projects?: unknown[];
  quests?: unknown[];
  projectError?: unknown;
  questError?: unknown;
}) {
  const calls: Call[] = [];
  function query(table: "projects" | "quests") {
    const api = {
      select(columns: string) {
        calls.push({ table, method: "select", arguments: [columns] });
        return api;
      },
      eq(column: string, value: unknown) {
        calls.push({ table, method: "eq", arguments: [column, value] });
        return Promise.resolve({
          data: options.projects ?? [],
          error: options.projectError ?? null,
        });
      },
      in(column: string, values: readonly unknown[]) {
        calls.push({ table, method: "in", arguments: [column, values] });
        return api;
      },
      order(column: string, settings: unknown) {
        calls.push({ table, method: "order", arguments: [column, settings] });
        return api;
      },
      limit(count: number) {
        calls.push({ table, method: "limit", arguments: [count] });
        return Promise.resolve({
          data: options.quests ?? [],
          error: options.questError ?? null,
        });
      },
    };
    return api;
  }
  const client = {
    from(table: string) {
      calls.push({ table, method: "from", arguments: [] });
      return query(table as "projects" | "quests");
    },
  } as unknown as GitHubQuestLoaderClient;
  return { client, calls };
}

const projectRow = {
  id: "33333333-3333-4333-8333-333333333333",
  github_repo_id: 1358198956,
  github_node_id: "R_kgDOUPR4rA",
  github_owner: "guswl03",
  github_repo: "teamworld",
  installation_id: 24680,
};

const questRow = {
  project_id: projectRow.id,
  kind: "issue",
  github_item_id: 101,
  github_node_id: "I_kwDOExample",
  github_number: 12,
  title: "Ship quests",
  status: "open",
  updated_at: "2026-09-06T03:04:05Z",
};

test("persisted quest loader scopes projects to the world and quests to those projects", async () => {
  const { client, calls } = loaderClient({
    projects: [projectRow],
    quests: [questRow],
  });
  const loaded = await loadPersistedGitHubQuests(client, worldId);
  assert.equal(loaded.length, 1);
  assert.equal(loaded[0].repository.name, "teamworld");
  assert.equal(loaded[0].quest.number, 12);
  assert.equal(loaded[0].deliveryId, null);
  assert.equal(loaded[0].action, null);
  assert.deepEqual(calls, [
    { table: "projects", method: "from", arguments: [] },
    {
      table: "projects",
      method: "select",
      arguments: [
        "id,github_repo_id,github_node_id,github_owner,github_repo,installation_id",
      ],
    },
    { table: "projects", method: "eq", arguments: ["world_id", worldId] },
    { table: "quests", method: "from", arguments: [] },
    {
      table: "quests",
      method: "select",
      arguments: [
        "project_id,kind,github_item_id,github_node_id,github_number,title,status,updated_at",
      ],
    },
    {
      table: "quests",
      method: "in",
      arguments: ["project_id", [projectRow.id]],
    },
    {
      table: "quests",
      method: "order",
      arguments: ["updated_at", { ascending: false }],
    },
    { table: "quests", method: "limit", arguments: [20] },
  ]);
});

test("persisted quest loader ignores malformed rows and fails closed", async () => {
  const malformed = loaderClient({
    projects: [projectRow, { ...projectRow, id: "" }],
    quests: [questRow, { ...questRow, github_number: 2147483648 }],
  });
  assert.equal(
    (await loadPersistedGitHubQuests(malformed.client, worldId)).length,
    1,
  );

  for (const failed of [
    loaderClient({ projectError: { message: "private" } }),
    loaderClient({
      projects: [projectRow],
      questError: { message: "private" },
    }),
  ])
    assert.deepEqual(
      await loadPersistedGitHubQuests(failed.client, worldId),
      [],
    );
});

test("persisted quest loader skips the quest query when no projects exist", async () => {
  const { client, calls } = loaderClient({ projects: [] });
  assert.deepEqual(await loadPersistedGitHubQuests(client, worldId), []);
  assert.equal(
    calls.some((call) => call.table === "quests"),
    false,
  );
});

test("quest presentation distinguishes issue, pull request, state, and empty copy", () => {
  const issue = presentGitHubQuest(validQuest());
  assert.deepEqual(issue, {
    kind: "ISSUE",
    number: "#12",
    status: "OPEN",
    event: "ISSUES · OPENED",
    announcement:
      "GitHub 퀘스트 업데이트: Ship quests · OPEN · ISSUES · OPENED",
  });
  const pullRequest = presentGitHubQuest(
    validQuest({
      event: "pull_request",
      action: null,
      quest: {
        ...validQuest().quest,
        kind: "pull_request",
        status: "completed",
      },
    }),
  );
  assert.deepEqual(pullRequest, {
    kind: "PR",
    number: "#12",
    status: "COMPLETED",
    event: "PULL REQUEST · SAVED STATE",
    announcement:
      "GitHub 퀘스트 업데이트: Ship quests · COMPLETED · PULL REQUEST · SAVED STATE",
  });
  assert.equal(
    GITHUB_QUEST_EMPTY_COPY,
    "연결된 GitHub 이슈와 풀 리퀘스트가 이곳에 나타납니다.",
  );
});
