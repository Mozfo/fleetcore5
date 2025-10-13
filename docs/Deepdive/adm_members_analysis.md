# Analyse de la table `adm_members`

Cette note fournit une **single source of truth** pour la table `adm_members` de Fleetcore. Elle combine le modèle existant (DDL Supabase), les règles métier dérivées de la spécification et du code, des propositions d'amélioration et leur impact sur le modèle de données ainsi que sur les autres tables.

## 1. Modèle existant et validations

La table `adm_members` stocke les utilisateurs (membres) d’une organisation (tenant). Chaque membre est rattaché à un tenant via `tenant_id` et dispose d’informations d’authentification liées à Clerk (service d’identité). Le DDL fourni définit les colonnes suivantes :

| Champ                                          | Type                  | Contraintes/validations                                                                                     | Remarques                                                                        |
| ---------------------------------------------- | --------------------- | ----------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| **id**                                         | `uuid`                | Clé primaire, générée par `uuid_generate_v4()`                                                              | Identifiant immuable du membre.                                                  |
| **tenant_id**                                  | `uuid`                | Clé étrangère non nulle vers `adm_tenants(id)`, `ON DELETE CASCADE`                                         | Assure l’isolement multi‑tenant : un membre appartient à un seul tenant.         |
| **email**                                      | `citext`              | Non nul, **unique par tenant** : index partiel `UNIQUE (tenant_id, email) WHERE deleted_at IS NULL`         | Insensible à la casse, utilisé pour l’authentification.                          |
| **clerk_user_id**                              | `varchar(255)`        | Non nul, **unique par tenant** : index partiel `UNIQUE (tenant_id, clerk_user_id) WHERE deleted_at IS NULL` | Lie le membre à son compte dans le fournisseur d’identité (Clerk).               |
| **first_name**, **last_name**                  | `varchar(100)`        | Optionnels                                                                                                  | Noms et prénoms.                                                                 |
| **phone**                                      | `varchar(50)`         | Optionnel                                                                                                   | Numéro de téléphone (format E.164 recommandé).                                   |
| **role**                                       | `varchar(50)`         | Non nul, valeur par défaut `'member'`                                                                       | Rôle général (member/admin). Peut faire doublon avec `adm_member_roles`.         |
| **last_login_at**                              | `timestamptz`         | Nullable                                                                                                    | Horodatage de la dernière connexion.                                             |
| **metadata**                                   | `jsonb`               | Non nul, par défaut `{}`                                                                                    | Stocke des attributs additionnels (preferences, paramètres).                     |
| **status**                                     | `varchar(50)`         | Non nul, valeur par défaut `'active'`                                                                       | Utilisé pour suivre l’état du membre (actif, suspendu, invité, etc.).            |
| **created_at**, **updated_at**                 | `timestamptz`         | Non nuls, valeurs par défaut `CURRENT_TIMESTAMP`                                                            | Gérés automatiquement via le trigger `set_updated_at_adm_members`.               |
| **created_by**, **updated_by**, **deleted_by** | `uuid`                | Nullable, clés étrangères vers `adm_members(id)` avec `ON DELETE SET NULL`                                  | Permettent de savoir quel membre a créé/modifié/supprimé un autre membre.        |
| **deleted_at**, **deletion_reason**            | `timestamptz`, `text` | Permettent la suppression logique (soft delete)                                                             | Les index partiels sur les contraintes d’unicité excluent les lignes supprimées. |

**Index et contraintes** :

- Index B‑tree sur `tenant_id`, `email`, `clerk_user_id`, `deleted_at`, `last_login_at` et `status` (partiel sur les lignes actives) pour optimiser les recherches.
- Index GIN sur `metadata` pour les requêtes JSON.
- Triggers : `set_updated_at_adm_members` met à jour `updated_at` avant chaque modification.
- Row‑Level Security (RLS) : le modèle conceptuel prévoit une politique d’isolation par tenant. Chaque requête doit filtrer sur `tenant_id` pour empêcher un locataire de voir les membres d’un autre【985642854533900†L77-L82】. Les employés internes (provider staff) utilisent une table distincte (`adm_provider_employees`).

## 2. Règles métier détectées

En croisant la spécification, le code et la base, on identifie les règles métier suivantes :

### 2.1 Flux d’onboarding et d’invitation

