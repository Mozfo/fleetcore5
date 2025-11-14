# FleetCore - Settings Pattern Architecture

**Date :** 2025-01-11
**Status :** SPECIFICATION
**Version :** 1.0

## 🎯 Vue d'ensemble

FleetCore implémente un pattern architectural standardisé pour la configuration dynamique de tous les modules via des tables `{module}_settings`.

**Principe fondamental :** Aucune règle métier, seuil, ou paramètre fonctionnel ne doit être hardcodé dans le code. Toute valeur pouvant nécessiter un ajustement métier doit être stockée en base de données et modifiable via interface admin.

---

## 🏗️ Convention de Nommage

**Format standard :**

```
{module}_settings
```

**Exemples :**

- `crm_settings` - Configuration module CRM (lead scoring, pipeline, automation)
- `adm_settings` - Configuration administration (tenant lifecycle, audit, permissions)
- `fleet_settings` - Configuration gestion flotte (vehicle types, maintenance rules)
- `billing_settings` - Configuration facturation (pricing tiers, payment terms)
- `notification_settings` - Configuration notifications (templates, channels, schedules)
- `compliance_settings` - Configuration conformité UAE/France (WPS, URSSAF, reporting)

---

## 📐 Structure Table Standard

Toutes les tables `{module}_settings` suivent cette structure :

```sql
CREATE TABLE {module}_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identification
  setting_key VARCHAR(100) UNIQUE NOT NULL,           -- Format: 'category.subcategory.name'
  setting_category VARCHAR(50) NOT NULL,              -- Groupement logique

  -- Valeur (JSONB flexible)
  setting_value JSONB NOT NULL,

  -- Métadonnées
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,

  -- Validation (optionnel)
  validation_schema JSONB,                            -- Zod schema sérialisé pour validation UI

  -- Audit trail
  created_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES adm_provider_employees(id),
  updated_at TIMESTAMP DEFAULT NOW(),
  updated_by UUID REFERENCES adm_provider_employees(id),
  version INT DEFAULT 1,                              -- Versioning pour rollback

  -- Contraintes (adapter selon module)
  CONSTRAINT valid_category CHECK (
    setting_category IN ('category1', 'category2', ...)
  )
);

-- Index standard
CREATE INDEX idx_{module}_settings_category ON {module}_settings(setting_category);
CREATE INDEX idx_{module}_settings_active ON {module}_settings(is_active) WHERE is_active = TRUE;
```

---

## 🔄 Pattern d'Utilisation

### 1. Repository Standard

```typescript
// lib/repositories/{module}/settings.repository.ts
export class {Module}SettingsRepository extends BaseRepository<{module}_settings> {

  async getByKey(key: string): Promise<any | null> {
    const setting = await this.model.findUnique({
      where: { setting_key: key, is_active: true }
    });
    return setting?.setting_value || null;
  }

  async getByCategory(category: string): Promise<Record<string, any>> {
    const settings = await this.model.findMany({
      where: { setting_category: category, is_active: true }
    });

    return settings.reduce((acc, setting) => {
      const key = setting.setting_key.replace(`${category}.`, '');
      acc[key] = setting.setting_value;
      return acc;
    }, {} as Record<string, any>);
  }

  async updateValue(key: string, value: any, updatedBy: string): Promise<void> {
    await this.model.update({
      where: { setting_key: key },
      data: {
        setting_value: value,
        updated_by: updatedBy,
        updated_at: new Date(),
        version: { increment: 1 }
      }
    });
  }
}
```

### 2. Service Pattern

```typescript
// lib/services/{module}/example.service.ts
export class ExampleService {
  private config: ServiceConfig;

  constructor(
    private settingsRepository: {Module}SettingsRepository
  ) {}

  async loadConfig(): Promise<void> {
    const settings = await this.settingsRepository.getByCategory('category');
    this.config = this.parseConfig(settings);
  }

  // Méthodes utilisent this.config au lieu de constantes hardcodées
}
```

---

## 📊 État Actuel par Module

### ✅ Module CRM

