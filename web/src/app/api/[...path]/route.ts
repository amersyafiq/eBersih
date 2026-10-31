
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.API_URL!;

async function handler(req: NextRequest, context: { params: Promise<{ path: string[] }> }) {
    const { path } = await context.params;
    const cookieStore = await cookies();

    const accessToken = cookieStore.get("access_token")?.value;
    const refreshToken = cookieStore.get("refresh_token")?.value;

    const url = `${API_URL}/${path.join("/")}${req.nextUrl.search}`;

    // Forward incoming headers while excluding host-specific headers
    const headers = new Headers(req.headers);
    headers.delete("host");
    headers.delete("cookie");
    if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);

    // Handle request body for non-GET/HEAD methods
    const options: RequestInit = {
        method: req.method,
        headers,
        cache: "no-store",
    };
    if (req.method !== "GET" && req.method !== "HEAD") options.body = await req.arrayBuffer();

    let res = await fetch(url, options);
    if (res.status === 401 && refreshToken) {
        const refreshRes = await fetch(`${API_URL}/auth/refresh`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refresh_token: refreshToken }),
            cache: "no-store",
        });

        if (refreshRes.ok) {
            const tokens = await refreshRes.json();

            headers.set("Authorization", `Bearer ${tokens.access_token}`);

            res = await fetch(url, {
                ...options,
                headers,
            });

            if (res.status !== 401) {
                const response = new NextResponse(res.body, {
                    status: res.status,
                    headers: res.headers,
                });

                response.cookies.set("access_token", tokens.access_token, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === "production",
                    sameSite: "lax",
                    path: "/",
                    maxAge: 60 * 60,
                });

                if (tokens.refresh_token) {
                    response.cookies.set("refresh_token", tokens.refresh_token, {
                        httpOnly: true,
                        secure: process.env.NODE_ENV === "production",
                        sameSite: "lax",
                        path: "/",
                    });
                }

                return response;
            }
        }
    }

    if (res.status === 401) {
        const response = NextResponse.json(
            { detail: "Session expired" },
            { status: 401 }
        );

        response.cookies.delete("access_token");
        response.cookies.delete("refresh_token");

        return response;
    }

    return new NextResponse(res.body, {
        status: res.status,
        headers: res.headers,
    });
}

export {
    handler as GET,
    handler as POST,
    handler as PUT,
    handler as PATCH,
    handler as DELETE,
};