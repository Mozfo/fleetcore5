# FLEETCORE - MODULE ADM : PLAN D'EXÉCUTION DÉTAILLÉ

## CHAPITRE 2 - ÉTAPES 2.3 et 2.4 : RBAC AVANCÉ

**Date:** 10 Novembre 2025  
**Version:** 1.0 DÉFINITIVE  
**Périmètre:** Role Versions & Member Roles (Attribution Multi-Rôles)  
**Méthodologie:** Implémentation verticale par fonctionnalité démontrable

---

## 📋 TABLE DES MATIÈRES

1. [ÉTAPE 2.3 : Role Versions - Historique et Rollback](#étape-23--role-versions---historique-et-rollback)
2. [ÉTAPE 2.4 : Member Roles - Attribution Multi-Rôles](#étape-24--member-roles---attribution-multi-rôles)

---

# ÉTAPE 2.3 : Role Versions - Historique et Rollback

**Durée :** 1 jour ouvré (8 heures)  
**Objectif :** Implémenter le versioning complet des rôles avec capacité de rollback  
**Livrable démo :** Interface Admin pour voir l'historique des modifications de rôles et restaurer une version précédente

---

## 🎯 RATIONNEL MÉTIER

**POURQUOI :** Dans un système RBAC, les permissions évoluent constamment. Un admin modifie un rôle "Manager" pour ajouter une permission vehicles.delete, mais 2 jours plus tard réalise que c'était une erreur (un manager a supprimé 50 véhicules par erreur). Sans versioning, impossible de savoir quelles permissions le rôle avait avant la modification. Sans rollback, l'admin doit reconfigurer manuellement toutes les permissions depuis zéro.

**QUEL PROBLÈME :** Actuellement, la table `adm_roles` n'a pas d'historique. Quand un admin modifie les permissions d'un rôle, les anciennes valeurs sont écrasées définitivement. Si une modification cause des problèmes (permissions trop larges créant faille sécurité, ou permissions trop strictes bloquant utilisateurs), aucun moyen de revenir en arrière. L'admin doit :

1. Se rappeler quelles permissions existaient avant (impossible après 2 jours)
2. Reconfigurer manuellement toutes les permissions (20+ permissions = 30 minutes de travail)
3. Risquer d'introduire de nouvelles erreurs pendant la reconfiguration

**IMPACT SI ABSENT :**

- **Sécurité** : Impossible d'auditer les changements de permissions → failles non détectées
- **Conformité** : Audit trail incomplet pour certifications ISO 27001, SOC 2
- **Productivité** : Admin perd 2h/mois à reconfigurer rôles après erreurs
- **Risque** : Permissions erronées non détectées pendant des semaines
- **Traçabilité** : "Qui a donné permission X au rôle Manager ?" → impossible de répondre

**CAS D'USAGE CONCRET :**

**Situation initiale (Jour 1) :**
ABC Logistics utilise FleetCore depuis 3 mois. Le rôle "Manager" a ces permissions :

- vehicles.read ✅
- vehicles.update ✅
- vehicles.delete ❌ (volontairement bloqué pour éviter suppressions accidentelles)
- drivers.read ✅
- drivers.update ✅
- revenues.read ✅
- revenues.update ❌ (données financières protégées)

**Incident (Jour 2) :**
Sarah, admin ABC Logistics, reçoit une demande de Mohamed, Manager Zone Nord : "J'ai besoin de supprimer des véhicules hors service". Sarah va dans Settings > Roles > Manager, et modifie les permissions :

- vehicles.delete ✅ (ajouté)

Version 2 du rôle créée automatiquement. Sarah envoie un email à Mohamed : "C'est activé".

**Problème détecté (Jour 4) :**
Mohamed, en nettoyant les véhicules hors service de la Zone Nord, supprime accidentellement **50 véhicules actifs de la Zone Sud** (scope mal configuré). Catastrophe business : les opérations Zone Sud sont bloquées, planning chauffeurs perdu, revenus non trackables.

**Résolution avec versioning :**

1. Sarah se connecte immédiatement dans Admin > Roles > Manager
2. Voit l'onglet "Version History" avec :
   - **Version 2** (Jour 2, 10h23) : vehicles.delete ajouté par Sarah
   - **Version 1** (création tenant) : configuration initiale sécurisée
3. Sarah clique "Restore Version 1"
4. Modal confirmation : "Restaurer Version 1 du rôle Manager ? Cela révoquera vehicles.delete pour tous les Managers"
5. Sarah confirme
6. **Version 3** créée automatiquement (rollback vers Version 1)
7. Tous les Managers perdent immédiatement vehicles.delete
8. Email automatique envoyé à tous les Managers : "Rôle Manager modifié, permission vehicles.delete révoquée"
9. Audit log créé : "Role Manager rolled back to v1 by Sarah (reason: accidental deletions)"

**Résolution sans versioning :**

1. Sarah doit se rappeler quelles permissions existaient avant (impossible après 2 jours)
2. Sarah reconfigure manuellement 15+ permissions une par une
3. 30 minutes de travail, risque d'erreurs
4. Aucune preuve pour audit que c'était la configuration d'origine
5. Perte de temps et stress

**Valeur business :**

- **Time to recover** : 30 minutes → 30 secondes (rollback en 1 clic)
- **Taux d'erreur** : 30% (reconfig manuelle) → 0% (restauration exacte)
- **Conformité audit** : Impossible → 100% traçable
- **Incidents sécurité évités** : 5+/an (permissions trop larges détectées via historique)

---

## 📊 DONNÉES ET RÈGLES MÉTIER

**Table principale : `adm_role_versions`**

**Colonnes critiques (13 colonnes) :**

| Colonne                  | Type      | Obligatoire | Utilité Business                                 |
| ------------------------ | --------- | ----------- | ------------------------------------------------ |
| **id**                   | uuid      | OUI         | Identifiant unique version (PK)                  |
| **role_id**              | uuid      | OUI         | Rôle versionnalisé (FK → adm_roles)              |
| **version_number**       | integer   | OUI         | Numéro séquentiel (1, 2, 3...)                   |
| **permissions_snapshot** | jsonb     | OUI         | Snapshot complet permissions                     |
| **metadata_snapshot**    | jsonb     | NON         | Snapshot metadata rôle (description, scope_type) |
| **changed_by**           | uuid      | OUI         | Qui a créé cette version (FK → adm_members)      |
| **change_reason**        | text      | OUI         | Raison modification (obligatoire)                |
| **is_active**            | boolean   | OUI         | Cette version est-elle actuellement active ?     |
| **created_at**           | timestamp | OUI         | Date création version                            |
| **updated_at**           | timestamp | OUI         | Date modification                                |
| **deleted_at**           | timestamp | NON         | Date soft delete                                 |
| **deleted_by**           | uuid      | NON         | Qui a supprimé                                   |
| **deletion_reason**      | text      | NON         | Raison suppression                               |

**Règles de versioning :**

**Règle 1 : Version initiale lors création rôle**

```
ALGORITHME createInitialVersion :
  ENTRÉE : role créé avec permissions initiales

  1. Créer version 1 automatiquement
  2. Renseigner :
     - version_number = 1
     - permissions_snapshot = role.permissions (copie complète)
     - metadata_snapshot = { name, description, scope_type, is_system }
     - changed_by = role.created_by
     - change_reason = "Initial version"
     - is_active = true
  3. Toutes futures versions auront version_number incrémenté

  SORTIE : version 1 créée
```

**Règle 2 : Nouvelle version lors modification permissions**

```
ALGORITHME createNewVersionOnUpdate :
  ENTRÉE : role modifié, old_permissions, new_permissions

  1. Comparer old_permissions et new_permissions
  2. SI identiques :
     ALORS ne pas créer nouvelle version (pas de changement réel)
  3. SINON :
     a. Désactiver version actuelle (is_active = false)
     b. Incrémenter version_number (récupérer max + 1)
     c. Créer nouvelle version avec :
        - version_number = max + 1
        - permissions_snapshot = new_permissions (copie complète)
        - metadata_snapshot = état actuel du rôle
        - changed_by = current_user_id
        - change_reason = fourni par admin (obligatoire)
        - is_active = true

  SORTIE : nouvelle version créée, ancienne désactivée
```

**Règle 3 : Rollback vers version précédente**

```
ALGORITHME rollbackToVersion :
  ENTRÉE : role_id, target_version_number, rollback_reason

  1. Récupérer version cible depuis adm_role_versions
  2. Vérifier que target_version_number < version actuelle
  3. Récupérer permissions_snapshot de la version cible
  4. Mettre à jour role dans adm_roles :
     - permissions = permissions_snapshot version cible
     - metadata = metadata_snapshot version cible
  5. Désactiver version actuelle (is_active = false)
  6. Créer NOUVELLE version (rollback = nouvelle version) :
     - version_number = max + 1 (ex: rollback v1 → v3 devient v5)
     - permissions_snapshot = copie depuis version cible
     - metadata_snapshot = { ...metadata, rollback_from: current_version }
     - changed_by = current_user_id
     - change_reason = "Rollback to v{target} - {rollback_reason}"
     - is_active = true
  7. Révoquer toutes sessions actives des membres ayant ce rôle (forcer re-login)
  8. Envoyer notification à tous membres affectés
  9. Créer audit log "role_rolled_back"

  SORTIE : rôle restauré, nouvelle version créée, membres notifiés
```

**Règle 4 : Calcul automatique du diff entre versions**

```
ALGORITHME calculateDiff :
  ENTRÉE : version_old, version_new

  1. Comparer permissions_snapshot des 2 versions
  2. Identifier :
     - Permissions ajoutées (dans new, pas dans old)
     - Permissions supprimées (dans old, pas dans new)
     - Permissions modifiées (valeur changée)
  3. Retourner diff structuré :
     {
       "added": ["vehicles.delete", "revenues.export"],
       "removed": ["drivers.delete"],
       "modified": [
         { "key": "vehicles.read", "old": true, "new": false }
       ]
     }

  SORTIE : diff JSON structuré
```

**Règle 5 : Rétention versions**

```
POLITIQUE RÉTENTION :
  - Conserver TOUTES les versions indéfiniment (aucune suppression auto)
  - Soft delete possible manuellement si nécessaire
  - Audit trail doit rester complet pour conformité SOC 2

EXCEPTION :
  - Versions > 2 ans ET role supprimé → archivage possible
```

**Règles de validation (via RoleVersionCreateSchema Zod) :**

- Role_id : requis, uuid valide, rôle doit exister
- Version_number : requis, integer > 0, séquentiel par role_id
- Permissions_snapshot : requis, JSON valide, non vide
- Changed_by : requis, uuid valide, member doit exister
- Change_reason : requis, min 10 caractères, max 500
- Is_active : requis, boolean, 1 seule version active par role_id

**Règles de cohérence inter-colonnes :**

- Version_number unique par role_id (2 versions ne peuvent avoir même numéro)
- 1 seule version avec is_active = true par role_id
- Permissions_snapshot doit correspondre au schéma de permissions FleetCore
- Deleted_at non null ⇒ is_active = false

---

## 🏗️ COMPOSANTS À DÉVELOPPER

### Backend (Service Layer)

**Fichier à créer : `lib/services/admin/role-version.service.ts`**

Service contenant toute la logique métier des versions de rôles.

**Classe RoleVersionService extends BaseService :**

**Méthode createInitialVersion(roleId: string, permissions: object, changedBy: string) → Promise<RoleVersion>**

1. Récupérer le rôle complet depuis DB
2. Créer version 1 avec :
   - role_id
   - version_number = 1
   - permissions_snapshot = copie profonde de permissions
   - metadata_snapshot = { name, description, scope_type, is_system }
   - changed_by = changedBy
   - change_reason = "Initial version"
   - is_active = true
3. Créer version dans DB via roleVersionRepository.create()
4. Créer audit log "role_version_created"
5. Retourner version créée

**Méthode createNewVersion(roleId: string, oldPermissions: object, newPermissions: object, changeReason: string, changedBy: string) → Promise<RoleVersion>**

1. Comparer oldPermissions et newPermissions
2. SI identiques : retourner version actuelle (pas de changement)
3. SINON :
   a. Récupérer version actuelle (is_active = true)
   b. Calculer diff avec calculateDiff()
   c. Désactiver version actuelle : is_active = false
   d. Récupérer max version_number pour ce role_id
   e. Créer nouvelle version avec :
   - version_number = max + 1
   - permissions_snapshot = copie profonde newPermissions
   - metadata_snapshot = état actuel rôle
   - changed_by = changedBy
   - change_reason
   - is_active = true
     f. Créer version dans DB
     g. Créer audit log "role_version_created" avec diff
     h. Envoyer notification aux admins tenant
4. Retourner nouvelle version créée

**Méthode rollbackToVersion(roleId: string, targetVersionNumber: number, rollbackReason: string, performedBy: string) → Promise<RoleVersion>**

1. Valider rollbackReason (min 10 caractères)
2. Récupérer version cible par role_id et version_number
3. SI version cible n'existe pas : throw NotFoundError
4. Récupérer version actuelle (is_active = true)
5. SI targetVersionNumber >= version actuelle : throw BusinessRuleError("Cannot rollback to current or future version")
6. Extraire permissions_snapshot et metadata_snapshot de version cible
7. Mettre à jour rôle dans adm_roles :
   - permissions = permissions_snapshot version cible
   - metadata fusionné avec metadata_snapshot
8. Désactiver version actuelle : is_active = false
9. Calculer nouveau version_number = max + 1
10. Créer nouvelle version (rollback) avec :
    - version_number = nouveau numéro
    - permissions_snapshot = copie depuis version cible
    - metadata_snapshot = { ...metadata, rollback_from: version actuelle, rollback_to: targetVersionNumber }
    - changed_by = performedBy
    - change_reason = "Rollback to v{target} - {rollbackReason}"
    - is_active = true
11. Créer version dans DB
12. Révoquer sessions actives membres ayant ce rôle (forcer re-login pour appliquer permissions)
13. Créer audit log "role_rolled_back" avec détails
14. Envoyer notification à tous membres affectés par ce rôle
15. Retourner nouvelle version (rollback)

**Méthode getVersionHistory(roleId: string, filters?: VersionFilters) → Promise<RoleVersion[]>**

1. Récupérer toutes versions pour role_id depuis DB
2. Appliquer filtres optionnels (date_from, date_to, changed_by)
3. Trier par version_number DESC (plus récent en premier)
4. Inclure relations : changed_by (member), role
5. Pour chaque version consécutive, calculer diff
6. Retourner liste versions avec diffs

**Méthode getActiveVersion(roleId: string) → Promise<RoleVersion>**

1. Récupérer version avec is_active = true pour role_id
2. SI non trouvée : throw NotFoundError("No active version for role")
3. Retourner version active

**Méthode compareVersions(roleId: string, versionA: number, versionB: number) → Promise<VersionDiff>**

1. Récupérer les 2 versions depuis DB
2. Calculer diff entre permissions_snapshot des 2 versions
3. Calculer diff entre metadata_snapshot des 2 versions
4. Retourner diff structuré avec added/removed/modified

**Méthode calculateDiff(oldPermissions: object, newPermissions: object) → object**
Algorithme détaillé dans "Règle 4 : Calcul automatique du diff" ci-dessus.

**Fichier à créer : `lib/repositories/admin/role-version.repository.ts`**

Repository pour encapsuler accès Prisma à la table adm_role_versions.

**Méthode findAllByRoleId(roleId: string, options?) → Promise<RoleVersion[]>**
Récupère toutes versions d'un rôle avec filtres et pagination.

**Méthode findActiveVersion(roleId: string) → Promise<RoleVersion | null>**
Récupère la version active (is_active = true) d'un rôle.

**Méthode getMaxVersionNumber(roleId: string) → Promise<number>**
Retourne le numéro de version maximum pour un rôle.

---

### API REST (Endpoints)

**Fichier à créer : `app/api/v1/admin/roles/[id]/versions/route.ts`**

**GET /api/v1/admin/roles/[id]/versions**

- **Description** : Liste toutes les versions d'un rôle avec historique complet
- **Query params** :
  - from_date : filtrer versions après cette date
  - to_date : filtrer versions avant cette date
  - changed_by : filtrer par auteur
  - limit, offset : pagination
- **Permissions** : roles.read
- **Réponse 200** :

```json
{
  "versions": [
    {
      "id": "uuid-v3",
      "role_id": "uuid-role",
      "version_number": 3,
      "permissions_snapshot": {
        "vehicles": { "read": true, "update": true, "delete": false },
        "drivers": { "read": true, "update": true }
      },
      "metadata_snapshot": {
        "name": "Manager",
        "description": "Manager with limited permissions"
      },
      "changed_by": {
        "id": "uuid-sarah",
        "first_name": "Sarah",
        "last_name": "Admin"
      },
      "change_reason": "Removed vehicles.delete after accidental deletions",
      "is_active": true,
      "created_at": "2025-11-10T10:45:00Z",
      "diff_from_previous": {
        "added": [],
        "removed": ["vehicles.delete"],
        "modified": []
      }
    },
    {
      "id": "uuid-v2",
      "version_number": 2,
      "is_active": false,
      "created_at": "2025-11-08T10:23:00Z",
      "change_reason": "Added vehicles.delete for Mohamed request",
      "diff_from_previous": {
        "added": ["vehicles.delete"],
        "removed": [],
        "modified": []
      }
    },
    {
      "id": "uuid-v1",
      "version_number": 1,
      "is_active": false,
      "created_at": "2025-09-01T14:00:00Z",
      "change_reason": "Initial version",
      "diff_from_previous": null
    }
  ],
  "total": 3
}
```

**Fichier à créer : `app/api/v1/admin/roles/[id]/versions/[versionNumber]/rollback/route.ts`**

**POST /api/v1/admin/roles/[id]/versions/[versionNumber]/rollback**

- **Description** : Restaurer une version précédente du rôle
- **Body** :

```json
{
  "rollback_reason": "Reverting vehicles.delete permission due to accidental bulk deletions in Zone Sud"
}
```

- **Permissions** : roles.update + roles.rollback (permission spéciale)
- **Réponse 200** :

```json
{
  "success": true,
  "rolled_back_to": 1,
  "new_version_created": {
    "id": "uuid-new",
    "version_number": 4,
    "is_active": true,
    "permissions_snapshot": {
      /* permissions de v1 */
    },
    "change_reason": "Rollback to v1 - Reverting vehicles.delete...",
    "created_at": "2025-11-10T10:50:00Z"
  },
  "affected_members_count": 15,
  "notifications_sent": true
}
```

- **Erreurs** :
  - 403 : Permission insuffisante (roles.rollback requis)
  - 422 : Cannot rollback to current or future version
  - 404 : Target version not found

**Fichier à créer : `app/api/v1/admin/roles/[id]/versions/compare/route.ts`**

**GET /api/v1/admin/roles/[id]/versions/compare?versionA=1&versionB=3**

- **Description** : Comparer 2 versions pour voir les différences
- **Query params** : versionA, versionB (numéros de version)
- **Permissions** : roles.read
- **Réponse 200** :

```json
{
  "role_id": "uuid-role",
  "version_a": {
    "version_number": 1,
    "created_at": "2025-09-01T14:00:00Z"
  },
  "version_b": {
    "version_number": 3,
    "created_at": "2025-11-10T10:45:00Z"
  },
  "permissions_diff": {
    "added": [],
    "removed": [],
    "modified": []
  },
  "metadata_diff": {
    "added": [],
    "removed": [],
    "modified": [
      {
        "key": "description",
        "old": "Manager role",
        "new": "Manager with limited permissions"
      }
    ]
  }
}
```

---

### Frontend (Interface Utilisateur)

**Fichier à créer : `app/[locale]/admin/roles/[id]/versions/page.tsx`**

Page dédiée à l'historique des versions d'un rôle avec capacité de rollback.

**Layout de la page :**

```
┌──────────────────────────────────────────────────────────────┐
│ HEADER                                                       │
│ [← Back to Roles] Role: Manager > Version History           │
└──────────────────────────────────────────────────────────────┘
┌──────────────────────────────────────────────────────────────┐
│ CURRENT VERSION                                              │
│ Version 3 (Active) - Created Nov 10, 2025 10:45             │
│ Changed by: Sarah Admin                                      │
│ Reason: Removed vehicles.delete after accidental deletions  │
│                                                              │
│ ┌─ Permissions ──────────────────────────────────────────┐ │
│ │ ✅ vehicles.read                                        │ │
│ │ ✅ vehicles.update                                      │ │
│ │ ❌ vehicles.delete (removed in this version)           │ │
│ │ ✅ drivers.read                                         │ │
│ │ ✅ drivers.update                                       │ │
│ └────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
┌──────────────────────────────────────────────────────────────┐
│ VERSION HISTORY                                              │
│                                                              │
│ ┌─ Version 3 (Current) ──────────────────────────────────┐ │
│ │ 📅 Nov 10, 2025 10:45                                  │ │
│ │ 👤 Sarah Admin                                         │ │
│ │ 📝 Removed vehicles.delete after accidental deletions │ │
│ │ 🔄 Changes:                                            │ │
│ │    ➖ vehicles.delete                                  │ │
│ └────────────────────────────────────────────────────────┘ │
│                                                              │
│ ┌─ Version 2 ───────────────────────────────────────────┐ │
│ │ 📅 Nov 8, 2025 10:23                                   │ │
│ │ 👤 Sarah Admin                                         │ │
│ │ 📝 Added vehicles.delete for Mohamed request          │ │
│ │ 🔄 Changes:                                            │ │
│ │    ➕ vehicles.delete                                  │ │
│ │ [Compare with v3] [🔄 Restore this version]           │ │
│ └────────────────────────────────────────────────────────┘ │
│                                                              │
│ ┌─ Version 1 (Initial) ─────────────────────────────────┐ │
│ │ 📅 Sep 1, 2025 14:00                                   │ │
│ │ 👤 System                                              │ │
│ │ 📝 Initial version                                     │ │
│ │ [Compare with v3] [🔄 Restore this version]           │ │
│ └────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

**Fonctionnalités :**

- **Timeline visuelle** : Toutes versions affichées chronologiquement (plus récent en haut)
- **Diff visuel** : Pour chaque version, afficher changements par rapport à version précédente (➕ ajouts, ➖ suppressions, 🔄 modifications)
- **Version active** : Badge "Current" sur version actuellement active
- **Bouton Compare** : Ouvrir modal pour comparer 2 versions côte à côte
- **Bouton Restore** : Restaurer une version précédente (avec confirmation)
- **Filtres** : Par date, par auteur

**Composant à créer : `components/admin/RoleVersionTimeline.tsx`**

Composant réutilisable pour afficher timeline des versions.

**Props :**

- versions : RoleVersion[]
- onRestore : (versionNumber) => void
- onCompare : (versionA, versionB) => void

**Affichage :**

- Timeline verticale avec carte par version
- Icône différente selon type : 📝 modification, 🔄 rollback, ⭐ initial
- Diff visuel avec couleurs (vert ajout, rouge suppression, orange modification)
- Badge "Active" sur version actuelle

**Composant à créer : `components/admin/RollbackConfirmModal.tsx`**

Modal de confirmation avant rollback avec impact détaillé.

**Contenu :**

```
⚠️ Confirm Rollback to Version 1

You are about to restore Version 1 (created Sep 1, 2025).

Impact:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Permissions that will be removed:
  ❌ vehicles.delete

Permissions that will be added:
  (none)

Affected Members: 15 managers will be impacted
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

This will:
• Create a new version (v4) with permissions from v1
• Force all affected members to re-login
• Send notifications to all 15 affected members

Reason for rollback (required):
┌────────────────────────────────────────────┐
│ [Textarea: min 10 chars]                   │
│                                            │
└────────────────────────────────────────────┘

[Cancel] [⚠️ Confirm Rollback]
```

**Validation :**

- Reason min 10 caractères, max 500
- Checkbox "I understand this will affect 15 members" (requis)
- Bouton Confirm disabled tant que validation pas OK

**Composant à créer : `components/admin/VersionCompareModal.tsx`**

Modal pour comparer 2 versions côte à côte.

**Affichage :**

```
Compare Versions: v1 vs v3

┌─────────────────────────────┬─────────────────────────────┐
│ Version 1                   │ Version 3 (Current)         │
│ Sep 1, 2025 14:00          │ Nov 10, 2025 10:45         │
├─────────────────────────────┼─────────────────────────────┤
│ Permissions:                │ Permissions:                │
│ ✅ vehicles.read            │ ✅ vehicles.read            │
│ ✅ vehicles.update          │ ✅ vehicles.update          │
│ ❌ vehicles.delete          │ ❌ vehicles.delete          │
│ ✅ drivers.read             │ ✅ drivers.read             │
│ ✅ drivers.update           │ ✅ drivers.update           │
├─────────────────────────────┼─────────────────────────────┤
│ Metadata:                   │ Metadata:                   │
│ name: Manager               │ name: Manager               │
│ description: Manager role   │ description: Manager with   │
│                             │              limited perms  │
└─────────────────────────────┴─────────────────────────────┘

Summary of Changes:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Permissions: No changes
Metadata: 1 field modified (description)

[Close] [Restore v1]
```

---

## 🎬 RÉSULTAT DÉMONTRABLE

**Scénario démo complet pour le sponsor :**

**1. Historique versions accessible**

- Admin se connecte, navigue vers Admin > Roles
- Cliquer sur rôle "Manager"
- Voir onglet "Version History" avec badge "3 versions"
- Cliquer sur onglet
- Page s'ouvre avec timeline complète des 3 versions

**2. Visualisation changements**

- Voir Version 3 (actuelle) en haut avec badge "Current"
- Voir diff visuel : ➖ vehicles.delete (supprimé dans v3 vs v2)
- Voir Version 2 avec diff : ➕ vehicles.delete (ajouté dans v2 vs v1)
- Voir Version 1 (Initial) sans diff

**3. Comparaison versions**

- Cliquer "Compare with v3" sur Version 1
- Modal s'ouvre avec comparaison côte à côte
- Voir clairement : aucune différence permissions entre v1 et v3
- Voir différence metadata : description modifiée
- Fermer modal

**4. Rollback vers version précédente**

- Cliquer "🔄 Restore this version" sur Version 1
- Modal confirmation s'ouvre
- Voir impact détaillé :
  - Permissions removed : vehicles.delete (bien que déjà absent en v3, mais message pédagogique)
  - Affected members : 15 managers
  - Notifications à envoyer : 15 emails
- Remplir raison : "Reverting to original secure configuration after incident"
- Cocher checkbox "I understand..."
- Cliquer "Confirm Rollback"
- Modal se ferme, toast "Version restored successfully. 15 members notified."
- Timeline mise à jour : nouvelle Version 4 créée (rollback to v1)
- Badge "Current" déplacé sur Version 4

**5. Vérification audit trail**

- Naviguer vers Admin > Audit Logs
- Filtrer par entity = "roles", action = "rolled_back"
- Voir log créé avec :
  - Performed by : Sarah Admin
  - Action : "role_rolled_back"
  - Changes : { from_version: 3, to_version: 1, new_version: 4, reason: "..." }
  - Timestamp : il y a 30 secondes

**6. Vérification membres notifiés**

- Naviguer vers Admin > Notifications
- Filtrer par template = "role_updated"
- Voir 15 notifications envoyées avec status "sent"
- Cliquer sur une notification pour voir contenu email
- Email dit : "The Manager role has been updated. Permission vehicles.delete has been removed. Please re-login to apply changes."

**7. Vérification permissions appliquées**

- Se déconnecter admin
- Se connecter comme Mohamed (Manager)
- Session révoquée, forcé à re-login
- Après re-login, naviguer vers Vehicles
- Vérifier bouton "Delete" absent (permission révoquée)
- Essayer appel API DELETE /vehicles/[id] directement
- Recevoir 403 Forbidden (permission vérifiée côté serveur)

**Critères d'acceptation :**

- ✅ Version initiale créée automatiquement lors création rôle
- ✅ Nouvelle version créée automatiquement lors modification permissions
- ✅ Timeline versions affiche toutes versions chronologiquement
- ✅ Diff visuel entre versions affiché correctement (➕➖🔄)
- ✅ Modal Compare affiche différences côte à côte
- ✅ Rollback crée nouvelle version avec permissions version cible
- ✅ Rollback révoque sessions actives membres affectés
- ✅ Rollback envoie notifications à tous membres affectés
- ✅ Audit log créé avec détails rollback complet
- ✅ Permissions appliquées immédiatement après rollback
- ✅ API vérifie permissions mises à jour (pas de cache stale)
- ✅ Version active marquée clairement dans UI
- ✅ Raison rollback obligatoire et sauvegardée

---

## ⏱️ ESTIMATION

- **Temps backend** : **5 heures**
  - RoleVersionService : 3h (7 méthodes)
  - RoleVersionRepository : 1h
  - Algorithme calculateDiff : 1h
- **Temps API** : **2 heures**
  - GET /versions : 0.5h
  - POST /rollback : 1h (complexe, révocation sessions)
  - GET /compare : 0.5h
- **Temps frontend** : **5 heures**
  - Page Version History : 2h
  - RoleVersionTimeline component : 1h
  - RollbackConfirmModal : 1h
  - VersionCompareModal : 1h
- **Temps tests** : **2 heures**
  - Tests unitaires service : 1h
  - Tests API : 0.5h
  - Test E2E rollback : 0.5h
- **TOTAL : 14 heures (~2 jours)** ⚠️ Révision estimation à 2 jours

---

## 🔗 DÉPENDANCES

**Prérequis obligatoires :**

- ÉTAPE 2.1 terminée (Roles créés)
- ÉTAPE 2.2 terminée (Permissions granulaires)
- Table adm_role_versions existante en DB
- BaseService (pour héritage)

**Services/composants requis :**

- RoleService (déjà créé en 2.1)
- AuditService (pour logging rollback)
- NotificationService (pour notifier membres affectés)
- SessionService (pour révoquer sessions)

**Données de test nécessaires :**

- 1 rôle avec 3+ versions (simuler historique)
- 15 membres avec ce rôle assigné
- Permissions variées entre versions

---

## ✅ CHECKLIST DE VALIDATION

- [ ] **Backend** : RoleVersionService compile, toutes méthodes implémentées
- [ ] **Backend** : createInitialVersion() crée version 1 lors création rôle
- [ ] **Backend** : createNewVersion() incrémente version_number correctement
- [ ] **Backend** : rollbackToVersion() crée nouvelle version avec permissions cible
- [ ] **Backend** : calculateDiff() retourne diff structuré correct
- [ ] **Backend** : 1 seule version active (is_active = true) par rôle vérifiée
- [ ] **API** : GET /versions retourne timeline complète avec diffs
- [ ] **API** : POST /rollback crée nouvelle version et révoque sessions
- [ ] **API** : GET /compare retourne diff permissions et metadata
- [ ] **Frontend** : Page Version History affiche timeline chronologique
- [ ] **Frontend** : Diff visuel entre versions affiché (➕➖🔄)
- [ ] **Frontend** : Modal Rollback affiche impact détaillé
- [ ] **Frontend** : Modal Compare affiche versions côte à côte
- [ ] **Tests** : Test rollback crée version et révoque sessions
- [ ] **Tests** : Test calculateDiff avec cas complexes
- [ ] **Tests** : Test E2E rollback → re-login → permissions appliquées
- [ ] **Démo** : Pouvoir restaurer version précédente d'un rôle
- [ ] **Démo** : Membres affectés reçoivent notification
- [ ] **Démo** : Sessions révoquées, membres doivent re-login
- [ ] **Démo** : Permissions appliquées immédiatement après rollback

---

# ÉTAPE 2.4 : Member Roles - Attribution Multi-Rôles

**Durée :** 1.5 jours ouvrés (12 heures)  
**Objectif :** Implémenter l'attribution multiple de rôles par membre avec scopes et contexte temporel  
**Livrable démo :** Interface Admin pour assigner plusieurs rôles à un membre avec scopes différents et voir toutes ses permissions agrégées

---

## 🎯 RATIONNEL MÉTIER

**POURQUOI :** Dans une organisation complexe, un utilisateur peut avoir plusieurs responsabilités simultanées. Mohamed est Manager de la Zone Nord (doit gérer véhicules et chauffeurs de cette zone) ET Responsable Formation (doit accéder aux documents de formation globalement). Avec un rôle unique, impossible de modéliser cette réalité. Il faut soit créer un rôle hybride "Manager Nord + Formation" (explosion combinatoire : 50 rôles pour 10 responsabilités de base), soit donner permissions trop larges (Mohamed accède à toutes zones).

**QUEL PROBLÈME :** Actuellement, la table `adm_members` a un champ `default_role_id` qui ne permet qu'UN seul rôle principal. Si Mohamed a besoin de 2 rôles (Manager Zone Nord + Responsable Formation), impossible. Les solutions actuelles sont mauvaises :

1. **Créer rôle composite** : "Manager_Nord_Formation" → explosion combinatoire (50 rôles pour 10 postes de base)
2. **Donner permissions trop larges** : Rôle "Manager" sans scope → Mohamed voit toutes zones (faille sécurité)
3. **Modifier permissions dynamiquement** : Ajouter permissions formation au rôle Manager → tous managers obtiennent accès formation (pas désiré)

Aucune solution satisfaisante. Il faut un système d'**attribution multiple avec scopes**.

**IMPACT SI ABSENT :**

- **Sécurité** : Permissions trop larges pour éviter multiplication rôles → violations least privilege
- **Complexité** : 10 postes de base × 5 zones × 3 niveaux = 150 rôles au lieu de 30
- **Maintenance** : Chaque changement permission nécessite modification 20+ rôles
- **Rigidité** : Impossible de modéliser réalité organisationnelle complexe
- **Conformité** : Audit trail incomplet (qui a quel rôle dans quel contexte ?)

**CAS D'USAGE CONCRET :**

**Situation : ABC Logistics, organisation multi-sites**

**Organigramme :**

- **Mohamed** : Manager Zone Nord (Dubai North) + Responsable Formation Entreprise
- **Sarah** : Manager Zone Sud (Dubai South)
- **Ahmed** : Directeur Opérations (supervise toutes zones)

**Besoins permissions Mohamed :**

**En tant que Manager Zone Nord :**

- vehicles.read/update/delete (scope : Zone Nord uniquement)
- drivers.read/update (scope : Zone Nord uniquement)
- trips.read (scope : Zone Nord uniquement)
- revenues.read (scope : Zone Nord uniquement)

**En tant que Responsable Formation :**

- training_docs.read/update/create (scope : Global - toute entreprise)
- training_sessions.manage (scope : Global)
- certifications.approve (scope : Global)

**Workflow attribution multi-rôles :**

**Jour 1 : Mohamed rejoint comme Manager Zone Nord**

1. Admin crée compte Mohamed
2. Admin assigne rôle "Manager" avec scope "branch:north"
3. Mohamed se connecte, voit uniquement véhicules/chauffeurs Zone Nord ✅

**Jour 30 : Mohamed devient aussi Responsable Formation**

1. Direction nomme Mohamed Responsable Formation (en plus de Manager)
2. Admin va dans Admin > Members > Mohamed > Roles
3. Voir rôle actuel : "Manager (Zone Nord)"
4. Cliquer "Assign Additional Role"
5. Modal s'ouvre :
   - Rôle : Dropdown → sélectionner "Training Manager"
   - Scope : "Global (all branches)" (car formation transverse)
   - Valide du : aujourd'hui
   - Valide jusqu'au : (optionnel, peut être permanent)
   - Raison : "Mohamed appointed as Training Manager by CEO"
   - Is primary : ❌ (rôle secondaire, Manager reste primaire)
6. Admin confirme
7. **Member_role créé dans adm_member_roles** :
   - member_id : Mohamed
   - role_id : Training Manager
   - scope_type : 'global'
   - scope_id : null (global)
   - is_primary : false
   - assigned_by : Admin
   - assignment_reason : "Mohamed appointed..."

**Jour 31 : Mohamed se connecte**

1. Mohamed login dans FleetCore
2. Système charge **toutes** les assignations de rôles depuis adm_member_roles
3. Système agrège permissions :
   - Rôle 1 (Manager Zone Nord) → vehicles.read/update/delete (scope Nord)
   - Rôle 2 (Training Manager) → training_docs.read/update/create (scope global)
4. Mohamed voit dashboard avec :
   - Section "My Vehicles" → uniquement Zone Nord ✅
   - Section "Training Documents" → tous documents entreprise ✅
5. Mohamed va dans Vehicles
   - Liste affiche véhicules Zone Nord uniquement (scope branch:north)
   - Bouton "Delete" visible (permission vehicles.delete depuis rôle Manager)
6. Mohamed va dans Training Documents
   - Liste affiche tous documents (scope global)
   - Bouton "Create New Document" visible (permission training_docs.create)

**Jour 60 : Fin mission formation**

1. Direction nomme quelqu'un d'autre Responsable Formation
2. Admin révoque rôle "Training Manager" de Mohamed
3. Admin va dans Mohamed > Roles
4. Cliquer "..." sur rôle "Training Manager"
5. Cliquer "Revoke Role"
6. Modal confirmation : "Revoke Training Manager from Mohamed ?"
7. Champ "Reason" : "Training responsibility transferred to Sarah"
8. Confirmer
9. Member_role mis à jour :
   - deleted_at = now
   - deleted_by = Admin
   - deletion_reason = "Training responsibility..."
10. Mohamed perd immédiatement accès section Training Documents

**Situation complexe : Ahmed, Directeur Opérations**

Ahmed supervise toutes zones mais avec permissions limitées (lecture seule sauf approbations).

**Assignations multiples Ahmed :**

1. **Rôle : Director** (is_primary: true)
   - Scope : Global
   - Permissions : vehicles.read, drivers.read, revenues.read (lecture seule toutes zones)
2. **Rôle : Approval Manager** (is_primary: false)
   - Scope : Global
   - Permissions : expenses.approve, purchases.approve
3. **Rôle : Zone North Manager** (is_primary: false) - temporaire 2 semaines
   - Scope : branch:north
   - Permissions : vehicles.update, drivers.update (permissions modification Zone Nord)
   - valid_until : dans 2 semaines (remplace Manager absent)

Agrégation permissions Ahmed :

- vehicles.read (global) + vehicles.update (Nord) → peut lire toutes zones, modifier uniquement Nord ✅
- drivers.read (global) + drivers.update (Nord) → peut lire tous chauffeurs, modifier uniquement Nord ✅
- expenses.approve (global) → peut approuver dépenses toutes zones ✅

**Valeur business :**

- **Flexibilité** : Modélise réalité organisationnelle complexe
- **Sécurité** : Least privilege respecté (scopes granulaires)
- **Simplicité** : 30 rôles de base au lieu de 150 rôles composites
- **Audit trail** : Historique complet qui a quel rôle quand et pourquoi
- **Temporalité** : Rôles temporaires (remplacements, missions) gérés nativement

---

## 📊 DONNÉES ET RÈGLES MÉTIER

**Table principale : `adm_member_roles`**

**Colonnes critiques (17 colonnes) :**

| Colonne               | Type      | Obligatoire | Utilité Business                           |
| --------------------- | --------- | ----------- | ------------------------------------------ |
| **id**                | uuid      | OUI         | Identifiant unique assignation (PK)        |
| **tenant_id**         | uuid      | OUI         | Tenant isolation (FK → adm_tenants)        |
| **member_id**         | uuid      | OUI         | Membre assigné (FK → adm_members)          |
| **role_id**           | uuid      | OUI         | Rôle assigné (FK → adm_roles)              |
| **is_primary**        | boolean   | OUI         | Ce rôle est-il le rôle principal ?         |
| **scope_type**        | enum      | OUI         | Type de scope (global, branch, team, zone) |
| **scope_id**          | uuid      | NON         | ID entité scopée (branch_id, team_id)      |
| **assigned_by**       | uuid      | OUI         | Qui a assigné (FK → adm_members)           |
| **assignment_reason** | text      | OUI         | Raison assignation (obligatoire)           |
| **valid_from**        | timestamp | OUI         | Date début validité                        |
| **valid_until**       | timestamp | NON         | Date fin validité (null = permanent)       |
| **priority**          | integer   | OUI         | Priorité pour résolution conflits (1-100)  |
| **created_at**        | timestamp | OUI         | Date création                              |
| **updated_at**        | timestamp | OUI         | Date modification                          |
| **deleted_at**        | timestamp | NON         | Date révocation (soft delete)              |
| **deleted_by**        | uuid      | NON         | Qui a révoqué                              |
| **deletion_reason**   | text      | NON         | Raison révocation                          |

**Règles d'attribution multi-rôles :**

**Règle 1 : Un seul rôle primaire par membre**

```
CONTRAINTE UNICITÉ :
  - Pour un membre donné, 1 seul role avec is_primary = true
  - Lors assignation nouveau rôle primaire, ancien is_primary passe à false
  - Rôle primaire utilisé pour affichage titre dans UI ("Mohamed - Manager")
```

**Règle 2 : Scopes hiérarchiques**

```
TYPES DE SCOPE :
  - 'global' : Accès à toutes entités (ex: Directeur)
    → scope_id = null
  - 'branch' : Accès limité à une agence/site
    → scope_id = fleet_branches.id
  - 'zone' : Accès limité à une zone géographique
    → scope_id = fleet_zones.id
  - 'team' : Accès limité à une équipe
    → scope_id = fleet_teams.id

HIÉRARCHIE (du plus large au plus restreint) :
  global > zone > branch > team

ALGORITHME checkScopeAccess :
  ENTRÉE : member_scope, resource_scope

  SI member_scope = 'global'
    ALORS accès autorisé (peut tout voir)
  SINON SI member_scope = resource_scope ET scope_id = resource_scope_id
    ALORS accès autorisé (scope exact match)
  SINON SI member_scope hiérarchiquement supérieur à resource_scope
    ET resource inclus dans member_scope_id
    ALORS accès autorisé (ex: zone Nord inclut branches Dubai North, Sharjah)
  SINON
    accès refusé
  FIN SI
```

**Règle 3 : Validité temporelle**

```
ALGORITHME checkTemporalValidity :
  ENTRÉE : member_role, current_date

  SI member_role.deleted_at IS NOT NULL
    ALORS rôle révoqué, non actif
  SINON SI current_date < member_role.valid_from
    ALORS rôle pas encore actif
  SINON SI member_role.valid_until IS NOT NULL
        ET current_date > member_role.valid_until
    ALORS rôle expiré, non actif
  SINON
    rôle actif
  FIN SI
```

**Règle 4 : Agrégation permissions**

```
ALGORITHME aggregatePermissions :
  ENTRÉE : member_id

  1. Récupérer toutes assignations actives :
     - WHERE deleted_at IS NULL
     - AND now() BETWEEN valid_from AND COALESCE(valid_until, 'infinity')

  2. Pour chaque assignation :
     a. Charger permissions du rôle
     b. Appliquer scope de l'assignation
     c. Assigner priorité à chaque permission

  3. Résoudre conflits (même ressource, différentes permissions) :
     - Prendre permission la plus permissive
     - Exemple : vehicles.delete (scope global) + vehicles.read (scope Nord)
       → vehicles.delete l'emporte (plus permissif)

  4. Retourner permissions agrégées par ressource et scope

  SORTIE : {
    "vehicles": {
      "read": { "scope": "global", "from_role": "Director" },
      "update": { "scope": "branch:north", "from_role": "Manager North" },
      "delete": { "scope": "branch:north", "from_role": "Manager North" }
    },
    "training_docs": {
      "read": { "scope": "global", "from_role": "Training Manager" },
      "create": { "scope": "global", "from_role": "Training Manager" }
    }
  }
```

**Règle 5 : Priorité pour résolution conflits**

```
RÈGLE PRIORITÉ :
  - Chaque assignation a un priority (1-100)
  - Par défaut : is_primary = true → priority = 100
  - Par défaut : is_primary = false → priority = 50
  - Admin peut override manuellement

RÉSOLUTION CONFLITS :
  SI 2 rôles donnent permissions différentes sur même ressource
    ALORS prendre permission du rôle avec priority la plus élevée

  Exemple :
    - Rôle A (priority 100) : vehicles.read (scope global)
    - Rôle B (priority 50) : vehicles.read = false (scope branch)
    → Rôle A l'emporte, vehicles.read activé globalement
```

**Règle 6 : Révocation cascade**

```
ALGORITHME revokeMemberRole :
  ENTRÉE : member_role_id, reason

  1. Mettre à jour member_role :
     - deleted_at = now
     - deleted_by = current_user_id
     - deletion_reason = reason

  2. SI is_primary = true :
     a. Trouver autre rôle actif du membre
     b. SI existe : promouvoir à is_primary = true
     c. SINON : membre n'a plus de rôle (statut suspended ?)

  3. Révoquer session active du membre (forcer re-login)
  4. Recalculer permissions agrégées
  5. Créer audit log "member_role_revoked"
  6. Envoyer notification au membre
```

**Règles de validation (via MemberRoleCreateSchema Zod) :**

- Member_id : requis, uuid valide, membre doit exister et être actif
- Role_id : requis, uuid valide, rôle doit exister et être actif
- Tenant_id : requis, doit correspondre au tenant du membre ET du rôle
- Scope_type : enum valide (global, branch, zone, team)
- Scope_id : requis si scope_type != 'global', uuid valide, entité doit exister
- Assignment_reason : requis, min 10 caractères, max 500
- Valid_from : requis, >= created_at
- Valid_until : optionnel, > valid_from si fourni
- Priority : optionnel, integer 1-100, défaut selon is_primary

**Règles de cohérence inter-colonnes :**

- Is_primary = true → 1 seul par membre (contrainte unique partielle)
- Scope_type = 'global' → scope_id DOIT être null
- Scope_type != 'global' → scope_id DOIT être non null
- Valid_until < now ⇒ rôle expiré (peut être révoqué automatiquement)
- Deleted_at non null ⇒ deleted_by et deletion_reason obligatoires

**Règles de cohérence inter-tables :**

- Member_id, role_id, tenant_id doivent tous exister
- Pas de duplication (member_id + role_id + scope_type + scope_id) unique par tenant
- Scope_id doit référencer table correspondante (fleet_branches, fleet_zones, fleet_teams)

---

## 🏗️ COMPOSANTS À DÉVELOPPER

### Backend (Service Layer)

**Fichier à créer : `lib/services/admin/member-role.service.ts`**

Service contenant toute la logique métier des attributions de rôles.

**Classe MemberRoleService extends BaseService :**

**Méthode assignRole(params: MemberRoleAssignInput) → Promise<MemberRole>**

1. Valider params avec MemberRoleAssignSchema
2. Extraire member_id, role_id, scope_type, scope_id, assignment_reason
3. Vérifier que membre existe et est actif
4. Vérifier que rôle existe et est actif
5. Vérifier que tenant_id cohérent (membre et rôle même tenant)
6. SI scope_type != 'global' :
   a. Vérifier que scope_id fourni
   b. Vérifier que entité scopée existe (branch, zone, team)
7. Vérifier unicité (member + role + scope) via findExisting()
8. SI params.is_primary = true :
   a. Désactiver ancien rôle primaire (is_primary = false)
9. Créer member_role dans DB via memberRoleRepository.create() :
   - tenant_id, member_id, role_id
   - is_primary (défaut false)
   - scope_type, scope_id
   - assigned_by = current_user_id
   - assignment_reason
   - valid_from = now
   - valid_until (optionnel)
   - priority (calculé selon is_primary)
10. Invalider cache permissions du membre
11. Révoquer session active (forcer re-login pour charger nouveau rôle)
12. Créer audit log "member_role_assigned"
13. Envoyer notification au membre
14. Retourner member_role créé

**Méthode revokeRole(memberRoleId: string, reason: string) → Promise<void>**

1. Récupérer member_role par ID
2. Vérifier que deleted_at IS NULL (pas déjà révoqué)
3. Mettre à jour member_role :
   - deleted_at = now
   - deleted_by = current_user_id
   - deletion_reason = reason
4. SI is_primary = true :
   a. Trouver autre rôle actif du même membre
   b. SI existe : promouvoir à is_primary = true
   c. SINON : logger warning (membre sans rôle primaire)
5. Invalider cache permissions du membre
6. Révoquer session active (forcer re-login)
7. Créer audit log "member_role_revoked"
8. Envoyer notification au membre
9. Retourner succès

**Méthode updateRole(memberRoleId: string, updates: MemberRoleUpdateInput) → Promise<MemberRole>**

1. Valider updates avec MemberRoleUpdateSchema
2. Récupérer member_role par ID
3. SI updates.is_primary = true :
   a. Désactiver ancien rôle primaire du membre
4. SI updates.scope_type ou scope_id modifié :
   a. Valider nouveau scope
5. SI updates.valid_until modifié :
   a. Vérifier > valid_from
6. Mettre à jour member_role dans DB
7. Invalider cache permissions
8. Créer audit log "member_role_updated"
9. Retourner member_role mis à jour

**Méthode getMemberRoles(memberId: string, options?: FilterOptions) → Promise<MemberRole[]>**

1. Récupérer toutes assignations du membre
2. Appliquer filtres optionnels (active_only, scope_type)
3. SI options.active_only = true :
   - Filtrer par deleted_at IS NULL
   - Filtrer par validité temporelle (valid_from <= now <= valid_until)
4. Inclure relations : role, assigned_by
5. Trier par priority DESC, created_at DESC
6. Retourner liste member_roles

**Méthode aggregatePermissions(memberId: string) → Promise<AggregatedPermissions>**
Implémente l'algorithme d'agrégation décrit dans "Règle 4 : Agrégation permissions" ci-dessus.

**Méthode checkPermission(memberId: string, resource: string, action: string, targetScope?: Scope) → Promise<boolean>**

1. Récupérer permissions agrégées via aggregatePermissions()
2. Chercher permission pour resource.action
3. SI trouvée :
   a. SI targetScope fourni, vérifier scope avec checkScopeAccess()
   b. SINON retourner true
4. SINON retourner false

**Méthode expireRoles() → Promise<number>**
Méthode appelée par cron job quotidien pour révoquer automatiquement rôles expirés.

1. Trouver tous member_roles avec :
   - deleted_at IS NULL
   - valid_until < now
2. Pour chaque member_role expiré :
   - Appeler revokeRole() avec reason = "Automatic expiration"
3. Retourner nombre de rôles révoqués

**Fichier à créer : `lib/repositories/admin/member-role.repository.ts`**

Repository pour encapsuler accès Prisma à la table adm_member_roles.

**Méthode findExisting(memberId, roleId, scopeType, scopeId) → Promise<MemberRole | null>**
Vérifie si assignation existe déjà pour éviter doublons.

**Méthode findPrimaryRole(memberId) → Promise<MemberRole | null>**
Retourne le rôle primaire actif du membre.

**Méthode findActiveRoles(memberId) → Promise<MemberRole[]>**
Retourne toutes assignations actives (non révoquées, temporellement valides).

---

### API REST (Endpoints)

**Fichier à créer : `app/api/v1/admin/members/[id]/roles/route.ts`**

**GET /api/v1/admin/members/[id]/roles**

- **Description** : Liste toutes les assignations de rôles d'un membre
- **Query params** :
  - active_only : boolean (filtrer rôles actifs uniquement)
  - scope_type : filtrer par type de scope
- **Permissions** : members.read
- **Réponse 200** :

```json
{
  "member": {
    "id": "uuid-mohamed",
    "first_name": "Mohamed",
    "last_name": "Al-Mansouri"
  },
  "roles": [
    {
      "id": "uuid-mr1",
      "role": {
        "id": "uuid-role-manager",
        "name": "Manager",
        "slug": "manager"
      },
      "is_primary": true,
      "scope_type": "branch",
      "scope": {
        "id": "uuid-branch-north",
        "name": "Dubai North",
        "type": "branch"
      },
      "assigned_by": {
        "id": "uuid-admin",
        "first_name": "Sarah",
        "last_name": "Admin"
      },
      "assignment_reason": "Mohamed appointed as Zone North Manager",
      "valid_from": "2025-09-01T00:00:00Z",
      "valid_until": null,
      "priority": 100,
      "created_at": "2025-09-01T10:00:00Z",
      "is_active": true
    },
    {
      "id": "uuid-mr2",
      "role": {
        "id": "uuid-role-training",
        "name": "Training Manager",
        "slug": "training-manager"
      },
      "is_primary": false,
      "scope_type": "global",
      "scope": null,
      "assigned_by": {
        "id": "uuid-admin",
        "first_name": "Sarah",
        "last_name": "Admin"
      },
      "assignment_reason": "Mohamed appointed as Training Manager by CEO",
      "valid_from": "2025-10-01T00:00:00Z",
      "valid_until": null,
      "priority": 50,
      "created_at": "2025-10-01T14:00:00Z",
      "is_active": true
    }
  ],
  "permissions_summary": {
    "total_permissions": 15,
    "scopes_count": 2,
    "aggregated_permissions": {
      "vehicles": ["read", "update", "delete"],
      "drivers": ["read", "update"],
      "training_docs": ["read", "create", "update"]
    }
  }
}
```

**POST /api/v1/admin/members/[id]/roles**

- **Description** : Assigner un nouveau rôle à un membre
- **Body** :

```json
{
  "role_id": "uuid-role-training",
  "is_primary": false,
  "scope_type": "global",
  "scope_id": null,
  "assignment_reason": "Mohamed appointed as Training Manager by CEO",
  "valid_from": "2025-11-10T00:00:00Z",
  "valid_until": null,
  "priority": 50
}
```

- **Permissions** : members.assign_roles (permission spéciale)
- **Réponse 201** :

```json
{
  "success": true,
  "member_role": {
    "id": "uuid-mr-new",
    "role": {
      /* ... */
    },
    "is_primary": false,
    "scope_type": "global",
    "created_at": "2025-11-10T10:00:00Z"
  },
  "session_revoked": true,
  "notification_sent": true
}
```

- **Erreurs** :
  - 403 : Permission insuffisante
  - 409 : Role already assigned with same scope
  - 422 : Invalid scope (entity not found)

**Fichier à créer : `app/api/v1/admin/members/[id]/roles/[roleId]/route.ts`**

**DELETE /api/v1/admin/members/[id]/roles/[roleId]**

- **Description** : Révoquer un rôle assigné à un membre
- **Body** :

```json
{
  "reason": "Training responsibility transferred to Sarah"
}
```

- **Permissions** : members.revoke_roles
- **Réponse 200** :

```json
{
  "success": true,
  "revoked_at": "2025-11-10T10:30:00Z",
  "reason": "Training responsibility transferred to Sarah",
  "session_revoked": true,
  "notification_sent": true
}
```

**PATCH /api/v1/admin/members/[id]/roles/[roleId]**

- **Description** : Modifier une assignation de rôle (scope, validité)
- **Body** :

```json
{
  "scope_type": "branch",
  "scope_id": "uuid-branch-south",
  "valid_until": "2025-12-31T23:59:59Z",
  "priority": 75
}
```

- **Permissions** : members.update_roles
- **Réponse 200** : Member role mis à jour

**Fichier à créer : `app/api/v1/admin/members/[id]/permissions/route.ts`**

**GET /api/v1/admin/members/[id]/permissions**

- **Description** : Obtenir toutes les permissions agrégées d'un membre
- **Permissions** : members.read
- **Réponse 200** :

```json
{
  "member_id": "uuid-mohamed",
  "aggregated_permissions": {
    "vehicles": {
      "read": { "scope": "global", "from_role": "Director", "priority": 100 },
      "update": {
        "scope": "branch:north",
        "from_role": "Manager North",
        "priority": 50
      },
      "delete": {
        "scope": "branch:north",
        "from_role": "Manager North",
        "priority": 50
      }
    },
    "drivers": {
      "read": { "scope": "global", "from_role": "Director", "priority": 100 },
      "update": {
        "scope": "branch:north",
        "from_role": "Manager North",
        "priority": 50
      }
    },
    "training_docs": {
      "read": {
        "scope": "global",
        "from_role": "Training Manager",
        "priority": 50
      },
      "create": {
        "scope": "global",
        "from_role": "Training Manager",
        "priority": 50
      },
      "update": {
        "scope": "global",
        "from_role": "Training Manager",
        "priority": 50
      }
    }
  },
  "roles_count": 3,
  "scopes": [
    { "type": "global", "from_roles": ["Director", "Training Manager"] },
    {
      "type": "branch",
      "id": "uuid-north",
      "name": "Dubai North",
      "from_roles": ["Manager North"]
    }
  ]
}
```

---

### Frontend (Interface Utilisateur)

**Fichier à créer : `app/[locale]/admin/members/[id]/roles/page.tsx`**

Page dédiée à la gestion des rôles d'un membre avec attribution multiple.

**Layout de la page :**

```
┌──────────────────────────────────────────────────────────────┐
│ HEADER                                                       │
│ [← Back to Members] Mohamed Al-Mansouri > Roles             │
└──────────────────────────────────────────────────────────────┘
┌──────────────────────────────────────────────────────────────┐
│ MEMBER INFO                                                  │
│ Mohamed Al-Mansouri - Manager (Primary Role)                │
│ Email: mohamed@abclogistics.ae                              │
│ Status: Active                                               │
│ [+ Assign Additional Role]                                   │
└──────────────────────────────────────────────────────────────┘
┌──────────────────────────────────────────────────────────────┐
│ ASSIGNED ROLES (2)                                           │
│                                                              │
│ ┌─ Manager (Primary) ─────────────────────────────────────┐ │
│ │ 📋 Role: Manager                                        │ │
│ │ 🎯 Scope: Branch > Dubai North                          │ │
│ │ 📅 Valid from: Sep 1, 2025 (permanent)                 │ │
│ │ 👤 Assigned by: Sarah Admin                            │ │
│ │ 📝 Reason: Mohamed appointed as Zone North Manager     │ │
│ │ ⚡ Priority: 100                                        │ │
│ │                                                         │ │
│ │ Permissions:                                            │ │
│ │ ✅ vehicles.read, update, delete (branch:north)        │ │
│ │ ✅ drivers.read, update (branch:north)                 │ │
│ │ ✅ trips.read (branch:north)                           │ │
│ │                                                         │ │
│ │ [Edit] [Revoke]                                        │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                              │
│ ┌─ Training Manager ──────────────────────────────────────┐ │
│ │ 📋 Role: Training Manager                              │ │
│ │ 🌍 Scope: Global (all branches)                        │ │
│ │ 📅 Valid from: Oct 1, 2025 (permanent)                │ │
│ │ 👤 Assigned by: Sarah Admin                            │ │
│ │ 📝 Reason: Mohamed appointed as Training Manager by CEO│ │
│ │ ⚡ Priority: 50                                         │ │
│ │                                                         │ │
│ │ Permissions:                                            │ │
│ │ ✅ training_docs.read, create, update (global)         │ │
│ │ ✅ training_sessions.manage (global)                   │ │
│ │ ✅ certifications.approve (global)                     │ │
│ │                                                         │ │
│ │ [Edit] [Revoke]                                        │ │
│ └─────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
┌──────────────────────────────────────────────────────────────┐
│ AGGREGATED PERMISSIONS (15 total)                           │
│ [View Full Permission Matrix]                                │
└──────────────────────────────────────────────────────────────┘
```

**Fonctionnalités :**

- **Liste rôles** : Tous rôles assignés affichés en cartes
- **Badge Primary** : Rôle primaire clairement marqué
- **Scope visuel** : Icône + texte descriptif (🌍 Global, 🏢 Branch, 👥 Team)
- **Permissions par rôle** : Liste permissions avec scope affiché
- **Bouton Assign** : Ouvrir modal pour assigner nouveau rôle
- **Bouton Edit** : Modifier scope, validité, priorité
- **Bouton Revoke** : Révoquer rôle avec confirmation

**Composant à créer : `components/admin/AssignRoleModal.tsx`**

Modal formulaire pour assigner un nouveau rôle à un membre.

**Contenu :**

```
Assign Role to Mohamed Al-Mansouri

┌────────────────────────────────────────────────────────────┐
│ Role *                                                     │
│ [Dropdown: Select role...]                                 │
│ ├─ Manager                                                 │
│ ├─ Training Manager                                        │
│ ├─ Director                                                │
│ └─ Approval Manager                                        │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│ Scope Type *                                               │
│ ⚪ Global (all branches)                                   │
│ ⚪ Branch (specific branch)                                │
│ ⚪ Zone (specific zone)                                    │
│ ⚪ Team (specific team)                                    │
└────────────────────────────────────────────────────────────┘

[SI scope != Global, afficher:]
┌────────────────────────────────────────────────────────────┐
│ Select Branch *                                            │
│ [Dropdown: Dubai North, Dubai South, Sharjah, ...]        │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│ Validity Period                                            │
│ Valid from: [Date Picker] (default: today)                │
│ Valid until: [Date Picker] (optional, leave empty for     │
│              permanent)                                    │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│ Make this role primary? ☐                                 │
│ (This will demote current primary role to secondary)      │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│ Assignment Reason * (min 10 chars)                        │
│ [Textarea]                                                 │
│                                                            │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│ ⚠️ This will:                                              │
│ • Revoke Mohamed's current session (force re-login)       │
│ • Send notification email to Mohamed                      │
│ • Create audit log entry                                  │
└────────────────────────────────────────────────────────────┘

[Cancel] [Assign Role]
```

**Validation :**

- Role requis
- Scope_type requis
- Si scope != Global, scope_id requis
- Assignment_reason min 10 caractères
- Valid_until > valid_from si fourni

**Composant à créer : `components/admin/RevokeRoleModal.tsx`**

Modal de confirmation avant révocation d'un rôle.

**Contenu :**

```
⚠️ Revoke Role: Training Manager

You are about to revoke the Training Manager role from Mohamed.

Current details:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Role: Training Manager
Scope: Global (all branches)
Assigned: Oct 1, 2025 by Sarah Admin
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Mohamed will lose these permissions:
  ❌ training_docs.read, create, update
  ❌ training_sessions.manage
  ❌ certifications.approve

Reason for revocation (required):
┌────────────────────────────────────────────┐
│ [Textarea: min 10 chars]                   │
│                                            │
└────────────────────────────────────────────┘

This will:
• Revoke Mohamed's session immediately
• Send notification email to Mohamed
• Create audit log entry

[Cancel] [⚠️ Confirm Revocation]
```

**Composant à créer : `components/admin/PermissionMatrixModal.tsx`**

Modal affichant matrice complète des permissions agrégées.

**Affichage :**

```
Aggregated Permissions Matrix - Mohamed Al-Mansouri

┌───────────────┬────────┬────────┬────────┬─────────┐
│ Resource      │ Read   │ Create │ Update │ Delete  │
├───────────────┼────────┼────────┼────────┼─────────┤
│ Vehicles      │ ✅ G   │ ❌     │ ✅ BN  │ ✅ BN   │
│ Drivers       │ ✅ G   │ ❌     │ ✅ BN  │ ❌      │
│ Trips         │ ✅ BN  │ ❌     │ ❌     │ ❌      │
│ Revenues      │ ✅ BN  │ ❌     │ ❌     │ ❌      │
│ Training Docs │ ✅ G   │ ✅ G   │ ✅ G   │ ❌      │
└───────────────┴────────┴────────┴────────┴─────────┘

Legend:
G = Global (all branches)
BN = Branch North (Dubai North only)

Permissions from 2 roles:
• Manager (branch:north, priority 100) - 10 permissions
• Training Manager (global, priority 50) - 5 permissions

Total: 15 unique permissions across 5 resources

[Export as PDF] [Close]
```

---

## 🎬 RÉSULTAT DÉMONTRABLE

**Scénario démo complet pour le sponsor :**

**1. Consultation rôles actuels membre**

- Admin se connecte, navigue vers Admin > Members
- Cliquer sur "Mohamed Al-Mansouri"
- Voir onglet "Roles" avec badge "2 roles"
- Cliquer sur onglet
- Page s'ouvre avec 2 cartes :
  - Manager (Primary) - Branch: Dubai North
  - Training Manager - Global

**2. Attribution nouveau rôle**

- Cliquer "Assign Additional Role"
- Modal s'ouvre
- Sélectionner rôle : "Approval Manager"
- Sélectionner scope : "Global"
- Remplir raison : "Mohamed temporarily covering approvals for Ahmed (vacation)"
- Définir validité : du 15 Nov au 30 Nov (2 semaines)
- Cocher "Make this role primary" : NON (reste secondaire)
- Cliquer "Assign Role"
- Modal se ferme, toast "Role assigned. Mohamed will be notified."
- Page recharge, 3 cartes maintenant visibles
- Voir nouvelle carte "Approval Manager" avec :
  - Scope : Global
  - Valid until : Nov 30, 2025 (temporaire)
  - Permissions : expenses.approve, purchases.approve

**3. Visualisation permissions agrégées**

- Cliquer "View Full Permission Matrix"
- Modal s'ouvre avec matrice complète
- Voir :
  - vehicles.read (Global, from Director)
  - vehicles.update (Branch North, from Manager)
  - expenses.approve (Global, from Approval Manager) ← nouveau
- Voir légende avec 3 rôles listés
- Total permissions : 17 (était 15 avant)

**4. Vérification notification envoyée**

- Naviguer vers Admin > Notifications
- Filtrer par recipient = mohamed@abclogistics.ae
- Voir notification "Role Assigned: Approval Manager"
- Email dit : "You have been assigned Approval Manager role (Global scope) until Nov 30, 2025. Please re-login to apply changes."

**5. Vérification permissions appliquées (côté Mohamed)**

- Se connecter comme Mohamed
- Session révoquée automatiquement
- Re-login requis
- Après re-login, dashboard affiche nouveau widget "Pending Approvals"
- Naviguer vers Expenses
- Voir bouton "Approve" visible (permission expenses.approve active)
- Cliquer, modal confirmation, approuver dépense
- Succès ✅ (permission vérifiée côté serveur)

**6. Modification scope d'un rôle existant**

- Admin retourne sur Mohamed > Roles
- Cliquer "Edit" sur rôle "Manager"
- Modal s'ouvre
- Changer scope : Branch North → Zone North (inclut North + Sharjah)
- Raison : "Mohamed promoted to Zone Manager"
- Confirmer
- Toast "Role updated. Mohamed's session revoked."
- Carte mise à jour : Scope = Zone: North

**7. Révocation rôle temporaire après expiration**

- Avancer date système au 1er Décembre (simulation)
- Cron job automatique s'exécute (expireRoles())
- Rôle "Approval Manager" révoqué automatiquement (valid_until dépassé)
- Email automatique envoyé à Mohamed : "Role Approval Manager has expired"
- Admin voit dans Mohamed > Roles : carte "Approval Manager" avec badge "Expired" et deleted_at
- Mohamed perd immédiatement accès Expenses > Approve

**8. Révocation manuelle rôle**

- Admin clique "Revoke" sur rôle "Training Manager"
- Modal confirmation s'ouvre
- Voir impact : Mohamed perdra accès training_docs
- Remplir raison : "Training responsibility transferred to Sarah"
- Confirmer
- Toast "Role revoked. Mohamed notified."
- Carte disparaît de la liste (soft delete)
- Mohamed perd immédiatement accès Training Documents

**9. Vérification audit trail complet**

- Naviguer vers Admin > Audit Logs
- Filtrer par member = Mohamed, entity = member_roles
- Voir historique complet :
  - Assigned: Approval Manager (Nov 15)
  - Updated: Manager scope Branch → Zone (Nov 16)
  - Revoked: Training Manager (Nov 20)
  - Expired: Approval Manager (Dec 1, automatic)
- Chaque log contient reason complet

**Critères d'acceptation :**

- ✅ Membre peut avoir plusieurs rôles simultanément
- ✅ 1 seul rôle primaire par membre (contrainte respectée)
- ✅ Scopes différents par rôle (global, branch, zone)
- ✅ Permissions agrégées correctement (résolution conflits)
- ✅ Rôle temporaire (valid_until) expire automatiquement
- ✅ Révocation révoque session immédiatement
- ✅ Notification envoyée lors assignation/révocation
- ✅ Audit trail complet de toutes opérations
- ✅ UI affiche clairement tous rôles avec scopes
- ✅ Matrice permissions agrégées visible
- ✅ Assignment_reason obligatoire et sauvegardé
- ✅ Priority gère résolution conflits permissions

---

## ⏱️ ESTIMATION

- **Temps backend** : **6 heures**
  - MemberRoleService : 4h (8 méthodes complexes)
  - Algorithme aggregatePermissions : 1.5h
  - Cron job expireRoles : 0.5h
- **Temps API** : **3 heures**
  - GET /roles : 0.5h
  - POST /roles : 1h (validation scope, unicité)
  - DELETE /roles : 1h (révocation cascade)
  - GET /permissions : 0.5h (agrégation)
- **Temps frontend** : **7 heures**
  - Page Member Roles : 2h
  - AssignRoleModal : 2h (dropdowns dynamiques scope)
  - RevokeRoleModal : 1h
  - PermissionMatrixModal : 2h (matrice complexe)
- **Temps tests** : **2 heures**
  - Tests aggregatePermissions : 1h (cas complexes)
  - Tests checkPermission avec scopes : 0.5h
  - Test E2E assignation multi-rôles : 0.5h
- **TOTAL : 18 heures (~2.5 jours)** ⚠️ Révision estimation à 2.5 jours

---

## 🔗 DÉPENDANCES

**Prérequis obligatoires :**

- ÉTAPE 2.1 terminée (Roles créés)
- ÉTAPE 2.2 terminée (Permissions granulaires)
- Étape 1.2 terminée (Members créés)
- Table adm_member_roles existante en DB
- Tables scopes existantes (fleet_branches, fleet_zones, fleet_teams)

**Services/composants requis :**

- RoleService (déjà créé)
- MemberService (déjà créé)
- SessionService (pour révocation sessions)
- NotificationService (pour notifier membres)
- AuditService (pour logging)

**Données de test nécessaires :**

- 3 membres avec rôles différents
- 5 rôles différents (Manager, Director, Training Manager, Approval Manager, Operator)
- 3 branches (Dubai North, Dubai South, Sharjah)
- 2 zones (North, South)

---

## ✅ CHECKLIST DE VALIDATION

- [ ] **Backend** : MemberRoleService compile, toutes méthodes implémentées
- [ ] **Backend** : assignRole() crée assignation et révoque session
- [ ] **Backend** : revokeRole() soft delete et promouvoir autre rôle si primaire
- [ ] **Backend** : aggregatePermissions() retourne permissions de tous rôles actifs
- [ ] **Backend** : checkPermission() vérifie permission ET scope
- [ ] **Backend** : expireRoles() cron job révoque rôles expirés automatiquement
- [ ] **Backend** : Contrainte unicité (member + role + scope) respectée
- [ ] **Backend** : 1 seul rôle primaire par membre (contrainte vérifiée)
- [ ] **API** : GET /roles retourne tous rôles avec scopes
- [ ] **API** : POST /roles assigne rôle et envoie notification
- [ ] **API** : DELETE /roles révoque rôle avec raison obligatoire
- [ ] **API** : GET /permissions retourne matrice agrégée
- [ ] **Frontend** : Page Member Roles affiche tous rôles en cartes
- [ ] **Frontend** : Badge "Primary" visible sur rôle primaire
- [ ] **Frontend** : Modal Assign permet sélection scope dynamique
- [ ] **Frontend** : Modal Revoke affiche impact permissions
- [ ] **Frontend** : Modal Permission Matrix affiche agrégation
- [ ] **Tests** : Test aggregatePermissions avec 3 rôles, scopes différents
- [ ] **Tests** : Test résolution conflits (priority)
- [ ] **Tests** : Test expiration automatique rôle temporaire
- [ ] **Tests** : Test E2E assignation → révocation → permissions perdues
- [ ] **Démo** : Pouvoir assigner 3 rôles à un membre avec scopes différents
- [ ] **Démo** : Permissions agrégées visible dans matrice
- [ ] **Démo** : Révocation rôle révoque session immédiatement
- [ ] **Démo** : Membre notifié lors assignation/révocation
- [ ] **Démo** : Audit trail complet de toutes opérations

---

**FIN DES ÉTAPES 2.3 ET 2.4 - CHAPITRE 2 RBAC AVANCÉ**

**Prochaines étapes :**

- CHAPITRE 3 : Onboarding (Invitations, Sessions, Notifications)
- CHAPITRE 4 : Lifecycle & Audit (Tenant Lifecycle Events, Audit Logs)
- CHAPITRE 5 : Configuration (Settings, Vehicle Classes, Provider Employees)
