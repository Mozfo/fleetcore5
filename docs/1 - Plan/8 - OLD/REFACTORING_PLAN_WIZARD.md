# Plan de Refactoring: Book Demo Wizard API

**Date**: 20 Jan 2026
**Auteur**: Claude
**Statut**: EN ATTENTE VALIDATION

---

## 1. CONTEXTE & PROBLÈME

### Architecture Actuelle (Problématique)

```
app/api/
├── demo-leads/route.ts          ← MÉLANGE wizard_step1 + full_form (legacy)
│   └── POST: mode="wizard_step1" OU mode="full_form"
│
├── crm/leads/
│   ├── verify-email/route.ts    ← Step 2: Vérifie le code
│   ├── resend-code/route.ts     ← Renvoie le code
│   ├── check-email/route.ts     ← Vérifie si email existe
│   ├── [id]/booking-status/     ← Statut booking
│   ├── [id]/complete-wizard/    ← Step 3: Complète le profil
│   └── [id]/confirmation-details/ ← Détails confirmation

lib/services/crm/
├── email-verification.service.ts ← FAIT TROP: crée lead + génère code + envoie email
```

### Problèmes Identifiés

| Problème                                                         | Impact                           | Fichier                               |
| ---------------------------------------------------------------- | -------------------------------- | ------------------------------------- |
| `EmailVerificationService.sendVerificationCode()` crée des leads | Violation SRP, logique dispersée | email-verification.service.ts:256-288 |
| `demo-leads/route.ts` a 2 modes dans le même handler             | Code difficile à maintenir       | demo-leads/route.ts:386-462           |
| Routes non alignées avec les écrans wizard                       | Confusion, difficile à débugger  | Tous les fichiers                     |
| `country_code` passé après création du lead                      | Bug (était NULL)                 | demo-leads/route.ts:164-173           |

---

## 2. ARCHITECTURE CIBLE

### Nouvelle Structure des Routes

```
app/api/book-demo/
├── step1/route.ts         → POST: email + country → crée lead + envoie code
├── verify/route.ts        → POST: vérifie code 6 digits
├── resend/route.ts        → POST: renvoie code (cooldown 60s)
├── step3/route.ts         → PATCH: company_name, phone, fleet_size, gdpr
└── confirmation/route.ts  → GET: détails de confirmation

app/api/demo-leads/route.ts → CONSERVÉ pour legacy full_form uniquement
```

### Nouvelle Structure des Services

```
lib/services/crm/
├── wizard-lead.service.ts       → NOUVEAU: Création et mise à jour des leads wizard
├── email-verification.service.ts → REFACTORÉ: UNIQUEMENT génération/validation codes
└── booking.service.ts           → EXISTANT: Gestion Cal.com (inchangé)
```

### Principe de Responsabilité Unique

| Service                    | Responsabilité UNIQUE                              |
| -------------------------- | -------------------------------------------------- |
| `WizardLeadService`        | Créer, mettre à jour, valider les leads du wizard  |
| `EmailVerificationService` | Générer, hasher, valider les codes de vérification |
| `NotificationQueueService` | Mettre en queue les emails (existant)              |
| `BookingService`           | Gérer les interactions Cal.com (existant)          |

---

## 3. MAPPING ÉCRANS ↔ ROUTES ↔ SERVICES

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  ÉCRAN                    │  ROUTE API                │  SERVICES           │
├─────────────────────────────────────────────────────────────────────────────┤
│  Step 1: Email + Country  │  POST /api/book-demo/step1│  WizardLeadService  │
│                           │                           │  EmailVerification  │
│                           │                           │  NotificationQueue  │
├─────────────────────────────────────────────────────────────────────────────┤
│  Step 1b: Verify Code     │  POST /api/book-demo/verify│ EmailVerification  │
├─────────────────────────────────────────────────────────────────────────────┤
│  (Resend Code)            │  POST /api/book-demo/resend│ EmailVerification  │
│                           │                           │  NotificationQueue  │
├─────────────────────────────────────────────────────────────────────────────┤
│  Step 2: Cal.com Booking  │  (Webhook Cal.com)        │  BookingService     │
├─────────────────────────────────────────────────────────────────────────────┤
│  Step 3: Business Info    │  PATCH /api/book-demo/step3│ WizardLeadService  │
├─────────────────────────────────────────────────────────────────────────────┤
│  Confirmation             │  GET /api/book-demo/      │  WizardLeadService  │
│                           │      confirmation         │                     │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. PLAN D'IMPLÉMENTATION DÉTAILLÉ

### Phase 1: Créer WizardLeadService (NOUVEAU)

**Fichier**: `lib/services/crm/wizard-lead.service.ts`

