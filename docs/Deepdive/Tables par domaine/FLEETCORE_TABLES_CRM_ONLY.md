# FLEETCORE - TABLES CRM V6.4 : ANALYSE COMPLÈTE

**Date:** 20 Janvier 2026
**Version:** 6.4.0 - Document mis à jour avec schéma actuel
**Statut:** VALIDÉ - Reflète l'implémentation production

---

## SOMMAIRE

1. [Vue d'ensemble](#vue-densemble)
2. [Table crm_leads](#table-crm_leads)
3. [Table crm_waitlist](#table-crm_waitlist)
4. [Table crm_countries](#table-crm_countries)
5. [Table crm_lead_activities](#table-crm_lead_activities)
6. [Table crm_lead_sources](#table-crm_lead_sources)
7. [Table crm_settings](#table-crm_settings)
8. [Tables annexes](#tables-annexes)
9. [Évolutions V6.3 → V6.4](#évolutions-v63--v64)

---

## Vue d'ensemble

### Tables principales CRM

| Table | Description | Lignes estimées | Criticité |
|-------|-------------|-----------------|-----------|
| `crm_leads` | Prospects et leads | 10K+ | CRITIQUE |
| `crm_waitlist` | Inscriptions waitlist pays non opérationnels | 1K+ | HAUTE |
| `crm_countries` | Référentiel pays avec config | 200+ | HAUTE |
| `crm_lead_activities` | Historique activités sur leads | 50K+ | HAUTE |
| `crm_lead_sources` | Sources d'acquisition | 20 | MOYENNE |
| `crm_settings` | Configuration CRM dynamique | 50 | CRITIQUE |

### Relations principales

```
crm_leads
    ├── country_code → crm_countries
    ├── source_id → crm_lead_sources
    ├── assigned_to → adm_provider_employees
    └── tenant_id → adm_tenants (après conversion)

crm_waitlist
    ├── country_code → crm_countries
    └── lead_id → crm_leads (après lancement pays)

crm_lead_activities
    ├── lead_id → crm_leads
    └── performed_by → adm_members
```

---

## Table crm_leads

### Description

Table principale des prospects. Stocke toutes les informations collectées via le wizard Book Demo, le suivi commercial, et le processus de conversion.

### Schéma complet

```sql
CREATE TABLE crm_leads (
    -- ============================================
    -- IDENTIFIANTS
    -- ============================================
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_code VARCHAR(50) UNIQUE,
    -- Format: LEAD-{YEAR}-{SEQUENCE} ex: LEAD-2026-00001

    -- ============================================
    -- CONTACT
    -- ============================================
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    -- Format E.164: +33612345678

    -- ============================================
    -- ENTREPRISE
    -- ============================================
    company_name VARCHAR(255),
    industry TEXT,
    company_size VARCHAR(50),
    -- Ex: "1-10", "11-50", "51-200", "201-500", "500+"
    website_url TEXT,
    linkedin_url TEXT,
    city TEXT,

    -- ============================================
    -- BUSINESS
    -- ============================================
    fleet_size VARCHAR(50),
    -- Ex: "1", "2-5", "6-10", "11-20", "21-50", "51-100", "100+"
    current_software TEXT,
    -- Logiciel actuel utilisé
    platforms_used TEXT[],
    -- Array: ['uber', 'bolt', 'heetch', 'careem', 'freenow', 'other']

    -- ============================================
    -- GÉOGRAPHIE
    -- ============================================
    country_code CHAR(2),
    -- FK → crm_countries (ISO 3166-1 alpha-2)

    -- ============================================
    -- STATUT & PIPELINE
    -- ============================================
    status VARCHAR(50) DEFAULT 'new',
    -- Valeurs: new, demo, proposal_sent, payment_pending,
    --          converted, lost, nurturing, disqualified
    lead_stage VARCHAR(50) DEFAULT 'top_of_funnel',
    -- Valeurs: top_of_funnel, marketing_qualified, sales_qualified
    priority VARCHAR(20) DEFAULT 'medium',
    -- Valeurs: low, medium, high, urgent (database-driven)

    -- ============================================
    -- SCORING
    -- ============================================
    qualification_score INTEGER,
    -- Score global 0-100
    qualification_notes TEXT,
    qualified_date TIMESTAMP,
    fit_score NUMERIC(5,2),
    -- Score d'adéquation au profil cible (0-100)
    engagement_score NUMERIC(5,2),
    -- Score d'engagement (0-100)
    scoring JSONB,
    -- Détail du scoring: {"fit": {...}, "engagement": {...}}

    -- ============================================
    -- FRAMEWORK CPT (Challenges, Priority, Timing)
    -- ============================================
    cpt_challenges_response TEXT,
    -- Réponse verbatim du prospect
    cpt_challenges_score VARCHAR(10),
    -- high / medium / low
    cpt_priority_response TEXT,
    cpt_priority_score VARCHAR(10),
    -- high / medium / low
    cpt_timing_response TEXT,
    cpt_timing_score VARCHAR(10),
    -- hot / warm / cool / cold
    cpt_total_score INTEGER,
    -- Score CPT calculé 0-100
    cpt_qualified_at TIMESTAMP,
    cpt_qualified_by UUID,
    -- FK → adm_provider_employees

    -- ============================================
    -- EMAIL VERIFICATION (V6.4)
    -- ============================================
    email_verified BOOLEAN DEFAULT FALSE,
    email_verification_code VARCHAR(255),
    -- bcrypt hash du code 6 chiffres
    email_verification_expires_at TIMESTAMP,
    -- NOW() + 15 minutes
    email_verification_attempts INTEGER DEFAULT 0,
    -- Max 5 tentatives

    -- ============================================
    -- CAL.COM BOOKING (V6.4)
    -- ============================================
    booking_slot_at TIMESTAMP,
    -- Date/heure du RDV planifié
    booking_confirmed_at TIMESTAMP,
    -- Quand le lead a confirmé sa présence
    booking_calcom_uid VARCHAR(255),
    -- UID Cal.com pour reschedule/cancel

    -- ============================================
    -- WIZARD (V6.4)
    -- ============================================
    wizard_completed BOOLEAN DEFAULT FALSE,
    -- TRUE après Step 3 complété

    -- ============================================
    -- J-1 REMINDER (V6.4)
    -- ============================================
    reschedule_token VARCHAR(32),
    -- Short token pour liens iOS Mail (~16 chars)
    reschedule_token_expires_at TIMESTAMP,
    -- NOW() + 7 jours
    reminder_j1_sent_at TIMESTAMP,
    -- Quand email J-1 envoyé
    attendance_confirmed_at TIMESTAMP,
    -- Quand lead a cliqué "I'll be there"

    -- ============================================
    -- CONVERSION
    -- ============================================
    converted_date TIMESTAMP,
    -- Date de conversion (legacy)
    converted_at TIMESTAMP,
    -- Timestamp exact de conversion
    tenant_id UUID,
    -- FK → adm_tenants (créé après paiement Stripe)

    -- ============================================
    -- CLOSING (Perte)
    -- ============================================
    stage_entered_at TIMESTAMP,
    -- Quand entré dans le stage actuel
    loss_reason_code VARCHAR(50),
    -- Ex: not_interested, chose_competitor, price_perception...
    loss_reason_detail TEXT,
    -- Détail supplémentaire
    competitor_name VARCHAR(255),
    -- Nom du concurrent si perdu contre

    -- ============================================
    -- GDPR COMPLIANCE
    -- ============================================
    gdpr_consent BOOLEAN,
    -- TRUE si consent donné (pays EU/EEA)
    consent_at TIMESTAMP,
    -- Quand consent donné
    consent_ip VARCHAR(45),
    -- IP du consent (IPv4 ou IPv6)

    -- ============================================
    -- SOURCE & ATTRIBUTION
    -- ============================================
    source VARCHAR(100),
    -- Ex: website, referral, linkedin, google_ads
    source_id UUID,
    -- FK → crm_lead_sources
    utm_source TEXT,
    utm_medium TEXT,
    utm_campaign TEXT,

    -- ============================================
    -- ASSIGNMENT
    -- ============================================
    assigned_to UUID,
    -- FK → adm_provider_employees (commercial assigné)
    opportunity_id UUID,
    -- FK → crm_opportunities (si opportunité créée)
    next_action_date TIMESTAMP,
    -- Prochaine action planifiée

    -- ============================================
    -- MÉTADONNÉES
    -- ============================================
    message TEXT,
    -- Message libre du prospect
    metadata JSONB DEFAULT '{}',
    -- Données additionnelles flexibles
    -- Ex: {"expansion_opportunity": true, "expansion_country": "QA"}

    -- ============================================
    -- PROVIDER
    -- ============================================
    provider_id UUID DEFAULT '7ad8173c-68c5-41d3-9918-686e4e941cc0',
    -- FK → adm_providers (FleetCore par défaut)

    -- ============================================
    -- AUDIT
    -- ============================================
    created_at TIMESTAMP DEFAULT NOW(),
    created_by UUID,
    updated_at TIMESTAMP DEFAULT NOW(),
    updated_by UUID,
    deleted_at TIMESTAMP,
    -- Soft delete
    deleted_by UUID,
    deletion_reason TEXT,
    last_activity_at TIMESTAMP,
    -- Dernière interaction

    -- ============================================
    -- CONSTRAINTS
    -- ============================================
    CONSTRAINT crm_leads_status_check CHECK (status IN (
        'new', 'demo', 'proposal_sent', 'payment_pending',
        'converted', 'lost', 'nurturing', 'disqualified'
    )),

    CONSTRAINT crm_leads_lead_stage_check CHECK (lead_stage IN (
        'top_of_funnel', 'marketing_qualified', 'sales_qualified'
    ))
);
```

### Index

```sql
-- Recherche par email (unique pour actifs)
CREATE UNIQUE INDEX idx_crm_leads_email_active
    ON crm_leads(email) WHERE deleted_at IS NULL;

-- Recherche standard
CREATE INDEX idx_crm_leads_email ON crm_leads(email);
CREATE INDEX idx_crm_leads_status ON crm_leads(status);
CREATE INDEX idx_crm_leads_country ON crm_leads(country_code);
CREATE INDEX idx_crm_leads_assigned ON crm_leads(assigned_to);
CREATE INDEX idx_crm_leads_priority ON crm_leads(priority);

-- Booking et reminders
CREATE INDEX idx_crm_leads_booking ON crm_leads(booking_slot_at);
CREATE INDEX idx_crm_leads_reschedule_token ON crm_leads(reschedule_token);

-- Lead code
CREATE INDEX idx_crm_leads_lead_code ON crm_leads(lead_code);

-- Soft delete
CREATE INDEX idx_crm_leads_deleted ON crm_leads(deleted_at);
```

### Colonnes ajoutées V6.4

| Colonne | Type | Description | Ajoutée en |
|---------|------|-------------|------------|
| `email_verified` | BOOLEAN | Email vérifié via code 6 chiffres | V6.2.2 |
| `email_verification_code` | VARCHAR(255) | Hash bcrypt du code | V6.2.2 |
| `email_verification_expires_at` | TIMESTAMP | Expiration code (15 min) | V6.2.2 |
| `email_verification_attempts` | INTEGER | Compteur tentatives (max 5) | V6.2.2 |
| `booking_slot_at` | TIMESTAMP | Date/heure RDV Cal.com | V6.2.4 |
| `booking_confirmed_at` | TIMESTAMP | Confirmation présence | V6.2.4 |
| `booking_calcom_uid` | VARCHAR(255) | UID Cal.com | V6.2.4 |
| `wizard_completed` | BOOLEAN | Wizard finalisé | V6.2.4 |
| `reschedule_token` | VARCHAR(32) | Token court iOS Mail | V6.2.9 |
| `reschedule_token_expires_at` | TIMESTAMP | Expiration token (7j) | V6.2.9 |
| `reminder_j1_sent_at` | TIMESTAMP | Email J-1 envoyé | V6.2.9 |
| `attendance_confirmed_at` | TIMESTAMP | Présence confirmée | V6.2.9 |
| `platforms_used` | TEXT[] | Plateformes utilisées | V6.2.6 |
| `consent_ip` | VARCHAR(45) | IP du consentement GDPR | V6.2.8 |

---

## Table crm_waitlist

### Description

Table des inscriptions à la liste d'attente pour les pays non opérationnels. Créée quand un prospect d'un pays où FleetCore n'est pas disponible valide son email.

### Schéma complet

```sql
CREATE TABLE crm_waitlist (
    -- ============================================
    -- IDENTIFIANTS
    -- ============================================
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- ============================================
    -- CONTACT
    -- ============================================
    email VARCHAR(255) NOT NULL,

    -- ============================================
    -- BUSINESS (collecté via survey)
    -- ============================================
    company_name VARCHAR(255),
    -- Optional, collecté dans survey
    fleet_size VARCHAR(50),
    -- Optional, collecté dans survey

    -- ============================================
    -- GEOGRAPHY
    -- ============================================
    country_code CHAR(2) NOT NULL,
    -- Pays demandé par le prospect (FK → crm_countries)
    detected_country_code CHAR(2),
    -- Pays détecté via IP (peut différer)

    -- ============================================
    -- SURVEY
    -- ============================================
    short_token VARCHAR(32) UNIQUE,
    -- Token court pour lien survey (~16 chars)
    survey_completed_at TIMESTAMP,
    -- Quand survey complété

    -- ============================================
    -- MARKETING
    -- ============================================
    marketing_consent BOOLEAN DEFAULT FALSE,
    -- Consent pour newsletters
    marketing_consent_at TIMESTAMP,

    -- ============================================
    -- LEAD LINK
    -- ============================================
    lead_id UUID,
    -- FK → crm_leads (créé quand pays devient opérationnel)

    -- ============================================
    -- NOTIFICATIONS
    -- ============================================
    notified_at TIMESTAMP,
    -- Quand notifié du lancement dans son pays

    -- ============================================
    -- AUDIT
    -- ============================================
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    -- ============================================
    -- CONSTRAINTS
    -- ============================================
    CONSTRAINT crm_waitlist_email_country_unique
        UNIQUE(email, country_code)
);
```

### Index

```sql
CREATE INDEX idx_crm_waitlist_country ON crm_waitlist(country_code);
CREATE INDEX idx_crm_waitlist_short_token ON crm_waitlist(short_token);
CREATE INDEX idx_crm_waitlist_email ON crm_waitlist(email);
CREATE INDEX idx_crm_waitlist_marketing ON crm_waitlist(marketing_consent)
    WHERE marketing_consent = TRUE;
```

### Workflow waitlist

```
1. Prospect entre email + pays non opérationnel (ex: Qatar)
2. Email verification (code 6 chiffres)
3. Redirect vers /book-demo/coming-soon
4. Clic "Join Waitlist" → POST /api/waitlist
5. Création entrée crm_waitlist avec short_token
6. Email avec lien survey: /waitlist-survey?t={short_token}
7. Survey complété → fleet_size, company_name, marketing_consent
8. [Future] Quand pays devient opérationnel:
   - Notification envoyée (notified_at)
   - Lead créé (lead_id référencé)
```

---

## Table crm_countries

### Description

Référentiel des pays avec configuration pour le wizard, GDPR, prépositions françaises, et routing des notifications.

### Schéma complet

```sql
CREATE TABLE crm_countries (
    -- ============================================
    -- IDENTIFIANT
    -- ============================================
    country_code CHAR(2) PRIMARY KEY,
    -- ISO 3166-1 alpha-2 (ex: FR, AE, US)

    -- ============================================
    -- NOMS MULTILINGUES
    -- ============================================
    country_name_en VARCHAR(100) NOT NULL,
    country_name_fr VARCHAR(100) NOT NULL,
    country_name_ar VARCHAR(100),

    -- ============================================
    -- PRÉPOSITIONS (grammaire française)
    -- ============================================
    country_preposition_fr VARCHAR(5) DEFAULT 'en',
    -- au (masculin), en (féminin), aux (pluriel)
    country_preposition_en VARCHAR(10) DEFAULT 'in',

    -- ============================================
    -- DISPLAY
    -- ============================================
    flag_emoji VARCHAR(10),
    -- Ex: 🇫🇷, 🇦🇪, 🇶🇦
    display_order INTEGER DEFAULT 999,
    -- Ordre d'affichage dans dropdown (1 = premier)

    -- ============================================
    -- OPÉRATIONNEL
    -- ============================================
    is_operational BOOLEAN DEFAULT FALSE,
    -- TRUE = FleetCore disponible dans ce pays
    is_visible BOOLEAN DEFAULT TRUE,
    -- TRUE = affiché dans dropdown public

    -- ============================================
    -- GDPR
    -- ============================================
    country_gdpr BOOLEAN DEFAULT FALSE,
    -- TRUE = pays EU/EEA nécessitant consent GDPR

    -- ============================================
    -- NOTIFICATIONS
    -- ============================================
    notification_locale VARCHAR(5),
    -- Langue par défaut: en, fr, ar

    -- ============================================
    -- TÉLÉPHONE
    -- ============================================
    dial_code VARCHAR(10),
    -- Ex: +33, +971, +974
    phone_pattern VARCHAR(50),
    -- Format attendu pour validation

    -- ============================================
    -- AUDIT
    -- ============================================
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### Index

```sql
CREATE INDEX idx_crm_countries_operational ON crm_countries(is_operational);
CREATE INDEX idx_crm_countries_gdpr ON crm_countries(country_gdpr);
CREATE INDEX idx_crm_countries_visible ON crm_countries(is_visible);
CREATE INDEX idx_crm_countries_display ON crm_countries(display_order);
```

### Données de référence

**Pays opérationnels (2)**:
```sql
INSERT INTO crm_countries (country_code, country_name_en, country_name_fr,
    is_operational, country_gdpr, country_preposition_fr, display_order)
VALUES
    ('AE', 'United Arab Emirates', 'Émirats Arabes Unis', TRUE, FALSE, 'aux', 1),
    ('FR', 'France', 'France', TRUE, TRUE, 'en', 2);
```

**Pays GDPR (30)**:
```sql
-- EU (27 pays)
UPDATE crm_countries SET country_gdpr = TRUE
WHERE country_code IN (
    'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR',
    'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL',
    'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE'
);

-- EEA (3 pays)
UPDATE crm_countries SET country_gdpr = TRUE
WHERE country_code IN ('IS', 'LI', 'NO');
```

**Prépositions françaises**:
```sql
-- Masculin (au)
UPDATE crm_countries SET country_preposition_fr = 'au'
WHERE country_code IN ('CA', 'MA', 'QA', 'GB', 'PT', 'KW', 'BH', 'OM', 'DK');

-- Pluriel (aux)
UPDATE crm_countries SET country_preposition_fr = 'aux'
WHERE country_code IN ('AE', 'US', 'NL');

-- Féminin (en) - défaut pour le reste
```

---

## Table crm_lead_activities

### Description

Historique des activités sur les leads : appels, emails, notes, meetings, tâches.

### Schéma complet

```sql
CREATE TABLE crm_lead_activities (
    -- ============================================
    -- IDENTIFIANTS
    -- ============================================
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID NOT NULL,
    -- FK → crm_leads

    -- ============================================
    -- TYPE D'ACTIVITÉ
    -- ============================================
    activity_type VARCHAR(50) NOT NULL,
    -- call, email, note, meeting, task

    -- ============================================
    -- CONTENU
    -- ============================================
    title VARCHAR(255) NOT NULL,
    description TEXT,

    -- ============================================
    -- MÉTADONNÉES TYPE-SPECIFIC
    -- ============================================
    metadata JSONB DEFAULT '{}',
    -- Pour call: {"duration": 15, "outcome": "positive"}
    -- Pour meeting: {"location": "...", "attendees": [...]}
    -- Pour email: {"subject": "...", "to": "..."}

    -- ============================================
    -- PLANIFICATION
    -- ============================================
    scheduled_at TIMESTAMP,
    -- Date prévue (pour task, meeting)
    completed_at TIMESTAMP,
    -- Date de réalisation
    is_completed BOOLEAN DEFAULT FALSE,

    -- ============================================
    -- AUTEUR
    -- ============================================
    performed_by UUID,
    -- FK → adm_members
    performed_by_name VARCHAR(255),
    -- Nom dénormalisé pour affichage

    -- ============================================
    -- AUDIT
    -- ============================================
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### Index

```sql
CREATE INDEX idx_crm_lead_activities_lead ON crm_lead_activities(lead_id);
CREATE INDEX idx_crm_lead_activities_type ON crm_lead_activities(activity_type);
CREATE INDEX idx_crm_lead_activities_created ON crm_lead_activities(created_at DESC);
CREATE INDEX idx_crm_lead_activities_scheduled ON crm_lead_activities(scheduled_at)
    WHERE scheduled_at IS NOT NULL;
```

### Types d'activités

| Type | Description | Metadata typique |
|------|-------------|------------------|
| `call` | Appel téléphonique | `{duration: 15, outcome: "positive/negative/neutral"}` |
| `email` | Email envoyé/reçu | `{subject: "...", direction: "inbound/outbound"}` |
| `note` | Note interne | `{category: "qualification/follow-up/general"}` |
| `meeting` | Réunion/démo | `{location: "...", attendees: [...], platform: "cal.com"}` |
| `task` | Tâche à faire | `{priority: "high/medium/low", due_date: "..."}` |

---

## Table crm_lead_sources

### Description

Référentiel des sources d'acquisition pour attribution marketing.

### Schéma

```sql
CREATE TABLE crm_lead_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    -- Ex: website, linkedin, google_ads, referral
    name_translations JSONB,
    -- {en: "Website", fr: "Site web", ar: "موقع إلكتروني"}
    description TEXT,
    category VARCHAR(50),
    -- organic, paid, referral, event
    is_active BOOLEAN DEFAULT TRUE,
    display_order INTEGER DEFAULT 999,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### Données initiales

```sql
INSERT INTO crm_lead_sources (name, name_translations, category) VALUES
('website', '{"en": "Website", "fr": "Site web"}', 'organic'),
('linkedin', '{"en": "LinkedIn", "fr": "LinkedIn"}', 'paid'),
('google_ads', '{"en": "Google Ads", "fr": "Google Ads"}', 'paid'),
('referral', '{"en": "Referral", "fr": "Recommandation"}', 'referral'),
('event', '{"en": "Event", "fr": "Événement"}', 'event'),
('partner', '{"en": "Partner", "fr": "Partenaire"}', 'referral');
```

---

## Table crm_settings

### Description

Configuration dynamique du module CRM (scoring, phases, statuts, etc.).

### Schéma

```sql
CREATE TABLE crm_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value JSONB NOT NULL,
    description TEXT,
    category VARCHAR(50),
    -- lead, scoring, workflow, notification
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### Settings clés V6.4

**lead_status_workflow**:
```json
{
  "version": "6.4.0",
  "statuses": [
    {"value": "new", "phase": "incomplete", "probability": 5},
    {"value": "demo", "phase": "demo", "probability": 50},
    {"value": "proposal_sent", "phase": "proposal", "probability": 85},
    {"value": "payment_pending", "phase": "proposal", "probability": 90},
    {"value": "converted", "phase": "completed", "probability": 100},
    {"value": "lost", "phase": "completed", "probability": 0},
    {"value": "nurturing", "phase": "completed", "probability": 15},
    {"value": "disqualified", "phase": "completed", "probability": 0}
  ]
}
```

**lead_phases**:
```json
{
  "phases": [
    {"key": "incomplete", "order": 1, "label_en": "Incomplete", "label_fr": "Incomplet"},
    {"key": "demo", "order": 2, "label_en": "Demo", "label_fr": "Démo"},
    {"key": "proposal", "order": 3, "label_en": "Proposal", "label_fr": "Proposition"},
    {"key": "completed", "order": 4, "label_en": "Completed", "label_fr": "Terminé"}
  ]
}
```

**email_verification_config**:
```json
{
  "code_length": 6,
  "bcrypt_cost": 10,
  "expiration_minutes": 15,
  "resend_cooldown_seconds": 60,
  "max_attempts": 5
}
```

**fleet_size_options**:
```json
{
  "options": [
    {"value": "1", "label_en": "1 vehicle", "label_fr": "1 véhicule"},
    {"value": "2-5", "label_en": "2-5 vehicles", "label_fr": "2-5 véhicules"},
    {"value": "6-10", "label_en": "6-10 vehicles", "label_fr": "6-10 véhicules"},
    {"value": "11-20", "label_en": "11-20 vehicles", "label_fr": "11-20 véhicules"},
    {"value": "21-50", "label_en": "21-50 vehicles", "label_fr": "21-50 véhicules"},
    {"value": "51-100", "label_en": "51-100 vehicles", "label_fr": "51-100 véhicules"},
    {"value": "100+", "label_en": "100+ vehicles", "label_fr": "100+ véhicules"}
  ]
}
```

---

## Tables annexes

### crm_quotes

Table des devis pour Segment 4 (21+ véhicules).

```sql
CREATE TABLE crm_quotes (
    id UUID PRIMARY KEY,
    quote_code VARCHAR(50) UNIQUE,
    lead_id UUID REFERENCES crm_leads(id),
    status VARCHAR(50), -- draft, sent, accepted, rejected, expired
    total_amount NUMERIC(12,2),
    currency CHAR(3) DEFAULT 'EUR',
    valid_until DATE,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### crm_referrals

Table des parrainages.

```sql
CREATE TABLE crm_referrals (
    id UUID PRIMARY KEY,
    referrer_lead_id UUID REFERENCES crm_leads(id),
    referred_lead_id UUID REFERENCES crm_leads(id),
    referral_code VARCHAR(50) UNIQUE,
    status VARCHAR(50), -- pending, validated, rewarded
    reward_type VARCHAR(50),
    reward_amount NUMERIC(10,2),
    created_at TIMESTAMP DEFAULT NOW()
);
```

---

## Évolutions V6.3 → V6.4

### Nouvelles colonnes crm_leads

| Colonne | Description | Migration |
|---------|-------------|-----------|
| `email_verified` | Flag email vérifié | `ALTER TABLE ADD COLUMN` |
| `email_verification_code` | Hash bcrypt code | `ALTER TABLE ADD COLUMN` |
| `email_verification_expires_at` | Expiration | `ALTER TABLE ADD COLUMN` |
| `email_verification_attempts` | Compteur | `ALTER TABLE ADD COLUMN DEFAULT 0` |
| `booking_slot_at` | Date RDV Cal.com | `ALTER TABLE ADD COLUMN` |
| `booking_confirmed_at` | Confirmation | `ALTER TABLE ADD COLUMN` |
| `booking_calcom_uid` | UID Cal.com | `ALTER TABLE ADD COLUMN` |
| `wizard_completed` | Wizard fini | `ALTER TABLE ADD COLUMN DEFAULT FALSE` |
| `reschedule_token` | Token court | `ALTER TABLE ADD COLUMN` |
| `reschedule_token_expires_at` | Expiration token | `ALTER TABLE ADD COLUMN` |
| `reminder_j1_sent_at` | J-1 envoyé | `ALTER TABLE ADD COLUMN` |
| `attendance_confirmed_at` | Présence confirmée | `ALTER TABLE ADD COLUMN` |
| `platforms_used` | Plateformes | `ALTER TABLE ADD COLUMN TEXT[]` |
| `consent_ip` | IP consentement | `ALTER TABLE ADD COLUMN VARCHAR(45)` |

### Nouvelle table crm_waitlist

Table entièrement nouvelle pour gérer les inscriptions en liste d'attente des pays non opérationnels.

### Nouvelles colonnes crm_countries

| Colonne | Description | Migration |
|---------|-------------|-----------|
| `country_gdpr` | Flag GDPR EU/EEA | `ALTER TABLE ADD COLUMN DEFAULT FALSE` |
| `country_preposition_fr` | Préposition FR | `ALTER TABLE ADD COLUMN DEFAULT 'en'` |
| `country_preposition_en` | Préposition EN | `ALTER TABLE ADD COLUMN DEFAULT 'in'` |
| `dial_code` | Indicatif tél | `ALTER TABLE ADD COLUMN` |
| `phone_pattern` | Format attendu | `ALTER TABLE ADD COLUMN` |

### Scripts de migration

```sql
-- V6.4-01: Email verification columns
ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS email_verification_code VARCHAR(255);
ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS email_verification_expires_at TIMESTAMP;
ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS email_verification_attempts INTEGER DEFAULT 0;

-- V6.4-02: Cal.com booking columns
ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS booking_slot_at TIMESTAMP;
ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS booking_confirmed_at TIMESTAMP;
ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS booking_calcom_uid VARCHAR(255);

-- V6.4-03: Wizard columns
ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS wizard_completed BOOLEAN DEFAULT FALSE;

-- V6.4-04: J-1 reminder columns
ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS reschedule_token VARCHAR(32);
ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS reschedule_token_expires_at TIMESTAMP;
ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS reminder_j1_sent_at TIMESTAMP;
ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS attendance_confirmed_at TIMESTAMP;

-- V6.4-05: Additional columns
ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS platforms_used TEXT[];
ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS consent_ip VARCHAR(45);

-- V6.4-06: crm_countries GDPR
ALTER TABLE crm_countries ADD COLUMN IF NOT EXISTS country_gdpr BOOLEAN DEFAULT FALSE;
ALTER TABLE crm_countries ADD COLUMN IF NOT EXISTS country_preposition_fr VARCHAR(5) DEFAULT 'en';

-- V6.4-07: Create crm_waitlist table
CREATE TABLE IF NOT EXISTS crm_waitlist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL,
    company_name VARCHAR(255),
    fleet_size VARCHAR(50),
    country_code CHAR(2) NOT NULL,
    detected_country_code CHAR(2),
    short_token VARCHAR(32) UNIQUE,
    survey_completed_at TIMESTAMP,
    marketing_consent BOOLEAN DEFAULT FALSE,
    marketing_consent_at TIMESTAMP,
    lead_id UUID,
    notified_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT crm_waitlist_email_country_unique UNIQUE(email, country_code)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_crm_leads_reschedule_token ON crm_leads(reschedule_token);
CREATE INDEX IF NOT EXISTS idx_crm_leads_booking ON crm_leads(booking_slot_at);
CREATE INDEX IF NOT EXISTS idx_crm_countries_gdpr ON crm_countries(country_gdpr);
CREATE INDEX IF NOT EXISTS idx_crm_waitlist_country ON crm_waitlist(country_code);
CREATE INDEX IF NOT EXISTS idx_crm_waitlist_short_token ON crm_waitlist(short_token);
```

---

## Métriques de validation

### Colonnes
- [ ] crm_leads: 60+ colonnes (vs 30 en V6.3)
- [ ] crm_waitlist: 14 colonnes (nouvelle table)
- [ ] crm_countries: 14 colonnes (vs 8 en V6.3)

### Index
- [ ] crm_leads: 10+ index
- [ ] crm_waitlist: 4 index
- [ ] crm_countries: 4 index

### Contraintes
- [ ] crm_leads: status CHECK (8 valeurs)
- [ ] crm_leads: email unique (pour actifs)
- [ ] crm_waitlist: email+country unique

---

**FIN DU DOCUMENT TABLES CRM V6.4**

_Version 6.4.0 - Schéma complet reflétant l'implémentation production_
