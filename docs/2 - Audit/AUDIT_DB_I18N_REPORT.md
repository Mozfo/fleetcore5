# AUDIT DB I18N - RAPPORT COMPLET

**Date**: 21 Decembre 2025
**Version**: 1.0
**Statut**: CRITIQUE - Nombreuses violations detectees

---

## RESUME EXECUTIF

| Metrique                  | Valeur                       |
| ------------------------- | ---------------------------- |
| **Colonnes conformes**    | 2                            |
| **Colonnes en violation** | 108                          |
| **Taux de conformite**    | **1.85%**                    |
| **Pattern de reference**  | `dir_notification_templates` |

### Pattern JSONB Conforme

```sql
-- Seule table conforme: dir_notification_templates
subject_translations JSONB NOT NULL  -- {"en": "...", "fr": "...", "ar": "..."}
body_translations    JSONB NOT NULL
-- Avec CHECK constraint:
CHECK (jsonb_typeof(subject_translations) = 'object' AND jsonb_typeof(body_translations) = 'object')
```

---

## VIOLATIONS PAR DOMAINE

| Domaine                  | Conformes | Violations | Total | Priorite    |
| ------------------------ | --------- | ---------- | ----- | ----------- |
| Autres (ref tables)      | 0         | 23         | 23    | P2          |
| Directory (dir\_\*)      | 2         | 15         | 17    | P1          |
| CRM (crm\_\*)            | 0         | 15         | 15    | P1          |
| Billing (bil\_\*)        | 0         | 13         | 13    | P0 CRITIQUE |
| Administration (adm\_\*) | 0         | 12         | 12    | P2          |
| Finance (fin\_\*)        | 0         | 12         | 12    | P3          |
| Fleet (flt\_\*)          | 0         | 12         | 12    | P3          |
| Rideshare (rid\_\*)      | 0         | 6          | 6     | P3          |

---

## DETAIL PAR PREFIXE DE TABLE

### bil\_\* (Billing) - P0 CRITIQUE

Ces tables sont affichees dans le QuoteForm aux clients. Textes monolingues = experience client degradee.

| Table                      | Colonne     | Type actuel  | Statut    | Action requise                               |
| -------------------------- | ----------- | ------------ | --------- | -------------------------------------------- |
| `bil_plans`                | name        | VARCHAR(200) | VIOLATION | Migrer vers `name_translations` JSONB        |
| `bil_plans`                | description | TEXT         | VIOLATION | Migrer vers `description_translations` JSONB |
| `bil_addons`               | name        | VARCHAR(200) | VIOLATION | Migrer vers `name_translations` JSONB        |
| `bil_addons`               | description | TEXT         | VIOLATION | Migrer vers `description_translations` JSONB |
| `bil_services`             | name        | VARCHAR(200) | VIOLATION | Migrer vers `name_translations` JSONB        |
| `bil_services`             | description | TEXT         | VIOLATION | Migrer vers `description_translations` JSONB |
| `bil_promotions`           | description | TEXT         | VIOLATION | Migrer vers `description_translations` JSONB |
| `bil_billing_plans`        | description | TEXT         | VIOLATION | Migrer vers `description_translations` JSONB |
| `bil_usage_metric_types`   | name        | VARCHAR(50)  | VIOLATION | Migrer vers `name_translations` JSONB        |
| `bil_usage_metric_types`   | description | TEXT         | VIOLATION | Migrer vers `description_translations` JSONB |
| `bil_amendments`           | reason      | TEXT         | TECHNIQUE | Texte libre utilisateur - CONSERVER          |
| `bil_tenant_invoice_lines` | description | TEXT         | TECHNIQUE | Texte libre utilisateur - CONSERVER          |

**Donnees actuelles (Anglais seulement):**

```
bil_plans:
- FleetCore Starter: "Ideal for small fleets starting their digital transformation"
- FleetCore Professional: "Complete solution for growing fleets with advanced features"
- FleetCore Enterprise: "Unlimited capacity with premium features for large operations"

bil_addons:
- Maintenance Module: "Comprehensive vehicle maintenance tracking with predictive alerts"
- Fuel Card Integration: "Integration with major fuel card providers for automated expense tracking"
- API Access: "Full REST API access for custom integrations"
```

