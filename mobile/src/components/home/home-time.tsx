import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Text } from 'panelui-native';
import { Badge } from 'panelui-native/components/badge';
import { PingDot } from '@/src/components/ui/ping-dot';

type ShiftStatus = {
    label: string;
    isActive: boolean;
};

const MONTHS = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

function formatOrdinalDate(date: Date): string {
    const day = date.getDate();
    const month = MONTHS[date.getMonth()];
    const year = date.getFullYear();

    const remainder100 = day % 100;
    let suffix = 'th';
    if (remainder100 < 11 || remainder100 > 13) {
        if (day % 10 === 1) suffix = 'st';
        else if (day % 10 === 2) suffix = 'nd';
        else if (day % 10 === 3) suffix = 'rd';
    }

    return `${day}${suffix} ${month} ${year}`;
}

function getShiftStatus(date: Date): ShiftStatus {
    const totalMinutes = date.getHours() * 60 + date.getMinutes();

    const START_OF_DAY = 7 * 60 + 30;  // 7:30 AM (450)
    const AFTERNOON_AT = 12 * 60;      // 12:00 PM (720)
    const EVENING_AT = 14 * 60 + 30;   // 2:30 PM (870)
    const END_OF_DAY = 16 * 60 + 30;   // 4:30 PM (990)

    // Before 7:30 AM or after 4:30 PM -> Inactive (gray dot)
    if (totalMinutes < START_OF_DAY || totalMinutes > END_OF_DAY) {
        return { label: 'Off shift', isActive: false };
    }

    if (totalMinutes < AFTERNOON_AT) {
        return { label: 'Morning shift', isActive: true };
    }

    if (totalMinutes < EVENING_AT) {
        return { label: 'Afternoon shift', isActive: true };
    }

    return { label: 'Evening shift', isActive: true };
}

export function ShiftStatusPill() {
    const [now, setNow] = useState(() => new Date());

    // Refresh every 60s so shift & dot update automatically while the app stays open
    useEffect(() => {
        const interval = setInterval(() => {
            setNow(new Date());
        }, 60_000);

        return () => clearInterval(interval);
    }, []);

    const formattedDate = formatOrdinalDate(now);
    const { label, isActive } = getShiftStatus(now);

    return (
        <View className="border border-border bg-background rounded-full px-4.5 py-2 flex flex-row items-center gap-2">
            {isActive ? (
                <PingDot />
            ) : (
                <View className="h-2.5 w-2.5 rounded-full bg-muted-foreground/40" />
            )}

            <View>
                <Text size="sm" weight="medium">
                    {formattedDate}
                </Text>
                <Badge size="xs" variant="secondary">
                    {label}
                </Badge>
            </View>
        </View>
    );
}
