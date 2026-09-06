import test from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { handleGitHubWebhookRequest } from "../src/lib/github-webhook-route";
import { POST } from "../src/app/api/github/webhook/route";

const secret = "route test secret";

function signature(body: string): string {
  return `sha256=${createHmac("sha256", secret).update(body).digest("hex")}`;
}

test("route boundary reads the raw body once and returns stable JSON", async () => {
  const body = JSON.stringify({
    action: "opened",
    repository: {
      id: 1358198956,
      node_id: "R_kgDOUPR4rA",
      name: "teamworld",
      owner: { login: "guswl03" },
    },
    issue: {
      id: 101,
      node_id: "I_kwDOExample",
      number: 12,
      title: "Ship quests",
      state: "open",
      updated_at: "2026-09-06T03:04:05Z",
    },
  });
  let textCalls = 0;
  const request = {
    headers: new Headers({
      "x-hub-signature-256": signature(body),
      "x-github-delivery": "delivery-route",
      "x-github-event": "issues",
    }),
    async text() {
      textCalls += 1;
      return body;
    },
  };

  const response = await handleGitHubWebhookRequest(request, {
    getSecret: () => secret,
    ingest: async () => ({ duplicate: true }),
  });
  assert.equal(textCalls, 1);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { status: "duplicate" });
});

test("missing webhook environment produces only a generic server response", async () => {
  const previous = process.env.GITHUB_WEBHOOK_SECRET;
  const privateValue = "must-not-appear-in-response";
  delete process.env.GITHUB_WEBHOOK_SECRET;
  try {
    const response = await POST(
      new Request("http://localhost/api/github/webhook", {
        method: "POST",
        headers: {
          "x-hub-signature-256": `sha256=${"0".repeat(64)}`,
          "x-github-delivery": "delivery-missing-env",
          "x-github-event": "ping",
        },
        body: JSON.stringify({ zen: privateValue }),
      }),
    );
    assert.equal(response.status, 500);
    const responseText = await response.text();
    assert.deepEqual(JSON.parse(responseText), { status: "server_error" });
    assert.equal(responseText.includes(privateValue), false);
  } finally {
    if (previous === undefined) delete process.env.GITHUB_WEBHOOK_SECRET;
    else process.env.GITHUB_WEBHOOK_SECRET = previous;
  }
});
