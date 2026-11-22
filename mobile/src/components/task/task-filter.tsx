import { MapPin } from "lucide-react-native";
import { Button, Card, Chip, Text } from "panelui-native";
import { ScrollView, View } from "react-native";

export function TaskFilter({ 
    spaces,
    selectedSpace,
    setSelectedSpace,
    isLoading,
}: {
    spaces: any[];
    selectedSpace: string | null;
    setSelectedSpace: (space: string | null) => void;
    isLoading: boolean;
}) {
    return (
        <>
            {!isLoading && spaces.length > 0 && (
                <View className="gap-2">
                    <View className="flex-row items-center justify-between">
                        <View className="flex-row items-center gap-2">
                            <Text size="sm" weight="semibold" muted className="uppercase tracking-wider">
                                Select Space
                            </Text>
                            <View className="min-w-6 h-6 items-center justify-center rounded-full border border-border px-1.5">
                                <Text size="xs" weight="semibold">{spaces.length}</Text>
                            </View>
                        </View>
                        {selectedSpace && (
                            <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 px-2"
                                onPress={() => setSelectedSpace(null)}
                            >
                                <Text size="xs" className="text-primary font-medium">Show All</Text>
                            </Button>
                        )}
                    </View>

                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{ gap: 8 }}
                    >
                        <Chip
                            variant="outline"
                            className="px-5"
                            selected={selectedSpace === null}
                            onPress={() => setSelectedSpace(null)}
                        >
                            All
                        </Chip>
                        {spaces.map((s) => (
                            <Chip
                                variant="outline"
                                key={s.SpaceCode}
                                selected={selectedSpace?.toLowerCase() === s.SpaceCode.toLowerCase()}
                                onPress={() => setSelectedSpace(s.SpaceCode)}
                            >
                                {s.SpaceName}
                            </Chip>
                        ))}
                    </ScrollView>
                </View>
            )}

            {/* Filter Alert if a specific room was scanned via QR */}
            {selectedSpace && (
                <Card className="p-3 py-2 bg-primary/5 border-primary/20 flex-row items-center justify-between">
                    <View className="flex-row items-center gap-2 flex-1">
                        <MapPin size={16} color="currentColor" />
                        <Text size="sm" weight="medium">
                            Filtered by Space:
                        </Text>
                        <View className="min-w-6 h-6 items-center justify-center rounded-full border border-border px-2">
                            <Text size="xs" weight="semibold">{selectedSpace}</Text>
                        </View>
                    </View>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2"
                        onPress={() => setSelectedSpace(null)}
                    >
                        Reset
                    </Button>
                </Card>
            )}
        </>
    );
}