# Verification Checklist

Items in the rubric that require a physical device or external service. Run each
test, take a screenshot, and tick the box. Screenshots live in `docs/screenshots/`.

> All code paths exist; this doc just records the manual evidence.

---

## 1. Foreground notification handler — §16

**Why it matters:** iOS defaults to silent in foreground; without a handler the
banner never appears while the user has the app open.

1. Open the app on a real device (Expo Go on SDK 53+ does **not** support
   remote push, but local reminders work for this test).
2. Go to **Settings → Test foreground + deep link → Send test reminder in 3s**.
3. **Stay on the screen.**
4. Within 3 seconds you should see:
   - iOS: a banner slide down from the top.
   - Android: a heads-up notification with sound + vibration.
5. Tap the banner. App should remain open and the router should push
   `/habit/<id>` (or stay on `/` if no habits exist).

- [ ] iOS foreground banner shows → `docs/screenshots/16-ios-foreground.png`
- [ ] Android heads-up shows → `docs/screenshots/16-android-foreground.png`

**Code reference:** [src/lib/notifications/setup.ts](../src/lib/notifications/setup.ts) `installForegroundHandler()` is invoked at module load in [src/app/_layout.tsx](../src/app/_layout.tsx) — before React mounts.

---

## 2. Android high-importance channel — §17

**Why it matters:** Android 8+ requires a channel before any notification fires.
Android 13+ permission dialog also inspects the channel's importance to decide
whether to even ask.

1. Install on an Android 13+ device (`eas build --profile development --platform android`).
2. **Before** granting permission, open the app's system notification settings.
3. You should see **Habit reminders** as a channel with importance **High**
   (heads-up) and vibration pattern enabled.
4. Grant permission and trigger a test reminder.
5. The notification should heads-up over the lock screen (importance HIGH +
   `lockscreenVisibility: PUBLIC`).

- [ ] Channel appears in system settings → `docs/screenshots/17-channel-list.png`
- [ ] Channel detail page shows High importance → `docs/screenshots/17-channel-detail.png`
- [ ] Heads-up notification appears → `docs/screenshots/17-heads-up.png`

**Code reference:** [src/lib/notifications/setup.ts](../src/lib/notifications/setup.ts) `ensureAndroidChannel()` — called from the root `useEffect` in `_layout.tsx` so the channel exists before the very first permission prompt.

---

## 3. EAS dev-client build + push test — §18

**Why it matters:** Push tokens (`ExponentPushToken[...]`) only resolve in a
custom dev client or standalone build. Expo Go on SDK 53+ rejects them.

### Build the dev client

```bash
# one-time
npm i -g eas-cli
eas login

# fill in app.json → extra.eas.projectId first, then:
eas build --profile development --platform ios
# or
eas build --profile development --platform android
```

Install the resulting build on your device. Run `npx expo start --dev-client`
and scan the QR.

### Capture the push token

1. Open the app → **Settings**.
2. Tap **Enable notifications** (grant), then **Register for push**.
3. Token should appear in the format `ExponentPushToken[xxxxxxxx]`.
4. Tap **Copy token**.

- [ ] Token captured → `docs/screenshots/18-token.png`

### Send a push from expo.dev/notifications

1. Visit <https://expo.dev/notifications>.
2. Paste the token.
3. Title: `Time for Read 20 min`, body: `Tap to log it.`
4. **Additional data (JSON):**
   ```json
   { "screen": "/habit", "habitId": "<paste a real id from the habit detail screen>" }
   ```
5. **Android channel ID:** `habit-reminders`
6. Click **Send a notification**.

- [ ] Receipt shows status `ok` → `docs/screenshots/18-receipt-ok.png`
- [ ] Tap on a locked phone deep-links to `/habit/<id>` → `docs/screenshots/18-deeplink.png`

### Or use the Node helper

```bash
cd server
npm install
TOKEN='ExponentPushToken[xxxxxxxx]' HABIT_ID='<id>' npm run send
sleep 30
npm run receipts
```

The receipts script flags `DeviceNotRegistered` (the only error code your
server is obligated to act on by removing the token from its DB).

- [ ] `npm run send` prints `tickets.json saved` → `docs/screenshots/18-send-ticket.png`
- [ ] `npm run receipts` prints `ok` → `docs/screenshots/18-receipts-ok.png`

---

## 4. Stretch goals self-check — §20

These are coded; verify on device.

| Feature | How to verify |
|---|---|
| Snooze action button | Long-press / expand a reminder. Tap **Snooze 10m** without opening the app. A new reminder should arrive ~10 minutes later. |
| Done action button | Same expanded reminder. Tap **✓ Done**. Open the app; the habit should already be marked done today, streak incremented. |
| Badge count | Have 2 habits due today, mark 1 done. The app icon badge should show **1**. Mark the second one. Badge clears. |
| Quiet hours | Set quiet hours `22 → 7`. Create a habit at hour `23`. Trigger the test (or wait). Notification arrives with **no sound** and **lower priority** (Android: no heads-up). |

- [ ] Snooze action works → `docs/screenshots/20-snooze.png`
- [ ] Done action works → `docs/screenshots/20-done.png`
- [ ] Badge count works → `docs/screenshots/20-badge.png`
- [ ] Quiet hours suppress sound → `docs/screenshots/20-quiet.png`

---

## 5. Repository publication — §23

- [ ] `git push origin main` to a public GitHub repo
- [ ] Repo URL recorded in submission form
- [ ] Demo video link recorded in submission form (see `DEMO.md`)
- [ ] APK / IPA link (EAS build artifact URL) recorded in submission form

