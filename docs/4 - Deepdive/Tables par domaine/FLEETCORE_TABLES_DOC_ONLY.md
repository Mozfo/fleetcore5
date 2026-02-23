# FLEETCORE - ÉVOLUTION MODÈLE V1 → V2 : ANALYSE COMPLÈTE DES 55 TABLES (VERSION CORRIGÉE)

**Date:** 19 Octobre 2025  
**Version:** 2.2 - Document enrichi avec module Documents complet  
**Source:** Document 0_All_tables_v1.md (6386 lignes) + doc_documents_analysis.md  
**Correction:** Module Administration (8 tables) + Module Documents (1→4 tables)

---

## LES 55 TABLES EXISTANTES ANALYSÉES (MODÈLE V1)

### 📄 Domaine Documents (1→4 tables) - ENRICHI

**Table Existante (1 table)** 14. `doc_documents` - Stockage documents polymorphe

**Nouvelles Tables V2 (3 tables)** 15. `doc_document_types` - Référentiel types de documents 16. `doc_entity_types` - Référentiel types d'entités supportées 17. `doc_document_versions` - Historique versionnement documents

---

## ÉVOLUTIONS MAJEURES V1 → V2 - MODULE DOCUMENTS

### 📄 Évolutions sur la table Documents et nouvelles tables

#### Table 1: `doc_documents` - Évolutions majeures (table existante)

**Existant V1:**

- Stockage polymorphe basique (10 champs)
- entity_type et document_type en CHECK constraints
- Vérification binaire (verified boolean)
- Pas de métadonnées fichier
- Pas d'audit trail complet
- Pas de soft-delete
- file_url simple (pas de gestion provider)

**Évolutions V2:**

```sql
AJOUTER - Métadonnées Fichier:
- file_name (varchar 255) - Nom original
- file_size (integer) - Taille en bytes
- mime_type (varchar 100) - Type MIME (image/jpeg, application/pdf)
- metadata (jsonb) - Métadonnées extensibles

MODIFIER - Vérification Enrichie:
- REMPLACER verified (boolean)
  PAR verification_status (enum):
    * pending - En attente vérification
    * verified - Vérifié et validé
    * rejected - Rejeté non conforme
- verified_by (uuid) - FK → adm_members OU adm_provider_employees
- verified_at (timestamptz) - Quand vérifié
- rejection_reason (text) - Motif rejet si rejected

AJOUTER - Soft-delete et Audit:
- deleted_at (timestamptz) - Suppression logique
- deleted_by (uuid) - Qui a supprimé
- deletion_reason (text) - Pourquoi supprimé
- created_by (uuid) - FK → adm_members
- updated_by (uuid) - FK → adm_members

MODIFIER - Gestion Stockage:
- REMPLACER file_url (text)
  PAR storage_key (text) - Clé dans le provider
- storage_provider (varchar 50) - supabase, s3, azure_blob, gcs
  DEFAULT 'supabase'
- access_level (enum) - private, public, signed
  DEFAULT 'private'

AJOUTER - Status et Notifications:
- status (enum) - active, expired, archived
  DEFAULT 'active'
- expiry_notification_sent (boolean) - Rappel envoyé
  DEFAULT false

REMPLACER - Contraintes Type:
- entity_type: SUPPRIMER CHECK constraint
  AJOUTER FK → doc_entity_types(code)
- document_type: SUPPRIMER CHECK constraint
  AJOUTER FK → doc_document_types(code)

CRÉER INDEX:
- btree (verification_status) WHERE deleted_at IS NULL
- btree (status) WHERE deleted_at IS NULL
- btree (expiry_date) WHERE deleted_at IS NULL AND status = 'active'
- btree (storage_provider, storage_key)
- gin (metadata)
```

**Contraintes uniques étendues:**

```sql
UNIQUE (tenant_id, entity_type, entity_id, document_type, storage_key)
WHERE deleted_at IS NULL
```

