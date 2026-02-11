"use client";

import { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  CreditCard,
  Check,
  Crown,
  Zap,
  Building2,
  AlertTriangle,
  Loader2,
  X,
} from "lucide-react";
import { PLANS, type PlanId, type Plan, FEATURE_LABELS, type FeatureKey, FREE_TRIAL_DAYS } from "@/lib/plans";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from 'sonner';

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface BillingStatus {
  plan: Plan;
  currentPlanId: string;
  planExpiresAt: string | null;
  trialEndsAt: string | null;
  isTrialing: boolean;
  hasActiveSubscription: boolean;
  usage: {
    tables: number;
    menuItems: number;
    users: number;
  };
}

const planIcons: Record<PlanId, React.ReactNode> = {
  starter: <Zap className="h-6 w-6" />,
  pro: <Crown className="h-6 w-6" />,
  enterprise: <Building2 className="h-6 w-6" />,
};

const booleanFeatures: FeatureKey[] = [
  "qrOrdering",
  "kds",
  "reports",
  "inventory",
  "loyalty",
  "reservations",
  "expenses",
  "customReceipts",
  "multiLocation",
  "apiAccess",
  "prioritySupport",
];

export default function BillingPage() {
  const { restaurant } = useAuth();
  const [billing, setBilling] = useState<BillingStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState<PlanId | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const loadBilling = useCallback(async () => {
    try {
      const res = await fetch("/api/billing/status");
      if (res.ok) {
        const data = await res.json();
        setBilling(data);
      }
    } catch (err) {
      console.error("Failed to load billing:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBilling();
  }, [loadBilling]);

  // Load Razorpay checkout script
  useEffect(() => {
    if (document.getElementById("razorpay-checkout-script")) return;
    const script = document.createElement("script");
    script.id = "razorpay-checkout-script";
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.head.appendChild(script);
  }, []);

  const handleSubscribe = async (planId: PlanId) => {
    if (planId === "starter" || subscribing) return;
    setSubscribing(planId);

    try {
      // 1. Create subscription on server
      const res = await fetch("/api/billing/subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
      });

      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Failed to create subscription");
        return;
      }

      const { subscriptionId, razorpayKeyId } = await res.json();

      // 2. Open Razorpay checkout
      const options = {
        key: razorpayKeyId,
        subscription_id: subscriptionId,
        name: "ServeOne",
        description: `${PLANS[planId].name} Plan - Monthly`,
        handler: async (response: any) => {
          // 3. Verify payment on server
          const verifyRes = await fetch("/api/billing/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_subscription_id: response.razorpay_subscription_id,
              razorpay_signature: response.razorpay_signature,
              planId,
            }),
          });

          if (verifyRes.ok) {
            await loadBilling();
            toast.success("Subscription activated successfully!");
          } else {
            toast.error("Payment verification failed. Please contact support.");
          }
        },
        prefill: {
          contact: restaurant?.mobile || "",
        },
        theme: {
          color: "#10b981",
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error("Subscribe error:", err);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSubscribing(null);
    }
  };

  const handleCancelSubscription = async () => {
    setCancelling(true);
    try {
      const res = await fetch("/api/billing/subscription", { method: "DELETE" });
      if (res.ok) {
        setShowCancelConfirm(false);
        await loadBilling();
        toast.success("Subscription cancelled. You can continue using your plan until the current billing period ends.");
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to cancel subscription");
      }
    } catch (err) {
      console.error("Cancel error:", err);
      toast.error("Something went wrong.");
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const currentPlanId = (billing?.currentPlanId || "starter") as PlanId;
  const effectivePlan = billing?.plan;
  const isExpired =
    billing?.planExpiresAt && new Date(billing.planExpiresAt) < new Date();

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Billing & Subscription</h1>
        <p className="text-muted-foreground mt-1">
          Manage your plan and subscription
        </p>
      </div>

      {/* Current Plan Status */}
      <Card className="p-6 mb-8">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
              {planIcons[currentPlanId]}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold">{effectivePlan?.name || "Starter"} Plan</h2>
                {billing?.isTrialing && (
                  <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">
                    Trial
                  </span>
                )}
                {isExpired && (
                  <span className="px-2 py-0.5 bg-destructive/10 text-destructive text-xs font-medium rounded-full">
                    Expired
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {currentPlanId === "starter"
                  ? "Free plan with basic features"
                  : billing?.planExpiresAt
                    ? `${isExpired ? "Expired" : "Renews"} on ${new Date(billing.planExpiresAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`
                    : "Active subscription"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {billing?.hasActiveSubscription && currentPlanId !== "starter" && (
              <Button
                variant="outline"
                size="sm"
                className="text-destructive border-destructive/20 hover:bg-destructive/10"
                onClick={() => setShowCancelConfirm(true)}
              >
                Cancel Subscription
              </Button>
            )}
          </div>
        </div>

        {/* Usage */}
        {billing?.usage && (
          <div className="mt-6 pt-4 border-t grid grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Tables</p>
              <p className="text-lg font-bold">
                {billing.usage.tables}{" "}
                <span className="text-sm font-normal text-muted-foreground">
                  / {effectivePlan?.features.maxTables}
                </span>
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Menu Items</p>
              <p className="text-lg font-bold">
                {billing.usage.menuItems}{" "}
                <span className="text-sm font-normal text-muted-foreground">
                  / {effectivePlan?.features.maxMenuItems}
                </span>
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Staff Members</p>
              <p className="text-lg font-bold">
                {billing.usage.users}{" "}
                <span className="text-sm font-normal text-muted-foreground">
                  / {effectivePlan?.features.maxUsers}
                </span>
              </p>
            </div>
          </div>
        )}
      </Card>

      {/* Pricing Cards */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        {(Object.values(PLANS) as Plan[]).map((plan) => {
          const isCurrent = plan.id === currentPlanId;
          const isDowngrade =
            currentPlanId === "enterprise" && plan.id === "pro";

          return (
            <Card
              key={plan.id}
              className={`p-6 relative ${plan.popular ? "ring-2 ring-primary" : ""}`}
            >
              {plan.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-primary text-white text-xs font-medium rounded-full">
                  Most Popular
                </span>
              )}

              <div className="text-center mb-6">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary mx-auto mb-3">
                  {planIcons[plan.id]}
                </div>
                <h3 className="text-lg font-bold">{plan.name}</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {plan.description}
                </p>
                <div className="mt-4">
                  <span className="text-3xl font-bold">
                    {plan.price === 0 ? "Free" : `₹${plan.price}`}
                  </span>
                  {plan.price > 0 && (
                    <span className="text-muted-foreground text-sm">/month</span>
                  )}
                </div>
              </div>

              {/* Limits */}
              <div className="space-y-2 mb-6">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Tables</span>
                  <span className="font-medium">{plan.features.maxTables}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Menu Items</span>
                  <span className="font-medium">{plan.features.maxMenuItems}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Staff</span>
                  <span className="font-medium">{plan.features.maxUsers}</span>
                </div>
              </div>

              {/* Features */}
              <div className="space-y-2 mb-6 border-t pt-4">
                {booleanFeatures.map((feature) => (
                  <div
                    key={feature}
                    className="flex items-center gap-2 text-sm"
                  >
                    {plan.features[feature] ? (
                      <Check className="h-4 w-4 text-primary flex-shrink-0" />
                    ) : (
                      <X className="h-4 w-4 text-muted-foreground/40 flex-shrink-0" />
                    )}
                    <span
                      className={
                        plan.features[feature]
                          ? "text-foreground"
                          : "text-muted-foreground/60"
                      }
                    >
                      {FEATURE_LABELS[feature]}
                    </span>
                  </div>
                ))}
              </div>

              {/* Action Button */}
              {isCurrent ? (
                <Button className="w-full" disabled>
                  Current Plan
                </Button>
              ) : plan.id === "starter" ? (
                <Button className="w-full" variant="outline" disabled>
                  Free Forever
                </Button>
              ) : isDowngrade ? (
                <Button className="w-full" variant="outline" disabled>
                  Contact Support
                </Button>
              ) : (
                <Button
                  className="w-full"
                  onClick={() => handleSubscribe(plan.id)}
                  disabled={!!subscribing}
                >
                  {subscribing === plan.id ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-4 w-4 mr-2" />
                      {currentPlanId === "starter"
                        ? `Start ${FREE_TRIAL_DAYS}-Day Free Trial`
                        : `Upgrade to ${plan.name}`}
                    </>
                  )}
                </Button>
              )}
            </Card>
          );
        })}
      </div>

      {/* Cancel Confirmation Dialog */}
      {showCancelConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="p-6 max-w-md w-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-destructive/10 rounded-full flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <h3 className="text-lg font-bold">Cancel Subscription?</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              Your plan will remain active until the end of the current billing
              period. After that, you&apos;ll be downgraded to the Starter plan
              with limited features.
            </p>
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowCancelConfirm(false)}
              >
                Keep Subscription
              </Button>
              <Button
                variant="destructive"
                onClick={handleCancelSubscription}
                disabled={cancelling}
              >
                {cancelling ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Cancelling...
                  </>
                ) : (
                  "Yes, Cancel"
                )}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
