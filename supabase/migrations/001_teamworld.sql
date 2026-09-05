begin;

create table public.worlds (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 80),
  created_at timestamptz not null default now()
);
create table public.teams (
  id uuid primary key default gen_random_uuid(),
  world_id uuid not null references public.worlds(id) on delete cascade,
  name text not null,
  slug text not null,
  room_id text not null,
  theme jsonb not null default '{}'::jsonb,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique (id, world_id), unique (world_id, slug), unique (world_id, room_id)
);
-- Managed by administrators through SQL only. GitHub numeric IDs survive username changes.
create table public.world_access (
  world_id uuid not null references public.worlds(id) on delete cascade,
  github_id text not null check (github_id ~ '^[0-9]+$'),
  created_at timestamptz not null default now(),
  primary key (world_id, github_id)
);
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  world_id uuid not null references public.worlds(id),
  github_id text not null unique,
  github_username text not null,
  nickname text not null check (char_length(btrim(nickname)) between 2 and 20 and nickname !~ '[[:cntrl:]<>]'),
  avatar_type text not null check (avatar_type in ('ranger','mage','engineer','explorer')),
  team_id uuid not null,
  status text not null default 'online' check (status in ('online','working','meeting','break','away')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (team_id, world_id) references public.teams(id, world_id)
);
create index profiles_world_id_idx on public.profiles(world_id);
create index profiles_team_id_idx on public.profiles(team_id);

create function public.has_world_access(target_world uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.world_access a
    join auth.identities i on i.provider_id = a.github_id and i.provider = 'github'
    where a.world_id = target_world and i.user_id = (select auth.uid())
  );
$$;
revoke all on function public.has_world_access(uuid) from public;
grant execute on function public.has_world_access(uuid) to authenticated;

create function public.set_profile_identity()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if TG_OP = 'INSERT' then
    select i.provider_id, coalesce(i.identity_data->>'user_name', i.identity_data->>'preferred_username', i.provider_id)
    into new.github_id, new.github_username
    from auth.identities i where i.user_id = new.id and i.provider = 'github' limit 1;
    if new.github_id is null then raise exception 'GitHub identity required'; end if;
  end if;
  new.nickname := btrim(new.nickname);
  new.updated_at := now();
  return new;
end;
$$;
revoke all on function public.set_profile_identity() from public;
create trigger profile_identity before insert or update on public.profiles
for each row execute function public.set_profile_identity();

alter table public.worlds enable row level security;
alter table public.teams enable row level security;
alter table public.world_access enable row level security;
alter table public.profiles enable row level security;
revoke all on public.worlds, public.teams, public.world_access, public.profiles from anon, authenticated;
grant select on public.worlds, public.teams, public.profiles to authenticated;
grant insert (id, world_id, nickname, avatar_type, team_id, status) on public.profiles to authenticated;
grant update (nickname, avatar_type, team_id, status) on public.profiles to authenticated;

create policy worlds_read on public.worlds for select to authenticated using (public.has_world_access(id));
create policy teams_read on public.teams for select to authenticated using (public.has_world_access(world_id));
create policy profiles_read on public.profiles for select to authenticated using (public.has_world_access(world_id));
create policy profiles_insert on public.profiles for insert to authenticated
  with check (id = (select auth.uid()) and public.has_world_access(world_id));
create policy profiles_update on public.profiles for update to authenticated
  using (id = (select auth.uid()) and public.has_world_access(world_id))
  with check (id = (select auth.uid()) and public.has_world_access(world_id));

-- Topics are validated without casting arbitrary client input to UUID.
create function public.can_join_world_topic(topic text)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.worlds w
    where 'world:' || w.id::text = topic and public.has_world_access(w.id)
  );
$$;
revoke all on function public.can_join_world_topic(text) from public;
grant execute on function public.can_join_world_topic(text) to authenticated;
create policy teamworld_realtime_read on realtime.messages for select to authenticated
  using (extension in ('broadcast','presence') and public.can_join_world_topic((select realtime.topic())));
create policy teamworld_realtime_write on realtime.messages for insert to authenticated
  with check (extension in ('broadcast','presence') and public.can_join_world_topic((select realtime.topic())));

insert into public.worlds (id,name) values ('11111111-1111-4111-8111-111111111111','TeamWorld');
insert into public.teams (id,world_id,name,slug,room_id,theme,sort_order) values
('22222222-2222-4222-8222-000000000001','11111111-1111-4111-8111-111111111111','숲의 길드','forest','team-1','{"color":"#708d66","icon":"♧","subtitle":"FOREST GUILD"}',1),
('22222222-2222-4222-8222-000000000002','11111111-1111-4111-8111-111111111111','메이커스 랩','makers','team-2','{"color":"#c58e53","icon":"⚒","subtitle":"MAKERS LAB"}',2),
('22222222-2222-4222-8222-000000000003','11111111-1111-4111-8111-111111111111','별빛 타워','starlight','team-3','{"color":"#9480ae","icon":"✧","subtitle":"STARLIGHT TOWER"}',3),
('22222222-2222-4222-8222-000000000004','11111111-1111-4111-8111-111111111111','모래빛 기지','sandstone','team-4','{"color":"#bd9a63","icon":"⌂","subtitle":"SANDSTONE BASE"}',4),
('22222222-2222-4222-8222-000000000005','11111111-1111-4111-8111-111111111111','블루 하버','harbor','team-5','{"color":"#679ba8","icon":"≈","subtitle":"BLUE HARBOR"}',5);

commit;