---

#### Table 2: `doc_document_types` - Référentiel types documents (NOUVELLE)

**Rôle:**

- Normaliser les types de documents
- Permettre ajout dynamique de nouveaux types
- Éviter CHECK constraints en dur
- Configurer validation et expiration

**Structure complète V2:**

```sql
CREATE TABLE doc_document_types (
  code varchar(50) PRIMARY KEY,
  name text NOT NULL,
  description text NULL,

  -- Configuration
  requires_expiry (boolean) NOT NULL DEFAULT false,
  default_validity_days (integer) NULL,
  requires_verification (boolean) NOT NULL DEFAULT true,
  allowed_mime_types (text[]) NULL,
  max_file_size_mb (integer) NULL DEFAULT 10,

  -- Métadonnées
  category (varchar 50) NULL, -- legal, identity, vehicle, financial
  is_mandatory (boolean) NOT NULL DEFAULT false,
  display_order (integer) NOT NULL DEFAULT 0,
  icon (varchar 50) NULL,

  -- Audit trail complet
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NULL REFERENCES adm_provider_employees(id),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid NULL REFERENCES adm_provider_employees(id),
  deleted_at timestamptz NULL,
  deleted_by uuid NULL REFERENCES adm_provider_employees(id),
  deletion_reason text NULL
);

-- Index
CREATE INDEX doc_document_types_category_idx
  ON doc_document_types(category) WHERE deleted_at IS NULL;
CREATE INDEX doc_document_types_deleted_at_idx
  ON doc_document_types(deleted_at);

-- Valeurs initiales
INSERT INTO doc_document_types (code, name, category, requires_expiry, default_validity_days) VALUES
  ('registration', 'Carte grise', 'vehicle', true, 365),
  ('insurance', 'Assurance', 'vehicle', true, 365),
  ('visa', 'Visa', 'identity', true, 180),
  ('residence_visa', 'Visa de résidence', 'identity', true, 365),
  ('emirates_id', 'Emirates ID', 'identity', true, 730),
  ('driver_license', 'Permis de conduire', 'identity', true, 1825),
  ('platform_approval', 'Homologation plateforme', 'vehicle', true, 365),
  ('contract', 'Contrat', 'legal', false, NULL),
  ('invoice', 'Facture', 'financial', false, NULL),
  ('other', 'Autre', NULL, false, NULL);
```

---

#### Table 3: `doc_entity_types` - Référentiel entités supportées (NOUVELLE)

**Rôle:**

- Définir quelles entités peuvent avoir des documents
- Permettre extension dynamique
- Documenter les relations polymorphes

**Structure complète V2:**

```sql
CREATE TABLE doc_entity_types (
  code varchar(50) PRIMARY KEY,
  description text NOT NULL,
  table_name varchar(100) NOT NULL,

  -- Configuration
  is_active (boolean) NOT NULL DEFAULT true,
  display_order (integer) NOT NULL DEFAULT 0,

  -- Métadonnées
  metadata jsonb NOT NULL DEFAULT '{}',

  -- Audit trail complet
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NULL REFERENCES adm_provider_employees(id),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid NULL REFERENCES adm_provider_employees(id),
  deleted_at timestamptz NULL,
  deleted_by uuid NULL REFERENCES adm_provider_employees(id)
);

-- Index
CREATE INDEX doc_entity_types_deleted_at_idx
  ON doc_entity_types(deleted_at);

-- Valeurs initiales
INSERT INTO doc_entity_types (code, description, table_name) VALUES
  ('flt_vehicle', 'Véhicule', 'flt_vehicles'),
  ('rid_driver', 'Chauffeur', 'rid_drivers'),
  ('adm_member', 'Membre', 'adm_members'),
  ('contract', 'Contrat', 'crm_contracts'),
  ('flt_maintenance', 'Maintenance', 'flt_vehicle_maintenance'),
  ('bil_invoice', 'Facture SaaS', 'bil_tenant_invoices'),
  ('sup_ticket', 'Ticket support', 'sup_tickets'),
  ('fin_transaction', 'Transaction', 'fin_transactions');
```

