# Analyse de la table `flt_vehicle_events`

Cette analyse présente la table des événements de véhicule, en identifiant les règles métier et en proposant des améliorations adaptées à un opérateur de ride‑hailing. Elle est structurée en quatre sections : modèle existant, processus métier, recommandations et modèle cible, et impacts.

## 1. Modèle Supabase existant

La table `flt_vehicle_events` enregistre des événements marquants dans la vie d’un véhicule. Elle est multi‑tenant et comprend les colonnes suivantes :

| Champ            | Type            | Description / contraintes                                                                                                          |
| ---------------- | --------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `id`             | `uuid`          | Clé primaire.                                                                                                                      |
| `tenant_id`      | `uuid`          | Référence vers `adm_tenants`; obligatoire pour l’isolement RLS.                                                                    |
| `vehicle_id`     | `uuid`          | Référence vers `flt_vehicles`; l’événement est toujours lié à un véhicule.                                                         |
| `event_type`     | `text`          | Doit être l’une des valeurs : `acquisition`, `disposal`, `maintenance`, `accident`, `handover`, `inspection`, `insurance` (CHECK). |
| `event_date`     | `timestamptz`   | Date et heure de l’événement.                                                                                                      |
| `severity`       | `text`          | Facultatif ; peut être `minor`, `moderate`, `severe` ou `total_loss` (CHECK). Applicable notamment aux accidents.                  |
| `downtime_hours` | `integer`       | Nombre d’heures pendant lesquelles le véhicule est immobilisé à la suite de l’événement.                                           |
| `cost_amount`    | `numeric(10,2)` | Montant approximatif du coût de l’événement (réparation, perte, etc.).                                                             |
| `currency`       | `char(3)`       | Devise (défaut : `'EUR'`).                                                                                                         |
| `details`        | `jsonb`         | Données structurées supplémentaires (ex. numéro de sinistre, rapport d’inspection).                                                |
| `notes`          | `text`          | Commentaires libres.                                                                                                               |
| Audit fields     | —               | `created_at`, `created_by`, `updated_at`, `updated_by`, `deleted_at`, `deleted_by`, `deletion_reason` pour la traçabilité.         |

Des index sont définis sur `event_type`, `severity` (partial), `tenant_id`, `vehicle_id`, `event_date`, `created_at DESC`, `deleted_at` et un index GIN sur `details` pour la recherche JSON. Les contraintes `CHECK` garantissent la validité des valeurs `event_type` et `severity`.

## 2. Règles métier et processus

Les événements de véhicule servent à historiser et à analyser les moments importants de la vie d’un véhicule, afin de :

1. **Tracer la vie du véhicule** : chaque acquisition, cession, maintenance, inspection, changement d’assurance ou accident est enregistré afin d’avoir un historique complet. Ceci alimente les rapports de performance et la due diligence des investisseurs【567670092230000†L90-L118】.
2. **Bloquer le véhicule** : certains événements (maintenance, inspection, accident) nécessitent de mettre le véhicule hors service pendant une période. Le champ `downtime_hours` indique la durée d’indisponibilité, et la planification empêche la réaffectation du véhicule pendant ce temps【567670092230000†L153-L178】.
3. **Évaluer la gravité et le coût** : pour les accidents, la gravité (`severity`) et le coût estimé (`cost_amount`) permettent de décider s’il faut réparer ou déclarer une perte totale. Ces informations peuvent être utilisées pour facturer les chauffeurs en cas de responsabilité ou pour déclencher une déclaration d’assurance【150647131778616†screenshot】.
4. **Handover et inspection** : les événements de type `handover` enregistrent la remise du véhicule d’un chauffeur à un autre, appuyés par un protocole de remise avec photos et signatures【16518245580022†screenshot】. Les inspections réglementaires sont enregistrées pour prouver la conformité.
5. **Audit** : le fait d’avoir des logs d’événements permet d’alimenter `adm_audit_logs` et de démontrer la conformité aux régulateurs ou investisseurs.

## 3. Propositions d’amélioration et simplification

Pour s’adapter aux opérateurs de ride‑hailing, on peut simplifier la table tout en conservant son utilité :

