# FLEETCORE - STRUCTURE DÉTAILLÉE DU PLAN D'EXÉCUTION

## Vue d'ensemble chapitres et sous-chapitres

**Durée Totale :** 15 jours ouvrés (3 semaines)  
**Méthodologie :** Vertical Slicing - Livrables démontrables à chaque sprint  
**Date :** 8 Novembre 2025

---

# 📚 STRUCTURE COMPLÈTE DU PLAN

## 🎯 INTRODUCTION (Chapitres préliminaires)

### 📋 TABLE DES MATIÈRES

- Liens vers toutes les sections principales

### 🌟 INTRODUCTION

#### Contexte Projet

- État actuel (7 novembre 2025)
- Problématiques identifiées
- Infrastructures existantes

#### Objectifs du Plan

- Vision globale
- Approche verticale vs horizontale
- Bénéfices attendus

#### Méthodologie : Vertical Slicing

- Explication approche verticale
- Comparaison avec approche horizontale
- Avantages pour le sponsor

#### Périmètre Fonctionnel

- MODULE CRM (Acquisition Client)
  - Leads
  - Opportunities
  - Contracts
- MODULE ADM (Provisioning)
  - Tenants
  - Members
  - Roles
  - Audit

#### Découpage Temporel

- Tableau récapitulatif phases
- Durées par phase
- Livrables démontrables

---

## 🏗️ PHASE 0 : FONDATIONS (2 JOURS)

**Objectif Global :** Poser l'architecture technique manquante  
**Durée :** 2 jours (16 heures)  
**Livrable :** Architecture prête pour développement rapide

### ÉTAPE 0.1 : Architecture Service Layer & Patterns

**Durée :** 8 heures

#### 🎯 RATIONNEL MÉTIER

- Pourquoi cette étape
- Quel problème résolu
- Impact si absent
- Cas d'usage concret

#### 📊 DONNÉES ET RÈGLES MÉTIER

- Tables impliquées
- Règles métier à respecter
- Pattern de code attendu

#### 🏗️ COMPOSANTS À DÉVELOPPER

##### Backend (Service Layer)

- **Fichier : lib/core/base.service.ts**
  - Classe BaseService (abstraite)
  - Méthode transaction()
  - Méthode handleError()
  - Méthode softDelete()
  - Méthode restore()
  - Méthode audit()
  - Méthode validateTenant()
  - Méthode checkPermission()

- **Fichier : lib/core/base.repository.ts**
  - Classe BaseRepository (abstraite)
  - Méthode findAll()
  - Méthode findById()
  - Méthode create()
  - Méthode update()
  - Méthode softDelete()

- **Fichier : lib/core/errors.ts**
  - Classe AppError
  - Classe ValidationError
  - Classe NotFoundError
  - Classe UnauthorizedError
  - Classe ForbiddenError
  - Classe DatabaseError
  - Classe BusinessRuleError

##### API REST (Endpoints)

- Aucune API à ce stade

##### Frontend (Interface Utilisateur)

- Aucune UI à ce stade

#### 🎬 RÉSULTAT DÉMONTRABLE

- Scénario de validation
- Critères d'acceptation

#### ⏱️ ESTIMATION

- Temps backend : 8h
- Temps API : 0h
- Temps frontend : 0h
- **TOTAL : 8 heures**

#### 🔗 DÉPENDANCES

- Prérequis obligatoires
- Services/composants requis
- Données de test nécessaires

#### ✅ CHECKLIST DE VALIDATION

- Liste complète des critères

---

### ÉTAPE 0.2 : Validators Zod & Middleware Auth/RBAC

**Durée :** 6 heures

#### 🎯 RATIONNEL MÉTIER

- Pourquoi validation stricte
- Problème résolu
- Impact si absent
- Cas d'usage concret

#### 📊 DONNÉES ET RÈGLES MÉTIER

- Tables impliquées
- Règles de validation critiques
  - Pour Leads
  - Pour Opportunities
  - Pour Contracts
  - Pour Tenants
  - Pour Members

#### 🏗️ COMPOSANTS À DÉVELOPPER

##### Backend (Validators Zod)

- **Fichier : lib/validators/crm.validators.ts**
  - LeadCreateSchema
  - LeadUpdateSchema
  - LeadQualifySchema
  - OpportunityCreateSchema
  - OpportunityUpdateSchema
  - ContractCreateSchema
  - ContractUpdateSchema

- **Fichier : lib/validators/admin.validators.ts**
  - TenantCreateSchema
  - TenantUpdateSchema
  - MemberInviteSchema
  - MemberUpdateSchema
  - RoleCreateSchema
  - RoleUpdateSchema

- **Fichier : lib/middleware/auth.middleware.ts**
  - Fonction requireAuth()
  - Vérification token Clerk
  - Extraction tenant_id

- **Fichier : lib/middleware/rbac.middleware.ts**
  - Fonction requirePermission()
  - Vérification permissions RBAC
  - Gestion scopes

