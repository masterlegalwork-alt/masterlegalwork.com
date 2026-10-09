/* Master Legal Work: consultation booking (no framework).
   Delivery: FormSubmit (emails a table to masterlegalwork@gmail.com + acknowledgement to the client)
   or, if CONFIG.appsScriptUrl is set, the Google Apps Script web app in /tools/apps-script/Code.gs. */
(function () {
  "use strict";
  var CONFIG = {
    feePer30: { "Normal": 5500, "Urgent": 11000 },
    appsScriptUrl: "",   // ONE-TIME STEP (optional upgrade): paste the deployed Apps Script web-app URL here
    bookingUrl: "",      // ONE-TIME STEP: Google Calendar appointment-schedule booking page, normal slots (legalcarepro)
    urgentBookingUrl: "", // ONE-TIME STEP: separate urgent appointment schedule (from 1:30 PM)
    cashfreeUrl: "",     // ONE-TIME STEP: Cashfree payment link/form once the account is active
    hours: { "In person": [17 * 60, 21 * 60], "Telephonic": [16 * 60, 21 * 60], "WhatsApp": [16 * 60, 21 * 60], "Urgent": [13 * 60 + 30, 21 * 60] },
    gap: 15, wa: "919872206969", upi: "9872206969-2@okbizaxis"
  };
  var f = document.getElementById("cs-form"); if (!f) return;
  var $ = function (id) { return document.getElementById(id); };
  var inr = function (n) { return "\u20b9" + n.toLocaleString("en-IN"); };
  var val = function (n) { var el = f.querySelector('[name="' + n + '"]:checked') || f.querySelector('[name="' + n + '"]'); return el ? (el.value || "").trim() : ""; };
  var mins = function () { var d = f.querySelector('[name="Duration"]:checked'); return d ? +d.getAttribute("data-min") : 0; };
  var prio = function () { return val("Priority") || "Normal"; };
  var fee = function () { return mins() / 30 * CONFIG.feePer30[prio()]; };
  var hhmm = function (m) { var h = Math.floor(m / 60), mm = m % 60, ap = h >= 12 ? "PM" : "AM", h12 = ((h + 11) % 12) + 1; return h12 + ":" + (mm < 10 ? "0" : "") + mm + " " + ap; };

  // booking reference
  var now = new Date(), pad = function (n) { return (n < 10 ? "0" : "") + n; };
  var REF = "MLW-" + String(now.getFullYear()).slice(2) + pad(now.getMonth() + 1) + pad(now.getDate()) + "-" + Math.random().toString(36).slice(2, 6).toUpperCase();
  $("cs-ref").textContent = REF; $("cs-ref-field").value = REF;
  // date: from tomorrow
  var t = new Date(); t.setDate(t.getDate() + 1);
  $("cs-date").min = t.toISOString().slice(0, 10);
  function cal() { var u = prio() === "Urgent" ? CONFIG.urgentBookingUrl : CONFIG.bookingUrl, c = $("cs-calendar"); c.hidden = !u; if (u) c.innerHTML = '<a class="btn btn-line" href="' + u + '" target="_blank" rel="noopener">See open slots in the calendar</a>'; }

  function slots() {
    var type = val("Consultation type"), m = mins(), sel = $("cs-time"), cur = sel.value;
    sel.innerHTML = "";
    if (!type || !m) { sel.innerHTML = '<option value="">Choose type and duration first</option>'; return; }
    var h = CONFIG.hours[prio() === "Urgent" ? "Urgent" : type] || CONFIG.hours.Telephonic, o = document.createElement("option"); o.value = ""; o.textContent = "Choose a time"; sel.appendChild(o);
    for (var s = h[0]; s + m <= h[1]; s += 30 + CONFIG.gap) {
      var op = document.createElement("option"); op.value = hhmm(s) + " to " + hhmm(s + m); op.textContent = op.value; sel.appendChild(op);
    }
    sel.value = cur;
  }
  function docs() { var a = Array.prototype.map.call(f.querySelectorAll(".cs-docchk:checked"), function (x) { return x.value; }); $("cs-docs-field").value = a.join(", "); return a; }
  function update() {
    slots(); cal(); docs();
    var r = CONFIG.feePer30[prio()];
    Array.prototype.forEach.call(f.querySelectorAll(".cs-dfee"), function (el) { el.textContent = inr(+el.getAttribute("data-min") / 30 * r); });
    $("cs-urgent-note").hidden = prio() !== "Urgent";
    var m = mins();
    if (m) {
      $("cs-fee").innerHTML = (prio() === "Urgent" ? "Urgent fee" : "Fee") + " for " + m + " minutes: <b>" + inr(fee()) + "</b>, payable in advance. The consultation goes ahead only after payment.";
      $("cs-pay").hidden = false; $("cs-amt").textContent = inr(fee());
      $("cs-upi").href = "upi://pay?pa=" + CONFIG.upi + "&pn=Gagandeep%20Goel&am=" + fee() + "&cu=INR&tn=" + encodeURIComponent((prio() === "Urgent" ? "Urgent consultation " : "Consultation ") + m + " min");
      $("cs-upi").textContent = "Pay " + inr(fee()) + " by UPI app";
      $("cs-fee-field").value = fee();
      if (CONFIG.cashfreeUrl) { var g = $("cs-gateway"); g.hidden = false; g.innerHTML = 'Or pay online by card / net banking: <a href="' + CONFIG.cashfreeUrl + '" target="_blank" rel="noopener">secure payment page</a>.'; }
    }
    $("cs-wa").href = "https://wa.me/" + CONFIG.wa + "?text=" + encodeURIComponent(summary());
  }
  function summary() {
    var keys = ["Consultation type", "Priority", "Duration", "Preferred date", "Preferred start time", "Name", "Mobile", "email", "Court / forum", "Case type", "Case no / CNR", "Parties", "Current stage", "Next date", "Advice sought", "Payment mode", "Payment reference (UTR)"];
    var lines = ["Consultation booking request (masterlegalwork.com)", "Booking reference: " + REF];
    keys.forEach(function (k) { var v = val(k); if (v) lines.push((k === "email" ? "Email" : k) + ": " + v); });
    if (mins()) lines.push("Fee: " + inr(fee()));
    lines.push("Payment screenshot and documents: sending in this chat");
    return lines.join("\n");
  }
  f.addEventListener("change", update); f.addEventListener("input", function (e) { if (e.target.tagName !== "SELECT") $("cs-wa").href = "https://wa.me/" + CONFIG.wa + "?text=" + encodeURIComponent(summary()); });
  update();

  function err(msg, el) { var e = $("cs-error"); e.textContent = msg; e.hidden = false; if (el && el.focus) el.focus(); return false; }
  f.addEventListener("submit", function (ev) {
    $("cs-error").hidden = true;
    var bad = Array.prototype.find.call(f.querySelectorAll("[required]"), function (el) { return !el.checkValidity(); });
    if (bad) { ev.preventDefault(); var lab = bad.closest("label"), lg = bad.closest("fieldset").querySelector("legend").textContent.replace(/^\s*\d\s*/, "").trim();
      var what = (bad.type === "radio" || bad.type === "checkbox" || !lab) ? lg : (lab.firstChild && lab.firstChild.nodeValue || lg).trim();
      return err("Please complete: " + what + ".", bad); }
    var file = $("cs-shot").files[0];
    if (file && (file.size > 2 * 1024 * 1024 || !/^image\//.test(file.type))) { ev.preventDefault(); return err("The payment screenshot must be an image of up to 2 MB.", $("cs-shot")); }
    var name = val("Name"), amount = inr(fee());
    docs();
    $("cs-subject").value = "Consultation booking " + REF + ": " + name + " | " + (prio() === "Urgent" ? "URGENT | " : "") + val("Consultation type") + " | " + val("Duration") + " | " + val("Preferred date") + " | " + amount + " (pending confirmation)";
    $("cs-autoresponse").value = "Dear " + name + ",\n\nThank you. Master Legal Work has received your consultation request, booking reference " + REF + " (" + (prio() === "Urgent" ? "URGENT, " : "") + val("Consultation type") + ", " + val("Duration") + ", requested " + val("Preferred date") + " " + val("Preferred start time") + ").\n\nFee: " + amount + ", payable in advance. Payment details: UPI " + CONFIG.upi + "; or Yes Bank current account 001563300002051, IFSC YESB0000015; or ICICI Bank savings account 093501-500588, IFSC ICIC0001896; account name Gagandeep Goel. Your payment reference: " + val("Payment reference (UTR)") + ".\n\nPlease send all relevant documents simultaneously to masterlegalwork@gmail.com and WhatsApp +91 9872206969, quoting your name and booking reference (" + REF + "), so they can be studied before the consultation.\n\nThe consultation goes ahead only after the payment is received; until then your booking is pending. The time will be confirmed to you on WhatsApp or email. The fee is non-refundable; the consultation can be rescheduled once with at least 24 hours' notice. A consultation does not by itself create an advocate-client relationship.\n\nMaster Legal Work, Advocate Gagandeep Goel\nTelephone / WhatsApp: +91 9872206969";
    var base = location.pathname.replace(/consultation\/.*$/, "");
    $("cs-next").value = location.origin + base + "consultation/thanks.html";
    try { sessionStorage.setItem("mlw_cs_summary", summary()); sessionStorage.setItem("mlw_cs_ref", REF); sessionStorage.setItem("mlw_cs_name", name); } catch (e) {}
    $("cs-submit").disabled = true; $("cs-submit").textContent = "Sending\u2026";
    if (!CONFIG.appsScriptUrl) return; // native multipart POST to FormSubmit
    ev.preventDefault();
    var data = {}; Array.prototype.forEach.call(f.elements, function (el) { if (!el.name || el.type === "file" || el.name.charAt(0) === "_" && el.name !== "_honey") return; if ((el.type === "radio" || el.type === "checkbox") && !el.checked) return; data[el.name] = el.value; });
    data["Booking reference"] = REF; data["Documents held"] = docs().join(", ");
    data["Fee (INR)"] = fee(); data._autoresponse = $("cs-autoresponse").value; data._subject = $("cs-subject").value;
    var send = function (b64) {
      if (b64) { data._file = b64; data._fileName = file.name; data._fileType = file.type; }
      fetch(CONFIG.appsScriptUrl, { method: "POST", body: JSON.stringify(data) })
        .then(function (r) { return r.json(); })
        .then(function (j) { if (j && j.ok) location.href = $("cs-next").value; else throw new Error(j && j.error || "error"); })
        .catch(function () { $("cs-submit").disabled = false; $("cs-submit").textContent = "Send booking request"; err("Sorry, the request could not be sent. Please use the WhatsApp button below, or try again."); });
    };
    if (file) { var rd = new FileReader(); rd.onload = function () { send(String(rd.result).split(",")[1]); }; rd.readAsDataURL(file); } else send(null);
  });
})();
