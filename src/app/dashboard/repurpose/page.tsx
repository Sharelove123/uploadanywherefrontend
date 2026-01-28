"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { LayoutDashboard, Youtube, FileText, Upload, Sparkles, CheckCircle2 } from "lucide-react";
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
import { cn } from "@/lib/utils";
import api from "@/lib/api";
import { useRouter } from "next/navigation";

const formSchema = z.object({
    projectName: z.string().min(1, "Project name is required").max(100),
    sourceUrl: z.string().optional(),
    rawText: z.string().optional(),
    userPrompt: z.string().optional(),
    sourceType: z.enum(["youtube", "blog", "text", "file"]),
    platforms: z.array(z.string()).min(1, "Select at least one platform"),
}).refine(data => {
    if (data.sourceType === "youtube" || data.sourceType === "blog") {
        return !!data.sourceUrl;
    }
    if (data.sourceType === "text") {
        return !!data.rawText;
    }
    return true;
}, {
    message: "Please provide the source content.",
    path: ["sourceUrl"] // highlighting sourceUrl as error generic
});

export default function RepurposePage() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<"youtube" | "blog" | "text" | "file">("youtube");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [brandVoices, setBrandVoices] = useState<{ id: number; name: string; description: string }[]>([]);
    const [selectedBrandVoice, setSelectedBrandVoice] = useState<string>("");
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [serverWakingUp, setServerWakingUp] = useState(false);

    // Listen for server waking up events
    useEffect(() => {
        const handleServerWakingUp = () => setServerWakingUp(true);
        const handleServerReady = () => setServerWakingUp(false);
        window.addEventListener('server-waking-up', handleServerWakingUp);
        return () => window.removeEventListener('server-waking-up', handleServerWakingUp);
    }, []);

    // File handling functions
    const handleFileSelect = (file: File | null) => {
        if (file) {
            const validTypes = ['application/pdf', 'text/plain', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
            if (!validTypes.includes(file.type)) {
                alert('Please upload a PDF, TXT, or DOCX file');
                return;
            }
            if (file.size > 10 * 1024 * 1024) {
                alert('File size must be less than 10MB');
                return;
            }
            setSelectedFile(file);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        handleFileSelect(file);
    };

    // Fetch brand voices on mount
    useEffect(() => {
        const fetchBrandVoices = async () => {
            try {
                const response = await api.get('/repurposer/brand-voices/');
                setBrandVoices(response.data.results || response.data || []);
            } catch (error) {
                console.error("Failed to fetch brand voices", error);
            }
        };
        fetchBrandVoices();
    }, []);

    const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            projectName: "",
            sourceType: "youtube",
            platforms: ["linkedin"],
        },
    });

    // Watch values for conditional rendering if needed, though we use activeTab state mostly
    const selectedPlatforms = watch("platforms");

    const togglePlatform = (platform: string) => {
        const current = selectedPlatforms || [];
        if (current.includes(platform)) {
            setValue("platforms", current.filter((p) => p !== platform));
        } else {
            setValue("platforms", [...current, platform]);
        }
    };

    const onSubmit = async (data: z.infer<typeof formSchema>) => {
        setIsSubmitting(true);
        try {
            console.log("Internal Submitting:", data);

            // Ensure authentication token exists (basic check)
            const token = localStorage.getItem('token');
            if (!token) {
                alert("You must be logged in to repurpose content.");
                router.push('/login');
                return;
            }

            // Use FormData for file uploads, regular JSON otherwise
            let response;
            if (data.sourceType === 'file' && selectedFile) {
                const formData = new FormData();
                formData.append('source_file', selectedFile);
                formData.append('platforms', JSON.stringify(data.platforms));
                formData.append('title', data.projectName);
                if (data.userPrompt) formData.append('user_prompt', data.userPrompt);
                if (selectedBrandVoice && selectedBrandVoice !== 'default') {
                    formData.append('brand_voice_id', selectedBrandVoice);
                }
                response = await api.post('/repurposer/repurpose/', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            } else {
                const payload = {
                    platforms: data.platforms,
                    source_url: (data.sourceType === 'youtube' || data.sourceType === 'blog') ? data.sourceUrl : undefined,
                    raw_text: data.sourceType === 'text' ? data.rawText : undefined,
                    title: data.projectName,
                    user_prompt: data.userPrompt,
                    brand_voice_id: selectedBrandVoice && selectedBrandVoice !== 'default' ? parseInt(selectedBrandVoice) : undefined,
                };
                response = await api.post('/repurposer/repurpose/', payload);
            }
            console.log("Success:", response.data);
            alert("Content repurposed successfully! Redirecting to posts...");
            router.push('/dashboard/posts');
        } catch (error: any) {
            console.error("Error submitting job:", error);
            const msg = error.response?.data?.error || error.response?.data?.message || "Something went wrong";
            alert(`Error: ${msg}`);

            if (error.response?.status === 401 || error.response?.status === 403) {
                router.push('/login');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Repurpose Content</h1>
                <p className="text-muted-foreground">
                    Transform your existing content into platform-native posts.
                </p>
            </div>

            <div className="grid gap-8 lg:grid-cols-3">
                {/* Main Input Column */}
                <div className="lg:col-span-2 space-y-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>1. Choose Source</CardTitle>
                            <CardDescription>What content do you want to repurpose?</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {/* Project Name Field */}
                            <div className="space-y-2 mb-6">
                                <Label htmlFor="project-name">Project Name</Label>
                                <Input
                                    id="project-name"
                                    placeholder="My Awesome Content"
                                    {...register("projectName")}
                                />
                                {errors.projectName && <p className="text-sm text-destructive">{errors.projectName.message}</p>}
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                                <Button
                                    variant={activeTab === "youtube" ? "default" : "outline"}
                                    className="h-24 flex-col gap-2"
                                    onClick={() => { setActiveTab("youtube"); setValue("sourceType", "youtube"); }}
                                    type="button"
                                >
                                    <Youtube className="h-6 w-6" />
                                    YouTube
                                </Button>
                                <Button
                                    variant={activeTab === "blog" ? "default" : "outline"}
                                    className="h-24 flex-col gap-2"
                                    onClick={() => { setActiveTab("blog"); setValue("sourceType", "blog"); }}
                                    type="button"
                                >
                                    <LayoutDashboard className="h-6 w-6" />
                                    Article
                                </Button>
                                <Button
                                    variant={activeTab === "text" ? "default" : "outline"}
                                    className="h-24 flex-col gap-2"
                                    onClick={() => { setActiveTab("text"); setValue("sourceType", "text"); }}
                                    type="button"
                                >
                                    <FileText className="h-6 w-6" />
                                    Text
                                </Button>
                                <Button
                                    variant={activeTab === "file" ? "default" : "outline"}
                                    className="h-24 flex-col gap-2"
                                    onClick={() => { setActiveTab("file"); setValue("sourceType", "file"); }}
                                    type="button"
                                >
                                    <Upload className="h-6 w-6" />
                                    File
                                </Button>
                            </div>

                            <div className="space-y-4">
                                {activeTab === "youtube" && (
                                    <div className="space-y-2">
                                        <Label htmlFor="youtube-url">YouTube URL</Label>
                                        <Input
                                            id="youtube-url"
                                            placeholder="https://www.youtube.com/watch?v=..."
                                            {...register("sourceUrl")}
                                        />
                                        {errors.sourceUrl && <p className="text-sm text-destructive">{errors.sourceUrl.message}</p>}
                                    </div>
                                )}
                                {activeTab === "blog" && (
                                    <div className="space-y-2">
                                        <Label htmlFor="blog-url">Article URL</Label>
                                        <Input
                                            id="blog-url"
                                            placeholder="https://medium.com/..."
                                            {...register("sourceUrl")}
                                        />
                                    </div>
                                )}
                                {activeTab === "text" && (
                                    <div className="space-y-2">
                                        <Label htmlFor="text-content">Paste Text</Label>
                                        <Textarea
                                            id="text-content"
                                            placeholder="Paste your content here..."
                                            className="min-h-[200px]"
                                            {...register("rawText")}
                                        />
                                    </div>
                                )}
                                {activeTab === "file" && (
                                    <div
                                        className={`border-2 border-dashed rounded-lg p-12 flex flex-col items-center justify-center text-center transition-colors cursor-pointer ${isDragging ? 'border-primary bg-primary/10' : 'border-muted-foreground/25 hover:bg-muted/50'
                                            } ${selectedFile ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : ''}`}
                                        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                                        onDragLeave={() => setIsDragging(false)}
                                        onDrop={handleDrop}
                                        onClick={() => document.getElementById('file-input')?.click()}
                                    >
                                        <input
                                            id="file-input"
                                            type="file"
                                            accept=".pdf,.txt,.docx"
                                            className="hidden"
                                            onChange={(e) => handleFileSelect(e.target.files?.[0] || null)}
                                        />
                                        {selectedFile ? (
                                            <>
                                                <CheckCircle2 className="h-8 w-8 mb-4 text-green-500" />
                                                <p className="text-sm font-medium text-foreground">{selectedFile.name}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                                                </p>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="mt-2"
                                                    onClick={(e) => { e.stopPropagation(); setSelectedFile(null); }}
                                                >
                                                    Remove
                                                </Button>
                                            </>
                                        ) : (
                                            <>
                                                <Upload className="h-8 w-8 mb-4 text-muted-foreground" />
                                                <p className="text-sm font-medium">Click to upload or drag and drop</p>
                                                <p className="text-xs text-muted-foreground">PDF, DOCX, TXT up to 10MB</p>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>2. Select Platforms</CardTitle>
                            <CardDescription>Where do you want to publish this content?</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {[
                                    { id: "linkedin", label: "LinkedIn Post", desc: "Professional updates & slides" },
                                    { id: "twitter", label: "Twitter Thread", desc: "Engaging short-form thread" },
                                    { id: "youtube", label: "YouTube Video", desc: "Video description and hook" },
                                    { id: "instagram", label: "Instagram", desc: "Visual post captions" },
                                    { id: "facebook", label: "Facebook Post", desc: "Engaging social update" },
                                ].map((platform) => (
                                    <div
                                        key={platform.id}
                                        onClick={() => togglePlatform(platform.id)}
                                        className={cn(
                                            "flex items-start space-x-4 rounded-md border p-4 cursor-pointer transition-all hover:bg-accent",
                                            selectedPlatforms?.includes(platform.id) ? "border-primary bg-primary/5" : ""
                                        )}
                                    >
                                        <div className={cn(
                                            "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border",
                                            selectedPlatforms?.includes(platform.id)
                                                ? "bg-primary border-primary text-primary-foreground"
                                                : "border-primary"
                                        )}>
                                            {selectedPlatforms?.includes(platform.id) && <CheckCircle2 className="h-3 w-3" />}
                                        </div>
                                        <div className="flex-1 space-y-1">
                                            <p className="text-sm font-medium leading-none">{platform.label}</p>
                                            <p className="text-sm text-muted-foreground">{platform.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            {errors.platforms && <p className="text-sm text-destructive mt-2">{errors.platforms.message}</p>}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>3. Custom Instructions (Optional)</CardTitle>
                            <CardDescription>Guide the AI with specific instructions (e.g., "Make it funny", "Write like a pirate").</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Textarea
                                placeholder="E.g., Focus on the second key point and make it sound professional..."
                                className="min-h-[100px]"
                                {...register("userPrompt")}
                            />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>4. Brand Voice (Optional)</CardTitle>
                            <CardDescription>Apply your custom writing style to the generated content.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Select value={selectedBrandVoice} onValueChange={setSelectedBrandVoice}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Default (Professional & Engaging)" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="default">Default (Professional & Engaging)</SelectItem>
                                    {brandVoices.map((voice) => (
                                        <SelectItem key={voice.id} value={voice.id.toString()}>
                                            {voice.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {brandVoices.length === 0 && (
                                <p className="text-xs text-muted-foreground mt-2">
                                    No custom brand voices yet. Create one in Settings to personalize your content.
                                </p>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar Column */}
                <div className="space-y-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>Summary</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Source Type</span>
                                <span className="font-medium capitalize">{activeTab}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Platforms</span>
                                <span className="font-medium">{selectedPlatforms?.length || 0} selected</span>
                            </div>
                            <div className="border-t pt-4">
                                <div className="flex justify-between text-sm font-medium">
                                    <span>Estimated Cost</span>
                                    <span>1 Credit</span>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">You have 8 credits remaining.</p>
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button
                                className="w-full gap-2"
                                size="lg"
                                onClick={handleSubmit(onSubmit)}
                                disabled={isSubmitting}
                            >
                                <Sparkles className="h-4 w-4" />
                                {isSubmitting ? "Processing..." : "Generate Content"}
                            </Button>
                        </CardFooter>
                    </Card>
                </div>
            </div>
        </div>
    );
}
