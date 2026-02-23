# FLEETCORE - CRM SETTINGS MODULE

## Spécification Détaillée - Transaction Settings/CRM

**Date:** 2 Décembre 2025  
**Version:** 1.0  
**Auteur:** Claude Senior  
**Durée estimée:** 3-4 jours (24-32 heures)

---

## 📋 TABLE DES MATIÈRES

1. [Vue d'Ensemble](#vue-densemble)
2. [Architecture Technique](#architecture-technique)
3. [Section 1 - Pipeline Configuration](#section-1---pipeline-configuration)
4. [Section 2 - Lead Scoring Rules](#section-2---lead-scoring-rules)
5. [Section 3 - Lead Assignment Rules](#section-3---lead-assignment-rules)
6. [Section 4 - Loss Reasons Management](#section-4---loss-reasons-management)
7. [Section 5 - Notifications & Alerts](#section-5---notifications--alerts)
8. [Section 6 - Data Quality Rules](#section-6---data-quality-rules)
9. [Section 7 - Regional Settings](#section-7---regional-settings)
10. [UX/UI Guidelines](#uxui-guidelines)
11. [API Endpoints](#api-endpoints)
12. [Permissions & Access Control](#permissions--access-control)

---

## VUE D'ENSEMBLE

### Objectif

La page CRM Settings permet aux administrateurs de configurer l'ensemble des paramètres du module CRM sans intervention technique. Principe fondamental : **Zero Hardcoding** - toutes les règles métier sont stockées en base de données et modifiables via l'interface.

### Valeur Business

| Bénéfice                     | Impact                                            |
| ---------------------------- | ------------------------------------------------- |
| Autonomie équipe commerciale | Pas besoin de développeur pour ajuster le scoring |
| Adaptation rapide au marché  | Modifier les stages pipeline en 2 minutes         |
| Optimisation continue        | A/B test des règles de qualification              |
| Conformité locale            | Paramètres régionaux par pays (UAE, France)       |
| Réduction erreurs            | Validation centralisée des données                |

### Best Practices Intégrées (HubSpot, Pipedrive, Salesforce)

1. **Interface claire** : Tabs/accordéons pour organiser les sections
2. **Preview en temps réel** : Voir l'impact des changements avant sauvegarde
3. **Historique modifications** : Audit trail de qui a changé quoi
4. **Import/Export** : Sauvegarde/restauration de configuration
5. **Permissions granulaires** : Qui peut modifier quoi
6. **Validation intelligente** : Empêcher les configurations incohérentes

---

## ARCHITECTURE TECHNIQUE

### Table Existante : `crm_settings`

```sql
CREATE TABLE crm_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES adm_tenants(id),
  category VARCHAR(50) NOT NULL,  -- 'scoring', 'assignment', 'pipeline', etc.
  key VARCHAR(100) NOT NULL,       -- 'fit_score_weights', 'stages_config', etc.
  value JSONB NOT NULL,            -- Configuration flexible
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES adm_members(id),
  updated_by UUID REFERENCES adm_members(id),
  UNIQUE(tenant_id, category, key)
);
```

### Catégories de Settings

| Category        | Keys                                                    | Description              |
| --------------- | ------------------------------------------------------- | ------------------------ |
| `pipeline`      | `stages_config`, `default_pipeline`                     | Configuration des stages |
| `scoring`       | `fit_score_weights`, `engagement_weights`, `thresholds` | Règles de scoring        |
| `assignment`    | `geographic_zones`, `fleet_size_rules`, `round_robin`   | Règles d'assignation     |
| `loss_reasons`  | `reasons_list`, `categories`                            | Motifs de perte          |
| `notifications` | `email_triggers`, `in_app_alerts`, `slack_webhooks`     | Alertes                  |
| `data_quality`  | `required_fields`, `validation_rules`                   | Qualité données          |
| `regional`      | `currencies`, `date_formats`, `languages`               | Paramètres régionaux     |

---

## SECTION 1 - PIPELINE CONFIGURATION

### 1.1 Objectif

Permettre la configuration des stages du pipeline commercial (Leads et Opportunities) sans modifier le code.

### 1.2 Sous-sections

#### 1.2.1 Lead Pipeline Stages

**Stages par défaut (4) :**

| Stage       | Label EN  | Label FR | Color             | Sort Order | Auto-Transition               |
| ----------- | --------- | -------- | ----------------- | ---------- | ----------------------------- |
| `new`       | New       | Nouveau  | `#3B82F6` (blue)  | 1          | → `working` après 1er contact |
| `working`   | Working   | En cours | `#F59E0B` (amber) | 2          | -                             |
| `qualified` | Qualified | Qualifié | `#10B981` (green) | 3          | → Conversion possible         |
| `lost`      | Lost      | Perdu    | `#EF4444` (red)   | 4          | Terminal                      |

**Configuration UI :**

```
┌─────────────────────────────────────────────────────────────┐
│ Lead Pipeline Stages                              [+ Add]   │
├─────────────────────────────────────────────────────────────┤
│ ≡ 1. New                                                    │
│   ├─ Label: [New________] [Nouveau______]                   │
│   ├─ Color: [🔵 Blue ▼]                                     │
│   ├─ Auto-transition: [After first contact → Working]      │
│   └─ [Delete] [Duplicate]                                   │
│                                                             │
│ ≡ 2. Working                                                │
│   ├─ ...                                                    │
│                                                             │
│ ≡ 3. Qualified                                              │
│   ├─ ...                                                    │
│   ├─ ☑ Allow conversion to Opportunity                      │
│                                                             │
│ ≡ 4. Lost                                                   │
│   ├─ ...                                                    │
│   ├─ 🔒 Terminal stage (cannot be modified)                 │
└─────────────────────────────────────────────────────────────┘
```

**Règles de validation :**

- Minimum 2 stages (début + fin)
- Maximum 8 stages (simplicité pipeline)
- Un seul stage "terminal" obligatoire
- Ordre modifiable via drag & drop

#### 1.2.2 Opportunity Pipeline Stages

**Stages par défaut (5 + 2 finaux) :**

| Stage           | Label EN      | Label FR       | Probability | Max Days | Color     |
| --------------- | ------------- | -------------- | ----------- | -------- | --------- |
| `qualification` | Qualification | Qualification  | 20%         | 14       | `#3B82F6` |
| `demo`          | Demo          | Démonstration  | 40%         | 10       | `#8B5CF6` |
| `proposal`      | Proposal      | Proposition    | 60%         | 14       | `#F59E0B` |
| `negotiation`   | Negotiation   | Négociation    | 80%         | 10       | `#F97316` |
| `contract_sent` | Contract Sent | Contrat envoyé | 90%         | 7        | `#10B981` |
| `won`           | Won           | Gagné          | 100%        | -        | `#22C55E` |
| `lost`          | Lost          | Perdu          | 0%          | -        | `#EF4444` |

**Configuration UI :**

```
┌─────────────────────────────────────────────────────────────┐
│ Opportunity Pipeline                              [+ Add]   │
├─────────────────────────────────────────────────────────────┤
│ ACTIVE STAGES (drag to reorder)                             │
│ ─────────────────────────────────────────────────────────── │
│ ≡ 1. Qualification                                          │
│   ├─ Labels: [Qualification] [Qualification]                │
│   ├─ Probability: [20] %                                    │
│   ├─ Max days in stage: [14] days                           │
│   ├─ Color: [🔵 Blue ▼]                                     │
│   └─ Deal Rotting: ☑ Alert if exceeds max days              │
│                                                             │
│ ≡ 2. Demo                                                   │
│   └─ Probability: [40] % ...                                │
│                                                             │
│ ≡ 3. Proposal                                               │
│   └─ Probability: [60] % ...                                │
│                                                             │
│ ≡ 4. Negotiation                                            │
│   └─ Probability: [80] % ...                                │
│                                                             │
│ ≡ 5. Contract Sent                                          │
│   └─ Probability: [90] % ...                                │
│                                                             │
│ ─────────────────────────────────────────────────────────── │
│ FINAL STAGES (not editable)                                 │
│ ─────────────────────────────────────────────────────────── │
│ 🏆 Won (100%)  🔒                                            │
│ ❌ Lost (0%)   🔒                                            │
└─────────────────────────────────────────────────────────────┘

│ PREVIEW                                                     │
│ ═══════════════════════════════════════════════════════════ │
│ [Qual 20%] → [Demo 40%] → [Prop 60%] → [Nego 80%] → [Sent 90%]
│     14d         10d          14d          10d          7d   │
└─────────────────────────────────────────────────────────────┘
```

**Règles de validation :**

- Probabilités croissantes (chaque stage > précédent)
- Max days > 0 obligatoire
- Won et Lost non modifiables (stages système)

#### 1.2.3 Deal Rotting Configuration

```
┌─────────────────────────────────────────────────────────────┐
│ Deal Rotting Settings                                       │
├─────────────────────────────────────────────────────────────┤
│ ☑ Enable deal rotting detection                             │
│                                                             │
│ Alert triggers:                                             │
│ ○ When deal exceeds stage max days (default)                │
│ ○ When deal exceeds [__] days (custom global threshold)     │
│                                                             │
│ Alert actions:                                              │
│ ☑ Show visual badge on opportunity card                     │
│ ☑ Send email notification to owner                          │
│ ☐ Send Slack notification                                   │
│ ☑ Include in daily digest to manager                        │
│                                                             │
│ Cron schedule: [08:00] UTC daily                            │
└─────────────────────────────────────────────────────────────┘
```

### 1.3 JSON Schema

```json
{
  "category": "pipeline",
  "key": "opportunity_stages",
  "value": {
    "stages": [
      {
        "id": "qualification",
        "label_en": "Qualification",
        "label_fr": "Qualification",
        "probability": 20,
        "max_days": 14,
        "color": "#3B82F6",
        "sort_order": 1,
        "deal_rotting": true,
        "is_active": true
      }
    ],
    "final_stages": {
      "won": { "label_en": "Won", "label_fr": "Gagné", "probability": 100 },
      "lost": { "label_en": "Lost", "label_fr": "Perdu", "probability": 0 }
    },
    "rotting": {
      "enabled": true,
      "use_stage_max_days": true,
      "global_threshold_days": null,
      "alert_owner": true,
      "alert_manager": true,
      "cron_time": "08:00"
    }
  }
}
```

---

## SECTION 2 - LEAD SCORING RULES

### 2.1 Objectif

Configurer les règles de scoring automatique des leads pour priorisation.

### 2.2 Sous-sections

#### 2.2.1 Fit Score Configuration (60 points max)

Le fit score mesure à quel point le lead correspond au profil client idéal.

```
┌─────────────────────────────────────────────────────────────┐
│ Fit Score Rules                          Max: 60 points     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ 📊 FLEET SIZE (max 40 points)                               │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 1-10 vehicles    : [5 ] points                          │ │
│ │ 11-50 vehicles   : [15] points                          │ │
│ │ 51-100 vehicles  : [30] points                          │ │
│ │ 101-500 vehicles : [40] points  ⭐ Best fit             │ │
│ │ 500+ vehicles    : [35] points                          │ │
│ │ Unknown          : [0 ] points                          │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ 🌍 COUNTRY TIER (max 20 points)                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Tier 1 (UAE, France)     : [20] points  ⭐ Priority     │ │
│ │ Tier 2 (KSA, Qatar, UK)  : [15] points                  │ │
│ │ Tier 3 (Germany, Spain)  : [10] points                  │ │
│ │ Tier 4 (Others)          : [5 ] points                  │ │
│ │ Non-operational          : [0 ] points                  │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ [+ Add custom fit score rule]                               │
│                                                             │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│ PREVIEW: Lead with 51-100 vehicles in UAE                   │
│ Fleet: 30 pts + Country: 20 pts = 50/60 (83%)               │
└─────────────────────────────────────────────────────────────┘
```

#### 2.2.2 Engagement Score Configuration (100 points max)

Le score d'engagement mesure l'intérêt manifesté par le lead.

```
┌─────────────────────────────────────────────────────────────┐
│ Engagement Score Rules                   Max: 100 points    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ 📝 MESSAGE QUALITY (max 40 points)                          │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ No message           : [0 ] points                      │ │
│ │ Short (< 50 chars)   : [10] points                      │ │
│ │ Medium (50-200)      : [25] points                      │ │
│ │ Detailed (> 200)     : [40] points  ⭐ High intent      │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ 📞 CONTACT INFO (max 30 points)                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Phone provided       : [+20] points                     │ │
│ │ LinkedIn provided    : [+10] points                     │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ 🌐 SOURCE QUALITY (max 30 points)                           │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Partner referral     : [30] points  ⭐ Best source      │ │
│ │ Organic search       : [25] points                      │ │
│ │ Direct traffic       : [20] points                      │ │
│ │ LinkedIn Ads         : [15] points                      │ │
│ │ Google Ads           : [10] points                      │ │
│ │ Facebook/Meta        : [5 ] points                      │ │
│ │ Unknown              : [0 ] points                      │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ⏱️ TIME DECAY                                               │
│ ☑ Enable score decay after inactivity                       │
│   Decay rate: [-5] points per [30] days of inactivity       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### 2.2.3 Qualification Thresholds

```
┌─────────────────────────────────────────────────────────────┐
│ Lead Stage Thresholds                                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Formula: Qualification Score = (Fit × 0.6) + (Engagement × 0.4)
│                                                             │
│ Weights:                                                    │
│   Fit Score weight    : [60] %                              │
│   Engagement weight   : [40] %                              │
│                                                             │
│ Stage Thresholds:                                           │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Score 0-39   → Top of Funnel (TOF)    🔵                │ │
│ │ Score 40-69  → Marketing Qualified (MQL) 🟡             │ │
│ │ Score 70-100 → Sales Qualified (SQL)  🟢 ⭐ Priority    │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ Auto-actions:                                               │
│ ☑ Auto-assign SQL leads to sales team                       │
│ ☑ Send notification when lead reaches SQL                   │
│ ☐ Auto-create opportunity for SQL leads                     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 2.3 JSON Schema

```json
{
  "category": "scoring",
  "key": "fit_score_weights",
  "value": {
    "fleet_size": {
      "max_points": 40,
      "rules": [
        { "range": "1-10", "points": 5 },
        { "range": "11-50", "points": 15 },
        { "range": "51-100", "points": 30 },
        { "range": "101-500", "points": 40 },
        { "range": "500+", "points": 35 },
        { "range": "unknown", "points": 0 }
      ]
    },
    "country_tier": {
      "max_points": 20,
      "tiers": {
        "tier_1": { "countries": ["AE", "FR"], "points": 20 },
        "tier_2": { "countries": ["SA", "QA", "GB"], "points": 15 },
        "tier_3": { "countries": ["DE", "ES"], "points": 10 },
        "tier_4": { "countries": ["*"], "points": 5 }
      }
    }
  }
}
```

---

## SECTION 3 - LEAD ASSIGNMENT RULES

### 3.1 Objectif

Configurer l'assignation automatique des leads aux commerciaux.

### 3.2 Configuration UI

```
┌─────────────────────────────────────────────────────────────┐
│ Lead Assignment Rules                                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ ASSIGNMENT METHOD                                           │
│ ○ Round-robin (equal distribution)                          │
│ ● Priority-based (rules below, then round-robin fallback)   │
│ ○ Manual only (no auto-assignment)                          │
│                                                             │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                                             │
│ PRIORITY RULES (evaluated in order)                         │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 1. Fleet Size Priority                    [Edit] [🗑️]  │ │
│ │    IF fleet_size = "500+" OR "101-500"                  │ │
│ │    THEN assign to: Senior Account Manager               │ │
│ │    Fallback: Round-robin among seniors                  │ │
│ ├─────────────────────────────────────────────────────────┤ │
│ │ 2. Geographic Zone - UAE                  [Edit] [🗑️]  │ │
│ │    IF country_code IN ("AE", "SA", "QA", "KW", "BH")    │ │
│ │    THEN assign to: UAE Sales Team                       │ │
│ │    Fallback: Round-robin among UAE team                 │ │
│ ├─────────────────────────────────────────────────────────┤ │
│ │ 3. Geographic Zone - France               [Edit] [🗑️]  │ │
│ │    IF country_code IN ("FR", "BE", "CH", "LU")          │ │
│ │    THEN assign to: France Sales Team                    │ │
│ │    Fallback: Round-robin among France team              │ │
│ ├─────────────────────────────────────────────────────────┤ │
│ │ 4. Default (catch-all)                    [🔒 Required] │ │
│ │    ELSE assign via round-robin to: All Sales Reps       │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ [+ Add Rule]                                                │
│                                                             │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                                             │
│ ROUND-ROBIN SETTINGS                                        │
│ ☑ Skip members who are on vacation                          │
│ ☑ Skip members with > [50] active leads                     │
│ ☐ Weight by performance (top performers get more leads)     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 3.3 Rule Editor Modal

```
┌─────────────────────────────────────────────────────────────┐
│ Edit Assignment Rule                              [X Close] │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Rule Name: [Geographic Zone - UAE_____________]             │
│                                                             │
│ CONDITIONS (IF)                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ [country_code ▼] [is one of ▼] [AE, SA, QA, KW, BH]     │ │
│ │ [+ Add condition] (AND/OR)                              │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ACTION (THEN)                                               │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Assign to: [Team ▼] [UAE Sales Team ▼]                  │ │
│ │                                                         │ │
│ │ Members in this team:                                   │ │
│ │ ☑ Ahmed Al-Mansoori (Senior Account Manager)            │ │
│ │ ☑ Fatima Hassan (Account Manager)                       │ │
│ │ ☐ Mohammed Khalid (Junior - on vacation)                │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ FALLBACK                                                    │
│ ○ Round-robin among selected members                        │
│ ○ Always assign to specific person: [Ahmed Al-Mansoori ▼]   │
│ ○ Leave unassigned                                          │
│                                                             │
│ Priority: [2] (lower = higher priority)                     │
│                                                             │
│                            [Cancel]  [Save Rule]            │
└─────────────────────────────────────────────────────────────┘
```

---

## SECTION 4 - LOSS REASONS MANAGEMENT

### 4.1 Objectif

Gérer les motifs de perte pour analyse et amélioration du processus commercial.

### 4.2 Configuration UI

```
┌─────────────────────────────────────────────────────────────┐
│ Loss Reasons                                      [+ Add]   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ 💰 PRICE CATEGORY                                           │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ ☑ Price too high                                        │ │
│ │   └─ Recoverable: ✓  Recovery delay: [90] days          │ │
│ │ ☑ Budget insufficient                                   │ │
│ │   └─ Recoverable: ✓  Recovery delay: [180] days         │ │
│ │ ☑ ROI not demonstrated                                  │ │
│ │   └─ Recoverable: ✓  Recovery delay: [60] days          │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ 📦 PRODUCT CATEGORY                                         │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ ☑ Missing critical features                             │ │
│ │   └─ Recoverable: ✓  Recovery delay: [120] days         │ │
│ │ ☑ Missing integrations                                  │ │
│ │   └─ Recoverable: ✓  Recovery delay: [90] days          │ │
│ │ ☑ UI too complex                                        │ │
│ │   └─ Recoverable: ✗                                     │ │
│ │ ☑ Performance issues                                    │ │
│ │   └─ Recoverable: ✗                                     │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ 🏆 COMPETITION CATEGORY                                     │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ ☑ Competitor chosen (price)                             │ │
│ │   └─ Recoverable: ✓  Recovery delay: [180] days         │ │
│ │   └─ ☑ Require competitor name field                    │ │
│ │ ☑ Competitor chosen (features)                          │ │
│ │   └─ Recoverable: ✓  Recovery delay: [120] days         │ │
│ │   └─ ☑ Require competitor name field                    │ │
│ │ ☑ Existing relationship with competitor                 │ │
│ │   └─ Recoverable: ✗                                     │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ⏰ TIMING CATEGORY                                          │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ ☑ Project postponed                                     │ │
│ │   └─ Recoverable: ✓  Recovery delay: [90] days          │ │
│ │ ☑ Not ready now                                         │ │
│ │   └─ Recoverable: ✓  Recovery delay: [180] days         │ │
│ │ ☑ Internal reorganization                               │ │
│ │   └─ Recoverable: ✓  Recovery delay: [120] days         │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ❓ OTHER CATEGORY                                           │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ ☑ No response (ghosting)                                │ │
│ │   └─ Recoverable: ✓  Recovery delay: [60] days          │ │
│ │ ☑ Bad product fit                                       │ │
│ │   └─ Recoverable: ✗                                     │ │
│ │ ☑ Reason not communicated                               │ │
│ │   └─ Recoverable: ✗                                     │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                                             │
│ RECOVERY WORKFLOW SETTINGS                                  │
│ ☑ Auto-create follow-up task for recoverable losses         │
│ ☑ Send reminder email to owner before recovery date         │
│   Reminder: [7] days before recovery date                   │
│ ☐ Auto-reopen opportunity after recovery period             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 4.3 Table SQL à créer

```sql
CREATE TABLE crm_opportunity_loss_reasons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES adm_tenants(id),
  name VARCHAR(100) NOT NULL,
  name_fr VARCHAR(100),
  category VARCHAR(50) NOT NULL, -- 'price', 'product', 'competition', 'timing', 'other'
  description TEXT,
  is_recoverable BOOLEAN DEFAULT false,
  recovery_delay_days INTEGER,
  require_competitor_name BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, name)
);
```

---

## SECTION 5 - NOTIFICATIONS & ALERTS

### 5.1 Configuration UI

```
┌─────────────────────────────────────────────────────────────┐
│ Notification Settings                                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ 📧 EMAIL NOTIFICATIONS                                      │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Lead Events:                                            │ │
│ │ ☑ New lead created → Owner                              │ │
│ │ ☑ Lead reaches SQL threshold → Owner + Manager          │ │
│ │ ☑ Lead inactive > 30 days → Owner                       │ │
│ │                                                         │ │
│ │ Opportunity Events:                                     │ │
│ │ ☑ Opportunity created → Owner                           │ │
│ │ ☑ Stage changed → Owner                                 │ │
│ │ ☑ Deal rotting alert → Owner + Manager                  │ │
│ │ ☑ Opportunity won → Owner + Manager + CS Team           │ │
│ │ ☑ High-value opportunity lost (> €50k) → Director       │ │
│ │                                                         │ │
│ │ Digest:                                                 │ │
│ │ ☑ Daily pipeline summary → Managers                     │ │
│ │   Send at: [08:00] UTC                                  │ │
│ │ ☑ Weekly win/loss report → All sales team               │ │
│ │   Send on: [Monday] at [09:00] UTC                      │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ 🔔 IN-APP NOTIFICATIONS                                     │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ ☑ All email notifications also appear in-app            │ │
│ │ ☑ Real-time updates for assigned items                  │ │
│ │ ☑ @mentions in notes                                    │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ 💬 SLACK INTEGRATION (Optional)                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ ☐ Enable Slack notifications                            │ │
│ │   Webhook URL: [________________________________]       │ │
│ │   Channel: [#sales-wins]                                │ │
│ │   Events: ☑ Won deals  ☑ High-value lost deals          │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## SECTION 6 - DATA QUALITY RULES

### 6.1 Configuration UI

```
┌─────────────────────────────────────────────────────────────┐
│ Data Quality Rules                                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ LEAD REQUIRED FIELDS                                        │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Always required:                                        │ │
│ │ ☑ Email (system)                                        │ │
│ │ ☑ First name (system)                                   │ │
│ │ ☑ Last name (system)                                    │ │
│ │ ☑ Company name                                          │ │
│ │ ☑ Country                                               │ │
│ │ ☑ Fleet size                                            │ │
│ │                                                         │ │
│ │ Required for qualification:                             │ │
│ │ ☑ Phone number                                          │ │
│ │ ☐ Industry                                              │ │
│ │ ☐ Current software                                      │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ OPPORTUNITY REQUIRED FIELDS                                 │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Required at creation:                                   │ │
│ │ ☑ Expected value (min: €[1000])                         │ │
│ │ ☑ Expected close date                                   │ │
│ │ ☑ Owner                                                 │ │
│ │                                                         │ │
│ │ Required before Won:                                    │ │
│ │ ☑ Won value                                             │ │
│ │ ☑ Contract start date                                   │ │
│ │                                                         │ │
│ │ Required before Lost:                                   │ │
│ │ ☑ Loss reason                                           │ │
│ │ ☑ Loss notes (min [50] characters)                      │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ VALIDATION RULES                                            │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ ☑ Validate email format (RFC 5322)                      │ │
│ │ ☑ Validate phone format (E.164)                         │ │
│ │ ☑ Prevent duplicate emails per tenant                   │ │
│ │ ☑ Won value must be ≥ 50% of expected value             │ │
│ │ ☑ Expected close date cannot be in the past             │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## SECTION 7 - REGIONAL SETTINGS

### 7.1 Configuration UI

```
┌─────────────────────────────────────────────────────────────┐
│ Regional Settings                                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ 💰 CURRENCIES                                               │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Default currency: [EUR - Euro ▼]                        │ │
│ │                                                         │ │
│ │ Supported currencies:                                   │ │
│ │ ☑ EUR (€) - Euro                                        │ │
│ │ ☑ USD ($) - US Dollar                                   │ │
│ │ ☑ AED (د.إ) - UAE Dirham                                │ │
│ │ ☑ GBP (£) - British Pound                               │ │
│ │ ☑ SAR (﷼) - Saudi Riyal                                 │ │
│ │ [+ Add currency]                                        │ │
│ │                                                         │ │
│ │ Exchange rate update: [Daily ▼] from [ECB ▼]            │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ 📅 DATE & TIME                                              │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Date format: [DD/MM/YYYY ▼]                             │ │
│ │ Time format: [24h ▼]                                    │ │
│ │ Week starts on: [Monday ▼]                              │ │
│ │ Default timezone: [Europe/Paris ▼]                      │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ 🌍 LOCALIZATION                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Default language: [English ▼]                           │ │
│ │ Available languages:                                    │ │
│ │ ☑ English (en)                                          │ │
│ │ ☑ French (fr)                                           │ │
│ │ ☑ Arabic (ar) - RTL support                             │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ 📊 NUMBER FORMATTING                                        │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Decimal separator: [, (comma) ▼]                        │ │
│ │ Thousands separator: [  (space) ▼]                      │ │
│ │ Example: 1 234 567,89                                   │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## UX/UI GUIDELINES

### Navigation Structure

```
Settings (sidebar menu)
├── General
├── Team & Permissions
├── Integrations
└── CRM Settings ← Notre page
    ├── Pipeline
    │   ├── Lead Stages
    │   └── Opportunity Stages
    ├── Scoring
    │   ├── Fit Score Rules
    │   ├── Engagement Rules
    │   └── Thresholds
    ├── Assignment
    │   └── Assignment Rules
    ├── Loss Reasons
    ├── Notifications
    ├── Data Quality
    └── Regional
```

### Page Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│ ← Settings                                                          │
│                                                                     │
│ CRM Settings                                                        │
│ Configure your CRM pipeline, scoring, and automation rules          │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│ [Pipeline] [Scoring] [Assignment] [Loss Reasons] [Notifications]    │
│            [Data Quality] [Regional]                                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                                                             │   │
│  │              (Section content here)                         │   │
│  │                                                             │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│ Last saved: 2 minutes ago by Ahmed      [Discard Changes] [Save]    │
└─────────────────────────────────────────────────────────────────────┘
```

### Design Tokens (Cohérence FleetCore)

| Element        | Style                                            |
| -------------- | ------------------------------------------------ |
| Section header | `text-lg font-semibold text-gray-900`            |
| Subsection     | `text-base font-medium text-gray-700`            |
| Helper text    | `text-sm text-gray-500`                          |
| Cards          | `bg-white rounded-lg border border-gray-200 p-4` |
| Input fields   | Shadcn/ui `Input`, `Select`, `Switch`            |
| Buttons        | Shadcn/ui `Button` variants                      |
| Tabs           | Shadcn/ui `Tabs` component                       |
| Drag handles   | `≡` icon with `cursor-grab`                      |

### Interactions

1. **Auto-save draft** : Les modifications sont sauvegardées en local storage
2. **Validation en temps réel** : Erreurs affichées immédiatement
3. **Preview** : Voir l'impact avant de sauvegarder
4. **Undo/Redo** : Ctrl+Z / Ctrl+Y supportés
5. **Confirmation** : Modal de confirmation pour changements critiques

---

## API ENDPOINTS

### CRM Settings CRUD

| Method | Endpoint                              | Description                  |
| ------ | ------------------------------------- | ---------------------------- |
| `GET`  | `/api/v1/crm/settings`                | Liste tous les settings      |
| `GET`  | `/api/v1/crm/settings/:category`      | Settings par catégorie       |
| `GET`  | `/api/v1/crm/settings/:category/:key` | Setting spécifique           |
| `PUT`  | `/api/v1/crm/settings/:category/:key` | Update setting               |
| `POST` | `/api/v1/crm/settings/bulk`           | Update multiple settings     |
| `GET`  | `/api/v1/crm/settings/export`         | Export configuration JSON    |
| `POST` | `/api/v1/crm/settings/import`         | Import configuration JSON    |
| `GET`  | `/api/v1/crm/settings/history`        | Historique des modifications |

### Loss Reasons CRUD

| Method   | Endpoint                       | Description           |
| -------- | ------------------------------ | --------------------- |
| `GET`    | `/api/v1/crm/loss-reasons`     | Liste tous les motifs |
| `POST`   | `/api/v1/crm/loss-reasons`     | Créer un motif        |
| `PUT`    | `/api/v1/crm/loss-reasons/:id` | Modifier un motif     |
| `DELETE` | `/api/v1/crm/loss-reasons/:id` | Désactiver un motif   |

---

## PERMISSIONS & ACCESS CONTROL

### Roles et Permissions

| Permission             | Admin | Manager | Sales Rep |
| ---------------------- | ----- | ------- | --------- |
| View CRM Settings      | ✅    | ✅      | ❌        |
| Edit Pipeline Config   | ✅    | ❌      | ❌        |
| Edit Scoring Rules     | ✅    | ✅      | ❌        |
| Edit Assignment Rules  | ✅    | ✅      | ❌        |
| Manage Loss Reasons    | ✅    | ✅      | ❌        |
| Edit Notifications     | ✅    | ✅      | ❌        |
| Edit Data Quality      | ✅    | ❌      | ❌        |
| Edit Regional Settings | ✅    | ❌      | ❌        |
| Export/Import Config   | ✅    | ❌      | ❌        |

---

## ESTIMATION & PRIORITÉS

### Phase 1 - Core (16h) - Priorité HAUTE

- [ ] Page structure + navigation (2h)
- [ ] Pipeline Configuration UI (4h)
- [ ] API Settings CRUD (4h)
- [ ] Loss Reasons Management (6h)

### Phase 2 - Scoring (8h) - Priorité HAUTE

- [ ] Fit Score Rules UI (3h)
- [ ] Engagement Score Rules UI (3h)
- [ ] Thresholds Configuration (2h)

### Phase 3 - Assignment & Notifications (8h) - Priorité MOYENNE

- [ ] Assignment Rules UI + Editor (4h)
- [ ] Notifications Configuration (4h)

### Phase 4 - Advanced (8h) - Priorité BASSE

- [ ] Data Quality Rules (2h)
- [ ] Regional Settings (2h)
- [ ] Import/Export (2h)
- [ ] History/Audit trail (2h)

**TOTAL : 32-40 heures (4-5 jours)**

---

## FICHIERS À CRÉER

```
app/[locale]/(app)/settings/crm/
├── page.tsx                        # Page principale avec tabs
├── loading.tsx                     # Skeleton loading
├── layout.tsx                      # Layout avec breadcrumb
└── components/
    ├── CrmSettingsClient.tsx       # Client component principal
    ├── PipelineSettings.tsx        # Section Pipeline
    ├── ScoringSettings.tsx         # Section Scoring
    ├── AssignmentSettings.tsx      # Section Assignment
    ├── LossReasonsSettings.tsx     # Section Loss Reasons
    ├── NotificationsSettings.tsx   # Section Notifications
    ├── DataQualitySettings.tsx     # Section Data Quality
    ├── RegionalSettings.tsx        # Section Regional
    ├── StageEditor.tsx             # Composant édition stage
    ├── RuleEditor.tsx              # Composant édition règle
    └── SettingsPreview.tsx         # Preview des changements

lib/
├── services/crm/
│   └── settings.service.ts         # Service métier settings
├── actions/crm/
│   └── settings.actions.ts         # Server actions
└── validators/
    └── crm-settings.validators.ts  # Schemas Zod

app/api/v1/crm/
├── settings/
│   ├── route.ts                    # GET all, POST bulk
│   └── [category]/
│       └── [key]/
│           └── route.ts            # GET/PUT specific
└── loss-reasons/
    ├── route.ts                    # GET all, POST
    └── [id]/
        └── route.ts                # PUT, DELETE
```

---

**FIN DE LA SPÉCIFICATION**