- **Fichier : lib/middleware/validate.middleware.ts**
  - Fonction validate()
  - Validation Zod générique

##### API REST (Endpoints)

- Aucune API à ce stade (middlewares utilisés dans sprints suivants)

##### Frontend (Interface Utilisateur)

- Aucune UI à ce stade

#### 🎬 RÉSULTAT DÉMONTRABLE

- Scénario de validation
- Tests de validation
- Critères d'acceptation

#### ⏱️ ESTIMATION

- Temps backend : 6h
- Temps API : 0h
- Temps frontend : 0h
- **TOTAL : 6 heures**

#### 🔗 DÉPENDANCES

- Prérequis obligatoires
- Services/composants requis
- Données de test nécessaires

#### ✅ CHECKLIST DE VALIDATION

- Liste complète des critères

---

### ÉTAPE 0.3 : Configuration Audit Automatique & Clerk Sync

**Durée :** 12 heures

#### 🎯 RATIONNEL MÉTIER

- Pourquoi audit obligatoire
- Obligations légales (RGPD, SOC2)
- Problème sync Clerk
- Impact si absent
- Cas d'usage concret #1 (Audit)
- Cas d'usage concret #2 (Clerk Sync)

#### 📊 DONNÉES ET RÈGLES MÉTIER

- Tables impliquées
- Règles d'audit obligatoires
  - Actions TOUJOURS auditées
  - Actions parfois auditées
  - Actions jamais auditées
  - Structure log d'audit requis
- Règles de synchronisation Clerk
  - Événements Clerk à traiter
  - Règles de mapping Clerk → FleetCore
  - Règles d'idempotence

#### 🏗️ COMPOSANTS À DÉVELOPPER

##### Backend (Services d'Audit et Sync)

- **Fichier : lib/services/admin/audit.service.ts**
  - Méthode logAction()
  - Méthode query()
  - Méthode getDiff()
  - Méthode detectSuspiciousBehavior()

- **Fichier : lib/services/admin/clerk-sync.service.ts**
  - Méthode handleUserCreated()
  - Méthode handleUserUpdated()
  - Méthode handleUserDeleted()
  - Méthode handleOrganizationCreated()
  - Méthode handleOrganizationUpdated()
  - Méthode handleOrganizationDeleted()
  - Méthode verifySync()

- **Modification : lib/core/base.service.ts**
  - Injection appels auditService dans create/update/delete

##### API REST (Endpoints)

- **Fichier : app/api/webhooks/clerk/route.ts**
  - POST /api/webhooks/clerk
  - Vérification signature Clerk
  - Routing événements

- **Fichier : app/api/v1/admin/audit/route.ts**
  - GET /api/v1/admin/audit
  - POST /api/v1/admin/audit/export

##### Frontend (Interface Utilisateur)

- Aucune UI à ce stade

#### 🎬 RÉSULTAT DÉMONTRABLE

- Test 1 : Audit automatique
- Test 2 : Sync Clerk User
- Test 3 : Sync Clerk Organization
- Test 4 : Détection comportement suspect
- Critères d'acceptation

#### ⏱️ ESTIMATION

- Temps backend : 10h
- Temps API : 2h
- Temps frontend : 0h
- **TOTAL : 12 heures**

#### 🔗 DÉPENDANCES

- Prérequis obligatoires
- Services/composants requis
- Données de test nécessaires

#### ✅ CHECKLIST DE VALIDATION

- Liste complète des critères

---

### 🎬 DÉMO PHASE 0

**Validation sponsor à la fin Jour 2 :**

1. Architecture prête
2. Validation robuste
3. Audit et Sync
4. Prochaine étape : Sprint 1

---

## 🚀 SPRINT 1 : LEAD MANAGEMENT (5 JOURS)

**Objectif Sprint :** Lead Management complet (Backend + API + UI Kanban)  
**Durée :** 5 jours (32 heures)  
**Livrable :** Système de capture, qualification et conversion des leads

### ÉTAPE 1.1 : Capture et Création de Leads

**Durée :** 4 jours (32 heures)

#### 🎯 RATIONNEL MÉTIER

- Pourquoi le lead est critique
- Problème actuel
- Impact si absent
- Cas d'usage concret : ABC Logistics

#### 📊 DONNÉES ET RÈGLES MÉTIER

- Tables impliquées
  - crm_leads (table principale)
  - crm_lead_sources
  - adm_provider_employees
- Colonnes critiques de crm_leads (tableau complet)
- Règles métier d'assignation automatique
  - Règle 1 : Assignation par pays
  - Règle 2 : Assignation par taille de flotte
  - Règle 3 : Priorisation
- Algorithme de calcul scoring
  - **Fit Score (0-100 points)** - Algorithme détaillé
  - **Engagement Score (0-100 points)** - Algorithme détaillé
  - **Qualification Score Final** - Formule
  - **Lead Stage automatique** - Règles
