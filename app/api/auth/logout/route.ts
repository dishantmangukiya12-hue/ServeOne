import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

// POST /api/auth/logout
// Explicit logout endpoint for REST-style clients.
// Clears the NextAuth session cookie and signals the client to call signOut().
export async function POST(request: Request) {
  const token = await getToken({ req: request as any, secret: process.env.NEXTAUTH_SECRET });
  if (!token) {
    // Already logged out
    return NextResponse.json({ ok: true });
  }

  // Build the response and clear the session cookie issued by NextAuth
  const response = NextResponse.json({ ok: true });

  const cookieName =
    process.env.NODE_ENV === "production"
      ? "__Secure-next-auth.session-token"
      : "next-auth.session-token";

  response.cookies.set(cookieName, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });

  return response;
}
