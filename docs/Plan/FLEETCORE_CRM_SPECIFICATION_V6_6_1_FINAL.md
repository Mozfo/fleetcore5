# FLEETCORE - SPÉCIFICATION CRM V6.6.1

> **Version** : 6.6.1  
> **Date** : 10 février 2026  
> **Auteur** : Claude Senior  
> **Statut** : VALIDÉ - POST-IMPLÉMENTATION  
> **Basé sur** : V6.6 + Décisions d'implémentation Sprint 1-2

---

## ⚠️ CHANGEMENTS MAJEURS V6.5.1 → V6.6.1

| Élément              | V6.5.1                                               | V6.6.1                                | Raison                                             |
| -------------------- | ---------------------------------------------------- | ------------------------------------- | -------------------------------------------------- |
| **Ordre wizard**     | Email → Verify → Cal.com → Profil                    | Email → Verify → **Profil → Booking** | Best practice B2B : qualification avant scheduling |
| **Table nurturing**  | Absente                                              | **`crm_nurturing`**                   | Séparer nurturing des leads qualifiés              |
| **Kanban colonnes**  | 4 phases (Acquisition/Qualification/Closing/Outcome) | **4 colonnes opérationnelles**        | Simplification gestionnaire                        |
| **Option callback**  | Absente                                              | **Step 4 checkbox**                   | Alternative au booking calendrier                  |
| **Nurturing auto**   | Absent                                               | **T+1h, J+1, J+7**                    | Récupérer prospects abandonnés                     |
| **Disqualification** | Basique                                              | **Raisons obligatoires + blacklist**  | Traçabilité et anti-spam                           |
| **Statuts lead**     | 8                                                    | **10**                                | +`email_verified`, +`callback_requested`           |

---

## 1. RÉSUMÉ EXÉCUTIF

### 1.1 Vision Produit

FleetCore CRM est le module d'acquisition de la plateforme FleetCore. Il gère le parcours complet d'un prospect depuis la demande de démo jusqu'à la conversion en client payant.

**Philosophie V6.6.1** : Séparer clairement les **prospects en nurturing** (email vérifié mais profil incomplet) des **leads** (profil complet, exploitables par le gestionnaire).

### 1.2 Flux Principal V6.6.1

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           WIZARD BOOK DEMO V6.6.1 (4 étapes)                    │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  STEP 1          STEP 2          STEP 3          STEP 4                        │
│  ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────────────┐              │
│  │ Email   │───▶│ Verify  │───▶│ Profil  │───▶│ Calendrier +    │              │
│  │ + Pays  │    │ 6-digit │    │ Complet │    │ Option callback │              │
│  └─────────┘    └─────────┘    └─────────┘    └─────────────────┘              │
│       │              │              │                   │                       │
│       │              │              │                   │                       │
│       ▼              ▼              │                   ▼                       │
│  WAITLIST       crm_nurturing      │             ┌───────────┐                 │
│  (pays non-op)  (si abandon)       │             │ crm_leads │                 │
│                      │             │             └───────────┘                 │
│                      │             │                   │                       │
│                      ▼             │                   ▼                       │
│               Nurturing auto       │              KANBAN CRM                   │
│               T+1h, J+1, J+7       │              4 colonnes                   │
│                      │             │                                           │
│                      └─────────────┘                                           │
│                      Converti si reprise                                       │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 1.3 Chiffres Clés

| Métrique                 | V6.5.1     | V6.6.1                 |
| ------------------------ | ---------- | ---------------------- |
| Tables CRM               | 3          | **4** (+crm_nurturing) |
| Statuts lead             | 8          | **10**                 |
| Colonnes Kanban          | 4 phases   | **4 colonnes**         |
| Pays opérationnels       | 2 (AE, FR) | 2 (AE, FR)             |
| Raisons disqualification | 0          | **7**                  |

---

## 2. ARCHITECTURE DONNÉES

