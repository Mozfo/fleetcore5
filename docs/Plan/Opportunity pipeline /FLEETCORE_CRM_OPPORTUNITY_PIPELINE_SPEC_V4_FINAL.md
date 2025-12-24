# FLEETCORE - SPÉCIFICATION COMPLÈTE

## CRM OPPORTUNITY PIPELINE & QUOTE-TO-CASH INTÉGRÉ

**Version :** 4.0.0 FINAL  
**Date :** 23 Décembre 2025  
**Statut :** SPÉCIFICATION VALIDÉE - MVP DEMO INVESTOR  
**Auteur :** Architecture FleetCore

---

## ⚠️ DOCUMENT DE RÉFÉRENCE UNIQUE

Ce document est la **seule source de vérité** pour le développement du CRM FleetCore.
Il remplace et annule tous les documents précédents (V1, V2, V3).

**Règle absolue :** Tout développement DOIT suivre ce document. Aucune improvisation.

---

## TABLE DES MATIÈRES

1. [Synthèse Best Practices Industrie](#1-synthèse-best-practices-industrie)
2. [Architecture Mutualisée](#2-architecture-mutualisée)
3. [Flux Quote-to-Cash Corrigé](#3-flux-quote-to-cash-corrigé)
4. [Golden Data Page - Browser 360°](#4-golden-data-page---browser-360)
5. [Composants Partagés](#5-composants-partagés)
6. [Numérotation Système Unifiée](#6-numérotation-système-unifiée)
7. [Plan d'Exécution (7 Phases)](#7-plan-dexécution-7-phases)
8. [Tests Obligatoires](#8-tests-obligatoires)
9. [Checklist de Validation Finale](#9-checklist-de-validation-finale)

---

## 1. SYNTHÈSE BEST PRACTICES INDUSTRIE

### 1.1 Sources Analysées

| Source         | Type                  | Enseignements Clés                                   |
| -------------- | --------------------- | ---------------------------------------------------- |
| **Salesforce** | Leader CRM Enterprise | Activity Timeline, Opportunity Teams, Quote-to-Order |
| **HubSpot**    | Leader CRM Mid-Market | Deal stages automation, Contact 360°                 |
| **Pipedrive**  | Spécialiste Sales     | Activity-based selling, Deal rotting                 |
| **Freshsales** | CRM moderne           | Customer 360 view, Scoring intégré                   |

### 1.2 Patterns Universels Adoptés

#### Pattern 1 : Customer 360° View

> **Définition :** Vue unifiée consolidant TOUTES les interactions client en un seul endroit.

**Application FleetCore :**

- Page Browser = Golden Data Page
- Timeline unifiée Lead + Opportunity
- Documents, Quotes, Activities au même endroit

#### Pattern 2 : Activity-Based Selling

> **Définition :** Le pipeline avance via des ACTIONS concrètes, pas juste des statuts.

**Application FleetCore :**

- Table `crm_activities` unifiée (Lead + Opportunity)
- Types : Call, Email, Note, Meeting, Task
- "Next Activity" visible sur chaque deal

#### Pattern 3 : Quote as Child of Opportunity

> **Définition :** Le Quote appartient à l'Opportunity, pas un module séparé.

**Application FleetCore :**

- Bouton "Create Quote" dans OpportunityDrawer
- Pas de page /crm/quotes standalone
- Quote accepted → Opportunity Won (automatique)

#### Pattern 4 : Shared Components

> **Définition :** Éviter la duplication de code entre Lead et Opportunity.

**Application FleetCore :**

- Composants partagés dans `/components/crm/shared/`
- Table `crm_activities` unique (polymorphique)
- API Export générique
- Hooks réutilisables

### 1.3 Fonctionnalités Standard CRM

| Fonctionnalité            | Industrie   | FleetCore Status |
| ------------------------- | ----------- | ---------------- |
| Kanban Pipeline           | ✅ Standard | ✅ Implémenté    |
| Activity Timeline         | ✅ Standard | 🔴 Phase 2       |
| Record 360° Page          | ✅ Standard | 🔴 Phase 7       |
| Quick Edit Panel (Drawer) | ✅ Standard | ✅ Phase 1       |
| Bulk Actions              | ✅ Standard | 🔴 Phase 3       |
| Quote from Opportunity    | ✅ Standard | 🔴 Phase 4       |
| Export CSV/Excel          | ✅ Standard | 🔴 Phase 3       |
| Saved Views               | ✅ Standard | 🔴 Phase 6       |
| Deal Rotting              | ✅ Standard | ✅ Implémenté    |

---

## 2. ARCHITECTURE MUTUALISÉE

### 2.1 Principe de Mutualisation

```
❌ AVANT (Approche dupliquée)
├── crm_lead_activities          → Table séparée
├── crm_opportunity_activities   → Table séparée (à créer)
├── LeadTimeline.tsx             → Composant séparé
├── OpportunityTimeline.tsx      → Composant séparé (à créer)
├── leads/export API             → API séparée
└── opportunities/export API     → API séparée (à créer)

✅ APRÈS (Approche mutualisée)
├── crm_activities               → Table UNIQUE polymorphique
├── ActivityTimeline.tsx         → Composant UNIQUE réutilisable
├── /api/v1/crm/export           → API UNIQUE avec paramètre entity
└── components/crm/shared/       → Composants partagés
```

### 2.2 Table Activités Unifiée

```sql
-- TABLE UNIQUE pour toutes les activités CRM
CREATE TABLE crm_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Liens polymorphiques (au moins un requis)
  lead_id UUID REFERENCES crm_leads(id) ON DELETE CASCADE,
  opportunity_id UUID REFERENCES crm_opportunities(id) ON DELETE CASCADE,

  -- Métadonnées
  provider_id UUID NOT NULL REFERENCES adm_providers(id),
  activity_type VARCHAR(50) NOT NULL CHECK (activity_type IN ('call', 'email', 'note', 'meeting', 'task')),

  -- Contenu
  subject VARCHAR(255) NOT NULL,
  description TEXT,
  activity_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  duration_minutes INTEGER,
  outcome VARCHAR(100),

  -- Statut (pour tasks/meetings)
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,

  -- Audit
  created_by UUID REFERENCES adm_provider_employees(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Contrainte : au moins un lien requis
  CONSTRAINT chk_entity_link CHECK (lead_id IS NOT NULL OR opportunity_id IS NOT NULL)
);

-- Index pour performance
CREATE INDEX idx_activities_lead ON crm_activities(lead_id) WHERE lead_id IS NOT NULL;
CREATE INDEX idx_activities_opportunity ON crm_activities(opportunity_id) WHERE opportunity_id IS NOT NULL;
CREATE INDEX idx_activities_provider ON crm_activities(provider_id);
CREATE INDEX idx_activities_date ON crm_activities(activity_date DESC);
CREATE INDEX idx_activities_type ON crm_activities(activity_type);
```

### 2.3 Scénarios de Liaison Activités

| Scénario                                      | lead_id          | opportunity_id | Explication            |
| --------------------------------------------- | ---------------- | -------------- | ---------------------- |
| Activité sur Lead non converti                | ✅ UUID          | NULL           | Lead seul              |
| Activité sur Opportunity (créée manuellement) | NULL             | ✅ UUID        | Opportunity sans Lead  |
| Lead converti, activité existante             | ✅ UUID          | ✅ UUID        | Activité liée aux deux |
| Nouvelle activité post-conversion             | ✅ UUID (hérité) | ✅ UUID        | Double liaison         |

### 2.4 Table Vues Sauvegardées Unifiée

```sql
CREATE TABLE crm_saved_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Type d'entité
  entity_type VARCHAR(50) NOT NULL CHECK (entity_type IN ('lead', 'opportunity', 'quote')),

  -- Métadonnées
  name VARCHAR(100) NOT NULL,
  description TEXT,

  -- Configuration
  filters JSONB NOT NULL DEFAULT '{}',
  columns JSONB,
  sort_by VARCHAR(100),
  sort_order VARCHAR(4) DEFAULT 'desc',

  -- Propriétaire
  user_id UUID NOT NULL REFERENCES adm_provider_employees(id),
  provider_id UUID NOT NULL REFERENCES adm_providers(id),

  -- Flags
  is_default BOOLEAN DEFAULT false,
  is_shared BOOLEAN DEFAULT false,

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Contrainte : un seul default par user/entity
  CONSTRAINT unique_default_view UNIQUE (user_id, entity_type, is_default)
    DEFERRABLE INITIALLY DEFERRED
);

CREATE INDEX idx_saved_views_user ON crm_saved_views(user_id, entity_type);
```

### 2.5 Table Séquences Unifiée

```sql
CREATE TABLE crm_sequences (
  entity_type VARCHAR(50) PRIMARY KEY,
  prefix VARCHAR(10) NOT NULL,
  current_value INTEGER DEFAULT 0,
  padding INTEGER DEFAULT 6,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed des séquences
INSERT INTO crm_sequences (entity_type, prefix, current_value) VALUES
  ('lead', 'L', 0),
  ('opportunity', 'O', 0),
  ('quote', 'Q', 0),
  ('order', 'ORD', 0);

-- Fonction de génération de code
CREATE OR REPLACE FUNCTION generate_entity_code(p_entity_type VARCHAR)
RETURNS VARCHAR AS $$
DECLARE
  v_prefix VARCHAR(10);
  v_new_value INTEGER;
  v_padding INTEGER;
BEGIN
  UPDATE crm_sequences
  SET current_value = current_value + 1, updated_at = NOW()
  WHERE entity_type = p_entity_type
  RETURNING prefix, current_value, padding INTO v_prefix, v_new_value, v_padding;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Unknown entity type: %', p_entity_type;
  END IF;

  RETURN v_prefix || '-' || LPAD(v_new_value::TEXT, v_padding, '0');
END;
$$ LANGUAGE plpgsql;
```

### 2.6 Structure des Composants Partagés

```
components/crm/shared/
├── ActivityTimeline.tsx         # Timeline générique (lead_id? | opportunity_id?)
├── CreateActivityModal.tsx      # Modal création activité
├── BulkActionsBar.tsx          # Barre actions bulk générique
├── BulkAssignModal.tsx         # Modal assignation bulk
├── BulkDeleteModal.tsx         # Modal suppression bulk
├── AdvancedFilters.tsx         # Filtres avancés configurables
├── SavedViewsDropdown.tsx      # Sélecteur vues sauvegardées
├── ExportButton.tsx            # Bouton export avec options
├── EntityCode.tsx              # Affichage code (L-000042)
├── ContactInfoSection.tsx      # Section infos contact
├── CompanyInfoSection.tsx      # Section infos entreprise
├── AssignmentDropdown.tsx      # Dropdown assignation
└── EditableField.tsx           # Champ éditable inline
```

---

## 3. FLUX QUOTE-TO-CASH CORRIGÉ

### 3.1 Workflow Global

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           LEADS PIPELINE                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   NEW → WORKING → QUALIFIED → CONVERTED                                    │
│                                    │                                        │
│                                    ↓                                        │
│                          ┌─────────────────┐                                │
│                          │ CONVERSION      │                                │
│                          │ • Crée Opportunity                               │
│                          │ • Lie activités │                                │
│                          └────────┬────────┘                                │
└───────────────────────────────────┼─────────────────────────────────────────┘
                                    │
                                    ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                        OPPORTUNITIES PIPELINE                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   QUALIFICATION → DEMO → PROPOSAL → NEGOTIATION → CONTRACT_SENT → WON     │
│                            │              │                                 │
│                            └──────┬───────┘                                 │
│                                   ↓                                         │
│                          ┌─────────────────┐                                │
│                          │  CREATE QUOTE   │                                │
│                          │  (child of Opp) │                                │
│                          └────────┬────────┘                                │
│                                   ↓                                         │
│                          ┌─────────────────┐                                │
│                          │ QUOTE ACCEPTED  │                                │
│                          │       ↓         │                                │
│                          │  AUTO → WON     │                                │
│                          └─────────────────┘                                │
│                                                                             │
│   ⚠️ WON = AUTOMATIQUE quand Quote Accepted                                │
│   ⚠️ Bouton "Mark as Won" limité à contract_sent/negotiation               │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                           ORDER → FULFILLMENT                               │
├─────────────────────────────────────────────────────────────────────────────┤
│   Quote Accepted → Order créé automatiquement                              │
│   Order fulfilled → Tenant provisionné                                     │
│   Tenant actif → Subscription Stripe créée                                 │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Relation Quote ↔ Opportunity

```
┌───────────────────────────────────────┐
│           OPPORTUNITY                 │
│                                       │
│  id: uuid                             │
│  name: "Casa Transport - Pro Plan"   │
│  expected_value: €7,350              │
│  stage: proposal                      │
│  primary_quote_id: uuid ─────────────┼──┐
│                                       │  │
│  ┌─── Related Quotes ───┐            │  │
│  │ ✓ Q-000042 (Primary) │────────────┼──┤
│  │   Q-000043 (Draft)   │            │  │
│  │   Q-000041 (Rejected)│            │  │
│  └──────────────────────┘            │  │
└───────────────────────────────────────┘  │
                                           │
                                           ↓
┌───────────────────────────────────────┐
│         QUOTE (Primary)               │
│                                       │
│  id: uuid                             │
│  quote_code: Q-000042                 │
│  opportunity_id: uuid (FK) ◄──────────┘
│  is_primary: true                     │
│  status: sent                         │
│  total_value: €7,350 ──────────────────→ Sync vers Opportunity
│  valid_until: 2026-01-22              │
│                                       │
│  ┌─── Quote Items ───┐               │
│  │ FleetCore Pro x150│               │
│  │ GPS Addon x150    │               │
│  └───────────────────┘               │
└───────────────────────────────────────┘
```

**Règles de synchronisation :**

1. Une Opportunity peut avoir N Quotes
2. Un seul Quote peut être `is_primary = true`
3. Primary Quote sync `total_value` → `opportunity.expected_value`
4. Quote Accepted → Opportunity = Won (automatique)

### 3.3 Statuts Quote (Cycle de Vie)

```
                    ┌───────────────┐
                    │    DRAFT      │ ← Création depuis Opportunity
                    └───────┬───────┘
                            │
              ┌─────────────┼─────────────┐
              │             │             │
              ↓             ↓             │
     Discount > seuil   Discount OK      │
              │             │             │
      ┌───────▼───────┐     │             │
      │   PENDING     │     │             │
      │   APPROVAL    │     │             │
      └───────┬───────┘     │             │
              │             │             │
    ┌─────────┼─────────┐   │             │
    ↓         ↓         │   │             │
 Rejected  Approved     │   │             │
    │         │         │   │             │
    ↓         └─────────┼───┘             │
 [Retour               │                  │
  Draft]               ↓                  │
              ┌───────────────┐           │
              │     SENT      │◄──────────┘
              └───────┬───────┘
                      │
              ┌───────▼───────┐
              │    VIEWED     │ ← Auto quand client ouvre
              └───────┬───────┘
                      │
        ┌─────────────┼─────────────┐
        ↓             │             ↓
┌───────────────┐     │     ┌───────────────┐
│   ACCEPTED    │     │     │   REJECTED    │
└───────┬───────┘     │     └───────────────┘
        │             │
        ↓       ┌─────▼─────┐
 [Auto Won +    │  EXPIRED  │ ← CRON si valid_until dépassé
  Create Order] └───────────┘
        │
        ↓
┌───────────────┐
│   CONVERTED   │ ← Order créé
└───────────────┘
```

### 3.4 Statuts Automatiques (Non Modifiables)

| Statut             | Déclenché par            | Manuel ?      |
| ------------------ | ------------------------ | ------------- |
| `draft`            | Création                 | ✅ Modifiable |
| `pending_approval` | Discount > seuil         | ❌ Auto       |
| `approved`         | Manager approuve         | ❌ Auto       |
| `sent`             | Email envoyé             | ❌ Auto       |
| `viewed`           | Client ouvre lien        | ❌ Auto       |
| `accepted`         | Client clique "Accepter" | ❌ Auto       |
| `rejected`         | Client clique "Refuser"  | ❌ Auto       |
| `expired`          | valid_until dépassé      | ❌ CRON       |
| `converted`        | Order créé               | ❌ Auto       |

### 3.5 Formulaire Quote (Règles UI)

| Champ       | Source                        | Éditable ?                |
| ----------- | ----------------------------- | ------------------------- |
| Opportunity | Pré-rempli si créé depuis Opp | ❌ Read-only              |
| Country     | Hérité du Lead                | ❌ Read-only              |
| Currency    | Dérivée du Country            | ❌ Read-only              |
| Product     | Dropdown catalogue            | ✅ Sélection              |
| Unit Price  | Prix catalogue                | ❌ Read-only              |
| Quantity    | Saisie                        | ✅ Éditable               |
| Discount %  | Saisie avec limite            | ✅ Limité au max autorisé |
| Valid Until | Date picker                   | ✅ Éditable               |

**Règle DS-013 :** Le commercial NE PEUT PAS modifier le prix catalogue, seulement le discount.

---

## 4. GOLDEN DATA PAGE - BROWSER 360°

### 4.1 Vision

La page **Browser** (`/crm/browser`) est la **Golden Data Page** : une vue 360° du client consolidant toutes les informations.

### 4.2 Layout

```
┌────────────────────────────────────────────────────────────────────────────┐
│ 🔍 Recherche: [Nom, Email, Code L-/O-/Q-]                    [Filtres ▼]  │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│ ┌────────────────────────┐ ┌───────────────────────────────────────────┐  │
│ │    LISTE MASTER        │ │           DÉTAIL 360° (Selected)          │  │
│ │       (40%)            │ │                 (60%)                      │  │
│ │                        │ │                                            │  │
│ │ ▼ L-000042             │ │ ┌────────────────────────────────────────┐ │  │
│ │   Casa Transport       │ │ │           HEADER                       │ │  │
│ │   → O-000018 (Won)     │ │ │  Casa Transport Solutions              │ │  │
│ │                        │ │ │  Youssef Benali | youssef@casa.ma      │ │  │
│ │   L-000043             │ │ │  🚗 150 vehicles | Score: 72/100       │ │  │
│ │   Test Germany         │ │ │  L-000042 → O-000018                   │ │  │
│ │   → O-000019 (Proposal)│ │ └────────────────────────────────────────┘ │  │
│ │                        │ │                                            │  │
│ │   L-000044             │ │ ┌────────────────────────────────────────┐ │  │
│ │   Forza Fleet          │ │ │ [Overview] [Timeline] [Documents]      │ │  │
│ │   (Qualified)          │ │ │ [Quotes] [Activities]                  │ │  │
│ │                        │ │ │                                        │ │  │
│ │   L-000045             │ │ │ ══════ TIMELINE UNIFIÉE ══════        │ │  │
│ │   UK Transport         │ │ │                                        │ │  │
│ │   → O-000020 (Demo)    │ │ │ 📄 23 Dec - Quote Q-000042 Sent       │ │  │
│ │                        │ │ │ 📞 22 Dec - Call with Youssef         │ │  │
│ │                        │ │ │ 📧 21 Dec - Email: Proposal sent      │ │  │
│ │                        │ │ │ 🔄 20 Dec - Stage → Proposal          │ │  │
│ │                        │ │ │ ➕ 19 Dec - Opportunity created       │ │  │
│ │                        │ │ │ ✅ 18 Dec - Lead Qualified            │ │  │
│ │                        │ │ │ 📞 17 Dec - Demo Call                 │ │  │
│ │                        │ │ │ ➕ 15 Dec - Lead created              │ │  │
│ │                        │ │ └────────────────────────────────────────┘ │  │
│ └────────────────────────┘ └───────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────────┘
```

### 4.3 Fonctionnalités

| Zone               | Fonctionnalité                                                |
| ------------------ | ------------------------------------------------------------- |
| **Recherche**      | Par nom, email, code (L-XXXXXX, O-XXXXXX, Q-XXXXXX)           |
| **Liste Master**   | Leads groupés avec leurs Opportunities liées                  |
| **Header Détail**  | Infos clés, codes, progression                                |
| **Tab Overview**   | Résumé, stage actuel, valeur, assigné                         |
| **Tab Timeline**   | Activités Lead + Opportunity fusionnées, ordre chrono inverse |
| **Tab Documents**  | Quotes PDF, Contracts, Attachments                            |
| **Tab Quotes**     | Liste quotes liés (via Opportunity)                           |
| **Tab Activities** | Filtrable par type (Call, Email, Note, Meeting, Task)         |

### 4.4 Interactions

| Action                      | Résultat                                             |
| --------------------------- | ---------------------------------------------------- |
| Simple click sur item liste | Affiche détail 360° à droite                         |
| Double click sur item liste | Ouvre page dédiée /leads/[id] ou /opportunities/[id] |
| Click sur code O-XXXXXX     | Navigation vers Opportunity                          |
| Click sur code Q-XXXXXX     | Ouvre Quote detail                                   |

---

## 5. COMPOSANTS PARTAGÉS

### 5.1 ActivityTimeline (Générique)

```typescript
// components/crm/shared/ActivityTimeline.tsx

interface ActivityTimelineProps {
  leadId?: string;
  opportunityId?: string;
  maxItems?: number;
  showAddButton?: boolean;
  onActivityAdded?: () => void;
}

// Usage dans LeadDrawer
<ActivityTimeline leadId={lead.id} showAddButton />

// Usage dans OpportunityDrawer
<ActivityTimeline opportunityId={opportunity.id} showAddButton />

// Usage dans Browser 360° (unified)
<ActivityTimeline leadId={lead.id} opportunityId={opportunity?.id} />
```

### 5.2 BulkActionsBar (Générique)

```typescript
// components/crm/shared/BulkActionsBar.tsx

interface BulkAction {
  id: string;
  label: string;
  icon: ReactNode;
  onClick: () => void;
  variant?: 'default' | 'danger';
}

interface BulkActionsBarProps {
  selectedCount: number;
  actions: BulkAction[];
  onClearSelection: () => void;
}

// Usage
<BulkActionsBar
  selectedCount={selectedIds.length}
  actions={[
    { id: 'assign', label: 'Assign', icon: <UserIcon />, onClick: openAssignModal },
    { id: 'export', label: 'Export', icon: <DownloadIcon />, onClick: handleExport },
    { id: 'delete', label: 'Delete', icon: <TrashIcon />, onClick: openDeleteModal, variant: 'danger' },
  ]}
  onClearSelection={() => setSelectedIds([])}
/>
```

### 5.3 AdvancedFilters (Configurable)

```typescript
// components/crm/shared/AdvancedFilters.tsx

interface FilterField {
  key: string;
  label: string;
  type: 'text' | 'select' | 'date' | 'number' | 'boolean';
  options?: { value: string; label: string }[];
}

interface AdvancedFiltersProps {
  fields: FilterField[];
  values: Record<string, any>;
  onChange: (values: Record<string, any>) => void;
}

// Configuration pour Leads
const leadFilterFields: FilterField[] = [
  { key: 'status', label: 'Status', type: 'select', options: [...] },
  { key: 'source', label: 'Source', type: 'select', options: [...] },
  { key: 'score_min', label: 'Min Score', type: 'number' },
  { key: 'created_after', label: 'Created After', type: 'date' },
];

// Configuration pour Opportunities
const opportunityFilterFields: FilterField[] = [
  { key: 'stage', label: 'Stage', type: 'select', options: [...] },
  { key: 'value_min', label: 'Min Value', type: 'number' },
  { key: 'close_date_before', label: 'Close Before', type: 'date' },
];
```

### 5.4 API Export Générique

```typescript
// app/api/v1/crm/export/route.ts

// GET /api/v1/crm/export?entity=leads&format=csv&filters=...
// GET /api/v1/crm/export?entity=opportunities&format=json&ids=uuid1,uuid2

interface ExportParams {
  entity: "leads" | "opportunities" | "quotes";
  format: "csv" | "json" | "xlsx";
  ids?: string[]; // Specific IDs to export
  filters?: string; // JSON encoded filters
  columns?: string[]; // Specific columns
}
```

---

## 6. NUMÉROTATION SYSTÈME UNIFIÉE

### 6.1 Format des Codes

| Entité      | Préfixe | Format     | Exemple    |
| ----------- | ------- | ---------- | ---------- |
| Lead        | L       | L-XXXXXX   | L-000042   |
| Opportunity | O       | O-XXXXXX   | O-000018   |
| Quote       | Q       | Q-XXXXXX   | Q-000042   |
| Order       | ORD     | ORD-XXXXXX | ORD-000001 |

### 6.2 Colonnes à Ajouter

```sql
-- Leads
ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS lead_code VARCHAR(20) UNIQUE;
CREATE INDEX IF NOT EXISTS idx_leads_code ON crm_leads(lead_code);

-- Opportunities
ALTER TABLE crm_opportunities ADD COLUMN IF NOT EXISTS opportunity_code VARCHAR(20) UNIQUE;
CREATE INDEX IF NOT EXISTS idx_opportunities_code ON crm_opportunities(opportunity_code);

-- Quotes
ALTER TABLE crm_quotes ADD COLUMN IF NOT EXISTS quote_code VARCHAR(20) UNIQUE;
CREATE INDEX IF NOT EXISTS idx_quotes_code ON crm_quotes(quote_code);

-- Orders
ALTER TABLE crm_orders ADD COLUMN IF NOT EXISTS order_code VARCHAR(20) UNIQUE;
CREATE INDEX IF NOT EXISTS idx_orders_code ON crm_orders(order_code);
```

### 6.3 Génération Automatique

La fonction `generate_entity_code()` (section 2.5) est appelée automatiquement via trigger ou dans le service lors de la création.

```typescript
// Dans le service
const leadCode = await prisma.$queryRaw`SELECT generate_entity_code('lead')`;
```

---

## 7. PLAN D'EXÉCUTION (7 PHASES)

### Vue d'Ensemble

| Phase | Contenu                          | Durée | Status      |
| ----- | -------------------------------- | ----- | ----------- |
| **1** | Corrections OpportunityDrawer    | 3-4j  | ✅ COMPLÉTÉ |
| **2** | Activités Unifiées + Timeline    | 4-5j  | 🔴 À FAIRE  |
| **3** | Bulk Actions + Export Génériques | 3j    | 🔴 À FAIRE  |
| **4** | Quote from Opportunity           | 5-7j  | 🔴 À FAIRE  |
| **5** | Quote Actions Automatiques       | 4-5j  | 🔴 À FAIRE  |
| **6** | Codes Séquentiels + Saved Views  | 3j    | 🔴 À FAIRE  |
| **7** | Golden Data Page Browser 360°    | 5-7j  | 🔴 À FAIRE  |

**Total estimé : 27-34 jours** (~6-7 semaines)

---

### PHASE 1 : Corrections OpportunityDrawer ✅ COMPLÉTÉ

| #   | Tâche                                                | Status |
| --- | ---------------------------------------------------- | ------ |
| 1.1 | Edit Mode dans OpportunityDrawer                     | ✅     |
| 1.2 | Connecter Assignment dropdown                        | ✅     |
| 1.3 | Restreindre Mark as Won (contract_sent, negotiation) | ✅     |
| 1.4 | Implémenter OpportunityContextMenu                   | ✅     |
| 1.5 | Créer OpportunityFormModal                           | ✅     |

**Fichiers modifiés :**

- `components/crm/opportunities/OpportunityDrawer.tsx`
- `components/crm/opportunities/OpportunitiesPageClient.tsx`
- `components/crm/opportunities/OpportunitiesTableRow.tsx`
- `components/crm/opportunities/OpportunityContextMenu.tsx`
- `components/crm/opportunities/OpportunityFormModal.tsx` (créé)
- `lib/actions/crm/opportunity.actions.ts` (createOpportunityAction ajouté)

---

### PHASE 2 : Activités Unifiées + Timeline Générique

**Objectif :** Créer une table et des composants unifiés pour les activités Lead + Opportunity.

| #   | Tâche                                                   | Fichier                  | Effort |
| --- | ------------------------------------------------------- | ------------------------ | ------ |
| 2.1 | Créer table `crm_activities` unifiée                    | SQL + Prisma             | 2h     |
| 2.2 | Migrer données `crm_lead_activities` → `crm_activities` | SQL                      | 1h     |
| 2.3 | Créer `activities.actions.ts` polymorphique             | `lib/actions/crm/`       | 4h     |
| 2.4 | Créer `ActivityTimeline.tsx` générique                  | `components/crm/shared/` | 4h     |
| 2.5 | Créer `CreateActivityModal.tsx`                         | `components/crm/shared/` | 3h     |
| 2.6 | Intégrer dans LeadDrawer (remplacer ancien)             | `LeadDrawer.tsx`         | 2h     |
| 2.7 | Intégrer dans OpportunityDrawer                         | `OpportunityDrawer.tsx`  | 2h     |
| 2.8 | Supprimer ancien `LeadTimeline.tsx`                     | Cleanup                  | 1h     |

**Critères de validation :**

```
□ Table crm_activities créée avec contrainte polymorphique
□ Données migrées depuis crm_lead_activities
□ ActivityTimeline affiche activités pour Lead
□ ActivityTimeline affiche activités pour Opportunity
□ Création activité fonctionne (5 types)
□ Mark as Complete fonctionne pour tasks
□ LeadDrawer utilise nouveau composant
□ OpportunityDrawer utilise nouveau composant
```

---

### PHASE 3 : Bulk Actions + Export Génériques

**Objectif :** Composants partagés pour actions bulk et export.

| #   | Tâche                                    | Fichier                  | Effort |
| --- | ---------------------------------------- | ------------------------ | ------ |
| 3.1 | Créer `BulkActionsBar.tsx` générique     | `components/crm/shared/` | 3h     |
| 3.2 | Créer `BulkAssignModal.tsx`              | `components/crm/shared/` | 2h     |
| 3.3 | Créer `BulkDeleteModal.tsx`              | `components/crm/shared/` | 2h     |
| 3.4 | Créer API `/api/v1/crm/export` générique | `app/api/v1/crm/export/` | 4h     |
| 3.5 | Créer `ExportButton.tsx` avec options    | `components/crm/shared/` | 2h     |
| 3.6 | Intégrer dans LeadsPageClient            | Refactoring              | 2h     |
| 3.7 | Intégrer dans OpportunitiesPageClient    | Intégration              | 2h     |

**Critères de validation :**

```
□ Sélection multiple → BulkActionsBar apparaît
□ Bulk assign fonctionne sur Leads
□ Bulk assign fonctionne sur Opportunities
□ Bulk delete fonctionne sur Leads
□ Bulk delete fonctionne sur Opportunities
□ Export CSV Leads fonctionne
□ Export CSV Opportunities fonctionne
□ Export JSON fonctionne
```

---

### PHASE 4 : Quote from Opportunity

**Objectif :** Créer des quotes directement depuis une Opportunity.

| #   | Tâche                                                      | Fichier                  | Effort |
| --- | ---------------------------------------------------------- | ------------------------ | ------ |
| 4.1 | Ajouter colonnes `is_primary`, `quote_code` sur crm_quotes | SQL                      | 1h     |
| 4.2 | Ajouter colonne `primary_quote_id` sur crm_opportunities   | SQL                      | 1h     |
| 4.3 | Créer bouton "Create Quote" dans OpportunityDrawer         | `OpportunityDrawer.tsx`  | 2h     |
| 4.4 | Créer `QuoteFromOpportunityModal.tsx`                      | `components/crm/quotes/` | 6h     |
| 4.5 | Implémenter prix READ-ONLY dans QuoteItemsEditor           | `QuoteItemsEditor.tsx`   | 3h     |
| 4.6 | Implémenter limite discount                                | `QuoteItemsEditor.tsx`   | 2h     |
| 4.7 | Créer tab "Quotes" dans OpportunityDrawer                  | `OpportunityDrawer.tsx`  | 3h     |
| 4.8 | Synchroniser total Quote → Opportunity expected_value      | Service                  | 2h     |

**Critères de validation :**

```
□ Bouton "Create Quote" visible sur stages proposal/negotiation
□ Modal pré-remplit opportunity, country, currency
□ Prix catalogue READ-ONLY (non éditable)
□ Discount limité au max autorisé
□ Quote créé avec is_primary = true si premier
□ Liste quotes visible dans tab Opportunity
□ Sync Quote total → Opportunity expected_value
```

---

### PHASE 5 : Quote Actions Automatiques

**Objectif :** Workflow automatique pour acceptation/rejet quote.

| #   | Tâche                                            | Fichier                 | Effort |
| --- | ------------------------------------------------ | ----------------------- | ------ |
| 5.1 | Créer page publique `/public/quote/[token]`      | `app/public/quote/`     | 4h     |
| 5.2 | Créer API POST `/public/quote/[token]/accept`    | API                     | 2h     |
| 5.3 | Créer API POST `/public/quote/[token]/reject`    | API                     | 2h     |
| 5.4 | Implémenter tracking "Viewed" automatique        | Middleware/Service      | 2h     |
| 5.5 | Implémenter Won automatique quand Quote Accepted | Service                 | 3h     |
| 5.6 | Créer Order automatiquement quand Quote Accepted | Service                 | 3h     |
| 5.7 | Limiter/Masquer MarkAsWonModal si Quote existe   | `OpportunityDrawer.tsx` | 1h     |
| 5.8 | CRON job pour expiration quotes                  | CRON                    | 2h     |

**Critères de validation :**

```
□ Page publique /public/quote/[token] affiche le devis
□ Ouverture page → status = viewed (auto)
□ Click "Accepter" → status = accepted
□ Click "Refuser" → status = rejected + raison
□ Quote accepted → Opportunity.status = won (auto)
□ Quote accepted → Order créé (auto)
□ Mark as Won button conditionnel
□ Quotes expirés → status = expired (CRON)
```

---

### PHASE 6 : Codes Séquentiels + Saved Views

**Objectif :** Numérotation système et vues sauvegardées.

| #    | Tâche                                                  | Fichier                  | Effort |
| ---- | ------------------------------------------------------ | ------------------------ | ------ |
| 6.1  | Créer table `crm_sequences`                            | SQL                      | 1h     |
| 6.2  | Créer fonction `generate_entity_code()`                | SQL                      | 1h     |
| 6.3  | Ajouter colonnes code sur leads, opportunities, quotes | SQL                      | 1h     |
| 6.4  | Générer codes pour records existants                   | SQL                      | 1h     |
| 6.5  | Intégrer génération auto dans services                 | Services                 | 2h     |
| 6.6  | Créer composant `EntityCode.tsx`                       | `components/crm/shared/` | 1h     |
| 6.7  | Afficher codes dans UI (Drawer, Cards, Table)          | Divers                   | 2h     |
| 6.8  | Créer table `crm_saved_views`                          | SQL                      | 1h     |
| 6.9  | Créer hook `useSavedViews(entityType)`                 | `lib/hooks/`             | 3h     |
| 6.10 | Créer `SavedViewsDropdown.tsx`                         | `components/crm/shared/` | 2h     |
| 6.11 | Intégrer dans pages Leads et Opportunities             | Pages                    | 2h     |

**Critères de validation :**

```
□ Leads existants ont lead_code (L-XXXXXX)
□ Nouveau lead → lead_code généré automatiquement
□ Opportunities ont opportunity_code (O-XXXXXX)
□ Quotes ont quote_code (Q-XXXXXX)
□ Codes affichés dans Drawer, Cards, Table
□ Recherche par code fonctionne
□ Saved Views : créer, sauvegarder, charger
□ Saved Views : marquer comme default
```

---

### PHASE 7 : Golden Data Page Browser 360°

**Objectif :** Page unifiée 360° pour vision client complète.

| #    | Tâche                                               | Fichier                           | Effort |
| ---- | --------------------------------------------------- | --------------------------------- | ------ |
| 7.1  | Créer/Refactorer page `/crm/browser`                | `app/[locale]/(app)/crm/browser/` | 2h     |
| 7.2  | Créer composant `MasterList.tsx`                    | `components/crm/browser/`         | 4h     |
| 7.3  | Créer composant `Detail360View.tsx`                 | `components/crm/browser/`         | 4h     |
| 7.4  | Créer composant `UnifiedTimeline.tsx`               | `components/crm/browser/`         | 3h     |
| 7.5  | Créer tab Overview                                  | `components/crm/browser/tabs/`    | 2h     |
| 7.6  | Créer tab Documents                                 | `components/crm/browser/tabs/`    | 3h     |
| 7.7  | Créer tab Quotes                                    | `components/crm/browser/tabs/`    | 2h     |
| 7.8  | Implémenter recherche globale                       | `components/crm/browser/`         | 3h     |
| 7.9  | Implémenter navigation (simple click, double click) | Event handlers                    | 2h     |
| 7.10 | Supprimer/Rediriger ancien module Quotes standalone | Cleanup                           | 2h     |
| 7.11 | Mettre à jour navigation sidebar                    | Navigation                        | 1h     |
| 7.12 | Tests E2E complets                                  | Tests                             | 4h     |

**Critères de validation :**

```
□ Browser affiche liste leads avec opportunities liées
□ Click sur lead → détail 360° à droite
□ Double click → page dédiée
□ Timeline unifiée Lead + Opportunity activities
□ Tab Documents affiche quotes PDF
□ Tab Quotes liste tous quotes liés
□ Recherche par nom fonctionne
□ Recherche par email fonctionne
□ Recherche par code (L-, O-, Q-) fonctionne
□ Navigation sidebar mise à jour
□ /crm/quotes redirige vers /crm/opportunities
□ Tests E2E passent
```

---

## 8. TESTS OBLIGATOIRES

### 8.1 Tests par Phase

| Phase | Unitaires  | Intégration | E2E | Manuel |
| ----- | ---------- | ----------- | --- | ------ |
| 1 ✅  | Services   | Actions     | -   | UI     |
| 2     | Services   | Actions     | -   | UI     |
| 3     | Services   | Actions     | -   | UI     |
| 4     | Services   | Actions     | ✅  | UI     |
| 5     | Services   | Actions     | ✅  | UI     |
| 6     | Functions  | -           | -   | UI     |
| 7     | Components | Actions     | ✅  | UI     |

### 8.2 Test E2E Principal (Phase 7)

```typescript
// e2e/crm-complete-workflow.spec.ts

describe("CRM Complete Workflow", () => {
  test("Lead → Qualified → Opportunity → Quote → Won → Order", async ({
    page,
  }) => {
    // 1. Créer Lead
    await page.goto("/crm/leads");
    await page.click('[data-testid="new-lead-btn"]');
    await fillLeadForm(page, testLeadData);
    await page.click('[data-testid="save-lead-btn"]');

    // 2. Ajouter activité au Lead
    await page.click('[data-testid="add-activity-btn"]');
    await page.selectOption('[data-testid="activity-type"]', "call");
    await page.fill('[data-testid="activity-subject"]', "Discovery Call");
    await page.click('[data-testid="save-activity-btn"]');
    await expect(page.locator('[data-testid="activity-item"]')).toBeVisible();

    // 3. Qualifier Lead
    await page.click('[data-testid="qualify-btn"]');
    await fillQualificationForm(page);

    // 4. Convertir en Opportunity
    await page.click('[data-testid="convert-btn"]');
    await fillConversionForm(page);
    await expect(
      page.locator('[data-testid="opportunity-created-toast"]')
    ).toBeVisible();

    // 5. Vérifier activités transférées
    await page.goto("/crm/opportunities");
    await page.click('[data-testid="opportunity-card"]');
    await expect(
      page
        .locator('[data-testid="activity-item"]')
        .filter({ hasText: "Discovery Call" })
    ).toBeVisible();

    // 6. Créer Quote
    await page.click('[data-testid="create-quote-btn"]');
    await fillQuoteForm(page);
    await expect(page.locator('[data-testid="quote-status"]')).toHaveText(
      "Draft"
    );

    // 7. Envoyer Quote
    await page.click('[data-testid="send-quote-btn"]');
    await expect(page.locator('[data-testid="quote-status"]')).toHaveText(
      "Sent"
    );

    // 8. Simuler acceptation (API)
    const quoteToken = await getQuoteToken(page);
    await acceptQuote(quoteToken);

    // 9. Vérifier Won automatique
    await page.reload();
    await expect(page.locator('[data-testid="opportunity-stage"]')).toHaveText(
      "Won"
    );

    // 10. Vérifier Order créé
    await expect(
      page.locator('[data-testid="order-created-badge"]')
    ).toBeVisible();
  });

  test("Browser 360° search and navigation", async ({ page }) => {
    await page.goto("/crm/browser");

    // Search by code
    await page.fill('[data-testid="global-search"]', "L-000042");
    await expect(page.locator('[data-testid="search-result"]')).toContainText(
      "Casa Transport"
    );

    // Click to view details
    await page.click('[data-testid="search-result"]');
    await expect(page.locator('[data-testid="detail-360-view"]')).toBeVisible();

    // Check unified timeline
    await page.click('[data-testid="tab-timeline"]');
    await expect(
      page.locator('[data-testid="timeline-item"]').first()
    ).toBeVisible();

    // Check documents tab
    await page.click('[data-testid="tab-documents"]');
    await expect(page.locator('[data-testid="document-list"]')).toBeVisible();
  });
});
```

---

## 9. CHECKLIST DE VALIDATION FINALE

### 9.1 Fonctionnalités Critiques

| #   | Fonctionnalité                    | Phase | Status |
| --- | --------------------------------- | ----- | ------ |
| 1   | Edit Mode OpportunityDrawer       | 1     | ✅     |
| 2   | OpportunityFormModal              | 1     | ✅     |
| 3   | Mark as Won restreint             | 1     | ✅     |
| 4   | OpportunityContextMenu            | 1     | ✅     |
| 5   | Assignment dropdown connecté      | 1     | ✅     |
| 6   | Table crm_activities unifiée      | 2     | ⬜     |
| 7   | ActivityTimeline générique        | 2     | ⬜     |
| 8   | BulkActionsBar partagé            | 3     | ⬜     |
| 9   | Export API générique              | 3     | ⬜     |
| 10  | Create Quote from Opportunity     | 4     | ⬜     |
| 11  | Prix catalogue READ-ONLY          | 4     | ⬜     |
| 12  | Quote Accepted → Won auto         | 5     | ⬜     |
| 13  | Order créé automatiquement        | 5     | ⬜     |
| 14  | Codes L-XXXXXX / O-XXXXXX         | 6     | ⬜     |
| 15  | Saved Views                       | 6     | ⬜     |
| 16  | Browser 360° Page                 | 7     | ⬜     |
| 17  | Timeline unifiée                  | 7     | ⬜     |
| 18  | Module Quotes standalone supprimé | 7     | ⬜     |

### 9.2 Commandes de Validation

```bash
# Tests
pnpm test                    # Tests unitaires
pnpm test:e2e               # Tests E2E
pnpm lint                   # Linting
pnpm build                  # Build production

# Vérification DB
psql -c "SELECT COUNT(*) FROM crm_activities"
psql -c "SELECT COUNT(*) FROM crm_saved_views"
psql -c "SELECT entity_type, current_value FROM crm_sequences"
```

### 9.3 Validation Manuelle CEO

| #   | Scénario                                           | Validé |
| --- | -------------------------------------------------- | ------ |
| 1   | Créer Lead, ajouter activité, qualifier, convertir | ⬜     |
| 2   | Vérifier activités transférées à l'Opportunity     | ⬜     |
| 3   | Modifier Opportunity via Drawer (Edit Mode)        | ⬜     |
| 4   | Créer Quote depuis Opportunity                     | ⬜     |
| 5   | Vérifier prix READ-ONLY, discount limité           | ⬜     |
| 6   | Envoyer Quote, simuler acceptation                 | ⬜     |
| 7   | Vérifier Won automatique + Order créé              | ⬜     |
| 8   | Rechercher par code L-XXXXXX dans Browser          | ⬜     |
| 9   | Voir vue 360° avec timeline unifiée                | ⬜     |
| 10  | Vérifier /crm/quotes redirige                      | ⬜     |

---

## ANNEXE A : RÈGLES DE GESTION (RAPPEL)

| ID     | Règle                                         | Source                         |
| ------ | --------------------------------------------- | ------------------------------ |
| RG-001 | provider_id OBLIGATOIRE sur toute action CRM  | FLEETCORE_REGLES_DE_GESTION.md |
| RG-002 | Billing cycles = SEULEMENT `month` ou `year`  | FLEETCORE_REGLES_DE_GESTION.md |
| DS-006 | Devise = pays LÉGAL de la société client      | Quote-to-Cash Spec             |
| DS-013 | Prix catalogue READ-ONLY, discount modifiable | Quote-to-Cash Spec             |
| DS-002 | Tarif négocié = max 12 mois                   | Quote-to-Cash Spec             |

---

## ANNEXE B : MIGRATIONS SQL REQUISES

### Phase 2 - Activités Unifiées

```sql
-- 1. Créer table crm_activities (voir section 2.2)
-- 2. Migrer données existantes
INSERT INTO crm_activities (
  lead_id, provider_id, activity_type, subject, description,
  activity_date, duration_minutes, outcome, is_completed, completed_at,
  created_by, created_at, updated_at
)
SELECT
  lead_id, provider_id, activity_type, subject, description,
  activity_date, duration_minutes, outcome, is_completed, completed_at,
  created_by, created_at, updated_at
FROM crm_lead_activities;

-- 3. Après validation, supprimer ancienne table
-- DROP TABLE crm_lead_activities; -- À faire après tests
```

### Phase 6 - Codes Séquentiels

```sql
-- 1. Créer table crm_sequences (voir section 2.5)
-- 2. Créer fonction generate_entity_code (voir section 2.5)
-- 3. Ajouter colonnes et générer codes existants (voir section 6.2)
```

---

## ANNEXE C : ESTIMATION EFFORT

| Phase     | Dev     | Tests    | Total     |
| --------- | ------- | -------- | --------- |
| 1 ✅      | -       | -        | FAIT      |
| 2         | 3j      | 1.5j     | 4.5j      |
| 3         | 2j      | 1j       | 3j        |
| 4         | 5j      | 2j       | 7j        |
| 5         | 3j      | 2j       | 5j        |
| 6         | 2j      | 1j       | 3j        |
| 7         | 5j      | 2j       | 7j        |
| **TOTAL** | **20j** | **9.5j** | **29.5j** |

**Planning : ~6 semaines avec 1 développeur full-time**

---

**FIN DU DOCUMENT**

_Version 4.0.0 FINAL - Spécification Unique de Référence_
_Dernière mise à jour : 23 Décembre 2025_
