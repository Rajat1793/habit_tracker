import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useNotificationRouter } from '@/hooks/use-notification-router';
import {
  ensureAndroidChannel,
  installForegroundHandler,
} from '@/lib/notifications/setup';

// Install the foreground handler at module load — before React even mounts.
// This guarantees the handler is registered before any notification can
// arrive at startup.
installForegroundHandler();

export default function RootLayout() {
  // Channel must exist BEFORE the user is ever prompted for permission on
  // Android 13+. `setNotificationChannelAsync` is idempotent — calling it
  // on every cold start just updates the existing channel.
  useEffect(() => {
    void ensureAndroidChannel();
  }, []);

  // Wires both local AND push notification taps to expo-router. Same handler.
  useNotificationRouter();

  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: '#0B0B0F' },
          headerTintColor: '#F5F5F7',
          headerTitleStyle: { fontWeight: '700' },
          contentStyle: { backgroundColor: '#0B0B0F' },
        }}
      >
        <Stack.Screen name="index" options={{ title: 'Streaks' }} />
        <Stack.Screen
          name="new"
          options={{ title: 'New habit', presentation: 'modal' }}
        />
        <Stack.Screen name="habit/[id]" options={{ title: 'Habit' }} />
        <Stack.Screen name="settings" options={{ title: 'Settings' }} />
      </Stack>
    </>
  );
}
