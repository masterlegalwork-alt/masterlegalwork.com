# Telegram setup

Keep both integrations disabled until verified against synthetic data.

1. Complete DEPLOY.md, including a working MFA sign-in flow that issues AAL2 access tokens. Apply telegram.sql once after schema.sql.
2. Create a dedicated bot with BotFather and disable group joining. Use Supabase Edge Function secrets for TELEGRAM_BOT_TOKEN and an independent random URL-safe TELEGRAM_WEBHOOK_SECRET of at least 32 characters.
3. Deploy using supabase functions deploy telegram-webhook --no-verify-jwt --project-ref PROJECT_REF. Register the HTTPS endpoint through Telegram setWebhook with the same secret_token and allowed_updates set to ["message"]. Read tokens through a trusted operator environment. Exclude secrets, request and reply bodies, and RPC parameters from logs.
4. Check repeated update IDs, wrong secrets, ignored group messages and attachments, expired and reused codes, unauthorized matters, AAL1 denial, assignment revocation, and unlink. Enable telegramEnabled in the portal config after verification. Share the verified bot username with intended users.
5. Schedule deletion of expired mlw_telegram.codes rows and mlw_telegram.updates rows older than seven days. To shut down, disable the portal flag, delete the webhook and remove its secrets.

The bot issues a five-minute pairing code for /start in a direct chat. The user selects a matter in the portal and submits the code there. If the reply is lost after the database commits, send /start again. Keep all case content in the portal. Telegram processes whatever a user sends to the bot even when the webhook discards it.

## Personal authorization

Use a private interactive terminal with Telethon 1.x, boto3 and qrcode installed. Create a dedicated AWS Secrets Manager secret with initial string revoked. Restrict GetSecretValue and PutSecretValue to that secret. Set AWS credentials and region through the SDK credential chain and supply TELEGRAM_API_ID, TELEGRAM_API_HASH and MLW_TELEGRAM_SESSION_SECRET_ID through the operator environment. Run one command at a time.

Run python tools/telegram/personal.py authorize and scan the QR from Telegram Devices. Enter the two-step password at the hidden prompt if requested. Keep QR output out of recordings. Run python tools/telegram/personal.py revoke to log out and replace the current secret. After an interrupted operation, check Telegram Devices and terminate unwanted sessions before resetting the secret.

The personal session has account privileges and stays outside the website. Import of personal messages or files requires a future item-level consent flow, case authorization and private scanning and storage. Client document submission and case notifications through Telegram are outside this release.

