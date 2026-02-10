export type PlanId = 'starter' | 'pro' | 'enterprise';

export interface PlanFeatures {
  maxTables: number;
  maxMenuItems: number;
  maxUsers: number;
  qrOrdering: boolean;
  kds: boolean;
  reports: boolean;
  inventory: boolean;
  loyalty: boolean;
  reservations: boolean;
  expenses: boolean;
  customReceipts: boolean;
  multiLocation: boolean;
  apiAccess: boolean;
  prioritySupport: boolean;
}

export interface Plan {
  id: PlanId;
  name: string;
  price: number; // INR per month
  description: string;
  features: PlanFeatures;
  razorpayPlanId?: string; // Set via env vars
  popular?: boolean;
}

export const PLANS: Record<PlanId, Plan> = {
  starter: {
    id: 'starter',
    name: 'Starter',
    price: 0,
    description: 'Perfect for small restaurants getting started',
    features: {
      maxTables: 5,
      maxMenuItems: 50,
      maxUsers: 2,
      qrOrdering: false,
      kds: false,
      reports: true,
      inventory: false,
      loyalty: false,
      reservations: false,
      expenses: true,
      customReceipts: false,
      multiLocation: false,
      apiAccess: false,
      prioritySupport: false,
    },
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    price: 999,
    description: 'Everything you need to run your restaurant',
    popular: true,
    features: {
      maxTables: 100,
      maxMenuItems: 500,
      maxUsers: 20,
      qrOrdering: true,
      kds: true,
      reports: true,
      inventory: true,
      loyalty: true,
      reservations: true,
      expenses: true,
      customReceipts: true,
      multiLocation: false,
      apiAccess: false,
      prioritySupport: false,
    },
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    price: 2499,
    description: 'For restaurant chains and large operations',
    features: {
      maxTables: 999,
      maxMenuItems: 9999,
      maxUsers: 100,
      qrOrdering: true,
      kds: true,
      reports: true,
      inventory: true,
      loyalty: true,
      reservations: true,
      expenses: true,
      customReceipts: true,
      multiLocation: true,
      apiAccess: true,
      prioritySupport: true,
    },
  },
};

export const FREE_TRIAL_DAYS = 14;

export function getPlan(planId: PlanId | string | undefined): Plan {
  return PLANS[(planId as PlanId) || 'starter'] || PLANS.starter;
}

export function isPlanExpired(planExpiresAt: string | null | undefined): boolean {
  if (!planExpiresAt) return false; // Starter never expires
  return new Date(planExpiresAt) < new Date();
}

export function getEffectivePlan(planId: PlanId | string | undefined, planExpiresAt: string | null | undefined): Plan {
  if (planId && planId !== 'starter' && isPlanExpired(planExpiresAt)) {
    return PLANS.starter; // Downgrade to starter if expired
  }
  return getPlan(planId);
}

export type FeatureKey = keyof PlanFeatures;

export function canUseFeature(plan: Plan, feature: FeatureKey): boolean {
  return !!plan.features[feature];
}

export function isWithinLimit(plan: Plan, feature: 'maxTables' | 'maxMenuItems' | 'maxUsers', currentCount: number): boolean {
  return currentCount < plan.features[feature];
}

// Human-readable feature names for upgrade prompts
export const FEATURE_LABELS: Record<FeatureKey, string> = {
  maxTables: 'Tables',
  maxMenuItems: 'Menu Items',
  maxUsers: 'Staff Members',
  qrOrdering: 'QR Ordering',
  kds: 'Kitchen Display',
  reports: 'Reports',
  inventory: 'Inventory Management',
  loyalty: 'Loyalty Program',
  reservations: 'Reservations',
  expenses: 'Expense Tracking',
  customReceipts: 'Custom Receipts',
  multiLocation: 'Multi-Location',
  apiAccess: 'API Access',
  prioritySupport: 'Priority Support',
};
