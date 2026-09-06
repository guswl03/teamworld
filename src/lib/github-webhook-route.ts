import {
  processGitHubWebhook,
  type NormalizedGitHubEvent,
} from "./github-webhook";

type WebhookRequest = {
  headers: Headers;
  text(): Promise<string>;
};

type RouteDependencies = {
  getSecret(): string | undefined;
  ingest(event: NormalizedGitHubEvent): Promise<{ duplicate: boolean }>;
};

export async function handleGitHubWebhookRequest(
  request: WebhookRequest,
  dependencies: RouteDependencies,
): Promise<Response> {
  let rawBody: string;
  try {
    rawBody = await request.text();
  } catch {
    return Response.json({ status: "invalid_payload" }, { status: 400 });
  }

  let secret: string | undefined;
  try {
    secret = dependencies.getSecret();
  } catch {
    return Response.json({ status: "server_error" }, { status: 500 });
  }

  const result = await processGitHubWebhook(
    {
      rawBody,
      signature: request.headers.get("x-hub-signature-256"),
      deliveryId: request.headers.get("x-github-delivery"),
      eventName: request.headers.get("x-github-event"),
      secret,
    },
    { ingest: dependencies.ingest },
  );
  return Response.json(result.body, { status: result.status });
}
