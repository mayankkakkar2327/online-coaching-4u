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
  cities: new Set(L.map(x => x.city)).size,
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
    x.rating && x.ratingCount >= 5 ? `Students rate it ${x.rating.toFixed(1)}/5 based on ${x.ratingCount} reviews on our platform.` :
      x.ratingCount > 0 ? `Early student feedback is positive, though the review count is still small.` :
      `It has not collected enough student reviews yet — if you have studied here, your review would help others.`,
    `The institute is located at ${x.address}. We recommend visiting the campus and sitting in on a demo class before enrolling.`
  ];
  return bits.join(" ");
}

/* ---------- shared layout ---------- */
/* asset version — changes each build so browsers never serve stale immutable-cached CSS/JS */
const ASSET_V = Date.now().toString(36);
const CSS_LINK = `<link rel="stylesheet" href="assets/style.css?v=${ASSET_V}">`;

function head(title, desc, image) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:site_name" content="${B.name}">
<meta property="og:type" content="website">
${image ? `<meta property="og:image" content="${B.siteUrl}/${image}">\n<meta name="twitter:card" content="summary_large_image">\n<meta name="twitter:image" content="${B.siteUrl}/${image}">` : ""}
<meta name="robots" content="index, follow">
<link rel="icon" href="favicon.svg" type="image/svg+xml">
<script async src="https://www.googletagmanager.com/gtag/js?id=G-H2F4C0EQXC"></script>
<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-H2F4C0EQXC');</script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
${CSS_LINK}
</head>
<body>`;
}

const LOGO = `<span class="logo-mark"><svg width="19" height="19" viewBox="0 0 34 34" aria-hidden="true"><path d="M17 6l12 6-12 6L5 12l12-6z" fill="#fff"/><path d="M11 16v5c0 2 2.7 3.6 6 3.6s6-1.6 6-3.6v-5l-6 3-6-3z" fill="#c7d2fe"/></svg></span>`;

/* stable gradient class per listing name */
const grad = (s) => "g" + ((s.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % 6) + 1);

function header(active, dark) {
  const nav = [["certification.html", "Certifications"], ["coach.html", "Coaches"], ["computer-courses.html", "Computer Courses"], ["ai-tools.html", "AI Tools"], ["blog.html", "Blogs"], ["reviews.html", "Reviews"]];
  const academicActive = active === "coaching-online.html" || active === "coaching.html";
  return `<header class="site-header${dark ? " header-dark" : ""}">
<div class="container header-inner">
<a class="logo" href="index.html" aria-label="${B.name} home">${LOGO}<span>${B.name}</span></a>
<nav class="main-nav" aria-label="Main navigation">
<div class="nav-item nav-has-dropdown">
<button type="button" class="nav-drop-btn${academicActive ? " active" : ""}" aria-haspopup="true" aria-expanded="false" onclick="this.parentElement.classList.toggle('open')">Academic Coaching <span class="nav-caret" aria-hidden="true">▾</span></button>
<div class="nav-dropdown">
<a href="coaching-online.html"${active === "coaching-online.html" ? ' class="active" aria-current="page"' : ""}>Online Coaching</a>
<a href="coaching.html"${active === "coaching.html" ? ' class="active" aria-current="page"' : ""}>Offline Coaching</a>
</div>
</div>
${nav.map(([h, t]) => `<a href="${h}"${active === h ? ' class="active" aria-current="page"' : ""}>${t}</a>`).join("\n")}
</nav>
<a class="btn ${dark ? "btn-primary" : "btn-dark"} btn-sm" href="contact.html">Contact us</a>
<button class="nav-toggle" aria-label="Open menu" onclick="document.body.classList.toggle('nav-open')">☰</button>
</div>
</header>`;
}

function footer() {
  const footerCityCounts = DATA.cities.coaching.filter(c => c !== "online").map(c => ({ c, n: byCity("coaching", c).length }));
  const topFooterCities = [...footerCityCounts].sort((a, b) => b.n - a.n).slice(0, 10);
  const coachingCities = `<li><a href="coaching-online.html">Online Coaching</a></li>` +
    topFooterCities.map(({ c }) => `<li><a href="coaching-${c}.html">Coaching in ${cityLabel(c)}</a></li>`).join("") +
    `<li><a href="coaching.html">Browse all ${footerCityCounts.length} cities →</a></li>`;
  return `<footer class="site-footer">
<div class="container footer-grid">
<div>
<h3>Coaching</h3><ul>${coachingCities}</ul>
</div>
<div>
<h3>Guides</h3><ul>${POSTS.slice(0, 6).map(p => `<li><a href="${p.slug}.html">${esc(p.title)}</a></li>`).join("")}</ul>
</div>
<div>
<h3>Company</h3><ul>
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
</ul>
</div>
<div>
<h3>Legal</h3><ul>
<li><a href="privacy.html">Privacy Policy</a></li>
<li><a href="terms.html">Terms &amp; Conditions</a></li>
</ul>
<p class="footer-note">All listing data is verified with institutes where possible. Ratings reflect reviews collected from students.</p>
</div>
</div>
<div class="container footer-bottom">
<p>© 2026 ${B.name}. All rights reserved.</p>
</div>
</footer>
<script src="assets/app.js?v=${ASSET_V}"></script>
</body></html>`;
}

/* ---------- cards ---------- */
function stars(x) {
  if (!x.rating) return `<span class="rating muted">No reviews yet</span>`;
  return `<span class="rating"><span class="star" aria-hidden="true">★</span> ${x.rating.toFixed(1)} <span class="muted">(${x.ratingCount} review${x.ratingCount === 1 ? "" : "s"})</span></span>`;
}

function card(x) {
  const exams = x.exams.filter(e => e !== "schooling").slice(0, 4).map(e => `<span class="chip">${examLabel(e)}</span>`).join("");
  const extra = x.exams.filter(e => e !== "schooling").length > 4 ? `<span class="chip chip-more">+${x.exams.length - 4} more</span>` : "";
  const gender = x.gender ? `<span class="chip">${x.gender === "Both" ? "Boys & Girls" : x.gender === "Female" ? "Girls" : "Boys"}</span>` : "";
  const price = x.priceRange ? `<span class="chip chip-price">${x.priceRange}</span>` : "";
  const locLine = x.city === "online" ? `${esc(x.locality)}` : `${esc(x.locality)}, ${cityLabel(x.city)}`;
  const modeBadge = x.mode ? `<span class="badge ${x.mode === "online" ? "badge-online" : x.mode === "hybrid" ? "badge-hybrid" : "badge-type"}">${modeLabel[x.mode]}</span>` : "";
  return `<a class="card" href="institute-${x.slug}.html" data-exams="${x.exams.join(",")}" data-verified="${x.verified}" data-featured="${x.featured ? 1 : 0}" data-mode="${x.mode || ""}" data-rating="${x.rating || 0}" data-reviews="${x.ratingCount || 0}" data-estd="${x.estd || 9999}" data-name="${esc(x.name.toLowerCase())}">
