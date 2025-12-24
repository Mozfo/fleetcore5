# Technical Stack

> **Document Type:** Technology Reference
> **Version:** 1.1
> **Last Updated:** December 2025

---

## Introduction

Technology selection shapes every aspect of a software platform, from developer productivity to operational costs to long-term maintainability. FleetCore's technical stack reflects deliberate choices made to serve the specific requirements of a multi-tenant SaaS platform targeting the ride-hailing fleet management market. Each technology was selected not in isolation but as part of a cohesive system where components complement each other.

This document explains the reasoning behind each major technology choice, the alternatives considered, and the trade-offs accepted.

---

## Framework Layer

### Next.js 15.5.7

The foundation of FleetCore is Next.js, the React framework that has emerged as the de facto standard for production React applications. Version 15 brings significant improvements aligned with FleetCore's requirements.

The App Router architecture provides file-system based routing that maps directly to the URL structure. The `app/[locale]/` directory structure enables internationalization at the routing level, ensuring French users see `/fr/dashboard` while English users see `/en/dashboard` without complex middleware.

Server Components render entirely on the server without shipping JavaScript to the client. FleetCore leverages this for data-heavy pages like the leads dashboard, where the initial render includes all necessary data without requiring a loading spinner followed by an API call.

Turbopack, the new bundler replacing Webpack for development, reduces hot module replacement times from seconds to milliseconds, significantly improving developer experience.

**Alternatives Considered:**

- Remix: Compelling data loading patterns but lacked Vercel deployment optimization
- Create React App: Rejected due to client-only rendering model

### React 19.1.2

React 19 introduces improved hydration algorithms that reduce mismatches between server-rendered HTML and client-side React. Server Actions enable form handling without explicit API routes for simple mutations, though FleetCore primarily uses explicit API routes in `app/api/v1/` for complex operations.

---

## UI Component Library

### shadcn/ui with Radix Primitives

FleetCore's component library is built on shadcn/ui, a collection of re-usable components built with Radix UI primitives and Tailwind CSS. The `components/ui/` directory contains customized versions of these components.

**Components in Use:**

- `button.tsx`, `input.tsx`, `textarea.tsx` - Form elements
- `dialog.tsx`, `sheet.tsx`, `popover.tsx` - Overlays
- `table.tsx`, `tabs.tsx` - Data display
- `select.tsx`, `checkbox.tsx`, `switch.tsx` - Form controls
- `dropdown-menu.tsx`, `context-menu.tsx` - Navigation
- `card.tsx`, `badge.tsx`, `skeleton.tsx` - Layout

**Why shadcn/ui:**

- **Ownership:** Components are copied into the codebase, not imported from npm, enabling full customization
- **Accessibility:** Radix primitives handle keyboard navigation, focus management, and ARIA attributes
- **Styling:** Tailwind CSS integration matches FleetCore's design system
- **No Runtime Cost:** No additional bundle size from component library

**Alternatives Considered:**

- Material UI: Heavier bundle, opinionated styling
- Chakra UI: Good accessibility but different design philosophy
- Headless UI: Fewer components, would require more custom development

### Tailwind CSS 4.1.13

Tailwind CSS provides utility-first styling that compiles to minimal CSS. FleetCore uses:

- Custom color palette defined in `tailwind.config.ts`
- Dark mode support via `class` strategy with `next-themes`
- Responsive utilities for mobile-first design

---

## Form Handling

### React Hook Form + Zod

FleetCore implements a dual-validation strategy combining React Hook Form for client-side form management with Zod schemas that are shared between client and server.

**Pattern Implementation:**

```typescript
// lib/validators/crm/lead.validators.ts - Shared schema
export const CreateLeadSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  email: z.string().email("Invalid email format"),
  company_name: z.string().optional(),
  fleet_size: z.number().int().positive().optional(),
});

// Client component
const form = useForm<CreateLeadInput>({
  resolver: zodResolver(CreateLeadSchema),
  defaultValues: { first_name: "", email: "" },
});

// API route - same schema validates server-side
const parsed = CreateLeadSchema.safeParse(body);
if (!parsed.success) {
  return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
}
```

