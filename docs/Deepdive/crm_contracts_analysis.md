# Analyse de la table `crm_contracts`

Cette analyse suit le format adopté pour les autres tables : elle part du **modèle Supabase existant**, identifie les **règles métier** et les processus sous‑jacents, propose des **améliorations** en tenant compte de la spécification fonctionnelle et des bonnes pratiques de gestion des contrats, puis décrit un **modèle cible** enrichi et l'impact potentiel sur les autres tables et services.

## 1. Modèle Supabase existant

La table `crm_contracts` représente les contrats signés avec des prospects ou clients dans le module CRM. Le DDL Supabase est le suivant :

| Champ                                          | Type                  | Contraintes/Validation                                              | Observations                                                                                                                                   |
| ---------------------------------------------- | --------------------- | ------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| **id**                                         | `uuid`                | Clé primaire générée par `uuid_generate_v4()`                       | Identifiant immuable du contrat.                                                                                                               |
| **lead_id**                                    | `uuid`                | **Non nul**, indexé (`crm_contracts_client_id_idx`)                 | Identifie le prospect (`crm_leads.id`) dont est issu le contrat. Le DDL ne déclare pas explicitement la clé étrangère mais elle est implicite. |
| **contract_reference**                         | `text`                | **Non nul**                                                         | Référence interne ou externe du contrat (numéro). Aucune contrainte d’unicité n’est définie ; des doublons sont possibles.                     |
| **contract_date**                              | `date`                | **Non nul**                                                         | Date de signature du contrat.                                                                                                                  |
| **effective_date**                             | `date`                | **Non nul**, `CHECK (effective_date >= contract_date)`              | Date de prise d’effet (peut être ultérieure à la signature).                                                                                   |
| **expiry_date**                                | `date`                | Optionnelle, `CHECK (expiry_date >= effective_date)`                | Date de fin du contrat. Si nulle, le contrat est sans échéance.                                                                                |
| **total_value**                                | `numeric(18,2)`       | **Non nul**, `CHECK (total_value >= 0)`                             | Montant total du contrat.                                                                                                                      |
| **currency**                                   | `varchar(3)`          | **Non nul**                                                         | Code ISO‑4217 (ex. `EUR`, `AED`).                                                                                                              |
| **status**                                     | `text`                | **Non nul**, valeurs autorisées : `active`, `expired`, `terminated` | Les statuts reflètent l’état du contrat. Aucun statut « draft » ou « pending_signature » n’est prévu.                                          |
| **metadata**                                   | `jsonb`               | **Non nul**, valeur par défaut `{}`                                 | Informations supplémentaires (éventuels champs custom).                                                                                        |
| **opportunity_id**                             | `uuid`                | Optionnel, FK vers `crm_opportunities(id)` (`ON DELETE SET NULL`)   | Permet de relier le contrat à l’opportunité qui a été remportée.                                                                               |
| **created_at**, **updated_at**                 | `timestamptz`         | **Non nuls**, valeurs par défaut `now()`                            | Horodatage de création et de dernière modification, mis à jour par trigger.                                                                    |
| **created_by**, **updated_by**, **deleted_by** | `uuid`                | FK vers `adm_members(id)`                                           | Traçabilité des utilisateurs qui ont créé, modifié ou supprimé le contrat.                                                                     |
| **deleted_at**, **deletion_reason**            | `timestamptz`, `text` | Optionnels                                                          | Gestion de la suppression logique (soft delete).                                                                                               |

Des index B‑tree sont créés sur `lead_id`, `contract_date`, `effective_date`, `expiry_date`, `status`, `deleted_at` et sur les champs d’audit. L’absence d’index unique sur `contract_reference` peut entraîner des doublons. Deux triggers `set_crm_contracts_updated_at` et `update_crm_contracts_updated_at` mettent à jour automatiquement `updated_at` à chaque modification.

## 2. Règles métier et processus déduits