<div class="card-top">${x.verified ? `<span class="badge badge-verified" title="Details verified with the institute">✓ Verified</span>` : ""}${modeBadge}</div>
<div class="card-ident">
<span class="avatar-md ${grad(x.name)}" aria-hidden="true">${esc(x.name[0])}</span>
<div><h3>${esc(x.name)}</h3><p class="card-loc">${locLine}${x.estd ? ` · Estd. ${x.estd}` : ""}</p></div>
</div>
<div class="card-chips">${exams}${extra}${gender}${price}</div>
<div class="card-foot">${stars(x)}<span class="card-cta">View profile →</span></div>
</a>`;
}

/* ---------- pages ---------- */
function searchBox() {
  return `<div class="searchbox searchbox-live" role="search">
<label class="sr-only" for="site-search">Search institutes, cities or guides</label>
<input type="text" id="site-search" name="q" placeholder="Search institutes, cities or guides…" autocomplete="off">
<button class="btn btn-primary" type="button" id="site-search-btn">Search</button>
<div id="site-search-results" class="search-results" hidden></div>
</div>`;
}

function homePage() {
  /* custom stroke icons, one per exam — replaces the old generic unicode glyphs
     (§ ∆ ✚ ◆ ¶ ⚖ ✦ ₹ ◎), which read as dated placeholder symbols */
  const icons = {
    ias: `<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 21V9l8-6 8 6v12"/><path d="M9 21v-7h6v7"/><path d="M4 9h16"/></svg>`,
    jee: `<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="2.4"/><ellipse cx="12" cy="12" rx="9" ry="3.6"/><ellipse cx="12" cy="12" rx="9" ry="3.6" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="9" ry="3.6" transform="rotate(120 12 12)"/></svg>`,
    neet: `<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v6M12 16v6M9 8h6l3 6a6 6 0 0 1-12 0l3-6Z"/></svg>`,
    cat: `<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18"/></svg>`,
    ssc: `<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11.5 11 13.5 15.5 8.5"/><rect x="3.5" y="4" width="17" height="16" rx="3"/></svg>`,
    clat: `<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v18M5 7l-3 6a3.5 3.5 0 0 0 7 0l-3-6ZM19 7l-3 6a3.5 3.5 0 0 0 7 0l-3-6ZM5 7h14M9 21h6"/></svg>`,
    nda: `<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2 3 6v5c0 5 4 8.5 9 11 5-2.5 9-6 9-11V6l-9-4Z"/></svg>`,
    bank: `<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="10" width="18" height="9" rx="1.5"/><path d="M3 10 12 4l9 6M7 10v9M12 10v9M17 10v9"/></svg>`,
    cuet: `<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3 2 8l10 5 10-5-10-5Z"/><path d="M6 10.5V15c0 1.5 2.5 3 6 3s6-1.5 6-3v-4.5"/></svg>`,
  };
  /* each tile links straight to whichever city has the most listings for that exam —
     deterministic and always has results, unlike the old last-visited-city guess,
     which could land a visitor on a city with zero matches for a niche exam */
  const examCards = ["ias", "jee", "neet", "cat", "ssc", "clat", "nda", "bank", "cuet"]
    .map((e) => `<a class="tile tile-h" href="coaching-${bestCityForExam(e)}.html?exam=${e}"><span class="tile-ic" aria-hidden="true">${icons[e]}</span><span class="tile-text"><strong>${examLabel(e)}</strong><span class="muted">${e === "cat" ? "Classroom &amp; online" : "Find coaching"}</span></span></a>`).join("");
  /* "Browse by city" — a tight grid of the busiest cities plus the long tail as a
     compact chip list, instead of one full-size card per city (was ~40 identical
     cards in a row, the single biggest source of homepage clutter) */
  const cityCounts = DATA.cities.coaching.filter(c => c !== "online").map(c => ({ c, n: byCity("coaching", c).length }));
  const sortedCityCounts = [...cityCounts].sort((a, b) => b.n - a.n);
  const topCityCounts = sortedCityCounts.slice(0, 12);
  const moreCityCounts = sortedCityCounts.slice(12);
  const topCityCards = topCityCounts.map(({ c, n }) => `<a class="city-mini" href="coaching-${c}.html"><strong>${cityLabel(c)}</strong><span class="muted">${n} listed</span></a>`).join("");
  const moreCityChips = moreCityCounts.map(({ c }) => `<a class="city-chip" href="coaching-${c}.html">${cityLabel(c)}</a>`).join("") +
    `<a class="city-chip city-chip-cta" href="coaching.html">View all cities →</a>`;
  const onlineCount = byType("coaching").filter(x => x.mode === "online" || x.mode === "hybrid").length;
  const topRated = [...byType("coaching")].sort((a, b) => (b.rating || 0) * Math.log((b.ratingCount || 0) + 1) - (a.rating || 0) * Math.log((a.ratingCount || 0) + 1));
  const featured = topRated.slice(0, 6).map(card).join("");
  /* "Top rated this month" hero widget: curated, not algorithmic — hand-picked slugs */
  const MINI_SLUGS = ["rodha", "iproledge-academy-bengaluru", "sbtechmath-academy", "navjeevan-neet-academy-sikar"];
  const miniItems = MINI_SLUGS.map(s => L.find(x => x.slug === s)).filter(Boolean);
  const minis = miniItems.map((x, i) => `<a class="mini" href="institute-${x.slug}.html"><span class="avatar ${grad(x.name)}">${esc(x.name[0])}</span><div><b>${esc(x.name)}</b><span>${esc(x.locality)}${x.estd ? ` · Since ${x.estd}` : ""}</span></div><span class="score">#${i + 1}</span></a>`).join("");
  return head(`${B.name} — Find the Best Coaching Institutes in India`,
    `Compare ${stats.coaching} verified coaching institutes across ${stats.cities} cities. Real reviews, honest details, free for students.`) +
    header("index.html", true) + `
<section class="hero">
<div class="container hero-grid">
<div>
<p class="hero-kicker">Verified listings · Free for students</p>
<h1>Choose where you study <em>with certainty,</em> not guesswork</h1>
<p class="hero-sub">${B.tagline}</p>
${searchBox()}
<div class="stats-row">
<div><strong>${stats.listings}</strong><span>Listings live</span></div>
<div><strong>${stats.cities}</strong><span>Cities &amp; online</span></div>
<div><strong>${stats.reviews}+</strong><span>Student reviews</span></div>
<div><strong>₹0</strong><span>For students, always</span></div>
</div>
</div>
<aside class="hero-card">
<div class="hc-title">Top rated this month</div>
${minis}
</aside>
</div>
</section>
<section class="section container" style="padding-bottom:0">
<div class="sec-head">
<div><div class="eyebrow">Start here</div><h2>Online or offline: pick your path</h2></div>
</div>
<div class="path-grid">
<a class="path-card path-card-online" href="coaching-online.html">
<span class="path-kicker">Study from anywhere</span>
<h3>Online Coaching</h3>
<p>Live and self-paced programs from platforms and hybrid institutes, joinable from anywhere. ${onlineCount} listed.</p>
<span class="link-arrow">Explore online coaching →</span>
</a>
<a class="path-card path-card-offline" href="coaching.html">
<span class="path-kicker">Classroom, near you</span>
<h3>Offline Coaching</h3>
<p>In-person institutes with physical batches, browsed by city. ${stats.coaching} institutes listed.</p>
<span class="link-arrow">Browse by city →</span>
</a>
</div>
</section>
<section class="section container">
<div class="sec-head">
<div><div class="eyebrow">Start with your goal</div><h2>What are you preparing for?</h2></div>
<a class="link-arrow" href="coaching.html">All categories →</a>
</div>
<div class="tile-grid">${examCards}</div>
</section>
<section class="section container" style="padding-top:0">
<div class="sec-head">
<div><div class="eyebrow">Ranked by students, not budgets</div><h2>Highest-rated institutes</h2><p class="section-sub" style="margin-bottom:0">Ratings come from students and cannot be bought, edited or hidden.</p></div>
<a class="link-arrow" href="coaching.html">Browse all ${stats.coaching} →</a>
</div>
<div class="card-grid">${featured}</div>
</section>
<section class="section container why">
<div class="band">
<div>
<div class="eyebrow">Why students trust us</div>
<h2>Comparison you can actually believe</h2>
<p>Most coaching directories sell their rankings. We built this platform on different economics: institutes never pay to rank, reviews are never edited, and anything promoted is labelled in plain sight.</p>
</div>
<div class="principles">
<div class="principle"><span class="num">01</span><div><b>Honest listings</b><span>Verification status shown on every profile — you always know how much to trust.</span></div></div>
<div class="principle"><span class="num">02</span><div><b>Unedited reviews</b><span>Institutes cannot pay to change or remove what students say.</span></div></div>
<div class="principle"><span class="num">03</span><div><b>No paid rankings</b><span>Default order reflects our genuine, unpaid recommendation — weighing ratings, track record and free content. Nobody can buy placement.</span></div></div>
<div class="principle"><span class="num">04</span><div><b>Free for students</b><span>Comparing, enquiring and reviewing costs nothing. Ever.</span></div></div>
</div>
</div>
</section>
<section class="section container" style="padding-top:16px">
<div class="sec-head"><div><div class="eyebrow">Explore</div><h2>Browse by city</h2></div></div>
<div class="city-mini-grid">${topCityCards}</div>
<div class="city-more-card"><div class="city-more-label">More cities</div><div class="city-chip-row">${moreCityChips}</div></div>
</section>
<section class="section container" style="padding-top:16px">
<div class="sec-head">
<div><div class="eyebrow">From our editorial desk</div><h2>Guides worth your time</h2></div>
<a class="link-arrow" href="blog.html">All guides →</a>
</div>
<div class="card-grid">${POSTS.slice(0, 3).map(postCard).join("")}</div>
</section>
<section class="section container cta-band">
<h2>Run a coaching institute?</h2>
<p>Get listed free and reach students actively searching in your city.</p>
<a class="btn btn-primary" href="list-your-institute.html">List Your Institute Free</a>
</section>` + footer();
}

