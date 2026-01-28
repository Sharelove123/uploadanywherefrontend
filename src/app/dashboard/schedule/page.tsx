"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Calendar, Clock, Repeat, Plus, Pause, Play, Trash2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import api from "@/lib/api";

interface ScheduledPost {
    id: number;
    post: number | null;
    post_title: string | null;
    prompt: string;
    platforms: string[];
    frequency: string;
    scheduled_time: string;
    status: string;
    is_active: boolean;
    next_run: string | null;
    run_count: number;
    error_message: string;
}

interface ExistingPost {
    id: number;
    hook: string;
    platform: string;
    status: string;
}

export default function SchedulePage() {
    const router = useRouter();
    const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>([]);
    const [existingPosts, setExistingPosts] = useState<ExistingPost[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);

    // Form state
    const [showForm, setShowForm] = useState(false);
    const [usePrompt, setUsePrompt] = useState(true);
    const [selectedPostId, setSelectedPostId] = useState<string>("");
    const [prompt, setPrompt] = useState("");
    const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(["linkedin"]);
    const [frequency, setFrequency] = useState("once");
    const [scheduledDate, setScheduledDate] = useState("");
    const [scheduledTime, setScheduledTime] = useState("");

    // Fetch scheduled posts and existing posts
    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [scheduledRes, postsRes] = await Promise.all([
                api.get('/repurposer/scheduled-posts/'),
                api.get('/repurposer/posts/?status=ready')
            ]);
            setScheduledPosts(scheduledRes.data.results || scheduledRes.data || []);
            setExistingPosts(postsRes.data.results || postsRes.data || []);
        } catch (error) {
            console.error("Failed to fetch data", error);
        } finally {
            setIsLoading(false);
        }
    };

    const togglePlatform = (platform: string) => {
        if (selectedPlatforms.includes(platform)) {
            setSelectedPlatforms(selectedPlatforms.filter(p => p !== platform));
        } else {
            setSelectedPlatforms([...selectedPlatforms, platform]);
        }
    };

    const handleCreate = async () => {
        if (!scheduledDate || !scheduledTime) {
            alert("Please select date and time");
            return;
        }

        if (usePrompt && !prompt) {
            alert("Please enter a prompt for AI generation");
            return;
        }

        if (!usePrompt && !selectedPostId) {
            alert("Please select an existing post");
            return;
        }

        setIsCreating(true);
        try {
            const scheduledDateTime = new Date(`${scheduledDate}T${scheduledTime}`).toISOString();

            const payload: any = {
                frequency,
                scheduled_time: scheduledDateTime,
            };

            if (usePrompt) {
                payload.prompt = prompt;
                payload.platforms = selectedPlatforms;
            } else {
                payload.post_id = parseInt(selectedPostId);
            }

            await api.post('/repurposer/scheduled-posts/', payload);
            setShowForm(false);
            resetForm();
            fetchData();
        } catch (error: any) {
            console.error("Failed to create scheduled post", error);
            alert(error.response?.data?.error || "Failed to create scheduled post");
        } finally {
            setIsCreating(false);
        }
    };

    const handlePause = async (id: number) => {
        try {
            await api.post(`/repurposer/scheduled-posts/${id}/pause/`);
            fetchData();
        } catch (error) {
            console.error("Failed to pause", error);
        }
    };

    const handleResume = async (id: number) => {
        try {
            await api.post(`/repurposer/scheduled-posts/${id}/resume/`);
            fetchData();
        } catch (error) {
            console.error("Failed to resume", error);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure you want to delete this scheduled post?")) return;
        try {
            await api.delete(`/repurposer/scheduled-posts/${id}/`);
            fetchData();
        } catch (error) {
            console.error("Failed to delete", error);
        }
    };

    const resetForm = () => {
        setPrompt("");
        setSelectedPostId("");
        setSelectedPlatforms(["linkedin"]);
        setFrequency("once");
        setScheduledDate("");
        setScheduledTime("");
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
            case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
            case 'completed': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
            case 'failed': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
            case 'paused': return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleString('en-US', {
            dateStyle: 'medium',
            timeStyle: 'short'
        });
    };

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Scheduled Posts</h1>
                    <p className="text-muted-foreground">
                        Schedule one-time or recurring posts to YouTube and LinkedIn
                    </p>
                </div>
                <Button onClick={() => setShowForm(!showForm)} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Schedule New Post
                </Button>
            </div>

            {/* Create Form */}
            {showForm && (
                <Card className="border-primary">
                    <CardHeader>
                        <CardTitle>Create Scheduled Post</CardTitle>
                        <CardDescription>
                            Schedule an existing post or generate new content with AI at your chosen time
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Content Source Toggle */}
                        <div className="flex gap-4">
                            <Button
                                variant={usePrompt ? "default" : "outline"}
                                onClick={() => setUsePrompt(true)}
                                className="flex-1 gap-2"
                            >
                                <Sparkles className="h-4 w-4" />
                                Generate with AI
                            </Button>
                            <Button
                                variant={!usePrompt ? "default" : "outline"}
                                onClick={() => setUsePrompt(false)}
                                className="flex-1"
                            >
                                Use Existing Post
                            </Button>
                        </div>

                        {/* AI Prompt or Post Selection */}
                        {usePrompt ? (
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label>AI Prompt</Label>
                                    <Textarea
                                        value={prompt}
                                        onChange={(e) => setPrompt(e.target.value)}
                                        placeholder="Describe what you want the AI to generate. E.g., 'Write an engaging post about productivity tips for remote workers'"
                                        className="min-h-[100px]"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Target Platforms</Label>
                                    <div className="flex gap-2 flex-wrap">
                                        {["linkedin", "youtube", "twitter"].map((platform) => (
                                            <Button
                                                key={platform}
                                                variant={selectedPlatforms.includes(platform) ? "default" : "outline"}
                                                size="sm"
                                                onClick={() => togglePlatform(platform)}
                                            >
                                                {platform.charAt(0).toUpperCase() + platform.slice(1)}
                                            </Button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <Label>Select Post</Label>
                                <Select value={selectedPostId} onValueChange={setSelectedPostId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Choose an existing post..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {existingPosts.map((post) => (
                                            <SelectItem key={post.id} value={post.id.toString()}>
                                                {post.hook || `Post #${post.id}`} ({post.platform})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {existingPosts.length === 0 && (
                                    <p className="text-sm text-muted-foreground">
                                        No ready posts available. Create one first in the Repurpose section.
                                    </p>
                                )}
                            </div>
                        )}

                        {/* Schedule Settings */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4" />
                                    Date
                                </Label>
                                <Input
                                    type="date"
                                    value={scheduledDate}
                                    onChange={(e) => setScheduledDate(e.target.value)}
                                    min={new Date().toISOString().split('T')[0]}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="flex items-center gap-2">
                                    <Clock className="h-4 w-4" />
                                    Time
                                </Label>
                                <Input
                                    type="time"
                                    value={scheduledTime}
                                    onChange={(e) => setScheduledTime(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="flex items-center gap-2">
                                    <Repeat className="h-4 w-4" />
                                    Frequency
                                </Label>
                                <Select value={frequency} onValueChange={setFrequency}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="once">One Time</SelectItem>
                                        <SelectItem value="daily">Daily</SelectItem>
                                        <SelectItem value="weekly">Weekly</SelectItem>
                                        <SelectItem value="monthly">Monthly</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="flex gap-2">
                        <Button onClick={handleCreate} disabled={isCreating} className="gap-2">
                            <Clock className="h-4 w-4" />
                            {isCreating ? "Scheduling..." : "Schedule Post"}
                        </Button>
                        <Button variant="outline" onClick={() => { setShowForm(false); resetForm(); }}>
                            Cancel
                        </Button>
                    </CardFooter>
                </Card>
            )}

            {/* Scheduled Posts List */}
            <div className="space-y-4">
                {isLoading ? (
                    <Card className="p-8 text-center text-muted-foreground">
                        Loading scheduled posts...
                    </Card>
                ) : scheduledPosts.length === 0 ? (
                    <Card className="p-8 text-center">
                        <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                        <h3 className="font-semibold mb-2">No Scheduled Posts</h3>
                        <p className="text-muted-foreground mb-4">
                            Schedule your first post to automate your content publishing
                        </p>
                        <Button onClick={() => setShowForm(true)}>Create Schedule</Button>
                    </Card>
                ) : (
                    scheduledPosts.map((scheduled) => (
                        <Card key={scheduled.id} className={cn(
                            scheduled.status === 'paused' && "opacity-60"
                        )}>
                            <CardContent className="p-6">
                                <div className="flex items-start justify-between">
                                    <div className="space-y-2 flex-1">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <Badge className={getStatusColor(scheduled.status)}>
                                                {scheduled.status.charAt(0).toUpperCase() + scheduled.status.slice(1)}
                                            </Badge>
                                            <Badge variant="outline">
                                                {scheduled.frequency === 'once' ? 'One Time' : scheduled.frequency}
                                            </Badge>
                                            {scheduled.platforms.map(p => (
                                                <Badge key={p} variant="secondary">{p}</Badge>
                                            ))}
                                        </div>

                                        <p className="text-sm text-foreground">
                                            {scheduled.post_title || scheduled.prompt.slice(0, 100) + (scheduled.prompt.length > 100 ? '...' : '')}
                                        </p>

                                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                            <span className="flex items-center gap-1">
                                                <Calendar className="h-3 w-3" />
                                                {scheduled.next_run ? formatDate(scheduled.next_run) : formatDate(scheduled.scheduled_time)}
                                            </span>
                                            {scheduled.run_count > 0 && (
                                                <span>Runs: {scheduled.run_count}</span>
                                            )}
                                        </div>

                                        {scheduled.error_message && (
                                            <p className="text-sm text-red-500">{scheduled.error_message}</p>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-2 ml-4">
                                        {scheduled.is_active ? (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handlePause(scheduled.id)}
                                                title="Pause"
                                            >
                                                <Pause className="h-4 w-4" />
                                            </Button>
                                        ) : (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleResume(scheduled.id)}
                                                title="Resume"
                                            >
                                                <Play className="h-4 w-4" />
                                            </Button>
                                        )}
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleDelete(scheduled.id)}
                                            className="text-red-500 hover:text-red-600"
                                            title="Delete"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
