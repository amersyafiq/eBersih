import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/src/lib/api/client';
import {
    CleanerScheduleDetailResponse,
    CleanerTaskItem,
    AssignmentUpdatePayload,
    ClockInResponse,
} from './types';


export function useScheduleTasks(date: string) {
    return useQuery({
        queryKey: ['cleaner_schedule_tasks', date],
        queryFn: ({ signal }) =>
            apiClient<CleanerScheduleDetailResponse>(`/task/schedule/${date}`, { signal }),
        enabled: !!date,
    });
}


export function useTaskDetail(assignId: number) {
    return useQuery({
        queryKey: ['cleaner_task_detail', assignId],
        queryFn: ({ signal }) =>
            apiClient<CleanerTaskItem>(`/task/assignment/${assignId}`, { signal }),
        enabled: !!assignId && !isNaN(assignId),
    });
}


export function useUpdateTaskAssignment() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            assignId,
            data,
        }: {
            assignId: number;
            data: AssignmentUpdatePayload;
        }) =>
            apiClient<CleanerTaskItem>(`/task/assignment/${assignId}`, {
                method: 'PATCH',
                body: JSON.stringify(data),
            }),
        onSuccess: (_result, variables) => {
            queryClient.invalidateQueries({ queryKey: ['cleaner_schedule_tasks'] });
            queryClient.invalidateQueries({ queryKey: ['cleaner_task_detail', variables.assignId] });
            queryClient.invalidateQueries({ queryKey: ['task_completed'] });
            queryClient.invalidateQueries({ queryKey: ['cleaner_schedules'] });
        },
    });
}


export function useClockIn() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (attendanceDate?: string) =>
            apiClient<ClockInResponse>('/task/clock-in', {
                method: 'POST',
                body: JSON.stringify(attendanceDate ? { AttendanceDate: attendanceDate } : {}),
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['cleaner_schedule_tasks'] });
            queryClient.invalidateQueries({ queryKey: ['cleaner_schedules'] });
        },
    });
}
