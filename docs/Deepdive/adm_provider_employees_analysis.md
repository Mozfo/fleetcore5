# Analyse de la table `adm_provider_employees`

Cette note fournit une **analyse approfondie** de la table `adm_provider_employees`, qui recense les collaborateurs internes de Fleetcore (support, commerciaux, développeurs, finance, etc.). Contrairement aux tables multi‑tenant, cette table est globale : elle n’inclut pas de `tenant_id` car les employés du fournisseur opèrent sur l’ensemble des organisations clientes. L’analyse présente le modèle actuel, les règles métier implicites, des améliorations proposées et leurs impacts.

## 1. Modèle existant et validations

Le DDL actuel pour `adm_provider_employees` définit les colonnes suivantes :

| Champ             | Type                                                                                                  | Contraintes/Validations                                                                              | Remarques                                                                                   |
| ----------------- | ----------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| **id**            | `uuid`                                                                                                | Clé primaire générée par `uuid_generate_v4()`                                                        | Identifiant unique de l’employé interne.                                                    |
| **clerk_user_id** | `varchar(255)`                                                                                        | **Non nul**, unique (index partiel `(clerk_user_id) WHERE deleted_at IS NULL`)                       | Référence l’ID du compte Clerk de l’employé ; utilisé pour l’authentification.              |
| **name**          | `varchar(100)`                                                                                        | **Non nul**                                                                                          | Nom complet de l’employé (peut englober prénom et nom).                                     |
| **email**         | `varchar(255)`                                                                                        | **Non nul**, unique par index partiel `(email) WHERE deleted_at IS NULL`                             | Adresse professionnelle de l’employé ; utilisée pour les notifications et l’identification. |
| **department**    | `varchar(50)`                                                                                         | Nullable                                                                                             | Département ou équipe (ex. `support`, `sales`, `engineering`).                              |
| **title**         | `varchar(50)`                                                                                         | Nullable                                                                                             | Intitulé du poste (ex. `Support Manager`).                                                  |
| **permissions**   | `jsonb`                                                                                               | Nullable                                                                                             | Permissions spécifiques à cet employé ; peut étendre ou restreindre son rôle.               |
| **status**        | `varchar(50)`                                                                                         | Non nul, défaut `'active'`                                                                           | Statut de l’employé (`active`, `inactive`).                                                 |
| **Audit fields**  | `created_at`, `created_by`, `updated_at`, `updated_by`, `deleted_at`, `deleted_by`, `deletion_reason` | Champs standards pour le suivi des modifications (triggers `set_updated_at_adm_provider_employees`). |

**Index et contraintes supplémentaires :**

- Index B‑tree sur `deleted_at`, `created_by`, `updated_by` et un index partiel sur `status` pour optimiser la recherche des employés actifs.
- Index GIN sur `permissions` pour interroger les autorisations stockées en JSON.
- Les clés étrangères `created_by`, `updated_by`, `deleted_by` se réfèrent à la même table (`adm_provider_employees`), ce qui permet de traîner l’auteur des opérations (en cascade pour les mises à jour, `SET NULL` pour les suppressions).

## 2. Règles métier identifiées

La spécification décrit succinctement la gestion des employés internes dans le module « ERP du personnel »【460046379255693†L669-L674】. En croisant cette description avec le DDL et le code existant, on déduit les règles suivantes :

### 2.1 Portée globale et non multi‑tenant

- **Pas de `tenant_id`** : Les employés internes interviennent sur tous les tenants. L’isolement des données est géré par les permissions et les rôles internes, non par la RLS. Seuls les super‑administrateurs et certains rôles internes peuvent lire/écrire dans cette table.
- **Rôle interne dédié** : Les employés du fournisseur sont distingués des membres via un rôle `provider_staff` dans Clerk. Ce rôle leur donne accès à l’interface d’administration et aux outils internes.

### 2.2 Gestion de l’identité et de l’unicité

- Chaque employé doit disposer d’un **compte Clerk** (`clerk_user_id`). Un index unique partiel sur ce champ empêche la duplication de comptes actifs.
- L’**email** professionnel est également unique parmi les employés non supprimés afin d’éviter les doublons et de simplifier la correspondance des messages internes.

### 2.3 Permissions et responsabilités

