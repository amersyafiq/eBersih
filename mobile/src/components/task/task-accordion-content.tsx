import { ClockIcon, PlayIcon } from "lucide-react-native";
import { Badge, Button, Card, Separator, Text } from "panelui-native";
import { View } from "react-native";
import { PingDot } from "../ui/ping-dot";
import { JSX } from "react";
import { AssignmentTask } from "@/src/lib/api/task/types";
import { useRouter } from "expo-router";


function getTaskStatusBadge(status: string) {
    const normalized = (status || '').toLowerCase();
    switch (normalized) {
        case 'completed':
            return <Badge variant="success">Completed</Badge>;
        case 'in progress':
            return <Badge variant="default">In Progress</Badge>;
        case 'paused':
            return <Badge variant="secondary">Paused</Badge>;
        case 'skipped':
            return <Badge variant="destructive">Skipped</Badge>;
        case 'assigned':
        default:
            return <Badge variant="outline">Not Started</Badge>;
    }
}

function getTaskTypeBadge(type: string) {
    const normalized = (type || '').toLowerCase();
    switch (normalized) {
        case 'washroom':
            return (
                <Badge size="xs" variant="secondary" className="bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300">
                    Washroom
                </Badge>
            );
        case 'specialized':
            return (
                <Badge size="xs" variant="secondary" className="bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
                    Specialized
                </Badge>
            );
        case 'general':
        default:
            return <Badge size="xs" variant="secondary">General</Badge>;
    }
}

export function TaskAccordionContent({
    task,
    scheduleDate,
    isPast,
    isClockedIn,
    isCompleted,
    isInProgress,
    isPaused,
    setClockInModalOpen,
}: {
    task: AssignmentTask;
    scheduleDate: string;
    isPast: boolean;
    isClockedIn: boolean;
    isCompleted: boolean;
    isInProgress: boolean;
    isPaused: boolean;
    setClockInModalOpen: (open: boolean) => void;
}) {
    const router = useRouter();
    return (
        <Card
            key={task.AssignID}
            className="p-4 gap-3 bg-secondary/30 border-border"
        >
            <View className="flex-row items-start justify-between gap-2">
                <View className="flex-1 gap-1">
                    <View className="flex-row items-center gap-1 flex-wrap">
                        {getTaskTypeBadge(task.TaskType)}
                        <Badge size="xs" variant="outline">
                            {task.EstimatedDuration} min
                        </Badge>
                    </View>
                    <Text weight="semibold" size="base" className="mt-1">
                        {task.TaskName}
                    </Text>
                </View>
                {getTaskStatusBadge(task.Status)}
            </View>

            {/* Timing details for completed / past tasks */}
            {(task.StartTime || task.EndTime) && (
                <View className="flex-row items-center gap-2 bg-secondary/50 rounded-lg p-2">
                    <ClockIcon size={14} />
                    <Text size="xs" muted>
                        Time: {task.StartTime ?? '--:--'} - {task.EndTime ?? '--:--'}
                    </Text>
                    {task.CleanRating && (
                        <Text size="xs" muted className="ml-auto">
                            Rating: {task.CleanRating}/3
                        </Text>
                    )}
                </View>
            )}

            <Separator />

            {/* Card Actions Footer */}
            <View className="flex-row items-center justify-between">
                <Text size="xs" muted>
                    ID: #{task.AssignID}
                </Text>

                {/* Action buttons based on date and clock-in status */}
                {isPast ? (
                    <Button
                        size="sm"
                        variant="outline"
                        onPress={() =>
                            router.push({
                                pathname: '/task/detail',
                                params: { id: String(task.AssignID), date: scheduleDate },
                            })
                        }
                    >
                        Lihat Butiran
                    </Button>
                ) : (
                    <View className="flex-row gap-2">
                        {!isClockedIn ? (
                            <Button
                                size="sm"
                                variant="outline"
                                onPress={() => setClockInModalOpen(true)}
                            >
                                Clock In First
                            </Button>
                        ) : isCompleted ? (
                            <Button
                                size="sm"
                                variant="ghost"
                                onPress={() =>
                                    router.push({
                                        pathname: '/task/detail',
                                        params: { id: String(task.AssignID), date: scheduleDate },
                                    })
                                }
                            >
                                Lihat Butiran
                            </Button>
                        ) : isInProgress || isPaused ? (
                            <Button
                                size="sm"
                                className="rounded-full"
                                onPress={() =>
                                    router.push({
                                        pathname: '/task/detail',
                                        params: { id: String(task.AssignID), date: scheduleDate },
                                    })
                                }
                            >
                                <View className="flex-row items-center gap-1.5">
                                    <PingDot />
                                    <Text size="sm" className="text-white font-medium">
                                        Sambung Tugas
                                    </Text>
                                </View>
                            </Button>
                        ) : (
                            <Button
                                size="sm"
                                className="rounded-full"
                                onPress={() =>
                                    router.push({
                                        pathname: '/task/detail',
                                        params: { id: String(task.AssignID), date: scheduleDate },
                                    })
                                }
                            >
                                <View className="flex-row items-center gap-1.5">
                                    <PlayIcon size={14} />
                                    <Text size="sm" className="text-white font-medium">
                                        Start Task
                                    </Text>
                                </View>
                            </Button>
                        )}
                    </View>
                )}
            </View>
        </Card>
    );
}