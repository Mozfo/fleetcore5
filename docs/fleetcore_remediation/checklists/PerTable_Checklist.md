# 6) Checklist de validation par table

_Mise à jour: 2025-10-12_

## Administration domain

### adm_tenants

- [ ] Nommage conforme
- [ ] Champs d'audit complets (created_at/by, updated_at/by, deleted_at/by, deletion_reason)
- [ ] FK correctes (ON DELETE)
- [ ] Indexes (btree/partial, GIN jsonb si utile)
- [ ] Policies RLS présentes & testées
- [ ] Triggers `updated_at` actifs
- [ ] Données de test prêtes

### adm_members

- [ ] Nommage conforme
- [ ] Champs d'audit complets (created_at/by, updated_at/by, deleted_at/by, deletion_reason)
- [ ] FK correctes (ON DELETE)
- [ ] Indexes (btree/partial, GIN jsonb si utile)
- [ ] Policies RLS présentes & testées
- [ ] Triggers `updated_at` actifs
- [ ] Données de test prêtes

### adm_roles

- [ ] Nommage conforme
- [ ] Champs d'audit complets (created_at/by, updated_at/by, deleted_at/by, deletion_reason)
- [ ] FK correctes (ON DELETE)
- [ ] Indexes (btree/partial, GIN jsonb si utile)
- [ ] Policies RLS présentes & testées
- [ ] Triggers `updated_at` actifs
- [ ] Données de test prêtes

### adm_member_roles

- [ ] Nommage conforme
- [ ] Champs d'audit complets (created_at/by, updated_at/by, deleted_at/by, deletion_reason)
- [ ] FK correctes (ON DELETE)
- [ ] Indexes (btree/partial, GIN jsonb si utile)
- [ ] Policies RLS présentes & testées
- [ ] Triggers `updated_at` actifs
- [ ] Données de test prêtes

### adm_audit_logs

- [ ] Nommage conforme
- [ ] Champs d'audit complets (created_at/by, updated_at/by, deleted_at/by, deletion_reason)
- [ ] FK correctes (ON DELETE)
- [ ] Indexes (btree/partial, GIN jsonb si utile)
- [ ] Policies RLS présentes & testées
- [ ] Triggers `updated_at` actifs
- [ ] Données de test prêtes

### adm_provider_employees

- [ ] Nommage conforme
- [ ] Champs d'audit complets (created_at/by, updated_at/by, deleted_at/by, deletion_reason)
- [ ] FK correctes (ON DELETE)
- [ ] Indexes (btree/partial, GIN jsonb si utile)
- [ ] Policies RLS présentes & testées
- [ ] Triggers `updated_at` actifs
- [ ] Données de test prêtes

### adm_tenant_lifecycle_events

- [ ] Nommage conforme
- [ ] Champs d'audit complets (created_at/by, updated_at/by, deleted_at/by, deletion_reason)
- [ ] FK correctes (ON DELETE)
- [ ] Indexes (btree/partial, GIN jsonb si utile)
- [ ] Policies RLS présentes & testées
- [ ] Triggers `updated_at` actifs
- [ ] Données de test prêtes

### adm_invitations

- [ ] Nommage conforme
- [ ] Champs d'audit complets (created_at/by, updated_at/by, deleted_at/by, deletion_reason)
- [ ] FK correctes (ON DELETE)
- [ ] Indexes (btree/partial, GIN jsonb si utile)
- [ ] Policies RLS présentes & testées
- [ ] Triggers `updated_at` actifs
- [ ] Données de test prêtes

## Directory domain

### dir_car_makes

- [ ] Nommage conforme
- [ ] Champs d'audit complets (created_at/by, updated_at/by, deleted_at/by, deletion_reason)
- [ ] FK correctes (ON DELETE)
- [ ] Indexes (btree/partial, GIN jsonb si utile)
- [ ] Policies RLS présentes & testées
- [ ] Triggers `updated_at` actifs
- [ ] Données de test prêtes

