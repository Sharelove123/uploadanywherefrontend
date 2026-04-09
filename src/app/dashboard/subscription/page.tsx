"use client";

import { useEffect, useState, Suspense } from "react";
import { Check, Loader2, Crown } from "lucide-react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

interface Plan {
    id: number;
    name: string;
    display_name: string;
    price_monthly: string;
    price_yearly: string;
    features: {
        repurposes: number;
        brand_voices: number;
        direct_posting: boolean;
    }
}

function SubscriptionContent() {
    const [plans, setPlans] = useState<Plan[]>([]);
    const [currentPlan, setCurrentPlan] = useState<string>('free');
    const [isLoading, setIsLoading] = useState(true);
    const [isCheckoutLoading, setIsCheckoutLoading] = useState<number | null>(null);
    const [plansError, setPlansError] = useState<string | null>(null);
    const searchParams = useSearchParams();
    const { user, checkAuth } = useAuth();

    useEffect(() => {
        // Get current plan from user profile
        if (user?.subscription_tier) {
            setCurrentPlan(user.subscription_tier);
        }
    }, [user]);

    // Refresh user profile on success (to get new plan)
    useEffect(() => {
        if (searchParams.get('success')) {
            checkAuth();
        }
    }, [searchParams, checkAuth]);

    useEffect(() => {
        // Fetch plans
        api.get('/payments/plans/')
            .then(res => {
                if (res.data && res.data.length > 0) {
                    setPlans(res.data);
                } else {
                    setPlans([]);
                    setPlansError("No subscription plans are configured on the backend yet.");
                }
            })
            .catch(err => {
                console.error("Failed to fetch plans", err);
                setPlans([]);
                setPlansError("Failed to load subscription plans. Try again after the backend plans are configured.");
            })
            .finally(() => setIsLoading(false));
    }, []); // Empty dependency array - run only once on mount

    const handleUpgrade = async (plan: Plan) => {
        setIsCheckoutLoading(plan.id);
        try {
            const response = await api.post('/payments/create-checkout-session/', {
                plan_id: plan.id,
                interval: 'monthly'
            });
            window.location.href = response.data.url;
        } catch (error: any) {
            console.error("Checkout failed", error);
            const msg = error.response?.data?.error || "Failed to start checkout.";
            alert(`Error: ${msg}`);
        } finally {
            setIsCheckoutLoading(null);
        }
    };

    const isCurrentPlan = (plan: Plan) => {
        const planName = plan.name || '';
        const userPlan = currentPlan || '';
        return planName.toLowerCase().trim() === userPlan.toLowerCase().trim();
    };

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Subscription</h1>
                <p className="text-muted-foreground">
                    Choose the plan that best fits your content needs.
                </p>
                {currentPlan !== 'free' && (
                    <div className="mt-2 flex items-center gap-2">
                        <Crown className="h-5 w-5 text-yellow-500" />
                        <span className="text-sm font-medium">
                            Current Plan: <span className="text-primary capitalize">{currentPlan}</span>
                        </span>
                    </div>
                )}
            </div>

            {searchParams.get('success') && (
                <div className="bg-green-500/10 text-green-600 p-4 rounded-md border border-green-500/20 mb-6 flex items-center gap-2">
                    <Check className="h-5 w-5" />
                    <strong>Success!</strong> Your subscription has been activated.
                </div>
            )}

            {plansError && (
                <div className="rounded-md border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-700">
                    {plansError}
                </div>
            )}

            <div className="grid gap-8 md:grid-cols-3">
                {plans.map((plan) => (
                    <Card
                        key={plan.id}
                        className={`relative ${isCurrentPlan(plan)
                            ? "border-green-500 shadow-lg ring-2 ring-green-500/20"
                            : plan.name === 'pro'
                                ? "border-primary shadow-lg"
                                : ""
                            }`}
                    >
                        {isCurrentPlan(plan) && (
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                                <Badge className="bg-green-500 text-white">Active</Badge>
                            </div>
                        )}
                        {!isCurrentPlan(plan) && plan.name === 'pro' && (
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                                <Badge className="bg-primary text-primary-foreground">Popular</Badge>
                            </div>
                        )}
                        <CardHeader>
                            <CardTitle>{plan.display_name}</CardTitle>
                            <CardDescription>
                                <span className="text-3xl font-bold text-foreground">${plan.price_monthly}</span> / month
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-2 text-sm">
                                <li className="flex items-center gap-2">
                                    <Check className="h-4 w-4 text-green-500" />
                                    {plan.features.repurposes === -1 ? "Unlimited" : plan.features.repurposes} Repurposes
                                </li>
                                <li className="flex items-center gap-2">
                                    <Check className="h-4 w-4 text-green-500" />
                                    {plan.features.brand_voices === -1 ? "Unlimited" : plan.features.brand_voices} Brand Voices
                                </li>
                                <li className="flex items-center gap-2">
                                    {plan.features.direct_posting ? (
                                        <Check className="h-4 w-4 text-green-500" />
                                    ) : (
                                        <div className="h-4 w-4 rounded-full border border-muted-foreground/30" />
                                    )}
                                    Direct Posting
                                </li>
                            </ul>
                        </CardContent>
                        <CardFooter>
                            <Button
                                className="w-full"
                                variant={isCurrentPlan(plan) ? "secondary" : plan.name === 'pro' ? "default" : "outline"}
                                disabled={isCheckoutLoading === plan.id || isCurrentPlan(plan) || plan.name === 'free'}
                                onClick={() => handleUpgrade(plan)}
                            >
                                {isCheckoutLoading === plan.id && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {isCurrentPlan(plan) ? "Current Plan" : plan.name === 'free' ? "Included" : "Upgrade"}
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
            </div>
        </div>
    );

}

export default function SubscriptionPage() {
    return (
        <Suspense fallback={<div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
            <SubscriptionContent />
        </Suspense>
    );
}

