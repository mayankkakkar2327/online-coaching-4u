-- Old documents (rejected, or never used for an approved verification) are deleted after 90 days.
create or replace function public.precheck_purge_list() returns jsonb
language sql security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object('id', d.id, 'path', d.path)), '[]')
  from public.documents d
  where d.purged_at is null and d.created_at < now() - interval '90 days'
    and not exists (select 1 from public.verification_requests v where v.slug = d.slug and v.user_id = d.user_id and v.status = 'pending')
$$;
create or replace function public.precheck_mark_purged(p_ids uuid[]) returns void
language sql security definer set search_path = public as $$
  update public.documents set purged_at = now() where id = any(p_ids)
$$;
revoke execute on function public.precheck_purge_list() from public, anon, authenticated;
revoke execute on function public.precheck_mark_purged(uuid[]) from public, anon, authenticated;
grant execute on function public.precheck_purge_list() to service_role;
grant execute on function public.precheck_mark_purged(uuid[]) to service_role;
