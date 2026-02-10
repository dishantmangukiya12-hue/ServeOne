import { prisma } from '@/lib/prisma';
import { getEffectivePlan, type PlanId, type FeatureKey } from '@/lib/plans';

interface PlanCheckResult {
  allowed: boolean;
  plan: ReturnType<typeof getEffectivePlan>;
  error?: string;
}

export async function checkPlanFeature(
  restaurantId: string,
  feature: FeatureKey
): Promise<PlanCheckResult> {
  const restaurant = await prisma.restaurant.findUnique({
    where: { id: restaurantId },
    select: { plan: true, planExpiresAt: true },
  });

  if (!restaurant) {
    return { allowed: false, plan: getEffectivePlan('starter', null), error: 'Restaurant not found' };
  }

  const plan = getEffectivePlan(restaurant.plan, restaurant.planExpiresAt?.toISOString());

  const featureValue = plan.features[feature];
  if (typeof featureValue === 'boolean') {
    return { allowed: featureValue, plan, error: featureValue ? undefined : `${feature} is not available on the ${plan.name} plan` };
  }

  return { allowed: true, plan };
}

export async function checkPlanLimit(
  restaurantId: string,
  resource: 'maxTables' | 'maxMenuItems' | 'maxUsers'
): Promise<PlanCheckResult & { current: number; limit: number }> {
  const restaurant = await prisma.restaurant.findUnique({
    where: { id: restaurantId },
    select: {
      plan: true,
      planExpiresAt: true,
      _count: {
        select: {
          tables: true,
          menuItems: true,
          users: true,
        },
      },
    },
  });

  if (!restaurant) {
    const plan = getEffectivePlan('starter', null);
    return { allowed: false, plan, current: 0, limit: 0, error: 'Restaurant not found' };
  }

  const plan = getEffectivePlan(restaurant.plan, restaurant.planExpiresAt?.toISOString());
  const limit = plan.features[resource];

  const countMap = {
    maxTables: restaurant._count.tables,
    maxMenuItems: restaurant._count.menuItems,
    maxUsers: restaurant._count.users,
  };

  const current = countMap[resource];
  const allowed = current < limit;

  return {
    allowed,
    plan,
    current,
    limit,
    error: allowed ? undefined : `You've reached the limit of ${limit} ${resource.replace('max', '').toLowerCase()} on the ${plan.name} plan`,
  };
}
