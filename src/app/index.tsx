/**
 * Home (a.k.a. "Today") — landing screen.
 *
 * Reworked toward the friendly "Streaks"-style habit tracker:
 *   1. Brand row     — mascot + "Streaks" wordmark, Settings, + New.
 *   2. Greeting hero — time-of-day greeting, today's date, progress bar.
 *   3. Week strip    — current Mon–Sun week, today in an accent pill.
 *   4. Tip bubble    — a contextual speech-bubble nudge.
 *   5. Habit list    — status rows (To do / Done) with a quick check toggle.
 *   6. Empty states  — mascot + copy + CTA.
 *
 * Confetti + a11y announcement fire when the LAST pending habit for the day
 * flips to done. Store hooks + selectors are unchanged from before.
 */
import { useEffect, useMemo, useRef } from 'react';
import {
  Animated,
  FlatList,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link, useRouter } from 'expo-router';
import { useHabits } from '@/hooks/use-habits';
import { useClockFormat } from '@/hooks/use-clock-format';
import { isDueToday } from '@/lib/habits/frequency';
import { getDisplayStreak, isDoneToday } from '@/lib/habits/streak';
import { formatTime } from '@/lib/time';
import { useThemedStyles } from '@/theme/theme-context';
import { fonts, typography } from '@/theme/typography';
import { useI18n, useT } from '@/i18n';
import { ConfettiBurst, type ConfettiHandle } from '@/components/confetti-burst';
import { LoadingScreen } from '@/components/loading-screen';
import type { Palette } from '@/theme/colors';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const MASCOT_ASSET = require('../../assets/adaptive-icon.png');

/** Pick a greeting bucket for the current hour. */
function greetingKey(hour: number): 'morning' | 'afternoon' | 'evening' | 'night' {
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  if (hour < 21) return 'evening';
  return 'night';
}

