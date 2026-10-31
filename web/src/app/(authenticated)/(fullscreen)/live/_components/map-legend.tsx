"use client";

import { Card, CardHeader } from "@/src/components/tailgrids/core/card";
import { Spinner } from "@/src/components/tailgrids/core/spinner";
import { getZoneColor, type ZoneColor } from "@/src/utils/zoneColors";

interface Zone {
    ZoneCode: string;
    ZoneName: string;
}

export default function MapLegend({
    zones,
    isLoading,
    zoneColorMap,
}: {
    zones?: Zone[];
    isLoading: boolean;
    zoneColorMap: Map<string, ZoneColor>;
}) {
    return (
        <Card className="absolute bottom-5 left-5 z-20 flex flex-col bg-white/65 backdrop-blur-lg">
            {isLoading ? (
                <Spinner className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" />
            ) : (
                <>
                    <CardHeader className="mb-1">
                        <h3 className="text-sm font-medium leading-tight text-title-50">MAP LEGEND &amp; ZONES</h3>
                        <p className="text-xs font-light text-gray-500">v1.0</p>
                    </CardHeader>
                    <div className="grid grid-cols-2 gap-1 py-1">
                        {zones?.map((zone) => {
                            const { fill, stroke } = getZoneColor(zone.ZoneCode, zoneColorMap);
                            return (
                                <div
                                    key={zone.ZoneCode}
                                    className="flex items-center gap-2 rounded-lg border border-base-200 bg-white p-1 px-2"
                                >
                                    <div className="flex h-full items-center">
                                        <div
                                            className="h-3 w-3 rounded-full border"
                                            style={{ backgroundColor: fill, borderColor: stroke }}
                                        />
                                    </div>
                                    <div className="flex flex-col">
                                        <h3 className="text-xs font-medium">Zone {zone.ZoneCode}</h3>
                                        <p className="text-xs text-gray-500">{zone.ZoneName}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </>
            )}
        </Card>
    );
}