function hubPage(type, title, sub) {
  const hubCC = (DATA.cityContent || {})[`${typePage[type]}-hub`];
  const cities = DATA.cities[typePage[type]].filter(c => !(type === "coaching" && c === "online"));
  const onlineBanner = type === "coaching" ? `<section class="section container" style="padding-top:0;padding-bottom:0">
<a class="path-banner" href="coaching-online.html"><span><strong>Looking for online coaching instead?</strong> Browse nationwide online-only CAT/MBA platforms.</span><span class="link-arrow">Explore online coaching →</span></a>
</section>` : "";
  const cityCards = cities.map(c => {
    const items = byCity(type, c);
    const top = items[0];
    return `<a class="tile tile-city" href="${typePage[type]}-${c}.html"><strong>${cityLabel(c)}</strong><span class="muted">${items.length} listed${top && top.rating ? ` · top rated ${top.rating.toFixed(1)}★` : ""}</span></a>`;
  }).join("");
  const featured = [...byType(type)].filter(x => !(type === "coaching" && x.city === "online")).sort((a, b) => (b.rating || 0) * Math.log((b.ratingCount || 0) + 1) - (a.rating || 0) * Math.log((a.ratingCount || 0) + 1)).slice(0, 6).map(card).join("");
  return head(`${title} — ${B.name}`, sub) + header(`${typePage[type]}.html`) + `
<section class="hero hero-sm"><div class="container">
<h1>${title}</h1><p class="hero-sub">${sub}</p>${searchBox()}
</div></section>
${onlineBanner}
<section class="section container"><h2>Browse by city</h2><div class="tile-grid">${cityCards}</div></section>
<section class="section container"><h2>Highest rated</h2><div class="card-grid">${featured}</div></section>
${hubCC && hubCC.faqs ? `<section class="section container prose"><h2>Frequently asked questions</h2>${hubCC.faqs.map(f => `<h3 style="margin:18px 0 6px">${esc(f.q)}</h3><p>${esc(f.a)}</p>`).join("")}</section>
<script type="application/ld+json">${JSON.stringify({ "@context": "https://schema.org", "@type": "FAQPage", "mainEntity": hubCC.faqs.map(f => ({ "@type": "Question", "name": f.q, "acceptedAnswer": { "@type": "Answer", "text": f.a } })) })}</script>` : ""}
<section class="section container cta-band">
<h2>Own a ${typeLabel[type].toLowerCase()}?</h2><p>List it free and reach students in your city.</p>
<a class="btn btn-primary" href="list-your-institute.html">Get Listed Free</a>
</section>` + footer();
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
    : `${items.length} listed · ordered by our recommendation by default, which weighs student ratings, track record and depth of free content — switch to Top rated, Most reviewed or Oldest anytime. Institutes cannot pay for placement.`;
  const allExams = [...new Set(items.flatMap(x => x.exams))].filter(e => e !== "schooling");
  const examChips = allExams.length ? `<label class="fsel-label" for="examsel">Exam</label><select id="examsel" class="fsel"><option value="">All exams</option>${allExams.map(e => `<option value="${e}">${examLabel(e)}</option>`).join("")}</select>` : "";
  const allModes = [...new Set(items.map(x => x.mode).filter(Boolean))];
  const modeOptions = ["offline", "hybrid", "online"].filter(m => allModes.includes(m));
  const modeChips = allModes.length > 1
    ? `<select id="modesel" class="sr-only"><option value="">All modes</option>${modeOptions.map(m => `<option value="${m}">${modeLabel[m]}</option>`).join("")}</select>
<div class="mode-toggle" id="modetoggle" role="group" aria-label="Filter by mode">
<button type="button" class="mode-btn" data-mode="">All</button>
${modeOptions.map(m => `<button type="button" class="mode-btn" data-mode="${m}">${modeLabel[m]}</button>`).join("")}
</div>`
    : "";
  const title = isOnline ? oc.title(items.length) : `Best ${label} in ${cityL} (${items.length} listed)`;
  return head(`${title} — ${B.name}`,
    isOnline
      ? oc.metaDesc(items.length)
      : `Compare ${items.length} ${label.toLowerCase()} in ${cityL} with real student ratings, exam specialisations, addresses and establishment year.`) +
    header(isOnline && type === "coaching" ? "coaching-online.html" : `${typePage[type]}.html`) + `
<div class="container breadcrumb" aria-label="Breadcrumb"><a href="index.html">Home</a> / <a href="${typePage[type]}.html">${label}</a> / <span>${isOnline ? "Online" : cityL}</span></div>
<section class="listing-head container">
<h1>${h1}</h1>
<p class="hero-sub">${subNote}</p>
${cc && cc.intro ? `<div class="prose" style="margin-top:14px">${cc.intro}</div>` : ""}
<div class="filterbar">
<div class="filterbar-row">
${examChips}
${modeChips}
<label class="fsel-label" for="sortsel">Sort</label>
<select id="sortsel" class="fsel"><option value="rating">Recommended</option><option value="toprated">Top rated</option><option value="reviews">Most reviewed</option><option value="estd">Oldest first</option><option value="name">A–Z</option></select>
<label class="vcheck"><input type="checkbox" id="verifiedonly"> Verified only</label>
<span id="rescount" class="muted"></span>
</div>
</div>
</section>
<section class="section container"><div class="card-grid" id="cards">${items.map(card).join("")}</div>
<p id="noresults" class="muted" hidden>No listings match these filters. Try clearing them.</p></section>
${cc && cc.faqs ? `<section class="section container prose"><h2>Frequently asked questions</h2>${cc.faqs.map(f => `<h3 style="margin:18px 0 6px">${esc(f.q)}</h3><p>${esc(f.a)}</p>`).join("")}</section>` : ""}
<script type="application/ld+json">${JSON.stringify({
    "@context": "https://schema.org", "@type": "ItemList",
    "name": h1,
    "itemListElement": items.map((x, i) => ({ "@type": "ListItem", "position": i + 1, "name": x.name, "url": `${B.siteUrl}/institute-${x.slug}` }))
  })}</script>
${cc && cc.faqs ? `<script type="application/ld+json">${JSON.stringify({
    "@context": "https://schema.org", "@type": "FAQPage",
    "mainEntity": cc.faqs.map(f => ({ "@type": "Question", "name": f.q, "acceptedAnswer": { "@type": "Answer", "text": f.a } }))
  })}</script>` : ""}
<section class="section container cta-band">
<h2>Know a great ${typeLabel[type].toLowerCase()} in ${cityL} that's missing?</h2>
<p><a href="list-your-institute.html">Tell us</a> — or if you run it, list it free.</p>
</section>` + footer();
}

