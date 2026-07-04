/**
 * Landing / welcome hero — the "GO FOR BETTER HABITS" screen.
 *
 * A single branded hero on a fixed dark surface (independent of the user's
 * light/dark theme so it always reads like the brand key art): bold stacked
 * headline with a green emphasis line + squiggle underline, motion sparkles,
 * the mascot peeking from the bottom-right, and a cream speech bubble.
 *
 * "Get started" persists the onboarded flag and replaces the route with `/`
 * (the habit home). Shown on first launch via the guard in _layout, and again
 * whenever the user picks Settings → Show onboarding again.
 */
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useCallback, useRef } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useT } from '@/i18n';
import { fonts, typography } from '@/theme/typography';
import { markOnboarded } from '@/lib/onboarding/state';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const BLOB_ASSET = require('../../assets/mascot-blob.png');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const SQUIGGLE_ASSET = require('../../assets/squiggle.png');

// Fixed brand-key-art palette — intentionally NOT theme-aware.
const DARK = '#20231D';
const CREAM = '#F3F2E7';
const GREEN = '#5FBE68';
const MUTED = '#8A8F82';
const BUBBLE_INK = '#20231D';

export default function OnboardingScreen() {
  const router = useRouter();
  const t = useT();

  // Guard so a double-tap can't fire two navigations.
  const startedRef = useRef(false);
  const start = useCallback(async () => {
    if (startedRef.current) return;
    startedRef.current = true;
    await markOnboarded();
    router.replace('/');
  }, [router]);

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom', 'left', 'right']}>
        {/* Skip → straight to the app */}
        <View style={styles.skipRow}>
          <Pressable
            onPress={start}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel={t('onboarding.skip')}
          >
            <Text style={styles.skip}>{t('onboarding.skip')}</Text>
          </Pressable>
        </View>

        {/* Headline */}
        <View style={styles.headline}>
          <Sparkles />
          <Text style={styles.hTop} accessibilityRole="header">
            {t('onboarding.heroTitleTop')}
          </Text>
          <Text style={styles.hEmph}>{t('onboarding.heroTitleEmph')}</Text>
          <Text style={styles.hBottom}>{t('onboarding.heroTitleBottom')}</Text>
          <Image
            source={SQUIGGLE_ASSET}
            style={styles.squiggle}
            resizeMode="contain"
            accessibilityIgnoresInvertColors
          />
        </View>

        {/* Mascot + speech bubble stage */}
        <View style={styles.stage}>
          <Image
            source={BLOB_ASSET}
            style={styles.mascot}
            resizeMode="contain"
            accessibilityIgnoresInvertColors
          />
          <View style={styles.bubble}>
            <Text style={styles.bubbleText}>{t('onboarding.heroBubble')}</Text>
          </View>
        </View>

        {/* CTA */}
        <Pressable
          style={styles.cta}
          onPress={start}
          accessibilityRole="button"
          accessibilityLabel={t('onboarding.done')}
        >
          <Text style={styles.ctaText}>{t('onboarding.done')}</Text>
        </Pressable>
      </SafeAreaView>
    </View>
  );
}

/** Three little green motion ticks fanning off the top-right of the title. */
function Sparkles() {
  return (
    <View style={styles.sparkles} pointerEvents="none">
      <View style={[styles.spark, { transform: [{ rotate: '18deg' }] }]} />
      <View
        style={[
          styles.spark,
          { top: 10, right: 2, transform: [{ rotate: '58deg' }] },
        ]}
      />
      <View
        style={[
          styles.spark,
          { top: 22, right: 14, transform: [{ rotate: '96deg' }] },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: DARK },
  safe: { flex: 1, paddingHorizontal: 28 },

  skipRow: { alignItems: 'flex-end', paddingTop: 4, height: 32 },
  skip: { ...typography.button, color: MUTED },

  headline: { marginTop: 12 },
  sparkles: { position: 'absolute', top: -6, right: 4, width: 40, height: 40 },
  spark: {
    position: 'absolute',
    top: 0,
    right: 12,
    width: 4,
    height: 16,
    borderRadius: 2,
    backgroundColor: GREEN,
  },
  hTop: {
    fontFamily: fonts.headlineBold,
    fontSize: 52,
    lineHeight: 54,
    letterSpacing: -1.5,
    color: CREAM,
    textTransform: 'uppercase',
  },
  hEmph: {
    fontFamily: fonts.headlineBold,
    fontSize: 52,
    lineHeight: 54,
    letterSpacing: -1.5,
    color: GREEN,
    textTransform: 'uppercase',
  },
  hBottom: {
    fontFamily: fonts.headlineBold,
    fontSize: 52,
    lineHeight: 54,
    letterSpacing: -1.5,
    color: CREAM,
    textTransform: 'uppercase',
  },
  squiggle: {
    marginTop: 10,
    width: 140,
    height: 30,
  },

  stage: { flex: 1, position: 'relative' },
  mascot: {
    position: 'absolute',
    right: -70,
    bottom: 4,
    width: 460,
    height: 460,
  },
  bubble: {
    position: 'absolute',
    left: 0,
    bottom: 28,
    maxWidth: 230,
    backgroundColor: CREAM,
    borderRadius: 20,
    borderBottomLeftRadius: 6,
    paddingVertical: 14,
    paddingHorizontal: 18,
  },
  bubbleText: {
    fontFamily: fonts.headlineBold,
    fontSize: 16,
    lineHeight: 20,
    letterSpacing: 0.3,
    color: BUBBLE_INK,
    fontStyle: 'italic',
    textTransform: 'uppercase',
  },

  cta: {
    backgroundColor: GREEN,
    paddingVertical: 17,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 8,
  },
  ctaText: {
    ...typography.buttonLg,
    color: DARK,
    fontFamily: fonts.bodyBold,
  },
});
