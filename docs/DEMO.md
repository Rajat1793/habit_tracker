# Demo Storyboard

Target length: **3–4 minutes**. Record portrait, 1080p. Voice-over optional —
on-screen captions are enough.

Save the final cut as `docs/demo.mp4` (or upload to YouTube / Loom and link
from the README).

## Scene-by-scene

### 0:00–0:15 — Cold-launch & home screen
- Open the app from a fresh install.
- Show the empty state: "No habits yet — tap + New to start."
- Caption: **"Local-first habit tracker. Built with Expo SDK 55 + expo-router."**

### 0:15–0:45 — Create a daily habit
- Tap **+ New**.
- Name: `Read 20 min`, emoji `📚`.
- Keep **Daily**. Time: 21:00.
- Save → returns to home, habit appears with streak chip 0.

### 0:45–1:15 — Create a weekly habit
- Tap **+ New** again.
- Name: `Gym`, emoji `💪`.
- Tap **Weekly**. Toggle Mon / Wed / Fri chips.
- Time: 07:00.
- Save → both habits visible.

### 1:15–1:45 — Mark done + streak chip
- Tap **Mark done** on `Read 20 min`. Button becomes `✓ Done`. Streak chip → `🔥 1`.
- Tap the habit row → detail screen.
- Caption: **"Streak engine: same-day idempotent, gap-1 → +1, gap > 1 → reset."**

### 1:45–2:15 — Notification permission + push token
- Tap header **Settings**.
- Show permission status `undetermined` → tap **Enable notifications**.
- Status flips to `granted` with the green dot.
- Tap **Register for push** → Expo push token appears.
- Tap **Copy token**.
- Caption: **"`getExpoPushTokenAsync` requires the EAS `projectId`. Token persisted in AsyncStorage."**

### 2:15–2:45 — Foreground + deep-link test
- Still on Settings. Tap **Send test reminder in 3s**.
- Stay on screen → banner appears (foreground handler!).
- Tap banner → router pushes the habit detail screen.
- Caption: **"Same handler fires for local AND remote — payload is identical."**

### 2:45–3:15 — Snooze + Done actions
- Lock the device.
- Send another test (or wait for scheduled reminder).
- Long-press the notification → tap **Snooze 10m**. Notification dismisses.
- Show the new reminder appearing 10 minutes later (skip the wait — cut to the new banner).
- Tap **✓ Done** on the new reminder.
- Unlock; open the app. Habit shows `✓ Done` today.

### 3:15–3:45 — Quiet hours + badge
- Open Settings → toggle **Quiet hours** on. Start `22`, End `7`. Save.
- Open the home screen. Note app icon badge shows pending count.
- Caption: **"Badge = due today − completed today. Updated on every store mutation."**

### 3:45–4:00 — Push from expo.dev/notifications
- Cut to laptop. Open <https://expo.dev/notifications>.
- Paste token, set `channelId: habit-reminders`, payload `{"screen":"/habit","habitId":"..."}`.
- Send. Cut to phone — notification arrives. Tap → deep links to that habit.
- End card.

## Required screenshots for the README

Save under `docs/screenshots/`:

| File | What's in it |
|---|---|
| `home-empty.png` | First launch, no habits |
| `home-with-habits.png` | 2–3 habits, mix of streaks |
| `new-daily.png` | New screen, daily mode |
| `new-weekly.png` | New screen, weekly mode with weekday chips |
| `habit-detail.png` | Detail page, streak chip + scheduled IDs |
| `settings-granted.png` | Settings with token visible + quiet hours |
| `notification-foreground.png` | Banner showing while app open |
| `notification-actions.png` | Expanded notification with Done + Snooze |

