# Table `fin_traffic_fines` – Analyse détaillée

Cette fiche analyse en profondeur la table **`fin_traffic_fines`**, en se basant sur le DDL Supabase fourni et sur les exigences fonctionnelles de Fleetcore. Elle identifie les règles métiers, propose des améliorations et présente un modèle cible pour répondre aux cas d’usage multi‑pays.

## 1. Modèle Supabase existant

La table `fin_traffic_fines` stocke les contraventions routières imputées à des chauffeurs et/ou des véhicules. Chaque ligne est multi‑tenant grâce au champ `tenant_id` et comprend :

| Colonne             | Type            | Contraintes principales                                                  | Remarques                                                                                         |
| ------------------- | --------------- | ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------- |
| **id**              | `uuid`          | Clé primaire                                                             | Identifiant immuable.                                                                             |
| **tenant_id**       | `uuid`          | Non nul, FK vers `adm_tenants(id)`                                       | Permet l’isolement multi‑tenant.                                                                  |
| **driver_id**       | `uuid`          | Non nul, FK vers `rid_drivers(id)`                                       | Chauffeur responsable.                                                                            |
| **vehicle_id**      | `uuid`          | Non nul, FK vers `flt_vehicles(id)`                                      | Véhicule ayant reçu l’amende.                                                                     |
| **fine_reference**  | `text`          | Non nul, unique `(tenant_id, fine_reference)`                            | Référence du PV émise par l’autorité.                                                             |
| **fine_date**       | `date`          | Non nul                                                                  | Date à laquelle l’infraction est survenue.                                                        |
| **fine_type**       | `text`          | Non nul                                                                  | Nature de l’infraction (excès de vitesse, stationnement, etc.). Aucune énumération n’est imposée. |
| **amount**          | `numeric(14,2)` | Non négatif (`CHECK amount >= 0`)                                        | Montant de l’amende.                                                                              |
| **currency**        | `varchar(3)`    | Non nul                                                                  | Devise (AED, EUR, etc.).                                                                          |
| **status**          | `text`          | Non nul, valeurs autorisées : `pending`, `paid`, `disputed`, `cancelled` | État de la contravention.                                                                         |
| **metadata**        | `jsonb`         | Non nul, défaut `{}`                                                     | Informations additionnelles (numéro d’avis, lien vers le fichier PDF, localisation…).             |
| **created_at**      | `timestamptz`   | Non nul, défaut `now()`                                                  | Date d’insertion.                                                                                 |
| **created_by**      | `uuid`          | Nullable, FK vers `adm_members(id)`                                      | Membre ayant créé l’enregistrement.                                                               |
| **updated_at**      | `timestamptz`   | Non nul, défaut `now()`                                                  | Mis à jour via trigger.                                                                           |
| **updated_by**      | `uuid`          | Nullable, FK vers `adm_members(id)`                                      | Membre ayant modifié l’enregistrement.                                                            |
| **deleted_at**      | `timestamptz`   | Nullable                                                                 | Soft‑delete.                                                                                      |
| **deleted_by**      | `uuid`          | Nullable, FK vers `adm_members(id)`                                      | Membre ayant supprimé l’entrée.                                                                   |
| **deletion_reason** | `text`          | Nullable                                                                 | Raison de suppression.                                                                            |

Indexes :

- Index B‑tree sur `tenant_id`, `driver_id`, `vehicle_id`, `fine_date` et `status` (avec filtre sur `deleted_at is null`).
- Index GIN sur `metadata` pour la recherche full‑text ou par clé.
- Index unique `(tenant_id, fine_reference)` pour empêcher deux amendes identiques chez un même client.

## 2. Règles métiers & processus existants

1. **Enregistrement d’une amende** : Lorsqu’une infraction est notifiée par l’autorité compétente, un administrateur finance ou le système enregistre une entrée dans `fin_traffic_fines`. L’enregistrement doit inclure le chauffeur et le véhicule concernés, ainsi que la référence officielle de l’amende.
2. **Intégration avec la gestion de flotte** : Les amendes font partie des coûts de véhicule. Elles sont prises en compte dans les rapports de performance et dans le calcul du coût total de possession du véhicule. Le module de gestion de flotte génère des alertes lorsqu’une amende est en souffrance ou lorsqu’un nombre élevé d’amendes est détecté【235064887104183†L250-L274】.
3. **Workflow de paiement et de contestation** : Les amendes peuvent être payées directement par la flotte ou transférées au chauffeur selon les termes de coopération. Le statut évolue de `pending` → `paid` lorsqu’un paiement est enregistré ou de `pending` → `disputed` si une contestation est déposée. Une fois annulée par l’autorité, le statut passe à `cancelled`.
4. **Notifications et déductions** : Le système notifie le chauffeur et le finance admin lorsqu’une amende est ajoutée. Si l’amende est imputée au chauffeur, le montant est déduit des paiements à venir (voir la règle de priorité des déductions : dettes → pénalités → avances【235064887104183†L472-L475】). Les amendes impayées excluent le chauffeur du prochain traitement de salaire WPS【235064887104183†L502-L507】.
5. **Prévention et suivi** : Le module de performance chauffeur identifie les comportements à risque (excès de vitesse, stationnement illégal) et déclenche des séances de coaching ou des sanctions graduelles【235064887104183†L344-L359】. Les amendes sont un indicateur clé de qualité de conduite.
6. **Lien avec assurance et accidents** : En cas d’accident, les amendes (comme défaut d’assurance ou conduite sans permis) doivent être rapprochées des rapports d’accident et des réclamations d’assurance. Cela influence le coût global et peut activer des clauses contractuelles (ex. franchise augmentée).
7. **Absence de référentiel de types de contraventions** : Le champ `fine_type` est libre, ce qui peut provoquer des incohérences (e.g. “speeding”, “SPEED”, “excès de vitesse”).

