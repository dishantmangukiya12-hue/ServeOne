import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { otpStore } from "@/app/api/auth/forgot-password/route";

// POST /api/auth/reset-password
export async function POST(request: Request) {
  const body = await request.json();
  const { mobile, otp, newPasscode } = body;

  if (!mobile || !otp || !newPasscode) {
    return NextResponse.json({ error: "All fields are required" }, { status: 400 });
  }

  if (typeof newPasscode !== 'string' || newPasscode.length < 4 || newPasscode.length > 128) {
    return NextResponse.json({ error: "Passcode must be 4-128 characters" }, { status: 400 });
  }

  const stored = otpStore.get(mobile);
  if (!stored) {
    return NextResponse.json({ error: "No OTP found. Please request a new one." }, { status: 400 });
  }

  if (Date.now() > stored.expiry) {
    otpStore.delete(mobile);
    return NextResponse.json({ error: "OTP has expired" }, { status: 400 });
  }

  // SEC: Brute-force protection — max 5 OTP attempts
  if (stored.attempts >= 5) {
    otpStore.delete(mobile);
    return NextResponse.json({ error: "Too many failed attempts. Please request a new OTP." }, { status: 429 });
  }

  if (stored.otp !== otp) {
    stored.attempts++;
    return NextResponse.json({ error: "Invalid OTP" }, { status: 400 });
  }

  try {
    // Hash the new passcode
    const hashedPasscode = await bcrypt.hash(newPasscode, 10);

    // Update restaurant passcode
    await prisma.restaurant.update({
      where: { id: stored.restaurantId },
      data: { passcode: hashedPasscode },
    });

    // Also update the admin user's passcode if they exist
    await prisma.user.updateMany({
      where: {
        restaurantId: stored.restaurantId,
        mobile,
        role: "admin",
      },
      data: { passcode: hashedPasscode },
    });

    // Clear OTP
    otpStore.delete(mobile);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to reset passcode" }, { status: 500 });
  }
}
