# Analyse de la table `bil_tenant_subscriptions`

Cette analyse reprend la structure validée appliquée aux autres tables (modèle existant, règles métier, améliorations et modèle cible) afin d’examiner la table **`bil_tenant_subscriptions`**, qui gère les abonnements des clients (tenants) à un plan d’abonnement Fleetcore. Elle s’appuie sur le DDL Supabase fourni, les éléments de la spécification fonctionnelle et du code, et propose des améliorations en vue d’un modèle cible plus complet et flexible.

## 1. Modèle Supabase existant

La table `bil_tenant_subscriptions` relie chaque tenant à un plan de facturation. Le DDL actuel définit les colonnes ci‑dessous :

| Champ                                          | Type                  | Contraintes/Validation                                                              | Observations                                                                                 |
| ---------------------------------------------- | --------------------- | ----------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| **id**                                         | `uuid`                | Clé primaire générée par `uuid_generate_v4()`                                       | Identifiant immuable de l’abonnement.                                                        |
| **tenant_id**                                  | `uuid`                | **Non nul**, FK vers `adm_tenants(id)` avec `ON DELETE CASCADE`                     | Assure l’isolement multi‑tenant et la suppression en cascade si le tenant est supprimé.      |
| **plan_id**                                    | `uuid`                | **Non nul**, FK vers `bil_billing_plans(id)` avec `ON DELETE CASCADE`               | Indique le plan auquel le tenant a souscrit.                                                 |
| **subscription_start**                         | `date`                | **Non nul**                                                                         | Date de début de la souscription.                                                            |
| **subscription_end**                           | `date`                | Optionnel, contrainte `subscription_end >= subscription_start`                      | Date de fin prévue de l’abonnement ; `NULL` pour un abonnement en cours.                     |
| **status**                                     | `text`                | **Non nul**, contrainte `CHECK` (`active`, `inactive`, `cancelled`)                 | État de l’abonnement ; les valeurs du DDL sont limitées à trois états.                       |
| **metadata**                                   | `jsonb`               | **Non nul**, valeur par défaut `{}`                                                 | Permet de stocker des données extensibles (notes internes, informations de migration, etc.). |
| **created_at**                                 | `timestamptz`         | **Non nul**, défaut `now()`                                                         | Horodatage de création.                                                                      |
| **created_by**, **updated_by**, **deleted_by** | `uuid`                | Références facultatives vers `adm_provider_employees(id)` avec `ON DELETE SET NULL` | Suivi de l’auteur des opérations (création, mise à jour, suppression logique).               |
| **updated_at**                                 | `timestamptz`         | **Non nul**, défaut `now()`                                                         | Mis à jour automatiquement via un trigger `update_bil_tenant_subscriptions_updated_at`.      |
| **deleted_at**, **deletion_reason**            | `timestamptz`, `text` | Optionnels                                                                          | Permettent la suppression logique (soft delete) sans perdre l’historique.                    |

Un index unique partiel sur `(tenant_id, plan_id) WHERE deleted_at IS NULL` empêche un tenant d’avoir deux abonnements actifs au même plan. Des indexes supplémentaires accélèrent les recherches par tenant, plan, dates de début/fin et statut. La table utilise la RLS sur `tenant_id` pour isoler les données.

## 2. Règles métier et processus déduits

Les règles métiers proviennent de la spécification fonctionnelle et du code de la phase 5 (SaaS). Elles définissent comment créer, gérer et mettre à jour les abonnements.

1. **Création de l’abonnement** : Lorsqu’un tenant souscrit à Fleetcore, un abonnement est créé avec une date de début et un statut initial. Le service `SubscriptionsService.createSubscription` crée d’abord un **customer** chez le prestataire de paiement (Stripe ou autre), puis crée une **subscription** et enregistre l’abonnement local. Le code initialise le statut à `trialing`, stocke l’ID de la souscription et du client chez le prestataire, et enregistre les dates de période courante et de fin de période d’essai【617274102437098†L149-L167】. Cette logique n’apparaît pas dans le DDL actuel, qui ne contient ni ces dates ni ces identifiants.

2. **Statuts de l’abonnement** : La spécification mentionne que chaque abonnement peut être `active`, `trial`, `suspended` ou `cancelled`, avec un indicateur d’auto‑renouvellement【535592711015414†L482-L505】. Le code utilise également des statuts `trialing`, `past_due` et `cancelled` en fonction des événements Stripe【617274102437098†L149-L167】. Le DDL Supabase limite actuellement le champ `status` à `active`, `inactive` ou `cancelled`, ce qui n’est pas suffisant pour représenter tous les états réels.

