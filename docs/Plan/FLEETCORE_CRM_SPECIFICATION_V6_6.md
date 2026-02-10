# FLEETCORE - SPÉCIFICATION CRM V6.6

> **Version** : 6.6  
> **Date** : 08 février 2026  
> **Auteur** : Claude Senior  
> **Statut** : EN VALIDATION  
> **Basé sur** : V6.5.1 + Décisions architecture nurturing

---

## ⚠️ CHANGEMENTS MAJEURS V6.5.1 → V6.6

| Élément              | V6.5.1                                               | V6.6                                  | Raison                                             |
| -------------------- | ---------------------------------------------------- | ------------------------------------- | -------------------------------------------------- |
| **Ordre wizard**     | Email → Verify → Cal.com → Profil                    | Email → Verify → **Profil → Booking** | Best practice B2B : qualification avant scheduling |
| **Table prospects**  | Absente                                              | **`crm_prospects`**                   | Séparer nurturing des leads qualifiés              |
| **Kanban colonnes**  | 4 phases (Acquisition/Qualification/Closing/Outcome) | **4 colonnes opérationnelles**        | Simplification gestionnaire                        |
| **Option callback**  | Absente                                              | **Step 4 checkbox**                   | Alternative au booking calendrier                  |
| **Nurturing auto**   | Absent                                               | **J+1, J+3, J+7**                     | Récupérer prospects abandonnés                     |
| **Disqualification** | Basique                                              | **Raisons obligatoires + blacklist**  | Traçabilité et anti-spam                           |
| **Statuts lead**     | 8                                                    | **10**                                | +`email_verified`, +`callback_requested`           |

---

## 1. RÉSUMÉ EXÉCUTIF

### 1.1 Vision Produit

FleetCore CRM est le module d'acquisition de la plateforme FleetCore. Il gère le parcours complet d'un prospect depuis la demande de démo jusqu'à la conversion en client payant.

**Philosophie V6.6** : Séparer clairement les **prospects** (email vérifié mais profil incomplet) des **leads** (profil complet, exploitables par le gestionnaire).

### 1.2 Flux Principal V6.6

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           WIZARD BOOK DEMO V6.6 (4 étapes)                      │
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
│  WAITLIST       crm_prospects      │             ┌───────────┐                 │
│  (pays non-op)  (si abandon)       │             │ crm_leads │                 │
│                      │             │             └───────────┘                 │
│                      │             │                   │                       │
│                      ▼             │                   ▼                       │
│               Nurturing auto       │              KANBAN CRM                   │
│               J+1, J+3, J+7        │              4 colonnes                   │
│                      │             │                                           │
│                      └─────────────┘                                           │
│                      Converti si reprise                                       │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 1.3 Chiffres Clés

| Métrique                 | V6.5.1     | V6.6                   |
| ------------------------ | ---------- | ---------------------- |
| Tables CRM               | 3          | **4** (+crm_prospects) |
| Statuts lead             | 8          | **10**                 |
| Colonnes Kanban          | 4 phases   | **4 colonnes**         |
| Pays opérationnels       | 2 (AE, FR) | 2 (AE, FR)             |
| Raisons disqualification | 0          | **7**                  |

---

## 2. ARCHITECTURE DONNÉES

### 2.1 Vue d'ensemble des tables

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  crm_prospects  │     │    crm_leads    │     │  crm_waitlist   │
│  (nurturing)    │────▶│  (qualifiés)    │     │  (hors marché)  │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                       │
        │                       ▼
        │               ┌─────────────────┐
        │               │ crm_countries   │
        │               └─────────────────┘
        │                       │
        │                       ▼
        │               ┌─────────────────┐
        └──────────────▶│ crm_blacklist   │ (NOUVEAU)
                        └─────────────────┘
```

### 2.2 Table `crm_prospects` (NOUVELLE)

**Objectif** : Stocker les prospects ayant vérifié leur email mais n'ayant pas complété le wizard. Permet le nurturing automatique sans polluer `crm_leads`.

```sql
CREATE TABLE crm_prospects (
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
  nurturing_step INTEGER DEFAULT 0,  -- 0=aucun, 1=J+1 envoyé, 2=J+3 envoyé, 3=J+7 envoyé
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
  CONSTRAINT uq_prospects_email_provider UNIQUE(email, provider_id)
);

