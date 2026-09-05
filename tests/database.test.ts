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
    await db.exec(`create role anon; create role authenticated;
      create schema auth; create schema realtime;
      create table auth.users(id uuid primary key);
      create table auth.identities(user_id uuid, provider text, provider_id text, identity_data jsonb);
      create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
      grant usage on schema auth,realtime to authenticated,anon;
      grant execute on function auth.uid() to authenticated,anon;
      create table realtime.messages(id bigint generated always as identity,extension text);
      alter table realtime.messages enable row level security;
      grant select,insert on realtime.messages to authenticated;
      create function realtime.topic() returns text language sql stable as $$select current_setting('realtime.topic',true)$$;`);
    await db.exec(
      await readFile(
        new URL("../supabase/migrations/001_teamworld.sql", import.meta.url),
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
  } finally {
    await db.close();
  }
});
