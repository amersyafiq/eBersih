// src/lib/api/auth/index.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { apiClient } from '../client';
import { saveSession, clearSession, getAccessToken, } from '@/src/lib/api/secure-token';
import { CurrentUserProps, LoginPayload, LoginResponse } from './types';
import { useToast } from 'panelui-native';

const { toast } = useToast();


export function useLogin() {
    const queryClient = useQueryClient();
    const router = useRouter();

    return useMutation({
        mutationFn: (payload: LoginPayload) =>
            apiClient<LoginResponse>('/auth/login', {
                method: 'POST',
                body: JSON.stringify(payload),
            }),

        onSuccess: async (data) => {
            await saveSession(data.access_token, data.refresh_token);
            queryClient.invalidateQueries({ queryKey: ["currentUser"] });
            toast.show({
                variant: 'success',
                label: 'Welcome back',
                description: 'Logged in successfully',
            })
            router.replace('/(tabs)');
        },
        onError: (error) => {
            toast.show({
                variant: 'destructive',
                label: 'Login failed',
                description: 'Please try again.',
            })
        },
    });
}

export function useCurrentUser() {
    return useQuery({
        queryKey: ["currentUser"],
        queryFn: async ({ signal }) => {
            return apiClient<CurrentUserProps>('/user/me', { signal });
        },
        staleTime: 1000 * 60 * 5,
    });
}

export function useLogout() {
    const queryClient = useQueryClient();
    const router = useRouter();

    return async () => {
        await clearSession();
        queryClient.clear();
        router.replace('/onboarding');
    };
}
