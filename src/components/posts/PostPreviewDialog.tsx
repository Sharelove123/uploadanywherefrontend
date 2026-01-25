
"use client";

import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import {
    ThumbsUp,
    MessageSquare,
    Share2,
    Send,
    Repeat2,
    Heart,
    BarChart2,
    MoreHorizontal,
    X,
    ImageIcon
} from 'lucide-react';
import { ScrollArea } from "../ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { getMediaUrl } from "@/lib/utils";

export interface Post {
    id: number;
    platform: "linkedin" | "twitter" | "instagram" | "youtube";
    platform_display: string;
    status: "pending" | "ready" | "published" | "failed"; // Added status
    status_display?: string; // Added optional
    generated_content: string;
    hook?: string;
    thread_posts?: string[] | null; // Allow null or undefined
    is_thread: boolean;
    hashtags?: string[];
    media_file?: string; // URL to media file
}

interface PostPreviewDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    post: Post | null;
}

const YouTubePreview = ({ post }: { post: Post }) => {
    return (
        <div className="bg-white max-w-[600px] w-full mx-auto font-sans text-left">
            {/* Video Player Mock */}
            <div className="aspect-video bg-black flex items-center justify-center relative group cursor-pointer">
                {post.media_file ? (
                    <video src={getMediaUrl(post.media_file)} className="w-full h-full object-contain" controls />
                ) : (
                    <div className="text-white flex flex-col items-center">
                        <div className="w-16 h-12 bg-red-600 rounded-lg flex items-center justify-center mb-2">
                            <div className="w-0 h-0 border-t-[8px] border-t-transparent border-l-[14px] border-l-white border-b-[8px] border-b-transparent ml-1"></div>
                        </div>
                        <span className="text-sm text-gray-300">Video Preview</span>
                    </div>
                )}
            </div>

            {/* Meta */}
            <div className="p-4">
                <h3 className="text-lg font-semibold text-slate-900 line-clamp-2 leading-snug mb-1">
                    {post.hook || "Video Title Placeholder"}
                </h3>

                <div className="flex items-center text-xs text-slate-500 mb-4">
                    <span>1.2K views</span>
                    <span className="mx-1">•</span>
                    <span>2 hours ago</span>
                </div>

                {/* Channel & Description */}
                <div className="flex gap-3 items-start border-t border-b py-3">
                    <Avatar className="h-10 w-10">
                        <AvatarFallback>CH</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                        <h4 className="text-sm font-medium text-slate-900">Channel Name</h4>
                        <p className="text-xs text-slate-500 mb-2">10K subscribers</p>
                        <div className="text-sm text-slate-800 whitespace-pre-wrap leading-relaxed line-clamp-3">
                            {post.generated_content}
                        </div>
                        <button className="text-xs font-medium text-slate-600 mt-1">...more</button>
                    </div>
                    <Button className="bg-black text-white hover:bg-slate-800 h-9 rounded-full px-4 text-sm font-medium">
                        Subscribe
                    </Button>
                </div>
            </div>
        </div>
    );
};

