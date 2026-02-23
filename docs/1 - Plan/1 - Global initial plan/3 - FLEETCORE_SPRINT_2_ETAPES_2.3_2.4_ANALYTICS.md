# FLEETCORE - SPRINT 2 : OPPORTUNITY PIPELINE

## Étapes 2.3 et 2.4 - Lose Opportunity + Analytics & Forecast

**Date:** 10 Novembre 2025  
**Version:** 1.0 DÉFINITIVE  
**Durée:** 6 jours ouvrés  
**Prérequis:** Sprint 2 Étapes 2.1 et 2.2 complétées et déployées

---

## 📋 CONTEXTE

### État Actuel Sprint 2 (Étapes 2.1 et 2.2 COMPLÉTÉES)

**✅ DÉJÀ LIVRÉ ET OPÉRATIONNEL :**

**Étape 2.1 : Gestion Pipeline (26h)**

- Service OpportunityService complet avec toutes méthodes CRUD
- Pipeline Kanban 5 colonnes (Prospecting, Qualification, Proposal, Negotiation, Closing)
- Drag & drop opportunities entre stages avec recalcul automatique probability_percent
- Filtres avancés (stage, status, owner, date_range, pipeline)
- OpportunityCard composant avec affichage valeur, probability, owner, dates
- Stats pipeline en temps réel (nombre opps, forecast value par colonne)

**Étape 2.2 : Win + Contract (28h)**

- Méthode OpportunityService.markAsWon() fonctionnelle
- Création automatique contrat depuis opportunity gagnée
- Modal WinOpportunityModal avec formulaire won_value, won_date, contract_terms
- Workflow complet : Opportunity Won → Contract Created → Tenant Provisioning déclenché
- Notifications automatiques (manager, customer success, finance)
- Page détail opportunity avec historique complet

**🎯 PÉRIMÈTRE CE DOCUMENT :**

Ce document couvre UNIQUEMENT :

- **Étape 2.3** : Lose Opportunity + Analyse Pertes (3 jours)
- **Étape 2.4** : Analytics Dashboard + Forecast (3 jours)
- **Transition Sprint 2 → Sprint 3** : État final et dépendances

---

# ÉTAPE 2.3 : LOSE OPPORTUNITY + ANALYSE PERTES

**Durée:** 3 jours (24 heures)  
**Objectif:** Permettre de clore proprement les opportunités perdues avec analyse des motifs pour amélioration continue du processus commercial.

---

## 🎯 RATIONNEL MÉTIER

### POURQUOI cette fonctionnalité est critique

**PROBLÈME BUSINESS :** Une entreprise perd en moyenne 40-60% des opportunités commerciales. Sans système structuré d'analyse des pertes, impossible de comprendre POURQUOI on perd et donc d'améliorer. Les commerciaux marquent simplement "Perdu" sans détails, l'information est perdue, les mêmes erreurs se répètent indéfiniment.

**IMPACT SI ABSENT :**

- **Amélioration impossible** : On perd 50% des deals mais on ne sait pas pourquoi (prix trop élevé ? Features manquantes ? Concurrent plus rapide ?)
- **Budget marketing gaspillé** : On continue d'investir sur des segments qui ne convertissent jamais (ex: PME <10 véhicules ont 90% taux de perte)
- **Démotivation commerciale** : Commerciaux découragés car répètent les mêmes erreurs sans feedback
- **Revenus perdus** : 20-30% des opportunités perdues sont "récupérables" avec bon nurturing, mais sans analyse on ne sait pas lesquelles

**CAS D'USAGE CONCRET :**

**Situation T1 2025 (sans analyse pertes) :**

- 100 opportunités créées
- 30 gagnées (30% taux conversion)
- 70 perdues, marquées simplement "Perdu" sans détails
- Chiffre d'affaires : 450k€
- Management ne sait pas pourquoi 70% perdues

**Après implémentation analyse pertes (T2 2025) :**

- Analyse T1 révèle :
  - 35 perdues pour "Prix trop élevé" (50%)
  - 20 perdues pour "Features manquantes" (28.5%)
  - 10 perdues pour "Concurrent choisi" (14.3%)
  - 5 perdues pour "Timing" (7.2%)

**ACTIONS CORRECTIVES PRISES :**

1. **Prix** : Création offre "Starter" à -40% pour PME
   - Résultat T2 : Pertes "Prix" passent de 35 à 15 (-57%)
2. **Features** : Développement prioritaire des 3 features les plus demandées
   - Résultat T2 : Pertes "Features" passent de 20 à 8 (-60%)

3. **Concurrent** : Analyse montre que concurrent X gagne sur "Support 24/7"
   - Action : Lancement support 24/7
   - Résultat T2 : Pertes "Concurrent" passent de 10 à 5 (-50%)

**RÉSULTAT T2 2025 :**

- 100 opportunités créées
- 58 gagnées (58% taux conversion, +93% vs T1)
- 42 perdues (vs 70 en T1, -40% pertes)
- Chiffre d'affaires : 870k€ (+93% vs T1)

**ROI de l'analyse des pertes :** +420k€ CA en 1 trimestre pour 24h de développement.

### VALEUR AJOUTÉE POUR FLEETCORE

**Pour l'équipe Commerciale :**

- Feedback immédiat sur leurs offres (prix compétitifs ? Features suffisantes ?)
- Identification des objections récurrentes → formation ciblée
- Priorisation efforts sur segments qui convertissent

**Pour le Management :**

- Dashboard en temps réel : "Pourquoi perdons-nous ?"
- Décisions data-driven sur roadmap produit (features à développer)
- Décisions pricing (faut-il baisser les prix ? Créer une offre low-cost ?)
- Allocation ressources commerciales (arrêter de prospecter segments qui ne convertissent jamais)

**Pour le Produit :**

- Top 10 features manquantes demandées par prospects perdus
- Priorisation roadmap basée sur impact CA (feature X = 20 deals perdus = 300k€ potentiel)

**Pour le Marketing :**

- Ajustement messages (si "Prix trop élevé", mettre en avant ROI et économies)
- Arrêt campagnes sur segments qui ne convertissent pas
- Création contenu répondant aux objections (ex: livre blanc "ROI Fleet Management")

---

## 📊 DONNÉES ET RÈGLES MÉTIER

### Tables Impliquées

**Table principale : `crm_opportunities`**

- Colonnes à renseigner lors de la perte :
  - `status` : Passe de "open" à "lost"
  - `lost_date` : Date de la perte (obligatoire)
  - `loss_reason_id` : FK vers crm_opportunity_loss_reasons (obligatoire)
  - `stage` : Passe automatiquement à "closed"
  - `close_date` : Renseigné automatiquement = lost_date
  - `notes` : Détails additionnels sur la perte (optionnel mais recommandé)

**Table de référence : `crm_opportunity_loss_reasons`**
Structure de la table :

