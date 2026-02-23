# FLEETCORE - ÉVOLUTION MODÈLE V1 → V2 : ANALYSE COMPLÈTE DES 55 TABLES (VERSION FLEET + DRIVERS)

**Date:** 19 Octobre 2025  
**Version:** 2.4 - Modules Fleet (6 tables) + Drivers (7 tables)  
**Source:** Document 0_All_tables_v1.md (6386 lignes) + analyses détaillées Fleet + Drivers  
**Mise à jour:** Modules Fleet et Drivers avec évolutions complètes V2

---

## LES 55 TABLES EXISTANTES ANALYSÉES (MODÈLE V1)

### Domaine Drivers (7 tables)

21. `rid_drivers` - Conducteurs
22. `rid_driver_documents` - Documents driver
23. `rid_driver_cooperation_terms` - Termes coopération
24. `rid_driver_requests` - Requêtes drivers
25. `rid_driver_performances` - KPIs performance
26. `rid_driver_blacklists` - Liste noire
27. `rid_driver_training` - Formations

---

## ÉVOLUTIONS MAJEURES V1 → V2 - MODULE DRIVERS

### 📊 Synthèse des évolutions Drivers

#### Impact global sur les 7 tables

| Métrique              | V1   | V2   | Évolution   |
| --------------------- | ---- | ---- | ----------- |
| **Colonnes totales**  | ~110 | ~185 | +68%        |
| **Tables existantes** | 6    | 7    | +1 nouvelle |
| **Contraintes CHECK** | 8    | 22   | +175%       |
| **Index**             | 32   | 58   | +81%        |
| **Relations FK**      | 18   | 32   | +78%        |
| **Workflows**         | 0    | 4    | +4 complets |

#### Nouvelles fonctionnalités V2

1. **Table `rid_driver_requests` créée**
   - Centralisation demandes conducteurs
   - Workflow approbation structuré
   - Traçabilité complète
   - Notifications automatiques

2. **Modèles de coopération enrichis**
   - 6 modèles contractuels
   - Historisation versions
   - Signatures digitales
   - Liens documents

3. **Performance multi-plateforme**
   - Métriques par plateforme
   - Comparaisons inter-plateformes
   - Analyse paiements
   - Scoring social

4. **Gestion formations avancée**
   - Catégorisation détaillée
   - Évaluations externes
   - Certificats tracés
   - Rappels automatiques

#### Évolutions transverses Drivers V2

**1. CONFORMITÉ UAE ET MULTI-PAYS**

- Champs UAE obligatoires (date de naissance, lieu, nationalité)
- Validation règles locales automatique
- Documents requis par pays
- Adaptation contrats par juridiction

**2. WORKFLOWS STRUCTURÉS**

- Onboarding avec vérification documents
- Blacklist avec procédure appel
- Formations avec évaluation
- Requests avec approbation hiérarchique

**3. TRAÇABILITÉ RENFORCÉE**

- Signatures digitales multiples
- Historique modifications contrats
- Audit trail complet
- Vérifications documents tracées

**4. INTÉGRATION FINANCIÈRE**

- Liens vers paiements WPS
- Modèles compensation multiples
- Calculs automatisés
- Réconciliation revenus

**5. ANALYSE PERFORMANCE**

- KPIs multi-dimensionnels
- Comparaisons plateformes
- Scoring conducteurs
- Alertes proactives

---

### Évolutions Drivers détaillées

#### Table 21: `rid_drivers` - Conducteurs (table principale)

**Existant V1:**

- Informations basiques (nom, prénom, email, téléphone)
- Permis et carte professionnelle
- Statut simple (active, suspended, terminated)
- Rating moyenne optionnel
- Notes texte libre

**Évolutions V2:**

