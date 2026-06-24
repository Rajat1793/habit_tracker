# Streaks push helper

Minimal Node script for sending push notifications to your Streaks dev build
using `expo-server-sdk`. Push sending is deliberately kept **outside the app**
— sending is a server responsibility.

## Setup

```bash
cd server
npm install
```

## Send a single push

```bash
TOKEN='ExponentPushToken[xxxxxxxx]' HABIT_ID='abc-123' npm run send
```

Optional overrides: `TITLE`, `BODY`.

Ticket IDs are written to `tickets.json` so receipts can be checked later.

## Check receipts

```bash
npm run receipts
```

Wait ~5–15 minutes after sending so Expo's queue has handed the message off
to APNs / FCM. The script flags `DeviceNotRegistered` — in a real backend that
signal means the token must be dropped from your database.

## Payload contract

Sent payloads mirror the local-notification shape so the in-app tap handler
treats both identically:

```json
{
  "to": "ExponentPushToken[…]",
  "title": "🔥 Streak nudge",
  "body": "Tap to log your habit.",
  "channelId": "habit-reminders",
  "data": { "screen": "/habit", "habitId": "abc-123" }
}
```
