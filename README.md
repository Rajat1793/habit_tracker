# Streaks — Habit Tracker with Notifications

React Native + Expo SDK 55 app for the Mobile Development Cohort.
See [PLAN.md](PLAN.md) for the full architecture and milestones.

## Quick start

```bash
npm install
npx expo install --check        # align native module versions with SDK 55
npm start                       # opens dev server (dev-client required for push)
```

Push notifications **do not work in Expo Go**. Build a dev client:

```bash
npx eas-cli build --profile development --platform android
```

Then update `app.json` → `extra.eas.projectId` with the value from `eas init`.

## Scripts

| script | purpose |
|---|---|
| `npm start` | Metro dev server (dev-client mode) |
| `npm run android` / `ios` | Native run |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run prebuild` | Generate native projects (regenerates on every run) |

## Project layout

```
src/
  app/                         # expo-router screens
  lib/
    habits/                    # types, storage, streak math
    notifications/             # setup, schedule, push, deep-link router
  hooks/                       # reactive surface for screens
```