```typescript
export class WizardLeadService {
  /**
   * Crée un nouveau lead pour le wizard (Step 1)
   * @returns leadId
   */
  async createWizardLead(params: {
    email: string;
    country_code: string;
    locale: string;
  }): Promise<{ leadId: string; isNew: boolean }>;

  /**
   * Met à jour les infos de vérification email
   */
  async setVerificationCode(
    leadId: string,
    params: {
      hashedCode: string;
      expiresAt: Date;
    }
  ): Promise<void>;

  /**
   * Marque l'email comme vérifié
   */
  async markEmailVerified(leadId: string): Promise<void>;

  /**
   * Complète le profil (Step 3)
   */
  async completeProfile(
    leadId: string,
    params: {
      company_name: string;
      phone?: string;
      fleet_size: string;
      gdpr_consent?: boolean;
      consent_ip?: string;
    }
  ): Promise<void>;

  /**
   * Récupère un lead par ID avec validation
   */
  async getLeadById(leadId: string): Promise<WizardLead | null>;

  /**
   * Vérifie si un email existe déjà
   */
  async findByEmail(email: string): Promise<WizardLead | null>;
}
```

**Risque**: FAIBLE - Nouveau fichier, pas d'impact sur l'existant

---

### Phase 2: Refactorer EmailVerificationService

**Fichier**: `lib/services/crm/email-verification.service.ts`

**Changements**:

1. SUPPRIMER la création de lead de `sendVerificationCode()`
2. Ajouter méthode `generateAndHashCode()` qui retourne `{ plainCode, hashedCode, expiresAt }`
3. CONSERVER `verifyCode()` mais simplifier (ne plus gérer la création)

**Avant**:

```typescript
async sendVerificationCode(params: {
  email: string;
  locale?: string;
  country_code?: string;  // ← NE DEVRAIT PAS ÊTRE LÀ
}): Promise<SendVerificationResult> {
  // ... crée le lead si n'existe pas ← VIOLATION SRP
  // ... génère le code
  // ... envoie l'email
}
```

**Après**:

```typescript
/**
 * Génère un code de vérification (sans créer de lead)
 */
generateAndHashCode(): {
  plainCode: string;
  hashedCode: string;
  expiresAt: Date;
};

/**
 * Vérifie un code contre son hash
 */
async verifyCode(params: {
  leadId: string;
  code: string;
}): Promise<VerifyCodeResult>;

/**
 * Vérifie si le cooldown de renvoi est écoulé
 */
async canResendCode(leadId: string): Promise<ResendCheckResult>;
```

**Risque**: MOYEN - Modification d'un service existant utilisé par plusieurs routes

**Mitigation**:

- Garder l'ancienne méthode `sendVerificationCode()` comme wrapper deprecated
- Tests unitaires avant/après

---

### Phase 3: Créer les Nouvelles Routes

#### 3.1 POST /api/book-demo/step1

**Fichier**: `app/api/book-demo/step1/route.ts`

```typescript
// Schema
const Step1Schema = z.object({
  email: z.string().email(),
  country_code: z.string().length(2),
  locale: z.string().default("en"),
});

// Handler
export async function POST(request: NextRequest) {
  // 1. Valider le body
  // 2. Vérifier si lead existe (duplicate check)
  // 3. Créer le lead via WizardLeadService.createWizardLead()
  // 4. Générer le code via EmailVerificationService.generateAndHashCode()
  // 5. Sauver le code via WizardLeadService.setVerificationCode()
  // 6. Envoyer l'email via NotificationQueueService
  // 7. Retourner { success, leadId, expiresAt }
}
```

**Risque**: FAIBLE - Nouvelle route

---

#### 3.2 POST /api/book-demo/verify

**Fichier**: `app/api/book-demo/verify/route.ts`

```typescript
// Schema
const VerifySchema = z.object({
  lead_id: z.string().uuid(),
  code: z.string().length(6),
});

// Handler - Délègue à EmailVerificationService.verifyCode()
```

**Risque**: FAIBLE - Réutilise la logique existante

---

#### 3.3 POST /api/book-demo/resend

**Fichier**: `app/api/book-demo/resend/route.ts`

```typescript
// Schema
const ResendSchema = z.object({
  lead_id: z.string().uuid(),
  locale: z.string().default("en"),
});

// Handler
// 1. Vérifier cooldown via EmailVerificationService.canResendCode()
// 2. Générer nouveau code
// 3. Sauver via WizardLeadService
// 4. Envoyer via NotificationQueueService
```

**Risque**: FAIBLE - Nouvelle route

---

#### 3.4 PATCH /api/book-demo/step3

**Fichier**: `app/api/book-demo/step3/route.ts`

```typescript
// Schema
const Step3Schema = z.object({
  lead_id: z.string().uuid(),
  company_name: z.string().min(1),
  phone: z.string().optional(),
  fleet_size: z.string(),
  gdpr_consent: z.boolean().optional(),
});

// Handler - Délègue à WizardLeadService.completeProfile()
```

