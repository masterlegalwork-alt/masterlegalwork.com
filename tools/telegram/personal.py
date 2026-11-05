"""Owner-run QR authorization. No dialogs, messages, or media are requested."""
import argparse
import asyncio
import getpass
import os
import sys

import boto3
import qrcode
from telethon import TelegramClient, errors
from telethon.sessions import StringSession


async def authorize(vault, secret_id, api_id, api_hash, revoke):
    saved = vault.get_secret_value(SecretId=secret_id)["SecretString"]
    if revoke:
        if saved == "revoked":
            return
    elif saved != "revoked":
        raise RuntimeError("Revoke the existing Telegram session first")
    else:
        saved = ""
    client = TelegramClient(StringSession(saved), api_id, api_hash, receive_updates=False)
    await client.connect()
    try:
        if revoke:
            if not await client.log_out():
                raise RuntimeError("Telegram logout was unsuccessful")
            vault.put_secret_value(SecretId=secret_id, SecretString="revoked")
            print("Telegram authorization revoked.")
            return

        qr = await client.qr_login()
        graphic = qrcode.QRCode(border=2)
        graphic.add_data(qr.url)
        graphic.print_ascii(invert=True)
        print("Scan with Telegram → Settings → Devices → Link Desktop Device.")
        try:
            await qr.wait()
        except errors.SessionPasswordNeededError:
            await client.sign_in(password=getpass.getpass("Telegram two-step password: "))
        try:
            vault.put_secret_value(SecretId=secret_id, SecretString=client.session.save())
        except Exception:
            await client.log_out()
            raise
        print("Personal Telegram authorization stored in the configured secret manager.")
    finally:
        await client.disconnect()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("action", choices=["authorize", "revoke"])
    args = parser.parse_args()
    try:
        if not sys.stdin.isatty() or not sys.stdout.isatty():
            raise RuntimeError("A private interactive terminal is required")
        asyncio.run(authorize(
            boto3.client("secretsmanager"),
            os.environ["MLW_TELEGRAM_SESSION_SECRET_ID"],
            int(os.environ["TELEGRAM_API_ID"]),
            os.environ["TELEGRAM_API_HASH"],
            args.action == "revoke",
        ))
    except Exception:
        sys.exit("Telegram operation failed. Check credentials, secret permissions and Telegram Devices.")


if __name__ == "__main__":
    main()