### dir\_\* (Directory) - P1 HAUTE

Tables de reference affichees partout dans l'UI.

| Table                        | Colonne              | Type actuel  | Statut    | Action requise                               |
| ---------------------------- | -------------------- | ------------ | --------- | -------------------------------------------- |
| `dir_notification_templates` | subject_translations | JSONB        | CONFORME  | Aucune                                       |
| `dir_notification_templates` | body_translations    | JSONB        | CONFORME  | Aucune                                       |
| `dir_vehicle_classes`        | name                 | TEXT         | VIOLATION | Migrer vers `name_translations` JSONB        |
| `dir_vehicle_classes`        | description          | TEXT         | VIOLATION | Migrer vers `description_translations` JSONB |
| `dir_vehicle_statuses`       | name                 | VARCHAR(100) | VIOLATION | Migrer vers `name_translations` JSONB        |
| `dir_vehicle_statuses`       | description          | TEXT         | VIOLATION | Migrer vers `description_translations` JSONB |
| `dir_platforms`              | name                 | TEXT         | VIOLATION | Migrer vers `name_translations` JSONB        |
| `dir_platforms`              | description          | TEXT         | VIOLATION | Migrer vers `description_translations` JSONB |
| `dir_car_makes`              | name                 | TEXT         | TECHNIQUE | Noms de marques universels - CONSERVER       |
| `dir_car_models`             | name                 | TEXT         | TECHNIQUE | Noms de modeles universels - CONSERVER       |
| `dir_maintenance_types`      | label                | VARCHAR(255) | VIOLATION | Migrer vers `label_translations` JSONB       |
| `dir_maintenance_types`      | description          | TEXT         | VIOLATION | Migrer vers `description_translations` JSONB |
| `dir_ownership_types`        | name                 | VARCHAR(100) | VIOLATION | Migrer vers `name_translations` JSONB        |
| `dir_ownership_types`        | description          | TEXT         | VIOLATION | Migrer vers `description_translations` JSONB |
| `dir_fine_types`             | description          | TEXT         | VIOLATION | Migrer vers `description_translations` JSONB |
| `dir_transaction_types`      | description          | TEXT         | VIOLATION | Migrer vers `description_translations` JSONB |
| `dir_transaction_statuses`   | description          | TEXT         | VIOLATION | Migrer vers `description_translations` JSONB |

**PROBLEME DETECTE - Langues melangees:**

```sql
dir_vehicle_classes:
- Economy: "Standard sedan vehicles (Toyota Camry, Honda Accord)"        -- EN
- Comfort: "Premium sedan vehicles (Mercedes E-Class, BMW 5 Series)"    -- EN
- Berline: "Vehicules berline standard (Peugeot 508, Renault Talisman)" -- FR
- Van: "Vehicules multi-passagers (Mercedes Vito, Renault Trafic)"      -- FR
```

### crm\_\* (CRM) - P1 HAUTE

| Table                 | Colonne          | Type actuel  | Statut    | Action requise                               |
| --------------------- | ---------------- | ------------ | --------- | -------------------------------------------- |
| `crm_lead_sources`    | name             | VARCHAR(50)  | VIOLATION | Migrer vers `name_translations` JSONB        |
| `crm_lead_sources`    | description      | TEXT         | VIOLATION | Migrer vers `description_translations` JSONB |
| `crm_pipelines`       | name             | VARCHAR(100) | VIOLATION | Migrer vers `name_translations` JSONB        |
| `crm_pipelines`       | description      | TEXT         | VIOLATION | Migrer vers `description_translations` JSONB |
| `crm_settings`        | description      | TEXT         | TECHNIQUE | Config interne - CONSERVER                   |
| `crm_lead_activities` | title            | VARCHAR(255) | TECHNIQUE | Texte libre utilisateur - CONSERVER          |
| `crm_lead_activities` | description      | TEXT         | TECHNIQUE | Texte libre utilisateur - CONSERVER          |
| `crm_leads`           | message          | TEXT         | TECHNIQUE | Message client - CONSERVER                   |
| `crm_opportunities`   | notes            | TEXT         | TECHNIQUE | Notes utilisateur - CONSERVER                |
| `crm_opportunities`   | loss_reason      | VARCHAR(50)  | A EVALUER | Enum i18n ou texte libre?                    |
| `crm_orders`          | notes            | TEXT         | TECHNIQUE | Notes utilisateur - CONSERVER                |
| `crm_quotes`          | notes            | TEXT         | TECHNIQUE | Notes utilisateur - CONSERVER                |
| `crm_quotes`          | rejection_reason | TEXT         | TECHNIQUE | Texte libre - CONSERVER                      |
| `crm_quote_items`     | name             | VARCHAR(200) | TECHNIQUE | Copie du catalogue - heritage                |
| `crm_quote_items`     | description      | TEXT         | TECHNIQUE | Copie du catalogue - heritage                |

