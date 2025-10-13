<!--
  Analysis of `fin_driver_payment_batches` table
  This document follows the standard structure used in previous analyses.  It
  describes the current Supabase schema, summarises business rules and
  processes extracted from the specification (notably the salary processing
  workflow and WPS requirements), proposes enhancements to support
  multi‑jurisdiction payroll and flexible payout methods, and outlines a
  target data model.  A final section discusses the impact of these
  changes on related tables and services.
-->

# Table `fin_driver_payment_batches` – analyse complète

## Modèle Supabase existant

Cette table enregistre les informations agrégées d’un lot de paiements vers des chauffeurs. Son schéma actuel est le suivant :

| Champ                                          | Type                  | Contraintes / remarques                                                                                                 |
| ---------------------------------------------- | --------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| **id**                                         | `uuid`                | Clé primaire générée automatiquement.                                                                                   |
| **tenant_id**                                  | `uuid`                | Référence non nulle vers `adm_tenants(id)`, assurant l’isolement multi‑tenant.                                          |
| **batch_reference**                            | `text`                | Référence unique du lot au sein du tenant ; l’index `(tenant_id, batch_reference)` impose l’unicité (hors soft‑delete). |
| **payment_date**                               | `date`                | Date prévue d’exécution du paiement. Cette date peut être ultérieure à la date de création du lot.                      |
| **total_amount**                               | `numeric(18,2)`       | Montant total du lot (≥ 0). Ce montant est la somme des paiements individuels.                                          |
| **currency**                                   | `varchar(3)`          | Devise du lot, code ISO 4217 (par ex. `AED`, `EUR`).                                                                    |
| **status**                                     | `text`                | Champ contrôlé par un `CHECK` : valeurs possibles `pending`, `processing`, `completed`, `failed`, `cancelled`.          |
| **metadata**                                   | `jsonb`               | Données supplémentaires (non nul, défaut `{}`).                                                                         |
| **created_at**, **updated_at**                 | `timestamptz`         | Dates d’audit gérées par le trigger `update_fin_driver_payment_batches_updated_at`.                                     |
| **created_by**, **updated_by**, **deleted_by** | `uuid`                | Références facultatives vers `adm_members(id)` indiquant qui a créé, modifié ou supprimé le lot.                        |
| **deleted_at**, **deletion_reason**            | `timestamptz`, `text` | Champs de suppression logique (soft‑delete).                                                                            |

Des index secondaires sont définis sur `tenant_id`, `batch_reference`, `payment_date`, `status`, `created_by`, `updated_by`, `deleted_at` et `metadata` pour optimiser les requêtes. La contrainte `status_check` limite le champ `status` à cinq valeurs et la contrainte `total_amount_check` garantit que le montant ne peut pas être négatif.

## Règles métiers et processus identifiés

La section **5.8 Driver Payroll & WPS (UAE)** de la spécification décrit un processus de paie comprenant plusieurs étapes【241590307805986†L138-L144】. Les éléments suivants en découlent :

- **Regroupement par compte WPS et période de paie :** lors de la génération de la paie, les chauffeurs sont groupés en lots selon le compte bancaire sur lequel ils sont payés (WPS bank account) et la période (mensuelle ou bimensuelle). Chaque lot correspond à un enregistrement dans `fin_driver_payment_batches` contenant le montant total et la devise【241590307805986†L138-L144】.

- **Import des salaires et des retenues :** les montants individuels proviennent de plusieurs sources : salaires de base, allowances, pénalités, avances et dettes. Avant la génération du lot, le système vérifie la validité des documents du chauffeur (visa, Emirates ID, permis professionnel), excluant les chauffeurs non conformes【241590307805986†L138-L144】.

- **Statuts du lot :** la spécification mentionne les statuts `draft`, `exported`, `sent`, `processed` pour les fichiers WPS【241590307805986†L138-L144】. Le DDL actuel restreint le champ `status` à `pending`, `processing`, `completed`, `failed` et `cancelled`. On en déduit que plusieurs états intermédiaires (exporté, envoyé) pourraient manquer et qu’un mapping doit être défini.

