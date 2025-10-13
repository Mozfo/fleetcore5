# Analyse de la table `flt_vehicle_maintenance`

Cette analyse suit la trame validée pour les autres tables : description du modèle Supabase existant, règles métier et processus identifiés dans la spécification et le code, propositions d’amélioration et modèle cible, et enfin impact sur les autres modules. La table `flt_vehicle_maintenance` appartient au domaine **Fleet** et enregistre l’historique des maintenances et réparations des véhicules.

## Modèle Supabase actuel

La table est définie comme suit :

```sql
create table public.flt_vehicle_maintenance (
  id uuid not null default extensions.uuid_generate_v4 (),
  tenant_id uuid not null,
  vehicle_id uuid not null,
  maintenance_type text not null,
  scheduled_date date not null,
  completed_date date null,
  odometer_reading integer null,
  next_service_km integer null,
  next_service_date date null,
  provider_name text null,
  provider_contact text null,
  cost_amount numeric(10, 2) null,
  currency character(3) not null default 'EUR'::bpchar,
  invoice_reference text null,
  parts_replaced text null,
  notes text null,
  status text not null default 'scheduled'::character varying,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone not null default CURRENT_TIMESTAMP,
  created_by uuid null,
  updated_at timestamp with time zone not null default CURRENT_TIMESTAMP,
  updated_by uuid null,
  constraint flt_vehicle_maintenance_pkey primary key (id),
  constraint flt_vehicle_maintenance_created_by_fkey foreign key (created_by) references adm_members (id) on update CASCADE on delete set null,
  constraint flt_vehicle_maintenance_tenant_id_fkey foreign key (tenant_id) references adm_tenants (id) on update CASCADE on delete CASCADE,
  constraint flt_vehicle_maintenance_updated_by_fkey foreign key (updated_by) references adm_members (id) on update CASCADE on delete set null,
  constraint flt_vehicle_maintenance_vehicle_id_fkey foreign key (vehicle_id) references flt_vehicles (id) on update CASCADE on delete CASCADE,
  constraint flt_vehicle_maintenance_maintenance_type_check check (
    (
      maintenance_type = any (array[
        'oil_change'::text,
        'service'::text,
        'inspection'::text,
        'tire_rotation'::text,
        'brake_service'::text,
        'repair'::text,
        'other'::text
      ])
    )
  ),
  constraint flt_vehicle_maintenance_dates_check check (
    ((completed_date is null) or (completed_date >= scheduled_date))
  ),
  constraint flt_vehicle_maintenance_status_check check (
    (
      status = any (array[
        'scheduled'::text,
        'in_progress'::text,
        'completed'::text,
        'cancelled'::text
      ])
    )
  )
) ;
```

Index principaux :

- `(tenant_id)`, `(vehicle_id)`, `(maintenance_type)`, `(scheduled_date)`, `(status)` pour faciliter les requêtes fréquentes (listage par véhicule, date ou type).
- Une colonne JSON `metadata` pour des attributs extensibles.
- Un trigger met à jour `updated_at` à chaque modification.

### Points forts du modèle existant

- **Multi‑tenant** : chaque enregistrement porte un `tenant_id` et les clefs étrangères avec cascade garantissent l’isolement et la suppression en cascade lorsqu’un tenant est supprimé.
- **Typage fort des maintenances** : le champ `maintenance_type` est limité à une liste pré-définie (vidange, révision, inspection, rotation pneus, frein, réparation, autre) ; de même pour `status` (prévu, en cours, terminé, annulé).
- **Gestion de la planification** : `scheduled_date`, `next_service_km` et `next_service_date` permettent d’anticiper les entretiens récurrents.
- **Suivi des coûts** : `cost_amount` et `currency` conservent le coût direct de la maintenance, mais sans ventilation détaillée.
- **Audit et historisation** : `created_by`, `updated_by`, `deleted_at` et `metadata` fournissent les éléments pour tracer les actions.

### Limites identifiées