En l’absence de description détaillée dans la spécification, on peut déduire un workflow typique à partir du DDL, des tables liées (leads, opportunités) et des bonnes pratiques de gestion contractuelle :

1. **Conversion du lead en client** : lorsqu’un prospect (`crm_leads`) est qualifié et qu’une opportunité est remportée, un contrat est créé. La colonne `lead_id` permet d’identifier le prospect à l’origine du contrat.
2. **Référence et dates clés** : un numéro ou une référence (`contract_reference`) est attribué. La date de signature (`contract_date`) est enregistrée, ainsi que la date de prise d’effet (`effective_date`) et la date d’expiration (`expiry_date`) si une fin est prévue. Deux contraintes s’assurent que l’effet et l’expiration ne précèdent pas la signature.
3. **Statuts de contrat** : les seuls statuts autorisés sont `active` (en vigueur), `expired` (échu) et `terminated` (résilié). Cette simplification ne couvre pas les phases intermédiaires (brouillon, en négociation, signé mais non encore actif). Un article sur les bonnes pratiques de gestion des contrats recommande de distinguer plusieurs états, par exemple : **Active – In Effect** (contrat valide), **Active – Future** (signé mais pas encore en vigueur), **Inactive** (expiré ou résilié) et **Undetermined** (informations manquantes)【427709730501299†L64-L70】.
4. **Cycle de vie et renouvellement** : les contrats peuvent être renouvelés, résiliés ou modifiés. La table ne contient pas de champ pour stocker le type de renouvellement (automatique, optionnel, non‑renouvelé). Les meilleures pratiques préconisent de gérer des **types de renouvellement** et d’enregistrer les conditions et durées associées【427709730501299†L72-L79】.
5. **Traçabilité et conformité** : chaque contrat est associé à un membre créateur et modificateur (`created_by`, `updated_by`). Les modifications doivent être enregistrées dans `adm_audit_logs` pour garantir la traçabilité et répondre aux obligations légales.

## 3. Propositions d’amélioration et modèle cible

Pour aligner la table `crm_contracts` sur les besoins d’un outil CRM complet et sur les bonnes pratiques de gestion contractuelle, les modifications suivantes sont recommandées. Elles sont conçues pour être **additives**, afin de ne pas compromettre les données existantes, tout en rendant le modèle plus riche et plus flexible.

### 3.1 Améliorations de la structure

