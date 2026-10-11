/* Legal updates: refreshes the headline lists from /updates/updates.json (written every few hours by a GitHub Action). */
(function () {
  "use strict";
  var s = document.currentScript && document.currentScript.src || "";
  var base = s.replace(/assets\/js\/updates\.js.*$/, "");
  var boxes = document.querySelectorAll("[data-updates]"); if (!boxes.length) return;
  var esc = function (t) { var d = document.createElement("div"); d.textContent = t || ""; return d.innerHTML.replace(/"/g, "&quot;").replace(/'/g, "&#39;"); };
  var fmt = function (iso) { try { if (!iso || isNaN(new Date(iso).getTime())) return ""; return new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" }) + " IST"; } catch (e) { return ""; } };
  var item = function (i) { return '<li class="up-item"><a class="up-t" href="' + esc(i.link) + '" target="_blank" rel="noopener nofollow">' + esc(i.title) + '</a>' + (i.excerpt ? '<p class="up-x">' + esc(i.excerpt) + '</p>' : '') + '<p class="up-m">' + esc(i.source) + (i.date ? ' &middot; ' + fmt(i.date) : '') + '</p></li>'; };
  fetch(base + "updates/updates.json", { cache: "no-cache" }).then(function (r) { if (!r.ok) throw new Error("Updates unavailable"); return r.json(); }).then(function (d) {
    if (!d || !Array.isArray(d.categories)) throw new Error("Invalid updates");
    d.categories = d.categories.filter(function (c) { return c && typeof c.name === "string" && Array.isArray(c.items); }).map(function (c) {
      return {name:c.name, items:c.items.filter(function (i) {
        if (!i || typeof i.title !== "string" || typeof i.link !== "string") return false;
        try { var u = new URL(i.link); return u.protocol === "https:" || u.protocol === "http:"; } catch (e) { return false; }
      })};
    }).filter(function (c) {return c.items.length;});
    if (!d.categories.length) return; // Keep the published fallback if feeds are empty.
    Array.prototype.forEach.call(boxes, function (b) {
      var mode = b.getAttribute("data-updates");
      if (mode === "latest") {
        var all = []; d.categories.forEach(function (c) { c.items.forEach(function (i) { all.push(i); }); });
        var seen = Object.create(null); all = all.sort(function (a, b) { return (b.date || "").localeCompare(a.date || ""); }).filter(function (i) { if (seen[i.link]) return false; seen[i.link] = 1; return true; }).slice(0, +(b.getAttribute("data-n") || 5));
        b.innerHTML = '<ul class="up-list">' + all.map(item).join("") + "</ul>";
      } else {
        b.innerHTML = d.categories.map(function (c) { var id = "u-" + c.name.toLowerCase().replace(/[^a-z]+/g, "-"); return '<section class="up-cat" id="' + id + '" aria-labelledby="' + id + '-h"><h2 id="' + id + '-h">' + esc(c.name) + '</h2><ul class="up-list">' + c.items.map(item).join("") + "</ul></section>"; }).join("");
      }
    });
    Array.prototype.forEach.call(document.querySelectorAll("[data-updates-time]"), function (t) { if (fmt(d.generated)) t.textContent = "Updated " + fmt(d.generated); });
  }).catch(function () {});
})();
