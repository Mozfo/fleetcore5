# Analyse de la table `flt_vehicle_assignments`

Cette table gère l’affectation des véhicules aux chauffeurs pour des périodes données. Dans un contexte de ride‑hailing, elle constitue le lien clé entre le conducteur et la voiture qu’il utilise sur les plateformes. L’analyse est structurée en quatre parties : modèle existant, règles métier, améliorations proposées et impact.

## 1. Modèle Supabase existant

Dans le datamodel complet, `flt_vehicle_assignments` lie un véhicule à un chauffeur avec des dates de début et de fin :

| Champ             | Type          | Description / contraintes                                                                              |
| ----------------- | ------------- | ------------------------------------------------------------------------------------------------------ |
| `id`              | `uuid`        | Identifiant unique, clé primaire.                                                                      |
| `tenant_id`       | `uuid`        | Référence vers `adm_tenants` ; isolement multi‑tenant.                                                 |
| `driver_id`       | `uuid`        | Référence vers `rid_drivers`. Chaque affectation concerne un conducteur.                               |
| `vehicle_id`      | `uuid`        | Référence vers `flt_vehicles`.                                                                         |
| `start_date`      | `date`        | Date de début de l’affectation ; non nulle.                                                            |
| `end_date`        | `date`        | Date de fin ; facultative (affectation en cours si `NULL`).                                            |
| `assignment_type` | `varchar(50)` | Type d’affectation (par défaut `permanent`; peut valoir `temporary`).                                  |
| `metadata`        | `jsonb`       | Données supplémentaires (par ex. notes de contrat).                                                    |
| `status`          | `varchar(50)` | Statut de l’affectation (`active`, `inactive`) avec valeur par défaut `active`.                        |
| Audit fields      | —             | `created_at`, `created_by`, `updated_at`, `updated_by`, `deleted_at`, `deleted_by`, `deletion_reason`. |

Une contrainte d’unicité partielle (`UNIQUE (tenant_id, driver_id, vehicle_id, start_date) WHERE deleted_at IS NULL`) empêche la création de deux affectations identiques. Des index existent sur `tenant_id`, `driver_id`, `vehicle_id`, `start_date`, `end_date`, `status` et les colonnes d’audit.

## 2. Règles métier et processus

1. **Affectation unique** : un conducteur ne doit pas être affecté à plusieurs véhicules en même temps, et un véhicule ne peut pas être assigné à deux chauffeurs simultanément. La contrainte d’unicité sur `(driver_id, vehicle_id, start_date)` et les contrôles applicatifs empêchent les chevauchements. Le planificateur de flotte vérifie également que l’affectation n’entre pas en conflit avec une période de maintenance【567670092230000†L153-L178】.
2. **Types d’affectation** : `permanent` signifie que le chauffeur utilise habituellement ce véhicule (notamment dans un modèle de location hebdomadaire), tandis que `temporary` sert pour les remplacements ou les périodes de test. Le champ `status` indique si l’affectation est encore en vigueur.
3. **Cycle de vie** : lorsqu’une affectation prend fin (`end_date` renseignée), le statut passe à `inactive`. L’historique est conservé pour calculer l’utilisation du véhicule et du chauffeur et pour respecter les obligations contractuelles.
4. **Liens avec la paie** : les affectations permettent de déterminer à quel véhicule se rapportent les revenus et les dépenses d’un chauffeur. Les modules financiers se basent sur l’affectation active à la date du trajet pour imputer les coûts correctement.

## 3. Améliorations proposées

Pour un opérateur ride‑hailing, l’objectif est de simplifier la gestion des affectations tout en conservant une traçabilité suffisante :

1. **Horodatage précis** : remplacer `start_date` et `end_date` par `assigned_at` et `released_at` de type `timestamptz` pour gérer des affectations à l’heure (matin/soir). Cela permet de mieux suivre les rotations intra‑journalières.
2. **Enumériser `assignment_type` et `status`** : créer des ENUMs ou des tables de référence (par ex. `dir_assignment_types`) pour éviter les erreurs de saisie et permettre l’ajout de nouveaux types (ex. `shift`, `standby`).
3. **Lien plateforme** : ajouter `platform_id` (FK vers `dir_platforms`) pour indiquer sur quelle plateforme (Uber, Bolt, etc.) l’affectation est active, lorsque des règles spécifiques s’appliquent (ex. interdiction de faire du cash sur certaines plateformes). Cela facilite la désactivation automatique en cas de suspension de compte【956389956631957†screenshot】.
4. **Gestion simplifiée des status** : distinguer uniquement `active` et `ended` (supprimant `inactive`) et utiliser `deleted_at` pour les annulations. Les drivers peuvent consulter leurs affectations dans leur portail.
5. **Mettre à jour par le workflow de handover** : lors d’un évènement `handover` dans `flt_vehicle_events`, l’affectation courante est terminée (`released_at` renseigné) et une nouvelle est créée pour le chauffeur suivant. Cela permet de synchroniser les tables.

### Modèle cible simplifié

```sql
create table flt_vehicle_assignments (
  id uuid primary key default extensions.uuid_generate_v4(),
  tenant_id uuid not null references adm_tenants(id) on delete cascade,
  driver_id uuid not null references rid_drivers(id),
  vehicle_id uuid not null references flt_vehicles(id),
  platform_id uuid references dir_platforms(id),
  assigned_at timestamptz not null,
  released_at timestamptz,
  assignment_type varchar(20) not null default 'permanent' check (assignment_type in ('permanent','temporary','shift')),
  status varchar(20) not null default 'active' check (status in ('active','ended')),
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  created_by uuid references adm_members(id),
  updated_at timestamptz not null default now(),
  updated_by uuid references adm_members(id),
  deleted_at timestamptz,
  deleted_by uuid references adm_members(id),
  deletion_reason text,
  unique (tenant_id, driver_id, vehicle_id, assigned_at) where deleted_at is null
);
```

Cette structure permet de gérer les affectations par heure, de les associer à une plateforme et de simplifier la logique de statut. Les colonnes `assigned_at` et `released_at` remplacent `start_date`/`end_date` et facilitent l’intégration avec un calendrier de shifts.

## 4. Impacts sur le modèle global

- **`rid_drivers` et `flt_vehicles`** : l’historique des affectations influence la planification des shifts et la répartition des revenus et des dépenses. Les nouveaux champs permettront d’afficher dans le portail driver la liste des véhicules disponibles par plateforme et les créneaux horaires.
- **`flt_vehicle_events`** : l’intégration des handovers harmonise la fin d’une affectation avec la création d’une nouvelle. Cela évite des incohérences entre l’historique des événements et les affectations.
- **`dir_platforms`** : la présence d’un `platform_id` dans les affectations permet d’appliquer des règles spécifiques par plateforme (ex. Uber vs Bolt) comme la gestion des paiements cash ou des bonus de branding【746203428229014†screenshot】.
- **Interfaces & UX** : les formulaires d’affectation doivent saisir la date et l’heure de début (et éventuellement de fin). Un planning visuel (timeline) peut montrer les créneaux assignés, inspiré de l’outil de planification de véhicules observé chez MyTaxiCRM【16518245580022†screenshot】.

Cette version simplifiée de `flt_vehicle_assignments` répond aux besoins des opérateurs de ride‑hailing en gérant efficacement les affectations par créneau horaire et en intégrant les plateformes, tout en restant compatible avec le modèle existant.
