export interface BuildingFeature {
  type: string;
  properties: {
    name: string;
    building: string;
    layer: string | null;
  };
  geometry: unknown;
}

export interface ImportData {
  [buildingName: string]: number;
}

export interface SelectedBuilding {
    code: string;
    name: string;
}

export type FacilityNodeType = "block" | "floor" | "space" | "task";

export interface FacilityNode {
    id: string;
    name: string;
    code?: string;
    type: FacilityNodeType;
    status?: "Completed" | "Pending" | "In Progress";
    cleanerName?: string;
    completedCount?: number;
    totalCount?: number;
    subRows?: FacilityNode[];
}

export type CleanerNodeType = "cleaner" | "assignment";

export interface CleanerNode {
    id: string;
    type: CleanerNodeType;
    cleanerName?: string;
    category?: string;
    company?: string;
    taskName?: string;
    spaceCode?: string;
    spaceName?: string;
    status?: "Completed" | "Pending" | "In Progress";
    subRows?: CleanerNode[];
}

export interface BuildingDetailsProps {
    buildingCode: string | null;
    buildingName: string;
    scheduleDate: string;
    onClose: () => void;
    facilityData?: FacilityNode[];
    cleanerData?: CleanerNode[];
    isLoading?: boolean;
}
