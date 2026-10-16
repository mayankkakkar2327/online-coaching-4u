/* Online Coaching 4u — static site generator. Run: node build.js */
/* redeploy-trigger: forcing a fresh Vercel build/alias after custom-domain asset 503s */
const fs = require("fs");
const path = require("path");

const DATA = JSON.parse(fs.readFileSync(path.join(__dirname, "data.json"), "utf8"));
const POSTS = require("./posts.js");
const REVIEWS = require("./reviews.js");
const BRAND_REVIEWS = require("./brand-reviews.js");
const AI_TOOLS = require("./ai-tools.js");
const OUT = path.join(__dirname, "..", "website");

/* wipe previous build output so removed/renamed pages don't linger as stale files */
if (fs.existsSync(OUT)) fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
const B = DATA.brand;
const L = DATA.listings;
const EX = DATA.examLabels;

const cityLabel = (c) => c === "online" ? "Online" : c.split("-").map(w => w[0].toUpperCase() + w.slice(1)).join(" ");
const examLabel = (e) => EX[e] || e.toUpperCase();
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const slugify = (s) => String(s).toLowerCase().replace(/<[^>]*>/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

/* Scans article HTML for <h2>/<h3> headings and tags each with a unique id
   (so anchor links and FAQ deep-links work). Returns the id-annotated HTML
   plus a flat list of only the <h2> sections, for a numbered sidebar TOC. */
function buildToc(html) {
  const used = new Set();
  const tocItems = [];
  const withIds = html.replace(/<(h2|h3)>(.*?)<\/\1>/gs, (match, tag, text) => {
    let id = slugify(text) || "section";
    let unique = id, n = 2;
    while (used.has(unique)) { unique = `${id}-${n++}`; }
    used.add(unique);
    if (tag === "h2") tocItems.push({ text, id: unique });
    return `<${tag} id="${unique}">${text}</${tag}>`;
  });
  return { html: withIds, tocItems };
}
const typeLabel = { coaching: "Coaching", certification: "Certification", coach: "Individual Coach", "computer-courses": "Computer Institute" };
const typePlural = { coaching: "Coaching Institutes", certification: "Professional Certifications", coach: "Individual Coaches", "computer-courses": "Computer Training Institutes" };
const typePage = { coaching: "coaching", certification: "certification", coach: "coach", "computer-courses": "computer-courses" };

/* copy used specifically for the "online" (no fixed city) listing/detail pages —
   keyed by type so each vertical gets accurate, non-generic wording */
const ONLINE_COPY = {
  coaching: {
    h1: "Online Coaching Platforms",
    title: (n) => `Best Online Coaching Platforms (${n} compared)`,
    metaDesc: (n) => `Compare ${n} online coaching platforms across CAT, CLAT, IAS, JEE, NEET, SSC, CA and more — verified facts, no paid rankings.`,
    subNote: (n) => `${n} platforms compared across every exam category we track — pure-online brands plus the online and hybrid programs of major classroom institutes. Facts only: founders, formats and track record. No paid rankings — any standout recommendation on this page is based on verifiable facts, not payment, and nobody pays for placement.`,
    availability: "Pan-India"
  },
  certification: {
    h1: "Online Professional Certification Training",
    title: (n) => `Best Online Professional Certification Training (${n} compared)`,
    metaDesc: (n) => `Compare ${n} online professional certification training providers — including PMI PgMP®, PfMP®, PMP® and related credentials. Verified facts, no paid rankings.`,
    subNote: (n) => `${n} providers compared — facts only: founders/instructors, formats and track record. No paid rankings — nobody pays for placement.`,
    availability: "Worldwide"
  },
  coach: {
    h1: "Individual Coaches & Mentors",
    title: (n) => `Best Individual Coaches & Mentors (${n} compared)`,
    metaDesc: (n) => `Compare ${n} individual coaches and mentors — verified facts, real client outcomes, no paid rankings.`,
    subNote: (n) => `${n} coaches compared — facts only: credentials, offerings and client outcomes. No paid rankings — nobody pays for placement.`,
    availability: "Worldwide"
  }
};
const onlineCopyFor = (type) => ONLINE_COPY[type] || {
  h1: `Online ${typePlural[type] || type}`,
  title: (n) => `Best Online ${typePlural[type] || type} (${n} compared)`,
  metaDesc: (n) => `Compare ${n} online ${(typePlural[type] || type).toLowerCase()}.`,
  subNote: (n) => `${n} listed.`,
  availability: "Online"
};

const byType = (t) => L.filter(x => x.type === t);
const byCity = (t, c) => {
  const locals = byType(t).filter(x => x.city === c);
  /* pure-online platforms appear on every city page where their exams overlap local demand */
  const localExams = new Set(locals.flatMap(x => x.exams || []));
  const injected = c === "online" ? [] : byType(t).filter(x =>
    x.mode === "online" && x.city !== c && (x.exams || []).some(e => localExams.has(e)));
  return [...locals, ...injected]
    .sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0) || (b.rating || 0) * (b.ratingCount || 0) - (a.rating || 0) * (a.ratingCount || 0) || (b.ratingCount || 0) - (a.ratingCount || 0));
};

/* homepage exam tiles link straight to a city page — pick whichever city actually has
   the most listings for that exam, so a niche exam (e.g. NDA, only offered in a
   handful of cities) never lands a visitor on a page with zero matching results */
const bestCityForExam = (e) => {
  const counts = {};
  byType("coaching").forEach(x => {
    if (x.city && x.city !== "online" && (x.exams || []).includes(e)) counts[x.city] = (counts[x.city] || 0) + 1;
  });
  const cities = Object.keys(counts);
  if (!cities.length) return "sikar";
  cities.sort((a, b) => counts[b] - counts[a] || a.localeCompare(b));
  return cities[0];
};
const modeLabel = { offline: "Classroom", hybrid: "Hybrid", online: "Online" };

const stats = {
  listings: L.length,
  coaching: byType("coaching").length,
  cities: DATA.cities.coaching.filter(c => c !== "online").length,
  reviews: L.reduce((s, x) => s + (x.ratingCount || 0), 0)
};

/* ---------- original, fact-based descriptions ---------- */
function describe(x) {
  if (x.about) return esc(x.about);
  const city = cityLabel(x.city);
  const exams = x.exams.filter(e => e !== "schooling").map(examLabel);
  const age = 2026 - x.estd;
  const examStr = exams.length > 1 ? exams.slice(0, -1).join(", ") + " and " + exams.slice(-1) : exams[0] || "competitive exams";
  const bits = [
    `${x.name} is a coaching institute in ${x.locality}, ${city}, preparing students for ${examStr}.`,
    x.estd <= 2005 ? `Founded in ${x.estd}, it is one of the longest-running institutes in the city with more than ${age} years of teaching experience.` :
      x.estd <= 2015 ? `It has been operating since ${x.estd} and has built a steady local reputation over ${age} years.` :
      `It was established in ${x.estd}.`,
    x.rating && x.ratingCount >= 5 ? `It is rated ${x.rating.toFixed(1)}/5 from ${x.ratingCount} ratings on ${ratingSrc(x)}.` :
      x.ratingCount > 0 ? `It has a small number of public ratings on ${ratingSrc(x)} so far.` :
      `It has no public ratings yet. If you have studied here, your review would help others.`,
    `The institute is located at ${x.address}. We recommend visiting the campus and sitting in on a demo class before enrolling.`
  ];
  return bits.join(" ");
}

/* ---------- shared layout ---------- */
/* asset version — changes each build so browsers never serve stale immutable-cached CSS/JS */
const ASSET_V = Date.now().toString(36);
const CSS_LINK = `<link rel="stylesheet" href="assets/style.css?v=${ASSET_V}">`;

/* coaching cities (excluding the "online" pseudo-city) — one number used everywhere */
const COACHING_CITIES = DATA.cities.coaching.filter(c => c !== "online");
const ONLINE_COACHING = byType("coaching").filter(x => x.mode === "online" || x.mode === "hybrid");
const OFFLINE_COACHING = byType("coaching").filter(x => x.city !== "online" && x.mode !== "online");

/* Ratings stored in data.json come from public review sites (mostly Justdial), not from
   reviews collected on this site — so every rating is labelled with its source on the page
   and is never marked up as the site's own AggregateRating. A listing can set
   `ratingSource` explicitly; otherwise we detect it from the listing's own text. */
function ratingSrc(x) {
  if (x.ratingSource) return x.ratingSource;
  const t = `${x.about || ""} ${(x.highlights || []).join(" ")}`.toLowerCase();
  if (/urbanpro/.test(t) && !/justdial/.test(t)) return "UrbanPro";
  if (/shiksha/.test(t) && !/justdial/.test(t)) return "Shiksha";
  if (/facebook/.test(t) && !/justdial/.test(t)) return "Facebook";
  return "Justdial";
}
const plural = (n, w) => `${n} ${w}${n === 1 ? "" : "s"}`;

/* ---------- education line icons (motion art) ---------- */
const ICONS = {
  cap: `<path d="M4 24l28-12 28 12-28 12z" pathLength="1"/><path d="M16 29v12c0 4 7 8 16 8s16-4 16-8V29" pathLength="1"/><path d="M60 24v14" pathLength="1"/>`,
  book: `<path d="M32 18c-6-4-14-5-24-4v34c10-1 18 0 24 4 6-4 14-5 24-4V14c-10-1-18 0-24 4z" pathLength="1"/><path d="M32 18v34" pathLength="1"/>`,
  pencil: `<path d="M44 8l12 12-32 32H12V40z" pathLength="1"/><path d="M38 14l12 12" pathLength="1"/><path d="M12 52l6-6" pathLength="1"/>`,
  atom: `<circle cx="32" cy="32" r="3" pathLength="1"/><ellipse cx="32" cy="32" rx="26" ry="10" pathLength="1"/><ellipse cx="32" cy="32" rx="26" ry="10" transform="rotate(60 32 32)" pathLength="1"/><ellipse cx="32" cy="32" rx="26" ry="10" transform="rotate(120 32 32)" pathLength="1"/>`,
  compass: `<circle cx="32" cy="10" r="4" pathLength="1"/><path d="M30 14L16 54M34 14l14 40M21 40h22" pathLength="1"/>`,
  ruler: `<g transform="rotate(-30 32 32)"><rect x="6" y="24" width="52" height="16" rx="2" pathLength="1"/><path d="M14 24v6M22 24v4M30 24v6M38 24v4M46 24v6" pathLength="1"/></g>`,
  trophy: `<path d="M20 8h24v14a12 12 0 01-24 0z" pathLength="1"/><path d="M20 12H10c0 8 4 12 10 12M44 12h10c0 8-4 12-10 12" pathLength="1"/><path d="M32 34v10M24 56h16M26 56v-6h12v6" pathLength="1"/>`,
  pin: `<path d="M32 58S12 38 12 24a20 20 0 0140 0c0 14-20 34-20 34z" pathLength="1"/><circle cx="32" cy="24" r="7" pathLength="1"/>`,
  bulb: `<path d="M24 44c0-6-8-10-8-20a16 16 0 0132 0c0 10-8 14-8 20z" pathLength="1"/><path d="M25 50h14M27 56h10" pathLength="1"/>`,
  setsq: `<path d="M8 56V8l48 48z" pathLength="1"/><path d="M18 46V32l14 14z" pathLength="1"/>`,
  mail: `<rect x="6" y="14" width="52" height="36" rx="2" pathLength="1"/><path d="M6 16l26 20 26-20" pathLength="1"/>`,
  laptop: `<rect x="12" y="14" width="40" height="28" rx="2" pathLength="1"/><path d="M4 50h56l-4-8H8z" pathLength="1"/>`,
  chat: `<path d="M8 12h48v30H24l-12 10V42H8z" pathLength="1"/><path d="M18 24h28M18 32h18" pathLength="1"/>`,
  chip: `<rect x="14" y="14" width="36" height="36" rx="3" pathLength="1"/><rect x="24" y="24" width="16" height="16" pathLength="1"/><path d="M24 6v8M32 6v8M40 6v8M24 50v8M32 50v8M40 50v8M6 24h8M6 32h8M6 40h8M50 24h8M50 32h8M50 40h8" pathLength="1"/>`
};
const YELLOW = "#FFF9AB", LAV = "#D9DBF8", OLIVE_INK = "#6B6440";
function svgIcon(name, o = {}) {
  return `<svg${o.draw ? ' class="draw"' : ""} style="--r:${o.r || 0}deg;--fd:${o.fd || 0}s" viewBox="0 0 64 64" fill="none" stroke="${o.color || LAV}" stroke-width="${o.sw || 1.5}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name]}</svg>`;
}
/* icons placed only in the side margins (hidden below 1100px), never behind text */
function edgeArt(items, opts = {}) {
  const one = (it) => `<div class="ico side-${it.side}${it.drift ? " drift" : ""}" style="top:${it.top};width:${it.size}px;height:${it.size}px;${it.mr ? `margin-right:${it.mr}px;` : ""}${it.ml ? `margin-left:${it.ml}px;` : ""}${it.amp ? `--amp:${it.amp}px;` : ""}">${svgIcon(it.icon, { color: it.color, sw: it.sw, r: it.r, fd: it.fd, draw: true })}</div>`;
  if (opts.hero) {
    return `<div class="edge-art hero-art hero-away" aria-hidden="true"><div class="l">${items.filter(i => i.side === "l").map(one).join("")}</div><div class="r">${items.filter(i => i.side === "r").map(one).join("")}</div></div>`;
  }
  return `<div class="edge-art" aria-hidden="true">${items.map(one).join("")}</div>`;
}
/* small floating icon row shown in place of edge art on phones/tablets */
function iconRow(list, center) {
  return `<div class="icon-row" aria-hidden="true"${center ? ' style="justify-content:center"' : ""}>${list.map(([n, c, r, fd]) => svgIcon(n, { color: c, sw: 2.2, r, fd })).join("")}</div>`;
}
/* headline words that rise in on load; words from index hl onward get the yellow accent */
function hw(text, hl = -1, hlEnd = 999) {
  return String(text).split(/\s+/).filter(Boolean).map((w, i) => `<span class="hw${hl >= 0 && i >= hl && i <= hlEnd ? " y" : ""}" style="--i:${i}">${esc(w)}</span>`).join(" ");
}
/* section headings whose words light up while scrolling */
function rv(text, hl = -1, cls = "y") {
  return String(text).split(/\s+/).filter(Boolean).map((w, i) => `<span class="w${hl >= 0 && i >= hl ? " " + cls : ""}">${esc(w)}</span>`).join(" ");
}
const chev = `<svg class="bob" aria-hidden="true" width="26" height="30" viewBox="0 0 26 30" fill="none" stroke="currentColor" stroke-width="3"><path d="M3 4l10 8 10-8"/><path d="M3 14l10 8 10-8" opacity=".6"/></svg>`;
const ICON_SM = {
  shield: `<svg aria-hidden="true" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z"/><path d="M9 12l2 2 4-4"/></svg>`,
  bubble: `<svg aria-hidden="true" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5h16v11H8l-4 4z"/></svg>`,
  bars: `<svg aria-hidden="true" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M6 20V10M12 20V4M18 20v-7"/></svg>`,
  rupee: `<svg aria-hidden="true" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M7 5h10M7 9h10M10 5c3 0 5 1.6 5 4s-2 4-5 4H8l7 7"/></svg>`,
  check: `<svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5L20 7"/></svg>`,
  info: `<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 8v5M12 16v.5"/></svg>`,
  pin: `<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s-7-6.2-7-11.5A7 7 0 0119 9.5C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg>`,
  search: `<svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#5B6496" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>`
};
const arw = `<span class="arw" aria-hidden="true">↗</span>`;

function head(title, desc, image) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:site_name" content="${B.name}">
<meta property="og:type" content="website">
${image ? `<meta property="og:image" content="${B.siteUrl}/${image}">\n<meta name="twitter:card" content="summary_large_image">\n<meta name="twitter:image" content="${B.siteUrl}/${image}">` : ""}
<meta name="robots" content="index, follow">
<meta name="theme-color" content="#2B399E">
<link rel="icon" href="favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600&family=Instrument+Sans:wght@400;500;600&display=swap" rel="stylesheet">
${CSS_LINK}
<script async src="https://www.googletagmanager.com/gtag/js?id=G-H2F4C0EQXC"></script>
<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-H2F4C0EQXC');</script>
</head>
<body>`;
}

const grad = () => "";
const LOGO_MARK = `<svg aria-hidden="true" width="26" height="26" viewBox="0 0 40 40" fill="none" stroke="#FFF9AB" stroke-width="2.5"><polygon points="20,3 37,20 20,37 3,20"/><polygon points="8,8 32,8 32,32 8,32"/></svg>`;
const WORDMARK = `<span>onlinecoaching<b>4u</b></span>`;

function header(active) {
  const nav = [["certification.html", "Certifications"], ["coach.html", "Coaches"], ["computer-courses.html", "Computer Courses"], ["ai-tools.html", "AI Tools"], ["blog.html", "Guides"], ["reviews.html", "Reviews"]];
  const academicActive = active === "coaching-online.html" || active === "coaching.html";
  const cur = (h) => active === h ? ' class="active" aria-current="page"' : "";
  return `<a class="skip" href="#main">Skip to content</a>