- Règles de validation (via LeadCreateSchema Zod)

#### 🏗️ COMPOSANTS À DÉVELOPPER

##### Backend (Service Layer)

- **Fichier : lib/services/crm/lead.service.ts**
  - Classe LeadService extends BaseService
  - Méthode createLead() - 10 étapes détaillées
  - Méthode calculateFitScore() - Algorithme complet
  - Méthode calculateEngagementScore() - Algorithme complet
  - Méthode assignToSalesRep() - Logique assignation
  - Méthode findAll() - Avec filtres
  - Méthode findById()
  - Méthode updateLead()

- **Fichier : lib/repositories/crm/lead.repository.ts**
  - Classe LeadRepository extends BaseRepository
  - Méthode findByEmail()
  - Méthode findWithFilters()
  - Méthode countActiveLeads()

##### API REST (Endpoints)

- **Fichier : app/api/v1/crm/leads/route.ts**
  - **GET /api/v1/crm/leads**
    - Description
    - Query params (détaillés)
    - Permissions
    - Réponse 200 (exemple JSON)
    - Erreurs
  - **POST /api/v1/crm/leads**
    - Description
    - Body (exemple JSON complet)
    - Permissions
    - Réponse 201 (exemple JSON)
    - Erreurs

- **Fichier : app/api/v1/crm/leads/[id]/route.ts**
  - **GET /api/v1/crm/leads/[id]**
  - **PATCH /api/v1/crm/leads/[id]**
  - **DELETE /api/v1/crm/leads/[id]**

##### Frontend (Interface Utilisateur)

- **Fichier : app/[locale]/crm/leads/page.tsx**
  - Layout de la page (schéma ASCII)
  - Fonctionnalités détaillées
    - Colonnes Kanban
    - Drag & Drop
    - Lead Cards
    - Filtres
    - Actions rapides
    - Bouton "+ New Lead"
    - Badges score
    - Real-time updates
  - Technologies utilisées

- **Composant : components/crm/LeadCard.tsx**
  - Props
  - Affichage détaillé

- **Composant : components/crm/LeadFormModal.tsx**
  - Champs du formulaire (liste complète)
  - Validation côté client
  - Soumission

#### 🎬 RÉSULTAT DÉMONTRABLE

- Scénario démo complet pour le sponsor (6 étapes)
- Critères d'acceptation (liste complète)

#### ⏱️ ESTIMATION

- Temps backend : 12h
- Temps API : 4h
- Temps frontend : 16h
- **TOTAL : 32 heures (4 jours)**

#### 🔗 DÉPENDANCES

- Prérequis obligatoires
- Services/composants requis
- Données de test nécessaires

#### ✅ CHECKLIST DE VALIDATION

- Liste complète (17 critères)

---

### ÉTAPE 1.2 : Qualification et Scoring Automatique des Leads

**Durée :** 2.5 jours (20 heures)

#### 🎯 RATIONNEL MÉTIER

- Pourquoi scoring dynamique
- Problème recalcul
- Impact si absent
- Cas d'usage concret : Ahmed revient 3 jours plus tard

#### 📊 DONNÉES ET RÈGLES MÉTIER

- Tables impliquées
- Règles de recalcul automatique
  - Trigger 1 : Nouvelle activité trackée
  - Trigger 2 : Mise à jour manuelle du lead
  - Trigger 3 : Changement données firmographiques
- Règle de reclassification automatique (algorithme)
- Règle de réassignation automatique (algorithme)
- Règles de tracking d'activité
  - Activités augmentant engagement_score (liste avec points)
- Dégradation du score dans le temps (algorithme)

#### 🏗️ COMPOSANTS À DÉVELOPPER

##### Backend (Service Layer)

- **Modification : lib/services/crm/lead.service.ts**
  - Méthode recalculateScores() - 11 étapes détaillées
  - Méthode qualifyLead() - 7 étapes détaillées
  - Méthode trackActivity() - 3 étapes détaillées
  - Méthode degradeScores() - 3 étapes (cron job)

- **Fichier : lib/services/crm/activity.service.ts**
  - Classe ActivityService
  - Méthode createActivity()
  - Méthode getActivities()

##### API REST (Endpoints)

- **Fichier : app/api/v1/crm/leads/[id]/qualify/route.ts**
  - POST /api/v1/crm/leads/[id]/qualify
- **Fichier : app/api/v1/crm/leads/[id]/recalculate/route.ts**
  - POST /api/v1/crm/leads/[id]/recalculate
- **Fichier : app/api/v1/crm/leads/[id]/activities/route.ts**
  - GET /api/v1/crm/leads/[id]/activities
  - POST /api/v1/crm/leads/[id]/activities
- **Fichier : app/api/cron/leads/degrade-scores/route.ts**
  - GET /api/cron/leads/degrade-scores (cron job)

##### Frontend (Interface Utilisateur)

