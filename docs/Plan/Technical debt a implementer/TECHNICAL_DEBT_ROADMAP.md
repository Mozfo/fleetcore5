# FLEETCORE - TECHNICAL DEBT ROADMAP & NOTIFICATION FRAMEWORK

> **Document Version**: 1.0  
> **Date**: 2025-12-05  
> **Status**: APPROVED  
> **Audience**: Claude Code, Development Team

---

## 1. EXECUTIVE SUMMARY

### Current State

- **Code Quality Score**: 7.7/10 (Good to Very Good)
- **Target Score**: 8.5/10 (Series B Level)
- **Critical Issues**: 4 identified
- **Estimated Cleanup Time**: 4-6 hours

### Key Metrics

| Metric                     | Current     | Target        | Priority |
| -------------------------- | ----------- | ------------- | -------- |
| Archive Size               | 227 MB      | 0 MB          | CRITICAL |
| Console.log in Prod        | 6 files     | 0 files       | HIGH     |
| Enum Inconsistencies       | 3 locations | 1 centralized | HIGH     |
| Files > 800 LOC            | 10+ files   | < 5 files     | MEDIUM   |
| Email Template Duplication | 36 files    | 12 files      | LOW      |

---

## 2. PHASE 0: QUICK WINS (4-6 hours)

### 2.1 Archive Cleanup (CRITICAL - 227MB)

**Objective**: Remove obsolete archives polluting the repository.

**Pre-requisites**:

```bash
# STEP 1: Create safety tag BEFORE any deletion
git tag pre-archive-cleanup-$(date +%Y%m%d)
git push origin pre-archive-cleanup-$(date +%Y%m%d)
```

**Directories to Remove**:

```bash
# Verify existence and size
du -sh _archive/ 2>/dev/null || echo "_archive/ not found"
du -sh archive_fleetcore_20251106/ 2>/dev/null || echo "archive_fleetcore_20251106/ not found"

# List contents for verification (DO NOT DELETE WITHOUT REVIEW)
ls -la _archive/ 2>/dev/null | head -30
ls -la archive_fleetcore_20251106/ 2>/dev/null | head -30
```

**Deletion Commands** (execute only after verification):

```bash
# Remove archive directories
rm -rf _archive/
rm -rf archive_fleetcore_20251106/

# Update .gitignore to prevent future archives
echo "" >> .gitignore
echo "# Archives (should be stored externally)" >> .gitignore
echo "_archive/" >> .gitignore
echo "archive_*/" >> .gitignore
```

**Validation Criteria**:

- [ ] Safety tag created and pushed
- [ ] Archive contents reviewed (no critical files)
- [ ] Directories deleted
- [ ] .gitignore updated
- [ ] `du -sh .` shows reduced size

---

### 2.2 Console.log Replacement (HIGH)

**Objective**: Replace production console.log with structured logger.

**Files to Update**:

| File                                          | Line(s) | Current         | Replace With     |
| --------------------------------------------- | ------- | --------------- | ---------------- |
| `lib/actions/crm/qualify.actions.ts`          | TBD     | `console.log()` | `logger.info()`  |
| `lib/actions/crm/lead.actions.ts`             | TBD     | `console.log()` | `logger.info()`  |
| `lib/actions/crm/convert.actions.ts`          | TBD     | `console.log()` | `logger.info()`  |
| `lib/repositories/crm/settings.repository.ts` | TBD     | `console.log()` | `logger.debug()` |
| `lib/auth/jwt.ts`                             | TBD     | `console.log()` | `logger.warn()`  |
| `lib/core/base.service.ts`                    | TBD     | `console.log()` | `logger.info()`  |

**Search Command**:

```bash
# Find all console.log in lib/ and app/ (excluding node_modules)
grep -rn "console\.log" lib/ app/ --include="*.ts" --include="*.tsx" | grep -v node_modules | grep -v ".test." | grep -v ".spec."
```

**Logger Import Pattern**:

```typescript
// At top of file
import { logger } from "@/lib/logger";

// Replace console.log
// BEFORE:
console.log("Processing lead:", leadId);

// AFTER:
logger.info("Processing lead", { leadId });
```

