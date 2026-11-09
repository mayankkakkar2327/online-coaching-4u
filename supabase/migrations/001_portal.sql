-- OnlineCoaching4U institute portal: schema, rules and server functions.
-- All writes from the browser go through the SECURITY DEFINER functions below;
-- tables only expose read access to the row owner and to admins.

create extension if not exists pg_cron;
create extension if not exists pg_net;
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

-- ---------- core tables ----------
create table private.admin_emails (email text primary key);
insert into private.admin_emails values ('mayankkakkar23@gmail.com');

create table private.secrets (key text primary key, value text not null);
-- keys used: resend_api_key, deploy_hook_url, precheck_token

create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  email text not null,
  full_name text,
  phone text,
  role text not null default 'institute' check (role in ('institute','admin')),
  blocked boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.catalog (               -- copy of the site's existing listings (for search + claim checks)
  slug text primary key,
  name text not null,
  type text not null,
  city text not null,
  locality text,
  website text,
  synced_at timestamptz not null default now()
);

create table public.listings (               -- listings that have an owner or were created in the portal
  slug text primary key,
  owner_id uuid references public.profiles(id) on delete set null,
  kind text not null default 'institute' check (kind in ('institute','individual')),
  is_new boolean not null default false,     -- true = not in data.json, created in the portal
  status text not null default 'published' check (status in ('draft','pending','published','rejected','hidden')),
  data jsonb not null default '{}'::jsonb,   -- live fields (override data.json for existing listings)
  verified_level text check (verified_level in ('institute','individual')),
  verified_at timestamptz,
  verified_until timestamptz,
  reject_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.claims (
  id bigint generated always as identity primary key,
  slug text not null,
  user_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null default 'institute' check (kind in ('institute','individual')),
  method text not null check (method in ('domain_email','documents')),
  domain_match boolean not null default false,
  message text,
  status text not null default 'pending' check (status in ('pending','on_hold','approved','rejected','cancelled')),
  reason text,
  created_at timestamptz not null default now(),
  decided_at timestamptz
);

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  slug text not null,
  doc_type text not null check (doc_type in ('gst','registration','address','owner_id','other')),
  path text not null,
  file_name text,
  status text not null default 'uploaded' check (status in ('uploaded','accepted','rejected')),
  precheck_status text not null default 'pending' check (precheck_status in ('pending','ok','flag')),
  precheck_note text,
  reason text,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  purged_at timestamptz
);

create table public.verification_requests (
  id bigint generated always as identity primary key,
  slug text not null,
  user_id uuid not null references public.profiles(id) on delete cascade,
  level text not null check (level in ('institute','individual')),
  status text not null default 'pending' check (status in ('pending','approved','rejected','cancelled')),
  reason text,
  created_at timestamptz not null default now(),
  decided_at timestamptz
);

create table public.change_requests (
  id bigint generated always as identity primary key,
  slug text not null,
  user_id uuid not null references public.profiles(id) on delete cascade,
  patch jsonb not null,
  status text not null default 'pending' check (status in ('pending','approved','rejected','cancelled')),
  reason text,
  created_at timestamptz not null default now(),
  decided_at timestamptz
);

