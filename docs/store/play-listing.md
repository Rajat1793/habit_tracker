# Google Play — Streaks submission cheat‑sheet

Everything you need to fill the Play Console forms. Copy/paste the blocks
directly. Package: **`com.rajat.streaks.app`** · Version **0.1.0 (versionCode 2)**.

Privacy policy URL (after you enable GitHub Pages — see bottom):
`https://rajat1793.github.io/habit_tracker/privacy-policy.html`

---

## 1. Store listing → App details

**App name** (max 30)
```
Streaks: Habit Tracker
```

**Short description** (max 80)
```
Build better habits with offline reminders, streaks, and a friendly design.
```

**Full description** (max 4000)
```
Streaks is a simple, private habit tracker that helps you show up every day.

Create daily or weekly habits, get gentle reminders, and watch your streak
grow. No account, no clutter, no ads — just you and your routines.

WHY STREAKS
• Friendly, colorful home screen that shows exactly what’s due today.
• Reminders that actually work — scheduled locally so they fire even offline.
• Streak counts that reward consistency and keep your momentum going.
• A calm, focused design in both light and dark themes.

FEATURES
• Daily and weekly habit schedules with a reminder time you choose.
• One‑tap “done” with satisfying progress and streak tracking.
• Quiet hours — silence reminders during the times you set.
• Light, dark, and system themes.
• Available in English, Hindi, and Spanish.
• Optional push notifications for reminders.
• Local backup you control.

PRIVATE BY DESIGN
Your habits are stored on your device. Streaks doesn’t require an account and
doesn’t sell your data. See our privacy policy for details.

Start small, stay consistent, and build better habits — one streak at a time.
```

**App category:** Health & Fitness  _(alternative: Productivity)_
**Tags:** habit tracker, reminders, productivity, self-improvement, routine

**Contact details**
```
Email:   rajat.jas@gmail.com
Website: https://github.com/Rajat1793/habit_tracker   (optional)
Phone:   (optional)
```

---

## 2. Graphics (Store listing → Graphics)

| Asset | Requirement | Status |
|---|---|---|
| App icon | 512×512 PNG (32-bit) | Use `assets/icon.png` scaled to 512, or Play uses the AAB icon |
| Feature graphic | 1024×500 PNG/JPG (required for production) | `docs/store/feature-graphic.png` (generated) |
| Phone screenshots | 2–8, PNG/JPG, 16:9 or 9:16, 320–3840px | Use `docs/screenshots/*.png` (1080×2424 ✓) |
| Tablet screenshots | optional | — |

Recommended screenshot order: `landing.png`, `home.png`, `new.png`,
`detail.png`, `settings.png`.

---

## 3. Release (Testing → Internal testing → Create release)

- **App bundle:** upload `~/Desktop/streaks-production.aab` (versionCode 2).
- **Signing:** choose **Use Play App Signing** (recommended).
- **Release name:** `2 (0.1.0)` (auto).
- **Release notes:** paste from [release-notes.txt](release-notes.txt).

---

## 4. App content declarations (left menu → “App content”)

**Privacy policy**
```
https://rajat1793.github.io/habit_tracker/privacy-policy.html
```

**App access**
- All functionality is available without special access → “All functionality
  is available without restrictions.” (No login exists.)

**Ads**
- Does your app contain ads? → **No**

**Content rating** (questionnaire → category: *Utility, Productivity,
Communication, or Other*)
- Violence: **No** to all
- Sexuality: **No** to all
- Language / profanity: **No**
- Controlled substances: **No**
- Gambling / simulated gambling: **No**
- User-generated content / user interaction / shares location: **No**
- Digital purchases: **No**
- Expected result: **Everyone / PEGI 3.**

**Target audience and content**
- Target age groups: **13–15, 16–17, 18+** (do NOT include under‑13 so the app
  is not treated as child‑directed).
- Is your app designed for children? → **No**

**Data safety** — see section 5.

**Government apps / Financial features / Health:** No / No / No.
**News app:** No.

---

## 5. Data safety form (App content → Data safety)

**Does your app collect or share any of the required user data types?**
→ **Yes** (because of the push token + optional diagnostics).

**Is all data encrypted in transit?** → **Yes**
**Do you provide a way to request data deletion?** → **Yes** — data is stored
on-device and removed on uninstall / when a habit is deleted. (Select
“Users can request that data is deleted” and note in-app deletion.)

### Data types to declare

1. **Device or other IDs**
   - Collected: **Yes** · Shared: **No**
   - Processed ephemerally: No
   - Required or optional: **Optional** (only if the user enables notifications)
   - Purpose: **App functionality** (deliver reminder notifications)
   - Reason: the anonymous Expo push token identifies the device to deliver
     notifications.

2. **App activity → Other actions / diagnostics** _(only if you ship with a
   Sentry DSN configured — OFF by default)_
   - Crash logs: Collected **Yes** · Shared **No** · Purpose **App
     functionality / Analytics** (crash diagnostics)
   - Diagnostics: same as above.
   - **If crash reporting is disabled (default), declare “No” for these.**

### Data types NOT collected (declare No)
- Location, Personal info (name/email), Financial info, Health & fitness data
  leaving the device, Messages, Photos/videos, Audio, Files, Contacts,
  Calendar, Web browsing, Installed apps.

> Note on habits: habit names/schedules are **stored only on the device** and
> never transmitted, so under Play’s definitions they are **not “collected.”**
> Do not declare them as collected data.

---

## 6. Store settings

- **App category:** Health & Fitness (or Productivity)
- **Contact email:** rajat.jas@gmail.com
- **External marketing:** your choice
- **Store listing contact / country availability:** select your target
  countries (e.g. all).

---

## 7. Enable the privacy‑policy URL (GitHub Pages)

1. Push these files (already in `docs/`).
2. GitHub → repo **Settings → Pages** → Source: **Deploy from a branch** →
   Branch: **main**, Folder: **/docs** → Save.
3. Wait ~1 minute. Your policy is live at:
   `https://rajat1793.github.io/habit_tracker/privacy-policy.html`
4. Paste that URL into Play Console → App content → Privacy policy, and into
   the Store listing if asked.

---

## 8. Submit order (checklist)

- [ ] Create app in Play Console (name = Streaks)
- [ ] Enable GitHub Pages, get privacy URL
- [ ] App content: privacy policy, app access, ads, content rating, target
      audience, data safety
- [ ] Store listing: short/full description, icon, feature graphic, screenshots
- [ ] Internal testing → upload AAB → release notes → roll out
- [ ] Add your email as a tester, install via the opt‑in link, verify
- [ ] Production → promote release → Send for review
