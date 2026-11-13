"use client";

import { useCurrentUser } from "@/src/services/api/auth/index"
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";

export default function OverviewPage() {
    // const [user, setUser] = useState<any>(null);

    // useEffect(() => {
    //     async function useCurrentUser() {
    //         const res = await fetch("/api/user/me");
    //         const data = await res.json();

    //         setUser(data);
    //     }

    //     useCurrentUser();
    // }, []);

    const {
        data: user,
        isLoading,
        error,
    } = useCurrentUser()

    return (
        <>
            {isLoading && <p>Loading...</p>}
            {error && <p>Something went wrong</p>}
            {user && <h1>Hello {user.Fullname}</h1>}
        </>
    );
}