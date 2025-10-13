# Analyse de la table `bil_billing_plans`

Cette note examine la table **`bil_billing_plans`**, qui définit les offres d’abonnement de Fleetcore pour ses clients. Comme pour les autres analyses, elle détaille le **modèle Supabase existant**, expose les **règles métiers** issues de la spécification et du code, propose des **améliorations** en s’appuyant sur les meilleures pratiques SaaS et présente un **modèle cible** ainsi que l’impact sur les autres tables.

## 1. Modèle Supabase existant

La table `bil_billing_plans` comprend les colonnes suivantes :

| Champ                                          | Type                  | Contraintes/Validation                                                   | Observations                                                                                                                                    |
| ---------------------------------------------- | --------------------- | ------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| **id**                                         | `uuid`                | Clé primaire générée par `uuid_generate_v4()`                            | Identifiant immuable du plan.                                                                                                                   |
| **plan_name**                                  | `text`                | **Non nul**, index unique partiel `(plan_name) WHERE deleted_at IS NULL` | Nom public du plan (Basic, Pro, Enterprise).                                                                                                    |
| **description**                                | `text`                | Optionnel                                                                | Permet de décrire le plan pour l’interface ou le marketing.                                                                                     |
| **monthly_fee**                                | `numeric(14,2)`       | **Non nul**, `CHECK (monthly_fee >= 0)`                                  | Montant facturé mensuellement (hors taxes).                                                                                                     |
| **annual_fee**                                 | `numeric(14,2)`       | **Non nul**, `CHECK (annual_fee >= 0)`                                   | Tarif annuel ; peut être différent du mensuel × 12 pour refléter une remise.                                                                    |
| **currency**                                   | `varchar(3)`          | **Non nul**                                                              | Code ISO‑4217 de la devise (e.g. USD, AED, EUR). Le DDL n’impose pas de valeur par défaut.                                                      |
| **features**                                   | `jsonb`               | **Non nul**, défaut `{}`                                                 | Contient la liste des fonctionnalités incluses (par exemple : `{"support": "email", "analytics": true}`). Un index GIN facilite les recherches. |
| **status**                                     | `text`                | **Non nul**, `CHECK (status IN ('active','inactive'))`                   | Indique si le plan est disponible à la souscription.                                                                                            |
| **metadata**                                   | `jsonb`               | **Non nul**, défaut `{}`                                                 | Données extensibles (peut stocker l’ordre d’affichage, la couleur du badge, etc.).                                                              |
| **created_at**                                 | `timestamptz`         | **Non nul**, défaut `now()`                                              | Date de création du plan.                                                                                                                       |
| **created_by**, **updated_by**, **deleted_by** | `uuid`                | Références facultatives vers `adm_provider_employees(id)`                | Traçabilité des actions.                                                                                                                        |
| **updated_at**                                 | `timestamptz`         | **Non nul**, défaut `now()`                                              | Mis à jour via un trigger `update_bil_billing_plans_updated_at` lors des modifications.                                                         |
| **deleted_at**, **deletion_reason**            | `timestamptz`, `text` | Optionnels                                                               | Permettent la suppression logique (soft delete).                                                                                                |

Des index supplémentaires (`status`, `deleted_at`, `created_by`, `updated_by`, `metadata`, `features`) optimisent les requêtes. La table n’a pas de `tenant_id` car les plans sont globaux et partagés par tous les clients.

## 2. Règles métier et process flow

1. **Définition des plans** : La spécification indique que Fleetcore propose plusieurs plans (Basic, Pro, Enterprise) avec un **tarif mensuel**, un nombre de ressources incluses (véhicules, chauffeurs, trajets) et des frais de dépassement【535592711015414†L482-L505】. Les plans peuvent être complétés par des **add‑ons** (support premium, analytics avancées). Chaque plan doit donc définir une base mensuelle et les quotas inclus. Ces quotas ne figurent pas dans le DDL mais sont présents dans le modèle Prisma (`max_vehicles`, `max_drivers`, `max_users`)【343286101209534†L34-L59】.

2. **Tarification mensuelle vs annuelle** : Le DDL distingue `monthly_fee` et `annual_fee`. Dans la pratique, certains clients peuvent choisir un abonnement annuel avec remise. Le code `SubscriptionsService` n’est pas détaillé, mais il devra appliquer le bon prix en fonction de l’intervalle choisi et proraté en cas de changement de plan.

