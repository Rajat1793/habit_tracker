/**
 * Themed full-screen loading indicator.
 *
 * Rendered while fonts or store data are loading. Uses the app's flame
 * icon + wordmark on the same dark surface as the native splash so the
 * hand-off from OS splash → JS init reads as one continuous frame with no
 * flash of unstyled content.
 *
 * `variant`:
 *   - "splash" (default): full-bleed dark surface with pulsing flame +
 *     wordmark. Safe to render OUTSIDE `<ThemeProvider>` (used during
 *     root font load) — uses no theme hooks and only fixed brand colors.
 *   - "inline": current-theme background, small centered flame + spinner.
 *     Must be rendered inside `<ThemeProvider>`.
 */
import { useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useColors, useThemedStyles } from '@/theme/theme-context';
import { fonts, typography } from '@/theme/typography';
import type { Palette } from '@/theme/colors';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const MASCOT_ASSET = require('../../assets/adaptive-icon.png');

type LoadingScreenProps = {
  variant?: 'splash' | 'inline';
  caption?: string;
};

// Shared pulse animation for either variant. Extracted so we don't repeat
// the boilerplate in two components.
function usePulse() {
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1100,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 1100,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);
  return {
    scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1.04] }),
    opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.75, 1] }),
  };
}

export function LoadingScreen({
  variant = 'splash',
  caption,
}: LoadingScreenProps) {
  if (variant === 'inline') return <InlineLoader caption={caption} />;
  return <SplashLoader caption={caption} />;
}

// ─── splash variant ──────────────────────────────────────────────────────────
// Fixed brand colors — matches the native OS splash exactly regardless of
// the user's light/dark preference. Uses NO theme hooks so it can render
// outside `<ThemeProvider>` (e.g. during root font load).

const SPLASH_CREAM = '#F1F0E4';
const SPLASH_INK = '#16251A';
const SPLASH_MUTED = '#5D6B57';

function SplashLoader({ caption }: { caption?: string }) {
  const { scale, opacity } = usePulse();
  return (
    <View style={splashStyles.root}>
      <View style={splashStyles.center}>
        <Animated.Image
          source={MASCOT_ASSET}
          style={[splashStyles.flame, { transform: [{ scale }], opacity }]}
          resizeMode="contain"
          accessibilityIgnoresInvertColors
        />
        <Text style={splashStyles.wordmark}>Streaks</Text>
        {caption ? <Text style={splashStyles.caption}>{caption}</Text> : null}
      </View>
    </View>
  );
}

const splashStyles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: SPLASH_CREAM,
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: { alignItems: 'center' },
  flame: { width: 132, height: 132 },
  wordmark: {
    // Font may not be loaded yet when splash renders — the system fallback
    // is fine because the cream surface + mascot already carry the brand.
    fontFamily: fonts.headlineBold,
    fontSize: 32,
    color: SPLASH_INK,
    marginTop: 18,
    letterSpacing: -0.5,
  },
  caption: {
    fontFamily: fonts.bodyRegular,
    fontSize: 14,
    color: SPLASH_MUTED,
    marginTop: 8,
  },
});

// ─── inline variant ──────────────────────────────────────────────────────────

function InlineLoader({ caption }: { caption?: string }) {
  const styles = useThemedStyles(makeInlineStyles);
  const colors = useColors();
  const { scale, opacity } = usePulse();
  return (
    <View style={styles.root}>
      <Animated.Image
        source={MASCOT_ASSET}
        style={[styles.flame, { transform: [{ scale }], opacity }]}
        resizeMode="contain"
        accessibilityIgnoresInvertColors
      />
      <ActivityIndicator color={colors.tertiary} style={{ marginTop: 12 }} />
      {caption ? <Text style={styles.caption}>{caption}</Text> : null}
    </View>
  );
}

function makeInlineStyles(c: Palette) {
  return StyleSheet.create({
    root: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
      backgroundColor: c.bg,
    },
    flame: { width: 72, height: 72 },
    caption: {
      ...typography.body,
      color: c.textMuted,
      marginTop: 12,
    },
  });
}
