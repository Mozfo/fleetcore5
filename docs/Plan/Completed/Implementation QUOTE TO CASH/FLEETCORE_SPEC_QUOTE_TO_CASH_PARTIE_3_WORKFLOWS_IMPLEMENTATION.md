# FLEETCORE - SPÉCIFICATION QUOTE-TO-CASH ENTERPRISE

## PARTIE 3 : WORKFLOWS INTÉGRÉS ET GUIDE D'IMPLÉMENTATION

**Version :** 1.0.0  
**Date :** 06 Décembre 2025  
**Auteur :** Architecture FleetCore  
**Statut :** SPÉCIFICATION VALIDÉE

---

## TABLE DES MATIÈRES

1. [Workflows End-to-End](#1-workflows-end-to-end)
2. [Services TypeScript Complets](#2-services-typescript-complets)
3. [API Endpoints](#3-api-endpoints)
4. [Jobs CRON et Automatisations](#4-jobs-cron-et-automatisations)
5. [Notifications et Emails](#5-notifications-et-emails)
6. [Plan d'Implémentation](#6-plan-dimplémentation)
7. [Tests et Validation](#7-tests-et-validation)
8. [Checklist de Déploiement](#8-checklist-de-déploiement)
9. [Annexes](#9-annexes)

---

## 1. WORKFLOWS END-TO-END

### 1.1 Workflow Complet : Opportunity → Tenant Actif

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    WORKFLOW QUOTE-TO-CASH COMPLET                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ ÉTAPE 1: CRÉATION QUOTE                                             │    │
│  ├─────────────────────────────────────────────────────────────────────┤    │
│  │ Trigger: Commercial clique "Create Quote" sur Opportunity           │    │
│  │                                                                     │    │
│  │ Actions:                                                            │    │
│  │  1. Valider opportunity.stage IN ('proposal', 'negotiation')        │    │
│  │  2. Générer quote_reference (QOT-2025-00001)                        │    │
│  │  3. Créer crm_quotes avec status='draft'                            │    │
│  │  4. Copier données opportunity → quote                              │    │
│  │  5. Afficher modal pour sélection items                             │    │
│  │                                                                     │    │
│  │ Données créées:                                                     │    │
│  │  - crm_quotes (1 row)                                               │    │
│  │  - crm_quote_items (N rows selon sélection)                         │    │
│  │  - adm_audit_logs (action: quote_created)                           │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                    │                                        │
│                                    ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ ÉTAPE 2: ENVOI QUOTE                                                │    │
│  ├─────────────────────────────────────────────────────────────────────┤    │
│  │ Trigger: Commercial clique "Send Quote"                             │    │
│  │                                                                     │    │
│  │ Validations:                                                        │    │
│  │  - Au moins 1 quote_item existe                                     │    │
│  │  - subtotal > 0                                                     │    │
│  │  - valid_until > today                                              │    │
│  │  - contact_email valide                                             │    │
│  │                                                                     │    │
│  │ Actions:                                                            │    │
│  │  1. Générer PDF du quote                                            │    │
│  │  2. Upload PDF → S3/R2                                              │    │
│  │  3. Update quote.document_url                                       │    │
│  │  4. Update quote.status = 'sent'                                    │    │
│  │  5. Update quote.sent_at = NOW()                                    │    │
│  │  6. Envoyer email au prospect avec lien unique                      │    │
│  │  7. Créer notification pour commercial                              │    │
│  │                                                                     │    │
│  │ Email envoyé:                                                       │    │
│  │  - Template: quote_sent                                             │    │
│  │  - To: opportunity.contact_email                                    │    │
│  │  - Attachments: PDF quote                                           │    │
│  │  - Link: /quotes/view/{token}                                       │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                    │                                        │
│                                    ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ ÉTAPE 3: ACCEPTATION QUOTE                                          │    │
│  ├─────────────────────────────────────────────────────────────────────┤    │
│  │ Trigger: Prospect clique "Accept Quote" OU Commercial marque accepté│    │
│  │                                                                     │    │
│  │ Validations:                                                        │    │
│  │  - quote.status IN ('sent', 'viewed')                               │    │
│  │  - quote.valid_until >= today                                       │    │
│  │                                                                     │    │
│  │ Actions:                                                            │    │
│  │  1. Update quote.status = 'accepted'                                │    │
│  │  2. Update quote.accepted_at = NOW()                                │    │
│  │  3. Update opportunity.stage = 'closing'                            │    │
│  │  4. Envoyer email confirmation au prospect                          │    │
│  │  5. Notifier commercial + manager                                   │    │
│  │  6. Créer audit log                                                 │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                    │                                        │
│                                    ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ ÉTAPE 4: CONVERSION EN ORDER                                        │    │
│  ├─────────────────────────────────────────────────────────────────────┤    │
│  │ Trigger: Commercial clique "Convert to Order" OU automatique        │    │
│  │                                                                     │    │
│  │ Actions:                                                            │    │
│  │  1. Créer crm_orders depuis quote:                                  │    │
│  │     - order_reference = generate (ORD-2025-00001)                   │    │
│  │     - quote_id = quote.id                                           │    │
│  │     - opportunity_id = quote.opportunity_id                         │    │
│  │     - lead_id = opportunity.lead_id                                 │    │
│  │     - total_value = quote.total_value                               │    │
│  │     - dates copiées (effective, expiry)                             │    │
│  │     - status = 'draft'                                              │    │
│  │     - fulfillment_status = 'pending'                                │    │
│  │                                                                     │    │
│  │  2. Update quote:                                                   │    │
│  │     - status = 'converted'                                          │    │
│  │     - converted_to_order_id = order.id                              │    │
│  │     - converted_at = NOW()                                          │    │
│  │                                                                     │    │
│  │  3. Update opportunity:                                             │    │
│  │     - status = 'won'                                                │    │
│  │     - won_date = NOW()                                              │    │
│  │     - won_value = quote.total_value                                 │    │
│  │     - contract_id = order.id                                        │    │
│  │                                                                     │    │
│  │  4. Créer crm_agreements selon config:                              │    │
│  │     - MSA (toujours)                                                │    │
│  │     - SLA (si plan enterprise)                                      │    │
│  │     - DPA (si EU/UK)                                                │    │
│  │                                                                     │    │
│  │  5. Notifications:                                                  │    │
│  │     - Email confirmation au prospect                                │    │
│  │     - Notification équipe CS                                        │    │
│  │     - Notification finance                                          │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                    │                                        │
│                                    ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ ÉTAPE 5: SIGNATURE AGREEMENTS                                       │    │
│  ├─────────────────────────────────────────────────────────────────────┤    │
│  │ Trigger: Création des agreements                                    │    │
│  │                                                                     │    │
│  │ Actions par agreement:                                              │    │
│  │  1. Générer document depuis template                                │    │
│  │     - Remplacer variables (nom, dates, montants)                    │    │
│  │     - Upload document → S3                                          │    │
│  │                                                                     │    │
│  │  2. Créer envelope DocuSign:                                        │    │
│  │     - Document attaché                                              │    │
│  │     - Signataire 1: Client (email du contact)                       │    │
│  │     - Signataire 2: FleetCore (legal@fleetcore.com)                 │    │
│  │                                                                     │    │
│  │  3. Update agreement:                                               │    │
│  │     - status = 'pending_signature'                                  │    │
│  │     - provider_envelope_id = docusign_id                            │    │
│  │     - sent_for_signature_at = NOW()                                 │    │
│  │                                                                     │    │
│  │  4. Email envoyé automatiquement par DocuSign                       │    │
│  │                                                                     │    │
│  │ Webhooks DocuSign:                                                  │    │
│  │  - recipient-signed → update client_signed_at                       │    │
│  │  - envelope-completed → agreement.status = 'signed'                 │    │
│  │  - Télécharger document signé → S3                                  │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                    │                                        │
│                                    ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ ÉTAPE 6: FULFILLMENT (Ready → Fulfilled)                            │    │
│  ├─────────────────────────────────────────────────────────────────────┤    │
│  │ Trigger: Tous les agreements obligatoires sont signés               │    │
│  │                                                                     │    │
│  │ Check:                                                              │    │
│  │  SELECT COUNT(*) FROM crm_agreements                                │    │
│  │  WHERE order_id = :id                                               │    │
│  │    AND agreement_type = 'msa'                                       │    │
│  │    AND status = 'signed';                                           │    │
│  │  -- Doit retourner >= 1                                             │    │
│  │                                                                     │    │
│  │ Actions:                                                            │    │
│  │  1. Update order.fulfillment_status = 'ready_for_fulfillment'       │    │
│  │                                                                     │    │
│  │  2. SI effective_date <= today:                                     │    │
│  │     → Déclencher provisioning immédiat                              │    │
│  │     SINON:                                                          │    │
│  │     → Planifier provisioning pour effective_date                    │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                    │                                        │
│                                    ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ ÉTAPE 7: TENANT PROVISIONING                                        │    │
│  ├─────────────────────────────────────────────────────────────────────┤    │
│  │ Trigger: effective_date atteinte + fulfillment_status = 'ready'     │    │
│  │                                                                     │    │
│  │ Actions (transaction):                                              │    │
│  │                                                                     │    │
│  │  1. CRÉER STRIPE CUSTOMER:                                          │    │
│  │     const customer = await stripe.customers.create({                │    │
│  │       email: order.contact_email,                                   │    │
│  │       name: order.company_name,                                     │    │
│  │       metadata: { fleetcore_order_id: order.id }                    │    │
│  │     });                                                             │    │
│  │                                                                     │    │
│  │  2. CRÉER TENANT:                                                   │    │
│  │     INSERT INTO adm_tenants (                                       │    │
│  │       company_name, subdomain, status,                              │    │
│  │       stripe_customer_id, primary_contact_*,                        │    │
│  │       trial_ends_at, default_currency                               │    │
│  │     )                                                               │    │
│  │                                                                     │    │
│  │  3. CRÉER CLERK ORGANIZATION:                                       │    │
│  │     const org = await clerk.organizations.create({                  │    │
│  │       name: order.company_name,                                     │    │
│  │       slug: generateSlug(order.company_name),                       │    │
│  │       publicMetadata: { tenant_id: tenant.id }                      │    │
│  │     });                                                             │    │
│  │     UPDATE adm_tenants SET clerk_org_id = org.id                    │    │
│  │                                                                     │    │
│  │  4. CRÉER SUBSCRIPTION SCHEDULE (si multi-phases):                  │    │
│  │     → Voir workflow dédié                                           │    │
│  │     OU                                                              │    │
│  │     CRÉER SUBSCRIPTION SIMPLE:                                      │    │
│  │     INSERT INTO bil_tenant_subscriptions (...)                      │    │
│  │     + Stripe subscription.create()                                  │    │
│  │                                                                     │    │
│  │  5. UPDATE ORDER:                                                   │    │
│  │     - tenant_id = tenant.id                                         │    │
│  │     - subscription_id = subscription.id                             │    │
│  │     - fulfillment_status = 'fulfilled'                              │    │
│  │     - fulfilled_at = NOW()                                          │    │
│  │                                                                     │    │
│  │  6. CRÉER INVITATION:                                               │    │
│  │     INSERT INTO adm_invitations (                                   │    │
│  │       tenant_id, email, role, token, expires_at                     │    │
│  │     )                                                               │    │
│  │                                                                     │    │
│  │  7. ENVOYER EMAILS:                                                 │    │
│  │     - Welcome email avec liens                                      │    │
│  │     - Invitation email avec token                                   │    │
│  │                                                                     │    │
│  │  8. CRÉER LIFECYCLE EVENT:                                          │    │
│  │     INSERT INTO adm_tenant_lifecycle_events (                       │    │
│  │       tenant_id, event_type = 'provisioned'                         │    │
│  │     )                                                               │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                    │                                        │
│                                    ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ ÉTAPE 8: ACTIVATION TENANT                                          │    │
│  ├─────────────────────────────────────────────────────────────────────┤    │
│  │ Trigger: Contact principal accepte invitation                       │    │
│  │                                                                     │    │
│  │ Actions:                                                            │    │
│  │  1. Créer compte Clerk via invitation                               │    │
│  │  2. Créer adm_members avec role = 'admin'                           │    │
│  │  3. Update adm_invitations.accepted_at                              │    │
│  │  4. Update adm_tenants.status = 'active'                            │    │
│  │  5. Update adm_tenants.onboarding_completed_at (si wizard fini)     │    │
│  │  6. Update order.fulfillment_status = 'active'                      │    │
│  │  7. Créer lifecycle event: 'activated'                              │    │
│  │                                                                     │    │
│  │ Tenant peut maintenant utiliser FleetCore!                          │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Workflow : Amendment Upgrade

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    WORKFLOW UPGRADE SUBSCRIPTION                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  CONTEXTE INITIAL:                                                          │
│  - Tenant: ABC Logistics                                                    │
│  - Plan actuel: Standard (49€/mois)                                         │
│  - Période: 1er au 31 décembre                                              │
│  - Demande: Passer à Enterprise (199€/mois)                                 │
│  - Date demande: 15 décembre                                                │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ ÉTAPE 1: DEMANDE D'UPGRADE                                          │    │
│  ├─────────────────────────────────────────────────────────────────────┤    │
│  │ Trigger: Admin tenant clique "Upgrade Plan"                         │    │
│  │                                                                     │    │
│  │ UI affiche:                                                         │    │
│  │  ┌──────────────────────────────────────────────────┐               │    │
│  │  │ Upgrade to Enterprise                            │               │    │
│  │  │                                                  │               │    │
│  │  │ Current: Standard - 49€/month                    │               │    │
│  │  │ New: Enterprise - 199€/month                     │               │    │
│  │  │                                                  │               │    │
│  │  │ Proration calculation:                           │               │    │
│  │  │ • Credit (16 days remaining): -25.81€            │               │    │
│  │  │ • Charge (16 days Enterprise): +102.71€          │               │    │
│  │  │ ─────────────────────────────────────            │               │    │
│  │  │ Amount due today: 76.90€                         │               │    │
│  │  │                                                  │               │    │
│  │  │ [Cancel]              [Confirm Upgrade]          │               │    │
│  │  └──────────────────────────────────────────────────┘               │    │
│  │                                                                     │    │
│  │ User confirme → API call                                            │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                    │                                        │
│                                    ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ ÉTAPE 2: CRÉATION AMENDMENT                                         │    │
│  ├─────────────────────────────────────────────────────────────────────┤    │
│  │ API: POST /api/v1/billing/amendments                                │    │
│  │                                                                     │    │
│  │ Actions:                                                            │    │
│  │  1. Calculer proration:                                             │    │
│  │     calculateProration({                                            │    │
│  │       previousPrice: 49,                                            │    │
│  │       newPrice: 199,                                                │    │
│  │       currentPeriodStart: '2025-12-01',                             │    │
│  │       currentPeriodEnd: '2025-12-31',                               │    │
│  │       changeDate: '2025-12-15'                                      │    │
│  │     })                                                              │    │
│  │     → { credit: 25.81, debit: 102.71, net: 76.90 }                  │    │
│  │                                                                     │    │
│  │  2. Créer bil_amendments:                                           │    │
│  │     - amendment_type = 'upgrade'                                    │    │
│  │     - status = 'approved' (upgrades auto-approved)                  │    │
│  │     - effective_immediately = TRUE                                  │    │
│  │     - previous_plan_id = standard_id                                │    │
│  │     - new_plan_id = enterprise_id                                   │    │
│  │     - proration_amount = 76.90                                      │    │
│  │     - mrr_impact = 150 (199 - 49)                                   │    │
│  │                                                                     │    │
│  │  3. Appliquer immédiatement (car approved + immediate)              │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                    │                                        │
│                                    ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ ÉTAPE 3: APPLICATION STRIPE                                         │    │
│  ├─────────────────────────────────────────────────────────────────────┤    │
│  │                                                                     │    │
│  │ Actions:                                                            │    │
│  │  1. Update Stripe Subscription:                                     │    │
│  │     stripe.subscriptions.update(sub_id, {                           │    │
│  │       items: [{ id: item_id, price: enterprise_price_id }],         │    │
│  │       proration_behavior: 'create_prorations'                       │    │
│  │     });                                                             │    │
│  │                                                                     │    │
│  │  2. Stripe génère automatiquement invoice proration                 │    │
│  │                                                                     │    │
│  │  3. Finaliser et payer l'invoice:                                   │    │
│  │     const invoice = await stripe.invoices.finalizeInvoice(id);      │    │
│  │     await stripe.invoices.pay(invoice.id);                          │    │
│  │                                                                     │    │
│  │  4. Webhook received: invoice.paid                                  │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                    │                                        │
│                                    ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ ÉTAPE 4: MISE À JOUR LOCALE                                         │    │
│  ├─────────────────────────────────────────────────────────────────────┤    │
│  │                                                                     │    │
│  │ Actions:                                                            │    │
│  │  1. Update bil_tenant_subscriptions:                                │    │
│  │     - plan_id = enterprise_id                                       │    │
│  │                                                                     │    │
│  │  2. Update bil_amendments:                                          │    │
│  │     - status = 'applied'                                            │    │
│  │     - applied_at = NOW()                                            │    │
│  │     - stripe_amendment_applied = TRUE                               │    │
│  │     - proration_invoice_id = new_invoice.id                         │    │
│  │                                                                     │    │
│  │  3. Créer bil_tenant_invoices (proration):                          │    │
│  │     - invoice_number = 'PRO-xxx'                                    │    │
│  │     - total_amount = 76.90                                          │    │
│  │     - status = 'paid'                                               │    │
│  │     - metadata = { amendment_id: xxx }                              │    │
│  │                                                                     │    │
│  │  4. Update adm_tenants.metadata.feature_flags                       │    │
│  │     - Débloquer features Enterprise                                 │    │
│  │                                                                     │    │
│  │  5. Créer adm_audit_logs                                            │    │
│  │                                                                     │    │
│  │  6. Créer adm_tenant_lifecycle_events:                              │    │
│  │     - event_type = 'plan_upgraded'                                  │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                    │                                        │
│                                    ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ ÉTAPE 5: NOTIFICATIONS                                              │    │
│  ├─────────────────────────────────────────────────────────────────────┤    │
│  │                                                                     │    │
│  │ Emails envoyés:                                                     │    │
│  │  1. Au tenant (admin):                                              │    │
│  │     - Template: plan_upgraded                                       │    │
│  │     - Subject: "Your plan has been upgraded to Enterprise"          │    │
│  │     - Contenu: Nouvelles features, receipt proration                │    │
│  │                                                                     │    │
│  │  2. À l'équipe CS:                                                  │    │
│  │     - Template: internal_upgrade_notification                       │    │
│  │     - Subject: "ABC Logistics upgraded to Enterprise"               │    │
│  │     - Contenu: Détails upgrade, MRR impact                          │    │
│  │                                                                     │    │
│  │ In-app notifications:                                               │    │
│  │  - Toast: "Successfully upgraded to Enterprise!"                    │    │
│  │  - Bell notification pour autres admins du tenant                   │    │
│  │                                                                     │    │
│  │ RÉSULTAT FINAL:                                                     │    │
│  │  ✅ Plan = Enterprise                                               │    │
│  │  ✅ Invoice proration payée (76.90€)                                │    │
│  │  ✅ Features Enterprise activées                                    │    │
│  │  ✅ MRR augmenté de 150€                                            │    │
│  │  ✅ Audit trail complet                                             │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1.3 Workflow : Renouvellement Automatique

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    WORKFLOW RENOUVELLEMENT AUTOMATIQUE                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  TIMELINE:                                                                  │
│  ├── J-60: Alerte interne                                                   │
│  ├── J-30: Notification client                                              │
│  ├── J-14: Rappel client                                                    │
│  ├── J-7: Dernier rappel                                                    │
│  └── J-0: Renouvellement OU expiration                                      │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ J-60: ALERTE INTERNE                                                │    │
│  ├─────────────────────────────────────────────────────────────────────┤    │
│  │ Job CRON quotidien détecte:                                         │    │
│  │   SELECT * FROM crm_orders                                          │    │
│  │   WHERE expiry_date = CURRENT_DATE + 60                             │    │
│  │     AND fulfillment_status = 'active'                               │    │
│  │     AND deleted_at IS NULL;                                         │    │
│  │                                                                     │    │
│  │ Actions:                                                            │    │
│  │  - Email à l'Account Manager                                        │    │
│  │  - Tâche créée: "Review renewal for ABC Logistics"                  │    │
│  │  - Slack notification #renewals                                     │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                    │                                        │
│                                    ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ J-30: NOTIFICATION CLIENT                                           │    │
│  ├─────────────────────────────────────────────────────────────────────┤    │
│  │                                                                     │    │
│  │ SI order.auto_renew = TRUE:                                         │    │
│  │   Email template: renewal_reminder_auto                             │    │
│  │   "Your subscription will automatically renew on {date}"            │    │
│  │   "Current plan: Enterprise - 199€/month"                           │    │
│  │   "To make changes, contact us before {date-7}"                     │    │
│  │                                                                     │    │
│  │ SI order.auto_renew = FALSE:                                        │    │
│  │   Email template: renewal_reminder_manual                           │    │
│  │   "Your subscription expires on {date}"                             │    │
│  │   "Renew now to continue using FleetCore"                           │    │
│  │   [Renew Now] button → /billing/renew                               │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                    │                                        │
│                                    ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ J-0: JOUR DU RENOUVELLEMENT                                         │    │
│  ├─────────────────────────────────────────────────────────────────────┤    │
│  │                                                                     │    │
│  │ CAS 1: Auto-renew = TRUE                                            │    │
│  │ ─────────────────────────────                                       │    │
│  │  1. Créer nouveau order (type = 'renewal'):                         │    │
│  │     - Copier termes de l'order précédent                            │    │
│  │     - effective_date = expiry_date + 1                              │    │
│  │     - expiry_date = new_effective + duration                        │    │
│  │                                                                     │    │
│  │  2. Update ancien order:                                            │    │
│  │     - fulfillment_status = 'expired'                                │    │
│  │                                                                     │    │
│  │  3. Stripe renouvelle automatiquement                               │    │
│  │     - Invoice générée                                               │    │
│  │     - Paiement tenté                                                │    │
│  │                                                                     │    │
│  │  4. Email: "Your subscription has been renewed"                     │    │
│  │                                                                     │    │
│  │                                                                     │    │
│  │ CAS 2: Auto-renew = FALSE + pas de renouvellement manuel            │    │
│  │ ─────────────────────────────────────────────────────                │    │
│  │  1. Update order:                                                   │    │
│  │     - fulfillment_status = 'expired'                                │    │
│  │                                                                     │    │
│  │  2. Update subscription:                                            │    │
│  │     - status = 'expired'                                            │    │
│  │                                                                     │    │
│  │  3. Update tenant:                                                  │    │
│  │     - status = 'expired'                                            │    │
│  │     - Accès limité (lecture seule)                                  │    │
│  │                                                                     │    │
│  │  4. Email: "Your subscription has expired"                          │    │
│  │     [Renew Now] button                                              │    │
│  │                                                                     │    │
│  │  5. Grâce period: 14 jours                                          │    │
│  │     - Données conservées                                            │    │
│  │     - Peut renouveler                                               │    │
│  │                                                                     │    │
│  │  6. Après 14 jours: archivage tenant                                │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. SERVICES TYPESCRIPT COMPLETS

### 2.1 QuoteService

```typescript
// lib/services/crm/quote.service.ts

import { prisma } from "@/lib/db";
import { generateQuotePDF } from "@/lib/services/documents/pdf-generator.service";
import { uploadToStorage } from "@/lib/services/storage/storage.service";
import { sendEmail } from "@/lib/services/notifications/email.service";
import { createAuditLog } from "@/lib/services/audit/audit.service";

interface CreateQuoteInput {
  opportunityId: string;
  items: {
    itemType: "plan" | "addon" | "service" | "custom";
    planId?: string;
    name: string;
    description?: string;
    quantity: number;
    unitPrice: number;
    discountPercent?: number;
  }[];
  validDays?: number;
  contractDurationMonths?: number;
  billingCycle?: "monthly" | "quarterly" | "annual";
  discountType?: "percentage" | "fixed_amount";
  discountValue?: number;
  notes?: string;
  createdBy: string;
}

interface SendQuoteInput {
  quoteId: string;
  recipientEmail: string;
  recipientName: string;
  personalMessage?: string;
  sentBy: string;
}

export class QuoteService {
  // ===== CREATE QUOTE =====
  async createQuote(input: CreateQuoteInput): Promise<any> {
    // Validate opportunity
    const opportunity = await prisma.crm_opportunities.findUnique({
      where: { id: input.opportunityId },
      include: { lead: true },
    });

    if (!opportunity) {
      throw new Error("Opportunity not found");
    }

    if (!["proposal", "negotiation", "closing"].includes(opportunity.stage)) {
      throw new Error(
        "Opportunity must be in proposal, negotiation, or closing stage"
      );
    }

    // Generate references
    const quoteReference = await this.generateQuoteReference();
    const quoteCode = await this.generateQuoteCode();

    // Calculate dates
    const validFrom = new Date();
    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + (input.validDays || 30));

    // Calculate subtotal from items
    let subtotal = 0;
    for (const item of input.items) {
      const itemTotal = item.quantity * item.unitPrice;
      const itemDiscount = item.discountPercent
        ? (itemTotal * item.discountPercent) / 100
        : 0;
      subtotal += itemTotal - itemDiscount;
    }

    // Get tax rate from config (or opportunity country)
    const taxRate = await this.getTaxRateForOpportunity(opportunity);

    // Create quote in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create quote
      const quote = await tx.crm_quotes.create({
        data: {
          quote_reference: quoteReference,
          quote_code: quoteCode,
          quote_version: 1,
          opportunity_id: input.opportunityId,
          status: "draft",
          valid_from: validFrom,
          valid_until: validUntil,
          contract_duration_months: input.contractDurationMonths || 12,
          billing_cycle: input.billingCycle || "monthly",
          currency: opportunity.currency || "EUR",
          subtotal: subtotal,
          discount_type: input.discountType,
          discount_value: input.discountValue || 0,
          tax_rate: taxRate,
          notes: input.notes,
          created_by: input.createdBy,
        },
      });

      // Create quote items
      for (let i = 0; i < input.items.length; i++) {
        const item = input.items[i];
        await tx.crm_quote_items.create({
          data: {
            quote_id: quote.id,
            sort_order: i + 1,
            item_type: item.itemType,
            recurrence: item.itemType === "service" ? "one_time" : "recurring",
            plan_id: item.planId,
            name: item.name,
            description: item.description,
            quantity: item.quantity,
            unit_price: item.unitPrice,
            line_discount_type: item.discountPercent ? "percentage" : undefined,
            line_discount_value: item.discountPercent || 0,
          },
        });
      }

      return quote;
    });

    // Create audit log
    await createAuditLog({
      action: "quote_created",
      entityType: "crm_quotes",
      entityId: result.id,
      performedBy: input.createdBy,
      details: {
        opportunity_id: input.opportunityId,
        quote_reference: quoteReference,
        total_value: subtotal,
      },
    });

    // Fetch complete quote with items
    return this.getQuoteById(result.id);
  }

  // ===== SEND QUOTE =====
  async sendQuote(input: SendQuoteInput): Promise<any> {
    const quote = await prisma.crm_quotes.findUnique({
      where: { id: input.quoteId },
      include: {
        items: { orderBy: { sort_order: "asc" } },
        opportunity: { include: { lead: true } },
      },
    });

    if (!quote) {
      throw new Error("Quote not found");
    }

    if (quote.status !== "draft") {
      throw new Error("Only draft quotes can be sent");
    }

    if (quote.items.length === 0) {
      throw new Error("Quote must have at least one item");
    }

    if (new Date(quote.valid_until) < new Date()) {
      throw new Error("Quote has expired, please update valid_until date");
    }

    // Generate PDF
    const pdfBuffer = await generateQuotePDF(quote);

    // Upload to storage
    const documentUrl = await uploadToStorage({
      buffer: pdfBuffer,
      filename: `quotes/${quote.quote_reference}.pdf`,
      contentType: "application/pdf",
    });

    // Generate view token
    const viewToken = this.generateViewToken();

    // Update quote
    await prisma.crm_quotes.update({
      where: { id: input.quoteId },
      data: {
        status: "sent",
        sent_at: new Date(),
        document_url: documentUrl,
        document_generated_at: new Date(),
        metadata: {
          ...(quote.metadata as object),
          view_token: viewToken,
        },
      },
    });

    // Send email
    await sendEmail({
      template: "quote_sent",
      to: input.recipientEmail,
      subject: `Quote ${quote.quote_reference} from FleetCore`,
      data: {
        recipientName: input.recipientName,
        quoteReference: quote.quote_reference,
        companyName: quote.opportunity?.company_name,
        totalValue: quote.total_value,
        currency: quote.currency,
        validUntil: quote.valid_until,
        viewUrl: `${process.env.NEXT_PUBLIC_APP_URL}/quotes/view/${viewToken}`,
        personalMessage: input.personalMessage,
      },
      attachments: [
        {
          filename: `Quote-${quote.quote_reference}.pdf`,
          content: pdfBuffer,
        },
      ],
    });

    // Create audit log
    await createAuditLog({
      action: "quote_sent",
      entityType: "crm_quotes",
      entityId: input.quoteId,
      performedBy: input.sentBy,
      details: {
        recipient_email: input.recipientEmail,
        document_url: documentUrl,
      },
    });

    return this.getQuoteById(input.quoteId);
  }

  // ===== ACCEPT QUOTE =====
  async acceptQuote(quoteId: string, acceptedBy?: string): Promise<any> {
    const quote = await prisma.crm_quotes.findUnique({
      where: { id: quoteId },
    });

    if (!quote) {
      throw new Error("Quote not found");
    }

    if (!["sent", "viewed"].includes(quote.status)) {
      throw new Error("Only sent or viewed quotes can be accepted");
    }

    if (new Date(quote.valid_until) < new Date()) {
      throw new Error("Quote has expired");
    }

    // Check no other accepted quote for this opportunity
    const existingAccepted = await prisma.crm_quotes.findFirst({
      where: {
        opportunity_id: quote.opportunity_id,
        status: "accepted",
        id: { not: quoteId },
      },
    });

    if (existingAccepted) {
      throw new Error("Another quote for this opportunity is already accepted");
    }

    // Update quote
    await prisma.crm_quotes.update({
      where: { id: quoteId },
      data: {
        status: "accepted",
        accepted_at: new Date(),
      },
    });

    // Update opportunity stage
    await prisma.crm_opportunities.update({
      where: { id: quote.opportunity_id },
      data: { stage: "closing" },
    });

    // Create audit log
    await createAuditLog({
      action: "quote_accepted",
      entityType: "crm_quotes",
      entityId: quoteId,
      performedBy: acceptedBy || "customer",
    });

    return this.getQuoteById(quoteId);
  }

  // ===== CONVERT TO ORDER =====
  async convertToOrder(quoteId: string, convertedBy: string): Promise<any> {
    const quote = await prisma.crm_quotes.findUnique({
      where: { id: quoteId },
      include: {
        opportunity: { include: { lead: true } },
        items: true,
      },
    });

    if (!quote) {
      throw new Error("Quote not found");
    }

    if (quote.status !== "accepted") {
      throw new Error("Only accepted quotes can be converted to orders");
    }

    if (quote.converted_to_order_id) {
      throw new Error("Quote already converted to order");
    }

    const result = await prisma.$transaction(async (tx) => {
      // Generate order reference
      const orderReference = await this.generateOrderReference();
      const orderCode = await this.generateOrderCode();

      // Calculate dates
      const effectiveDate = quote.contract_start_date || new Date();
      const expiryDate = new Date(effectiveDate);
      expiryDate.setMonth(
        expiryDate.getMonth() + quote.contract_duration_months
      );

      const renewalDate = new Date(expiryDate);
      renewalDate.setDate(renewalDate.getDate() - 30); // 30 days notice

      // Create order
      const order = await tx.crm_orders.create({
        data: {
          order_reference: orderReference,
          order_code: orderCode,
          quote_id: quoteId,
          opportunity_id: quote.opportunity_id,
          lead_id: quote.opportunity?.lead_id,
          order_type: "new",
          status: "draft",
          fulfillment_status: "pending",
          contract_date: new Date(),
          effective_date: effectiveDate,
          expiry_date: expiryDate,
          renewal_date: renewalDate,
          total_value: quote.total_value,
          currency: quote.currency,
          billing_cycle: quote.billing_cycle,
          monthly_value: Number(quote.monthly_recurring_value),
          annual_value: Number(quote.annual_recurring_value),
          auto_renew: true,
          notice_period_days: 30,
          created_by: convertedBy,
          metadata: {
            source_quote_reference: quote.quote_reference,
            converted_at: new Date().toISOString(),
          },
        },
      });

      // Update quote
      await tx.crm_quotes.update({
        where: { id: quoteId },
        data: {
          status: "converted",
          converted_to_order_id: order.id,
          converted_at: new Date(),
        },
      });

      // Update opportunity
      await tx.crm_opportunities.update({
        where: { id: quote.opportunity_id },
        data: {
          status: "won",
          stage: "closed",
          won_date: new Date(),
          won_value: quote.total_value,
          contract_id: order.id,
        },
      });

      // Create agreements
      await this.createAgreementsForOrder(tx, order, quote.opportunity);

      return order;
    });

    // Create audit logs
    await createAuditLog({
      action: "quote_converted",
      entityType: "crm_quotes",
      entityId: quoteId,
      performedBy: convertedBy,
      details: { order_id: result.id },
    });

    await createAuditLog({
      action: "order_created",
      entityType: "crm_orders",
      entityId: result.id,
      performedBy: convertedBy,
      details: { source_quote_id: quoteId },
    });

    // Send notifications
    await this.sendOrderCreatedNotifications(result);

    return result;
  }

  // ===== CREATE NEW VERSION =====
  async createNewVersion(quoteId: string, createdBy: string): Promise<any> {
    const parentQuote = await prisma.crm_quotes.findUnique({
      where: { id: quoteId },
      include: { items: true },
    });

    if (!parentQuote) {
      throw new Error("Quote not found");
    }

    if (["converted"].includes(parentQuote.status)) {
      throw new Error("Cannot create new version of converted quote");
    }

    // Get max version for this opportunity
    const maxVersion = await prisma.crm_quotes.aggregate({
      where: { opportunity_id: parentQuote.opportunity_id },
      _max: { quote_version: true },
    });

    const newVersion = (maxVersion._max.quote_version || 0) + 1;
    const newReference = `${parentQuote.quote_reference}-v${newVersion}`;

    const newQuote = await prisma.$transaction(async (tx) => {
      // Create new quote
      const quote = await tx.crm_quotes.create({
        data: {
          quote_reference: newReference,
          quote_code: await this.generateQuoteCode(),
          quote_version: newVersion,
          parent_quote_id: quoteId,
          opportunity_id: parentQuote.opportunity_id,
          status: "draft",
          valid_from: new Date(),
          valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          contract_start_date: parentQuote.contract_start_date,
          contract_duration_months: parentQuote.contract_duration_months,
          billing_cycle: parentQuote.billing_cycle,
          currency: parentQuote.currency,
          subtotal: parentQuote.subtotal,
          discount_type: parentQuote.discount_type,
          discount_value: parentQuote.discount_value,
          tax_rate: parentQuote.tax_rate,
          notes: parentQuote.notes,
          created_by: createdBy,
        },
      });

      // Copy items
      for (const item of parentQuote.items) {
        await tx.crm_quote_items.create({
          data: {
            quote_id: quote.id,
            sort_order: item.sort_order,
            item_type: item.item_type,
            recurrence: item.recurrence,
            plan_id: item.plan_id,
            name: item.name,
            description: item.description,
            quantity: item.quantity,
            unit_price: item.unit_price,
            line_discount_type: item.line_discount_type,
            line_discount_value: item.line_discount_value,
          },
        });
      }

      return quote;
    });

    return this.getQuoteById(newQuote.id);
  }

  // ===== HELPER METHODS =====

  async getQuoteById(id: string): Promise<any> {
    return prisma.crm_quotes.findUnique({
      where: { id },
      include: {
        items: { orderBy: { sort_order: "asc" } },
        opportunity: { include: { lead: true } },
        converted_order: true,
        parent_quote: true,
      },
    });
  }

  async getQuoteHistory(quoteId: string): Promise<any[]> {
    // Get the root quote (no parent)
    let currentQuote = await prisma.crm_quotes.findUnique({
      where: { id: quoteId },
    });

    // Find root
    while (currentQuote?.parent_quote_id) {
      currentQuote = await prisma.crm_quotes.findUnique({
        where: { id: currentQuote.parent_quote_id },
      });
    }

    if (!currentQuote) return [];

    // Get all versions
    return prisma.crm_quotes.findMany({
      where: { opportunity_id: currentQuote.opportunity_id },
      orderBy: { quote_version: "desc" },
      include: {
        items: true,
        created_by_employee: { select: { first_name: true, last_name: true } },
      },
    });
  }

  private async generateQuoteReference(): Promise<string> {
    const year = new Date().getFullYear();
    const result = await prisma.$queryRaw<[{ max_num: number }]>`
      SELECT COALESCE(MAX(CAST(SUBSTRING(quote_reference FROM 10 FOR 5) AS INTEGER)), 0) + 1 as max_num
      FROM crm_quotes
      WHERE quote_reference LIKE ${"QOT-" + year + "-%"}
        AND quote_reference NOT LIKE '%-v%'
    `;
    return `QOT-${year}-${String(result[0].max_num).padStart(5, "0")}`;
  }

  private async generateQuoteCode(): Promise<string> {
    const year = new Date().getFullYear();
    const result = await prisma.$queryRaw<[{ max_num: number }]>`
      SELECT COALESCE(MAX(CAST(SUBSTRING(quote_code FROM 6) AS INTEGER)), 0) + 1 as max_num
      FROM crm_quotes
      WHERE quote_code LIKE ${"Q" + year + "-%"}
    `;
    return `Q${year}-${String(result[0].max_num).padStart(3, "0")}`;
  }

  private async generateOrderReference(): Promise<string> {
    const year = new Date().getFullYear();
    const result = await prisma.$queryRaw<[{ max_num: number }]>`
      SELECT COALESCE(MAX(CAST(SUBSTRING(order_reference FROM 10) AS INTEGER)), 0) + 1 as max_num
      FROM crm_orders
      WHERE order_reference LIKE ${"ORD-" + year + "-%"}
    `;
    return `ORD-${year}-${String(result[0].max_num).padStart(5, "0")}`;
  }

  private async generateOrderCode(): Promise<string> {
    const year = new Date().getFullYear();
    const result = await prisma.$queryRaw<[{ max_num: number }]>`
      SELECT COALESCE(MAX(CAST(SUBSTRING(order_code FROM 6) AS INTEGER)), 0) + 1 as max_num
      FROM crm_orders
      WHERE order_code LIKE ${"O" + year + "-%"}
    `;
    return `O${year}-${String(result[0].max_num).padStart(3, "0")}`;
  }

  private generateViewToken(): string {
    return crypto.randomUUID().replace(/-/g, "") + Date.now().toString(36);
  }

  private async getTaxRateForOpportunity(opportunity: any): Promise<number> {
    // Get tax rate based on country
    const countryTaxRates: Record<string, number> = {
      AE: 5, // UAE VAT
      FR: 20, // France TVA
      DE: 19, // Germany
      GB: 20, // UK
      US: 0, // No federal VAT
    };

    const country = opportunity.lead?.country || "FR";
    return countryTaxRates[country] || 0;
  }

  private async createAgreementsForOrder(
    tx: any,
    order: any,
    opportunity: any
  ): Promise<void> {
    const agreements = [];

    // MSA is always required
    agreements.push({
      type: "msa",
      name: "Master Service Agreement",
    });

    // SLA for enterprise plans
    const plan = await tx.bil_billing_plans.findFirst({
      where: { plan_code: { contains: "enterprise" } },
    });
    if (plan) {
      agreements.push({
        type: "sla",
        name: "Service Level Agreement",
      });
    }

    // DPA for EU/UK
    const euCountries = ["FR", "DE", "IT", "ES", "NL", "BE", "GB"];
    if (euCountries.includes(opportunity?.lead?.country || "")) {
      agreements.push({
        type: "dpa",
        name: "Data Processing Agreement",
      });
    }

    // Create agreements
    for (const agreement of agreements) {
      await tx.crm_agreements.create({
        data: {
          agreement_reference: await this.generateAgreementReference(
            tx,
            agreement.type
          ),
          order_id: order.id,
          agreement_type: agreement.type,
          version_number: 1,
          status: "draft",
          effective_date: order.effective_date,
          signature_method: "electronic",
          terms_version: "2025.01",
          governing_law:
            opportunity?.lead?.country === "AE" ? "UAE Law" : "French Law",
          jurisdiction:
            opportunity?.lead?.country === "AE"
              ? "Dubai Courts"
              : "Paris Commercial Court",
          created_by: order.created_by,
        },
      });
    }
  }

  private async generateAgreementReference(
    tx: any,
    type: string
  ): Promise<string> {
    const year = new Date().getFullYear();
    const typeUpper = type.toUpperCase();
    const result = await tx.$queryRaw<[{ max_num: number }]>`
      SELECT COALESCE(MAX(CAST(SUBSTRING(agreement_reference FROM 14) AS INTEGER)), 0) + 1 as max_num
      FROM crm_agreements
      WHERE agreement_reference LIKE ${"AGR-" + typeUpper + "-" + year + "-%"}
    `;
    return `AGR-${typeUpper}-${year}-${String(result[0].max_num).padStart(5, "0")}`;
  }

  private async sendOrderCreatedNotifications(order: any): Promise<void> {
    // Implementation depends on notification service
    console.log(
      "Sending order created notifications for:",
      order.order_reference
    );
  }
}

export const quoteService = new QuoteService();
```

### 2.2 OrderFulfillmentService

```typescript
// lib/services/crm/order-fulfillment.service.ts

import { prisma } from "@/lib/db";
import { stripeClient } from "@/lib/services/stripe/stripe-client.service";
import { clerkClient } from "@/lib/services/auth/clerk.service";
import { subscriptionScheduleService } from "@/lib/services/billing/subscription-schedule.service";
import { sendEmail } from "@/lib/services/notifications/email.service";
import { createAuditLog } from "@/lib/services/audit/audit.service";

export class OrderFulfillmentService {
  // ===== CHECK READY FOR FULFILLMENT =====
  async checkAndUpdateFulfillmentStatus(orderId: string): Promise<boolean> {
    const order = await prisma.crm_orders.findUnique({
      where: { id: orderId },
      include: {
        agreements: true,
      },
    });

    if (!order) {
      throw new Error("Order not found");
    }

    if (order.fulfillment_status !== "pending") {
      return false; // Already processed
    }

    // Check if MSA is signed
    const msaSigned = order.agreements.some(
      (a) => a.agreement_type === "msa" && a.status === "signed"
    );

    if (!msaSigned) {
      return false; // Not ready yet
    }

    // Update to ready_for_fulfillment
    await prisma.crm_orders.update({
      where: { id: orderId },
      data: { fulfillment_status: "ready_for_fulfillment" },
    });

    // Check if should fulfill immediately
    const effectiveDate = new Date(order.effective_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (effectiveDate <= today) {
      await this.fulfillOrder(orderId);
    }

    return true;
  }

  // ===== FULFILL ORDER =====
  async fulfillOrder(orderId: string): Promise<any> {
    const order = await prisma.crm_orders.findUnique({
      where: { id: orderId },
      include: {
        quote: { include: { items: true } },
        opportunity: { include: { lead: true } },
      },
    });

    if (!order) {
      throw new Error("Order not found");
    }

    if (order.fulfillment_status !== "ready_for_fulfillment") {
      throw new Error("Order is not ready for fulfillment");
    }

    const lead = order.opportunity?.lead;

    try {
      // Start transaction
      const result = await prisma.$transaction(async (tx) => {
        // 1. CREATE STRIPE CUSTOMER
        const stripeCustomer = await stripeClient.getClient().customers.create({
          email: lead?.contact_email || "",
          name: lead?.company_name || "",
          phone: lead?.phone,
          metadata: {
            fleetcore_order_id: order.id,
            fleetcore_lead_id: lead?.id || "",
          },
        });

        // 2. CREATE TENANT
        const subdomain = this.generateSubdomain(lead?.company_name || "");

        const tenant = await tx.adm_tenants.create({
          data: {
            company_name: lead?.company_name || "Unknown",
            subdomain: subdomain,
            status: "provisioning",
            stripe_customer_id: stripeCustomer.id,
            primary_contact_name: lead?.contact_name,
            primary_contact_email: lead?.contact_email,
            primary_contact_phone: lead?.phone,
            billing_email: lead?.contact_email,
            default_currency: order.currency,
            trial_ends_at: this.calculateTrialEnd(order),
          },
        });

        // 3. CREATE CLERK ORGANIZATION
        const clerkOrg = await clerkClient.organizations.createOrganization({
          name: lead?.company_name || "Unknown",
          slug: subdomain,
          publicMetadata: {
            tenant_id: tenant.id,
            plan: order.quote?.items[0]?.plan_id,
          },
        });

        // Update tenant with Clerk org ID
        await tx.adm_tenants.update({
          where: { id: tenant.id },
          data: { clerk_org_id: clerkOrg.id },
        });

        // 4. CREATE SUBSCRIPTION (or Schedule)
        const isMultiPhase =
          order.quote?.items &&
          order.contract_duration_months &&
          order.contract_duration_months > 12;

        let subscription;
        let schedule;

        if (isMultiPhase) {
          // Create subscription schedule for multi-year deals
          const scheduleResult =
            await subscriptionScheduleService.createSchedule({
              tenantId: tenant.id,
              orderId: order.id,
              phases: this.buildPhasesFromOrder(order),
              endBehavior: "release",
            });
          schedule = scheduleResult.schedule;
          subscription = scheduleResult.subscription;
        } else {
          // Create simple subscription
          subscription = await this.createSimpleSubscription(
            tx,
            tenant,
            order,
            stripeCustomer.id
          );
        }

        // 5. UPDATE ORDER
        await tx.crm_orders.update({
          where: { id: orderId },
          data: {
            tenant_id: tenant.id,
            subscription_id: subscription?.id,
            fulfillment_status: "fulfilled",
            fulfilled_at: new Date(),
          },
        });

        // 6. CREATE INVITATION
        const invitationToken = this.generateInvitationToken();
        const invitation = await tx.adm_invitations.create({
          data: {
            tenant_id: tenant.id,
            email: lead?.contact_email || "",
            role: "admin",
            token: invitationToken,
            expires_at: new Date(Date.now() + 72 * 60 * 60 * 1000), // 72 hours
            invited_by: order.created_by,
          },
        });

        // 7. CREATE LIFECYCLE EVENT
        await tx.adm_tenant_lifecycle_events.create({
          data: {
            tenant_id: tenant.id,
            event_type: "provisioned",
            description: `Tenant provisioned from order ${order.order_reference}`,
            effective_date: new Date(),
          },
        });

        return {
          tenant,
          subscription,
          schedule,
          invitation,
          stripeCustomer,
          clerkOrg,
        };
      });

      // 8. SEND EMAILS (outside transaction)
      await this.sendWelcomeEmail(result.tenant, result.invitation);
      await this.sendInternalNotifications(order, result.tenant);

      // 9. CREATE AUDIT LOG
      await createAuditLog({
        action: "order_fulfilled",
        entityType: "crm_orders",
        entityId: orderId,
        performedBy: "system",
        details: {
          tenant_id: result.tenant.id,
          subscription_id: result.subscription?.id,
        },
      });

      return result;
    } catch (error: any) {
      // Log error and update order status
      await prisma.crm_orders.update({
        where: { id: orderId },
        data: {
          fulfillment_status: "pending",
          metadata: {
            ...(order.metadata as object),
            fulfillment_error: error.message,
            fulfillment_error_at: new Date().toISOString(),
          },
        },
      });

      throw error;
    }
  }

  // ===== HELPER METHODS =====

  private generateSubdomain(companyName: string): string {
    // Normalize company name to subdomain
    let subdomain = companyName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .substring(0, 30);

    // Add random suffix if needed
    subdomain = `${subdomain}-${Math.random().toString(36).substring(2, 6)}`;

    return subdomain;
  }

  private calculateTrialEnd(order: any): Date | null {
    const quote = order.quote;
    if (!quote) return null;

    // Check if first item has trial
    const firstPlanItem = quote.items?.find((i: any) => i.item_type === "plan");
    if (firstPlanItem?.metadata?.trial_days) {
      const trialEnd = new Date(order.effective_date);
      trialEnd.setDate(trialEnd.getDate() + firstPlanItem.metadata.trial_days);
      return trialEnd;
    }

    // Default 14 days trial
    const trialEnd = new Date(order.effective_date);
    trialEnd.setDate(trialEnd.getDate() + 14);
    return trialEnd;
  }

  private buildPhasesFromOrder(order: any): any[] {
    // Build phases from order for multi-year deals
    // This is a simplified version - real implementation would be more complex
    const phases = [];
    const totalMonths = order.contract_duration_months || 12;
    const planItem = order.quote?.items?.find(
      (i: any) => i.item_type === "plan"
    );

    if (!planItem) {
      throw new Error("No plan item found in order");
    }

    // Split into yearly phases
    const yearsCount = Math.ceil(totalMonths / 12);
    let startDate = new Date(order.effective_date);

    for (let year = 1; year <= yearsCount; year++) {
      const monthsInPhase = Math.min(12, totalMonths - (year - 1) * 12);
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + monthsInPhase);

      phases.push({
        planId: planItem.plan_id,
        startDate: new Date(startDate),
        durationMonths: monthsInPhase,
        unitPrice: Number(planItem.unit_price),
        discountPercent: year === 1 ? 20 : year === 2 ? 10 : 0, // Ramp-up pricing
        billingCycle: "monthly",
        trialDays: year === 1 ? 14 : 0,
      });

      startDate = endDate;
    }

    return phases;
  }

  private async createSimpleSubscription(
    tx: any,
    tenant: any,
    order: any,
    stripeCustomerId: string
  ): Promise<any> {
    const planItem = order.quote?.items?.find(
      (i: any) => i.item_type === "plan"
    );
    if (!planItem) {
      throw new Error("No plan item found");
    }

    const plan = await tx.bil_billing_plans.findUnique({
      where: { id: planItem.plan_id },
    });

    if (!plan) {
      throw new Error("Plan not found");
    }

    // Create Stripe subscription
    const stripeSubscription = await stripeClient
      .getClient()
      .subscriptions.create({
        customer: stripeCustomerId,
        items: [{ price: plan.stripe_price_id_monthly }],
        trial_period_days: 14,
        metadata: {
          fleetcore_tenant_id: tenant.id,
          fleetcore_order_id: order.id,
        },
      });

    // Create local subscription
    const subscription = await tx.bil_tenant_subscriptions.create({
      data: {
        tenant_id: tenant.id,
        plan_id: plan.id,
        status: "trialing",
        billing_cycle: order.billing_cycle || "monthly",
        provider: "stripe",
        provider_subscription_id: stripeSubscription.id,
        provider_customer_id: stripeCustomerId,
        current_period_start: new Date(
          stripeSubscription.current_period_start * 1000
        ),
        current_period_end: new Date(
          stripeSubscription.current_period_end * 1000
        ),
        trial_end: stripeSubscription.trial_end
          ? new Date(stripeSubscription.trial_end * 1000)
          : null,
      },
    });

    return subscription;
  }

  private generateInvitationToken(): string {
    return crypto.randomUUID() + "-" + Date.now().toString(36);
  }

  private async sendWelcomeEmail(tenant: any, invitation: any): Promise<void> {
    await sendEmail({
      template: "welcome_new_tenant",
      to: tenant.primary_contact_email,
      subject: "Welcome to FleetCore! 🚀",
      data: {
        companyName: tenant.company_name,
        contactName: tenant.primary_contact_name,
        subdomain: tenant.subdomain,
        invitationUrl: `${process.env.NEXT_PUBLIC_APP_URL}/accept-invitation/${invitation.token}`,
        expiresAt: invitation.expires_at,
      },
    });
  }

  private async sendInternalNotifications(
    order: any,
    tenant: any
  ): Promise<void> {
    // Notify CS team
    await sendEmail({
      template: "internal_new_tenant",
      to: process.env.CS_TEAM_EMAIL || "cs@fleetcore.com",
      subject: `New Tenant: ${tenant.company_name}`,
      data: {
        orderReference: order.order_reference,
        companyName: tenant.company_name,
        subdomain: tenant.subdomain,
        totalValue: order.total_value,
      },
    });
  }
}

export const orderFulfillmentService = new OrderFulfillmentService();
```

---

## 3. API ENDPOINTS

### 3.1 Routes Quote

```typescript
// app/api/v1/crm/quotes/route.ts

import { NextRequest, NextResponse } from "next/server";
import { quoteService } from "@/lib/services/crm/quote.service";
import { requireAuth } from "@/lib/middleware/auth";
import { requirePermission } from "@/lib/middleware/permissions";
import { validateBody } from "@/lib/middleware/validation";
import {
  createQuoteSchema,
  listQuotesSchema,
} from "@/lib/schemas/quote.schemas";

// GET /api/v1/crm/quotes - List quotes
export async function GET(request: NextRequest) {
  try {
    await requireAuth(request);
    await requirePermission(request, "quotes.read");

    const { searchParams } = new URL(request.url);
    const filters = {
      opportunityId: searchParams.get("opportunity_id"),
      status: searchParams.get("status"),
      createdBy: searchParams.get("created_by"),
      page: parseInt(searchParams.get("page") || "1"),
      limit: parseInt(searchParams.get("limit") || "20"),
    };

    const quotes = await quoteService.listQuotes(filters);

    return NextResponse.json(quotes);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

// POST /api/v1/crm/quotes - Create quote
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    await requirePermission(request, "quotes.create");

    const body = await request.json();
    const validated = await validateBody(body, createQuoteSchema);

    const quote = await quoteService.createQuote({
      ...validated,
      createdBy: user.id,
    });

    return NextResponse.json(quote, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
```

```typescript
// app/api/v1/crm/quotes/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { quoteService } from "@/lib/services/crm/quote.service";

// GET /api/v1/crm/quotes/:id
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth(request);

    const quote = await quoteService.getQuoteById(params.id);

    if (!quote) {
      return NextResponse.json({ error: "Quote not found" }, { status: 404 });
    }

    return NextResponse.json(quote);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

// PUT /api/v1/crm/quotes/:id
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(request);
    await requirePermission(request, "quotes.update");

    const body = await request.json();

    const quote = await quoteService.updateQuote(params.id, {
      ...body,
      updatedBy: user.id,
    });

    return NextResponse.json(quote);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

// DELETE /api/v1/crm/quotes/:id
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(request);
    await requirePermission(request, "quotes.delete");

    await quoteService.deleteQuote(params.id, user.id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
```

```typescript
// app/api/v1/crm/quotes/[id]/send/route.ts

// POST /api/v1/crm/quotes/:id/send
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(request);
    await requirePermission(request, "quotes.send");

    const body = await request.json();

    const quote = await quoteService.sendQuote({
      quoteId: params.id,
      recipientEmail: body.recipient_email,
      recipientName: body.recipient_name,
      personalMessage: body.personal_message,
      sentBy: user.id,
    });

    return NextResponse.json(quote);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
```

```typescript
// app/api/v1/crm/quotes/[id]/accept/route.ts

// POST /api/v1/crm/quotes/:id/accept
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(request);

    const quote = await quoteService.acceptQuote(params.id, user.id);

    return NextResponse.json(quote);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
```

```typescript
// app/api/v1/crm/quotes/[id]/convert/route.ts

// POST /api/v1/crm/quotes/:id/convert
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(request);
    await requirePermission(request, "orders.create");

    const order = await quoteService.convertToOrder(params.id, user.id);

    return NextResponse.json(order, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
```

### 3.2 Récapitulatif des Endpoints

| Méthode           | Endpoint                                   | Description            | Permission           |
| ----------------- | ------------------------------------------ | ---------------------- | -------------------- |
| **QUOTES**        |
| GET               | `/api/v1/crm/quotes`                       | Liste des quotes       | quotes.read          |
| POST              | `/api/v1/crm/quotes`                       | Créer quote            | quotes.create        |
| GET               | `/api/v1/crm/quotes/:id`                   | Détail quote           | quotes.read          |
| PUT               | `/api/v1/crm/quotes/:id`                   | Modifier quote         | quotes.update        |
| DELETE            | `/api/v1/crm/quotes/:id`                   | Supprimer quote        | quotes.delete        |
| POST              | `/api/v1/crm/quotes/:id/send`              | Envoyer quote          | quotes.send          |
| POST              | `/api/v1/crm/quotes/:id/accept`            | Accepter quote         | -                    |
| POST              | `/api/v1/crm/quotes/:id/reject`            | Refuser quote          | -                    |
| POST              | `/api/v1/crm/quotes/:id/convert`           | Convertir en order     | orders.create        |
| POST              | `/api/v1/crm/quotes/:id/new-version`       | Nouvelle version       | quotes.create        |
| GET               | `/api/v1/crm/quotes/:id/history`           | Historique versions    | quotes.read          |
| GET               | `/api/v1/crm/quotes/:id/pdf`               | Télécharger PDF        | quotes.read          |
| **ORDERS**        |
| GET               | `/api/v1/crm/orders`                       | Liste des orders       | orders.read          |
| GET               | `/api/v1/crm/orders/:id`                   | Détail order           | orders.read          |
| PUT               | `/api/v1/crm/orders/:id`                   | Modifier order         | orders.update        |
| POST              | `/api/v1/crm/orders/:id/fulfill`           | Déclencher fulfillment | orders.fulfill       |
| POST              | `/api/v1/crm/orders/:id/cancel`            | Annuler order          | orders.cancel        |
| **AGREEMENTS**    |
| GET               | `/api/v1/crm/agreements`                   | Liste agreements       | agreements.read      |
| GET               | `/api/v1/crm/agreements/:id`               | Détail agreement       | agreements.read      |
| POST              | `/api/v1/crm/agreements/:id/send`          | Envoyer pour signature | agreements.send      |
| GET               | `/api/v1/crm/agreements/:id/status`        | Statut signature       | agreements.read      |
| **SUBSCRIPTIONS** |
| GET               | `/api/v1/billing/subscriptions`            | Liste subscriptions    | subscriptions.read   |
| GET               | `/api/v1/billing/subscriptions/:id`        | Détail subscription    | subscriptions.read   |
| POST              | `/api/v1/billing/subscriptions/:id/cancel` | Annuler                | subscriptions.cancel |
| **SCHEDULES**     |
| GET               | `/api/v1/billing/schedules`                | Liste schedules        | schedules.read       |
| POST              | `/api/v1/billing/schedules`                | Créer schedule         | schedules.create     |
| GET               | `/api/v1/billing/schedules/:id`            | Détail schedule        | schedules.read       |
| POST              | `/api/v1/billing/schedules/:id/cancel`     | Annuler schedule       | schedules.cancel     |
| **AMENDMENTS**    |
| GET               | `/api/v1/billing/amendments`               | Liste amendments       | amendments.read      |
| POST              | `/api/v1/billing/amendments`               | Créer amendment        | amendments.create    |
| GET               | `/api/v1/billing/amendments/:id`           | Détail amendment       | amendments.read      |
| POST              | `/api/v1/billing/amendments/:id/approve`   | Approuver              | amendments.approve   |
| POST              | `/api/v1/billing/amendments/:id/reject`    | Rejeter                | amendments.approve   |
| **WEBHOOKS**      |
| POST              | `/api/webhooks/stripe`                     | Webhooks Stripe        | -                    |
| POST              | `/api/webhooks/docusign`                   | Webhooks DocuSign      | -                    |

---

## 4. JOBS CRON ET AUTOMATISATIONS

### 4.1 Configuration des Jobs

```typescript
// lib/jobs/cron-config.ts

export const CRON_JOBS = {
  // Quotes
  expireQuotes: {
    schedule: "5 0 * * *", // 00:05 daily
    handler: "expireQuotesJob",
    description: "Expire quotes past valid_until date",
  },

  // Orders
  fulfillOrders: {
    schedule: "10 0 * * *", // 00:10 daily
    handler: "fulfillOrdersJob",
    description: "Fulfill orders with effective_date = today",
  },

  // Renewals
  sendRenewalReminders60: {
    schedule: "0 9 * * *", // 09:00 daily
    handler: "sendRenewalReminders",
    args: { daysBeforeExpiry: 60 },
    description: "Send internal renewal alerts 60 days before",
  },
  sendRenewalReminders30: {
    schedule: "0 10 * * *", // 10:00 daily
    handler: "sendRenewalReminders",
    args: { daysBeforeExpiry: 30 },
    description: "Send customer renewal reminders 30 days before",
  },
  processAutoRenewals: {
    schedule: "15 0 * * *", // 00:15 daily
    handler: "processAutoRenewals",
    description: "Process auto-renewals for expiring orders",
  },

  // Schedules
  processSchedulePhases: {
    schedule: "20 0 * * *", // 00:20 daily
    handler: "processSchedulePhasesJob",
    description: "Transition schedule phases",
  },

  // Amendments
  applyScheduledAmendments: {
    schedule: "25 0 * * *", // 00:25 daily
    handler: "applyScheduledAmendmentsJob",
    description: "Apply approved amendments with effective_date = today",
  },

  // Billing
  syncStripeData: {
    schedule: "0 */4 * * *", // Every 4 hours
    handler: "syncStripeDataJob",
    description: "Sync subscription and invoice data from Stripe",
  },

  // Cleanup
  cleanupExpiredInvitations: {
    schedule: "0 3 * * *", // 03:00 daily
    handler: "cleanupExpiredInvitationsJob",
    description: "Clean up expired invitations",
  },
};
```

### 4.2 Job Implementations

```typescript
// lib/jobs/quote-jobs.ts

import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/services/notifications/email.service";

export async function expireQuotesJob(): Promise<void> {
  console.log("[CRON] Starting expireQuotesJob...");

  const expiredQuotes = await prisma.crm_quotes.updateMany({
    where: {
      status: { in: ["sent", "viewed"] },
      valid_until: { lt: new Date() },
      deleted_at: null,
    },
    data: {
      status: "expired",
      expired_at: new Date(),
    },
  });

  console.log(`[CRON] Expired ${expiredQuotes.count} quotes`);

  // Notify owners
  if (expiredQuotes.count > 0) {
    const quotes = await prisma.crm_quotes.findMany({
      where: {
        status: "expired",
        expired_at: {
          gte: new Date(Date.now() - 60000), // Last minute
        },
      },
      include: {
        opportunity: true,
        created_by_employee: true,
      },
    });

    for (const quote of quotes) {
      await sendEmail({
        template: "quote_expired_notification",
        to: quote.created_by_employee?.email || "",
        subject: `Quote ${quote.quote_reference} has expired`,
        data: {
          quoteReference: quote.quote_reference,
          companyName: quote.opportunity?.company_name,
          expiredAt: quote.expired_at,
        },
      });
    }
  }
}
```

```typescript
// lib/jobs/fulfillment-jobs.ts

import { prisma } from "@/lib/db";
import { orderFulfillmentService } from "@/lib/services/crm/order-fulfillment.service";

export async function fulfillOrdersJob(): Promise<void> {
  console.log("[CRON] Starting fulfillOrdersJob...");

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const ordersToFulfill = await prisma.crm_orders.findMany({
    where: {
      fulfillment_status: "ready_for_fulfillment",
      effective_date: { lte: today },
      deleted_at: null,
    },
  });

  console.log(`[CRON] Found ${ordersToFulfill.length} orders to fulfill`);

  for (const order of ordersToFulfill) {
    try {
      await orderFulfillmentService.fulfillOrder(order.id);
      console.log(`[CRON] Fulfilled order ${order.order_reference}`);
    } catch (error: any) {
      console.error(
        `[CRON] Failed to fulfill order ${order.order_reference}:`,
        error.message
      );
    }
  }
}
```

```typescript
// lib/jobs/renewal-jobs.ts

import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/services/notifications/email.service";

interface RenewalReminderArgs {
  daysBeforeExpiry: number;
}

export async function sendRenewalReminders(
  args: RenewalReminderArgs
): Promise<void> {
  console.log(
    `[CRON] Sending renewal reminders for ${args.daysBeforeExpiry} days before expiry...`
  );

  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + args.daysBeforeExpiry);
  targetDate.setHours(0, 0, 0, 0);

  const nextDay = new Date(targetDate);
  nextDay.setDate(nextDay.getDate() + 1);

  const expiringOrders = await prisma.crm_orders.findMany({
    where: {
      expiry_date: {
        gte: targetDate,
        lt: nextDay,
      },
      fulfillment_status: "active",
      deleted_at: null,
    },
    include: {
      tenant: true,
      subscription: { include: { plan: true } },
    },
  });

  console.log(
    `[CRON] Found ${expiringOrders.length} orders expiring in ${args.daysBeforeExpiry} days`
  );

  for (const order of expiringOrders) {
    const template = order.auto_renew
      ? "renewal_reminder_auto"
      : "renewal_reminder_manual";

    await sendEmail({
      template,
      to: order.tenant?.primary_contact_email || "",
      subject: order.auto_renew
        ? "Your FleetCore subscription will auto-renew soon"
        : "Your FleetCore subscription is expiring soon",
      data: {
        companyName: order.tenant?.company_name,
        expiryDate: order.expiry_date,
        planName: order.subscription?.plan?.plan_name,
        monthlyValue: order.monthly_value,
        autoRenew: order.auto_renew,
        renewUrl: `${process.env.NEXT_PUBLIC_APP_URL}/billing/renew`,
      },
    });
  }
}

export async function processAutoRenewals(): Promise<void> {
  console.log("[CRON] Processing auto-renewals...");

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const ordersToRenew = await prisma.crm_orders.findMany({
    where: {
      expiry_date: { lte: today },
      auto_renew: true,
      fulfillment_status: "active",
      deleted_at: null,
    },
    include: {
      tenant: true,
      subscription: true,
    },
  });

  console.log(`[CRON] Found ${ordersToRenew.length} orders to auto-renew`);

  for (const order of ordersToRenew) {
    try {
      // Create renewal order
      const newOrderReference = await generateOrderReference();
      const newEffectiveDate = new Date(order.expiry_date);
      newEffectiveDate.setDate(newEffectiveDate.getDate() + 1);

      const newExpiryDate = new Date(newEffectiveDate);
      newExpiryDate.setMonth(
        newExpiryDate.getMonth() + (order.contract_duration_months || 12)
      );

      await prisma.$transaction(async (tx) => {
        // Create new order
        const newOrder = await tx.crm_orders.create({
          data: {
            order_reference: newOrderReference,
            order_code: await generateOrderCode(),
            quote_id: order.quote_id,
            opportunity_id: order.opportunity_id,
            lead_id: order.lead_id,
            order_type: "renewal",
            status: "active",
            fulfillment_status: "active",
            contract_date: today,
            effective_date: newEffectiveDate,
            expiry_date: newExpiryDate,
            total_value: order.total_value,
            currency: order.currency,
            billing_cycle: order.billing_cycle,
            monthly_value: order.monthly_value,
            annual_value: order.annual_value,
            auto_renew: order.auto_renew,
            notice_period_days: order.notice_period_days,
            tenant_id: order.tenant_id,
            subscription_id: order.subscription_id,
            fulfilled_at: new Date(),
            activated_at: new Date(),
            metadata: {
              renewed_from_order_id: order.id,
              renewal_date: today.toISOString(),
            },
          },
        });

        // Mark old order as expired
        await tx.crm_orders.update({
          where: { id: order.id },
          data: { fulfillment_status: "expired" },
        });

        // Create lifecycle event
        await tx.adm_tenant_lifecycle_events.create({
          data: {
            tenant_id: order.tenant_id!,
            event_type: "contract_renewed",
            description: `Contract renewed: ${order.order_reference} → ${newOrderReference}`,
            effective_date: newEffectiveDate,
          },
        });
      });

      // Send confirmation email
      await sendEmail({
        template: "renewal_confirmation",
        to: order.tenant?.primary_contact_email || "",
        subject: "Your FleetCore subscription has been renewed",
        data: {
          companyName: order.tenant?.company_name,
          newExpiryDate: newExpiryDate,
          monthlyValue: order.monthly_value,
        },
      });

      console.log(
        `[CRON] Renewed order ${order.order_reference} → ${newOrderReference}`
      );
    } catch (error: any) {
      console.error(
        `[CRON] Failed to renew order ${order.order_reference}:`,
        error.message
      );
    }
  }
}
```

---

## 5. NOTIFICATIONS ET EMAILS

### 5.1 Templates Email

| Template                  | Trigger                   | Destinataire          | Variables                                     |
| ------------------------- | ------------------------- | --------------------- | --------------------------------------------- |
| `quote_sent`              | Quote envoyé              | Prospect              | quoteRef, company, total, validUntil, viewUrl |
| `quote_accepted`          | Quote accepté             | Prospect + Commercial | quoteRef, company, nextSteps                  |
| `quote_expired`           | Quote expiré              | Commercial            | quoteRef, company                             |
| `order_created`           | Order créé                | Équipes internes      | orderRef, company, value                      |
| `agreement_sent`          | Agreement envoyé DocuSign | Prospect              | agreementType, company, signUrl               |
| `agreement_signed`        | Agreement signé           | Équipes internes      | agreementType, company                        |
| `welcome_new_tenant`      | Tenant provisionné        | Admin tenant          | company, subdomain, invitationUrl             |
| `invitation_sent`         | Invitation créée          | Invité                | company, inviterName, acceptUrl               |
| `renewal_reminder_auto`   | J-30 renewal              | Admin tenant          | company, expiryDate, plan                     |
| `renewal_reminder_manual` | J-30 renewal (no auto)    | Admin tenant          | company, expiryDate, renewUrl                 |
| `renewal_confirmation`    | Renewal effectué          | Admin tenant          | company, newExpiryDate                        |
| `plan_upgraded`           | Upgrade appliqué          | Admin tenant          | company, oldPlan, newPlan, proratedAmount     |
| `payment_failed`          | Paiement échoué           | Admin tenant          | company, amount, retryDate                    |
| `subscription_suspended`  | Subscription suspendue    | Admin tenant          | company, reason                               |

### 5.2 React Email Templates

```typescript
// emails/quote-sent.tsx

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';

interface QuoteSentEmailProps {
  recipientName: string;
  quoteReference: string;
  companyName: string;
  totalValue: number;
  currency: string;
  validUntil: Date;
  viewUrl: string;
  personalMessage?: string;
}

export default function QuoteSentEmail({
  recipientName,
  quoteReference,
  companyName,
  totalValue,
  currency,
  validUntil,
  viewUrl,
  personalMessage,
}: QuoteSentEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Your quote {quoteReference} from FleetCore is ready</Preview>
      <Body style={main}>
        <Container style={container}>
          <Img
            src={`${process.env.NEXT_PUBLIC_APP_URL}/logo.png`}
            width="150"
            height="40"
            alt="FleetCore"
            style={logo}
          />

          <Heading style={heading}>
            Your Quote is Ready
          </Heading>

          <Text style={paragraph}>
            Hi {recipientName},
          </Text>

          <Text style={paragraph}>
            Thank you for your interest in FleetCore! We've prepared a customized
            quote for {companyName}.
          </Text>

          {personalMessage && (
            <Section style={messageBox}>
              <Text style={paragraph}>{personalMessage}</Text>
            </Section>
          )}

          <Section style={quoteDetails}>
            <Text style={detailLabel}>Quote Reference</Text>
            <Text style={detailValue}>{quoteReference}</Text>

            <Text style={detailLabel}>Total Value</Text>
            <Text style={detailValue}>
              {new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: currency,
              }).format(totalValue)}
            </Text>

            <Text style={detailLabel}>Valid Until</Text>
            <Text style={detailValue}>
              {new Date(validUntil).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </Text>
          </Section>

          <Section style={buttonContainer}>
            <Button style={button} href={viewUrl}>
              View Quote
            </Button>
          </Section>

          <Text style={paragraph}>
            If you have any questions, simply reply to this email or contact us at{' '}
            <Link href="mailto:sales@fleetcore.com">sales@fleetcore.com</Link>.
          </Text>

          <Text style={footer}>
            © 2025 FleetCore. All rights reserved.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

// Styles
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  maxWidth: '600px',
};

const logo = {
  margin: '0 auto',
  marginBottom: '24px',
};

const heading = {
  fontSize: '24px',
  letterSpacing: '-0.5px',
  lineHeight: '1.3',
  fontWeight: '400',
  color: '#484848',
  padding: '17px 0 0',
  textAlign: 'center' as const,
};

const paragraph = {
  margin: '0 0 15px',
  fontSize: '15px',
  lineHeight: '1.4',
  color: '#3c4149',
  padding: '0 40px',
};

const messageBox = {
  backgroundColor: '#f4f4f4',
  borderRadius: '4px',
  margin: '16px 40px',
  padding: '16px',
};

const quoteDetails = {
  backgroundColor: '#f9fafb',
  borderRadius: '8px',
  margin: '24px 40px',
  padding: '24px',
};

const detailLabel = {
  fontSize: '12px',
  color: '#6b7280',
  margin: '0 0 4px',
  textTransform: 'uppercase' as const,
};

const detailValue = {
  fontSize: '16px',
  color: '#111827',
  margin: '0 0 16px',
  fontWeight: '500',
};

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
};

const button = {
  backgroundColor: '#3b82f6',
  borderRadius: '6px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 24px',
};

const footer = {
  color: '#9ca3af',
  fontSize: '12px',
  textAlign: 'center' as const,
  marginTop: '48px',
};
```

---

## 6. PLAN D'IMPLÉMENTATION

### 6.1 Phases de Développement

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    PLAN D'IMPLÉMENTATION QUOTE-TO-CASH                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  PHASE 1: FONDATIONS (Sprint actuel - 5 jours)                              │
│  ─────────────────────────────────────────────                              │
│  Jour 1-2: Migrations SQL                                                   │
│    □ Créer tous les types ENUM                                              │
│    □ Créer table crm_quotes                                                 │
│    □ Créer table crm_quote_items                                            │
│    □ Migrer crm_contracts → crm_orders                                      │
│    □ Créer table crm_agreements                                             │
│    □ Créer index et contraintes                                             │
│    □ Activer RLS                                                            │
│    □ Tester migrations (up/down)                                            │
│                                                                             │
│  Jour 3: Services Core                                                      │
│    □ QuoteService (create, update, delete)                                  │
│    □ QuoteItemService                                                       │
│    □ Générateurs de références                                              │
│    □ Tests unitaires services                                               │
│                                                                             │
│  Jour 4: API Endpoints                                                      │
│    □ Routes CRUD quotes                                                     │
│    □ Routes quote items                                                     │
│    □ Validation schemas (Zod)                                               │
│    □ Tests API                                                              │
│                                                                             │
│  Jour 5: UI Quote List + Create                                             │
│    □ Page /crm/quotes                                                       │
│    □ Modal CreateQuote                                                      │
│    □ Composant QuoteItemsEditor                                             │
│    □ Tests E2E                                                              │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  PHASE 2: QUOTE WORKFLOW (Sprint suivant - 5 jours)                         │
│  ─────────────────────────────────────────────────                          │
│  Jour 1: Send Quote                                                         │
│    □ PDF Generator service                                                  │
│    □ Storage upload service                                                 │
│    □ Email service integration                                              │
│    □ API /quotes/:id/send                                                   │
│    □ UI bouton + modal Send                                                 │
│                                                                             │
│  Jour 2: Quote Viewing                                                      │
│    □ Page publique /quotes/view/:token                                      │
│    □ Tracking vue (first_viewed_at, view_count)                             │
│    □ Accept/Reject actions                                                  │
│    □ UI responsive                                                          │
│                                                                             │
│  Jour 3: Quote Versioning                                                   │
│    □ API /quotes/:id/new-version                                            │
│    □ API /quotes/:id/history                                                │
│    □ UI version comparison                                                  │
│    □ Tests                                                                  │
│                                                                             │
│  Jour 4: Conversion Quote → Order                                           │
│    □ API /quotes/:id/convert                                                │
│    □ Création automatique agreements                                        │
│    □ Update opportunity (won)                                               │
│    □ Notifications                                                          │
│                                                                             │
│  Jour 5: Order Management UI                                                │
│    □ Page /crm/orders                                                       │
│    □ Page /crm/orders/:id                                                   │
│    □ Statut timeline                                                        │
│    □ Tests E2E                                                              │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  PHASE 3: AGREEMENTS & SIGNATURE (Sprint +2 - 5 jours)                      │
│  ─────────────────────────────────────────────────────                      │
│  Jour 1-2: DocuSign Integration                                             │
│    □ DocuSign API client                                                    │
│    □ Template variables replacement                                         │
│    □ Envelope creation                                                      │
│    □ Webhook handler                                                        │
│                                                                             │
│  Jour 3: Agreement Workflow                                                 │
│    □ AgreementService                                                       │
│    □ API endpoints                                                          │
│    □ Statut tracking                                                        │
│    □ Signed document storage                                                │
│                                                                             │
│  Jour 4-5: Agreement UI                                                     │
│    □ Liste agreements sur order                                             │
│    □ Preview document                                                       │
│    □ Signature status                                                       │
│    □ Tests                                                                  │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  PHASE 4: BILLING ENTERPRISE (Sprint +3 - 5 jours)                          │
│  ─────────────────────────────────────────────────                          │
│  Jour 1: Migrations Billing                                                 │
│    □ Table bil_subscription_schedules                                       │
│    □ Table bil_subscription_schedule_phases                                 │
│    □ Table bil_amendments                                                   │
│    □ Index et contraintes                                                   │
│                                                                             │
│  Jour 2: Stripe Integration                                                 │
│    □ StripeClientService                                                    │
│    □ Customer sync                                                          │
│    □ Subscription Schedule sync                                             │
│    □ Webhook handlers                                                       │
│                                                                             │
│  Jour 3: Schedule Service                                                   │
│    □ SubscriptionScheduleService                                            │
│    □ Phase transitions                                                      │
│    □ API endpoints                                                          │
│                                                                             │
│  Jour 4: Amendment Service                                                  │
│    □ AmendmentService                                                       │
│    □ Proration calculation                                                  │
│    □ Stripe sync                                                            │
│    □ Approval workflow                                                      │
│                                                                             │
│  Jour 5: Billing UI                                                         │
│    □ Upgrade/downgrade modals                                               │
│    □ Amendment history                                                      │
│    □ Schedule timeline                                                      │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  PHASE 5: FULFILLMENT & AUTOMATION (Sprint +4 - 5 jours)                    │
│  ─────────────────────────────────────────────────────                      │
│  Jour 1-2: Order Fulfillment                                                │
│    □ OrderFulfillmentService                                                │
│    □ Tenant creation                                                        │
│    □ Clerk integration                                                      │
│    □ Subscription creation                                                  │
│                                                                             │
│  Jour 3: Invitations                                                        │
│    □ InvitationService                                                      │
│    □ Email templates                                                        │
│    □ Accept invitation flow                                                 │
│                                                                             │
│  Jour 4: CRON Jobs                                                          │
│    □ Quote expiration                                                       │
│    □ Order fulfillment                                                      │
│    □ Renewal reminders                                                      │
│    □ Auto-renewals                                                          │
│                                                                             │
│  Jour 5: Tests & Documentation                                              │
│    □ Tests E2E complets                                                     │
│    □ Documentation API                                                      │
│    □ Runbook opérations                                                     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 6.2 Estimation Effort

| Phase       | Composant            | Effort    | Priorité |
| ----------- | -------------------- | --------- | -------- |
| **Phase 1** | Migrations SQL       | 8h        | P0       |
|             | QuoteService         | 6h        | P0       |
|             | API Quotes           | 4h        | P0       |
|             | UI Quote List/Create | 6h        | P0       |
| **Phase 2** | PDF Generation       | 4h        | P0       |
|             | Send Quote           | 4h        | P0       |
|             | Quote Viewing        | 6h        | P0       |
|             | Quote Versioning     | 4h        | P1       |
|             | Convert to Order     | 6h        | P0       |
| **Phase 3** | DocuSign Integration | 12h       | P1       |
|             | Agreement Workflow   | 6h        | P1       |
|             | Agreement UI         | 6h        | P1       |
| **Phase 4** | Billing Migrations   | 6h        | P1       |
|             | Stripe Integration   | 12h       | P1       |
|             | Schedule Service     | 8h        | P1       |
|             | Amendment Service    | 8h        | P1       |
| **Phase 5** | Order Fulfillment    | 12h       | P0       |
|             | CRON Jobs            | 6h        | P1       |
|             | Tests E2E            | 8h        | P0       |
| **TOTAL**   |                      | **~120h** |          |

---

## 7. TESTS ET VALIDATION

### 7.1 Tests Unitaires

```typescript
// __tests__/services/quote.service.test.ts

import { describe, it, expect, beforeEach, vi } from "vitest";
import { quoteService } from "@/lib/services/crm/quote.service";
import { prisma } from "@/lib/db";

vi.mock("@/lib/db");

describe("QuoteService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createQuote", () => {
    it("should create a quote with items", async () => {
      const mockOpportunity = {
        id: "opp-123",
        stage: "proposal",
        lead: { country: "FR" },
        currency: "EUR",
      };

      (prisma.crm_opportunities.findUnique as any).mockResolvedValue(
        mockOpportunity
      );
      (prisma.$transaction as any).mockImplementation(async (fn: any) => {
        return fn({
          crm_quotes: {
            create: vi.fn().mockResolvedValue({ id: "quote-123" }),
          },
          crm_quote_items: {
            create: vi.fn().mockResolvedValue({}),
          },
        });
      });

      const result = await quoteService.createQuote({
        opportunityId: "opp-123",
        items: [
          {
            itemType: "plan",
            planId: "plan-123",
            name: "Enterprise Plan",
            quantity: 1,
            unitPrice: 199,
          },
        ],
        createdBy: "user-123",
      });

      expect(result).toBeDefined();
      expect(prisma.crm_opportunities.findUnique).toHaveBeenCalled();
    });

    it("should reject if opportunity is not in correct stage", async () => {
      const mockOpportunity = {
        id: "opp-123",
        stage: "prospecting", // Wrong stage
      };

      (prisma.crm_opportunities.findUnique as any).mockResolvedValue(
        mockOpportunity
      );

      await expect(
        quoteService.createQuote({
          opportunityId: "opp-123",
          items: [],
          createdBy: "user-123",
        })
      ).rejects.toThrow(
        "Opportunity must be in proposal, negotiation, or closing stage"
      );
    });
  });

  describe("sendQuote", () => {
    it("should send quote and update status", async () => {
      const mockQuote = {
        id: "quote-123",
        status: "draft",
        valid_until: new Date(Date.now() + 86400000),
        items: [{ id: "item-1" }],
        opportunity: { company_name: "Test Corp" },
      };

      (prisma.crm_quotes.findUnique as any).mockResolvedValue(mockQuote);
      (prisma.crm_quotes.update as any).mockResolvedValue({
        ...mockQuote,
        status: "sent",
      });

      // Mock PDF generation and email
      vi.mock("@/lib/services/documents/pdf-generator.service", () => ({
        generateQuotePDF: vi.fn().mockResolvedValue(Buffer.from("pdf")),
      }));

      const result = await quoteService.sendQuote({
        quoteId: "quote-123",
        recipientEmail: "test@example.com",
        recipientName: "Test User",
        sentBy: "user-123",
      });

      expect(prisma.crm_quotes.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: "sent" }),
        })
      );
    });
  });
});
```

### 7.2 Tests E2E

```typescript
// e2e/quote-workflow.spec.ts

import { test, expect } from "@playwright/test";

test.describe("Quote Workflow", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.fill('[name="email"]', "test@fleetcore.com");
    await page.fill('[name="password"]', "password");
    await page.click('button[type="submit"]');
    await page.waitForURL("/dashboard");
  });

  test("should create and send a quote", async ({ page }) => {
    // Navigate to opportunity
    await page.goto("/crm/opportunities/test-opp-id");

    // Create quote
    await page.click('button:has-text("Create Quote")');
    await page.waitForSelector('[data-testid="quote-modal"]');

    // Add plan
    await page.click('[data-testid="add-plan-button"]');
    await page.click('[data-testid="plan-enterprise"]');

    // Set validity
    await page.fill('[name="valid_days"]', "30");

    // Save quote
    await page.click('button:has-text("Create Quote")');
    await page.waitForURL(/\/crm\/quotes\/.*/);

    // Verify quote created
    await expect(page.locator('[data-testid="quote-status"]')).toHaveText(
      "Draft"
    );

    // Send quote
    await page.click('button:has-text("Send Quote")');
    await page.fill('[name="recipient_email"]', "customer@example.com");
    await page.click('button:has-text("Send")');

    // Verify sent
    await expect(page.locator('[data-testid="quote-status"]')).toHaveText(
      "Sent"
    );
  });

  test("should convert accepted quote to order", async ({ page }) => {
    // Navigate to accepted quote
    await page.goto("/crm/quotes/accepted-quote-id");

    // Verify status
    await expect(page.locator('[data-testid="quote-status"]')).toHaveText(
      "Accepted"
    );

    // Convert to order
    await page.click('button:has-text("Convert to Order")');
    await page.click('button:has-text("Confirm")');

    // Verify redirected to order
    await page.waitForURL(/\/crm\/orders\/.*/);
    await expect(page.locator('[data-testid="order-reference"]')).toContainText(
      "ORD-"
    );
    await expect(page.locator('[data-testid="order-status"]')).toHaveText(
      "Draft"
    );
  });
});
```

---

## 8. CHECKLIST DE DÉPLOIEMENT

### 8.1 Pré-déploiement

```markdown
## CHECKLIST PRÉ-DÉPLOIEMENT QUOTE-TO-CASH

### Base de données

- [ ] Backup complet de la production
- [ ] Migrations testées sur staging
- [ ] Rollback script préparé
- [ ] Index créés et vérifiés
- [ ] RLS policies actives

### Configuration

- [ ] Variables d'environnement ajoutées
  - [ ] STRIPE_SECRET_KEY
  - [ ] STRIPE_WEBHOOK_SECRET
  - [ ] DOCUSIGN_INTEGRATION_KEY
  - [ ] DOCUSIGN_SECRET_KEY
  - [ ] S3_BUCKET_DOCUMENTS
- [ ] Webhooks Stripe configurés
- [ ] Webhooks DocuSign configurés

### Tests

- [ ] Tests unitaires passent (100%)
- [ ] Tests intégration passent
- [ ] Tests E2E passent
- [ ] Tests de charge effectués
- [ ] Tests manuels validés

### Sécurité

- [ ] Permissions vérifiées
- [ ] Rate limiting configuré
- [ ] Input validation complète
- [ ] CORS configuré

### Documentation

- [ ] API documentation à jour
- [ ] Runbook opérationnel
- [ ] Guide utilisateur
- [ ] Notes de version

### Communication

- [ ] Équipe CS briefée
- [ ] Support formé
- [ ] Clients notifiés (si breaking changes)
```

### 8.2 Post-déploiement

```markdown
## CHECKLIST POST-DÉPLOIEMENT

### Validation immédiate (15 min)

- [ ] Application accessible
- [ ] Login fonctionne
- [ ] Page quotes accessible
- [ ] Création quote OK
- [ ] Envoi quote OK
- [ ] Webhooks Stripe reçus

### Validation complète (1h)

- [ ] Workflow complet Quote → Order
- [ ] Signature DocuSign
- [ ] Provisioning tenant
- [ ] Stripe subscription créée
- [ ] Emails envoyés

### Monitoring

- [ ] Logs sans erreurs critiques
- [ ] Métriques normales
- [ ] Alertes configurées
- [ ] Dashboard mis à jour

### Rollback si nécessaire

- [ ] Procédure rollback documentée
- [ ] Point de décision défini (ex: >5% erreurs)
- [ ] Communication rollback préparée
```

---

## 9. ANNEXES

### 9.1 Glossaire

| Terme                     | Définition                                                         |
| ------------------------- | ------------------------------------------------------------------ |
| **Quote**                 | Proposition commerciale formelle avec prix, conditions et validité |
| **Order**                 | Engagement commercial confirmé suite à acceptation du quote        |
| **Agreement**             | Document juridique (MSA, SLA, DPA) associé à un order              |
| **Subscription Schedule** | Planification multi-phases d'une subscription                      |
| **Amendment**             | Modification d'une subscription en cours                           |
| **Proration**             | Calcul proportionnel lors de changements mid-term                  |
| **MRR**                   | Monthly Recurring Revenue - Revenu mensuel récurrent               |
| **ARR**                   | Annual Recurring Revenue - Revenu annuel récurrent                 |
| **Fulfillment**           | Processus de provisioning tenant après signature                   |

### 9.2 Références

- [Stripe Billing Documentation](https://stripe.com/docs/billing)
- [Stripe Subscription Schedules](https://stripe.com/docs/billing/subscriptions/subscription-schedules)
- [DocuSign eSignature API](https://developers.docusign.com/)
- [Salesforce CPQ Best Practices](https://help.salesforce.com/s/articleView?id=sf.cpq_best_practices.htm)
- [Chargebee Revenue Recognition](https://www.chargebee.com/docs/2.0/revenue-recognition.html)

### 9.3 Contacts

| Rôle             | Nom     | Contact              |
| ---------------- | ------- | -------------------- |
| Product Owner    | Mohamed | -                    |
| Tech Lead        | Claude  | -                    |
| DevOps           | -       | -                    |
| Support Stripe   | -       | support@stripe.com   |
| Support DocuSign | -       | support@docusign.com |

---

**FIN DE LA PARTIE 3**

**RÉCAPITULATIF DES 3 PARTIES:**

| Partie       | Contenu                                                               | Pages |
| ------------ | --------------------------------------------------------------------- | ----- |
| **Partie 1** | Architecture, crm_quotes, crm_quote_items, crm_orders, crm_agreements | ~40   |
| **Partie 2** | bil_subscription_schedules, bil_amendments, Stripe Integration        | ~35   |
| **Partie 3** | Workflows, Services, APIs, Jobs CRON, Plan implémentation             | ~45   |
| **TOTAL**    | Spécification complète Quote-to-Cash Enterprise                       | ~120  |

_Cette spécification est prête pour implémentation par Claude Code._