### 2.1 Vue d'ensemble des tables

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  crm_nurturing  │     │    crm_leads    │     │  crm_waitlist   │
│  (abandons)     │────▶│  (qualifiés)    │     │  (hors marché)  │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                       │
        │                       ▼
        │               ┌─────────────────┐
        │               │ crm_countries   │
        │               └─────────────────┘
        │                       │
        │                       ▼
        │               ┌─────────────────┐
        └──────────────▶│ crm_blacklist   │
                        └─────────────────┘
```

### 2.2 Table `crm_nurturing` (NOUVELLE)

**Objectif** : Stocker les prospects ayant vérifié leur email mais n'ayant pas complété le wizard. Permet le nurturing automatique sans polluer `crm_leads`.

```sql
CREATE TABLE crm_nurturing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES adm_providers(id),

  -- Données collectées (Step 1 + 2 du wizard)
  email VARCHAR(255) NOT NULL,
  country_code VARCHAR(3) NOT NULL,
  email_verified_at TIMESTAMPTZ NOT NULL,

  -- Token de reprise wizard
  resume_token VARCHAR(64) UNIQUE,
  resume_token_expires_at TIMESTAMPTZ,

  -- Nurturing automatique
  nurturing_step INTEGER DEFAULT 0,  -- 0=aucun, 1=J+1 envoyé, 2=J+7 envoyé
  last_nurturing_at TIMESTAMPTZ,
  nurturing_clicked_at TIMESTAMPTZ,  -- A cliqué sur un lien de reprise

  -- Fin de vie
  converted_to_lead_id UUID REFERENCES crm_leads(id),  -- Si converti en lead
  archived_at TIMESTAMPTZ,  -- Après J+7 sans action → newsletter

  -- Tracking UTM
  source VARCHAR(50),
  utm_source VARCHAR(100),
  utm_medium VARCHAR(100),
  utm_campaign VARCHAR(100),

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Contraintes
  CONSTRAINT uq_nurturing_email_provider UNIQUE(email, provider_id)
);

-- Index pour le cron de nurturing
CREATE INDEX idx_nurturing_step
ON crm_nurturing(nurturing_step, last_nurturing_at)
WHERE archived_at IS NULL AND converted_to_lead_id IS NULL;

-- Index pour recherche par email
CREATE INDEX idx_nurturing_email ON crm_nurturing(email);

-- Index pour token de reprise
CREATE INDEX idx_nurturing_resume_token ON crm_nurturing(resume_token)
WHERE resume_token IS NOT NULL;
```

### 2.3 Table `crm_blacklist` (NOUVELLE)

**Objectif** : Empêcher les emails disqualifiés de réutiliser le wizard.

```sql
CREATE TABLE crm_blacklist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES adm_providers(id),

  email VARCHAR(255) NOT NULL,
  reason VARCHAR(50) NOT NULL,  -- Enum disqualification_reason
  reason_comment TEXT,          -- Si reason = 'other'

  -- Référence au lead disqualifié
  original_lead_id UUID REFERENCES crm_leads(id),

  -- Audit
  blacklisted_by UUID REFERENCES dir_users(id),
  blacklisted_at TIMESTAMPTZ DEFAULT NOW(),

  -- Contraintes
  CONSTRAINT uq_blacklist_email_provider UNIQUE(email, provider_id)
);

CREATE INDEX idx_blacklist_email ON crm_blacklist(email);
```

### 2.4 Table `crm_leads` - Évolutions V6.6.1

**Nouveaux champs** :

```sql
ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS
  -- Option callback (Step 4)
  callback_requested BOOLEAN DEFAULT FALSE,
  callback_requested_at TIMESTAMPTZ,
  callback_completed_at TIMESTAMPTZ,
  callback_notes TEXT,

  -- Disqualification avec traçabilité
  disqualified_at TIMESTAMPTZ,
  disqualification_reason VARCHAR(50),
  disqualification_comment TEXT,
  disqualified_by UUID REFERENCES dir_users(id),

  -- Notification recovery (pour leads avec wizard incomplet)
  recovery_notification_sent_at TIMESTAMPTZ,
  recovery_notification_clicked_at TIMESTAMPTZ;
