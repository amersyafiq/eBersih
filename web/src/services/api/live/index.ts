import { useQuery } from "@tanstack/react-query";
import { BuildingDetailsProps, StatusProps, ZoneProps } from "./types";
import { useEffect, useState } from "react";

export function useZones(campus_code: string | null) {
    return useQuery<ZoneProps[], Error>({
        queryKey: ["zones", campus_code],
        queryFn: async (): Promise<Array<ZoneProps>> => {
            const res = await fetch(`/api/facility/campus/${campus_code}/zone`)
            if (!res.ok) throw new Error(`Failed to fetch zones for ${campus_code}`)
            return await res.json();
        }
    });
}

export function useBuildingStatus(schedule_date: string | null) {
    const [pollingInterval, setPollingInterval] = useState<number | false>(false);

    useEffect(() => {
        if (!schedule_date) return;

        const checkShouldPoll = () => {
            const now = new Date();
            const requested_date = new Date(schedule_date);

            // Check if the requested date is today
            const isToday = requested_date.toDateString() === now.toDateString();

            // Check if current time is between 07:30 and 17:30
            const currentHour = now.getHours();
            const currentMinute = now.getMinutes();
            const timeInMinutes = (currentHour * 60) + currentMinute;
            
            const startTime = (7 * 60) + 30;  // 07:30 in minutes
            const endTime = (17 * 60) + 30;   // 17:30 in minutes

            const isWithinWorkingHours = timeInMinutes >= startTime && timeInMinutes <= endTime;

            // Enable polling only if both conditions are met
            if (isToday && isWithinWorkingHours) {
                setPollingInterval(15000); // Poll every 15 seconds
            } else {
                setPollingInterval(false); // Disable polling
            }
        };

        // Run check immediately on mount or date change
        checkShouldPoll();

        // Re-evaluate every 1 minute in case the user leaves the tab open 
        // and the time crosses 07:30 (starts polling) or 17:30 (stops polling)
        const intervalId = setInterval(checkShouldPoll, 60000);
        
        return () => clearInterval(intervalId);
    }, [schedule_date]);
    
    return useQuery<StatusProps[], Error>({
        queryKey: ["status", schedule_date],
        queryFn: async ({ signal }): Promise<Array<StatusProps>> => {
            const res = await fetch(`/api/live/${schedule_date}`, { signal })
            if (!res.ok) throw new Error(`Failed to fetch building status for ${schedule_date}`)
            return await res.json();
        },
        gcTime: 0, // no cache
        enabled: !!schedule_date, // Only run if campusCode is available
        refetchInterval: pollingInterval, // Polling if true
    })
}

export function useBuildingDetails(building_code: string | null, schedule_date: string | null) {
    return useQuery<BuildingDetailsProps, Error>({
        queryKey: ["building_details", building_code, schedule_date],
        queryFn: async ({ signal }) => {
            const res = await fetch(`/api/live/details/${building_code}?schedule_date=${schedule_date}`, { signal })
            if (!res.ok) throw new Error(`Failed to fetch building details`)
            return await res.json();
        },
        enabled: !!building_code && !!schedule_date,
    })
}
