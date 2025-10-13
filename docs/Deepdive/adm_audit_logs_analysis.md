# Analyse de la table `adm_audit_logs`

Cette analyse reprend la méthodologie appliquée aux autres tables du domaine
administration. Nous commençons par décrire le **modèle existant** fourni
par votre DDL Supabase, puis nous identifions les **règles métier**
déduites du code et de la spécification, avant de proposer des
**améliorations** et de présenter un **modèle cible** intégrant ces
modifications. L’objectif est de fournir une source unique de vérité
harmonisant les définitions de base de données, le code et les besoins
fonctionnels.

## 1. Modèle existant

La table `adm_audit_logs` est un journal immuable des actions
significatives effectuées dans la plateforme. Contrairement à d’autres
tables, elle ne comporte pas de soft‑delete ni de règles RLS : toutes
les entrées sont permanentes et lisibles par les employés Fleetcore.
Le DDL actuellement déployé est :

```sql
create table public.adm_audit_logs (
  id uuid not null default extensions.uuid_generate_v4 (),
  tenant_id uuid not null,
  member_id uuid null,
  entity character varying(50) not null,
  entity_id uuid not null,
  action character varying(50) not null,
  changes jsonb null,
  ip_address character varying(45) null,
  user_agent text null,
  timestamp timestamp with time zone not null default CURRENT_TIMESTAMP,
  constraint adm_audit_logs_pkey primary key (id),
  constraint adm_audit_logs_member_id_fkey foreign key (member_id) references adm_members (id) on update cascade on delete set null,
  constraint adm_audit_logs_tenant_id_fkey foreign key (tenant_id) references adm_tenants (id) on update cascade on delete cascade
);

-- Indexes
create index adm_audit_logs_tenant_entity_entity_id_idx on adm_audit_logs (tenant_id, entity, entity_id);
create index adm_audit_logs_timestamp_idx on adm_audit_logs ("timestamp" desc);
create index adm_audit_logs_changes_gin on adm_audit_logs using gin (changes);
create unique index adm_audit_logs_changes_idx on adm_audit_logs using gin (changes);
create index adm_audit_logs_tenant_id_idx on adm_audit_logs (tenant_id);
```

**Champs et contraintes :**

- `id` : identifiant UUID primaire.
- `tenant_id` : identifie l’organisation concernée, clé étrangère vers
  `adm_tenants(id)` avec suppression en cascade. Toutes les actions
  sont donc toujours rattachées à un tenant.
- `member_id` : utilisateur qui a effectué l’action, clé étrangère
  nullable vers `adm_members(id)`. Lorsque l’utilisateur est supprimé,
  la valeur est mise à `null`, conservant le log.
- `entity` : type de l’entité concernée, par exemple `adm_members`,
  `flt_vehicles` ou `rid_drivers`【310209321725136†L155-L166】. Ce champ est
  libre dans la DDL et n’est pas restreint par une énumération.
- `entity_id` : identifiant UUID de l’entité affectée.
- `action` : action réalisée (`create`, `update`, `delete`), libre lui
  aussi dans la DDL actuelle【310209321725136†L169-L170】.
- `changes` : objet JSON décrivant les modifications. Ce champ est
  optionnel et n’a pas de structure imposée【310209321725136†L171-L172】.
- `ip_address` et `user_agent` : informations de contexte ; toutes deux
  facultatives【310209321725136†L173-L176】.
- `timestamp` : date et heure de l’action, par défaut la date courante.
  Le nom `timestamp` étant un mot réservé, il est mieux d’utiliser
  `performed_at` ou `event_timestamp` pour éviter toute ambiguïté dans
  le code (le modèle Prisma utilise `performed_at`).

**Indexes et performances :** plusieurs indexes sont définis pour
accélérer les requêtes courantes : un index composite `(tenant_id,
entity, entity_id)` permet de lister les logs par ressource et tenant;
un index sur `timestamp` ordonné descendant facilite la consultation
chronologique; un index GIN sur `changes` permet de filtrer les logs
selon les champs modifiés【310209321725136†L180-L181】.

**RLS :** la documentation précise que les audits n’implémentent pas de
Row Level Security : toutes les entrées sont globalement accessibles
aux opérateurs internes【310209321725136†L153-L183】. On peut toutefois
ajouter des vues filtrées ou des API qui renvoient uniquement les logs
d’un tenant aux administrateurs de ce tenant.

## 2. Règles métier identifiées

Les logs d’audit sont alimentés par toutes les opérations sensibles de
l’application. La phase 0 fournit un service `logAudit` qui enregistre
l’action effectuée, l’entité visée et les changements dans la table
`adm_audit_logs`【667256955770467†L400-L419】. Les règles suivantes en
découlent :

### 2.1 Capturer le contexte complet

Pour chaque création, modification ou suppression d’entité, le service
`logAudit` doit être appelé avec un objet `AuditLogData` :

