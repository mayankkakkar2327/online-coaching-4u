/* Runs before build.js on every deploy. Downloads what institutes have published
   through the portal (profile edits, new listings, courses, Verified badges) and
   saves it to .remote.json, which build.js merges into data.json.

   If Supabase can't be reached the build FAILS on purpose, so Vercel keeps the
   current live site instead of publishing pages without institutes' updates.
   Set OC4U_SKIP_REMOTE=1 to build without portal data (local testing only). */
const fs = require("fs");
const path = require("path");
const { SUPABASE_URL, SUPABASE_KEY } = require("./portal-config.js");
const OUT = path.join(__dirname, ".remote.json");

(async () => {
  if (process.env.OC4U_SKIP_REMOTE === "1") {
    console.log("fetch-remote: skipped (OC4U_SKIP_REMOTE=1)");
    return;
  }
  let lastErr;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/site_export`, {
        method: "POST",
        headers: { apikey: SUPABASE_KEY, "Content-Type": "application/json" },
        body: "{}"
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`);
      const data = await res.json();
      if (!data || !Array.isArray(data.listings)) throw new Error("Unexpected response shape");
      fs.writeFileSync(OUT, JSON.stringify(data));
      console.log(`fetch-remote: ${data.listings.length} portal listings, ${data.courses.length} courses`);
      return;
    } catch (e) {
      lastErr = e;
      console.warn(`fetch-remote: attempt ${attempt} failed: ${e.message}`);
      await new Promise(r => setTimeout(r, 3000 * attempt));
    }
  }
  console.error("fetch-remote: could not load portal data, stopping the build so the live site stays as it is.", lastErr && lastErr.message);
  process.exit(1);
})();
