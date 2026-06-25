/**
 * Tiny pure-JS confetti burst.
 *
 * No native dependency — uses `Animated.View` so it works in Expo Go and in
 * any build without extra config. Designed for one-shot celebrations
 * (e.g. last due habit completed), not continuous effects.
 *
 * Call `fire()` via a ref. The component renders nothing between bursts.
 */
import {
  forwardRef,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  StyleSheet,
  View,
} from 'react-native';

export type ConfettiHandle = { fire: () => void };

type Piece = {
  key: number;
  x: number;
  size: number;
  rotateStart: number;
  rotateEnd: number;
  color: string;
  delay: number;
  drift: number;
  duration: number;
};

const COLORS = ['#7C5CFF', '#FFB85C', '#5CFFA1', '#FF5C8A', '#5CCFFF', '#FFE15C'];

function buildPieces(count: number, width: number): Piece[] {
  const pieces: Piece[] = [];
  for (let i = 0; i < count; i++) {
    pieces.push({
      key: i,
      x: Math.random() * width,
      size: 6 + Math.random() * 8,
      rotateStart: Math.random() * 360,
      rotateEnd: (Math.random() - 0.5) * 720,
      color: COLORS[i % COLORS.length],
      delay: Math.random() * 200,
      drift: (Math.random() - 0.5) * 120,
      duration: 1400 + Math.random() * 1100,
    });
  }
  return pieces;
}

export const ConfettiBurst = forwardRef<ConfettiHandle, { count?: number }>(
  function ConfettiBurst({ count = 60 }, ref) {
    const [active, setActive] = useState(false);
    const progress = useRef(new Animated.Value(0)).current;
    const width = Dimensions.get('window').width;
    const height = Dimensions.get('window').height;
    const pieces = useMemo(() => buildPieces(count, width), [count, width]);

    useImperativeHandle(ref, () => ({
      fire() {
        progress.setValue(0);
        setActive(true);
        Animated.timing(progress, {
          toValue: 1,
          duration: 2400,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }).start(() => setActive(false));
      },
    }));

    if (!active) return null;

    return (
      <View pointerEvents="none" style={[StyleSheet.absoluteFill, { overflow: 'hidden' }]}>
        {pieces.map((p) => {
          const translateY = progress.interpolate({
            inputRange: [0, 1],
            outputRange: [-40, height + 40],
          });
          const translateX = progress.interpolate({
            inputRange: [0, 1],
            outputRange: [p.x, p.x + p.drift],
          });
          const rotate = progress.interpolate({
            inputRange: [0, 1],
            outputRange: [`${p.rotateStart}deg`, `${p.rotateStart + p.rotateEnd}deg`],
          });
          const opacity = progress.interpolate({
            inputRange: [0, 0.85, 1],
            outputRange: [1, 1, 0],
          });
          return (
            <Animated.View
              key={p.key}
              style={{
                position: 'absolute',
                width: p.size,
                height: p.size * 0.4,
                backgroundColor: p.color,
                borderRadius: 2,
                opacity,
                transform: [{ translateX }, { translateY }, { rotate }],
              }}
            />
          );
        })}
      </View>
    );
  },
);