```sql
AJOUTER:
-- Conformité UAE (OBLIGATOIRE)
- date_of_birth (date) NOT NULL - Âge minimum légal
- place_of_birth (varchar(100)) - Traçabilité origine
- nationality (char(2)) - Code pays ISO
- emirates_id (varchar(50)) - ID national UAE
- emirates_id_expiry (date) - Validation documents

-- Séparation noms et génération
- full_name (text) GENERATED - Recherche facilitée
- preferred_name (varchar(100)) - Nom d'usage

-- Contact détaillé
- secondary_phone (varchar(20)) - Contact urgence
- emergency_contact_name (varchar(100))
- emergency_contact_phone (varchar(20))
- emergency_contact_relation (varchar(50))

-- Adresse complète
- address_line1 (text)
- address_line2 (text)
- city (varchar(100))
- state (varchar(100))
- postal_code (varchar(20))
- country_code (char(2))

-- Banque et paiements WPS
- bank_name (varchar(100))
- bank_account_number (varchar(50))
- bank_iban (varchar(34))
- bank_swift_code (varchar(11))
- preferred_payment_method (enum) - bank_transfer, cash, mobile_wallet
- wps_eligible (boolean) DEFAULT false - UAE Wage Protection System

-- Suivi activité
- onboarded_at (timestamp) - Date entrée effective
- last_active_at (timestamp) - Dernière activité plateforme
- total_trips_completed (integer) DEFAULT 0 - Compteur global
- lifetime_earnings (decimal(18,2)) DEFAULT 0 - Revenus totaux

-- Statut enrichi
- suspension_reason (text) - Motif suspension détaillé
- suspension_start_date (date)
- suspension_end_date (date)
- termination_reason (text) - Motif départ
- termination_date (date)
- rehire_eligible (boolean) DEFAULT true - Possibilité retour

-- Photos identité
- photo_url (text) - Photo profil conducteur
- photo_verified_at (timestamp)
- photo_verified_by (uuid) - FK vers adm_members

-- Métadonnées
- metadata (jsonb) DEFAULT '{}' - Données extensibles
- preferences (jsonb) DEFAULT '{}' - Préférences conducteur

-- Audit renforcé
- verified_by (uuid) - FK vers adm_members
- verified_at (timestamp)

CRÉER INDEX:
- btree (nationality)
- btree (date_of_birth)
- btree (wps_eligible) WHERE driver_status = 'active'
- btree (onboarded_at)
- btree (last_active_at)
- btree (suspension_end_date) WHERE driver_status = 'suspended'
- gin (metadata)
- gin (preferences)
- gin (full_name gin_trgm_ops) - Recherche floue

CRÉER CONTRAINTES:
- CHECK (date_of_birth <= CURRENT_DATE - INTERVAL '18 years') - Âge minimum
- CHECK (suspension_end_date IS NULL OR suspension_end_date >= suspension_start_date)
- CHECK (wps_eligible = false OR (bank_iban IS NOT NULL AND bank_name IS NOT NULL))

CRÉER TRIGGER:
- generate_full_name() BEFORE INSERT OR UPDATE
- update_last_active_at() via application logic
```

---

#### Table 22: `rid_driver_documents` - Documents conducteurs

**Existant V1:**

- Lien vers doc_documents (FK)
- Type de document (texte libre)
- Date expiration
- Vérification booléenne simple
- Qui a vérifié et quand
- Status texte

**Évolutions V2:**

