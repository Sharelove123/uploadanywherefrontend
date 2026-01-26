"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import api from "@/lib/api";

interface BrandVoice {
    id: number;
    name: string;
    description: string;
    sample_posts?: string;
    created_at: string;
}

export default function SettingsPage() {
    const [brandVoices, setBrandVoices] = useState<BrandVoice[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingVoice, setEditingVoice] = useState<BrandVoice | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    // Form state
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [samplePosts, setSamplePosts] = useState("");

    useEffect(() => {
        fetchBrandVoices();
    }, []);

    const fetchBrandVoices = async () => {
        try {
            const response = await api.get('/repurposer/brand-voices/');
            setBrandVoices(response.data.results || response.data || []);
        } catch (error) {
            console.error("Failed to fetch brand voices", error);
        } finally {
            setIsLoading(false);
        }
    };

    const openCreateDialog = () => {
        setEditingVoice(null);
        setName("");
        setDescription("");
        setSamplePosts("");
        setIsDialogOpen(true);
    };

    const openEditDialog = (voice: BrandVoice) => {
        setEditingVoice(voice);
        setName(voice.name);
        setDescription(voice.description);
        // Cast to any because the interface defined locally is incomplete compared to API
        setSamplePosts((voice as any).sample_posts || "");
        setIsDialogOpen(true);
    };

    const handleSave = async () => {
        if (!name.trim()) {
            alert("Please enter a name for the brand voice.");
            return;
        }

        if (!samplePosts.trim()) {
            alert("Please provide sample posts so we can learn your style.");
            return;
        }

        setIsSaving(true);
        try {
            if (editingVoice) {
                // Update existing
                const response = await api.patch(`/repurposer/brand-voices/${editingVoice.id}/`, {
                    name,
                    description,
                    sample_posts: samplePosts,
                });
                setBrandVoices(prev => prev.map(v => v.id === editingVoice.id ? response.data : v));
            } else {
                // Create new
                const response = await api.post('/repurposer/brand-voices/', {
                    name,
                    description,
                    sample_posts: samplePosts,
                });
                setBrandVoices(prev => [...prev, response.data]);
            }
            setIsDialogOpen(false);
        } catch (error: any) {
            console.error("Failed to save brand voice", error);
            const msg = error.response?.data?.error || error.response?.data?.detail || "Failed to save.";
            alert(msg);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure you want to delete this brand voice?")) return;

        try {
            await api.delete(`/repurposer/brand-voices/${id}/`);
            setBrandVoices(prev => prev.filter(v => v.id !== id));
        } catch (error) {
            console.error("Failed to delete brand voice", error);
            alert("Failed to delete brand voice.");
        }
    };

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
                <p className="text-muted-foreground">
                    Manage your account settings and preferences.
                </p>
            </div>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Brand Voices</CardTitle>
                        <CardDescription>
                            Create custom writing styles for your repurposed content.
                        </CardDescription>
                    </div>
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button onClick={openCreateDialog}>
                                <Plus className="h-4 w-4 mr-2" />
                                Add Brand Voice
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>
                                    {editingVoice ? "Edit Brand Voice" : "Create Brand Voice"}
                                </DialogTitle>
                                <DialogDescription>
                                    Define a writing style that will be applied when generating content.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="name">Name</Label>
                                    <Input
                                        id="name"
                                        placeholder="e.g., Professional & Authoritative"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="description">Description</Label>
                                    <Textarea
                                        id="description"
                                        placeholder="Describe the tone, style, and characteristics of this voice..."
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        className="h-32"
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Tip: Be specific! Example: "Write in a friendly, conversational tone. Use short sentences. Include occasional humor. Avoid jargon."
                                    </p>
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="samplePosts">Sample Posts (Required)</Label>
                                    <Textarea
                                        id="samplePosts"
                                        placeholder="Paste 3-5 examples of posts you like..."
                                        value={samplePosts}
                                        onChange={(e) => setSamplePosts(e.target.value)}
                                        className="h-32"
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        The AI will analyze these to match your style.
                                    </p>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSaving}>
                                    Cancel
                                </Button>
                                <Button onClick={handleSave} disabled={isSaving}>
                                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    {editingVoice ? "Save Changes" : "Create"}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : brandVoices.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <p>No brand voices yet.</p>
                            <p className="text-sm">Create your first brand voice to personalize your content.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {brandVoices.map((voice) => (
                                <div
                                    key={voice.id}
                                    className="flex items-start justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                                >
                                    <div className="space-y-1 flex-1 mr-4">
                                        <h4 className="font-medium">{voice.name}</h4>
                                        <p className="text-sm text-muted-foreground line-clamp-2">
                                            {voice.description || "No description"}
                                        </p>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => openEditDialog(voice)}
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleDelete(voice.id)}
                                        >
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