### dir_car_models

- [ ] Nommage conforme
- [ ] Champs d'audit complets (created_at/by, updated_at/by, deleted_at/by, deletion_reason)
- [ ] FK correctes (ON DELETE)
- [ ] Indexes (btree/partial, GIN jsonb si utile)
- [ ] Policies RLS présentes & testées
- [ ] Triggers `updated_at` actifs
- [ ] Données de test prêtes

### dir_platforms

- [ ] Nommage conforme
- [ ] Champs d'audit complets (created_at/by, updated_at/by, deleted_at/by, deletion_reason)
- [ ] FK correctes (ON DELETE)
- [ ] Indexes (btree/partial, GIN jsonb si utile)
- [ ] Policies RLS présentes & testées
- [ ] Triggers `updated_at` actifs
- [ ] Données de test prêtes

### dir_country_regulations

- [ ] Nommage conforme
- [ ] Champs d'audit complets (created_at/by, updated_at/by, deleted_at/by, deletion_reason)
- [ ] FK correctes (ON DELETE)
- [ ] Indexes (btree/partial, GIN jsonb si utile)
- [ ] Policies RLS présentes & testées
- [ ] Triggers `updated_at` actifs
- [ ] Données de test prêtes

### dir_vehicle_classes

- [ ] Nommage conforme
- [ ] Champs d'audit complets (created_at/by, updated_at/by, deleted_at/by, deletion_reason)
- [ ] FK correctes (ON DELETE)
- [ ] Indexes (btree/partial, GIN jsonb si utile)
- [ ] Policies RLS présentes & testées
- [ ] Triggers `updated_at` actifs
- [ ] Données de test prêtes

## Document domain

### doc_documents

- [ ] Nommage conforme
- [ ] Champs d'audit complets (created_at/by, updated_at/by, deleted_at/by, deletion_reason)
- [ ] FK correctes (ON DELETE)
- [ ] Indexes (btree/partial, GIN jsonb si utile)
- [ ] Policies RLS présentes & testées
- [ ] Triggers `updated_at` actifs
- [ ] Données de test prêtes

## Fleet domain

### flt_vehicles

- [ ] Nommage conforme
- [ ] Champs d'audit complets (created_at/by, updated_at/by, deleted_at/by, deletion_reason)
- [ ] FK correctes (ON DELETE)
- [ ] Indexes (btree/partial, GIN jsonb si utile)
- [ ] Policies RLS présentes & testées
- [ ] Triggers `updated_at` actifs
- [ ] Données de test prêtes

### flt_vehicle_assignments

- [ ] Nommage conforme
- [ ] Champs d'audit complets (created_at/by, updated_at/by, deleted_at/by, deletion_reason)
- [ ] FK correctes (ON DELETE)
- [ ] Indexes (btree/partial, GIN jsonb si utile)
- [ ] Policies RLS présentes & testées
- [ ] Triggers `updated_at` actifs
- [ ] Données de test prêtes

### flt_vehicle_events

- [ ] Nommage conforme
- [ ] Champs d'audit complets (created_at/by, updated_at/by, deleted_at/by, deletion_reason)
- [ ] FK correctes (ON DELETE)
- [ ] Indexes (btree/partial, GIN jsonb si utile)
- [ ] Policies RLS présentes & testées
- [ ] Triggers `updated_at` actifs
- [ ] Données de test prêtes

### flt_vehicle_maintenance

- [ ] Nommage conforme
- [ ] Champs d'audit complets (created_at/by, updated_at/by, deleted_at/by, deletion_reason)
- [ ] FK correctes (ON DELETE)
- [ ] Indexes (btree/partial, GIN jsonb si utile)
- [ ] Policies RLS présentes & testées
- [ ] Triggers `updated_at` actifs
- [ ] Données de test prêtes

### flt_vehicle_expenses