**ESLint Rule** (add to `.eslintrc.json`):

```json
{
  "rules": {
    "no-console": ["error", { "allow": ["warn", "error"] }]
  }
}
```

**Validation Criteria**:

- [ ] All 6 files updated
- [ ] Logger imported correctly
- [ ] ESLint rule added
- [ ] `pnpm lint` passes
- [ ] No console.log in production code

---

### 2.3 Enum Centralization (HIGH)

**Objective**: Create single source of truth for CRM enums.

**Problem Identified**:

- `LEAD_STATUSES` defined in multiple validators
- `converted` status missing in some locations
- `OPPORTUNITY_STAGES` inconsistent

**Solution**: Create centralized enum configuration.

**File to Create**: `lib/config/crm-enums.ts`

```typescript
/**
 * CRM Enums - Single Source of Truth
 *
 * IMPORTANT: All CRM validators MUST import from this file.
 * DO NOT define enums locally in validators.
 *
 * @module lib/config/crm-enums
 */

// ============================================
// LEAD ENUMS
// ============================================

export const LEAD_STATUSES = [
  "new",
  "contacted",
  "qualified",
  "unqualified",
  "converted", // CRITICAL: This was missing in some validators
  "lost",
] as const;

export type LeadStatus = (typeof LEAD_STATUSES)[number];

export const LEAD_SOURCES = [
  "website",
  "referral",
  "social_media",
  "cold_call",
  "trade_show",
  "partner",
  "advertisement",
  "other",
] as const;

export type LeadSource = (typeof LEAD_SOURCES)[number];

export const LEAD_PRIORITIES = ["low", "medium", "high", "urgent"] as const;

export type LeadPriority = (typeof LEAD_PRIORITIES)[number];

// ============================================
// OPPORTUNITY ENUMS
// ============================================

export const OPPORTUNITY_STATUSES = [
  "open",
  "won",
  "lost",
  "suspended",
] as const;

export type OpportunityStatus = (typeof OPPORTUNITY_STATUSES)[number];

export const OPPORTUNITY_STAGES = [
  "qualification",
  "discovery",
  "proposal",
  "negotiation",
  "closing",
  "won",
  "lost",
] as const;

export type OpportunityStage = (typeof OPPORTUNITY_STAGES)[number];

export const OPPORTUNITY_LOSS_REASONS = [
  "price",
  "competition",
  "no_budget",
  "no_decision",
  "timing",
  "product_fit",
  "other",
] as const;

export type OpportunityLossReason = (typeof OPPORTUNITY_LOSS_REASONS)[number];

// ============================================
// CONTRACT ENUMS
// ============================================

export const CONTRACT_STATUSES = [
  "draft",
  "pending_approval",
  "active",
  "expired",
  "terminated",
  "renewed",
] as const;

export type ContractStatus = (typeof CONTRACT_STATUSES)[number];

export const CONTRACT_TYPES = [
  "lease",
  "rental",
  "service",
  "partnership",
  "driver_agreement",
] as const;

export type ContractType = (typeof CONTRACT_TYPES)[number];

// ============================================
// ACTIVITY ENUMS
// ============================================

export const ACTIVITY_TYPES = [
  "call",
  "email",
  "meeting",
  "note",
  "task",
  "follow_up",
] as const;

export type ActivityType = (typeof ACTIVITY_TYPES)[number];

export const ACTIVITY_OUTCOMES = [
  "completed",
  "no_answer",
  "callback_requested",
  "not_interested",
  "interested",
  "meeting_scheduled",
] as const;

export type ActivityOutcome = (typeof ACTIVITY_OUTCOMES)[number];

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Validates if a value is a valid enum member
 */
export function isValidEnumValue<T extends readonly string[]>(
  value: string,
  enumArray: T
): value is T[number] {
  return enumArray.includes(value as T[number]);
}

/**
 * Gets display label for enum value (for UI)
 * Converts snake_case to Title Case
 */
export function getEnumLabel(value: string): string {
  return value
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
```

