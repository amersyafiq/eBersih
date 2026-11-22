export interface HomeStatsResponse {
    tasks_completed_week: number;
}

export interface CleanerSchedulesResponse {
    ScheduleDate: string;
    ZoneCode: string;
    isToday: boolean;
    isAttended: boolean;
    taskCount: number;
    spaceCount: number;
}