---

#### Table 4: `doc_document_versions` - Historique versionnement (NOUVELLE)

**Rôle:**

- Garder historique complet de chaque document
- Tracer qui a modifié quoi et quand
- Permettre rollback si nécessaire
- Conformité audit trail

**Structure complète V2:**

```sql
CREATE TABLE doc_document_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES doc_documents(id) ON DELETE CASCADE,
  version_number integer NOT NULL,

  -- Snapshot complet
  storage_provider varchar(50) NOT NULL,
  storage_key text NOT NULL,
  file_name varchar(255) NOT NULL,
  file_size integer NOT NULL,
  mime_type varchar(100) NOT NULL,

  -- Dates
  issue_date date NULL,
  expiry_date date NULL,

  -- Vérification snapshot
  verification_status varchar(20) NOT NULL,
  verified_by uuid NULL,
  verified_at timestamptz NULL,
  rejection_reason text NULL,

  -- Métadonnées snapshot
  metadata jsonb NOT NULL DEFAULT '{}',

  -- Qui et quand
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NOT NULL REFERENCES adm_members(id),
  change_reason text NULL,

  -- Contrainte unique
  UNIQUE (document_id, version_number)
);

-- Index
CREATE INDEX doc_document_versions_document_id_idx
  ON doc_document_versions(document_id);
CREATE INDEX doc_document_versions_created_at_idx
  ON doc_document_versions(created_at);
CREATE INDEX doc_document_versions_verification_status_idx
  ON doc_document_versions(verification_status);
```

---

## NOUVELLES TABLES À CRÉER - DOMAINE DOCUMENTS

### Résumé des 3 nouvelles tables

**Table 1: `doc_document_types`**

- Référentiel centralisé des types de documents
- Configuration validation et expiration
- Remplacement des CHECK constraints

**Table 2: `doc_entity_types`**

- Référentiel des entités supportées
- Extension dynamique des relations polymorphes
- Documentation explicite des tables liées

**Table 3: `doc_document_versions`**

- Historique complet de chaque document
- Traçabilité des modifications
- Support rollback et audit

---

## DÉPENDANCES CRITIQUES - MODULE DOCUMENTS

### Ordre d'implémentation obligatoire

#### Phase 0 - Tables référentielles (IMMÉDIAT)

1. **doc_document_types** : Créer AVANT de modifier doc_documents
2. **doc_entity_types** : Créer AVANT de modifier doc_documents
3. **Peupler valeurs initiales** : INSERT des valeurs de base

#### Phase 1 - Migration doc_documents (Jour 1)

4. **Ajouter nouveaux champs** : Métadonnées, audit, storage
5. **Migrer entity_type** : CHECK → FK vers doc_entity_types
6. **Migrer document_type** : CHECK → FK vers doc_document_types
7. **Migrer verified** : boolean → verification_status enum
8. **Migrer file_url** : → storage_key + storage_provider

#### Phase 2 - Versionnement (Jour 2)

9. **doc_document_versions** : Créer table
10. **Trigger création version** : À chaque UPDATE de doc_documents
11. **Snapshot initial** : Créer version 1 pour documents existants

#### Phase 3 - Fonctionnalités avancées (Semaine 1)

12. **Service vérification** : Workflow verification_status
13. **Service expiration** : Notifications automatiques
14. **Service versionnement** : Rollback et historique
15. **RLS enrichi** : Permissions selon access_level

---

## MÉTRIQUES DE VALIDATION - DOCUMENTS

### Techniques

- [ ] 4 tables Documents opérationnelles (1 existante + 3 nouvelles)
- [ ] FK vers doc_document_types et doc_entity_types
- [ ] Trigger versionnement actif
- [ ] Index optimisés pour recherche et filtrage
- [ ] RLS selon access_level et tenant_id

