"use client";

import { ClockIcon } from "@/src/utils/icon";
import { Badge } from "@/src/components/tailgrids/core/badge";

export default function MapHeader(
    { 
        campusName, 
        time, 
        now,
        selectedDate, 
        isToday, 
        handlePrevDay, 
        handleNextDay 
    }: { 
        campusName?: string | null; 
        time: string; 
        now: Date;
        selectedDate: Date; 
        isToday: boolean;
        handlePrevDay: () => void;
        handleNextDay: () => void;
    }) {
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const isLive = isToday && currentMinutes >= 7 * 60 + 30 && currentMinutes < 16 * 60 + 30;

    return (
        <div className="absolute z-20 top-15 lg:top-5 left-1/2 -translate-x-1/2 w-max backdrop-blur-lg bg-background-white-primary/65 shadow-lg flex items-center justify-around gap-2 rounded-full border border-base-200 px-3 py-2 text-sm font-medium text-text-100">
            
            <p className="text-sm font-semibold ml-2 text-text-primary">
                {campusName}
            </p>

            {/* Date Stepper Controls */}
            <div className="flex items-center gap-2 rounded-full px-2 py-1 shadow-sm border border-base-200 bg-background-white-primary">
                <button 
                    onClick={handlePrevDay}
                    className="hover:bg-gray-100 rounded-full text-gray-500 transition-colors"
                    aria-label="Previous Day"
                >
                    <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
                </button>
                
                <span className="w-24 text-center text-xs font-semibold">
                    {isToday ? "Today" : selectedDate.toLocaleDateString('en-MY', { day: '2-digit', month: 'short', year: 'numeric' })}
                </span>

                <button 
                    onClick={handleNextDay}
                    disabled={isToday}
                    className={`rounded-full transition-colors ${isToday ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-100'}`}
                    aria-label="Next Day"
                >
                    <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                </button>
            </div>


            {/* Only show the live pulsing indicator during today's operating hours */}
            {isLive ? (
                <Badge color="success" className="px-2 text-emerald-500 gap-1 ml-1 flex items-center" size="md">
                    <div className="relative flex h-2 w-2 items-center justify-center mr-1">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
                        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    </div>
                    <ClockIcon className="w-3.5 h-3.5 mr-0.5" />
                    {time}
                </Badge>
            ) : (
                <Badge color="gray" className="px-4 text-text-200 ml-1 flex items-center bg-background-white-primary border-base-200" size="md">
                    Ended
                </Badge>
            )}
        </div>
    );
}
