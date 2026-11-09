/* Shared helpers for the OnlineCoaching4U institute and admin panels. */
(function () {
  const sb = window.supabase.createClient("__SUPABASE_URL__", "__SUPABASE_KEY__", {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
  });

  const esc = (s) => String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

  function toast(msg, isErr) {
    const t = document.createElement("div");
    t.className = "toast" + (isErr ? " err" : "");
    t.textContent = msg;
    t.setAttribute("role", "status");
    document.body.appendChild(t);
    setTimeout(() => t.remove(), isErr ? 6000 : 3500);
  }
  function errMsg(e) {
    const m = (e && (e.message || e.error_description || e.msg)) || String(e);
    return m.replace(/^.*?ERROR:\s*/, "");
  }
  function fail(e) { console.error(e); toast(errMsg(e), true); }

  /* modal: returns a promise resolving to the clicked button's value (or null) */
  function modal({ title, html, buttons = [{ label: "Close", value: null, cls: "ghost" }], onOpen, wide }) {
    return new Promise((resolve) => {
      const bg = document.createElement("div");
      bg.className = "modal-bg";
      bg.innerHTML = `<div class="modal" role="dialog" aria-modal="true" aria-label="${esc(title)}"${wide ? ' style="max-width:860px"' : ""}>
        <h2>${esc(title)}</h2><div class="mbody">${html || ""}</div>
        <div class="btns">${buttons.map((b, i) => `<button class="btn ${b.cls || ""}" data-i="${i}">${esc(b.label)}</button>`).join("")}</div></div>`;
      const close = (v) => { bg.remove(); document.removeEventListener("keydown", onKey); resolve(v); };
      const onKey = (e) => { if (e.key === "Escape") close(null); };
      document.addEventListener("keydown", onKey);
      bg.addEventListener("click", (e) => { if (e.target === bg) close(null); });
      $$(".btns button", bg).forEach((b) => b.addEventListener("click", async () => {
        const def = buttons[+b.dataset.i];
        if (def.validate) { const ok = await def.validate(bg); if (!ok) return; }
        close(typeof def.value === "function" ? def.value(bg) : def.value);
      }));
      document.body.appendChild(bg);
      if (onOpen) onOpen(bg);
      const first = $("input,textarea,select", bg) || $(".btns button:last-child", bg);
      if (first) first.focus();
    });
  }
  const confirmBox = (title, html, okLabel = "Confirm", okCls = "") =>
    modal({ title, html, buttons: [{ label: "Cancel", value: false, cls: "ghost" }, { label: okLabel, value: true, cls: okCls }] });

  /* ask for a reason (used for every rejection) */
  function askReason(title, presets) {
    const opts = (presets || []).map((p) => `<option>${esc(p)}</option>`).join("");
    return modal({
      title,
      html: `${opts ? `<label class="f">Common reasons<select id="rs-pre"><option value="">Choose one, or write your own below</option>${opts}</select></label>` : ""}
             <label class="f" style="margin-top:10px">Reason (shown to the institute)<textarea id="rs-txt" required></textarea></label>`,
      onOpen: (bg) => { const s = $("#rs-pre", bg); if (s) s.addEventListener("change", () => { if (s.value) $("#rs-txt", bg).value = s.value; }); },
      buttons: [{ label: "Cancel", value: null, cls: "ghost" },
        { label: "Send", cls: "red", validate: (bg) => { if (!$("#rs-txt", bg).value.trim()) { toast("Please write a reason.", true); return false; } return true; }, value: (bg) => $("#rs-txt", bg).value.trim() }]
    });
  }

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "";
  const fmtDateTime = (d) => d ? new Date(d).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "";
  const ago = (d) => {
    const s = (Date.now() - new Date(d)) / 1000;
    if (s < 90) return "just now"; if (s < 3600) return Math.round(s / 60) + " min ago";
    if (s < 86400) return Math.round(s / 3600) + " h ago"; return Math.round(s / 86400) + " days ago";
  };

  const TYPES = { coaching: "Coaching institute", certification: "Professional certification", coach: "Individual coach / mentor", "computer-courses": "Computer training institute" };
  const DOCS = {
    gst: { label: "GST certificate", hint: "GST registration certificate (REG-06)." },
    registration: { label: "Business registration", hint: "Udyam, company incorporation, trust/society, or shop & establishment certificate." },
    address: { label: "Address proof", hint: "Rent agreement, electricity bill (last 3 months), or property document for the centre." },
    owner_id: { label: "Owner ID", hint: "PAN card or masked Aadhaar of the owner. Please never upload a full Aadhaar number." },
    other: { label: "Other document", hint: "Anything else that helps us verify you." }
  };
  /* every editable listing field */
  const FIELDS = {
    name: { label: "Institute / your name", type: "text", max: 150 },
    type: { label: "Category", type: "select", options: TYPES },
    city: { label: "City", type: "text", hint: "Use 'online' if you only teach online.", max: 60 },
    locality: { label: "Area / locality", type: "text", max: 120 },
    address: { label: "Full address", type: "textarea", max: 400 },
    estd: { label: "Year founded", type: "number" },
    website: { label: "Website", type: "url", hint: "Starts with https://", max: 300 },
    phone: { label: "Contact phone", type: "tel", private: true, hint: "For our team only. Not shown on the site.", max: 20 },
    email: { label: "Contact email", type: "email", private: true, hint: "For our team only. Not shown on the site.", max: 150 },
    exams: { label: "Exams / subjects", type: "csv", hint: "Separate with commas, e.g. JEE, NEET, Foundation." },
    mode: { label: "Teaching mode", type: "select", options: { offline: "Classroom", hybrid: "Classroom + online", online: "Online only" } },
    about: { label: "About", type: "textarea", hint: "2–5 sentences. Facts students can check; no 'No.1' or '100% guarantee' claims.", max: 2500 },
    highlights: { label: "Highlights", type: "lines", hint: "One per line, up to 8.", maxItems: 8, max: 200 },
    timings: { label: "Batch timings", type: "text", hint: "e.g. Mon–Sat, 8 am – 8 pm", max: 200 },
    batches: { label: "Batch details", type: "textarea", hint: "Batch sizes, weekend batches, crash courses…", max: 1500 },
    socials: { label: "Social links", type: "socials" },
    logo: { label: "Logo", type: "image" },
    photos: { label: "Photos", type: "images" },
    branches: { label: "Branches", type: "lines", hint: "One branch per line with its area.", maxItems: 20, max: 200 },
    results: { label: "Results claims", type: "lines", hint: "One per line, e.g. '12 students cleared JEE Advanced 2025'. Our team checks these.", maxItems: 10, max: 200 }
  };
  const SOCIALS = { instagram: "Instagram", youtube: "YouTube", facebook: "Facebook", linkedin: "LinkedIn", x: "X (Twitter)" };

  function showVal(k, v) {
    if (v == null || v === "" || (Array.isArray(v) && !v.length)) return '<span class="muted">(empty)</span>';
    if (k === "type") return esc(TYPES[v] || v);
    if (k === "logo") return `<img src="${esc(v)}" alt="" style="width:48px;height:48px;object-fit:contain">`;
    if (k === "photos") return `${v.length} photo(s)`;
    if (k === "socials") return Object.entries(v || {}).filter(([, u]) => u).map(([s, u]) => `${esc(SOCIALS[s] || s)}: ${esc(u)}`).join("<br>") || '<span class="muted">(empty)</span>';
    if (Array.isArray(v)) return v.map(esc).join(k === "exams" ? ", " : "<br>");
    return `<pre class="val">${esc(v)}</pre>`;
  }

  /* live listing snapshot from the last site build (empty for brand-new listings) */
  const baseCache = {};
  async function fetchBase(slug) {
    if (baseCache[slug] !== undefined) return baseCache[slug];
    try {
      const r = await fetch(`/assets/listing-data/${encodeURIComponent(slug)}.json?v=${Date.now()}`);
      baseCache[slug] = r.ok ? await r.json() : null;
    } catch (e) { baseCache[slug] = null; }
    return baseCache[slug];
  }

  /* shrink big photos before upload */
  async function shrinkImage(file, maxSide = 1600) {
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return file;
    const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = URL.createObjectURL(file); });
    const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
    if (scale === 1 && file.size < 900000) return file;
    const c = document.createElement("canvas");
    c.width = Math.round(img.width * scale); c.height = Math.round(img.height * scale);
    c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
    const keepPng = file.type === "image/png" && file.size < 600000;
    const blob = await new Promise((res) => c.toBlob(res, keepPng ? "image/png" : "image/jpeg", 0.85));
    return new File([blob], file.name.replace(/\.\w+$/, keepPng ? ".png" : ".jpg"), { type: blob.type });
  }

  async function signOut() { await sb.auth.signOut(); location.reload(); }

  /* auth screen shared by both panels */
  function renderAuth(root, { title, subtitle, allowSignup }) {
    const params = new URLSearchParams(location.search);
    let mode = params.get("signup") && allowSignup ? "signup" : "login";
    const draw = () => {
      root.innerHTML = `<div class="auth">
        <h1>${esc(title)}</h1><p class="muted">${subtitle}</p>
        ${allowSignup ? `<div class="tabs" role="tablist"><button data-m="login" class="${mode === "login" ? "on" : ""}">Log in</button><button data-m="signup" class="${mode === "signup" ? "on" : ""}">Create account</button></div>` : '<div style="height:16px"></div>'}
        <form id="af" class="stack" novalidate>
          ${mode === "signup" ? `<label class="f">Your full name<input type="text" name="name" required autocomplete="name"></label>` : ""}
          ${mode !== "reset" ? `<label class="f">Email<input type="email" name="email" required autocomplete="email"><span class="hint">${mode === "signup" ? "Tip: an email on your institute's own website domain (e.g. info@yourinstitute.com) makes claiming your listing faster." : ""}</span></label>` : ""}
          ${mode !== "forgot" ? `<label class="f">${mode === "reset" ? "New password" : "Password"}<input type="password" name="password" required minlength="8" autocomplete="${mode === "login" ? "current-password" : "new-password"}"><span class="hint">${mode === "login" ? "" : "At least 8 characters."}</span></label>` : ""}
          ${mode === "signup" ? `<label class="chk"><input type="checkbox" name="agree" required> <span>I agree to the <a href="/terms" target="_blank">Terms</a> and <a href="/privacy" target="_blank">Privacy Policy</a>.</span></label>` : ""}
          <button class="btn" type="submit" style="width:100%;justify-content:center">${{ login: "Log in", signup: "Create account", forgot: "Send reset link", reset: "Save new password" }[mode]}</button>
          ${mode === "login" ? `<button type="button" class="btn link" data-m="forgot">Forgot password?</button>` : ""}
          ${mode === "forgot" ? `<button type="button" class="btn link" data-m="login">Back to log in</button>` : ""}
          <div id="amsg"></div>
        </form></div>`;
      $$("[data-m]", root).forEach((b) => b.addEventListener("click", () => { mode = b.dataset.m; draw(); }));
      $("#af", root).addEventListener("submit", async (e) => {
        e.preventDefault();
        const f = e.target, btn = $("button[type=submit]", f), msg = $("#amsg", root);
        const email = f.email && f.email.value.trim(), password = f.password && f.password.value;
        if (f.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return toast("Please enter a valid email.", true);
        if (f.password && password.length < 8) return toast("Password needs at least 8 characters.", true);
        if (f.agree && !f.agree.checked) return toast("Please accept the Terms to continue.", true);
        btn.disabled = true;
        try {
          if (mode === "login") {
            const { error } = await sb.auth.signInWithPassword({ email, password });
            if (error) throw error;
            location.reload();
          } else if (mode === "signup") {
            const { error } = await sb.auth.signUp({ email, password, options: { data: { full_name: f.name.value.trim() }, emailRedirectTo: location.origin + location.pathname + location.search } });
            if (error) throw error;
            msg.innerHTML = `<div class="notice green">Almost done! We've sent a confirmation link to <b>${esc(email)}</b>. Click it to activate your account, then log in here. (Check spam if you don't see it.)</div>`;
          } else if (mode === "forgot") {
            const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo: location.origin + location.pathname + "?reset=1" });
            if (error) throw error;
            msg.innerHTML = `<div class="notice green">If an account exists for ${esc(email)}, a reset link is on its way.</div>`;
          } else if (mode === "reset") {
            const { error } = await sb.auth.updateUser({ password });
            if (error) throw error;
            toast("Password updated."); history.replaceState(null, "", location.pathname); location.reload();
          }
        } catch (err) {
          const m = errMsg(err);
          msg.innerHTML = `<div class="notice red">${esc(/Email not confirmed/i.test(m) ? "Please confirm your email first — open the link we sent you." : /Invalid login/i.test(m) ? "Wrong email or password." : m)}</div>`;
        } finally { btn.disabled = false; }
      });
    };
    draw();
    return { setMode: (m) => { mode = m; draw(); } };
  }

  window.P = { sb, esc, $, $$, toast, fail, errMsg, modal, confirmBox, askReason, fmtDate, fmtDateTime, ago, TYPES, DOCS, FIELDS, SOCIALS, showVal, fetchBase, shrinkImage, signOut, renderAuth };
})();
