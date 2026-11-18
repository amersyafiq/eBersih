import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';

export function PingDot() {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.75);

  useEffect(() => {
    scale.value = withRepeat(
      withTiming(2.2, { duration: 1000, easing: Easing.out(Easing.ease) }),
      -1,
      false
    );
    opacity.value = withRepeat(
      withTiming(0, { duration: 1000, easing: Easing.out(Easing.ease) }),
      -1,
      false
    );
  }, []);

  const animatedRingStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <View className="relative mr-1 h-2 w-2 items-center justify-center">
      <Animated.View
        style={animatedRingStyle}
        className="absolute h-2 w-2 rounded-full bg-emerald-500"
      />
      <View className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
    </View>
  );
}
