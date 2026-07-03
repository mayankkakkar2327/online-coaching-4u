/* Online Coaching 4u — client enhancements (filters, sort, forms).
   All content is already in the HTML; this only enhances it. */
(function () {
  "use strict";
  var WHATSAPP = "910000000000"; // update to your business number

  /* remember last visited city for exam shortcuts on the home page */
  var m = location.pathname.match(/(?:coaching|schools|hostels)-([a-z-]+)\.html$/);
  if (m) try { localStorage.setItem("oc4u-city", m[1]); } catch (e) {}

  /* ---- listing page: filter + sort ---- */
  var grid = document.getElementById("cards");
  if (grid) {
    var cards = Array.prototype.slice.call(grid.children);
    var activeExam = "";
    var chips = document.querySelectorAll(".fchip");
    var sortSel = document.getElementById("sortsel");
    var verified = document.getElementById("verifiedonly");
    var count = document.getElementById("rescount");
    var empty = document.getElementById("noresults");

    /* support ?exam= deep links from home page */
    var q = new URLSearchParams(location.search).get("exam");
    if (q) {
      chips.forEach(function (c) {
        if (c.dataset.exam === q) { activeExam = q; }
      });
    }

    function apply() {
      var shown = 0;
      var vis = cards.filter(function (c) {
        var ok = (!activeExam || (c.dataset.exams || "").split(",").indexOf(activeExam) !== -1) &&
                 (!verified || !verified.checked || c.dataset.verified === "true");
        c.hidden = !ok;
        if (ok) shown++;
        return ok;
      });
      var mode = sortSel ? sortSel.value : "rating";
      vis.sort(function (a, b) {
        if (mode === "rating") return (+(b.dataset.featured || 0) - +(a.dataset.featured || 0)) || (+b.dataset.rating * Math.log(+b.dataset.reviews + 1)) - (+a.dataset.rating * Math.log(+a.dataset.reviews + 1));
        if (mode === "reviews") return +b.dataset.reviews - +a.dataset.reviews;
        if (mode === "estd") return +a.dataset.estd - +b.dataset.estd;
        return a.dataset.name < b.dataset.name ? -1 : 1;
      });
      vis.forEach(function (c) { grid.appendChild(c); });
      if (count) count.textContent = shown + " shown";
      if (empty) empty.hidden = shown !== 0;
      chips.forEach(function (c) { c.classList.toggle("active", c.dataset.exam === activeExam); });
    }

    chips.forEach(function (c) {
      c.addEventListener("click", function () { activeExam = c.dataset.exam; apply(); });
    });
    if (sortSel) sortSel.addEventListener("change", apply);
    if (verified) verified.addEventListener("change", apply);
    apply();
  }

  /* ---- enquiry forms → WhatsApp deep link ---- */
  document.querySelectorAll(".enq-form").forEach(function (f) {
    f.addEventListener("submit", function (ev) {
      ev.preventDefault();
      var d = new FormData(f);
      var parts = ["Enquiry via Online Coaching 4u", "Regarding: " + (f.dataset.institute || "General")];
      d.forEach(function (v, k) { if (v) parts.push(k.charAt(0).toUpperCase() + k.slice(1) + ": " + v); });
      var ok = f.querySelector(".form-ok");
      if (ok) ok.hidden = false;
      window.open("https://wa.me/" + WHATSAPP + "?text=" + encodeURIComponent(parts.join("\n")), "_blank");
    });
  });
})();
