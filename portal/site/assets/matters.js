import { subscribeMember, getMemberState } from "/js/wix/member-store.js";
import { queryItems } from "/js/wix/items.js";
import { esc } from "/assets/common.js";
import { loginPrompt, hearingLine, statusPill } from "/assets/portal-data.js";

var gate = document.getElementById("gate");
var loadedFor = null;

function card(m) {
  var court = [m.courtName, m.court].filter(Boolean).map(esc).join(" &middot; ");
  return '<article class="card matter">'
    + "<div>" + statusPill(m.status) + "</div>"
    + "<h2>" + esc(m.title || "Matter") + "</h2>"
    + (m.caseNumber ? '<div class="meta">' + esc(m.caseNumber) + "</div>" : "")
    + (court ? '<div class="meta">' + court + "</div>" : "")
    + (m.stage ? '<div class="meta">Stage: ' + esc(m.stage) + "</div>" : "")
    + hearingLine(m.nextHearing)
    + (m.latestUpdate ? '<p class="small">' + esc(m.latestUpdate) + "</p>" : "")
    + '<div><a class="btn" href="/matter.html?id=' + encodeURIComponent(m._id) + '">View details</a></div>'
    + "</article>";
}

function load(memberId) {
  loadedFor = memberId;
  gate.innerHTML = '<div class="skeleton" aria-hidden="true"></div>';
  queryItems("Matters", { sort: [{ field: "nextHearing", direction: "asc" }], limit: 50 })
    .then(function (r) {
      var items = (r && r.items) || [];
      if (!items.length) {
        gate.innerHTML = '<div class="card panel"><h3>No matters linked yet</h3>'
          + '<p class="muted">Your matters will appear here once our office links them to your login. If you think something is missing, please contact our office.</p></div>';
        return;
      }
      var withDate = items.filter(function (m) { return m.nextHearing; });
      var without = items.filter(function (m) { return !m.nextHearing; });
      gate.innerHTML = '<p class="muted">' + items.length + (items.length === 1 ? " matter" : " matters") + ", nearest hearing first.</p>"
        + '<div class="grid">' + withDate.concat(without).map(card).join("") + "</div>";
    })
    .catch(function (e) {
      loadedFor = null;
      gate.innerHTML = '<div class="card panel"><p class="err">We could not load your matters right now. Please refresh the page.</p></div>';
    });
}

function render(s) {
  if (s.loading) return;
  if (!s.loggedIn) { loadedFor = null; gate.innerHTML = loginPrompt(); return; }
  var id = (s.member && s.member.id) || "member";
  if (loadedFor !== id) load(id);
}
subscribeMember(render);
render(getMemberState());
