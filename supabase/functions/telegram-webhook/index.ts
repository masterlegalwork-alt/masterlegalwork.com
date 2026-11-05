import { timingSafeEqual } from "node:crypto";

const secret = Deno.env.get("TELEGRAM_WEBHOOK_SECRET") ?? "";
const token = Deno.env.get("TELEGRAM_BOT_TOKEN") ?? "";
const url = Deno.env.get("SUPABASE_URL") ?? "";
const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const encoder = new TextEncoder();

async function matches(value: string): Promise<boolean> {
  const hash = (input: string) => crypto.subtle.digest("SHA-256", encoder.encode(input));
  const [expected, supplied] = await Promise.all([hash(secret), hash(value)]);
  return timingSafeEqual(new Uint8Array(expected), new Uint8Array(supplied));
}

Deno.serve(async (request) => {
  if (request.method !== "POST") return new Response(null, { status: 405 });
  if (!/^[\w-]{32,256}$/.test(secret) || !token || !url || !key) {
    return new Response(null, { status: 503 });
  }
  if (!await matches(request.headers.get("X-Telegram-Bot-Api-Secret-Token") ?? "")) {
    return new Response(null, { status: 403 });
  }

  try {
    const update = await request.json();
    const message = update?.message;
    if (message?.chat?.type !== "private" || message.from?.is_bot !== false ||
        !Number.isSafeInteger(message.from.id) || message.from.id <= 0 ||
        message.from.id !== message.chat.id || message.text !== "/start" ||
        !Number.isSafeInteger(update.update_id) || update.update_id < 0) {
      return new Response(null, { status: 204 });
    }

    const result = await fetch(url + "/rest/v1/rpc/mlw_telegram_start", {
      method: "POST",
      headers: {
        apikey: key,
        Authorization: "Bearer " + key,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ update_number: update.update_id, sender: message.from.id }),
      signal: AbortSignal.timeout(5000),
    });
    if (!result.ok) return new Response(null, { status: 503 });
    const code = await result.json();
    if (!code) return new Response(null, { status: 204 });

    // Telegram executes this reply directly. A retried update cannot issue it again.
    return Response.json({
      method: "sendMessage",
      chat_id: message.from.id,
      text: "Paste this code into the matter you choose in the signed-in Master Legal Work portal. It expires in five minutes. Keep it private. Use the portal for confidential information and files.\n\n" + code,
      protect_content: true,
    });
  } catch {
    return new Response(null, { status: 503 });
  }
});

