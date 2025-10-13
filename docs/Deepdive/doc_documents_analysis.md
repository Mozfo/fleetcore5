# Table `doc_documents` – analyse et modèle cible

## Modèle existant (DDL Supabase)

La table `doc_documents` sert de **référentiel central** pour stocker
les documents attachés à différentes entités (véhicules, chauffeurs,
utilisateurs, contrats…). Elle est multi‑tenant : chaque ligne porte
un `tenant_id` afin de garantir que les locataires ne puissent pas
accéder aux documents des autres.

Schéma actuel :

| Colonne         | Type          | Contraintes et index                                                                                                                                                                 | Description                                                     |
| --------------- | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------- |
| `id`            | `uuid`        | Clé primaire, générée automatiquement.                                                                                                                                               | Identifiant unique du document.                                 |
| `tenant_id`     | `uuid`        | **NOT NULL**, FK → `adm_tenants(id)`, index `doc_documents_tenant_id_idx`                                                                                                            | Locataire propriétaire du document.                             |
| `entity_type`   | `text`        | **NOT NULL**, contrainte `CHECK` (valeurs : `flt_vehicle`, `rid_driver`, `adm_member`, `contract`).                                                                                  | Type d’entité à laquelle le document est attaché.               |
| `entity_id`     | `uuid`        | **NOT NULL**, index `doc_documents_entity_id_idx`; index composite `(tenant_id, entity_type, entity_id)`.                                                                            | Identifiant de l’entité (véhicule, driver, membre…).            |
| `document_type` | `text`        | **NOT NULL**, contrainte `CHECK` (valeurs : `registration`, `insurance`, `visa`, `residence_visa`, `emirates_id`, `platform_approval`, `other`), index `(tenant_id, document_type)`. | Catégorie de document.                                          |
| `file_url`      | `text`        | **NOT NULL**.                                                                                                                                                                        | URL ou clé de stockage du fichier (S3, Supabase Storage, etc.). |
| `issue_date`    | `date`        | Nullable.                                                                                                                                                                            | Date d’émission du document.                                    |
| `expiry_date`   | `date`        | Nullable, index `doc_documents_expiry_date_idx`.                                                                                                                                     | Date d’expiration du document (utilisée pour les rappels).      |
| `verified`      | `boolean`     | **NOT NULL**, défaut `false`.                                                                                                                                                        | Indique si le document a été vérifié.                           |
| `created_at`    | `timestamptz` | **NOT NULL**, défaut `CURRENT_TIMESTAMP`, index.                                                                                                                                     | Date de création.                                               |
| `updated_at`    | `timestamptz` | **NOT NULL**, défaut `CURRENT_TIMESTAMP`, mis à jour par trigger.                                                                                                                    | Date de dernière mise à jour.                                   |

Contraintes et index :

- Clé primaire sur `id`.
- Clé étrangère sur `tenant_id`, cascade de suppression si le locataire est supprimé.
- Contraintes `CHECK` pour `entity_type` et `document_type` afin de limiter les valeurs autorisées.
- Index sur `tenant_id`, `entity_id`, `entity_type`, `document_type`,
  `expiry_date`, `created_at`, `updated_at` et index composites pour
  optimiser les requêtes.
- Trigger `set_updated_at_doc_documents` pour mettre à jour
  automatiquement `updated_at` à chaque modification.

Limitations du schéma actuel :

1. **Absence de métadonnées** : le modèle actuel ne stocke pas la taille
   du fichier (`file_size`), son type MIME (`mime_type`), le nom
   original du fichier (`file_name`) ni un champ `metadata` pour des
   informations supplémentaires. La spécification prévoit pourtant un
   stockage générique des documents avec ces attributs et un champ
   `metadata` pour étendre le modèle【241590307805986†L138-L144】.
2. **Pas de traçabilité de la vérification** : seules deux valeurs
   (`verified` booléen) indiquent l’état de vérification. Les
   informations sur **qui** a vérifié (`verified_by`) et **quand**
   (`verified_at`) sont absentes alors qu’elles sont essentielles pour
   l’audit et la conformité.
3. **Pas de soft‑delete ni d’audit** : il manque des colonnes
   `deleted_at`, `deleted_by`, `deletion_reason` ainsi que
   `created_by` et `updated_by` pour savoir quels utilisateurs ont
   créé/modifié/supprimé un document.
4. **Enumérations figées** : les listes de `entity_type` et
   `document_type` sont codées en dur dans la contrainte `CHECK`. Cela
   complique l’ajout de nouveaux types de documents ou d’entités
   (par exemple, un futur type `invoice` ou `support_ticket`).
5. **Gestion des accès et des droits** : le champ `file_url` est un
   simple texte qui peut pointer vers un stockage public ou privé. Le
   modèle ne prévoit pas de champ `access_level` ou `storage_provider`
   pour gérer les droits d’accès et la provenance du fichier.

## Règles métiers et processus identifiés

En s’appuyant sur la spécification et les documents du projet, les
règles métiers suivantes se dégagent :