<header class="site-header">
<div class="container header-inner">
<a class="logo" href="index.html" aria-label="${B.name} home">${LOGO_MARK}${WORDMARK}</a>
<nav class="main-nav" aria-label="Main navigation">
<div class="nav-item nav-has-dropdown">
<button type="button" class="nav-drop-btn${academicActive ? " active" : ""}" aria-haspopup="true" aria-expanded="false">Coaching <span class="nav-caret" aria-hidden="true">▾</span></button>
<div class="nav-dropdown">
<a href="coaching-online.html"${cur("coaching-online.html")}>Online Coaching</a>
<a href="coaching.html"${cur("coaching.html")}>Offline Coaching</a>
</div>
</div>
${nav.map(([h, t]) => `<a href="${h}"${cur(h)}>${t}</a>`).join("\n")}
<a href="contact.html"${cur("contact.html")}>Contact</a>
</nav>
<div class="header-cta">
<a class="btn btn-sm" href="list-your-institute.html">List your institute ${arw}</a>
<button class="nav-toggle" type="button" aria-label="Open menu" aria-expanded="false" aria-controls="drawer"><svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 8h16M4 16h16"/></svg></button>
</div>
</div>
</header>
<div class="drawer" id="drawer" hidden>
<nav aria-label="Mobile navigation">
<a href="index.html">Home <span aria-hidden="true">→</span></a>
<a href="coaching-online.html">Online Coaching <span aria-hidden="true">→</span></a>
<a href="coaching.html">Offline Coaching <span aria-hidden="true">→</span></a>
${nav.map(([h, t]) => `<a href="${h}">${t} <span aria-hidden="true">→</span></a>`).join("\n")}
<a href="about.html">About <span aria-hidden="true">→</span></a>
<a href="contact.html">Contact <span aria-hidden="true">→</span></a>
</nav>
<a class="btn" href="list-your-institute.html">List your institute free ${arw}</a>
</div>`;
}

function footer() {
  const footerCityCounts = COACHING_CITIES.map(c => ({ c, n: byCity("coaching", c).length }));
  const topFooterCities = [...footerCityCounts].sort((a, b) => b.n - a.n).slice(0, 10);
  const coachingCities = `<li><a href="coaching-online.html">Online Coaching</a></li>` +
    topFooterCities.map(({ c }) => `<li><a href="coaching-${c}.html">Coaching in ${cityLabel(c)}</a></li>`).join("") +
    `<li><a href="coaching.html" style="color:var(--yellow)">Browse all ${footerCityCounts.length} cities →</a></li>`;
  return `<footer class="site-footer">
<div class="container footer-grid">
<div class="foot-brand">
<a class="logo" href="index.html" aria-label="${B.name} home">${LOGO_MARK}${WORDMARK}</a>
<p>Compare coaching institutes across India with honest, labelled information. Free for students.</p>
</div>
<div class="foot-cols">
<details class="foot-col" open><summary>Coaching</summary><ul>${coachingCities}</ul></details>
<details class="foot-col" open><summary>Guides</summary><ul>${POSTS.slice(0, 6).map(p => `<li><a href="${p.slug}.html">${esc(p.title)}</a></li>`).join("")}</ul></details>
<details class="foot-col" open><summary>Company</summary><ul>
<li><a href="about.html">About Us</a></li>
<li><a href="contact.html">Contact Us</a></li>
<li><a href="blog.html">Guides</a></li>
<li><a href="certification.html">Certifications</a></li>
<li><a href="coach.html">Coaches</a></li>
<li><a href="computer-courses.html">Computer Courses</a></li>
<li><a href="ai-tools.html">AI Tools</a></li>
<li><a href="list-your-institute.html">List Your Institute</a></li>
<li><a href="/sitemap.xml">Sitemap</a></li>
<li><a href="https://www.onlinecoaching4u.in/feed">Feed</a></li>
</ul></details>
<details class="foot-col" open><summary>Legal</summary><ul>
<li><a href="privacy.html">Privacy Policy</a></li>
<li><a href="terms.html">Terms &amp; Conditions</a></li>
</ul>
<p class="footer-note">Listing data is verified with institutes where possible. Ratings shown are from public review sites such as Justdial and Google, and each one is labelled with its source.</p></details>
</div>
</div>
<div class="container footer-bottom"><span>© 2026 ${B.name}. All rights reserved.</span><span>Free for students, always.</span></div>
</footer>
<script src="assets/app.js?v=${ASSET_V}"></script>
</body></html>`;
}

/* shared inner-page hero (blue band) */
function pageHero({ crumbs = [], badge = "", h1 = "", h1Class = "", sub = "", extra = "", art = [], wide = false }) {
  const crumbHtml = crumbs.length ? `<nav class="crumbs fadein" style="--d:0ms" aria-label="Breadcrumb">${crumbs.map(([h, t], i) => i === crumbs.length - 1 || !h ? `<span${i === crumbs.length - 1 ? ' aria-current="page"' : ""}>${esc(t)}</span>` : `<a href="${h}">${esc(t)}</a>`).join('<span aria-hidden="true">/</span>')}</nav>` : "";
  return `<section class="page-hero">
${art.length ? edgeArt(art, { hero: true }) : ""}
<div class="container"><div class="inner"${wide ? ' style="max-width:none"' : ""}>
${crumbHtml}
${badge ? `<div class="badge-line fadein" style="--d:60ms"><i aria-hidden="true"></i>${badge}</div>` : ""}
<h1${h1Class ? ` class="${h1Class}"` : ""}>${h1}</h1>
${sub ? `<p class="hero-sub fadein" style="--d:350ms">${sub}</p>` : ""}
${extra}
</div></div>
</section>`;
}
const HERO_ART = {
  a: [{ icon: "pin", side: "r", top: "18%", size: 116, color: YELLOW }, { icon: "book", side: "r", top: "60%", size: 92, mr: 130, fd: -2 }],
  b: [{ icon: "cap", side: "r", top: "16%", size: 112, color: YELLOW, r: -8 }, { icon: "pencil", side: "r", top: "60%", size: 86, mr: 140, fd: -2, r: 12 }],
  c: [{ icon: "atom", side: "r", top: "18%", size: 112, color: YELLOW, fd: -1 }, { icon: "ruler", side: "r", top: "60%", size: 90, mr: 140, fd: -3 }],
  d: [{ icon: "compass", side: "r", top: "18%", size: 112, color: YELLOW, r: -6 }],
  e: [{ icon: "trophy", side: "r", top: "16%", size: 116, color: YELLOW, r: 6 }, { icon: "bulb", side: "r", top: "60%", size: 88, mr: 140, fd: -2, r: -6 }],
  f: [{ icon: "chip", side: "r", top: "18%", size: 110, color: YELLOW }, { icon: "laptop", side: "r", top: "60%", size: 92, mr: 140, fd: -2 }],
  g: [{ icon: "mail", side: "r", top: "20%", size: 108, color: YELLOW, r: 8 }],
  h: [{ icon: "chat", side: "r", top: "18%", size: 110, color: YELLOW }, { icon: "trophy", side: "r", top: "60%", size: 86, mr: 140, fd: -2 }]
};

/* ---------- institute card ---------- */
function scoreLine(x) {
  if (x.rating && x.ratingCount) return `<span class="score-line"><span class="pill">★ ${x.rating.toFixed(1)}</span>${x.ratingCount} on ${ratingSrc(x)}</span>`;
  if (x.googleRating) return `<span class="score-line"><span class="pill">★ ${x.googleRating.toFixed(1)}</span>${x.googleReviewCount} on Google</span>`;
  return `<span class="score-line">No ratings yet</span>`;
}
/* kept for any template still calling stars() */
function stars(x) { return scoreLine(x); }

function card(x, i) {
  const exams = x.exams.filter(e => e !== "schooling");
  const examTags = exams.slice(0, 4).map(e => `<span class="tag">${examLabel(e)}</span>`).join("") + (exams.length > 4 ? `<span class="tag grey">+${exams.length - 4} more</span>` : "");
  const gender = x.gender ? `<span class="tag grey">${x.gender === "Both" ? "Boys & Girls" : x.gender === "Female" ? "Girls" : "Boys"}</span>` : "";
  const price = x.priceRange ? `<span class="tag green">${esc(x.priceRange)}</span>` : "";
  const modeTag = x.mode ? `<span class="tag grey">${modeLabel[x.mode]}</span>` : "";
  const status = x.verified ? `<span class="tag green">✓ Verified</span>` : "";
  const locLine = x.city === "online" ? esc(x.locality) : `${esc(x.locality)}, ${cityLabel(x.city)}`;
  const n = typeof i === "number" ? i + 1 : 0;
  return `<a class="inst fade-up" href="institute-${x.slug}.html" data-exams="${x.exams.join(",")}" data-verified="${x.verified}" data-featured="${x.featured ? 1 : 0}" data-mode="${x.mode || ""}" data-rating="${x.rating || 0}" data-reviews="${x.ratingCount || 0}" data-estd="${x.estd || 9999}" data-name="${esc(x.name.toLowerCase())}">
<span class="rank" aria-hidden="true">${n ? String(n).padStart(2, "0") : "·"}</span>
<div><h3>${esc(x.name)}</h3><div class="where">${locLine}${x.estd ? ` · Estd. ${x.estd}` : ""}</div>
<div class="tags">${examTags}${modeTag}${gender}${price}${status}</div></div>
<div class="side">${scoreLine(x)}<span class="go">View profile →</span></div>
</a>`;
}

/* ---------- pages ---------- */
function searchBox(chips) {
  return `<div class="searchbox-wrap fadein" style="--d:450ms" role="search">
<div class="searchbox">
${ICON_SM.search}
<label class="sr-only" for="site-search">Search institutes, cities or guides</label>
<input type="search" id="site-search" name="q" placeholder="Search institutes, cities or guides" autocomplete="off">
<button class="btn" type="button" id="site-search-btn">Search</button>
</div>
<div id="site-search-results" class="search-results" hidden></div>
</div>
${chips ? `<div class="chips fadein" style="--d:550ms">${chips}</div>` : ""}`;
}

function topRatedList(list) {
  return list.map(x => {
    const cityL = x.city === "online" ? "Online" : cityLabel(x.city);
    const exams = x.exams.filter(e => e !== "schooling").slice(0, 2).map(examLabel).join(", ");
    return { x, cityL, exams };
  });
}

function homePage() {
  const examSubs = { ias: "Civil services & state PCS", jee: "JEE Main & Advanced", neet: "Medical entrance", cat: "MBA · classroom & online", ssc: "CGL, CHSL & more", clat: "CLAT & AILET", nda: "Defence entrance", bank: "IBPS, SBI & RBI", cuet: "Central universities" };
  const examCells = ["ias", "jee", "neet", "cat", "ssc", "clat", "nda", "bank", "cuet"]
    .map((e) => `<a class="cell fade-up" href="coaching-${bestCityForExam(e)}.html?exam=${e}"><span><small>${examSubs[e]}</small><b>${examLabel(e)}</b></span><span class="arw" aria-hidden="true">→</span></a>`).join("");
  const cityCounts = COACHING_CITIES.map(c => ({ c, n: byCity("coaching", c).length }));
  const sortedCityCounts = [...cityCounts].sort((a, b) => b.n - a.n);
  const topCities = sortedCityCounts.slice(0, 12).map(({ c, n }) => `<a class="city" href="coaching-${c}.html"><b>${cityLabel(c)}</b><span>${n} listed</span></a>`).join("");
  const moreCities = sortedCityCounts.slice(12).map(({ c }) => `<a href="coaching-${c}.html">${cityLabel(c)}</a>`).join(" · ");
  const topRated = [...byType("coaching")].sort((a, b) => (b.rating || 0) * Math.log((b.ratingCount || 0) + 1) - (a.rating || 0) * Math.log((a.ratingCount || 0) + 1)).slice(0, 6);
  const rows = topRatedList(topRated).map(({ x, cityL, exams }, i) => `<a class="trow fade-up" href="institute-${x.slug}.html"><span class="n">${String(i + 1).padStart(2, "0")}</span><span class="name">${esc(x.name)}${x.verified ? ` <span class="verified-tag">Verified</span>` : ""}<span class="m-meta">${esc(cityL)} · ${esc(exams)} · ${x.ratingCount} on ${ratingSrc(x)}</span></span><span class="meta">${esc(cityL)}</span><span class="meta">${esc(exams)}</span><span class="score"><span class="pill">★ ${x.rating.toFixed(1)}</span><span class="src">${x.ratingCount} on ${ratingSrc(x)}</span></span></a>`).join("");
  /* "Top rated this month": curated, not algorithmic — hand-picked slugs */
  const MINI_SLUGS = ["rodha", "iproledge-academy-bengaluru", "sbtechmath-academy", "navjeevan-neet-academy-sikar"];
  const minis = MINI_SLUGS.map(s => L.find(x => x.slug === s)).filter(Boolean).map((x, i) => `<a class="fade-up" href="institute-${x.slug}.html"><span>#${i + 1} · ${x.city === "online" ? "Online, pan-India" : esc(x.locality)}${x.estd ? ` · since ${x.estd}` : ""}</span><b>${esc(x.name)}</b><span>View profile →</span></a>`).join("");
  const chipPairs = [["jee", "kota", "JEE in Kota"], ["neet", "sikar", "NEET in Sikar"], ["ias", "delhi", "UPSC in Delhi"], ["ca", "bengaluru", "CA in Bengaluru"]]
    .filter(([, c]) => COACHING_CITIES.includes(c))
    .map(([e, c, t]) => `<a href="coaching-${c}.html?exam=${e}">${t}</a>`).join("");
  const totalRatings = L.reduce((s, x) => s + (x.ratingCount || 0), 0);
  const ticker = ["IAS / PCS", "IIT JEE", "NEET", "CAT / MBA", "SSC", "CLAT / Law", "NDA", "Banking", "CUET", "CA"].map(t => `<span>${t}</span><em>◆</em>`).join("");
  return head(`${B.name} — Find the Best Coaching Institutes in India`,
    `Compare ${stats.coaching} coaching institutes across ${COACHING_CITIES.length} cities and online. Labelled ratings, honest details, free for students.`) +
    header("index.html") + `
<main id="main">
<section class="hero">
${edgeArt([
  { icon: "cap", side: "l", top: "16%", size: 124, color: YELLOW, sw: 1.4, r: -8 },
  { icon: "pencil", side: "l", top: "62%", size: 92, ml: 40, sw: 1.6, r: 12, fd: -2 },
  { icon: "book", side: "r", top: "14%", size: 132, sw: 1.4, r: 6, fd: -1 },
  { icon: "atom", side: "r", top: "60%", size: 104, mr: 36, color: YELLOW, sw: 1.3, fd: -3 }
], { hero: true })}
<div class="container"><div class="hero-inner">
${iconRow([["cap", YELLOW, -8, 0], ["book", LAV, 0, -1], ["pencil", LAV, 12, -2]])}
<div class="badge-line fadein" style="--d:60ms"><i aria-hidden="true"></i>Verified listings · Free for students</div>
<h1>${hw("Choose where you study")} <span class="hw y" style="--i:4">with</span> <span class="hw y" style="--i:5">certainty,</span> <span class="hw" style="--i:6">not</span> <span class="hw" style="--i:7">guesswork</span></h1>
<p class="hero-sub fadein" style="--d:350ms">${esc(B.tagline)}</p>
${searchBox(chipPairs)}
</div></div>
<a href="#stats" class="scroll-cue" aria-label="Scroll to the next section">${chev}</a>
</section>

<section class="stats" id="stats" aria-label="Site numbers">
<div class="container">
<div class="stat fade-up"><strong data-count="${stats.listings}">${stats.listings}</strong><span>listings live</span></div>
<div class="stat fade-up"><strong data-count="${COACHING_CITIES.length}">${COACHING_CITIES.length}</strong><span>cities &amp; online</span></div>
<div class="stat fade-up"><strong data-count="${totalRatings}" data-suffix="+">${totalRatings.toLocaleString("en-IN")}+</strong><span>student ratings tracked</span></div>
<div class="stat fade-up"><strong>₹0</strong><span>for students, always</span></div>
</div>
</section>
<div class="ticker-band" aria-hidden="true"><div class="ticker">${ticker}${ticker}</div></div>

${minis ? `<section class="band-blue" aria-label="Top rated this month">
<div class="container" style="padding-block:44px 52px">
<div class="eyebrow" style="color:var(--lav)">Top rated this month</div>
<div class="compare">${minis}</div>
</div>
</section>` : ""}

<section class="band-yellow" style="position:relative;overflow:hidden" id="exams">
${edgeArt([
  { icon: "compass", side: "l", top: "96px", size: 112, color: OLIVE_INK, r: -10, drift: true, amp: -90 },
  { icon: "ruler", side: "r", top: "110px", size: 124, color: OLIVE_INK, fd: -2, drift: true, amp: -90 }
])}
<div class="container section" style="position:relative">
<div style="text-align:center">
${iconRow([["compass", OLIVE_INK, -10, 0], ["ruler", OLIVE_INK, 0, -2]], true)}
<div class="eyebrow" style="color:var(--olive-ink)">Exam categories</div>
<h2 class="big-title reveal" style="max-width:780px;margin:0 auto">${rv("What are you preparing for?", 3, "t")}</h2>
</div>
<div class="exam-grid" style="margin-top:56px">${examCells}</div>
<p style="margin-top:26px;text-align:center"><a class="link-arrow" href="coaching.html">All categories →</a></p>
</div>
</section>

<section class="band-paper">
<div class="container section">
<div class="sec-head" style="margin-bottom:0">
<div><div class="eyebrow">Start here</div><h2 class="sec-title reveal" style="max-width:640px">${rv("Online or offline: pick your path")}</h2></div>
<div class="tabs" role="tablist" aria-label="Coaching mode">
<button class="tab" role="tab" id="tab-online" aria-selected="true" aria-controls="panel-online">Online · ${ONLINE_COACHING.length}</button>
<button class="tab" role="tab" id="tab-offline" aria-selected="false" aria-controls="panel-offline" tabindex="-1">Offline · ${OFFLINE_COACHING.length}</button>
</div>
</div>
<div class="panel" id="panel-online" role="tabpanel" aria-labelledby="tab-online">
<div class="art cut" aria-hidden="true">${svgIcon("laptop", { color: YELLOW, sw: 1.2, draw: true })}</div>
<div class="copy"><div class="num">${ONLINE_COACHING.length}</div><div class="lbl">online &amp; hybrid programs</div>
<p>Live and self-paced programs from online platforms and hybrid institutes, joinable from anywhere in India.</p>
<a class="btn btn-primary" href="coaching-online.html">Explore online coaching ${arw}</a></div>
</div>
<div class="panel" id="panel-offline" role="tabpanel" aria-labelledby="tab-offline" hidden>
<div class="art cut" aria-hidden="true">${svgIcon("pin", { color: YELLOW, sw: 1.2, draw: true })}</div>
<div class="copy"><div class="num">${OFFLINE_COACHING.length}</div><div class="lbl">classroom institutes in ${COACHING_CITIES.length} cities</div>
<p>In-person institutes with physical batches. Visit before you join and compare what's near you.</p>
<a class="btn btn-primary" href="coaching.html">Browse by city ${arw}</a></div>
</div>
</div>
</section>

<section class="band-blue" style="position:relative;overflow:hidden">
${edgeArt([{ icon: "trophy", side: "r", top: "96px", size: 150, color: YELLOW, sw: 1.3, r: 6, drift: true, amp: -80 }])}
<div class="container section" style="position:relative">
<div class="eyebrow">Highest-rated institutes</div>
<h2 class="big-title reveal" style="max-width:760px">${rv("Ranked by students, not budgets.", 2)}</h2>
<p class="section-sub">Ratings come from students on public review sites like Justdial, and each one is labelled with its source. Institutes can't buy, edit or hide them here.</p>
<div class="rank-table" style="margin-top:48px">${rows}</div>
<a class="btn" style="margin-top:36px" href="coaching.html">Browse all ${stats.coaching} institutes ${arw}</a>
</div>
</section>

<section class="band-peach">
<div class="container section trust-wrap">
<div class="intro">
<div class="eyebrow">Why students trust us</div>
<h2 class="sec-title reveal">${rv("Comparison you can actually believe", 3, "t")}</h2>
<p>Most coaching directories sell their rankings. Here, institutes never pay to rank, and anything promoted is labelled in plain sight.</p>
</div>
<div class="promises">
<div class="promise fade-up">${ICON_SM.shield}<h3>Honest listings</h3><p>Verification status is shown on every profile, so you know how much to trust it.</p></div>
<div class="promise fade-up">${ICON_SM.bubble}<h3>Labelled ratings</h3><p>Every rating shows where it comes from, and institutes can't change or remove it.</p></div>
<div class="promise fade-up">${ICON_SM.bars}<h3>No paid rankings</h3><p>The default order is our unpaid recommendation. Nobody can buy placement.</p></div>
<div class="promise fade-up">${ICON_SM.rupee}<h3>Free for students</h3><p>Comparing, enquiring and reviewing cost nothing. Ever.</p></div>
</div>
</div>
</section>

<section class="band-blue" style="position:relative;overflow:hidden">
${edgeArt([{ icon: "pin", side: "r", top: "18px", size: 76, color: YELLOW, sw: 1.6, fd: -1, drift: true, amp: -30 }])}
<div class="container section" style="position:relative">
<div class="row-head">
<div><div class="eyebrow">${COACHING_CITIES.length} cities and online</div><h2 class="big-title reveal">${rv("Browse by city", 2)}</h2></div>
<a class="link-arrow" style="color:var(--lav)" href="coaching.html">View all cities →</a>
</div>
<div class="city-grid">${topCities}</div>
${moreCities ? `<p class="more-cities">More cities: ${moreCities}</p>` : ""}
</div>
</section>

<section class="band-paper">
<div class="container section">
<div class="row-head">
<div><div class="eyebrow">From our editorial desk</div><h2 class="sec-title reveal">${rv("Guides worth your time")}</h2></div>
<a class="link-arrow" href="blog.html">All guides →</a>
</div>
<div class="post-grid">${POSTS_BY_DATE.slice(0, 3).map(postCard).join("")}</div>
</div>
</section>

<section class="cta-band">
${edgeArt([{ icon: "bulb", side: "l", top: "30%", size: 96, color: YELLOW, r: -6, drift: true, amp: -70 }, { icon: "setsq", side: "r", top: "38%", size: 96, r: 8, fd: -2, drift: true, amp: -70 }])}
<div class="container">
${iconRow([["bulb", YELLOW, -6, 0], ["setsq", LAV, 8, -2]], true)}
<h2 class="reveal">${rv("Run a coaching institute?", 2)}</h2>
<p>Get listed free and reach students actively comparing options in your city.</p>
<a class="btn" href="list-your-institute.html">List your institute free ${arw}</a>
</div>
</section>
</main>` + footer();
}