-- Index pour le cron de nurturing
CREATE INDEX idx_prospects_nurturing
ON crm_prospects(nurturing_step, last_nurturing_at)
WHERE archived_at IS NULL AND converted_to_lead_id IS NULL;

-- Index pour recherche par email
CREATE INDEX idx_prospects_email ON crm_prospects(email);

-- Index pour token de reprise
CREATE INDEX idx_prospects_resume_token ON crm_prospects(resume_token)
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

### 2.4 Table `crm_leads` - Évolutions V6.6

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

  -- Notification intérêt (pour leads sans booking)
  interest_notification_sent_at TIMESTAMPTZ,
  interest_notification_clicked_at TIMESTAMPTZ;
```

**Nouveaux statuts** (enum `crm_lead_status`) :

```sql
-- Ajout des nouveaux statuts
ALTER TYPE crm_lead_status ADD VALUE IF NOT EXISTS 'email_verified';
ALTER TYPE crm_lead_status ADD VALUE IF NOT EXISTS 'callback_requested';
```

### 2.5 Enum `disqualification_reason` (NOUVEAU)

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

## 3. LES 10 STATUTS LEAD V6.6

| Statut               | Description                     | Kanban         | Transition depuis                            | Transition vers                        |
| -------------------- | ------------------------------- | -------------- | -------------------------------------------- | -------------------------------------- |
| `email_verified`     | Email vérifié, wizard incomplet | ❌ Nurturing   | -                                            | `callback_requested`, `demo`           |
| `callback_requested` | Profil complet, demande rappel  | À CONTACTER    | `email_verified`                             | `demo`, `disqualified`, `lost`         |
| `demo`               | Démo planifiée via Cal.com      | DÉMO PLANIFIÉE | `email_verified`, `callback_requested`       | `qualified`, `lost`, `nurturing`       |
| `qualified`          | Lead qualifié (CPT validé)      | DÉMO PLANIFIÉE | `demo`                                       | `proposal_sent`, `lost`, `nurturing`   |
| `proposal_sent`      | Devis envoyé                    | PROPOSITION    | `qualified`                                  | `payment_pending`, `lost`, `nurturing` |
| `payment_pending`    | En attente paiement             | PROPOSITION    | `proposal_sent`                              | `converted`, `lost`                    |
| `converted`          | Client payant                   | FINALISÉ       | `payment_pending`                            | -                                      |
| `lost`               | Perdu                           | FINALISÉ       | Tous sauf `converted`                        | `nurturing`                            |
| `nurturing`          | En nurturing                    | FINALISÉ       | `demo`, `qualified`, `proposal_sent`, `lost` | `demo`                                 |
| `disqualified`       | Disqualifié + blacklisté        | ❌ Invisible   | `callback_requested`, `demo`                 | -                                      |

---

## 4. KANBAN 4 COLONNES V6.6

```
┌─────────────────┬─────────────────┬─────────────────┬─────────────────┐
│  À CONTACTER    │ DÉMO PLANIFIÉE  │   PROPOSITION   │    FINALISÉ     │
│                 │                 │                 │                 │
│ callback_       │ demo            │ proposal_sent   │ converted       │
│ requested       │ qualified       │ payment_pending │ lost            │
│                 │                 │                 │ nurturing       │
│                 │                 │                 │                 │
│ Action:         │ Action:         │ Action:         │ Action:         │
│ Rappeler <48h   │ Préparer démo   │ Relancer devis  │ Archiver        │
│                 │ Qualifier       │ Encaisser       │ Réactiver       │
└─────────────────┴─────────────────┴─────────────────┴─────────────────┘
```

**Règles d'affichage** :

| Statut               | Visible Kanban | Raison                   |
| -------------------- | -------------- | ------------------------ |
| `email_verified`     | ❌ NON         | Géré par nurturing auto  |
| `callback_requested` | ✅ OUI         | Colonne "À CONTACTER"    |
| `demo`               | ✅ OUI         | Colonne "DÉMO PLANIFIÉE" |
| `qualified`          | ✅ OUI         | Colonne "DÉMO PLANIFIÉE" |
| `proposal_sent`      | ✅ OUI         | Colonne "PROPOSITION"    |
| `payment_pending`    | ✅ OUI         | Colonne "PROPOSITION"    |
| `converted`          | ✅ OUI         | Colonne "FINALISÉ"       |
| `lost`               | ✅ OUI         | Colonne "FINALISÉ"       |
| `nurturing`          | ✅ OUI         | Colonne "FINALISÉ"       |
| `disqualified`       | ❌ NON         | Disparu (blacklisté)     |

---

## 5. WIZARD V6.6 - 4 ÉTAPES

### 5.1 Step 1 : Email + Country

**URL** : `/{locale}/book-demo`

**Champs** :

| Champ          | Type   | Required | Validation           |
| -------------- | ------ | -------- | -------------------- |
| `email`        | email  | ✅ OUI   | `z.string().email()` |
| `country_code` | select | ✅ OUI   | `z.string().min(2)`  |

**Comportement** :

1. `GET /api/crm/leads/check-email` → Vérifier blacklist + email existant
2. Si blacklisté → Message "Cette adresse email n'est pas éligible"
3. Si pays non-opérationnel → Message waitlist inline
4. Sinon → `POST /api/crm/demo-leads` + redirect Step 2

**Teaser anti-abandon** : "⏱️ Dans 2 minutes, choisissez votre créneau de démo"

### 5.2 Step 2 : Email Verification

**URL** : `/{locale}/book-demo/verify?leadId=xxx&email=xxx`

**Comportement identique V6.5.1** (code 6-digit, 15min expiry, 5 attempts max)

**Teaser anti-abandon** : "🎯 Plus qu'une étape pour accéder au calendrier"

### 5.3 Step 3 : Profil Complet (NOUVEAU - était Step 4 en V6.5.1)

**URL** : `/{locale}/book-demo/step-3?leadId=xxx`

**Champs** :

| Champ              | Type     | Required     | Validation           |
| ------------------ | -------- | ------------ | -------------------- |
| `first_name`       | text     | ✅ OUI       | `z.string().min(2)`  |
| `last_name`        | text     | ✅ OUI       | `z.string().min(2)`  |
| `phone`            | tel      | ✅ OUI       | Format international |
| `company_name`     | text     | ✅ OUI       | `z.string().min(2)`  |
| `fleet_size_range` | select   | ✅ OUI       | Options définies     |
| `gdpr_consent`     | checkbox | Conditionnel | Si pays GDPR         |

**API** : `PATCH /api/crm/leads/[id]/complete-profile`

**Teaser anti-abandon** : "📅 Dernière étape : réservez votre créneau"

### 5.4 Step 4 : Booking + Option Callback (NOUVEAU)

**URL** : `/{locale}/book-demo/step-4?leadId=xxx`

**Interface mobile-first** :

```
┌─────────────────────────────────────────┐
│                                         │
│        Calendrier Cal.com               │
│        (intégré, scrollable)            │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│  ☐ Je préfère être rappelé dans les     │
│    meilleurs délais                     │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │      Valider mon choix          │    │ ← Apparaît si checkbox cochée
│  └─────────────────────────────────┘    │
│                                         │
└─────────────────────────────────────────┘
```

**Comportement** :

| Action utilisateur          | Résultat                    | Status lead          |
| --------------------------- | --------------------------- | -------------------- |
| Sélectionne créneau Cal.com | Booking créé via Cal.com    | `demo`               |
| Coche checkbox + "Valider"  | Callback request enregistré | `callback_requested` |

**API callback** : `POST /api/crm/leads/[id]/request-callback`

```typescript
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

