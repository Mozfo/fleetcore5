# Analyse de la table `fin_transactions`

Cette note détaille la table **`fin_transactions`**, le registre central de toutes les opérations financières enregistrées par Fleetcore. Elle fournit une source unique de vérité en décrivant la structure Supabase actuelle, en expliquant les règles métiers qui gouvernent la création et la gestion de ces transactions, en proposant des améliorations pour supporter d’autres prestataires et juridictions, et en présentant un modèle cible enrichi avec l’impact sur les autres tables. Les suggestions sont clairement distinguées du modèle existant.

## 1. Champs à valider (modèle actuel)

Le DDL fourni définit `fin_transactions` avec les champs suivants :

| Champ                                    | Description/Type       | Contraintes et validations                                                                                                                    |
| ---------------------------------------- | ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| **id**                                   | `uuid` (PK)            | Généré par `uuid_generate_v4()`, non nul.                                                                                                     |
| **tenant_id**                            | `uuid`                 | Référence obligatoire vers `adm_tenants(id)`, assure l’isolement multi‑tenant.                                                                |
| **account_id**                           | `uuid`                 | Référence obligatoire vers `fin_accounts(id)`, indique le compte débité/crédité.                                                              |
| **transaction_type**                     | `text`                 | Doit être l’une des valeurs `credit` ou `debit` (contrainte CHECK).                                                                           |
| **amount**                               | `numeric(18,2)`        | Montant positif (≥ 0) grâce à la contrainte CHECK ; représente toujours une valeur absolue, à combiner avec le type pour déterminer le signe. |
| **currency**                             | `varchar(3)`           | Devise ISO 4217 du montant ; non nulle.                                                                                                       |
| **reference**                            | `text`                 | Référence externe ou interne de l’opération (numéro d’invoice, ID Stripe, SIF, etc.), non nulle.                                              |
| **description**                          | `text`                 | Texte libre optionnel décrivant l’opération.                                                                                                  |
| **transaction_date**                     | `timestamptz`          | Date et heure effective de l’opération ; non nulle.                                                                                           |
| **status**                               | `text`                 | Statut parmi `pending`, `completed`, `failed` ou `cancelled` (contrainte CHECK).                                                              |
| **metadata**                             | `jsonb`                | Métadonnées supplémentaires (par défaut `{}`), utilisées pour stocker des informations spécifiques (ID PSP, informations de réconciliation).  |
| **created_at / updated_at**              | `timestamptz`          | Horodatage automatique de création et de mise à jour.                                                                                         |
| **created_by / updated_by / deleted_by** | `uuid`                 | Références facultatives vers `adm_members(id)` identifiant l’opérateur ; `on delete set null`.                                                |
| **deleted_at / deletion_reason**         | `timestamptz` / `text` | Soft delete et motif de suppression.                                                                                                          |

Des index sont définis sur `tenant_id`, `account_id`, `transaction_date` (desc), `status`, `deleted_at`, `created_by`, `updated_by` et `metadata` (GIN). Le trigger `update_fin_transactions_updated_at` met à jour `updated_at` lors de chaque modification. Il n’existe pas de clé unique sur `reference`, donc les doublons sont possibles.

## 2. Règles métiers et processus existants

Selon la spécification financière, le module de comptabilité de Fleetcore centralise toutes les opérations : paiements internes (loyers des chauffeurs, salaires WPS), versements aux investisseurs, règlements des plateformes, factures clients et paiements fournisseurs. Toutes ces opérations sont enregistrées dans `fin_transactions`, ce qui permet d’obtenir un registre unifié pour le rapprochement bancaire et la production d’états financiers 【567670092230000†L90-L118】. Les règles générales observées sont :

1. **Enregistrement de tous les flux** : chaque mouvement d’argent doit correspondre à une ligne dans `fin_transactions`. Les transactions peuvent provenir de modules différents (WPS, trip settlements, factures, remboursements) mais sont toutes normalisées dans cette table. La colonne `transaction_type` indique si le montant est un débit (`debit`) ou un crédit (`credit`) sur le compte associé.

2. **Lien avec les comptes** : chaque transaction est associée à un compte financier (`fin_accounts`). Ces comptes peuvent être des comptes bancaires, des caisses, des cartes ou des comptes virtuels (wallets), comme décrit dans la section 5.1 de la spécification 【567670092230000†L90-L118】. Les opérations modifient le solde du compte (hors scopes de l’insert SQL) et permettent de reconstituer l’historique.

3. **Multidevise et conformité** : la colonne `currency` stocke la devise de la transaction. Le système doit effectuer des conversions pour les rapports si les comptes sont dans une devise différente et respecter les obligations légales (TVA, reporting) propres à chaque pays.

4. **Référence et audit** : `reference` est utilisé pour identifier l’origine de l’opération (facture, numéro de règlement, ID PSP). Les colonnes `created_by` et `updated_by` permettent de savoir qui a créé ou modifié la ligne et doivent alimenter la table d’audit (`adm_audit_logs`), qui enregistre toutes les actions sensibles.

