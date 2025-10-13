# Analyse de la table `dir_car_makes`

Cette fiche adopte la structure d’analyse utilisée pour les autres tables : présentation du **modèle existant**, identification des **règles métiers**, formulation de **propositions d’amélioration** et présentation d’un **modèle cible** enrichi, ainsi qu’une discussion des impacts potentiels sur le reste du data‑model. La table `dir_car_makes` fait partie du domaine « Directory » et recense les constructeurs de véhicules (Toyota, Renault, Tesla, etc.). Elle peut contenir des entrées **globales** (communes à tous les tenants) ou **spécifiques** à un tenant.

## 1. Modèle actuel (DDL Supabase)

Le DDL fourni définit `dir_car_makes` de la manière suivante :

| Champ          | Type          | Contraintes/Validation                                                                       | Observations                                                                                                        |
| -------------- | ------------- | -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| **id**         | `uuid`        | Clé primaire générée par `uuid_generate_v4()`                                                | Identifiant unique du constructeur.                                                                                 |
| **tenant_id**  | `uuid`        | Nullable ; FK vers `adm_tenants(id)` (cascade)                                               | Si `NULL`, la marque est **globale** (visible pour tous les tenants). Sinon, elle est spécifique au tenant indiqué. |
| **name**       | `text`        | **Non nul**                                                                                  | Nom du constructeur (ex. "Toyota").                                                                                 |
| **created_at** | `timestamptz` | Non nul ; défaut `CURRENT_TIMESTAMP`                                                         | Date de création.                                                                                                   |
| **updated_at** | `timestamptz` | Non nul ; défaut `CURRENT_TIMESTAMP` ; mis à jour via trigger `set_updated_at_dir_car_makes` | Date de mise à jour.                                                                                                |

Indexation :

- **Index btree** sur `tenant_id` pour filtrer rapidement par tenant.
- **Index unique partiel** `(tenant_id, name) WHERE deleted_at IS NULL` (dans le DDL actuel, il est défini sans condition de soft delete) pour éviter d’avoir deux constructeurs avec le même nom dans un même tenant. Les marques globales (`tenant_id IS NULL`) sont donc uniques parmi elles.
- Indexes sur `created_at` et `updated_at` pour les tris chronologiques.

### Observations

- **Pas de soft delete** : le DDL ne prévoit pas de colonnes `deleted_at`, `deleted_by` ou `deletion_reason`. Une marque supprimée le serait donc définitivement, ce qui peut entraîner des pertes d’historique.
- **Pas de traçabilité** : aucune colonne `created_by` ou `updated_by` n’indique quel utilisateur a créé ou modifié la marque. L’audit log central (`adm_audit_logs`) peut compenser cette absence, mais il est conseillé d’avoir un minimum de métadonnées directement sur la table.
- **Pas de métadonnées** : il n’y a ni champ `metadata` ni `status`. On ne peut pas préciser l’origine du constructeur (pays, groupe industriel), ni le marquer comme inactif sans le supprimer.
- **Nom libre** : le champ `name` est un texte libre, sans normalisation ni slug. Deux tenants peuvent créer des marques identiques mais orthographiées différemment (ex. "Mercedes-Benz" vs "Mercedes Benz"), ce qui peut compliquer la recherche et la déduplication.

## 2. Règles métiers et processus déduits

Le domaine Directory sert à centraliser des **listes de référence** utilisées dans d’autres modules (flottes, véhicules, réglementations, plateformes). Voici les règles métier que l’on peut déduire pour `dir_car_makes` :

1. **Entrées globales vs spécifiques** : selon le modèle de données, une marque peut être globale (accessible à tous les clients) si `tenant_id IS NULL`, ou spécifique à un tenant. Les marques globales sont généralement créées et gérées par l’équipe Fleetcore (ou via un import initial). Les marques spécifiques permettent à un tenant d’ajouter une marque locale si elle n’existe pas globalement.
2. **Unicité par scope** : le couple `(tenant_id, name)` doit être unique pour éviter les doublons. Pour les marques globales, on vérifie que `tenant_id` est `NULL` et que `name` n’existe pas déjà parmi les autres marques globales.
3. **Utilisation par les véhicules** : les tables `dir_car_models` et `flt_vehicles` référencent `dir_car_makes` via une FK `make_id`. On ne peut pas supprimer une marque si des modèles ou véhicules y sont liés, sauf en cascade ou en la marquant inactif.
4. **Permissions** : les utilisateurs internes (provider employees) peuvent créer/mettre à jour les marques globales. Les administrateurs de tenants peuvent créer des marques spécifiques pour leur propre organisation, mais ne peuvent pas modifier ni supprimer les marques globales. Les politiques RLS doivent donc permettre `tenant_id IS NULL OR tenant_id = current_tenant_id` pour la lecture et l’écriture.
5. **Import et maintenance** : il peut être nécessaire de synchroniser la liste des marques avec une source externe (catalogue constructeur, classification ISO). Les mises à jour doivent être propagées aux tenants (par exemple, changement de nom ou fusion de marques).

## 3. Propositions d’amélioration et modèle cible

### 3.1 Améliorations de la structure

