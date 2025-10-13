# Analyse de la table `adm_member_roles`

Cette note fournit une **analyse complète** de la table `adm_member_roles` en croisant le modèle Supabase actuel, les règles métier issues de la spécification Fleetcore et du code, et des propositions d’amélioration avec leurs impacts sur le modèle de données et les autres tables. L’objectif est de créer une source unique de vérité pour ce composant clé de la gestion des permissions.

## 1. Modèle existant et validations

`adm_member_roles` est la table de jonction entre `adm_members` et `adm_roles` ; elle permet d’assigner plusieurs rôles à un membre au sein d’un tenant. Le DDL fournit les champs et contraintes suivants :

| Champ                                          | Type                  | Contraintes/validations                                           | Remarques                                                                    |
| ---------------------------------------------- | --------------------- | ----------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| **id**                                         | `uuid`                | Clé primaire, générée par `uuid_generate_v4()`                    | Identifiant unique de l’affectation.                                         |
| **tenant_id**                                  | `uuid`                | Non nul, FK → `adm_tenants(id)` avec `ON DELETE CASCADE`          | Assure l’appartenance à un seul tenant et l’isolation multi‑tenant.          |
| **member_id**                                  | `uuid`                | Non nul, FK → `adm_members(id)` avec `ON DELETE CASCADE`          | L’affectation disparaît si le membre est supprimé.                           |
| **role_id**                                    | `uuid`                | Non nul, FK → `adm_roles(id)` avec `ON DELETE CASCADE`            | L’affectation disparaît si le rôle est supprimé.                             |
| **assigned_at**                                | `timestamptz`         | Non nul, défaut `CURRENT_TIMESTAMP`                               | Date et heure d’assignation du rôle.                                         |
| **created_at**, **updated_at**                 | `timestamptz`         | Défauts `CURRENT_TIMESTAMP`                                       | Gérés via le trigger `set_updated_at_adm_member_roles`.                      |
| **created_by**, **updated_by**, **deleted_by** | `uuid`                | FKs facultatives vers `adm_members(id)` avec `ON DELETE SET NULL` | Identifient le membre à l’origine de l’opération.                            |
| **deleted_at**, **deletion_reason**            | `timestamptz`, `text` | Pour la suppression logique                                       | Les index partiels excluent les lignes supprimées des contraintes d’unicité. |

**Index et contraintes** :

- `UNIQUE (tenant_id, member_id, role_id) WHERE deleted_at IS NULL` : empêche d’affecter deux fois le même rôle à un membre dans un même tenant.
- Index B‑tree sur `tenant_id`, `member_id`, `role_id`, `deleted_at`, `created_by`, `updated_by` pour optimiser les recherches.
- Trigger `set_updated_at_adm_member_roles` mettant à jour `updated_at` avant chaque modification.
- Politiques de RLS : filtrage par `tenant_id` pour que chaque tenant voie seulement ses affectations (super‑admins mis à part).

## 2. Règles métier identifiées

### 2.1 Attribution et gestion des rôles

1. **Multi‑rôles** : un membre peut se voir attribuer plusieurs rôles (ex. « dispatch », « finance_admin », « mechanic »). Cette flexibilité est alignée sur la spécification qui précise que « les utilisateurs peuvent avoir plusieurs rôles par tenant »【540541453038143†L69-L96】. Les rôles sont définis dans `adm_roles` et regroupent des permissions.
2. **Assignation lors de l’onboarding** : lorsque l’admin invite un utilisateur et que celui‑ci s’inscrit via Clerk, le système lui attribue un rôle par défaut (`member` ou autre) et enregistre l’affectation dans `adm_member_roles`. Des rôles additionnels peuvent être ajoutés ou retirés via l’interface d’administration.
3. **Règles de modification** : seul un membre possédant un rôle disposant de la permission `manage_roles` (ex. `admin`, `hr_admin`) peut créer ou supprimer des affectations. L’action est auditée dans `adm_audit_logs`.
4. **Impossibilité de dupliquer** : l’unicité `(tenant_id, member_id, role_id)` empêche des doublons. Modifier un rôle existant passe par la suppression (soft delete) de l’affectation puis la création d’une nouvelle.

### 2.2 Cycle de vie et sécurité

1. **Durée d’assignation** : le champ `assigned_at` enregistre la date d’affectation, mais il n’existe pas de champ pour la date de fin. Un rôle reste effectif tant que l’affectation n’est pas supprimée (soft delete).
2. **Audit** : l’ajout et la suppression d’un rôle doivent être journalisés via `adm_audit_logs` (action : `assign_role` ou `revoke_role`), avec l’identifiant du membre qui a réalisé l’opération et le contexte IP/agent.
3. **Suspension d’un membre** : si un membre est suspendu (`adm_members.status`), ses rôles restent stockés mais doivent être ignorés dans les vérifications d’accès. Les fonctions d’autorisation doivent vérifier l’état du membre avant d’évaluer ses rôles.

### 2.3 Interactions avec les autres modules

1. **Contrôle d’accès (RBAC)** : l’application interroge `adm_member_roles` lors de chaque requête pour déterminer si le membre a la permission nécessaire. Les rôles et permissions sont centralisés dans `adm_roles` (permissions JSONB). Les modules de flotte, finance et support se basent sur ces rôles pour afficher ou cacher certaines actions.
2. **Automatisation des tâches** : certaines tâches générées par le système (ex. maintenance, factures impayées) sont assignées au rôle correspondant (mécanicien, finance admin). Le module de scheduling devra donc rechercher les membres ayant le rôle requis via `adm_member_roles`【540541453038143†L69-L96】.
3. **Gestion du cycle de vie du tenant** : lorsqu’un tenant est suspendu ou supprimé, toutes les affectations de rôles sont conservées mais deviennent inactives en raison du filtrage sur `adm_members.status`.

