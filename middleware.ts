import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const publicRoutes = ["/login", "/register", "/landing", "/pricing", "/terms", "/privacy", "/refund"];

// Simple in-memory rate limiter for Edge middleware
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(ip: string, maxRequests: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (entry.count >= maxRequests) {
    return false;
  }

  entry.count++;
  return true;
}

function getClientIp(req: NextRequest): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Rate limit auth endpoints: 10 attempts per minute per IP
  if (pathname.startsWith("/api/auth/callback/credentials")) {
    const ip = getClientIp(req);
    if (!checkRateLimit(`auth:${ip}`, 10, 60000)) {
      return NextResponse.json(
        { error: "Too many login attempts. Please try again later." },
        { status: 429 }
      );
    }
  }

  // Rate limit registration: 3 per hour per IP
  if (pathname === "/api/restaurants" && req.method === "POST") {
    const ip = getClientIp(req);
    if (!checkRateLimit(`register:${ip}`, 3, 3600000)) {
      return NextResponse.json(
        { error: "Too many registration attempts. Please try again later." },
        { status: 429 }
      );
    }
    return NextResponse.next();
  }

  // Rate limit passcode changes: 5 per hour per IP
  if (
    pathname.startsWith("/api/restaurants/") &&
    pathname.endsWith("/passcode") &&
    req.method === "PATCH"
  ) {
    const ip = getClientIp(req);
    if (!checkRateLimit(`passcode:${ip}`, 5, 3600000)) {
      return NextResponse.json(
        { error: "Too many passcode change attempts. Please try again later." },
        { status: 429 }
      );
    }
    return NextResponse.next();
  }

  // VULN-07 fix: Rate limit QR orders: 10 per minute per IP
  if (pathname === "/api/qr-orders" && req.method === "POST") {
    const ip = getClientIp(req);
    if (!checkRateLimit(`qr-order:${ip}`, 10, 60000)) {
      return NextResponse.json(
        { error: "Too many orders. Please try again later." },
        { status: 429 }
      );
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/restaurant-store") && req.method === "GET") {
    return NextResponse.next();
  }

  if (
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/order") ||
    pathname.startsWith("/public") ||
    pathname.startsWith("/images")
  ) {
    return NextResponse.next();
  }

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route));

  if (!token && !isPublicRoute) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (token && isPublicRoute) {
    return NextResponse.redirect(new URL("/home", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