- **Modification : app/[locale]/crm/leads/page.tsx**
  - Améliorations visuelles
    - Badge lead_stage
    - Indicateur activité récente
    - Trending score

- **Fichier : app/[locale]/crm/leads/[id]/page.tsx**
  - Layout de la page (schéma ASCII détaillé)
  - Fonctionnalités
    - Score Section
    - Details Section
    - Activity Timeline
    - Actions

- **Composant : components/crm/ActivityTimeline.tsx**
  - Props
  - Affichage

- **Composant : components/crm/ScoreDisplay.tsx**
  - Props
  - Affichage

#### 🎬 RÉSULTAT DÉMONTRABLE

- Scénario démo complet (6 étapes)
- Critères d'acceptation (liste complète)

#### ⏱️ ESTIMATION

- Temps backend : 8h
- Temps API : 4h
- Temps frontend : 8h
- **TOTAL : 20 heures (2.5 jours)**

#### 🔗 DÉPENDANCES

- Prérequis obligatoires
- Services/composants requis
- Données de test nécessaires

#### ✅ CHECKLIST DE VALIDATION

- Liste complète (17 critères)

---

### ÉTAPE 1.3 : Conversion Lead → Opportunity

**Durée :** 3 jours (26 heures)

#### 🎯 RATIONNEL MÉTIER

- Pourquoi conversion structurée
- Problème traçabilité
- Impact si absent
- Cas d'usage concret : Conversion Ahmed

#### 📊 DONNÉES ET RÈGLES MÉTIER

- Tables impliquées
- Règles de conversion
  - Règle 1 : Lead doit être qualifié SQL
  - Règle 2 : Lead ne peut être converti qu'une seule fois
  - Règle 3 : Héritage des données Lead → Opportunity
  - Règle 4 : Calcul automatique expected_value (algorithme détaillé)
  - Règle 5 : Initialisation stage et probability
  - Règle 6 : Traçabilité attribution marketing
  - Règle 7 : Notification stakeholders

#### 🏗️ COMPOSANTS À DÉVELOPPER

##### Backend (Service Layer)

- **Modification : lib/services/crm/lead.service.ts**
  - Méthode convertToOpportunity() - 10 étapes détaillées
  - Méthode calculateExpectedValue() - Algorithme complet

- **Fichier : lib/services/crm/opportunity.service.ts**
  - Classe OpportunityService
  - Méthode createOpportunity() - 10 étapes détaillées
  - Méthode findAll()
  - Méthode findById()

- **Fichier : lib/repositories/crm/opportunity.repository.ts**
  - Classe OpportunityRepository
  - Méthode findWithRelations()

##### API REST (Endpoints)

- **Fichier : app/api/v1/crm/leads/[id]/convert/route.ts**
  - POST /api/v1/crm/leads/[id]/convert
  - Body détaillé
  - Réponse 201 (exemple JSON complet)
  - Erreurs

- **Fichier : app/api/v1/crm/opportunities/route.ts**
  - GET /api/v1/crm/opportunities
  - POST /api/v1/crm/opportunities

##### Frontend (Interface Utilisateur)

- **Modification : app/[locale]/crm/leads/[id]/page.tsx**
  - Bouton "Convert to Opportunity"
  - Conditions affichage

- **Composant : components/crm/ConvertLeadModal.tsx**
  - Champs du formulaire
  - Affichage calcul automatique
  - Validation
  - Soumission

- **Fichier : app/[locale]/crm/opportunities/page.tsx**
  - Layout de la page (schéma ASCII Pipeline)
  - Fonctionnalités détaillées
    - Colonnes Pipeline (5 stages)
    - Stats par colonne
    - Drag & Drop
    - Opportunity Cards
    - Filtres
    - Actions rapides

- **Composant : components/crm/OpportunityCard.tsx**
  - Props
  - Affichage

#### 🎬 RÉSULTAT DÉMONTRABLE

- Scénario démo complet (6 étapes)
- Critères d'acceptation (liste complète)

#### ⏱️ ESTIMATION

- Temps backend : 10h
- Temps API : 4h
- Temps frontend : 12h
- **TOTAL : 26 heures (3 jours)**

#### 🔗 DÉPENDANCES

- Prérequis obligatoires
- Services/composants requis
- Données de test nécessaires

#### ✅ CHECKLIST DE VALIDATION

- Liste complète (17 critères)

---

### 🎬 DÉMO SPRINT 1

**Validation sponsor à la fin Jour 7 :**

1. Lead Management complet fonctionnel
2. Qualification et scoring dynamique
3. Conversion Lead → Opportunity
4. Metrics business visibles
5. Prochaine étape : Sprint 2

---

## 🚀 SPRINT 2 : OPPORTUNITY PIPELINE (5 JOURS)

**Objectif Sprint :** Pipeline commercial complet avec forecast  
**Durée :** 5 jours  
**Livrable :** Gestion complète du cycle de vente