**Status :** ⚠️ DETTE TECHNIQUE
**Table :** `crm_settings` (NON CRÉÉE)
**Impact :** Configuration scoring hardcodée en constantes

#### Configuration Actuelle (Hardcodée)

**Fichier :** `lib/services/crm/lead-scoring.service.ts`

**Constantes hardcodées (lignes 99-208) :**

```typescript
const FLEET_SIZE_POINTS = {
  /* 40 points max */
};
const COUNTRY_TIER_POINTS = {
  /* 20 points max */
};
const MESSAGE_LENGTH_THRESHOLDS = {
  /* 30 points max */
};
const PHONE_POINTS = {
  /* 20 points */
};
const PAGE_VIEWS_THRESHOLDS = {
  /* 30 points max */
};
const TIME_ON_SITE_THRESHOLDS = {
  /* 20 points max */
};
const QUALIFICATION_STAGE_THRESHOLDS = {
  sales_qualified: 70,
  marketing_qualified: 40,
  top_of_funnel: 0,
};
const QUALIFICATION_WEIGHTS = {
  fit: 0.6,
  engagement: 0.4,
};
```

**Problème :** Si les seuils de qualification (70%, 40%) ne sont pas optimaux après tests réels, un admin doit :

1. Demander à un développeur de modifier le code
2. Attendre un déploiement
3. Pas d'audit trail des changements de règles métier

#### Settings Requis

**Table :** `crm_settings`

**Categories :**

- `scoring` - Règles de qualification leads
- `pipeline` - Configuration pipeline opportunités
- `automation` - Règles d'assignation automatique
- `notifications` - Templates et déclencheurs
- `general` - Paramètres généraux module

**Settings scoring à migrer :**

```sql
-- scoring.thresholds
{
  "sales_qualified": 70,
  "marketing_qualified": 40,
  "top_of_funnel": 0
}

-- scoring.weights
{
  "fit": 0.6,
  "engagement": 0.4
}

-- scoring.fleet_size_points
{
  "500+": {"vehicles": 600, "points": 40},
  "101-500": {"vehicles": 250, "points": 35},
  "51-100": {"vehicles": 75, "points": 30},
  "11-50": {"vehicles": 30, "points": 20},
  "1-10": {"vehicles": 5, "points": 5},
  "unknown": {"vehicles": 30, "points": 10}
}

-- scoring.country_tier_points
{
  "tier1": {"countries": ["AE","SA","QA"], "points": 20},
  "tier2": {"countries": ["FR"], "points": 18},
  "tier3": {"countries": ["KW","BH","OM"], "points": 15},
  "tier4": {"countries": ["DE","IT","ES",...], "points": 12},
  "tier5": {"points": 5}
}

-- scoring.engagement_thresholds
{
  "message": {"detailed": {"min": 200, "points": 30}, ...},
  "phone": {"provided": 20, "missing": 0},
  "page_views": {"very_engaged": {"min": 10, "points": 30}, ...},
  "time_on_site": {"deep_read": {"min": 600, "points": 20}, ...}
}
```

**Tâche de migration :** Sprint 2 - Tâche "CRM Dynamic Settings"

---

### ⏳ Module ADM (Administration)

**Status :** À PLANIFIER
**Table :** `adm_settings` (NON CRÉÉE)

#### Settings Requis

**Categories :**

- `lifecycle` - Règles lifecycle tenants (onboarding, suspension, offboarding)
- `audit` - Configuration audit trail (retention, triggers)
- `permissions` - Configuration RBAC avancée
- `compliance` - Règles conformité (UAE WPS, France URSSAF)
- `general` - Paramètres généraux administration

**Exemples settings :**

```sql
-- lifecycle.onboarding_steps
["contract_signed", "billing_setup", "driver_import", "vehicle_setup", "training", "go_live"]

-- lifecycle.suspension_grace_period_days
14  -- Délai avant suspension après impayé

-- audit.retention_days
{
  "security_events": 365,
  "financial_transactions": 2555,  -- 7 ans légal
  "user_actions": 90
}

-- compliance.uae_wps_config
{
  "enabled": true,
  "reporting_day": 5,  -- 5th of each month
  "grace_period_hours": 24
}
```

