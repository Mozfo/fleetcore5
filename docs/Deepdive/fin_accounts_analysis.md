<!--
  Analysis of `fin_accounts` table
  This document follows the same structure used for other tables: it explains
  the existing Supabase model, outlines the business rules and processes
  identified in the functional specification and sample code, proposes
  improvements to better align with Fleetcore’s goals, and presents a
  target data model that incorporates those enhancements.  The final
  section discusses the potential impact on related tables and services.
-->

# Table `fin_accounts` – analyse complète

## Modèle Supabase existant

La table **`fin_accounts`** représente les différents comptes financiers d’un tenant. Son schéma Supabase actuel est le suivant :

| Champ                                          | Type                  | Contraintes / remarques                                                                                                 |
| ---------------------------------------------- | --------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| **id**                                         | `uuid`                | Clé primaire générée automatiquement.                                                                                   |
| **tenant_id**                                  | `uuid`                | Référence non nulle vers `adm_tenants(id)` ; chaque compte appartient à un tenant.                                      |
| **account_name**                               | `text`                | Nom du compte ; doit être unique par tenant (index unique partiel `(tenant_id, account_name)` où `deleted_at` est nul). |
| **account_type**                               | `text`                | Contrôlé par une contrainte CHECK ; valeurs autorisées : `bank`, `cash`, `digital`【567670092230000†L90-L118】.         |
| **currency**                                   | `varchar(3)`          | Code ISO 4217 de la devise du compte (par ex. `AED`, `EUR`).                                                            |
| **balance**                                    | `numeric(18,2)`       | Solde actuel (≥ 0 grâce à un `CHECK`). Le modèle ne gère pas de solde négatif ni de découvert.                          |
| **metadata**                                   | `jsonb`               | Informations supplémentaires stockées sous forme JSON ; non nul (défaut `{}`).                                          |
| **created_at**, **updated_at**                 | `timestamptz`         | Dates d’audit gérées par un trigger `update_fin_accounts_updated_at`.                                                   |
| **created_by**, **updated_by**, **deleted_by** | `uuid`                | Références vers `adm_members(id)` ; identifient qui a créé, mis à jour ou supprimé (soft‑delete) le compte.             |
| **deleted_at**, **deletion_reason**            | `timestamptz`, `text` | Champs de suppression logique. L’index unique n’inclut que les comptes non supprimés.                                   |

Des index secondaires existent sur `tenant_id`, `account_name`, `account_type`, `currency`, `deleted_at`, `created_by`, `updated_by` et `metadata` pour accélérer les requêtes【567670092230000†L90-L118】. La contrainte `balance_check` garantit que la colonne `balance` ne peut pas être négative. Par conception, le modèle actuel ne contient pas de colonnes sensibles (IBAN, numéro de carte) : il suppose que les détails bancaires sont stockés ailleurs ou gérés via des prestataires de paiement sécurisés.

## Règles métiers et processus identifiés

La section **5.1 Cashbox & Accounts** de la spécification fonctionnelle explique que Fleetcore gère plusieurs types de comptes financiers : comptes bancaires (compte principal, compte WPS salaire, réserve, comptes investisseurs), caisses (office cash, collections des chauffeurs), cartes (carburant, maintenance, péage) et comptes investisseurs【567670092230000†L90-L118】. Les règles métiers principales sont :

- **Typologie des comptes :** chaque compte a un type (`bank`, `cash` ou `digital`). Ces types correspondent aux groupes de comptes décrits :
  - *Comptes bancaires* : servent aux flux entrants et sortants (réception des règlements des plateformes, paiement des salaires WPS, versement des dividendes aux investisseurs). Ils peuvent nécessiter des intégrations avec des banques ou portails WPS.
  - *Caisses* : gèrent les espèces (par exemple encaissements des chauffeurs, petites dépenses). Les soldes de caisse sont mis à jour en temps réel.
  - *Comptes digitaux* : incluent les cartes carburant, les cartes de maintenance ou les comptes de péage (par exemple Salik à Dubaï). Les soldes sont synchronisés via les API des fournisseurs. Le modèle actuel ne distingue pas les sous‑types comme `fuel_card` ou `toll_account`.