**Files to Update** (import from centralized file):

1. `lib/validators/crm/lead.validator.ts`
2. `lib/validators/crm/opportunity.validator.ts`
3. `lib/validators/crm/contract.validator.ts`
4. `lib/validators/crm/activity.validator.ts`
5. Any other file defining these enums locally

**Update Pattern**:

```typescript
// BEFORE (in validator files):
const LEAD_STATUSES = ["new", "contacted", "qualified", "lost"]; // Missing 'converted'!

// AFTER:
import {
  LEAD_STATUSES,
  LEAD_SOURCES,
  LEAD_PRIORITIES,
} from "@/lib/config/crm-enums";
```

**Validation Criteria**:

- [ ] `lib/config/crm-enums.ts` created
- [ ] All validators updated to import from centralized file
- [ ] No local enum definitions remain
- [ ] `pnpm typecheck` passes
- [ ] `pnpm test` passes

---

## 3. NOTIFICATION FRAMEWORK SPECIFICATION

### 3.1 Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                      APPLICATION LAYER                          │
│  (CRM Events, Fleet Events, Admin Events, Scheduled Tasks)      │
└─────────────────────────────────────┬───────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                   NOTIFICATION SERVICE                          │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐            │
│  │  Validation  │ │  Preferences │ │ Rate Limiter │            │
│  │    (Zod)     │ │   Resolver   │ │  (per user)  │            │
│  └──────────────┘ └──────────────┘ └──────────────┘            │
└─────────────────────────────────────┬───────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                   NOTIFICATION QUEUE                            │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐                  │
│  │  CRITICAL  │ │  STANDARD  │ │ PROMOTIONAL│                  │
│  │  (OTP,     │ │  (Updates, │ │  (Reports, │                  │
│  │  Alerts)   │ │  Tasks)    │ │  Digests)  │                  │
│  └────────────┘ └────────────┘ └────────────┘                  │
└─────────────────────────────────────┬───────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                   CHANNEL PROCESSORS                            │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐  │
│  │  EMAIL  │ │   SMS   │ │  PUSH   │ │ IN-APP  │ │  SLACK  │  │
│  │ (Resend)│ │(Twilio) │ │  (FCM)  │ │  (WS)   │ │  (API)  │  │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘  │
└─────────────────────────────────────┬───────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                   DELIVERY & ANALYTICS                          │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐            │
│  │ Status Track │ │  Retry Logic │ │  Analytics   │            │
│  │ (delivered,  │ │  (exp backoff│ │  (open rate, │            │
│  │  failed)     │ │  3 retries)  │ │  click rate) │            │
│  └──────────────┘ └──────────────┘ └──────────────┘            │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 Design Patterns Used

| Pattern                     | Usage                              | Benefit             |
| --------------------------- | ---------------------------------- | ------------------- |
| **Strategy**                | Channel selection (Email/SMS/Push) | Runtime flexibility |
| **Template Method**         | Base notification + variations     | Code reuse          |
| **Factory**                 | Create typed notifications         | Type safety         |
| **Observer**                | Event-driven triggers              | Loose coupling      |
| **Chain of Responsibility** | Rate limiting, validation          | Extensibility       |

### 3.3 Database Schema

**Table**: `notification_templates`

```sql
CREATE TABLE notification_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identification
  code VARCHAR(100) UNIQUE NOT NULL,  -- e.g., 'lead_created_confirmation'
  name VARCHAR(255) NOT NULL,
  description TEXT,

  -- Categorization
  category VARCHAR(50) NOT NULL,      -- 'crm', 'fleet', 'admin', 'billing'
  channel VARCHAR(20) NOT NULL,       -- 'email', 'sms', 'push', 'in_app'

  -- Content
  subject_template TEXT,              -- For email: "New Lead: {{lead.company}}"
  body_template TEXT NOT NULL,        -- HTML or text with {{variables}}

  -- Configuration
  variables JSONB NOT NULL DEFAULT '[]',  -- ["lead.company", "lead.email"]
  priority VARCHAR(20) DEFAULT 'standard', -- 'critical', 'high', 'standard', 'low'

  -- Multi-tenancy
  tenant_id UUID REFERENCES tenants(id),  -- NULL = system template

  -- Metadata
  is_active BOOLEAN DEFAULT true,
  version INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX idx_notification_templates_code ON notification_templates(code);
CREATE INDEX idx_notification_templates_category ON notification_templates(category);
CREATE INDEX idx_notification_templates_tenant ON notification_templates(tenant_id);
```

