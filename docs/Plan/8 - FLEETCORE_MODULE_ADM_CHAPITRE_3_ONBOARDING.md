# FLEETCORE - MODULE ADM : CHAPITRE 3 - ONBOARDING

## Invitations, Sessions & Notifications

**Date:** 10 Novembre 2025  
**Version:** 1.0 DÉFINITIVE  
**Périmètre:** Module Administration - Chapitre 3 Onboarding  
**Tables couvertes:** 3 (adm_invitations, adm_member_sessions, adm_notification_logs)  
**Méthodologie:** Implémentation verticale par fonctionnalité démontrable

---

## 📋 TABLE DES MATIÈRES - CHAPITRE 3

1. [Introduction Chapitre 3](#introduction-chapitre-3)
2. [ÉTAPE 3.1 : Invitations Management](#étape-31--invitations-management)
3. [ÉTAPE 3.2 : Sessions Management](#étape-32--sessions-management)
4. [ÉTAPE 3.3 : Notification Logs](#étape-33--notification-logs)

---

## INTRODUCTION CHAPITRE 3

### Contexte et Objectifs

Le **Chapitre 3 - Onboarding** gère le cycle complet d'arrivée d'un nouveau membre dans un tenant : de l'invitation sécurisée jusqu'au tracking des sessions actives, en passant par la traçabilité complète des notifications envoyées.

**Enjeux business critiques :**

- **Sécurité onboarding** : Invitations avec tokens uniques, expiration 7 jours, impossible à réutiliser
- **Taux d'acceptation** : 40% → 80% via relances automatiques et UX optimisée
- **Conformité** : Traçabilité complète des communications (RGPD, audit)
- **Détection fraude** : Sessions avec IP/user-agent, détection tentatives suspectes
- **Support réactif** : "Je n'ai pas reçu l'email" → réponse immédiate avec logs

### Architecture Chapitre 3

Le Chapitre 3 est composé de **3 tables interdépendantes** :

**TABLE 1 : adm_invitations**

- Gestion invitations sécurisées avec tokens uniques
- Workflow complet : pending → accepted/expired/revoked
- Relances automatiques si non acceptée sous 48h
- Tracking complet (envoi, acceptation, IP)

**TABLE 2 : adm_member_sessions**

- Sessions actives par membre avec expiration
- Détection sessions suspectes (IP différente, user-agent anormal)
- Révocation en masse (logout all devices)
- Limite simultanée configurable (max 5 sessions/membre)

**TABLE 3 : adm_notification_logs**

- Historique COMPLET toutes notifications (email, SMS, Slack)
- Tracking délivrabilité (sent, opened, clicked, bounced)
- Retry automatique en cas d'échec
- Debug instantané ("Ai-je reçu l'invitation ?")

### Périmètre Chapitre 3

**Durée estimée :** 4 jours ouvrés (32 heures)

**Livrable fin Chapitre 3 :**

- Invitations sécurisées avec expiration et relances automatiques
- Sessions actives trackées avec détection anomalies
- Historique complet notifications consultable
- UI Admin pour gérer invitations et sessions
- Conformité RGPD complète (traçabilité communications)

---

# ÉTAPE 3.1 : INVITATIONS MANAGEMENT

**Durée :** 1.5 jours ouvrés (12 heures)  
**Objectif :** Implémenter système d'invitations sécurisé avec tokens uniques et workflow complet  
**Livrable démo :** Interface Admin pour inviter membres avec tracking statut et relances automatiques

---

## 🎯 RATIONNEL MÉTIER

**POURQUOI :** L'invitation est le seul moyen sécurisé de donner accès à un nouveau membre. Sans système structuré, risque énorme : comptes créés sans validation, emails usurpés, accès non autorisés. L'invitation garantit que seule la personne possédant l'email invité peut créer le compte.

**QUEL PROBLÈME :** Actuellement, aucun système d'invitations n'existe. Comment un admin tenant ajoute-t-il un nouveau membre ? Créer le compte directement en DB = dangereux (pas de validation email, password par défaut = faille sécurité). Envoyer email manuel = processus artisanal non tracé, taux d'acceptation catastrophique (20% car emails perdus/oubliés).

**IMPACT SI ABSENT :**

- **Sécurité** : Comptes créés sans validation email = usurpation identité possible
- **Fraude** : Impossible de prouver qu'une invitation a été envoyée (litige juridique)
- **Taux d'acceptation** : 20% au lieu de 80% (sans relances automatiques)
- **Support surchargé** : 200 tickets/mois "Je n'ai pas reçu l'invitation"
- **Conformité** : Non-conformité RGPD (pas de traçabilité consentement)

**CAS D'USAGE CONCRET :**

ABC Logistics (tenant actif) vient d'embaucher Sarah comme Fleet Manager. Ahmed (Admin tenant) doit lui donner accès à FleetCore.

**Workflow complet invitation :**

**Jour 0 - 10h00 : Création invitation**

1. Ahmed se connecte à FleetCore, va dans Team Management
2. Clique "Invite Member"
3. Formulaire s'affiche :
   - Email : sarah@abclogistics.ae
   - Role : Manager
   - Message personnalisé : "Bienvenue Sarah ! Tu géreras la flotte zone Nord (80 véhicules)."
4. Ahmed clique "Send Invitation"
5. Système génère :
   - Token unique : "inv_abc123def456" (UUID sécurisé)
   - Expires_at : aujourd'hui + 7 jours (17 nov 2025 23:59:59)
   - Status : pending
6. Invitation créée dans adm_invitations
7. Email envoyé à sarah@abclogistics.ae :

   ```
   Sujet : [FleetCore] Ahmed vous invite à rejoindre ABC Logistics

   Bonjour Sarah,

   Ahmed Al-Mansoori vous invite à rejoindre ABC Logistics sur FleetCore.

   Message d'Ahmed :
   "Bienvenue Sarah ! Tu géreras la flotte zone Nord (80 véhicules)."

   [Accepter l'invitation] (https://fleetcore.com/accept?token=inv_abc123def456)

   Cette invitation expire le 17 novembre 2025.
   Si vous n'acceptez pas cette invitation, ignorez cet email.
   ```

8. Log créé dans adm_notification_logs :
   - template_id : "invitation_sent"
   - recipient_email : sarah@abclogistics.ae
   - status : sent
   - sent_at : 10 nov 10:00:00

**Jour 0 - 10h30 : Sarah accepte (scénario optimal)** 9. Sarah clique sur le lien dans l'email 10. Page /accept?token=inv_abc123def456 s'affiche 11. Sarah voit : - "Ahmed vous invite à rejoindre ABC Logistics" - Rôle proposé : Manager - Formulaire : First name, Last name, Password 12. Sarah remplit et clique "Accept & Create Account" 13. Système appelle invitationService.acceptInvitation(token, clerkUserId) 14. Vérifications : - Token existe ? ✅ - Expires_at > now ? ✅ (expire 17 nov, on est 10 nov) - Status = pending ? ✅ - Email sarah@abclogistics.ae pas déjà membre ? ✅ 15. Système crée member dans adm_members : - tenant_id : ABC Logistics - clerk_user_id : user_sarah123 - email : sarah@abclogistics.ae - role : Manager (hérité invitation) - status : active - email_verified_at : now (Clerk a validé) 16. Système met à jour invitation : - status = accepted - accepted_at = now - accepted_by_member_id = sarah.id 17. Audit log créé : "invitation_accepted" 18. Email envoyé à Ahmed : "Sarah a accepté votre invitation" 19. Sarah redirigée vers /onboarding (setup MFA, préférences)

**Valeur business :**

- **Time to first login** : 3 jours → 30 minutes (acceptation immédiate)
- **Taux d'acceptation** : 20% → 80% (relances + UX)
- **Tickets support** : 200/mois → 20/mois (logs traçables)

**Jour 2 - 10h00 : Sarah n'a pas accepté (scénario relance)** 20. Cron job quotidien détecte invitations pending depuis >48h 21. Trouve invitation Sarah : sent_at = 10 nov 10h, now = 12 nov 10h = 48h 22. Système envoie email de relance :
```
Sujet : [Rappel] Votre invitation FleetCore expire bientôt

    Bonjour Sarah,

    Ahmed vous a invité à rejoindre ABC Logistics il y a 2 jours.
    Cette invitation expire dans 5 jours.

    [Accepter maintenant] (https://fleetcore.com/accept?token=inv_abc123def456)
    ```

23. Log notification créé : template_id = "invitation_reminder"
24. Invitation.metadata.reminder_sent_at = now

**Jour 7 - 23h59 : Expiration automatique** 25. Si Sarah n'accepte toujours pas, cron job expire l'invitation 26. Invitation.status = expired 27. Invitation.expired_at = now 28. Email envoyé à Ahmed : "Invitation Sarah expirée, voulez-vous renvoyer ?"

### 📊 DONNÉES ET RÈGLES MÉTIER

**Table principale : `adm_invitations`**

**Colonnes critiques (17 colonnes) :**

| Colonne                   | Type         | Obligatoire | Utilité Business                                      |
| ------------------------- | ------------ | ----------- | ----------------------------------------------------- |
| **id**                    | uuid         | OUI         | Identifiant unique invitation (PK)                    |
| **tenant_id**             | uuid         | OUI         | Tenant destinataire (FK → adm_tenants)                |
| **email**                 | citext       | OUI         | Email du futur membre (case-insensitive)              |
| **token**                 | varchar(255) | OUI         | Token unique sécurisé (UUID)                          |
| **role**                  | varchar(100) | OUI         | Rôle proposé (admin, manager, operator)               |
| **expires_at**            | timestamp    | OUI         | Date expiration (7 jours par défaut)                  |
| **status**                | text         | OUI         | État invitation (pending, accepted, expired, revoked) |
| **invited_by**            | uuid         | OUI         | Qui a invité (FK → adm_members)                       |
| **sent_at**               | timestamp    | NON         | Date premier envoi                                    |
| **sent_count**            | integer      | OUI         | Nombre renvois (max 3)                                |
| **last_sent_at**          | timestamp    | NON         | Dernier envoi                                         |
| **accepted_at**           | timestamp    | NON         | Date acceptation                                      |
| **accepted_by_member_id** | uuid         | NON         | Member créé (FK → adm_members)                        |
| **custom_message**        | text         | NON         | Message personnalisé inviteur                         |
| **metadata**              | jsonb        | NON         | Données additionnelles                                |
| **created_at**            | timestamp    | OUI         | Date création                                         |
| **updated_at**            | timestamp    | OUI         | Date modification                                     |

**Statuts possibles et transitions :**

```
ÉTAT : pending (en attente)
├─ CONDITIONS : Token valide, expires_at > now, email pas encore membre
├─ ACTIONS AUTORISÉES :
│  ├─ Accepter l'invitation → accepted
│  ├─ Révoquer (admin) → revoked
│  ├─ Renvoyer email (max 3×)
│  └─ Attendre expiration → expired
└─ TRANSITIONS :
   ├─ → accepted (membre créé avec succès)
   ├─ → expired (expires_at dépassé)
   └─ → revoked (admin annule)

ÉTAT : accepted (acceptée)
├─ CONDITIONS : Member créé, accepted_by_member_id renseigné
├─ ACCÈS : Lecture seule historique
└─ TRANSITIONS : Aucune (état final)

ÉTAT : expired (expirée)
├─ CONDITIONS : expires_at < now, status toujours pending
├─ ACCÈS : Lecture seule
└─ TRANSITIONS :
   └─ → pending (admin renvoie nouvelle invitation)

ÉTAT : revoked (révoquée)
├─ CONDITIONS : Admin a explicitement annulé
├─ RAISON : Email erroné, personne a quitté avant onboarding
└─ TRANSITIONS : Aucune (état final)
```

**Règles de génération token :**

```
ALGORITHME generateInvitationToken :
  ENTRÉE : tenant_id, email

  1. Générer UUID v4 : base_uuid
  2. Préfixer : token = "inv_" + base_uuid
  3. Vérifier unicité dans adm_invitations.token
  4. SI existe déjà (collision rare) :
     ALORS régénérer récursivement
  5. Valider format : /^inv_[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/

  Exemple : "inv_a1b2c3d4-e5f6-4789-a012-345678901234"

  SORTIE : token unique
```

**Règles d'expiration :**

```
ALGORITHME calculateExpirationDate :
  ENTRÉE : created_at, tenant_settings

  1. Récupérer tenant_settings.invitation_expiry_days
  2. SI non défini, ALORS default = 7 jours
  3. expires_at = created_at + expiry_days jours
  4. Arrondir à 23:59:59 du dernier jour
     Exemple : created_at = 10 nov 10:00
               expires_at = 17 nov 23:59:59

  SORTIE : expires_at
```

**Règles de relance automatique :**

```
RÈGLE RELANCE 1 : +48h après envoi initial
  Conditions :
    - status = pending
    - sent_at + 48h < now
    - metadata.reminder_sent_at IS NULL
  Action :
    - Envoyer email "invitation_reminder"
    - metadata.reminder_sent_at = now

RÈGLE RELANCE 2 : +24h avant expiration
  Conditions :
    - status = pending
    - expires_at - 24h < now
    - metadata.final_reminder_sent_at IS NULL
  Action :
    - Envoyer email "invitation_expiring_soon"
    - metadata.final_reminder_sent_at = now
```

**Règles de sécurité :**

```
RÈGLE SÉCURITÉ 1 : Limite renvois
  SI sent_count >= 3
  ALORS
    - Bloquer renvoi automatique
    - Forcer admin à créer nouvelle invitation
  Raison : Protection spam

RÈGLE SÉCURITÉ 2 : Email unique par tenant
  SI email existe déjà comme member actif du tenant
  ALORS
    - Rejeter création invitation
    - Error : "User already exists"
  Raison : Éviter doublons

RÈGLE SÉCURITÉ 3 : Token usage unique
  SI invitation déjà accepted
  ALORS
    - Rejeter tentative réutilisation token
    - Error : "Invitation already used"
  Raison : Éviter rejeu token

RÈGLE SÉCURITÉ 4 : Validation tenant actif
  SI tenant.status != 'active'
  ALORS
    - Rejeter création invitation
    - Error : "Tenant suspended or cancelled"
  Raison : Pas d'onboarding si tenant inactif
```

**Règles de validation (via InvitationCreateSchema Zod) :**

- Tenant_id : requis, uuid valide, tenant actif
- Email : requis, format RFC 5322, pas déjà membre du tenant
- Role : requis, enum valide (admin, manager, operator, driver)
- Custom_message : optionnel, max 500 caractères
- Invited_by : requis, uuid valide, member avec permission invitations.create

**Règles de cohérence inter-colonnes :**

- Status = accepted ⇒ accepted_at, accepted_by_member_id obligatoires
- Status = pending ET expires_at < now ⇒ doit passer à expired (cron)
- Sent_count ≥ 1 ⇒ sent_at, last_sent_at obligatoires
- Token unique globalement (pas juste par tenant)

### 🏗️ COMPOSANTS À DÉVELOPPER

#### Backend (Service Layer)

**Fichier à créer : `lib/services/admin/invitation.service.ts`**

Service gérant le cycle de vie complet des invitations.

**Classe InvitationService extends BaseService :**

**Méthode createInvitation(data: InvitationCreateInput) → Promise<Invitation>**

1. Valider data avec InvitationCreateSchema
2. Vérifier que tenant existe et status = 'active'
3. Vérifier que email n'est pas déjà membre du tenant (adm_members)
4. Vérifier que invited_by a permission 'invitations.create'
5. Générer token unique via generateInvitationToken()
6. Calculer expires_at = now + 7 jours (23:59:59)
7. Créer invitation dans DB via invitationRepository.create() :
   - tenant_id
   - email (normalisé lowercase)
   - token
   - role
   - expires_at
   - status = 'pending'
   - invited_by
   - sent_count = 0
8. Envoyer email invitation via notificationService.sendEmail() :
   - template_id : "invitation_sent"
   - variables : { inviter_name, tenant_name, role, custom_message, accept_url }
9. Mettre à jour invitation :
   - sent_at = now
   - last_sent_at = now
   - sent_count = 1
10. Créer audit log (action = "create")
11. Retourner invitation créée

**Méthode resendInvitation(invitationId: string) → Promise<Invitation>**

1. Récupérer invitation par ID
2. Vérifier que status = 'pending'
3. Vérifier que expires_at > now (pas expirée)
4. Vérifier que sent_count < 3 (limite renvois)
5. Envoyer email via notificationService
6. Mettre à jour invitation :
   - last_sent_at = now
   - sent_count += 1
7. Créer audit log (action = "resend")
8. Retourner invitation mise à jour

**Méthode acceptInvitation(token: string, userData: UserCreateInput) → Promise<Member>**

1. Trouver invitation par token via invitationRepository.findByToken()
2. Vérifier que invitation existe
3. Vérifier que expires_at > now
4. Vérifier que status = 'pending'
5. Vérifier que email pas déjà membre du tenant
6. Créer compte Clerk via clerkService.createUser(userData)
7. Récupérer clerk_user_id depuis réponse Clerk
8. Créer member via memberService.createMember() :
   - tenant_id : depuis invitation
   - clerk_user_id
   - email : depuis invitation
   - first_name, last_name : depuis userData
   - role : depuis invitation
   - status : 'active'
   - email_verified_at : now (Clerk a vérifié)
9. Mettre à jour invitation :
   - status = 'accepted'
   - accepted_at = now
   - accepted_by_member_id = member.id
10. Créer audit log "invitation_accepted"
11. Envoyer email confirmation à invited_by : "Sarah a accepté votre invitation"
12. Retourner member créé

**Méthode revokeInvitation(invitationId: string, reason: string) → Promise<Invitation>**

1. Récupérer invitation par ID
2. Vérifier que status = 'pending'
3. Changer status à 'revoked'
4. Renseigner metadata.revocation_reason = reason
5. Mettre à jour invitation dans DB
6. Créer audit log (action = "revoke", reason)
7. Retourner invitation révoquée

**Méthode expireInvitations() → Promise<number>**
Méthode appelée par cron job quotidien.

1. Trouver toutes invitations avec :
   - status = 'pending'
   - expires_at < now
2. Pour chaque invitation :
   - Changer status à 'expired'
   - Renseigner metadata.expired_at = now
   - Créer audit log
   - Envoyer notification à invited_by
3. Retourner nombre invitations expirées

**Méthode sendReminders() → Promise<number>**
Méthode appelée par cron job quotidien.

1. Trouver invitations nécessitant relance +48h :
   - status = 'pending'
   - sent_at + 48h < now
   - metadata.reminder_sent_at IS NULL
2. Pour chaque invitation :
   - Envoyer email "invitation_reminder"
   - Mettre à jour metadata.reminder_sent_at = now
3. Trouver invitations nécessitant relance finale (24h avant expiration)
4. Envoyer emails et logger
5. Retourner nombre relances envoyées

**Méthode findAll(tenantId: string, filters: InvitationFilters) → Promise<Invitation[]>**

1. Construire query Prisma avec filtres (status, email, invited_by)
2. Ajouter WHERE tenant_id = tenantId
3. Inclure relations : tenant, invited_by (member), accepted_by_member
4. Trier par created_at DESC
5. Paginer (limit, offset)
6. Retourner liste invitations

**Méthode findById(id: string, tenantId: string) → Promise<Invitation>**

1. Chercher invitation par ID avec tenant_id
2. Si non trouvée OU appartient à autre tenant → throw NotFoundError
3. Inclure toutes relations
4. Retourner invitation

**Fichier à créer : `lib/repositories/admin/invitation.repository.ts`**

Repository pour accès Prisma à la table adm_invitations.

**Méthode findByToken(token: string) → Promise<Invitation | null>**

1. Chercher invitation par token (unique global)
2. Inclure relations : tenant, invited_by
3. Retourner invitation ou null

**Méthode findPendingByEmail(email: string, tenantId: string) → Promise<Invitation | null>**

1. Chercher invitation avec :
   - email = email
   - tenant_id = tenantId
   - status = 'pending'
2. Retourner invitation ou null

#### API REST (Endpoints)

**Fichier à créer : `app/api/v1/admin/invitations/route.ts`**

**GET /api/v1/admin/invitations**

- **Description** : Liste toutes les invitations du tenant
- **Query params** :
  - status : filter par status (pending, accepted, expired, revoked)
  - email : filter par email
  - invited_by : filter par inviteur
  - limit, offset : pagination
- **Permissions** : invitations.read
- **Réponse 200** :

```json
{
  "invitations": [
    {
      "id": "uuid",
      "email": "sarah@abclogistics.ae",
      "role": "manager",
      "status": "pending",
      "invited_by": {
        "id": "uuid",
        "first_name": "Ahmed",
        "last_name": "Al-Mansoori"
      },
      "sent_at": "2025-11-10T10:00:00Z",
      "expires_at": "2025-11-17T23:59:59Z",
      "sent_count": 1
    }
  ],
  "total": 15,
  "pending": 5,
  "accepted": 8,
  "expired": 2
}
```

**POST /api/v1/admin/invitations**

- **Description** : Créer nouvelle invitation
- **Body** :

```json
{
  "email": "sarah@abclogistics.ae",
  "role": "manager",
  "custom_message": "Bienvenue Sarah ! Tu géreras la flotte zone Nord."
}
```

- **Permissions** : invitations.create
- **Réponse 201** :

```json
{
  "id": "uuid",
  "email": "sarah@abclogistics.ae",
  "token": "inv_a1b2c3d4...",
  "role": "manager",
  "status": "pending",
  "expires_at": "2025-11-17T23:59:59Z",
  "accept_url": "https://fleetcore.com/accept?token=inv_a1b2c3d4..."
}
```

- **Erreurs** :
  - 422 : Email already member of tenant
  - 422 : Tenant not active
  - 403 : Missing permission invitations.create

**Fichier à créer : `app/api/v1/admin/invitations/[id]/resend/route.ts`**

**POST /api/v1/admin/invitations/[id]/resend**

- **Description** : Renvoyer email invitation
- **Body** : Aucun
- **Permissions** : invitations.create
- **Réponse 200** :

```json
{
  "success": true,
  "sent_count": 2,
  "last_sent_at": "2025-11-12T14:30:00Z"
}
```

- **Erreurs** :
  - 422 : Invitation already accepted
  - 422 : Invitation expired
  - 422 : Max resend limit reached (3)

**Fichier à créer : `app/api/v1/admin/invitations/[id]/revoke/route.ts`**

**POST /api/v1/admin/invitations/[id]/revoke**

- **Description** : Révoquer invitation
- **Body** :

```json
{
  "reason": "Email incorrect, personne a quitté avant onboarding"
}
```

- **Permissions** : invitations.revoke
- **Réponse 200** :

```json
{
  "id": "uuid",
  "status": "revoked",
  "revoked_at": "2025-11-12T15:00:00Z"
}
```

**Fichier à créer : `app/api/v1/public/invitations/accept/route.ts`**

**POST /api/v1/public/invitations/accept**

- **Description** : Accepter invitation (endpoint PUBLIC, pas d'auth)
- **Body** :

```json
{
  "token": "inv_a1b2c3d4...",
  "first_name": "Sarah",
  "last_name": "Martinez",
  "password": "SecureP@ss123"
}
```

- **Permissions** : Aucune (public)
- **Réponse 201** :

```json
{
  "member": {
    "id": "uuid",
    "email": "sarah@abclogistics.ae",
    "first_name": "Sarah",
    "last_name": "Martinez",
    "role": "manager",
    "tenant": {
      "id": "uuid",
      "name": "ABC Logistics"
    }
  },
  "redirect_url": "/onboarding"
}
```

- **Erreurs** :
  - 404 : Invalid or expired token
  - 422 : Email already exists as member
  - 400 : Password too weak

#### Frontend (Interface Utilisateur)

**Fichier à créer : `app/[locale]/admin/team/invitations/page.tsx`**

Page principale gestion des invitations (Admin backoffice).

**Layout de la page :**

```
┌──────────────────────────────────────────────────────────────┐
│ HEADER                                                        │
│ [FleetCore Logo] Team > Invitations    [+ Invite Member]    │
└──────────────────────────────────────────────────────────────┘
┌──────────────────────────────────────────────────────────────┐
│ FILTERS                                                       │
│ Status: [All ▼]  Invited by: [All ▼]  Search: [_______] 🔍  │
└──────────────────────────────────────────────────────────────┘
┌──────────────────────────────────────────────────────────────┐
│ STATS CARDS                                                   │
│ ┌──────────┬──────────┬──────────┬──────────┐              │
│ │ Pending  │ Accepted │ Expired  │ Revoked  │              │
│ │   5      │    12    │    2     │    1     │              │
│ └──────────┴──────────┴──────────┴──────────┘              │
└──────────────────────────────────────────────────────────────┘
┌──────────────────────────────────────────────────────────────┐
│ INVITATIONS TABLE                                             │
│ ┌────────────────────────────────────────────────────────┐  │
│ │Email            │Role    │Invited by│Status  │Actions │  │
│ ├────────────────────────────────────────────────────────┤  │
│ │sarah@abc.ae     │Manager │Ahmed     │Pending │[Resend]│  │
│ │                 │        │          │Exp 5d  │[Revoke]│  │
│ ├────────────────────────────────────────────────────────┤  │
│ │john@abc.ae      │Operator│Ahmed     │Accepted│[View]  │  │
│ │                 │        │          │2d ago  │        │  │
│ ├────────────────────────────────────────────────────────┤  │
│ │old@abc.ae       │Driver  │Marie     │Expired │[Resend]│  │
│ │                 │        │          │1w ago  │        │  │
│ └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

**Fonctionnalités :**

- **Filtres** : Status, Invited by, Search par email
- **Stats cards** : Compteurs temps réel par statut
- **Actions rapides** :
  - Resend (si pending ou expired)
  - Revoke (si pending)
  - View (détails invitation)
- **Indicateurs visuels** :
  - Badge couleur par status (orange=pending, vert=accepted, rouge=expired)
  - Countdown expiration (Expires in 5 days)
  - Sent count badge (2× envoyé)

**Composant à créer : `components/admin/InviteMemberModal.tsx`**

Modal formulaire pour inviter nouveau membre.

**Champs du formulaire :**

- Email (requis, validation email)
- Role (requis, dropdown : Admin, Manager, Operator, Driver)
- Custom message (optionnel, textarea 500 chars)

**Validation :**

- Email format valide
- Email pas déjà membre du tenant
- Role valide selon permissions inviteur

**Soumission :**

- POST /api/v1/admin/invitations
- Affiche loader pendant appel
- Si succès : ferme modal, toast "Invitation sent to sarah@abc.ae", refresh liste
- Si erreur : affiche message erreur détaillé

**Composant à créer : `components/admin/InvitationCard.tsx`**

Composant carte pour afficher invitation dans liste.

**Props :**

- invitation : objet Invitation complet
- onResend : callback resend
- onRevoke : callback revoke

**Affichage :**

- Email destinataire
- Rôle proposé
- Badge status (couleur selon status)
- Nom inviteur avec avatar
- Date envoi relative ("2 days ago")
- Countdown expiration si pending ("Expires in 5 days")
- Badge nombre envois si >1 ("2× sent")
- Actions rapides selon status

**Page à créer : `app/accept/page.tsx`**

Page publique acceptation invitation (pas d'auth requise).

**Workflow :**

1. Récupérer token depuis query params
2. Appeler GET /api/v1/public/invitations/verify?token={token}
3. Si token invalide/expiré : afficher erreur sympathique
4. Si valide : afficher formulaire
5. Formulaire :
   - Email (pré-rempli, readonly)
   - Tenant (pré-rempli, readonly)
   - Role (pré-rempli, readonly)
   - Custom message inviteur (si fourni)
   - First name (input requis)
   - Last name (input requis)
   - Password (input requis, force indicator)
   - Confirm password (input requis)
   - Checkbox "I agree to Terms & Privacy Policy"
6. Validation :
   - Password min 12 chars, complexité
   - Passwords match
   - Terms accepted
7. Soumission POST /api/v1/public/invitations/accept
8. Si succès : redirection /onboarding

### 🎬 RÉSULTAT DÉMONTRABLE

**Scénario démo complet pour le sponsor :**

**1. Créer invitation**

- Admin Ahmed se connecte, va dans Team > Invitations
- Clic "+ Invite Member"
- Modal s'ouvre
- Remplit :
  - Email : demo@example.com
  - Role : Manager
  - Message : "Welcome to the team!"
- Clic "Send Invitation"
- Modal se ferme, toast "Invitation sent"
- Nouvelle ligne apparaît dans tableau :
  - demo@example.com
  - Role : Manager
  - Status : Pending (badge orange)
  - Invited by : Ahmed
  - Expires in 7 days

**2. Vérifier email envoyé**

- Aller dans Notifications > History
- Filtrer recipient = demo@example.com
- Voir log :
  - Template : invitation_sent
  - Status : sent
  - Sent at : 10 nov 10:00
  - Provider message ID : re_abc123

**3. Accepter invitation**

- Ouvrir lien dans email (ou directement /accept?token=...)
- Page acceptation s'affiche :
  - "Ahmed invites you to join ABC Logistics"
  - Role : Manager
  - Formulaire First/Last name, Password
- Remplir et submit
- Compte créé, redirection /onboarding

**4. Vérifier membre créé**

- Retour admin, aller Team > Members
- Voir nouveau membre "Demo User" avec role Manager
- Status : Active
- Email verified

**5. Vérifier invitation accepted**

- Retour Team > Invitations
- Voir invitation demo@example.com :
  - Status : Accepted (badge vert)
  - Accepted at : 10 nov 10:15
  - Link vers member profile

**6. Tester resend (invitation pending)**

- Créer nouvelle invitation test2@example.com
- Clic action "Resend"
- Confirmation modal
- Email renvoyé
- Badge "2× sent" apparaît
- Last sent : now

**7. Tester revoke**

- Clic action "Revoke" sur test2@example.com
- Modal demande raison
- Entrer raison : "Email incorrect"
- Confirmer
- Status passe à Revoked (badge gris)

**Critères d'acceptation :**

- ✅ Invitation créée avec token unique
- ✅ Email envoyé automatiquement
- ✅ Token expire après 7 jours
- ✅ Acceptation crée member correctement
- ✅ Status updated (pending → accepted)
- ✅ Resend fonctionne (max 3×)
- ✅ Revoke fonctionne avec raison
- ✅ Expiration automatique par cron
- ✅ Relances automatiques J+2 et J-1
- ✅ UI Admin intuitive avec filtres

### ⏱️ ESTIMATION

- Temps backend : **6 heures**
  - InvitationService : 3h
  - InvitationRepository : 1h
  - Cron jobs (expire, reminders) : 2h
- Temps API : **2 heures**
  - GET /invitations : 0.5h
  - POST /invitations : 0.5h
  - POST /resend : 0.5h
  - POST /accept (public) : 0.5h
- Temps frontend : **4 heures**
  - Page liste invitations : 2h
  - InviteMemberModal : 1h
  - Page accept publique : 1h
- **TOTAL : 12 heures (1.5 jours)**

### 🔗 DÉPENDANCES

**Prérequis obligatoires :**

- Chapitre 1.2 terminé (adm_members existe)
- NotificationService (Phase 0.4 - emails)
- Clerk auth configuré

**Services/composants requis :**

- MemberService (créer member depuis invitation)
- NotificationService (envoyer emails)
- ClerkService (créer user Clerk)
- AuditService (logging actions)

**Données de test nécessaires :**

- 1 tenant actif
- 1 admin avec permission invitations.create
- Emails de test valides

### ✅ CHECKLIST DE VALIDATION

- [ ] **Backend** : InvitationService compile, toutes méthodes implémentées
- [ ] **Backend** : InvitationRepository compile
- [ ] **Backend** : Cron jobs expiration et relances fonctionnent
- [ ] **API** : GET /api/v1/admin/invitations retourne liste
- [ ] **API** : POST /api/v1/admin/invitations crée invitation et envoie email
- [ ] **API** : POST /api/v1/admin/invitations/[id]/resend fonctionne
- [ ] **API** : POST /api/v1/public/invitations/accept crée member
- [ ] **Frontend** : Page /admin/team/invitations affiche liste
- [ ] **Frontend** : InviteMemberModal crée invitation
- [ ] **Frontend** : Page /accept publique fonctionne
- [ ] **Tests** : Test complet workflow invitation → acceptation
- [ ] **Tests** : Test expiration automatique
- [ ] **Tests** : Test resend (max 3×)
- [ ] **Tests** : Test relances automatiques
- [ ] **Démo** : Sponsor peut inviter membre et voir acceptation

---

# ÉTAPE 3.2 : SESSIONS MANAGEMENT

**Durée :** 1.5 jours ouvrés (12 heures)  
**Objectif :** Implémenter tracking sessions actives avec détection anomalies et révocation en masse  
**Livrable démo :** Interface Admin pour visualiser sessions actives et révoquer en cas de compromission

---

## 🎯 RATIONNEL MÉTIER

**POURQUOI :** Chaque connexion utilisateur crée une session avec token d'authentification. Tracker ces sessions permet de détecter accès suspects (connexion depuis pays différent, appareil inconnu), limiter le nombre d'appareils simultanés, et révoquer toutes sessions en cas de compromission compte.

**QUEL PROBLÈME :** Sans tracking sessions, impossible de savoir : combien d'appareils l'utilisateur a connectés ? Dernière connexion suspecte ? Comment déconnecter tous appareils si mot de passe volé ? Le token Clerk seul ne suffit pas : besoin de metadata (IP, user-agent, localisation) pour analyse sécurité.

**IMPACT SI ABSENT :**

- **Sécurité** : Compte compromis = impossible de révoquer toutes sessions
- **Détection fraude** : Connexion depuis 2 pays simultanément = non détecté
- **Limite appareils** : Utilisateur peut avoir 50 sessions actives = abus
- **Conformité** : RGPD exige traçabilité accès aux données personnelles
- **Support** : "Mon compte est bizarre" = impossible d'analyser sessions

**CAS D'USAGE CONCRET :**

Ahmed (Admin ABC Logistics) utilise FleetCore depuis 3 mois. Il se connecte habituellement depuis :

- Son laptop bureau (Chrome, IP UAE)
- Son téléphone (Safari iOS, IP UAE)

**Scénario 1 : Détection activité suspecte**

**Lundi 10 nov - 09h00 : Connexion normale laptop**

1. Ahmed se connecte depuis son laptop
2. Clerk authentifie et génère access_token
3. Frontend appelle POST /api/v1/auth/session/create avec :
   - member_id : ahmed.id
   - ip_address : 192.168.1.100 (IP bureau UAE)
   - user_agent : "Mozilla/5.0... Chrome/120 (Windows)"
   - device_fingerprint : hash(user-agent + plugins)
4. Système crée session dans adm_member_sessions :
   - token_hash : SHA256(access_token)
   - ip_address : 192.168.1.100
   - user_agent : Chrome Windows
   - expires_at : now + 7 jours
   - metadata : { country: "UAE", city: "Dubai", device: "laptop" }
5. Session active, Ahmed travaille normalement

**Lundi 10 nov - 09h15 : Tentative connexion suspecte** 6. Quelqu'un tente connexion avec credentials Ahmed depuis IP Russie 7. Login réussit (password correct = compromis) 8. Frontend appelle POST /api/v1/auth/session/create 9. Système détecte anomalie :

- IP nouveau pays (Russia vs UAE)
- User-agent différent (Firefox Linux vs Chrome Windows)
- Distance géographique 4000+ km

10. Système calcule risk_score :
    - New country : +50 points
    - New device : +30 points
    - Simultaneous login (<15 min depuis dernière) : +20 points
    - **Risk score : 100/100 = HIGH RISK**
11. Système :
    - Crée session avec metadata.risk_score = 100
    - Bloque accès immédiatement (status = 'blocked')
    - Envoie alerte email à Ahmed : "Connexion suspecte depuis Russie"
    - Envoie SMS 2FA : "Code 6 chiffres pour confirmer identité"
12. Attaquant ne peut pas accéder sans code 2FA

**Lundi 10 nov - 09h20 : Ahmed réagit** 13. Ahmed reçoit email alerte 14. Va dans Settings > Security > Active Sessions 15. Voit 2 sessions : - ✅ Laptop Dubai (Chrome Windows) - Active - ⚠️ Russia (Firefox Linux) - Blocked (risk: HIGH) 16. Clique "Revoke All Sessions Except This One" 17. Toutes sessions sauf laptop actuel révoquées 18. Change son password immédiatement 19. Active MFA obligatoire

**Valeur business :**

- **Détection fraude** : 100% tentatives suspectes détectées
- **Temps réaction** : 5 minutes au lieu de 3 jours (sans alertes)
- **Coût compromission** : 0€ (bloqué avant accès) vs 50k€ (fuite données)

**Scénario 2 : Limite appareils simultanés**

**Configuration tenant ABC Logistics :**

- Max sessions simultanées : 5 par membre

**Situation :**
Ahmed a déjà 5 sessions actives :

1. Laptop bureau
2. Téléphone personnel
3. Tablette
4. Laptop maison
5. Téléphone professionnel

**Tentative 6ème connexion :**

1. Ahmed essaie connexion depuis laptop ami
2. POST /api/v1/auth/session/create
3. Système compte sessions actives non expirées : 5
4. Vérifie tenant_settings.max_sessions_per_member : 5
5. Refuse création session
6. Error 429 : "Maximum concurrent sessions reached (5/5). Please logout from another device."
7. Ahmed voit message avec liste sessions actives
8. Peut choisir quelle session révoquer

### 📊 DONNÉES ET RÈGLES MÉTIER

**Table principale : `adm_member_sessions`**

**Colonnes critiques (15 colonnes) :**

| Colonne                | Type         | Obligatoire | Utilité Business                                                |
| ---------------------- | ------------ | ----------- | --------------------------------------------------------------- |
| **id**                 | uuid         | OUI         | Identifiant unique session (PK)                                 |
| **member_id**          | uuid         | OUI         | Membre propriétaire (FK → adm_members)                          |
| **token_hash**         | varchar(256) | OUI         | Hash SHA256 du access token                                     |
| **ip_address**         | inet         | OUI         | IP connexion (format PostgreSQL inet)                           |
| **user_agent**         | text         | OUI         | User-agent navigateur complet                                   |
| **device_fingerprint** | varchar(255) | NON         | Hash unique appareil                                            |
| **status**             | text         | OUI         | État session (active, revoked, expired, blocked)                |
| **expires_at**         | timestamp    | OUI         | Date expiration (7 jours défaut)                                |
| **last_activity_at**   | timestamp    | OUI         | Dernière activité (refresh automatique)                         |
| **revoked_at**         | timestamp    | NON         | Date révocation manuelle                                        |
| **revoked_by**         | uuid         | NON         | Qui a révoqué (FK → adm_members)                                |
| **metadata**           | jsonb        | NON         | Données additionnelles (country, city, device_type, risk_score) |
| **created_at**         | timestamp    | OUI         | Date création session                                           |
| **updated_at**         | timestamp    | OUI         | Date modification                                               |

**Statuts possibles et transitions :**

```
ÉTAT : active (session valide)
├─ CONDITIONS : expires_at > now, pas révoquée, risk_score < 80
├─ ACCÈS : Complet selon permissions member
├─ REFRESH : last_activity_at mis à jour à chaque requête
└─ TRANSITIONS :
   ├─ → revoked (user logout OU admin révoque)
   ├─ → expired (expires_at dépassé OU inactivité >24h)
   └─ → blocked (risk_score >= 80 détecté)

ÉTAT : revoked (révoquée manuellement)
├─ CONDITIONS : User a cliqué logout OU admin a révoqué
├─ ACCÈS : Bloqué totalement
└─ TRANSITIONS : Aucune (état final)

ÉTAT : expired (expirée automatiquement)
├─ CONDITIONS : expires_at < now OU last_activity_at + 24h < now
├─ ACCÈS : Bloqué
└─ TRANSITIONS : Aucune (état final)

ÉTAT : blocked (bloquée pour sécurité)
├─ CONDITIONS : risk_score >= 80 (connexion suspecte)
├─ ACCÈS : Bloqué, 2FA requis pour débloquer
└─ TRANSITIONS :
   └─ → active (2FA validé + risk accepté)
```

**Règles de calcul risk_score :**

```
ALGORITHME calculateRiskScore :
  ENTRÉE : new_session, existing_sessions, member_history

  risk_score = 0

  # Vérification pays
  SI new_session.country != member.usual_countries :
    risk_score += 50
  FIN SI

  # Vérification appareil
  SI new_session.device_fingerprint NOT IN member.known_devices :
    risk_score += 30
  FIN SI

  # Connexions simultanées rapprochées
  last_session = existing_sessions.last()
  SI last_session.created_at + 15 minutes > now :
    distance_km = geoDistance(last_session.ip, new_session.ip)
    SI distance_km > 500 :
      risk_score += 20  # Impossible physiquement
    FIN SI
  FIN SI

  # Heure inhabituelle
  SI new_session.hour NOT IN member.usual_hours :
    risk_score += 10
  FIN SI

  # TOTAL
  SORTIE : risk_score (0-110)

  CLASSIFICATION :
    0-40 : LOW (vert)
    41-79 : MEDIUM (orange, log mais autoriser)
    80-110 : HIGH (rouge, bloquer + 2FA)
```

**Règles de limitation simultanées :**

```
RÈGLE LIMITE 1 : Max sessions par membre
  tenant_settings.max_sessions_per_member (défaut: 5)

  SI count(sessions actives) >= max_sessions
  ALORS
    - Rejeter nouvelle connexion
    - Error 429 "Max concurrent sessions reached"
    - Afficher liste sessions pour choisir laquelle révoquer

RÈGLE LIMITE 2 : Max sessions par IP
  SI count(sessions actives MÊME IP) >= 10
  ALORS
    - Bloquer (probable bot/scraper)
    - Error 429 "Too many connections from this IP"
```

**Règles d'expiration automatique :**

```
RÈGLE EXPIRATION 1 : Expiration date
  SI expires_at < now
  ALORS
    - status = 'expired'
    - Bloquer accès
  Cron quotidien nettoie sessions expirées

RÈGLE EXPIRATION 2 : Inactivité
  SI last_activity_at + 24h < now
  ALORS
    - status = 'expired'
    - Forcer logout
  Protection contre oubli logout
```

**Règles de révocation :**

```
ACTION RÉVOCATION 1 : Logout simple
  Révoque session courante uniquement
  Autres appareils restent connectés

ACTION RÉVOCATION 2 : Logout all devices
  Révoque toutes sessions membre
  Sauf session courante (optionnel)

ACTION RÉVOCATION 3 : Admin force logout
  Admin peut révoquer sessions d'un membre
  Cas : Compromission détectée, enquête interne
  Nécessite permission sessions.revoke
```

**Règles de validation (via SessionCreateSchema Zod) :**

- Member_id : requis, uuid valide, member actif
- Token_hash : requis, SHA256 format, unique global
- IP_address : requis, format IPv4 ou IPv6 valide
- User_agent : requis, string non vide
- Expires_at : requis, >= now, <= now + 30 jours

**Règles de cohérence inter-colonnes :**

- Status = revoked ⇒ revoked_at, revoked_by obligatoires
- Status = blocked ⇒ metadata.risk_score >= 80
- Last_activity_at <= expires_at (dernière activité avant expiration)
- Expires_at >= created_at + 1 minute (durée minimum)

### 🏗️ COMPOSANTS À DÉVELOPPER

#### Backend (Service Layer)

**Fichier à créer : `lib/services/admin/session.service.ts`**

Service gérant le cycle de vie des sessions et détection anomalies.

**Classe SessionService extends BaseService :**

**Méthode createSession(data: SessionCreateInput) → Promise<Session>**

1. Valider data avec SessionCreateSchema
2. Vérifier member existe et status = 'active'
3. Compter sessions actives du member
4. Vérifier limite max_sessions_per_member
5. SI limite atteinte → throw BusinessRuleError("Max sessions reached")
6. Hacher token : token_hash = SHA256(data.token)
7. Extraire metadata depuis user_agent et IP :
   - device_type (mobile, tablet, desktop)
   - browser (Chrome, Firefox, Safari)
   - os (Windows, macOS, iOS, Android)
   - country, city via GeoIP lookup
8. Récupérer sessions récentes membre (24h)
9. Calculer risk_score via calculateRiskScore()
10. SI risk_score >= 80 :
    - status = 'blocked'
    - Envoyer alerte email + SMS membre
11. SINON : status = 'active'
12. Créer session dans DB via sessionRepository.create() :
    - expires_at = now + 7 jours
    - last_activity_at = now
    - metadata : { country, city, device_type, risk_score }
13. SI nouveau device_fingerprint :
    - Enregistrer dans member.metadata.known_devices
14. Créer audit log (action = "session_created")
15. Retourner session créée

**Méthode refreshSession(sessionId: string) → Promise<Session>**
Appelé à chaque requête API pour maintenir session active.

1. Récupérer session par ID
2. Vérifier que status = 'active'
3. Vérifier que expires_at > now
4. Mettre à jour last_activity_at = now
5. Retourner session

**Méthode revokeSession(sessionId: string, revokedBy: string) → Promise<Session>**

1. Récupérer session par ID
2. Vérifier que status = 'active'
3. Changer status à 'revoked'
4. Renseigner revoked_at = now
5. Renseigner revoked_by = revokedBy
6. Mettre à jour session dans DB
7. Invalider token côté Clerk (si nécessaire)
8. Créer audit log (action = "session_revoked")
9. Retourner session révoquée

**Méthode revokeAllSessions(memberId: string, exceptSessionId?: string) → Promise<number>**

1. Trouver toutes sessions actives du membre
2. SI exceptSessionId fourni, exclure cette session
3. Pour chaque session :
   - Changer status à 'revoked'
   - Renseigner revoked_at, revoked_by
4. Créer audit log "all_sessions_revoked"
5. Envoyer notification membre : "All devices logged out"
6. Retourner nombre sessions révoquées

**Méthode expireSessions() → Promise<number>**
Méthode appelée par cron job toutes les heures.

1. Trouver sessions avec expires_at < now OU last_activity_at + 24h < now
2. Pour chaque session :
   - Changer status à 'expired'
3. Créer audit logs
4. Retourner nombre sessions expirées

**Méthode detectAnomalies() → Promise<AnomalyReport[]>**
Méthode appelée par cron job quotidien.

1. Trouver sessions actives avec risk_score > 60
2. Pour chaque session suspecte :
   - Analyser patterns (connexions multiples, IP inhabituels)
   - Générer rapport anomalie
3. Envoyer alertes admins tenant
4. Retourner liste anomalies détectées

**Méthode findActiveSessions(memberId: string) → Promise<Session[]>**

1. Trouver toutes sessions avec :
   - member_id = memberId
   - status = 'active'
   - expires_at > now
2. Trier par last_activity_at DESC (plus récent en premier)
3. Inclure metadata complète
4. Retourner liste sessions

**Méthode calculateRiskScore(session: SessionCreateInput, history: Session[]) → number**
Implémente l'algorithme détaillé ci-dessus.
Retourne risk_score 0-110.

**Fichier à créer : `lib/repositories/admin/session.repository.ts`**

Repository pour accès Prisma à la table adm_member_sessions.

**Méthode findByTokenHash(tokenHash: string) → Promise<Session | null>**

1. Chercher session par token_hash (unique global)
2. Inclure relation member
3. Retourner session ou null

**Méthode countActiveSessions(memberId: string) → Promise<number>**

1. Compter sessions avec :
   - member_id = memberId
   - status = 'active'
   - expires_at > now
2. Retourner count

#### API REST (Endpoints)

**Fichier à créer : `app/api/v1/auth/sessions/route.ts`**

**GET /api/v1/auth/sessions**

- **Description** : Liste sessions actives du membre courant
- **Permissions** : authenticated (propres sessions)
- **Réponse 200** :

```json
{
  "sessions": [
    {
      "id": "uuid",
      "device": {
        "type": "desktop",
        "browser": "Chrome 120",
        "os": "Windows 11"
      },
      "location": {
        "country": "UAE",
        "city": "Dubai",
        "ip": "192.168.1.100"
      },
      "status": "active",
      "risk_score": 10,
      "created_at": "2025-11-10T09:00:00Z",
      "last_activity_at": "2025-11-10T14:30:00Z",
      "expires_at": "2025-11-17T09:00:00Z",
      "is_current": true
    }
  ],
  "total": 3
}
```

**POST /api/v1/auth/sessions**

- **Description** : Créer nouvelle session (appelé après login Clerk)
- **Body** :

```json
{
  "token": "clerk_access_token_here",
  "device_fingerprint": "hash_unique_device"
}
```

- **Permissions** : authenticated
- **Réponse 201** :

```json
{
  "session_id": "uuid",
  "status": "active",
  "expires_at": "2025-11-17T09:00:00Z",
  "risk_assessment": {
    "score": 15,
    "level": "low",
    "factors": ["known_device", "usual_location"]
  }
}
```

- **Erreurs** :
  - 429 : Max concurrent sessions reached
  - 403 : Session blocked (high risk score)

**Fichier à créer : `app/api/v1/auth/sessions/[id]/revoke/route.ts`**

**POST /api/v1/auth/sessions/[id]/revoke**

- **Description** : Révoquer session spécifique (logout appareil)
- **Body** : Aucun
- **Permissions** : authenticated (propre session OU permission sessions.revoke)
- **Réponse 200** :

```json
{
  "success": true,
  "revoked_at": "2025-11-10T15:00:00Z"
}
```

**Fichier à créer : `app/api/v1/auth/sessions/revoke-all/route.ts`**

**POST /api/v1/auth/sessions/revoke-all**

- **Description** : Révoquer toutes sessions (logout all devices)
- **Body** :

```json
{
  "except_current": true
}
```

- **Permissions** : authenticated
- **Réponse 200** :

```json
{
  "success": true,
  "revoked_count": 4,
  "remaining": 1
}
```

**Fichier à créer : `app/api/v1/admin/members/[id]/sessions/route.ts`**

**GET /api/v1/admin/members/[id]/sessions**

- **Description** : Liste sessions d'un membre (Admin view)
- **Permissions** : sessions.read (admin)
- **Réponse 200** : Même format que GET /auth/sessions

**POST /api/v1/admin/members/[id]/sessions/revoke-all**

- **Description** : Admin force logout membre (cas compromission)
- **Permissions** : sessions.revoke (admin)
- **Body** :

```json
{
  "reason": "Account compromised, forcing logout all devices"
}
```

- **Réponse 200** :

```json
{
  "success": true,
  "revoked_count": 5,
  "notified": true
}
```

#### Frontend (Interface Utilisateur)

**Fichier à créer : `app/[locale]/settings/security/sessions/page.tsx`**

Page utilisateur pour gérer ses propres sessions actives.

**Layout de la page :**

```
┌──────────────────────────────────────────────────────────────┐
│ HEADER                                                        │
│ Settings > Security > Active Sessions                        │
└──────────────────────────────────────────────────────────────┘
┌──────────────────────────────────────────────────────────────┐
│ CURRENT SESSION                                               │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ 🖥️  Desktop - Chrome 120 on Windows 11                   │ │
│ │ 📍 Dubai, UAE (192.168.1.100)                            │ │
│ │ 🕐 Active now                                             │ │
│ │ ✅ Risk: Low (10/100)                                     │ │
│ │                                         [This Device]     │ │
│ └──────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
┌──────────────────────────────────────────────────────────────┐
│ OTHER SESSIONS (2)                    [Logout All Devices]   │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ 📱 Mobile - Safari on iOS 17                             │ │
│ │ 📍 Dubai, UAE (192.168.1.105)                            │ │
│ │ 🕐 Active 2 hours ago                                    │ │
│ │ ✅ Risk: Low (15/100)                           [Revoke] │ │
│ └──────────────────────────────────────────────────────────┘ │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ 💻 Desktop - Firefox on macOS                            │ │
│ │ 📍 Paris, France (89.123.45.67)                          │ │
│ │ 🕐 Last active 1 day ago                                 │ │
│ │ ⚠️  Risk: Medium (65/100)                       [Revoke] │ │
│ └──────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

**Fonctionnalités :**

- **Session courante** : Affichée séparément, badge "This Device"
- **Autres sessions** : Liste avec détails complets
- **Indicateurs visuels** :
  - Badge risque coloré (vert/orange/rouge)
  - Icône appareil (desktop/mobile/tablet)
  - Localisation avec flag pays
- **Actions** :
  - Revoke session individuelle
  - Logout All Devices (sauf courante)

**Composant à créer : `components/security/SessionCard.tsx`**

Composant carte pour afficher session.

**Props :**

- session : objet Session complet
- isCurrent : boolean
- onRevoke : callback revoke

**Affichage :**

- Icône appareil (🖥️ 📱 💻)
- Device type + browser + OS
- Localisation (ville, pays, IP partielle)
- Last activity relative ("2 hours ago")
- Badge risk_score coloré
- Bouton Revoke (si pas current)

**Page à créer : `app/[locale]/admin/security/sessions/page.tsx`**

Page Admin pour superviser toutes sessions actives tenant.

**Fonctionnalités :**

- Vue globale sessions actives
- Filtres : Member, Risk level, Device type
- Détection anomalies temps réel
- Actions admin : Force logout membre

### 🎬 RÉSULTAT DÉMONTRABLE

**Scénario démo complet pour le sponsor :**

**1. Connexion normale**

- User se connecte depuis laptop
- Session créée automatiquement
- Voir dans Settings > Security > Sessions
- Session listée avec détails complets

**2. Connexion multi-appareils**

- User se connecte depuis téléphone
- Session créée, 2 sessions actives
- Voir les 2 sessions dans liste
- Laptop marqué "This Device"

**3. Détection risque moyen**

- User se connecte depuis VPN (IP différent pays)
- Risk score = 65 (MEDIUM)
- Session créée avec badge orange
- Email alerte envoyé : "New login from unusual location"

**4. Revoke session**

- User clique Revoke sur session téléphone
- Modal confirmation
- Confirmer
- Session révoquée, disparaît de liste
- Téléphone déconnecté instantanément

**5. Logout all devices**

- User clique "Logout All Devices"
- Modal liste toutes sessions sauf current
- Confirmer
- Toutes sessions révoquées
- Seul laptop reste connecté

**6. Admin view (cas compromission)**

- Admin va dans Security > Sessions
- Filtre par member compromis
- Voit 5 sessions actives dont 2 HIGH RISK
- Clique "Force Logout All"
- Toutes sessions membre révoquées
- Membre reçoit email notification

**Critères d'acceptation :**

- ✅ Session créée automatiquement à chaque login
- ✅ Metadata complète (IP, user-agent, device)
- ✅ Risk score calculé et affiché
- ✅ Limite max sessions respectée
- ✅ Revoke session fonctionne
- ✅ Logout all devices fonctionne
- ✅ Expiration automatique par cron
- ✅ Admin peut forcer logout membre
- ✅ Alertes envoyées si risque élevé

### ⏱️ ESTIMATION

- Temps backend : **6 heures**
  - SessionService : 3h
  - Risk score algorithm : 1h
  - SessionRepository : 1h
  - Cron jobs : 1h
- Temps API : **2 heures**
  - GET/POST /sessions : 1h
  - Revoke endpoints : 1h
- Temps frontend : **4 heures**
  - Page user sessions : 2h
  - Page admin sessions : 2h
- **TOTAL : 12 heures (1.5 jours)**

### 🔗 DÉPENDANCES

**Prérequis obligatoires :**

- Chapitre 1.2 terminé (adm_members)
- Clerk auth configuré
- GeoIP service (MaxMind ou IP2Location)

**Services/composants requis :**

- NotificationService (alertes)
- AuditService (logging)

**Données de test nécessaires :**

- 1 member avec 3+ sessions actives
- Sessions avec différents IP/user-agent

### ✅ CHECKLIST DE VALIDATION

- [ ] **Backend** : SessionService compile, toutes méthodes implémentées
- [ ] **Backend** : Risk score algorithm fonctionne
- [ ] **Backend** : Cron expiration fonctionne
- [ ] **API** : GET /api/v1/auth/sessions liste sessions
- [ ] **API** : POST /api/v1/auth/sessions crée session
- [ ] **API** : POST /revoke révoque session
- [ ] **API** : POST /revoke-all révoque toutes sessions
- [ ] **Frontend** : Page user sessions affiche liste
- [ ] **Frontend** : Revoke fonctionne
- [ ] **Frontend** : Logout all devices fonctionne
- [ ] **Frontend** : Page admin sessions fonctionne
- [ ] **Tests** : Test création session avec risk score
- [ ] **Tests** : Test limite max sessions
- [ ] **Tests** : Test revoke session
- [ ] **Démo** : Sponsor peut voir sessions et révoquer

---

# ÉTAPE 3.3 : NOTIFICATION LOGS

**Durée :** 1 jour ouvré (8 heures)  
**Objectif :** Implémenter historique complet notifications avec tracking délivrabilité  
**Livrable démo :** Interface Admin pour consulter historique notifications et debug "Email non reçu"

---

## 🎯 RATIONNEL MÉTIER

**POURQUOI :** Chaque notification envoyée (email, SMS, Slack) doit être tracée pour 3 raisons critiques : 1) Debug "Je n'ai pas reçu l'email" (preuve d'envoi), 2) Conformité RGPD (traçabilité communications), 3) Analytics (taux ouverture emails, engagement utilisateurs).

**QUEL PROBLÈME :** Sans logs notifications, impossible de répondre à : "Avez-vous envoyé l'invitation ?" → Aucune preuve. "Pourquoi je ne reçois pas les emails ?" → Impossible de débugger (problème Resend ? Email en spam ? Adresse invalide ?). Pas de métriques engagement (0% taux ouverture = emails ignorés ? Ou problème délivrabilité ?).

**IMPACT SI ABSENT :**

- **Support surchargé** : 50% tickets "Email non reçu" = 100h/mois perdues
- **Conformité** : RGPD exige preuve consentement = impossible sans logs
- **Fraude** : Utilisateur nie avoir reçu invitation = litige juridique sans preuve
- **Qualité** : Emails en spam systématiquement = non détecté sans analytics
- **Facturation** : Impossible de facturer Resend correctement (combien emails envoyés ?)

**CAS D'USAGE CONCRET :**

**Scénario 1 : Debug "Email non reçu"**

**Lundi 10 nov - 10h00 : Invitation envoyée**

1. Admin Ahmed invite sarah@abclogistics.ae
2. InvitationService crée invitation
3. NotificationService.sendEmail() appelé :
   - template_id : "invitation_sent"
   - recipient_email : sarah@abclogistics.ae
   - variables : { inviter_name, tenant_name, accept_url }
4. Email envoyé via Resend API
5. Log créé dans adm_notification_logs :
   ```json
   {
     "id": "uuid",
     "tenant_id": "abc-logistics-id",
     "template_id": "invitation_sent",
     "recipient_email": "sarah@abclogistics.ae",
     "channel": "email",
     "status": "sent",
     "provider": "resend",
     "provider_message_id": "re_abc123def456",
     "sent_at": "2025-11-10T10:00:00Z",
     "metadata": {
       "subject": "[FleetCore] Ahmed vous invite",
       "variables": {...}
     }
   }
   ```

**Lundi 10 nov - 14h00 : Sarah appelle support** 6. Sarah : "Je n'ai pas reçu l'email d'invitation" 7. Agent support recherche dans historique :

- GET /api/v1/admin/notifications?recipient=sarah@abclogistics.ae

8. Trouve log invitation :
   - Status : "sent" ✅
   - Provider message ID : re_abc123def456 ✅
   - Sent at : 10 nov 10h00 ✅
   - Opened at : NULL ❌
   - Clicked at : NULL ❌
9. Agent vérifie Resend dashboard avec message_id
10. Resend indique : "Email delivered, not opened"
11. Agent conclut : Email bien envoyé ET délivré, mais pas ouvert
12. Agent à Sarah : "L'email a été envoyé et délivré à 10h ce matin. Vérifiez vos spams. Si toujours rien, je renvoie."
13. Sarah vérifie spams, trouve l'email ✅
14. Agent met à jour log :
    - metadata.resolution = "found_in_spam"
    - metadata.support_ticket_id = "TICKET-123"

**Valeur business :**

- **Temps résolution** : 2 minutes au lieu de 30 minutes (sans logs)
- **Satisfaction client** : Preuve immédiate envoi = confiance
- **Économie coûts** : Pas de renvoi inutile (email déjà délivré)

**Scénario 2 : Détection emails spam**

**Analyse hebdomadaire :**

1. Admin consulte Analytics > Notifications
2. Voit metrics :
   - Emails sent : 1,000
   - Emails delivered : 980 (98% ✅)
   - Emails opened : 300 (30% ⚠️)
   - Emails clicked : 150 (15%)
3. Taux ouverture 30% = très bas (normal 60%+)
4. Admin filtre par template :
   - invitation_sent : 80% ouverture ✅
   - password_reset : 90% ouverture ✅
   - weekly_report : 5% ouverture ❌
5. Conclusion : Weekly reports vont en spam
6. Actions correctives :
   - Améliorer subject line weekly report
   - Ajouter "Add to contacts" CTA
   - Tester nouveau design email
7. Semaine suivante : Weekly report 55% ouverture ✅

### 📊 DONNÉES ET RÈGLES MÉTIER

**Table principale : `adm_notification_logs`**

**Colonnes critiques (17 colonnes) :**

| Colonne                 | Type         | Obligatoire | Utilité Business                                                        |
| ----------------------- | ------------ | ----------- | ----------------------------------------------------------------------- |
| **id**                  | uuid         | OUI         | Identifiant unique log (PK)                                             |
| **tenant_id**           | uuid         | NON         | Tenant destinataire (NULL si notif provider/system)                     |
| **template_id**         | varchar(50)  | OUI         | Template utilisé (invitation_sent, etc.)                                |
| **recipient_email**     | varchar(255) | NON         | Email destinataire (si channel=email)                                   |
| **recipient_phone**     | varchar(20)  | NON         | Téléphone destinataire (si channel=sms)                                 |
| **channel**             | text         | OUI         | Canal envoi (email, sms, slack, push)                                   |
| **status**              | text         | OUI         | État envoi (pending, sent, delivered, opened, clicked, bounced, failed) |
| **provider**            | varchar(50)  | OUI         | Fournisseur (resend, twilio, slack)                                     |
| **provider_message_id** | varchar(255) | NON         | ID message chez provider (pour tracking)                                |
| **error_message**       | text         | NON         | Message erreur si échec                                                 |
| **sent_at**             | timestamp    | NON         | Date envoi effectif                                                     |
| **delivered_at**        | timestamp    | NON         | Date délivrance confirmée                                               |
| **opened_at**           | timestamp    | NON         | Date première ouverture (email)                                         |
| **clicked_at**          | timestamp    | NON         | Date premier clic (email)                                               |
| **bounced_at**          | timestamp    | NON         | Date bounce (email invalide)                                            |
| **metadata**            | jsonb        | NON         | Données additionnelles (subject, variables, resolution)                 |
| **created_at**          | timestamp    | OUI         | Date création log                                                       |

**Statuts possibles et transitions :**

```
ÉTAT : pending (en attente)
├─ CONDITIONS : Log créé, envoi pas encore tenté
├─ DURÉE : <1 seconde (queue traitement)
└─ TRANSITIONS :
   ├─ → sent (envoi réussi provider)
   └─ → failed (échec envoi)

ÉTAT : sent (envoyé)
├─ CONDITIONS : Provider a accepté l'email/SMS
├─ PREUVE : provider_message_id renseigné
└─ TRANSITIONS :
   ├─ → delivered (confirmé reçu par destinataire)
   ├─ → bounced (email invalide)
   └─ → failed (erreur provider)

ÉTAT : delivered (délivré)
├─ CONDITIONS : Provider confirme réception par destinataire
├─ TIMING : +5 secondes à +2 minutes après sent
└─ TRANSITIONS :
   ├─ → opened (email ouvert)
   └─ (reste delivered si jamais ouvert)

ÉTAT : opened (ouvert)
├─ CONDITIONS : Pixel tracking détecte ouverture email
├─ TIMING : Variable (5 min à 7 jours)
└─ TRANSITIONS :
   └─ → clicked (lien cliqué)

ÉTAT : clicked (cliqué)
├─ CONDITIONS : Lien dans email cliqué
├─ MÉTRIQUE : Engagement maximum
└─ TRANSITIONS : Aucune (état final optimal)

ÉTAT : bounced (rebond)
├─ CONDITIONS : Email invalide/inexistant
├─ TYPES :
│  ├─ Hard bounce : Email n'existe pas (définitif)
│  └─ Soft bounce : Boîte pleine (temporaire)
└─ TRANSITIONS : Aucune (état final)

ÉTAT : failed (échec)
├─ CONDITIONS : Erreur envoi (API down, quota dépassé)
├─ RETRY : 3 tentatives automatiques
└─ TRANSITIONS :
   └─ → sent (retry réussi)
```

**Règles de tracking webhooks provider :**

```
WEBHOOK RESEND : email.sent
  Reçu quand Resend accepte l'email
  Action :
    - Trouver log par provider_message_id
    - Mettre à jour status = 'sent'
    - Renseigner sent_at = webhook.timestamp

WEBHOOK RESEND : email.delivered
  Reçu quand email délivré à destination
  Action :
    - Mettre à jour status = 'delivered'
    - Renseigner delivered_at = webhook.timestamp

WEBHOOK RESEND : email.opened
  Reçu quand pixel tracking détecte ouverture
  Action :
    - Mettre à jour status = 'opened'
    - Renseigner opened_at = webhook.timestamp (première fois seulement)

WEBHOOK RESEND : email.clicked
  Reçu quand lien cliqué dans email
  Action :
    - Mettre à jour status = 'clicked'
    - Renseigner clicked_at = webhook.timestamp (première fois)

WEBHOOK RESEND : email.bounced
  Reçu quand email bounce (invalide)
  Action :
    - Mettre à jour status = 'bounced'
    - Renseigner bounced_at = webhook.timestamp
    - Renseigner error_message = webhook.reason
    - Marquer recipient_email comme invalide dans tenant
```

**Règles de retry automatique :**

```
RÈGLE RETRY : 3 tentatives avec backoff exponentiel
  SI status = 'failed' ET retry_count < 3
  ALORS
    - Attendre : 2^retry_count minutes (1min, 2min, 4min)
    - Retenter envoi
    - Incrémenter retry_count
    - SI succès : status = 'sent'
    - SI échec final : status = 'failed' définitif
```

**Règles de rétention données :**

```
RÈGLE RÉTENTION 1 : Logs récents (90 jours)
  Tous logs < 90 jours : Conservation complète

RÈGLE RÉTENTION 2 : Logs anciens (>90 jours)
  Logs 90j-1an : Anonymiser recipient (garder stats)
  Logs >1an : Archiver S3 + supprimer de DB chaud

RÈGLE RÉTENTION 3 : Conformité RGPD
  Sur demande effacement utilisateur :
    - Anonymiser recipient_email dans logs
    - Garder metadata.anonymized = true
    - Conserver stats agrégées
```

**Règles de validation (via NotificationLogCreateSchema Zod) :**

- Template_id : requis, doit exister dans notification_templates
- Recipient_email OU recipient_phone : au moins un requis selon channel
- Channel : enum valide (email, sms, slack, push)
- Provider : enum valide (resend, twilio, slack)
- Status : enum valide (pending, sent, delivered, etc.)

**Règles de cohérence inter-colonnes :**

- Channel = email ⇒ recipient_email obligatoire
- Channel = sms ⇒ recipient_phone obligatoire
- Status = sent ⇒ sent_at, provider_message_id obligatoires
- Status = delivered ⇒ delivered_at obligatoire
- Status = opened ⇒ opened_at obligatoire
- Status = bounced ⇒ bounced_at, error_message obligatoires

### 🏗️ COMPOSANTS À DÉVELOPPER

#### Backend (Service Layer)

**Note importante :** Le NotificationService existe déjà (créé Phase 0.4). Cette étape ajoute uniquement les méthodes de consultation logs et analytics.

**Modification fichier : `lib/services/notifications/notification.service.ts`**

Ajouter méthodes consultation historique.

**Méthode getHistory(filters: NotificationFilters) → Promise<NotificationLog[]>**

1. Construire query Prisma avec filtres :
   - tenant_id (optionnel, NULL pour logs system)
   - recipient_email (partial match)
   - template_id
   - channel
   - status
   - date_from, date_to
2. Trier par created_at DESC
3. Paginer (limit, offset)
4. Inclure metadata
5. Retourner liste logs

**Méthode getAnalytics(tenantId: string, dateRange: DateRange) → Promise<NotificationAnalytics>**

1. Calculer métriques agrégées :
   ```json
   {
     "total_sent": 1000,
     "total_delivered": 980,
     "total_opened": 300,
     "total_clicked": 150,
     "total_bounced": 20,
     "total_failed": 5,
     "delivery_rate": 98.0,
     "open_rate": 30.0,
     "click_rate": 15.0,
     "bounce_rate": 2.0,
     "by_template": {
       "invitation_sent": {
         "sent": 200,
         "opened": 160,
         "open_rate": 80.0
       },
       "weekly_report": {
         "sent": 500,
         "opened": 25,
         "open_rate": 5.0
       }
     },
     "by_channel": {
       "email": { "sent": 900, "open_rate": 32.0 },
       "sms": { "sent": 100, "delivery_rate": 99.0 }
     }
   }
   ```
2. Retourner analytics

**Méthode handleWebhook(provider: string, payload: any) → Promise<void>**

1. Valider signature webhook (Resend, Twilio)
2. Parser payload selon provider
3. Trouver log par provider_message_id
4. Mettre à jour status selon event type
5. Renseigner timestamps appropriés
6. Créer audit log si changement critique

**Fichier à créer : `lib/repositories/notifications/notification-log.repository.ts`**

Repository pour accès Prisma à la table adm_notification_logs.

**Méthode findByProviderMessageId(messageId: string) → Promise<NotificationLog | null>**

1. Chercher log par provider_message_id (unique)
2. Retourner log ou null

**Méthode findByRecipient(email: string, tenantId: string) → Promise<NotificationLog[]>**

1. Chercher tous logs avec recipient_email = email
2. Filtrer par tenant_id si fourni
3. Trier par created_at DESC
4. Retourner logs

#### API REST (Endpoints)

**Fichier à créer : `app/api/v1/admin/notifications/route.ts`**

**GET /api/v1/admin/notifications**

- **Description** : Liste historique notifications tenant
- **Query params** :
  - recipient : filter par email/phone
  - template_id : filter par template
  - channel : filter par canal
  - status : filter par statut
  - date_from, date_to : plage dates
  - limit, offset : pagination
- **Permissions** : notifications.read
- **Réponse 200** :

```json
{
  "notifications": [
    {
      "id": "uuid",
      "template_id": "invitation_sent",
      "recipient_email": "sarah@abclogistics.ae",
      "channel": "email",
      "status": "delivered",
      "provider": "resend",
      "provider_message_id": "re_abc123",
      "sent_at": "2025-11-10T10:00:00Z",
      "delivered_at": "2025-11-10T10:00:15Z",
      "opened_at": null,
      "metadata": {
        "subject": "[FleetCore] Ahmed vous invite"
      }
    }
  ],
  "total": 1500,
  "page": 1,
  "per_page": 50
}
```

**Fichier à créer : `app/api/v1/admin/notifications/analytics/route.ts`**

**GET /api/v1/admin/notifications/analytics**

- **Description** : Analytics notifications agrégées
- **Query params** :
  - date_from, date_to : plage dates
  - group_by : template, channel, day
- **Permissions** : notifications.read
- **Réponse 200** :

```json
{
  "summary": {
    "total_sent": 1000,
    "delivery_rate": 98.0,
    "open_rate": 30.0,
    "click_rate": 15.0
  },
  "by_template": [...],
  "by_channel": [...],
  "timeline": [
    {"date": "2025-11-10", "sent": 150, "opened": 45},
    {"date": "2025-11-11", "sent": 180, "opened": 54}
  ]
}
```

**Fichier à créer : `app/api/webhooks/resend/route.ts`**

**POST /api/webhooks/resend**

- **Description** : Webhook Resend pour tracking emails
- **Body** : Payload Resend (signé)
- **Permissions** : Aucune (webhook public avec signature)
- **Réponse 200** : `{ "success": true }`

#### Frontend (Interface Utilisateur)

**Fichier à créer : `app/[locale]/admin/notifications/page.tsx`**

Page Admin pour consulter historique notifications.

**Layout de la page :**

```
┌──────────────────────────────────────────────────────────────┐
│ HEADER                                                        │
│ Notifications > History                                       │
└──────────────────────────────────────────────────────────────┘
┌──────────────────────────────────────────────────────────────┐
│ FILTERS                                                       │
│ Recipient: [______] Template: [All▼] Status: [All▼] [Search]│
└──────────────────────────────────────────────────────────────┘
┌──────────────────────────────────────────────────────────────┐
│ STATS CARDS                                                   │
│ ┌─────────┬──────────┬──────────┬──────────┐               │
│ │ Sent    │ Delivered│ Opened   │ Bounced  │               │
│ │ 1,000   │ 980 98%  │ 300 30%  │ 20 2%    │               │
│ └─────────┴──────────┴──────────┴──────────┘               │
└──────────────────────────────────────────────────────────────┘
┌──────────────────────────────────────────────────────────────┐
│ NOTIFICATIONS TABLE                                           │
│ ┌────────────────────────────────────────────────────────┐  │
│ │Recipient      │Template        │Status    │Sent      │  │
│ ├────────────────────────────────────────────────────────┤  │
│ │sarah@abc.ae   │invitation_sent │Delivered │2h ago    │  │
│ │               │                │✅        │          │  │
│ ├────────────────────────────────────────────────────────┤  │
│ │john@abc.ae    │password_reset  │Opened    │1d ago    │  │
│ │               │                │📖 30m ago│          │  │
│ ├────────────────────────────────────────────────────────┤  │
│ │bad@invalid.   │invitation_sent │Bounced   │2d ago    │  │
│ │               │                │❌        │          │  │
│ └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

**Fonctionnalités :**

- **Filtres** : Recipient, Template, Status, Date range
- **Stats cards** : Métriques agrégées temps réel
- **Table** : Liste logs avec détails
- **Indicateurs visuels** :
  - Badge coloré status (vert=delivered, bleu=opened, rouge=bounced)
  - Icône canal (📧 email, 📱 SMS)
  - Timeline relative ("2h ago")

**Composant à créer : `components/admin/NotificationDetailModal.tsx`**

Modal détaillé notification (clic sur ligne).

**Contenu :**

- Template utilisé
- Recipient complet
- Timeline détaillée :
  ```
  Created : 10 Nov 10:00:00
  Sent    : 10 Nov 10:00:01 (+1s)
  Delivered: 10 Nov 10:00:15 (+14s)
  Opened  : 10 Nov 10:30:45 (+30m)
  Clicked : Not clicked
  ```
- Provider details (message_id, error si échec)
- Metadata complète (subject, variables)
- Actions :
  - Resend (si bounced/failed)
  - View in Resend dashboard (link externe)

**Page à créer : `app/[locale]/admin/notifications/analytics/page.tsx`**

Page analytics détaillées notifications.

**Widgets :**

- **Timeline chart** : Sent/Opened par jour (7/30/90 jours)
- **Funnel chart** : Sent → Delivered → Opened → Clicked
- **Template breakdown** : Table templates triés par open_rate
- **Channel comparison** : Email vs SMS performance
- **Bounce analysis** : Liste emails invalides à nettoyer

### 🎬 RÉSULTAT DÉMONTRABLE

**Scénario démo sponsor :**

**1. Consulter historique**

- Admin va Notifications > History
- Voit tableau notifications
- Filtres fonctionnent
- Stats cards mises à jour

**2. Debug "Email non reçu"**

- Entrer email dans filtre recipient
- Voir log invitation
- Status : Delivered ✅
- Opened : NULL (pas ouvert)
- Conclusion : Email bien envoyé

**3. Détails notification**

- Clic sur ligne log
- Modal détails s'ouvre
- Timeline complète visible
- Provider message ID affiché
- Link Resend dashboard

**4. Analytics engagement**

- Aller Notifications > Analytics
- Voir metrics :
  - Open rate : 32%
  - Click rate : 15%
- Breakdown par template
- Weekly report : 5% open rate ❌
- Identifier problème

**5. Webhook tracking**

- Resend webhook reçu (email ouvert)
- Log mis à jour automatiquement
- Status : opened
- Opened_at : timestamp

**Critères d'acceptation :**

- ✅ Log créé pour chaque notification
- ✅ Webhooks Resend trackés
- ✅ Status updated automatiquement
- ✅ Historique consultable avec filtres
- ✅ Analytics agrégées disponibles
- ✅ Modal détails complet
- ✅ Debug "Email non reçu" fonctionnel
- ✅ Rétention données RGPD respectée

### ⏱️ ESTIMATION

- Temps backend : **2 heures**
  - Méthodes consultation : 1h
  - Webhook handler : 1h
- Temps API : **2 heures**
  - GET /notifications : 1h
  - GET /analytics : 1h
- Temps frontend : **4 heures**
  - Page history : 2h
  - Page analytics : 1h
  - Modal détails : 1h
- **TOTAL : 8 heures (1 jour)**

### 🔗 DÉPENDANCES

**Prérequis obligatoires :**

- NotificationService existe (Phase 0.4)
- Resend configuré avec webhooks
- Table adm_notification_logs existante

**Services/composants requis :**

- NotificationService (déjà créé)
- Webhook endpoint Resend

**Données de test nécessaires :**

- 100+ logs notifications test
- Logs avec différents statuts

### ✅ CHECKLIST DE VALIDATION

- [ ] **Backend** : Méthodes getHistory() et getAnalytics() fonctionnent
- [ ] **Backend** : Webhook handler Resend fonctionne
- [ ] **API** : GET /api/v1/admin/notifications retourne historique
- [ ] **API** : GET /api/v1/admin/notifications/analytics retourne metrics
- [ ] **API** : POST /api/webhooks/resend traite webhooks
- [ ] **Frontend** : Page history affiche logs
- [ ] **Frontend** : Filtres fonctionnent
- [ ] **Frontend** : Page analytics affiche charts
- [ ] **Tests** : Test création log
- [ ] **Tests** : Test webhook tracking
- [ ] **Démo** : Sponsor peut debug "Email non reçu"

---

# RÉCAPITULATIF CHAPITRE 3

## Durée Totale

| Étape                     | Durée        | Composants                                                     |
| ------------------------- | ------------ | -------------------------------------------------------------- |
| **3.1 Invitations**       | 12h (1.5j)   | InvitationService, API (4 routes), UI Admin + Accept page      |
| **3.2 Sessions**          | 12h (1.5j)   | SessionService, Risk scoring, API (5 routes), UI User + Admin  |
| **3.3 Notification Logs** | 8h (1j)      | Consultation logs, Analytics, Webhooks, UI History + Analytics |
| **TOTAL**                 | **32h (4j)** | **3 tables complètes**                                         |

## Livrables Finaux Chapitre 3

**Tables implémentées (3) :**

- ✅ adm_invitations (17 colonnes, 4 statuts)
- ✅ adm_member_sessions (15 colonnes, risk scoring)
- ✅ adm_notification_logs (17 colonnes, webhooks tracking)

**Services backend (2 nouveaux + 1 étendu) :**

- ✅ InvitationService (8 méthodes)
- ✅ SessionService (8 méthodes)
- ✅ NotificationService étendu (3 méthodes ajoutées)

**APIs REST (12 routes) :**

- ✅ 4 routes invitations
- ✅ 5 routes sessions
- ✅ 3 routes notifications/analytics

**UI Pages (6) :**

- ✅ Admin invitations management
- ✅ Public invitation accept
- ✅ User active sessions
- ✅ Admin sessions monitoring
- ✅ Admin notifications history
- ✅ Admin notifications analytics

**Fonctionnalités clés :**

- ✅ Invitations sécurisées token unique + expiration 7j
- ✅ Relances automatiques J+2 et J-1 expiration
- ✅ Sessions trackées avec risk scoring
- ✅ Détection anomalies (nouveau pays/appareil)
- ✅ Limite max sessions simultanées
- ✅ Historique complet notifications
- ✅ Tracking webhooks Resend (opened, clicked, bounced)
- ✅ Analytics engagement (open rate, click rate)
- ✅ Debug "Email non reçu" en 2 min

**Valeur business :**

- ⏱️ Time to first login : 3j → 30min (acceptation immédiate)
- 📈 Taux acceptation invitations : 20% → 80% (relances auto)
- 🔒 Détection fraude : 100% tentatives suspectes bloquées
- 🎯 Temps résolution support : 30min → 2min (logs traçables)
- 💰 Économie support : 100h/mois (tickets "Email non reçu" résolus instantanément)

---

**FIN DU CHAPITRE 3 - ONBOARDING COMPLET**

**Version:** 1.0 DÉFINITIVE  
**Date:** 10 Novembre 2025  
**Durée totale:** 32 heures (4 jours ouvrés)  
**Tables:** 3/14 module ADM (21% progression)
