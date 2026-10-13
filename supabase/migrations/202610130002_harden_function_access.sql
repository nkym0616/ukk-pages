-- Prevent browser clients from calling internal SECURITY DEFINER helpers.
alter default privileges in schema public revoke execute on functions from public;

create policy "club settings are not exposed to clients"
on public.club_settings for all to authenticated
using (false) with check (false);

revoke all on function public.set_updated_at() from public, anon, authenticated;
revoke all on function public.handle_new_auth_user() from public, anon, authenticated;
revoke all on function public.current_profile_id() from public, anon, authenticated;
revoke all on function public.is_active_member() from public, anon, authenticated;
revoke all on function public.is_club_admin() from public, anon, authenticated;
revoke all on function public.can_view_contest(bigint) from public, anon, authenticated;
revoke all on function public.can_manage_contest(bigint) from public, anon, authenticated;
revoke all on function public.can_view_profile(bigint) from public, anon, authenticated;
revoke all on function public.assert_active_member() from public, anon, authenticated;
revoke all on function public.assert_club_admin() from public, anon, authenticated;
revoke all on function public.assert_assignee(bigint, bigint) from public, anon, authenticated;
revoke all on function public.rls_auto_enable() from public, anon, authenticated;

-- Only these request handlers are intentionally available to signed-in users.
grant execute on function public.get_profile_context() to authenticated;
grant execute on function public.claim_initial_owner(text) to authenticated;
grant execute on function public.update_member(bigint, text, public.club_role, public.member_state) to authenticated;
grant execute on function public.create_contest(text, text, date, text, public.contest_status) to authenticated;
grant execute on function public.update_contest(bigint, text, text, date, text, public.contest_status) to authenticated;
grant execute on function public.set_participation(bigint, bigint, text, boolean) to authenticated;
grant execute on function public.remove_participation(bigint, bigint) to authenticated;
grant execute on function public.create_task(bigint, text, text, bigint, date, public.task_priority, public.task_status) to authenticated;
grant execute on function public.update_task(bigint, text, text, bigint, date, public.task_priority, public.task_status) to authenticated;
grant execute on function public.update_task_status(bigint, public.task_status) to authenticated;