- **Pas d’horodatage précis** : les dates sont stockées sous forme `date` (sans heure). Les maintenances planifiées peuvent nécessiter une heure de rendez‑vous (`scheduled_at`) et une heure de fin pour mesurer la durée.
- **Informations fournisseur limitées** : `provider_name` et `provider_contact` sont des champs libres ; aucun lien vers une table de fournisseurs ou de garages homologués. Pas de référence à un numéro de bon de commande ou d’atelier.
- **Détail des pièces et travaux** : `parts_replaced` est un champ texte non structuré. Il est difficile de connaître les pièces spécifiques utilisées, leurs quantités, leur coût ou leur fournisseur.
- **Manque de statut financier** : il n’y a pas de lien direct avec les modules financiers (comptes, transactions). Impossible de savoir si la facture est payée ou en attente.
- **Pas de gestion des garanties ou des assurances** : aucune colonne pour préciser si la maintenance est couverte par une garantie constructeur, une assurance, ou si elle est imputable à un accident.
- **Pas de gestion multi‑pays et réglementaire** : les règles d’entretien (fréquence, contenus obligatoires) varient selon le pays ; le modèle ne stocke pas l’origine du règlement utilisé. La spécification prévoit pourtant de planifier les services réguliers (tous les 10 000 km), les inspections gouvernementales et de bloquer les périodes pendant lesquelles un véhicule est en maintenance【567670092230000†L153-L178】.
- **Pas de relation avec les alertes de la plateforme** : le module de planification empêche d’assigner un véhicule en maintenance【567670092230000†L153-L178】 mais la table ne stocke pas le statut de blocage ou les notifications envoyées.
- **Pas de champ pays** : un même véhicule peut être soumis à des règles différentes en France et aux Émirats ; les fréquences de maintenance et les inspections RTA/MOT varient.

## Règles métier et processus identifiés

La spécification décrit en détail la gestion de la maintenance :

- **Planification et blocage** : le **planner** affiche les maintenances prévues et interdit d’assigner un véhicule pendant ces périodes【567670092230000†L153-L178】. Les services réguliers (ex : tous les 10 000 km) sont planifiés automatiquement ; les inspections gouvernementales et les réparations imprévues sont ajoutées manuellement. Si une maintenance est programmée, un conflit est détecté et un avertissement est envoyé au Fleet Manager.
- **Enregistrement des maintenances** : toutes les maintenances (vidange, inspection, réparation, accident) sont saisies avec la date prévue, la date d’exécution, l’odomètre et les coûts. Les pièces remplacées doivent être enregistrées ainsi que les factures et fournisseurs【567670092230000†L153-L178】.
- **Intégration au cycle de vie du véhicule** : la maintenance fait partie de l’historique du véhicule (KPIs et coûts)【567670092230000†L90-L118】. Les dépenses de maintenance sont incluses dans les rapports de rentabilité et de résidualité.
- **Contrôle réglementaire** : des alertes sont envoyées lorsque des inspections obligatoires arrivent à échéance ou lorsque les intervalles kilométriques sont atteints. En France et aux Émirats, des inspections périodiques (MOT/RTA) sont exigées et les véhicules doivent être mis hors service en cas de non‑conformité【567670092230000†L153-L178】.
- **Responsabilité et audit** : chaque maintenance est associée à l’utilisateur qui l’a créée ou mise à jour (`created_by`, `updated_by`), et l’action est enregistrée dans le log d’audit (adm_audit_logs). Les réparations en garage doivent être validées par un mécanicien.
- **Exclusion lors des handovers** : lors d’un changement de conducteur, le véhicule doit être disponible et sans maintenance planifiée ; la fonction de handover vérifie ce pré‑requis【567670092230000†L153-L178】.
- **Coûts et répartition** : bien que non indiqué dans la table, la spécification précise que les coûts d’entretien sont imputés au véhicule et répartis si des investisseurs sont concernés (Investor Rolling Stock), impactant le calcul du ROI【705897994408243†L273-L274】.

Ces règles impliquent que la base de données doit permettre de planifier, de suivre et d’auditer chaque opération d’entretien, tout en respectant les contraintes multi‑pays et multi‑tenants.

## Propositions d’amélioration

Pour répondre aux exigences fonctionnelles et préparer l’extension à d’autres pays, nous proposons :

**Approche adaptée aux opérateurs de ride‑hailing :** La gestion de la maintenance pour des flottes de VTC ne doit pas reproduire la complexité d’une application de fleet management d’entreprise. Les opérateurs de ride‑hailing gèrent des véhicules souvent financés ou loués à des chauffeurs indépendants et souscrivent rarement à des contrats d’entretien complexes. L’objectif est de planifier les interventions essentielles et de suivre les coûts sans surcharger la base.