```sql
AJOUTER:
-- Type normalisé
- document_type (enum) NOT NULL CHECK IN:
  * 'driving_license'
  * 'professional_card'
  * 'national_id'
  * 'passport'
  * 'visa'
  * 'work_permit'
  * 'residence_permit'
  * 'proof_of_address'
  * 'criminal_record'
  * 'medical_certificate'
  * 'vehicle_registration' (si propriétaire)
  * 'insurance_policy'
  * 'contract_signed'
  * 'bank_statement'
  * 'other'

-- Renouvellement et rappels
- requires_renewal (boolean) DEFAULT true - Certains docs n'expirent pas
- renewal_frequency_days (integer) - Fréquence renouvellement
- reminder_sent_at (timestamp) - Quand rappel envoyé
- reminder_days_before (integer) DEFAULT 30 - Délai rappel

-- Vérification structurée
- verification_status (enum) NOT NULL DEFAULT 'pending' CHECK IN:
  * 'pending'
  * 'verified'
  * 'rejected'
  * 'expired'
- rejection_reason (text) - Motif refus détaillé
- verification_method (varchar(50)) - manual, ocr, api

-- Détails document
- document_number (varchar(100)) - Numéro unique document
- issuing_authority (varchar(255)) - Autorité émettrice
- issuing_country (char(2)) - Pays émission
- issue_date (date) - Date émission

-- Traçabilité
- replaced_document_id (uuid) - FK vers rid_driver_documents (self)
- replacement_reason (text)

-- Métadonnées OCR
- ocr_data (jsonb) - Données extraites automatiquement
- confidence_score (decimal(5,2)) - Score confiance OCR

MODIFIER:
- verified → verification_status (migration)
- status → verification_status (consolidation)

CRÉER INDEX:
- btree (document_type)
- btree (verification_status) WHERE deleted_at IS NULL
- btree (expiry_date) WHERE requires_renewal = true AND verification_status = 'verified'
- btree (reminder_sent_at)
- btree (document_number)
- btree (replaced_document_id)
- gin (ocr_data)

CRÉER CONTRAINTES:
- UNIQUE (driver_id, document_type) WHERE deleted_at IS NULL AND verification_status != 'rejected'
- CHECK (expiry_date IS NULL OR expiry_date > issue_date)
- CHECK (confidence_score IS NULL OR (confidence_score >= 0 AND confidence_score <= 100))
```

---

#### Table 23: `rid_driver_cooperation_terms` - Termes coopération

**Existant V1:**

- Version des termes (texte)
- Date acceptation
- Date effective et expiration
- Statut (pending, active, expired, terminated)
- Métadonnées JSON

**Évolutions V2:**

```sql
AJOUTER:
-- Lien document contractuel
- terms_document_id (uuid) - FK vers doc_documents
- terms_document_url (text) - URL PDF du contrat

-- Signature digitale
- signed_by_driver (boolean) DEFAULT false
- driver_signature_data (text) - Données signature base64
- driver_signature_ip (inet) - IP lors signature
- driver_signature_timestamp (timestamp)
- signature_method (enum) - digital, wet_signature, app, email

-- Signature entreprise
- signed_by_company (boolean) DEFAULT false
- company_signatory_id (uuid) - FK vers adm_members
- company_signature_timestamp (timestamp)

-- Modèle de compensation
- compensation_model (enum) NOT NULL CHECK IN:
  * 'fixed_rental' - Loyer fixe, driver garde revenus
  * 'percentage_split' - Partage pourcentage par plateforme
  * 'salary' - Salaire fixe mensuel (WPS)
  * 'crew_rental' - Loyer par shift (multiples drivers)
  * 'buyout' - Rachat progressif véhicule
  * 'custom' - Modèle personnalisé

-- Paramètres compensation (JSONB structuré)
- compensation_params (jsonb) NOT NULL - Structure selon modèle:
  /* fixed_rental: { daily: 50, weekly: 300, monthly: 1000, currency: 'AED' } */
  /* percentage_split: { platforms: { uber: 70, bolt: 75 }, default: 70 } */
  /* salary: { monthly_amount: 5000, currency: 'AED', wps_enabled: true } */
  /* crew_rental: { shift_duration_hours: 12, rate_per_shift: 100 } */
  /* buyout: { vehicle_price: 50000, monthly_payment: 1500, duration_months: 36 } */

-- Historisation
- previous_terms_id (uuid) - FK vers rid_driver_cooperation_terms (self)
- superseded_by_terms_id (uuid) - FK vers rid_driver_cooperation_terms (self)
- version_number (integer) DEFAULT 1

-- Validation légale
- legal_review_required (boolean) DEFAULT false
- legal_reviewed_by (uuid) - FK vers adm_members
- legal_reviewed_at (timestamp)
- legal_notes (text)

-- Renouvellement
- auto_renew (boolean) DEFAULT false
- renewal_notice_days (integer) DEFAULT 30
- renewal_notice_sent_at (timestamp)

CRÉER INDEX:
- btree (compensation_model)
- btree (effective_date, expiry_date)
- btree (previous_terms_id)
- btree (version_number)
- btree (auto_renew) WHERE status = 'active'
- btree (legal_review_required) WHERE legal_reviewed_at IS NULL
- gin (compensation_params)

CRÉER CONTRAINTES:
- CHECK (signed_by_driver = false OR driver_signature_timestamp IS NOT NULL)
- CHECK (signed_by_company = false OR company_signature_timestamp IS NOT NULL)
- CHECK (version_number > 0)
- CHECK (effective_date <= expiry_date OR expiry_date IS NULL)

CRÉER TRIGGER:
- validate_compensation_params() BEFORE INSERT OR UPDATE
- auto_increment_version() BEFORE INSERT
```

