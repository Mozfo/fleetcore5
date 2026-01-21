# CRM Module Documentation Index

> **Module Version:** 1.0
> **Last Updated:** January 2026
> **Status:** Production (Lead & Opportunity Management)

---

## Prerequisites

Before reading CRM module documentation, ensure familiarity with:

1. **[Executive Summary](../../01_OVERVIEW/01_executive_summary.md)** - FleetCore business context and module landscape
2. **[Architecture Principles](../../02_ARCHITECTURE/03_architecture_principles.md)** - Especially:
   - Principle 1: Provider Isolation (CRM data isolation model)
   - Principle 8: Soft Delete Pattern (all CRM entities)
   - Principle 9: Type Safety End-to-End (Zod validators)
3. **[ADR-003: Provider vs Tenant Isolation](../../02_ARCHITECTURE/DECISIONS/ADR-003-provider-tenant-isolation.md)** - Critical for understanding CRM data boundaries

**Key Concepts:**

- **Provider:** FleetCore regional division (UAE, France) - used for CRM isolation
- **Tenant:** Customer organization - created after contract signature (post-CRM)
- **RBAC:** Role-Based Access Control with scope-based permissions

---

## Quick Navigation

| Section                    | Path                         | Description                               |
| -------------------------- | ---------------------------- | ----------------------------------------- |
| **Overview**               | `01_OVERVIEW/`               | Module introduction, process flows, roles |
| **Lead Management**        | `02_LEAD_MANAGEMENT/`        | Lead lifecycle, scoring, assignment       |
| **Opportunity Management** | `03_OPPORTUNITY_MANAGEMENT/` | Pipeline stages, deal rotting, conversion |
| **Configuration**          | `04_CONFIGURATION/`          | CRM settings, thresholds, customization   |
| **Data Model**             | `05_DATA_MODEL/`             | Entity relationships, schema reference    |
| **Technical Reference**    | `06_TECHNICAL/`              | Services, repositories, API endpoints     |
| **Business Rules**         | `07_BUSINESS_RULES/`         | Validation rules, workflow constraints    |

---

## Document Registry

### 01_OVERVIEW

| Document                       | Lines | Description                          |
| ------------------------------ | ----- | ------------------------------------ |
| `01_module_introduction.md`    | ~100  | Module purpose, capabilities, status |
| `02_process_flow_overview.md`  | ~120  | Lead and opportunity lifecycles      |
| `03_user_roles_permissions.md` | ~100  | RBAC model, CRM permissions          |

### 02_LEAD_MANAGEMENT

| Document                   | Lines | Description                                              |
| -------------------------- | ----- | -------------------------------------------------------- |
| `01_lead_lifecycle.md`     | ~150  | States, stages, transitions                              |
| `02_lead_scoring.md`       | ~200  | Fit score, engagement score, qualification               |
| `03_lead_assignment.md`    | ~150  | Assignment algorithm, rules                              |
| `04_lead_qualification.md` | ~120  | Manual qualification, stage promotion                    |
| `05_lead_conversion.md`    | ~100  | Lead to opportunity conversion                           |
| `06_lead_notifications.md` | ~280  | Email notifications, Cal.com webhooks, reschedule tokens |

### 03_OPPORTUNITY_MANAGEMENT

| Document                     | Lines | Description                        |
| ---------------------------- | ----- | ---------------------------------- |
| `01_opportunity_pipeline.md` | ~150  | Stages, probabilities, transitions |
| `02_deal_rotting.md`         | ~120  | Detection, alerts, thresholds      |
| `03_opportunity_closure.md`  | ~100  | Won/Lost workflows, win reasons    |

### 04_CONFIGURATION

| Document                      | Lines | Description                      |
| ----------------------------- | ----- | -------------------------------- |
| `01_crm_settings.md`          | ~150  | JSONB configuration, Zod schemas |
| `02_scoring_configuration.md` | ~120  | Thresholds, weights, tiers       |
| `03_stage_configuration.md`   | ~100  | Pipeline customization           |

### 05_DATA_MODEL

| Document                         | Lines | Description                    |
| -------------------------------- | ----- | ------------------------------ |
| `01_entity_relationships.md`     | ~200  | ERD, foreign keys, cardinality |
| `02_crm_leads_schema.md`         | ~150  | Lead table reference           |
| `03_crm_opportunities_schema.md` | ~120  | Opportunity table reference    |
| `04_supporting_tables.md`        | ~150  | Activities, sources, addresses |

### 06_TECHNICAL

| Document                 | Lines | Description                   |
| ------------------------ | ----- | ----------------------------- |
| `01_service_layer.md`    | ~200  | Service classes, methods      |
| `02_repository_layer.md` | ~150  | Data access patterns          |
| `03_api_endpoints.md`    | ~200  | REST API reference            |
| `04_validators.md`       | ~150  | Zod schemas, validation rules |

### 07_BUSINESS_RULES

| Document                      | Lines | Description                        |
| ----------------------------- | ----- | ---------------------------------- |
| `01_lead_rules.md`            | ~150  | Lead validation, GDPR, duplicates  |
| `02_opportunity_rules.md`     | ~120  | Pipeline constraints, value limits |
| `03_notification_triggers.md` | ~100  | When notifications are sent        |

---

## Reading Order by Persona

### Sales Representative

1. `01_OVERVIEW/01_module_introduction.md` - Understand module capabilities
2. `01_OVERVIEW/02_process_flow_overview.md` - Learn lead/opportunity flow
3. `02_LEAD_MANAGEMENT/01_lead_lifecycle.md` - Understand lead states
4. `03_OPPORTUNITY_MANAGEMENT/01_opportunity_pipeline.md` - Work the pipeline

### Sales Manager

1. All Sales Rep documents, plus:
2. `02_LEAD_MANAGEMENT/02_lead_scoring.md` - Understand qualification
3. `02_LEAD_MANAGEMENT/03_lead_assignment.md` - Manage team assignments
4. `03_OPPORTUNITY_MANAGEMENT/02_deal_rotting.md` - Monitor pipeline health

### CRM Administrator

1. All Sales Manager documents, plus:
2. `04_CONFIGURATION/01_crm_settings.md` - Configure business rules
3. `04_CONFIGURATION/02_scoring_configuration.md` - Tune scoring algorithm
4. `01_OVERVIEW/03_user_roles_permissions.md` - Manage access

### Developer

1. `05_DATA_MODEL/01_entity_relationships.md` - Understand schema
2. `06_TECHNICAL/01_service_layer.md` - Understand architecture
3. `06_TECHNICAL/03_api_endpoints.md` - API integration
4. `07_BUSINESS_RULES/*` - Validation requirements

---

## Related Documentation

- [Architecture Principles](../../02_ARCHITECTURE/03_architecture_principles.md)
- [ADR-003: Provider vs Tenant Isolation](../../02_ARCHITECTURE/DECISIONS/ADR-003-provider-tenant-isolation.md)
- [ADR-006: JSONB Dynamic Configuration](../../02_ARCHITECTURE/DECISIONS/ADR-006-jsonb-configuration.md)
- [ADR-007: Lead Scoring Algorithm](../../02_ARCHITECTURE/DECISIONS/ADR-007-lead-scoring-algorithm.md)

---

_This index is updated with each documentation release. For the latest document list, check the directory structure directly._
