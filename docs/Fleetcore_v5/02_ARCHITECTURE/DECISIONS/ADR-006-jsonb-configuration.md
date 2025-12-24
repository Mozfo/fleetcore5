# ADR-006: JSONB Dynamic Configuration

> **Status:** Accepted
> **Date:** September 2025
> **Decision Makers:** Engineering Team, Product

---

## Context

FleetCore's business rules evolve frequently based on market feedback and operational learnings. Examples include:

- Lead scoring thresholds (SQL at 70 vs 65 points)
- Assignment rules (round-robin vs weighted vs manual)
- SLA definitions (response time in hours)
- Stage configurations (max days before "rotting")

Initially, these values were hardcoded in TypeScript. Every threshold change required a code deployment, even for minor business adjustments.

---

## Decision

**We will store configurable business rules in the `crm_settings` table as JSONB values, validated by Zod schemas, and read at runtime.**

### Rationale

1. **Business Agility:** Product managers can adjust thresholds through admin UI without engineering involvement.

2. **Deployment Independence:** Configuration changes take effect immediately without code deployment or service restart.

3. **Audit Trail:** Changes to settings are tracked in audit logs, providing accountability.

4. **Type Safety:** Zod schemas ensure JSONB content conforms to expected structure despite flexible storage.

5. **Provider-Specific:** Different FleetCore divisions can have different thresholds (UAE vs France market differences).

---

## Consequences

### Positive

- **Business Velocity:** Threshold adjustments in minutes, not days
- **Market Customization:** Each provider can tune rules to local market
- **Experimentation:** Easy A/B testing of different thresholds
- **Reduced Risk:** No code deployment for business rule changes

### Negative

- **Runtime Validation:** Invalid configuration can break features until corrected
- **Schema Evolution:** Changing configuration structure requires migration logic
- **Debugging Complexity:** Behavior depends on database content, not just code
- **Performance:** Every calculation reads from database (mitigated by eventual caching)

### Mitigations

- **Zod Validation:** All reads validate against schema, rejecting malformed config
- **Default Values:** Code provides sensible defaults if setting missing
- **Admin UI Validation:** Frontend validates before saving
- **Logging:** Configuration reads logged for debugging

---

## Implementation

### Schema Structure

```sql
CREATE TABLE crm_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key VARCHAR(100) NOT NULL,
  setting_value JSONB NOT NULL,
  category VARCHAR(50) NOT NULL,
  provider_id UUID REFERENCES adm_providers(id),
  is_system BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  -- Standard audit fields
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- System settings visible to all providers
-- Provider-specific settings override system defaults
```

### Zod Validation

```typescript
// lib/validators/crm/settings.validators.ts

export const ScoringConfigSchema = z.object({
  fitScore: z.object({
    maxScore: z.number().min(0).max(100).default(60),
    fleetSizeWeight: z.number().min(0).max(1).default(0.4),
    marketWeight: z.number().min(0).max(1).default(0.3),
    budgetWeight: z.number().min(0).max(1).default(0.3),
  }),
  engagementScore: z.object({
    maxScore: z.number().min(0).max(100).default(100),
    emailOpenWeight: z.number().min(0).max(1).default(0.2),
    demoRequestWeight: z.number().min(0).max(1).default(0.5),
    responseTimeWeight: z.number().min(0).max(1).default(0.3),
  }),
  qualificationThresholds: z.object({
    sql: z.number().min(0).max(100).default(70), // Sales Qualified
    mql: z.number().min(0).max(100).default(40), // Marketing Qualified
    tof: z.number().min(0).max(100).default(0), // Top of Funnel
  }),
});

export type ScoringConfig = z.infer<typeof ScoringConfigSchema>;
```

### Runtime Loading

```typescript
// lib/services/crm/lead-scoring.service.ts

async getScoringConfig(): Promise<ScoringConfig> {
  const providerId = await getCurrentProviderId();

  // Try provider-specific first, fall back to system
  const setting = await this.settingsRepo.findByKey(
    "scoring",
    providerId
  );

  if (setting?.setting_value) {
    const parsed = ScoringConfigSchema.safeParse(setting.setting_value);
    if (parsed.success) return parsed.data;

    logger.warn({ setting, error: parsed.error },
      "Invalid scoring config, using defaults");
  }

  // Return defaults if no valid config found
  return ScoringConfigSchema.parse({});
}
```

### Configuration Categories

| Category        | Setting Keys                                | Purpose             |
| --------------- | ------------------------------------------- | ------------------- |
| `scoring`       | Fit weights, engagement weights, thresholds | Lead qualification  |
| `assignment`    | Round-robin, weighted, manual rules         | Lead distribution   |
| `stages`        | Max days, rotting alerts, required fields   | Pipeline management |
| `sla`           | Response times, escalation rules            | Service levels      |
| `notifications` | Email templates, trigger conditions         | Communication       |

---

_See also: [ADR-007: Lead Scoring Algorithm](./ADR-007-lead-scoring-algorithm.md)_