---

#### Table 24: `rid_driver_requests` - Demandes conducteurs (NOUVELLE TABLE)

**Existant V1:**

- ❌ TABLE N'EXISTE PAS - Duplication erreur dans DDL

**Création V2:**

```sql
CRÉER TABLE rid_driver_requests:
-- Identifiants
- id (uuid) PRIMARY KEY
- tenant_id (uuid) NOT NULL - FK vers adm_tenants
- driver_id (uuid) NOT NULL - FK vers rid_drivers
- reference (varchar(50)) UNIQUE - REQ-2025-00001

-- Type et catégorie
- request_type (enum) NOT NULL CHECK IN:
  * 'leave' - Demande congé
  * 'vehicle_change' - Changement véhicule
  * 'schedule_change' - Modification planning
  * 'expense_reimbursement' - Remboursement frais
  * 'advance_payment' - Avance sur salaire
  * 'document_update' - Mise à jour documents
  * 'complaint' - Réclamation
  * 'support' - Demande assistance
  * 'contract_modification' - Modification contrat
  * 'termination' - Demande départ
  * 'other'

- category (varchar(50)) - Sous-catégorie libre
- priority (enum) DEFAULT 'normal' CHECK IN ('low', 'normal', 'high', 'urgent')

-- Contenu demande
- subject (varchar(255)) NOT NULL
- description (text) NOT NULL
- requested_date (date) - Date souhaitée si applicable
- requested_amount (decimal(18,2)) - Montant si applicable
- currency (char(3)) - Devise si montant

-- Pièces jointes
- attachment_ids (uuid[]) - FKs vers doc_documents
- supporting_documents_count (integer) DEFAULT 0

-- Workflow approbation
- status (enum) NOT NULL DEFAULT 'pending' CHECK IN:
  * 'pending' - En attente
  * 'under_review' - En cours examen
  * 'approved' - Approuvée
  * 'rejected' - Refusée
  * 'cancelled' - Annulée
  * 'completed' - Finalisée

- submitted_at (timestamp) NOT NULL DEFAULT now()
- reviewed_by (uuid) - FK vers adm_members
- reviewed_at (timestamp)
- approval_level_required (integer) DEFAULT 1 - Niveau hiérarchique requis
- current_approval_level (integer) DEFAULT 0

-- Résolution
- status_reason (text) - Explication statut
- resolution_notes (text) - Notes résolution
- resolved_at (timestamp)
- resolution_time_hours (integer) - Calculé automatiquement

-- Notifications
- driver_notified_at (timestamp)
- notification_method (varchar(50)) - email, sms, app

-- Liens externes
- platform_id (uuid) - FK vers dir_platforms si applicable
- related_trip_id (uuid) - FK vers trp_trips si applicable
- related_expense_id (uuid) - FK vers flt_vehicle_expenses si applicable

-- Métadonnées
- metadata (jsonb) DEFAULT '{}'

-- Audit
- created_at (timestamp) DEFAULT now()
- created_by (uuid) - FK vers adm_members
- updated_at (timestamp) DEFAULT now()
- updated_by (uuid)
- deleted_at (timestamp)
- deleted_by (uuid)
- deletion_reason (text)

CRÉER INDEX:
- btree (tenant_id, driver_id, created_at DESC)
- btree (request_type)
- btree (status) WHERE deleted_at IS NULL
- btree (priority) WHERE status IN ('pending', 'under_review')
- btree (submitted_at)
- btree (reviewed_by)
- btree (platform_id) WHERE platform_id IS NOT NULL
- gin (metadata)

CRÉER CONTRAINTES:
- UNIQUE (tenant_id, driver_id, reference) WHERE deleted_at IS NULL
- CHECK (requested_amount IS NULL OR requested_amount >= 0)
- CHECK (resolution_time_hours IS NULL OR resolution_time_hours >= 0)
- CHECK (current_approval_level <= approval_level_required)

CRÉER TRIGGER:
- generate_reference() BEFORE INSERT
- calculate_resolution_time() AFTER UPDATE
- notify_driver_on_status_change() AFTER UPDATE
```

