import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

// Optimized for Vercel serverless: limit connections and log slow queries
export const prisma =
  global.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "warn", "error"]
        : ["warn", "error"],
  });

// Cache globally in both dev (hot reload) and production (Vercel function reuse)
if (!global.prisma) {
  global.prisma = prisma;
}
