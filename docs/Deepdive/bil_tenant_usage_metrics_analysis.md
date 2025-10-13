# Analyse de la table `bil_tenant_usage_metrics`

Cette analyse suit le modèle adopté pour les autres tables (modèle existant, règles métier, améliorations et modèle cible). Elle concerne la table **`bil_tenant_usage_metrics`**, qui sert à consigner les indicateurs d’usage des clients en vue de la facturation et des rapports. Les informations proviennent du DDL Supabase, de la spécification fonctionnelle et du code fourni.

## 1. Modèle Supabase existant

Le DDL définit la table `bil_tenant_usage_metrics` avec les colonnes suivantes :

| Champ                                          | Type                  | Contraintes/Validation                                          | Observations                                                                                                                  |
| ---------------------------------------------- | --------------------- | --------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| **id**                                         | `uuid`                | Clé primaire générée par `uuid_generate_v4()`                   | Identifiant immuable de l’enregistrement.                                                                                     |
| **tenant_id**                                  | `uuid`                | **Non nul**, FK vers `adm_tenants(id)` avec `ON DELETE CASCADE` | Assure l’isolement multi‑tenant.                                                                                              |
| **metric_name**                                | `varchar(50)`         | **Non nul**                                                     | Nom de la métrique mesurée (par ex. `active_vehicles`, `active_drivers`, `total_trips`). Le DDL ne restreint pas les valeurs. |
| **metric_value**                               | `numeric(18,2)`       | **Non nul**, `CHECK (metric_value >= 0)`                        | Valeur de la métrique. La granularité décimale permet de stocker des unités comme des kilomètres ou des coûts.                |
| **period_start**                               | `date`                | **Non nul**                                                     | Premier jour de la période de mesure.                                                                                         |
| **period_end**                                 | `date`                | **Non nul**, `CHECK (period_end >= period_start)`               | Dernier jour de la période.                                                                                                   |
| **metadata**                                   | `jsonb`               | **Non nul**, par défaut `{}`                                    | Stocke des informations supplémentaires, comme l’unité de mesure, le mode d’agrégation (somme, moyenne) ou la source.         |
| **created_at**, **updated_at**                 | `timestamptz`         | **Non nuls**, par défaut `now()`                                | Horodatage de création et de modification, mis à jour via un trigger.                                                         |
| **created_by**, **updated_by**, **deleted_by** | `uuid`                | Références vers `adm_provider_employees(id)`                    | Traçabilité des opérations internes.                                                                                          |
| **deleted_at**, **deletion_reason**            | `timestamptz`, `text` | Optionnels                                                      | Permettent la suppression logique (soft delete).                                                                              |

Une contrainte d’unicité partielle `(tenant_id, metric_name, period_start) WHERE deleted_at IS NULL` garantit qu’une seule valeur est enregistrée pour une métrique donnée sur un tenant et une période de début donnée. Des index supplémentaires sur `tenant_id`, `metric_name`, `period_start` et `period_end` améliorent les requêtes analytiques. La table est conçue pour enregistrer **un enregistrement par combinaison tenant/métrique/période** plutôt que de stocker toutes les métriques de manière horizontale.

## 2. Règles métier et processus déduits

La spécification et le code exposent plusieurs contraintes et usages de cette table :

1. **Traçage des usages** : La spécification indique que la plateforme enregistre les métriques **par période** : nombre de conducteurs, véhicules, trajets, appels d’API, stockage utilisé et tickets support【535592711015414†L482-L505】. Ces données servent à la facturation (calcul des dépassements) et à la production de rapports.

2. **Agrégation quotidienne** : Le service `UsageMetricsService.aggregateDailyMetrics` compte chaque jour les véhicules actifs, les conducteurs actifs et les trajets, et somme le revenu généré. Il crée ensuite un enregistrement par tenant dans la table `bil_tenant_usage_metrics` avec des colonnes comme `active_vehicles`, `active_drivers`, `total_trips`, `total_revenue`, `storage_used_mb` et `api_calls`【617274102437098†L149-L167】. Cette implémentation diffère du DDL actuel : elle utilise des colonnes dédiées pour chaque métrique plutôt que des lignes par `metric_name`.

