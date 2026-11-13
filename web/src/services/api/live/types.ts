import { CleanerNode, FacilityNode } from "@/src/app/(authenticated)/(fullscreen)/live/types";

export interface ZoneProps {
    ZoneCode: string,
    ZoneName: string,
    CampusCode: string,
    ZoneID: number,
    IsActive: boolean
} 

export interface StatusProps {
    CampusCode: string,
    ZoneCode: string,
    ZoneName: string,
    BuildingCode: string,
    BuildingName: string,
    TotalAssignments: number,
    TotalCompletedAssignments: number,
    TotalCleaners: number,
}

export interface BuildingDetailsProps {
    buildingCode: string;
    buildingName: string;
    scheduleDate: string;
    facilityData: FacilityNode[];
    cleanerData: CleanerNode[];
}