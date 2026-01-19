# FLEETCORE - SPÉCIFICATION CRM V6.4 FINALE

## ARCHITECTURE WIZARD 5 ÉTAPES + EMAIL VERIFICATION + WAITLIST + SHORT URLs

**Version :** 6.4.0
**Date :** 20 Janvier 2026
**Statut :** SPÉCIFICATION CONSOLIDÉE - VALIDÉE
**Auteur :** Mohamed Fodil (CEO FleetCore)

---

## ⚠️ AVERTISSEMENTS

### Documents remplacés

Ce document **REMPLACE INTÉGRALEMENT** :

- FLEETCORE_CRM_SPECIFICATION_V6_3_FINAL.md ❌
- FLEETCORE_CRM_SPECIFICATION_V6_2_1_FINAL.md ❌
- FLEETCORE_CRM_SPECIFICATION_V6_2_FINAL.md ❌
- Tout document antérieur sur le CRM ❌

### Changements majeurs V6.3 → V6.4

| Élément | V6.3 (OBSOLÈTE) | V6.4 (ACTUEL) |
|---------|-----------------|---------------|
| **Wizard Steps** | 3 étapes | **5 étapes** (incl. email verification) |
| **Email Verification** | Non documenté | **Step 1b: Code 6 chiffres** |
| **Waitlist** | Non documenté | **Table crm_waitlist + Survey** |
| **Short URLs** | Non documenté | **iOS Mail compatible (~31 chars)** |
| **J-1 Reminder** | Basique | **Confirm/Reschedule buttons + short tokens** |
| **Reschedule** | Non documenté | **Page dédiée avec Cal.com iframe** |
| **Fleet Size** | Step 1 | **Step 3** (après booking) |

### Principe CARDINAL

**ZERO HARDCODING** - Toutes les règles métier dans tables settings (crm_settings, bil_settings, adm_settings)

---

## TABLE DES MATIÈRES

