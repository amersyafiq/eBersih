import { SignIn } from '@/src/components/auth/auth-form';
import { GoogleIcon } from '@/src/components/ui/icons';
import { SoftBackground } from '@/src/components/ui/soft-background';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Button } from 'panelui-native/components/button';
import React from 'react';
import { View, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const ebersihLogo = require('@/assets/icons/eBERSIH_logo.svg');
const ebersihText = require('@/assets/icons/eBERSIH_text.svg');

export default function SignInScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();

    return (
        <SoftBackground style={{ flex: 1 }}>
            <View
                className="flex-1 justify-center items-center"
                style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
            >
                <View className='"w-full w-full p-10 gap-7'>

                    <View className="mb-6 items-center">
                        <Image
                            source={ebersihText}
                            style={{ width: 192, height: 48 }}
                            contentFit="contain"
                            tintColor="#000000"
                        />
                        <Text className="text-sm text-gray-500 mt-1 text-center">Welcome back! Please sign in with UiTM Official Email.</Text>
                    </View>

                    <Button variant="social" fullWidth startContent={<GoogleIcon size={18} />}>
                        Continue with Google
                    </Button>

                    <View className="mt-5 flex-row items-center gap-5">
                        <View className="h-px flex-1 bg-border" />
                        <Text> or </Text>
                        <View className="h-px flex-1 bg-border" />
                    </View>

                    <SignIn />
                </View>
            </View>
        </SoftBackground>
    );
}