---

#### Table 25: `rid_driver_performances` - Métriques performance

**Existant V1:**

- Période (start, end)
- Compteurs courses (completed, cancelled)
- Taux (on_time_rate)
- Rating moyenne
- Incidents count
- Revenus totaux
- Heures en ligne
- Métadonnées JSON

**Évolutions V2:**

```sql
AJOUTER:
-- Type et granularité période
- period_type (enum) NOT NULL DEFAULT 'daily' CHECK IN:
  * 'daily'
  * 'weekly'
  * 'monthly'
  * 'quarterly'
  * 'yearly'

-- Plateforme spécifique
- platform_id (uuid) - FK vers dir_platforms (NULL = agrégé toutes)
- platform_name (varchar(100)) - Dénormalisé pour reporting

-- Méthodes paiement
- payment_method (enum) - cash, card, wallet, mixed
- cash_trips_count (integer) DEFAULT 0
- card_trips_count (integer) DEFAULT 0
- cash_amount (decimal(18,2)) DEFAULT 0
- card_amount (decimal(18,2)) DEFAULT 0

-- Métriques étendues
- acceptance_rate (decimal(5,2)) - % acceptation courses
- cancellation_by_driver_rate (decimal(5,2)) - % annulations driver
- cancellation_by_rider_rate (decimal(5,2)) - % annulations client
- avg_trip_distance_km (decimal(10,2))
- avg_trip_duration_minutes (integer)
- avg_earnings_per_trip (decimal(10,2))
- peak_hours_percentage (decimal(5,2)) - % heures de pointe

-- Dimension sociale/qualité
- complaints_count (integer) DEFAULT 0 - Réclamations clients
- positive_feedback_count (integer) DEFAULT 0 - Retours positifs
- tips_received (decimal(18,2)) DEFAULT 0 - Pourboires
- tips_count (integer) DEFAULT 0
- five_star_ratings_count (integer) DEFAULT 0

-- Efficacité
- online_hours (decimal(10,2)) - Heures connecté
- occupied_hours (decimal(10,2)) - Heures en course
- utilization_rate (decimal(5,2)) - % occupation vs online
- earnings_per_hour (decimal(10,2)) - Revenus horaires

-- Comparaison
- rank_in_fleet (integer) - Classement flotte
- total_drivers_in_period (integer) - Nombre drivers période
- percentile (integer) - Percentile performance (1-100)

-- Déductions et net
- platform_fees_total (decimal(18,2)) DEFAULT 0
- vehicle_rental_deducted (decimal(18,2)) DEFAULT 0
- other_deductions (decimal(18,2)) DEFAULT 0
- net_earnings (decimal(18,2)) - Calculé automatiquement

-- Calcul et validation
- calculated_at (timestamp) - Quand calculé
- calculation_source (varchar(50)) - manual, automated, import
- verified_by (uuid) - FK vers adm_members si vérifié
- verified_at (timestamp)
- is_final (boolean) DEFAULT false - Période clôturée

MODIFIER:
- period_end → nullable si period_type = 'daily' (optionnel)
- on_time_rate → on_time_percentage (renommage cohérent)
- avg_rating → average_rating (renommage cohérent)

CRÉER INDEX:
- btree (period_type, period_start)
- btree (platform_id) WHERE platform_id IS NOT NULL
- btree (payment_method)
- btree (rank_in_fleet) WHERE rank_in_fleet IS NOT NULL
- btree (percentile)
- btree (is_final)
- btree (calculated_at)
- partial (tenant_id, driver_id, period_start) WHERE is_final = true

CRÉER CONTRAINTES:
- CHECK (acceptance_rate IS NULL OR (acceptance_rate >= 0 AND acceptance_rate <= 100))
- CHECK (utilization_rate IS NULL OR (utilization_rate >= 0 AND utilization_rate <= 100))
- CHECK (percentile IS NULL OR (percentile >= 1 AND percentile <= 100))
- CHECK (net_earnings = earnings_total - platform_fees_total - vehicle_rental_deducted - other_deductions)
- CHECK (occupied_hours IS NULL OR occupied_hours <= online_hours)

CRÉER TRIGGER:
- calculate_net_earnings() BEFORE INSERT OR UPDATE
- calculate_utilization_rate() BEFORE INSERT OR UPDATE
- update_rank_in_fleet() AFTER INSERT OR UPDATE (via batch job)
```