/* Dedicated cross-city page for "Online Coaching": coaching institutes don't use a
   pseudo-city like certification does, so this aggregates every institute whose own
   mode is online or hybrid, regardless of which city they're physically based in. */
function onlineCoachingPage() {
  const items = byType("coaching").filter(x => x.mode === "online" || x.mode === "hybrid")
    .sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0) || (b.rating || 0) * (b.ratingCount || 0) - (a.rating || 0) * (a.ratingCount || 0) || (b.ratingCount || 0) - (a.ratingCount || 0));
  const oc = onlineCopyFor("coaching");
  const allExams = [...new Set(items.flatMap(x => x.exams))].filter(e => e !== "schooling");
  const examChips = allExams.length ? `<label class="fsel-label" for="examsel">Exam</label><select id="examsel" class="fsel"><option value="">All exams</option>${allExams.map(e => `<option value="${e}">${examLabel(e)}</option>`).join("")}</select>` : "";
  const modeOptions = ["hybrid", "online"].filter(m => items.some(x => x.mode === m));
  const modeChips = modeOptions.length > 1
    ? `<select id="modesel" class="sr-only"><option value="">All modes</option>${modeOptions.map(m => `<option value="${m}">${modeLabel[m]}</option>`).join("")}</select>
<div class="mode-toggle" id="modetoggle" role="group" aria-label="Filter by mode">
<button type="button" class="mode-btn" data-mode="">All</button>
${modeOptions.map(m => `<button type="button" class="mode-btn" data-mode="${m}">${modeLabel[m]}</button>`).join("")}
</div>`
    : "";
  const title = oc.title(items.length);
  return head(`${title} — ${B.name}`, oc.metaDesc(items.length)) +
    header("coaching-online.html") + `
<div class="container breadcrumb" aria-label="Breadcrumb"><a href="index.html">Home</a> / <a href="coaching.html">Coaching</a> / <span>Online</span></div>
<section class="listing-head container">
<h1>${oc.h1}</h1>
<p class="hero-sub">${oc.subNote(items.length)}</p>
<div class="filterbar">
<div class="filterbar-row">
${examChips}
${modeChips}
<label class="fsel-label" for="sortsel">Sort</label>
<select id="sortsel" class="fsel"><option value="rating">Recommended</option><option value="toprated">Top rated</option><option value="reviews">Most reviewed</option><option value="estd">Oldest first</option><option value="name">A–Z</option></select>
<label class="vcheck"><input type="checkbox" id="verifiedonly"> Verified only</label>
<span id="rescount" class="muted"></span>
</div>
</div>
</section>
<section class="section container"><div class="card-grid" id="cards">${items.map(card).join("")}</div>
<p id="noresults" class="muted" hidden>No listings match these filters. Try clearing them.</p></section>
<script type="application/ld+json">${JSON.stringify({
    "@context": "https://schema.org", "@type": "ItemList",
    "name": oc.h1,
    "itemListElement": items.map((x, i) => ({ "@type": "ListItem", "position": i + 1, "name": x.name, "url": `${B.siteUrl}/institute-${x.slug}` }))
  })}</script>
<section class="section container cta-band">
<h2>Run an online or hybrid coaching program?</h2>
<p><a href="list-your-institute.html">List it free</a> and reach students comparing online options.</p>
</section>` + footer();
}

