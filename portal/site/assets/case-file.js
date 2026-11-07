// Client Information Form: parties (memo of parties) and list of dates, linked to one matter.
import { subscribeMember, getMemberState } from "/js/wix/member-store.js";
import { getItemById, queryItems, insertItem, updateItem, removeItem } from "/js/wix/items.js";
import { esc } from "/assets/common.js";
import { loginPrompt } from "/assets/portal-data.js";

var gate = document.getElementById("gate");
var id = new URLSearchParams(location.search).get("id") || "";
var matter = null, parties = [], events = [], loaded = false;

var ROLES = ["Petitioner", "Respondent", "Plaintiff", "Defendant", "Complainant", "Accused", "Applicant", "Non-applicant", "Appellant", "Revisionist", "Decree Holder", "Judgment Debtor", "Claimant", "Opposite Party", "Proposed Respondent", "Other"];
var RELATIONS = ["son of", "daughter of", "wife of", "husband of", "widow of", "through", "(none: company / department)"];
var COUNSEL = [
  "Gagandeep Goel, Advocate",
  "Enrolment No. P/1983/2007",
  "Gagandeep Goel & Associates | Master Legal Work",
  "Chamber No. 422, 4th Floor, District & Sessions Court, Sector 43, Chandigarh",
  "Phone: 987 220 6969 / 88173 00001 | Email: masterlegalwork@gmail.com",
];

// ---------- helpers ----------
function day(v) { return v ? String(v.$date || v).slice(0, 10) : ""; }
function toDate(s) { return s ? new Date(s + "T00:00:00Z") : null; }
function ddmmyyyy(s) { s = day(s); return s ? s.slice(8, 10) + "." + s.slice(5, 7) + "." + s.slice(0, 4) : ""; }
function yearsBetween(fromIso, to) {
  var f = new Date(day(fromIso) + "T00:00:00Z");
  if (isNaN(f)) return null;
  var y = to.getUTCFullYear() - f.getUTCFullYear();
  if (to.getUTCMonth() < f.getUTCMonth() || (to.getUTCMonth() === f.getUTCMonth() && to.getUTCDate() < f.getUTCDate())) y--;
  return y;
}
export function presentAge(p, today) {
  today = today || new Date();
  if (p.dob) return yearsBetween(p.dob, today);
  if (p.age != null && p.age !== "") {
    var n = Number(p.age);
    if (isNaN(n)) return null;
    return p.ageAsOn ? n + Math.max(0, yearsBetween(p.ageAsOn, today) || 0) : n;
  }
  return null;
}
function br(v, label) { return v ? esc(v) : '<span class="tbc">[' + label + " to be confirmed]</span>"; }
function txt(v, label) { return v ? v : "[" + label + " to be confirmed]"; }
function aadhaarFmt(a) { var d = String(a || "").replace(/\D/g, ""); return d.length === 12 ? d.replace(/(\d{4})(\d{4})(\d{4})/, "$1 $2 $3") : a; }
function isOur(p) { return (p.side || "Our side") === "Our side"; }
function bySerial(a, b) { return (Number(a.serial) || 999) - (Number(b.serial) || 999); }
var MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
function sortKey(ev) {
  var d = day(ev.eventDate);
  if (d) return d;
  var t = String(ev.dateNote || "").toLowerCase(), y = t.match(/(19|20)\d{2}/);
  if (!y) return "9999";
  var m = MONTHS.findIndex(function (n) { return t.indexOf(n) >= 0; });
  return y[0] + "-" + (m >= 0 ? String(m + 1).padStart(2, "0") : "00") + "-00";
}
function byDate(a, b) { var x = sortKey(a), y = sortKey(b); return x < y ? -1 : x > y ? 1 : 0; }
function plural(role, n) {
  if (!role) return "";
  if (n < 2) return role;
  if (/y$/.test(role) && !/ey$/.test(role)) return role.replace(/y$/, "ies");
  if (/s$/.test(role)) return role;
  return role + "s";
}