function faqBlock(faqs) {
  return faqs && faqs.length ? `<section class="band-paper"><div class="container section">
<div class="prose faq"><h2>Frequently asked questions</h2>${faqs.map(f => `<h3>${esc(f.q)}</h3><p>${esc(f.a)}</p>`).join("")}</div>
</div></section>` : "";
}
function ctaBand(h2, p, href, btn, hlFrom = -1) {
  return `<section class="cta-band">
${edgeArt([{ icon: "bulb", side: "l", top: "30%", size: 92, color: YELLOW, r: -6, drift: true, amp: -60 }, { icon: "setsq", side: "r", top: "38%", size: 92, r: 8, fd: -2, drift: true, amp: -60 }])}
<div class="container">
<h2 class="reveal">${rv(h2, hlFrom)}</h2>
<p>${p}</p>
${href ? `<a class="btn" href="${href}">${btn} ${arw}</a>` : ""}
</div>
</section>`;
}

function hubPage(type, title, sub) {
  const hubCC = (DATA.cityContent || {})[`${typePage[type]}-hub`];
  const cities = DATA.cities[typePage[type]].filter(c => !(type === "coaching" && c === "online"));
  const onlineBanner = type === "coaching" ? `<a class="path-banner fade-up" href="coaching-online.html" style="margin-bottom:40px"><span><strong>Looking for online coaching instead?</strong> Compare ${ONLINE_COACHING.length} online and hybrid programs you can join from anywhere.</span><span class="link-arrow">Explore online coaching →</span></a>` : "";
  const cityCards = cities.map(c => {
    const items = byCity(type, c);
    const top = items[0];
    return `<a class="tile fade-up" href="${typePage[type]}-${c}.html"><strong>${cityLabel(c)}</strong><span class="muted">${items.length} listed${top && top.rating ? ` · top rated ${top.rating.toFixed(1)}★` : ""}</span></a>`;
  }).join("");
  const featured = [...byType(type)].filter(x => !(type === "coaching" && x.city === "online")).sort((a, b) => (b.rating || 0) * Math.log((b.ratingCount || 0) + 1) - (a.rating || 0) * Math.log((a.ratingCount || 0) + 1)).slice(0, 6).map(card).join("");
  const words = title.split(" ");
  return head(`${title} — ${B.name}`, sub) + header(`${typePage[type]}.html`) + `
<main id="main">
${pageHero({ crumbs: [["index.html", "Home"], ["", typePlural[type]]], badge: `${cities.length} ${cities.length === 1 ? "listing page" : "cities"} · ${byType(type).length} listed`, h1: hw(title, words.length - 1), sub: esc(sub), extra: searchBox(""), art: HERO_ART.a })}
<section class="band-paper">
<div class="container section">
${onlineBanner}
<div class="row-head"><h2 class="sec-title reveal">${rv(cities.length > 1 ? "Browse by city" : "Browse listings")}</h2></div>
<div class="tile-grid">${cityCards}</div>
<div class="row-head" style="margin-top:72px"><h2 class="sec-title reveal">${rv("Highest rated")}</h2></div>
<div class="results">${featured}</div>
</div>
</section>
${hubCC && hubCC.faqs ? faqBlock(hubCC.faqs) + `
<script type="application/ld+json">${JSON.stringify({ "@context": "https://schema.org", "@type": "FAQPage", "mainEntity": hubCC.faqs.map(f => ({ "@type": "Question", "name": f.q, "acceptedAnswer": { "@type": "Answer", "text": f.a } })) })}</script>` : ""}
${ctaBand(`Own a ${typeLabel[type].toLowerCase()}?`, "List it free and reach students in your city.", "list-your-institute.html", "Get listed free")}
</main>` + footer();
}

/* shared layout for city listing pages and the online coaching page */
function listingLayout({ type, h1, h1Hl, crumbs, badge, sub, intro, items, examOptions, modeOptions, faqs, ldName, ctaH2, ctaP, art, otherCities }) {
  const examChips = examOptions.length ? `<div class="fgroup"><label class="fsel-label" for="examsel">Exam</label><select id="examsel" class="fsel"><option value="">All exams</option>${examOptions.map(e => `<option value="${e}">${examLabel(e)}</option>`).join("")}</select></div>` : "";
  const modeChips = modeOptions.length > 1
    ? `<div class="fgroup"><span class="fsel-label" id="mode-label">Mode</span><select id="modesel" class="sr-only" tabindex="-1" aria-hidden="true"><option value="">All modes</option>${modeOptions.map(m => `<option value="${m}">${modeLabel[m]}</option>`).join("")}</select>
<div class="mode-toggle" id="modetoggle" role="group" aria-labelledby="mode-label">
<button type="button" class="mode-btn" data-mode="">All</button>
${modeOptions.map(m => `<button type="button" class="mode-btn" data-mode="${m}">${modeLabel[m]}</button>`).join("")}
</div></div>` : "";
  const local = items.filter(x => x.mode !== "online").length;
  const online = items.length - local;
  const rated = items.filter(x => x.rating).map(x => x.rating);
  const facts = `<div class="hero-facts fadein" style="--d:500ms">
<div><strong>${items.length}</strong><span>listed</span></div>
${local && online ? `<div><strong>${local}</strong><span>classroom or hybrid</span></div><div><strong>${online}</strong><span>online options</span></div>` : ""}
${rated.length ? `<div><strong>${Math.max(...rated).toFixed(1)}</strong><span>highest rating</span></div>` : ""}
</div>`;
  const others = (otherCities || []).map(c => `<a class="city fade-up" href="coaching-${c}.html"><b>${cityLabel(c)}</b><span>${byCity("coaching", c).length} listed</span></a>`).join("");
  return `<main id="main">
${pageHero({ crumbs, badge, h1: hw(h1, h1Hl), h1Class: "listing-h1", sub, extra: (intro ? `<div class="hero-intro fadein" style="--d:450ms">${intro}</div>` : "") + facts, art })}
<div class="filters" role="region" aria-label="Filter and sort">
<div class="container">
${examChips}
${modeChips}
<label class="vcheck" for="verifiedonly"><input type="checkbox" id="verifiedonly"> Verified only</label>
<div class="sortbox"><label class="fsel-label" for="sortsel">Sort</label>
<select id="sortsel" class="fsel"><option value="rating">Recommended</option><option value="toprated">Top rated</option><option value="reviews">Most rated</option><option value="estd">Oldest first</option><option value="name">A–Z</option></select></div>
<span id="rescount" aria-live="polite"></span>
</div>
</div>
<section class="band-paper">
<div class="container section" style="padding-top:44px">
<div class="results" id="cards">${items.map(card).join("")}</div>
<div id="noresults" hidden><p style="margin-bottom:14px"><b style="color:var(--navy)">No listings match these filters.</b> Try another exam or mode, or turn off "Verified only".</p><button type="button" class="btn btn-primary btn-sm" id="clearfilters">Clear filters</button></div>
<div class="trust-strip">
<span>${ICON_SM.shield.replace('width="28" height="28"', 'width="18" height="18"')}Institutes cannot pay for placement</span>
<span>${ICON_SM.bubble.replace('width="28" height="28"', 'width="18" height="18"')}Ratings are labelled with their source (Justdial, Google and others)</span>
<span>${ICON_SM.info}Online options from other cities are marked "Online"</span>
</div>
</div>
</section>
${faqBlock(faqs)}
${others ? `<section class="band-blue"><div class="container section">
<div class="row-head"><h2 class="big-title reveal">${rv("Other cities", 1)}</h2><a class="link-arrow" style="color:var(--lav)" href="coaching.html">View all ${COACHING_CITIES.length} cities →</a></div>
<div class="city-grid">${others}</div>
</div></section>` : ""}
<script type="application/ld+json">${JSON.stringify({
    "@context": "https://schema.org", "@type": "ItemList",
    "name": ldName,
    "itemListElement": items.map((x, i) => ({ "@type": "ListItem", "position": i + 1, "name": x.name, "url": `${B.siteUrl}/institute-${x.slug}` }))
  })}</script>
${faqs ? `<script type="application/ld+json">${JSON.stringify({
    "@context": "https://schema.org", "@type": "FAQPage",
    "mainEntity": faqs.map(f => ({ "@type": "Question", "name": f.q, "acceptedAnswer": { "@type": "Answer", "text": f.a } }))
  })}</script>` : ""}
${ctaBand(ctaH2, ctaP, "", "")}
</main>`;
}

function listingPage(type, city) {
  const items = byCity(type, city);
  const cityL = cityLabel(city);
  const label = typePlural[type];
  const isOnline = city === "online";
  const cc = (DATA.cityContent || {})[`${typePage[type]}-${city}`];
  const oc = onlineCopyFor(type);
  const h1 = isOnline ? oc.h1 : `${label} in ${cityL}`;
  const subNote = isOnline
    ? oc.subNote(items.length)
    : `${items.length} listed. Ordered by our recommendation by default, which weighs ratings, track record and free content. Switch to Top rated, Most rated or Oldest anytime. Institutes cannot pay for placement.`;
  const allExams = [...new Set(items.flatMap(x => x.exams))].filter(e => e !== "schooling");
  const allModes = [...new Set(items.map(x => x.mode).filter(Boolean))];
  const modeOptions = ["offline", "hybrid", "online"].filter(m => allModes.includes(m));
  const title = isOnline ? oc.title(items.length) : `Best ${label} in ${cityL} (${items.length} listed)`;
  const otherCities = type === "coaching" && !isOnline
    ? COACHING_CITIES.filter(c => c !== city).map(c => ({ c, n: byCity("coaching", c).length })).sort((a, b) => b.n - a.n).slice(0, 8).map(o => o.c)
    : [];
  const h1Words = h1.split(" ");
  return head(`${title} — ${B.name}`,
    isOnline
      ? oc.metaDesc(items.length)
      : `Compare ${items.length} ${label.toLowerCase()} in ${cityL} with labelled ratings, exam specialisations, addresses and establishment year.`) +
    header(isOnline && type === "coaching" ? "coaching-online.html" : `${typePage[type]}.html`) +
    listingLayout({
      type, h1, h1Hl: isOnline ? h1Words.length - 1 : h1Words.length - cityL.split(" ").length,
      crumbs: [["index.html", "Home"], [`${typePage[type]}.html`, label], ["", isOnline ? "Online" : cityL]],
      badge: `${isOnline ? "Online" : cityL} · ${items.length} listed`,
      sub: esc(subNote), intro: cc && cc.intro ? cc.intro : "", items,
      examOptions: allExams, modeOptions, faqs: cc && cc.faqs, ldName: h1,
      ctaH2: `Know a great ${typeLabel[type].toLowerCase()} in ${cityL} that's missing?`,
      ctaP: `<a href="list-your-institute.html">Tell us</a>, or if you run it, list it free.`,
      art: HERO_ART.a, otherCities
    }) + footer();
}

/* Dedicated cross-city page for "Online Coaching": aggregates every coaching institute
   whose own mode is online or hybrid, regardless of where it is physically based. */
function onlineCoachingPage() {
  const items = [...ONLINE_COACHING]
    .sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0) || (b.rating || 0) * (b.ratingCount || 0) - (a.rating || 0) * (a.ratingCount || 0) || (b.ratingCount || 0) - (a.ratingCount || 0));
  const oc = onlineCopyFor("coaching");
  const allExams = [...new Set(items.flatMap(x => x.exams))].filter(e => e !== "schooling");
  const modeOptions = ["hybrid", "online"].filter(m => items.some(x => x.mode === m));
  return head(`${oc.title(items.length)} — ${B.name}`, oc.metaDesc(items.length)) +
    header("coaching-online.html") +
    listingLayout({
      type: "coaching", h1: oc.h1, h1Hl: 0,
      crumbs: [["index.html", "Home"], ["coaching.html", "Coaching"], ["", "Online"]],
      badge: `Pan-India · ${items.length} compared`, sub: esc(oc.subNote(items.length)), intro: "", items,
      examOptions: allExams, modeOptions, faqs: null, ldName: oc.h1,
      ctaH2: "Run an online or hybrid coaching program?",
      ctaP: `<a href="list-your-institute.html">List it free</a> and reach students comparing online options.`,
      art: HERO_ART.f, otherCities: []
    }) + footer();
}

