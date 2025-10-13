# Table `dir_platforms` – analyse et modèle cible

## Modèle existant (DDL Supabase)

La table `dir_platforms` référence les plateformes de transport avec chauffeur (Uber, Bolt, Careem, etc.) auxquelles les flottes se connectent. Chaque plateforme est définie globalement (sans champ `tenant_id`), car elle est partagée par tous les clients. Le schéma actuel est le suivant :

| Colonne      | Type          | Contraintes et index                                        | Description                                                                                       |
| ------------ | ------------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `id`         | `uuid`        | Clé primaire                                                | Identifiant unique de la plateforme.                                                              |
| `name`       | `text`        | Non nul, unique (`dir_platforms_name_uq`)                   | Nom de la plateforme (Uber, Bolt, Careem).                                                        |
| `api_config` | `jsonb`       | Nullable, index GIN (`dir_platforms_api_config_gin`)        | Configuration API générique (URL de base, informations d’authentification, champs personnalisés). |
| `created_at` | `timestamptz` | Non nul, défaut `CURRENT_TIMESTAMP`                         | Date de création.                                                                                 |
| `updated_at` | `timestamptz` | Non nul, défaut `CURRENT_TIMESTAMP`, mis à jour via trigger | Date de dernière mise à jour.                                                                     |

Contraintes et index :

- La clé primaire porte sur `id`.
- L’index unique `dir_platforms_name_uq` empêche d’enregistrer deux plateformes portant le même nom.
- Le champ `api_config` est indexé par un GIN pour permettre la recherche dans la configuration.
- Un trigger `set_updated_at_dir_platforms` met à jour `updated_at` automatiquement lors des modifications.

## Règles métiers et processus identifiés

Le module **Platforms & Services Directory** décrit dans la spécification indique que Fleetcore maintient un annuaire des plateformes de covoiturage et de services associés. Cette table est utilisée comme référentiel pour les intégrations de données et la configuration des commissions. Les principales règles sont :

1. **Métadonnées par plateforme** : pour chaque plateforme, il est nécessaire d’enregistrer l’URL de base de l’API, la méthode d’authentification (OAuth, clé API, JWT), la fréquence de rafraîchissement des données et les services proposés (transport, livraison de repas)【611243862873268†L268-L280】. L’actuelle colonne `api_config` permet de stocker ces informations sous forme de JSON, mais elles ne sont pas normalisées.
2. **Paramètres spécifiques au tenant** : la spécification précise que des paramètres comme le pourcentage de commission par défaut, les classes de véhicules acceptées et les documents requis peuvent varier selon le tenant【611243862873268†L268-L280】. Ces valeurs ne doivent pas être stockées dans `dir_platforms` mais dans une table de configuration par tenant (par exemple `adm_tenant_platform_settings`), afin de respecter l’isolement multi‑tenant.
3. **Sécurité des identifiants** : les identifiants API (clés secrètes, tokens) ne doivent pas être stockés en clair dans `api_config`. Ils doivent être chiffrés et accessibles uniquement via un service sécurisé. La spécification mentionne que les modules d’intégration stockent les identifiants API par plateforme et par tenant et gèrent les échecs de synchronisation de manière sécurisée【567670092230000†L127-L146】.
4. **Réutilisation et extensibilité** : le directory doit permettre d’ajouter facilement de nouvelles plateformes (Careem, Uklon, Yango…) sans modifier la structure. L’unicité sur `name` évite les doublons, et l’utilisation d’un JSON pour la configuration permet de stocker des champs spécifiques non prévus à l’origine.
5. **Usage dans les modules d’intégration** : lors de la synchronisation des données, l’intégration utilise la configuration de `dir_platforms` (URL, auth) et des paramètres du tenant pour récupérer et pousser des données (statuts des chauffeurs, trips, documents)【567670092230000†L127-L146】. Les journaux d’erreurs et de tentatives sont gérés par les services d’intégration.

## Propositions d’amélioration

Pour renforcer la normalisation, la sécurité et la facilité de maintenance, les améliorations suivantes sont proposées :