```

**Nouveaux statuts** :

```sql
-- Contrainte CHECK avec les 10 statuts V6.6.1
ALTER TABLE crm_leads DROP CONSTRAINT IF EXISTS crm_leads_status_check;
ALTER TABLE crm_leads ADD CONSTRAINT crm_leads_status_check
CHECK (status IN (
    'new', 'email_verified', 'callback_requested', 'demo',
    'proposal_sent', 'payment_pending', 'converted', 'lost',
    'nurturing', 'disqualified'
));
```

### 2.5 Enum `disqualification_reason`

```sql
CREATE TYPE disqualification_reason AS ENUM (
  'fantasy_email',    -- Email fantaisiste (mickey@disney.com)
  'competitor',       -- Concurrent identifié
  'no_response',      -- Aucune réponse après 5 jours
  'wrong_market',     -- Hors marché cible (pas VTC/taxi)
  'student_test',     -- Étudiant ou test
  'duplicate',        -- Doublon d'un lead existant
  'other'             -- Autre (commentaire requis)
);
```

---

## 3. LES 10 STATUTS LEAD V6.6.1

| Statut               | Description                     | Kanban         | Transition depuis                      | Transition vers                        |
| -------------------- | ------------------------------- | -------------- | -------------------------------------- | -------------------------------------- |
| `new`                | Lead créé, email non vérifié    | ❌ Non visible | -                                      | `email_verified`                       |
| `email_verified`     | Email vérifié, wizard incomplet | ❌ Non visible | `new`                                  | `callback_requested`, `demo`           |
| `callback_requested` | Profil complet, demande rappel  | À contacter    | `email_verified`                       | `demo`, `disqualified`, `lost`         |
| `demo`               | Démo planifiée via Cal.com      | Démo planifiée | `email_verified`, `callback_requested` | `proposal_sent`, `lost`, `nurturing`   |
| `proposal_sent`      | Devis envoyé                    | Proposition    | `demo`                                 | `payment_pending`, `lost`, `nurturing` |
| `payment_pending`    | En attente paiement             | Proposition    | `proposal_sent`                        | `converted`, `lost`                    |
| `converted`          | Client payant                   | Finalisé       | `payment_pending`                      | -                                      |
| `lost`               | Perdu                           | Finalisé       | Tous sauf `converted`                  | `nurturing`                            |
| `nurturing`          | En nurturing                    | Finalisé       | `demo`, `proposal_sent`, `lost`        | `demo`                                 |
| `disqualified`       | Disqualifié + blacklisté        | ❌ Non visible | `callback_requested`, `demo`           | -                                      |

---

## 4. KANBAN 4 COLONNES V6.6.1

### 4.1 Structure

```
┌─────────────────┬─────────────────┬─────────────────┬─────────────────┐
│  À CONTACTER    │ DÉMO PLANIFIÉE  │   PROPOSITION   │    FINALISÉ     │
│  (To Contact)   │ (Demo Scheduled)│   (Proposal)    │   (Finalized)   │
│                 │                 │                 │                 │
│ callback_       │ demo            │ proposal_sent   │ converted       │
│ requested       │                 │ payment_pending │ lost            │
│                 │                 │                 │ nurturing       │
│                 │                 │                 │                 │
│ Action:         │ Action:         │ Action:         │ Action:         │
│ Rappeler <48h   │ Préparer démo   │ Relancer devis  │ Archiver        │
│                 │                 │ Encaisser       │ Réactiver       │
└─────────────────┴─────────────────┴─────────────────┴─────────────────┘
```

### 4.2 Labels i18n

| ID          | EN             | FR             | AR        |
| ----------- | -------------- | -------------- | --------- |
| `contact`   | To Contact     | À contacter    | للاتصال   |
| `demo`      | Demo Scheduled | Démo planifiée | عرض مجدول |
| `proposal`  | Proposal       | Proposition    | عرض       |
| `finalized` | Finalized      | Finalisé       | منتهي     |

### 4.3 Règles d'affichage

| Statut               | Visible Kanban | Colonne        | Raison                      |
| -------------------- | -------------- | -------------- | --------------------------- |
| `new`                | ❌ NON         | -              | Wizard non commencé         |
| `email_verified`     | ❌ NON         | -              | Géré par nurturing auto     |
| `callback_requested` | ✅ OUI         | À contacter    | Action gestionnaire requise |
| `demo`               | ✅ OUI         | Démo planifiée | Préparer la démo            |
| `proposal_sent`      | ✅ OUI         | Proposition    | Relancer le devis           |
| `payment_pending`    | ✅ OUI         | Proposition    | Encaisser le paiement       |
| `converted`          | ✅ OUI         | Finalisé       | Client gagné                |
| `lost`               | ✅ OUI         | Finalisé       | Lead perdu                  |
| `nurturing`          | ✅ OUI         | Finalisé       | En réactivation             |
| `disqualified`       | ❌ NON         | -              | Blacklisté, invisible       |

### 4.4 Filtre obligatoire

**Seuls les leads avec `wizard_completed = TRUE` sont visibles dans le Kanban.**

---

## 5. WIZARD V6.6.1 - 4 ÉTAPES

### 5.1 Step 1 : Email + Country

**URL** : `/{locale}/book-demo`

**Champs** :

| Champ          | Type   | Required | Validation                                         |
| -------------- | ------ | -------- | -------------------------------------------------- |
| `email`        | email  | ✅ OUI   | `z.string().email()`                               |
| `country_code` | select | ✅ OUI   | Depuis `crm_countries WHERE is_operational = true` |

**Comportement** :

1. `GET /api/crm/leads/check-email` → Vérifier blacklist + email existant
2. Si blacklisté → Message "Cette adresse email n'est pas éligible"
3. Si pays non-opérationnel → Message waitlist inline
4. Sinon → `POST /api/crm/demo-leads` + redirect Step 2

### 5.2 Step 2 : Email Verification

**URL** : `/{locale}/book-demo/verify?leadId=xxx&email=xxx`

**Comportement** : Code 6-digit, 15min expiry, 5 attempts max

**Après vérification** : Redirect vers `/book-demo/profile`

### 5.3 Step 3 : Profil Complet

**URL** : `/{locale}/book-demo/profile?leadId=xxx`

**Champs** :

| Champ          | Type     | Required     | Validation                       |
| -------------- | -------- | ------------ | -------------------------------- |
| `first_name`   | text     | ✅ OUI       | `z.string().min(2)`              |
| `last_name`    | text     | ✅ OUI       | `z.string().min(2)`              |
| `phone`        | tel      | ✅ OUI       | Format international             |
| `company_name` | text     | ✅ OUI       | `z.string().min(2)`              |
| `fleet_size`   | select   | ✅ OUI       | Options définies                 |
| `message`      | textarea | ❌ NON       | `z.string().max(500).optional()` |
| `gdpr_consent` | checkbox | Conditionnel | Si pays GDPR                     |

**API** : `PATCH /api/crm/leads/[id]/complete-profile`

**Après validation** : `wizard_completed = true`, redirect vers `/book-demo/schedule`

### 5.4 Step 4 : Booking + Option Callback

**URL** : `/{locale}/book-demo/schedule?leadId=xxx`

**Interface mobile-first** :

```
┌─────────────────────────────────────────┐
│                                         │
│        Calendrier Cal.com               │
│        (intégré, scrollable)            │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│  ☑ Je préfère être rappelé dans les     │
│    meilleurs délais                     │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │ Notes (optionnel)               │    │  ← Apparaît si checkbox cochée
│  └─────────────────────────────────┘    │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │      Valider mon choix          │    │  ← Apparaît si checkbox cochée
│  └─────────────────────────────────┘    │
│                                         │
└─────────────────────────────────────────┘
```

**Comportement** :

| Action utilisateur          | Résultat                    | Status lead          |
| --------------------------- | --------------------------- | -------------------- |
| Sélectionne créneau Cal.com | Booking créé via Cal.com    | `demo`               |
| Coche checkbox + "Valider"  | Callback request enregistré | `callback_requested` |

**Si checkbox cochée** : Le calendrier Cal.com est grisé (opacity-40 + pointer-events-none)

**API callback** : `POST /api/crm/leads/[id]/request-callback`

### 5.5 Step 5 : Confirmation

**URL** : `/{locale}/book-demo/confirmation?leadId=xxx&type=booking|callback`

**Affichage conditionnel** :

| Type       | Icône               | Message                         |
| ---------- | ------------------- | ------------------------------- |
| `booking`  | ✅ CheckCircle vert | "Votre démo est confirmée"      |
| `callback` | 📞 Phone bleu       | "Demande de rappel enregistrée" |

### 5.6 Page Resume (Reprise nurturing)

**URL** : `/{locale}/book-demo/resume?token=xxx`

**Comportement** :

1. Valider token (existe, non expiré - 30 jours)
2. Si valide → Redirect `/book-demo/profile?leadId=xxx`
3. Si expiré → Message "Lien expiré" + CTA "Recommencer"
4. Si déjà converti → Message "Déjà complété" + CTA "Accueil"

---

## 6. NURTURING AUTOMATIQUE

### 6.1 Déclencheur

Un lead est éligible au nurturing recovery si :

- Email vérifié (`email_verified_at` NOT NULL)
- Wizard NON complété (`wizard_completed = FALSE`)
- Notification recovery non envoyée (`recovery_notification_sent_at` IS NULL)
- Au moins 1 heure depuis vérification email

### 6.2 Séquence

| Étape        | Délai                 | Template             | Objet                                    |
| ------------ | --------------------- | -------------------- | ---------------------------------------- |
| **Recovery** | T+1h                  | `nurturing_recovery` | "Finalisez votre demande de démo"        |
| **J+1**      | 24h après migration   | `nurturing_j1`       | "Reprenez là où vous vous êtes arrêté"   |
| **J+7**      | 7 jours après J+1     | `nurturing_j7`       | "Dernière chance de réserver votre démo" |
| **Archive**  | Après J+7 sans action | -                    | → Newsletter mensuelle si optin          |

> **Note V6.6.1** : Le J+3 a été supprimé. Philosophie : "Pas besoin de courir après les leads."

### 6.3 Flow détaillé

```
Lead créé (email_verified)
         │
         ├── wizard_completed = TRUE ──▶ KANBAN (visible gestionnaire)
         │
         └── wizard_completed = FALSE
                    │
                    ▼
              Attente 1h
                    │
                    ▼
         Recovery notification (T+1h)
         recovery_notification_sent_at = NOW()
                    │
                    ├── Clic ──▶ Resume ──▶ /profile ──▶ KANBAN
                    │
                    └── Pas de clic (24h)
                              │
                              ▼
                    Migration vers crm_nurturing
                    nurturing_step = 0
                              │
                              ▼
                         Email J+1
                    nurturing_step = 1
                              │
                              ├── Clic ──▶ Resume ──▶ /profile ──▶ KANBAN
                              │
                              └── Pas de clic (6 jours)
                                        │
                                        ▼
                                   Email J+7
                              nurturing_step = 2
                                        │
                                        ├── Clic ──▶ Resume
                                        │
                                        └── Pas de clic (24h)
                                                  │
                                                  ▼
                                             Archive
                                        archived_at = NOW()
                                        → Newsletter (si optin)
