# Fleetcore — Architecture Fonctionnelle (Vue d'ensemble)

_Mise à jour: 2025-10-12_

```mermaid
flowchart LR
  subgraph CRM
    A1[crm_leads] --> A2[crm_opportunities] --> A3[crm_contracts]
  end

  subgraph SaaS_Billing
    B1[bil_billing_plans] --> B2[bil_tenant_subscriptions]
    B2 --> B3[bil_tenant_invoices]
    B2 --> B4[bil_tenant_usage_metrics]
    B5[bil_payment_methods]
  end

  subgraph Administration
    C1[adm_tenants] --> C2[adm_members]
    C2 --> C3[adm_member_roles]
    C1 --> C4[adm_tenant_lifecycle_events]
    C5[adm_audit_logs]
  end

  subgraph Directory
    D1[dir_country_regulations]
    D2[dir_vehicle_classes]
    D3[dir_car_makes] --> D4[dir_car_models]
    D5[dir_platforms]
  end

  subgraph Fleet
    E1[flt_vehicles] --> E2[flt_vehicle_assignments]
    E1 --> E3[flt_vehicle_events]
    E1 --> E4[flt_vehicle_maintenance]
    E1 --> E5[flt_vehicle_expenses]
  end

  subgraph Drivers
    F1[rid_drivers] --> F2[rid_driver_documents]
    F1 --> F3[rid_driver_performances]
    F1 --> F4[rid_driver_blacklists]
    F1 --> F5[rid_driver_training]
    F1 --> F6[rid_driver_cooperation_terms]
  end

  subgraph Trips_Revenue
    G1[trp_platform_accounts] --> G2[trp_trips] --> G3[trp_settlements]
    G2 --> H1[rev_revenue_imports]
    H1 --> H2[rev_driver_revenues]
    H1 --> H3[rev_reconciliations]
  end

  subgraph Finance
    I1[fin_accounts] --> I2[fin_transactions]
    H2 --> I3[fin_driver_payment_batches] --> I4[fin_driver_payments]
    E5 --> I2
  end

  subgraph Support
    J1[sup_tickets] --> J2[sup_ticket_messages]
    J1 -.feedback.-> J3[sup_customer_feedback]
  end

  A3 --> C1
  C1 -->|onboarding| C2
  C1 --> B2
  C1 -.policies.-> D1
  F1 --> G2
  E1 --> G2
  G3 --> I2
  B5 --> B3
  C5 <-.audits.-> all
```

## Patterns d'accès recommandés

- **CQRS léger**: vues matérialisées de reporting pour KPI journaliers, tables OLTP inchangées.
- **Event-sourcing minimal**: `adm_audit_logs`, `adm_tenant_lifecycle_events`, `trp_settlements` servent de journal métier.
- **Intégrations**: `dir_platforms` + `trp_platform_accounts` pour paramétrer les connecteurs (Uber/Bolt/…).

```mermaid
erDiagram
  adm_tenants ||--o{ adm_members : has
  adm_members ||--o{ adm_member_roles : has
  adm_roles ||--o{ adm_member_roles : defines
  adm_tenants ||--o{ adm_tenant_lifecycle_events : logs
  adm_members ||--o{ adm_audit_logs : writes
```

```mermaid
erDiagram
  dir_car_makes ||--o{ dir_car_models : has
  dir_country_regulations ||--o{ dir_vehicle_classes : defines
```

```mermaid
erDiagram
  doc_documents }o--|| adm_tenants : belongs_to
  doc_documents }o..o{ rid_drivers : attaches
  doc_documents }o..o{ flt_vehicles : attaches
```

```mermaid
erDiagram
  flt_vehicles ||--o{ flt_vehicle_assignments : has
  flt_vehicles ||--o{ flt_vehicle_events : logs
  flt_vehicles ||--o{ flt_vehicle_maintenance : maintains
  flt_vehicles ||--o{ flt_vehicle_expenses : costs
```

```mermaid
erDiagram
  rid_drivers ||--o{ rid_driver_documents : has
  rid_drivers ||--o{ rid_driver_performances : tracks
  rid_drivers ||--o{ rid_driver_blacklists : flags
  rid_drivers ||--o{ rid_driver_training : trains
  rid_drivers ||--o{ rid_driver_cooperation_terms : binds
```

```mermaid
erDiagram
  rid_drivers ||--o{ sch_shifts : scheduled
  flt_vehicles ||--o{ sch_maintenance_schedules : scheduled
```

```mermaid
erDiagram
  trp_platform_accounts ||--o{ trp_trips : feeds
  trp_trips ||--o{ trp_settlements : results
  trp_client_invoices ||--o{ trp_trips : bills
```

```mermaid
erDiagram
  fin_accounts ||--o{ fin_transactions : entries
  fin_driver_payment_batches ||--o{ fin_driver_payments : groups
  rid_drivers ||--o{ fin_driver_payments : paid
```

```mermaid
erDiagram
  rev_revenue_imports ||--o{ rev_reconciliations : links
  rev_revenue_imports ||--o{ rev_driver_revenues : aggregates
```

```mermaid
erDiagram
  bil_billing_plans ||--o{ bil_tenant_subscriptions : chosen
  bil_tenant_subscriptions ||--o{ bil_tenant_invoices : bills
  bil_tenant_invoices ||--o{ bil_tenant_invoice_lines : lines
  adm_tenants ||--o{ bil_payment_methods : stores
```

```mermaid
erDiagram
  crm_leads ||--o{ crm_opportunities : tracks
  crm_opportunities ||--o{ crm_contracts : converts
```

```mermaid
erDiagram
  sup_tickets ||--o{ sup_ticket_messages : messages
  adm_tenants ||--o{ sup_customer_feedback : receives
```
