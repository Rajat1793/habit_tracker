/**
 * Onboarding carousel.
 *
 * Three slides explaining: streaks, reminders, deep links. Swipeable via
 * a horizontal paged FlatList — no extra dep. On the last slide, "Get
 * started" persists the flag and replaces the route with `/`.
 */
import { useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useT } from '@/i18n';
import { useThemedStyles } from '@/theme/theme-context';
import { typography } from '@/theme/typography';
import type { Palette } from '@/theme/colors';
import { markOnboarded } from '@/lib/onboarding/state';

type Slide = {
  emoji: string;
  titleKey: string;
  bodyKey: string;
};

const SLIDES: Slide[] = [
  { emoji: '🔥', titleKey: 'onboarding.s1Title', bodyKey: 'onboarding.s1Body' },
  { emoji: '🔔', titleKey: 'onboarding.s2Title', bodyKey: 'onboarding.s2Body' },
  { emoji: '👆', titleKey: 'onboarding.s3Title', bodyKey: 'onboarding.s3Body' },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const t = useT();
  const styles = useThemedStyles(makeStyles);
  const { width } = Dimensions.get('window');
  const listRef = useRef<FlatList<Slide>>(null);
  const [page, setPage] = useState(0);

  const isLast = page === SLIDES.length - 1;

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const next = Math.round(e.nativeEvent.contentOffset.x / width);
    if (next !== page) setPage(next);
  };

  const onNext = async () => {
    if (isLast) {
      await markOnboarded();
      router.replace('/');
      return;
    }
    listRef.current?.scrollToIndex({ index: page + 1, animated: true });
  };

  const onSkip = async () => {
    await markOnboarded();
    router.replace('/');
  };

  return (
    <View style={styles.container}>
      <View style={styles.skipRow}>
        <Pressable
          onPress={onSkip}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel={t('onboarding.skip')}
        >
          <Text style={styles.skipText}>{t('onboarding.skip')}</Text>
        </Pressable>
      </View>

      <FlatList
        ref={listRef}
        data={SLIDES}
        keyExtractor={(s) => s.titleKey}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        renderItem={({ item }) => (
          <View style={[styles.slide, { width }]}>
            <Text style={styles.emoji}>{item.emoji}</Text>
            <Text style={styles.title}>{t(item.titleKey)}</Text>
            <Text style={styles.body}>{t(item.bodyKey)}</Text>
          </View>
        )}
      />

      <View style={styles.dotsRow}>
        {SLIDES.map((_, i) => (
          <View key={i} style={[styles.dot, i === page && styles.dotActive]} />
        ))}
      </View>

      <Pressable
        style={styles.cta}
        onPress={onNext}
        accessibilityRole="button"
        accessibilityLabel={isLast ? t('onboarding.done') : t('onboarding.next')}
      >
        <Text style={styles.ctaText}>
          {isLast ? t('onboarding.done') : t('onboarding.next')}
        </Text>
      </Pressable>
    </View>
  );
}

function makeStyles(c: Palette) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.bg, paddingTop: 60, paddingBottom: 32 },
    skipRow: { paddingHorizontal: 20, alignItems: 'flex-end' },
    skipText: { ...typography.button, color: c.textMuted },
    slide: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 32,
    },
    emoji: { fontSize: 88, marginBottom: 32 },
    title: { ...typography.pageTitle, color: c.text, textAlign: 'center', marginBottom: 16 },
    body: {
      color: c.textMuted,
      fontSize: 16,
      textAlign: 'center',
      lineHeight: 24,
      maxWidth: 360,
    },
    dotsRow: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginVertical: 20 },
    dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: c.cardAlt },
    dotActive: { backgroundColor: c.accent, width: 24 },
    cta: {
      marginHorizontal: 20,
      backgroundColor: c.accent,
      paddingVertical: 16,
      borderRadius: 14,
      alignItems: 'center',
    },
    ctaText: { ...typography.buttonLg, color: c.accentText },
  });
}
