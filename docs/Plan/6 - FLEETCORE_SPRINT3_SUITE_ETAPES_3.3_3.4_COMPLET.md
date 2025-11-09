# FLEETCORE - PLAN D'EXÉCUTION SPRINT 3

## SUITE : ÉTAPES 3.3 & 3.4 (Member Management & RBAC)

**Date:** 8 Novembre 2025  
**Version:** 1.0 SUITE FINALE  
**Durée:** Complément Sprint 3 (intégré dans les 3 jours)

---

## ÉTAPE 3.3 : Member Management & Invitations

### 🎯 RATIONNEL MÉTIER

**POURQUOI :** Une organisation client (tenant) n'est pas composée d'un seul utilisateur. Le client a besoin d'inviter son équipe : managers, dispatchers, comptables, mécaniciens, etc. Chaque membre doit avoir un accès adapté à son rôle. Sans système d'invitation structuré, le client doit demander à FleetCore de créer manuellement chaque compte = friction massive et mauvaise expérience.

**QUEL PROBLÈME :** Actuellement, quand un client veut ajouter un utilisateur :

1. Le client envoie un email à support@fleetcore.com
2. Support crée un ticket
3. Tech crée le compte manuellement (10 min)
4. Tech envoie les credentials par email (risque sécurité)
5. Utilisateur doit changer le mot de passe temporaire
6. **Délai total : 24-48h** par utilisateur
7. **Risques sécurité** : Credentials en clair dans emails

De plus, impossible pour le client de gérer lui-même son équipe (ajouter, retirer, changer rôles). Résultat : tickets support constants, frustration client, et coût opérationnel élevé (5h/semaine équipe support pour gestion utilisateurs).

**IMPACT SI ABSENT :**

- **Friction onboarding** : Client ne peut pas inviter son équipe = bloqué à 1 utilisateur
- **Coût support** : 5h/semaine × 52 semaines = 260h/an gaspillées
- **Expérience client** : Attente 24-48h pour chaque utilisateur = frustration
- **Sécurité** : Credentials temporaires par email = vulnérabilité
- **Autonomie client** : Dépendant de FleetCore pour gérer son équipe = mauvaise perception
- **Scalabilité** : Impossible de scaler à 1000+ tenants avec processus manuel

**CAS D'USAGE CONCRET :**
ABC Logistics a activé son compte. Ahmed (admin) veut inviter son équipe de 8 personnes :

- 1 Fleet Manager (Sara)
- 2 Dispatchers (Khalid, Fatima)
- 1 Comptable (Noor)
- 3 Mécaniciens (Ali, Hassan, Omar)
- 1 Directeur (Mohammed)

**Sans Member Management (avant) :**

- Ahmed envoie email support avec liste 8 personnes + rôles
- Support crée ticket (temps réponse : 24h)
- Tech crée 8 comptes manuellement (1h20 total)
- Tech envoie 8 emails avec credentials temporaires
- Chaque utilisateur doit se connecter, changer mot de passe
- Problème : Ali (mécanicien) reçoit accès Manager par erreur = risque
- Correction nécessite nouveau ticket
- **Temps total : 3 jours**, équipe d'Ahmed bloquée

**Avec Member Management automatisé (après) :**

- Ahmed se connecte à FleetCore
- Va dans Settings > Team
- Clique "Invite Members"
- Remplit formulaire batch :
  - Email : sara@abclogistics.ae, Rôle : Manager
  - Email : khalid@abclogistics.ae, Rôle : Operator
  - Email : fatima@abclogistics.ae, Rôle : Operator
  - (etc. pour les 8)
- Clique "Send Invitations"
- Système envoie 8 invitations sécurisées (magic links)
- Chaque personne reçoit email "Ahmed vous invite à rejoindre ABC Logistics sur FleetCore"
- Clique lien → Crée compte Clerk (mot de passe personnel) → Accès immédiat
- **Temps total : 5 minutes**, équipe d'Ahmed active le jour même

**Valeur business :**

- **Autonomie client** : Client gère son équipe lui-même = 0 ticket support
- **Time-to-value** : 5 min au lieu de 3 jours = équipe productive immédiatement
- **Économies** : 260h support/an × 500€/jour = 65,000€/an économisés
- **Sécurité** : Magic links sécurisés au lieu de credentials temporaires
- **Expérience** : Client ravi de l'autonomie et de la simplicité

### 📊 DONNÉES ET RÈGLES MÉTIER

**Tables impliquées :**

- **adm_invitations** (invitations en attente)
- **adm_members** (membres actifs)
- **adm_roles** (rôles assignés)
- **adm_tenants** (quotas max_members)
- **adm_audit_logs** (tracking actions)

**Colonnes critiques adm_invitations :**

| Colonne              | Type      | Obligatoire | Utilité Business                                     |
| -------------------- | --------- | ----------- | ---------------------------------------------------- |
| **id**               | uuid      | AUTO        | Identifiant unique                                   |
| **tenant_id**        | uuid      | OUI         | Organisation cible                                   |
| **email**            | varchar   | OUI         | Email personne invitée                               |
| **first_name**       | varchar   | NON         | Prénom (optionnel, améliore email)                   |
| **last_name**        | varchar   | NON         | Nom (optionnel)                                      |
| **role_id**          | uuid      | OUI         | Rôle à assigner                                      |
| **invited_by**       | uuid      | OUI         | Member qui a envoyé invitation                       |
| **invitation_type**  | enum      | OUI         | initial_admin, team_member, external_partner         |
| **status**           | enum      | AUTO        | pending, accepted, expired, revoked                  |
| **invitation_token** | varchar   | AUTO        | Token unique sécurisé (magic link)                   |
| **invitation_url**   | text      | AUTO        | URL complète invitation                              |
| **custom_message**   | text      | NON         | Message personnalisé pour invité                     |
| **expires_at**       | timestamp | AUTO        | Date expiration (7 jours par défaut)                 |
| **accepted_at**      | timestamp | NON         | Date acceptation                                     |
| **revoked_at**       | timestamp | NON         | Date révocation si annulée                           |
| **metadata**         | jsonb     | NON         | Données additionnelles (ex: permissions temporaires) |

**Colonnes critiques adm_members :**

| Colonne            | Type      | Obligatoire | Utilité Business                       |
| ------------------ | --------- | ----------- | -------------------------------------- |
| **id**             | uuid      | AUTO        | Identifiant unique                     |
| **tenant_id**      | uuid      | OUI         | Organisation                           |
| **clerk_user_id**  | varchar   | OUI         | ID Clerk (lien auth)                   |
| **role_id**        | uuid      | OUI         | Rôle actuel                            |
| **email**          | varchar   | OUI         | Email unique dans tenant               |
| **first_name**     | varchar   | OUI         | Prénom                                 |
| **last_name**      | varchar   | OUI         | Nom                                    |
| **phone_number**   | varchar   | NON         | Téléphone                              |
| **status**         | enum      | AUTO        | active, inactive, suspended            |
| **last_login_at**  | timestamp | NON         | Dernière connexion (tracking activité) |
| **invited_by**     | uuid      | NON         | Member qui a invité (traçabilité)      |
| **joined_at**      | timestamp | AUTO        | Date création compte                   |
| **deactivated_at** | timestamp | NON         | Date désactivation si applicable       |
| **metadata**       | jsonb     | NON         | Données profil additionnelles          |

**Cycle de vie d'une invitation :**

```
STATUTS ET TRANSITIONS :

1. pending (invitation envoyée, en attente)
   ↓ Invité clique lien et crée compte
2. accepted (invitation acceptée, member créé)

   OU

1. pending
   ↓ 7 jours écoulés sans action
2. expired (expirée)

   OU

1. pending
   ↓ Admin annule invitation
2. revoked (révoquée)
```

**Règles d'invitation :**

```
RÈGLE 1 : QUOTA MAX_MEMBERS
- Avant d'envoyer invitation, vérifier :
  COUNT(members WHERE tenant_id = X AND status = 'active') < tenant.max_members
- Si quota atteint : Erreur "Quota members atteint. Upgrade plan ou désactiver membres inactifs."

RÈGLE 2 : EMAIL UNIQUE PAR TENANT
- Un email ne peut avoir qu'un seul member actif par tenant
- Vérifier : NOT EXISTS(members WHERE tenant_id = X AND email = Y AND status = 'active')
- Si déjà membre : Erreur "Cette personne est déjà membre de l'organisation"

RÈGLE 3 : INVITATION UNIQUE PAR EMAIL
- Un email ne peut avoir qu'une seule invitation pending par tenant
- Vérifier : NOT EXISTS(invitations WHERE tenant_id = X AND email = Y AND status = 'pending')
- Si invitation pending existe déjà :
  - Option A : Renvoyer la même invitation (extend expiration)
  - Option B : Erreur "Invitation déjà envoyée à cet email"

RÈGLE 4 : EXPIRATION 7 JOURS
- Invitation expire automatiquement après 7 jours
- Cron job quotidien : UPDATE invitations SET status='expired' WHERE expires_at < NOW() AND status='pending'
- Après expiration, possible de renvoyer nouvelle invitation

RÈGLE 5 : RÉVOCATION POSSIBLE
- Admin peut révoquer invitation pending à tout moment
- Action : status = 'revoked', invitation_token invalidé
- Invité ne peut plus accepter (lien devient invalide)

RÈGLE 6 : PERMISSIONS INVITER
- Seuls les membres avec permission 'members.invite' peuvent inviter
- Généralement : Admin et Manager
- Operator ne peut pas inviter (sauf configuration custom)

RÈGLE 7 : RÔLE ASSIGNABLE
- Inviteur ne peut assigner que des rôles égaux ou inférieurs au sien
- Ex: Manager ne peut pas inviter un Admin
- Ex: Admin peut inviter Admin, Manager, Operator

RÈGLE 8 : TRACKING ORIGINE
- Chaque member a invited_by renseigné (traçabilité)
- Permet de savoir qui a invité qui
- Utile pour audits et investigations

RÈGLE 9 : NOTIFICATION INVITEUR
- Quand invitation acceptée, notifier inviteur
- Email : "Sara a rejoint votre équipe !"
- Permet à l'inviteur de suivre ses invitations
```

**Workflow invitation complète :**

```
ALGORITHME sendInvitation :
  ENTRÉE : {
    tenant_id,
    email,
    first_name (optionnel),
    last_name (optionnel),
    role_id,
    invited_by (member_id),
    custom_message (optionnel)
  }

  # ÉTAPE 1 : Vérifications préalables

  # 1.1 : Vérifier quota members
  current_members_count = COUNT(members WHERE tenant_id = X AND status = 'active')
  SI current_members_count >= tenant.max_members
    ALORS throw QuotaExceededError("Quota members atteint ({max_members})")
  FIN SI

  # 1.2 : Vérifier email pas déjà membre
  existing_member = members.findOne(tenant_id = X, email = Y, status = 'active')
  SI existing_member EXISTS
    ALORS throw BusinessRuleError("Cette personne est déjà membre")
  FIN SI

  # 1.3 : Vérifier invitation pending n'existe pas déjà
  existing_invitation = invitations.findOne(tenant_id = X, email = Y, status = 'pending')
  SI existing_invitation EXISTS
    ALORS
      # Option : Renvoyer invitation existante (extend expiration)
      existing_invitation.expires_at = NOW() + 7 jours
      existing_invitation.save()
      emailService.resendInvitation(existing_invitation)
      RETOURNER existing_invitation
  FIN SI

  # 1.4 : Vérifier inviteur a permission
  inviter = members.findById(invited_by)
  SI NOT inviter.hasPermission('members.invite')
    ALORS throw PermissionError("Vous n'avez pas la permission d'inviter")
  FIN SI

  # 1.5 : Vérifier rôle assignable
  target_role = roles.findById(role_id)
  inviter_role = inviter.role

  SI target_role.hierarchy_level > inviter_role.hierarchy_level
    ALORS throw BusinessRuleError("Vous ne pouvez pas assigner un rôle supérieur au vôtre")
  FIN SI

  # ÉTAPE 2 : Générer token sécurisé
  invitation_token = generateSecureToken() # 64 caractères aléatoires
  invitation_url = "https://app.fleetcore.com/accept-invitation?token=" + invitation_token

  # ÉTAPE 3 : Créer invitation dans DB
  invitation = invitations.create({
    tenant_id: tenant_id,
    email: email,
    first_name: first_name,
    last_name: last_name,
    role_id: role_id,
    invited_by: invited_by,
    invitation_type: 'team_member',
    status: 'pending',
    invitation_token: invitation_token,
    invitation_url: invitation_url,
    custom_message: custom_message,
    expires_at: NOW() + 7 jours,
    metadata: {
      sent_from_ip: request.ip,
      user_agent: request.user_agent
    }
  })

  # ÉTAPE 4 : Envoyer email invitation
  emailService.sendInvitationEmail({
    to: email,
    first_name: first_name,
    tenant_name: tenant.name,
    inviter_name: inviter.first_name + " " + inviter.last_name,
    role_name: target_role.name,
    invitation_url: invitation_url,
    custom_message: custom_message,
    expires_at: invitation.expires_at
  })

  # Email contient :
  # - "Ahmed vous invite à rejoindre ABC Logistics"
  # - Description rôle : "En tant que Manager, vous pourrez..."
  # - Bouton CTA : "Accepter l'invitation"
  # - Lien : invitation_url
  # - Expiration : "Cette invitation expire le {date}"
  # - Message custom si fourni

  # ÉTAPE 5 : Créer audit log
  auditService.logAction({
    tenant_id: tenant_id,
    actor_id: invited_by,
    action: 'invitation_sent',
    entity: 'invitations',
    entity_id: invitation.id,
    metadata: {
      invited_email: email,
      role_id: role_id
    }
  })

  # ÉTAPE 6 : Notifier inviteur (confirmation)
  notificationService.notify({
    member_id: invited_by,
    type: 'invitation_sent',
    title: "Invitation envoyée",
    message: "Invitation envoyée à {email} avec succès",
    metadata: { invitation_id: invitation.id }
  })

  SORTIE : invitation créée
```