function detailPage(x) {
  const cityL = cityLabel(x.city);
  const exams = x.exams.filter(e => e !== "schooling");
  const mapsQ = encodeURIComponent(`${x.name}, ${x.address}`);
  const highlights = (x.highlights || []).map(h => `<li>${esc(h)}</li>`).join("");
  const listHref = x.city === "online" ? `${typePage[x.type]}.html` : `${typePage[x.type]}-${x.city}.html`;
  const others = byCity(x.type, x.city).filter(o => o.slug !== x.slug).slice(0, 3).map(card).join("");
  return head(`${x.name} — ${x.city === "online" ? (x.onlineCategory || onlineCopyFor(x.type).h1) : `${typeLabel[x.type]} in ${cityL}`} | ${B.name}`,
    `${x.name}, ${x.locality}, ${cityL}.${x.estd ? ` Established ${x.estd}.` : ""}${x.rating ? ` Rated ${x.rating.toFixed(1)}/5 by ${x.ratingCount} students.` : ""} Address, exams offered and enquiry details.`) +
    header(`${typePage[x.type]}.html`) + `
<div class="container breadcrumb" aria-label="Breadcrumb"><a href="index.html">Home</a> / <a href="${typePage[x.type]}.html">${typePlural[x.type]}</a> / <a href="${listHref}">${x.city === "online" ? "Online Platforms" : cityL}</a> / <span>${esc(x.name)}</span></div>
<section class="container detail-hero">
<div class="identity">
<span class="monogram ${grad(x.name)}" aria-hidden="true">${esc(x.name[0])}</span>
<div>
<h1>${esc(x.name)}</h1>
<div class="sub">${esc(x.address)}</div>
<div class="badges card-top" style="margin-top:12px;margin-bottom:0">${x.verified ? `<span class="badge badge-verified">✓ Verified listing</span>` : `<span class="badge badge-unverified">Details from public sources</span>`}${exams.map(e => `<span class="badge badge-type">${examLabel(e)}</span>`).join("")}${x.gender ? `<span class="badge badge-type">${x.gender === "Both" ? "Boys & Girls" : x.gender + " only"}</span>` : ""}</div>
</div>
</div>
<div class="factbar">
<div class="fact"><span>Student rating</span><b>${x.rating ? `<span class="star">★</span> ${x.rating.toFixed(1)} <small style="font-size:.72rem;color:var(--ink-3);font-family:var(--sans)">${x.ratingCount} reviews</small>` : "No reviews yet"}</b></div>
${x.googleRating ? `<div class="fact"><span>Google rating</span><b><span class="star">★</span> ${x.googleRating.toFixed(1)} <small style="font-size:.72rem;color:var(--ink-3);font-family:var(--sans)">${x.googleReviewCount} reviews</small></b></div>` : ""}
${x.estd ? `<div class="fact"><span>Established</span><b>${x.estd}</b></div>` : ""}
<div class="fact"><span>Mode</span><b>${modeLabel[x.mode] || (x.city === "online" ? "Online" : "Classroom")}</b></div>
${x.city !== "online" ? `<div class="fact"><span>Locality</span><b>${esc(x.locality)}</b></div>` : ""}
<div class="fact"><span>${x.city === "online" ? "Availability" : "City"}</span><b>${x.city === "online" ? onlineCopyFor(x.type).availability : cityL}</b></div>
${x.priceRange ? `<div class="fact"><span>Room plans</span><b>${x.priceRange}</b></div>` : ""}
</div>
</section>
<section class="container detail-body">
<div class="detail-main">
<h2>About ${esc(x.name)}</h2>
<p class="dropcap">${describe(x)}</p>
${highlights ? `<h2>Highlights</h2><ul class="hl-list">${highlights}</ul>` : ""}
${x.ecosystem ? `<h2>The ${esc(x.name)} ecosystem</h2><ul class="hl-list eco-list">${x.ecosystem.map(p => `<li><div><a href="${p.url}" rel="noopener"><strong>${esc(p.name)}</strong></a> — ${esc(p.desc)}${p.guideSlug ? ` <a href="${p.guideSlug}.html">Read our full guide →</a>` : ""}</div></li>`).join("")}</ul>` : ""}
<h2>Fees &amp; batches</h2>
<p>We don't publish fee tables unless the institute has confirmed them — outdated fee data misleads more than it helps. Use the enquiry card and you'll get current fees, batch timings and any scholarship tests directly.</p>
<div class="callout">Before enrolling anywhere: sit in one ordinary class of the batch you'd actually join, and get the all-in fee — material and test series included — in writing.</div>
<h2>Student reviews</h2>
${x.ratingCount ? `<div class="review-box"><div><div class="review-score">${x.rating ? x.rating.toFixed(1) : "–"}</div><div class="of">out of 5 · ${x.ratingCount} review${x.ratingCount === 1 ? "" : "s"}</div></div><p>Ratings are collected from students and published unedited — positive or negative.</p></div>` : `<p>No reviews yet.</p>`}
${x.googleRating ? `<div class="review-box review-box-google"><div><div class="review-score">${x.googleRating.toFixed(1)}</div><div class="of">out of 5 · ${x.googleReviewCount} reviews</div></div><p>As rated on Google, checked ${new Date().toLocaleString("en-IN", { month: "long", year: "numeric" })}. Separate from our own student ratings above.${x.city !== "online" ? ` <a href="https://www.google.com/maps/search/?api=1&query=${mapsQ}" rel="noopener">View on Google Maps →</a>` : ""}</p></div>` : ""}
${BRAND_REVIEWS.some(r => r.slug === x.slug) ? `<div class="callout">Read our full, in-depth review of ${esc(x.name)} — verdict, pricing and alumni outcomes. <a href="review-${x.slug}.html">Read the review →</a></div>` : ""}
<script type="application/ld+json">${JSON.stringify(Object.assign({
  "@context": "https://schema.org", "@type": "EducationalOrganization",
  "name": x.name, "url": `${B.siteUrl}/institute-${x.slug}`,
  "address": { "@type": "PostalAddress", "streetAddress": x.address, "addressLocality": x.city === "online" ? "Online" : cityL, "addressCountry": "IN" }
}, x.estd ? { "foundingDate": String(x.estd) } : {}, x.website ? { "sameAs": x.website } : {}, (x.rating && x.ratingCount) ? { "aggregateRating": { "@type": "AggregateRating", "ratingValue": x.rating, "reviewCount": x.ratingCount, "bestRating": 5 } } : {}))}</script>
</div>
<aside class="detail-side">
<div class="side-card">
<h3>Talk to this institute</h3>
<p class="muted">Free callback via our counselling team — no spam, ever.</p>
<form class="enq-form" action="https://formsubmit.co/${B.email}" method="POST">
<input type="hidden" name="_subject" value="New enquiry — ${esc(x.name)} (${cityL})">
<input type="hidden" name="_captcha" value="false">
<input type="hidden" name="_template" value="table">
<input type="hidden" name="_next" value="${B.siteUrl}/thanks">
<input type="text" name="_honey" style="display:none" tabindex="-1" autocomplete="off">
<input type="hidden" name="institute" value="${esc(x.name)} (${cityL})">
<label>Your name<input name="name" required autocomplete="name" placeholder="Full name"></label>
<label>Mobile<input name="phone" type="tel" required pattern="[0-9+ -]{10,15}" autocomplete="tel" placeholder="+91"></label>
<button class="btn btn-gold" type="submit">Request a callback</button>
</form>
</div>
<div class="side-card light">
<h3>Share your experience</h3>
<p class="muted">Studied here? Rate it. Reviews are checked before they're published, not posted instantly.</p>
<form class="enq-form review-form" action="https://formsubmit.co/${B.email}" method="POST">
<input type="hidden" name="_subject" value="New review — ${esc(x.name)} (${cityL})">
<input type="hidden" name="_captcha" value="false">
<input type="hidden" name="_template" value="table">
<input type="hidden" name="_next" value="${B.siteUrl}/thanks">
<input type="text" name="_honey" style="display:none" tabindex="-1" autocomplete="off">
<input type="hidden" name="institute" value="${esc(x.name)} (${cityL})">
<fieldset class="star-input">
<legend>Your rating</legend>
<input type="radio" id="r5-${x.slug}" name="rating" value="5"><label for="r5-${x.slug}" title="5 stars">★</label>
<input type="radio" id="r4-${x.slug}" name="rating" value="4"><label for="r4-${x.slug}" title="4 stars">★</label>
<input type="radio" id="r3-${x.slug}" name="rating" value="3"><label for="r3-${x.slug}" title="3 stars">★</label>
<input type="radio" id="r2-${x.slug}" name="rating" value="2"><label for="r2-${x.slug}" title="2 stars">★</label>
<input type="radio" id="r1-${x.slug}" name="rating" value="1" required><label for="r1-${x.slug}" title="1 star">★</label>
</fieldset>
<label>Your name<input name="name" required autocomplete="name" placeholder="Full name"></label>
<label>Your review<textarea name="review" required rows="4" placeholder="Faculty, batch size, results, fees — anything future students should know"></textarea></label>
<button class="btn btn-outline" type="submit">Submit review</button>
</form>
</div>
<div class="side-actions">
${x.website ? `<a class="action" href="${x.website}" rel="noopener nofollow"><span class="ic">↗</span> Official website <span class="arr">→</span></a>` : ""}
${x.city !== "online" ? `<a class="action" href="https://www.google.com/maps/search/?api=1&query=${mapsQ}" rel="noopener"><span class="ic">◎</span> Open in Google Maps <span class="arr">→</span></a>` : ""}
<a class="action" href="${listHref}"><span class="ic">≡</span> All ${x.city === "online" ? "online platforms" : `institutes in ${cityL}`} <span class="arr">→</span></a>
</div>
${others ? `<h3 class="side-h">Students also compared</h3><div class="side-cards">${others}</div>` : ""}
</aside>
</section>` + footer();
}

