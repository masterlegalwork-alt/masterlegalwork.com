(function () {
  "use strict";

  /* Mobile nav */
  var toggle = document.querySelector(".nav-toggle");
  var menu = document.getElementById("nav-menu");
  if (toggle && menu) {
    toggle.addEventListener("click", function () {
      var open = menu.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    });
    menu.addEventListener("click", function (e) {
      if (e.target.tagName === "A") {
        menu.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  /* Active link highlight */
  var links = Array.prototype.slice.call(document.querySelectorAll('.nav-menu a[href^="#"]'));
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          links.forEach(function (l) {
            l.classList.toggle("active", l.getAttribute("href") === "#" + en.target.id);
          });
        }
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    document.querySelectorAll("main section[id]").forEach(function (s) { io.observe(s); });
  }

  /* Disclaimer modal (first visit) */
  var KEY = "mlw_disclaimer_agreed";
  var modal = document.getElementById("disclaimer");
  var agree = document.getElementById("disc-agree");
  var stored = null;
  try { stored = localStorage.getItem(KEY); } catch (e) {}
  if (modal && !stored) {
    modal.hidden = false;
    document.body.classList.add("modal-open");
    setTimeout(function () { agree && agree.focus(); }, 50);
    modal.addEventListener("keydown", function (e) {
      if (e.key === "Tab") { e.preventDefault(); agree.focus(); }
    });
  }
  if (agree) {
    agree.addEventListener("click", function () {
      try { localStorage.setItem(KEY, "1"); } catch (e) {}
      modal.hidden = true;
      document.body.classList.remove("modal-open");
    });
  }

  /* Gallery lightbox */
  var lb = document.getElementById("lightbox");
  if (lb) {
    var lbImg = lb.querySelector("img");
    var lastFocus = null;
    var close = function () {
      lb.hidden = true;
      document.body.classList.remove("modal-open");
      if (lastFocus) lastFocus.focus();
    };
    document.querySelectorAll(".g-item").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var img = btn.querySelector("img");
        lastFocus = btn;
        lbImg.src = btn.getAttribute("data-full");
        lbImg.alt = img ? img.alt : "";
        lb.hidden = false;
        document.body.classList.add("modal-open");
        lb.querySelector(".lb-close").focus();
      });
    });
    lb.addEventListener("click", function (e) { if (e.target === lb || e.target.classList.contains("lb-close")) close(); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !lb.hidden) close(); });
  }

  /* Contact form -> mailto */
  var form = document.getElementById("contact-form");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var v = function (id) { return (document.getElementById(id).value || "").trim(); };
      var name = v("f-name"), phone = v("f-phone"), email = v("f-email"), topic = v("f-topic"), msg = v("f-msg");
      var err = document.getElementById("form-error");
      if (!name || !msg) { err.hidden = false; return; }
      err.hidden = true;
      var subject = "Website enquiry: " + topic + " - " + name;
      var body = "Name: " + name + "\nPhone: " + (phone || "-") + "\nEmail: " + (email || "-") +
                 "\nMatter type: " + topic + "\n\nMessage:\n" + msg + "\n";
      window.location.href = "mailto:masterlegalwork@gmail.com?subject=" +
        encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
    });
  }

  var y = document.getElementById("year");
  if (y) y.textContent = new Date().getFullYear();
})();