- `tenant_id` : identifiant du tenant auquel appartient la ressource.
- `user_id` : identifiant de l’utilisateur (membre) qui effectue
  l’opération【667256955770467†L395-L404】.
- `entity_type` et `entity_id` : nom de la table et identifiant de
  l’entité impactée【667256955770467†L395-L404】.
- `action` : nature de l’opération (create, update, delete, view,
  export, import, login, logout, permission_change)【667256955770467†L375-L381】.
- `changes` : un objet JSON qui décrit les anciennes et nouvelles
  valeurs pour chaque champ modifié【667256955770467†L400-L419】.
- `ip_address` et `user_agent` : extraits de la requête HTTP pour
  faciliter l’investigation en cas d’incident.
- `metadata` : permet d’ajouter des informations contextuelles
  facultatives (ex. ID de session, géolocalisation approximative,
  description métier). Le service `logAudit` l’enregistre comme un
  objet JSON【667256955770467†L418-L419】.

Le service capture l’horodatage via `performed_at: new Date()` et ne
bloque pas l’opération principale en cas d’erreur : en cas d’échec
d’insertion, il ignore l’erreur pour ne pas impacter l’expérience
utilisateur【667256955770467†L418-L425】. Cette tolérance est une bonne
pratique mais doit être couplée à un système de remontée d’erreur
ou de monitoring pour repérer les échecs récurrents.

### 2.2 Données immuables et auditables

Une entrée dans `adm_audit_logs` ne doit jamais être modifiée ni
supprimée. La spécification indique que cette table est **permanente**
et qu’elle ne met pas en œuvre de suppression logique ou de RLS【310209321725136†L150-L184】.
Les applications qui permettent de restaurer des données (par exemple un
rollback d’un véhicule) doivent enregistrer un nouvel événement plutôt
que d’altérer le log existant. L’immutabilité garantit l’intégrité
légale et réglementaire des audits.

### 2.3 Corrélation avec les accès et autorisations

Chaque action doit être liée à l’utilisateur (membre ou employé) qui
l’a déclenchée. Le service d’audit récupère l’identité à partir de la
session (Clerk) et vérifie que l’utilisateur appartient au même
tenant. En cas de process interne ou batch, `member_id` peut être
null et un champ `performed_by_type` (voir amélioration ci‑dessous)
peut préciser l’origine (`system`, `provider_staff`). Cela permet de
distinguer les actions des utilisateurs finaux, des opérations des
employés Fleetcore et des actions automatisées (CRON).

### 2.4 Structure des `changes`

Le champ `changes` contient actuellement un JSON libre. Pour garantir
une meilleure lisibilité et permettre des requêtes automatiques,
chaque enregistrement devrait structurer ce JSON avec deux clés
`old` et `new`, et indiquer pour chaque champ modifié les valeurs
précédente et actuelle. Par exemple :

```json
{
  "old": { "status": "inactive", "email": "john@example.com" },
  "new": { "status": "active", "email": "john@example.com" }
}
```

Une indexation partielle sur les clés les plus courantes (comme
`status`) permettrait ensuite de rechercher rapidement les entités dont
le statut a été modifié.

### 2.5 Respect des données sensibles

Les logs ne doivent jamais contenir de données sensibles en clair
(mots de passe, numéros de carte bancaire, données personnelles non
nécessaires). Le service d’audit doit filtrer ou masquer ces
informations avant l’insertion. Par exemple, on enregistre le numéro
de carte tronqué et non la PAN complète【571190288736298†L74-L79】. Cela
respecte les exigences PCI‑DSS et RGPD.

## 3. Propositions d’amélioration

Pour aligner le schéma de `adm_audit_logs` avec les besoins métiers et
le code, et pour respecter les bonnes pratiques, plusieurs
améliorations sont proposées :

### 3.1 Harmoniser les noms de colonnes

Le service d’audit utilise `user_id`, `entity_type`, `entity_id` et
`performed_at`, alors que le DDL actuel stocke `member_id`, `entity`,
`entity_id` et `timestamp`. Afin de réduire la confusion et de
faciliter l’ORM, nous suggérons de renommer :

- `member_id` → `user_id` : plus général, peut référencer un
  administrateur ou un employé.
- `entity` → `entity_type` : pour indiquer clairement qu’il s’agit du
  type de ressource.
- `timestamp` → `performed_at` : évite les collisions avec le mot
  réservé « timestamp » et s’aligne avec l’implémentation.

### 3.2 Introduire des énumérations

Pour éviter les fautes de frappe et faciliter les contrôles
d’autorisation, il est recommandé de limiter `entity_type` et
`action` à des ensembles connus. La définition TypeScript
`AuditEntity` mentionne des valeurs comme `vehicle`, `driver`, `trip`,
`document`, `user`, `role`, `invoice`, `payment`, `ticket` et `tenant`【667256955770467†L382-L392】.
`AuditAction` inclut `create`, `update`, `delete`, `view`, `export`,
`import`, `login`, `logout` et `permission_change`【667256955770467†L375-L381】. Une
contrainte `CHECK` sur ces colonnes permettrait de prévenir des
valeurs incohérentes.

