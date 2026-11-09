/* OnlineCoaching4U — institute panel */
(function () {
  const { sb, esc, $, $$, toast, fail, modal, confirmBox, fmtDate, ago, TYPES, DOCS, FIELDS, SOCIALS, showVal, fetchBase, shrinkImage, signOut, renderAuth } = window.P;
  const root = $("#app");
  const S = { user: null, profile: null, settings: {}, listings: [], claims: [], changes: [], verif: [] };
  const LIVE_EXPLAINED = "Everyday updates (about, highlights, timings, courses, photos…) go live instantly once your listing is Verified. Name, contact details, address, website and results claims are always checked by our team first.";

  const isVerified = (l) => !!(l && l.verified_level && (!l.verified_until || new Date(l.verified_until) > new Date()));
  const notPublicYet = (l) => l.is_new && l.status !== "published";
  const minor = () => S.settings.minor_fields || [];
  const major = () => S.settings.major_fields || [];
  const goesLive = (l, k) => notPublicYet(l) || (isVerified(l) && l.status === "published" && minor().includes(k));
  const listingName = (l) => (l.data && l.data.name) || (l._base && l._base.name) || l.slug;

  function statusPill(l) {
    if (l.status === "hidden") return '<span class="pill red">Hidden by OC4U</span>';
    if (l.is_new && l.status === "draft") return '<span class="pill">Draft — not submitted</span>';
    if (l.is_new && l.status === "pending") return '<span class="pill amber">Waiting for review</span>';
    if (l.is_new && l.status === "rejected") return '<span class="pill red">Needs changes</span>';
    return '<span class="pill green">Live on site</span>';
  }
  function badgePill(l) {
    if (isVerified(l)) return `<span class="pill blue">✓ ${l.verified_level === "individual" ? "Verified Individual" : "OC4U Verified"}</span>`;
    const v = S.verif.find((r) => r.slug === l.slug && r.status === "pending");
    return v ? '<span class="pill amber">Verification in review</span>' : '<span class="pill">Not verified</span>';
  }

  /* ---------- data ---------- */
  async function loadAll() {
    const uid = S.user.id;
    const [p, st, ls, cl, ch, vr] = await Promise.all([
      sb.from("profiles").select("*").eq("id", uid).single(),
      sb.from("settings").select("*"),
      sb.from("listings").select("*").eq("owner_id", uid).order("updated_at", { ascending: false }),
      sb.from("claims").select("*").eq("user_id", uid).order("created_at", { ascending: false }),
      sb.from("change_requests").select("*").eq("user_id", uid).order("created_at", { ascending: false }).limit(200),
      sb.from("verification_requests").select("*").eq("user_id", uid).order("created_at", { ascending: false })
    ]);
    for (const r of [p, st, ls, cl, ch, vr]) if (r.error) throw r.error;
    S.profile = p.data;
    S.settings = Object.fromEntries(st.data.map((r) => [r.key, r.value]));
    S.listings = ls.data; S.claims = cl.data; S.changes = ch.data; S.verif = vr.data;
    await Promise.all(S.listings.map(async (l) => { l._base = l.is_new ? null : await fetchBase(l.slug); }));
    const slugs = [...new Set(S.claims.map((c) => c.slug))];
    if (slugs.length) {
      const { data } = await sb.from("catalog").select("slug,name,city,locality").in("slug", slugs);
      S.claimNames = Object.fromEntries((data || []).map((c) => [c.slug, c]));
    } else S.claimNames = {};
  }
  const effective = (l) => Object.assign({}, l._base || {}, l.data || {});

  /* ---------- shell ---------- */
  function shell(active, inner) {
    const nav = [["#/", "My listings", "home"], ["#/claim", "Claim a listing", "claim"], ["#/new", "Add new listing", "new"], ["#/account", "My account", "account"]];
    root.innerHTML = `<div class="layout"><nav class="side" aria-label="Panel">
      ${nav.map(([h, t, k]) => `<a href="${h}" class="${active === k ? "on" : ""}">${t}</a>`).join("")}
      ${S.listings.length ? `<div class="lbl">Your listings</div>${S.listings.map((l) => `<a href="#/l/${l.slug}" class="${active === l.slug ? "on" : ""}">${esc(listingName(l))}</a>`).join("")}` : ""}
      <div class="lbl">Help</div><a href="mailto:onlinecoaching4u.official@gmail.com">Contact OC4U</a>
    </nav><main id="main">${inner}</main></div>`;
    window.scrollTo(0, 0);
  }

  /* ---------- home ---------- */
  function viewHome() {
    const openClaims = S.claims.filter((c) => ["pending", "on_hold"].includes(c.status));
    const closedClaims = S.claims.filter((c) => c.status === "rejected").slice(0, 5);
    shell("home", `
      <div class="head-row"><h1>Welcome${S.profile.full_name ? ", " + esc(S.profile.full_name.split(" ")[0]) : ""}</h1>
        <div class="btns"><a class="btn" href="#/claim">Claim my listing</a><a class="btn ghost" href="#/new">Add a new listing</a></div></div>
      ${!S.listings.length && !openClaims.length ? `<div class="card"><h2>Get started in two steps</h2>
        <p><b>1.</b> If your institute is already on OnlineCoaching4U, <a href="#/claim">claim it</a>. If not, <a href="#/new">add it</a>.</p>
        <p style="margin-top:6px"><b>2.</b> Upload your documents to get the <b>OC4U Verified</b> badge. Verified institutes can update everyday details instantly.</p></div>` : ""}
      ${S.listings.length ? `<h2 style="margin:8px 0 10px">Your listings</h2><div class="list">${S.listings.map((l) => {
        const pend = S.changes.filter((c) => c.slug === l.slug && c.status === "pending").length;
        return `<div class="item"><div class="main"><h3>${esc(listingName(l))}</h3>
          <div class="btns" style="margin:6px 0">${statusPill(l)} ${badgePill(l)} ${pend ? `<span class="pill amber">${pend} change${pend > 1 ? "s" : ""} in review</span>` : ""}</div>
          ${l.status === "rejected" && l.reject_reason ? `<div class="notice red small">Reason: ${esc(l.reject_reason)}</div>` : ""}
          <div class="meta">${l.status === "published" ? `<a href="/institute-${l.slug}" target="_blank" rel="noopener">View on site ↗</a> · ` : ""}Updated ${ago(l.updated_at)}</div></div>
          <a class="btn sm" href="#/l/${l.slug}">Manage</a></div>`;
      }).join("")}</div>` : ""}
      ${openClaims.length ? `<h2 style="margin:22px 0 10px">Claims in review</h2><div class="list">${openClaims.map((c) => {
        const n = S.claimNames[c.slug];
        return `<div class="item"><div class="main"><h3>${esc(n ? n.name : c.slug)}</h3>
          <div class="meta">Sent ${ago(c.created_at)} · ${c.domain_match ? "Your email matches the institute's website ✓" : "Ownership proved with documents"}</div>
          ${c.status === "on_hold" ? `<div class="notice amber small" style="margin-top:8px">Someone else has also claimed this listing, so our team will check both claims carefully. Uploading your documents helps.</div>` : ""}</div>
          <a class="btn sm ghost" href="#/claimdocs/${c.slug}">Documents</a></div>`;
      }).join("")}</div>` : ""}
      ${closedClaims.length ? `<h2 style="margin:22px 0 10px">Recent claim decisions</h2><div class="list">${closedClaims.map((c) => `<div class="item"><div class="main"><h3>${esc((S.claimNames[c.slug] || {}).name || c.slug)}</h3><div class="meta">Not approved: ${esc(c.reason || "")}</div></div></div>`).join("")}</div>` : ""}
    `);
  }

  /* ---------- claim ---------- */
  async function viewClaim(preSlug) {
    shell("claim", `<div class="head-row"><h1>Claim your listing</h1></div>
      <div class="card"><p>Search for your institute. When you claim it, we check you really run it:</p>
        <ul style="margin:8px 0 0 18px"><li><b>Fastest:</b> your login email is on your institute's website domain (e.g. info@yourinstitute.com).</li>
        <li><b>Or:</b> upload your registration documents after claiming.</li></ul>
        <label class="f" style="margin-top:14px">Institute name<input type="search" id="q" placeholder="Start typing…" autocomplete="off"></label>
        <div id="res" class="list" style="margin-top:12px"></div></div>
      <p class="muted small">Can't find it? <a href="#/new">Add a new listing</a> instead.</p>`);
    const q = $("#q"), res = $("#res");
    let timer;
    const search = async () => {
      const term = q.value.trim();
      if (term.length < 2) { res.innerHTML = ""; return; }
      res.innerHTML = '<div class="loading"><span class="spinner"></span></div>';
      const { data, error } = await sb.from("catalog").select("slug,name,city,locality,type,website").ilike("name", `%${term.replace(/[%_]/g, "")}%`).order("name").limit(25);
      if (error) return fail(error);
      res.innerHTML = data.length ? data.map((c) => `<div class="item"><div class="main"><h3>${esc(c.name)}</h3><div class="meta">${esc(c.locality || "")}${c.city !== "online" ? ", " + esc(c.city) : " · Online"} · ${esc(TYPES[c.type] || c.type)}</div></div><button class="btn sm" data-s="${esc(c.slug)}">This is mine</button></div>`).join("")
        : '<div class="empty">No match. Try a shorter name, or <a href="#/new">add a new listing</a>.</div>';
      $$("[data-s]", res).forEach((b) => b.addEventListener("click", () => claimDialog(data.find((c) => c.slug === b.dataset.s))));
    };
    q.addEventListener("input", () => { clearTimeout(timer); timer = setTimeout(search, 250); });
    if (preSlug) {
      const { data } = await sb.from("catalog").select("slug,name,city,locality,type,website").eq("slug", preSlug).maybeSingle();
      if (data) { q.value = data.name; search(); claimDialog(data); }
    }
  }
  async function claimDialog(c) {
    if (S.listings.some((l) => l.slug === c.slug)) { location.hash = "#/l/" + c.slug; return; }
    const domain = S.user.email.split("@")[1].toLowerCase();
    const host = (c.website || "").replace(/^https?:\/\/(www\.)?/i, "").split(/[/:?#]/)[0].toLowerCase();
    const match = host && (host === domain || host.endsWith("." + domain) || domain.endsWith("." + host));
    const ok = await modal({
      title: `Claim ${c.name}`,
      html: `${match ? `<div class="notice green">Your email (${esc(S.user.email)}) matches this institute's website, so our team can approve your claim quickly.</div>`
        : `<div class="notice amber">Your email doesn't match this institute's website${host ? ` (${esc(host)})` : ""}. After claiming, please upload your documents so we can confirm you run it.</div>`}
        <label class="f">Who runs this listing?<select id="ck"><option value="institute">An institute or company</option><option value="individual">Me, as an individual tutor or coach</option></select>
          <span class="hint">Individuals don't need GST or business registration for verification.</span></label>
        <label class="f" style="margin-top:10px">Your role and a note for our team (optional)<textarea id="cm" placeholder="e.g. I'm the founder. You can call me on 98xxxxxx."></textarea></label>
        <label class="chk"><input type="checkbox" id="cc"> <span>I confirm I own or manage ${esc(c.name)} and am allowed to manage its listing.</span></label>`,
      onOpen: (bg) => { if (c.type === "coach") $("#ck", bg).value = "individual"; },
      buttons: [{ label: "Cancel", value: null, cls: "ghost" }, {
        label: "Send claim", validate: (bg) => { if (!$("#cc", bg).checked) { toast("Please tick the confirmation box.", true); return false; } return true; },
        value: (bg) => ({ kind: $("#ck", bg).value, msg: $("#cm", bg).value })
      }]
    });
    if (!ok) return;
    const { data, error } = await sb.rpc("submit_claim", { p_slug: c.slug, p_kind: ok.kind, p_message: ok.msg });
    if (error) return fail(error);
    toast("Claim sent. We'll email you when it's reviewed.");
    await loadAll();
    location.hash = data.domain_match ? "#/" : "#/claimdocs/" + c.slug;
  }

  /* ---------- new listing ---------- */
  function viewNew() {
    const typeOpts = Object.entries(TYPES).map(([k, v]) => `<option value="${k}">${esc(v)}</option>`).join("");
    shell("new", `<div class="head-row"><h1>Add a new listing</h1></div>
      <div class="notice">Already on OnlineCoaching4U? Please <a href="#/claim">claim your listing</a> instead of adding it again.</div>
      <form id="nf" class="card stack">
        <label class="f">Who is this listing for?<select name="kind"><option value="institute">An institute or company</option><option value="individual">Me, as an individual tutor or coach</option></select></label>
        <div class="grid2"><label class="f">Category<select name="type">${typeOpts}</select></label>
          <label class="f">Teaching mode<select name="mode"><option value="offline">Classroom</option><option value="hybrid">Classroom + online</option><option value="online">Online only</option></select></label></div>
        <label class="f">Institute / your name<input type="text" name="name" required maxlength="150"></label>
        <div class="grid2"><label class="f">City<input type="text" name="city" required maxlength="60" list="cities" placeholder="e.g. Jaipur, or online"></label>
          <label class="f">Area / locality<input type="text" name="locality" maxlength="120"></label></div>
        <datalist id="cities"></datalist>
        <label class="f">Full address<textarea name="address" maxlength="400" style="min-height:70px"></textarea></label>
        <label class="f">Exams / subjects<input type="text" name="exams" placeholder="JEE, NEET, Foundation"><span class="hint">Separate with commas.</span></label>
        <div class="grid2"><label class="f">Website<input type="url" name="website" placeholder="https://"></label><label class="f">Year founded<input type="number" name="estd" min="1900" max="2100"></label></div>
        <div class="grid2"><label class="f">Contact phone<input type="tel" name="phone" maxlength="20"><span class="hint">For our team only. Not shown on the site.</span></label>
          <label class="f">Contact email<input type="email" name="email" maxlength="150"><span class="hint">For our team only.</span></label></div>
        <label class="f">About<textarea name="about" maxlength="2500" placeholder="What you teach, since when, batch sizes, anything a student should know."></textarea></label>
        <div class="btns"><button class="btn" type="submit">Create draft</button><span class="muted small">You can add courses, photos and documents next, then submit it for review.</span></div>
      </form>`);
    fetch("/assets/catalog.json").then((r) => r.json()).then((cat) => {
      $("#cities").innerHTML = [...new Set(cat.map((c) => c.city))].sort().map((c) => `<option value="${esc(c)}">`).join("");
    }).catch(() => {});
    $("#nf").addEventListener("submit", async (e) => {
      e.preventDefault();
      const f = e.target, d = {};
      ["type", "mode", "name", "city", "locality", "address", "website", "phone", "email", "about"].forEach((k) => { const v = f[k].value.trim(); if (v) d[k] = v; });
      if (!d.name || !d.city) return toast("Name and city are required.", true);
      if (d.website && !/^https?:\/\//i.test(d.website)) d.website = "https://" + d.website;
      d.city = d.city.toLowerCase();
      if (f.estd.value) d.estd = parseInt(f.estd.value, 10);
      d.exams = f.exams.value.split(",").map((s) => s.trim()).filter(Boolean);
      if (f.kind.value === "individual" && d.type === "coaching") d.type = "coach";
      const { data, error } = await sb.rpc("create_listing", { p_kind: f.kind.value, p_data: d });
      if (error) return fail(error);
      toast("Draft created.");
      await loadAll();
      location.hash = "#/l/" + data;
    });
  }

  /* ---------- listing editor ---------- */
  async function viewListing(slug, tab) {
    const l = S.listings.find((x) => x.slug === slug);
    if (!l) { location.hash = "#/"; return; }
    tab = tab || "profile";
    const tabs = [["profile", "Profile"], ["courses", "Courses"], ["media", "Logo & photos"], ["verify", "Documents & badge"], ["stats", "Stats"]];
    shell(slug, `<div class="head-row"><h1>${esc(listingName(l))}</h1><div class="btns">${statusPill(l)} ${badgePill(l)}
      ${l.status === "published" ? `<a class="btn sm ghost" href="/institute-${l.slug}" target="_blank" rel="noopener">View on site ↗</a>` : ""}</div></div>
      ${l.is_new && ["draft", "rejected"].includes(l.status) ? `<div class="notice ${l.status === "rejected" ? "red" : "amber"}">${l.status === "rejected" ? `<b>Needs changes:</b> ${esc(l.reject_reason || "")}<br>` : ""}This listing isn't on the site yet. Fill in your details, then <button class="btn sm" id="submitL">Submit for review</button></div>` : ""}
      ${l.is_new && l.status === "pending" ? `<div class="notice amber">Our team is reviewing this listing. You can keep editing it meanwhile.</div>` : ""}
      ${!l.is_new && !isVerified(l) && l.status === "published" ? `<div class="notice">${LIVE_EXPLAINED} Until you're verified, every change is reviewed by our team (usually within 1–2 working days).</div>` : ""}
      <div class="tabs">${tabs.map(([k, t]) => `<button data-t="${k}" class="${tab === k ? "on" : ""}">${t}</button>`).join("")}</div><div id="tab"></div>`);
    $$(".tabs button").forEach((b) => b.addEventListener("click", () => { location.hash = `#/l/${slug}/${b.dataset.t}`; }));
    const sbtn = $("#submitL");
    if (sbtn) sbtn.addEventListener("click", async () => {
      const e = effective(l);
      if (!e.about || !e.address && e.city !== "online") return toast("Please add an About section and address before submitting.", true);
      if (!(await confirmBox("Submit for review?", "<p>Our team will check your listing and email you when it's live. You can still edit it while it's in review.</p>", "Submit"))) return;
      const { error } = await sb.rpc("submit_listing", { p_slug: slug });
      if (error) return fail(error);
      toast("Submitted for review."); await loadAll(); viewListing(slug, tab);
    });
    const el = $("#tab");
    if (tab === "profile") return tabProfile(l, el);
    if (tab === "courses") return tabCourses(l, el);
    if (tab === "media") return tabMedia(l, el);
    if (tab === "verify") return tabVerify(l, el, l.slug, l.kind, true);
    if (tab === "stats") return tabStats(l, el);
  }

  function fieldTag(l, k) {
    const f = FIELDS[k];
    let t = "";
    if (notPublicYet(l)) t = "";
    else if (goesLive(l, k)) t = '<span class="fieldtag live">Goes live instantly</span>';
    else t = '<span class="fieldtag review">Reviewed by our team</span>';
    return t + (f.private ? '<span class="fieldtag private">Private</span>' : "");
  }
  function inputFor(k, v) {
    const f = FIELDS[k];
    const ml = f.max ? ` maxlength="${f.max}"` : "";
    if (f.type === "select") return `<select name="${k}">${Object.entries(f.options).map(([o, t]) => `<option value="${o}" ${v === o ? "selected" : ""}>${esc(t)}</option>`).join("")}</select>`;
    if (f.type === "textarea") return `<textarea name="${k}"${ml}>${esc(v || "")}</textarea>`;
    if (f.type === "lines") return `<textarea name="${k}">${esc((v || []).join("\n"))}</textarea>`;
    if (f.type === "csv") return `<input type="text" name="${k}" value="${esc((v || []).join(", "))}">`;
    if (f.type === "socials") return `<div class="grid2">${Object.entries(SOCIALS).map(([s, t]) => `<label class="f small">${t}<input type="url" name="social_${s}" value="${esc((v || {})[s] || "")}" placeholder="https://"></label>`).join("")}</div>`;
    const t = { number: "number", url: "url", tel: "tel", email: "email" }[f.type] || "text";
    return `<input type="${t}" name="${k}" value="${esc(v == null ? "" : v)}"${ml}>`;
  }
  function readField(form, k) {
    const f = FIELDS[k];
    if (f.type === "socials") {
      const o = {}; Object.keys(SOCIALS).forEach((s) => { const u = form["social_" + s].value.trim(); if (u) o[s] = /^https?:\/\//i.test(u) ? u.replace(/^http:/i, "https:") : "https://" + u; });
      return o;
    }
    const raw = form[k].value;
    if (f.type === "lines") return raw.split("\n").map((s) => s.trim().slice(0, f.max || 300)).filter(Boolean).slice(0, f.maxItems || 20);
    if (f.type === "csv") return raw.split(",").map((s) => s.trim().toLowerCase().replace(/\s+/g, "-")).filter(Boolean).slice(0, 30);
    if (f.type === "number") return raw ? parseInt(raw, 10) : null;
    const v = raw.trim();
    if (k === "website" && v && !/^https?:\/\//i.test(v)) return "https://" + v;
    if (k === "city") return v.toLowerCase();
    return v;
  }
  const norm = (v) => JSON.stringify(v == null || v === "" || (Array.isArray(v) && !v.length) || (typeof v === "object" && !Array.isArray(v) && !Object.keys(v).length) ? null : v);

  async function saveWithConfirm(l, patch) {
    const keys = Object.keys(patch);
    if (!keys.length) { toast("Nothing changed."); return false; }
    const live = keys.filter((k) => goesLive(l, k)), review = keys.filter((k) => !goesLive(l, k));
    const lab = (k) => esc(FIELDS[k] ? FIELDS[k].label : k);
    const ok = await confirmBox(notPublicYet(l) ? "Save changes?" : live.length ? "Confirm & publish" : "Send for approval?",
      notPublicYet(l) ? `<p>Your draft will be updated. Nothing is public until our team approves the listing.</p>`
        : `${live.length ? `<p><b>These go live on the site within a few minutes:</b></p><ul style="margin:6px 0 12px 18px">${live.map((k) => `<li>${lab(k)}</li>`).join("")}</ul>` : ""}
           ${review.length ? `<p><b>These will be sent to our team for approval:</b></p><ul style="margin:6px 0 12px 18px">${review.map((k) => `<li>${lab(k)}</li>`).join("")}</ul><p class="muted small">We'll email you once they're reviewed.</p>` : ""}
           <p class="muted small">Please make sure everything is accurate. Misleading claims can lead to the listing being hidden.</p>`,
      notPublicYet(l) ? "Save" : live.length ? "Confirm & publish" : "Send for approval");
    if (!ok) return false;
    const { data, error } = await sb.rpc("save_listing", { p_slug: l.slug, p_patch: patch });
    if (error) { fail(error); return false; }
    toast(data.not_public_yet ? "Draft saved." : data.live.length && data.pending.length ? "Saved. Some changes are live, the rest are in review." : data.live.length ? "Published! The site updates within a few minutes." : "Sent for approval.");
    await loadAll();
    return true;
  }

  function tabProfile(l, el) {
    const cur = effective(l);
    const pending = S.changes.filter((c) => c.slug === l.slug && c.status === "pending");
    const recent = S.changes.filter((c) => c.slug === l.slug && ["approved", "rejected"].includes(c.status)).slice(0, 5);
    const pendKeys = new Set(pending.flatMap((c) => Object.keys(c.patch)));
    const group = (title, keys, note) => `<div class="card"><h2>${title}</h2>${note ? `<p class="muted small" style="margin-bottom:12px">${note}</p>` : ""}<div class="stack">
      ${keys.map((k) => `<label class="f">${esc(FIELDS[k].label)} ${fieldTag(l, k)}${pendKeys.has(k) ? '<span class="fieldtag review">Change waiting</span>' : ""}${FIELDS[k].hint ? `<span class="hint">${esc(FIELDS[k].hint)}</span>` : ""}${inputFor(k, cur[k])}</label>`).join("")}</div></div>`;
    const basics = ["about", "highlights", "exams", "mode", "timings", "batches", "socials"];
    const core = ["name", "type", "city", "locality", "address", "estd", "website", "branches", "results", "phone", "email"];
    el.innerHTML = `${pending.length ? `<div class="card"><h2>Waiting for approval</h2><div class="list">${pending.map((c) => `<div class="item"><div class="main"><div class="meta">Sent ${ago(c.created_at)}</div>
        <div class="tscroll"><table class="t diff"><tr><th>Field</th><th>New value</th></tr>${Object.entries(c.patch).map(([k, v]) => `<tr><td>${esc((FIELDS[k] || {}).label || k)}</td><td class="new">${showVal(k, v)}</td></tr>`).join("")}</table></div></div>
        <button class="btn sm ghost" data-cancel="${c.id}">Withdraw</button></div>`).join("")}</div></div>` : ""}
      ${recent.length ? `<div class="card tight"><h3>Recent decisions</h3>${recent.map((c) => `<p class="small" style="margin-top:6px">${c.status === "approved" ? '<span class="pill green">Approved</span>' : '<span class="pill red">Not approved</span>'} ${Object.keys(c.patch).map((k) => esc((FIELDS[k] || {}).label || k)).join(", ")} · ${fmtDate(c.decided_at)}${c.reason && c.status === "rejected" ? ` — ${esc(c.reason)}` : ""}</p>`).join("")}</div>` : ""}
      <form id="pf">${group("Everyday details", basics, isVerified(l) ? "These go live as soon as you confirm." : notPublicYet(l) ? "" : "These will go live instantly once your listing is Verified. For now, our team reviews them.")}
        ${group("Core details", core, notPublicYet(l) ? "" : "Changes here are always checked by our team before they go live, to protect students from misleading information.")}
        <div class="btns" style="position:sticky;bottom:0;background:var(--paper);padding:12px 0"><button class="btn" type="submit">${notPublicYet(l) ? "Save draft" : "Save changes"}</button><span class="muted small">You'll see exactly what goes live before anything is published.</span></div></form>`;
    $$("[data-cancel]", el).forEach((b) => b.addEventListener("click", async () => {
      if (!(await confirmBox("Withdraw this change?", "<p>The change will not be applied.</p>", "Withdraw", "red"))) return;
      const { error } = await sb.rpc("cancel_change", { p_id: +b.dataset.cancel });
      if (error) return fail(error);
      await loadAll(); tabProfile(S.listings.find((x) => x.slug === l.slug), el);
    }));
    $("#pf", el).addEventListener("submit", async (e) => {
      e.preventDefault();
      const f = e.target, patch = {};
      for (const k of [...basics, ...core]) {
        const v = readField(f, k);
        if (k === "website" && v && !/^https:\/\/[^\s.]+\.[^\s]+$/i.test(v)) return toast("Please enter a valid website, starting with https://", true);
        if (k === "estd" && v && (v < 1900 || v > new Date().getFullYear())) return toast("Please enter a valid founding year.", true);
        if (k === "name" && !v) return toast("Name can't be empty.", true);
        if (norm(v) !== norm(cur[k])) patch[k] = v;
      }
      if (await saveWithConfirm(l, patch)) viewListing(l.slug, "profile");
    });
  }

  /* courses */
  async function tabCourses(l, el) {
    el.innerHTML = '<div class="loading"><span class="spinner"></span></div>';
    const { data, error } = await sb.from("courses").select("*").eq("slug", l.slug).neq("status", "removed").order("created_at");
    if (error) return fail(error);
    const liveNow = notPublicYet(l) || (isVerified(l) && l.status === "published");
    const st = (c) => c.status === "published" ? '<span class="pill green">Live</span>' : c.status === "pending" ? '<span class="pill amber">In review</span>' : `<span class="pill red">Not approved</span>`;
    el.innerHTML = `<div class="head-row"><h2 style="flex:1">Courses</h2><button class="btn" id="addC">Add a course</button></div>
      <p class="muted small" style="margin-bottom:12px">${liveNow ? (notPublicYet(l) ? "Courses are published together with your listing." : "Course changes go live instantly after you confirm.") : "Course changes are reviewed by our team until your listing is Verified."} Show the full fee including material and tests; avoid "limited-time" discount claims.</p>
      ${data.length ? `<div class="list">${data.map((c) => `<div class="item"><div class="main"><h3>${esc(c.title)}</h3>
        <div class="meta">${[c.exam, c.mode, c.duration, c.fee].filter(Boolean).map(esc).join(" · ")}</div>
        <div style="margin-top:6px">${st(c)} <span class="muted small">Updated ${fmtDate(c.updated_at)}</span></div>
        ${c.status === "rejected" && c.reason ? `<div class="notice red small" style="margin-top:8px">${esc(c.reason)}</div>` : ""}</div>
        <div class="btns"><button class="btn sm ghost" data-e="${c.id}">Edit</button><button class="btn sm ghost" data-r="${c.id}">Remove</button></div></div>`).join("")}</div>`
        : '<div class="empty">No courses yet. Add your first course so students can compare fees and batches.</div>'}`;
    $("#addC", el).addEventListener("click", () => courseDialog(l, null, el));
    $$("[data-e]", el).forEach((b) => b.addEventListener("click", () => courseDialog(l, data.find((c) => c.id === b.dataset.e), el)));
    $$("[data-r]", el).forEach((b) => b.addEventListener("click", async () => {
      if (!(await confirmBox("Remove this course?", "<p>It will be removed from your listing.</p>", "Remove", "red"))) return;
      const { error } = await sb.rpc("remove_course", { p_id: b.dataset.r });
      if (error) return fail(error);
      toast("Course removed."); tabCourses(l, el);
    }));
  }
  async function courseDialog(l, c, el) {
    c = c || {};
    const fld = (k, label, ph, ta) => `<label class="f">${label}${ta ? `<textarea name="${k}" placeholder="${ph || ""}">${esc(c[k] || "")}</textarea>` : `<input type="text" name="${k}" value="${esc(c[k] || "")}" placeholder="${ph || ""}">`}</label>`;
    const liveNow = isVerified(l) && l.status === "published";
    const vals = await modal({
      title: c.id ? "Edit course" : "Add a course",
      html: `<form class="stack" id="cf">${fld("title", "Course name *", "e.g. JEE Main + Advanced 2-year programme")}
        <div class="grid2">${fld("exam", "Exam / subject", "JEE")}<label class="f">Mode<select name="mode">${["", "Classroom", "Online", "Hybrid"].map((m) => `<option ${c.mode === m ? "selected" : ""}>${m}</option>`).join("")}</select></label></div>
        <div class="grid2">${fld("duration", "Duration", "2 years")}${fld("fee", "Total fee", "₹1,20,000 incl. GST and material")}</div>
        <div class="grid2">${fld("batch_start", "Next batch starts", "April 2027")}${fld("schedule", "Schedule", "Mon–Fri, 4–7 pm")}</div>
        ${fld("description", "Short description", "What's included, batch size, tests…", true)}</form>
        ${!notPublicYet(l) ? `<p class="muted small" style="margin-top:10px">${liveNow ? "This goes live on the site as soon as you save." : "This will be sent to our team for approval."}</p>` : ""}`,
      buttons: [{ label: "Cancel", value: null, cls: "ghost" }, {
        label: liveNow ? "Confirm & publish" : "Save",
        validate: (bg) => { if (!$("[name=title]", bg).value.trim()) { toast("Course name is required.", true); return false; } return true; },
        value: (bg) => Object.fromEntries(["title", "exam", "mode", "duration", "fee", "batch_start", "schedule", "description"].map((k) => [k, $(`[name=${k}]`, bg).value.trim()]))
      }]
    });
    if (!vals) return;
    if (c.id) vals.id = c.id;
    const { error } = await sb.rpc("save_course", { p_slug: l.slug, p_course: vals });
    if (error) return fail(error);
    toast(liveNow ? "Course published." : notPublicYet(l) ? "Course saved." : "Course sent for review.");
    tabCourses(l, el);
  }

  /* media */
  function tabMedia(l, el) {
    const cur = effective(l);
    const photos = cur.photos || [];
    const liveTxt = goesLive(l, "photos") ? (notPublicYet(l) ? "" : "Changes here go live as soon as you confirm.") : "Changes here are reviewed by our team until your listing is Verified.";
    el.innerHTML = `<div class="card"><h2>Logo</h2><div class="btns">${cur.logo ? `<img class="logo-prev" src="${esc(cur.logo)}" alt="Current logo">` : '<div class="logo-prev" style="display:grid;place-items:center" aria-hidden="true">—</div>'}
        <label class="btn ghost" style="cursor:pointer">Upload logo<input type="file" accept="image/png,image/jpeg,image/webp" id="lg" hidden></label>
        ${cur.logo ? '<button class="btn link" id="rmlg">Remove</button>' : ""}</div><p class="muted small" style="margin-top:8px">Square PNG or JPG works best. ${liveTxt}</p></div>
      <div class="card"><h2>Photos <span class="muted small">(${photos.length}/8)</span></h2>
        <div class="photos">${photos.map((p, i) => `<div class="ph"><img src="${esc(p)}" alt="Photo ${i + 1}"><button class="btn sm red" data-rm="${i}" aria-label="Remove photo ${i + 1}">✕</button></div>`).join("")}</div>
        ${photos.length < 8 ? `<label class="btn ghost" style="cursor:pointer;margin-top:12px">Add photos<input type="file" accept="image/png,image/jpeg,image/webp" id="ph" multiple hidden></label>` : ""}
        <p class="muted small" style="margin-top:8px">Real photos of your classrooms, library or events. No stock images, posters or student photos without consent. ${liveTxt}</p></div>`;
    const upload = async (file) => {
      const small = await shrinkImage(file);
      if (small.size > 3 * 1024 * 1024) throw new Error("Image is too large (max 3 MB).");
      const ext = (small.type.split("/")[1] || "jpg").replace("jpeg", "jpg");
      const path = `${S.user.id}/${l.slug}/${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${ext}`;
      const { error } = await sb.storage.from("media").upload(path, small, { contentType: small.type, upsert: false });
      if (error) throw error;
      return sb.storage.from("media").getPublicUrl(path).data.publicUrl;
    };
    const after = async (patch) => { if (await saveWithConfirm(l, patch)) viewListing(l.slug, "media"); };
    $("#lg", el).addEventListener("change", async (e) => {
      const f = e.target.files[0]; if (!f) return;
      try { toast("Uploading…"); await after({ logo: await upload(f) }); } catch (err) { fail(err); }
    });
    const rmlg = $("#rmlg", el); if (rmlg) rmlg.addEventListener("click", () => after({ logo: "" }));
    const ph = $("#ph", el);
    if (ph) ph.addEventListener("change", async (e) => {
      const files = [...e.target.files].slice(0, 8 - photos.length); if (!files.length) return;
      try { toast("Uploading…"); const urls = []; for (const f of files) urls.push(await upload(f)); await after({ photos: photos.concat(urls) }); } catch (err) { fail(err); }
    });
    $$("[data-rm]", el).forEach((b) => b.addEventListener("click", () => after({ photos: photos.filter((_, i) => i !== +b.dataset.rm) })));
  }

  /* documents + badge (also used during a claim, before the listing is owned) */
  async function tabVerify(l, el, slug, kind, owned) {
    el.innerHTML = '<div class="loading"><span class="spinner"></span></div>';
    const { data: docs, error } = await sb.from("documents").select("*").eq("slug", slug).eq("user_id", S.user.id).is("purged_at", null).order("created_at", { ascending: false });
    if (error) return fail(error);
    const req = ((S.settings.required_docs || {})[kind] || []);
    const types = [...req, "other"];
    const docState = (t) => {
      const d = docs.filter((x) => x.doc_type === t);
      if (!d.length) return '<span class="pill">Not uploaded</span>';
      const lastD = d[0];
      return lastD.status === "accepted" ? '<span class="pill green">Accepted</span>' : lastD.status === "rejected" ? `<span class="pill red">Rejected</span> <span class="small">${esc(lastD.reason || "")}</span>` : '<span class="pill amber">Uploaded</span>';
    };
    const vreq = S.verif.filter((r) => r.slug === slug);
    const open = vreq.find((r) => r.status === "pending"), lastRej = vreq.find((r) => r.status === "rejected");
    const allIn = req.every((t) => docs.some((d) => d.doc_type === t && d.status !== "rejected"));
    const verified = owned && isVerified(l);
    const soon = verified && l.verified_until && (new Date(l.verified_until) - Date.now()) < 45 * 864e5;
    const badgeName = kind === "individual" ? "Verified Individual" : "OC4U Verified";
    el.innerHTML = `${verified ? `<div class="notice green"><b>✓ ${badgeName}</b> until ${fmtDate(l.verified_until)}. ${soon ? "Your badge expires soon — please upload fresh documents and request verification again." : ""}</div>` : ""}
      ${open ? '<div class="notice amber">Your documents are being reviewed. We usually reply within 1–2 working days.</div>' : ""}
      ${lastRej && !open && !verified ? `<div class="notice red">Last verification wasn't approved: ${esc(lastRej.reason || "")}</div>` : ""}
      <div class="card"><h2>${owned ? "Documents for verification" : "Documents to prove ownership"}</h2>
        <p class="muted small">${kind === "individual" ? "Individual tutors and coaches need ID and address proof. GST and business registration are optional." : "Institutes need all four documents below."} PDF, JPG or PNG, up to 5 MB each. Files are private: only our verification team can see them${S.settings.delete_docs_after_verification ? ", and they're deleted after we verify you" : ""}.</p>
        ${types.map((t) => `<div class="docrow"><div class="nm"><b>${esc(DOCS[t].label)}</b>${req.includes(t) ? "" : ' <span class="muted small">(optional)</span>'}<div class="muted small">${esc(DOCS[t].hint)}</div></div>
          <div>${docState(t)}</div><label class="btn sm ghost" style="cursor:pointer">Upload<input type="file" accept="application/pdf,image/jpeg,image/png,image/webp" data-up="${t}" hidden></label></div>`).join("")}</div>
      ${owned ? `<div class="card"><h2>Get the ${badgeName} badge</h2><p class="small">Once your documents are in, request verification. Our team checks them by hand. The badge is valid for ${S.settings.badge_validity_months || 12} months.</p>
        <div class="btns" style="margin-top:12px"><button class="btn green" id="rv" ${!allIn || open || (verified && !soon) ? "disabled" : ""}>Request verification</button>
        ${!allIn ? '<span class="muted small">Upload all required documents first.</span>' : ""}</div></div>
        ${badgeCard(l, verified, badgeName)}` : `<p class="muted small">After you upload, our team reviews your claim. <a href="#/">Back to my listings</a></p>`}`;
    $$("[data-up]", el).forEach((inp) => inp.addEventListener("change", async (e) => {
      const f = e.target.files[0]; if (!f) return;
      if (f.size > 5 * 1024 * 1024) return toast("File is larger than 5 MB.", true);
      if (!/^(application\/pdf|image\/(jpeg|png|webp))$/.test(f.type)) return toast("Please upload a PDF, JPG or PNG.", true);
      if (inp.dataset.up === "owner_id" && !(await confirmBox("Before you upload your ID", "<p>Please upload a <b>PAN card</b> or a <b>masked Aadhaar</b> (only the last 4 digits visible). Never upload a full Aadhaar number.</p>", "Continue"))) return;
      const ext = (f.name.split(".").pop() || "pdf").toLowerCase().replace(/[^a-z0-9]/g, "");
      const path = `${S.user.id}/${slug}/${inp.dataset.up}-${Date.now()}.${ext}`;
      toast("Uploading…");
      const up = await sb.storage.from("documents").upload(path, f, { contentType: f.type });
      if (up.error) return fail(up.error);
      const { error } = await sb.rpc("register_document", { p_slug: slug, p_type: inp.dataset.up, p_path: path, p_file_name: f.name });
      if (error) return fail(error);
      toast("Uploaded."); tabVerify(l, el, slug, kind, owned);
    }));
    const rv = $("#rv", el);
    if (rv) rv.addEventListener("click", async () => {
      const { error } = await sb.rpc("request_verification", { p_slug: slug });
      if (error) return fail(error);
      toast("Verification requested."); await loadAll(); tabVerify(S.listings.find((x) => x.slug === slug), el, slug, kind, owned);
    });
  }
  function badgeCard(l, verified, badgeName) {
    if (l.status !== "published") return "";
    const site = "https://www.onlinecoaching4u.in", url = `${site}/institute-${l.slug}`;
    const vb = `<a href="${url}" target="_blank" rel="noopener" title="${badgeName} on OnlineCoaching4U"><img src="${site}/assets/portal/${l.kind === "individual" ? "badge-individual" : "badge-verified"}.svg" alt="${badgeName} on OnlineCoaching4U" width="210" height="56"></a>`;
    const rb = `<a href="${url}#reviews" target="_blank" rel="noopener" title="Review us on OnlineCoaching4U"><img src="${site}/assets/portal/badge-review.svg" alt="Review us on OnlineCoaching4U" width="210" height="56"></a>`;
    return `<div class="card"><h2>Badges for your website</h2>
      <p class="muted small">Optional. Adding a badge to your website doesn't affect your ranking or verification on OC4U.</p>
      ${verified ? `<h3 style="margin-top:14px">${badgeName} badge</h3><div style="margin:8px 0"><img src="/assets/portal/${l.kind === "individual" ? "badge-individual" : "badge-verified"}.svg" alt="" width="210" height="56"></div><code class="snip">${esc(vb)}</code><button class="btn sm ghost" data-copy="v" style="margin-top:8px">Copy code</button>` : `<p class="small" style="margin-top:10px">The Verified badge becomes available here once your listing is verified.</p>`}
      <h3 style="margin-top:18px">"Review us" button</h3><div style="margin:8px 0"><img src="/assets/portal/badge-review.svg" alt="" width="210" height="56"></div><code class="snip">${esc(rb)}</code><button class="btn sm ghost" data-copy="r" style="margin-top:8px">Copy code</button></div>`
      .replace(/data-copy="v"/, `data-copy="v" onclick="navigator.clipboard.writeText(${esc(JSON.stringify(vb))});P.toast('Copied.')"`)
      .replace(/data-copy="r"/, `data-copy="r" onclick="navigator.clipboard.writeText(${esc(JSON.stringify(rb))});P.toast('Copied.')"`);
  }

  /* stats */
  async function tabStats(l, el) {
    if (l.status !== "published") { el.innerHTML = '<div class="empty">Stats start once your listing is live.</div>'; return; }
    const since = new Date(Date.now() - 29 * 864e5).toISOString().slice(0, 10);
    const { data, error } = await sb.from("site_events").select("*").eq("slug", l.slug).gte("day", since).order("day");
    if (error) return fail(error);
    const days = [...Array(30)].map((_, i) => new Date(Date.now() - (29 - i) * 864e5).toISOString().slice(0, 10));
    const by = Object.fromEntries(data.map((d) => [d.day, d]));
    const views = days.map((d) => (by[d] || {}).views || 0), clicks = days.map((d) => (by[d] || {}).clicks || 0);
    const max = Math.max(1, ...views);
    const sum = (a) => a.reduce((x, y) => x + y, 0);
    el.innerHTML = `<div class="grid3"><div class="stat"><span class="muted small">Profile views (30 days)</span><b>${sum(views)}</b></div>
      <div class="stat"><span class="muted small">Clicks on website, socials, maps & enquiry (30 days)</span><b>${sum(clicks)}</b></div>
      <div class="stat"><span class="muted small">Last 7 days views</span><b>${sum(views.slice(-7))}</b></div></div>
      <div class="card" style="margin-top:16px"><h3>Daily profile views</h3><div class="bars" aria-label="Daily views for the last 30 days">${views.map((v, i) => `<span class="${clicks[i] ? "c" : ""}" style="height:${Math.round(v / max * 100)}%" title="${days[i]}: ${v} views, ${clicks[i]} clicks"></span>`).join("")}</div>
      <p class="muted small" style="margin-top:8px">Dark bars are days with at least one click. Visits from search-engine bots aren't counted.</p></div>`;
  }

  /* account */
  function viewAccount() {
    shell("account", `<div class="head-row"><h1>My account</h1></div>
      <form id="acc" class="card stack"><label class="f">Email<input type="email" value="${esc(S.user.email)}" disabled></label>
        <label class="f">Full name<input type="text" name="name" value="${esc(S.profile.full_name || "")}" maxlength="120"></label>
        <label class="f">Phone (for our team only)<input type="tel" name="phone" value="${esc(S.profile.phone || "")}" maxlength="20"></label>
        <div class="btns"><button class="btn" type="submit">Save</button></div></form>
      <form id="pw" class="card stack"><h2>Change password</h2><label class="f">New password<input type="password" name="pw" minlength="8" autocomplete="new-password"></label>
        <div class="btns"><button class="btn ghost" type="submit">Update password</button></div></form>
      <div class="card"><h2>Need to delete your account?</h2><p class="small">Email <a href="mailto:onlinecoaching4u.official@gmail.com">onlinecoaching4u.official@gmail.com</a> from ${esc(S.user.email)} and we'll remove your account and documents.</p></div>`);
    $("#acc").addEventListener("submit", async (e) => {
      e.preventDefault();
      const { error } = await sb.rpc("update_my_profile", { p_full_name: e.target.name.value.trim(), p_phone: e.target.phone.value.trim() });
      if (error) return fail(error);
      toast("Saved."); await loadAll();
    });
    $("#pw").addEventListener("submit", async (e) => {
      e.preventDefault();
      const pw = e.target.pw.value;
      if (pw.length < 8) return toast("Password needs at least 8 characters.", true);
      const { error } = await sb.auth.updateUser({ password: pw });
      if (error) return fail(error);
      e.target.reset(); toast("Password updated.");
    });
  }

  /* ---------- router ---------- */
  async function route() {
    const h = location.hash.replace(/^#\/?/, "").split("/");
    try {
      if (h[0] === "claim") return viewClaim(h[1]);
      if (h[0] === "claimdocs" && h[1]) {
        const c = S.claims.find((x) => x.slug === h[1]);
        shell("home", `<div class="head-row"><h1>Prove you run ${esc((S.claimNames[h[1]] || {}).name || h[1])}</h1></div><div id="tab"></div>`);
        return tabVerify({ slug: h[1], kind: c ? c.kind : "institute" }, $("#tab"), h[1], c ? c.kind : "institute", false);
      }
      if (h[0] === "new") return viewNew();
      if (h[0] === "account") return viewAccount();
      if (h[0] === "l" && h[1]) return viewListing(h[1], h[2]);
      viewHome();
    } catch (e) { fail(e); }
  }

  async function start() {
    const params = new URLSearchParams(location.search);
    const { data: { session } } = await sb.auth.getSession();
    sb.auth.onAuthStateChange((ev) => { if (ev === "PASSWORD_RECOVERY") renderAuth(root, { title: "Set a new password", subtitle: "Choose a new password for your account.", allowSignup: false }).setMode("reset"); });
    if (params.get("reset") && session) { renderAuth(root, { title: "Set a new password", subtitle: "Choose a new password for your account.", allowSignup: false }).setMode("reset"); return; }
    if (!session) {
      renderAuth(root, { title: "Institute panel", subtitle: params.get("claim") ? "Log in or create a free account to claim your listing." : "Manage your OnlineCoaching4U listing, courses and Verified badge.", allowSignup: true });
      return;
    }
    S.user = session.user;
    $("#who").textContent = S.user.email; $("#out").hidden = false;
    root.innerHTML = '<div class="loading"><span class="spinner"></span> Loading your panel…</div>';
    try { await loadAll(); } catch (e) { root.innerHTML = `<div class="notice red">${esc(window.P.errMsg(e))}</div>`; return; }
    if (S.profile.blocked) { root.innerHTML = '<div class="notice red">This account is blocked. Please contact onlinecoaching4u.official@gmail.com.</div>'; return; }
    if (params.get("claim")) { const c = params.get("claim"); history.replaceState(null, "", location.pathname + "#/claim/" + encodeURIComponent(c)); }
    window.addEventListener("hashchange", route);
    route();
  }
  $("#out").addEventListener("click", signOut);
  start();
})();