function detailPage(x) {
  const cityL = cityLabel(x.city);
  const exams = x.exams.filter(e => e !== "schooling");
  const mapsQ = encodeURIComponent(`${x.name}, ${x.address}`);
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${mapsQ}`;
  const highlights = (x.highlights || []).map(h => `<li><div>${esc(h)}</div></li>`).join("");
  const listHref = x.city === "online" ? `${typePage[x.type]}.html` : `${typePage[x.type]}-${x.city}.html`;
  const others = byCity(x.type, x.city).filter(o => o.slug !== x.slug).slice(0, 3);
  const src = ratingSrc(x);
  const checked = new Date().toLocaleString("en-IN", { month: "long", year: "numeric" });
  const genderTag = x.gender ? `<span class="tag">${x.gender === "Both" ? "Boys & Girls" : x.gender + " only"}</span>` : "";
  const ratingBoxes = [
    x.rating && x.ratingCount ? `<div class="rating-box fadein" style="--d:250ms"><div class="big">${x.rating.toFixed(1)}</div><div class="stars" aria-hidden="true">${"★".repeat(Math.round(x.rating))}</div><p><b>${plural(x.ratingCount, "rating")} on ${src}</b>. Shown as listed there; not collected by ${esc(B.name)}.</p></div>` : "",
    x.googleRating ? `<div class="rating-box fadein" style="--d:350ms"><div class="big">${x.googleRating.toFixed(1)}</div><div class="stars" aria-hidden="true">${"★".repeat(Math.round(x.googleRating))}</div><p><b>${plural(x.googleReviewCount, "review")} on Google</b>, checked ${checked}.</p></div>` : ""
  ].filter(Boolean).join("");
  const glance = [
    ["Exams", exams.length ? exams.map(examLabel).join(", ") : ""],
    ["Mode", modeLabel[x.mode] || (x.city === "online" ? "Online" : "Classroom")],
    [x.city === "online" ? "Availability" : "Locality", x.city === "online" ? onlineCopyFor(x.type).availability : `${x.locality}, ${cityL}`],
    ["Founded", x.estd ? String(x.estd) : ""],
    [x.priceRange ? "Room plans" : "Fees", x.priceRange || ""],
    ["Batch timings", ""]
  ].map(([k, v], i) => `<div><dt>${k}</dt><dd${v ? "" : ' class="na"'}>${v ? esc(v) : (k === "Batch timings" ? "Ask the institute" : k === "Fees" ? "Not published" : "Not listed")}</dd></div>`).join("");
  const formHidden = (subject) => `<input type="hidden" name="_subject" value="${subject}">
<input type="hidden" name="_captcha" value="false">
<input type="hidden" name="_template" value="table">
<input type="hidden" name="_next" value="${B.siteUrl}/thanks">
<input type="text" name="_honey" style="display:none" tabindex="-1" autocomplete="off" aria-hidden="true">
<input type="hidden" name="institute" value="${esc(x.name)} (${cityL})">`;
  return head(`${x.name} — ${x.city === "online" ? (x.onlineCategory || onlineCopyFor(x.type).h1) : `${typeLabel[x.type]} in ${cityL}`} | ${B.name}`,
    `${x.name}, ${x.locality}, ${cityL}.${x.estd ? ` Established ${x.estd}.` : ""}${x.rating ? ` Rated ${x.rating.toFixed(1)}/5 from ${x.ratingCount} ratings on ${src}.` : ""} Address, exams offered and enquiry details.`) +
    header(`${typePage[x.type]}.html`) + `
<main id="main">
<section class="page-hero on-blue">
${edgeArt(HERO_ART.b.slice(0, 1), { hero: true })}
<div class="container">
<nav class="crumbs fadein" style="--d:0ms" aria-label="Breadcrumb"><a href="index.html">Home</a><span aria-hidden="true">/</span><a href="${typePage[x.type]}.html">${typePlural[x.type]}</a><span aria-hidden="true">/</span><a href="${listHref}">${x.city === "online" ? "Online Platforms" : cityL}</a><span aria-hidden="true">/</span><span aria-current="page">${esc(x.name)}</span></nav>
<div class="profile-head">
<div class="who">
<div class="tags fadein" style="--d:60ms">${exams.slice(0, 6).map(e => `<span class="tag">${examLabel(e)}</span>`).join("")}${x.mode ? `<span class="tag">${modeLabel[x.mode]}</span>` : ""}${genderTag}</div>
<h1>${hw(x.name, x.name.split(" ").length > 1 ? x.name.split(" ").length - 1 : -1)}</h1>
<div class="addr fadein" style="--d:300ms">${ICON_SM.pin}<span>${esc(x.address)}</span></div>
${x.verified
  ? `<div class="status ok fadein" style="--d:400ms">${ICON_SM.check}<span><b>Verified listing.</b> ${esc(x.name)} has confirmed these details with us.</span></div>`
  : `<div class="status fadein" style="--d:400ms">${ICON_SM.info}<span><b>Details from public sources.</b> This institute hasn't confirmed its listing with us yet, so it doesn't carry a Verified badge.</span></div>`}
<div class="hero-acts fadein" style="--d:500ms">
<a class="btn" href="#callback">Request a callback ${arw}</a>
${x.website ? `<a class="btn btn-ghost" href="${x.website}" rel="noopener nofollow" target="_blank">Official website</a>` : x.city !== "online" ? `<a class="btn btn-ghost" href="${mapsUrl}" rel="noopener" target="_blank">Open in Google Maps</a>` : ""}
</div>
</div>
${ratingBoxes ? `<div class="rating-stack">${ratingBoxes}</div>` : `<div class="rating-box fadein" style="--d:250ms"><p style="margin:0"><b>No ratings yet.</b> Studied here? Your review would help the next student.</p></div>`}
</div>
</div>
</section>

<section class="band-paper">
<div class="container section">
<div class="two-col">
<div class="detail-main">
<div class="block fade-up"><h2>About ${esc(x.name)}</h2><p>${describe(x)}</p></div>
<div class="block fade-up"><h2>At a glance</h2><dl class="glance">${glance}</dl></div>
${highlights ? `<div class="block fade-up"><h2>Highlights</h2><ul class="hl-list">${highlights}</ul></div>` : ""}
${x.ecosystem ? `<div class="block fade-up"><h2>The ${esc(x.name)} ecosystem</h2><ul class="hl-list">${x.ecosystem.map(p => `<li><div><a href="${p.url}" rel="noopener"><strong>${esc(p.name)}</strong></a>: ${esc(p.desc)}${p.guideSlug ? ` <a href="${p.guideSlug}.html">Read our full guide →</a>` : ""}</div></li>`).join("")}</ul></div>` : ""}
<div class="block fade-up"><h2>Fees &amp; batches</h2>
<p>We don't publish fee tables unless the institute has confirmed them, because outdated fees mislead more than they help. Request a callback for current fees, batch timings and any scholarship tests.</p>
<div class="note">Before enrolling anywhere: sit in one ordinary class of the batch you'd actually join, and get the all-in fee, with material and test series included, in writing.</div></div>
<div class="block fade-up" id="reviews"><h2>Ratings &amp; reviews</h2>
${x.rating && x.ratingCount ? `<div class="agg"><div class="big">${x.rating.toFixed(1)}</div><p><b style="color:var(--navy)">${plural(x.ratingCount, "rating")} on ${src}.</b> Shown as listed on ${src}. These ratings were not collected by ${esc(B.name)}.</p></div>` : ""}
${x.googleRating ? `<div class="agg google"><div class="big">${x.googleRating.toFixed(1)}</div><p><b style="color:var(--navy)">${plural(x.googleReviewCount, "review")} on Google</b>, checked ${checked}.${x.city !== "online" ? ` <a href="${mapsUrl}" rel="noopener" target="_blank">View on Google Maps</a>` : ""}</p></div>` : ""}
<p class="muted" style="font-size:15px">No students have reviewed ${esc(x.name)} on ${esc(B.name)} yet. Reviews sent here are checked before they're published, and institutes can't remove them.</p>
${BRAND_REVIEWS.some(r => r.slug === x.slug) ? `<div class="note">Read our full, in-depth review of ${esc(x.name)}: verdict, pricing and alumni outcomes. <a href="review-${x.slug}.html">Read the review →</a></div>` : ""}
<div class="card-box" style="margin-top:20px">
<h3>Share your experience</h3>
<p class="sub">Studied here? Rate it to help the next student decide.</p>
<form class="enq-form review-form" action="https://formsubmit.co/${B.email}" method="POST">
${formHidden(`New review — ${esc(x.name)} (${cityL})`)}
<fieldset class="star-input">
<legend>Your rating</legend>
<input type="radio" id="r5-${x.slug}" name="rating" value="5"><label for="r5-${x.slug}" title="5 stars">★</label>
<input type="radio" id="r4-${x.slug}" name="rating" value="4"><label for="r4-${x.slug}" title="4 stars">★</label>
<input type="radio" id="r3-${x.slug}" name="rating" value="3"><label for="r3-${x.slug}" title="3 stars">★</label>
<input type="radio" id="r2-${x.slug}" name="rating" value="2"><label for="r2-${x.slug}" title="2 stars">★</label>
<input type="radio" id="r1-${x.slug}" name="rating" value="1" required><label for="r1-${x.slug}" title="1 star">★</label>
</fieldset>
<label>Your name<input name="name" required autocomplete="name" placeholder="Full name"></label>
<label>Your review<textarea name="review" required rows="4" placeholder="Faculty, batch size, results, fees: anything future students should know"></textarea></label>
<button class="btn btn-primary" type="submit">Submit review</button>
</form>
</div>
</div>
<p class="muted" style="font-size:14px;margin-top:22px">See something outdated? <a href="contact.html" style="color:var(--blue);text-decoration:underline">Report a correction</a>. Corrections usually go live within 48 hours.</p>
<script type="application/ld+json">${JSON.stringify(Object.assign({
  "@context": "https://schema.org", "@type": "EducationalOrganization",
  "name": x.name, "url": `${B.siteUrl}/institute-${x.slug}`,
  "address": { "@type": "PostalAddress", "streetAddress": x.address, "addressLocality": x.city === "online" ? "Online" : cityL, "addressCountry": "IN" }
}, x.estd ? { "foundingDate": String(x.estd) } : {}, x.website ? { "sameAs": x.website } : {}))}</script>
<script type="application/ld+json">${JSON.stringify({ "@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": [
  { "@type": "ListItem", "position": 1, "name": "Home", "item": `${B.siteUrl}/` },
  { "@type": "ListItem", "position": 2, "name": typePlural[x.type], "item": `${B.siteUrl}/${typePage[x.type]}` },
  { "@type": "ListItem", "position": 3, "name": x.city === "online" ? "Online Platforms" : cityL, "item": `${B.siteUrl}/${listHref.replace(/\.html$/, "")}` },
  { "@type": "ListItem", "position": 4, "name": x.name, "item": `${B.siteUrl}/institute-${x.slug}` }] })}</script>
</div>
<aside class="detail-side" id="callback" style="scroll-margin-top:100px">
<div class="side-card fade-up">
<h3>Talk to this institute</h3>
<p class="muted">Free callback from our counselling team about fees, batches and scholarship tests. No spam, ever.</p>
<form class="enq-form" action="https://formsubmit.co/${B.email}" method="POST">
${formHidden(`New enquiry — ${esc(x.name)} (${cityL})`)}
<label>Your name<input name="name" required autocomplete="name" placeholder="Full name"></label>
<label>Mobile<input name="phone" type="tel" required pattern="[0-9+ -]{10,15}" autocomplete="tel" inputmode="tel" placeholder="+91"></label>
<button class="btn btn-primary" type="submit">Request a callback</button>
<p class="form-note">Free for students. See our <a href="privacy.html">Privacy Policy</a>.</p>
</form>
</div>
<div class="side-actions fade-up">
${x.website ? `<a class="action" href="${x.website}" rel="noopener nofollow" target="_blank"><span class="ic" aria-hidden="true">↗</span> Official website <span class="arr" aria-hidden="true">→</span></a>` : ""}
${x.city !== "online" ? `<a class="action" href="${mapsUrl}" rel="noopener" target="_blank"><span class="ic" aria-hidden="true">◎</span> Open in Google Maps <span class="arr" aria-hidden="true">→</span></a>` : ""}
<a class="action" href="${listHref}"><span class="ic" aria-hidden="true">≡</span> All ${x.city === "online" ? "online platforms" : `institutes in ${cityL}`} <span class="arr" aria-hidden="true">→</span></a>
</div>
</aside>
</div>
</div>
</section>
${others.length ? `<section class="band-blue"><div class="container section">
<div class="eyebrow">Students also compared</div>
<h2 class="big-title reveal" style="margin-bottom:36px">${rv(x.city === "online" ? "Other online platforms" : `Other options in ${cityL}`, x.city === "online" ? 1 : 3)}</h2>
<div class="compare">${others.map(o => `<a class="fade-up" href="institute-${o.slug}.html"><span>${o.city === "online" ? "Online" : esc(o.locality)} · ${esc(o.exams.filter(e => e !== "schooling").slice(0, 2).map(examLabel).join(", "))}</span><b>${esc(o.name)}</b><span>${o.rating ? `<span class="pill" style="font-size:13px">★ ${o.rating.toFixed(1)}</span> ${o.ratingCount} on ${ratingSrc(o)}` : o.googleRating ? `<span class="pill" style="font-size:13px">★ ${o.googleRating.toFixed(1)}</span> ${o.googleReviewCount} on Google` : "No ratings yet"}</span></a>`).join("")}</div>
<a class="btn" style="margin-top:32px" href="${listHref}">All ${x.city === "online" ? "online platforms" : `institutes in ${cityL}`} ${arw}</a>
</div></section>` : ""}
</main>` + footer();
}

function simplePage(file, title, desc, bodyHtml, active) {
  const body = /<main[\s>]/.test(bodyHtml) ? bodyHtml : `<main id="main">${bodyHtml}</main>`;
  return head(`${title} | ${B.name}`, desc) + header(active || "") + body + footer();
}

/* ---------- static page bodies ---------- */
const formBase = (subject) => `<input type="hidden" name="_subject" value="${subject}">
<input type="hidden" name="_captcha" value="false">
<input type="hidden" name="_template" value="table">
<input type="hidden" name="_next" value="${B.siteUrl}/thanks">
<input type="text" name="_honey" style="display:none" tabindex="-1" autocomplete="off" aria-hidden="true">`;

const aboutBody = `<main id="main">
${pageHero({ crumbs: [["index.html", "Home"], ["", "About"]], badge: `About ${B.name}`, h1: hw(`About ${B.name}`, 1), sub: "We help students and parents compare coaching institutes, honestly.", art: HERO_ART.d })}
<section class="stats" aria-label="Site numbers"><div class="container">
<div class="stat fade-up"><strong data-count="${stats.listings}">${stats.listings}</strong><span>listings live</span></div>
<div class="stat fade-up"><strong data-count="${COACHING_CITIES.length}">${COACHING_CITIES.length}</strong><span>cities &amp; online</span></div>
<div class="stat fade-up"><strong data-count="${POSTS.length}">${POSTS.length}</strong><span>guides published</span></div>
<div class="stat fade-up"><strong>₹0</strong><span>for students, always</span></div>
</div></section>
<section class="band-paper"><div class="container section">
<div class="split">
<div><div class="eyebrow">Why we exist</div><h2 class="sec-title reveal">${rv("Checkable facts, in one place")}</h2></div>
<div class="prose fade-up"><p>Choosing a coaching institute is one of the biggest decisions in a student's life, and most of the information out there is either an advertisement or a guess.</p><p>${B.name} exists to put verified, comparable facts in one place: who teaches what, since when, where exactly, and what students say about it.</p></div>
</div>
<div style="margin-top:72px">
<div class="eyebrow">How we work</div>
<h2 class="sec-title reveal">${rv("Every listing tells you how far to trust it")}</h2>
<div class="labels">
<div class="label-card fade-up"><span class="tag green">✓ Verified</span><p>The institute has confirmed its details with us. Verified institutes get a richer profile and direct enquiries.</p></div>
<div class="label-card fade-up"><span class="tag badge-unverified">From public sources</span><p>We built the listing from public information and the institute hasn't confirmed it yet. We say so on the page.</p></div>
<div class="label-card fade-up"><span class="tag">★ Rating · source named</span><p>Ratings come from public review sites such as Justdial and Google, and each one names its source. Institutes can't buy, edit or hide them here.</p></div>
</div>
</div>
</div></section>
<section class="band-peach"><div class="container section trust-wrap">
<div class="intro"><div class="eyebrow">Our principles</div><h2 class="sec-title reveal">${rv("What we won't do", 2, "t")}</h2><p>These rules apply to every page on the site.</p></div>
<ul class="principle-list">
<li class="fade-up">${ICON_SM.rupee}<div><h3>We never charge students</h3><p>Comparing, enquiring and reviewing are free.</p></div></li>
<li class="fade-up">${ICON_SM.bars}<div><h3>Rankings aren't for sale</h3><p>We clearly separate any promoted placement from organic rankings.</p></div></li>
<li class="fade-up">${ICON_SM.bubble}<div><h3>Ratings stay unedited</h3><p>Institutes can't buy, change or hide ratings or reviews.</p></div></li>
<li class="fade-up">${ICON_SM.shield}<div><h3>We verify where we can</h3><p>Listing data is verified with institutes where possible, and labelled when it isn't.</p></div></li>
</ul>
</div></section>
${ctaBand("For institutes", "Listing is free. Verified institutes get a badge, a richer profile and direct enquiries from students in their city.", "list-your-institute.html", "List your institute", 1)}
</main>`;

const contactBody = `<main id="main">
${pageHero({ crumbs: [["index.html", "Home"], ["", "Contact"]], badge: "We read everything", h1: hw("Contact us", 1), sub: "Questions, feedback, corrections or review submissions. Write to us and a real person will read it.", art: HERO_ART.g })}
<section class="band-paper"><div class="container section">
<div class="split">
<div>
<h2 class="sec-title reveal">${rv("Reach us directly")}</h2>
<div class="labels" style="grid-template-columns:1fr">
<div class="label-card fade-up"><span class="tag">Students &amp; parents</span><div class="mail"><code>${B.email}</code><button class="copy-btn" type="button" data-copy="${B.email}">Copy</button></div></div>
<div class="label-card fade-up"><span class="tag">Institutes &amp; business</span><div class="mail"><code>${B.email}</code><button class="copy-btn" type="button" data-copy="${B.email}">Copy</button></div></div>
</div>
<div class="note fade-up" style="margin-top:22px"><b>Corrections</b><br>Spotted outdated information on a listing? Tell us the page and what's wrong. Corrections are our top priority and are usually live within 48 hours.</div>
</div>
<div class="side-card fade-up">
<h3>Send a message</h3>
<p class="muted">We'll reply on the number you give us.</p>
<form class="enq-form" action="https://formsubmit.co/${B.email}" method="POST">
${formBase("New enquiry — Online Coaching 4u contact form")}
<label>Your name<input name="name" required autocomplete="name"></label>
<label>Mobile<input name="phone" type="tel" required pattern="[0-9+ -]{10,15}" autocomplete="tel" inputmode="tel" placeholder="+91"></label>
<label>Message<textarea name="msg" rows="4" required placeholder="For a correction, include the page link and what needs fixing."></textarea></label>
<button class="btn btn-primary" type="submit">Send message</button>
</form>
</div>
</div>
</div></section>
${ctaBand("Looking for coaching?", `Compare ${stats.coaching} institutes across ${COACHING_CITIES.length} cities and online.`, "coaching.html", "Find coaching", 2)}
</main>`;

const listBody = `<main id="main">
${pageHero({ crumbs: [["index.html", "Home"], ["", "List your institute"]], badge: "For coaching institutes", h1: hw("List your institute — free", 4), sub: "Reach students actively comparing options in your city. No listing fee, ever.", extra: `<div class="hero-acts fadein" style="--d:500ms"><a class="btn" href="#register">Register free ${arw}</a></div>`, art: HERO_ART.e })}
<section class="band-paper"><div class="container section">
<div class="split">
<div>
<div class="eyebrow">What you get</div>
<h2 class="sec-title reveal" style="margin-bottom:30px">${rv("Everything students need to choose you")}</h2>
<div class="benefits">
<div class="benefit fade-up">${svgIcon("book", { color: "#2B399E", sw: 2.4 }).replace("<svg", '<svg width="30" height="30"')}<h3>Complete profile</h3><p>Courses, photos, results, address and direct enquiry buttons.</p></div>
<div class="benefit fade-up">${ICON_SM.shield}<h3>Verified badge</h3><p>Once we confirm your details, students see your listing is trustworthy.</p></div>
<div class="benefit fade-up">${ICON_SM.bubble}<h3>Direct leads</h3><p>Enquiries go straight to you, not through a paywall.</p></div>
</div>
<div class="note fade-up" style="margin-top:24px"><b>What we ask in return:</b> accuracy. Keep your details current and let student reviews stand. We don't remove negative reviews unless they break our guidelines.</div>
</div>
<div class="side-card fade-up" id="register" style="scroll-margin-top:100px">
<h3>Register your institute</h3>
<p class="muted">Takes under a minute. We'll contact you to confirm your details.</p>
<form class="enq-form" action="https://formsubmit.co/${B.email}" method="POST">
${formBase("New institute registration — Online Coaching 4u")}
<label>Institute name<input name="institute" required autocomplete="organization"></label>
<label>Your name<input name="name" required autocomplete="name"></label>
<label>Mobile<input name="phone" type="tel" required pattern="[0-9+ -]{10,15}" autocomplete="tel" inputmode="tel" placeholder="+91"></label>
<label>City<input name="city" required autocomplete="address-level2"></label>
<button class="btn btn-primary" type="submit">Register free</button>
<p class="form-note">By registering you agree to our <a href="terms.html">Terms</a> and <a href="privacy.html">Privacy Policy</a>.</p>
</form>
</div>
</div>
</div></section>
<section class="band-yellow"><div class="container section">
<div class="eyebrow" style="color:var(--olive-ink)">How listing works</div>
<h2 class="sec-title reveal" style="margin-bottom:32px">${rv("From sign-up to verified", 3, "t")}</h2>
<div class="steps">
<div class="step fade-up"><b>1</b><h3>Register</h3><p>Send your institute name, city and a contact number.</p></div>
<div class="step fade-up"><b>2</b><h3>Confirm your details</h3><p>We check courses, address and contact details with you.</p></div>
<div class="step fade-up"><b>3</b><h3>Get the Verified badge</h3><p>Your profile shows the badge and starts receiving enquiries.</p></div>
</div>
</div></section>
${ctaBand("Questions before listing?", "Write to us and we'll help you set up your profile.", "contact.html", "Contact us", 2)}
</main>`;

/* ---------- blog ---------- */
const CATS = [...new Set(POSTS.map(p => p.category))];
const MONTHS = { Jan: "01", Feb: "02", Mar: "03", Apr: "04", May: "05", Jun: "06", Jul: "07", Aug: "08", Sep: "09", Oct: "10", Nov: "11", Dec: "12" };
function toISODate(d) {
  const m = /^(\d{1,2}) (\w{3}) (\d{4})$/.exec(d);
  if (!m) return d;
  return `${m[3]}-${MONTHS[m[2]] || "01"}-${m[1].padStart(2, "0")}`;
}
const POSTS_BY_DATE = [...POSTS].sort((a, b) => new Date(toISODate(b.date)) - new Date(toISODate(a.date)));
function postCard(p) {
  return `<a class="post-card fade-up" href="${p.slug}.html">
<div class="thumb${p.image ? "" : " noimg"}">${p.image ? `<img src="${p.image}?v=${ASSET_V}" alt="${esc(p.imageAlt || p.title)}" loading="lazy" width="800" height="420" onerror="this.parentNode.classList.add('noimg')">` : ""}<span class="initial" aria-hidden="true">${esc(p.title[0])}</span></div>
<small>${esc(postExam(p).label)} · ${p.date}</small>
<h3>${esc(p.title)}</h3>
<p>${esc(p.excerpt)}</p>
</a>`;
}

/* ---------- blog categorisation: exam groups + content types ----------
   posts.js keeps its free-text `category`; these maps fold every variant into
   one clean exam group. A post may also set `examGroup` / `type` explicitly. */
const BLOG_EXAMS = [
  { key: "jee", label: "JEE & Engineering", cats: ["IIT JEE", "JEE / Engineering", "JEE"], exam: "jee", intro: "JEE Main and Advanced news, JoSAA/CSAB counselling updates and city-wise guides to JEE coaching institutes." },
  { key: "neet", label: "NEET & Medical", cats: ["NEET", "NEET / Medical", "NEET PG"], exam: "neet", intro: "NEET UG news, MCC counselling updates and city-wise guides to NEET coaching institutes." },
  { key: "mba", label: "CAT, IPMAT & MBA", cats: ["CAT / MBA", "MAT / MBA", "NMAT / MBA", "SNAP / MBA", "XAT / MBA", "MBA", "IPMAT", "CAT", "CMAT / MBA"], exam: "cat", intro: "CAT, XAT, NMAT, SNAP, MAT and IPMAT news, preparation strategy and honest comparisons of MBA-entrance coaching." },
  { key: "upsc", label: "UPSC & Civil Services", cats: ["IAS / UPSC", "UPSC", "State PSC"], exam: "ias", intro: "UPSC Civil Services, ESE and other UPSC exam updates, plus guides to IAS coaching institutes across India." },
  { key: "law", label: "CLAT & Law", cats: ["CLAT / Law", "SLAT / Law", "AILET / Law", "CLAT", "Judiciary"], exam: "clat", intro: "CLAT, AILET and SLAT news, syllabus and cutoff explainers, and city-wise guides to law-entrance coaching." },
  { key: "govt-exams", label: "SSC, Defence & Govt Exams", cats: ["SSC", "SSC / Govt Exams", "NDA / CDS", "Banking", "Railways", "Govt Exams"], exam: "ssc", intro: "SSC, NDA/CDS, banking and other government-exam updates, with advice on when coaching actually helps." },
  { key: "ca", label: "CA & Commerce", cats: ["CA", "CA / Commerce", "CMA", "CS"], exam: "ca", intro: "CA, CS and CMA preparation guides and comparisons of commerce coaching institutes." },
  { key: "gate", label: "GATE & Science PG", cats: ["GATE", "CSIR NET / IIT JAM / GATE Maths", "CSIR NET", "IIT JAM", "CUET PG"], exam: "gate", intro: "GATE, CSIR-NET and IIT JAM news, exam overviews and coaching comparisons." },
  { key: "ai-tools", label: "AI Tools for Education", cats: ["AI Tools", "AI Tools for Education"], exam: "", intro: "Researched comparisons of AI tools that help coaching institutes teach, test, handle admissions and talk to students and parents." },
  { key: "guidance", label: "Guidance & Certifications", cats: ["Guidance", "City Guides", "Certification", "Study Tips"], exam: "", intro: "How to choose a coaching institute, moving to a coaching city, and professional certification comparisons." }
];
const BLOG_TYPES = [
  { key: "exam-news", label: "Exam News & Updates", intro: "Dated, source-checked updates on exam dates, registrations, admit cards, results and counselling." },
  { key: "coaching-guides", label: "Coaching Guides & Comparisons", intro: "City-wise coaching institute guides and honest side-by-side comparisons to help you choose where to study." },
  { key: "prep-guides", label: "Preparation Guides", intro: "Syllabus, eligibility, cutoffs and study-strategy explainers written in plain language." }
];
const BLOG_EXAM_BY_CAT = {};
BLOG_EXAMS.forEach(g => { BLOG_EXAM_BY_CAT[g.label.toLowerCase()] = g; g.cats.forEach(c => { BLOG_EXAM_BY_CAT[c.toLowerCase()] = g; }); });
function postExam(p) {
  if (p.examGroup) { const g = BLOG_EXAMS.find(x => x.key === p.examGroup); if (g) return g; }
  const c = String(p.category || "").toLowerCase().trim();
  if (BLOG_EXAM_BY_CAT[c]) return BLOG_EXAM_BY_CAT[c];
  const first = c.split("/")[0].trim();
  const hit = BLOG_EXAMS.find(g => g.cats.some(x => x.toLowerCase().split("/")[0].trim() === first));
  return hit || BLOG_EXAMS[BLOG_EXAMS.length - 1];
}
function postType(p) {
  if (p.type) { const t = BLOG_TYPES.find(x => x.key === p.type); if (t) return t; }
  const title = p.title || "";
  if (/how to prepare|strategy|study plan|eligibility|syllabus and|cutoff|overview|exam pattern|completely free|features|mentoring sessions/i.test(title)) return BLOG_TYPES[2];
  if (/exam date|registration|admit card|result|counselling|notification|seat|schedule|opens|closes|declared|question paper/i.test(title)) return BLOG_TYPES[0];
  if (/coaching|\bvs\.?\b|compared|comparison/i.test(title)) return BLOG_TYPES[1];
  return BLOG_TYPES[0];
}
const blogExamFile = (g) => `blog-${g.key}.html`;
const blogTypeFile = (t) => `blog-${t.key}.html`;
function blogChipRow(active) {
  const exams = BLOG_EXAMS.map(g => { const n = POSTS.filter(p => postExam(p) === g).length; return n ? `<a class="blog-chip${active === g ? " active" : ""}" href="${blogExamFile(g)}">${esc(g.label)} <span>${n}</span></a>` : ""; }).join("");
  const types = BLOG_TYPES.map(t => { const n = POSTS.filter(p => postType(p) === t).length; return `<a class="blog-chip blog-chip-type${active === t ? " active" : ""}" href="${blogTypeFile(t)}">${esc(t.label)} <span>${n}</span></a>`; }).join("");
  return `<div class="blog-browse">
<div class="blog-browse-row"><span class="blog-browse-label">By exam</span><div class="blog-chips"><a class="blog-chip${!active ? " active" : ""}" href="blog.html">All <span>${POSTS.length}</span></a>${exams}</div></div>
<div class="blog-browse-row"><span class="blog-browse-label">By type</span><div class="blog-chips">${types}<a class="blog-chip blog-chip-type" href="ai-tools.html">AI Tools for Study</a></div></div>
</div>`;
}
function blogCard(p) {
  return `<div data-exams="${postExam(p).key}" data-mode="${postType(p).key}" style="display:contents">${postCard(p)}</div>`;
}
function blogIndex() {
  const lead = POSTS_BY_DATE[0];
  return `<main id="main">
${pageHero({ crumbs: [["index.html", "Home"], ["", "Guides"]], badge: "Written by our team · No sponsored content unless labelled", h1: hw("Guides & Articles", 2), sub: "Original, research-backed articles on choosing coaching, preparing for exams and student life. Pick your exam or the kind of article you need.", art: HERO_ART.b })}
<section class="band-paper"><div class="container section">
${blogChipRow(null)}
${lead ? `<a class="featured-post fade-up" href="${lead.slug}.html">
<div class="thumb${lead.image ? "" : " noimg"}">${lead.image ? `<img src="${lead.image}?v=${ASSET_V}" alt="${esc(lead.imageAlt || lead.title)}" width="800" height="420" onerror="this.parentNode.classList.add('noimg')">` : ""}<span class="initial" aria-hidden="true">${esc(lead.title[0])}</span></div>
<div><small>Latest · ${esc(postExam(lead).label)}</small><h2>${esc(lead.title)}</h2><p>${esc(lead.excerpt)}</p><p class="muted" style="font-size:14px">${lead.date} · ${lead.minutes} min read</p></div>
</a>` : ""}
<div class="filters" style="position:static;box-shadow:none;border:1px solid var(--rule);margin-bottom:28px"><div class="container" style="padding-inline:16px">
<div class="fgroup"><label class="fsel-label" for="examsel">Exam</label><select id="examsel" class="fsel"><option value="">All exams</option>${BLOG_EXAMS.map(g => `<option value="${g.key}">${esc(g.label)}</option>`).join("")}</select></div>
<div class="fgroup"><label class="fsel-label" for="modesel">Type</label><select id="modesel" class="fsel"><option value="">All types</option>${BLOG_TYPES.map(t => `<option value="${t.key}">${esc(t.label)}</option>`).join("")}</select></div>
<span id="rescount" aria-live="polite"></span>
</div></div>
<div class="post-grid" id="cards">${POSTS_BY_DATE.map(blogCard).join("")}</div>
<p id="noresults" hidden>No articles match these filters yet. Try another exam or type.</p>
</div></section>
</main>`;
}
function blogCategoryPage(item, kind) {
  const file = kind === "exam" ? blogExamFile(item) : blogTypeFile(item);
  const list = POSTS_BY_DATE.filter(p => (kind === "exam" ? postExam(p) : postType(p)) === item);
  const title = kind === "exam" ? `${item.label} Blogs: Exam News, Prep & Coaching Guides` : `${item.label} for Indian Competitive Exams`;
  const h1 = kind === "exam" ? `${item.label} Articles` : item.label;
  const desc = `${item.intro} ${list.length} articles, updated regularly by the ${B.name} team.`;
  const url = `${B.siteUrl}/${file.replace(/\.html$/, "")}`;
  const sections = kind === "exam"
    ? BLOG_TYPES.map(t => ({ t, ps: list.filter(p => postType(p) === t) })).filter(s => s.ps.length)
    : [{ t: null, ps: list }];
  const ld = [
    { "@context": "https://schema.org", "@type": "CollectionPage", name: h1, url, description: desc, publisher: { "@type": "Organization", name: B.name, url: B.siteUrl },
      mainEntity: { "@type": "ItemList", numberOfItems: list.length, itemListElement: list.slice(0, 50).map((p, i) => ({ "@type": "ListItem", position: i + 1, url: `${B.siteUrl}/${p.slug}`, name: p.title })) } },
    { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${B.siteUrl}/` },
      { "@type": "ListItem", position: 2, name: "Blogs", item: `${B.siteUrl}/blog` },
      { "@type": "ListItem", position: 3, name: item.label, item: url }] }
  ];
  const coachLink = kind === "exam" && item.exam ? `<div class="hero-acts fadein" style="--d:500ms"><a class="btn" href="coaching.html?exam=${item.exam}">Compare ${esc(item.label.split(/[ ,&]/)[0])} coaching institutes ${arw}</a></div>` : "";
  return head(`${title} | ${B.name}`, desc)
    .replace("</head>", ld.map(o => `<script type="application/ld+json">${JSON.stringify(o)}</script>`).join("\n") + "\n</head>")
    + header("blog.html") + `<main id="main">
${pageHero({ crumbs: [["index.html", "Home"], ["blog.html", "Blogs"], ["", item.label]], badge: `${kind === "exam" ? "Blogs by exam" : "Blogs by type"} · ${list.length} articles`, h1: hw(h1, h1.split(" ").length - 1), sub: esc(item.intro), extra: coachLink, art: HERO_ART.c })}
<section class="band-paper"><div class="container section">
${blogChipRow(item)}
${sections.map(s => `${s.t ? `<h2 class="blog-sec-h" id="${s.t.key}">${esc(s.t.label)} <span class="muted" style="font-size:.6em">(${s.ps.length})</span></h2>` : ""}<div class="post-grid">${s.ps.map(postCard).join("")}</div>`).join("\n")}
</div></section>
</main>` + footer();
}

