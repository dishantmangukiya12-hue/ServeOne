import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getApiSession } from "@/lib/api-auth";
import bcrypt from "bcryptjs";
import { broadcastInvalidation } from "@/lib/sse";
import { verifyCsrfToken } from "@/lib/csrf";

const ALLOWED_ROLES = ["admin", "manager", "waiter", "cashier", "kitchen", "staff"];

// PUT /api/users/[id] - Update user
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!await verifyCsrfToken(request))
    return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });

  const session = await getApiSession(request);
  const { id } = await params;
  const body = await request.json();

  const user = await prisma.user.findUnique({
    where: { id },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Verify authorization
  if (!session?.user?.restaurantId || session.user.restaurantId !== user.restaurantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name, email, mobile, passcode, role, status } = body;
  const updateData: any = {};

  if (name !== undefined) updateData.name = name;
  if (email !== undefined) updateData.email = email;
  if (mobile !== undefined) updateData.mobile = mobile;

  // VULN-04 fix: Hash passcode before storing
  if (passcode !== undefined) {
    if (typeof passcode !== "string" || passcode.length < 4) {
      return NextResponse.json({ error: "Passcode must be at least 4 characters" }, { status: 400 });
    }
    updateData.passcode = await bcrypt.hash(passcode, 12);
  }

  // VULN-03 fix: Validate role and restrict role changes to admins
  if (role !== undefined) {
    if (!ALLOWED_ROLES.includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }
    if (session.user.role !== "admin") {
      return NextResponse.json({ error: "Only admins can change user roles" }, { status: 403 });
    }
    if (role === "admin" && session.user.role !== "admin") {
      return NextResponse.json({ error: "Only admins can assign admin role" }, { status: 403 });
    }
  }

  if (status !== undefined) {
    // SEC: Validate status against allowlist
    const ALLOWED_STATUSES = ['active', 'inactive'];
    if (!ALLOWED_STATUSES.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    updateData.status = status;
  }

  const updated = await prisma.user.update({
    where: { id },
    data: updateData,
  });

  broadcastInvalidation(user.restaurantId, "users");

  // SEC: Strip passcode from response
  const { passcode: _pwd, ...safeUser } = updated;
  return NextResponse.json({ user: safeUser });
}

// DELETE /api/users/[id] - Delete user
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getApiSession(request);
  const { id } = await params;

  // VULN-09 fix: Only admin and manager can delete users
  if (!session?.user?.role || !["admin", "manager"].includes(session.user.role)) {
    return NextResponse.json({ error: "Only admins and managers can delete users" }, { status: 403 });
  }

  const user = await prisma.user.findUnique({
    where: { id },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Verify authorization
  if (!session?.user?.restaurantId || session.user.restaurantId !== user.restaurantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await prisma.user.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  broadcastInvalidation(user.restaurantId, "users");

  return NextResponse.json({ ok: true });
}