- **Génération de fichier (SIF) et export :** pour les Émirats, après le regroupement, un fichier **Salary Information File (SIF)** est généré et téléchargé vers la banque【241590307805986†L138-L144】. Le lot doit alors conserver un lien vers le fichier (via un `file_url` ou un `document_id`) et passer à l’état `exported`, puis `sent` lorsque le fichier est transmis.

- **Périodes et méthodes de paie :** la paie peut être mensuelle ou bimensuelle, et certains pays utilisent d’autres méthodes (SEPA, mobile money, cash). Le modèle actuel ne distingue pas la périodicité ni la méthode de paiement utilisée.

- **Multi‑devises et réconciliation :** la colonne `currency` permet de gérer des paiements dans différentes devises. Les lots doivent être rapprochés avec les comptes bancaires correspondants et les transactions dans `fin_transactions`. Une piste d’audit doit être conservée dans `adm_audit_logs`.

## Propositions d’amélioration

Pour répondre aux besoins multi‑pays et rendre la paie adaptable à différents systèmes (WPS, SEPA, mobile money), les améliorations suivantes sont proposées :

1. **Ajout de champs de périodicité et de méthode de paiement :** ajouter `period_start` et `period_end` (`date` ou `timestamptz`) pour préciser la période couverte par le lot, ainsi qu’un champ `payroll_cycle` (`monthly`, `semi_monthly`, `weekly`, etc.). Ajouter également `payment_method` (`bank_transfer`, `mobile_money`, `cash`) et `batch_type` (`WPS`, `local`). Cela facilite le filtrage et l’adaptation à différentes juridictions.

2. **État détaillé du lot :** étendre l’énumération du `status` ou la remplacer par une table de référence `fin_payment_batch_statuses` afin d’inclure les états `draft`, `exported`, `sent`, `processed`, `failed`, `cancelled` et `rejected`. Un champ `status_reason` pourrait préciser la cause d’un échec (IBAN invalide, compte fermé, etc.).

3. **Lien avec la source de fonds :** ajouter `payout_account_id` référencé vers `fin_accounts(id)` pour indiquer à partir de quel compte le lot sera payé (par exemple, le compte bancaire WPS du tenant). Ce champ permet de valider que le compte est actif et suffisamment approvisionné avant l’exécution.

4. **Fichier export et documents :** inclure un champ `file_url` (ou `document_id` vers `doc_documents`) pour stocker la SIF générée et un champ `exported_at` pour la date d’export. On peut également ajouter `sent_at` et `processed_at` pour tracer les étapes.

5. **Gestion des exceptions et notifications :** prévoir un champ `error_details` (JSONB) pour stocker les erreurs rencontrées lors du traitement (IBAN incorrect, documents manquants). Ces erreurs peuvent déclencher des notifications à l’administrateur. Un champ `notified_at` peut indiquer quand une alerte a été envoyée.

6. **Audit enrichi et RLS :** maintenir les colonnes d’audit mais les lier à `adm_provider_employees` plutôt qu’à `adm_members` si les lots sont créés par le personnel Fleetcore. Appliquer la Row‑Level Security sur `tenant_id` et `status` pour que seuls les admins du tenant et le support puissent voir ou modifier les lots.

## Modèle cible et exemple de DDL

Le schéma suivant illustre un modèle étendu :

