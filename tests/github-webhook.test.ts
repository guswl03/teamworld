import test from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import {
  processGitHubWebhook,
  verifyGitHubSignature,
  type NormalizedGitHubEvent,
} from "../src/lib/github-webhook";

const webhookSecret = "test webhook secret";

function sign(body: string): string {
  return `sha256=${createHmac("sha256", webhookSecret).update(body).digest("hex")}`;
}

function webhookInput(
  body: string,
  overrides: Partial<{
    signature: string | null;
    deliveryId: string | null;
    eventName: string | null;
    secret: string | undefined;
  }> = {},
) {
  return {
    rawBody: body,
    signature: sign(body),
    deliveryId: "delivery-123",
    eventName: "issues",
    secret: webhookSecret,
    ...overrides,
  };
}

function githubPayload(
  _kind: "issue" | "pull_request",
  action: string,
  state: "open" | "closed",
) {
  return {
    action,
    repository: {
      id: 1358198956,
      node_id: "R_kgDOUPR4rA",
      name: "teamworld",
      owner: { login: "guswl03" },
    },
    installation: { id: 24680 } as { id: number } | undefined,
    issue: {
      id: 101,
      node_id: "I_kwDOExample",
      number: 12,
      title: "Ship quests",
      state,
      updated_at: "2026-09-06T03:04:05Z",
    },
    pull_request: {
      id: 202,
      node_id: "PR_kwDOExample",
      number: 34,
      title: "Add quest webhook",
      state,
      updated_at: "2026-09-06T03:04:05Z",
    },
  };
}

test("signature verification matches GitHub's published SHA-256 vector", () => {
  assert.equal(
    verifyGitHubSignature(
      "Hello, World!",
      "sha256=757107ea0eb2509fc211221cce984b8a37570b6d7586c22c46f4379c8b043e17",
      "It's a Secret to Everybody",
    ),
    true,
  );
});

test("signature verification rejects missing, malformed, wrong-length, and wrong signatures", () => {
  const body = "Hello, World!";
  const secret = "It's a Secret to Everybody";
  for (const signature of [
    null,
    "",
    "md5=757107ea0eb2509fc211221cce984b8a37570b6d7586c22c46f4379c8b043e17",
    "sha256=xyz",
    "sha256=757107ea",
    `sha256=${"0".repeat(64)}`,
  ]) {
    assert.equal(verifyGitHubSignature(body, signature, secret), false);
  }
});

test("signature verification hashes the exact UTF-8 bytes", () => {
  const body = '{"title":"안녕 👋","body":"café"}';
  const signature =
    "sha256=022e825b608b643cc68103569fa36128aadaea4d082a44a1f172aaa341adaaa7";
  assert.equal(verifyGitHubSignature(body, signature, "비밀🔐"), true);
  assert.equal(verifyGitHubSignature(`${body}\n`, signature, "비밀🔐"), false);
});

test("invalid authentication and headers stop parsing and ingestion", async () => {
  let parseCalls = 0;
  let ingestCalls = 0;
  const dependencies = {
    parseJson: (body: string) => {
      parseCalls += 1;
      return JSON.parse(body) as unknown;
    },
    ingest: async (_event: NormalizedGitHubEvent) => {
      ingestCalls += 1;
      return { duplicate: false };
    },
  };
  const body = JSON.stringify(githubPayload("issue", "opened", "open"));

  for (const input of [
    webhookInput(body, { signature: null }),
    webhookInput(body, { signature: "sha256=not-hex" }),
    webhookInput(body, { signature: `sha256=${"0".repeat(62)}` }),
    webhookInput(body, { signature: `sha256=${"0".repeat(64)}` }),
  ]) {
    const result = await processGitHubWebhook(input, dependencies);
    assert.deepEqual(result, { status: 401, body: { status: "unauthorized" } });
  }

  for (const input of [
    webhookInput(body, { deliveryId: null }),
    webhookInput(body, { deliveryId: "   " }),
    webhookInput(body, { eventName: null }),
    webhookInput(body, { eventName: "   " }),
  ]) {
    const result = await processGitHubWebhook(input, dependencies);
    assert.deepEqual(result, {
      status: 400,
      body: { status: "invalid_request" },
    });
  }

  assert.equal(parseCalls, 0);
  assert.equal(ingestCalls, 0);
});

test("malformed JSON is rejected after authentication without ingestion", async () => {
  let ingestCalls = 0;
  const body = "not json";
  const result = await processGitHubWebhook(webhookInput(body), {
    ingest: async () => {
      ingestCalls += 1;
      return { duplicate: false };
    },
  });
  assert.deepEqual(result, {
    status: 400,
    body: { status: "invalid_payload" },
  });
  assert.equal(ingestCalls, 0);
});

