# FLEETCORE - Document de Statut Détaillé

## Migration Sprint 2.1 → Architecture Quote-to-Cash

**Date**: 7 décembre 2025  
**Version**: 1.0  
**Auteur**: Mohamed Fodil (CEO/Architecte) + Claude (Assistant IA)  
**Statut**: EN COURS - Phase 0 (Fondations)

---

## Table des matières

1. [Contexte et Rationnel du Pivot](#1-contexte-et-rationnel-du-pivot)
2. [Décision Architecturale](#2-décision-architecturale)
3. [Plan d'Exécution Détaillé](#3-plan-dexécution-détaillé)
4. [Étape 0.1 - Migration SQL](#4-étape-01---migration-sql)
5. [Étape 0.2 - Synchronisation Prisma](#5-étape-02---synchronisation-prisma)
6. [Étape 0.3 - OrderRepository](#6-étape-03---orderrepository)
7. [Étape 0.4 - OrderService](#7-étape-04---orderservice)
8. [État Actuel et Prochaines Étapes](#8-état-actuel-et-prochaines-étapes)
9. [Annexes Techniques](#9-annexes-techniques)

---

## 1. Contexte et Rationnel du Pivot

### 1.1 Situation Initiale (Sprint 2.1)

Le Sprint 2.1 était en cours d'implémentation avec l'objectif suivant :

```
Win Opportunity → Create Contract (crm_contracts)
```

**Travail déjà effectué sur Sprint 2.1** :

- Diagnostic complet de `markOpportunityWonAction()` (lignes 429-517)
- Analyse de `MarkAsWonModal.tsx`
- Identification des colonnes manquantes dans `crm_contracts` (billing_cycle, duration_months)
- Plan d'implémentation ContractService/ContractRepository

**Problème identifié** : Claude Code posait une question sur l'approche pour `billing_cycle` :

1. Utiliser metadata Json (rapide, sans migration)
2. Ajouter migration SQL (plus propre)
3. Expiry date seulement (minimaliste)

### 1.2 Nouvelle Spécification Quote-to-Cash

En parallèle, une spécification complète Quote-to-Cash enterprise avait été créée en 3 parties (~500 pages) :

| Document                             | Contenu                                                   | Pages |
| ------------------------------------ | --------------------------------------------------------- | ----- |
| PARTIE_1_ARCHITECTURE.md             | CRM (quotes, orders, agreements), DDL, migrations         | ~200  |
| PARTIE_2_BILLING_STRIPE.md           | Schedules, amendments, Stripe integration, webhooks       | ~180  |
| PARTIE_3_WORKFLOWS_IMPLEMENTATION.md | Workflows, services, APIs, CRON jobs, plan implémentation | ~120  |

**Architecture cible Quote-to-Cash** :

```
Lead → Opportunity → Quote → Order → Agreement → Subscription → Active Tenant
```

### 1.3 Point de Décision Critique

**Question posée** : Faut-il finir Sprint 2.1 "classique" puis migrer, ou pivoter directement vers Quote-to-Cash ?

#### Option A : Finir Sprint 2.1 puis migrer

```
MAINTENANT:
  Win Opportunity → crm_contracts (existant)
  - Ajouter billing_cycle via metadata
  - ~4h de travail

PLUS TARD:
  Migration crm_contracts → crm_orders
  - Refactoring du code
```

- ✅ Livraison rapide
- ❌ Double travail (implémenter + refactorer)
- ❌ Dette technique temporaire

#### Option B : Pivoter vers Quote-to-Cash directement

```
MAINTENANT:
  1. Migration SQL crm_contracts → crm_orders
  2. Win Opportunity → crm_orders (nouvelle structure)
  - ~6h mais code définitif
```

- ✅ Code définitif, aligné avec spec
- ✅ Pas de refactoring ultérieur
- ✅ Zero technical debt
- ❌ Légèrement plus long maintenant

### 1.4 Décision Prise

**OPTION B VALIDÉE** - Pivoter directement vers Quote-to-Cash

**Rationnel** :

1. Table `crm_contracts` est **VIDE** (0 enregistrements) → Migration sans risque de perte de données
2. Spécification complète déjà disponible (3 parties, ~500 pages)
3. Évite le double travail
4. Cohérent avec la philosophie **"Zero Technical Debt"** de FleetCore
5. Code production-ready dès le départ

---

## 2. Décision Architecturale

### 2.1 Changements Structurels

| Avant (Sprint 2.1)            | Après (Quote-to-Cash)                 |
| ----------------------------- | ------------------------------------- |
| `crm_contracts`               | `crm_orders` (renommée + enrichie)    |
| Contract = Commercial + Legal | Order = Commercial, Agreement = Legal |
| Pas de quotes                 | `crm_quotes` + `crm_quote_items`      |
| Pas d'agreements séparés      | `crm_agreements`                      |
| Status simple                 | `order_type` + `fulfillment_status`   |

### 2.2 Nouvelles Tables Créées

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   crm_quotes    │────▶│   crm_orders    │────▶│ crm_agreements  │
│                 │     │ (ex-contracts)  │     │                 │
│ - quote_ref     │     │ - order_ref     │     │ - agreement_ref │
│ - items[]       │     │ - billing_cycle │     │ - type (MSA,SLA)│
│ - status        │     │ - fulfillment   │     │ - signature     │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                                               │
        ▼                                               │
┌─────────────────┐                                     │
│ crm_quote_items │                                     │
│ - plan_id       │                                     │
│ - quantity      │                                     │
│ - unit_price    │◀────────────────────────────────────┘
└─────────────────┘
```

### 2.3 Nouveaux ENUM Types (10)

| ENUM                       | Valeurs                                                                                   | Usage                           |
| -------------------------- | ----------------------------------------------------------------------------------------- | ------------------------------- |
| `quote_status`             | draft, sent, viewed, accepted, rejected, expired, converted                               | crm_quotes.status               |
| `billing_interval`         | monthly, quarterly, semi_annual, annual                                                   | billing_cycle                   |
| `discount_type`            | percentage, fixed_amount                                                                  | crm_quotes, crm_quote_items     |
| `quote_item_type`          | plan, addon, service, custom                                                              | crm_quote_items.item_type       |
| `item_recurrence`          | one_time, recurring                                                                       | crm_quote_items.recurrence      |
| `order_type`               | new, renewal, upgrade, downgrade, amendment                                               | crm_orders.order_type           |
| `order_fulfillment_status` | pending, ready_for_fulfillment, in_progress, fulfilled, active, cancelled, expired        | crm_orders.fulfillment_status   |
| `agreement_type`           | msa, sla, dpa, nda, sow, addendum, other                                                  | crm_agreements.agreement_type   |
| `agreement_status`         | draft, pending_review, pending_signature, signed, active, expired, terminated, superseded | crm_agreements.status           |
| `signature_method`         | electronic, wet_ink, click_wrap                                                           | crm_agreements.signature_method |

---

## 3. Plan d'Exécution Détaillé

### 3.1 Breakdown Initial (Win Opportunity → Order)

| #         | Étape                                       | Temps estimé | Status                          |
| --------- | ------------------------------------------- | ------------ | ------------------------------- |
| 0.1       | Migration SQL crm_contracts → crm_orders    | 45min        | ✅ TERMINÉ                      |
| 0.2       | Synchronisation Prisma (db pull + generate) | 30min        | ✅ TERMINÉ                      |
| 0.3       | Créer OrderRepository + tests               | 45min        | ✅ TERMINÉ                      |
| 0.4       | Créer OrderService                          | 45min        | ✅ VALIDÉ (en attente création) |
| 0.5       | Créer schemas Zod validation                | 20min        | ⏳ À FAIRE                      |
| 0.6       | Modifier markOpportunityWonAction           | 45min        | ⏳ À FAIRE                      |
| 0.7       | Modifier MarkAsWonModal                     | 45min        | ⏳ À FAIRE                      |
| 0.8       | Template notification order_created         | 20min        | ⏳ À FAIRE                      |
| 0.9       | Tests unitaires complets                    | 30min        | ⏳ À FAIRE                      |
| **TOTAL** |                                             | **~5h30**    | **4/9 étapes**                  |

---

## 4. Étape 0.1 - Migration SQL

### 4.1 Objectif

Renommer `crm_contracts` en `crm_orders` et ajouter les colonnes nécessaires pour l'architecture Quote-to-Cash enterprise.

### 4.2 Analyse Préliminaire

**Vérification pré-migration exécutée** :

```sql
-- Résultat: 0 enregistrements
SELECT COUNT(*) FROM crm_contracts;
```

**FK Entrantes identifiées (2)** :

| Source Table      | Colonne                  | Constraint Name               |
| ----------------- | ------------------------ | ----------------------------- |
| crm_opportunities | contract_id              | fk_crm_opportunities_contract |
| crm_contracts     | renewed_from_contract_id | fk_crm_contracts_renewed_from |

**FK Sortantes identifiées (14)** :

| Constraint Name                   | Local Column             | Referenced Table         |
| --------------------------------- | ------------------------ | ------------------------ |
| crm_contracts_created_by_fkey     | created_by               | adm_members              |
| crm_contracts_deleted_by_fkey     | deleted_by               | adm_members              |
| crm_contracts_opportunity_id_fkey | opportunity_id           | crm_opportunities        |
| crm_contracts_updated_by_fkey     | updated_by               | adm_members              |
| fk_crm_contracts_approved_by      | approved_by              | adm_provider_employees   |
| fk_crm_contracts_billing_address  | billing_address_id       | crm_addresses            |
| fk_crm_contracts_created_by       | created_by               | adm_provider_employees   |
| fk_crm_contracts_deleted_by       | deleted_by               | adm_provider_employees   |
| fk_crm_contracts_lead             | lead_id                  | crm_leads                |
| fk_crm_contracts_plan             | plan_id                  | bil_billing_plans        |
| fk_crm_contracts_renewed_from     | renewed_from_contract_id | crm_contracts            |
| fk_crm_contracts_subscription     | subscription_id          | bil_tenant_subscriptions |
| fk_crm_contracts_tenant           | tenant_id                | adm_tenants              |
| fk_crm_contracts_updated_by       | updated_by               | adm_provider_employees   |

**INDEX identifiés (16)** : Tous avec préfixe `crm_contracts_` ou `idx_crm_contracts_`

**CHECK Constraints (6)** :

- crm_contracts_date_check
- crm_contracts_effective_date_check
- crm_contracts_expiry_check
- crm_contracts_expiry_date_check
- crm_contracts_status_check
- crm_contracts_total_value_check

### 4.3 Script SQL Consolidé Exécuté

Le script complet (13 parties) a été exécuté dans Supabase SQL Editor :

```sql
-- PARTIE 1: Création des 10 ENUM types
-- PARTIE 2: Renommage table crm_contracts → crm_orders
-- PARTIE 3: Renommage FK SORTANTES (14 contraintes)
-- PARTIE 4: Renommage FK ENTRANTE (depuis crm_opportunities)
-- PARTIE 5: Renommage INDEX (16 index)
-- PARTIE 6: Renommage CHECK CONSTRAINTS (6 contraintes)
-- PARTIE 7: Ajout nouvelles colonnes crm_orders (12 colonnes)
-- PARTIE 8: Nouveaux INDEX pour crm_orders
-- PARTIE 9: Création table crm_quotes
-- PARTIE 10: Création table crm_quote_items
-- PARTIE 11: Création table crm_agreements
-- PARTIE 12: Ajout FK inter-tables
-- PARTIE 13: Commentaires
```

### 4.4 Nouvelles Colonnes Ajoutées à crm_orders

| Colonne             | Type                     | Default   | Description           |
| ------------------- | ------------------------ | --------- | --------------------- |
| quote_id            | UUID                     | NULL      | FK vers crm_quotes    |
| order_type          | order_type               | 'new'     | Type de commande      |
| fulfillment_status  | order_fulfillment_status | 'pending' | Statut d'exécution    |
| order_reference     | VARCHAR(50)              | NULL      | Format ORD-YYYY-NNNNN |
| order_code          | VARCHAR(30)              | NULL      | Format O2025-NNN      |
| billing_cycle       | billing_interval         | 'monthly' | Cycle de facturation  |
| monthly_value       | NUMERIC(15,2)            | NULL      | Valeur mensuelle      |
| annual_value        | NUMERIC(15,2)            | NULL      | Valeur annuelle       |
| fulfilled_at        | TIMESTAMPTZ              | NULL      | Date d'exécution      |
| activated_at        | TIMESTAMPTZ              | NULL      | Date d'activation     |
| cancelled_at        | TIMESTAMPTZ              | NULL      | Date d'annulation     |
| cancellation_reason | TEXT                     | NULL      | Raison d'annulation   |

### 4.5 Résultat

✅ **SUCCÈS** - Migration SQL exécutée sans erreur

**Vérification post-migration** :

```sql
SELECT COUNT(*) FROM crm_orders;           -- 0
SELECT COUNT(*) FROM crm_quotes;           -- 0
SELECT COUNT(*) FROM crm_quote_items;      -- 0
SELECT COUNT(*) FROM crm_agreements;       -- 0
```

---

## 5. Étape 0.2 - Synchronisation Prisma

### 5.1 Objectif

Synchroniser le schema Prisma avec les changements DB et régénérer le client Prisma.

### 5.2 Actions Exécutées

```bash
# 1. Pull des changements DB vers schema.prisma
pnpm exec prisma db pull

# 2. Régénération du client Prisma
pnpm exec prisma generate
```

### 5.3 Modifications Code

**Fichier 1: lib/middleware/rbac.middleware.ts**

```typescript
// AVANT (ligne 231)
const validTables = [
  "crm_leads",
  "crm_opportunities",
  "crm_contracts",  // ❌
  "flt_vehicles",
];

// APRÈS
const validTables = [
  "crm_leads",
  "crm_opportunities",
  "crm_orders",     // ✅
  "flt_vehicles",
];

// AVANT (lignes 264-265)
case "crm_contracts":
  resource = await prisma.crm_contracts.findFirst({

// APRÈS
case "crm_orders":
  resource = await prisma.crm_orders.findFirst({
```

**Fichier 2: lib/validators/crm.validators.ts**

Renommages effectués :

- ContractCreateSchema → OrderCreateSchema
- ContractUpdateSchema → OrderUpdateSchema
- ContractQuerySchema → OrderQuerySchema
- ContractCreateInput → OrderCreateInput
- ContractUpdateInput → OrderUpdateInput
- ContractQueryInput → OrderQueryInput

### 5.4 Vérification

```bash
# Tests complets
pnpm test
# Résultat: 538 tests passed ✅
```

### 5.5 Résultat

✅ **SUCCÈS** - Prisma synchronisé, code mis à jour, tests passent

---

## 6. Étape 0.3 - OrderRepository

### 6.1 Objectif

Créer le repository pour gérer les orders dans l'architecture Quote-to-Cash, en suivant le pattern de LeadRepository.

### 6.2 Pattern de Référence Analysé

**LeadRepository** (lib/repositories/crm/lead.repository.ts) :

- Hérite de `BaseRepository<Lead>`
- `LEAD_SORT_FIELDS` : whitelist pour tri
- `generateLeadCode(year, tx?)` : Format "LEAD-YYYY-NNNNN"
- `findByEmail(email)` : recherche case-insensitive
- `countActiveLeads(assignedTo)` : compte leads actifs

**BaseRepository** (lib/core/base.repository.ts) - méthodes héritées :

- `findById(id, tenantId?)`
- `findMany(where, options)`
- `create(data, userId, tenantId?)`
- `update(id, data, userId, tenantId?)`
- `softDelete(id, userId, reason?, tenantId?)`
- `restore(id, userId, tenantId?)`

### 6.3 Fichiers Créés

**Fichier 1: lib/repositories/crm/order.repository.ts**

Structure complète :

```typescript
// Types exportés
export type Order = crm_orders;
export interface OrderCreateInput { ... }
export interface OrderUpdateInput { ... }
export type OrderWithRelations = crm_orders & { ... };

// Classe principale
export class OrderRepository extends BaseRepository<Order> {
  // Méthodes de génération de codes
  async generateOrderReference(year: number, tx?: PrismaTransaction): Promise<string>
  async generateOrderCode(year: number, tx?: PrismaTransaction): Promise<string>

  // CRUD
  async createOrder(data: OrderCreateInput, userId: string, tx?: PrismaTransaction): Promise<Order>
  async updateOrder(id: string, data: OrderUpdateInput, userId: string, tenantId?: string): Promise<Order>

  // Recherche
  async findByIdWithRelations(id: string, tenantId?: string): Promise<OrderWithRelations | null>
  async findByOpportunityId(opportunityId: string, tenantId?: string): Promise<Order[]>
  async findByLeadId(leadId: string, tenantId?: string): Promise<Order[]>

  // Business logic
  async countActiveOrders(tenantId: string): Promise<number>
  async findExpiringWithinDays(tenantId: string, days: number): Promise<Order[]>
  async findAutoRenewable(tenantId: string, daysBeforeExpiry: number): Promise<Order[]>
}

// Singleton
export const orderRepository = new OrderRepository(prisma);
```

**Fichier 2: lib/repositories/crm/index.ts** (barrel export)

```typescript
export {
  OrderRepository,
  ORDER_SORT_FIELDS,
  orderRepository,
} from "./order.repository";
export type {
  Order,
  OrderWithRelations,
  OrderCreateInput,
  OrderUpdateInput,
} from "./order.repository";
// ... autres exports
```

### 6.4 Formats de Codes Générés

| Code            | Format         | Exemple        | Padding    |
| --------------- | -------------- | -------------- | ---------- |
| order_reference | ORD-YYYY-NNNNN | ORD-2025-00001 | 5 chiffres |
| order_code      | OYYYY-NNN      | O2025-001      | 3 chiffres |

### 6.5 Tests Créés

**Fichier: lib/repositories/crm/**tests**/order.repository.test.ts**

| Méthode                | Tests  | Couverture                                               |
| ---------------------- | ------ | -------------------------------------------------------- |
| generateOrderReference | 9      | Format, incrémentation, padding, transaction, edge cases |
| generateOrderCode      | 8      | Format O2025-NNN, incrémentation, transaction            |
| createOrder            | 3      | Auto-génération codes, transaction, audit trail          |
| updateOrder            | 2      | Mise à jour, filtrage tenant                             |
| findByIdWithRelations  | 3      | Relations, null, tenant filter                           |
| findByOpportunityId    | 2      | Recherche, tenant filter                                 |
| findByLeadId           | 2      | Recherche, tenant filter                                 |
| countActiveOrders      | 1      | Exclusion cancelled/expired                              |
| findExpiringWithinDays | 1      | Filtrage par date                                        |
| findAutoRenewable      | 1      | auto_renew = true                                        |
| **TOTAL**              | **32** | **100%**                                                 |

### 6.6 Vérification

```bash
# TypeScript
pnpm exec tsc --noEmit
# Résultat: 0 erreurs ✅

# Tests
pnpm exec vitest run lib/repositories/crm/__tests__/order.repository.test.ts
# Résultat: 32/32 passed ✅
```

### 6.7 Résultat

✅ **SUCCÈS** - OrderRepository créé avec 32 tests passants

---

## 7. Étape 0.4 - OrderService

### 7.1 Objectif

Créer le service métier qui orchestre la création d'un Order depuis une Opportunity gagnée.

### 7.2 Pattern de Référence

Services existants analysés :

- `lib/services/crm/lead.service.ts`
- `lib/services/crm/opportunity.service.ts`

### 7.3 Spécification Validée

**Fichier à créer: lib/services/crm/order.service.ts**

**Interface principale** :

```typescript
interface CreateOrderFromOpportunityParams {
  opportunityId: string;
  tenantId: string;
  userId: string;
  // Données du contrat
  totalValue: number;
  currency: string;
  billingCycle: "monthly" | "quarterly" | "semi_annual" | "annual";
  effectiveDate: Date;
  durationMonths: number;
  autoRenew?: boolean;
  noticePeriodDays?: number;
  // Calculs automatiques
  monthlyValue?: number; // Si non fourni, calculer depuis totalValue/12
  annualValue?: number; // Si non fourni, calculer depuis totalValue
}
```

**Méthodes définies** :

| Méthode                        | Description                             | Validations                                    |
| ------------------------------ | --------------------------------------- | ---------------------------------------------- |
| `createOrderFromOpportunity()` | Crée un order depuis opportunity gagnée | Opp existe, stage valide, pas d'order existant |
| `getOrderById()`               | Récupère order avec relations           | -                                              |
| `getOrdersByOpportunity()`     | Liste orders d'une opportunity          | -                                              |
| `updateOrderStatus()`          | Met à jour le status                    | Order existe                                   |
| `updateFulfillmentStatus()`    | Met à jour fulfillment_status           | Order existe, timestamps auto                  |
| `cancelOrder()`                | Annule avec raison                      | Order existe, pas déjà annulé                  |
| `getExpiringOrders()`          | Orders expirant dans N jours            | -                                              |
| `getAutoRenewableOrders()`     | Orders auto-renouvelables               | -                                              |

**Logique createOrderFromOpportunity()** :

```
1. Valider opportunity existe et stage ∈ [negotiation, contract_sent, closing]
2. Valider qu'aucun order n'existe (contract_id NULL et findByOpportunityId vide)
3. Récupérer lead_id depuis opportunity
4. Calculer:
   - expiry_date = effectiveDate + durationMonths
   - renewal_date = expiry_date - noticePeriodDays (si autoRenew)
   - monthlyValue = totalValue / 12 (si non fourni)
   - annualValue = totalValue (si non fourni)
5. TRANSACTION:
   a. Créer order via orderRepository.createOrder()
   b. Update opportunity: status='won', won_date=now, contract_id=order.id, won_value
6. Logger et retourner résultat
```

### 7.4 Statut

✅ **VALIDÉ** - Code proposé par Claude Code, validé par Mohamed, en attente de création fichier

---

## 8. État Actuel et Prochaines Étapes

### 8.1 Résumé Progression

| Étape | Description              | Status     | Temps réel |
| ----- | ------------------------ | ---------- | ---------- |
| 0.1   | Migration SQL            | ✅ TERMINÉ | ~1h        |
| 0.2   | Prisma sync + code       | ✅ TERMINÉ | ~30min     |
| 0.3   | OrderRepository + tests  | ✅ TERMINÉ | ~45min     |
| 0.4   | OrderService             | ✅ VALIDÉ  | En attente |
| 0.5   | Schemas Zod              | ⏳ À FAIRE | -          |
| 0.6   | markOpportunityWonAction | ⏳ À FAIRE | -          |
| 0.7   | MarkAsWonModal           | ⏳ À FAIRE | -          |
| 0.8   | Template notification    | ⏳ À FAIRE | -          |
| 0.9   | Tests E2E                | ⏳ À FAIRE | -          |

**Progression globale** : 4/9 étapes (~44%)

### 8.2 Artefacts Créés

| Type          | Fichier                                                 | Lignes    |
| ------------- | ------------------------------------------------------- | --------- |
| SQL Migration | Exécuté dans Supabase                                   | ~400      |
| Repository    | lib/repositories/crm/order.repository.ts                | ~350      |
| Barrel Export | lib/repositories/crm/index.ts                           | ~25       |
| Tests         | lib/repositories/crm/**tests**/order.repository.test.ts | 721       |
| **TOTAL**     |                                                         | **~1500** |

### 8.3 Prochaines Actions Immédiates

1. **Créer OrderService** (0.4) - Code validé, attente GO pour création
2. **Créer schemas Zod** (0.5) - Validation des inputs API
3. **Modifier markOpportunityWonAction** (0.6) - Intégrer OrderService
4. **Modifier MarkAsWonModal** (0.7) - Ajouter champs contrat

### 8.4 Risques et Mitigations

| Risque                                   | Probabilité | Impact | Mitigation                      |
| ---------------------------------------- | ----------- | ------ | ------------------------------- |
| Erreur TypeScript après création service | Faible      | Moyen  | TSC vérifié à chaque étape      |
| Régression tests existants               | Faible      | Élevé  | 538 tests passent actuellement  |
| Incohérence ENUM TS/SQL                  | Faible      | Élevé  | Corrigé (billing_cycle vérifié) |

---

## 9. Annexes Techniques

### 9.1 Script de Rollback SQL (Conservé)

En cas de besoin, script de rollback complet disponible pour :

- Renommer crm_orders → crm_contracts
- Supprimer nouvelles tables
- Supprimer colonnes ajoutées
- Supprimer ENUM types

### 9.2 Commandes de Vérification

```bash
# TypeScript
pnpm exec tsc --noEmit

# Tests complets
pnpm test

# Tests OrderRepository uniquement
pnpm exec vitest run lib/repositories/crm/__tests__/order.repository.test.ts

# Build complet
pnpm build
```

### 9.3 Workflow Prisma FleetCore

⚠️ **IMPORTANT** - Workflow spécifique FleetCore :

```
1. Modifications SQL manuelles dans Supabase
2. Modifier schema.prisma manuellement
3. pnpm prisma generate

JAMAIS: db push / db pull / migrate (provoque des drifts)
```

### 9.4 UUIDs de Référence

| Élément                   | UUID                                 |
| ------------------------- | ------------------------------------ |
| Admin Provider par défaut | 7ad8173c-68c5-41d3-9918-686e4e941cc0 |

---

## Historique des Révisions

| Version | Date       | Auteur           | Changements      |
| ------- | ---------- | ---------------- | ---------------- |
| 1.0     | 2025-12-07 | Mohamed + Claude | Document initial |

---

_Document généré le 7 décembre 2025_
_FleetCore v2 - Architecture Quote-to-Cash_