## 3. Propositions d’amélioration

Pour rendre la gestion des contraventions plus robuste et adaptable à plusieurs pays, nous proposons :

1. **Horodatage précis** : remplacer `fine_date` par `fine_timestamp` (`timestamptz`) pour enregistrer la date et l’heure de l’infraction. Cela permet de croiser l’amende avec les données de trip, de shift ou d’itinéraire.
2. **Référentiel de types de contraventions** : créer une table `dir_fine_types` avec les colonnes `id`, `code`, `description`, `points`, `min_amount`, `max_amount`, `jurisdiction` (pays ou région), `active` et `metadata`. Le champ `fine_type_id` dans `fin_traffic_fines` remplacera le champ texte `fine_type`. Cette normalisation évite les doublons et permet d’appliquer des traitements spécifiques (points à retirer, notifications, majorations).
3. **Champs supplémentaires** :
   - `location` (point ou lat/long) et `address` pour enregistrer le lieu de l’infraction.
   - `issuing_authority` pour préciser l’organisme qui a émis l’amende (police, municipalité, RTA, etc.).
   - `deadline_date` pour la date limite de paiement sans majoration.
   - `points_penalty` (integer) pour stocker la pénalité en points de permis si applicable.
   - `attachment_url` pour l’URL du scan ou du PDF de l’avis.
   - `paid_at` (timestamptz) pour enregistrer la date de paiement.
   - `payment_method` (FK vers `fin_payment_methods` ou chaîne) et `transaction_reference` pour enregistrer les paiements.
   - `driver_payment_id` (FK vers `fin_driver_payments`) si l’amende est déduite du salaire.
4. **Statuts enrichis** : étendre le champ `status` à une ENUM (`pending`, `processing`, `disputed`, `cancelled`, `paid`, `refunded`). Le statut `processing` peut être utilisé lors de l’envoi d’un dossier à la police ou à l’assurance.
5. **Gestion des contestations** : créer une table `fin_traffic_fine_disputes` avec les champs `id`, `fine_id`, `submitted_by`, `submitted_at`, `reason`, `status`, `resolved_at` et `resolution_notes`. Le champ `dispute_id` dans `fin_traffic_fines` pourra référencer une contestation en cours ou passée.
6. **Indexation et performances** : ajouter des indexes sur `fine_timestamp`, `fine_type_id`, `status`, `driver_id` et `vehicle_id`. Mettre à jour l’index unique pour inclure `fine_timestamp` si la référence n’est pas unique.
7. **RLS et audit** : appliquer des politiques RLS pour que chaque tenant ne voie que ses amendes. Toutes les modifications devront être enregistrées dans `adm_audit_logs` avec le champ `entity = 'fin_traffic_fines'`.

## 4. Modèle cible proposé

### 4.1 Référentiel des types d’amendes

```sql
create table public.dir_fine_types (
  id uuid primary key default extensions.uuid_generate_v4(),
  code text not null, -- exemple : SPEED, PARK, LICENCE
  description text not null,
  jurisdiction char(2) not null, -- pays ou code régional
  min_amount numeric(14,2) not null,
  max_amount numeric(14,2) not null,
  points integer null,
  active boolean not null default true,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint dir_fine_types_code_unique unique (jurisdiction, code)
);
```

### 4.2 Table des amendes enrichie

