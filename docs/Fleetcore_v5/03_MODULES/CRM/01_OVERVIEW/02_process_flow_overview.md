# CRM Process Flow Overview

> **Module:** Customer Relationship Management
> **Version:** 1.0
> **Last Updated:** December 2025

---

## Lead Lifecycle

Leads progress through two parallel tracking systems: **status** (workflow state) and **stage** (qualification level).

### Lead Status (Workflow State)

```mermaid
stateDiagram-v2
    [*] --> new: Demo Request / Manual Entry
    new --> working: First Contact Made
    working --> qualified: Stage = SQL
    qualified --> converted: Create Opportunity
    working --> lost: Rejected / No Response
    qualified --> lost: Deal Declined
    converted --> [*]: Lifecycle Complete
    lost --> [*]: Lifecycle Complete
```

| Status      | Description                         | Typical Duration |
| ----------- | ----------------------------------- | ---------------- |
| `new`       | Lead created, not yet contacted     | < 24 hours       |
| `working`   | Sales rep actively engaging         | 1-4 weeks        |
| `qualified` | Lead stage is Sales Qualified (SQL) | 1-2 weeks        |
| `converted` | Opportunity created from lead       | Terminal         |
| `lost`      | Lead rejected or unresponsive       | Terminal         |

### Lead Stage (Qualification Level)

Lead stage is determined automatically by the qualification score:

```mermaid
flowchart LR
    TOF[Top of Funnel<br>score < 40]
    MQL[Marketing Qualified<br>40 ≤ score < 70]
    SQL[Sales Qualified<br>score ≥ 70]
    OPP[Opportunity<br>converted]

    TOF -->|Score increases| MQL
    MQL -->|Score increases| SQL
    SQL -->|Convert action| OPP
    MQL -->|Score decreases| TOF
    SQL -->|Score decreases| MQL
```

| Stage                 | Score Range | Meaning                           |
| --------------------- | ----------- | --------------------------------- |
| `top_of_funnel`       | 0-39        | Early interest, needs nurturing   |
| `marketing_qualified` | 40-69       | Shows promise, warrants attention |
| `sales_qualified`     | 70-100      | Ready for active sales engagement |
| `opportunity`         | N/A         | Converted to opportunity record   |

**Key Insight:** Status is manually updated by sales reps. Stage is automatically calculated from scoring but can be manually overridden via qualification action.

---

## Lead Creation Flow

When a demo request arrives or a lead is manually created, the system executes this orchestration:

```mermaid
sequenceDiagram
    participant Client as Website/Admin
    participant API as API Route
    participant Service as LeadCreationService
    participant GDPR as CountryService
    participant Score as LeadScoringService
    participant Assign as LeadAssignmentService
    participant DB as Database
    participant Notify as NotificationService

    Client->>API: POST /api/v1/crm/leads
    API->>Service: createLead(input, providerId)

    Note over Service: STEP 0: GDPR Validation
    Service->>GDPR: isGdprCountry(country_code)
    GDPR-->>Service: true/false
    alt EU/EEA Country
        Service->>Service: Require gdpr_consent + consent_ip
    end

    Note over Service: STEP 1: Generate Lead Code
    Service->>DB: generateLeadCode(year)
    DB-->>Service: "LEAD-2025-042"

    Note over Service: STEP 2: Calculate Scoring
    Service->>Score: calculateLeadScores(data)
    Score-->>Service: {fit: 45, engagement: 80, qualification: 59, stage: "mql"}

    Note over Service: STEP 3: Determine Priority
    Service->>Service: determinePriority(59)
    Note right of Service: medium (40-69)

    Note over Service: STEP 4: Fetch Active Employees
    Service->>DB: findMany(employees)
    DB-->>Service: [emp1, emp2, emp3...]

    Note over Service: STEP 5: Assignment
    Service->>Assign: assignToSalesRep(lead, employees)
    Assign-->>Service: {assigned_to: "uuid", reason: "fleet_size_match"}

    Note over Service: STEP 5.5: Expansion Check
    Service->>GDPR: isOperational(country_code)
    GDPR-->>Service: true/false
    alt Non-Operational Country
        Service->>Service: Mark expansion_opportunity = true
    end

    Note over Service: STEP 6: Create Lead
    Service->>DB: INSERT crm_leads
    DB-->>Service: lead record

    Note over Service: STEP 7: Notify
    Service->>Notify: queueNotification("sales_rep_assignment")

    Service-->>API: LeadCreationResult
    API-->>Client: 201 Created
```

