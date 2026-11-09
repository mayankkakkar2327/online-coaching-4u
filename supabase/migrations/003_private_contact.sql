-- Never publish the private contact fields (phone, email) through the public export.
create or replace function public.site_export() returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'generated_at', now(),
    'listings', coalesce((select jsonb_agg(jsonb_build_object('slug', l.slug, 'is_new', l.is_new, 'status', l.status, 'kind', l.kind,
        'claimed', l.owner_id is not null, 'data', l.data - 'phone' - 'email',
        'verified_level', case when private.is_verified(l) then l.verified_level end,
        'verified_until', l.verified_until))
      from public.listings l where l.status in ('published','hidden')), '[]'),
    'courses', coalesce((select jsonb_agg(jsonb_build_object('slug', c.slug, 'title', c.title, 'exam', c.exam, 'mode', c.mode, 'duration', c.duration,
        'fee', c.fee, 'batch_start', c.batch_start, 'schedule', c.schedule, 'description', c.description, 'updated_at', c.updated_at) order by c.created_at)
      from public.courses c join public.listings l on l.slug = c.slug where c.status = 'published' and l.status = 'published'), '[]')
  )
$$;