**Donnees crm_lead_sources (Francais):**

```
- Organic: "Trafic naturel depuis fleetcore.com"
- Google Ads: "Campagnes payantes Google/Bing"
- Facebook: "Facebook & Instagram Ads"
- Referral: "Parrainage client/partenaire"
- Partner: "Integrations plateforme (Uber, Careem)"
```

### adm\_\* (Administration) - P2 MOYENNE

| Table                         | Colonne     | Type actuel  | Statut    | Action requise                               |
| ----------------------------- | ----------- | ------------ | --------- | -------------------------------------------- |
| `adm_roles`                   | name        | VARCHAR(100) | VIOLATION | Migrer vers `name_translations` JSONB        |
| `adm_roles`                   | description | TEXT         | VIOLATION | Migrer vers `description_translations` JSONB |
| `adm_providers`               | name        | VARCHAR(200) | TECHNIQUE | Nom commercial unique - CONSERVER            |
| `adm_tenants`                 | name        | TEXT         | TECHNIQUE | Nom commercial unique - CONSERVER            |
| `adm_provider_employees`      | title       | VARCHAR(50)  | A EVALUER | Titres de poste i18n?                        |
| `adm_tenant_vehicle_classes`  | name        | VARCHAR(100) | VIOLATION | Migrer vers `name_translations` JSONB        |
| `adm_tenant_vehicle_classes`  | description | TEXT         | VIOLATION | Migrer vers `description_translations` JSONB |
| `adm_tenant_lifecycle_events` | description | TEXT         | TECHNIQUE | Log technique - CONSERVER                    |
| `adm_audit_logs`              | action      | VARCHAR(50)  | TECHNIQUE | Code action - CONSERVER                      |
| `adm_notification_logs`       | subject     | TEXT         | TECHNIQUE | Copie envoyee - CONSERVER                    |
| `adm_notification_logs`       | body        | TEXT         | TECHNIQUE | Copie envoyee - CONSERVER                    |
| `adm_role_permissions`        | action      | VARCHAR(50)  | TECHNIQUE | Code permission - CONSERVER                  |

### fin\_\* (Finance) - P3 BASSE

| Table                        | Colonne     | Type actuel | Statut    | Action requise                               |
| ---------------------------- | ----------- | ----------- | --------- | -------------------------------------------- |
| `fin_account_types`          | label       | TEXT        | VIOLATION | Migrer vers `label_translations` JSONB       |
| `fin_account_types`          | description | TEXT        | VIOLATION | Migrer vers `description_translations` JSONB |
| `fin_payment_statuses`       | label       | TEXT        | VIOLATION | Migrer vers `label_translations` JSONB       |
| `fin_payment_statuses`       | description | TEXT        | VIOLATION | Migrer vers `description_translations` JSONB |
| `fin_payment_batch_statuses` | label       | TEXT        | VIOLATION | Migrer vers `label_translations` JSONB       |
| `fin_payment_batch_statuses` | description | TEXT        | VIOLATION | Migrer vers `description_translations` JSONB |
| `fin_transaction_categories` | name        | TEXT        | VIOLATION | Migrer vers `name_translations` JSONB        |
| `fin_transaction_categories` | description | TEXT        | VIOLATION | Migrer vers `description_translations` JSONB |
| `fin_accounts`               | description | TEXT        | TECHNIQUE | Compte utilisateur - CONSERVER               |
| `fin_transactions`           | description | TEXT        | TECHNIQUE | Description transaction - CONSERVER          |
| `fin_driver_payments`        | notes       | TEXT        | TECHNIQUE | Notes utilisateur - CONSERVER                |
| `fin_traffic_fine_disputes`  | reason      | TEXT        | TECHNIQUE | Texte libre - CONSERVER                      |

