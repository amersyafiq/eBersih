// src/app/(auth)/onboarding.tsx
import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import {
  Button,
  Card,
  Badge,
  ChevronRightIcon,
} from 'panelui-native';

interface OnboardingSlide {
  id: string;
  badge: string;
  title: string;
  description: string;
  highlight: string;
}

const SLIDES: OnboardingSlide[] = [
  {
    id: 'schedule',
    badge: 'Smart Scheduling',
    title: 'Your Daily Campus Tasks, Optimized',
    description:
      'View your assigned spaces grouped clearly by building, floor, and time slot—tailored for Pekerja Am, Operator Mesin, and Penyelia.',
    highlight: 'Auto-refreshes when your shift starts',
  },
  {
    id: 'qr-scan',
    badge: 'QR Verification',
    title: 'Scan Room QR to Start & Complete',
    description:
      'Point your camera at the space QR code on the door to log start and completion timestamps in one tap.',
    highlight: 'Fast camera scan with torch support',
  },
  {
    id: 'quality-leave',
    badge: 'Attendance & Ratings',
    title: 'Clock In, Apply Leave & Track Quality',
    description:
      'Manage daily clock-in/out, submit medical or annual leave requests, and submit 1–3 cleanliness inspections seamlessly.',
    highlight: 'All workforce tools in one place',
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions(); // Responsive width (handles rotation & foldables)
  const flatListRef = useRef<FlatList<OnboardingSlide>>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const isLastSlide = activeIndex === SLIDES.length - 1;

  // Track which page is visible as the user swipes (like ViewPager2.OnPageChangeCallback)
  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: any[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index !== null) {
        setActiveIndex(viewableItems[0].index);
      }
    }
  ).current;

  const finishOnboarding = async () => {
    await SecureStore.setItemAsync('ebersih_onboarded', 'true');
    // .replace() pops Onboarding off the back stack (like finish() in Android)
    router.replace('/(auth)/sign-in');
  };

  const handleNext = () => {
    if (isLastSlide) {
      finishOnboarding();
    } else {
      flatListRef.current?.scrollToIndex({
        index: activeIndex + 1,
        animated: true,
      });
    }
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-background">
      {/* Top Bar: Brand + Skip Action */}
      <View className="flex-row items-center justify-between px-6 pt-2 pb-4">
        <Text className="text-lg font-bold text-foreground">eBersih</Text>

        {!isLastSlide && (
          <Button variant="ghost" onPress={finishOnboarding}>
            Skip
          </Button>
        )}
      </View>

      {/* 2. Paged Horizontal FlatList (Expo's ViewPager2 equivalent) */}
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        bounces={false}
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ viewAreaCoveragePercentThreshold: 50 }}
        renderItem={({ item }) => (
          <View
            style={{ width }}
            className="flex-1 justify-center px-6"
          >
            {/* Illustration / Hero Placeholder Surface */}
            <View className="mb-8 h-56 items-center justify-center rounded-3xl bg-muted/40 border border-border">
              <Badge>{item.badge}</Badge>
              <Text className="mt-3 text-sm text-muted-foreground">
                {item.highlight}
              </Text>
            </View>

            {/* PanelUI Compound Card */}
            <Card>
              <Card.Header>
                <Card.Title>{item.title}</Card.Title>
                <Card.Description>{item.description}</Card.Description>
              </Card.Header>
            </Card>
          </View>
        )}
      />

      {/* 3. Pinned Bottom Controls: Stepper Dots + Primary CTA */}
      <View className="px-6 pt-4 pb-6 gap-6">
        {/* Pagination Indicators */}
        <View className="flex-row items-center justify-center gap-2">
          {SLIDES.map((slide, index) => (
            <View
              key={slide.id}
              className={`h-2 rounded-full ${
                index === activeIndex
                  ? 'w-8 bg-primary'
                  : 'w-2 bg-muted-foreground/30'
              }`}
            />
          ))}
        </View>

        {/* PanelUI Button with UI-thread press feedback */}
        <Button
          fullWidth
          onPress={handleNext}
          endContent={!isLastSlide ? <ChevronRightIcon size={16} /> : undefined}
        >
          {isLastSlide ? 'Get Started' : 'Next'}
        </Button>
      </View>
    </SafeAreaView>
  );
}
