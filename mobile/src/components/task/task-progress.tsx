import { Badge, Card, CheckCircleIcon, Progress, Text } from "panelui-native";
import { Text as RNText, View } from "react-native";

export function TaskProgress({ totalTasks, completedTasks }: { totalTasks: number; completedTasks: number }) {
    return (
        <Card className="p-5 gap-3 bg-primary/25 border-0 shadow-none">
            <View className="flex-row items-center justify-between">
                <View className="gap-1">
                    <Text className="uppercase tracking-wider text-lg font-semibold leading-0">
                        Task Progression
                    </Text>
                    <Text className="text-lg leading-0 font-bold">
                        {completedTasks} <Text className="font-medium"> / {totalTasks} completed </Text>
                    </Text>
                </View>
                <View className="bg-secondary p-3 rounded-full">
                    <CheckCircleIcon className="size-32" />
                </View>
            </View>

            {/* Progress Bar */}
            <Progress value={Math.round((completedTasks / totalTasks) * 100)} maxValue={totalTasks} className="mt-3 bg-secondary"/>

            <View className="flex-row items-center justify-between">
                <View className="gap-1">
                    <Text className="tracking-wider text-lg font-normal">
                        Not Started
                    </Text>
                </View>

                <View className="items-end">
                    <Badge
                        variant={completedTasks === totalTasks && totalTasks > 0 ? 'success' : 'secondary'}
                        size="md"
                    >
                        {totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0}%
                    </Badge>
                </View>
            </View>
        </Card>

    );
}