- [ ] Nommage conforme
- [ ] Champs d'audit complets (created_at/by, updated_at/by, deleted_at/by, deletion_reason)
- [ ] FK correctes (ON DELETE)
- [ ] Indexes (btree/partial, GIN jsonb si utile)
- [ ] Policies RLS présentes & testées
- [ ] Triggers `updated_at` actifs
- [ ] Données de test prêtes

### flt_vehicle_insurances

- [ ] Nommage conforme
- [ ] Champs d'audit complets (created_at/by, updated_at/by, deleted_at/by, deletion_reason)
- [ ] FK correctes (ON DELETE)
- [ ] Indexes (btree/partial, GIN jsonb si utile)
- [ ] Policies RLS présentes & testées
- [ ] Triggers `updated_at` actifs
- [ ] Données de test prêtes

## Drivers domain

### rid_drivers

- [ ] Nommage conforme
- [ ] Champs d'audit complets (created_at/by, updated_at/by, deleted_at/by, deletion_reason)
- [ ] FK correctes (ON DELETE)
- [ ] Indexes (btree/partial, GIN jsonb si utile)
- [ ] Policies RLS présentes & testées
- [ ] Triggers `updated_at` actifs
- [ ] Données de test prêtes

### rid_driver_documents

- [ ] Nommage conforme
- [ ] Champs d'audit complets (created_at/by, updated_at/by, deleted_at/by, deletion_reason)
- [ ] FK correctes (ON DELETE)
- [ ] Indexes (btree/partial, GIN jsonb si utile)
- [ ] Policies RLS présentes & testées
- [ ] Triggers `updated_at` actifs
- [ ] Données de test prêtes

### rid_driver_cooperation_terms

- [ ] Nommage conforme
- [ ] Champs d'audit complets (created_at/by, updated_at/by, deleted_at/by, deletion_reason)
- [ ] FK correctes (ON DELETE)
- [ ] Indexes (btree/partial, GIN jsonb si utile)
- [ ] Policies RLS présentes & testées
- [ ] Triggers `updated_at` actifs
- [ ] Données de test prêtes

### rid_driver_requests

- [ ] Nommage conforme
- [ ] Champs d'audit complets (created_at/by, updated_at/by, deleted_at/by, deletion_reason)
- [ ] FK correctes (ON DELETE)
- [ ] Indexes (btree/partial, GIN jsonb si utile)
- [ ] Policies RLS présentes & testées
- [ ] Triggers `updated_at` actifs
- [ ] Données de test prêtes

### rid_driver_performances

- [ ] Nommage conforme
- [ ] Champs d'audit complets (created_at/by, updated_at/by, deleted_at/by, deletion_reason)
- [ ] FK correctes (ON DELETE)
- [ ] Indexes (btree/partial, GIN jsonb si utile)
- [ ] Policies RLS présentes & testées
- [ ] Triggers `updated_at` actifs
- [ ] Données de test prêtes

### rid_driver_blacklists

- [ ] Nommage conforme
- [ ] Champs d'audit complets (created_at/by, updated_at/by, deleted_at/by, deletion_reason)
- [ ] FK correctes (ON DELETE)
- [ ] Indexes (btree/partial, GIN jsonb si utile)
- [ ] Policies RLS présentes & testées
- [ ] Triggers `updated_at` actifs
- [ ] Données de test prêtes

### rid_driver_training

- [ ] Nommage conforme
- [ ] Champs d'audit complets (created_at/by, updated_at/by, deleted_at/by, deletion_reason)
- [ ] FK correctes (ON DELETE)
- [ ] Indexes (btree/partial, GIN jsonb si utile)
- [ ] Policies RLS présentes & testées
- [ ] Triggers `updated_at` actifs
- [ ] Données de test prêtes

## Scheduling domain

### sch_shifts

- [ ] Nommage conforme
- [ ] Champs d'audit complets (created_at/by, updated_at/by, deleted_at/by, deletion_reason)
- [ ] FK correctes (ON DELETE)
- [ ] Indexes (btree/partial, GIN jsonb si utile)
- [ ] Policies RLS présentes & testées
- [ ] Triggers `updated_at` actifs
- [ ] Données de test prêtes

