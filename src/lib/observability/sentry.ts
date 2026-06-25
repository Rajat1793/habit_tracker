/**
 * Sentry initialization wrapper.
 *
 * Reads the DSN from `app.config`'s `extra.sentryDsn` (falls back to
 * `EXPO_PUBLIC_SENTRY_DSN`). We intentionally NO-OP if:
 *   - we're running in __DEV__ (avoid spamming the project with dev errors)
 *   - no DSN is configured (don't crash on a missing key)
 *
 * The `@sentry/react-native` import is kept inside the function so the
 * native module is only required when Sentry is actually enabled. This lets
 * Expo Go users and the Jest test runner work without the native binary.
 */
import Constants from 'expo-constants';

let initialized = false;

function readDsn(): string | undefined {
  const fromExtra =
    (Constants?.expoConfig?.extra as Record<string, unknown> | undefined)
      ?.sentryDsn;
  if (typeof fromExtra === 'string' && fromExtra.length > 0) return fromExtra;
  const env = process.env.EXPO_PUBLIC_SENTRY_DSN;
  if (typeof env === 'string' && env.length > 0) return env;
  return undefined;
}

export function initSentry(): void {
  if (initialized) return;
  if (__DEV__) return;
  const dsn = readDsn();
  if (!dsn) return;

  try {
    // Dynamic require so unit tests and Expo Go don't need the native binary.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Sentry = require('@sentry/react-native');
    Sentry.init({
      dsn,
      // Lower sample rate keeps the free quota happy for a hobby app.
      tracesSampleRate: 0.1,
      // Don't capture personally identifiable info from screenshots / views.
      sendDefaultPii: false,
    });
    initialized = true;
  } catch {
    // If the binary isn't linked (e.g. running in Expo Go), silently skip.
    initialized = false;
  }
}
