// Finishes "Continue with Google": checks state, swaps the code for member tokens, then returns.
import { mintTokens, setTokens } from "/js/wix/client.js";
import { CALLBACK } from "/assets/google-login.js";

var msg = document.getElementById("msg");
function fail(text) {
  msg.innerHTML = '<p class="err">' + text + '</p><p><a class="btn" href="/login.html">Back to Client Login</a></p>';
}

(async function () {
  var p = new URLSearchParams(location.hash.slice(1) || location.search.slice(1));
  var saved = null;
  try { saved = JSON.parse(sessionStorage.getItem("mlw_oauth") || "null"); } catch (e) {}
  sessionStorage.removeItem("mlw_oauth");
  if (p.get("error")) {
    var e = p.get("error_description") || p.get("error");
    if (/approv|pending/i.test(e)) return fail("Your login is awaiting approval by our office. You will be able to log in once it is approved.");
    return fail("Google sign-in did not complete (" + e.replace(/[<>&"]/g, "") + ").");
  }
  var code = p.get("code");
  if (!code || !saved || p.get("state") !== saved.state) return fail("Google sign-in could not be confirmed. Please try again.");
  try {
    setTokens(await mintTokens({ grantType: "authorization_code", code: code, codeVerifier: saved.verifier, redirectUri: CALLBACK }, "member"));
    var r = saved.returnTo || "/matters.html";
    location.replace(r.charAt(0) === "/" && r.charAt(1) !== "/" ? r : "/matters.html");
  } catch (err) {
    fail("Google sign-in could not be completed. Please try again.");
  }
})();
