begin;

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  world_id uuid not null references public.worlds(id) on delete cascade,
  github_repo_id bigint not null unique check (github_repo_id > 0),
  github_node_id text not null check (char_length(btrim(github_node_id)) > 0),
  github_owner text not null check (char_length(btrim(github_owner)) > 0),
  github_repo text not null check (char_length(btrim(github_repo)) > 0),
  installation_id bigint check (installation_id > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index projects_world_id_idx on public.projects(world_id);

create table public.quests (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  kind text not null check (kind in ('issue','pull_request')),
  github_item_id bigint not null check (github_item_id > 0),
  github_node_id text not null check (char_length(btrim(github_node_id)) > 0),
  github_number integer not null check (github_number > 0),
  title text not null check (char_length(btrim(title)) between 1 and 256),
  status text not null check (status in ('open','completed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, kind, github_item_id),
  unique (project_id, kind, github_number)
);
create index quests_project_id_idx on public.quests(project_id);
create index quests_project_status_idx on public.quests(project_id,status);

create table public.github_deliveries (
  id uuid primary key default gen_random_uuid(),
  world_id uuid not null references public.worlds(id) on delete cascade,
  delivery_id text not null unique check (char_length(btrim(delivery_id)) > 0),
  event_payload jsonb not null,
  created_at timestamptz not null default now()
);
create index github_deliveries_world_id_idx on public.github_deliveries(world_id);
create index github_deliveries_created_at_idx on public.github_deliveries(created_at);

alter table public.projects enable row level security;
alter table public.quests enable row level security;
alter table public.github_deliveries enable row level security;
revoke all on public.projects, public.quests, public.github_deliveries from anon, authenticated;
grant select on public.projects, public.quests, public.github_deliveries to authenticated;

create policy projects_read on public.projects for select to authenticated
  using (public.has_world_access(world_id));
create policy quests_read on public.quests for select to authenticated
  using (
    exists (
      select 1 from public.projects p
      where p.id = project_id and public.has_world_access(p.world_id)
    )
  );
create policy github_deliveries_read on public.github_deliveries for select to authenticated
  using (public.has_world_access(world_id));

create function public.ingest_github_event(event_payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_delivery_id text := nullif(btrim(event_payload->>'delivery_id'), '');
  v_world_id uuid := (event_payload->>'world_id')::uuid;
  v_repo_id bigint := (event_payload#>>'{repository,id}')::bigint;
  v_repo_node_id text := event_payload#>>'{repository,node_id}';
  v_repo_owner text := event_payload#>>'{repository,owner}';
  v_repo_name text := event_payload#>>'{repository,name}';
  v_installation_id bigint := (event_payload#>>'{repository,installation_id}')::bigint;
  v_quest_kind text := event_payload#>>'{quest,kind}';
  v_quest_id bigint := (event_payload#>>'{quest,id}')::bigint;
  v_quest_node_id text := event_payload#>>'{quest,node_id}';
  v_quest_number integer := (event_payload#>>'{quest,number}')::integer;
  v_quest_title text := event_payload#>>'{quest,title}';
  v_quest_status text := event_payload#>>'{quest,status}';
  v_delivery_record_id uuid;
  v_project_id uuid;
begin
  if event_payload is null or jsonb_typeof(event_payload) <> 'object' then
    raise exception 'GitHub event payload must be an object';
  end if;
  if v_quest_kind not in ('issue','pull_request') then
    raise exception 'Unsupported quest kind: %', coalesce(v_quest_kind, 'null');
  end if;
  if v_quest_status not in ('open','completed') then
    raise exception 'Unsupported quest status: %', coalesce(v_quest_status, 'null');
  end if;

  if v_delivery_id is not null then
    insert into public.github_deliveries(world_id,delivery_id,event_payload)
    values (v_world_id,v_delivery_id,event_payload)
    on conflict (delivery_id) do nothing
    returning id into v_delivery_record_id;

    if v_delivery_record_id is null then
      return jsonb_build_object('duplicate', true);
    end if;
  end if;

  insert into public.projects(
    world_id,github_repo_id,github_node_id,github_owner,github_repo,installation_id
  ) values (
    v_world_id,v_repo_id,v_repo_node_id,v_repo_owner,v_repo_name,v_installation_id
  )
  on conflict (github_repo_id) do update set
    world_id = excluded.world_id,
    github_node_id = excluded.github_node_id,
    github_owner = excluded.github_owner,
    github_repo = excluded.github_repo,
    installation_id = excluded.installation_id,
    updated_at = now()
  returning id into v_project_id;

  insert into public.quests(
    project_id,kind,github_item_id,github_node_id,github_number,title,status
  ) values (
    v_project_id,v_quest_kind,v_quest_id,v_quest_node_id,v_quest_number,btrim(v_quest_title),v_quest_status
  )
  on conflict (project_id,kind,github_item_id) do update set
    github_node_id = excluded.github_node_id,
    github_number = excluded.github_number,
    title = excluded.title,
    status = excluded.status,
    updated_at = now();

  perform realtime.send(
    event_payload,
    'quest_event',
    'world:' || v_world_id::text,
    true
  );

  return jsonb_build_object('duplicate', false);
end;
$$;
revoke all on function public.ingest_github_event(jsonb) from public, anon, authenticated;
grant execute on function public.ingest_github_event(jsonb) to service_role;

insert into public.projects(
  id,world_id,github_repo_id,github_node_id,github_owner,github_repo,installation_id
) values (
  '33333333-3333-4333-8333-333333333333',
  '11111111-1111-4111-8111-111111111111',
  1358198956,
  'R_kgDOUPR4rA',
  'guswl03',
  'teamworld',
  null
);

commit;
