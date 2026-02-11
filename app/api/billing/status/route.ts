import { NextResponse } from 'next/server';
import { getApiSession } from "@/lib/api-auth";
import { prisma } from '@/lib/prisma';
import { getEffectivePlan } from '@/lib/plans';

// GET /api/billing/status — Get current billing status
export async function GET(request: Request) {
  try {
    const session = await getApiSession(request);
    if (!session?.user?.restaurantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const restaurant = await prisma.restaurant.findUnique({
      where: { id: session.user.restaurantId },
      select: {
        plan: true,
        planExpiresAt: true,
        trialEndsAt: true,
        razorpaySubscriptionId: true,
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
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 });
    }

    const effectivePlan = getEffectivePlan(
      restaurant.plan,
      restaurant.planExpiresAt?.toISOString()
    );

    const isTrialing = restaurant.trialEndsAt && new Date(restaurant.trialEndsAt) > new Date();

    return NextResponse.json({
      plan: effectivePlan,
      currentPlanId: restaurant.plan,
      planExpiresAt: restaurant.planExpiresAt?.toISOString() || null,
      trialEndsAt: restaurant.trialEndsAt?.toISOString() || null,
      isTrialing,
      hasActiveSubscription: !!restaurant.razorpaySubscriptionId,
      usage: {
        tables: restaurant._count.tables,
        menuItems: restaurant._count.menuItems,
        users: restaurant._count.users,
      },
    });
  } catch (error) {
    console.error('Billing status error:', error);
    return NextResponse.json({ error: 'Failed to get billing status' }, { status: 500 });
  }
}
