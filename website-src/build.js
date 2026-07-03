/* Online Coaching 4u — static site generator. Run: node build.js */
const fs = require("fs");
const path = require("path");

const DATA = JSON.parse(fs.readFileSync(path.join(__dirname, "data.json"), "utf8"));
const POSTS = require("./posts.js");
const OUT = path.join(__dirname, "..", "website");
const B = DATA.brand;
const L = DATA.listings;
const EX = DATA.examLabels;

const cityLabel = (c) => c === "online" ? "Online (Pan-India)" : c.split("-").map(w => w[0].toUpperCase() + w.slice(1)).join(" ");
const examLabel = (e) => EX[e] || e.toUpperCase();
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const typeLabel = { coaching: "Coaching", schools: "School", hostel: "Hostel" };
const typePlural = { coaching: "Coaching Institutes", schools: "Schools", hostel: "Hostels" };
const typePage = { coaching: "coaching", schools: "schools", hostel: "hostels" };

const byType = (t) => L.filter(x => x.type === t);
const byCity = (t, c) => byType(t)
  .filter(x => c === "online" ? x.online === true : x.city === c)
  .sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0) || (b.rating || 0) * (b.ratingCount || 0) - (a.rating || 0) * (a.ratingCount || 0) || (b.ratingCount || 0) - (a.ratingCount || 0));

const stats = {
  listings: L.length,
  coaching: byType("coaching").length,
  schools: byType("schools").length,
  hostels: byType("hostel").length,
  cities: new Set(L.map(x => x.city)).size,
  reviews: L.reduce((s, x) => s + (x.ratingCount || 0), 0)
};

