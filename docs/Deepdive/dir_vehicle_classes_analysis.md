# Table `dir_vehicle_classes` – analyse et modèle cible

## Modèle existant (DDL Supabase)

La table `dir_vehicle_classes` permet de définir des **classes de véhicules**
par **pays**. Elle sert de référentiel pour imposer des conditions
minimales (âge, dimensions, capacité) lors de l’immatriculation des
véhicules et de l’intégration avec les plateformes de covoiturage. Le
schéma actuel est le suivant :

| Colonne        | Type          | Contraintes et index                                                             | Description                                                   |
| -------------- | ------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| `id`           | `uuid`        | Clé primaire                                                                     | Identifiant unique de la classe.                              |
| `country_code` | `char(2)`     | **NOT NULL**, FK → `dir_country_regulations(country_code)`                       | Pays auquel s’applique la classe.                             |
| `name`         | `text`        | **NOT NULL**, unique avec `country_code` (`dir_vehicle_classes_country_name_uq`) | Nom de la classe (par ex. « sedan », « van », « limousine »). |
| `description`  | `text`        | Nullable                                                                         | Description libre de la classe.                               |
| `max_age`      | `integer`     | Nullable                                                                         | Âge maximal permis pour cette classe (en années).             |
| `created_at`   | `timestamptz` | **NOT NULL**, défaut `CURRENT_TIMESTAMP`                                         | Date de création.                                             |
| `updated_at`   | `timestamptz` | **NOT NULL**, défaut `CURRENT_TIMESTAMP`, mis à jour via trigger                 | Date de dernière modification.                                |

Contraintes et index :

- **Clé primaire** sur `id`.
- **Clé étrangère** : `country_code` référence la table
  `dir_country_regulations` (sur cascade à la suppression). Cela
  garantit qu’une classe n’est définie que pour des pays existants.
- **Index unique partiel** : `(country_code, name)` (sur les lignes non supprimées) pour éviter les doublons.
- **Index** sur `country_code`, `created_at` et `updated_at` pour
  accélérer les requêtes.
- **Trigger** `set_updated_at_dir_vehicle_classes` pour mettre à jour
  automatiquement `updated_at` à chaque modification.

Limitations du modèle actuel :

1. **Pas de soft‑delete** : il manque des colonnes `deleted_at`,
   `deleted_by` et `deletion_reason` pour supprimer logiquement une
   classe sans perdre l’historique.
2. **Pas d’audit** : les colonnes `created_by` et `updated_by`
   sont absentes. On ne sait pas qui a créé ou modifié une classe, ce qui
   est gênant pour les audits et la conformité.
3. **Manque de granularité** : seul l’âge maximum est stocké.
   La spécification fonctionnelle indique que les classes de véhicules
   doivent permettre de définir des **tailles minimales (longueur,
   largeur), capacités passagers, poids**, etc., pour respecter
   les réglementations locales et les exigences des plateformes
   【567670092230000†L32-L45】. Le modèle actuel ne stocke pas ces
   informations.
4. **Pas de statut ni de code** : il n’existe pas de champ `status`
   pour activer/désactiver une classe, ni de `code` court (slug) pour
   identifier une classe en interne. L’unicité repose uniquement sur le
   nom, qui est sensible à la casse et aux traductions.
5. **Multi‑tenant** : les classes sont définies par pays et non par
   tenant. Or la spécification mentionne que des classes
   **personnalisées** (sedan, estate, van, limousine) peuvent être
   définies par les tenants avec des critères de taille et d’âge
   spécifiques【567670092230000†L32-L45】. Le modèle actuel ne prévoit
   pas cette personnalisation.

## Règles métiers et processus identifiés

Les règles métiers suivantes découlent de la spécification et du
fonctionnement actuel :

1. **Référentiel de classes par pays** : chaque pays peut définir ses
   propres classes de véhicules. Par exemple, les Émirats Arabes Unis
   peuvent avoir des classes “Standard”, “Luxury” ou “SUV” avec un âge
   maximal de 5 ans, tandis que la France peut imposer des
   dimensions minimales ou des vignettes【567670092230000†L32-L45】.
2. **Utilisation lors de l’onboarding des véhicules** : lorsqu’un
   gestionnaire enregistre un véhicule, il doit sélectionner la classe
   adéquate. L’application vérifie alors que le véhicule respecte les
   critères de la classe (âge, dimensions, nombre de sièges). Si la
   classe n’est pas respectée, le véhicule est refusé ou marqué non
   conforme.