5. **Statuts et workflow** : le statut passe de `pending` à `completed` lorsque le paiement est confirmé (par exemple, réception du webhook Stripe) ou à `failed`/`cancelled` en cas d’échec ou d’annulation. Les process de rapprochement et de dunning utilisent ces statuts pour déclencher des notifications et des actions de relance.

## 3. Propositions d’amélioration

Pour rendre cette table plus robuste, adaptable à d’autres prestataires et conforme à diverses juridictions, les améliorations suivantes sont proposées :

1. **Normaliser les valeurs de `transaction_type` et `status`** : transformer ces champs en types `ENUM` ou créer des tables de référence (`dir_transaction_types`, `dir_transaction_statuses`) pour éviter les erreurs typographiques et faciliter l’extension (par exemple ajouter `refund`, `transfer_in`, `transfer_out`, `chargeback`).

2. **Catégoriser les opérations** : ajouter une colonne `category` ou `transaction_category_id` (FK vers une table `fin_transaction_categories`) permettant de distinguer les transactions par nature : revenu de trip, pénalité, paiement driver, remboursement, charge carte, versement investisseur, frais de plateforme, etc. Ceci facilite le reporting et le calcul de P&L.

3. **Comptes de contrepartie (optionnel)** : sans transformer Fleetcore en outil comptable complet, il peut être utile de prévoir, **à titre optionnel**, des colonnes `counterparty_account_id` et `counterparty_type`/`counterparty_id` pour modéliser certains mouvements internes (par exemple un transfert de la caisse vers la banque) et rattacher la transaction à un second compte ou à un tiers (fournisseur, client, investisseur). L’objectif n’est pas de gérer une comptabilité en partie double (celle‑ci doit rester dans l’ERP ou l’outil de comptabilité de l’entreprise), mais d’offrir un point d’intégration clair vers ces systèmes. Une table de journal auxiliaire pourrait être envisagée dans un futur connecteur pour export vers un ERP sans alourdir le modèle principal.

4. **Informations de taxes et de devises** : ajouter des colonnes `tax_rate`, `tax_amount`, `net_amount` et `exchange_rate` pour décomposer le montant et rendre les rapports plus précis. Les opérations transfrontalières ou multi‑devises nécessitent de stocker le taux de change appliqué.

5. **Gestion de l’origine et de la destination** : ajouter `entity_type` et `entity_id` pour faire le lien avec l’entité métier (véhicule, driver, trip, invoice, contract), et `source_system` pour indiquer l’origine (Stripe, Cashbox, WPS). On peut aussi ajouter `payment_method_id` (référence à `bil_payment_methods`) afin de savoir par quel moyen la transaction a été effectuée.

6. **Statuts enrichis et audit** : proposer des statuts supplémentaires (`initiated`, `processing`, `refunded`) et stocker l’horodatage de changement d’état (`status_changed_at`). Les transitions doivent être consignées dans `adm_audit_logs`. Ajouter des colonnes `validated_by` et `validated_at` pour indiquer qui a approuvé des montants sensibles.

7. **Soft delete et RLS** : conserver la suppression logique (déjà présente) et prévoir des politiques RLS permettant à chaque tenant de ne consulter que ses transactions, tout en autorisant les employés Fleetcore à auditer l’ensemble.

## 4. Modèle cible proposé

Le modèle ci‑dessous intègre les améliorations majeures sans briser la compatibilité descendante. Il ajoute notamment un système de catégorisation, un champ générique pour l’entité liée, l’identifiant du prestataire, et un second compte pour les mouvements internes. Le statut et le type deviennent des énumérations pour éviter les incohérences.

