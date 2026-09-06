import test from "node:test";
import assert from "node:assert/strict";
import { ingestConnectedGitHubEvent } from "../src/lib/github-webhook-store";
import type { NormalizedGitHubEvent } from "../src/lib/github-webhook";

const event: NormalizedGitHubEvent = {
  delivery_id: "delivery-123",
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
};

type QueryResponse = {
  data: Array<{ world_id: string }> | null;
  error: { message: string } | null;
};

function fakeClient(
  queryResponse: QueryResponse,
  rpcResponse: {
    data: { duplicate: boolean } | null;
    error: { message: string } | null;
  } = { data: { duplicate: false }, error: null },
) {
  const calls: Array<{ method: string; arguments: unknown[] }> = [];
  const query = {
    select(columns: string) {
      calls.push({ method: "select", arguments: [columns] });
      return this;
    },
    eq(column: string, value: unknown) {
      calls.push({ method: "eq", arguments: [column, value] });
      return this;
    },
    async limit(count: number) {
      calls.push({ method: "limit", arguments: [count] });
      return queryResponse;
    },
  };
  const client = {
    from(table: string) {
      calls.push({ method: "from", arguments: [table] });
      return query;
    },
    async rpc(name: string, args: Record<string, unknown>) {
      calls.push({ method: "rpc", arguments: [name, args] });
      return rpcResponse;
    },
  };
  return { client, calls };
}

test("adapter resolves one connected world by repository id and node id before RPC", async () => {
  const worldId = "11111111-1111-4111-8111-111111111111";
  const { client, calls } = fakeClient({
    data: [{ world_id: worldId }],
    error: null,
  });

  assert.deepEqual(await ingestConnectedGitHubEvent(client, event), {
    duplicate: false,
  });
  assert.deepEqual(calls, [
    { method: "from", arguments: ["projects"] },
    { method: "select", arguments: ["world_id"] },
    { method: "eq", arguments: ["github_repo_id", 1358198956] },
    { method: "eq", arguments: ["github_node_id", "R_kgDOUPR4rA"] },
    { method: "limit", arguments: [2] },
    {
      method: "rpc",
      arguments: [
        "ingest_github_event",
        { event_payload: { ...event, world_id: worldId } },
      ],
    },
  ]);
});

test("adapter fails closed for unknown, mismatched, or ambiguous projects", async () => {
  for (const rows of [
    [],
    [
      { world_id: "11111111-1111-4111-8111-111111111111" },
      { world_id: "22222222-2222-4222-8222-222222222222" },
    ],
  ]) {
    const { client, calls } = fakeClient({ data: rows, error: null });
    await assert.rejects(ingestConnectedGitHubEvent(client, event));
    assert.equal(
      calls.some((call) => call.method === "rpc"),
      false,
    );
  }

  const { client, calls } = fakeClient({
    data: [{ world_id: "not-a-world-id" }],
    error: null,
  });
  await assert.rejects(ingestConnectedGitHubEvent(client, event));
  assert.equal(
    calls.some((call) => call.method === "rpc"),
    false,
  );
});

test("adapter fails closed on project lookup and ingestion errors", async () => {
  const failedLookup = fakeClient({
    data: null,
    error: { message: "private lookup detail" },
  });
  await assert.rejects(ingestConnectedGitHubEvent(failedLookup.client, event));

  const failedRpc = fakeClient(
    {
      data: [{ world_id: "11111111-1111-4111-8111-111111111111" }],
      error: null,
    },
    { data: null, error: { message: "private RPC detail" } },
  );
  await assert.rejects(ingestConnectedGitHubEvent(failedRpc.client, event));
});

test("adapter returns the RPC duplicate result", async () => {
  const { client } = fakeClient(
    {
      data: [{ world_id: "11111111-1111-4111-8111-111111111111" }],
      error: null,
    },
    { data: { duplicate: true }, error: null },
  );
  assert.deepEqual(await ingestConnectedGitHubEvent(client, event), {
    duplicate: true,
  });
});