### sch_maintenance_schedules

- [ ] Nommage conforme
- [ ] Champs d'audit complets (created_at/by, updated_at/by, deleted_at/by, deletion_reason)
- [ ] FK correctes (ON DELETE)
- [ ] Indexes (btree/partial, GIN jsonb si utile)
- [ ] Policies RLS présentes & testées
- [ ] Triggers `updated_at` actifs
- [ ] Données de test prêtes

### sch_goals

- [ ] Nommage conforme
- [ ] Champs d'audit complets (created_at/by, updated_at/by, deleted_at/by, deletion_reason)
- [ ] FK correctes (ON DELETE)
- [ ] Indexes (btree/partial, GIN jsonb si utile)
- [ ] Policies RLS présentes & testées
- [ ] Triggers `updated_at` actifs
- [ ] Données de test prêtes

### sch_tasks

- [ ] Nommage conforme
- [ ] Champs d'audit complets (created_at/by, updated_at/by, deleted_at/by, deletion_reason)
- [ ] FK correctes (ON DELETE)
- [ ] Indexes (btree/partial, GIN jsonb si utile)
- [ ] Policies RLS présentes & testées
- [ ] Triggers `updated_at` actifs
- [ ] Données de test prêtes

## Trips domain

### trp_platform_accounts

- [ ] Nommage conforme
- [ ] Champs d'audit complets (created_at/by, updated_at/by, deleted_at/by, deletion_reason)
- [ ] FK correctes (ON DELETE)
- [ ] Indexes (btree/partial, GIN jsonb si utile)
- [ ] Policies RLS présentes & testées
- [ ] Triggers `updated_at` actifs
- [ ] Données de test prêtes

### trp_trips

- [ ] Nommage conforme
- [ ] Champs d'audit complets (created_at/by, updated_at/by, deleted_at/by, deletion_reason)
- [ ] FK correctes (ON DELETE)
- [ ] Indexes (btree/partial, GIN jsonb si utile)
- [ ] Policies RLS présentes & testées
- [ ] Triggers `updated_at` actifs
- [ ] Données de test prêtes

### trp_settlements

- [ ] Nommage conforme
- [ ] Champs d'audit complets (created_at/by, updated_at/by, deleted_at/by, deletion_reason)
- [ ] FK correctes (ON DELETE)
- [ ] Indexes (btree/partial, GIN jsonb si utile)
- [ ] Policies RLS présentes & testées
- [ ] Triggers `updated_at` actifs
- [ ] Données de test prêtes

### trp_client_invoices

- [ ] Nommage conforme
- [ ] Champs d'audit complets (created_at/by, updated_at/by, deleted_at/by, deletion_reason)
- [ ] FK correctes (ON DELETE)
- [ ] Indexes (btree/partial, GIN jsonb si utile)
- [ ] Policies RLS présentes & testées
- [ ] Triggers `updated_at` actifs
- [ ] Données de test prêtes

## Finance domain

### fin_accounts

- [ ] Nommage conforme
- [ ] Champs d'audit complets (created_at/by, updated_at/by, deleted_at/by, deletion_reason)
- [ ] FK correctes (ON DELETE)
- [ ] Indexes (btree/partial, GIN jsonb si utile)
- [ ] Policies RLS présentes & testées
- [ ] Triggers `updated_at` actifs
- [ ] Données de test prêtes

### fin_transactions

- [ ] Nommage conforme
- [ ] Champs d'audit complets (created_at/by, updated_at/by, deleted_at/by, deletion_reason)
- [ ] FK correctes (ON DELETE)
- [ ] Indexes (btree/partial, GIN jsonb si utile)
- [ ] Policies RLS présentes & testées
- [ ] Triggers `updated_at` actifs
- [ ] Données de test prêtes

### fin_driver_payment_batches

