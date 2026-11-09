// Daily pre-check helper. Needs a single-use ticket from private.precheck_jobs.
// Returns pending verification documents with 15-minute signed links, and
// deletes documents older than 90 days that aren't part of an open request.
import { createClient } from "jsr:@supabase/supabase-js@2";

Deno.serve(async (req) => {
  const job = new URL(req.url).searchParams.get("job") ?? "";
  if (!/^[0-9a-f-]{36}$/.test(job)) return new Response(JSON.stringify({ error: "missing job" }), { status: 400 });
  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
  const { data: docs, error } = await sb.rpc("precheck_job_docs", { p_job: job });
  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 403 });
  const out = [];
  for (const d of docs ?? []) {
    const { data: s } = await sb.storage.from("documents").createSignedUrl(d.path, 900);
    out.push({ ...d, url: s?.signedUrl ?? null });
  }
  let purged = 0;
  const { data: old } = await sb.rpc("precheck_purge_list");
  if (old && old.length) {
    const { error: rmErr } = await sb.storage.from("documents").remove(old.map((o: { path: string }) => o.path));
    if (!rmErr) { await sb.rpc("precheck_mark_purged", { p_ids: old.map((o: { id: string }) => o.id) }); purged = old.length; }
  }
  return new Response(JSON.stringify({ documents: out, purged_old_documents: purged }), { headers: { "Content-Type": "application/json" } });
});
