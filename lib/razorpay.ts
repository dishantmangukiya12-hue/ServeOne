import Razorpay from 'razorpay';

let razorpayInstance: Razorpay | null = null;

export function getRazorpay(): Razorpay {
  if (!razorpayInstance) {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      throw new Error('Razorpay credentials not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.');
    }

    razorpayInstance = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });
  }
  return razorpayInstance;
}

export function getRazorpayPlanId(plan: 'pro' | 'enterprise'): string {
  const envKey = plan === 'pro' ? 'RAZORPAY_PLAN_ID_PRO' : 'RAZORPAY_PLAN_ID_ENTERPRISE';
  const planId = process.env[envKey];
  if (!planId) {
    throw new Error(`${envKey} not configured`);
  }
  return planId;
}

export function verifyWebhookSignature(body: string, signature: string): boolean {
  const crypto = require('crypto');
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret || !signature) return false;

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex');

  // VULN-06 fix: Use constant-time comparison to prevent timing attacks
  try {
    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature, 'hex'),
      Buffer.from(signature, 'hex')
    );
  } catch {
    return false;
  }
}
