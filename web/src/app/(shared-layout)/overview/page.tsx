"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";

async function getCurrentUser() {
    const res = await fetch("/api/user/me");
    return res.json();
}


export default function OverviewPage() {
    // const [user, setUser] = useState<any>(null);

    // useEffect(() => {
    //     async function getCurrentUser() {
    //         const res = await fetch("/api/user/me");
    //         const data = await res.json();

    //         setUser(data);
    //     }

    //     getCurrentUser();
    // }, []);

    const {
        data: user,
        isLoading,
        error,
    } = useQuery({
        queryKey: ["currentUser"], 
        queryFn: getCurrentUser
    })

    return (
        <>
            {isLoading && <p>Loading...</p>}
            {error && <p>Something went wrong</p>}
            {user && <h1>Hello {user.Fullname}</h1>}
        </>
    );
}