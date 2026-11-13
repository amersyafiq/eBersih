"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { toast } from "react-toastify";
import { redirect } from "next/navigation";
import type { CurrentUserProps } from "@/src/services/api/auth/types";

export function useCurrentUser() {
  const query = useQuery<CurrentUserProps, Error>({
    queryKey: ["currentUser"],
    queryFn: async () => {
      const res = await fetch("/api/user/me");
      if (!res.ok) throw new Error("Failed to fetch current user");
      return (await res.json()) as CurrentUserProps;
    },
  });

  useEffect(() => {
    if (query.isError) {
      toast.error(`Failed to fetch user. Please try again`);
      redirect("/");
    }
  }, [query.isError, query.error]);

  return query;
}