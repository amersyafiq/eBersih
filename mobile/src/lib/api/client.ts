// src/lib/api/client.ts
import {
    getAccessToken,
    getRefreshToken,
    saveAccessToken,
    clearSession,
} from '@/src/lib/api/secure-token';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

export class ApiError extends Error {
    status: number;
    constructor(status: number, message: string) {
        super(message);
        this.status = status;
    }
}

// Exported so _layout.tsx can redirect to Sign In when refresh fails
let onSessionExpired: (() => void) | null = null;
export function setOnSessionExpired(callback: () => void) {
    onSessionExpired = callback;
}

// Prevents duplicate /auth/refresh calls if multiple queries 401 at once
let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
    if (refreshPromise) return refreshPromise;

    refreshPromise = (async () => {
        try {
            const refreshToken = await getRefreshToken();
            if (!refreshToken) return null;

            const refreshRes = await fetch(`${API_URL}/auth/refresh`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refresh_token: refreshToken }),
            });

            if (!refreshRes.ok) {
                await clearSession();
                onSessionExpired?.();
                return null;
            }

            const refreshData = await refreshRes.json();
            await saveAccessToken(refreshData.access_token);

            return refreshData.access_token as string;
        } catch {
            return null;
        } finally {
            refreshPromise = null;
        }
    })();

    return refreshPromise;
}

export async function apiClient<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<T> {
    const token = await getAccessToken();

    const headers = new Headers(options.headers);
    if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
        headers.set('Content-Type', 'application/json');
    }
    if (token) {
        headers.set('Authorization', `Bearer ${token}`);
    }

    let response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
    });

    // Skip refresh on login/refresh routes so wrong passwords show normal errors
    const isAuthRoute =
        endpoint.startsWith('/auth/login') || endpoint.startsWith('/auth/refresh');

    if (response.status === 401 && !isAuthRoute) {
        const newAccessToken = await refreshAccessToken();

        if (newAccessToken) {
            headers.set('Authorization', `Bearer ${newAccessToken}`);
            response = await fetch(`${API_URL}${endpoint}`, {
                ...options,
                headers,
            });
        }
    }

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new ApiError(
            response.status,
            errorData.detail || 'Something went wrong'
        );
    }

    if (response.status === 204) {
        return undefined as T;
    }

    return response.json() as Promise<T>;
}