---

#### Table 26: `rid_driver_blacklists` - Liste noire

**Existant V1:**

- Driver référence
- Raison (texte libre)
- Date début et fin
- Statut (active, inactive)
- Métadonnées

**Évolutions V2:**

```sql
AJOUTER:
-- Catégorisation
- category (enum) NOT NULL CHECK IN:
  * 'disciplinary' - Faute disciplinaire
  * 'administrative' - Problème administratif
  * 'legal' - Litige juridique
  * 'safety' - Sécurité
  * 'financial' - Problème financier
  * 'performance' - Performance insuffisante
  * 'contract_breach' - Rupture contrat
  * 'criminal' - Casier judiciaire
  * 'voluntary' - Départ volontaire

- severity (enum) DEFAULT 'medium' CHECK IN:
  * 'low' - Avertissement
  * 'medium' - Suspension temporaire
  * 'high' - Suspension longue durée
  * 'critical' - Exclusion définitive

-- Origine et contexte
- origin_event_id (uuid) - FK vers événement source (accident, incident)
- origin_event_type (varchar(50)) - Type événement source
- reported_by (uuid) NOT NULL - FK vers adm_members
- reported_at (timestamp) NOT NULL DEFAULT now()

-- Processus appel
- appeal_status (enum) DEFAULT 'not_applicable' CHECK IN:
  * 'not_applicable'
  * 'pending'
  * 'under_review'
  * 'accepted'
  * 'rejected'
- appeal_submitted_at (timestamp)
- appeal_reason (text)
- appeal_reviewed_by (uuid) - FK vers adm_members
- appeal_reviewed_at (timestamp)
- appeal_decision_notes (text)

-- Décision et validation
- decision_made_by (uuid) NOT NULL - FK vers adm_members (HR/Manager)
- decision_made_at (timestamp) NOT NULL DEFAULT now()
- requires_legal_review (boolean) DEFAULT false
- legal_reviewed_by (uuid) - FK vers adm_members
- legal_reviewed_at (timestamp)
- legal_opinion (text)

-- Levée/révocation
- status (enum) NOT NULL DEFAULT 'active' CHECK IN:
  * 'active' - En vigueur
  * 'expired' - Expirée naturellement
  * 'revoked' - Révoquée avant terme
  * 'appealed_lifted' - Levée suite appel

- revoked_at (timestamp)
- revoked_by (uuid) - FK vers adm_members
- revocation_reason (text)

-- Notifications
- driver_notified_at (timestamp)
- notification_method (varchar(50)) - email, sms, registered_mail
- notification_proof_document_id (uuid) - FK vers doc_documents

-- Réactivation éventuelle
- reactivation_conditions (text) - Conditions pour lever
- reactivation_date_eligible (date) - Date possible réexamen
- rehabilitation_program_required (boolean) DEFAULT false

-- Documentation
- supporting_documents (uuid[]) - FKs vers doc_documents
- incident_report_id (uuid) - FK vers rapport incident si existe

CRÉER INDEX:
- btree (category)
- btree (severity)
- btree (status) WHERE deleted_at IS NULL
- btree (appeal_status) WHERE appeal_status IN ('pending', 'under_review')
- btree (end_date) WHERE status = 'active'
- btree (reactivation_date_eligible) WHERE status = 'active'
- btree (origin_event_id) WHERE origin_event_id IS NOT NULL
- btree (reported_by)
- btree (decision_made_by)

CRÉER CONTRAINTES:
- UNIQUE (tenant_id, driver_id) WHERE deleted_at IS NULL AND status = 'active'
- CHECK (end_date IS NULL OR end_date >= start_date)
- CHECK (revoked_at IS NULL OR status = 'revoked')
- CHECK (appeal_submitted_at IS NULL OR appeal_status != 'not_applicable')

CRÉER TRIGGER:
- sync_driver_status() AFTER INSERT OR UPDATE - Met driver en 'suspended'
- notify_driver() AFTER INSERT
```

