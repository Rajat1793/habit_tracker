/**
 * Settings screen.
 *
 * Drives `usePushNotifications` — request permission, fetch the Expo push
 * token, expose copy, and provide the denied-state CTA to open OS settings.
 *
 * Also includes a "send test reminder" affordance: schedules a real local
 * notification in 3 seconds with a deep-link payload. Useful for verifying
 * both the foreground handler AND tap-routing without waiting for a habit's
 * scheduled time.
 */
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as Notifications from 'expo-notifications';
import { SchedulableTriggerInputTypes } from 'expo-notifications';
import { usePushNotifications } from '@/hooks/use-push-notifications';
import { useHabits } from '@/hooks/use-habits';
import { copyTokenToClipboard } from '@/lib/notifications/push';
import { HABIT_CHANNEL_ID } from '@/lib/notifications/setup';
import type { NotificationDeepLink } from '@/lib/habits/types';

function statusColor(status: string): string {
  if (status === 'granted') return '#7FD18B';
  if (status === 'denied') return '#FF6F6F';
  return '#FFB75C';
}

export default function SettingsScreen() {
  const { token, permission, loading, register, refreshPermission, openSettings } =
    usePushNotifications();
  const { habits } = useHabits();
  const [copied, setCopied] = useState(false);
  const [testing, setTesting] = useState(false);

  const onCopy = async () => {
    if (!token) return;
    await copyTokenToClipboard(token);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const onSendTest = async () => {
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Enable notifications first.');
      return;
    }
    setTesting(true);
    try {
      // Deep-link to the first habit if any exist; otherwise to home.
      const target = habits[0];
      const data: NotificationDeepLink | { screen: string } = target
        ? { screen: '/habit', habitId: target.id }
        : { screen: '/' };
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🔔 Test reminder',
          body: target
            ? `Tap to open “${target.name}”.`
            : 'Tap to verify deep linking.',
          data,
          sound: 'default',
        },
        trigger: {
          type: SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: 3,
          channelId: HABIT_CHANNEL_ID,
        },
      });
      Alert.alert('Scheduled', 'A test notification will arrive in 3 seconds.');
    } catch (err) {
      Alert.alert('Failed', err instanceof Error ? err.message : String(err));
    } finally {
      setTesting(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.h1}>Settings</Text>

      {/* Permission card */}
      <View style={styles.card}>
        <Text style={styles.cardLabel}>Notification permission</Text>
        <View style={styles.row}>
          <View style={[styles.dot, { backgroundColor: statusColor(permission.status) }]} />
          <Text style={styles.cardValue}>{permission.status}</Text>
        </View>

        {permission.status === 'undetermined' && (
          <Pressable style={styles.primaryBtn} onPress={register} disabled={loading}>
            <Text style={styles.primaryBtnText}>
              {loading ? 'Requesting…' : 'Enable notifications'}
            </Text>
          </Pressable>
        )}

        {permission.status === 'denied' && (
          <>
            <Text style={styles.helpText}>
              Notifications are off for Streaks. You can re-enable them from system settings.
            </Text>
            <Pressable style={styles.primaryBtn} onPress={openSettings}>
              <Text style={styles.primaryBtnText}>Open system settings</Text>
            </Pressable>
            <Pressable style={styles.linkBtn} onPress={refreshPermission}>
              <Text style={styles.linkBtnText}>I changed it — refresh</Text>
            </Pressable>
          </>
        )}

        {permission.status === 'granted' && (
          <Text style={styles.helpText}>Reminders and push notifications can arrive.</Text>
        )}
      </View>

      {/* Push token card */}
      <View style={styles.card}>
        <Text style={styles.cardLabel}>Expo push token</Text>
        {token ? (
          <>
            <Text selectable style={styles.tokenText}>
              {token}
            </Text>
            <Pressable style={styles.secondaryBtn} onPress={onCopy}>
              <Text style={styles.secondaryBtnText}>{copied ? '✓ Copied' : 'Copy token'}</Text>
            </Pressable>
          </>
        ) : (
          <>
            <Text style={styles.helpText}>
              {permission.granted
                ? 'No token yet. Tap below to register this device.'
                : 'Grant permission first, then register.'}
            </Text>
            <Pressable
              style={[styles.primaryBtn, !permission.granted && styles.btnDisabled]}
              onPress={register}
              disabled={!permission.granted || loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.primaryBtnText}>Register for push</Text>
              )}
            </Pressable>
          </>
        )}
        <Text style={styles.fineprint}>
          Push requires a dev/standalone build — it does not work in Expo Go on SDK 53+.
        </Text>
      </View>

      {/* Foreground / deep-link tester */}
      <View style={styles.card}>
        <Text style={styles.cardLabel}>Test foreground + deep link</Text>
        <Text style={styles.helpText}>
          Schedules a local notification in 3 seconds.{'\n'}
          Keep the app open to see the foreground banner; lock the screen to see background.
        </Text>
        <Pressable style={styles.secondaryBtn} onPress={onSendTest} disabled={testing}>
          <Text style={styles.secondaryBtnText}>
            {testing ? 'Scheduling…' : 'Send test reminder in 3s'}
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 40 },
  h1: { color: '#F5F5F7', fontSize: 24, fontWeight: '700', marginBottom: 16 },
  card: {
    backgroundColor: '#16161D',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
  },
  cardLabel: {
    color: '#9A9AA2',
    fontSize: 12,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  cardValue: { color: '#F5F5F7', fontSize: 16, fontWeight: '600' },
  helpText: { color: '#9A9AA2', fontSize: 13, lineHeight: 18, marginTop: 6 },
  fineprint: { color: '#5C5C66', fontSize: 11, lineHeight: 15, marginTop: 10 },
  tokenText: {
    color: '#B8B8C2',
    fontSize: 12,
    fontFamily: 'Courier',
    backgroundColor: '#0B0B0F',
    padding: 10,
    borderRadius: 8,
    marginTop: 4,
  },
  primaryBtn: {
    marginTop: 12,
    backgroundColor: '#7C5CFF',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryBtnText: { color: '#fff', fontWeight: '700' },
  secondaryBtn: {
    marginTop: 10,
    backgroundColor: '#26222E',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  secondaryBtnText: { color: '#F5F5F7', fontWeight: '600' },
  btnDisabled: { opacity: 0.4 },
  linkBtn: { marginTop: 8, paddingVertical: 8, alignItems: 'center' },
  linkBtnText: { color: '#9A9AA2', fontSize: 13 },
});
