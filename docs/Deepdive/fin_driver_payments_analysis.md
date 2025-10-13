<!--
  Analysis of `fin_driver_payments` table
  This document provides a comprehensive analysis of the `fin_driver_payments`
  table in Fleetcore.  It follows the standard structure: describing the
  existing Supabase schema, extracting business rules and processes from
  the functional specification, proposing improvements to handle multi‑jurisdiction
  payroll and integration requirements, and presenting a target data model
  with corresponding impacts on related tables.
-->

# Table `fin_driver_payments` – analyse complète

## Modèle Supabase existant

La table **`fin_driver_payments`** enregistre chaque paiement individuel effectué à un chauffeur. Elle se relie à un lot de paiements (`fin_driver_payment_batches`) et à un conducteur (`rid_drivers`). Le schéma actuel comprend :

| Champ                                          | Type                  | Contraintes / remarques                                                                                                                                      |
| ---------------------------------------------- | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **id**                                         | `uuid`                | Clé primaire générée automatiquement.                                                                                                                        |
| **tenant_id**                                  | `uuid`                | Référence non nulle vers `adm_tenants(id)` ; garantit l’isolation multi‑tenant.                                                                              |
| **driver_id**                                  | `uuid`                | Référence vers `rid_drivers(id)` ; indique quel chauffeur reçoit le paiement. La suppression en cascade supprime les paiements si le chauffeur est supprimé. |
| **payment_batch_id**                           | `uuid`                | Référence vers `fin_driver_payment_batches(id)` ; lie ce paiement à un lot. Supprimé en cascade si le lot est supprimé.                                      |
| **amount**                                     | `numeric(18,2)`       | Montant versé au chauffeur, doit être ≥ 0 grâce à un `CHECK`.                                                                                                |
| **currency**                                   | `varchar(3)`          | Devise du paiement (ISO 4217).                                                                                                                               |
| **payment_date**                               | `date`                | Date à laquelle le paiement est censé être exécuté.                                                                                                          |
| **status**                                     | `text`                | Champ limité par un `CHECK` aux valeurs `pending`, `processing`, `completed`, `failed`, `cancelled`.                                                         |
| **metadata**                                   | `jsonb`               | Stocke des informations supplémentaires (défaut `{}`). Utile pour des champs non modélisés tels que des références externes.                                 |
| **created_at**, **updated_at**                 | `timestamptz`         | Dates d’audit gérées par le trigger `update_fin_driver_payments_updated_at`.                                                                                 |
| **created_by**, **updated_by**, **deleted_by** | `uuid`                | Références facultatives vers `adm_members(id)` indiquant qui a créé, mis à jour ou supprimé l’enregistrement.                                                |
| **deleted_at**, **deletion_reason**            | `timestamptz`, `text` | Champs de suppression logique.                                                                                                                               |

Le modèle est optimisé via des index sur `tenant_id`, `driver_id`, `payment_batch_id`, `payment_date`, `status`, `deleted_at`, `created_by`, `updated_by` et `metadata`. La contrainte `status_check` garantit que le champ `status` ne prend qu’une valeur prédéfinie et la contrainte `amount_check` impose que le montant soit positif. Il n’existe pas de contrainte d’unicité sur la combinaison `(tenant_id, driver_id, payment_date)` ; plusieurs paiements peuvent donc être créés pour un chauffeur à la même date (par exemple pour des ajustements).

## Règles métiers et processus identifiés

Bien que la spécification ne décrive pas en détail la structure de `fin_driver_payments`, elle fournit des indications sur le flux global de paie【241590307805986†L138-L144】 :

1. **Collecte des salaires et retenues :** les montants individuels sont calculés à partir du salaire de base, des allowances, des bonus, des pénalités, des avances et des dettes. Le module de paie importe ces éléments pour chaque chauffeur avant de constituer les lots. Les paiements individuels reflètent cette consolidation.

2. **Périodicité et méthode de paiement :** la paie peut être mensuelle, bimensuelle (WPS), ou selon d’autres cycles dans d’autres pays. Les paiements sont versés via des méthodes diverses : virements bancaires (WPS/SEPA), mobile money ou espèces. Le modèle actuel ne précise pas la méthode utilisée ni la période couverte.

