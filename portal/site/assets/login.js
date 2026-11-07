import { subscribeMember, getMemberState } from "/js/wix/member-store.js";
import { loginWithCaptcha, registerWithCaptcha, verifyCode } from "/assets/auth-captcha.js";
import { startGoogleLogin } from "/assets/google-login.js";

// Wix's visible reCAPTCHA site key (from Wix Headless docs), with Google's enterprise script.
var SITE_KEY = "6Ld0J8IcAAAAANyrnxzrRlX1xrrdXsOmsepUYosy";

var loginForm = document.getElementById("loginForm");
var signupForm = document.getElementById("signupForm");
var verifyForm = document.getElementById("verifyForm");
var approvalEl = document.getElementById("approval");
var tabs = document.querySelector(".tabs");

var returnTo = new URLSearchParams(location.search).get("returnTo") || "/matters.html";
var safeReturn = returnTo.charAt(0) === "/" && returnTo.charAt(1) !== "/" ? returnTo : "/matters.html";

// ---- reCAPTCHA ----
var widgets = {};   // name -> widget id
var tokens = {};    // name -> current token
var scriptReady = null;

function loadScript() {
  if (scriptReady) return scriptReady;
  scriptReady = new Promise(function (resolve, reject) {
    window.__mlwCaptchaReady = function () { resolve(); };
    var s = document.createElement("script");
    s.src = "https://www.google.com/recaptcha/enterprise.js?onload=__mlwCaptchaReady&render=explicit";
    s.async = true;
    s.defer = true;
    s.onerror = function () { reject(new Error("The security check could not load. Please check your internet connection and refresh.")); };
    document.head.appendChild(s);
  });
  return scriptReady;
}

function mountCaptcha(name) {
  var el = document.querySelector('[data-captcha="' + name + '"]');
  if (!el) return Promise.resolve();
  el.hidden = false;
  if (widgets[name] != null) return Promise.resolve();
  return loadScript().then(function () {
    widgets[name] = window.grecaptcha.enterprise.render(el, {
      sitekey: SITE_KEY,
      callback: function (t) { tokens[name] = t; },
      "expired-callback": function () { tokens[name] = null; }
    });
  });
}

function resetCaptcha(name) {
  tokens[name] = null;
  if (widgets[name] != null && window.grecaptcha) window.grecaptcha.enterprise.reset(widgets[name]);
}

// ---- forms ----
function showOnly(el) {
  [loginForm, signupForm, verifyForm, approvalEl].forEach(function (x) { x.hidden = x !== el; });
  tabs.hidden = el === verifyForm || el === approvalEl;
  if (el === signupForm) mountCaptcha("signup").catch(function (e) { errorOf(signupForm).textContent = e.message; });
}
function errorOf(form) { return form.querySelector("[data-err]"); }

function show(result, form, captchaName) {
  if (result.state === "SUCCESS") { location.assign(safeReturn); return; }
  if (result.state === "EMAIL_VERIFICATION_REQUIRED") { showOnly(verifyForm); return; }
  if (result.state === "OWNER_APPROVAL_REQUIRED") { showOnly(approvalEl); return; }
  var msg = result.error || "That did not work. Please check the details and try again.";
  var code = result.errorCode;
  if (code === "invalidPassword") msg = "The email or password is incorrect.";
  if (code === "invalidEmail") msg = "No login exists for this email. Please create a login first.";
  if (code === "emailAlreadyExists") msg = "A login already exists for this email. Please log in instead.";
  if (code === "resetPassword") msg = "Please reset your password, or contact our office.";
  if (code === "missingCaptchaToken" || code === "captchaRequired") {
    msg = "Please tick the “I'm not a robot” box, then try again.";
    if (captchaName) mountCaptcha(captchaName).catch(function () {});
  }
  if (code === "invalidCaptchaToken") msg = "The security check expired. Please tick the box again.";
  errorOf(form).textContent = msg;
  if (captchaName) resetCaptcha(captchaName);
}

function submit(form, captchaName, action) {
  errorOf(form).textContent = "";
  if (!form.reportValidity()) return;
  if (captchaName === "signup" && !tokens.signup) {
    errorOf(form).textContent = "Please tick the “I'm not a robot” box.";
    return;
  }
  var button = form.querySelector("button[type=submit]");
  button.disabled = true;
  action(form.elements, captchaName ? tokens[captchaName] : null)
    .then(function (r) { show(r, form, captchaName); })
    .catch(function (e) { show({ state: "FAILURE", error: e && e.message ? e.message : String(e) }, form, captchaName); })
    .then(function () { button.disabled = false; });
}

loginForm.addEventListener("submit", function (e) {
  e.preventDefault();
  submit(loginForm, "login", function (f, t) { return loginWithCaptcha(f.email.value.trim(), f.password.value, t); });
});
signupForm.addEventListener("submit", function (e) {
  e.preventDefault();
  submit(signupForm, "signup", function (f, t) {
    var mobile = f.mobile.value.replace(/[\s\-]/g, "");
    if (mobile.charAt(0) !== "+") mobile = "+91" + mobile.replace(/^0/, "");
    return registerWithCaptcha(f.email.value.trim(), f.password.value, { firstName: f.firstName.value.trim(), lastName: f.lastName.value.trim(), phones: [mobile] }, t);
  });
});

document.getElementById("googleBtn").addEventListener("click", function (e) {
  var b = e.currentTarget;
  b.disabled = true;
  document.getElementById("googleErr").textContent = "";
  startGoogleLogin(safeReturn).catch(function (err) {
    b.disabled = false;
    document.getElementById("googleErr").textContent = (err && err.message) || "Google sign-in could not start. Please try again.";
  });
});
verifyForm.addEventListener("submit", function (e) {
  e.preventDefault();
  submit(verifyForm, null, function (f) { return verifyCode(f.code.value.trim()); });
});

tabs.addEventListener("click", function (e) {
  var b = e.target.closest("button[data-tab]");
  if (!b) return;
  tabs.querySelectorAll("button").forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); });
  showOnly(b.dataset.tab === "login" ? loginForm : signupForm);
});
if (new URLSearchParams(location.search).get("mode") === "signup") tabs.querySelector('[data-tab="signup"]').click();

subscribeMember(function (s) { if (!s.loading && s.loggedIn) location.replace(safeReturn); });
var st = getMemberState();
if (!st.loading && st.loggedIn) location.replace(safeReturn);