3. **Gestion des périodes de facturation et du renouvellement** : Dans le code, le champ `billing_cycle` (`monthly` ou `yearly`) détermine la fréquence de facturation et les dates de début et fin de la période courante (`current_period_start`, `current_period_end`). Un essai gratuit de 14 jours est attribué lors de la création de la souscription【617274102437098†L149-L167】. Aucune de ces informations n’est stockée dans le DDL actuel, ce qui rend impossible le calcul correct des périodes de facturation ou le suivi de l’essai.

4. **Annulation de l’abonnement** : Le service `cancelSubscription` annule l’abonnement auprès du prestataire. Si l’annulation se fait à la fin de la période (`cancel_at_period_end = true`), le statut local reste `active` jusqu’à la date de fin, sinon il passe immédiatement à `cancelled`【617274102437098†L149-L167】. Cette logique suppose l’existence d’un champ `cancel_at_period_end` et d’un statut `cancelled` non prévu dans le DDL.

5. **Synchronisation avec le prestataire** : Les webhooks Stripe mettent à jour localement le statut (`subscription.updated`), marquent les factures comme payées (`invoice.payment_succeeded`) ou `past_due` lors d’un échec de paiement【617274102437098†L149-L167】. Cela implique des colonnes pour stocker l’ID de la souscription chez le prestataire (`stripe_subscription_id`), l’ID du client (`stripe_customer_id`) et un statut `past_due`.

6. **Autres règles** : Un abonnement peut être lié à un **paiement par défaut** dans `bil_payment_methods`. Une migration doit assurer qu’il n’existe qu’un seul abonnement actif par tenant. Le champ `metadata` peut stocker des informations telles que l’auto‑renouvellement (booléen), l’ID de l’add‑on ou des notes internes.

## 3. Propositions d’amélioration et modèle cible

Pour refléter fidèlement la réalité métier (essais gratuits, facturation mensuelle/annuelle, suspension, proration) et s’aligner sur le code, le schéma doit être enrichi. Les améliorations proposées ci‑dessous s’ajoutent aux colonnes existantes sans supprimer les champs actuels :

1. **Ajout de champs de cycle et de période** :
   - `billing_cycle` (`varchar(10)`) : valeur `monthly` ou `yearly` définie lors de la souscription.
   - `current_period_start` et `current_period_end` (`timestamptz`) : dates de début et de fin de la période de facturation en cours.
   - `trial_end` (`timestamptz`) : date de fin de l’essai gratuit. Permet de gérer automatiquement la conversion en abonnement payant.
   - `cancel_at_period_end` (`boolean`) : indique si l’annulation a lieu à la fin de la période courante (comme dans `cancelSubscription`【617274102437098†L149-L167】).

2. **Identifiants du prestataire de paiement** : Pour éviter de se lier à un prestataire unique et permettre la migration vers d’autres PSP, ajouter :
   - `provider` (`varchar(50)`) : nom du prestataire de facturation (Stripe, Adyen, etc.).
   - `provider_subscription_id` (`text`) et `provider_customer_id` (`text`) : identifiants de la souscription et du client chez le PSP, en remplacement de `stripe_subscription_id` et `stripe_customer_id` du code. Ces colonnes doivent être indexées pour permettre la synchronisation via webhooks.

3. **Statuts enrichis** : Remplacer la contrainte actuelle par une énumération plus complète : `trialing`, `active`, `past_due`, `suspended`, `cancelled`, `cancelling`, `inactive`. Cela reflète les états décrits dans la spécification et dans le code (trial, suspension, dépassement, annulation). Un champ `auto_renew` (`boolean`) pourrait être ajouté dans `metadata` ou en colonne pour indiquer si l’abonnement est renouvelé automatiquement【535592711015414†L482-L505】.

4. **Historique et versionnement** : Si un plan change, l’abonnement doit garder trace de l’ancien plan et de la date de changement. Ajouter :
   - `previous_plan_id` (`uuid`) : référence vers l’ancien plan lors d’un changement.
   - `plan_version` (`integer`) ou `plan_version_id` : lien vers la version du plan choisi (si versionné). Permet de pricer correctement et d’historiser les conditions.

5. **Lien avec les méthodes de paiement** : Ajouter un champ `payment_method_id` (`uuid`) qui référence `bil_payment_methods(id)`. Cela permet de savoir quel moyen sera utilisé pour régler les factures de cet abonnement. Si ce champ reste `NULL`, l’application utilise le moyen par défaut du tenant.

6. **Nouvelle structure (DDL cible)** :

