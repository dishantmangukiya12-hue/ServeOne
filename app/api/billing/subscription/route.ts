import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getRazorpay, getRazorpayPlanId } from '@/lib/razorpay';
import type { PlanId } from '@/lib/plans';
import { verifyCsrfToken } from '@/lib/csrf';

// POST /api/billing/subscription — Create a Razorpay subscription
export async function POST(request: Request) {
  if (!await verifyCsrfToken(request)) {
    return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
  }

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.restaurantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const planId = body.planId as PlanId;

    if (!planId || (planId !== 'pro' && planId !== 'enterprise')) {
      return NextResponse.json({ error: 'Invalid plan. Must be "pro" or "enterprise".' }, { status: 400 });
    }

    const restaurant = await prisma.restaurant.findUnique({
      where: { id: session.user.restaurantId },
    });

    if (!restaurant) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 });
    }

    const razorpay = getRazorpay();
    const razorpayPlanId = getRazorpayPlanId(planId);

    // Create or reuse Razorpay customer
    let customerId = restaurant.razorpayCustomerId;
    if (!customerId) {
      const customer = await razorpay.customers.create({
        name: restaurant.name,
        contact: restaurant.mobile,
        notes: { restaurantId: restaurant.id },
      });
      customerId = customer.id;
      await prisma.restaurant.update({
        where: { id: restaurant.id },
        data: { razorpayCustomerId: customerId },
      });
    }

    // Create subscription
    const subscription = await razorpay.subscriptions.create({
      plan_id: razorpayPlanId,
      total_count: 12, // 12 months
      notes: {
        restaurantId: restaurant.id,
        planId,
      },
    } as any);

    return NextResponse.json({
      subscriptionId: subscription.id,
      razorpayKeyId: process.env.RAZORPAY_KEY_ID,
      amount: subscription.notes?.amount,
    });
  } catch (error) {
    console.error('Billing subscription error:', error);
    return NextResponse.json({ error: 'Failed to create subscription' }, { status: 500 });
  }
}

// DELETE /api/billing/subscription — Cancel subscription
export async function DELETE(request: Request) {
  if (!await verifyCsrfToken(request)) {
    return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
  }

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.restaurantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const restaurant = await prisma.restaurant.findUnique({
      where: { id: session.user.restaurantId },
    });

    if (!restaurant?.razorpaySubscriptionId) {
      return NextResponse.json({ error: 'No active subscription' }, { status: 400 });
    }

    const razorpay = getRazorpay();
    await razorpay.subscriptions.cancel(restaurant.razorpaySubscriptionId);

    // Don't downgrade immediately — let them use until current period ends
    return NextResponse.json({ ok: true, message: 'Subscription cancelled. Access continues until current billing period ends.' });
  } catch (error) {
    console.error('Cancel subscription error:', error);
    return NextResponse.json({ error: 'Failed to cancel subscription' }, { status: 500 });
  }
}