---

## 6. NURTURING AUTOMATIQUE

### 6.1 Déclencheur

Un prospect est éligible au nurturing si :

- Email vérifié (`email_verified_at` NOT NULL)
- Profil NON complété (existe dans `crm_prospects`, pas dans `crm_leads`)
- Non archivé (`archived_at` IS NULL)
- Non converti (`converted_to_lead_id` IS NULL)

### 6.2 Séquence

| Étape | Délai                   | Email             | Objet                                    |
| ----- | ----------------------- | ----------------- | ---------------------------------------- |
| J+1   | 24h après vérification  | `nurturing_step1` | "Reprenez là où vous vous êtes arrêté"   |
| J+3   | 72h après vérification  | `nurturing_step2` | "Une question sur FleetCore ?"           |
| J+7   | 168h après vérification | `nurturing_step3` | "Dernière chance de réserver votre démo" |
| J+7+  | Après J+7 sans action   | Archive           | → Newsletter mensuelle si optin          |

### 6.3 Contenu emails

**Email J+1** :

```
Objet: Reprenez là où vous vous êtes arrêté

Bonjour,

Vous avez commencé à réserver une démo FleetCore mais n'avez pas terminé.

[Reprendre ma demande de démo] ← Lien avec resume_token

À bientôt,
L'équipe FleetCore
```

