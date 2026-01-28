"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import api from "@/lib/api";
import {
    LayoutDashboard,
    PenTool,
    Share2,
    CreditCard,
    Settings,
    LogOut,
    Sparkles,
    Users,
    Clock,
} from "lucide-react";

const sidebarItems = [
    {
        title: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
    },
    {
        title: "Team",
        href: "/dashboard/team",
        icon: Users,
    },
    {
        title: "Repurpose",
        href: "/dashboard/repurpose",
        icon: Sparkles,
    },
    {
        title: "My Posts",
        href: "/dashboard/posts",
        icon: PenTool,
    },
    {
        title: "Schedule",
        href: "/dashboard/schedule",
        icon: Clock,
    },
    {
        title: "Social Accounts",
        href: "/dashboard/social",
        icon: Share2,
    },
    {
        title: "Subscription",
        href: "/dashboard/subscription",
        icon: CreditCard,
    },

    {
        title: "Settings",
        href: "/dashboard/settings",
        icon: Settings,
    },
];

export function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();

    const handleLogout = async () => {
        try {
            await api.post("/auth/logout/");
        } catch (err) {
            console.error("Logout failed", err);
        } finally {
            router.push("/login");
        }
    };

    return (
        <div className="flex h-screen w-64 flex-col border-r bg-card text-card-foreground">
            <div className="flex h-16 items-center border-b px-6">
                <Link href="/dashboard" className="flex items-center gap-2 font-bold text-xl">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                        <Sparkles className="h-5 w-5" />
                    </div>
                    <span>Repurpose.ai</span>
                </Link>
            </div>

            <div className="flex-1 overflow-y-auto py-4">
                <nav className="grid gap-1 px-2">
                    {sidebarItems.map((item, index) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={index}
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                                    isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground"
                                )}
                            >
                                <item.icon className="h-4 w-4" />
                                {item.title}
                            </Link>
                        );
                    })}
                </nav>
            </div>

            <div className="border-t p-4">
                <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
                >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                </button>
            </div>
        </div>
    );
}