/* ---------- reviews hub ---------- */
function reviewsIndex() {
  const cards = REVIEWS.map(r => {
    const x = L.find(o => o.slug === r.slug);
    if (!x) return "";
    const cityL = cityLabel(x.city);
    const mapsQ = encodeURIComponent(`${x.name}, ${x.address}`);
    const ownChip = x.ratingCount
      ? `<span class="rating-chip"><span class="star">★</span> ${x.rating.toFixed(1)} <span class="muted">${plural(x.ratingCount, "rating")} on ${ratingSrc(x)}</span></span>`
      : `<span class="rating-chip"><span class="muted">No public ratings yet</span></span>`;
    const googleChip = x.googleRating
      ? `<span class="rating-chip google"><span class="star">★</span> ${x.googleRating.toFixed(1)} <span class="muted">${x.googleReviewCount} on Google</span>${x.city !== "online" ? ` <a href="https://www.google.com/maps/search/?api=1&query=${mapsQ}" rel="noopener">Maps →</a>` : ""}</span>`
      : "";
    const reddit = r.reddit || [];
    const redditBlock = reddit.length
      ? `<div class="rhc-platform"><h4>From Reddit</h4>${reddit.map(q => `<div class="rhc-quote">“${esc(q.quote)}”<a href="${q.url}" rel="noopener nofollow">Read the full thread on ${esc(q.sub)} →</a></div>`).join("")}</div>`
      : `<div class="rhc-platform"><h4>From Reddit</h4><p class="rhc-empty">No verifiable public Reddit discussion found yet — we only publish quotes we can personally confirm and link back to.</p></div>`;
    const links = [
      x.website ? `<a href="${x.website}" rel="noopener nofollow"><span class="ic">↗</span> Website</a>` : "",
      r.youtube ? `<a href="${r.youtube}" rel="noopener nofollow"><span class="ic">▶</span> YouTube</a>` : "",
      r.instagram ? `<a href="${r.instagram}" rel="noopener nofollow"><span class="ic">◎</span> Instagram</a>` : "",
      `<a class="link-arrow" href="institute-${x.slug}.html">Full profile →</a>`
    ].filter(Boolean).join("");
    return `<article class="review-hub-card fade-up">
<div class="rhc-head">
<span class="monogram ${grad(x.name)}" aria-hidden="true">${esc(x.name[0])}</span>
<div><h2><a href="institute-${x.slug}.html">${esc(x.name)}</a></h2><div class="muted">${x.city === "online" ? "Online" : cityL}${x.estd ? ` · Est. ${x.estd}` : ""}</div></div>
</div>
<div class="rhc-ratings">${ownChip}${googleChip}</div>
${redditBlock}
<div class="rhc-links">${links}</div>
</article>`;
  }).join("");
  const brandCards = BRAND_REVIEWS.map(rv => {
    const x = reviewSubject(rv);
    if (!x) return "";
    const cityL = cityLabel(x.city);
    return `<article class="review-hub-card fade-up">
<div class="rhc-head">
<span class="monogram ${grad(x.name)}" aria-hidden="true">${esc(x.name[0])}</span>
<div><h2><a href="review-${x.slug}.html">${esc(x.name)}</a></h2><div class="muted">${x.isTool ? esc(x.toolCategory) : x.city === "online" ? "Online" : cityL} · Full editorial review</div></div>
</div>
<div class="rhc-ratings"><span class="rating-chip"><span class="star">★</span> ${rv.verdictRating.toFixed(1)} <span class="muted">our rating</span></span></div>
<div class="rhc-platform"><p class="rhc-empty" style="font-style:normal;color:var(--ink-2)">${esc(rv.verdictSummary)}</p></div>
<div class="rhc-links"><a class="link-arrow" href="review-${x.slug}.html">Read the full review →</a></div>
</article>`;
  }).join("");
  return `
<main id="main">
${pageHero({ crumbs: [["index.html", "Home"], ["", "Reviews"]], badge: "Our own research · No paid placements", h1: hw("Reviews", 0), sub: "Independent, in-depth reviews of coaching institutes, professional certifications and individual coaches, built from our own research and verified facts, not paid placements.", art: HERO_ART.h })}
<section class="band-paper"><div class="container section">
<div class="prose fade-up" style="margin-bottom:40px">
<p>Some reviews below link straight back to real, public quotes from students on Reddit and Google — nothing edited, summarised out of context, or paid for. Others are full, in-depth write-ups based on our own research into an institute, certification provider or coach, covering the same ground: credentials, offerings, results and client feedback, checked as thoroughly as we can against public information.</p>
</div>
<div class="review-hub-list">${cards}${brandCards}</div>
</div></section>
${ctaBand("Know one of these institutes, coaches or programs personally?", `Reviews here are unedited and can't be bought or removed. <a href="list-your-institute.html">Tell us what's missing</a> or use the review form on any institute's page.`, "", "")}
</main>`;
}

/* Long-form editorial review page (review-<slug>.html) for online
   skill-training platforms — a full independent write-up (verdict score,
   ratings breakdown, pricing table, testimonials, FAQ), separate from the
   short Reddit/Instagram quote cards on the /reviews hub above. Content
   lives in brand-reviews.js; x is the matching data.json listing (name,
   website, ratings, enquiry form). Only called for slugs present in both
   files — see the write loop near the bottom of this file. */
/* A brand review can cover a data.json listing (institute/certification/coach)
   or, when rv.tool is set, a software tool that has no listing (e.g. an AI
   business-phone tool reviewed for institutes). */
function reviewSubject(rv) {
  const x = L.find(o => o.slug === rv.slug);
  if (x) return x;
  if (rv.tool) return { slug: rv.slug, name: rv.tool.name, website: rv.tool.url, city: "online", isTool: true, toolGuide: rv.tool.guideSlug, toolCategory: rv.tool.category || "Software tool" };
  return null;
}
function starLine(n) {
  return `<span class="star">★</span> ${Number(n).toFixed(1)}`;
}
function brandReviewPage(rv, x) {
  const cityL = cityLabel(x.city);
  const ownChip = x.isTool ? "" : x.ratingCount
    ? `<span class="rating-chip"><span class="star">★</span> ${x.rating.toFixed(1)} <span class="muted">${plural(x.ratingCount, "rating")} on ${ratingSrc(x)}</span></span>`
    : `<span class="rating-chip"><span class="muted">No public ratings yet</span></span>`;
  const ratingsRows = rv.ratingsBreakdown.map(r => `<tr><td>${esc(r.factor)}</td><td>${starLine(r.rating)}</td><td>${esc(r.why)}</td></tr>`).join("");
  const whyChooseHtml = (rv.whyChoose || []).map(sec => {
    const list = sec.list ? `<ul>${sec.list.map(li => `<li>${esc(li)}</li>`).join("")}</ul>` : "";
    const after = sec.after ? `<p>${esc(sec.after)}</p>` : "";
    return `<p><strong>${esc(sec.title)}</strong> ${esc(sec.body)}</p>${list}${after}`;
  }).join("");
  const resultsHtml = rv.resultsSection ? `<h2>${esc(rv.resultsSection.heading)}</h2>
<p>${esc(rv.resultsSection.intro)}</p>
<ul>${rv.resultsSection.bullets.map(li => `<li>${esc(li)}</li>`).join("")}</ul>
${rv.resultsSection.tableRows ? `<p>${esc(rv.resultsSection.tableIntro)}</p>
<table><thead><tr>${rv.resultsSection.tableHeaders.map(h => `<th>${esc(h)}</th>`).join("")}</tr></thead><tbody>${rv.resultsSection.tableRows.map(row => `<tr>${row.map(c => `<td>${esc(c)}</td>`).join("")}</tr>`).join("")}</tbody></table>` : ""}
<p>${esc(rv.resultsSection.closingNote)}</p>` : "";
  const pricingRows = (rv.pricingTable || []).map(p => `<tr><td>${esc(p.program)}</td><td>${esc(p.included)}</td><td>${esc(p.investment)}</td></tr>`).join("");
  const testimonialsHtml = (rv.testimonials || []).map(t => `<div class="rhc-quote brand-quote">“${esc(t.quote)}”<span class="quote-author">— ${esc(t.author)}</span></div>`).join("");
  const faqHtml = rv.faqs.map(f => `<h3>${esc(f.q)}</h3><p>${esc(f.a)}</p>`).join("");
  const inlineBacklinks = rv.backlinks.map(b => `<a href="${b.url}" rel="noopener nofollow"><span class="ic">${b.icon || "↗"}</span> ${esc(b.label)}</a>`).join("");
  const sideBacklinks = rv.backlinks.map(b => `<a class="action" href="${b.url}" rel="noopener nofollow"><span class="ic">${b.icon || "↗"}</span> ${esc(b.label)} <span class="arr">→</span></a>`).join("");
  const faqLd = {
    "@context": "https://schema.org", "@type": "FAQPage",
    mainEntity: rv.faqs.map(f => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } }))
  };
  const reviewLd = Object.assign({
    "@context": "https://schema.org", "@type": "Review",
    itemReviewed: Object.assign(x.isTool ? { "@type": "SoftwareApplication", name: x.name, applicationCategory: "BusinessApplication", operatingSystem: "Web, Android, iOS" } : { "@type": "EducationalOrganization", name: x.name }, x.website ? { url: x.website } : {}),
    reviewRating: { "@type": "Rating", ratingValue: rv.verdictRating, bestRating: 5 },
    author: { "@type": "Organization", name: B.name },
    publisher: { "@type": "Organization", name: B.name }
  }, {});
  return head(rv.metaTitle, rv.metaDescription) + header("reviews.html") + `
<main id="main">
${pageHero({ crumbs: [["index.html", "Home"], ["reviews.html", "Reviews"], ["", x.name]], badge: x.isTool ? `${esc(x.toolCategory)} · Editorial review` : "Full editorial review", h1: rv.headline.split(/\s+/).length <= 14 ? hw(rv.headline) : esc(rv.headline), sub: esc(rv.subheadline), art: HERO_ART.h })}
<section class="container detail-body">
<div class="detail-main prose">
<div class="verdict-box">
<div class="verdict-score"><span class="verdict-num">${rv.verdictRating.toFixed(1)}</span><span class="verdict-of">/ 5</span></div>
<div><p class="verdict-label">Overall rating</p><p>${esc(rv.verdictSummary)}</p></div>
</div>
<table class="ratings-table"><thead><tr><th>Factor</th><th>Rating</th><th>Why</th></tr></thead><tbody>${ratingsRows}</tbody></table>
<div class="callout"><strong>Best for:</strong> ${esc(rv.bestFor)}</div>
<h2>What Is ${esc(x.name)}?</h2>
${rv.whatIs.map(p => `<p>${esc(p)}</p>`).join("")}
${whyChooseHtml ? `<h2>${rv.whyChooseHeading ? esc(rv.whyChooseHeading) : `Why Learners Choose ${esc(x.name)}`}</h2>${whyChooseHtml}` : ""}
${resultsHtml}
<h2>Pricing</h2>
${rv.pricingTable ? `<table><thead><tr><th>${x.isTool ? "Plan" : "Program"}</th><th>What's included</th><th>Investment</th></tr></thead><tbody>${pricingRows}</tbody></table>` : ""}
<p>${esc(rv.placementNote)}</p>
${testimonialsHtml ? `<h2>${esc(rv.testimonialsHeading || "What Alumni Are Saying")}</h2>
${testimonialsHtml}` : ""}
<p>${esc(rv.archiveNote)}</p>
<div class="rhc-links">${inlineBacklinks}</div>
<h2>FAQ</h2>
${faqHtml}
<h2>Bottom Line</h2>
<p class="dropcap">${esc(rv.bottomLine)}</p>
<div class="rhc-ratings" style="margin-top:22px">${ownChip}</div>
<script type="application/ld+json">${JSON.stringify(reviewLd)}</script>
<script type="application/ld+json">${JSON.stringify(faqLd)}</script>
</div>
<aside class="detail-side">
${x.isTool ? `<div class="side-card">
<h3>Try ${esc(x.name)}</h3>
<p class="muted">${esc(rv.tool.priceNote || "")}</p>
<div style="margin-top:16px"><a class="btn btn-gold" href="${x.website}" target="_blank" rel="noopener nofollow">Visit ${esc(x.name)} ↗</a></div>
<p class="muted" style="margin-top:12px">Opens the official website in a new tab.</p>
</div>` : `<div class="side-card">
<h3>Talk to ${esc(x.name)}</h3>
<p class="muted">Free callback via our counselling team — no spam, ever.</p>
<form class="enq-form" action="https://formsubmit.co/${B.email}" method="POST">
<input type="hidden" name="_subject" value="New enquiry — ${esc(x.name)} — via review page">
<input type="hidden" name="_captcha" value="false">
<input type="hidden" name="_template" value="table">
<input type="hidden" name="_next" value="${B.siteUrl}/thanks">
<input type="text" name="_honey" style="display:none" tabindex="-1" autocomplete="off">
<input type="hidden" name="institute" value="${esc(x.name)}">
<label>Your name<input name="name" required autocomplete="name" placeholder="Full name"></label>
<label>Mobile<input name="phone" type="tel" required pattern="[0-9+ -]{10,15}" autocomplete="tel" placeholder="+91"></label>
<button class="btn btn-gold" type="submit">Request a callback</button>
</form>
</div>`}
<div class="side-actions">
${sideBacklinks}
${x.isTool ? (x.toolGuide ? `<a class="action" href="ai-tools-${x.toolGuide}.html"><span class="ic">≡</span> ${esc(x.name)} guide for institutes <span class="arr">→</span></a>` : "") : `<a class="action" href="institute-${x.slug}.html"><span class="ic">≡</span> Full profile <span class="arr">→</span></a>`}
${(rv.relatedLinks || []).map(l => `<a class="action" href="${l.href}"><span class="ic">≡</span> ${esc(l.label)} <span class="arr">→</span></a>`).join("")}
<a class="action" href="reviews.html"><span class="ic">≡</span> All review pages <span class="arr">→</span></a>
</div>
</aside>
</section>
</main>` + footer();
}

/* ---------- AI tools vertical (/ai-tools hub + ai-tools-<slug> pages) ---------- */
const AI_AUD = {
  learners: { label: "For Learners", plural: "learners", anchor: "for-learners", h2: "Best AI tools for learners", who: "Students" },
  institutes: { label: "For Institutes", plural: "institutes", anchor: "for-institutes", h2: "Best AI tools for coaching institutes & teachers", who: "Institutes" }
};
const aiToolFile = (t) => `ai-tools-${t.slug}.html`;
const aiShort = (t) => t.shortName || t.name;
const AI_LAST_CHECKED = "27 September 2026";
const AI_LAST_CHECKED_ISO = "2026-09-27";
/* Institute tools are grouped into categories on the hub (t.group). */
const AI_GROUPS = {
  institutes: [
    { key: "teaching", title: "Teaching, content & tests", intro: "Save faculty time on lesson plans, worksheets and quizzes, and run fair online tests." },
    { key: "communication", title: "Admissions & WhatsApp communication", intro: "Answer admission enquiries and send fee, class and exam reminders on WhatsApp." },
    { key: "business-phone", title: "AI business phone & virtual numbers", intro: "One professional number for the whole institute, with AI that answers, records, summarises and follows up on every enquiry call.", guide: { href: "best-ai-business-phone-virtual-number-coaching-institutes-india", text: "Read our full comparison of AI business phone tools for institutes" } }
  ]
};
const aiChecked = (t) => t.lastChecked || AI_LAST_CHECKED;
const aiCheckedIso = (t) => t.lastCheckedIso || AI_LAST_CHECKED_ISO;
const tableWrap = (inner) => `<div class="table-scroll"><table>${inner}</table></div>`;
function aiVisitBtn(t, cls) {
  return `<a class="btn ${cls || "btn-gold"}" href="${t.url}" target="_blank" rel="noopener nofollow">Visit ${esc(aiShort(t))} ↗</a>`;
}
function aiCard(t) {
  return `<a class="ai-card fade-up" href="${aiToolFile(t)}">
<div class="card-top"><span class="badge badge-type">${AI_AUD[t.audience].label}</span><span class="chip chip-price">${esc(t.priceChip)}</span></div>
<div class="card-ident">
<span class="avatar-md ${grad(t.name)}" aria-hidden="true">${esc(t.name[0])}</span>
<div><h3>${esc(t.name)}</h3><p class="card-loc">by ${esc(t.maker)}</p></div>
</div>
<p class="ai-card-text">${esc(t.tagline)}</p>
<div class="card-foot"><span class="muted">Full guide</span><span class="card-cta">Read guide →</span></div>
</a>`;
}
function aiCompareTable(list) {
  const rows = list.map(t => {
    const best = (t.facts.find(f => f[0] === "Best for") || ["", ""])[1];
    const lang = (t.facts.find(f => f[0] === "Languages") || ["", "—"])[1];
    return `<tr><td><a href="${aiToolFile(t)}"><strong>${esc(aiShort(t))}</strong></a></td><td>${esc(best)}</td><td>${esc(t.priceChip)}</td><td>${esc(lang)}</td><td><a href="${t.url}" target="_blank" rel="noopener nofollow">Visit ↗</a></td></tr>`;
  }).join("");
  return tableWrap(`<thead><tr><th>Tool</th><th>Best for</th><th>Price</th><th>Languages</th><th>Website</th></tr></thead><tbody>${rows}</tbody>`);
}
const AI_HUB_FAQS = [
  { q: "Which AI tool is best for students in India?", a: "For most students, Google Gemini is the best free starting point: it has step-by-step Guided Learning and free full-length JEE Main mock tests. Gemini Notebook (formerly NotebookLM) is best for revising from NCERT or your own notes, PW AI Guru is best for JEE/NEET doubts in Hinglish, and Perplexity is best for UPSC current affairs with sources." },
  { q: "Are these AI tools free?", a: "Gemini, Gemini Notebook, ChatGPT and Perplexity all have useful free plans, and PW AI Guru comes at no extra cost for PW students. For institutes, Wayground, MagicSchool AI and Khanmigo for Teachers have free plans; Eklavvya and Interakt are paid, with a free demo or trial. AI business phone tools are paid: TalkEasy starts at ₹999 a month, MyOperator at ₹5,000 a month (billed yearly), and Exotel and Knowlarity offer 7-day free trials." },
  { q: "Which AI tools can coaching institutes use?", a: "Wayground for quick quizzes and practice tests, Eklavvya for proctored online exams and AI checking of answer sheets, MagicSchool AI and Khanmigo for teacher preparation (lesson plans, worksheets, assessments), Interakt for WhatsApp admission enquiries and reminders, and AI business phone tools like MyOperator, Exotel, Knowlarity, TalkEasy and Tata Tele Smartflo for answering, recording and following up on admission calls." },
  { q: "What is the best AI business phone for a coaching institute in India?", a: "For large and multi-branch institutes, MyOperator and Exotel are the most complete, with Tata Tele Smartflo for telecom-grade contact centres. For small and growing institutes, TalkEasy offers AI call answering, call summaries and a built-in CRM at ₹999 a month. Knowlarity is a mature option for missed-call campaigns and outbound calls to parents." },
  { q: "Is it safe for students to study with AI?", a: "Yes, if AI is used to understand concepts and practise rather than to copy answers. All AI tools can make mistakes, so students should verify important facts and formulas with their textbooks, teachers or official sources." },
  { q: "How did you choose these tools?", a: "We picked tools that are available in India, useful for Indian exams or Indian institutes, and clear about pricing. Each tool was researched from its official website and reputable news coverage. No company paid to be included." }
];
function aiToolsHub() {
  const learners = AI_TOOLS.filter(t => t.audience === "learners");
  const institutes = AI_TOOLS.filter(t => t.audience === "institutes");
  const url = `${B.siteUrl}/ai-tools`;
  const itemList = (list, name) => ({ "@type": "ItemList", name, itemListElement: list.map((t, i) => ({ "@type": "ListItem", position: i + 1, name: t.name, url: `${B.siteUrl}/ai-tools-${t.slug}` })) });
  const ld = [
    { "@context": "https://schema.org", "@type": "CollectionPage", name: "AI Tools for Learners & Institutes in India", url, description: "Researched guides to the best AI tools for Indian students and coaching institutes.", dateModified: AI_TOOLS.map(aiCheckedIso).sort().pop(), publisher: { "@type": "Organization", name: B.name, url: B.siteUrl }, hasPart: [itemList(learners, "AI tools for learners"), itemList(institutes, "AI tools for institutes")] },
    { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Home", item: `${B.siteUrl}/` }, { "@type": "ListItem", position: 2, name: "AI Tools", item: url }] },
    { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: AI_HUB_FAQS.map(f => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) }
  ];
  const groupBlock = (g, list) => `<div class="ai-group" id="${g.key}">
<h3 class="ai-group-h">${esc(g.title)}</h3>
<p class="section-sub">${esc(g.intro)}${g.guide ? ` <a class="link-arrow" href="${g.guide.href}.html">${esc(g.guide.text)} →</a>` : ""}</p>
<div class="card-grid" style="margin-top:22px">${list.map(aiCard).join("")}</div>
<div class="prose ai-compare"><h4>Quick comparison</h4>${aiCompareTable(list)}</div>
</div>`;
  const section = (aud, list, intro) => {
    const groups = AI_GROUPS[aud];
    const inner = groups
      ? groups.map(g => { const gl = list.filter(t => (t.group || groups[0].key) === g.key); return gl.length ? groupBlock(g, gl) : ""; }).join("")
      : `<div class="card-grid" style="margin-top:22px">${list.map(aiCard).join("")}</div>
<div class="prose ai-compare"><h3>Quick comparison</h3>${aiCompareTable(list)}</div>`;
    const jump = groups ? `<div class="ai-group-jump">${groups.filter(g => list.some(t => (t.group || groups[0].key) === g.key)).map(g => `<a class="blog-chip" href="#${g.key}">${esc(g.title)}</a>`).join("")}</div>` : "";
    return `<section class="section container ai-section" id="${AI_AUD[aud].anchor}">
<p class="eyebrow">${AI_AUD[aud].label}</p>
<h2 class="ai-h2">${AI_AUD[aud].h2}</h2>
<p class="section-sub">${intro}</p>
${jump}
${inner}
</section>`;
  };
  return head("Best AI Tools for Students & Institutes in India (2026)",
    "Researched AI tools for Indian students and coaching institutes: Gemini, ChatGPT, PW AI Guru, Wayground, Eklavvya, AI business phones and more. ₹ prices, how to use.")
    .replace("</head>", ld.map(o => `<script type="application/ld+json">${JSON.stringify(o)}</script>`).join("\n") + "\n</head>")
    + header("ai-tools.html") + `<main id="main">
${pageHero({ crumbs: [["index.html", "Home"], ["", "AI Tools"]], badge: `${AI_TOOLS.length} tools researched · No paid inclusions`, h1: hw("AI Tools for Learners & Institutes in India", 5, 5), sub: "Hand-picked AI tools that genuinely help Indian students prepare for exams and help coaching institutes teach, test and grow. Researched from official sources, with honest pros, cons and prices in ₹.", extra: `<div class="hero-acts fadein" style="--d:450ms"><a class="btn" href="#for-learners">For learners ${arw}</a><a class="btn btn-ghost" href="#for-institutes">For institutes</a></div>`, art: HERO_ART.f })}
<section class="section container prose ai-intro">
<div class="tldr-box"><p class="tldr-label">Quick answer</p>
<p><strong>For students:</strong> start with <a href="ai-tools-google-gemini.html">Google Gemini</a> (free tutor + JEE Main mocks), <a href="ai-tools-gemini-notebook.html">Gemini Notebook</a> (revise from NCERT and your notes), <a href="ai-tools-chatgpt.html">ChatGPT</a> (Study Mode), <a href="ai-tools-pw-ai-guru.html">PW AI Guru</a> (JEE/NEET doubts in Hinglish) and <a href="ai-tools-perplexity.html">Perplexity</a> (current affairs with sources).</p>
<p><strong>For institutes:</strong> use <a href="ai-tools-wayground.html">Wayground</a> for quizzes, <a href="ai-tools-eklavvya.html">Eklavvya</a> for proctored exams and AI answer checking, <a href="ai-tools-magicschool-ai.html">MagicSchool AI</a> and <a href="ai-tools-khanmigo.html">Khanmigo</a> for teacher preparation, <a href="ai-tools-interakt.html">Interakt</a> for WhatsApp admissions and reminders, and an AI business phone — <a href="ai-tools-myoperator.html">MyOperator</a>, <a href="ai-tools-exotel.html">Exotel</a>, <a href="ai-tools-knowlarity.html">Knowlarity</a>, <a href="ai-tools-talkeasy.html">TalkEasy</a> or <a href="ai-tools-tata-tele-smartflo.html">Tata Tele Smartflo</a> — so no admission call goes unanswered.</p>
</div>
<p class="muted">Last checked: ${AI_TOOLS.some(t => t.lastChecked) ? AI_TOOLS.filter(t => t.lastChecked).sort((a, b) => aiCheckedIso(b).localeCompare(aiCheckedIso(a)))[0].lastChecked : AI_LAST_CHECKED}. Prices and offers change often — always confirm on the tool's official website.</p>
</section>
${section("learners", learners, "Free and low-cost AI tools for school students, JEE/NEET aspirants, UPSC and government-exam candidates, and college students.")}
${section("institutes", institutes, "AI tools that save faculty time, make testing faster and fairer, and help coaching institutes handle admissions and parent communication.")}
<section class="section container prose">
<h2>How we choose these tools</h2>
<ul>
<li><strong>Available and useful in India</strong> — works for Indian students, exams and institutes today, not just in the US.</li>
<li><strong>Researched, not copied</strong> — every page is written from the tool's official pages and reputable news coverage, with sources listed.</li>
<li><strong>Honest about limits and costs</strong> — each guide lists limitations and current prices in ₹ where available.</li>
<li><strong>No paid rankings</strong> — no company paid to be included. If we ever add affiliate links, we will label them clearly.</li>
</ul>
<h2>Frequently asked questions</h2>
${AI_HUB_FAQS.map(f => `<h3>${esc(f.q)}</h3><p>${esc(f.a)}</p>`).join("")}
</section>
${ctaBand("Built an AI tool for Indian education?", "Tell us about it. We review tools that genuinely help learners and institutes.", "contact.html", "Contact us", 2)}
</main>` + footer();
}
function aiToolPage(t) {
  const aud = AI_AUD[t.audience];
  const pageUrl = `${B.siteUrl}/ai-tools-${t.slug}`;
  const same = AI_TOOLS.filter(o => o.audience === t.audience && o.slug !== t.slug)
    .sort((a, b) => ((b.group || "") === (t.group || "")) - ((a.group || "") === (t.group || "")));
  const alts = (t.alternatives || []).map(s => AI_TOOLS.find(o => o.slug === s)).filter(Boolean);
  const freeOffer = /^free/i.test(t.priceChip) || /Free/.test(t.pricing.rows[0][1]) || t.pricing.rows[0][1] === "₹0" || t.pricing.rows[0][1] === "US$0";
  const appLd = {
    "@context": "https://schema.org", "@type": "SoftwareApplication",
    name: t.name, url: t.url, applicationCategory: "EducationalApplication",
    operatingSystem: (t.facts.find(f => f[0] === "Works on" || f[0] === "Works with") || ["", "Web"])[1],
    description: t.quickAnswer.replace(/<[^>]+>/g, ""),
    author: { "@type": "Organization", name: t.maker },
    ...(freeOffer ? { offers: { "@type": "Offer", price: "0", priceCurrency: "INR", description: "Free plan or free access available" } } : {})
  };
  const pageLd = {
    "@context": "https://schema.org", "@type": "WebPage", name: t.metaTitle, url: pageUrl, description: t.metaDescription,
    dateModified: aiCheckedIso(t), inLanguage: "en-IN",
    about: { "@type": "SoftwareApplication", name: t.name },
    author: { "@type": "Organization", name: `${B.name} Team`, url: B.siteUrl },
    publisher: { "@type": "Organization", name: B.name, url: B.siteUrl },
    speakable: { "@type": "SpeakableSpecification", cssSelector: [".ai-quick-answer"] }
  };
  const crumbLd = { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: `${B.siteUrl}/` },
    { "@type": "ListItem", position: 2, name: "AI Tools", item: `${B.siteUrl}/ai-tools` },
    { "@type": "ListItem", position: 3, name: aud.label, item: `${B.siteUrl}/ai-tools#${aud.anchor}` },
    { "@type": "ListItem", position: 4, name: t.name, item: pageUrl }] };
  const faqLd = { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: t.faqs.map(f => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) };
  const benefitsH2 = t.audience === "learners" ? `How ${esc(aiShort(t))} helps students` : `How ${esc(aiShort(t))} helps coaching institutes`;
  const body = `
<div class="tldr-box ai-quick-answer"><p class="tldr-label">Quick answer</p><p>${esc(t.quickAnswer)}</p></div>
${(t.relatedLinks || []).map(l => `<div class="callout">${esc(l.lead)} <a href="${l.href}">${esc(l.text)} →</a></div>`).join("")}
<h2>Key facts</h2>
${tableWrap(`<tbody>${t.facts.map(([k, v]) => `<tr><th scope="row">${esc(k)}</th><td>${esc(v)}</td></tr>`).join("")}</tbody>`).replace("<table>", '<table class="facts-table">')}
<h2>What is ${esc(aiShort(t))}?</h2>
${t.whatIs.map(p => `<p>${p}</p>`).join("")}
<h2>${benefitsH2}</h2>
${t.benefits.map(b => `<h3>${esc(b.title)}</h3><p>${esc(b.body)}</p>`).join("")}
<h2>Key features</h2>
<ul>${t.features.map(f => `<li>${esc(f)}</li>`).join("")}</ul>
<h2>${esc(t.howTo.heading)}</h2>
<ol class="ai-steps">${t.howTo.steps.map(s => `<li>${esc(s)}</li>`).join("")}</ol>
<h2>${esc(aiShort(t))} pricing in India</h2>
${tableWrap(`<thead><tr><th>Plan</th><th>Price</th><th>What you get</th></tr></thead><tbody>${t.pricing.rows.map(r => `<tr><td><strong>${esc(r[0])}</strong></td><td>${esc(r[1])}</td><td>${esc(r[2])}</td></tr>`).join("")}</tbody>`)}
<p class="muted">${esc(t.pricing.note)}</p>
<h2>Limitations to know</h2>
<ul>${t.limitations.map(l => `<li>${esc(l)}</li>`).join("")}</ul>
<h2>Our verdict</h2>
<div class="callout"><strong>Verdict:</strong> ${esc(t.verdict)}</div>
<p class="ai-visit-row">${aiVisitBtn(t, "btn-primary")}</p>
${alts.length ? `<h2>Alternatives to ${esc(aiShort(t))}</h2><ul>${alts.map(a => `<li><a href="${aiToolFile(a)}"><strong>${esc(a.name)}</strong></a> — ${esc(a.tagline)}</li>`).join("")}</ul>` : ""}
<h2>Frequently asked questions</h2>
${t.faqs.map(f => `<h3>${esc(f.q)}</h3><p>${esc(f.a)}</p>`).join("")}
<h2>Sources</h2>
<ul class="ai-sources">${t.sources.map(s => `<li><a href="${s.url}" target="_blank" rel="noopener nofollow">${esc(s.label)}</a></li>`).join("")}</ul>
<p class="muted">Last checked: ${aiChecked(t)}. ${esc(B.name)} is independent and is not paid by ${esc(t.maker)}. Features and prices change — confirm on the official website before you pay.</p>`;
  const { html: bodyWithIds } = buildToc(body);
  return head(t.metaTitle, t.metaDescription)
    .replace("</head>", [appLd, pageLd, crumbLd, faqLd].map(o => `<script type="application/ld+json">${JSON.stringify(o)}</script>`).join("\n") + `\n<meta property="article:modified_time" content="${aiCheckedIso(t)}">\n</head>`)
    + header("ai-tools.html") + `
<main id="main">
${pageHero({ crumbs: [["index.html", "Home"], ["ai-tools.html", "AI Tools"], [`ai-tools.html#${aud.anchor}`, aud.label], ["", aiShort(t)]], badge: `${aud.label} · ${esc(t.priceChip)} · by ${esc(t.maker)}`, h1: hw(`${t.name}: ${t.audience === "learners" ? "AI Tool for Students in India" : "AI Tool for Coaching Institutes"}`, t.name.split(/\s+/).length, t.name.split(/\s+/).length).replace(/<span class="hw y"/, '<span class="hw"'), sub: esc(t.tagline), extra: `<div class="hero-acts fadein" style="--d:450ms">${aiVisitBtn(t, "btn-lav")}</div>`, art: HERO_ART.f })}
<section class="container detail-body">
<article class="detail-main prose ai-article">
${bodyWithIds}
</article>
<aside class="detail-side">
<div class="side-card">
<h3>Try ${esc(aiShort(t))}</h3>
<p class="muted">${esc(t.priceChip)} · by ${esc(t.maker)}</p>
<div style="margin-top:16px">${aiVisitBtn(t)}</div>
<p class="muted" style="margin-top:12px">Opens the official website in a new tab.</p>
</div>
<div class="side-actions">
<a class="action" href="ai-tools.html#${aud.anchor}"><span class="ic">≡</span> All AI tools ${aud.label.toLowerCase()} <span class="arr">→</span></a>
${same.slice(0, 6).map(o => `<a class="action" href="${aiToolFile(o)}"><span class="ic">${esc(o.name[0])}</span> ${esc(aiShort(o))} <span class="arr">→</span></a>`).join("\n")}
</div>
</aside>
</section>
</main>` + footer();
}

function postPage(p) {
  const { html: bodyHtml, tocItems } = buildToc(p.html);
  if (p.faqs) tocItems.push({ text: "Frequently asked questions", id: "faq" });
  const related = POSTS_BY_DATE.filter(o => o.slug !== p.slug && postExam(o) === postExam(p)).slice(0, 4);
  const more = related.length >= 4 ? related : [...related, ...POSTS.filter(o => o.slug !== p.slug && !related.includes(o))].slice(0, 4);
  const iso = toISODate(p.date);
  const faqHtml = p.faqs ? `<h2 id="faq">Frequently asked questions</h2>${p.faqs.map(f => `<h3>${esc(f.q)}</h3><p>${f.a}</p>`).join("")}` : "";
  const articleLd = {
    "@context": "https://schema.org", "@type": "BlogPosting",
    headline: p.title, description: p.excerpt,
    ...(p.image ? { image: [`${B.siteUrl}/${p.image}`] } : {}),
    author: { "@type": "Organization", name: `${B.name} Team`, url: B.siteUrl },
    publisher: { "@type": "Organization", name: B.name, url: B.siteUrl },
    datePublished: iso, dateModified: iso,
    mainEntityOfPage: { "@type": "WebPage", "@id": `${B.siteUrl}/${p.slug}` }
  };
  const faqLd = p.faqs ? {
    "@context": "https://schema.org", "@type": "FAQPage",
    mainEntity: p.faqs.map(f => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a.replace(/<[^>]+>/g, "") } }))
  } : null;
  const crumbLd = { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: `${B.siteUrl}/` },
    { "@type": "ListItem", position: 2, name: "Blogs", item: `${B.siteUrl}/blog` },
    { "@type": "ListItem", position: 3, name: postExam(p).label, item: `${B.siteUrl}/${blogExamFile(postExam(p)).replace(/\.html$/, "")}` },
    { "@type": "ListItem", position: 4, name: p.title, item: `${B.siteUrl}/${p.slug}` }] };
  const shareUrl = `${B.siteUrl}/${p.slug}`;
  const tocSidebar = tocItems.length > 1 ? `<nav class="post-toc-card" aria-label="On this page">
