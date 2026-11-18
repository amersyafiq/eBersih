// src/components/home/ScheduleCarousel.tsx
import React from 'react';
import { View, Text as RNText } from 'react-native';
import { Text } from 'panelui-native';
import { useRouter } from 'expo-router';
import { Carousel } from 'panelui-native/components/carousel';
import { Card } from 'panelui-native/components/card';
import { Badge } from 'panelui-native/components/badge';
import { Button } from 'panelui-native/components/button';
import { Separator } from 'panelui-native/components/separator';
import { Skeleton } from 'panelui-native/components/skeleton';
import { BookmarkIcon } from 'panelui-native/icons';
import { useRecentSchedules } from '@/src/lib/api/home/index';
import clsx from 'clsx';
import { PingDot } from '../ui/ping-dot';
import { Image } from 'expo-image';

const card_pattern1 = require("@/assets/pattern/card_pattern1.png")
const card_pattern2 = require("@/assets/pattern/card_pattern2.png")
const card_pattern3 = require("@/assets/pattern/card_pattern3.png")
const card_pattern4 = require("@/assets/pattern/card_pattern4.png")
const patterns = [
    { source: card_pattern1, width: 185, height: 185, bottom: "-25%", right: "-25%" },
    { source: card_pattern4, width: 250, height: 250, bottom: "-35%", right: "-35%" },
    { source: card_pattern2, width: 195, height: 195, bottom: "-25%", right: "-25%" },
    { source: card_pattern3, width: 180, height: 180, bottom: "-25%", right: "-25%" },
];

function formatScheduleDate(isoDate: string, isToday: boolean) {
    const date = new Date(`${isoDate}T00:00:00`);
    const formatted = date.toLocaleDateString('en-MY', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
    });
    return isToday ? `Today • ${formatted}` : formatted;
}

const colors = ['bg-indigo-200', 'bg-teal-200', 'bg-yellow-200', 'bg-amber-200'];

export function ScheduleCarousel() {
    const router = useRouter();
    const { data: schedules, isLoading } = useRecentSchedules(7);
    const date = new Date()
    const dayOfMonth = date.getDate();
    const monthNumber = date.getMonth() + 1;

    if (isLoading) {
        return (
            <View className="mt-3 px-5">
                <View className="flex-1 flex-row gap-2 items-center">
                    <Text weight="medium" className='text-4xl'>{dayOfMonth}</Text>
                    <View className="bg-surface-secondary w-0.5 h-full"></View>
                    <Text weight="bold" className='text-4xl text-secondary'>{monthNumber}</Text>
                    <View className="ml-3 gap-0">
                        <Text>Current Schedule</Text>
                        <Badge size="xs" variant="secondary"> 7:30 AM - 5:30 PM </Badge>
                    </View>
                </View>
                <Card className="mt-3 w-full h-56 justify-between p-4">
                    <View className="flex-row justify-between">
                        <Skeleton className="h-4 w-32 rounded-md" />
                        <Skeleton className="h-5 w-16 rounded-full" />
                    </View>
                    <Skeleton className="h-8 w-48 rounded-md" />
                    <Separator />
                    <View className="flex-row items-center justify-between">
                        <View className="gap-1.5">
                            <Skeleton className="h-4 w-28 rounded-md" />
                            <Skeleton className="h-3 w-20 rounded-md" />
                        </View>
                        <Skeleton className="h-8 w-16 rounded-full" />
                    </View>
                </Card>
            </View>
        );
    }

    if (!schedules || schedules.length === 0) {
        return (
            <View className="mt-3 px-5">
                <View className="flex-1 flex-row gap-2 items-center">
                    <Text weight="medium" className='text-4xl'>{dayOfMonth}</Text>
                    <View className="bg-surface-secondary w-0.5 h-full"></View>
                    <Text weight="bold" className='text-4xl text-secondary'>{monthNumber}</Text>
                    <View className="ml-3 gap-0">
                        <Text>Current Schedule</Text>
                        <Badge size="xs" variant="secondary"> 7:30 AM - 5:30 PM </Badge>
                    </View>
                </View>
                <Card className="mt-5 w-full py-8 items-center justify-center">
                    <Text size="lg" weight="semibold"> No schedules in the past 7 days</Text>
                    <Text size="sm" muted className="mt-1 text-center w-3/4">
                        Your daily assignments will appear here once generated.
                    </Text>
                </Card>
            </View>
        );
    }

    return (
        <View className="mt-3">
            <View className="flex-1 flex-row gap-2 items-center px-5">
                <Text weight="medium" className='text-4xl'>{dayOfMonth}</Text>
                <View className="bg-surface-secondary w-0.5 h-full"></View>
                <Text weight="bold" className='text-4xl text-secondary'>{monthNumber}</Text>
                <View className="ml-3 gap-0">
                    <Text>Current Schedule</Text>
                    <Badge size="xs" variant="secondary"> 7:30 AM - 5:30 PM </Badge>
                </View>
            </View>
            <Carousel variant="interactive" itemSize={300} className="mt-3">
                <Carousel.Content className="h-60">
                    {schedules.map((item, index) => {
                        const pattern = patterns[index % patterns.length];
                        return (
                        <Carousel.Item key={`${item.ScheduleDate}`}>
                            <Card className={clsx("w-full gap-0 border-none border-0 shadow-none relative overflow-hidden", colors[index % colors.length])}>
                                <Image source={pattern.source} style={{ width: pattern.width, height: pattern.height, position: 'absolute', right: pattern.right, bottom: pattern.bottom }} />
                                <Card.Header className="flex-row items-center justify-between py-4">
                                    <Card.Title className="text-black">{formatScheduleDate(item.ScheduleDate, item.isToday)}</Card.Title>
                                    <Badge size="md" variant={item.isToday ? 'default' : 'secondary'} className="text-black">
                                        {item.ZoneCode}
                                    </Badge>
                                </Card.Header>

                                <Card.Content className="gap-3 py-4">
                                    {/* Middle Row: Task Completion Title + Vertical Dots */}
                                    <View className="flex-row items-end justify-between gap-3">
                                        <View className="flex-1">
                                            <Text size="2xl" weight="bold" className="text-black">
                                                {item.taskCount ?? 0} Tasks
                                            </Text>
                                            <Text size="2xl" weight="normal" className="text-black">
                                                {item.spaceCount ?? 0} Spaces
                                            </Text>
                                        </View>
                                    </View>
                                </Card.Content>

                                {/* Bottom Row: Zone Name + View Button */}
                                <Card.Content className="flex-row items-center justify-between gap-3 py-3">
                                    <Button
                                        size="md"
                                        className="rounded-full"
                                        onPress={() =>
                                            router.push({
                                                pathname: '/task/[date]',
                                                params: { date: item.ScheduleDate },
                                            })
                                        }
                                    >
                                        {item.isAttended || !item.isToday ?
                                            "View Past Tasks"
                                            :
                                            <View className="flex-row items-center gap-2 px-3">
                                                <PingDot /><Text size="base" className="text-white">Clock In</Text>
                                            </View>
                                        }
                                    </Button>
                                </Card.Content>
                            </Card>
                        </Carousel.Item>
                    )})}
                </Carousel.Content>

                <Carousel.Controls />
            </Carousel>
        </View>
    );
}
