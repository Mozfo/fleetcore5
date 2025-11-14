# FLEETCORE - MODULE ADM : CHAPITRE 4

## LIFECYCLE & AUDIT (Tenant Lifecycle Events, Audit Logs)

**Date:** 10 Novembre 2025  
**Version:** 1.0 DÉFINITIVE  
**Périmètre:** Chapitre 4 - Traçabilité et historique des événements  
**Méthodologie:** Implémentation verticale par fonctionnalité démontrable

---

## 📋 TABLE DES MATIÈRES - CHAPITRE 4

1. [Introduction Chapitre 4](#introduction-chapitre-4)
2. [ÉTAPE 4.1 : Tenant Lifecycle Events](#étape-41--tenant-lifecycle-events)
3. [ÉTAPE 4.2 : Audit Logs](#étape-42--audit-logs)

---

## INTRODUCTION CHAPITRE 4

### Contexte et Objectifs

Le Chapitre 4 du module ADM implémente la **traçabilité complète** de tous les événements critiques du système. Il se compose de deux tables fondamentales qui travaillent en tandem pour garantir la conformité réglementaire, faciliter le debugging, et permettre l'analyse forensique en cas d'incident.

**Enjeux business critiques :**

- **Conformité réglementaire** : RGPD, SOC 2, ISO 27001 exigent un audit trail complet
- **Facturation précise** : Les lifecycle events déclenchent la facturation automatique
- **Support efficace** : 80% des tickets support résolus grâce aux logs détaillés
- **Détection fraude** : Patterns suspects identifiés via analyse des audit logs
- **Rollback sécurisé** : Capacité de restaurer un état antérieur en cas d'erreur

### Architecture du Chapitre 4

**DOMAINE : LIFECYCLE & AUDIT (2 tables)**

**Table 1 : `adm_tenant_lifecycle_events`**

- **Rôle** : Trace TOUS les changements d'état des tenants (création, activation, suspension, résiliation)
- **Utilité** : Déclenche workflows automatiques (facturation, notifications, provisioning)
- **Volume estimé** : ~5-10 événements par tenant sur durée de vie (faible volume, haute importance)

**Table 2 : `adm_audit_logs`**

- **Rôle** : Journal immuable de TOUTES les actions sensibles sur TOUTES les entités
- **Utilité** : Conformité, debugging, forensique, analyse comportementale
- **Volume estimé** : ~1000-5000 logs/tenant/mois (volume élevé, criticité maximale)

### Périmètre du Chapitre 4

**ÉTAPE 4.1 (2 jours) :**

- Implémentation complète `adm_tenant_lifecycle_events`
- Service LifecycleEventService avec détection automatique des transitions
- Triggers automatiques pour création d'événements lors de changements de statut tenant
- Webhooks sortants vers systèmes externes (facturation, CRM)
- APIs REST pour consultation historique lifecycle
- Dashboard timeline lifecycle pour Admin

**ÉTAPE 4.2 (2.5 jours) :**

- Implémentation complète `adm_audit_logs`
- Service AuditService avec logging automatique via BaseService
- Catégorisation et severity des événements
- Recherche avancée et filtrage des logs
- Détection de patterns suspects (brute force, data exfiltration)
- APIs REST pour consultation et export des logs
- Dashboard audit trail pour Admin et Compliance

**Livrable fin Chapitre 4 :**

- Toutes transitions tenant loggées automatiquement dans lifecycle_events
- Toutes actions CUD (Create/Update/Delete) loggées dans audit_logs
- Dashboard Admin avec timeline complète des événements tenant
- Dashboard Compliance avec recherche avancée des audit logs
- Export CSV/JSON des logs pour analyse externe
- Alertes automatiques sur événements suspects

---

# CHAPITRE 4 : LIFECYCLE & AUDIT

**Durée :** 4.5 jours ouvrés (36 heures)  
**Objectif :** Implémenter la traçabilité complète des événements tenant et des actions système  
**Livrable démo :** Dashboard Admin montrant timeline lifecycle + audit trail complet

---

## ÉTAPE 4.1 : Tenant Lifecycle Events

### 🎯 RATIONNEL MÉTIER

**POURQUOI :** Le lifecycle d'un tenant est complexe avec de nombreuses transitions (trialing → active → suspended → cancelled). Chaque transition déclenche des actions critiques : facturation, notifications, provisioning, déprovisioning. Sans historique structuré de ces événements, impossible de :

- Facturer correctement (quand le tenant est-il passé en "active" ?)
- Debugger les problèmes ("Pourquoi mon compte est suspendu ?")
- Analyser le churn (combien de temps en trial avant conversion ?)
- Automatiser les workflows (déclencher email de relance après X jours de suspension)

**QUEL PROBLÈME :** Actuellement, quand un tenant change de statut, on met à jour `adm_tenants.status` mais on perd l'historique. Questions impossibles à répondre :

- "Combien de fois ce tenant a été suspendu ?"
- "Qui a réactivé ce tenant le 5 novembre ?"
- "Quelle était la raison de la dernière suspension ?"
- "Combien de jours entre la création et l'activation ?"

Sans lifecycle events, le support passe 30 minutes à reconstituer manuellement l'historique via les logs applicatifs dispersés. La facturation est approximative car on ne sait pas exactement quand le client est passé en "active".

**IMPACT SI ABSENT :**

- **Facturation** : Erreurs de facturation (facturer un mois de trial, ou facturer pendant suspension)
- **Support** : Impossible de diagnostiquer rapidement les problèmes tenant
- **Compliance** : Non-conformité RGPD (pas de preuve de la date de résiliation)
- **Analytics** : Impossible de calculer les métriques clés (trial conversion rate, churn rate, time-to-active)
- **Automatisation** : Impossible de déclencher des workflows automatiques (ex: email J+10 trial)

**CAS D'USAGE CONCRET :**

**Contexte :** ABC Logistics a été créé comme tenant le 1er novembre 2025. Timeline complète des événements :

**1er novembre 10:00** - Événement "tenant_created"

- **Déclenché par** : Signature contrat CRM (opportunity won)
- **Performed by** : System (automatique)
- **Previous status** : null
- **New status** : trialing
- **Metadata** : { contract_id, opportunity_id, trial_duration: 14 }
- **Actions automatiques** :
  - Création organization Clerk
  - Settings par défaut créés
  - Email de bienvenue envoyé au contact
  - Notification Customer Success : "Nouveau tenant à onboarder"

**1er novembre 10:15** - Événement "trial_started"

- **Déclenché par** : Fin du provisioning automatique
- **Performed by** : System
- **Trial_ends_at** : 15 novembre 23:59:59
- **Actions automatiques** :
  - Programmation job reminder J+7 trial
  - Programmation job reminder J+13 trial

**3 novembre 14:30** - Événement "onboarding_completed"

- **Déclenché par** : Admin tenant a complété le wizard onboarding
- **Performed by** : Ahmed Al-Mansoori (tenant admin)
- **Metadata** : { steps_completed: ["company_profile", "first_vehicles", "first_drivers"] }
- **Actions automatiques** :
  - Activation fonctionnalités complètes
  - Email félicitations onboarding
  - Notification CSM : "Tenant ready for activation"

**8 novembre 09:00** - Événement "trial_extended"

- **Déclenché par** : Admin FleetCore accorde 7 jours supplémentaires
- **Performed by** : Marie Dubois (CSM FleetCore)
- **Reason** : "Client demande plus de temps pour tester intégrations API"
- **Previous trial_ends_at** : 15 novembre
- **New trial_ends_at** : 22 novembre
- **Actions automatiques** :
  - Email confirmation extension au client
  - Mise à jour calendrier facturation

**20 novembre 16:45** - Événement "activated"

- **Déclenché par** : Client choisit plan Standard et valide paiement
- **Performed by** : Ahmed Al-Mansoori
- **Previous status** : trialing
- **New status** : active
- **Plan selected** : Standard (100 vehicles, 25€/vehicle/month)
- **Metadata** : { payment_method_id, first_invoice_date: "2025-12-01" }
- **Actions automatiques** :
  - Création première facture (prorata 10 jours novembre)
  - Email confirmation activation
  - Notification Finance : "Nouveau client actif"
  - Webhook vers CRM : "Opportunity fully converted"

**15 décembre 08:00** - Événement "suspended"

- **Déclenché par** : Paiement facture décembre échoué (3 tentatives)
- **Performed by** : System (automatic billing)
- **Previous status** : active
- **New status** : suspended
- **Reason** : "Payment failed - insufficient funds"
- **Metadata** : { invoice_id, failed_payment_attempts: 3 }
- **Actions automatiques** :
  - Blocage accès tenant (read-only mode)
  - Email urgent au client : "Action requise : paiement échoué"
  - Notification Finance : "Client en impayé"
  - Programmation job de relance J+3, J+7, J+14

**17 décembre 10:30** - Événement "reactivated"

- **Déclenché par** : Client a régularisé le paiement
- **Performed by** : Ahmed Al-Mansoori (via self-service billing)
- **Previous status** : suspended
- **New status** : active
- **Metadata** : { payment_id, paid_invoice_id }
- **Actions automatiques** :
  - Réactivation accès complet
  - Email confirmation réactivation
  - Annulation jobs de relance programmés
  - Notification Finance : "Paiement reçu"

**Valeur business :**

- **Facturation précise** : Prorata calculé exactement (10 jours actifs en novembre = 250€ au lieu de 2500€ facturés par erreur)
- **Support efficace** : Support voit la timeline complète en 5 secondes au lieu de 30 minutes de recherche
- **Churn analysis** : Marketing calcule que 65% des tenants s'activent avant fin trial, 20% demandent extension, 15% abandonnent
- **Automatisation** : 0 intervention humaine pour les workflows standard (relances, réactivations, provisioning)

### 📊 DONNÉES ET RÈGLES MÉTIER

**Table principale : `adm_tenant_lifecycle_events`**

**Colonnes critiques (18 colonnes) :**

| Colonne                  | Type      | Obligatoire | Utilité Business                                        |
| ------------------------ | --------- | ----------- | ------------------------------------------------------- |
| **id**                   | uuid      | OUI         | Identifiant unique événement (PK)                       |
| **tenant_id**            | uuid      | OUI         | Tenant concerné (FK → adm_tenants)                      |
| **event_type**           | text      | OUI         | Type événement (enum exhaustif)                         |
| **event_date**           | timestamp | OUI         | Quand l'événement s'est produit (now)                   |
| **effective_date**       | timestamp | NON         | Quand l'événement prend effet (peut être futur)         |
| **performed_by_type**    | text      | OUI         | Qui a déclenché (system, employee, member, api)         |
| **performed_by_id**      | uuid      | NON         | ID de qui a déclenché                                   |
| **previous_status**      | text      | NON         | Statut tenant avant événement                           |
| **new_status**           | text      | NON         | Statut tenant après événement                           |
| **reason**               | text      | NON         | Raison de l'événement (obligatoire pour certains types) |
| **metadata**             | jsonb     | NON         | Données contextuelles additionnelles                    |
| **related_invoice_id**   | uuid      | NON         | Facture liée (si applicable)                            |
| **related_contract_id**  | uuid      | NON         | Contrat lié (si applicable)                             |
| **created_at**           | timestamp | OUI         | Date création ligne (immutable)                         |
| **is_reversible**        | boolean   | OUI         | L'événement peut-il être annulé ?                       |
| **reversed_by_event_id** | uuid      | NON         | Si annulé, ID événement d'annulation                    |
| **next_action_required** | text      | NON         | Prochaine action à effectuer                            |
| **next_action_date**     | timestamp | NON         | Date de la prochaine action                             |

**Types d'événements exhaustifs (event_type ENUM) :**

```
CATÉGORIE : CRÉATION & ONBOARDING
- tenant_created : Tenant créé (depuis CRM ou manuel)
- trial_started : Période d'essai démarrée
- trial_extended : Trial prolongé
- onboarding_started : Wizard onboarding démarré
- onboarding_completed : Onboarding terminé avec succès
- onboarding_abandoned : Onboarding abandonné en cours

CATÉGORIE : ACTIVATION & PLANS
- activated : Tenant activé (trial → active)
- plan_upgraded : Changement vers plan supérieur
- plan_downgraded : Changement vers plan inférieur
- plan_renewed : Renouvellement automatique plan

CATÉGORIE : SUSPENSION & RÉACTIVATION
- suspended : Tenant suspendu
- reactivated : Tenant réactivé après suspension
- grace_period_started : Période de grâce démarrée (avant suspension définitive)

CATÉGORIE : RÉSILIATION & SUPPRESSION
- cancellation_requested : Client demande résiliation
- cancelled : Tenant résilié
- archived : Données archivées (après période de conservation)
- deleted : Tenant supprimé définitivement (après anonymisation RGPD)

CATÉGORIE : FACTURATION
- payment_method_added : Moyen de paiement ajouté
- payment_method_updated : Moyen de paiement modifié
- payment_failed : Paiement échoué
- payment_succeeded : Paiement réussi

CATÉGORIE : INCIDENTS
- security_incident : Incident de sécurité détecté
- data_breach_reported : Fuite de données signalée
- compliance_violation : Violation conformité détectée
```

**Règles de cohérence et validation :**

**Règle 1 : Event_date doit être <= now**
Un événement ne peut pas être daté dans le futur. Si effective_date est dans le futur (événement programmé), event_date = now et effective_date = date programmée.

**Règle 2 : Previous_status et new_status doivent correspondre au tenant**
Lors de la création de l'événement, vérifier que previous_status = statut actuel du tenant dans adm_tenants AVANT mise à jour.

**Règle 3 : Reason obligatoire pour certains event_types**

```
Event types REQUIRING reason:
- suspended (raison de suspension obligatoire)
- cancelled (raison de résiliation obligatoire)
- trial_extended (justification extension)
- plan_downgraded (raison du downgrade)
- security_incident (description incident)
```

**Règle 4 : Performed_by_id doit correspondre au type**

```
SI performed_by_type = 'system'
  ALORS performed_by_id = NULL (système automatique)
SINON SI performed_by_type = 'employee'
  ALORS performed_by_id doit exister dans adm_provider_employees
SINON SI performed_by_type = 'member'
  ALORS performed_by_id doit exister dans adm_members
SINON SI performed_by_type = 'api'
  ALORS performed_by_id = api_key_id ou integration_id
```

**Règle 5 : Metadata structure selon event_type**
Chaque type d'événement a une structure metadata attendue :

```typescript
// Pour "activated"
metadata = {
  plan_id: uuid,
  plan_name: string,
  payment_method_id: string,
  first_invoice_date: date,
  converted_from_trial: boolean
}

// Pour "suspended"
metadata = {
  suspension_type: "payment_failure" | "abuse" | "manual",
  failed_payment_attempts?: number,
  invoice_id?: uuid,
  access_level: "read_only" | "blocked"
}

// Pour "trial_extended"
metadata = {
  extension_duration_days: number,
  original_trial_ends_at: timestamp,
  new_trial_ends_at: timestamp,
  extension_reason: string
}
```

**Règle 6 : Is_reversible selon event_type**

```
ÉVÉNEMENTS RÉVERSIBLES (is_reversible = true):
- suspended (peut être reactivated)
- plan_upgraded (peut être downgraded)
- plan_downgraded (peut être upgraded)

ÉVÉNEMENTS IRRÉVERSIBLES (is_reversible = false):
- tenant_created
- deleted
- archived
- data_breach_reported
```

**Règle 7 : Next_action automatique**
Certains événements programment automatiquement la prochaine action :

```
SI event_type = "suspended"
  ALORS
    next_action_required = "check_payment_status"
    next_action_date = event_date + 3 jours (première relance)

SI event_type = "trial_started"
  ALORS
    next_action_required = "trial_expiration_reminder"
    next_action_date = trial_ends_at - 3 jours

SI event_type = "cancellation_requested"
  ALORS
    next_action_required = "cancel_tenant"
    next_action_date = event_date + 30 jours (préavis)
```

### 🏗️ COMPOSANTS À DÉVELOPPER

#### Backend (Service Layer)

**Fichier à créer : `lib/services/admin/lifecycle-event.service.ts`**

Service pour gérer les événements du cycle de vie des tenants.

**Classe LifecycleEventService extends BaseService :**

**Méthode createEvent(data: LifecycleEventCreateInput) → Promise<LifecycleEvent>**

1. Valider data avec LifecycleEventCreateSchema
2. Vérifier que tenant existe
3. Récupérer statut actuel tenant depuis DB
4. Si previous_status fourni, vérifier cohérence avec statut actuel
5. Si previous_status non fourni, renseigner automatiquement
6. Valider metadata selon event_type (structure attendue)
7. Si reason obligatoire pour ce event_type, vérifier présence
8. Déterminer is_reversible selon event_type
9. Calculer next_action_required et next_action_date selon event_type
10. Créer événement dans DB via lifecycleEventRepository.create()
11. Si new_status fourni ET différent de previous_status :
    - Mettre à jour adm_tenants.status
    - Créer audit log du changement de statut
12. Déclencher webhooks sortants (si configurés)
13. Envoyer notifications selon event_type
14. Si next_action_date défini, programmer job automatique
15. Retourner événement créé

**Méthode getTimeline(tenantId: string, filters?: TimelineFilters) → Promise<LifecycleEvent[]>**

1. Récupérer tous événements du tenant
2. Filtrer par event_type si demandé
3. Filtrer par date_range si demandé
4. Inclure les relations (performed_by_member, performed_by_employee)
5. Trier par event_date DESC (plus récent en premier)
6. Paginer si nécessaire
7. Retourner liste événements avec metadata enrichies

**Méthode getLastEvent(tenantId: string, eventType?: string) → Promise<LifecycleEvent | null>**

1. Chercher dernier événement du tenant
2. Si eventType fourni, filtrer par ce type
3. Trier par event_date DESC, prendre le premier
4. Retourner événement ou null si aucun

**Méthode reverseEvent(eventId: string, reason: string) → Promise<LifecycleEvent>**

1. Récupérer événement par ID
2. Vérifier que is_reversible = true
3. Vérifier que reversed_by_event_id IS NULL (pas déjà annulé)
4. Déterminer event_type inverse :
   - suspended → reactivated
   - plan_upgraded → plan_downgraded
   - etc.
5. Créer nouvel événement inverse avec :
   - previous_status = new_status de l'événement original
   - new_status = previous_status de l'événement original
   - reason = raison de l'annulation
   - metadata.reversed_event_id = eventId
6. Mettre à jour événement original :
   - reversed_by_event_id = ID nouvel événement
7. Créer audit log "event_reversed"
8. Retourner événement inverse créé

**Méthode detectTransition(tenantId: string, oldStatus: string, newStatus: string) → Promise<void>**
Méthode appelée automatiquement par TenantService lors d'un changement de statut.

1. Détecter type d'événement selon transition :
   - trialing → active : "activated"
   - active → suspended : "suspended"
   - suspended → active : "reactivated"
   - active → cancelled : "cancelled"
2. Créer événement automatiquement via createEvent()
3. Cette méthode garantit qu'aucune transition n'est perdue

**Méthode scheduleAction(tenantId: string, action: string, scheduledDate: Date, metadata?: any) → Promise<ScheduledAction>**

1. Créer ligne dans table scheduled_actions avec :
   - tenant_id
   - action_type : action à effectuer
   - scheduled_at : quand exécuter
   - metadata : contexte additionnel
   - status : pending
2. Programmer job cron pour exécuter à scheduled_at
3. Retourner scheduled action créée

**Méthode triggerWebhooks(event: LifecycleEvent) → Promise<void>**

1. Récupérer webhooks configurés pour le tenant (adm_tenant_settings)
2. Pour chaque webhook actif :
   - Vérifier que event_type matche les types souscrits
   - Préparer payload JSON avec événement complet
   - Envoyer POST vers webhook_url
   - Logger résultat (succès/échec)
   - Si échec, programmer retry (3 tentatives avec backoff)

**Fichier à créer : `lib/repositories/admin/lifecycle-event.repository.ts`**

Repository pour accès à la table adm_tenant_lifecycle_events.

**Méthodes principales :**

- findByTenant(tenantId, filters)
- findByType(eventType)
- findPendingActions(date) : Retourne événements avec next_action_date <= date
- getStatistics(tenantId) : Calcule stats (nombre événements par type, durée moyenne trial, etc.)

#### API REST (Endpoints)

**Fichier à créer : `app/api/v1/admin/tenants/[id]/lifecycle/route.ts`**

**GET /api/v1/admin/tenants/[id]/lifecycle**

- **Description** : Récupérer timeline complète du lifecycle du tenant
- **Query params** :
  - event_type : filter par type (ex: suspended, activated)
  - from_date : date début
  - to_date : date fin
  - limit, offset : pagination
- **Permissions** : tenants.read OU adm_provider_employee
- **Réponse 200** :

```json
{
  "tenant_id": "uuid",
  "events": [
    {
      "id": "uuid",
      "event_type": "activated",
      "event_date": "2025-11-20T16:45:00Z",
      "previous_status": "trialing",
      "new_status": "active",
      "performed_by": {
        "type": "member",
        "id": "uuid",
        "name": "Ahmed Al-Mansoori"
      },
      "metadata": {
        "plan_id": "uuid",
        "plan_name": "Standard",
        "payment_method_id": "pm_abc123"
      },
      "reason": null,
      "is_reversible": false
    },
    {
      "id": "uuid",
      "event_type": "suspended",
      "event_date": "2025-12-15T08:00:00Z",
      "previous_status": "active",
      "new_status": "suspended",
      "performed_by": {
        "type": "system",
        "id": null,
        "name": "Automatic Billing System"
      },
      "metadata": {
        "suspension_type": "payment_failure",
        "failed_payment_attempts": 3,
        "invoice_id": "uuid"
      },
      "reason": "Payment failed - insufficient funds",
      "is_reversible": true,
      "next_action_required": "check_payment_status",
      "next_action_date": "2025-12-18T08:00:00Z"
    }
  ],
  "total": 8,
  "statistics": {
    "total_events": 8,
    "days_in_trial": 19,
    "days_active": 25,
    "suspension_count": 1,
    "last_event_date": "2025-12-17T10:30:00Z"
  }
}
```

**POST /api/v1/admin/tenants/[id]/lifecycle**

- **Description** : Créer manuellement un événement lifecycle
- **Body** :

```json
{
  "event_type": "trial_extended",
  "reason": "Client demande plus de temps pour tester API",
  "metadata": {
    "extension_duration_days": 7,
    "new_trial_ends_at": "2025-11-22T23:59:59Z"
  },
  "effective_date": "2025-11-08T09:00:00Z"
}
```

- **Permissions** : tenants.lifecycle.create (admins seulement)
- **Réponse 201** : Événement créé
- **Erreurs** :
  - 422 : Reason obligatoire pour ce event_type
  - 422 : Metadata invalide pour ce event_type

**Fichier à créer : `app/api/v1/admin/lifecycle/events/[id]/reverse/route.ts`**

**POST /api/v1/admin/lifecycle/events/[id]/reverse**

- **Description** : Annuler un événement (si réversible)
- **Body** :

```json
{
  "reason": "Erreur de manipulation, suspension accidentelle"
}
```

- **Permissions** : tenants.lifecycle.reverse (super admin only)
- **Réponse 200** : Événement inverse créé
- **Erreurs** :
  - 422 : Event not reversible
  - 422 : Event already reversed

**Fichier à créer : `app/api/v1/admin/lifecycle/statistics/route.ts`**

**GET /api/v1/admin/lifecycle/statistics**

- **Description** : Statistiques globales lifecycle (tous tenants)
- **Query params** :
  - from_date, to_date : période d'analyse
  - tenant_id : filter par tenant (optionnel)
- **Permissions** : analytics.read
- **Réponse 200** :

```json
{
  "period": {
    "from": "2025-11-01",
    "to": "2025-11-30"
  },
  "events_by_type": {
    "tenant_created": 45,
    "activated": 29,
    "suspended": 8,
    "reactivated": 6,
    "cancelled": 3
  },
  "conversion_metrics": {
    "trial_to_active_rate": 0.64,
    "average_days_in_trial": 12.5,
    "trial_extension_rate": 0.22
  },
  "churn_metrics": {
    "suspension_rate": 0.18,
    "reactivation_rate": 0.75,
    "cancellation_rate": 0.07
  }
}
```

#### Frontend (Interface Utilisateur)

**Fichier à créer : `app/[locale]/admin/tenants/[id]/lifecycle/page.tsx`**

Page dashboard affichant la timeline complète du lifecycle du tenant.

**Layout de la page :**

```
┌────────────────────────────────────────────────────────────┐
│ HEADER                                                     │
│ [FleetCore Logo] Admin > Tenants > ABC Logistics > Lifecycle│
└────────────────────────────────────────────────────────────┘
┌────────────────────────────────────────────────────────────┐
│ TENANT OVERVIEW                                            │
│ ABC Logistics - Status: Active                             │
│ Created: 1 Nov 2025 | Activated: 20 Nov 2025               │
│ Days in trial: 19 | Days active: 25                        │
└────────────────────────────────────────────────────────────┘
┌────────────────────────────────────────────────────────────┐
│ FILTERS                                                    │
│ [Event Type: All ▼] [Date Range: Last 30 days ▼] [Apply] │
└────────────────────────────────────────────────────────────┘
┌────────────────────────────────────────────────────────────┐
│ TIMELINE (Vertical)                                        │
│                                                            │
│ 🔵 17 Dec 10:30 - REACTIVATED                             │
│    Previous: suspended → New: active                       │
│    By: Ahmed Al-Mansoori                                   │
│    Reason: Payment received                                │
│    [View Details]                                          │
│    │                                                       │
│    ▼                                                       │
│                                                            │
│ 🔴 15 Dec 08:00 - SUSPENDED                               │
│    Previous: active → New: suspended                       │
│    By: System (Automatic Billing)                          │
│    Reason: Payment failed - insufficient funds             │
│    Next action: Check payment status (18 Dec 08:00)        │
│    [View Details] [Reverse Event]                          │
│    │                                                       │
│    ▼                                                       │
│                                                            │
│ 🟢 20 Nov 16:45 - ACTIVATED                               │
│    Previous: trialing → New: active                        │
│    By: Ahmed Al-Mansoori                                   │
│    Plan: Standard (100 vehicles)                           │
│    [View Details]                                          │
│    │                                                       │
│    ▼                                                       │
│                                                            │
│ 🟡 8 Nov 09:00 - TRIAL_EXTENDED                           │
│    Extension: +7 days                                      │
│    By: Marie Dubois (CSM)                                  │
│    Reason: Client needs more time for API testing          │
│    [View Details]                                          │
│    │                                                       │
│    ▼                                                       │
│                                                            │
│ 🟢 1 Nov 10:00 - TENANT_CREATED                           │
│    Created from: Opportunity "ABC Logistics"               │
│    By: System                                              │
│    [View Details]                                          │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

**Fonctionnalités :**

- **Timeline verticale** : Événements du plus récent au plus ancien
- **Couleurs sémantiques** :
  - 🟢 Vert : Événements positifs (created, activated, reactivated)
  - 🟡 Jaune : Événements neutres (trial_extended, plan_changed)
  - 🔴 Rouge : Événements négatifs (suspended, cancelled)
  - 🔵 Bleu : Événements informatifs (onboarding, payment)
- **Expand/collapse** : Cliquer "View Details" pour voir metadata complète
- **Actions** :
  - Reverse Event (si is_reversible = true et current user a permission)
  - Export Timeline (CSV, JSON, PDF)
  - Add Manual Event (admins seulement)
- **Filtres** :
  - Par event_type (dropdown multi-select)
  - Par date range (date picker)
  - Par performed_by_type (system, employee, member, api)
- **Statistics panel** (en haut) :
  - Total events
  - Days in trial
  - Days active
  - Suspension count
  - Last event date

**Composant à créer : `components/admin/LifecycleEventCard.tsx`**

Composant pour afficher un événement dans la timeline.

**Props :**

- event : LifecycleEvent complet
- onReverse : callback si utilisateur clique "Reverse Event"
- onViewDetails : callback si utilisateur clique "View Details"

**Affichage :**

- Icône couleur selon event_type
- Date et heure (format relatif : "Il y a 2 jours")
- Event_type en titre (ACTIVATED, SUSPENDED, etc.)
- Transition statut (si applicable) : "previous → new"
- Performed by avec nom et type
- Reason (si fourni)
- Next action (si défini) avec countdown
- Boutons actions (View Details, Reverse Event si applicable)

**Composant à créer : `components/admin/ReverseEventModal.tsx`**

Modal de confirmation pour annuler un événement.

**Contenu :**

```
Reverse Event: SUSPENDED

⚠️ This action will reverse the following event:
- Event Date: 15 Dec 2025 08:00
- Type: SUSPENDED
- Previous Status: active → New Status: suspended
- Performed By: System

A new "REACTIVATED" event will be created, and the tenant status will be restored to "active".

Reason for reversal (required):
┌──────────────────────────────────────────────────┐
│ [Textarea: Min 20 chars]                         │
│                                                  │
└──────────────────────────────────────────────────┘

[Cancel] [Confirm Reversal]
```

**Validation :**

- Reason min 20 caractères
- Demande confirmation explicite

### 🎬 RÉSULTAT DÉMONTRABLE

**Scénario démo complet pour le sponsor :**

**1. Accès timeline lifecycle**

- Naviguer vers /admin/tenants
- Cliquer sur tenant "ABC Logistics"
- Onglet "Lifecycle" apparaît dans le menu
- Cliquer onglet "Lifecycle"
- Timeline s'affiche avec tous les événements

**2. Consultation événements**

- Voir timeline verticale avec 8 événements
- Événements triés du plus récent au plus ancien
- Couleurs sémantiques visibles (vert, jaune, rouge)
- Statistiques en haut : "19 days in trial, 25 days active"

**3. Détails d'un événement**

- Cliquer "View Details" sur événement "SUSPENDED"
- Panel s'ouvre avec metadata complète :
  - Suspension type : payment_failure
  - Failed payment attempts : 3
  - Invoice ID : lien cliquable vers facture
  - Access level : read_only
  - Next action : Check payment status (18 Dec 08:00)
  - Countdown : "In 3 days"

**4. Filtrage timeline**

- Sélectionner "Event Type: suspended, reactivated" dans dropdown
- Timeline se filtre, affiche seulement 2 événements
- Sélectionner "Date Range: November 2025"
- Timeline affiche événements de novembre uniquement
- Cliquer "Reset Filters" → Timeline complète réapparaît

**5. Annulation d'un événement (Reverse)**

- Sur événement "SUSPENDED", bouton "[Reverse Event]" visible
- Cliquer "Reverse Event"
- Modal de confirmation s'ouvre
- Remplir reason : "Erreur système, paiement reçu mais non traité"
- Cliquer "Confirm Reversal"
- Modal se ferme, toast "Event reversed successfully"
- Nouvel événement "REACTIVATED" apparaît en haut de timeline
- Ancien événement "SUSPENDED" marqué avec badge "⚠️ Reversed"
- Statut tenant passe à "active"

**6. Ajout événement manuel**

- Cliquer bouton "+ Add Event" (admin seulement)
- Modal s'ouvre avec formulaire :
  - Event Type : dropdown (liste tous types)
  - Reason : textarea
  - Effective Date : date picker (défaut aujourd'hui)
  - Metadata : JSON editor (optionnel)
- Sélectionner "trial_extended"
- Reason : "Client demande extension pour finaliser configuration"
- Metadata : { extension_duration_days: 5 }
- Cliquer "Create Event"
- Nouvel événement apparaît dans timeline
- Trial_ends_at du tenant mis à jour automatiquement

**7. Export timeline**

- Cliquer bouton "Export" en haut
- Choisir format : CSV
- Fichier téléchargé : "abc-logistics-lifecycle-2025-12-17.csv"
- Ouvrir CSV : tous événements avec colonnes structurées

**Critères d'acceptation :**

- ✅ Timeline affiche tous événements du tenant
- ✅ Couleurs sémantiques correctes selon event_type
- ✅ Filtres fonctionnent (type, date)
- ✅ View Details affiche metadata complète
- ✅ Reverse Event fonctionne (crée événement inverse + restaure statut)
- ✅ Add Event permet création manuelle (admins seulement)
- ✅ Statistics panel calcule métriques correctement
- ✅ Export CSV/JSON fonctionne
- ✅ Next action avec countdown visible
- ✅ Performed by affiche nom correct (member, employee, system)
- ✅ Audit log créé pour chaque action (reverse, add)

### ⏱️ ESTIMATION

- Temps backend : **10 heures**
  - LifecycleEventService : 6h
  - LifecycleEventRepository : 2h
  - Webhooks et scheduled actions : 2h
- Temps API : **4 heures**
  - GET /lifecycle : 1.5h
  - POST /lifecycle : 1.5h
  - POST /reverse : 1h
- Temps frontend : **10 heures**
  - Page timeline : 6h
  - LifecycleEventCard composant : 2h
  - ReverseEventModal : 1h
  - Filtres et export : 1h
- **TOTAL : 24 heures (3 jours)**

### 🔗 DÉPENDANCES

**Prérequis obligatoires :**

- Chapitre 1.1 terminé (TenantService existe)
- Phase 0.1 terminée (BaseService)
- Table adm_tenant_lifecycle_events créée en DB
- Table adm_tenants avec colonne status

**Services/composants requis :**

- TenantService (pour détection transitions)
- AuditService (pour logging des reversals)
- NotificationService (pour notifications événements)

**Données de test nécessaires :**

- 1 tenant avec plusieurs événements lifecycle
- 1 admin FleetCore (adm_provider_employee)
- 1 admin tenant (adm_member)

### ✅ CHECKLIST DE VALIDATION

- [ ] **Backend** : LifecycleEventService compile, toutes méthodes implémentées
- [ ] **Backend** : createEvent() crée événement + met à jour tenant.status si nécessaire
- [ ] **Backend** : detectTransition() appelée automatiquement par TenantService
- [ ] **Backend** : reverseEvent() crée événement inverse + restaure statut
- [ ] **Backend** : triggerWebhooks() envoie POST vers webhooks configurés
- [ ] **Backend** : scheduleAction() programme jobs automatiques
- [ ] **API** : GET /lifecycle retourne timeline complète
- [ ] **API** : POST /lifecycle crée événement manuel
- [ ] **API** : POST /reverse annule événement (si réversible)
- [ ] **API** : GET /statistics calcule métriques globales
- [ ] **Frontend** : Page timeline affiche événements verticalement
- [ ] **Frontend** : Couleurs sémantiques selon event_type
- [ ] **Frontend** : Filtres fonctionnent (type, date)
- [ ] **Frontend** : View Details affiche metadata
- [ ] **Frontend** : Reverse Event fonctionne avec modal confirmation
- [ ] **Frontend** : Add Event permet création manuelle (admins)
- [ ] **Frontend** : Export CSV/JSON fonctionne
- [ ] **Tests** : 20+ tests unitaires LifecycleEventService
- [ ] **Tests** : Test E2E complet création tenant → événements automatiques
- [ ] **Démo** : Sponsor voit timeline complète d'un tenant
- [ ] **Démo** : Sponsor peut annuler un événement réversible

---

## ÉTAPE 4.2 : Audit Logs

### 🎯 RATIONNEL MÉTIER

**POURQUOI :** La traçabilité complète de TOUTES les actions sensibles est une exigence :

- **Réglementaire** : RGPD (droit d'accès), SOC 2 (audit trail), ISO 27001 (sécurité)
- **Légale** : Preuve en cas de litige (qui a modifié ce contrat ? quand ?)
- **Sécurité** : Détection d'intrusions, data breach, abus de permissions
- **Support** : Debugging (pourquoi ce vehicle est passé en maintenance ?)
- **Compliance** : Démonstration de conformité lors d'audits externes

Sans audit logs, impossible de répondre aux questions :

- "Qui a supprimé ce driver le 15 novembre ?"
- "Quelle était la valeur du revenue avant modification ?"
- "Combien de tentatives de connexion échouées sur ce compte ?"
- "Ce membre a-t-il exporté des données sensibles récemment ?"

**QUEL PROBLÈME :** Actuellement, les logs applicatifs sont dispersés (console logs, fichiers logs, logs Vercel). Impossible de :

- Rechercher une action spécifique ("Qui a modifié le vehicle ABC-123 ?")
- Corréler des événements (attaque en 5 étapes sur 3 heures)
- Prouver la conformité (pas de logs structurés pour GDPR audit)
- Restaurer un état antérieur (pas d'historique "old_values")

**IMPACT SI ABSENT :**

- **Réglementaire** : Amende RGPD jusqu'à 4% CA global (20M€ pour Uber en 2018)
- **Sécurité** : Impossible de détecter data breach (découvert 6 mois trop tard)
- **Légal** : Perte procès car aucune preuve de qui a fait quoi
- **Support** : 2h de debugging au lieu de 5 minutes (pas de trace des modifications)
- **Compliance** : Échec audit SOC 2 = perte de 40% clients B2B

**CAS D'USAGE CONCRET :**

**Contexte :** Tenant ABC Logistics signale un problème : "Le vehicle ABC-123 a disparu de notre liste hier, et nous ne l'avons pas supprimé".

**Sans audit logs :**
Support passe 2h à :

- Checker logs Vercel (dispersés, non structurés)
- Checker logs Supabase (pas de contexte utilisateur)
- Checker sauvegardes DB (lourde restauration)
- Conclusion : "On ne sait pas ce qui s'est passé"
- Client mécontent, perte de confiance

**Avec audit logs :**
Support ouvre dashboard audit logs, recherche :

- Entity : vehicles
- Entity_id : ABC-123
- Action : delete
- Date range : 48 dernières heures

**Résultat en 30 secondes :**

```
┌─────────────────────────────────────────────────────────┐
│ Audit Log #45789                                        │
├─────────────────────────────────────────────────────────┤
│ Timestamp: 2025-12-16 14:32:15 UTC                     │
│ Entity: vehicles                                        │
│ Entity ID: ABC-123                                      │
│ Action: DELETE                                          │
│ Performed by: Marie Dupont (member)                     │
│ Email: marie@abclogistics.ae                           │
│ Role: Manager Zone Nord                                │
│ IP: 192.168.1.45                                        │
│ User Agent: Chrome 120.0.0 / Windows 11                │
│                                                         │
│ OLD VALUES (before delete):                             │
│ {                                                       │
│   "id": "ABC-123",                                      │
│   "license_plate": "AD-12345-AE",                       │
│   "status": "active",                                   │
│   "brand": "Toyota",                                    │
│   "model": "Camry"                                      │
│ }                                                       │
│                                                         │
│ Reason: "Vehicle sold to external client"              │
└─────────────────────────────────────────────────────────┘
```

Support appelle le tenant :

- "Votre manager Marie Dupont a supprimé le vehicle ABC-123 le 16 décembre à 14h32 avec raison 'Vehicle sold to external client'. Voulez-vous le restaurer ?"
- Tenant : "Ah oui c'est Marie ! Je lui avais demandé, tout est normal merci"
- Ticket résolu en 3 minutes au lieu de 2h

**Autre cas : Détection attaque brute force**

Système détecte automatiquement via analyse audit logs :

```
ALERTE SÉCURITÉ - Possible brute force attack
┌──────────────────────────────────────────────────────────┐
│ Member: john@competitor.com                              │
│ Tenant: ABC Logistics                                    │
│ Action: 47 failed_login_attempts                         │
│ Timeframe: 2025-12-17 02:00 → 02:15 (15 minutes)       │
│ IP: 85.12.34.56 (Russia)                                │
│ Pattern: Dictionary attack (common passwords)            │
│                                                          │
│ ACTIONS TAKEN:                                           │
│ ✅ Account locked until 2025-12-17 08:00                │
│ ✅ Email sent to account owner                          │
│ ✅ Notification sent to Security team                   │
│ ✅ IP 85.12.34.56 blocked at firewall level            │
└──────────────────────────────────────────────────────────┘
```

Sans audit logs structurés, cette attaque passe inaperçue jusqu'au data breach.

**Valeur business :**

- **Conformité** : 100% audit trail = passage audits SOC 2, ISO 27001, GDPR
- **Support** : Résolution tickets 10x plus rapide (5 min au lieu de 2h)
- **Sécurité** : Détection attaques en temps réel au lieu de 6 mois trop tard
- **Légal** : Preuve irréfutable en cas de litige (qui a fait quoi, quand)
- **Analytics** : Analyse usage (quelles fonctionnalités utilisées ? par qui ?)

### 📊 DONNÉES ET RÈGLES MÉTIER

**Table principale : `adm_audit_logs`**

**Colonnes critiques (25 colonnes) :**

| Colonne                   | Type         | Obligatoire | Utilité Business                                         |
| ------------------------- | ------------ | ----------- | -------------------------------------------------------- |
| **id**                    | uuid         | OUI         | Identifiant unique log (PK)                              |
| **tenant_id**             | uuid         | OUI         | Tenant concerné (isolation multi-tenant)                 |
| **member_id**             | uuid         | NON         | Membre ayant effectué l'action                           |
| **entity**                | varchar(50)  | OUI         | Type entité modifiée (vehicles, drivers, etc.)           |
| **entity_id**             | uuid         | OUI         | ID de l'entité modifiée                                  |
| **action**                | varchar(50)  | OUI         | Type action (create, read, update, delete, export)       |
| **changes**               | jsonb        | NON         | Diff avant/après pour updates                            |
| **ip_address**            | varchar(45)  | NON         | IPv4 ou IPv6                                             |
| **user_agent**            | text         | NON         | Browser/OS de l'utilisateur                              |
| **timestamp**             | timestamp    | OUI         | Quand l'action s'est produite (immutable)                |
| **severity**              | text         | OUI         | Niveau gravité (info, warning, error, critical)          |
| **category**              | text         | OUI         | Catégorie (security, financial, compliance, operational) |
| **session_id**            | uuid         | NON         | Session utilisateur (pour corréler actions)              |
| **request_id**            | uuid         | NON         | ID requête HTTP (pour debugging)                         |
| **old_values**            | jsonb        | NON         | État avant modification (updates, deletes)               |
| **new_values**            | jsonb        | NON         | État après modification (creates, updates)               |
| **retention_until**       | timestamp    | NON         | Date suppression automatique (RGPD)                      |
| **tags**                  | text[]       | NON         | Tags pour recherche (ex: ["pii", "export", "sensitive"]) |
| **reason**                | text         | NON         | Raison de l'action (obligatoire pour deletes)            |
| **api_endpoint**          | varchar(255) | NON         | Endpoint API appelé                                      |
| **response_status**       | integer      | NON         | HTTP status code (200, 403, 500, etc.)                   |
| **duration_ms**           | integer      | NON         | Durée traitement requête (performance)                   |
| **error_message**         | text         | NON         | Si erreur, message complet                               |
| **correlation_id**        | uuid         | NON         | Pour corréler logs multi-services                        |
| **performed_by_clerk_id** | varchar(255) | NON         | Clerk user ID (pour sync)                                |

**Actions possibles (action ENUM) :**

```
ACTIONS STANDARD (CRUD):
- create : Création nouvelle entité
- read : Consultation entité (optionnel, volumétrique)
- update : Modification entité existante
- delete : Suppression entité
- restore : Restauration après soft delete

ACTIONS SPÉCIFIQUES:
- export : Export données (CSV, PDF, etc.)
- import : Import données bulk
- login : Tentative connexion (succès ou échec)
- logout : Déconnexion
- permission_granted : Permission accordée
- permission_revoked : Permission révoquée
- password_changed : Changement mot de passe
- mfa_enabled : Activation MFA
- mfa_disabled : Désactivation MFA
- api_key_created : Création API key
- api_key_revoked : Révocation API key
- webhook_triggered : Webhook déclenché
- batch_process : Traitement par lot
```

**Severity levels :**

```
INFO (0):
- Actions normales quotidiennes
- Consultations, créations standards
- Exemples : create vehicle, update driver phone

WARNING (1):
- Actions inhabituelles mais légitimes
- Changements configuration importante
- Exemples : role change, export large dataset

ERROR (2):
- Actions qui ont échoué
- Erreurs techniques ou validation
- Exemples : failed login, permission denied

CRITICAL (3):
- Incidents de sécurité
- Violations conformité
- Exemples : data breach, unauthorized access
```

**Categories :**

```
SECURITY:
- Login attempts, permission changes, MFA events
- Accès non autorisés, tentatives intrusion

FINANCIAL:
- Modifications revenues, invoices, payments
- Changements plans, tarifs

COMPLIANCE:
- Exports données, suppressions, anonymisations
- Changements settings RGPD

OPERATIONAL:
- Actions quotidiennes normales
- CRUD vehicles, drivers, trips
```

**Règles de logging automatique :**

**Règle 1 : Logging automatique via BaseService**
Toutes les méthodes BaseService (create, update, delete) appellent automatiquement auditService.log() :

```typescript
// Dans BaseService.create()
async create(data: T): Promise<T> {
  // Création entité
  const entity = await this.repository.create(data);

  // Audit automatique
  await auditService.log({
    entity: this.entityName,
    entity_id: entity.id,
    action: 'create',
    new_values: entity,
    severity: 'info',
    category: 'operational'
  });

  return entity;
}
```

**Règle 2 : Old_values obligatoire pour updates et deletes**

```
SI action = 'update'
  ALORS old_values = état AVANT modification (requis)
  ET new_values = état APRÈS modification (requis)
  ET changes = diff calculé (optionnel mais recommandé)

SI action = 'delete'
  ALORS old_values = entité complète avant suppression (requis)
  ET new_values = null
```

**Règle 3 : Reason obligatoire pour actions sensibles**

```
Actions REQUIRING reason:
- delete (toutes suppressions)
- permission_revoked (pourquoi retirer permission ?)
- mfa_disabled (pourquoi désactiver sécurité ?)
- export (pourquoi exporter ces données ?)
- batch_delete (suppression multiple)
```

**Règle 4 : Retention selon catégorie**

```
ALGORITHME calculateRetention :
  ENTRÉE : category, action

  SI category = 'security' OR action = 'login'
    ALORS retention = 2 ans (obligation légale)
  SINON SI category = 'financial'
    ALORS retention = 10 ans (obligation comptable)
  SINON SI category = 'compliance' OR tags contient 'pii'
    ALORS retention = 3 ans (RGPD)
  SINON
    ALORS retention = 1 an (défaut opérationnel)
  FIN SI

  retention_until = timestamp + retention

  SORTIE : retention_until
```

**Règle 5 : Tags automatiques selon contexte**

```
Tags automatiques ajoutés selon l'action :

SI entity = 'adm_members' AND action = 'update' AND champs_modifiés contient 'email'
  ALORS tags += ['pii', 'personal_data']

SI action = 'export' AND volume > 1000 records
  ALORS tags += ['bulk_export', 'sensitive']

SI action = 'delete' AND entity IN ('revenues', 'invoices')
  ALORS tags += ['financial', 'irreversible']

SI response_status >= 400
  ALORS tags += ['error', 'failed']

SI ip_address NOT IN whitelist_ips
  ALORS tags += ['external_access']
```

**Règle 6 : Détection patterns suspects**

```
PATTERN : Brute Force Attack
CONDITION :
  COUNT(action = 'login' AND response_status = 401)
  WHERE member_id = X
  AND timestamp > NOW() - 15 minutes
  > 10 tentatives

ACTION :
  - severity = 'critical'
  - tags += ['brute_force', 'security_incident']
  - Alerter Security team
  - Verrouiller compte temporairement

PATTERN : Data Exfiltration
CONDITION :
  COUNT(action = 'export')
  WHERE member_id = X
  AND timestamp > NOW() - 1 hour
  > 5 exports
  OR volume_total > 10000 records

ACTION :
  - severity = 'critical'
  - tags += ['data_exfiltration', 'security_incident']
  - Alerter Security team
  - Révoquer permissions export temporairement

PATTERN : Privilege Escalation
CONDITION :
  action = 'permission_granted'
  AND new_values.permissions contient 'admin'
  AND performed_by != super_admin

ACTION :
  - severity = 'warning'
  - tags += ['privilege_change', 'review_required']
  - Alerter Compliance team
  - Requérir approbation manager
```

**Règle 7 : Immuabilité**
Les audit logs sont **IMMUTABLES**. Aucune modification, aucune suppression (sauf après retention_until).

```
CREATE POLICY immutable_audit_logs ON adm_audit_logs
  FOR UPDATE
  TO authenticated
  USING (false);

CREATE POLICY immutable_audit_logs_delete ON adm_audit_logs
  FOR DELETE
  TO authenticated
  USING (retention_until < NOW());
```

### 🏗️ COMPOSANTS À DÉVELOPPER

#### Backend (Service Layer)

**Fichier à créer : `lib/services/admin/audit.service.ts`**

Service centralisé pour gérer tous les audit logs.

**Classe AuditService extends BaseService :**

**Méthode log(data: AuditLogCreateInput) → Promise<AuditLog>**
Méthode principale appelée partout dans le système pour logger une action.

1. Extraire contexte de la requête actuelle :
   - tenant_id depuis context
   - member_id depuis auth session
   - ip_address depuis headers
   - user_agent depuis headers
   - session_id depuis cookies
   - request_id depuis headers (X-Request-ID)
2. Valider data avec AuditLogCreateSchema
3. Calculer retention_until selon category et action
4. Ajouter tags automatiques selon règles
5. Si action = update :
   - Calculer changes = diff(old_values, new_values)
6. Déterminer severity si non fournie :
   - action = delete → warning
   - response_status >= 500 → error
   - tags contient 'security_incident' → critical
7. Créer log dans DB via auditLogRepository.create()
8. Si severity = critical :
   - Envoyer alerte immédiate Security team
   - Créer incident dans système monitoring
9. Analyser patterns suspects (async, non-bloquant)
10. Retourner log créé

**Méthode search(filters: AuditSearchFilters) → Promise<PaginatedAuditLogs>**
Recherche avancée dans les logs avec filtres multiples.

1. Construire query Prisma avec filtres :
   - tenant_id (obligatoire sauf si super admin)
   - entity, entity_id
   - action
   - member_id
   - date_range (from, to)
   - severity
   - category
   - tags (array contains)
   - search_text (full-text sur reason, error_message)
2. Ajouter ORDER BY timestamp DESC
3. Paginer (limit, offset)
4. Inclure relations (member, tenant)
5. Calculer agrégations :
   - Total count
   - Count par severity
   - Count par action
6. Retourner { logs, total, aggregations, page, limit }

**Méthode detectSuspiciousBehavior(tenantId: string) → Promise<SecurityAlert[]>**
Analyse les logs récents pour détecter patterns suspects.

1. Récupérer logs des 24 dernières heures pour tenant
2. Analyser pattern brute force :
   - Compter failed login par member
   - Si > 10 en 15 min → créer alerte
3. Analyser pattern data exfiltration :
   - Compter exports par member
   - Si > 5 en 1h OU volume > 10k records → créer alerte
4. Analyser pattern permission escalation :
   - Chercher permission_granted avec rôle admin
   - Si performed_by != super_admin → créer alerte
5. Analyser pattern after-hours access :
   - Chercher actions entre 23h-6h
   - Si membre non autorisé → créer alerte
6. Pour chaque alerte :
   - Créer audit log avec severity = critical
   - tags = ['automated_detection', pattern_name]
   - Envoyer notification Security team
7. Retourner liste alertes

**Méthode getActivityTimeline(entityType: string, entityId: string) → Promise<AuditLog[]>**
Récupère l'historique complet d'une entité spécifique.

1. Chercher tous logs WHERE entity = entityType AND entity_id = entityId
2. Trier par timestamp ASC (chronologique)
3. Inclure relations (member qui a fait l'action)
4. Retourner timeline complète

**Méthode export(filters: AuditSearchFilters, format: 'csv' | 'json') → Promise<string>**
Exporte les logs selon filtres.

1. Récupérer logs avec search(filters) sans pagination
2. SI format = 'csv' :
   - Convertir en CSV avec headers
   - Flatten nested JSON (old_values, new_values)
3. SINON SI format = 'json' :
   - Serializer en JSON pretty-print
4. Créer audit log de l'export lui-même :
   - action = 'export'
   - entity = 'audit_logs'
   - metadata = { filters, format, count }
   - tags = ['audit_export', 'compliance']
5. Retourner string (CSV ou JSON)

**Méthode purgeExpired() → Promise<number>**
Job automatique pour supprimer les logs expirés.

1. Trouver tous logs WHERE retention_until < NOW()
2. Pour chaque log :
   - Archiver dans cold storage (S3) si required
   - Supprimer de DB
3. Créer audit log du purge :
   - action = 'batch_delete'
   - entity = 'audit_logs'
   - metadata = { count_deleted, retention_policy }
4. Retourner nombre logs supprimés

**Méthode getStatistics(tenantId: string, dateRange: DateRange) → Promise<AuditStatistics>**
Calcule statistiques d'utilisation.

```typescript
{
  total_actions: number,
  actions_by_type: Record<string, number>,
  actions_by_member: Array<{ member_id, member_name, count }>,
  actions_by_hour: Array<{ hour, count }>, // Heatmap
  top_entities: Array<{ entity, count }>,
  error_rate: number,
  severity_distribution: Record<Severity, number>,
  suspicious_activities: number
}
```

**Fichier à créer : `lib/repositories/admin/audit-log.repository.ts`**

Repository pour accès à la table adm_audit_logs.

**Méthodes principales :**

- create(data) : Création log (immutable)
- findByFilters(filters) : Recherche avancée
- findByEntity(entity, entityId) : Timeline entité
- countByFilters(filters) : Compter logs
- aggregateByField(field) : Agréger (ex: count par action)
- findRecent(tenantId, minutes) : Logs X dernières minutes

**Optimisations importantes :**

- Index composites sur (tenant_id, timestamp DESC)
- Index GIN sur tags pour recherche array
- Index GIN sur changes pour full-text search JSON
- Partitioning par mois (si volume > 10M logs)

#### API REST (Endpoints)

**Fichier à créer : `app/api/v1/admin/audit/logs/route.ts`**

**GET /api/v1/admin/audit/logs**

- **Description** : Rechercher audit logs avec filtres avancés
- **Query params** :
  - tenant_id : filter par tenant (optionnel si super admin)
  - entity : filter par type entité
  - entity_id : filter par ID entité
  - action : filter par action
  - member_id : filter par membre
  - from_date, to_date : période
  - severity : filter par gravité
  - category : filter par catégorie
  - tags : filter par tags (array)
  - search : full-text search
  - limit, offset : pagination
- **Permissions** : audit.read (compliance team, super admins)
- **Réponse 200** :

```json
{
  "logs": [
    {
      "id": "uuid",
      "timestamp": "2025-12-16T14:32:15Z",
      "tenant_id": "uuid",
      "member": {
        "id": "uuid",
        "name": "Marie Dupont",
        "email": "marie@abclogistics.ae"
      },
      "entity": "vehicles",
      "entity_id": "uuid",
      "action": "delete",
      "severity": "warning",
      "category": "operational",
      "old_values": {
        "id": "ABC-123",
        "license_plate": "AD-12345-AE",
        "status": "active"
      },
      "new_values": null,
      "reason": "Vehicle sold to external client",
      "ip_address": "192.168.1.45",
      "user_agent": "Chrome 120.0.0 / Windows 11",
      "session_id": "uuid",
      "tags": ["manual_delete", "operational"]
    }
  ],
  "total": 1247,
  "page": 1,
  "limit": 50,
  "aggregations": {
    "by_severity": {
      "info": 950,
      "warning": 245,
      "error": 45,
      "critical": 7
    },
    "by_action": {
      "create": 423,
      "update": 567,
      "delete": 89,
      "read": 168
    }
  }
}
```

**POST /api/v1/admin/audit/logs**

- **Description** : Créer log manuellement (rare, pour intégrations externes)
- **Body** : AuditLogCreateInput
- **Permissions** : audit.create (restricted)
- **Réponse 201** : Log créé

**Fichier à créer : `app/api/v1/admin/audit/logs/export/route.ts`**

**POST /api/v1/admin/audit/logs/export**

- **Description** : Exporter logs en CSV ou JSON
- **Body** :

```json
{
  "filters": {
    "tenant_id": "uuid",
    "from_date": "2025-12-01",
    "to_date": "2025-12-31",
    "category": "financial"
  },
  "format": "csv"
}
```

- **Permissions** : audit.export (compliance, super admins)
- **Réponse 200** :

```json
{
  "download_url": "https://cdn.fleetcore.com/exports/audit-logs-2025-12-17.csv",
  "expires_at": "2025-12-18T10:00:00Z",
  "file_size_bytes": 2456789,
  "records_count": 1247
}
```

- **Erreurs** :
  - 403 : Insufficient permissions
  - 422 : Date range too large (max 1 year)

**Fichier à créer : `app/api/v1/admin/audit/entities/[type]/[id]/timeline/route.ts`**

**GET /api/v1/admin/audit/entities/[type]/[id]/timeline**

- **Description** : Timeline complète d'une entité
- **Exemple** : GET /api/v1/admin/audit/entities/vehicles/ABC-123/timeline
- **Permissions** : audit.read
- **Réponse 200** :

```json
{
  "entity_type": "vehicles",
  "entity_id": "ABC-123",
  "timeline": [
    {
      "timestamp": "2025-11-01T10:00:00Z",
      "action": "create",
      "member": "Ahmed Al-Mansoori",
      "changes": null,
      "new_values": { "license_plate": "AD-12345-AE", "status": "active" }
    },
    {
      "timestamp": "2025-11-15T14:20:00Z",
      "action": "update",
      "member": "Sarah Manager",
      "changes": { "status": { "from": "active", "to": "maintenance" } }
    },
    {
      "timestamp": "2025-12-16T14:32:15Z",
      "action": "delete",
      "member": "Marie Dupont",
      "reason": "Vehicle sold",
      "old_values": { "status": "active" }
    }
  ],
  "total_events": 3
}
```

**Fichier à créer : `app/api/v1/admin/audit/statistics/route.ts`**

**GET /api/v1/admin/audit/statistics**

- **Description** : Statistiques globales audit logs
- **Query params** :
  - tenant_id : filter par tenant
  - from_date, to_date : période
- **Permissions** : analytics.read
- **Réponse 200** : AuditStatistics (voir structure ci-dessus)

**Fichier à créer : `app/api/v1/admin/audit/alerts/route.ts`**

**GET /api/v1/admin/audit/alerts**

- **Description** : Liste alertes sécurité détectées
- **Query params** :
  - tenant_id : filter par tenant
  - severity : filter par gravité
  - status : filter par statut (new, investigating, resolved)
- **Permissions** : security.read
- **Réponse 200** :

```json
{
  "alerts": [
    {
      "id": "uuid",
      "detected_at": "2025-12-17T02:15:00Z",
      "alert_type": "brute_force_attack",
      "severity": "critical",
      "tenant_id": "uuid",
      "member_id": "uuid",
      "member_name": "john@competitor.com",
      "details": {
        "failed_attempts": 47,
        "timeframe_minutes": 15,
        "ip_address": "85.12.34.56",
        "country": "Russia"
      },
      "actions_taken": ["Account locked", "Email sent to owner", "IP blocked"],
      "status": "investigating",
      "assigned_to": "Security Team"
    }
  ],
  "total": 3,
  "new_count": 1,
  "investigating_count": 2
}
```

#### Frontend (Interface Utilisateur)

**Fichier à créer : `app/[locale]/admin/audit/logs/page.tsx`**

Page principale dashboard audit logs avec recherche avancée.

**Layout de la page :**

```
┌────────────────────────────────────────────────────────────┐
│ HEADER                                                     │
│ [FleetCore Logo] Admin > Audit Logs     [🔍 Advanced Search]│
└────────────────────────────────────────────────────────────┘
┌────────────────────────────────────────────────────────────┐
│ STATISTICS CARDS                                           │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐      │
│ │ Total    │ │ Critical │ │ Errors   │ │ Exports  │      │
│ │ 1,247    │ │ 7        │ │ 45       │ │ 12       │      │
│ │ logs     │ │ alerts   │ │ failures │ │ today    │      │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘      │
└────────────────────────────────────────────────────────────┘
┌────────────────────────────────────────────────────────────┐
│ FILTERS                                                    │
│ [Entity: All ▼] [Action: All ▼] [Severity: All ▼]         │
│ [Date Range: Last 7 days ▼] [Member: All ▼]               │
│ [🔍 Search text...........................] [Apply]        │
└────────────────────────────────────────────────────────────┘
┌────────────────────────────────────────────────────────────┐
│ AUDIT LOGS TABLE                                           │
│ ┌──────────┬────────┬────────┬──────────┬────────────────┐ │
│ │ Time     │ Member │ Action │ Entity   │ Details        │ │
│ ├──────────┼────────┼────────┼──────────┼────────────────┤ │
│ │ 14:32:15 │ Marie  │ DELETE │ vehicles │ ABC-123 sold   │ │
│ │ 🟡       │ Dupont │ ⚠️     │          │ [View]         │ │
│ ├──────────┼────────┼────────┼──────────┼────────────────┤ │
│ │ 14:20:05 │ Ahmed  │ UPDATE │ drivers  │ Status changed │ │
│ │ 🟢       │ Admin  │ ✏️     │          │ [View]         │ │
│ ├──────────┼────────┼────────┼──────────┼────────────────┤ │
│ │ 02:15:23 │ john@  │ LOGIN  │ auth     │ Failed (47x)   │ │
│ │ 🔴       │ compet │ ❌     │          │ [Alert]        │ │
│ └──────────┴────────┴────────┴──────────┴────────────────┘ │
│ [Previous] Page 1 of 25 [Next]      [Export CSV] [Export JSON]│
└────────────────────────────────────────────────────────────┘
```

**Fonctionnalités :**

- **Statistics cards** : Métriques temps réel (total logs, critical alerts, errors)
- **Filtres multiples** :
  - Entity type (dropdown multi-select)
  - Action type (dropdown multi-select)
  - Severity (dropdown)
  - Date range (date picker avec presets : Today, Last 7 days, Last 30 days, Custom)
  - Member (autocomplete)
  - Full-text search (raison, error_message)
- **Table responsive** :
  - Colonnes : Time, Member, Action, Entity, Severity, Details
  - Couleurs sémantiques selon severity
  - Icons selon action (✏️ update, ❌ delete, ➕ create)
  - Bouton "View" pour expand details
- **Actions** :
  - Export CSV/JSON (avec filtres appliqués)
  - View timeline d'une entité
  - View alertes sécurité
- **Pagination** : 50 logs par page, navigation standard

**Composant à créer : `components/admin/AuditLogDetailModal.tsx`**

Modal pour afficher détails complets d'un audit log.

**Contenu :**

```
Audit Log Details

┌──────────────────────────────────────────────────────────┐
│ Timestamp: 2025-12-16 14:32:15 UTC                       │
│ Severity: ⚠️ WARNING                                     │
│ Category: Operational                                    │
├──────────────────────────────────────────────────────────┤
│ ENTITY:                                                  │
│ Type: vehicles                                           │
│ ID: ABC-123                                              │
│ License Plate: AD-12345-AE                               │
├──────────────────────────────────────────────────────────┤
│ ACTION: DELETE                                           │
│ Reason: Vehicle sold to external client                  │
├──────────────────────────────────────────────────────────┤
│ PERFORMED BY:                                            │
│ Name: Marie Dupont                                       │
│ Email: marie@abclogistics.ae                            │
│ Role: Manager Zone Nord                                 │
│ IP: 192.168.1.45                                         │
│ User Agent: Chrome 120.0.0 / Windows 11                 │
│ Session ID: abc-def-ghi                                  │
├──────────────────────────────────────────────────────────┤
│ OLD VALUES (before delete):                              │
│ {                                                        │
│   "id": "ABC-123",                                       │
│   "license_plate": "AD-12345-AE",                        │
│   "status": "active",                                    │
│   "brand": "Toyota",                                     │
│   "model": "Camry",                                      │
│   "year": 2023                                           │
│ }                                                        │
├──────────────────────────────────────────────────────────┤
│ TAGS:                                                    │
│ [manual_delete] [operational] [vehicle_sold]            │
├──────────────────────────────────────────────────────────┤
│ TECHNICAL:                                               │
│ API Endpoint: DELETE /api/v1/fleet/vehicles/ABC-123     │
│ Response Status: 200 OK                                  │
│ Duration: 234 ms                                         │
│ Request ID: req-abc-123                                  │
└──────────────────────────────────────────────────────────┘

[Close] [View Entity Timeline] [Export Log]
```

**Composant à créer : `components/admin/AuditTimelineView.tsx`**

Composant timeline verticale pour afficher historique d'une entité.

**Props :**

- entityType : string
- entityId : string

**Affichage :**
Timeline verticale similaire à LifecycleEvents, mais pour une entité spécifique (vehicle, driver, etc.)

- Chaque événement affiché avec icône, timestamp, action, membre
- Couleurs selon severity
- Expand/collapse pour voir old_values/new_values/changes

**Page à créer : `app/[locale]/admin/audit/alerts/page.tsx`**

Page dashboard alertes sécurité.

**Layout :**

```
Security Alerts

┌──────────────────────────────────────────────────────────┐
│ ACTIVE ALERTS (3)                                        │
│                                                          │
│ 🔴 CRITICAL - Brute Force Attack                        │
│ Member: john@competitor.com                              │
│ 47 failed login attempts in 15 minutes                   │
│ IP: 85.12.34.56 (Russia)                                │
│ Actions taken: Account locked, IP blocked                │
│ Status: Investigating | Assigned: Security Team          │
│ [View Details] [Mark Resolved]                           │
│                                                          │
│ 🟡 WARNING - Unusual Export Activity                    │
│ Member: sarah@abclogistics.ae                           │
│ 8 data exports in 2 hours (5,230 records)               │
│ Status: New | [Investigate]                              │
│                                                          │
│ 🟡 WARNING - After-Hours Access                         │
│ Member: marie@abclogistics.ae                           │
│ Login at 03:45 AM from unknown IP                       │
│ Status: New | [Investigate]                              │
└──────────────────────────────────────────────────────────┘
```

### 🎬 RÉSULTAT DÉMONTRABLE

**Scénario démo complet pour le sponsor :**

**1. Dashboard audit logs**

- Naviguer vers /admin/audit/logs
- Dashboard s'affiche avec statistics cards
- Voir "Total: 1,247 logs, Critical: 7 alerts, Errors: 45"
- Table affiche logs récents (50 derniers)

**2. Recherche avancée**

- Filtrer "Entity: vehicles"
- Filtrer "Action: delete"
- Filtrer "Date Range: Last 30 days"
- Cliquer "Apply"
- Table se filtre, affiche 12 résultats
- Voir uniquement suppressions vehicles

**3. Détails d'un log**

- Cliquer "View" sur log de suppression vehicle ABC-123
- Modal s'ouvre avec détails complets :
  - Timestamp, severity, category
  - Entity (vehicles / ABC-123)
  - Action (DELETE)
  - Performed by (Marie Dupont)
  - Old values (véhicule complet avant suppression)
  - IP, User Agent, Session ID
  - Reason : "Vehicle sold to external client"
- Cliquer "View Entity Timeline"
- Timeline complète vehicle ABC-123 s'affiche (created → updated → deleted)

**4. Export pour compliance**

- Retour page principale audit logs
- Appliquer filtres : "Category: financial, Date: December 2025"
- Cliquer "Export CSV"
- Fichier téléchargé : "audit-logs-financial-dec-2025.csv"
- Ouvrir CSV : toutes colonnes structurées, prêt pour audit externe

**5. Alertes sécurité**

- Naviguer vers /admin/audit/alerts
- Voir 3 alertes actives
- Première alerte : "🔴 CRITICAL - Brute Force Attack"
  - john@competitor.com
  - 47 tentatives login échouées en 15 minutes
  - IP: 85.12.34.56 (Russia)
  - Actions automatiques : Account locked, IP blocked
  - Status: Investigating
- Cliquer "View Details"
- Voir liste complète des 47 tentatives avec timestamps
- Cliquer "Mark Resolved"
- Alerte passe à "Resolved", disparaît de la liste active

**6. Timeline entité spécifique**

- Retour audit logs
- Rechercher entity_id = ABC-123
- Cliquer "View Entity Timeline"
- Timeline verticale s'affiche :
  - 1 Nov 10:00 - CREATE (Ahmed)
  - 15 Nov 14:20 - UPDATE status active→maintenance (Sarah)
  - 20 Nov 09:30 - UPDATE status maintenance→active (Sarah)
  - 16 Dec 14:32 - DELETE (Marie, reason: "Vehicle sold")
- Expand détails événement UPDATE
- Voir changes : { "status": { "from": "active", "to": "maintenance" } }

**Critères d'acceptation :**

- ✅ Dashboard affiche statistics cards temps réel
- ✅ Filtres multiples fonctionnent (entity, action, severity, date, member, search)
- ✅ Table affiche logs paginés (50 par page)
- ✅ View Details modal affiche log complet (old_values, new_values, metadata)
- ✅ Export CSV/JSON fonctionne avec filtres appliqués
- ✅ Timeline entité affiche historique chronologique complet
- ✅ Alertes sécurité détectées automatiquement et affichées
- ✅ Couleurs sémantiques selon severity (vert, jaune, rouge)
- ✅ Icons selon action type (✏️ update, ❌ delete, ➕ create)
- ✅ Tous logs immutables (aucune modification possible)
- ✅ Retention automatique appliquée (purge après expiration)
- ✅ Patterns suspects détectés (brute force, data exfiltration)

### ⏱️ ESTIMATION

- Temps backend : **12 heures**
  - AuditService complet : 6h
  - Pattern detection (brute force, exfiltration) : 3h
  - AuditLogRepository avec optimisations : 2h
  - Export CSV/JSON : 1h
- Temps API : **4 heures**
  - GET /logs avec filtres avancés : 2h
  - GET /timeline : 1h
  - GET /alerts : 1h
- Temps frontend : **14 heures**
  - Page audit logs dashboard : 6h
  - AuditLogDetailModal : 2h
  - AuditTimelineView : 3h
  - Page alerts sécurité : 3h
- **TOTAL : 30 heures (3.5 jours)**

### 🔗 DÉPENDANCES

**Prérequis obligatoires :**

- Phase 0.1 terminée (BaseService qui appelle auditService.log())
- Table adm_audit_logs créée avec indexes
- Table adm_audit_logs avec RLS policy d'immuabilité

**Services/composants requis :**

- BaseService (pour appels automatiques audit)
- NotificationService (pour alertes sécurité)
- All services métier (appellent auditService via BaseService)

**Données de test nécessaires :**

- 1000+ audit logs variés (create, update, delete, login)
- 1 alerte sécurité (brute force simulée)
- 1 tenant avec activité complète

### ✅ CHECKLIST DE VALIDATION

- [ ] **Backend** : AuditService compile, toutes méthodes implémentées
- [ ] **Backend** : log() appelé automatiquement par BaseService.create/update/delete
- [ ] **Backend** : search() supporte tous filtres (entity, action, severity, date, tags, search)
- [ ] **Backend** : detectSuspiciousBehavior() détecte patterns (brute force, exfiltration, privilege escalation)
- [ ] **Backend** : export() génère CSV et JSON correctement
- [ ] **Backend** : purgeExpired() supprime logs expirés selon retention_until
- [ ] **Backend** : getStatistics() calcule métriques agrégées
- [ ] **Backend** : Immuabilité garantie (UPDATE/DELETE policies Postgres)
- [ ] **API** : GET /logs retourne logs paginés avec filtres
- [ ] **API** : GET /logs retourne aggregations (by_severity, by_action)
- [ ] **API** : POST /logs/export génère fichier téléchargeable
- [ ] **API** : GET /entities/[type]/[id]/timeline retourne historique complet
- [ ] **API** : GET /alerts retourne alertes sécurité détectées
- [ ] **Frontend** : Dashboard affiche statistics cards
- [ ] **Frontend** : Filtres multiples fonctionnent (entity, action, severity, date, member)
- [ ] **Frontend** : Full-text search fonctionne
- [ ] **Frontend** : Table affiche logs avec couleurs sémantiques
- [ ] **Frontend** : View Details modal affiche log complet
- [ ] **Frontend** : Timeline entité affiche historique chronologique
- [ ] **Frontend** : Page alerts affiche alertes actives
- [ ] **Frontend** : Export CSV/JSON fonctionne
- [ ] **Tests** : 30+ tests unitaires AuditService
- [ ] **Tests** : Test pattern detection (brute force, exfiltration)
- [ ] **Tests** : Test immuabilité logs (tentatives UPDATE/DELETE échouent)
- [ ] **Tests** : Test retention automatique
- [ ] **Tests** : Test E2E complet : action → log créé → visible dashboard
- [ ] **Démo** : Sponsor cherche audit log spécifique et le trouve en 10 secondes
- [ ] **Démo** : Sponsor exporte logs pour compliance
- [ ] **Démo** : Sponsor voit alerte sécurité brute force

---

# RÉCAPITULATIF CHAPITRE 4

## Durée Totale

| Étape                | Description             | Durée               |
| -------------------- | ----------------------- | ------------------- |
| **Étape 4.1**        | Tenant Lifecycle Events | **24h (3 jours)**   |
| **Étape 4.2**        | Audit Logs              | **30h (3.5 jours)** |
| **TOTAL CHAPITRE 4** | **Lifecycle & Audit**   | **54h (6.5 jours)** |

## Livrables Finaux

**Services Backend (4 fichiers) :**

- ✅ LifecycleEventService (gestion événements tenant)
- ✅ LifecycleEventRepository (accès DB lifecycle events)
- ✅ AuditService (logging centralisé + détection patterns)
- ✅ AuditLogRepository (accès DB audit logs + optimisations)

**APIs REST (8 routes) :**

- ✅ GET /tenants/[id]/lifecycle (timeline tenant)
- ✅ POST /tenants/[id]/lifecycle (créer événement manuel)
- ✅ POST /lifecycle/events/[id]/reverse (annuler événement)
- ✅ GET /lifecycle/statistics (métriques globales)
- ✅ GET /audit/logs (recherche avancée)
- ✅ POST /audit/logs/export (export CSV/JSON)
- ✅ GET /audit/entities/[type]/[id]/timeline (timeline entité)
- ✅ GET /audit/alerts (alertes sécurité)

**Interfaces Frontend (5 pages/composants) :**

- ✅ Page timeline lifecycle tenant
- ✅ LifecycleEventCard (composant événement)
- ✅ ReverseEventModal (annulation événement)
- ✅ Page dashboard audit logs
- ✅ AuditLogDetailModal (détails log)
- ✅ AuditTimelineView (timeline entité)
- ✅ Page alertes sécurité

**Fonctionnalités Clés :**

- ✅ Tous changements statut tenant loggés automatiquement
- ✅ Historique complet lifecycle consultable
- ✅ Événements réversibles (suspension, plan changes)
- ✅ Webhooks sortants pour intégrations externes
- ✅ Toutes actions CUD loggées automatiquement via BaseService
- ✅ Recherche avancée audit logs (filtres multiples)
- ✅ Détection automatique patterns suspects (brute force, exfiltration)
- ✅ Export compliance (CSV, JSON)
- ✅ Timeline complète par entité
- ✅ Immuabilité garantie (Postgres policies)
- ✅ Retention automatique selon catégorie
- ✅ Alertes sécurité temps réel

## Valeur Business

**CONFORMITÉ :**

- ✅ 100% audit trail pour RGPD, SOC 2, ISO 27001
- ✅ Preuve légale (qui a fait quoi, quand)
- ✅ Export pour audits externes

**SÉCURITÉ :**

- ✅ Détection attaques en temps réel (brute force, exfiltration)
- ✅ Alertes automatiques Security team
- ✅ Forensics complet en cas d'incident

**SUPPORT :**

- ✅ Résolution tickets 10x plus rapide (5 min vs 2h)
- ✅ Timeline complète visible en un clic
- ✅ Restauration états antérieurs possible

**ANALYTICS :**

- ✅ Métriques usage (quelles fonctionnalités utilisées ?)
- ✅ Conversion trial → active mesurable
- ✅ Churn analysis (pourquoi les clients partent ?)

---

**FIN DU CHAPITRE 4 - LIFECYCLE & AUDIT**

**Version:** 1.0 DÉFINITIVE  
**Date:** 10 Novembre 2025  
**Prochaine étape:** Validation sponsor + déploiement