```

### 6.4 Token de reprise

```typescript
// Génération
const resumeToken = crypto.randomBytes(32).toString("base64url");
const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 jours

// URL de reprise
const resumeUrl = `${baseUrl}/${locale}/book-demo/resume?token=${resumeToken}`;
```

### 6.5 Cron nurturing

**Route** : `GET /api/cron/nurturing`

**Fréquence** : Toutes les heures

**Actions** :

1. Recovery (T+1h) pour leads `wizard_completed = FALSE`
2. Migration vers `crm_nurturing` après 24h sans action
3. J+1 pour `nurturing_step = 0`
4. J+7 pour `nurturing_step = 1`
5. Archive pour `nurturing_step = 2` après 24h

---

## 7. DISQUALIFICATION

### 7.1 Les 7 raisons

| Code            | Label FR                   | Label EN                 |
| --------------- | -------------------------- | ------------------------ |
| `fantasy_email` | Email fantaisiste          | Fake email               |
| `competitor`    | Concurrent                 | Competitor               |
| `no_response`   | Aucune réponse             | No response              |
| `wrong_market`  | Hors marché cible          | Wrong market             |
| `student_test`  | Étudiant / Test            | Student / Test           |
| `duplicate`     | Doublon                    | Duplicate                |
| `other`         | Autre (commentaire requis) | Other (comment required) |

### 7.2 Modal disqualification

```
┌─────────────────────────────────────────┐
│         Disqualifier ce lead            │
├─────────────────────────────────────────┤
│                                         │
│  Raison * (obligatoire)                 │
│  ┌─────────────────────────────────┐    │
│  │ ▼ Sélectionner une raison       │    │
│  └─────────────────────────────────┘    │
│                                         │
│  Commentaire (requis si "Autre")        │
│  ┌─────────────────────────────────┐    │
│  │                                 │    │
│  └─────────────────────────────────┘    │
│                                         │
│  ☑ Bloquer cet email (blacklist)        │  ← Coché par défaut
│                                         │
│  ┌───────────┐  ┌───────────────────┐   │
│  │  Annuler  │  │   Disqualifier    │   │
│  └───────────┘  └───────────────────┘   │
│                                         │
└─────────────────────────────────────────┘
```

### 7.3 Points d'accès

- Kanban : Menu dropdown sur la carte lead → "Disqualifier"
- Kanban : Clic droit sur la carte → Menu contextuel → "Disqualifier"
- Lead Drawer : Bouton "Disqualifier" dans le footer

---

## 8. ROUTES API V6.6.1

### 8.1 Nouvelles routes

| Route                                  | Méthode | Description                         |
| -------------------------------------- | ------- | ----------------------------------- |
| `/api/crm/leads/[id]/complete-profile` | PATCH   | Compléter profil (Step 3)           |
| `/api/crm/leads/[id]/request-callback` | POST    | Demander callback (Step 4)          |
| `/api/crm/leads/[id]/disqualify`       | POST    | Disqualifier + blacklist            |
| `/api/crm/nurturing/resume`            | GET     | Reprendre wizard via token          |
| `/api/cron/nurturing`                  | POST    | Cron nurturing (Recovery, J+1, J+7) |

### 8.2 Routes modifiées

| Route                        | Modification            |
| ---------------------------- | ----------------------- |
| `/api/crm/leads/check-email` | +Vérification blacklist |

### 8.3 Signatures détaillées

#### PATCH /api/crm/leads/[id]/complete-profile

```typescript
// Request body
{
  first_name: string,
  last_name: string,
  phone: string,
  company_name: string,
  fleet_size: string,
  message?: string,
  gdpr_consent?: boolean
}