### Fonctionnelles

- [ ] Upload document < 2 secondes
- [ ] Vérification workflow 3 états (pending/verified/rejected)
- [ ] Notifications expiration -30j, -7j, J
- [ ] Versionnement automatique à chaque modification
- [ ] Recherche documents < 100ms

### Sécurité

- [ ] 100% documents isolés par tenant
- [ ] Access_level respecté (private/public/signed)
- [ ] URL signées expiration 1h pour private
- [ ] Audit trail complet created_by/updated_by/deleted_by
- [ ] Soft-delete avec retention

### Conformité

- [ ] RGPD: Suppression définitive après retention
- [ ] Audit: Historique complet dans versions
- [ ] Traçabilité: Qui a vérifié/rejeté chaque document
- [ ] Stockage: Provider configurable par tenant

---

## IMPACT SUR LES AUTRES MODULES - DOCUMENTS

### Dépendances entrantes

- **Fleet (flt_vehicles)** : Documents carte grise, assurance, contrôle technique
- **Drivers (rid_drivers)** : Documents permis, visa, emirates_id via rid_driver_documents
- **Maintenance (flt_vehicle_maintenance)** : Factures, rapports intervention
- **Finance (fin_transactions)** : Justificatifs, reçus
- **Billing (bil_tenant_invoices)** : Factures SaaS en PDF
- **Support (sup_tickets)** : Pièces jointes tickets
- **Contracts (crm_contracts)** : Contrats signés PDF

### Dépendances sortantes

- **Administration (adm_members)** : verified_by, created_by, updated_by
- **Administration (adm_provider_employees)** : Vérification cross-tenant
- **Administration (adm_audit_logs)** : Log toutes opérations documents
- **Storage Provider (Supabase/S3)** : Stockage physique via storage_key

### Processus impactés

1. **Onboarding Driver** : Upload documents obligatoires → vérification → activation
2. **Handover Véhicule** : Photos état véhicule → signature → archivage
3. **Renewal Automatique** : Détection expiration → notification → upload nouveau
4. **Audit Conformité** : Vérification tous documents à jour → rapport mensuel
5. **Support Ticket** : Attachement documents → vérification → résolution

---

## MIGRATIONS NÉCESSAIRES - DOCUMENTS

### Script 1: Création tables référentielles

```sql
-- Exécuter EN PREMIER
CREATE TABLE doc_document_types (...);
CREATE TABLE doc_entity_types (...);
INSERT valeurs initiales;
```

### Script 2: Ajout champs doc_documents

```sql
-- Ajouter nouveaux champs
ALTER TABLE doc_documents ADD COLUMN file_name varchar(255);
ALTER TABLE doc_documents ADD COLUMN file_size integer;
ALTER TABLE doc_documents ADD COLUMN mime_type varchar(100);
ALTER TABLE doc_documents ADD COLUMN metadata jsonb DEFAULT '{}';
-- ... tous les autres champs
```

### Script 3: Migration des données

```sql
-- Migrer file_url → storage_key
UPDATE doc_documents SET
  storage_key = file_url,
  storage_provider = 'supabase';

-- Migrer verified → verification_status
UPDATE doc_documents SET
  verification_status = CASE WHEN verified THEN 'verified' ELSE 'pending' END;
```

### Script 4: Nettoyage contraintes

```sql
-- Supprimer CHECK constraints
ALTER TABLE doc_documents DROP CONSTRAINT doc_documents_entity_type_check;
ALTER TABLE doc_documents DROP CONSTRAINT doc_documents_document_type_check;

-- Ajouter FK vers tables référentielles
ALTER TABLE doc_documents ADD CONSTRAINT doc_documents_entity_type_fkey
  FOREIGN KEY (entity_type) REFERENCES doc_entity_types(code);
ALTER TABLE doc_documents ADD CONSTRAINT doc_documents_document_type_fkey
  FOREIGN KEY (document_type) REFERENCES doc_document_types(code);
```

