import z from "zod";

export interface ContractorTableProps {
    companyID: number;
    companyRegNo: string;
    companyName: string;
    companyPhone: string;
    assignedZones?: string[];
    totalCleaners?: number;
}

export const createContractorSchema = z.object({
    companyRegNo: z
        .string()
        .min(2, { message: "Company code is required (min 2 characters)" })
        .trim(),
    companyName: z
        .string()
        .min(3, { message: "Company name must be at least 3 characters" })
        .trim(),
    companyPhone: z.string().trim().optional(),
    selectedZones: z
        .array(z.string())
        .min(1, { message: "Please assign at least one zone to this company" }),
});

export type CreateContractorProps = z.infer<typeof createContractorSchema>;

export type ContractorTreeLevel = "zone" | "cleaner";

export interface ContractorTreeNode {
    id: string;
    level: ContractorTreeLevel;
    code: string;
    name: string;
    isActive: boolean;
    buildingCount?: number;
    cleanerCount?: number;
    cleanerCategory?: string;
    phone?: string;
    subRows?: ContractorTreeNode[];
}

export interface ContractorDetailResponse {
    id: string;
    code: string;
    name: string;
    contactPerson?: string | null;
    phone?: string | null;
    email?: string | null;
    isActive: boolean;
    totalZones: number;
    totalCleaners: number;
    totalBuildings: number;
    zonesTree: ContractorTreeNode[];
}