3. **Statut du plan** : Seuls les plans en `active` peuvent être sélectionnés lors de la souscription. Les plans `inactive` ou supprimés (`deleted_at` non nul) ne sont plus proposés aux nouveaux clients. L’index partiel sur `plan_name` s’applique uniquement aux plans actifs pour permettre la réutilisation d’un nom après suppression logique.

4. **Gestion des fonctionnalités** : Le champ `features` est un JSON libre. Selon la spécification, les plans peuvent inclure ou exclure certains modules (par exemple, support premium, GPS en temps réel, reporting avancé). La liste des clés doit être documentée pour éviter les incohérences. Le service de souscription doit vérifier que les fonctionnalités du plan correspondent aux modules activés dans l’interface.

5. **Absence de plan_code** : Contrairement au modèle Prisma et à la pratique courante, le DDL ne contient pas de champ `plan_code`. Une clé technique stable est pourtant utile pour interfacer les plans avec Stripe (`stripe_price_id`) et les références dans le code. Les plans sont ici identifiés uniquement par `plan_name`, ce qui pose problème si ce nom est modifié pour des raisons marketing.

6. **RLS et multi‑tenant** : Cette table est globale. Elle n’a pas de `tenant_id`, car les plans sont les mêmes pour tous. Les règles de RLS ne filtrent pas l’accès en lecture, mais seules certaines fonctions administratives peuvent créer ou modifier des plans.

## 3. Propositions d’amélioration et modèle cible

Afin d’aligner les plans sur les meilleures pratiques SaaS et de préparer une facturation complète, les améliorations suivantes sont proposées **sans supprimer les champs existants** :

1. **Introduire un identifiant technique stable (`plan_code`)** : Ajouter une colonne `plan_code` (`varchar(100)`) unique et immuable. Cette clé est utilisée en interne et dans Stripe pour référencer le plan, tandis que `plan_name` peut être modifié à des fins marketing. Le modèle Prisma inclut déjà cette colonne【343286101209534†L34-L59】.

2. **Inclure des quotas inclus** : Ajouter des colonnes `max_vehicles`, `max_drivers` et `max_users` (entiers ou `null` pour illimité). Elles permettent de définir les ressources incluses dans le plan et sont nécessaires pour calculer les frais de dépassement【535592711015414†L482-L505】.

3. **Structurer les fonctionnalités** : Documenter le schéma du champ `features` ou créer une table `bil_plan_features` liée à `bil_billing_plans` pour stocker les fonctionnalités de manière normalisée (`feature_key`, `enabled`, `limits`). Cela évite des JSON hétérogènes.

4. **Ajouter les identifiants Stripe** : Suivre le modèle Prisma en ajoutant `stripe_price_id_monthly` et `stripe_price_id_yearly` (text) pour référencer les prix dans Stripe et faciliter l’automatisation de la facturation. Ces champs sont optionnels et ne modifient pas les données existantes.

5. **Élargir le statut** : Remplacer `status` (`active`/`inactive`) par une énumération plus complète : `draft`, `active`, `deprecated`, `archived`. Cela permet de préparer un nouveau plan sans le rendre visible (`draft`), de retirer un plan (`deprecated`), ou de conserver l’historique (`archived`).

6. **Versionner les plans** : Ajouter une colonne `version` (`integer` ou `uuid`) pour permettre de mettre à jour les conditions et tarifs d’un plan sans écraser l’historique. Chaque nouvelle version d’un plan doit avoir une date d’effet et maintenir les anciennes en `deprecated` ou `archived`.

7. **Gestion multi‑devises et TVA** : Ajouter des colonnes facultatives `vat_rate` (numeric) et `billing_interval` (`month`/`year`) pour gérer la TVA et l’intervalle par défaut. Les taux de TVA (5 % en AE et 20 % en FR) sont mentionnés dans la spécification【611243862873268†L268-L280】.

8. **Modèle cible (DDL amélioré)** :

