import { getToken } from "next-auth/jwt";

/**
 * Fast API route auth using JWT token verification.
 * ~5-10x faster than getServerSession(authOptions) which reconstructs
 * the full session via NextAuth callback chain on every request.
 *
 * Returns the same { user } shape as getServerSession for drop-in compatibility.
 */
export async function getApiSession(request: Request) {
  const token = await getToken({
    req: request as any,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token) {
    return { user: undefined as undefined };
  }

  return {
    user: {
      id: (token.sub as string) ?? "",
      name: token.name as string | undefined,
      role: token.role as string | undefined,
      restaurantId: token.restaurantId as string | undefined,
      userId: token.userId as string | undefined,
      type: token.type as string | undefined,
    },
  };
}
