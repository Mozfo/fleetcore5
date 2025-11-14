# FLEETCORE - MODULE ADM : PLAN D'EXÉCUTION DÉTAILLÉ

## CHAPITRES 1.2 & 2 : MEMBERS & RBAC COMPLET

**Date:** 10 Novembre 2025  
**Version:** 1.0 DÉFINITIVE  
**Périmètre:** adm_members + Système RBAC complet (4 tables)  
**Méthodologie:** Implémentation verticale par fonctionnalité démontrable

---

## 📋 TABLE DES MATIÈRES

1. [CHAPITRE 1.2 : Member Management](#chapitre-12--member-management)
2. [CHAPITRE 2 : Système RBAC Complet](#chapitre-2--système-rbac-complet)
   - [Étape 2.1 : Roles - Définition et Hiérarchie](#étape-21--roles---définition-et-hiérarchie)
   - [Étape 2.2 : Role Permissions - Granularité Fine](#étape-22--role-permissions---granularité-fine)
   - [Étape 2.3 : Role Versions - Historique et Rollback](#étape-23--role-versions---historique-et-rollback)
   - [Étape 2.4 : Member Roles - Attribution Multi-Rôles](#étape-24--member-roles---attribution-multi-rôles)

---

# CHAPITRE 1.2 : MEMBER MANAGEMENT

**Durée :** 2 jours ouvrés (16 heures)  
**Objectif :** Implémenter la gestion complète des membres avec onboarding sécurisé, MFA, et intégration Clerk  
**Livrable démo :** Interface Admin pour inviter/gérer membres, processus d'onboarding avec MFA obligatoire

---

## ÉTAPE 1.2 : Member Management - Onboarding et Sécurité

### 🎯 RATIONNEL MÉTIER

**POURQUOI :** Le member est l'utilisateur final de FleetCore au sein d'un tenant. Chaque member = 1 employé du client (admin, manager, opérateur, chauffeur) qui accède quotidiennement au système. Sans gestion structurée des members, impossible de contrôler qui accède à quoi, d'auditer les actions, ou de garantir la sécurité (MFA, verrouillage anti-brute-force). Le member est au cœur du système RBAC : sans member bien identifié et authentifié, aucune permission ne peut être vérifiée.

**QUEL PROBLÈME :** Actuellement, il n'existe aucun workflow d'onboarding sécurisé. Quand un contrat est signé et un tenant créé, comment invite-t-on le premier admin ? Comment s'assure-t-on qu'il active le MFA (obligatoire pour les admins) ? Comment empêche-t-on les attaques par force brute (5 tentatives = verrouillage 30 min) ? Comment synchronise-t-on avec Clerk pour l'authentification ? Sans réponses à ces questions, le système est vulnérable et non-conforme aux normes de sécurité.

**IMPACT SI ABSENT :**

- **Sécurité** : Aucune protection contre brute force, comptes piratables facilement
- **Conformité** : Non-conformité SOC2/ISO27001 (pas de MFA obligatoire pour admins)
- **Onboarding** : Délai activation 5+ jours au lieu de 30 minutes (processus manuel)
- **Support** : 200 tickets/mois "Comment inviter un utilisateur ?" au lieu de self-service
- **Audit** : Impossible de savoir qui a fait quoi sans member_id traçable

**CAS D'USAGE CONCRET :**

ABC Logistics a signé un contrat le 10 novembre 2025. Le système a créé automatiquement le tenant. Maintenant, le contact principal (Sarah Ahmed, Operations Director) doit devenir le premier admin.

**Workflow complet d'onboarding member :**

1. **Système crée invitation automatiquement** (lors création tenant) :
   - Email : sarah.ahmed@abclogistics.ae
   - Role : Admin (premier admin du tenant)
   - Token : UUID sécurisé unique
   - Expires_at : 7 jours (délai raisonnable)
   - Status : pending

2. **Email d'invitation envoyé** (via NotificationService) :
   - Sujet : "Bienvenue sur FleetCore - Activez votre compte"
   - Corps : "Bonjour Sarah, votre compte administrateur FleetCore est prêt. Cliquez pour créer votre mot de passe et activer le MFA."
   - Lien : https://fleetcore.com/accept-invitation?token={uuid}
   - Expire dans 7 jours

3. **Sarah clique sur le lien** (30 minutes après réception) :
   - Page d'acceptation s'ouvre
   - Formulaire pré-rempli avec email
   - Demande de créer compte Clerk (password + vérification email)
   - Sarah crée password : "SecureP@ss123!"
   - Clerk vérifie email via code OTP

4. **Clerk webhook user.created déclenché** :
   - Payload : { type: "user.created", data: { id: "user_abc123", email: "sarah@..." } }
   - ClerkSyncService reçoit webhook
   - Vérifie invitation existe pour cet email
   - Crée member dans adm_members :
     - tenant_id : ABC Logistics
     - clerk_user_id : user_abc123
     - email : sarah@abclogistics.ae
     - role : Admin
     - status : active
     - email_verified_at : now

5. **Redirection vers page onboarding MFA** :
   - Message : "Pour votre sécurité, le MFA est obligatoire pour les administrateurs"
   - Affichage QR code TOTP (Google Authenticator / Authy)
   - Sarah scanne QR code avec son téléphone
   - App génère code 6 chiffres : "123456"
   - Sarah entre code pour vérifier
   - Système valide via TOTP algorithm
   - two_factor_enabled passe à true
   - two_factor_secret stocké chiffré (AES-256)
   - Génération 10 backup codes (affichés une seule fois)

6. **Sarah redirigée vers dashboard FleetCore** :
   - Pleinement opérationnelle en 5 minutes
   - Peut maintenant inviter d'autres membres de son équipe
   - Audit log "member_activated" créé

**Valeur business :**

- **Time to first login** : 5 jours → 30 minutes (automatisation)
- **Adoption MFA admins** : 10% → 95% (onboarding forcé)
- **Taux d'acceptation invitations** : 40% → 80% (emails clairs + relances)
- **Tickets support onboarding** : 200/mois → 20/mois (self-service)
- **Tentatives piratage bloquées** : 0 → 100% (verrouillage anti-brute-force)

### 📊 DONNÉES ET RÈGLES MÉTIER

**Table principale : `adm_members`**

**Colonnes critiques (28 colonnes) :**

| Colonne                      | Type         | Obligatoire | Utilité Business                               |
| ---------------------------- | ------------ | ----------- | ---------------------------------------------- |
| **id**                       | uuid         | OUI         | Identifiant unique membre (PK)                 |
| **tenant_id**                | uuid         | OUI         | Tenant d'appartenance (FK → adm_tenants)       |
| **clerk_user_id**            | varchar(255) | OUI         | ID Clerk pour sync auth                        |
| **email**                    | citext       | OUI         | Email unique par tenant                        |
| **first_name**               | varchar(100) | NON         | Prénom                                         |
| **last_name**                | varchar(100) | NON         | Nom                                            |
| **phone**                    | varchar(50)  | NON         | Téléphone format E.164                         |
| **status**                   | text         | OUI         | État (active, inactive, suspended, deleted)    |
| **role**                     | text         | OUI         | Rôle simple (admin, manager, operator, driver) |
| **default_role_id**          | uuid         | NON         | Rôle principal (FK → adm_roles)                |
| **email_verified_at**        | timestamp    | NON         | Date vérification email                        |
| **two_factor_enabled**       | boolean      | OUI         | MFA activé ?                                   |
| **two_factor_secret**        | varchar(255) | NON         | Secret TOTP (chiffré AES-256)                  |
| **last_login_at**            | timestamp    | NON         | Dernière connexion                             |
| **failed_login_attempts**    | integer      | OUI         | Compteur échecs login (défaut 0)               |
| **locked_until**             | timestamp    | NON         | Verrouillage temporaire anti-brute-force       |
| **password_changed_at**      | timestamp    | NON         | Dernière rotation password                     |
| **preferred_language**       | varchar(10)  | NON         | Langue UI (en, fr, ar)                         |
| **notification_preferences** | jsonb        | NON         | Préférences notifs (email, SMS, push)          |
| **metadata**                 | jsonb        | NON         | Données additionnelles flexibles               |
| **created_at**               | timestamp    | OUI         | Date création                                  |
| **updated_at**               | timestamp    | OUI         | Date modification                              |
| **created_by**               | uuid         | NON         | Qui a créé (FK → adm_members)                  |
| **updated_by**               | uuid         | NON         | Qui a modifié                                  |
| **deleted_at**               | timestamp    | NON         | Date soft delete                               |
| **deleted_by**               | uuid         | NON         | Qui a supprimé                                 |
| **deletion_reason**          | text         | NON         | Raison suppression (obligatoire si deleted)    |

**Statuts possibles et transitions :**

```
ÉTAT : active (utilisateur actif)
├─ CONDITIONS : Email vérifié, compte fonctionnel
├─ ACCÈS : Complet selon rôle RBAC
├─ MFA : Optionnel pour Operator, OBLIGATOIRE pour Admin/Manager
└─ TRANSITIONS :
   ├─ → inactive (inactivité > 90 jours détectée automatiquement)
   ├─ → suspended (échecs login ≥ 5 OR violation politique)
   └─ → deleted (offboarding employé)

ÉTAT : inactive (compte dormant)
├─ CONDITIONS : last_login_at > 90 jours sans désactivation explicite
├─ ACCÈS : Lecture seule, notifications désactivées
├─ MFA : Reste activé si précédemment activé
└─ TRANSITION : → active (connexion réussie réactive automatiquement)

ÉTAT : suspended (compte suspendu)
├─ CONDITIONS : Échecs login ≥ 5 OR violation OR investigation fraude
├─ ACCÈS : Bloqué totalement, toutes sessions révoquées
├─ MFA : Conservé (pas de désactivation automatique)
└─ TRANSITION : → active (admin déverrouille manuellement)

ÉTAT : deleted (compte supprimé - soft delete)
├─ CONDITIONS : Employé parti, données en attente d'anonymisation RGPD
├─ ACCÈS : Bloqué définitivement
├─ ANONYMISATION : Après 90 jours (deleted_at + 90j)
└─ TRANSITION : Aucune (suppression définitive post-RGPD)
```

**Règles de verrouillage anti-brute-force :**

```
ALGORITHME handleFailedLogin :
  ENTRÉE : member_id, attempt_timestamp, ip_address

  1. Récupérer member par ID
  2. Incrémenter failed_login_attempts += 1
  3. Enregistrer attempt_timestamp dans metadata.last_failed_attempt
  4.
  5. SI failed_login_attempts >= 5
     ALORS
       - locked_until = now + 30 minutes
       - status = 'suspended' (si était active/inactive)
       - metadata.lock_reason = 'brute_force_protection'
       - Créer audit log (action = "account_locked", severity = "warning")
       - Envoyer email à utilisateur :
         * Sujet : "⚠️ Compte verrouillé - Tentatives de connexion suspectes"
         * Corps : "Votre compte a été verrouillé pour 30 minutes suite à 5 tentatives échouées.
                    Si ce n'était pas vous, changez votre mot de passe immédiatement."
       - Envoyer notification admin tenant :
         * "Membre {email} verrouillé (brute force) depuis IP {ip_address}"
       - SI IP dans liste noire (3+ membres différents verrouillés)
         ALORS alerter équipe sécurité FleetCore
     SINON SI failed_login_attempts >= 3
       - Envoyer email avertissement : "2 tentatives restantes avant verrouillage"
     FIN SI
  6. Créer audit log "failed_login_attempt" avec IP et user_agent
  7. Mettre à jour member dans DB
  8. RETOURNER locked_until (null si pas verrouillé)

ALGORITHME handleSuccessfulLogin :
  ENTRÉE : member_id, login_timestamp, ip_address

  1. Récupérer member par ID
  2. Réinitialiser failed_login_attempts = 0
  3. Mettre à jour last_login_at = now
  4. Mettre à jour metadata.last_login_ip = ip_address
  5.
  6. SI locked_until non null ET now > locked_until
     ALORS
       - locked_until = null
       - status = 'active' (réactivation automatique)
       - metadata.lock_reason = null
       - Créer audit log "account_unlocked_auto"
       - Envoyer email confirmation : "Compte déverrouillé, connexion réussie"
     FIN SI
  7.
  8. SI status = 'inactive' (dormant)
     ALORS
       - status = 'active' (réactivation automatique)
       - Créer audit log "account_reactivated_login"
     FIN SI
  9.
  10. Créer audit log "successful_login" avec IP et user_agent
  11. Mettre à jour member dans DB
```

**Règles MFA (Multi-Factor Authentication) :**

```
RÈGLE MFA OBLIGATOIRE PAR RÔLE :
  - Admin : MFA OBLIGATOIRE (cannot login without 2FA enabled)
  - Manager : MFA OBLIGATOIRE
  - Operator : MFA RECOMMANDÉ (popup rappel tous les 7 jours)
  - Driver : MFA OPTIONNEL (accès mobile simplifié)

WORKFLOW ACTIVATION MFA :
  1. Utilisateur va dans Settings > Security
  2. Clique "Enable Two-Factor Authentication"
  3. Backend génère two_factor_secret via TOTP library (ex: speakeasy)
     - Secret = base32 string aléatoire (ex: "JBSWY3DPEHPK3PXP")
  4. Backend génère QR code contenant :
     - otpauth://totp/FleetCore:{email}?secret={secret}&issuer=FleetCore
  5. Frontend affiche QR code + texte secret (si QR non scannable)
  6. Utilisateur scanne QR avec Google Authenticator / Authy / 1Password
  7. App génère code 6 chiffres basé sur temps (TOTP)
  8. Utilisateur entre code pour vérifier
  9. Backend valide code via TOTP algorithm :
     - Vérifie code pour timestamp actuel ± 1 période (30s window)
  10. SI code valide :
       - two_factor_enabled = true
       - two_factor_secret stocké chiffré (AES-256, clé env var MFA_ENCRYPTION_KEY)
       - Générer 10 backup codes à usage unique :
         * Format : "XXXX-XXXX-XXXX" (aléatoires)
         * Stockés hachés (bcrypt) dans metadata.backup_codes[]
       - Afficher backup codes UNE SEULE FOIS (modal avec warning)
       - Créer audit log "mfa_enabled"
       - Envoyer email confirmation :
         * Sujet : "✅ MFA activé sur votre compte FleetCore"
         * Corps : "Votre authentification à deux facteurs est maintenant active.
                    Conservez vos codes de secours en lieu sûr."
   11. SINON :
       - throw ValidationError("Code MFA invalide, veuillez réessayer")
   12. Retourner { success: true, backup_codes: [...] }

WORKFLOW DÉSACTIVATION MFA :
  1. Utilisateur demande désactivation (Settings > Security)
  2. Modal confirmation s'ouvre : "Êtes-vous sûr ? Cela réduira la sécurité de votre compte"
  3. Système demande DOUBLE authentification :
     - Password actuel (validé via Clerk API)
     - Code MFA actuel OU backup code
  4. SI les 2 validés :
       - two_factor_enabled = false
       - two_factor_secret = null (secret supprimé)
       - metadata.backup_codes = [] (codes révoqués)
       - Créer audit log "mfa_disabled" (severity = "warning")
       - Envoyer email urgent :
         * Sujet : "⚠️ MFA désactivé sur votre compte"
         * Corps : "L'authentification à deux facteurs a été désactivée.
                    Si ce n'était pas vous, contactez immédiatement le support."
       - SI role IN ('admin', 'manager')
         ALORS envoyer notification admin tenant (warning)
     SINON :
       - throw ForbiddenError("Authentification échouée, impossible de désactiver MFA")
     FIN SI
  5. Retourner { success: true }
```

**Règles de rotation password :**

```
POLITIQUE ROTATION PASSWORD :
  - password_changed_at obligatoire lors création membre
  - SI password_changed_at < now - 90 jours
    ALORS
      - Lors du prochain login, rediriger vers /change-password
      - Bloquer accès dashboard tant que password pas changé
      - Afficher banner rouge : "Votre mot de passe expire, veuillez le changer"
      - Envoyer email rappel J-7, J-3, J-1 avant expiration
  - Nouveau password doit être différent des 5 derniers (stockés hachés)
  - Complexité minimale (validation Clerk + custom) :
    * Min 12 caractères
    * Au moins 1 majuscule
    * Au moins 1 minuscule
    * Au moins 1 chiffre
    * Au moins 1 caractère spécial (!@#$%^&*)
    * Pas de mots du dictionnaire commun
    * Pas d'informations personnelles (nom, email)
  - Après changement password :
    * Révoquer toutes sessions actives sauf celle actuelle
    * Créer audit log "password_changed"
    * Envoyer email confirmation
```

**Règles de validation (MemberCreateSchema Zod) :**

```typescript
export const MemberCreateSchema = z
  .object({
    tenant_id: z.string().uuid("Tenant ID invalide"),
    clerk_user_id: z
      .string()
      .regex(/^user_[a-zA-Z0-9]+$/, "Format Clerk User ID invalide")
      .optional(),
    email: z
      .string()
      .email("Format email invalide")
      .max(255)
      .toLowerCase()
      .refine((email) => !email.includes("+"), "Email avec '+' non autorisé"),
    first_name: z
      .string()
      .min(2, "Prénom trop court (min 2 caractères)")
      .max(100)
      .regex(
        /^[A-Za-zÀ-ÖØ-öø-ÿ '\-]+$/,
        "Prénom ne doit contenir que des lettres"
      ),
    last_name: z
      .string()
      .min(2, "Nom trop court (min 2 caractères)")
      .max(100)
      .regex(
        /^[A-Za-zÀ-ÖØ-öø-ÿ '\-]+$/,
        "Nom ne doit contenir que des lettres"
      ),
    phone: z
      .string()
      .regex(/^\+[1-9]\d{1,14}$/, "Format téléphone invalide (E.164 requis)")
      .optional(),
    role: z.enum(["admin", "manager", "operator", "driver"], {
      errorMap: () => ({ message: "Rôle invalide" }),
    }),
    default_role_id: z.string().uuid("Role ID invalide").optional(),
    preferred_language: z.enum(["en", "fr", "ar"]).default("en"),
    notification_preferences: z
      .object({
        email: z.boolean().default(true),
        sms: z.boolean().default(false),
        push: z.boolean().default(true),
        frequency: z.enum(["realtime", "hourly", "daily"]).default("realtime"),
      })
      .optional(),
  })
  .refine((data) => {
    // Si role = admin ou manager, default_role_id recommandé
    if (["admin", "manager"].includes(data.role) && !data.default_role_id) {
      console.warn("default_role_id recommandé pour admin/manager");
    }
    return true;
  });
```

**Règles de cohérence inter-colonnes :**

- **Status = deleted** ⇒ deleted_at, deleted_by, deletion_reason OBLIGATOIRES
- **Two_factor_enabled = true** ⇒ two_factor_secret OBLIGATOIRE (chiffré)
- **Email_verified_at non null** ⇒ email validé, accès autorisé
- **Failed_login_attempts > 0** ⇒ last_login_at NE DOIT PAS être mis à jour
- **Locked_until non null** ⇒ status DOIT être 'suspended'
- **Role doit correspondre** à default_role_id.name si default_role_id renseigné

### 🏗️ COMPOSANTS À DÉVELOPPER

#### Backend (Service Layer)

**Fichier à créer : `lib/services/admin/member.service.ts`**

Service contenant toute la logique métier des members.

**Classe MemberService extends BaseService**

**Méthode createMember(data: MemberCreateInput) → Promise<Member>**

1. Valider data avec MemberCreateSchema
2. Extraire tenant_id depuis contexte auth (current_tenant_id)
3. Vérifier que email n'existe pas déjà pour ce tenant (unicité par tenant)
4. Vérifier que tenant existe et status IN ('trialing', 'active')
5. Normaliser email (lowercase, trim)
6. SI phone fourni, normaliser au format E.164
7. SI clerk_user_id fourni, vérifier cohérence avec Clerk via clerkService.getUser()
8. Créer member dans DB via memberRepository.create() avec :
   - status = 'active'
   - email_verified_at = now (si création via Clerk)
   - two_factor_enabled = false (par défaut)
   - failed_login_attempts = 0
   - password_changed_at = now
   - preferred_language = détection depuis Accept-Language header ou 'en'
9. SI default_role_id fourni :
   - Vérifier role existe et appartient au tenant
   - Assigner rôle via memberRoleService.assignRole()
10. Créer audit log (action = "member_created", entity_type = "members")
11. Envoyer email de bienvenue via notificationService.sendEmail('member_created')
12. Retourner member créé

**Méthode inviteMember(tenantId: string, data: MemberInviteInput) → Promise<Invitation>**

1. Valider data avec MemberInviteSchema :
   ```typescript
   const MemberInviteSchema = z.object({
     email: z.string().email().max(255),
     role: z.enum(["admin", "manager", "operator", "driver"]),
     custom_message: z.string().max(500).optional(),
   });
   ```
2. Vérifier que tenant existe et est actif
3. Vérifier que email n'est pas déjà membre du tenant
4. Vérifier que inviteur (current_user) a permission 'members.invite'
5. Créer invitation dans adm_invitations via invitationService.create() :
   - tenant_id
   - email (normalized)
   - role : rôle proposé
   - invited_by : current_user_id
   - token : UUID v4 sécurisé
   - expires_at : now + 7 jours
   - status : 'pending'
6. Envoyer email d'invitation via notificationService :
   - Template : 'invitation_sent'
   - Variables : { first_name: 'there', company_name: tenant.name, invite_url, expires_in: '7 days' }
   - Lien : https://fleetcore.com/accept-invitation?token={token}
7. Créer audit log "member_invited"
8. Retourner invitation créée avec { id, email, expires_at, status }

**Méthode acceptInvitation(token: string, clerkUserId: string) → Promise<Member>**

1. Trouver invitation par token avec invitationRepository.findByToken()
2. Vérifier que invitation existe
3. Vérifier que expires_at > now (pas expirée)
4. Vérifier que status = 'pending' (pas déjà acceptée ou révoquée)
5. Vérifier que email n'est pas déjà membre du tenant
6. Vérifier que clerkUserId est valide via clerkService.getUser()
7. Créer member depuis invitation :
   - tenant_id : depuis invitation
   - clerk_user_id : fourni
   - email : depuis invitation
   - role : depuis invitation
   - status : 'active'
   - email_verified_at : now (Clerk a déjà vérifié)
   - created_by : invitation.invited_by
8. Mettre à jour invitation :
   - status = 'accepted'
   - accepted_at = now
   - accepted_by_member_id = member.id
9. Créer audit log "invitation_accepted"
10. Retourner member créé

**Méthode enableTwoFactor(memberId: string, verificationCode: string) → Promise<{ success: boolean, backupCodes: string[] }>**

1. Récupérer member par ID via memberRepository.findById()
2. Vérifier que two_factor_enabled = false (pas déjà activé)
3. Récupérer two_factor_secret temporaire depuis session/cache :
   - Secret a été généré lors de l'étape "Afficher QR code"
   - Stocké temporairement en cache Redis avec clé : `mfa_setup:${memberId}`
4. Valider verificationCode avec TOTP algorithm via speakeasy.totp.verify() :
   - Secret : two_factor_secret temporaire
   - Token : verificationCode (6 chiffres)
   - Window : 1 (accepte ±30 secondes)
5. SI code valide :
   - Générer 10 backup codes aléatoires (format: XXXX-XXXX-XXXX)
   - Hasher backup codes avec bcrypt (rounds: 10)
   - Chiffrer two_factor_secret avec AES-256-GCM :
     - Clé : process.env.MFA_ENCRYPTION_KEY
     - IV : généré aléatoirement par opération
     - Format stocké : `{iv}:{encrypted_secret}:{auth_tag}`
   - Mettre à jour member :
     - two_factor_enabled = true
     - two_factor_secret = secret chiffré
     - metadata.backup_codes = backup codes hachés
     - metadata.backup_codes_used = [] (aucun utilisé)
   - Supprimer secret temporaire du cache
   - Créer audit log "mfa_enabled"
   - Envoyer email confirmation via notificationService
   - Retourner { success: true, backupCodes: codes_en_clair }
6. SINON :
   - throw ValidationError("Code MFA invalide, veuillez réessayer")

**Méthode disableTwoFactor(memberId: string, password: string, mfaCode: string) → Promise<Member>**

1. Récupérer member par ID
2. Vérifier que two_factor_enabled = true
3. Valider password via Clerk API :
   - clerkService.verifyPassword(member.clerk_user_id, password)
4. Déchiffrer two_factor_secret (AES-256-GCM)
5. Valider mfaCode via TOTP OU vérifier si c'est un backup code valide :
   - SI TOTP valide OU backup code valide ET non utilisé
     ALORS authentification réussie
   - SINON throw ForbiddenError("Code invalide")
6. SI validé :
   - two_factor_enabled = false
   - two_factor_secret = null
   - metadata.backup_codes = []
   - metadata.backup_codes_used = []
   - Mettre à jour member dans DB
   - Créer audit log "mfa_disabled" (severity = 'warning')
   - Envoyer email urgent via notificationService
   - SI role IN ('admin', 'manager')
     ALORS notifier admin tenant (security alert)
7. Retourner member mis à jour

**Méthode handleFailedLogin(memberId: string, ipAddress: string, userAgent: string) → Promise<{ locked: boolean, lockedUntil: Date | null }>**

Implémente l'algorithme anti-brute-force décrit dans les règles métier.

**Méthode handleSuccessfulLogin(memberId: string, ipAddress: string, userAgent: string) → Promise<void>**

Implémente l'algorithme de connexion réussie décrit dans les règles métier.

**Méthode suspendMember(memberId: string, reason: string, suspendedBy: string) → Promise<Member>**

1. Récupérer member par ID
2. Vérifier que status IN ('active', 'inactive')
3. Changer status à 'suspended'
4. Renseigner metadata.suspension_reason = reason
5. Renseigner metadata.suspended_at = now
6. Renseigner metadata.suspended_by = suspendedBy
7. Mettre à jour member dans DB
8. Révoquer toutes sessions actives via sessionService.revokeAllSessions(memberId)
9. Créer audit log (action = "member_suspended", severity = "warning")
10. Envoyer email au membre via notificationService
11. Envoyer notification admin tenant
12. Retourner member suspendu

**Méthode reactivateMember(memberId: string, reactivatedBy: string) → Promise<Member>**

1. Récupérer member par ID
2. Vérifier que status = 'suspended'
3. Changer status à 'active'
4. Supprimer metadata.suspension_reason
5. Supprimer metadata.suspended_at
6. Réinitialiser failed_login_attempts = 0
7. Réinitialiser locked_until = null
8. Mettre à jour member dans DB
9. Créer audit log (action = "member_reactivated")
10. Envoyer email au membre
11. Retourner member réactivé

**Méthode terminateMember(memberId: string, reason: string, terminatedBy: string) → Promise<Member>**

1. Récupérer member par ID
2. Vérifier que status != 'deleted'
3. Changer status à 'deleted'
4. Renseigner deleted_at = now
5. Renseigner deleted_by = terminatedBy
6. Renseigner deletion_reason = reason
7. Mettre à jour member dans DB
8. Révoquer toutes sessions actives via sessionService.revokeAllSessions()
9. Révoquer tous les rôles :
   - Soft delete dans adm_member_roles (deleted_at = now)
10. Créer audit log (action = "member_terminated", severity = "info")
11. Planifier job d'anonymisation RGPD dans 90 jours :
    - Créer entrée dans table job_queue
    - Job : anonymizeMember(memberId)
    - Scheduled_at : deleted_at + 90 jours
12. Envoyer notification équipe RH via notificationService
13. Retourner member terminé

**Méthode anonymizeMember(memberId: string) → Promise<void>**

Méthode appelée automatiquement par job scheduler après 90 jours de soft delete.

1. Récupérer member par ID
2. Vérifier que status = 'deleted' ET deleted_at < now - 90 jours
3. Anonymiser données personnelles (RGPD) :
   - email → `deleted-user-{uuid}@anonymized.local`
   - phone → null
   - first_name → "Deleted"
   - last_name → "User"
   - clerk_user_id → null (désync Clerk)
   - two_factor_secret → null
   - notification_preferences → null
   - metadata → { anonymized: true, anonymized_at: now }
4. Garder UNIQUEMENT les données nécessaires pour audit :
   - id (référence dans audit_logs)
   - tenant_id
   - role
   - created_at, deleted_at
5. Mettre à jour member dans DB
6. Créer audit log (action = "member_anonymized", severity = "info")
7. NE PAS supprimer définitivement (hard delete) pour préserver intégrité audit_logs

**Méthode findAll(tenantId: string, filters: MemberFilters) → Promise<{ members: Member[], total: number }>**

1. Construire query Prisma avec filtres :
   - status : array de statuts à inclure (ex: ['active', 'inactive'])
   - role : array de rôles (ex: ['admin', 'manager'])
   - search : recherche fulltext sur email, first_name, last_name
   - two_factor_enabled : boolean
2. Ajouter WHERE tenant_id = tenantId
3. Ajouter WHERE deleted_at IS NULL (exclure membres supprimés)
4. Inclure relations :
   - default_role (adm_roles)
   - member_roles (adm_member_roles avec roles)
5. Trier par created_at DESC (plus récents d'abord)
6. Paginer avec limit et offset
7. Compter total avec COUNT(\*)
8. Retourner { members: [...], total: X }

**Méthode findById(id: string, tenantId: string) → Promise<Member>**

1. Chercher member par ID avec memberRepository.findById()
2. Vérifier tenant_id = tenantId (isolation multi-tenant)
3. SI non trouvé OU tenant différent → throw NotFoundError("Member not found")
4. Inclure relations :
   - tenant (adm_tenants)
   - default_role (adm_roles)
   - member_roles (adm_member_roles avec roles)
   - recent_sessions (adm_member_sessions, limit 10)
5. Retourner member complet

**Méthode updateMember(id: string, data: MemberUpdateInput, updatedBy: string) → Promise<Member>**

1. Valider data avec MemberUpdateSchema :
   ```typescript
   const MemberUpdateSchema = z.object({
     first_name: z.string().min(2).max(100).optional(),
     last_name: z.string().min(2).max(100).optional(),
     phone: z.string().regex(/^\+[1-9]\d{1,14}$/).optional(),
     preferred_language: z.enum(['en', 'fr', 'ar']).optional(),
     notification_preferences: z.object({...}).optional()
   });
   ```
2. Vérifier member existe avec findById()
3. SI email change :
   - Vérifier unicité nouvel email dans le tenant
   - Mettre email_verified_at = null (nécessite re-vérification)
   - Envoyer email vérification à nouvelle adresse
4. SI phone change :
   - Normaliser format E.164
5. SI preferred_language change :
   - Mettre à jour
6. Mettre à jour dans DB avec :
   - updated_at = now
   - updated_by = updatedBy
7. Créer audit log (action = "member_updated", old_values, new_values)
8. Retourner member mis à jour

**Fichier à créer : `lib/repositories/admin/member.repository.ts`**

Repository pour encapsuler accès Prisma à adm_members avec isolation tenant automatique.

**Classe MemberRepository extends BaseRepository**

**Méthode findByEmail(email: string, tenantId: string) → Promise<Member | null>**

Recherche un member par email dans un tenant spécifique (unicité par tenant).

**Méthode findByClerkUserId(clerkUserId: string) → Promise<Member | null>**

Recherche un member par Clerk User ID (global, pas de tenant filter car Clerk ID unique globalement).

**Méthode findWithRoles(id: string, tenantId: string) → Promise<Member>**

Récupère member avec tous ses rôles (adm_member_roles + adm_roles).

#### API REST (Endpoints)

**Fichier à créer : `app/api/v1/admin/members/route.ts`**

**GET /api/v1/admin/members**

Liste tous les membres du tenant avec filtres.

- **Query params** :
  - status : string[] (active, inactive, suspended)
  - role : string[] (admin, manager, operator, driver)
  - search : string (recherche email, nom, prénom)
  - two_factor_enabled : boolean
  - limit : number (défaut 20, max 100)
  - offset : number (défaut 0)

- **Permissions** : members.read

- **Réponse 200** :

```json
{
  "members": [
    {
      "id": "uuid",
      "email": "sarah@abclogistics.ae",
      "first_name": "Sarah",
      "last_name": "Ahmed",
      "role": "admin",
      "status": "active",
      "two_factor_enabled": true,
      "last_login_at": "2025-11-09T14:23:00Z",
      "created_at": "2025-11-08T10:00:00Z"
    }
  ],
  "total": 45,
  "limit": 20,
  "offset": 0
}
```

**POST /api/v1/admin/members**

Créer un membre manuellement (rare, normalement via invitation).

- **Body** :

```json
{
  "email": "john@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "role": "operator",
  "phone": "+971501234567",
  "preferred_language": "en"
}
```

- **Permissions** : members.create

- **Réponse 201** : Member créé

**Fichier à créer : `app/api/v1/admin/members/[id]/route.ts`**

**GET /api/v1/admin/members/[id]**

Détails complets d'un membre.

- **Permissions** : members.read

- **Réponse 200** :

```json
{
  "id": "uuid",
  "tenant_id": "uuid-tenant",
  "email": "sarah@abclogistics.ae",
  "first_name": "Sarah",
  "last_name": "Ahmed",
  "phone": "+971501234567",
  "status": "active",
  "role": "admin",
  "default_role": {
    "id": "uuid-role",
    "name": "Fleet Admin",
    "slug": "fleet-admin"
  },
  "two_factor_enabled": true,
  "email_verified_at": "2025-11-08T10:05:00Z",
  "last_login_at": "2025-11-09T14:23:00Z",
  "failed_login_attempts": 0,
  "locked_until": null,
  "preferred_language": "en",
  "created_at": "2025-11-08T10:00:00Z",
  "updated_at": "2025-11-09T08:15:00Z",
  "member_roles": [
    {
      "role": {
        "id": "uuid",
        "name": "Fleet Admin",
        "permissions": {...}
      },
      "assigned_at": "2025-11-08T10:00:00Z"
    }
  ]
}
```

**PATCH /api/v1/admin/members/[id]**

Mettre à jour un membre.

- **Body** :

```json
{
  "first_name": "Sarah",
  "last_name": "Ahmed-Smith",
  "phone": "+971501234568",
  "preferred_language": "en"
}
```

- **Permissions** : members.update

- **Réponse 200** : Member mis à jour

**DELETE /api/v1/admin/members/[id]**

Terminer un membre (soft delete).

- **Body** :

```json
{
  "reason": "Employé parti de l'entreprise"
}
```

- **Permissions** : members.delete

- **Réponse 200** :

```json
{
  "success": true,
  "member_id": "uuid",
  "status": "deleted",
  "deleted_at": "2025-11-09T15:00:00Z",
  "anonymization_scheduled": "2026-02-07T15:00:00Z"
}
```

**Fichier à créer : `app/api/v1/admin/members/[id]/suspend/route.ts`**

**POST /api/v1/admin/members/[id]/suspend**

Suspendre un membre.

- **Body** :

```json
{
  "reason": "Violation politique d'utilisation - accès non autorisé"
}
```

- **Permissions** : members.suspend

- **Réponse 200** :

```json
{
  "success": true,
  "member": {
    "id": "uuid",
    "email": "john@example.com",
    "status": "suspended",
    "metadata": {
      "suspension_reason": "Violation politique...",
      "suspended_at": "2025-11-09T15:30:00Z"
    }
  }
}
```

**Fichier à créer : `app/api/v1/admin/members/[id]/reactivate/route.ts`**

**POST /api/v1/admin/members/[id]/reactivate**

Réactiver un membre suspendu.

- **Permissions** : members.reactivate

- **Réponse 200** :

```json
{
  "success": true,
  "member": {
    "id": "uuid",
    "status": "active",
    "failed_login_attempts": 0,
    "locked_until": null
  }
}
```

**Fichier à créer : `app/api/v1/admin/invitations/route.ts`**

**POST /api/v1/admin/invitations**

Inviter un nouveau membre.

- **Body** :

```json
{
  "email": "marie@company.com",
  "role": "manager",
  "custom_message": "Bienvenue dans l'équipe FleetCore !"
}
```

- **Permissions** : members.invite

- **Réponse 201** :

```json
{
  "invitation": {
    "id": "uuid",
    "email": "marie@company.com",
    "role": "manager",
    "token": "uuid-token",
    "expires_at": "2025-11-16T10:00:00Z",
    "status": "pending",
    "invite_url": "https://fleetcore.com/accept-invitation?token=uuid-token"
  }
}
```

**Fichier à créer : `app/api/v1/admin/invitations/[id]/resend/route.ts`**

**POST /api/v1/admin/invitations/[id]/resend**

Renvoyer une invitation (si expirée ou email perdu).

- **Permissions** : members.invite

- **Réponse 200** :

```json
{
  "success": true,
  "invitation": {
    "id": "uuid",
    "email": "marie@company.com",
    "sent_count": 2,
    "last_sent_at": "2025-11-10T09:00:00Z",
    "expires_at": "2025-11-17T09:00:00Z"
  }
}
```

**Fichier à créer : `app/api/v1/auth/accept-invitation/route.ts`**

**POST /api/v1/auth/accept-invitation**

Accepter une invitation (endpoint public, no auth required).

- **Body** :

```json
{
  "token": "uuid-token",
  "clerk_user_id": "user_abc123"
}
```

- **Permissions** : Aucune (public)

- **Réponse 200** :

```json
{
  "success": true,
  "member": {
    "id": "uuid",
    "email": "marie@company.com",
    "tenant_id": "uuid-tenant",
    "role": "manager",
    "status": "active",
    "mfa_required": true
  },
  "next_step": "/onboarding/mfa"
}
```

**Fichier à créer : `app/api/v1/auth/mfa/enable/route.ts`**

**POST /api/v1/auth/mfa/enable**

Activer MFA (retourne QR code).

- **Permissions** : Authenticated user (self only)

- **Réponse 200** :

```json
{
  "success": true,
  "qr_code_url": "data:image/png;base64,...",
  "secret": "JBSWY3DPEHPK3PXP",
  "setup_url": "otpauth://totp/FleetCore:sarah@abc.ae?secret=JBSWY3DP&issuer=FleetCore"
}
```

**POST /api/v1/auth/mfa/verify**

Vérifier code MFA lors de l'activation (confirme MFA activé).

- **Body** :

```json
{
  "code": "123456"
}
```

- **Permissions** : Authenticated user

- **Réponse 200** :

```json
{
  "success": true,
  "two_factor_enabled": true,
  "backup_codes": [
    "XXXX-XXXX-XXXX",
    "YYYY-YYYY-YYYY",
    ...
  ]
}
```

**POST /api/v1/auth/mfa/disable**

Désactiver MFA.

- **Body** :

```json
{
  "password": "current_password",
  "mfa_code": "123456"
}
```

- **Permissions** : Authenticated user

- **Réponse 200** :

```json
{
  "success": true,
  "two_factor_enabled": false,
  "warning": "MFA désactivé, votre compte est moins sécurisé"
}
```

#### Frontend (Interface Utilisateur)

**Page à créer : `app/[locale]/admin/team/page.tsx`**

Page principale de gestion des membres du tenant.

**Layout de la page :**

```
┌─────────────────────────────────────────────────────────┐
│ HEADER                                                  │
│ [FleetCore Logo] Admin > Team         [+ Invite Member]│
└─────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────┐
│ STATS                                                   │
│ Total: 45 members | Active: 42 | Suspended: 2 | MFA: 38│
└─────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────┐
│ FILTRES                                                 │
│ [Status ▼] [Role ▼] [🔍 Search...] [MFA Only ☑]       │
└─────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────┐
│ TABLE MEMBERS                                           │
│ Name           Email              Role      MFA  Status │
│ ─────────────────────────────────────────────────────   │
│ 👤 Sarah Ahmed sarah@abc.ae      Admin     ✅   Active  │
│ 👤 John Doe    john@abc.ae       Manager   ✅   Active  │
│ 👤 Marie Smith marie@abc.ae      Operator  ❌   Active  │
└─────────────────────────────────────────────────────────┘
```

**Composant à créer : `components/admin/MemberTable.tsx`**

Table affichant la liste des membres avec :

- Avatar (initiales ou photo)
- Nom complet (first_name + last_name)
- Email
- Role badge (avec couleur selon rôle)
- MFA status (✅ activé, ❌ non activé)
- Status badge (Active, Suspended, Inactive)
- Actions dropdown (Edit, Suspend, Delete, Resend invitation)

**Composant à créer : `components/admin/InviteMemberModal.tsx`**

Modal formulaire pour inviter un nouveau membre.

**Champs du formulaire :**

- Email (requis, validation email)
- Role (requis, dropdown : Admin, Manager, Operator, Driver)
- Custom message (optionnel, textarea 500 chars max)

**Validation :**

- Email format RFC 5322
- Email pas déjà membre du tenant
- Role valide

**Soumission :**

- POST /api/v1/admin/invitations
- Si succès : toast "Invitation envoyée à {email}", ferme modal, refresh liste
- Si erreur : affiche message erreur

**Page à créer : `app/[locale]/admin/team/[id]/page.tsx`**

Page détail d'un membre.

**Sections :**

1. **Informations personnelles** :
   - Avatar (upload photo)
   - First name, Last name
   - Email, Phone
   - Preferred language
   - Status badge

2. **Sécurité** :
   - Email verified : ✅ Verified on 8 Nov 2025
   - MFA enabled : ✅ Enabled (bouton "Disable" si user owner)
   - Last login : 9 Nov 2025 14:23
   - Failed login attempts : 0
   - Locked until : -

3. **Rôles et permissions** :
   - Default role : Fleet Admin
   - Additional roles : (liste avec badges)
   - Bouton "Manage Roles"

4. **Activité récente** :
   - Liste des 10 dernières actions depuis adm_audit_logs
   - Format : "Created vehicle VH-001" (9 Nov 14:23)

5. **Actions** :
   - Bouton "Suspend Member" (si active)
   - Bouton "Reactivate" (si suspended)
   - Bouton "Terminate Member" (soft delete)
   - Bouton "Edit Profile"

**Page à créer : `app/[locale]/onboarding/mfa/page.tsx`**

Page d'activation MFA lors de l'onboarding.

**Layout :**

```
┌─────────────────────────────────────────────────────────┐
│                  🔐 Secure Your Account                 │
│                                                         │
│  Two-Factor Authentication (MFA) is required for        │
│  administrators to protect sensitive data.              │
│                                                         │
│  ┌───────────────────────────────────────────────────┐ │
│  │  Step 1: Download an authenticator app            │ │
│  │  • Google Authenticator (iOS/Android)             │ │
│  │  • Authy (iOS/Android/Desktop)                    │ │
│  │  • 1Password (Premium)                            │ │
│  └───────────────────────────────────────────────────┘ │
│                                                         │
│  ┌───────────────────────────────────────────────────┐ │
│  │  Step 2: Scan this QR code                        │ │
│  │                                                   │ │
│  │       ████████████████████████                    │ │
│  │       ██  ██████  ██  ████  ██                    │ │
│  │       ██  ██████  ██  ████  ██                    │ │
│  │       ████████████████████████                    │ │
│  │                                                   │ │
│  │  Or enter this code manually:                     │ │
│  │  JBSWY3DPEHPK3PXP                                 │ │
│  └───────────────────────────────────────────────────┘ │
│                                                         │
│  ┌───────────────────────────────────────────────────┐ │
│  │  Step 3: Verify with your code                    │ │
│  │  Enter the 6-digit code from your app:            │ │
│  │  [_] [_] [_] [_] [_] [_]                          │ │
│  │                                                   │ │
│  │  [Verify and Enable MFA]                          │ │
│  └───────────────────────────────────────────────────┘ │
│                                                         │
│  [ ] I'll do this later (only for non-admins)          │
└─────────────────────────────────────────────────────────┘
```

**Fonctionnalités :**

- Affichage QR code généré dynamiquement
- Champ input 6 chiffres (auto-focus, auto-submit si 6 chiffres entrés)
- Validation en temps réel
- Si code valide :
  - Modal affiche 10 backup codes
  - Bouton "Download backup codes" (génère fichier .txt)
  - Warning : "Save these codes in a secure place"
  - Après confirmation, redirige vers dashboard
- Si code invalide :
  - Toast erreur "Code invalide, veuillez réessayer"
  - Input reset

**Composant à créer : `components/auth/BackupCodesModal.tsx`**

Modal pour afficher les backup codes après activation MFA.

**Layout :**

```
⚠️ Save Your Backup Codes

These codes can be used if you lose access to your
authenticator app. Each code can only be used once.

┌─────────────────────────────────────────────────┐
│ XXXX-XXXX-XXXX     YYYY-YYYY-YYYY              │
│ ZZZZ-ZZZZ-ZZZZ     AAAA-AAAA-AAAA              │
│ BBBB-BBBB-BBBB     CCCC-CCCC-CCCC              │
│ DDDD-DDDD-DDDD     EEEE-EEEE-EEEE              │
│ FFFF-FFFF-FFFF     GGGG-GGGG-GGGG              │
└─────────────────────────────────────────────────┘

[📥 Download as Text File] [✅ I've Saved These Codes]
```

**Actions :**

- Download : génère fichier `fleetcore-backup-codes.txt`
- Checkbox "I've saved these codes" obligatoire avant de fermer
- Après confirmation : ferme modal, redirige dashboard

### 🎬 RÉSULTAT DÉMONTRABLE

**Scénario démo complet pour le sponsor :**

**1. Invitation d'un membre**

- Admin va sur /admin/team
- Clique "+ Invite Member"
- Modal s'ouvre
- Remplit :
  - Email : marie@company.com
  - Role : Manager
  - Message : "Bienvenue dans l'équipe !"
- Clique "Send Invitation"
- Toast "Invitation envoyée à marie@company.com"
- Email reçu par Marie dans les 30 secondes

**2. Acceptation invitation**

- Marie clique lien dans email
- Page /accept-invitation s'ouvre
- Email pré-rempli : marie@company.com
- Formulaire Clerk :
  - "Create your password"
  - Password input (validation temps réel)
  - Confirm password
- Marie crée password
- Clerk envoie OTP à l'email pour vérification
- Marie entre OTP
- Email vérifié ✅

**3. Webhook Clerk traité**

- Système reçoit webhook user.created
- ClerkSyncService trouve invitation pour marie@company.com
- Crée member dans adm_members :
  - clerk_user_id : user_xyz789
  - email : marie@company.com
  - role : Manager
  - status : active
  - email_verified_at : now
- Met à jour invitation status = 'accepted'

**4. Activation MFA (obligatoire pour Manager)**

- Marie redirigée vers /onboarding/mfa
- Page affiche QR code + secret texte
- Marie ouvre Google Authenticator sur téléphone
- Scanne QR code
- App génère code : 234567
- Marie entre code dans formulaire
- Système valide code ✅
- Modal backup codes s'affiche
- 10 codes affichés : XXXX-XXXX-XXXX, etc.
- Marie clique "Download as Text File"
- Fichier téléchargé
- Marie coche "I've saved these codes"
- Clique "Continue"

**5. Premier login réussi**

- Marie redirigée vers dashboard /app
- Toast "Bienvenue Marie !"
- Dashboard affiche :
  - Nom : Marie Smith
  - Role : Manager
  - MFA : ✅ Enabled
  - Notifications : 0 unread
- Sidebar visible avec permissions Manager :
  - Dashboard
  - Fleet Management (read only)
  - Drivers (read/write)
  - Trips (read only)
  - Reports
- Audit log créé : "member_first_login"

**6. Test verrouillage anti-brute-force**

- Utilisateur malveillant tente de pirater compte Marie
- 5 tentatives login échouées avec mauvais password
- Système :
  - failed_login_attempts passe à 5
  - locked_until = now + 30 min
  - status = 'suspended'
  - Email envoyé à Marie : "Compte verrouillé"
  - Email envoyé à admin : "Membre marie@company.com verrouillé"
  - Audit log créé (severity = 'warning')
- Tentative 6 → erreur 403 "Compte verrouillé jusqu'à 15:45"
- 30 minutes plus tard, Marie se connecte avec bon password
- Système déverrouille automatiquement :
  - locked_until = null
  - status = 'active'
  - failed_login_attempts = 0
  - Audit log "account_unlocked_auto"

**7. Admin suspend membre**

- Admin va sur /admin/team
- Clique sur row de John Doe
- Page détail /admin/team/[id] s'ouvre
- Admin clique bouton "Suspend Member"
- Modal confirmation :
  - "Are you sure you want to suspend john@company.com?"
  - Raison (textarea obligatoire)
- Admin entre : "Violation politique - accès non autorisé zone sécurisée"
- Confirme
- Système :
  - status = 'suspended'
  - Révoque toutes sessions actives
  - John déconnecté immédiatement (toutes sessions)
  - Email envoyé à John
  - Audit log créé
- Badge status change : Active → Suspended (rouge)

**CritÈres d'acceptation :**

- ✅ Invitation envoyée par email dans les 30 secondes
- ✅ Lien invitation valide 7 jours
- ✅ Webhook Clerk user.created crée member automatiquement
- ✅ Email déjà membre du tenant → erreur claire
- ✅ MFA obligatoire pour Admin/Manager, optionnel pour Operator/Driver
- ✅ QR code MFA scannable, secret affiché en texte
- ✅ Backup codes générés (10) et téléchargeables
- ✅ Verrouillage après 5 échecs login
- ✅ Déverrouillage automatique après 30 min
- ✅ Suspension révoque toutes sessions immédiatement
- ✅ Audit trail complet de toutes actions
- ✅ Page team affiche tous membres avec filtres
- ✅ Page détail membre affiche infos + sécurité + rôles
- ✅ Responsive mobile (table devient cartes)

### ⏱️ ESTIMATION

- **Temps backend** : **10 heures**
  - MemberService : 6h
  - MemberRepository : 1h
  - InvitationService : 2h
  - ClerkSyncService : 1h

- **Temps API** : **6 heures**
  - GET/POST/PATCH/DELETE /members : 2h
  - POST /invitations, /invitations/[id]/resend : 1h
  - POST /accept-invitation : 1h
  - POST /mfa/enable, /mfa/verify, /mfa/disable : 2h

- **Temps frontend** : **12 heures**
  - Page /admin/team (table + filtres) : 4h
  - Page /admin/team/[id] (détail membre) : 3h
  - InviteMemberModal : 2h
  - Page /onboarding/mfa : 2h
  - BackupCodesModal : 1h

- **Temps tests** : **4 heures**
  - Tests unitaires MemberService : 2h
  - Tests API : 1h
  - Tests E2E invitation flow : 1h

- **TOTAL : 32 heures (2 jours)**

### 🔗 DÉPENDANCES

**Prérequis obligatoires :**

- Étape 1.1 terminée (Tenant Management)
- Phase 0.3 terminée (AuditService, ClerkSyncService)
- Phase 0.4 terminée (NotificationService)
- Table adm_members existante en base
- Table adm_invitations existante
- Clerk configuré avec webhooks vers /api/webhooks/clerk

**Services/composants requis :**

- BaseService (héritage)
- TenantService (vérifier tenant actif)
- AuditService (logging automatique)
- NotificationService (emails invitation, MFA)
- ClerkService (sync users, verify password)

**Variables d'environnement :**

- CLERK_SECRET_KEY
- CLERK_WEBHOOK_SECRET
- MFA_ENCRYPTION_KEY (AES-256 key)
- RESEND_API_KEY (emails)

**Données de test nécessaires :**

- 1 tenant actif avec contract
- 1 provider employee (pour created_by initial)
- 1 role "Admin" dans adm_roles
- Templates emails : invitation_sent, mfa_enabled, account_locked

### ✅ CHECKLIST DE VALIDATION

**Backend :**

- [ ] MemberService compile, toutes méthodes implémentées, 0 type `any`
- [ ] MemberRepository compile, findByEmail() et findByClerkUserId() fonctionnent
- [ ] InvitationService compile, create() et acceptInvitation() fonctionnent
- [ ] Algorithme anti-brute-force fonctionne (5 échecs = verrouillage 30 min)
- [ ] MFA activation génère QR code valide (scannable)
- [ ] MFA secret chiffré AES-256 correctement
- [ ] Backup codes générés et hachés (bcrypt)
- [ ] Webhook Clerk user.created crée member automatiquement

**API :**

- [ ] GET /api/v1/admin/members retourne liste paginée avec filtres
- [ ] POST /api/v1/admin/members crée member (rare, normalement via invitation)
- [ ] PATCH /api/v1/admin/members/[id] met à jour membre
- [ ] DELETE /api/v1/admin/members/[id] termine membre (soft delete)
- [ ] POST /api/v1/admin/members/[id]/suspend suspend membre + révoque sessions
- [ ] POST /api/v1/admin/members/[id]/reactivate réactive membre suspendu
- [ ] POST /api/v1/admin/invitations envoie invitation par email
- [ ] POST /api/v1/admin/invitations/[id]/resend renvoie invitation
- [ ] POST /api/v1/auth/accept-invitation accepte invitation + crée member
- [ ] POST /api/v1/auth/mfa/enable retourne QR code
- [ ] POST /api/v1/auth/mfa/verify valide code et active MFA
- [ ] POST /api/v1/auth/mfa/disable désactive MFA (password + code requis)

**Frontend :**

- [ ] Page /admin/team affiche table membres avec filtres
- [ ] Filtres fonctionnent (status, role, search, MFA)
- [ ] InviteMemberModal valide email et envoie invitation
- [ ] Page /admin/team/[id] affiche détails complets membre
- [ ] Actions suspend/reactivate/delete fonctionnent
- [ ] Page /onboarding/mfa affiche QR code scannable
- [ ] Input 6 chiffres valide code MFA en temps réel
- [ ] BackupCodesModal affiche 10 codes + bouton download
- [ ] Download backup codes génère fichier .txt
- [ ] Toast succès/erreur affichés correctement

**Tests :**

- [ ] Test unitaire handleFailedLogin (5 échecs = lock)
- [ ] Test unitaire handleSuccessfulLogin (unlock auto)
- [ ] Test unitaire enableTwoFactor (code valide/invalide)
- [ ] Test unitaire disableTwoFactor (password + code requis)
- [ ] Test API POST /invitations crée invitation + envoie email
- [ ] Test API POST /accept-invitation crée member depuis invitation
- [ ] Test E2E invitation flow complet (invite → accept → MFA → login)
- [ ] Test E2E brute force (5 échecs → lock → unlock)

**Démo :**

- [ ] Sponsor peut inviter un membre depuis UI
- [ ] Email invitation reçu dans les 30 secondes
- [ ] Membre peut accepter invitation et créer compte Clerk
- [ ] MFA activation obligatoire pour Admin/Manager
- [ ] Backup codes téléchargeables
- [ ] Verrouillage anti-brute-force fonctionne
- [ ] Admin peut suspendre/réactiver membres depuis UI
- [ ] Audit trail visible dans /admin/audit-logs

---

# CHAPITRE 2 : SYSTÈME RBAC COMPLET

**Durée :** 4 jours ouvrés (32 heures)  
**Objectif :** Implémenter un système RBAC granulaire avec permissions par ressource, versionnement, et attribution multi-rôles avec scopes  
**Livrable démo :** Interface Admin pour créer rôles personnalisés, assigner permissions fines, et gérer attribution membres

---

## ÉTAPE 2.1 : Roles - Définition et Hiérarchie

### 🎯 RATIONNEL MÉTIER

**POURQUOI :** Le rôle définit CE QU'UN MEMBRE PEUT FAIRE dans FleetCore. Un admin peut tout faire, un manager peut gérer son équipe, un opérateur peut uniquement consulter et saisir des données, un chauffeur ne voit que ses propres trajets. Sans système de rôles structuré, impossible de donner les bonnes permissions aux bonnes personnes. Risque = soit tout le monde est admin (danger sécurité), soit personne ne peut rien faire (paralysie opérationnelle).

**QUEL PROBLÈME :** Actuellement, le système utilise un champ `role` en texte libre ('admin', 'manager', etc.) mais AUCUNE définition de ce que ces rôles signifient réellement. Qu'est-ce qu'un "manager" peut faire exactement ? Peut-il créer des véhicules ? Supprimer des chauffeurs ? Voir la comptabilité ? AUCUNE réponse claire. De plus, impossible de créer des rôles personnalisés : si ABC Logistics veut un rôle "Fleet Coordinator Zone Nord" avec permissions spécifiques, impossible.

**IMPACT SI ABSENT :**

- **Sécurité** : Impossible de respecter le principe du moindre privilège (least privilege)
- **Conformité** : Non-conformité ISO27001/SOC2 (pas de ségrégation des tâches)
- **Flexibilité** : Clients ne peuvent pas adapter les rôles à leur organisation
- **Audit** : Impossible de savoir QUI peut faire QUOI
- **Scalabilité** : Avec 50+ membres, gestion des permissions devient ingérable

**CAS D'USAGE CONCRET :**

ABC Logistics (UAE) a 80 chauffeurs, 8 coordinateurs de flotte, 3 managers, 1 directeur opérations. Structure organisationnelle :

```
Sarah Ahmed (Fleet Director) - Accès TOUT
├─ Zone Nord (Dubai/Sharjah)
│  ├─ Karim (Fleet Coordinator Nord) - Véhicules zone Nord uniquement
│  ├─ 40 chauffeurs
│
└─ Zone Sud (Abu Dhabi/Al Ain)
   ├─ Fatima (Fleet Coordinator Sud) - Véhicules zone Sud uniquement
   ├─ 40 chauffeurs
```

**Besoins en rôles personnalisés :**

1. **Fleet Director** (Sarah) :
   - Accès COMPLET toutes zones
   - Peut créer/modifier/supprimer véhicules, chauffeurs, trajets
   - Accès comptabilité et facturation
   - Peut gérer les autres membres (créer coordinateurs, managers)

2. **Fleet Coordinator Zone Nord** (Karim) :
   - Accès UNIQUEMENT véhicules avec metadata.zone = 'nord'
   - Peut créer/modifier véhicules de sa zone
   - Peut assigner chauffeurs de sa zone aux véhicules
   - Peut voir trajets de sa zone
   - NE PEUT PAS voir comptabilité
   - NE PEUT PAS gérer membres

3. **Fleet Coordinator Zone Sud** (Fatima) :
   - Même permissions que Karim MAIS scope = 'sud'

4. **Driver** (Mohamed, Ali, etc.) :
   - Accès UNIQUEMENT ses propres données
   - Peut voir SES trajets assignés (driver_id = self)
   - Peut démarrer/terminer trajets
   - Peut voir SON véhicule assigné
   - NE PEUT PAS voir autres chauffeurs
   - NE PEUT PAS voir autres véhicules

**Workflow complet création rôle personnalisé :**

1. **Sarah crée rôle "Fleet Coordinator Zone Nord"** :
   - Va dans Admin > Roles
   - Clique "+ Create Role"
   - Formulaire :
     - Name : "Fleet Coordinator Zone Nord"
     - Slug : "fleet-coordinator-north" (auto-généré)
     - Description : "Coordinateur de flotte responsable zone Nord (Dubai/Sharjah)"
     - Parent role : "Fleet Coordinator" (hérite permissions de base)
     - Is system : false (rôle custom, pas protégé)
     - Is default : false (pas assigné automatiquement)
     - Max members : 5 (limite à 5 coordinateurs zone Nord max)

2. **Sarah définit permissions granulaires** :
   - Section "Vehicles" :
     - ✅ vehicles.read (scope: zone = nord)
     - ✅ vehicles.create (scope: zone = nord)
     - ✅ vehicles.update (scope: zone = nord)
     - ❌ vehicles.delete (pas de suppression)
     - ✅ vehicles.export (rapports Excel)
   - Section "Drivers" :
     - ✅ drivers.read (scope: zone = nord)
     - ✅ drivers.update (scope: zone = nord)
     - ❌ drivers.create (ne peut pas recruter)
     - ❌ drivers.delete
   - Section "Trips" :
     - ✅ trips.read (scope: zone = nord)
     - ✅ trips.update (modifier statut)
     - ❌ trips.delete
   - Section "Finance" :
     - ❌ revenues.read (pas d'accès compta)
     - ❌ expenses.read
   - Section "Admin" :
     - ❌ members.read (ne voit pas équipe)
     - ❌ roles.manage

3. **Sarah configure scope automatique** :
   - Scope type : "branch" (zone géographique)
   - Scope value : "nord"
   - Effet : TOUTES les requêtes de Karim seront automatiquement filtrées :
     - `WHERE metadata->>'zone' = 'nord'`
     - Row-Level Security appliqué automatiquement

4. **Système crée rôle dans adm_roles** :
   - id : uuid généré
   - tenant_id : ABC Logistics
   - name : "Fleet Coordinator Zone Nord"
   - slug : "fleet-coordinator-north"
   - description : "Coordinateur..."
   - parent_role_id : uuid du rôle "Fleet Coordinator"
   - is_system : false
   - is_default : false
   - max_members : 5
   - status : 'active'
   - created_by : sarah_id

5. **Système crée permissions dans adm_role_permissions** :
   - Une ligne par permission (15 lignes créées) :
     ```
     { role_id, resource: 'vehicles', action: 'read', conditions: {"scope_type":"branch","scope_value":"nord"} }
     { role_id, resource: 'vehicles', action: 'create', conditions: {"scope_type":"branch","scope_value":"nord"} }
     { role_id, resource: 'vehicles', action: 'update', conditions: {"scope_type":"branch","scope_value":"nord"} }
     ...
     ```

6. **Sarah assigne rôle à Karim** :
   - Va dans Admin > Team
   - Clique sur row Karim
   - Onglet "Roles"
   - Clique "+ Assign Role"
   - Sélectionne "Fleet Coordinator Zone Nord"
   - Confirme
   - Système crée dans adm_member_roles :
     - member_id : karim_id
     - role_id : role_id du coordinateur nord
     - is_primary : true (rôle principal)
     - scope_type : 'branch'
     - scope_id : 'nord'
     - assigned_by : sarah_id

7. **Karim se connecte** :
   - Dashboard affiche UNIQUEMENT véhicules zone Nord (40 véhicules)
   - Sidebar visible :
     - Dashboard
     - Fleet (Vehicles Nord) ✅
     - Drivers (Zone Nord) ✅
     - Trips (Zone Nord) ✅
     - Finance ❌ (grisé, pas d'accès)
     - Admin ❌ (invisible)
   - Si Karim tente d'accéder véhicule zone Sud (API directe) :
     - Middleware RBAC vérifie permissions
     - Trouve role avec scope = 'nord'
     - Véhicule demandé a zone = 'sud'
     - REJET 403 Forbidden
     - Audit log créé (severity = 'warning')

**Valeur business :**

- **Sécurité** : Principe moindre privilège respecté (coordinateurs accès limité)
- **Flexibilité** : Clients créent rôles adaptés à leur organisation
- **Audit** : Traçabilité complète qui peut faire quoi
- **Conformité** : Ségrégation des tâches (ISO27001 req 9.2.3)
- **Scalabilité** : 1000+ membres gérables avec rôles bien définis

### 📊 DONNÉES ET RÈGLES MÉTIER

**Table principale : `adm_roles`**

**Colonnes critiques (18 colonnes) :**

| Colonne               | Type         | Obligatoire | Utilité Business                                   |
| --------------------- | ------------ | ----------- | -------------------------------------------------- |
| **id**                | uuid         | OUI         | Identifiant unique rôle (PK)                       |
| **tenant_id**         | uuid         | OUI         | Tenant propriétaire (FK → adm_tenants)             |
| **name**              | varchar(100) | OUI         | Nom rôle (ex: "Fleet Coordinator Zone Nord")       |
| **slug**              | varchar(100) | OUI         | Identifiant stable (ex: "fleet-coordinator-north") |
| **description**       | text         | NON         | Description rôle pour documentation                |
| **parent_role_id**    | uuid         | NON         | Héritage permissions (FK → adm_roles)              |
| **is_system**         | boolean      | OUI         | Rôle protégé système (non modifiable)              |
| **is_default**        | boolean      | OUI         | Assigné automatiquement aux nouveaux membres       |
| **max_members**       | integer      | NON         | Limite nombre membres avec ce rôle                 |
| **status**            | text         | OUI         | État (active, inactive, archived)                  |
| **valid_from**        | timestamp    | NON         | Date activation rôle                               |
| **valid_until**       | timestamp    | NON         | Date expiration rôle (rôles temporaires)           |
| **approval_required** | boolean      | OUI         | Assignation nécessite approbation manager          |
| **created_at**        | timestamp    | OUI         | Date création                                      |
| **updated_at**        | timestamp    | OUI         | Date modification                                  |
| **created_by**        | uuid         | NON         | Qui a créé (FK → adm_members)                      |
| **updated_by**        | uuid         | NON         | Qui a modifié                                      |
| **deleted_at**        | timestamp    | NON         | Date soft delete                                   |

**Rôles système prédéfinis (is_system = true) :**

```
1. SUPER_ADMIN (FleetCore provider only)
   - Accès COMPLET cross-tenant
   - Peut impersonate tenants
   - Peut gérer configuration système
   - NE PEUT PAS être assigné à membres tenants

2. ADMIN (Tenant)
   - Accès COMPLET son tenant
   - Peut gérer membres, rôles, permissions
   - Peut voir comptabilité
   - Peut configurer tenant settings
   - MFA OBLIGATOIRE

3. MANAGER (Tenant)
   - Accès lecture/écriture modules opérationnels
   - Peut gérer son équipe (lecture seule)
   - Accès limité comptabilité (vue seulement)
   - NE PEUT PAS créer/modifier rôles
   - MFA OBLIGATOIRE

4. OPERATOR (Tenant)
   - Accès lecture/écriture données quotidiennes
   - Peut créer véhicules, chauffeurs, trajets
   - NE PEUT PAS supprimer données critiques
   - NE PEUT PAS voir comptabilité
   - MFA RECOMMANDÉ

5. DRIVER (Tenant)
   - Accès UNIQUEMENT ses propres données (scope: self)
   - Peut voir SES trajets assignés
   - Peut démarrer/terminer SES trajets
   - NE PEUT PAS voir autres chauffeurs/véhicules
   - MFA OPTIONNEL
```

**Statuts possibles et transitions :**

```
ÉTAT : active (rôle utilisable)
├─ CONDITIONS : valid_from <= now <= valid_until
├─ ACCÈS : Assignable aux membres
└─ TRANSITIONS :
   ├─ → inactive (désactivé temporairement)
   ├─ → archived (plus utilisé mais conservé pour historique)

ÉTAT : inactive (rôle désactivé)
├─ CONDITIONS : Désactivé manuellement OU valid_until dépassé
├─ ACCÈS : Non assignable, membres existants conservent accès
└─ TRANSITION : → active (réactivation manuelle)

ÉTAT : archived (rôle archivé)
├─ CONDITIONS : Plus utilisé, remplacé par nouveau rôle
├─ ACCÈS : Non assignable, membres existants révoqués
└─ TRANSITION : Aucune (définitif)
```

**Règles d'héritage permissions (parent_role_id) :**

```
ALGORITHME resolvePermissions(role_id) :
  ENTRÉE : role_id

  1. Récupérer rôle depuis adm_roles
  2. Récupérer permissions directes depuis adm_role_permissions WHERE role_id
  3. permissions = permissions_directes
  4.
  5. SI parent_role_id NON NULL
     ALORS
       - permissions_parent = resolvePermissions(parent_role_id) [RÉCURSIF]
       - permissions = MERGE(permissions_parent, permissions_directes)
       - RÈGLE : permissions_directes écrasent permissions_parent si conflit
     FIN SI
  6.
  7. RETOURNER permissions

EXEMPLE :
  Role "Fleet Coordinator Nord" (parent = "Fleet Coordinator")

  Fleet Coordinator (parent) a :
    - vehicles.read (scope: all)
    - vehicles.create (scope: all)
    - drivers.read (scope: all)

  Fleet Coordinator Nord (enfant) surcharge :
    - vehicles.read (scope: zone=nord) [SURCHARGE]
    - vehicles.create (scope: zone=nord) [SURCHARGE]
    - drivers.read (scope: zone=nord) [SURCHARGE]
    - trips.read (scope: zone=nord) [NOUVELLE]

  RÉSULTAT FINAL :
    - vehicles.read (scope: zone=nord) ✅ surchargé
    - vehicles.create (scope: zone=nord) ✅ surchargé
    - drivers.read (scope: zone=nord) ✅ surchargé
    - trips.read (scope: zone=nord) ✅ nouveau
```

**Règles de validation (RoleCreateSchema Zod) :**

```typescript
export const RoleCreateSchema = z
  .object({
    name: z
      .string()
      .min(3, "Nom trop court (min 3 caractères)")
      .max(100)
      .regex(
        /^[A-Za-z0-9\s\-_]+$/,
        "Nom ne doit contenir que lettres, chiffres, espaces, tirets"
      ),
    slug: z
      .string()
      .min(3)
      .max(100)
      .regex(/^[a-z0-9\-]+$/, "Slug format kebab-case uniquement")
      .optional(), // Auto-généré si non fourni
    description: z.string().max(500).optional(),
    parent_role_id: z.string().uuid("Parent role ID invalide").optional(),
    is_system: z.boolean().default(false),
    is_default: z.boolean().default(false),
    max_members: z.number().int().positive().max(1000).optional(),
    approval_required: z.boolean().default(false),
    valid_from: z.date().optional(),
    valid_until: z.date().optional(),
  })
  .refine(
    (data) => {
      // valid_until doit être après valid_from
      if (data.valid_from && data.valid_until) {
        return data.valid_until > data.valid_from;
      }
      return true;
    },
    {
      message: "valid_until doit être postérieur à valid_from",
    }
  )
  .refine(
    (data) => {
      // is_system = true uniquement pour provider employees
      if (data.is_system && !isProviderEmployee(currentUser)) {
        return false;
      }
      return true;
    },
    {
      message: "Seul FleetCore provider peut créer rôles système",
    }
  );
```

**Règles de cohérence inter-colonnes :**

- **Is_system = true** ⇒ NE PEUT PAS être modifié/supprimé par tenants
- **Is_default = true** ⇒ max_members doit être NULL (illimité)
- **Deleted_at non null** ⇒ status doit être 'archived'
- **Parent_role_id** ⇒ parent doit appartenir au MÊME tenant (pas cross-tenant)
- **Max_members atteint** ⇒ assignation bloquée jusqu'à révocation d'un membre

### 🏗️ COMPOSANTS À DÉVELOPPER

#### Backend (Service Layer)

**Fichier à créer : `lib/services/admin/role.service.ts`**

Service contenant toute la logique métier des rôles.

**Classe RoleService extends BaseService**

**Méthode createRole(data: RoleCreateInput) → Promise<Role>**

1. Valider data avec RoleCreateSchema
2. Extraire tenant_id depuis contexte auth
3. SI slug non fourni, générer depuis name :
   - Convertir en lowercase
   - Remplacer espaces par tirets
   - Supprimer caractères spéciaux
   - Exemple : "Fleet Coordinator Zone Nord" → "fleet-coordinator-zone-nord"
4. Vérifier unicité slug dans le tenant
5. SI parent_role_id fourni :
   - Vérifier parent existe et appartient au tenant
   - Vérifier pas de circularité (A → B → A interdit)
6. SI is_system = true :
   - Vérifier que current_user est provider employee
   - SINON reject
7. Créer role dans adm_roles via roleRepository.create()
8. Créer version initiale dans adm_role_versions :
   - version_number : 1
   - permissions_snapshot : [] (vide à la création)
   - changed_by : current_user_id
   - change_reason : "Initial role creation"
9. Créer audit log "role_created"
10. Retourner role créé

**Méthode updateRole(roleId: string, data: RoleUpdateInput, updatedBy: string) → Promise<Role>**

1. Récupérer role par ID via roleRepository.findById()
2. Vérifier que is_system = false (rôles système non modifiables)
3. Valider data avec RoleUpdateSchema
4. SI name change, vérifier unicité
5. SI slug change, vérifier unicité
6. SI parent_role_id change :
   - Vérifier nouveau parent existe
   - Vérifier pas de circularité
7. Capturer old_values (snapshot avant modification)
8. Mettre à jour role dans DB
9. Créer nouvelle version dans adm_role_versions :
   - version_number : current + 1
   - permissions_snapshot : permissions actuelles (depuis adm_role_permissions)
   - changed_by : updatedBy
   - change_reason : fournie par user ou "Role updated"
10. Créer audit log "role_updated" avec old_values et new_values
11. Retourner role mis à jour

**Méthode archiveRole(roleId: string, reason: string, archivedBy: string) → Promise<Role>**

1. Récupérer role par ID
2. Vérifier que is_system = false (rôles système non archivables)
3. Compter membres avec ce rôle :
   - SELECT COUNT(\*) FROM adm_member_roles WHERE role_id AND deleted_at IS NULL
4. SI count > 0 :
   - Révoquer tous les membres (soft delete dans adm_member_roles)
   - Créer audit logs pour chaque révocation
   - Envoyer notifications aux membres affectés
5. Changer status à 'archived'
6. Renseigner deleted_at = now
7. Renseigner metadata.archive_reason = reason
8. Mettre à jour dans DB
9. Créer audit log "role_archived"
10. Retourner role archivé

**Méthode getPermissions(roleId: string) → Promise<Permission[]>**

Implémente l'algorithme resolvePermissions (héritage récursif).

1. Récupérer role depuis adm_roles
2. Récupérer permissions directes depuis adm_role_permissions
3. SI parent_role_id NON NULL :
   - permissions_parent = getPermissions(parent_role_id) [RÉCURSIF]
   - MERGE permissions_parent avec permissions directes
   - Permissions directes écrasent parent en cas de conflit
4. Retourner permissions complètes (héritage résolu)

**Méthode checkPermission(memberId: string, resource: string, action: string, context: object) → Promise<boolean>**

Vérifie si un membre a la permission d'effectuer une action sur une ressource.

1. Récupérer tous les rôles du membre depuis adm_member_roles WHERE member_id AND deleted_at IS NULL
2. Pour chaque role :
   - permissions = getPermissions(role_id)
   - Filtrer permissions WHERE resource = resource AND action = action
3. SI aucune permission trouvée → RETOURNER false
4. POUR CHAQUE permission trouvée :
   - Évaluer conditions (scope, contraintes business)
   - SI context.resource_id fourni :
     - Vérifier scope autorise accès à cette ressource
     - Exemple : scope = 'zone:nord' ET resource.zone = 'nord' → OK
     - Exemple : scope = 'zone:nord' ET resource.zone = 'sud' → KO
   - SI scope = 'self' :
     - Vérifier resource.owner_id = memberId
5. SI AU MOINS UNE permission valide → RETOURNER true
6. SINON → RETOURNER false

**Méthode findAll(tenantId: string, filters: RoleFilters) → Promise<{ roles: Role[], total: number }>**

1. Construire query Prisma avec filtres :
   - status : array (active, inactive, archived)
   - is_system : boolean
   - search : recherche sur name ou slug
2. Ajouter WHERE tenant_id = tenantId OU is_system = true (rôles système visibles partout)
3. Ajouter WHERE deleted_at IS NULL
4. Inclure relations :
   - parent_role (adm_roles)
   - count members : COUNT adm_member_roles WHERE role_id
5. Trier par created_at DESC
6. Paginer (limit, offset)
7. Retourner { roles, total }

**Méthode findById(id: string, tenantId: string) → Promise<Role>**

1. Chercher role par ID
2. Vérifier tenant_id = tenantId OU is_system = true
3. SI non trouvé → throw NotFoundError
4. Inclure relations :
   - parent_role
   - role_permissions (adm_role_permissions)
   - member_roles avec count
   - versions récentes (limit 10)
5. Retourner role complet

**Fichier à créer : `lib/repositories/admin/role.repository.ts`**

Repository pour encapsuler accès Prisma à adm_roles.

**Classe RoleRepository extends BaseRepository**

**Méthode findBySlug(slug: string, tenantId: string) → Promise<Role | null>**

Recherche un rôle par slug dans un tenant (unicité par tenant).

**Méthode findSystemRoles() → Promise<Role[]>**

Retourne tous les rôles système (is_system = true).

**Méthode countMembersWithRole(roleId: string) → Promise<number>**

Compte combien de membres ont ce rôle assigné.

#### API REST (Endpoints)

**Fichier à créer : `app/api/v1/admin/roles/route.ts`**

**GET /api/v1/admin/roles**

Liste tous les rôles du tenant.

- **Query params** :
  - status : string[] (active, inactive, archived)
  - is_system : boolean (inclure rôles système)
  - search : string
  - limit : number (défaut 20)
  - offset : number

- **Permissions** : roles.read

- **Réponse 200** :

```json
{
  "roles": [
    {
      "id": "uuid",
      "name": "Fleet Coordinator Zone Nord",
      "slug": "fleet-coordinator-north",
      "description": "Coordinateur zone Nord",
      "is_system": false,
      "is_default": false,
      "status": "active",
      "members_count": 3,
      "max_members": 5,
      "parent_role": {
        "id": "uuid-parent",
        "name": "Fleet Coordinator"
      },
      "created_at": "2025-11-08T10:00:00Z"
    }
  ],
  "total": 12
}
```

**POST /api/v1/admin/roles**

Créer un nouveau rôle.

- **Body** :

```json
{
  "name": "Fleet Coordinator Zone Nord",
  "description": "Coordinateur flotte zone Nord (Dubai/Sharjah)",
  "parent_role_id": "uuid-parent",
  "max_members": 5,
  "approval_required": false
}
```

- **Permissions** : roles.create

- **Réponse 201** : Role créé

**Fichier à créer : `app/api/v1/admin/roles/[id]/route.ts`**

**GET /api/v1/admin/roles/[id]**

Détails complets d'un rôle.

- **Permissions** : roles.read

- **Réponse 200** :

```json
{
  "id": "uuid",
  "name": "Fleet Coordinator Zone Nord",
  "slug": "fleet-coordinator-north",
  "description": "...",
  "parent_role": {
    "id": "uuid-parent",
    "name": "Fleet Coordinator"
  },
  "is_system": false,
  "is_default": false,
  "max_members": 5,
  "status": "active",
  "permissions": [
    {
      "resource": "vehicles",
      "action": "read",
      "conditions": {"scope_type":"branch","scope_value":"nord"}
    },
    ...
  ],
  "members": [
    {
      "id": "uuid-member",
      "email": "karim@abc.ae",
      "name": "Karim Al-Rashid",
      "assigned_at": "2025-11-08T12:00:00Z"
    }
  ],
  "members_count": 3,
  "versions": [
    {
      "version_number": 2,
      "changed_by": "Sarah Ahmed",
      "change_reason": "Added trips.read permission",
      "created_at": "2025-11-09T10:00:00Z"
    }
  ]
}
```

**PATCH /api/v1/admin/roles/[id]**

Mettre à jour un rôle.

- **Body** :

```json
{
  "name": "Fleet Coordinator Zone Nord",
  "description": "Description mise à jour",
  "max_members": 10
}
```

- **Permissions** : roles.update

- **Réponse 200** : Role mis à jour

**DELETE /api/v1/admin/roles/[id]**

Archiver un rôle (soft delete).

- **Body** :

```json
{
  "reason": "Rôle remplacé par nouveau rôle Zone Manager"
}
```

- **Permissions** : roles.delete

- **Réponse 200** :

```json
{
  "success": true,
  "role_id": "uuid",
  "status": "archived",
  "members_revoked": 3
}
```

**Fichier à créer : `app/api/v1/admin/roles/[id]/permissions/route.ts`**

**GET /api/v1/admin/roles/[id]/permissions**

Liste toutes les permissions du rôle (avec héritage résolu).

- **Permissions** : roles.read

- **Réponse 200** :

```json
{
  "role_id": "uuid",
  "role_name": "Fleet Coordinator Zone Nord",
  "permissions": [
    {
      "resource": "vehicles",
      "action": "read",
      "conditions": { "scope_type": "branch", "scope_value": "nord" },
      "inherited_from": "Fleet Coordinator"
    },
    {
      "resource": "trips",
      "action": "read",
      "conditions": { "scope_type": "branch", "scope_value": "nord" },
      "inherited_from": null
    }
  ],
  "total": 15
}
```

#### Frontend (Interface Utilisateur)

**Page à créer : `app/[locale]/admin/roles/page.tsx`**

Page principale de gestion des rôles.

**Layout :**

```
┌─────────────────────────────────────────────────────────┐
│ HEADER                                                  │
│ [FleetCore Logo] Admin > Roles          [+ Create Role]│
└─────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────┐
│ STATS                                                   │
│ Total: 12 roles | Active: 10 | System: 4 | Custom: 6   │
└─────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────┐
│ FILTRES                                                 │
│ [Status ▼] [System/Custom ▼] [🔍 Search...]            │
└─────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────┐
│ TABLE ROLES                                             │
│ Name                      Members  Type    Status       │
│ ──────────────────────────────────────────────────────  │
│ 🔒 Admin                  2        System  Active       │
│ 🔒 Manager                5        System  Active       │
│ 🔒 Operator               15       System  Active       │
│ 🔒 Driver                 80       System  Active       │
│ 📋 Fleet Coordinator Nord 3/5      Custom  Active       │
│ 📋 Fleet Coordinator Sud  2/5      Custom  Active       │
└─────────────────────────────────────────────────────────┘
```

**Composant à créer : `components/admin/RoleTable.tsx`**

Table affichant les rôles avec :

- Icône (🔒 système, 📋 custom)
- Name
- Description (tronquée)
- Members count / Max members
- Type badge (System, Custom)
- Status badge (Active, Inactive, Archived)
- Actions dropdown (Edit, Archive, Duplicate, View permissions)

**Composant à créer : `components/admin/CreateRoleModal.tsx`**

Modal formulaire pour créer un nouveau rôle.

**Champs du formulaire :**

- Name (requis)
- Slug (auto-généré, modifiable)
- Description (textarea, optionnel)
- Parent role (dropdown, optionnel)
- Max members (number, optionnel)
- Approval required (checkbox)
- Valid from (date picker, optionnel)
- Valid until (date picker, optionnel)

**Validation :**

- Name min 3, max 100 caractères
- Slug format kebab-case
- Valid_until > Valid_from

**Soumission :**

- POST /api/v1/admin/roles
- Si succès : toast "Role created", ferme modal, redirige vers /admin/roles/[id]
- Si erreur : affiche message

**Page à créer : `app/[locale]/admin/roles/[id]/page.tsx`**

Page détail d'un rôle.

**Sections :**

1. **Informations générales** :
   - Name (éditable inline)
   - Slug (read-only)
   - Description (éditable inline)
   - Parent role (dropdown)
   - Status badge
   - Members count / Max members

2. **Permissions** :
   - Tableau groupé par ressource (Vehicles, Drivers, Trips, Finance, Admin)
   - Chaque ressource affiche actions disponibles avec checkboxes :
     ```
     Vehicles
     ✅ Read   ✅ Create   ✅ Update   ❌ Delete   ✅ Export
     Scope: Branch (zone = nord)
     ```
   - Bouton "Edit Permissions"

3. **Members with this role** :
   - Liste des membres ayant ce rôle
   - Avatar + name + email
   - Date assigned
   - Bouton "Revoke"

4. **Version history** :
   - Liste des 10 dernières versions
   - Version number, changed by, change reason, date
   - Bouton "View all versions"

5. **Actions** :
   - Bouton "Archive Role" (si custom role)
   - Bouton "Duplicate Role"
   - Bouton "Export Permissions" (JSON)

**Composant à créer : `components/admin/PermissionsMatrix.tsx`**

Matrice interactive pour gérer les permissions.

**Layout :**

```
┌─────────────────────────────────────────────────────────┐
│ PERMISSIONS MATRIX                                      │
│                                                         │
│ Vehicles                                                │
│ ┌───────┬────────┬────────┬────────┬────────┬────────┐ │
│ │       │ Read   │ Create │ Update │ Delete │ Export │ │
│ ├───────┼────────┼────────┼────────┼────────┼────────┤ │
│ │ Grant │   ✅   │   ✅   │   ✅   │   ❌   │   ✅   │ │
│ └───────┴────────┴────────┴────────┴────────┴────────┘ │
│ Scope: [Branch ▼] [zone = nord        ]                │
│                                                         │
│ Drivers                                                 │
│ ┌───────┬────────┬────────┬────────┬────────┬────────┐ │
│ │       │ Read   │ Create │ Update │ Delete │ Export │ │
│ ├───────┼────────┼────────┼────────┼────────┼────────┤ │
│ │ Grant │   ✅   │   ❌   │   ✅   │   ❌   │   ✅   │ │
│ └───────┴────────┴────────┴────────┴────────┴────────┘ │
│ Scope: [Branch ▼] [zone = nord        ]                │
└─────────────────────────────────────────────────────────┘
```

**Fonctionnalités :**

- Toggle checkboxes pour grant/revoke permissions
- Dropdown scope type (Global, Branch, Team, Self)
- Input scope value (selon type)
- Preview permissions héritées (lecture seule, grisées)
- Bouton "Save Permissions"

### 🎬 RÉSULTAT DÉMONTRABLE

**Scénario démo complet :**

**1. Création rôle personnalisé**

- Sarah va sur /admin/roles
- Clique "+ Create Role"
- Modal s'ouvre
- Remplit :
  - Name : "Fleet Coordinator Zone Nord"
  - Description : "Coordinateur zone Nord (Dubai/Sharjah)"
  - Parent role : "Fleet Coordinator" (dropdown)
  - Max members : 5
- Clique "Create Role"
- Toast "Role created successfully"
- Redirige vers /admin/roles/[id]

**2. Configuration permissions**

- Page détail rôle s'affiche
- Section "Permissions" affiche matrice
- Sarah clique "Edit Permissions"
- Matrice devient éditable
- Sarah configure :
  - Vehicles : Read ✅, Create ✅, Update ✅, Delete ❌
  - Scope : Branch (zone = nord)
  - Drivers : Read ✅, Create ❌, Update ✅
  - Scope : Branch (zone = nord)
  - Trips : Read ✅, Update ✅
  - Finance : tout désactivé ❌
- Clique "Save Permissions"
- Toast "Permissions updated"
- Système crée lignes dans adm_role_permissions

**3. Assignation rôle à membre**

- Sarah va sur /admin/team
- Clique row Karim
- Page détail membre s'ouvre
- Onglet "Roles"
- Clique "+ Assign Role"
- Dropdown affiche rôles disponibles
- Sélectionne "Fleet Coordinator Zone Nord"
- Scope auto-détecté : Branch (nord)
- Clique "Assign"
- Toast "Role assigned to Karim"
- Badge "Fleet Coordinator Zone Nord" apparaît

**4. Test permissions en action**

- Karim se connecte
- Dashboard affiche :
  - Fleet : 40 vehicles (zone Nord uniquement)
  - Bouton "Add Vehicle" visible ✅
  - Bouton "Delete Vehicle" invisible ❌
- Karim clique "Add Vehicle"
- Formulaire s'ouvre, champ "zone" pré-rempli : "nord"
- Karim tente de changer zone à "sud"
- Validation frontend : "You can only manage vehicles in zone nord"
- Karim crée véhicule zone Nord → succès ✅
- Sidebar :
  - Finance tab invisible ❌ (pas de permission)
- Si Karim tente API directe GET /vehicles?zone=sud :
  - Middleware RBAC intercepte
  - Vérifie permissions : scope = nord
  - Resource demandée : zone = sud
  - REJECT 403 Forbidden
  - Audit log créé

**5. Héritage permissions**

- Sarah crée nouveau rôle :
  - Name : "Senior Fleet Coordinator Nord"
  - Parent : "Fleet Coordinator Zone Nord"
- Permissions héritées automatiquement :
  - Vehicles.read (scope: nord) ← hérité
  - Drivers.read (scope: nord) ← hérité
- Sarah ajoute permissions supplémentaires :
  - Vehicles.delete (scope: nord) ← nouveau
  - Finance.revenues.read (scope: nord) ← nouveau
- Permissions finales = parent + nouvelles
- Sarah assigne à Ahmed
- Ahmed a maintenant accès Finance (pas Karim)

**6. Archive rôle**

- Sarah décide de restructurer
- Va sur /admin/roles
- Clique row "Fleet Coordinator Zone Nord"
- Clique "Archive Role"
- Modal confirmation :
  - "This role is assigned to 3 members. They will lose access."
  - Raison : "Replaced by Zone Manager role"
- Confirme
- Système :
  - Révoque tous membres (3)
  - Archive rôle
  - Envoie notifications aux 3 membres
  - Crée audit logs
- Badge status change : Active → Archived

**Critères d'acceptation :**

- ✅ Rôle créé avec name, description, parent
- ✅ Slug auto-généré format kebab-case, unique par tenant
- ✅ Permissions configurables par ressource/action
- ✅ Scope applicable (Global, Branch, Team, Self)
- ✅ Héritage permissions fonctionne (récursif)
- ✅ Max members respecté (assignation bloquée si atteint)
- ✅ Rôles système non modifiables (is_system = true)
- ✅ Assignation rôle à membre fonctionne
- ✅ Middleware RBAC vérifie permissions sur chaque requête
- ✅ 403 Forbidden si permission manquante
- ✅ Audit trail complet (création, modification, archive)
- ✅ Archive rôle révoque tous membres
- ✅ Page roles affiche liste avec filtres
- ✅ Page détail rôle affiche permissions + membres + versions
- ✅ Matrice permissions intuitive et éditable

### ⏱️ ESTIMATION

- **Temps backend** : **8 heures**
  - RoleService : 5h
  - RoleRepository : 1h
  - Algorithme héritage permissions : 2h

- **Temps API** : **4 heures**
  - GET/POST/PATCH/DELETE /roles : 2h
  - GET /roles/[id]/permissions : 1h
  - Middleware RBAC integration : 1h

- **Temps frontend** : **10 heures**
  - Page /admin/roles (table + filtres) : 3h
  - Page /admin/roles/[id] (détail) : 3h
  - CreateRoleModal : 2h
  - PermissionsMatrix : 2h

- **Temps tests** : **2 heures**
  - Tests unitaires RoleService : 1h
  - Tests héritage permissions : 1h

- **TOTAL : 24 heures (1.5 jours)**

### 🔗 DÉPENDANCES

**Prérequis obligatoires :**

- Étape 1.2 terminée (Member Management)
- Table adm_roles existante
- Table adm_role_permissions existante (à créer dans 2.2)
- Table adm_role_versions existante (à créer dans 2.3)

**Services/composants requis :**

- BaseService
- MemberService (pour vérifier membres)
- AuditService (logging)

**Données de test :**

- 4 rôles système (Admin, Manager, Operator, Driver)
- 1 tenant avec membres
- Permissions de base définies

### ✅ CHECKLIST DE VALIDATION

**Backend :**

- [ ] RoleService compile, toutes méthodes implémentées
- [ ] RoleRepository compile
- [ ] Algorithme héritage permissions (récursif) fonctionne
- [ ] checkPermission() évalue correctement les scopes
- [ ] Rôles système non modifiables (is_system = true)
- [ ] Max members respecté

**API :**

- [ ] GET /api/v1/admin/roles retourne liste avec filtres
- [ ] POST /api/v1/admin/roles crée rôle
- [ ] PATCH /api/v1/admin/roles/[id] met à jour rôle
- [ ] DELETE /api/v1/admin/roles/[id] archive rôle + révoque membres
- [ ] GET /api/v1/admin/roles/[id]/permissions retourne permissions avec héritage

**Frontend :**

- [ ] Page /admin/roles affiche table rôles
- [ ] Filtres fonctionnent (status, type, search)
- [ ] CreateRoleModal crée rôle avec validation
- [ ] Page /admin/roles/[id] affiche détails complets
- [ ] PermissionsMatrix éditable et intuitive
- [ ] Archive rôle affiche confirmation avec count membres

**Tests :**

- [ ] Test héritage permissions (parent → enfant)
- [ ] Test circularité interdite (A → B → A)
- [ ] Test max members bloquant
- [ ] Test checkPermission avec scopes

**Démo :**

- [ ] Sponsor peut créer rôle personnalisé
- [ ] Permissions configurables par ressource
- [ ] Héritage fonctionne visuellement
- [ ] Assignation rôle à membre OK
- [ ] Middleware RBAC bloque accès non autorisé (403)

---

## ÉTAPE 2.2 : Role Permissions - Granularité Fine

### 🎯 RATIONNEL MÉTIER

**POURQUOI :** La table adm_role_permissions stocke les permissions GRANULAIRES : resource (ex: vehicles), action (ex: read), et conditions (ex: scope = zone nord). C'est le niveau de détail qui permet de dire "Karim peut LIRE les véhicules de la zone NORD, mais pas les SUPPRIMER ni accéder à ceux de la zone SUD". Sans cette granularité, on ne peut qu'avoir des rôles "tout ou rien" : soit admin complet, soit aucun accès. Aucun middle ground.

**QUEL PROBLÈME :** Actuellement, les permissions sont stockées en JSONB libre dans adm_roles. Problème : impossible de requêter efficacement, impossible de voir qui a accès à quoi, impossible d'auditer les changements de permissions. De plus, les conditions (scopes) sont mélangées avec les permissions, rendant le code illisible et non maintenable.

**IMPACT SI ABSENT :**

- **Sécurité** : Over-privilege systématique (tout le monde admin par facilité)
- **Audit** : Impossible de répondre à "Qui peut supprimer des véhicules ?"
- **Flexibilité** : Impossible de créer permissions fines adaptées à l'organisation
- **Performance** : Requêtes lentes sur JSONB au lieu d'index SQL
- **Conformité** : Non-conformité SOC2 (ségrégation des tâches impossible)

**CAS D'USAGE CONCRET :**

ABC Logistics veut créer un rôle "Finance Auditor" avec permissions TRÈS limitées :

- ✅ Peut LIRE revenus (revenues.read)
- ✅ Peut LIRE factures (billing.invoices.read)
- ✅ Peut EXPORTER rapports (finance.reports.export)
- ❌ NE PEUT PAS modifier revenus
- ❌ NE PEUT PAS voir salaires chauffeurs (finance.payroll.\*)
- ❌ NE PEUT PAS accéder données opérationnelles (vehicles, drivers, trips)

**Workflow complet définition permissions granulaires :**

1. **Sarah crée rôle "Finance Auditor"** (comme dans 2.1)

2. **Sarah définit permissions dans PermissionsMatrix** :

   **Section Finance :**
   - ✅ revenues.read (scope: all)
   - ✅ revenues.export (scope: all)
   - ❌ revenues.create
   - ❌ revenues.update
   - ❌ revenues.delete

   **Section Billing :**
   - ✅ billing.invoices.read (scope: all)
   - ✅ billing.invoices.export (scope: all)
   - ❌ billing.invoices.create
   - ❌ billing.invoices.send

   **Section Payroll :**
   - ❌ finance.payroll.\* (TOUT désactivé)

   **Section Vehicles/Drivers/Trips :**
   - ❌ TOUT désactivé

3. **Sarah sauvegarde permissions** :
   - Système crée lignes dans adm_role_permissions :

   ```sql
   INSERT INTO adm_role_permissions VALUES
   ('uuid-1', 'role-finance-auditor', 'revenues', 'read', '{"scope_type":"all"}'),
   ('uuid-2', 'role-finance-auditor', 'revenues', 'export', '{"scope_type":"all"}'),
   ('uuid-3', 'role-finance-auditor', 'billing.invoices', 'read', '{"scope_type":"all"}'),
   ('uuid-4', 'role-finance-auditor', 'billing.invoices', 'export', '{"scope_type":"all"}');
   ```

4. **Sarah assigne rôle à Fatima (Comptable externe)** :
   - Fatima se connecte
   - Dashboard affiche :
     - Finance > Revenues ✅ (read only)
     - Finance > Invoices ✅ (read only)
     - Finance > Payroll ❌ (invisible)
     - Fleet Management ❌ (invisible)
5. **Fatima tente d'accéder page Payroll** (URL directe) :
   - Middleware RBAC intercepte
   - Requête : GET /api/v1/finance/payroll
   - Vérifie permissions Fatima :
     - resource = 'finance.payroll'
     - action = 'read'
     - Aucune permission trouvée
   - REJECT 403 Forbidden
   - Message : "You don't have permission to access payroll data"
   - Audit log créé (severity = 'warning')

6. **Fatima exporte rapport revenues** :
   - Clique "Export to Excel" dans page Revenues
   - Requête : POST /api/v1/finance/revenues/export
   - Middleware vérifie :
     - resource = 'revenues'
     - action = 'export'
     - Permission EXISTS ✅
   - Export généré et téléchargé
   - Audit log créé (action = 'export')

**Valeur business :**

- **Sécurité** : Principe moindre privilège appliqué (Finance Auditor accès limité)
- **Conformité** : Ségrégation des tâches (comptable externe ne voit pas payroll)
- **Audit** : Traçabilité granulaire de QUI peut faire QUOI
- **Performance** : Requêtes SQL rapides vs JSONB queries

### 📊 DONNÉES ET RÈGLES MÉTIER

**Table : `adm_role_permissions`**

**Colonnes (7 colonnes) :**

| Colonne        | Type         | Obligatoire | Utilité Business                                        |
| -------------- | ------------ | ----------- | ------------------------------------------------------- |
| **id**         | uuid         | OUI         | Identifiant unique permission (PK)                      |
| **role_id**    | uuid         | OUI         | Rôle propriétaire (FK → adm_roles)                      |
| **resource**   | varchar(100) | OUI         | Ressource cible (ex: vehicles, revenues)                |
| **action**     | varchar(50)  | OUI         | Action autorisée (read, create, update, delete, export) |
| **conditions** | jsonb        | NON         | Conditions d'application (scope, contraintes)           |
| **created_at** | timestamp    | OUI         | Date création                                           |
| **created_by** | uuid         | NON         | Qui a créé (FK → adm_members)                           |

**Resources disponibles (hiérarchiques) :**

```
MODULES OPÉRATIONNELS :
- vehicles : Gestion véhicules
  * vehicles.read, vehicles.create, vehicles.update, vehicles.delete, vehicles.export
- drivers : Gestion chauffeurs
  * drivers.read, drivers.create, drivers.update, drivers.delete, drivers.export
- trips : Gestion trajets
  * trips.read, trips.create, trips.update, trips.delete, trips.export, trips.approve

MODULES FINANCIERS :
- revenues : Revenus
  * revenues.read, revenues.create, revenues.update, revenues.delete, revenues.export
- expenses : Dépenses
  * expenses.read, expenses.create, expenses.update, expenses.delete, expenses.approve
- billing : Facturation
  * billing.invoices.read, billing.invoices.create, billing.invoices.send, billing.invoices.export
- finance.payroll : Salaires chauffeurs (SENSIBLE)
  * finance.payroll.read, finance.payroll.approve, finance.payroll.export

MODULES ADMINISTRATION :
- members : Gestion membres
  * members.read, members.invite, members.update, members.suspend, members.delete
- roles : Gestion rôles
  * roles.read, roles.create, roles.update, roles.delete
- settings : Configuration tenant
  * settings.read, settings.update
- audit : Logs d'audit
  * audit.read, audit.export
```

**Actions standards (CRUD + spécifiques) :**

```
ACTIONS DE BASE (CRUD) :
- read : Lire/consulter
- create : Créer nouveau
- update : Modifier existant
- delete : Supprimer (soft delete)

ACTIONS SPÉCIFIQUES :
- export : Exporter données (Excel, PDF, CSV)
- approve : Approuver (trips, expenses, payroll)
- send : Envoyer (invoices, notifications)
- invite : Inviter (members)
- suspend : Suspendre (members, drivers)
- impersonate : Se connecter comme un autre user (SUPER_ADMIN only)
```

**Conditions (Scopes et contraintes) :**

```typescript
interface PermissionConditions {
  // Scope isolation
  scope_type?: "all" | "branch" | "team" | "self";
  scope_value?: string; // Ex: 'nord', 'team-123', null si 'all' ou 'self'

  // Contraintes business
  max_amount?: number; // Ex: expenses.approve max 1000€
  require_approval?: boolean; // Action nécessite approbation manager
  time_window?: { start: string; end: string }; // Accès limité à certaines heures
  ip_whitelist?: string[]; // Accès uniquement depuis IPs autorisées

  // Conditions personnalisées
  custom?: Record<string, any>;
}
```

**Exemples de permissions avec conditions :**

```json
// Permission 1: Lire véhicules zone Nord uniquement
{
  "resource": "vehicles",
  "action": "read",
  "conditions": {
    "scope_type": "branch",
    "scope_value": "nord"
  }
}

// Permission 2: Approuver dépenses jusqu'à 1000€
{
  "resource": "expenses",
  "action": "approve",
  "conditions": {
    "scope_type": "all",
    "max_amount": 1000
  }
}

// Permission 3: Voir uniquement SES propres trajets (chauffeur)
{
  "resource": "trips",
  "action": "read",
  "conditions": {
    "scope_type": "self"
  }
}

// Permission 4: Exporter factures (accès limité heures bureau)
{
  "resource": "billing.invoices",
  "action": "export",
  "conditions": {
    "scope_type": "all",
    "time_window": {
      "start": "08:00",
      "end": "18:00"
    }
  }
}

// Permission 5: Gérer membres (nécessite approbation pour suspension)
{
  "resource": "members",
  "action": "suspend",
  "conditions": {
    "scope_type": "all",
    "require_approval": true
  }
}
```

**Règles de validation (PermissionCreateSchema Zod) :**

```typescript
export const PermissionCreateSchema = z
  .object({
    role_id: z.string().uuid("Role ID invalide"),
    resource: z
      .string()
      .min(3)
      .max(100)
      .regex(/^[a-z0-9\.]+$/, "Resource format invalide (lowercase, dots)"),
    action: z.enum(
      [
        "read",
        "create",
        "update",
        "delete",
        "export",
        "approve",
        "send",
        "invite",
        "suspend",
        "impersonate",
      ],
      {
        errorMap: () => ({ message: "Action invalide" }),
      }
    ),
    conditions: z
      .object({
        scope_type: z.enum(["all", "branch", "team", "self"]).optional(),
        scope_value: z.string().max(100).optional(),
        max_amount: z.number().positive().optional(),
        require_approval: z.boolean().optional(),
        time_window: z
          .object({
            start: z.string().regex(/^\d{2}:\d{2}$/),
            end: z.string().regex(/^\d{2}:\d{2}$/),
          })
          .optional(),
        ip_whitelist: z.array(z.string().ip()).optional(),
        custom: z.record(z.any()).optional(),
      })
      .optional(),
  })
  .refine(
    (data) => {
      // Si scope_type = branch/team, scope_value obligatoire
      if (["branch", "team"].includes(data.conditions?.scope_type)) {
        return !!data.conditions?.scope_value;
      }
      return true;
    },
    {
      message: "scope_value obligatoire pour scope_type branch/team",
    }
  )
  .refine(
    (data) => {
      // time_window.end > time_window.start
      if (data.conditions?.time_window) {
        const start = data.conditions.time_window.start;
        const end = data.conditions.time_window.end;
        return end > start;
      }
      return true;
    },
    {
      message: "time_window.end doit être après time_window.start",
    }
  );
```

**Règles de cohérence :**

- **Unicité** : (role_id, resource, action) unique (pas de doublon permission)
- **Resource hierarchical** : Si `finance.payroll.read` granted, alors `finance.payroll` aussi granted (implicite)
- **Action dependencies** : `update` implique `read`, `delete` implique `read`
- **Scope inheritance** : Permissions parent héritées SAUF si surchargées dans enfant

### 🏗️ COMPOSANTS À DÉVELOPPER

#### Backend (Service Layer)

**Fichier à créer : `lib/services/admin/permission.service.ts`**

Service pour gérer les permissions granulaires.

**Classe PermissionService extends BaseService**

**Méthode addPermission(roleId: string, permission: PermissionCreateInput) → Promise<Permission>**

1. Valider permission avec PermissionCreateSchema
2. Vérifier que role existe et appartient au tenant
3. Vérifier unicité (role_id, resource, action)
4. SI action = 'update' ou 'delete' :
   - Vérifier que 'read' existe déjà (dependency)
   - SINON ajouter 'read' automatiquement
5. Créer permission dans adm_role_permissions via permissionRepository.create()
6. Créer nouvelle version rôle dans adm_role_versions (snapshot complet permissions)
7. Créer audit log "permission_added"
8. Retourner permission créée

**Méthode removePermission(permissionId: string) → Promise<void>**

1. Récupérer permission par ID
2. Vérifier que role associé n'est pas is_system = true
3. Supprimer permission (hard delete car table liaison)
4. Créer nouvelle version rôle (snapshot sans cette permission)
5. Créer audit log "permission_removed"

**Méthode updatePermission(permissionId: string, data: PermissionUpdateInput) → Promise<Permission>**

1. Récupérer permission par ID
2. Valider data (conditions modifiables uniquement)
3. Mettre à jour conditions dans DB
4. Créer nouvelle version rôle
5. Créer audit log "permission_updated"
6. Retourner permission mise à jour

**Méthode bulkAddPermissions(roleId: string, permissions: PermissionCreateInput[]) → Promise<Permission[]>**

Ajouter plusieurs permissions en une transaction (utilisé par UI PermissionsMatrix).

1. Valider toutes permissions
2. Transaction Prisma :
   - Créer toutes permissions
   - Créer version rôle avec snapshot complet
   - Créer audit log
3. Retourner permissions créées

**Méthode getPermissionsForRole(roleId: string, includeInherited: boolean = true) → Promise<Permission[]>**

1. Récupérer permissions directes depuis adm_role_permissions WHERE role_id
2. SI includeInherited = true :
   - Récupérer role depuis adm_roles
   - SI parent_role_id NON NULL :
     - permissions_parent = getPermissionsForRole(parent_role_id, true) [RÉCURSIF]
     - MERGE permissions_parent avec permissions_directes
   - Retourner permissions complètes
3. SINON :
   - Retourner permissions directes uniquement

**Méthode evaluateConditions(permission: Permission, context: EvaluationContext) → boolean**

Évalue si les conditions d'une permission sont respectées pour un contexte donné.

```typescript
interface EvaluationContext {
  member_id: string;
  resource_id?: string; // ID de la ressource accédée
  resource_data?: any; // Données complètes ressource
  request_ip?: string;
  request_time?: Date;
  action_data?: any; // Données spécifiques à l'action (ex: amount pour approve)
}
```

1. SI pas de conditions → RETOURNER true (permission sans restriction)
2. Évaluer scope_type :
   - SI 'all' → true
   - SI 'self' → vérifier resource_data.owner_id = member_id OU resource_data.driver_id = member_id
   - SI 'branch' → vérifier resource_data.metadata.branch = permission.conditions.scope_value
   - SI 'team' → vérifier resource_data.team_id = permission.conditions.scope_value
3. Évaluer max_amount (si applicable) :
   - SI action_data.amount > conditions.max_amount → false
4. Évaluer time_window (si applicable) :
   - SI request_time NOT IN [start, end] → false
5. Évaluer ip_whitelist (si applicable) :
   - SI request_ip NOT IN ip_whitelist → false
6. SI TOUTES conditions respectées → RETOURNER true
7. SINON → RETOURNER false

**Fichier à créer : `lib/repositories/admin/permission.repository.ts`**

Repository pour accès adm_role_permissions.

**Classe PermissionRepository extends BaseRepository**

**Méthode findByRole(roleId: string) → Promise<Permission[]>**

Récupère toutes les permissions d'un rôle.

**Méthode findByResource(resource: string, tenantId: string) → Promise<Permission[]>**

Récupère toutes les permissions sur une ressource (tous rôles confondus).

**Méthode exists(roleId: string, resource: string, action: string) → Promise<boolean>**

Vérifie si une permission existe déjà (évite doublons).

#### API REST (Endpoints)

**Fichier à créer : `app/api/v1/admin/roles/[id]/permissions/route.ts`**

**POST /api/v1/admin/roles/[id]/permissions**

Ajouter une permission à un rôle.

- **Body** :

```json
{
  "resource": "vehicles",
  "action": "read",
  "conditions": {
    "scope_type": "branch",
    "scope_value": "nord"
  }
}
```

- **Permissions** : roles.update

- **Réponse 201** : Permission créée

**Fichier à créer : `app/api/v1/admin/roles/[id]/permissions/bulk/route.ts`**

**POST /api/v1/admin/roles/[id]/permissions/bulk**

Ajouter plusieurs permissions en une fois (utilisé par PermissionsMatrix).

- **Body** :

```json
{
  "permissions": [
    {
      "resource": "vehicles",
      "action": "read",
      "conditions": { "scope_type": "branch", "scope_value": "nord" }
    },
    {
      "resource": "vehicles",
      "action": "create",
      "conditions": { "scope_type": "branch", "scope_value": "nord" }
    },
    {
      "resource": "drivers",
      "action": "read",
      "conditions": { "scope_type": "branch", "scope_value": "nord" }
    }
  ]
}
```

- **Permissions** : roles.update

- **Réponse 201** :

```json
{
  "success": true,
  "permissions_created": 3,
  "permissions": [...]
}
```

**Fichier à créer : `app/api/v1/admin/permissions/[id]/route.ts`**

**PATCH /api/v1/admin/permissions/[id]**

Modifier conditions d'une permission.

- **Body** :

```json
{
  "conditions": {
    "scope_type": "all",
    "max_amount": 5000
  }
}
```

- **Permissions** : roles.update

- **Réponse 200** : Permission mise à jour

**DELETE /api/v1/admin/permissions/[id]**

Supprimer une permission.

- **Permissions** : roles.update

- **Réponse 200** :

```json
{
  "success": true,
  "permission_id": "uuid",
  "deleted": true
}
```

#### Frontend (Interface Utilisateur)

**Composant déjà créé dans 2.1 : `components/admin/PermissionsMatrix.tsx`**

Améliorer le composant pour gérer les permissions granulaires.

**Features à ajouter :**

1. **Conditions editor** :
   - Dropdown "Scope Type" (All, Branch, Team, Self)
   - Input "Scope Value" (conditionnel selon type)
   - Toggle "Require Approval"
   - Input "Max Amount" (pour expenses.approve)
   - Time window picker (start/end)

2. **Permission dependencies** :
   - Si user coche "Update", auto-cocher "Read" (grisé)
   - Si user décoche "Read", auto-décocher "Update" et "Delete"

3. **Bulk save** :
   - Bouton "Save All Changes"
   - POST /api/v1/admin/roles/[id]/permissions/bulk
   - Toast "X permissions updated"

4. **Visual indicators** :
   - Permissions héritées (grisées, non éditables)
   - Permissions directes (éditables)
   - Badge "Inherited from Parent Role"

**Modal à créer : `components/admin/PermissionConditionsModal.tsx`**

Modal pour éditer conditions complexes d'une permission.

**Layout :**

```
┌─────────────────────────────────────────────────────────┐
│ Edit Permission Conditions                              │
│ vehicles.read                                           │
│                                                         │
│ Scope                                                   │
│ Type:  [Branch ▼]                                       │
│ Value: [nord____________]                               │
│                                                         │
│ Additional Conditions                                   │
│ [✅] Require manager approval                           │
│ [ ] Limit to specific time window                       │
│ [ ] Restrict to IP whitelist                            │
│                                                         │
│ [Cancel] [Save Conditions]                              │
└─────────────────────────────────────────────────────────┘
```

### 🎬 RÉSULTAT DÉMONTRABLE

**Scénario démo :**

**1. Configuration permissions granulaires**

- Sarah va sur /admin/roles/[fleet-coordinator-nord]
- Section "Permissions" affiche PermissionsMatrix
- Clique "Edit Permissions"
- Configure :
  - Vehicles : Read ✅, Create ✅, Update ✅, Delete ❌, Export ✅
  - Scope : Branch (nord)
  - Drivers : Read ✅, Update ✅
  - Finance : TOUT désactivé ❌
- Clique "Save All Changes"
- Système appelle POST /permissions/bulk
- 7 permissions créées dans adm_role_permissions
- Version rôle créée (v2)
- Toast "Permissions updated successfully"

**2. Test permission avec condition max_amount**

- Sarah crée rôle "Expense Approver"
- Ajoute permission :
  - Resource : expenses
  - Action : approve
  - Conditions : { max_amount: 1000 }
- Assigne à Karim
- Karim voit page Expenses avec bouton "Approve" (montants ≤ 1000€)
- Dépense 800€ → bouton "Approve" actif ✅
- Dépense 1500€ → bouton "Approve" grisé ❌
- Karim tente API directe POST /expenses/1500/approve :
  - Middleware évalue conditions
  - amount (1500) > max_amount (1000)
  - REJECT 403 "Amount exceeds your approval limit"
  - Audit log créé

**3. Test scope_type = self (chauffeur)**

- Driver role a permission :
  - Resource : trips
  - Action : read
  - Conditions : { scope_type: 'self' }
- Mohamed (chauffeur) se connecte
- Dashboard affiche SES trajets uniquement
- Mohamed tente GET /trips (tous les trajets) :
  - Middleware évalue scope
  - scope_type = 'self'
  - Filtre automatique : WHERE driver_id = mohamed_id
  - Retourne uniquement SES trajets (10)
- Mohamed tente GET /trips/[id-autre-chauffeur] :
  - Middleware évalue
  - trip.driver_id != mohamed_id
  - REJECT 403 "You can only view your own trips"

**4. Héritage avec surcharge**

- Role "Fleet Coordinator" (parent) a :
  - vehicles.read (scope: all)
- Role "Fleet Coordinator Nord" (enfant) surcharge :
  - vehicles.read (scope: branch=nord)
- PermissionsMatrix affiche :
  - vehicles.read : ✅ (Badge "Overridden from Parent")
  - Scope actuel : Branch (nord)
  - Scope parent : All (grisé, barré)
- Karim voit uniquement véhicules zone Nord

**Critères d'acceptation :**

- ✅ Permissions créées avec resource, action, conditions
- ✅ Conditions scope évaluées correctement (all, branch, team, self)
- ✅ Condition max_amount respectée (approve)
- ✅ Condition time_window respectée
- ✅ Dependencies actions (update → read auto-coché)
- ✅ Bulk save permissions (PermissionsMatrix)
- ✅ Permissions héritées visibles mais non éditables
- ✅ Surcharge permissions parent fonctionne
- ✅ Middleware évalue conditions avant autorisation
- ✅ 403 Forbidden si conditions non respectées
- ✅ Audit trail complet

### ⏱️ ESTIMATION

- **Backend** : 6h (PermissionService + evaluateConditions)
- **API** : 2h
- **Frontend** : 4h (améliorer PermissionsMatrix + ConditionsModal)
- **Tests** : 2h
- **TOTAL : 14 heures (1 jour)**

### ✅ CHECKLIST

- [ ] PermissionService compile
- [ ] evaluateConditions() gère tous scope_types
- [ ] Bulk add permissions fonctionne
- [ ] API POST /permissions/bulk crée plusieurs permissions
- [ ] PermissionsMatrix sauvegarde en bulk
- [ ] ConditionsModal édite conditions complexes
- [ ] Middleware évalue conditions avant autoriser
- [ ] Tests conditions (scope, max_amount, time_window)

---

## ÉTAPE 2.3 : Role Versions - Historique et Rollback

(Durée : 8h - 0.5 jour - À documenter)

## ÉTAPE 2.4 : Member Roles - Attribution Multi-Rôles

(Durée : 8h - 0.5 jour - À documenter)

---

# FIN DES CHAPITRES 1.2 & 2

**Livrable :** Plan d'exécution détaillé Module ADM - Members + RBAC Complet  
**Durée totale estimée :** Chapitre 1.2 (2 jours) + Chapitre 2 (4 jours) = **6 jours ouvrés**

---