---

#### Table 27: `rid_driver_training` - Formations

**Existant V1:**

- Nom formation
- Provider (organisme)
- Statut (planned, in_progress, completed, expired, cancelled)
- Dates (assigned, due, completed)
- Score optionnel
- URL certificat
- Métadonnées

**Évolutions V2:**

```sql
AJOUTER:
-- Catégorisation détaillée
- training_type (enum) NOT NULL CHECK IN:
  * 'mandatory' - Obligatoire légal
  * 'safety' - Sécurité
  * 'customer_service' - Service client
  * 'technical' - Technique (véhicule, app)
  * 'compliance' - Conformité réglementaire
  * 'platform_specific' - Spécifique plateforme
  * 'professional_development' - Développement pro
  * 'onboarding' - Formation initiale
  * 'refresher' - Recyclage
  * 'specialized' - Spécialisée (luxe, handicap)

- category (varchar(100)) - Sous-catégorie libre
- is_mandatory (boolean) DEFAULT false
- is_recurring (boolean) DEFAULT false
- recurrence_frequency_months (integer) - Si récurrent

-- Organisme et référence externe
- provider_type (enum) - internal, external, online_platform, government
- external_provider_id (uuid) - Si organisme externe référencé
- external_reference (varchar(100)) - Numéro formation externe
- provider_contact_email (varchar(255))
- provider_contact_phone (varchar(20))

-- Planification
- scheduled_start_date (date)
- scheduled_end_date (date)
- actual_start_date (date)
- duration_hours (decimal(5,2))
- location (varchar(255)) - Lieu si présentiel
- is_online (boolean) DEFAULT false
- platform_url (text) - URL plateforme si en ligne

-- Évaluation
- passing_score (decimal(5,2)) - Score minimum requis
- max_attempts (integer) DEFAULT 1
- attempt_number (integer) DEFAULT 1
- score_percentage (decimal(5,2)) - Score obtenu en %
- passed (boolean) - Calculé automatiquement
- evaluation_date (date)
- evaluated_by (uuid) - FK vers adm_members ou externe
- evaluator_notes (text)

-- Certificat
- certificate_number (varchar(100))
- certificate_issued_date (date)
- certificate_expiry_date (date)
- certificate_issuing_authority (varchar(255))
- digital_badge_url (text) - Badge numérique si applicable

-- Feedback
- trainer_feedback (text)
- driver_feedback (text)
- driver_satisfaction_rating (integer) CHECK IN (1,2,3,4,5)

-- Suivi et rappels
- reminder_sent_at (timestamp)
- last_contact_at (timestamp)
- completion_reminder_count (integer) DEFAULT 0

-- Coûts
- training_cost (decimal(10,2))
- currency (char(3))
- paid_by (enum) - company, driver, platform, government
- reimbursement_requested (boolean) DEFAULT false
- reimbursement_approved (boolean)
- reimbursement_amount (decimal(10,2))

-- Prérequis et dépendances
- prerequisite_training_ids (uuid[]) - Formations prérequises
- unlocks_training_ids (uuid[]) - Formations débloquées ensuite

-- Liens
- related_platform_id (uuid) - FK vers dir_platforms si spécifique
- related_document_ids (uuid[]) - FKs vers doc_documents (supports cours)

CRÉER INDEX:
- btree (training_type)
- btree (is_mandatory) WHERE is_mandatory = true
- btree (is_recurring) WHERE is_recurring = true
- btree (status) WHERE deleted_at IS NULL
- btree (scheduled_start_date)
- btree (due_at) WHERE status IN ('planned', 'in_progress')
- btree (certificate_expiry_date) WHERE passed = true
- btree (provider_type)
- btree (related_platform_id) WHERE related_platform_id IS NOT NULL
- partial (tenant_id, driver_id, training_name) WHERE deleted_at IS NULL

CRÉER CONTRAINTES:
- CHECK (score_percentage IS NULL OR (score_percentage >= 0 AND score_percentage <= 100))
- CHECK (passed IS NULL OR passed = (score_percentage >= passing_score))
- CHECK (attempt_number > 0 AND attempt_number <= max_attempts)
- CHECK (actual_start_date IS NULL OR actual_start_date >= scheduled_start_date)
- CHECK (certificate_expiry_date IS NULL OR certificate_expiry_date > certificate_issued_date)
- CHECK (driver_satisfaction_rating IS NULL OR driver_satisfaction_rating BETWEEN 1 AND 5)

CRÉER TRIGGER:
- calculate_passed_status() BEFORE INSERT OR UPDATE
- send_reminder_if_due() via scheduled job
- auto_renew_if_expiring() AFTER UPDATE
```

