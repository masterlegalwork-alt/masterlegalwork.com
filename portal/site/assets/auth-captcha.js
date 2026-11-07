// Sign-up / login / verify that carry Wix's reCAPTCHA token (the stock module drops it).
import { WixApiError, setTokens, wixRequest } from "/js/wix/client.js";
import { NO_SESSION_ERROR, authOutcome, failure, loginErrorCode, registerErrorCode, toLoginResult } from "/js/wix/auth-core.js";
import { memberTokensForSession } from "/js/wix/auth.js";
import { refreshMember } from "/js/wix/member-store.js";

var pendingStateToken = null;

function message(e) { return e instanceof Error ? e.message : String(e); }
function captcha(token) { return token ? { captcha_tokens: [{ Recaptcha: token }] } : {}; }

async function finish(raw) {
  var outcome = authOutcome(raw);
  if (outcome.state === "SUCCESS") {
    pendingStateToken = null;
    if (!outcome.sessionToken) return failure(NO_SESSION_ERROR);
    setTokens(await memberTokensForSession(outcome.sessionToken));
    await refreshMember();
    return { state: "SUCCESS" };
  }
  if (outcome.stateToken) pendingStateToken = outcome.stateToken;
  return toLoginResult(outcome);
}

export async function loginWithCaptcha(email, password, token) {
  var raw;
  try {
    raw = await wixRequest("/_api/iam/authentication/v2/login", { body: Object.assign({ loginId: { email: email }, password: password }, captcha(token)) });
  } catch (e) {
    return failure(message(e), e instanceof WixApiError ? loginErrorCode(e.code) : undefined);
  }
  return finish(raw);
}

export async function registerWithCaptcha(email, password, profile, token) {
  var raw;
  try {
    raw = await wixRequest("/_api/iam/authentication/v2/register", { body: Object.assign({ loginId: { email: email }, password: password }, profile ? { profile: profile } : {}, captcha(token)) });
  } catch (e) {
    return failure(message(e), e instanceof WixApiError ? registerErrorCode(e.code, e.details) : undefined);
  }
  return finish(raw);
}

export async function verifyCode(code) {
  if (!pendingStateToken) return failure("Please sign up or log in again, then enter the new code.");
  var raw;
  try {
    raw = await wixRequest("/_api/iam/verification/v1/auth/verify", { body: { code: code, stateToken: pendingStateToken } });
  } catch (e) {
    return failure(message(e), e instanceof WixApiError ? loginErrorCode(e.code) : undefined);
  }
  return finish(raw);
}
