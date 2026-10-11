/* Section converter (NCRB correspondence tables) and Section 138 NI Act timeline. No data leaves the browser. */
(function () {
  "use strict";
  var base = (window.MLW_CONFIG && window.MLW_CONFIG.base) || "";
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return {"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;"}[c]; }); };
  var cf = document.getElementById("conv");
  if (cf) {
    var T = null, q = document.getElementById("cq"), out = document.getElementById("cr"), cnt = document.getElementById("cc"), timer;
    var sel = function (n) { return cf.querySelector('input[name="' + n + '"]:checked').value; };
    fetch(base + "/assets/data/section-tables.json").then(function (r) { if (!r.ok) throw new Error("Tables unavailable"); return r.json(); }).then(function (j) { T = j.tables; run(); })
      .catch(function () { cnt.textContent = "The tables could not be loaded. Please use the NCRB links below."; });
    function run() {
      if (!T) return;
      var t = T[sel("t")], dir = sel("d"), v = q.value.trim(), oldAb = t.oldAbbr, newAb = sel("t");
      document.getElementById("ch1").textContent = dir === "old" ? t.old : t["new"];
      document.getElementById("ch2").textContent = dir === "old" ? t["new"] : t.old;
      if (!v) { out.innerHTML = ""; cnt.textContent = "Type a section number (for example 302 or 438) or a word."; return; }
      var num = /^\d+[A-Za-z]{0,2}(?:\(\d+[A-Za-z]?\))*$/.test(v), w = v.toLowerCase();
      // Match section labels, never digits appearing inside a provision's description.
      var sectionMatches = function (text) {
        var labels = String(text || "").match(/(?:^|[.;]\s+)(\d+[A-Za-z]{0,2}(?:\(\d+[A-Za-z]?\))*)(?=\.|\s|$)/g) || [];
        return labels.some(function (label) {
          var token = label.replace(/^[.;]\s+/, "").trim().toLowerCase();
          return token === w || (w.indexOf("(") < 0 && token.indexOf(w + "(") === 0);
        });
      };
      var rows = t.rows.filter(function (r) {
        if (r[0] === "h") return false;
        var hay = dir === "old" ? r[1] : r[0];
        if (num) return sectionMatches(hay);
        return (r[0] + " " + r[1] + " " + (r[2] || "")).toLowerCase().indexOf(w) > -1;
      }).slice(0, 40);
      out.innerHTML = rows.map(function (r) {
        var nw = (r[2] ? '<small class="ctx">' + esc(r[2]) + "</small><br>" : "") + esc(r[0] || "No corresponding provision"), od = esc(r[1] || "New provision");
        var a = dir === "old" ? od : nw, b = dir === "old" ? nw : od;
        return '<tr><td data-label="' + (dir === "old" ? oldAb : newAb) + '">' + a + '</td><td data-label="' + (dir === "old" ? newAb : oldAb) + '">' + b + "</td></tr>";
      }).join("");
      cnt.textContent = rows.length ? rows.length + (rows.length === 1 ? " row" : " rows") + " from the official table" + (rows.length === 40 ? " (first 40 shown)" : "") + "." : "No row found. Check the number, or search by words.";
    }
    q.addEventListener("input", function () { clearTimeout(timer); timer = setTimeout(run, 180); });
    cf.addEventListener("change", run);
    var u = new URLSearchParams(location.search); if (u.get("q")) q.value = u.get("q");
  }
  var sf = document.getElementById("s138");
  if (sf) {
    var o = document.getElementById("s138o");
    var D = function (n) { var v = sf.elements[n].value; if (!v) return null; var d = new Date(v + "T00:00:00"); return isNaN(d.getTime()) || d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0") !== v ? null : d; };
    var add = function (d, n) { var x = new Date(d); x.setDate(x.getDate() + n); return x; };
    var addM = function (d, m) { var x = new Date(d), day = x.getDate(); x.setMonth(x.getMonth() + m); if (x.getDate() < day) x.setDate(0); return x; };
    var f = function (d) { return d.toLocaleDateString("en-IN", {weekday: "short", day: "2-digit", month: "long", year: "numeric"}); };
    var li = function (h, d, n) { return "<li><b>" + h + "</b><span>" + f(d) + "</span>" + (n ? "<small>" + n + "</small>" : "") + "</li>"; };
    var calc = function () {
      var c = D("cheque"), m = D("memo"), s = D("served"), h = "";
      if ((c && m && m < c) || (m && s && s < m)) {
        o.innerHTML = "<li><small>Check the dates: bank information cannot precede the cheque date, and notice receipt cannot precede the dishonour information used for that notice.</small></li>"; return;
      }
      if (c) h += li("Last day to present the cheque", add(addM(c, 3), -1), "Validity of three months from the date of the cheque; check with your bank.");
      if (m) h += li("Last day to send the demand notice", add(m, 30), "Within 30 days of receiving the bank's information of dishonour (s.138(b)).");
      if (s) { var pay = add(s, 15), coa = add(s, 16);
        h += li("Last day for the drawer to pay", pay, "15 days from receipt of the notice (s.138(c)).");
        h += li("Cause of action arises", coa, "If payment is not made within the 15 days.");
        h += li("Last day to file the complaint", addM(coa, 1), "Within one month of the cause of action (s.142(1)(b)), the day it arises being excluded. A later complaint needs an application showing sufficient cause."); }
      o.innerHTML = h || "<li><small>Enter one or more dates above.</small></li>";
    };
    sf.addEventListener("input", calc); calc();
  }
})();
