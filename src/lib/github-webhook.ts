import { createHmac, timingSafeEqual } from "node:crypto";

const issueActions = new Set([
  "opened",
  "reopened",
  "edited",
  "assigned",
  "unassigned",
  "labeled",
  "unlabeled",
  "closed",
]);
const pullRequestActions = new Set([
  "opened",
  "reopened",
  "edited",
  "synchronize",
  "ready_for_review",
  "converted_to_draft",
  "closed",
]);

export type NormalizedGitHubEvent = {
  delivery_id: string;
  event: "issues" | "pull_request";
  action: string;
  occurred_at: string;
  repository: {
    id: number;
    node_id: string;
    owner: string;
    name: string;
    installation_id: number | null;
  };
  quest: {
    kind: "issue" | "pull_request";
    id: number;
    node_id: string;
    number: number;
    title: string;
    status: "open" | "completed";
  };
};

export type WebhookResult = {
  status: 200 | 202 | 400 | 401 | 500;
  body: {
    status:
      | "ping"
      | "processed"
      | "duplicate"
      | "ignored"
      | "invalid_request"
      | "invalid_payload"
      | "unauthorized"
      | "server_error";
  };
};

type WebhookInput = {
  rawBody: string;
  signature: string | null;
  deliveryId: string | null;
  eventName: string | null;
  secret: string | undefined;
};

type WebhookDependencies = {
  parseJson?: (body: string) => unknown;
  ingest: (event: NormalizedGitHubEvent) => Promise<{ duplicate: boolean }>;
};

export function verifyGitHubSignature(
  rawBody: string,
  signature: string | null,
  secret: string,
): boolean {
  if (!signature || !secret || !/^sha256=[0-9a-f]{64}$/.test(signature))
    return false;

  const supplied = Buffer.from(signature.slice("sha256=".length), "hex");
  const expected = createHmac("sha256", secret)
    .update(Buffer.from(rawBody, "utf8"))
    .digest();
  return (
    supplied.length === expected.length && timingSafeEqual(supplied, expected)
  );
}

function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new TypeError("Expected an object");
  return value as Record<string, unknown>;
}

function text(value: unknown, maximum = Number.POSITIVE_INFINITY): string {
  if (typeof value !== "string") throw new TypeError("Expected text");
  const normalized = value.trim();
  if (!normalized || normalized.length > maximum)
    throw new TypeError("Invalid text");
  return normalized;
}

function positiveSafeInteger(
  value: unknown,
  maximum = Number.MAX_SAFE_INTEGER,
): number {
  if (
    !Number.isSafeInteger(value) ||
    (value as number) <= 0 ||
    (value as number) > maximum
  )
    throw new TypeError("Expected a positive safe integer");
  return value as number;
}

function normalizePayload(
  payload: Record<string, unknown>,
  deliveryId: string,
  eventName: "issues" | "pull_request",
  action: string,
): NormalizedGitHubEvent {
  const repository = record(payload.repository);
  const owner = record(repository.owner);
  const questKey = eventName === "issues" ? "issue" : "pull_request";
  const quest = record(payload[questKey]);
  const installation =
    payload.installation === undefined || payload.installation === null
      ? null
      : record(payload.installation);
  const state = text(quest.state);
  if (state !== "open" && state !== "closed")
    throw new TypeError("Invalid quest state");

  return {
    delivery_id: deliveryId,
    event: eventName,
    action,
    occurred_at: text(quest.updated_at),
    repository: {
      id: positiveSafeInteger(repository.id),
      node_id: text(repository.node_id),
      owner: text(owner.login),
      name: text(repository.name),
      installation_id:
        installation === null ? null : positiveSafeInteger(installation.id),
    },
    quest: {
      kind: questKey,
      id: positiveSafeInteger(quest.id),
      node_id: text(quest.node_id),
      number: positiveSafeInteger(quest.number, 2147483647),
      title: text(quest.title, 256),
      status: action === "closed" || state === "closed" ? "completed" : "open",
    },
  };
}

export async function processGitHubWebhook(
  input: WebhookInput,
  dependencies: WebhookDependencies,
): Promise<WebhookResult> {
  if (!input.secret?.trim())
    return { status: 500, body: { status: "server_error" } };
  if (!verifyGitHubSignature(input.rawBody, input.signature, input.secret))
    return { status: 401, body: { status: "unauthorized" } };

  const deliveryId = input.deliveryId?.trim();
  const eventName = input.eventName?.trim();
  if (!deliveryId || !eventName)
    return { status: 400, body: { status: "invalid_request" } };

  let parsed: unknown;
  try {
    parsed = (dependencies.parseJson ?? JSON.parse)(input.rawBody);
  } catch {
    return { status: 400, body: { status: "invalid_payload" } };
  }

  let payload: Record<string, unknown>;
  try {
    payload = record(parsed);
  } catch {
    return { status: 400, body: { status: "invalid_payload" } };
  }

  if (eventName === "ping") return { status: 200, body: { status: "ping" } };
  if (eventName !== "issues" && eventName !== "pull_request")
    return { status: 202, body: { status: "ignored" } };

  let action: string;
  try {
    action = text(payload.action);
  } catch {
    return { status: 400, body: { status: "invalid_payload" } };
  }
  const supportedActions =
    eventName === "issues" ? issueActions : pullRequestActions;
  if (!supportedActions.has(action))
    return { status: 202, body: { status: "ignored" } };

  let normalized: NormalizedGitHubEvent;
  try {
    normalized = normalizePayload(payload, deliveryId, eventName, action);
  } catch {
    return { status: 400, body: { status: "invalid_payload" } };
  }

  try {
    const result = await dependencies.ingest(normalized);
    if (typeof result?.duplicate !== "boolean") throw new TypeError();
    return result.duplicate
      ? { status: 200, body: { status: "duplicate" } }
      : { status: 200, body: { status: "processed" } };
  } catch {
    return { status: 500, body: { status: "server_error" } };
  }
}