// ---------- court heading ----------
function courtHeading(m) {
  var c = (m.courtName || m.court || "").trim();
  if (/high court/i.test(c) && /punjab/i.test(c)) return "IN THE HIGH COURT OF PUNJAB AND HARYANA AT CHANDIGARH";
  if (!c) return "IN THE COURT OF [Court to be confirmed]";
  return /^in the /i.test(c) ? c.toUpperCase() : "IN THE COURT OF " + c.toUpperCase();
}

// ---------- memo of parties (court format) ----------
function partyLine(p, n, html) {
  var f = html ? br : function (v, l) { return txt(v, l); };
  var e = html ? esc : function (v) { return v; };
  var age = presentAge(p);
  var rel = p.relation && p.relation.indexOf("(none") !== 0 ? p.relation : "";
  var company = p.relation && p.relation.indexOf("(none") === 0;
  var s = n + ". " + f(p.fullName, "Name");
  if (rel) s += " " + e(rel) + " " + f(p.relativeName, "Father's / Husband's name");
  else if (!company) s += " " + f("", "Father's / Husband's name");
  if (!company) s += ", aged about " + (age != null ? age + " years" : f("", "Age"));
  s += (company ? ", having its office at " : ", resident of ") + f(p.address, "Address") + " – " + f(p.pin, "PIN Code") + ".";
  var tail = company ? "(M) " + f(p.phone, "Phone No.")
    : "Aadhar No. " + (p.aadhaar ? e(aadhaarFmt(p.aadhaar)) : f("", "Aadhaar No.")) + ", (M) " + f(p.phone, "Phone No.");
  if (p.email) tail += "; E-mail: " + e(p.email);
  return { main: s, tail: tail + "." };
}
function sideBlock(list, html) {
  var role = list.length ? (list[0].role || "") : "";
  var lines = list.map(function (p, i) { return partyLine(p, i + 1, html); });
  return { lines: lines, label: "…" + plural(role, list.length) };
}
function memoParts() {
  var ours = parties.filter(isOur).sort(bySerial), opp = parties.filter(function (p) { return !isOur(p); }).sort(bySerial);
  return { ours: ours, opp: opp };
}
function memoHtml() {
  var mp = memoParts();
  function block(list) {
    if (!list.length) return '<p class="tbc">[Party details to be confirmed]</p>';
    var b = sideBlock(list, true);
    return b.lines.map(function (l) { return '<p class="party">' + l.main + "<br>" + l.tail + "</p>"; }).join("")
      + '<p class="role">' + esc(b.label) + "</p>";
  }
  return '<div class="court-doc" id="memo-doc">'
    + '<p class="c-head">' + esc(courtHeading(matter)) + "</p>"
    + '<p class="c-center">' + esc(matter.caseNumber || "[Case No. to be confirmed]") + "</p>"
    + (matter.nextHearing ? '<p class="c-center">Next Date: ' + ddmmyyyy(matter.nextHearing) + "</p>" : "")
    + '<p class="c-title">MEMO OF PARTIES</p>'
    + block(mp.ours) + '<p class="c-center"><strong>Versus</strong></p>' + block(mp.opp)
    + counselHtml() + "</div>";
}
function memoText() {
  var mp = memoParts(), out = [courtHeading(matter), matter.caseNumber || "[Case No. to be confirmed]", "", "MEMO OF PARTIES", ""];
  function block(list) {
    if (!list.length) { out.push("[Party details to be confirmed]"); return; }
    var b = sideBlock(list, false);
    b.lines.forEach(function (l) { out.push(l.main, l.tail, ""); });
    out.push("\t\t\t\t\t" + b.label, "");
  }
  block(mp.ours); out.push("Versus", ""); block(mp.opp);
  out.push("Place: Chandigarh", "Date: " + ddmmyyyy(new Date().toISOString()), "", "Through Counsel", "");
  return out.concat(COUNSEL).join("\n");
}
function counselHtml() {
  return '<div class="counsel"><p>Place: Chandigarh<br>Date: ' + ddmmyyyy(new Date().toISOString()) + "</p>"
    + '<p class="c-right">Through Counsel<br><br>' + COUNSEL.map(esc).join("<br>") + "</p></div>";
}