- **Multi‑devises et solde en temps réel :** chaque compte porte une devise et un solde. La spécification précise que la plateforme doit supporter plusieurs devises et afficher des soldes en temps réel【567670092230000†L90-L118】. Les comptes de différents types peuvent utiliser différentes devises (ex. comptes bancaires en AED pour les Emirats, comptes digitaux en EUR pour un autre pays). Les conversions de devises et la gestion des fluctuations ne sont pas gérées au niveau du compte ; elles relèvent des modules de facturation et de finance.

- **Audit et RLS :** les colonnes `created_by`, `updated_by`, `deleted_by` indiquent que seules les personnes autorisées peuvent créer ou modifier un compte. Les comptes sont multi‑tenant : un tenant ne peut voir que ses propres comptes via les politiques RLS.

- **Contrainte de nom unique par tenant :** un même tenant ne peut pas avoir deux comptes portant le même `account_name` (index unique partiel). Cette règle simplifie la sélection des comptes dans les interfaces et évite les doublons.

- **Transactions et intégrations :** les comptes alimentent le module **fin_transactions** (transactions internes et externes). Chaque transaction référence un compte source et/ou destination. La gestion des soldes, le rapprochement bancaire et la génération de rapports financiers utilisent ces informations【567670092230000†L90-L118】.

- **Gestion manuelle vs automatique :** certains comptes (banque, cartes) sont synchronisés via API. Pour les caisses manuelles, des entrées manuelles ou des validations par un manager sont requises. Le système doit enregistrer les flux et ajuster les soldes en conséquence.

## Propositions d’amélioration

Afin d’élargir les capacités de Fleetcore et de préparer l’arrivée de nouveaux pays et services, plusieurs améliorations sont recommandées :

1. **Enumération stricte et sous‑types :** remplacer la colonne `account_type` de type `text` par un `ENUM` ou une table de référence `fin_account_types` (ex. `bank`, `cash`, `digital`, `toll`, `fuel_card`, `maintenance_card`, `investor`). Cela permet d’ajouter de nouveaux types sans casser les contraintes et d’associer des règles spécifiques à chaque type (par exemple, un compte `investor` ne peut être utilisé que pour verser des dividendes).

2. **Statut et date d’ouverture/fermeture :** ajouter un champ `status` (`active`, `suspended`, `closed`) et des dates `opened_at` et `closed_at`. Cela aidera à suivre le cycle de vie des comptes (par exemple, lorsqu’un compte bancaire est remplacé ou qu’une carte est expirée). Ces informations peuvent être exploitées dans les rapports financiers et les alertes.

3. **Détails bancaires et tokenisation :** pour les comptes bancaires, il serait utile d’ajouter des champs optionnels tels que `account_number_last4`, `bank_name`, `iban` et `swift_bic`, en veillant à ne stocker que les quatre derniers chiffres ou un identifiant tokenisé pour respecter la conformité PCI et les règles bancaires. Un champ `provider` (`stripe`, `adyen`, `local_bank`, etc.) peut indiquer via quel prestataire le compte est géré, afin de ne pas verrouiller l’implémentation sur un fournisseur unique.

4. **Devise et conversions :** conserver la colonne `currency`, mais prévoir un champ `exchange_rate_to_tenant_currency` ou un mécanisme de conversion pour générer des rapports consolidés. Une table `fin_exchange_rates` pourrait stocker les taux de change historiques pour la comptabilité.

5. **Limites et seuils :** pour les caisses et cartes, ajouter des colonnes `max_balance` et `min_balance` afin de fixer des seuils d’alerte (par exemple, notifier lorsqu’une caisse atteint un minimum). Des alertes automatiques peuvent être paramétrées via une table `fin_account_alerts`.

6. **Audit enrichi :** inclure un champ `description` ou `notes` pour documenter l’utilisation du compte et les décisions (ex. « compte réservé à la caution des véhicules »). Ajouter un index partiel sur `status` pour accélérer la recherche des comptes actifs.

## Modèle cible et exemple de DDL

Le schéma suivant illustre une version enrichie et flexible de la table `fin_accounts` :

