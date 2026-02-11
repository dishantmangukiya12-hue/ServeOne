import { NextResponse } from 'next/server';
import { getApiSession } from "@/lib/api-auth";
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

// POST /api/billing/verify — Verify Razorpay payment after checkout
export async function POST(request: Request) {
  try {
    const session = await getApiSession(request);
    if (!session?.user?.restaurantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      razorpay_payment_id,
      razorpay_subscription_id,
      razorpay_signature,
      planId,
    } = body;

    if (!razorpay_payment_id || !razorpay_subscription_id || !razorpay_signature || !planId) {
      return NextResponse.json({ error: 'Missing payment verification fields' }, { status: 400 });
    }

    // Verify signature
    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) {
      return NextResponse.json({ error: 'Payment configuration error' }, { status: 500 });
    }

    const generatedSignature = crypto
      .createHmac('sha256', secret)
      .update(`${razorpay_payment_id}|${razorpay_subscription_id}`)
      .digest('hex');

    // VULN-06 fix: Use constant-time comparison to prevent timing attacks
    let signatureValid = false;
    try {
      signatureValid = crypto.timingSafeEqual(
        Buffer.from(generatedSignature, 'hex'),
        Buffer.from(razorpay_signature, 'hex')
      );
    } catch {
      signatureValid = false;
    }

    if (!signatureValid) {
      return NextResponse.json({ error: 'Payment verification failed' }, { status: 400 });
    }

    // VULN-20 fix: Validate planId against allowed plans instead of trusting client
    const allowedPlans = ['starter', 'pro', 'enterprise'];
    if (!allowedPlans.includes(planId)) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }

    // Payment verified — update restaurant plan
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now

    await prisma.restaurant.update({
      where: { id: session.user.restaurantId },
      data: {
        plan: planId,
        planExpiresAt: expiresAt,
        razorpaySubscriptionId: razorpay_subscription_id,
      },
    });

    return NextResponse.json({ ok: true, plan: planId, expiresAt: expiresAt.toISOString() });
  } catch (error) {
    console.error('Payment verification error:', error);
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
  }
}
