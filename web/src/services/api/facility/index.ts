import { useQuery } from "@tanstack/react-query";
import { FacilityTableProps } from "./types";

export function useFacilities() {
   return useQuery<FacilityTableProps, Error>({
        queryKey: ["facility"],
        queryFn: async () => {
            const res = await fetch("/api/facility");
            if (!res.ok) throw new Error("Failed to fetch current user");
            return (await res.json()) as FacilityTableProps;
        },
    })
}