function simplePage(file, title, desc, bodyHtml, active) {
  return head(`${title} | ${B.name}`, desc) + header(active || "") + bodyHtml + footer();
}

/* ---------- static page bodies ---------- */
const aboutBody = `
<section class="hero hero-sm"><div class="container"><h1>About ${B.name}</h1>
<p class="hero-sub">We help students and parents compare coaching institutes — honestly.</p></div></section>
<section class="section container prose">
<h2>Why we exist</h2>
<p>Choosing a coaching institute is one of the biggest decisions in a student's life, and most of the information out there is either an advertisement or a guess. ${B.name} exists to put verified, comparable facts in one place: who teaches what, since when, where exactly, and what students actually say about it.</p>
<h2>How we work</h2>
<p>Every listing shows its verification status openly. A "Verified" badge means the institute has confirmed its details with us. Everything else is marked as sourced from public information, so you always know how much to trust what you're reading. Ratings come from students and cannot be bought, edited or hidden by institutes.</p>
<h2>For institutes</h2>
<p>Listing is free. Verified institutes get a badge, a richer profile and direct enquiries from students in their city. We never charge students, and we clearly separate any promoted placement from organic rankings.</p>
<p><a class="btn btn-primary" href="list-your-institute.html">List your institute</a></p>
</section>`;

const contactBody = `
<section class="hero hero-sm"><div class="container"><h1>Contact us</h1>
<p class="hero-sub">Questions, feedback, corrections or review submissions — we read everything.</p></div></section>
<section class="section container split">
<div class="prose">
<h2>Reach us directly</h2>
<p><strong>Students:</strong> ${B.email}<br><strong>Institutes &amp; business:</strong> ${B.email}</p>
<h2>Corrections</h2>
<p>Spotted outdated information on a listing? Tell us the page and what's wrong — corrections are our top priority and are usually live within 48 hours.</p>
</div>
<div class="side-card">
<h3>Send a message</h3>
<form class="enq-form" action="https://formsubmit.co/${B.email}" method="POST">
<input type="hidden" name="_subject" value="New enquiry — Online Coaching 4u contact form">
<input type="hidden" name="_captcha" value="false">
<input type="hidden" name="_template" value="table">
<input type="hidden" name="_next" value="${B.siteUrl}/thanks">
<input type="text" name="_honey" style="display:none" tabindex="-1" autocomplete="off">
<label>Your name<input name="name" required autocomplete="name"></label>
<label>Mobile<input name="phone" type="tel" required pattern="[0-9+ -]{10,15}" autocomplete="tel"></label>
<label>Message<textarea name="msg" rows="4" required></textarea></label>
<button class="btn btn-primary" type="submit">Send message</button>
</form>
</div>
</section>`;

