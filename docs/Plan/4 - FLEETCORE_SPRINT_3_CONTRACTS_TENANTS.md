# FLEETCORE - SPRINT 3 : CONTRACTS & TENANT ONBOARDING

## Gestion Contractuelle et Provisioning Client

**Durée Sprint 3 :** 3 jours ouvrés  
**Prérequis :** Sprint 2 terminé (Opportunity Pipeline complet avec win/lose)

---

## 📋 TABLES UTILISÉES DANS LE SPRINT 3

### Tables Principales

- **crm_contracts** (38 colonnes) - Gestion des contrats clients
- **crm_opportunities** (lecture/mise à jour status won)
- **crm_leads** (lecture pour traçabilité)
- **adm_tenants** (création et provisioning)
- **adm_members** (création premier admin)
- **adm_invitations** (invitation utilisateur initial)
- **adm_tenant_lifecycle_events** (événements de cycle de vie)
- **adm_audit_logs** (traçabilité complète)

### Tables de Référence

- **bil_billing_plans** (plans tarifaires)
- **bil_tenant_subscriptions** (abonnements clients)
- **crm_addresses** (adresses de facturation)
- **adm_provider_employees** (approbateurs contrats)
- **adm_roles** (rôles par défaut pour tenant)

---

## 🔄 TRANSITION SPRINT 2 → SPRINT 3

### État à la fin du Sprint 2.4

**Fonctionnalités disponibles :**

- ✅ Pipeline Opportunity complet avec 5 stages (Prospecting → Closing)
- ✅ Drag & drop opportunities entre stages
- ✅ Bouton "Win Opportunity" fonctionnel
- ✅ Modal Win avec saisie won_value et won_date
- ✅ Opportunity passe à status = "won"
- ✅ Bouton "Lose Opportunity" avec sélection loss_reason

**Données en base après Win :**

- Opportunity avec status = "won", won_date renseignée, won_value confirmée
- Lead d'origine toujours lié (lead_id)
- Owner (commercial) qui a gagné l'opportunité
- Metadata avec attribution marketing complète

**Ce qui manque (Sprint 3) :**

- ❌ Aucun contrat créé après le win
- ❌ Pas de tenant provisionné pour le nouveau client
- ❌ Client ne peut pas se connecter à la plateforme
- ❌ Pas de facturation initialisée

### Point de transition : Opportunity Won → Contract Creation

**Déclencheur de Sprint 3 :**
Lorsqu'un commercial clique "Win Opportunity" et confirme, le système doit automatiquement :

1. Créer un contrat (crm_contracts)
2. Provisionner un tenant (adm_tenants)
3. Créer le premier utilisateur admin (adm_members)
4. Initialiser l'abonnement (bil_tenant_subscriptions)
5. Envoyer invitation au contact principal

**Workflow attendu :**

```
Sprint 2 : Opportunity won
    ↓
Sprint 3.1 : Création automatique du contrat
    ↓
Sprint 3.2 : Provisioning du tenant
    ↓
Sprint 3.3 : Invitation premier admin
    ↓
Sprint 3.4 : Activation et onboarding
```

---

# SPRINT 3.1 : CRÉATION ET GESTION DES CONTRATS

**Durée :** 1 jour (8 heures)  
**Objectif :** Implémenter le module de gestion contractuelle complet avec création automatique post-win et workflows de renouvellement.

---

## ÉTAPE 3.1.1 : Service ContractService et Création Automatique

### 🎯 RATIONNEL MÉTIER

**POURQUOI :** Un contrat est l'engagement juridique formel entre FleetCore et le client. Sans contrat signé, pas de facturation, pas de service, pas de responsabilité légale définie. Le contrat doit être créé immédiatement après le win d'une opportunity pour capturer les conditions négociées (prix, durée, services inclus).

**QUEL PROBLÈME :** Actuellement, après un win d'opportunity, rien ne se passe. Le commercial doit manuellement créer un contrat dans un autre système (Excel, DocuSign), copier les informations, risque d'erreurs et perte de traçabilité. Délai moyen : 5 jours entre win et signature = risque de désengagement client.

**IMPACT SI ABSENT :**

- **Légal :** Pas de contrat = pas de protection juridique en cas de litige
- **Financier :** Délai facturation allongé, cash flow impacté
- **Expérience client :** Client attend 5 jours sans retour = frustration
- **Commercial :** Processus manuel = 2h par contrat perdu en saisie

**CAS D'USAGE CONCRET :**
L'opportunité "ABC Logistics" avec Ahmed Al-Mansoori est gagnée. Valeur négociée : 22,500€/an (75 véhicules × 25€/mois × 12). Le commercial Karim clique "Win" dans le pipeline, remplit :

- Won value : 22,500€
- Won date : 8 novembre 2025
- Notes : "Client très satisfait de la démo, prêt à démarrer immédiatement"

Le système doit automatiquement :

1. Créer un contrat dans crm_contracts avec :
   - contract_reference : "CTR-2025-00123" (référence externe client)
   - contract_code : "C2025-123" (code interne FleetCore)
   - opportunity_id : lien vers opportunity ABC Logistics
   - lead_id : lien vers lead Ahmed d'origine
   - tenant_id : sera renseigné à l'étape 3.2
   - total_value : 22,500€
   - currency : AED (car UAE)
   - contract_date : 8 nov 2025
   - effective_date : 15 nov 2025 (J+7 pour préparation)
   - expiry_date : 14 nov 2026 (1 an)
   - renewal_type : "automatic"
   - auto_renew : true
   - renewal_date : 14 nov 2026
   - notice_period_days : 30
   - status : "draft" (pas encore signé)
   - version_number : 1
   - company_name : "ABC Logistics"
   - contact_name : "Ahmed Al-Mansoori"
   - contact_email : "ahmed@abclogistics.ae"
   - contact_phone : "+971501234567"

2. Générer un PDF contrat pré-rempli avec toutes ces informations
3. Envoyer email à Ahmed avec lien DocuSign pour signature
4. Notifier l'équipe juridique pour validation si total_value > 20,000€

### 📊 DONNÉES ET RÈGLES MÉTIER

**Règles de génération des identifiants uniques :**

**contract_reference (externe client) :**

```
Format : "CTR-{YEAR}-{SEQUENCE}"
Exemple : "CTR-2025-00123"

Génération :
1. Extraire année courante (2025)
2. Chercher max(contract_reference) de l'année
3. Extraire numéro de séquence (00122)
4. Incrémenter (00123)
5. Formatter avec padding 5 digits
6. Préfixer "CTR-2025-"
```

**contract_code (interne FleetCore) :**

```
Format : "C{YEAR}-{SEQUENCE}"
Exemple : "C2025-123"

Génération :
1. Extraire année courante
2. Chercher max(contract_code) de l'année
3. Incrémenter séquence
4. Formatter sans padding
5. Préfixer "C2025-"
```

**Règles de calcul des dates contractuelles :**

**effective_date :**

```
Si contract_date = today
  ALORS effective_date = today + 7 jours (délai préparation standard)
SINON
  effective_date = date saisie manuellement
FIN SI

Contrainte : effective_date >= contract_date
```

