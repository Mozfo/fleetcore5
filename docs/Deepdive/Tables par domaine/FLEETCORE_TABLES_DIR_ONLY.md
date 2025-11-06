# FLEETCORE - ÉVOLUTION MODÈLE V1 → V2 : ANALYSE COMPLÈTE DES 55 TABLES (VERSION CORRIGÉE)

## LES 55 TABLES EXISTANTES ANALYSÉES (MODÈLE V1)

### ⚠️ Domaine Directory (5 tables) - DÉTAIL COMPLET

#### Table 9: `dir_car_makes` - Marques véhicules
**Existant V1:**
- id (uuid) - Identifiant unique
- tenant_id (uuid nullable) - NULL = marque globale
- name (text) - Nom de la marque
- created_at, updated_at - Timestamps basiques
- Index unique sur (tenant_id, name) WHERE deleted_at IS NULL

**Évolutions V2 nécessaires:**
```
AJOUTER:
- code (varchar(50)) - Identifiant stable pour intégrations
- country_of_origin (char(2)) - Pays d'origine constructeur  
- parent_company (varchar(100)) - Groupe industriel parent
- founded_year (integer) - Année de fondation
- logo_url (text) - URL logo pour affichage
- status (enum) - active, inactive, deprecated
- metadata (jsonb) - Données extensibles
- created_by (uuid) - Traçabilité création
- updated_by (uuid) - Traçabilité modification
- deleted_at, deleted_by, deletion_reason - Suppression logique

CRÉER INDEX:
- btree (status) WHERE deleted_at IS NULL
- btree (country_of_origin)
- gin (metadata)
```

#### Table 10: `dir_car_models` - Modèles par marque
**Existant V1:**
- id (uuid) - Identifiant unique
- tenant_id (uuid nullable) - Scope tenant ou global
- make_id (uuid) - FK vers dir_car_makes
- name (varchar(100)) - Nom du modèle
- vehicle_class (varchar(50)) - Classe optionnelle
- created_at, updated_at - Timestamps

**Évolutions V2 nécessaires:**
```
AJOUTER:
- code (varchar(50)) - Code modèle constructeur
- year_start (integer) - Année début production
- year_end (integer) - Année fin production  
- body_type (varchar(50)) - berline, SUV, van, limousine
- fuel_type (varchar(50)) - essence, diesel, hybride, électrique
- transmission (varchar(50)) - manuelle, automatique
- seats_min (integer) - Nombre places minimum
- seats_max (integer) - Nombre places maximum
- length_mm (integer) - Longueur en millimètres
- width_mm (integer) - Largeur en millimètres
- height_mm (integer) - Hauteur en millimètres
- metadata (jsonb) - Spécifications additionnelles
- status (enum) - active, inactive, discontinued
- Champs audit et suppression logique

MODIFIER:
- vehicle_class → vehicle_class_id (uuid) - FK vers dir_vehicle_classes

CRÉER INDEX:
- btree (body_type, fuel_type)
- btree (year_start, year_end)
- gin (metadata)
```

#### Table 11: `dir_platforms` - Uber, Bolt, etc.
**Existant V1:**
- id (uuid) - Identifiant unique
- name (varchar(100)) - Nom plateforme
- api_config (jsonb) - Configuration API en JSON libre
- created_at, updated_at - Timestamps
- Pas de tenant_id (table globale)

**Évolutions V2 nécessaires:**
```
AJOUTER:
- code (varchar(50)) - Identifiant stable (uber, bolt, careem)
- description (text) - Description détaillée
- logo_url (text) - URL logo plateforme
- provider_category (varchar(50)) - ride_hailing, delivery, scooter
- supported_countries (jsonb) - Liste pays où disponible
- status (enum) - active, inactive, deprecated
- metadata (jsonb) - Configuration extensible
- created_by, updated_by - Références vers adm_provider_employees
- deleted_at, deleted_by, deletion_reason - Suppression logique

CRÉER TABLE dir_platform_configs:
- id (uuid)
- platform_id (uuid) - FK vers dir_platforms
- tenant_id (uuid) - Configuration par tenant
- api_base_url (text)
- auth_method (varchar(50)) - oauth2, api_key, jwt
- api_version (varchar(20))
- refresh_frequency_minutes (integer)
- webhook_endpoints (jsonb)
- supported_services (jsonb) - transport, delivery, etc
- sandbox_config (jsonb) - Config environnement test
- production_config (jsonb) - Config production
- secrets_vault_ref (varchar(100)) - Référence coffre-fort

DÉPLACER:
- api_config → dir_platform_configs (structuré et sécurisé)
```

#### Table 12: `dir_country_regulations` - Règles par pays
**Existant V1:**
- country_code (char(2)) - Code pays ISO (PK)
- vehicle_max_age (integer) - Âge max véhicule
- min_vehicle_class (varchar(50)) - Classe min en texte
- requires_vtc_card (boolean) - Carte VTC requise
- min_fare_per_trip/km/hour (decimal) - Tarifs minimums
- vat_rate (decimal) - Taux TVA
- currency (char(3)) - Devise
- timezone (varchar(50)) - Fuseau horaire
- metadata (jsonb) - Données additionnelles

