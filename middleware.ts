/**
 * Next.js Middleware — Thin Auth Proxy
 *
 * Runs in Edge Runtime. Cookie-presence check only — no DB access.
 * Deep auth validation (roles, org, tenant) happens server-side
 * in API guards (lib/auth/api-guard.ts) and layout guards.
 *
 * Responsibilities:
 * 1. Session cookie check → redirect unauthenticated users
 * 2. Rate limiting for /api/v1/* by IP
 * 3. i18n locale redirect for bare paths
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

// ── Rate limiting (in-memory, 100 req/min by IP) ────────────────────────────

const rateLimitStore = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 100;
const RATE_LIMIT_WINDOW = 60 * 1000;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitStore.get(ip);

  if (!entry || now > entry.resetTime) {
    rateLimitStore.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (entry.count >= RATE_LIMIT) {
    return false;
  }

  entry.count++;
  return true;
}

// Periodic cleanup (1% chance per request)
function maybeCleanupRateLimits(): void {
  if (Math.random() >= 0.01) return;
  const now = Date.now();
  for (const [key, value] of rateLimitStore.entries()) {
    if (now > value.resetTime + RATE_LIMIT_WINDOW) {
      rateLimitStore.delete(key);
    }
  }
}

// ── Locales ─────────────────────────────────────────────────────────────────

const LOCALES = ["en", "fr"];

function hasLocalePrefix(pathname: string): boolean {
  return LOCALES.some(
    (l) => pathname.startsWith(`/${l}/`) || pathname === `/${l}`
  );
}

// ── Middleware ───────────────────────────────────────────────────────────────

export default function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  // ─── 1. Public API routes — pass through ───────────────────────────────
  if (pathname.startsWith("/api/auth")) return NextResponse.next();
  if (pathname.startsWith("/api/webhooks")) return NextResponse.next();

  // Public non-v1 API routes (demo-leads, waitlist, etc.)
  if (pathname.startsWith("/api") && !pathname.startsWith("/api/v1")) {
    return NextResponse.next();
  }

  // ─── 2. Protected API routes — cookie check + rate limit ───────────────
  if (pathname.startsWith("/api/v1")) {
    const token = getSessionCookie(req);
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    maybeCleanupRateLimits();
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Try again later." },
        { status: 429 }
      );
    }

    return NextResponse.next();
  }

  // ─── 3. Protected page routes — cookie check → redirect login ──────────
  const isProtectedPage =
    pathname.startsWith("/adm") ||
    /^\/(en|fr)\/(dashboard|crm|settings)/.test(pathname);

  if (isProtectedPage) {
    const token = getSessionCookie(req);
    if (!token) {
      const locale = pathname.match(/^\/(en|fr)/)?.[1] ?? "en";
      const loginUrl = new URL(`/${locale}/login`, req.url);
      loginUrl.searchParams.set("redirect_url", pathname);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  // ─── 4. i18n — redirect bare paths to /en/... ─────────────────────────
  if (!pathname.startsWith("/api") && !hasLocalePrefix(pathname)) {
    return NextResponse.redirect(new URL(`/en${pathname}`, req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all paths except Next.js internals, Vercel internals, and static files
    "/((?!_next|_vercel|.*\\..*).*)",
  ],
};