const InstagramPreview = ({ post }: { post: Post }) => {
    return (
        <div className="bg-white border rounded-lg shadow-sm max-w-[400px] mx-auto font-sans text-left pb-4">
            {/* Header */}
            <div className="p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8 ring-2 ring-transparent ring-offset-1 bg-gradient-to-tr from-yellow-400 to-fuchsia-600 p-[2px]">
                        <AvatarFallback className="bg-slate-100">IG</AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-semibold text-slate-900">your_username</span>
                </div>
                <MoreHorizontal className="h-5 w-5 text-slate-900" />
            </div>

            {/* Image */}
            <div className="aspect-square bg-slate-100 flex items-center justify-center overflow-hidden">
                {post.media_file ? (
                    <img src={getMediaUrl(post.media_file)} alt="Post media" className="w-full h-full object-cover" />
                ) : (
                    <div className="text-slate-400 flex flex-col items-center">
                        <ImageIcon className="h-12 w-12 mb-2 opacity-50" />
                        <span className="text-xs">Image Preview</span>
                    </div>
                )}
            </div>

            {/* Actions */}
            <div className="px-3 pt-3 pb-2 flex justify-between items-center">
                <div className="flex gap-4">
                    <Heart className="h-6 w-6 text-slate-900" />
                    <MessageSquare className="h-6 w-6 text-slate-900" />
                    <Send className="h-6 w-6 text-slate-900 -rotate-45 mb-1" />
                </div>
                <div className="h-6 w-6 border-slate-900 border-2 rounded-sm" /> {/* Save icon placeholder */}
            </div>

            {/* Likes */}
            <div className="px-3 text-sm font-semibold text-slate-900 mb-1">
                2,453 likes
            </div>

            {/* Caption */}
            <div className="px-3 text-sm text-slate-900">
                <span className="font-semibold mr-2">your_username</span>
                <span className="whitespace-pre-wrap">{post.generated_content}</span>
                {post.hashtags && post.hashtags.length > 0 && (
                    <div className="text-blue-900 mt-1">
                        {post.hashtags.map(tag => tag.startsWith('#') ? tag : `#${tag}`).join(' ')}
                    </div>
                )}
            </div>

            <div className="px-3 mt-1 text-xs text-slate-500 uppercase">
                4 HOURS AGO
            </div>
        </div>
    );
};

const LinkedInPreview = ({ post }: { post: Post }) => {
    return (
        <div className="bg-white border rounded-lg shadow-sm max-w-[550px] mx-auto overflow-hidden font-sans text-left">
            {/* ... existing LinkedIn code ... */}
            <div className="p-4 pb-2 flex gap-3">
                <Avatar className="h-12 w-12">
                    <AvatarImage src="" /> {/* Placeholder for user image */}
                    <AvatarFallback>ME</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="font-semibold text-sm leading-tight text-slate-900">Your Name</h3>
                            <p className="text-xs text-slate-500">Your Headline • 1st</p>
                            <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                                <span>1h</span>
                                <span>•</span>
                                <span className="text-slate-500">🌐</span>
                            </div>
                        </div>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500">
                            <MoreHorizontal className="h-5 w-5" />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="px-4 py-2 text-sm text-slate-900 whitespace-pre-wrap">
                {post.generated_content}

                {post.hashtags && post.hashtags.length > 0 && (
                    <div className="mt-3 text-[#0a66c2] font-semibold">
                        {post.hashtags.map(tag => tag.startsWith('#') ? tag : `#${tag}`).join(' ')}
                    </div>
                )}
            </div>

            {/* Media */}
            {post.media_file && (
                <div className="w-full">
                    <img src={getMediaUrl(post.media_file)} alt="Post media" className="w-full h-auto object-cover max-h-[500px]" />
                </div>
            )}

            {/* Engagement Stats (Faked) */}
            <div className="px-4 py-2 text-xs text-slate-500 border-b flex justify-between items-center">
                <div className="flex items-center gap-1">
                    <div className="bg-[#0a66c2] rounded-full p-0.5">
                        <ThumbsUp className="h-2 w-2 text-white fill-white" />
                    </div>
                    <span>12</span>
                </div>
                <div>
                    2 comments • 1 repost
                </div>
            </div>

            {/* Actions */}
            <div className="px-2 py-1 flex items-center justify-between">
                <Button variant="ghost" className="flex-1 gap-2 text-slate-600 font-medium hover:bg-slate-100 h-12">
                    <ThumbsUp className="h-5 w-5" />
                    <span className="text-sm">Like</span>
                </Button>
                <Button variant="ghost" className="flex-1 gap-2 text-slate-600 font-medium hover:bg-slate-100 h-12">
                    <MessageSquare className="h-5 w-5" />
                    <span className="text-sm">Comment</span>
                </Button>
                <Button variant="ghost" className="flex-1 gap-2 text-slate-600 font-medium hover:bg-slate-100 h-12">
                    <Repeat2 className="h-5 w-5" />
                    <span className="text-sm">Repost</span>
                </Button>
                <Button variant="ghost" className="flex-1 gap-2 text-slate-600 font-medium hover:bg-slate-100 h-12">
                    <Send className="h-5 w-5" />
                    <span className="text-sm">Send</span>
                </Button>
            </div>
        </div>
    );
};