/** The 7 dates of the current week, starting Monday. */
function currentWeek(now: Date): Date[] {
  const mondayOffset = (now.getDay() + 6) % 7; // 0 = Monday
  const monday = new Date(now);
  monday.setDate(now.getDate() - mondayOffset);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export default function HomeScreen() {
  const { habits, status, markDoneToday, undoDoneToday } = useHabits();
  const router = useRouter();
  const t = useT();
  const { locale } = useI18n();
  const { format: clockFormat } = useClockFormat();
  const styles = useThemedStyles(makeStyles);

  const todays = useMemo(() => habits.filter((h) => isDueToday(h)), [habits]);
  const doneCount = useMemo(
    () => todays.filter((h) => isDoneToday(h)).length,
    [todays],
  );
  const pending = todays.length - doneCount;

  // Progress bar fill — animate on mount + when count changes.
  const fillProgress = todays.length === 0 ? 1 : doneCount / todays.length;
  const fillAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(fillAnim, {
      toValue: fillProgress,
      duration: 550,
      useNativeDriver: false, // width interpolation is a layout prop
    }).start();
  }, [fillProgress, fillAnim]);

  // Fire confetti the moment the last pending habit becomes done.
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
    return <LoadingScreen variant="inline" caption={t('common.loading')} />;
  }

  const now = new Date();
  const greetLabel = t(`home.greeting.${greetingKey(now.getHours())}`);
  const dateLabel = new Intl.DateTimeFormat(locale, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  }).format(now);

  const week = currentWeek(now);
  const dowFmt = new Intl.DateTimeFormat(locale, { weekday: 'short' });

  const progressCaption =
    todays.length === 0
      ? t('home.progressNoneDue')
      : pending === 0
        ? t('home.progressAllDone')
        : t('home.progressDone', { done: doneCount, total: todays.length });

  // Contextual tip for the speech bubble.
  const tipText =
    todays.length > 0 && pending === 0
      ? t('home.tip.allDone')
      : doneCount > 0
        ? t('home.tip.progress')
        : t('home.tip.start');

  const barWidth = fillAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
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

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Brand row ─────────────────────────────────────────────── */}
        <View style={styles.brandRow}>
          <View style={styles.brandLeft}>
            <Image
              source={MASCOT_ASSET}
              style={styles.brandMascot}
              resizeMode="contain"
              accessibilityIgnoresInvertColors
            />
            <Text style={styles.wordmark} accessibilityRole="header">
              Streaks
            </Text>
          </View>
          <View style={styles.brandRight}>
            <Link href="/settings" asChild>
              <Pressable
                hitSlop={12}
                accessibilityRole="link"
                accessibilityLabel={t('home.settings')}
              >
                <Text style={styles.headerLink}>{t('home.settings')}</Text>
              </Pressable>
            </Link>
            <Link href="/new" asChild>
              <Pressable
                style={styles.addBtn}
                accessibilityRole="link"
                accessibilityLabel={t('home.newHabit')}
              >
                <Text style={styles.addBtnText}>{t('home.newHabit')}</Text>
              </Pressable>
            </Link>
          </View>
        </View>

        {/* ── Greeting hero ─────────────────────────────────────────── */}
        <View style={styles.hero}>
          <Text style={styles.heroGreeting}>{greetLabel}</Text>
          <Text style={styles.heroDate}>{dateLabel}</Text>

          <View style={styles.progressTrack} accessibilityRole="progressbar">
            <Animated.View style={[styles.progressFill, { width: barWidth }]} />
          </View>
          <View style={styles.progressRow}>
            <Text style={styles.progressCaption}>{progressCaption}</Text>
            {todays.length > 0 && (
              <Text style={styles.progressPct}>
                {Math.round(fillProgress * 100)}%
              </Text>
            )}
          </View>
        </View>

        {/* ── Week strip ────────────────────────────────────────────── */}
        <View style={styles.week} accessibilityLabel={t('home.thisWeek')}>
          {week.map((d) => {
            const today = isSameDay(d, now);
            const dow = dowFmt.format(d).slice(0, 2);
            return (
              <View key={d.toISOString()} style={styles.weekCell}>
                <Text style={styles.weekDow}>{dow}</Text>
                <View style={[styles.weekNum, today && styles.weekNumToday]}>
                  <Text
                    style={[styles.weekNumText, today && styles.weekNumTextToday]}
                  >
                    {d.getDate()}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* ── Tip speech bubble ─────────────────────────────────────── */}
        {habits.length > 0 && (
          <View style={styles.tip}>
            <View style={styles.tipBadge}>
              <Text style={styles.tipBadgeText}>{t('home.tip.badge')}</Text>
            </View>
            <Text style={styles.tipText}>{tipText}</Text>
          </View>
        )}

        {/* ── Body: list or empty state ─────────────────────────────── */}
        {habits.length === 0 ? (
          <View style={styles.empty}>
            <Image
              source={MASCOT_ASSET}
              style={styles.emptyMascot}
              resizeMode="contain"
              accessibilityIgnoresInvertColors
            />
            <Text style={styles.emptyTitle}>{t('home.empty.noHabitsTitle')}</Text>
            <Text style={styles.emptyBody}>{t('home.empty.noHabitsBody')}</Text>
            <Link href="/new" asChild>
              <Pressable
                style={styles.emptyCta}
                accessibilityRole="link"
                accessibilityLabel={t('home.empty.noHabitsCta')}
              >
                <Text style={styles.emptyCtaText}>
                  {t('home.empty.noHabitsCta')}
                </Text>
              </Pressable>
            </Link>
          </View>
        ) : todays.length === 0 ? (
          <View style={styles.empty}>
            <Image
              source={MASCOT_ASSET}
              style={styles.emptyMascot}
              resizeMode="contain"
              accessibilityIgnoresInvertColors
            />
            <Text style={styles.emptyTitle}>
              {t('home.empty.nothingDueTitle')}
            </Text>
            <Text style={styles.emptyBody}>{t('home.empty.nothingDueBody')}</Text>
          </View>
        ) : (
          <>
            <Text style={styles.sectionLabel}>{t('home.sectionToday')}</Text>
            <FlatList
              scrollEnabled={false}
              data={todays}
              keyExtractor={(h) => h.id}
              contentContainerStyle={styles.list}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
              renderItem={({ item }) => {
                const done = isDoneToday(item);
                const streak = getDisplayStreak(item);
                const time = formatTime(
                  item.frequency.hour,
                  item.frequency.minute,
                  clockFormat,
                );
                const freq =
                  item.frequency.kind === 'daily'
                    ? t('home.daily')
                    : t('home.weekly');
                return (
                  <View style={[styles.row, done && styles.rowDone]}>
                    <Pressable
                      style={styles.rowMain}
                      onPress={() => router.push(`/habit/${item.id}`)}
                      accessibilityRole="button"
                      accessibilityLabel={`${item.name}, ${t('detail.streakDays', { count: streak })}`}
                    >
                      <View
                        style={[styles.emojiWrap, done && styles.emojiWrapDone]}
                      >
                        <Text style={styles.emoji}>{item.emoji || '✨'}</Text>
                      </View>
                      <View style={styles.rowText}>
                        <Text
                          style={[styles.name, done && styles.nameDone]}
                          numberOfLines={1}
                        >
                          {item.name}
                        </Text>
                        <View style={styles.metaRow}>
                          <Text
                            style={[
                              styles.statusPill,
                              done ? styles.statusDone : styles.statusTodo,
                            ]}
                          >
                            {done ? t('home.statusDone') : t('home.statusTodo')}
                          </Text>
                          <Text style={styles.meta}>
                            {' · '}
                            {freq} · {time}
                          </Text>
                        </View>
                      </View>
                    </Pressable>

                    {streak > 0 && (
                      <View style={styles.streakChip}>
                        <Text style={styles.streakText}>
                          {t('home.streak', { count: streak })}
                        </Text>
                      </View>
                    )}

                    <Pressable
                      style={[styles.check, done && styles.checkDone]}
                      onPress={() =>
                        done ? undoDoneToday(item.id) : markDoneToday(item.id)
                      }
                      accessibilityRole="button"
                      accessibilityState={{ checked: done }}
                      accessibilityLabel={
                        done ? t('home.done') : t('home.markDone')
                      }
                      accessibilityHint={
                        done ? t('a11y.hintUndoDone') : t('a11y.hintMarkDone')
                      }
                    >
                      {done && <Text style={styles.checkMark}>✓</Text>}
                    </Pressable>
                  </View>
                );
              }}
            />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── styles ──────────────────────────────────────────────────────────────────

function makeStyles(c: Palette) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.bg },
    scroll: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40 },

    // Off-screen text used only to push announcements to assistive tech.
    srOnly: {
      position: 'absolute',
      width: 1,
      height: 1,
      overflow: 'hidden',
      opacity: 0,
    },

    // Brand row (top)
    brandRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 20,
    },
    brandLeft: { flexDirection: 'row', alignItems: 'center', gap: 9 },
    brandMascot: { width: 30, height: 30 },
    wordmark: {
      fontFamily: fonts.headlineBold,
      fontSize: 22,
      letterSpacing: -0.4,
      color: c.text,
    },
    brandRight: { flexDirection: 'row', alignItems: 'center', gap: 16 },
    headerLink: { ...typography.button, color: c.textMuted },
    addBtn: {
      backgroundColor: c.accent,
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 999,
    },
    addBtnText: { ...typography.button, color: c.accentText },

    // Greeting hero
    hero: {
      backgroundColor: c.card,
      borderRadius: 22,
      padding: 20,
      borderWidth: 1,
      borderColor: c.border,
      marginBottom: 14,
    },
    heroGreeting: { ...typography.pageTitle, color: c.text, marginBottom: 2 },
    heroDate: {
      ...typography.body,
      color: c.textMuted,
      marginBottom: 18,
      textTransform: 'capitalize',
    },
    progressTrack: {
      height: 10,
      borderRadius: 999,
      backgroundColor: c.cardAlt,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      backgroundColor: c.tertiary,
      borderRadius: 999,
    },
    progressRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 10,
    },
    progressCaption: { ...typography.bodyMedium, color: c.text, flex: 1 },
    progressPct: { ...typography.headlineSm, color: c.tertiary, marginLeft: 8 },

    // Week strip
    week: {
      flexDirection: 'row',
      backgroundColor: c.card,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: c.border,
      paddingVertical: 12,
      paddingHorizontal: 6,
      marginBottom: 14,
    },
    weekCell: { flex: 1, alignItems: 'center', gap: 8 },
    weekDow: {
      ...typography.badge,
      color: c.textMuted,
    },
    weekNum: {
      width: 34,
      height: 34,
      borderRadius: 17,
      alignItems: 'center',
      justifyContent: 'center',
    },
    weekNumToday: { backgroundColor: c.accent },
    weekNumText: {
      fontFamily: fonts.headlineSemiBold,
      fontSize: 14,
      color: c.text,
    },
    weekNumTextToday: { color: c.accentText },

    // Tip speech bubble
    tip: {
      backgroundColor: c.peach,
      borderRadius: 16,
      borderTopLeftRadius: 4,
      padding: 14,
      marginBottom: 22,
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 10,
    },
    tipBadge: {
      backgroundColor: c.accent,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 999,
    },
    tipBadgeText: { ...typography.badge, color: c.accentText },
    tipText: {
      ...typography.bodyMedium,
      color: '#5A4A2A',
      flex: 1,
      fontStyle: 'italic',
    },

    // Section label
    sectionLabel: {
      ...typography.sectionLabel,
      color: c.textMuted,
      marginBottom: 10,
    },

    // Habit rows
    list: { paddingBottom: 8 },
    separator: { height: 10 },
    row: {
      backgroundColor: c.card,
      borderRadius: 18,
      padding: 12,
      borderWidth: 1,
      borderColor: c.border,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    rowDone: { backgroundColor: c.cardAlt, borderColor: 'transparent' },
    rowMain: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
    emojiWrap: {
      width: 46,
      height: 46,
      borderRadius: 14,
      backgroundColor: c.cardAlt,
      alignItems: 'center',
      justifyContent: 'center',
    },
    emojiWrapDone: { backgroundColor: c.card },
    rowText: { flex: 1 },
    emoji: { fontSize: 24 },
    name: { ...typography.headlineSm, color: c.text },
    nameDone: { color: c.textMuted, textDecorationLine: 'line-through' },
    metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 3 },
    statusPill: {
      ...typography.badge,
      overflow: 'hidden',
    },
    statusTodo: { color: c.textMuted },
    statusDone: { color: c.success },
    meta: { ...typography.meta, color: c.textMuted },
    streakChip: {
      backgroundColor: c.cardAlt,
      paddingHorizontal: 9,
      paddingVertical: 4,
      borderRadius: 999,
    },
    streakText: { ...typography.badge, color: c.streak },

    // Quick-complete check toggle
    check: {
      width: 40,
      height: 40,
      borderRadius: 20,
      borderWidth: 2,
      borderColor: c.outline,
      alignItems: 'center',
      justifyContent: 'center',
    },
    checkDone: { backgroundColor: c.accent, borderColor: c.accent },
    checkMark: {
      color: c.accentText,
      fontSize: 18,
      fontFamily: fonts.bodyBold,
      lineHeight: 20,
    },

    // Empty states
    empty: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 24,
      paddingVertical: 36,
    },
    emptyMascot: { width: 96, height: 96, marginBottom: 18 },
    emptyTitle: {
      ...typography.headlineMd,
      color: c.text,
      marginBottom: 6,
      textAlign: 'center',
    },
    emptyBody: {
      ...typography.body,
      color: c.textMuted,
      textAlign: 'center',
      maxWidth: 320,
    },
    emptyCta: {
      marginTop: 20,
      backgroundColor: c.tertiary,
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 999,
    },
    emptyCtaText: { ...typography.buttonLg, color: c.onTertiary },
  });
}
