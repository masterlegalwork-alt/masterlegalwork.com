/* Master Legal Work — guided chat assistant (no backend, no paid services).
   Collects 5 short answers and hands over to WhatsApp. Gives only factual info; never legal advice or fees. */
(function () {
  "use strict";
  var WA = "919872206969";
  var FACT = {
    hours: "Please call or WhatsApp +91 98722 06969 to arrange a time to meet.",
    offices: "<strong>Chamber:</strong> Advocate&#39;s Chamber No. 422, District and Sessions Court, Sector 43, Chandigarh.",
    contact: "Mobile: <a href=\"tel:+919872206969\">+91 98722 06969</a> \u00b7 WhatsApp: <a href=\"https://wa.me/919872206969\" target=\"_blank\" rel=\"noopener\">wa.me/919872206969</a> \u00b7 Email: <a href=\"mailto:masterlegalwork@gmail.com\">masterlegalwork@gmail.com</a>",
    payment: "Please make a payment only for a consultation confirmed by the chambers on WhatsApp/email, for the amount stated in that confirmation. Payment details are sent with the confirmation. For any question, please contact us: Mobile/WhatsApp <a href=\"tel:+919872206969\">+91 98722 06969</a> \u00b7 <a href=\"https://wa.me/919872206969\" target=\"_blank\" rel=\"noopener\">WhatsApp</a> \u00b7 Email <a href=\"mailto:masterlegalwork@gmail.com\">masterlegalwork@gmail.com</a>.",
    drafts: "Free model formats (petitions and applications, for general reference only) are on our <a href=\"/drafts.html\">Model Drafts page</a>.",
    fees: "Consultations are by appointment. The fee is shown in the <a href=\"/consultation/\">booking form</a>, as part of the booking terms. To ask anything first, please contact us: Mobile/WhatsApp <a href=\"tel:+919872206969\">+91 98722 06969</a> \u00b7 <a href=\"https://wa.me/919872206969\" target=\"_blank\" rel=\"noopener\">WhatsApp</a> \u00b7 Email <a href=\"mailto:masterlegalwork@gmail.com\">masterlegalwork@gmail.com</a>.",
    noadvice: "I'm an automated assistant and can't give legal advice. Advocate Gagandeep Goel will respond personally on WhatsApp."
  };
  var FAQ = [
    { re: /\b(consult|consultation|appointment|book|booking|fee|fees|charge|charges|cost|price|rate|kitni|kitna|paisa|kharcha)\b/i, a: "fees" },
    { re: /\b(pay|payment|payments|upi|gpay|google pay|paytm|bank|account|ifsc|transfer|neft|imps|qr)\b/i, a: "payment" },
    { re: /\b(address|addresses|location|located|where|office|offices|directions|map|kahan|chamber)\b/i, a: "offices" },
    { re: /\b(timing|timings|hours|time|open|opening|close|closed|sunday|saturday)\b/i, a: "hours" },
    { re: /\b(draft|drafts|format|formats|template|templates|sample|model)\b/i, a: "drafts" },
    { re: /\b(phone|call|number|mobile|contact|whatsapp|email|mail)\b/i, a: "contact" }
  ];
  var STEPS = [
    { key: "name", label: "Name", q: "May I have your name?" },
    { key: "matter", label: "Matter", q: "What type of matter is it?",
      chips: ["Criminal", "Civil", "Family / Matrimonial", "Cheque Bounce", "Consumer", "Property", "Other"] },
    { key: "court", label: "Court / City", q: "Which court or city is it in?",
      chips: ["Chandigarh", "Mohali", "Panchkula", "High Court", "Other"] },
    { key: "hearing", label: "Next hearing", q: "Is there a next hearing date? Type the date (e.g. 15-10-2026) or tap an option.",
      chips: ["No", "Not sure"] },
    { key: "issue", label: "Issue", q: "Briefly describe your issue in a line or two. Please do not include confidential details." }
  ];

  var state = { step: 0, data: {}, done: false, started: false };
  var panel, log, input, form, launch;

  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function scroll() { log.scrollTop = log.scrollHeight; }
  function bot(html, cls) { var m = el("div", "msg bot" + (cls ? " " + cls : ""), html); log.appendChild(m); scroll(); return m; }
  function user(text) { var m = el("div", "msg user"); m.textContent = text; log.appendChild(m); scroll(); }
  function chips(list) {
    clearChips();
    if (!list) return;
    var c = el("div", "chips"); c.setAttribute("data-chips", "1");
    list.forEach(function (t) {
      var b = el("button"); b.type = "button"; b.textContent = t;
      b.addEventListener("click", function () { handle(t); });
      c.appendChild(b);
    });
    log.appendChild(c); scroll();
  }
  function clearChips() { Array.prototype.forEach.call(log.querySelectorAll("[data-chips]"), function (n) { n.remove(); }); }
  function ask() { var s = STEPS[state.step]; bot(s.q); chips(s.chips); input.focus(); }

  function faqFor(text) {
    var words = text.trim().split(/\s+/).length;
    var isQ = /\?\s*$/.test(text);
    if (state.step === 4 && !state.done && words > 6 && !isQ) return null; // free description
    if (words > 10 && !isQ) return null;
    for (var i = 0; i < FAQ.length; i++) if (FAQ[i].re.test(text)) return FAQ[i].a;
    return null;
  }

  function afterAnswer(key, val) {
    if (key === "name") bot("Thank you, " + escapeHtml(val.split(" ")[0]) + ".");
    if (key === "matter") bot("Noted. " + FACT.drafts);
    if (key === "court") {
      var v = val.toLowerCase();
      bot("Our chamber: Advocate&#39;s Chamber No. 422, District and Sessions Court, Sector 43, Chandigarh.");
    }
    if (key === "hearing") bot("Thank you. Please do not share confidential documents here; the Advocate will tell you what is needed.");
  }

  function summary() {
    var d = state.data;
    var lines = STEPS.map(function (s) { return s.label + ": " + (d[s.key] || "-"); });
    var box = bot("", "summary");
    var h = el("strong"); h.textContent = "Summary"; box.appendChild(h);
    lines.forEach(function (l) { var p = el("div"); p.textContent = l; box.appendChild(p); });
    var text = "Hello Advocate Gagandeep Goel, I would like to consult Master Legal Work.\n" + lines.join("\n") + "\n(Sent from the masterlegalwork.com chat)";
    var a = el("a", "btn btn-wa chat-wa");
    a.href = "https://wa.me/" + WA + "?text=" + encodeURIComponent(text);
    a.target = "_blank"; a.rel = "noopener";
    a.innerHTML = '<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.25-.12-1.47-.72-1.7-.8-.23-.09-.4-.13-.56.12-.17.25-.64.8-.79.97-.14.16-.29.18-.54.06a6.7 6.7 0 0 1-3.32-2.9c-.25-.43.25-.4.72-1.33.08-.17.04-.31-.02-.43l-.76-1.82c-.2-.48-.4-.41-.56-.42h-.47a.9.9 0 0 0-.66.31 2.77 2.77 0 0 0-.86 2.06 4.8 4.8 0 0 0 1 2.55 11 11 0 0 0 4.2 3.7c1.56.68 2.17.73 2.95.62.48-.07 1.47-.6 1.67-1.18.21-.58.21-1.08.15-1.18-.06-.1-.23-.17-.48-.29z"/></svg>Continue on WhatsApp with Advocate Gagandeep Goel';
    log.appendChild(a);
    bot("Advocate Gagandeep Goel will take it forward personally on WhatsApp. You can also call <a href=\"tel:+919872206969\">+91 98722 06969</a> or email <a href=\"mailto:masterlegalwork@gmail.com\">masterlegalwork@gmail.com</a>. To book, use the <a href=\"/consultation/\">booking form</a>, which shows the fee.");
    scroll();
  }

  function handle(raw) {
    var text = (raw || "").trim();
    if (!text) return;
    if (state.awaitStart) { state.awaitStart = false; clearChips(); ask(); return; }
    user(text);
    clearChips();
    var f = faqFor(text);
    if (f) {
      bot(FACT[f]);
      if (!state.done) { bot("Coming back to your details \u2014 " + STEPS[state.step].q.charAt(0).toLowerCase() + STEPS[state.step].q.slice(1)); chips(STEPS[state.step].chips); }
      return;
    }
    if (state.done) { bot(FACT.noadvice + " Please tap the WhatsApp button above to continue."); return; }
    var s = STEPS[state.step];
    if (s.key === "name" && text.length > 60) text = text.slice(0, 60);
    state.data[s.key] = text.slice(0, 600);
    afterAnswer(s.key, text);
    state.step++;
    if (state.step < STEPS.length) ask();
    else { state.done = true; summary(); }
  }

  function escapeHtml(s) { return s.replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }

  function start() {
    log.innerHTML = ""; state = { step: 0, data: {}, done: false, started: true };
    var nt = el("p", "chat-note"); nt.innerHTML = "This chat collects up to five short details and passes them to Advocate Gagandeep Goel on WhatsApp. It gives factual information only, not legal advice, and does not by itself create an advocate\u2013client relationship."; log.appendChild(nt); state.awaitStart = true; chips(["Start"]); return;
    ask();
  }
  function open() {
    panel.hidden = false; document.body.classList.add("chat-open");
    launch.setAttribute("aria-expanded", "true");
    if (!state.started) start();
    setTimeout(function () { input.focus(); }, 60);
  }
  function close() {
    panel.hidden = true; document.body.classList.remove("chat-open");
    launch.setAttribute("aria-expanded", "false"); launch.focus();
  }

  function build() {
    launch = el("button", "chat-launch", '<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M4 3h16a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H8l-4.5 3.5A.5.5 0 0 1 3 21V5a2 2 0 0 1 1-2zm3 6v2h2V9H7zm4 0v2h2V9h-2zm4 0v2h2V9h-2z"/></svg><span class="cl-text">Chat</span>');
    launch.type = "button"; launch.setAttribute("aria-label", "Chat with Master Legal Work"); launch.setAttribute("aria-expanded", "false"); launch.setAttribute("aria-controls", "mlw-chat");
    panel = el("section", "chat-panel"); panel.id = "mlw-chat"; panel.hidden = true;
    panel.setAttribute("role", "dialog"); panel.setAttribute("aria-label", "Chat with Master Legal Work");
    panel.innerHTML =
      '<div class="chat-hd"><span class="av" aria-hidden="true">GG</span><div class="t"><strong>Chat with Master Legal Work</strong><span>Replies continue on WhatsApp</span></div>' +
      '<button type="button" class="restart" aria-label="Restart chat">Restart</button><button type="button" class="x" aria-label="Close chat">&times;</button></div>' +
      '<p class="chat-note">Automated assistant. Your conversation continues with Advocate Gagandeep Goel on WhatsApp.</p>' +
      '<div class="chat-log" aria-live="polite"></div>' +
      '<form class="chat-in"><label class="sr-only" for="mlw-chat-in">Type your answer</label><input id="mlw-chat-in" type="text" autocomplete="off" placeholder="Type here\u2026" maxlength="600"><button type="submit">Send</button></form>';
    document.body.appendChild(launch); document.body.appendChild(panel);
    log = panel.querySelector(".chat-log"); input = panel.querySelector("input"); form = panel.querySelector("form");
    launch.addEventListener("click", open);
    panel.querySelector(".x").addEventListener("click", close);
    panel.querySelector(".restart").addEventListener("click", start);
    form.addEventListener("submit", function (e) { e.preventDefault(); var v = input.value; input.value = ""; handle(v); });
    panel.addEventListener("keydown", function (e) { if (e.key === "Escape") close(); });
    window.MLWChat = { open: open, send: handle };
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", build); else build();
})();
