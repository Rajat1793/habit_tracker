import { useEffect, useState } from 'react';
import { Text } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { useNotificationRouter } from '@/hooks/use-notification-router';
import { ensureNotificationCategory } from '@/lib/notifications/actions';
import {
  ensureAndroidChannel,
  installForegroundHandler,
} from '@/lib/notifications/setup';
import { isOnboarded } from '@/lib/onboarding/state';
import { initSentry } from '@/lib/observability/sentry';
import { ThemeProvider, useTheme } from '@/theme/theme-context';
import { fonts, getFontMap, typography } from '@/theme/typography';
import { I18nProvider, useT } from '@/i18n';
import { LoadingScreen } from '@/components/loading-screen';

// Install the foreground handler at module load — before React even mounts.
// This guarantees the handler is registered before any notification can
// arrive at startup.
installForegroundHandler();

// Crash reporting init — no-op in dev or when DSN is absent.
initSentry();

// Apply Inter as the default font for every <Text> in the app exactly once.
// `Text.defaultProps` is still the canonical way to set a global text style
// in React Native — there's no global CSS equivalent. Wrapped in a guard so
// repeated hot-reloads don't keep stacking the default style array.
let defaultTextStyleApplied = false;
function applyDefaultTextFont() {
  if (defaultTextStyleApplied) return;
  const TextAny = Text as unknown as {
    defaultProps?: { style?: unknown };
  };
  TextAny.defaultProps = TextAny.defaultProps ?? {};
  TextAny.defaultProps.style = [
    { fontFamily: fonts.bodyRegular },
    TextAny.defaultProps.style,
  ];
  defaultTextStyleApplied = true;
}

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
          headerTitleStyle: {
            fontFamily: fonts.headlineSemiBold,
            fontSize: typography.headlineMd.fontSize,
          },
          contentStyle: { backgroundColor: colors.bg },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
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
  // Load the Inter + Space Grotesk weights used by the typography system.
  // Render nothing until they're ready so we never flash a system font.
  const [fontsLoaded] = useFonts(getFontMap());

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

  if (!fontsLoaded) {
    // Themed splash bridging OS splash → JS init so users see a continuous
    // brand frame instead of a blank surface.
    return <LoadingScreen />;
  }

  applyDefaultTextFont();

  return (
    <ThemeProvider>
      <I18nProvider>
        <ThemedStack />
      </I18nProvider>
    </ThemeProvider>
  );
}
