-- Leads (enquiries) and student reviews.
create table public.leads (
  id bigint generated always as identity primary key,
  slug text not null,
  name text not null,
  phone text not null,
  source text not null default 'profile',
  status text not null default 'new' check (status in ('new','contacted','enrolled','not_interested')),
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.leads (slug, created_at desc);
create index on public.leads (phone);

create table public.reviews (
  id bigint generated always as identity primary key,
  slug text not null,
  rating int not null check (rating between 1 and 5),
  name text not null,
  email text not null,
  body text not null,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  reason text,
  reply text,
  reply_status text check (reply_status in ('pending','approved','rejected')),
  reply_reason text,
  reply_at timestamptz,
  created_at timestamptz not null default now(),
  decided_at timestamptz
);
create index on public.reviews (slug, status);
create index on public.reviews (lower(email));

alter table public.leads enable row level security;
alter table public.reviews enable row level security;
create policy admin_only on public.leads for select to authenticated using ((select public.is_admin()));
create policy admin_only on public.reviews for select to authenticated using ((select public.is_admin()));

create or replace function private.slug_exists(p_slug text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.catalog where slug = p_slug) or exists (select 1 from public.listings where slug = p_slug and status = 'published')
$$;

-- public: enquiry form on profile / review pages
create or replace function public.submit_lead(p_slug text, p_name text, p_phone text, p_source text default 'profile', p_hp text default '') returns boolean
language plpgsql security definer set search_path = public as $$
declare v_phone text := regexp_replace(coalesce(p_phone,''), '[^0-9+]', '', 'g');
begin
  if coalesce(p_hp,'') <> '' then return true; end if;                       -- bot filled the hidden field
  if not private.slug_exists(p_slug) then raise exception 'Unknown institute.'; end if;
  if length(trim(coalesce(p_name,''))) < 2 then raise exception 'Please enter your name.'; end if;
  if v_phone !~ '^\+?[0-9]{10,13}$' then raise exception 'Please enter a valid mobile number.'; end if;
  if exists (select 1 from public.leads where slug = p_slug and phone = v_phone and created_at > now() - interval '24 hours') then return true; end if;
  if (select count(*) from public.leads where phone = v_phone and created_at > now() - interval '24 hours') >= 10 then return true; end if;
  if (select count(*) from public.leads where created_at > now() - interval '1 minute') >= 30 then raise exception 'Too many requests. Please try again in a minute.'; end if;
  insert into public.leads(slug, name, phone, source) values (p_slug, left(trim(p_name), 100), v_phone, case when p_source = 'review-page' then 'review-page' else 'profile' end);
  return true;
end $$;

-- public: student review form
create or replace function public.submit_review(p_slug text, p_rating int, p_name text, p_email text, p_body text, p_hp text default '') returns boolean
language plpgsql security definer set search_path = public as $$
begin
  if coalesce(p_hp,'') <> '' then return true; end if;
  if not private.slug_exists(p_slug) then raise exception 'Unknown institute.'; end if;
  if p_rating is null or p_rating < 1 or p_rating > 5 then raise exception 'Please choose a rating from 1 to 5 stars.'; end if;
  if length(trim(coalesce(p_name,''))) < 2 then raise exception 'Please enter your name.'; end if;
  if coalesce(p_email,'') !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then raise exception 'Please enter a valid email.'; end if;
  if length(trim(coalesce(p_body,''))) < 30 then raise exception 'Please write at least 30 characters about your experience.'; end if;
  if exists (select 1 from public.reviews where slug = p_slug and lower(email) = lower(trim(p_email)) and status <> 'rejected') then
    raise exception 'You have already reviewed this institute. Thank you!'; end if;
  if (select count(*) from public.reviews where lower(email) = lower(trim(p_email)) and created_at > now() - interval '24 hours') >= 3 then
    raise exception 'Too many reviews from this email today.'; end if;
  if (select count(*) from public.reviews where created_at > now() - interval '1 minute') >= 20 then raise exception 'Too many requests. Please try again in a minute.'; end if;
  insert into public.reviews(slug, rating, name, email, body) values (p_slug, p_rating, left(trim(p_name), 80), left(lower(trim(p_email)), 150), left(trim(p_body), 2000));
  return true;
end $$;

-- institute: leads (verified listings only), including leads from before the claim
create or replace function public.my_leads(p_slug text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare p public.profiles := private.me(); l public.listings;
begin
  select * into l from public.listings where slug = p_slug;
  if l.slug is null or l.owner_id is distinct from p.id then raise exception 'You do not manage this listing.'; end if;
  if not private.is_verified(l) then return jsonb_build_object('locked', true, 'count', (select count(*) from public.leads where slug = p_slug)); end if;
  return jsonb_build_object('locked', false, 'leads', coalesce((select jsonb_agg(to_jsonb(x) order by x.created_at desc) from
    (select id, name, phone, source, status, note, created_at from public.leads where slug = p_slug) x), '[]'));
end $$;

create or replace function public.update_lead(p_id bigint, p_status text, p_note text) returns void
language plpgsql security definer set search_path = public as $$
declare p public.profiles := private.me(); l public.listings;
begin
  select li.* into l from public.listings li join public.leads le on le.slug = li.slug where le.id = p_id;
  if l.slug is null or l.owner_id is distinct from p.id or not private.is_verified(l) then raise exception 'You cannot update this lead.'; end if;
  if p_status not in ('new','contacted','enrolled','not_interested') then raise exception 'Unknown status.'; end if;
  update public.leads set status = p_status, note = left(p_note, 1000), updated_at = now() where id = p_id;
end $$;

-- institute: approved reviews (without reviewer emails) + reply
create or replace function public.my_reviews(p_slug text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare p public.profiles := private.me();
begin
  if not exists (select 1 from public.listings where slug = p_slug and owner_id = p.id) then raise exception 'You do not manage this listing.'; end if;
  return coalesce((select jsonb_agg(jsonb_build_object('id', id, 'rating', rating, 'name', name, 'body', body, 'created_at', created_at,
      'reply', reply, 'reply_status', reply_status, 'reply_reason', reply_reason) order by created_at desc)
    from public.reviews where slug = p_slug and status = 'approved'), '[]');
end $$;

create or replace function public.reply_review(p_id bigint, p_reply text) returns void
language plpgsql security definer set search_path = public as $$
declare p public.profiles := private.me(); r public.reviews;
begin
  select * into r from public.reviews where id = p_id;
  if r.id is null or r.status <> 'approved' or not exists (select 1 from public.listings where slug = r.slug and owner_id = p.id) then raise exception 'Review not found.'; end if;
  if r.reply_status in ('pending','approved') then raise exception 'You have already replied to this review.'; end if;
  if length(trim(coalesce(p_reply,''))) < 5 then raise exception 'Please write a reply.'; end if;
  update public.reviews set reply = left(trim(p_reply), 1500), reply_status = 'pending', reply_reason = null, reply_at = now() where id = p_id;
  perform private.log('review_reply_submitted', r.slug, jsonb_build_object('review_id', p_id));
end $$;

-- admin
create or replace function public.admin_decide_review(p_id bigint, p_approve boolean, p_reason text) returns void
language plpgsql security definer set search_path = public as $$
declare a public.profiles := private.require_admin(); r public.reviews;
begin
  update public.reviews set status = case when p_approve then 'approved' else 'rejected' end, reason = p_reason, decided_at = now()
  where id = p_id returning * into r;
  if r.id is null then raise exception 'Review not found.'; end if;
  perform private.mark_dirty();
  perform private.log(case when p_approve then 'review_approved' else 'review_rejected' end, r.slug, jsonb_build_object('review_id', p_id, 'rating', r.rating, 'reason', p_reason));
end $$;

create or replace function public.admin_decide_reply(p_id bigint, p_approve boolean, p_reason text) returns void
language plpgsql security definer set search_path = public as $$
declare a public.profiles := private.require_admin(); r public.reviews;
begin
  update public.reviews set reply_status = case when p_approve then 'approved' else 'rejected' end, reply_reason = p_reason
  where id = p_id and reply_status = 'pending' returning * into r;
  if r.id is null then raise exception 'Reply is not waiting for review.'; end if;
  if p_approve then perform private.mark_dirty(); end if;
  perform private.log(case when p_approve then 'reply_approved' else 'reply_rejected' end, r.slug, jsonb_build_object('review_id', p_id, 'reason', p_reason));
end $$;

revoke execute on all functions in schema public from public, anon;
grant execute on all functions in schema public to authenticated;
grant execute on function public.track_event(text, text) to anon;
grant execute on function public.site_export() to anon;
grant execute on function public.submit_lead(text, text, text, text, text) to anon;
grant execute on function public.submit_review(text, int, text, text, text, text) to anon;
revoke execute on function public.precheck_job_docs(uuid) from authenticated;
revoke execute on function public.precheck_purge_list() from authenticated;
revoke execute on function public.precheck_mark_purged(uuid[]) from authenticated;
revoke all on all functions in schema private from public, anon, authenticated;

-- site export now includes approved reviews (first name + initial only, never email)
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
      from public.courses c join public.listings l on l.slug = c.slug where c.status = 'published' and l.status = 'published'), '[]'),
    'reviews', coalesce((select jsonb_agg(jsonb_build_object('slug', r.slug, 'rating', r.rating,
        'name', initcap(split_part(trim(r.name), ' ', 1)) || case when position(' ' in trim(r.name)) > 0 then ' ' || upper(left(split_part(trim(r.name), ' ', array_length(regexp_split_to_array(trim(r.name), '\s+'), 1)), 1)) || '.' else '' end,
        'body', r.body, 'date', r.created_at, 'reply', case when r.reply_status = 'approved' then r.reply end) order by r.created_at desc)
      from public.reviews r where r.status = 'approved'), '[]')
  )