1. **Horodatage précis** : renommer `event_date` en `event_at` de type `timestamptz` pour refléter clairement qu’il s’agit d’une date‑heure et non d’un simple jour.
2. **Enumérisation stricte** : remplacer les champs `event_type` et `severity` par des `ENUM` contrôlés ou des tables de référence (`dir_vehicle_event_types`, `dir_event_severity`). Cela évite les fautes de frappe et permet d’ajouter de nouvelles valeurs sans casser l’intégrité.
3. **Lien avec un chauffeur ou une course** : ajouter un champ `driver_id` et/ou `ride_id` pour relier l’événement à la personne ou à la course concernée. Par exemple, un accident se produit pendant un trajet et doit être imputé au chauffeur et au trip. Cela permet de calculer les pénalités et de suspendre le conducteur si nécessaire.
4. **Coût et responsabilité** : ajouter `responsible_party` (`fleet`, `driver`, `third_party`) et `insurance_claim_id` (FK vers une table d’assurances) pour suivre qui paie la réparation. Dans un modèle simplifié, ces informations peuvent être stockées dans `details` ou `metadata`.
5. **Simplification des colonnes peu utilisées** : pour des événements purement informatifs (acquisition, cession), les champs `downtime_hours` et `cost_amount` peuvent être nuls. Le champ `severity` ne s’applique qu’aux accidents, et pourrait être stocké dans `metadata` pour ne pas alourdir la structure.

### Modèle cible allégé

Voici un schéma cible qui adopte ces améliorations tout en restant compatible :

```sql
create table flt_vehicle_events (
  id uuid primary key default extensions.uuid_generate_v4(),
  tenant_id uuid not null references adm_tenants(id) on delete cascade,
  vehicle_id uuid not null references flt_vehicles(id) on delete cascade,
  driver_id uuid references rid_drivers(id),
  ride_id uuid references trp_trips(id),
  event_type varchar(20) not null check (event_type in (
    'acquisition','disposal','maintenance','accident','handover','inspection','insurance'
  )),
  event_at timestamptz not null,
  severity varchar(20) check (severity in ('minor','moderate','severe','total_loss')),
  downtime_hours integer,
  cost_amount numeric(10,2),
  currency char(3) not null,
  responsible_party varchar(20),
  details jsonb not null default '{}',
  notes text,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  created_by uuid references adm_members(id),
  updated_at timestamptz not null default now(),
  updated_by uuid references adm_members(id),
  deleted_at timestamptz,
  deleted_by uuid references adm_members(id),
  deletion_reason text
);
```

Ce modèle introduit `driver_id`, `ride_id` et `responsible_party` pour mieux suivre les responsabilités et relier les événements aux acteurs concernés. Les index sur `event_type`, `severity`, `vehicle_id`, `tenant_id` et `event_at` restent pertinents.

## 4. Impacts sur le modèle global

- **`flt_vehicles`** : l’ajout de `driver_id` et `ride_id` dans `flt_vehicle_events` facilite l’attribution des accidents et des incidents aux chauffeurs et aux courses. Les règles de suspension et de pénalité dans les modules de drivers et de finances peuvent utiliser ces champs pour appliquer des sanctions automatisées.
- **`flt_vehicle_maintenance`** : un événement de type `maintenance` peut servir de déclencheur pour la table des maintenances (planifiée ou imprévue). Les champs `downtime_hours` et `cost_amount` peuvent alimenter directement les indicateurs d’indisponibilité et de coût.
- **`fin_transactions` et `fin_driver_payments`** : les coûts et responsabilités enregistrés dans les événements sont utilisés pour débiter le compte approprié et réduire les paiements du chauffeur s’il est fautif.
- **Intégrations** : les accidents et les inspections peuvent être remontés via des webhooks ou des intégrations (GPS/télématique) et stockés dans `details`. Le modèle cible est suffisamment générique pour accueillir des données de plateformes multiples.

En conclusion, la table des événements doit rester simple et flexible, tout en capturant les informations essentielles pour tracer l’historique des véhicules et gérer les incidents. Les améliorations proposées renforcent la traçabilité et la responsabilité sans alourdir le modèle, conformément aux pratiques observées chez MyTaxiCRM (gestion des accidents et protocole de remise)【16518245580022†screenshot】.
