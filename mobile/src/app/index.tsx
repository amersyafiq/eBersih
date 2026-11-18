import { Redirect } from "expo-router";
import { getAccessToken } from "@/src/lib/api/secure-token";
import { useCurrentUser } from "@/src/lib/api/auth";

export default function HomeScreen() {
    const { data: user, isLoading } = useCurrentUser();
    if (isLoading) return null;

    return <Redirect href={user ? "/(tabs)" : "/onboarding"} />;
}