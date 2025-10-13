# Table `dir_country_regulations` – analyse et modèle cible

## Modèle existant (DDL Supabase)

La table `dir_country_regulations` contient un enregistrement par pays et regroupe les paramètres réglementaires nécessaires pour exploiter des flottes de transport de passagers (taxis, limousines, covoiturage avec chauffeur) dans chaque juridiction. Le schéma actuel est le suivant :

| Colonne             | Type            | Contraintes                         | Description                                                                              |
| ------------------- | --------------- | ----------------------------------- | ---------------------------------------------------------------------------------------- |
| `country_code`      | `char(2)`       | Clé primaire (ISO‑3166 alpha‑2)     | Code pays (ex. `FR`, `AE`).                                                              |
| `vehicle_max_age`   | `integer`       | Nullable                            | Âge maximum du véhicule en années.                                                       |
| `min_vehicle_class` | `text`          | Nullable                            | Classe minimale de véhicule autorisée (ex. « sedan », « SUV », « van »).                 |
| `min_fare_per_trip` | `numeric(10,2)` | Nullable                            | Tarif minimum par course.                                                                |
| `min_fare_per_km`   | `numeric(10,2)` | Nullable                            | Tarif minimum au kilomètre.                                                              |
| `min_fare_per_hour` | `numeric(10,2)` | Nullable                            | Tarif minimum horaire (pour un tarif horaire).                                           |
| `vat_rate`          | `numeric(5,2)`  | Nullable                            | Taux de TVA (en pourcentage).                                                            |
| `currency`          | `varchar(3)`    | Non nul                             | Devise locale (ISO‑4217).                                                                |
| `timezone`          | `text`          | Non nul                             | Fuseau horaire IANA (ex. `Europe/Paris`, `Asia/Dubai`).                                  |
| `requires_vtc_card` | `boolean`       | Non nul, défaut `false`             | Indique si un permis professionnel est obligatoire (par exemple la carte VTC en France). |
| `created_at`        | `timestamptz`   | Non nul, défaut `CURRENT_TIMESTAMP` | Date de création.                                                                        |
| `updated_at`        | `timestamptz`   | Non nul, défaut `CURRENT_TIMESTAMP` | Date de dernière mise à jour (mise à jour par trigger).                                  |

Contraintes et index :

- Clé primaire sur `country_code`.
- Index B‑tree sur `currency` et `timezone` pour les filtrages.
- Pas de champ `deleted_at` ni d’audit (`created_by`, `updated_by`).
- Pas de références vers des documents ou réglementations spécifiques ; il s’agit d’un référentiel statique partagé par tous les tenants.

## Règles métiers et processus identifiés

Le module **Regulatory & Reference Data** centralise les informations réglementaires par pays pour garantir que les flottes respectent les lois locales. Voici les principaux points issus de la spécification :

1. **Paramètres réglementaires par pays** : la spécification indique que pour chaque pays, le système doit enregistrer « les limites d’âge des véhicules, les dimensions minimales des véhicules, les documents requis (immatriculation, assurance, licence VTC), les tarifs minimums et les taux de TVA »【241590307805986†L138-L140】. Le schéma actuel couvre l’âge maximal du véhicule, une classe minimale, les tarifs minimums et la TVA, mais n’inclut pas les dimensions, la liste des documents ou d’autres conditions.
2. **Permis professionnel obligatoire** : certains pays exigent que les chauffeurs disposent d’un permis ou d’une carte professionnelle spécifique. Le champ `requires_professional_driver_license` (nom plus neutre) permet d’appliquer cette règle et de contrôler la validité des documents lors de l’onboarding des chauffeurs. Pour la France, cela correspond à l’ancienne carte VTC ; pour les Émirats arabes unis, il s’agit de la licence RTA. Le but est de rester générique et de s’adapter à chaque juridiction【241590307805986†L138-L144】.
3. **Multi‑tenant et lecture seule** : cette table est globale, sans `tenant_id`, car elle fournit des règles communes pour tous les clients. Seuls les administrateurs Fleetcore peuvent la modifier. Les tenants et leurs membres y accèdent en lecture.
4. **Utilisation dans les modules** :
   - **Création de véhicules** : lors de l’enregistrement d’un véhicule, le système vérifie l’âge du véhicule (`year_of_manufacture`) et sa classe par rapport aux paramètres du pays du tenant.
   - **Calcul des tarifs** : les modules de facturation utilisent `min_fare_per_trip`, `min_fare_per_km` et `vat_rate` pour calculer les prix minimums et la TVA. Ces valeurs se combinent avec les plans tarifaires des plateformes de covoiturage pour assurer la conformité.
   - **Préparation des contrats et documents** : les documents nécessaires (registre, assurance, permis professionnel, licence RTA, etc.) sont validés en fonction des règles du pays. Si le champ `requires_professional_driver_license` (ou `requires_vtc_card` dans la version actuelle) est vrai, l’interface impose l’upload du permis professionnel adapté à la juridiction (carte VTC en France, licence RTA aux Émirats).
   - **Reporting et audit** : les tableaux de bord comparent les performances par pays en tenant compte des tarifs minimums et des taxes.
   - **Notifications réglementaires** : si un pays modifie ses règles (TVA, tarifs, âge maximum), le système doit le signaler et planifier des migrations sur les véhicules existants.

