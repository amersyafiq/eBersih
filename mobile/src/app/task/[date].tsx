import React, { useEffect, useState, useMemo } from 'react';
import { View, ScrollView, RefreshControl } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
    Badge,
    Button,
    Card,
    Chip,
    Dialog,
    Fab,
    SlideButton,
    Text,
    Separator,
    Skeleton,
    ChevronLeftIcon,
    ClockIcon,
    PlayIcon,
    Accordion,
} from 'panelui-native';
import { QrCode, MapPin } from 'lucide-react-native';
import { SoftBackground } from '@/src/components/ui/soft-background';
import { ShiftStatusPill } from '@/src/components/home/home-time';
import { PingDot } from '@/src/components/ui/ping-dot';
import { useScheduleTasks, useClockIn } from '@/src/lib/api/task';
import { AssignmentTask } from '@/src/lib/api/task/types';
import { TaskProgress } from '@/src/components/task/task-progress';
import { TaskHeader } from '@/src/components/task/task-header';
import { TaskFilter } from '@/src/components/task/task-filter';
import { TaskAccordion } from '@/src/components/task/task-accordion';

function getTodayDateString(): string {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function formatDisplayDate(dateStr: string): string {
    const d = new Date(`${dateStr}T00:00:00`);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('ms-MY', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });
}

