"use client";

import { Badge } from "@/src/components/tailgrids/core/badge";
import { Progress } from "@/src/components/tailgrids/core/progress";
import { StatusProps } from "@/src/services/api/live/types";
import { getZoneColor, ZoneColor } from "@/src/utils/zoneColors";
import { ExpandIcon, UserGroupIcon } from "../icons";
import { TaskIcon } from "@/src/components/common/sidebar/icon";
import { Spinner } from "@/src/components/tailgrids/core/spinner";

export interface TooltipState {
    visible: boolean;
    x: number;
    y: number;
    name: string;
    status?: StatusProps;
}

export default function BuildingTooltip({ tooltip, zoneColorMap, isLoadingBuildingStatus }: { tooltip: TooltipState; zoneColorMap: Map<string, ZoneColor>; isLoadingBuildingStatus: boolean; }) {
    if (!tooltip.visible) return null;
    const { fill, stroke, background } = getZoneColor(tooltip.status?.ZoneCode ?? null, zoneColorMap);
    return (
        <div
            style={{
                position: "absolute",
                left: tooltip.x + 12,
                top: tooltip.y - 10,
                zIndex: 2000,
                pointerEvents: "none",
            }}
            className="rounded-lg bg-tooltip-background px-3 py-2 text-sm leading-5 font-medium text-tooltip-text-color shadow-[0_0_1px_0_rgba(16,24,40,0.25),0_4px_4px_-2px_rgba(16,24,40,0.05)]"
        >
            {tooltip.status && tooltip.status.TotalAssignments != 0 ? (
                <div className="flex flex-col gap-2 p-2 min-w-80">
                    <div className="flex gap-2 text-sm items-center">
                        <Badge
                            style={{ backgroundColor: stroke }}
                            className="text-white font-bold"
                        >
                            ZONE {tooltip.status.ZoneCode}
                        </Badge>
                        <span className="font-medium text-gray-500 flex flex-1">{tooltip.status.BuildingCode}</span>
                        <ExpandIcon />
                    </div>
                    <div className="mb-1">
                        <h3 className="font-bold text-md">{tooltip.name}</h3>
                        <p className="font-normal text-[0.8rem] leading-3.5">{tooltip.status.ZoneName}</p>
                    </div>
                    <div
                        style={{ backgroundColor: background, borderColor: fill }}
                        className="flex flex-col border rounded-lg px-2 py-3"
                    >
                        <div className="flex">
                            <p className="text-xs flex text-gray-500">Daily Clean Progress</p>
                        </div>
                        <Progress barColor={stroke} trackColor={fill} progress={+(tooltip.status.TotalCompletedAssignments / tooltip.status.TotalAssignments * 100).toFixed(2)} withLabel={true} labelColor={stroke} />
                    </div>
                    <div className="flex gap-2">
                        <div className="flex flex-1 gap-2 items-center border rounded-lg p-2 border-gray-200 bg-gray-50">
                            <div
                                className="flex size-8 items-center justify-center rounded-lg border"
                                style={{
                                    backgroundColor: background,
                                    color: stroke,
                                    borderColor: fill,
                                }}
                            >
                                <UserGroupIcon />
                            </div>
                            <div className="flex flex-col">
                                <p className="text-xs text-light text-gray-500">On Duty</p>
                                <h5 className="font-bold text-sm leading-3">{tooltip.status.TotalCleaners} Cleaners</h5>
                            </div>
                        </div>
                        <div className="flex flex-1 gap-2 items-center border rounded-lg p-2 border-gray-200 bg-gray-50">
                            <div
                                className="flex size-8 items-center justify-center rounded-lg border"
                                style={{
                                    backgroundColor: background,
                                    color: stroke,
                                    borderColor: fill,
                                }}
                            >
                                <TaskIcon />
                            </div>
                            <div className="flex flex-col">
                                <p className="text-xs text-light text-gray-500">Task</p>
                                <h5 className="font-bold text-sm leading-3">{tooltip.status.TotalCompletedAssignments} / {tooltip.status.TotalAssignments}</h5>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <span className="mb-1">{tooltip.name}</span>
            )}
            { isLoadingBuildingStatus && <div className="w-full"><Spinner/></div>}
        </div>
    );
}
