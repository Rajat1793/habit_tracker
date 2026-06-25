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
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as Notifications from 'expo-notifications';
import { SchedulableTriggerInputTypes } from 'expo-notifications';
import { usePushNotifications } from '@/hooks/use-push-notifications';
import { useHabits } from '@/hooks/use-habits';
import { copyTokenToClipboard } from '@/lib/notifications/push';
import {
  DEFAULT_QUIET_HOURS,
  loadQuietHours,
  saveQuietHours,
  type QuietHours,
} from '@/lib/notifications/quiet-hours';
import { HABIT_CHANNEL_ID } from '@/lib/notifications/setup';
import type { NotificationDeepLink } from '@/lib/habits/types';
import { useColors, useTheme, useThemedStyles, type ThemeMode } from '@/theme/theme-context';
import type { Palette } from '@/theme/colors';

function clampHour(raw: string): number {
  const n = parseInt(raw.replace(/\D/g, ''), 10);
  if (Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(23, n));
}

function statusColor(c: Palette, status: string): string {
  if (status === 'granted') return c.success;
  if (status === 'denied') return c.danger;
  return c.warning;
}

const THEME_MODES: { value: ThemeMode; label: string }[] = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

export default function SettingsScreen() {
  const { token, permission, loading, register, refreshPermission, openSettings } =
    usePushNotifications();
  const { habits } = useHabits();
  const colors = useColors();
  const { mode, setMode } = useTheme();
  const styles = useThemedStyles(makeStyles);

  const [copied, setCopied] = useState(false);
  const [testing, setTesting] = useState(false);
  const [quiet, setQuiet] = useState<QuietHours>(DEFAULT_QUIET_HOURS);
  const [quietSaved, setQuietSaved] = useState(false);

  useEffect(() => {
    void loadQuietHours().then(setQuiet);
  }, []);

  const onSaveQuiet = async () => {
    await saveQuietHours(quiet);
    setQuietSaved(true);
    setTimeout(() => setQuietSaved(false), 1500);
  };

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

      {/* Appearance */}
      <View style={styles.card}>
        <Text style={styles.cardLabel}>Appearance</Text>
        <View style={styles.segment}>
          {THEME_MODES.map(({ value, label }) => (
            <Pressable
              key={value}
              onPress={() => setMode(value)}
              style={[styles.segmentBtn, mode === value && styles.segmentBtnActive]}
              accessibilityRole="button"
              accessibilityState={{ selected: mode === value }}
              accessibilityLabel={`Theme ${label}`}
            >
              <Text
                style={[styles.segmentText, mode === value && styles.segmentTextActive]}
              >
                {label}
              </Text>
            </Pressable>
          ))}
        </View>
        <Text style={styles.fineprint}>
          “System” follows your device’s light/dark setting in real time.
        </Text>
      </View>

      {/* Permission card */}
      <View style={styles.card}>
        <Text style={styles.cardLabel}>Notification permission</Text>
        <View style={styles.row}>
          <View
            style={[styles.dot, { backgroundColor: statusColor(colors, permission.status) }]}
          />
          <Text style={styles.cardValue}>{permission.status}</Text>
        </View>

        {permission.status === 'undetermined' && (
          <Pressable
            style={styles.primaryBtn}
            onPress={register}
            disabled={loading}
            accessibilityRole="button"
            accessibilityLabel="Enable notifications"
          >
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
            <Pressable
              style={styles.primaryBtn}
              onPress={openSettings}
              accessibilityRole="button"
              accessibilityLabel="Open system settings"
            >
              <Text style={styles.primaryBtnText}>Open system settings</Text>
            </Pressable>
            <Pressable
              style={styles.linkBtn}
              onPress={refreshPermission}
              accessibilityRole="button"
              accessibilityLabel="Refresh permission status"
            >
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
            <Pressable
              style={styles.secondaryBtn}
              onPress={onCopy}
              accessibilityRole="button"
              accessibilityLabel="Copy push token to clipboard"
            >
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
              accessibilityRole="button"
              accessibilityState={{ disabled: !permission.granted || loading }}
              accessibilityLabel="Register for push notifications"
            >
              {loading ? (
                <ActivityIndicator color={colors.accentText} />
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
        <Pressable
          style={styles.secondaryBtn}
          onPress={onSendTest}
          disabled={testing}
          accessibilityRole="button"
          accessibilityLabel="Send test reminder in three seconds"
        >
          <Text style={styles.secondaryBtnText}>
            {testing ? 'Scheduling…' : 'Send test reminder in 3s'}
          </Text>
        </Pressable>
      </View>

      {/* Quiet hours */}
      <View style={styles.card}>
        <View style={styles.rowBetween}>
          <Text style={styles.cardLabel}>Quiet hours</Text>
          <Switch
            value={quiet.enabled}
            onValueChange={(enabled) => setQuiet((q) => ({ ...q, enabled }))}
            trackColor={{ false: colors.switchTrackOff, true: colors.accent }}
            thumbColor={colors.text}
            accessibilityLabel="Toggle quiet hours"
          />
        </View>
        <Text style={styles.helpText}>
          Reminders scheduled inside this window arrive silently (no sound, lower priority).
          Wraps across midnight — e.g. 22 → 7 covers 22, 23, 0, 1…6.
        </Text>
        <View style={[styles.row, { marginTop: 12, gap: 16 }]}>
          <View style={{ flex: 1 }}>
            <Text style={styles.miniLabel}>Start hour (0–23)</Text>
            <TextInput
              value={String(quiet.startHour)}
              onChangeText={(t) => setQuiet((q) => ({ ...q, startHour: clampHour(t) }))}
              keyboardType="number-pad"
              maxLength={2}
              editable={quiet.enabled}
              style={[styles.input, !quiet.enabled && styles.btnDisabled]}
              accessibilityLabel="Quiet hours start"
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.miniLabel}>End hour (0–23)</Text>
            <TextInput
              value={String(quiet.endHour)}
              onChangeText={(t) => setQuiet((q) => ({ ...q, endHour: clampHour(t) }))}
              keyboardType="number-pad"
              maxLength={2}
              editable={quiet.enabled}
              style={[styles.input, !quiet.enabled && styles.btnDisabled]}
              accessibilityLabel="Quiet hours end"
            />
          </View>
        </View>
        <Pressable
          style={styles.secondaryBtn}
          onPress={onSaveQuiet}
          accessibilityRole="button"
          accessibilityLabel="Save quiet hours"
        >
          <Text style={styles.secondaryBtnText}>
            {quietSaved ? '✓ Saved' : 'Save quiet hours'}
          </Text>
        </Pressable>
        <Text style={styles.fineprint}>
          New habits picked up the setting automatically. Existing reminders apply it on the
          next reschedule (edit / mark done).
        </Text>
      </View>
    </ScrollView>
  );
}

function makeStyles(c: Palette) {
  return StyleSheet.create({
    container: { padding: 20, paddingBottom: 40 },
    h1: { color: c.text, fontSize: 24, fontWeight: '700', marginBottom: 16 },
    card: {
      backgroundColor: c.card,
      borderRadius: 14,
      padding: 16,
      marginBottom: 14,
    },
    cardLabel: {
      color: c.textMuted,
      fontSize: 12,
      marginBottom: 10,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    rowBetween: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    dot: { width: 10, height: 10, borderRadius: 5 },
    miniLabel: { color: c.textMuted, fontSize: 11, marginBottom: 6 },
    input: {
      backgroundColor: c.surface,
      color: c.text,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 16,
      fontFamily: 'Courier',
    },
    cardValue: { color: c.text, fontSize: 16, fontWeight: '600' },
    helpText: { color: c.textMuted, fontSize: 13, lineHeight: 18, marginTop: 6 },
    fineprint: { color: c.textFaint, fontSize: 11, lineHeight: 15, marginTop: 10 },
    tokenText: {
      color: c.text,
      fontSize: 12,
      fontFamily: 'Courier',
      backgroundColor: c.surface,
      padding: 10,
      borderRadius: 8,
      marginTop: 4,
    },
    primaryBtn: {
      marginTop: 12,
      backgroundColor: c.accent,
      paddingVertical: 12,
      borderRadius: 12,
      alignItems: 'center',
    },
    primaryBtnText: { color: c.accentText, fontWeight: '700' },
    secondaryBtn: {
      marginTop: 10,
      backgroundColor: c.cardAlt,
      paddingVertical: 12,
      borderRadius: 12,
      alignItems: 'center',
    },
    secondaryBtnText: { color: c.text, fontWeight: '600' },
    btnDisabled: { opacity: 0.4 },
    linkBtn: { marginTop: 8, paddingVertical: 8, alignItems: 'center' },
    linkBtnText: { color: c.textMuted, fontSize: 13 },
    segment: {
      flexDirection: 'row',
      backgroundColor: c.surface,
      borderRadius: 12,
      padding: 4,
    },
    segmentBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
    segmentBtnActive: { backgroundColor: c.accent },
    segmentText: { color: c.textMuted, fontWeight: '600' },
    segmentTextActive: { color: c.accentText },
  });
}
