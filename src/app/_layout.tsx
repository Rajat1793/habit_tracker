import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useNotificationRouter } from '@/hooks/use-notification-router';
import { ensureNotificationCategory } from '@/lib/notifications/actions';
import {
  ensureAndroidChannel,
  installForegroundHandler,
} from '@/lib/notifications/setup';
import { isOnboarded } from '@/lib/onboarding/state';
import { initSentry } from '@/lib/observability/sentry';
import { ThemeProvider, useTheme } from '@/theme/theme-context';
import { I18nProvider, useT } from '@/i18n';

// Install the foreground handler at module load — before React even mounts.
// This guarantees the handler is registered before any notification can
// arrive at startup.
installForegroundHandler();

// Crash reporting init — no-op in dev or when DSN is absent.
initSentry();

function ThemedStack() {
  const { colors, scheme } = useTheme();
  const t = useT();
  return (
    <>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.bg },
          headerTintColor: colors.text,
          headerTitleStyle: { fontWeight: '700' },
          contentStyle: { backgroundColor: colors.bg },
        }}
      >
        <Stack.Screen name="index" options={{ title: 'Streaks' }} />
        <Stack.Screen
          name="new"
          options={{ title: t('form.titleNew'), presentation: 'modal' }}
        />
        <Stack.Screen name="habit/[id]" options={{ title: '' }} />
        <Stack.Screen name="settings" options={{ title: t('settings.title') }} />
        <Stack.Screen
          name="onboarding"
          options={{ headerShown: false, presentation: 'fullScreenModal' }}
        />
      </Stack>
    </>
  );
}

/**
 * Redirect first-time users to /onboarding once the navigator has mounted.
 * We wait for `useSegments` to return a non-empty array so we don't push
 * before expo-router's Root is ready.
 */
function useFirstLaunchGuard() {
  const router = useRouter();
  const segments = useSegments();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (checked) return;
    // expo-router types segments as a route-specific tuple; treat it as a
    // plain string array for the readiness/route guard below.
    const segs = segments as readonly string[];
    if (segs.length === 0) return; // wait for router to be ready
    (async () => {
      const seen = await isOnboarded();
      setChecked(true);
      if (!seen && segs[0] !== 'onboarding') {
        router.replace('/onboarding');
      }
    })();
  }, [segments, checked, router]);
}

export default function RootLayout() {
  // Channel + category must exist BEFORE the user is ever prompted for
  // permission on Android 13+. Both calls are idempotent — running them on
  // every cold start just updates the existing config.
  useEffect(() => {
    void ensureAndroidChannel();
    void ensureNotificationCategory();
  }, []);

  // Wires both local AND push notification taps to expo-router. Same handler.
  // Also dispatches the Done / Snooze action buttons.
  useNotificationRouter();
  useFirstLaunchGuard();

  return (
    <ThemeProvider>
      <I18nProvider>
        <ThemedStack />
      </I18nProvider>
    </ThemeProvider>
  );
}
