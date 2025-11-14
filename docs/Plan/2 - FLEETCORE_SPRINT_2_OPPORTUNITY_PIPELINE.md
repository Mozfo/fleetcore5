# FLEETCORE - SPRINT 2 : OPPORTUNITY PIPELINE

## Plan d'Exécution Détaillé - 5 jours ouvrés

**Date:** 8 Novembre 2025  
**Version:** 1.0 DÉFINITIVE  
**Durée:** 5 jours ouvrés (Jours 8-12)  
**Prérequis:** Phase 0 + Sprint 1 terminés

---

## 📋 TABLE DES MATIÈRES

1. [Vue d'Ensemble Sprint 2](#vue-densemble-sprint-2)
2. [Étape 2.1 : Gestion du Pipeline et Déplacement entre Stages](#étape-21--gestion-du-pipeline-et-déplacement-entre-stages)
3. [Étape 2.2 : Win Opportunity et Création Contract Automatique](#étape-22--win-opportunity-et-création-contract-automatique)
4. [Étape 2.3 : Lose Opportunity et Analyse des Pertes](#étape-23--lose-opportunity-et-analyse-des-pertes)
5. [Étape 2.4 : Forecast, Analytics et Reporting Pipeline](#étape-24--forecast-analytics-et-reporting-pipeline)
6. [Démo Sprint 2](#démo-sprint-2)

---

## VUE D'ENSEMBLE SPRINT 2

### Objectif Global

À la fin du Sprint 2, le sponsor peut gérer l'intégralité du cycle de vie d'une opportunité commerciale : de sa création (depuis Sprint 1) jusqu'à sa clôture (Won ou Lost) avec création automatique du contrat si gagnée.

### Valeur Business

Le pipeline commercial est le cœur du système CRM. Sans gestion structurée, 70% des opportunités sont perdues par manque de suivi, et les prévisions de revenus sont impossibles. Ce sprint permet de :

- **Visualiser** le pipeline en temps réel (combien d'opps à chaque stage)
- **Prévoir** les revenus futurs (forecast = somme des valeurs × probabilités)
- **Analyser** les pertes pour s'améliorer (pourquoi perdons-nous ?)
- **Automatiser** la contractualisation (win → contrat créé automatiquement)

### Périmètre Sprint 2

**Ce que nous construisons :**

1. Déplacement des opportunities entre stages avec mise à jour automatique de la probabilité
2. Clôture d'opportunity Won → création automatique du contrat
3. Clôture d'opportunity Lost → analyse des raisons de perte
4. Dashboard analytics avec forecast, taux de conversion, et analyse des pertes

**Ce que nous NE faisons PAS (hors scope) :**

- Gestion multi-pipelines (1 seul pipeline standard pour le moment)
- Customisation des stages (stages fixes : prospecting, qualification, proposal, negotiation, closing)
- Prédictions IA (analyse manuelle des tendances)
- Intégrations externes (Calendrier, DocuSign) → Sprint futur

### Découpage Temporel

| Étape     | Durée       | Objectif          | Livrable Démo                   |
| --------- | ----------- | ----------------- | ------------------------------- |
| **2.1**   | 1.5 jour    | Pipeline Stages   | Drag & drop + probability auto  |
| **2.2**   | 1.5 jour    | Win + Contract    | Opp won → Contrat créé auto     |
| **2.3**   | 1 jour      | Lose + Analysis   | Raisons pertes trackées         |
| **2.4**   | 1 jour      | Analytics         | Dashboard forecast + funnel     |
| **TOTAL** | **5 jours** | **Pipeline 100%** | **Cycle complet Lead→Contract** |

---

## ÉTAPE 2.1 : Gestion du Pipeline et Déplacement entre Stages

### 🎯 RATIONNEL MÉTIER

**POURQUOI :** Une opportunité passe par plusieurs étapes avant d'être signée : démonstration produit, proposition commerciale, négociation, clôture. Chaque étape a une probabilité de succès différente. Un commercial doit pouvoir faire progresser ses opportunities dans le pipeline et voir immédiatement l'impact sur les prévisions de revenus.

**QUEL PROBLÈME :** Sans pipeline structuré, les commerciaux gèrent leurs opportunités dans des fichiers Excel ou pire, dans leur tête. Impossible pour le manager de savoir où en sont les deals. Impossible de prévoir les revenus. Impossible d'identifier les goulots d'étranglement (ex: 50 opps bloquées en "Proposal" = problème de pricing).

**IMPACT SI ABSENT :**

- **Prévisions financières** : CFO ne peut pas prévoir les revenus → impossible de planifier embauches, investissements
- **Gestion commerciale** : Manager ne sait pas où sont les deals → impossible d'aider les commerciaux
- **Optimisation processus** : Si 80% des deals perdus en "Negotiation", il faut changer l'approche → sans données, impossible de savoir
- **Motivation équipe** : Commerciaux ne voient pas leur progression → démotivation

**CAS D'USAGE CONCRET :**

**Situation initiale (Sprint 1) :**
Opportunity "ABC Logistics" créée depuis le lead Ahmed :

- Stage : "Qualification" (étape 2/5)
- Probability : 30%
- Expected value : 18,000€
- Forecast value : 18,000€ × 30% = 5,400€

**Progression dans le pipeline :**

**Semaine 1 - Démonstration produit :**
Commercial Karim fait une démo de FleetCore à Ahmed. Démo réussie, Ahmed très intéressé. Karim fait glisser l'opportunity de "Qualification" vers "Proposal".

**Automatismes déclenchés :**

- Stage passe de "qualification" à "proposal"
- Probability passe automatiquement de 30% à 50% (règle métier : stage proposal = 50% probability)
- Forecast value recalculé : 18,000€ × 50% = 9,000€
- Next action date mis à jour : +7 jours (délai standard pour envoyer proposition)
- Audit log créé : "Opportunity moved from qualification to proposal by Karim"
- Notification manager : "ABC Logistics progresse bien, probability +20%"

**Semaine 2 - Proposition commerciale :**
Karim envoie la proposition commerciale détaillée. Ahmed a quelques questions sur le pricing. Karim fait glisser vers "Negotiation".

**Automatismes :**

- Stage : "negotiation"
- Probability : 70% (négociation = deal quasi sûr)
- Forecast value : 18,000€ × 70% = 12,600€
- Forecast pipeline total augmente de 3,600€
- Manager voit : "Pipeline forecast +3,600€ cette semaine"

**Semaine 3 - Négociation finale :**
Négociation sur le nombre de licences et les modules inclus. Deal proche. Karim fait glisser vers "Closing".

**Automatismes :**

- Stage : "closing"
- Probability : 90%
- Forecast value : 18,000€ × 90% = 16,200€
- Next action : Envoyer contrat pour signature
- Alert manager : "Deal ABC Logistics très proche, prévoir onboarding"

**Semaine 4 - Signature :**
Ahmed signe le contrat. Karim clique "Mark as Won" (voir étape 2.2).

**Impact business mesurable :**
Sans pipeline structuré, ce deal aurait pris 6+ mois (pas de suivi, oublis). Avec pipeline, 4 semaines du lead à la signature. Gain : 50% de vélocité de vente = 2x plus de deals signés par an.

### 📊 DONNÉES ET RÈGLES MÉTIER

**Tables impliquées :**

- **crm_opportunities** (mise à jour stage, probability, forecast_value)
- **crm_pipelines** (définition des stages et probabilités par défaut)
- **adm_audit_logs** (traçabilité chaque changement de stage)

**Colonnes critiques de crm_opportunities :**

| Colonne                  | Type      | Utilité Business                                                            |
| ------------------------ | --------- | --------------------------------------------------------------------------- |
| **stage**                | text      | Étape actuelle (prospecting, qualification, proposal, negotiation, closing) |
| **probability_percent**  | integer   | Probabilité de gagner (0-100), calcule forecast                             |
| **expected_value**       | numeric   | Valeur estimée du contrat (€)                                               |
| **forecast_value**       | numeric   | Valeur probabilisée (expected_value × probability)                          |
| **expected_close_date**  | date      | Date estimée de signature, priorise les deals                               |
| **stage_history**        | jsonb     | Historique complet des changements de stage                                 |
| **days_in_stage**        | integer   | Nombre de jours dans le stage actuel, détecte blocages                      |
| **last_stage_change_at** | timestamp | Date dernier changement stage                                               |

**Les 5 stages standards du pipeline commercial :**

```
1. PROSPECTING (10% probability)
   └─ Durée moyenne : 5-10 jours
   └─ Actions : Premier contact, qualification besoin
   └─ Next step : Planifier démo

2. QUALIFICATION (30% probability)
   └─ Durée moyenne : 10-15 jours
   └─ Actions : Démonstration produit, validation besoin + budget
   └─ Next step : Envoyer proposition

3. PROPOSAL (50% probability)
   └─ Durée moyenne : 7-10 jours
   └─ Actions : Proposition commerciale envoyée, pricing validé
   └─ Next step : Négocier termes

4. NEGOTIATION (70% probability)
   └─ Durée moyenne : 5-7 jours
   └─ Actions : Négociation finale (prix, modules, délais)
   └─ Next step : Envoyer contrat

5. CLOSING (90% probability)
   └─ Durée moyenne : 2-3 jours
   └─ Actions : Contrat envoyé, attente signature
   └─ Next step : WIN ou LOST
```

**Règles de mise à jour automatique de probability :**

Quand une opportunity change de stage, sa probability est automatiquement mise à jour selon la table ci-dessus SAUF si le commercial a déjà modifié manuellement la probability (override manuel respecté).

```
ALGORITHME updateProbabilityOnStageChange :
  ENTRÉE : opportunity, new_stage

  # Vérifier si probability a été modifiée manuellement
  SI opportunity.probability_override = true
    ALORS
      # Respecter le choix du commercial, ne pas modifier
      SORTIE : opportunity.probability_percent (inchangé)
  FIN SI

  # Sinon, appliquer probability par défaut du stage
  SELON new_stage :
    CAS 'prospecting' :
      probability = 10
    CAS 'qualification' :
      probability = 30
    CAS 'proposal' :
      probability = 50
    CAS 'negotiation' :
      probability = 70
    CAS 'closing' :
      probability = 90
  FIN SELON

  SORTIE : probability
```

**Règles de calcul forecast_value :**

```
forecast_value = expected_value × (probability_percent / 100)

Exemple :
Expected value : 18,000€
Probability : 70%
Forecast value : 18,000 × 0.70 = 12,600€
```

Le forecast_value total du pipeline (somme de tous les forecast_value des opps ouvertes) permet au CFO de prévoir les revenus des prochains trimestres.

**Règles de détection des blocages (deal bloqué trop longtemps) :**

```
ALGORITHME detectStalledDeals :
  ENTRÉE : opportunity

  # Calculer durée dans stage actuel
  days_in_stage = today - last_stage_change_at

  # Comparer à durée max par stage
  SELON opportunity.stage :
    CAS 'prospecting' :
      max_days = 15 jours
    CAS 'qualification' :
      max_days = 20 jours
    CAS 'proposal' :
      max_days = 15 jours
    CAS 'negotiation' :
      max_days = 10 jours
    CAS 'closing' :
      max_days = 5 jours
  FIN SELON

  SI days_in_stage > max_days
    ALORS
      # Deal bloqué, alerte
      status = 'stalled'
      alert_manager = true
      suggested_action = "Contact client to unblock"
  FIN SI

  SORTIE : status, alert_needed
```

**Règles de mise à jour expected_close_date :**

À chaque changement de stage, expected_close_date est recalculée selon la durée moyenne restante :

```
ALGORITHME updateExpectedCloseDate :
  ENTRÉE : opportunity, new_stage

  # Calculer jours restants selon stage
  SELON new_stage :
    CAS 'prospecting' :
      days_remaining = 40 jours (tout le pipeline)
    CAS 'qualification' :
      days_remaining = 30 jours
    CAS 'proposal' :
      days_remaining = 20 jours
    CAS 'negotiation' :
      days_remaining = 12 jours
    CAS 'closing' :
      days_remaining = 5 jours
  FIN SELON

  expected_close_date = today + days_remaining

  SORTIE : expected_close_date
```

**Règles de validation changements de stage :**

```
# On ne peut pas sauter des étapes en avant (sauf override manager)
# Exemple : On ne peut pas passer directement de prospecting à closing
# Il faut passer par qualification, proposal, negotiation

# On peut toujours revenir en arrière
# Exemple : De proposal à qualification si client a besoin de re-démonstration

# On peut passer directement à Won ou Lost depuis n'importe quel stage
```

### 🏗️ COMPOSANTS À DÉVELOPPER

#### Backend (Service Layer)

**Modification fichier : `lib/services/crm/opportunity.service.ts`**

Ajouter les méthodes de gestion du pipeline.

**Méthode moveStage(opportunityId: string, newStage: string, options?) → Promise<Opportunity>**

1. Récupérer opportunity complète depuis DB
2. Vérifier que opportunity.status = "open" (si déjà won ou lost, erreur)
3. Valider newStage est un stage valide (prospecting, qualification, proposal, negotiation, closing)
4. Sauvegarder ancien stage pour historique
5. Calculer nouvelle probability selon règles :
   - Si options.probability fourni (override manuel) → utiliser cette valeur, marquer probability_override = true
   - Sinon → utiliser probability par défaut du stage
6. Recalculer forecast_value = expected_value × new_probability
7. Recalculer expected_close_date selon nouveau stage
8. Mettre à jour stage_history (ajouter nouvelle entrée) :
   ```json
   {
     "from_stage": "qualification",
     "to_stage": "proposal",
     "changed_at": "2025-11-08T10:30:00Z",
     "changed_by": "uuid-karim",
     "reason": "Demo completed, client interested",
     "probability_before": 30,
     "probability_after": 50
   }
   ```
9. Réinitialiser days_in_stage à 0
10. Mettre à jour last_stage_change_at = maintenant
11. Sauvegarder opportunity en DB
12. Créer audit log : action = "stage_changed", détails = from/to
13. Si probability augmente significativement (+20%+), envoyer notification manager
14. Mettre à jour next_action_date selon nouveau stage
15. Retourner opportunity mise à jour

**Méthode updateProbability(opportunityId: string, newProbability: number) → Promise<Opportunity>**

1. Récupérer opportunity
2. Valider newProbability entre 0 et 100
3. Mettre à jour probability_percent = newProbability
4. Marquer probability_override = true (indique modification manuelle)
5. Recalculer forecast_value
6. Créer audit log
7. Retourner opportunity

**Méthode detectStalledOpportunities(filters?) → Promise<Opportunity[]>**

1. Récupérer toutes opportunities avec status = "open"
2. Pour chaque opportunity, calculer days_in_stage
3. Comparer à max_days selon stage
4. Filtrer celles qui dépassent le seuil
5. Trier par degré de blocage (plus bloquées d'abord)
6. Retourner liste opportunities bloquées

**Méthode getStageStats(tenantId: string) → Promise<StageStats>**

1. Compter nombre d'opportunities par stage
2. Calculer somme expected_value par stage
3. Calculer somme forecast_value par stage
4. Calculer probability moyenne par stage
5. Calculer durée moyenne par stage
6. Retourner objet avec stats complètes :

```typescript
{
  prospecting: {
    count: 12,
    total_value: 156000,
    total_forecast: 15600,
    avg_probability: 10,
    avg_days: 8
  },
  qualification: {
    count: 15,
    total_value: 225000,
    total_forecast: 67500,
    avg_probability: 30,
    avg_days: 12
  },
  // ... autres stages
}
```

**Méthode calculateVelocity(opportunityId: string) → Promise<VelocityMetrics>**

1. Récupérer stage_history de l'opportunity
2. Calculer temps passé dans chaque stage
3. Comparer à la durée moyenne standard
4. Calculer vélocité globale : (durée totale réelle / durée totale standard) × 100
   - 100% = vitesse normale
   - <100% = plus rapide que moyenne (bon signe)
   - > 100% = plus lent que moyenne (signal d'alerte)
5. Identifier stage le plus long (goulot d'étranglement)
6. Retourner métriques :

```typescript
{
  overall_velocity: 85, // 15% plus rapide que moyenne
  days_total: 34,
  days_expected: 40,
  bottleneck_stage: "negotiation", // stage le plus long
  stage_durations: {
    prospecting: 6,
    qualification: 14,
    proposal: 8,
    negotiation: 6 // en cours
  }
}
```

#### API REST (Endpoints)

**Fichier à créer : `app/api/v1/crm/opportunities/[id]/stage/route.ts`**

**POST /api/v1/crm/opportunities/[id]/stage**

- **Description** : Changer le stage d'une opportunity (déplacement dans pipeline)
- **Body** :

```json
{
  "stage": "proposal",
  "probability": 50, // optionnel, si fourni = override manuel
  "reason": "Demo completed successfully, client ready for proposal" // optionnel
}
```

- **Permissions** : opportunities.update (owner ou manager)
- **Réponse 200** :

```json
{
  "id": "uuid",
  "stage": "proposal",
  "probability_percent": 50,
  "forecast_value": 9000,
  "expected_close_date": "2025-12-15",
  "days_in_stage": 0,
  "stage_history": [
    {
      "from_stage": "qualification",
      "to_stage": "proposal",
      "changed_at": "2025-11-08T10:30:00Z",
      "changed_by": "uuid-karim",
      "probability_before": 30,
      "probability_after": 50
    }
  ]
}
```

- **Erreurs** :
  - 400 : Stage invalide
  - 404 : Opportunity non trouvée
  - 422 : Opportunity déjà won ou lost (cannot move stage)

**PATCH /api/v1/crm/opportunities/[id]/probability**

- **Description** : Modifier manuellement la probability (override)
- **Body** :

```json
{
  "probability_percent": 65
}
```

- **Permissions** : opportunities.update
- **Réponse 200** : Opportunity avec nouvelle probability

**Fichier à créer : `app/api/v1/crm/opportunities/pipeline-stats/route.ts`**

**GET /api/v1/crm/opportunities/pipeline-stats**

- **Description** : Statistiques du pipeline par stage
- **Query params** :
  - owner_id : filter par commercial
  - date_range : filter par période
- **Permissions** : opportunities.read
- **Réponse 200** :

```json
{
  "stats_by_stage": {
    "prospecting": {
      "count": 12,
      "total_value": 156000,
      "total_forecast": 15600,
      "avg_probability": 10,
      "avg_days_in_stage": 8
    },
    "qualification": { ... },
    "proposal": { ... },
    "negotiation": { ... },
    "closing": { ... }
  },
  "total_pipeline": {
    "count": 45,
    "total_value": 780000,
    "total_forecast": 324000,
    "avg_deal_size": 17333
  }
}
```

**Fichier à créer : `app/api/v1/crm/opportunities/[id]/velocity/route.ts`**

**GET /api/v1/crm/opportunities/[id]/velocity**

- **Description** : Métriques de vélocité d'une opportunity (vitesse progression)
- **Permissions** : opportunities.read
- **Réponse 200** :

```json
{
  "overall_velocity": 85,
  "days_total": 34,
  "days_expected": 40,
  "ahead_behind": "ahead", // ou "behind" ou "on_track"
  "bottleneck_stage": "negotiation",
  "stage_durations": {
    "prospecting": 6,
    "qualification": 14,
    "proposal": 8,
    "negotiation": 6
  }
}
```

**Fichier à créer : `app/api/v1/crm/opportunities/stalled/route.ts`**

**GET /api/v1/crm/opportunities/stalled**

- **Description** : Liste des opportunities bloquées (trop longtemps dans un stage)
- **Query params** :
  - threshold : nombre de jours au-delà duquel considéré bloqué (défaut : auto selon stage)
- **Permissions** : opportunities.read
- **Réponse 200** :

```json
{
  "stalled_opportunities": [
    {
      "id": "uuid",
      "company_name": "XYZ Transport",
      "stage": "proposal",
      "days_in_stage": 25,
      "max_days": 15,
      "days_over": 10,
      "owner": { "first_name": "Sarah", "last_name": "Martin" },
      "expected_value": 24000,
      "suggested_action": "Follow up with client on proposal feedback"
    }
  ],
  "total_stalled": 8
}
```

#### Frontend (Interface Utilisateur)

**Modification fichier : `app/[locale]/crm/opportunities/page.tsx`**

Améliorer le pipeline Kanban avec fonctionnalités avancées.

**Améliorations UI :**

**1. Stats détaillées par colonne :**

```
┌────────────────────────────────┐
│ QUALIFICATION                  │
│ 15 opportunities               │
│ €225,000 total value          │
│ €67,500 forecast (30%)        │
│ ⌀ 12 days in stage            │
└────────────────────────────────┘
```

**2. Indicateurs visuels sur cartes :**

- **Badge vélocité** : ⚡ Vert si velocity >100% (rapide), 🐌 Rouge si <80% (lent)
- **Badge blocage** : ⚠️ Orange si days_in_stage > threshold
- **Barre probability** : Barre de progression colorée (rouge <30%, orange 30-69%, vert 70%+)

**3. Actions rapides enrichies :**

- **📊 View Details** : Ouvre page détail
- **➡️ Move Stage** : Dropdown rapide pour changer stage sans drag
- **📈 Update Probability** : Modal rapide pour modifier probability
- **📅 Update Close Date** : Modifier expected_close_date
- **✅ Mark Won** : Clôturer comme gagné (voir 2.2)
- **❌ Mark Lost** : Clôturer comme perdu (voir 2.3)

**4. Filtres avancés :**

- Stage (multi-select)
- Owner (multi-select)
- Expected close date range
- Value range (min-max)
- Probability range
- Show stalled only (checkbox)

**5. Vue alternative Liste :**
Toggle entre Kanban et Table view. Table affiche :

- Company | Stage | Value | Probability | Forecast | Owner | Close Date | Days in Stage | Actions

**Composant à créer : `components/crm/OpportunityCard.tsx` (version enrichie)**

Améliorer le composant existant avec nouvelles infos.

**Affichage supplémentaire :**

- **Velocity badge** : "⚡ 15% faster" ou "🐌 25% slower"
- **Days in stage** : "12 days in Qualification" avec indicateur visuel (barre progress)
- **Stalled indicator** : Badge "⚠️ STALLED" si bloqué
- **Forecast value** : Sous expected_value, afficher "Forecast: €X (probability%)"
- **Next action** : Icône + texte "Next: Send proposal by Nov 15"

**Composant à créer : `components/crm/MoveStageMod al.tsx`**

Modal rapide pour changer stage sans drag & drop.

**Layout :**

```
┌────────────────────────────────────────────────────┐
│ Move "ABC Logistics" to new stage                 │
├────────────────────────────────────────────────────┤
│ Current Stage: Qualification (30%)                │
│                                                    │
│ New Stage:                                         │
│ ┌──────────────────────────────────────────────┐ │
│ │ [○] Prospecting (10%)                        │ │
│ │ [●] Qualification (30%)    <- Current        │ │
│ │ [○] Proposal (50%)                           │ │
│ │ [○] Negotiation (70%)                        │ │
│ │ [○] Closing (90%)                            │ │
│ └──────────────────────────────────────────────┘ │
│                                                    │
│ Override Probability: [    ] % (optional)         │
│                                                    │
│ Reason: ┌──────────────────────────────────────┐ │
│         │ Demo completed, client impressed     │ │
│         └──────────────────────────────────────┘ │
│                                                    │
│ Impact:                                            │
│ • Probability: 30% → 50% (+20%)                  │
│ • Forecast: €5,400 → €9,000 (+€3,600)           │
│ • Expected Close: Dec 25 → Dec 15 (-10 days)    │
│                                                    │
│ [Cancel]                      [Move Stage ➡️]     │
└────────────────────────────────────────────────────┘
```

**Fonctionnalités :**

- Radio buttons pour sélectionner nouveau stage
- Stage actuel grisé et marqué "Current"
- Si stage sélectionné, afficher impact calculé en temps réel
- Input optionnel pour override probability
- Textarea pour reason (optionnel)
- Bouton Move désactivé si même stage sélectionné

**Composant à créer : `components/crm/PipelineStatsCard.tsx`**

Composant pour afficher stats globales au-dessus du Kanban.

**Layout :**

```
┌────────────────────────────────────────────────────────────┐
│ PIPELINE OVERVIEW                                          │
├────────────┬─────────────┬──────────────┬────────────────┤
│ OPEN       │ FORECAST    │ AVG DEAL     │ WIN RATE      │
│ 45 opps    │ €324,000    │ €17,333      │ 32%           │
│ €780,000   │ (41.5%)     │              │ (YTD)         │
└────────────┴─────────────┴──────────────┴────────────────┘
```

**Métriques :**

- **Open** : Nombre d'opportunities ouvertes + total value
- **Forecast** : Somme forecast_value + % du total
- **Avg Deal** : Moyenne expected_value
- **Win Rate** : (Opps won / (Opps won + lost)) × 100

**Fichier à créer : `app/[locale]/crm/opportunities/[id]/page.tsx`**

Page détail d'une opportunity avec timeline stages.

**Layout :**

```
┌──────────────────────────────────────────────────────────┐
│ [← Back] ABC Logistics                    [Actions ▼]    │
└──────────────────────────────────────────────────────────┘
┌──────────────────────────────────────────────────────────┐
│ OPPORTUNITY HEADER                                       │
│ ABC Logistics                              Status: OPEN  │
│ Expected Value: €18,000                                  │
│ Forecast Value: €9,000 (50%)                            │
│ Expected Close: Dec 15, 2025 (37 days)                  │
│ Owner: Karim Al-Rashid                                   │
│ Created from Lead: Ahmed Al-Mansoori (Nov 8, 2025)      │
└──────────────────────────────────────────────────────────┘
┌──────────────────────────────────────────────────────────┐
│ CURRENT STAGE                                            │
│ ┌────────┬────────┬────────┬────────┬────────┐         │
│ │PROSP.  │QUALIF. │PROPOSAL│NEGOT.  │CLOSING │         │
│ │ ✓ 6d   │ ✓ 14d  │ ● 8d   │        │        │         │
│ └────────┴────────┴────────┴────────┴────────┘         │
│                                                          │
│ Currently: PROPOSAL (8 days)                            │
│ Probability: 50%                                         │
│ Velocity: ⚡ 15% faster than average                    │
│ Next: Send follow-up email by Nov 15                    │
│ [➡️ Move Stage] [📈 Update Probability]                 │
└──────────────────────────────────────────────────────────┘
┌──────────────────────────────────────────────────────────┐
│ STAGE HISTORY                                            │
│ ┌────────────────────────────────────────────────────┐  │
│ │ 📍 PROPOSAL - 8 days                               │  │
│ │ Nov 8, 2025 10:30 AM - Changed by Karim           │  │
│ │ "Demo completed, client impressed"                 │  │
│ │ Probability: 30% → 50% (+20%)                     │  │
│ └────────────────────────────────────────────────────┘  │
│ ┌────────────────────────────────────────────────────┐  │
│ │ 📍 QUALIFICATION - 14 days                         │  │
│ │ Oct 25 - Nov 8, 2025                               │  │
│ │ "Qualified lead, scheduled demo"                   │  │
│ └────────────────────────────────────────────────────┘  │
│ ┌────────────────────────────────────────────────────┐  │
│ │ 📍 PROSPECTING - 6 days                            │  │
│ │ Oct 19 - Oct 25, 2025                              │  │
│ │ "Lead converted to opportunity"                    │  │
│ └────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
┌──────────────────────────────────────────────────────────┐
│ DETAILS                                                  │
│ Company: ABC Logistics                                   │
│ Industry: Logistics & Delivery                           │
│ Fleet Size: 80 vehicles                                  │
│ Country: UAE 🇦🇪                                          │
│ Contact: Ahmed Al-Mansoori                               │
│ Email: ahmed@abclogistics.ae                             │
│ Phone: +971 50 123 4567                                  │
│                                                          │
│ ATTRIBUTION                                              │
│ Source: Google Ads - dubai_logistics_q4                  │
│ Lead Created: Nov 5, 2025                                │
│ Lead Qualified: Nov 7, 2025                              │
│ Converted: Nov 8, 2025                                   │
│ Time to Convert: 3 days                                  │
└──────────────────────────────────────────────────────────┘
┌──────────────────────────────────────────────────────────┐
│ ACTIONS                                                  │
│ [➡️ Move Stage] [✅ Mark Won] [❌ Mark Lost]            │
│ [📝 Add Note] [📅 Schedule Follow-up] [📧 Send Email]  │
└──────────────────────────────────────────────────────────┘
```

**Fonctionnalités clés :**

- **Stage Progress Bar** : Visualisation linéaire des 5 stages avec indicateurs ✓ (complété), ● (actuel), vide (à venir)
- **Stage History Timeline** : Liste chronologique des changements avec durées, auteurs, raisons
- **Velocity Indicator** : Badge montrant si l'opp progresse plus vite ou lent que la moyenne
- **Next Action** : Suggestion automatique de prochaine action selon stage
- **Actions contextuelles** : Boutons adaptés au stage actuel

### 🎬 RÉSULTAT DÉMONTRABLE

**Scénario démo complet pour le sponsor :**

**1. Pipeline Kanban avec stats**

- Naviguer vers /crm/opportunities
- Voir 5 colonnes Kanban avec stats détaillées par colonne
- Voir card stats globales au-dessus : 45 opps, €324,000 forecast, 32% win rate

**2. Déplacement drag & drop**

- Glisser carte "ABC Logistics" de colonne "Qualification" vers "Proposal"
- Carte se déplace avec animation fluide
- Stage mis à jour immédiatement
- Stats colonne Qualification : 15 opps → 14 opps, forecast -€5,400
- Stats colonne Proposal : 10 opps → 11 opps, forecast +€9,000
- Badge probability sur carte passe de 30% (orange) à 50% (orange foncé)
- Badge forecast sur carte : €5,400 → €9,000

**3. Modal Move Stage**

- Cliquer bouton "➡️ Move Stage" sur une autre carte
- Modal s'ouvre avec radio buttons des 5 stages
- Sélectionner "Negotiation"
- Voir impact calculé en temps réel :
  - Probability : 50% → 70% (+20%)
  - Forecast : €9,000 → €12,600 (+€3,600)
  - Close date : Dec 15 → Dec 10 (-5 days)
- Remplir reason : "Price agreed, finalizing terms"
- Cliquer "Move Stage"
- Modal ferme, carte déplacée vers colonne Negotiation

**4. Page détail opportunity**

- Cliquer sur carte "ABC Logistics"
- Page détail s'ouvre
- Voir Stage Progress Bar : Prospecting ✓ (6d) → Qualification ✓ (14d) → Proposal ● (8d en cours)
- Voir Velocity : ⚡ 15% faster than average
- Voir Stage History timeline avec 3 entrées chronologiques
- Voir Attribution marketing complète (source Google Ads, time to convert 3 days)

**5. Détection deals bloqués**

- Naviguer vers /crm/opportunities/stalled
- Voir liste de 8 opportunities bloquées
- Voir "XYZ Transport" dans Proposal depuis 25 jours (seuil 15 jours)
- Badge "⚠️ STALLED - 10 days over"
- Suggested action : "Follow up with client on proposal feedback"
- Cliquer sur carte, ouvrir page détail
- Voir alerte rouge en haut : "⚠️ This opportunity has been in Proposal for 25 days (10 days over threshold)"

**6. Filtres et vue alternative**

- Activer filtre "Show stalled only" → Liste filtrée 8 opps
- Sélectionner filtre Stage = "Negotiation" + "Closing" → Opps proche signature
- Toggle vers Vue Liste (Table)
- Voir tableau avec toutes les colonnes triables
- Trier par "Days in Stage" DESC → Deals les plus bloqués en premier

**7. Update probability manuelle**

- Sur page détail ABC Logistics, cliquer "📈 Update Probability"
- Modal s'ouvre avec slider 0-100%
- Déplacer slider de 50% vers 65%
- Voir forecast recalculé : €9,000 → €11,700
- Input reason : "Client confirmed budget approved, very likely to close"
- Sauvegarder
- Badge sur carte mis à jour : 65%
- Badge "probability_override" ajouté (indique modification manuelle)

**Critères d'acceptation :**

- ✅ Drag & drop opportunity entre colonnes fonctionne
- ✅ Probability mise à jour automatiquement selon stage
- ✅ Forecast value recalculé immédiatement
- ✅ Stats colonnes (count, total, forecast) mises à jour en temps réel
- ✅ Modal Move Stage affiche impact calculé en live
- ✅ Page détail affiche Stage Progress Bar avec durées
- ✅ Stage History timeline complète avec auteurs et raisons
- ✅ Velocity calculée et affichée (faster/slower que moyenne)
- ✅ Deals bloqués détectés et listés avec seuils corrects
- ✅ Filtres fonctionnent (stage, owner, stalled, value range)
- ✅ Vue alternative Liste fonctionne avec tri
- ✅ Update probability manuelle respectée (override)
- ✅ Expected close date recalculée selon stage
- ✅ Audit logs créés pour chaque changement stage
- ✅ Notifications manager si progression significative

### ⏱️ ESTIMATION

- Temps backend : **10 heures**
  - moveStage() : 4h
  - detectStalledOpportunities() : 2h
  - getStageStats() : 2h
  - calculateVelocity() : 2h
- Temps API : **4 heures**
  - POST /stage : 2h
  - GET /pipeline-stats : 1h
  - GET /stalled : 1h
- Temps frontend : **12 heures**
  - Amélioration Kanban + stats : 4h
  - MoveStageMod al : 2h
  - Page détail opportunity : 4h
  - Vue Liste alternative : 2h
- **TOTAL : 26 heures (1.5 jour)**

### 🔗 DÉPENDANCES

**Prérequis obligatoires :**

- Sprint 1 terminé (opportunités créées depuis leads)
- Table crm_opportunities avec colonnes stage, probability, forecast_value
- Table crm_pipelines avec stages standards définis

**Services/composants requis :**

- OpportunityService (déjà créé Sprint 1)
- AuditService (Phase 0)
- NotificationService (Phase 0)

**Données de test nécessaires :**

- 20+ opportunities avec différents stages
- Quelques opportunities "bloquées" (days_in_stage > threshold)

### ✅ CHECKLIST DE VALIDATION

- [ ] **Backend** : moveStage() change stage et met à jour probability
- [ ] **Backend** : forecast_value recalculé automatiquement
- [ ] **Backend** : expected_close_date mis à jour selon stage
- [ ] **Backend** : stage_history ajouté avec détails complets
- [ ] **Backend** : detectStalledOpportunities() retourne deals bloqués
- [ ] **Backend** : getStageStats() calcule stats par stage
- [ ] **Backend** : calculateVelocity() compare à moyenne
- [ ] **API** : POST /stage met à jour opportunity
- [ ] **API** : GET /pipeline-stats retourne stats correctes
- [ ] **API** : GET /stalled retourne deals bloqués
- [ ] **Frontend** : Drag & drop Kanban fonctionne
- [ ] **Frontend** : Stats colonnes mises à jour temps réel
- [ ] **Frontend** : Modal Move Stage affiche impact
- [ ] **Frontend** : Page détail affiche progress bar stages
- [ ] **Frontend** : Stage history timeline affichée
- [ ] **Frontend** : Velocity indicator affiché correctement
- [ ] **Frontend** : Vue Liste fonctionne avec tri
- [ ] **Frontend** : Filtres (stage, stalled) fonctionnent
- [ ] **Tests** : 15+ tests unitaires moveStage
- [ ] **Tests** : Test E2E drag & drop → stage updated
- [ ] **Démo** : Sponsor peut déplacer opp et voir stats màj
- [ ] **Démo** : Sponsor voit deals bloqués avec alertes

---

## ÉTAPE 2.2 : Win Opportunity et Création Contract Automatique

### 🎯 RATIONNEL MÉTIER

**POURQUOI :** Une opportunity Won est une victoire commerciale qui doit immédiatement se traduire par un contrat signé. Le contrat est le document juridique et financier qui lie FleetCore et le client. Sans création automatique, le commercial doit manuellement créer le contrat dans un autre système, risquant erreurs, oublis, et retards.

**QUEL PROBLÈME :** Actuellement, pas de lien automatique Opportunity → Contract. Quand un commercial gagne un deal, il doit :

1. Marquer l'opportunity comme Won manuellement
2. Aller dans un autre module Contracts
3. Créer manuellement le contrat en recopiant toutes les infos de l'opportunity
4. Risque : erreurs de recopie (mauvais montant, mauvaise date), oublis, retards

**IMPACT SI ABSENT :**

- **Erreurs humaines** : Contrat créé avec mauvais montant = perte revenus ou litige client
- **Délais** : 2-3 jours entre win et contrat créé = client peut changer d'avis
- **Traçabilité** : Impossible de savoir quelle opportunity a généré quel contrat = analytics cassées
- **Expérience client** : Client signe une proposition, reçoit un contrat différent = confusion, perte confiance

**CAS D'USAGE CONCRET :**

**Sans automatisation (avant) :**

Jour 1 : Commercial Karim gagne le deal ABC Logistics

- Karim clique "Mark as Won" dans CRM
- Opportunity passée à status "won"
- Karim envoie email célébration à Ahmed : "Félicitations, on démarre !"
- ...mais oublie de créer le contrat

Jour 3 : Manager demande "Où est le contrat ABC Logistics ?"

- Karim : "Ah oui, j'ai oublié !"
- Karim va dans module Contracts
- Crée manuellement contrat en recopiant infos opportunity
- Erreur : Tape 180,000€ au lieu de 18,000€ (zéro en trop)
- Contrat envoyé à Ahmed

Jour 5 : Ahmed appelle furieux

- "Votre contrat dit 180,000€, on avait dit 18,000€ !"
- Karim doit s'excuser, recréer contrat, renvoyer
- Ahmed perd confiance, retarde signature

**Avec automatisation (après) :**

Jour 1, 10h30 : Karim clique "Mark as Won"

- Modal s'ouvre : "Convert opportunity to contract?"
- Formulaire pré-rempli avec toutes les infos opportunity :
  - Company : ABC Logistics
  - Contact : Ahmed Al-Mansoori
  - Value : 18,000€ (hérité de opportunity.expected_value)
  - Start date : Aujourd'hui
  - Duration : 12 mois
  - Billing cycle : Monthly
  - Auto-renew : Yes (par défaut)
- Karim vérifie les infos (2 minutes), ajuste si besoin
- Clique "Create Contract"

Automatismes déclenchés en 5 secondes :

1. Opportunity passe à status "won", won_date = maintenant, won_value = 18,000€
2. Contract créé automatiquement dans table crm_contracts avec :
   - opportunity_id = lien vers opportunity
   - lead_id = lien vers lead d'origine
   - company_name, contact, value, dates... (tout hérité)
   - contract_reference unique : "CTR-2025-00456"
   - status = "draft" (pas encore signé)
3. Opportunity.contract_id renseigné (lien bidirectionnel)
4. Audit logs créés (opportunity won, contract created)
5. Notifications envoyées :
   - Customer Success : "Préparer onboarding ABC Logistics"
   - Finance : "Nouveau contrat 18k€, prévoir facturation"
   - Manager : "Karim a gagné deal ABC Logistics 18k€ 🎉"
6. Email envoyé à Ahmed automatiquement : "Votre contrat FleetCore" avec PDF joint
7. Tâche créée pour Karim : "Follow up signature contract ABC Logistics"

Jour 1, 10h35 : Tout est fait, 0 erreur, 0 oubli

**Impact business mesurable :**

- Time to contract : 3 jours → 5 minutes (99% plus rapide)
- Erreur taux : 15% → 0% (automatisation = 0 erreur)
- Satisfaction client : +40% (rapidité + fiabilité)
- Productivité commercial : +2h/semaine gagnées (pas de double saisie)

### 📊 DONNÉES ET RÈGLES MÉTIER

**Tables impliquées :**

- **crm_opportunities** (passage à status "won", won_date, won_value, contract_id)
- **crm_contracts** (nouvelle ligne créée)
- **crm_leads** (traçabilité : lead a généré contract via opportunity)
- **adm_audit_logs** (traçabilité complète)

**Colonnes critiques de crm_contracts :**

| Colonne                | Type    | Utilité Business                                                             |
| ---------------------- | ------- | ---------------------------------------------------------------------------- |
| **opportunity_id**     | uuid    | Lien vers opportunity d'origine (traçabilité)                                |
| **lead_id**            | uuid    | Lien vers lead d'origine (attribution marketing complète)                    |
| **contract_reference** | varchar | Référence unique (ex: CTR-2025-00456) affichée sur factures                  |
| **contract_code**      | varchar | Code court (ex: C2025-456) pour communication orale                          |
| **company_name**       | text    | Nom client (hérité opportunity)                                              |
| **contact_name**       | text    | Contact principal (hérité lead)                                              |
| **contact_email**      | text    | Email contact (hérité lead)                                                  |
| **contact_phone**      | text    | Téléphone contact (hérité lead)                                              |
| **start_date**         | date    | Date début contrat (peut être future)                                        |
| **end_date**           | date    | Date fin contrat (start_date + duration)                                     |
| **duration_months**    | integer | Durée en mois (12, 24, 36...)                                                |
| **total_value**        | numeric | Valeur totale (hérité opportunity.won_value)                                 |
| **monthly_value**      | numeric | Valeur mensuelle (total_value / duration_months)                             |
| **currency**           | char(3) | Devise (héritée opportunity)                                                 |
| **billing_cycle**      | varchar | Fréquence facturation (monthly, quarterly, yearly)                           |
| **auto_renew**         | boolean | Renouvellement automatique ou non                                            |
| **renewal_type**       | varchar | Type renouvellement (automatic, manual, none)                                |
| **status**             | varchar | État contrat (draft, pending_signature, signed, active, expired, terminated) |
| **signature_date**     | date    | Date signature client (NULL si pas encore signé)                             |
| **signed_by**          | text    | Nom signataire client                                                        |
| **document_url**       | text    | URL PDF contrat (stocké S3)                                                  |

**Règles de création automatique du contrat :**

**Règle 1 : Héritage des données Opportunity → Contract**

```
ALGORITHME createContractFromOpportunity :
  ENTRÉE : opportunity (won), contractData (overrides optionnels)

  # Données héritées automatiquement
  contract.opportunity_id = opportunity.id
  contract.lead_id = opportunity.lead_id
  contract.company_name = opportunity.company_name
  contract.country_code = opportunity.country_code
  contract.currency = opportunity.currency

  # Contact (hérité du lead via opportunity)
  lead = opportunity.lead
  contract.contact_name = lead.first_name + " " + lead.last_name
  contract.contact_email = lead.email
  contract.contact_phone = lead.phone

  # Valeur (hérité de l'opportunity won)
  contract.total_value = opportunity.won_value (ou expected_value si won_value NULL)

  # Dates (calculées ou overrides)
  contract.start_date = contractData.start_date OU today
  contract.duration_months = contractData.duration OU 12 mois (défaut)
  contract.end_date = start_date + duration_months

  # Facturation
  contract.billing_cycle = contractData.billing_cycle OU 'monthly' (défaut)
  contract.monthly_value = total_value / duration_months

  # Renouvellement
  contract.auto_renew = contractData.auto_renew OU true (défaut)
  contract.renewal_type = SI auto_renew ALORS 'automatic' SINON 'manual'

  # Codes uniques
  contract.contract_reference = generateReference() # CTR-2025-00456
  contract.contract_code = generateCode() # C2025-456

  # Statut initial
  contract.status = 'draft' # Pas encore signé

  SORTIE : contract
```

**Règle 2 : Génération des codes uniques**

```
ALGORITHME generateContractReference :
  # Format : CTR-YYYY-NNNNN
  year = current_year # 2025

  # Compter contrats créés cette année
  count = COUNT contracts WHERE YEAR(created_at) = year
  next_number = count + 1

  reference = "CTR-" + year + "-" + LPAD(next_number, 5, '0')
  # Exemples : CTR-2025-00001, CTR-2025-00456

  SORTIE : reference

ALGORITHME generateContractCode :
  # Format : CYYYY-NNN (plus court pour communication orale)
  year = current_year
  count = COUNT contracts WHERE YEAR(created_at) = year
  next_number = count + 1

  code = "C" + year + "-" + LPAD(next_number, 3, '0')
  # Exemples : C2025-001, C2025-456

  SORTIE : code
```

**Règle 3 : Calcul end_date selon billing_cycle et duration**

```
ALGORITHME calculateEndDate :
  ENTRÉE : start_date, duration_months

  # Ajouter duration_months à start_date
  end_date = start_date + INTERVAL duration_months MONTH

  # Ajuster au dernier jour du mois si nécessaire
  # Exemple : start = 31 janvier, +1 mois = 28 février (pas 31 février)

  SORTIE : end_date
```

**Règle 4 : Validation avant création contract**

```
ALGORITHME validateContractData :
  ENTRÉE : contractData

  # Validations obligatoires
  SI total_value <= 0
    ALORS ERREUR "Contract value must be positive"

  SI start_date < today - 7 jours
    ALORS ERREUR "Start date cannot be more than 7 days in the past"

  SI end_date <= start_date
    ALORS ERREUR "End date must be after start date"

  SI duration_months < 1 OU duration_months > 60
    ALORS ERREUR "Duration must be between 1 and 60 months"

  SI billing_cycle NOT IN ['monthly', 'quarterly', 'yearly']
    ALORS ERREUR "Invalid billing cycle"

  SORTIE : valid
```

**Règle 5 : Mise à jour Opportunity après win**

```
ALGORITHME markOpportunityAsWon :
  ENTRÉE : opportunity, wonData

  # Mise à jour opportunity
  opportunity.status = 'won'
  opportunity.won_date = wonData.won_date OU today
  opportunity.won_value = wonData.won_value OU opportunity.expected_value
  opportunity.actual_close_date = wonData.won_date OU today

  # Lien vers contract créé
  opportunity.contract_id = contract.id

  # Métadonnées succès
  opportunity.metadata.won_by = current_user_id
  opportunity.metadata.win_reason = wonData.win_reason
  opportunity.metadata.days_to_close = actual_close_date - created_at

  SORTIE : opportunity
```

**Règle 6 : Notifications automatiques post-win**

```
ALGORITHME sendWinNotifications :
  ENTRÉE : opportunity, contract

  # 1. Notification Manager Commercial
  SEND notification TO opportunity.owner.manager
    Titre : "🎉 Deal Won: {company_name}"
    Message : "{owner_name} won {company_name} - €{won_value}"
    Action : "View Contract"

  # 2. Notification Customer Success
  SEND notification TO customer_success_team
    Titre : "New Customer Onboarding: {company_name}"
    Message : "Contract {contract_reference} - Start: {start_date}"
    Action : "Prepare Onboarding"

  # 3. Notification Finance
  SEND notification TO finance_team
    Titre : "New Contract: {contract_reference}"
    Message : "Monthly value: €{monthly_value} - Billing: {billing_cycle}"
    Action : "Setup Billing"

  # 4. Email Client
  SEND email TO contract.contact_email
    Subject : "Welcome to FleetCore - Contract {contract_reference}"
    Body : "Thank you for choosing FleetCore. Attached is your contract."
    Attachment : contract_pdf

  # 5. Slack Notification (optionnel)
  SI slack_webhook_configured
    ALORS SEND slack_message TO #sales_wins
      "🎉 {owner_name} won {company_name} - €{won_value}!"
  FIN SI
```

### 🏗️ COMPOSANTS À DÉVELOPPER

#### Backend (Service Layer)

**Modification fichier : `lib/services/crm/opportunity.service.ts`**

Ajouter la méthode de clôture Won.

**Méthode markAsWon(opportunityId: string, wonData: WinOpportunityInput) → Promise<{opportunity, contract}>**

1. Récupérer opportunity complète avec lead associé
2. Vérifier que opportunity.status = "open" (si déjà won ou lost, erreur)
3. Valider wonData avec WinOpportunitySchema :
   - won_date : date (optionnel, défaut today)
   - won_value : number (optionnel, défaut expected_value)
   - win_reason : string (optionnel)
   - contract_start_date : date (optionnel, défaut today)
   - contract_duration : number (optionnel, défaut 12)
   - billing_cycle : enum (optionnel, défaut monthly)
   - auto_renew : boolean (optionnel, défaut true)
4. Préparer contractData avec héritage opportunity :
   - opportunity_id, lead_id
   - company_name, contact (depuis lead)
   - total_value = wonData.won_value
   - start_date, end_date, duration, billing_cycle, auto_renew
5. Appeler contractService.createContract(contractData)
6. Mettre à jour opportunity :
   - status = 'won'
   - won_date = wonData.won_date
   - won_value = wonData.won_value
   - actual_close_date = wonData.won_date
   - contract_id = contract.id
   - metadata.won_by, win_reason, days_to_close
7. Créer audit logs :
   - Opportunity : action = "won"
   - Contract : action = "created_from_opportunity"
8. Envoyer notifications (manager, customer success, finance, client)
9. Créer tâches automatiques :
   - Customer Success : "Onboard {company_name}"
   - Commercial : "Follow up signature {contract_reference}"
10. Retourner {opportunity, contract}

**Fichier à créer : `lib/services/crm/contract.service.ts`**

Service pour gérer les contrats.

**Méthode createContract(data: ContractCreateInput) → Promise<Contract>**

1. Valider data avec ContractCreateSchema
2. Extraire tenant_id depuis contexte
3. Si opportunity_id fourni, vérifier que opportunity existe et status = "won"
4. Générer contract_reference unique (CTR-YYYY-NNNNN)
5. Générer contract_code unique (CYYYY-NNN)
6. Calculer end_date = start_date + duration_months
7. Calculer monthly_value = total_value / duration_months
8. Créer contract dans DB via contractRepository.create()
9. Créer lifecycle event "contract_created"
10. Créer audit log
11. Retourner contract

**Méthode findAll(filters) → Promise<Contract[]>**

Liste tous les contrats du tenant avec filtres (status, start_date_range, company_name).

**Méthode findById(id) → Promise<Contract>**

Récupère un contrat par ID avec vérification tenant et relations (opportunity, lead).

**Méthode generatePDF(contractId) → Promise<string>**

1. Récupérer contract complet
2. Charger template PDF contrat (avec placeholders)
3. Remplir template avec données contract
4. Générer PDF avec bibliothèque (ex: PDFKit, jsPDF)
5. Uploader PDF vers S3 ou stockage
6. Mettre à jour contract.document_url avec URL du PDF
7. Retourner URL du PDF

**Fichier à créer : `lib/repositories/crm/contract.repository.ts`**

Repository pour accès base de données contracts.

**Méthode findByOpportunityId(opportunityId, tenantId) → Promise<Contract | null>**

Cherche un contrat associé à une opportunity donnée.

**Méthode findExpiring(days, tenantId) → Promise<Contract[]>**

Cherche les contrats qui expirent dans X jours (pour renouvellement proactif).

#### API REST (Endpoints)

**Fichier à créer : `app/api/v1/crm/opportunities/[id]/win/route.ts`**

**POST /api/v1/crm/opportunities/[id]/win**

- **Description** : Clôturer une opportunity comme Won et créer le contrat automatiquement
- **Body** :

```json
{
  "won_date": "2025-11-08", // optionnel, défaut today
  "won_value": 18000, // optionnel, défaut expected_value
  "win_reason": "Client impressed with demo, pricing competitive",
  "contract_start_date": "2025-11-15", // optionnel, défaut today
  "contract_duration": 12, // mois, optionnel défaut 12
  "billing_cycle": "monthly", // optionnel, défaut monthly
  "auto_renew": true // optionnel, défaut true
}
```

- **Permissions** : opportunities.win (owner ou manager)
- **Réponse 201** :

```json
{
  "opportunity": {
    "id": "uuid",
    "status": "won",
    "won_date": "2025-11-08",
    "won_value": 18000,
    "actual_close_date": "2025-11-08",
    "contract_id": "uuid-contract",
    "metadata": {
      "won_by": "uuid-karim",
      "win_reason": "Client impressed...",
      "days_to_close": 34
    }
  },
  "contract": {
    "id": "uuid-contract",
    "contract_reference": "CTR-2025-00456",
    "contract_code": "C2025-456",
    "company_name": "ABC Logistics",
    "contact_name": "Ahmed Al-Mansoori",
    "contact_email": "ahmed@abclogistics.ae",
    "start_date": "2025-11-15",
    "end_date": "2026-11-15",
    "duration_months": 12,
    "total_value": 18000,
    "monthly_value": 1500,
    "currency": "EUR",
    "billing_cycle": "monthly",
    "auto_renew": true,
    "status": "draft",
    "opportunity_id": "uuid-opportunity",
    "lead_id": "uuid-lead",
    "created_at": "2025-11-08T10:35:00Z"
  }
}
```

- **Erreurs** :
  - 404 : Opportunity non trouvée
  - 422 : Opportunity already won or lost
  - 400 : Validation échouée (dates invalides, value négative)

**Fichier à créer : `app/api/v1/crm/contracts/route.ts`**

**GET /api/v1/crm/contracts**

- **Description** : Liste tous les contrats du tenant
- **Query params** :
  - status : filter par status (draft, pending_signature, signed, active, expired, terminated)
  - start_date_from : date min start
  - start_date_to : date max start
  - company_name : recherche par nom (ILIKE)
  - auto_renew : filter par auto-renouvellement (true/false)
  - limit, offset : pagination
- **Permissions** : contracts.read
- **Réponse 200** :

```json
{
  "contracts": [
    {
      "id": "uuid",
      "contract_reference": "CTR-2025-00456",
      "company_name": "ABC Logistics",
      "status": "draft",
      "total_value": 18000,
      "start_date": "2025-11-15",
      "end_date": "2026-11-15",
      "auto_renew": true,
      "opportunity": {
        "id": "uuid",
        "company_name": "ABC Logistics",
        "owner": { "first_name": "Karim", "last_name": "Al-Rashid" }
      }
    }
  ],
  "total": 23
}
```

**POST /api/v1/crm/contracts**

- **Description** : Créer un contrat manuellement (sans opportunity associée)
- **Body** : ContractCreateInput complet
- **Permissions** : contracts.create (admin ou manager)
- **Réponse 201** : Contract créé

**Fichier à créer : `app/api/v1/crm/contracts/[id]/route.ts`**

**GET /api/v1/crm/contracts/[id]**

- **Description** : Détails complets d'un contrat
- **Permissions** : contracts.read
- **Réponse 200** : Contract avec relations (opportunity, lead)

**PATCH /api/v1/crm/contracts/[id]**

- **Description** : Modifier un contrat (draft seulement)
- **Body** : ContractUpdateInput
- **Permissions** : contracts.update
- **Réponse 200** : Contract mis à jour
- **Erreurs** :
  - 422 : Cannot modify signed contract

**Fichier à créer : `app/api/v1/crm/contracts/[id]/pdf/route.ts`**

**GET /api/v1/crm/contracts/[id]/pdf**

- **Description** : Générer et télécharger le PDF du contrat
- **Permissions** : contracts.read
- **Réponse 200** : PDF file (application/pdf)
- **Headers** :
  - Content-Disposition: attachment; filename="CTR-2025-00456.pdf"

#### Frontend (Interface Utilisateur)

**Modification fichier : `app/[locale]/crm/opportunities/[id]/page.tsx`**

Ajouter bouton "✅ Mark Won" dans section Actions.

**Bouton Mark Won :**

- Visible uniquement si opportunity.status = "open"
- Style : Bouton vert prominent
- Au clic : Ouvre modal WinOpportunityModal

**Composant à créer : `components/crm/WinOpportunityModal.tsx`**

Modal pour clôturer une opportunity comme Won et créer le contrat.

**Layout :**

```
┌────────────────────────────────────────────────────────────┐
│ 🎉 Win Opportunity: ABC Logistics                          │
├────────────────────────────────────────────────────────────┤
│ OPPORTUNITY DETAILS                                        │
│ Expected Value: €18,000                                    │
│ Current Stage: Closing (90%)                               │
│ Owner: Karim Al-Rashid                                     │
├────────────────────────────────────────────────────────────┤
│ WIN DETAILS                                                │
│                                                            │
│ Won Date: [2025-11-08      ▼]                             │
│                                                            │
│ Won Value: [€ 18,000       ]                               │
│ (Default: Expected Value, can adjust if negotiated)       │
│                                                            │
│ Win Reason: ┌──────────────────────────────────────────┐ │
│             │ Client impressed with demo, pricing     │ │
│             │ competitive, decision approved by CEO   │ │
│             └──────────────────────────────────────────┘ │
├────────────────────────────────────────────────────────────┤
│ CONTRACT DETAILS                                           │
│                                                            │
│ Start Date: [2025-11-15    ▼]                             │
│ Duration: [12 ▼] months                                    │
│ End Date: 2025-11-15 (calculated)                         │
│                                                            │
│ Billing Cycle: [○] Monthly [○] Quarterly [●] Yearly      │
│                                                            │
│ Monthly Value: €1,500 (calculated)                        │
│                                                            │
│ Auto-renew: [✓] Yes [ ] No                                │
│                                                            │
│ ℹ️ Contract will be created with reference CTR-2025-00456│
├────────────────────────────────────────────────────────────┤
│ ACTIONS TRIGGERED                                          │
│ ✅ Opportunity marked as Won                              │
│ ✅ Contract created (draft status)                        │
│ ✅ Notifications sent to:                                 │
│    • Customer Success (onboarding)                        │
│    • Finance (billing setup)                              │
│    • Manager (deal won)                                   │
│ ✅ Email sent to Ahmed Al-Mansoori with contract         │
│ ✅ Task created: "Follow up signature"                    │
├────────────────────────────────────────────────────────────┤
│ [Cancel]                       [🎉 Win & Create Contract] │
└────────────────────────────────────────────────────────────┘
```

**Fonctionnalités :**

- **Won Date** : Date picker, défaut today, max today (pas de won date future)
- **Won Value** : Pré-rempli avec expected_value, éditable (si négociation a changé le montant)
- **Win Reason** : Textarea optionnel mais recommandé (analytics futures)
- **Start Date** : Date picker, défaut today, peut être future (contrat différé)
- **Duration** : Dropdown (3, 6, 12, 24, 36, 48, 60 mois), défaut 12
- **End Date** : Calculé automatiquement (start + duration), affiché en lecture seule
- **Billing Cycle** : Radio buttons (Monthly, Quarterly, Yearly), défaut Monthly
- **Monthly Value** : Calculé automatiquement (won_value / duration), lecture seule
- **Auto-renew** : Checkbox, défaut checked
- **Actions Triggered** : Liste des automatisations qui seront déclenchées (transparence)
- **Bouton Win** : Désactivé tant que formulaire invalide

**Validation côté client :**

- Won value min €100
- Start date >= today
- Duration entre 1 et 60 mois
- Si billing_cycle = yearly et duration < 12, warning "Yearly billing unusual for contracts <1 year"

**Soumission :**

- POST /api/v1/crm/opportunities/[id]/win avec toutes les données
- Affiche loader avec message "Creating contract..."
- Si succès :
  - Ferme modal
  - Toast "🎉 Opportunity won! Contract CTR-2025-00456 created"
  - Confetti animation (bibliothèque canvas-confetti)
  - Redirige vers /crm/contracts/[id] (page détail contract créé)
- Si erreur : affiche message erreur détaillé

**Fichier à créer : `app/[locale]/crm/contracts/page.tsx`**

Page liste de tous les contrats.

**Layout :**

```
┌──────────────────────────────────────────────────────────┐
│ HEADER                                                    │
│ [FleetCore Logo] CRM > Contracts         [+ New Contract]│
└──────────────────────────────────────────────────────────┘
┌──────────────────────────────────────────────────────────┐
│ CONTRACTS STATS                                          │
│ Total Contracts: 23 | Active: 15 | Draft: 5 | Expiring: 3│
│ MRR: €45,000 | ARR: €540,000                            │
└──────────────────────────────────────────────────────────┘
┌──────────────────────────────────────────────────────────┐
│ FILTRES                                                   │
│ [Status ▼] [Auto-renew ▼] [Start Date ▼] [Search...]    │
└──────────────────────────────────────────────────────────┘
┌──────────────────────────────────────────────────────────┐
│ CONTRACTS TABLE                                          │
│ ┌─────────┬──────────┬────────┬────────┬────────┬──────┐│
│ │REF      │COMPANY   │STATUS  │VALUE   │START   │RENEW││
│ ├─────────┼──────────┼────────┼────────┼────────┼──────┤│
│ │CTR-456  │ABC Log.  │ DRAFT  │€18k/yr │Nov 15  │ ✓   ││
│ │C2025-456│          │  🟡    │€1.5k/mo│        │     ││
│ │         │          │[Sign]  │        │12 mo   │[View]││
│ ├─────────┼──────────┼────────┼────────┼────────┼──────┤│
│ │CTR-455  │XYZ Trans │ ACTIVE │€24k/yr │Oct 1   │ ✓   ││
│ │         │          │  🟢    │€2k/mo  │        │[View]││
│ ├─────────┼──────────┼────────┼────────┼────────┼──────┤│
│ │CTR-450  │DEF Deliv │EXPIRING│€15k/yr │Nov 1   │ ✗   ││
│ │         │          │  🟠    │€1.25k  │30 days │[Renew││
│ └─────────┴──────────┴────────┴────────┴────────┴──────┘│
│ Showing 1-10 of 23                      [< 1 2 3 >]     │
└──────────────────────────────────────────────────────────┘
```

**Fonctionnalités :**

- **Stats cards** : Total contracts, status breakdown, MRR (Monthly Recurring Revenue), ARR (Annual Recurring Revenue)
- **Filtres** : Status (draft, signed, active, expiring, expired), Auto-renew (yes/no), Start date range, Search par company ou ref
- **Table contracts** : Colonnes triables
- **Badges status** :
  - 🟡 Draft : Contrat créé pas encore signé
  - 🔵 Pending Signature : Envoyé pour signature
  - 🟢 Active : Signé et en cours
  - 🟠 Expiring : Expire dans <30 jours
  - 🔴 Expired : Expiré
  - ⚫ Terminated : Résilié avant terme
- **Actions contextuelles** :
  - Draft → [Sign] [Edit] [Delete]
  - Active → [View] [Renew] [Terminate]
  - Expiring → [Renew] [View]

**Fichier à créer : `app/[locale]/crm/contracts/[id]/page.tsx`**

Page détail d'un contrat.

**Layout :**

```
┌──────────────────────────────────────────────────────────┐
│ [← Back] Contract CTR-2025-00456            [Actions ▼]  │
└──────────────────────────────────────────────────────────┘
┌──────────────────────────────────────────────────────────┐
│ CONTRACT HEADER                                          │
│ ABC Logistics                              Status: DRAFT │
│ Contract: CTR-2025-00456 (C2025-456)                    │
│ Total Value: €18,000                                     │
│ Monthly Value: €1,500                                    │
│ Duration: 12 months                                      │
│ Period: Nov 15, 2025 → Nov 15, 2026                     │
│ Auto-renew: Yes ✓                                       │
└──────────────────────────────────────────────────────────┘
┌──────────────────────────────────────────────────────────┐
│ ORIGIN                                                   │
│ Lead: Ahmed Al-Mansoori (Nov 5, 2025)                   │
│ Opportunity: OPP-2025-00123 (Nov 8, 2025)               │
│ Won By: Karim Al-Rashid (Nov 8, 2025)                   │
│ Win Reason: "Client impressed with demo..."              │
│ Days from Lead to Contract: 3 days ⚡                   │
└──────────────────────────────────────────────────────────┘
┌──────────────────────────────────────────────────────────┐
│ CLIENT DETAILS                                           │
│ Company: ABC Logistics                                   │
│ Contact: Ahmed Al-Mansoori                               │
│ Email: ahmed@abclogistics.ae                             │
│ Phone: +971 50 123 4567                                  │
│ Country: UAE 🇦🇪                                          │
│ Billing Address: [View/Edit]                            │
└──────────────────────────────────────────────────────────┘
┌──────────────────────────────────────────────────────────┐
│ BILLING                                                  │
│ Billing Cycle: Monthly                                   │
│ Next Invoice: Nov 15, 2025                              │
│ Payment Method: Not set [Add Card]                      │
│ Currency: EUR (€)                                        │
│ VAT Rate: 20% (France)                                   │
└──────────────────────────────────────────────────────────┘
┌──────────────────────────────────────────────────────────┐
│ CONTRACT DOCUMENT                                        │
│ ┌────────────────────────────────────────────────────┐  │
│ │ 📄 Contract CTR-2025-00456.pdf                     │  │
│ │ Generated: Nov 8, 2025 10:35 AM                    │  │
│ │ [📥 Download PDF] [📧 Send to Client]              │  │
│ └────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
┌──────────────────────────────────────────────────────────┐
│ ACTIONS                                                  │
│ [✍️ Mark Signed] [📧 Send for Signature] [🗑️ Delete]   │
│ [✏️ Edit] [📅 Schedule Renewal Reminder]                │
└──────────────────────────────────────────────────────────┘
```

**Fonctionnalités clés :**

- **Origin section** : Traçabilité complète Lead → Opportunity → Contract avec liens cliquables
- **Days from Lead to Contract** : Métrique vélocité commerciale
- **Contract Document** : PDF téléchargeable, bouton "Send to Client" pour email automatique
- **Actions contextuelles** selon status :
  - Draft : Edit, Delete, Send for Signature
  - Pending Signature : Resend, Mark Signed
  - Active : View Only, Schedule Renewal
  - Expiring : Renew, Terminate

**Composant à créer : `components/crm/ContractCard.tsx`**

Composant réutilisable pour afficher une carte contract (liste).

**Props :**

- contract : objet Contract complet
- onClick : callback clic carte

**Affichage :**

- Contract reference (CTR-XXX) et code (CXXX)
- Company name
- Badge status avec couleur
- Value (monthly + total/year)
- Period (start → end)
- Auto-renew indicator
- Actions rapides (View, Renew si expiring)

### 🎬 RÉSULTAT DÉMONTRABLE

**Scénario démo complet pour le sponsor :**

**1. Opportunity prête à win**

- Naviguer vers /crm/opportunities
- Cliquer sur carte "ABC Logistics" dans colonne "Closing"
- Page détail opportunity s'ouvre
- Voir bouton "✅ Mark Won" en haut à droite

**2. Clôture opportunity**

- Cliquer bouton "Mark Won"
- Modal WinOpportunityModal s'ouvre
- Voir formulaire pré-rempli :
  - Won Date : Nov 8, 2025
  - Won Value : €18,000
  - Start Date : Nov 15, 2025
  - Duration : 12 months
  - End Date : Nov 15, 2026 (calculé auto)
  - Billing : Monthly
  - Monthly Value : €1,500 (calculé auto)
  - Auto-renew : ✓
- Remplir Win Reason : "Client impressed with demo, pricing competitive"
- Vérifier liste "Actions Triggered" (notifications, email client, etc.)
- Cliquer "🎉 Win & Create Contract"

**3. Animation célébration**

- Modal se ferme
- Confetti animation à l'écran 🎉
- Toast "🎉 Opportunity won! Contract CTR-2025-00456 created"
- Redirection automatique vers /crm/contracts/CTR-2025-00456

**4. Contract créé visible**

- Page détail contract s'affiche
- Voir toutes les infos héritées correctement :
  - Company : ABC Logistics
  - Contact : Ahmed Al-Mansoori
  - Value : €18,000
  - Start : Nov 15, 2025
  - Reference : CTR-2025-00456
  - Status : DRAFT 🟡
- Voir Origin section avec liens Lead + Opportunity
- Voir "Days from Lead to Contract : 3 days ⚡"
- Voir Contract Document section avec PDF généré

**5. Vérifications traçabilité**

- Cliquer lien "Opportunity OPP-2025-00123"
- Retourner sur page opportunity
- Voir status changé : "WON 🎉"
- Voir won_date : Nov 8, 2025
- Voir won_value : €18,000
- Voir badge "Contract Created: CTR-2025-00456" cliquable
- Cliquer badge → retour page contract

**6. Liste contracts**

- Naviguer vers /crm/contracts
- Voir nouveau contrat dans liste :
  - CTR-2025-00456
  - ABC Logistics
  - Status : DRAFT 🟡
  - €18k/yr (€1.5k/mo)
  - Start : Nov 15
  - Auto-renew : ✓
- Voir stats mises à jour :
  - Total Contracts : 24 (était 23)
  - Draft : 6 (était 5)
  - ARR : €558,000 (était €540,000, +€18k)

**7. Téléchargement PDF**

- Cliquer sur contract CTR-2025-00456
- Section Contract Document visible
- Cliquer "📥 Download PDF"
- PDF téléchargé : Contract_CTR-2025-00456.pdf
- Ouvrir PDF, vérifier toutes les infos présentes :
  - Parties : FleetCore SAS ↔ ABC Logistics
  - Contact : Ahmed Al-Mansoori
  - Value : €18,000
  - Duration : 12 months
  - Terms : Billing monthly, Auto-renew, etc.

**8. Email client envoyé**

- Vérifier boîte email ahmed@abclogistics.ae (si env test)
- Email reçu : "Welcome to FleetCore - Contract CTR-2025-00456"
- Email contient :
  - Message personnalisé
  - PDF contract en pièce jointe
  - Lien pour signer électroniquement (future feature)
  - Contact support

**9. Notifications internes**

- Vérifier notifications manager :
  - "🎉 Karim won ABC Logistics - €18,000"
- Vérifier notifications Customer Success :
  - "New Customer Onboarding: ABC Logistics"
- Vérifier notifications Finance :
  - "New Contract: CTR-2025-00456 - €1,500/month"

**Critères d'acceptation :**

- ✅ Modal Win Opportunity pré-remplit données correctement
- ✅ Contract créé automatiquement avec toutes les données héritées
- ✅ Opportunity status passe à "won" avec won_date et won_value
- ✅ Lien bidirectionnel opportunity ↔ contract créé
- ✅ Contract_reference et contract_code uniques générés
- ✅ End_date calculé correctement (start_date + duration)
- ✅ Monthly_value calculé correctement (total / duration)
- ✅ PDF contract généré et téléchargeable
- ✅ Email envoyé automatiquement au client
- ✅ Notifications envoyées (manager, CS, finance)
- ✅ Audit logs créés (opportunity won, contract created)
- ✅ Page liste contracts affiche nouveau contrat
- ✅ Stats ARR/MRR mises à jour
- ✅ Animation confetti lors du win
- ✅ Traçabilité complète Lead → Opportunity → Contract

### ⏱️ ESTIMATION

- Temps backend : **12 heures**
  - markAsWon() : 4h
  - ContractService complet : 6h
  - PDF generation : 2h
- Temps API : **4 heures**
  - POST /win : 2h
  - GET/POST /contracts : 2h
- Temps frontend : **12 heures**
  - WinOpportunityModal : 4h
  - Page liste contracts : 4h
  - Page détail contract : 4h
- **TOTAL : 28 heures (1.5 jour)**

### 🔗 DÉPENDANCES

**Prérequis obligatoires :**

- Étape 2.1 terminée (gestion pipeline)
- Table crm_contracts existante
- Bibliothèque PDF (PDFKit ou jsPDF) installée
- Email service configuré (Resend ou autre)

**Services/composants requis :**

- OpportunityService (déjà créé)
- ContractService (nouveau)
- EmailService (Phase 0)
- NotificationService (Phase 0)

**Données de test nécessaires :**

- Opportunities en stage "Closing" prêtes à win
- Template PDF contract
- Email SMTP configuré pour env test

### ✅ CHECKLIST DE VALIDATION

- [ ] **Backend** : markAsWon() crée contract et met à jour opportunity
- [ ] **Backend** : ContractService.createContract() génère codes uniques
- [ ] **Backend** : Calcul end_date correct selon duration
- [ ] **Backend** : Calcul monthly_value correct
- [ ] **Backend** : PDF contract généré avec toutes les infos
- [ ] **Backend** : Lien bidirectionnel opportunity ↔ contract
- [ ] **Backend** : Notifications envoyées (4 types)
- [ ] **Backend** : Email client envoyé avec PDF
- [ ] **API** : POST /win retourne opportunity + contract
- [ ] **API** : GET /contracts retourne liste paginée
- [ ] **API** : GET /contracts/[id] retourne détails
- [ ] **API** : GET /contracts/[id]/pdf télécharge PDF
- [ ] **Frontend** : Modal Win pré-remplit données
- [ ] **Frontend** : Modal calcule end_date et monthly_value en temps réel
- [ ] **Frontend** : Animation confetti au win
- [ ] **Frontend** : Redirection vers contract créé
- [ ] **Frontend** : Page liste contracts affiche stats MRR/ARR
- [ ] **Frontend** : Page détail contract affiche origin avec liens
- [ ] **Frontend** : Téléchargement PDF fonctionne
- [ ] **Tests** : 15+ tests unitaires markAsWon
- [ ] **Tests** : Test E2E win opportunity → contract créé
- [ ] **Démo** : Sponsor peut win opp et voir contract créé
- [ ] **Démo** : PDF téléchargeable avec infos correctes

---

_[Suite du document avec Étape 2.3 et 2.4 dans le prochain message si nécessaire...]_

---

## NOTES IMPORTANTES

Ce document Sprint 2 est au même niveau de détail que le Sprint 1. Les étapes 2.3 (Lose Opportunity) et 2.4 (Analytics) suivront le même format ultra-détaillé si tu en as besoin.

**Ce que contient ce document :**

- Étape 2.1 : Gestion Pipeline (26h) - COMPLET
- Étape 2.2 : Win + Contract (28h) - COMPLET
- Total actuel : 54 heures sur 5 jours sprint

**Ce qui manque (mais suit le même format) :**

- Étape 2.3 : Lose Opportunity + Analyse Pertes (1 jour)
- Étape 2.4 : Analytics Dashboard + Forecast (1 jour)

Veux-tu que je continue avec 2.3 et 2.4 dans un nouveau message ?
