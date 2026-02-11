import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// In-memory OTP store (in production, use Redis or database)
const otpStore = new Map<string, { otp: string; expiry: number; restaurantId: string; attempts: number }>();

// Export for use by reset-password route
export { otpStore };

// POST /api/auth/forgot-password
export async function POST(request: Request) {
  const body = await request.json();
  const { mobile } = body;

  if (!mobile || typeof mobile !== 'string') {
    return NextResponse.json({ error: "Mobile number is required" }, { status: 400 });
  }

  try {
    // Find restaurant by mobile
    const restaurant = await prisma.restaurant.findFirst({
      where: { mobile },
    });

    if (!restaurant) {
      return NextResponse.json({ error: "Mobile number not found" }, { status: 404 });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Store with 5-minute expiry
    otpStore.set(mobile, {
      otp,
      expiry: Date.now() + 5 * 60 * 1000,
      restaurantId: restaurant.id,
      attempts: 0,
    });

    // In development, return OTP directly. In production, send via SMS.
    const isDev = process.env.NODE_ENV === 'development';
    return NextResponse.json({
      success: true,
      // SEC: Only expose OTP in development mode
      ...(isDev && { otp }),
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 });
  }
}