1. **Ajouter des champs d’audit et de soft delete** : inclure `created_by`, `updated_by`, `deleted_at`, `deleted_by` et `deletion_reason` pour savoir qui a créé/modifié/supprimé une marque et permettre une suppression logique plutôt qu’un effacement physique.
2. **Introduire un champ `status`** : utiliser un type `ENUM` (`active`, `inactive`, `deprecated`) pour indiquer si une marque est toujours utilisée. Une marque `deprecated` pourrait être gardée pour l’historique mais non proposée lors de nouvelles saisies.
3. **Ajouter un `slug` ou `code`** : créer un identifiant court et unique (ex. "TOYOTA"), utilisé en interne pour référencer la marque de façon stable même si le nom change.
4. **Décrire l’origine de la marque** : ajouter des colonnes `country_of_origin` (`char(2)`), `parent_company` (`text`), `founded_year` (`integer`), `logo_url` (`text`) et un champ `metadata` (`jsonb`) pour stocker des informations supplémentaires (notes, liens vers le site officiel). Ces informations peuvent être affichées dans l’interface pour enrichir la base de connaissances.
5. **Normaliser le nom** : ajouter une contrainte ou un trigger qui met en forme le nom (capitalisation, suppression des espaces superflus) afin d’éviter les doublons typographiques.
6. **Créer une table de marques globales** : si l’on souhaite distinguer clairement les marques gérées par Fleetcore de celles créées par les tenants, on peut séparer la table en `dir_car_makes` (globales) et `tenant_car_makes` (spécifiques), ou ajouter un champ booléen `is_global` pour plus de lisibilité.
7. **Maintenir un index unique partiel** : conserver l’index `(tenant_id, name) WHERE deleted_at IS NULL`, afin de gérer les doublons en tenant compte du soft delete.

### 3.2 Modèle cible proposé

Le DDL ci-dessous illustre une version enrichie de `dir_car_makes` tenant compte des améliorations ci‑dessus :

```sql
CREATE TYPE dir_car_make_status AS ENUM ('active','inactive','deprecated');

CREATE TABLE dir_car_makes (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id         UUID REFERENCES adm_tenants(id) ON DELETE CASCADE,
  code              VARCHAR(50) NOT NULL,                   -- identifiant court, unique par scope
  name              VARCHAR(100) NOT NULL,
  country_of_origin CHAR(2),
  parent_company    VARCHAR(100),
  founded_year      INTEGER CHECK (founded_year >= 1800),
  logo_url          TEXT,
  status            dir_car_make_status NOT NULL DEFAULT 'active',
  metadata          JSONB NOT NULL DEFAULT '{}',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by        UUID REFERENCES adm_provider_employees(id) ON DELETE SET NULL,
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by        UUID REFERENCES adm_provider_employees(id) ON DELETE SET NULL,
  deleted_at        TIMESTAMPTZ,
  deleted_by        UUID REFERENCES adm_provider_employees(id) ON DELETE SET NULL,
  deletion_reason   TEXT,
  CONSTRAINT dir_car_makes_scope_code_unq UNIQUE (tenant_id, code) WHERE deleted_at IS NULL,
  CONSTRAINT dir_car_makes_scope_name_unq UNIQUE (tenant_id, name) WHERE deleted_at IS NULL
);

-- Indexes supplémentaires pour la recherche et le tri
CREATE INDEX dir_car_makes_status_idx  ON dir_car_makes (status) WHERE deleted_at IS NULL;
CREATE INDEX dir_car_makes_country_idx ON dir_car_makes (country_of_origin) WHERE deleted_at IS NULL;
CREATE INDEX dir_car_makes_created_idx ON dir_car_makes (created_at) WHERE deleted_at IS NULL;

```

Ce schéma enrichi permet de mieux gérer l’évolution des marques : il introduit des informations contextuelles, des codes uniques, des statuts et le support du soft delete. Les champs `created_by` et `updated_by` renforcent la traçabilité. Le couple `(tenant_id, code)` et `(tenant_id, name)` est unique tant que la marque n’est pas supprimée logiquement.

## 4. Impact sur les autres tables et services

1. **`dir_car_models`** : cette table référence `dir_car_makes` via `make_id`. L’ajout de colonnes dans `dir_car_makes` n’a pas d’impact direct, mais si l’on sépare les marques globales et spécifiques ou si l’on ajoute un `code`, il faudra ajuster l’interface de saisie des modèles pour sélectionner la marque via son code ou son nom unique dans le scope.
2. **`flt_vehicles`** : chaque véhicule a un champ `make_id` et `model_id`. Les modifications proposées n’impliquent pas de changement de type pour ces colonnes, mais il convient d’ajouter des contrôles à l’interface pour éviter d’associer un véhicule à une marque inactive ou obsolète. L’ajout d’un champ `status` permet de filtrer les marques proposées lors de la création d’un véhicule.
3. **RLS et droits d’accès** : l’introduction de champs `created_by` et `updated_by` n’affecte pas les règles RLS existantes. En revanche, l’ajout d’une séparation explicite entre marques globales et spécifiques pourrait amener à revoir les politiques : les marques globales devraient être visibles pour tous, mais modifiables seulement par les employés Fleetcore.
4. **Import et synchronisation** : si l’on enrichit `dir_car_makes` avec des informations telles que la date de fondation et le pays d’origine, il faudra prévoir un processus d’import ou de mise à jour automatique depuis des sources externes (ex. base mondiale des constructeurs). Les modifications devront être propagées aux tables qui consomment ces données (rapports, interfaces).
5. **Compatibilité ascendante** : les nouvelles colonnes sont facultatives et ajoutées en fin de table. L’évolution est donc compatible avec les données existantes ; seules les colonnes de type `ENUM` nécessiteront de définir une valeur par défaut (`active`). Les codes (`code`) devront être générés pour les marques existantes (par script de migration) afin de respecter la contrainte d’unicité.

En conclusion, la table `dir_car_makes` dans sa forme actuelle assure la base minimaliste pour stocker les marques, mais elle manque de métadonnées et de mécanismes d’audit et de suppression logique. Les améliorations proposées renforcent la qualité des données, facilitent la gestion multi‑tenant et préparent une éventuelle intégration avec des sources externes ou des fonctionnalités avancées (recherche enrichie, filtres par pays, gestion du cycle de vie des constructeurs).
