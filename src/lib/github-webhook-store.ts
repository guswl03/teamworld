import type { NormalizedGitHubEvent } from "./github-webhook";

type ResolvedGitHubEvent = NormalizedGitHubEvent & { world_id: string };

type QueryResult<T> = {
  data: T | null;
  error: unknown;
};

type ProjectQuery = {
  select(columns: string): ProjectQuery;
  eq(column: string, value: unknown): ProjectQuery;
  limit(count: number): PromiseLike<QueryResult<Array<{ world_id: string }>>>;
};

export type GitHubEventSupabaseClient = {
  from(table: string): ProjectQuery;
  rpc(
    functionName: string,
    arguments_: { event_payload: ResolvedGitHubEvent },
  ): PromiseLike<QueryResult<{ duplicate: boolean }>>;
};

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function ingestConnectedGitHubEvent(
  client: GitHubEventSupabaseClient,
  event: NormalizedGitHubEvent,
): Promise<{ duplicate: boolean }> {
  const projectResult = await client
    .from("projects")
    .select("world_id")
    .eq("github_repo_id", event.repository.id)
    .eq("github_node_id", event.repository.node_id)
    .limit(2);

  if (projectResult.error || projectResult.data?.length !== 1)
    throw new Error("Connected GitHub project could not be resolved");
  const worldId = projectResult.data[0]?.world_id;
  if (typeof worldId !== "string" || !uuidPattern.test(worldId))
    throw new Error("Connected GitHub project has an invalid world");

  const eventPayload: ResolvedGitHubEvent = { ...event, world_id: worldId };
  const ingestionResult = await client.rpc("ingest_github_event", {
    event_payload: eventPayload,
  });
  if (
    ingestionResult.error ||
    typeof ingestionResult.data?.duplicate !== "boolean"
  )
    throw new Error("GitHub event ingestion failed");
  return { duplicate: ingestionResult.data.duplicate };
}