```sql
-- Table des statuts de lot (référence pour flexibilité)
create table fin_payment_batch_statuses (
  code text primary key,
  label text not null,
  description text null
);

-- Table des lots de paiements chauffeurs
create table fin_driver_payment_batches (
  id uuid primary key default extensions.uuid_generate_v4(),
  tenant_id uuid not null references adm_tenants(id) on delete cascade,
  batch_reference text not null,
  period_start date not null,
  period_end date not null check (period_end >= period_start),
  payroll_cycle text not null default 'monthly' check (payroll_cycle in ('monthly','semi_monthly','weekly','custom')),
  payment_date date not null,
  payment_method text not null default 'bank_transfer' check (payment_method in ('bank_transfer','mobile_money','cash')),
  batch_type text not null default 'WPS' check (batch_type in ('WPS','SEPA','local')),
  payout_account_id uuid not null references fin_accounts(id),
  total_amount numeric(18,2) not null check (total_amount >= 0),
  currency char(3) not null,
  status text not null default 'draft' references fin_payment_batch_statuses(code),
  status_reason text null,
  file_url text null,
  exported_at timestamptz null,
  sent_at timestamptz null,
  processed_at timestamptz null,
  error_details jsonb null,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  created_by uuid null references adm_provider_employees(id) on delete set null,
  updated_at timestamptz not null default now(),
  updated_by uuid null references adm_provider_employees(id) on delete set null,
  deleted_at timestamptz null,
  deleted_by uuid null references adm_provider_employees(id) on delete set null,
  deletion_reason text null,
  unique (tenant_id, batch_reference) where deleted_at is null
);

create index on fin_driver_payment_batches (tenant_id);
create index on fin_driver_payment_batches (payout_account_id);
create index on fin_driver_payment_batches (payment_date);
create index on fin_driver_payment_batches (status) where deleted_at is null;
create index on fin_driver_payment_batches (period_start);
create index on fin_driver_payment_batches (period_end);
create index on fin_driver_payment_batches (payment_method);
create index on fin_driver_payment_batches using gin (metadata);
```

Ce modèle enrichi permet :

- De **supporter plusieurs cycles de paie** (`payroll_cycle`) et méthodes de paiement (`payment_method`), afin de couvrir les spécificités des différents pays.
- De **lien explicite avec le compte de paiement** (`payout_account_id`), ce qui facilite la vérification des soldes et l’intégration aux flux de paiements internes.
- D’**enregistrer l’historique complet du traitement** (dates d’export, d’envoi et de traitement), ainsi que les erreurs éventuelles (`error_details`) et les raisons d’un statut particulier.
- De **normaliser les statuts** via une table de référence et d’éviter les incohérences entre modules (par exemple, `draft` dans la spécification vs `pending` dans le DDL).
- De **faciliter l’extension** à de nouveaux pays en ajoutant de nouveaux codes dans `batch_type` et `payment_method` sans modifier la structure.

## Impacts sur les autres tables et services

1. **`fin_driver_payments`** : cette table stocke les paiements individuels et doit référencer `fin_driver_payment_batches(id)`. L’ajout de `period_start`, `period_end`, `payment_method` et `batch_type` permettra de filtrer les paiements par période et méthode et de calculer des agrégations par lot.

2. **`fin_accounts`** : le champ `payout_account_id` implique que les comptes doivent être tenus à jour et que leur devise corresponde à celle du lot ou que des conversions soient prévues. Les validations devront interdire le paiement si le compte est suspendu ou fermé.

3. **`fin_transactions`** : lors de l’exécution d’un lot, des transactions seront créées pour débiter le compte de paiement et créditer les comptes des chauffeurs ou de leurs banques. Ces opérations devront tenir compte des nouvelles colonnes (`batch_type`, `payment_method`).

4. **Services de paie et intégrations bancaires** : les services qui génèrent les fichiers SIF, SEPA ou mobile money devront accepter les nouvelles colonnes (période, type, méthode) et mettre à jour les statuts à chaque étape. Le champ `file_url` permettra de lier le lot à un document dans `doc_documents`.

5. **RLS et audit** : les politiques RLS devront filtrer par `tenant_id` et `status` afin que seuls les administrateurs du tenant et l’équipe finance puissent voir ou modifier les lots. Toutes les actions (création, export, annulation) devront être journalisées dans `adm_audit_logs`.

6. **Interfaces utilisateur** : l’interface de paie devra afficher la périodicité, la méthode et le type du lot, fournir des actions pour générer les fichiers et mettre à jour les statuts, et afficher les erreurs détaillées en cas d’échec.

En mettant en œuvre ces améliorations, Fleetcore pourra gérer la paie des chauffeurs de manière flexible et conforme aux réglementations locales, tout en conservant une base de données cohérente et extensible.
