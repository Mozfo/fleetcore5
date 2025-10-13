# Analyse de la table `adm_roles`

Cette note examine la table **`adm_roles`** de Fleetcore en combinant le DDL actuel, les règles métier issues de la spécification et du code et des propositions d’amélioration. Elle vise à fournir une **source unique de vérité** pour la gestion des rôles et à identifier l’impact des modifications potentielles sur l’ensemble du modèle de données.

## 1. Modèle existant et validations

La table `adm_roles` définit les rôles disponibles pour chaque tenant. Elle permet de grouper des permissions et d’être assignée aux membres via `adm_member_roles`. Le DDL fourni comporte les colonnes suivantes :

| Champ                                          | Type                  | Contraintes/validations                                                                  | Remarques                                                                                                    |
| ---------------------------------------------- | --------------------- | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| **id**                                         | `uuid`                | Clé primaire générée par `uuid_generate_v4()`                                            | Identifiant du rôle.                                                                                         |
| **tenant_id**                                  | `uuid`                | Non nul, FK → `adm_tenants(id)` avec `ON DELETE CASCADE`                                 | Chaque rôle appartient à un tenant spécifique (pas de rôles globaux).                                        |
| **name**                                       | `varchar(100)`        | Non nul, **unique** par `(tenant_id, name)` via index partiel `adm_roles_tenant_name_uq` | Nom du rôle (ex. `fleet_manager`, `finance_admin`).                                                          |
| **description**                                | `text`                | Nullable                                                                                 | Sert à décrire le rôle pour l’interface d’administration.                                                    |
| **permissions**                                | `jsonb`               | Non nul, par défaut `{}`                                                                 | Contient la liste des permissions associées au rôle (ex. `{"vehicles:create": true, "drivers:view": true}`). |
| **status**                                     | `varchar(50)`         | Non nul, par défaut `active`                                                             | Statut du rôle (`active`, `inactive`, `archived`).                                                           |
| **created_at**, **updated_at**                 | `timestamptz`         | Non nuls, défaut `CURRENT_TIMESTAMP`                                                     | Mise à jour automatique via le trigger `update_adm_roles_updated_at`.                                        |
| **created_by**, **updated_by**, **deleted_by** | `uuid`                | FKs facultatives vers `adm_members(id)` avec `ON DELETE SET NULL`                        | Identifient le membre ayant créé/modifié/supprimé le rôle.                                                   |
| **deleted_at**, **deletion_reason**            | `timestamptz`, `text` | Champs pour la suppression logique (soft delete)                                         | Les index partiels excluent les lignes supprimées.                                                           |

**Index et contraintes supplémentaires :**

- Index B‑tree sur `tenant_id`, `deleted_at`, `created_by`, `updated_by` et un index partiel sur `status` pour filtrer les rôles actifs.
- Index GIN sur `permissions` pour optimiser les recherches dans le JSON.
- RLS : la politique d’isolation applique un filtre par `tenant_id` pour que chaque tenant ne voie que ses propres rôles. Les super‑admins internes contournent cette politique.

## 2. Règles métier identifiées

### 2.1 Multi‑niveau de rôles

La spécification énumère un système de rôle multi‑niveaux : **Fleet Owner**, **CEO**, **Fleet Manager**, **Dispatcher**, **Finance Admin**, **HR Admin**, etc. Chaque rôle correspond à un ensemble de permissions déterminant les actions autorisées sur les modules (flotte, pilotes, finances)【229134380627077†L240-L267】. Les utilisateurs peuvent avoir plusieurs rôles par tenant via `adm_member_roles`. La création d’un rôle se fait par un membre disposant des droits nécessaires (par exemple un administrateur du tenant). La suppression ou la désactivation d’un rôle doit empêcher sa sélection lors des assignations, sans supprimer les associations existantes.

### 2.2 Personnalisation et héritage des permissions

1. **Personnalisation** : la plateforme permet aux tenants de définir des **rôles personnalisés** en plus des rôles prédéfinis. Pour cela, les administrateurs doivent pouvoir ajouter ou modifier des entrées dans `adm_roles` et définir leurs permissions (JSON). Cette personnalisation est essentielle pour adapter Fleetcore aux processus spécifiques des entreprises clientes.
2. **Permissions structurées** : les permissions sont stockées dans le champ `permissions` au format JSON (`{"module.action": true}`). Lors de la vérification d’un accès, l’application lit ce champ et vérifie la clé correspondante. Ce modèle facilite l’ajout de nouvelles permissions sans modifier le schéma, mais il impose d’établir et de documenter une nomenclature stable pour les clés (ex. `vehicles.create`, `drivers.suspend`).
3. **État des rôles** : le champ `status` distingue les rôles `active` (utilisables), `inactive` (désactivés, non assignables) et potentiellement `deprecated` ou `archived` selon la pratique. Les membres ayant un rôle inactif doivent conserver l’historique, mais l’application ne doit plus accorder les permissions associées.

### 2.3 Création et modification des rôles

1. **Cycle de vie** : lors de la création d’un rôle, l’application doit vérifier l’unicité du `name` au sein du tenant. La modification du champ `permissions` doit être auditée et versionnée pour éviter des régressions accidentelles. Les modifications doivent être appliquées immédiatement à tous les membres possédant ce rôle.
2. **Audit** : chaque création, mise à jour ou suppression est consignée dans `adm_audit_logs`, avec l’utilisateur, la date et les changements. Les champs `created_by`, `updated_by`, `deleted_by` dans `adm_roles` permettent d’associer ces actions à un membre.
3. **Super‑admin** : les employés internes de Fleetcore peuvent créer des rôles prédéfinis valables pour tous les tenants (ex. rôle `mechanic`). Ces rôles pourraient être stockés dans un schéma « global » ou dans un tenant spécial (`tenant_id = 'provider'`) pour éviter de les dupliquer. Les rôles créés par les clients ne doivent pas être visibles par les autres clients.