1. **Horodatage précis et durée simplifiée** : remplacez `scheduled_date` et `completed_date` par des colonnes `scheduled_at` (timestamptz) et `completed_at` (timestamptz) pour suivre la date et l’heure du rendez‑vous. Il n’est pas nécessaire d’enregistrer une plage horaire complète ni une durée estimée ; le gestionnaire sait que l’entretien immobilise le véhicule toute la journée.
2. **Référence fournisseur simplifiée** : conservez les champs existants `provider_name` et `provider_contact` (libres) plutôt que de créer une nouvelle table. Pour la majorité des opérateurs de ride‑hailing, un simple nom de garage et un numéro de téléphone suffisent. Les informations détaillées (adresse, certification, facturation) pourront être stockées dans le module Contacts ou dans un ERP externe si nécessaire.
3. **Pas de détail de pièces ou de tâches** : au lieu de créer des tables supplémentaires pour les pièces et la main‑d’œuvre, stockez une courte description des travaux dans `notes` et utilisez `cost_amount` pour le coût total. Les plateformes de ride‑hailing n’ont pas besoin de suivre chaque pièce ; c’est la responsabilité du garage. Le justificatif (facture) peut être joint via `invoice_reference` ou `file_url` dans la table des documents.
4. **Statut opérationnel simple** : conservez un statut lié au déroulement de la maintenance (`scheduled`, `completed`, `cancelled`). Le suivi du paiement reste géré par les modules financiers (`fin_transactions`) qui stockent les règlements avec une référence à la maintenance ; il n’est pas nécessaire d’ajouter un champ de statut financier ou de compte bancaire dans cette table.
5. **Politique de périodicité par défaut** : ne créez pas de table de politiques par pays ; gérez la fréquence via un paramètre global ou dans la configuration du tenant (ex. un entretien tous les 10 000 km ou tous les 6 mois). Les opérateurs peuvent modifier ces valeurs dans leur administration.
6. **Limitation des statuts et types** : conservez les listes actuelles de `maintenance_type` et `status` mais stockez‑les dans des enums ou des tables de référence simples si vous envisagez d’ajouter quelques valeurs (ex. `battery_change`). Évitez de multiplier les statuts (`on_hold`, `rescheduled`) qui ne sont pas indispensables.
7. **Pas de gestion des garanties** : les garanties constructeur sont généralement gérées par le propriétaire ou l’investisseur et ne nécessitent pas de champ dédié dans cette table. Si besoin, utilisez la colonne `metadata` pour noter que la réparation est couverte par l’assurance.
8. **Intégration simple avec le calendrier** : si une synchronisation avec Google ou Outlook est requise, stockez `calendar_event_id` dans `metadata` afin de ne pas alourdir le schéma.
9. **Journalisation et conformité** : les champs d’audit existants (`created_by`, `updated_by`, `deleted_at`) suffisent. Toute modification sensible est enregistrée via `adm_audit_logs` qui identifie l’entité et l’utilisateur. Conservez la suppression logique pour respecter la RGPD.
10. **Multi‑pays plug‑and‑play** : évitez d’ajouter un champ `country_code` dans la table. Les règles spécifiques aux pays (fréquence d’entretien, type d’inspection) doivent être définies dans la configuration du tenant ou dans des services externes. Cela évite de multiplier les champs inutiles et permet d’appliquer les règles via la logique applicative sans toucher au schéma de base. L’approche plug‑and‑play consiste à garder le modèle générique et à gérer les particularités locales au niveau service ou configuration.

## Modèle cible (DDL enrichi)

À titre indicatif, voici un **modèle cible allégé** adapté aux flottes de ride‑hailing. L’objectif est de fournir les champs essentiels sans surcharger la base :

```sql
-- Table principale des maintenances (version simplifiée)
CREATE TABLE flt_vehicle_maintenance (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id uuid NOT NULL REFERENCES adm_tenants(id) ON DELETE CASCADE,
  vehicle_id uuid NOT NULL REFERENCES flt_vehicles(id) ON DELETE CASCADE,
  maintenance_type text NOT NULL,
  status text NOT NULL DEFAULT 'scheduled',
  scheduled_at timestamptz NOT NULL,
  completed_at timestamptz,
  odometer_reading integer,
  next_service_km integer,
  next_service_date date,
  provider_name text,
  provider_contact text,
  cost_amount numeric(12,2),
  currency char(3) NOT NULL DEFAULT 'AED',
  invoice_reference text,
  notes text,
  metadata jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES adm_members(id),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES adm_members(id),
  deleted_at timestamptz,
  deleted_by uuid REFERENCES adm_members(id),
  deletion_reason text,
  CONSTRAINT chk_maintenance_dates CHECK (completed_at IS NULL OR completed_at >= scheduled_at),
  CONSTRAINT chk_cost_positive CHECK (cost_amount IS NULL OR cost_amount >= 0)
);
```