**Table**: `notification_logs` (already exists as `adm_notification_logs`)

```sql
-- Existing table structure (reference only)
-- Located in: adm_notification_logs
-- Fields: id, tenant_id, template_code, recipient_id, channel,
--         status, sent_at, delivered_at, error_message, metadata
```

### 3.4 Template Naming Convention

**Pattern**: `{domain}_{entity}_{action}_{context}`

**Examples**:

```
crm_lead_created_confirmation
crm_lead_assigned_notification
crm_opportunity_stage_changed_alert
crm_opportunity_rotting_warning
fleet_vehicle_maintenance_due_reminder
fleet_document_expiring_alert
admin_invitation_sent_welcome
admin_password_reset_request
billing_payment_received_confirmation
billing_payment_overdue_reminder
```

### 3.5 Internationalization (i18n)

**Directory Structure**:

```
locales/
├── en/
│   └── notifications.json
├── fr/
│   └── notifications.json
└── ar/
    └── notifications.json
```

**JSON Structure** (`locales/en/notifications.json`):

```json
{
  "crm_lead_created_confirmation": {
    "subject": "New Lead Created: {{lead.company}}",
    "body": "A new lead has been created in your CRM.\n\nCompany: {{lead.company}}\nContact: {{lead.contact_name}}\nEmail: {{lead.email}}\n\nView details: {{link}}"
  },
  "crm_lead_assigned_notification": {
    "subject": "Lead Assigned to You: {{lead.company}}",
    "body": "You have been assigned a new lead.\n\nCompany: {{lead.company}}\nPriority: {{lead.priority}}\n\nPlease follow up within 24 hours."
  },
  "crm_opportunity_rotting_warning": {
    "subject": "⚠️ Opportunity Needs Attention: {{opportunity.name}}",
    "body": "This opportunity has been inactive for {{days_inactive}} days.\n\nValue: {{opportunity.value}}\nStage: {{opportunity.stage}}\n\nPlease update or close this opportunity."
  }
}
```

**French** (`locales/fr/notifications.json`):

```json
{
  "crm_lead_created_confirmation": {
    "subject": "Nouveau Lead Créé : {{lead.company}}",
    "body": "Un nouveau lead a été créé dans votre CRM.\n\nEntreprise : {{lead.company}}\nContact : {{lead.contact_name}}\nEmail : {{lead.email}}\n\nVoir les détails : {{link}}"
  }
}
```

### 3.6 Channel Strategy

**Priority-Based Channel Selection**:

| Priority   | Channels           | Use Case                              |
| ---------- | ------------------ | ------------------------------------- |
| `critical` | SMS + Email + Push | OTP, Security alerts, System failures |
| `high`     | Email + Push       | Lead assignments, Deal won/lost       |
| `standard` | Email              | Status updates, Activity reminders    |
| `low`      | In-App only        | Weekly reports, Suggestions           |

**User Preference Schema**:

```typescript
interface NotificationPreferences {
  userId: string;
  channels: {
    email: boolean;
    sms: boolean;
    push: boolean;
    inApp: boolean;
  };
  quietHours: {
    enabled: boolean;
    start: string; // "22:00"
    end: string; // "08:00"
    timezone: string; // "Europe/Paris"
  };
  categories: {
    crm: boolean;
    fleet: boolean;
    admin: boolean;
    billing: boolean;
    marketing: boolean;
  };
  frequency: {
    digest: "immediate" | "daily" | "weekly";
    maxPerDay: number;
  };
}
```

### 3.7 Rate Limiting Configuration

