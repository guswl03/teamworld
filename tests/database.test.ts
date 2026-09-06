import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
const world = "11111111-1111-4111-8111-111111111111",
  team = "22222222-2222-4222-8222-000000000001";
const alice = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  bob = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
  outsider = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
test("migration enforces profile ownership, allowlist, identity and private world access", async (t) => {
  const db = new PGlite();
  try {
    // Minimal Supabase-owned schema fixtures. The application migration is executed unchanged.
    await db.exec(`create role anon; create role authenticated; create role service_role;
      create schema auth; create schema realtime;
      create table auth.users(id uuid primary key);
      create table auth.identities(user_id uuid, provider text, provider_id text, identity_data jsonb);
      create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
      grant usage on schema auth,realtime to authenticated,anon;
      grant execute on function auth.uid() to authenticated,anon;
      create table realtime.messages(id bigint generated always as identity,extension text);
      create table realtime.sent_messages(
        id bigint generated always as identity,
        payload jsonb not null,
        event text not null,
        topic text not null,
        is_private boolean not null
      );
      alter table realtime.messages enable row level security;
      grant select,insert on realtime.messages to authenticated;
      create function realtime.topic() returns text language sql stable as $$select current_setting('realtime.topic',true)$$;
      create function realtime.send(payload jsonb,event text,topic text,private boolean)
      returns void language sql as $$
        insert into realtime.sent_messages(payload,event,topic,is_private)
        values (payload,event,topic,private)
      $$;`);
    await db.exec(
      await readFile(
        new URL("../supabase/migrations/001_teamworld.sql", import.meta.url),
        "utf8",
      ),
    );
    await db.exec(
      await readFile(
        new URL("../supabase/migrations/002_github_rpg.sql", import.meta.url),
        "utf8",
      ),
    );
    await db.exec(`insert into auth.users values ('${alice}'),('${bob}'),('${outsider}');
      insert into auth.identities values ('${alice}','github','101','{"user_name":"alice"}'),('${bob}','github','102','{"user_name":"bob"}'),('${outsider}','github','103','{"user_name":"outsider"}');
      insert into public.world_access(world_id,github_id) values ('${world}','101'),('${world}','102');`);
    async function asUser(id: string) {
      await db.exec("reset role");
      await db.query("select set_config('request.jwt.claim.sub',$1,false)", [
        id,
      ]);
      await db.exec("set role authenticated");
    }
    async function createProfile(id: string, name: string) {
      return db.query(
        `insert into public.profiles(id,world_id,nickname,avatar_type,team_id,status) values ($1,$2,$3,'ranger',$4,'online') returning *`,
        [id, world, name, team],
      );
    }
    function githubEvent(
      deliveryId: string,
      kind: "issue" | "pull_request",
      status: "open" | "completed",
      title: string,
    ) {
      return {
        delivery_id: deliveryId,
        world_id: world,
        repository: {
          id: 1358198956,
          node_id: "R_kgDOUPR4rA",
          owner: "guswl03",
          name: "teamworld",
          installation_id: null,
        },
        quest: {
          kind,
          id: kind === "issue" ? 701 : 801,
          node_id: kind === "issue" ? "I_kwDOUPR4rA6x" : "PR_kwDOUPR4rA6y",
          number: kind === "issue" ? 7 : 8,
          title,
          status,
        },
      };
    }
    async function ingest(event: ReturnType<typeof githubEvent>) {
      await db.exec("reset role; set role service_role");
      try {
        const result = await db.query(
          "select public.ingest_github_event($1::jsonb) as result",
          [JSON.stringify(event)],
        );
        return (result.rows[0] as { result: Record<string, unknown> }).result;
      } finally {
        await db.exec("reset role");
      }
    }
    await t.test(
      "migration seeds the connected TeamWorld repository",
      async () => {
        const result = await db.query(
          "select world_id,github_repo_id,github_node_id,github_owner,github_repo,installation_id from public.projects",
        );
        assert.deepEqual(result.rows, [
          {
            world_id: world,
            github_repo_id: 1358198956,
            github_node_id: "R_kgDOUPR4rA",
            github_owner: "guswl03",
            github_repo: "teamworld",
            installation_id: null,
          },
        ]);
      },
    );
    await t.test(
      "service ingestion atomically creates a quest and duplicate delivery is inert",
      async () => {
        const opened = githubEvent(
          "delivery-issue-open",
          "issue",
          "open",
          "Ship quests",
        );
        assert.deepEqual(await ingest(opened), { duplicate: false });

        const quest = await db.query(
          "select kind,github_item_id,github_number,title,status from public.quests",
        );
        assert.deepEqual(quest.rows, [
          {
            kind: "issue",
            github_item_id: 701,
            github_number: 7,
            title: "Ship quests",
            status: "open",
          },
        ]);
        assert.equal(
          (await db.query("select id from public.github_deliveries")).rows
            .length,
          1,
        );
        assert.deepEqual(
          await ingest({
            ...opened,
            quest: {
              ...opened.quest,
              title: "MUTATED",
              status: "completed",
            },
          }),
          { duplicate: true },
        );
        const sentMessages = await db.query(
          "select count(*)::integer as count from realtime.sent_messages",
        );
        assert.equal((sentMessages.rows[0] as { count: number }).count, 1);
        assert.deepEqual(
          (await db.query("select title,status from public.quests")).rows[0],
          { title: "Ship quests", status: "open" },
        );
      },
    );
    await t.test(
      "issue and pull request quests transition to completed",
      async () => {
        await ingest(
          githubEvent(
            "delivery-issue-close",
            "issue",
            "completed",
            "Ship quests",
          ),
        );
        await ingest(
          githubEvent(
            "delivery-pr-open",
            "pull_request",
            "open",
            "Add webhook",
          ),
        );
        const completedPr = githubEvent(
          "delivery-pr-close",
          "pull_request",
          "completed",
          "Add webhook",
        );
        await ingest(completedPr);

        const quests = await db.query(
          "select kind,status from public.quests order by kind",
        );
        assert.deepEqual(quests.rows, [
          { kind: "issue", status: "completed" },
          { kind: "pull_request", status: "completed" },
        ]);
        const messages = await db.query(
          "select payload,event,topic,is_private from realtime.sent_messages order by id",
        );
        assert.equal(messages.rows.length, 4);
        assert.deepEqual(messages.rows[3], {
          payload: completedPr,
          event: "quest_event",
          topic: `world:${world}`,
          is_private: true,
        });
      },
    );
    await t.test(
      "invited users read RPG rows, outsiders see none, and client writes are denied",
      async () => {
        await asUser(alice);
        assert.equal(
          (await db.query("select id from public.projects")).rows.length,
          1,
        );
        assert.equal(
          (await db.query("select id from public.quests")).rows.length,
          2,
        );
        assert.equal(
          (await db.query("select id from public.github_deliveries")).rows
            .length,
          4,
        );
        await assert.rejects(
          db.query(
            "insert into public.projects(world_id,github_repo_id,github_node_id,github_owner,github_repo) values ($1,999,'node','owner','repo')",
            [world],
          ),
          /permission denied/,
        );
        await assert.rejects(
          db.query(
            "insert into public.quests(project_id,kind,github_item_id,github_node_id,github_number,title,status) values ('33333333-3333-4333-8333-333333333333','issue',999,'node',999,'Denied','open')",
          ),
          /permission denied/,
        );
        await assert.rejects(
          db.query(
            "insert into public.github_deliveries(world_id,delivery_id,event_payload) values ($1,'client-write','{}')",
            [world],
          ),
          /permission denied/,
        );
        await assert.rejects(
          db.query("select public.ingest_github_event($1::jsonb)", [
            JSON.stringify(
              githubEvent("client-write", "issue", "open", "Denied"),
            ),
          ]),
          /permission denied/,
        );

        await asUser(outsider);
        assert.equal(
          (await db.query("select id from public.projects")).rows.length,
          0,
        );
        assert.equal(
          (await db.query("select id from public.quests")).rows.length,
          0,
        );
        assert.equal(
          (await db.query("select id from public.github_deliveries")).rows
            .length,
          0,
        );
      },
    );
    await t.test(
      "allowlisted user reads five teams and creates trusted GitHub identity",
      async () => {
        await asUser(alice);
        const teams = await db.query("select id from public.teams");
        assert.equal(teams.rows.length, 5);
        const result = await createProfile(alice, "Alice");
        assert.equal(
          (result.rows[0] as Record<string, unknown>).github_id,
          "101",
        );
        assert.equal(
          (result.rows[0] as Record<string, unknown>).github_username,
          "alice",
        );
      },
    );
    await t.test(
      "second user can read roster but cannot modify another profile",
      async () => {
        await asUser(bob);
        await createProfile(bob, "Bob");
        const result = await db.query(
          "update public.profiles set nickname='Hacked' where id=$1 returning id",
          [alice],
        );
        assert.equal(result.rows.length, 0);
        assert.equal(
          (await db.query("select id from public.profiles")).rows.length,
          2,
        );
        await db.query(
          "update public.profiles set status='working' where id=$1",
          [bob],
        );
      },
    );
    await t.test(
      "clients cannot forge identity, world or allowlist",
      async () => {
        await asUser(alice);
        await assert.rejects(
          db.query("update public.profiles set github_id='999' where id=$1", [
            alice,
          ]),
          /permission denied/,
        );
        await assert.rejects(
          db.query("update public.profiles set world_id=$1 where id=$2", [
            world,
            alice,
          ]),
          /permission denied/,
        );
        await assert.rejects(
          db.exec(
            `insert into public.world_access values ('${world}','999',now())`,
          ),
          /permission denied/,
        );
        await assert.rejects(
          createProfile(outsider, "Impersonator"),
          /row-level security/,
        );
      },
    );
    await t.test(
      "uninvited login has no world data or channel access",
      async () => {
        await asUser(outsider);
        assert.equal(
          (await db.query("select id from public.teams")).rows.length,
          0,
        );
        assert.equal(
          (await db.query("select id from public.profiles")).rows.length,
          0,
        );
        await assert.rejects(
          createProfile(outsider, "Outsider"),
          /row-level security/,
        );
        await db.query("select set_config('realtime.topic',$1,false)", [
          `world:${world}`,
        ]);
        await assert.rejects(
          db.exec(
            "insert into realtime.messages(extension) values ('broadcast')",
          ),
          /row-level security/,
        );
      },
    );
    await t.test(
      "private channels accept only authorized topics and message types",
      async () => {
        await asUser(alice);
        await db.query("select set_config('realtime.topic',$1,false)", [
          `world:${world}`,
        ]);
        await db.exec(
          "insert into realtime.messages(extension) values ('broadcast'),('presence')",
        );
        assert.equal(
          (await db.query("select * from realtime.messages")).rows.length,
          2,
        );
        await db.query(
          "select set_config('realtime.topic','world:invalid',false)",
        );
        assert.equal(
          (await db.query("select * from realtime.messages")).rows.length,
          0,
        );
        await assert.rejects(
          db.exec(
            "insert into realtime.messages(extension) values ('broadcast')",
          ),
          /row-level security/,
        );
      },
    );
    await t.test(
      "cross-world team selection is rejected even when both worlds are accessible",
      async () => {
        const world2 = "99999999-9999-4999-8999-999999999999",
          team2 = "99999999-9999-4999-8999-999999999998";
        await db.exec("reset role");
        await db.exec(
          `insert into public.worlds(id,name)values('${world2}','Other');insert into public.teams(id,world_id,name,slug,room_id) values('${team2}','${world2}','Other','other','other');insert into public.world_access(world_id,github_id)values('${world2}','101');`,
        );
        await asUser(alice);
        await assert.rejects(
          db.query("update public.profiles set team_id=$1 where id=$2", [
            team2,
            alice,
          ]),
          /foreign key/,
        );
      },
    );
    await t.test(
      "revoked membership loses data visibility and anonymous access is denied",
      async () => {
        await db.exec("reset role");
        await db.exec(`delete from public.world_access where github_id='101'`);
        await asUser(alice);
        assert.equal(
          (await db.query("select * from public.profiles")).rows.length,
          0,
        );
        await db.exec("reset role; set role anon");
        await assert.rejects(
          db.query("select * from public.profiles"),
          /permission denied/,
        );
      },
    );
    await t.test(
      "connected repository cannot be moved to a supplied world",
      async () => {
        const otherWorld = "88888888-8888-4888-8888-888888888888";
        await db.exec("reset role");
        await db.exec(
          `insert into public.worlds(id,name) values ('${otherWorld}','Webhook target')`,
        );
        await assert.rejects(
          ingest({
            ...githubEvent(
              "delivery-cross-world",
              "issue",
              "completed",
              "Cross-world write",
            ),
            world_id: otherWorld,
          }),
          /world does not match connected project/,
        );
        assert.deepEqual(
          (
            await db.query(
              "select world_id,github_node_id from public.projects order by id",
            )
          ).rows,
          [{ world_id: world, github_node_id: "R_kgDOUPR4rA" }],
        );
        assert.deepEqual(
          (
            await db.query(`select
              (select count(*)::integer from public.projects) as projects,
              (select count(*)::integer from public.quests) as quests,
              (select count(*)::integer from public.github_deliveries) as deliveries,
              (select count(*)::integer from realtime.sent_messages) as messages`)
          ).rows,
          [{ projects: 1, quests: 2, deliveries: 4, messages: 4 }],
        );
      },
    );
    await t.test(
      "unknown repository is rejected without persistence or broadcast",
      async () => {
        const unknown = githubEvent(
          "delivery-unknown-repo",
          "issue",
          "open",
          "Unknown repository",
        );
        await assert.rejects(
          ingest({
            ...unknown,
            repository: {
              ...unknown.repository,
              id: 987654321,
              node_id: "R_unknown",
              owner: "attacker",
              name: "unknown",
            },
          }),
          /repository is not connected/,
        );
        assert.deepEqual(
          (
            await db.query(`select
              (select count(*)::integer from public.projects) as projects,
              (select count(*)::integer from public.quests) as quests,
              (select count(*)::integer from public.github_deliveries) as deliveries,
              (select count(*)::integer from realtime.sent_messages) as messages`)
          ).rows,
          [{ projects: 1, quests: 2, deliveries: 4, messages: 4 }],
        );
      },
    );
    await t.test(
      "connected repository rejects a mismatched GitHub node id",
      async () => {
        const mismatched = githubEvent(
          "delivery-node-mismatch",
          "pull_request",
          "open",
          "Wrong repository identity",
        );
        await assert.rejects(
          ingest({
            ...mismatched,
            repository: {
              ...mismatched.repository,
              node_id: "R_mismatch",
            },
          }),
          /repository node id does not match connected project/,
        );
        assert.deepEqual(
          (
            await db.query(`select
              (select count(*)::integer from public.projects) as projects,
              (select count(*)::integer from public.quests) as quests,
              (select count(*)::integer from public.github_deliveries) as deliveries,
              (select count(*)::integer from realtime.sent_messages) as messages`)
          ).rows,
          [{ projects: 1, quests: 2, deliveries: 4, messages: 4 }],
        );
      },
    );
  } finally {
    await db.close();
  }
});
