import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    datasources: {
      db: {
        url: process.env.DIRECT_URL || process.env.DATABASE_URL,
      },
    },
  });
export const db = prisma; // Alias pour compatibilité

// CRITICAL: Save singleton in both dev AND production to prevent multiple instances
// Without this, production creates a new PrismaClient on every API request,
// causing connection pool exhaustion and 500 errors on findMany queries with relations
if (!globalForPrisma.prisma) {
  globalForPrisma.prisma = prisma;
}
