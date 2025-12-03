REGLE ABSOLUE - CARTON ROUGE

IL EST STRICTEMENT INTERDIT DE MODIFIER OU SUPPRIMER DES REGLES METIERS POUR CORRIGER DES BUGS.

Incident du 27/11/2025: Claude a tente de supprimer l audit logging dans qualify.actions.ts sous pretexte de corriger une erreur UUID. INACCEPTABLE.

La bonne approche:

1. Identifier la vraie cause du bug (ici: Clerk IDs vs UUIDs dans adm_audit_logs)
2. Trouver une solution technique qui PRESERVE les regles metiers
3. JAMAIS supprimer une fonctionnalite existante pour simplifier

---

⏺ FleetCore Project Status

Last Updated: September 27, 2025Next.js Version: 15.5.3 with TurbopackStatus: ✅ Production Ready

🎯 Current State

✅ Complete Features

- Internationalization (i18n): Fully migrated from next-intl to react-i18next
  - English and French translations complete
  - Locale persistence across navigation
  - All pages and forms internationalized
- Authentication: Clerk-based auth system with locale support
- Request Demo System: Fully functional with API integration
- Responsive Design: Mobile-first approach with dark mode

🛠️ Architecture

Tech Stack

- Framework: Next.js 15.5.3 with App Router + Turbopack
- UI: React 19.1.0 + TailwindCSS 4.1.13 + Framer Motion
- Auth: Clerk Organizations
- Database: Prisma + PostgreSQL
- Deployment: Vercel-ready
- Monitoring: Sentry integration

Project Structure

app/
├── [locale]/ # Locale-based routing (en/fr)
│ ├── (auth)/ # Authentication pages
│ ├── (public)/ # Public pages
│ ├── dashboard/ # Protected dashboard
│ └── page.tsx # Homepage
├── api/ # API routes
└── layout.tsx # Root layout

lib/
├── i18n/ # Internationalization
│ ├── config.ts # i18next configuration
│ ├── I18nProvider.tsx # React provider
│ └── locales/ # Translation files
└── hooks/ # Custom hooks
└── useLocalizedPath.ts # Locale navigation

🚀 Development Commands

# Development with Turbopack

pnpm dev

# Build for production

pnpm build

# Database operations

pnpm prisma:generate
pnpm prisma:migrate
pnpm prisma:studio

# Code quality

pnpm lint
pnpm format

🌍 Internationalization

Supported Locales

- English (en): Default locale
- French (fr): Complete translation

Translation Structure

- auth.json: Authentication pages
- public.json: Public pages and request demo
- common.json: Shared components and navigation

URL Structure

- /en/ - English content
- /fr/ - French content
- / - Redirects to /en/

🔐 Authentication

Clerk Integration

- Organizations: Multi-tenant support
- Roles: Member/Admin permissions
- OAuth: Social login ready
- Webhooks: Member sync implemented

Protected Routes

- /[locale]/dashboard/\* - Dashboard pages
- /api/v1/\* - Protected API routes

📊 API Endpoints

Public APIs

- POST /api/demo-leads - Demo request submissions
- POST /api/webhooks/clerk - Clerk member sync

Protected APIs

- /api/v1/\* - Authenticated endpoints (ready for expansion)

🎨 Design System

Theme Support

- Light/Dark mode: next-themes integration
- Responsive: Mobile-first TailwindCSS
- Animations: Framer Motion for smooth UX
- Components: Radix UI primitives

Color Palette

- Primary: Blue gradient (blue-600 to purple-700)
- Secondary: Contextual colors (green, orange, purple)
- Neutral: Gray scale with dark mode variants

📱 Pages Overview

Public Pages

- Homepage (/[locale]): Hero section with language switcher
- Request Demo (/[locale]/request-demo/form): Lead capture form
- Auth Pages: Login, register, forgot/reset password

Protected Pages

- Dashboard (/[locale]/dashboard): Main app interface (ready for expansion)

🔧 Recent Improvements

Migration Completed (Sept 27, 2025)

- ✅ next-intl → react-i18next: Resolved Turbopack compatibility
- ✅ Dead code cleanup: Removed all migration artifacts
- ✅ Git optimization: Clean repository with proper file tracking
- ✅ Performance: Reduced background processes
- ✅ Code quality: Updated comments and documentation

Key Fixes

- Locale persistence: Language selection maintained across navigation
- Form internationalization: Complete French translation of request demo
- Error handling: Resolved reference errors and build issues
- Turbopack compatibility: Full development server support

🚦 Deployment Status

Ready for Production

- ✅ Build: Successful with Turbopack
- ✅ Linting: ESLint + Prettier configured
- ✅ Type Safety: TypeScript strict mode
- ✅ Database: Prisma schema ready
- ✅ Environment: .env.local template ready

Environment Variables Required

# Database

DATABASE_URL="postgresql://..."

# Authentication

NEXT*PUBLIC_CLERK_PUBLISHABLE_KEY="pk*..."
CLERK*SECRET_KEY="sk*..."
CLERK*WEBHOOK_SECRET="whsec*..."

# Monitoring

SENTRY_DSN="https://..."

📈 Next Steps

Immediate Priorities

1. Dashboard Content: Implement fleet management features
2. User Onboarding: Post-registration flow
3. Fleet Analytics: Real-time metrics and reporting
4. Multi-platform Integration: Uber, Bolt, Careem APIs

Technical Enhancements

1. Testing: Add comprehensive test suite
2. Performance: Implement caching strategies
3. SEO: Add metadata and structured data
4. Analytics: Google Analytics/Mixpanel integration

💡 Development Notes

Best Practices

- Use useLocalizedPath() hook for navigation
- Follow existing translation key structure
- Maintain TypeScript strict compliance
- Use Framer Motion for animations
- Implement proper error boundaries

Code Conventions

- Client components: "use client" directive
- Server components: Default (no directive)
- Translations: Namespace-based organization
- Styling: TailwindCSS utility classes
- Forms: React Hook Form + Zod validation

---

Project Health: 🟢 ExcellentReady for: Production deployment and feature development