1. **Contrainte d’unicité et identifiant stable** : ajouter un index unique partiel `(contract_reference) WHERE deleted_at IS NULL` pour empêcher les doublons de référence. Introduire éventuellement un champ `contract_code` ou `slug` généré automatiquement pour disposer d’un identifiant stable non modifiable.
2. **Lien explicite avec `crm_leads`** : déclarer la clé étrangère `lead_id` vers `crm_leads(id)` avec `ON DELETE SET NULL` pour éviter les erreurs et assurer l’intégrité référentielle.
3. **Typage et unités** : remplacer `currency` par un code ISO‑4217 contraint via une table de référence ou une énumération (comme pour les plans de facturation). Ajouter un champ `vat_rate` si la TVA doit être appliquée différemment selon le client.
4. **Statuts étendus** : remplacer la vérification actuelle par une énumération ou une table de référence pour les statuts avec des valeurs supplémentaires : `draft`, `negotiation`, `signed`, `active`, `future`, `expired`, `terminated`, `renewal_in_progress` et `cancelled`【427709730501299†L64-L70】. Cela permet d’aligner le suivi du contrat sur les bonnes pratiques de classification des statuts et de distinguer les contrats signés mais non encore en vigueur.
5. **Renouvellement et durée** : ajouter des colonnes `renewal_type` (ENUM : `automatic`, `optional`, `perpetual`, `non_renewing`), `notice_period_days` (entier) et `auto_renew` (booléen) pour gérer les conditions de renouvellement【427709730501299†L72-L79】. Ajouter `renewal_date` pour enregistrer la prochaine échéance de renouvellement et `renewed_from_contract_id` (FK sur `crm_contracts`) pour chaîner les contrats successifs.
6. **Informations de contact et de facturation** : ajouter `company_name`, `contact_name`, `contact_email`, `contact_phone` pour les informations du client, ainsi qu’une colonne `billing_address_id` (FK vers une table `crm_addresses`) pour stocker l’adresse de facturation. Ces champs sont nécessaires pour la facturation SaaS et la génération automatique de factures.
7. **Documents et versioning** : ajouter `document_url` ou `contract_file_id` (référence au stockage de documents) et `version_number` (entier) pour permettre la gestion de versions de contrat et l’archivage. Un champ `change_reason` (`text`) pourrait consigner le motif de modification lors de chaque nouvelle version.
8. **Lien vers le plan et l’abonnement** : si le contrat détermine l’accès au produit Fleetcore, ajouter `plan_id` (FK vers `bil_billing_plans(id)`) et `subscription_id` (FK vers `bil_tenant_subscriptions(id)`) pour synchroniser la gestion commerciale avec la facturation. Cela facilite la création de l’abonnement lors de la signature du contrat.
9. **Audit et métadonnées** : conserver `metadata` pour les champs personnalisés, mais ajouter un champ `notes` (`text`) pour des observations internes. Prévoir des colonnes `created_by`, `updated_by` et `approved_by` séparées pour distinguer la saisie, la modification et l’approbation.

### 3.2 Modèle cible proposé

Voici un exemple de DDL pour une version enrichie et généralisée de `crm_contracts` :

```sql
CREATE TYPE crm_contract_status AS ENUM (
  'draft', 'negotiation', 'signed', 'active', 'future', 'expired', 'terminated', 'renewal_in_progress', 'cancelled'
);

CREATE TYPE crm_contract_renewal_type AS ENUM ('automatic','optional','perpetual','non_renewing');

CREATE TABLE crm_contracts (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id              UUID REFERENCES crm_leads(id) ON DELETE SET NULL,
  opportunity_id       UUID REFERENCES crm_opportunities(id) ON DELETE SET NULL,
  tenant_id            UUID REFERENCES adm_tenants(id), -- facultatif si l’on souhaite rattacher le contrat au tenant créé après conversion
  plan_id              UUID REFERENCES bil_billing_plans(id),
  subscription_id      UUID REFERENCES bil_tenant_subscriptions(id),
  contract_code        TEXT NOT NULL, -- identifiant unique technique
  contract_reference   TEXT NOT NULL,
  contract_date        DATE NOT NULL,
  effective_date       DATE NOT NULL CHECK (effective_date >= contract_date),
  expiry_date          DATE CHECK (expiry_date IS NULL OR expiry_date >= effective_date),
  renewal_type         crm_contract_renewal_type,
  notice_period_days   INTEGER,
  auto_renew           BOOLEAN NOT NULL DEFAULT FALSE,
  renewal_date         DATE,
  total_value          NUMERIC(18,2) NOT NULL CHECK (total_value >= 0),
  currency             CHAR(3) NOT NULL,
  vat_rate             NUMERIC(5,2),
  status               crm_contract_status NOT NULL,
  company_name         TEXT,
  contact_name         TEXT,
  contact_email        CITEXT,
  contact_phone        VARCHAR(50),
  billing_address_id   UUID REFERENCES crm_addresses(id),
  document_url         TEXT,
  version_number       INTEGER NOT NULL DEFAULT 1,
  notes                TEXT,
  metadata             JSONB NOT NULL DEFAULT '{}',
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by           UUID REFERENCES adm_members(id) ON DELETE SET NULL,
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by           UUID REFERENCES adm_members(id) ON DELETE SET NULL,
  approved_by          UUID REFERENCES adm_members(id) ON DELETE SET NULL,
  deleted_at           TIMESTAMPTZ,
  deleted_by           UUID REFERENCES adm_members(id) ON DELETE SET NULL,
  deletion_reason      TEXT,
  renewed_from_contract_id UUID REFERENCES crm_contracts(id),
  CONSTRAINT crm_contracts_reference_unq UNIQUE (contract_reference) WHERE deleted_at IS NULL,
  CONSTRAINT crm_contracts_code_unq UNIQUE (contract_code) WHERE deleted_at IS NULL
);

-- Indexes pour optimiser la recherche
CREATE INDEX crm_contracts_lead_id_idx       ON crm_contracts (lead_id) WHERE deleted_at IS NULL;
CREATE INDEX crm_contracts_status_idx        ON crm_contracts (status) WHERE deleted_at IS NULL;
CREATE INDEX crm_contracts_effective_date_idx ON crm_contracts (effective_date) WHERE deleted_at IS NULL;
CREATE INDEX crm_contracts_expiry_date_idx   ON crm_contracts (expiry_date) WHERE deleted_at IS NULL;
CREATE INDEX crm_contracts_tenant_id_idx     ON crm_contracts (tenant_id) WHERE deleted_at IS NULL;
```