const TwitterPreview = ({ post }: { post: Post }) => {
    // Combine main content and thread chunks
    const tweets = [post.generated_content];
    if (post.is_thread && post.thread_posts) {
        tweets.push(...post.thread_posts);
    }

    return (
        <div className="max-w-[500px] mx-auto font-sans text-left">
            {tweets.map((tweetContent, index) => (
                <div key={index} className="relative flex gap-3 pb-6 last:pb-0">
                    {/* Thread Line */}
                    {index < tweets.length - 1 && (
                        <div className="absolute left-[22px] top-12 bottom-0 w-0.5 bg-slate-200" />
                    )}

                    <Avatar className="h-11 w-11 border shrink-0 z-10">
                        <AvatarFallback>ME</AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1 text-[15px]">
                            <span className="font-bold text-slate-900">Your Name</span>
                            <span className="text-slate-500">@yourhandle</span>
                            <span className="text-slate-500">·</span>
                            <span className="text-slate-500 text-sm">1h</span>
                            <div className="ml-auto">
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500">
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>

                        <div className="text-[15px] leading-normal text-slate-900 whitespace-pre-wrap mb-3">
                            {tweetContent}
                        </div>

                        {/* Show media on first tweet only for now */}
                        {index === 0 && post.media_file && (
                            <div className="mb-3 rounded-xl overflow-hidden border">
                                <img src={getMediaUrl(post.media_file)} alt="Post media" className="w-full h-auto object-cover max-h-[300px]" />
                            </div>
                        )}

                        <div className="flex items-center justify-between text-slate-500 max-w-sm -ml-2">
                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-blue-500 hover:bg-blue-50 rounded-full">
                                <MessageSquare className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-green-500 hover:bg-green-50 rounded-full">
                                <Repeat2 className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-pink-500 hover:bg-pink-50 rounded-full">
                                <Heart className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-blue-500 hover:bg-blue-50 rounded-full">
                                <BarChart2 className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-blue-500 hover:bg-blue-50 rounded-full">
                                <Share2 className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export function PostPreviewDialog({ open, onOpenChange, post }: PostPreviewDialogProps) {
    if (!post) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 gap-0 bg-slate-50">
                <DialogHeader className="p-6 pb-2 border-b bg-white">
                    <DialogTitle className="flex items-center gap-2">
                        Preview on {post.platform_display}
                        <Badge variant="outline" className="ml-2 font-normal text-xs uppercase tracking-wider">
                            {post.status === 'published' ? 'Live' : 'Draft'}
                        </Badge>
                    </DialogTitle>
                </DialogHeader>

                <ScrollArea className="flex-1 p-6">
                    <div className="flex justify-center min-h-[300px] items-start">
                        {post.platform === 'linkedin' && <LinkedInPreview post={post} />}
                        {post.platform === 'twitter' && <TwitterPreview post={post} />}
                        {post.platform === 'youtube' && <YouTubePreview post={post} />}
                        {post.platform === 'instagram' && <InstagramPreview post={post} />}
                        {!['linkedin', 'twitter', 'youtube', 'instagram'].includes(post.platform) && (
                            <div className="text-center text-muted-foreground p-10">
                                Preview not available for this platform.
                                <div className="mt-4 p-4 bg-white border rounded text-left whitespace-pre-wrap">
                                    {post.generated_content}
                                </div>
                            </div>
                        )}
                    </div>
                </ScrollArea>

                <div className="p-4 border-t bg-white flex justify-end gap-2">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Close
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