1. [Résumé Exécutif](#1-résumé-exécutif)
2. [Architecture Modules](#2-architecture-modules)
3. [Les 8 Statuts Lead V6.4](#3-les-8-statuts-lead-v64)
4. [Les 4 Phases Kanban V6.4](#4-les-4-phases-kanban-v64)
5. [UX/Frontend: Wizard 5 Étapes](#5-uxfrontend-wizard-5-étapes)
6. [Email Verification System](#6-email-verification-system)
7. [Intégration Cal.com](#7-intégration-calcom)
8. [Email J-1 Anti No-Show](#8-email-j-1-anti-no-show)
9. [Waitlist System](#9-waitlist-system)
10. [Short URL System (iOS Mail)](#10-short-url-system-ios-mail)
11. [Schema Database crm_leads](#11-schema-database-crm_leads)
12. [Schema Database crm_waitlist](#12-schema-database-crm_waitlist)
13. [Schema Database crm_countries](#13-schema-database-crm_countries)
14. [API Routes Publiques](#14-api-routes-publiques)
15. [Email Templates](#15-email-templates)
16. [Services Backend](#16-services-backend)
17. [Processus Appel Commercial](#17-processus-appel-commercial-one-call-close)
18. [Framework Qualification CPT](#18-framework-qualification-cpt)
19. [Flux Lead-to-Client (Stripe)](#19-flux-lead-to-client-stripe-payment-flow)
20. [GDPR Compliance](#20-gdpr-compliance)
21. [Pages Frontend](#21-pages-frontend)
22. [Notifications & Emails](#22-notifications--emails)
23. [Métriques et KPIs](#23-métriques-et-kpis)
24. [Règles de Gestion Verrouillées](#24-règles-de-gestion-verrouillées)

---

## 1. RÉSUMÉ EXÉCUTIF

### 1.1 Philosophie One-Call Close

> **RÈGLE FONDAMENTALE :**
> "L'appel n'est PAS un appel de qualification suivi d'une demo séparée.
> C'est **UN SEUL appel** où on qualifie, on démontre, et on close."

### 1.2 Wizard Multi-Step avec Email Verification

Le wizard Book Demo est composé de **5 étapes** avec **email verification obligatoire** :

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    WIZARD BOOK DEMO - 5 ÉTAPES V6.4                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  STEP 1: EMAIL + COUNTRY                                                    │
│  /book-demo                                                                 │
│  ├─ Email (required)                                                        │
│  ├─ Country selector (30 pays, database-driven)                            │
│  └─ GDPR consent checkbox (conditionnel si pays EU/EEA)                    │
│           │                                                                 │
│           ▼                                                                 │
│  STEP 1B: EMAIL VERIFICATION                                                │
│  /book-demo/verify                                                          │
│  ├─ Input 6 chiffres                                                        │
│  ├─ Timer 60s resend                                                        │
│  ├─ Max 5 tentatives                                                        │
│  └─ Expiration 15 min                                                       │
│           │                                                                 │
│           ├─── [Pays NON opérationnel] ───► WAITLIST                        │
│           │                                 /book-demo/coming-soon          │
│           │                                 └─ Inscription waitlist         │
│           │                                                                 │
│           ▼ [Pays opérationnel]                                             │
│  STEP 2: CALENDRIER CAL.COM                                                 │
│  /book-demo/step-2                                                          │
│  └─ Cal.com embed (sélection créneau)                                       │
│           │                                                                 │
│           ▼                                                                 │
│  STEP 3: INFORMATIONS BUSINESS                                              │
│  /book-demo/step-3                                                          │
│  ├─ First name, Last name                                                   │
│  ├─ Company name                                                            │
│  ├─ Phone (E.164 format)                                                    │
│  ├─ Fleet size selector (database-driven)                                   │
│  ├─ Platforms used (multi-select: Uber, Bolt, Heetch, Careem...)           │
│  └─ Message (optional)                                                      │
│           │                                                                 │
│           ▼                                                                 │
│  CONFIRMATION                                                               │
│  /book-demo/confirmation                                                    │
│  ├─ Récapitulatif RDV (date, heure, téléphone)                             │
│  ├─ Add to Calendar links                                                   │
│  └─ Lien Reschedule/Cancel                                                  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1.3 Données factuelles justifiant le Wizard

| Source | Donnée | Impact V6.4 |
|--------|--------|-------------|
| **HubSpot** | Multi-step forms = +86% conversion | Wizard 5 étapes |
| **Venture Harbour** | Form multi-step = 0.96% → 8.1% (+743%) | Wizard progressif |
| **Chili Piper** | Calendrier intégré = 30% → 66.7% | Cal.com embed étape 2 |
| **Chili Piper** | Réponse < 1 min = +391% conversion | Appel à l'heure exacte |
| **Formstack** | Téléphone early = -48% conversion | Téléphone étape 3 |
| **Email Verification** | Réduit spam de 95% | Code 6 chiffres obligatoire |

---

## 2. ARCHITECTURE MODULES

### 2.1 Vue d'ensemble

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                         ARCHITECTURE V6.4 FINAL                              │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │                  MODULE CRM (Acquisition)                               │ │
│  │  ───────────────────────────────────────────────────────────────────── │ │
│  │  crm_leads (8 statuts) ───→ crm_quotes (Segment 4) ───→ crm_orders     │ │
│  │  crm_waitlist (pays non opérationnels)                                 │ │
│  │                                                                        │ │
│  │  Tables : crm_leads, crm_waitlist, crm_quotes, crm_quote_items,       │ │
│  │           crm_orders, crm_activities, crm_lead_sources, crm_countries,│ │
│  │           crm_settings, crm_referrals, crm_lead_activities            │ │
│  └────────────────────────────────┬────────────────────────────────────────┘ │
│                                   │                                          │
│                                   ▼ Conversion (status = converted)          │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │                   MODULE CLT (Client)                                   │ │
│  │  ───────────────────────────────────────────────────────────────────── │ │
│  │  clt_masterdata ←── Données Lead + lead_code historique               │ │
│  │  clt_members    ←── Utilisateurs client                               │ │
│  │  clt_invoices   ←── Factures client                                   │ │
│  │  clt_subscriptions ←── Abonnements                                    │ │
│  └────────────────────────────────┬────────────────────────────────────────┘ │
│                                   │                                          │
│                                   ▼ Lien technique                           │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │                   MODULE ADM (Tenant)                                   │ │
│  │  ───────────────────────────────────────────────────────────────────── │ │
│  │  adm_tenants = Liaison tenant/client/Clerk + config technique         │ │
│  │  adm_providers, adm_provider_employees, adm_roles, adm_settings...    │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Séparation des responsabilités

| Module | Responsabilité | Tables principales |
|--------|---------------|-------------------|
| **CRM** | Acquisition prospects → clients | crm_leads, crm_waitlist, crm_quotes, crm_activities |
| **CLT** | Gestion compte client | clt_masterdata, clt_members, clt_invoices |
| **ADM** | Infrastructure technique tenant | adm_tenants, adm_providers, adm_roles |

---

## 3. LES 8 STATUTS LEAD V6.4

### 3.1 Vue d'ensemble

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                         8 STATUTS LEAD V6.4                                  │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │                     PHASE: INCOMPLET                                    │ │
│  ├─────────────────────────────────────────────────────────────────────────┤ │
│  │  new              Email vérifié, wizard PAS terminé      [Wizard]       │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                    │                                         │
│                                    ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │                     PHASE: DÉMO                                         │ │
│  ├─────────────────────────────────────────────────────────────────────────┤ │
│  │  demo             Wizard terminé, RDV booké, attente     [Cal.com]      │ │
│  │                   appel commercial                                      │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                    │                                         │
│                                    ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │                     PHASE: PROPOSITION                                  │ │
│  ├─────────────────────────────────────────────────────────────────────────┤ │
│  │  proposal_sent    Lien paiement Stripe généré            [Commercial]   │ │
│  │  payment_pending  Lien envoyé, attente paiement          [Stripe]       │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                    │                                         │
│                                    ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │                     PHASE: TERMINÉ                                      │ │
│  ├─────────────────────────────────────────────────────────────────────────┤ │
│  │  converted        Paiement reçu, tenant créé ✓           [Stripe]       │ │
│  │  lost             Perdu (raison obligatoire)             [Commercial]   │ │
│  │  nurturing        En nurturing (timing pas bon)          [Commercial]   │ │
│  │  disqualified     Hors cible / Red flag                  [Commercial]   │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Détail des 8 statuts

| Statut | Phase | Description | Déclencheur | Probabilité |
|--------|-------|-------------|-------------|-------------|
| `new` | Incomplet | Email vérifié, wizard pas terminé | Wizard étape 1b (verification) | 5% |
| `demo` | Démo | Wizard terminé, RDV booké | Webhook Cal.com + Step 3 complété | 50% |
| `proposal_sent` | Proposition | Lien paiement Stripe généré | Commercial post-appel | 85% |
| `payment_pending` | Proposition | Lien envoyé, attente paiement | Commercial | 90% |
| `converted` | Terminé | Paiement reçu, tenant créé | Stripe webhook | 100% |
| `lost` | Terminé | Perdu définitivement | Commercial | 0% |
| `nurturing` | Terminé | Timing pas bon, relance programmée | Commercial | 15% |
| `disqualified` | Terminé | Hors cible / Red flag | Commercial | 0% |

### 3.3 Transitions autorisées

```
new → demo                        (Webhook Cal.com BOOKING_CREATED + wizard_completed = true)
new → nurturing                   (Système: wizard incomplet après J+7 OU pays non couvert)
new → disqualified                (Commercial: spam, faux, test, doublon)

demo → proposal_sent              (Commercial: appel OK, génère lien paiement)
demo → nurturing                  (Commercial: pas maintenant + dropdown raison)
demo → lost                       (Commercial: KO + dropdown raison)
demo → disqualified               (Commercial: hors cible découvert pendant appel)

proposal_sent → payment_pending   (Système: lien cliqué ou rappel envoyé)
proposal_sent → lost              (Commercial: abandon, pas de réponse)
proposal_sent → nurturing         (Commercial: demande délai supplémentaire)

payment_pending → converted       (Stripe webhook checkout.session.completed - AUTOMATIQUE)
payment_pending → lost            (Système: expiration lien sans paiement)

nurturing → demo                  (Lead clique "Book Demo" dans email nurturing)
nurturing → proposal_sent         (Lead contacte commercial, prêt à acheter)
nurturing → lost                  (Lead demande désinscription)

lost → nurturing                  (Commercial: recovery possible après analyse)

converted → (terminal)
disqualified → (terminal)
```

---

## 4. LES 4 PHASES KANBAN V6.4

### 4.1 Vue Kanban

```
┌────────────────┬────────────────┬────────────────┬────────────────┐
│   INCOMPLET    │     DÉMO       │  PROPOSITION   │    TERMINÉ     │
│   (Phase 1)    │   (Phase 2)    │   (Phase 3)    │   (Phase 4)    │
├────────────────┼────────────────┼────────────────┼────────────────┤
│                │                │                │                │
│  ┌──────────┐  │  ┌──────────┐  │  ┌──────────┐  │  ┌──────────┐  │
│  │   new    │  │  │   demo   │  │  │ proposal │  │  │converted │  │
│  │  badge   │  │  │  badge   │  │  │   sent   │  │  │  ✓ vert  │  │
│  │  gris    │  │  │  bleu    │  │  │  orange  │  │  └──────────┘  │
│  └──────────┘  │  └──────────┘  │  └──────────┘  │                │
│                │                │                │  ┌──────────┐  │
│                │                │  ┌──────────┐  │  │   lost   │  │
│                │                │  │ payment  │  │  │  rouge   │  │
│                │                │  │ pending  │  │  └──────────┘  │
│                │                │  │  jaune   │  │                │
│                │                │  └──────────┘  │  ┌──────────┐  │
│                │                │                │  │nurturing │  │
│                │                │                │  │  violet  │  │
│                │                │                │  └──────────┘  │
│                │                │                │                │
│                │                │                │  ┌──────────┐  │
│                │                │                │  │disqualif.│  │
│                │                │                │  │  noir    │  │
│                │                │                │  └──────────┘  │
│                │                │                │                │
├────────────────┼────────────────┼────────────────┼────────────────┤
│  Wizard        │  Attente       │  Post-appel    │  Issue         │
│  pas fini      │  appel         │  OK            │  finale        │
└────────────────┴────────────────┴────────────────┴────────────────┘
```

### 4.2 Couleurs des badges statut

| Statut | Couleur | Hex | Signification |
|--------|---------|-----|---------------|
| `new` | Gris | `#6B7280` | En attente action |
| `demo` | Bleu | `#3B82F6` | Actif, RDV planifié |
| `proposal_sent` | Orange | `#F97316` | Proposition envoyée |
| `payment_pending` | Jaune | `#EAB308` | Attente paiement |
| `converted` | Vert | `#22C55E` | Succès ✓ |
| `lost` | Rouge | `#EF4444` | Perdu |
| `nurturing` | Violet | `#8B5CF6` | À recontacter |
| `disqualified` | Noir | `#1F2937` | Hors cible |

---

## 5. UX/FRONTEND: WIZARD 5 ÉTAPES

### 5.1 Step 1: Email + Country

**Route**: `/[locale]/(public)/book-demo/page.tsx`

**Champs**:
- `email` (required) - Input email standard
- `country_code` (required) - Select avec 30 pays (database-driven depuis `crm_countries`)
- `gdpr_consent` (conditional) - Checkbox affiché uniquement si `country_gdpr = true`

**Comportement**:
1. User entre email + sélectionne pays
2. Si pays GDPR (EU/EEA), checkbox consent apparaît
3. Submit → POST `/api/demo-leads` mode `wizard_step1`
4. Backend crée lead avec `email_verified = false`
5. Backend envoie email avec code 6 chiffres
6. Redirect vers `/book-demo/verify`

**État stocké**: `sessionStorage.wizardEmail`, `sessionStorage.wizardCountry`

### 5.2 Step 1b: Email Verification

**Route**: `/[locale]/(public)/book-demo/verify/page.tsx`

**UI**:
```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│                   📧 Verify Your Email                          │
│                                                                 │
│     We've sent a 6-digit code to user@example.com              │
│                                                                 │
│     ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐           │
│     │  1  │ │  2  │ │  3  │ │  4  │ │  5  │ │  6  │           │
│     └─────┘ └─────┘ └─────┘ └─────┘ └─────┘ └─────┘           │
│                                                                 │
│     [       Verify Code       ]                                 │
│                                                                 │
│     Didn't receive? Resend in 45s                              │
│     Or [Resend Code] (après 60s)                               │
│                                                                 │
│     4 attempts remaining                                        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Logique**:
- 6 inputs individuels avec auto-focus
- Timer 60s avant possibilité resend
- Max 5 tentatives (après = locked)
- Expiration code: 15 minutes
- Submit → POST `/api/crm/leads/verify-email`

**Post-verification**:
- Si `country.is_operational = true` → Redirect `/book-demo/step-2`
- Si `country.is_operational = false` → Redirect `/book-demo/coming-soon` (waitlist)

### 5.3 Step 2: Calendrier Cal.com

**Route**: `/[locale]/(public)/book-demo/step-2/page.tsx`

**Composant**: Cal.com embed iframe

**Configuration Cal.com**:
- Event Type: "FleetCore Demo Call"
- Duration: 30 minutes
- Buffer before: 5 minutes
- Buffer after: 10 minutes
- Minimum notice: 4 hours

**Métadonnées passées**:
- `leadId` (caché)
- `email` (pré-rempli)
- `name` (si déjà connu)

**Webhook Cal.com**:
- `BOOKING_CREATED` → Update lead avec `booking_calcom_uid`, `booking_slot_at`
- Redirect automatique vers Step 3

### 5.4 Step 3: Informations Business

**Route**: `/[locale]/(public)/book-demo/step-3/page.tsx`

**Champs**:
| Champ | Type | Required | Validation |
|-------|------|----------|------------|
| `first_name` | text | ✅ | Min 2 chars, no digits |
| `last_name` | text | ✅ | Min 2 chars, no digits |
| `company_name` | text | ✅ | Min 2 chars |
| `phone` | tel | ✅ | E.164 format avec country code |
| `fleet_size` | select | ✅ | Options depuis `/api/public/fleet-size-options` |
| `platforms_used` | multi-select | ❌ | Array [Uber, Bolt, Heetch, Careem, FreeNow, Other] |
| `message` | textarea | ❌ | Max 1000 chars |

**Phone Input**:
- Formatage automatique selon pays
- Validation E.164 internationale
- Pattern affiché selon country_code

**Fleet Size Options** (database-driven):
```json
[
  {"value": "1", "label": "1 vehicle"},
  {"value": "2-5", "label": "2-5 vehicles"},
  {"value": "6-10", "label": "6-10 vehicles"},
  {"value": "11-20", "label": "11-20 vehicles"},
  {"value": "21-50", "label": "21-50 vehicles"},
  {"value": "51-100", "label": "51-100 vehicles"},
  {"value": "100+", "label": "100+ vehicles"}
]
```

**Submit**:
- PATCH `/api/crm/leads/[id]/complete-wizard`
- Met à jour lead avec toutes les infos
- Set `wizard_completed = true`
- Redirect vers `/book-demo/confirmation`

### 5.5 Confirmation Page

**Route**: `/[locale]/(public)/book-demo/confirmation/page.tsx`

**Contenu**:
```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│                   ✅ Demo Booked Successfully!                  │
│                                                                 │
│     ┌─────────────────────────────────────────────────────────┐ │
│     │  📅 Wednesday, January 22, 2026                         │ │
│     │  🕐 2:00 PM (Europe/Paris)                              │ │
│     │  📱 +33 6 12 34 56 78                                   │ │
│     │  👤 Jean-Pierre Martin                                  │ │
│     └─────────────────────────────────────────────────────────┘ │
│                                                                 │
│     We'll call you at the scheduled time.                      │
│                                                                 │
│     ┌─────────────────┐  ┌─────────────────┐                   │
│     │ Add to Google   │  │ Add to Apple    │                   │
│     │ Calendar        │  │ Calendar        │                   │
│     └─────────────────┘  └─────────────────┘                   │
│                                                                 │
│     Need to change? [Reschedule] or [Cancel]                   │
│                                                                 │
│     [← Back to Homepage]                                        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 5.6 Reschedule Page

**Route**: `/[locale]/(public)/book-demo/reschedule/page.tsx`

**Modes d'accès**:
1. Via token court (depuis email J-1): `/book-demo/reschedule?t={short_token}`
2. Via lien direct Cal.com: `/book-demo/reschedule?uid={calcom_uid}`

**Contenu**:
- Cal.com reschedule iframe
- Pré-rempli avec booking actuel
- Webhook `BOOKING_RESCHEDULED` met à jour `booking_slot_at`

---

## 6. EMAIL VERIFICATION SYSTEM

### 6.1 Architecture

**Service**: `lib/services/crm/email-verification.service.ts`

**Constantes**:
```typescript
const CODE_LENGTH = 6;              // 6 digits
const BCRYPT_COST = 10;             // bcrypt rounds
const CODE_EXPIRATION_MINUTES = 15; // 15 min expiry
const RESEND_COOLDOWN_SECONDS = 60; // 60s between resends
const MAX_VERIFICATION_ATTEMPTS = 5; // Max attempts before lockout
```

### 6.2 Génération de code

```typescript
// Crypto-secure random generation
import { randomInt } from "crypto";

generateCode(): string {
  const code = randomInt(0, 1000000);
  return code.toString().padStart(6, "0"); // e.g., "012345"
}
```

### 6.3 Stockage

Le code est hashé avec bcrypt avant stockage en DB:

```typescript
// Hash before storage
const hashedCode = await bcrypt.hash(plainCode, BCRYPT_COST);

// Store in crm_leads
await prisma.crm_leads.update({
  where: { id: leadId },
  data: {
    email_verification_code: hashedCode,
    email_verification_expires_at: expiresAt, // NOW + 15 min
    email_verification_attempts: 0
  }
});
```

### 6.4 Vérification

```typescript
async verifyCode(email: string, code: string): Promise<VerifyCodeResult> {
  // 1. Find lead
  const lead = await findLead(email);

  // 2. Check if already verified
  if (lead.email_verified) return { success: true };

  // 3. Check max attempts
  if (lead.email_verification_attempts >= 5) {
    return { error: "max_attempts_exceeded", locked: true };
  }

  // 4. Check expiration
  if (new Date() > lead.email_verification_expires_at) {
    return { error: "code_expired" };
  }

  // 5. Compare with bcrypt
  const isValid = await bcrypt.compare(code, lead.email_verification_code);

  if (!isValid) {
    // Increment attempts
    await incrementAttempts(lead.id);
    return { error: "invalid_code", attemptsRemaining: 5 - attempts - 1 };
  }

  // 6. Success - mark verified
  await markVerified(lead.id);
  return { success: true };
}
```

### 6.5 Rate Limiting Resend

```typescript
async canResendCode(email: string): Promise<ResendCheckResult> {
  const lead = await findLead(email);

  // Calculate when code was sent
  const expiresAt = lead.email_verification_expires_at;
  const sentAt = new Date(expiresAt.getTime() - 15 * 60 * 1000);

  // Check 60s cooldown
  const cooldownEnds = new Date(sentAt.getTime() + 60 * 1000);

  if (new Date() < cooldownEnds) {
    const waitSeconds = Math.ceil((cooldownEnds.getTime() - Date.now()) / 1000);
    return { canResend: false, waitSeconds };
  }

  return { canResend: true };
}
```

---

## 7. INTÉGRATION CAL.COM

### 7.1 Configuration

| Paramètre | Valeur |
|-----------|--------|
| **Plan** | Free ($0/mois) |
| **Commerciaux** | 1 au démarrage |
| **Event Type** | "FleetCore Demo Call" |
| **Duration** | 30 minutes |
| **Buffer before** | 5 minutes |
| **Buffer after** | 10 minutes |
| **Minimum notice** | 4 hours |

### 7.2 Webhooks Cal.com

| Event | Endpoint | Action |
|-------|----------|--------|
| `BOOKING_CREATED` | `POST /api/crm/webhooks/calcom` | Lead → status=demo, store booking_calcom_uid, booking_slot_at |
| `BOOKING_RESCHEDULED` | `POST /api/crm/webhooks/calcom` | Update booking_slot_at, log activity |
| `BOOKING_CANCELLED` | `POST /api/crm/webhooks/calcom` | Lead → status=lost (reason: cancelled) |

### 7.3 Payload Webhook

```json
{
  "triggerEvent": "BOOKING_CREATED",
  "payload": {
    "uid": "abc123-def456",
    "startTime": "2026-01-22T14:00:00.000Z",
    "endTime": "2026-01-22T14:30:00.000Z",
    "attendees": [
      {
        "email": "user@example.com",
        "name": "Jean-Pierre Martin",
        "timeZone": "Europe/Paris"
      }
    ],
    "metadata": {
      "leadId": "uuid-lead-id"
    }
  }
}
```

---

## 8. EMAIL J-1 ANTI NO-SHOW

### 8.1 Déclencheur

**CRON Job**: Toutes les heures, vérifie les démos dans les prochaines 24h

```typescript
// Critères
WHERE status = 'demo'
  AND booking_slot_at BETWEEN NOW() AND NOW() + INTERVAL '24 hours'
  AND reminder_j1_sent_at IS NULL
```

### 8.2 Contenu Email

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   Your FleetCore Demo is Tomorrow!                              │
│                                                                 │
│   📅 Wednesday, January 22, 2026 at 2:00 PM (Europe/Paris)     │
│   📱 We'll call: +33 6 12 34 56 78                             │
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │                                                         │  │
│   │    ┌─────────────────┐    ┌─────────────────┐          │  │
│   │    │  ✅ I'll be     │    │  📅 Need to     │          │  │
│   │    │     there!      │    │    reschedule   │          │  │
│   │    └─────────────────┘    └─────────────────┘          │  │
│   │                                                         │  │
│   └─────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 8.3 Boutons CTA

| Bouton | URL | Action |
|--------|-----|--------|
| **I'll be there** | `/api/crm/leads/confirm-attendance?t={short_token}` | Confirm attendance, log activity |
| **Need to reschedule** | `/book-demo/reschedule?t={short_token}` | Open reschedule page with Cal.com iframe |

### 8.4 Short Token System

Pour compatibilité iOS Mail (URLs tronquées), on utilise des tokens courts:

```typescript
// Génération
const shortToken = randomBytes(12).toString('base64url'); // ~16 chars

// Stockage
await prisma.crm_leads.update({
  where: { id: leadId },
  data: {
    reschedule_token: shortToken,
    reschedule_token_expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
  }
});

// URL finale: /api/crm/leads/confirm-attendance?t=Ab3Cd4Ef5Gh6 (~45 chars total)
// vs UUID: /api/crm/leads/confirm-attendance?leadId=550e8400-e29b-41d4-a716-446655440000 (~88 chars)
```

---

## 9. WAITLIST SYSTEM

### 9.1 Flow Waitlist

```
┌─────────────────────────────────────────────────────────────────┐
│                    WAITLIST FLOW                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Step 1: Email + Country (ex: Qatar)                           │
│           │                                                     │
│           ▼                                                     │
│  Step 1b: Email Verification (code 6 chiffres)                 │
│           │                                                     │
│           ▼                                                     │
│  Check: country.is_operational = FALSE                         │
│           │                                                     │
│           ▼                                                     │
│  /book-demo/coming-soon                                        │
│  ├─ Message: "FleetCore is coming soon to Qatar!"              │
│  ├─ "We'll notify you when we launch"                          │
│  └─ Button: "Join Waitlist"                                    │
│           │                                                     │
│           ▼                                                     │
│  POST /api/waitlist                                            │
│  ├─ Crée entrée dans crm_waitlist                              │
│  └─ Link short_token pour survey                               │
│           │                                                     │
│           ▼                                                     │
│  /waitlist-survey?t={short_token}                              │
│  ├─ Fleet size                                                 │
│  ├─ Company name (optional)                                    │
│  ├─ Marketing consent checkbox                                 │
│  └─ Submit → PATCH /api/waitlist/survey                        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 9.2 Coming Soon Page

**Route**: `/[locale]/(public)/book-demo/coming-soon/page.tsx`

**Contenu**:
```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   🚀 FleetCore is Coming to Qatar!                             │
│                                                                 │
│   We're expanding to new markets. Be the first to know         │
│   when FleetCore launches in Qatar.                            │
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │  ✉️ email@example.com                                   │  │
│   │  🇶🇦 Qatar                                               │  │
│   └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│   [Join the Waitlist]                                          │
│                                                                 │
│   ← Back to Homepage                                            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 9.3 Waitlist Survey Page

**Route**: `/[locale]/(public)/waitlist-survey/page.tsx`

**Champs**:
- `fleet_size` (optional) - Select avec options standard
- `company_name` (optional) - Text input
- `marketing_consent` (required checkbox) - Pour future newsletters

---

## 10. SHORT URL SYSTEM (iOS MAIL)

### 10.1 Problème

iOS Mail tronque les URLs longues (>~80 chars), rendant les liens avec UUIDs inutilisables.

**Exemple problématique**:
```
https://fleetcore.io/api/crm/leads/confirm-attendance?leadId=550e8400-e29b-41d4-a716-446655440000
                                                                            ↑
                                                              88 chars → TRONQUÉ par iOS Mail
```

### 10.2 Solution: Short Tokens

**Génération**:
```typescript
import { randomBytes } from 'crypto';

// 12 bytes → 16 chars base64url
const shortToken = randomBytes(12).toString('base64url');
// Exemple: "Ab3Cd4Ef5Gh6Ij7K"
```

**URLs finales**:
```
Confirm: /api/crm/leads/confirm-attendance?t=Ab3Cd4Ef5Gh6Ij7K (~55 chars) ✅
Reschedule: /book-demo/reschedule?t=Ab3Cd4Ef5Gh6Ij7K (~45 chars) ✅
Waitlist Survey: /waitlist-survey?t=Ab3Cd4Ef5Gh6Ij7K (~40 chars) ✅
```

### 10.3 Stockage

**crm_leads**:
```sql
reschedule_token VARCHAR(32)        -- Short token for J-1 email links
reschedule_token_expires_at TIMESTAMP -- Expiry (7 days after creation)
```

**crm_waitlist**:
```sql
short_token VARCHAR(32) UNIQUE      -- Short token for survey link
```

### 10.4 Résolution Token

```typescript
// API route: /api/crm/leads/confirm-attendance
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('t');

  if (!token) {
    return NextResponse.json({ error: 'Token required' }, { status: 400 });
  }

  // Find lead by short token
  const lead = await db.crm_leads.findFirst({
    where: {
      reschedule_token: token,
      reschedule_token_expires_at: { gt: new Date() }
    }
  });

  if (!lead) {
    return NextResponse.json({ error: 'Invalid or expired token' }, { status: 404 });
  }

  // Process confirmation...
}
```

---

## 11. SCHEMA DATABASE CRM_LEADS

### 11.1 Structure complète

```sql
CREATE TABLE crm_leads (
    -- Identifiants
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_code VARCHAR(50) UNIQUE,           -- Ex: LEAD-2026-00001

    -- Contact
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),

    -- Entreprise
    company_name VARCHAR(255),
    industry TEXT,
    company_size VARCHAR(50),
    website_url TEXT,
    linkedin_url TEXT,
    city TEXT,

    -- Business
    fleet_size VARCHAR(50),                 -- Ex: "11-20", "21-50"
    current_software TEXT,
    platforms_used TEXT[],                  -- Array: ['uber', 'bolt', 'heetch']

    -- Géographie
    country_code CHAR(2),                   -- FK → crm_countries

    -- Statut & Pipeline
    status VARCHAR(50) DEFAULT 'new',       -- 8 statuts V6.4
    lead_stage VARCHAR(50) DEFAULT 'top_of_funnel',
    priority VARCHAR(20) DEFAULT 'medium',

    -- Scoring
    qualification_score INTEGER,
    qualification_notes TEXT,
    qualified_date TIMESTAMP,
    fit_score NUMERIC(5,2),
    engagement_score NUMERIC(5,2),
    scoring JSONB,

    -- CPT Framework
    cpt_challenges_response TEXT,
    cpt_challenges_score VARCHAR(10),       -- high/medium/low
    cpt_priority_response TEXT,
    cpt_priority_score VARCHAR(10),         -- high/medium/low
    cpt_timing_response TEXT,
    cpt_timing_score VARCHAR(10),           -- hot/warm/cool/cold
    cpt_total_score INTEGER,
    cpt_qualified_at TIMESTAMP,
    cpt_qualified_by UUID,

    -- Email Verification
    email_verified BOOLEAN DEFAULT FALSE,
    email_verification_code VARCHAR(255),   -- bcrypt hash
    email_verification_expires_at TIMESTAMP,
    email_verification_attempts INTEGER DEFAULT 0,

    -- Cal.com Booking
    booking_slot_at TIMESTAMP,              -- Date/heure du RDV
    booking_confirmed_at TIMESTAMP,         -- Quand confirmé
    booking_calcom_uid VARCHAR(255),        -- Cal.com booking UID

    -- Wizard
    wizard_completed BOOLEAN DEFAULT FALSE,

    -- J-1 Reminder
    reschedule_token VARCHAR(32),           -- Short token for iOS Mail
    reschedule_token_expires_at TIMESTAMP,
    reminder_j1_sent_at TIMESTAMP,
    attendance_confirmed_at TIMESTAMP,

    -- Conversion
    converted_date TIMESTAMP,
    converted_at TIMESTAMP,
    tenant_id UUID,                         -- FK → adm_tenants

    -- Closing
    stage_entered_at TIMESTAMP,
    loss_reason_code VARCHAR(50),
    loss_reason_detail TEXT,
    competitor_name VARCHAR(255),

    -- GDPR
    gdpr_consent BOOLEAN,
    consent_at TIMESTAMP,
    consent_ip VARCHAR(45),                 -- IPv4 or IPv6

    -- Source & Attribution
    source VARCHAR(100),
    source_id UUID,                         -- FK → crm_lead_sources
    utm_source TEXT,
    utm_medium TEXT,
    utm_campaign TEXT,

    -- Assignment
    assigned_to UUID,                       -- FK → adm_provider_employees
    opportunity_id UUID,
    next_action_date TIMESTAMP,

    -- Métadonnées
    message TEXT,
    metadata JSONB DEFAULT '{}',

    -- Provider
    provider_id UUID DEFAULT '7ad8173c-68c5-41d3-9918-686e4e941cc0',

    -- Audit
    created_at TIMESTAMP DEFAULT NOW(),
    created_by UUID,
    updated_at TIMESTAMP DEFAULT NOW(),
    updated_by UUID,
    deleted_at TIMESTAMP,
    deleted_by UUID,
    deletion_reason TEXT,
    last_activity_at TIMESTAMP,

    -- Constraints
    CONSTRAINT crm_leads_status_check CHECK (status IN (
        'new', 'demo', 'proposal_sent', 'payment_pending',
        'converted', 'lost', 'nurturing', 'disqualified'
    ))
);

-- Indexes
CREATE INDEX idx_crm_leads_email ON crm_leads(email);
CREATE INDEX idx_crm_leads_status ON crm_leads(status);
CREATE INDEX idx_crm_leads_country ON crm_leads(country_code);
CREATE INDEX idx_crm_leads_booking ON crm_leads(booking_slot_at);
CREATE INDEX idx_crm_leads_reschedule_token ON crm_leads(reschedule_token);
CREATE UNIQUE INDEX idx_crm_leads_email_active ON crm_leads(email) WHERE deleted_at IS NULL;
```

---

## 12. SCHEMA DATABASE CRM_WAITLIST

### 12.1 Structure complète

```sql
CREATE TABLE crm_waitlist (
    -- Identifiants
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Contact
    email VARCHAR(255) NOT NULL,

    -- Business (optional, collected via survey)
    company_name VARCHAR(255),
    fleet_size VARCHAR(50),

    -- Geography
    country_code CHAR(2) NOT NULL,          -- Pays demandé
    detected_country_code CHAR(2),          -- Pays détecté via IP

    -- Survey
    short_token VARCHAR(32) UNIQUE,         -- Token court pour lien survey
    survey_completed_at TIMESTAMP,

    -- Marketing
    marketing_consent BOOLEAN DEFAULT FALSE,
    marketing_consent_at TIMESTAMP,

    -- Lead link (si converti après lancement)
    lead_id UUID,                           -- FK → crm_leads (quand pays devient opérationnel)

    -- Notifications
    notified_at TIMESTAMP,                  -- Quand notifié du lancement

    -- Audit
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    -- Constraints
    CONSTRAINT crm_waitlist_email_country_unique UNIQUE(email, country_code)
);

-- Indexes
CREATE INDEX idx_crm_waitlist_country ON crm_waitlist(country_code);
CREATE INDEX idx_crm_waitlist_short_token ON crm_waitlist(short_token);
CREATE INDEX idx_crm_waitlist_email ON crm_waitlist(email);
```

---

## 13. SCHEMA DATABASE CRM_COUNTRIES

### 13.1 Structure complète

```sql
CREATE TABLE crm_countries (
    -- Identifiant
    country_code CHAR(2) PRIMARY KEY,       -- ISO 3166-1 alpha-2

    -- Noms multilingues
    country_name_en VARCHAR(100) NOT NULL,
    country_name_fr VARCHAR(100) NOT NULL,
    country_name_ar VARCHAR(100),

    -- Préposition française (au/en/aux)
    country_preposition_fr VARCHAR(5) DEFAULT 'en',
    country_preposition_en VARCHAR(10) DEFAULT 'in',

    -- Display
    flag_emoji VARCHAR(10),
    display_order INTEGER DEFAULT 999,

    -- Opérationnel
    is_operational BOOLEAN DEFAULT FALSE,   -- FleetCore disponible?
    is_visible BOOLEAN DEFAULT TRUE,        -- Affiché dans dropdown?

    -- GDPR
    country_gdpr BOOLEAN DEFAULT FALSE,     -- Pays EU/EEA?

    -- Notifications
    notification_locale VARCHAR(5),         -- en/fr/ar

    -- Dial code
    dial_code VARCHAR(10),                  -- Ex: +33, +971
    phone_pattern VARCHAR(50),              -- Format attendu

    -- Audit
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_crm_countries_operational ON crm_countries(is_operational);
CREATE INDEX idx_crm_countries_gdpr ON crm_countries(country_gdpr);
CREATE INDEX idx_crm_countries_visible ON crm_countries(is_visible);
```

### 13.2 Données de référence

**Pays opérationnels (2)**:
- 🇦🇪 UAE (AE) - `is_operational = true`
- 🇫🇷 France (FR) - `is_operational = true`

**Pays GDPR (30 EU + EEA)**:
- Tous les pays EU (27): AT, BE, BG, HR, CY, CZ, DK, EE, FI, FR, DE, GR, HU, IE, IT, LV, LT, LU, MT, NL, PL, PT, RO, SK, SI, ES, SE
- Pays EEA (3): IS, LI, NO

**Prépositions françaises**:
- `au` : Qatar, Canada, Maroc, Royaume-Uni, Portugal...
- `aux` : États-Unis, Émirats, Pays-Bas
- `en` : France, Espagne, Belgique, Allemagne...

---

## 14. API ROUTES PUBLIQUES

### 14.1 Demo Leads

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/demo-leads` | Créer lead (mode wizard_step1 ou full_form) |

**Body wizard_step1**:
```json
{
  "mode": "wizard_step1",
  "email": "user@example.com",
  "country_code": "FR",
  "locale": "fr"
}
```

**Body full_form** (legacy):
```json
{
  "first_name": "Jean",
  "last_name": "Dupont",
  "email": "jean@example.com",
  "company_name": "VTC Paris",
  "country_code": "FR",
  "fleet_size": "11-20",
  "phone": "+33612345678",
  "message": "Intéressé par FleetCore",
  "gdpr_consent": true
}
```

### 14.2 Email Verification

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/crm/leads/verify-email` | Vérifier code 6 chiffres |
| POST | `/api/crm/leads/resend-code` | Renvoyer code |
| GET | `/api/crm/leads/check-email` | Vérifier si email existe |

**Verify Body**:
```json
{
  "email": "user@example.com",
  "code": "123456"
}
```

### 14.3 Booking & Wizard

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/crm/leads/[id]/booking-status` | Status booking Cal.com |
| PATCH | `/api/crm/leads/[id]/complete-wizard` | Finaliser wizard step 3 |

### 14.4 J-1 Reminder

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/crm/leads/confirm-attendance?t={token}` | Confirmer présence |
| POST | `/api/crm/leads/send-reschedule-link` | Générer lien reschedule |

### 14.5 Waitlist

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/waitlist` | Inscription waitlist |
| GET | `/api/waitlist/survey?t={token}` | Récupérer données pour survey |
| PATCH | `/api/waitlist/survey` | Soumettre survey |

### 14.6 Reference Data

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/public/countries` | Liste pays (visible) |
| GET | `/api/public/fleet-size-options` | Options fleet size |

### 14.7 Cal.com Webhook

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/crm/webhooks/calcom` | Webhook Cal.com events |

---

## 15. EMAIL TEMPLATES

### 15.1 Templates CRM

| Code | Description | Langues | Variables |
|------|-------------|---------|-----------|
| `email_verification_code` | Code 6 chiffres | EN/FR/AR | `verification_code`, `expires_in_minutes` |
| `lead_confirmation` | Confirmation demande (pays opérationnel) | EN/FR/AR | `first_name`, `company_name`, `fleet_size`, `country_name` |
| `expansion_opportunity` | Notification (pays non opérationnel) | EN/FR/AR | `first_name`, `country_preposition`, `country_name` |
| `demo_reminder_j1` | Rappel J-1 avec boutons | EN/FR/AR | `first_name`, `booking_date`, `booking_time`, `phone`, `confirm_url`, `reschedule_url` |
| `booking_confirmation` | Confirmation booking Cal.com | EN/FR/AR | `first_name`, `booking_date`, `booking_time`, `phone` |
| `sales_rep_assignment` | Notification commercial | EN/FR | `lead_name`, `company_name`, `fleet_size`, `priority`, `country_code` |
| `wizard_reminder_j1` | Relance wizard incomplet J+1 | EN/FR | `first_name`, `resume_url` |
| `wizard_reminder_j3` | Relance wizard incomplet J+3 | EN/FR | `first_name`, `resume_url` |
| `wizard_final_reminder` | Dernière relance J+7 | EN/FR | `first_name`, `resume_url` |
| `waitlist_confirmation` | Confirmation waitlist | EN/FR/AR | `country_name`, `survey_url` |
| `country_launch_notification` | Lancement dans un pays | EN/FR/AR | `country_name`, `book_demo_url` |

### 15.2 Architecture Templates

**Stockage**: `dir_notification_templates`

```sql
CREATE TABLE dir_notification_templates (
    id UUID PRIMARY KEY,
    template_code VARCHAR(100) UNIQUE NOT NULL,
    channel VARCHAR(50) DEFAULT 'email',
    subject_translations JSONB,  -- {en: "...", fr: "...", ar: "..."}
    body_translations JSONB,     -- {en: "<html>...", fr: "...", ar: "..."}
    variables TEXT[],            -- ['first_name', 'company_name', ...]
    supported_locales TEXT[],    -- ['en', 'fr', 'ar']
    is_active BOOLEAN DEFAULT TRUE
);
```

### 15.3 Variable Replacement

```typescript
// Service: NotificationQueueService
async sendEmail(params: {
  templateCode: string,
  recipientEmail: string,
  locale: string,
  variables: Record<string, string | number | null>
}) {
  const template = await getTemplate(templateCode);
  let body = template.body_translations[locale];

  // Replace {{variable}} placeholders
  for (const [key, value] of Object.entries(variables)) {
    const placeholder = `{{${key}}}`;
    body = body.replace(new RegExp(placeholder, 'g'), String(value));
  }

  await resend.emails.send({
    to: recipientEmail,
    subject: template.subject_translations[locale],
    html: body
  });
}
```

---

## 16. SERVICES BACKEND

### 16.1 Services CRM

| Service | Fichier | Responsabilité |
|---------|---------|----------------|
| `EmailVerificationService` | `lib/services/crm/email-verification.service.ts` | Génération, hash, vérification codes 6 chiffres |
| `LeadCreationService` | `lib/services/crm/lead-creation.service.ts` | Orchestration création lead (scoring, assignment) |
| `LeadScoringService` | `lib/services/crm/lead-scoring.service.ts` | Calcul fit_score, engagement_score |
| `LeadAssignmentService` | `lib/services/crm/lead-assignment.service.ts` | Attribution commercial selon règles |
| `CountryService` | `lib/services/crm/country.service.ts` | isGdprCountry(), isOperational() avec cache |

### 16.2 Services Notification

| Service | Fichier | Responsabilité |
|---------|---------|----------------|
| `NotificationQueueService` | `lib/services/notification/queue.service.ts` | Queue emails avec idempotency |
| `EmailService` | `lib/services/notification/email.service.ts` | Envoi via Resend API |

### 16.3 EmailVerificationService - API

```typescript
class EmailVerificationService {
  // Génère code 6 chiffres crypto-secure
  generateCode(): string;

  // Hash code avec bcrypt
  hashCode(code: string): Promise<string>;

  // Compare code avec hash
  compareCode(code: string, hash: string): Promise<boolean>;

  // Vérifie si resend autorisé (60s cooldown)
  canResendCode(email: string): Promise<ResendCheckResult>;

  // Envoie code de vérification
  sendVerificationCode(params: {
    email: string;
    locale?: string;
    country_code?: string;
  }): Promise<SendVerificationResult>;

  // Vérifie code entré par user
  verifyCode(params: {
    email: string;
    code: string;
  }): Promise<VerifyCodeResult>;

  // Récupère statut vérification
  getVerificationStatus(email: string): Promise<VerificationStatus | null>;

  // Clear state (admin)
  clearVerificationState(leadId: string): Promise<void>;
}
```

---

## 17. PROCESSUS APPEL COMMERCIAL (ONE-CALL CLOSE)

### 17.1 Philosophie

> **"L'appel n'est PAS un appel de qualification suivi d'une demo séparée.
> C'est UN SEUL appel où on qualifie, on démontre, et on close."**

### 17.2 Structure de l'appel (20-30 min)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                    STRUCTURE APPEL COMMERCIAL                                │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  PHASE 1 : ICE-BREAKER (2 min)                                              │
│  Établir le rapport, confirmer le contexte                                  │
│                                                                              │
│  PHASE 2 : QUALIFICATION CPT (5 min)                                        │
│  C - Challenges : "Quels sont vos plus gros défis ?"                        │
│  P - Priority : "À quel point c'est urgent ?"                               │
│  T - Timing : "Quand souhaitez-vous une solution ?"                         │
│                                                                              │
│  PHASE 3 : DEMO ROI-FOCUSED (15 min) [SI QUALIFIÉ]                          │
│  Focus sur les painpoints identifiés, pas tour des features                 │
│                                                                              │
│  PHASE 4 : CLOSING (5 min)                                                  │
│  Si OUI → Lien Stripe                                                       │
│  Si HÉSITATION → Identifier blocage                                         │
│  Si NON → Remercier, lead → lost                                            │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 17.3 Actions post-appel

| Issue appel | Action Commercial | Nouveau statut | Dropdown requis |
|-------------|------------------|----------------|-----------------|
| **OK, on y va** | Clic "Générer lien paiement" | `proposal_sent` | Non |
| **Pas maintenant** | Clic "Nurturing" | `nurturing` | Oui (raison) |
| **Non intéressé** | Clic "Lost" | `lost` | Oui (raison) |
| **Hors cible** | Clic "Disqualifier" | `disqualified` | Oui (raison) |
| **No-show** | Clic "Lost" | `lost` | Auto: `no_show` |

---

## 18. FRAMEWORK QUALIFICATION CPT

### 18.1 Les 3 questions

| Dimension | Question | Scores possibles |
|-----------|----------|-----------------|
| **C** - Challenges | "Quels sont vos plus gros défis avec la gestion de votre flotte ?" | high / medium / low |
| **P** - Priority | "À quel point c'est prioritaire de résoudre ces problèmes ?" | high / medium / low |
| **T** - Timing | "Quand souhaiteriez-vous avoir une solution en place ?" | hot / warm / cool / cold |

### 18.2 Grille de scoring

| C | P | T | Score | Décision |
|---|---|---|-------|----------|
| high | high | hot | 100 | GO - Close immédiat |
| high | high | warm | 90 | GO - Close avec suivi |
| high | medium | hot | 80 | GO - Demo approfondie |
| medium | high | hot | 75 | GO - Demo approfondie |
| high | medium | warm | 70 | GO - Avec réserve |
| medium | medium | warm | 50 | MAYBE - Nurturing court |
| low | * | * | < 40 | NO-GO - Nurturing long |
| * | * | cold | < 30 | NO-GO - Nurturing |

---

## 19. FLUX LEAD-TO-CLIENT (STRIPE PAYMENT FLOW)

### 19.1 Vue d'ensemble

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         FLUX COMPLET V6.4                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1. WIZARD PUBLIC                                                           │
│     ├─ Étape 1: Email + Country → Lead créé (status = new)                 │
│     ├─ Étape 1b: Email verification → email_verified = true                │
│     ├─ Étape 2: Cal.com → Booking créé (booking_slot_at)                   │
│     └─ Étape 3: Infos → wizard_completed = TRUE, status = demo             │
│                                                                             │
│  2. EMAIL J-1                                                               │
│     └─ CRON envoie rappel avec boutons Confirm/Reschedule                  │
│                                                                             │
│  3. APPEL COMMERCIAL (One-Call Close)                                       │
│     ├─ Qualification CPT (5 min)                                           │
│     ├─ Demo ROI-focused (15 min)                                           │
│     └─ Closing (5 min)                                                     │
│                                                                             │
│  4. POST-APPEL (si OK)                                                      │
│     ├─ Commercial clique "Générer lien paiement"                           │
│     ├─ API crée Stripe Checkout Session                                    │
│     ├─ Lead → status = proposal_sent                                       │
│     └─ Email envoyé au lead avec lien Stripe                               │
│                                                                             │
│  5. PAIEMENT CLIENT                                                         │
│     ├─ Client clique lien → Stripe Checkout                                │
│     ├─ Entre CB (même si 0€ avec coupon 1er mois gratuit)                  │
│     └─ Lead → status = payment_pending                                     │
│                                                                             │
│  6. WEBHOOK STRIPE (checkout.session.completed)                             │
│     ├─ Créer adm_tenants (status = pending_verification)                   │
│     ├─ Créer clt_masterdata                                                │
│     ├─ Créer organisation Clerk                                            │
│     ├─ Lead → status = converted                                           │
│     └─ Envoyer email vérification 24h                                      │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 20. GDPR COMPLIANCE

### 20.1 Pays GDPR (30)

**EU (27)**: AT, BE, BG, HR, CY, CZ, DK, EE, FI, FR, DE, GR, HU, IE, IT, LV, LT, LU, MT, NL, PL, PT, RO, SK, SI, ES, SE

**EEA (3)**: IS, LI, NO

### 20.2 Implémentation

**Frontend**: `GdprConsentField` component
- Affiché uniquement si `country.country_gdpr = true`
- Checkbox obligatoire avant submit

**Backend**: `LeadCreationService` + `captureConsentIp()`
- Validation STEP 0: Reject si pays GDPR sans consent
- Capture IP pour audit trail

**Database**:
```sql
gdpr_consent BOOLEAN,
consent_at TIMESTAMP,
consent_ip VARCHAR(45)  -- IPv4 ou IPv6
```

### 20.3 Données stockées

| Champ | Description |
|-------|-------------|
| `gdpr_consent` | TRUE si user a coché la case |
| `consent_at` | Timestamp du consentement |
| `consent_ip` | Adresse IP pour audit trail |

---

## 21. PAGES FRONTEND

### 21.1 Pages publiques Book Demo

| Route | Description |
|-------|-------------|
| `/book-demo` | Wizard étape 1 (email + country) |
| `/book-demo/verify` | Vérification email (code 6 chiffres) |
| `/book-demo/step-2` | Cal.com embed |
| `/book-demo/step-3` | Infos business + téléphone |
| `/book-demo/confirmation` | Confirmation post-booking |
| `/book-demo/confirmed` | Après clic "I'll be there" |
| `/book-demo/reschedule` | Reprogrammer RDV (Cal.com iframe) |
| `/book-demo/coming-soon` | Pays non couvert → waitlist |

### 21.2 Pages publiques Waitlist

| Route | Description |
|-------|-------------|
| `/waitlist-survey` | Survey post-inscription waitlist |

### 21.3 Pages publiques autres

| Route | Description |
|-------|-------------|
| `/payment-success` | Succès paiement Stripe |
| `/payment-cancelled` | Annulation paiement |
| `/verify` | Formulaire vérification 24h post-conversion |

### 21.4 Pages admin CRM

| Route | Description |
|-------|-------------|
| `/admin/crm/leads` | Pipeline Kanban 4 phases |
| `/admin/crm/leads/[id]` | Fiche lead détaillée |
| `/admin/crm/leads/browser` | Vue table avec filtres |
| `/admin/crm/leads/reports` | Dashboard analytics |

---

## 22. NOTIFICATIONS & EMAILS

### 22.1 Séquence wizard incomplet

```
Création lead (Step 1)
        │
        ▼ (si email vérifié mais wizard pas complété)
J+1 : Email "wizard_reminder_j1"
        │
        ▼ (si toujours new)
J+3 : Email "wizard_reminder_j3"
        │
        ▼ (si toujours new)
J+7 : Email "wizard_final_reminder"
        │
        ▼ (si toujours new après J+7)
Lead passe automatiquement en NURTURING
(raison: wizard_incomplete)
```

### 22.2 Email J-1 Demo

```
24h avant booking_slot_at
        │
        ▼
Email "demo_reminder_j1" envoyé
├─ Bouton "I'll be there" → Confirm attendance
└─ Bouton "Need to reschedule" → Reschedule page
```

### 22.3 Post-conversion

```
Stripe webhook checkout.session.completed
        │
        ▼
Email "welcome_client" envoyé
        │
        ▼ (+24h)
Email "verification_24h" envoyé
└─ Formulaire vérification entreprise
```

---

## 23. MÉTRIQUES ET KPIS

| Métrique | Formule |
|----------|---------|
| Taux conversion Wizard | demo / new |
| Taux qualification | proposal_sent / demo |
| Taux closing | converted / proposal_sent |
| Taux no-show | (demo avec no_show) / demo |
| Cycle moyen | Moyenne(converted_at - created_at) |
| Taux email verification | email_verified / total leads created |
| Taux waitlist conversion | leads from waitlist / total waitlist |

---

## 24. RÈGLES DE GESTION VERROUILLÉES

> **Ces décisions sont FINALES et ne doivent PAS être remises en question :**
>
> 1. **8 statuts Lead** (new, demo, proposal_sent, payment_pending, converted, lost, nurturing, disqualified)
> 2. **4 phases Kanban** (Incomplet, Démo, Proposition, Terminé)
> 3. **Wizard 5 étapes** (Email/Country → Verify → Cal.com → Infos → Confirmation)
> 4. **Email verification obligatoire** (code 6 chiffres, bcrypt, 15 min expiry)
> 5. **Short tokens pour iOS Mail** (~16 chars base64url)
> 6. **Téléphone étape 3** (après booking, pas avant)
> 7. **Fleet size étape 3** (après booking, pas étape 1)
> 8. **One-call close** (qual + demo + closing = MÊME appel)
> 9. **Cal.com Free** (1 commercial, distribution interne manuelle)
> 10. **Framework CPT** (3 questions : Challenges, Priority, Timing)
> 11. **Pas de question budget** (affirmation ROI en closing)
> 12. **Email J-1 avec Confirm/Reschedule** (short tokens)
> 13. **JAMAIS de baisse de tarif** (levier = mois gratuits)
> 14. **Conversion = Webhook Stripe** (automatique)
> 15. **1er mois gratuit via coupon** (PAS trial_period_days)
> 16. **ZERO HARDCODING** - Tout depuis settings DB
> 17. **Waitlist pour pays non opérationnels** (crm_waitlist table)
> 18. **nurturing → demo = LEAD ACTION** (Le commercial ne peut pas forcer)
> 19. **GDPR consent conditionnel** (30 pays EU/EEA)
> 20. **Country prepositions FR** (au/en/aux database-driven)

---

## CHECKLIST VALIDATION V6.4

### Wizard Flow
```
☐ Step 1: Email + Country + GDPR consent (conditional)
☐ Step 1b: Email verification 6 digits
☐ Step 2: Cal.com booking
☐ Step 3: Business infos + phone + fleet_size
☐ Confirmation page with Add to Calendar
☐ Reschedule page with Cal.com iframe
☐ Coming Soon page for non-operational countries
```

### Email Verification
```
☐ Code 6 chiffres crypto-secure
☐ bcrypt hashing (cost 10)
☐ 15 min expiration
☐ 60s resend cooldown
☐ Max 5 attempts
☐ Clear state on success
```

### J-1 Reminder
```
☐ CRON job toutes les heures
☐ Short token generation
☐ Confirm attendance endpoint
☐ Reschedule page accessible via token
☐ reminder_j1_sent_at tracking
```

### Waitlist
```
☐ crm_waitlist table created
☐ Short token for survey link
☐ Survey page with fleet_size, company_name
☐ Marketing consent checkbox
```

### GDPR
```
☐ 30 EU/EEA countries flagged
☐ GdprConsentField component
☐ captureConsentIp middleware
☐ consent_ip stored in crm_leads
```

---

**FIN DE LA SPÉCIFICATION V6.4 FINALE**

_Version 6.4.0 - Wizard 5 Étapes + Email Verification + Waitlist + Short URLs_
_Mise à jour complète reflétant l'implémentation réelle_