1. **Rattaché à un tenant et à une entité** : chaque document est
   associé à un `tenant_id`, un `entity_type` et un `entity_id`. Les
   politiques RLS s’assurent que les utilisateurs ne voient que les
   documents de leur tenant, conformément au principe d’isolation
   multi‑tenant【966139222788857†L139-L146】. De plus, la suppression
   d’un tenant entraîne la suppression en cascade de ses documents.
2. **Types de documents** : les documents couvrent diverses
   catégories : immatriculation et assurance des véhicules,
   pièces d’identité (visa, emirates ID), documents des membres,
   documents contractuels, etc. La liste varie selon les pays et les
   plateformes (par exemple, en France une carte professionnelle VTC
   est requise, aux Émirats un visa de travail ou un Emirates ID). Le
   modèle doit pouvoir s’adapter à de nouvelles catégories.
3. **Cycle de vie et vérification** : lorsqu’un document est déposé,
   son statut est `pending` par défaut (`verified = false`). Un
   administrateur peut ensuite vérifier ou rejeter le document, en
   indiquant la raison du rejet et en notant la date de vérification.
   Les documents expirés ou non vérifiés doivent déclencher des
   notifications pour renouvellement.
4. **Gestion du stockage** : les fichiers sont stockés dans un service
   externe (S3, Supabase Storage). Les URL de téléchargement ou les
   clés d’accès ne doivent pas être exposées publiquement. La table
   doit donc contenir uniquement des identifiants et non des URL
   directes ou des clés privées. Les services d’upload doivent gérer
   l’expiration des liens et le chiffrement.
5. **Audit et conformité** : chaque création, mise à jour, vérification
   ou suppression de document doit être tracée dans `adm_audit_logs`
   avec l’identifiant du membre ou de l’employé et l’IP
   d’origine. Le modèle actuel ne contient pas de champ pour ces
   informations.
6. **Indexation pour les notifications** : les documents dont
   `expiry_date` approche doivent être identifiés pour envoyer des
   rappels. L’index `doc_documents_expiry_date_idx` répond à ce
   besoin. En revanche, une colonne `status` (pending, verified,
   rejected, expired) faciliterait encore ce type de requêtes.

## Propositions d’amélioration et modèle cible

Afin d’enrichir la gestion des documents et de préparer Fleetcore à
accueillir de nouvelles catégories et entités, les améliorations
suivantes sont proposées :

1. **Ajouter des champs de métadonnées** : inclure `file_name`,
   `file_size` et `mime_type` pour stocker des informations de base sur
   le document. Ajouter `metadata jsonb` pour étendre le modèle.
2. **Gestion de la vérification** : remplacer le booléen `verified` par
   un champ `verification_status` (`pending`, `verified`, `rejected`),
   et ajouter `verified_by` (FK → `adm_members` ou `adm_provider_employees`),
   `verified_at` (timestamptz) et `rejection_reason` (text).
3. **Soft‑delete et audit** : ajouter `deleted_at`, `deleted_by` et
   `deletion_reason` ainsi que `created_by` et `updated_by` pour
   connaître l’auteur des opérations.
4. **Normaliser les types** : remplacer les `CHECK` par des
   **énumérations** ou des tables de référence pour `document_type` et
   `entity_type` afin d’ajouter facilement de nouvelles valeurs. Par
   exemple, créer `doc_document_types (code, name, description)` et
   `doc_entity_types (code, description)`. Les contraintes
   référentielles assureront la validité des valeurs.
5. **Gestion du stockage** : remplacer `file_url` par `storage_key` et
   ajouter un champ `storage_provider` (`supabase`, `s3`,
   `azure_blob`, etc.) pour identifier l’emplacement du fichier. Un
   champ `access_level` (`private`, `public`, `signed`) pourra
   déterminer la visibilité du document.
6. **Étendre les entités supportées** : autoriser d’autres entités
   telles que `flt_vehicle_maintenance`, `bil_invoice`, `sup_ticket`,
   etc., en ajoutant les codes appropriés à `doc_entity_types`.
7. **Ajout d’un champ `status` et `expiry_notification_sent`** :
   permettre de marquer un document comme `expired` ou
   `notification_sent` pour ne pas envoyer plusieurs rappels.
8. **Mécanisme de versionnement** : pour certains documents (contrats,
   licences), garder un historique des versions. On peut créer
   `doc_document_versions` qui référence le document principal et
   stocke chaque version avec un `version_number` et un lien vers le
   fichier.

### Exemple de DDL cible

Voici un exemple de schéma enrichi :

