# FLEETCORE - MODULE ADM : PLAN D'EXÉCUTION DÉTAILLÉ

## CHAPITRE 5 : CONFIGURATION (Settings, Vehicle Classes, Provider Employees)

**Date:** 10 Novembre 2025  
**Version:** 1.0 DÉFINITIVE  
**Périmètre:** Configuration et gestion centralisée du système  
**Méthodologie:** Implémentation verticale par fonctionnalité démontrable

---

## 📋 TABLE DES MATIÈRES - CHAPITRE 5

1. [Introduction Chapitre 5](#introduction-chapitre-5)
2. [ÉTAPE 5.1 : Tenant Settings Management](#étape-51--tenant-settings-management)
3. [ÉTAPE 5.2 : Vehicle Classes Configuration](#étape-52--vehicle-classes-configuration)
4. [ÉTAPE 5.3 : Provider Employees Management](#étape-53--provider-employees-management)

---

## INTRODUCTION CHAPITRE 5

### Contexte et Objectifs

Le **Chapitre 5 - Configuration** représente la couche de paramétrage et d'administration système de FleetCore. Il gère trois aspects critiques :

1. **Settings Tenants** : Configuration dynamique par client (timezone, devise, business_hours, limites, branding)
2. **Vehicle Classes** : Taxonomie personnalisée des véhicules par tenant (berline, SUV, VTC Premium, etc.)
3. **Provider Employees** : Équipe FleetCore avec permissions cross-tenant (support, commercial, admin)

**Enjeux business critiques :**

- **Autonomie clients** : Réduire tickets support de 200/mois à 20/mois via self-service settings
- **Personnalisation** : Permettre adaptation locale (timezone UAE vs France, classes véhicules spécifiques)
- **Support efficace** : Staff FleetCore peut intervenir cross-tenant avec permissions granulaires
- **Traçabilité** : Audit complet des modifications settings et actions support
- **Scalabilité** : Architecture supportant 1000+ tenants avec settings hétérogènes

### Architecture Globale Chapitre 5

**3 tables interdépendantes organisées en 3 domaines :**

**DOMAINE 1 : SETTINGS DYNAMIQUES**

- `adm_tenant_settings` : Configuration key-value par tenant avec validation et versioning

**DOMAINE 2 : TAXONOMIE VÉHICULES**

- `adm_tenant_vehicle_classes` : Classes véhicules personnalisées par tenant

**DOMAINE 3 : ÉQUIPE PROVIDER**

- `adm_provider_employees` : Staff FleetCore avec accès cross-tenant et permissions spéciales

### Périmètre Chapitre 5

**ÉTAPE 5.1 (2 jours) : Tenant Settings Management**

- CRUD settings avec validation stricte (timezone IANA, currency ISO 4217)
- Versioning settings pour rollback
- Catégories : Localisation, Business, Notifications, Facturation, Limites, Branding
- APIs REST complètes (GET, PUT bulk, historique)
- Audit automatique de toutes modifications

**ÉTAPE 5.2 (1.5 jours) : Vehicle Classes Configuration**

- Définition classes véhicules personnalisées par tenant
- Paramètres : nombre_places, capacité_coffre, équipements, tarification
- Mapping vers classes plateforme (Uber Black, Careem Business, etc.)
- Gestion active/inactive, ordre affichage
- APIs et UI admin pour gestion classes

**ÉTAPE 5.3 (2 jours) : Provider Employees Management**

- Gestion staff FleetCore (support, commercial, tech, admin)
- Permissions cross-tenant avec scope (ALL tenants ou liste spécifique)
- Permissions spéciales (impersonate, override_limits, billing_access)
- Tracking activité et attribution tickets support
- APIs admin-only avec sécurité renforcée

**Livrable fin Chapitre 5 :**

- Settings tenant modifiables via UI avec validation stricte
- Classes véhicules personnalisables par tenant
- Staff FleetCore opérationnel avec accès cross-tenant sécurisé
- Audit trail complet de toutes actions
- Dashboard admin pour gestion configuration

---

# ÉTAPE 5.1 : TENANT SETTINGS MANAGEMENT

**Durée :** 2 jours ouvrés (16 heures)  
**Objectif :** Implémenter système de configuration dynamique par tenant avec validation et versioning  
**Livrable démo :** Interface Settings permettant modification timezone, currency, business hours avec audit complet

---

## 🎯 RATIONNEL MÉTIER

**POURQUOI :** Chaque tenant a des besoins de configuration différents selon son pays, son activité, et ses préférences. ABC Logistics (UAE) a besoin de timezone Asia/Dubai, devise AED, business_hours 8h-18h. Après 3 mois, ils ouvrent une agence Paris → besoin de modifier timezone Europe/Paris, devise EUR, business_hours 7h-22h. Sans système de settings flexible, impossible d'adapter la plateforme aux spécificités locales.

**QUEL PROBLÈME :** Actuellement, les settings sont hardcodés dans le code ou dans des colonnes fixes de `adm_tenants`. Problème majeur :

1. **Rigidité** : Ajouter un nouveau setting = migration DB + déploiement code
2. **Support surchargé** : Chaque modification setting = ticket support = 1h de travail manuel
3. **Pas d'historique** : Impossible de savoir qui a changé quoi et quand
4. **Pas de validation** : Tenant peut mettre timezone="Invalid" → bugs partout
5. **Pas de rollback** : Erreur de config ? Impossible de revenir en arrière

**IMPACT SI ABSENT :**

- **Support** : 200 tickets/mois × 1h = 200h gaspillées pour modifier settings manuellement
- **Qualité** : Bugs timezone invalides, devise incorrecte → calculs financiers faux
- **Agilité** : Ajout nouveau setting = 2 semaines (dev + migration + deploy) au lieu de 5 minutes
- **Conformité** : Aucun audit des modifications settings → non-conformité SOC2/ISO27001
- **Scalabilité** : Impossible de gérer 1000+ tenants avec settings hétérogènes

**CAS D'USAGE CONCRET :**

**Contexte initial :**  
ABC Logistics démarre à Dubai le 1er septembre 2025 avec settings par défaut :

- Timezone : Asia/Dubai
- Currency : AED
- Business_hours : {"start": "08:00", "end": "18:00"}
- Date_format : DD/MM/YYYY
- Working_days : [1,2,3,4,5,6] (dimanche à vendredi, semaine UAE)

**3 mois plus tard (1er décembre 2025) :**  
ABC Logistics ouvre agence Paris avec 20 véhicules et équipe française.

**Besoin de modification :**

1. **Timezone** : Asia/Dubai → Europe/Paris (pour rapports locaux)
2. **Currency principale** : AED (mais besoin EUR pour agence Paris)
3. **Business_hours** : 8h-18h → 7h-22h (horaires étendus France)
4. **Date_format** : DD/MM/YYYY → DD/MM/YYYY (ok, identique)
5. **Working_days** : [1,2,3,4,5,6] → [1,2,3,4,5] (lundi-vendredi, semaine Europe)
6. **Notification_language** : en → fr (équipe francophone)

**Workflow sans SettingsService (problématique) :**

1. Admin ABC Logistics contacte support FleetCore : "On a ouvert agence Paris, besoin de changer timezone et horaires"
2. Ticket support créé, attente 24h
3. Support FleetCore se connecte en DB production (risque !)
4. Modifie manuellement 6 colonnes dans `adm_tenants`
5. Aucune validation → erreur timezone "Europe/Pari" (typo)
6. Système plante, calculs horaires faux pendant 3 jours
7. Aucun audit → impossible de savoir qui a fait l'erreur
8. **Délai total : 3 jours + bugs**

**Workflow avec SettingsService (solution) :**

1. Admin ABC Logistics se connecte à FleetCore
2. Va dans Settings > Localisation
3. Modifie timezone en sélectionnant dans liste validée : "Europe/Paris"
4. Va dans Settings > Business
5. Modifie business_hours : start "07:00", end "22:00"
6. Modifie working_days : décoche Samedi
7. Va dans Settings > Notifications
8. Change notification_language : en → fr
9. Clique "Save Changes"
10. Système valide :
    - ✅ Timezone valide (IANA database)
    - ✅ Business_hours cohérent (start < end)
    - ✅ Working_days array valide
11. Changements appliqués immédiatement
12. Audit log créé avec old_values et new_values
13. Notification envoyée à l'équipe : "Settings modifiés par admin@abclogistics.ae"
14. **Délai total : 2 minutes + 0 bugs**

**Valeur business :**

- **Temps support** : 200h/mois → 20h/mois (-90%, économie 6,000€/mois à 30€/h)
- **Qualité** : 0 bugs settings (validation stricte)
- **Autonomie** : Clients modifient settings eux-mêmes
- **Audit** : 100% modifications tracées
- **Agilité** : Nouveau setting = 5 minutes (ajout clé/valeur) vs 2 semaines (migration DB)

---

## 📊 DONNÉES ET RÈGLES MÉTIER

**Table principale : `adm_tenant_settings`**

**Colonnes critiques (11 colonnes) :**

| Colonne            | Type         | Obligatoire | Utilité Business                                                             |
| ------------------ | ------------ | ----------- | ---------------------------------------------------------------------------- |
| **id**             | uuid         | OUI         | Identifiant unique setting (PK)                                              |
| **tenant_id**      | uuid         | OUI         | Tenant propriétaire (FK → adm_tenants)                                       |
| **setting_key**    | varchar(100) | OUI         | Clé setting (ex: timezone, currency)                                         |
| **setting_value**  | jsonb        | OUI         | Valeur setting (type polymorphe)                                             |
| **category**       | varchar(50)  | OUI         | Catégorie (localization, business, notifications, billing, limits, branding) |
| **data_type**      | varchar(20)  | OUI         | Type données (string, number, boolean, array, object)                        |
| **is_encrypted**   | boolean      | OUI         | Données sensibles chiffrées ?                                                |
| **version**        | integer      | OUI         | Numéro version (auto-incrémenté)                                             |
| **previous_value** | jsonb        | NON         | Valeur précédente (pour rollback)                                            |
| **created_at**     | timestamp    | OUI         | Date création                                                                |
| **updated_at**     | timestamp    | OUI         | Date dernière modification                                                   |
| **updated_by**     | uuid         | NON         | Qui a modifié (FK → adm_members)                                             |

**Catégories de settings :**

### CATÉGORIE 1 : LOCALIZATION (Localisation)

| Setting Key          | Type   | Validations          | Exemple Valeur | Impact Business                           |
| -------------------- | ------ | -------------------- | -------------- | ----------------------------------------- |
| **timezone**         | string | IANA timezone valide | "Europe/Paris" | Rapports, notifications, calculs horaires |
| **default_currency** | string | ISO 4217 (3 lettres) | "EUR"          | Facturation, affichage prix               |
| **country_code**     | string | ISO 3166-1 alpha-2   | "FR"           | TVA, formats, compliance                  |
| **date_format**      | string | Enum valide          | "DD/MM/YYYY"   | Affichage dates UI                        |
| **time_format**      | string | Enum (12h/24h)       | "24h"          | Affichage heures UI                       |
| **locale**           | string | BCP 47               | "fr-FR"        | Formats nombres, devises                  |

### CATÉGORIE 2 : BUSINESS (Opérations)

| Setting Key           | Type    | Validations               | Exemple Valeur                  | Impact Business                  |
| --------------------- | ------- | ------------------------- | ------------------------------- | -------------------------------- |
| **business_hours**    | object  | start < end, format HH:mm | {"start":"07:00","end":"22:00"} | Disponibilité service, rapports  |
| **working_days**      | array   | [0-6], min 1 jour         | [1,2,3,4,5]                     | Planification, rapports activité |
| **holiday_calendar**  | string  | Code calendrier           | "FR-PUBLIC"                     | Jours fériés, indisponibilités   |
| **fiscal_year_start** | string  | Format MM-DD              | "01-01"                         | Rapports annuels, clôtures       |
| **week_start_day**    | integer | 0-6 (0=dimanche)          | 1                               | Rapports hebdo, calendriers      |

### CATÉGORIE 3 : NOTIFICATIONS (Communications)

| Setting Key               | Type    | Validations      | Exemple Valeur                | Impact Business           |
| ------------------------- | ------- | ---------------- | ----------------------------- | ------------------------- |
| **email_enabled**         | boolean | -                | true                          | Activation emails système |
| **sms_enabled**           | boolean | -                | false                         | Activation SMS            |
| **slack_webhook**         | string  | URL valide HTTPS | "https://hooks.slack.com/..." | Intégration Slack         |
| **notification_language** | string  | ISO 639-1        | "fr"                          | Langue emails/SMS         |
| **email_from_name**       | string  | Max 100 chars    | "FleetCore - ABC Logistics"   | Branding emails           |
| **email_reply_to**        | string  | Email valide     | "support@abclogistics.ae"     | Réponses emails           |

### CATÉGORIE 4 : BILLING (Facturation)

| Setting Key        | Type    | Validations            | Exemple Valeur            | Impact Business         |
| ------------------ | ------- | ---------------------- | ------------------------- | ----------------------- |
| **billing_email**  | string  | Email valide           | "billing@abclogistics.ae" | Envoi factures          |
| **tax_rate**       | number  | 0-100, max 2 décimales | 20.00                     | Calcul TVA              |
| **payment_terms**  | integer | > 0                    | 30                        | Délai paiement (jours)  |
| **invoice_prefix** | string  | Max 10 chars           | "ABC-"                    | Numérotation factures   |
| **auto_invoice**   | boolean | -                      | true                      | Facturation automatique |

### CATÉGORIE 5 : LIMITS (Limites)

| Setting Key               | Type    | Validations | Exemple Valeur | Impact Business      |
| ------------------------- | ------- | ----------- | -------------- | -------------------- |
| **max_vehicles**          | integer | > 0         | 100            | Limite plan souscrit |
| **max_drivers**           | integer | > 0         | 50             | Limite plan          |
| **max_trips_per_month**   | integer | > 0         | 5000           | Limite plan          |
| **max_api_calls_per_day** | integer | > 0         | 10000          | Rate limiting API    |
| **storage_limit_gb**      | integer | > 0         | 50             | Limite stockage docs |

### CATÉGORIE 6 : BRANDING (Personnalisation)

| Setting Key         | Type   | Validations      | Exemple Valeur                | Impact Business |
| ------------------- | ------ | ---------------- | ----------------------------- | --------------- |
| **logo_url**        | string | URL valide HTTPS | "https://cdn.abc.ae/logo.png" | Branding UI     |
| **primary_color**   | string | HEX color        | "#3B82F6"                     | Thème UI        |
| **secondary_color** | string | HEX color        | "#10B981"                     | Thème UI        |
| **company_name**    | string | Max 100 chars    | "ABC Logistics SARL"          | Affichage légal |
| **support_phone**   | string | Format E.164     | "+33123456789"                | Contact support |

**Règles de validation globales :**

```
VALIDATION STRICTE PAR TYPE :

timezone :
  - DOIT être dans IANA timezone database (ex: "Europe/Paris")
  - Valider avec Intl.DateTimeFormat
  - Rejeter si invalide (ex: "Invalid/City")

default_currency :
  - DOIT être ISO 4217 code (3 lettres majuscules)
  - Valider contre liste officielle
  - Rejeter si invalide (ex: "EURO")

country_code :
  - DOIT être ISO 3166-1 alpha-2 (2 lettres majuscules)
  - Valider contre liste pays supportés
  - Rejeter si invalide (ex: "France")

business_hours :
  - start et end obligatoires
  - Format HH:mm (24h)
  - start < end
  - Plage min 1h, max 24h
  - Rejeter si incohérent

working_days :
  - Array de integers [0-6]
  - Min 1 jour, max 7 jours
  - Pas de doublons
  - 0=dimanche, 6=samedi

email :
  - Format RFC 5322 valide
  - Max 255 caractères
  - DNS MX record valide (optionnel)

url :
  - HTTPS obligatoire (sauf localhost dev)
  - Max 2048 caractères
  - Domaine valide

color :
  - Format HEX : #RRGGBB
  - 6 caractères hexa après #
  - Rejeter si invalide

tax_rate :
  - Number entre 0 et 100
  - Max 2 décimales
  - Rejeter si < 0 ou > 100
```

**Règles de versioning :**

```
ALGORITHME updateSetting :
  ENTRÉE : tenant_id, setting_key, new_value, updated_by

  1. Récupérer setting actuel par (tenant_id, setting_key)
  2. SI setting existe :
     a. Valider new_value selon data_type et règles spécifiques
     b. SI validation échoue → throw ValidationError
     c. Incrémenter version (version + 1)
     d. Stocker setting_value actuel dans previous_value
     e. Mettre à jour setting_value = new_value
     f. updated_at = now
     g. updated_by = current_user_id
  3. SINON (setting n'existe pas) :
     a. Créer nouveau setting
     b. version = 1
     c. previous_value = null
  4. Créer audit log :
     - entity = "tenant_settings"
     - action = "update"
     - old_values = {setting_key, old setting_value, old version}
     - new_values = {setting_key, new setting_value, new version}
  5. SI setting critique (timezone, currency) :
     - Envoyer notification admins tenant
  6. Retourner setting mis à jour

  SORTIE : setting updated
```

**Règles de rollback :**

```
ALGORITHME rollbackSetting :
  ENTRÉE : tenant_id, setting_key

  1. Récupérer setting actuel
  2. SI previous_value IS NULL → throw Error("Cannot rollback: no previous version")
  3. SINON :
     a. new_value = previous_value
     b. previous_value = setting_value (swap)
     c. version = version - 1
     d. updated_at = now
     e. updated_by = current_user_id
  4. Créer audit log (action = "rollback")
  5. Envoyer notification admins
  6. Retourner setting rollback

  SORTIE : setting rolled back
```

**Règles de valeurs par défaut :**

```
ALGORITHME createDefaults :
  ENTRÉE : tenant_id, country_code

  1. Mapper country_code vers valeurs par défaut :

     SI country_code = "FR" :
       timezone = "Europe/Paris"
       currency = "EUR"
       date_format = "DD/MM/YYYY"
       time_format = "24h"
       locale = "fr-FR"
       tax_rate = 20.00
       working_days = [1,2,3,4,5]
       week_start_day = 1
       business_hours = {"start":"08:00","end":"18:00"}

     SI country_code = "AE" :
       timezone = "Asia/Dubai"
       currency = "AED"
       date_format = "DD/MM/YYYY"
       time_format = "24h"
       locale = "en-AE"
       tax_rate = 5.00
       working_days = [1,2,3,4,5,6]
       week_start_day = 0
       business_hours = {"start":"08:00","end":"18:00"}

     SI country_code = "US" :
       timezone = "America/New_York"
       currency = "USD"
       date_format = "MM/DD/YYYY"
       time_format = "12h"
       locale = "en-US"
       tax_rate = 0.00
       working_days = [1,2,3,4,5]
       week_start_day = 0
       business_hours = {"start":"09:00","end":"17:00"}

  2. Pour chaque setting par défaut :
     a. Créer ligne dans adm_tenant_settings
     b. version = 1
     c. previous_value = null
     d. is_encrypted = false

  3. Créer audit log (action = "create_defaults")

  SORTIE : nombre settings créés
```

**Règles de cohérence inter-settings :**

```
VALIDATION COHÉRENCE :

default_currency DOIT correspondre à country_code :
  - FR → EUR
  - AE → AED
  - US → USD
  → Avertissement si incohérent

timezone DEVRAIT correspondre à country_code :
  - FR → Europe/*
  - AE → Asia/Dubai
  - US → America/*
  → Avertissement si incohérent (pas bloquant)

business_hours + working_days cohérents :
  - SI working_days = [1,2,3,4,5] (lun-ven)
    ET business_hours = 24h
  → Avertissement ("Service 24/7 mais jours ouvrés seulement ?")

locale DEVRAIT matcher notification_language :
  - locale "fr-FR" + notification_language "en"
  → Avertissement (incohérent mais pas bloquant)
```

---

## 🏗️ COMPOSANTS À DÉVELOPPER

### Backend (Service Layer)

**Fichier à créer : `lib/services/admin/settings.service.ts`**

Service pour gérer les settings tenant avec validation stricte et versioning.

**Classe SettingsService extends BaseService :**

**Méthode getAllSettings(tenantId: string) → Promise<Record<string, any>>**

1. Récupérer tous les settings du tenant depuis DB
2. Trier par category puis setting_key
3. Fusionner avec valeurs par défaut (si setting absent)
4. Retourner Record<string, any> avec tous settings
5. Format retour :

```typescript
{
  "timezone": "Europe/Paris",
  "default_currency": "EUR",
  "business_hours": {"start": "07:00", "end": "22:00"},
  "working_days": [1,2,3,4,5],
  // ... tous les autres settings
}
```

**Méthode getSetting(tenantId: string, key: string) → Promise<any>**

1. Chercher setting par (tenant_id, setting_key)
2. SI trouvé → retourner setting_value
3. SINON → retourner valeur par défaut selon category/key
4. SI aucune valeur par défaut → retourner null

**Méthode getSettingsByCategory(tenantId: string, category: string) → Promise<Record<string, any>>**

1. Récupérer tous settings du tenant avec category = category
2. Retourner Record groupé par catégorie
3. Utile pour affichage UI par onglets

**Méthode updateSetting(params: UpdateSettingInput) → Promise<Setting>**

```typescript
interface UpdateSettingInput {
  tenantId: string;
  key: string;
  value: any;
  updatedBy: string;
}
```

1. Valider params avec SettingUpdateSchema
2. Récupérer setting actuel (si existe)
3. Déterminer data_type du setting
4. Valider value selon data_type et règles spécifiques :
   - timezone → validateTimezone(value)
   - default_currency → validateCurrency(value)
   - email → validateEmail(value)
   - url → validateUrl(value)
   - etc.
5. SI validation échoue → throw ValidationError avec message précis
6. SI setting existe :
   - Incrémenter version
   - Stocker old value dans previous_value
   - Mettre à jour setting_value
7. SINON créer nouveau setting (version = 1)
8. Sauvegarder en DB
9. Créer audit log (old_values, new_values)
10. SI setting critique → envoyer notification admins
11. Retourner setting mis à jour

**Méthode updateBulk(params: UpdateBulkInput) → Promise<BulkUpdateResult>**

```typescript
interface UpdateBulkInput {
  tenantId: string;
  settings: Record<string, any>;
  updatedBy: string;
}

interface BulkUpdateResult {
  success: boolean;
  updated: number;
  failed: number;
  changes: Array<{ key: string; old: any; new: any; error?: string }>;
}
```

1. Valider params avec SettingsBulkUpdateSchema
2. Démarrer transaction Prisma
3. Pour chaque (key, value) dans settings :
   a. Tenter updateSetting(tenantId, key, value, updatedBy)
   b. SI succès → ajouter à changes avec old/new
   c. SI erreur → ajouter à changes avec error
4. SI aucune erreur → commit transaction
5. SINON → rollback transaction
6. Retourner BulkUpdateResult avec statistiques

**Méthode resetToDefault(tenantId: string, key: string, updatedBy: string) → Promise<Setting>**

1. Récupérer setting actuel
2. Déterminer valeur par défaut selon country_code du tenant
3. SI pas de valeur par défaut → throw Error("No default for this key")
4. Supprimer setting custom de DB
5. Créer audit log (action = "reset_to_default")
6. Envoyer notification admins
7. Retourner valeur par défaut

**Méthode rollbackSetting(tenantId: string, key: string, updatedBy: string) → Promise<Setting>**

1. Récupérer setting actuel
2. Vérifier previous_value IS NOT NULL
3. SI previous_value null → throw Error("Cannot rollback: no previous version")
4. Swap values : new_value = previous_value, previous_value = old setting_value
5. Décrémenter version (version - 1)
6. Sauvegarder en DB
7. Créer audit log (action = "rollback")
8. Envoyer notification admins
9. Retourner setting rolled back

**Méthode getHistory(tenantId: string, key: string) → Promise<Setting[]>**

1. Récupérer toutes les versions du setting depuis audit_logs
2. Parser old_values et new_values
3. Reconstruire historique chronologique
4. Retourner array de versions avec :
   - version number
   - value
   - updated_at
   - updated_by
   - action (update, rollback, reset)
5. Trié par version DESC (plus récent en premier)

**Méthode createDefaults(tenantId: string, countryCode: string) → Promise<number>**

1. Mapper countryCode vers valeurs par défaut (voir algorithme ci-dessus)
2. Pour chaque setting par défaut :
   a. Créer ligne dans adm_tenant_settings
   b. setting_key, setting_value, category, data_type
   c. version = 1, previous_value = null
3. Créer audit log (action = "create_defaults")
4. Retourner nombre de settings créés

**Méthode validateValue(key: string, value: any, dataType: string) → ValidationResult**

```typescript
interface ValidationResult {
  valid: boolean;
  error?: string;
}
```

Méthode interne pour valider une valeur selon son type :

1. Switch selon key :
   - "timezone" → validateTimezone(value)
   - "default_currency" → validateCurrency(value)
   - "email" → validateEmail(value)
   - "url" → validateUrl(value)
   - "business_hours" → validateBusinessHours(value)
   - "working_days" → validateWorkingDays(value)
   - etc.
2. Retourner {valid: true} ou {valid: false, error: "message"}

**Fichier à créer : `lib/repositories/admin/settings.repository.ts`**

Repository pour accès DB adm_tenant_settings.

**Méthode findAll(tenantId: string) → Promise<Setting[]>**
Récupère tous settings du tenant, triés par category puis key.

**Méthode findByKey(tenantId: string, key: string) → Promise<Setting | null>**
Récupère un setting spécifique.

**Méthode findByCategory(tenantId: string, category: string) → Promise<Setting[]>**
Récupère tous settings d'une catégorie.

**Méthode create(data: CreateSettingInput) → Promise<Setting>**
Crée un nouveau setting.

**Méthode update(id: string, data: UpdateSettingInput) → Promise<Setting>**
Met à jour un setting existant.

**Méthode delete(id: string) → Promise<void>**
Supprime un setting (reset to default).

---

### API REST (Endpoints)

**Fichier à créer : `app/api/v1/admin/settings/route.ts`**

**GET /api/v1/admin/settings**

- **Description** : Récupérer tous les settings du tenant
- **Query params** :
  - category (optionnel) : filtrer par catégorie
- **Permissions** : settings.read
- **Réponse 200** :

```json
{
  "settings": {
    "timezone": "Europe/Paris",
    "default_currency": "EUR",
    "business_hours": { "start": "07:00", "end": "22:00" },
    "working_days": [1, 2, 3, 4, 5],
    "email_enabled": true,
    "max_vehicles": 100
  },
  "metadata": {
    "last_updated_at": "2025-11-08T14:30:00Z",
    "last_updated_by": "admin@abclogistics.ae",
    "total_settings": 42
  }
}
```

- **Middleware** :
  - requireAuth()
  - requirePermission('settings.read')

**Fichier à créer : `app/api/v1/admin/settings/[key]/route.ts`**

**GET /api/v1/admin/settings/[key]**

- **Description** : Récupérer un setting spécifique
- **Permissions** : settings.read
- **Réponse 200** :

```json
{
  "key": "timezone",
  "value": "Europe/Paris",
  "category": "localization",
  "data_type": "string",
  "version": 3,
  "previous_value": "Asia/Dubai",
  "updated_at": "2025-11-08T14:30:00Z",
  "updated_by": "admin@abclogistics.ae"
}
```

**PUT /api/v1/admin/settings/[key]**

- **Description** : Modifier un setting spécifique
- **Body** :

```json
{
  "value": "Europe/Paris"
}
```

- **Permissions** : settings.update
- **Réponse 200** :

```json
{
  "success": true,
  "setting": {
    "key": "timezone",
    "old_value": "Asia/Dubai",
    "new_value": "Europe/Paris",
    "version": 3,
    "updated_at": "2025-11-08T14:30:00Z"
  }
}
```

- **Erreurs** :
  - 400 : Validation échouée (timezone invalide)
  - 403 : Permission insuffisante
  - 422 : Valeur incompatible avec data_type
- **Middleware** :
  - requireAuth()
  - requirePermission('settings.update')
  - validate(SettingUpdateSchema)

**DELETE /api/v1/admin/settings/[key]**

- **Description** : Réinitialiser setting à valeur par défaut
- **Permissions** : settings.update
- **Réponse 200** :

```json
{
  "success": true,
  "message": "Setting reset to default value",
  "default_value": "Europe/Paris"
}
```

**Fichier à créer : `app/api/v1/admin/settings/bulk/route.ts`**

**POST /api/v1/admin/settings/bulk**

- **Description** : Modifier plusieurs settings en une transaction
- **Body** :

```json
{
  "settings": {
    "timezone": "Europe/Paris",
    "default_currency": "EUR",
    "business_hours": { "start": "07:00", "end": "22:00" },
    "working_days": [1, 2, 3, 4, 5],
    "notification_language": "fr"
  }
}
```

- **Permissions** : settings.update
- **Réponse 200** :

```json
{
  "success": true,
  "updated": 5,
  "failed": 0,
  "changes": [
    {
      "key": "timezone",
      "old": "Asia/Dubai",
      "new": "Europe/Paris",
      "version": 3
    },
    {
      "key": "default_currency",
      "old": "AED",
      "new": "EUR",
      "version": 2
    }
  ]
}
```

- **Erreurs** :
  - 400 : Une ou plusieurs validations échouées
  - 422 : Transaction rollback (tout ou rien)
- **Middleware** :
  - requireAuth()
  - requirePermission('settings.update')
  - validate(SettingsBulkUpdateSchema)

**Fichier à créer : `app/api/v1/admin/settings/[key]/history/route.ts`**

**GET /api/v1/admin/settings/[key]/history**

- **Description** : Historique des modifications d'un setting
- **Permissions** : settings.read
- **Réponse 200** :

```json
{
  "key": "timezone",
  "history": [
    {
      "version": 3,
      "value": "Europe/Paris",
      "action": "update",
      "updated_at": "2025-11-08T14:30:00Z",
      "updated_by": "admin@abclogistics.ae"
    },
    {
      "version": 2,
      "value": "Asia/Dubai",
      "action": "update",
      "updated_at": "2025-09-15T10:00:00Z",
      "updated_by": "admin@abclogistics.ae"
    },
    {
      "version": 1,
      "value": "Asia/Dubai",
      "action": "create_defaults",
      "updated_at": "2025-09-01T08:00:00Z",
      "updated_by": "system"
    }
  ],
  "total_versions": 3
}
```

**Fichier à créer : `app/api/v1/admin/settings/[key]/rollback/route.ts`**

**POST /api/v1/admin/settings/[key]/rollback**

- **Description** : Rollback setting vers version précédente
- **Body** : Aucun
- **Permissions** : settings.update + settings.rollback
- **Réponse 200** :

```json
{
  "success": true,
  "message": "Setting rolled back successfully",
  "setting": {
    "key": "timezone",
    "version": 2,
    "value": "Asia/Dubai",
    "previous_value": "Europe/Paris"
  }
}
```

- **Erreurs** :
  - 422 : Cannot rollback (no previous version)

---

### Frontend (Interface Utilisateur)

**Page à créer : `app/[locale]/admin/settings/page.tsx`**

Page principale Settings avec navigation par onglets.

**Layout de la page :**

```
┌─────────────────────────────────────────────────────────┐
│ HEADER                                                  │
│ [FleetCore Logo] Admin > Settings       [Save Changes] │
└─────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────┐
│ TABS                                                    │
│ [Localization] [Business] [Notifications] [Billing]    │
│ [Limits] [Branding]                                     │
└─────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────┐
│ TAB CONTENT (Localization selected)                     │
│                                                         │
│ Timezone *                                              │
│ [Europe/Paris ▼]                                        │
│ ℹ️ Used for reports, notifications, scheduling         │
│                                                         │
│ Default Currency *                                      │
│ [EUR - Euro ▼]                                          │
│ ℹ️ Primary currency for billing and display            │
│                                                         │
│ Country Code *                                          │
│ [FR - France ▼]                                         │
│ ℹ️ Affects tax rates, formats, and compliance          │
│                                                         │
│ Date Format                                             │
│ [DD/MM/YYYY ▼]                                          │
│                                                         │
│ Time Format                                             │
│ ○ 12-hour (AM/PM)  ● 24-hour                           │
│                                                         │
│ Locale                                                  │
│ [fr-FR - French (France) ▼]                            │
│                                                         │
│ [Reset to Defaults]  [View History]                    │
└─────────────────────────────────────────────────────────┘
```

**Onglet Localization :**

- Tous champs avec dropdown validé (timezone, currency, country)
- Tooltips explicatifs sur chaque champ
- Validation temps réel (timezone IANA, currency ISO 4217)
- Affichage avertissements si incohérent (ex: FR + AED)

**Onglet Business :**

```
Business Hours *
┌─────────────────────────────────────┐
│ Start Time  [07:00 ▼]  End Time [22:00 ▼] │
│ ℹ️ Service availability window           │
└─────────────────────────────────────┘

Working Days *
☑ Monday  ☑ Tuesday  ☑ Wednesday  ☑ Thursday  ☑ Friday
☐ Saturday  ☐ Sunday
ℹ️ Days when service is available

Holiday Calendar
[FR-PUBLIC - France Public Holidays ▼]

Week Start Day
○ Sunday  ● Monday
```

**Onglet Notifications :**

```
Email Notifications
☑ Enabled
ℹ️ System emails will be sent to users

Email From Name
[FleetCore - ABC Logistics]
ℹ️ Display name in sent emails

Reply-To Email
[support@abclogistics.ae]
ℹ️ Where replies will be sent

Notification Language
[French ▼]
ℹ️ Language for automated emails and SMS

SMS Notifications
☐ Enabled
ℹ️ Requires SMS credits

Slack Integration
Webhook URL
[https://hooks.slack.com/...]
[Test Connection]
```

**Onglet Billing :**

```
Billing Email *
[billing@abclogistics.ae]
ℹ️ Invoices will be sent to this address

Tax Rate (%)
[20.00]
ℹ️ VAT/Sales tax percentage

Payment Terms (days)
[30]
ℹ️ Number of days to pay invoices

Invoice Prefix
[ABC-]
ℹ️ Prefix for invoice numbers (ABC-2025-001)

Auto Invoice
☑ Generate invoices automatically
```

**Onglet Limits :**

```
Plan Limits (read-only, shown for info)

Maximum Vehicles: 100
Maximum Drivers: 50
Maximum Trips/Month: 5,000
Maximum API Calls/Day: 10,000
Storage Limit: 50 GB

⚠️ Limits are defined by your subscription plan.
Contact sales to upgrade: sales@fleetcore.com
```

**Onglet Branding :**

```
Company Logo
[Upload Logo]
Current: [https://cdn.abc.ae/logo.png]
ℹ️ Shown in header and emails (PNG, max 500KB)

Primary Color
[#3B82F6] [Color Picker]
ℹ️ Main theme color

Secondary Color
[#10B981] [Color Picker]
ℹ️ Accent color

Company Name (Legal)
[ABC Logistics SARL]
ℹ️ Used in contracts and invoices

Support Phone
[+33 1 23 45 67 89]
ℹ️ Shown to users for support
```

**Fonctionnalités UX :**

- **Auto-save** : Changements sauvegardés automatiquement après 2 secondes d'inactivité
- **Validation temps réel** : Erreurs affichées sous le champ immédiatement
- **Indicateur de changement** : Badge "●" sur onglet si modifications non sauvegardées
- **Confirmations** : Modal confirmation pour actions critiques (rollback, reset)
- **Historique** : Bouton "View History" ouvre modal avec toutes versions
- **Tooltips** : ℹ️ sur chaque champ expliquant l'impact business

**Composant à créer : `components/admin/SettingField.tsx`**

Composant réutilisable pour un champ setting.

**Props :**

```typescript
interface SettingFieldProps {
  settingKey: string;
  label: string;
  value: any;
  dataType: "string" | "number" | "boolean" | "array" | "object";
  required?: boolean;
  tooltip?: string;
  validation?: (value: any) => { valid: boolean; error?: string };
  onChange: (key: string, value: any) => void;
  options?: Array<{ value: any; label: string }>; // Pour dropdowns
}
```

**Affichage :**

- Label avec \* si required
- Input selon dataType :
  - string → Input text ou Dropdown si options
  - number → Input number avec +/- buttons
  - boolean → Toggle switch
  - array → Multi-select ou Checkboxes
  - object → JSON editor ou Fields spécialisés
- Tooltip icon ℹ️ au survol
- Validation en temps réel sous le champ
- Badge "Changed" si différent de valeur initiale

**Composant à créer : `components/admin/SettingHistoryModal.tsx`**

Modal affichant historique des modifications d'un setting.

**Props :**

```typescript
interface SettingHistoryModalProps {
  settingKey: string;
  isOpen: boolean;
  onClose: () => void;
  onRollback?: (version: number) => void;
}
```

**Contenu :**

```
Setting History: timezone

┌──────────────────────────────────────────────────┐
│ Version 3 (Current)                             │
│ Value: "Europe/Paris"                           │
│ Updated: Nov 8, 2025 14:30                      │
│ By: admin@abclogistics.ae                       │
│ Action: Manual update                           │
├──────────────────────────────────────────────────┤
│ Version 2                                        │
│ Value: "Asia/Dubai"                             │
│ Updated: Sep 15, 2025 10:00                     │
│ By: admin@abclogistics.ae                       │
│ Action: Manual update                           │
│ [Rollback to this version]                      │
├──────────────────────────────────────────────────┤
│ Version 1                                        │
│ Value: "Asia/Dubai"                             │
│ Updated: Sep 1, 2025 08:00                      │
│ By: System                                       │
│ Action: Default value                           │
└──────────────────────────────────────────────────┘

[Close]
```

**Composant à créer : `components/admin/BulkUpdatePreview.tsx`**

Modal de preview avant sauvegarde bulk.

**Contenu :**

```
Review Changes

You are about to update 5 settings:

✓ timezone: "Asia/Dubai" → "Europe/Paris"
✓ default_currency: "AED" → "EUR"
✓ business_hours: {"start":"08:00"...} → {"start":"07:00"...}
✓ working_days: [1,2,3,4,5,6] → [1,2,3,4,5]
✓ notification_language: "en" → "fr"

⚠️ These changes will affect:
- All date/time displays across the platform
- Invoice currency and formatting
- Automated email language
- Service availability windows

[Cancel] [Confirm & Save]
```

---

## 🎬 RÉSULTAT DÉMONTRABLE

**Scénario démo complet pour le sponsor :**

**1. Settings initiaux (tenant UAE)**

- Naviguer vers /admin/settings
- Voir onglets (Localization, Business, Notifications, etc.)
- Onglet Localization sélectionné par défaut
- Voir settings actuels :
  - Timezone : Asia/Dubai
  - Currency : AED
  - Country : AE (UAE)
  - Date format : DD/MM/YYYY
  - Working days : Sun-Fri (6 jours)

**2. Modification settings pour agence Paris**

- Cliquer onglet "Localization"
- Changer timezone : "Asia/Dubai" → "Europe/Paris"
  - Dropdown autocomplete avec validation IANA
  - Affichage preview : "Europe/Paris (UTC+01:00)"
- Changer currency : "AED" → "EUR"
  - Dropdown avec drapeaux : 🇪🇺 EUR - Euro
- ⚠️ Avertissement affiché : "Currency EUR doesn't match country AE. Continue?"
- Cliquer "Continue anyway" (business valide : agence Paris)
- Cliquer onglet "Business"
- Modifier business_hours : start "08:00" → "07:00", end "18:00" → "22:00"
- Décocher "Saturday" dans working_days (reste Lun-Ven)
- Cliquer onglet "Notifications"
- Changer notification_language : "en" → "fr"
- Badge "● 5 changes" affiché en haut
- Cliquer "Save Changes"

**3. Preview et confirmation**

- Modal "Review Changes" s'ouvre
- Affiche 5 modifications avec old → new
- Affiche warnings impacts
- Cliquer "Confirm & Save"
- Toast : "Settings updated successfully"
- Badge "● 5 changes" disparaît

**4. Vérification modifications appliquées**

- Recharger page /admin/settings
- Vérifier tous les nouveaux settings affichés correctement
- Timezone : Europe/Paris ✅
- Currency : EUR ✅
- Business hours : 07:00 - 22:00 ✅
- Working days : Lun-Ven (5 jours) ✅
- Notification language : fr ✅

**5. Historique et rollback**

- Cliquer "View History" sur timezone
- Modal s'ouvre avec 3 versions :
  - v3 (current) : Europe/Paris - Nov 8 14:30
  - v2 : Asia/Dubai - Sep 15 10:00
  - v1 (default) : Asia/Dubai - Sep 1 08:00
- Cliquer "Rollback to version 2" (Asia/Dubai)
- Confirmation : "Rollback timezone to Asia/Dubai?"
- Confirmer
- Toast : "Setting rolled back successfully"
- Timezone repassé à Asia/Dubai
- Version maintenant v2 (v3 écrasée)

**6. Reset to default**

- Cliquer "Reset to Defaults" sur onglet Localization
- Confirmation : "Reset all localization settings to defaults for UAE?"
- Confirmer
- Tous settings localization repassés aux valeurs UAE :
  - Timezone : Asia/Dubai
  - Currency : AED
  - Working days : Sun-Fri
- Toast : "6 settings reset to default"

**7. Vérification audit logs**

- Naviguer vers /admin/audit-logs
- Filtrer entity = "tenant_settings"
- Voir toutes modifications :
  - "update" : timezone Europe/Paris (old: Asia/Dubai)
  - "update" : currency EUR (old: AED)
  - "rollback" : timezone Asia/Dubai (from: Europe/Paris)
  - "reset_to_default" : multiple settings
- Chaque log avec : timestamp, user, old_values, new_values

**CritÈres d'acceptation :**

- ✅ Settings affichés par onglets (6 catégories)
- ✅ Validation temps réel (timezone, currency, email, url)
- ✅ Avertissements cohérence (currency vs country)
- ✅ Bulk update transactionnel (tout ou rien)
- ✅ Historique complet accessible par setting
- ✅ Rollback fonctionnel vers version précédente
- ✅ Reset to defaults restaure valeurs selon country_code
- ✅ Audit logs créés pour chaque modification
- ✅ Notifications envoyées aux admins pour changements critiques
- ✅ UI responsive et intuitive
- ✅ Tooltips explicatifs sur chaque champ

---

## ⏱️ ESTIMATION

- **Temps backend :** 10 heures
  - SettingsService complet : 5h
  - SettingsRepository : 1h
  - Validateurs (timezone, currency, etc.) : 2h
  - Algorithmes (createDefaults, rollback) : 2h
- **Temps API :** 4 heures
  - GET /settings : 0.5h
  - PUT /settings/[key] : 1h
  - POST /settings/bulk : 1.5h
  - GET /settings/[key]/history : 0.5h
  - POST /settings/[key]/rollback : 0.5h
- **Temps frontend :** 12 heures
  - Page Settings avec tabs : 4h
  - SettingField composant : 2h
  - SettingHistoryModal : 2h
  - BulkUpdatePreview : 1h
  - Validation temps réel : 2h
  - Polish UX : 1h
- **Temps tests :** 6 heures
  - Tests unitaires SettingsService : 3h
  - Tests API endpoints : 2h
  - Tests validation : 1h
- **TOTAL : 32 heures (4 jours)**

**Estimation révisée finale : 2 jours (16h)** si on se concentre sur :

- Backend essentiel (6h)
- APIs core (3h)
- Frontend simplifié (5h)
- Tests critiques (2h)

---

## 🔗 DÉPENDANCES

**Prérequis obligatoires :**

- Table adm_tenant_settings existante en DB
- BaseService (héritage)
- AuditService (logging automatique)
- Validators Zod (validation settings)

**Services/composants requis :**

- tenantRepository (pour récupérer country_code)
- auditService (pour audit logs)
- notificationService (pour alertes admins)

**Données de test nécessaires :**

- 1 tenant avec country_code = "FR"
- 1 tenant avec country_code = "AE"
- 1 member avec permission 'settings.update'
- Settings par défaut créés pour les 2 tenants

**Librairies externes :**

- Zod (validation)
- Intl API (validation timezone)
- ISO-4217 currency codes list
- ISO-3166 country codes list

---

## ✅ CHECKLIST DE VALIDATION

### Backend

- [ ] **SettingsService** : compile sans erreur TypeScript
- [ ] **getAllSettings()** : retourne tous settings avec fusion defaults
- [ ] **updateSetting()** : valide timezone IANA correctement
- [ ] **updateSetting()** : valide currency ISO 4217 correctement
- [ ] **updateSetting()** : valide email RFC 5322 correctement
- [ ] **updateSetting()** : valide URL HTTPS correctement
- [ ] **updateBulk()** : transaction atomique (tout ou rien)
- [ ] **rollbackSetting()** : swap values correctement
- [ ] **createDefaults()** : génère settings selon country_code
- [ ] **getHistory()** : reconstruit historique depuis audit_logs

### API

- [ ] **GET /settings** : retourne tous settings tenant
- [ ] **GET /settings/[key]** : retourne setting spécifique avec metadata
- [ ] **PUT /settings/[key]** : met à jour avec validation
- [ ] **PUT /settings/[key]** : rejette valeur invalide (timezone "Invalid/City")
- [ ] **POST /settings/bulk** : met à jour 5 settings en 1 transaction
- [ ] **POST /settings/bulk** : rollback si 1 validation échoue
- [ ] **GET /settings/[key]/history** : retourne versions chronologiques
- [ ] **POST /settings/[key]/rollback** : rollback vers version précédente
- [ ] **DELETE /settings/[key]** : reset to default fonctionne

### Frontend

- [ ] **Page Settings** : 6 onglets affichés correctement
- [ ] **Onglet Localization** : tous champs avec validation temps réel
- [ ] **Dropdown timezone** : autocomplete IANA database
- [ ] **Dropdown currency** : liste ISO 4217 avec drapeaux
- [ ] **Business hours** : validation start < end
- [ ] **Working days** : checkboxes avec min 1 jour sélectionné
- [ ] **Auto-save** : changements sauvegardés après 2s inactivité
- [ ] **Badge changes** : affiche nombre modifications non sauvegardées
- [ ] **Modal preview** : affiche résumé avant bulk update
- [ ] **Modal history** : affiche toutes versions avec dates
- [ ] **Button rollback** : rollback fonctionne depuis modal history
- [ ] **Tooltips** : ℹ️ affiché sur tous champs avec explication
- [ ] **Responsive** : UI adaptée mobile/tablet

### Tests

- [ ] **Test** : updateSetting timezone invalide → ValidationError
- [ ] **Test** : updateBulk 5 settings → tous mis à jour en transaction
- [ ] **Test** : updateBulk 1 invalide parmi 5 → rollback complet
- [ ] **Test** : rollback setting → swap values correct
- [ ] **Test** : createDefaults FR → timezone Europe/Paris, currency EUR
- [ ] **Test** : createDefaults AE → timezone Asia/Dubai, currency AED
- [ ] **Test** : getHistory → versions chronologiques correctes
- [ ] **Test E2E** : modifier 5 settings via UI → vérifier DB updated

### Audit

- [ ] **Audit log** : créé pour chaque updateSetting
- [ ] **Audit log** : old_values et new_values présents
- [ ] **Audit log** : updated_by renseigné
- [ ] **Audit log** : action "rollback" lors rollback
- [ ] **Audit log** : action "reset_to_default" lors reset

### Notifications

- [ ] **Notification** : envoyée aux admins si timezone changé
- [ ] **Notification** : envoyée aux admins si currency changé
- [ ] **Notification** : pas envoyée pour changements mineurs (logo_url)

---

## 📦 LIVRABLES FINAUX ÉTAPE 5.1

**Fichiers créés (7 fichiers, ~2500 lignes) :**

- `lib/services/admin/settings.service.ts` (500 lignes)
- `lib/repositories/admin/settings.repository.ts` (200 lignes)
- `lib/validators/settings.validators.ts` (300 lignes)
- `app/api/v1/admin/settings/route.ts` (150 lignes)
- `app/api/v1/admin/settings/[key]/route.ts` (200 lignes)
- `app/api/v1/admin/settings/bulk/route.ts` (150 lignes)
- `app/api/v1/admin/settings/[key]/history/route.ts` (100 lignes)
- `app/api/v1/admin/settings/[key]/rollback/route.ts` (100 lignes)
- `app/[locale]/admin/settings/page.tsx` (400 lignes)
- `components/admin/SettingField.tsx` (150 lignes)
- `components/admin/SettingHistoryModal.tsx` (150 lignes)
- `components/admin/BulkUpdatePreview.tsx` (100 lignes)

**Fichiers modifiés :**

- Migration DB : table `adm_tenant_settings` avec colonnes complètes
- Seed data : defaults settings pour FR, AE, US

**Métriques finales :**

- 📊 42+ settings différents gérés
- 📈 6 catégories (Localization, Business, Notifications, Billing, Limits, Branding)
- 🚫 Validation stricte 15+ types données
- ⏱️ Versioning complet avec rollback
- 📝 Audit trail 100% modifications

---

# ÉTAPE 5.2 : VEHICLE CLASSES CONFIGURATION

**Durée :** 1.5 jours ouvrés (12 heures)  
**Objectif :** Permettre personnalisation classes véhicules par tenant (berline, SUV, Premium, etc.)  
**Livrable démo :** Interface Vehicle Classes permettant CRUD classes avec paramètres détaillés

---

## 🎯 RATIONNEL MÉTIER

**POURQUOI :** Chaque tenant a une taxonomie différente de ses véhicules selon son activité et son marché. ABC Logistics (livraison) classe ses véhicules par capacité : "Petit utilitaire" (<3m³), "Grand utilitaire" (3-8m³), "Camion 12T" (>8m³). XYZ VTC Premium (transport de personnes luxe) classe ses véhicules par standing : "Berline Standard", "Berline Premium", "SUV Luxe", "Van 7 places". Impossible d'imposer une taxonomie unique à tous les tenants.

**QUEL PROBLÈME :** Actuellement, les classes véhicules sont hardcodées dans le code avec des valeurs fixes (Standard, Premium, Luxury). Problème majeur :

1. **Rigidité** : Impossible d'adapter aux spécificités métier du tenant
2. **Perte de sens** : "Premium" ne veut rien dire pour un transporteur de marchandises
3. **Mapping plateforme** : Comment mapper "SUV Luxe" vers Uber Black / Careem Business ?
4. **Tarification** : Impossible de définir prix selon classe custom
5. **Équipements** : Impossible de spécifier équipements requis par classe

**IMPACT SI ABSENT :**

- **Adoption** : Clients refusent FleetCore car ne correspond pas à leur réalité métier
- **Reporting** : Rapports inutilisables car classes ne font pas sens (CA par "Premium" ?)
- **Intégrations** : Impossible d'intégrer Uber/Careem car mapping classes manquant
- **Tarification** : Prix fixes au lieu de prix adaptés par classe véhicule
- **Qualité** : Pas de validation équipements requis selon classe (climatisation, GPS, etc.)

**CAS D'USAGE CONCRET :**

**Contexte : ABC Logistics (livraison UAE)**  
Activité : Livraison last-mile pour e-commerce Dubai et Abu Dhabi.
Flotte : 80 véhicules répartis en 4 catégories selon volume de chargement.

**Besoin de classes personnalisées :**

1. **Scooter 50cc** (petits colis express)
   - Capacité : 0.1 m³
   - Poids max : 15 kg
   - Équipements : Top case sécurisé, GPS
   - Tarif : 2 AED/km

2. **Petit utilitaire** (colis standards)
   - Capacité : 2 m³
   - Poids max : 500 kg
   - Places : 2
   - Équipements : Clim, GPS, Hayons
   - Exemples : Renault Kangoo, Peugeot Partner
   - Tarif : 3.5 AED/km

3. **Grand utilitaire** (palettes)
   - Capacité : 8 m³
   - Poids max : 1500 kg
   - Places : 2
   - Équipements : Clim, GPS, Hayon, Sangles
   - Exemples : Mercedes Sprinter, Ford Transit
   - Tarif : 5 AED/km

4. **Camion 12T** (gros volumes)
   - Capacité : 40 m³
   - Poids max : 12000 kg
   - Places : 2
   - Équipements : Clim, GPS, Grue, Transpalette
   - Exemples : Iveco Eurocargo
   - Tarif : 8 AED/km

**Workflow création classes custom :**

1. Admin ABC Logistics se connecte
2. Va dans Settings > Vehicle Classes
3. Voit 0 classes (nouveau tenant)
4. Clique "+ Add Class"
5. Remplit formulaire Classe 1 :
   - Name : "Scooter 50cc"
   - Description : "Livraison express colis <15kg"
   - Icon : 🛵 (emoji ou upload)
   - Category : delivery
   - Capacity_volume_m3 : 0.1
   - Capacity_weight_kg : 15
   - Seating_capacity : 1
   - Equipments : ["top_case", "gps_tracker"]
   - Base_rate_per_km : 2.00
   - Active : true
   - Display_order : 1
6. Clique "Save"
7. Classe créée, visible dans liste
8. Répète pour 3 autres classes
9. Drag & drop pour réorganiser ordre affichage
10. Total : 4 classes custom créées en 10 minutes

**Workflow mapping plateforme (pour VTC) :**

**Contexte : XYZ VTC Premium (transport personnes Dubai)**  
Activité : Transport de personnes haut de gamme, intégration Uber, Careem, Yango.

**Classes custom créées :**

1. **Berline Standard**
   - Exemples : Toyota Camry, Honda Accord
   - Seating : 4
   - Mapping :
     - Uber : UberX
     - Careem : GO
     - Yango : Comfort
2. **Berline Premium**
   - Exemples : Mercedes Classe E, BMW Série 5
   - Seating : 4
   - Equipments : Cuir, Clim multi-zones, WiFi
   - Mapping :
     - Uber : Comfort
     - Careem : Business
     - Yango : Business

3. **SUV Luxe**
   - Exemples : Mercedes GLE, BMW X5, Range Rover
   - Seating : 6
   - Equipments : Cuir, Clim 4 zones, WiFi, Boissons
   - Mapping :
     - Uber : Black / SUV
     - Careem : Black
     - Yango : Premium

4. **Van 7 places**
   - Exemples : Mercedes Vito, Toyota Hiace
   - Seating : 7
   - Equipments : Clim, Espace bagages
   - Mapping :
     - Uber : XL
     - Careem : MAX
     - Yango : XL

**Valeur business :**

- **Adoption** : Clients comprennent et adoptent car classes font sens pour leur métier
- **Tarification** : Prix adaptés par classe (Scooter 2 AED/km vs Camion 8 AED/km)
- **Intégrations** : Mapping automatique vers Uber Black / Careem Business
- **Reporting** : Rapports pertinents (CA par classe véhicule réelle)
- **Qualité** : Validation équipements requis (SUV Luxe sans clim → rejeté)

---

## 📊 DONNÉES ET RÈGLES MÉTIER

**Table principale : `adm_tenant_vehicle_classes`**

**Colonnes critiques (22 colonnes) :**

| Colonne                   | Type          | Obligatoire | Utilité Business                             |
| ------------------------- | ------------- | ----------- | -------------------------------------------- |
| **id**                    | uuid          | OUI         | Identifiant unique classe (PK)               |
| **tenant_id**             | uuid          | OUI         | Tenant propriétaire (FK → adm_tenants)       |
| **name**                  | varchar(100)  | OUI         | Nom classe ("SUV Luxe")                      |
| **description**           | text          | NON         | Description détaillée                        |
| **icon**                  | varchar(255)  | NON         | Emoji ou URL icône                           |
| **category**              | varchar(50)   | OUI         | Catégorie (delivery, vtc, rental, corporate) |
| **capacity_volume_m3**    | numeric(10,2) | NON         | Volume chargement (livraison)                |
| **capacity_weight_kg**    | numeric(10,2) | NON         | Poids max (livraison)                        |
| **seating_capacity**      | integer       | NON         | Nombre places (VTC/rental)                   |
| **trunk_capacity_liters** | integer       | NON         | Volume coffre                                |
| **equipments**            | jsonb         | NON         | Équipements requis (array)                   |
| **platform_mappings**     | jsonb         | NON         | Mapping vers Uber/Careem                     |
| **base_rate_per_km**      | numeric(10,2) | NON         | Tarif base km                                |
| **base_rate_per_hour**    | numeric(10,2) | NON         | Tarif base heure                             |
| **min_charge**            | numeric(10,2) | NON         | Montant minimum facturation                  |
| **is_active**             | boolean       | OUI         | Classe active ?                              |
| **display_order**         | integer       | OUI         | Ordre affichage UI                           |
| **metadata**              | jsonb         | NON         | Données additionnelles                       |
| **created_at**            | timestamp     | OUI         | Date création                                |
| **updated_at**            | timestamp     | OUI         | Date modification                            |
| **created_by**            | uuid          | NON         | Qui a créé                                   |
| **updated_by**            | uuid          | NON         | Qui a modifié                                |

**Catégories de véhicules :**

```
ENUM vehicle_category :
  - delivery : Livraison (utilitaires, scooters, camions)
  - vtc : Transport de personnes (berlines, SUV, vans)
  - rental : Location courte durée
  - corporate : Flotte d'entreprise
  - special : Véhicules spéciaux (frigo, benne, etc.)
```

**Structure JSONB equipments :**

```json
{
  "required": ["air_conditioning", "gps_tracker", "child_seat_compatible"],
  "optional": ["wifi", "phone_charger", "water_bottles"],
  "features": ["leather_seats", "panoramic_roof", "tinted_windows"]
}
```

**Structure JSONB platform_mappings :**

```json
{
  "uber": {
    "category": "Black",
    "auto_accept": true
  },
  "careem": {
    "category": "Business",
    "auto_accept": true
  },
  "yango": {
    "category": "Premium",
    "auto_accept": false
  }
}
```

**Règles de validation :**

```
VALIDATION VehicleClassCreateSchema :

name :
  - Requis
  - Unique par tenant
  - Min 3 caractères, max 100
  - Pas de caractères spéciaux interdits

category :
  - Requis
  - Enum valide (delivery, vtc, rental, corporate, special)

capacity_volume_m3 :
  - Optionnel
  - Si renseigné : > 0, max 2 décimales
  - Pertinent surtout pour category = delivery

capacity_weight_kg :
  - Optionnel
  - Si renseigné : > 0, max 2 décimales
  - Pertinent pour category = delivery

seating_capacity :
  - Optionnel
  - Si renseigné : integer entre 1 et 50
  - Pertinent pour category = vtc, rental, corporate

equipments :
  - Optionnel
  - Si renseigné : array de strings
  - Valider contre liste équipements autorisés

platform_mappings :
  - Optionnel
  - Si renseigné : object avec keys uber, careem, yango
  - Chaque mapping avec category et auto_accept

base_rate_per_km :
  - Optionnel
  - Si renseigné : > 0, max 2 décimales
  - Pertinent pour tarification

is_active :
  - Booléen requis
  - Default true

display_order :
  - Integer requis
  - Default = max(display_order) + 1
  - Utilisé pour tri UI
```

**Règles métier :**

```
RÈGLE 1 : Unicité name par tenant
  - Impossible de créer 2 classes "SUV Luxe" pour même tenant
  - Possible pour 2 tenants différents

RÈGLE 2 : Au moins 1 classe active
  - SI tenant a N classes ET on désactive la dernière active
    ALORS rejeter avec erreur "At least 1 class must be active"

RÈGLE 3 : Display_order automatique
  - SI nouveau display_order non fourni
    ALORS display_order = MAX(display_order de toutes classes) + 1

RÈGLE 4 : Cohérence capacités
  - SI category = "delivery"
    ALORS capacity_volume_m3 OU capacity_weight_kg recommandé
  - SI category = "vtc" OU "rental"
    ALORS seating_capacity recommandé
  - Avertissement si incohérent

RÈGLE 5 : Mapping plateforme optionnel
  - platform_mappings optionnel
  - SI renseigné, valider categories plateforme valides
  - Uber : [UberX, Comfort, Black, SUV, XL]
  - Careem : [GO, Business, Black, MAX]
  - Yango : [Comfort, Business, Premium, XL]

RÈGLE 6 : Soft delete
  - Désactiver classe (is_active = false) au lieu de supprimer
  - Véhicules existants gardent référence à classe
  - Rapports historiques restent cohérents
```

**Algorithmes :**

```
ALGORITHME createVehicleClass :
  ENTRÉE : tenant_id, classData

  1. Valider classData avec VehicleClassCreateSchema
  2. Vérifier unicité name pour tenant
  3. SI name existe → throw ValidationError("Class name already exists")
  4. SI display_order non fourni :
     a. Calculer max_order = MAX(display_order WHERE tenant_id = tenant_id)
     b. display_order = max_order + 1
  5. Créer classe en DB
  6. Créer audit log (action = "create")
  7. Retourner classe créée

  SORTIE : vehicle_class

ALGORITHME updateDisplayOrder :
  ENTRÉE : tenant_id, class_ids[] (ordre nouveau)

  1. Vérifier que tous class_ids appartiennent au tenant
  2. SI non → throw ForbiddenError
  3. Pour chaque class_id avec index i :
     a. Mettre à jour display_order = i + 1
  4. Créer audit log (action = "reorder")
  5. Retourner liste classes réordonnées

  SORTIE : vehicle_classes[]

ALGORITHME deactivateClass :
  ENTRÉE : class_id

  1. Récupérer classe
  2. Compter classes actives pour tenant
  3. SI count = 1 (dernière active) :
     → throw BusinessRuleError("Cannot deactivate last active class")
  4. Changer is_active = false
  5. Sauvegarder en DB
  6. Créer audit log (action = "deactivate")
  7. Retourner classe

  SORTIE : vehicle_class
```

---

## 🏗️ COMPOSANTS À DÉVELOPPER

### Backend (Service Layer)

**Fichier à créer : `lib/services/admin/vehicle-class.service.ts`**

Service pour gérer les classes véhicules personnalisées.

**Classe VehicleClassService extends BaseService :**

**Méthode findAll(tenantId: string, filters?: ClassFilters) → Promise<VehicleClass[]>**

1. Récupérer toutes classes du tenant
2. Appliquer filtres :
   - category (optionnel)
   - is_active (optionnel)
3. Trier par display_order ASC
4. Retourner liste classes

**Méthode findById(id: string, tenantId: string) → Promise<VehicleClass>**

1. Récupérer classe par ID
2. Vérifier appartenance au tenant
3. Retourner classe ou throw NotFoundError

**Méthode create(data: VehicleClassCreateInput) → Promise<VehicleClass>**

1. Valider data avec VehicleClassCreateSchema
2. Vérifier unicité name pour tenant
3. Calculer display_order si non fourni
4. Créer classe en DB
5. Créer audit log
6. Retourner classe créée

**Méthode update(id: string, data: VehicleClassUpdateInput) → Promise<VehicleClass>**

1. Valider data
2. Vérifier classe existe
3. SI name changé → vérifier unicité
4. Mettre à jour en DB
5. Créer audit log
6. Retourner classe mise à jour

**Méthode deactivate(id: string) → Promise<VehicleClass>**

1. Récupérer classe
2. Compter classes actives pour tenant
3. SI dernière active → throw BusinessRuleError
4. Changer is_active = false
5. Sauvegarder
6. Créer audit log
7. Retourner classe

**Méthode activate(id: string) → Promise<VehicleClass>**

1. Récupérer classe
2. Changer is_active = true
3. Sauvegarder
4. Créer audit log
5. Retourner classe

**Méthode reorder(tenantId: string, classIds: string[]) → Promise<VehicleClass[]>**

1. Vérifier tous classIds appartiennent au tenant
2. Pour chaque classId avec index i :
   - Mettre à jour display_order = i + 1
3. Créer audit log
4. Retourner classes réordonnées

**Méthode delete(id: string) → Promise<void>**

1. Vérifier pas de véhicules associés
2. SI véhicules existent → suggérer deactivate au lieu de delete
3. Supprimer classe (soft delete)
4. Créer audit log
5. Retourner succès

---

### API REST (Endpoints)

**Fichier à créer : `app/api/v1/admin/vehicle-classes/route.ts`**

**GET /api/v1/admin/vehicle-classes**

- **Description** : Liste toutes les classes véhicules du tenant
- **Query params** :
  - category (optionnel)
  - is_active (optionnel)
- **Permissions** : vehicle_classes.read
- **Réponse 200** :

```json
{
  "classes": [
    {
      "id": "uuid",
      "name": "SUV Luxe",
      "description": "SUV haut de gamme 6 places",
      "icon": "🚙",
      "category": "vtc",
      "seating_capacity": 6,
      "equipments": {
        "required": ["air_conditioning", "gps_tracker", "wifi"]
      },
      "platform_mappings": {
        "uber": { "category": "Black", "auto_accept": true }
      },
      "base_rate_per_km": 5.5,
      "is_active": true,
      "display_order": 3
    }
  ],
  "total": 4
}
```

**POST /api/v1/admin/vehicle-classes**

- **Description** : Créer nouvelle classe véhicule
- **Body** :

```json
{
  "name": "SUV Luxe",
  "description": "SUV haut de gamme 6 places",
  "icon": "🚙",
  "category": "vtc",
  "seating_capacity": 6,
  "equipments": {
    "required": ["air_conditioning", "gps_tracker", "wifi"]
  },
  "platform_mappings": {
    "uber": { "category": "Black", "auto_accept": true },
    "careem": { "category": "Black", "auto_accept": true }
  },
  "base_rate_per_km": 5.5
}
```

- **Permissions** : vehicle_classes.create
- **Réponse 201** : Classe créée
- **Erreurs** :
  - 422 : Name already exists
  - 400 : Validation failed

**Fichier à créer : `app/api/v1/admin/vehicle-classes/[id]/route.ts`**

**GET /api/v1/admin/vehicle-classes/[id]**

- **Description** : Récupérer classe spécifique
- **Permissions** : vehicle_classes.read
- **Réponse 200** : Classe détaillée

**PATCH /api/v1/admin/vehicle-classes/[id]**

- **Description** : Modifier classe
- **Body** : Partial<VehicleClassCreateInput>
- **Permissions** : vehicle_classes.update
- **Réponse 200** : Classe mise à jour

**DELETE /api/v1/admin/vehicle-classes/[id]**

- **Description** : Supprimer classe (soft delete)
- **Permissions** : vehicle_classes.delete
- **Réponse 200** : Success
- **Erreurs** :
  - 422 : Vehicles still assigned to this class

**Fichier à créer : `app/api/v1/admin/vehicle-classes/reorder/route.ts`**

**POST /api/v1/admin/vehicle-classes/reorder**

- **Description** : Réorganiser ordre affichage classes
- **Body** :

```json
{
  "class_ids": ["uuid1", "uuid2", "uuid3", "uuid4"]
}
```

- **Permissions** : vehicle_classes.update
- **Réponse 200** :

```json
{
  "success": true,
  "updated": 4
}
```

---

### Frontend (Interface Utilisateur)

**Page à créer : `app/[locale]/admin/vehicle-classes/page.tsx`**

Page principale Vehicle Classes avec drag & drop.

**Layout de la page :**

```
┌─────────────────────────────────────────────────────┐
│ HEADER                                              │
│ [FleetCore Logo] Admin > Vehicle Classes           │
│ [+ Add Class]                                       │
└─────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────┐
│ FILTERS                                             │
│ Category: [All ▼]  Status: [Active ▼]              │
└─────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────┐
│ CLASSES LIST (Drag & Drop)                         │
│                                                     │
│ ┌────┬─────────────────────────────────────┬──────┐│
│ │ ≡  │ 🛵 Scooter 50cc                     │ [•••]││
│ │    │ Delivery · 0.1 m³ · 15 kg           │ ON   ││
│ │    │ 2.00 AED/km                          │      ││
│ └────┴─────────────────────────────────────┴──────┘│
│                                                     │
│ ┌────┬─────────────────────────────────────┬──────┐│
│ │ ≡  │ 🚐 Petit utilitaire                 │ [•••]││
│ │    │ Delivery · 2 m³ · 500 kg            │ ON   ││
│ │    │ 3.50 AED/km                          │      ││
│ └────┴─────────────────────────────────────┴──────┘│
│                                                     │
│ ┌────┬─────────────────────────────────────┬──────┐│
│ │ ≡  │ 🚚 Grand utilitaire                 │ [•••]││
│ │    │ Delivery · 8 m³ · 1500 kg           │ ON   ││
│ │    │ 5.00 AED/km                          │      ││
│ └────┴─────────────────────────────────────┴──────┘│
│                                                     │
│ ┌────┬─────────────────────────────────────┬──────┐│
│ │ ≡  │ 🚛 Camion 12T                       │ [•••]││
│ │    │ Delivery · 40 m³ · 12000 kg         │ OFF  ││
│ │    │ 8.00 AED/km                          │      ││
│ └────┴─────────────────────────────────────┴──────┘│
└─────────────────────────────────────────────────────┘
```

**Fonctionnalités :**

- Drag & drop pour réorganiser ordre
- Toggle ON/OFF pour activer/désactiver
- Menu [•••] avec actions : Edit, Duplicate, Delete
- Badge catégorie avec couleur
- Affichage specs principales selon catégorie
- Filtres temps réel

**Modal à créer : `components/admin/VehicleClassFormModal.tsx`**

Formulaire création/édition classe.

**Contenu :**

```
Add Vehicle Class

┌─────────────────────────────────────────────┐
│ Basic Information                           │
├─────────────────────────────────────────────┤
│ Name * [SUV Luxe                          ] │
│ Description                                 │
│ [Textarea: SUV haut de gamme 6 places     ] │
│                                             │
│ Icon                                        │
│ [🚙] [Change Icon]                          │
│                                             │
│ Category *                                  │
│ ● VTC  ○ Delivery  ○ Rental  ○ Corporate   │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ Capacities                                  │
├─────────────────────────────────────────────┤
│ Seating Capacity                            │
│ [6] persons                                 │
│                                             │
│ Trunk Capacity                              │
│ [500] liters                                │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ Required Equipments                         │
├─────────────────────────────────────────────┤
│ ☑ Air Conditioning                          │
│ ☑ GPS Tracker                               │
│ ☑ WiFi                                      │
│ ☐ Child Seat Compatible                     │
│ ☐ Phone Charger                             │
│ ☐ Water Bottles                             │
│ [+ Add Equipment]                           │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ Platform Mappings (Optional)                │
├─────────────────────────────────────────────┤
│ Uber                                        │
│ [Black ▼]  ☑ Auto-accept trips             │
│                                             │
│ Careem                                      │
│ [Black ▼]  ☑ Auto-accept trips             │
│                                             │
│ Yango                                       │
│ [Premium ▼]  ☐ Auto-accept trips           │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ Pricing                                     │
├─────────────────────────────────────────────┤
│ Base Rate per Kilometer                     │
│ [5.50] AED                                  │
│                                             │
│ Base Rate per Hour (optional)               │
│ [45.00] AED                                 │
│                                             │
│ Minimum Charge                              │
│ [25.00] AED                                 │
└─────────────────────────────────────────────┘

[Cancel] [Save Class]
```

**Validation temps réel :**

- Name obligatoire, unique
- Category obligatoire
- Seating capacity > 0 si VTC/Rental
- Platform mapping categories valides

---

## 🎬 RÉSULTAT DÉMONTRABLE

**Scénario démo complet pour le sponsor :**

**1. État initial : 0 classes**

- Naviguer vers /admin/vehicle-classes
- Voir message "No vehicle classes yet. Add your first class to get started."
- Cliquer [+ Add Class]

**2. Création classe 1 : Scooter 50cc**

- Modal s'ouvre
- Remplir :
  - Name : "Scooter 50cc"
  - Description : "Livraison express colis <15kg"
  - Icon : 🛵
  - Category : Delivery
  - Volume : 0.1 m³
  - Weight : 15 kg
  - Equipments : GPS Tracker, Top case
  - Base rate : 2.00 AED/km
- Cliquer "Save Class"
- Toast : "Class created successfully"
- Classe apparaît dans liste

**3. Création 3 autres classes (rapide)**

- Répéter pour :
  - Petit utilitaire (2 m³, 500 kg, 3.50 AED/km)
  - Grand utilitaire (8 m³, 1500 kg, 5.00 AED/km)
  - Camion 12T (40 m³, 12000 kg, 8.00 AED/km)
- Total : 4 classes créées

**4. Réorganisation ordre drag & drop**

- Glisser "Camion 12T" en position 2
- Animation fluide
- Ordre sauvegardé automatiquement
- Toast : "Order updated"

**5. Désactivation classe**

- Toggle "Camion 12T" OFF
- Confirmation : "Deactivate class? Vehicles will keep their assignment."
- Confirmer
- Classe passe en gris, badge "OFF"

**6. Tentative désactivation dernière active**

- Désactiver toutes classes sauf une
- Tenter désactiver la dernière
- Erreur : "Cannot deactivate last active class. At least 1 class must be active."
- Désactivation bloquée

**7. Modification classe avec mapping plateforme**

- Cliquer Edit sur "SUV Luxe"
- Ajouter Platform Mappings :
  - Uber : Black, auto-accept
  - Careem : Black, auto-accept
  - Yango : Premium, no auto-accept
- Sauvegarder
- Toast : "Class updated with platform mappings"

**CritÈres d'acceptation :**

- ✅ CRUD complet classes fonctionnel
- ✅ Drag & drop réorganisation
- ✅ Toggle active/inactive
- ✅ Validation name unique
- ✅ Validation dernière classe active non désactivable
- ✅ Formulaire adaptatif selon category
- ✅ Platform mappings optionnels
- ✅ Audit logs créés
- ✅ UI responsive et intuitive

---

## ⏱️ ESTIMATION

- **Temps backend :** 4 heures
  - VehicleClassService : 2h
  - VehicleClassRepository : 1h
  - Validators : 1h
- **Temps API :** 3 heures
  - CRUD endpoints : 2h
  - Reorder endpoint : 1h
- **Temps frontend :** 8 heures
  - Page liste avec drag & drop : 3h
  - Modal formulaire : 3h
  - Validation et UX : 2h
- **Temps tests :** 2 heures
  - Tests unitaires : 1h
  - Tests API : 1h
- **TOTAL : 17 heures (2 jours)**

**Estimation révisée finale : 1.5 jours (12h)**

---

## 🔗 DÉPENDANCES

**Prérequis obligatoires :**

- Table adm_tenant_vehicle_classes existante
- BaseService
- Validators Zod

**Services/composants requis :**

- auditService
- tenantRepository

**Données de test nécessaires :**

- 1 tenant
- 1 member avec permission vehicle_classes.update

---

## ✅ CHECKLIST DE VALIDATION

### Backend

- [ ] VehicleClassService : compile
- [ ] create() : valide name unique
- [ ] deactivate() : bloque si dernière active
- [ ] reorder() : met à jour display_order

### API

- [ ] GET /vehicle-classes : retourne liste triée
- [ ] POST /vehicle-classes : crée avec validation
- [ ] POST /reorder : réorganise ordre
- [ ] PATCH /[id] : met à jour
- [ ] DELETE /[id] : soft delete si pas de véhicules

### Frontend

- [ ] Page liste : affiche classes triées
- [ ] Drag & drop : réorganise ordre
- [ ] Modal formulaire : validation temps réel
- [ ] Toggle active : change statut
- [ ] Filtres : category, status

### Tests

- [ ] Test : create classe OK
- [ ] Test : deactivate dernière active → erreur
- [ ] Test : name dupliqué → erreur
- [ ] Test : reorder met à jour display_order

---

# ÉTAPE 5.3 : PROVIDER EMPLOYEES MANAGEMENT

**Durée :** 2 jours ouvrés (16 heures)  
**Objectif :** Gérer équipe FleetCore avec permissions cross-tenant et actions support  
**Livrable démo :** Interface Provider Employees permettant CRUD staff avec permissions spéciales

---

## 🎯 RATIONNEL MÉTIER

**POURQUOI :** FleetCore a besoin d'une équipe interne (support, commercial, tech, admin) pouvant accéder à plusieurs tenants pour fournir assistance, effectuer ventes, ou administrer le système. Un agent support doit pouvoir se connecter au tenant ABC Logistics pour résoudre un ticket, puis au tenant XYZ VTC pour un autre ticket. Un commercial doit voir les opportunités de tous les prospects. Un super admin doit pouvoir administrer tous les tenants.

**QUEL PROBLÈME :** Actuellement, seuls les membres (adm_members) existent, avec accès limité à leur propre tenant. Problème majeur :

1. **Support impossible** : Équipe support ne peut pas accéder aux tenants clients pour aider
2. **Commercial limité** : Commerciaux ne peuvent pas gérer prospects multi-tenants
3. **Admin limité** : Admins système ne peuvent pas administrer tous les tenants
4. **Audit manquant** : Actions support non tracées (qui a fait quoi sur quel tenant)
5. **Sécurité faible** : Pas de permissions granulaires (impersonate, billing_access, etc.)

**IMPACT SI ABSENT :**

- **Support** : Impossible de fournir assistance clients → satisfaction client catastrophique
- **Ventes** : Commerciaux travaillent avec Excel au lieu du CRM → leads perdus
- **Admin** : Administration système manuelle et dangereuse
- **Sécurité** : Pas de traçabilité actions cross-tenant → non-conformité SOC2
- **Scalabilité** : Impossible de scaler équipe support avec 1000+ tenants

**CAS D'USAGE CONCRET :**

**Contexte : Sarah - Agent Support FleetCore**  
Rôle : Support Level 1  
Département : Customer Success  
Accès : 50 tenants assignés (région UAE)

**Journée type de Sarah :**

**9h00 - Ticket #1234 : ABC Logistics**

- Client : "Je ne peux plus ajouter de véhicules, limite atteinte"
- Sarah se connecte à FleetCore
- Sélectionne tenant ABC Logistics dans dropdown
- Impersonate tenant (permission spéciale)
- Voit interface comme si elle était admin ABC Logistics
- Vérifie Settings > Limits : max_vehicles = 100, current = 100
- Constate : limite plan atteinte
- Sort du mode impersonate
- Répond au client : "Votre plan Standard permet 100 véhicules. Pour en ajouter, upgrade vers plan Premium (300 véhicules). Je vous envoie offre."
- Crée opportunité upgrade dans CRM
- Ferme ticket
- **Tout tracé dans audit logs** : sarah.support@fleetcore.com a impersonné ABC Logistics pendant 3 minutes

**10h30 - Ticket #1235 : XYZ VTC Premium**

- Client : "Ma facture du mois dernier est incorrecte"
- Sarah sélectionne tenant XYZ VTC Premium
- Accès billing (permission spéciale)
- Consulte facture octobre 2025
- Vérifie calculs : 85 véhicules × 30€ = 2,550€ HT → 3,060€ TTC (TVA 20%)
- Constate erreur : facture indique 3,500€ TTC (trop élevé)
- Crée ticket escalade pour équipe Finance
- Répond client : "Erreur confirmée, correction en cours, avoir envoyé sous 48h"
- **Tout tracé** : sarah.support@fleetcore.com a consulté facture XYZ VTC Premium

**14h00 - Appel entrant : Prospect DEF Transport**

- Prospect intéressé, demande démo
- Sarah ne peut pas accéder (pas de tenant encore)
- Transfère au commercial Pierre

**Pierre - Commercial FleetCore**  
Rôle : Account Executive  
Département : Sales  
Accès : Tous prospects (tenants status = trial)

**Workflow Pierre :**

- Reçoit transfert de Sarah
- Se connecte à FleetCore
- Va dans CRM > Leads
- Voit lead "DEF Transport" créé automatiquement
- Appelle prospect, qualifie besoin
- Lead converti en Opportunity
- Crée contrat dans CRM
- Contrat signé → Tenant DEF Transport créé automatiquement
- Tenant assigné à équipe support région France
- **Tout tracé** : pierre.commercial@fleetcore.com a créé tenant DEF Transport

**Mohamed - Super Admin FleetCore**  
Rôle : CTO  
Département : Tech  
Accès : TOUS tenants, TOUTES permissions

**Workflow Mohamed :**

- Détecte bug critique sur calcul revenus
- Se connecte à FleetCore
- Sélectionne tenant ABC Logistics (affecté)
- Impersonate avec full access
- Teste calcul revenus manuellement
- Identifie bug : timezone incorrect
- Corrige timezone : Asia/Dubai → Europe/Paris (erreur config)
- Test calculs : OK
- Sort du mode impersonate
- Déploie fix en production
- **Tout tracé** : mohamed.cto@fleetcore.com a modifié settings ABC Logistics (timezone)

**Valeur business :**

- **Support** : Équipe support peut aider clients efficacement (résolution tickets <2h)
- **Ventes** : Commerciaux gèrent prospects dans CRM (conversion +30%)
- **Admin** : Admins système administrent tenants en toute sécurité
- **Audit** : 100% actions cross-tenant tracées (conformité SOC2)
- **Scalabilité** : Support scale avec 1000+ tenants (1 agent pour 100 tenants)

---

## 📊 DONNÉES ET RÈGLES MÉTIER

**Table principale : `adm_provider_employees`**

**Colonnes critiques (25 colonnes) :**

| Colonne                 | Type         | Obligatoire | Utilité Business                                    |
| ----------------------- | ------------ | ----------- | --------------------------------------------------- |
| **id**                  | uuid         | OUI         | Identifiant unique employee (PK)                    |
| **employee_number**     | varchar(50)  | OUI         | Numéro employé unique (ex: EMP-2025-001)            |
| **clerk_user_id**       | varchar(255) | OUI         | ID Clerk pour auth                                  |
| **first_name**          | varchar(100) | OUI         | Prénom                                              |
| **last_name**           | varchar(100) | OUI         | Nom                                                 |
| **email**               | citext       | OUI         | Email unique @fleetcore.com                         |
| **phone**               | varchar(50)  | NON         | Téléphone                                           |
| **department**          | varchar(50)  | OUI         | Département (support, sales, tech, finance, admin)  |
| **title**               | varchar(100) | OUI         | Titre poste (Support Agent, Account Executive, CTO) |
| **role**                | varchar(50)  | OUI         | Rôle (support_agent, admin, super_admin)            |
| **permissions**         | jsonb        | OUI         | Permissions spéciales                               |
| **accessible_tenants**  | jsonb        | NON         | Liste tenants accessibles (null = ALL)              |
| **can_impersonate**     | boolean      | OUI         | Peut impersonate tenants ?                          |
| **can_override_limits** | boolean      | OUI         | Peut dépasser limites plan ?                        |
| **can_access_billing**  | boolean      | OUI         | Peut accéder facturation ?                          |
| **hire_date**           | date         | OUI         | Date embauche                                       |
| **termination_date**    | date         | NON         | Date départ                                         |
| **contract_type**       | varchar(50)  | OUI         | Type contrat (permanent, contractor, intern)        |
| **supervisor_id**       | uuid         | NON         | Manager (FK → adm_provider_employees)               |
| **last_activity_at**    | timestamp    | NON         | Dernière activité                                   |
| **status**              | varchar(20)  | OUI         | État (active, on_leave, terminated)                 |
| **metadata**            | jsonb        | NON         | Données additionnelles                              |
| **created_at**          | timestamp    | OUI         | Date création                                       |
| **updated_at**          | timestamp    | OUI         | Date modification                                   |
| **created_by**          | uuid         | NON         | Qui a créé                                          |
| **updated_by**          | uuid         | NON         | Qui a modifié                                       |

**Départements :**

```
ENUM department :
  - support : Customer Success, Support Level 1/2/3
  - sales : Account Executives, BDRs, Sales Managers
  - tech : Développeurs, DevOps, CTO
  - finance : Comptabilité, Facturation, CFO
  - admin : RH, Légal, CEO
```

**Rôles :**

```
ENUM role :
  - support_agent : Support client standard
  - support_manager : Manager support
  - sales_rep : Commercial
  - sales_manager : Manager commercial
  - developer : Développeur
  - devops : DevOps
  - finance_analyst : Analyste finance
  - admin : Administrateur
  - super_admin : Super administrateur (accès complet)
```

**Structure JSONB permissions :**

```json
{
  "tenants": {
    "access_level": "assigned", // "all", "assigned", "none"
    "allowed_tenant_ids": ["uuid1", "uuid2"], // Si access_level = "assigned"
    "can_create_tenant": false,
    "can_delete_tenant": false
  },
  "support": {
    "can_view_tickets": true,
    "can_close_tickets": true,
    "can_escalate": true,
    "max_priority_level": 2 // 1=P1 Critical, 2=P2 High, etc.
  },
  "billing": {
    "can_view_invoices": true,
    "can_issue_credits": false,
    "can_modify_plans": false,
    "max_credit_amount": 1000.0
  },
  "users": {
    "can_impersonate": true,
    "can_reset_passwords": true,
    "can_manage_roles": false
  },
  "data": {
    "can_export_data": false,
    "can_delete_data": false
  }
}
```

**Règles de validation :**

```
VALIDATION ProviderEmployeeCreateSchema :

employee_number :
  - Requis
  - Unique global
  - Format : EMP-YYYY-NNN (ex: EMP-2025-042)
  - Généré automatiquement si non fourni

email :
  - Requis
  - Unique global
  - DOIT finir par @fleetcore.com
  - Format RFC 5322

department :
  - Requis
  - Enum valide

role :
  - Requis
  - Enum valide
  - DOIT correspondre au department
    (ex: support_agent → department support)

permissions :
  - Requis
  - Object JSON structuré
  - Valider contre schéma permissions

accessible_tenants :
  - Optionnel
  - SI null → accès ALL tenants (super admin)
  - SI array → accès seulement ces tenants
  - Vérifier tous tenant_ids existent

can_impersonate :
  - Booléen requis
  - Default false
  - True seulement pour support/admin

supervisor_id :
  - Optionnel
  - SI renseigné : doit être employee actif
  - Pas de cycle (A supervise B qui supervise A)
```

**Règles métier :**

```
RÈGLE 1 : Email @fleetcore.com obligatoire
  - Seuls emails @fleetcore.com autorisés
  - Rejeter si autre domaine

RÈGLE 2 : Super admin = accès ALL tenants
  - SI role = "super_admin"
    ALORS accessible_tenants = null (ALL)
    ET can_impersonate = true
    ET can_override_limits = true
    ET can_access_billing = true

RÈGLE 3 : Support agent = accès tenants assignés
  - SI role = "support_agent"
    ALORS accessible_tenants = array (assigned)
    ET can_impersonate = true (avec audit)
    ET can_override_limits = false

RÈGLE 4 : Pas de self-supervision
  - supervisor_id != id (cannot supervise self)

RÈGLE 5 : Termination → révocation accès
  - SI termination_date renseignée
    ALORS status = "terminated"
    ET révoquer toutes sessions actives
    ET désactiver clerk_user_id

RÈGLE 6 : Audit automatique actions cross-tenant
  - Toute action sur tenant != own tenant
    → créer audit log avec :
      - provider_employee_id
      - target_tenant_id
      - action (impersonate, view_billing, modify_settings, etc.)
      - duration (si impersonate)
```

**Algorithmes :**

```
ALGORITHME createProviderEmployee :
  ENTRÉE : employeeData

  1. Valider employeeData avec ProviderEmployeeCreateSchema
  2. Vérifier email finit par @fleetcore.com
  3. SI employee_number non fourni :
     a. Générer : "EMP-" + YEAR + "-" + AUTO_INCREMENT
  4. Vérifier unicité email et employee_number
  5. SI role = "super_admin" :
     a. accessible_tenants = null
     b. can_impersonate = true
     c. can_override_limits = true
     d. can_access_billing = true
  6. Créer employee en DB
  7. Créer user dans Clerk
  8. Créer audit log (action = "create_employee")
  9. Envoyer email bienvenue
  10. Retourner employee créé

  SORTIE : provider_employee

ALGORITHME impersonateTenant :
  ENTRÉE : employee_id, tenant_id

  1. Récupérer employee
  2. Vérifier can_impersonate = true
  3. SI accessible_tenants NOT null :
     a. Vérifier tenant_id dans accessible_tenants
     b. SI non → throw ForbiddenError
  4. Créer session impersonate :
     - employee_id
     - tenant_id
     - started_at = now
  5. Créer audit log (action = "impersonate_start")
  6. Retourner session token

  SORTIE : impersonate_session

ALGORITHME endImpersonate :
  ENTRÉE : session_id

  1. Récupérer session impersonate
  2. Calculer duration = now - started_at
  3. Mettre à jour session :
     - ended_at = now
     - duration = duration
  4. Créer audit log (action = "impersonate_end", duration)
  5. Retourner succès

  SORTIE : success
```

---

## 🏗️ COMPOSANTS À DÉVELOPPER

### Backend (Service Layer)

**Fichier à créer : `lib/services/admin/provider-employee.service.ts`**

Service pour gérer les employés FleetCore.

**Classe ProviderEmployeeService extends BaseService :**

**Méthode findAll(filters?: EmployeeFilters) → Promise<ProviderEmployee[]>**

1. Récupérer tous employees
2. Filtrer par department, role, status
3. Trier par department puis last_name
4. Retourner liste

**Méthode findById(id: string) → Promise<ProviderEmployee>**

1. Récupérer employee par ID
2. Inclure supervisor relation
3. Retourner employee

**Méthode create(data: EmployeeCreateInput) → Promise<ProviderEmployee>**

1. Valider data
2. Vérifier email @fleetcore.com
3. Générer employee_number si absent
4. Appliquer permissions selon role
5. Créer en DB
6. Créer user Clerk
7. Créer audit log
8. Envoyer email bienvenue
9. Retourner employee

**Méthode update(id: string, data: EmployeeUpdateInput) → Promise<ProviderEmployee>**

1. Valider data
2. Vérifier employee existe
3. Mettre à jour en DB
4. Créer audit log
5. Retourner employee

**Méthode terminate(id: string, terminationDate: Date, reason: string) → Promise<ProviderEmployee>**

1. Récupérer employee
2. Changer status = "terminated"
3. Renseigner termination_date
4. Révoquer sessions actives
5. Désactiver Clerk user
6. Créer audit log
7. Notifier RH
8. Retourner employee

**Méthode impersonate(employeeId: string, tenantId: string) → Promise<ImpersonateSession>**

1. Récupérer employee
2. Vérifier can_impersonate = true
3. Vérifier accès tenant autorisé
4. Créer session impersonate
5. Créer audit log
6. Retourner session token

**Méthode endImpersonate(sessionId: string) → Promise<void>**

1. Récupérer session
2. Calculer duration
3. Mettre à jour ended_at
4. Créer audit log avec duration
5. Retourner succès

---

### API REST (Endpoints)

**Fichier à créer : `app/api/v1/admin/provider-employees/route.ts`**

**GET /api/v1/admin/provider-employees**

- **Description** : Liste tous les employees FleetCore
- **Query params** :
  - department
  - role
  - status
- **Permissions** : admin.employees.read (super admin only)
- **Réponse 200** :

```json
{
  "employees": [
    {
      "id": "uuid",
      "employee_number": "EMP-2025-042",
      "first_name": "Sarah",
      "last_name": "Johnson",
      "email": "sarah.support@fleetcore.com",
      "department": "support",
      "title": "Support Agent Level 1",
      "role": "support_agent",
      "can_impersonate": true,
      "accessible_tenants": ["uuid1", "uuid2"],
      "status": "active",
      "hire_date": "2025-01-15",
      "last_activity_at": "2025-11-10T14:30:00Z"
    }
  ],
  "total": 42
}
```

**POST /api/v1/admin/provider-employees**

- **Description** : Créer nouvel employee
- **Body** :

```json
{
  "first_name": "Sarah",
  "last_name": "Johnson",
  "email": "sarah.support@fleetcore.com",
  "department": "support",
  "title": "Support Agent Level 1",
  "role": "support_agent",
  "permissions": {
    "tenants": { "access_level": "assigned" },
    "support": { "can_view_tickets": true }
  },
  "accessible_tenants": ["uuid1", "uuid2"],
  "can_impersonate": true,
  "hire_date": "2025-01-15",
  "supervisor_id": "uuid-manager"
}
```

- **Permissions** : admin.employees.create
- **Réponse 201** : Employee créé
- **Erreurs** :
  - 422 : Email must end with @fleetcore.com
  - 400 : Validation failed

**Fichier à créer : `app/api/v1/admin/provider-employees/[id]/impersonate/route.ts`**

**POST /api/v1/admin/provider-employees/[id]/impersonate**

- **Description** : Démarrer session impersonate sur tenant
- **Body** :

```json
{
  "tenant_id": "uuid-abc-logistics"
}
```

- **Permissions** : Peut être appelé uniquement par l'employee lui-même
- **Réponse 200** :

```json
{
  "session_id": "uuid",
  "tenant_id": "uuid-abc-logistics",
  "tenant_name": "ABC Logistics",
  "started_at": "2025-11-10T15:00:00Z",
  "token": "impersonate_token_xyz123"
}
```

- **Erreurs** :
  - 403 : Not authorized to impersonate
  - 403 : Tenant not in accessible list

**POST /api/v1/admin/provider-employees/impersonate/end**

- **Description** : Terminer session impersonate
- **Body** :

```json
{
  "session_id": "uuid"
}
```

- **Réponse 200** :

```json
{
  "success": true,
  "duration": 180,
  "ended_at": "2025-11-10T15:03:00Z"
}
```

---

### Frontend (Interface Utilisateur)

**Page à créer : `app/[locale]/admin/provider-employees/page.tsx`**

Page principale Provider Employees (admin-only).

**Layout de la page :**

```
┌─────────────────────────────────────────────────────┐
│ HEADER                                              │
│ [FleetCore Logo] Admin > Provider Employees        │
│ [+ Add Employee]                                    │
└─────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────┐
│ FILTERS                                             │
│ Department: [All ▼]  Role: [All ▼]  Status: [Active ▼] │
└─────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────┐
│ EMPLOYEES LIST                                      │
│                                                     │
│ ┌──────┬─────────────────────┬──────┬──────┬──────┐│
│ │ EMP  │ Name                │ Dept │ Role │ [•••]││
│ ├──────┼─────────────────────┼──────┼──────┼──────┤│
│ │ 042  │ Sarah Johnson       │ SUP  │ Agent│ [•••]││
│ │      │ sarah.support@...   │      │ ON   │      ││
│ │      │ 50 tenants assigned │      │      │      ││
│ ├──────┼─────────────────────┼──────┼──────┼──────┤│
│ │ 043  │ Pierre Dubois       │ SALES│ Rep  │ [•••]││
│ │      │ pierre.sales@...    │      │ ON   │      ││
│ │      │ All prospects       │      │      │      ││
│ ├──────┼─────────────────────┼──────┼──────┼──────┤│
│ │ 001  │ Mohamed Ahmed       │ TECH │ CTO  │ [•••]││
│ │      │ mohamed.cto@...     │      │ ON   │      ││
│ │      │ ALL tenants (Admin) │      │      │      ││
│ └──────┴─────────────────────┴──────┴──────┴──────┘│
└─────────────────────────────────────────────────────┘
```

**Modal formulaire :**
Similar to classes, avec champs spécifiques employees.

**Tenant selector (pour impersonate) :**

- Dropdown tenants accessibles
- Bouton "Impersonate"
- Affiche durée session en cours
- Bouton "End Session"

---

## 🎬 RÉSULTAT DÉMONTRABLE

**Scénario démo complet :**

**1. Création employee support**

- Créer Sarah Johnson
- Department : Support
- Role : support_agent
- Assigner 50 tenants
- can_impersonate : true

**2. Sarah impersonate tenant**

- Sarah se connecte
- Sélectionne tenant ABC Logistics
- Clique "Impersonate"
- Interface change (comme si admin ABC)
- Résout ticket
- Clique "End Impersonate"
- Retour interface FleetCore

**3. Vérification audit logs**

- Consulter audit logs
- Voir : sarah.support impersonate ABC Logistics (duration: 3 min)

**CritÈres d'acceptation :**

- ✅ CRUD employees fonctionnel
- ✅ Permissions granulaires
- ✅ Impersonate avec audit
- ✅ accessible_tenants respecté
- ✅ Super admin = ALL tenants

---

## ⏱️ ESTIMATION

- **Backend :** 8h
- **API :** 4h
- **Frontend :** 10h
- **Tests :** 4h
- **TOTAL : 26h (3 jours)**

**Estimation révisée : 2 jours (16h)**

---

## 🔗 DÉPENDANCES

- Table adm_provider_employees
- Clerk auth
- AuditService

---

## ✅ CHECKLIST DE VALIDATION

- [ ] Create employee : email @fleetcore.com validé
- [ ] Impersonate : audit log créé
- [ ] Super admin : accès ALL tenants
- [ ] Support agent : accès seulement tenants assigned
- [ ] Terminate : révoque accès

---

## 📦 LIVRABLES FINAUX CHAPITRE 5

**Total fichiers créés : ~25 fichiers (~6000 lignes)**

**Métriques finales :**

- 📊 3 tables complètes (Settings, Classes, Employees)
- 📈 42+ settings gérés
- 🚫 Validation stricte 100%
- ⏱️ Versioning complet
- 📝 Audit trail complet
- 🔐 Permissions granulaires cross-tenant

**FIN DU CHAPITRE 5 - CONFIGURATION**