## 3. Propositions d’amélioration et modèle cible

### 3.1 Clarification et enrichissement des rôles

| Problème                                                                                                                      | Proposition                                                                                                                                                                                                                                                     |
| ----------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Nom ambigu** : `name` est utilisé à la fois comme identifiant et comme libellé.                                             | Ajouter un champ `slug` (varchar) unique par tenant pour servir d’identifiant technique stable (ex. `fleet_manager`), et garder `name` pour le libellé affiché (« Fleet Manager »).                                                                             |
| **Permissions non structurées** : `permissions` est un JSON non typé.                                                         | Normaliser les permissions via une table `adm_role_permissions` contenant une ligne par permission (`role_id`, `permission_key`, `allow`), ou définir un schéma JSON validé. Cette approche facilite la recherche, l’audit et la documentation des permissions. |
| **Champ `status` libre** : lister explicitement les états (`active`, `inactive`, `deprecated`, `archived`) dans un type ENUM. | Permet d’appliquer des règles différentes selon l’état (archivage, invisibilité dans l’UI) et facilite les contrôles.                                                                                                                                           |
| **Absence de rôle par défaut** : lors de la création d’un tenant, aucun rôle n’est marqué comme rôle par défaut.              | Ajouter un champ `is_default` (`boolean`) indiquant si le rôle doit être attribué automatiquement aux nouveaux membres (`true` pour `member`).                                                                                                                  |
| **Manque d’historique des permissions** : les modifications de JSON ne laissent pas de trace détaillée.                       | Introduire une table d’historique (`adm_role_versions`) avec `role_id`, `version`, `permissions`, `changed_at`, `changed_by`, pour conserver l’évolution des permissions.                                                                                       |
| **Portée locale** : tous les rôles sont définis par tenant.                                                                   | Créer un espace de rôles « globaux » utilisé par plusieurs tenants (par ex. importer des modèles de rôles), en ajoutant un champ `scope` (`'tenant'` ou `'global'`).                                                                                            |

### 3.2 Impact sur le modèle cible

1. **Ajout d’un champ `slug`** : nécessite de générer un identifiant stable lors de la création du rôle. Les services d’autorisation pourront se baser sur `slug` plutôt que sur `name`, facilitant les refactorings.
2. **Refonte des permissions** : passer d’un JSON libre à une table `adm_role_permissions` implique de créer cette table et de migrer les données existantes. La logique d’autorisation devra lire depuis cette table. Cela simplifie la recherche (index sur `permission_key`) et permet de tester l’existence d’une permission précise.
3. **Versioning** : l’introduction de `adm_role_versions` impliquera d’enregistrer une nouvelle version à chaque modification de `permissions` et d’adapter les services pour charger la version la plus récente. Cela améliore la traçabilité et permet un rollback.
4. **Champ `is_default` et `scope`** : ces champs nécessiteront des contraintes (un seul rôle par tenant peut être `is_default = true`) et des index. Ils auront un impact sur `adm_member_roles` (assignation automatique) et sur les services d’onboarding.

## 4. Impact sur les autres tables et services

- **`adm_member_roles`** : la création de rôles supplémentaires ou leur désactivation affecte l’assignation des membres. Si un rôle est marqué `inactive` ou `archived`, les membres devront se voir retirer ses permissions, ou l’affectation devra être ignorée. L’ajout d’un champ `slug` dans `adm_roles` implique de stocker `role_slug` dans `adm_member_roles` ou de joindre via l’ID.
- **`adm_members`** : l’introduction d’un rôle par défaut (`is_default`) simplifie l’onboarding en assignant automatiquement ce rôle aux nouveaux membres. Le champ `status` des membres reste déterminant pour l’accès.
- **`adm_audit_logs`** : l’ajout d’historique des permissions ou de versions de rôle entraînera de nouveaux types d’événements à consigner (création de version, changement de statut, archivage).
- **Modules métier** : toutes les vérifications d’autorisation devront être mises à jour pour interroger la nouvelle structure des permissions (table `adm_role_permissions` ou versioning). Les interfaces d’administration des rôles devront permettre d’éditer les permissions de façon granulaire.
- **Import/Export** : si des rôles globaux sont introduits, un processus de synchronisation devra gérer l’importation de ces rôles dans les tenants et l’association aux membres.

## 5. Conclusion

`adm_roles` est la brique centrale du système RBAC de Fleetcore : elle définit les rôles métiers et les permissions associées pour chaque organisation cliente. Le modèle actuel est simple et flexible grâce au champ `permissions` en JSON, mais il présente des limites en matière de structure, de traçabilité et de gestion du cycle de vie. Les améliorations proposées (slug stable, table de permissions normalisée, versioning, rôle par défaut, portée globale/tenant) renforcent la gouvernance des rôles et soutiennent la personnalisation avancée souhaitée par la spécification. Leur implémentation nécessitera des ajustements dans les services d’administration, les politiques de sécurité et les modules métier, mais elle offrira une base plus robuste et pérenne pour le contrôle d’accès.
