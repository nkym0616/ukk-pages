-- Keep member emails out of browser responses for non-admin members.
-- Profile data is exposed only through the RPC below; it checks identity and
-- returns email only to an active admin.

revoke select on table public.profiles from authenticated;

create or replace function public.list_visible_profiles()
returns table (
  user_id bigint,
  display_name varchar,
  role public.club_role,
  state public.member_state,
  email text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    p.id,
    p.display_name,
    p.role,
    p.state,
    case when public.is_club_admin() then p.email else null end
  from public.profiles p
  where public.can_view_profile(p.id)
  order by p.display_name;
$$;

revoke all on function public.list_visible_profiles() from public, anon;
grant execute on function public.list_visible_profiles() to authenticated;
