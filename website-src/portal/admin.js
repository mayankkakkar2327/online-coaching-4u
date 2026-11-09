/* OnlineCoaching4U — admin panel */
(function () {
  const { sb, esc, $, $$, toast, fail, modal, confirmBox, askReason, fmtDate, fmtDateTime, ago, TYPES, DOCS, FIELDS, SOCIALS, showVal, fetchBase, signOut, renderAuth } = window.P;
  const root = $("#app");
  const S = { user: null, profile: null, people: {}, names: {}, counts: {}, settings: {} };
  const REASONS = {
    claim: ["Your email doesn't match the institute and no ownership documents were uploaded.", "The documents don't match this institute's name or address.", "Another person has already been confirmed as the owner of this listing.", "We couldn't reach you on the phone number provided."],
    listing: ["This institute already has a listing on OnlineCoaching4U. Please claim it instead.", "Please add a complete address and a short About section.", "We couldn't confirm this institute exists. Please add a website or upload registration documents.", "The listing contains promotional claims we can't verify."],
    change: ["We couldn't confirm this change. Please upload a document that shows it.", "The new name/contact details don't match your documents.", "Results claims need proof (e.g. a result list or scorecards).", "The text contains promotional or misleading claims."],
    course: ["Please show the full fee (including GST and material).", "Discount or 'limited-time' claims aren't allowed.", "The course details are incomplete."],
    verify: ["A required document is missing or unreadable.", "The documents don't match the listing's name or address.", "The GST/registration appears inactive or expired.", "Please upload a masked Aadhaar or PAN — we can't accept a full Aadhaar number."]
  };
  const ACT = {
    claim_submitted: "New claim", claim_approved: "Claim approved", claim_rejected: "Claim rejected", listing_created: "Listing created", listing_submitted: "Listing submitted",
    listing_approved: "Listing approved", listing_rejected: "Listing rejected", live_edit: "Live profile edit", change_requested: "Change requested", change_approved: "Change approved",
    change_rejected: "Change rejected", live_course: "Live course change", course_saved: "Course saved for review", course_removed: "Course removed", course_approved: "Course approved",
    course_rejected: "Course rejected", document_uploaded: "Document uploaded", document_accepted: "Document accepted", document_rejected: "Document rejected",
    verification_requested: "Verification requested", verification_approved: "Verified", verification_rejected: "Verification rejected", badge_removed: "Badge removed",
    admin_edit: "Admin edit", listing_hidden: "Listing hidden", listing_unhidden: "Listing unhidden", owner_changed: "Owner changed", user_blocked: "Account blocked",
    user_unblocked: "Account unblocked", undo: "Undo", setting_changed: "Setting changed", secret_changed: "Secret changed", admin_course_removed: "Admin removed course", admin_course_published: "Admin published course",
    review_approved: "Review published", review_rejected: "Review rejected", review_reply_submitted: "Institute replied to a review", reply_approved: "Reply approved", reply_rejected: "Reply rejected"
  };

  /* ---------- lookups ---------- */
  async function people(ids) {
    const need = [...new Set(ids.filter((i) => i && !S.people[i]))];
    if (need.length) {
      const { data } = await sb.from("profiles").select("id,email,full_name,phone,blocked,created_at").in("id", need);
      (data || []).forEach((p) => { S.people[p.id] = p; });
    }
  }
  async function names(slugs) {
    const need = [...new Set(slugs.filter((s) => s && !S.names[s]))];
    if (!need.length) return;
    if (need.length > 100) { for (let i = 0; i < need.length; i += 100) await names(need.slice(i, i + 100)); return; }
    const [c, l] = await Promise.all([sb.from("catalog").select("slug,name,city,website,type").in("slug", need), sb.from("listings").select("slug,data").in("slug", need)]);
    (c.data || []).forEach((r) => { S.names[r.slug] = r; });
    (l.data || []).forEach((r) => { if (r.data && r.data.name) S.names[r.slug] = Object.assign({}, S.names[r.slug] || {}, { name: r.data.name, city: r.data.city || (S.names[r.slug] || {}).city }); });
  }
  const nm = (s) => esc((S.names[s] || {}).name || s);
  const who = (id) => { const p = S.people[id]; return p ? `${esc(p.full_name || "")} &lt;${esc(p.email)}&gt;${p.phone ? " · " + esc(p.phone) : ""}` : '<span class="muted">unknown</span>'; };

  async function loadCounts() {
    const c = (q) => q.then((r) => r.count || 0);
    const [nl, cl, ch, co, vr, dq, rv, rp, ld] = await Promise.all([
      c(sb.from("listings").select("slug", { count: "exact", head: true }).eq("is_new", true).eq("status", "pending")),
      c(sb.from("claims").select("id", { count: "exact", head: true }).in("status", ["pending", "on_hold"])),
      c(sb.from("change_requests").select("id", { count: "exact", head: true }).eq("status", "pending")),
      c(sb.from("courses").select("id", { count: "exact", head: true }).eq("status", "pending")),
      c(sb.from("verification_requests").select("id", { count: "exact", head: true }).eq("status", "pending")),
      c(sb.from("documents").select("id", { count: "exact", head: true }).eq("status", "uploaded").is("purged_at", null)),
      c(sb.from("reviews").select("id", { count: "exact", head: true }).eq("status", "pending")),
      c(sb.from("reviews").select("id", { count: "exact", head: true }).eq("reply_status", "pending")),
      c(sb.from("leads").select("id", { count: "exact", head: true }).gte("created_at", new Date(Date.now() - 7 * 864e5).toISOString()))
    ]);
    S.counts = { listings: nl, claims: cl, changes: ch, courses: co, verify: vr, docs: dq, reviews: rv + rp, leads7: ld, total: nl + cl + ch + co + vr + rv + rp };
  }

  /* ---------- shell ---------- */
  function shell(active, inner) {
    const n = (k) => S.counts[k] ? `<span class="count">${S.counts[k]}</span>` : "";
    root.innerHTML = `<div class="layout"><nav class="side" aria-label="Admin">
      <a href="#/" class="${active === "home" ? "on" : ""}">Dashboard ${n("total")}</a>
      <div class="lbl">Review queue</div>
      <a href="#/q/listings" class="${active === "q-listings" ? "on" : ""}">New listings ${n("listings")}</a>
      <a href="#/q/claims" class="${active === "q-claims" ? "on" : ""}">Claims ${n("claims")}</a>
      <a href="#/q/changes" class="${active === "q-changes" ? "on" : ""}">Profile changes ${n("changes")}</a>
      <a href="#/q/courses" class="${active === "q-courses" ? "on" : ""}">Courses ${n("courses")}</a>
      <a href="#/q/verify" class="${active === "q-verify" ? "on" : ""}">Verification ${n("verify")}</a>
      <a href="#/q/reviews" class="${active === "q-reviews" ? "on" : ""}">Reviews ${n("reviews")}</a>
      <div class="lbl">Manage</div>
      <a href="#/leads" class="${active === "leads" ? "on" : ""}">Leads</a>
      <a href="#/listings" class="${active === "listings" ? "on" : ""}">All listings</a>
      <a href="#/accounts" class="${active === "accounts" ? "on" : ""}">Accounts</a>
      <a href="#/live" class="${active === "live" ? "on" : ""}">Recent live changes</a>
      <a href="#/log" class="${active === "log" ? "on" : ""}">Activity log</a>
      <a href="#/emails" class="${active === "emails" ? "on" : ""}">Emails</a>
      <a href="#/settings" class="${active === "settings" ? "on" : ""}">Settings</a>
    </nav><main id="main">${inner}</main></div>`;
    window.scrollTo(0, 0);
  }
  const loading = () => '<div class="loading"><span class="spinner"></span></div>';

  async function viewDoc(path) {
    const { data, error } = await sb.storage.from("documents").createSignedUrl(path, 300);
    if (error) return fail(error);
    window.open(data.signedUrl, "_blank", "noopener");
  }
  function docsHtml(docs) {
    if (!docs.length) return '<p class="muted small">No documents uploaded.</p>';
    return `<div class="tscroll"><table class="t"><tr><th>Document</th><th>Status</th><th>Daily pre-check</th><th></th></tr>${docs.map((d) => `<tr>
      <td><b>${esc((DOCS[d.doc_type] || {}).label || d.doc_type)}</b><div class="muted small">${esc(d.file_name || "")} · ${fmtDate(d.created_at)}</div></td>
      <td>${d.purged_at ? '<span class="pill">Deleted</span>' : d.status === "accepted" ? '<span class="pill green">Accepted</span>' : d.status === "rejected" ? `<span class="pill red">Rejected</span><div class="small">${esc(d.reason || "")}</div>` : '<span class="pill amber">New</span>'}</td>
      <td>${d.precheck_status === "ok" ? '<span class="pill green">Looks fine</span>' : d.precheck_status === "flag" ? '<span class="pill red">Check this</span>' : '<span class="pill">Not checked yet</span>'}${d.precheck_note ? `<div class="small" style="margin-top:4px">${esc(d.precheck_note)}</div>` : ""}</td>
      <td><div class="btns">${d.purged_at ? "" : `<button class="btn sm ghost" data-view="${esc(d.path)}">View</button>${d.status === "uploaded" ? `<button class="btn sm ghost" data-dacc="${d.id}">Accept</button><button class="btn sm ghost" data-drej="${d.id}">Reject</button>` : ""}`}</div></td></tr>`).join("")}</table></div>`;
  }
  function wireDocs(el, refresh) {
    $$("[data-view]", el).forEach((b) => b.addEventListener("click", () => viewDoc(b.dataset.view)));
    $$("[data-dacc]", el).forEach((b) => b.addEventListener("click", async () => {
      const { error } = await sb.rpc("admin_decide_document", { p_doc: b.dataset.dacc, p_accept: true, p_reason: null });
      if (error) return fail(error); toast("Document accepted."); refresh();
    }));
    $$("[data-drej]", el).forEach((b) => b.addEventListener("click", async () => {
      const r = await askReason("Reject document", REASONS.verify); if (!r) return;
      const { error } = await sb.rpc("admin_decide_document", { p_doc: b.dataset.drej, p_accept: false, p_reason: r });
      if (error) return fail(error); toast("Document rejected."); refresh();
    }));
  }

  /* ---------- catalog sync ---------- */
  async function syncCatalog(silent) {
    const r = await fetch("/assets/catalog.json?v=" + Date.now());
    if (!r.ok) throw new Error("Couldn't load the site's listing catalog.");
    const items = await r.json();
    let n = 0;
    for (let i = 0; i < items.length; i += 250) {
      const { data, error } = await sb.rpc("admin_sync_catalog", { p_items: items.slice(i, i + 250) });
      if (error) throw error; n += data;
    }
    if (!silent) toast(`Catalog synced: ${n} listings.`);
    return n;
  }

  /* ---------- dashboard ---------- */
  async function viewHome() {
    shell("home", loading());
    const [{ data: st, error }] = await Promise.all([sb.rpc("admin_status"), loadCounts()]);
    if (error) return fail(error);
    if (!st.catalog_count || !st.catalog_synced || Date.now() - new Date(st.catalog_synced) > 864e5) {
      try { await syncCatalog(true); st.catalog_count = (await sb.rpc("admin_status")).data.catalog_count; st.catalog_synced = new Date().toISOString(); } catch (e) { console.warn(e); }
    }
    const { data: live } = await sb.from("activity").select("*").eq("live", true).eq("undone", false).gte("created_at", new Date(Date.now() - 7 * 864e5).toISOString());
    const card = (k, label, href) => `<a class="stat" href="${href}" style="text-decoration:none"><span class="muted small">${label}</span><b>${S.counts[k] || 0}</b></a>`;
    const rb = st.rebuild || {};
    shell("home", `<div class="head-row"><h1>Dashboard</h1><div class="btns"><button class="btn ghost sm" id="sync">Sync catalog</button><button class="btn sm" id="pub">Publish site now</button></div></div>
      ${!st.email_ready ? '<div class="notice amber"><b>Emails are paused.</b> Add your Resend API key in <a href="#/settings">Settings</a> so institutes get approval emails. They\'re queued until then.</div>' : ""}
      ${!st.deploy_ready ? '<div class="notice amber"><b>Auto-publish is off.</b> Add the Vercel deploy hook in <a href="#/settings">Settings</a> so approved changes reach the site automatically.</div>' : ""}
      <div class="grid3">${card("listings", "New listings to review", "#/q/listings")}${card("claims", "Claims to review", "#/q/claims")}${card("changes", "Profile changes to review", "#/q/changes")}
        ${card("courses", "Courses to review", "#/q/courses")}${card("verify", "Verification requests", "#/q/verify")}${card("reviews", "Reviews & replies to check", "#/q/reviews")}${card("leads7", "Leads (last 7 days)", "#/leads")}<a class="stat" href="#/live" style="text-decoration:none"><span class="muted small">Live changes (last 7 days)</span><b>${(live || []).length}</b></a></div>
      <div class="card" style="margin-top:16px"><h2>System</h2><table class="t">
        <tr><td>Listings in catalog</td><td>${st.catalog_count} · synced ${st.catalog_synced ? ago(st.catalog_synced) : "never"}</td></tr>
        <tr><td>Site publishing</td><td>${st.deploy_ready ? "Automatic" : "Not set up"} · ${rb.dirty ? '<span class="pill amber">Changes waiting to publish</span>' : '<span class="pill green">Up to date</span>'} ${rb.last_triggered_at ? `· last publish ${ago(rb.last_triggered_at)}` : ""}</td></tr>
        <tr><td>Emails</td><td>${st.email_ready ? "Sending through Resend" : "Paused"} · ${st.emails_queued} queued</td></tr></table></div>
      <p class="muted small">Approved changes are published to the site automatically within about 5 minutes.</p>`);
    $("#sync").addEventListener("click", () => syncCatalog().then(viewHome).catch(fail));
    $("#pub").addEventListener("click", async () => {
      const { error } = await sb.rpc("admin_rebuild_now"); if (error) return fail(error);
      toast(st.deploy_ready ? "Publishing — the site updates in 2–5 minutes." : "Add the deploy hook in Settings first."); viewHome();
    });
  }

  /* ---------- queues ---------- */
  async function qListings() {
    shell("q-listings", loading());
    const { data, error } = await sb.from("listings").select("*").eq("is_new", true).eq("status", "pending").order("updated_at");
    if (error) return fail(error);
    await people(data.map((l) => l.owner_id));
    const slugs = data.map((l) => l.slug);
    const [{ data: docs }, { data: courses }] = await Promise.all([
      slugs.length ? sb.from("documents").select("*").in("slug", slugs).is("purged_at", null) : { data: [] },
      slugs.length ? sb.from("courses").select("slug,title,fee").in("slug", slugs).neq("status", "removed") : { data: [] }
    ]);
    const dupes = {};
    await Promise.all(data.map(async (l) => {
      const words = String(l.data.name || "").split(/\s+/).filter((w) => w.length > 3).slice(0, 2).join("%");
      if (!words) return;
      const { data: m } = await sb.from("catalog").select("slug,name,city").ilike("name", `%${words}%`).limit(5);
      dupes[l.slug] = m || [];
    }));
    shell("q-listings", `<div class="head-row"><h1>New listings</h1></div>${data.length ? data.map((l) => `<div class="card" data-slug="${l.slug}">
      <div class="head-row" style="margin-bottom:8px"><h2 style="flex:1">${esc(l.data.name)}</h2><span class="pill">${l.kind === "individual" ? "Individual" : "Institute"}</span></div>
      <p class="small">By ${who(l.owner_id)} · submitted ${ago(l.updated_at)}</p>
      ${dupes[l.slug] && dupes[l.slug].length ? `<div class="notice amber small" style="margin-top:10px"><b>Possible duplicates already on the site:</b> ${dupes[l.slug].map((d) => `<a href="/institute-${d.slug}" target="_blank">${esc(d.name)} (${esc(d.city)})</a>`).join(", ")}</div>` : ""}
      <div class="tscroll" style="margin-top:10px"><table class="t">${Object.keys(FIELDS).filter((k) => l.data[k] !== undefined).map((k) => `<tr><td style="width:170px">${esc(FIELDS[k].label)}</td><td>${showVal(k, l.data[k])}</td></tr>`).join("")}
        <tr><td>Courses</td><td>${(courses || []).filter((c) => c.slug === l.slug).map((c) => esc(c.title + (c.fee ? " — " + c.fee : ""))).join("<br>") || '<span class="muted">none</span>'}</td></tr></table></div>
      <h3 style="margin-top:12px">Documents</h3>${docsHtml((docs || []).filter((d) => d.slug === l.slug))}
      <div class="btns" style="margin-top:14px"><button class="btn green" data-ok>Approve & publish</button><button class="btn red" data-no>Reject</button><a class="btn ghost" href="#/listing/${l.slug}">Edit first</a></div></div>`).join("")
      : '<div class="empty">Nothing to review. 🎉</div>'}`);
    wireDocs(root, qListings);
    $$("[data-slug]").forEach((c) => {
      const slug = c.dataset.slug;
      $("[data-ok]", c).addEventListener("click", async () => {
        if (!(await confirmBox("Publish this listing?", "<p>It will appear on the site within about 5 minutes and the institute gets an email.</p>", "Approve & publish", "green"))) return;
        const { error } = await sb.rpc("admin_decide_listing", { p_slug: slug, p_approve: true, p_reason: null });
        if (error) return fail(error); toast("Approved."); await loadCounts(); qListings();
      });
      $("[data-no]", c).addEventListener("click", async () => {
        const r = await askReason("Reject listing", REASONS.listing); if (!r) return;
        const { error } = await sb.rpc("admin_decide_listing", { p_slug: slug, p_approve: false, p_reason: r });
        if (error) return fail(error); toast("Rejected and emailed."); await loadCounts(); qListings();
      });
    });
  }

  async function qClaims() {
    shell("q-claims", loading());
    const { data, error } = await sb.from("claims").select("*").in("status", ["pending", "on_hold"]).order("created_at");
    if (error) return fail(error);
    const slugs = data.map((c) => c.slug);
    await Promise.all([people(data.map((c) => c.user_id)), names(slugs)]);
    const [{ data: docs }, { data: owned }] = await Promise.all([
      slugs.length ? sb.from("documents").select("*").in("slug", slugs).is("purged_at", null) : { data: [] },
      slugs.length ? sb.from("listings").select("slug,owner_id").in("slug", slugs).not("owner_id", "is", null) : { data: [] }
    ]);
    await people((owned || []).map((o) => o.owner_id));
    shell("q-claims", `<div class="head-row"><h1>Claims</h1></div>${data.length ? data.map((c) => {
      const cat = S.names[c.slug] || {}, own = (owned || []).find((o) => o.slug === c.slug);
      const others = data.filter((x) => x.slug === c.slug && x.id !== c.id);
      return `<div class="card" data-claim="${c.id}"><div class="head-row" style="margin-bottom:8px"><h2 style="flex:1"><a href="/institute-${c.slug}" target="_blank">${nm(c.slug)}</a></h2>
        ${c.status === "on_hold" ? '<span class="pill red">On hold</span>' : ""}<span class="pill">${c.kind === "individual" ? "Individual" : "Institute"}</span></div>
        <table class="t"><tr><td style="width:170px">Claimed by</td><td>${who(c.user_id)}</td></tr>
          <tr><td>Proof</td><td>${c.domain_match ? '<span class="pill green">Email matches website domain</span>' : '<span class="pill amber">No domain match — check documents</span>'} <span class="muted small">Website on listing: ${esc(cat.website || "none")}</span></td></tr>
          ${c.message ? `<tr><td>Their note</td><td>${esc(c.message)}</td></tr>` : ""}
          ${own ? `<tr><td>Current owner</td><td class="small" style="color:var(--red)">${who(own.owner_id)} — approving will transfer the listing</td></tr>` : ""}
          ${others.length ? `<tr><td>Other claims</td><td class="small" style="color:var(--red)">${others.map((o) => who(o.user_id)).join("<br>")}</td></tr>` : ""}
          <tr><td>Sent</td><td>${fmtDateTime(c.created_at)}</td></tr></table>
        <h3 style="margin-top:12px">Documents</h3>${docsHtml((docs || []).filter((d) => d.slug === c.slug && d.user_id === c.user_id))}
        <div class="btns" style="margin-top:14px"><button class="btn green" data-ok>Approve claim</button><button class="btn red" data-no>Reject</button></div></div>`;
    }).join("") : '<div class="empty">No open claims.</div>'}`);
    wireDocs(root, qClaims);
    $$("[data-claim]").forEach((el) => {
      const id = +el.dataset.claim;
      $("[data-ok]", el).addEventListener("click", async () => {
        if (!(await confirmBox("Approve this claim?", "<p>This person will manage the listing. Any other open claims for it will be rejected automatically.</p>", "Approve", "green"))) return;
        const { error } = await sb.rpc("admin_decide_claim", { p_id: id, p_approve: true, p_reason: null });
        if (error) return fail(error); toast("Claim approved."); await loadCounts(); qClaims();
      });
      $("[data-no]", el).addEventListener("click", async () => {
        const r = await askReason("Reject claim", REASONS.claim); if (!r) return;
        const { error } = await sb.rpc("admin_decide_claim", { p_id: id, p_approve: false, p_reason: r });
        if (error) return fail(error); toast("Claim rejected."); await loadCounts(); qClaims();
      });
    });
  }

  async function currentOf(slug) {
    const [base, { data: l }] = await Promise.all([fetchBase(slug), sb.from("listings").select("*").eq("slug", slug).maybeSingle()]);
    return { cur: Object.assign({}, base || {}, (l && l.data) || {}), listing: l };
  }
  async function qChanges() {
    shell("q-changes", loading());
    const { data, error } = await sb.from("change_requests").select("*").eq("status", "pending").order("created_at");
    if (error) return fail(error);
    await Promise.all([people(data.map((c) => c.user_id)), names(data.map((c) => c.slug))]);
    const curs = {};
    await Promise.all([...new Set(data.map((c) => c.slug))].map(async (s) => { curs[s] = await currentOf(s); }));
    shell("q-changes", `<div class="head-row"><h1>Profile changes</h1></div>${data.length ? data.map((c) => {
      const L = curs[c.slug].listing;
      return `<div class="card" data-ch="${c.id}"><div class="head-row" style="margin-bottom:8px"><h2 style="flex:1"><a href="#/listing/${c.slug}">${nm(c.slug)}</a></h2>
        ${L && L.verified_level ? '<span class="pill blue">Verified</span>' : '<span class="pill">Not verified</span>'}</div>
        <p class="small">By ${who(c.user_id)} · ${ago(c.created_at)}</p>
        <div class="tscroll" style="margin-top:10px"><table class="t diff"><tr><th>Field</th><th>Now on site</th><th>Requested</th></tr>
        ${Object.entries(c.patch).map(([k, v]) => `<tr><td>${esc((FIELDS[k] || {}).label || k)}${(FIELDS[k] || {}).private ? ' <span class="fieldtag private">Private</span>' : ""}</td><td class="old">${showVal(k, curs[c.slug].cur[k])}</td><td class="new">${showVal(k, v)}</td></tr>`).join("")}</table></div>
        <div class="btns" style="margin-top:14px"><button class="btn green" data-ok>Approve</button><button class="btn ghost" data-edit>Edit, then approve</button><button class="btn red" data-no>Reject</button></div></div>`;
    }).join("") : '<div class="empty">No profile changes waiting.</div>'}`);
    $$("[data-ch]").forEach((el) => {
      const id = +el.dataset.ch, c = data.find((x) => x.id === id);
      const decide = async (approve, reason, patch) => {
        const { error } = await sb.rpc("admin_decide_change", { p_id: id, p_approve: approve, p_reason: reason, p_patch: patch || null });
        if (error) return fail(error); toast(approve ? "Approved — publishing shortly." : "Rejected and emailed."); await loadCounts(); qChanges();
      };
      $("[data-ok]", el).addEventListener("click", () => decide(true, null));
      $("[data-no]", el).addEventListener("click", async () => { const r = await askReason("Reject change", REASONS.change); if (r) decide(false, r); });
      $("[data-edit]", el).addEventListener("click", async () => {
        const keys = Object.keys(c.patch);
        const patch = await editFieldsModal("Edit before approving", keys, c.patch);
        if (patch) decide(true, null, patch);
      });
    });
  }

  /* generic field editor used for change edits and admin direct edits */
  function fieldInput(k, v) {
    const f = FIELDS[k] || { type: "text" };
    if (f.type === "select") return `<select name="${k}">${Object.entries(f.options).map(([o, t]) => `<option value="${o}" ${v === o ? "selected" : ""}>${esc(t)}</option>`).join("")}</select>`;
    if (f.type === "textarea") return `<textarea name="${k}">${esc(v || "")}</textarea>`;
    if (f.type === "lines") return `<textarea name="${k}">${esc((v || []).join("\n"))}</textarea>`;
    if (f.type === "csv") return `<input type="text" name="${k}" value="${esc((v || []).join(", "))}">`;
    if (f.type === "images") return `<textarea name="${k}" placeholder="One image URL per line">${esc((v || []).join("\n"))}</textarea>`;
    if (f.type === "socials") return `<div class="grid2">${Object.entries(SOCIALS).map(([s, t]) => `<label class="f small">${t}<input type="url" name="social_${s}" value="${esc((v || {})[s] || "")}"></label>`).join("")}</div>`;
    return `<input type="${f.type === "number" ? "number" : "text"}" name="${k}" value="${esc(v == null ? "" : v)}">`;
  }
  function fieldRead(form, k) {
    const f = FIELDS[k] || { type: "text" };
    if (f.type === "socials") { const o = {}; Object.keys(SOCIALS).forEach((s) => { const u = form.querySelector(`[name=social_${s}]`).value.trim(); if (u) o[s] = u; }); return o; }
    const raw = form.querySelector(`[name=${k}]`).value;
    if (f.type === "lines" || f.type === "images") return raw.split("\n").map((s) => s.trim()).filter(Boolean);
    if (f.type === "csv") return raw.split(",").map((s) => s.trim().toLowerCase().replace(/\s+/g, "-")).filter(Boolean);
    if (f.type === "number") return raw ? parseInt(raw, 10) : null;
    return k === "city" ? raw.trim().toLowerCase() : raw.trim();
  }
  function editFieldsModal(title, keys, vals) {
    return modal({
      title, wide: true,
      html: `<form class="stack" id="ef">${keys.map((k) => `<label class="f">${esc((FIELDS[k] || {}).label || k)}${fieldInput(k, vals[k])}</label>`).join("")}</form>`,
      buttons: [{ label: "Cancel", value: null, cls: "ghost" }, { label: "Save", cls: "green", value: (bg) => Object.fromEntries(keys.map((k) => [k, fieldRead($("#ef", bg), k)])) }]
    });
  }

  async function qCourses() {
    shell("q-courses", loading());
    const { data, error } = await sb.from("courses").select("*").eq("status", "pending").order("updated_at");
    if (error) return fail(error);
    await names(data.map((c) => c.slug));
    shell("q-courses", `<div class="head-row"><h1>Courses</h1></div>${data.length ? data.map((c) => `<div class="card" data-co="${c.id}">
      <h2>${esc(c.title)}</h2><p class="small"><a href="#/listing/${c.slug}">${nm(c.slug)}</a> · ${ago(c.updated_at)}</p>
      <table class="t" style="margin-top:8px">${[["Exam", c.exam], ["Mode", c.mode], ["Duration", c.duration], ["Fee", c.fee], ["Next batch", c.batch_start], ["Schedule", c.schedule], ["Description", c.description]].filter(([, v]) => v).map(([k, v]) => `<tr><td style="width:140px">${k}</td><td><pre class="val">${esc(v)}</pre></td></tr>`).join("")}</table>
      <div class="btns" style="margin-top:12px"><button class="btn green" data-ok>Approve</button><button class="btn red" data-no>Reject</button></div></div>`).join("") : '<div class="empty">No courses waiting.</div>'}`);
    $$("[data-co]").forEach((el) => {
      const id = el.dataset.co;
      const go = async (ok, r) => { const { error } = await sb.rpc("admin_decide_course", { p_id: id, p_approve: ok, p_reason: r }); if (error) return fail(error); toast(ok ? "Approved." : "Rejected."); await loadCounts(); qCourses(); };
      $("[data-ok]", el).addEventListener("click", () => go(true, null));
      $("[data-no]", el).addEventListener("click", async () => { const r = await askReason("Reject course", REASONS.course); if (r) go(false, r); });
    });
  }

  async function qVerify() {
    shell("q-verify", loading());
    const { data, error } = await sb.from("verification_requests").select("*").eq("status", "pending").order("created_at");
    if (error) return fail(error);
    await Promise.all([people(data.map((r) => r.user_id)), names(data.map((r) => r.slug))]);
    const slugs = data.map((r) => r.slug);
    const { data: docs } = slugs.length ? await sb.from("documents").select("*").in("slug", slugs).is("purged_at", null).order("created_at", { ascending: false }) : { data: [] };
    const curs = {};
    await Promise.all(slugs.map(async (s) => { curs[s] = (await currentOf(s)).cur; }));
    shell("q-verify", `<div class="head-row"><h1>Verification</h1></div>
      <div class="notice small">Check each document against the listing: same name, same address, GST active (you can check on <a href="https://services.gst.gov.in/services/searchtp" target="_blank" rel="noopener">the GST portal</a>), ID is PAN or masked Aadhaar. Claude's daily pre-check notes appear next to each document.</div>
      ${data.length ? data.map((r) => { const c = curs[r.slug] || {}; return `<div class="card" data-vr="${r.id}">
      <div class="head-row" style="margin-bottom:8px"><h2 style="flex:1"><a href="#/listing/${r.slug}">${nm(r.slug)}</a></h2><span class="pill">${r.level === "individual" ? "Verified Individual" : "OC4U Verified"}</span></div>
      <table class="t"><tr><td style="width:170px">Owner</td><td>${who(r.user_id)}</td></tr><tr><td>Name on listing</td><td>${esc(c.name || "")}</td></tr>
        <tr><td>Address on listing</td><td>${esc(c.address || "")}</td></tr><tr><td>Phone / email (private)</td><td>${esc(c.phone || "—")} · ${esc(c.email || "—")}</td></tr></table>
      <h3 style="margin-top:12px">Documents</h3>${docsHtml((docs || []).filter((d) => d.slug === r.slug && d.user_id === r.user_id))}
      <div class="btns" style="margin-top:14px"><button class="btn green" data-ok>Verify</button><button class="btn red" data-no>Reject</button></div></div>`; }).join("") : '<div class="empty">No verification requests.</div>'}`);
    wireDocs(root, qVerify);
    $$("[data-vr]").forEach((el) => {
      const id = +el.dataset.vr, r = data.find((x) => x.id === id);
      $("[data-ok]", el).addEventListener("click", async () => {
        const del = !!S.settings.delete_docs_after_verification;
        if (!(await confirmBox("Give the Verified badge?", `<p>The badge goes live on the site within about 5 minutes and lasts ${S.settings.badge_validity_months || 12} months.${del ? " The uploaded documents will then be deleted, as set in Settings." : ""}</p>`, "Verify", "green"))) return;
        const { error } = await sb.rpc("admin_decide_verification", { p_id: id, p_approve: true, p_reason: null });
        if (error) return fail(error);
        if (del) {
          const mine = (docs || []).filter((d) => d.slug === r.slug && d.user_id === r.user_id);
          if (mine.length) {
            const rm = await sb.storage.from("documents").remove(mine.map((d) => d.path));
            if (rm.error) toast("Verified, but documents couldn't be deleted: " + rm.error.message, true);
            else await sb.rpc("admin_mark_docs_purged", { p_ids: mine.map((d) => d.id) });
          }
        }
        toast("Verified."); await loadCounts(); qVerify();
      });
      $("[data-no]", el).addEventListener("click", async () => {
        const reason = await askReason("Reject verification", REASONS.verify); if (!reason) return;
        const { error } = await sb.rpc("admin_decide_verification", { p_id: id, p_approve: false, p_reason: reason });
        if (error) return fail(error); toast("Rejected and emailed."); await loadCounts(); qVerify();
      });
    });
  }

  /* ---------- reviews queue ---------- */
  const REV_REASONS = ["This doesn't read like a genuine student experience.", "The review contains abusive language or personal attacks.", "The review includes personal details (phone numbers, names of staff/students).", "This looks like promotion or a duplicate review.", "The review is about a different institute."];
  const REPLY_REASONS = ["The reply shares the student's personal details.", "The reply is abusive or threatening.", "The reply is promotional rather than a response to the review."];
  async function qReviews(tab) {
    tab = tab || "pending";
    shell("q-reviews", loading());
    let q = sb.from("reviews").select("*").order("created_at", { ascending: tab !== "published" }).limit(200);
    if (tab === "pending") q = q.eq("status", "pending");
    if (tab === "replies") q = q.eq("reply_status", "pending");
    if (tab === "published") q = q.eq("status", "approved");
    if (tab === "rejected") q = q.eq("status", "rejected");
    const { data, error } = await q;
    if (error) return fail(error);
    await names(data.map((r) => r.slug));
    const dupMail = {};
    if (tab === "pending" && data.length) {
      const { data: others } = await sb.from("reviews").select("email,slug").in("email", [...new Set(data.map((r) => r.email))]);
      (others || []).forEach((o) => { (dupMail[o.email] = dupMail[o.email] || new Set()).add(o.slug); });
    }
    const stars = (n) => `<span style="color:#E8A400">${"★".repeat(n)}</span><span style="color:#D5D8EC">${"★".repeat(5 - n)}</span>`;
    const tabs = [["pending", `New reviews`], ["replies", `Institute replies`], ["published", "Published"], ["rejected", "Rejected"]];
    shell("q-reviews", `<div class="head-row"><h1>Reviews</h1></div>
      <div class="tabs">${tabs.map(([k, t]) => `<button data-t="${k}" class="${tab === k ? "on" : ""}">${t}</button>`).join("")}</div>
      ${data.length ? data.map((r) => `<div class="card" data-rv="${r.id}">
        <div class="head-row" style="margin-bottom:6px"><h2 style="flex:1"><a href="#/listing/${r.slug}">${nm(r.slug)}</a></h2>${stars(r.rating)}</div>
        <p style="white-space:pre-wrap">${esc(r.body)}</p>
        <p class="small muted" style="margin-top:8px">${esc(r.name)} · ${esc(r.email)} · ${fmtDateTime(r.created_at)}</p>
        ${tab === "pending" && dupMail[r.email] && dupMail[r.email].size > 1 ? `<div class="notice amber small" style="margin-top:8px">This email has also reviewed ${dupMail[r.email].size - 1} other institute(s).</div>` : ""}
        ${r.reply ? `<div class="notice ${r.reply_status === "approved" ? "green" : r.reply_status === "rejected" ? "red" : "amber"} small" style="margin-top:10px"><b>Institute reply (${esc(r.reply_status)}):</b> ${esc(r.reply)}</div>` : ""}
        ${r.status === "rejected" && r.reason ? `<p class="small" style="margin-top:6px">Rejected: ${esc(r.reason)}</p>` : ""}
        <div class="btns" style="margin-top:12px">
          ${tab === "pending" ? '<button class="btn green" data-ok>Approve & publish</button><button class="btn red" data-no>Reject</button>' : ""}
          ${tab === "replies" ? '<button class="btn green" data-rok>Approve reply</button><button class="btn red" data-rno>Reject reply</button>' : ""}
          ${tab === "published" ? '<button class="btn ghost" data-no>Unpublish</button>' : ""}
          ${tab === "rejected" ? '<button class="btn ghost" data-ok>Publish after all</button>' : ""}
        </div></div>`).join("") : `<div class="empty">${tab === "pending" ? "No new reviews to check." : tab === "replies" ? "No institute replies waiting." : "Nothing here yet."}</div>`}`);
    $$(".tabs [data-t]").forEach((b) => b.addEventListener("click", () => qReviews(b.dataset.t)));
    $$("[data-rv]").forEach((el) => {
      const id = +el.dataset.rv;
      const go = async (fn, ok, reason, msg) => { const { error } = await sb.rpc(fn, { p_id: id, p_approve: ok, p_reason: reason }); if (error) return fail(error); toast(msg); await loadCounts(); qReviews(tab); };
      const ok = $("[data-ok]", el); if (ok) ok.addEventListener("click", () => go("admin_decide_review", true, null, "Published — the site updates in a few minutes."));
      const no = $("[data-no]", el); if (no) no.addEventListener("click", async () => { const r = await askReason(tab === "published" ? "Unpublish review" : "Reject review", REV_REASONS); if (r) go("admin_decide_review", false, r, tab === "published" ? "Unpublished." : "Rejected."); });
      const rok = $("[data-rok]", el); if (rok) rok.addEventListener("click", () => go("admin_decide_reply", true, null, "Reply approved."));
      const rno = $("[data-rno]", el); if (rno) rno.addEventListener("click", async () => { const r = await askReason("Reject reply", REPLY_REASONS); if (r) go("admin_decide_reply", false, r, "Reply rejected."); });
    });
  }

  /* ---------- leads (all institutes) ---------- */
  async function viewLeads() {
    shell("leads", loading());
    const [{ data, error }, { data: owned }] = await Promise.all([
      sb.from("leads").select("*").order("created_at", { ascending: false }).limit(5000),
      sb.from("listings").select("slug,owner_id,verified_level,verified_until")
    ]);
    if (error) return fail(error);
    await names(data.map((x) => x.slug));
    const own = Object.fromEntries((owned || []).map((o) => [o.slug, o]));
    const state = (slug) => { const o = own[slug]; if (!o || !o.owner_id) return "unclaimed"; return o.verified_level && (!o.verified_until || new Date(o.verified_until) > new Date()) ? "verified" : "claimed"; };
    const STATE = { unclaimed: '<span class="pill">Not claimed</span>', claimed: '<span class="pill amber">Claimed, not verified</span>', verified: '<span class="pill blue">Verified — sees leads</span>' };
    const ST = { new: "New", contacted: "Contacted", enrolled: "Enrolled", not_interested: "Not interested" };
    let f = { q: "", days: "30", who: "" };
    const rows = () => data.filter((x) => (!f.q || ((S.names[x.slug] || {}).name + " " + x.name + " " + x.phone).toLowerCase().includes(f.q))
      && (f.days === "all" || new Date(x.created_at) > Date.now() - (+f.days) * 864e5) && (!f.who || state(x.slug) === f.who));
    const draw = () => {
      const r = rows();
      $("#lrows").innerHTML = r.length ? r.map((x) => `<tr><td class="small">${fmtDateTime(x.created_at)}</td><td><a href="#/listing/${x.slug}">${nm(x.slug)}</a><div>${STATE[state(x.slug)]}</div></td>
        <td><b>${esc(x.name)}</b><div class="small"><a href="tel:+91${esc(x.phone)}">+91 ${esc(x.phone)}</a></div></td><td class="small">${x.source === "review-page" ? "Review page" : "Profile"}</td>
        <td class="small">${ST[x.status] || x.status}${x.note ? `<div class="muted">${esc(x.note)}</div>` : ""}</td></tr>`).join("") : '<tr><td colspan="5" class="muted">No leads match.</td></tr>';
      $("#lcount").textContent = `${r.length} lead${r.length === 1 ? "" : "s"}`;
    };
    shell("leads", `<div class="head-row"><h1>Leads</h1><button class="btn sm ghost" id="csv">Download CSV</button></div>
      <p class="muted small" style="margin-bottom:12px">Every callback request from every institute page. Verified institutes see their own leads in their panel (status and notes they add show here). Leads for unclaimed or unverified institutes are only visible to you.</p>
      <div class="card tight"><div class="grid3"><label class="f">Search<input type="search" id="lq" placeholder="Institute, name or number"></label>
        <label class="f">Period<select id="ld"><option value="7">Last 7 days</option><option value="30" selected>Last 30 days</option><option value="90">Last 90 days</option><option value="all">All time</option></select></label>
        <label class="f">Institute status<select id="lw"><option value="">All</option><option value="unclaimed">Not claimed</option><option value="claimed">Claimed, not verified</option><option value="verified">Verified</option></select></label></div></div>
      <p class="small muted" id="lcount" style="margin:0 0 8px"></p>
      <div class="card tight tscroll"><table class="t"><thead><tr><th>When</th><th>Institute</th><th>Student</th><th>From</th><th>Institute's status</th></tr></thead><tbody id="lrows"></tbody></table></div>`);
    $("#lq").addEventListener("input", (e) => { f.q = e.target.value.trim().toLowerCase(); draw(); });
    $("#ld").addEventListener("change", (e) => { f.days = e.target.value; draw(); });
    $("#lw").addEventListener("change", (e) => { f.who = e.target.value; draw(); });
    $("#csv").addEventListener("click", () => {
      const q = (v) => `"${String(v == null ? "" : v).replace(/"/g, '""')}"`;
      const lines = [["Date", "Institute", "Institute slug", "Institute status", "Student", "Mobile", "Source", "Status", "Note"].join(",")]
        .concat(rows().map((x) => [new Date(x.created_at).toISOString().slice(0, 16).replace("T", " "), (S.names[x.slug] || {}).name || x.slug, x.slug, state(x.slug), x.name, "+91" + x.phone, x.source, ST[x.status], x.note].map(q).join(",")));
      const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([lines.join("\n")], { type: "text/csv" })); a.download = `oc4u-leads-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
    });
    draw();
  }

  /* ---------- listings ---------- */
  async function viewListings(filter) {
    filter = filter || "managed";
    shell("listings", `<div class="head-row"><h1>All listings</h1></div>
      <div class="card tight"><label class="f">Search by name<input type="search" id="q" placeholder="Type at least 2 letters"></label>
      <div class="btns" style="margin-top:10px">${[["managed", "Managed by institutes"], ["verified", "Verified"], ["new", "Added in portal"], ["hidden", "Hidden"], ["edited", "Edited by admin/institute"]].map(([k, t]) => `<button class="btn sm ${filter === k ? "" : "ghost"}" data-f="${k}">${t}</button>`).join("")}</div></div>
      <div id="res">${loading()}</div>`);
    $$("[data-f]").forEach((b) => b.addEventListener("click", () => viewListings(b.dataset.f)));
    const res = $("#res");
    const show = async (rows) => {
      await names(rows.map((r) => r.slug)); await people(rows.map((r) => r.owner_id));
      res.innerHTML = rows.length ? `<div class="card tight tscroll"><table class="t"><tr><th>Listing</th><th>City</th><th>Owner</th><th>Status</th></tr>${rows.map((r) => `<tr>
        <td><a href="#/listing/${r.slug}"><b>${nm(r.slug)}</b></a></td><td>${esc((S.names[r.slug] || {}).city || (r.data && r.data.city) || "")}</td>
        <td class="small">${r.owner_id ? who(r.owner_id) : '<span class="muted">—</span>'}</td>
        <td>${r.status ? `<span class="pill">${esc(r.status)}</span>` : ""} ${r.verified_level ? '<span class="pill blue">Verified</span>' : ""}</td></tr>`).join("")}</table></div>` : '<div class="empty">No listings.</div>';
    };
    const byFilter = async () => {
      let q = sb.from("listings").select("*").order("updated_at", { ascending: false }).limit(300);
      if (filter === "managed") q = q.not("owner_id", "is", null);
      if (filter === "verified") q = q.not("verified_level", "is", null);
      if (filter === "new") q = q.eq("is_new", true);
      if (filter === "hidden") q = q.eq("status", "hidden");
      const { data, error } = await q; if (error) return fail(error);
      show(data);
    };
    let t;
    $("#q").addEventListener("input", (e) => {
      clearTimeout(t);
      t = setTimeout(async () => {
        const term = e.target.value.trim().replace(/[%_]/g, "");
        if (term.length < 2) return byFilter();
        const [{ data: c }, { data: n }] = await Promise.all([
          sb.from("catalog").select("slug,name,city").ilike("name", `%${term}%`).limit(60),
          sb.from("listings").select("*").eq("is_new", true).ilike("data->>name", `%${term}%`).limit(30)
        ]);
        const slugs = [...new Set([...(c || []).map((x) => x.slug), ...(n || []).map((x) => x.slug)])];
        const { data: ls } = slugs.length ? await sb.from("listings").select("*").in("slug", slugs) : { data: [] };
        (c || []).forEach((x) => { S.names[x.slug] = Object.assign({}, S.names[x.slug] || {}, x); });
        show(slugs.map((s) => (ls || []).find((l) => l.slug === s) || { slug: s }));
      }, 250);
    });
    byFilter();
  }

  async function viewListing(slug) {
    shell("listings", loading());
    await names([slug]);
    const { cur, listing: l } = await currentOf(slug);
    if (l && l.owner_id) await people([l.owner_id]);
    const [{ data: courses }, { data: docs }, { data: acts }] = await Promise.all([
      sb.from("courses").select("*").eq("slug", slug).neq("status", "removed").order("created_at"),
      sb.from("documents").select("*").eq("slug", slug).order("created_at", { ascending: false }),
      sb.from("activity").select("*").eq("slug", slug).order("created_at", { ascending: false }).limit(40)
    ]);
    const hidden = l && l.status === "hidden", isNew = l && l.is_new;
    const verified = l && l.verified_level && (!l.verified_until || new Date(l.verified_until) > new Date());
    shell("listings", `<div class="head-row"><h1>${esc(cur.name || slug)}</h1><div class="btns">
        ${!isNew || l.status === "published" ? `<a class="btn sm ghost" href="/institute-${slug}" target="_blank">View on site ↗</a>` : ""}
        ${(!isNew || l.status === "published") ? `<button class="btn sm ${hidden ? "green" : "red"}" id="hide">${hidden ? "Unhide" : "Hide from site"}</button>` : ""}</div></div>
      <div class="card"><table class="t"><tr><td style="width:170px">Owner</td><td>${l && l.owner_id ? who(l.owner_id) : '<span class="muted">Not claimed</span>'} <button class="btn link sm" id="xfer">Change owner</button></td></tr>
        <tr><td>Status</td><td>${l ? esc(l.status) : "published (from data.json)"} ${isNew ? '<span class="pill">Added in portal</span>' : ""}</td></tr>
        <tr><td>Badge</td><td>${verified ? `<span class="pill blue">${l.verified_level === "individual" ? "Verified Individual" : "OC4U Verified"}</span> until ${fmtDate(l.verified_until)} <button class="btn link sm" id="unbadge">Remove badge</button>` : '<span class="muted">Not verified</span>'}</td></tr>
        <tr><td>Kind</td><td>${l ? (l.kind === "individual" ? "Individual" : "Institute") : "Institute"}</td></tr></table></div>
      <div class="card"><div class="head-row" style="margin-bottom:6px"><h2 style="flex:1">Profile</h2><button class="btn sm" id="edit">Edit fields</button></div>
        <p class="muted small" style="margin-bottom:8px">Your edits go live immediately (no approval step) and are logged.</p>
        <div class="tscroll"><table class="t">${Object.keys(FIELDS).map((k) => `<tr><td style="width:170px">${esc(FIELDS[k].label)}</td><td>${showVal(k, cur[k])}</td></tr>`).join("")}</table></div></div>
      <div class="card"><h2>Courses</h2>${(courses || []).length ? `<table class="t">${courses.map((c) => `<tr><td><b>${esc(c.title)}</b><div class="muted small">${[c.exam, c.duration, c.fee].filter(Boolean).map(esc).join(" · ")}</div></td><td><span class="pill">${esc(c.status)}</span></td>
        <td><div class="btns">${c.status !== "published" ? `<button class="btn sm ghost" data-cpub="${c.id}">Publish</button>` : ""}<button class="btn sm ghost" data-crm="${c.id}">Remove</button></div></td></tr>`).join("")}</table>` : '<p class="muted small">No courses.</p>'}</div>
      <div class="card"><h2>Documents</h2>${docsHtml(docs || [])}</div>
      <div class="card"><h2>History</h2>${(acts || []).length ? `<table class="t">${acts.map((a) => `<tr><td class="small" style="width:130px">${fmtDateTime(a.created_at)}</td><td>${esc(ACT[a.action] || a.action)}${a.live ? ' <span class="pill green">live</span>' : ""}${a.undone ? ' <span class="pill">undone</span>' : ""}<div class="muted small">${esc(a.actor_email || "")}${a.details && a.details.reason ? " · " + esc(a.details.reason) : ""}</div></td></tr>`).join("")}</table>` : '<p class="muted small">No history yet.</p>'}</div>`);
    wireDocs(root, () => viewListing(slug));
    const h = $("#hide");
    if (h) h.addEventListener("click", async () => {
      if (!(await confirmBox(hidden ? "Show this listing again?" : "Hide this listing?", hidden ? "<p>It will be published again.</p>" : "<p>The profile page will be removed from the site at the next publish. The owner keeps their account.</p>", hidden ? "Unhide" : "Hide", hidden ? "green" : "red"))) return;
      const { error } = await sb.rpc("admin_set_status", { p_slug: slug, p_status: hidden ? "published" : "hidden" });
      if (error) return fail(error); toast("Done."); viewListing(slug);
    });
    $("#xfer").addEventListener("click", async () => {
      const email = await modal({ title: "Change owner", html: '<label class="f">Email of the new owner\'s account<input type="email" id="ne"><span class="hint">They must have signed up already. Leave empty to remove the current owner. The badge is reset.</span></label>',
        buttons: [{ label: "Cancel", value: null, cls: "ghost" }, { label: "Change owner", cls: "red", value: (bg) => $("#ne", bg).value.trim() }] });
      if (email === null) return;
      const { error } = await sb.rpc("admin_transfer", { p_slug: slug, p_email: email });
      if (error) return fail(error); toast("Owner updated."); viewListing(slug);
    });
    const ub = $("#unbadge");
    if (ub) ub.addEventListener("click", async () => {
      const r = await askReason("Remove the Verified badge", ["Documents expired or no longer valid.", "Complaints showed the listing details are misleading.", "The institute has closed or changed ownership."]); if (!r) return;
      const { error } = await sb.rpc("admin_remove_badge", { p_slug: slug, p_reason: r });
      if (error) return fail(error); toast("Badge removed."); viewListing(slug);
    });
    $("#edit").addEventListener("click", async () => {
      const keys = Object.keys(FIELDS).filter((k) => !["logo"].includes(k)).concat("logo");
      const vals = await editFieldsModal("Edit listing", keys, cur);
      if (!vals) return;
      const patch = {};
      keys.forEach((k) => { if (JSON.stringify(vals[k] ?? null) !== JSON.stringify(cur[k] ?? null) && !(vals[k] === "" && cur[k] == null) && !(Array.isArray(vals[k]) && !vals[k].length && cur[k] == null)) patch[k] = vals[k]; });
      if (!Object.keys(patch).length) return toast("Nothing changed.");
      const { error } = await sb.rpc("admin_edit_listing", { p_slug: slug, p_patch: patch });
      if (error) return fail(error); toast("Saved — publishing shortly."); viewListing(slug);
    });
    $$("[data-cpub]").forEach((b) => b.addEventListener("click", async () => { const { error } = await sb.rpc("admin_course_status", { p_id: b.dataset.cpub, p_status: "published" }); if (error) return fail(error); viewListing(slug); }));
    $$("[data-crm]").forEach((b) => b.addEventListener("click", async () => {
      if (!(await confirmBox("Remove this course?", "", "Remove", "red"))) return;
      const { error } = await sb.rpc("admin_course_status", { p_id: b.dataset.crm, p_status: "removed" }); if (error) return fail(error); viewListing(slug);
    }));
  }

  /* ---------- accounts ---------- */
  async function viewAccounts() {
    shell("accounts", loading());
    const [{ data: ps, error }, { data: ls }] = await Promise.all([sb.from("profiles").select("*").order("created_at", { ascending: false }).limit(500), sb.from("listings").select("slug,owner_id,data")]);
    if (error) return fail(error);
    const own = {}; (ls || []).forEach((l) => { if (l.owner_id) (own[l.owner_id] = own[l.owner_id] || []).push(l.slug); });
    await names((ls || []).map((l) => l.slug));
    const draw = (term) => {
      const rows = ps.filter((p) => !term || (p.email + " " + (p.full_name || "")).toLowerCase().includes(term));
      $("#rows").innerHTML = rows.map((p) => `<tr><td><b>${esc(p.full_name || "")}</b><div class="small">${esc(p.email)}${p.phone ? " · " + esc(p.phone) : ""}</div></td>
        <td class="small">${(own[p.id] || []).map((s) => `<a href="#/listing/${s}">${nm(s)}</a>`).join("<br>") || '<span class="muted">—</span>'}</td>
        <td class="small">${fmtDate(p.created_at)}</td><td>${p.role === "admin" ? '<span class="pill blue">Admin</span>' : p.blocked ? '<span class="pill red">Blocked</span>' : '<span class="pill green">Active</span>'}</td>
        <td>${p.role === "admin" ? "" : `<button class="btn sm ${p.blocked ? "ghost" : "red"}" data-b="${p.id}" data-v="${p.blocked ? 0 : 1}">${p.blocked ? "Unblock" : "Block"}</button>`}</td></tr>`).join("");
      $$("[data-b]").forEach((b) => b.addEventListener("click", async () => {
        const block = b.dataset.v === "1";
        if (!(await confirmBox(block ? "Block this account?" : "Unblock this account?", block ? "<p>They won't be able to edit any listing. Their published content stays until you change it.</p>" : "", block ? "Block" : "Unblock", block ? "red" : ""))) return;
        const { error } = await sb.rpc("admin_block_user", { p_user: b.dataset.b, p_blocked: block });
        if (error) return fail(error); toast("Done."); viewAccounts();
      }));
    };
    shell("accounts", `<div class="head-row"><h1>Accounts <span class="muted small">(${ps.length})</span></h1></div>
      <div class="card tight"><input type="search" id="q" placeholder="Search name or email"></div>
      <div class="card tight tscroll"><table class="t"><thead><tr><th>Person</th><th>Listings</th><th>Joined</th><th>Status</th><th></th></tr></thead><tbody id="rows"></tbody></table></div>`);
    $("#q").addEventListener("input", (e) => draw(e.target.value.trim().toLowerCase()));
    draw("");
  }

  /* ---------- live changes + log ---------- */
  function actRow(a, withUndo) {
    const d = a.details || {};
    const fields = d.after ? Object.keys(d.after) : [];
    return `<tr><td class="small" style="width:130px">${fmtDateTime(a.created_at)}</td><td>${a.slug ? `<a href="#/listing/${a.slug}">${nm(a.slug)}</a>` : "—"}</td>
      <td>${esc(ACT[a.action] || a.action)}${d.title ? ": " + esc(d.title) : ""}${fields.length ? `<div class="small diff">${fields.map((k) => `<div><b>${esc((FIELDS[k] || {}).label || k)}:</b> <span class="old">${(d.before || {})[k] == null ? '<span class="muted">original listing value</span>' : showVal(k, d.before[k])}</span> → <span class="new">${showVal(k, d.after[k])}</span></div>`).join("")}</div>` : ""}${d.reason ? `<div class="muted small">${esc(d.reason)}</div>` : ""}</td>
      <td class="small">${esc(a.actor_email || "")}</td>
      ${withUndo ? `<td>${a.undone ? '<span class="pill">Undone</span>' : ["live_edit", "admin_edit", "live_course", "course_removed"].includes(a.action) ? `<button class="btn sm ghost" data-undo="${a.id}">Undo</button>` : ""}</td>` : ""}</tr>`;
  }
  async function viewLive() {
    shell("live", loading());
    const { data, error } = await sb.from("activity").select("*").eq("live", true).order("created_at", { ascending: false }).limit(150);
    if (error) return fail(error);
    await names(data.map((a) => a.slug));
    shell("live", `<div class="head-row"><h1>Recent live changes</h1></div>
      <p class="muted small" style="margin-bottom:12px">Changes verified institutes published without approval. If something looks wrong, undo it — the site updates within about 5 minutes.</p>
      ${data.length ? `<div class="card tight tscroll"><table class="t"><tr><th>When</th><th>Listing</th><th>Change</th><th>By</th><th></th></tr>${data.map((a) => actRow(a, true)).join("")}</table></div>` : '<div class="empty">No live changes yet.</div>'}`);
    $$("[data-undo]").forEach((b) => b.addEventListener("click", async () => {
      if (!(await confirmBox("Undo this change?", "<p>The previous value is restored on the site.</p>", "Undo", "red"))) return;
      const { error } = await sb.rpc("admin_undo", { p_activity: +b.dataset.undo });
      if (error) return fail(error); toast("Undone."); viewLive();
    }));
  }
  async function viewLog() {
    shell("log", loading());
    const { data, error } = await sb.from("activity").select("*").order("created_at", { ascending: false }).limit(300);
    if (error) return fail(error);
    await names(data.map((a) => a.slug));
    shell("log", `<div class="head-row"><h1>Activity log</h1></div><div class="card tight"><input type="search" id="q" placeholder="Filter by listing, action or email"></div>
      <div class="card tight tscroll"><table class="t"><thead><tr><th>When</th><th>Listing</th><th>Action</th><th>By</th></tr></thead><tbody id="rows">${data.map((a) => actRow(a, false)).join("")}</tbody></table></div>`);
    $("#q").addEventListener("input", (e) => { const t = e.target.value.toLowerCase(); $$("#rows tr").forEach((r) => { r.hidden = t && !r.textContent.toLowerCase().includes(t); }); });
  }
  async function viewEmails() {
    shell("emails", loading());
    const [{ data, error }, { data: st }] = await Promise.all([sb.from("email_outbox").select("*").order("created_at", { ascending: false }).limit(200), sb.rpc("admin_status")]);
    if (error) return fail(error);
    shell("emails", `<div class="head-row"><h1>Emails</h1>${data.some((e) => e.status === "failed") ? '<button class="btn sm ghost" id="retry">Retry failed</button>' : ""}</div>
      ${!st.email_ready ? '<div class="notice amber">Emails are queued but not sent until you add the Resend API key in Settings.</div>' : ""}
      ${data.length ? `<div class="card tight tscroll"><table class="t"><tr><th>When</th><th>To</th><th>Subject</th><th>Status</th></tr>${data.map((e) => `<tr><td class="small">${fmtDateTime(e.created_at)}</td><td class="small">${esc(e.to_email)}</td><td>${esc(e.subject)}</td><td><span class="pill ${e.status === "sent" ? "green" : e.status === "failed" ? "red" : "amber"}">${e.status}</span></td></tr>`).join("")}</table></div>` : '<div class="empty">No emails yet.</div>'}`);
    const r = $("#retry"); if (r) r.addEventListener("click", async () => { await sb.rpc("admin_retry_emails"); viewEmails(); });
  }

  /* ---------- settings ---------- */
  async function viewSettings() {
    shell("settings", loading());
    const [{ data, error }, { data: st }] = await Promise.all([sb.from("settings").select("*"), sb.rpc("admin_status")]);
    if (error) return fail(error);
    const s = Object.fromEntries(data.map((r) => [r.key, r.value]));
    S.settings = s;
    const editable = Object.keys(FIELDS);
    const tpl = s.email_templates || {};
    shell("settings", `<div class="head-row"><h1>Settings</h1></div>
      <form id="sf">
      <div class="card"><h2>What verified institutes can publish instantly</h2><p class="muted small" style="margin-bottom:10px">Unverified institutes always need your approval. Courses always follow the "instant" rule for verified institutes.</p>
        <div class="tscroll"><table class="t"><tr><th>Field</th><th>Instant (once verified)</th><th>Needs your approval</th></tr>${editable.map((k) => `<tr><td>${esc(FIELDS[k].label)}</td>
          <td><input type="radio" name="fr_${k}" value="minor" ${(s.minor_fields || []).includes(k) ? "checked" : ""} aria-label="${esc(FIELDS[k].label)} instant"></td>
          <td><input type="radio" name="fr_${k}" value="major" ${!(s.minor_fields || []).includes(k) ? "checked" : ""} aria-label="${esc(FIELDS[k].label)} needs approval"></td></tr>`).join("")}</table></div></div>
      <div class="card"><h2>Verification</h2><div class="grid2">
        <label class="f">Badge valid for (months)<input type="number" name="months" min="1" max="36" value="${s.badge_validity_months || 12}"></label>
        <label class="chk" style="margin-top:28px"><input type="checkbox" name="deldocs" ${s.delete_docs_after_verification ? "checked" : ""}> <span>Delete uploaded documents after verifying</span></label></div>
        <h3 style="margin-top:14px">Required documents</h3><div class="grid2">${["institute", "individual"].map((kind) => `<div><b class="small">${kind === "institute" ? "Institutes" : "Individuals"}</b>${["gst", "registration", "address", "owner_id"].map((t) => `<label class="chk"><input type="checkbox" name="rq_${kind}_${t}" ${((s.required_docs || {})[kind] || []).includes(t) ? "checked" : ""}> <span>${esc(DOCS[t].label)}</span></label>`).join("")}</div>`).join("")}</div></div>
      <div class="card"><h2>Emails</h2><label class="f">Send from<input type="text" name="from" value="${esc(s.email_from || "")}"><span class="hint">Must be on the domain verified in Resend, e.g. OnlineCoaching4U &lt;no-reply@onlinecoaching4u.in&gt;</span></label>
        <p class="muted small" style="margin-top:10px">Placeholders: {{name}}, {{listing}}, {{reason}}, {{badge}}, {{link}}</p>
        ${Object.entries(tpl).map(([k, t]) => `<details style="margin-top:10px"><summary><b>${esc(k.replace(/_/g, " "))}</b></summary>
          <label class="f">Subject<input type="text" name="ts_${k}" value="${esc(t.subject)}"></label><label class="f">Body (HTML)<textarea name="tb_${k}">${esc(t.body)}</textarea></label></details>`).join("")}</div>
      <div class="btns" style="margin-bottom:16px"><button class="btn" type="submit">Save settings</button></div></form>
      <form id="sec" class="card stack"><h2>Connections</h2><p class="muted small">These are stored securely and can't be read back. Paste a new value to replace it; leave empty to keep the current one.</p>
        <label class="f">Resend API key ${st.email_ready ? '<span class="pill green">Set</span>' : '<span class="pill amber">Not set</span>'}<input type="password" name="resend" placeholder="re_..." autocomplete="off"></label>
        <label class="f">Vercel deploy hook URL ${st.deploy_ready ? '<span class="pill green">Set</span>' : '<span class="pill amber">Not set</span>'}<input type="password" name="hook" placeholder="https://api.vercel.com/v1/integrations/deploy/..." autocomplete="off"></label>
        <div class="btns"><button class="btn ghost" type="submit">Save connections</button></div></form>`);
    $("#sf").addEventListener("submit", async (e) => {
      e.preventDefault();
      const f = e.target;
      const minorF = editable.filter((k) => f.querySelector(`[name=fr_${k}]:checked`).value === "minor");
      const majorF = editable.filter((k) => !minorF.includes(k));
      const req = {}; ["institute", "individual"].forEach((kind) => { req[kind] = ["gst", "registration", "address", "owner_id"].filter((t) => f[`rq_${kind}_${t}`].checked); });
      const tplNew = {}; Object.keys(tpl).forEach((k) => { tplNew[k] = { subject: f["ts_" + k].value, body: f["tb_" + k].value }; });
      const ups = [["minor_fields", minorF], ["major_fields", majorF], ["badge_validity_months", parseInt(f.months.value, 10) || 12], ["delete_docs_after_verification", f.deldocs.checked], ["required_docs", req], ["email_from", f.from.value.trim()], ["email_templates", tplNew]];
      for (const [k, v] of ups) { const { error } = await sb.rpc("admin_set_setting", { p_key: k, p_value: v }); if (error) return fail(error); }
      toast("Settings saved."); viewSettings();
    });
    $("#sec").addEventListener("submit", async (e) => {
      e.preventDefault();
      const f = e.target;
      for (const [k, v] of [["resend_api_key", f.resend.value.trim()], ["deploy_hook_url", f.hook.value.trim()]]) {
        if (!v) continue;
        const { error } = await sb.rpc("admin_set_secret", { p_key: k, p_value: v }); if (error) return fail(error);
      }
      toast("Saved."); viewSettings();
    });
  }

  /* ---------- router ---------- */
  async function route() {
    const h = location.hash.replace(/^#\/?/, "").split("/");
    try {
      if (h[0] === "q") return ({ listings: qListings, claims: qClaims, changes: qChanges, courses: qCourses, verify: qVerify, reviews: qReviews }[h[1]] || viewHome)();
      if (h[0] === "leads") return viewLeads();
      if (h[0] === "listings") return viewListings();
      if (h[0] === "listing" && h[1]) return viewListing(decodeURIComponent(h[1]));
      if (h[0] === "accounts") return viewAccounts();
      if (h[0] === "live") return viewLive();
      if (h[0] === "log") return viewLog();
      if (h[0] === "emails") return viewEmails();
      if (h[0] === "settings") return viewSettings();
      viewHome();
    } catch (e) { fail(e); }
  }
  async function start() {
    const { data: { session } } = await sb.auth.getSession();
    if (!session) { renderAuth(root, { title: "OC4U admin", subtitle: "Admins only.", allowSignup: false }); return; }
    S.user = session.user;
    $("#who").textContent = S.user.email; $("#out").hidden = false;
    const { data: p } = await sb.from("profiles").select("*").eq("id", S.user.id).single();
    S.profile = p;
    try { if (p && p.role === "admin" && !p.blocked) localStorage.setItem("oc4u_admin", "1"); else localStorage.removeItem("oc4u_admin"); } catch (e) {}
    if (!p || p.role !== "admin" || p.blocked) { root.innerHTML = '<div class="notice red">This account doesn\'t have admin access. <a href="/institute">Go to the institute panel</a>.</div>'; return; }
    const { data: st } = await sb.from("settings").select("*");
    S.settings = Object.fromEntries((st || []).map((r) => [r.key, r.value]));
    await loadCounts().catch(() => {});
    window.addEventListener("hashchange", route);
    route();
  }
  $("#out").addEventListener("click", signOut);
  start();
})();
