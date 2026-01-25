"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Sparkles, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

const loginSchema = z.object({
    username: z.string().min(1, "Username is required"),
    password: z.string().min(1, "Password is required"),
});

export default function LoginPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    const { register, handleSubmit, formState: { errors } } = useForm<z.infer<typeof loginSchema>>({
        resolver: zodResolver(loginSchema),
    });

    const { login } = useAuth();

    const onSubmit = async (data: z.infer<typeof loginSchema>) => {
        setIsLoading(true);
        setError("");

        const { username, password } = data;
        const inputLogin = username; // Field is named "username" in schema but holds email or username

        try {
            // 1. Check if user belongs to a tenant (Redirection logic)
            // Only applicable if input looks like an email using simple check
            try {
                const lookupRes = await api.post('/users/tenant-lookup/', { email: inputLogin });
                if (lookupRes.data.found && lookupRes.data.tenant_domain) {
                    const tenantDomain = lookupRes.data.tenant_domain;
                    // Store tenant domain for subsequent requests
                    localStorage.setItem('tenant_domain', tenantDomain);
                    // Force update headers immediately for the next request
                    api.defaults.headers.common['X-Tenant-Domain'] = tenantDomain;
                    console.log("Tenant lookup success. Domain set to:", tenantDomain);
                } else {
                    console.warn("Tenant lookup returned no domain or found=false");
                }
            } catch (err: any) {
                console.error("Lookup failed", err);
                // Don't block login, might be public user or lookup failed
            }

            // 2. Normal Login
            // dj-rest-auth handles "username" field as either username or email based on backend config
            // We should NOT force "email" key unless we are sure it's valid, otherwise backend serializer might fail validation
            const payload: any = {
                password,
                username: inputLogin
            };

            if (inputLogin.includes('@')) {
                payload.email = inputLogin;
            }

            const response = await api.post('/auth/login/', payload);

            // Standard dj-rest-auth or simplejwt response
            const token = response.data.access_token || response.data.key || response.data.access;

            if (token) {
                await login(token);
                // Redirect handled by login func or protected route logic 
                // router.push('/dashboard'); (login func does it)
            } else {
                throw new Error("Invalid response from server");
            }
        } catch (err: any) {
            console.error("Login failed", err);
            setError(err.response?.data?.non_field_errors?.[0] || "Invalid credentials. Please try again.");
            setIsLoading(false);
        }
    };

    return (
        <div className="container relative flex h-screen flex-col items-center justify-center md:grid lg:max-w-none lg:grid-cols-2 lg:px-0">
            <div className="relative hidden h-full flex-col bg-muted p-10 text-white lg:flex dark:border-r">
                <div className="absolute inset-0 bg-primary" />
                <div className="relative z-20 flex items-center text-lg font-medium">
                    <Sparkles className="mr-2 h-6 w-6" />
                    Repurpose.ai
                </div>
                <div className="relative z-20 mt-auto">
                    <blockquote className="space-y-2">
                        <p className="text-lg">
                            &ldquo;This platform saved me hours of work every week. The AI content generation is spot on!&rdquo;
                        </p>
                        <footer className="text-sm">Sofia Davis, Content Creator</footer>
                    </blockquote>
                </div>
            </div>
            <div className="lg:p-8">
                <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
                    <div className="flex flex-col space-y-2 text-center">
                        <h1 className="text-2xl font-semibold tracking-tight">
                            Login to your account
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Enter your credentials below to access your dashboard
                        </p>
                    </div>

                    <Card>
                        <CardContent className="pt-6">
                            <form onSubmit={handleSubmit(onSubmit)}>
                                <div className="grid gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="username">Email or Username</Label>
                                        <Input
                                            id="username"
                                            placeholder="name@example.com or username"
                                            type="text"
                                            autoCapitalize="none"
                                            autoCorrect="off"
                                            disabled={isLoading}
                                            {...register("username")}
                                        />
                                        {errors.username && <p className="text-sm text-destructive">{errors.username.message}</p>}
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="password">Password</Label>
                                        <Input
                                            id="password"
                                            placeholder="******"
                                            type="password"
                                            disabled={isLoading}
                                            {...register("password")}
                                        />
                                        {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
                                    </div>
                                    {error && <p className="text-sm text-destructive text-center">{error}</p>}
                                    <Button disabled={isLoading}>
                                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Sign In with Email
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>

                    <div className="px-8 text-center text-sm text-muted-foreground space-y-2">
                        <p>
                            Don&apos;t have an account?{" "}
                            <Link href="/signup" className="hover:text-brand underline underline-offset-4 text-primary">
                                Sign up
                            </Link>
                        </p>
                        <p>
                            <Link href="/" className="hover:text-brand underline underline-offset-4">
                                Back to Home
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
