-- Keep server-side permission feedback aligned with the UI role label.
create or replace function public.assert_club_admin()
returns void language plpgsql security definer set search_path = public as $$
begin
  perform public.assert_active_member();
  if not public.is_club_admin() then
    raise exception 'アドミンのみ操作できます';
  end if;
end;
$$;

revoke all on function public.assert_club_admin() from public, anon, authenticated;
