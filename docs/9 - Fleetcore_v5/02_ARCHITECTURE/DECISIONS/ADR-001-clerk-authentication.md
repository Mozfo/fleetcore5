# ADR-001: Clerk for Authentication

> **Status:** Accepted
> **Date:** June 2025
> **Decision Makers:** Engineering Team

---

## Context

FleetCore requires a robust authentication system supporting multiple organizations (fleet operators), role-based access control, and eventually social login for improved user experience. The engineering team evaluated several options to balance development speed, security, and cost.

Authentication is security-critical infrastructure where implementation errors can lead to severe vulnerabilities. The team had limited security expertise and needed to ship quickly while maintaining enterprise-grade security.

### Options Evaluated

1. **Custom Implementation (NextAuth.js):** Maximum flexibility but requires significant security expertise and ongoing maintenance.

2. **Auth0:** Industry standard with comprehensive features but complex pricing tiers and significant cost at scale.

3. **Supabase Auth:** Integrated with existing Supabase database but less mature organization/team features.

4. **Clerk:** Modern auth platform with first-class Next.js integration and organization-based multi-tenancy.

---

## Decision

**We will use Clerk as the authentication provider for FleetCore.**

### Rationale

1. **Organization Model:** Clerk's Organizations feature maps directly to FleetCore's multi-tenant architecture. Each fleet operator becomes a Clerk organization with built-in membership management, roles, and invitations.

2. **Next.js Integration:** The `@clerk/nextjs` package provides React hooks, middleware helpers, and server-side utilities that integrate cleanly with App Router.

3. **Security Delegation:** Clerk handles MFA, session management, token rotation, and security best practices. This removes authentication from FleetCore's security surface area.

4. **Custom Claims:** Clerk supports custom session claims, allowing FleetCore to inject `tenantId` into JWTs without additional database lookups on every request.

5. **Webhook Events:** Clerk webhooks notify FleetCore of user lifecycle events (creation, organization membership changes), enabling synchronization of internal state.

---

## Consequences

### Positive

- **Development Speed:** No authentication code to write, test, or maintain. Team focuses on business logic.
- **Security:** Enterprise-grade security without in-house expertise. SOC2 compliance inherited.
- **User Experience:** Social login, passwordless options, and polished UI components available immediately.
- **Scalability:** Clerk handles authentication load; no scaling concerns for auth infrastructure.

### Negative

- **Vendor Lock-in:** Authentication logic tied to Clerk APIs. Migration would require significant effort.
- **Cost at Scale:** Clerk pricing scales with Monthly Active Users. At 100k+ MAU, costs become significant.
- **Latency:** Every authenticated request validates with Clerk. Edge caching mitigates but doesn't eliminate.
- **Feature Constraints:** Custom authentication flows limited to what Clerk supports.

### Mitigations

- **Cost Monitoring:** Track MAU growth against Clerk pricing tiers. Evaluate alternatives if costs exceed 5% of revenue.
- **Abstraction Layer:** Authentication calls go through FleetCore helpers (`lib/utils/provider-context.ts`), not direct Clerk SDK calls, reducing coupling.

---

## Implementation

**Middleware:** `middleware.ts` validates Clerk sessions and extracts organization context:

```typescript
export default clerkMiddleware(async (auth, req) => {
  const { userId, orgId, orgRole } = await auth();
  // Route protection based on org membership and role
});
```

**Webhook Handler:** `app/api/webhooks/clerk/route.ts` processes user events:

```typescript
export async function POST(request: Request) {
  const payload = await verifyWebhook(request);
  if (payload.type === "user.created") {
    // Create adm_provider_employee record
  }
}
```

**Custom Claims:** Clerk session template injects `tenantId`:

```json
{
  "tenantId": "{{org.public_metadata.tenantId}}"
}
```

---

_See also: [ADR-003: Provider vs Tenant Isolation](./ADR-003-provider-tenant-isolation.md)_
