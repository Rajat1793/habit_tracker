/**
 * Home (a.k.a. "Today") — landing screen.
 *
 * Structure:
 *   1. Brand row     — flame + "Streaks" wordmark, Settings link, + New CTA.
 *   2. Hero card     — time-of-day greeting, today's date, animated progress
 *                       bar keyed on today's due-vs-done ratio.
 *   3. Stats strip   — three chips: best streak / tracked / done today.
 *   4. Section label — "TODAY" (only shown when there ARE items to list).
 *   5. Habit list    — one row per due-today habit.
 *   6. Empty states  — either "no habits" (prominent CTA) or "nothing due".
 *
 * The confetti + a11y announcement kick when the LAST pending habit for the
 * day flips to done. That behavior + the store hooks are unchanged from the
 * previous implementation; this file was reshaped for hierarchy + polish.
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
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link, useRouter } from 'expo-router';
import { useHabits } from '@/hooks/use-habits';
import { isDueToday } from '@/lib/habits/frequency';
import { getDisplayStreak, isDoneToday } from '@/lib/habits/streak';
import { useThemedStyles } from '@/theme/theme-context';
import { fonts, typography } from '@/theme/typography';
import { useI18n, useT } from '@/i18n';
import { ConfettiBurst, type ConfettiHandle } from '@/components/confetti-burst';
import { LoadingScreen } from '@/components/loading-screen';
import type { Palette } from '@/theme/colors';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const FLAME_ASSET = require('../../assets/adaptive-icon.png');

function fmtTime(h: number, m: number) {
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/** Pick a greeting bucket for the current hour. */
function greetingKey(hour: number): 'morning' | 'afternoon' | 'evening' | 'night' {
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  if (hour < 21) return 'evening';
  return 'night';
}