```sql
CREATE TABLE bil_billing_plans (
  id                       UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plan_code                VARCHAR(100) UNIQUE NOT NULL,
  plan_name                VARCHAR(100) NOT NULL,
  description              TEXT,
  price_monthly            NUMERIC(14,2) NOT NULL CHECK (price_monthly >= 0),
  price_yearly             NUMERIC(14,2) CHECK (price_yearly >= 0),
  currency                 CHAR(3) NOT NULL DEFAULT 'USD',
  max_vehicles             INTEGER,
  max_drivers              INTEGER,
  max_users                INTEGER,
  vat_rate                 NUMERIC(5,2),
  billing_interval         VARCHAR(10) NOT NULL DEFAULT 'month' CHECK (billing_interval IN ('month','year')),
  status                   VARCHAR(20) NOT NULL CHECK (status IN (
    'draft','active','deprecated','archived'
  )),
  version                  INTEGER NOT NULL DEFAULT 1,
  features                 JSONB NOT NULL DEFAULT '{}',
  stripe_price_id_monthly  TEXT,
  stripe_price_id_yearly   TEXT,
  metadata                 JSONB NOT NULL DEFAULT '{}',
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by               UUID REFERENCES adm_provider_employees(id) ON DELETE SET NULL,
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by               UUID REFERENCES adm_provider_employees(id) ON DELETE SET NULL,
  deleted_at               TIMESTAMPTZ,
  deleted_by               UUID REFERENCES adm_provider_employees(id) ON DELETE SET NULL,
  deletion_reason          TEXT,
  CONSTRAINT bil_billing_plans_unique_code_version UNIQUE (plan_code, version) WHERE deleted_at IS NULL
);

CREATE INDEX bil_billing_plans_status_idx ON bil_billing_plans (status) WHERE deleted_at IS NULL;
CREATE INDEX bil_billing_plans_plan_name_idx ON bil_billing_plans (plan_name) WHERE deleted_at IS NULL;
CREATE INDEX bil_billing_plans_features_idx ON bil_billing_plans USING GIN (features);
```

Cette version cible reprend les champs existants et introduit des éléments optionnels pour gérer les quotas, la TVA, la version, la clé technique (`plan_code`) et l’intégration Stripe. Elle remplace `monthly_fee` et `annual_fee` par `price_monthly` et `price_yearly`, plus cohérents avec les API Stripe et le modèle Prisma【343286101209534†L34-L59】.

## 4. Impact sur les autres tables et services

- **`bil_tenant_subscriptions`** : l’ajout de `plan_code`, de quotas et de versions nécessite de modifier la table des souscriptions pour stocker la version choisie et la date d’effet. Le calcul des frais mensuels ou annuels devra utiliser `price_monthly` ou `price_yearly` en fonction de `billing_interval`, tout en appliquant les quotas (`max_vehicles`, etc.).

- **`bil_tenant_invoices`** et **`bil_tenant_invoice_lines`** : le montant fixe de l’abonnement provient de `price_monthly` ou `price_yearly`. Les surcoûts sont calculés en comparant les métriques (nombre de véhicules, de chauffeurs, etc.) aux quotas. Les colonnes `vat_rate` et `tax_rate` permettent d’appliquer la TVA correcte à la facture【611243862873268†L268-L280】.

- **`bil_tenant_usage_metrics`** : les quotas inclus exigent que les métriques soient enregistrées et comparées à `max_vehicles`, `max_drivers` et `max_users`. Les plans définissent combien de véhicules/drivers/utilisateurs sont inclus avant de facturer des surcoûts【535592711015414†L482-L505】.

- **Front‑office et API** : avec un champ `status` plus fin et un `version` incrémental, l’interface doit filtrer les plans visibles (`active`) et proposer la dernière version. Les API doivent fournir la liste des plans actifs avec leurs quotas et tarifs. Lors de la création d’un nouveau plan ou d’une nouvelle version, le champ `version` doit s’incrémenter.

- **Migration et compatibilité** : les plans existants resteront valides. Lors de la migration, `plan_code` peut être auto‑généré à partir de `plan_name` (slug) et `version` initialisée à 1. Les nouvelles colonnes peuvent être ajoutées sans perturber les données existantes en conservant des valeurs par défaut (`null` ou `0`).

En adoptant ces améliorations, Fleetcore alignera la gestion des plans sur les standards du SaaS et facilitera l’intégration de nouveaux modèles de tarification et d’add‑ons. Le schéma cible reste compatible avec le modèle actuel tout en préparant la plateforme à des évolutions (multi‑devises, versionnement, quotas et intégration Stripe).
