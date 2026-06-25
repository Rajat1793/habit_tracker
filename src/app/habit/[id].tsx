/**
 * Habit detail screen.
 *
 * Deep-link target for both local AND push notifications via the payload
 * `{ screen: '/habit', habitId }` → resolved by `lib/notifications/router`.
 *
 * Handles the "stale notification" case: if the user taps a reminder for a
 * habit that was since deleted, we render a friendly not-found state with a
 * way back home rather than crashing.
 */
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useHabit, useHabits } from '@/hooks/use-habits';
import { getDisplayStreak, isDoneToday } from '@/lib/habits/streak';
import { isWeekly, type Weekday } from '@/lib/habits/types';
import { useThemedStyles } from '@/theme/theme-context';
import { useT } from '@/i18n';
import type { Palette } from '@/theme/colors';

const WEEKDAY_NAMES: Record<Weekday, string> = {
  1: 'Sun',
  2: 'Mon',
  3: 'Tue',
  4: 'Wed',
  5: 'Thu',
  6: 'Fri',
  7: 'Sat',
};

function fmtTime(h: number, m: number) {
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export default function HabitDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const habit = useHabit(id);
  const { markDoneToday, deleteHabit, status } = useHabits();
  const styles = useThemedStyles(makeStyles);
  const t = useT();

  if (status !== 'ready') {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>{t('common.loading')}</Text>
      </View>
    );
  }

  if (!habit) {
    return (
      <View style={styles.center}>
        <Stack.Screen options={{ title: t('detail.notFoundTitle') }} />
        <Text style={styles.h1}>{t('detail.notFoundTitle')}</Text>
        <Text style={styles.muted}>{t('detail.notFoundBody')}</Text>
        <Pressable
          style={styles.primaryBtn}
          onPress={() => router.replace('/')}
          accessibilityRole="button"
          accessibilityLabel={t('detail.backToToday')}
        >
          <Text style={styles.primaryBtnText}>{t('detail.backToToday')}</Text>
        </Pressable>
      </View>
    );
  }

  const done = isDoneToday(habit);
  const streak = getDisplayStreak(habit);
  const time = fmtTime(habit.frequency.hour, habit.frequency.minute);

  const onDelete = () => {
    Alert.alert(
      t('detail.deleteConfirmTitle'),
      t('detail.deleteConfirmBody', { name: habit.name }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            await deleteHabit(habit.id);
            router.replace('/');
          },
        },
      ],
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Stack.Screen options={{ title: habit.name }} />

      <View style={styles.hero}>
        <Text style={styles.emoji} accessibilityElementsHidden importantForAccessibility="no">
          {habit.emoji}
        </Text>
        <Text style={styles.name} accessibilityRole="header">
          {habit.name}
        </Text>
        <View
          style={styles.streakChip}
          accessibilityLiveRegion="polite"
          accessibilityLabel={t('detail.streakDays', { count: streak })}
        >
          <Text style={styles.streakText}>{t('detail.streakDays', { count: streak })}</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardLabel}>{t('detail.schedule')}</Text>
        <Text style={styles.cardValue}>
          {habit.frequency.kind === 'daily'
            ? t('detail.scheduleDaily', { time })
            : t('detail.scheduleWeekly', {
                days: isWeekly(habit.frequency)
                  ? habit.frequency.weekdays.map((w) => WEEKDAY_NAMES[w]).join(', ')
                  : '',
                time,
              })}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardLabel}>{t('detail.lastCompleted')}</Text>
        <Text style={styles.cardValue}>{habit.lastCompletedISO ?? '—'}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardLabel}>{t('detail.scheduledIds')}</Text>
        <Text style={styles.cardMono}>
          {habit.notificationIds.length > 0
            ? habit.notificationIds.join('\n')
            : t('detail.noIds')}
        </Text>
      </View>

      <Pressable
        style={[styles.primaryBtn, done && styles.primaryBtnDone]}
        onPress={() => markDoneToday(habit.id)}
        disabled={done}
        accessibilityRole="button"
        accessibilityState={{ disabled: done }}
        accessibilityLabel={done ? t('detail.doneToday') : t('detail.markToday')}
        accessibilityHint={done ? undefined : t('a11y.hintMarkDone')}
      >
        <Text style={[styles.primaryBtnText, done && styles.primaryBtnTextDone]}>
          {done ? t('detail.doneToday') : t('detail.markToday')}
        </Text>
      </Pressable>

      <Pressable
        style={styles.secondaryBtn}
        onPress={() => router.push({ pathname: '/new', params: { id: habit.id } })}
        accessibilityRole="button"
        accessibilityLabel={t('detail.editBtn')}
      >
        <Text style={styles.secondaryBtnText}>{t('detail.editBtn')}</Text>
      </Pressable>

      <Pressable
        style={styles.dangerBtn}
        onPress={onDelete}
        accessibilityRole="button"
        accessibilityLabel={t('detail.deleteBtn')}
        accessibilityHint={t('a11y.hintDelete')}
      >
        <Text style={styles.dangerBtnText}>{t('detail.deleteBtn')}</Text>
      </Pressable>
    </ScrollView>
  );
}

function makeStyles(c: Palette) {
  return StyleSheet.create({
    container: { padding: 20, paddingBottom: 40 },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
    hero: { alignItems: 'center', marginBottom: 24, marginTop: 8 },
    emoji: { fontSize: 64, marginBottom: 8 },
    name: { color: c.text, fontSize: 24, fontWeight: '700' },
    streakChip: {
      marginTop: 12,
      backgroundColor: c.cardAlt,
      paddingHorizontal: 14,
      paddingVertical: 6,
      borderRadius: 999,
    },
    streakText: { color: c.streak, fontWeight: '600' },
    card: {
      backgroundColor: c.card,
      borderRadius: 14,
      padding: 14,
      marginBottom: 12,
    },
    cardLabel: { color: c.textMuted, fontSize: 12, marginBottom: 6, textTransform: 'uppercase' },
    cardValue: { color: c.text, fontSize: 15 },
    cardMono: { color: c.textMuted, fontSize: 12, fontFamily: 'Courier' },
    h1: { color: c.text, fontSize: 20, fontWeight: '700', marginBottom: 8, textAlign: 'center' },
    muted: { color: c.textMuted, textAlign: 'center', marginBottom: 16 },
    primaryBtn: {
      marginTop: 12,
      backgroundColor: c.accent,
      paddingVertical: 14,
      borderRadius: 12,
      alignItems: 'center',
    },
    primaryBtnDone: { backgroundColor: c.cardAlt },
    primaryBtnText: { color: c.accentText, fontWeight: '700', fontSize: 16 },
    primaryBtnTextDone: { color: c.success },
    secondaryBtn: {
      marginTop: 10,
      backgroundColor: c.cardAlt,
      paddingVertical: 12,
      borderRadius: 12,
      alignItems: 'center',
    },
    secondaryBtnText: { color: c.text, fontWeight: '600' },
    dangerBtn: {
      marginTop: 10,
      paddingVertical: 12,
      borderRadius: 12,
      alignItems: 'center',
    },
    dangerBtnText: { color: c.danger, fontWeight: '600' },
  });
}
