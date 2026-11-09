-- Daily document pre-check: single-use, short-lived job tickets.
-- A scheduled Claude task (with database access) creates a ticket, then calls the
-- "precheck-docs" edge function with it to get short-lived links to pending documents.
alter table public.catalog add column if not exists address text;

create table if not exists private.precheck_jobs (id uuid primary key default gen_random_uuid(), created_at timestamptz not null default now());

create or replace function public.admin_sync_catalog(p_items jsonb) returns int
language plpgsql security definer set search_path = public as $$
declare a public.profiles := private.require_admin(); n int;
begin
  insert into public.catalog(slug, name, type, city, locality, website, address, synced_at)
  select i->>'slug', i->>'name', i->>'type', i->>'city', i->>'locality', nullif(i->>'website',''), nullif(i->>'address',''), now() from jsonb_array_elements(p_items) i
  where coalesce(i->>'slug','') <> ''
  on conflict (slug) do update set name = excluded.name, type = excluded.type, city = excluded.city, locality = excluded.locality,
    website = excluded.website, address = excluded.address, synced_at = now();
  get diagnostics n = row_count;
  return n;
end $$;

-- called only by the edge function (service role): validates + burns the ticket, returns pending docs
create or replace function public.precheck_job_docs(p_job uuid) returns jsonb
language plpgsql security definer set search_path = public as $$
declare ok boolean;
begin
  delete from private.precheck_jobs where id = p_job and created_at > now() - interval '30 minutes' returning true into ok;
  delete from private.precheck_jobs where created_at < now() - interval '30 minutes';
  if not coalesce(ok, false) then raise exception 'invalid or expired job'; end if;
  return coalesce((select jsonb_agg(jsonb_build_object(
      'id', d.id, 'path', d.path, 'doc_type', d.doc_type, 'file_name', d.file_name, 'slug', d.slug, 'uploaded', d.created_at,
      'kind', coalesce(l.kind, cl.kind, 'institute'),
      'listing_name', coalesce(l.data->>'name', c.name), 'listing_address', coalesce(l.data->>'address', c.address),
      'listing_city', coalesce(l.data->>'city', c.city), 'listing_website', coalesce(l.data->>'website', c.website),
      'uploader_email', p.email, 'uploader_name', p.full_name,
      'same_file_used_by_other_listing', exists (select 1 from public.documents d2 where d2.file_name = d.file_name and d2.slug <> d.slug and d2.doc_type = d.doc_type)
    ) order by d.created_at)
    from public.documents d
    join public.profiles p on p.id = d.user_id
    left join public.listings l on l.slug = d.slug
    left join public.catalog c on c.slug = d.slug
    left join lateral (select kind from public.claims where slug = d.slug and user_id = d.user_id order by id desc limit 1) cl on true
    where d.status = 'uploaded' and d.precheck_status = 'pending' and d.purged_at is null), '[]');
end $$;
revoke execute on function public.precheck_job_docs(uuid) from public, anon, authenticated;
grant execute on function public.precheck_job_docs(uuid) to service_role;
