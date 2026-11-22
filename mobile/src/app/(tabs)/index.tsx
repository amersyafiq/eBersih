import { ScheduleCarousel } from '@/src/components/home/home-carousel';
import { HomeStats } from '@/src/components/home/home-grid';
import { ShiftStatusPill } from '@/src/components/home/home-time';
import { SoftBackground } from '@/src/components/ui/soft-background';
import { useCurrentUser } from '@/src/lib/api/auth';
import { useRouter } from 'expo-router';
import { Avatar, Badge, BookmarkIcon, Button, Card, Carousel, Drawer, GridItem, Item, MenuIcon, Separator, Text } from 'panelui-native';
import React from 'react';
import { ScrollView, TouchableNativeFeedback, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCSSVariable } from 'uniwind';

const TXT = 'text-gray-900 dark:text-gray-100';
const ebersihLogo = require('@/assets/icons/eBERSIH_logo.svg');

export default function HomeScreen() {
    const [tint, mute, background] = useCSSVariable([
        '--color-primary',
        '--color-muted-foreground',
        '--color-card',
    ]) as (string | undefined)[];

    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { data: user } = useCurrentUser();

    const firstName = user?.Fullname?.split(' ')[0];

    return (
        <SoftBackground className="flex-1" style={{ paddingTop: insets.top }}>
            <ScrollView
                className="flex-1"
                contentContainerStyle={{ paddingTop: 16, paddingBottom: 40, gap: 16 }}
            >
                <View className="flex-row items-center justify-between px-5">
                    <View className="flex-1 flex-row gap-1">
                        <Drawer>
                            <Drawer.Trigger>
                                <Button variant="outline" className="shadow-none border-border rounded-full h-14 min-w-14 w-fit px-4.5" size="lg"><MenuIcon size={20} /></Button>
                            </Drawer.Trigger>
                            <Drawer.Content>
                                <Drawer.Header title="Workspace" description="Switch project or manage members." />
                                <Drawer.Body>
                                    {['Projects', 'Members', 'Billing'].map((label) => (
                                        <Item key={label}>
                                            <Item.Content>
                                                <Item.Title>{label}</Item.Title>
                                            </Item.Content>
                                        </Item>
                                    ))}
                                </Drawer.Body>
                                <Drawer.Footer>
                                    <Drawer.Close>
                                        <Button variant="outline" className="flex-1">Close</Button>
                                    </Drawer.Close>
                                </Drawer.Footer>
                            </Drawer.Content>
                        </Drawer>

                        <ShiftStatusPill />
                    </View>

                    <TouchableNativeFeedback onPress={() => router.navigate('/(tabs)/profile')}>
                        <Avatar fallback={user?.Fullname?.charAt(0) ?? '?'} size="lg" style={{ backgroundColor: background }} />
                    </TouchableNativeFeedback>
                </View>

                <View className="flex-1 mt-4 px-5">
                    <Text size="xl">Hai 👋, {user?.Fullname?.split(' ')[0] ?? 'User'}</Text>
                    <Text weight="bold" className="text-3xl leading-none mt-2 ">Sistem Pengurusan Pembersihan Fasiliti</Text>
                </View>

                <HomeStats />

                <ScheduleCarousel />
            </ScrollView>
        </SoftBackground>
    );
}