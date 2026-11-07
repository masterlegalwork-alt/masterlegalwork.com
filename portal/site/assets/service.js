import { fetchServiceBySlug } from "/js/wix/services.js";
import { createBookingFlowStore } from "/js/wix/booking-flow-store.js";
import { esc } from "/assets/common.js";

var root = document.getElementById("root");
var slug = new URLSearchParams(location.search).get("slug") || "";
var store = null;
var activeDay = null;
var shellDrawn = false;

function inputType(t) {
  return t === "EMAIL" ? "email" : t === "PHONE" ? "tel" : t === "NUMBER" ? "number" : t === "URL" ? "url" : "text";
}

function drawShell(svc, s) {
  var fields = (s.formFields || []).map(function (f) {
    var id = "bf-" + f.target;
    var ctl;
    if (f.options && f.options.length) {
      ctl = '<select id="' + id + '" data-field="' + esc(f.target) + '"' + (f.required ? " required" : "") + '><option value="">Select</option>'
        + f.options.map(function (o) { var v = typeof o === "string" ? o : (o.value || o.label); var l = typeof o === "string" ? o : (o.label || o.value); return '<option value="' + esc(v) + '">' + esc(l) + "</option>"; }).join("")
        + "</select>";
    } else {
      ctl = '<input id="' + id + '" type="' + inputType(f.type) + '" data-field="' + esc(f.target) + '"' + (f.required ? " required" : "") + ">";
    }
    return '<label for="' + id + '">' + esc(f.label) + (f.required ? " *" : "") + "</label>" + ctl;
  }).join("");
  root.innerHTML = '<span class="pill">' + (svc.conferencing ? "Online" : "At office") + "</span>"
    + "<h1>" + esc(svc.name) + "</h1>"
    + '<p class="muted">' + [svc.durationLabel, svc.price].filter(Boolean).map(esc).join(" &middot; ") + "</p>"
    + (svc.description ? '<div class="small" style="max-width:640px">' + svc.description + "</div>" : "")
    + '<section class="card section">'
    + "<h2>1. Choose a date and time</h2>"
    + '<p class="small muted" data-tz></p>'
    + '<div class="days" data-days></div>'
    + '<div class="slots" data-slots></div>'
    + '<div data-next></div>'
    + "</section>"
    + '<form class="card section" data-form novalidate>'
    + "<h2>2. Your details</h2>"
    + fields
    + '<p class="err" data-error></p>'
    + '<div class="form-actions"><button class="btn btn-brass" type="submit" data-cta>Request consultation</button></div>'
    + "</form>"
    + '<div class="success section" data-done hidden><h2>Request received</h2><p>Thank you. Our office will confirm your consultation by email.</p></div>';
  shellDrawn = true;
}

function slotByKey(s, key) {
  var found = null;
  (s.days || []).forEach(function (d) { (d.slots || []).forEach(function (sl) { if (sl.key === key) found = sl; }); });
  return found;
}

