// src/lib/api/auth/index.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { apiClient } from '../client';
import { saveSession, clearSession, getAccessToken, } from '@/src/lib/api/secure-token';
import { CurrentUserProps, LoginPayload, LoginResponse } from './types';

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
            await saveSession(data.access_token, data.refresh_token, data.role);
            queryClient.invalidateQueries({ queryKey: ["currentUser"] });
            router.replace('/(tabs)');
        },
    });
}

export function useCurrentUser() {
    return useQuery({
        queryKey: ["currentUser"],
        queryFn: async ({ signal }) => {
            const token = await getAccessToken();
            if (!token) return null;
            return apiClient<CurrentUserProps>('/auth/me', { signal });
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
        router.replace('/(auth)/sign-in');
    };
}