```typescript
const RATE_LIMITS = {
  email: {
    perUser: {
      perHour: 100,
      perDay: 500,
    },
    global: {
      perMinute: 1000,
    },
  },
  sms: {
    perUser: {
      perHour: 5,
      perDay: 10,
    },
    global: {
      perMinute: 100,
    },
  },
  push: {
    perUser: {
      perHour: 20,
      perDay: 50,
    },
    global: {
      perMinute: 5000,
    },
  },
};

// Anti-spam rules
const ANTI_SPAM = {
  maxNotificationsPerTypePerDay: 5, // Except critical
  minIntervalBetweenSameType: 300, // 5 minutes
  respectQuietHours: true, // Except critical
  deduplicationWindow: 3600, // 1 hour
};
```

### 3.8 Retry Logic

```typescript
const RETRY_CONFIG = {
  maxRetries: 3,
  backoffStrategy: "exponential",
  backoffDelays: [60, 120, 240], // seconds: 1min, 2min, 4min

  retryableErrors: [
    "RATE_LIMIT_EXCEEDED",
    "TEMPORARY_FAILURE",
    "TIMEOUT",
    "SERVICE_UNAVAILABLE",
  ],

  nonRetryableErrors: [
    "INVALID_RECIPIENT",
    "UNSUBSCRIBED",
    "BLOCKED",
    "INVALID_TEMPLATE",
    "PERMISSION_DENIED",
  ],
};

// Dead Letter Queue after all retries exhausted
const DLQ_CONFIG = {
  enabled: true,
  retentionDays: 30,
  alertThreshold: 100, // Alert if > 100 failed in 1 hour
};
```

### 3.9 Implementation Interface

**Service Interface**:

```typescript
interface NotificationService {
  /**
   * Send a notification using a template
   */
  send(params: {
    templateCode: string;
    recipientId: string;
    variables: Record<string, unknown>;
    locale?: string; // Default: user's preferred locale
    channelOverride?: Channel; // Force specific channel
    priority?: Priority; // Override template priority
  }): Promise<NotificationResult>;

  /**
   * Send to multiple recipients
   */
  sendBulk(params: {
    templateCode: string;
    recipients: Array<{
      userId: string;
      variables: Record<string, unknown>;
    }>;
    locale?: string;
  }): Promise<BulkNotificationResult>;

  /**
   * Schedule a notification
   */
  schedule(params: {
    templateCode: string;
    recipientId: string;
    variables: Record<string, unknown>;
    sendAt: Date;
  }): Promise<ScheduledNotification>;

  /**
   * Cancel a scheduled notification
   */
  cancel(notificationId: string): Promise<void>;
}
```

**Usage Example**:

```typescript
// In CRM Lead Service
await notificationService.send({
  templateCode: "crm_lead_assigned_notification",
  recipientId: assignedUser.id,
  variables: {
    "lead.company": lead.companyName,
    "lead.contact_name": lead.contactName,
    "lead.priority": lead.priority,
    link: `${APP_URL}/crm/leads/${lead.id}`,
  },
});

// In Fleet Service - Bulk notification
await notificationService.sendBulk({
  templateCode: "fleet_vehicle_maintenance_due_reminder",
  recipients: vehiclesDueMaintenance.map((v) => ({
    userId: v.assignedManagerId,
    variables: {
      "vehicle.plate": v.plateNumber,
      "vehicle.model": v.model,
      due_date: formatDate(v.maintenanceDueDate),
    },
  })),
});
```

### 3.10 Planned Templates

**CRM Module** (9 templates):
| Code | Channel | Priority |
|------|---------|----------|
| `crm_lead_created_confirmation` | email | standard |
| `crm_lead_assigned_notification` | email, push | high |
| `crm_lead_qualified_alert` | email | standard |
| `crm_opportunity_created_notification` | email | standard |
| `crm_opportunity_stage_changed_alert` | email, push | standard |
| `crm_opportunity_won_celebration` | email, push | high |
| `crm_opportunity_lost_notification` | email | standard |
| `crm_opportunity_rotting_warning` | email, push | high |
| `crm_activity_reminder` | email, push | standard |

