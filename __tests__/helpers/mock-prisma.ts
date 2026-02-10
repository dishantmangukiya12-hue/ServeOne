import { vi } from "vitest";
import { prisma } from "@/lib/prisma";

// Re-export the mocked prisma for use in tests
export const mockPrisma = prisma as unknown as {
  [K in keyof typeof prisma]: {
    [M in keyof (typeof prisma)[K]]: ReturnType<typeof vi.fn>;
  };
};

/**
 * Reset all Prisma mocks between tests
 */
export function resetPrismaMocks() {
  const models = Object.keys(mockPrisma) as (keyof typeof mockPrisma)[];
  for (const model of models) {
    if (typeof mockPrisma[model] === "object" && mockPrisma[model] !== null) {
      const methods = Object.keys(mockPrisma[model]) as (keyof (typeof mockPrisma)[typeof model])[];
      for (const method of methods) {
        const fn = mockPrisma[model][method];
        if (typeof fn === "function" && "mockReset" in fn) {
          (fn as ReturnType<typeof vi.fn>).mockReset();
        }
      }
    }
  }
}