```sql
-- Table référentielle des types de transaction
CREATE TABLE dir_transaction_types (
  code varchar(30) PRIMARY KEY,
  description text NOT NULL
);

INSERT INTO dir_transaction_types (code, description) VALUES
  ('credit', 'Crédit sur un compte'),
  ('debit',  'Débit sur un compte'),
  ('transfer_in', 'Transfert entrant'),
  ('transfer_out', 'Transfert sortant'),
  ('refund', 'Remboursement'),
  ('chargeback', 'Contestation/Chargeback');

-- Table référentielle des statuts de transaction
CREATE TABLE dir_transaction_statuses (
  code varchar(30) PRIMARY KEY,
  description text NOT NULL
);

INSERT INTO dir_transaction_statuses (code, description) VALUES
  ('pending',   'Créée mais non finalisée'),
  ('initiated', 'Envoyée au prestataire'),
  ('processing','En cours de traitement'),
  ('completed','Confirmée et comptabilisée'),
  ('failed',    'Échec'),
  ('cancelled', 'Annulée'),
  ('refunded',  'Remboursée'),
  ('chargeback','Disputée/annulée par le PSP');

-- Table référentielle des catégories de transaction
CREATE TABLE fin_transaction_categories (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  description text NULL
);

CREATE TABLE fin_transactions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id uuid NOT NULL REFERENCES adm_tenants(id) ON DELETE CASCADE,
  account_id uuid NOT NULL REFERENCES fin_accounts(id) ON DELETE CASCADE,
  counterparty_account_id uuid NULL REFERENCES fin_accounts(id) ON DELETE SET NULL,
  transaction_type varchar(30) NOT NULL REFERENCES dir_transaction_types(code),
  category_id uuid NULL REFERENCES fin_transaction_categories(id),
  entity_type varchar(50) NULL,
  entity_id uuid NULL,
  amount numeric(18,2) NOT NULL CHECK (amount >= 0),
  currency varchar(3) NOT NULL,
  net_amount numeric(18,2) NULL,
  tax_rate numeric(5,2) NULL,
  tax_amount numeric(18,2) NULL,
  exchange_rate numeric(18,6) NULL,
  reference text NOT NULL,
  description text NULL,
  transaction_date timestamptz NOT NULL,
  status varchar(30) NOT NULL REFERENCES dir_transaction_statuses(code) DEFAULT 'pending',
  payment_method_id uuid NULL REFERENCES bil_payment_methods(id) ON DELETE SET NULL,
  source_system varchar(50) NULL,
  validated_by uuid NULL REFERENCES adm_members(id) ON DELETE SET NULL,
  validated_at timestamptz NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NULL REFERENCES adm_members(id) ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid NULL REFERENCES adm_members(id) ON DELETE SET NULL,
  deleted_at timestamptz NULL,
  deleted_by uuid NULL REFERENCES adm_members(id) ON DELETE SET NULL,
  deletion_reason text NULL,
  CONSTRAINT fin_transactions_amount_positive CHECK (amount >= 0)
);

CREATE INDEX IF NOT EXISTS fin_transactions_tenant_account_idx
  ON fin_transactions (tenant_id, account_id);
CREATE INDEX IF NOT EXISTS fin_transactions_entity_idx
  ON fin_transactions (entity_type, entity_id);
CREATE INDEX IF NOT EXISTS fin_transactions_transaction_date_idx
  ON fin_transactions (transaction_date DESC);
CREATE INDEX IF NOT EXISTS fin_transactions_status_idx
  ON fin_transactions (status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS fin_transactions_reference_idx
  ON fin_transactions (reference);
CREATE INDEX IF NOT EXISTS fin_transactions_metadata_idx
  ON fin_transactions USING gin (metadata);

-- Le trigger existant set_updated_at reste applicable.
```

## 5. Impacts sur les autres tables et services

**a. Mise à jour des comptes** : chaque insertion dans `fin_transactions` doit mettre à jour le solde du compte correspondant (`fin_accounts.balance`) et du compte de contrepartie le cas échéant. Des triggers ou services applicatifs doivent prendre en charge ces mouvements afin d’éviter les incohérences.

**b. Intégration avec `fin_driver_payments` et `fin_driver_payment_batches`** : les paiements aux chauffeurs générés par ces tables devront créer des transactions de type `debit` ou `transfer_out`, référencées par `entity_type = 'driver_payment'` et `entity_id` pointant sur l’enregistrement correspondant. Le système doit aussi prendre en compte les déductions automatiques (dettes, amendes) lors de la génération des transactions【235064887104183†L472-L475】.

**c. Relation avec les factures et abonnements** : les factures client (`bil_tenant_invoices`) et les lignes de facturation (`bil_tenant_invoice_lines`) doivent créer des transactions `credit` lorsqu’un paiement est encaissé, avec des références à l’`invoice_id`. Les abonnements (`bil_tenant_subscriptions`) peuvent également générer des transactions récurrentes.

**d. Conciliation et reporting** : les transactions servent de base pour les rapports financiers, la trésorerie et les flux de trésorerie. Les catégories et types ajoutés faciliteront l’élaboration des P&L et du bilan. L’introduction des colonnes `tax_rate` et `exchange_rate` permettra de calculer correctement les montants nets et les taxes dans chaque pays et d’exporter ces informations vers des systèmes comptables externes.

**e. Sécurité et conformité** : les colonnes `source_system`, `payment_method_id` et `validated_by` permettront de tracer la provenance et l’autorisation des transactions. La mise en place de RLS garantira qu’un tenant ne puisse consulter que ses opérations.

## 6. Conclusion

La table `fin_transactions` constitue la pierre angulaire du module financier de Fleetcore. Dans sa version actuelle, elle permet de stocker les débits et crédits de base avec les informations essentielles. Les améliorations proposées visent à enrichir ce registre sans pour autant transformer Fleetcore en logiciel de comptabilité complet : elles facilitent l’intégration avec des systèmes externes (ERP, logiciels de comptabilité) et permettent de mieux catégoriser et tracer les opérations. Elles renforcent la cohérence des données, simplifient l’intégration avec les autres modules (paie, facturation, investisseur, reporting) et assurent la conformité réglementaire en matière de fiscalité et d’audit. La gestion du grand livre et la comptabilisation en partie double restent du ressort d’outils spécialisés ; Fleetcore doit se positionner comme un **connecteur plug‑and‑play** vers ces systèmes.