- Le champ **`permissions`** permet d’accorder des droits spécifiques à un employé en dehors de ses rôles par défaut (ex. accès aux tickets de niveau 2, autorisation de facturer, gestion des rôles). Ces clés doivent être validées et cohérentes avec la nomenclature utilisée dans les modules (`support:tickets:resolve`, `billing:plans:create`).
- La **gestion des départements et titres** (champs `department` et `title`) permet de structurer l’organisation interne et de filtrer les employés dans les interfaces. Cela supporte les règles d’escalade (un ticket peut être assigné à un employé du département Support). Aucun contrôle n’impose pour l’instant des valeurs prédéfinies.

### 2.4 Cycle de vie et audit

- Le champ **`status`** indique si l’employé est « active » ou « inactive ». Lorsqu’un employé quitte l’entreprise ou est suspendu, son statut passe à `inactive` et ses permissions sont invalidées. Les sessions existantes doivent être révoquées.
- Les champs **`created_by`**, **`updated_by`** et **`deleted_by`** permettent de savoir quel employé a créé, modifié ou supprimé un autre employé. Ces actions doivent être consignées dans `adm_audit_logs` (type d’action : `create_employee`, `update_employee`, `delete_employee`) pour assurer la traçabilité.
- L’absence de `tenant_id` signifie qu’il n’y a pas de RLS ; l’accès est contrôlé par le middleware et les permissions internes.

### 2.5 Intégration ERP et modules internes

Le module **Staff Management & ERP** prévoit un suivi des contrats, départements, salaires et KPI des employés【460046379255693†L669-L674】. Bien que non détaillé dans le DDL, cela implique :

- des relations entre `adm_provider_employees` et une table `hr_employee_contracts` ou similaire pour stocker les dates d’embauche, de fin de contrat, les salaires, etc. ;
- des liens avec un module de gestion de projet et de tickets internes, où les tâches sont assignées selon le département et les rôles.

## 3. Propositions d’amélioration et modèle cible

### 3.1 Structuration des données personnelles et professionnelles

| Problème                                                                                       | Proposition                                                                                                                                                                                              |
| ---------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Nom unique non structuré** : `name` peut contenir prénom et nom combinés.                    | Séparer en `first_name` et `last_name`, avec un champ calculé `full_name`, comme le suggère le modèle Prisma.                                                                                            |
| **Absence d’identifiant interne** : seul un UUID est disponible.                               | Ajouter un champ `employee_number` ou `matricule` (varchar) pour les processus RH et la correspondance avec des systèmes externes.                                                                       |
| **Départements libres** : le champ `department` est une chaîne libre.                          | Introduire une table de référence `hr_departments` et remplacer `department` par une FK ; cela standardise les valeurs et facilite les filtres.                                                          |
| **Statut non normalisé** : `status` est un texte libre.                                        | Remplacer par un type ENUM (`active`, `inactive`, `suspended`, `terminated`) et ajouter un champ `termination_date` pour gérer la fin de contrat.                                                        |
| **Manque d’informations RH** : les dates d’embauche et de fin de contrat ne sont pas stockées. | Ajouter `hire_date`, `probation_end_date`, `termination_date` et un champ `contract_type` (CDI, CDD, freelance).                                                                                         |
| **Permissions non structurées** : les autorisations sont stockées en JSON libre.               | Créer une table `adm_employee_permissions` ou réutiliser `adm_roles` pour gérer les permissions des employés internes de manière centralisée, avec une nomenclature commune aux membres et aux employés. |
| **Hiérarchie interne** : aucune relation n’indique le manager ou le superviseur.               | Ajouter `supervisor_id` (FK vers `adm_provider_employees`) pour modéliser la hiérarchie et permettre l’escalade et la gestion des équipes.                                                               |

### 3.2 Impact sur le modèle et le code

