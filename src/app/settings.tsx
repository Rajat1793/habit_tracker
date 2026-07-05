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
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { confirmDestructive, notify } from '@/lib/ui/alerts';
import * as Notifications from 'expo-notifications';
import { SchedulableTriggerInputTypes } from 'expo-notifications';
import * as Clipboard from 'expo-clipboard';
import { useRouter } from 'expo-router';
import { usePushNotifications } from '@/hooks/use-push-notifications';
import { useHabits } from '@/hooks/use-habits';
import { useClockFormat } from '@/hooks/use-clock-format';
import type { ClockFormat } from '@/lib/time';
import { parseBackup, serializeBackup } from '@/lib/habits/backup';
import { copyTokenToClipboard } from '@/lib/notifications/push';
import {
  DEFAULT_QUIET_HOURS,
  loadQuietHours,
  saveQuietHours,
  type QuietHours,
} from '@/lib/notifications/quiet-hours';
import { HABIT_CHANNEL_ID } from '@/lib/notifications/setup';
import { resetOnboarding } from '@/lib/onboarding/state';
import type { NotificationDeepLink } from '@/lib/habits/types';
import { useColors, useTheme, useThemedStyles, type ThemeMode } from '@/theme/theme-context';
import { fonts, typography } from '@/theme/typography';
import { SUPPORTED_LOCALES, useI18n, type LocalePref } from '@/i18n';
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

const THEME_MODES: { value: ThemeMode; labelKey: string }[] = [
  { value: 'system', labelKey: 'settings.appearanceSystem' },
  { value: 'light', labelKey: 'settings.appearanceLight' },
  { value: 'dark', labelKey: 'settings.appearanceDark' },
];

const LOCALE_OPTIONS: { value: LocalePref; label: string }[] = [
  { value: 'system', label: 'Auto' },
  ...SUPPORTED_LOCALES.map((code) => ({ value: code, label: code.toUpperCase() })),
];

const TIME_FORMATS: { value: ClockFormat; labelKey: string }[] = [
  { value: '12h', labelKey: 'settings.timeFormat12' },
  { value: '24h', labelKey: 'settings.timeFormat24' },
];

