# GDPR Consent Management Rules

**Document Version:** 1.0
**Last Updated:** 2025-11-23
**Author:** FleetCore Development Team
**Status:** Production

---

## Table of Contents

1. [Overview](#overview)
2. [GDPR Countries](#gdpr-countries)
3. [When to Show GDPR Consent Checkbox](#when-to-show-gdpr-consent-checkbox)
4. [When NOT to Show GDPR Consent Checkbox](#when-not-to-show-gdpr-consent-checkbox)
5. [Implementation Components](#implementation-components)
6. [Database Schema](#database-schema)
7. [API Integration](#api-integration)
8. [Testing Requirements](#testing-requirements)
9. [Compliance Checklist](#compliance-checklist)

---

## Overview

FleetCore implements GDPR (General Data Protection Regulation) compliance for EU/EEA countries through a conditional consent mechanism. This document defines the business rules for when and how to collect GDPR consent.

**Key Principle:** GDPR consent is required ONLY when FleetCore acts as the **data controller** (marketing/pre-sales forms). It is NOT required when FleetCore acts as a **data processor** (operational forms for existing clients).

---

## GDPR Countries

### EU Member States (27 countries)

Austria (AT), Belgium (BE), Bulgaria (BG), Croatia (HR), Cyprus (CY), Czech Republic (CZ), Denmark (DK), Estonia (EE), Finland (FI), France (FR), Germany (DE), Greece (GR), Hungary (HU), Ireland (IE), Italy (IT), Latvia (LV), Lithuania (LT), Luxembourg (LU), Malta (MT), Netherlands (NL), Poland (PL), Portugal (PT), Romania (RO), Slovakia (SK), Slovenia (SI), Spain (ES), Sweden (SE)

### EEA Member States (3 countries)

Iceland (IS), Liechtenstein (LI), Norway (NO)

### Database Flag

Each country in `crm_countries` table has a `country_gdpr` boolean flag:

- `TRUE` → EU/EEA country (30 countries total)
- `FALSE` → Non-GDPR country (all others)

---

## When to Show GDPR Consent Checkbox

**Rule:** Show GDPR checkbox when **ALL** of the following conditions are met:

1. **Country selected** = EU/EEA country (`country_gdpr = TRUE`)
2. **FleetCore role** = Data Controller (we decide what data to collect and why)
3. **Form purpose** = Marketing, lead generation, or pre-sales communication

### ✅ Forms That REQUIRE GDPR Consent

| Form Name            | Route                                   | Purpose                         | FleetCore Role  |
| -------------------- | --------------------------------------- | ------------------------------- | --------------- |
| **Request Demo**     | `/[locale]/request-demo`                | Lead capture form for prospects | Data Controller |
| Newsletter Signup    | `/[locale]/newsletter` (future)         | Marketing emails to prospects   | Data Controller |
| Contact Us           | `/[locale]/contact` (future)            | Pre-sales inquiries             | Data Controller |
| Download Whitepaper  | `/[locale]/resources/download` (future) | Marketing content gate          | Data Controller |
| Webinar Registration | `/[locale]/events/register` (future)    | Event marketing                 | Data Controller |
| Free Trial Signup    | `/[locale]/trial` (future)              | Product trial registration      | Data Controller |
| Partnership Inquiry  | `/[locale]/partners/apply` (future)     | Partner lead generation         | Data Controller |
| Career Applications  | `/[locale]/careers/apply` (future)      | Recruitment data collection     | Data Controller |

**Total Forms (Sprint 1-5):** 8 marketing forms requiring GDPR consent

---

## When NOT to Show GDPR Consent Checkbox

**Rule:** Do NOT show GDPR checkbox when **ANY** of the following conditions are met:

1. **Country selected** = Non-GDPR country (`country_gdpr = FALSE`)
2. **FleetCore role** = Data Processor (client instructs us what data to store)
3. **Form purpose** = Operational, transactional, or user-managed

### ❌ Forms That DO NOT Require GDPR Consent

| Form Name              | Route                             | Purpose                                     | Reason                               |
| ---------------------- | --------------------------------- | ------------------------------------------- | ------------------------------------ |
| Driver Onboarding      | `/dashboard/drivers/new`          | Client adds driver to their fleet           | Data Processor (client = controller) |
| Vehicle Registration   | `/dashboard/vehicles/new`         | Client adds vehicle to their fleet          | Data Processor (client = controller) |
| Maintenance Scheduling | `/dashboard/maintenance/schedule` | Client schedules service                    | Data Processor (client = controller) |
| Expense Entry          | `/dashboard/expenses/new`         | Client tracks fleet expenses                | Data Processor (client = controller) |
| Invoice Generation     | `/dashboard/invoices/create`      | Billing operations                          | Data Processor (client = controller) |
| User Profile Update    | `/dashboard/settings/profile`     | User manages own data (legitimate interest) | User-initiated update                |
| Password Reset         | `/auth/reset-password`            | Security operation (contractual necessity)  | Security requirement                 |
| Support Ticket         | `/dashboard/support/ticket`       | Customer support (contractual necessity)    | Existing customer                    |

**Total Operational Forms (Sprint 1-5):** 15+ forms NOT requiring GDPR consent

---

## Implementation Components

### 1. GdprConsentField Component

**Location:** `components/forms/GdprConsentField.tsx`

**Purpose:** Reusable conditional GDPR consent checkbox

**Usage:**

```tsx
import { GdprConsentField } from "@/components/forms/GdprConsentField";

<GdprConsentField
  countries={countries}
  selectedCountryCode={formData.country}
  value={formData.gdprConsent}
  onChange={(consented) => setFormData({ ...formData, gdprConsent: consented })}
  locale={i18n.language}
/>;
```

**Behavior:**

- Automatically hides if `selectedCountryCode` is NOT a GDPR country
- Shows blue info box with explanation if GDPR country selected
- Displays checkbox with link to privacy policy
- Shows red validation message if required but not checked

---

### 2. useGdprValidation Hook

**Location:** `hooks/useGdprValidation.ts`

**Purpose:** Centralized GDPR validation logic

**Usage:**

```tsx
import { useGdprValidation } from "@/hooks/useGdprValidation";

const { requiresGdpr, isValid, errorMessage } = useGdprValidation(
  countries,
  formData.country,
  formData.gdprConsent
);

<button type="submit" disabled={isSubmitting || !isValid}>
  Submit
</button>;
```

**Returns:**

- `requiresGdpr` → Boolean (true if EU/EEA country selected)
- `isValid` → Boolean (true if consent given OR not required)
- `errorMessage` → String | null (validation error if invalid)

---

### 3. captureConsentIp Middleware

**Location:** `lib/middleware/gdpr.middleware.ts`

**Purpose:** Server-side IP address capture for audit trail

**Usage:**

```tsx
import { captureConsentIp } from "@/lib/middleware/gdpr.middleware";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const consent_ip = captureConsentIp(req);

  // Use in LeadCreationService
  const result = await leadService.createLead({
    ...data,
    gdpr_consent: body.gdpr_consent,
    consent_ip: body.gdpr_consent ? consent_ip : null,
  });
}
```

**Behavior:**

- Extracts IP from `x-forwarded-for` (Vercel/proxy) or `x-real-ip` headers
- Returns first IP in chain (actual client, not proxy)
- Logs warning if IP = "unknown" (compliance concern)
- Supports both IPv4 and IPv6

---

## Database Schema

### crm_countries Table

```sql
country_code       VARCHAR(2) PRIMARY KEY,
country_gdpr       BOOLEAN NOT NULL DEFAULT FALSE,  -- EU/EEA flag
```

**30 countries** with `country_gdpr = TRUE` (27 EU + 3 EEA)

---

### crm_leads Table

```sql
gdpr_consent       BOOLEAN DEFAULT NULL,             -- User consent value
consent_at         TIMESTAMPTZ DEFAULT NULL,         -- When consent was given
consent_ip         VARCHAR(45) DEFAULT NULL,         -- IP address for audit trail
```

**Storage Rules:**

- `gdpr_consent = NULL` → Non-GDPR country (UAE, Qatar, Saudi Arabia, etc.)
- `gdpr_consent = TRUE` → EU/EEA country + user consented
- `gdpr_consent = FALSE` → EU/EEA country + user declined (CANNOT store lead)
- `consent_at` → Automatically set to NOW() by LeadCreationService when consent = TRUE
- `consent_ip` → Captured from request headers (x-forwarded-for or x-real-ip)

---

## API Integration

### Backend Validation (LeadCreationService)

**Location:** `lib/services/crm/lead-creation.service.ts:155-175`

**STEP 0 - GDPR Validation (before any processing):**

```typescript
if (input.country_code) {
  const isGdprCountry = await this.countryService.isGdprCountry(
    input.country_code
  );

  if (isGdprCountry) {
    // EU/EEA country → GDPR consent required
    if (!input.gdpr_consent) {
      throw new ValidationError(
        `GDPR consent required for EU/EEA countries (country: ${input.country_code})`
      );
    }

    if (!input.consent_ip) {
      throw new ValidationError(
        "Consent IP address required for GDPR compliance"
      );
    }
  }
}
```

**Result:**

- ✅ GDPR country + consent + IP → Lead created
- ❌ GDPR country + no consent → `400 Bad Request` with error code `GDPR_CONSENT_REQUIRED`
- ✅ Non-GDPR country → Lead created without consent fields

---

### API Route Implementation

**Location:** `app/api/demo-leads/route.ts`

**Refactored to use LeadCreationService:**

```typescript
import { captureConsentIp } from "@/lib/middleware/gdpr.middleware";
import { LeadCreationService } from "@/lib/services/crm/lead-creation.service";

export async function POST(req: NextRequest) {
  // STEP 0: Capture IP BEFORE any processing
  const consent_ip = captureConsentIp(req);

  // Use LeadCreationService (includes GDPR validation)
  const leadCreationService = new LeadCreationService();

  const leadResult = await leadCreationService.createLead(
    {
      email: body.email,
      // ... other fields
      gdpr_consent: body.gdpr_consent || null,
      consent_ip: body.gdpr_consent ? consent_ip : null,
    },
    SYSTEM_TENANT_ID
  );
}
```

---

## Testing Requirements

### Unit Tests (9 tests)

#### GdprConsentField.test.tsx (3 tests)

1. ✅ Hides checkbox for non-GDPR country (UAE)
2. ✅ Shows checkbox for GDPR country (France)
3. ✅ Shows validation error if consent required but not given

#### useGdprValidation.test.ts (3 tests)

1. ✅ Returns `requiresGdpr: false` for non-GDPR country
2. ✅ Returns `isValid: false` for GDPR country without consent
3. ✅ Returns `isValid: true` for GDPR country with consent

#### gdpr.middleware.test.ts (3 tests)

1. ✅ Extracts IP from `x-forwarded-for` header
2. ✅ Falls back to `x-real-ip` if `x-forwarded-for` missing
3. ✅ Returns "unknown" and logs warning if no headers

---

### E2E Manual Tests (5 scenarios)

#### Test 1: France (GDPR) → Checkbox Visible

1. Navigate to `/fr/request-demo`
2. Select country: **France**
3. ✅ Verify: Blue GDPR consent box appears
4. ✅ Verify: Submit button disabled until checkbox checked

#### Test 2: UAE (Non-GDPR) → Checkbox Hidden

1. Navigate to `/en/request-demo`
2. Select country: **UAE**
3. ✅ Verify: No GDPR consent box visible
4. ✅ Verify: Submit button enabled immediately

#### Test 3: France + Submit Without Consent → Button Disabled

1. Navigate to `/fr/request-demo`
2. Select country: **France**
3. Fill all fields EXCEPT GDPR checkbox
4. ✅ Verify: Submit button remains disabled
5. ✅ Verify: Red validation message: "Vous devez accepter..."

#### Test 4: France + Consent → Lead Created with IP

1. Navigate to `/fr/request-demo`
2. Select country: **France**
3. Fill all fields + check GDPR checkbox
4. Submit form
5. ✅ Verify: Lead created in database
6. ✅ Verify: `gdpr_consent = TRUE`
7. ✅ Verify: `consent_ip` NOT NULL (e.g., "92.184.105.123")
8. ✅ Verify: `consent_at` = NOW()

#### Test 5: Backend Rejection Test (API Direct Call)

1. Use Postman/curl to POST `/api/demo-leads`
2. Body: `{ country_code: "FR", gdpr_consent: false }`
3. ✅ Verify: `400 Bad Request`
4. ✅ Verify: Error code: `GDPR_CONSENT_REQUIRED`
5. ✅ Verify: No lead created in database

---

## Compliance Checklist

### ✅ Required Elements (GDPR Article 7)

- [x] **Clear language:** "I consent to the processing of my personal data"
- [x] **Separate from T&C:** GDPR checkbox separate from "Terms and Conditions" checkbox
- [x] **Freely given:** User can decline (form won't submit, but no coercion)
- [x] **Specific purpose:** Link to Privacy Policy explaining data usage
- [x] **Proof of consent:** Timestamp (`consent_at`) and IP (`consent_ip`) stored
- [x] **Easy withdrawal:** User can email support@fleetcore.io to withdraw consent

### ✅ Technical Implementation

- [x] **Conditional display:** Checkbox only shown for EU/EEA countries
- [x] **Backend validation:** LeadCreationService blocks non-consented EU leads
- [x] **Audit trail:** IP + timestamp captured and stored
- [x] **Data minimization:** IP only stored if consent given
- [x] **Error handling:** Clear error messages for missing consent

### ✅ Future Forms (12+ forms)

- [x] **Reusable components:** GdprConsentField + useGdprValidation ready
- [x] **Consistent UX:** Same checkbox design across all marketing forms
- [x] **Centralized logic:** One source of truth (this document)
- [x] **Documentation:** Business rules clearly defined

---

## Change Log

| Version | Date       | Author      | Changes                                   |
| ------- | ---------- | ----------- | ----------------------------------------- |
| 1.0     | 2025-11-23 | Claude Code | Initial creation - Sprint 1.1 Session #27 |

---

## References

- **GDPR Official Text:** [EUR-Lex 32016R0679](https://eur-lex.europa.eu/eli/reg/2016/679/oj)
- **Article 7:** Conditions for consent
- **Article 13:** Information to be provided where personal data are collected from the data subject
- **Recital 32:** Conditions for consent (freely given, specific, informed, unambiguous)
- **FleetCore Privacy Policy:** `/privacy-policy` (to be created)

---

**END OF DOCUMENT**
