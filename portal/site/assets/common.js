import { subscribeMember, getMemberState, logout } from "/js/wix/member-store.js";

export function esc(v) {
  return String(v == null ? "" : v)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function loginHref() {
  return "/login.html?returnTo=" + encodeURIComponent(location.pathname + location.search);
}

function renderSession(el, s) {
  if (s.loading) {
    el.innerHTML = '<span aria-hidden="true"></span>';
    return;
  }
  if (!s.loggedIn) {
    el.innerHTML = '<a class="login-link" href="' + loginHref() + '">Client Login</a>';
    return;
  }
  var m = s.member || {};
  var name = m.firstName || m.displayName || "My Matters";
  el.innerHTML = '<a class="who" href="/matters.html">' + esc(name) + "</a>"
    + '<button type="button" data-logout>Log out</button>';
}

export function initHeader() {
  var el = document.getElementById("session");
  if (!el) return;
  subscribeMember(function (s) { renderSession(el, s); });
  renderSession(el, getMemberState());
  el.addEventListener("click", function (e) {
    if (e.target.closest("[data-logout]")) logout("/index.html").catch(function () {});
  });
}

initHeader();