## 3. Propositions d’amélioration et modèle cible

### 3.1 Champs supplémentaires

Pour répondre à des besoins plus fins de RBAC et d’audit, il est possible d’ajouter :

| Champ              | Type                                                  | Justification                                                                                                                                     |
| ------------------ | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| **assigned_by_id** | `uuid` (FK → `adm_members`)                           | Pour identifier qui a attribué le rôle, distinct de `created_by`. Utile pour l’audit et la supervision.                                           |
| **expires_at**     | `timestamptz`                                         | Permet de définir des rôles temporaires (ex. mission ponctuelle, intérim). Après cette date, le rôle est automatiquement considéré comme inactif. |
| **status**         | `varchar(50)` avec énumération (`active`, `inactive`) | Pour activer ou désactiver une affectation sans la supprimer (soft-delete).                                                                       |
| **remarks**        | `text`                                                | Champ libre pour documenter le contexte de l’affectation (par ex. « rôle ajouté dans le cadre du projet X »).                                     |

Ces champs enrichissent la traçabilité et permettent d’automatiser la fin de mission d’un rôle sans le supprimer (utile en cas d’audit ou de reporting).

### 3.2 Contraintes et normalisation

- **Contrôle de cohérence** : imposer via une contrainte de vérification ou un trigger que `tenant_id` de `adm_member_roles` corresponde à `tenant_id` de `adm_members` et `adm_roles` pour éviter toute affectation croisée.
- **Champ unique « rôle principal »** : si l’on souhaite désigner un rôle principal (ex. `main_role_id`), créer une contrainte `UNIQUE (member_id) WHERE is_primary = true` pour éviter plusieurs rôles principaux. Cela simplifierait l’interface tout en permettant plusieurs rôles secondaires.
- **Historisation des changements** : ajouter une table `adm_member_role_history` pour conserver l’historique complet des affectations (date de début, date de fin, assigné par, retiré par, raison) au lieu de surcharger `adm_audit_logs`.
- **Référence à l’identité** : si l’on adopte un modèle `users`/`memberships`, remplacer `member_id` par `membership_id` pour lier un utilisateur à un tenant via une membership. Cela permettrait à un même utilisateur d’avoir des rôles différents dans plusieurs organisations.

### 3.3 Impact sur le modèle et le code

1. **Services d’administration** : l’ajout de `assigned_by_id` et `expires_at` nécessite de mettre à jour les interfaces et les services (API) pour capturer ces informations lors de l’assignation d’un rôle. Des jobs planifiés devront désactiver les rôles expirés en mettant `status = 'inactive'` ou en remplissant `deleted_at`.
2. **Modules d’autorisation** : il faudra adapter la logique de RBAC pour ignorer les affectations inactives ou expirées et pour gérer la notion de rôle principal si elle est introduite.
3. **Impacts RLS** : le filtrage par `tenant_id` reste valable, mais si l’on passe à un modèle `users`/`memberships`, il faudra ajuster les politiques de sécurité pour filtrer par `membership_id`.
4. **Autres tables** : l’ajout de `status` et `expires_at` pourrait nécessiter des index supplémentaires. Les références à cette table dans les modules de scheduling ou de support devront être filtrées pour ne prendre en compte que les rôles actifs.

## 4. Impact sur les autres tables et services

- **`adm_members`** : les améliorations proposées (rôle principal, expires_at) imposent des adaptations dans la gestion des utilisateurs et des invitations. Par exemple, il faudra s’assurer qu’un membre dispose toujours d’au moins un rôle actif.
- **`adm_roles`** : l’introduction d’un rôle principal ou d’une date d’expiration pourrait amener à ajouter un champ `is_default` dans `adm_roles` pour définir le rôle attribué par défaut à la création d’un membre, conformément aux bonnes pratiques d’authentification et de RBAC【540541453038143†L69-L96】. De plus, si des permissions temporaires sont nécessaires, la table des rôles pourrait intégrer une notion de durée.
- **`adm_audit_logs`** : l’ajout de `assigned_by_id`, `expires_at` et `status` nécessitera d’enregistrer les changements correspondants dans les logs. Les requêtes de logs devront permettre de filtrer par type d’action (`assign_role`, `revoke_role`), par tenant et par date.
- **Modules de workflow et de notifications** : les affectations temporaires devront déclencher des notifications lors de l’approche de la date d’expiration. Les tâches générées par le système devront prendre en compte uniquement les membres ayant un rôle actif.

## 5. Conclusion

La table `adm_member_roles` joue un rôle central dans la mise en œuvre du contrôle d’accès à granularité fine requis par Fleetcore. Elle permet d’associer plusieurs rôles à un membre tout en respectant l’isolement multi‑tenant et en assurant l’intégrité par des clés étrangères et des index uniques. Les règles métier identifiées confirment la nécessité d’un système flexible où les administrateurs peuvent attribuer et retirer des rôles, avec une traçabilité complète. Les améliorations proposées (ajout de `assigned_by_id`, `expires_at`, `status`, historique complet) renforcent cette flexibilité et facilitent la conformité et l’automatisation. Leur mise en œuvre devra toutefois s’accompagner de mises à jour des services d’administration, des politiques de sécurité et des modules dépendants pour conserver la cohérence de l’ensemble du système.