### ÉTAPE 2.1 : Gestion des Stages et Workflow Pipeline

**Durée :** 2 jours

#### 🎯 RATIONNEL MÉTIER

- Pourquoi workflow structuré
- Problème pipeline désorganisé
- Impact si absent
- Cas d'usage concret

#### 📊 DONNÉES ET RÈGLES MÉTIER

- Tables impliquées
- Stages du pipeline
  - Prospecting (10% probability)
  - Qualification (30% probability)
  - Proposal (50% probability)
  - Negotiation (70% probability)
  - Closing (90% probability)
- Règles de changement de stage
  - Mise à jour automatique probability
  - Recalcul forecast_value
  - Actions requises par stage
- Règles de validation transitions
- Durée moyenne par stage

#### 🏗️ COMPOSANTS À DÉVELOPPER

##### Backend (Service Layer)

- **Modification : lib/services/crm/opportunity.service.ts**
  - Méthode moveStage()
  - Méthode updateProbability()
  - Méthode validateStageTransition()
  - Méthode getStageHistory()
  - Méthode calculateAverageStageDuration()

- **Fichier : lib/repositories/crm/opportunity.repository.ts**
  - Méthode findByStage()
  - Méthode getStageStats()

##### API REST (Endpoints)

- **Fichier : app/api/v1/crm/opportunities/[id]/stage/route.ts**
  - POST /api/v1/crm/opportunities/[id]/stage
- **Fichier : app/api/v1/crm/opportunities/[id]/route.ts**
  - GET /api/v1/crm/opportunities/[id]
  - PATCH /api/v1/crm/opportunities/[id]
  - DELETE /api/v1/crm/opportunities/[id]

##### Frontend (Interface Utilisateur)

- **Fichier : app/[locale]/crm/opportunities/[id]/page.tsx**
  - Layout page détail opportunity
  - Stage history timeline
  - Actions par stage
  - Bouton "Move to Next Stage"

- **Composant : components/crm/StageTimeline.tsx**
  - Affichage timeline stages
  - Durée par stage
  - Actions effectuées

#### 🎬 RÉSULTAT DÉMONTRABLE

- Scénario démo
- Critères d'acceptation

#### ⏱️ ESTIMATION

- Temps backend : 8h
- Temps API : 3h
- Temps frontend : 5h
- **TOTAL : 16 heures (2 jours)**

#### 🔗 DÉPENDANCES

- Sprint 1 terminé
- OpportunityService existant

#### ✅ CHECKLIST DE VALIDATION

- Liste complète

---

### ÉTAPE 2.2 : Win/Lose Opportunities et Analyse

**Durée :** 2 jours

#### 🎯 RATIONNEL MÉTIER

- Pourquoi tracer les pertes
- Problème analyse impossible
- Impact si absent
- Cas d'usage concret

#### 📊 DONNÉES ET RÈGLES MÉTIER

- Tables impliquées
  - crm_opportunities
  - crm_opportunity_loss_reasons
  - crm_contracts (pour win)
- Règles Win
  - Création automatique contrat
  - Mise à jour won_value
  - Won_date
  - Notification Customer Success
- Règles Lose
  - Loss_reason_id obligatoire
  - Notes détaillées
  - Lost_date
  - Analyse patterns de perte

#### 🏗️ COMPOSANTS À DÉVELOPPER

##### Backend (Service Layer)

- **Modification : lib/services/crm/opportunity.service.ts**
  - Méthode markAsWon()
  - Méthode markAsLost()
  - Méthode analyzeLossReasons()
  - Méthode calculateWinRate()

- **Fichier : lib/services/crm/contract.service.ts**
  - Classe ContractService
  - Méthode createFromOpportunity()
  - Méthode findAll()
  - Méthode findById()

##### API REST (Endpoints)

- **Fichier : app/api/v1/crm/opportunities/[id]/win/route.ts**
  - POST /api/v1/crm/opportunities/[id]/win
- **Fichier : app/api/v1/crm/opportunities/[id]/lose/route.ts**
  - POST /api/v1/crm/opportunities/[id]/lose
- **Fichier : app/api/v1/crm/opportunities/loss-analysis/route.ts**
  - GET /api/v1/crm/opportunities/loss-analysis

##### Frontend (Interface Utilisateur)

- **Composant : components/crm/WinOpportunityModal.tsx**
  - Formulaire win (won_value, won_date, notes)
  - Création contrat automatique

- **Composant : components/crm/LoseOpportunityModal.tsx**
  - Sélection loss_reason
  - Notes détaillées
  - Suggestions actions correctives

- **Fichier : app/[locale]/crm/analytics/loss-analysis/page.tsx**
  - Dashboard analyse pertes
  - Graphiques par raison
  - Patterns identifiés
  - Actions recommandées

#### 🎬 RÉSULTAT DÉMONTRABLE

- Scénario démo
- Critères d'acceptation