3. **Couverture de la période** : Les métriques doivent couvrir toute la période de facturation (souvent mensuelle). Dans le DDL, `period_start` et `period_end` sont des dates, mais le code de calcul fonctionne à la journée (`metric_date`). L’intervalle de collecte doit donc être aligné (jours, semaines, mois) et les règles d’agrégation (somme, moyenne) doivent être cohérentes.

4. **Validation** : Les valeurs doivent être non négatives (`metric_value >= 0`) et la date de fin doit être postérieure ou égale à la date de début. Aucune vérification n’est faite sur `metric_name`, ce qui peut entraîner des fautes de frappe ou des incohérences.

5. **Usage dans la facturation** : Les métriques d’usage sont comparées aux quotas inclus dans le plan pour calculer les dépassements et générer les lignes de facture. Un changement de plan ou de version influe sur les quotas et sur la manière dont les métriques sont agrégées et facturées.

## 3. Propositions d’amélioration et modèle cible

Afin de concilier la flexibilité du DDL existant avec les besoins réels (métriques multiples, agrégation quotidienne/mensuelle, quotas par plan), les améliorations suivantes sont suggérées. Elles sont **additives** et n’exigent pas la suppression des données actuelles :

1. **Normaliser les noms de métriques** : Créer une table de référence `bil_usage_metric_types` définissant les valeurs autorisées (`active_vehicles`, `active_drivers`, `total_trips`, `total_revenue`, `storage_used_mb`, `api_calls`, `support_tickets`, etc.). Ajouter une colonne `metric_unit` (`varchar(20)`) ou l’inclure dans cette table pour préciser l’unité (count, AED, MB). La contrainte `CHECK` actuelle pourrait être remplacée par une clé étrangère vers cette table.

2. **Ajouter un type de période** : Introduire une colonne `period_type` (`varchar(10)`) pour distinguer l’agrégation **daily**, **weekly** ou **monthly**. Cela simplifie les requêtes et permet de combiner plusieurs périodes dans la même table. Le code actuel agrège quotidiennement et pourrait renseigner `period_type = 'day'`【617274102437098†L149-L167】.

3. **Utiliser `timestamptz` au lieu de `date`** : Pour stocker les périodes de façon précise (zones horaires, périodes de facturation partielle), remplacer `period_start` et `period_end` par `period_start_ts` et `period_end_ts` (`timestamptz`).

4. **Enregistrer les métriques sous forme pivot ou sous forme de table colonnes dédiées** :
   - **Option A (pivot)** : conserver la structure actuelle (clé/valeur) mais ajouter `metric_unit`, `period_type` et une FK vers `bil_usage_metric_types`. Cette option reste flexible et extensible pour ajouter de nouvelles métriques sans modifier le schéma.
   - **Option B (colonnes dédiées)** : pour les métriques principales (véhicules, chauffeurs, trajets, revenus, stockage, API calls, tickets support), créer une table `bil_tenant_usage_daily` avec une colonne pour chaque métrique (comme dans l’implémentation de `UsageMetricsService`). Cette option améliore la lisibilité et la performance des requêtes, mais nécessite de mettre à jour le schéma lors de l’ajout de nouvelles métriques.

5. **Aligner sur le plan et la période de facturation** : Ajouter un champ `plan_id` ou `subscription_id` pour associer les métriques à la version du plan en vigueur durant la période (utile pour appliquer les quotas). Ajouter également `metric_source` (`varchar(20)`) pour préciser l’origine (interne, API externe, calcul automatique, import).

6. **Modèle cible proposé (option A – pivot)** :

