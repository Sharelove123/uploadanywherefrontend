"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";

export default function CallbackPage() {
    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams();
    const platform = params.platform as string;

    const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
    const [message, setMessage] = useState("Connecting your account...");

    useEffect(() => {
        const code = searchParams.get("code");
        const error = searchParams.get("error");

        if (error) {
            setStatus("error");
            setMessage(`Provider returned error: ${error}`);
            return;
        }

        if (!code) {
            setStatus("error");
            setMessage("No authorization code received.");
            return;
        }

        const exchangeToken = async () => {
            try {
                await api.post(`/social/callback/${platform}/`, { code });
                setStatus("success");
                setMessage(`Successfully connected to ${platform}!`);
                setTimeout(() => {
                    router.push('/dashboard/social');
                }, 2000);
            } catch (err: any) {
                console.error(err);
                setStatus("error");
                setMessage(err.response?.data?.message || err.response?.data?.error || "Failed to connect account.");
            }
        };

        if (platform && code) {
            exchangeToken();
        }
    }, [platform, searchParams, router]);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center space-y-4">
            {status === "loading" && (
                <>
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                    <h2 className="text-xl font-semibold">Connecting...</h2>
                    <p className="text-muted-foreground">{message}</p>
                </>
            )}

            {status === "success" && (
                <>
                    <CheckCircle2 className="h-16 w-16 text-green-500" />
                    <h2 className="text-2xl font-bold">Connected!</h2>
                    <p className="text-muted-foreground">{message}</p>
                    <p className="text-sm">Redirecting back to dashboard...</p>
                </>
            )}

            {status === "error" && (
                <>
                    <XCircle className="h-16 w-16 text-destructive" />
                    <h2 className="text-2xl font-bold">Connection Failed</h2>
                    <p className="text-red-500">{message}</p>
                    <Button onClick={() => router.push('/dashboard/social')} variant="outline" className="mt-4">
                        Return to Dashboard
                    </Button>
                </>
            )}
        </div>
    );
}