**Source:** `lib/services/crm/lead-creation.service.ts`

---

## Opportunity Pipeline

When a Sales Qualified Lead converts, it enters the opportunity pipeline:

```mermaid
flowchart LR
    subgraph Pipeline["Opportunity Pipeline"]
        Q[Qualification<br>20% probability<br>14 days max]
        D[Demo<br>40% probability<br>10 days max]
        P[Proposal<br>60% probability<br>14 days max]
        N[Negotiation<br>80% probability<br>10 days max]
        C[Contract Sent<br>90% probability<br>7 days max]
    end

    Q --> D --> P --> N --> C

    C -->|Signed| WON((Won))
    C -->|Rejected| LOST((Lost))

    Q & D & P & N -->|Stalled| LOST
```

### Stage Details

| Stage           | Default Probability | Max Days | Color  | Next Action       |
| --------------- | ------------------- | -------- | ------ | ----------------- |
| `qualification` | 20%                 | 14       | Blue   | Schedule demo     |
| `demo`          | 40%                 | 10       | Purple | Send proposal     |
| `proposal`      | 60%                 | 14       | Yellow | Begin negotiation |
| `negotiation`   | 80%                 | 10       | Orange | Send contract     |
| `contract_sent` | 90%                 | 7        | Green  | Await signature   |

**Source:** `lib/config/opportunity-stages.ts`

### Stage Transitions

Stage transitions are controlled but flexible:

```typescript
// Valid transitions: forward or backward by 1 step, or same
isValidStageTransition("qualification", "demo"); // true (forward)
isValidStageTransition("demo", "qualification"); // true (backward)
isValidStageTransition("qualification", "proposal"); // false (skip)
```

---

## Deal Rotting Detection

Opportunities that exceed their max days in stage are flagged as "rotting":

```mermaid
flowchart TD
    CRON[Daily CRON Job<br>8:00 AM] --> CHECK{Check all<br>open opportunities}

    CHECK --> CALC[Calculate days_in_stage]
    CALC --> COMPARE{days > max_days?}

    COMPARE -->|Yes| ROTTING[Mark as Rotting]
    COMPARE -->|No| HEALTHY[Healthy]

    ROTTING --> NOTIFY{Notifications<br>enabled?}
    NOTIFY -->|Yes| ALERT[Queue Alert Email]
    NOTIFY -->|No| LOG[Log Only]

    ALERT --> OWNER[Notify Assigned Owner]
```

**Rotting Calculation:**

```typescript
const daysInStage = daysSince(opportunity.stage_entered_at);
const maxDays = opportunity.max_days_in_stage ?? stageConfig.maxDays;
const isRotting = daysInStage > maxDays;
```

**Source:** `lib/services/crm/opportunity-rotting.service.ts`

---

## Lead to Opportunity Conversion

The conversion from SQL lead to opportunity is a transactional operation:

```mermaid
sequenceDiagram
    participant UI as Sales UI
    participant Action as convertLeadToOpportunityAction
    participant DB as Database
    participant Audit as Audit Log

    UI->>Action: Convert lead (leadId, data)

    Note over Action: Verify lead.stage = "sales_qualified"

    Action->>DB: BEGIN TRANSACTION

    Action->>DB: CREATE crm_opportunities
    Note right of DB: stage = "qualification"<br>probability = 20%<br>max_days = 14

    Action->>DB: UPDATE crm_leads
    Note right of DB: stage = "opportunity"<br>status = "qualified"<br>opportunity_id = new_id

    Action->>DB: COMMIT

    Action->>Audit: Log conversion event

    Action-->>UI: {success, lead, opportunity}
```

**Business Rules:**

- Only `sales_qualified` leads can convert
- Conversion creates opportunity with `qualification` stage
- Lead status auto-syncs to `qualified`
- Original lead data preserved in opportunity metadata

**Source:** `lib/actions/crm/convert.actions.ts`

---

## Quote-to-Cash Flow (Preview)

The complete Quote-to-Cash workflow is currently under development:

```mermaid
flowchart LR
    OPP[Opportunity<br>Won] --> QUOTE[Quote<br>Generation]
    QUOTE --> ORDER[Order<br>Confirmation]
    ORDER --> AGREE[Agreement<br>Signature]
    AGREE --> TENANT[Tenant<br>Provisioning]

    style QUOTE stroke-dasharray: 5 5
    style ORDER stroke-dasharray: 5 5
    style AGREE stroke-dasharray: 5 5
```