1. **Invitation par l’administrateur** : un admin client invite un nouvel utilisateur via l’application. Une entrée est créée dans `adm_invitations` (non montrée ici) avec un jeton unique. Le membre n’existe pas encore dans `adm_members` ; son enregistrement sera créé une fois l’invitation acceptée.
2. **Inscription via Clerk** : l’invité reçoit un lien qui le redirige vers Clerk. Lors de son inscription, Clerk crée un `clerk_user_id` et renvoie les informations à Fleetcore, qui crée l’enregistrement dans `adm_members` avec `status = 'active'` et `role = 'member'`. Le champ `clerk_user_id` est obligatoire et doit être unique par tenant.
3. **Assignation de rôles** : immédiatement après l’inscription, l’administrateur peut affecter des rôles métier via la table `adm_member_roles` (voir table associée). Le champ `role` dans `adm_members` reste générique et pourrait être conservé comme rôle par défaut (`member` ou `admin`).
4. **Limites d’accès** : un membre ne peut créer ou modifier des utilisateurs que s’il possède le rôle adéquat (ex. `admin` ou `hr_manager`). Le champ `status` contrôle l’accès : un membre `suspended` ou `inactive` ne peut pas se connecter. Les services vérifient cet état avant de valider une session.

### 2.2 Gestion du cycle de vie et des accès

1. **Changement de statut** : le champ `status` prend les valeurs `invited`, `active`, `suspended`, `terminated` (proposition). Lorsqu’un membre est suspendu ou supprimé, les services doivent empêcher toute authentification. Cette action devrait être journalisée dans `adm_audit_logs` et enregistrée dans `adm_member_lifecycle_events` si une telle table est ajoutée.
2. **RLS et sécurité** : toutes les requêtes d’API exposant des membres doivent filtrer par `tenant_id`. Les employés de Fleetcore n’accèdent pas aux données des membres via cette table mais via un rôle spécial dans Clerk.
3. **Dernière connexion** : le champ `last_login_at` est mis à jour lors de chaque authentification via Clerk. Il peut être utilisé pour désactiver les comptes inactifs après un certain temps.

### 2.3 Interactions avec les autres modules

1. **Support et notifications** : les tickets de support (`sup_tickets`) et certains workflows CRM utilisent un champ `assigned_to` qui fait référence à `adm_members(id)` pour désigner l’agent chargé du ticket ou du lead. Les notifications de résolution sont envoyées à `ticket.member.email` (ou via Clerk) lorsqu’un ticket est clos.
2. **Métriques d’utilisation** : bien que les statistiques soient agrégées principalement au niveau du tenant, certains rapports (ex. contributions des dispatchers) comptent les actions par membre. Les membres suspendus ne doivent pas être comptabilisés dans ces métriques.
3. **Audit** : les champs `created_by`, `updated_by` et `deleted_by` référencent un membre ; ils permettent de tracer qui a effectué une opération sur d’autres ressources. Les triggers mettent à jour `updated_at` automatiquement.

## 3. Propositions d’amélioration et modèle cible

L’analyse des documents révèle des besoins non couverts par le modèle actuel et propose des améliorations :

### 3.1 Simplification du rôle global

Le champ `role` actuel (`member` ou `admin`) peut créer une confusion avec la gestion fine des rôles stockée dans `adm_member_roles`. Il est recommandé de :

- **Conserver le champ `role` comme rôle par défaut** assigné lors de l’inscription (par exemple `member`), mais ne plus l’utiliser pour définir les permissions applicatives.
- **Ajouter un champ `default_role_id`** (FK vers `adm_roles`) afin de stocker le rôle métier par défaut, tout en conservant la possibilité d’assigner plusieurs rôles via `adm_member_roles`. Cette approche s’appuie sur les bonnes pratiques SaaS, qui préconisent une table de membership séparée et des rôles sur la relation plutôt que sur l’entité utilisateur【540541453038143†L69-L96】.

### 3.2 Nouveaux champs pour la sécurité et la conformité

