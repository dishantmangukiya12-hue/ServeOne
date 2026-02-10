"use client";

import { Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Link from "next/link";

interface UpgradePromptProps {
  feature: string;
  currentPlan?: string;
  message?: string;
}

export function UpgradePrompt({ feature, currentPlan, message }: UpgradePromptProps) {
  return (
    <Card className="p-6 border-primary/20 bg-primary/5">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
          <Crown className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-foreground">
            Upgrade to unlock {feature}
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            {message || `${feature} is not available on the ${currentPlan || "Starter"} plan. Upgrade to Pro or Enterprise to access this feature.`}
          </p>
          <Link href="/billing">
            <Button size="sm" className="mt-3">
              <Crown className="h-4 w-4 mr-2" />
              View Plans
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  );
}

export function UpgradeBanner({ feature, currentPlan }: { feature: string; currentPlan?: string }) {
  return (
    <div className="bg-primary/5 border border-primary/20 rounded-lg px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Crown className="h-4 w-4 text-primary" />
        <span className="text-sm text-foreground">
          <strong>{feature}</strong> requires the Pro plan.
        </span>
      </div>
      <Link href="/billing">
        <Button size="sm" variant="outline" className="h-7 text-xs">
          Upgrade
        </Button>
      </Link>
    </div>
  );
}

export function LimitReachedBanner({ resource, limit }: { resource: string; limit: number }) {
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Crown className="h-4 w-4 text-amber-600" />
        <span className="text-sm text-foreground">
          You&apos;ve reached the limit of <strong>{limit} {resource}</strong> on your current plan.
        </span>
      </div>
      <Link href="/billing">
        <Button size="sm" variant="outline" className="h-7 text-xs">
          Upgrade
        </Button>
      </Link>
    </div>
  );
}