**Status:** Database schema implemented. Business workflow documentation pending stabilization.

---

## Key Metrics

| Metric                   | Definition                           | Target   | Tracking                |
| ------------------------ | ------------------------------------ | -------- | ----------------------- |
| **Lead Conversion Rate** | % leads converted to opportunities   | >15%     | Pipeline analytics      |
| **Lead Response Time**   | Hours from creation to first contact | <24h     | SLA enforced via status |
| **Sales Cycle Length**   | Days from lead to won opportunity    | <45 days | Stage timestamps        |
| **Win Rate**             | % opportunities closed as won        | >25%     | Pipeline analytics      |
| **Pipeline Velocity**    | Value × Win Rate / Cycle Time        | Growing  | Forecast model          |
| **Rotting Rate**         | % opportunities exceeding max_days   | <10%     | Daily CRON detection    |

**Note:** Actual metrics are tracked via CRM analytics. Targets are configurable per provider in `crm_settings` table.

### Metric Calculation Points

```
Lead Conversion Rate = (Leads with status='converted') / (Total Leads) × 100
Lead Response Time = (status_updated_at where status='working') - created_at
Sales Cycle Length = (opportunity.closed_at) - (lead.created_at)
Win Rate = (Opportunities with status='won') / (Total Closed Opportunities) × 100
Pipeline Velocity = (Σ expected_value × probability_percent) / avg_cycle_length
```

---

## Responsibility Swimlane

The CRM workflow involves three actor types with distinct responsibilities:

```mermaid
flowchart TB
    subgraph System["🤖 System (Automated)"]
        S1[Calculate Scores]
        S2[Assign Lead]
        S3[Detect Rotting]
        S4[Send Notifications]
        S5[Generate Lead Code]
    end

    subgraph SalesRep["👤 Sales Rep (Manual)"]
        R1[Contact Lead]
        R2[Update Status]
        R3[Qualify Lead]
        R4[Convert to Opportunity]
        R5[Progress Pipeline Stage]
        R6[Close Won/Lost]
    end

    subgraph Manager["👔 Manager (Oversight)"]
        M1[Reassign Leads]
        M2[Review Rotting Alerts]
        M3[Approve Discounts]
        M4[Override Stage]
    end

    S5 --> S1
    S1 --> S2
    S2 --> S4
    S4 --> R1
    R1 --> R2
    R2 --> S1
    R3 --> R4
    R4 --> R5
    R5 --> S3
    S3 --> M2
    M2 --> M1
    R6 --> S4
```

### Responsibility Matrix

| Actor         | Responsibilities                                                                                                       |
| ------------- | ---------------------------------------------------------------------------------------------------------------------- |
| **System**    | Lead code generation, score calculation, automatic assignment, rotting detection, notification dispatch, audit logging |
| **Sales Rep** | First contact, status updates, lead qualification, opportunity conversion, pipeline progression, deal closure          |
| **Manager**   | Lead reassignment, rotting resolution, discount approval, stage overrides, team performance review                     |

### Automation vs Manual Decisions

| Action               | Automated                       | Manual Override                |
| -------------------- | ------------------------------- | ------------------------------ |
| Lead scoring         | ✅ On creation & recalculation  | ✅ Manual qualification action |
| Lead assignment      | ✅ Based on rules               | ✅ Manager reassignment        |
| Stage determination  | ✅ Based on score thresholds    | ✅ Manual stage change         |
| Priority setting     | ✅ Based on qualification score | ✅ Manual priority adjustment  |
| Rotting detection    | ✅ Daily CRON                   | N/A                            |
| Notifications        | ✅ Event-triggered              | N/A                            |
| Status transitions   | ❌                              | ✅ Sales rep updates           |
| Pipeline progression | ❌                              | ✅ Sales rep advances          |
| Won/Lost decision    | ❌                              | ✅ Sales rep closes            |

---

## Notification Triggers

| Event                     | Template                    | Recipient             |
| ------------------------- | --------------------------- | --------------------- |
| Lead assigned             | `sales_rep_assignment`      | Assigned sales rep    |
| Lead stage upgrade to SQL | `lead_stage_upgrade`        | Assigned sales rep    |
| Opportunity rotting       | `opportunity_rotting_alert` | Opportunity owner     |
| Lead confirmation         | `lead_confirmation`         | Lead (external email) |

**Source:** `lib/services/notification/queue.service.ts`

---

_Next: [User Roles and Permissions](./03_user_roles_permissions.md)_
