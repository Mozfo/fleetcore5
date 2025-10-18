import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getLocaleFromPathname } from "@/lib/navigation";
import { jwtDecode } from "jwt-decode";

// Admin organization ID (FleetCore backoffice)
const ADMIN_ORG_ID = process.env.FLEETCORE_ADMIN_ORG_ID;

// Allowed admin roles
const ADMIN_ROLES = ["org:adm_admin", "org:adm_commercial", "org:adm_support"];

// Update protected routes to include locale prefix
const isProtectedRoute = createRouteMatcher([
  "/:locale/dashboard(.*)",
  "/dashboard(.*)",
  // Note: /adm routes are NOT in this list - they're protected in app/adm/layout.tsx
  "/api/v1(.*)",
]);

// Rate limiting store (in-memory)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 100; // 100 requests per minute
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute in milliseconds

// Locale handling with react-i18next
export default clerkMiddleware(async (auth, req: NextRequest) => {
  // Basic locale handling for non-API routes
  const pathname = req.nextUrl.pathname;

  // Handle API routes with authentication and rate limiting
  if (pathname.startsWith("/api")) {
    // Allow webhooks without authentication
    if (pathname.startsWith("/api/webhooks")) {
      return NextResponse.next();
    }

    // Protected API routes (v1)
    if (pathname.startsWith("/api/v1")) {
      const authData = await auth();
      const { userId, sessionClaims } = authData;
      let { orgId } = authData;

      // Require authentication for v1 API
      if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      // Fallback: Read orgId from JWT custom claims if not in auth context
      // This pattern supports automated testing with Backend API sessions
      // while maintaining compatibility with production user sessions
      if (!orgId) {
        const authHeader = req.headers.get("authorization");
        if (authHeader?.startsWith("Bearer ")) {
          try {
            const token = authHeader.replace("Bearer ", "");
            // Clerk JWT templates can use either orgId or org_id depending on configuration
            const decoded = jwtDecode<{
              orgId?: string;
              org_id?: string;
            }>(token);
            // Try both camelCase (orgId) and snake_case (org_id)
            orgId = decoded.orgId || decoded.org_id;
          } catch {
            // JWT decode failed - token invalid or malformed
            // orgId remains undefined, will trigger 403 below
            // Silent failure - error logged by Clerk middleware
          }
        }
      }

      // Require organization membership (orgId = tenant_id in FleetCore)
      if (!orgId) {
        return NextResponse.json(
          { error: "No organization found for user" },
          { status: 403 }
        );
      }

      // Read tenant UUID from JWT Custom Claim (Clerk injects org.public_metadata.tenantId)
      // Architecture: https://clerk.com/docs/backend-requests/making/custom-session-token
      const tenantId = sessionClaims?.tenantId as string | undefined;

      if (!tenantId) {
        return NextResponse.json(
          { error: "Tenant not configured for organization" },
          { status: 403 }
        );
      }

      // Check rate limit for this tenant
      const now = Date.now();
      const rateLimitKey = `tenant:${tenantId}`;
      const rateLimit = rateLimitStore.get(rateLimitKey);

      if (rateLimit) {
        // If window has passed, reset
        if (now > rateLimit.resetTime) {
          rateLimitStore.set(rateLimitKey, {
            count: 1,
            resetTime: now + RATE_LIMIT_WINDOW,
          });
        } else if (rateLimit.count >= RATE_LIMIT) {
          // Rate limit exceeded
          return NextResponse.json(
            { error: "Rate limit exceeded. Try again later." },
            { status: 429 }
          );
        } else {
          // Increment counter
          rateLimit.count++;
        }
      } else {
        // First request from this tenant
        rateLimitStore.set(rateLimitKey, {
          count: 1,
          resetTime: now + RATE_LIMIT_WINDOW,
        });
      }

      // Clean up old rate limit entries periodically
      if (Math.random() < 0.01) {
        // 1% chance to clean up
        for (const [key, value] of rateLimitStore.entries()) {
          if (now > value.resetTime + RATE_LIMIT_WINDOW) {
            rateLimitStore.delete(key);
          }
        }
      }

      // Add headers for downstream services
      const requestHeaders = new Headers(req.headers);
      requestHeaders.set("x-user-id", userId);
      requestHeaders.set("x-tenant-id", tenantId);

      // Continue with modified headers
      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });
    }

    // Other API routes (demo-leads, etc.) - no auth required
    return NextResponse.next();
  }

  // Admin routes: strict security checks (userId + orgId + role)
  if (pathname.startsWith("/adm")) {
    const { userId, orgId, orgRole } = await auth();

    // 1. User must be authenticated
    if (!userId) {
      const loginUrl = new URL("/en/login", req.url);
      loginUrl.searchParams.set("redirect_url", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // 2. User must belong to FleetCore Admin organization
    if (!ADMIN_ORG_ID || orgId !== ADMIN_ORG_ID) {
      return NextResponse.redirect(new URL("/en/unauthorized", req.url));
    }

    // 3. User must have an admin role
    if (!orgRole || !ADMIN_ROLES.includes(orgRole)) {
      return NextResponse.redirect(new URL("/en/unauthorized", req.url));
    }

    // All checks passed - allow access
    return NextResponse.next();
  }

  // Auto-redirect FleetCore Admin users from client dashboard to admin dashboard
  const isDashboardRoute = pathname.match(/^\/(en|fr)\/dashboard$/);

  if (isDashboardRoute) {
    const { userId, orgId } = await auth();

    if (userId && ADMIN_ORG_ID && orgId === ADMIN_ORG_ID) {
      return NextResponse.redirect(new URL("/adm", req.url));
    }
  }

  // Extract locale from pathname using centralized helper
  const _locale = getLocaleFromPathname(pathname);

  // Check if this is a protected route
  if (isProtectedRoute(req)) {
    await auth.protect();
    // Clerk handles redirection automatically using NEXT_PUBLIC_CLERK_SIGN_IN_URL
  }

  // Check if locale is in path
  const locales = ["en", "fr"];
  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  if (!pathnameHasLocale) {
    // Redirect to default locale (en)
    const newUrl = new URL(`/en${pathname}`, req.url);
    return NextResponse.redirect(newUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Match all pathnames except for:
    // - /_next (Next.js internals)
    // - /_vercel (Vercel internals)
    // - Static files (e.g. /favicon.ico, /sitemap.xml, /robots.txt, etc.)
    // Note: /api routes are NOW included for authentication and rate limiting
    "/((?!_next|_vercel|.*\\..*).*)",
  ],
};