**Benefits:**

- Single source of truth for validation rules
- Immediate client feedback without API round-trip
- Server rejects malformed data even if client validation bypassed
- TypeScript types derived from Zod schemas

---

## Internationalization

### react-i18next

FleetCore supports English and French with infrastructure prepared for Arabic (RTL). The i18n system is configured in `lib/i18n/config.ts`.

**Architecture:**

```typescript
// lib/i18n/config.ts
i18n
  .use(initReactI18next)
  .use(
    resourcesToBackend(
      (language: string, namespace: string) =>
        import(`@/lib/i18n/locales/${language}/${namespace}.json`)
    )
  )
  .init({
    fallbackLng: "en",
    supportedLngs: ["en", "fr"],
    defaultNS: "common",
    ns: ["common", "auth", "public", "admin", "crm"],
  });
```

**Translation Structure:**

```
lib/i18n/locales/
├── en/
│   ├── common.json    # Shared UI elements
│   ├── auth.json      # Login, register, password reset
│   ├── public.json    # Landing pages, demo request
│   ├── admin.json     # Admin dashboard
│   └── crm.json       # CRM module
└── fr/
    └── ... (mirror structure)
```

**URL-Based Routing:** The `app/[locale]/` directory structure provides locale in URL path, enabling:

- `/en/dashboard` - English dashboard
- `/fr/dashboard` - French dashboard
- Bookmarkable locale-specific URLs
- SEO benefits from distinct URLs per language

**RTL Preparation:** Arabic support (planned) will require:

- Adding `ar` to `supportedLngs`
- Creating `lib/i18n/locales/ar/` translations
- Adding `dir="rtl"` conditional to root layout
- RTL-aware Tailwind utilities (`rtl:` prefix)

---

## Data Layer

### Prisma 6.18.0

Prisma serves as the ORM, providing type-safe database access that catches errors at compile time. The generated Prisma Client reflects the exact database schema structure.

**FleetCore-Specific Workflow (See ADR-004):**

```
1. Write SQL migration manually in Supabase SQL Editor
2. Update schema.prisma to match database changes
3. Run: pnpm prisma generate
4. NEVER use: db push, db pull, migrate (causes drift)
```

**Alternatives Considered:**

- TypeORM: Less type safety, more complex configuration
- Drizzle: Promising but less mature ecosystem
- Raw SQL: Maximum performance but no type safety

### PostgreSQL via Supabase

PostgreSQL was mandatory for Row-Level Security support. Supabase provides:

- Managed hosting with automatic backups
- PgBouncer connection pooling (essential for serverless)
- Dashboard for schema management and SQL execution
- 99.9% SLA with automatic failover

JSONB columns enable the zero-hardcoding principle (ADR-006), storing configuration like lead scoring thresholds in `crm_settings`.

---

## Authentication Layer

### Clerk 6.32.2

Authentication is fully delegated to Clerk. This decision deserves examination given authentication's critical security role.

**Capabilities Used:**

- Social login (Google, Microsoft) without OAuth configuration
- Multi-factor authentication (TOTP, WebAuthn)
- Organization-based multi-tenancy
- Webhooks for user lifecycle events
- Custom session claims (`tenantId` injection)

**Integration Points:**

- `middleware.ts`: Token validation, organization membership check
- `app/api/webhooks/clerk/route.ts`: User sync events
- `adm_provider_employees`: Links Clerk user IDs to FleetCore providers

**Alternatives Considered:**

- Auth0: Similar capabilities, higher cost, complex pricing
- NextAuth.js: More control but significant implementation effort
- Supabase Auth: Less mature organization support

---

## Communication Layer

### Resend 6.1.0 with React Email

Transactional email delivery through Resend with templates built as React components.

**Template Location:** `emails/templates/`

- `LeadConfirmation.tsx` - Demo request acknowledgment
- `MemberWelcome.tsx` - New member onboarding
- `ExpansionOpportunity.tsx` - Market expansion alerts