| Champ                  | Type                                                                 | Justification                                                                                         |
| ---------------------- | -------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| **email_verified_at**  | `timestamptz`                                                        | Permet de savoir quand l’adresse email a été vérifiée via Clerk. Utilisé pour le RGPD et la sécurité. |
| **two_factor_enabled** | `boolean`                                                            | Indique si l’utilisateur a activé l’authentification à deux facteurs.                                 |
| **preferred_language** | `varchar(10)`                                                        | Code de langue (`fr`, `en`, etc.), utilisé pour les emails et l’interface.                            |
| **last_login_ip**      | `inet`                                                               | Adresse IP de la dernière connexion, pour l’audit et la détection d’anomalies.                        |
| **status** (enum)      | Énumération stricte (`invited`, `active`, `suspended`, `terminated`) | Clarifie les transitions de cycle de vie.                                                             |

Ces ajouts améliorent la conformité RGPD et la sécurité sans perturber le schéma actuel (ajout de colonnes facultatives).

### 3.3 Normalisation et refactoring

- **Séparer les utilisateurs et leurs appartenances** : comme le suggèrent les guides sur le multi‑tenant, il peut être utile de distinguer une table `users` (comptes uniques identifiés par l’email) et une table `memberships` qui relie un `user_id` à un `tenant_id` avec un rôle et un statut【540541453038143†L69-L96】. Cela permettrait à un utilisateur de rejoindre plusieurs organisations avec des rôles différents, en simplifiant l’authentification.
- **Harmoniser `metadata`** : documenter un schéma JSON (par ex. préférences UI, paramètres de notification) ou remplacer certains champs par des colonnes dédiées.
- **Ajouter un champ `invited_at` et `invited_by`** pour enregistrer la date et l’initiateur d’une invitation. Cela facilitera l’audit et la relance des invitations expirées.
- **Rendre `phone` obligatoire ou le valider** via un regex pour éviter les formats incohérents.

### 3.4 Impact sur le modèle cible

Ces propositions impliquent :

- Mise à jour des services d’invitation et d’authentification pour gérer les nouveaux champs (`email_verified_at`, `two_factor_enabled`, `preferred_language`) et pour initialiser `default_role_id`.
- Modification de `adm_member_roles` pour permettre un rôle par défaut et gérer les transitions (`invited` → `active`).
- Adaptation des services de reporting pour prendre en compte les statuts normalisés et exclure ou inclure certains membres.
- Création éventuelle d’une table `adm_user_memberships` si l’on sépare utilisateurs et appartenance ; cela impactera la RLS (filtrage par `membership_id` plutôt que par `tenant_id`) et la gestion des invitations.

## 4. Impact sur les autres tables et services

- **`adm_member_roles`** : devra être ajustée pour gérer le champ `default_role_id` et pour assurer qu’un membre possède au moins un rôle actif. Les contraintes d’intégrité devront s’assurer que `member_id` et `role_id` appartiennent au même tenant et que le rôle est actif.
- **`adm_roles`** : peut nécessiter un champ `is_default` pour signaler le rôle attribué par défaut lors d’une invitation (par exemple `member`).
- **Modules de support et CRM** : les références `assigned_to` vers `adm_members(id)` resteront valides ; en revanche, l’ajout de statuts tels que `suspended` ou `terminated` impose de filtrer ces membres dans les listes déroulantes.
- **`adm_audit_logs`** : chaque modification dans `adm_members` (création, mise à jour de statut, suppression) doit être enregistrée pour la traçabilité et la conformité réglementaire.
- **RLS** : l’ajout d’un modèle `users`/`memberships` nécessitera de réécrire les politiques RLS pour filtrer par `membership.tenant_id` et non plus par `adm_members.tenant_id`.
- **Services de métriques** : si de nouveaux statuts sont introduits, `UsageMetricsService` devra être mis à jour pour prendre en compte les membres actifs ou non dans les statistiques par rôle ou par tenant【688148837726357†L597-L603】.

## 5. Conclusion

La table `adm_members` telle que définie dans le DDL est cohérente avec un modèle multi‑tenant basique : elle stocke les utilisateurs d’un tenant avec une isolation via `tenant_id` et des contraintes d’unicité sur l’email et l’ID Clerk. Toutefois, le code et la spécification révèlent des besoins supplémentaires pour la facturation (information de contact), le support (rôles détaillés), la sécurité (vérification email, 2FA) et l’audit. Les améliorations proposées respectent les bonnes pratiques SaaS en séparant le rôle par défaut, en normalisant les statuts et en ajoutant des champs orientés sécurité et conformité. Leur adoption nécessitera une mise à jour des services et des politiques RLS, mais offrira une base plus robuste et évolutive pour gérer les utilisateurs dans une application multi‑tenant.