1. **Séparer la configuration API dans une table dédiée** : créer une table `dir_platform_configs` avec des colonnes explicites : `platform_id`, `api_base_url`, `auth_method`, `refresh_frequency_minutes`, `supported_services` (JSON ou table de relation), `documentation_url`, `metadata`. Cette table garderait un enregistrement par plateforme. Le JSON `api_config` actuel serait décomposé ou conservé pour les champs non standard.
2. **Ajouter des champs fonctionnels** : dans `dir_platforms`, ajouter un champ `code` (`varchar(50)`), identifiant court et stable pour utilisation en code (slug). Ajouter `status` (`active`, `inactive`, `deprecated`) pour désactiver une intégration sans la supprimer. Un champ `description` pourrait également expliquer la plateforme et ses limitations.
3. **Audit et soft‑delete** : ajouter `created_by`, `updated_by`, `deleted_at`, `deleted_by`, `deletion_reason` pour aligner avec les autres tables. Les suppressions seraient logiques et auditables via `adm_audit_logs`.
4. **Support multi‑fournisseur** : prévoir un champ `provider` ou `category` pour distinguer les plateformes de transport, de livraison, de paiement, etc., et permettre l’extension à d’autres types de services (food delivery, scooter sharing). On peut aussi prévoir une table de relation `dir_platform_supported_services` liant une plateforme à des services (ride‑hailing, food delivery, cargo, etc.).
5. **Gestion des secrets** : ne pas stocker les clés API dans cette table. Mettre en place un coffre‑fort (ex. Vault) et stocker dans `dir_platforms` uniquement un identifiant de secret ou un alias. Les services d’intégration récupéreront les secrets via un service d’authentification sécurisé.
6. **Gestion du versionning et de la compatibilité** : ajouter des colonnes `api_version` et `schema_version` pour suivre les évolutions de l’API et activer les migrations automatiques lorsque les plateformes changent de version.
7. **Support plug‑and‑play** : pour faciliter l’ajout d’une nouvelle plateforme sans modification du code, prévoir des champs génériques `settings_schema` (JSON décrivant les paramètres attendus) et `webhook_endpoints` (liste d’URL de callback). Les administrateurs pourront configurer ces champs et les services d’intégration chargeront la configuration dynamiquement.

## Modèle cible (DDL amélioré)

Le DDL suivant illustre une version enrichie et normalisée de la table `dir_platforms` et de sa table de configuration. Il reste compatible avec les données existantes en conservant la clé primaire et le nom unique, tout en ajoutant des colonnes pour la gestion, la sécurité et la flexibilité :

