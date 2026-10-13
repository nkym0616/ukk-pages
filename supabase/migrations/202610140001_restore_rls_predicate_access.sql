-- RLS evaluates policy predicates as the requesting role. These two
-- read-only SECURITY DEFINER predicates are required by SELECT policies.
-- They only return booleans derived from auth.uid() and have no write side effects.
grant execute on function public.can_view_contest(bigint) to authenticated;
grant execute on function public.can_view_profile(bigint) to authenticated;
