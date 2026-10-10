/* Master Legal Work: consultation booking (no framework).
   Delivery: FormSubmit (emails a table to masterlegalwork@gmail.com + acknowledgement to the client)
   or, if CONFIG.appsScriptUrl is set, the Google Apps Script web app (shared/apps-script/Code.gs).
   No payment is taken at booking: the fee is payable only after the chambers confirm the slot. */
(function () {
  "use strict";
  var CONFIG = {
    feePer30: { "Normal": 5500, "Urgent": 11000 },
    appsScriptUrl: "",    // ONE-TIME STEP (optional upgrade): deployed Apps Script web-app URL
    bookingUrl: "",       // ONE-TIME STEP: Google Calendar appointment-schedule booking page, normal slots
    urgentBookingUrl: "", // ONE-TIME STEP: urgent appointment schedule (from 1:30 PM)
    nextSlot: "",         // optional text, e.g. "Monday 12 October, 5:00 PM (in person)"
    hours: { "In person": [17 * 60, 21 * 60], "Telephonic": [16 * 60, 21 * 60], "WhatsApp": [16 * 60, 21 * 60], "Video call": [16 * 60, 21 * 60], "Urgent": [13 * 60 + 30, 21 * 60] },
    gap: 15, wa: "919872206969"
  };
  var W = window.MLW_CONFIG || {}; ["appsScriptUrl", "bookingUrl", "urgentBookingUrl", "nextSlot"].forEach(function (k) { if (W[k]) CONFIG[k] = W[k]; });
  var f = document.getElementById("cs-form"); if (!f) return;
  var $ = function (id) { return document.getElementById(id); };
  var inr = function (n) { return "\u20b9" + n.toLocaleString("en-IN"); };
  var val = function (n) { var el = f.querySelector('[name="' + n + '"]:checked') || f.querySelector('[name="' + n + '"]:not([type=radio]):not([type=checkbox])'); return el ? (el.value || "").trim() : ""; };
  var mins = function () { var d = f.querySelector('[name="Duration"]:checked'); return d ? +d.getAttribute("data-min") : 0; };
  var prio = function () { return val("Priority") || "Normal"; };
  var SVCFEE = W.serviceFees || {};
  var svc = function () { return val("Service requested") || "Consultation"; };
  var isSvc = function () { return svc() !== "Consultation"; };
  var svcFee = function () { var o = SVCFEE[svc()]; return o ? (+o.amt || 0) : 0; };
  var svcFrom = function () { var o = SVCFEE[svc()]; return o && o.from ? "From " : ""; };
  var svcNote = function () { var o = SVCFEE[svc()]; return (o && o.unit ? " " + o.unit : "") + (o && o.note ? " (final fee " + o.note + ")" : ""); };
  var fee = function () { return isSvc() ? svcFee() : mins() / 30 * CONFIG.feePer30[prio()]; };
  var feeText = function () { if (isSvc()) return svcFee() ? svcFrom() + inr(fee()) + svcNote() + ", subject to scope confirmation" : "to be confirmed in writing before any payment"; return mins() ? inr(fee()) : ""; };
  var hhmm = function (m) { var h = Math.floor(m / 60), mm = m % 60, ap = h >= 12 ? "PM" : "AM", h12 = ((h + 11) % 12) + 1; return h12 + ":" + (mm < 10 ? "0" : "") + mm + " " + ap; };

  var now = new Date(), pad = function (n) { return (n < 10 ? "0" : "") + n; };
  var REF = "MLW-" + String(now.getFullYear()).slice(2) + pad(now.getMonth() + 1) + pad(now.getDate()) + "-" + Math.random().toString(36).slice(2, 6).toUpperCase();
  $("cs-ref").textContent = REF; $("cs-ref-field").value = REF;
  var t = new Date(); t.setDate(t.getDate() + 1); $("cs-date").min = t.toISOString().slice(0, 10);
  if (CONFIG.nextSlot) $("cs-next-slot").querySelector("span").textContent = CONFIG.nextSlot + " (subject to confirmation).";

  function cal() { var u = prio() === "Urgent" ? CONFIG.urgentBookingUrl : CONFIG.bookingUrl, c = $("cs-calendar"); c.hidden = !u; if (u) c.innerHTML = '<a class="btn btn-line" href="' + u + '" target="_blank" rel="noopener">See open slots in the calendar</a>'; }
  function slots() {
    var type = val("Consultation type"), m = isSvc() ? 30 : mins(), sel = $("cs-time"), cur = sel.value;
    sel.innerHTML = "";
    if (!type || !m) { sel.innerHTML = '<option value="">Choose a mode first</option>'; return; }
    var h = CONFIG.hours[prio() === "Urgent" ? "Urgent" : type] || CONFIG.hours.Telephonic, o = document.createElement("option"); o.value = ""; o.textContent = "Choose a time"; sel.appendChild(o);
    for (var s = h[0]; s + m <= h[1]; s += 30 + CONFIG.gap) { var op = document.createElement("option"); op.value = isSvc() ? hhmm(s) : hhmm(s) + " to " + hhmm(s + m); op.textContent = op.value; sel.appendChild(op); }
    sel.value = cur;
  }
  function docs() { var a = Array.prototype.map.call(f.querySelectorAll(".cs-docchk:checked"), function (x) { return x.value; }); $("cs-docs-field").value = a.join(", "); return a; }
  function update() {
    slots(); cal(); docs();
    $("cs-prevref").hidden = val("First contact") !== "No";
    var sv = isSvc(), r = CONFIG.feePer30[prio()], d30 = f.querySelector('[name="Duration"][data-min="30"]');
    $("cs-dur-fs").hidden = sv; $("cs-prio-grp").hidden = sv; if (d30) d30.required = !sv;
    $("cs-urgent-note").hidden = sv || prio() !== "Urgent";
    Array.prototype.forEach.call(f.querySelectorAll(".cs-dfee"), function (el) { el.textContent = inr(+el.getAttribute("data-min") / 30 * r); });
    $("cs-s-svc").textContent = svc();
    $("cs-s-mode").textContent = (val("Consultation type") || "Not chosen yet") + (!sv && prio() === "Urgent" ? " (urgent)" : "");
    $("cs-s-dur").textContent = sv ? "Not applicable" : (mins() ? mins() + " minutes" : "Not chosen yet");
    if (sv) $("cs-fee").innerHTML = svcFee() ? "<b>" + svcFrom() + inr(fee()) + "</b>" + svcNote() + ", subject to scope confirmation; payable in advance only after the chambers confirm the scope and fee in writing." : "<b>[fee to be confirmed]</b>. The fee and turnaround are confirmed to you in writing before any payment.";
    else if (mins()) $("cs-fee").innerHTML = "<b>" + inr(fee()) + "</b> for " + mins() + " minutes" + (prio() === "Urgent" ? " (urgent)" : "") + ", payable in advance after the chambers confirm the slot.";
    $("cs-fee-field").value = sv ? (svcFee() ? svcFrom() + fee() + svcNote() + " (subject to scope confirmation)" : "To be confirmed") : (fee() || "");
    $("cs-wa").href = "https://wa.me/" + CONFIG.wa + "?text=" + encodeURIComponent(summary());
  }
  function summary() {
    var keys = ["Case type", "First contact", "Existing reference", "Consultation type", "Priority", "Duration", "Preferred date", "Preferred start time", "Name", "City / state", "Mobile", "email", "Opposite party", "Advice sought", "Court / forum", "Case no / CNR", "Current stage", "Next date"];
    var lines = [(isSvc() ? svc() + " request" : "Consultation booking request") + " (masterlegalwork.com)", "Booking reference: " + REF, "Service requested: " + svc()];
    keys.forEach(function (k) { if (isSvc() && (k === "Priority" || k === "Duration")) return; var v = val(k); if (v) lines.push((k === "email" ? "Email" : k) + ": " + v); });
    if (feeText()) lines.push("Fee: " + feeText());
    lines.push("Status: awaiting slot confirmation and conflict check (no payment yet)");
    lines.push("Documents: I will share a Google Drive folder named [My Name - " + REF + "] with masterlegalwork@gmail.com");
    return lines.join("\n");
  }
  try { var qs = new URLSearchParams(location.search).get("service"); if (qs) { var o = f.querySelector('[name="Service requested"][data-slug="' + qs.replace(/[^a-z-]/g, "") + '"]'); if (o) o.checked = true; } } catch (e) {}
  f.addEventListener("change", update); f.addEventListener("input", function (e) { if (e.target.tagName !== "SELECT") $("cs-wa").href = "https://wa.me/" + CONFIG.wa + "?text=" + encodeURIComponent(summary()); });
  update();

  // progress line: highlight the step in view
  var prog = document.querySelectorAll(".cs-progress a");
  if (prog.length && "IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (es) { es.forEach(function (en) { if (en.isIntersecting) Array.prototype.forEach.call(prog, function (a) { var on = a.getAttribute("href") === "#" + en.target.id; a.classList.toggle("on", on); if (on) a.setAttribute("aria-current", "step"); else a.removeAttribute("aria-current"); }); }); }, { rootMargin: "-40% 0px -55% 0px" });
    ["st1", "st2", "st3", "st4", "st5"].forEach(function (id) { var el = $(id); if (el) io.observe(el); });
  }

  function err(msg, el) { var e = $("cs-error"); e.textContent = msg; e.hidden = false; if (el && el.focus) el.focus(); return false; }
  f.addEventListener("submit", function (ev) {
    $("cs-error").hidden = true;
    var bad = Array.prototype.find.call(f.querySelectorAll("[required]"), function (el) { return !el.closest("[hidden]") && !el.checkValidity(); });
    if (bad) { ev.preventDefault(); var lab = bad.closest("label"), lg = bad.closest("fieldset").querySelector("legend").textContent.replace(/^\s*Step \d of 5\s*/, "").trim();
      var what = (bad.type === "radio" || bad.type === "checkbox" || !lab) ? lg : (lab.firstChild && lab.firstChild.nodeValue || lg).trim();
      return err("Please complete: " + what + ".", bad); }
    var name = val("Name"); docs();
    $("cs-subject").value = (isSvc() ? svc() + " request " : "Consultation booking ") + REF + ": " + name + " | " + (!isSvc() && prio() === "Urgent" ? "URGENT | " : "") + val("Consultation type") + (isSvc() ? "" : " | " + val("Duration")) + " | " + val("Preferred date") + " | fee " + feeText() + " (pending confirmation)";
    $("cs-autoresponse").value = "Dear " + name + ",\n\nThank you. Master Legal Work has received your request, booking reference " + REF + " (" + (isSvc() ? svc() + "; contact by " : "") + (!isSvc() && prio() === "Urgent" ? "URGENT, " : "") + val("Consultation type") + (isSvc() ? "" : ", " + val("Duration")) + ", requested for " + val("Preferred date") + " " + val("Preferred start time") + ").\n\nPlease do not make any payment yet. The chambers will confirm the slot and a conflict check on WhatsApp/email; the fee (" + feeText() + ") is payable in advance only after that confirmation, and the payment details are sent with it. Please mention your name and booking reference in the payment remark and send the receipt on WhatsApp +91 9872206969.\n\nDocuments: create a Google Drive folder named [Your Name - " + REF + "], upload your case documents, share it with masterlegalwork@gmail.com as Editor, and email or WhatsApp us the link. Please do not send documents as unsecured uploads.\n\nRescheduling is possible once, up to 24 hours before the slot. A consultation does not by itself create an engagement for litigation or other work.\n\nMaster Legal Work\nAdvocate Gagandeep Goel\n+91 9872206969 | masterlegalwork@gmail.com";
    var base = location.pathname.replace(/consultation\/.*$/, "");
    $("cs-next").value = location.origin + base + "consultation/thanks.html";
    try { sessionStorage.setItem("mlw_cs_summary", summary()); sessionStorage.setItem("mlw_cs_ref", REF); sessionStorage.setItem("mlw_cs_name", name); } catch (e) {}
    $("cs-submit").disabled = true; $("cs-submit").textContent = "Sending\u2026";
    if (!CONFIG.appsScriptUrl) { // no backend configured: truthful WhatsApp/email hand-off, nothing is sent silently
      ev.preventDefault(); try { sessionStorage.setItem("mlw_cs_handoff", "1"); } catch (e) {}
      location.href = $("cs-next").value + "?handoff=1"; return; }
    ev.preventDefault();
    var data = {}; Array.prototype.forEach.call(f.elements, function (el) { if (!el.name || el.type === "file" || el.name.charAt(0) === "_" && el.name !== "_honey") return; if ((el.type === "radio" || el.type === "checkbox") && !el.checked) return; data[el.name] = el.value; });
    data["Booking reference"] = REF; data["Documents held"] = docs().join(", "); data["Fee (INR)"] = $("cs-fee-field").value; data["Service requested"] = svc();
    data._autoresponse = $("cs-autoresponse").value; data._subject = $("cs-subject").value;
    fetch(CONFIG.appsScriptUrl, { method: "POST", body: JSON.stringify(data) })
      .then(function (r) { return r.json(); })
      .then(function (j) { if (j && j.ok) location.href = $("cs-next").value; else throw new Error(j && j.error || "error"); })
      .catch(function () { $("cs-submit").disabled = false; $("cs-submit").textContent = "Send booking request"; err("Sorry, the request could not be sent. Please use the WhatsApp button, or try again."); });
  });
})();
