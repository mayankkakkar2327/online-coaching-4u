/* Online Coaching 4u — static site generator. Run: node build.js */
const fs = require("fs");
const path = require("path");

const DATA = JSON.parse(fs.readFileSync(path.join(__dirname, "data.json"), "utf8"));
const POSTS = require("./posts.js");
const OUT = path.join(__dirname, "..", "website");

/* wipe previous build output so removed/renamed pages don't linger as stale files */
if (fs.existsSync(OUT)) fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
const B = DATA.brand;
const L = DATA.listings;
const EX = DATA.examLabels;

const cityLabel = (c) => c === "online" ? "Online (Pan-India)" : c.split("-").map(w => w[0].toUpperCase() + w.slice(1)).join(" ");
const examLabel = (e) => EX[e] || e.toUpperCase();
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const slugify = (s) => String(s).toLowerCase().replace(/<[^>]*>/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

/* Scans article HTML for <h2>/<h3> headings, tags each with a unique id,
   and returns a nested table-of-contents nav alongside the id-annotated HTML. */
function buildToc(html) {
  const used = new Set();
  const items = [];
  const withIds = html.replace(/<(h2|h3)>(.*?)<\/\1>/gs, (match, tag, text) => {
    let id = slugify(text) || "section";
    let unique = id, n = 2;
    while (used.has(unique)) { unique = `${id}-${n++}`; }
    used.add(unique);
    items.push({ tag, text, id: unique });
    return `<${tag} id="${unique}">${text}</${tag}>`;
  });
  if (items.length < 2) return { html, tocHtml: "" };
  let list = "", h2Open = false, subOpen = false;
  for (const it of items) {
    if (it.tag === "h2") {
      if (subOpen) { list += "</ul>"; subOpen = false; }
      if (h2Open) list += "</li>";
      list += `<li><a href="#${it.id}">${it.text}</a>`;
      h2Open = true;
    } else {
      if (!subOpen) { list += "<ul>"; subOpen = true; }
      list += `<li><a href="#${it.id}">${it.text}</a></li>`;
    }
  }
  if (subOpen) list += "</ul>";
  if (h2Open) list += "</li>";
  const tocHtml = `<nav class="toc" aria-label="Table of contents"><p class="toc-title">Contents</p><ul>${list}</ul></nav>`;
  return { html: withIds, tocHtml };
}
const typeLabel = { coaching: "Coaching" };
const typePlural = { coaching: "Coaching Institutes" };
const typePage = { coaching: "coaching" };

const byType = (t) => L.filter(x => x.type === t);
const byCity = (t, c) => byType(t)
  .filter(x => c === "online" ? x.online === true : x.city === c)
  .sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0) || (b.rating || 0) * (b.ratingCount || 0) - (a.rating || 0) * (a.ratingCount || 0) || (b.ratingCount || 0) - (a.ratingCount || 0));

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
const CSS_LINK = `<link rel="stylesheet" href="assets/style.css">`;

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
  const nav = [["coaching.html", "Coaching"], ["blog.html", "Blogs"], ["about.html", "About"]];
  return `<header class="site-header${dark ? " header-dark" : ""}">
<div class="container header-inner">
<a class="logo" href="index.html" aria-label="${B.name} home">${LOGO}<span>${B.name}</span></a>
<nav class="main-nav" aria-label="Main navigation">
${nav.map(([h, t]) => `<a href="${h}"${active === h ? ' class="active" aria-current="page"' : ""}>${t}</a>`).join("\n")}
</nav>
<a class="btn ${dark ? "btn-primary" : "btn-dark"} btn-sm" href="contact.html">Contact us</a>
<button class="nav-toggle" aria-label="Open menu" onclick="document.body.classList.toggle('nav-open')">☰</button>
</div>
</header>`;
}

