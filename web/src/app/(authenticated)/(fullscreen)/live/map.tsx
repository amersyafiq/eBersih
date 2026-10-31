"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { useCurrentUser } from "@/src/services/api/auth/index";
import { useLiveClock } from "@/src/hooks/useLiveClock";
import { useBuildingStatus, useZones } from "@/src/services/api/live";
import { buildZoneColorMap } from "@/src/utils/zoneColors";
import BuildingTooltip, { type TooltipState } from "./_components/building-tooltip";
import MapBackButton from "./_components/map-back-button";
import MapCanvas from "./_components/map-canvas";
import MapHeader from "./_components/map-header";
import MapLegend from "./_components/map-legend";
import { useDebounce } from "@/src/hooks/useDebounce";
import BuildingDetails from "./_components/building-details";
import { SelectedBuilding } from "./types";

const CAMPUS_MAP_FILES: Record<string, { buildings: string; boundary: string }> = {
    "": {
        buildings: "",
        boundary: "",
    },
    "B01": {
        buildings: "/map/UITM_SHAHALAM_BUILDINGS.geojson",
        boundary: "/map/UITM_SHAHALAM_BOUNDARY.geojson",
    },
};

export default function RegionLabelsMap() {
    const router = useRouter();
    const { data: user, isLoading, isError } = useCurrentUser();

    const [geoData, setGeoData] = useState<GeoJSON.FeatureCollection | null>(null);
    const [boundaryData, setBoundaryData] = useState<GeoJSON.FeatureCollection | null>(null);
    const [tooltip, setTooltip] = useState<TooltipState>({
        visible: false,
        x: 0,
        y: 0,
        name: "",
    });
    const containerRef = useRef<HTMLDivElement>(null);
    const redirectedRef = useRef(false);

    const now = useLiveClock();
    const time = now.toLocaleTimeString("en-MY", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
    });

    const campusCode = user?.campus?.CampusCode ?? null;

    // For Zones
    const { data: zones, isLoading: isLoadingZone } = useZones(campusCode);
    const zoneColorMap = useMemo(
        () => buildZoneColorMap((zones ?? []).map((zone) => ({ zoneCode: zone.ZoneCode }))),
        [zones],
    );

    // const TEST_SCHEDULE_DATE = "2026-09-19";
    // const [selectedDate, setSelectedDate] = useState<Date>(() => {
    //     const [year, month, day] = TEST_SCHEDULE_DATE.split("-").map(Number);
    //     return new Date(year, month - 1, day);
    // });
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const schedule_date = useMemo(() => {
        const year = selectedDate.getFullYear();
        const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
        const day = String(selectedDate.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }, [selectedDate]);
    const isToday = useMemo(() => {
        const today = new Date();
        return (
            selectedDate.getDate() === today.getDate() &&
            selectedDate.getMonth() === today.getMonth() &&
            selectedDate.getFullYear() === today.getFullYear()
        );
    }, [selectedDate]);
    const handlePrevDay = () => { setSelectedDate(prev => new Date(prev.getFullYear(), prev.getMonth(), prev.getDate() - 1)); };
    const handleNextDay = () => {
        if (isToday) return;
        setSelectedDate(prev => new Date(prev.getFullYear(), prev.getMonth(), prev.getDate() + 1));
    };
    const debounced_schedule_date = useDebounce(schedule_date, 500);

    const { data: buildingStatus, isLoading: isLoadingBuildingStatus } = useBuildingStatus(debounced_schedule_date);

    const [selectedBuilding, setSelectedBuilding] = useState<SelectedBuilding | null>(null);

    useEffect(() => {
        if (isLoading) return;
        if (redirectedRef.current) return;

        if (isError || !user?.campus) {
            redirectedRef.current = true;
            toast.error("No campus information available for your account.");
            router.push("/overview");
            return;
        }

        const files = CAMPUS_MAP_FILES[user.campus.CampusCode ?? ""];
        if (!files) {
            redirectedRef.current = true;
            toast.error(`No campus map available for "${user.campus}".`);
            router.push("/overview");
            return;
        }

        fetch(files.buildings)
            .then((res) => {
                if (!res.ok) throw new Error(`Failed to fetch campus GeoJSON: ${res.status}`);
                return res.json();
            })
            .then(setGeoData)
            .catch((err) => {
                console.error(err);
                toast.error("Failed to load campus building data.");
            });

        fetch(files.boundary)
            .then((res) => {
                if (!res.ok) throw new Error(`Failed to fetch boundary GeoJSON: ${res.status}`);
                return res.json();
            })
            .then(setBoundaryData)
            .catch((err) => {
                console.error(err);
                toast.error("Failed to load campus boundary data.");
            });
    }, [isLoading, isError, user, router]);

    if (isLoading) {
        return (
            <div className="flex h-full w-full flex-col items-center justify-center gap-3">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-primary-500" />
                <MapBackButton className="shadow-lg flex items-center gap-1 rounded-lg border border-base-200 bg-white px-2 py-1 text-sm font-medium text-text-100 transition hover:bg-background-soft-100 hover:text-text-50" />
            </div>
        );
    }

    return (
        <div ref={containerRef} className="relative h-full w-full">
            {isLoadingBuildingStatus ? (
                <div className="flex h-full w-full flex-col items-center justify-center bg-card-background rounded-xl border border-base-200 shadow-sm">
                    <div className="flex flex-col items-center gap-2">
                        <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-primary-500" />
                        <p className="text-xs font-medium text-gray-500">Fetching building status</p>
                    </div>
                </div>
            ) : (
                <MapCanvas
                    geoData={geoData}
                    boundaryData={boundaryData}
                    zoneColorMap={zoneColorMap}
                    containerRef={containerRef}
                    setTooltip={setTooltip}
                    buildingStatus={buildingStatus ?? undefined}
                    setSelectedBuilding={setSelectedBuilding}
                />
            )}

            {/* Static Components remain mounted, interactive, and visible */}
            <BuildingTooltip
                tooltip={tooltip}
                zoneColorMap={zoneColorMap}
                isLoadingBuildingStatus={isLoadingBuildingStatus}
            />

            <MapBackButton className="absolute left-5 top-5 z-20 shadow-lg flex items-center gap-1 rounded-lg border border-base-200 bg-white px-2 py-2 text-sm font-medium text-text-100 transition hover:bg-background-soft-100 hover:text-text-50" />

            <MapHeader
                campusName={user?.campus?.CampusName}
                time={time}
                now={now}
                selectedDate={selectedDate}
                isToday={isToday}
                handlePrevDay={handlePrevDay}
                handleNextDay={handleNextDay}
            />

            <MapLegend zones={zones} isLoading={isLoadingZone} zoneColorMap={zoneColorMap} />

            {selectedBuilding && (
                <BuildingDetails
                    buildingCode={selectedBuilding.code}
                    buildingName={selectedBuilding.name}
                    scheduleDate={debounced_schedule_date}
                    onClose={() => setSelectedBuilding(null)}
                />
            )}
        </div>
    );
}
