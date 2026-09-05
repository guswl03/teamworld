# TeamWorld MVP Implementation Plan

> Execute sequentially in the independent teamworld directory using the executing-plans workflow. The user approved implementation of the supplied specification. No repository, commit, deployment, or account is created by this plan.

**Goal:** GitHub로 로그인한 5개 팀원이 하나의 RPG 맵에서 서로의 이동과 상태를 확인한다.

**Architecture:** Next.js handles landing, onboarding, settings and world UI; Phaser renders a procedural tile world and player movement. Supabase handles GitHub PKCE authentication, persistent profiles and private world-scoped Presence/Broadcast. An explicitly labeled local demo uses browser BroadcastChannel and requires no credentials.

**Tech Stack:** Next.js, React, TypeScript, Phaser 3, Supabase JS, CSS.

**Spec:** [TeamWorld MVP specification](../../teamworld_mvp_spec.md) (provided reference, sections 1–7, 10, 14, 17 and 19).

## Constraints and decisions

- Desktop first; mobile shows roster and status, without game movement.
- Chat and GitHub repository/quest integration are follow-up features, as specified in sections 5 and 18. Sprint 4's chat entry is deferred to resolve that contradiction.
- Five seeded teams; database accepts more teams. Team identity uses UUIDs.
- One deployed world initially. Membership is an administrator-managed GitHub ID allowlist; GitHub login alone does not authorize world access.
- Public browser credentials only. OAuth secrets belong in the Supabase provider configuration. No service-role key is needed in the app.
- Persistent records have RLS. Positions remain ephemeral. Broadcast is limited to 10 Hz with interpolation on receivers.
- Demo players are real browser tabs, not simulated coworkers; counts reflect actual presence.

## Tasks

- [x] App foundation and profile flow: package.json, src/app routes, src/lib/{types,data,profile,supabase}.ts, src/components/{landing,profile-form,session-provider}.tsx. Nickname validation, browser reload and demo onboarding verified; live OAuth requires external setup.
- [x] World: src/game/{world-model,create-world}.ts, src/components/{game-canvas,world-shell}.tsx. Boundaries, obstacles, diagonal speed, five regions, camera, keyboard focus, roster and status verified.
- [x] Networking: src/lib/{transport,demo-transport,supabase-transport}.ts. Packet validation, late join snapshots, demo expiry, retry and cleanup implemented. Two-tab demo joins/movement/status/leaves verified; hosted Realtime requires external setup.
- [x] Supabase schema and operations: supabase/migrations/001_teamworld.sql, tests/database.test.ts, .env.example, README.md. Allowlist, profile column grants, team/world consistency and private channel policies verified in local PostgreSQL. OAuth and deployment instructions provided.
- [x] Verification: tests/world.test.ts, tests/transport.test.ts and tests/database.test.ts using Node test runner through tsx; typecheck, tests and production build passed. Desktop/mobile browser checks recorded in docs/verification.md.

## Verification commands

```text
pnpm typecheck
pnpm test
pnpm build
pnpm dev --hostname 127.0.0.1 --port 3100
```

Manual acceptance: open /, enter demo onboarding, choose team/avatar/name, move in /world; open a second demo tab and confirm both rosters/positions/status; navigate settings and return; leave one tab and confirm removal; inspect mobile roster. Real acceptance repeats this with two allowlisted GitHub accounts on separate computers after running the migration and configuring OAuth.