#### ⏱️ ESTIMATION

- Temps backend : 8h
- Temps API : 3h
- Temps frontend : 5h
- **TOTAL : 16 heures (2 jours)**

#### 🔗 DÉPENDANCES

- Étape 2.1 terminée
- Table crm_contracts existante

#### ✅ CHECKLIST DE VALIDATION

- Liste complète

---

### ÉTAPE 2.3 : Forecast et Analytics Pipeline

**Durée :** 1 jour

#### 🎯 RATIONNEL MÉTIER

- Pourquoi forecast critique
- Problème prévisions impossibles
- Impact si absent
- Cas d'usage concret

#### 📊 DONNÉES ET RÈGLES MÉTIER

- Calcul forecast par stage
- Forecast total pipeline
- Win rate par source
- Average deal size
- Sales velocity
- Conversion funnel

#### 🏗️ COMPOSANTS À DÉVELOPPER

##### Backend (Service Layer)

- **Modification : lib/services/crm/opportunity.service.ts**
  - Méthode getForecast()
  - Méthode getConversionFunnel()
  - Méthode getSalesVelocity()
  - Méthode getWinRateBySource()

##### API REST (Endpoints)

- **Fichier : app/api/v1/crm/opportunities/forecast/route.ts**
  - GET /api/v1/crm/opportunities/forecast
- **Fichier : app/api/v1/crm/analytics/conversion-funnel/route.ts**
  - GET /api/v1/crm/analytics/conversion-funnel

##### Frontend (Interface Utilisateur)

- **Fichier : app/[locale]/crm/opportunities/analytics/page.tsx**
  - Dashboard analytics complet
  - Graphiques Recharts/Tremor
  - KPIs en temps réel
  - Filtres période

- **Composant : components/crm/ForecastChart.tsx**
  - Graphique forecast par stage
  - Evolution temporelle
  - Comparaison périodes

- **Composant : components/crm/ConversionFunnel.tsx**
  - Funnel visuel Lead → Opportunity → Contract
  - Taux de conversion par étape
  - Goulots d'étranglement

#### 🎬 RÉSULTAT DÉMONTRABLE

- Scénario démo
- Critères d'acceptation

#### ⏱️ ESTIMATION

- Temps backend : 4h
- Temps API : 2h
- Temps frontend : 6h
- **TOTAL : 12 heures (1.5 jours)**

#### 🔗 DÉPENDANCES

- Étape 2.1 et 2.2 terminées
- Données historiques suffisantes

#### ✅ CHECKLIST DE VALIDATION

- Liste complète

---

### 🎬 DÉMO SPRINT 2

**Validation sponsor à la fin Jour 12 :**

1. Pipeline workflow complet
2. Win/Lose tracking
3. Forecast et analytics
4. Prochaine étape : Sprint 3

---

## 🚀 SPRINT 3 : CONTRACTS & TENANT ONBOARDING (3 JOURS)

**Objectif Sprint :** Flux complet Lead → Contract → Tenant  
**Durée :** 3 jours  
**Livrable :** Contractualisation et provisioning automatique

### ÉTAPE 3.1 : Contract Management

**Durée :** 1.5 jours

#### 🎯 RATIONNEL MÉTIER

- Pourquoi gestion contrats structurée
- Problème contrats dispersés
- Impact si absent
- Cas d'usage concret

#### 📊 DONNÉES ET RÈGLES MÉTIER

- Tables impliquées
  - crm_contracts
  - crm_opportunities (lien)
  - adm_tenants (lien)
- Cycle de vie contrat
  - Draft
  - Pending signature
  - Signed
  - Active
  - Expired
  - Terminated
  - Renewed
- Règles de signature
- Règles de renouvellement
- Règles de résiliation

#### 🏗️ COMPOSANTS À DÉVELOPPER

##### Backend (Service Layer)

- **Modification : lib/services/crm/contract.service.ts**
  - Méthode updateContract()
  - Méthode markAsSigned()
  - Méthode activate()
  - Méthode renew()
  - Méthode terminate()
  - Méthode findExpiring()
  - Méthode generateContractPDF()

##### API REST (Endpoints)

- **Fichier : app/api/v1/crm/contracts/route.ts**
  - GET /api/v1/crm/contracts
  - POST /api/v1/crm/contracts
- **Fichier : app/api/v1/crm/contracts/[id]/route.ts**
  - GET /api/v1/crm/contracts/[id]
  - PATCH /api/v1/crm/contracts/[id]
- **Fichier : app/api/v1/crm/contracts/[id]/sign/route.ts**
  - POST /api/v1/crm/contracts/[id]/sign
- **Fichier : app/api/v1/crm/contracts/[id]/renew/route.ts**
  - POST /api/v1/crm/contracts/[id]/renew
- **Fichier : app/api/v1/crm/contracts/expiring/route.ts**
  - GET /api/v1/crm/contracts/expiring