```sql
CREATE TABLE public.dir_platforms (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4 (),
  code varchar(50) NOT NULL UNIQUE,
  name text NOT NULL,
  description text NULL,
  status varchar(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive','deprecated')),
  provider_category varchar(50) NULL, -- ride_hailing, delivery, scooter, etc.
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NULL REFERENCES adm_provider_employees(id) ON UPDATE CASCADE ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid NULL REFERENCES adm_provider_employees(id) ON UPDATE CASCADE ON DELETE SET NULL,
  deleted_at timestamptz NULL,
  deleted_by uuid NULL REFERENCES adm_provider_employees(id) ON UPDATE CASCADE ON DELETE SET NULL,
  deletion_reason text NULL
);

-- Table séparée pour la configuration API
CREATE TABLE public.dir_platform_configs (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4 (),
  platform_id uuid NOT NULL REFERENCES dir_platforms(id) ON UPDATE CASCADE ON DELETE CASCADE,
  api_base_url text NOT NULL,
  auth_method varchar(50) NOT NULL, -- oauth2, api_key, basic_auth
  refresh_frequency_minutes integer NOT NULL DEFAULT 60,
  supported_services jsonb NOT NULL DEFAULT '{}'::jsonb, -- e.g. {"ride_hailing": true, "food_delivery": false}
  api_version varchar(20) NULL,
  schema_version varchar(20) NULL,
  settings_schema jsonb NULL, -- JSON schema describing tenant‑specific settings to configure
  webhook_endpoints jsonb NULL, -- List of webhook endpoints (for incoming notifications)
  documentation_url text NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NULL REFERENCES adm_provider_employees(id) ON UPDATE CASCADE ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid NULL REFERENCES adm_provider_employees(id) ON UPDATE CASCADE ON DELETE SET NULL,
  deleted_at timestamptz NULL,
  deleted_by uuid NULL REFERENCES adm_provider_employees(id) ON UPDATE CASCADE ON DELETE SET NULL,
  deletion_reason text NULL,
  UNIQUE (platform_id)
);

-- Indexes
CREATE UNIQUE INDEX IF NOT EXISTS dir_platforms_code_uq      ON public.dir_platforms (code) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS dir_platforms_name_uq      ON public.dir_platforms (name) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS dir_platforms_status_idx          ON public.dir_platforms (status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS dir_platforms_provider_idx        ON public.dir_platforms (provider_category);
CREATE INDEX IF NOT EXISTS dir_platforms_deleted_at_idx      ON public.dir_platforms (deleted_at);

CREATE INDEX IF NOT EXISTS dir_platform_configs_platform_idx ON public.dir_platform_configs (platform_id);
CREATE INDEX IF NOT EXISTS dir_platform_configs_auth_idx     ON public.dir_platform_configs (auth_method);
CREATE INDEX IF NOT EXISTS dir_platform_configs_deleted_idx  ON public.dir_platform_configs (deleted_at);

-- Trigger to update updated_at automatically
CREATE TRIGGER trg_update_dir_platforms
  BEFORE UPDATE ON dir_platforms
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER trg_update_dir_platform_configs
  BEFORE UPDATE ON dir_platform_configs
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
```

## Impact sur les autres tables et services

1. **Intégration et synchronisation** : les services d’intégration utiliseront `dir_platforms.code` pour identifier la plateforme et iront chercher la configuration API dans `dir_platform_configs` ainsi que les paramètres spécifiques au tenant (dans une table `adm_tenant_platform_settings` à créer). Un champ `api_version` permettra de gérer les mises à jour d’API sans casser les intégrations existantes.
2. **Support multi‑tenant** : la séparation des paramètres d’intégration par tenant évitera de stocker des commissions, des seuils et des documents requis dans cette table ; ces champs seront gérés dans une table de configuration par tenant. Les politiques RLS restreindront l’accès à ces données au tenant concerné.
3. **Gestion de la sécurité** : l’utilisation d’un coffre‑fort pour les secrets impose de modifier les services d’intégration qui devront récupérer les identifiants API via un service sécurisé. Les colonnes `auth_method` et `api_base_url` restent publiques, mais les tokens sont absents de la base.
4. **Modèle de données** : l’ajout des champs `code`, `status` et des métadonnées, ainsi que la table `dir_platform_configs`, n’affecte pas la clé primaire. Une migration devra renseigner un `code` unique pour les plateformes existantes (par exemple `uber`, `bolt`), et déplacer le JSON `api_config` dans la nouvelle table.
5. **Interfaces utilisateur** : l’écran d’administration des plateformes affichera les nouveaux champs (slug, description, statut) et permettra de configurer les paramètres génériques (API base URL, méthode d’authentification, services supportés). Les paramètres spécifiques au tenant seront gérés sur un autre écran.
6. **Audit et conformité** : les colonnes d’audit et de soft‑delete assureront la traçabilité. Les suppressions logiques et les statuts éviteront de perdre des historiques en cas de désactivation temporaire d’une plateforme.

En conclusion, la table `dir_platforms` telle qu’elle existe permet de référencer les plateformes de covoiturage de manière basique. Pour répondre aux besoins de Fleetcore et permettre une gestion multi‑pays et multi‑services, il est recommandé de normaliser la configuration, de sécuriser les secrets et d’introduire des champs d’audit et de statut. Le modèle cible proposé prépare la plateforme à intégrer de nouveaux services (ride‑hailing, livraison, scooters) de manière plug‑and‑play tout en conservant la compatibilité avec les données existantes.