// ---------- list of dates ----------
function datesHtml() {
  var list = events.slice().sort(byDate);
  var rows = list.length ? list.map(function (ev, i) {
    return "<tr><td>" + (i + 1) + "</td><td>" + (day(ev.eventDate) ? ddmmyyyy(ev.eventDate) : br(ev.dateNote, "Date")) + "</td><td>" + br(ev.event, "Event")
      + "</td><td>" + (ev.document ? esc(ev.document) : "") + "</td></tr>";
  }).join("") : '<tr><td colspan="4" class="tbc">[Dates and events to be confirmed]</td></tr>';
  return '<div class="court-doc" id="dates-doc">'
    + '<p class="c-head">' + esc(courtHeading(matter)) + "</p>"
    + '<p class="c-center">' + esc(matter.caseNumber || "[Case No. to be confirmed]") + "</p>"
    + '<p class="c-center">' + esc(matter.parties || matter.title || "") + "</p>"
    + '<p class="c-title">LIST OF DATES AND EVENTS</p>'
    + '<table class="doc-table"><thead><tr><th>Sr. No.</th><th>Date</th><th>Event</th><th>Document / Annexure</th></tr></thead><tbody>' + rows + "</tbody></table>"
    + counselHtml() + "</div>";
}

// ---------- entry forms ----------
function opt(list, v) { return list.map(function (o) { return '<option' + (o === v ? " selected" : "") + ">" + esc(o) + "</option>"; }).join(""); }
function partyForm(p) {
  p = p || { side: "Our side" };
  return '<form class="card entry" data-kind="party" data-id="' + esc(p._id || "") + '" novalidate>'
    + "<h3>" + (p._id ? "Edit party" : "Add a party") + "</h3>"
    + '<div class="row2"><div><label>Side</label><select name="side">' + opt(["Our side", "Opposite side"], p.side) + "</select></div>"
    + '<div><label>Described in the case as</label><select name="role">' + opt(ROLES, p.role || (p.side === "Opposite side" ? "Respondent" : "Petitioner")) + "</select></div></div>"
    + '<div class="row2"><div><label>Full name *</label><input type="text" name="fullName" required value="' + esc(p.fullName || "") + '" placeholder="e.g. Ram Kumar, or M/s ABC Pvt. Ltd. through its Director Sh. X"></div>'
    + '<div><label>Order in the list</label><input name="serial" type="number" min="1" value="' + esc(p.serial || "") + '" placeholder="1"></div></div>'
    + '<div class="row2"><div><label>Relation</label><select name="relation">' + opt(RELATIONS, p.relation || "son of") + "</select></div>"
    + '<div><label>Father\'s / Husband\'s name</label><input type="text" name="relativeName" value="' + esc(p.relativeName || "") + '" placeholder="e.g. Sh. Shyam Lal"></div></div>'
    + '<div class="row2"><div><label>Date of birth</label><input name="dob" type="date" value="' + day(p.dob) + '"></div>'
    + '<div><label>Or present age in years (if date of birth not known)</label><input name="age" type="number" min="0" max="120" value="' + esc(p.age != null ? p.age : "") + '"></div></div>'
    + '<label>Complete address *</label><textarea name="address" rows="2" required placeholder="House No., Street, Sector / Village, City, District, State">' + esc(p.address || "") + "</textarea>"
    + '<div class="row3"><div><label>PIN code</label><input type="text" name="pin" inputmode="numeric" pattern="[0-9]{6}" maxlength="6" value="' + esc(p.pin || "") + '"></div>'
    + '<div><label>Mobile</label><input name="phone" type="tel" value="' + esc(p.phone || "") + '"></div>'
    + '<div><label>E-mail</label><input name="email" type="email" value="' + esc(p.email || "") + '"></div></div>'
    + '<label>Aadhaar number</label><input type="text" name="aadhaar" inputmode="numeric" maxlength="14" value="' + esc(p.aadhaar || "") + '" placeholder="12 digits (needed for the Memo of Parties)">'
    + '<p class="err" data-err></p><div class="form-actions"><button class="btn" type="submit">Save party</button>'
    + (p._id ? '<button class="linkbtn" type="button" data-cancel>Cancel</button>' : "") + "</div></form>";
}
function eventForm(ev) {
  ev = ev || {};
  return '<form class="card entry" data-kind="event" data-id="' + esc(ev._id || "") + '" novalidate>'
    + "<h3>" + (ev._id ? "Edit date" : "Add a date and event") + "</h3>"
    + '<div class="row2"><div><label>Date</label><input name="eventDate" type="date" value="' + day(ev.eventDate) + '"></div>'
    + '<div><label>Or approximate date (if exact date not known)</label><input type="text" name="dateNote" value="' + esc(ev.dateNote || "") + '" placeholder="e.g. April 2016"></div></div>'
    + '<label>What happened *</label><textarea name="event" rows="3" required placeholder="e.g. Agreement to sell executed for Rs. 25,00,000; Rs. 5,00,000 paid as earnest money by cheque.">' + esc(ev.event || "") + "</textarea>"
    + '<label>Document, if any</label><input type="text" name="document" value="' + esc(ev.document || "") + '" placeholder="e.g. Copy of agreement dated 12.04.2016">'
    + '<p class="err" data-err></p><div class="form-actions"><button class="btn" type="submit">Save date</button>'
    + (ev._id ? '<button class="linkbtn" type="button" data-cancel>Cancel</button>' : "") + "</div></form>";
}

