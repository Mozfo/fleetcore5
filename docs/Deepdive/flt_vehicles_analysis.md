# Analyse de la table `flt_vehicles`

Cette note fournit une analyse complète de la table **`flt_vehicles`**, qui centralise l’ensemble des véhicules gérés par une flotte dans Fleetcore. L’objectif est d’offrir une source unique de vérité sur le schéma actuel (Supabase), de décrire les règles métiers identifiées dans la spécification fonctionnelle et le code, et de proposer des améliorations pour répondre aux exigences multi‑pays et multi‑locataires. Les suggestions sont séparées du modèle existant afin de maintenir la clarté.

## 1. Champs à valider (modèle actuel)

La table `flt_vehicles` est définie avec les colonnes suivantes :

| Champ                                    | Description/Type       | Contraintes et validations                                                                                                                                                                   |
| ---------------------------------------- | ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **id**                                   | `uuid` (PK)            | Généré par `uuid_generate_v4()`, non nul.                                                                                                                                                    |
| **tenant_id**                            | `uuid`                 | Référence obligatoire vers `adm_tenants(id)`. Permet l’isolement multi‑tenant via RLS.                                                                                                       |
| **make_id**                              | `uuid`                 | FK vers `dir_car_makes(id)`. Doit exister ; suppression restreinte.                                                                                                                          |
| **model_id**                             | `uuid`                 | FK vers `dir_car_models(id)`. Doit exister ; suppression restreinte.                                                                                                                         |
| **license_plate**                        | `text`                 | Matricule du véhicule, obligatoire ; unique dans un même tenant (index partiel).                                                                                                             |
| **vin**                                  | `text`                 | Numéro de série du véhicule, optionnel ; unique par tenant si renseigné (index partiel).                                                                                                     |
| **year**                                 | `integer`              | Année de fabrication ; doit être réaliste (contrôle logique non imposé dans le DDL).                                                                                                         |
| **color**                                | `text`                 | Couleur facultative.                                                                                                                                                                         |
| **seats**                                | `integer`              | Nombre de sièges ; par défaut 4, doit être ≥ 1.                                                                                                                                              |
| **vehicle_class**                        | `text`                 | Classe de véhicule (libre) ; devrait référencer `dir_vehicle_classes`.                                                                                                                       |
| **fuel_type**                            | `text`                 | Type de carburant (libre).                                                                                                                                                                   |
| **transmission**                         | `text`                 | Type de boîte (libre).                                                                                                                                                                       |
| **registration_date**                    | `date`                 | Date d’immatriculation ; utilisée pour calculer l’âge et la conformité.                                                                                                                      |
| **insurance_number**                     | `text`                 | Numéro de police d’assurance ; facultatif.                                                                                                                                                   |
| **insurance_expiry**                     | `date`                 | Date d’expiration de l’assurance ; utilisée pour déclencher des alertes.                                                                                                                     |
| **last_inspection**                      | `date`                 | Date de la dernière visite technique (MOT/RTA).                                                                                                                                              |
| **next_inspection**                      | `date`                 | Date prévue de la prochaine inspection ; triggers possibles pour alertes.                                                                                                                    |
| **odometer**                             | `integer`              | Kilométrage actuel ; mise à jour régulière.                                                                                                                                                  |
| **ownership_type**                       | `text`                 | Indique `owned`, `leased`, `investor`. Doit être contrôlé par une énumération.                                                                                                               |
| **metadata**                             | `jsonb`                | Métadonnées supplémentaires (par défaut `{}`), pour stocker des informations spécifiques.                                                                                                    |
| **status**                               | `text`                 | Statut du véhicule ; valeur initiale `pending`. Aucun check n’est défini, mais le code utilise des statuts comme `active`, `inactive`, `maintenance`, `scrapped`【567670092230000†L56-L84】. |
| **created_at / updated_at**              | `timestamptz`          | Horodatage automatique.                                                                                                                                                                      |
| **created_by / updated_by / deleted_by** | `uuid`                 | Identifie l’utilisateur ayant créé/modifié/supprimé la ligne ; FK vers `adm_members(id)` ; `ON DELETE SET NULL`.                                                                             |
| **deleted_at / deletion_reason**         | `timestamptz` / `text` | Soft delete et raison.                                                                                                                                                                       |

Des index assurent l’unicité de la plaque et du VIN par tenant, et facilitent les recherches par statut, marque, modèle, dates d’inspection et métadonnées. Le trigger `set_updated_at_flt_vehicles` met à jour `updated_at` à chaque modification.