**Administration Module** (7 templates):
| Code | Channel | Priority |
|------|---------|----------|
| `admin_invitation_sent_welcome` | email | high |
| `admin_invitation_accepted_notification` | email | standard |
| `admin_invitation_expired_reminder` | email | standard |
| `admin_password_reset_request` | email | critical |
| `admin_two_factor_code` | sms, email | critical |
| `admin_session_suspicious_alert` | email, sms | critical |
| `admin_weekly_report_digest` | email | low |

**Fleet Module** (6 templates - future):
| Code | Channel | Priority |
|------|---------|----------|
| `fleet_vehicle_maintenance_due_reminder` | email, push | high |
| `fleet_document_expiring_alert` | email | high |
| `fleet_driver_document_missing_warning` | email | standard |
| `fleet_trip_completed_summary` | in_app | low |
| `fleet_payment_received_confirmation` | email | standard |
| `fleet_payment_overdue_reminder` | email, sms | high |

### 3.11 Monitoring & Alerts

**Metrics to Track**:

```typescript
const METRICS = {
  deliveryRate: "notifications_delivered / notifications_sent",
  openRate: "emails_opened / emails_delivered",
  clickRate: "links_clicked / emails_opened",
  bounceRate: "emails_bounced / emails_sent",
  unsubscribeRate: "unsubscribes / emails_delivered",
};

const ALERT_THRESHOLDS = {
  bounceRate: { warning: 0.03, critical: 0.05 },
  deliveryRate: { warning: 0.97, critical: 0.95 },
  failedPerHour: { warning: 50, critical: 100 },
};
```

---

## 4. PHASE 1: MEDIUM TERM (After MVP Demo)

### 4.1 File Decomposition (When Time Permits)

**Priority Order**:

1. **`app/[locale]/page.tsx`** (2,084 lines)
   - Extract: HeroSection, FeaturesSection, PricingSection, TestimonialsSection
   - Target: Main file < 200 lines

2. **`components/crm/settings/PipelineSettingsTab.tsx`** (1,287 lines)
   - Extract: DragDropZone, StageForm, PipelineTypeSelector, APIHooks
   - Target: Main file < 400 lines

3. **`lib/services/email/email.service.ts`** (1,183 lines)
   - Extract: TemplateRenderer, DeliveryManager, BounceHandler
   - Target: Main file < 300 lines

4. **`lib/repositories/crm/settings.repository.ts`** (1,050 lines)
   - Extract: PipelineRepo, StageRepo, TagRepo, FieldRepo
   - Target: Each file < 300 lines

5. **`lib/services/drivers/driver.service.ts`** (1,048 lines)
   - Extract: DriverCRUD, DocumentGenerator, OnboardingService
   - Target: Each file < 350 lines

### 4.2 Email Template Consolidation (36 → 12)

**Current State**:

```
emails/templates/
├── en/
│   ├── lead-created.tsx
│   ├── opportunity-won.tsx
│   └── ... (12 files)
├── fr/
│   ├── lead-created.tsx      # DUPLICATE
│   ├── opportunity-won.tsx   # DUPLICATE
│   └── ... (12 files)
└── ar/
    ├── lead-created.tsx      # DUPLICATE
    ├── opportunity-won.tsx   # DUPLICATE
    └── ... (12 files)
```

**Target State**:

```
emails/templates/
├── lead-created.tsx          # Single file, uses i18n
├── opportunity-won.tsx       # Single file, uses i18n
└── ... (12 files total)

locales/
├── en/emails.json
├── fr/emails.json
└── ar/emails.json
```

**Migration Pattern**:

```typescript
// BEFORE: emails/templates/en/lead-created.tsx
export function LeadCreatedEmail({ lead }: Props) {
  return (
    <Html>
      <Text>New lead created: {lead.company}</Text>
      <Text>Contact: {lead.contactName}</Text>
    </Html>
  );
}

// AFTER: emails/templates/lead-created.tsx
export function LeadCreatedEmail({ lead, locale = 'en' }: Props) {
  const t = useEmailTranslation(locale, 'lead_created');
  return (
    <Html>
      <Text>{t('title', { company: lead.company })}</Text>
      <Text>{t('contact', { name: lead.contactName })}</Text>
    </Html>
  );
}
```

