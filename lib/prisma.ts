import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

// Create Prisma Client singleton - uses schema.prisma datasource config
export const prisma = globalForPrisma.prisma || new PrismaClient();
export const db = prisma; // Alias pour compatibilité

// CRITICAL: Save singleton in both dev AND production to prevent multiple instances
// Without this, production creates a new PrismaClient on every API request,
// causing connection pool exhaustion and 500 errors on findMany queries with relations
if (!globalForPrisma.prisma) {
  globalForPrisma.prisma = prisma;
}
