"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import api from "@/lib/api";
import { useTenant } from "@/context/TenantContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

function SignupContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get("token");
    const { tenant } = useTenant();

    // Invite related states
    const [isInviteFlow, setIsInviteFlow] = useState(false);
    const [inviteValid, setInviteValid] = useState(false);
    const [inviteData, setInviteData] = useState<{ email: string, role: string } | null>(null);
    const [checkingInvite, setCheckingInvite] = useState(false);

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    const [formData, setFormData] = useState({
        username: "",
        email: "",
        password: "",
        password_confirm: "",
    });

    useEffect(() => {
        if (token) {
            validateInvite(token);
        }
    }, [token]);

    const validateInvite = async (token: string) => {
        setIsInviteFlow(true);
        setCheckingInvite(true);
        try {
            const res = await api.get(`/teams/validate-invite/${token}/`);
            if (res.data.valid) {
                setInviteValid(true);
                setInviteData(res.data);
                setFormData(prev => ({ ...prev, email: res.data.email }));
            } else {
                setError(res.data.error || "Invalid invitation");
            }
        } catch (err: any) {
            setError(err.response?.data?.error || "Invalid or expired invitation");
        } finally {
            setCheckingInvite(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);

        if (formData.password !== formData.password_confirm) {
            setError("Passwords do not match");
            setIsLoading(false);
            return;
        }

        try {
            if (isInviteFlow && token) {
                // Accept invite flow
                await api.post("/teams/accept-invite/", {
                    token: token,
                    password: formData.password
                });
                toast.success("Invitation accepted! Please login.");
                router.push("/login?accepted=true");
            } else {
                // Regular registration (only on main domain)
                await api.post("/auth/registration/", {
                    username: formData.username,
                    email: formData.email,
                    password: formData.password,
                    password_confirm: formData.password_confirm,
                });
                router.push("/login?registered=true");
            }
        } catch (err: any) {
            console.error(err);
            const msg = err.response?.data?.message || err.response?.data?.detail || err.response?.data?.error || "Registration failed. Please try again.";

            if (typeof err.response?.data === 'object' && !err.response?.data.message && !err.response?.data.error && !err.response?.data.detail) {
                const firstError = Object.values(err.response.data)[0];
                setError(Array.isArray(firstError) ? firstError[0] : JSON.stringify(firstError));
            } else {
                setError(msg);
            }
        } finally {
            setIsLoading(false);
        }
    };

    // 1. Loading invite check
    if (checkingInvite) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    // 2. Invalid Invite Error
    if (isInviteFlow && !inviteValid) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 dark:bg-gray-950 sm:px-6 lg:px-8">
                <Card className="w-full max-w-md border-destructive/50">
                    <CardHeader className="space-y-1 text-center">
                        <div className="flex justify-center mb-4">
                            <AlertCircle className="h-10 w-10 text-destructive" />
                        </div>
                        <CardTitle className="text-xl font-bold">Invalid Invitation</CardTitle>
                        <CardDescription>
                            {error || "This invitation link is invalid or has expired."}
                        </CardDescription>
                    </CardHeader>
                    <CardFooter>
                        <Button className="w-full" asChild>
                            <Link href="/login">Go to Login</Link>
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        );
    }

    // 3. Invite Acceptance Form
    if (isInviteFlow && inviteValid) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 dark:bg-gray-950 sm:px-6 lg:px-8">
                <Card className="w-full max-w-md">
                    <CardHeader className="space-y-1 text-center">
                        <div className="flex justify-center mb-4">
                            <CheckCircle2 className="h-10 w-10 text-green-500" />
                        </div>
                        <CardTitle className="text-2xl font-bold">Accept Invitation</CardTitle>
                        <CardDescription>
                            Join <strong>{tenant.subdomain?.toUpperCase()}</strong> as a {inviteData?.role}.
                        </CardDescription>
                    </CardHeader>
                    <form onSubmit={handleSubmit}>
                        <CardContent className="space-y-4">
                            {error && (
                                <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md">
                                    {error}
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    value={inviteData?.email}
                                    disabled
                                    className="bg-muted"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password">Set Password</Label>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        name="password"
                                        type={showPassword ? "text" : "password"}
                                        required
                                        value={formData.password}
                                        onChange={handleChange}
                                        placeholder="Create a strong password"
                                    />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? (
                                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                                        ) : (
                                            <Eye className="h-4 w-4 text-muted-foreground" />
                                        )}
                                    </Button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password_confirm">Confirm Password</Label>
                                <Input
                                    id="password_confirm"
                                    name="password_confirm"
                                    type="password"
                                    required
                                    value={formData.password_confirm}
                                    onChange={handleChange}
                                    placeholder="Confirm your password"
                                />
                            </div>
                        </CardContent>
                        <CardFooter className="flex flex-col space-y-4">
                            <Button type="submit" className="w-full" disabled={isLoading}>
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Complete Account Setup
                            </Button>
                        </CardFooter>
                    </form>
                </Card>
            </div>
        );
    }

    // 4. Regular Registration Blocked on Tenant Subdomains
    if (tenant.isPublicTenant) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 dark:bg-gray-950 sm:px-6 lg:px-8">
                <Card className="w-full max-w-md">
                    <CardHeader className="space-y-1">
                        <CardTitle className="text-2xl font-bold tracking-tight">Create Your Workspace</CardTitle>
                        <CardDescription>
                            You are on the public domain. To create a new workspace for your business, click below.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                            If you already have a workspace, go to your workspace URL (e.g., <em>yourcompany.localhost:3000</em>) to log in.
                        </p>
                    </CardContent>
                    <CardFooter className="flex flex-col space-y-2">
                        <Button className="w-full" asChild>
                            <Link href="/register">Create New Workspace</Link>
                        </Button>
                        <div className="text-center text-sm text-muted-foreground">
                            Already have a workspace?{" "}
                            <Link href="/login" className="underline hover:text-primary">
                                Sign in
                            </Link>
                        </div>
                    </CardFooter>
                </Card>
            </div>
        );
    }

    // 5. Registration Disabled Message (Default for tenant subdomains without token)
    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 dark:bg-gray-950 sm:px-6 lg:px-8">
            <Card className="w-full max-w-md">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold tracking-tight">Registration Disabled</CardTitle>
                    <CardDescription>
                        Public registration is not available for <strong>{tenant.subdomain?.toUpperCase() || 'this workspace'}</strong>.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="bg-amber-500/10 text-amber-600 text-sm p-3 rounded-md border border-amber-500/20">
                        <strong>Why?</strong> For security, only workspace administrators can add team members.
                    </div>
                    <p className="text-sm text-muted-foreground">
                        If you need access, please contact your workspace administrator to invite you.
                    </p>
                </CardContent>
                <CardFooter className="flex flex-col space-y-2">
                    <Button className="w-full" asChild>
                        <Link href="/login">Go to Login</Link>
                    </Button>
                    <div className="text-center text-sm text-muted-foreground">
                        Wrong workspace?{" "}
                        <a href={`http://${process.env.NEXT_PUBLIC_MAIN_DOMAIN || 'localhost:3000'}/register`} className="underline hover:text-primary">
                            Create your own
                        </a>
                    </div>
                </CardFooter>
            </Card>
        </div>
    );
}

export default function SignupPage() {
    return (
        <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
            <SignupContent />
        </Suspense>
    );
}