```sql
CREATE TABLE bil_tenant_usage_metrics (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id            UUID NOT NULL REFERENCES adm_tenants(id) ON DELETE CASCADE,
  metric_type_id       UUID NOT NULL REFERENCES bil_usage_metric_types(id),
  metric_value         NUMERIC(20,4) NOT NULL CHECK (metric_value >= 0),
  period_type          VARCHAR(10) NOT NULL CHECK (period_type IN ('day','week','month')),
  period_start_ts      TIMESTAMPTZ NOT NULL,
  period_end_ts        TIMESTAMPTZ NOT NULL CHECK (period_end_ts >= period_start_ts),
  plan_version         INTEGER,
  subscription_id      UUID REFERENCES bil_tenant_subscriptions(id),
  metric_source        VARCHAR(20),
  metadata             JSONB NOT NULL DEFAULT '{}',
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by           UUID REFERENCES adm_provider_employees(id) ON DELETE SET NULL,
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by           UUID REFERENCES adm_provider_employees(id) ON DELETE SET NULL,
  deleted_at           TIMESTAMPTZ,
  deleted_by           UUID REFERENCES adm_provider_employees(id) ON DELETE SET NULL,
  deletion_reason      TEXT,
  CONSTRAINT bil_tenant_usage_metrics_unq UNIQUE (tenant_id, metric_type_id, period_type, period_start_ts) WHERE deleted_at IS NULL
);

-- Table de référence pour les types de métriques
CREATE TABLE bil_usage_metric_types (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        VARCHAR(50) UNIQUE NOT NULL,
  unit        VARCHAR(20) NOT NULL,
  description TEXT
);

-- Indexes
CREATE INDEX bil_tenant_usage_metrics_tenant_period_idx ON bil_tenant_usage_metrics (tenant_id, period_type, period_start_ts) WHERE deleted_at IS NULL;
CREATE INDEX bil_tenant_usage_metrics_metric_idx ON bil_tenant_usage_metrics (metric_type_id) WHERE deleted_at IS NULL;
```

Cette structure pivotée ajoute des champs pour la période, l’unité et la source, et centralise la liste des métriques. Elle reste extensible et permet d’associer chaque enregistrement à un abonnement via `subscription_id` ou un `plan_version`. La granularité horaire est gérée avec `timestamptz`.

## 4. Impact sur les autres tables et services

- **Facturation (`bil_tenant_invoice_lines`)** : Le calcul des dépassements devra parcourir la table des métriques en fonction du `plan_version` et des quotas définis dans `bil_billing_plans`. Les métriques pour des périodes partielles (p. ex. un changement de plan) peuvent être calculées à l’aide de `period_type`, `period_start_ts` et `period_end_ts`.

- **Abonnements (`bil_tenant_subscriptions`)** : L’ajout du champ `subscription_id` dans la table de métriques permet de lier directement les usages à l’abonnement actif. Cela simplifie la facturation et l’analyse des dépassements.

- **Plans (`bil_billing_plans`)** : L’introduction de quotas (comme `max_vehicles`, `max_drivers`, etc.) nécessite de comparer la somme des métriques correspondantes (`active_vehicles`, `active_drivers`) sur la période à ces seuils. Cette comparaison peut se faire via une vue ou un service.

- **Services et agrégations** : Le service `UsageMetricsService` devra être ajusté selon l’option choisie : soit insérer des lignes pivotées (`metric_type_id`, `metric_value`) pour chaque métrique, soit remplir une table à colonnes dédiées. Les fonctions d’agrégation (sum, max, average) doivent être définies pour chaque `metric_type` afin de calculer les quotas et les rapports.

En adoptant ces améliorations, Fleetcore gagnerait en flexibilité et en cohérence : la table des métriques pourrait évoluer avec de nouveaux indicateurs sans altérer la structure, et elle s’intégrerait plus naturellement avec les plans et abonnements. Les modifications sont conçues pour être **compatibles** avec les données existantes en ajoutant de nouvelles colonnes ou tables de référence plutôt qu’en supprimant des champs.
