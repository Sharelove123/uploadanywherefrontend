
import React, { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Upload, ImageIcon } from "lucide-react";
import api from "@/lib/api";

// Re-using Post interface locally or could export from a types file
export interface Post {
    id: number;
    platform: "linkedin" | "twitter" | "instagram" | "youtube";
    platform_display: string;
    status: "pending" | "ready" | "published" | "failed";
    status_display: string;
    generated_content: string;
    hook: string;
    created_at: string;
    is_thread: boolean;
    thread_posts?: string[];
    hashtags?: string[];
    media_file?: string;
}

interface EditPostDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    post: Post | null;
    onPostUpdated: (updatedPost: Post) => void;
}

export function EditPostDialog({ open, onOpenChange, post, onPostUpdated }: EditPostDialogProps) {
    const [content, setContent] = useState("");
    const [hook, setHook] = useState("");
    const [mediaFile, setMediaFile] = useState<File | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    // Load initial data when post changes
    React.useEffect(() => {
        if (post) {
            setContent(post.generated_content || "");
            setHook(post.hook || "");
            setMediaFile(null); // Reset file input
        }
    }, [post]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setMediaFile(e.target.files[0]);
        }
    };

    const handleSave = async () => {
        if (!post) return;

        setIsSaving(true);
        try {
            const formData = new FormData();
            formData.append('generated_content', content);
            formData.append('hook', hook);

            if (mediaFile) {
                formData.append('media_file', mediaFile);
            }

            const response = await api.patch(`/repurposer/posts/${post.id}/`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            onPostUpdated(response.data);
            onOpenChange(false);
        } catch (error) {
            console.error("Failed to update post", error);
            alert("Failed to save changes.");
        } finally {
            setIsSaving(false);
        }
    };

    if (!post) return null;

    const isYouTube = post.platform === 'youtube';
    const isInstagram = post.platform === 'instagram';

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Edit {post.platform_display} Post</DialogTitle>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    {isYouTube && (
                        <div className="grid gap-2">
                            <Label htmlFor="hook">Video Title</Label>
                            <Input
                                id="hook"
                                value={hook}
                                onChange={(e) => setHook(e.target.value)}
                                placeholder="Enter video title..."
                            />
                        </div>
                    )}

                    <div className="grid gap-2">
                        <Label htmlFor="content">
                            {isYouTube ? "Video Description" : isInstagram ? "Caption" : "Post Content"}
                        </Label>
                        <Textarea
                            id="content"
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            className="h-40"
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="media">
                            {isYouTube ? "Video File" : isInstagram ? "Image" : "Media Attachment"}
                        </Label>
                        <div className="flex items-center gap-4">
                            <Input
                                id="media"
                                type="file"
                                accept={isYouTube ? "video/*" : isInstagram ? "image/*" : "image/*,video/*"}
                                onChange={handleFileChange}
                                className="hidden"
                            />
                            <Button variant="outline" onClick={() => document.getElementById('media')?.click()} className="w-full">
                                {mediaFile ? (
                                    <>
                                        <ImageIcon className="mr-2 h-4 w-4" />
                                        {mediaFile.name}
                                    </>
                                ) : (
                                    <>
                                        <Upload className="mr-2 h-4 w-4" />
                                        {isYouTube ? "Upload Video" : "Upload Media"}
                                    </>
                                )}
                            </Button>
                        </div>
                        {post.media_file && !mediaFile && (
                            <p className="text-xs text-muted-foreground mt-1">
                                Current media: <a href={post.media_file} target="_blank" rel="noopener noreferrer" className="underline">View</a>
                            </p>
                        )}
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={isSaving}>
                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Changes
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