```sql
-- Table des types de comptes financiers
create table fin_account_types (
  code text primary key,
  label text not null,
  description text null
);

-- Table finie des comptes financiers
create table fin_accounts (
  id uuid primary key default extensions.uuid_generate_v4(),
  tenant_id uuid not null references adm_tenants(id) on delete cascade,
  account_name text not null,
  account_type text not null references fin_account_types(code),
  provider text null,
  currency char(3) not null,
  balance numeric(18,2) not null default 0 check (balance >= 0),
  status text not null default 'active' check (status in ('active','suspended','closed')),
  opened_at timestamptz not null default now(),
  closed_at timestamptz null,
  max_balance numeric(18,2) null,
  min_balance numeric(18,2) null,
  account_number_last4 char(4) null,
  bank_name text null,
  iban text null,
  swift_bic text null,
  provider_account_id text null,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  created_by uuid null references adm_members(id) on delete set null,
  updated_at timestamptz not null default now(),
  updated_by uuid null references adm_members(id) on delete set null,
  deleted_at timestamptz null,
  deleted_by uuid null references adm_members(id) on delete set null,
  deletion_reason text null,
  unique (tenant_id, account_name) where deleted_at is null
);

create index on fin_accounts (tenant_id);
create index on fin_accounts (account_type);
create index on fin_accounts (status) where deleted_at is null;
create index on fin_accounts (currency);
create index on fin_accounts (provider);
create index on fin_accounts (opened_at);
create index on fin_accounts (closed_at);
create index on fin_accounts using gin (metadata);
```

Ce modèle introduit :

- **Une table `fin_account_types`** pour gérer les types de comptes extensibles.
- **Des champs `status`, `opened_at`, `closed_at`, `max_balance` et `min_balance`** qui permettent de suivre la vie des comptes et de définir des seuils.
- **Des colonnes optionnelles pour les comptes bancaires** (`account_number_last4`, `bank_name`, `iban`, `swift_bic`, `provider_account_id`), afin d’intégrer des prestataires variés tout en restant conformes aux normes PCI.
- **Une colonne `provider`** pour indiquer l’intégrateur de paiement (Stripe, Adyen, PayPal, etc.) sans le lier à un fournisseur unique.
- **Un `metadata` JSONB** conservé pour stocker des valeurs spécifiques non modélisées (ex. `fuel_card_number`, `toll_tag_id`).

## Impacts sur les autres tables et services

Les modifications proposées auront des conséquences sur plusieurs tables et modules :

1. **`fin_transactions`** : les transactions devront référencer le type de compte (via `fin_account_types`) et prendre en compte les nouveaux champs (`status`, `provider`, `closed_at`). Les règles de validation devront interdire les opérations sur des comptes fermés ou suspendus.

2. **`fin_driver_payment_batches` et `fin_driver_payments`** : ces tables devront pointer vers le compte où les fonds sont prélevés ou déposés et vérifier que le compte est actif et suffisamment approvisionné. Les multi‑devises devront être gérées lors des transferts.

3. **`bil_payment_methods` et `bil_tenant_subscriptions`** : la gestion des moyens de paiement et des abonnements devra être cohérente avec le champ `provider` : un compte `digital` associé à un prestataire pourra être utilisé pour payer les factures SaaS. Il conviendra de synchroniser les statuts (`suspended`, `closed`) pour éviter des paiements depuis un compte inactif.

4. **RLS et audit** : l’ajout de nouvelles colonnes et de nouvelles tables nécessite d’adapter les politiques RLS (filtrer par `tenant_id` et `status`) et d’enregistrer les actions dans `adm_audit_logs`. Toute modification de solde ou de statut devra être auditée.

5. **Interfaces utilisateur et API** : les écrans de gestion des comptes devront afficher les nouveaux champs (statut, dates, limites, détails bancaires) et permettre de configurer des alertes de solde. Les API devront être mises à jour pour créer et modifier des comptes selon le nouveau modèle.

En intégrant ces améliorations, Fleetcore pourra mieux gérer les multiples types de comptes décrits dans la spécification, offrir une meilleure visibilité aux gestionnaires financiers, respecter les obligations réglementaires et préparer l’expansion vers de nouvelles juridictions et prestataires de services.
