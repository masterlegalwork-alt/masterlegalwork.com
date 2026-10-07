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
  /* Drafts: print one draft, or all open drafts (all drafts if none is open) */
  var opened = [];
  document.querySelectorAll(".print-btn").forEach(function (b) {
    b.addEventListener("click", function () {
      var d = document.getElementById(b.getAttribute("data-print"));
      var body = d && d.querySelector(".draft-body");
      if (!d || !body) return;
      document.body.classList.add("print-one"); d.classList.add("print-target");
      if (body.hidden) { body.hidden = false; opened.push(body); }
      window.print();
    });
  });
  window.addEventListener("beforeprint", function () {
    if (document.body.classList.contains("print-one") || !document.querySelector(".draft-body")) return;
    if (!document.querySelector(".draft:not([hidden]) .draft-body:not([hidden])")) {
      document.querySelectorAll(".draft:not([hidden]) .draft-body[hidden]").forEach(function (x) { x.hidden = false; opened.push(x); });
    }
  });
  window.addEventListener("afterprint", function () {
    document.body.classList.remove("print-one");
    document.querySelectorAll(".print-target").forEach(function (x) { x.classList.remove("print-target"); });
    opened.forEach(function (x) { x.hidden = true; }); opened = [];
  });

  /* Open a draft from #hash */
  function openFromHash() {
    var t = location.hash && document.getElementById(location.hash.slice(1));
    if (t && t.classList.contains("draft")) {
      var body = t.querySelector(".draft-body"), vb = t.querySelector(".view-btn");
      if (body && body.hidden && vb) vb.click();
      t.scrollIntoView();
    }
  }
  openFromHash();
  window.addEventListener("hashchange", openFromHash);

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