**Email J+3** :

```
Objet: Une question sur FleetCore ?

Bonjour,

Vous avez montré de l'intérêt pour FleetCore.
Avez-vous des questions avant de réserver votre démo ?

[Réserver ma démo] ← Lien avec resume_token
[Répondre à cet email] ← Pour poser une question

À bientôt,
L'équipe FleetCore
```

**Email J+7** :

```
Objet: Dernière chance de réserver votre démo

Bonjour,

C'est votre dernière chance de réserver une démo personnalisée FleetCore.

[Réserver maintenant] ← Lien avec resume_token

Si vous n'êtes plus intéressé, nous comprenons.
Vous pouvez vous désinscrire ci-dessous.

À bientôt,
L'équipe FleetCore
```

### 6.4 Token de reprise

```typescript
// Génération
const resumeToken = crypto.randomBytes(32).toString("base64url");
const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 jours

// URL de reprise
const resumeUrl = `${baseUrl}/${locale}/book-demo/resume?token=${resumeToken}`;
```

### 6.5 Route de reprise

**URL** : `/{locale}/book-demo/resume?token=xxx`

**Comportement** :

1. Valider token (existe, non expiré)
2. Si prospect existe → Redirect Step 3 (profil)
3. Si converti en lead → Redirect Step 4 (booking)
4. Si token invalide → Redirect Step 1 avec message

### 6.6 Cron nurturing

**Route** : `GET /api/cron/nurturing/prospects`

**Fréquence** : Toutes les heures

**Logique** :

```typescript
// 1. Trouver prospects éligibles J+1
const j1Prospects = await prisma.crm_prospects.findMany({
  where: {
    nurturing_step: 0,
    email_verified_at: { lte: subHours(new Date(), 24) },
    archived_at: null,
    converted_to_lead_id: null,
  },
});

// 2. Envoyer emails et mettre à jour
for (const prospect of j1Prospects) {
  await sendNurturingEmail(prospect, "step1");
  await prisma.crm_prospects.update({
    where: { id: prospect.id },
    data: {
      nurturing_step: 1,
      last_nurturing_at: new Date(),
    },
  });
}

// Répéter pour J+3 et J+7...
```

---

## 7. DISQUALIFICATION

### 7.1 Workflow

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Lead Kanban    │────▶│  Disqualifier   │────▶│  Confirmation   │
│                 │     │  (modal)        │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                               │
                               ▼
                        ┌─────────────────┐
                        │ crm_blacklist   │
                        │ (email bloqué)  │
                        └─────────────────┘
