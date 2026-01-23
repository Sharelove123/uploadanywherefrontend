"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Loader2, ExternalLink, Linkedin, Twitter, MoreVertical, FileText, Youtube } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import api from "@/lib/api";

interface Post {
    id: number;
    platform: "linkedin" | "twitter" | "instagram";
    platform_display: string;
    status: "pending" | "ready" | "published" | "failed";
    status_display: string;
    generated_content: string;
    hook: string;
    created_at: string;
    is_thread: boolean;
}

interface Source {
    id: number;
    title: string;
    source_type: string;
    source_type_display: string;
    created_at: string;
    repurposed_posts: Post[];
}

export default function PostsPage() {
    const [sources, setSources] = useState<Source[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        fetchPosts();
    }, []);

    const fetchPosts = async () => {
        try {
            // Fetching contentsources which include nested posts
            const response = await api.get('/repurposer/sources/');
            setSources(response.data.results || response.data);
        } catch (err) {
            console.error("Failed to fetch posts", err);
            // setError("Failed to load posts."); // optional to show UI error
        } finally {
            setIsLoading(false);
        }
    };

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
                    <h1 className="text-3xl font-bold tracking-tight">Generated Posts</h1>
                    <p className="text-muted-foreground">
                        Review and publish your repurposed content.
                    </p>
                </div>
                <Link href="/dashboard/repurpose">
                    <Button>
                        New Project
                    </Button>
                </Link>
            </div>

            {sources.length === 0 ? (
                <div className="flex flex-col items-center justify-center min-h-[400px] border rounded-lg bg-muted/10">
                    <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-xl font-medium">No posts yet</h3>
                    <p className="text-muted-foreground mb-6">Start by repurposing your first piece of content.</p>
                    <Link href="/dashboard/repurpose">
                        <Button>Create Content</Button>
                    </Link>
                </div>
            ) : (
                <div className="space-y-6">
                    {sources.map((source) => (
                        <Card key={source.id} className="overflow-hidden">
                            <CardHeader className="bg-muted/30 pb-4">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-1">
                                        <CardTitle className="text-base flex items-center gap-2">
                                            {source.source_type === 'youtube' ? <Youtube className="h-4 w-4 text-red-500" /> : <FileText className="h-4 w-4 text-blue-500" />}
                                            {source.title || "Untitled Project"}
                                        </CardTitle>
                                        <CardDescription>
                                            Created {formatDistanceToNow(new Date(source.created_at), { addSuffix: true })}
                                        </CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="divide-y">
                                    {source.repurposed_posts?.map((post) => (
                                        <div key={post.id} className="p-4 flex items-start gap-4 hover:bg-muted/5 transition-colors">
                                            <div className="mt-1">
                                                {post.platform === 'linkedin' && <Linkedin className="h-5 w-5 text-blue-600" />}
                                                {post.platform === 'twitter' && <Twitter className="h-5 w-5 text-sky-500" />}
                                            </div>
                                            <div className="flex-1 space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-medium text-sm">{post.platform_display}</span>
                                                        <Badge variant={
                                                            post.status === 'published' ? "default" :
                                                                post.status === 'ready' ? "secondary" : "outline"
                                                        } className="capitalize">
                                                            {post.status_display}
                                                        </Badge>
                                                    </div>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                                                <MoreVertical className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem>Edit</DropdownMenuItem>
                                                            <DropdownMenuItem>Publish</DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>

                                                <div className="bg-muted/30 p-3 rounded-md text-sm border">
                                                    {post.status === 'failed' ? (
                                                        <span className="text-destructive">Generation failed.</span>
                                                    ) : (
                                                        <>
                                                            <p className="font-medium mb-1 text-xs text-muted-foreground">HOOK</p>
                                                            <p className="line-clamp-2">{post.hook || "Generating..."}</p>
                                                        </>
                                                    )}
                                                </div>

                                                <div className="flex justify-end">
                                                    <Button size="sm" variant="outline" className="h-8 text-xs">
                                                        View Full Post <ExternalLink className="h-3 w-3 ml-2" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {source.repurposed_posts.length === 0 && (
                                        <div className="p-4 text-sm text-muted-foreground text-center">Processing content...</div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