## 2. Règles métiers et processus existants

La spécification fonctionnelle décrit en détail la gestion des véhicules. Les principales règles sont :

1. **Enregistrement complet des véhicules** : chaque véhicule doit contenir des informations d’identification (marque, modèle, année, plaque, VIN, couleur, nombre de sièges, type de carrosserie), des données administratives (certificats d’immatriculation, assurances, inspections), des informations d’assurance (numéro de police, compagnie, couverture, montant et date d’expiration) et des informations de propriété/financement【567670092230000†L56-L84】. Ces éléments permettent d’assurer la conformité réglementaire et de planifier l’entretien.

2. **Alertes de validité** : pour les documents importants (immatriculation, assurance, inspection), le système déclenche des alertes 30 jours avant expiration【567670092230000†L74-L79】. Les véhicules dont les documents sont expirés ou qui dépassent l’âge maximal imposé par le pays (stocké dans `dir_country_regulations.vehicle_max_age`) sont automatiquement marqués `inactive`【567670092230000†L56-L84】. Ces règles sont généralement appliquées via des jobs planifiés et des triggers dans l’API.

3. **Suivi de l’état en temps réel** : Fleetcore poll chaque plateforme pour mettre à jour le statut en temps réel (online, offline, occupé) par plateforme【567670092230000†L127-L146】. Ce statut opérationnel est distinct du statut administratif (`active`, `inactive`, `maintenance`, `scrapped`) et est généralement stocké dans une table séparée ou un cache, mais impacte les dispatchs et les plannings.

4. **Planification et maintenance** : un planificateur affiche les maintenances régulières (par kilométrage ou périodicité) et les inspections, ainsi que les affectations de chauffeurs【567670092230000†L153-L178】. Une période d’entretien bloque l’affectation du véhicule. L’outil détecte les conflits entre maintenance, shifts et documents expirés.

5. **Processus de transfert de véhicule (handover)** : lors d’un changement de conducteur, le système vérifie la disponibilité du véhicule et la validité des documents, capture des photos de l’état du véhicule, enregistre le kilométrage, le niveau de carburant et les dommages, puis finalise la remise【567670092230000†L153-L178】. Ces informations doivent être enregistrées pour des raisons d’assurance et de responsabilité.

6. **Intégration avec d’autres modules** : les véhicules sont liés à des voyages (trips), à des affectations (`vehicle_assignments`) et aux finances (tous les coûts et revenus associés). Les rapports consolident l’ensemble des données (trips, revenus, dépenses) par véhicule【567670092230000†L90-L118】.

## 3. Propositions d’amélioration

Pour répondre aux exigences multi‑pays et multi‑tenants tout en gardant un modèle flexible, les améliorations suivantes sont proposées :

1. **Énumérations et tables de référence** : remplacer les champs libres (`vehicle_class`, `fuel_type`, `transmission`, `ownership_type`, `status`) par des types ENUM ou des tables de référence (`dir_vehicle_classes`, `dir_fuel_types`, `dir_transmissions`, `dir_ownership_types`, `dir_vehicle_statuses`). Cela évite les incohérences et permet d’ajouter des propriétés (par exemple, la description d’une classe de véhicule, l’énergie, la puissance, etc.).

2. **Ajout de champs d’assurance et de propriété** : ajouter `insurance_provider`, `insurance_coverage_type`, `insurance_amount`, `insurance_issue_date` et `insurance_document_id` (FK vers `doc_documents`) pour suivre précisément l’assurance. Ajouter `owner_type` et `owner_id` pour lier le véhicule à un propriétaire (tenant, investisseur, leasing) et `acquisition_date`, `contract_reference`, `lease_end_date`, `residual_value` pour les véhicules loués/financés.

3. **Informations techniques et réglementaires** : ajouter `body_type`, `passenger_capacity`, `car_length_cm`, `car_width_cm`, `car_height_cm` afin de vérifier la conformité avec les réglementations locales et la classification en classe (berline, SUV, van). Ces dimensions peuvent être référencées depuis `dir_vehicle_classes` ou stockées ici pour les véhicules importés.

4. **Suivi précis des dates et des kilométrages** : remplacer `last_inspection` et `next_inspection` par un historique d’inspections dans une table `flt_vehicle_inspections` contenant `inspection_date`, `odometer`, `result`, `next_due_date` et `document_id` (FK). Ajouter `first_registration_date`, `warranty_expiry`, `service_interval_km` et `next_service_at_km` pour gérer la maintenance prédictive.