**Webhook Integration:** `app/api/webhooks/resend/route.ts` processes delivery callbacks for bounces, complaints, and successful deliveries.

---

## Validation Layer

### Zod 4.1.11

Runtime validation complements TypeScript's compile-time checking. Zod schemas in `lib/validators/` validate all API inputs.

**JSONB Configuration Validation:**

```typescript
// lib/validators/crm/settings.validators.ts
export const ScoringConfigSchema = z.object({
  fitScore: z.object({
    maxScore: z.number().min(0).max(100),
    fleetSizeWeight: z.number().min(0).max(1),
    marketWeight: z.number().min(0).max(1),
  }),
  qualificationThresholds: z.object({
    sql: z.number().min(0).max(100),
    mql: z.number().min(0).max(100),
  }),
});
```

---

## Testing Layer

### Vitest with Testing Library

Vitest serves as the test runner, chosen for speed and native ESM support.

**Test Organization:**

- `lib/**/__tests__/` - Unit tests co-located with source
- `__tests__/critical-paths/` - Integration tests for key flows

**Testing Library:** Provides utilities for testing React components through rendered interface, not implementation details.

---

## Development Tools

### ESLint Configuration

FleetCore enforces strict TypeScript rules via `eslint.config.mjs`:

```typescript
rules: {
  // BLOCKERS - Forbidden in codebase
  "no-console": "error",
  "@typescript-eslint/no-explicit-any": "error",
  "@typescript-eslint/no-non-null-assertion": "error",
  "@typescript-eslint/no-floating-promises": "error",

  // STANDARDS
  "no-var": "error",
  "eqeqeq": ["error", "always"],
  "prefer-const": "warn",
}
```

**Exceptions:** `prisma/seed.ts` and `scripts/**/*.ts` allow `console.log`.

### Husky Pre-Commit Hooks

Pre-commit hooks in `.husky/pre-commit` enforce quality gates:

```bash
# 1. Critical code protection
check_critical_pattern_or "app/api/demo-leads/route.ts" \
  "NotificationService" "NotificationQueueService" \
  "Email/notification service is required for lead notifications"

# 2. Lint staged files
pnpm lint-staged

# 3. TypeScript type check
pnpm typecheck
```

**Critical Code Protection:** Added after Session #27 incident where email sending was accidentally removed. Hooks prevent commits that remove business-critical patterns.

### lint-staged

Runs ESLint and Prettier only on staged files:

```json
{
  "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
  "*.{json,md}": ["prettier --write"]
}
```

---

## Deployment Layer

### Vercel

Vercel provides hosting optimized for Next.js:

- Automatic preview deployments per pull request
- Edge Functions for low-latency middleware
- CRON job scheduling via `vercel.json`
- Environment variables per environment (preview/staging/production)

**Serverless Constraints:**

- Function timeout: 60 seconds (increased for CRON)
- Cold starts mitigated by connection pooling
- No persistent in-memory state (rate limiting limitation)

---

## Version Compatibility Matrix

| Component    | Version | Compatibility Notes        |
| ------------ | ------- | -------------------------- |
| Next.js      | 15.5.7  | Requires React 19.x        |
| React        | 19.1.2  | Peer dependency of Next.js |
| Prisma       | 6.18.0  | Requires Node 18.x+        |
| Clerk        | 6.32.2  | Works with Next.js 14+     |
| Resend       | 6.1.0   | No framework dependencies  |
| Zod          | 4.1.11  | TypeScript 5.x recommended |
| Vitest       | 3.3.1   | Native ESM support         |
| TypeScript   | 5.x     | Strict mode enabled        |
| Node.js      | 20.x    | LTS version in use         |
| Tailwind CSS | 4.1.13  | PostCSS integration        |

---

## Conclusion

FleetCore's technical stack represents cohesive choices optimized for developer productivity, operational reliability, and long-term maintainability. Each technology was selected with awareness of alternatives and explicit acceptance of trade-offs. The result is a codebase that new developers can understand quickly and that scales with business growth.

---

_For architectural principles that guide development, see [03_architecture_principles.md](./03_architecture_principles.md)._