function footer() {
  const coachingCities = DATA.cities.coaching.map(c => `<li><a href="coaching-${c}.html">${c === "online" ? "Online CAT / MBA Coaching" : `Coaching in ${cityLabel(c)}`}</a></li>`).join("");
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
<li><a href="list-your-institute.html">List Your Institute</a></li>
<li><a href="sitemap.html">Sitemap</a></li>
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
<script src="assets/app.js"></script>
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
  return `<a class="card" href="institute-${x.slug}.html" data-exams="${x.exams.join(",")}" data-verified="${x.verified}" data-featured="${x.featured ? 1 : 0}" data-rating="${x.rating || 0}" data-reviews="${x.ratingCount || 0}" data-estd="${x.estd || 9999}" data-name="${esc(x.name.toLowerCase())}">
<div class="card-top">${x.featured ? `<span class="badge badge-pick" title="Genuine editorial recommendation — not paid placement">★ Editor's Pick</span>` : ""}${x.verified ? `<span class="badge badge-verified" title="Details verified with the institute">✓ Verified</span>` : ""}<span class="badge badge-type">${typeLabel[x.type]}</span>${x.online ? `<span class="badge badge-online">Online</span>` : ""}</div>
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
  const glyphs = { ias: "§", jee: "∆", neet: "✚", cat: "◆", ssc: "¶", clat: "⚖", nda: "✦", bank: "₹", teaching: "✎", cuet: "◎" };
  const examCards = [["ias"], ["jee"], ["neet"], ["cat"], ["ssc"], ["clat"], ["nda"], ["bank"], ["teaching"], ["cuet"]]
    .map(([e]) => e === "cat"
      ? `<a class="tile" href="coaching-online.html"><span class="tile-ic" aria-hidden="true">${glyphs[e]}</span><strong>${examLabel(e)}</strong><span class="muted">Compare online platforms</span></a>`
      : `<a class="tile" href="coaching-sikar.html?exam=${e}" onclick="this.href='coaching-'+(localStorage.getItem('oc4u-city')||'sikar')+'.html?exam=${e}'"><span class="tile-ic" aria-hidden="true">${glyphs[e]}</span><strong>${examLabel(e)}</strong><span class="muted">Find coaching</span></a>`).join("");
  const cityCards = DATA.cities.coaching.map(c => {
    const n = byCity("coaching", c).length;
    return `<a class="tile tile-city" href="coaching-${c}.html"><strong>${cityLabel(c)}</strong><span class="muted">${n} institutes listed</span></a>`;
  }).join("");
  const topRated = [...byType("coaching")].sort((a, b) => (b.rating || 0) * Math.log((b.ratingCount || 0) + 1) - (a.rating || 0) * Math.log((a.ratingCount || 0) + 1));
  const featured = topRated.slice(0, 6).map(card).join("");
  const minis = topRated.slice(0, 4).map(x => `<a class="mini" href="institute-${x.slug}.html"><span class="avatar ${grad(x.name)}">${esc(x.name[0])}</span><div><b>${esc(x.name)}</b><span>${esc(x.locality)}${x.estd ? ` · Since ${x.estd}` : ""}</span></div><span class="score">★ ${x.rating ? x.rating.toFixed(1) : "—"}</span></a>`).join("");
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
<div class="principle"><span class="num">03</span><div><b>No paid rankings</b><span>Order is earned by ratings. Our recommendations are genuine and unpaid.</span></div></div>
<div class="principle"><span class="num">04</span><div><b>Free for students</b><span>Comparing, enquiring and reviewing costs nothing. Ever.</span></div></div>
</div>
</div>
</section>
<section class="section container" style="padding-top:16px">
<div class="sec-head"><div><div class="eyebrow">Explore</div><h2>Browse by city</h2></div></div>
<div class="tile-grid">${cityCards}</div>
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
  const cities = DATA.cities[typePage[type]];
  const cityCards = cities.map(c => {
    const items = byCity(type, c);
    const top = items[0];
    return `<a class="tile tile-city" href="${typePage[type]}-${c}.html"><strong>${cityLabel(c)}</strong><span class="muted">${items.length} listed${top && top.rating ? ` · top rated ${top.rating.toFixed(1)}★` : ""}</span></a>`;
  }).join("");
  const featured = [...byType(type)].sort((a, b) => (b.rating || 0) * Math.log((b.ratingCount || 0) + 1) - (a.rating || 0) * Math.log((a.ratingCount || 0) + 1)).slice(0, 6).map(card).join("");
  return head(`${title} — ${B.name}`, sub) + header(`${typePage[type]}.html`) + `
<section class="hero hero-sm"><div class="container">
<h1>${title}</h1><p class="hero-sub">${sub}</p>${searchBox()}
</div></section>
<section class="section container"><h2>Browse by city</h2><div class="tile-grid">${cityCards}</div></section>
<section class="section container"><h2>Highest rated</h2><div class="card-grid">${featured}</div></section>
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
  const h1 = isOnline ? "Online CAT / MBA Coaching Platforms" : `${label} in ${cityL}`;
  const subNote = isOnline
    ? `${items.length} platforms compared — pure-online brands plus the online programs of major classroom institutes. Facts only: founders, formats and track record. No paid rankings — any standout recommendation on this page is based on verifiable facts, not payment, and nobody pays for placement.`
    : `${items.length} listed · sorted by student rating by default. All information shown is baked into this page — nothing hidden behind loading spinners.`;
  const allExams = [...new Set(items.flatMap(x => x.exams))].filter(e => e !== "schooling");
  const examChips = allExams.length ? `<div class="filterbar-row" role="group" aria-label="Filter by exam"><span class="filterbar-label">Exam:</span><button class="fchip active" data-exam="">All</button>${allExams.map(e => `<button class="fchip" data-exam="${e}">${examLabel(e)}</button>`).join("")}</div>` : "";
  const title = isOnline ? `Best Online CAT / MBA Coaching (${items.length} compared)` : `Best ${label} in ${cityL} (${items.length} listed)`;
  return head(`${title} — ${B.name}`,
    isOnline
      ? `Compare ${items.length} online CAT and MBA entrance coaching platforms — Rodha, Cracku, iQuanta, IMS, Career Launcher and more. Verified facts, no paid rankings.`
      : `Compare ${items.length} ${label.toLowerCase()} in ${cityL} with real student ratings, exam specialisations, addresses and establishment year.`) +
    header(`${typePage[type]}.html`) + `
<div class="container breadcrumb" aria-label="Breadcrumb"><a href="index.html">Home</a> / <a href="${typePage[type]}.html">${label}</a> / <span>${isOnline ? "Online" : cityL}</span></div>
<section class="listing-head container">
<h1>${h1}</h1>
<p class="hero-sub">${subNote}</p>
${cc && cc.intro ? `<div class="prose" style="margin-top:14px">${cc.intro}</div>` : ""}
<div class="filterbar">
${examChips}
<div class="filterbar-row">
<span class="filterbar-label">Sort:</span>
<select id="sortsel"><option value="rating">Top rated</option><option value="reviews">Most reviewed</option><option value="estd">Oldest first</option><option value="name">A–Z</option></select>
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

function detailPage(x) {
  const cityL = cityLabel(x.city);
  const exams = x.exams.filter(e => e !== "schooling");
  const mapsQ = encodeURIComponent(`${x.name}, ${x.address}`);
  const highlights = (x.highlights || []).map(h => `<li>${esc(h)}</li>`).join("");
  const listHref = `${typePage[x.type]}-${x.city}.html`;
  const others = byCity(x.type, x.city).filter(o => o.slug !== x.slug).slice(0, 3).map(card).join("");
  return head(`${x.name} — ${x.city === "online" ? "Online CAT / MBA Coaching" : `${typeLabel[x.type]} in ${cityL}`} | ${B.name}`,
    `${x.name}, ${x.locality}, ${cityL}. Established ${x.estd}.${x.rating ? ` Rated ${x.rating.toFixed(1)}/5 by ${x.ratingCount} students.` : ""} Address, exams offered and enquiry details.`) +
    header(`${typePage[x.type]}.html`) + `
<div class="container breadcrumb" aria-label="Breadcrumb"><a href="index.html">Home</a> / <a href="${typePage[x.type]}.html">${typePlural[x.type]}</a> / <a href="${listHref}">${cityL}</a> / <span>${esc(x.name)}</span></div>
<section class="container detail-hero">
<div class="identity">
<span class="monogram ${grad(x.name)}" aria-hidden="true">${esc(x.name[0])}</span>
<div>
<h1>${esc(x.name)}</h1>
<div class="sub">${esc(x.address)}</div>
<div class="badges card-top" style="margin-top:12px;margin-bottom:0">${x.featured ? `<span class="badge badge-pick">★ Editor's Pick</span>` : ""}${x.verified ? `<span class="badge badge-verified">✓ Verified listing</span>` : `<span class="badge badge-unverified">Details from public sources</span>`}${exams.map(e => `<span class="badge badge-type">${examLabel(e)}</span>`).join("")}${x.gender ? `<span class="badge badge-type">${x.gender === "Both" ? "Boys & Girls" : x.gender + " only"}</span>` : ""}</div>
</div>
</div>
<div class="factbar">
<div class="fact"><span>Student rating</span><b>${x.rating ? `<span class="star">★</span> ${x.rating.toFixed(1)} <small style="font-size:.72rem;color:var(--ink-3);font-family:var(--sans)">${x.ratingCount} reviews</small>` : "No reviews yet"}</b></div>
${x.estd ? `<div class="fact"><span>Established</span><b>${x.estd}</b></div>` : ""}
<div class="fact"><span>${x.city === "online" ? "Mode" : "Locality"}</span><b>${x.city === "online" ? "100% Online" : esc(x.locality)}</b></div>
<div class="fact"><span>${x.city === "online" ? "Availability" : "City"}</span><b>${x.city === "online" ? "Pan-India" : cityL}</b></div>
${x.priceRange ? `<div class="fact"><span>Room plans</span><b>${x.priceRange}</b></div>` : ""}
</div>
</section>
<section class="container detail-body">
<div class="detail-main">
<h2>About ${esc(x.name)}</h2>
<p class="dropcap">${describe(x)}</p>
${highlights ? `<h2>Highlights</h2><ul class="hl-list">${highlights}</ul>` : ""}
<h2>Fees &amp; batches</h2>
<p>We don't publish fee tables unless the institute has confirmed them — outdated fee data misleads more than it helps. Use the enquiry card and you'll get current fees, batch timings and any scholarship tests directly.</p>
<div class="callout">Before enrolling anywhere: sit in one ordinary class of the batch you'd actually join, and get the all-in fee — material and test series included — in writing.</div>
<h2>Student reviews</h2>
${x.ratingCount ? `<div class="review-box"><div><div class="review-score">${x.rating ? x.rating.toFixed(1) : "–"}</div><div class="of">out of 5 · ${x.ratingCount} review${x.ratingCount === 1 ? "" : "s"}</div></div><p>Ratings are collected from students and published unedited — positive or negative.</p></div>` : `<p>No reviews yet.</p>`}
<script type="application/ld+json">${JSON.stringify(Object.assign({
  "@context": "https://schema.org", "@type": "EducationalOrganization",
  "name": x.name, "url": `${B.siteUrl}/institute-${x.slug}`,
  "address": { "@type": "PostalAddress", "streetAddress": x.address, "addressLocality": x.city === "online" ? "Online" : cityL, "addressCountry": "IN" }
}, x.estd ? { "foundingDate": String(x.estd) } : {}, x.website ? { "sameAs": x.website } : {}, (x.rating && x.ratingCount) ? { "aggregateRating": { "@type": "AggregateRating", "ratingValue": x.rating, "reviewCount": x.ratingCount, "bestRating": 5 } } : {}))}</script>
<p>Studied here? <a href="contact.html">Share your experience</a> — honest reviews (positive or negative) are published as-is.</p>
</div>
<aside class="detail-side">
<div class="side-card">
<h3>Talk to this institute</h3>
<p class="muted">Free callback via our counselling team — no spam, ever.</p>
<form class="enq-form" action="https://formsubmit.co/${B.email}" method="POST">
<input type="hidden" name="_subject" value="New enquiry — ${esc(x.name)} (${cityL})">
<input type="hidden" name="_captcha" value="false">
<input type="hidden" name="_template" value="table">
<input type="hidden" name="institute" value="${esc(x.name)} (${cityL})">
<label>Your name<input name="name" required autocomplete="name" placeholder="Full name"></label>
<label>Mobile<input name="phone" type="tel" required pattern="[0-9+ -]{10,15}" autocomplete="tel" placeholder="+91"></label>
<button class="btn btn-gold" type="submit">Request a callback</button>
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
function postCard(p) {
  return `<a class="card post-card" href="${p.slug}.html">
<div class="card-media blog-thumb${p.image ? "" : " noimg"}">${p.image ? `<img src="${p.image}" alt="${esc(p.imageAlt || p.title)}" loading="lazy" onerror="this.parentNode.classList.add('noimg')">` : `<span class="media-initial" aria-hidden="true">${esc(p.title[0])}</span>`}</div>
<div class="card-body">
<div class="card-top"><span class="badge badge-type">${esc(p.category)}</span><span class="muted">${p.date} · ${p.minutes} min read</span></div>
<h3>${esc(p.title)}</h3>
<p class="card-loc">${esc(p.excerpt)}</p>
<div class="card-foot"><span></span><span class="card-cta">Read article →</span></div>
</div></a>`;
}
function blogIndex() {
  return `
<section class="hero hero-sm"><div class="container"><h1>Guides &amp; Articles</h1>
<p class="hero-sub">Original, research-backed articles on choosing coaching, preparing for exams and student life. Written by our team — no sponsored content unless clearly labelled.</p></div></section>
<section class="section container">
<div class="filterbar"><div class="filterbar-row" role="group" aria-label="Filter by category"><span class="filterbar-label">Topic:</span><button class="fchip active" data-exam="">All</button>${CATS.map(c => `<button class="fchip" data-exam="${esc(c)}">${esc(c)}</button>`).join("")}</div></div>
<div class="card-grid" id="cards" style="margin-top:22px">${POSTS.map(p => `<div data-exams="${esc(p.category)}" style="display:contents">${postCard(p)}</div>`).join("")}</div>
</section>`;
}
function postPage(p) {
  const { html: bodyHtml, tocHtml } = buildToc(p.html);
  const related = POSTS.filter(o => o.slug !== p.slug && o.category === p.category).slice(0, 2);
  const more = related.length ? related : POSTS.filter(o => o.slug !== p.slug).slice(0, 2);
  const iso = toISODate(p.date);
  const articleLd = {
    "@context": "https://schema.org", "@type": "BlogPosting",
    headline: p.title, description: p.excerpt,
    ...(p.image ? { image: [`${B.siteUrl}/${p.image}`] } : {}),
    author: { "@type": "Organization", name: `${B.name} Team`, url: B.siteUrl },
    publisher: { "@type": "Organization", name: B.name, url: B.siteUrl },
    datePublished: iso, dateModified: iso,
    mainEntityOfPage: { "@type": "WebPage", "@id": `${B.siteUrl}/${p.slug}` }
  };
  return head(`${p.title} | ${B.name}`, p.excerpt, p.image).replace("</head>", `<meta property="article:published_time" content="${iso}">\n<script type="application/ld+json">${JSON.stringify(articleLd)}</script>\n</head>`) + header("blog.html") + `
<div class="container breadcrumb" aria-label="Breadcrumb"><a href="index.html">Home</a> / <a href="blog.html">Guides</a> / <span>${esc(p.title)}</span></div>
<article class="section container prose article-body">
<p class="muted">${esc(p.category)} · ${p.date} · ${p.minutes} min read · By the ${B.name} team</p>
<h1>${esc(p.title)}</h1>
${p.image ? `<div class="detail-media blog-thumb" style="margin:20px 0"><img src="${p.image}" alt="${esc(p.imageAlt || p.title)}" style="width:100%;height:100%;object-fit:cover" loading="lazy"></div>` : ""}
${tocHtml}
${bodyHtml}
<div class="cta-band" style="margin-top:36px"><h2>Ready to compare options?</h2><p>Every listing shows verified facts and unedited student ratings.</p><a class="btn btn-primary" href="${p.cta.href}">${esc(p.cta.text)}</a></div>
</article>
<section class="section container"><h2>More from our guides</h2><div class="card-grid" style="margin-top:18px">${more.map(postCard).join("")}</div></section>`;
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
  links.push(["index.html", "Home"], ["coaching.html", "Coaching"], ["blog.html", "Guides"], ["about.html", "About"], ["contact.html", "Contact"], ["list-your-institute.html", "List Your Institute"], ["privacy.html", "Privacy"], ["terms.html", "Terms"]);
  DATA.cities.coaching.forEach(c => links.push([`coaching-${c}.html`, `Coaching in ${cityLabel(c)}`]));
  const inst = L.map(x => `<li><a href="institute-${x.slug}.html">${esc(x.name)} — ${cityLabel(x.city)}</a></li>`).join("");
  return `<section class="hero hero-sm"><div class="container"><h1>Sitemap</h1></div></section>
<section class="section container prose">
<h2>Pages</h2><ul>${links.map(([h, t]) => `<li><a href="${h}">${t}</a></li>`).join("")}</ul>
<h2>All listings (${L.length})</h2><ul>${inst}</ul>
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
    u: `institute-${x.slug}.html`
  })),
  ...POSTS.map(p => ({ t: p.title, s: p.category, c: "Guide", u: `${p.slug}.html` }))
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
const w = (f, html) => {
  const withCanonical = html.replace("</head>", `<link rel="canonical" href="${canonical(f)}">\n<meta property="og:url" content="${canonical(f)}">\n</head>`);
  fs.writeFileSync(path.join(OUT, f), withCanonical);
  PAGES.push(f);
};

w("index.html", homePage());
w("coaching.html", hubPage("coaching", "Find Your Coaching Institute", `Compare ${stats.coaching} coaching institutes for IAS, JEE, NEET, SSC and more — with real student ratings.`));

DATA.cities.coaching.forEach(c => w(`coaching-${c}.html`, listingPage("coaching", c)));

L.forEach(x => w(`institute-${x.slug}.html`, detailPage(x)));

w("about.html", simplePage("about.html", "About Us", `Who we are and how ${B.name} keeps listings honest.`, aboutBody, "about.html"));
w("contact.html", simplePage("contact.html", "Contact Us", `Get in touch with the ${B.name} team.`, contactBody));
w("list-your-institute.html", simplePage("list-your-institute.html", "List Your Institute Free", `Register your coaching institute on ${B.name} for free.`, listBody));
w("blog.html", simplePage("blog.html", "Guides & Articles", "Original research-backed articles on coaching, exam preparation and student life.", blogIndex(), "blog.html"));
POSTS.forEach(p => w(`${p.slug}.html`, postPage(p) + footer()));
w("privacy.html", simplePage("privacy.html", "Privacy Policy", `${B.name} privacy policy.`, privacyBody));
w("terms.html", simplePage("terms.html", "Terms & Conditions", `${B.name} terms and conditions.`, termsBody));
w("sitemap.html", simplePage("sitemap.html", "Sitemap", `All pages on ${B.name}.`, sitemapBody()));

/* 404 page */
w("404.html", simplePage("404.html", "Page Not Found", "This page does not exist.", `
<section class="hero hero-sm"><div class="container">
<h1>Page not found</h1>
<p class="hero-sub">The page you're looking for doesn't exist or was moved.</p>
<p style="margin-top:20px"><a class="btn btn-primary" href="index.html">Go to homepage</a></p>
</div></section>`));

/* sitemap.xml + robots.txt for search engines */
const today = new Date().toISOString().slice(0, 10);
const urls = PAGES.filter(f => f !== "404.html").map(f =>
  `<url><loc>${canonical(f)}</loc><lastmod>${today}</lastmod></url>`).join("\n");
fs.writeFileSync(path.join(OUT, "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`);
fs.writeFileSync(path.join(OUT, "robots.txt"),
  `User-agent: *\nAllow: /\n\nSitemap: ${B.siteUrl}/sitemap.xml\n`);

/* favicon (SVG of the brand mark) */
fs.writeFileSync(path.join(OUT, "favicon.svg"),
  `<svg xmlns="http://www.w3.org/2000/svg" width="34" height="34" viewBox="0 0 34 34"><rect width="34" height="34" rx="8" fill="#4f46e5"/><path d="M17 8l10 5-10 5L7 13l10-5z" fill="#fff"/><path d="M12 16.5v4c0 1.5 2.2 3 5 3s5-1.5 5-3v-4l-5 2.5-5-2.5z" fill="#c7d2fe"/></svg>\n`);

const count = fs.readdirSync(OUT).filter(f => f.endsWith(".html")).length;
console.log(`Built ${count} HTML pages into ${OUT} (+ sitemap.xml, robots.txt, favicon.svg)`);