**Risque**: FAIBLE - Similaire à complete-wizard existant

---

#### 3.5 GET /api/book-demo/confirmation

**Fichier**: `app/api/book-demo/confirmation/route.ts`

```typescript
// Query params: lead_id
// Handler - Récupère les détails via WizardLeadService
```

**Risque**: FAIBLE - Similaire à confirmation-details existant

---

### Phase 4: Migrer le Frontend

**Fichiers à modifier**:

| Fichier Frontend                  | Ancienne API                                   | Nouvelle API                      |
| --------------------------------- | ---------------------------------------------- | --------------------------------- |
| `book-demo/page.tsx`              | `POST /api/demo-leads`                         | `POST /api/book-demo/step1`       |
| `book-demo/verify/page.tsx`       | `POST /api/crm/leads/verify-email`             | `POST /api/book-demo/verify`      |
| `book-demo/verify/page.tsx`       | `POST /api/crm/leads/resend-code`              | `POST /api/book-demo/resend`      |
| `book-demo/step-3/page.tsx`       | `PATCH /api/crm/leads/[id]/complete-wizard`    | `PATCH /api/book-demo/step3`      |
| `book-demo/confirmation/page.tsx` | `GET /api/crm/leads/[id]/confirmation-details` | `GET /api/book-demo/confirmation` |

**Risque**: MOYEN - Modifications frontend, besoin de tests E2E

---

### Phase 5: Déprécier les Anciennes Routes

**Action**: Ajouter header `Deprecation` aux anciennes routes

```typescript
// Dans les anciennes routes
response.headers.set("Deprecation", "true");
response.headers.set("Sunset", "2026-03-01");
response.headers.set("Link", '</api/book-demo/step1>; rel="successor-version"');
```

**Risque**: FAIBLE - Les anciennes routes continuent de fonctionner

---

### Phase 6: Nettoyage (Post-Migration)

**À faire après validation en production**:

1. Supprimer `mode: "wizard_step1"` de `demo-leads/route.ts`
2. Supprimer les anciennes routes `/api/crm/leads/verify-email`, `/resend-code`, etc.
3. Supprimer les méthodes deprecated de `EmailVerificationService`

**Risque**: ÉLEVÉ si fait trop tôt - Reporter à V6.4

---

## 5. ANALYSE DES RISQUES

### Risques Techniques

| Risque                            | Probabilité | Impact   | Mitigation                              |
| --------------------------------- | ----------- | -------- | --------------------------------------- |
| Régression sur vérification email | MOYEN       | ÉLEVÉ    | Tests unitaires + E2E avant déploiement |
| Frontend appelle mauvaise API     | FAIBLE      | MOYEN    | Déployer API avant frontend             |
| Perte de données lead             | FAIBLE      | CRITIQUE | Transaction DB + logs détaillés         |
| Performance dégradée              | FAIBLE      | FAIBLE   | Même nombre de queries DB               |

### Risques Business

| Risque                         | Probabilité | Impact | Mitigation                              |
| ------------------------------ | ----------- | ------ | --------------------------------------- |
| Leads perdus pendant migration | FAIBLE      | ÉLEVÉ  | Garder anciennes routes actives         |
| Emails non envoyés             | MOYEN       | ÉLEVÉ  | Tests manuels sur environnement staging |
| Utilisateur bloqué mi-wizard   | FAIBLE      | MOYEN  | leadId reste compatible                 |

### Points de Non-Retour

| Étape                                  | Réversible? | Action si problème                        |
| -------------------------------------- | ----------- | ----------------------------------------- |
| Phase 1-3 (nouveaux fichiers)          | OUI         | Supprimer les fichiers                    |
| Phase 4 (migration frontend)           | OUI         | Revert git                                |
| Phase 6 (suppression anciennes routes) | NON         | Ne pas faire sans 2 semaines de stabilité |

---

## 6. PLAN DE TEST

### Tests Unitaires (Obligatoires)

```bash
# Nouveaux tests à créer
lib/services/crm/__tests__/wizard-lead.service.test.ts
app/api/book-demo/__tests__/step1.route.test.ts
app/api/book-demo/__tests__/verify.route.test.ts
app/api/book-demo/__tests__/resend.route.test.ts
app/api/book-demo/__tests__/step3.route.test.ts
```

### Tests E2E (Obligatoires)

```bash
# Scénario complet
1. Step 1: Soumettre email + pays
2. Vérifier que lead créé avec country_code
3. Vérifier email reçu avec code
4. Step 1b: Entrer code correct
5. Vérifier email_verified = true
6. Step 2: Booking Cal.com (mock)
7. Step 3: Compléter profil
8. Confirmation: Vérifier données affichées
```

### Tests de Régression

