import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions, BarcodeScanningResult } from 'expo-camera';
import {
    Badge,
    Button,
    Card,
    Dialog,
    Input,
    Text,
    ChevronLeftIcon,
    CheckIcon,
    AlertTriangleIcon,
} from 'panelui-native';
import {
    Flashlight,
    FlashlightOff,
    Camera,
    Keyboard,
    MapPin,
    ArrowRight,
    QrCode,
} from 'lucide-react-native';
import { useScheduleTasks } from '@/src/lib/api/task';
import { SpaceGroup } from '@/src/lib/api/task/types';

interface ParsedSpaceQR {
    spaceCode: string;
    spaceName?: string;
    zone?: string;
}

function parseSpaceQRCode(rawData: string): ParsedSpaceQR | null {
    if (!rawData) return null;

    try {
        const parsed = JSON.parse(rawData);
        if (typeof parsed === 'object' && parsed !== null) {
            const spaceCode =
                parsed.space_code ||
                parsed.space ||
                parsed.spaceCode ||
                parsed.code ||
                parsed.id;

            if (spaceCode && typeof spaceCode === 'string') {
                return {
                    spaceCode: spaceCode.trim(),
                    spaceName: parsed.space_name || parsed.name,
                    zone: parsed.zone,
                };
            }
        }
    } catch {
        // Raw text space code format fallback (e.g. "R-101" or "T-101")
        const trimmed = rawData.trim();
        if (/^[a-zA-Z0-9\-_]{2,15}$/.test(trimmed)) {
            return { spaceCode: trimmed };
        }
    }

    return null;
}