```sql
CREATE TABLE bil_tenant_subscriptions (
  id                         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id                  UUID NOT NULL REFERENCES adm_tenants(id) ON DELETE CASCADE,
  plan_id                    UUID NOT NULL REFERENCES bil_billing_plans(id) ON DELETE CASCADE,
  previous_plan_id           UUID REFERENCES bil_billing_plans(id),
  plan_version               INTEGER,
  subscription_start         DATE NOT NULL,
  subscription_end           DATE,
  billing_cycle              VARCHAR(10) NOT NULL DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly','yearly')),
  current_period_start       TIMESTAMPTZ,
  current_period_end         TIMESTAMPTZ,
  trial_end                  TIMESTAMPTZ,
  cancel_at_period_end       BOOLEAN NOT NULL DEFAULT true,
  payment_method_id          UUID REFERENCES bil_payment_methods(id),
  provider                   VARCHAR(50),
  provider_subscription_id   TEXT,
  provider_customer_id       TEXT,
  status                     VARCHAR(20) NOT NULL CHECK (status IN (
    'trialing','active','past_due','suspended','cancelling','cancelled','inactive'
  )),
  metadata                   JSONB NOT NULL DEFAULT '{}',
  auto_renew                 BOOLEAN NOT NULL DEFAULT true,
  created_at                 TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by                 UUID REFERENCES adm_provider_employees(id) ON DELETE SET NULL,
  updated_at                 TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by                 UUID REFERENCES adm_provider_employees(id) ON DELETE SET NULL,
  deleted_at                 TIMESTAMPTZ,
  deleted_by                 UUID REFERENCES adm_provider_employees(id) ON DELETE SET NULL,
  deletion_reason            TEXT,
  CONSTRAINT bil_tenant_subscriptions_uniq_per_tenant UNIQUE (tenant_id) WHERE deleted_at IS NULL
);

-- Indexes
CREATE INDEX bil_tenant_subscriptions_tenant_status_idx ON bil_tenant_subscriptions (tenant_id, status) WHERE deleted_at IS NULL;
CREATE INDEX bil_tenant_subscriptions_period_idx ON bil_tenant_subscriptions (current_period_end) WHERE deleted_at IS NULL;
CREATE INDEX bil_tenant_subscriptions_provider_idx ON bil_tenant_subscriptions (provider, provider_subscription_id) WHERE deleted_at IS NULL;
```

Ce modèle cible reprend les champs actuels et ajoute des colonnes pour gérer la période d’essai, la facturation (mensuelle ou annuelle), le prestataire de paiement, le statut riche et le lien vers la méthode de paiement. L’index unique `(tenant_id)` garantit qu’un tenant ne possède qu’un seul abonnement actif à la fois, mais plusieurs versions peuvent exister via la colonne `deleted_at` ou des statuts `inactive`.

## 4. Impact sur les autres tables et services

- **`bil_billing_plans`** : l’ajout de `billing_cycle`, de quotas et de versions dans `bil_billing_plans` se répercute sur les abonnements. `plan_version` permet de savoir quelle version du plan est utilisée. Lors d’un changement de plan, `previous_plan_id` et `plan_version` sont mis à jour, et un événement est enregistré dans `adm_tenant_lifecycle_events`.

- **`bil_tenant_usage_metrics`** : la durée de la période (`current_period_start`/`current_period_end`) détermine les métriques à prendre en compte pour le calcul de l’overage. Les quotas inclus dans le plan doivent être comparés à ces métriques pour générer les lignes de facture.

- **`bil_tenant_invoices` et `bil_tenant_invoice_lines`** : les factures sont générées en fonction des abonnements actifs. La colonne `status` permet de savoir si l’abonnement doit être facturé (statuts `trialing` et `active`) ou suspendu (`past_due`, `suspended`). Les montants et la TVA sont calculés à partir du plan et des usages. Les champs `provider_*` facilitent la correspondance avec les factures du PSP.

- **`bil_payment_methods`** : l’ajout de `payment_method_id` établit un lien direct entre la souscription et le moyen de paiement utilisé. Si la méthode de paiement expire ou est inactive, le service peut choisir un autre moyen par défaut ou suspendre l’abonnement. La colonne `provider` doit correspondre au même PSP que la méthode de paiement.

- **`adm_tenant_lifecycle_events`** : chaque changement de statut (création, suspension, annulation, plan changé) doit être enregistré dans cette table. Les colonnes supplémentaires (`previous_plan_id`, `status`) simplifient la synchronisation entre les événements et les abonnements.

En mettant en œuvre ce modèle cible, Fleetcore disposera d’une structure robuste pour gérer les abonnements, compatible avec plusieurs prestataires de paiement et conforme à la spécification. Ces améliorations sont **additives** et peuvent être introduites progressivement sans perturber les données existantes.