export default function HomeScreen() {
  const { habits, status, markDoneToday } = useHabits();
  const router = useRouter();
  const t = useT();
  const { locale } = useI18n();
  const styles = useThemedStyles(makeStyles);
  const { width } = useWindowDimensions();

  const todays = useMemo(() => habits.filter((h) => isDueToday(h)), [habits]);
  const doneCount = useMemo(
    () => todays.filter((h) => isDoneToday(h)).length,
    [todays],
  );
  const pending = todays.length - doneCount;

  // Best streak across ALL habits (not just today's), display-adjusted for
  // "should this still count?" (getDisplayStreak returns 0 if too stale).
  const bestStreak = useMemo(
    () => habits.reduce((max, h) => Math.max(max, getDisplayStreak(h)), 0),
    [habits],
  );

  // Progress bar fill — animate on mount + when count changes so the bar
  // "grows" into place instead of snapping.
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
  // Skip the case where the user simply never had anything due.
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

  const progressCaption =
    todays.length === 0
      ? t('home.progressNoneDue')
      : pending === 0
        ? t('home.progressAllDone')
        : t('home.progressDone', { done: doneCount, total: todays.length });

  const barWidth = fillAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const isWide = width >= 720;

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
              source={FLAME_ASSET}
              style={styles.brandFlame}
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

        {/* ── Hero card ─────────────────────────────────────────────── */}
        <View style={[styles.hero, isWide && styles.heroWide]}>
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

        {/* ── Stats strip ───────────────────────────────────────────── */}
        {habits.length > 0 && (
          <View style={styles.stats}>
            <StatChip
              styles={styles}
              label={t('home.stats.bestStreak')}
              value={
                bestStreak > 0
                  ? `🔥 ${t('home.stats.days', { count: bestStreak })}`
                  : '—'
              }
              accent
            />
            <StatChip
              styles={styles}
              label={t('home.stats.tracked')}
              value={String(habits.length)}
            />
            <StatChip
              styles={styles}
              label={t('home.stats.doneToday')}
              value={`${doneCount} / ${todays.length}`}
            />
          </View>
        )}

        {/* ── Body: list or empty state ─────────────────────────────── */}
        {habits.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>✨</Text>
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
            <Text style={styles.emptyEmoji}>🌱</Text>
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
                const time = fmtTime(
                  item.frequency.hour,
                  item.frequency.minute,
                );
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
                        <Text style={styles.meta}>
                          {item.frequency.kind === 'daily'
                            ? t('home.daily')
                            : t('home.weekly')}
                          {' · '}
                          {time}
                        </Text>
                      </View>
                      <View style={styles.streakChip}>
                        <Text style={styles.streakText}>
                          {t('home.streak', { count: streak })}
                        </Text>
                      </View>
                    </Pressable>
                    <Pressable
                      style={[styles.doneBtn, done && styles.doneBtnDone]}
                      onPress={() => markDoneToday(item.id)}
                      disabled={done}
                      accessibilityRole="button"
                      accessibilityState={{ disabled: done }}
                      accessibilityLabel={
                        done ? t('home.done') : t('home.markDone')
                      }
                      accessibilityHint={
                        done ? undefined : t('a11y.hintMarkDone')
                      }
                    >
                      <Text
                        style={[
                          styles.doneBtnText,
                          done && styles.doneBtnTextDone,
                        ]}
                      >
                        {done ? t('home.done') : t('home.markDone')}
                      </Text>
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

// ─── stat chip ───────────────────────────────────────────────────────────────

type StatChipProps = {
  styles: ReturnType<typeof makeStyles>;
  label: string;
  value: string;
  accent?: boolean;
};

function StatChip({ styles, label, value, accent }: StatChipProps) {
  return (
    <View style={[styles.statChip, accent && styles.statChipAccent]}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, accent && styles.statValueAccent]}>
        {value}
      </Text>
    </View>
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
    brandLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    brandFlame: { width: 28, height: 28 },
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

    // Hero
    hero: {
      backgroundColor: c.card,
      borderRadius: 20,
      padding: 20,
      borderWidth: 1,
      borderColor: c.border,
      marginBottom: 14,
    },
    heroWide: { padding: 28 },
    heroGreeting: {
      ...typography.pageTitle,
      color: c.text,
      marginBottom: 2,
    },
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
    progressPct: {
      ...typography.headlineSm,
      color: c.tertiary,
      marginLeft: 8,
    },

    // Stats
    stats: { flexDirection: 'row', gap: 8, marginBottom: 22 },
    statChip: {
      flex: 1,
      backgroundColor: c.card,
      borderRadius: 14,
      paddingVertical: 12,
      paddingHorizontal: 12,
      borderWidth: 1,
      borderColor: c.border,
    },
    statChipAccent: {
      // ~8% coral tint over the card. RRGGBBAA in hex; RN Web accepts it.
      backgroundColor: c.tertiary + '14',
      borderColor: c.tertiary + '55',
    },
    statLabel: {
      ...typography.badge,
      color: c.textMuted,
      marginBottom: 4,
    },
    statValue: {
      fontFamily: fonts.headlineSemiBold,
      fontSize: 16,
      lineHeight: 20,
      color: c.text,
    },
    statValueAccent: { color: c.tertiary },

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
      borderRadius: 16,
      padding: 14,
      borderWidth: 1,
      borderColor: c.border,
    },
    rowDone: {
      backgroundColor: c.cardAlt,
      borderColor: 'transparent',
    },
    rowMain: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    emojiWrap: {
      width: 44,
      height: 44,
      borderRadius: 12,
      backgroundColor: c.cardAlt,
      alignItems: 'center',
      justifyContent: 'center',
    },
    emojiWrapDone: { backgroundColor: c.card },
    rowText: { flex: 1 },
    emoji: { fontSize: 24 },
    name: { ...typography.headlineSm, color: c.text },
    nameDone: { color: c.textMuted },
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
      paddingVertical: 12,
      borderRadius: 12,
      alignItems: 'center',
    },
    doneBtnDone: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: c.border,
    },
    doneBtnText: { ...typography.button, color: c.accentText },
    doneBtnTextDone: { color: c.success },

    // Empty state
    empty: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 24,
      paddingVertical: 48,
    },
    emptyEmoji: { fontSize: 56, marginBottom: 16 },
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