### flt\_\* (Fleet) - P3 BASSE

| Table                     | Colonne     | Type actuel  | Statut    | Action requise                               |
| ------------------------- | ----------- | ------------ | --------- | -------------------------------------------- |
| `flt_vehicle_equipments`  | name        | VARCHAR(100) | VIOLATION | Migrer vers `name_translations` JSONB        |
| `flt_vehicle_equipments`  | description | TEXT         | VIOLATION | Migrer vers `description_translations` JSONB |
| `flt_vehicle_equipments`  | notes       | TEXT         | TECHNIQUE | Notes utilisateur - CONSERVER                |
| `flt_vehicle_assignments` | notes       | TEXT         | TECHNIQUE | Notes utilisateur - CONSERVER                |
| `flt_vehicle_events`      | notes       | TEXT         | TECHNIQUE | Notes utilisateur - CONSERVER                |
| `flt_vehicle_expenses`    | description | TEXT         | TECHNIQUE | Description depense - CONSERVER              |
| `flt_vehicle_expenses`    | notes       | TEXT         | TECHNIQUE | Notes utilisateur - CONSERVER                |
| `flt_vehicle_inspections` | notes       | TEXT         | TECHNIQUE | Notes utilisateur - CONSERVER                |
| `flt_vehicle_insurances`  | notes       | TEXT         | TECHNIQUE | Notes utilisateur - CONSERVER                |
| `flt_vehicle_maintenance` | notes       | TEXT         | TECHNIQUE | Notes utilisateur - CONSERVER                |

### rid\_\* (Rideshare) - P3 BASSE

| Table                   | Colonne     | Type actuel | Statut    | Action requise                               |
| ----------------------- | ----------- | ----------- | --------- | -------------------------------------------- |
| `rid_drivers`           | notes       | TEXT        | TECHNIQUE | Notes utilisateur - CONSERVER                |
| `rid_driver_blacklists` | reason      | TEXT        | TECHNIQUE | Raison blocage - CONSERVER                   |
| `rid_driver_training`   | description | TEXT        | VIOLATION | Migrer vers `description_translations` JSONB |

---

## DONNEES A MIGRER

### Volume par table critique

| Table                 | Lignes a migrer | Colonnes | Effort |
| --------------------- | --------------- | -------- | ------ |
| `dir_vehicle_classes` | 7               | 2        | Faible |
| `crm_lead_sources`    | 6               | 2        | Faible |
| `adm_roles`           | 5               | 2        | Faible |
| `dir_platforms`       | 3               | 2        | Faible |
| `bil_plans`           | 3               | 2        | Moyen  |
| `bil_addons`          | 3               | 2        | Moyen  |
| `bil_services`        | 3               | 2        | Moyen  |

### Total estimé: ~30 lignes x 2 colonnes = ~60 valeurs a traduire

---

## PLAN DE CORRECTION PRIORITISE

### Sprint 1 - P0 CRITIQUE (Semaine 1)

**Objectif**: Catalogue produits multilingue

1. **Migration bil_plans**
   - Ajouter `name_translations JSONB`
   - Ajouter `description_translations JSONB`
   - Migrer donnees EN existantes
   - Ajouter traductions FR/AR
   - Mettre a jour `CatalogueService`

2. **Migration bil_addons** (meme pattern)

3. **Migration bil_services** (meme pattern)

4. **Mettre a jour types TypeScript**
   - `CataloguePlan`, `CatalogueAddon`, `CatalogueService`
   - Ajouter logique de selection de langue

### Sprint 2 - P1 HAUTE (Semaine 2)

**Objectif**: Tables de reference CRM/Directory

