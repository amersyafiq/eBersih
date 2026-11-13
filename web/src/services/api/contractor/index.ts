import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ContractorTableProps, CreateContractorProps } from "./types";

export function useContractors() {
   return useQuery<ContractorTableProps, Error>({
        queryKey: ["contractor"],
        queryFn: async () => {
            const res = await fetch("/api/contractor");
            if (!res.ok) throw new Error("Failed to fetch current user");
            return (await res.json()) as ContractorTableProps;
        },
    })
}

export function useCreateContractor() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (payload: CreateContractorProps) => {
            const res = await fetch("/api/contractor", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            if (!res.ok) {
                const errData = await res.json().catch(() => null);
                throw new Error(errData?.detail || errData?.message || "Failed to create company");
            }
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["contractor"] });
        },
    });
}

export function useContractorDetails(companyID: number | null) {
    return useQuery<ContractorDetailResponse, Error>({
        queryKey: ["contractor", companyID],
        queryFn: async ({ signal }) => {
            const res = await fetch(`/api/contractor/${companyID}`, { signal });
            if (!res.ok) {
                throw new Error("Failed to fetch contractor details");
            }
            return res.json();
        },
        enabled: Boolean(companyID),
    });
}