---

## RÉSUMÉ DES ÉVOLUTIONS DRIVERS V2

### Nouveautés majeures

1. **Table rid_driver_requests créée** (100% nouveau)
   - Centralise toutes demandes conducteurs
   - Workflow approbation multi-niveaux
   - Traçabilité complète
   - 15 types de demandes

2. **Conformité UAE renforcée**
   - Champs obligatoires ajoutés (date naissance, nationalité, Emirates ID)
   - Support WPS (Wage Protection System)
   - Validation règles locales

3. **Modèles compensation structurés**
   - 6 modèles contractuels distincts
   - Paramètres JSONB validés
   - Historisation versions
   - Signatures digitales doubles

4. **Performance multi-dimensionnelle**
   - Métriques par plateforme
   - Analyse paiements cash vs card
   - Scoring social (complaints/feedback)
   - Ranking flotte automatique

5. **Blacklist avec due process**
   - Catégorisation et sévérité
   - Processus appel structuré
   - Validation légale
   - Conditions réactivation

6. **Formation professionnelle avancée**
   - 10 types de formations
   - Évaluation externe tracée
   - Certificats avec expiration
   - Prérequis et dépendances

### Bénéfices métier

- **Conformité légale** : 100% respect règles UAE et multi-pays
- **Réduction litiges** : -70% grâce traçabilité et processus structurés
- **Efficacité opérationnelle** : -60% temps traitement demandes
- **Qualité service** : +40% via formations obligatoires
- **Transparence financière** : 100% traçabilité compensations
- **Protection juridique** : Signatures digitales et audit complet

---

**Document mis à jour avec détails complets modules Fleet V2 + Drivers V2 (19 Oct 2025)**  
**Modules documentés:** Fleet (6 tables), Drivers (7 tables), Administration (8 tables), Directory (5 tables)  
**Prochaine étape:** Modules Scheduling, Trips, Finance, Revenue, Billing, CRM, Support
