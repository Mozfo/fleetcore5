# Table `dir_car_models` – analyse et modèle cible

## Modèle existant (DDL Supabase)

La table `dir_car_models` stocke les modèles de véhicules disponibles pour l’ensemble de la plateforme Fleetcore. Elle possède les colonnes suivantes :

| Colonne            | Type          | Contraintes                                    | Description                                                                          |
| ------------------ | ------------- | ---------------------------------------------- | ------------------------------------------------------------------------------------ |
| `id`               | `uuid`        | clé primaire, générée par `uuid_generate_v4()` | Identifiant unique du modèle.                                                        |
| `tenant_id`        | `uuid`        | nullable, FK → `adm_tenants(id)`               | Permet de scoper un modèle à un tenant spécifique ; `NULL` indique un modèle global. |
| `make_id`          | `uuid`        | non null, FK → `dir_car_makes(id)`             | Marque associée au modèle.                                                           |
| `name`             | `text`        | non null                                       | Nom commercial du modèle.                                                            |
| `vehicle_class_id` | `uuid`        | nullable, FK → `dir_vehicle_classes(id)`       | Catégorie réglementaire/marketing (berline, SUV, van…).                              |
| `created_at`       | `timestamptz` | non null, défaut `CURRENT_TIMESTAMP`           | Date de création.                                                                    |
| `updated_at`       | `timestamptz` | non null, défaut `CURRENT_TIMESTAMP`           | Date de dernière mise à jour ; un trigger met automatiquement à jour ce champ.       |

Contraintes et index :

- Une clé primaire sur `id`.
- Des clés étrangères vers `dir_car_makes`, `adm_tenants` et `dir_vehicle_classes`.
- Une contrainte d’unicité partielle sur `(tenant_id, make_id, name)` pour empêcher les doublons d’un même modèle dans une marque pour un tenant donné.
- Plusieurs index accélèrent les recherches sur `tenant_id`, `make_id`, `vehicle_class_id`, `created_at` et `updated_at`.
- Aucun champ de suppression logique (`deleted_at`, `deleted_by`), pas de champs d’audit (`created_by`, `updated_by`) ni de colonne `status` ou `metadata` dans la définition SQL actuelle.

## Règles métiers et processus identifiés

Selon la spécification fonctionnelle, le module **Directory Management** gère les marques, modèles et classes de véhicules. Les règles métiers associées aux modèles de voiture sont :

1. **Référence partagée mais personnalisable** : par défaut, les modèles sont créés par la direction Fleetcore et sont partagés par tous les tenants (`tenant_id` =`NULL`). Toutefois, chaque client peut ajouter ses propres modèles ou surcharger les modèles existants en créant des enregistrements avec son `tenant_id`. L’index unique `(tenant_id, make_id, name)` empêche l’apparition de doublons【567670092230000†L32-L45】.
2. **Opérations CRUD avec contrôle des rôles** : les utilisateurs autorisés peuvent créer, modifier ou supprimer des modèles via le portail d’administration. Les permissions sont gérées par le système RBAC et filtrées par `tenant_id` via les politiques RLS.
3. **Classification réglementaire** : chaque modèle doit appartenir à une classe de véhicule (berline, SUV, van, limousine…) définie dans `dir_vehicle_classes` afin de respecter les réglementations locales (dimensions minimales, âge maximal). La spécification mentionne également la possibilité d’enregistrer des caractéristiques comme le type de carrosserie, le type de carburant, la capacité en passagers et des codes de classe VTC【567670092230000†L32-L45】.
4. **Consistance des nomenclatures** : la combinaison _make + model_ doit être unique pour un tenant. Les noms des modèles doivent être normalisés (capitalisation, suppression d’espaces superflus) pour éviter les doublons accidentels.
5. **Traçabilité et audit** : bien que le DDL actuel ne prévoie pas de champs `created_by`/`updated_by`, la plateforme possède un service d’audit (`adm_audit_logs`) qui enregistre chaque modification. L’identifiant du membre exécutant l’opération est stocké dans les logs avec l’entité `dir_car_models` et l’action (create/update/delete).

## Propositions d’amélioration

Pour répondre aux exigences de la spécification et harmoniser la table avec les autres entités, les améliorations suivantes sont proposées :