// ---------- page ----------
function partyRow(p) {
  var age = presentAge(p);
  return "<tr><td>" + esc(p.side === "Opposite side" ? "Opposite" : "Ours") + "</td><td>" + esc(p.role || "") + "</td><td><strong>" + esc(p.fullName || "") + "</strong><br><span class=\"small muted\">"
    + esc([p.relation && p.relation.indexOf("(none") !== 0 && p.relativeName ? p.relation + " " + p.relativeName : "", p.address].filter(Boolean).join(", ")) + "</span></td><td>"
    + (age != null ? age + " yrs" : p.relation && p.relation.indexOf("(none") === 0 ? "—" : '<span class="tbc">?</span>') + '</td><td class="act"><button class="linkbtn" data-edit-party="' + esc(p._id) + '">Edit</button> <button class="linkbtn" data-del-party="' + esc(p._id) + '">Delete</button></td></tr>';
}
function eventRow(ev, i) {
  return "<tr><td>" + (i + 1) + "</td><td>" + (day(ev.eventDate) ? ddmmyyyy(ev.eventDate) : esc(ev.dateNote || "?")) + "</td><td>" + esc(ev.event || "") + (ev.document ? '<br><span class="small muted">' + esc(ev.document) + "</span>" : "")
    + '</td><td class="act"><button class="linkbtn" data-edit-event="' + esc(ev._id) + '">Edit</button> <button class="linkbtn" data-del-event="' + esc(ev._id) + '">Delete</button></td></tr>';
}
function draw() {
  var ps = parties.slice().sort(function (a, b) { return (isOur(a) ? 0 : 1) - (isOur(b) ? 0 : 1) || bySerial(a, b); });
  var es = events.slice().sort(byDate);
  document.getElementById("cf-title").textContent = "Parties and dates: " + (matter.title || "");
  gate.innerHTML = '<div class="noprint">'
    + '<div class="cf-tabs" role="tablist"><button data-tab="parties" aria-selected="true">1. Parties (' + parties.length + ')</button><button data-tab="dates" aria-selected="false">2. Dates and events (' + events.length + ')</button><button data-tab="memo" aria-selected="false">3. Memo of Parties</button><button data-tab="lod" aria-selected="false">4. List of Dates</button></div>'
    + '<section data-panel="parties"><div class="tablewrap"><table class="grid-table"><thead><tr><th>Side</th><th>Described as</th><th>Name and address</th><th>Present age</th><th></th></tr></thead><tbody>'
    + (ps.length ? ps.map(partyRow).join("") : '<tr><td colspan="5" class="muted">No parties added yet. Start with yourself, then the opposite party.</td></tr>') + "</tbody></table></div>"
    + '<div id="party-form">' + partyForm() + "</div></section>"
    + '<section data-panel="dates" hidden><div class="tablewrap"><table class="grid-table"><thead><tr><th>Sr.</th><th>Date</th><th>Event</th><th></th></tr></thead><tbody>'
    + (es.length ? es.map(eventRow).join("") : '<tr><td colspan="4" class="muted">No dates added yet. Add each important date in your own words: agreements, payments, notices, complaints, orders.</td></tr>') + "</tbody></table></div>"
    + '<div id="event-form">' + eventForm() + "</div></section>"
    + '<section data-panel="memo" hidden><div class="form-actions"><button class="btn" data-print="memo">Print / Save as PDF</button><button class="btn btn-brass" data-copy>Copy text</button></div><p class="small muted">Ages are worked out as on today from the date of birth (or the age given and when it was given). Items in [brackets] are still to be confirmed.</p>' + memoHtml() + "</section>"
    + '<section data-panel="lod" hidden><div class="form-actions"><button class="btn" data-print="lod">Print / Save as PDF</button></div>' + datesHtml() + "</section>"
    + "</div>"
    + '<div class="print-only" id="print-area"></div>';
}
function showTab(name) {
  gate.querySelectorAll("[data-panel]").forEach(function (s) { s.hidden = s.getAttribute("data-panel") !== name; });
  gate.querySelectorAll("[data-tab]").forEach(function (b) { b.setAttribute("aria-selected", String(b.getAttribute("data-tab") === name)); });
}
var current = "parties";