function render(s) {
  if (!shellDrawn) return;
  var days = s.days;
  var daysEl = root.querySelector("[data-days]");
  var slotsEl = root.querySelector("[data-slots]");
  root.querySelector("[data-tz]").textContent = s.timeZoneLabel ? "Times shown in " + s.timeZoneLabel : "";
  if (days == null) {
    daysEl.innerHTML = "";
    slotsEl.innerHTML = '<p class="muted">Loading available times…</p>';
  } else {
    if (!activeDay || !days.some(function (d) { return d.dayKey === activeDay; })) {
      var first = days.find(function (d) { return (d.slots || []).some(function (x) { return x.bookable; }); }) || days[0];
      activeDay = first ? first.dayKey : null;
    }
    daysEl.innerHTML = '<button type="button" class="wk" data-week="prev" aria-label="Previous week">&lsaquo;</button>'
      + days.map(function (d) {
        var open = (d.slots || []).some(function (x) { return x.bookable; });
        return '<button type="button" data-day="' + esc(d.dayKey) + '" aria-pressed="' + (d.dayKey === activeDay) + '"' + (open ? "" : " disabled") + ">" + esc(d.dayLabel) + "</button>";
      }).join("")
      + '<button type="button" class="wk" data-week="next" aria-label="Next week">&rsaquo;</button>';
    var day = days.find(function (d) { return d.dayKey === activeDay; });
    var slots = day ? (day.slots || []) : [];
    slotsEl.innerHTML = slots.length
      ? slots.map(function (sl) {
        return '<button type="button" data-slot="' + esc(sl.key) + '"' + (sl.bookable ? "" : " disabled")
          + ' aria-pressed="' + !!(s.selectedSlot && s.selectedSlot.key === sl.key) + '">' + esc(sl.label) + "</button>";
      }).join("")
      : '<p class="muted">No times available on this day.</p>';
  }
  var nextEl = root.querySelector("[data-next]");
  var weekEmpty = days && !days.some(function (d) { return (d.slots || []).some(function (x) { return x.bookable; }); });
  if (weekEmpty && s.nextAvailable && s.nextAvailable.length) {
    var n = s.nextAvailable[0];
    nextEl.innerHTML = '<button type="button" class="linkbtn" data-jump="' + esc(n.dayKey) + '">Next available: ' + esc(n.dayLabel || n.dayKey) + " &rarr;</button>";
  } else if (weekEmpty && s.nextAvailable && !s.nextAvailable.length) {
    nextEl.innerHTML = '<p class="muted">No times are open right now. Please contact our office or send an enquiry.</p>';
  } else {
    nextEl.innerHTML = "";
  }
  var cta = root.querySelector("[data-cta]");
  cta.disabled = !s.canBook || s.booking;
  cta.textContent = s.booking ? "Sending…" : s.ctaState === "requestToBook" ? "Request consultation" : "Book consultation";
  var errText = s.error || "";
  if (/payment/i.test(errText)) errText = "Online booking is being set up. Please call or email our office to fix a consultation.";
  root.querySelector("[data-error]").textContent = errText;
  if (s.confirmed) {
    root.querySelector("[data-done]").hidden = false;
    root.querySelector("[data-form]").hidden = true;
  }
}

function wire() {
  root.addEventListener("click", function (e) {
    var b = e.target.closest("button");
    if (!b || !store) return;
    var d = b.dataset;
    if (d.day) { activeDay = d.day; render(store.getState()); }
    else if (d.week === "next") { activeDay = null; store.nextWeek(); }
    else if (d.week === "prev") { activeDay = null; store.prevWeek(); }
    else if (d.slot) { var sl = slotByKey(store.getState(), d.slot); if (sl) store.setSelectedSlot(sl); }
    else if (d.jump) { activeDay = d.jump; store.jumpTo(d.jump); }
  });
  root.addEventListener("input", function (e) {
    if (e.target.dataset && e.target.dataset.field && store) store.setValue(e.target.dataset.field, e.target.value);
  });
  root.addEventListener("change", function (e) {
    if (e.target.dataset && e.target.dataset.field && store) store.setValue(e.target.dataset.field, e.target.value);
  });
  root.addEventListener("submit", function (e) {
    e.preventDefault();
    if (store) store.book().catch(function () {});
  });
}

fetchServiceBySlug(slug).then(function (svc) {
  if (!svc) { root.innerHTML = '<div class="card panel"><p>This consultation is not available. <a href="/book.html">See all consultations</a>.</p></div>'; return; }
  document.title = svc.name + " | Master Legal Work Client Portal";
  store = createBookingFlowStore(svc);
  var formDrawnWith = -1;
  store.subscribe(function (s) {
    var count = (s.formFields || []).length;
    if (!shellDrawn || count !== formDrawnWith) { drawShell(svc, s); formDrawnWith = count; }
    render(s);
  });
  drawShell(svc, store.getState());
  formDrawnWith = (store.getState().formFields || []).length;
  render(store.getState());
  wire();
  store.start();
}).catch(function () {
  root.innerHTML = '<div class="card panel"><p class="err">This page could not be loaded. Please refresh.</p></div>';
});