5. **Statut enrichi et workflow** : définir un type `vehicle_status` avec des valeurs telles que `pending`, `active`, `inactive`, `maintenance`, `scrapped`, `reserved`, `decommissioned`. Associer des dates de changement de statut (`status_changed_at`) et des raisons. Le passage d’un état à l’autre doit déclencher des validations (ex. ne pas activer un véhicule sans assurance valide).

6. **Gestion des équipements et accessoires** : créer une table `flt_vehicle_equipments` (id, vehicle_id, equipment_type, serial_number, issue_date, expiry_date, notes) pour suivre les équipements fournis (téléphone, dashcam, kit enfants, etc.)【567670092230000†L80-L83】. Cela permet d’émettre des alertes lorsque les équipements doivent être remplacés ou retournés.

7. **Conformité multi‑pays et plug‑and‑play** : inclure une référence au `country_code` du véhicule si elle diffère du tenant (ex. véhicule opéré dans un autre pays). Les règles (âge maximal, classe minimale, documents requis) seront consultées dans `dir_country_regulations`. Prévoir des colonnes `requires_professional_license` et `documents_status` (JSON) pour valider la complétude des pièces en fonction du pays, et faciliter l’ajout de nouveaux pays sans modifier le schéma.

8. **Audit et sécurité** : ajouter `created_by`, `updated_by`, `deleted_by` (déjà présents), mais renforcer l’audit via `adm_audit_logs` en enregistrant chaque changement de statut, d’assurance, de propriétaire ou d’équipement. Mettre en place des politiques RLS pour que chaque tenant ne voie que ses véhicules et interdire la modification des véhicules d’autres organisations.

## 4. Modèle cible proposé

Le modèle cible ci‑dessous intègre ces améliorations tout en conservant les champs essentiels du modèle actuel. Il ajoute des tables de référence pour les types et statuts, une table d’équipements et une table d’inspections pour historiser les maintenances.

```sql
-- Référentiels des types
CREATE TABLE dir_ownership_types (
  code varchar(20) PRIMARY KEY,
  description text NOT NULL
);

INSERT INTO dir_ownership_types (code, description) VALUES
  ('fleet',    'Véhicule appartenant à la flotte'),
  ('leased',   'Véhicule loué auprès d’un bailleur'),
  ('investor', 'Véhicule financé par un investisseur');

CREATE TABLE dir_vehicle_statuses (
  code varchar(20) PRIMARY KEY,
  description text NOT NULL
);

INSERT INTO dir_vehicle_statuses (code, description) VALUES
  ('pending', 'En attente d’activation'),
  ('active', 'Actif et disponible'),
  ('inactive', 'Inactif (documents expirés, suspendu)'),
  ('maintenance', 'En maintenance'),
  ('scrapped', 'Mis au rebut'),
  ('decommissioned', 'Désaffecté');

CREATE TABLE flt_vehicles (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id uuid NOT NULL REFERENCES adm_tenants(id) ON DELETE CASCADE,
  make_id uuid NOT NULL REFERENCES dir_car_makes(id) ON DELETE RESTRICT,
  model_id uuid NOT NULL REFERENCES dir_car_models(id) ON DELETE RESTRICT,
  country_code char(2) NULL REFERENCES dir_country_regulations(country_code) ON DELETE SET NULL,
  license_plate text NOT NULL,
  vin text NULL,
  year integer NOT NULL,
  color text NULL,
  body_type text NULL,
  passenger_capacity integer NOT NULL DEFAULT 4,
  fuel_type text NULL,
  transmission text NULL,
  first_registration_date date NULL,
  registration_certificate_id uuid NULL REFERENCES doc_documents(id) ON DELETE SET NULL,
  insurance_provider text NULL,
  insurance_policy_number text NULL,
  insurance_coverage_type text NULL,
  insurance_amount numeric(18,2) NULL,
  insurance_issue_date date NULL,
  insurance_expiry date NULL,
  ownership_type varchar(20) NOT NULL REFERENCES dir_ownership_types(code) DEFAULT 'fleet',
  owner_id uuid NULL,
  acquisition_date date NULL,
  lease_end_date date NULL,
  residual_value numeric(18,2) NULL,
  odometer integer NULL,
  service_interval_km integer NULL,
  next_service_at_km integer NULL,
  status varchar(20) NOT NULL REFERENCES dir_vehicle_statuses(code) DEFAULT 'pending',
  status_changed_at timestamptz NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NULL REFERENCES adm_members(id) ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid NULL REFERENCES adm_members(id) ON DELETE SET NULL,
  deleted_at timestamptz NULL,
  deleted_by uuid NULL REFERENCES adm_members(id) ON DELETE SET NULL,
  deletion_reason text NULL,
  CONSTRAINT flt_vehicles_license_unique UNIQUE (tenant_id, license_plate) WHERE deleted_at IS NULL,
  CONSTRAINT flt_vehicles_vin_unique UNIQUE (tenant_id, vin) WHERE deleted_at IS NULL AND vin IS NOT NULL,
  CONSTRAINT flt_vehicles_year_check CHECK (year >= 1900)
);

-- Table des inspections
CREATE TABLE flt_vehicle_inspections (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_id uuid NOT NULL REFERENCES flt_vehicles(id) ON DELETE CASCADE,
  inspection_date date NOT NULL,
  odometer integer NULL,
  result text NOT NULL,
  next_due_date date NULL,
  document_id uuid NULL REFERENCES doc_documents(id) ON DELETE SET NULL,
  notes text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NULL REFERENCES adm_members(id) ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid NULL REFERENCES adm_members(id) ON DELETE SET NULL
);

-- Table des équipements
CREATE TABLE flt_vehicle_equipments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_id uuid NOT NULL REFERENCES flt_vehicles(id) ON DELETE CASCADE,
  equipment_type text NOT NULL,
  serial_number text NULL,
  issue_date date NULL,
  expiry_date date NULL,
  notes text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NULL REFERENCES adm_members(id) ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid NULL REFERENCES adm_members(id) ON DELETE SET NULL,
  deleted_at timestamptz NULL,
  deleted_by uuid NULL REFERENCES adm_members(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS flt_vehicles_status_idx ON flt_vehicles (status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS flt_vehicles_country_idx ON flt_vehicles (country_code);
CREATE INDEX IF NOT EXISTS flt_vehicle_inspections_date_idx ON flt_vehicle_inspections (inspection_date);
CREATE INDEX IF NOT EXISTS flt_vehicle_equipments_type_idx ON flt_vehicle_equipments (equipment_type);

-- Les triggers de mise à jour des dates `updated_at` restent applicables.
```