- [ ] Ancien flow `full_form` fonctionne toujours
- [ ] Resend code respecte cooldown 60s
- [ ] Max 5 tentatives de vérification
- [ ] GDPR consent enregistré avec IP

---

## 7. ORDRE D'EXÉCUTION

```
┌─────────────────────────────────────────────────────────────────┐
│  PHASE 1: WizardLeadService (nouveau)                           │
│  Risque: FAIBLE | Durée: 1h | Réversible: OUI                   │
├─────────────────────────────────────────────────────────────────┤
│  PHASE 2: Refactor EmailVerificationService                     │
│  Risque: MOYEN | Durée: 1h | Réversible: OUI                    │
│  ⚠️ COMMIT CHECKPOINT #1                                        │
├─────────────────────────────────────────────────────────────────┤
│  PHASE 3: Nouvelles routes API                                  │
│  Risque: FAIBLE | Durée: 2h | Réversible: OUI                   │
│  ⚠️ COMMIT CHECKPOINT #2                                        │
├─────────────────────────────────────────────────────────────────┤
│  PHASE 4: Migration Frontend                                    │
│  Risque: MOYEN | Durée: 1h | Réversible: OUI                    │
│  ⚠️ COMMIT CHECKPOINT #3                                        │
├─────────────────────────────────────────────────────────────────┤
│  PHASE 5: Tests E2E                                             │
│  Risque: N/A | Durée: 1h | Obligatoire avant push               │
├─────────────────────────────────────────────────────────────────┤
│  🚀 PUSH TO PRODUCTION                                          │
├─────────────────────────────────────────────────────────────────┤
│  PHASE 6: Nettoyage (V6.4 - 2 semaines après)                   │
│  Risque: ÉLEVÉ | Ne pas faire avant stabilisation               │
└─────────────────────────────────────────────────────────────────┘
```

---

## 8. CHECKLIST AVANT PUSH

- [ ] WizardLeadService créé avec tests
- [ ] EmailVerificationService refactoré (méthodes deprecated conservées)
- [ ] Nouvelles routes `/api/book-demo/*` créées
- [ ] Frontend migré vers nouvelles routes
- [ ] Tests unitaires passent: `pnpm vitest run`
- [ ] TypeScript compile: `pnpm typecheck`
- [ ] ESLint clean: `pnpm lint`
- [ ] Test manuel Step 1 → Step 3 complet
- [ ] Vérifier `country_code` sauvegardé en DB
- [ ] Vérifier email de vérification reçu

---

## 9. FICHIERS À CRÉER/MODIFIER

### Nouveaux Fichiers

| Fichier                                                  | Description                         |
| -------------------------------------------------------- | ----------------------------------- |
| `lib/services/crm/wizard-lead.service.ts`                | Service de gestion des leads wizard |
| `lib/services/crm/__tests__/wizard-lead.service.test.ts` | Tests unitaires                     |
| `app/api/book-demo/step1/route.ts`                       | Route Step 1                        |
| `app/api/book-demo/verify/route.ts`                      | Route vérification code             |
| `app/api/book-demo/resend/route.ts`                      | Route renvoi code                   |
| `app/api/book-demo/step3/route.ts`                       | Route Step 3                        |
| `app/api/book-demo/confirmation/route.ts`                | Route confirmation                  |

### Fichiers Modifiés

| Fichier                                                 | Modification                                            |
| ------------------------------------------------------- | ------------------------------------------------------- |
| `lib/services/crm/email-verification.service.ts`        | Extraire création lead, ajouter `generateAndHashCode()` |
| `app/[locale]/(public)/book-demo/page.tsx`              | Appeler nouvelle API `/api/book-demo/step1`             |
| `app/[locale]/(public)/book-demo/verify/page.tsx`       | Appeler nouvelles APIs                                  |
| `app/[locale]/(public)/book-demo/step-3/page.tsx`       | Appeler nouvelle API `/api/book-demo/step3`             |
| `app/[locale]/(public)/book-demo/confirmation/page.tsx` | Appeler nouvelle API                                    |

### Fichiers Inchangés (Phase 6 - Plus tard)

| Fichier                                   | Raison                             |
| ----------------------------------------- | ---------------------------------- |
| `app/api/demo-leads/route.ts`             | Garde `full_form` mode pour legacy |
| `app/api/crm/leads/verify-email/route.ts` | Deprecated mais actif              |
| `app/api/crm/leads/resend-code/route.ts`  | Deprecated mais actif              |

---

## 10. VALIDATION REQUISE

**Pour procéder, confirmer:**

1. ✅ Architecture cible validée
2. ✅ Ordre d'exécution validé
3. ✅ Risques acceptés
4. ✅ Plan de test accepté

**Commande pour lancer l'implémentation:**

```
OK LANCE PHASE 1
```