3. **Statuts du paiement :** la spécification mentionne des statuts de batch tels que `draft`, `exported`, `sent`, `processed`【241590307805986†L138-L144】. Les statuts du paiement individuel devraient être synchronisés avec ceux du lot : par exemple, quand le lot passe en `completed`, tous ses paiements doivent devenir `completed`. En cas d’échec d’un paiement (IBAN invalide, compte bloqué), le statut doit passer à `failed` et l’administrateur doit pouvoir corriger les coordonnées et réexécuter le paiement.

4. **Audit et conformité** : toute modification de montant, de statut ou de date doit être journalisée. Les paiements doivent respecter les RLS par `tenant_id`. Les champs `created_by` et `updated_by` devraient référencer des employés internes (`adm_provider_employees`) plutôt que des membres du tenant, car les paiements sont initiés par l’équipe finance de Fleetcore.

## Propositions d’amélioration

Pour faire évoluer la table `fin_driver_payments` et supporter la paie multi‑juridiction, les améliorations suivantes sont suggérées :

1. **Ajouter des métadonnées standardisées** : ajouter des champs explicites :
   - `payment_method` (`bank_transfer`, `mobile_money`, `cash`) : permet d’identifier la méthode utilisée pour ce paiement.
   - `payout_account_id` (`uuid`) : référence vers `fin_accounts(id)`, spécifiant le compte d’où provient la somme ou vers lequel elle est versée (pour un paiement de type “advance” ou “debt”).
   - `transaction_reference` (`text`) : identifiant renvoyé par la banque ou le PSP après l’exécution du paiement.
   - `status_reason` (`text`) et `error_details` (`jsonb`) : pour enregistrer la raison d’un échec (`failed`) ou le motif d’une annulation (`cancelled`).
   - `processed_at`, `failed_at`, `cancelled_at` (`timestamptz`) : dates précises des événements clés.

2. **Period start/end et cycle** : même si ces informations se trouvent généralement au niveau du lot, ajouter `period_start` et `period_end` (`date`) sur les paiements peut faciliter les rapprochements et les exports par période dans certains cas (par exemple, un ajustement en dehors du lot). Ces champs peuvent être optionnels et hérités du lot par défaut.

3. **Statuts normalisés** : remplacer le type `text` par une référence à une table `fin_payment_statuses` partagée avec les lots, ou utiliser un `ENUM` commun (`draft`, `pending`, `processing`, `completed`, `failed`, `cancelled`, `reversed`). Cela harmonise la gestion des statuts dans l’ensemble du module finance.

4. **Multi‑devises et conversions** : ajouter un champ `amount_in_tenant_currency` (`numeric(18,2)`) et `exchange_rate` (`numeric(12,6)`) pour stocker le montant converti dans la devise du tenant et le taux de change utilisé. Utile pour les rapports consolidés et le calcul de la TVA/impôts.

5. **Indexation et unicité** : ajouter une contrainte unique sur `(payment_batch_id, driver_id)` pour éviter de dupliquer des paiements identiques dans un même lot, tout en permettant des ajustements hors lot. Ajouter des index sur `payment_method`, `status` et `transaction_reference` pour accélérer les recherches.

6. **Audit enrichi** : utiliser `adm_provider_employees` comme référence pour `created_by`, `updated_by` et `deleted_by` afin de refléter que ces actions sont réalisées par l’équipe Fleetcore. Ajouter un champ `notes` (`text`) pour permettre aux administrateurs de consigner des commentaires.

## Modèle cible et exemple de DDL

Un schéma enrichi pourrait ressembler à ceci :