function readForm(f) {
  var d = {};
  f.querySelectorAll("input,select,textarea").forEach(function (el) { d[el.name] = el.value.trim(); });
  return d;
}
function saveParty(f) {
  var d = readForm(f), err = f.querySelector("[data-err]");
  if (!d.fullName || !d.address) { err.textContent = "Please enter the full name and complete address."; return; }
  if (d.pin && !/^\d{6}$/.test(d.pin)) { err.textContent = "PIN code must be 6 digits."; return; }
  var a = d.aadhaar.replace(/\D/g, "");
  if (d.aadhaar && a.length !== 12) { err.textContent = "Aadhaar number must be 12 digits."; return; }
  var rec = {
    matter: id, side: d.side, role: d.role, fullName: d.fullName, serial: d.serial ? Number(d.serial) : null,
    relation: d.relation, relativeName: d.relativeName, dob: toDate(d.dob), age: d.dob ? null : (d.age !== "" ? Number(d.age) : null),
    ageAsOn: !d.dob && d.age !== "" ? toDate(new Date().toISOString().slice(0, 10)) : null,
    address: d.address, pin: d.pin, phone: d.phone, email: d.email, aadhaar: a,
  };
  var editId = f.getAttribute("data-id");
  var old = editId && parties.find(function (p) { return p._id === editId; });
  if (old && !d.dob && String(old.age) === d.age && old.ageAsOn) rec.ageAsOn = old.ageAsOn; // keep original "as on" date
  err.textContent = "Saving…";
  var job = editId ? updateItem("Parties", Object.assign({}, old, rec, { _id: editId })) : insertItem("Parties", rec);
  job.then(function () { current = "parties"; return refresh(); }).catch(function () { err.textContent = "Could not save. Please check your connection and try again."; });
}
function saveEvent(f) {
  var d = readForm(f), err = f.querySelector("[data-err]");
  if (!d.event) { err.textContent = "Please describe what happened."; return; }
  if (!d.eventDate && !d.dateNote) { err.textContent = "Please give the date, or an approximate date."; return; }
  var rec = { matter: id, eventDate: toDate(d.eventDate), dateNote: d.dateNote, event: d.event, document: d.document };
  var editId = f.getAttribute("data-id");
  var old = editId && events.find(function (e) { return e._id === editId; });
  err.textContent = "Saving…";
  var job = editId ? updateItem("Chronology", Object.assign({}, old, rec, { _id: editId })) : insertItem("Chronology", rec);
  job.then(function () { current = "dates"; return refresh(); }).catch(function () { err.textContent = "Could not save. Please check your connection and try again."; });
}
function printDoc(which) {
  var area = document.getElementById("print-area");
  area.innerHTML = which === "memo" ? memoHtml() : datesHtml();
  window.print();
}

