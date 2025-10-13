// Clerk authentication helpers for middleware
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import type { NextRequest } from "next/server";

// Simple in-memory cache for tenant lookups (TTL: 5 minutes)
const tenantCache = new Map<string, { tenantId: string; expiresAt: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Get current authenticated user from Clerk
 */
export async function getCurrentUser(_request: NextRequest) {
  try {
    const { userId, sessionId } = await auth();

    if (!userId || !sessionId) {
      return null;
    }

    return {
      userId,
      sessionId,
    };
  } catch (_error) {
    // Log error silently
    return null;
  }
}

/**
 * Get tenant ID for a given Clerk user ID
 * Uses in-memory cache to reduce database queries
 */
export async function getTenantId(clerkUserId: string): Promise<string | null> {
  try {
    // Check cache first
    const cached = tenantCache.get(clerkUserId);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.tenantId;
    }

    // Query database for member
    const member = await prisma.adm_members.findFirst({
      where: {
        clerk_user_id: clerkUserId,
        deleted_at: null,
        status: "active",
      },
      select: {
        tenant_id: true,
      },
    });

    if (!member) {
      // No active member found for this Clerk user
      return null;
    }

    // Cache the result
    tenantCache.set(clerkUserId, {
      tenantId: member.tenant_id,
      expiresAt: Date.now() + CACHE_TTL,
    });

    // Clean up expired cache entries periodically
    cleanExpiredCache();

    return member.tenant_id;
  } catch (_error) {
    // Error getting tenant ID
    return null;
  }
}

/**
 * Validate that a user has access to a specific tenant
 */
export async function validateTenantAccess(
  clerkUserId: string,
  tenantId: string
): Promise<boolean> {
  try {
    // Check if user is a member of the specified tenant
    const member = await prisma.adm_members.findFirst({
      where: {
        clerk_user_id: clerkUserId,
        tenant_id: tenantId,
        deleted_at: null,
        status: "active",
      },
      select: {
        id: true,
      },
    });

    return !!member;
  } catch (_error) {
    // Error validating tenant access
    return false;
  }
}

/**
 * Get member details for a Clerk user
 */
export async function getMemberByClerkId(clerkUserId: string) {
  try {
    const member = await prisma.adm_members.findFirst({
      where: {
        clerk_user_id: clerkUserId,
        deleted_at: null,
        status: "active",
      },
      select: {
        id: true,
        tenant_id: true,
        email: true,
        first_name: true,
        last_name: true,
        phone: true,
        role: true,
        metadata: true,
      },
    });

    return member;
  } catch (_error) {
    // Error getting member
    return null;
  }
}

/**
 * Invalidate cache for a specific user
 */
export function invalidateTenantCache(clerkUserId: string) {
  tenantCache.delete(clerkUserId);
}

/**
 * Clear entire tenant cache
 */
export function clearTenantCache() {
  tenantCache.clear();
}

/**
 * Clean up expired cache entries
 */
function cleanExpiredCache() {
  const now = Date.now();

  for (const [key, value] of tenantCache.entries()) {
    if (value.expiresAt <= now) {
      tenantCache.delete(key);
    }
  }

  // Clean expired cache entries (no return value needed)
}

/**
 * Get cache statistics (for debugging)
 */
export function getCacheStats() {
  const now = Date.now();
  let active = 0;
  let expired = 0;

  for (const value of tenantCache.values()) {
    if (value.expiresAt > now) {
      active++;
    } else {
      expired++;
    }
  }

  return {
    total: tenantCache.size,
    active,
    expired,
  };
}