---

## 5. PHASE 2: LONG TERM (Post-Funding)

### 5.1 Advanced Notification Features

- [ ] Digest/batching support
- [ ] A/B testing for templates
- [ ] Advanced analytics dashboard
- [ ] WebSocket real-time in-app notifications
- [ ] Mobile push notifications (FCM/APNs)

### 5.2 TMS Integration (When 4+ Languages)

- [ ] Evaluate Crowdin vs Lokalise
- [ ] Set up automated translation workflow
- [ ] Implement translation memory

### 5.3 Buy vs Build Decision Point

**Evaluate when**:

- Notification volume > 100k/month
- Team > 5 developers
- Need for advanced features (A/B testing, AI optimization)

**Options**:
| Solution | Best For | Cost |
|----------|----------|------|
| Knock | Enterprise features | $$$$ |
| Novu | Self-hosted control | $$ (infra) |
| SuprSend | Quick integration | $$$ |
| Keep Internal | Full control | $ (dev time) |

---

## 6. VALIDATION CHECKLIST

### Phase 0 Completion Criteria

```
[ ] ARCHIVE CLEANUP
    [ ] Safety tag created: pre-archive-cleanup-YYYYMMDD
    [ ] _archive/ deleted (verify: ls _archive/ returns "not found")
    [ ] archive_fleetcore_*/ deleted
    [ ] .gitignore updated
    [ ] Repo size reduced (du -sh . < previous)

[ ] CONSOLE.LOG REMOVAL
    [ ] 6 files updated
    [ ] grep "console.log" lib/ returns 0 results (excluding tests)
    [ ] ESLint rule added
    [ ] pnpm lint passes

[ ] ENUM CENTRALIZATION
    [ ] lib/config/crm-enums.ts created
    [ ] All validators import from centralized file
    [ ] No duplicate enum definitions
    [ ] pnpm typecheck passes
    [ ] pnpm test passes

[ ] FINAL VALIDATION
    [ ] pnpm build succeeds
    [ ] All tests pass locally
    [ ] CI pipeline passes
    [ ] No regressions detected
```

---

## 7. APPENDIX

### A. File Size Limits (CI Enforcement)

```bash
#!/bin/bash
# scripts/check-file-size.sh

MAX_LINES=500
VIOLATIONS=0

for file in $(find lib app components -name "*.ts" -o -name "*.tsx" | grep -v node_modules | grep -v ".test." | grep -v ".spec."); do
  lines=$(wc -l < "$file")
  if [ "$lines" -gt "$MAX_LINES" ]; then
    echo "❌ $file: $lines lines (max: $MAX_LINES)"
    VIOLATIONS=$((VIOLATIONS + 1))
  fi
done

if [ "$VIOLATIONS" -gt 0 ]; then
  echo ""
  echo "Found $VIOLATIONS files exceeding $MAX_LINES lines"
  exit 1
fi

echo "✅ All files within size limits"
```

### B. Quick Reference Commands

```bash
# Find large files
find lib app components -name "*.ts" -o -name "*.tsx" | xargs wc -l | sort -rn | head -20

# Find console.log usage
grep -rn "console\.log" lib/ app/ --include="*.ts" --include="*.tsx" | grep -v node_modules

# Find duplicate code patterns
npx jscpd lib/ --min-lines 10 --min-tokens 50

# Check repo size
du -sh . && du -sh node_modules && du -sh .git
```

### C. Related Documentation

- `docs/NOTIFICATION_FRAMEWORK.md` - Detailed notification system design
- `docs/API_REFERENCE.md` - API endpoints documentation
- `docs/DATABASE_SCHEMA.md` - Full database schema reference
- `prisma/schema.prisma` - Prisma schema source of truth

---

**Document End**

_Last Updated: 2025-12-05_
_Next Review: After Phase 0 completion_