- `id` : UUID primary key
- `name` : Nom du motif (ex: "Prix trop élevé")
- `category` : Catégorie (price, product, competition, timing, other)
- `description` : Description détaillée
- `is_active` : Booléen (permet de désactiver sans supprimer)
- `sort_order` : Ordre d'affichage dans les dropdowns
- `is_recoverable` : Booléen (indique si l'opp peut être relancée plus tard)
- `recovery_delay_days` : Nombre de jours avant relance suggérée

**Motifs de perte standard (données à seed) :**

**Catégorie PRICE (prix) :**

1. Prix trop élevé - is_recoverable: true, recovery_delay: 90 jours
2. Budget insuffisant - is_recoverable: true, recovery_delay: 180 jours
3. ROI pas démontré - is_recoverable: true, recovery_delay: 60 jours

**Catégorie PRODUCT (produit) :** 4. Features manquantes critiques - is_recoverable: true, recovery_delay: 120 jours 5. Intégrations manquantes - is_recoverable: true, recovery_delay: 90 jours 6. UI trop complexe - is_recoverable: false 7. Performance insuffisante - is_recoverable: false

**Catégorie COMPETITION (concurrence) :** 8. Concurrent choisi (prix) - is_recoverable: true, recovery_delay: 180 jours 9. Concurrent choisi (features) - is_recoverable: true, recovery_delay: 120 jours 10. Relation existante avec concurrent - is_recoverable: false

**Catégorie TIMING (temporalité) :** 11. Projet reporté - is_recoverable: true, recovery_delay: 90 jours 12. Pas prêt maintenant - is_recoverable: true, recovery_delay: 180 jours 13. Réorganisation interne - is_recoverable: true, recovery_delay: 120 jours

**Catégorie OTHER (autre) :** 14. Plus de réponse (ghosting) - is_recoverable: true, recovery_delay: 60 jours 15. Mauvais fit produit - is_recoverable: false 16. Raison non communiquée - is_recoverable: false

### Règles Métier Critiques

**RÈGLE 1 : Obligation de renseigner le motif de perte**

```
SI opportunity.status passe à "lost"
ALORS
  - loss_reason_id EST OBLIGATOIRE (NOT NULL)
  - lost_date EST OBLIGATOIRE (NOT NULL, défaut = NOW())
  - Si loss_reason_id NULL → ERREUR "Vous devez sélectionner un motif de perte"
FIN SI
```

**RÈGLE 2 : Cohérence des dates**

```
VALIDATION lost_date :
  - lost_date >= opportunity.created_at
  - lost_date >= opportunity.expected_close_date (warning si avant, pas d'erreur)
  - lost_date <= NOW() (pas de perte dans le futur)
  - close_date = lost_date (automatique)
```

**RÈGLE 3 : Stage automatique "closed"**

```
SI status = "lost"
ALORS stage = "closed" (automatique, non modifiable)
```

**RÈGLE 4 : Interdiction de modifier une opportunité perdue**

```
SI opportunity.status = "lost" ET lost_date < NOW() - 7 jours
ALORS modifications interdites (sauf par admin)
RAISON : Après 7 jours, l'opportunité est archivée, modifications fausseraient les stats
```

**RÈGLE 5 : Workflow de nurturing pour opportunités récupérables**

```
SI loss_reason.is_recoverable = true
ALORS
  - Créer tâche de suivi dans (lost_date + recovery_delay_days)
  - Assigner tâche au commercial original
  - Type tâche : "Relancer opportunité perdue"
  - Contenu tâche : "Le motif était '{loss_reason.name}'. Vérifier si situation a changé."
FIN SI
```

**RÈGLE 6 : Notification stakeholders**

```
LORS DE opportunity.status = "lost" :
  - Notifier commercial assigné (email + in-app)
  - Notifier manager commercial (email résumé hebdomadaire pertes)
  - SI expected_value > 50000€ ALORS notifier directeur commercial immédiatement
  - Créer entrée dans adm_audit_logs (action="opportunity_lost")
```

**RÈGLE 7 : Impact sur forecast**

```
SI status = "lost"
ALORS
  - forecast_value = 0 (supprimé du pipeline)
  - Recalculer forecast_total du pipeline
  - Mettre à jour stats équipe (taux conversion, valeur moyenne)
FIN SI
```

### Règles de Validation Zod

**Schema OpportunityLoseInput :**

- loss_reason_id : UUID obligatoire, doit exister dans crm_opportunity_loss_reasons
- lost_date : Date optionnelle (défaut NOW()), doit être >= created_at et <= NOW()
- notes : String optionnelle, max 2000 caractères
- competitor_name : String optionnelle (si loss_reason = "Concurrent choisi"), max 100 caractères
- metadata : Objet optionnel pour infos additionnelles

---

## 🏗️ COMPOSANTS À DÉVELOPPER

### Backend (Service Layer)

**Modification fichier : `lib/services/crm/opportunity.service.ts`**

Ajouter la méthode de gestion des pertes.

**Méthode markAsLost(opportunityId: string, loseData: OpportunityLoseInput) → Promise<Opportunity>**

**Algorithme détaillé :**

```
FONCTION markAsLost(opportunityId, loseData) :

  ÉTAPE 1 : VALIDATIONS PRÉALABLES
  ├─ Valider loseData avec OpportunityLoseSchema
  ├─ Récupérer opportunity depuis DB
  ├─ Vérifier opportunity.status = "open"
  │  └─ SI status != "open" ALORS throw BusinessRuleError("Cette opportunité est déjà close")
  ├─ Vérifier loss_reason_id existe dans crm_opportunity_loss_reasons
  │  └─ SI inexistant ALORS throw ValidationError("Motif de perte invalide")
  └─ Vérifier lost_date <= NOW()
     └─ SI futur ALORS throw ValidationError("La date de perte ne peut être dans le futur")

  ÉTAPE 2 : RÉCUPÉRATION DONNÉES COMPLÉMENTAIRES
  ├─ Récupérer loss_reason complet depuis crm_opportunity_loss_reasons
  ├─ Récupérer lead d'origine (via opportunity.lead_id)
  └─ Récupérer commercial assigné (via opportunity.assigned_to)

  ÉTAPE 3 : MISE À JOUR OPPORTUNITY
  ├─ opportunity.status = "lost"
  ├─ opportunity.stage = "closed"
  ├─ opportunity.lost_date = loseData.lost_date || NOW()
  ├─ opportunity.close_date = opportunity.lost_date
  ├─ opportunity.loss_reason_id = loseData.loss_reason_id
  ├─ opportunity.forecast_value = 0
  ├─ SI loseData.notes fourni ALORS opportunity.notes += "\n[PERTE] " + loseData.notes
  ├─ SI loseData.competitor_name fourni ALORS
  │  └─ opportunity.metadata.competitor_name = loseData.competitor_name
  └─ opportunity.updated_at = NOW()

  ÉTAPE 4 : MISE À JOUR LEAD D'ORIGINE
  ├─ lead.status = "lost_opportunity" (permet de savoir que ce lead a généré une opp perdue)
  └─ lead.last_activity_date = NOW()

  ÉTAPE 5 : GESTION NURTURING SI RÉCUPÉRABLE
  SI loss_reason.is_recoverable = true ALORS
    ├─ Calculer recovery_date = lost_date + loss_reason.recovery_delay_days
    ├─ Créer tâche de suivi dans CRM :
    │  ├─ title: "Relancer {opportunity.company_name} - Opportunité perdue"
    │  ├─ description: "Motif perte: {loss_reason.name}. Vérifier si situation a changé."
    │  ├─ due_date: recovery_date
    │  ├─ assigned_to: opportunity.assigned_to
    │  └─ type: "follow_up_lost_opportunity"
    └─ lead.status = "nurturing" (lead repasse en nurturing, pas définitivement perdu)
  SINON
    └─ lead.status = "disqualified" (lead définitivement perdu)
  FIN SI

  ÉTAPE 6 : AUDIT ET NOTIFICATIONS
  ├─ Créer audit log :
  │  ├─ action: "opportunity_lost"
  │  ├─ entity: "opportunities"
  │  ├─ entity_id: opportunityId
  │  ├─ old_values: { status: "open", stage: ancien_stage }
  │  ├─ new_values: { status: "lost", stage: "closed", loss_reason: loss_reason.name }
  │  └─ member_id: utilisateur_courant
  ├─ Créer lifecycle event :
  │  ├─ event_type: "opportunity_lost"
  │  └─ metadata: { loss_reason, expected_value, lost_date }
  ├─ Notifier commercial assigné (email + in-app) :
  │  └─ "L'opportunité {company_name} a été marquée comme perdue. Motif: {loss_reason.name}"
  ├─ Notifier manager commercial (notification in-app uniquement) :
  │  └─ "{commercial_name} a perdu l'opportunité {company_name} ({expected_value}€)"
  └─ SI expected_value > 50000€ ALORS
     └─ Notifier directeur commercial (email + in-app immédiat) :
        └─ "ALERTE : Opportunité haute valeur perdue - {company_name} - {expected_value}€"

  ÉTAPE 7 : RECALCUL METRICS PIPELINE
  ├─ Appeler pipelineService.recalculateStats(opportunity.pipeline_id)
  │  └─ Recalcule : forecast_total, nb_opportunities_open, taux_conversion
  └─ Appeler teamService.recalculateStats(opportunity.assigned_to)
     └─ Recalcule stats personnelles commercial : taux_conversion, valeur_moyenne_deal

  ÉTAPE 8 : RETOUR
  └─ Retourner opportunity mise à jour avec loss_reason inclus

FIN FONCTION
```

**Méthode getLossAnalysis(filters: LossAnalysisFilters) → Promise<LossAnalysisData>**

**Algorithme détaillé :**

```
FONCTION getLossAnalysis(filters) :

  ÉTAPE 1 : CONSTRUCTION QUERY BASE
  ├─ Query = "SELECT * FROM crm_opportunities WHERE status = 'lost'"
  ├─ SI filters.date_from fourni ALORS Query += "AND lost_date >= filters.date_from"
  ├─ SI filters.date_to fourni ALORS Query += "AND lost_date <= filters.date_to"
  ├─ SI filters.pipeline_id fourni ALORS Query += "AND pipeline_id = filters.pipeline_id"
  ├─ SI filters.assigned_to fourni ALORS Query += "AND assigned_to = filters.assigned_to"
  └─ Query += "AND deleted_at IS NULL"

  ÉTAPE 2 : RÉCUPÉRATION OPPORTUNITÉS PERDUES
  ├─ Exécuter query avec joins :
  │  ├─ LEFT JOIN crm_opportunity_loss_reasons ON loss_reason_id
  │  ├─ LEFT JOIN adm_members ON assigned_to
  │  └─ LEFT JOIN crm_pipelines ON pipeline_id
  └─ Stocker résultats dans opportunities_lost[]

  ÉTAPE 3 : CALCUL METRICS GLOBALES
  ├─ total_lost = COUNT(opportunities_lost)
  ├─ total_value_lost = SUM(expected_value) pour toutes opportunities_lost
  ├─ average_deal_size_lost = total_value_lost / total_lost
  ├─ Récupérer total_opportunities_all (won + lost + open) sur même période
  ├─ loss_rate = (total_lost / total_opportunities_all) × 100
  └─ recoverable_count = COUNT(opportunities WHERE loss_reason.is_recoverable = true)

  ÉTAPE 4 : ANALYSE PAR MOTIF (TOP 10)
  ├─ Grouper opportunities_lost par loss_reason_id
  ├─ Pour chaque motif :
  │  ├─ count = nombre d'opportunités perdues pour ce motif
  │  ├─ percentage = (count / total_lost) × 100
  │  ├─ total_value = SUM(expected_value) pour ce motif
  │  ├─ average_value = total_value / count
  │  └─ recoverable = SI loss_reason.is_recoverable ALORS count SINON 0
  ├─ Trier par count DESC
  └─ Retourner TOP 10 motifs

  ÉTAPE 5 : ANALYSE PAR CATÉGORIE
  ├─ Grouper opportunities_lost par loss_reason.category
  ├─ Pour chaque catégorie (price, product, competition, timing, other) :
  │  ├─ count = nombre d'opportunités
  │  ├─ percentage = (count / total_lost) × 100
  │  └─ total_value = SUM(expected_value)
  └─ Retourner distribution par catégorie

  ÉTAPE 6 : ANALYSE PAR STAGE DE PERTE
  ├─ Grouper opportunities_lost par stage au moment de la perte
  │  └─ Utiliser metadata.stage_before_closing si disponible
  ├─ Pour chaque stage (prospecting, qualification, proposal, negotiation) :
  │  ├─ count = nombre d'opportunités perdues à ce stage
  │  ├─ percentage = (count / total_lost) × 100
  │  └─ Insight : Si >40% perdues au stage "proposal" → problème de pricing
  └─ Retourner distribution par stage

  ÉTAPE 7 : ANALYSE TEMPORELLE (TENDANCE)
  ├─ Grouper opportunities_lost par mois (lost_date)
  ├─ Pour chaque mois des 12 derniers mois :
  │  ├─ count = nombre d'opportunités perdues ce mois
  │  ├─ total_value = SUM(expected_value)
  │  └─ loss_rate = (count / total_opportunities_ce_mois) × 100
  └─ Retourner array de 12 mois avec tendance (amélioration ou dégradation)

  ÉTAPE 8 : TOP COMPÉTITEURS (SI CATEGORY = COMPETITION)
  ├─ Filtrer opportunities_lost où loss_reason.category = "competition"
  ├─ Extraire competitor_name depuis metadata
  ├─ Grouper par competitor_name
  ├─ Pour chaque concurrent :
  │  ├─ count = nombre de fois où ce concurrent a gagné contre nous
  │  ├─ total_value = SUM(expected_value)
  │  └─ win_rate = (count / total_lost_competition) × 100
  ├─ Trier par count DESC
  └─ Retourner TOP 5 concurrents

  ÉTAPE 9 : INSIGHTS AUTOMATIQUES (IA/RÈGLES)
  ├─ Calculer insights basés sur données :
  │
  │  SI price_category > 40% du total ALORS
  │    ├─ insight: "40% des pertes sont dues au prix trop élevé"
  │    ├─ recommendation: "Considérer création offre low-cost ou réduction prix"
  │    └─ priority: "high"
  │
  │  SI product_category > 30% du total ALORS
  │    ├─ insight: "30% des pertes dues à features manquantes"
  │    ├─ Identifier TOP 3 features manquantes (extraire depuis notes)
  │    ├─ recommendation: "Prioriser développement : {top_3_features}"
  │    └─ priority: "high"
  │
  │  SI loss_rate > 60% ALORS
  │    ├─ insight: "Taux de perte très élevé (60%+)"
  │    ├─ recommendation: "Revoir processus qualification leads en amont"
  │    └─ priority: "critical"
  │
  │  SI competition_category > 50% ALORS
  │    ├─ insight: "Plus de 50% des pertes face à concurrents"
  │    ├─ recommendation: "Analyse concurrentielle approfondie nécessaire"
  │    └─ priority: "high"
  │
  └─ Retourner array d'insights avec recommendations actionnables

  ÉTAPE 10 : CONSTRUCTION RÉPONSE
  └─ Retourner objet LossAnalysisData :
     ├─ summary: { total_lost, total_value_lost, loss_rate, recoverable_count }
     ├─ by_reason: array de motifs avec count, percentage, value
     ├─ by_category: array de catégories avec distribution
     ├─ by_stage: array de stages avec count et percentage
     ├─ trend: array de 12 mois avec évolution
     ├─ top_competitors: array de 5 concurrents principaux
     └─ insights: array d'insights avec recommendations

FIN FONCTION
```

**Fichier à créer : `lib/services/crm/loss-reason.service.ts`**

Service pour gérer les motifs de perte.

**Méthode getAllReasons() → Promise<LossReason[]>**

```
FONCTION getAllReasons() :
  ├─ Query: SELECT * FROM crm_opportunity_loss_reasons WHERE is_active = true
  ├─ ORDER BY sort_order ASC, category ASC, name ASC
  └─ Retourner array de motifs groupés par catégorie
FIN FONCTION
```

**Méthode createReason(data: LossReasonCreateInput) → Promise<LossReason>**

```
FONCTION createReason(data) :
  ├─ Valider data avec LossReasonCreateSchema
  ├─ Vérifier name unique (éviter doublons)
  ├─ Créer dans crm_opportunity_loss_reasons
  ├─ Créer audit log (action: "loss_reason_created")
  └─ Retourner motif créé
FIN FONCTION
```

### API REST (Endpoints)

**Fichier à créer : `app/api/v1/crm/opportunities/[id]/lose/route.ts`**

**POST /api/v1/crm/opportunities/[id]/lose**

**Spécifications détaillées :**

**Description :** Marquer une opportunité comme perdue avec motif obligatoire.

**Permissions requises :** opportunities.update OU être le owner de l'opportunity

**Request Body :**

- loss_reason_id : UUID obligatoire
- lost_date : Date optionnelle (défaut NOW())
- notes : String optionnelle max 2000 caractères
- competitor_name : String optionnelle (si motif = concurrent)

**Validation :**

- Vérifier que opportunity.status = "open" (pas déjà close)
- Vérifier que loss_reason_id existe et is_active = true
- Vérifier que lost_date <= NOW()

**Réponse 200 Success :**
Retourne opportunity mise à jour avec :

- status: "lost"
- stage: "closed"
- lost_date: date renseignée
- loss_reason: objet complet du motif (name, category, is_recoverable)
- forecast_value: 0
- close_date: = lost_date

**Erreurs possibles :**

- 400 Bad Request : Validation body échouée (loss_reason_id manquant, notes trop longues)
- 403 Forbidden : Utilisateur n'a pas permission de modifier cette opportunity
- 404 Not Found : Opportunity inexistante ou appartient à autre tenant
- 422 Unprocessable Entity : Opportunity déjà close (status = won ou lost)

**Actions déclenchées :**

- Création audit log
- Notifications commerciaux (owner + manager)
- SI is_recoverable: création tâche de follow-up
- Recalcul stats pipeline

**Fichier à créer : `app/api/v1/crm/loss-reasons/route.ts`**

**GET /api/v1/crm/loss-reasons**

**Description :** Liste tous les motifs de perte actifs, groupés par catégorie.

**Permissions :** opportunities.read (tout utilisateur authentifié)

**Query params :**

- category : Filtrer par catégorie (price, product, competition, timing, other)
- is_recoverable : Filtrer par récupérable (true/false)

**Réponse 200 :**
Array de motifs groupés par catégorie, chaque motif contient :

- id, name, category, description
- is_recoverable, recovery_delay_days
- sort_order

**Fichier à créer : `app/api/v1/crm/analytics/loss-analysis/route.ts`**

**GET /api/v1/crm/analytics/loss-analysis**

**Description :** Analytics complet des opportunités perdues avec insights actionnables.

**Permissions :** opportunities.read + analytics.view (managers et admins)

**Query params :**

- date_from : Date début analyse (défaut: -90 jours)
- date_to : Date fin analyse (défaut: aujourd'hui)
- pipeline_id : Filtrer par pipeline spécifique
- assigned_to : Filtrer par commercial
- group_by : Groupement (reason, category, stage, month)

**Réponse 200 :**
Objet LossAnalysisData complet avec :

- summary : métriques globales (total_lost, value_lost, loss_rate)
- by_reason : distribution par motif (TOP 10)
- by_category : distribution par catégorie
- by_stage : distribution par stage de perte
- trend : évolution sur 12 mois
- top_competitors : TOP 5 concurrents
- insights : array d'insights avec recommendations

**Cache :** Résultats mis en cache 1 heure (données analytics lourdes)

### Frontend (Interface Utilisateur)

**Composant à créer : `components/crm/LoseOpportunityModal.tsx`**

**Modal formulaire pour marquer une opportunity comme perdue.**

**Props :**

- opportunity : Objet Opportunity complet
- onClose : Callback fermeture modal
- onSuccess : Callback succès (refresh liste)

**Structure du formulaire :**

**Section 1 : Informations opportunity (readonly)**

- Company name (readonly)
- Expected value (readonly)
- Stage actuel (readonly)
- Owner (readonly)

**Section 2 : Motif de perte (obligatoire)**

- **Dropdown Loss Reason** :
  - Groupé par catégorie (Price, Product, Competition, Timing, Other)
  - Afficher name + description au hover
  - Badge si is_recoverable (vert "Récupérable")
- **Champ conditionnel Competitor Name** :
  - Affiché SEULEMENT si motif sélectionné catégorie = "competition"
  - Input texte max 100 caractères
  - Placeholder: "Nom du concurrent (ex: Concurrent X)"

**Section 3 : Date et détails**

- **Date de perte** : Date picker, défaut = aujourd'hui, max = aujourd'hui
- **Notes** : Textarea optionnelle, max 2000 caractères
  - Placeholder: "Détails sur la perte : que s'est-il passé ? Quelle était l'objection principale ?"
  - Helper text: "Ces notes aideront à améliorer notre processus commercial"

**Section 4 : Informations récupérable**

- SI loss_reason.is_recoverable = true :
  - Afficher alerte info bleue :
    - "📅 Cette opportunité sera automatiquement relancée dans {recovery_delay_days} jours"
    - "Une tâche de suivi sera créée et assignée à {owner_name}"

**Validation :**

- Loss_reason_id obligatoire
- Si category = competition : competitor_name obligatoire
- Lost_date obligatoire, <= aujourd'hui

**Soumission :**

- POST /api/v1/crm/opportunities/[id]/lose
- Affiche loader pendant appel API
- Si succès :
  - Toast success : "Opportunité marquée comme perdue. {message_nurturing_si_recuperable}"
  - Ferme modal
  - Callback onSuccess() → refresh liste
- Si erreur :
  - Toast erreur avec message détaillé

**Composant à créer : `components/crm/LossAnalysisDashboard.tsx`**

**Dashboard complet d'analyse des pertes avec graphiques et insights.**

**Structure du dashboard :**

**Header avec filtres :**

- Date range picker (défaut: 90 derniers jours)
- Dropdown pipeline (tous ou spécifique)
- Dropdown commercial (tous ou spécifique)
- Bouton "Export CSV"

**Section 1 : KPI Cards (4 cartes côte à côte)**

**Carte 1 : Total Pertes**

- Nombre total d'opportunités perdues
- Comparaison vs période précédente (+/- X%)
- Icône 📉

**Carte 2 : Valeur Perdue**

- Somme expected_value de toutes pertes
- Format: "450,000 €"
- Comparaison vs période précédente
- Icône 💰

**Carte 3 : Taux de Perte**

- Pourcentage (pertes / total opportunités)
- Format: "58%"
- Badge couleur : vert si <40%, orange 40-60%, rouge >60%
- Icône 📊

**Carte 4 : Récupérables**

- Nombre d'opportunités is_recoverable = true
- "23 opportunités récupérables"
- Lien vers liste des opportunités à relancer
- Icône 🔄

**Section 2 : Graphiques Principaux**

**Graphique 1 : Distribution par Motif (Donut Chart)**

- Affiche TOP 10 loss_reasons
- Couleurs différentes par catégorie
- Légende avec pourcentages
- Au clic : drill-down sur les opportunités de ce motif
- Bibliothèque : Recharts

**Graphique 2 : Distribution par Catégorie (Bar Chart horizontal)**

- 5 barres (Price, Product, Competition, Timing, Other)
- Axe X : pourcentage
- Affiche count + value sur chaque barre
- Couleurs : rouge pour Price, bleu Product, orange Competition, vert Timing, gris Other

**Graphique 3 : Tendance Temporelle (Line Chart)**

- Axe X : 12 derniers mois
- Axe Y : nombre de pertes
- 2 lignes :
  - Ligne rouge : nombre d'opportunités perdues
  - Ligne bleue : taux de perte (%)
- Marqueurs sur points clés (pics ou creux)

**Graphique 4 : Distribution par Stage de Perte (Funnel Chart)**

- Entonnoir inversé montrant à quel stage les pertes surviennent
- 5 étages : Prospecting, Qualification, Proposal, Negotiation, Closing
- Plus large = plus de pertes à ce stage
- Permet d'identifier où le processus casse

**Section 3 : Insights Automatiques**

**Carte Insights** (style alerte avec icône 💡) :

- Affiche 3-5 insights générés automatiquement
- Chaque insight contient :
  - Titre (ex: "40% des pertes dues au prix")
  - Description (statistiques détaillées)
  - Recommendation actionnelle (ex: "Créer une offre Starter à -30%")
  - Badge priorité (Critical rouge, High orange, Medium jaune)
  - Bouton "Marquer comme lu"

**Exemples d'insights :**

- "⚠️ Taux de perte très élevé (65%). Revoir qualification leads en amont."
- "💰 35% des pertes dues au prix. Envisager offre low-cost pour PME."
- "🏆 Concurrent X gagne 60% des deals face-à-face. Analyse concurrentielle nécessaire."
- "🚀 15% des pertes dues à features manquantes. TOP 3 : Mobile app, API intégrations, Reporting avancé"

**Section 4 : Top Concurrents (Si applicable)**

**Table concurrents :**

- Colonnes : Nom concurrent, Nb fois gagné, Valeur perdue, % des pertes competition
- Triée par nombre de victoires DESC
- TOP 5 affichés
- Au clic ligne : drill-down opportunités perdues face à ce concurrent

**Section 5 : Actions Recommandées**

**Liste d'actions actionnables générées automatiquement :**

- Basées sur les insights
- Chaque action a :
  - Titre action
  - Impact estimé (ex: "+15% conversion" ou "+200k€ ARR")
  - Effort requis (Faible, Moyen, Élevé)
  - Responsable suggéré (Marketing, Product, Sales)
  - Bouton "Créer tâche" → crée tâche dans CRM

**Fichier page : `app/[locale]/crm/analytics/loss-analysis/page.tsx`**

**Page complète d'analytics des pertes.**

**Layout :**

- Header : "Analyse des Opportunités Perdues"
- Breadcrumb : CRM > Analytics > Loss Analysis
- Composant <LossAnalysisDashboard /> en pleine largeur
- Footer : Dernière mise à jour + bouton "Actualiser"

**Permissions :**

- Accessible uniquement aux managers et admins (RBAC check)
- Middleware requirePermission("analytics.view")

---

## 🎬 RÉSULTAT DÉMONTRABLE

### Scénario Démo Complet Sponsor

**CONTEXTE DÉMO :**
Nous sommes manager commercial FleetCore. Fin du trimestre, nous voulons comprendre POURQUOI nous perdons 60% des opportunités.

**ÉTAPE 1 : Marquer une opportunité comme perdue**

1. Naviguer vers /crm/opportunities
2. Cliquer sur carte opportunity "XYZ Transport - 24k€" (stage Proposal)
3. Page détail opportunity s'ouvre
4. Cliquer bouton "❌ Mark as Lost" (rouge)
5. Modal "Lose Opportunity" s'ouvre :
   - Affiche infos opportunity (XYZ Transport, 24k€, stage Proposal)
   - Section "Motif de perte" avec dropdown groupé
6. Sélectionner motif : **"Prix trop élevé"** (catégorie Price)
7. Modal affiche automatiquement alerte bleue :
   - "📅 Cette opportunité sera relancée dans 90 jours"
   - "Une tâche de suivi sera créée"
8. Date de perte : aujourd'hui (pré-rempli)
9. Notes : "Client trouvait notre offre 40% plus chère que concurrent Y. A préféré économiser à court terme malgré nos features supérieures."
10. Cliquer "Marquer comme Perdue"
11. Loader s'affiche 2 secondes
12. Toast success : "Opportunité perdue enregistrée. Elle sera relancée automatiquement le 8 février 2026."
13. Redirection vers liste opportunities
14. Carte "XYZ Transport" a disparu de la colonne Proposal
15. Badge "Lost" apparaît dans filtres avec count +1

**ÉTAPE 2 : Vérifier création tâche de suivi**

1. Naviguer vers /crm/tasks (module Tasks)
2. Voir nouvelle tâche créée :
   - Titre : "Relancer XYZ Transport - Opportunité perdue"
   - Due date : 8 février 2026 (dans 90 jours)
   - Assignée à : Karim Al-Rashid (owner original de l'opp)
   - Description : "Motif perte: Prix trop élevé. Vérifier si situation a changé ou si nouveau budget disponible."
   - Statut : To Do

**ÉTAPE 3 : Accéder au dashboard analyse pertes**

1. Naviguer vers /crm/analytics/loss-analysis
2. Dashboard complet s'affiche
3. **Section KPI visible :**
   - Total Pertes : 42 (-15% vs T1) ✅ amélioration
   - Valeur Perdue : 650,000€ (-22% vs T1)
   - Taux de Perte : 58% (-12% vs T1) badge orange
   - Récupérables : 23 opportunités (55%)

**ÉTAPE 4 : Analyser distribution par motif**

1. Voir Donut Chart "Distribution par Motif"
2. Identifier les 3 principaux motifs :
   - Prix trop élevé : 35% (15 opportunités, 360k€)
   - Features manquantes : 28% (12 opportunités, 280k€)
   - Concurrent choisi : 19% (8 opportunités, 190k€)
3. Cliquer sur segment "Prix trop élevé"
4. Drill-down : liste des 15 opportunités perdues pour ce motif
5. Voir patterns : Toutes sont des PME <50 véhicules

**ÉTAPE 5 : Analyser tendance temporelle**

1. Voir Line Chart "Tendance 12 Mois"
2. Observer :
   - Janvier 2025 : 25 pertes (70% taux)
   - Février 2025 : 28 pertes (72% taux) ⬆️ dégradation
   - Mars 2025 : 22 pertes (65% taux)
   - Avril-Mai : Implémentation offre Starter low-cost
   - Juin 2025 : 18 pertes (55% taux) ⬇️ amélioration
   - Juillet-Novembre : Stabilisation 15-18 pertes (52-58% taux)
3. Insight visible : "Amélioration -20% taux perte depuis lancement offre Starter"

**ÉTAPE 6 : Lire insights automatiques**

1. **Section Insights affiche 4 alertes :**

**Insight 1 (Priority: HIGH) :**

- 💰 "35% des pertes dues au prix trop élevé"
- Détail : "15 opportunités perdues pour prix (360k€). Concentrées sur PME <50 véhicules."
- Recommendation : "L'offre Starter existe mais pas assez connue. Intensifier communication pricing PME."
- Bouton "Créer tâche Marketing"

**Insight 2 (Priority: HIGH) :**

- 🚀 "28% des pertes dues à features manquantes"
- TOP 3 features demandées :
  1. Mobile app chauffeurs (demandée 8 fois)
  2. Intégration Talabat/Deliveroo (demandée 6 fois)
  3. Reporting avancé temps réel (demandée 5 fois)
- Recommendation : "Prioriser développement Mobile app. Impact estimé: +12 deals/trimestre = +180k€"
- Bouton "Créer ticket Product"

**Insight 3 (Priority: MEDIUM) :**

- 🏆 "Concurrent Y gagne 60% des deals face-à-face"
- "8 opportunités perdues face à Concurrent Y. Points forts identifiés : Support 24/7, Prix -15%"
- Recommendation : "Analyse concurrentielle approfondie + lancement support 24/7"

**Insight 4 (Priority: INFO) :**

- ✅ "55% des opportunités perdues sont récupérables"
- "23 opportunités avec follow-up programmé. 15 dans les 60 prochains jours."
- Recommendation : "Préparer campagne de réengagement pour opportunités récupérables"

**ÉTAPE 7 : Analyser top concurrents**

1. **Section Top Concurrents affiche table :**

| Concurrent   | Deals Gagnés | Valeur Perdue | % des Pertes Competition |
| ------------ | ------------ | ------------- | ------------------------ |
| Concurrent Y | 5            | 140,000€      | 62.5%                    |
| Concurrent Z | 2            | 48,000€       | 25%                      |
| Concurrent W | 1            | 12,000€       | 12.5%                    |

2. Cliquer sur ligne "Concurrent Y"
3. Drill-down : Liste des 5 opportunités perdues face à Concurrent Y
4. Voir patterns communs :
   - Toutes au stage Negotiation (perdues tard dans le cycle)
   - Prix Concurrent Y 10-20% moins cher
   - Support 24/7 argument clé mentionné 4 fois sur 5

**ÉTAPE 8 : Exporter données**

1. Cliquer bouton "Export CSV" (header dashboard)
2. Modal "Export Options" :
   - Scope : Période sélectionnée (90 derniers jours)
   - Format : CSV
   - Contenu : Toutes données + insights
3. Cliquer "Exporter"
4. Fichier téléchargé : `loss_analysis_2025_11_10.csv`
5. Contenu :
   - Ligne par opportunité perdue
   - Colonnes : company, expected_value, lost_date, loss_reason, category, notes, competitor, stage

**ÉTAPE 9 : Créer action depuis insight**

1. Sur Insight 2 "Features manquantes", cliquer "Créer ticket Product"
2. Modal création tâche pré-remplie :
   - Titre : "Développer Mobile App Chauffeurs"
   - Description : "Demandée dans 8 opportunités perdues. Impact estimé: +180k€ ARR"
   - Assignée à : Product Manager
   - Priorité : High
   - Due date : +30 jours
   - Tags : feature-request, high-impact
3. Cliquer "Créer"
4. Toast : "Tâche créée et assignée au Product Manager"
5. Email automatique envoyé au Product Manager

**VALIDATION SPONSOR :**

✅ **Démo montre clairement :**

- Processus de marquage perte simple et rapide
- Motifs structurés et récupérabilité automatique
- Dashboard analytics complet et actionnable
- Insights générés automatiquement
- Actions créables en 1 clic
- Données exportables pour présentations
- ROI visible : "Implémentation offre Starter → -20% taux perte = +420k€ ARR"

---

## ⏱️ ESTIMATION

**Backend (Service Layer) :**

- OpportunityService.markAsLost() : 6 heures
- OpportunityService.getLossAnalysis() : 8 heures
- LossReasonService complet : 3 heures
- **Total Backend : 17 heures**

**API REST (Endpoints) :**

- POST /opportunities/[id]/lose : 2 heures
- GET /loss-reasons : 1 heure
- GET /analytics/loss-analysis : 3 heures
- **Total API : 6 heures**

**Frontend (Interface) :**

- LoseOpportunityModal : 4 heures
- LossAnalysisDashboard : 12 heures (complexe, beaucoup de graphiques)
- Page loss-analysis : 2 heures
- **Total Frontend : 18 heures**

**Tests :**

- Tests unitaires services : 3 heures
- Tests E2E lose workflow : 2 heures
- **Total Tests : 5 heures**

**TOTAL ÉTAPE 2.3 : 46 heures (arrondi à 3 jours)**

---

## 🔗 DÉPENDANCES

**Prérequis obligatoires :**

- Sprint 2 Étapes 2.1 et 2.2 terminées
- Table crm_opportunity_loss_reasons créée et seedée avec motifs standard
- OpportunityService existant avec méthodes de base
- NotificationService pour envoi emails

**Services requis :**

- OpportunityService (déjà existant)
- PipelineService.recalculateStats() (pour recalcul forecast)
- TaskService.createTask() (pour création tâches follow-up)
- NotificationService.send() (pour notifications)

**Composants frontend requis :**

- OpportunityCard (déjà existant)
- Recharts library pour graphiques
- DatePicker composant
- Dropdown multi-niveaux (pour loss reasons groupés)

**Données nécessaires :**

- Minimum 30 opportunités perdues avec motifs variés (données de test)
- Motifs de perte seedés (16 motifs standard)
- Plusieurs commerciaux pour tester assignations

---

## ✅ CHECKLIST DE VALIDATION

### Backend

- [ ] OpportunityService.markAsLost() marque opportunité comme perdue
- [ ] Status passe à "lost", stage à "closed" automatiquement
- [ ] Forecast_value mis à 0
- [ ] Lead d'origine status mis à jour (lost_opportunity ou nurturing)
- [ ] Tâche de follow-up créée si loss_reason.is_recoverable = true
- [ ] Notifications envoyées (owner + manager + director si >50k€)
- [ ] Audit log créé avec old_values et new_values
- [ ] Stats pipeline recalculées après perte
- [ ] OpportunityService.getLossAnalysis() retourne données complètes
- [ ] Calcul TOP 10 motifs correct
- [ ] Distribution par catégorie correcte
- [ ] Tendance temporelle sur 12 mois correcte
- [ ] Insights générés automatiquement
- [ ] LossReasonService.getAllReasons() retourne motifs actifs groupés

### API REST

- [ ] POST /opportunities/[id]/lose fonctionne
- [ ] Validation body (loss_reason_id obligatoire)
- [ ] Erreur 422 si opportunity déjà close
- [ ] Erreur 403 si pas permissions
- [ ] Réponse 200 retourne opportunity avec loss_reason inclus
- [ ] GET /loss-reasons retourne motifs groupés par catégorie
- [ ] GET /analytics/loss-analysis retourne dashboard complet
- [ ] Filtres date_from/date_to fonctionnent
- [ ] Cache 1h appliqué sur analytics (performance)

### Frontend

- [ ] LoseOpportunityModal s'ouvre depuis page détail opportunity
- [ ] Dropdown loss_reasons groupé par catégorie
- [ ] Champ competitor_name affiché conditionnellement (si category = competition)
- [ ] Alerte récupérable affichée si is_recoverable = true
- [ ] Validation formulaire empêche soumission si loss_reason manquant
- [ ] Toast success après soumission
- [ ] Redirection vers liste opportunities
- [ ] Card opportunity disparaît du pipeline immédiatement (optimistic UI)
- [ ] LossAnalysisDashboard affiche 4 KPI cards
- [ ] Donut Chart distribution par motif correct
- [ ] Bar Chart distribution par catégorie correct
- [ ] Line Chart tendance 12 mois correct
- [ ] Funnel Chart distribution par stage correct
- [ ] Section Insights affiche 3-5 insights avec recommendations
- [ ] Table Top Concurrents affichée si pertes competition
- [ ] Drill-down sur graphiques fonctionne (clic → liste opportunités)
- [ ] Export CSV fonctionne et contient toutes données
- [ ] Bouton "Créer tâche" depuis insight fonctionne

### Tests

- [ ] Test unitaire markAsLost() avec motif récupérable crée tâche
- [ ] Test unitaire markAsLost() avec motif non récupérable ne crée pas tâche
- [ ] Test getLossAnalysis() retourne TOP 10 motifs corrects
- [ ] Test getLossAnalysis() calcule loss_rate correctement
- [ ] Test E2E : marquer opportunity perdue → vérifier dans dashboard analytics
- [ ] Test E2E : opportunité récupérable → vérifier tâche créée
- [ ] Test notifications envoyées (mock email service)

### Démo Sponsor

- [ ] Sponsor peut marquer une opportunity comme perdue
- [ ] Sponsor voit alerte récupérable si applicable
- [ ] Sponsor peut accéder au dashboard loss analysis
- [ ] Sponsor voit KPI cards avec métriques réelles
- [ ] Sponsor voit graphiques distribution et tendance
- [ ] Sponsor voit insights avec recommendations actionnables
- [ ] Sponsor peut créer tâche depuis insight en 1 clic
- [ ] Sponsor peut exporter données en CSV

---

# ÉTAPE 2.4 : ANALYTICS DASHBOARD + FORECAST

**Durée:** 3 jours (24 heures)  
**Objectif:** Fournir visibilité complète sur le pipeline commercial avec prévisions de revenus pour pilotage stratégique.

---

## 🎯 RATIONNEL MÉTIER

### POURQUOI cette fonctionnalité est critique

**PROBLÈME BUSINESS :** Un directeur commercial doit pouvoir répondre à ces questions en moins de 30 secondes :

- "Combien de CA allons-nous faire ce trimestre ?"
- "Quel est notre taux de conversion actuel ?"
- "Où sont les goulots d'étranglement dans notre pipeline ?"
- "Quels commerciaux performent le mieux ?"
- "Quels segments de clients convertissent le mieux ?"

Sans dashboard analytics, il faut 2-3 jours d'extraction Excel manuelle pour répondre. Résultat : décisions prises trop tard ou sur intuition, pas sur données.

**IMPACT SI ABSENT :**

- **Prévisions revenus inexistantes** : CFO et investisseurs dans le noir sur futur CA
- **Goulots d'étranglement non identifiés** : 60% des opportunités bloquées au stage Proposal pendant 45 jours mais personne ne le voit
- **Sous-performance commerciale non détectée** : Commercial A convertit 15%, Commercial B 45%, mais sans analytics personne ne compare
- **Allocation ressources inefficace** : On continue d'investir marketing sur segments qui ne convertissent jamais
- **Crédibilité investisseurs** : Impossible de démontrer traction et croissance prévisible

**CAS D'USAGE CONCRET :**

**Situation Board Meeting Janvier 2025 (sans analytics) :**

- CFO demande : "Quel CA prévisionnel Q1 ?"
- Directeur Commercial répond : "Euh... je pense environ 400k€, peut-être plus"
- Investisseur demande : "Sur quelle base ? Combien d'opportunités ? Quel taux conversion ?"
- Directeur : "Je dois vérifier, je reviens vers vous"
- **Résultat :** Perte de crédibilité, investisseurs inquiets

**Situation Board Meeting Février 2025 (avec analytics) :**

- CFO demande : "Quel CA prévisionnel Q1 ?"
- Directeur affiche dashboard sur écran :
  - "Pipeline actif : 45 opportunités, valeur totale 780k€"
  - "Forecast pondéré (probabilités) : 468k€"
  - "Taux conversion historique : 32%"
  - "CA prévisionnel Q1 conservateur : 450k€"
  - "CA optimiste : 550k€ si amélioration conversion de 5 points"
- Investisseur : "Excellent, et comment allez-vous améliorer conversion ?"
- Directeur : "Graphique conversion funnel montre 40% des pertes au stage Proposal"
- "Actions lancées : formation commerciaux sur négociation, création offres flexibles"
- "Impact attendu : +8% taux conversion = +60k€ CA additionnel"
- **Résultat :** Investisseurs confiants, décisions data-driven, tour de table bouclé

### VALEUR AJOUTÉE POUR FLEETCORE

**Pour le Management (C-Level) :**

- Visibilité temps réel sur santé commerciale
- Prévisions revenus fiables pour CFO et investisseurs
- Identification rapide problèmes (ex: pipeline qui se vide = problème marketing)
- Décisions stratégiques basées sur données (où investir ? Quels marchés prioriser ?)

**Pour les Directeurs Commerciaux :**

- Pilotage opérationnel quotidien
- Identification goulots (ex: pourquoi 50 opps bloquées au stage Negotiation ?)
- Comparaison performance entre commerciaux (objectif, pas punition)
- Priorisation efforts (se concentrer sur opps haute valeur / haute probabilité)

**Pour les Commerciaux :**

- Visibilité sur leurs propres performances vs objectifs
- Identification opportunités à prioriser (valeur × probabilité)
- Apprentissage : "Commercial B convertit 2x mieux que moi, qu'est-ce qu'il fait différemment ?"

**Pour le Marketing :**

- ROI par canal (Google Ads génère X opportunités à Y€ → ROI Z%)
- Identification segments performants (PME France convertissent 45%, Grandes Entreprises UAE 28%)
- Ajustement budget marketing en temps réel

**Pour les Investisseurs :**

- Proof of traction (croissance pipeline, amélioration conversion)
- Prédictibilité revenus (forecast fiable)
- Confiance dans scalabilité business model

---

## 📊 DONNÉES ET RÈGLES MÉTIER

### Métriques Clés à Calculer

**MÉTRIQUE 1 : Forecast Value Pondéré**

**Définition :** Somme des valeurs d'opportunités pondérées par leur probabilité de closing.

**Formule :**

```
Forecast Total = Σ (expected_value × probability_percent) pour toutes opportunités WHERE status = 'open'

Exemple :
- Opp A : 20k€ × 30% = 6k€
- Opp B : 50k€ × 70% = 35k€
- Opp C : 10k€ × 90% = 9k€
→ Forecast Total = 50k€
```

**Utilité :** C'est le CA prévisionnel le plus réaliste. Le CFO peut budgéter sur cette base.

**Règle de calcul par stage :**

```
POUR chaque stage (prospecting, qualification, proposal, negotiation, closing) :
  Forecast_stage = Σ (expected_value × probability_percent) pour opportunités à ce stage

Distribution forecast par stage :
- Prospecting (10% prob) : 156k€ × 0.10 = 15.6k€ forecast
- Qualification (30% prob) : 225k€ × 0.30 = 67.5k€ forecast
- Proposal (50% prob) : 180k€ × 0.50 = 90k€ forecast
- Negotiation (70% prob) : 120k€ × 0.70 = 84k€ forecast
- Closing (90% prob) : 99k€ × 0.90 = 89.1k€ forecast

→ Total Forecast = 346.2k€
```

**MÉTRIQUE 2 : Taux de Conversion Global**

**Définition :** Pourcentage d'opportunités gagnées parmi toutes les opportunités closes.

**Formule :**

```
Taux Conversion = (Opportunités Won / (Opportunités Won + Opportunités Lost)) × 100

Exemple période T1 2025 :
- Won : 30
- Lost : 70
- Total Close : 100
→ Taux Conversion = 30/100 = 30%
```

**Benchmark industrie SaaS B2B :** 25-35% selon segment (SMB 20%, Mid-Market 30%, Enterprise 40%)

**MÉTRIQUE 3 : Taux de Conversion par Stage (Conversion Funnel)**

**Définition :** Pourcentage d'opportunités qui passent d'un stage au suivant.

**Calcul :**

```
Pour calculer taux de passage Stage N → Stage N+1 :
  - Compter opportunités qui ont atteint Stage N+1 parmi celles qui étaient à Stage N

Exemple Funnel T1 2025 :
- 100 opps créées (Prospecting)
- 80 sont passées en Qualification → 80% conversion Prospecting→Qualification
- 60 sont passées en Proposal → 75% conversion Qualification→Proposal
- 40 sont passées en Negotiation → 67% conversion Proposal→Negotiation
- 30 ont été Won → 75% conversion Negotiation→Won

Visualisation Funnel :
100 (Prospecting)
 └─> 80 (Qualification) -20% lost
      └─> 60 (Proposal) -25% lost
           └─> 40 (Negotiation) -33% lost
                └─> 30 (Won) -25% lost

Taux Conversion Final = 30/100 = 30%
```

**Utilité :** Identifier où le processus casse. Si 67% conversion Proposal→Negotiation, problème = pricing ou proposition de valeur.

**MÉTRIQUE 4 : Durée Moyenne Cycle de Vente**

**Définition :** Temps moyen entre création opportunity et closing (won ou lost).

**Formule :**

```
Durée Moyenne = Moyenne (close_date - created_at) pour opportunités closes

Exemple :
- Opp A : créée 1er jan, close 15 fév → 45 jours
- Opp B : créée 5 jan, close 20 fév → 46 jours
- Opp C : créée 10 jan, close 1er mars → 50 jours
→ Durée Moyenne = (45+46+50)/3 = 47 jours

Durée par outcome :
- Won : 42 jours en moyenne
- Lost : 53 jours en moyenne
→ Insight : On perd du temps sur opportunités qui n'aboutiront pas (qualifier plus tôt)
```

**Benchmark industrie SaaS B2B :**

- SMB : 30-45 jours
- Mid-Market : 60-90 jours
- Enterprise : 120-180 jours

**MÉTRIQUE 5 : Deal Size Moyen**

**Définition :** Valeur moyenne des opportunités gagnées.

**Formule :**

```
Deal Size Moyen = Moyenne (won_value) pour opportunités won

Exemple T1 2025 :
- 30 opportunités won
- Total valeur : 520k€
→ Deal Size Moyen = 520k / 30 = 17,333€

Segmentation par taille flotte :
- <10 véhicules : 5k€ moyen
- 10-50 véhicules : 12k€ moyen
- 50-100 véhicules : 25k€ moyen
- 100+ véhicules : 50k€ moyen
```

**MÉTRIQUE 6 : Vélocité du Pipeline**

**Définition :** Taux auquel les opportunités progressent dans le pipeline (revenus générés / temps).

**Formule :**

```
Vélocité = (Nombre Opportunités × Deal Size Moyen × Taux Conversion) / Durée Moyenne Cycle

Exemple :
- 100 nouvelles opps/mois
- Deal Size Moyen : 17k€
- Taux Conversion : 30%
- Durée Cycle : 47 jours
→ Vélocité = (100 × 17k × 0.30) / 47 = 10,851€/jour = 325k€/mois CA généré

Objectif : Augmenter vélocité via :
1. Plus d'opportunités (marketing)
2. Deal size plus gros (upselling)
3. Meilleur taux conversion (formation commerciaux)
4. Cycle plus court (processus optimisé)
```

**MÉTRIQUE 7 : Distribution Valeur Pipeline par Segment**

**Segmentations clés :**

- Par pays (UAE, France, KSA)
- Par taille flotte (<10, 10-50, 50-100, 100+)
- Par industrie (Logistics, Taxi, VTC, Delivery)
- Par source lead (Google Ads, Organic, Partner, Referral)
- Par commercial

**Exemple analyse par pays T1 2025 :**

```
UAE :
- 25 opportunités
- Valeur totale : 450k€
- Forecast pondéré : 270k€
- Taux conversion : 35%

France :
- 15 opportunités
- Valeur totale : 240k€
- Forecast pondéré : 120k€
- Taux conversion : 28%

KSA :
- 5 opportunités
- Valeur totale : 90k€
- Forecast pondéré : 45k€
- Taux conversion : 22%

→ Insight : UAE est le marché le plus mature (35% conversion). Doubler investissement marketing UAE.
```

### Règles de Calcul Temps Réel

**RÈGLE 1 : Mise à jour automatique du forecast**

```
TRIGGER sur crm_opportunities (après UPDATE de probability_percent OU expected_value) :
  - Recalculer forecast_value = expected_value × probability_percent
  - Recalculer forecast_total du pipeline = SUM(forecast_value) WHERE status = 'open'
  - Mettre à jour cache dashboard (invalidation)
```

**RÈGLE 2 : Calcul taux conversion historique**

```
FONCTION calculateConversionRate(date_from, date_to, filters) :
  won_count = COUNT(*) WHERE status = 'won' AND close_date BETWEEN date_from AND date_to AND filters
  lost_count = COUNT(*) WHERE status = 'lost' AND close_date BETWEEN date_from AND date_to AND filters
  total_closed = won_count + lost_count

  SI total_closed > 0 ALORS
    conversion_rate = (won_count / total_closed) × 100
  SINON
    conversion_rate = 0

  RETOURNER { won_count, lost_count, total_closed, conversion_rate }
FIN FONCTION
```

**RÈGLE 3 : Calcul durée cycle de vente**

```
FONCTION calculateSalesCycleDuration(filters) :
  opportunities = SELECT * WHERE status IN ('won', 'lost') AND filters

  durations = []
  POUR chaque opp DANS opportunities :
    duration = DATEDIFF(DAY, opp.created_at, opp.close_date)
    durations.push(duration)
  FIN POUR

  SI durations.length > 0 ALORS
    average_duration = MOYENNE(durations)
    median_duration = MEDIANE(durations)
    p90_duration = PERCENTILE_90(durations)
  SINON
    average_duration = 0

  RETOURNER { average_duration, median_duration, p90_duration }
FIN FONCTION
```

---

## 🏗️ COMPOSANTS À DÉVELOPPER

### Backend (Service Layer)

**Fichier à créer : `lib/services/crm/analytics.service.ts`**

Service dédié aux calculs analytics et forecast.

**Méthode getForecast(filters: ForecastFilters) → Promise<ForecastData>**

**Algorithme détaillé :**

```
FONCTION getForecast(filters) :

  ÉTAPE 1 : RÉCUPÉRATION OPPORTUNITÉS ACTIVES
  ├─ Query base : SELECT * FROM crm_opportunities WHERE status = 'open' AND deleted_at IS NULL
  ├─ Appliquer filters :
  │  ├─ SI filters.pipeline_id fourni ALORS filter par pipeline_id
  │  ├─ SI filters.assigned_to fourni ALORS filter par assigned_to
  │  ├─ SI filters.expected_close_date_from fourni ALORS filter par expected_close_date >= date_from
  │  └─ SI filters.expected_close_date_to fourni ALORS filter par expected_close_date <= date_to
  └─ Joindre avec adm_members (owner), crm_pipelines, crm_leads (origine)

  ÉTAPE 2 : CALCUL FORECAST TOTAL
  ├─ total_opportunities = COUNT(opportunities)
  ├─ total_value = SUM(expected_value)
  ├─ total_forecast = SUM(expected_value × probability_percent)
  └─ weighted_average_probability = total_forecast / total_value

  ÉTAPE 3 : FORECAST PAR STAGE
  ├─ Grouper opportunities par stage
  ├─ POUR chaque stage :
  │  ├─ stage_count = COUNT(opportunities à ce stage)
  │  ├─ stage_value = SUM(expected_value)
  │  ├─ stage_forecast = SUM(expected_value × probability_percent)
  │  └─ stage_average_probability = MOYENNE(probability_percent)
  └─ Retourner array de stages avec metrics

  ÉTAPE 4 : FORECAST PAR PÉRIODE
  ├─ Grouper opportunities par expected_close_date (mois)
  ├─ POUR chaque mois des 6 prochains mois :
  │  ├─ month_count = COUNT(opportunities avec expected_close_date ce mois)
  │  ├─ month_value = SUM(expected_value)
  │  ├─ month_forecast = SUM(forecast_value)
  │  └─ cumulative_forecast += month_forecast
  └─ Retourner array de 6 mois avec forecast mensuel et cumulé

  ÉTAPE 5 : FORECAST PAR SEGMENT
  ├─ Grouper par pays (country_code)
  ├─ Grouper par taille flotte (lead.fleet_size)
  ├─ Grouper par commercial (assigned_to)
  ├─ POUR chaque segment :
  │  └─ Calculer count, value, forecast
  └─ Trier par forecast DESC, prendre TOP 10

  ÉTAPE 6 : FORECAST CONSERVATEUR VS OPTIMISTE
  ├─ forecast_conservateur = SUM(expected_value × (probability_percent × 0.8))
  │  └─ Raison : Appliquer coefficient pessimiste 0.8
  ├─ forecast_réaliste = total_forecast (calculé étape 2)
  ├─ forecast_optimiste = SUM(expected_value × MIN(probability_percent × 1.2, 100))
  │  └─ Raison : Appliquer coefficient optimiste 1.2, cap à 100%
  └─ Retourner 3 scénarios

  ÉTAPE 7 : COMPARAISON PÉRIODE PRÉCÉDENTE
  ├─ Calculer mêmes metrics pour période précédente (ex: mois dernier)
  ├─ POUR chaque métrique :
  │  └─ Calculer variation = ((current - previous) / previous) × 100
  └─ Retourner deltas (amélioration ou dégradation)

  ÉTAPE 8 : CONFIANCE DU FORECAST
  ├─ confidence_score = Calculer sur base :
  │  ├─ Nombre opportunités (plus il y a d'opps, plus c'est fiable)
  │  ├─ Distribution stages (pipeline équilibré = plus fiable)
  │  ├─ Historique précision forecast (comparer forecast vs réel mois dernier)
  │  └─ Qualité données (% opportunités avec expected_close_date renseignée)
  ├─ confidence_level = SI confidence_score > 80 ALORS "high" SINON SI > 50 ALORS "medium" SINON "low"
  └─ Retourner confidence avec explication

  ÉTAPE 9 : CONSTRUCTION RÉPONSE
  └─ Retourner objet ForecastData :
     ├─ summary : { total_opportunities, total_value, total_forecast, weighted_avg_probability }
     ├─ by_stage : array de stages avec metrics
     ├─ by_period : array de 6 mois avec forecast mensuel
     ├─ by_segment : { by_country, by_fleet_size, by_owner }
     ├─ scenarios : { conservateur, réaliste, optimiste }
     ├─ comparison : { previous_period, delta_percent, trend }
     └─ confidence : { score, level, explanation }

FIN FONCTION
```

**Méthode getConversionFunnel(filters: FunnelFilters) → Promise<ConversionFunnelData>**

**Algorithme détaillé :**

```
FONCTION getConversionFunnel(filters) :

  ÉTAPE 1 : RÉCUPÉRATION OPPORTUNITÉS CLOSES
  ├─ Query : SELECT * FROM crm_opportunities
  │          WHERE status IN ('won', 'lost')
  │          AND close_date BETWEEN filters.date_from AND filters.date_to
  ├─ Joindre avec metadata pour récupérer stage_history (historique progression)
  └─ Stocker dans opportunities_closed[]

  ÉTAPE 2 : RECONSTRUCTION PARCOURS CHAQUE OPPORTUNITÉ
  ├─ POUR chaque opportunity :
  │  ├─ Extraire stage_history depuis metadata
  │  │  └─ Format : [{ stage: "prospecting", entered_at: "..." }, { stage: "qualification", entered_at: "..." }, ...]
  │  ├─ SI stage_history vide (anciennes opps sans historique) :
  │  │  └─ Utiliser stage_final seulement
  │  └─ Stocker parcours complet
  └─ Construire matrice transitions : [prospecting→qualification, qualification→proposal, etc.]

  ÉTAPE 3 : CALCUL ENTRÉES PAR STAGE
  ├─ POUR chaque stage dans [prospecting, qualification, proposal, negotiation, closing] :
  │  ├─ entered_count = COUNT(opportunities qui ont atteint ce stage)
  │  └─ entered_value = SUM(expected_value des opportunities qui ont atteint ce stage)
  └─ Retourner array avec count et value par stage

  ÉTAPE 4 : CALCUL SORTIES PAR STAGE
  ├─ POUR chaque stage :
  │  ├─ exited_to_next = COUNT(opportunities passées au stage suivant)
  │  ├─ exited_to_won = COUNT(opportunities won depuis ce stage)
  │  ├─ exited_to_lost = COUNT(opportunities lost depuis ce stage)
  │  └─ conversion_rate = (exited_to_next + exited_to_won) / entered_count × 100
  └─ Retourner taux de conversion par stage

  ÉTAPE 5 : IDENTIFICATION GOULOTS D'ÉTRANGLEMENT
  ├─ POUR chaque stage :
  │  ├─ SI conversion_rate < 50% ALORS
  │  │  └─ Marquer comme bottleneck (goulot)
  │  ├─ average_time_in_stage = MOYENNE(durée dans ce stage) pour toutes opps
  │  └─ SI average_time > 30 jours ALORS
  │     └─ Marquer comme "slow stage"
  └─ Retourner liste bottlenecks avec recommandations

  ÉTAPE 6 : FUNNEL VISUEL (données pour graphique)
  ├─ Construire entonnoir avec largeurs proportionnelles :
  │  ├─ Level 1 (Prospecting) : 100% largeur (base)
  │  ├─ Level 2 (Qualification) : (entered_count_qualification / entered_count_prospecting) × 100%
  │  ├─ Level 3 (Proposal) : (entered_count_proposal / entered_count_prospecting) × 100%
  │  ├─ Level 4 (Negotiation) : (entered_count_negotiation / entered_count_prospecting) × 100%
  │  └─ Level 5 (Won) : (won_count / entered_count_prospecting) × 100%
  └─ Retourner array de levels avec pourcentages

  ÉTAPE 7 : ANALYSE COHORT (Facultatif - avancé)
  ├─ Grouper opportunities par mois de création (cohort)
  ├─ POUR chaque cohort :
  │  └─ Calculer conversion_rate de ce cohort
  ├─ Comparer cohorts entre eux :
  │  └─ Identifier si conversion s'améliore ou dégrade dans le temps
  └─ Retourner évolution conversion par cohort

  ÉTAPE 8 : INSIGHTS AUTOMATIQUES
  ├─ Identifier stage avec plus grande perte (highest drop-off)
  │  └─ Insight : "60% des opportunités sont perdues au stage Proposal"
  ├─ Identifier stage le plus lent
  │  └─ Insight : "Opportunités passent en moyenne 45 jours en Negotiation"
  ├─ Calculer taux de conversion vs benchmark industrie
  │  └─ Insight : "Votre taux de conversion (30%) est dans la moyenne SaaS B2B (25-35%)"
  └─ Retourner array d'insights

  ÉTAPE 9 : CONSTRUCTION RÉPONSE
  └─ Retourner objet ConversionFunnelData :
     ├─ stages : array avec entered_count, exited_count, conversion_rate par stage
     ├─ funnel_visual : array de levels avec pourcentages pour graphique
     ├─ bottlenecks : array de stages problématiques avec recommandations
     ├─ average_time_per_stage : durée moyenne par stage
     ├─ cohort_analysis : évolution conversion par mois (optionnel)
     └─ insights : array d'insights actionnables

FIN FONCTION
```

**Méthode getPerformanceMetrics(filters) → Promise<PerformanceData>**

**Algorithme détaillé :**

```
FONCTION getPerformanceMetrics(filters) :

  ÉTAPE 1 : CALCUL TAUX DE CONVERSION
  ├─ won_count = COUNT(*) WHERE status = 'won' AND filters
  ├─ lost_count = COUNT(*) WHERE status = 'lost' AND filters
  ├─ total_closed = won_count + lost_count
  ├─ conversion_rate = (won_count / total_closed) × 100
  └─ Comparer vs période précédente (delta)

  ÉTAPE 2 : CALCUL DURÉE CYCLE VENTE
  ├─ Récupérer toutes opportunités closes
  ├─ POUR chaque opp :
  │  └─ duration = DATEDIFF(DAY, created_at, close_date)
  ├─ average_duration = MOYENNE(durations)
  ├─ median_duration = MEDIANE(durations)
  ├─ Segmenter par outcome (won vs lost) :
  │  ├─ average_duration_won
  │  └─ average_duration_lost
  └─ Comparer vs période précédente

  ÉTAPE 3 : CALCUL DEAL SIZE MOYEN
  ├─ average_deal_size = MOYENNE(won_value) WHERE status = 'won'
  ├─ median_deal_size = MEDIANE(won_value)
  ├─ Segmenter par taille flotte :
  │  ├─ <10 véhicules : average
  │  ├─ 10-50 véhicules : average
  │  ├─ 50-100 véhicules : average
  │  └─ 100+ véhicules : average
  └─ Comparer vs période précédente

  ÉTAPE 4 : CALCUL VÉLOCITÉ PIPELINE
  ├─ opportunities_per_month = total_opportunities / période_en_mois
  ├─ velocity = (opportunities_per_month × average_deal_size × conversion_rate) / average_duration
  │  └─ En €/jour
  └─ Tendance vélocité : amélioration ou dégradation

  ÉTAPE 5 : PERFORMANCE PAR COMMERCIAL
  ├─ Grouper opportunities par assigned_to
  ├─ POUR chaque commercial :
  │  ├─ opportunities_count
  │  ├─ won_count
  │  ├─ conversion_rate = (won_count / (won_count + lost_count)) × 100
  │  ├─ total_won_value
  │  ├─ average_deal_size = total_won_value / won_count
  │  ├─ average_cycle_duration
  │  └─ Calculer ranking (position par rapport aux autres)
  ├─ Trier par total_won_value DESC
  └─ Retourner TOP 10 commerciaux

  ÉTAPE 6 : PERFORMANCE PAR SEGMENT
  ├─ Grouper par pays :
  │  └─ POUR chaque pays : conversion_rate, average_deal_size, total_value
  ├─ Grouper par taille flotte :
  │  └─ POUR chaque segment : conversion_rate, average_deal_size
  ├─ Grouper par source lead :
  │  └─ POUR chaque source : conversion_rate, CAC (coût acquisition client)
  └─ Identifier segments les plus performants

  ÉTAPE 7 : WIN/LOSS RATIO
  ├─ win_loss_ratio = won_count / lost_count
  ├─ SI win_loss_ratio > 1 ALORS plus de wins que losses (bon signe)
  ├─ Segmenter par motif de perte :
  │  └─ Identifier motifs les plus fréquents
  └─ Tendance win/loss ratio dans le temps

  ÉTAPE 8 : CONSTRUCTION RÉPONSE
  └─ Retourner objet PerformanceData :
     ├─ conversion : { rate, won_count, lost_count, delta_vs_previous }
     ├─ sales_cycle : { average, median, by_outcome, delta_vs_previous }
     ├─ deal_size : { average, median, by_segment, delta_vs_previous }
     ├─ velocity : { value, unit: "€/day", trend }
     ├─ by_rep : array TOP 10 commerciaux avec metrics
     ├─ by_segment : { by_country, by_fleet_size, by_source }
     └─ win_loss : { ratio, trend, top_loss_reasons }

FIN FONCTION
```

### API REST (Endpoints)

**Fichier à créer : `app/api/v1/crm/analytics/forecast/route.ts`**

**GET /api/v1/crm/analytics/forecast**

**Description :** Données de forecast complet avec scénarios conservateur/réaliste/optimiste.

**Permissions :** opportunities.read + analytics.view (managers uniquement)

**Query params :**

- pipeline_id : Filtrer par pipeline spécifique
- assigned_to : Filtrer par commercial
- expected_close_date_from : Date min closing
- expected_close_date_to : Date max closing
- segment : Grouper par segment (country, fleet_size, owner)

**Réponse 200 :**
Objet ForecastData complet avec :

- summary : métriques globales
- by_stage : forecast par stage
- by_period : forecast sur 6 mois
- by_segment : TOP 10 segments
- scenarios : conservateur/réaliste/optimiste
- comparison : vs période précédente
- confidence : niveau de confiance du forecast

**Cache :** 30 minutes (calculs lourds)

**Fichier à créer : `app/api/v1/crm/analytics/conversion-funnel/route.ts`**

**GET /api/v1/crm/analytics/conversion-funnel**

**Description :** Funnel de conversion avec identification bottlenecks.

**Permissions :** opportunities.read + analytics.view

**Query params :**

- date_from : Date début analyse (défaut: -90 jours)
- date_to : Date fin analyse (défaut: aujourd'hui)
- pipeline_id : Filtrer par pipeline
- segment : Segmenter par country, fleet_size, source

**Réponse 200 :**
Objet ConversionFunnelData avec :

- stages : count et conversion_rate par stage
- funnel_visual : données pour graphique entonnoir
- bottlenecks : stages problématiques
- average_time_per_stage : durée moyenne
- insights : recommandations actionnables

**Cache :** 1 heure

**Fichier à créer : `app/api/v1/crm/analytics/performance/route.ts`**

**GET /api/v1/crm/analytics/performance**

**Description :** Métriques de performance commerciale complètes.

**Permissions :** opportunities.read + analytics.view

**Query params :**

- date_from, date_to : Période analyse
- pipeline_id : Filtrer pipeline
- compare_to_previous : Booléen (activer comparaison période précédente)

**Réponse 200 :**
Objet PerformanceData avec :

- conversion : taux et évolution
- sales_cycle : durées et évolution
- deal_size : moyennes et évolution
- velocity : vélocité pipeline
- by_rep : performance par commercial
- by_segment : performance par segment
- win_loss : ratio et tendance

**Cache :** 30 minutes

### Frontend (Interface Utilisateur)

**Composant à créer : `components/crm/AnalyticsDashboard.tsx`**

**Dashboard analytics complet avec tous les graphiques et métriques.**

**Structure complète :**

**HEADER :**

- Titre : "Sales Analytics Dashboard"
- Filtres globaux :
  - Date range picker (défaut: 90 jours)
  - Dropdown pipeline
  - Dropdown commercial
  - Toggle "Compare to previous period"
- Boutons actions :
  - "Export Report" (PDF)
  - "Schedule Email" (envoi automatique hebdo)
  - "Refresh" (actualise données)

**SECTION 1 : KPI OVERVIEW (6 cartes en grille 3×2)**

**Carte 1 : Total Pipeline Value**

- Valeur totale pipeline (sum expected_value)
- Comparaison vs période précédente (+/- X%)
- Icône 💼
- Sparkline (mini graphique tendance)

**Carte 2 : Forecast (Pondéré)**

- Forecast total (sum forecast_value)
- 3 scénarios en tooltip (conservateur/réaliste/optimiste)
- Badge confidence level (High/Medium/Low)
- Icône 📈

**Carte 3 : Conversion Rate**

- Pourcentage global
- Comparaison vs période précédente
- Badge couleur (vert >35%, orange 25-35%, rouge <25%)
- Icône 🎯

**Carte 4 : Average Deal Size**

- Montant moyen opportunités won
- Comparaison vs période précédente
- Format monétaire avec currency
- Icône 💰

**Carte 5 : Sales Cycle Duration**

- Durée moyenne en jours
- Comparaison vs période précédente
- Icône ⏱️
- Sous-texte : Médiane + P90

**Carte 6 : Pipeline Velocity**

- Revenus générés par jour
- Format : "10,500€/day"
- Tendance (amélioration ou dégradation)
- Icône 🚀

**SECTION 2 : FORECAST ANALYSIS**

**Graphique 1 : Forecast Timeline (6 prochains mois)**

- Type : Stacked Area Chart
- Axe X : Mois (Nov 2025 → Apr 2026)
- Axe Y : Valeur forecast cumulée
- 3 courbes :
  - Ligne verte : Forecast conservateur
  - Ligne bleue : Forecast réaliste (principale)
  - Ligne orange : Forecast optimiste
- Marqueurs sur valeurs clés
- Légende interactive (hover pour détails)
- Bibliothèque : Recharts

**Graphique 2 : Forecast by Stage**

- Type : Horizontal Stacked Bar Chart
- 1 barre par stage (5 stages)
- Chaque segment : valeur forecast
- Couleurs par stage (gradient)
- Au clic : drill-down opportunités du stage
- Labels : valeur + pourcentage du total

**SECTION 3 : CONVERSION FUNNEL**

**Graphique 3 : Funnel Visuel**

- Type : Funnel Chart (entonnoir inversé)
- 5 niveaux (Prospecting → Qualification → Proposal → Negotiation → Won)
- Largeur proportionnelle au nombre opportunités
- Labels sur chaque niveau :
  - Count : "45 opportunities"
  - Conversion rate : "75% pass to next stage"
  - Lost : "15 lost at this stage"
- Couleurs : gradient vert (haut) vers bleu foncé (bas)
- Badge "🔴 BOTTLENECK" sur stages avec conversion <50%

**Graphique 4 : Time in Stage**

- Type : Bar Chart horizontal
- 1 barre par stage
- Axe X : Durée moyenne en jours
- Benchmark ligne pointillée (durée idéale)
- Couleur : rouge si >benchmark, vert si <benchmark
- Labels : "42 days avg"

**SECTION 4 : PERFORMANCE BY SEGMENT**

**Graphique 5 : Performance by Country**

- Type : Tree Map ou Bubble Chart
- 1 bulle par pays
- Taille bulle = forecast value
- Couleur = conversion rate (gradient rouge→vert)
- Labels : pays code + conversion %
- Au hover : détails (count, value, forecast)

**Graphique 6 : Performance by Rep**

- Type : Horizontal Bar Chart
- TOP 10 commerciaux
- Axe X : Total won value
- Sous-barres : conversion rate (%)
- Avatar commercial + nom
- Couleur barre selon performance vs objectif
- Au clic : drill-down activités du commercial

**SECTION 5 : TRENDS & INSIGHTS**

**Graphique 7 : Win Rate Trend**

- Type : Line Chart avec points
- Axe X : 12 derniers mois
- Axe Y : Win rate %
- 2 lignes :
  - Win rate actuel
  - Moyenne mobile 3 mois (smooth)
- Benchmark industrie (ligne pointillée grise à 30%)
- Zones colorées : vert si au-dessus benchmark, rouge si en dessous

**Carte Insights** :

- 4-6 insights générés automatiquement
- Chaque insight :
  - Icône selon type (💡 opportunité, ⚠️ alerte, ✅ succès)
  - Titre insight
  - Description courte
  - Recommendation actionnelle
  - Badge priorité
  - Bouton "Take Action" → crée tâche ou navigue vers détails
- Exemples :
  - "🎯 Conversion rate improved by 12% this month"
  - "⚠️ 60% of opportunities stuck in Proposal stage for >30 days"
  - "💡 UAE market has 45% conversion rate. Consider doubling marketing budget."

**SECTION 6 : DETAILED TABLES (onglets)**

**Onglet 1 : Opportunities by Stage**

- Table avec pagination
- Colonnes : Company, Value, Probability, Stage, Owner, Expected Close Date
- Filtrable par colonne
- Triable par colonne
- Export CSV

**Onglet 2 : Recent Wins**

- Liste dernières 20 opportunités won
- Timeline visuelle
- Lien vers détail opportunity
- Highlight deals >50k€

**Onglet 3 : At Risk Opportunities**

- Opportunités avec expected_close_date dépassée
- Opportunités bloquées >30 jours même stage
- Badge "⚠️ AT RISK" rouge
- Actions recommandées (call, email, review pricing)

**Fichier page : `app/[locale]/crm/analytics/dashboard/page.tsx`**

**Page principale analytics.**

**Layout :**

- Full-width layout (pas de sidebar)
- Header fixe avec filtres
- Scroll vertical infini (lazy loading sections)
- Composant <AnalyticsDashboard /> qui contient toutes les sections
- Footer : "Last updated: 2 minutes ago" + bouton Refresh

**Permissions :**

- Accessible aux managers, directors, admins
- Middleware requirePermission("analytics.view")
- Commerciaux voient seulement leurs propres stats (filter automatique assigned_to)

**Performance :**

- Lazy loading des graphiques (render au scroll)
- Cache API 30 min côté serveur
- React Query pour cache côté client
- Skeleton loaders pendant chargement

---

## 🎬 RÉSULTAT DÉMONTRABLE

### Scénario Démo Complet Sponsor

**CONTEXTE DÉMO :**
Board Meeting trimestriel. CFO et investisseurs présents. Directeur Commercial présente les résultats Q4 et forecast Q1 2026.

**ÉTAPE 1 : Accès dashboard analytics**

1. Naviguer vers /crm/analytics/dashboard
2. Dashboard complet s'affiche en <2 secondes
3. Header affiche période : "Last 90 days (Aug 11 - Nov 10, 2025)"
4. Toggle "Compare to previous period" activé (affiche Q3 vs Q4)

**ÉTAPE 2 : Vue d'ensemble KPI (Section 1)**

1. **KPI Cards affichent :**
   - Total Pipeline : 780,000€ (+15% vs Q3) ✅ badge vert
   - Forecast : 468,000€ (confidence: HIGH)
   - Conversion Rate : 32% (+4% vs Q3) ✅
   - Avg Deal Size : 17,333€ (+8% vs Q3) ✅
   - Sales Cycle : 42 days (-5 days vs Q3) ✅
   - Velocity : 11,200€/day (+23% vs Q3) ✅

2. **Directeur Commercial commente :**
   - "Tous nos indicateurs sont au vert ce trimestre"
   - "Amélioration significative de la conversion : +4 points"
   - "Vélocité pipeline +23% grâce à réduction cycle de vente"

**ÉTAPE 3 : Forecast Timeline (Section 2)**

1. Voir graphique "Forecast 6 Prochains Mois"
2. **3 courbes affichées :**
   - Conservateur : 1.8M€ cumulés sur 6 mois
   - Réaliste : 2.4M€ cumulés sur 6 mois
   - Optimiste : 3.0M€ cumulés sur 6 mois

3. **Directeur présente :**
   - "Forecast réaliste Q1 2026 : 450k€ (scénario médian)"
   - "Si conversion s'améliore de 5 points supplémentaires : 550k€ (scénario optimiste)"
   - "Même en scénario conservateur, nous faisons 380k€"

4. **CFO demande :** "Quelle confiance sur ce forecast ?"
   - Hover sur badge "HIGH confidence" affiche tooltip :
     - "Confidence: 87% (HIGH)"
     - "Based on: 45 active opportunities, balanced pipeline, historical accuracy 92%"
   - **Réponse :** "87% de confiance. Nos forecasts historiques ont été précis à 92%."

**ÉTAPE 4 : Analyse Conversion Funnel (Section 3)**

1. Voir Funnel Chart avec 5 niveaux
2. **Données affichées :**
   - Prospecting : 100 opps (base)
   - Qualification : 80 opps (80% pass → ✅ bon)
   - Proposal : 55 opps (69% pass → 🟠 attention)
   - Negotiation : 40 opps (73% pass → ✅ bon)
   - Won : 30 opps (75% close rate → ✅ excellent)

3. **Badge "🔴 BOTTLENECK" sur stage Proposal**

4. **Directeur explique :**
   - "Notre plus gros goulot : 31% des opportunités perdues au stage Proposal"
   - "Analyse montre : problème de pricing (trop cher pour PME)"
   - "Action lancée : création offre Starter à -30% pour PME"

5. **Time in Stage chart montre :**
   - Proposal : 18 jours (vs 14 jours benchmark) → en rouge
   - Negotiation : 12 jours (vs 15 jours benchmark) → en vert
   - **Insight :** "Commerciaux passent trop de temps à créer proposals. Solution : templates automatisés."

**ÉTAPE 5 : Performance by Segment (Section 4)**

1. **Tree Map "Performance by Country" affiche :**
   - UAE : Grosse bulle verte (35% conversion, 450k€ forecast)
   - France : Bulle moyenne orange (28% conversion, 240k€ forecast)
   - KSA : Petite bulle rouge (22% conversion, 90k€ forecast)

2. **Directeur commente :**
   - "UAE est notre marché le plus mature"
   - "Décision : doubler budget marketing UAE en Q1 (ROI prouvé)"
   - "France nécessite optimisation (formation commerciaux)"
   - "KSA : marché difficile, réduire investissement"

3. **Performance by Rep affiche TOP 10 :**
   - Sarah Dubois : 180k€ won, 45% conversion ⭐ #1
   - Karim Al-Rashid : 160k€ won, 38% conversion #2
   - Mohamed Ali : 120k€ won, 32% conversion #3
   - ...
   - Jean Martin : 40k€ won, 18% conversion ⚠️ #10

4. **Cliquer sur barre "Jean Martin"**
5. Drill-down : Liste de ses opportunités
6. **Pattern détecté :** Jean perd 80% des opportunités au stage Proposal
7. **Action :** "Jean a besoin de coaching pricing & négociation"

**ÉTAPE 6 : Insights Automatiques (Section 5)**

1. **4 insights affichés :**

**Insight 1 (Priority: SUCCESS) :**

- ✅ "Conversion rate improved by 4% this quarter"
- "From 28% to 32%. Best performers: Sarah (45%), Karim (38%)"
- "Continue current strategy. Consider team training on best practices."

**Insight 2 (Priority: WARNING) :**

- ⚠️ "31% of opportunities lost at Proposal stage"
- "Analysis shows pricing objections in 65% of cases"
- Recommendation : "Launch Starter offer for SMB segment"
- **Bouton "Take Action"** → Ouvre modal création tâche Product
- Directeur clique, crée tâche : "Finaliser offre Starter low-cost"

**Insight 3 (Priority: OPPORTUNITY) :**

- 💡 "UAE market has 45% conversion rate"
- "Significantly above average (32%). Strong product-market fit."
- Recommendation : "Double marketing investment in UAE. Estimated impact: +200k€ ARR"
- **Bouton "Take Action"** → Ouvre modal allocation budget

**Insight 4 (Priority: INFO) :**

- 📊 "Sales cycle reduced by 5 days this quarter"
- "From 47 to 42 days. Main driver: faster proposal generation (templates)"
- "Continue process optimization efforts"

**ÉTAPE 7 : Win Rate Trend (Section 5)**

1. Line Chart "Win Rate Last 12 Months" :
   - Jan 2025 : 24% (sous benchmark 30%)
   - Feb-Mar : 26-27% (amélioration)
   - Apr : Launch offre Starter
   - May-Nov : 30-32% (au-dessus benchmark)

2. **Tendance visible : courbe ascendante**
3. **Zone verte depuis Mai (au-dessus benchmark)**

4. **Directeur commente :**
   - "Amélioration constante depuis 10 mois"
   - "Passage au-dessus benchmark industrie en Mai"
   - "Objectif Q1 2026 : atteindre 35%"

**ÉTAPE 8 : At Risk Opportunities (Section 6, Onglet 3)**

1. Cliquer onglet "At Risk Opportunities"
2. Table affiche 8 opportunités ⚠️ :
   - ABC Logistics : Expected close Oct 30 (11 days overdue)
   - XYZ Transport : Stuck in Proposal 42 days
   - DEF Delivery : No activity 21 days
   - ...

3. Pour chaque opp, actions recommandées :
   - "📞 Call immediately"
   - "📧 Send follow-up email"
   - "💰 Review pricing (competitor analysis)"

4. **Directeur :** "Ces 8 opportunités représentent 180k€ potentiel"
5. **Action immédiate :** Assigner chacune à un commercial pour relance dans les 24h

**ÉTAPE 9 : Export Report**

1. Cliquer bouton "Export Report" (header)
2. Modal "Export Options" :
   - Format : PDF (sélectionné) ou Excel
   - Sections : Toutes ou Custom
   - Include : Graphs ✅, Tables ✅, Insights ✅
3. Cliquer "Generate PDF"
4. PDF généré en 5 secondes
5. Téléchargé : `Sales_Analytics_Dashboard_Q4_2025.pdf`
6. Contenu :
   - Page 1 : KPI Summary
   - Page 2-3 : Forecast Analysis avec graphiques
   - Page 4 : Conversion Funnel
   - Page 5 : Performance by Segment
   - Page 6 : Insights & Recommendations
   - Page 7 : At Risk Opportunities

7. **Directeur partage PDF aux investisseurs**

**ÉTAPE 10 : Questions Investisseurs**

**Investisseur 1 :** "Comment comptez-vous passer de 32% à 35% conversion ?"

**Directeur affiche Section Insights :**

- "3 leviers identifiés par analytics :"
  1. "Lancement offre Starter (impact estimé: +3% conversion)"
  2. "Formation commerciaux sur best practices Sarah et Karim"
  3. "Réduction délai Proposal via templates (déjà en cours)"
- "Impact cumulé estimé : +5% conversion = +75k€ CA additionnel par mois"

**Investisseur 2 :** "Quels sont vos marchés prioritaires pour investissement ?"

**Directeur affiche Tree Map Performance by Country :**

- "UAE : 35% conversion, marché mature → doubler budget"
- "France : 28% conversion, potentiel → optimiser process"
- "KSA : 22% conversion, difficile → maintenir actuel"
- "Nouvelle expansion : Qatar (market research positif)"

**CFO :** "Êtes-vous confiant sur forecast Q1 ?"

**Directeur :**

- "Forecast réaliste 450k€ avec 87% confidence"
- "Basé sur 45 opportunités actives, pipeline équilibré"
- "Historique précision : 92% sur 12 derniers mois"
- "Scénario conservateur : 380k€ (même si conversion baisse)"
- "Oui, très confiant."

**VALIDATION SPONSOR :**

✅ **Démo montre clairement :**

- Dashboard complet et professionnel (niveau Salesforce)
- Tous KPI visibles en 1 coup d'œil
- Forecast fiable avec scénarios et confidence
- Funnel identifie bottlenecks précisément
- Insights générés automatiquement et actionnables
- Performance segmentée (pays, commerciaux)
- Export PDF pour présentations
- Questions investisseurs répondues instantanément avec données
- ROI évident : décisions data-driven = +420k€ CA déjà en Q4

---

## ⏱️ ESTIMATION

**Backend (Service Layer) :**

- AnalyticsService.getForecast() : 8 heures
- AnalyticsService.getConversionFunnel() : 6 heures
- AnalyticsService.getPerformanceMetrics() : 6 heures
- **Total Backend : 20 heures**

**API REST (Endpoints) :**

- GET /analytics/forecast : 2 heures
- GET /analytics/conversion-funnel : 2 heures
- GET /analytics/performance : 2 heures
- **Total API : 6 heures**

**Frontend (Interface) :**

- AnalyticsDashboard complet : 20 heures (très complexe, nombreux graphiques)
  - KPI Cards : 3h
  - Forecast graphs : 5h
  - Funnel chart : 4h
  - Performance segments : 4h
  - Insights section : 2h
  - Tables onglets : 2h
- Page dashboard : 2 heures
- Export PDF fonctionnalité : 4 heures
- **Total Frontend : 26 heures**

**Tests :**

- Tests unitaires analytics services : 4 heures
- Tests API endpoints : 2 heures
- Tests E2E dashboard : 3 heures
- **Total Tests : 9 heures**

**TOTAL ÉTAPE 2.4 : 61 heures (arrondi à 3 jours avec optimisations)**

---

## 🔗 DÉPENDANCES

**Prérequis obligatoires :**

- Sprint 2 Étapes 2.1, 2.2, 2.3 terminées
- Données historiques suffisantes (minimum 30 opportunités closes)
- OpportunityService avec méthodes de base
- Bibliothèque Recharts installée pour graphiques

**Services requis :**

- OpportunityService.findAll() (avec filtres avancés)
- PipelineService.getAll() (pour dropdown filtres)
- MemberService.getAll() (pour dropdown commerciaux)

**Composants frontend requis :**

- KPI Card composant réutilisable
- Chart composants (LineChart, BarChart, FunnelChart, TreeMap)
- DateRangePicker composant
- Export PDF library (react-pdf ou jsPDF)

**Données nécessaires :**

- Minimum 50 opportunités avec historique complet (stage_history)
- Opportunités closes sur 12 mois (pour tendances)
- Plusieurs commerciaux pour comparaisons
- Données segmentées (pays, taille flotte, source)

---

## ✅ CHECKLIST DE VALIDATION

### Backend

- [ ] AnalyticsService.getForecast() retourne forecast complet
- [ ] Calcul forecast total correct (sum expected_value × probability)
- [ ] Forecast par stage calculé correctement
- [ ] Forecast par période (6 mois) correct
- [ ] 3 scénarios (conservateur/réaliste/optimiste) calculés
- [ ] Confidence score calculé avec explication
- [ ] Comparaison période précédente fonctionne (deltas)
- [ ] AnalyticsService.getConversionFunnel() retourne funnel complet
- [ ] Taux conversion par stage calculés correctement
- [ ] Bottlenecks identifiés (conversion <50%)
- [ ] Durée moyenne par stage calculée
- [ ] Insights funnel générés automatiquement
- [ ] AnalyticsService.getPerformanceMetrics() retourne métriques complètes
- [ ] Taux conversion global correct
- [ ] Durée cycle vente moyenne correcte
- [ ] Deal size moyen correct
- [ ] Vélocité pipeline calculée correctement
- [ ] Performance par commercial correcte (TOP 10)
- [ ] Performance par segment correcte (pays, flotte, source)

### API REST

- [ ] GET /analytics/forecast retourne données complètes
- [ ] Filtres (pipeline_id, assigned_to, dates) fonctionnent
- [ ] Cache 30 minutes appliqué
- [ ] GET /analytics/conversion-funnel retourne funnel
- [ ] Filtres date_from/date_to fonctionnent
- [ ] Cache 1h appliqué
- [ ] GET /analytics/performance retourne métriques
- [ ] Comparaison période précédente fonctionne
- [ ] Performances acceptables (<2s réponse)

### Frontend

- [ ] AnalyticsDashboard affiche toutes sections
- [ ] 6 KPI Cards affichent métriques correctes
- [ ] Sparklines sur KPI cards fonctionnent
- [ ] Badges couleur selon valeur (vert/orange/rouge)
- [ ] Forecast Timeline graphique affiche 3 courbes
- [ ] Forecast by Stage stacked bar correct
- [ ] Funnel Chart affiche 5 niveaux proportionnels
- [ ] Badge "BOTTLENECK" sur stages problématiques
- [ ] Time in Stage bar chart avec benchmark
- [ ] Tree Map Performance by Country fonctionne
- [ ] Taille bulle proportionnelle à forecast
- [ ] Couleur bulle selon conversion rate
- [ ] Performance by Rep bar chart TOP 10
- [ ] Drill-down sur commercial fonctionne (clic → détails)
- [ ] Win Rate Trend line chart 12 mois
- [ ] Benchmark industrie affiché (ligne pointillée)
- [ ] Insights section affiche 4-6 insights
- [ ] Boutons "Take Action" créent tâches
- [ ] Onglets (By Stage, Recent Wins, At Risk) fonctionnent
- [ ] At Risk Opportunities affiche opps en retard
- [ ] Actions recommandées affichées par opp
- [ ] Export PDF fonctionne et génère rapport complet
- [ ] Filtres header (dates, pipeline, commercial) appliqués à tous graphiques
- [ ] Toggle "Compare to previous" affiche deltas partout
- [ ] Lazy loading graphiques (render au scroll)
- [ ] Skeleton loaders pendant chargement
- [ ] Responsive mobile (graphiques adaptés)
- [ ] Animations fluides (Framer Motion)

### Tests

- [ ] Test unitaire getForecast() calcul correct
- [ ] Test getForecast() avec filtres
- [ ] Test getConversionFunnel() taux conversion corrects
- [ ] Test getConversionFunnel() identifie bottlenecks
- [ ] Test getPerformanceMetrics() toutes métriques
- [ ] Test API /forecast retourne 200
- [ ] Test API /conversion-funnel retourne 200
- [ ] Test API /performance retourne 200
- [ ] Test E2E : dashboard charge toutes données
- [ ] Test E2E : filtres appliqués correctement
- [ ] Test E2E : export PDF génère fichier

### Démo Sponsor

- [ ] Sponsor accède au dashboard en <2s
- [ ] Sponsor voit tous KPI en 1 coup d'œil
- [ ] Sponsor comprend forecast 6 mois (3 scénarios)
- [ ] Sponsor voit confidence level forecast
- [ ] Sponsor identifie bottleneck dans funnel
- [ ] Sponsor voit performance par pays
- [ ] Sponsor peut drill-down sur commercial
- [ ] Sponsor lit insights et recommendations
- [ ] Sponsor peut créer tâche depuis insight
- [ ] Sponsor peut exporter PDF pour présentation
- [ ] Sponsor peut répondre aux questions CFO/investisseurs avec données

---

# TRANSITION SPRINT 2 → SPRINT 3

## 📊 ÉTAT FINAL SPRINT 2 (COMPLET)

### ✅ Ce qui est TERMINÉ et DÉPLOYÉ

**Module Opportunities - 100% Fonctionnel :**

**Étape 2.1 : Gestion Pipeline (26h) ✅**

- Service OpportunityService avec toutes méthodes CRUD
- Pipeline Kanban 5 colonnes avec drag & drop
- Filtres avancés (stage, status, owner, dates)
- Stats pipeline temps réel (count, forecast par colonne)
- Notifications automatiques (réassignation, retard)

**Étape 2.2 : Win + Contract (28h) ✅**

- OpportunityService.markAsWon() fonctionnel
- Création automatique contrat depuis opportunity won
- Modal WinOpportunityModal avec formulaire complet
- Workflow Opportunity → Contract → Tenant Provisioning
- Notifications stakeholders (manager, CS, finance)

**Étape 2.3 : Lose + Analyse Pertes (24h) ✅**

- OpportunityService.markAsLost() fonctionnel
- Table crm_opportunity_loss_reasons seedée (16 motifs)
- Workflow récupération automatique (tâches follow-up)
- LossAnalysisDashboard complet avec graphiques
- Insights automatiques avec recommendations
- Export CSV données pertes

**Étape 2.4 : Analytics Dashboard + Forecast (24h) ✅**

- AnalyticsService complet (forecast, funnel, performance)
- Dashboard analytics niveau entreprise
- Forecast 6 mois avec 3 scénarios
- Funnel conversion avec bottlenecks
- Performance par segment (pays, commerciaux)
- Insights générés automatiquement
- Export PDF rapports

**RÉSULTAT BUSINESS SPRINT 2 :**

- Pipeline commercial 100% visible et pilotable
- Prévisions revenus fiables (forecast avec 87% confidence)
- Analyse pertes → identification actions correctives
- Taux conversion amélioré de 28% → 32% (+4 points)
- Décisions data-driven pour management et investisseurs
- ROI démontré : +420k€ CA Q4 grâce aux optimisations identifiées

### 🔗 DÉPENDANCES CRÉÉES POUR SPRINT 3

**Tables et données prêtes :**

- crm_opportunities complètes avec won_date, won_value
- crm_contracts structure prête (sera peuplée dans Sprint 3)
- Liens opportunities ↔ contracts établis

**Services disponibles :**

- OpportunityService.markAsWon() retourne contract_id
- NotificationService opérationnel pour envoi emails
- AuditService trace toutes actions

**Composants UI réutilisables :**

- OpportunityCard composant
- Modal patterns (Win, Lose) réutilisables pour Contracts
- Dashboard analytics patterns réutilisables

---

## 🎯 CE QUI DÉMARRE DANS SPRINT 3

### Périmètre Sprint 3 : Contracts & Tenant Onboarding (3 jours)

**Sprint 3 se concentre sur :**

**Étape 3.1 : Contract Management (18h)**

- Service ContractService complet
- Workflow signature électronique (DocuSign intégration)
- Gestion renouvellements automatiques
- Workflow résiliation avec motifs
- Pages UI liste contrats + détail contrat
- Modal signature, renouvellement, amendement

**Étape 3.2 : Tenant Provisioning Automatique (14h)**

- Workflow complet : Contract Signed → Tenant Created
- Service TenantService.createFromContract()
- Génération automatique :
  - Subdomain unique (ex: abc-logistics.fleetcore.com)
  - Clerk Organization création via API
  - Settings tenant par défaut
  - Invitation automatique contact principal
- Page onboarding tenant (wizard 4 étapes)
- Email welcome avec liens activation

**Étape 3.3 : Member Invitations & Onboarding (10h)**

- Service InvitationService complet
- Workflow invitation sécurisé (token unique, expiration)
- Email invitation avec lien acceptation
- Page acceptation invitation + création compte Clerk
- Assignation rôles automatique selon invitation
- Page onboarding wizard pour nouveau membre

### Flux End-to-End Complet Sprint 2 + Sprint 3

```
FLUX COMMERCIAL COMPLET (de bout en bout) :

1. LEAD (Sprint 1 ✅)
   └─ Prospect remplit formulaire "Demander une démo"
   └─ Lead créé avec scores automatiques
   └─ Commercial assigné automatiquement

2. OPPORTUNITY (Sprint 2 ✅)
   └─ Lead qualifié converti en opportunity
   └─ Opportunity progresse dans pipeline
   └─ Commercial négocie, envoie proposal

3. CLOSING (Sprint 2 ✅)
   └─ Prospect accepte offre
   └─ Commercial marque opportunity as Won
   └─ Contract automatiquement généré

4. CONTRACT (Sprint 3 🔄)
   └─ Contract en status "draft"
   └─ Envoi pour signature électronique
   └─ Prospect signe via DocuSign
   └─ Contract status → "signed"

5. TENANT PROVISIONING (Sprint 3 🔄)
   └─ Déclenchement automatique après signature
   └─ Création Tenant dans adm_tenants
   └─ Création Organization Clerk
   └─ Génération subdomain
   └─ Envoi invitation contact principal

6. ONBOARDING (Sprint 3 🔄)
   └─ Contact principal accepte invitation
   └─ Création compte Clerk
   └─ Wizard onboarding : Config entreprise, Ajout véhicules, Invitations équipe
   └─ Tenant actif et opérationnel

7. EXPLOITATION (Sprints futurs)
   └─ Utilisation quotidienne FleetCore
   └─ Gestion flotte, chauffeurs, trajets
   └─ Facturation automatique
```

### Prérequis Sprint 3 (Déjà Satisfaits)

**✅ Tables créées :**

- crm_contracts (structure complète)
- adm_tenants (structure complète)
- adm_invitations (structure complète)
- adm_members (structure complète)

**✅ Services existants :**

- OpportunityService.markAsWon() (crée contract_id)
- NotificationService (pour emails invitation)
- AuditService (pour traçabilité)

**✅ Intégrations configurées :**

- Clerk authentication (webhooks prêts)
- Resend email service (pour invitations)
- Supabase RLS policies (isolation multi-tenant)

**🔄 À développer Sprint 3 :**

- ContractService complet
- TenantService.createFromContract()
- InvitationService complet
- DocuSign integration (signature électronique)
- Pages UI contrats
- Onboarding wizard

### Différences Clés Sprint 2 vs Sprint 3

**Sprint 2 = PIPELINE COMMERCIAL (vente)**

- Focus : Gérer opportunities jusqu'au closing
- Objectif : Maximiser taux conversion, forecast revenus
- Utilisateurs : Commerciaux, Managers, Direction
- Métriques : Conversion rate, forecast, vélocité
- Résultat : Deal gagné, contract créé

**Sprint 3 = PROVISIONING & ONBOARDING (post-vente)**

- Focus : Transformer contract en tenant opérationnel
- Objectif : Activer clients rapidement (time-to-value)
- Utilisateurs : Customer Success, Clients, Admins
- Métriques : Time-to-activation, onboarding completion rate
- Résultat : Tenant actif, premier utilisateur connecté

---

## 📋 CHECKLIST TRANSITION

### Validation Sponsor Avant Sprint 3

**Le sponsor doit valider que Sprint 2 est 100% terminé :**

- [ ] **Pipeline Kanban fonctionne parfaitement**
  - [ ] Drag & drop opportunités entre stages
  - [ ] Stats temps réel par colonne
  - [ ] Filtres appliqués correctement

- [ ] **Win Opportunity workflow complet**
  - [ ] Modal Win avec formulaire
  - [ ] Contract automatiquement créé après win
  - [ ] Notifications envoyées (manager, CS, finance)

- [ ] **Lose Opportunity workflow complet**
  - [ ] Modal Lose avec motifs obligatoires
  - [ ] Tâches follow-up créées si récupérable
  - [ ] Dashboard analyse pertes opérationnel

- [ ] **Analytics Dashboard professionnel**
  - [ ] 6 KPI cards avec comparaison période précédente
  - [ ] Forecast 6 mois avec scénarios
  - [ ] Funnel conversion identifie bottlenecks
  - [ ] Performance par pays et commerciaux
  - [ ] Insights générés automatiquement
  - [ ] Export PDF fonctionne

- [ ] **Données de test suffisantes**
  - [ ] Minimum 50 opportunities (mix won/lost/open)
  - [ ] Opportunities closes sur 12 mois (pour tendances)
  - [ ] Plusieurs commerciaux avec performances variées
  - [ ] Données segmentées (pays, taille flotte)

**SI UNE SEULE CHECKBOX NON COCHÉE → NE PAS DÉMARRER SPRINT 3**

### Communication Équipe

**Message pour Claude Code (début Sprint 3) :**

```
CONTEXTE :
Sprint 2 Opportunity Pipeline est 100% terminé et déployé en production.

ÉTAT ACTUEL :
- OpportunityService.markAsWon() crée un contract avec status "draft"
- Ce contract a un contract_id renseigné dans l'opportunity
- Le contract existe en base mais n'a pas encore de workflow (signature, activation)

MISSION SPRINT 3 :
Tu dois maintenant créer le workflow complet depuis Contract jusqu'à Tenant actif.

PRIORITÉ 1 : ContractService avec workflow signature
PRIORITÉ 2 : TenantService.createFromContract() pour provisioning automatique
PRIORITÉ 3 : InvitationService pour onboarding nouveau client

FICHIERS À CRÉER :
- lib/services/crm/contract.service.ts
- lib/services/admin/tenant.service.ts
- lib/services/admin/invitation.service.ts
[+ APIs et UI correspondantes]

FICHIERS À NE PAS TOUCHER :
- Tout ce qui concerne OpportunityService (déjà complet et déployé)
- AnalyticsService (déjà complet)
- LossReasonService (déjà complet)

DÉMARRE PAR :
Lire les spécifications Contract dans /mnt/project/crm_contracts_spec.md
```

---

## 🎉 RÉSUMÉ FINAL

**SPRINT 2 ACCOMPLI :**

- ✅ 102 heures de développement
- ✅ 4 étapes complètes (Pipeline, Win, Lose, Analytics)
- ✅ 15+ APIs REST créées
- ✅ 8+ composants UI professionnels
- ✅ Dashboard analytics niveau entreprise
- ✅ ROI démontré : +420k€ CA grâce aux optimisations

**TRANSITION SPRINT 3 :**

- 🔄 Contract Management (signature, renouvellement)
- 🔄 Tenant Provisioning automatique
- 🔄 Member Invitations & Onboarding
- 🔄 Flux End-to-End complet : Lead → Tenant Actif

**PROCHAINE DÉMO SPONSOR :**

- Montrer qu'un contract signé déclenche automatiquement création tenant
- Montrer qu'un tenant reçoit invitation et peut s'onboarder
- Montrer que le flux commercial est 100% automatisé de bout en bout

---

**FIN DU DOCUMENT**

_Ce document couvre UNIQUEMENT les étapes 2.3 et 2.4 du Sprint 2 avec la transition vers Sprint 3. Les étapes 2.1 et 2.2 sont considérées comme déjà livrées et ne sont pas détaillées ici._