**Workflow acceptation invitation :**

```
ALGORITHME acceptInvitation :
  ENTRÉE : invitation_token (depuis URL)

  # ÉTAPE 1 : Récupérer invitation
  invitation = invitations.findOne(invitation_token = token)

  SI invitation NOT EXISTS
    ALORS throw NotFoundError("Invitation non trouvée ou invalide")
  FIN SI

  # ÉTAPE 2 : Vérifier status
  SI invitation.status != 'pending'
    ALORS throw BusinessRuleError("Cette invitation a déjà été utilisée ou a expiré")
  FIN SI

  # ÉTAPE 3 : Vérifier expiration
  SI invitation.expires_at < NOW()
    ALORS
      invitation.status = 'expired'
      invitation.save()
      throw BusinessRuleError("Cette invitation a expiré")
  FIN SI

  # ÉTAPE 4 : Vérifier quota encore disponible
  current_members_count = COUNT(members WHERE tenant_id = invitation.tenant_id AND status = 'active')
  SI current_members_count >= tenant.max_members
    ALORS throw QuotaExceededError("Quota members atteint")
  FIN SI

  # ÉTAPE 5 : Rediriger vers Clerk signup
  # L'invité est redirigé vers Clerk pour créer son compte
  # Clerk gère :
  # - Email verification
  # - Mot de passe sécurisé
  # - 2FA (si activé par tenant)
  # - Création clerk_user

  # Une fois compte Clerk créé, webhook user.created reçu
  # Webhook contient : clerk_user_id, email, first_name, last_name

  # ÉTAPE 6 : Créer member dans DB (appelé par webhook Clerk)
  member = members.create({
    tenant_id: invitation.tenant_id,
    clerk_user_id: clerk_user_id, # Depuis webhook
    role_id: invitation.role_id,
    email: invitation.email,
    first_name: invitation.first_name OU clerk_first_name,
    last_name: invitation.last_name OU clerk_last_name,
    status: 'active',
    invited_by: invitation.invited_by,
    joined_at: NOW()
  })

  # ÉTAPE 7 : Assigner rôle dans Clerk
  clerkApi.organizations.updateMembership({
    organization_id: tenant.clerk_organization_id,
    user_id: clerk_user_id,
    role: mapRoleToClerkRole(invitation.role_id) # Admin → admin, Manager → member, etc.
  })

  # ÉTAPE 8 : Mettre à jour invitation
  invitation.status = 'accepted'
  invitation.accepted_at = NOW()
  invitation.save()

  # ÉTAPE 9 : Créer lifecycle event tenant
  lifecycleEvents.create({
    tenant_id: tenant_id,
    event_type: 'member_joined',
    description: "{member.first_name} {member.last_name} a rejoint l'organisation",
    effective_date: NOW(),
    metadata: {
      member_id: member.id,
      invitation_id: invitation.id,
      role_id: invitation.role_id
    }
  })

  # ÉTAPE 10 : Créer audit log
  auditService.logAction({
    tenant_id: tenant_id,
    actor_id: member.id,
    action: 'invitation_accepted',
    entity: 'invitations',
    entity_id: invitation.id,
    metadata: {
      member_created_id: member.id
    }
  })

  # ÉTAPE 11 : Notifier inviteur
  notificationService.notify({
    member_id: invitation.invited_by,
    type: 'invitation_accepted',
    title: "Invitation acceptée",
    message: "{member.first_name} a rejoint votre équipe !",
    metadata: {
      member_id: member.id,
      invitation_id: invitation.id
    }
  })

  # ÉTAPE 12 : Envoyer email bienvenue au nouveau membre
  emailService.sendWelcomeEmail({
    to: member.email,
    first_name: member.first_name,
    tenant_name: tenant.name,
    role_name: role.name,
    login_url: "https://app.fleetcore.com"
  })

  SORTIE : member créé et actif
```

**Gestion des membres existants :**

```
ACTIONS MEMBRES :

1. DÉSACTIVER (Soft Delete)
   - Member.status = 'inactive'
   - Member.deactivated_at = NOW()
   - Révoquer toutes sessions Clerk actives
   - Ne PEUT PLUS se connecter
   - Données historiques préservées (audits, logs)
   - Quota members libéré (count only active)

2. RÉACTIVER
   - Member.status = 'active'
   - Member.deactivated_at = NULL
   - Peut se reconnecter
   - Quota members consommé à nouveau

3. CHANGER RÔLE
   - Member.role_id = new_role_id
   - Mettre à jour Clerk organization membership
   - Permissions appliquées immédiatement
   - Audit log créé

4. SUPPRIMER (Hard Delete)
   - Supprimer member de DB
   - Supprimer user de Clerk organization
   - ATTENTION : Perd toutes données historiques
   - Utilisé seulement si RGPD right to be forgotten

5. SUSPENDRE TEMPORAIREMENT
   - Member.status = 'suspended'
   - Raison : violation politique, enquête interne, etc.
   - Révoquer sessions actives
   - Peut être réactivé plus tard
```

**Règles de batch invitations :**

```
FONCTIONNALITÉ : Inviter plusieurs personnes en une fois

INPUT :
invitations_batch = [
  { email: 'sara@abc.ae', role_id: 'manager-role-id', first_name: 'Sara' },
  { email: 'khalid@abc.ae', role_id: 'operator-role-id', first_name: 'Khalid' },
  { email: 'fatima@abc.ae', role_id: 'operator-role-id', first_name: 'Fatima' },
  # ... jusqu'à 50 max par batch
]

RÈGLES :
1. Max 50 invitations par batch (éviter spam)
2. Vérifier quota AVANT d'envoyer toutes invitations
   - Si quota = 20, members actuels = 15, batch = 10 → OK (15+10 = 25 > 20 mais 15 < 20)
   - Prévenir : "Attention : 5 invitations dépasseront votre quota"
3. Traiter chaque invitation individuellement
4. Si une échoue, continuer les autres (ne pas bloquer tout le batch)
5. Retourner résultat détaillé :
   {
     total: 10,
     sent: 8,
     failed: 2,
     failures: [
       { email: 'sara@abc.ae', reason: 'Already member' },
       { email: 'invalid@', reason: 'Invalid email format' }
     ]
   }
6. Envoyer email récapitulatif à l'inviteur
```

### 🏗️ COMPOSANTS À DÉVELOPPER

#### Backend (Service Layer)

**Fichier à créer : `lib/services/admin/invitation.service.ts`**

Service pour gérer le cycle de vie des invitations.

**Classe InvitationService extends BaseService :**

**Méthode sendInvitation(data: InvitationCreateInput) → Promise<Invitation>**
Implémente l'algorithme complet sendInvitation décrit ci-dessus.

1. Vérifier quota members
2. Vérifier email pas déjà membre
3. Vérifier invitation pending n'existe pas (ou extend si existe)
4. Vérifier permissions inviteur
5. Vérifier rôle assignable
6. Générer token sécurisé
7. Créer invitation DB
8. Envoyer email
9. Créer audit log
10. Notifier inviteur
11. Retourner invitation

**Méthode sendBatchInvitations(invitations: InvitationCreateInput[]) → Promise<BatchResult>**
Envoyer plusieurs invitations en une fois.

1. Valider batch (max 50)
2. Vérifier quota global
3. Pour chaque invitation :
   - Essayer sendInvitation()
   - Capturer erreurs individuelles
   - Continuer si erreur
4. Compiler résultats (sent, failed, failures)
5. Envoyer email récapitulatif inviteur
6. Retourner BatchResult

**Méthode acceptInvitation(token: string, clerkUserId: string) → Promise<Member>**
Accepter une invitation (appelé après création compte Clerk).
Implémente l'algorithme acceptInvitation décrit ci-dessus.

1. Récupérer invitation par token
2. Vérifier status pending
3. Vérifier non expirée
4. Vérifier quota disponible
5. Créer member dans DB
6. Assigner rôle Clerk
7. Mettre à jour invitation status accepted
8. Créer lifecycle event
9. Créer audit log
10. Notifier inviteur
11. Envoyer email bienvenue
12. Retourner member créé

**Méthode revokeInvitation(invitationId: string, revokedBy: string) → Promise<Invitation>**
Révoquer une invitation pending.

1. Récupérer invitation
2. Vérifier status pending
3. Status = 'revoked'
4. revoked_at = maintenant
5. Invalider token
6. Créer audit log
7. Notifier invité (email "Invitation annulée")
8. Retourner invitation révoquée

**Méthode resendInvitation(invitationId: string) → Promise<Invitation>**
Renvoyer une invitation (extend expiration).

1. Récupérer invitation
2. Vérifier status pending
3. Extend expires_at (+7 jours)
4. Générer nouveau token (sécurité)
5. Envoyer email à nouveau
6. Créer audit log
7. Retourner invitation mise à jour

**Méthode expireInvitations() → Promise<number>**
Expirer invitations automatiquement (cron job).

1. Trouver invitations pending avec expires_at < NOW()
2. Mettre à jour status = 'expired'
3. Créer audit logs
4. Retourner nombre invitations expirées

**Méthode findPendingInvitations(tenantId: string) → Promise<Invitation[]>**
Liste invitations en attente d'un tenant.

1. Requête invitations WHERE tenant_id = X AND status = 'pending'
2. Trier par created_at DESC
3. Inclure relations (role, invited_by member)
4. Retourner liste

**Fichier à créer : `lib/services/admin/member.service.ts`**

Service pour gérer les membres.

**Classe MemberService extends BaseService :**

**Méthode createMemberFromInvitation(invitation: Invitation, clerkUserId: string) → Promise<Member>**
Créer member après acceptation invitation (appelé par invitationService).

1. Créer member dans DB
2. Assigner rôle
3. Créer lifecycle event
4. Créer audit log
5. Retourner member

**Méthode deactivateMember(memberId: string, deactivatedBy: string, reason?: string) → Promise<Member>**
Désactiver un membre (soft delete).

1. Récupérer member
2. Vérifier status active
3. Status = 'inactive'
4. deactivated_at = maintenant
5. Révoquer sessions Clerk
6. Créer lifecycle event "member_deactivated"
7. Créer audit log avec raison
8. Envoyer email membre (notification désactivation)
9. Retourner member désactivé

**Méthode reactivateMember(memberId: string, reactivatedBy: string) → Promise<Member>**
Réactiver un membre désactivé.

1. Récupérer member
2. Vérifier status inactive
3. Vérifier quota members disponible
4. Status = 'active'
5. deactivated_at = NULL
6. Créer lifecycle event "member_reactivated"
7. Créer audit log
8. Envoyer email membre (notification réactivation)
9. Retourner member réactivé

**Méthode changeRole(memberId: string, newRoleId: string, changedBy: string) → Promise<Member>**
Changer le rôle d'un membre.

1. Récupérer member et new_role
2. Vérifier permissions changedBy (peut modifier rôles)
3. Vérifier new_role pas supérieur à rôle de changedBy
4. Mettre à jour member.role_id
5. Mettre à jour Clerk organization membership
6. Créer lifecycle event "member_role_changed"
7. Créer audit log
8. Notifier membre (email "Votre rôle a changé")
9. Retourner member mis à jour

**Méthode deleteMember(memberId: string, deletedBy: string, reason: string) → Promise<void>**
Supprimer membre définitivement (hard delete, RGPD).

1. Récupérer member
2. Vérifier permissions deletedBy (superadmin only)
3. Créer backup données member (RGPD compliance)
4. Supprimer user de Clerk organization
5. Soft delete member (deleted_at = NOW()) - garde trace
6. Créer lifecycle event "member_deleted"
7. Créer audit log avec raison
8. Envoyer email confirmation membre
9. Retour void

**Méthode getMembers(tenantId: string, filters?: MemberFilters) → Promise<Member[]>**
Liste membres d'un tenant avec filtres.

1. Requête members WHERE tenant_id = X
2. Appliquer filtres :
   - status : active, inactive, suspended
   - role_id : filtrer par rôle
   - search : chercher dans first_name, last_name, email
3. Inclure relations (role, invited_by)
4. Trier par last_login_at DESC (actifs en premier)
5. Pagination
6. Retourner liste

**Méthode getMemberStats(tenantId: string) → Promise<MemberStats>**
Statistiques membres d'un tenant.

1. Compter members par status (active, inactive, suspended)
2. Compter members par rôle
3. Calculer taux utilisation quota (current / max × 100)
4. Identifier members inactifs (last_login_at > 30 jours)
5. Retourner objet :

