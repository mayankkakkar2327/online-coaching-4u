/* Online Coaching 4u — client enhancements (filters, sort, search, forms).
   All content is already in the HTML; this only enhances it. */
(function () {
  "use strict";

  /* remember last visited city for exam shortcuts on the home page */
  var m = location.pathname.match(/(?:coaching|schools|hostels)-([a-z-]+)\.html$/);
  if (m) try { localStorage.setItem("oc4u-city", m[1]); } catch (e) {}

  /* ---- listing page: filter + sort ---- */
  var grid = document.getElementById("cards");
  if (grid) {
    var cards = Array.prototype.slice.call(grid.children);
    var examSel = document.getElementById("examsel");
    var modeSel = document.getElementById("modesel");
    var sortSel = document.getElementById("sortsel");
    var verified = document.getElementById("verifiedonly");
    var count = document.getElementById("rescount");
    var empty = document.getElementById("noresults");

    /* deep links: ?exam= and ?mode= preselect the dropdowns */
    var params = new URLSearchParams(location.search);
    var q = params.get("exam");
    if (q && examSel && examSel.querySelector('option[value="' + q + '"]')) examSel.value = q;
    var qm = params.get("mode");
    if (qm && modeSel && modeSel.querySelector('option[value="' + qm + '"]')) modeSel.value = qm;

    function apply() {
      var activeExam = examSel ? examSel.value : "";
      var activeMode = modeSel ? modeSel.value : "";
      var shown = 0;
      var vis = cards.filter(function (c) {
        var ok = (!activeExam || (c.dataset.exams || "").split(",").indexOf(activeExam) !== -1) &&
                 (!activeMode || c.dataset.mode === activeMode) &&
                 (!verified || !verified.checked || c.dataset.verified === "true");
        c.hidden = !ok;
        if (ok) shown++;
        return ok;
      });
      var mode = sortSel ? sortSel.value : "rating";
      vis.sort(function (a, b) {
        /* "Recommended" (default): editorial priority first, then rating-weighted */
        if (mode === "rating") return (+(b.dataset.featured || 0) - +(a.dataset.featured || 0)) || (+b.dataset.rating * Math.log(+b.dataset.reviews + 1)) - (+a.dataset.rating * Math.log(+a.dataset.reviews + 1));
        /* "Top rated": pure rating order, no editorial priority */
        if (mode === "toprated") return (+b.dataset.rating * Math.log(+b.dataset.reviews + 1)) - (+a.dataset.rating * Math.log(+a.dataset.reviews + 1));
        if (mode === "reviews") return +b.dataset.reviews - +a.dataset.reviews;
        if (mode === "estd") return +a.dataset.estd - +b.dataset.estd;
        return a.dataset.name < b.dataset.name ? -1 : 1;
      });
      vis.forEach(function (c) { grid.appendChild(c); });
      if (count) count.textContent = shown + " shown";
      if (empty) empty.hidden = shown !== 0;
    }

    [examSel, modeSel, sortSel].forEach(function (s) {
      if (s) s.addEventListener("change", apply);
    });
    if (verified) verified.addEventListener("change", apply);
    apply();
  }

  /* ---- universal site search: institutes (coaching/schools/hostels) + blog guides ---- */
  var searchInput = document.getElementById("site-search");
  if (searchInput) {
    var resultsBox = document.getElementById("site-search-results");
    var searchBtn = document.getElementById("site-search-btn");
    var indexData = null;
    var loadIndex = function () {
      if (indexData) return Promise.resolve(indexData);
      return fetch("assets/search-index.json").then(function (r) { return r.json(); }).then(function (d) { indexData = d; return d; });
    };
    var render = function (items, q) {
      if (!items.length) {
        resultsBox.innerHTML = q ? '<div class="search-empty">No matches for "' + q.replace(/</g, "&lt;") + '"</div>' : "";
        resultsBox.hidden = !q;
        return;
      }
      resultsBox.innerHTML = items.slice(0, 8).map(function (it) {
        return '<a href="' + it.u + '"><strong>' + it.t.replace(/</g, "&lt;") + '</strong><span class="muted"> ' + it.s.replace(/</g, "&lt;") + ' · ' + it.c + '</span></a>';
      }).join("");
      resultsBox.hidden = false;
    };
    var search = function (q) {
      loadIndex().then(function (data) {
        if (!q) { render([], ""); return; }
        var ql = q.toLowerCase();
        var matches = data.filter(function (it) {
          return it.t.toLowerCase().indexOf(ql) !== -1 || it.s.toLowerCase().indexOf(ql) !== -1;
        });
        render(matches, q);
      });
    };
    searchInput.addEventListener("input", function () { search(searchInput.value.trim()); });
    searchInput.addEventListener("focus", function () { if (searchInput.value.trim()) search(searchInput.value.trim()); });
    searchInput.addEventListener("keydown", function (ev) {
      if (ev.key === "Enter") {
        ev.preventDefault();
        var first = resultsBox.querySelector("a");
        if (first) location.href = first.getAttribute("href");
      }
    });
    if (searchBtn) searchBtn.addEventListener("click", function () {
      var first = resultsBox.querySelector("a");
      if (first) location.href = first.getAttribute("href"); else searchInput.focus();
    });
    document.addEventListener("click", function (ev) {
      if (!resultsBox.contains(ev.target) && ev.target !== searchInput) resultsBox.hidden = true;
    });
  }
})();
