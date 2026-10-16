/* Online Coaching 4u — client enhancements (menu, motion, filters, sort, search, tabs).
   All content is already in the HTML; this only enhances it. */
(function () {
  "use strict";
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var vh = function () { return window.innerHeight || document.documentElement.clientHeight; };
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };

  /* remember last visited city for exam shortcuts on the home page */
  var m = location.pathname.match(/(?:coaching|schools|hostels)-([a-z-]+)(?:\.html)?$/);
  if (m) try { localStorage.setItem("oc4u-city", m[1]); } catch (e) {}

  /* ---- mobile menu drawer ---- */
  var toggle = $(".nav-toggle"), drawer = $("#drawer");
  if (toggle && drawer) {
    toggle.addEventListener("click", function () {
      var open = drawer.hidden;
      drawer.hidden = !open;
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      document.body.classList.toggle("nav-open", open);
    });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !drawer.hidden) toggle.click(); });
  }
  /* desktop dropdown: close when clicking elsewhere */
  $$(".nav-drop-btn").forEach(function (b) {
    b.addEventListener("click", function () {
      var item = b.parentElement, open = !item.classList.contains("open");
      item.classList.toggle("open", open); b.setAttribute("aria-expanded", open ? "true" : "false");
    });
  });
  document.addEventListener("click", function (e) {
    $$(".nav-item.open").forEach(function (it) { if (!it.contains(e.target)) { it.classList.remove("open"); var b = $(".nav-drop-btn", it); if (b) b.setAttribute("aria-expanded", "false"); } });
  });

  /* ---- hero mouse parallax ---- */
  var hero = $(".hero, .page-hero");
  if (hero && !reduce && window.matchMedia("(pointer:fine)").matches) {
    var praf = null, px = 0, py = 0;
    hero.addEventListener("mousemove", function (e) {
      var r = hero.getBoundingClientRect();
      px = (e.clientX - r.left) / r.width - 0.5; py = (e.clientY - r.top) / r.height - 0.5;
      if (praf) return;
      praf = requestAnimationFrame(function () { praf = null; hero.style.setProperty("--mx", px.toFixed(3)); hero.style.setProperty("--my", py.toFixed(3)); });
    });
    hero.addEventListener("mouseleave", function () { hero.style.setProperty("--mx", 0); hero.style.setProperty("--my", 0); });
  }

  /* ---- scroll motion: entrances, count-ups, word light-up, drifting icons, reading progress ---- */
  var io = null;
  function countUp(el) {
    var end = +el.getAttribute("data-count"), suf = el.getAttribute("data-suffix") || "", t0 = null;
    function step(t) {
      if (!t0) t0 = t;
      var k = clamp((t - t0) / 1300, 0, 1), e = 1 - Math.pow(1 - k, 3);
      el.textContent = Math.round(end * e).toLocaleString("en-IN") + (k === 1 ? suf : "");
      if (k < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  if (!reduce && "IntersectionObserver" in window) {
    io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.remove("pre");
        var num = en.target.querySelector && en.target.querySelector("[data-count]");
        if (num && !num.dataset.done) { num.dataset.done = "1"; countUp(num); }
        io.unobserve(en.target);
      });
    }, { rootMargin: "0px 0px -6% 0px", threshold: 0.1 });
    $$(".exam-grid, .city-grid, .rank-table, .promises, .post-grid, .stats .container, .results, .benefits, .steps, .compare, .principle-list, .labels, .tile-grid").forEach(function (g) {
      Array.prototype.forEach.call(g.children, function (c, i) { c.style.setProperty("--sd", (i % 6) * 70 + "ms"); });
    });
    $$(".fade-up").forEach(function (el) {
      if (el.getBoundingClientRect().top > vh() * 0.92) el.classList.add("pre");
      io.observe(el);
    });

    var reveals = $$(".reveal"), turners = $$(".drift"), heroArt = $(".hero-away");
    var progress = $(".progress"), article = $(".article-body");
    var ticking = false;
    var update = function () {
      ticking = false; var h = vh();
      reveals.forEach(function (r) {
        var b = r.getBoundingClientRect(), p = clamp((h - b.top) / (h * 0.6), 0, 1.4);
        var words = r.querySelectorAll(".w"), n = words.length;
        for (var i = 0; i < n; i++) { var s = (i / n) * 0.7; words[i].style.setProperty("--o", clamp(0.2 + (p - s) / 0.3 * 0.8, 0.2, 1).toFixed(3)); }
      });
      turners.forEach(function (el) {
        var box = (el.closest("section") || el).getBoundingClientRect();
        el.style.setProperty("--p", clamp((h - box.top) / (h + box.height), 0, 1).toFixed(4));
      });
      if (heroArt) { var hb = heroArt.parentElement.getBoundingClientRect(); heroArt.style.setProperty("--x", clamp(-hb.top / hb.height, 0, 1).toFixed(4)); }
      if (progress && article) { var ab = article.getBoundingClientRect(); progress.style.setProperty("--read", clamp((h * 0.3 - ab.top) / ab.height, 0, 1).toFixed(4)); }
    };
    var onScroll = function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    update();
  }

  /* ---- homepage: online / offline tabs ---- */
  var tabs = $$(".tabs [role=tab]");
  if (tabs.length) {
    var select = function (i) {
      tabs.forEach(function (t, j) {
        var on = i === j, panel = document.getElementById(t.getAttribute("aria-controls"));
        t.setAttribute("aria-selected", on ? "true" : "false"); t.tabIndex = on ? 0 : -1;
        if (panel) { panel.hidden = !on; if (on) { panel.classList.remove("anim"); void panel.offsetWidth; panel.classList.add("anim"); $$(".pre", panel).forEach(function (x) { x.classList.remove("pre"); }); } }
      });
    };
    tabs.forEach(function (t, i) {
      t.addEventListener("click", function () { select(i); });
      t.addEventListener("keydown", function (e) { if (e.key === "ArrowRight" || e.key === "ArrowLeft") { var n = (i + (e.key === "ArrowRight" ? 1 : tabs.length - 1)) % tabs.length; select(n); tabs[n].focus(); } });
    });
  }

  /* ---- listing page: filter + sort ---- */
  var grid = document.getElementById("cards");
  if (grid) {
    var cards = Array.prototype.slice.call(grid.children);
    var examSel = document.getElementById("examsel");
    var modeSel = document.getElementById("modesel");
    var modeToggle = document.getElementById("modetoggle");
    var sortSel = document.getElementById("sortsel");
    var verified = document.getElementById("verifiedonly");
    var count = document.getElementById("rescount");
    var empty = document.getElementById("noresults");

    /* deep links: ?exam= and ?mode= preselect the filters */
    var params = new URLSearchParams(location.search);
    var q = params.get("exam");
    if (q && examSel && examSel.querySelector('option[value="' + q + '"]')) {
      examSel.value = q;
      var h1 = document.querySelector(".listing-h1");
      if (h1) h1.textContent = examSel.options[examSel.selectedIndex].textContent + " " + h1.textContent.replace(/\s+/g, " ").trim();
    }
    var qm = params.get("mode");
    if (qm && modeSel && modeSel.querySelector('option[value="' + qm + '"]')) modeSel.value = qm;

    var syncModeToggle = function () {
      if (!modeToggle) return;
      var current = modeSel ? modeSel.value : "";
      $$(".mode-btn", modeToggle).forEach(function (b) {
        var on = b.dataset.mode === current;
        b.classList.toggle("active", on); b.setAttribute("aria-pressed", on ? "true" : "false");
      });
    };
    if (modeToggle) {
      syncModeToggle();
      modeToggle.addEventListener("click", function (ev) {
        var btn = ev.target.closest(".mode-btn");
        if (!btn || !modeSel) return;
        modeSel.value = btn.dataset.mode; syncModeToggle(); apply();
      });
    }

    var apply = function () {
      var activeExam = examSel ? examSel.value : "", activeMode = modeSel ? modeSel.value : "", shown = 0;
      var vis = cards.filter(function (c) {
        var ok = (!activeExam || (c.dataset.exams || "").split(",").indexOf(activeExam) !== -1) &&
                 (!activeMode || c.dataset.mode === activeMode) &&
                 (!verified || !verified.checked || c.dataset.verified === "true");
        c.hidden = !ok; if (ok) shown++; return ok;
      });
      var mode = sortSel ? sortSel.value : "rating";
      vis.sort(function (a, b) {
        if (mode === "rating") return (+(b.dataset.featured || 0) - +(a.dataset.featured || 0)) || (+b.dataset.rating * Math.log(+b.dataset.reviews + 1)) - (+a.dataset.rating * Math.log(+a.dataset.reviews + 1));
        if (mode === "toprated") return (+b.dataset.rating * Math.log(+b.dataset.reviews + 1)) - (+a.dataset.rating * Math.log(+a.dataset.reviews + 1));
        if (mode === "reviews") return +b.dataset.reviews - +a.dataset.reviews;
        if (mode === "estd") return +a.dataset.estd - +b.dataset.estd;
        return a.dataset.name < b.dataset.name ? -1 : 1;
      });
      vis.forEach(function (c, i) {
        grid.appendChild(c); c.classList.remove("pre");
        var r = c.querySelector(".rank"); if (r) r.textContent = (i < 9 ? "0" : "") + (i + 1);
      });
      if (count) count.textContent = "Showing " + shown + " of " + cards.length;
      if (empty) empty.hidden = shown !== 0;
    };
    [examSel, modeSel, sortSel].forEach(function (s) { if (s) s.addEventListener("change", apply); });
    if (verified) verified.addEventListener("change", apply);
    var clear = document.getElementById("clearfilters");
    if (clear) clear.addEventListener("click", function () {
      if (examSel) examSel.value = ""; if (modeSel) modeSel.value = ""; if (verified) verified.checked = false;
      syncModeToggle(); apply();
    });
    apply();
  }

  /* ---- universal site search: institutes + blog guides ---- */
  var searchInput = document.getElementById("site-search");
  if (searchInput) {
    var resultsBox = document.getElementById("site-search-results");
    var searchBtn = document.getElementById("site-search-btn");
    var indexData = null;
    var loadIndex = function () {
      if (indexData) return Promise.resolve(indexData);
      return fetch("/assets/search-index.json").then(function (r) { return r.json(); }).then(function (d) { indexData = d; return d; });
    };
    var escHtml = function (s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;"); };
    var render = function (items, query) {
      if (!items.length) {
        resultsBox.innerHTML = query ? '<div class="search-empty">No matches for "' + escHtml(query) + '"</div>' : "";
        resultsBox.hidden = !query; return;
      }
      resultsBox.innerHTML = items.slice(0, 8).map(function (it) {
        return '<a href="' + it.u + '"><strong>' + escHtml(it.t) + '</strong><span class="muted"> ' + escHtml(it.s) + " · " + escHtml(it.c) + "</span></a>";
      }).join("");
      resultsBox.hidden = false;
    };
    var search = function (query) {
      loadIndex().then(function (data) {
        if (!query) { render([], ""); return; }
        var ql = query.toLowerCase();
        render(data.filter(function (it) { return it.t.toLowerCase().indexOf(ql) !== -1 || it.s.toLowerCase().indexOf(ql) !== -1; }), query);
      });
    };
    searchInput.addEventListener("input", function () { search(searchInput.value.trim()); });
    searchInput.addEventListener("focus", function () { if (searchInput.value.trim()) search(searchInput.value.trim()); });
    searchInput.addEventListener("keydown", function (ev) {
      if (ev.key === "Enter") { ev.preventDefault(); var first = resultsBox.querySelector("a"); if (first) location.href = first.getAttribute("href"); }
    });
    if (searchBtn) searchBtn.addEventListener("click", function () {
      var first = resultsBox.querySelector("a");
      if (first) location.href = first.getAttribute("href"); else searchInput.focus();
    });
    $$(".chips a[data-q]").forEach(function (a) {
      a.addEventListener("click", function (e) { e.preventDefault(); searchInput.value = a.dataset.q; searchInput.focus(); search(a.dataset.q); });
    });
    document.addEventListener("click", function (ev) {
      if (!resultsBox.contains(ev.target) && ev.target !== searchInput && !ev.target.closest(".chips")) resultsBox.hidden = true;
    });
  }

  /* ---- article: highlight the active section in the contents list ---- */
  var tocList = document.querySelector(".toc-list");
  if (tocList) {
    var tocLinks = $$("a", tocList);
    var tocSections = tocLinks.map(function (a) { return document.getElementById(a.getAttribute("href").slice(1)); }).filter(Boolean);
    var setActiveToc = function () {
      var pos = window.scrollY + 140, current = tocSections[0];
      tocSections.forEach(function (s) { if (s.offsetTop <= pos) current = s; });
      tocLinks.forEach(function (a) { a.parentElement.classList.toggle("active", !!current && a.getAttribute("href") === "#" + current.id); });
    };
    document.addEventListener("scroll", setActiveToc, { passive: true });
    window.addEventListener("resize", setActiveToc);
    setActiveToc();
  }

  /* ---- copy buttons ---- */
  $$(".copy-btn").forEach(function (b) {
    b.addEventListener("click", function () {
      var text = b.dataset.copy, label = b.textContent;
      var done = function () { b.textContent = "Copied"; setTimeout(function () { b.textContent = label; }, 1600); };
      var selectIt = function () { var c = b.previousElementSibling, r = document.createRange(); r.selectNodeContents(c); var s = getSelection(); s.removeAllRanges(); s.addRange(r); };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, selectIt); else selectIt();
    });
  });

  /* ---- footer groups fold on phones ---- */
  if (window.matchMedia("(max-width:640px)").matches) $$(".foot-col").forEach(function (d) { d.open = false; });
})();