3. **Intégration avec les plateformes** : certaines plateformes de
   ride‑hailing n’acceptent que certaines classes de véhicules. Par
   exemple, Uber Black peut exiger la classe “Luxury”, tandis qu’Uber
   X accepte “Standard” et “Van”. Les intégrations lisent le
   référentiel de classes pour savoir quels véhicules peuvent être
   synchronisés pour un tenant donné【611243862873268†L268-L280】.
4. **Support réglementaire** : la table est liée à
   `dir_country_regulations`, qui définit l’âge maximum global et le
   taux de TVA par pays. Pour certaines juridictions, la classe
   minimale autorisée (stockée dans `dir_country_regulations.min_vehicle_class` dans le modèle cible) détermine les
   véhicules qui peuvent opérer【611243862873268†L268-L280】.
5. **Audit et conformité** : toute création, modification ou suppression
   devrait être enregistrée dans `adm_audit_logs` avec
   l’identifiant de l’employé, l’heure et les champs modifiés. Le
   modèle actuel ne permet pas de savoir qui a créé ou modifié une
   classe.
6. **Soft‑delete et historique** : il doit être possible de retirer
   une classe (“SUV”) si elle n’est plus autorisée dans un pays sans
   supprimer les véhicules existants qui y sont associés. Une
   suppression logique (`deleted_at`) permettra de cacher la classe
   tout en conservant l’historique.
7. **Gestion des classes personnalisées** : si un tenant souhaite
   définir une classe “Luxury Sedan” avec des critères plus exigeants,
   il ne doit pas modifier la ligne globale mais créer une entrée dans
   une table dédiée (par exemple `adm_tenant_vehicle_classes`). Le
   système doit donc distinguer les classes **réglementaires** (par
   pays) et les classes **tenant‑spécifiques**.

## Propositions d’amélioration et modèle cible

Pour rendre la gestion des classes de véhicules plus complète et
multi‑juridiction, les améliorations suivantes sont proposées :

1. **Élargir la structure** : ajouter des colonnes pour les critères
   réglementaires : `min_length_cm`, `min_width_cm`, `min_height_cm`,
   `min_seats`, `max_seats`, `min_age`, en plus de `max_age`. Ces
   informations permettront de valider automatiquement l’éligibilité
   d’un véhicule en fonction des normes du pays【567670092230000†L32-L45】.
2. **Ajouter un champ `code` et `status`** : un slug
   (`varchar(50)`) unique par pays facilitera la référence aux classes
   dans le code. Le champ `status` (`active`, `inactive`,
   `deprecated`) permettra de désactiver une classe sans la supprimer.
3. **Audit et soft‑delete** : ajouter les colonnes `created_by`,
   `updated_by`, `deleted_at`, `deleted_by` et `deletion_reason` pour
   tracer les changements et permettre une suppression logique.
4. **Métadonnées extensibles** : ajouter une colonne `metadata jsonb`
   pour stocker des informations spécifiques à certaines
   juridictions (par exemple obligation de vignette, type de plaque ou
   exigence de badge). Cela rendra la table évolutive sans modifier le
   schéma à chaque nouvelle règle.
5. **Table de classes personnalisées** : pour permettre aux tenants
   d’avoir leurs propres classes (avec des noms et des critères
   spécifiques), créer une table `adm_tenant_vehicle_classes` avec
   `tenant_id`, `name`, `slug`, `description`, `criteria jsonb`, etc.
   Chaque tenant pourra ainsi définir ses classes sans modifier les
   classes réglementaires.
6. **Normaliser les relations** : ajouter un champ
   `country_code` dans les véhicules et intégrer `dir_vehicle_classes`
   via la clé primaire de la classe. Pour que `dir_country_regulations`
   puisse indiquer la classe minimale autorisée, il est recommandé de
   changer `min_vehicle_class` de `text` à `uuid` (FK →
   `dir_vehicle_classes`).

### Exemple de DDL cible

Ci‑dessous un exemple de schéma enrichi respectant les propositions ci‑dessus :

