-- Give Resend 20s and the Vercel deploy hook 30s to answer (5s default was too short).
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
        body := jsonb_build_object('from', v_from, 'to', jsonb_build_array(r.to_email), 'subject', r.subject, 'html', r.html),
        timeout_milliseconds := 20000);
      update public.email_outbox set status = 'sent', sent_at = now() where id = r.id;
    end loop;
  end if;
  -- 2) rebuild the site at most every few minutes when something changed
  select * into s from private.rebuild_state where id = 1;
  select value into v_hook from private.secrets where key = 'deploy_hook_url';
  if s.dirty and v_hook is not null and s.requested_at < now() - interval '2 minutes'
     and (s.last_triggered_at is null or s.last_triggered_at < now() - interval '5 minutes') then
    perform net.http_post(url := v_hook, body := '{}'::jsonb, timeout_milliseconds := 30000);
    update private.rebuild_state set dirty = false, last_triggered_at = now() where id = 1;
  end if;
end $$;

