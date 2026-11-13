export type FacilityLevel = "building" | "block" | "floor" | "space";

export interface FacilityTableProps {
    id: string;
    level: "building" | "block" | "floor" | "space";
    code: string;
    name: string;
    isActive: boolean;
    zoneCode?: string;
    zoneName?: string;
    spaceType?: string;
    spaceArea?: number;
    spaceEPU?: number;
    taskGroupName?: string;
    subRows?: FacilityTableProps[];
}