```sql
CREATE TABLE public.dir_vehicle_classes (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4 (),
  country_code char(2) NOT NULL REFERENCES dir_country_regulations(country_code) ON UPDATE CASCADE ON DELETE CASCADE,
  code varchar(50) NOT NULL,
  name text NOT NULL,
  description text NULL,
  min_length_cm integer NULL,
  min_width_cm integer NULL,
  min_height_cm integer NULL,
  min_seats integer NULL,
  max_seats integer NULL,
  min_age integer NULL,
  max_age integer NULL,
  status varchar(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive','deprecated')),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NULL REFERENCES adm_provider_employees(id) ON UPDATE CASCADE ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid NULL REFERENCES adm_provider_employees(id) ON UPDATE CASCADE ON DELETE SET NULL,
  deleted_at timestamptz NULL,
  deleted_by uuid NULL REFERENCES adm_provider_employees(id) ON UPDATE CASCADE ON DELETE SET NULL,
  deletion_reason text NULL,
  UNIQUE (country_code, code) WHERE deleted_at IS NULL,
  UNIQUE (country_code, name) WHERE deleted_at IS NULL
);

-- Indexes utiles
CREATE INDEX IF NOT EXISTS dir_vehicle_classes_country_status_idx ON public.dir_vehicle_classes(country_code, status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS dir_vehicle_classes_country_code_idx ON public.dir_vehicle_classes(country_code);
CREATE INDEX IF NOT EXISTS dir_vehicle_classes_deleted_at_idx ON public.dir_vehicle_classes(deleted_at);

-- Table pour les classes personnalisées par tenant
CREATE TABLE public.adm_tenant_vehicle_classes (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4 (),
  tenant_id uuid NOT NULL REFERENCES adm_tenants(id) ON UPDATE CASCADE ON DELETE CASCADE,
  code varchar(50) NOT NULL,
  name text NOT NULL,
  description text NULL,
  criteria jsonb NOT NULL DEFAULT '{}'::jsonb,
  status varchar(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive','deprecated')),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NULL REFERENCES adm_provider_employees(id) ON UPDATE CASCADE ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid NULL REFERENCES adm_provider_employees(id) ON UPDATE CASCADE ON DELETE SET NULL,
  deleted_at timestamptz NULL,
  deleted_by uuid NULL REFERENCES adm_provider_employees(id) ON UPDATE CASCADE ON DELETE SET NULL,
  deletion_reason text NULL,
  UNIQUE (tenant_id, code) WHERE deleted_at IS NULL,
  UNIQUE (tenant_id, name) WHERE deleted_at IS NULL
);

CREATE INDEX IF NOT EXISTS adm_tenant_vehicle_classes_tenant_status_idx ON public.adm_tenant_vehicle_classes(tenant_id, status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS adm_tenant_vehicle_classes_deleted_at_idx ON public.adm_tenant_vehicle_classes(deleted_at);
```

## Impact sur les autres tables et services

1. **Table `dir_country_regulations`** : modifier la colonne
   `min_vehicle_class` pour qu’elle référence le `id` de
   `dir_vehicle_classes` au lieu d’un texte libre (facilitant les
   contraintes d’intégrité). Ajouter les champs de dimensions et de
   documents demandés par pays (voir l’analyse de `dir_country_regulations`).
2. **Table `dir_car_models`** : elle référence un `vehicle_class_id`
   facultatif. Avec les nouvelles colonnes, le modèle d’un véhicule
   pourra récupérer plus de critères (dimensions, nombre de sièges) pour
   valider son admissibilité. Il faudra mettre à jour les pages de
   gestion des modèles pour sélectionner la classe et afficher ses
   critères.
3. **Table `flt_vehicles`** : lors de l’ajout d’un véhicule, le service
   doit vérifier que les dimensions, l’année de fabrication et la
   capacité correspondent aux critères de la classe sélectionnée. Si
   l’utilisateur utilise une classe personnalisée (`adm_tenant_vehicle_classes`), il
   faudra charger ses critères et vérifier la conformité.
4. **Processus d’onboarding et de reporting** : le front‑end doit
   afficher les classes disponibles pour le pays du tenant et, si les
   classes personnalisées sont activées, proposer celles du tenant. Le
   reporting (répartition des classes dans la flotte) devra prendre en
   compte à la fois les classes réglementaires et personnalisées.
5. **Sécurité et RLS** : la table
   `dir_vehicle_classes` reste globale mais seules les équipes
   Fleetcore peuvent la modifier. Les classes personnalisées sont
   filtrées par `tenant_id` via les politiques RLS. Les audits des
   modifications seront enregistrés dans `adm_audit_logs`.
6. **Migration** : pour appliquer le modèle cible, il faudra créer les
   nouvelles colonnes et la table `adm_tenant_vehicle_classes`, puis
   migrer les valeurs existantes. La colonne `max_age` pourra être
   renommée ou copiée dans `max_age`, et les champs de dimensions
   devront être renseignés à partir des réglementations locales si
   disponibles. Les classes existantes recevront un `code`
   généré automatiquement (slug) à partir du nom.

En implémentant ces améliorations, Fleetcore disposera d’un référentiel
de classes de véhicules **plug‑and‑play** capable de s’adapter à
plusieurs pays et de permettre des extensions spécifiques par tenant, tout
en assurant l’intégrité des données et la conformité réglementaire.