gate.addEventListener("submit", function (e) {
  e.preventDefault();
  var f = e.target;
  if (f.getAttribute("data-kind") === "party") saveParty(f); else saveEvent(f);
});
gate.addEventListener("click", function (e) {
  var t = e.target.closest("button");
  if (!t) return;
  var a;
  if ((a = t.getAttribute("data-tab"))) { current = a; showTab(a); }
  else if ((a = t.getAttribute("data-edit-party"))) { document.getElementById("party-form").innerHTML = partyForm(parties.find(function (p) { return p._id === a; })); document.getElementById("party-form").scrollIntoView({ behavior: "smooth" }); }
  else if ((a = t.getAttribute("data-edit-event"))) { document.getElementById("event-form").innerHTML = eventForm(events.find(function (x) { return x._id === a; })); document.getElementById("event-form").scrollIntoView({ behavior: "smooth" }); }
  else if ((a = t.getAttribute("data-del-party"))) { if (confirm("Delete this party?")) removeItem("Parties", a).then(refresh); }
  else if ((a = t.getAttribute("data-del-event"))) { if (confirm("Delete this date?")) removeItem("Chronology", a).then(refresh); }
  else if (t.hasAttribute("data-cancel")) { draw(); showTab(current); }
  else if ((a = t.getAttribute("data-print"))) printDoc(a);
  else if (t.hasAttribute("data-copy")) {
    navigator.clipboard.writeText(memoText()).then(function () { t.textContent = "Copied"; setTimeout(function () { t.textContent = "Copy text"; }, 1500); });
  }
});

function refresh() {
  var byMatter = [{ field: "matter", op: "eq", value: id }];
  return Promise.all([
    queryItems("Parties", { filters: byMatter, limit: 100 }),
    queryItems("Chronology", { filters: byMatter, limit: 500 }),
  ]).then(function (r) {
    parties = (r[0] && r[0].items) || [];
    events = (r[1] && r[1].items) || [];
    draw(); showTab(current);
  });
}
function load() {
  loaded = true;
  if (!id) { gate.innerHTML = '<div class="card panel"><p>This matter could not be found.</p></div>'; return; }
  document.getElementById("back").href = "/matter.html?id=" + encodeURIComponent(id);
  getItemById("Matters", id).then(function (m) {
    if (!m) { gate.innerHTML = '<div class="card panel"><p>This matter could not be found, or it is not linked to your login.</p></div>'; return; }
    matter = m;
    return refresh();
  }).catch(function () {
    loaded = false;
    gate.innerHTML = '<div class="card panel"><p class="err">We could not load this page right now. Please refresh.</p></div>';
  });
}
function render(s) {
  if (s.loading) return;
  if (!s.loggedIn) { loaded = false; gate.innerHTML = loginPrompt(); return; }
  if (!loaded) load();
}
subscribeMember(render);
render(getMemberState());
