/* Legal updates: refreshes the headline lists from /updates/updates.json (written every few hours by a GitHub Action). */
(function () {
  "use strict";
  var s = document.currentScript && document.currentScript.src || "";
  var base = s.replace(/assets\/js\/updates\.js.*$/, "");
  var boxes = document.querySelectorAll("[data-updates]"); if (!boxes.length) return;
  var esc = function (t) { var d = document.createElement("div"); d.textContent = t || ""; return d.innerHTML; };
  var fmt = function (iso) { try { return new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" }) + " IST"; } catch (e) { return ""; } };
  var item = function (i) { return '<li class="up-item"><a class="up-t" href="' + esc(i.link) + '" target="_blank" rel="noopener nofollow">' + esc(i.title) + '</a>' + (i.excerpt ? '<p class="up-x">' + esc(i.excerpt) + '</p>' : '') + '<p class="up-m">' + esc(i.source) + (i.date ? ' &middot; ' + fmt(i.date) : '') + '</p></li>'; };
  fetch(base + "updates/updates.json", { cache: "no-cache" }).then(function (r) { return r.json(); }).then(function (d) {
    Array.prototype.forEach.call(boxes, function (b) {
      var mode = b.getAttribute("data-updates");
      if (mode === "latest") {
        var all = []; d.categories.forEach(function (c) { c.items.forEach(function (i) { all.push(i); }); });
        var seen = {}; all = all.sort(function (a, b) { return (b.date || "").localeCompare(a.date || ""); }).filter(function (i) { if (seen[i.link]) return false; seen[i.link] = 1; return true; }).slice(0, +(b.getAttribute("data-n") || 5));
        b.innerHTML = '<ul class="up-list">' + all.map(item).join("") + "</ul>";
      } else {
        b.innerHTML = d.categories.map(function (c) { var id = "u-" + c.name.toLowerCase().replace(/[^a-z]+/g, "-"); return '<section class="up-cat" id="' + id + '" aria-labelledby="' + id + '-h"><h2 id="' + id + '-h">' + esc(c.name) + '</h2><ul class="up-list">' + c.items.map(item).join("") + "</ul></section>"; }).join("");
      }
    });
    Array.prototype.forEach.call(document.querySelectorAll("[data-updates-time]"), function (t) { t.textContent = "Updated " + fmt(d.generated); });
  }).catch(function () {});
})();