### Script 5: Création doc_document_versions

```sql
CREATE TABLE doc_document_versions (...);

-- Créer version 1 pour tous documents existants
INSERT INTO doc_document_versions (
  document_id, version_number, storage_provider, storage_key,
  file_name, file_size, mime_type, verification_status,
  metadata, created_by
)
SELECT
  id, 1, storage_provider, storage_key,
  file_name, file_size, mime_type, verification_status,
  metadata, created_by
FROM doc_documents
WHERE deleted_at IS NULL;
```

---

## COMPARAISON V1 vs V2 - MODULE DOCUMENTS

### Structure V1 (Avant)

```
doc_documents (1 table, 10 champs)
├── Polymorphe basique
├── CHECK constraints en dur
├── Vérification binaire
├── Pas de métadonnées fichier
├── Pas d'audit trail
└── Pas de versionnement
```

### Structure V2 (Après)

```
doc_documents (1 table, 26 champs)
├── Polymorphe enrichi
├── FK vers tables référentielles
├── Workflow vérification 3 états
├── Métadonnées complètes
├── Audit trail + soft-delete
└── Versionnement automatique

doc_document_types (nouvelle table)
├── Référentiel types configurables
├── Validation et expiration
└── Extension dynamique

doc_entity_types (nouvelle table)
├── Référentiel entités supportées
├── Relations polymorphes documentées
└── Extension dynamique

doc_document_versions (nouvelle table)
├── Historique complet
├── Traçabilité modifications
└── Support rollback
```

### Gains fonctionnels

| Fonctionnalité           | V1          | V2                        | Gain                     |
| ------------------------ | ----------- | ------------------------- | ------------------------ |
| Types de documents       | 7 fixes     | Illimité dynamique        | Extension sans migration |
| Entités supportées       | 4 fixes     | Illimité dynamique        | Nouveau modules faciles  |
| Vérification             | Oui/Non     | Pending/Verified/Rejected | Workflow complet         |
| Métadonnées fichier      | ❌          | ✅ (nom, taille, MIME)    | Meilleure UX             |
| Versionnement            | ❌          | ✅ Automatique            | Audit + rollback         |
| Soft-delete              | ❌          | ✅ Avec raison            | Conformité RGPD          |
| Audit trail              | Partiel     | ✅ Complet                | 100% traçabilité         |
| Stockage multi-provider  | ❌          | ✅ (Supabase/S3/Azure)    | Flexibilité              |
| Access control           | Basique RLS | ✅ private/public/signed  | Sécurité granulaire      |
| Notifications expiration | ❌          | ✅ Automatique            | Proactif                 |

---

## IMPACT SUR LES AUTRES MODULES (GLOBAL)

### Dépendances entrantes - Administration

- **Tous modules** : Dépendent de tenant_id pour isolation
- **Tous modules** : Utilisent member_id pour audit
- **Finance/Revenue** : Lisent tenant status pour calculs
- **Support** : Utilise provider_employees pour assignation

### Dépendances sortantes - Administration

- **CRM** : Crée tenant après signature contrat
- **Billing** : Lit lifecycle_events pour facturation
- **Documents** : Vérifie permissions via roles
- **Tous** : Appliquent RLS via GUCs

### Dépendances entrantes - Documents

- **Fleet, Drivers, Maintenance, Finance, Billing, Support, CRM** : Attachent documents
- **Administration** : Vérifie permissions et audit

### Dépendances sortantes - Documents

- **Administration** : Audit trail et permissions
- **Storage** : Stockage physique fichiers

---

**Document enrichi avec les modules Administration (8 tables) + Documents (1→4 tables)**  
**Prochaine étape:** Mettre à jour le document LIAISON FONCTIONNELLE avec explications métier Documents
