// Returns pending verification documents with 15-minute signed links.
// Needs a single-use ticket from private.precheck_jobs (created by the daily pre-check task).
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
  return new Response(JSON.stringify({ documents: out }), { headers: { "Content-Type": "application/json" } });
});