1. **Ajout de métadonnées et de statut** : ajouter un champ `status` (`enum` ou `varchar`, valeurs `active`, `inactive`, `deprecated`) pour permettre de désactiver un modèle sans le supprimer. Ajouter également un champ `metadata` (`jsonb`) afin de stocker des informations supplémentaires (ex. homologations, variantes locales).
2. **Audit et soft‑delete** : aligner la table avec les conventions générales en ajoutant `created_by`, `updated_by`, `deleted_at`, `deleted_by` et `deletion_reason`. Cela facilite le suivi des modifications et permet de masquer un modèle obsolète tout en conservant l’historique.
3. **Identifiant stable (`code`)** : introduire un champ `code` (type `varchar(50)`) unique par combinaison `(tenant_id, make_id)` pour référencer un modèle de manière stable dans le code (utile pour les imports, l’API ou l’intégration avec des services externes). Une version slugifiée du nom ou un code constructeur (par ex. « W176 » pour la Classe A chez Mercedes) peut être utilisé.
4. **Caractéristiques techniques** : pour refléter les besoins de la spécification (type de carrosserie, carburant, capacité), ajouter les champs :
   - `body_type` (`varchar(50)` ou FK vers `dir_body_types`) ;
   - `fuel_type` (`varchar(30)` ou FK vers `dir_fuel_types`) ;
   - `passenger_capacity` (`integer`) ;
   - `door_count` (`integer`) ;
   - `luggage_capacity` (`integer` ou `numeric`) ;
   - `transmission_type` (`varchar(30)`) et `drivetrain` (`varchar(30)`) ;
   - `regulatory_class_id` (FK vers une table `dir_regulatory_classes`) pour les codes VTC spécifiques.
     Ces champs peuvent être optionnels ou regroupés dans `metadata`. Ils permettent de filtrer les modèles lors de la création de véhicules et d’assurer la conformité réglementaire.
5. **Tables de référence** : créer des tables normalisées (`dir_body_types`, `dir_fuel_types`, `dir_transmission_types`, etc.) afin d’éviter les valeurs libres et de faciliter la traduction et l’internationalisation. Chaque table contiendrait un identifiant, un label et éventuellement des codes.
6. **Multiples classes** : si un modèle peut appartenir à plusieurs classes de véhicule (ex. un « Crossover » qui est à la fois SUV et berline selon les réglementations), envisager une table de liaison `dir_car_model_vehicle_classes` avec les colonnes `(model_id, class_id)` plutôt qu’un seul `vehicle_class_id`.
7. **RLS et accès** : s’assurer que la politique de Row Level Security filtre les lignes sur `tenant_id` tout en autorisant l’accès aux enregistrements globaux (`tenant_id` null) pour tous les tenants. Les membres Fleetcore (provider employees) doivent pouvoir voir tous les modèles.

## Modèle cible (DDL amélioré)

Voici un exemple de DDL qui intègre les améliorations proposées tout en restant compatible avec le modèle existant :

```sql
CREATE TABLE public.dir_car_models (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  tenant_id uuid NULL REFERENCES adm_tenants(id) ON UPDATE CASCADE ON DELETE CASCADE,
  make_id uuid NOT NULL REFERENCES dir_car_makes(id) ON UPDATE CASCADE ON DELETE CASCADE,
  code varchar(50) NOT NULL,
  name varchar(100) NOT NULL,
  vehicle_class_id uuid NULL REFERENCES dir_vehicle_classes(id) ON UPDATE CASCADE ON DELETE SET NULL,
  body_type varchar(50) NULL,
  fuel_type varchar(30) NULL,
  passenger_capacity integer NULL,
  door_count integer NULL,
  transmission_type varchar(30) NULL,
  drivetrain varchar(30) NULL,
  regulatory_class_id uuid NULL REFERENCES dir_regulatory_classes(id) ON UPDATE CASCADE ON DELETE SET NULL,
  status varchar(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive','deprecated')),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NULL REFERENCES adm_provider_employees(id) ON UPDATE CASCADE ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid NULL REFERENCES adm_provider_employees(id) ON UPDATE CASCADE ON DELETE SET NULL,
  deleted_at timestamptz NULL,
  deleted_by uuid NULL REFERENCES adm_provider_employees(id) ON UPDATE CASCADE ON DELETE SET NULL,
  deletion_reason text NULL,
  CONSTRAINT dir_car_models_tenant_make_code_uq UNIQUE (tenant_id, make_id, code) WHERE deleted_at IS NULL,
  CONSTRAINT dir_car_models_tenant_make_name_uq UNIQUE (tenant_id, make_id, name) WHERE deleted_at IS NULL,
  CONSTRAINT dir_car_models_passenger_capacity_check CHECK (passenger_capacity IS NULL OR passenger_capacity >= 0),
  CONSTRAINT dir_car_models_door_count_check CHECK (door_count IS NULL OR door_count > 0)
);

-- Indexes to optimise common queries
CREATE INDEX IF NOT EXISTS dir_car_models_tenant_id_idx            ON public.dir_car_models (tenant_id);
CREATE INDEX IF NOT EXISTS dir_car_models_make_id_idx              ON public.dir_car_models (make_id);
CREATE INDEX IF NOT EXISTS dir_car_models_code_idx                 ON public.dir_car_models (code);
CREATE INDEX IF NOT EXISTS dir_car_models_name_idx                 ON public.dir_car_models (name);
CREATE INDEX IF NOT EXISTS dir_car_models_vehicle_class_id_idx     ON public.dir_car_models (vehicle_class_id);
CREATE INDEX IF NOT EXISTS dir_car_models_regulatory_class_id_idx  ON public.dir_car_models (regulatory_class_id);
CREATE INDEX IF NOT EXISTS dir_car_models_status_idx               ON public.dir_car_models (status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS dir_car_models_deleted_at_idx           ON public.dir_car_models (deleted_at);
CREATE INDEX IF NOT EXISTS dir_car_models_created_by_idx           ON public.dir_car_models (created_by);
CREATE INDEX IF NOT EXISTS dir_car_models_updated_by_idx           ON public.dir_car_models (updated_by);
CREATE INDEX IF NOT EXISTS dir_car_models_code_name_gin            ON public.dir_car_models USING gin ((metadata));

-- Trigger to automatically update the updated_at timestamp
CREATE TRIGGER set_updated_at_dir_car_models BEFORE UPDATE ON dir_car_models
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
```