---

### ⏳ Module Fleet (Gestion Flotte)

**Status :** À PLANIFIER
**Table :** `fleet_settings` (NON CRÉÉE)

#### Settings Requis

**Categories :**

- `vehicle_types` - Configuration types véhicules et capacités
- `maintenance` - Règles maintenance préventive
- `fuel` - Configuration carburant et consommation
- `tracking` - Paramètres tracking temps réel
- `general` - Paramètres généraux flotte

**Exemples settings :**

```sql
-- vehicle_types.categories
{
  "sedan": {"capacity": 4, "luggage": 2, "base_rate": 50},
  "suv": {"capacity": 6, "luggage": 4, "base_rate": 80},
  "van": {"capacity": 8, "luggage": 6, "base_rate": 120}
}

-- maintenance.preventive_rules
{
  "oil_change_km": 5000,
  "tire_rotation_km": 10000,
  "major_service_km": 20000,
  "inspection_months": 6
}

-- tracking.refresh_intervals
{
  "active_ride": 30,    -- 30 secondes
  "available": 300,     -- 5 minutes
  "offline": 3600       -- 1 heure
}
```

---

### ⏳ Module Billing (Facturation)

**Status :** À PLANIFIER
**Table :** `billing_settings` (NON CRÉÉE)

#### Settings Requis

**Categories :**

- `pricing` - Configuration tarification par véhicule
- `payment` - Conditions paiement
- `invoicing` - Règles facturation
- `commission` - Calcul commissions plateformes
- `general` - Paramètres généraux facturation

**Exemples settings :**

```sql
-- pricing.tiers
{
  "tier1": {"min_vehicles": 1, "max_vehicles": 10, "price_per_vehicle": 50},
  "tier2": {"min_vehicles": 11, "max_vehicles": 50, "price_per_vehicle": 45},
  "tier3": {"min_vehicles": 51, "max_vehicles": 100, "price_per_vehicle": 40},
  "tier4": {"min_vehicles": 101, "max_vehicles": null, "price_per_vehicle": 35}
}

-- payment.terms
{
  "default_due_days": 30,
  "early_payment_discount_percent": 2,
  "late_payment_fee_percent": 5,
  "auto_suspend_after_days": 14
}

-- commission.uber_rates
{
  "base_commission": 0.25,     -- 25%
  "min_per_ride": 2.5,
  "max_per_ride": 50
}
```

---

### ⏳ Module Notification

**Status :** À PLANIFIER
**Table :** `notification_settings` (NON CRÉÉE)

#### Settings Requis

**Categories :**

- `templates` - Templates notifications (email, SMS, WhatsApp)
- `channels` - Configuration canaux (providers, API keys)
- `schedules` - Règles d'envoi (digest, batch)
- `preferences` - Préférences par défaut utilisateurs
- `general` - Paramètres généraux notifications

**Exemples settings :**

```sql
-- channels.email
{
  "provider": "resend",
  "from_name": "FleetCore",
  "from_email": "noreply@fleetcore.ae",
  "reply_to": "support@fleetcore.ae"
}

-- schedules.digest
{
  "daily_report_time": "08:00",
  "weekly_report_day": "monday",
  "monthly_report_day": 1
}

-- preferences.defaults
{
  "email_enabled": true,
  "sms_enabled": false,
  "whatsapp_enabled": true,
  "digest_frequency": "daily"
}
```

---

### ⏳ Module Compliance

**Status :** À PLANIFIER
**Table :** `compliance_settings` (NON CRÉÉE)

#### Settings Requis

**Categories :**

- `uae_wps` - UAE Wage Protection System
- `france_urssaf` - France URSSAF reporting
- `gdpr` - GDPR compliance rules
- `data_retention` - Règles rétention données
- `general` - Paramètres généraux conformité

**Exemples settings :**