```

### 7.2 Modal disqualification

```
┌─────────────────────────────────────────┐
│         Disqualifier ce lead            │
├─────────────────────────────────────────┤
│                                         │
│  Raison * (obligatoire)                 │
│  ┌─────────────────────────────────┐    │
│  │ ▼ Sélectionner une raison       │    │
│  ├─────────────────────────────────┤    │
│  │ Email fantaisiste               │    │
│  │ Concurrent                      │    │
│  │ Aucune réponse (5 jours)        │    │
│  │ Hors marché cible               │    │
│  │ Étudiant / Test                 │    │
│  │ Doublon                         │    │
│  │ Autre...                        │    │
│  └─────────────────────────────────┘    │
│                                         │
│  Commentaire (requis si "Autre")        │
│  ┌─────────────────────────────────┐    │
│  │                                 │    │
│  └─────────────────────────────────┘    │
│                                         │
│  ☑ Bloquer cet email (blacklist)        │
│                                         │
│  ┌───────────┐  ┌───────────────────┐   │
│  │  Annuler  │  │   Disqualifier    │   │
│  └───────────┘  └───────────────────┘   │
│                                         │
└─────────────────────────────────────────┘
```

### 7.3 API disqualification

**Route** : `POST /api/crm/leads/[id]/disqualify`

```typescript
// Request
{
  reason: 'fantasy_email' | 'competitor' | 'no_response' | 'wrong_market' | 'student_test' | 'duplicate' | 'other',
  comment?: string,  // Requis si reason === 'other'
  blacklist: boolean // true par défaut
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

### 7.4 Vérification blacklist

**Route modifiée** : `GET /api/crm/leads/check-email?email=xxx`

```typescript
// Response si blacklisté
{
  exists: false,
  blacklisted: true,
  message: "Cette adresse email n'est pas éligible"
}
```

---

## 8. ROUTES API V6.6

### 8.1 Nouvelles routes

| Route                                  | Méthode | Description                |
| -------------------------------------- | ------- | -------------------------- |
| `/api/crm/leads/[id]/complete-profile` | PATCH   | Compléter profil (Step 3)  |
| `/api/crm/leads/[id]/request-callback` | POST    | Demander callback (Step 4) |
| `/api/crm/leads/[id]/disqualify`       | POST    | Disqualifier + blacklist   |
| `/api/crm/prospects/resume`            | GET     | Reprendre wizard via token |
| `/api/cron/nurturing/prospects`        | GET     | Cron nurturing J+1/J+3/J+7 |

### 8.2 Routes modifiées

| Route                        | Modification                         |
| ---------------------------- | ------------------------------------ |
| `/api/crm/leads/check-email` | +Vérification blacklist              |
| `/api/crm/demo-leads`        | +Création prospect si abandon Step 2 |

### 8.3 Signatures détaillées

#### PATCH /api/crm/leads/[id]/complete-profile

```typescript
// Request body
{
  first_name: string,
  last_name: string,
  phone: string,
  company_name: string,
  fleet_size_range: string,
  gdpr_consent?: boolean,
  gdpr_consent_text?: string
}

// Response
{
  success: true,
  data: {
    leadId: string,
    status: 'email_verified',  // Reste email_verified jusqu'au booking/callback
    profile_completed: true
  }
}
```

#### POST /api/crm/leads/[id]/request-callback

```typescript
// Request body (vide ou avec notes optionnelles)
{
  notes?: string  // Notes optionnelles du prospect
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
  reason: DisqualificationReason,
  comment?: string,
  blacklist?: boolean  // default: true
}

// Response
{
  success: true,
  data: {
    leadId: string,
    status: 'disqualified',
    blacklisted: boolean,
    blacklist_id?: string
  }
}
```

#### GET /api/crm/prospects/resume?token=xxx

```typescript
// Response success
{
  success: true,
  data: {
    prospect_id: string,
    email: string,
    redirect_to: '/fr/book-demo/step-3?leadId=xxx'
  }
}

// Response error (token invalide)
{
  success: false,
  error: 'INVALID_TOKEN',
  message: 'Ce lien a expiré'
}
```

---

## 9. SERVICES V6.6

### 9.1 Nouveaux services

```
lib/services/crm/
├── wizard-lead.service.ts        ← Modifié (nouveau flow)
├── email-verification.service.ts ← Inchangé
├── prospect.service.ts           ← NOUVEAU
├── nurturing.service.ts          ← NOUVEAU
├── blacklist.service.ts          ← NOUVEAU
└── notification-queue.service.ts ← Modifié (templates nurturing)
```

### 9.2 ProspectService (NOUVEAU)

```typescript
class ProspectService {
  // Création
  async createProspect(params: CreateProspectParams): Promise<crm_prospects>;

  // Recherche
  async findByEmail(
    email: string,
    providerId: string
  ): Promise<crm_prospects | null>;
  async findByResumeToken(token: string): Promise<crm_prospects | null>;

  // Conversion
  async convertToLead(prospectId: string, leadId: string): Promise<void>;

  // Archivage
  async archive(prospectId: string): Promise<void>;

  // Token
  async generateResumeToken(prospectId: string): Promise<string>;
  async validateResumeToken(token: string): Promise<ValidateTokenResult>;
}
```

### 9.3 NurturingService (NOUVEAU)

```typescript
class NurturingService {
  // Récupérer prospects éligibles
  async getProspectsForStep(step: 1 | 2 | 3): Promise<crm_prospects[]>;

  // Envoyer email nurturing
  async sendNurturingEmail(
    prospect: crm_prospects,
    step: 1 | 2 | 3
  ): Promise<void>;

  // Mettre à jour après envoi
  async markNurturingSent(prospectId: string, step: 1 | 2 | 3): Promise<void>;

  // Tracker clic
  async trackNurturingClick(prospectId: string): Promise<void>;

  // Archiver après J+7
  async archiveExpiredProspects(): Promise<number>;
}
```

### 9.4 BlacklistService (NOUVEAU)

```typescript
class BlacklistService {
  // Vérifier si blacklisté
  async isBlacklisted(email: string, providerId: string): Promise<boolean>;

  // Ajouter au blacklist
  async addToBlacklist(params: AddToBlacklistParams): Promise<crm_blacklist>;

  // Retirer du blacklist (admin only)
  async removeFromBlacklist(email: string, providerId: string): Promise<void>;

  // Lister (admin)
  async listBlacklist(
    providerId: string,
    pagination: Pagination
  ): Promise<PaginatedResult<crm_blacklist>>;
}
```

---

## 10. TEMPLATES EMAIL NURTURING

### 10.1 Configuration Resend

```typescript
// lib/email/templates/nurturing/
├── step1.tsx    // J+1 : "Reprenez là où vous vous êtes arrêté"
├── step2.tsx    // J+3 : "Une question sur FleetCore ?"
├── step3.tsx    // J+7 : "Dernière chance"
└── index.ts     // Export
```

### 10.2 Variables communes

```typescript
interface NurturingEmailVars {
  resumeUrl: string; // URL avec token
  email: string; // Email prospect
  locale: "fr" | "en"; // Langue
  unsubscribeUrl: string; // Lien désinscription
}
```

---

## 11. RÈGLES DE GESTION V6.6

| #   | Règle                                   | Implémentation                       |
| --- | --------------------------------------- | ------------------------------------ |
| 1   | Profil AVANT booking                    | Step 3 = profil, Step 4 = Cal.com    |
| 2   | Prospect ≠ Lead                         | `crm_prospects` vs `crm_leads`       |
| 3   | Nurturing auto J+1, J+3, J+7            | Cron `/api/cron/nurturing/prospects` |
| 4   | Token reprise 30 jours                  | `resume_token_expires_at`            |
| 5   | Blacklist obligatoire si disqualifié    | Modal avec checkbox pré-cochée       |
| 6   | Raison disqualification obligatoire     | Dropdown 7 options                   |
| 7   | Commentaire si raison "other"           | Validation frontend + backend        |
| 8   | Callback = rappel "meilleurs délais"    | Pas de promesse "48h"                |
| 9   | Lead Kanban = profil complet uniquement | Pas de `email_verified` dans Kanban  |
| 10  | Archive J+7 → Newsletter                | Si optin GDPR uniquement             |

---

## 12. MIGRATION V6.5.1 → V6.6

### 12.1 Scripts SQL

```sql
-- 1. Créer table crm_prospects
-- (voir section 2.2)

-- 2. Créer table crm_blacklist
-- (voir section 2.3)

-- 3. Créer enum disqualification_reason
-- (voir section 2.5)

-- 4. Ajouter colonnes crm_leads
ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS callback_requested BOOLEAN DEFAULT FALSE;
ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS callback_requested_at TIMESTAMPTZ;
ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS callback_completed_at TIMESTAMPTZ;
ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS callback_notes TEXT;
ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS disqualified_at TIMESTAMPTZ;
ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS disqualification_reason VARCHAR(50);
ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS disqualification_comment TEXT;
ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS disqualified_by UUID REFERENCES dir_users(id);
ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS interest_notification_sent_at TIMESTAMPTZ;
ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS interest_notification_clicked_at TIMESTAMPTZ;

-- 5. Ajouter nouveaux statuts
ALTER TYPE crm_lead_status ADD VALUE IF NOT EXISTS 'email_verified';
ALTER TYPE crm_lead_status ADD VALUE IF NOT EXISTS 'callback_requested';

-- 6. Index performance
CREATE INDEX IF NOT EXISTS idx_leads_callback ON crm_leads(callback_requested, callback_requested_at)
WHERE callback_requested = true;
CREATE INDEX IF NOT EXISTS idx_leads_disqualified ON crm_leads(status)
WHERE status = 'disqualified';
```

### 12.2 Migration données existantes

```sql
-- Leads avec email vérifié mais sans booking → status email_verified
UPDATE crm_leads
SET status = 'email_verified'
WHERE email_verified_at IS NOT NULL
  AND booking_slot_at IS NULL
  AND status = 'new';
```

---

## 13. TESTS V6.6

### 13.1 Nouveaux tests requis

| Service                     | Tests  | Couverture                 |
| --------------------------- | ------ | -------------------------- |
| ProspectService             | 15     | CRUD + conversion + token  |
| NurturingService            | 12     | Séquence + envoi + archive |
| BlacklistService            | 8      | Check + add + remove       |
| WizardLeadService (modifié) | +5     | Nouveau flow               |
| **Total nouveaux**          | **40** |                            |

### 13.2 Tests E2E

| Scénario              | Étapes                                         |
| --------------------- | ---------------------------------------------- |
| Flow complet booking  | Step 1 → 2 → 3 → 4 (Cal.com) → Confirmation    |
| Flow complet callback | Step 1 → 2 → 3 → 4 (checkbox) → Kanban         |
| Abandon après Step 2  | Verify → Abandon → Nurturing J+1 → Reprise     |
| Disqualification      | Kanban → Modal → Blacklist → Step 1 bloqué     |
| Reprise token expiré  | Email nurturing → Clic après 31 jours → Erreur |

---

## 14. CHECKLIST VALIDATION V6.6

### Base de données

- [ ] Table `crm_prospects` créée
- [ ] Table `crm_blacklist` créée
- [ ] Enum `disqualification_reason` créé
- [ ] Colonnes `crm_leads` ajoutées
- [ ] Statuts `email_verified` et `callback_requested` ajoutés
- [ ] Index créés

### Routes API

- [ ] `PATCH /api/crm/leads/[id]/complete-profile` implémentée
- [ ] `POST /api/crm/leads/[id]/request-callback` implémentée
- [ ] `POST /api/crm/leads/[id]/disqualify` implémentée
- [ ] `GET /api/crm/prospects/resume` implémentée
- [ ] `GET /api/cron/nurturing/prospects` implémentée
- [ ] `GET /api/crm/leads/check-email` modifiée (blacklist)

### Services

- [ ] ProspectService créé
- [ ] NurturingService créé
- [ ] BlacklistService créé
- [ ] WizardLeadService modifié

### Frontend

- [ ] Step 3 (profil) redesigné
- [ ] Step 4 (booking + callback) créé
- [ ] Modal disqualification créée
- [ ] Page resume créée
- [ ] Kanban 4 colonnes

### Templates email

- [ ] Template nurturing J+1
- [ ] Template nurturing J+3
- [ ] Template nurturing J+7

### Tests

- [ ] 40 nouveaux tests services
- [ ] Tests E2E flow complet
- [ ] TypeScript 0 erreurs
- [ ] Build succès

---

## HISTORIQUE DES VERSIONS

| Version  | Date           | Changements                                                    |
| -------- | -------------- | -------------------------------------------------------------- |
| V6.4     | 2026-01        | Spec initiale                                                  |
| V6.5     | 2026-02-08     | Corrections audit code                                         |
| V6.5.1   | 2026-02-08     | Remédiation dead code                                          |
| **V6.6** | **2026-02-08** | Architecture nurturing, nouveau flow wizard, Kanban 4 colonnes |

---

_Document généré par Claude Senior - Architecture nurturing complète_
