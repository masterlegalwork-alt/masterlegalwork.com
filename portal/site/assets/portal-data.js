// Shared helpers for the private matter pages.
import { esc, loginHref } from "/assets/common.js";

export function loginPrompt() {
  return '<div class="card panel"><p>Please log in to view your matters.</p>'
    + '<div class="form-actions"><a class="btn" href="' + loginHref() + '">Client Login</a>'
    + '<a href="/login.html?mode=signup&returnTo=' + encodeURIComponent(location.pathname + location.search) + '">Create login</a></div></div>';
}

// Days from today (local) to a YYYY-MM-DD / ISO date; null when absent.
export function daysUntil(iso) {
  if (!iso) return null;
  var d = new Date(String(iso).slice(0, 10) + "T00:00:00");
  if (isNaN(d)) return null;
  var t = new Date();
  t.setHours(0, 0, 0, 0);
  return Math.round((d - t) / 86400000);
}

export function niceDate(iso) {
  if (!iso) return "";
  var d = new Date(String(iso).slice(0, 10) + "T00:00:00");
  if (isNaN(d)) return esc(iso);
  return d.toLocaleDateString("en-IN", { weekday: "short", day: "2-digit", month: "short", year: "numeric" });
}

export function statusPill(status) {
  if (!status) return "";
  var s = String(status).toLowerCase();
  var cls = /dispos|closed|decided/.test(s) ? "pill closed" : /active|pending|listed/.test(s) ? "pill ok" : "pill";
  return '<span class="' + cls + '">' + esc(status) + "</span>";
}

export function hearingLine(iso) {
  var n = daysUntil(iso);
  if (n == null) return '<div class="hearing">Next hearing: <strong>to be notified</strong></div>';
  if (n < 0) return '<div class="hearing">Last listed: <strong>' + niceDate(iso) + "</strong> &middot; next date awaited</div>";
  var when = n === 0 ? " (today)" : n === 1 ? " (tomorrow)" : " (in " + n + " days)";
  return '<div class="hearing' + (n <= 7 ? " soon" : "") + '">Next hearing: <strong>' + niceDate(iso) + "</strong>" + when + "</div>";
}

// CMS document fields come as wix:document://v1/ugd/<file>/<name>; make them downloadable.
export function docUrl(v) {
  if (!v) return "";
  var s = String(v);
  if (/^https?:\/\//.test(s)) return s;
  var m = s.match(/^wix:document:\/\/v1\/(ugd\/[^/]+)\/?(.*)$/);
  if (m) return "https://docs.wixstatic.com/" + m[1] + (m[2] ? "?dn=" + encodeURIComponent(decodeURIComponent(m[2])) : "");
  return "";
}