**expiry_date (date de fin d'engagement) :**

```
expiry_date = effective_date + durée contrat

Durées standard :
- Plan Starter : 12 mois (1 an)
- Plan Standard : 12 mois (possibilité 24 mois)
- Plan Premium : 24 mois minimum

Contrainte : expiry_date > effective_date
```

**renewal_date (date de renouvellement) :**

```
SI auto_renew = true
  ALORS renewal_date = expiry_date
SINON
  renewal_date = NULL
FIN SI
```

**Règles de renouvellement automatique :**

**Types de renouvellement (renewal_type) :**

- **automatic** : Renouvellement automatique sans action. Le contrat se prolonge automatiquement à la renewal_date.
- **optional** : Renouvellement optionnel. Nécessite action manuelle du client ou commercial.
- **non_renewable** : Contrat non renouvelable. Expire à la expiry_date définitivement.

**Logique auto_renew :**

```
SI renewal_type = "automatic" ET auto_renew = true
ALORS
  - À renewal_date, créer nouveau contrat automatiquement
  - Incrémenter version_number de l'ancien contrat
  - Lier avec renewed_from_contract_id
  - Prolonger effective_date et expiry_date de 1 an
  - Status ancien contrat = "renewed"
  - Status nouveau contrat = "active"
FIN SI
```

**Notification de préavis (notice_period) :**

```
date_notification_preavais = expiry_date - notice_period_days

À cette date, envoyer emails :
- Client : "Votre contrat expire dans {notice_period_days} jours"
- Commercial : "Contrat ABC Logistics expire le {expiry_date}, prendre contact pour renouvellement"
- Finance : "Anticiper fin facturation contrat {contract_reference}"

SI auto_renew = true
  Message client : "Votre contrat sera renouvelé automatiquement sauf résiliation de votre part"
SINON
  Message client : "Merci de nous confirmer votre souhait de renouvellement"
FIN SI
```

**Règles de gestion des versions :**

**Création d'une nouvelle version (avenant) :**

```
Déclencheurs :
- Modification total_value (changement tarif ou nombre véhicules)
- Modification plan_id (upgrade/downgrade)
- Modification durée (extension ou réduction)
- Modification renewal_type

Actions :
1. Incrémenter version_number de l'ancien contrat
2. Créer nouveau contrat avec version_number++
3. Lier avec renewed_from_contract_id
4. Mettre expiration_date de l'ancien contrat = effective_date du nouveau
5. Status ancien = "superseded"
6. Status nouveau = "active"
7. Générer nouveau document_url (PDF)
8. Envoyer au client pour re-signature
```

**Règles de processus d'approbation :**

**Seuils d'approbation :**

```
SI total_value >= 50,000€
  ALORS approved_by OBLIGATOIRE (Director level)
SINON SI total_value >= 20,000€
  ALORS approved_by OBLIGATOIRE (Manager level)
SINON
  approved_by OPTIONNEL
FIN SI

Workflow approbation :
1. Contrat créé avec status = "pending_approval"
2. Notification envoyée à l'approbateur désigné
3. Approbateur consulte contrat, valide ou rejette
4. Si validé : approved_by renseigné, status = "draft"
5. Si rejeté : status = "rejected", deletion_reason renseignée
```

**Règles de signature électronique :**

**Statuts du processus de signature :**

- **draft** : Contrat créé, pas encore envoyé au client
- **pending_signature** : Envoyé au client, en attente signature
- **signed** : Signé par le client
- **active** : Contrat en vigueur (signature + effective_date atteinte)
- **expired** : Contrat expiré (expiry_date dépassée)
- **terminated** : Résilié avant terme
- **renewed** : Renouvelé (ancien contrat)
- **superseded** : Remplacé par nouvelle version

**Workflow signature :**

```
1. Status = "draft"
2. Équipe juridique valide → envoie pour signature
3. Status = "pending_signature"
4. Email DocuSign envoyé au contact_email
5. Client signe électroniquement
6. Webhook DocuSign notifie FleetCore
7. signature_date renseignée
8. Status = "signed"
9. Document PDF signé stocké (document_url)
10. Le jour effective_date : status = "active"
```

### 🏗️ COMPOSANTS À DÉVELOPPER

#### Backend (Service Layer)

**Fichier à créer : `lib/services/crm/contract.service.ts`**

Service gérant toute la logique métier des contrats.

**Méthode createContractFromOpportunity(opportunityId: string) → Promise<Contract>**

Cette méthode est appelée automatiquement quand une opportunity passe à status "won".

Actions :

1. Récupérer opportunity complète avec lead et owner
2. Vérifier que opportunity.status = "won" et won_value renseignée
3. Vérifier qu'aucun contrat n'existe déjà pour cette opportunity
4. Générer contract_reference unique (format CTR-YYYY-NNNNN)
5. Générer contract_code unique (format CYYYY-NNN)
6. Extraire informations depuis opportunity et lead :
   - company_name depuis lead.demo_company_name
   - contact_name depuis lead.first_name + last_name
   - contact_email depuis lead.email
   - contact_phone depuis lead.phone
   - currency selon lead.country_code (AE→AED, FR→EUR, SA→SAR)
7. Calculer dates contractuelles :
   - contract_date = today
   - effective_date = today + 7 jours
   - expiry_date = effective_date + 12 mois (durée standard)
   - renewal_date = expiry_date si auto_renew
8. Déterminer renewal_type et auto_renew selon plan_id
9. Définir notice_period_days = 30 (standard)
10. Calculer total_value depuis opportunity.won_value
11. Déterminer vat_rate selon country_code
12. Créer contrat dans DB avec status = "draft"
13. Mettre à jour opportunity.contract_id avec ID du contrat créé
14. Créer lifecycle event "contract_created"
15. Créer audit log
16. Si total_value >= seuil, déclencher processus approbation
17. Sinon, envoyer directement pour signature
18. Retourner contrat créé

**Méthode generateContractReferences() → {reference: string, code: string}**

Génère les identifiants uniques du contrat en évitant les collisions.

Actions :

1. Obtenir année courante
2. Query DB : trouver dernier contract_reference de l'année
3. Extraire numéro séquence, incrémenter
4. Formater contract_reference avec padding
5. Query DB : trouver dernier contract_code de l'année
6. Extraire séquence, incrémenter
7. Formater contract_code sans padding
8. Retourner objet avec reference et code

**Méthode sendForSignature(contractId: string) → Promise<void>**

Envoie le contrat au client pour signature électronique.

Actions :

1. Récupérer contrat complet
2. Vérifier status = "draft" (approuvé si nécessaire)
3. Générer PDF contrat avec toutes informations
4. Uploader PDF sur S3, obtenir URL signée
5. Créer envelope DocuSign avec :
   - Document : PDF contrat
   - Signataire : contact_email
   - Champs signature requis
   - Webhook callback URL
6. Envoyer envelope DocuSign
7. Mettre à jour contrat :
   - status = "pending_signature"
   - metadata.docusign_envelope_id renseigné
8. Créer audit log
9. Envoyer email notification au contact

**Méthode handleDocuSignWebhook(data: DocuSignWebhook) → Promise<void>**

Traite les webhooks DocuSign (signature terminée, refusée, etc).

Actions :

1. Vérifier signature webhook (HMAC)
2. Extraire envelope_id et status depuis webhook
3. Trouver contrat via metadata.docusign_envelope_id
4. SI status webhook = "completed" (signé) :
   - Télécharger document signé depuis DocuSign
   - Uploader sur S3, obtenir URL
   - Mettre à jour contrat :
     - status = "signed"
     - signature_date = date signature webhook
     - document_url = URL du PDF signé
   - Créer audit log "contract_signed"
   - Notifier équipe Customer Success
   - Déclencher provisioning tenant (étape 3.2)
5. SI status webhook = "declined" (refusé) :
   - status = "rejected"
   - deletion_reason = "signature_declined"
   - Notifier commercial

**Méthode activateContract(contractId: string) → Promise<Contract>**

Active un contrat signé quand effective_date est atteinte.

Actions :

1. Récupérer contrat
2. Vérifier status = "signed"
3. Vérifier effective_date <= today
4. Mettre à jour status = "active"
5. Créer lifecycle event "contract_activated"
6. Initialiser abonnement billing (étape 3.3)
7. Retourner contrat activé

**Méthode scheduleRenewal(contractId: string) → Promise<void>**

Planifie le renouvellement automatique d'un contrat.

Actions :

1. Récupérer contrat
2. Vérifier auto_renew = true et renewal_type = "automatic"
3. Calculer date job = renewal_date
4. Créer job planifié (cron ou queue) :
   - Date exécution : renewal_date
   - Action : renewContract(contractId)
5. Planifier notification préavis :
   - Date : expiry_date - notice_period_days
   - Action : sendRenewalNotice(contractId)

**Méthode renewContract(contractId: string) → Promise<Contract>**

Renouvelle automatiquement un contrat à la renewal_date.

Actions :

1. Récupérer contrat avec status = "active"
2. Vérifier auto_renew = true
3. Créer nouveau contrat :
   - Copier toutes données de l'ancien contrat
   - renewed_from_contract_id = contractId
   - version_number = ancien.version_number + 1
   - effective_date = ancien.expiry_date + 1 jour
   - expiry_date = nouvelle effective_date + durée contrat
   - renewal_date = nouvelle expiry_date si auto_renew
   - status = "draft"
   - Nouveau contract_reference et contract_code
4. Mettre à jour ancien contrat :
   - status = "renewed"
   - expiration_date = nouvelle effective_date - 1 jour
5. Envoyer nouveau contrat pour signature
6. Créer audit logs
7. Notifier client et commercial
8. Retourner nouveau contrat

**Méthode terminateContract(contractId: string, reason: string) → Promise<void>**

Résilie un contrat avant terme.

Actions :

1. Récupérer contrat
2. Vérifier status IN ("active", "signed")
3. Mettre à jour :
   - status = "terminated"
   - deleted_at = today
   - deleted_by = current_user_id
   - deletion_reason = reason
4. Annuler jobs planifiés (renouvellement, notifications)
5. Résilier abonnement billing associé
6. Suspendre tenant si contrat principal
7. Créer audit log
8. Notifier client, commercial, finance

**Méthode createAmendment(contractId: string, changes: ContractAmendment) → Promise<Contract>**

Crée un avenant (nouvelle version) du contrat.

Actions :

1. Récupérer contrat actuel
2. Vérifier status = "active"
3. Créer nouveau contrat :
   - Copier données ancien contrat
   - Appliquer changes (total_value, plan_id, etc.)
   - renewed_from_contract_id = contractId
   - version_number++
   - effective_date = date demandée
   - Nouveau contract_reference
   - status = "draft"
4. Mettre à jour ancien contrat :
   - status = "superseded"
   - expiration_date = effective_date nouveau contrat
5. Envoyer nouveau contrat pour signature
6. Créer audit log
7. Retourner nouveau contrat

**Fichier à créer : `lib/repositories/crm/contract.repository.ts`**

Repository pour accès base de données crm_contracts.

**Méthode findByOpportunityId(opportunityId: string, tenantId: string) → Promise<Contract | null>**

Cherche un contrat par opportunity_id.

**Méthode findActiveContracts(tenantId: string) → Promise<Contract[]>**

Liste tous les contrats actifs d'un tenant.

**Méthode findExpiringContracts(days: number) → Promise<Contract[]>**

Trouve les contrats qui expirent dans X jours (pour notifications préavis).

Query :

- status = "active"
- expiry_date BETWEEN today AND today + days
- ORDER BY expiry_date ASC

**Méthode findContractsByStatus(status: string, tenantId?: string) → Promise<Contract[]>**

Filtre les contrats par statut.

#### API REST (Endpoints)

**Fichier à créer : `app/api/v1/crm/contracts/route.ts`**

**GET /api/v1/crm/contracts**

Liste tous les contrats du tenant avec filtres.

Query params :

- status : filter par status
- opportunity_id : filter par opportunity
- renewal_type : filter par type renouvellement
- expiry_from : date min expiration
- expiry_to : date max expiration
- limit, offset : pagination

Permissions : contracts.read

Réponse 200 :

```
{
  contracts: [
    {
      id: uuid,
      contract_reference: "CTR-2025-00123",
      contract_code: "C2025-123",
      company_name: "ABC Logistics",
      total_value: 22500,
      currency: "AED",
      status: "active",
      effective_date: "2025-11-15",
      expiry_date: "2026-11-14",
      auto_renew: true,
      renewal_date: "2026-11-14"
    }
  ],
  total: 15,
  active_value: 337500
}
```

**POST /api/v1/crm/contracts**

Créer un contrat manuellement (rare, principalement via opportunity win).

Body : ContractCreateInput validé par ContractCreateSchema

Permissions : contracts.create

Réponse 201 : Contract créé

**Fichier à créer : `app/api/v1/crm/contracts/[id]/route.ts`**

**GET /api/v1/crm/contracts/[id]**

Détails complets d'un contrat avec relations (opportunity, lead, tenant, subscription).

Permissions : contracts.read

Réponse 200 : Contract complet

**PATCH /api/v1/crm/contracts/[id]**

Modifier un contrat (limité selon status).

Body : ContractUpdateInput

Permissions : contracts.update

Réponse 200 : Contract mis à jour

**Fichier à créer : `app/api/v1/crm/contracts/[id]/send-signature/route.ts`**

**POST /api/v1/crm/contracts/[id]/send-signature**

Envoyer le contrat au client pour signature DocuSign.

Body : aucun

Permissions : contracts.send_signature

Réponse 200 :

```
{
  envelope_id: "docusign_id",
  signature_url: "https://...",
  sent_at: "2025-11-08T10:00:00Z"
}
```

**Fichier à créer : `app/api/v1/crm/contracts/[id]/activate/route.ts`**

**POST /api/v1/crm/contracts/[id]/activate**

Activer manuellement un contrat signé (normalement automatique à effective_date).

Body : aucun

Permissions : contracts.activate (admin uniquement)

Réponse 200 : Contract activé

**Fichier à créer : `app/api/v1/crm/contracts/[id]/terminate/route.ts`**

**POST /api/v1/crm/contracts/[id]/terminate**

Résilier un contrat avant terme.

Body :

```
{
  reason: "Client request - competitor chosen",
  effective_date: "2025-12-01"
}
```

Permissions : contracts.terminate

Réponse 200 : Contract terminé

**Fichier à créer : `app/api/v1/crm/contracts/[id]/renew/route.ts`**

**POST /api/v1/crm/contracts/[id]/renew**

Renouveler manuellement un contrat (normalement automatique si auto_renew).

Body :

```
{
  new_total_value: 25000,
  new_plan_id: "uuid",
  new_duration_months: 12,
  notes: "Renewal negotiated with 10% discount"
}
```

Permissions : contracts.renew

Réponse 201 : Nouveau contract créé

**Fichier à créer : `app/api/v1/crm/contracts/[id]/amendment/route.ts`**

**POST /api/v1/crm/contracts/[id]/amendment**

Créer un avenant au contrat (nouvelle version).

Body :

```
{
  changes: {
    total_value: 27000,
    plan_id: "uuid-premium"
  },
  effective_date: "2025-12-01",
  reason: "Client upgraded to Premium plan"
}
```

Permissions : contracts.amend

Réponse 201 : Nouveau contract (version++) créé

**Fichier à créer : `app/api/webhooks/docusign/route.ts`**

**POST /api/webhooks/docusign**

Webhook DocuSign pour notifications signature.

Body : DocuSign webhook payload

Authentification : Vérification signature HMAC DocuSign

Réponse 200 : OK

#### Frontend (Interface Utilisateur)

**Modification fichier : `app/[locale]/crm/opportunities/[id]/page.tsx`**

Sur la page détail opportunity, après clic "Win Opportunity", ajouter section "Contract" qui s'affiche automatiquement.

Section Contract :

```
┌────────────────────────────────────────────────┐
│ 📄 CONTRACT INFORMATION                        │
├────────────────────────────────────────────────┤
│ Status: [Draft] 🟡                             │
│ Reference: CTR-2025-00123                      │
│ Value: €22,500                                 │
│ Duration: 12 months                            │
│ Effective: Nov 15, 2025                        │
│ Expiry: Nov 14, 2026                           │
│                                                │
│ [📤 Send for Signature] [👁️ View Details]     │
└────────────────────────────────────────────────┘
```

**Fichier à créer : `app/[locale]/crm/contracts/page.tsx`**

Page liste de tous les contrats avec filtres et stats.

Layout :

```
┌──────────────────────────────────────────────────┐
│ HEADER                                           │
│ [Logo] CRM > Contracts          [+ New Contract] │
└──────────────────────────────────────────────────┘
┌──────────────────────────────────────────────────┐
│ STATS                                            │
│ Active: 45 contracts | €1.2M ARR                │
│ Expiring 30d: 8 | Renewals: 95%                 │
└──────────────────────────────────────────────────┘
┌──────────────────────────────────────────────────┐
│ FILTERS                                          │
│ [Status ▼] [Renewal Type ▼] [Search...]         │
└──────────────────────────────────────────────────┘
┌──────────────────────────────────────────────────┐
│ CONTRACTS TABLE                                  │
│ ┌──────────────────────────────────────────────┐│
│ │Ref       │Company   │Value│Status  │Expiry  ││
│ ├──────────────────────────────────────────────┤│
│ │CTR-123   │ABC Log   │€22.5k│Active🟢│Nov'26 ││
│ │CTR-124   │XYZ Trans │€18k  │Draft🟡 │Dec'26 ││
│ └──────────────────────────────────────────────┘│
└──────────────────────────────────────────────────┘
```

Fonctionnalités :

- Table DataTable avec tri, filtres, pagination
- Badge status coloré (Draft🟡, Active🟢, Expired🔴, Terminated⚫)
- Filtre par status, renewal_type, date range
- Actions par ligne : View, Send Signature, Terminate, Renew
- Stats temps réel (nb actifs, valeur totale, taux renouvellement)

**Fichier à créer : `app/[locale]/crm/contracts/[id]/page.tsx`**

Page détail d'un contrat avec toutes informations et actions.

Layout :

```
┌────────────────────────────────────────────────────┐
│ HEADER                                             │
│ [← Back] Contract CTR-2025-00123      [Actions ▼] │
└────────────────────────────────────────────────────┘
┌────────────────────────────────────────────────────┐
│ STATUS SECTION                                     │
│ Status: Active 🟢                                  │
│ Created: Nov 8, 2025 | Signed: Nov 10, 2025       │
│ Version: 1                                         │
└────────────────────────────────────────────────────┘
┌────────────────────────────────────────────────────┐
│ CONTRACT DETAILS                                   │
│ Reference: CTR-2025-00123                          │
│ Code: C2025-123                                    │
│ Company: ABC Logistics                             │
│ Contact: Ahmed Al-Mansoori                         │
│ Email: ahmed@abclogistics.ae                       │
│ Phone: +971 50 123 4567                            │
│                                                    │
│ Total Value: €22,500                              │
│ Currency: AED                                      │
│ VAT Rate: 5%                                       │
│                                                    │
│ Effective Date: Nov 15, 2025                      │
│ Expiry Date: Nov 14, 2026                         │
│ Duration: 12 months                                │
│                                                    │
│ Renewal Type: Automatic 🔄                        │
│ Auto Renew: Yes                                    │
│ Renewal Date: Nov 14, 2026                        │
│ Notice Period: 30 days                             │
└────────────────────────────────────────────────────┘
┌────────────────────────────────────────────────────┐
│ LINKED RECORDS                                     │
│ Opportunity: ABC Logistics (€22.5k won)           │
│ Lead: Ahmed Al-Mansoori (SQL)                     │
│ Tenant: ABC Logistics (Active)                    │
│ Subscription: Premium Plan (€1,875/month)        │
└────────────────────────────────────────────────────┘
┌────────────────────────────────────────────────────┐
│ DOCUMENT                                           │
│ 📄 Contract_CTR-2025-00123_Signed.pdf             │
│ [📥 Download] [👁️ Preview]                        │
│ Signed: Nov 10, 2025 by Ahmed Al-Mansoori         │
└────────────────────────────────────────────────────┘
┌────────────────────────────────────────────────────┐
│ VERSION HISTORY                                    │
│ v1 - Nov 8, 2025 - Initial contract              │
└────────────────────────────────────────────────────┘
┌────────────────────────────────────────────────────┐
│ ACTIONS                                            │
│ [📤 Send Signature] [🔄 Renew] [📝 Amendment]     │
│ [❌ Terminate] [📊 View Analytics]                │
└────────────────────────────────────────────────────┘
```

Fonctionnalités :

- Affichage complet de toutes données contrat
- Badge status avec couleur dynamique
- Timeline version history
- PDF preview intégré
- Boutons actions contextuels selon status
- Liens vers records liés (opportunity, lead, tenant)

**Composant à créer : `components/crm/ContractCard.tsx`**

Composant carte contrat réutilisable.

Props :

- contract : objet Contract complet
- onClick : callback clic

Affichage :

- Contract reference
- Company name
- Total value avec currency
- Badge status coloré
- Dates effective et expiry
- Badge renewal type (Auto/Manual/Non-renewable)
- Boutons actions rapides

**Composant à créer : `components/crm/ContractStatusBadge.tsx`**

Badge status contrat avec couleur.

Props :

- status : string

Couleurs :

- Draft : 🟡 Jaune
- Pending Signature : 🔵 Bleu
- Signed : 🟣 Violet
- Active : 🟢 Vert
- Expired : 🔴 Rouge
- Terminated : ⚫ Noir
- Renewed : 🟠 Orange
- Superseded : ⚪ Gris

### 🎬 RÉSULTAT DÉMONTRABLE

**Scénario démo complet Sprint 3.1 :**

**1. Win Opportunity → Contract Auto-créé**

- Aller sur /crm/opportunities/[id] (opportunité ABC Logistics en stage Closing)
- Cliquer bouton "Win Opportunity"
- Modal s'ouvre, remplir won_value : 22,500€, won_date : today
- Cliquer "Confirm Win"
- Modal se ferme, toast "Opportunity won! Contract created."
- Voir section "Contract" apparaître sur la page avec :
  - Status : Draft 🟡
  - Reference : CTR-2025-00123
  - Value : €22,500
  - Bouton "Send for Signature"

**2. Envoyer contrat pour signature**

- Cliquer "Send for Signature"
- Modal confirmation : "Send contract CTR-2025-00123 to ahmed@abclogistics.ae ?"
- Confirmer
- Loader pendant génération PDF et envoi DocuSign
- Toast "Contract sent for signature"
- Status passe à "Pending Signature" 🔵
- Email envoyé à Ahmed avec lien DocuSign

**3. Simulation signature client**

- Simuler webhook DocuSign (via Postman ou script)
- POST /api/webhooks/docusign avec payload "completed"
- Système traite webhook automatiquement
- Status contrat passe à "Signed" 🟣
- signature_date renseignée
- Document PDF signé stocké et document_url mis à jour

**4. Activation automatique à effective_date**

- Simuler passage du temps (modifier effective_date ou attendre J+7)
- Job cron daily vérifie contrats signed avec effective_date = today
- Appelle contractService.activateContract()
- Status passe à "Active" 🟢
- Tenant provisionné automatiquement (voir étape 3.2)

**5. Liste contrats accessible**

- Naviguer vers /crm/contracts
- Voir table avec contrat ABC Logistics
- Stats affichées : 1 Active, €22.5k ARR
- Filtrer par status "Active" → voir uniquement contrats actifs
- Cliquer sur ligne contrat → redirige vers page détail

**6. Page détail contrat complète**

- Sur /crm/contracts/[id]
- Voir toutes informations : dates, valeur, contact, renouvellement
- Voir lien vers opportunity d'origine
- Voir badge "Auto Renew" actif
- Voir "Renewal scheduled for Nov 14, 2026"
- PDF téléchargeable visible

**Critères d'acceptation :**

- ✅ Contrat créé automatiquement après opportunity win
- ✅ contract_reference et contract_code uniques générés
- ✅ Dates calculées automatiquement (effective, expiry, renewal)
- ✅ Email signature envoyé au client via DocuSign
- ✅ Webhook DocuSign traité correctement
- ✅ Status contrat mis à jour selon workflow (draft→pending→signed→active)
- ✅ PDF contrat généré et stocké
- ✅ Page liste contrats fonctionnelle avec filtres
- ✅ Page détail contrat affiche toutes infos
- ✅ Audit logs créés pour chaque action

### ⏱️ ESTIMATION

- Backend : 5 heures
  - ContractService complet : 3h
  - ContractRepository : 1h
  - Webhook DocuSign : 1h
- API : 2 heures
  - Routes CRUD contracts : 1h
  - Routes actions (send, activate, terminate, renew) : 1h
- Frontend : 4 heures
  - Page liste contracts : 1.5h
  - Page détail contract : 1.5h
  - Composants (ContractCard, StatusBadge) : 1h
- **TOTAL : 11 heures (1 jour + 3h)**

### 🔗 DÉPENDANCES

**Prérequis :**

- Sprint 2 terminé (Opportunity Pipeline avec win/lose)
- Table crm_contracts existante
- DocuSign compte et API credentials
- S3 bucket pour stockage PDF

**Services requis :**

- OpportunityService (pour récupérer données opportunity)
- LeadService (pour récupérer données lead)
- AuditService (pour logs)
- NotificationService (pour emails)

**Intégrations externes :**

- DocuSign API (signature électronique)
- AWS S3 (stockage documents)
- PDF generation library (puppeteer ou similar)

### ✅ CHECKLIST DE VALIDATION

- [ ] **Backend** : ContractService compile, toutes méthodes implémentées
- [ ] **Backend** : createContractFromOpportunity() crée contrat avec références uniques
- [ ] **Backend** : Dates contractuelles calculées correctement
- [ ] **Backend** : sendForSignature() génère PDF et envoie DocuSign
- [ ] **Backend** : handleDocuSignWebhook() traite signature correctement
- [ ] **Backend** : activateContract() change status à active
- [ ] **Backend** : scheduleRenewal() planifie renouvellement auto
- [ ] **API** : GET /contracts retourne liste avec filtres
- [ ] **API** : POST /contracts/[id]/send-signature envoie email
- [ ] **API** : POST /webhooks/docusign traite webhook
- [ ] **API** : POST /contracts/[id]/terminate résilie contrat
- [ ] **Frontend** : Page /contracts affiche table avec filtres
- [ ] **Frontend** : Page /contracts/[id] affiche détails complets
- [ ] **Frontend** : Bouton "Send for Signature" fonctionne
- [ ] **Frontend** : Badge status coloré selon valeur
- [ ] **Tests** : 20+ tests unitaires ContractService
- [ ] **Tests** : Test E2E win opportunity → contract créé
- [ ] **Tests** : Test webhook DocuSign → status updated
- [ ] **Démo** : Win opportunity crée contrat automatiquement
- [ ] **Démo** : Envoyer signature fonctionne
- [ ] **Démo** : Webhook signature met à jour status

---

# SPRINT 3.2 : PROVISIONING TENANT AUTOMATIQUE

**Durée :** 1 jour (8 heures)  
**Objectif :** Provisionner automatiquement un tenant (organisation cliente) après signature du contrat.

---

## ÉTAPE 3.2.1 : Service TenantService et Provisioning Automatique

### 🎯 RATIONNEL MÉTIER

**POURQUOI :** Un tenant est l'organisation cliente qui utilisera FleetCore. C'est l'isolation logique qui garantit que les données d'ABC Logistics ne sont jamais visibles par XYZ Transport. Le provisioning doit être automatique pour éviter les délais et erreurs manuelles.

**QUEL PROBLÈME :** Actuellement, même après signature du contrat, le client ne peut pas accéder à FleetCore. L'équipe technique doit manuellement créer le tenant, configurer les permissions, créer le premier utilisateur. Délai moyen : 2 jours. Risque d'oubli ou erreur de configuration.

**IMPACT SI ABSENT :**

- **Expérience client :** Client signe, attend 2 jours sans accès = frustration majeure
- **Opérationnel :** Équipe tech débordée par provisioning manuel = scalabilité impossible
- **Churn :** 15% des clients annulent dans les 48h si pas d'accès immédiat
- **Coûts :** 2h technique par tenant × 50 tenants/mois = 100h perdues

**CAS D'USAGE CONCRET :**
Le contrat ABC Logistics est signé (status = "signed"). À la effective_date (15 nov 2025), le système doit automatiquement :

1. Créer un tenant dans adm_tenants :
   - name : "ABC Logistics"
   - slug : "abc-logistics" (généré depuis name)
   - clerk_organization_id : créé via Clerk API
   - country_code : "AE" (depuis lead)
   - default_currency : "AED"
   - timezone : "Asia/Dubai"
   - status : "trialing" (puis "active" après paiement)
   - trial_ends_at : effective_date + 14 jours (trial gratuit)
   - max_members : selon plan (Starter=5, Standard=20, Premium=100)
   - max_vehicles : selon plan (Starter=50, Standard=200, Premium=unlimited)

2. Créer organisation Clerk via API :
   - name : "ABC Logistics"
   - slug : "abc-logistics"
   - metadata : {fleetcore_tenant_id, plan_id, contract_id}

3. Créer tenant settings par défaut :
   - Langue : anglais
   - Devise : AED
   - Format date : DD/MM/YYYY
   - Fuseau horaire : Asia/Dubai
   - Logo : placeholder

4. Créer lifecycle event "tenant_created"

5. Créer rôles par défaut pour le tenant :
   - Admin (permissions complètes)
   - Manager (gestion flotte)
   - Operator (opérations quotidiennes)
   - Driver (accès mobile limité)

6. Préparer invitation pour premier admin (Ahmed)

### 📊 DONNÉES ET RÈGLES MÉTIER

**Règles de génération du slug :**

```
Slug = name en kebab-case unique

Algorithme :
1. Prendre name : "ABC Logistics"
2. Lowercase : "abc logistics"
3. Remplacer espaces par "-" : "abc-logistics"
4. Supprimer caractères spéciaux : "abc-logistics"
5. Vérifier unicité dans DB
6. SI déjà existant, ajouter suffixe "-2" : "abc-logistics-2"
7. Incrémenter jusqu'à trouver slug disponible
```

**Règles de mapping pays → paramètres régionaux :**

```
SI country_code = "AE" (UAE)
ALORS
  - default_currency = "AED"
  - timezone = "Asia/Dubai"
  - vat_rate = 0.05 (5%)
  - language = "en"
  - date_format = "DD/MM/YYYY"

SI country_code = "FR" (France)
ALORS
  - default_currency = "EUR"
  - timezone = "Europe/Paris"
  - vat_rate = 0.20 (20%)
  - language = "fr"
  - date_format = "DD/MM/YYYY"

SI country_code = "SA" (Saudi Arabia)
ALORS
  - default_currency = "SAR"
  - timezone = "Asia/Riyadh"
  - vat_rate = 0.15 (15%)
  - language = "ar"
  - date_format = "DD/MM/YYYY"
  - calendar_type = "hijri" (optionnel)
```

**Règles de quotas selon plan :**

```
SI plan_id.name = "Starter"
ALORS
  - max_members = 5
  - max_vehicles = 50
  - max_drivers = 100
  - max_storage_gb = 10
  - features = ["basic_fleet", "basic_reports"]

SI plan_id.name = "Standard"
ALORS
  - max_members = 20
  - max_vehicles = 200
  - max_drivers = 500
  - max_storage_gb = 50
  - features = ["advanced_fleet", "advanced_reports", "api_access"]

SI plan_id.name = "Premium"
ALORS
  - max_members = 100
  - max_vehicles = NULL (illimité)
  - max_drivers = NULL (illimité)
  - max_storage_gb = 500
  - features = ["all", "white_label", "dedicated_support", "custom_integrations"]
```

**Règles de trial (période d'essai) :**

```
SI contract.billing_cycle = "monthly" ET first_contract
ALORS
  - trial_ends_at = effective_date + 14 jours
  - status = "trialing"
SINON
  - trial_ends_at = NULL
  - status = "active" (directement actif car payant)
FIN SI

À trial_ends_at :
  SI payment_method renseigné ET first_invoice payée
  ALORS status = "active"
  SINON status = "suspended"
  FIN SI
```

**Règles de création rôles par défaut :**

```
Pour chaque nouveau tenant, créer 4 rôles dans adm_roles :

1. Role "Admin" (is_system = true)
   Permissions :
   - vehicles : {create, read, update, delete}
   - drivers : {create, read, update, delete}
   - trips : {create, read, update, delete}
   - members : {create, read, update, delete}
   - settings : {read, update}
   - billing : {read}
   - reports : {read, export}

2. Role "Manager" (is_system = true)
   Permissions :
   - vehicles : {create, read, update}
   - drivers : {create, read, update}
   - trips : {read, update}
   - members : {read}
   - reports : {read}

3. Role "Operator" (is_system = true)
   Permissions :
   - vehicles : {read}
   - drivers : {read}
   - trips : {create, read, update}
   - reports : {read}

4. Role "Driver" (is_system = true)
   Permissions :
   - trips : {read} (seulement ses propres trajets)
   - profile : {read, update}
```

**Règles de synchronisation Clerk :**

```
Créer organization Clerk avec :
- name : tenant.name
- slug : tenant.slug
- public_metadata : {
    fleetcore_tenant_id : tenant.id,
    plan_id : contract.plan_id,
    contract_id : contract.id,
    country_code : tenant.country_code
  }

Webhook Clerk organization.created reçu automatiquement →
  Mise à jour tenant.clerk_organization_id

Cohérence :
- 1 organization Clerk = 1 tenant FleetCore
- clerk_organization_id doit être unique
- Toute modification Clerk (name, slug) synchronisée vers FleetCore
```

### 🏗️ COMPOSANTS À DÉVELOPPER

#### Backend (Service Layer)

**Fichier à créer : `lib/services/admin/tenant.service.ts`**

Service gérant le cycle de vie complet des tenants.

**Méthode provisionTenantFromContract(contractId: string) → Promise<Tenant>**

Provisionne automatiquement un tenant après activation du contrat.

Actions :

1. Récupérer contrat avec opportunity et lead
2. Vérifier status = "active" (effectif à effective_date)
3. Vérifier qu'aucun tenant n'existe déjà pour ce contrat
4. Générer slug unique depuis company_name
5. Créer organization Clerk via API :
   - name : contract.company_name
   - slug : slug généré
   - public_metadata : {tenant_id, plan_id, contract_id}
6. Attendre réponse Clerk, obtenir clerk_organization_id
7. Déterminer paramètres régionaux selon country_code
8. Récupérer plan_id depuis contract, déterminer quotas
9. Créer tenant dans DB :
   - name : contract.company_name
   - slug : slug unique
   - clerk_organization_id : depuis Clerk
   - country_code : depuis lead
   - default_currency, timezone : selon country_code
   - status : "trialing" ou "active" selon règles
   - trial_ends_at : si applicable
   - subscription_tier : depuis plan_id
   - max_members, max_vehicles : depuis plan
   - primary_contact_email : contract.contact_email
   - billing_email : contract.contact_email (par défaut)
10. Mettre à jour contract.tenant_id
11. Créer tenant settings par défaut (adm_tenant_settings)
12. Créer 4 rôles par défaut (adm_roles)
13. Créer vehicle classes par défaut (adm_tenant_vehicle_classes)
14. Créer lifecycle event "tenant_created"
15. Créer audit log
16. Déclencher provisioning abonnement billing (étape 3.3)
17. Déclencher invitation premier admin (étape 3.3)
18. Retourner tenant créé

**Méthode generateUniqueSlug(name: string) → Promise<string>**

Génère un slug unique en kebab-case depuis le nom.

Actions :

1. Normaliser name : lowercase, remplacer espaces par "-"
2. Supprimer accents et caractères spéciaux
3. Tronquer à 50 caractères max
4. Vérifier unicité dans DB (adm_tenants.slug)
5. SI déjà existant, ajouter suffixe "-2", "-3", etc.
6. Retourner slug unique

**Méthode createDefaultRoles(tenantId: string) → Promise<Role[]>**

Crée les 4 rôles système par défaut pour le tenant.

Actions :

1. Définir permissions pour chaque rôle (Admin, Manager, Operator, Driver)
2. Pour chaque rôle :
   - name : nom du rôle
   - description : description française
   - is_system : true (rôles non modifiables)
   - permissions : JSONB avec structure permissions
   - tenant_id : tenant concerné
3. Créer les 4 rôles en DB
4. Créer audit logs
5. Retourner array des rôles créés

**Méthode createDefaultSettings(tenantId: string) → Promise<TenantSettings>**

Crée les paramètres par défaut du tenant.

Actions :

1. Récupérer tenant pour country_code
2. Déterminer settings selon pays
3. Créer dans adm_tenant_settings :
   - Langue UI, devise, timezone
   - Format date/heure
   - Logo placeholder
   - Thème couleurs par défaut
   - Intégrations désactivées
4. Retourner settings créés

**Méthode createDefaultVehicleClasses(tenantId: string) → Promise<VehicleClass[]>**

Crée les classes de véhicules par défaut.

Actions :

1. Définir classes standard : Sedan, SUV, Van, Truck
2. Pour chaque classe, créer dans adm_tenant_vehicle_classes
3. Retourner array des classes créées

**Méthode activateTenant(tenantId: string) → Promise<Tenant>**

Active un tenant après fin de trial et premier paiement.

Actions :

1. Récupérer tenant
2. Vérifier status = "trialing"
3. Vérifier payment_method_id renseigné
4. Vérifier première facture payée
5. Mettre à jour status = "active"
6. Créer lifecycle event "tenant_activated"
7. Envoyer email confirmation au client
8. Retourner tenant activé

**Méthode suspendTenant(tenantId: string, reason: string) → Promise<Tenant>**

Suspend un tenant (impayé, violation CGU, etc).

Actions :

1. Récupérer tenant
2. Vérifier status = "active"
3. Mettre à jour status = "suspended"
4. Enregistrer suspension_reason
5. Créer lifecycle event "tenant_suspended"
6. Bloquer accès de tous les membres
7. Envoyer email notification client + commercial
8. Retourner tenant suspendu

**Méthode terminateTenant(tenantId: string, reason: string) → Promise<void>**

Termine un tenant (résiliation contrat).

Actions :

1. Récupérer tenant
2. Mettre à jour status = "cancelled"
3. deleted_at = today
4. deletion_reason = reason
5. Révoquer tous les accès membres
6. Annuler abonnement billing
7. Planifier archivage données après 90 jours
8. Créer lifecycle event "tenant_terminated"
9. Envoyer email confirmation client

**Fichier à créer : `lib/repositories/admin/tenant.repository.ts`**

Repository pour accès base adm_tenants.

**Méthode findBySlug(slug: string) → Promise<Tenant | null>**

Cherche un tenant par slug (pour vérification unicité).

**Méthode findByClerkOrganizationId(clerkOrgId: string) → Promise<Tenant | null>**

Cherche un tenant par clerk_organization_id (pour sync webhooks).

**Méthode findByContractId(contractId: string) → Promise<Tenant | null>**

Cherche le tenant lié à un contrat.

**Méthode findActive() → Promise<Tenant[]>**

Liste tous les tenants actifs (pour stats).

#### API REST (Endpoints)

**Fichier à créer : `app/api/v1/admin/tenants/route.ts`**

**GET /api/v1/admin/tenants**

Liste tous les tenants (admin FleetCore uniquement).

Query params :

- status : filter par status
- country_code : filter par pays
- plan_id : filter par plan
- limit, offset : pagination

Permissions : admin.tenants.read (super admin FleetCore)

Réponse 200 :

```
{
  tenants: [
    {
      id: uuid,
      name: "ABC Logistics",
      slug: "abc-logistics",
      status: "active",
      country_code: "AE",
      subscription_tier: "standard",
      max_vehicles: 200,
      created_at: "2025-11-15T00:00:00Z"
    }
  ],
  total: 45,
  active_count: 38,
  trialing_count: 5,
  suspended_count: 2
}
```

**POST /api/v1/admin/tenants**

Créer un tenant manuellement (rare, normalement via contract).

Body : TenantCreateInput

Permissions : admin.tenants.create

Réponse 201 : Tenant créé

**Fichier à créer : `app/api/v1/admin/tenants/[id]/route.ts`**

**GET /api/v1/admin/tenants/[id]**

Détails complets d'un tenant.

Permissions : admin.tenants.read OU membre du tenant

Réponse 200 : Tenant avec relations (contract, members, settings)

**PATCH /api/v1/admin/tenants/[id]**

Modifier un tenant (nom, quotas, settings).

Body : TenantUpdateInput

Permissions : admin.tenants.update OU tenant.admin

Réponse 200 : Tenant mis à jour

**Fichier à créer : `app/api/v1/admin/tenants/[id]/activate/route.ts`**

**POST /api/v1/admin/tenants/[id]/activate**

Activer un tenant après trial.

Body : aucun

Permissions : admin.tenants.activate

Réponse 200 : Tenant activé

**Fichier à créer : `app/api/v1/admin/tenants/[id]/suspend/route.ts`**

**POST /api/v1/admin/tenants/[id]/suspend**

Suspendre un tenant.

Body :

```
{
  reason: "Payment failed - 3 attempts",
  notify_client: true
}
```

Permissions : admin.tenants.suspend

Réponse 200 : Tenant suspendu

**Fichier à créer : `app/api/v1/admin/tenants/[id]/terminate/route.ts`**

**POST /api/v1/admin/tenants/[id]/terminate**

Terminer un tenant (résiliation définitive).

Body :

```
{
  reason: "Contract terminated - client request",
  effective_date: "2025-12-01",
  archive_data: true
}
```

Permissions : admin.tenants.terminate

Réponse 200 : Tenant terminé

**Fichier à créer : `app/api/v1/admin/tenants/[id]/usage/route.ts`**

**GET /api/v1/admin/tenants/[id]/usage**

Statistiques d'utilisation du tenant (quotas).

Permissions : admin.tenants.read OU tenant.admin

Réponse 200 :

```
{
  members: {
    current: 12,
    max: 20,
    percentage: 60
  },
  vehicles: {
    current: 75,
    max: 200,
    percentage: 37.5
  },
  drivers: {
    current: 150,
    max: 500,
    percentage: 30
  },
  storage: {
    current_gb: 15.3,
    max_gb: 50,
    percentage: 30.6
  }
}
```

#### Frontend (Interface Utilisateur)

**Fichier à créer : `app/[locale]/admin/tenants/page.tsx`**

Page liste de tous les tenants (admin FleetCore uniquement).

Layout :

```
┌──────────────────────────────────────────────────┐
│ HEADER                                           │
│ [Logo] Admin > Tenants         [+ Create Tenant] │
└──────────────────────────────────────────────────┘
┌──────────────────────────────────────────────────┐
│ STATS                                            │
│ Total: 45 | Active: 38 🟢 | Trial: 5 🟡         │
│ Suspended: 2 🔴 | MRR: €67,500                   │
└──────────────────────────────────────────────────┘
┌──────────────────────────────────────────────────┐
│ FILTERS                                          │
│ [Status ▼] [Country ▼] [Plan ▼] [Search...]     │
└──────────────────────────────────────────────────┘
┌──────────────────────────────────────────────────┐
│ TENANTS TABLE                                    │
│ ┌────────────────────────────────────────────┐  │
│ │Name       │Status │Country│Plan│Created   │  │
│ ├────────────────────────────────────────────┤  │
│ │ABC Log    │Active🟢│UAE🇦🇪│Std │Nov'25   │  │
│ │XYZ Trans  │Trial🟡│FR🇫🇷│Prem│Nov'25   │  │
│ └────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────┘
```

Fonctionnalités :

- Table DataTable avec tri et filtres
- Badge status coloré
- Flag pays
- Actions : View, Suspend, Activate, Terminate
- Stats temps réel

**Fichier à créer : `app/[locale]/admin/tenants/[id]/page.tsx`**

Page détail tenant (admin FleetCore ou membres tenant).

Layout :

```
┌────────────────────────────────────────────────┐
│ HEADER                                         │
│ [← Back] ABC Logistics         [Actions ▼]    │
└────────────────────────────────────────────────┘
┌────────────────────────────────────────────────┐
│ STATUS                                         │
│ Status: Active 🟢 | Trial Ended: Nov 29, 2025 │
└────────────────────────────────────────────────┘
┌────────────────────────────────────────────────┐
│ DETAILS                                        │
│ Name: ABC Logistics                            │
│ Slug: abc-logistics                            │
│ Country: UAE 🇦🇪                                │
│ Currency: AED                                  │
│ Timezone: Asia/Dubai                           │
│ Plan: Standard                                 │
│ Created: Nov 15, 2025                          │
└────────────────────────────────────────────────┘
┌────────────────────────────────────────────────┐
│ USAGE & QUOTAS                                 │
│ Members: 12/20 (60%) ████████░░                │
│ Vehicles: 75/200 (37.5%) ████░░░░░░░░          │
│ Drivers: 150/500 (30%) ███░░░░░░░░░░           │
│ Storage: 15.3 GB / 50 GB ███░░░░░░░░           │
└────────────────────────────────────────────────┘
┌────────────────────────────────────────────────┐
│ CONTRACT                                       │
│ Reference: CTR-2025-00123                      │
│ Value: €22,500/year                            │
│ Expiry: Nov 14, 2026                           │
│ [View Contract]                                │
└────────────────────────────────────────────────┘
┌────────────────────────────────────────────────┐
│ MEMBERS (12)                                   │
│ Ahmed Al-Mansoori (Admin) - Last login: 2h ago│
│ [View All Members]                             │
└────────────────────────────────────────────────┘
┌────────────────────────────────────────────────┐
│ LIFECYCLE EVENTS                               │
│ Nov 15, 2025 - Tenant Created                  │
│ Nov 15, 2025 - Trial Started                   │
│ Nov 29, 2025 - Trial Ended → Active           │
│ [View Full History]                            │
└────────────────────────────────────────────────┘
┌────────────────────────────────────────────────┐
│ ACTIONS                                        │
│ [✏️ Edit Settings] [⏸️ Suspend] [❌ Terminate] │
└────────────────────────────────────────────────┘
```

Fonctionnalités :

- Affichage complet données tenant
- Barres progression quotas visuelles
- Timeline lifecycle events
- Lien vers contract et members
- Actions admin contextuelles

**Composant à créer : `components/admin/TenantCard.tsx`**

Carte tenant réutilisable.

Props :

- tenant : objet Tenant
- onClick : callback

Affichage :

- Nom tenant
- Badge status coloré
- Flag pays
- Badge plan
- Nombre membres/véhicules
- Date création

**Composant à créer : `components/admin/UsageMetrics.tsx`**

Composant affichant les quotas d'utilisation avec barres de progression.

Props :

- usage : objet avec current/max pour chaque métrique

Affichage :

- Barres horizontales colorées selon pourcentage
- Vert <70%, Orange 70-90%, Rouge >90%
- Chiffres current/max affichés

### 🎬 RÉSULTAT DÉMONTRABLE

**Scénario démo complet Sprint 3.2 :**

**1. Contrat activé → Tenant provisionné automatiquement**

- Sur page /crm/contracts/[id], voir status "Active" 🟢
- Voir section "Tenant Information" apparaître :
  - Name : ABC Logistics
  - Status : Trialing 🟡
  - Trial Ends : Nov 29, 2025
  - Slug : abc-logistics
  - Lien "View Tenant Details"
- Vérifier dans DB : tenant créé avec clerk_organization_id

**2. Organisation Clerk synchronisée**

- Aller sur Clerk Dashboard
- Voir organization "ABC Logistics" créée
- Metadata contient fleetcore_tenant_id, plan_id, contract_id
- Slug "abc-logistics" disponible

**3. Paramètres régionaux configurés**

- Sur page /admin/tenants/[id]
- Voir Country : UAE 🇦🇪
- Voir Currency : AED
- Voir Timezone : Asia/Dubai
- Voir Language : English

**4. Rôles par défaut créés**

- Onglet "Roles" sur page tenant
- Voir 4 rôles : Admin, Manager, Operator, Driver
- Cliquer sur "Admin" → voir permissions complètes
- Cliquer sur "Operator" → voir permissions limitées

**5. Quotas configurés selon plan**

- Section "Usage & Quotas"
- Voir max_members : 20 (plan Standard)
- Voir max_vehicles : 200
- Voir max_drivers : 500
- Voir current à 0 (tenant neuf)

**6. Lifecycle events trackés**

- Timeline events :
  - "Tenant Created" - Nov 15, 2025
  - "Trial Started" - Nov 15, 2025
  - "Default Roles Created" - Nov 15, 2025
  - "Default Settings Created" - Nov 15, 2025

**7. Liste tenants admin accessible**

- Naviguer /admin/tenants (super admin FleetCore)
- Voir table avec ABC Logistics
- Stats : Total : 1, Active : 0, Trial : 1
- Filtrer par country UAE → voir ABC Logistics
- Filtrer par status Trialing → voir ABC Logistics

**Critères d'acceptation :**

- ✅ Tenant créé automatiquement après contract activation
- ✅ Slug unique généré depuis company name
- ✅ Organization Clerk créée et synchronisée
- ✅ clerk_organization_id renseigné dans tenant
- ✅ Paramètres régionaux configurés selon country_code
- ✅ 4 rôles par défaut créés avec permissions
- ✅ Quotas configurés selon plan
- ✅ Trial configuré avec trial_ends_at
- ✅ Tenant settings créés avec valeurs par défaut
- ✅ Vehicle classes par défaut créées
- ✅ Lifecycle events enregistrés
- ✅ Page liste tenants fonctionnelle (admin)
- ✅ Page détail tenant affiche toutes infos
- ✅ Barres progression quotas visuelles

### ⏱️ ESTIMATION

- Backend : 5 heures
  - TenantService complet : 3h
  - TenantRepository : 1h
  - Intégration Clerk API : 1h
- API : 2 heures
  - Routes CRUD tenants : 1h
  - Routes actions (activate, suspend, terminate) : 1h
- Frontend : 3 heures
  - Page liste tenants : 1h
  - Page détail tenant : 1.5h
  - Composants (TenantCard, UsageMetrics) : 0.5h
- **TOTAL : 10 heures (1 jour + 2h)**

### 🔗 DÉPENDANCES

**Prérequis :**

- Sprint 3.1 terminé (Contracts)
- Clerk API credentials
- Tables adm\_\* existantes

**Services requis :**

- ContractService (pour récupérer contract data)
- LeadService (pour récupérer lead data)
- ClerkSyncService (pour sync organization)

**Intégrations externes :**

- Clerk API (création organizations)

### ✅ CHECKLIST DE VALIDATION

- [ ] **Backend** : TenantService compile
- [ ] **Backend** : provisionTenantFromContract() crée tenant complet
- [ ] **Backend** : generateUniqueSlug() évite collisions
- [ ] **Backend** : createDefaultRoles() crée 4 rôles
- [ ] **Backend** : createDefaultSettings() configure paramètres
- [ ] **Backend** : Clerk organization créée via API
- [ ] **Backend** : clerk_organization_id synchronisé
- [ ] **API** : GET /admin/tenants retourne liste
- [ ] **API** : GET /admin/tenants/[id] retourne détails
- [ ] **API** : POST /admin/tenants/[id]/suspend fonctionne
- [ ] **Frontend** : Page /admin/tenants affiche table
- [ ] **Frontend** : Page /admin/tenants/[id] affiche détails
- [ ] **Frontend** : Barres quotas visuelles correctes
- [ ] **Frontend** : Timeline lifecycle events affichée
- [ ] **Tests** : 15+ tests TenantService
- [ ] **Tests** : Test contract activated → tenant provisioned
- [ ] **Tests** : Test Clerk organization created
- [ ] **Démo** : Contract activé crée tenant automatiquement
- [ ] **Démo** : Tenant visible dans liste admin
- [ ] **Démo** : Rôles par défaut créés

---

# SPRINT 3.3 : INVITATION PREMIER ADMIN & ONBOARDING

**Durée :** 0.5 jour (4 heures)  
**Objectif :** Inviter le contact principal à devenir le premier admin du tenant et initialiser l'onboarding.

---

## ÉTAPE 3.3.1 : Service InvitationService et Premier Admin

### 🎯 RATIONNEL MÉTIER

**POURQUOI :** Le tenant est provisionné mais personne ne peut y accéder. Le premier utilisateur (généralement le contact qui a signé le contrat) doit recevoir une invitation pour créer son compte et accéder à la plateforme.

**QUEL PROBLÈME :** Sans invitation automatique, le contact attend un email manuel, peut l'oublier, ou le lien expire. Taux d'activation : 40% si manuel, 85% si automatique dans l'heure suivant signature.

**IMPACT SI ABSENT :**

- **Activation :** 60% des tenants ne complètent jamais l'onboarding
- **Churn :** 40% churn J+7 si pas d'activation
- **Support :** Tickets "Comment accéder ?" = 30% volume support

**CAS D'USAGE CONCRET :**
Tenant ABC Logistics provisionné. Le système doit automatiquement :

1. Créer invitation dans adm_invitations :
   - email : "ahmed@abclogistics.ae" (depuis contract)
   - tenant_id : ABC Logistics
   - role_id : Admin (rôle par défaut créé en 3.2)
   - invitation_type : "initial_admin"
   - token : UUID cryptographique unique
   - expires_at : today + 7 jours
   - sent_at : today
   - status : "pending"

2. Envoyer email personnalisé :

   ```
   Objet : Bienvenue sur FleetCore - Activez votre compte ABC Logistics

   Bonjour Ahmed,

   Félicitations ! Votre organisation ABC Logistics est prête sur FleetCore.

   En tant qu'administrateur principal, vous pouvez maintenant :
   - Créer votre compte sécurisé
   - Ajouter vos véhicules et chauffeurs
   - Inviter votre équipe
   - Commencer à gérer votre flotte

   Créez votre compte : https://fleetcore.com/accept-invitation?token=abc123xyz

   Ce lien expire dans 7 jours.

   Besoin d'aide ? Notre équipe est là : support@fleetcore.com

   L'équipe FleetCore
   ```

3. Ahmed clique sur le lien, arrive sur page d'inscription
4. Crée son compte Clerk (email, mot de passe, 2FA optionnel)
5. Webhook Clerk user.created notifie FleetCore
6. Système crée member dans adm_members :
   - tenant_id : ABC Logistics
   - clerk_user_id : depuis Clerk
   - email : ahmed@abclogistics.ae
   - role_id : Admin
   - status : "active"
7. Invitation passe à status "accepted"
8. Ahmed connecté, redirigé vers onboarding wizard

### 📊 DONNÉES ET RÈGLES MÉTIER

**Règles de génération token invitation :**

```
Token = UUID v4 cryptographique

Sécurité :
- 128 bits d'entropie
- Impossible à deviner
- Unique dans toute la table adm_invitations
- Expire après X jours (configurable, défaut 7)

Format URL :
https://fleetcore.com/accept-invitation?token={UUID}
```

**Règles d'expiration invitation :**

```
expires_at = sent_at + 7 jours

À expiration :
SI status = "pending"
ALORS
  - status = "expired"
  - Invitation inutilisable
  - Possibilité de renvoyer nouvelle invitation
FIN SI
```

**Règles d'acceptation invitation :**

```
Vérifications lors du clic sur lien :
1. Token existe dans DB ? → Sinon erreur "Invalid invitation"
2. expires_at > today ? → Sinon erreur "Invitation expired"
3. status = "pending" ? → Sinon erreur "Invitation already used"

SI toutes OK :
1. Rediriger vers Clerk signup avec :
   - email pré-rempli
   - organization_id pré-sélectionnée
   - redirect après signup : /onboarding
2. Webhook Clerk user.created déclenché
3. FleetCore crée member automatiquement
4. Assigne role depuis invitation
5. Marque invitation accepted
```

**Règles de relances automatiques :**

```
Job quotidien : Chercher invitations pending

SI invitation.status = "pending" ET sent_at + 2 jours = today
ALORS envoyer email relance 1 :
  "Vous n'avez pas encore activé votre compte ABC Logistics..."

SI invitation.status = "pending" ET sent_at + 5 jours = today
ALORS envoyer email relance 2 (dernier rappel) :
  "Dernière chance ! Votre invitation expire dans 2 jours..."

SI invitation.expires_at = today ET status = "pending"
ALORS
  - status = "expired"
  - Notifier admin FleetCore (invitation non acceptée)
  - Créer nouvelle invitation si nécessaire
```

**Règles de limitation invitations :**

```
Limite par tenant :
- Max 100 invitations pending simultanément
- Max 5 invitations par email (éviter spam)
- Max 10 invitations envoyées par jour par tenant

SI limite atteinte :
  - Bloquer création nouvelle invitation
  - Erreur : "Invitation limit reached"
```

### 🏗️ COMPOSANTS À DÉVELOPPER

#### Backend (Service Layer)

**Fichier à créer : `lib/services/admin/invitation.service.ts`**

Service gérant les invitations utilisateurs.

**Méthode createInitialAdminInvitation(tenantId: string, contractId: string) → Promise<Invitation>**

Crée l'invitation pour le premier admin après provisioning tenant.

Actions :

1. Récupérer tenant et contract
2. Vérifier qu'aucune invitation initial_admin n'existe déjà
3. Récupérer rôle "Admin" du tenant
4. Générer token UUID unique
5. Calculer expires_at = today + 7 jours
6. Créer invitation dans DB :
   - tenant_id
   - email : contract.contact_email
   - role_id : Admin
   - invitation_type : "initial_admin"
   - token
   - expires_at
   - sent_by : NULL (automatique système)
   - sent_at : today
   - status : "pending"
   - custom_message : message personnalisé onboarding
7. Créer audit log
8. Envoyer email invitation (via sendInvitationEmail)
9. Retourner invitation créée

**Méthode sendInvitationEmail(invitationId: string) → Promise<void>**

Envoie l'email d'invitation au contact.

Actions :

1. Récupérer invitation avec tenant et role
2. Vérifier status = "pending"
3. Générer URL invitation : base_url + /accept-invitation?token={token}
4. Composer email personnalisé :
   - Template selon invitation_type (initial_admin vs additional_user)
   - Variables : tenant.name, role.name, expires_at, URL
5. Envoyer via service email (Resend)
6. Mettre à jour last_sent_at
7. Incrémenter sent_count
8. Créer audit log

**Méthode acceptInvitation(token: string, clerkUserId: string) → Promise<Member>**

Traite l'acceptation d'une invitation après création compte Clerk.

Actions :

1. Chercher invitation par token
2. Vérifier token valide, non expiré, status pending
3. Vérifier que email invitation = email compte Clerk (sécurité)
4. Créer member dans adm_members :
   - tenant_id depuis invitation
   - clerk_user_id
   - email depuis Clerk
   - first_name, last_name depuis Clerk
   - status : "active"
5. Assigner role via adm_member_roles :
   - member_id
   - role_id depuis invitation
   - is_primary : true
   - assigned_by : NULL (auto)
   - assigned_at : today
6. Mettre à jour invitation :
   - status : "accepted"
   - accepted_at : today
   - accepted_by_member_id : member.id
   - accepted_from_ip : request IP
7. Créer audit log
8. Créer lifecycle event "member_joined"
9. Envoyer email bienvenue au membre
10. Si initial_admin, mettre à jour tenant.onboarding_completed_at
11. Retourner member créé

**Méthode resendInvitation(invitationId: string) → Promise<void>**

Renvoie une invitation (si expirée ou perdue).

Actions :

1. Récupérer invitation
2. SI status = "expired" :
   - Créer nouvelle invitation (copie données)
   - Nouveau token, nouveau expires_at
3. SINON SI status = "pending" :
   - Mettre à jour sent_at, last_sent_at
   - Incrémenter sent_count
4. Envoyer email via sendInvitationEmail
5. Créer audit log

**Méthode revokeInvitation(invitationId: string, reason: string) → Promise<void>**

Révoque une invitation (erreur email, changement décision).

Actions :

1. Récupérer invitation
2. Vérifier status = "pending"
3. Mettre à jour :
   - status : "revoked"
   - deleted_at : today
   - deleted_by : current_user_id
   - deletion_reason : reason
4. Créer audit log
5. L'URL invitation ne fonctionne plus

**Méthode sendReminders() → Promise<number>**

Job cron quotidien pour relances automatiques.

Actions :

1. Chercher invitations pending + sent_at + 2 jours = today
2. Pour chacune, envoyer email relance 1
3. Chercher invitations pending + sent_at + 5 jours = today
4. Pour chacune, envoyer email relance 2 (dernier rappel)
5. Chercher invitations expires_at = today ET status pending
6. Pour chacune, marquer expired
7. Retourner nombre emails envoyés

**Fichier à créer : `lib/repositories/admin/invitation.repository.ts`**

Repository pour accès adm_invitations.

**Méthode findByToken(token: string) → Promise<Invitation | null>**

Cherche une invitation par token (pour acceptation).

**Méthode findPendingByTenant(tenantId: string) → Promise<Invitation[]>**

Liste les invitations en attente d'un tenant.

**Méthode findExpiring(days: number) → Promise<Invitation[]>**

Trouve les invitations qui expirent dans X jours (pour relances).

#### API REST (Endpoints)

**Fichier à créer : `app/api/v1/admin/invitations/route.ts`**

**GET /api/v1/admin/invitations**

Liste les invitations du tenant (pour admins).

Query params :

- status : filter par status
- role_id : filter par rôle
- limit, offset : pagination

Permissions : invitations.read (admin tenant)

Réponse 200 :

```
{
  invitations: [
    {
      id: uuid,
      email: "ahmed@abclogistics.ae",
      role: {name: "Admin"},
      invitation_type: "initial_admin",
      status: "pending",
      sent_at: "2025-11-15T10:00:00Z",
      expires_at: "2025-11-22T10:00:00Z",
      sent_count: 1
    }
  ],
  total: 1,
  pending_count: 1
}
```

**POST /api/v1/admin/invitations**

Créer une invitation (admin invite nouveau membre).

Body :

```
{
  email: "user@company.com",
  role_id: "uuid",
  custom_message: "Welcome to the team!"
}
```

Permissions : invitations.create (admin tenant)

Réponse 201 : Invitation créée et email envoyé

**Fichier à créer : `app/api/v1/admin/invitations/[id]/route.ts`**

**GET /api/v1/admin/invitations/[id]**

Détails d'une invitation.

Permissions : invitations.read

Réponse 200 : Invitation complète

**DELETE /api/v1/admin/invitations/[id]**

Révoquer une invitation.

Permissions : invitations.revoke

Réponse 204 : Invitation révoquée

**Fichier à créer : `app/api/v1/admin/invitations/[id]/resend/route.ts`**

**POST /api/v1/admin/invitations/[id]/resend**

Renvoyer une invitation.

Body : aucun

Permissions : invitations.resend

Réponse 200 :

```
{
  sent_at: "2025-11-16T14:00:00Z",
  sent_count: 2,
  expires_at: "2025-11-23T14:00:00Z"
}
```

**Fichier à créer : `app/api/accept-invitation/route.ts`**

**GET /api/accept-invitation**

Page publique d'acceptation invitation.

Query params :

- token : token invitation

Pas d'authentification requise.

Actions :

1. Vérifier token valide
2. Récupérer invitation
3. Vérifier non expirée, non acceptée
4. Rediriger vers Clerk signup avec :
   - email pré-rempli
   - organization slug
   - metadata invitation
5. Après signup Clerk, webhook déclenche acceptInvitation()

#### Frontend (Interface Utilisateur)

**Fichier à créer : `app/[locale]/admin/team/page.tsx`**

Page gestion équipe du tenant (liste membres + invitations).

Layout :

```
┌──────────────────────────────────────────────────┐
│ HEADER                                           │
│ [Logo] Admin > Team             [+ Invite Member]│
└──────────────────────────────────────────────────┘
┌──────────────────────────────────────────────────┐
│ TABS                                             │
│ [Members] [Invitations]                          │
└──────────────────────────────────────────────────┘
┌──────────────────────────────────────────────────┐
│ MEMBERS TAB                                      │
│ ┌────────────────────────────────────────────┐  │
│ │Name         │Role   │Status │Last Login   │  │
│ ├────────────────────────────────────────────┤  │
│ │Ahmed Al-M   │Admin  │Active🟢│2h ago      │  │
│ └────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────┘
┌──────────────────────────────────────────────────┐
│ INVITATIONS TAB                                  │
│ ┌────────────────────────────────────────────┐  │
│ │Email        │Role   │Status │Sent  │Actions│  │
│ ├────────────────────────────────────────────┤  │
│ │ahmed@...    │Admin  │Pending│3d ago│Resend │  │
│ └────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────┘
```

Fonctionnalités :

- Onglet Members : liste membres actifs
- Onglet Invitations : liste invitations pending/expired
- Bouton "Invite Member" ouvre modal
- Actions par invitation : Resend, Revoke

**Fichier à créer : `app/accept-invitation/page.tsx`**

Page publique d'acceptation invitation.

Layout :

```
┌────────────────────────────────────────────────┐
│             FLEETCORE LOGO                     │
│                                                │
│      Welcome to ABC Logistics! 🎉             │
│                                                │
│  You've been invited to join as Admin         │
│                                                │
│  Click below to create your account:          │
│                                                │
│  [Create My Account →]                        │
│                                                │
│  This invitation expires in 4 days            │
└────────────────────────────────────────────────┘
```

Fonctionnalités :

- Vérification token au chargement
- Si token invalide/expiré : message erreur
- Si token valide : affichage infos invitation
- Bouton redirige vers Clerk signup
- Email pré-rempli dans formulaire Clerk

**Composant à créer : `components/admin/InvitationList.tsx`**

Composant table invitations réutilisable.

Props :

- invitations : array
- onResend : callback
- onRevoke : callback

Affichage :

- Table avec email, rôle, status, dates
- Badge status coloré (Pending🟡, Accepted🟢, Expired🔴, Revoked⚫)
- Boutons actions contextuels

### 🎬 RÉSULTAT DÉMONTRABLE

**Scénario démo complet Sprint 3.3 :**

**1. Tenant provisionné → Invitation envoyée automatiquement**

- Vérifier email ahmed@abclogistics.ae
- Voir email "Bienvenue sur FleetCore" reçu
- Email contient lien d'invitation personnalisé
- Email explique qu'Ahmed est admin principal

**2. Acceptation invitation**

- Cliquer lien dans email
- Arriver sur page /accept-invitation?token=...
- Voir message "Welcome to ABC Logistics! You've been invited as Admin"
- Cliquer "Create My Account"
- Redirection Clerk signup
- Email pré-rempli : ahmed@abclogistics.ae
- Créer mot de passe, activer 2FA (optionnel)
- Cliquer "Sign Up"

**3. Compte créé → Member créé automatiquement**

- Webhook Clerk user.created déclenché
- Système crée member dans adm_members
- Role Admin assigné automatiquement
- Invitation status passe à "accepted"
- Ahmed connecté, redirigé vers /onboarding

**4. Liste invitations visible (admin)**

- Aller sur /admin/team
- Onglet "Invitations"
- Voir invitation Ahmed avec status "Accepted" 🟢
- Voir accepted_at : date/heure acceptation
- Onglet "Members"
- Voir Ahmed Al-Mansoori, role Admin, status Active

**5. Relances automatiques (simulation)**

- Créer invitation test avec sent_at = today - 2 jours
- Exécuter job cron sendReminders()
- Vérifier email relance 1 envoyé
- Modifier sent_at = today - 5 jours
- Exécuter job cron
- Vérifier email relance 2 envoyé (dernier rappel)

**6. Expiration invitation**

- Créer invitation test avec expires_at = today
- Essayer d'accepter (cliquer lien)
- Voir message erreur "Invitation expired"
- Admin peut cliquer "Resend" sur invitation
- Nouvelle invitation créée avec nouveau token
- Email renvoyé

**Critères d'acceptation :**

- ✅ Invitation créée automatiquement après tenant provisioning
- ✅ Token UUID unique généré
- ✅ Email invitation envoyé avec lien personnalisé
- ✅ Page accept-invitation vérifie token validité
- ✅ Redirection Clerk signup avec email pré-rempli
- ✅ Webhook Clerk user.created crée member automatiquement
- ✅ Role assigné depuis invitation
- ✅ Invitation status passe à accepted
- ✅ Relances automatiques envoyées J+2 et J+5
- ✅ Invitation expire à expires_at si pending
- ✅ Admin peut renvoyer invitation expirée
- ✅ Page /admin/team affiche members et invitations

### ⏱️ ESTIMATION

- Backend : 3 heures
  - InvitationService : 2h
  - InvitationRepository : 0.5h
  - Job cron relances : 0.5h
- API : 1 heure
  - Routes invitations CRUD : 0.5h
  - Page accept-invitation : 0.5h
- Frontend : 2 heures
  - Page /admin/team : 1h
  - Page /accept-invitation : 0.5h
  - Composant InvitationList : 0.5h
- **TOTAL : 6 heures (0.75 jour)**

### 🔗 DÉPENDANCES

**Prérequis :**

- Sprint 3.2 terminé (Tenants)
- Table adm_invitations existante
- Service email (Resend) configuré
- Clerk webhooks configurés

**Services requis :**

- TenantService (pour récupérer tenant data)
- MemberService (pour créer member)
- ClerkSyncService (pour traiter webhook)
- EmailService (pour envoyer invitations)

### ✅ CHECKLIST DE VALIDATION

- [ ] **Backend** : InvitationService compile
- [ ] **Backend** : createInitialAdminInvitation() crée invitation
- [ ] **Backend** : sendInvitationEmail() envoie email
- [ ] **Backend** : acceptInvitation() crée member et assigne role
- [ ] **Backend** : resendInvitation() renvoie email
- [ ] **Backend** : sendReminders() cron envoie relances
- [ ] **API** : GET /invitations retourne liste
- [ ] **API** : POST /invitations crée et envoie
- [ ] **API** : POST /invitations/[id]/resend fonctionne
- [ ] **API** : GET /accept-invitation vérifie token
- [ ] **Frontend** : Page /admin/team affiche onglets
- [ ] **Frontend** : Page /accept-invitation affiche infos
- [ ] **Frontend** : Redirection Clerk signup fonctionne
- [ ] **Tests** : 15+ tests InvitationService
- [ ] **Tests** : Test tenant provisioned → invitation sent
- [ ] **Tests** : Test accept invitation → member created
- [ ] **Démo** : Invitation envoyée après provisioning
- [ ] **Démo** : Acceptation invitation crée member
- [ ] **Démo** : Relances automatiques fonctionnent

---

# DÉMO FINALE SPRINT 3

**À la fin du Sprint 3 (Jour 10), le sponsor peut valider le flux complet Lead → Client Actif :**

**1. Opportunity Won → Contract Créé**

- Commercial gagne une opportunity
- Contrat créé automatiquement avec références uniques
- Email signature envoyé au client
- Client signe via DocuSign
- Status contrat : Signed → Active

**2. Contract Active → Tenant Provisionné**

- À effective_date, tenant créé automatiquement
- Organization Clerk synchronisée
- Paramètres régionaux configurés (pays, devise, timezone)
- 4 rôles par défaut créés
- Quotas configurés selon plan

**3. Tenant Provisionné → Invitation Envoyée**

- Email invitation envoyé au contact principal
- Contact crée son compte Clerk
- Member créé automatiquement
- Role Admin assigné
- Client peut se connecter

**4. Traçabilité Complète**

- Depuis lead initial jusqu'au tenant actif
- Audit logs à chaque étape
- Lifecycle events enregistrés
- Attribution marketing préservée

**5. Workflows Automatiques Fonctionnels**

- Renouvellement contrat automatique (si auto_renew)
- Notifications préavis avant expiration
- Trial tenant → Active après paiement
- Relances invitation si non acceptée

**Metrics visibles :**

- Temps Lead → Tenant actif : <24h (vs 7 jours manuel)
- Taux activation tenant : 85% (vs 40% manuel)
- Taux acceptation invitation : 85% J+7
- Nombre contrats actifs, valeur totale ARR
- Taux renouvellement automatique

**Prochaines étapes suggérées :**

- Sprint 4 : Module Fleet Management (véhicules, maintenance)
- Sprint 5 : Module Drivers (chauffeurs, planning)
- Sprint 6 : Module Trips (trajets, facturation)

---

## 📊 RÉSUMÉ DES TABLES UTILISÉES SPRINT 3

### Tables Principales Modifiées/Créées

**CRM :**

- crm_contracts (38 colonnes) - CRUD complet
- crm_opportunities (mise à jour contract_id)
- crm_leads (lecture pour traçabilité)

**Administration :**

- adm_tenants (22 colonnes) - CRUD complet
- adm_members (32 colonnes) - Création membre
- adm_invitations (18 colonnes) - CRUD complet
- adm_roles (20 colonnes) - Création rôles défaut
- adm_member_roles (liaison membre-rôle)
- adm_tenant_settings (configuration tenant)
- adm_tenant_vehicle_classes (classes véhicules défaut)
- adm_tenant_lifecycle_events (événements cycle de vie)
- adm_audit_logs (traçabilité)

**Billing (lecture uniquement) :**

- bil_billing_plans (plans tarifaires)
- bil_tenant_subscriptions (abonnements)

**Référence :**

- crm_addresses (adresses facturation)
- adm_provider_employees (approbateurs, créateurs)

### Relations Clés Créées

```
crm_opportunities (won)
    ↓
crm_contracts
    ↓
adm_tenants ←→ Clerk Organizations
    ↓
adm_invitations
    ↓
adm_members ←→ Clerk Users
    ↓
adm_member_roles
```

---

_Fin Sprint 3 - CRM/ADM Complet et Production-Ready_
