-- UKK: Supabase Auth + GitHub Pages migration.
-- The setup-code hash is injected locally before this migration is applied.
create extension if not exists pgcrypto with schema extensions;

do $$ begin
  create type public.club_role as enum ('admin', 'manager', 'member');
exception when duplicate_object then null; end $$;
do $$ begin
  create type public.member_state as enum ('pending', 'active', 'suspended');
exception when duplicate_object then null; end $$;
do $$ begin
  create type public.contest_status as enum ('active', 'completed');
exception when duplicate_object then null; end $$;
do $$ begin
  create type public.task_priority as enum ('low', 'medium', 'high');
exception when duplicate_object then null; end $$;
do $$ begin
  create type public.task_status as enum ('todo', 'doing', 'done');
exception when duplicate_object then null; end $$;

create table if not exists public.profiles (
  id bigint generated always as identity primary key,
  auth_user_id uuid unique references auth.users(id) on delete cascade,
  email text not null,
  display_name varchar(80) not null,
  role public.club_role not null default 'member',
  state public.member_state not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.club_settings (
  id boolean primary key default true check (id),
  owner_profile_id bigint unique references public.profiles(id) on delete restrict,
  setup_code_hash char(64),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.contests (
  id bigint generated always as identity primary key,
  name varchar(100) not null check (length(trim(name)) > 0),
  description text not null default '' check (length(description) <= 5000),
  deadline date,
  color varchar(20) not null default 'green' check (color in ('green', 'blue', 'orange', 'purple')),
  status public.contest_status not null default 'active',
  created_by bigint references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.contest_members (
  contest_id bigint not null references public.contests(id) on delete cascade,
  profile_id bigint not null references public.profiles(id) on delete cascade,
  duty varchar(60) not null default '',
  manages boolean not null default false,
  primary key (contest_id, profile_id)
);

create table if not exists public.tasks (
  id bigint generated always as identity primary key,
  contest_id bigint not null references public.contests(id) on delete cascade,
  title varchar(150) not null check (length(trim(title)) > 0),
  description text not null default '' check (length(description) <= 5000),
  assignee_id bigint references public.profiles(id) on delete set null,
  due_date date,
  priority public.task_priority not null default 'medium',
  status public.task_status not null default 'todo',
  created_by bigint references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists contests_status_idx on public.contests(status);
create index if not exists contest_members_profile_idx on public.contest_members(profile_id);
create index if not exists tasks_contest_idx on public.tasks(contest_id);
create index if not exists tasks_assignee_idx on public.tasks(assignee_id);

insert into public.club_settings (id, setup_code_hash)
values (true, 'f002dc19eb77e60a9d69fa87639d919a393554150c896bbe0b5b4b689af3178e')
on conflict (id) do nothing;

create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at before update on public.profiles
for each row execute function public.set_updated_at();
drop trigger if exists club_settings_set_updated_at on public.club_settings;
create trigger club_settings_set_updated_at before update on public.club_settings
for each row execute function public.set_updated_at();
drop trigger if exists contests_set_updated_at on public.contests;
create trigger contests_set_updated_at before update on public.contests
for each row execute function public.set_updated_at();
drop trigger if exists tasks_set_updated_at on public.tasks;
create trigger tasks_set_updated_at before update on public.tasks
for each row execute function public.set_updated_at();

create or replace function public.handle_new_auth_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (auth_user_id, email, display_name)
  values (
    new.id,
    coalesce(new.email, ''),
    left(coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', split_part(coalesce(new.email, ''), '@', 1), 'UKK部員'), 80)
  )
  on conflict (auth_user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_auth_user();

create or replace function public.current_profile_id()
returns bigint language sql stable security definer set search_path = public as $$
  select id from public.profiles where auth_user_id = auth.uid() limit 1;
$$;

create or replace function public.is_active_member()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = public.current_profile_id() and state = 'active'
  );
$$;

create or replace function public.is_club_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = public.current_profile_id()
      and state = 'active'
      and role = 'admin'
  );
$$;

create or replace function public.can_view_contest(p_contest_id bigint)
returns boolean language sql stable security definer set search_path = public as $$
  select public.is_club_admin() or exists (
    select 1 from public.contest_members cm
    join public.profiles p on p.id = cm.profile_id
    where cm.contest_id = p_contest_id
      and cm.profile_id = public.current_profile_id()
      and p.state = 'active'
  );
$$;

create or replace function public.can_manage_contest(p_contest_id bigint)
returns boolean language sql stable security definer set search_path = public as $$
  select public.is_club_admin() or exists (
    select 1 from public.contest_members cm
    join public.profiles p on p.id = cm.profile_id
    where cm.contest_id = p_contest_id
      and cm.profile_id = public.current_profile_id()
      and p.state = 'active'
      and p.role = 'manager'
      and cm.manages
  );
$$;

create or replace function public.can_view_profile(p_profile_id bigint)
returns boolean language sql stable security definer set search_path = public as $$
  select p_profile_id = public.current_profile_id()
    or public.is_club_admin()
    or exists (
      select 1
      from public.contest_members mine
      join public.contest_members theirs on theirs.contest_id = mine.contest_id
      join public.profiles me on me.id = mine.profile_id
      where mine.profile_id = public.current_profile_id()
        and theirs.profile_id = p_profile_id
        and me.state = 'active'
    );
$$;

create or replace function public.assert_active_member()
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_active_member() then
    raise exception '管理者の登録承認をお待ちください';
  end if;
end;
$$;

create or replace function public.assert_club_admin()
returns void language plpgsql security definer set search_path = public as $$
begin
  perform public.assert_active_member();
  if not public.is_club_admin() then
    raise exception '部長のみ操作できます';
  end if;
end;
$$;

create or replace function public.assert_assignee(p_contest_id bigint, p_assignee_id bigint)
returns void language plpgsql security definer set search_path = public as $$
begin
  if p_assignee_id is null then return; end if;
  if not exists (
    select 1 from public.contest_members cm
    join public.profiles p on p.id = cm.profile_id
    where cm.contest_id = p_contest_id
      and cm.profile_id = p_assignee_id
      and p.state = 'active'
  ) then
    raise exception '担当者はコンテストに参加する有効なメンバーを選んでください';
  end if;
end;
$$;

create or replace function public.get_profile_context()
returns table (
  user_id bigint,
  display_name varchar,
  role public.club_role,
  state public.member_state,
  is_owner boolean,
  setup_available boolean
) language sql stable security definer set search_path = public as $$
  select p.id, p.display_name, p.role, p.state,
    s.owner_profile_id = p.id,
    s.owner_profile_id is null and s.setup_code_hash is not null
  from public.profiles p
  cross join public.club_settings s
  where p.id = public.current_profile_id();
$$;

create or replace function public.claim_initial_owner(p_code text)
returns void language plpgsql security definer set search_path = public as $$
declare
  p_id bigint := public.current_profile_id();
  settings public.club_settings;
begin
  if p_id is null then raise exception 'ログイン状態を確認してください'; end if;
  select * into settings from public.club_settings where id = true for update;
  if settings.owner_profile_id is not null
     or settings.setup_code_hash is null
     or encode(extensions.digest(coalesce(p_code, ''), 'sha256'), 'hex') <> settings.setup_code_hash then
    raise exception '設定コードが正しくないか、初期設定は完了しています';
  end if;
  update public.profiles set role = 'admin', state = 'active' where id = p_id;
  update public.club_settings set owner_profile_id = p_id, setup_code_hash = null where id = true;
end;
$$;

create or replace function public.update_member(
  p_profile_id bigint,
  p_display_name text,
  p_role public.club_role,
  p_state public.member_state
) returns void language plpgsql security definer set search_path = public as $$
declare settings public.club_settings;
begin
  perform public.assert_club_admin();
  if length(trim(coalesce(p_display_name, ''))) = 0 or length(p_display_name) > 80 then
    raise exception '表示名を確認してください';
  end if;
  select * into settings from public.club_settings where id = true for update;
  if settings.owner_profile_id = p_profile_id and (p_role <> 'admin' or p_state <> 'active') then
    raise exception '所有者の管理権限は変更できません';
  end if;
  if not exists (select 1 from public.profiles where id = p_profile_id) then raise exception 'メンバーが見つかりません'; end if;
  update public.profiles set display_name = trim(p_display_name), role = p_role, state = p_state where id = p_profile_id;
  if p_state <> 'active' then
    update public.tasks set assignee_id = null where assignee_id = p_profile_id;
  end if;
  if p_role = 'member' or p_state <> 'active' then
    update public.contest_members set manages = false where profile_id = p_profile_id;
  end if;
end;
$$;

create or replace function public.create_contest(
  p_name text, p_description text, p_deadline date, p_color text, p_status public.contest_status
) returns bigint language plpgsql security definer set search_path = public as $$
declare new_id bigint;
begin
  perform public.assert_club_admin();
  if length(trim(coalesce(p_name, ''))) = 0 or length(p_name) > 100 then raise exception 'コンテスト名を確認してください'; end if;
  if length(coalesce(p_description, '')) > 5000 or p_color not in ('green', 'blue', 'orange', 'purple') then raise exception '入力内容を確認してください'; end if;
  insert into public.contests (name, description, deadline, color, status, created_by)
  values (trim(p_name), coalesce(p_description, ''), p_deadline, p_color, p_status, public.current_profile_id())
  returning id into new_id;
  return new_id;
end;
$$;

create or replace function public.update_contest(
  p_contest_id bigint, p_name text, p_description text, p_deadline date, p_color text, p_status public.contest_status
) returns void language plpgsql security definer set search_path = public as $$
begin
  perform public.assert_club_admin();
  if length(trim(coalesce(p_name, ''))) = 0 or length(p_name) > 100 then raise exception 'コンテスト名を確認してください'; end if;
  if length(coalesce(p_description, '')) > 5000 or p_color not in ('green', 'blue', 'orange', 'purple') then raise exception '入力内容を確認してください'; end if;
  update public.contests set name=trim(p_name), description=coalesce(p_description,''), deadline=p_deadline, color=p_color, status=p_status where id=p_contest_id;
  if not found then raise exception 'コンテストが見つかりません'; end if;
end;
$$;

create or replace function public.set_participation(
  p_contest_id bigint, p_profile_id bigint, p_duty text, p_manages boolean
) returns void language plpgsql security definer set search_path = public as $$
declare target public.profiles;
begin
  perform public.assert_club_admin();
  if not exists (select 1 from public.contests where id = p_contest_id) then raise exception 'コンテストが見つかりません'; end if;
  select * into target from public.profiles where id=p_profile_id;
  if target.id is null or target.state <> 'active' then raise exception '承認済みのメンバーを選んでください'; end if;
  if p_manages and target.role = 'member' then raise exception '管理担当にするには操作権限をコンテストリーダーに変更してください'; end if;
  if length(coalesce(p_duty, '')) > 60 then raise exception '担当ロールを60文字以内にしてください'; end if;
  insert into public.contest_members (contest_id, profile_id, duty, manages)
  values (p_contest_id,p_profile_id,trim(coalesce(p_duty,'')),coalesce(p_manages,false))
  on conflict (contest_id,profile_id) do update set duty=excluded.duty, manages=excluded.manages;
end;
$$;

create or replace function public.remove_participation(p_contest_id bigint, p_profile_id bigint)
returns void language plpgsql security definer set search_path = public as $$
begin
  perform public.assert_club_admin();
  update public.tasks set assignee_id=null where contest_id=p_contest_id and assignee_id=p_profile_id;
  delete from public.contest_members where contest_id=p_contest_id and profile_id=p_profile_id;
end;
$$;

create or replace function public.create_task(
  p_contest_id bigint, p_title text, p_description text, p_assignee_id bigint,
  p_due_date date, p_priority public.task_priority, p_status public.task_status
) returns bigint language plpgsql security definer set search_path = public as $$
declare new_id bigint;
begin
  perform public.assert_active_member();
  if not public.can_manage_contest(p_contest_id) then raise exception 'このコンテストへの権限がありません'; end if;
  if length(trim(coalesce(p_title, ''))) = 0 or length(p_title)>150 or length(coalesce(p_description,''))>5000 then raise exception '入力内容を確認してください'; end if;
  perform public.assert_assignee(p_contest_id,p_assignee_id);
  insert into public.tasks (contest_id,title,description,assignee_id,due_date,priority,status,created_by)
  values (p_contest_id,trim(p_title),coalesce(p_description,''),p_assignee_id,p_due_date,p_priority,p_status,public.current_profile_id())
  returning id into new_id;
  return new_id;
end;
$$;

create or replace function public.update_task(
  p_task_id bigint, p_title text, p_description text, p_assignee_id bigint,
  p_due_date date, p_priority public.task_priority, p_status public.task_status
) returns void language plpgsql security definer set search_path = public as $$
declare task_contest_id bigint;
begin
  perform public.assert_active_member();
  select contest_id into task_contest_id from public.tasks where id=p_task_id;
  if task_contest_id is null then raise exception 'タスクが見つかりません'; end if;
  if not public.can_manage_contest(task_contest_id) then raise exception 'このコンテストへの権限がありません'; end if;
  if length(trim(coalesce(p_title, ''))) = 0 or length(p_title)>150 or length(coalesce(p_description,''))>5000 then raise exception '入力内容を確認してください'; end if;
  perform public.assert_assignee(task_contest_id,p_assignee_id);
  update public.tasks set title=trim(p_title),description=coalesce(p_description,''),assignee_id=p_assignee_id,due_date=p_due_date,priority=p_priority,status=p_status where id=p_task_id;
end;
$$;

create or replace function public.update_task_status(p_task_id bigint, p_status public.task_status)
returns void language plpgsql security definer set search_path = public as $$
declare t public.tasks;
begin
  perform public.assert_active_member();
  select * into t from public.tasks where id=p_task_id;
  if t.id is null then raise exception 'タスクが見つかりません'; end if;
  if not (public.can_manage_contest(t.contest_id) or (public.can_view_contest(t.contest_id) and t.assignee_id = public.current_profile_id())) then
    raise exception '自分の担当タスクのみ進捗を更新できます';
  end if;
  update public.tasks set status=p_status where id=p_task_id;
end;
$$;

alter table public.profiles enable row level security;
alter table public.club_settings enable row level security;
alter table public.contests enable row level security;
alter table public.contest_members enable row level security;
alter table public.tasks enable row level security;

revoke all on public.profiles, public.club_settings, public.contests, public.contest_members, public.tasks from anon, authenticated;
grant select on public.profiles, public.contests, public.contest_members, public.tasks to authenticated;

create policy "profiles visible only to self, admins, or shared contest members"
on public.profiles for select to authenticated using (public.can_view_profile(id));
create policy "active members can view their contests"
on public.contests for select to authenticated using (public.can_view_contest(id));
create policy "active members can view visible contest participants"
on public.contest_members for select to authenticated using (public.can_view_contest(contest_id));
create policy "active members can view visible contest tasks"
on public.tasks for select to authenticated using (public.can_view_contest(contest_id));

revoke all on function public.current_profile_id(), public.is_active_member(), public.is_club_admin(), public.can_view_contest(bigint), public.can_manage_contest(bigint), public.can_view_profile(bigint), public.assert_active_member(), public.assert_club_admin(), public.assert_assignee(bigint,bigint), public.get_profile_context(), public.claim_initial_owner(text), public.update_member(bigint,text,public.club_role,public.member_state), public.create_contest(text,text,date,text,public.contest_status), public.update_contest(bigint,text,text,date,text,public.contest_status), public.set_participation(bigint,bigint,text,boolean), public.remove_participation(bigint,bigint), public.create_task(bigint,text,text,bigint,date,public.task_priority,public.task_status), public.update_task(bigint,text,text,bigint,date,public.task_priority,public.task_status), public.update_task_status(bigint,public.task_status) from public, anon;
grant execute on function public.get_profile_context(), public.claim_initial_owner(text), public.update_member(bigint,text,public.club_role,public.member_state), public.create_contest(text,text,date,text,public.contest_status), public.update_contest(bigint,text,text,date,text,public.contest_status), public.set_participation(bigint,bigint,text,boolean), public.remove_participation(bigint,bigint), public.create_task(bigint,text,text,bigint,date,public.task_priority,public.task_status), public.update_task(bigint,text,text,bigint,date,public.task_priority,public.task_status), public.update_task_status(bigint,public.task_status) to authenticated;
