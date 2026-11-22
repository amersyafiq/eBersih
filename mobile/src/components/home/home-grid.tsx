// src/components/home/HomeStats.tsx
import React from 'react';
import { GridItem } from 'panelui-native/components/grid-item';
import { Skeleton } from 'panelui-native/components/skeleton';
import { useCurrentUser } from '@/src/lib/api/auth';
import { useHomeStats } from '@/src/lib/api/home/index';
import { View } from 'react-native';

export function HomeStats() {
    const { data: user, isLoading: isUserLoading } = useCurrentUser();
    const { data: stats, isLoading: isStatsLoading } = useHomeStats();

    const isLoading = isUserLoading || isStatsLoading;

    if (isLoading) {
        return (
            <View className='px-5'>
                <GridItem.Group columns={3} gap={8} aspect={1.3}>
                    <GridItem colSpan={1} rowSpan={2} className="bg-amber-200/60 flex justify-around">
                        <Skeleton className="h-3.5 w-20 rounded-md" />
                        <Skeleton className="h-8 w-16 rounded-md" />
                        <Skeleton className="h-3 w-14 rounded-md" />
                    </GridItem>

                    <GridItem colSpan={2} className="bg-orange-200/60 flex justify-center gap-2">
                        <Skeleton className="h-3.5 w-24 rounded-md" />
                        <Skeleton className="h-6 w-28 rounded-md" />
                    </GridItem>

                    <GridItem colSpan={2} className="bg-red-200/60 flex justify-center gap-2">
                        <Skeleton className="h-3.5 w-20 rounded-md" />
                        <Skeleton className="h-6 w-24 rounded-md" />
                    </GridItem>
                </GridItem.Group>
            </View>
        );
    }

    return (
        <View className='px-5'>
            <GridItem.Group columns={3} gap={8} aspect={1.3}>
                <GridItem colSpan={1} rowSpan={2} className="bg-amber-200 flex justify-around">
                    <GridItem.Title className="leading-0 text-black">Tasks Completed</GridItem.Title>
                    <GridItem.Value className="text-black">
                        {(stats?.tasks_completed_week ?? 0).toLocaleString()}
                    </GridItem.Value>
                    <GridItem.Description className="text-black">this week</GridItem.Description>
                </GridItem>

                <GridItem colSpan={2} className="bg-orange-200">
                    <GridItem.Title className="leading-0 text-black">Tugasan Anda</GridItem.Title>
                    <GridItem.Value className="text-black">{user?.Role ?? 'Tiada'}</GridItem.Value>
                </GridItem>

                <GridItem colSpan={2} className="bg-red-200">
                    <GridItem.Title className="leading-0 text-black">Zon Harian</GridItem.Title>
                    <GridItem.Value className="text-black">Zon {user?.zone?.ZoneCode ?? 'Tiada'}</GridItem.Value>
                </GridItem>
            </GridItem.Group>
        </View>
    );
}