export default function SettingsScreen() {
  const { token, permission, loading, register, refreshPermission, openSettings } =
    usePushNotifications();
  const { habits, replaceAll } = useHabits();
  const colors = useColors();
  const { mode, setMode } = useTheme();
  const { format: clockFormat, setFormat: setClockFormat } = useClockFormat();
  const { pref: localePref, setPref: setLocalePref, t } = useI18n();
  const styles = useThemedStyles(makeStyles);
  const router = useRouter();

  const [copied, setCopied] = useState(false);
  const [testing, setTesting] = useState(false);
  const [quiet, setQuiet] = useState<QuietHours>(DEFAULT_QUIET_HOURS);
  const [quietSaved, setQuietSaved] = useState(false);
  const [exported, setExported] = useState(false);

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

  const onExport = async () => {
    await Clipboard.setStringAsync(serializeBackup(habits));
    setExported(true);
    setTimeout(() => setExported(false), 1500);
  };

  const onImport = async () => {
    // Read the clipboard. Browsers may reject this (permission / no user
    // gesture / tab not focused) — surface a friendly error instead of an
    // unhandled rejection.
    let raw = '';
    try {
      raw = await Clipboard.getStringAsync();
    } catch (err) {
      notify(t('settings.failed'), err instanceof Error ? err.message : String(err));
      return;
    }
    if (!raw.trim()) {
      notify(t('settings.failed'), t('settings.backupEmpty'));
      return;
    }
    const parsed = parseBackup(raw);
    if (!parsed) {
      notify(t('settings.failed'), t('settings.backupImportFail'));
      return;
    }
    confirmDestructive({
      title: t('settings.backupImportConfirmTitle'),
      body: t('settings.backupImportConfirmBody'),
      cancelLabel: t('common.cancel'),
      confirmLabel: t('common.save'),
      onConfirm: async () => {
        await replaceAll(parsed.habits);
        notify(
          t('settings.backupImportConfirmTitle'),
          t('settings.backupImportSuccess', { count: parsed.habits.length }),
        );
      },
    });
  };

  const onResetOnboarding = async () => {
    await resetOnboarding();
    router.replace('/onboarding');
  };

  const onSendTest = async () => {
    if (!permission.granted) {
      notify(t('settings.permissionNeeded'), t('settings.permissionNeededBody'));
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
          sound: true,
        },
        trigger: {
          type: SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: 3,
          channelId: HABIT_CHANNEL_ID,
        },
      });
      notify(t('settings.scheduling'), t('settings.scheduledMsg'));
    } catch (err) {
      notify(t('settings.failed'), err instanceof Error ? err.message : String(err));
    } finally {
      setTesting(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.h1} accessibilityRole="header">
        {t('settings.title')}
      </Text>

      {/* Appearance */}
      <View style={styles.card}>
        <Text style={styles.cardLabel}>{t('settings.appearance')}</Text>
        <View style={styles.segment}>
          {THEME_MODES.map(({ value, labelKey }) => (
            <Pressable
              key={value}
              onPress={() => setMode(value)}
              style={[styles.segmentBtn, mode === value && styles.segmentBtnActive]}
              accessibilityRole="button"
              accessibilityState={{ selected: mode === value }}
              accessibilityLabel={t(labelKey)}
            >
              <Text
                style={[styles.segmentText, mode === value && styles.segmentTextActive]}
              >
                {t(labelKey)}
              </Text>
            </Pressable>
          ))}
        </View>
        <Text style={styles.fineprint}>{t('settings.appearanceHint')}</Text>
      </View>

      {/* Time format */}
      <View style={styles.card}>
        <Text style={styles.cardLabel}>{t('settings.timeFormat')}</Text>
        <View style={styles.segment}>
          {TIME_FORMATS.map(({ value, labelKey }) => (
            <Pressable
              key={value}
              onPress={() => setClockFormat(value)}
              style={[styles.segmentBtn, clockFormat === value && styles.segmentBtnActive]}
              accessibilityRole="button"
              accessibilityState={{ selected: clockFormat === value }}
              accessibilityLabel={t(labelKey)}
            >
              <Text
                style={[styles.segmentText, clockFormat === value && styles.segmentTextActive]}
              >
                {t(labelKey)}
              </Text>
            </Pressable>
          ))}
        </View>
        <Text style={styles.fineprint}>{t('settings.timeFormatHint')}</Text>
      </View>

      {/* Language */}
      <View style={styles.card}>
        <Text style={styles.cardLabel}>{t('settings.language')}</Text>
        <View style={styles.segment}>
          {LOCALE_OPTIONS.map(({ value, label }) => (
            <Pressable
              key={value}
              onPress={() => setLocalePref(value)}
              style={[styles.segmentBtn, localePref === value && styles.segmentBtnActive]}
              accessibilityRole="button"
              accessibilityState={{ selected: localePref === value }}
              accessibilityLabel={value === 'system' ? t('settings.languageSystem') : label}
            >
              <Text
                style={[
                  styles.segmentText,
                  localePref === value && styles.segmentTextActive,
                ]}
              >
                {value === 'system' ? t('settings.languageSystem') : label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Permission card */}
      <View style={styles.card}>
        <Text style={styles.cardLabel}>{t('settings.permission')}</Text>
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
            accessibilityLabel={t('settings.enable')}
          >
            <Text style={styles.primaryBtnText}>
              {loading ? t('settings.requesting') : t('settings.enable')}
            </Text>
          </Pressable>
        )}

        {permission.status === 'denied' && (
          <>
            <Text style={styles.helpText}>{t('settings.permissionDenied')}</Text>
            <Pressable
              style={styles.primaryBtn}
              onPress={openSettings}
              accessibilityRole="button"
              accessibilityLabel={t('settings.openSystemSettings')}
            >
              <Text style={styles.primaryBtnText}>{t('settings.openSystemSettings')}</Text>
            </Pressable>
            <Pressable
              style={styles.linkBtn}
              onPress={refreshPermission}
              accessibilityRole="button"
              accessibilityLabel={t('settings.refresh')}
            >
              <Text style={styles.linkBtnText}>{t('settings.refresh')}</Text>
            </Pressable>
          </>
        )}

        {permission.status === 'granted' && (
          <Text style={styles.helpText}>{t('settings.permissionGranted')}</Text>
        )}
      </View>

      {/* Push token card */}
      <View style={styles.card}>
        <Text style={styles.cardLabel}>{t('settings.pushToken')}</Text>
        {token ? (
          <>
            <Text selectable style={styles.tokenText}>
              {token}
            </Text>
            <Pressable
              style={styles.secondaryBtn}
              onPress={onCopy}
              accessibilityRole="button"
              accessibilityLabel={t('settings.copyToken')}
              accessibilityHint={t('a11y.hintCopyToken')}
            >
              <Text style={styles.secondaryBtnText}>
                {copied ? t('settings.copied') : t('settings.copyToken')}
              </Text>
            </Pressable>
          </>
        ) : (
          <>
            <Text style={styles.helpText}>
              {permission.granted ? t('settings.noTokenGranted') : t('settings.noTokenDenied')}
            </Text>
            <Pressable
              style={[styles.primaryBtn, !permission.granted && styles.btnDisabled]}
              onPress={register}
              disabled={!permission.granted || loading}
              accessibilityRole="button"
              accessibilityState={{ disabled: !permission.granted || loading }}
              accessibilityLabel={t('settings.register')}
            >
              {loading ? (
                <ActivityIndicator color={colors.accentText} />
              ) : (
                <Text style={styles.primaryBtnText}>{t('settings.register')}</Text>
              )}
            </Pressable>
          </>
        )}
        <Text style={styles.fineprint}>{t('settings.pushFineprint')}</Text>
      </View>

      {/* Foreground / deep-link tester */}
      <View style={styles.card}>
        <Text style={styles.cardLabel}>{t('settings.testTitle')}</Text>
        <Text style={styles.helpText}>{t('settings.testHint')}</Text>
        <Pressable
          style={styles.secondaryBtn}
          onPress={onSendTest}
          disabled={testing}
          accessibilityRole="button"
          accessibilityLabel={t('settings.testBtn')}
          accessibilityHint={t('a11y.hintTestReminder')}
        >
          <Text style={styles.secondaryBtnText}>
            {testing ? t('settings.scheduling') : t('settings.testBtn')}
          </Text>
        </Pressable>
      </View>

      {/* Quiet hours */}
      <View style={styles.card}>
        <View style={styles.rowBetween}>
          <Text style={styles.cardLabel}>{t('settings.quietTitle')}</Text>
          <Switch
            value={quiet.enabled}
            onValueChange={(enabled) => setQuiet((q) => ({ ...q, enabled }))}
            trackColor={{ false: colors.switchTrackOff, true: colors.accent }}
            thumbColor={colors.text}
            accessibilityLabel={t('settings.quietTitle')}
          />
        </View>
        <Text style={styles.helpText}>{t('settings.quietHint')}</Text>
        <View style={[styles.row, { marginTop: 12, gap: 16 }]}>
          <View style={{ flex: 1 }}>
            <Text style={styles.miniLabel}>{t('settings.quietStart')}</Text>
            <TextInput
              value={String(quiet.startHour)}
              onChangeText={(t2) => setQuiet((q) => ({ ...q, startHour: clampHour(t2) }))}
              keyboardType="number-pad"
              maxLength={2}
              editable={quiet.enabled}
              style={[styles.input, !quiet.enabled && styles.btnDisabled]}
              accessibilityLabel={t('settings.quietStart')}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.miniLabel}>{t('settings.quietEnd')}</Text>
            <TextInput
              value={String(quiet.endHour)}
              onChangeText={(t2) => setQuiet((q) => ({ ...q, endHour: clampHour(t2) }))}
              keyboardType="number-pad"
              maxLength={2}
              editable={quiet.enabled}
              style={[styles.input, !quiet.enabled && styles.btnDisabled]}
              accessibilityLabel={t('settings.quietEnd')}
            />
          </View>
        </View>
        <Pressable
          style={styles.secondaryBtn}
          onPress={onSaveQuiet}
          accessibilityRole="button"
          accessibilityLabel={t('settings.quietSaveBtn')}
        >
          <Text style={styles.secondaryBtnText}>
            {quietSaved ? t('settings.quietSaved') : t('settings.quietSaveBtn')}
          </Text>
        </Pressable>
        <Text style={styles.fineprint}>{t('settings.quietFineprint')}</Text>
      </View>

      {/* Backup */}
      <View style={styles.card}>
        <Text style={styles.cardLabel}>{t('settings.backupTitle')}</Text>
        <Text style={styles.helpText}>{t('settings.backupHint')}</Text>
        <Pressable
          style={styles.secondaryBtn}
          onPress={onExport}
          accessibilityRole="button"
          accessibilityLabel={t('settings.backupExport')}
          accessibilityHint={t('a11y.hintBackupExport')}
        >
          <Text style={styles.secondaryBtnText}>
            {exported ? t('settings.backupExported') : t('settings.backupExport')}
          </Text>
        </Pressable>
        <Pressable
          style={[styles.secondaryBtn, { marginTop: 8 }]}
          onPress={onImport}
          accessibilityRole="button"
          accessibilityLabel={t('settings.backupImport')}
          accessibilityHint={t('a11y.hintBackupImport')}
        >
          <Text style={styles.secondaryBtnText}>{t('settings.backupImport')}</Text>
        </Pressable>
        <Text style={styles.fineprint}>{t('settings.backupFineprint')}</Text>
      </View>

      {/* Advanced */}
      <View style={styles.card}>
        <Text style={styles.cardLabel}>{t('settings.advancedTitle')}</Text>
        <Pressable
          style={styles.linkBtn}
          onPress={onResetOnboarding}
          accessibilityRole="button"
          accessibilityLabel={t('settings.onboardingReset')}
          accessibilityHint={t('a11y.hintOnboardingReset')}
        >
          <Text style={styles.linkBtnText}>{t('settings.onboardingReset')}</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

function makeStyles(c: Palette) {
  return StyleSheet.create({
    container: { padding: 20, paddingBottom: 40 },
    h1: { ...typography.pageTitle, color: c.text, marginBottom: 16 },
    card: {
      backgroundColor: c.card,
      borderRadius: 14,
      padding: 16,
      marginBottom: 14,
    },
    cardLabel: {
      ...typography.sectionLabel,
      color: c.textMuted,
      marginBottom: 10,
    },
    row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    rowBetween: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    dot: { width: 10, height: 10, borderRadius: 5 },
    miniLabel: { ...typography.badge, color: c.textMuted, marginBottom: 6 },
    input: {
      backgroundColor: c.surface,
      color: c.text,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 16,
      fontFamily: fonts.mono,
    },
    cardValue: { ...typography.bodySemiBold, color: c.text, fontSize: 16 },
    helpText: { ...typography.meta, color: c.textMuted, marginTop: 6 },
    fineprint: { color: c.textFaint, fontSize: 11, lineHeight: 15, marginTop: 10 },
    tokenText: {
      color: c.text,
      fontSize: 12,
      fontFamily: fonts.mono,
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
    primaryBtnText: { ...typography.button, color: c.accentText },
    secondaryBtn: {
      marginTop: 10,
      backgroundColor: c.cardAlt,
      paddingVertical: 12,
      borderRadius: 12,
      alignItems: 'center',
    },
    secondaryBtnText: { ...typography.button, color: c.text },
    btnDisabled: { opacity: 0.4 },
    linkBtn: { marginTop: 8, paddingVertical: 8, alignItems: 'center' },
    linkBtnText: { ...typography.meta, color: c.textMuted },
    segment: {
      flexDirection: 'row',
      backgroundColor: c.surface,
      borderRadius: 12,
      padding: 4,
    },
    segmentBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
    segmentBtnActive: { backgroundColor: c.accent },
    segmentText: { ...typography.button, color: c.textMuted },
    segmentTextActive: { color: c.accentText },
  });
}
