import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getLocaleFromPathname, getLocalizedPath } from "@/lib/navigation";

// Admin organization ID (FleetCore backoffice)
const ADMIN_ORG_ID = process.env.FLEETCORE_ADMIN_ORG_ID;

// Allowed admin roles
const ADMIN_ROLES = ["org:adm_admin", "org:adm_commercial", "org:adm_support"];

// Define public routes (accessible without authentication)
const isPublicRoute = createRouteMatcher([
  "/",
  "/:locale",
  "/:locale/login(.*)",
  "/:locale/register(.*)",
  "/:locale/forgot-password(.*)",
  "/:locale/reset-password(.*)",
  "/:locale/request-demo(.*)",
  "/api/demo-leads",
  "/api/webhooks(.*)",
]);

// Locale handling with react-i18next
export default clerkMiddleware(async (auth, req: NextRequest) => {
  // Basic locale handling for non-API routes
  const pathname = req.nextUrl.pathname;

  // Skip API routes FIRST (before any auth checks)
  if (pathname.startsWith("/api")) {
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

  // Handle locale redirection FIRST (before auth checks)
  // This ensures all routes have a locale prefix before auth.protect() is called
  const locales = ["en", "fr"];
  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  if (!pathnameHasLocale) {
    // Redirect to default locale (en)
    const newUrl = new URL(`/en${pathname}`, req.url);
    return NextResponse.redirect(newUrl);
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
  const locale = getLocaleFromPathname(pathname);

  // Protect all routes except public ones (Clerk best practice)
  // Now all routes have locale prefix, so auth.protect() works correctly
  if (!isPublicRoute(req)) {
    await auth.protect();
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Match all pathnames except for:
    // - /api routes
    // - /_next (Next.js internals)
    // - /_vercel (Vercel internals)
    // - Static files (e.g. /favicon.ico, /sitemap.xml, /robots.txt, etc.)
    "/((?!api|_next|_vercel|.*\\..*).*)",
  ],
};