export default function ScheduleTaskDetailScreen() {
    const { date, space: initialSpaceCode } = useLocalSearchParams<{ date: string; space?: string }>();
    const insets = useSafeAreaInsets();
    const router = useRouter();

    const scheduleDate = date || getTodayDateString();
    const today = getTodayDateString();
    const isPast = scheduleDate < today;
    const isToday = scheduleDate === today;

    // TanStack Query for cleaner schedule data from backend
    const { data: scheduleData, isLoading, refetch, isRefetching } = useScheduleTasks(scheduleDate);
    const { mutate: clockIn } = useClockIn();

    // Clock in status from DB
    const isClockedIn = scheduleData?.isAttended ?? false;
    const [clockInModalOpen, setClockInModalOpen] = useState(false);

    // Selected space filter
    const [selectedSpace, setSelectedSpace] = useState<string | null>(initialSpaceCode || null);

    // Sync selected space when param changes
    useEffect(() => {
        if (initialSpaceCode) {
            setSelectedSpace(initialSpaceCode);
        }
    }, [initialSpaceCode]);

    // Check if user needs to clock in on today's schedule
    useEffect(() => {
        if (isToday && scheduleData && !scheduleData.isAttended) {
            setClockInModalOpen(true);
        }
    }, [isToday, scheduleData]);

    const handleClockIn = () => {
        clockIn(scheduleDate, {
            onSuccess: () => {
                setClockInModalOpen(false);
            },
        });
    };

    const spaces = scheduleData?.spaces || [];

    // Filter spaces and calculate summary statistics
    const { totalTasks, completedTasks, filteredSpaces } = useMemo(() => {
        let total = 0;
        let completed = 0;

        spaces.forEach((s) => {
            s.tasks.forEach((t) => {
                total += 1;
                const st = (t.Status || '').toLowerCase();
                if (st === 'completed' || st === 'selesai') completed += 1;
            });
        });

        const filtered = selectedSpace
            ? spaces.filter((s) => s.SpaceCode.toLowerCase() === selectedSpace.toLowerCase())
            : spaces;

        return {
            totalTasks: total,
            completedTasks: completed,
            filteredSpaces: filtered,
        };
    }, [spaces, selectedSpace]);

    return (
        <SoftBackground className="flex-1 relative" style={{ paddingTop: insets.top }}>

            {/* Top Navigation Bar */}
            <View className="flex-row items-center justify-between px-5 pt-3 pb-2 absolute left-0 right-0 z-10" style={{ paddingTop: insets.top }}>
                <View className="flex-1 flex-row gap-2 items-center">
                    <Button
                        variant="outline"
                        className="shadow-none border-border rounded-full h-14 min-w-14 w-fit px-4.5"
                        size="lg"
                        onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)'))}
                    >
                        <ChevronLeftIcon size={20} />
                    </Button>
                    <ShiftStatusPill />
                </View>
            </View>

            <ScrollView
                className="flex-1"
                contentContainerStyle={{
                    paddingTop: 8,
                    paddingBottom: isToday ? 100 : 40,
                    paddingHorizontal: 20,
                    gap: 16,
                }}
                refreshControl={
                    <RefreshControl refreshing={isRefetching} onRefresh={() => { void refetch(); }} />
                }
            >
                <View className="flex-col ml-auto gap-1">
                    {isClockedIn && (
                        <Badge variant="default" size="sm" className="px-3 py-1">
                            Clocked In
                        </Badge>
                    )}
                    <Badge variant={isToday ? 'default' : 'secondary'} size="sm" className="px-3 py-1">
                        {isPast ? 'Archived' : isToday ? 'Active' : 'Upcoming'}
                    </Badge>
                </View>

                {/* Header Information Section */}
                <TaskHeader
                    scheduleData={scheduleData}
                    scheduleDate={scheduleDate}
                    spaces={spaces}
                    totalTasks={totalTasks}
                    formatDisplayDate={formatDisplayDate}
                />

                {/* Progress Card */}
                <TaskProgress totalTasks={totalTasks} completedTasks={completedTasks} />

                {/* Loading Skeleton */}
                {isLoading && (
                    <View className="gap-4">
                        <Card className="p-4 gap-3">
                            <Skeleton className="h-6 w-48 rounded-md" />
                            <Skeleton className="h-4 w-32 rounded-md" />
                            <Separator />
                            <Skeleton className="h-16 w-full rounded-md" />
                        </Card>
                    </View>
                )}

                {/* Space Filter Bar */}
                <TaskFilter
                    spaces={spaces}
                    selectedSpace={selectedSpace}
                    setSelectedSpace={setSelectedSpace}
                    isLoading={isLoading}
                />

                {/* Empty State */}
                {!isLoading && spaces.length === 0 && (
                    <Card className="p-6 items-center justify-center gap-2 mt-4 bg-card border-border">
                        <ClockIcon size={32} />
                        <Text size="lg" weight="bold">Tiada Tugasan</Text>
                        <Text size="sm" muted className="text-center px-4">
                            Tiada jadual tugasan pembersihan yang direkodkan untuk anda pada tarikh ini.
                        </Text>
                    </Card>
                )}

                {/* Tasks List Grouped By Spaces in Accordion */}
                {!isLoading && filteredSpaces.length > 0 && (
                    <Accordion
                        key={selectedSpace ?? 'all'}
                        variant="ghost"
                        selectionMode="multiple"
                        className="gap-3 mt-1"
                    >
                        {filteredSpaces.map((space) => {
                            const spaceCompletedCount = space.tasks.filter((t) => {
                                const st = (t.Status || '').toLowerCase();
                                return st === 'completed';
                            }).length;
                            const allCompleted = spaceCompletedCount === space.tasks.length && space.tasks.length > 0;

                            return (
                                <TaskAccordion
                                    key={space.SpaceCode}
                                    space={space}
                                    allCompleted={allCompleted}
                                    spaceCompletedCount={spaceCompletedCount}
                                    scheduleDate={scheduleDate}
                                    isPast={isPast}
                                    isClockedIn={isClockedIn}
                                    setClockInModalOpen={setClockInModalOpen}
                                />
                            );
                        })}
                    </Accordion>
                )}
            </ScrollView>

            {/* PanelUI FAB for Scanning Room QR Code */}
            {!isLoading && (
                <Fab
                    placement="bottom-right"
                    size="lg"
                    icon={<QrCode size={20} color="currentColor" style={{color: "white"}}/>}
                    accessibilityLabel="Imbas Kod QR Bilik"
                    onPress={() => {
                        if (!isClockedIn) {
                            setClockInModalOpen(true);
                        } else {
                            router.push({
                                pathname: '/task/scan-qr',
                                params: { date: scheduleDate },
                            });
                        }
                    }}
                >
                </Fab>
            )}

            {/* Clock-in Prompt Dialog Window with PanelUI SlideButton */}
            <Dialog open={clockInModalOpen} onOpenChange={setClockInModalOpen}>
                <Dialog.Content className="gap-5">
                    <View className="items-center gap-2">
                        <View className="h-14 w-14 rounded-full bg-primary/10 items-center justify-center">
                            <ClockIcon size={28} />
                        </View>
                        <Dialog.Title className="text-xl text-center font-bold">
                            Kehadiran Diperlukan
                        </Dialog.Title>
                        <Dialog.Description className="text-center text-sm">
                            Sila sahkan kehadiran anda (Clock In) untuk membuka senarai tugasan pembersihan syif hari ini.
                        </Dialog.Description>
                    </View>

                    <Card className="p-3 bg-secondary/40 border-border gap-2">
                        <View className="flex-row justify-between items-center">
                            <Text size="sm" muted>Tarikh Bertugas</Text>
                            <Text size="sm" weight="semibold">{formatDisplayDate(scheduleDate)}</Text>
                        </View>
                        <View className="flex-row justify-between items-center">
                            <Text size="sm" muted>Jadual Waktu</Text>
                            <Badge size="xs" variant="secondary">07:30 AM - 05:30 PM</Badge>
                        </View>
                        <View className="flex-row justify-between items-center">
                            <Text size="sm" muted>Lokasi Bertugas</Text>
                            <Text size="sm" weight="medium">
                                {scheduleData?.ZoneCode || 'Zon Bertugas'}
                                {scheduleData?.ZoneName ? ` • ${scheduleData.ZoneName}` : ''}
                            </Text>
                        </View>
                    </Card>

                    {/* PanelUI SlideButton Component */}
                    <View className="w-full pt-1">
                        <SlideButton size="lg" onComplete={handleClockIn}>
                            <SlideButton.Label>Slaid untuk Clock In</SlideButton.Label>
                        </SlideButton>
                    </View>

                    <Dialog.Footer className="flex-row justify-center">
                        <Button
                            variant="ghost"
                            size="sm"
                            onPress={() => setClockInModalOpen(false)}
                        >
                            Lihat Sahaja (Mod Baca)
                        </Button>
                    </Dialog.Footer>
                </Dialog.Content>
            </Dialog>
        </SoftBackground>
    );
}
