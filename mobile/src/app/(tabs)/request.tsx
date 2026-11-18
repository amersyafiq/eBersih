import { Image, View, Text, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeMode } from 'panelui-native';
import { SoftBackground } from '@/src/components/ui/soft-background';

export default function RequestScreen() {
    const insets = useSafeAreaInsets();
    const { mode } = useThemeMode();

    return (
        <SoftBackground
            className="flex-1"
            style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
        >
            <ScrollView
                className="flex-1"
                contentContainerStyle={{
                    paddingTop: insets.top + 16,
                    paddingBottom: 40,
                    paddingHorizontal: 16,
                    gap: 28,
                }}
            >
                <Text>Test</Text>
            </ScrollView>
        </SoftBackground>
    );
}
