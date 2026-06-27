Quick wins (hours, no new deps)
Reorder habits — drag handle on home row; persist order field on Habit.
Archive instead of delete — soft-delete with an archivedAt field; "Archived" section in Settings.
Skip-day / "rest" button — explicit markSkipped that doesn't break a streak (great for sick days).
Best streak (record) — store bestStreak alongside current; show "🏆 Best 42" chip on detail.
Per-habit color/tag — tint the streak chip and notification accent.
Haptics on mark done — expo-haptics (already an Expo SDK module).
Medium (a day each)
Calendar heatmap on detail screen — 30/90-day grid, green cells for completed days. Pure SVG, no chart lib needed.
Weekly / monthly stats — completion % per habit, longest streak, drop-offs.
Multiple reminders per habit — array of {hour, minute} instead of one. scheduleHabit already returns string[], so the storage shape barely changes.
N-times-per-week frequency — third Frequency variant { kind: 'count', perWeek: 3 }. Streak logic counts completions in rolling 7-day window.
Snooze duration picker — Snooze 5/15/30/60 min instead of fixed 10. Add more action buttons or a custom interactive notification.
Re-anchor streak on edit — if user moves time forward and they're now late, don't punish them.
Daily summary push at end-of-day — "You hit 2/3 today 🔥" — single scheduled notification with aggregated body.
Bigger (multi-day)
iCloud / Google Drive sync — keep AsyncStorage as source of truth, periodic backup snapshot; restore on new device.
Cross-device sync via Supabase / Firebase — user account, real-time habits table, push tokens stored server-side. Server pushes when another device marks done.
Widget (iOS WidgetKit / Android Glance) — today's habits on the home screen with deep-link tap. Needs an expo-widgets config plugin or react-native-widget-extension.
Apple Health / Google Fit integration — auto-mark "Run 5k" done when a workout is logged.
Live Activities (iOS) / Ongoing notification (Android) — show today's progress as a persistent lock-screen widget.
Habit chains (atomic-habits style) — link habits ("After coffee, meditate"); completing one triggers a reminder for the next 5 min later.
Social streaks — accountability buddy who gets a push when you mark done (or when you miss).
AI insights — weekly GPT summary of your data ("You're 80% on weekdays but 30% on weekends — try shifting Gym to Saturday morning").
Polish / nice-to-haves
Onboarding carousel — 3 slides explaining notifications, channels, deep-links.
Localization — expo-localization + i18n-js; ship en/hi/es.
Dark / light theme toggle — currently hard-dark; add system-follow.
Settings export / import — JSON dump of habits for manual backup.
Empty-state confetti — when you complete the last due habit of the day.
Accessibility pass — accessibilityLabel on every Pressable, dynamic-type support.
Engineering / quality
Unit tests for streak.ts, quiet-hours.ts, frequency.ts (all pure — easy wins with Jest).
E2E test with Maestro covering the create → mark done → notification tap flow.
CI — GitHub Actions running typecheck + lint + tests on PR.
Sentry — sentry-expo for crash + permission denial telemetry.