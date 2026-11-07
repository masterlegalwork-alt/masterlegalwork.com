import { subscribeMember, getMemberState } from "/js/wix/member-store.js";
import { getItemById, queryItems } from "/js/wix/items.js";
import { esc } from "/assets/common.js";
import { loginPrompt, hearingLine, statusPill, niceDate, docUrl } from "/assets/portal-data.js";
import { phaseBar, findRoadmap, roadmapTable, ROADMAP_NOTE } from "/assets/roadmap.js";

var gate = document.getElementById("gate");
var id = new URLSearchParams(location.search).get("id") || "";
var loaded = false;

function row(label, value) {
  return value ? "<dt>" + label + "</dt><dd>" + esc(value) + "</dd>" : "";
}

function hearingsHtml(list) {
  if (!list.length) return '<p class="muted">No hearing history recorded yet.</p>';
  return '<ol class="timeline">' + list.map(function (h) {
    return "<li><strong>" + niceDate(h.hearingDate) + "</strong>"
      + (h.title ? " &middot; " + esc(h.title) : "")
      + (h.outcome ? '<p class="small">' + esc(h.outcome) + "</p>" : "")
      + (h.nextDate ? '<p class="small muted">Next date fixed: ' + niceDate(h.nextDate) + "</p>" : "")
      + "</li>";
  }).join("") + "</ol>";
}

function docsHtml(list) {
  if (!list.length) return '<p class="muted">No documents shared yet.</p>';
  return '<ul class="doclist">' + list.map(function (d) {
    var url = docUrl(d.file);
    var name = esc(d.title || "Document");
    return "<li><span>" + (url ? '<a href="' + esc(url) + '" target="_blank" rel="noopener">' + name + "</a>" : name)
      + (d.note ? '<br><span class="small muted">' + esc(d.note) + "</span>" : "") + "</span>"
      + '<span class="small muted">' + (d.sharedDate ? niceDate(d.sharedDate) : "") + "</span></li>";
  }).join("") + "</ul>";
}

function statusCard(m) {
  if (!m.done && !m.waiting && !m.nextUpdate && !m.clientAction) return "";
  function col(cls, label, text) {
    return text ? '<div class="st ' + cls + '"><h3>' + label + "</h3><p>" + text + "</p></div>" : "";
  }
  return '<section class="status-card" aria-label="Where your matter stands">'
    + col("st-done", "Done", esc(m.done || ""))
    + col("st-wait", "Waiting", esc(m.waiting || ""))
    + col("st-next", "Next update", m.nextUpdate ? "We will update you by <strong>" + niceDate(m.nextUpdate) + "</strong>, even if nothing has changed." : "")
    + (m.clientAction ? '<div class="st st-you"><h3>Your action</h3><p>' + esc(m.clientAction) + "</p></div>" : "")
    + "</section>";
}

function roadmapSection(m) {
  var row = findRoadmap(m.category);
  if (!row) return "";
  return '<section class="card section"><details><summary><h2 style="display:inline">Roadmap: ' + esc(row[0]) + "</h2></summary>"
    + roadmapTable(row) + '<p class="small muted">' + ROADMAP_NOTE + "</p></details></section>";
}

function load() {
  loaded = true;
  if (!id) { gate.innerHTML = '<div class="card panel"><p>This matter could not be found.</p></div>'; return; }
  getItemById("Matters", id).then(function (m) {
    if (!m) {
      gate.innerHTML = '<div class="card panel"><p>This matter could not be found, or it is not linked to your login.</p></div>';
      return;
    }
    document.title = (m.title || "Matter") + " | Master Legal Work Client Portal";
    var byMatter = [{ field: "matter", op: "eq", value: id }];
    gate.innerHTML = '<div>' + statusPill(m.status) + "</div><h1>" + esc(m.title || "Matter") + "</h1>"
      + hearingLine(m.nextHearing)
      + (m.phase ? phaseBar(m.phase) : "")
      + statusCard(m)
      + '<a class="card tile cf-link" href="/case-file.html?id=' + encodeURIComponent(id) + '"><h2>Client Information Form</h2><p class="muted">Add the parties (names, parentage, ages, addresses) and the important dates of your case. Our office prepares the Memo of Parties and the List of Dates from these.</p><span class="go">Open form &rarr;</span></a>'
      + '<section class="card section"><dl class="dl">'
      + row("Case number", m.caseNumber) + row("Court", m.court) + row("Court / Bench", m.courtName)
      + row("Parties", m.parties) + row("Stage", m.stage) + row("Latest update", m.latestUpdate)
      + "</dl></section>"
      + roadmapSection(m)
      + '<section class="card section"><h2>Hearing history</h2><div id="hearings"><div class="skeleton"></div></div></section>'
      + '<section class="card section"><h2>Documents</h2><div id="docs"><div class="skeleton"></div></div></section>';
    queryItems("Hearings", { filters: byMatter, sort: [{ field: "hearingDate", direction: "desc" }], limit: 100 })
      .then(function (r) { document.getElementById("hearings").innerHTML = hearingsHtml((r && r.items) || []); })
      .catch(function () { document.getElementById("hearings").innerHTML = '<p class="err">Could not load the hearing history.</p>'; });
    queryItems("Documents", { filters: byMatter, sort: [{ field: "sharedDate", direction: "desc" }], limit: 100 })
      .then(function (r) { document.getElementById("docs").innerHTML = docsHtml((r && r.items) || []); })
      .catch(function () { document.getElementById("docs").innerHTML = '<p class="err">Could not load the documents.</p>'; });
  }).catch(function () {
    loaded = false;
    gate.innerHTML = '<div class="card panel"><p class="err">We could not load this matter right now. Please refresh the page.</p></div>';
  });
}

function render(s) {
  if (s.loading) return;
  if (!s.loggedIn) { loaded = false; gate.innerHTML = loginPrompt(); return; }
  if (!loaded) load();
}
subscribeMember(render);
render(getMemberState());
