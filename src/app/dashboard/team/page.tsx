'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Loader2, Trash2, Mail, UserPlus, Shield } from 'lucide-react';
import { toast } from 'sonner';

interface Member {
    id: number;
    user: number;
    email?: string; // Added email field
    role: string;
    is_active: boolean;
}

interface Invitation {
    id: number;
    email: string;
    role: string;
    invited_by_email: string;
    created_at: string;
    status: string;
}

export default function TeamPage() {
    const [members, setMembers] = useState<Member[]>([]);
    const [invitations, setInvitations] = useState<Invitation[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isInviteOpen, setIsInviteOpen] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState('member');
    const [sendingInvite, setSendingInvite] = useState(false);
    const [origin, setOrigin] = useState('');

    useEffect(() => {
        setOrigin(window.location.origin);
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setIsLoading(true);
            const [membersRes, invitesRes] = await Promise.all([
                api.get('/teams/'),
                api.get('/teams/invitations/')
            ]);

            // Handle pagination (DRF returns { count: ..., results: [...] })
            setMembers(membersRes.data.results || membersRes.data);
            setInvitations(invitesRes.data.results || invitesRes.data);
        } catch (error) {
            console.error('Failed to fetch team data:', error);
            toast.error('Failed to load team data');
        } finally {
            setIsLoading(false);
        }
    };

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inviteEmail) return;

        try {
            setSendingInvite(true);
            await api.post('/teams/invite/', {
                email: inviteEmail,
                role: inviteRole
            });
            toast.success('Invitation sent successfully');
            setIsInviteOpen(false);
            setInviteEmail('');
            setInviteRole('member');
            fetchData(); // Refresh lists
        } catch (error: any) {
            console.error('Invite failed:', error);
            toast.error(error.response?.data?.email?.[0] || 'Failed to send invitation');
        } finally {
            setSendingInvite(false);
        }
    };

    const handleCancelInvite = async (id: number) => {
        if (!confirm('Are you sure you want to cancel this invitation?')) return;

        try {
            await api.delete(`/teams/invitations/${id}/cancel/`);
            toast.success('Invitation cancelled');
            setInvitations(prev => prev.filter(inv => inv.id !== id));
        } catch (error) {
            console.error('Cancel failed:', error);
            toast.error('Failed to cancel invitation');
        }
    };

    return (
        <div className="container mx-auto p-6 max-w-5xl">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Team Management</h1>
                    <p className="text-muted-foreground mt-2">Manage your team members and permissions.</p>
                </div>
                <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <UserPlus className="mr-2 h-4 w-4" />
                            Invite Member
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Invite Team Member</DialogTitle>
                            <DialogDescription>
                                Send an email invitation to add a new member to your team.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleInvite}>
                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="email">Email address</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="colleague@company.com"
                                        value={inviteEmail}
                                        onChange={(e) => setInviteEmail(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="role">Role</Label>
                                    <Select value={inviteRole} onValueChange={setInviteRole}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="admin">Admin (Full Access)</SelectItem>
                                            <SelectItem value="member">Member (Create Content)</SelectItem>
                                            <SelectItem value="viewer">Viewer (Read Only)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setIsInviteOpen(false)}>Cancel</Button>
                                <Button type="submit" disabled={sendingInvite}>
                                    {sendingInvite && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Send Invitation
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <Tabs defaultValue="members">
                <TabsList className="mb-4">
                    <TabsTrigger value="members">Active Members</TabsTrigger>
                    <TabsTrigger value="pending">Pending Invitations</TabsTrigger>
                </TabsList>

                <TabsContent value="members">
                    <Card>
                        <CardHeader>
                            <CardTitle>Team Members</CardTitle>
                            <CardDescription>People with access to this workspace.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {isLoading ? (
                                <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
                            ) : members.length === 0 ? (
                                <div className="text-center p-8 text-muted-foreground">No active members found.</div>
                            ) : (
                                <div className="space-y-4">
                                    {members.map((member) => (
                                        <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg">
                                            <div className="flex items-center gap-4">
                                                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                                    <span className="font-semibold text-primary">
                                                        {member.email ? member.email[0].toUpperCase() : 'U'}
                                                    </span>
                                                </div>
                                                <div>
                                                    <p className="font-medium">{member.email || `User #${member.user}`}</p>
                                                    <div className="flex gap-2 text-sm text-muted-foreground">
                                                        <Badge variant="secondary" className="capitalize">{member.role}</Badge>
                                                    </div>
                                                </div>
                                            </div>
                                            {/* Actions like remove member could go here */}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="pending">
                    <Card>
                        <CardHeader>
                            <CardTitle>Pending Invitations</CardTitle>
                            <CardDescription>Invitations sent but not yet accepted.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {isLoading ? (
                                <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
                            ) : invitations.length === 0 ? (
                                <div className="text-center p-8 text-muted-foreground">No pending invitations.</div>
                            ) : (
                                <div className="space-y-4">
                                    {invitations.map((invite) => (
                                        <div key={invite.id} className="flex items-center justify-between p-4 border rounded-lg">
                                            <div className="flex items-center gap-4">
                                                <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                                                    <Mail className="h-5 w-5 text-orange-600" />
                                                </div>
                                                <div>
                                                    <p className="font-medium">{invite.email}</p>
                                                    <div className="flex gap-2 text-sm text-muted-foreground">
                                                        <span>Invited by {invite.invited_by_email}</span>
                                                        <span>•</span>
                                                        <Badge variant="outline" className="capitalize">{invite.role}</Badge>
                                                        {invite.status === 'expired' && <Badge variant="destructive">Expired</Badge>}
                                                    </div>
                                                </div>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                                onClick={() => handleCancelInvite(invite.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                            <div className="mt-4 p-4 bg-muted/50 rounded-lg text-sm text-muted-foreground">
                                <p className="flex items-center gap-2">
                                    <Shield className="h-4 w-4" />
                                    Invite link format: <code>{origin}/signup?token=...</code>
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