1. **Migration crm_lead_sources**
2. **Migration dir_vehicle_classes** (nettoyer melange FR/EN)
3. **Migration dir_platforms**
4. **Migration crm_pipelines**

### Sprint 3 - P2 MOYENNE (Semaine 3)

**Objectif**: Tables administration

1. **Migration adm_roles**
2. **Migration adm_tenant_vehicle_classes**

### Sprint 4 - P3 BASSE (Semaine 4+)

**Objectif**: Tables Finance/Fleet

1. **Migration fin_account_types**
2. **Migration fin_payment_statuses**
3. **Migration flt_vehicle_equipments**
4. **Migration rid_driver_training**

---

## SCRIPT SQL TYPE - Migration

```sql
-- Exemple: Migration bil_plans
-- Phase 1: Ajouter colonnes JSONB
ALTER TABLE bil_plans
ADD COLUMN name_translations JSONB,
ADD COLUMN description_translations JSONB;

-- Phase 2: Migrer donnees existantes (EN comme base)
UPDATE bil_plans SET
  name_translations = jsonb_build_object('en', name, 'fr', name, 'ar', name),
  description_translations = jsonb_build_object('en', description, 'fr', description, 'ar', description);

-- Phase 3: Ajouter contraintes
ALTER TABLE bil_plans
ADD CONSTRAINT chk_bil_plans_name_translations
  CHECK (jsonb_typeof(name_translations) = 'object'),
ADD CONSTRAINT chk_bil_plans_description_translations
  CHECK (jsonb_typeof(description_translations) = 'object');

-- Phase 4: Rendre NOT NULL apres verification
ALTER TABLE bil_plans
ALTER COLUMN name_translations SET NOT NULL,
ALTER COLUMN description_translations SET NOT NULL;

-- Phase 5: Supprimer anciennes colonnes (apres migration code complete)
-- ALTER TABLE bil_plans DROP COLUMN name, DROP COLUMN description;
```

---

## COLONNES A CONSERVER (Non-i18n)

Ces colonnes stockent du contenu utilisateur ou technique, pas des labels UI:

| Type                 | Exemples                                                          | Raison            |
| -------------------- | ----------------------------------------------------------------- | ----------------- |
| Noms commerciaux     | `adm_tenants.name`, `adm_providers.name`                          | Identite unique   |
| Messages utilisateur | `crm_leads.message`, `crm_quotes.notes`                           | Texte libre saisi |
| Noms marques/modeles | `dir_car_makes.name`, `dir_car_models.name`                       | Universels        |
| Logs techniques      | `adm_audit_logs.action`, `adm_notification_logs.body`             | Archivage         |
| Raisons libres       | `crm_quotes.rejection_reason`, `fin_traffic_fine_disputes.reason` | Texte libre       |

---

## RECOMMANDATIONS FINALES

### 1. Architecture cible

```
Colonne user-facing → JSONB *_translations
├── name → name_translations
├── description → description_translations
├── label → label_translations
└── title → title_translations
```

### 2. Helper TypeScript

```typescript
// lib/utils/i18n-db.ts
export function getTranslation(
  translations: Record<string, string> | null,
  locale: string,
  fallback: string = "en"
): string {
  if (!translations) return "";
  return (
    translations[locale] ||
    translations[fallback] ||
    Object.values(translations)[0] ||
    ""
  );
}
```

### 3. Mise a jour CatalogueService

```typescript
// Avant
return { name: plan.name, description: plan.description };

// Apres
return {
  name: getTranslation(plan.name_translations, locale),
  description: getTranslation(plan.description_translations, locale),
};
```

---

## CONCLUSION

- **108 colonnes** stockent du texte user-facing en VARCHAR/TEXT au lieu de JSONB translations
- **Seule table conforme**: `dir_notification_templates` (2 colonnes)
- **Priorite P0**: Catalogue Billing (bil_plans, bil_addons, bil_services) - impact client direct
- **Effort total estime**: 4 sprints pour conformite complete
- **~60 valeurs** a traduire dans les tables critiques

Le pattern `*_translations JSONB` avec structure `{"en": "...", "fr": "...", "ar": "..."}` doit devenir le standard pour toutes les colonnes affichees aux utilisateurs.