```sql
create table public.fin_traffic_fines (
  id uuid primary key default extensions.uuid_generate_v4(),
  tenant_id uuid not null references adm_tenants(id) on update cascade on delete cascade,
  driver_id uuid not null references rid_drivers(id) on update cascade on delete cascade,
  vehicle_id uuid not null references flt_vehicles(id) on update cascade on delete cascade,
  fine_reference text not null,
  fine_timestamp timestamptz not null,
  fine_type_id uuid not null references dir_fine_types(id) on update cascade on delete restrict,
  amount numeric(14,2) not null check (amount >= 0),
  currency char(3) not null,
  status text not null default 'pending' check (status in ('pending','processing','disputed','cancelled','paid','refunded')),
  location point null,
  address text null,
  issuing_authority text null,
  deadline_date date null,
  points_penalty integer null,
  paid_at timestamptz null,
  payment_method_id uuid null references bil_payment_methods(id) on update cascade on delete set null,
  driver_payment_id uuid null references fin_driver_payments(id) on update cascade on delete set null,
  dispute_id uuid null references fin_traffic_fine_disputes(id) on update cascade on delete set null,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  created_by uuid null references adm_members(id) on update cascade on delete set null,
  updated_at timestamptz not null default now(),
  updated_by uuid null references adm_members(id) on update cascade on delete set null,
  deleted_at timestamptz null,
  deleted_by uuid null references adm_members(id) on update cascade on delete set null,
  deletion_reason text null,
  constraint fin_traffic_fines_tenant_reference_unique unique (tenant_id, fine_reference) where deleted_at is null
);

create index on fin_traffic_fines (tenant_id, fine_timestamp desc);
create index on fin_traffic_fines (status) where deleted_at is null;
create index on fin_traffic_fines (fine_type_id);
create index on fin_traffic_fines (payment_method_id);
create index on fin_traffic_fines (driver_payment_id);
create index on fin_traffic_fines (issuing_authority);
```

### 4.3 Gestion des contestations

```sql
create table public.fin_traffic_fine_disputes (
  id uuid primary key default extensions.uuid_generate_v4(),
  fine_id uuid not null references fin_traffic_fines(id) on update cascade on delete cascade,
  submitted_by uuid not null references adm_members(id) on update cascade on delete cascade,
  submitted_at timestamptz not null default now(),
  reason text not null,
  status text not null default 'pending' check (status in ('pending','accepted','rejected')),
  resolved_at timestamptz null,
  resolution_notes text null,
  metadata jsonb not null default '{}'
);
```

## 5. Impacts et intégration

### 5.1 Impact sur d’autres tables

1. **`dir_fine_types`** : cette nouvelle table centralise les types d’infractions et permet une validation stricte du champ `fine_type_id`. Elle doit être alimentée par les réglementations nationales ou locales et peut être filtrée par pays (`jurisdiction`).
2. **`fin_driver_payment_batches` et `fin_driver_payments`** : en associant des amendes aux paiements, on peut déduire automatiquement les montants des salaires. Les workflows de paie WPS/SEPA devront être adaptés pour inclure ces déductions et tenir compte du statut de l’amende.
3. **`rid_drivers` et `flt_vehicles`** : les amendes sont un indicateur de performance ; elles influencent l’évaluation du chauffeur et la décision d’affectation. Les rapports de performance devront inclure le nombre et le montant des amendes par période.
4. **`fin_transactions`** : si les amendes sont payées via un compte de trésorerie ou un prestataire (Stripe, Adyen), chaque règlement doit être enregistré comme un mouvement financier. Le lien `payment_method_id` facilite ce rapprochement.
5. **`doc_documents`** : l’URL ou le scan de l’amende peut être stocké dans `doc_documents` et lié via `metadata` ou `attachment_url`. Le cycle d’expiration des documents doit respecter la durée de conservation légale.
6. **`dir_country_regulations`** : certains pays ont des grilles d’amendes particulières (points de permis, majorations, délais). Il faudra assurer la cohérence entre cette table et les références dans `dir_fine_types`.

### 5.2 Impact sur les services

1. **Service de collecte des amendes** : une intégration avec les portails gouvernementaux (RTA aux Émirats, ANTAI en France) ou un import manuel permettra de récupérer les amendes et de les insérer dans `fin_traffic_fines`. Cette intégration doit gérer l’authentification, le format des données et les erreurs (amendes dupliquées, références inconnues).
2. **Workflow de contestation** : un service dédié (par exemple `FineDisputeService`) gérera la création et le suivi des contestations. Les statuts des amendes et des contestations seront synchronisés.
3. **Notification et reporting** : le module Finance enverra des notifications aux chauffeurs et aux managers lors de la réception d’une amende ou d’un changement de statut. Des rapports périodiques présenteront le total des amendes par chauffeur, véhicule, type et statut.
4. **Conformité et audit** : toutes les opérations sur les amendes doivent être enregistrées dans `adm_audit_logs` afin de garantir la traçabilité. Les politiques RLS assureront que chaque tenant ne voit que ses propres amendes.

## 6. Conclusion

La table `fin_traffic_fines` actuelle permet un suivi de base des contraventions, mais elle manque de structure pour les intégrer pleinement dans un système multi‑pays et multi‑tenants. En introduisant un référentiel `dir_fine_types`, en enrichissant les champs pour gérer les délais, les paiements et les contestations, et en normalisant les statuts, on obtient un modèle plus robuste, extensible et conforme aux exigences réglementaires. Ces améliorations rendent le module prêt pour les marchés pilotes (Émirats arabes unis et France) et les futures extensions à d’autres pays, tout en s’intégrant harmonieusement avec la gestion de flotte, la paie des chauffeurs et la comptabilité générale.