- [ ] Nommage conforme
- [ ] Champs d'audit complets (created_at/by, updated_at/by, deleted_at/by, deletion_reason)
- [ ] FK correctes (ON DELETE)
- [ ] Indexes (btree/partial, GIN jsonb si utile)
- [ ] Policies RLS présentes & testées
- [ ] Triggers `updated_at` actifs
- [ ] Données de test prêtes

### fin_driver_payments

- [ ] Nommage conforme
- [ ] Champs d'audit complets (created_at/by, updated_at/by, deleted_at/by, deletion_reason)
- [ ] FK correctes (ON DELETE)
- [ ] Indexes (btree/partial, GIN jsonb si utile)
- [ ] Policies RLS présentes & testées
- [ ] Triggers `updated_at` actifs
- [ ] Données de test prêtes

### fin_toll_transactions

- [ ] Nommage conforme
- [ ] Champs d'audit complets (created_at/by, updated_at/by, deleted_at/by, deletion_reason)
- [ ] FK correctes (ON DELETE)
- [ ] Indexes (btree/partial, GIN jsonb si utile)
- [ ] Policies RLS présentes & testées
- [ ] Triggers `updated_at` actifs
- [ ] Données de test prêtes

### fin_traffic_fines

- [ ] Nommage conforme
- [ ] Champs d'audit complets (created_at/by, updated_at/by, deleted_at/by, deletion_reason)
- [ ] FK correctes (ON DELETE)
- [ ] Indexes (btree/partial, GIN jsonb si utile)
- [ ] Policies RLS présentes & testées
- [ ] Triggers `updated_at` actifs
- [ ] Données de test prêtes

## Revenue domain

### rev_revenue_imports

- [ ] Nommage conforme
- [ ] Champs d'audit complets (created_at/by, updated_at/by, deleted_at/by, deletion_reason)
- [ ] FK correctes (ON DELETE)
- [ ] Indexes (btree/partial, GIN jsonb si utile)
- [ ] Policies RLS présentes & testées
- [ ] Triggers `updated_at` actifs
- [ ] Données de test prêtes

### rev_driver_revenues

- [ ] Nommage conforme
- [ ] Champs d'audit complets (created_at/by, updated_at/by, deleted_at/by, deletion_reason)
- [ ] FK correctes (ON DELETE)
- [ ] Indexes (btree/partial, GIN jsonb si utile)
- [ ] Policies RLS présentes & testées
- [ ] Triggers `updated_at` actifs
- [ ] Données de test prêtes

### rev_reconciliations

- [ ] Nommage conforme
- [ ] Champs d'audit complets (created_at/by, updated_at/by, deleted_at/by, deletion_reason)
- [ ] FK correctes (ON DELETE)
- [ ] Indexes (btree/partial, GIN jsonb si utile)
- [ ] Policies RLS présentes & testées
- [ ] Triggers `updated_at` actifs
- [ ] Données de test prêtes

## SaaS billing domain

### bil_billing_plans

- [ ] Nommage conforme
- [ ] Champs d'audit complets (created_at/by, updated_at/by, deleted_at/by, deletion_reason)
- [ ] FK correctes (ON DELETE)
- [ ] Indexes (btree/partial, GIN jsonb si utile)
- [ ] Policies RLS présentes & testées
- [ ] Triggers `updated_at` actifs
- [ ] Données de test prêtes

### bil_tenant_subscriptions

- [ ] Nommage conforme
- [ ] Champs d'audit complets (created_at/by, updated_at/by, deleted_at/by, deletion_reason)
- [ ] FK correctes (ON DELETE)
- [ ] Indexes (btree/partial, GIN jsonb si utile)
- [ ] Policies RLS présentes & testées
- [ ] Triggers `updated_at` actifs
- [ ] Données de test prêtes

### bil_tenant_usage_metrics

- [ ] Nommage conforme
- [ ] Champs d'audit complets (created_at/by, updated_at/by, deleted_at/by, deletion_reason)
- [ ] FK correctes (ON DELETE)
- [ ] Indexes (btree/partial, GIN jsonb si utile)
- [ ] Policies RLS présentes & testées
- [ ] Triggers `updated_at` actifs
- [ ] Données de test prêtes