<p class="toc-title">On this page</p>
<ol class="toc-list">${tocItems.map((it) => `<li><a href="#${it.id}">${it.text}</a></li>`).join("")}</ol>
</nav>` : "";
  const words = p.title.split(/\s+/);
  return head(`${p.title} | ${B.name}`, p.excerpt, p.image).replace("</head>", `<meta property="article:published_time" content="${iso}">\n<script type="application/ld+json">${JSON.stringify(articleLd)}</script>\n${faqLd ? `<script type="application/ld+json">${JSON.stringify(faqLd)}</script>\n` : ""}<script type="application/ld+json">${JSON.stringify(crumbLd)}</script>\n</head>`) + header("blog.html") + `
<div class="progress" aria-hidden="true"></div>
<main id="main">
<section class="page-hero">
${edgeArt(HERO_ART.c, { hero: true })}
<div class="container"><div class="inner" style="max-width:900px">
<nav class="crumbs fadein" style="--d:0ms" aria-label="Breadcrumb"><a href="index.html">Home</a><span aria-hidden="true">/</span><a href="blog.html">Blogs</a><span aria-hidden="true">/</span><a href="${blogExamFile(postExam(p))}">${esc(postExam(p).label)}</a></nav>
<div class="post-pills fadein" style="--d:60ms"><a href="${blogExamFile(postExam(p))}">${esc(postExam(p).label)}</a><a href="${blogTypeFile(postType(p))}">${esc(postType(p).label)}</a></div>
<h1 style="font-size:clamp(32px,4.6vw,56px)">${words.length <= 16 ? hw(p.title) : esc(p.title)}</h1>
<div class="art-meta fadein" style="--d:300ms"><span>By the ${esc(B.name)} team</span><span>${p.date}</span><span>${p.minutes} min read</span></div>
${p.image ? `<div class="post-hero-media cut fadein" style="--d:400ms"><img src="${p.image}?v=${ASSET_V}" alt="${esc(p.imageAlt || p.title)}" width="1200" height="630"></div>` : ""}
</div></div>
</section>
<section class="band-paper"><div class="container section">
<div class="post-layout">
<aside class="post-sidebar">
${tocSidebar}
<div class="post-share"><span>Share:</span><div class="post-share-icons">
<a href="https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}" rel="noopener" target="_blank" aria-label="Share on LinkedIn">in</a>
<a href="https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&amp;text=${encodeURIComponent(p.title)}" rel="noopener" target="_blank" aria-label="Share on X">X</a>
<a href="https://wa.me/?text=${encodeURIComponent(p.title + " " + shareUrl)}" rel="noopener" target="_blank" aria-label="Share on WhatsApp">wa</a>
</div></div>
</aside>
<article class="prose article-body">
<div class="byline"><span class="av" aria-hidden="true">4u</span><span><b style="color:var(--navy)">${esc(B.name)} team</b><br>Researched from official sources. <a href="contact.html">Report a correction</a></span></div>
${bodyHtml}
${faqHtml}
</article>
</div>
</div></section>
${p.cta ? `<div class="post-sticky-cta" id="postStickyCta">
<div class="container post-sticky-inner">
<p>Ready to compare options?</p>
<a class="btn btn-sm" href="${p.cta.href}">${esc(p.cta.text)}</a>
<button class="post-sticky-close" type="button" aria-label="Dismiss" onclick="document.getElementById('postStickyCta').hidden=true">✕</button>
</div>
</div>` : ""}
<section class="band-yellow"><div class="container section">
<div class="row-head"><h2 class="sec-title reveal">${rv("More from our guides", 3, "t")}</h2><a class="link-arrow" href="blog.html">All guides →</a></div>
<div class="post-grid">${more.map(postCard).join("")}</div>
</div></section>
</main>`;
}

const privacyBody = `
<section class="hero hero-sm"><div class="container"><h1>Privacy Policy</h1></div></section>
<section class="section container prose">
<p>Last updated: July 2026</p>
<p><strong>What we collect.</strong> When you submit an enquiry or registration form, we collect the details you enter (name, contact number, message) solely to connect you with the institute or respond to you.</p>
<p><strong>What we don't do.</strong> We do not sell your personal data. We do not share your contact details with any institute other than the one you enquired about.</p>
<p><strong>Cookies.</strong> This site stores only a single preference (your selected city) in your browser's local storage. No tracking cookies, no ad networks.</p>
<p><strong>Removal.</strong> Email ${B.email} to have your enquiry data deleted.</p>
</section>`;

const termsBody = `
<section class="hero hero-sm"><div class="container"><h1>Terms &amp; Conditions</h1></div></section>
<section class="section container prose">
<p>Last updated: July 2026</p>
<p><strong>Information accuracy.</strong> Listing details are provided by institutes or compiled from public sources, and are marked accordingly. We correct errors promptly when reported but cannot guarantee every detail is current. Always confirm fees, batches and facilities directly before paying.</p>
<p><strong>Reviews.</strong> Reviews reflect the opinions of their authors. We remove reviews only for abuse, spam or impersonation — not for being negative.</p>
<p><strong>Free service.</strong> ${B.name} is free for students. Institutes may purchase promoted placement, which is always labelled.</p>
<p><strong>Contact.</strong> ${B.email}</p>
</section>`;

function sitemapBody() {
  const links = [];
  links.push(["index.html", "Home"], ["coaching.html", "Coaching"], ["certification.html", "Certifications"], ["coach.html", "Coaches"], ["computer-courses.html", "Computer Courses"], ["ai-tools.html", "AI Tools"], ["blog.html", "Guides"], ["about.html", "About"], ["contact.html", "Contact"], ["list-your-institute.html", "List Your Institute"], ["privacy.html", "Privacy"], ["terms.html", "Terms"]);
  Object.keys(DATA.cities).forEach(t => {
    DATA.cities[t].forEach(c => {
      const lbl = t === "coaching" ? `Coaching in ${cityLabel(c)}` : `${typeLabel[t]} — ${cityLabel(c)}`;
      links.push([`${typePage[t]}-${c}.html`, lbl]);
    });
  });
  const inst = L.map(x => `<li><a href="institute-${x.slug}.html">${esc(x.name)} — ${cityLabel(x.city)}</a></li>`).join("");
  const brandReviewPages = BRAND_REVIEWS.filter(r => reviewSubject(r))
    .map(r => { const x = reviewSubject(r); return `<li><a href="review-${x.slug}.html">${esc(x.name)} — ${x.isTool ? esc(x.toolCategory) : x.city === "online" ? "Online" : cityLabel(x.city)}</a></li>`; }).join("");
  return `<section class="hero hero-sm"><div class="container"><h1>Sitemap</h1></div></section>