### 3.3 Ajouter une colonne `metadata`

Le DDL actuel ne prévoit pas de champ `metadata`, alors que le service
d’audit enregistre des métadonnées optionnelles. Ajouter
`metadata jsonb not null default '{}'::jsonb` permettrait de stocker
ces informations sans surcharger la colonne `changes` et de les
indexer séparément (GIN).

### 3.4 Enrichir le contexte

Pour les actions déclenchées par des processus internes ou des
employés Fleetcore, il peut être utile d’ajouter :

- `performed_by_type` (varchar(50), valeurs : `tenant_user`,
  `provider_staff`, `system`) pour identifier l’origine.
- `session_id` ou `request_id` pour recoller les logs entre eux.
- `source_app` si la plateforme inclut plusieurs interfaces (portail
  web, API publique, mobile).

Ces colonnes facilitent les enquêtes et les audits de sécurité.

### 3.5 Politique de conservation et export

Même si les logs sont immuables, il peut être nécessaire de les
purger ou de les archiver au-delà d’un certain délai (par ex. 6 ans
pour certaines réglementations). Le schéma cible peut inclure un
`retention_until` ou s’appuyer sur un processus d’archivage externe.
L’API devra permettre l’export des logs par tenant pour répondre aux
demande de conformité (RGPD, audit interne).

## 4. Modèle cible (proposé)

Le schéma suivant illustre comment intégrer ces améliorations dans le
DDL tout en conservant la compatibilité avec le modèle actuel :

```sql
create table public.adm_audit_logs (
  id uuid primary key default extensions.uuid_generate_v4(),
  tenant_id uuid not null references adm_tenants(id) on delete cascade,
  -- utilisateur ayant déclenché l'action (membre ou employé)
  user_id uuid null references adm_members(id) on delete set null,
  -- nature de l'entité impactée
  entity_type varchar(50) not null check (
    entity_type in (
      'vehicle','driver','trip','document','user','role','invoice',
      'payment','ticket','tenant','plan'
    )
  ),
  entity_id uuid not null,
  -- action réalisée
  action varchar(50) not null check (
    action in (
      'create','update','delete','view','export','import','login',
      'logout','permission_change','activate','suspend'
    )
  ),
  -- description structurée des modifications
  changes jsonb null,
  -- adresse IP et agent utilisateur
  ip_address varchar(45) null,
  user_agent text null,
  -- date et heure de l'action
  performed_at timestamptz not null default current_timestamp,
  -- informations supplémentaires
  metadata jsonb not null default '{}'::jsonb,
  -- origine de l'action (tenant_user, provider_staff, system)
  performed_by_type varchar(50) null,
  constraint adm_audit_logs_user_tenant_fk check (
    user_id is null or tenant_id = (select tenant_id from adm_members where id = user_id)
  )
);

-- Indexes
create index if not exists adm_audit_logs_tenant_entity_idx on adm_audit_logs (tenant_id, entity_type, entity_id);
create index if not exists adm_audit_logs_performed_at_idx on adm_audit_logs (performed_at desc);
create index if not exists adm_audit_logs_metadata_gin on adm_audit_logs using gin (metadata);
create index if not exists adm_audit_logs_changes_gin on adm_audit_logs using gin (changes);
```

**Explications :**

- **Compatibilité ascendante :** les colonnes ajoutées (`metadata`,
  `performed_by_type`) sont facultatives et ne remettent pas en cause
  les enregistrements existants. Le renommage de `member_id` en
  `user_id` et de `entity` en `entity_type` nécessiterait une
  migration de données et une mise à jour du code, mais clarifie la
  sémantique et aligne la base sur les services TypeScript.
- **Enums et contraintes :** les `CHECK` sur `entity_type` et
  `action` limitent les valeurs à celles définies dans la spécification
  et le code【667256955770467†L375-L381】【667256955770467†L382-L392】, réduisant les
  erreurs de saisie.
- **Intégrité multi‑tenant :** la contrainte `adm_audit_logs_user_tenant_fk`
  vérifie que l’utilisateur appartient bien au tenant du log ou est
  null (cas des actions système). Cela renforce la cohérence et
  facilite les investigations.
- **Indexation ciblée :** les nouveaux indexes optimisent les
  requêtes de consultation des logs par tenant, entité, date et
  recherche dans les métadonnées ou les changements. L’index
  existant sur `changes` est conservé.

Cette table cible s’intègre parfaitement au reste du modèle
Fleetcore : elle conserve l’immuabilité des logs, expose davantage
d’informations utiles pour l’audit et s’aligne sur le code existant.
Les services d’audit et les API devront être ajustés pour utiliser
les nouvelles colonnes et respecter les contraintes définies.
