import { Text, ClockIcon, Badge } from "panelui-native";
import { View } from "react-native";

export function TaskHeader({ 
    scheduleDate,
    scheduleData,
    spaces,
    totalTasks,
    formatDisplayDate
}: {
    scheduleDate: string;
    scheduleData: any;
    spaces: any[];
    totalTasks: number;
    formatDisplayDate: (dateStr: string) => string;
}) {
    return (
        <View className="gap-2 mt-2">

            <Text weight="bold" className="text-2xl leading-tight mt-3">
                {formatDisplayDate(scheduleDate)}
            </Text>

            <View className="flex-row items-center gap-1">
                <Badge size="sm" variant="secondary" className="px-2 py-1">
                    {scheduleData?.ZoneName ?? 'Zon Tugasan'}
                </Badge>
                <Badge size="sm" variant="info" className="px-2 py-1">
                    {spaces.length ?? '0'} Spaces
                </Badge>
                <Badge size="sm" variant="warning" className="px-2 py-1">
                    {totalTasks ?? '0'} Tasks
                </Badge>
            </View>
        </View>
    );
}