// Response
{
  success: true,
  data: {
    leadId: string,
    wizard_completed: true
  }
}
```

#### POST /api/crm/leads/[id]/request-callback

```typescript
// Request body
{
  notes?: string  // Notes optionnelles (max 500 chars)
}

// Response
{
  success: true,
  data: {
    leadId: string,
    status: 'callback_requested',
    callback_requested_at: string
  }
}
```

#### POST /api/crm/leads/[id]/disqualify

```typescript
// Request body
{
  reason: 'fantasy_email' | 'competitor' | 'no_response' | 'wrong_market' | 'student_test' | 'duplicate' | 'other',
  comment?: string,  // Requis si reason === 'other'
  blacklist?: boolean  // default: true
}

// Response
{
  success: true,
  data: {
    leadId: string,
    status: 'disqualified',
    blacklisted: boolean
  }
}
```

#### GET /api/crm/nurturing/resume?token=xxx

```typescript
// Response success
{
  success: true,
  data: {
    redirect_to: '/fr/book-demo/profile?leadId=xxx'
  }
}

// Response error
{
  success: false,
  error: 'INVALID_TOKEN' | 'ALREADY_CONVERTED',
  message: string
}
```

---

## 9. SERVICES V6.6.1

### 9.1 Structure

```
lib/services/crm/
├── wizard-lead.service.ts        ← Modifié (nouveau flow)
├── email-verification.service.ts ← Inchangé
├── nurturing.service.ts          ← NOUVEAU
├── blacklist.service.ts          ← NOUVEAU
├── lead-status.service.ts        ← Modifié (disqualify)
└── notification-queue.service.ts ← Modifié (templates nurturing)
```

### 9.2 NurturingService

```typescript
class NurturingService {
  // Recovery notification (T+1h)
  async processRecoveryNotifications(): Promise<number>;

