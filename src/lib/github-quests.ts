export type GitHubQuest = {
  deliveryId: string | null;
  worldId: string;
  event: "issues" | "pull_request";
  action: string | null;
  occurredAt: string;
  repository: {
    id: number;
    nodeId: string;
    owner: string;
    name: string;
    installationId: number | null;
  };
  quest: {
    kind: "issue" | "pull_request";
    id: number;
    nodeId: string;
    number: number;
    title: string;
    status: "open" | "completed";
  };
};

type QueryResult = { data: unknown; error: unknown };

type GitHubQuestFilter = PromiseLike<QueryResult> & {
  eq(column: string, value: unknown): GitHubQuestFilter;
  in(column: string, values: readonly unknown[]): GitHubQuestFilter;
  order(column: string, settings: { ascending: boolean }): GitHubQuestFilter;
  limit(count: number): GitHubQuestFilter;
};

type GitHubQuestTable = {
  select(columns: string): GitHubQuestFilter;
};

export type GitHubQuestLoaderClient = {
  from(table: string): GitHubQuestTable;
};

export const GITHUB_QUEST_EMPTY_COPY =
  "연결된 GitHub 이슈와 풀 리퀘스트가 이곳에 나타납니다.";

const POSTGRES_INTEGER_MAX = 2147483647;
const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function record(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function text(value: unknown, maximum = Number.POSITIVE_INFINITY) {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  return normalized && normalized.length <= maximum ? normalized : null;
}

function positiveSafeInteger(
  value: unknown,
  maximum = Number.MAX_SAFE_INTEGER,
) {
  return Number.isSafeInteger(value) &&
    (value as number) > 0 &&
    (value as number) <= maximum
    ? (value as number)
    : null;
}

function instant(value: unknown) {
  const normalized = text(value, 128);
  return normalized && Number.isFinite(Date.parse(normalized))
    ? normalized
    : null;
}

export function validateGitHubQuestEvent(
  value: unknown,
  expectedWorldId: string,
): GitHubQuest | null {
  const eventPacket = record(value);
  const repository = record(eventPacket?.repository);
  const quest = record(eventPacket?.quest);
  if (!eventPacket || !repository || !quest || !expectedWorldId.trim())
    return null;

  const worldId = text(eventPacket.world_id, 64);
  const deliveryId = text(eventPacket.delivery_id, 256);
  const event = text(eventPacket.event);
  const action = text(eventPacket.action, 64);
  const occurredAt = instant(eventPacket.occurred_at);
  const repositoryId = positiveSafeInteger(repository.id);
  const repositoryNodeId = text(repository.node_id, 256);
  const repositoryOwner = text(repository.owner, 256);
  const repositoryName = text(repository.name, 256);
  const installationId =
    repository.installation_id === null
      ? null
      : positiveSafeInteger(repository.installation_id);
  const kind = text(quest.kind);
  const questId = positiveSafeInteger(quest.id);
  const questNodeId = text(quest.node_id, 256);
  const questNumber = positiveSafeInteger(quest.number, POSTGRES_INTEGER_MAX);
  const title = text(quest.title, 256);
  const status = text(quest.status);

  if (
    worldId !== expectedWorldId ||
    !deliveryId ||
    (event !== "issues" && event !== "pull_request") ||
    !action ||
    !occurredAt ||
    repositoryId === null ||
    !repositoryNodeId ||
    !repositoryOwner ||
    !repositoryName ||
    (repository.installation_id !== null && installationId === null) ||
    (kind !== "issue" && kind !== "pull_request") ||
    (event === "issues" ? kind !== "issue" : kind !== "pull_request") ||
    questId === null ||
    !questNodeId ||
    questNumber === null ||
    !title ||
    (status !== "open" && status !== "completed")
  )
    return null;

  return {
    deliveryId,
    worldId,
    event,
    action,
    occurredAt,
    repository: {
      id: repositoryId,
      nodeId: repositoryNodeId,
      owner: repositoryOwner,
      name: repositoryName,
      installationId,
    },
    quest: {
      kind,
      id: questId,
      nodeId: questNodeId,
      number: questNumber,
      title,
      status,
    },
  };
}

function questIdentity(item: GitHubQuest) {
  return [
    item.repository.id,
    item.repository.nodeId,
    item.quest.kind,
    item.quest.id,
  ].join(":");
}

function newestFirst(left: GitHubQuest, right: GitHubQuest) {
  const byTime = Date.parse(right.occurredAt) - Date.parse(left.occurredAt);
  if (byTime) return byTime;
  const byDelivery = (right.deliveryId ?? "").localeCompare(
    left.deliveryId ?? "",
  );
  return byDelivery || questIdentity(left).localeCompare(questIdentity(right));
}

export function mergeGitHubQuests(
  current: readonly GitHubQuest[],
  incoming: readonly GitHubQuest[],
): GitHubQuest[] {
  const deliveries = new Set<string>();
  const identities = new Set<string>();
  const merged: GitHubQuest[] = [];
  for (const item of [...current, ...incoming].sort(newestFirst)) {
    if (item.deliveryId && deliveries.has(item.deliveryId)) continue;
    if (item.deliveryId) deliveries.add(item.deliveryId);
    const identity = questIdentity(item);
    if (identities.has(identity)) continue;
    identities.add(identity);
    merged.push(item);
    if (merged.length === 20) break;
  }
  return merged;
}

type PersistedProject = GitHubQuest["repository"] & { projectId: string };

function mapProjectRow(value: unknown): PersistedProject | null {
  const row = record(value);
  if (!row) return null;
  const projectId = text(row.id, 64);
  const id = positiveSafeInteger(row.github_repo_id);
  const nodeId = text(row.github_node_id, 256);
  const owner = text(row.github_owner, 256);
  const name = text(row.github_repo, 256);
  const installationId =
    row.installation_id === null
      ? null
      : positiveSafeInteger(row.installation_id);
  if (
    !projectId ||
    !uuidPattern.test(projectId) ||
    id === null ||
    !nodeId ||
    !owner ||
    !name ||
    (row.installation_id !== null && installationId === null)
  )
    return null;
  return { projectId, id, nodeId, owner, name, installationId };
}

function mapQuestRow(
  value: unknown,
  worldId: string,
  projects: ReadonlyMap<string, PersistedProject>,
): GitHubQuest | null {
  const row = record(value);
  if (!row) return null;
  const projectId = text(row.project_id, 64);
  const repository = projectId ? projects.get(projectId) : undefined;
  const kind = text(row.kind);
  const id = positiveSafeInteger(row.github_item_id);
  const nodeId = text(row.github_node_id, 256);
  const number = positiveSafeInteger(row.github_number, POSTGRES_INTEGER_MAX);
  const title = text(row.title, 256);
  const status = text(row.status);
  // Snapshot ordering uses DB ingestion time. github_updated_at separately
  // prevents older GitHub domain events from overwriting the persisted row.
  const occurredAt = instant(row.updated_at);
  if (
    !repository ||
    (kind !== "issue" && kind !== "pull_request") ||
    id === null ||
    !nodeId ||
    number === null ||
    !title ||
    (status !== "open" && status !== "completed") ||
    !occurredAt
  )
    return null;
  return {
    deliveryId: null,
    worldId,
    event: kind === "issue" ? "issues" : "pull_request",
    action: null,
    occurredAt,
    repository: {
      id: repository.id,
      nodeId: repository.nodeId,
      owner: repository.owner,
      name: repository.name,
      installationId: repository.installationId,
    },
    quest: { kind, id, nodeId, number, title, status },
  };
}

export async function loadPersistedGitHubQuests(
  client: GitHubQuestLoaderClient,
  worldId: string,
): Promise<GitHubQuest[]> {
  try {
    if (!worldId.trim()) return [];
    const projectResult = await client
      .from("projects")
      .select(
        "id,github_repo_id,github_node_id,github_owner,github_repo,installation_id",
      )
      .eq("world_id", worldId);
    if (projectResult.error || !Array.isArray(projectResult.data)) return [];
    const projects = new Map<string, PersistedProject>();
    for (const value of projectResult.data) {
      const project = mapProjectRow(value);
      if (project) projects.set(project.projectId, project);
    }
    if (!projects.size) return [];

    const questResult = await client
      .from("quests")
      .select(
        "project_id,kind,github_item_id,github_node_id,github_number,title,status,updated_at",
      )
      .in("project_id", [...projects.keys()])
      .order("updated_at", { ascending: false })
      .limit(20);
    if (questResult.error || !Array.isArray(questResult.data)) return [];
    return mergeGitHubQuests(
      [],
      questResult.data.flatMap((value) => {
        const item = mapQuestRow(value, worldId, projects);
        return item ? [item] : [];
      }),
    );
  } catch {
    return [];
  }
}

export function presentGitHubQuest(quest: GitHubQuest) {
  const kind = quest.quest.kind === "issue" ? "ISSUE" : "PR";
  const status = quest.quest.status.toUpperCase();
  const event = `${quest.event === "issues" ? "ISSUES" : "PULL REQUEST"} · ${
    quest.action?.replaceAll("_", " ").toUpperCase() ?? "SAVED STATE"
  }`;
  return {
    kind,
    number: `#${quest.quest.number}`,
    status,
    event,
    announcement: `GitHub 퀘스트 업데이트: ${quest.quest.title} · ${status} · ${event}`,
  };
}