Ce modèle cible introduit des identifiants stables (`code`), des champs d’état, des métadonnées et des informations techniques. Il conserve la compatibilité avec l’existant en gardant `tenant_id`, `make_id` et `name`. Les champs facultatifs et les relations nouvelles (`regulatory_class_id`) permettent de s’adapter aux réglementations VTC et aux besoins de classement.

## Impact sur les autres tables et services

1. **`dir_car_makes`** : aucune modification structurelle n’est nécessaire. L’unicité `(tenant_id, make_id, code)` permet de référencer un modèle de façon stable sans perturber la relation `make_id` → `dir_car_makes(id)`.
2. **`dir_vehicle_classes` et nouvelles tables** : l’ajout de `body_type`, `fuel_type`, etc. nécessite de créer des tables de référence (`dir_body_types`, `dir_fuel_types`, `dir_transmission_types`, `dir_regulatory_classes`). Chaque table doit comporter un identifiant, un libellé et éventuellement un alias pour simplifier la traduction.
3. **`flt_vehicles`** : les véhicules référencent `dir_car_models`. L’ajout de champs techniques (nombre de portes, capacité, etc.) permet de préremplir certaines informations lors de l’enregistrement d’un véhicule et d’automatiser les contrôles (ex. correspondance classe/age). Les colonnes `vehicle_class_id` et `regulatory_class_id` peuvent être utilisées pour valider l’éligibilité d’un véhicule vis‑à‑vis des plateformes VTC.
4. **Imports et intégrations externes** : le champ `code` facilite l’importation de catalogues de véhicules ou l’intégration avec des API tierces (constructeurs, plateformes) en évitant les collisions sur le nom. L’ajout de `status` et de `deleted_at` permet de gérer des versions et de marquer des modèles comme obsolètes.
5. **RLS et permissions** : la présence de champs supplémentaires ne change pas les règles d’isolement multi‑tenant. Les politiques RLS doivent être mises à jour pour filtrer sur `tenant_id` et permettre l’accès aux modèles globaux (`tenant_id` est `NULL`). Les colonnes d’audit doivent rester visibles uniquement pour les rôles habilités.
6. **Services métier** : les services de gestion des répertoires devront être ajustés pour accepter les nouveaux champs (`code`, `body_type`, etc.), valider les valeurs et gérer les états (`status`). Lorsqu’un modèle passe à `inactive` ou `deprecated`, il faudra empêcher la création de nouveaux véhicules de ce modèle ou avertir l’utilisateur.

En conclusion, la table `dir_car_models` actuelle fournit une base simple pour stocker les modèles de véhicules. L’intégration des améliorations proposées permettra d’aligner la structure sur la spécification fonctionnelle (classification par type de véhicule, carburant, capacité, classes réglementaires), de renforcer la traçabilité et de préparer l’extension future vers des catalogues plus riches et des intégrations externes, tout en préservant l’isolement multi‑tenant et la compatibilité avec les données existantes.