**Évolutions V2 nécessaires:**
```
AJOUTER:
- min_vehicle_class_id (uuid) - FK vers dir_vehicle_classes (remplace texte)
- min_vehicle_length_cm (integer) - Longueur minimale
- min_vehicle_width_cm (integer) - Largeur minimale  
- min_vehicle_height_cm (integer) - Hauteur minimale
- max_vehicle_weight_kg (integer) - Poids maximal
- max_vehicle_mileage_km (integer) - Kilométrage maximal
- requires_professional_license (boolean) - Remplace requires_vtc_card
- required_documents (jsonb) - Liste documents obligatoires structurée
- effective_date (date) - Date début application
- expiry_date (date) - Date fin application
- status (enum) - active, inactive
- created_by, updated_by - Audit
- deleted_at, deleted_by - Suppression logique

MODIFIER:
- requires_vtc_card → requires_professional_license (plus générique)
- min_vehicle_class → min_vehicle_class_id (FK au lieu de texte)

CRÉER INDEX:
- btree (status, effective_date)
- btree (country_code, status) WHERE deleted_at IS NULL
```

#### Table 13: `dir_vehicle_classes` - Classes véhicules
**Existant V1:**
- id (uuid) - Identifiant unique
- country_code (char(2)) - FK vers dir_country_regulations
- name (varchar(50)) - Nom de la classe
- description (text) - Description optionnelle
- max_age (integer) - Âge maximal autorisé
- created_at, updated_at - Timestamps

**Évolutions V2 nécessaires:**
```
AJOUTER:
- code (varchar(50)) - Identifiant stable (sedan, suv, luxury)
- min_length_cm (integer) - Longueur minimale
- max_length_cm (integer) - Longueur maximale
- min_width_cm (integer) - Largeur minimale
- max_width_cm (integer) - Largeur maximale
- min_height_cm (integer) - Hauteur minimale
- max_height_cm (integer) - Hauteur maximale
- min_seats (integer) - Places minimum
- max_seats (integer) - Places maximum
- min_age (integer) - Âge minimum véhicule (nouveau)
- min_weight_kg (integer) - Poids minimum
- max_weight_kg (integer) - Poids maximum
- criteria (jsonb) - Critères additionnels extensibles
- status (enum) - active, inactive, deprecated
- metadata (jsonb) - Métadonnées libres
- created_by, updated_by - Références adm_provider_employees
- deleted_at, deleted_by, deletion_reason - Suppression logique

CRÉER TABLE adm_tenant_vehicle_classes:
- id (uuid)
- tenant_id (uuid) - FK vers adm_tenants
- code (varchar(50))
- name (varchar(100))
- description (text)
- criteria (jsonb) - Critères personnalisés
- based_on_class_id (uuid) - Hérite d'une classe standard
- status (enum)
- metadata (jsonb)
- Champs audit complets

CRÉER INDEX:
- btree (country_code, status)
- btree (min_seats, max_seats)
- gin (criteria)
```

---

## ÉVOLUTIONS MAJEURES V1 → V2 - MODULE DIRECTORY

### 📊 Synthèse des évolutions Directory

#### Évolutions transverses sur les 5 tables

**1. TRAÇABILITÉ COMPLÈTE**
- Ajout `created_by`, `updated_by` sur toutes tables
- Référence vers `adm_provider_employees` pour tables globales
- Référence vers `adm_members` pour données tenant

**2. SUPPRESSION LOGIQUE**
- Ajout `deleted_at`, `deleted_by`, `deletion_reason`
- Préservation historique obligatoire
- Index partiels WHERE deleted_at IS NULL

**3. CODES STABLES**
- Ajout `code` unique sur chaque table
- Identifiants courts pour intégrations
- Multi-langue via codes unifiés

**4. STATUTS ÉVOLUTIFS**
- Enum (active, inactive, deprecated)
- Désactivation sans suppression
- Gestion cycle de vie

**5. MÉTADONNÉES EXTENSIBLES**
- Champ `metadata` jsonb sur toutes tables
- Évolution sans migration schéma
- Index GIN pour recherche

#### Impact technique des évolutions

**NOUVELLES TABLES À CRÉER:**
1. `dir_platform_configs` - Configuration sécurisée plateformes
2. `adm_tenant_vehicle_classes` - Classes personnalisées par client

**COLONNES À AJOUTER:** 85+ nouveaux champs
- Directory: 65 champs techniques et métier
- Audit: 15 champs traçabilité
- Statut: 5 champs gestion état

**INDEXES À CRÉER:** 25+ nouveaux indexes
- Btree pour performances requêtes
- GIN pour recherche JSON
- Partiels pour soft delete

**CONTRAINTES À MODIFIER:**
- 5 FK texte → UUID (classes véhicules)
- 10 UNIQUE partiels avec deleted_at
- 15 CHECK pour validations métier

