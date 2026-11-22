import React, { useState, useEffect, useRef } from 'react';
import { View, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
    Accordion,
    Badge,
    Button,
    Card,
    Dialog,
    Separator,
    Skeleton,
    Text,
    ChevronLeftIcon,
    PlayIcon,
    PauseIcon,
    CheckIcon,
    ClockIcon,
    AlertTriangleIcon,
} from 'panelui-native';
import {
    MapPin,
    SkipForward,
    CheckCircle2,
    Star,
} from 'lucide-react-native';
import { SoftBackground } from '@/src/components/ui/soft-background';
import { PingDot } from '@/src/components/ui/ping-dot';
import { useTaskDetail, useUpdateTaskAssignment } from '@/src/lib/api/task';
import { AssignmentTask, TASK_GUIDES } from '@/src/lib/api/task/types';

function formatTimeString(date: Date): string {
    return date.toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
    });
}

function formatDurationSeconds(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export default function TaskDetailScreen() {
    const { id, date } = useLocalSearchParams<{ id: string; date: string }>();
    const insets = useSafeAreaInsets();
    const router = useRouter();

    const scheduleDate = date || new Date().toISOString().split('T')[0];
    const assignId = id ? parseInt(id, 10) : 0;

    // Fetch task from backend via TanStack Query
    const { data: serverTask, isLoading } = useTaskDetail(assignId);
    const { mutate: updateAssignment } = useUpdateTaskAssignment();

    // Local operational timing state
    const [status, setStatus] = useState<string>('Assigned');
    const [remainingSeconds, setRemainingSeconds] = useState<number>(1200);

    // Time tracking references for DB StartTime / EndTime calculation
    const [startTime, setStartTime] = useState<Date | null>(null);
    const [totalPauseMs, setTotalPauseMs] = useState<number>(0);
    const pauseStartRef = useRef<Date | null>(null);

    // Modal dialogs
    const [completionModalOpen, setCompletionModalOpen] = useState(false);
    const [skipModalOpen, setSkipModalOpen] = useState(false);
    const [skipReason, setSkipReason] = useState('Bilik sedang digunakan oleh staf / mesyuarat');
    const [cleanRating, setCleanRating] = useState<number>(3);

    // Computed recorded times
    const [recordedTimes, setRecordedTimes] = useState<{
        start: string;
        rawEnd: string;
        adjustedEnd: string;
        pauseFormatted: string;
        activeDurationFormatted: string;
    } | null>(null);

    // Sync initial state when server data arrives
    useEffect(() => {
        if (serverTask) {
            const serverStatus = serverTask.Status || 'Assigned';
            setStatus(serverStatus);

            const durationSecs = (serverTask.EstimatedDuration || 20) * 60;
            setRemainingSeconds(durationSecs);

            if (serverTask.StartTime) {
                const [h, m, s] = serverTask.StartTime.split(':').map((v) => parseInt(v, 10) || 0);
                const d = new Date();
                d.setHours(h, m, s, 0);
                setStartTime(d);
            }

            if (serverTask.CleanRating) {
                setCleanRating(serverTask.CleanRating);
            }
        }
    }, [serverTask]);

    // Ticking countdown timer when in progress
    useEffect(() => {
        let interval: ReturnType<typeof setInterval> | null = null;
        const normalized = status.toLowerCase();

        if (normalized === 'inprogress' || normalized === 'in_progress') {
            interval = setInterval(() => {
                setRemainingSeconds((prev) => {
                    if (prev <= 1) return 0;
                    return prev - 1;
                });
            }, 1000);
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [status]);

    if (isLoading) {
        return (
            <SoftBackground className="flex-1" style={{ paddingTop: insets.top }}>
                <View className="p-5 gap-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <Skeleton className="h-8 w-64 rounded-md" />
                    <Skeleton className="h-4 w-40 rounded-md" />
                    <Skeleton className="h-48 w-full rounded-2xl" />
                </View>
            </SoftBackground>
        );
    }

    if (!serverTask) {
        return (
            <SoftBackground className="flex-1 items-center justify-center p-6" style={{ paddingTop: insets.top }}>
                <Text size="lg" weight="bold">Tugasan tidak dijumpai</Text>
                <Button className="mt-4" onPress={() => router.back()}>
                    Kembali
                </Button>
            </SoftBackground>
        );
    }

    const guide = TASK_GUIDES[serverTask.TaskType] || TASK_GUIDES.General;
    const normStatus = status.toLowerCase();
    const isAssigned = normStatus === 'Assigned' || normStatus === 'belum mula';
    const isInProgress = normStatus === 'inprogress' || normStatus === 'in_progress' || normStatus === 'sedang mula';
    const isPaused = normStatus === 'paused' || normStatus === 'ditangguhkan';
    const isCompleted = normStatus === 'completed' || normStatus === 'selesai';
    const isSkipped = normStatus === 'skipped' || normStatus === 'dilangkau';

    // 1. Action: Begin Task
    const handleBeginTask = () => {
        const now = new Date();
        const startStr = formatTimeString(now);
        setStartTime(now);
        setStatus('InProgress');

        updateAssignment({
            assignId,
            data: {
                Status: 'InProgress',
                StartTime: startStr,
            },
        });
    };

    // 2. Action: Pause Task
    const handlePauseTask = () => {
        pauseStartRef.current = new Date();
        setStatus('Paused');

        updateAssignment({
            assignId,
            data: {
                Status: 'Paused',
            },
        });
    };

    // 3. Action: Resume Task
    const handleResumeTask = () => {
        if (pauseStartRef.current) {
            const pauseDiff = Date.now() - pauseStartRef.current.getTime();
            setTotalPauseMs((prev) => prev + pauseDiff);
            pauseStartRef.current = null;
        }
        setStatus('InProgress');

        updateAssignment({
            assignId,
            data: {
                Status: 'InProgress',
            },
        });
    };

    // 4. Action: Complete Task (Subtract pause time from EndTime)
    const handleCompleteTask = () => {
        let finalPauseMs = totalPauseMs;
        if (isPaused && pauseStartRef.current) {
            finalPauseMs += Date.now() - pauseStartRef.current.getTime();
            pauseStartRef.current = null;
            setTotalPauseMs(finalPauseMs);
        }

        const taskStart = startTime || new Date();
        const rawEnd = new Date();

        // Pause time subtraction: EndTime - totalPauseMs
        const adjustedEnd = new Date(rawEnd.getTime() - finalPauseMs);

        const startTimeStr = formatTimeString(taskStart);
        const rawEndTimeStr = formatTimeString(rawEnd);
        const adjustedEndTimeStr = formatTimeString(adjustedEnd);

        const totalPauseSecs = Math.round(finalPauseMs / 1000);
        const pauseMinutesFormatted = `${Math.floor(totalPauseSecs / 60)}m ${totalPauseSecs % 60}s`;

        const activeSecs = Math.max(0, Math.round((adjustedEnd.getTime() - taskStart.getTime()) / 1000));
        const activeFormatted = `${Math.floor(activeSecs / 60)} minit ${activeSecs % 60} saat`;

        setRecordedTimes({
            start: startTimeStr,
            rawEnd: rawEndTimeStr,
            adjustedEnd: adjustedEndTimeStr,
            pauseFormatted: pauseMinutesFormatted,
            activeDurationFormatted: activeFormatted,
        });

        setStatus('Completed');

        updateAssignment({
            assignId,
            data: {
                Status: 'Completed',
                StartTime: startTimeStr,
                EndTime: adjustedEndTimeStr,
                CleanRating: cleanRating,
            },
        });

        setCompletionModalOpen(true);
    };

    // 5. Action: Skip Task
    const handleConfirmSkip = () => {
        setSkipModalOpen(false);
        setStatus('Skipped');

        updateAssignment({
            assignId,
            data: {
                Status: 'Skipped',
            },
        });
        router.back();
    };

    return (
        <SoftBackground className="flex-1" style={{ paddingTop: insets.top }}>
            {/* Top Bar */}
            <View className="flex-row items-center justify-between px-5 pt-3 pb-2">
                <Button
                    variant="outline"
                    className="shadow-none border-border rounded-full h-14 min-w-14 w-fit px-4.5"
                    size="lg"
                    onPress={() => router.back()}
                >
                    <ChevronLeftIcon size={20} />
                </Button>

                <View className="flex-row items-center gap-2">
                    <Badge variant="secondary" size="md">
                        {serverTask.SpaceCode}
                    </Badge>
                    <Badge
                        variant={
                            isCompleted
                                ? 'success'
                                : isInProgress
                                ? 'default'
                                : isPaused
                                ? 'secondary'
                                : isSkipped
                                ? 'destructive'
                                : 'outline'
                        }
                        size="md"
                    >
                        {isCompleted
                            ? 'Selesai'
                            : isInProgress
                            ? 'Sedang Berjalan'
                            : isPaused
                            ? 'Ditangguhkan'
                            : isSkipped
                            ? 'Dilangkau'
                            : 'Belum Mula'}
                    </Badge>
                </View>
            </View>

            <ScrollView
                className="flex-1"
                contentContainerStyle={{
                    paddingTop: 8,
                    paddingBottom: 40,
                    paddingHorizontal: 20,
                    gap: 16,
                }}
            >
                {/* Task Title & Space Header */}
                <View className="gap-1.5 mt-2">
                    <View className="flex-row items-center gap-2">
                        <MapPin size={16} color="currentColor" />
                        <Text size="sm" muted>
                            {serverTask.SpaceName} • {serverTask.FloorName}
                        </Text>
                    </View>
                    <Text weight="bold" className="text-2xl leading-tight">
                        {serverTask.TaskName}
                    </Text>
                    <View className="flex-row items-center gap-2 mt-1">
                        <Badge size="xs" variant="secondary">
                            Kategori: {serverTask.TaskType}
                        </Badge>
                        <Text size="xs" muted>
                            Anggaran Masa: {serverTask.EstimatedDuration} Minit
                        </Text>
                    </View>
                </View>

                {/* Hero Countdown & Timer Card */}
                <Card className="p-5 gap-4 bg-card border-border items-center">
                    <View className="items-center gap-1">
                        <Text size="xs" muted className="uppercase tracking-widest font-semibold">
                            {isCompleted
                                ? 'Tugasan Telah Disempurnakan'
                                : isPaused
                                ? 'Masa Dihentikan Sementara'
                                : isInProgress
                                ? 'Baki Masa Tugasan'
                                : 'Masa Tugasan Ditetapkan'}
                        </Text>

                        {/* Large Digital Countdown Display */}
                        <Text
                            weight="bold"
                            className={`text-5xl font-mono tabular-nums tracking-wider ${
                                isPaused
                                    ? 'text-amber-500'
                                    : isInProgress
                                    ? 'text-primary'
                                    : isCompleted
                                    ? 'text-emerald-500'
                                    : 'text-foreground'
                            }`}
                        >
                            {isCompleted ? '00:00' : formatDurationSeconds(remainingSeconds)}
                        </Text>

                        {isPaused && (
                            <View className="flex-row items-center gap-1.5 bg-amber-500/10 px-3 py-1 rounded-full mt-1">
                                <PauseIcon size={12} color="#f59e0b" />
                                <Text size="xs" className="text-amber-600 dark:text-amber-400 font-medium">
                                    PAUSED (Penolakan masa aktif)
                                </Text>
                            </View>
                        )}
                        {isInProgress && (
                            <View className="flex-row items-center gap-1.5 bg-primary/10 px-3 py-1 rounded-full mt-1">
                                <PingDot />
                                <Text size="xs" className="text-primary font-medium">
                                    Masa sedang berjalan
                                </Text>
                            </View>
                        )}
                    </View>

                    {/* Start / Pause / Complete / Skip Control Buttons */}
                    <View className="w-full gap-2.5 pt-2">
                        {isAssigned && (
                            <View className="flex-row gap-2">
                                <Button
                                    size="lg"
                                    className="flex-1 rounded-full"
                                    onPress={handleBeginTask}
                                >
                                    <View className="flex-row items-center justify-center gap-2">
                                        <PlayIcon size={18} />
                                        <Text size="base" className="text-white font-semibold">
                                            Begin Task
                                        </Text>
                                    </View>
                                </Button>
                                <Button
                                    size="lg"
                                    variant="outline"
                                    className="rounded-full px-5"
                                    onPress={() => setSkipModalOpen(true)}
                                >
                                    <SkipForward size={18} color="currentColor" />
                                </Button>
                            </View>
                        )}

                        {isInProgress && (
                            <View className="gap-2">
                                <View className="flex-row gap-2">
                                    <Button
                                        size="lg"
                                        variant="outline"
                                        className="flex-1 rounded-full"
                                        onPress={handlePauseTask}
                                    >
                                        <View className="flex-row items-center justify-center gap-2">
                                            <PauseIcon size={18} />
                                            <Text size="base" weight="semibold">
                                                Pause
                                            </Text>
                                        </View>
                                    </Button>

                                    <Button
                                        size="lg"
                                        className="flex-1 rounded-full bg-emerald-600"
                                        onPress={handleCompleteTask}
                                    >
                                        <View className="flex-row items-center justify-center gap-2">
                                            <CheckIcon size={18} />
                                            <Text size="base" className="text-white font-semibold">
                                                Complete
                                            </Text>
                                        </View>
                                    </Button>
                                </View>

                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="self-center"
                                    onPress={() => setSkipModalOpen(true)}
                                >
                                    <Text size="xs" muted>
                                        Langkau Tugasan Ini
                                    </Text>
                                </Button>
                            </View>
                        )}

                        {isPaused && (
                            <View className="gap-2">
                                <View className="flex-row gap-2">
                                    <Button
                                        size="lg"
                                        className="flex-1 rounded-full bg-amber-600"
                                        onPress={handleResumeTask}
                                    >
                                        <View className="flex-row items-center justify-center gap-2">
                                            <PlayIcon size={18} />
                                            <Text size="base" className="text-white font-semibold">
                                                Sambung Semula
                                            </Text>
                                        </View>
                                    </Button>

                                    <Button
                                        size="lg"
                                        variant="outline"
                                        className="flex-1 rounded-full border-emerald-600 text-emerald-600"
                                        onPress={handleCompleteTask}
                                    >
                                        <Text size="base" weight="semibold" className="text-emerald-600">
                                            Complete
                                        </Text>
                                    </Button>
                                </View>

                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="self-center"
                                    onPress={() => setSkipModalOpen(true)}
                                >
                                    <Text size="xs" muted>
                                        Langkau Tugasan Ini
                                    </Text>
                                </Button>
                            </View>
                        )}

                        {isCompleted && (
                            <View className="w-full gap-2">
                                <Card className="p-3 bg-emerald-500/10 border-emerald-500/30 gap-1.5">
                                    <View className="flex-row items-center gap-2">
                                        <CheckCircle2 size={18} color="#16a34a" />
                                        <Text size="sm" weight="semibold" className="text-emerald-700 dark:text-emerald-300">
                                            Tugasan Telah Disimpan ke Pangkalan Data
                                        </Text>
                                    </View>
                                    <Text size="xs" muted>
                                        StartTime: {serverTask.StartTime ?? '--:--'} • EndTime: {serverTask.EndTime ?? '--:--'}
                                    </Text>
                                </Card>
                            </View>
                        )}

                        {isSkipped && (
                            <Card className="p-3 bg-destructive/10 border-destructive/20 gap-1">
                                <Text size="sm" weight="semibold" className="text-destructive">
                                    Tugasan Telah Dilangkau
                                </Text>
                            </Card>
                        )}
                    </View>
                </Card>

                {/* SOP Accordion: Steps, Requirements, Expectations, Safety */}
                <View className="gap-2 mt-2">
                    <Text size="sm" weight="semibold" muted className="uppercase tracking-wider">
                        Panduan Operasi Standard (SOP)
                    </Text>

                    <Accordion variant="separated" selectionMode="multiple" defaultValue={['steps', 'requirements']}>
                        {/* 1. Steps of Execution */}
                        <Accordion.Item value="steps">
                            <Accordion.Trigger>
                                <Accordion.Title>1. Langkah Pelaksanaan ({guide.steps.length} Langkah)</Accordion.Title>
                                <Accordion.Indicator />
                            </Accordion.Trigger>
                            <Accordion.Content>
                                <View className="gap-3 pt-1">
                                    {guide.steps.map((st) => (
                                        <View key={st.stepNumber} className="flex-row gap-3 items-start">
                                            <View className="h-6 w-6 rounded-full bg-primary/10 items-center justify-center mt-0.5">
                                                <Text size="xs" weight="bold" className="text-primary">
                                                    {st.stepNumber}
                                                </Text>
                                            </View>
                                            <View className="flex-1 gap-0.5">
                                                <Text size="sm" weight="semibold">
                                                    {st.title}
                                                </Text>
                                                <Text size="xs" muted>
                                                    {st.description}
                                                </Text>
                                            </View>
                                        </View>
                                    ))}
                                </View>
                            </Accordion.Content>
                        </Accordion.Item>

                        {/* 2. Requirements & PPE */}
                        <Accordion.Item value="requirements">
                            <Accordion.Trigger>
                                <Accordion.Title>2. Keperluan & Peralatan (PPE)</Accordion.Title>
                                <Accordion.Indicator />
                            </Accordion.Trigger>
                            <Accordion.Content>
                                <View className="gap-2 pt-1">
                                    {guide.requirements.map((item, idx) => (
                                        <View key={idx} className="flex-row items-center gap-2.5">
                                            <View className="h-2 w-2 rounded-full bg-primary" />
                                            <Text size="sm" className="flex-1">
                                                {item}
                                            </Text>
                                        </View>
                                    ))}
                                </View>
                            </Accordion.Content>
                        </Accordion.Item>

                        {/* 3. Quality Expectations */}
                        <Accordion.Item value="expectations">
                            <Accordion.Trigger>
                                <Accordion.Title>3. Piawaian Kualiti & Jangkaan</Accordion.Title>
                                <Accordion.Indicator />
                            </Accordion.Trigger>
                            <Accordion.Content>
                                <View className="gap-2 pt-1">
                                    {guide.expectations.map((item, idx) => (
                                        <View key={idx} className="flex-row items-center gap-2.5">
                                            <CheckCircle2 size={16} color="#16a34a" />
                                            <Text size="sm" className="flex-1">
                                                {item}
                                            </Text>
                                        </View>
                                    ))}
                                </View>
                            </Accordion.Content>
                        </Accordion.Item>

                        {/* 4. Safety Notes */}
                        <Accordion.Item value="safety">
                            <Accordion.Trigger>
                                <Accordion.Title>4. Garis Panduan Keselamatan</Accordion.Title>
                                <Accordion.Indicator />
                            </Accordion.Trigger>
                            <Accordion.Content>
                                <View className="gap-2 pt-1">
                                    {guide.safetyNotes.map((item, idx) => (
                                        <View key={idx} className="flex-row items-start gap-2.5 bg-destructive/5 p-2 rounded-lg">
                                            <AlertTriangleIcon size={16} />
                                            <Text size="xs" className="flex-1 text-destructive">
                                                {item}
                                            </Text>
                                        </View>
                                    ))}
                                </View>
                            </Accordion.Content>
                        </Accordion.Item>
                    </Accordion>
                </View>
            </ScrollView>

            {/* Task Completed Dialog with Database EndTime Subtraction Breakdown */}
            <Dialog open={completionModalOpen} onOpenChange={setCompletionModalOpen}>
                <Dialog.Content className="gap-4">
                    <View className="items-center gap-2">
                        <View className="h-14 w-14 rounded-full bg-success/15 items-center justify-center">
                            <CheckIcon size={28} color="#16a34a" />
                        </View>
                        <Dialog.Title className="text-xl font-bold text-center">
                            Tahniah! Tugas Selesai
                        </Dialog.Title>
                        <Dialog.Description className="text-center text-sm">
                            Rekod waktu kerja telah dikira dan disimpan ke pangkalan data mengikut formula penolakan masa pause.
                        </Dialog.Description>
                    </View>

                    {recordedTimes && (
                        <Card className="p-3 bg-secondary/30 border-border gap-2">
                            <View className="flex-row justify-between items-center">
                                <Text size="xs" muted>Waktu Mula (StartTime)</Text>
                                <Text size="sm" weight="semibold">{recordedTimes.start}</Text>
                            </View>
                            <View className="flex-row justify-between items-center">
                                <Text size="xs" muted>Waktu Siap Sebenar</Text>
                                <Text size="sm" weight="semibold">{recordedTimes.rawEnd}</Text>
                            </View>
                            <View className="flex-row justify-between items-center">
                                <Text size="xs" muted>Tempoh Berhenti (Pause)</Text>
                                <Badge size="xs" variant="secondary" className="text-amber-600">
                                    - {recordedTimes.pauseFormatted}
                                </Badge>
                            </View>
                            <Separator />
                            <View className="flex-row justify-between items-center">
                                <View>
                                    <Text size="xs" weight="bold" className="text-primary">
                                        Waktu Tamat Disimpan (EndTime)
                                    </Text>
                                    <Text size="xs" muted className="text-[10px]">
                                        (Waktu Siap - Tempoh Pause)
                                    </Text>
                                </View>
                                <Text size="base" weight="bold" className="text-primary">
                                    {recordedTimes.adjustedEnd}
                                </Text>
                            </View>
                            <View className="flex-row justify-between items-center">
                                <Text size="xs" muted>Tempoh Kerja Bersih</Text>
                                <Text size="xs" weight="medium">{recordedTimes.activeDurationFormatted}</Text>
                            </View>
                        </Card>
                    )}

                    {/* Self-Rating for clean standard (1-3 stars matching DB CleanRating) */}
                    <View className="gap-1.5 items-center">
                        <Text size="xs" muted>Penilaian Kebersihan Kendiri:</Text>
                        <View className="flex-row gap-2">
                            {[1, 2, 3].map((star) => (
                                <Button
                                    key={star}
                                    variant={cleanRating >= star ? 'primary' : 'outline'}
                                    size="sm"
                                    className="h-9 w-9 rounded-full p-0 items-center justify-center"
                                    onPress={() => setCleanRating(star)}
                                >
                                    <Star size={16} fill={cleanRating >= star ? 'currentColor' : 'none'} />
                                </Button>
                            ))}
                        </View>
                    </View>

                    <Dialog.Footer className="flex-col gap-2 w-full pt-1">
                        <Button
                            className="w-full"
                            size="lg"
                            onPress={() => {
                                setCompletionModalOpen(false);
                                router.replace({
                                    pathname: '/task/[date]',
                                    params: { date: scheduleDate },
                                });
                            }}
                        >
                            Kembali ke Senarai Tugas
                        </Button>
                    </Dialog.Footer>
                </Dialog.Content>
            </Dialog>

            {/* Skip Task Reason Dialog */}
            <Dialog open={skipModalOpen} onOpenChange={setSkipModalOpen}>
                <Dialog.Content className="gap-4">
                    <Dialog.Title className="text-lg font-bold">
                        Langkau Tugasan Ini?
                    </Dialog.Title>
                    <Dialog.Description className="text-sm">
                        Sila pilih sebab mengapa tugasan ini tidak dapat dilaksanakan:
                    </Dialog.Description>

                    <View className="gap-2">
                        {[
                            'Bilik sedang digunakan oleh staf / mesyuarat',
                            'Pintu bilik berkunci / Tiada akses',
                            'Peralatan pembersihan rosak / Kehabisan bahan',
                            'Arahan penyelia untuk penangguhan',
                        ].map((reason) => (
                            <Button
                                key={reason}
                                variant={skipReason === reason ? 'primary' : 'outline'}
                                size="sm"
                                className="justify-start text-left h-auto py-2.5 px-3"
                                onPress={() => setSkipReason(reason)}
                            >
                                <Text
                                    size="xs"
                                    className={skipReason === reason ? 'text-white' : 'text-foreground'}
                                >
                                    {reason}
                                </Text>
                            </Button>
                        ))}
                    </View>

                    <Dialog.Footer className="flex-row justify-end gap-2 pt-2">
                        <Button variant="ghost" onPress={() => setSkipModalOpen(false)}>
                            Batal
                        </Button>
                        <Button variant="destructive" onPress={handleConfirmSkip}>
                            Sahkan Langkau
                        </Button>
                    </Dialog.Footer>
                </Dialog.Content>
            </Dialog>
        </SoftBackground>
    );
}