/* ---------- original, fact-based descriptions ---------- */
function describe(x) {
  if (x.about) return esc(x.about);
  const city = cityLabel(x.city);
  const exams = x.exams.filter(e => e !== "schooling").map(examLabel);
  const age = 2026 - x.estd;
  if (x.type === "hostel") {
    const who = x.gender === "Both" ? "both boys and girls" : x.gender === "Female" ? "girl students" : "boy students";
    return [
      `${x.name} is a student hostel in ${x.locality}, ${city}, offering accommodation for ${who}.`,
      `Located at ${x.address}, it is positioned close to the city's main coaching hubs, which keeps daily travel time short for students.`,
      x.priceRange ? `Room plans are available in the range of ${x.priceRange}.` : `Room plans and pricing are shared directly by the hostel on enquiry.`,
      `Before booking, we recommend visiting in person to check the rooms, mess, security arrangements and house rules.`
    ].join(" ");
  }
  if (x.type === "schools") {
    return [
      `${x.name} is a school in ${x.locality}, ${city} district, serving students since ${x.estd}.`,
      `The school is located at ${x.address}.`,
      age >= 20 ? `With over ${age} years of operation, it is an established name in the local community.` : `It is one of the newer schools in the area.`,
      `Parents can contact the school directly for details on classes offered, board affiliation, admission process and fees.`
    ].join(" ");
  }
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

function head(title, desc) {
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
<meta name="robots" content="index, follow">
<link rel="icon" href="favicon.svg" type="image/svg+xml">
${CSS_LINK}
</head>
<body>`;
}

function header(active) {
  const nav = [["coaching.html", "Coaching"], ["schools.html", "Schools"], ["hostels.html", "Hostels"], ["blog.html", "Guides"], ["about.html", "About"]];
  return `<header class="site-header">
<div class="container header-inner">
<a class="logo" href="index.html" aria-label="${B.name} home">
<svg width="34" height="34" viewBox="0 0 34 34" aria-hidden="true"><rect width="34" height="34" rx="8" fill="#4f46e5"/><path d="M17 8l10 5-10 5L7 13l10-5z" fill="#fff"/><path d="M12 16.5v4c0 1.5 2.2 3 5 3s5-1.5 5-3v-4l-5 2.5-5-2.5z" fill="#c7d2fe"/></svg>
<span>${B.name}</span>
</a>
<nav class="main-nav" aria-label="Main navigation">
${nav.map(([h, t]) => `<a href="${h}"${active === h ? ' class="active" aria-current="page"' : ""}>${t}</a>`).join("\n")}
</nav>
<a class="btn btn-primary btn-sm" href="contact.html">Get a Callback</a>
<button class="nav-toggle" aria-label="Open menu" onclick="document.body.classList.toggle('nav-open')">☰</button>
</div>
</header>`;
}

function footer() {
  const coachingCities = DATA.cities.coaching.map(c => `<li><a href="coaching-${c}.html">${c === "online" ? "Online CAT / MBA Coaching" : `Coaching in ${cityLabel(c)}`}</a></li>`).join("");
  const hostelCities = DATA.cities.hostels.map(c => `<li><a href="hostels-${c}.html">Hostels in ${cityLabel(c)}</a></li>`).join("");
  const schoolCities = DATA.cities.schools.map(c => `<li><a href="schools-${c}.html">Schools in ${cityLabel(c)}</a></li>`).join("");
  return `<footer class="site-footer">
<div class="container footer-grid">
<div>
<h3>Coaching</h3><ul>${coachingCities}</ul>
</div>
<div>
<h3>Schools &amp; Hostels</h3><ul>${schoolCities}${hostelCities}</ul>
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
  const media = x.thumb ? `<img src="${x.thumb}" alt="${esc(x.name)}, ${esc(x.locality)}" loading="lazy" onerror="this.parentNode.classList.add('noimg')">` : `<span class="media-initial" aria-hidden="true">${esc(x.name[0])}</span>`;
  const locLine = x.city === "online" ? `🌐 ${esc(x.locality)}` : `📍 ${esc(x.locality)}, ${cityLabel(x.city)}`;
  return `<a class="card" href="institute-${x.slug}.html" data-exams="${x.exams.join(",")}" data-verified="${x.verified}" data-featured="${x.featured ? 1 : 0}" data-rating="${x.rating || 0}" data-reviews="${x.ratingCount || 0}" data-estd="${x.estd || 9999}" data-name="${esc(x.name.toLowerCase())}">
<div class="card-media${x.thumb ? "" : " noimg"}">${media}</div>
<div class="card-body">
<div class="card-top">${x.featured ? `<span class="badge badge-pick" title="Genuine editorial recommendation — not paid placement">★ Editor's Pick</span>` : ""}${x.verified ? `<span class="badge badge-verified" title="Details verified with the institute">✓ Verified</span>` : ""}<span class="badge badge-type">${typeLabel[x.type]}</span>${x.online ? `<span class="badge badge-online">Online</span>` : ""}</div>
<h3>${esc(x.name)}</h3>
<p class="card-loc">${locLine}${x.estd ? ` · Estd. ${x.estd}` : ""}</p>
<div class="card-chips">${exams}${extra}${gender}${price}</div>
<div class="card-foot">${stars(x)}<span class="card-cta">View details →</span></div>
</div>
</a>`;
}

/* ---------- pages ---------- */
function searchBox() {
  const opts = [
    ...DATA.cities.coaching.map(c => `<option value="coaching-${c}.html">Coaching · ${cityLabel(c)}</option>`),
    ...DATA.cities.schools.map(c => `<option value="schools-${c}.html">Schools · ${cityLabel(c)}</option>`),
    ...DATA.cities.hostels.map(c => `<option value="hostels-${c}.html">Hostels · ${cityLabel(c)}</option>`)
  ].join("");
  return `<form class="searchbox" onsubmit="var v=this.dest.value; if(v) location.href=v; return false;">
<label class="sr-only" for="dest">Choose what you are looking for</label>
<select id="dest" name="dest" required><option value="">What are you looking for?</option>${opts}</select>
<button class="btn btn-primary" type="submit">Search</button>
</form>`;
}

function homePage() {
  const examCards = [["ias", "🏛️"], ["jee", "🔬"], ["neet", "⚕️"], ["cat", "📊"], ["ssc", "📋"], ["clat", "⚖️"], ["nda", "🎖️"], ["bank", "🏦"], ["teaching", "📚"], ["cuet", "🎓"]]
    .map(([e, ic]) => e === "cat"
      ? `<a class="tile" href="coaching-online.html"><span class="tile-ic" aria-hidden="true">${ic}</span><strong>${examLabel(e)}</strong><span class="muted">Compare online platforms</span></a>`
      : `<a class="tile" href="coaching-sikar.html?exam=${e}" onclick="this.href='coaching-'+(localStorage.getItem('oc4u-city')||'sikar')+'.html?exam=${e}'"><span class="tile-ic" aria-hidden="true">${ic}</span><strong>${examLabel(e)}</strong><span class="muted">Find coaching</span></a>`).join("");
  const cityCards = DATA.cities.coaching.map(c => {
    const n = byCity("coaching", c).length;
    return `<a class="tile tile-city" href="coaching-${c}.html"><strong>${cityLabel(c)}</strong><span class="muted">${n} institutes listed</span></a>`;
  }).join("");
  const hostelCards = DATA.cities.hostels.map(c => `<a class="tile tile-city" href="hostels-${c}.html"><strong>Hostels in ${cityLabel(c)}</strong><span class="muted">${byCity("hostel", c).length} listed</span></a>`).join("");
  const featured = [...byType("coaching")].sort((a, b) => (b.rating || 0) * Math.log((b.ratingCount || 0) + 1) - (a.rating || 0) * Math.log((a.ratingCount || 0) + 1)).slice(0, 6).map(card).join("");
  return head(`${B.name} — Find the Best Coaching, Schools & Hostels in India`,
    `Compare ${stats.coaching} verified coaching institutes, schools and student hostels across ${stats.cities} cities. Real reviews, honest details, free for students.`) +
    header("index.html") + `
<section class="hero">
<div class="container">
<p class="hero-kicker">Every listing checked · Free for students</p>
<h1>Find the right academy,<br>without the guesswork</h1>
<p class="hero-sub">${B.tagline}</p>
${searchBox()}
<div class="stats-row">
<div><strong>${stats.listings}</strong><span>Listings live</span></div>
<div><strong>${stats.cities}</strong><span>Cities covered</span></div>
<div><strong>${stats.reviews}+</strong><span>Student reviews</span></div>
<div><strong>100%</strong><span>Free for students</span></div>
</div>
</div>
</section>
<section class="section container">
<h2>What are you preparing for?</h2>
<p class="section-sub">Pick your exam — we'll show you specialised institutes in your city</p>
<div class="tile-grid">${examCards}</div>
</section>
<section class="section container">
<h2>Top-rated coaching institutes</h2>
<p class="section-sub">Ranked by genuine student reviews, not paid placement</p>
<div class="card-grid">${featured}</div>
</section>
<section class="section container">
<h2>Browse by city</h2>
<div class="tile-grid">${cityCards}</div>
</section>
<section class="section container">
<h2>Need a hostel near your academy?</h2>
<p class="section-sub">Verified hostels with location, gender and pricing details</p>
<div class="tile-grid">${hostelCards}</div>
</section>
<section class="section container why">
<h2>Why students trust ${B.name}</h2>
<div class="why-grid">
<div><h3>✓ Honest listings</h3><p>We only show what we can confirm. No inflated counts, no fake "10,000+ academies" claims.</p></div>
<div><h3>★ Real reviews</h3><p>Ratings come from students. Institutes cannot pay to change or hide them.</p></div>
<div><h3>⚡ Fast &amp; simple</h3><p>Every page loads instantly with the full list visible — no endless spinners.</p></div>
<div><h3>₹0 for students</h3><p>Comparing, enquiring and reviewing is completely free. Always will be.</p></div>
</div>
</section>
<section class="section container">
<h2>Latest from our guides</h2>
<p class="section-sub">Original, research-backed articles — <a href="blog.html">see all</a></p>
<div class="card-grid">${POSTS.slice(0, 3).map(postCard).join("")}</div>
</section>
<section class="section container cta-band">
<h2>Run an institute or hostel?</h2>
<p>Get listed free and reach students actively searching in your city.</p>
<a class="btn btn-primary" href="list-your-institute.html">List Your Institute Free</a>
</section>` + footer();
}

function hubPage(type, title, sub) {
  const cities = DATA.cities[typePage[type] === "hostels" ? "hostels" : typePage[type]];
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
    ? `${items.length} platforms compared — pure-online brands plus the online programs of major classroom institutes. Facts only: founders, formats and track record. No paid rankings — our Editor's Pick is a genuine recommendation, clearly marked, and nobody pays for placement.`
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
  const waText = encodeURIComponent(`Hello, I found ${x.name} (${cityL}) on ${B.name} and would like more details.`);
  return head(`${x.name} — ${x.city === "online" ? "Online CAT / MBA Coaching" : `${typeLabel[x.type]} in ${cityL}`} | ${B.name}`,
    `${x.name}, ${x.locality}, ${cityL}. Established ${x.estd}.${x.rating ? ` Rated ${x.rating.toFixed(1)}/5 by ${x.ratingCount} students.` : ""} ${x.type === "hostel" ? "Address, pricing and enquiry details." : "Address, exams offered and enquiry details."}`) +
    header(`${typePage[x.type]}.html`) + `
<div class="container breadcrumb" aria-label="Breadcrumb"><a href="index.html">Home</a> / <a href="${typePage[x.type]}.html">${typePlural[x.type]}</a> / <a href="${listHref}">${cityL}</a> / <span>${esc(x.name)}</span></div>
<section class="container detail-hero">
<div class="detail-media${x.thumb ? "" : " noimg"}">${x.thumb ? `<img src="${x.thumb}" alt="${esc(x.name)} campus" onerror="this.parentNode.classList.add('noimg')">` : `<span class="media-initial" aria-hidden="true">${esc(x.name[0])}</span>`}</div>
<div class="detail-summary">
<div class="card-top">${x.verified ? `<span class="badge badge-verified">✓ Verified listing</span>` : `<span class="badge badge-unverified">Unverified — details from public sources</span>`}</div>
<h1>${esc(x.name)}</h1>
<p class="card-loc">📍 ${esc(x.address)}</p>
<p>${stars(x)}</p>
<div class="card-chips">${exams.map(e => `<span class="chip">${examLabel(e)}</span>`).join("")}${x.gender ? `<span class="chip">${x.gender === "Both" ? "Boys & Girls" : x.gender + " only"}</span>` : ""}${x.priceRange ? `<span class="chip chip-price">${x.priceRange}</span>` : ""}</div>
<div class="detail-facts">
${x.estd ? `<div><span class="muted">Established</span><strong>${x.estd}</strong></div>` : ""}
<div><span class="muted">${x.city === "online" ? "Mode" : "Locality"}</span><strong>${x.city === "online" ? "100% Online" : esc(x.locality)}</strong></div>
<div><span class="muted">${x.city === "online" ? "Availability" : "City"}</span><strong>${x.city === "online" ? "Pan-India" : cityL}</strong></div>
</div>
<div class="detail-actions">
<a class="btn btn-primary" href="https://wa.me/${B.whatsapp}?text=${waText}">Enquire on WhatsApp</a>
${x.website ? `<a class="btn btn-ghost" href="${x.website}" rel="noopener nofollow">Visit official website</a>` : ""}
${x.city !== "online" ? `<a class="btn btn-ghost" href="https://www.google.com/maps/search/?api=1&query=${mapsQ}" rel="noopener">Open in Google Maps</a>` : ""}
</div>
</div>
</section>
<section class="section container detail-body">
<div class="detail-main">
<h2>About ${esc(x.name)}</h2>
<p>${describe(x)}</p>
${highlights ? `<h2>Highlights</h2><ul class="hl-list">${highlights}</ul>` : ""}
<h2>Fees &amp; batches</h2>
<p>We don't publish fee tables unless the institute has confirmed them — outdated fee data misleads more than it helps. Use the enquiry button and you'll get current fees, batch timings and any scholarship tests directly.</p>
<h2>Student reviews</h2>
${x.ratingCount ? `<p>Rated <strong>${x.rating ? x.rating.toFixed(1) : "–"}/5</strong> from ${x.ratingCount} student review${x.ratingCount === 1 ? "" : "s"}.</p>` : `<p>No reviews yet.</p>`}
<script type="application/ld+json">${JSON.stringify(Object.assign({
  "@context": "https://schema.org", "@type": "EducationalOrganization",
  "name": x.name, "url": `${B.siteUrl}/institute-${x.slug}`,
  "address": { "@type": "PostalAddress", "streetAddress": x.address, "addressLocality": x.city === "online" ? "Online" : cityL, "addressCountry": "IN" }
}, x.estd ? { "foundingDate": String(x.estd) } : {}, x.website ? { "sameAs": x.website } : {}, (x.rating && x.ratingCount) ? { "aggregateRating": { "@type": "AggregateRating", "ratingValue": x.rating, "reviewCount": x.ratingCount, "bestRating": 5 } } : {}))}</script>
<p>Studied here? <a href="contact.html">Share your experience</a> — honest reviews (positive or negative) are published as-is.</p>
</div>
<aside class="detail-side">
<div class="side-card">
<h3>Quick enquiry</h3>
<p class="muted">Goes straight to our counselling team — free, no spam.</p>
<form class="enq-form" data-institute="${esc(x.name)} (${cityL})">
<label>Your name<input name="name" required autocomplete="name"></label>
<label>Mobile<input name="phone" type="tel" required pattern="[0-9+ -]{10,15}" autocomplete="tel"></label>
<button class="btn btn-primary" type="submit">Request a callback</button>
<p class="form-ok" hidden>Thanks! Opening WhatsApp to send your enquiry…</p>
</form>
</div>
${others ? `<h3 class="side-h">Nearby alternatives</h3><div class="side-cards">${others}</div>` : ""}
</aside>
</section>` + footer();
}

function simplePage(file, title, desc, bodyHtml, active) {
  return head(`${title} | ${B.name}`, desc) + header(active || "") + bodyHtml + footer();
}

/* ---------- static page bodies ---------- */
const aboutBody = `
<section class="hero hero-sm"><div class="container"><h1>About ${B.name}</h1>
<p class="hero-sub">We help students and parents compare coaching institutes, schools and hostels — honestly.</p></div></section>
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
<p><strong>Students:</strong> ${B.email}<br><strong>Institutes &amp; business:</strong> ${B.email}<br><strong>Phone/WhatsApp:</strong> ${B.phone} (10am–7pm)</p>
<h2>Corrections</h2>
<p>Spotted outdated information on a listing? Tell us the page and what's wrong — corrections are our top priority and are usually live within 48 hours.</p>
</div>
<div class="side-card">
<h3>Send a message</h3>
<form class="enq-form" data-institute="General enquiry">
<label>Your name<input name="name" required autocomplete="name"></label>
<label>Mobile<input name="phone" type="tel" required pattern="[0-9+ -]{10,15}" autocomplete="tel"></label>
<label>Message<textarea name="msg" rows="4" required></textarea></label>
<button class="btn btn-primary" type="submit">Send via WhatsApp</button>
<p class="form-ok" hidden>Thanks! Opening WhatsApp…</p>
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
<form class="enq-form" data-institute="New institute registration">
<label>Institute name<input name="institute" required></label>
<label>Your name<input name="name" required></label>
<label>Mobile<input name="phone" type="tel" required pattern="[0-9+ -]{10,15}"></label>
<label>City<input name="city" required></label>
<button class="btn btn-primary" type="submit">Register free</button>
<p class="form-ok" hidden>Thanks! Opening WhatsApp…</p>
</form>
<p class="muted">By registering you agree to our <a href="terms.html">Terms</a> and <a href="privacy.html">Privacy Policy</a>.</p>
</div>
</section>`;

/* ---------- blog ---------- */
const CATS = [...new Set(POSTS.map(p => p.category))];
function postCard(p) {
  return `<a class="card post-card" href="${p.slug}.html">
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
<p class="hero-sub">Original, research-backed articles on choosing coaching, preparing for exams and student life. Written by our editorial team — no sponsored content unless clearly labelled.</p></div></section>
<section class="section container">
<div class="filterbar"><div class="filterbar-row" role="group" aria-label="Filter by category"><span class="filterbar-label">Topic:</span><button class="fchip active" data-exam="">All</button>${CATS.map(c => `<button class="fchip" data-exam="${esc(c)}">${esc(c)}</button>`).join("")}</div></div>
<div class="card-grid" id="cards" style="margin-top:22px">${POSTS.map(p => `<div data-exams="${esc(p.category)}" style="display:contents">${postCard(p)}</div>`).join("")}</div>
</section>`;
}
function postPage(p) {
  const related = POSTS.filter(o => o.slug !== p.slug && o.category === p.category).slice(0, 2);
  const more = related.length ? related : POSTS.filter(o => o.slug !== p.slug).slice(0, 2);
  return head(`${p.title} | ${B.name}`, p.excerpt).replace("</head>", `<meta property="article:published_time" content="2026-07-03">\n</head>`) + header("blog.html") + `
<div class="container breadcrumb" aria-label="Breadcrumb"><a href="index.html">Home</a> / <a href="blog.html">Guides</a> / <span>${esc(p.title)}</span></div>
<article class="section container prose article-body">
<p class="muted">${esc(p.category)} · ${p.date} · ${p.minutes} min read · By the ${B.name} editorial team</p>
<h1>${esc(p.title)}</h1>
${p.html}
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
  links.push(["index.html", "Home"], ["coaching.html", "Coaching"], ["schools.html", "Schools"], ["hostels.html", "Hostels"], ["blog.html", "Guides"], ["about.html", "About"], ["contact.html", "Contact"], ["list-your-institute.html", "List Your Institute"], ["privacy.html", "Privacy"], ["terms.html", "Terms"]);
  DATA.cities.coaching.forEach(c => links.push([`coaching-${c}.html`, `Coaching in ${cityLabel(c)}`]));
  DATA.cities.schools.forEach(c => links.push([`schools-${c}.html`, `Schools in ${cityLabel(c)}`]));
  DATA.cities.hostels.forEach(c => links.push([`hostels-${c}.html`, `Hostels in ${cityLabel(c)}`]));
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

/* ---------- write ---------- */
fs.mkdirSync(path.join(OUT, "assets"), { recursive: true });
fs.writeFileSync(path.join(OUT, "assets", "style.css"), css);
fs.writeFileSync(path.join(OUT, "assets", "app.js"), js);

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
w("schools.html", hubPage("schools", "Find the Right School", `Compare ${stats.schools} schools with establishment history, location and parent reviews.`));
w("hostels.html", hubPage("hostel", "Find a Safe, Comfortable Hostel", `Compare ${stats.hostels} student hostels — location, gender, pricing and reviews in one place.`));

DATA.cities.coaching.forEach(c => w(`coaching-${c}.html`, listingPage("coaching", c)));
DATA.cities.schools.forEach(c => w(`schools-${c}.html`, listingPage("schools", c)));
DATA.cities.hostels.forEach(c => w(`hostels-${c}.html`, listingPage("hostel", c)));

L.forEach(x => w(`institute-${x.slug}.html`, detailPage(x)));

w("about.html", simplePage("about.html", "About Us", `Who we are and how ${B.name} keeps listings honest.`, aboutBody, "about.html"));
w("contact.html", simplePage("contact.html", "Contact Us", `Get in touch with the ${B.name} team.`, contactBody));
w("list-your-institute.html", simplePage("list-your-institute.html", "List Your Institute Free", `Register your coaching institute, school or hostel on ${B.name} for free.`, listBody));
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
