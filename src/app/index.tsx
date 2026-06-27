import { useEffect, useMemo, useRef } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useHabits } from '@/hooks/use-habits';
import { isDueToday } from '@/lib/habits/frequency';
import { getDisplayStreak, isDoneToday } from '@/lib/habits/streak';
import { useColors, useThemedStyles } from '@/theme/theme-context';
import { typography } from '@/theme/typography';
import { useT } from '@/i18n';
import { ConfettiBurst, type ConfettiHandle } from '@/components/confetti-burst';
import type { Palette } from '@/theme/colors';

function fmtTime(h: number, m: number) {
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export default function HomeScreen() {
  const { habits, status, markDoneToday } = useHabits();
  const router = useRouter();
  const colors = useColors();
  const t = useT();
  const styles = useThemedStyles(makeStyles);

  const todays = useMemo(
    () => habits.filter((h) => isDueToday(h)),
    [habits],
  );

  const pending = useMemo(
    () => todays.filter((h) => !isDoneToday(h)).length,
    [todays],
  );

  // Fire confetti exactly when the last pending habit gets marked done.
  // Skip the case where the user simply never had any habits due (pending was already 0).
  const confettiRef = useRef<ConfettiHandle>(null);
  const prevPendingRef = useRef<number | null>(null);
  useEffect(() => {
    const prev = prevPendingRef.current;
    if (prev !== null && prev > 0 && pending === 0 && todays.length > 0) {
      confettiRef.current?.fire();
    }
    prevPendingRef.current = pending;
  }, [pending, todays.length]);

  if (status === 'loading' || status === 'idle') {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ConfettiBurst ref={confettiRef} />
      {todays.length > 0 && pending === 0 && (
        <Text
          accessibilityLiveRegion="polite"
          accessibilityRole="text"
          style={styles.srOnly}
        >
          {t('a11y.allDoneCelebration')}
        </Text>
      )}
      <View style={styles.header}>
        <Text style={styles.heading} accessibilityRole="header">
          {t('home.title')}
        </Text>
        <View style={styles.headerActions}>
          <Link href="/settings" asChild>
            <Pressable hitSlop={12} accessibilityRole="link" accessibilityLabel={t('home.settings')}>
              <Text style={styles.headerLink}>{t('home.settings')}</Text>
            </Pressable>
          </Link>
          <Link href="/new" asChild>
            <Pressable style={styles.addBtn} accessibilityRole="link" accessibilityLabel={t('home.newHabit')}>
              <Text style={styles.addBtnText}>{t('home.newHabit')}</Text>
            </Pressable>
          </Link>
        </View>
      </View>

      {habits.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>{t('home.empty.noHabitsTitle')}</Text>
          <Text style={styles.emptyBody}>{t('home.empty.noHabitsBody')}</Text>
        </View>
      ) : todays.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>{t('home.empty.nothingDueTitle')}</Text>
          <Text style={styles.emptyBody}>{t('home.empty.nothingDueBody')}</Text>
        </View>
      ) : (
        <FlatList
          data={todays}
          keyExtractor={(h) => h.id}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          renderItem={({ item }) => {
            const done = isDoneToday(item);
            const streak = getDisplayStreak(item);
            const time = fmtTime(item.frequency.hour, item.frequency.minute);
            return (
              <View style={styles.row}>
                <Pressable
                  style={styles.rowMain}
                  onPress={() => router.push(`/habit/${item.id}`)}
                  accessibilityRole="button"
                  accessibilityLabel={`${item.name}, ${t('detail.streakDays', { count: streak })}`}
                >
                  <Text style={styles.emoji}>{item.emoji || '✨'}</Text>
                  <View style={styles.rowText}>
                    <Text style={styles.name}>{item.name}</Text>
                    <Text style={styles.meta}>
                      {item.frequency.kind === 'daily' ? t('home.daily') : t('home.weekly')} · {time}
                    </Text>
                  </View>
                  <View style={styles.streakChip}>
                    <Text style={styles.streakText}>{t('home.streak', { count: streak })}</Text>
                  </View>
                </Pressable>
                <Pressable
                  style={[styles.doneBtn, done && styles.doneBtnDone]}
                  onPress={() => markDoneToday(item.id)}
                  disabled={done}
                  accessibilityRole="button"
                  accessibilityState={{ disabled: done }}
                  accessibilityLabel={done ? t('home.done') : t('home.markDone')}
                  accessibilityHint={done ? undefined : t('a11y.hintMarkDone')}
                >
                  <Text style={[styles.doneBtnText, done && styles.doneBtnTextDone]}>
                    {done ? t('home.done') : t('home.markDone')}
                  </Text>
                </Pressable>
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

function makeStyles(c: Palette) {
  return StyleSheet.create({
    container: { flex: 1, paddingHorizontal: 20, paddingTop: 8 },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    // Off-screen text used only to push announcements to assistive tech.
    srOnly: {
      position: 'absolute',
      width: 1,
      height: 1,
      overflow: 'hidden',
      opacity: 0,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 16,
    },
    heading: { ...typography.pageTitle, color: c.text },
    headerActions: { flexDirection: 'row', alignItems: 'center', gap: 16 },
    headerLink: { ...typography.button, color: c.textMuted },
    addBtn: {
      backgroundColor: c.accent,
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 999,
    },
    addBtnText: { ...typography.button, color: c.accentText },
    list: { paddingBottom: 32 },
    separator: { height: 12 },
    row: {
      backgroundColor: c.card,
      borderRadius: 16,
      padding: 14,
    },
    rowMain: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    rowText: { flex: 1 },
    emoji: { fontSize: 28 },
    name: { ...typography.headlineSm, color: c.text },
    meta: { ...typography.meta, color: c.textMuted, marginTop: 2 },
    streakChip: {
      backgroundColor: c.cardAlt,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 999,
    },
    streakText: { ...typography.badge, color: c.streak },
    doneBtn: {
      marginTop: 12,
      backgroundColor: c.accent,
      paddingVertical: 10,
      borderRadius: 12,
      alignItems: 'center',
    },
    doneBtnDone: { backgroundColor: c.cardAlt },
    doneBtnText: { ...typography.button, color: c.accentText },
    doneBtnTextDone: { color: c.success },
    empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
    emptyTitle: { ...typography.headlineSm, color: c.text, marginBottom: 6 },
    emptyBody: { ...typography.body, color: c.textMuted, textAlign: 'center' },
  });
}