```typescript
{
  total_members: 15,
  active: 12,
  inactive: 2,
  suspended: 1,
  quota_used_percent: 60, // 12/20
  by_role: {
    'Admin': 2,
    'Manager': 5,
    'Operator': 5
  },
  inactive_members: [
    { id: 'uuid', name: 'Ali Hassan', last_login: '2025-09-15' }
  ]
}
```

**Méthode updateLastLogin(memberId: string) → Promise<void>**
Mettre à jour last_login_at (appelé à chaque connexion).

1. Mettre à jour member.last_login_at = NOW()
2. Retour void (performance, pas d'audit log)

**Fichier à créer : `lib/repositories/admin/invitation.repository.ts`**

Repository pour encapsuler accès Prisma à adm_invitations.

**Méthode findByToken(token: string) → Promise<Invitation | null>**
Cherche invitation par token.

**Méthode findPendingByEmail(tenantId: string, email: string) → Promise<Invitation | null>**
Cherche invitation pending pour un email dans un tenant.

**Méthode findExpired() → Promise<Invitation[]>**
Requête optimisée pour trouver invitations expirées (cron).

**Fichier à créer : `lib/repositories/admin/member.repository.ts`**

Repository pour encapsuler accès Prisma à adm_members.

**Méthode findByClerkUserId(clerkUserId: string) → Promise<Member | null>**
Cherche member par clerk_user_id (auth middleware).

**Méthode findByEmail(tenantId: string, email: string) → Promise<Member | null>**
Cherche member par email dans un tenant.

**Méthode countActive(tenantId: string) → Promise<number>**
Compte members actifs (pour vérification quota).

#### API REST (Endpoints)

**Fichier à créer : `app/api/v1/admin/invitations/route.ts`**

**GET /api/v1/admin/invitations**

- **Description** : Liste invitations du tenant
- **Query params** :
  - status : filter par status (pending, accepted, expired, revoked)
  - role_id : filter par rôle
- **Permissions** : invitations.read (admin ou manager)
- **Réponse 200** :

```json
{
  "invitations": [
    {
      "id": "uuid",
      "email": "sara@abclogistics.ae",
      "first_name": "Sara",
      "role": {
        "id": "uuid-role",
        "name": "Manager"
      },
      "status": "pending",
      "invited_by": {
        "id": "uuid-member",
        "name": "Ahmed Al-Mansoori"
      },
      "created_at": "2026-01-15T10:00:00Z",
      "expires_at": "2026-01-22T10:00:00Z"
    }
  ],
  "total": 5,
  "pending": 3,
  "accepted": 1,
  "expired": 1
}
```

- **Erreurs** : 403 si permission manquante

**POST /api/v1/admin/invitations**

- **Description** : Envoyer une invitation
- **Body** : InvitationCreateInput

```json
{
  "email": "sara@abclogistics.ae",
  "first_name": "Sara",
  "last_name": "Al-Rashid",
  "role_id": "uuid-manager-role",
  "custom_message": "Bienvenue dans l'équipe !"
}
```

- **Permissions** : members.invite (admin ou manager)
- **Réponse 201** : Invitation créée
- **Erreurs** :
  - 400 : Validation échouée (email invalide)
  - 409 : Email déjà membre
  - 422 : Quota members atteint

**POST /api/v1/admin/invitations/batch**

- **Description** : Envoyer plusieurs invitations
- **Body** : InvitationBatchInput

```json
{
  "invitations": [
    { "email": "sara@abc.ae", "role_id": "uuid-manager", "first_name": "Sara" },
    {
      "email": "khalid@abc.ae",
      "role_id": "uuid-operator",
      "first_name": "Khalid"
    },
    {
      "email": "fatima@abc.ae",
      "role_id": "uuid-operator",
      "first_name": "Fatima"
    }
  ]
}
```

- **Permissions** : members.invite
- **Réponse 200** : BatchResult

```json
{
  "total": 3,
  "sent": 2,
  "failed": 1,
  "results": [
    { "email": "sara@abc.ae", "status": "sent", "invitation_id": "uuid" },
    { "email": "khalid@abc.ae", "status": "sent", "invitation_id": "uuid" },
    { "email": "fatima@abc.ae", "status": "failed", "error": "Already member" }
  ]
}
```

- **Erreurs** : 400 si batch > 50

**Fichier à créer : `app/api/v1/admin/invitations/[id]/route.ts`**

**DELETE /api/v1/admin/invitations/[id]**

- **Description** : Révoquer une invitation
- **Permissions** : invitations.revoke (admin ou inviteur)
- **Réponse 200** : Invitation révoquée
- **Erreurs** : 422 si déjà acceptée ou expirée

**POST /api/v1/admin/invitations/[id]/resend**

- **Description** : Renvoyer une invitation
- **Permissions** : invitations.resend
- **Réponse 200** : Invitation renvoyée (expiration étendue)

**Fichier à créer : `app/api/v1/admin/invitations/accept/route.ts`**

**POST /api/v1/admin/invitations/accept**

- **Description** : Accepter une invitation (appelé après Clerk signup)
- **Body** :

```json
{
  "invitation_token": "64-char-secure-token",
  "clerk_user_id": "user_xxx"
}
```

- **Authentification** : Public (avant auth) OU Clerk webhook
- **Réponse 200** : Member créé

```json
{
  "member_id": "uuid",
  "tenant_id": "uuid-tenant",
  "role_id": "uuid-role",
  "invitation_accepted": true
}
```

- **Erreurs** :
  - 404 : Token invalide
  - 410 : Invitation expirée
  - 422 : Quota members atteint

**Fichier à créer : `app/api/v1/admin/members/route.ts`**

**GET /api/v1/admin/members**

- **Description** : Liste membres du tenant
- **Query params** :
  - status : filter par status
  - role_id : filter par rôle
  - search : chercher dans nom/email
  - limit, offset : pagination
- **Permissions** : members.read (tous les membres peuvent lire)
- **Réponse 200** :

```json
{
  "members": [
    {
      "id": "uuid",
      "first_name": "Ahmed",
      "last_name": "Al-Mansoori",
      "email": "ahmed@abclogistics.ae",
      "role": {
        "id": "uuid-role",
        "name": "Admin"
      },
      "status": "active",
      "last_login_at": "2026-01-15T14:30:00Z",
      "joined_at": "2026-01-01T10:00:00Z"
    }
  ],
  "total": 12,
  "stats": {
    "active": 12,
    "inactive": 0,
    "quota_used_percent": 60
  }
}
```

**Fichier à créer : `app/api/v1/admin/members/[id]/route.ts`**

**GET /api/v1/admin/members/[id]**

- **Description** : Détails d'un membre
- **Permissions** : members.read
- **Réponse 200** : Member avec relations

**PATCH /api/v1/admin/members/[id]**

- **Description** : Modifier un membre (nom, email, etc.)
- **Body** : MemberUpdateInput
- **Permissions** : members.update (admin uniquement)
- **Réponse 200** : Member mis à jour

**DELETE /api/v1/admin/members/[id]**

- **Description** : Désactiver un membre (soft delete)
- **Permissions** : members.delete (admin uniquement)
- **Réponse 200** : Member désactivé
- **Erreurs** : 422 si tente de désactiver dernier admin

**Fichier à créer : `app/api/v1/admin/members/[id]/deactivate/route.ts`**

**POST /api/v1/admin/members/[id]/deactivate**

- **Description** : Désactiver un membre
- **Body** :

```json
{
  "reason": "Left company"
}
```

- **Permissions** : members.deactivate (admin)
- **Réponse 200** : Member désactivé

**Fichier à créer : `app/api/v1/admin/members/[id]/reactivate/route.ts`**

**POST /api/v1/admin/members/[id]/reactivate**

- **Description** : Réactiver un membre
- **Permissions** : members.reactivate (admin)
- **Réponse 200** : Member réactivé
- **Erreurs** : 422 si quota members atteint

**Fichier à créer : `app/api/v1/admin/members/[id]/change-role/route.ts`**

**POST /api/v1/admin/members/[id]/change-role**

- **Description** : Changer le rôle d'un membre
- **Body** :

```json
{
  "new_role_id": "uuid-new-role"
}
```

- **Permissions** : members.change_role (admin ou manager)
- **Réponse 200** : Member avec nouveau rôle
- **Erreurs** : 422 si tente d'assigner rôle supérieur

**Fichier à créer : `app/api/cron/invitations/expire/route.ts`**

**GET /api/cron/invitations/expire**

- **Description** : Cron job quotidien pour expirer invitations
- **Authentification** : CRON_SECRET
- **Traitement** :
  - Appeler invitationService.expireInvitations()
  - Mettre à jour status pending → expired si expires_at < NOW()
- **Réponse 200** :

```json
{
  "expired_count": 12,
  "executed_at": "2026-01-15T02:00:00Z"
}
```

#### Frontend (Interface Utilisateur)

**Fichier à créer : `app/[locale]/settings/team/page.tsx`**

Page principale gestion d'équipe (visible tous membres, actions selon permissions).

**Layout de la page :**

```
┌──────────────────────────────────────────────────────────────┐
│ HEADER                                                        │
│ [FleetCore Logo] Settings > Team          [+ Invite Members]│
└──────────────────────────────────────────────────────────────┘
┌──────────────────────────────────────────────────────────────┐
│ TEAM STATS                                                    │
│ ┌──────────┬──────────┬──────────┬──────────┐              │
│ │ Members  │ Quota    │ Pending  │ Inactive │              │
│ │ 12       │ 60%      │ 3        │ 2        │              │
│ │ 🟢       │ ━━━━━░░░ │ ⏳       │ 💤       │              │
│ └──────────┴──────────┴──────────┴──────────┘              │
└──────────────────────────────────────────────────────────────┘
┌──────────────────────────────────────────────────────────────┐
│ TABS                                                          │
│ [Active Members] [Pending Invitations] [Inactive Members]    │
└──────────────────────────────────────────────────────────────┘
┌──────────────────────────────────────────────────────────────┐
│ ACTIVE MEMBERS (Tab 1)                                       │
│ ┌────────┬──────────┬────────┬────────┬─────────┐          │
│ │ Member │ Role     │ Status │ Last   │ Actions │          │
│ ├────────┼──────────┼────────┼────────┼─────────┤          │
│ │Ahmed   │Admin     │🟢Active│2h ago  │[...]    │          │
│ │Sara    │Manager   │🟢Active│1d ago  │[Change] │          │
│ │Khalid  │Operator  │🟢Active│5m ago  │[Change] │          │
│ │Fatima  │Operator  │🟢Active│3h ago  │[Change] │          │
│ └────────┴──────────┴────────┴────────┴─────────┘          │
│ [1 2 >]                               Showing 1-10 of 12   │
└──────────────────────────────────────────────────────────────┘
┌──────────────────────────────────────────────────────────────┐
│ PENDING INVITATIONS (Tab 2)                                  │
│ ┌────────┬──────────┬────────┬────────┬─────────┐          │
│ │ Email  │ Role     │ Sent   │ Expires│ Actions │          │
│ ├────────┼──────────┼────────┼────────┼─────────┤          │
│ │noor@..│Operator  │2d ago  │5d left │[Resend] │          │
│ │ali@... │Operator  │3d ago  │4d left │[Resend] │          │
│ │hassan@│Operator  │1d ago  │6d left │[Revoke] │          │
│ └────────┴──────────┴────────┴────────┴─────────┘          │
└──────────────────────────────────────────────────────────────┘
┌──────────────────────────────────────────────────────────────┐
│ INACTIVE MEMBERS (Tab 3)                                     │
│ ┌────────┬──────────┬────────────┬─────────┐               │
│ │ Member │ Role     │ Deactivated│ Actions │               │
│ ├────────┼──────────┼────────────┼─────────┤               │
│ │Omar    │Operator  │15d ago     │[React.] │               │
│ │Hassan  │Operator  │30d ago     │[React.] │               │
│ └────────┴──────────┴────────────┴─────────┘               │
└──────────────────────────────────────────────────────────────┘
```

**Fonctionnalités :**

- **Team Stats** : Visualisation rapide (members actifs, quota, pending, inactive)
- **Tabs** : 3 onglets pour séparer actifs, invitations, inactifs
- **Bouton "+ Invite Members"** : Ouvre modal invitation
- **Actions par member selon permissions** :
  - Admin : Tous (Change Role, Deactivate, Delete)
  - Manager : Change Role (limité), Deactivate
  - Operator : Lecture seule

**Composant à créer : `components/admin/InviteMemberModal.tsx`**

Modal pour inviter un ou plusieurs membres.

**Deux modes :**

**Mode Single (défaut) :**

- **Email** : Input email (validation)
- **First Name** : Input prénom (optionnel)
- **Last Name** : Input nom (optionnel)
- **Role** : Dropdown avec rôles disponibles
- **Custom Message** : Textarea (optionnel, max 500 caractères)
- **Bouton** : "Send Invitation"

**Mode Batch (toggle) :**

- **Textarea** : Entrer plusieurs emails (un par ligne ou séparés par virgules)
- **Role** : Dropdown (même rôle pour tous)
- **Parse** : Bouton "Parse Emails" qui extrait et valide emails
- **Preview** : Liste emails détectés avec status (✅ Valid, ❌ Invalid, ⚠️ Already member)
- **Bouton** : "Send Invitations (X valid)"

**Validation :**

- Email format valide (regex)
- Rôle sélectionné requis
- Vérifier quota avant soumission :
  - Afficher warning si proche limite : "⚠️ 18/20 members. 2 invitations restantes."
  - Bloquer si quota atteint : "❌ Quota atteint. Upgrade plan ou désactivez membres."

**Soumission :**

- Mode Single : POST /api/v1/admin/invitations
- Mode Batch : POST /api/v1/admin/invitations/batch
- Si succès : ferme modal, toast "Invitation(s) envoyée(s)", refresh table
- Si erreur : affiche message erreur spécifique

**Composant à créer : `components/admin/MemberCard.tsx`**

Composant carte pour afficher un membre (version card pour vue grid alternative).

**Props :**

- member : objet Member complet
- onAction : callback pour actions (change role, deactivate)

**Affichage :**

- Avatar (initiales ou photo)
- Nom complet
- Email
- Badge rôle avec couleur
- Badge status (Active, Inactive, Suspended)
- Last login (ex: "Active 2h ago")
- Actions dropdown : [View Profile] [Change Role] [Deactivate]

**Composant à créer : `components/admin/ChangeRoleModal.tsx`**

Modal pour changer le rôle d'un membre.

**Champs :**

- **Current Role** : Affichage read-only (ex: "Operator")
- **New Role** : Dropdown avec rôles assignables
  - Filtré selon permissions utilisateur actuel
  - Ex: Manager ne peut pas assigner Admin
- **Reason** : Textarea optionnel (pour audit)

**Validation :**

- New role != current role
- New role assignable selon hiérarchie

**Soumission :**

- POST /api/v1/admin/members/[id]/change-role
- Si succès : ferme modal, toast "Rôle changé", refresh table
- Notification envoyée automatiquement au membre

**Composant à créer : `components/admin/PendingInvitationCard.tsx`**

Composant pour afficher une invitation pending.

**Props :**

- invitation : objet Invitation
- onResend : callback resend
- onRevoke : callback revoke

**Affichage :**

- Email invité
- Badge rôle
- Date envoi (ex: "Sent 2 days ago")
- Expiration countdown (ex: "Expires in 5 days")
  - Couleur : Vert si >4 jours, Orange si 2-4 jours, Rouge si <2 jours
- Invité par (nom member)
- Actions : [Resend] [Revoke]

**Fichier à créer : `app/accept-invitation/page.tsx`**

Page publique (avant auth) pour accepter une invitation.

**Flow :**

1. URL : https://app.fleetcore.com/accept-invitation?token=xxx
2. Page vérifie token via API
3. Si token valide et non expiré :
   - Afficher organisation name
   - Afficher rôle qui sera assigné
   - Bouton "Accept Invitation" → Redirige vers Clerk signup
4. Si token invalide ou expiré :
   - Afficher message erreur
   - Lien "Request New Invitation"

**Layout de la page :**

```
┌──────────────────────────────────────────────────────────────┐
│                      FLEETCORE                               │
│                                                              │
│              🎉 You're Invited!                              │
│                                                              │
│  Ahmed Al-Mansoori invited you to join                      │
│  ABC Logistics on FleetCore                                 │
│                                                              │
│  Role: Fleet Manager                                        │
│  As a Fleet Manager, you will be able to:                  │
│  • Manage vehicles and drivers                             │
│  • View reports and analytics                              │
│  • Assign trips and schedules                              │
│                                                              │
│  [Accept Invitation]                                        │
│                                                              │
│  This invitation expires on January 22, 2026               │
└──────────────────────────────────────────────────────────────┘
```

**Après clic "Accept Invitation" :**

- Redirige vers Clerk signup avec metadata :
  - invitation_token dans query param
  - Clerk publicMetadata: { invitation_token: 'xxx' }
- Après signup Clerk réussi, webhook user.created déclenché
- Webhook appelle invitationService.acceptInvitation()
- Member créé, invitation status = accepted
- User redirigé vers dashboard FleetCore

### 🎬 RÉSULTAT DÉMONTRABLE

**Scénario démo complet pour le sponsor :**

**1. Admin invite un membre (single)**

- Ahmed (admin) se connecte
- Va dans Settings > Team
- Voit stats : 1/20 members (5% quota)
- Clique "+ Invite Members"
- Modal s'ouvre
- Remplit :
  - Email : sara@abclogistics.ae
  - First Name : Sara
  - Last Name : Al-Rashid
  - Role : Manager
  - Custom Message : "Bienvenue dans l'équipe !"
- Clique "Send Invitation"
- Toast : "Invitation envoyée à sara@abclogistics.ae"
- Modal se ferme
- Tab "Pending Invitations" affiche nouvelle invitation

**2. Sara reçoit email et accepte**

- Sara ouvre email
- Voit : "Ahmed vous invite à rejoindre ABC Logistics"
- Clique bouton "Accepter l'invitation"
- Redirigée vers page accept-invitation
- Voit message : "Ahmed invited you to join ABC Logistics as Manager"
- Clique "Accept Invitation"
- Redirigée vers Clerk signup
- Crée son compte :
  - Email : sara@abclogistics.ae (pré-rempli, non modifiable)
  - Nom : Sara Al-Rashid (pré-rempli)
  - Mot de passe : **\*\*\*\*** (personnel, sécurisé)
- Webhook Clerk user.created déclenché
- Member créé automatiquement avec rôle Manager
- Invitation status = accepted
- Sara redirigée vers dashboard FleetCore
- Voit organisation "ABC Logistics" active

**3. Ahmed voit Sara dans équipe**

- Rafraîchir page Settings > Team
- Tab "Active Members" affiche Sara
- Stats mises à jour : 2/20 members (10%)
- Ahmed reçoit notification : "Sara a rejoint votre équipe !"

**4. Invitation batch (8 personnes)**

- Ahmed clique "+ Invite Members"
- Toggle "Batch Mode"
- Colle dans textarea :

```
khalid@abc.ae
fatima@abc.ae
noor@abc.ae
ali@abc.ae
hassan@abc.ae
omar@abc.ae
mohammed@abc.ae
invalid-email@
```

- Sélectionne Role : Operator
- Clique "Parse Emails"
- Voit preview :
  - ✅ khalid@abc.ae (Valid)
  - ✅ fatima@abc.ae (Valid)
  - ✅ noor@abc.ae (Valid)
  - ✅ ali@abc.ae (Valid)
  - ✅ hassan@abc.ae (Valid)
  - ✅ omar@abc.ae (Valid)
  - ✅ mohammed@abc.ae (Valid)
  - ❌ invalid-email@ (Invalid format)
- Clique "Send Invitations (7 valid)"
- Toast : "7 invitations envoyées, 1 échec"
- Tab "Pending Invitations" affiche 7 nouvelles invitations

**5. Vérification quota**

- Stats : 2 actifs + 7 pending = 9/20 (45%)
- Warning affiché : "⚠️ 9/20 members utilisés (45%)"
- Si tente d'inviter 15 personnes de plus :
  - Erreur : "❌ Quota atteint. Maximum 20 members."
  - Suggestion : "Upgrade to Standard plan (50 members)"

**6. Gestion invitation pending**

- Ahmed voit invitation de Noor en attente depuis 3 jours
- Clique action "Resend"
- Nouvelle invitation envoyée (expiration étendue)
- Toast : "Invitation renvoyée à noor@abc.ae"
- Ahmed décide d'annuler invitation à Omar
- Clique action "Revoke" sur invitation Omar
- Confirmation modal : "Êtes-vous sûr ?"
- Confirme
- Invitation status = revoked
- Omar ne peut plus accepter (lien invalide)

**7. Changement de rôle**

- Sara (Manager) veut promouvoir Khalid (Operator) en Manager
- Sara clique action "Change Role" sur ligne Khalid
- Modal s'ouvre
- Current Role : Operator
- New Role : Manager (dropdown)
- Reason : "Khalid showed great leadership"
- Clique "Change Role"
- Khalid.role_id mis à jour
- Khalid reçoit email : "Votre rôle a changé : Manager"
- Permissions Khalid mises à jour immédiatement

**8. Désactivation membre**

- Ali (Operator) a quitté l'entreprise
- Ahmed clique action "Deactivate" sur ligne Ali
- Modal confirmation :
  - "Deactivate Ali Hassan?"
  - Reason : "Left company"
  - "Member will lose access immediately"
- Confirme
- Ali.status = inactive
- Ali ne peut plus se connecter
- Stats : 9 actifs → 8 actifs
- Quota libéré : 8/20 (40%)
- Ali déplacé dans tab "Inactive Members"

**9. Réactivation membre**

- 2 semaines plus tard, Ali revient
- Ahmed va dans tab "Inactive Members"
- Clique action "Reactivate" sur ligne Ali
- Confirmation modal
- Confirme
- Ali.status = active
- Ali peut se reconnecter
- Stats : 8 → 9 actifs
- Ali retourne dans tab "Active Members"

**Critères d'acceptation :**

- ✅ Invitation single envoyée et reçue
- ✅ Invitation batch (7/8 réussies, 1 échec détecté)
- ✅ Email invitation avec logo, message personnalisé, CTA clair
- ✅ Page accept-invitation affiche infos correctes
- ✅ Acceptation invitation crée member automatiquement
- ✅ Rôle assigné correctement
- ✅ Webhook Clerk → Member créé seamlessly
- ✅ Quota vérifié avant invitation (warning ou erreur)
- ✅ Resend invitation étend expiration
- ✅ Revoke invitation invalide token
- ✅ Change role met à jour permissions immédiatement
- ✅ Deactivate member révoque accès immédiatement
- ✅ Reactivate member restaure accès
- ✅ Stats team mises à jour en temps réel
- ✅ Notifications inviteur (invitation accepted)
- ✅ Cron job expire invitations automatiquement

### ⏱️ ESTIMATION

- Temps backend : **16 heures**
  - InvitationService complet : 8h
  - MemberService complet : 6h
  - Repositories : 2h
- Temps API : **8 heures**
  - Endpoints invitations : 4h
  - Endpoints members : 4h
- Temps frontend : **12 heures**
  - Page Settings/Team : 4h
  - InviteMemberModal (single + batch) : 3h
  - ChangeRoleModal : 1h
  - MemberCard : 1h
  - PendingInvitationCard : 1h
  - Page accept-invitation : 2h
- **TOTAL : 36 heures (5 jours)**

**MAIS** : Intégré dans Sprint 3 (3 jours) car parallélisable avec Étape 3.2.

### 🔗 DÉPENDANCES

**Prérequis obligatoires :**

- Étape 3.2 terminée (tenants provisionnés)
- Clerk webhooks configurés (user.created, organization.member.created)
- Email service configuré (SendGrid ou similaire)
- Tables adm_invitations, adm_members, adm_roles existantes

**Services/composants requis :**

- TenantService (pour vérifier quotas)
- RoleService (pour assigner rôles)
- EmailService (pour envoyer invitations)
- Clerk SDK (pour créer users et memberships)

**Données de test nécessaires :**

- Tenants actifs avec quotas
- Rôles standards créés
- Email templates pour invitations

### ✅ CHECKLIST DE VALIDATION

- [ ] **Backend** : InvitationService.sendInvitation() vérifie quotas
- [ ] **Backend** : sendBatchInvitations() traite jusqu'à 50 invitations
- [ ] **Backend** : acceptInvitation() crée member après Clerk signup
- [ ] **Backend** : revokeInvitation() invalide token
- [ ] **Backend** : resendInvitation() étend expiration
- [ ] **Backend** : expireInvitations() cron fonctionne
- [ ] **Backend** : MemberService.deactivateMember() révoque sessions
- [ ] **Backend** : changeRole() met à jour Clerk et permissions
- [ ] **Backend** : Quota members vérifié avant toute invitation
- [ ] **API** : POST /invitations crée invitation
- [ ] **API** : POST /invitations/batch traite batch
- [ ] **API** : POST /invitations/accept accepte invitation
- [ ] **API** : DELETE /invitations/[id] révoque
- [ ] **API** : POST /invitations/[id]/resend renvoie
- [ ] **API** : GET /members liste avec filtres
- [ ] **API** : POST /members/[id]/deactivate désactive
- [ ] **API** : POST /members/[id]/reactivate réactive
- [ ] **API** : POST /members/[id]/change-role change rôle
- [ ] **API** : GET /cron/invitations/expire expire automatiquement
- [ ] **Frontend** : Page Team affiche 3 tabs (active, pending, inactive)
- [ ] **Frontend** : InviteMemberModal mode single fonctionne
- [ ] **Frontend** : InviteMemberModal mode batch fonctionne
- [ ] **Frontend** : Quota warning affiché si proche limite
- [ ] **Frontend** : Page accept-invitation affiche infos correctes
- [ ] **Frontend** : ChangeRoleModal change rôle
- [ ] **Frontend** : Actions member selon permissions (admin vs manager)
- [ ] **Tests** : 25+ tests unitaires InvitationService
- [ ] **Tests** : Test E2E invitation envoyée → acceptée → member créé
- [ ] **Tests** : Test batch invitations (success + failures)
- [ ] **Tests** : Test quota membres respecté
- [ ] **Tests** : Test webhook Clerk user.created crée member
- [ ] **Démo** : Sponsor invite 1 membre (single)
- [ ] **Démo** : Sponsor invite 8 membres (batch)
- [ ] **Démo** : Invité accepte invitation, account créé
- [ ] **Démo** : Sponsor change rôle membre
- [ ] **Démo** : Sponsor désactive/réactive membre
- [ ] **Démo** : Quota vérifié et respecté

---

## ÉTAPE 3.4 : RBAC & Permissions Granulaires

### 🎯 RATIONNEL MÉTIER

**POURQUOI :** Tous les utilisateurs d'une organisation n'ont pas besoin des mêmes accès. Un mécanicien ne doit pas pouvoir supprimer des contrats clients. Un dispatcher ne doit pas accéder aux données financières. Un comptable ne doit pas pouvoir assigner des trajets. Le RBAC (Role-Based Access Control) avec permissions granulaires assure que chaque utilisateur n'a accès qu'aux fonctionnalités dont il a besoin pour son travail.

**QUEL PROBLÈME :** Sans RBAC structuré :

- **Risque sécurité** : N'importe qui peut tout faire = fuites données, modifications accidentelles
- **Compliance** : RGPD, SOX, ISO27001 exigent access control rigoureux
- **Audit** : Impossible de tracer qui a fait quoi si pas de permissions
- **Erreurs humaines** : Opérateur supprime par erreur contrat important = perte business
- **Responsabilité** : Impossible d'assigner responsabilités claires si tout le monde peut tout faire

Actuellement, FleetCore V1 a des "rôles" très basiques (Admin, User) mais pas de permissions granulaires. Résultat : soit l'utilisateur est Admin (peut TOUT faire), soit User (peut presque rien faire). Impossible de créer un rôle "Comptable" qui peut accéder aux finances mais pas aux opérations, ou "Dispatcher" qui peut assigner trajets mais pas modifier véhicules.

**IMPACT SI ABSENT :**

- **Sécurité** : Fuite données sensibles (ex: salaires chauffeurs vus par dispatcher)
- **Compliance** : Impossible de certifier ISO27001 sans RBAC = perte clients B2B
- **Confiance client** : Client refuse d'utiliser FleetCore si "tout le monde voit tout"
- **Inefficacité** : Utilisateurs voient des menus/pages inutiles = UI confuse
- **Support** : Tickets "Comment je cache cette page à mon équipe ?" = impossible sans RBAC

**CAS D'USAGE CONCRET :**
ABC Logistics a 12 utilisateurs avec besoins différents :

**Sans RBAC (avant) :**

- Ahmed (Directeur) : Admin → Peut TOUT faire ✅
- Sara (Fleet Manager) : Admin → Peut TOUT faire ⚠️ (Trop de pouvoir, peut supprimer contrats par erreur)
- Noor (Comptable) : User → Peut RIEN faire ❌ (Même pas accéder aux factures !)
- Khalid (Dispatcher) : User → Peut RIEN faire ❌ (Même pas assigner trajets !)
- Ali (Mécanicien) : User → Peut RIEN faire ❌ (Même pas enregistrer maintenance !)

Résultat : Chaos total

- Sara demande : "Comment je peux voir rapports mais pas supprimer contrats ?"
- Noor demande : "Je dois créer factures, donnez-moi accès !"
- Ahmed doit mettre Noor Admin → Noor peut maintenant TOUT faire, y compris voir salaires chauffeurs (RGPD violation !)

**Avec RBAC granulaire (après) :**

Rôles configurés avec permissions précises :

**1. Admin (Ahmed)**

- Permissions : TOUTES (wildcards : _._)
- Peut : Tout gérer

**2. Fleet Manager (Sara)**

- Permissions :
  - ✅ vehicles.\* (read, create, update, delete)
  - ✅ drivers.\* (read, create, update, delete)
  - ✅ trips.\* (read, create, update, assign, cancel)
  - ✅ schedules.\* (read, create, update)
  - ✅ reports.read (peut voir rapports opérationnels)
  - ❌ contracts.\* (NE PEUT PAS voir/modifier contrats)
  - ❌ billing.\* (NE PEUT PAS voir finances)
  - ❌ members.\* (NE PEUT PAS gérer équipe)
- Résultat : Sara gère opérations mais ne peut pas toucher contrats/finances

**3. Comptable (Noor)**

- Permissions :
  - ✅ billing.\* (read, create, update invoices)
  - ✅ contracts.read (peut VOIR contrats pour facturation)
  - ✅ reports.billing (rapports financiers uniquement)
  - ❌ vehicles.\* (NE VOIT PAS véhicules, pas son job)
  - ❌ drivers.\* (NE VOIT PAS chauffeurs)
  - ❌ trips.\* (NE VOIT PAS opérations)
- Résultat : Noor accède factures/contrats mais ne voit rien d'opérationnel

**4. Dispatcher (Khalid)**

- Permissions :
  - ✅ trips.\* (read, create, update, assign, cancel)
  - ✅ schedules.\* (read, create, update)
  - ✅ vehicles.read (peut VOIR véhicules pour assigner)
  - ✅ drivers.read (peut VOIR chauffeurs pour assigner)
  - ❌ vehicles.update (NE PEUT PAS modifier véhicules)
  - ❌ drivers.update (NE PEUT PAS modifier infos chauffeurs)
  - ❌ billing.\* (NE VOIT PAS finances)
  - ❌ contracts.\* (NE VOIT PAS contrats)
- Résultat : Khalid assigne trajets efficacement mais ne peut rien casser

**5. Mécanicien (Ali)**

- Permissions :
  - ✅ maintenance.\* (read, create, update maintenance records)
  - ✅ vehicles.read (peut VOIR véhicules pour maintenance)
  - ✅ documents.upload (peut uploader photos réparations)
  - ❌ vehicles.update (NE PEUT PAS modifier infos administratives véhicule)
  - ❌ drivers.\* (NE VOIT PAS chauffeurs, pas son job)
  - ❌ trips.\* (NE VOIT PAS trajets)
  - ❌ billing.\* (NE VOIT PAS finances)
- Résultat : Ali enregistre maintenances mais ne peut pas toucher au reste

**Valeur business :**

- **Sécurité** : Données sensibles protégées (principe least privilege)
- **Compliance** : ISO27001, RGPD, SOX respectés = peut vendre B2B enterprise
- **Efficacité** : Chaque utilisateur voit seulement ce dont il a besoin = UI claire
- **Audit** : Traçabilité complète (qui a fait quoi, permissions à quel moment)
- **Confiance client** : Client sait que ses données sont protégées = +40% conversion B2B

### 📊 DONNÉES ET RÈGLES MÉTIER

**Tables impliquées :**

- **adm_roles** (définition rôles)
- **adm_permissions** (définition permissions système)
- **adm_role_permissions** (lien roles ↔ permissions, many-to-many)
- **adm_members** (lien member → role)
- **adm_audit_logs** (tracking actions avec permissions)

**Colonnes critiques adm_roles :**

| Colonne             | Type    | Obligatoire | Utilité Business                            |
| ------------------- | ------- | ----------- | ------------------------------------------- |
| **id**              | uuid    | AUTO        | Identifiant unique                          |
| **tenant_id**       | uuid    | OUI         | Organisation propriétaire rôle              |
| **name**            | varchar | OUI         | Nom rôle (ex: "Fleet Manager")              |
| **slug**            | varchar | AUTO        | Identifiant technique (ex: "fleet-manager") |
| **description**     | text    | NON         | Description rôle pour utilisateurs          |
| **is_system**       | boolean | OUI         | Rôle système (non modifiable/supprimable)   |
| **hierarchy_level** | integer | OUI         | Niveau hiérarchique (1=highest, 100=lowest) |
| **max_members**     | integer | NON         | Quota max membres dans ce rôle              |
| **color**           | varchar | NON         | Couleur badge UI (ex: "#3B82F6")            |
| **metadata**        | jsonb   | NON         | Données additionnelles                      |

**Colonnes critiques adm_permissions :**

| Colonne            | Type    | Obligatoire | Utilité Business                                     |
| ------------------ | ------- | ----------- | ---------------------------------------------------- |
| **id**             | uuid    | AUTO        | Identifiant unique                                   |
| **resource**       | varchar | OUI         | Ressource (ex: "vehicles", "contracts")              |
| **action**         | varchar | OUI         | Action (ex: "read", "create", "update", "delete")    |
| **permission_key** | varchar | AUTO        | Clé unique (ex: "vehicles.read", "contracts.delete") |
| **description**    | text    | OUI         | Description permission (UI)                          |
| **category**       | varchar | OUI         | Catégorie (Operations, Finance, Admin, CRM)          |
| **is_dangerous**   | boolean | OUI         | Permission sensible (ex: delete contracts)           |

**Colonnes critiques adm_role_permissions :**

| Colonne           | Type      | Obligatoire | Utilité Business      |
| ----------------- | --------- | ----------- | --------------------- |
| **role_id**       | uuid      | OUI         | Rôle                  |
| **permission_id** | uuid      | OUI         | Permission            |
| **granted_at**    | timestamp | AUTO        | Date attribution      |
| **granted_by**    | uuid      | NON         | Member qui a attribué |

**Hiérarchie des rôles :**

```
NIVEAUX HIÉRARCHIQUES (1 = highest, 100 = lowest)

Level 1 : OWNER / SUPER ADMIN
  - Créateur tenant ou FleetCore superadmin
  - Peut TOUT faire sans restriction
  - Permissions : *.* (wildcard all)
  - Max 2 members

Level 10 : ADMIN
  - Administrateur organisation
  - Peut presque tout (sauf supprimer tenant)
  - Permissions : Presque toutes sauf tenant.delete
  - Max 5 members

Level 20 : MANAGER
  - Manager opérationnel
  - Gère opérations quotidiennes
  - Permissions : Opérations + quelques admin
  - Max 20 members

Level 30 : SPECIALIST (Comptable, RH, etc.)
  - Spécialiste domaine spécifique
  - Permissions : Domaine métier uniquement
  - Max 10 members par spécialité

Level 40 : OPERATOR
  - Opérateur standard
  - Permissions : Lecture + création limitée
  - Unlimited members

Level 50 : VIEWER
  - Lecture seule
  - Permissions : Read-only
  - Unlimited members
```

**Structure des permissions (Naming Convention) :**

```
PERMISSION KEY FORMAT : {resource}.{action}

RESOURCES (exemples) :
- vehicles : Véhicules
- drivers : Chauffeurs
- trips : Trajets
- schedules : Plannings
- maintenance : Maintenances
- documents : Documents
- contracts : Contrats
- billing : Facturation
- reports : Rapports
- members : Membres équipe
- roles : Rôles
- settings : Paramètres
- crm_leads : Leads CRM
- crm_opportunities : Opportunités CRM

ACTIONS (standards) :
- read : Lire/voir
- create : Créer
- update : Modifier
- delete : Supprimer
- assign : Assigner (trajets, véhicules)
- approve : Approuver (dépenses, congés)
- export : Exporter données
- import : Importer données

EXEMPLES PERMISSION KEYS :
- vehicles.read : Peut voir liste véhicules
- vehicles.create : Peut créer nouveau véhicule
- vehicles.update : Peut modifier véhicule
- vehicles.delete : Peut supprimer véhicule
- trips.assign : Peut assigner trajets aux chauffeurs
- billing.approve : Peut approuver factures
- contracts.delete : Peut supprimer contrats (DANGEREUX)
- members.invite : Peut inviter membres
- roles.update : Peut modifier rôles (DANGEREUX)
- reports.export : Peut exporter rapports
- *.read : WILDCARD - Peut lire TOUTES ressources
- *.* : WILDCARD - Peut TOUT faire (GOD MODE)
```

**Permissions par rôle système (défaut) :**

```
RÔLE ADMIN (hierarchy_level = 10)
Permissions : [
  "*.read", # Peut lire TOUT
  "vehicles.*", # Peut tout faire véhicules
  "drivers.*",
  "trips.*",
  "schedules.*",
  "maintenance.*",
  "documents.*",
  "contracts.*",
  "billing.*",
  "reports.*",
  "members.*", # Peut gérer équipe
  "roles.read", # Peut voir rôles
  "settings.*", # Peut modifier paramètres
  "crm_leads.*",
  "crm_opportunities.*"
  # Exclusions :
  # - roles.update (ne peut pas modifier rôles, sauf Owner)
  # - roles.delete
  # - tenant.delete (ne peut pas supprimer tenant)
]

RÔLE MANAGER (hierarchy_level = 20)
Permissions : [
  "vehicles.*",
  "drivers.*",
  "trips.*",
  "schedules.*",
  "maintenance.read",
  "maintenance.create",
  "maintenance.update", # Peut gérer maintenances
  "documents.read",
  "documents.upload",
  "reports.read",
  "reports.export",
  "members.read", # Peut voir équipe
  "members.invite", # Peut inviter (limité à rôles inférieurs)
  # Exclusions :
  # - contracts.* (ne voit PAS contrats)
  # - billing.* (ne voit PAS finances)
  # - settings.* (ne peut PAS modifier paramètres)
  # - roles.* (ne peut PAS gérer rôles)
]

RÔLE COMPTABLE (hierarchy_level = 30, category = Finance)
Permissions : [
  "billing.*", # Tout sur facturation
  "contracts.read", # Peut VOIR contrats (pour facturation)
  "reports.billing", # Rapports financiers uniquement
  "documents.read", # Peut voir documents (factures, contrats)
  "documents.upload", # Peut uploader documents financiers
  # Exclusions :
  # - vehicles.* (ne voit PAS véhicules)
  # - drivers.* (ne voit PAS chauffeurs)
  # - trips.* (ne voit PAS trajets)
  # - contracts.update/delete (ne peut PAS modifier contrats)
]

RÔLE DISPATCHER (hierarchy_level = 40, category = Operations)
Permissions : [
  "trips.*", # Tout sur trajets
  "schedules.*", # Tout sur plannings
  "vehicles.read", # Peut VOIR véhicules (pour assigner)
  "drivers.read", # Peut VOIR chauffeurs (pour assigner)
  "reports.trips", # Rapports trajets uniquement
  # Exclusions :
  # - vehicles.update (ne peut PAS modifier véhicules)
  # - drivers.update (ne peut PAS modifier chauffeurs)
  # - billing.* (ne voit PAS finances)
  # - contracts.* (ne voit PAS contrats)
]

RÔLE MÉCANICIEN (hierarchy_level = 40, category = Maintenance)
Permissions : [
  "maintenance.*", # Tout sur maintenances
  "vehicles.read", # Peut VOIR véhicules
  "documents.read",
  "documents.upload", # Peut uploader photos réparations
  # Exclusions :
  # - vehicles.update (ne peut PAS modifier véhicules)
  # - drivers.* (ne voit PAS chauffeurs)
  # - trips.* (ne voit PAS trajets)
  # - billing.* (ne voit PAS finances)
]

RÔLE OPERATOR (hierarchy_level = 40, category = Operations)
Permissions : [
  "vehicles.read",
  "drivers.read",
  "trips.read",
  "trips.create", # Peut créer trajets
  "trips.update", # Peut modifier ses trajets
  "schedules.read",
  "maintenance.read",
  "maintenance.create", # Peut signaler problèmes
  "documents.read",
  "documents.upload",
  "reports.read" # Rapports basiques uniquement
  # Exclusions :
  # - trips.delete (ne peut PAS supprimer trajets)
  # - vehicles.update (ne peut PAS modifier véhicules)
  # - billing.* (ne voit PAS finances)
]

RÔLE VIEWER (hierarchy_level = 50, category = ReadOnly)
Permissions : [
  "*.read" # Lecture seule TOUT (sauf finances si pas autorisé)
  # Exclusions :
  # - *.create/update/delete (RIEN modifier)
  # - billing.* (ne voit PAS finances sauf si explicite)
]
```

**Règles de vérification permissions :**

```
ALGORITHME checkPermission :
  ENTRÉE : member, permission_key (ex: "vehicles.update")

  # ÉTAPE 1 : Récupérer rôle du member
  role = member.role

  # ÉTAPE 2 : Récupérer toutes permissions du rôle
  role_permissions = role.permissions # Array de permission_keys

  # ÉTAPE 3 : Vérifier wildcard GOD MODE
  SI role_permissions CONTIENT "*.*"
    ALORS RETOURNER true # Peut TOUT faire
  FIN SI

  # ÉTAPE 4 : Vérifier wildcard resource
  # Ex: member a "vehicles.*", demande "vehicles.update" → OK
  [resource, action] = permission_key.split('.')
  wildcard_resource = resource + ".*"

  SI role_permissions CONTIENT wildcard_resource
    ALORS RETOURNER true
  FIN SI

  # ÉTAPE 5 : Vérifier wildcard action
  # Ex: member a "*.read", demande "vehicles.read" → OK
  wildcard_action = "*." + action

  SI role_permissions CONTIENT wildcard_action
    ALORS RETOURNER true
  FIN SI

  # ÉTAPE 6 : Vérifier permission exacte
  SI role_permissions CONTIENT permission_key
    ALORS RETOURNER true
  FIN SI

  # ÉTAPE 7 : Aucune permission trouvée
  RETOURNER false
```

**Middleware permissions (API) :**

```
MIDDLEWARE requirePermission(permission_key) :
  ENTRÉE : HTTP request, permission_key

  # ÉTAPE 1 : Extraire member depuis auth token
  member = extractMemberFromToken(request.headers.authorization)

  SI member NOT EXISTS
    ALORS throw UnauthorizedError(401, "Not authenticated")
  FIN SI

  # ÉTAPE 2 : Vérifier tenant actif
  SI member.tenant.status != 'active'
    ALORS throw ForbiddenError(403, "Tenant suspended")
  FIN SI

  # ÉTAPE 3 : Vérifier member actif
  SI member.status != 'active'
    ALORS throw ForbiddenError(403, "Member inactive")
  FIN SI

  # ÉTAPE 4 : Vérifier permission
  has_permission = checkPermission(member, permission_key)

  SI NOT has_permission
    ALORS
      # Créer audit log tentative accès non autorisé
      auditService.logAction({
        tenant_id: member.tenant_id,
        actor_id: member.id,
        action: 'permission_denied',
        entity: 'permissions',
        metadata: {
          requested_permission: permission_key,
          route: request.path,
          method: request.method
        }
      })

      throw ForbiddenError(403, "Permission denied: " + permission_key)
  FIN SI

  # ÉTAPE 5 : Permission OK, continuer requête
  request.member = member # Inject member dans context
  NEXT()
```

**Composant React permissions (UI) :**

```jsx
COMPOSANT <Authorized> :
  PROPS : permission, children, fallback

  # Hook usePermissions récupère permissions member actuel depuis context
  const { hasPermission } = usePermissions()

  SI hasPermission(permission)
    ALORS RETURN children # Affiche contenu
  SINON
    SI fallback EXISTS
      ALORS RETURN fallback # Affiche composant alternatif
    SINON
      RETURN null # Cache complètement
    FIN SI
  FIN SI

EXEMPLE USAGE :
<Authorized permission="contracts.delete">
  <button>Delete Contract</button>
</Authorized>

# Si member n'a pas permission contracts.delete, bouton caché
```

**Règles de modification rôles :**

```
RÈGLES MODIFICATION RÔLES :

1. RÔLES SYSTÈME (is_system = true)
   - NE PEUVENT PAS être supprimés
   - NE PEUVENT PAS avoir name/slug modifié
   - PEUVENT avoir permissions modifiées (sauf Owner/SuperAdmin)
   - Ex: Admin, Manager, Operator sont système

2. RÔLES CUSTOM (is_system = false)
   - Créés par Admin/Owner
   - PEUVENT être modifiés librement
   - PEUVENT être supprimés (si aucun member ne l'utilise)
   - Ex: "Chef de Projet", "Contrôleur de Gestion"

3. PERMISSIONS DANGEREUSES (is_dangerous = true)
   - Requièrent confirmation explicite pour attribution
   - Audit log renforcé (qui a attribué, quand, pourquoi)
   - Ex: contracts.delete, members.delete, roles.update, tenant.delete
   - UI affiche warning : "⚠️ Cette permission est sensible"

4. HIÉRARCHIE RESPECTÉE
   - Member ne peut attribuer rôle supérieur au sien
   - Ex: Manager (level 20) ne peut créer rôle Admin (level 10)
   - Ex: Admin (level 10) peut créer Manager, Operator, Viewer

5. QUOTA MAX_MEMBERS
   - Rôle peut avoir max_members défini
   - Ex: Admin max 5, Manager max 20
   - Si quota atteint, impossible d'assigner rôle à nouveau member
   - UI affiche : "Quota Admin atteint (5/5)"

6. PERMISSIONS EXCLUSIVES
   - Certaines permissions s'excluent mutuellement
   - Ex: Si rôle a billing.*, ne peut pas avoir vehicles.* (séparation duties)
   - Configurable par tenant selon politique sécurité
```

### 🏗️ COMPOSANTS À DÉVELOPPER

#### Backend (Service Layer)

**Fichier à créer : `lib/services/admin/permission.service.ts`**

Service pour gérer permissions et vérifications RBAC.

**Classe PermissionService extends BaseService :**

**Méthode checkPermission(member: Member, permissionKey: string) → boolean**
Implémente l'algorithme checkPermission décrit ci-dessus.

1. Récupérer role du member avec permissions
2. Vérifier wildcards (_._, resource._, _.action)
3. Vérifier permission exacte
4. Retourner true/false

**Méthode checkMultiplePermissions(member: Member, permissionKeys: string[], requireAll: boolean = true) → boolean**
Vérifier plusieurs permissions à la fois.

1. Si requireAll = true : TOUTES permissions requises (AND)
2. Si requireAll = false : AU MOINS une permission requise (OR)
3. Pour chaque permissionKey, appeler checkPermission()
4. Retourner résultat selon logique AND/OR

**Méthode getAllPermissions() → Promise<Permission[]>**
Liste toutes les permissions système disponibles.

1. Requête permissions table
2. Grouper par category (Operations, Finance, Admin, CRM)
3. Trier par resource, action
4. Retourner liste complète

**Méthode getDangerousPermissions() → Promise<Permission[]>**
Liste permissions dangereuses (is_dangerous = true).

1. Requête permissions WHERE is_dangerous = true
2. Retourner liste

**Méthode syncPermissions() → Promise<number>**
Synchroniser permissions système (appelé au déploiement).

1. Définir liste complète permissions système (hardcoded)
2. Pour chaque permission dans liste :
   - Vérifier si existe dans DB (via permission_key)
   - Si n'existe pas : créer
   - Si existe : mettre à jour description si changée
3. Retourner nombre permissions synchronisées

**Fichier à créer : `lib/services/admin/role.service.ts`**

Service pour gérer rôles.

**Classe RoleService extends BaseService :**

**Méthode createRole(data: RoleCreateInput) → Promise<Role>**
Créer un nouveau rôle custom.

1. Valider data avec RoleCreateSchema
2. Vérifier permissions createdBy (roles.create)
3. Vérifier hierarchy_level pas supérieur à rôle createdBy
4. Générer slug depuis name
5. Créer role dans DB
6. Créer role_permissions (lien avec permissions)
7. Créer audit log
8. Retourner role créé

**Méthode updateRole(roleId: string, data: RoleUpdateInput) → Promise<Role>**
Modifier un rôle.

1. Récupérer role
2. Vérifier NOT is_system (rôles système limitent modifications)
3. Vérifier permissions updatedBy
4. Mettre à jour champs autorisés (name, description, color)
5. Créer audit log
6. Retourner role mis à jour

**Méthode updateRolePermissions(roleId: string, permissionIds: string[], updatedBy: string) → Promise<Role>**
Modifier permissions d'un rôle.

1. Récupérer role
2. Vérifier permissions updatedBy (roles.update_permissions)
3. Vérifier si permissions dangereuses ajoutées :
   - Si oui, créer audit log spécial (dangereux)
   - Envoyer notification Owner/Admin
4. Supprimer anciennes role_permissions
5. Créer nouvelles role_permissions
6. Créer audit log détaillé (permissions avant/après)
7. Retourner role mis à jour

**Méthode deleteRole(roleId: string, deletedBy: string) → Promise<void>**
Supprimer un rôle custom.

1. Récupérer role
2. Vérifier NOT is_system (rôles système non supprimables)
3. Vérifier permissions deletedBy
4. Vérifier aucun member ne l'utilise :
   - COUNT(members WHERE role_id = X) = 0
   - Si members existent : Erreur "Impossible de supprimer, membres utilisent ce rôle"
5. Supprimer role_permissions
6. Supprimer role
7. Créer audit log
8. Retour void

**Méthode getRoles(tenantId: string) → Promise<Role[]>**
Liste rôles d'un tenant.

1. Requête roles WHERE tenant_id = X
2. Inclure permissions (eager load)
3. Trier par hierarchy_level ASC (highest first)
4. Retourner liste

**Méthode getRoleWithPermissions(roleId: string) → Promise<Role>**
Détails complets rôle avec permissions.

1. Récupérer role avec relations
2. Inclure permissions avec détails (description, category, is_dangerous)
3. Inclure members_count (nombre members dans ce rôle)
4. Retourner role complet

**Méthode createSystemRoles(tenantId: string) → Promise<Role[]>**
Créer rôles système pour nouveau tenant (appelé au provisioning).

1. Définir rôles système standards (Admin, Manager, Operator)
2. Pour chaque rôle système :
   - Créer role dans DB
   - Assigner permissions par défaut
3. Retourner liste rôles créés

**Fichier à créer : `lib/middleware/auth.middleware.ts`**

Middleware Express pour auth et permissions.

**Fonction requireAuth()**
Middleware pour vérifier authentication Clerk.

1. Extraire token depuis headers Authorization
2. Vérifier token Clerk valide
3. Extraire clerk_user_id
4. Récupérer member depuis clerk_user_id
5. Vérifier member actif et tenant actif
6. Injecter member dans request.member
7. Next()

**Fonction requirePermission(permissionKey: string)**
Middleware pour vérifier permission spécifique.
Implémente l'algorithme middleware requirePermission décrit ci-dessus.

1. Vérifier member authentifié (requireAuth déjà appelé)
2. Vérifier permission via permissionService.checkPermission()
3. Si permission OK : Next()
4. Si permission KO : throw ForbiddenError(403) + audit log

**Fonction requireAnyPermission(permissionKeys: string[])**
Middleware pour vérifier AU MOINS une permission (OR).

1. Pour chaque permissionKey :
   - checkPermission(member, permissionKey)
   - Si true : return Next()
2. Si aucune permission : throw ForbiddenError(403)

**Fonction requireAllPermissions(permissionKeys: string[])**
Middleware pour vérifier TOUTES permissions (AND).

1. Pour chaque permissionKey :
   - checkPermission(member, permissionKey)
   - Si false : throw ForbiddenError(403)
2. Si toutes OK : Next()

**Fichier à créer : `lib/repositories/admin/role.repository.ts`**

Repository pour encapsuler accès Prisma à adm_roles.

**Méthode findWithPermissions(roleId: string) → Promise<Role>**
Récupère rôle avec toutes ses permissions (eager load).

**Méthode findBySlug(tenantId: string, slug: string) → Promise<Role | null>**
Cherche rôle par slug dans un tenant.

**Méthode countMembers(roleId: string) → Promise<number>**
Compte nombre de members dans un rôle (pour vérification quota).

#### API REST (Endpoints)

**Fichier à créer : `app/api/v1/admin/permissions/route.ts`**

**GET /api/v1/admin/permissions**

- **Description** : Liste toutes les permissions système
- **Query params** :
  - category : filter par category (Operations, Finance, etc.)
  - is_dangerous : filter permissions dangereuses
- **Permissions** : permissions.read (admin uniquement)
- **Réponse 200** :

```json
{
  "permissions": [
    {
      "id": "uuid",
      "permission_key": "vehicles.read",
      "resource": "vehicles",
      "action": "read",
      "description": "View vehicles list and details",
      "category": "Operations",
      "is_dangerous": false
    },
    {
      "id": "uuid",
      "permission_key": "contracts.delete",
      "resource": "contracts",
      "action": "delete",
      "description": "Delete contracts (dangerous)",
      "category": "CRM",
      "is_dangerous": true
    }
  ],
  "total": 87,
  "by_category": {
    "Operations": 32,
    "Finance": 18,
    "Admin": 12,
    "CRM": 15,
    "Maintenance": 10
  }
}
```

- **Erreurs** : 403 si pas admin

**Fichier à créer : `app/api/v1/admin/roles/route.ts`**

**GET /api/v1/admin/roles**

- **Description** : Liste rôles du tenant
- **Query params** : is_system (filter système vs custom)
- **Permissions** : roles.read (admin ou manager)
- **Réponse 200** :

```json
{
  "roles": [
    {
      "id": "uuid-admin",
      "name": "Admin",
      "slug": "admin",
      "hierarchy_level": 10,
      "is_system": true,
      "permissions_count": 45,
      "members_count": 2,
      "max_members": 5,
      "color": "#3B82F6"
    },
    {
      "id": "uuid-manager",
      "name": "Fleet Manager",
      "slug": "fleet-manager",
      "hierarchy_level": 20,
      "is_system": true,
      "permissions_count": 28,
      "members_count": 5,
      "max_members": 20,
      "color": "#10B981"
    }
  ],
  "total": 5
}
```

**POST /api/v1/admin/roles**

- **Description** : Créer un rôle custom
- **Body** : RoleCreateInput

```json
{
  "name": "Chef de Projet",
  "description": "Gère projets et équipe projet",
  "hierarchy_level": 25,
  "permission_ids": ["uuid-perm1", "uuid-perm2"],
  "color": "#F59E0B",
  "max_members": 10
}
```

- **Permissions** : roles.create (admin)
- **Réponse 201** : Role créé
- **Erreurs** :
  - 400 : Validation échouée
  - 403 : Tente de créer rôle hierarchy supérieure au sien

**Fichier à créer : `app/api/v1/admin/roles/[id]/route.ts`**

**GET /api/v1/admin/roles/[id]**

- **Description** : Détails complets d'un rôle
- **Permissions** : roles.read
- **Réponse 200** : Role avec permissions détaillées

```json
{
  "id": "uuid",
  "name": "Admin",
  "slug": "admin",
  "description": "Administrator with full access",
  "hierarchy_level": 10,
  "is_system": true,
  "max_members": 5,
  "members_count": 2,
  "color": "#3B82F6",
  "permissions": [
    {
      "id": "uuid-perm",
      "permission_key": "vehicles.read",
      "description": "View vehicles",
      "category": "Operations",
      "is_dangerous": false
    }
  ]
}
```

**PATCH /api/v1/admin/roles/[id]**

- **Description** : Modifier un rôle (name, description, color uniquement)
- **Body** : RoleUpdateInput
- **Permissions** : roles.update (admin)
- **Réponse 200** : Role mis à jour
- **Erreurs** : 422 si rôle système (modifications limitées)

**DELETE /api/v1/admin/roles/[id]**

- **Description** : Supprimer un rôle custom
- **Permissions** : roles.delete (admin)
- **Réponse 200** : Role supprimé
- **Erreurs** :
  - 422 : Rôle système (non supprimable)
  - 422 : Rôle utilisé par membres

**Fichier à créer : `app/api/v1/admin/roles/[id]/permissions/route.ts`**

**PUT /api/v1/admin/roles/[id]/permissions**

- **Description** : Remplacer toutes permissions d'un rôle
- **Body** :

```json
{
  "permission_ids": ["uuid-perm1", "uuid-perm2", "uuid-perm3"]
}
```

- **Permissions** : roles.update_permissions (admin uniquement)
- **Réponse 200** : Role avec nouvelles permissions
- **Erreurs** :
  - 403 : Pas permission
  - 422 : Inclut permissions dangereuses sans confirmation

**POST /api/v1/admin/roles/[id]/permissions/add**

- **Description** : Ajouter permissions à un rôle
- **Body** :

```json
{
  "permission_ids": ["uuid-perm-new"]
}
```

- **Permissions** : roles.update_permissions
- **Réponse 200** : Role avec permissions mises à jour

**POST /api/v1/admin/roles/[id]/permissions/remove**

- **Description** : Retirer permissions d'un rôle
- **Body** :

```json
{
  "permission_ids": ["uuid-perm-to-remove"]
}
```

- **Permissions** : roles.update_permissions
- **Réponse 200** : Role avec permissions mises à jour

**Fichier à créer : `app/api/v1/admin/members/[id]/check-permission/route.ts`**

**POST /api/v1/admin/members/[id]/check-permission**

- **Description** : Vérifier si un member a une permission (debug/testing)
- **Body** :

```json
{
  "permission_key": "vehicles.update"
}
```

- **Permissions** : Public (pour debug) ou admin
- **Réponse 200** :

```json
{
  "has_permission": true,
  "member_role": "Admin",
  "permission_source": "wildcard *.* (god mode)"
}
```

#### Frontend (Interface Utilisateur)

**Fichier à créer : `app/[locale]/settings/roles/page.tsx`**

Page gestion des rôles (visible admin uniquement).

**Layout de la page :**

```
┌──────────────────────────────────────────────────────────────┐
│ HEADER                                                        │
│ [FleetCore Logo] Settings > Roles & Permissions [+ New Role]│
└──────────────────────────────────────────────────────────────┘
┌──────────────────────────────────────────────────────────────┐
│ ROLES LIST                                                    │
│ ┌────────┬──────────┬────────┬────────┬─────────┐          │
│ │ Role   │ Level    │ Members│ Perms  │ Actions │          │
│ ├────────┼──────────┼────────┼────────┼─────────┤          │
│ │Admin   │ 10       │ 2/5    │ 45     │[View]   │ 🔒System│
│ │Manager │ 20       │ 5/20   │ 28     │[View]   │ 🔒System│
│ │Comptab │ 30       │ 1/10   │ 12     │[Edit]   │ Custom  │
│ │Dispatch│ 40       │ 3/-    │ 18     │[Edit]   │ Custom  │
│ │Operator│ 40       │ 8/-    │ 15     │[View]   │ 🔒System│
│ └────────┴──────────┴────────┴────────┴─────────┘          │
└──────────────────────────────────────────────────────────────┘
```

**Fonctionnalités :**

- **Liste rôles** : Tous rôles tenant avec stats
- **Badge System/Custom** : Indique si modifiable
- **Members quota** : X/Y avec barre progression
- **Actions** :
  - System roles : [View] uniquement
  - Custom roles : [View] [Edit] [Delete]
- **Bouton "+ New Role"** : Ouvre modal création rôle

**Fichier à créer : `app/[locale]/settings/roles/[id]/page.tsx`**

Page détail d'un rôle avec gestion permissions.

**Layout de la page :**

```
┌──────────────────────────────────────────────────────────────┐
│ HEADER                                                        │
│ [← Back] Role: Admin                          [Edit Details]│
└──────────────────────────────────────────────────────────────┘
┌──────────────────────────────────────────────────────────────┐
│ ROLE INFO                                                     │
│ Name: Admin                     Level: 10 (Administrator)    │
│ Members: 2/5 [Ahmed, Sara]      Type: 🔒 System Role        │
│ Description: Administrator with full access                  │
└──────────────────────────────────────────────────────────────┘
┌──────────────────────────────────────────────────────────────┐
│ PERMISSIONS (45)                       [Add Permissions]     │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 🏢 OPERATIONS (18)                              [Expand] │ │
│ │ ✅ vehicles.read          View vehicles                 │ │
│ │ ✅ vehicles.create        Create vehicles               │ │
│ │ ✅ vehicles.update        Update vehicles               │ │
│ │ ✅ vehicles.delete        Delete vehicles               │ │
│ │ ✅ drivers.* (wildcard)   All driver permissions        │ │
│ │ ✅ trips.* (wildcard)     All trip permissions          │ │
│ │ ...                                                      │ │
│ └─────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 💰 FINANCE (12)                                 [Expand] │ │
│ │ ✅ billing.read           View invoices                 │ │
│ │ ✅ billing.create         Create invoices               │ │
│ │ ✅ contracts.read         View contracts                │ │
│ │ ✅ contracts.update       Update contracts              │ │
│ │ ⚠️ contracts.delete       Delete contracts (DANGEROUS)  │ │
│ │ ...                                                      │ │
│ └─────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 🔧 ADMIN (15)                                   [Expand] │ │
│ │ ✅ members.* (wildcard)   All member management         │ │
│ │ ✅ roles.read             View roles                    │ │
│ │ ⚠️ roles.update           Update roles (DANGEROUS)      │ │
│ │ ✅ settings.*             All settings                  │ │
│ │ ...                                                      │ │
│ └─────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

**Fonctionnalités :**

- **Role Info** : Détails rôle avec membres assignés
- **Permissions groupées** : Par category (Operations, Finance, Admin)
- **Expand/Collapse** : Sections permissions
- **Badge DANGEROUS** : Sur permissions sensibles (rouge)
- **Badge Wildcard** : Sur permissions wildcard (bleu)
- **Checkbox** : Pour ajouter/retirer permissions (si custom role)
- **Disabled** : Si system role (lecture seule permissions)
- **Bouton "Add Permissions"** : Ouvre modal sélection permissions

**Composant à créer : `components/admin/RoleFormModal.tsx`**

Modal pour créer ou modifier un rôle.

**Champs :**

- **Name** : Input text (requis)
- **Description** : Textarea (optionnel)
- **Hierarchy Level** : Number (10-100)
  - Slider avec labels : Super Admin (10), Admin (10), Manager (20), Specialist (30), Operator (40), Viewer (50)
  - Limité selon rôle créateur (ne peut pas créer supérieur)
- **Max Members** : Number (optionnel, NULL = illimité)
- **Color** : Color picker (pour badge UI)
- **Permissions** : Multi-select checkbox tree
  - Groupé par category
  - Expand/collapse categories
  - Checkbox "Select All" par category
  - Badge DANGEROUS sur permissions sensibles

**Validation :**

- Name requis (min 3 caractères)
- Hierarchy level valide (10-100)
- Au moins 1 permission sélectionnée

**Soumission :**

- POST /api/v1/admin/roles (create)
- PATCH /api/v1/admin/roles/[id] (update)
- Si succès : ferme modal, toast "Rôle créé/modifié", refresh page
- Si permissions dangereuses ajoutées : Confirmation supplémentaire
  - Modal warning : "⚠️ Vous ajoutez des permissions sensibles (contracts.delete, roles.update). Confirmez-vous ?"

**Composant à créer : `components/admin/PermissionCheckboxTree.tsx`**

Composant arbre de permissions avec checkboxes.

**Props :**

- permissions : array toutes permissions disponibles
- selectedPermissionIds : array IDs permissions sélectionnées
- onChange : callback quand sélection change
- disabled : boolean (lecture seule)

**Affichage :**

- Arbre hiérarchique groupé par category
- Checkbox par permission avec description
- Badge "⚠️ DANGEROUS" si is_dangerous
- Expand/collapse categories
- "Select All" par category

**Composant à créer : `components/auth/Authorized.tsx`**

Composant React pour masquer contenu selon permissions.

**Props :**

- permission : string permission_key requise
- fallback : ReactNode (optionnel, affiché si pas permission)
- children : ReactNode (contenu à protéger)

**Usage :**

```jsx
<Authorized permission="contracts.delete" fallback={<span>Access denied</span>}>
  <button onClick={deleteContract}>Delete Contract</button>
</Authorized>

// Si member n'a pas permission, bouton caché (ou fallback affiché)
```

**Hook associé : `usePermissions()`**

```typescript
const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermissions();

// Usage
if (hasPermission("vehicles.update")) {
  // Afficher bouton Edit Vehicle
}

if (hasAnyPermission(["billing.read", "contracts.read"])) {
  // Afficher section Finance
}
```

**Fichier à créer : `lib/hooks/usePermissions.ts`**

Hook React pour vérifier permissions.

```typescript
export function usePermissions() {
  const { member } = useMember(); // Context membre actuel

  const hasPermission = (permissionKey: string): boolean => {
    if (!member || !member.role) return false;

    const rolePermissions = member.role.permissions.map(
      (p) => p.permission_key
    );

    // Check wildcard god mode
    if (rolePermissions.includes("*.*")) return true;

    // Check resource wildcard
    const [resource, action] = permissionKey.split(".");
    if (rolePermissions.includes(`${resource}.*`)) return true;

    // Check action wildcard
    if (rolePermissions.includes(`*.${action}`)) return true;

    // Check exact permission
    return rolePermissions.includes(permissionKey);
  };

  const hasAnyPermission = (permissionKeys: string[]): boolean => {
    return permissionKeys.some((key) => hasPermission(key));
  };

  const hasAllPermissions = (permissionKeys: string[]): boolean => {
    return permissionKeys.every((key) => hasPermission(key));
  };

  return { hasPermission, hasAnyPermission, hasAllPermissions };
}
```

### 🎬 RÉSULTAT DÉMONTRABLE

**Scénario démo complet pour le sponsor :**

**1. Admin visualise rôles système**

- Ahmed (Admin) va dans Settings > Roles
- Voit liste 5 rôles :
  - Admin (2/5 members, 45 permissions) 🔒 System
  - Manager (5/20 members, 28 permissions) 🔒 System
  - Comptable (1/10 members, 12 permissions) Custom
  - Dispatcher (3 members, 18 permissions) Custom
  - Operator (8 members, 15 permissions) 🔒 System

**2. Création rôle custom "Chef de Projet"**

- Clique "+ New Role"
- Modal s'ouvre
- Remplit :
  - Name : Chef de Projet
  - Description : Gère projets et équipe
  - Hierarchy Level : 25 (entre Admin et Manager)
  - Max Members : 10
  - Permissions sélectionnées :
    - ✅ vehicles.read
    - ✅ drivers.read
    - ✅ trips.\* (all trip permissions)
    - ✅ schedules.\* (all schedule permissions)
    - ✅ reports.read
    - ✅ members.read (peut voir équipe)
    - ❌ billing.\* (PAS finances)
    - ❌ contracts.\* (PAS contrats)
- Clique "Create Role"
- Toast : "Rôle Chef de Projet créé"
- Nouveau rôle visible dans liste

**3. Assigner rôle Chef de Projet à Sara**

- Va dans Settings > Team
- Clique action "Change Role" sur Sara
- Modal s'ouvre
- Current Role : Manager
- New Role : Chef de Projet (dropdown)
- Clique "Change Role"
- Sara.role_id mis à jour
- Sara reçoit email : "Votre rôle a changé : Chef de Projet"

**4. Sara teste ses nouvelles permissions**

- Sara se connecte
- Voit menu :
  - ✅ Vehicles (peut voir)
  - ✅ Drivers (peut voir)
  - ✅ Trips (peut tout faire)
  - ✅ Schedules (peut tout faire)
  - ✅ Reports (peut voir)
  - ❌ Billing (menu caché - pas permission)
  - ❌ Contracts (menu caché - pas permission)
  - ✅ Team (peut voir membres, pas inviter)
- Sara essaie d'aller sur /billing manuellement (URL directe)
- API retourne 403 Forbidden : "Permission denied: billing.read"
- Page erreur affichée : "Vous n'avez pas accès à cette section"

**5. Modification permissions rôle Comptable**

- Ahmed clique rôle "Comptable" dans liste
- Page détail s'ouvre
- Voit permissions actuelles :
  - ✅ billing.\*
  - ✅ contracts.read
  - ✅ reports.billing
- Ahmed veut ajouter contracts.update (Comptable doit pouvoir modifier montants contrats)
- Clique "Add Permissions"
- Modal multi-select s'ouvre
- Cherche "contracts.update"
- Coche la checkbox
- Clique "Save"
- Confirmation modal : "Ajouter contracts.update à Comptable ?"
- Confirme
- API PUT /roles/[comptable-id]/permissions
- Permissions mises à jour
- Audit log créé : "Ahmed a ajouté contracts.update au rôle Comptable"

**6. Tentative ajout permission dangereuse**

- Ahmed essaie d'ajouter contracts.delete au rôle Dispatcher
- Clique permission "contracts.delete"
- Warning modal s'affiche :
  - "⚠️ PERMISSION SENSIBLE"
  - "contracts.delete permet de supprimer définitivement des contrats. Cette action est irréversible."
  - "Êtes-vous sûr de vouloir ajouter cette permission ?"
  - [Annuler] [Confirmer]
- Ahmed réalise erreur, clique Annuler
- Permission non ajoutée

**7. Vérification permissions côté frontend**

- Khalid (Dispatcher) se connecte
- Page Trips s'affiche
- Voit liste trajets avec boutons :
  - ✅ [Assign] (permission trips.assign - visible)
  - ✅ [Edit] (permission trips.update - visible)
  - ❌ [Delete] (permission trips.delete - caché car pas permission)
- Composant Authorized cache bouton Delete automatiquement
- Code :

```jsx
<Authorized permission="trips.delete">
  <button>Delete Trip</button>
</Authorized>
// Khalid n'a pas trips.delete → bouton caché
```

**8. Audit log permissions**

- Ahmed va dans Settings > Audit Logs
- Filtre par action "permission_denied"
- Voit tentatives accès non autorisés :
  - Sara a tenté d'accéder /billing (permission billing.read refusée)
  - Khalid a tenté de DELETE /trips/123 (permission trips.delete refusée)
- Chaque log contient :
  - Member qui a tenté
  - Permission requise
  - Route/action tentée
  - Timestamp
  - IP address

**9. Quota rôle Admin atteint**

- Ahmed veut promouvoir Fatima en Admin
- Clique "Change Role" sur Fatima
- Sélectionne Admin dans dropdown
- Erreur : "❌ Quota Admin atteint (5/5). Impossible d'assigner ce rôle."
- Ahmed doit soit :
  - Upgrade plan (augmenter quota Admin)
  - Rétrograder un Admin existant
  - Ne pas promouvoir Fatima

**10. Suppression rôle custom inutilisé**

- Ahmed a créé rôle "Stagiaire" il y a 6 mois
- Aucun membre n'utilise ce rôle (0 members)
- Ahmed clique action "Delete" sur rôle Stagiaire
- Confirmation modal : "Supprimer le rôle Stagiaire ?"
- Confirme
- Rôle supprimé avec succès
- Si le rôle avait eu des membres : Erreur "Impossible de supprimer, 3 membres utilisent ce rôle"

**Critères d'acceptation :**

- ✅ Rôles système (Admin, Manager, Operator) créés automatiquement
- ✅ Permissions groupées par category (Operations, Finance, Admin)
- ✅ Permissions dangereuses identifiées (is_dangerous)
- ✅ Checkboxes permissions fonctionnent (ajouter/retirer)
- ✅ Wildcard permissions détectées (_._, vehicles._, _.read)
- ✅ Middleware API vérifie permissions (403 si refusé)
- ✅ Composant Authorized cache contenu selon permission
- ✅ Hook usePermissions fonctionne côté frontend
- ✅ Audit log tentatives accès non autorisés
- ✅ Warning modal permissions dangereuses
- ✅ Quota max_members respecté
- ✅ Hiérarchie rôles respectée (Manager ne peut pas créer Admin)
- ✅ Rôles système non supprimables
- ✅ Rôles custom modifiables/supprimables
- ✅ Menu UI adapté selon permissions (sections cachées)

### ⏱️ ESTIMATION

- Temps backend : **18 heures**
  - PermissionService : 6h
  - RoleService : 6h
  - Middleware auth/permissions : 4h
  - Repositories : 2h
- Temps API : **6 heures**
  - Endpoints permissions : 2h
  - Endpoints roles : 4h
- Temps frontend : **14 heures**
  - Page Settings/Roles : 4h
  - Page Role Details : 4h
  - RoleFormModal : 3h
  - PermissionCheckboxTree : 2h
  - Authorized component + usePermissions hook : 1h
- **TOTAL : 38 heures (5 jours)**

**MAIS** : Intégré dans Sprint 3 (3 jours) car parallélisable avec Étape 3.3.

### 🔗 DÉPENDANCES

**Prérequis obligatoires :**

- Étape 3.3 terminée (members avec rôles)
- Tables adm_roles, adm_permissions, adm_role_permissions existantes
- Middleware auth configuré (Clerk)

**Services/composants requis :**

- MemberService (pour vérifier member actuel)
- AuditService (pour logger tentatives accès)

**Données de test nécessaires :**

- Permissions système synchronisées (via syncPermissions)
- Rôles système créés (Admin, Manager, Operator)
- Members avec rôles variés pour tester

### ✅ CHECKLIST DE VALIDATION

- [ ] **Backend** : PermissionService.checkPermission() vérifie wildcards
- [ ] **Backend** : syncPermissions() synchronise permissions système
- [ ] **Backend** : RoleService.createRole() crée rôle custom
- [ ] **Backend** : updateRolePermissions() modifie permissions
- [ ] **Backend** : createSystemRoles() crée rôles standards
- [ ] **Backend** : Middleware requirePermission() bloque si pas permission
- [ ] **Backend** : Middleware requireAnyPermission() (OR logic)
- [ ] **Backend** : Middleware requireAllPermissions() (AND logic)
- [ ] **API** : GET /permissions liste toutes permissions
- [ ] **API** : GET /roles liste rôles tenant
- [ ] **API** : POST /roles crée rôle custom
- [ ] **API** : PUT /roles/[id]/permissions modifie permissions
- [ ] **API** : DELETE /roles/[id] supprime rôle custom
- [ ] **API** : Tous endpoints protégés par permissions (403 si refusé)
- [ ] **Frontend** : Page Roles liste avec stats
- [ ] **Frontend** : Page Role Details affiche permissions groupées
- [ ] **Frontend** : RoleFormModal crée/modifie rôle
- [ ] **Frontend** : PermissionCheckboxTree multi-select fonctionne
- [ ] **Frontend** : Authorized component cache contenu
- [ ] **Frontend** : usePermissions hook vérifie permissions
- [ ] **Frontend** : Menu UI adapté selon permissions (sections cachées)
- [ ] **Frontend** : Warning modal permissions dangereuses
- [ ] **Tests** : 30+ tests unitaires PermissionService
- [ ] **Tests** : Test E2E membre sans permission → 403
- [ ] **Tests** : Test wildcards (_._, resource._, _.action)
- [ ] **Tests** : Test hiérarchie rôles respectée
- [ ] **Tests** : Test quota max_members
- [ ] **Démo** : Sponsor crée rôle custom avec permissions
- [ ] **Démo** : Sponsor assigne rôle, member teste permissions
- [ ] **Démo** : Membre sans permission voit 403 (API + UI)
- [ ] **Démo** : Audit log tentatives accès non autorisés
- [ ] **Démo** : Warning permissions dangereuses fonctionne

---

# DÉMO FINALE SPRINT 3 COMPLET

**À la fin du Sprint 3 (Jour 15), le sponsor peut valider :**

**1. Contract Management (Étape 3.1) :**

- Création contrats depuis opportunities
- Signature DocuSign intégrée
- Renouvellement automatique avec alertes
- Résiliation avec préavis et prorata
- Billing schedule automatique

**2. Tenant Provisioning (Étape 3.2) :**

- Provisioning < 2 min après signature
- Configuration locale correcte (timezone, currency)
- Rôles standards créés automatiquement
- Invitation admin envoyée
- Onboarding checklist trackée

**3. Member Management (Étape 3.3) :**

- Invitation single et batch
- Email invitation avec magic link
- Acceptation seamless via Clerk
- Quota members respecté
- Désactivation/réactivation membres
- Changement rôle

**4. RBAC & Permissions (Étape 3.4) :**

- Permissions granulaires par ressource/action
- Rôles système (Admin, Manager, Operator)
- Rôles custom créables
- Wildcard permissions (_._, resource.\*)
- Middleware API vérifie permissions
- UI adapté selon permissions
- Audit log accès non autorisés
- Permissions dangereuses identifiées

**5. Metrics clés :**

- Time-to-activation : 5 min (vs 48h avant)
- Économies support : 65k€/an
- Sécurité : 100% accès contrôlés
- Compliance : ISO27001 ready
- Autonomie client : 100% self-service équipe

**FleetCore est maintenant production-ready pour le module CRM & Administration !**

---

**FIN DU DOCUMENT - SPRINT 3 COMPLET (Étapes 3.3 & 3.4)**