1. **Séparation des noms** : la mise en place de `first_name`/`last_name` nécessite une mise à jour des formulaires et des services internes. Les champs existants peuvent être migrés via un script qui scinde `name` en deux parties.
2. **Gestion des départements** : la création de la table `hr_departments` permet de lier les employés à un département standardisé. Les interfaces doivent proposer une liste déroulante au lieu d’un champ libre.
3. **Ajout des dates de contrat** : le module ERP devra utiliser ces dates pour calculer l’ancienneté, déclencher des rappels de fin de période d’essai et générer des rapports RH. La suppression de la colonne `hire_date` de la version Prisma doit être harmonisée avec ce modèle.
4. **Normalisation des statuts** : l’utilisation d’un ENUM clarifie le cycle de vie et facilite les requêtes (`WHERE status = 'active'`). Il faudra adapter les services d’authentification pour révoquer les sessions en cas de statut `inactive`, `suspended` ou `terminated`.
5. **Permissions centralisées** : déplacer les permissions vers une table dédiée alignera la gestion des droits des employés internes et des membres. Les services d’autorisation devront lire les permissions depuis cette table. Un champ `role_id` pourrait être ajouté pour réutiliser `adm_roles` avec un scope « provider ».
6. **Hiérarchie** : l’ajout de `supervisor_id` permet d’identifier le responsable hiérarchique et d’implémenter des workflows d’approbation ou des escalades de tickets. Il faudra veiller à éviter les boucles de supervision.
7. **Rétention des données** : selon les règles RGPD, les données personnelles (adresse email, nom) des anciens employés doivent être pseudonymisées ou supprimées après la fin du contrat. L’ajout de dates de fin de contrat facilitera l’automatisation de cette opération.

### 3.3 Modèle cible enrichi (schéma simplifié)

Une version améliorée de la table pourrait ressembler à ceci (simplifiée) :

| Champ                                                   | Type           | Détails                                         |
| ------------------------------------------------------- | -------------- | ----------------------------------------------- |
| `id`                                                    | `uuid`         | PK, identifiant de l’employé                    |
| `employee_number`                                       | `varchar(20)`  | Identifiant interne unique                      |
| `clerk_user_id`                                         | `varchar(255)` | ID Clerk unique                                 |
| `first_name` / `last_name`                              | `varchar(100)` | Noms séparés                                    |
| `email`                                                 | `citext`       | Unique, index partiel                           |
| `department_id`                                         | `uuid`         | FK vers `hr_departments`                        |
| `title`                                                 | `varchar(50)`  | Poste                                           |
| `role_id`                                               | `uuid`         | FK vers `adm_roles` (scope provider)            |
| `status`                                                | ENUM           | `active`, `inactive`, `suspended`, `terminated` |
| `hire_date` / `termination_date` / `probation_end_date` | `date`         | Dates RH                                        |
| `supervisor_id`                                         | `uuid`         | FK vers `adm_provider_employees`                |
| `created_at` / `updated_at` / `deleted_at`              | `timestamptz`  | Audit                                           |
| `created_by` / `updated_by` / `deleted_by`              | `uuid`         | FK vers `adm_provider_employees`                |

Les permissions spécifiques seraient gérées via une table `adm_employee_permissions (employee_id, permission_key, allow)` ou via `adm_roles`.

## 4. Impact sur les autres tables et services

- **Modules internes (ERP et Support)** : les services de gestion du personnel devront être étendus pour saisir les nouvelles informations (dates de contrat, département) et respecter les statuts normalisés. Les processus de recrutement et d’onboarding devront créer `employee_number` et `hire_date`.
- **Gestion des droits** : centraliser les permissions des employés internes dans `adm_roles` et/ou `adm_employee_permissions` facilitera la maintenance. Les fonctions d’autorisation devront être unifiées entre membres et employés.
- **Traçabilité** : l’ajout de champs supplémentaires et d’un historique des statuts permettra une meilleure visibilité dans `adm_audit_logs`. Chaque modification importante (changement de département, rôle, statut) devra être consignée.
- **Exportation et anonymisation** : avec des dates de fin de contrat et un statut `terminated`, un processus automatisé pourra anonymiser ou supprimer les données personnelles au bout d’une période définie.

## 5. Conclusion

`adm_provider_employees` est la table de référence pour les collaborateurs internes de Fleetcore. Le modèle actuel est minimaliste mais suffisant pour stocker l’identité, les coordonnées et quelques métadonnées. Toutefois, la spécification du module **Staff Management & ERP** prévoit une gestion plus complète des contrats, des départements et des rôles internes【460046379255693†L669-L674】. Les améliorations proposées – structuration des noms, ajout d’un identifiant interne, normalisation des départements et du statut, gestion des dates de contrat, séparation des permissions et hiérarchie – permettront d’aligner cette table avec ces objectifs et d’assurer une meilleure gouvernance des employés internes.
