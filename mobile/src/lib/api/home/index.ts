import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/src/lib/api/client';
import { CleanerSchedulesResponse, HomeStatsResponse } from './types';

export function useHomeStats() {
    return useQuery({
        queryKey: ["task_completed"],
        queryFn: ({ signal }) =>
            apiClient<HomeStatsResponse>('/cleaner/task-completed', { signal }),
        staleTime: 1000 * 60 * 2, // 2 minutes
    });
}

export function useRecentSchedules(limit: number) {
    return useQuery({
        queryKey: ["cleaner_schedules"],
        queryFn: ({ signal }) =>
            apiClient<CleanerSchedulesResponse[]>(`/cleaner/schedules?limit=${limit}`, { signal }),
    });
}