$$;
grant execute on function public.site_export() to anon;

-- (applied as a follow-up) normalise Indian mobile numbers so +91 / 0 prefixes don't create duplicate leads
create or replace function public.submit_lead(p_slug text, p_name text, p_phone text, p_source text default 'profile', p_hp text default '') returns boolean
language plpgsql security definer set search_path = public as $$
declare v_phone text := regexp_replace(coalesce(p_phone,''), '[^0-9]', '', 'g');
begin
  if coalesce(p_hp,'') <> '' then return true; end if;
  if not private.slug_exists(p_slug) then raise exception 'Unknown institute.'; end if;
  if length(trim(coalesce(p_name,''))) < 2 then raise exception 'Please enter your name.'; end if;
  if length(v_phone) = 12 and left(v_phone, 2) = '91' then v_phone := right(v_phone, 10);
  elsif length(v_phone) = 11 and left(v_phone, 1) = '0' then v_phone := right(v_phone, 10); end if;
  if v_phone !~ '^[6-9][0-9]{9}$' then raise exception 'Please enter a valid 10-digit mobile number.'; end if;
  if exists (select 1 from public.leads where slug = p_slug and phone = v_phone and created_at > now() - interval '24 hours') then return true; end if;
  if (select count(*) from public.leads where phone = v_phone and created_at > now() - interval '24 hours') >= 10 then return true; end if;
  if (select count(*) from public.leads where created_at > now() - interval '1 minute') >= 30 then raise exception 'Too many requests. Please try again in a minute.'; end if;
  insert into public.leads(slug, name, phone, source) values (p_slug, left(trim(p_name), 100), v_phone, case when p_source = 'review-page' then 'review-page' else 'profile' end);
  return true;
end $$;
revoke execute on function public.submit_lead(text, text, text, text, text) from public;
grant execute on function public.submit_lead(text, text, text, text, text) to anon, authenticated;
