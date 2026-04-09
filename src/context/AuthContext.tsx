"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import api, { setAuthToken } from "@/lib/api";
import { useRouter, usePathname } from "next/navigation";

interface User {
    id: number;
    username: string;
    email: string;
    subscription_tier: string;
    // Add other profile fields if needed
}

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (token: string) => Promise<void>;
    logout: () => void;
    checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    const pathname = usePathname();

    const logout = useCallback(() => {
        setAuthToken(""); // Clears token from api headers and localStorage
        setUser(null);
        router.push("/login");
    }, [router]);

    const fetchUser = useCallback(async () => {
        try {
            // Add timestamp to prevent caching
            const response = await api.get(`/users/profile/?t=${new Date().getTime()}`);
            setUser(response.data);
        } catch (error: any) {
            console.error("Failed to fetch user profile", error);
            // Only logout on auth errors (401, 403), not on network errors
            const status = error.response?.status;
            if (status === 401 || status === 403) {
                logout();
            }
        } finally {
            setIsLoading(false);
        }
    }, [logout]);

    const checkAuth = useCallback(async () => {
        const token = localStorage.getItem("token");
        if (token) {
            setAuthToken(token);
            await fetchUser();
        } else {
            setUser(null);
            setIsLoading(false);
        }
    }, [fetchUser]);

    useEffect(() => {
        checkAuth();
    }, [checkAuth]);

    const login = useCallback(async (token: string) => {
        setAuthToken(token);
        await fetchUser();
        router.push("/dashboard");
    }, [fetchUser, router]);

    // Protected Route Logic
    useEffect(() => {
        // List of public paths that don't depend on auth state
        const publicPaths = ["/login", "/signup", "/", "/register"];

        // If loading, do nothing yet
        if (isLoading) return;

        // If not authenticated and trying to access protected route
        if (!user && !publicPaths.includes(pathname)) {
            // Check if it looks like a dashboard route (or anything not public)
            router.push("/login");
        }

        // If authenticated and trying to access login/signup
        if (user && (pathname === "/login" || pathname === "/signup")) {
            router.push("/dashboard");
        }

    }, [user, isLoading, pathname, router]);


    return (
        <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, logout, checkAuth }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