test("ping and unsupported events or actions are accepted without ingestion", async () => {
  let ingestCalls = 0;
  const dependencies = {
    ingest: async () => {
      ingestCalls += 1;
      return { duplicate: false };
    },
  };

  const pingBody = JSON.stringify({ zen: "Keep it logically awesome." });
  assert.deepEqual(
    await processGitHubWebhook(
      webhookInput(pingBody, { eventName: "ping" }),
      dependencies,
    ),
    { status: 200, body: { status: "ping" } },
  );

  const pushBody = JSON.stringify({ ref: "refs/heads/main" });
  assert.deepEqual(
    await processGitHubWebhook(
      webhookInput(pushBody, { eventName: "push" }),
      dependencies,
    ),
    { status: 202, body: { status: "ignored" } },
  );

  const unsupportedAction = JSON.stringify(
    githubPayload("issue", "transferred", "open"),
  );
  assert.deepEqual(
    await processGitHubWebhook(webhookInput(unsupportedAction), dependencies),
    { status: 202, body: { status: "ignored" } },
  );
  assert.equal(ingestCalls, 0);
});

test("issue open and close events normalize repository, installation, and status", async () => {
  const ingested: NormalizedGitHubEvent[] = [];
  const dependencies = {
    ingest: async (event: NormalizedGitHubEvent) => {
      ingested.push(event);
      return { duplicate: false };
    },
  };

  for (const [action, state] of [
    ["opened", "open"],
    ["closed", "closed"],
  ] as const) {
    const body = JSON.stringify(githubPayload("issue", action, state));
    assert.deepEqual(
      await processGitHubWebhook(webhookInput(body), dependencies),
      { status: 200, body: { status: "processed" } },
    );
  }

  assert.deepEqual(ingested, [
    {
      delivery_id: "delivery-123",
      event: "issues",
      action: "opened",
      occurred_at: "2026-09-06T03:04:05.000Z",
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
    },
    {
      delivery_id: "delivery-123",
      event: "issues",
      action: "closed",
      occurred_at: "2026-09-06T03:04:05.000Z",
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
        status: "completed",
      },
    },
  ]);
});

test("pull request open and close events normalize with a nullable installation", async () => {
  const ingested: NormalizedGitHubEvent[] = [];
  const dependencies = {
    ingest: async (event: NormalizedGitHubEvent) => {
      ingested.push(event);
      return { duplicate: false };
    },
  };

  for (const [action, state] of [
    ["opened", "open"],
    ["closed", "closed"],
  ] as const) {
    const payload = githubPayload("pull_request", action, state);
    delete (payload as { installation?: unknown }).installation;
    const body = JSON.stringify(payload);
    assert.deepEqual(
      await processGitHubWebhook(
        webhookInput(body, { eventName: "pull_request" }),
        dependencies,
      ),
      { status: 200, body: { status: "processed" } },
    );
  }

  assert.equal(ingested[0]?.quest.kind, "pull_request");
  assert.equal(ingested[0]?.quest.status, "open");
  assert.equal(ingested[1]?.quest.status, "completed");
  assert.equal(ingested[0]?.repository.installation_id, null);
});

test("closed issue and pull request actions force completed despite an open payload state", async () => {
  const ingested: NormalizedGitHubEvent[] = [];
  const dependencies = {
    ingest: async (event: NormalizedGitHubEvent) => {
      ingested.push(event);
      return { duplicate: false };
    },
  };

  const issueBody = JSON.stringify(githubPayload("issue", "closed", "open"));
  const pullRequestBody = JSON.stringify(
    githubPayload("pull_request", "closed", "open"),
  );
  await processGitHubWebhook(webhookInput(issueBody), dependencies);
  await processGitHubWebhook(
    webhookInput(pullRequestBody, { eventName: "pull_request" }),
    dependencies,
  );

  assert.deepEqual(
    ingested.map(({ event, quest }) => ({ event, status: quest.status })),
    [
      { event: "issues", status: "completed" },
      { event: "pull_request", status: "completed" },
    ],
  );
});

test("quest number accepts the PostgreSQL integer maximum and rejects the next value", async () => {
  const accepted = githubPayload("issue", "opened", "open");
  accepted.issue.number = 2147483647;
  const rejected = githubPayload("issue", "opened", "open");
  rejected.issue.number = 2147483648;
  const ingested: NormalizedGitHubEvent[] = [];
  const dependencies = {
    ingest: async (event: NormalizedGitHubEvent) => {
      ingested.push(event);
      return { duplicate: false };
    },
  };

  assert.deepEqual(
    await processGitHubWebhook(
      webhookInput(JSON.stringify(accepted)),
      dependencies,
    ),
    { status: 200, body: { status: "processed" } },
  );
  assert.deepEqual(
    await processGitHubWebhook(
      webhookInput(JSON.stringify(rejected)),
      dependencies,
    ),
    { status: 400, body: { status: "invalid_payload" } },
  );
  assert.deepEqual(
    ingested.map(({ quest }) => quest.number),
    [2147483647],
  );
});