## Propositions d’amélioration

Pour renforcer la conformité et préparer des évolutions réglementaires, les améliorations suivantes sont proposées :

1. **Ajout d’un champ `vehicle_min_length` / `min_width` / `min_height`** : certaines réglementations imposent des dimensions minimales (longueur, largeur, hauteur) pour les véhicules (par exemple en France pour les services de transport avec chauffeur et les taxis). Ajouter ces colonnes (de type `numeric(6,2)`) ou un champ `min_vehicle_dimensions` (JSON) permettrait de stocker ces limites et de les valider lors de l’onboarding des véhicules.
2. **Liste des documents obligatoires** : créer une colonne `required_documents` (`jsonb`) ou une table associée `dir_country_required_documents` référençant les types de documents obligatoires (immatriculation, assurance, inspection, permis professionnel, licence RTA, etc.). Cela faciliterait la vérification automatisée lors du dépôt de documents et l’affichage conditionnel des champs dans l’interface.
3. **Gestion des périodes et versions** : ajouter `effective_date` et `expiry_date` pour chaque enregistrement afin de gérer l’historique des réglementations et permettre d’anticiper les changements (ex. modification du taux de TVA). Un champ `version` pourrait suivre l’évolution des règles.
4. **Champs d’audit et soft‑delete** : afin d’aligner cette table sur les autres, ajouter `created_by`, `updated_by`, `deleted_at`, `deleted_by`, `deletion_reason`. Les modifications réglementaires seraient ainsi tracées dans `adm_audit_logs`.
5. **Normalisation des classes minimales** : remplacer `min_vehicle_class` (texte libre) par une référence à `dir_vehicle_classes` (`min_vehicle_class_id`) pour éviter les fautes de saisie et permettre des traductions.
6. **Ajout d’un champ `max_vehicle_weight` ou `max_vehicle_km`** : certaines régions limitent le poids ou le kilométrage total des véhicules. Ces champs pourraient être ajoutés en option.
7. **Métadonnées et commentaires** : introduire une colonne `metadata` (`jsonb`) pour stocker des notes supplémentaires ou des références juridiques (articles de loi, URL vers les textes officiels).
8. **Statut et RLS** : ajouter un champ `status` (`active`, `inactive`) pour désactiver temporairement des règles obsolètes sans les supprimer. Mettre en place des politiques RLS qui autorisent la lecture à tous mais restreignent la modification aux rôles autorisés.

9. **Approche plug‑and‑play par pays** : pour faciliter l’ajout de nouvelles juridictions sans modifier le schéma, prévoir des colonnes génériques (`required_documents`, `metadata`, `min_vehicle_dimensions`) et des tables de référence (par exemple `dir_country_required_documents`) dans lesquelles chaque pays peut définir ses propres règles. L’application lit les enregistrements correspondant au `country_code` du tenant et applique automatiquement les contraintes. De cette façon, l’ajout d’un pays (Émirats arabes unis, Arabie saoudite, etc.) se résume à insérer ses paramètres dans ces tables, sans changer le code ni la structure de base.

## Modèle cible (DDL amélioré)

Le DDL suivant illustre une version enrichie de la table qui tient compte de ces suggestions tout en restant compatible avec les données existantes :

