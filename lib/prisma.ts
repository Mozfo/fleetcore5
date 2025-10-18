import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient({
  datasources: {
    db: {
      url: process.env.DIRECT_URL || process.env.DATABASE_URL,
    },
  },
});
export const db = prisma; // Alias pour compatibilité

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
