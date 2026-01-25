"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Linkedin, Twitter, Youtube, Instagram, CheckCircle2, AlertCircle } from "lucide-react";
import api from "@/lib/api";

export default function SocialAccountsPage() {
    const [connectedAccounts, setConnectedAccounts] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        // Fetch connected accounts
        api.get('/social/').then(res => setConnectedAccounts(res.data)).catch(err => console.error(err));
    }, []);

    const handleConnect = async (platform: string) => {
        setIsLoading(true);
        try {
            // Get Auth URL from backend
            const response = await api.post(`/social/connect/${platform}/`);
            window.location.href = response.data.url;

            // console.log(`Call POST /api/social/connect/${platform}/`);
        } catch (error: any) {
            console.error(error);
            const msg = error.response?.data?.error || "Failed to initiate connection";
            alert(msg);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDisconnect = async (platform: string) => {
        if (!confirm(`Are you sure you want to disconnect ${platform}?`)) return;

        try {
            await api.post(`/social/disconnect/${platform}/`);
            setConnectedAccounts(prev => prev.filter(acc => acc.platform !== platform));
        } catch (error) {
            console.error("Disconnect failed", error);
            alert("Failed to disconnect account");
        }
    };

    const accounts = [
        {
            id: "linkedin",
            name: "LinkedIn",
            icon: Linkedin,
            description: "Post to your personal profile or company page.",
        },
        {
            id: "twitter",
            name: "X (Twitter)",
            icon: Twitter,
            description: "Post threads and long-form tweets.",
        },
        {
            id: "youtube",
            name: "YouTube",
            icon: Youtube,
            description: "Post to Community tab (requires 500+ subs).",
        },
        {
            id: "instagram",
            name: "Instagram",
            icon: Instagram,
            description: "Post images and reels with captions.",
        },
    ];

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Social Accounts</h1>
                <p className="text-muted-foreground">
                    Manage your connected social media profiles.
                </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {accounts.map((account) => {
                    // Check if backend returned status for this platform
                    const connectedAccount = connectedAccounts.find(a => a.platform === account.id);
                    const isConnected = !!connectedAccount;
                    const username = connectedAccount?.platform_username || "Not connected";

                    return (
                        <Card key={account.id} className={isConnected ? "border-primary/50 bg-primary/5" : ""}>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <div className="flex items-center gap-2">
                                    <account.icon className="h-5 w-5" />
                                    <CardTitle className="text-base font-bold">{account.name}</CardTitle>
                                </div>
                                {isConnected ? (
                                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                                ) : (
                                    <AlertCircle className="h-5 w-5 text-muted-foreground" />
                                )}
                            </CardHeader>
                            <CardContent>
                                <CardDescription className="mb-4">
                                    {account.description}
                                </CardDescription>

                                <div className="flex items-center justify-between">
                                    {isConnected ? (
                                        <div className="text-sm font-medium">
                                            Connected as <span className="text-primary">{username}</span>
                                        </div>
                                    ) : (
                                        <div className="text-sm text-muted-foreground">Not connected</div>
                                    )}

                                    <Button
                                        variant={isConnected ? "outline" : "default"}
                                        size="sm"
                                        onClick={() => isConnected ? handleDisconnect(account.id) : handleConnect(account.id)}
                                        disabled={isLoading}
                                    >
                                        {isConnected ? "Disconnect" : "Connect"}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}
