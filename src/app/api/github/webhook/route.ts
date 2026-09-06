import { handleGitHubWebhookRequest } from "@/lib/github-webhook-route";
import {
  ingestConnectedGitHubEvent,
  type GitHubEventSupabaseClient,
} from "@/lib/github-webhook-store";
import { createSupabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";

export async function POST(request: Request): Promise<Response> {
  return handleGitHubWebhookRequest(request, {
    getSecret: () => process.env.GITHUB_WEBHOOK_SECRET,
    ingest: (event) =>
      ingestConnectedGitHubEvent(
        createSupabaseAdmin() as unknown as GitHubEventSupabaseClient,
        event,
      ),
  });
}
