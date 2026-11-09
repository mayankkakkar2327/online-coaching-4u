-- Admin extras: course moderation, write-only secrets (Resend key, deploy hook), email retry.
create or replace function public.admin_course_status(p_id uuid, p_status text) returns void
language plpgsql security definer set search_path = public as $$
declare a public.profiles := private.require_admin(); c public.courses;
begin
  if p_status not in ('published','removed') then raise exception 'Use published or removed.'; end if;
  update public.courses set status = p_status, updated_at = now() where id = p_id returning * into c;
  perform private.mark_dirty();
  perform private.log('admin_course_' || p_status, c.slug, jsonb_build_object('course_id', p_id, 'title', c.title));
end $$;

create or replace function public.admin_set_secret(p_key text, p_value text) returns void
language plpgsql security definer set search_path = public as $$
declare a public.profiles := private.require_admin();
begin
  if p_key not in ('resend_api_key','deploy_hook_url','precheck_token') then raise exception 'Unknown secret.'; end if;
  if coalesce(trim(p_value),'') = '' then delete from private.secrets where key = p_key;
  else insert into private.secrets values (p_key, trim(p_value)) on conflict (key) do update set value = excluded.value; end if;
  perform private.log('secret_changed', null, jsonb_build_object('key', p_key));
end $$;

create or replace function public.admin_retry_emails() returns void
language plpgsql security definer set search_path = public as $$
declare a public.profiles := private.require_admin();
begin update public.email_outbox set status = 'queued' where status = 'failed'; end $$;

revoke execute on function public.admin_course_status(uuid, text) from public, anon;
revoke execute on function public.admin_set_secret(text, text) from public, anon;
revoke execute on function public.admin_retry_emails() from public, anon;
grant execute on function public.admin_course_status(uuid, text) to authenticated;
grant execute on function public.admin_set_secret(text, text) to authenticated;
grant execute on function public.admin_retry_emails() to authenticated;