create table public.courses (
  id uuid primary key default gen_random_uuid(),
  slug text not null,
  title text not null,
  exam text,
  mode text,
  duration text,
  fee text,
  batch_start text,
  schedule text,
  description text,
  status text not null default 'pending' check (status in ('pending','published','rejected','removed')),
  reason text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.activity (
  id bigint generated always as identity primary key,
  actor uuid,
  actor_email text,
  action text not null,
  slug text,
  details jsonb not null default '{}'::jsonb,
  live boolean not null default false,       -- a change that went live without approval
  undone boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.settings (key text primary key, value jsonb not null);

create table public.site_events (
  slug text not null,
  day date not null default current_date,
  views int not null default 0,
  clicks int not null default 0,
  primary key (slug, day)
);

create table public.email_outbox (
  id bigint generated always as identity primary key,
  to_email text not null,
  subject text not null,
  html text not null,
  status text not null default 'queued' check (status in ('queued','sent','failed')),
  created_at timestamptz not null default now(),
  sent_at timestamptz
);

create table private.rebuild_state (id int primary key default 1, dirty boolean not null default false, requested_at timestamptz, last_triggered_at timestamptz);
insert into private.rebuild_state default values;

create index on public.claims (slug); create index on public.claims (user_id);
create index on public.documents (slug); create index on public.documents (user_id);
create index on public.change_requests (slug); create index on public.change_requests (user_id);
create index on public.courses (slug);
create index on public.verification_requests (slug); create index on public.verification_requests (user_id);
create index on public.listings (owner_id);
create index on public.activity (created_at desc);
create index on public.courses (created_by);

-- ---------- settings defaults ----------
insert into public.settings values
 ('minor_fields', '["about","highlights","timings","batches","exams","mode","socials","logo","photos"]'),
 ('major_fields', '["name","type","city","locality","address","estd","website","phone","email","branches","results"]'),
 ('badge_validity_months', '12'),
 ('delete_docs_after_verification', 'true'),
 ('required_docs', '{"institute":["gst","registration","address","owner_id"],"individual":["owner_id","address"]}'),
 ('email_from', '"OnlineCoaching4U <no-reply@onlinecoaching4u.in>"'),
 ('email_templates', '{
   "claim_approved":{"subject":"Your claim for {{listing}} is approved","body":"Hi {{name}},<br><br>You now manage <b>{{listing}}</b> on OnlineCoaching4U. Log in to update your profile and courses, and upload documents to get the Verified badge.<br><br><a href=\"{{link}}\">Open your institute panel</a>"},
   "claim_rejected":{"subject":"Your claim for {{listing}} was not approved","body":"Hi {{name}},<br><br>We could not approve your claim for <b>{{listing}}</b>.<br>Reason: {{reason}}<br><br>You can reply to this email or submit a new claim with documents.<br><a href=\"{{link}}\">Open your institute panel</a>"},
   "listing_approved":{"subject":"{{listing}} is now live on OnlineCoaching4U","body":"Hi {{name}},<br><br>Your listing <b>{{listing}}</b> is approved and will appear on the site within a few minutes.<br><br><a href=\"{{link}}\">Open your institute panel</a>"},
   "listing_rejected":{"subject":"Your listing {{listing}} needs changes","body":"Hi {{name}},<br><br>We could not publish <b>{{listing}}</b> yet.<br>Reason: {{reason}}<br><br>Please update it and submit again.<br><a href=\"{{link}}\">Open your institute panel</a>"},
   "change_approved":{"subject":"Your changes to {{listing}} are approved","body":"Hi {{name}},<br><br>Your requested changes to <b>{{listing}}</b> are approved and will be live within a few minutes.<br><br><a href=\"{{link}}\">Open your institute panel</a>"},
   "change_rejected":{"subject":"Your changes to {{listing}} were not approved","body":"Hi {{name}},<br><br>We could not approve your requested changes to <b>{{listing}}</b>.<br>Reason: {{reason}}<br><br><a href=\"{{link}}\">Open your institute panel</a>"},
   "course_rejected":{"subject":"A course on {{listing}} was not approved","body":"Hi {{name}},<br><br>A course you added to <b>{{listing}}</b> was not approved.<br>Reason: {{reason}}<br><br><a href=\"{{link}}\">Open your institute panel</a>"},
   "verified":{"subject":"{{listing}} is now OC4U Verified","body":"Hi {{name}},<br><br>Congratulations! <b>{{listing}}</b> now carries the {{badge}} badge. You can download the badge for your own website from your panel.<br><br><a href=\"{{link}}\">Open your institute panel</a>"},
   "verification_rejected":{"subject":"Verification for {{listing}} needs attention","body":"Hi {{name}},<br><br>We could not verify <b>{{listing}}</b> yet.<br>Reason: {{reason}}<br><br>Please upload the correct documents and request verification again.<br><a href=\"{{link}}\">Open your institute panel</a>"},
   "badge_removed":{"subject":"The Verified badge on {{listing}} was removed","body":"Hi {{name}},<br><br>The Verified badge on <b>{{listing}}</b> has been removed.<br>Reason: {{reason}}<br><br><a href=\"{{link}}\">Open your institute panel</a>"}
 }');

-- ---------- helpers ----------
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin' and not blocked);
$$;

create or replace function private.me() returns public.profiles
language plpgsql stable security definer set search_path = public as $$
declare p public.profiles;
begin
  select * into p from public.profiles where id = auth.uid();
  if p.id is null then raise exception 'Please log in again.'; end if;
  if p.blocked then raise exception 'This account is blocked. Contact onlinecoaching4u.official@gmail.com.'; end if;
  return p;
end $$;

create or replace function private.setting(k text) returns jsonb
language sql stable security definer set search_path = public as $$ select value from public.settings where key = k $$;

create or replace function private.is_verified(l public.listings) returns boolean
language sql stable as $$ select l.verified_level is not null and (l.verified_until is null or l.verified_until > now()) $$;

create or replace function private.listing_name(p_slug text) returns text
language sql stable security definer set search_path = public as $$
  select coalesce((select data->>'name' from public.listings where slug = p_slug), (select name from public.catalog where slug = p_slug), p_slug)
$$;

create or replace function private.log(p_action text, p_slug text, p_details jsonb, p_live boolean default false) returns bigint
language plpgsql security definer set search_path = public as $$
declare v_id bigint;
begin
  insert into public.activity(actor, actor_email, action, slug, details, live)
  values (auth.uid(), (select email from public.profiles where id = auth.uid()), p_action, p_slug, coalesce(p_details,'{}'), p_live)
  returning id into v_id;
  return v_id;
end $$;

create or replace function private.mark_dirty() returns void
language sql security definer set search_path = private as $$
  update private.rebuild_state set dirty = true, requested_at = now() where id = 1;
$$;

create or replace function private.notify(p_user uuid, p_template text, p_slug text, p_reason text default null) returns void
language plpgsql security definer set search_path = public as $$
declare t jsonb; p public.profiles; subj text; body text; lvl text;
begin
  select * into p from public.profiles where id = p_user;
  if p.id is null then return; end if;
  t := private.setting('email_templates') -> p_template;
  if t is null then return; end if;
  select verified_level into lvl from public.listings where slug = p_slug;
  subj := t->>'subject'; body := t->>'body';
  subj := replace(replace(subj, '{{listing}}', private.listing_name(p_slug)), '{{name}}', coalesce(p.full_name, 'there'));
  body := replace(body, '{{listing}}', private.listing_name(p_slug));
  body := replace(body, '{{name}}', coalesce(p.full_name, 'there'));
  body := replace(body, '{{reason}}', coalesce(p_reason, '-'));
  body := replace(body, '{{badge}}', case when lvl = 'individual' then 'Verified Individual' else 'OC4U Verified' end);
  body := replace(body, '{{link}}', 'https://www.onlinecoaching4u.in/institute');
  insert into public.email_outbox(to_email, subject, html) values (p.email, subj, body);
end $$;

-- keep profiles in sync with auth users; grant admin only to confirmed allow-listed emails
create or replace function private.sync_profile() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles(id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name')
  on conflict (id) do update set email = excluded.email;
  if new.email_confirmed_at is not null and exists (select 1 from private.admin_emails where lower(email) = lower(new.email)) then
    update public.profiles set role = 'admin' where id = new.id;
  end if;
  return new;
end $$;
create trigger on_auth_user_change after insert or update of email, email_confirmed_at on auth.users
for each row execute function private.sync_profile();

-- ---------- row level security ----------
alter table public.profiles enable row level security;
alter table public.catalog enable row level security;
alter table public.listings enable row level security;
alter table public.claims enable row level security;
alter table public.documents enable row level security;
alter table public.verification_requests enable row level security;
alter table public.change_requests enable row level security;
alter table public.courses enable row level security;
alter table public.activity enable row level security;
alter table public.settings enable row level security;
alter table public.site_events enable row level security;
alter table public.email_outbox enable row level security;

create policy own_or_admin on public.profiles for select to authenticated using (id = (select auth.uid()) or (select public.is_admin()));
create policy read_all on public.catalog for select to authenticated using (true);
create policy own_or_admin on public.listings for select to authenticated using (owner_id = (select auth.uid()) or (select public.is_admin()));
create policy own_or_admin on public.claims for select to authenticated using (user_id = (select auth.uid()) or (select public.is_admin()));
create policy own_or_admin on public.documents for select to authenticated using (user_id = (select auth.uid()) or (select public.is_admin()));
create policy own_or_admin on public.verification_requests for select to authenticated using (user_id = (select auth.uid()) or (select public.is_admin()));
create policy own_or_admin on public.change_requests for select to authenticated using (user_id = (select auth.uid()) or (select public.is_admin()));
create policy own_or_admin on public.courses for select to authenticated using ((select public.is_admin()) or exists (select 1 from public.listings l where l.slug = courses.slug and l.owner_id = (select auth.uid())));
create policy admin_only on public.activity for select to authenticated using ((select public.is_admin()));
create policy read_all on public.settings for select to authenticated using (true);
create policy own_or_admin on public.site_events for select to authenticated using ((select public.is_admin()) or exists (select 1 from public.listings l where l.slug = site_events.slug and l.owner_id = (select auth.uid())));
create policy admin_only on public.email_outbox for select to authenticated using ((select public.is_admin()));

-- ---------- storage ----------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('documents', 'documents', false, 5242880, array['application/pdf','image/jpeg','image/png','image/webp']),
       ('media', 'media', true, 3145728, array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

create policy docs_upload on storage.objects for insert to authenticated
  with check (bucket_id = 'documents' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy docs_read on storage.objects for select to authenticated
  using (bucket_id = 'documents' and ((storage.foldername(name))[1] = (select auth.uid())::text or (select public.is_admin())));
create policy docs_delete on storage.objects for delete to authenticated
  using (bucket_id = 'documents' and (select public.is_admin()));
create policy media_upload on storage.objects for insert to authenticated
  with check (bucket_id = 'media' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy media_delete on storage.objects for delete to authenticated
  using (bucket_id = 'media' and ((storage.foldername(name))[1] = (select auth.uid())::text or (select public.is_admin())));

-- ---------- institute-side functions ----------
create or replace function public.update_my_profile(p_full_name text, p_phone text) returns void
language plpgsql security definer set search_path = public as $$
declare p public.profiles := private.me();
begin
  update public.profiles set full_name = left(p_full_name, 120), phone = left(p_phone, 20) where id = p.id;
end $$;

create or replace function public.submit_claim(p_slug text, p_kind text, p_message text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare p public.profiles := private.me(); c public.catalog; l public.listings; v_domain text; v_host text; v_match boolean := false; v_id bigint; v_others int;
begin
  select * into c from public.catalog where slug = p_slug;
  if c.slug is null then raise exception 'Listing not found.'; end if;
  select * into l from public.listings where slug = p_slug;
  if l.owner_id = p.id then raise exception 'You already manage this listing.'; end if;
  if exists (select 1 from public.claims where slug = p_slug and user_id = p.id and status in ('pending','on_hold')) then
    raise exception 'You already have a claim waiting for this listing.'; end if;
  v_domain := lower(split_part(p.email, '@', 2));
  v_host := lower(regexp_replace(regexp_replace(coalesce(c.website,''), '^https?://(www\.)?', ''), '[/:?#].*$', ''));
  if v_host <> '' and v_domain not in ('gmail.com','yahoo.com','yahoo.in','outlook.com','hotmail.com','rediffmail.com','icloud.com','live.com','proton.me','protonmail.com','zoho.com','ymail.com')
     and (v_host = v_domain or v_host like '%.' || v_domain or v_domain like '%.' || v_host) then v_match := true; end if;
  insert into public.claims(slug, user_id, kind, method, domain_match, message)
  values (p_slug, p.id, case when p_kind = 'individual' then 'individual' else 'institute' end,
          case when v_match then 'domain_email' else 'documents' end, v_match, left(p_message, 1000))
  returning id into v_id;
  -- someone else already owns it, or another claim is waiting: put everything on hold for the admin
  select count(*) into v_others from public.claims where slug = p_slug and id <> v_id and status in ('pending','on_hold');
  if v_others > 0 or (l.owner_id is not null) then
    update public.claims set status = 'on_hold' where slug = p_slug and status in ('pending','on_hold');
  end if;
  perform private.log('claim_submitted', p_slug, jsonb_build_object('claim_id', v_id, 'domain_match', v_match));
  return jsonb_build_object('id', v_id, 'domain_match', v_match);
end $$;

create or replace function public.create_listing(p_kind text, p_data jsonb) returns text
language plpgsql security definer set search_path = public as $$
declare p public.profiles := private.me(); v_base text; v_slug text; n int := 1; v_data jsonb;
begin
  if coalesce(trim(p_data->>'name'),'') = '' or coalesce(trim(p_data->>'city'),'') = '' or coalesce(p_data->>'type','') = '' then
    raise exception 'Name, category and city are required.'; end if;
  if (select count(*) from public.listings where owner_id = p.id and is_new and status in ('draft','pending')) >= 5 then
    raise exception 'You have too many listings waiting for review.'; end if;
  v_base := trim(both '-' from regexp_replace(lower((p_data->>'name') || '-' || (p_data->>'city')), '[^a-z0-9]+', '-', 'g'));
  v_slug := v_base;
  while exists (select 1 from public.catalog where slug = v_slug) or exists (select 1 from public.listings where slug = v_slug) loop
    n := n + 1; v_slug := v_base || '-' || n;
  end loop;
  v_data := (select coalesce(jsonb_object_agg(key, value), '{}'::jsonb) from jsonb_each(p_data)
             where key in (select jsonb_array_elements_text(private.setting('minor_fields') || private.setting('major_fields'))));
  insert into public.listings(slug, owner_id, kind, is_new, status, data)
  values (v_slug, p.id, case when p_kind = 'individual' then 'individual' else 'institute' end, true, 'draft', v_data);
  perform private.log('listing_created', v_slug, jsonb_build_object('name', p_data->>'name'));
  return v_slug;
end $$;

create or replace function public.submit_listing(p_slug text) returns void
language plpgsql security definer set search_path = public as $$
declare p public.profiles := private.me();
begin
  update public.listings set status = 'pending', reject_reason = null, updated_at = now()
  where slug = p_slug and owner_id = p.id and is_new and status in ('draft','rejected');
  if not found then raise exception 'This listing cannot be submitted right now.'; end if;
  perform private.log('listing_submitted', p_slug, '{}');
end $$;

-- Save profile edits. Verified + published listings: minor fields go live at once,
-- major fields become a change request. Everything else waits for approval.
create or replace function public.save_listing(p_slug text, p_patch jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare p public.profiles := private.me(); l public.listings; v_minor jsonb := private.setting('minor_fields'); v_major jsonb := private.setting('major_fields');
        v_live jsonb := '{}'; v_pend jsonb := '{}'; k text; v jsonb; v_before jsonb := '{}'; v_req bigint;
begin
  select * into l from public.listings where slug = p_slug for update;
  if l.slug is null or l.owner_id is distinct from p.id then raise exception 'You do not manage this listing.'; end if;
  if length(p_patch::text) > 60000 then raise exception 'That is too much text in one save.'; end if;
  for k, v in select * from jsonb_each(p_patch) loop
    if not (v_minor ? k or v_major ? k) then continue; end if;
    if l.is_new and l.status in ('draft','pending','rejected') then v_live := v_live || jsonb_build_object(k, v);   -- not public yet
    elsif v_minor ? k and private.is_verified(l) and l.status = 'published' then v_live := v_live || jsonb_build_object(k, v);
    else v_pend := v_pend || jsonb_build_object(k, v); end if;
  end loop;
  if v_live <> '{}' then
    select coalesce(jsonb_object_agg(key, l.data -> key), '{}') into v_before from jsonb_object_keys(v_live) key;
    update public.listings set data = data || v_live, updated_at = now() where slug = p_slug;
    if l.status = 'published' then
      perform private.log('live_edit', p_slug, jsonb_build_object('after', v_live, 'before', v_before), true);
      perform private.mark_dirty();
    end if;
  end if;
  if v_pend <> '{}' then
    insert into public.change_requests(slug, user_id, patch) values (p_slug, p.id, v_pend) returning id into v_req;
    perform private.log('change_requested', p_slug, jsonb_build_object('request_id', v_req, 'fields', (select jsonb_agg(key) from jsonb_object_keys(v_pend) key)));
  end if;
  return jsonb_build_object('live', (select coalesce(jsonb_agg(key), '[]') from jsonb_object_keys(v_live) key),
                            'pending', (select coalesce(jsonb_agg(key), '[]') from jsonb_object_keys(v_pend) key),
                            'not_public_yet', l.is_new and l.status <> 'published');
end $$;

create or replace function public.cancel_change(p_id bigint) returns void
language plpgsql security definer set search_path = public as $$
declare p public.profiles := private.me();
begin
  update public.change_requests set status = 'cancelled', decided_at = now() where id = p_id and user_id = p.id and status = 'pending';
end $$;

create or replace function public.save_course(p_slug text, p_course jsonb) returns uuid
language plpgsql security definer set search_path = public as $$
declare p public.profiles := private.me(); l public.listings; v_id uuid; v_status text; v_live boolean;
begin
  select * into l from public.listings where slug = p_slug;
  if l.slug is null or l.owner_id is distinct from p.id then raise exception 'You do not manage this listing.'; end if;
  if coalesce(trim(p_course->>'title'),'') = '' then raise exception 'Course name is required.'; end if;
  v_live := private.is_verified(l) and l.status = 'published';
  v_status := case when v_live or (l.is_new and l.status <> 'published') then 'published' else 'pending' end;
  v_id := nullif(p_course->>'id','')::uuid;
  if v_id is not null then
    update public.courses set title = left(p_course->>'title',150), exam = left(p_course->>'exam',60), mode = left(p_course->>'mode',20),
      duration = left(p_course->>'duration',60), fee = left(p_course->>'fee',120), batch_start = left(p_course->>'batch_start',60),
      schedule = left(p_course->>'schedule',200), description = left(p_course->>'description',2000),
      status = v_status, reason = null, updated_at = now()
    where id = v_id and slug = p_slug and status <> 'removed';
    if not found then raise exception 'Course not found.'; end if;
  else
    if (select count(*) from public.courses where slug = p_slug and status <> 'removed') >= 40 then raise exception 'You can list up to 40 courses.'; end if;
    insert into public.courses(slug, title, exam, mode, duration, fee, batch_start, schedule, description, status, created_by)
    values (p_slug, left(p_course->>'title',150), left(p_course->>'exam',60), left(p_course->>'mode',20), left(p_course->>'duration',60),
            left(p_course->>'fee',120), left(p_course->>'batch_start',60), left(p_course->>'schedule',200), left(p_course->>'description',2000), v_status, p.id)
    returning id into v_id;
  end if;
  if v_live then perform private.log('live_course', p_slug, jsonb_build_object('course_id', v_id, 'title', p_course->>'title'), true); perform private.mark_dirty();
  else perform private.log('course_saved', p_slug, jsonb_build_object('course_id', v_id, 'title', p_course->>'title')); end if;
  return v_id;
end $$;

create or replace function public.remove_course(p_id uuid) returns void
language plpgsql security definer set search_path = public as $$
declare p public.profiles := private.me(); v_slug text; v_was text;
begin
  select c.slug, c.status into v_slug, v_was from public.courses c join public.listings l on l.slug = c.slug where c.id = p_id and l.owner_id = p.id;
  if v_slug is null then raise exception 'Course not found.'; end if;
  update public.courses set status = 'removed', updated_at = now() where id = p_id;
  perform private.log('course_removed', v_slug, jsonb_build_object('course_id', p_id), v_was = 'published');
  if v_was = 'published' then perform private.mark_dirty(); end if;
end $$;

create or replace function public.register_document(p_slug text, p_type text, p_path text, p_file_name text) returns uuid
language plpgsql security definer set search_path = public as $$
declare p public.profiles := private.me(); v_id uuid;
begin
  if split_part(p_path, '/', 1) <> p.id::text then raise exception 'Invalid upload.'; end if;
  if not exists (select 1 from public.listings where slug = p_slug and owner_id = p.id)
     and not exists (select 1 from public.claims where slug = p_slug and user_id = p.id and status in ('pending','on_hold')) then
    raise exception 'You can only upload documents for a listing you manage or have claimed.'; end if;
  insert into public.documents(user_id, slug, doc_type, path, file_name) values (p.id, p_slug, p_type, p_path, left(p_file_name, 200)) returning id into v_id;
  perform private.log('document_uploaded', p_slug, jsonb_build_object('doc_type', p_type));
  return v_id;
end $$;

create or replace function public.request_verification(p_slug text) returns void
language plpgsql security definer set search_path = public as $$
declare p public.profiles := private.me(); l public.listings; v_req jsonb; v_missing text[];
begin
  select * into l from public.listings where slug = p_slug;
  if l.slug is null or l.owner_id is distinct from p.id then raise exception 'You do not manage this listing.'; end if;
  if exists (select 1 from public.verification_requests where slug = p_slug and status = 'pending') then raise exception 'Verification is already being reviewed.'; end if;
  v_req := private.setting('required_docs') -> l.kind;
  select array_agg(t) into v_missing from jsonb_array_elements_text(v_req) t
   where not exists (select 1 from public.documents d where d.slug = p_slug and d.user_id = p.id and d.doc_type = t and d.status <> 'rejected' and d.purged_at is null);
  if v_missing is not null then raise exception 'Please upload: %', array_to_string(v_missing, ', '); end if;
  insert into public.verification_requests(slug, user_id, level) values (p_slug, p.id, l.kind);
  perform private.log('verification_requested', p_slug, '{}');
end $$;

-- public page-view / click counter (called from the live site, no login)
create or replace function public.track_event(p_slug text, p_kind text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if p_slug !~ '^[a-z0-9-]{2,120}$' then return; end if;
  if not exists (select 1 from public.catalog where slug = p_slug) and not exists (select 1 from public.listings where slug = p_slug) then return; end if;
  insert into public.site_events(slug, day, views, clicks) values (p_slug, current_date, (p_kind = 'view')::int, (p_kind = 'click')::int)
  on conflict (slug, day) do update set views = site_events.views + (p_kind = 'view')::int, clicks = site_events.clicks + (p_kind = 'click')::int;
end $$;

-- everything the site build needs, in one call (published data only)
create or replace function public.site_export() returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'generated_at', now(),
    'listings', coalesce((select jsonb_agg(jsonb_build_object('slug', l.slug, 'is_new', l.is_new, 'status', l.status, 'kind', l.kind,
        'claimed', l.owner_id is not null, 'data', l.data,
        'verified_level', case when private.is_verified(l) then l.verified_level end,
        'verified_until', l.verified_until))
      from public.listings l where l.status in ('published','hidden')), '[]'),
    'courses', coalesce((select jsonb_agg(jsonb_build_object('slug', c.slug, 'title', c.title, 'exam', c.exam, 'mode', c.mode, 'duration', c.duration,
        'fee', c.fee, 'batch_start', c.batch_start, 'schedule', c.schedule, 'description', c.description, 'updated_at', c.updated_at) order by c.created_at)
      from public.courses c join public.listings l on l.slug = c.slug where c.status = 'published' and l.status = 'published'), '[]')
  )
$$;

-- ---------- admin functions ----------
create or replace function private.require_admin() returns public.profiles
language plpgsql stable security definer set search_path = public as $$
declare p public.profiles := private.me();
begin
  if p.role <> 'admin' then raise exception 'Admins only.'; end if;
  return p;
end $$;

create or replace function public.admin_sync_catalog(p_items jsonb) returns int
language plpgsql security definer set search_path = public as $$
declare a public.profiles := private.require_admin(); n int;
begin
  insert into public.catalog(slug, name, type, city, locality, website, synced_at)
  select i->>'slug', i->>'name', i->>'type', i->>'city', i->>'locality', nullif(i->>'website',''), now() from jsonb_array_elements(p_items) i
  where coalesce(i->>'slug','') <> ''
  on conflict (slug) do update set name = excluded.name, type = excluded.type, city = excluded.city, locality = excluded.locality, website = excluded.website, synced_at = now();
  get diagnostics n = row_count;
  return n;
end $$;

create or replace function public.admin_decide_claim(p_id bigint, p_approve boolean, p_reason text) returns void
language plpgsql security definer set search_path = public as $$
declare a public.profiles := private.require_admin(); c public.claims; l public.listings;
begin
  select * into c from public.claims where id = p_id for update;
  if c.id is null or c.status not in ('pending','on_hold') then raise exception 'Claim is not open.'; end if;
  if p_approve then
    select * into l from public.listings where slug = c.slug;
    if l.slug is null then
      insert into public.listings(slug, owner_id, kind, is_new, status) values (c.slug, c.user_id, c.kind, false, 'published');
    else
      update public.listings set owner_id = c.user_id, kind = c.kind, verified_level = null, verified_at = null, verified_until = null, updated_at = now() where slug = c.slug;
    end if;
    update public.claims set status = 'approved', reason = p_reason, decided_at = now() where id = p_id;
    update public.claims set status = 'rejected', reason = 'Another claim for this listing was approved.', decided_at = now()
      where slug = c.slug and id <> p_id and status in ('pending','on_hold');
    perform private.notify(c.user_id, 'claim_approved', c.slug);
  else
    update public.claims set status = 'rejected', reason = p_reason, decided_at = now() where id = p_id;
    perform private.notify(c.user_id, 'claim_rejected', c.slug, p_reason);
  end if;
  perform private.log(case when p_approve then 'claim_approved' else 'claim_rejected' end, c.slug, jsonb_build_object('claim_id', p_id, 'reason', p_reason));
end $$;

create or replace function public.admin_decide_listing(p_slug text, p_approve boolean, p_reason text) returns void
language plpgsql security definer set search_path = public as $$
declare a public.profiles := private.require_admin(); l public.listings;
begin
  select * into l from public.listings where slug = p_slug for update;
  if l.slug is null or not l.is_new or l.status <> 'pending' then raise exception 'Listing is not waiting for review.'; end if;
  if p_approve then
    update public.listings set status = 'published', reject_reason = null, updated_at = now() where slug = p_slug;
    update public.courses set status = 'published' where slug = p_slug and status = 'pending';
    perform private.mark_dirty();
    perform private.notify(l.owner_id, 'listing_approved', p_slug);
  else
    update public.listings set status = 'rejected', reject_reason = p_reason, updated_at = now() where slug = p_slug;
    perform private.notify(l.owner_id, 'listing_rejected', p_slug, p_reason);
  end if;
  perform private.log(case when p_approve then 'listing_approved' else 'listing_rejected' end, p_slug, jsonb_build_object('reason', p_reason));
end $$;

create or replace function public.admin_decide_change(p_id bigint, p_approve boolean, p_reason text, p_patch jsonb default null) returns void
language plpgsql security definer set search_path = public as $$
declare a public.profiles := private.require_admin(); c public.change_requests; v_patch jsonb;
begin
  select * into c from public.change_requests where id = p_id for update;
  if c.id is null or c.status <> 'pending' then raise exception 'Request is not open.'; end if;
  if p_approve then
    v_patch := coalesce(p_patch, c.patch);
    update public.listings set data = data || v_patch, updated_at = now() where slug = c.slug;
    update public.change_requests set status = 'approved', patch = v_patch, reason = p_reason, decided_at = now() where id = p_id;
    perform private.mark_dirty();
    perform private.notify(c.user_id, 'change_approved', c.slug);
  else
    update public.change_requests set status = 'rejected', reason = p_reason, decided_at = now() where id = p_id;
    perform private.notify(c.user_id, 'change_rejected', c.slug, p_reason);
  end if;
  perform private.log(case when p_approve then 'change_approved' else 'change_rejected' end, c.slug, jsonb_build_object('request_id', p_id, 'reason', p_reason));
end $$;

create or replace function public.admin_decide_course(p_id uuid, p_approve boolean, p_reason text) returns void
language plpgsql security definer set search_path = public as $$
declare a public.profiles := private.require_admin(); c public.courses; v_owner uuid;
begin
  select * into c from public.courses where id = p_id for update;
  if c.id is null or c.status <> 'pending' then raise exception 'Course is not waiting for review.'; end if;
  update public.courses set status = case when p_approve then 'published' else 'rejected' end, reason = p_reason, updated_at = now() where id = p_id;
  if p_approve then perform private.mark_dirty();
  else select owner_id into v_owner from public.listings where slug = c.slug; perform private.notify(v_owner, 'course_rejected', c.slug, p_reason); end if;
  perform private.log(case when p_approve then 'course_approved' else 'course_rejected' end, c.slug, jsonb_build_object('course_id', p_id, 'title', c.title, 'reason', p_reason));
end $$;

create or replace function public.admin_set_precheck(p_doc uuid, p_status text, p_note text) returns void
language plpgsql security definer set search_path = public as $$
declare a public.profiles := private.require_admin();
begin
  update public.documents set precheck_status = p_status, precheck_note = left(p_note, 2000) where id = p_doc;
end $$;

create or replace function public.admin_decide_document(p_doc uuid, p_accept boolean, p_reason text) returns void
language plpgsql security definer set search_path = public as $$
declare a public.profiles := private.require_admin(); d public.documents;
begin
  update public.documents set status = case when p_accept then 'accepted' else 'rejected' end, reason = p_reason, reviewed_at = now()
  where id = p_doc returning * into d;
  perform private.log(case when p_accept then 'document_accepted' else 'document_rejected' end, d.slug, jsonb_build_object('doc_type', d.doc_type, 'reason', p_reason));
end $$;

create or replace function public.admin_decide_verification(p_id bigint, p_approve boolean, p_reason text) returns void
language plpgsql security definer set search_path = public as $$
declare a public.profiles := private.require_admin(); r public.verification_requests; v_months int := coalesce((private.setting('badge_validity_months'))::text::int, 12);
begin
  select * into r from public.verification_requests where id = p_id for update;
  if r.id is null or r.status <> 'pending' then raise exception 'Request is not open.'; end if;
  if p_approve then
    update public.listings set verified_level = r.level, verified_at = now(), verified_until = now() + make_interval(months => v_months), updated_at = now() where slug = r.slug;
    update public.documents set status = 'accepted', reviewed_at = coalesce(reviewed_at, now()) where slug = r.slug and user_id = r.user_id and status = 'uploaded';
    update public.verification_requests set status = 'approved', reason = p_reason, decided_at = now() where id = p_id;
    perform private.mark_dirty();
    perform private.notify(r.user_id, 'verified', r.slug);
  else
    update public.verification_requests set status = 'rejected', reason = p_reason, decided_at = now() where id = p_id;
    perform private.notify(r.user_id, 'verification_rejected', r.slug, p_reason);
  end if;
  perform private.log(case when p_approve then 'verification_approved' else 'verification_rejected' end, r.slug, jsonb_build_object('reason', p_reason));
end $$;

create or replace function public.admin_mark_docs_purged(p_ids uuid[]) returns void
language plpgsql security definer set search_path = public as $$
declare a public.profiles := private.require_admin();
begin
  update public.documents set purged_at = now() where id = any(p_ids);
end $$;

create or replace function public.admin_remove_badge(p_slug text, p_reason text) returns void
language plpgsql security definer set search_path = public as $$
declare a public.profiles := private.require_admin(); v_owner uuid;
begin
  update public.listings set verified_level = null, verified_at = null, verified_until = null, updated_at = now() where slug = p_slug returning owner_id into v_owner;
  perform private.mark_dirty();
  perform private.notify(v_owner, 'badge_removed', p_slug, p_reason);
  perform private.log('badge_removed', p_slug, jsonb_build_object('reason', p_reason));
end $$;

-- admin direct edit (applies immediately); creates the listings row for an unclaimed listing if needed
create or replace function public.admin_edit_listing(p_slug text, p_patch jsonb) returns void
language plpgsql security definer set search_path = public as $$
declare a public.profiles := private.require_admin(); v_before jsonb;
begin
  if not exists (select 1 from public.listings where slug = p_slug) then
    if not exists (select 1 from public.catalog where slug = p_slug) then raise exception 'Listing not found.'; end if;
    insert into public.listings(slug, status) values (p_slug, 'published');
  end if;
  select coalesce(jsonb_object_agg(key, l.data -> key), '{}') into v_before from public.listings l, jsonb_object_keys(p_patch) key where l.slug = p_slug;
  update public.listings set data = data || p_patch, updated_at = now() where slug = p_slug;
  perform private.mark_dirty();
  perform private.log('admin_edit', p_slug, jsonb_build_object('after', p_patch, 'before', v_before));
end $$;

create or replace function public.admin_set_status(p_slug text, p_status text) returns void
language plpgsql security definer set search_path = public as $$
declare a public.profiles := private.require_admin();
begin
  if p_status not in ('published','hidden') then raise exception 'Use published or hidden.'; end if;
  if not exists (select 1 from public.listings where slug = p_slug) then
    if not exists (select 1 from public.catalog where slug = p_slug) then raise exception 'Listing not found.'; end if;
    insert into public.listings(slug, status) values (p_slug, p_status);
  else
    update public.listings set status = p_status, updated_at = now() where slug = p_slug;
  end if;
  perform private.mark_dirty();
  perform private.log(case when p_status = 'hidden' then 'listing_hidden' else 'listing_unhidden' end, p_slug, '{}');
end $$;

create or replace function public.admin_transfer(p_slug text, p_email text) returns void
language plpgsql security definer set search_path = public as $$
declare a public.profiles := private.require_admin(); v_user uuid;
begin
  if coalesce(p_email,'') = '' then
    update public.listings set owner_id = null, verified_level = null, verified_at = null, verified_until = null where slug = p_slug;
  else
    select id into v_user from public.profiles where lower(email) = lower(p_email);
    if v_user is null then raise exception 'No account with that email. Ask them to sign up first.'; end if;
    if not exists (select 1 from public.listings where slug = p_slug) then insert into public.listings(slug, status) values (p_slug, 'published'); end if;
    update public.listings set owner_id = v_user, verified_level = null, verified_at = null, verified_until = null, updated_at = now() where slug = p_slug;
  end if;
  perform private.mark_dirty();
  perform private.log('owner_changed', p_slug, jsonb_build_object('new_owner', p_email));
end $$;

create or replace function public.admin_block_user(p_user uuid, p_blocked boolean) returns void
language plpgsql security definer set search_path = public as $$
declare a public.profiles := private.require_admin();
begin
  if p_user = a.id then raise exception 'You cannot block yourself.'; end if;
  update public.profiles set blocked = p_blocked where id = p_user;
  perform private.log(case when p_blocked then 'user_blocked' else 'user_unblocked' end, null, jsonb_build_object('user', p_user));
end $$;

create or replace function public.admin_undo(p_activity bigint) returns void
language plpgsql security definer set search_path = public as $$
declare a public.profiles := private.require_admin(); r public.activity; k text; v jsonb;
begin
  select * into r from public.activity where id = p_activity for update;
  if r.id is null or r.undone then raise exception 'Nothing to undo.'; end if;
  if r.action in ('live_edit','admin_edit') then
    for k, v in select * from jsonb_each(r.details->'before') loop
      if v is null or v = 'null'::jsonb then update public.listings set data = data - k where slug = r.slug;
      else update public.listings set data = jsonb_set(data, array[k], v) where slug = r.slug; end if;
    end loop;
  elsif r.action = 'live_course' then
    update public.courses set status = 'removed' where id = (r.details->>'course_id')::uuid;
  elsif r.action = 'course_removed' then
    update public.courses set status = 'published' where id = (r.details->>'course_id')::uuid;
  else raise exception 'This change cannot be undone automatically.'; end if;
  update public.activity set undone = true where id = p_activity;
  perform private.mark_dirty();
  perform private.log('undo', r.slug, jsonb_build_object('activity', p_activity));
end $$;

create or replace function public.admin_set_setting(p_key text, p_value jsonb) returns void
language plpgsql security definer set search_path = public as $$
declare a public.profiles := private.require_admin();
begin
  if p_key not in ('minor_fields','major_fields','badge_validity_months','delete_docs_after_verification','required_docs','email_from','email_templates') then
    raise exception 'Unknown setting.'; end if;
  insert into public.settings values (p_key, p_value) on conflict (key) do update set value = excluded.value;
  perform private.log('setting_changed', null, jsonb_build_object('key', p_key));
end $$;

create or replace function public.admin_rebuild_now() returns void
language plpgsql security definer set search_path = public as $$
declare a public.profiles := private.require_admin();
begin perform private.mark_dirty(); update private.rebuild_state set requested_at = now() - interval '1 hour', last_triggered_at = null where id = 1; end $$;

create or replace function public.admin_status() returns jsonb
language plpgsql security definer set search_path = public as $$
declare a public.profiles := private.require_admin();
begin
  return jsonb_build_object(
    'email_ready', exists (select 1 from private.secrets where key = 'resend_api_key'),
    'deploy_ready', exists (select 1 from private.secrets where key = 'deploy_hook_url'),
    'rebuild', (select to_jsonb(r) from private.rebuild_state r where id = 1),
    'emails_queued', (select count(*) from public.email_outbox where status = 'queued'),
    'catalog_count', (select count(*) from public.catalog),
    'catalog_synced', (select max(synced_at) from public.catalog));
end $$;

-- ---------- background jobs ----------
create or replace function private.run_jobs() returns void
language plpgsql security definer set search_path = public, private as $$
declare v_key text; v_hook text; v_from text; r record; s private.rebuild_state;
begin
  -- 1) send queued emails through Resend
  select value into v_key from private.secrets where key = 'resend_api_key';
  if v_key is not null then
    v_from := coalesce(private.setting('email_from') #>> '{}', 'OnlineCoaching4U <no-reply@onlinecoaching4u.in>');
    for r in select * from public.email_outbox where status = 'queued' order by id limit 50 loop
      perform net.http_post(url := 'https://api.resend.com/emails',
        headers := jsonb_build_object('Authorization', 'Bearer ' || v_key, 'Content-Type', 'application/json'),
        body := jsonb_build_object('from', v_from, 'to', jsonb_build_array(r.to_email), 'subject', r.subject, 'html', r.html));
      update public.email_outbox set status = 'sent', sent_at = now() where id = r.id;
    end loop;
  end if;
  -- 2) rebuild the site at most every few minutes when something changed
  select * into s from private.rebuild_state where id = 1;
  select value into v_hook from private.secrets where key = 'deploy_hook_url';
  if s.dirty and v_hook is not null and s.requested_at < now() - interval '2 minutes'
     and (s.last_triggered_at is null or s.last_triggered_at < now() - interval '5 minutes') then
    perform net.http_post(url := v_hook, body := '{}'::jsonb);
    update private.rebuild_state set dirty = false, last_triggered_at = now() where id = 1;
  end if;
end $$;

select cron.schedule('oc4u-jobs', '*/3 * * * *', $$select private.run_jobs()$$);

-- ---------- grants ----------
revoke execute on all functions in schema public from public, anon;
grant execute on all functions in schema public to authenticated;
grant execute on function public.track_event(text, text) to anon;
grant execute on function public.site_export() to anon;
revoke all on all functions in schema private from public, anon, authenticated;
alter function private.is_verified(public.listings) set search_path = public;