### bil_tenant_invoices

- [ ] Nommage conforme
- [ ] Champs d'audit complets (created_at/by, updated_at/by, deleted_at/by, deletion_reason)
- [ ] FK correctes (ON DELETE)
- [ ] Indexes (btree/partial, GIN jsonb si utile)
- [ ] Policies RLS présentes & testées
- [ ] Triggers `updated_at` actifs
- [ ] Données de test prêtes

### bil_tenant_invoice_lines

- [ ] Nommage conforme
- [ ] Champs d'audit complets (created_at/by, updated_at/by, deleted_at/by, deletion_reason)
- [ ] FK correctes (ON DELETE)
- [ ] Indexes (btree/partial, GIN jsonb si utile)
- [ ] Policies RLS présentes & testées
- [ ] Triggers `updated_at` actifs
- [ ] Données de test prêtes

### bil_payment_methods

- [ ] Nommage conforme
- [ ] Champs d'audit complets (created_at/by, updated_at/by, deleted_at/by, deletion_reason)
- [ ] FK correctes (ON DELETE)
- [ ] Indexes (btree/partial, GIN jsonb si utile)
- [ ] Policies RLS présentes & testées
- [ ] Triggers `updated_at` actifs
- [ ] Données de test prêtes

## CRM domain

### crm_leads

- [ ] Nommage conforme
- [ ] Champs d'audit complets (created_at/by, updated_at/by, deleted_at/by, deletion_reason)
- [ ] FK correctes (ON DELETE)
- [ ] Indexes (btree/partial, GIN jsonb si utile)
- [ ] Policies RLS présentes & testées
- [ ] Triggers `updated_at` actifs
- [ ] Données de test prêtes

### crm_opportunities

- [ ] Nommage conforme
- [ ] Champs d'audit complets (created_at/by, updated_at/by, deleted_at/by, deletion_reason)
- [ ] FK correctes (ON DELETE)
- [ ] Indexes (btree/partial, GIN jsonb si utile)
- [ ] Policies RLS présentes & testées
- [ ] Triggers `updated_at` actifs
- [ ] Données de test prêtes

### crm_contracts

- [ ] Nommage conforme
- [ ] Champs d'audit complets (created_at/by, updated_at/by, deleted_at/by, deletion_reason)
- [ ] FK correctes (ON DELETE)
- [ ] Indexes (btree/partial, GIN jsonb si utile)
- [ ] Policies RLS présentes & testées
- [ ] Triggers `updated_at` actifs
- [ ] Données de test prêtes

## Support domain

### sup_tickets

- [ ] Nommage conforme
- [ ] Champs d'audit complets (created_at/by, updated_at/by, deleted_at/by, deletion_reason)
- [ ] FK correctes (ON DELETE)
- [ ] Indexes (btree/partial, GIN jsonb si utile)
- [ ] Policies RLS présentes & testées
- [ ] Triggers `updated_at` actifs
- [ ] Données de test prêtes

### sup_ticket_messages

- [ ] Nommage conforme
- [ ] Champs d'audit complets (created_at/by, updated_at/by, deleted_at/by, deletion_reason)
- [ ] FK correctes (ON DELETE)
- [ ] Indexes (btree/partial, GIN jsonb si utile)
- [ ] Policies RLS présentes & testées
- [ ] Triggers `updated_at` actifs
- [ ] Données de test prêtes

### sup_customer_feedback

- [ ] Nommage conforme
- [ ] Champs d'audit complets (created_at/by, updated_at/by, deleted_at/by, deletion_reason)
- [ ] FK correctes (ON DELETE)
- [ ] Indexes (btree/partial, GIN jsonb si utile)
- [ ] Policies RLS présentes & testées
- [ ] Triggers `updated_at` actifs
- [ ] Données de test prêtes