export default function ScanQrScreen() {
    const { date } = useLocalSearchParams<{ date: string }>();
    const insets = useSafeAreaInsets();
    const router = useRouter();

    const [permission, requestPermission] = useCameraPermissions();
    const [torchOn, setTorchOn] = useState(false);
    const [scanned, setScanned] = useState(false);
    const [detectedSpace, setDetectedSpace] = useState<{
        space: SpaceGroup | null;
        code: string;
    } | null>(null);

    // Manual code input dialog fallback
    const [manualModalOpen, setManualModalOpen] = useState(false);
    const [manualCode, setManualCode] = useState('');

    const scheduleDate = date || new Date().toISOString().split('T')[0];
    const { data: scheduleData } = useScheduleTasks(scheduleDate);
    const spaces = scheduleData?.spaces || [];

    const handleBarcodeScanned = (result: BarcodeScanningResult) => {
        if (scanned) return;
        setScanned(true);

        const parsed = parseSpaceQRCode(result.data);
        if (parsed) {
            const foundSpace =
                spaces.find(
                    (s) => s.SpaceCode.toLowerCase() === parsed.spaceCode.toLowerCase()
                ) || null;

            setDetectedSpace({
                space: foundSpace,
                code: parsed.spaceCode,
            });
        } else {
            setDetectedSpace({
                space: null,
                code: result.data.slice(0, 20),
            });
        }
    };

    const handleConfirmSpace = () => {
        if (!detectedSpace) return;
        router.replace({
            pathname: '/task/[date]',
            params: { date: scheduleDate, space: detectedSpace.code },
        });
    };

    const handleManualSubmit = () => {
        if (!manualCode.trim()) return;
        setManualModalOpen(false);
        const code = manualCode.trim().toUpperCase();
        const found = spaces.find((s) => s.SpaceCode.toLowerCase() === code.toLowerCase()) || null;
        setDetectedSpace({ space: found, code });
    };

    const handleRescan = () => {
        setDetectedSpace(null);
        setScanned(false);
    };

    // Permission handling screens
    if (!permission) {
        return (
            <View className="flex-1 bg-black items-center justify-center p-6">
                <Text className="text-white">Memeriksa kebenaran kamera...</Text>
            </View>
        );
    }

    if (!permission.granted) {
        return (
            <View className="flex-1 bg-background items-center justify-center p-6 gap-4" style={{ paddingTop: insets.top }}>
                <View className="h-20 w-20 rounded-full bg-primary/10 items-center justify-center">
                    <Camera size={36} color="currentColor" />
                </View>
                <Text size="2xl" weight="bold" className="text-center">
                    Camera permission required
                </Text>
                <Text muted className="text-center text-sm px-4">
                    eBersih requires camera access to scan QR code affixes at the door of each space. 
                </Text>
                <Button className="w-full mt-4" size="lg" onPress={requestPermission}>
                    Allow camera access
                </Button>
                <Button variant="ghost" className="w-full" onPress={() => router.back()}>
                    Return
                </Button>
            </View>
        );
    }

    return (
        <View className="flex-1 bg-black">
            {/* Live Camera Viewfinder */}
            <CameraView
                style={StyleSheet.absoluteFill}
                facing="back"
                enableTorch={torchOn}
                barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
                onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
            />

            {/* Viewfinder Target Frame Overlay */}
            <View className="flex-1 items-center justify-center pointer-events-none">
                <View className="w-72 h-72 border-2 border-white/60 rounded-3xl relative items-center justify-center">
                    {/* Corner Target Markers */}
                    <View className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-2xl" />
                    <View className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-2xl" />
                    <View className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-2xl" />
                    <View className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-2xl" />

                    <View className="bg-black/40 px-3 py-1.5 rounded-full flex-row items-center gap-1.5">
                        <QrCode size={14} color="#ffffff" />
                        <Text size="xs" className="text-white font-medium">
                            Point the camera to the QR code
                        </Text>
                    </View>
                </View>
            </View>

            {/* Top Navigation Bar Overlay */}
            <View
                className="absolute top-0 left-0 right-0 px-5 flex-row items-center justify-between"
                style={{ paddingTop: insets.top + 10 }}
            >
                <Button
                    variant="outline"
                    className="shadow-none border-white/20 bg-black/40 rounded-full h-12 w-12 items-center justify-center"
                    onPress={() => router.back()}
                >
                    <ChevronLeftIcon size={20} color="#ffffff" />
                </Button>

                <View className="bg-black/50 px-4 py-1.5 rounded-full border border-white/10">
                    <Text size="sm" weight="semibold" className="text-white">
                        Scan QR code
                    </Text>
                </View>

                {/* Torch / Flashlight Toggle */}
                <Button
                    variant="outline"
                    className="shadow-none border-white/20 bg-black/40 rounded-full h-12 w-12 items-center justify-center"
                    onPress={() => setTorchOn(!torchOn)}
                >
                    {torchOn ? (
                        <Flashlight size={20} color="#facc15" />
                    ) : (
                        <FlashlightOff size={20} color="#ffffff" />
                    )}
                </Button>
            </View>

            {/* Bottom Controls / Manual Code Entry */}
            <View
                className="absolute bottom-0 left-0 right-0 px-6 pb-6 gap-3 items-center"
                style={{ paddingBottom: insets.bottom + 20 }}
            >
                <Button
                    variant="outline"
                    className="bg-black/60 border-white/30 rounded-full px-5 py-2.5 flex-row items-center gap-2"
                    onPress={() => setManualModalOpen(true)}
                >
                    <Keyboard size={18} color="#ffffff" />
                    <Text size="sm" className="text-white font-medium">
                        Enter Code Manually
                    </Text>
                </Button>
            </View>

            {/* Scanned Result Confirmation Dialog */}
            <Dialog open={detectedSpace !== null} onOpenChange={(open) => !open && handleRescan()}>
                <Dialog.Content className="gap-4">
                    {detectedSpace?.space ? (
                        <>
                            <View className="items-center gap-2">
                                <View className="h-14 w-14 rounded-full bg-success/15 items-center justify-center">
                                    <CheckIcon size={28} color="#16a34a" />
                                </View>
                                <Dialog.Title className="text-xl text-center font-bold">
                                    Space Found!
                                </Dialog.Title>
                                <Dialog.Description className="text-center text-sm">
                                    QR Code matches with the assigned facility record today.
                                </Dialog.Description>
                            </View>

                            <Card className="p-4 bg-secondary/30 border-border gap-2">
                                <View className="flex-row items-center justify-between">
                                    <Badge variant="default" size="sm">
                                        {detectedSpace.space.SpaceCode}
                                    </Badge>
                                    <Badge variant="outline" size="xs">
                                        {detectedSpace.space.tasks.length} Tasks
                                    </Badge>
                                </View>
                                <Text size="lg" weight="bold">
                                    {detectedSpace.space.SpaceName}
                                </Text>
                                <Text size="xs" muted>
                                    {detectedSpace.space.FloorName}
                                    {"\n"}{detectedSpace.space.BlockName}
                                </Text>
                            </Card>

                            <Dialog.Footer className="flex-col gap-2 w-full">
                                <Button className="w-full" size="lg" onPress={handleConfirmSpace}>
                                    <View className="flex-row items-center justify-center gap-2">
                                        <Text size="base" className="text-white font-semibold">
                                            See this space tasks
                                        </Text>
                                        <ArrowRight size={18} color="#ffffff" />
                                    </View>
                                </Button>
                                <Button variant="ghost" size="sm" onPress={handleRescan}>
                                    Scan Again
                                </Button>
                            </Dialog.Footer>
                        </>
                    ) : (
                        <>
                            <View className="items-center gap-2">
                                <View className="h-14 w-14 rounded-full bg-destructive/15 items-center justify-center">
                                    <AlertTriangleIcon size={28} />
                                </View>
                                <Dialog.Title className="text-xl text-center font-bold">
                                    Space not found!
                                </Dialog.Title>
                                <Dialog.Description className="text-center text-sm">
                                    Code &quot;{detectedSpace?.code}&quot; is not found in the list of your assigned shift today.
                                </Dialog.Description>
                            </View>

                            <Dialog.Footer className="flex-col gap-2 w-full">
                                <Button variant="outline" className="w-full" onPress={handleRescan}>
                                    Scan other QR Code
                                </Button>
                                <Button
                                    variant="ghost"
                                    onPress={() => router.replace({ pathname: '/task/[date]', params: { date: scheduleDate } })}
                                >
                                    Return
                                </Button>
                            </Dialog.Footer>
                        </>
                    )}
                </Dialog.Content>
            </Dialog>

            {/* Manual Code Input Fallback Dialog */}
            <Dialog open={manualModalOpen} onOpenChange={setManualModalOpen}>
                <Dialog.Content className="gap-4">
                    <Dialog.Title className="text-lg font-bold">
                        Enter Space / Room Code Manually
                    </Dialog.Title>
                    <Dialog.Description className="text-sm">
                        Example of valid code: B0117B03017/0
                    </Dialog.Description>

                    <Input
                        placeholder="Contoh: R-101"
                        value={manualCode}
                        onChangeText={setManualCode}
                        autoCapitalize="characters"
                        autoCorrect={false}
                    />

                    <Dialog.Footer className="flex-row justify-end gap-2">
                        <Button variant="outline" onPress={() => setManualModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button onPress={handleManualSubmit}>
                            Confirm Code
                        </Button>
                    </Dialog.Footer>
                </Dialog.Content>
            </Dialog>
        </View>
    );
}
