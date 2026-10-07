(function () {
  "use strict";
  /* Copy buttons */
  function copyText(t) {
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(t);
    return new Promise(function (res, rej) {
      var ta = document.createElement("textarea"); ta.value = t; ta.setAttribute("readonly", "");
      ta.style.position = "fixed"; ta.style.opacity = "0"; document.body.appendChild(ta); ta.select();
      try { document.execCommand("copy") ? res() : rej(); } catch (e) { rej(e); } ta.remove();
    });
  }
  document.querySelectorAll(".copy-btn").forEach(function (b) {
    b.addEventListener("click", function () {
      copyText(b.getAttribute("data-copy")).then(function () {
        b.textContent = "Copied"; b.classList.add("copied");
        setTimeout(function () { b.textContent = "Copy"; b.classList.remove("copied"); }, 1800);
      }, function () { b.textContent = "Select & copy"; });
    });
  });

  /* Drafts: view toggles */
  document.querySelectorAll(".view-btn").forEach(function (b) {
    b.addEventListener("click", function () {
      var body = document.getElementById(b.getAttribute("aria-controls"));
      var open = body.hidden; body.hidden = !open;
      b.setAttribute("aria-expanded", open ? "true" : "false");
      b.textContent = open ? "Hide format" : "View format";
    });
  });
  /* Open a draft from #hash */
  if (location.hash) {
    var t = document.getElementById(location.hash.slice(1));
    if (t && t.classList.contains("draft")) { var vb = t.querySelector(".view-btn"); if (vb) vb.click(); }
  }

  /* Drafts: search + filter */
  var q = document.getElementById("draft-search");
  if (q) {
    var filter = "all";
    var chips = document.querySelectorAll(".chip-btn[data-filter]");
    var apply = function () {
      var term = q.value.trim().toLowerCase(), total = 0;
      document.querySelectorAll(".draft-group").forEach(function (g) {
        var show = filter === "all" || g.getAttribute("data-group") === filter, n = 0;
        g.querySelectorAll(".draft").forEach(function (d) {
          var m = show && (!term || term.split(/\s+/).every(function (w) { return d.getAttribute("data-search").indexOf(w) > -1; }));
          d.hidden = !m; if (m) n++;
        });
        g.hidden = n === 0; total += n;
        var c = g.querySelector("[data-count]"); if (c) c.textContent = n;
      });
      document.getElementById("no-results").hidden = total > 0;
    };
    q.addEventListener("input", apply);
    chips.forEach(function (c) {
      c.addEventListener("click", function () {
        filter = c.getAttribute("data-filter");
        chips.forEach(function (x) { x.setAttribute("aria-pressed", x === c ? "true" : "false"); });
        apply();
      });
    });
    apply();
  }
})();
