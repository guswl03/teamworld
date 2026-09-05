# World Adventure Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans to implement this plan task-by-task in the approved current checkout. No commits, branches, pushes or deployment.

**Goal:** Playable village exploration, cosmetic reward and ephemeral world chat.
**Architecture:** Pure adventure/chat models, React panels, existing Phaser controller and two existing transports. No database changes.
**Tech Stack:** Existing Next.js, React, TypeScript, Phaser, Supabase, node:test.
**Spec:** `docs/superpowers/specs/2026-09-05-world-adventure-design.md`

## Global Constraints

- No new production dependencies, DB migrations, commits, pushes or deployment.
- Chat is 1–200 trimmed characters, one send per second, newest 100 messages in memory.
- Local cosmetic/progress storage is versioned and scoped by world/profile.
- Mobile retains no canvas but supports chat. IME composition never submits.
- Existing online players and counts remain real; NPCs are clearly identified.

## Task 1: Chat model and transport

Files: create `src/lib/chat.ts`, `tests/chat.test.ts`; modify `src/lib/types.ts`, `src/lib/demo-transport.ts`, `src/lib/supabase-transport.ts`, `tests/transport.test.ts`.

Interfaces: `ChatMessage { id, session_id, world_id, text, nickname, receivedAt }`; `Transport.chat(text: string): Promise<void>`; optional `TransportCallbacks.chat(message)`.

- [ ] Test first: `assert.equal(normalizeChat("  hi  "), "hi")`, reject blank/201 chars; bounded dedup queue; `createChatGate()` blocks sends less than 1000 ms apart and rejects foreign/unknown sessions.
- [ ] Run `pnpm test`: observe missing model tests fail, existing tests pass.
- [ ] Implement model, validate sends/receives in both transports; derive sender nickname from current presence. Never use payload HTML. Own message emitted only on successful send. Close disables sending.
- [ ] Add real BroadcastChannel two-client chat, foreign-world isolation, close and duplicate tests. Run `pnpm test` again.

## Task 2: Adventure model and local persistence

Files: create `src/game/adventure-model.ts`, `tests/adventure.test.ts`.

Interfaces: `Adventure { version: 1, accepted: boolean, visited: string[], treasure: boolean, rewarded: boolean, equipped: boolean }`, `advanceAdventure(state, action, position)`, `restoreAdventure(value)`, `LANDMARKS`, `NPC`, `CHEST`.

- [ ] Test order and distance: interact at origin cannot accept NPC quest; accept at NPC; visit three landmarks; chest before visiting all fails; returning with treasure grants one cosmetic.
- [ ] Test duplicate rewards, equip before reward, invalid storage combinations, unique visited IDs and target accessibility against `obstaclesFor`.
- [ ] Run failing tests, implement pure reducer, rerun tests. Keep all targets on walkable positions and near drawn objects.

## Task 3: UI, controls and world scenery

Files: create `src/components/world-chat.tsx`, `src/components/adventure-panel.tsx`, `src/game/world-details.ts`; modify `src/components/world-shell.tsx`, `src/components/game-canvas.tsx`, `src/game/create-world.ts`, `src/app/globals.css`.

- [ ] Wire chat callback into WorldSession and add mobile-compatible panel: text input, Enter/IME/Escape handling, failed-send retained draft, disabled offline sends and bounded scroll list. Check browser send between two tabs, including literal `<b>text</b>`.
- [ ] Add adventure panel backed by pure reducer and localStorage, storage exceptions display warning. Dialog owns focus with Escape dismissal. On E only canvas focus can interact. Expose controller `adventure(state)` and `onInteract(position)`; movement remains disabled outside canvas.
- [ ] Add quest tracker, NPC dialogue, chest interaction, inventory equip/unequip and toast. Play complete three-quest path and reload to verify restoration.
- [ ] Add distinct guild details, market, signposts, smoke, water and firefly motion using Phaser graphics. Add local hat attachment and status markers derived from adventure state. Visually check no path blockage and no fake coworker counts.
- [ ] Typecheck and format only changed files; run all tests.

## Task 4: Verification and handoff

Files: update `README.md`, `docs/verification.md`.

- [ ] Run `pnpm test`, `pnpm typecheck`, `pnpm format:check`, `pnpm build` and inspect actual output.
- [ ] Run preview from this checkout on available loopback port; verify desktop world, NPC, quests, reward, refresh, two-tab chat, IME and mobile.
- [ ] Record tested cases, local storage/chat limitations and unverified hosted Supabase behavior. Preserve uncommitted changes for user review.

## Progress

- Approved design and repository state read. Current checkout has only the previously drafted design untracked.
- Existing dependency restore required network permissions; no dependency versions changed.
- Execution is inline: shared world controller and shell integration are closely coupled. User requested implementation in the current project; branch creation remains excluded.
- 2026-09-05: Tasks 1–3 implemented and tested, including real two-tab chat and the full exploration/reward/reload flow. Task 4 completed for local typecheck, 25 tests, build and desktop/mobile browser checks; actual OS IME and hosted Supabase checks remain unverified (see `docs/verification.md`).
- User subsequently approved external art integration. Added 18 unmodified Tiny Swords Update 010 CC0 PNGs, provenance, a runtime Tiled-compatible map, idle/walk sprites and matching UI portraits. No new production dependencies, paid tools or external publication.