```sql
CREATE TABLE public.doc_document_types (
  code varchar(50) PRIMARY KEY,
  name text NOT NULL,
  description text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NULL REFERENCES adm_provider_employees(id) ON UPDATE CASCADE ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid NULL REFERENCES adm_provider_employees(id) ON UPDATE CASCADE ON DELETE SET NULL,
  deleted_at timestamptz NULL,
  deleted_by uuid NULL REFERENCES adm_provider_employees(id) ON UPDATE CASCADE ON DELETE SET NULL,
  deletion_reason text NULL
);

CREATE TABLE public.doc_documents (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4 (),
  tenant_id uuid NOT NULL REFERENCES adm_tenants(id) ON UPDATE CASCADE ON DELETE CASCADE,
  entity_type varchar(50) NOT NULL REFERENCES doc_entity_types(code),
  entity_id uuid NOT NULL,
  document_type varchar(50) NOT NULL REFERENCES doc_document_types(code),
  storage_provider varchar(50) NOT NULL DEFAULT 'supabase',
  storage_key text NOT NULL,
  file_name text NOT NULL,
  file_size integer NOT NULL,
  mime_type varchar(100) NOT NULL,
  issue_date date NULL,
  expiry_date date NULL,
  verification_status varchar(20) NOT NULL DEFAULT 'pending' CHECK (verification_status IN ('pending','verified','rejected')),
  verified_by uuid NULL REFERENCES adm_members(id) ON UPDATE CASCADE ON DELETE SET NULL,
  verified_at timestamptz NULL,
  rejection_reason text NULL,
  access_level varchar(20) NOT NULL DEFAULT 'private' CHECK (access_level IN ('private','public','signed')),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NULL REFERENCES adm_members(id) ON UPDATE CASCADE ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid NULL REFERENCES adm_members(id) ON UPDATE CASCADE ON DELETE SET NULL,
  deleted_at timestamptz NULL,
  deleted_by uuid NULL REFERENCES adm_members(id) ON UPDATE CASCADE ON DELETE SET NULL,
  deletion_reason text NULL,
  UNIQUE (tenant_id, entity_type, entity_id, document_type, storage_key) WHERE deleted_at IS NULL
);

CREATE INDEX IF NOT EXISTS doc_documents_expiry_idx ON public.doc_documents(expiry_date) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS doc_documents_verification_status_idx ON public.doc_documents(verification_status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS doc_documents_entity_idx ON public.doc_documents(tenant_id, entity_type, entity_id) WHERE deleted_at IS NULL;

-- Table des entités supportées
CREATE TABLE public.doc_entity_types (
  code varchar(50) PRIMARY KEY,
  description text NOT NULL
);

-- Valeurs initiales des entités et types
INSERT INTO doc_entity_types (code, description) VALUES ('flt_vehicle','Véhicule');
INSERT INTO doc_entity_types (code, description) VALUES ('rid_driver','Chauffeur');
INSERT INTO doc_entity_types (code, description) VALUES ('adm_member','Membre');
INSERT INTO doc_entity_types (code, description) VALUES ('contract','Contrat');

-- Exemples de types de documents
INSERT INTO doc_document_types (code, name) VALUES ('registration','Carte grise');
INSERT INTO doc_document_types (code, name) VALUES ('insurance','Assurance');
INSERT INTO doc_document_types (code, name) VALUES ('visa','Visa');
INSERT INTO doc_document_types (code, name) VALUES ('residence_visa','Visa de résidence');
INSERT INTO doc_document_types (code, name) VALUES ('emirates_id','Emirates ID');
INSERT INTO doc_document_types (code, name) VALUES ('platform_approval','Homologation plateforme');
INSERT INTO doc_document_types (code, name) VALUES ('other','Autre');
```

## Impact sur les autres tables et services

1. **Services de gestion des documents** : le service d’upload devra
   renseigner `file_name`, `file_size`, `mime_type`, `storage_key` et
   `storage_provider` au lieu de `file_url`. Il devra également
   initialiser `verification_status = 'pending'` et gérer la mise à
   jour du statut lors de la vérification.
2. **Fonction de vérification** : lors de la vérification, le service
   devra renseigner `verified_by`, `verified_at` et éventuellement
   `rejection_reason`, et changer `verification_status` à `verified` ou
   `rejected`. Ces actions devront être enregistrées dans
   `adm_audit_logs` avec l’IP et l’utilisateur.
3. **Notifications** : les notifications de renouvellement utiliseront
   `expiry_date` et `verification_status` pour cibler les documents
   expirés ou non vérifiés. Un champ `expiry_notification_sent` ou un
   journal de notifications peut être ajouté pour éviter les doublons.
4. **Référentiels** : les tables `doc_document_types` et
   `doc_entity_types` permettront d’ajouter de nouveaux types sans
   modifier le schéma. Les interfaces d’administration devront offrir
   la possibilité de les gérer (ajouter/modifier/désactiver).
5. **RLS et sécurité** : la table reste filtrée par `tenant_id` via
   RLS. Les fichiers sont stockés dans un service externe ;
   `storage_provider` et `storage_key` doivent être utilisés par le
   backend pour générer des URL signées à durée limitée afin de
   sécuriser l’accès. Les secrets de stockage ne sont pas stockés dans
   la base.
6. **Migration** : lors de la migration, il faudra créer les tables de
   référence, ajouter les nouvelles colonnes, migrer les données
   existantes (copier `file_url` dans `storage_key`, ajouter des
   valeurs par défaut pour `storage_provider`, etc.), et renseigner
   `verification_status = 'verified'` pour les lignes dont
   `verified = true` actuellement. Un script devra remplir les tables
   de référence avec les types de documents existants.

En suivant ces recommandations, la gestion des documents sera
significativement enrichie et conforme aux besoins multi‑pays et
multi‑tenant de Fleetcore.