Dans cette version :

- Les colonnes `maintenance_type` et `status` restent des chaînes avec un contrôle en base via un `CHECK` (ex : `scheduled`, `in_progress`, `completed`, `cancelled`). Un catalogue externe n’est créé que si des valeurs supplémentaires sont nécessaires.
  - Les champs `provider_name` et `provider_contact` permettent d’identifier le garage ayant réalisé l’entretien sans créer un référentiel séparé.
  - La gestion des pièces, de la main‑d’œuvre et des statuts financiers est externalisée vers les modules financiers et le champ `metadata` si besoin. Aucune table supplémentaire n’est nécessaire.
  - La table ne contient pas de champ `country_code` afin de rester générique ; les règles locales (fréquence, inspections) sont gérées via la configuration du tenant ou des services externes.

Ce modèle cible offre une base légère, adaptée aux opérateurs de ride‑hailing qui veulent enregistrer les entretiens essentiels sans complexité excessive. Les améliorations détaillées précédemment restent disponibles comme extensions facultatives si l’activité se complexifie (par exemple, pour des parcs plus importants ou des exigences réglementaires plus strictes).

## Impacts et interactions

Les modifications proposées ont des répercussions :

1. **Sur le module Fleet :** les véhicules liés (`flt_vehicles`) utiliseront `next_service_km` et `next_service_date` pour déclencher des alertes de rappel. Lorsqu’un entretien est planifié, le véhicule est automatiquement marqué comme « hors service » pour la période comprise entre `scheduled_at` et `completed_at`. Les fiches véhicules afficheront un historique simplifié (type, dates, coût) et permettront de créer de nouvelles maintenances selon les paramètres configurés au niveau du tenant.
2. **Sur le module Scheduling :** le calendrier des véhicules doit utiliser les champs `scheduled_at` et `completed_at` pour bloquer le véhicule pendant la période d’entretien. Des notifications doivent être envoyées aux gestionnaires et aux mécaniciens lors de la planification ou de la modification d’une maintenance. Aucune gestion de plages horaires ou de durée complexe n’est nécessaire : la maintenance immobilise le véhicule pour la journée.
3. **Sur les modules Finance et Investors :** le coût de la maintenance est enregistré via `cost_amount` et pourra être relayé aux modules financiers (`fin_transactions`) en référant l’identifiant de maintenance dans la description ou la `metadata`. Aucune colonne supplémentaire n’est ajoutée dans cette table (le suivi du paiement reste dans les modules de comptes). Les données de coût alimentent les rapports de rentabilité et le calcul du ROI des véhicules/investisseurs【705897994408243†L273-L274】.
4. **Sur les modules Directory :** aucune nouvelle table n’est nécessaire. Les champs `provider_name` et `provider_contact` suffisent pour identifier le garage. Les répertoires existants (contacts, fournisseurs) peuvent être utilisés pour stocker des informations plus complètes sans surcharger la base de données maintenance.
5. **Sur les modules Compliance/Regulatory :** la table ne porte pas de champ `country_code`. Les exigences locales (fréquence des services, inspections obligatoires) sont stockées dans la configuration du tenant ou dans des services réglementaires externes. Les alertes d’expiration ou de fréquence sont déclenchées par la logique applicative en fonction de ces paramètres, sans modifier le schéma.
6. **Sur la migration des données** : lors de la mise à jour, les champs existants `scheduled_date` et `completed_date` seront convertis en `scheduled_at` et `completed_at` (timestamptz). Les colonnes `provider_name` et `provider_contact` restent inchangées ; aucune migration vers une table de fournisseurs n’est requise. Les valeurs de `maintenance_type` et `status` existantes sont conservées.

## Conclusion

La table actuelle `flt_vehicle_maintenance` fournit une base suffisante pour enregistrer les interventions essentielles sur les véhicules. Une simple conversion des dates en timestamps et le maintien de `provider_name`/`provider_contact` suffisent à répondre aux besoins des opérateurs de ride‑hailing. Les suggestions plus ambitieuses (référentiels de fournisseurs, politiques de maintenance, gestion des pièces, suivi financier détaillé ou pays) sont laissées en option. Cette approche permet à Fleetcore de rester légère et plug‑and‑play : elle couvre les besoins courants (planification, rappel, suivi des coûts) tout en laissant la possibilité d’intégrations externes pour la comptabilité, les fournisseurs ou les règlementations spécifiques.
