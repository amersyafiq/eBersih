import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.API_URL;

async function handler( req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) 
{
    const { path } = await params;
    const cookieStore = await cookies();
    const accessToken = cookieStore.get("access_token")?.value;
    const refreshToken = cookieStore.get("refresh_token")?.value;

    const search = req.nextUrl.search;
    const url = `${API_URL}/${path.join("/")}${search}`;

    const headers = new Headers(req.headers);
    headers.delete("host");
    headers.delete("content-length");
    headers.delete("connection");

    if (accessToken) {
        headers.set("Authorization", `Bearer ${accessToken}`);
    }

    const options: RequestInit = {
        method: req.method,
        headers,
    };

    if (req.method !== "GET" && req.method !== "HEAD") {
        const bodyText = await req.text();
        if (bodyText) {
            options.body = bodyText;
        }
    }

    let res = await fetch(url, options);

    // 3. If 401 and we have a refresh token, refresh and retry
    if (res.status === 401 && refreshToken) {
        const refreshRes = await fetch(`${API_URL}/auth/refresh`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refresh_token: refreshToken }),
        });

        if (refreshRes.ok) {
            const refreshData = await refreshRes.json();
            cookieStore.set("access_token", refreshData.access_token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax",
                maxAge: 60 * 60,
                path: "/",
            });

            // Update header with the new token and retry!
            headers.set("Authorization", `Bearer ${refreshData.access_token}`);
            res = await fetch(url, { ...options, headers });
        } else {
            // Only delete cookies if refresh actually failed
            cookieStore.delete("access_token");
            cookieStore.delete("refresh_token");
            cookieStore.delete("role");
        }
    }

    const responseData = await res.text();
    return new NextResponse(responseData, {
        status: res.status,
        headers: {
            "Content-Type": res.headers.get("Content-Type") || "application/json",
        },
    });
}

export { handler as GET, handler as POST, handler as PUT, handler as PATCH, handler as DELETE };