---

## NOUVELLES TABLES À CRÉER - DOMAINE DIRECTORY

### Table complémentaire 1: `dir_platform_configs`
```sql
-- Configuration sécurisée par tenant et plateforme
CREATE TABLE dir_platform_configs (
  id uuid PRIMARY KEY,
  platform_id uuid REFERENCES dir_platforms(id),
  tenant_id uuid REFERENCES adm_tenants(id),
  api_base_url text NOT NULL,
  auth_method varchar(50), -- oauth2, api_key, jwt
  api_version varchar(20),
  refresh_frequency_minutes integer DEFAULT 60,
  webhook_endpoints jsonb,
  supported_services jsonb,
  sandbox_config jsonb,
  production_config jsonb,
  secrets_vault_ref varchar(100), -- Référence coffre-fort externe
  is_active boolean DEFAULT true,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now(),
  UNIQUE(platform_id, tenant_id)
);
```

---

## DÉPENDANCES CRITIQUES - MODULES DIRECTORY ET ADMINISTRATION

### Ordre d'implémentation obligatoire

#### Phase 0 - Corrections critiques Directory (IMMÉDIAT)
1. **dir_country_regulations** : Ajouter dimensions et documents requis
2. **dir_platforms** : Sécuriser configuration API
3. **dir_platform_configs** : Créer table configuration par tenant
4. **dir_vehicle_classes** : Ajouter critères détaillés

#### Phase 1 - Enrichissement Directory (Semaine 1)  
5. **dir_car_makes** : Ajouter code et métadonnées
6. **dir_car_models** : Ajouter caractéristiques techniques
7. **adm_tenant_vehicle_classes** : Créer pour personnalisation
8. **Indexes et contraintes** : Performance et intégrité

#### Phase 2 - Administration Core (Semaine 1-2)
9. **adm_provider_employees** : Créer table complète
10. **adm_tenant_lifecycle_events** : Créer avec tous event types
11. **adm_invitations** : Créer pour onboarding
12. **adm_tenants** : Ajouter status + contact fields

#### Phase 3 - Sécurité et RBAC (Semaine 2)
13. **adm_members** : Ajouter 2FA et vérifications
14. **adm_roles** : Ajouter slug et hiérarchie
15. **adm_role_permissions** : Créer table
16. **adm_member_roles** : Ajouter contexte temporel

#### Phase 4 - Audit et conformité (Semaine 3)
17. **adm_audit_logs** : Enrichir avec catégories
18. **adm_role_versions** : Créer historique
19. **adm_member_sessions** : Tracking sessions
20. **adm_tenant_settings** : Configuration flexible

---

## MÉTRIQUES DE VALIDATION - DIRECTORY ET ADMINISTRATION

### Module Directory - Validation
- [ ] 5 tables Directory avec codes uniques
- [ ] Configuration plateformes sécurisée
- [ ] Validation dimensions véhicules active
- [ ] Classes personnalisées par tenant
- [ ] Traçabilité complète modifications

### Module Administration - Validation  
- [ ] 8 tables Administration opérationnelles
- [ ] RLS unifié sur toutes tables tenant
- [ ] 2FA actif pour rôles sensibles
- [ ] Audit trail complet et immuable
- [ ] Invitations avec expiration 72h

### Fonctionnelles globales
- [ ] Onboarding < 5 minutes
- [ ] Support cross-tenant fonctionnel
- [ ] Conformité réglementaire automatique
- [ ] Intégrations plateformes sécurisées
- [ ] Expansion nouveau pays < 1 jour

### Sécurité globale
- [ ] 0 accès cross-tenant non autorisé
- [ ] 100% actions tracées dans audit
- [ ] Secrets externalisés du database
- [ ] Sessions avec expiration
- [ ] Permissions vérifiées à chaque requête

---

## IMPACT SUR LES AUTRES MODULES

### Module Directory - Impacts

**Dépendances entrantes:**
- **Fleet** : Utilise marques/modèles pour véhicules
- **Drivers** : Vérifie conformité selon regulations
- **Trips** : Référence platforms pour imports
- **Revenue** : Applique règles par plateforme

**Dépendances sortantes:**
- **Administration** : Gère qui modifie référentiels
- **Documents** : Vérifie documents selon pays
- **Billing** : Tarification selon classes véhicules
- **CRM** : Utilise regulations pour devis

### Module Administration - Impacts

**Dépendances entrantes:**
- **Tous modules** : Dépendent de tenant_id pour isolation
- **Tous modules** : Utilisent member_id pour audit
- **Finance/Revenue** : Lisent tenant status pour calculs
- **Support** : Utilise provider_employees pour assignation

**Dépendances sortantes:**
- **CRM** : Crée tenant après signature contrat
- **Billing** : Lit lifecycle_events pour facturation
- **Documents** : Vérifie permissions via roles
- **Tous** : Appliquent RLS via GUCs

---

**Document corrigé avec détails complets modules Directory et Administration**  
**Prochaine étape:** Implémenter évolutions Directory priorité P0
