import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient();
export const db = prisma; // Alias pour compatibilité

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