Ce modèle intègre les suggestions précédentes : clés étrangères explicites, statuts enrichis, informations de contact, type de renouvellement, versionnement et liens avec la facturation et les abonnements. Les colonnes ajoutées sont optionnelles afin de préserver la compatibilité ascendante avec les données existantes.

## 4. Impact sur les autres tables et services

- **CRM Leads et Opportunities** : l’ajout d’une clé étrangère explicite `lead_id` vers `crm_leads` et `opportunity_id` vers `crm_opportunities` renforce l’intégrité et impose que ces tables soient maintenues. La gestion du cycle de vie du lead jusqu’au contrat devra mettre à jour ces relations. Les contrats renouvelés peuvent pointer vers le contrat précédent via `renewed_from_contract_id`.
- **Tenants, Plans et Subscriptions** : en ajoutant `tenant_id`, `plan_id` et `subscription_id`, la table sert de pivot entre le CRM et les modules SaaS (facturation et abonnements). Lorsqu’un contrat est signé et activé, un tenant et un abonnement peuvent être créés automatiquement. Les changements de plan ou de statut nécessitent l’enregistrement d’un événement dans `adm_tenant_lifecycle_events` et la mise à jour du statut du tenant.
- **Facturation** : l’association du contrat à un abonnement permet de générer les factures (via `bil_tenant_invoices` et `bil_tenant_invoice_lines`) en fonction des conditions du contrat. Les champs `renewal_date`, `auto_renew` et `notice_period_days` déclenchent des notifications et des actions de facturation.
- **Support et Notifications** : des rappels doivent être configurés pour informer les gestionnaires avant l’expiration (`expiry_date`) et avant la date de renouvellement (`renewal_date`), conformément aux bonnes pratiques de gestion des contrats【427709730501299†L103-L115】. Ces notifications alimentent le module Support et peuvent créer des tickets automatiques.
- **Audit** : toute création ou modification de contrat doit être inscrite dans `adm_audit_logs` avec les actions `create`, `update`, `terminate`, `renew`. Les nouvelles colonnes `version_number` et `change_reason` facilitent l’audit et la traçabilité des évolutions contractuelles.

En adoptant ce modèle cible, la gestion des contrats devient plus précise et conforme aux meilleures pratiques : elle couvre l’ensemble du cycle de vie (brouillon, négociation, signature, activation, expiration, renouvellement, résiliation), offre une intégration cohérente avec les modules de facturation et d’abonnement, et améliore la traçabilité. Les modifications proposées peuvent être introduites progressivement, en ajoutant d’abord les nouvelles colonnes et en adaptant les services pour les renseigner, puis en migrer les statuts et les références existantes.
