import CredentialsProvider from "next-auth/providers/credentials";
import type { NextAuthOptions } from "next-auth";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

const credentialsSchema = z.object({
  mobile: z.string().min(1, "Mobile is required"),
  passcode: z.string().min(1, "Passcode is required"),
});

// Compare passcode: only supports bcrypt hashed passwords
async function verifyPasscode(input: string, stored: string): Promise<boolean> {
  if (!input || !stored) return false;
  // Only accept bcrypt hashes - plaintext fallback removed (VULN-01 fix)
  if (stored.startsWith("$2a$") || stored.startsWith("$2b$")) {
    return bcrypt.compare(input, stored);
  }
  // Legacy plain-text passwords are no longer accepted.
  // Run a migration to hash all existing plaintext passcodes.
  return false;
}

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        mobile: { label: "Mobile", type: "text" },
        passcode: { label: "Passcode", type: "password" },
      },
      async authorize(credentials) {
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { mobile, passcode } = parsed.data;

        // Check restaurant login
        const restaurant = await prisma.restaurant.findFirst({
          where: { mobile },
        });

        if (restaurant && await verifyPasscode(passcode, restaurant.passcode)) {
          return {
            id: restaurant.id,
            name: restaurant.name,
            role: "admin",
            restaurantId: restaurant.id,
            userId: null,
            type: "restaurant",
          };
        }

        // Check staff user login
        const users = await prisma.user.findMany({
          where: { mobile, status: "active" },
        });

        for (const user of users) {
          if (await verifyPasscode(passcode, user.passcode)) {
            return {
              id: user.id,
              name: user.name,
              role: user.role,
              restaurantId: user.restaurantId,
              userId: user.id,
              type: "staff",
            };
          }
        }

        // Fallback: Check RestaurantStore JSON for staff users created locally
        // VULN-11 fix: Limit the number of stores loaded to prevent full-table scan DoS
        const stores = await prisma.restaurantStore.findMany({
          select: { restaurantId: true, data: true },
          take: 10,
        });

        for (const store of stores) {
          const data = store.data as { users?: Array<{ id: string; name: string; mobile: string; passcode: string; role: string; status: string }> } | null;
          if (!data?.users) continue;

          for (const u of data.users) {
            if (u.mobile === mobile && u.status === "active" && await verifyPasscode(passcode, u.passcode)) {
              return {
                id: u.id,
                name: u.name,
                role: u.role,
                restaurantId: store.restaurantId,
                userId: u.id,
                type: "staff",
              };
            }
          }
        }

        return null;
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.role = (user as { role?: string }).role;
        token.restaurantId = (user as { restaurantId?: string }).restaurantId;
        token.userId = (user as { userId?: string | null }).userId ?? undefined;
        token.type = (user as { type?: string }).type;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "";
        session.user.role = token.role as string | undefined;
        session.user.restaurantId = token.restaurantId as string | undefined;
        session.user.userId = token.userId as string | undefined;
        session.user.type = token.type as string | undefined;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
};
