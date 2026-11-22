import { useRouter } from 'expo-router';
import React, { useCallback } from 'react';
import { useWindowDimensions, View } from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useVideoPlayer, VideoView } from 'expo-video';
import { LinearGradient } from 'expo-linear-gradient';
import { withUniwind } from 'uniwind';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Text } from 'panelui-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withTiming,
    interpolate,
    Extrapolation,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

const StyledLinearGradient = withUniwind(LinearGradient);
const StyledVideoView = withUniwind(VideoView);

const videoSource = require('@/assets/video/bg_vid.mp4');
const ebersihLogo = require('@/assets/icons/eBERSIH_logo.svg');
const ebersihText = require('@/assets/icons/eBERSIH_text.svg');

export default function OnboardingScreen() {
    const router = useRouter();
    const { height } = useWindowDimensions();
    const insets = useSafeAreaInsets();

    // Match your original h-5/7 starting height, and collapse down to 22% on swipe-up
    const INITIAL_TOP_HEIGHT = height * (5 / 7);
    const COLLAPSED_TOP_HEIGHT = height * 0.22;
    const SWIPE_DISTANCE = INITIAL_TOP_HEIGHT - COLLAPSED_TOP_HEIGHT;

    const topHeight = useSharedValue(INITIAL_TOP_HEIGHT);
    const hasNavigated = useSharedValue(false);

    const player = useVideoPlayer(videoSource, (player) => {
        player.loop = true;
        player.muted = true;
        player.play();
    });

    const navigateToSignIn = useCallback(() => {
        router.replace('/sign-in');
    }, [router]);

    const panGesture = Gesture.Pan()
        .onUpdate((event) => {
            if (hasNavigated.value) return;

            // event.translationY is negative when swiping UP
            const nextHeight = INITIAL_TOP_HEIGHT + event.translationY;

            // Clamp between collapsed height and initial height
            topHeight.value = Math.max(
                COLLAPSED_TOP_HEIGHT,
                Math.min(INITIAL_TOP_HEIGHT, nextHeight)
            );
        })
        .onEnd((event) => {
            if (hasNavigated.value) return;

            // Trigger redirect if user swiped up > 100px OR flicked fast upward
            const swipedEnough = event.translationY < -100 || event.velocityY < -500;

            if (swipedEnough) {
                hasNavigated.value = true;
                topHeight.value = withTiming(
                    COLLAPSED_TOP_HEIGHT,
                    { duration: 280 },
                    (finished) => {
                        if (finished) {
                            scheduleOnRN(navigateToSignIn);
                        }
                    }
                );
            } else {
                // Snap back smoothly if they didn't swipe far enough
                topHeight.value = withSpring(INITIAL_TOP_HEIGHT, {
                    damping: 18,
                    stiffness: 180,
                });
            }
        });

    // 1. Animates top view height (bottom flex-1 view grows automatically)
    const topAnimatedStyle = useAnimatedStyle(() => ({
        height: topHeight.value,
    }));

    return (
        <GestureDetector gesture={panGesture}>
            <View className="flex-1 bg-secondary">
                {/* Top Hero Banner */}
                <Animated.View
                    style={topAnimatedStyle}
                    className="w-full overflow-hidden rounded-bl-[3rem] rounded-br-[10rem]"
                >
                    <StyledVideoView
                        player={player}
                        className="absolute inset-0"
                        contentFit="cover"
                        nativeControls={false}
                    />
                    <StyledLinearGradient
                        colors={['#5750f1', 'transparent']}
                        start={{ x: 0.5, y: 0 }}
                        end={{ x: 0.5, y: 1 }}
                        className="absolute inset-0"
                        pointerEvents="none"
                    />

                    <Animated.View
                        className="items-center justify-center mt-28"
                    >
                        <Image
                            source={ebersihLogo}
                            style={{ width: 96, height: 96 }}
                            contentFit="contain"
                        />
                        <Image
                            source={ebersihText}
                            style={{ width: 192, height: 48 }}
                            contentFit="contain"
                        />
                    </Animated.View>
                </Animated.View>

                {/* Bottom Footer */}
                <View
                    className="flex-1 w-full justify-between items-center pt-10 px-10 gap-0"
                    style={{ paddingBottom: insets.bottom + 24 }}
                >
                    <View className="flex-1 justify-center items-center">
                        <Text className="text-3xl font-medium text-center w-3/4" style={{ marginBottom: 0 }}>
                            Cleaning Management{'\n'}System
                        </Text>
                    </View>

                    {/* Subtle Swipe-Up Hint */}
                    <View className="items-center gap-2 animate-flicker">
                        <View className="w-10 h-1.5 rounded-full bg-foreground/25" />
                        <Text className="text-sm font-medium text-muted-foreground">
                            Swipe up to get started
                        </Text>
                    </View>
                </View>
            </View>
        </GestureDetector>
    );
}