```sql
-- uae_wps.config
{
  "enabled": true,
  "sif_file_generation_day": 5,
  "grace_period_hours": 24,
  "auto_retry_failed": true,
  "notification_recipients": ["hr@fleetcore.ae", "finance@fleetcore.ae"]
}

-- france_urssaf.config
{
  "enabled": true,
  "dsn_submission_day": 5,
  "establishment_codes": ["12345678901234"],
  "contact_email": "social@fleetcore.fr"
}

-- gdpr.data_retention
{
  "user_data_years": 2,
  "financial_data_years": 7,
  "log_data_months": 6,
  "deleted_user_anonymize_days": 30
}
```

---

## 🚀 Plan de Migration

### Phase 1 - Sprint 2 (Prioritaire)

**Module CRM :**

1. Créer table `crm_settings`
2. Créer `CrmSettingsRepository`
3. Migrer `LeadScoringService` pour utiliser DB
4. Seeds configuration scoring actuelle
5. Tests mise à jour

**Durée estimée :** 1h30-2h

---

### Phase 2 - Sprint 3-4

**Module ADM :**

- Table `adm_settings`
- Configuration lifecycle, audit, compliance
- Migrer règles hardcodées vers DB

**Module Notification :**

- Table `notification_settings`
- Configuration templates, channels
- Migrer configuration provider vers DB

**Durée estimée :** 3-4h par module

---

### Phase 3 - Sprint 5-6 (Backend complet)

**Module Fleet :**

- Table `fleet_settings`
- Configuration vehicle types, maintenance, tracking

**Module Billing :**

- Table `billing_settings`
- Configuration pricing, payment terms, commissions

**Module Compliance :**

- Table `compliance_settings`
- Configuration WPS, URSSAF, GDPR

**Durée estimée :** 3-4h par module

---

### Phase 4 - Interface Admin (Sprint 7+)

**Développement UI :**

- `/admin/settings/{module}` - Pages gestion settings par module
- Formulaires édition avec validation Zod
- Preview impact changements
- Historique versions (audit trail)
- Rollback configuration précédente

**Fonctionnalités :**

- CRUD settings via interface
- Validation temps réel
- Confirmation avant changements critiques
- Export/Import configuration (backup)

**Durée estimée :** 2-3 jours développement

---

## 🎯 Bénéfices Attendus

### Business

1. **Autonomie métier** - Manager peut ajuster règles sans développeur
2. **Réactivité** - Changements immédiats sans déploiement
3. **A/B Testing** - Tester différentes configurations facilement
4. **Audit trail** - Historique complet des changements de règles

### Technique

1. **Maintenabilité** - Code découplé de la configuration
2. **Testabilité** - Tests unitaires avec configs mockées
3. **Scalabilité** - Ajout nouveaux settings sans code
4. **Standardisation** - Pattern cohérent tous modules

### Opérationnel

1. **Rollback rapide** - Retour version précédente en 1 clic
2. **Documentation auto** - Description settings dans DB
3. **Validation** - Schema Zod empêche valeurs invalides
4. **Multi-environment** - Configs différentes dev/staging/prod

---

## 📋 Checklist Implémentation

Pour chaque nouveau module nécessitant settings :

- [ ] Créer table `{module}_settings` avec structure standard
- [ ] Créer `{Module}SettingsRepository` avec méthodes CRUD
- [ ] Identifier toutes constantes hardcodées à migrer
- [ ] Créer seeds avec configuration par défaut
- [ ] Modifier services pour lire depuis DB
- [ ] Mettre à jour tests unitaires
- [ ] Tests intégration avec vraie DB
- [ ] Documentation settings dans README module
- [ ] (Optionnel) Interface admin pour édition

---

## 🔗 Références

- **BaseRepository Pattern :** `/docs/architecture/BASE_REPOSITORY.md`
- **Audit Trail Standard :** `/docs/architecture/AUDIT_TRAIL.md`
- **JSONB Best Practices :** `/docs/architecture/JSONB_USAGE.md`

---

**Dernière mise à jour :** 2025-01-11
**Auteur :** Architecture Team
**Status :** SPECIFICATION APPROUVÉE
