# GitHub RPG webhook implementation plan

## Goal

Introduce the first trusted server boundary for v0.3: CI, service-only GitHub event persistence, authenticated private-channel quest broadcasts, and a small client quest feed. GitHub App registration and secret provisioning remain deployment steps.

## Global constraints

- Work on `feat/github-rpg-webhook`; target `main` with a pull request.
- Verify `X-Hub-Signature-256` against the exact raw UTF-8 body using HMAC-SHA256 and constant-time comparison before parsing or writing.
- Require and deduplicate `X-GitHub-Delivery`; retries must be idempotent.
- Accept only supported `issues` and `pull_request` actions plus `ping`; ignore unsupported events safely.
- Persist writes through a server-only Supabase admin client. Browser roles get read-only access scoped by existing `has_world_access`; no client write policies.
- Broadcast `quest_event` privately to the existing `world:<uuid>` topic. Do not introduce another Realtime authorization surface.
- Never commit secrets or user tokens. Support `SUPABASE_SECRET_KEY` with the legacy service-role variable as fallback.
- Tests precede production code and exercise real parsers/SQL where practical.

## Task 1: CI and migration 002

- Add a GitHub Actions workflow that installs with the lockfile and runs formatting, tests, typecheck, and build.
- Add `projects`, `quests`, and `github_deliveries` with constraints, indexes, RLS, authenticated read policies, and no authenticated write grants/policies.
- Add a service-only atomic ingestion function that deduplicates delivery IDs, upserts a connected repository and its issue/PR quest, and broadcasts `quest_event` to the project's existing world topic.
- Extend the PGlite database test to apply 002 over 001, verify outsider visibility, authenticated write denial, idempotency, state transitions, and private broadcast payload/topic.

## Task 2: Webhook server boundary

- Add a pure webhook module for signature verification, header validation, supported payload normalization, and dependency-injected ingestion.
- Add a Node-runtime Next.js Route Handler at `/api/github/webhook` that reads the raw body, verifies before JSON parsing, uses the server-only Supabase client, and returns stable status codes without exposing secrets.
- Test GitHub's published signature vector, malformed/missing headers and JSON, ignored events, normalized issue/PR events, duplicates, and ingestion failures.
- Document exact environment variables and GitHub App webhook setup. Do not register an external app in this task.

## Task 3: Client quest events and UI

- Define a bounded validator for server-originated `quest_event` packets.
- Extend transport callbacks and the existing Supabase channel subscription; the demo transport remains functional.
- Show a bounded recent GitHub quest feed inside the existing quest task window, including repository, issue/PR number, title, and open/completed state.
- Test packet validation, bounded/deduplicated feed behavior, and transport compatibility.

## Verification and delivery

- Run formatter check, all tests, typecheck, and production build.
- Review each task and the whole branch for security and regression risk.
- Push the branch and open a pull request against `main`; do not merge it.
