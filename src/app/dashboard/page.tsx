"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Sparkles, Youtube, FileText, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import api from "@/lib/api";

interface Source {
    id: number;
    title: string;
    source_type: string;
    source_type_display: string;
    created_at: string;
    repurposed_posts: any[];
}

interface UserData {
    repurposes_used_this_month: number;
    repurposes_remaining: number;
    subscription_tier: string;
}

export default function DashboardPage() {
    const [sources, setSources] = useState<Source[]>([]);
    const [userData, setUserData] = useState<UserData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [sourcesRes, userRes] = await Promise.all([
                    api.get('/repurposer/sources/'),
                    api.get('/users/profile/')
                ]);
                setSources(sourcesRes.data.results || sourcesRes.data || []);
                setUserData(userRes.data);
            } catch (error) {
                console.error("Failed to fetch dashboard data", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    // Calculate stats
    const totalSources = sources.length;
    const totalPosts = sources.reduce((acc, s) => acc + (s.repurposed_posts?.length || 0), 0);
    const publishedPosts = sources.reduce((acc, s) =>
        acc + (s.repurposed_posts?.filter((p: any) => p.status === 'published').length || 0), 0
    );
    const creditsRemaining = userData?.repurposes_remaining ?? 0;
    const creditsUsed = userData?.repurposes_used_this_month ?? 0;

    // Get recent sources (last 5)
    const recentSources = sources.slice(0, 5);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                    <p className="text-muted-foreground">
                        Welcome back! Here's an overview of your content.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Link href="/dashboard/repurpose">
                        <Button>
                            <Plus className="mr-2 h-4 w-4" /> New Project
                        </Button>
                    </Link>
                </div>
            </div>

            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Credits Used</CardTitle>
                        <Sparkles className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{creditsUsed}</div>
                        <p className="text-xs text-muted-foreground">This month</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Content Sources</CardTitle>
                        <Youtube className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalSources}</div>
                        <p className="text-xs text-muted-foreground">Total projects</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Generated Posts</CardTitle>
                        <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalPosts}</div>
                        <p className="text-xs text-muted-foreground">{publishedPosts} published</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Credits Remaining</CardTitle>
                        <Sparkles className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {creditsRemaining === -1 ? "∞" : creditsRemaining}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {userData?.subscription_tier || 'free'} plan
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 grid-cols-1 lg:grid-cols-7">
                <Card className="lg:col-span-4">
                    <CardHeader>
                        <CardTitle>Recent Activity</CardTitle>
                        <CardDescription>
                            Your latest content repurposing jobs.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {recentSources.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-4">
                                    No projects yet. Create your first one!
                                </p>
                            ) : (
                                recentSources.map((source) => (
                                    <div key={source.id} className="flex items-center">
                                        <div className="ml-4 space-y-1">
                                            <p className="text-sm font-medium leading-none">
                                                {source.title || "Untitled Project"}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                {source.source_type_display} • {formatDistanceToNow(new Date(source.created_at), { addSuffix: true })}
                                            </p>
                                        </div>
                                        <div className="ml-auto font-medium text-green-500">
                                            {source.repurposed_posts?.length || 0} posts
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>
                <Card className="lg:col-span-3">
                    <CardHeader>
                        <CardTitle>Quick Actions</CardTitle>
                        <CardDescription>
                            Start a new repurposing job.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-4">
                        <Link href="/dashboard/repurpose">
                            <Button variant="outline" className="w-full justify-start">
                                <Youtube className="mr-2 h-4 w-4" /> Repurpose YouTube Video
                            </Button>
                        </Link>
                        <Link href="/dashboard/repurpose">
                            <Button variant="outline" className="w-full justify-start">
                                <FileText className="mr-2 h-4 w-4" /> Repurpose Blog Post
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