test("supported payloads reject unsafe IDs, empty strings, and oversized titles", async () => {
  const invalidPayloads: unknown[] = [];
  const addInvalid = (
    mutate: (payload: ReturnType<typeof githubPayload>) => void,
  ) => {
    const payload = githubPayload("issue", "opened", "open");
    mutate(payload);
    invalidPayloads.push(payload);
  };
  addInvalid((payload) => (payload.repository.id = 0));
  addInvalid(
    (payload) => (payload.repository.id = Number.MAX_SAFE_INTEGER + 1),
  );
  addInvalid((payload) => (payload.issue.id = -1));
  addInvalid((payload) => (payload.issue.number = 0));
  addInvalid((payload) => (payload.installation!.id = Number.NaN));
  addInvalid((payload) => (payload.repository.node_id = " "));
  addInvalid((payload) => (payload.repository.owner.login = ""));
  addInvalid((payload) => (payload.repository.name = ""));
  addInvalid((payload) => (payload.issue.node_id = ""));
  addInvalid((payload) => (payload.issue.title = "   "));
  addInvalid((payload) => (payload.issue.title = "x".repeat(257)));
  addInvalid(
    (payload) => ((payload.issue as { state: string }).state = "unknown"),
  );

  let ingestCalls = 0;
  for (const payload of invalidPayloads) {
    const body = JSON.stringify(payload);
    const result = await processGitHubWebhook(webhookInput(body), {
      ingest: async () => {
        ingestCalls += 1;
        return { duplicate: false };
      },
    });
    assert.deepEqual(result, {
      status: 400,
      body: { status: "invalid_payload" },
    });
  }
  assert.equal(ingestCalls, 0);
});

test("GitHub update instants normalize timezone and supported date boundaries", async () => {
  for (const kind of ["issue", "pull_request"] as const) {
    for (const [updatedAt, expected] of [
      ["2026-09-06T12:04:05+09:00", "2026-09-06T03:04:05.000Z"],
      ["2024-02-29T23:59:59.12Z", "2024-02-29T23:59:59.120Z"],
      ["0001-01-01T00:00:00Z", "0001-01-01T00:00:00.000Z"],
      ["9999-12-31T23:59:59.999Z", "9999-12-31T23:59:59.999Z"],
    ]) {
      const payload = githubPayload(kind, "opened", "open");
      payload[kind].updated_at = updatedAt;
      let occurredAt: string | undefined;
      const result = await processGitHubWebhook(
        webhookInput(JSON.stringify(payload), {
          eventName: kind === "issue" ? "issues" : "pull_request",
        }),
        {
          ingest: async (event) => {
            occurredAt = event.occurred_at;
            return { duplicate: false };
          },
        },
      );
      assert.equal(result.status, 200, updatedAt);
      assert.equal(occurredAt, expected);
    }
  }
});

test("invalid or unbounded GitHub update dates return 400 before ingestion", async (t) => {
  for (const updatedAt of [
    null,
    123,
    "",
    "not-a-date",
    "infinity",
    "2026-02-30T00:00:00Z",
    "2026-02-29T00:00:00Z",
    "2026-13-01T00:00:00Z",
    "2026-09-06T24:00:00Z",
    "2026-09-06T00:00:60Z",
    "2026-09-06",
    "2026-09-06T03:04:05",
    "0000-01-01T00:00:00Z",
    "+010000-01-01T00:00:00Z",
    "0001-01-01T00:00:00+01:00",
    "9999-12-31T23:59:59-01:00",
    "2026-09-06T00:00:00+24:00",
    `2026-09-06T00:00:00.${"1".repeat(1000)}Z`,
  ]) {
    await t.test(String(updatedAt).slice(0, 70), async () => {
      for (const kind of ["issue", "pull_request"] as const) {
        const payload = githubPayload(kind, "opened", "open");
        (payload[kind] as { updated_at: unknown }).updated_at = updatedAt;
        let ingestCalls = 0;
        const result = await processGitHubWebhook(
          webhookInput(JSON.stringify(payload), {
            eventName: kind === "issue" ? "issues" : "pull_request",
          }),
          {
            ingest: async () => {
              ingestCalls += 1;
              return { duplicate: false };
            },
          },
        );
        assert.deepEqual(result, {
          status: 400,
          body: { status: "invalid_payload" },
        });
        assert.equal(ingestCalls, 0);
      }
    });
  }
});

test("duplicate and ingestion failure responses are stable and generic", async () => {
  const body = JSON.stringify(githubPayload("issue", "opened", "open"));
  assert.deepEqual(
    await processGitHubWebhook(webhookInput(body), {
      ingest: async () => ({ duplicate: true }),
    }),
    { status: 200, body: { status: "duplicate" } },
  );
  assert.deepEqual(
    await processGitHubWebhook(webhookInput(body), {
      ingest: async () => {
        throw new Error("database contained private detail");
      },
    }),
    { status: 500, body: { status: "server_error" } },
  );
});