##### Frontend (Interface Utilisateur)

- **Fichier : app/[locale]/crm/contracts/page.tsx**
  - Liste contrats avec filtres
  - Badges status colorés
  - Actions rapides

- **Fichier : app/[locale]/crm/contracts/[id]/page.tsx**
  - Détails contrat complet
  - PDF viewer
  - Timeline renouvellements
  - Actions (sign, renew, terminate)

- **Composant : components/crm/ContractCard.tsx**
  - Affichage carte contrat
  - Status badge
  - Dates importantes

#### 🎬 RÉSULTAT DÉMONTRABLE

- Scénario démo
- Critères d'acceptation

#### ⏱️ ESTIMATION

- Temps backend : 6h
- Temps API : 3h
- Temps frontend : 5h
- **TOTAL : 14 heures (1.5 jours)**

#### 🔗 DÉPENDANCES

- Sprint 2 terminé
- Table crm_contracts existante

#### ✅ CHECKLIST DE VALIDATION

- Liste complète

---

### ÉTAPE 3.2 : Tenant Provisioning Automatique

**Durée :** 1 jour

#### 🎯 RATIONNEL MÉTIER

- Pourquoi provisioning automatique
- Problème création manuelle
- Impact si absent
- Cas d'usage concret

#### 📊 DONNÉES ET RÈGLES MÉTIER

- Tables impliquées
  - adm_tenants
  - crm_contracts (trigger)
  - adm_tenant_lifecycle_events
- Workflow provisioning
  - Création tenant
  - Génération subdomain
  - Configuration initiale
  - Création premier admin
  - Envoi invitation
- Règles de génération données

#### 🏗️ COMPOSANTS À DÉVELOPPER

##### Backend (Service Layer)

- **Fichier : lib/services/admin/tenant.service.ts**
  - Classe TenantService
  - Méthode createTenant()
  - Méthode provisionFromContract()
  - Méthode activate()
  - Méthode suspend()
  - Méthode getUsageMetrics()
  - Méthode syncWithClerk()

- **Fichier : lib/services/admin/provisioning.service.ts**
  - Classe ProvisioningService
  - Méthode provisionTenant()
  - Méthode generateSubdomain()
  - Méthode createDefaultSettings()
  - Méthode inviteFirstAdmin()

##### API REST (Endpoints)

- **Fichier : app/api/v1/admin/tenants/route.ts**
  - GET /api/v1/admin/tenants
  - POST /api/v1/admin/tenants
- **Fichier : app/api/v1/admin/tenants/[id]/route.ts**
  - GET /api/v1/admin/tenants/[id]
  - PATCH /api/v1/admin/tenants/[id]
- **Fichier : app/api/v1/admin/tenants/[id]/activate/route.ts**
  - POST /api/v1/admin/tenants/[id]/activate
- **Fichier : app/api/v1/admin/tenants/[id]/suspend/route.ts**
  - POST /api/v1/admin/tenants/[id]/suspend

##### Frontend (Interface Utilisateur)

- **Fichier : app/[locale]/admin/tenants/page.tsx**
  - Liste tenants
  - Filtres status
  - Actions admin

- **Fichier : app/[locale]/admin/tenants/[id]/page.tsx**
  - Détails tenant
  - Usage metrics
  - Lifecycle timeline
  - Actions (activate, suspend)

#### 🎬 RÉSULTAT DÉMONTRABLE

- Scénario démo
- Critères d'acceptation

#### ⏱️ ESTIMATION

- Temps backend : 5h
- Temps API : 2h
- Temps frontend : 3h
- **TOTAL : 10 heures (1 jour)**

#### 🔗 DÉPENDANCES

- Étape 3.1 terminée
- Clerk organizations configuré

#### ✅ CHECKLIST DE VALIDATION

- Liste complète

---

### ÉTAPE 3.3 : Member Management et Invitations

**Durée :** 0.5 jours

#### 🎯 RATIONNEL MÉTIER

- Pourquoi invitations structurées
- Problème création manuelle comptes
- Impact si absent
- Cas d'usage concret

#### 📊 DONNÉES ET RÈGLES MÉTIER

- Tables impliquées
  - adm_members
  - adm_invitations
  - adm_member_roles
- Workflow invitation
  - Création invitation
  - Envoi email
  - Acceptation
  - Attribution rôle
- Règles de sécurité

#### 🏗️ COMPOSANTS À DÉVELOPPER

##### Backend (Service Layer)

- **Fichier : lib/services/admin/member.service.ts**
  - Classe MemberService
  - Méthode createMember()
  - Méthode findAll()
  - Méthode findById()
  - Méthode updateMember()
  - Méthode activate()
  - Méthode deactivate()

- **Fichier : lib/services/admin/invitation.service.ts**
  - Classe InvitationService
  - Méthode createInvitation()
  - Méthode sendInvitation()
  - Méthode acceptInvitation()
  - Méthode resendInvitation()
  - Méthode revokeInvitation()