```sql
-- Table des statuts de paiement pour harmonisation
create table fin_payment_statuses (
  code text primary key,
  label text not null,
  description text null
);

-- Table des paiements individuels aux chauffeurs
create table fin_driver_payments (
  id uuid primary key default extensions.uuid_generate_v4(),
  tenant_id uuid not null references adm_tenants(id) on delete cascade,
  driver_id uuid not null references rid_drivers(id) on delete cascade,
  payment_batch_id uuid not null references fin_driver_payment_batches(id) on delete cascade,
  period_start date null,
  period_end date null check (period_end is null or period_end >= period_start),
  amount numeric(18,2) not null check (amount >= 0),
  amount_in_tenant_currency numeric(18,2) null,
  exchange_rate numeric(12,6) null,
  currency char(3) not null,
  payment_date date not null,
  payment_method text not null default 'bank_transfer' check (payment_method in ('bank_transfer','mobile_money','cash')),
  payout_account_id uuid null references fin_accounts(id),
  transaction_reference text null,
  status text not null default 'draft' references fin_payment_statuses(code),
  status_reason text null,
  error_details jsonb null,
  processed_at timestamptz null,
  failed_at timestamptz null,
  cancelled_at timestamptz null,
  notes text null,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  created_by uuid null references adm_provider_employees(id) on delete set null,
  updated_at timestamptz not null default now(),
  updated_by uuid null references adm_provider_employees(id) on delete set null,
  deleted_at timestamptz null,
  deleted_by uuid null references adm_provider_employees(id) on delete set null,
  deletion_reason text null,
  unique (payment_batch_id, driver_id) where deleted_at is null
);

create index on fin_driver_payments (tenant_id);
create index on fin_driver_payments (driver_id);
create index on fin_driver_payments (payment_batch_id);
create index on fin_driver_payments (payment_method);
create index on fin_driver_payments (status) where deleted_at is null;
create index on fin_driver_payments (payment_date desc);
create index on fin_driver_payments (period_start);
create index on fin_driver_payments (period_end);
create index on fin_driver_payments (payout_account_id);
create index on fin_driver_payments (transaction_reference);
create index on fin_driver_payments using gin (metadata);
```

Ce modèle offre :

- **Une harmonisation des statuts** via `fin_payment_statuses` afin de gérer facilement les transitions et d’ajouter de nouveaux états.
- **La possibilité de stocker la période de paie** (`period_start`/`period_end`) pour simplifier la ventilation des revenus par période.
- **Des informations détaillées sur le moyen de paiement** (`payment_method`) et la référence transactionnelle (`transaction_reference`), ainsi que le compte de sortie (`payout_account_id`).
- **La prise en charge du multi‑devises** grâce aux champs `amount_in_tenant_currency` et `exchange_rate` pour les rapports consolidés.
- **Un suivi complet du cycle de vie des paiements** (dates de traitement, d’échec, d’annulation) et des raisons d’erreur via `error_details`.
- **Une référence aux employés internes** (`created_by`, etc.) pour respecter la séparation des responsabilités.

## Impacts sur les autres tables et services

1. **`fin_driver_payment_batches`** : l’ajout de `period_start`/`period_end` et du champ `payment_method` au niveau du paiement individuel pourrait rendre ces colonnes redondantes si elles sont déjà présentes dans le lot. Il faudra définir une règle d’héritage (le paiement hérite des valeurs du lot par défaut, sauf exception). La contrainte d’unicité `(payment_batch_id, driver_id)` évite les doublons et implique une adaptation du service de génération des paiements.

2. **`fin_accounts`** : l’utilisation du champ `payout_account_id` exige que les comptes soient valides et en état `active`. L’intégration des paiements devra vérifier que le compte de sortie correspond à la méthode (`bank_transfer` → compte bancaire, `mobile_money` → compte digital).

3. **`rid_drivers` et `driver_documents`** : les paiements ne devraient être créés que pour des chauffeurs actifs ayant leurs documents à jour. Le processus de paie doit donc vérifier l’éligibilité du chauffeur (visa, permis, carte professionnelle selon le pays) avant d’insérer un enregistrement.

4. **`fin_transactions`** : chaque paiement doit générer une transaction débitant le compte Fleetcore et créditant le compte du chauffeur. Les champs `transaction_reference` et `payout_account_id` aideront à faire le rapprochement entre les tables. Les montants convertis devront être enregistrés si la devise du compte diffère.

5. **Audit et RLS** : il faudra adapter les politiques de sécurité pour que seuls les administrateurs et le support puissent voir/modifier les paiements. Les actions devront être consignées dans `adm_audit_logs` avec toutes les informations pertinentes (tenant, driver, montant, statut, date).

6. **Interfaces et processus** : les écrans de paie devront afficher les nouveaux champs (méthode, numéro de référence, statut détaillé) et permettre de réinitialiser un paiement en cas d’échec. Les exports WPS/SEPA devront lire `payment_method` et `transaction_reference` pour générer les fichiers adéquats.

En mettant en œuvre ces améliorations, Fleetcore sera en mesure d’exécuter des paiements chauffeurs dans différents contextes (UAE WPS, SEPA, mobile money) tout en offrant un suivi précis des transactions, une meilleure auditabilité et une extensibilité vers de nouveaux pays et moyens de paiement.
