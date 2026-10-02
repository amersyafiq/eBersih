"use server";

import { z } from "zod";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const API_URL = process.env.API_URL;

const loginSchema = z.object({
    email: z.string().email({ message: "Invalid email address" }).trim(),
    password: z.string().min(6, { message: "Password must be at least 6 characters" }).trim(),
});


export async function login(prevState: any, formData: FormData) {
    const result = loginSchema.safeParse(Object.fromEntries(formData));
    if (!result.success) {
        return { status: "error", message: "Please check your details and try again." };
    }
    const { email, password } = result.data;

    let data;
    try {
        const res = await fetch(`${API_URL}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
        });

        if (res.status === 404) {
            return { status: "error", message: "Invalid email or password" };
        }
        if (!res.ok) {
            return { status: "error", message: "Something went wrong. Try again." };
        }
        data = await res.json();
    } catch {
        return { status: "error", message: "Could not reach the server." };
    }

    const cookieStore = await cookies();
    cookieStore.set("access_token", data.access_token, { httpOnly: true, secure: true, sameSite: "strict", maxAge: 60 * 15, path: "/" });
    cookieStore.set("refresh_token", data.refresh_token, { httpOnly: true, secure: true, sameSite: "strict", maxAge: 60 * 60 * 24 * 7, path: "/" });
    cookieStore.set("role", data.role, { secure: true, sameSite: "strict", maxAge: 60 * 60 * 24 * 7, path: "/" });

    return { status: "success", message: "Logged in successfully" };
}

export async function logout() {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get("access_token")?.value;

    if (accessToken) {
        await fetch(`${API_URL}/auth/logout`, {
            method: "POST",
            headers: { Authorization: `Bearer ${accessToken}` },
        }).catch(() => { });
    }

    cookieStore.delete("access_token");
    cookieStore.delete("refresh_token");
    cookieStore.delete("role");
    redirect("/");
}