##### API REST (Endpoints)

- **Fichier : app/api/v1/admin/invitations/route.ts**
  - GET /api/v1/admin/invitations
  - POST /api/v1/admin/invitations
- **Fichier : app/api/v1/admin/invitations/[id]/resend/route.ts**
  - POST /api/v1/admin/invitations/[id]/resend
- **Fichier : app/api/v1/admin/members/route.ts**
  - GET /api/v1/admin/members
  - POST /api/v1/admin/members

##### Frontend (Interface Utilisateur)

- **Fichier : app/[locale]/admin/team/page.tsx**
  - Liste membres
  - Invitations pendantes
  - Bouton "Invite Member"

- **Composant : components/admin/InviteMemberModal.tsx**
  - Formulaire invitation
  - Sélection rôle
  - Message personnalisé

#### 🎬 RÉSULTAT DÉMONTRABLE

- Scénario démo
- Critères d'acceptation

#### ⏱️ ESTIMATION

- Temps backend : 3h
- Temps API : 1h
- Temps frontend : 2h
- **TOTAL : 6 heures (0.5 jour)**

#### 🔗 DÉPENDANCES

- Étape 3.2 terminée
- Email service configuré

#### ✅ CHECKLIST DE VALIDATION

- Liste complète

---

### 🎬 DÉMO SPRINT 3

**Validation sponsor à la fin Jour 15 :**

1. Contract management complet
2. Tenant provisioning automatique
3. Member invitations
4. Flux end-to-end Lead → Tenant

---

## 📚 ANNEXES

### Annexe A : Glossaire Métier

- Définitions complètes de tous les termes

### Annexe B : Architecture Technique Vue d'Ensemble

- Schéma complet (Frontend → API → Services → Repositories → DB)

### Annexe C : Scripts de Validation

- Scripts Phase 0
- Scripts Sprint 1
- Scripts Sprint 2
- Scripts Sprint 3

### Annexe D : Checklist Sponsor par Sprint

#### Checklist Sprint 1 (Lead Management)

- Démo 1.1 - Capture Leads
- Démo 1.2 - Qualification
- Démo 1.3 - Conversion
- Metrics Sprint 1

#### Checklist Sprint 2 (Opportunity Pipeline)

- Démo 2.1 - Workflow Pipeline
- Démo 2.2 - Win/Lose
- Démo 2.3 - Forecast
- Metrics Sprint 2

#### Checklist Sprint 3 (Contracts & Tenants)

- Démo 3.1 - Contracts
- Démo 3.2 - Provisioning
- Démo 3.3 - Invitations
- Metrics Sprint 3

---

# 📊 RÉCAPITULATIF GLOBAL

## Durées par Phase

| Phase        | Durée    | Jours        | Livrables                       |
| ------------ | -------- | ------------ | ------------------------------- |
| **Phase 0**  | 26h      | 2 jours      | Architecture + Audit + Sync     |
| **Sprint 1** | 78h      | 5 jours      | Lead Management complet         |
| **Sprint 2** | 44h      | 5 jours      | Opportunity Pipeline + Forecast |
| **Sprint 3** | 30h      | 3 jours      | Contracts + Tenant Provisioning |
| **TOTAL**    | **178h** | **15 jours** | **CRM/ADM 100% opérationnel**   |

## Livrables par Sprint

### Phase 0

- ✅ BaseService et BaseRepository
- ✅ 18+ validators Zod
- ✅ Middlewares auth/RBAC/validation
- ✅ Audit automatique
- ✅ Clerk sync

### Sprint 1

- ✅ Création leads avec scoring automatique
- ✅ Kanban Leads 3 colonnes
- ✅ Timeline activités et recalcul scores
- ✅ Conversion Lead → Opportunity
- ✅ Pipeline Opportunities 5 stages

### Sprint 2

- ✅ Workflow pipeline complet
- ✅ Win/Lose opportunities
- ✅ Dashboard forecast et analytics
- ✅ Conversion funnel
- ✅ Loss analysis

### Sprint 3

- ✅ Contract management (sign, renew, terminate)
- ✅ Tenant provisioning automatique
- ✅ Member invitations
- ✅ Flux end-to-end Lead → Contract → Tenant

## Métriques Finales Attendues

### Couverture Fonctionnelle

- **APIs CRM :** 32 endpoints (100%)
- **APIs ADM :** 24 endpoints (100%)
- **Pages UI :** 15 pages (100%)
- **Services métier :** 8 services (100%)
- **Tests :** >80% coverage

### Performance

- **Response time :** <200ms p95
- **Throughput :** 1000+ req/s
- **Uptime :** 99.9%

### Qualité

- **TypeScript strict :** 100%
- **Linting :** 0 erreur
- **Security :** 0 vulnérabilité critique
- **Documentation :** 100% fonctions documentées

---

**FIN DU PLAN DÉTAILLÉ**
