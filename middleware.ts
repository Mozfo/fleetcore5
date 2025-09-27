import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Update protected routes to include locale prefix
const isProtectedRoute = createRouteMatcher([
  "/:locale/dashboard(.*)",
  "/dashboard(.*)",
  "/api/v1(.*)",
]);

// Locale handling with react-i18next
export default clerkMiddleware(async (auth, req: NextRequest) => {
  // Check if this is a protected route
  if (isProtectedRoute(req)) {
    await auth.protect();
  }

  // Basic locale handling for non-API routes
  const pathname = req.nextUrl.pathname;

  // Skip API routes
  if (pathname.startsWith("/api")) {
    return NextResponse.next();
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
    // - /api routes
    // - /_next (Next.js internals)
    // - /_vercel (Vercel internals)
    // - Static files (e.g. /favicon.ico, /sitemap.xml, /robots.txt, etc.)
    "/((?!api|_next|_vercel|.*\\..*).*)",
    // Always match API routes and locale prefixes
    "/",
    "/(en|fr)/:path*",
  ],
};
