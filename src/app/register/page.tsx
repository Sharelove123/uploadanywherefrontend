"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Loader2, Building2 } from "lucide-react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function RegisterPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    const [formData, setFormData] = useState({
        companyName: "",
        companySlug: "",
        username: "",
        email: "",
        password: "",
        password_confirm: "",
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
            // Auto-generate slug from company name
            ...(name === "companyName" && {
                companySlug: value.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 20),
            }),
        }));
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

        if (!formData.companySlug || formData.companySlug.length < 3) {
            setError("Company URL must be at least 3 characters");
            setIsLoading(false);
            return;
        }

        try {
            // 1. Create tenant
            // Robustly handle the env var, removing protocol if user accidentally included it
            const rawMainDomain = process.env.NEXT_PUBLIC_MAIN_DOMAIN || 'localhost:3000';
            const mainDomain = rawMainDomain.replace(/^https?:\/\//, '').replace(/\/$/, '');
            const protocol = window.location.protocol; // http: or https:

            const tenantResponse = await api.post("/tenants/register/", {
                name: formData.companyName,
                tenant_type: "company",
                domain_url: `${formData.companySlug}.${mainDomain.split(':')[0]}`, // Backend expects domain without port usually, or handle match
                // Actually, backend needs full domain to match request Host header? 
                // If backend stores "slug.main.com", then request host "slug.main.com" matches.
                // If mainDomain is "localhost:3000", we want "slug.localhost".

                owner_username: formData.username,
                owner_email: formData.email,
                password: formData.password,
            });

            // 2. TODO: Create user within the new tenant
            // This would require the backend to support user creation during tenant registration
            // For now, we redirect to the new subdomain login

            const domain = tenantResponse.data.domain || `${formData.companySlug}.${mainDomain.split(':')[0]}`;

            // Store new tenant domain so login page knows where to go
            localStorage.setItem('tenant_domain', domain);

            // Redirect to login on the SAME domain (localhost)
            router.push('/login?registered=true');
        } catch (err: any) {
            console.error(err);
            const msg = err.response?.data?.message || err.response?.data?.detail || "Registration failed.";
            if (typeof err.response?.data === "object" && !err.response?.data.message) {
                const firstError = Object.values(err.response.data)[0];
                setError(Array.isArray(firstError) ? firstError[0] : JSON.stringify(firstError));
            } else {
                setError(msg);
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 dark:bg-gray-950 sm:px-6 lg:px-8">
            <Card className="w-full max-w-md">
                <CardHeader className="space-y-1">
                    <div className="flex items-center gap-2">
                        <Building2 className="h-6 w-6 text-primary" />
                        <CardTitle className="text-2xl font-bold tracking-tight">Create Workspace</CardTitle>
                    </div>
                    <CardDescription>
                        Set up your company workspace and admin account
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-4">
                        {error && (
                            <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md">
                                {error}
                            </div>
                        )}

                        {/* Company Section */}
                        <div className="space-y-2">
                            <Label htmlFor="companyName">Company Name</Label>
                            <Input
                                id="companyName"
                                name="companyName"
                                placeholder="Acme Inc."
                                required
                                value={formData.companyName}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="companySlug">Workspace URL</Label>
                            <div className="flex items-center gap-1">
                                <Input
                                    id="companySlug"
                                    name="companySlug"
                                    placeholder="acme"
                                    required
                                    value={formData.companySlug}
                                    onChange={handleChange}
                                    className="flex-1"
                                />
                                <span className="text-sm text-muted-foreground">.yourapp.com</span>
                            </div>
                        </div>

                        <hr className="my-4" />

                        {/* Admin Account Section */}
                        <div className="space-y-2">
                            <Label htmlFor="username">Admin Username</Label>
                            <Input
                                id="username"
                                name="username"
                                placeholder="johndoe"
                                required
                                value={formData.username}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email">Admin Email</Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                placeholder="admin@acme.com"
                                required
                                value={formData.email}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    name="password"
                                    type={showPassword ? "text" : "password"}
                                    required
                                    value={formData.password}
                                    onChange={handleChange}
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
                            />
                        </div>
                    </CardContent>
                    <CardFooter className="flex flex-col space-y-4">
                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Create Workspace
                        </Button>
                        <div className="text-center text-sm text-muted-foreground">
                            Already have a workspace?{" "}
                            <Link href="/login" className="underline hover:text-primary">
                                Sign in
                            </Link>
                        </div>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