```sql
CREATE TABLE public.dir_country_regulations (
  country_code char(2) PRIMARY KEY,
  vehicle_max_age integer NULL,
  min_vehicle_class_id uuid NULL REFERENCES dir_vehicle_classes(id) ON UPDATE CASCADE ON DELETE SET NULL,
  min_vehicle_length numeric(6,2) NULL,
  min_vehicle_width  numeric(6,2) NULL,
  min_vehicle_height numeric(6,2) NULL,
  min_fare_per_trip numeric(10,2) NULL,
  min_fare_per_km   numeric(10,2) NULL,
  min_fare_per_hour numeric(10,2) NULL,
  vat_rate          numeric(5,2) NULL,
  currency          char(3) NOT NULL,
  timezone          text NOT NULL,
  -- Indique si un permis professionnel (carte VTC en France, licence RTA aux Émirats, etc.) est obligatoire
  requires_professional_driver_license boolean NOT NULL DEFAULT false,
  required_documents jsonb NULL,        -- e.g. {"registration": true, "insurance": true, "professional_driver_license": true, "rta_license": true}
  effective_date    date NOT NULL DEFAULT CURRENT_DATE,
  expiry_date       date NULL,
  status            varchar(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive')),
  metadata          jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at        timestamptz NOT NULL DEFAULT now(),
  created_by        uuid NULL REFERENCES adm_provider_employees(id) ON UPDATE CASCADE ON DELETE SET NULL,
  updated_at        timestamptz NOT NULL DEFAULT now(),
  updated_by        uuid NULL REFERENCES adm_provider_employees(id) ON UPDATE CASCADE ON DELETE SET NULL,
  deleted_at        timestamptz NULL,
  deleted_by        uuid NULL REFERENCES adm_provider_employees(id) ON UPDATE CASCADE ON DELETE SET NULL,
  deletion_reason   text NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS dir_country_regulations_currency_idx   ON public.dir_country_regulations (currency);
CREATE INDEX IF NOT EXISTS dir_country_regulations_timezone_idx   ON public.dir_country_regulations (timezone);
CREATE INDEX IF NOT EXISTS dir_country_regulations_status_idx     ON public.dir_country_regulations (status);
CREATE INDEX IF NOT EXISTS dir_country_regulations_effective_idx  ON public.dir_country_regulations (effective_date);
CREATE INDEX IF NOT EXISTS dir_country_regulations_expiry_idx    ON public.dir_country_regulations (expiry_date);
CREATE INDEX IF NOT EXISTS dir_country_regulations_deleted_at_idx ON public.dir_country_regulations (deleted_at);

-- Trigger to update updated_at automatically
CREATE TRIGGER set_updated_at_dir_country_regulations
  BEFORE UPDATE ON dir_country_regulations
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
```

Ce modèle cible ajoute des champs pour les dimensions minimales des véhicules, les documents exigés, la gestion de l’historique des règles (dates d’effet/expiration), un statut et des métadonnées. Il remplace la chaîne libre `min_vehicle_class` par une clé étrangère vers la table des classes. Les champs d’audit permettent d’identifier qui a modifié les règles et de les désactiver sans perte d’historique.

## Impact sur les autres tables et services

1. **Vérification de conformité lors de l’enregistrement des véhicules** : les modules de gestion de flotte devront tenir compte des nouvelles colonnes (`min_vehicle_length`, `min_vehicle_width`, `min_vehicle_height`, `min_vehicle_class_id`) pour valider que les véhicules respectent les critères du pays du tenant. Si un véhicule est en dessous des dimensions requises ou dépasse l’âge maximal, il ne pourra pas être activé.
2. **Gestion des documents** : l’ajout d’une colonne ou d’une table `required_documents` permettra d’afficher dynamiquement la liste des pièces à fournir lors de l’onboarding d’un véhicule ou d’un chauffeur. Les formulaires et services devront adapter la logique de validation en conséquence.
3. **Facturation et tarification** : les modules de facturation continueront d’utiliser `min_fare_per_trip`, `min_fare_per_km`, `min_fare_per_hour` et `vat_rate`. L’ajout des dates d’effet permettra de recalculer les tarifs à partir d’une date donnée lors d’un changement réglementaire.
4. **Gestion des classes de véhicules** : remplacer `min_vehicle_class` par une clé étrangère nécessite de migrer les données existantes vers des identifiants dans `dir_vehicle_classes` et de maintenir la cohérence lors des mises à jour.
5. **Interfaces utilisateur** : les formulaires de création et de modification de règles devront gérer les nouvelles colonnes, afficher les champs pertinents selon le pays et permettre la consultation de l’historique.
6. **RLS et sécurité** : les politiques de sécurité devront restreindre la création/modification/suppression de ces règles aux rôles “provider admin” ou “super admin”, tout en autorisant la lecture aux autres rôles.

En résumé, la table `dir_country_regulations` actuelle fournit un référentiel minimal pour les paramètres réglementaires par pays. L’enrichissement proposé permettra de couvrir l’ensemble des exigences décrites dans la spécification (dimensions, documents, dates d’effet)【241590307805986†L138-L144】, de suivre l’historique des réglementations et de renforcer la traçabilité et la conformité tout en intégrant les règles dans les processus de gestion des véhicules, de facturation et de reporting.