<section class="section container prose">
<h2>Pages</h2><ul>${links.map(([h, t]) => `<li><a href="${h}">${t}</a></li>`).join("")}</ul>
<h2>All listings (${L.length})</h2><ul>${inst}</ul>
<h2>Blog categories</h2><ul>${[...BLOG_EXAMS.filter(g => POSTS.some(p => postExam(p) === g)).map(g => `<li><a href="${blogExamFile(g)}">${esc(g.label)} articles</a></li>`), ...BLOG_TYPES.map(t => `<li><a href="${blogTypeFile(t)}">${esc(t.label)}</a></li>`)].join("")}</ul>
<h2>AI tools (${AI_TOOLS.length})</h2><ul>${AI_TOOLS.map(t => `<li><a href="ai-tools-${t.slug}.html">${esc(t.name)} — ${t.audience === "learners" ? "for learners" : "for institutes"}</a></li>`).join("")}</ul>
${brandReviewPages ? `<h2>Brand review pages (${BRAND_REVIEWS.length})</h2><ul>${brandReviewPages}</ul>` : ""}
</section>`;
}

/* ---------- assets ---------- */
const css = fs.readFileSync(path.join(__dirname, "style.css"), "utf8");
const js = fs.readFileSync(path.join(__dirname, "app.js"), "utf8");

/* ---------- site-wide search index (institutes + blog guides) ---------- */
const searchIndex = [
  ...L.map(x => ({
    t: x.name,
    s: x.city === "online" ? x.locality : `${x.locality}, ${cityLabel(x.city)}`,
    c: typeLabel[x.type],
    u: `/institute-${x.slug}`
  })),
  ...POSTS.map(p => ({ t: p.title, s: p.category, c: "Guide", u: `/${p.slug}` })),
  ...BLOG_EXAMS.map(g => ({ t: `${g.label} articles`, s: "Blog category", c: "Blogs", u: `/blog-${g.key}` })),
  { t: "AI Tools for Learners & Institutes", s: "Hand-picked AI tools", c: "AI Tools", u: "/ai-tools" },
  ...AI_TOOLS.map(t => ({ t: t.name, s: t.audience === "learners" ? "AI tool for learners" : "AI tool for institutes", c: "AI Tool", u: `/ai-tools-${t.slug}` }))
];

/* ---------- write ---------- */
fs.mkdirSync(path.join(OUT, "assets"), { recursive: true });
fs.writeFileSync(path.join(OUT, "assets", "style.css"), css);
fs.writeFileSync(path.join(OUT, "assets", "app.js"), js);
fs.writeFileSync(path.join(OUT, "assets", "search-index.json"), JSON.stringify(searchIndex));

/* copy blog images */
const blogSrc = path.join(__dirname, "assets", "blog");
if (fs.existsSync(blogSrc)) {
  const blogOut = path.join(OUT, "assets", "blog");
  fs.mkdirSync(blogOut, { recursive: true });
  for (const f of fs.readdirSync(blogSrc)) {
    fs.copyFileSync(path.join(blogSrc, f), path.join(blogOut, f));
  }
}

/* copy institute logo images */
const logosSrc = path.join(__dirname, "assets", "logos");
if (fs.existsSync(logosSrc)) {
  const logosOut = path.join(OUT, "assets", "logos");
  fs.mkdirSync(logosOut, { recursive: true });
  for (const f of fs.readdirSync(logosSrc)) {
    fs.copyFileSync(path.join(logosSrc, f), path.join(logosOut, f));
  }
}

/* canonical URLs use clean paths (Vercel cleanUrls: true strips .html) */
const cleanPath = (f) => f === "index.html" ? "/" : "/" + f.replace(/\.html$/, "");
const canonical = (f) => `${B.siteUrl}${cleanPath(f)}`;
const PAGES = [];
/* rewrite bare internal hrefs (href="page.html", href="index.html") to clean
   canonical-format paths (href="/page", href="/") so internal links never
   trigger the cleanUrls .html-stripping redirect or resolve against the
   wrong (www) domain via relative-URL resolution. */
const fixLinks = (html) => html
  .replace(/href="index\.html"/g, 'href="/"')
  .replace(/href="([a-zA-Z0-9_-]+)\.html(\?[^"#]*)?(#[^"]*)?"/g, (m, name, qs, hash) => `href="/${name}${qs || ""}${hash || ""}"`);
const w = (f, html) => {
  const linked = fixLinks(html);
  const withCanonical = linked.replace("</head>", `<link rel="canonical" href="${canonical(f)}">\n<meta property="og:url" content="${canonical(f)}">\n</head>`);
  fs.writeFileSync(path.join(OUT, f), withCanonical);
  PAGES.push(f);
};

w("index.html", homePage());
w("coaching.html", hubPage("coaching", "Find Your Coaching Institute", `Compare ${stats.coaching} coaching institutes for IAS, JEE, NEET, SSC and more, with ratings labelled by source.`));

DATA.cities.coaching.forEach(c => w(`coaching-${c}.html`, listingPage("coaching", c)));
w("coaching-online.html", onlineCoachingPage());

w("certification.html", hubPage("certification", "Compare Professional Certification Training Providers",
  "Compare online professional certification training providers — including PMI PgMP®, PfMP® and PMP® programs — with verified facts, real track records and no paid rankings."));
DATA.cities.certification.forEach(c => w(`certification-${c}.html`, listingPage("certification", c)));
w("coach.html", hubPage("coach", "Find an Individual Coach",
  "Compare verified individual coaches and mentors — with real client outcomes, verified facts and no paid rankings."));
DATA.cities.coach.forEach(c => w(`coach-${c}.html`, listingPage("coach", c)));
w("computer-courses.html", hubPage("computer-courses", "Find a Computer Training Institute",
  "Compare computer training institutes for DCA, ADCA, Tally, web development, graphic design and AI tools — with verified facts and no paid rankings."));
DATA.cities["computer-courses"].forEach(c => w(`computer-courses-${c}.html`, listingPage("computer-courses", c)));

L.forEach(x => w(`institute-${x.slug}.html`, detailPage(x)));
BRAND_REVIEWS.forEach(rv => {
  const x = reviewSubject(rv);
  if (x) w(`review-${rv.slug}.html`, brandReviewPage(rv, x));
});

w("about.html", simplePage("about.html", "About Us", `Who we are and how ${B.name} keeps listings honest.`, aboutBody, "about.html"));
w("contact.html", simplePage("contact.html", "Contact Us", `Get in touch with the ${B.name} team.`, contactBody));
w("list-your-institute.html", simplePage("list-your-institute.html", "List Your Institute Free", `Register your coaching institute on ${B.name} for free.`, listBody));
w("blog.html", simplePage("blog.html", "Guides & Articles", "Original research-backed articles on coaching, exam preparation and student life.", blogIndex(), "blog.html"));
w("reviews.html", simplePage("reviews.html", "Reviews", "Independent reviews of coaching institutes, professional certifications and individual coaches — verified facts and our own research, with no paid rankings.", reviewsIndex(), "reviews.html"));
POSTS.forEach(p => w(`${p.slug}.html`, postPage(p) + footer()));
BLOG_EXAMS.forEach(g => { if (POSTS.some(p => postExam(p) === g)) w(blogExamFile(g), blogCategoryPage(g, "exam")); });
BLOG_TYPES.forEach(t => w(blogTypeFile(t), blogCategoryPage(t, "type")));
w("ai-tools.html", aiToolsHub());
AI_TOOLS.forEach(t => w(`ai-tools-${t.slug}.html`, aiToolPage(t)));
w("privacy.html", simplePage("privacy.html", "Privacy Policy", `${B.name} privacy policy.`, privacyBody));
w("terms.html", simplePage("terms.html", "Terms & Conditions", `${B.name} terms and conditions.`, termsBody));
w("sitemap.html", simplePage("sitemap.html", "Sitemap", `All pages on ${B.name}.`, sitemapBody()));

/* thank-you page for form submissions (excluded from sitemap) */
w("thanks.html", simplePage("thanks.html", "Thank You", "Your message has been sent.", `
<section class="hero hero-sm"><div class="container">
<h1>Thank you, we've got it</h1>
<p class="hero-sub">Your enquiry has been sent to our counselling team. We typically respond within one working day. Meanwhile, feel free to keep exploring.</p>
<p style="margin-top:24px;display:flex;gap:12px;flex-wrap:wrap"><a class="btn" href="index.html">Back to homepage</a><a class="btn btn-ghost" href="coaching.html">Browse institutes</a></p>
</div></section>`).replace('<meta name="robots" content="index, follow">', '<meta name="robots" content="noindex, follow">'));

/* 404 page */
w("404.html", simplePage("404.html", "Page Not Found", "This page does not exist.", `
<section class="hero hero-sm"><div class="container">
<h1>Page not found</h1>
<p class="hero-sub">The page you're looking for doesn't exist or was moved.</p>
<p style="margin-top:20px"><a class="btn" href="index.html">Go to homepage</a></p>
</div></section>`));

/* sitemap.xml + robots.txt for search engines */
const today = new Date().toISOString().slice(0, 10);
/* per-post publish dates (posts.js uses "D MMM YYYY") converted to ISO, so
   article pages carry their real lastmod instead of a blanket build-date
   stamp on every URL. */
const postDateBySlug = {};
POSTS.forEach(p => {
  const iso = toISODate(p.date || "");
  postDateBySlug[p.slug] = /^\d{4}-\d{2}-\d{2}$/.test(iso) ? iso : today;
});
const hubPages = new Set([
  "coaching.html", "coaching-online.html", "certification.html", "coach.html", "computer-courses.html",
  "blog.html", "about.html", "contact.html", "list-your-institute.html", "ai-tools.html"
]);
BLOG_EXAMS.forEach(g => hubPages.add(blogExamFile(g))); BLOG_TYPES.forEach(t => hubPages.add(blogTypeFile(t)));
const cityPageRe = /^(coaching|certification|coach|computer-courses)-[a-z-]+\.html$/;
const sitemapMeta = (f) => {
  if (f === "index.html") return { priority: "1.0", changefreq: "daily" };
  if (hubPages.has(f) || cityPageRe.test(f)) return { priority: "0.8", changefreq: "daily" };
  if (f === "privacy.html" || f === "terms.html" || f === "sitemap.html") return { priority: "0.3", changefreq: "monthly" };
  if (f.startsWith("institute-")) return { priority: "0.6", changefreq: "weekly" };
  if (f.startsWith("ai-tools-")) return { priority: "0.7", changefreq: "weekly" };
  const slug = f.replace(/\.html$/, "");
  if (postDateBySlug[slug]) return { priority: "0.6", changefreq: "weekly" };
  return { priority: "0.5", changefreq: "monthly" };
};
const urls = PAGES.filter(f => f !== "404.html" && f !== "thanks.html").map(f => {
  const slug = f.replace(/\.html$/, "");
  const lastmod = postDateBySlug[slug] || today;
  const { priority, changefreq } = sitemapMeta(f);
  return `<url><loc>${canonical(f)}</loc><lastmod>${lastmod}</lastmod><changefreq>${changefreq}</changefreq><priority>${priority}</priority></url>`;
}).join("\n");
fs.writeFileSync(path.join(OUT, "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`);
fs.writeFileSync(path.join(OUT, "robots.txt"),
  `User-agent: *\nAllow: /\n\nSitemap: ${B.siteUrl}/sitemap.xml\n`);

/* favicon (SVG of the brand mark) */
fs.writeFileSync(path.join(OUT, "favicon.svg"),
  `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40"><rect width="40" height="40" fill="#2B399E"/><g fill="none" stroke="#FFF9AB" stroke-width="2.6"><polygon points="20,6 34,20 20,34 6,20"/><polygon points="10,10 30,10 30,30 10,30"/></g></svg>\n`);

const count = fs.readdirSync(OUT).filter(f => f.endsWith(".html")).length;
console.log(`Built ${count} HTML pages into ${OUT} (+ sitemap.xml, robots.txt, favicon.svg)`);