  // Migration vers crm_nurturing (après 24h)
  async migrateAbandonedLeads(): Promise<number>;

  // Envoyer J+1 / J+7
  async processNurturingEmails(): Promise<{ j1: number; j7: number }>;

  // Archiver après J+7
  async archiveExpired(): Promise<number>;

  // Valider token reprise
  async validateResumeToken(token: string): Promise<ResumeResult>;
}
```

### 9.3 BlacklistService

```typescript
class BlacklistService {
  // Vérifier si blacklisté
  async isBlacklisted(email: string, providerId: string): Promise<boolean>;

  // Ajouter au blacklist
  async addToBlacklist(params: AddToBlacklistParams): Promise<crm_blacklist>;

  // Retirer du blacklist (admin only)
  async removeFromBlacklist(email: string, providerId: string): Promise<void>;
}
```

---

## 10. TEMPLATES EMAIL

### 10.1 Structure

```
emails/templates/
├── NurturingRecovery.tsx    // T+1h : "Finalisez votre demande"
├── NurturingJ1.tsx          // J+1 : "Reprenez là où vous vous êtes arrêté"
└── NurturingJ7.tsx          // J+7 : "Dernière chance"
```

### 10.2 Variables communes

```typescript
interface NurturingEmailVars {
  resumeUrl: string; // URL avec token
  email: string; // Email destinataire
  locale: "fr" | "en" | "ar";
  unsubscribeUrl: string;
}
```

### 10.3 Sujets par langue

| Template | EN                            | FR                                     | AR                        |
| -------- | ----------------------------- | -------------------------------------- | ------------------------- |
| Recovery | Complete your demo request    | Finalisez votre demande de démo        | أكمل طلب العرض التوضيحي   |
| J+1      | Pick up where you left off    | Reprenez là où vous vous êtes arrêté   | استئناف من حيث توقفت      |
| J+7      | Last chance to book your demo | Dernière chance de réserver votre démo | الفرصة الأخيرة لحجز العرض |

---

## 11. RÈGLES DE GESTION V6.6.1

| #   | Règle                                | Implémentation                    |
| --- | ------------------------------------ | --------------------------------- |
| 1   | Profil AVANT booking                 | Step 3 = profil, Step 4 = Cal.com |
| 2   | Nurturing séparé                     | Table `crm_nurturing`             |
| 3   | Nurturing auto T+1h, J+1, J+7        | Cron `/api/cron/nurturing`        |
| 4   | Token reprise 30 jours               | `resume_token_expires_at`         |
| 5   | Blacklist par défaut si disqualifié  | Modal checkbox pré-cochée         |
| 6   | Raison disqualification obligatoire  | Dropdown 7 options                |
| 7   | Commentaire si raison "other"        | Validation frontend + backend     |
| 8   | Callback = rappel "meilleurs délais" | Pas de promesse temporelle        |
| 9   | Kanban = wizard_completed uniquement | Filtre backend obligatoire        |
| 10  | Archive J+7 → Newsletter             | Si optin GDPR uniquement          |

---

## 12. CHECKLIST VALIDATION V6.6.1

### Base de données

- [x] Table `crm_nurturing` créée
- [x] Table `crm_blacklist` créée
- [x] Colonnes `crm_leads` ajoutées (10 colonnes)
- [x] Contrainte CHECK 10 statuts
- [x] Index créés

### Routes API

- [x] `PATCH /api/crm/leads/[id]/complete-profile`
- [x] `POST /api/crm/leads/[id]/request-callback`
- [x] `POST /api/crm/leads/[id]/disqualify`
- [x] `GET /api/crm/nurturing/resume`
- [x] `POST /api/cron/nurturing`
- [x] `GET /api/crm/leads/check-email` (blacklist)

### Services

- [x] NurturingService
- [x] BlacklistService
- [x] WizardLeadService modifié
- [x] LeadStatusService modifié

### Frontend

- [x] Step 3 /profile (profil complet + champ message)
- [x] Step 4 /schedule (booking + callback option)
- [x] Modal disqualification (7 raisons)
- [x] Page resume
- [x] Kanban 4 colonnes (labels FR/EN/AR)

### Templates email

- [x] Template Recovery (T+1h)
- [x] Template J+1
- [x] Template J+7

### i18n

- [x] EN complet (crm.json + public.json)
- [x] FR complet (crm.json + public.json)
- [x] AR complet (crm.json + public.json)

### Tests

- [x] TypeScript 0 erreurs
- [x] 1417 tests passent
- [x] Build succès

---

## 13. CHANGELOG

### V6.6.1 (10 février 2026) - Post-implémentation

| Élément               | V6.6 Original             | V6.6.1 Final              | Raison                                                         |
| --------------------- | ------------------------- | ------------------------- | -------------------------------------------------------------- |
| Table nurturing       | `crm_prospects`           | `crm_nurturing`           | Naming anglais cohérent                                        |
| Séquence nurturing    | T+5min, J+1, J+3, J+7     | T+1h, J+1, J+7            | Best practice B2B (sweet spot 1h), simplification (pas de J+3) |
| URLs wizard           | `/step-3`, `/step-4`      | `/profile`, `/schedule`   | SEO + lisibilité                                               |
| Colonnes notification | `interest_notification_*` | `recovery_notification_*` | Naming plus explicite                                          |
| Champ fleet           | `fleet_size_range`        | `fleet_size`              | Simplification                                                 |
| Statut qualified      | Inclus (11 statuts)       | Supprimé (10 statuts)     | Qualification via scoring, pas statut dédié                    |
| Labels Kanban         | Ambigus                   | Explicites EN/FR/AR       | Conformité multi-langue                                        |
| Champ message         | Absent                    | Optionnel Step 3          | Feedback utilisateur                                           |
| Service Prospect      | `ProspectService`         | `NurturingService`        | Naming cohérent avec table                                     |

### V6.6 (08 février 2026) - Spec initiale

- Architecture nurturing
- Nouveau flow wizard (profil → booking)
- Kanban 4 colonnes
- Option callback
- Disqualification avec raisons

---

_Document mis à jour par Claude Senior - Alignement spec/implémentation_