## 5. Impacts sur les autres modules et tables

1. **Planification et maintenance** : l’introduction des tables `flt_vehicle_inspections` et `flt_vehicle_equipments` permettra aux modules de scheduling de planifier les maintenances et d’éviter les conflits. Les alertes seront déclenchées en fonction des dates `next_due_date` et `expiry_date` des équipements.

2. **Référentiels et validations** : la création des tables de référence pour les statuts et types impose de mettre à jour l’interface d’administration afin de gérer ces listes. Les validations lors de l’import ou de la création d’un véhicule devront vérifier l’existence des codes correspondants.

3. **Règles multi‑pays** : l’ajout du champ `country_code` et des colonnes pour les dimensions et documents permet d’appliquer les règles par pays (âge maximal, dimensions minimales, documents requis) en lisant `dir_country_regulations`【241590307805986†L138-L144】. Les modules de conformité devront vérifier ces critères avant d’activer un véhicule.

4. **Financement et propriété** : les nouvelles colonnes d’ownership nécessitent de relier les véhicules aux investisseurs ou au module de leasing. Les rapports financiers devront intégrer les amortissements et les parts des investisseurs.

5. **Migration de données** : l’ajout des champs et des tables nécessitera une migration avec des valeurs par défaut. Les équipements existants peuvent être initialisés dans `flt_vehicle_equipments` et les inspections à partir des dates existantes.

## 6. Conclusion

Le modèle actuel de `flt_vehicles` fournit une base solide pour gérer la flotte, mais reste minimaliste au regard des exigences du métier (conformité, planification, intégration multi‑plateformes). Les améliorations proposées ajoutent des référentiels, des tables d’historisation et des champs structurés pour refléter les informations détaillées décrites dans la spécification (assurance, propriété, équipements, dimensions)【567670092230000†L56-L84】. Cette approche plug‑and‑play garantit que la plateforme peut évoluer pour intégrer de nouveaux pays, de nouvelles règlementations et de nouveaux services (inspections, leasing, investisseurs) sans refonte majeure, tout en préservant l’isolement multi‑tenant et la traçabilité des données.
