import { SpaceGroup } from "@/src/lib/api/task/types";
import { MapPin } from "lucide-react-native";
import { Accordion, Badge, Text } from "panelui-native";
import { View } from "react-native";
import { TaskAccordionContent } from "./task-accordion-content";

export function TaskAccordion({ 
    space,
    allCompleted,
    spaceCompletedCount,
    scheduleDate,
    isPast,
    isClockedIn,
    setClockInModalOpen,
}: { 
    space: SpaceGroup,
    allCompleted: boolean,
    spaceCompletedCount: number,
    scheduleDate: string,
    isPast: boolean,
    isClockedIn: boolean,
    setClockInModalOpen: (open: boolean) => void,
}) {
    return (
        <Accordion.Item key={space.SpaceCode} value={space.SpaceCode}>
            <Accordion.Trigger className="px-4 py-3.5">
                <View className="flex-1 flex-row items-center gap-3">
                    <View className="h-9 w-9 rounded-lg bg-secondary items-center justify-center">
                        <MapPin size={18} />
                    </View>
                    <View className="flex-1">
                        <Text weight="semibold" size="base">
                            {space.SpaceName}
                        </Text>
                        <Text size="xs" muted>
                            {space.SpaceCode}
                            {"\n"}{space.FloorName}
                            {"\n"}{space.BlockName}
                        </Text>
                    </View>
                </View>
                <View className="flex-row items-center gap-2">
                    <Badge
                        size="sm"
                        variant={allCompleted ? 'success' : 'secondary'}
                    >
                        {spaceCompletedCount > 0 ? `${spaceCompletedCount}/${space.tasks.length}` : `${space.tasks.length}`} {space.tasks.length === 1 ? 'Task' : 'Tasks'}
                    </Badge>
                    <Accordion.Indicator />
                </View>
            </Accordion.Trigger>

            <Accordion.Content className="px-4 pt-1 pb-4 gap-2.5">
                {space.tasks.map((task) => {
                    const statusNorm = (task.Status || '').toLowerCase();
                    const isCompleted = statusNorm === 'completed' || statusNorm === 'selesai';
                    const isInProgress = statusNorm === 'inprogress' || statusNorm === 'in_progress';
                    const isPaused = statusNorm === 'paused' || statusNorm === 'ditangguhkan';

                    return (
                        <TaskAccordionContent
                            key={task.AssignID}
                            task={task}
                            scheduleDate={scheduleDate}
                            isPast={isPast}
                            isClockedIn={isClockedIn}
                            isCompleted={isCompleted}
                            isInProgress={isInProgress}
                            isPaused={isPaused}
                            setClockInModalOpen={setClockInModalOpen}
                        />
                    );
                })}
            </Accordion.Content>
        </Accordion.Item>
    );
}