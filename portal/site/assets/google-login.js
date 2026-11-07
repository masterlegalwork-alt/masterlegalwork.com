// "Continue with Google": Wix runs the Google flow (redirect session with idp), PKCE in the browser.
import { wixRequest } from "/js/wix/client.js";
import { WIX_CLIENT_ID } from "/js/wix/config.js";

var GOOGLE_IDP = "0e6a50f5-b523-4e29-990d-f37fa2ffdd69";
export var CALLBACK = location.origin + "/auth-callback.html";

function b64url(bytes) {
  var s = "";
  bytes.forEach(function (b) { s += String.fromCharCode(b); });
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function randomString(n) {
  var a = new Uint8Array(n || 32);
  crypto.getRandomValues(a);
  return b64url(a);
}

export async function startGoogleLogin(returnTo) {
  var verifier = randomString(48);
  var digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
  var challenge = b64url(new Uint8Array(digest));
  var state = randomString(16);
  sessionStorage.setItem("mlw_oauth", JSON.stringify({ verifier: verifier, state: state, returnTo: returnTo || "/matters.html" }));
  var res = await wixRequest("/_api/redirects-api/v1/redirect-session", {
    body: {
      auth: {
        authRequest: {
          redirectUri: CALLBACK,
          clientId: WIX_CLIENT_ID,
          codeChallenge: challenge,
          codeChallengeMethod: "S256",
          responseMode: "fragment",
          responseType: "code",
          scope: "offline_access",
          state: state,
          idp: GOOGLE_IDP
        }
      }
    }
  });
  var url = res && res.redirectSession && res.redirectSession.fullUrl;
  if (!url) throw new Error("Google sign-in could not start. Please try again.");
  location.assign(url);
}
