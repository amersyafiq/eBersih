import React from "react";
import { Pressable, Text, View } from "react-native";
import { Button } from "panelui-native/components/button";
import { createForm } from "panelui-native/components/form";
import { Input } from "panelui-native/components/input";
import { useLogin } from "@/src/lib/api/auth";
import { Alert, toast, useToast } from "panelui-native";

type SignInValues = {
    email: string;
    password: string;
};

const SignInForm = createForm<SignInValues>();

export function SignIn() {
    const { mutate: login, isPending, error } = useLogin();

    const form = SignInForm.useForm({
        defaultValues: { email: '', password: '' },
        onSubmit: (values) => {
            login(values);
        },
    });

    return (
        <SignInForm form={form}>
            <View className="gap-4">
                <SignInForm.Field
                    name="email"
                    validate={(value) => (value.includes('@') ? undefined : 'Enter a valid email')}
                >
                    {(field) => (
                        <Input
                            label="Email"
                            placeholder="name@example.com"
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoCorrect={false}
                            value={field.value}
                            onChangeText={field.onChange}
                            onBlur={field.onBlur}
                            errorMessage={field.error}
                        />
                    )}
                </SignInForm.Field>

                <SignInForm.Field
                    name="password"
                    validateOn="change"
                    validate={(value) => (value.length >= 6 ? undefined : 'At least 6 characters')}
                >
                    {(field) => (
                        <Input
                            label="Password"
                            placeholder="••••••••"
                            secureTextEntry
                            autoCapitalize="none"
                            value={field.value}
                            onChangeText={field.onChange}
                            onBlur={field.onBlur}
                            errorMessage={field.error}
                        />
                    )}
                </SignInForm.Field>

                <Pressable className="self-end" onPress={() => console.log('Forgot password')}>
                    <Text className="text-xs font-semibold text-[#5750f1]">Forgot Password?</Text>
                </Pressable>

                <Button
                    size="lg"
                    className="w-full mt-2 border-0"
                    style={{ backgroundColor: '#5750f1' }}
                    loading={isPending}
                    disabled={isPending}
                    onPress={form.handleSubmit}
                >
                    {isPending ? 'Signing In...' : 'Sign In'}
                </Button>
            </View>
        </SignInForm>
    );
}