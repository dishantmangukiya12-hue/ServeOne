import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyWebhookSignature } from '@/lib/razorpay';

// POST /api/billing/webhook — Handle Razorpay webhook events
export async function POST(request: Request) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-razorpay-signature') || '';

    // Verify webhook signature
    if (!verifyWebhookSignature(body, signature)) {
      console.error('Webhook signature verification failed');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    const event = JSON.parse(body);
    const eventType = event.event as string;

    switch (eventType) {
      case 'subscription.activated':
      case 'subscription.charged': {
        const subscription = event.payload?.subscription?.entity;
        if (!subscription) break;

        const restaurantId = subscription.notes?.restaurantId;
        const planId = subscription.notes?.planId;
        if (!restaurantId || !planId) break;

        // Calculate expiry: current period end or 30 days from now
        const currentEnd = subscription.current_end
          ? new Date(subscription.current_end * 1000)
          : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

        await prisma.restaurant.update({
          where: { id: restaurantId },
          data: {
            plan: planId,
            planExpiresAt: currentEnd,
            razorpaySubscriptionId: subscription.id,
          },
        });

        console.log(`Subscription activated/charged for ${restaurantId}: plan=${planId}`);
        break;
      }

      case 'subscription.completed':
      case 'subscription.cancelled': {
        const subscription = event.payload?.subscription?.entity;
        if (!subscription) break;

        const restaurantId = subscription.notes?.restaurantId;
        if (!restaurantId) break;

        // Keep current plan until expiry, then downgrade
        const currentEnd = subscription.current_end
          ? new Date(subscription.current_end * 1000)
          : new Date();

        await prisma.restaurant.update({
          where: { id: restaurantId },
          data: {
            planExpiresAt: currentEnd,
            razorpaySubscriptionId: null,
          },
        });

        console.log(`Subscription ended for ${restaurantId}`);
        break;
      }

      case 'subscription.halted':
      case 'subscription.pending': {
        const subscription = event.payload?.subscription?.entity;
        if (!subscription) break;

        const restaurantId = subscription.notes?.restaurantId;
        if (!restaurantId) break;

        // Payment failed — give 7 day grace period
        const gracePeriod = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

        await prisma.restaurant.update({
          where: { id: restaurantId },
          data: { planExpiresAt: gracePeriod },
        });

        console.log(`Payment issue for ${restaurantId}, grace period until ${gracePeriod.toISOString()}`);
        break;
      }

      default:
        console.log(`Unhandled webhook event: ${eventType}`);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