const listBody = `
<section class="hero hero-sm"><div class="container"><h1>List your institute — free</h1>
<p class="hero-sub">Reach students actively comparing options in your city. No listing fee, ever.</p></div></section>
<section class="section container split">
<div class="prose">
<h2>What you get</h2>
<p><strong>A complete profile</strong> — courses, photos, results, address and direct enquiry buttons.<br>
<strong>A verified badge</strong> — once we confirm your details, students see your listing is trustworthy.<br>
<strong>Direct leads</strong> — enquiries go straight to you, not through a paywall.</p>
<h2>What we ask in return</h2>
<p>Accuracy. Keep your details current, and let student reviews stand — we don't remove negative reviews unless they violate our guidelines.</p>
</div>
<div class="side-card">
<h3>Registration</h3>
<form class="enq-form" action="https://formsubmit.co/${B.email}" method="POST">
<input type="hidden" name="_subject" value="New institute registration — Online Coaching 4u">
<input type="hidden" name="_captcha" value="false">
<input type="hidden" name="_template" value="table">
<input type="hidden" name="_next" value="${B.siteUrl}/thanks">
<input type="text" name="_honey" style="display:none" tabindex="-1" autocomplete="off">
<label>Institute name<input name="institute" required></label>
<label>Your name<input name="name" required></label>
<label>Mobile<input name="phone" type="tel" required pattern="[0-9+ -]{10,15}"></label>
<label>City<input name="city" required></label>
<button class="btn btn-primary" type="submit">Register free</button>
</form>
<p class="muted">By registering you agree to our <a href="terms.html">Terms</a> and <a href="privacy.html">Privacy Policy</a>.</p>
</div>
</section>`;

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
  return `<a class="card post-card" href="${p.slug}.html">
<div class="card-media blog-thumb${p.image ? "" : " noimg"}">${p.image ? `<img src="${p.image}?v=${ASSET_V}" alt="${esc(p.imageAlt || p.title)}" loading="lazy" onerror="this.parentNode.classList.add('noimg')">` : `<span class="media-initial" aria-hidden="true">${esc(p.title[0])}</span>`}<span class="card-pill">${esc(postExam(p).label)}</span></div>
<div class="card-body">
<span class="muted">${p.date} · ${p.minutes} min read</span>
<h3>${esc(p.title)}</h3>
<p class="card-loc">${esc(p.excerpt)}</p>
<div class="card-foot"><span></span><span class="card-cta">Read article →</span></div>
</div></a>`;
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
  return `
<section class="hero hero-sm"><div class="container"><h1>Guides &amp; Articles</h1>
<p class="hero-sub">Original, research-backed articles on choosing coaching, preparing for exams and student life. Pick your exam or the kind of article you need — written by our team, no sponsored content unless clearly labelled.</p></div></section>
<section class="section container" style="padding-top:36px">
${blogChipRow(null)}
<div class="filterbar"><div class="filterbar-row"><label class="fsel-label" for="examsel">Exam</label><select id="examsel" class="fsel"><option value="">All exams</option>${BLOG_EXAMS.map(g => `<option value="${g.key}">${esc(g.label)}</option>`).join("")}</select>
<label class="fsel-label" for="modesel">Type</label><select id="modesel" class="fsel"><option value="">All types</option>${BLOG_TYPES.map(t => `<option value="${t.key}">${esc(t.label)}</option>`).join("")}</select><span id="rescount" class="muted"></span></div></div>
<div class="card-grid" id="cards" style="margin-top:22px">${POSTS_BY_DATE.map(blogCard).join("")}</div>
<p id="noresults" class="muted" hidden style="margin-top:20px">No articles match these filters yet — try another exam or type.</p>
</section>`;
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
  const coachLink = kind === "exam" && item.exam ? `<p style="margin-top:18px"><a class="link-arrow" href="coaching.html?exam=${item.exam}">Compare ${esc(item.label.split(/[ ,&]/)[0])} coaching institutes →</a></p>` : "";
  return head(`${title} | ${B.name}`, desc)
    .replace("</head>", ld.map(o => `<script type="application/ld+json">${JSON.stringify(o)}</script>`).join("\n") + "\n</head>")
    + header("blog.html") + `
<div class="container breadcrumb" aria-label="Breadcrumb"><a href="index.html">Home</a> / <a href="blog.html">Blogs</a> / <span>${esc(item.label)}</span></div>
<section class="hero hero-sm" style="padding-top:34px"><div class="container"><p class="eyebrow">${kind === "exam" ? "Blogs by exam" : "Blogs by type"}</p><h1>${esc(h1)}</h1>
<p class="hero-sub">${esc(item.intro)}</p>${coachLink}</div></section>
<section class="section container" style="padding-top:36px">
${blogChipRow(item)}
${sections.map(s => `${s.t ? `<h2 class="blog-sec-h" id="${s.t.key}">${esc(s.t.label)} <span class="muted">(${s.ps.length})</span></h2>` : ""}<div class="card-grid" style="margin-top:18px">${s.ps.map(postCard).join("")}</div>`).join("\n")}
</section>` + footer();
}
/* ---------- reviews hub ---------- */
function reviewsIndex() {
  const cards = REVIEWS.map(r => {
    const x = L.find(o => o.slug === r.slug);
    if (!x) return "";
    const cityL = cityLabel(x.city);
    const mapsQ = encodeURIComponent(`${x.name}, ${x.address}`);
    const ownChip = x.ratingCount
      ? `<span class="rating-chip"><span class="star">★</span> ${x.rating.toFixed(1)} <span class="muted">${x.ratingCount} student review${x.ratingCount === 1 ? "" : "s"} on ${esc(B.name)}</span></span>`
      : `<span class="rating-chip"><span class="muted">No student reviews yet on ${esc(B.name)}</span></span>`;
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
    return `<article class="card review-hub-card">
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
    return `<article class="card review-hub-card">
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
<section class="hero hero-sm"><div class="container"><h1>Reviews</h1>
<p class="hero-sub">Independent, in-depth reviews of coaching institutes, professional certifications and individual coaches — built from our own research and verified facts, not paid placements.</p></div></section>
<section class="section container prose">
<p>Some reviews below link straight back to real, public quotes from students on Reddit and Google — nothing edited, summarised out of context, or paid for. Others are full, in-depth write-ups based on our own research into an institute, certification provider or coach, covering the same ground: credentials, offerings, results and client feedback, checked as thoroughly as we can against public information.</p>
</section>
<section class="section container">
<div class="review-hub-list">${cards}${brandCards}</div>
</section>
<section class="section container cta-band">
<h2>Know one of these institutes, coaches or programs personally?</h2>
<p>Reviews here are unedited and can't be bought or removed. <a href="list-your-institute.html">Tell us what's missing</a> or use the review form on any institute's page.</p>
</section>`;
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
    ? `<span class="rating-chip"><span class="star">★</span> ${x.rating.toFixed(1)} <span class="muted">${x.ratingCount} student review${x.ratingCount === 1 ? "" : "s"} on ${esc(B.name)}</span></span>`
    : `<span class="rating-chip"><span class="muted">No student reviews yet on ${esc(B.name)}</span></span>`;
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
<div class="container breadcrumb" aria-label="Breadcrumb"><a href="index.html">Home</a> / <a href="reviews.html">Reviews</a> / <span>${esc(x.name)}</span></div>
<section class="container detail-hero">
<div class="identity">
<span class="monogram ${grad(x.name)}" aria-hidden="true">${esc(x.name[0])}</span>
<div>
<h1>${esc(rv.headline)}</h1>
<div class="sub">${esc(rv.subheadline)}</div>
</div>
</div>
</section>
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
</section>` + footer();
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
  return `<a class="card ai-card" href="${aiToolFile(t)}">
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
<div class="card-grid">${list.map(aiCard).join("")}</div>
<div class="prose ai-compare"><h4>Quick comparison</h4>${aiCompareTable(list)}</div>
</div>`;
  const section = (aud, list, intro) => {
    const groups = AI_GROUPS[aud];
    const inner = groups
      ? groups.map(g => { const gl = list.filter(t => (t.group || groups[0].key) === g.key); return gl.length ? groupBlock(g, gl) : ""; }).join("")
      : `<div class="card-grid">${list.map(aiCard).join("")}</div>
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
    + header("ai-tools.html") + `
<section class="hero hero-sm"><div class="container">
<p class="eyebrow">AI Tools</p>
<h1>AI Tools for Learners &amp; Institutes in India</h1>
<p class="hero-sub">Hand-picked AI tools that genuinely help Indian students prepare for exams and help coaching institutes teach, test and grow — researched from official sources, with honest pros, cons and prices in ₹.</p>
<div class="ai-jump"><a class="btn btn-primary" href="#for-learners">For Learners</a><a class="btn btn-ghost" href="#for-institutes">For Institutes</a></div>
</div></section>
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
<section class="section container cta-band">
<h2>Built an AI tool for Indian education?</h2><p>Tell us about it — we review tools that genuinely help learners and institutes.</p>
<a class="btn btn-primary" href="contact.html">Contact us</a>
</section>` + footer();
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
<div class="container breadcrumb" aria-label="Breadcrumb"><a href="index.html">Home</a> / <a href="ai-tools.html">AI Tools</a> / <a href="ai-tools.html#${aud.anchor}">${aud.label}</a> / <span>${esc(aiShort(t))}</span></div>
<section class="container detail-hero">
<div class="identity">
<span class="monogram ${grad(t.name)}" aria-hidden="true">${esc(t.name[0])}</span>
<div>
<h1>${esc(t.name)}: ${t.audience === "learners" ? "AI Tool for Students in India" : "AI Tool for Coaching Institutes"}</h1>
<div class="sub">${esc(t.tagline)}</div>
<div class="badges"><span class="badge badge-type">${aud.label}</span><span class="chip chip-price">${esc(t.priceChip)}</span><span class="chip">by ${esc(t.maker)}</span></div>
<div class="ai-hero-cta">${aiVisitBtn(t, "btn-primary")}</div>
</div>
</div>
</section>
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
</section>` + footer();
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
  const shareUrl = `${B.siteUrl}/${p.slug}`;
  const tocSidebar = tocItems.length > 1 ? `<div class="post-toc-card">
<p class="toc-title">Table of Contents</p>
<ul class="toc-list">${tocItems.map((it, i) => `<li><a href="#${it.id}">${String(i + 1).padStart(2, "0")}. ${it.text}</a></li>`).join("")}</ul>
</div>` : "";
  return head(`${p.title} | ${B.name}`, p.excerpt, p.image).replace("</head>", `<meta property="article:published_time" content="${iso}">\n<script type="application/ld+json">${JSON.stringify(articleLd)}</script>\n${faqLd ? `<script type="application/ld+json">${JSON.stringify(faqLd)}</script>\n` : ""}</head>`) + header("blog.html") + `
<section class="post-hero">
<div class="container post-hero-inner${p.image ? "" : " post-hero-inner-solo"}">
<div class="post-hero-text">
<a class="post-back" href="blog.html">← Back to Blogs</a>
<a class="post-pill" href="${blogExamFile(postExam(p))}">${esc(postExam(p).label)}</a> <a class="post-pill" href="${blogTypeFile(postType(p))}">${esc(postType(p).label)}</a>
<h1>${esc(p.title)}</h1>
<div class="post-meta-row"><span>${p.date}</span><span>${p.minutes} min read</span></div>
</div>
${p.image ? `<div class="post-hero-media"><img src="${p.image}?v=${ASSET_V}" alt="${esc(p.imageAlt || p.title)}" loading="lazy"></div>` : ""}
</div>
</section>
<section class="section container post-layout">
<aside class="post-sidebar">
${tocSidebar}
<div class="post-share"><span>Share this article:</span><div class="post-share-icons">
<a href="https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}" rel="noopener" target="_blank" aria-label="Share on LinkedIn">in</a>
<a href="https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&amp;text=${encodeURIComponent(p.title)}" rel="noopener" target="_blank" aria-label="Share on X">𝕏</a>
</div></div>
</aside>
<article class="post-body prose article-body">
<p class="muted">By the ${B.name} team</p>
${bodyHtml}
${faqHtml}
</article>
</section>
${p.cta ? `<div class="post-sticky-cta" id="postStickyCta">
<div class="container post-sticky-inner">
<p>Ready to compare verified options?</p>
<a class="btn btn-primary btn-sm" href="${p.cta.href}">${esc(p.cta.text)}</a>
<button class="post-sticky-close" type="button" aria-label="Dismiss" onclick="document.getElementById('postStickyCta').style.display='none'">✕</button>
</div>
</div>` : ""}
<section class="section container post-related"><h2>More From Our Guides</h2><div class="card-grid" style="margin-top:26px">${more.map(postCard).join("")}</div></section>`;
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
w("coaching.html", hubPage("coaching", "Find Your Coaching Institute", `Compare ${stats.coaching} coaching institutes for IAS, JEE, NEET, SSC and more — with real student ratings.`));

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
<h1>Thank you — we've got it ✓</h1>
<p class="hero-sub">Your enquiry has been sent to our counselling team. We typically respond within one working day. Meanwhile, feel free to keep exploring.</p>
<p style="margin-top:24px;display:flex;gap:12px;flex-wrap:wrap"><a class="btn btn-primary" href="index.html">Back to homepage</a><a class="btn btn-ghost" href="coaching.html">Browse institutes</a></p>
</div></section>`).replace('<meta name="robots" content="index, follow">', '<meta name="robots" content="noindex, follow">'));

/* 404 page */
w("404.html", simplePage("404.html", "Page Not Found", "This page does not exist.", `
<section class="hero hero-sm"><div class="container">
<h1>Page not found</h1>
<p class="hero-sub">The page you're looking for doesn't exist or was moved.</p>
<p style="margin-top:20px"><a class="btn btn-primary" href="index.html">Go to homepage</a></p>
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
  `<svg xmlns="http://www.w3.org/2000/svg" width="34" height="34" viewBox="0 0 34 34"><rect width="34" height="34" rx="8" fill="#4f46e5"/><path d="M17 8l10 5-10 5L7 13l10-5z" fill="#fff"/><path d="M12 16.5v4c0 1.5 2.2 3 5 3s5-1.5 5-3v-4l-5 2.5-5-2.5z" fill="#c7d2fe"/></svg>\n`);

const count = fs.readdirSync(OUT).filter(f => f.endsWith(".html")).length;
console.log(`Built ${count} HTML pages into ${OUT} (+ sitemap.xml, robots.txt, favicon.svg)`);
