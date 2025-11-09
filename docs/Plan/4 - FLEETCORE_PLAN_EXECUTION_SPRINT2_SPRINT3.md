# FLEETCORE - PLAN D'EXÉCUTION SPRINT 2 & SPRINT 3

## ÉTAPE 2.3 : Lose Opportunity + Analyse des Pertes

### 🎯 RATIONNEL MÉTIER

**POURQUOI :** Toutes les opportunités ne se transforment pas en contrats. En moyenne, 65-70% des opportunités sont perdues (lost). Sans analyse structurée des raisons de perte, l'entreprise répète les mêmes erreurs indéfiniment. Chaque opportunité perdue représente des mois de travail commercial gaspillés et des revenus non réalisés.

**QUEL PROBLÈME :** Actuellement, quand une opportunité est perdue, elle est simplement marquée "lost" sans documentation. Impossible de savoir POURQUOI elle a été perdue : prix trop élevé ? Concurrent choisi ? Features manquantes ? Budget annulé ? Sans cette analyse, le management ne peut pas prendre de décisions stratégiques pour améliorer le taux de conversion.

**IMPACT SI ABSENT :**

- **Stratégique** : Impossible d'identifier les faiblesses compétitives (prix, produit, service)
- **Commercial** : Équipes commerciales démotivées car pertes non analysées ni apprises
- **Produit** : Product managers ne savent pas quelles features développer en priorité
- **Pricing** : Direction ne sait pas si les prix sont trop élevés ou acceptables
- **Financier** : Budget marketing investi sur des prospects qui partent pour des raisons récurrentes

**CAS D'USAGE CONCRET :**

**Trimestre 1 2025 - Sans analyse des pertes :**

- 50 opportunités créées, 15 gagnées, 35 perdues
- Taux de conversion : 30%
- Management ne comprend pas pourquoi 70% des opportunités sont perdues
- Hypothèses : "Le marché est difficile", "Les commerciaux ne sont pas assez bons"
- Aucune action corrective prise
- Trimestre 2 : Même résultat (30% conversion)

**Trimestre 1 2025 - Avec analyse systématique des pertes :**

- 50 opportunités créées
- Pour chaque perte, commercial obligé de sélectionner raison dans liste standardisée :
  - 12 perdues pour "Prix trop élevé" (34%)
  - 8 perdues pour "Features manquantes - Intégration Talabat" (23%)
  - 6 perdues pour "Concurrent choisi - Motive" (17%)
  - 5 perdues pour "Timing - Pas prêt maintenant" (14%)
  - 4 perdues pour "Budget perdu" (12%)

**Actions correctives prises :**

1. **Prix** : Création d'une offre "Starter" à -30% pour PME → Cible 12 opportunités récupérables
2. **Features** : Roadmap priorité #1 = Intégration Talabat → Développement urgent
3. **Concurrent** : Analyse comparative FleetCore vs Motive → Argumentaire commercial renforcé
4. **Timing** : Workflow nurturing automatique pour leads "pas prêt" → Rappel dans 3 mois
5. **Budget** : Offre flexible "Pay per use" pour prospects sans budget fixe

**Résultat Trimestre 2 :**

- 50 opportunités créées
- Pertes "Prix trop élevé" : 12 → 3 (offre Starter lancée)
- Pertes "Features manquantes" : 8 → 1 (Talabat intégré)
- Pertes "Concurrent" : 6 → 4 (argumentaire amélioré mais concurrent reste fort)
- 25 opportunités gagnées
- **Taux de conversion : 50%** (était 30%)
- **Gain : +10 clients/trimestre = +180k€ ARR**

**ROI de l'analyse des pertes :**

- Temps investi : 2 minutes par opportunité perdue pour documenter raison = 70 minutes/trimestre
- Gain : +10 clients × 18k€ = 180k€ ARR
- ROI : 180,000€ / (70 min × 50€/h commercial) = **3,000% ROI**

### 📊 DONNÉES ET RÈGLES MÉTIER

**Tables impliquées :**

- **crm_opportunities** (mise à jour status, lost_date)
- **crm_opportunity_loss_reasons** (référentiel raisons standardisées)

**Colonnes critiques de crm_opportunities pour perte :**

| Colonne                   | Type  | Obligatoire          | Utilité Business                                                       |
| ------------------------- | ----- | -------------------- | ---------------------------------------------------------------------- |
| **status**                | enum  | OUI                  | Passe de "open" à "lost"                                               |
| **lost_date**             | date  | OUI si lost          | Date officielle de la perte                                            |
| **loss_reason_id**        | uuid  | OUI si lost          | FK vers crm_opportunity_loss_reasons                                   |
| **loss_notes**            | text  | RECOMMANDÉ           | Détails contextuels de la perte                                        |
| **competitor_id**         | uuid  | SI raison=concurrent | Quel concurrent a gagné ?                                              |
| **lost_by**               | uuid  | OUI                  | Membre qui a marqué comme perdu                                        |
| **metadata.loss_context** | jsonb | NON                  | Données additionnelles (prix concurrent, features manquantes précises) |

**Table crm_opportunity_loss_reasons (référentiel) :**

Cette table contient les raisons standardisées de perte. Crucial pour analyse agrégée.

| Colonne                | Type         | Description                                                    |
| ---------------------- | ------------ | -------------------------------------------------------------- |
| **id**                 | uuid         | Identifiant unique                                             |
| **reason_code**        | varchar(50)  | Code technique (PRICE_TOO_HIGH)                                |
| **reason_name**        | varchar(100) | Libellé utilisateur ("Prix trop élevé")                        |
| **category**           | enum         | Catégorie (price, product, competition, timing, budget, other) |
| **description**        | text         | Explication détaillée de la raison                             |
| **is_active**          | boolean      | Permet de désactiver raisons obsolètes                         |
| **display_order**      | integer      | Ordre d'affichage dans UI                                      |
| **require_notes**      | boolean      | Notes obligatoires pour cette raison ?                         |
| **require_competitor** | boolean      | Sélection concurrent obligatoire ?                             |

**Données de référence à créer dans crm_opportunity_loss_reasons :**

```
ID | Code | Nom | Catégorie | Require Competitor | Require Notes
---|------|-----|-----------|-------------------|---------------
1  | PRICE_TOO_HIGH | Prix trop élevé | price | false | true (quel était le budget ?)
2  | FEATURES_MISSING | Features manquantes | product | false | true (quelles features ?)
3  | COMPETITOR_CHOSEN | Concurrent choisi | competition | true | true (pourquoi concurrent préféré ?)
4  | TIMING_NOT_READY | Timing - Pas prêt maintenant | timing | false | true (quand seront-ils prêts ?)
5  | BUDGET_LOST | Budget annulé/réduit | budget | false | true (contexte ?)
6  | NO_RESPONSE | Pas de réponse/ghosting | other | false | false
7  | TECHNICAL_FIT | Solution techniquement inadaptée | product | false | true (pourquoi inadaptée ?)
8  | INTERNAL_SOLUTION | Ont développé en interne | competition | false | true (détails solution interne ?)
9  | CONTRACT_TERMS | Conditions contractuelles inacceptables | other | false | true (quelles conditions ?)
10 | ACQUISITION_MERGER | Client acquis/fusionné | other | false | false
```

**Règles métier strictes pour marquer une opportunity comme perdue :**

**Règle 1 : Raison obligatoire**

```
SI commercial clique "Mark as Lost"
ALORS
  - Afficher modal avec dropdown "Raison de perte"
  - Dropdown peuplé depuis crm_opportunity_loss_reasons WHERE is_active = true
  - Raison OBLIGATOIRE (pas de skip possible)
  - Si raison non sélectionnée → Erreur "Veuillez sélectionner une raison"
FIN SI
```

**Règle 2 : Notes contextuelles obligatoires selon raison**

```
SI loss_reason.require_notes = true
ALORS
  - Textarea "Détails" OBLIGATOIRE
  - Min 20 caractères
  - Exemples affichés selon raison :
    * Prix trop élevé → "Quel était leur budget ? Quel concurrent moins cher ?"
    * Features manquantes → "Quelles features précises manquaient ?"
  - Si notes < 20 caractères → Erreur "Veuillez fournir plus de détails"
FIN SI
```

**Règle 3 : Concurrent obligatoire si raison = "Concurrent choisi"**

```
SI loss_reason_code = 'COMPETITOR_CHOSEN'
ALORS
  - Dropdown "Quel concurrent ?" OBLIGATOIRE
  - Liste depuis table ref_competitors (Motive, Samsara, Geotab, etc.)
  - Champ competitor_id renseigné
  - Notes doivent expliquer pourquoi concurrent préféré
FIN SI
```

**Règle 4 : Validation manager pour opportunités > 10k€**

```
SI opportunity.expected_value > 10000
ALORS
  - Status passe temporairement à "pending_loss_approval"
  - Notification envoyée au manager commercial
  - Manager doit approuver ou rejeter la perte avec commentaire
  - Si approuvé → Status = "lost", lost_date = date approbation
  - Si rejeté → Status reste "open", notification au commercial "Le manager demande plus d'efforts"
FIN SI

POURQUOI : Éviter que commerciaux abandonnent trop vite les gros deals
```

**Règle 5 : Opportunité réactivable pendant 90 jours**

```
SI opportunity.status = "lost" ET lost_date < today - 90 jours
ALORS
  - Bouton "Reopen" visible pour commercial et manager
  - Si Reopen cliqué :
    * Status repasse à "open"
    * Stage retourne à stage précédent
    * Audit log "opportunity_reopened" créé
    * Notes obligatoires : Pourquoi réouverture ?
FIN SI

CAS D'USAGE : Client revient après avoir testé concurrent et être déçu
```

**Règle 6 : Archivage automatique après 90 jours**

```
SI opportunity.status = "lost" ET lost_date < today - 90 jours
ALORS
  - Opportunity archivée (soft delete)
  - Toujours accessible pour analyse historique
  - Ne pollue plus les listes actives
FIN SI
```

**Règles d'analyse agrégée (rapports) :**

**Analyse des raisons de perte (management dashboard) :**

```sql
-- Top 5 raisons de perte sur les 3 derniers mois
SELECT
  lr.reason_name,
  lr.category,
  COUNT(*) as nb_opportunities_lost,
  SUM(o.expected_value) as revenue_lost,
  ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM crm_opportunities WHERE status = 'lost' AND lost_date > NOW() - INTERVAL '3 months'), 1) as percentage
FROM crm_opportunities o
JOIN crm_opportunity_loss_reasons lr ON o.loss_reason_id = lr.id
WHERE o.status = 'lost'
  AND o.lost_date > NOW() - INTERVAL '3 months'
GROUP BY lr.id, lr.reason_name, lr.category
ORDER BY nb_opportunities_lost DESC
LIMIT 5
```

**Résultat attendu :**

```
Raison                    | Catégorie    | Nb Pertes | Revenus Perdus | %
--------------------------|--------------|-----------|----------------|-----
Prix trop élevé          | price        | 12        | 216,000€       | 34%
Features manquantes      | product      | 8         | 144,000€       | 23%
Concurrent choisi        | competition  | 6         | 108,000€       | 17%
Timing - Pas prêt        | timing       | 5         | 90,000€        | 14%
Budget annulé            | budget       | 4         | 72,000€        | 12%
```

**Analyse par concurrent (si raison = concurrent choisi) :**

```sql
-- Quels concurrents gagnent le plus contre nous ?
SELECT
  c.name as competitor_name,
  COUNT(*) as times_won_against_us,
  SUM(o.expected_value) as revenue_lost_to_them,
  ROUND(AVG(o.expected_value), 0) as avg_deal_size
FROM crm_opportunities o
JOIN crm_opportunity_loss_reasons lr ON o.loss_reason_id = lr.id
JOIN ref_competitors c ON o.competitor_id = c.id
WHERE lr.reason_code = 'COMPETITOR_CHOSEN'
  AND o.lost_date > NOW() - INTERVAL '3 months'
GROUP BY c.id, c.name
ORDER BY times_won_against_us DESC
```

**Résultat attendu :**

```
Concurrent       | Fois Gagné | Revenus Perdus | Taille Deal Moy
-----------------|------------|----------------|----------------
Motive           | 8          | 144,000€       | 18,000€
Samsara          | 5          | 125,000€       | 25,000€
Geotab           | 3          | 54,000€        | 18,000€
Solution interne | 2          | 36,000€        | 18,000€
```

**Actions stratégiques déclenchées automatiquement :**

```
SI (nb opportunités perdues pour "Prix trop élevé") > 30% sur 3 mois
ALORS
  - Alerte envoyée à Direction Commerciale
  - Recommandation : "Considérer ajustement pricing ou création offre entry-level"
  - Meeting pricing stratégique automatiquement schedulé
FIN SI

SI (nb opportunités perdues pour "Features manquantes") > 20% sur 3 mois
ALORS
  - Alerte envoyée à Product Manager
  - Liste des features manquantes extraites des loss_notes
  - Analyse de fréquence des features demandées
  - Recommandation roadmap produit
FIN SI

SI (concurrent X) gagne > 5 deals en 3 mois
ALORS
  - Alerte envoyée à Direction Commerciale
  - Recommandation : "Analyse compétitive approfondie de [Concurrent X] requise"
  - Création automatique tâche "Étude concurrentielle" assignée à Marketing
FIN SI
```

### 🏗️ COMPOSANTS À DÉVELOPPER

#### Backend (Service Layer)

**Modification fichier : `lib/services/crm/opportunity.service.ts`**

Ajouter les méthodes de gestion des pertes.

**Méthode markAsLost(opportunityId: string, lossData: OpportunityLossInput) → Promise<Opportunity>**

Processus complet de marquage d'une opportunity comme perdue avec validation des règles métier.

**Étapes détaillées :**

1. Valider lossData avec OpportunityLossSchema Zod
2. Récupérer l'opportunity complète depuis DB
3. Vérifier que opportunity.status = "open"
   - Si déjà "lost" ou "won" → throw BusinessRuleError("Cannot mark as lost, already closed")
4. Récupérer la loss_reason depuis crm_opportunity_loss_reasons
5. Vérifier require_notes : Si true ET loss_notes vide ou < 20 caractères → throw ValidationError
6. Vérifier require_competitor : Si true ET competitor_id NULL → throw ValidationError
7. **SI expected_value > 10000€** (grosse opportunité) :
   - Ne pas marquer comme lost immédiatement
   - Passer status à "pending_loss_approval"
   - Créer notification manager : "Opportunité [Company] (18k€) en attente d'approbation perte par [Commercial]"
   - Retourner opportunity avec status pending
8. **SINON** (opportunité normale) :
   - Marquer comme lost immédiatement
9. Mettre à jour opportunity dans DB :
   - status = "lost"
   - lost_date = maintenant
   - loss_reason_id = lossData.loss_reason_id
   - loss_notes = lossData.loss_notes
   - competitor_id = lossData.competitor_id (si fourni)
   - lost_by = member_id du contexte
   - updated_at = maintenant
10. Créer lifecycle event "opportunity_lost"
11. Créer audit log détaillé :
    - action = "marked_as_lost"
    - entity = "opportunities"
    - entity_id = opportunity.id
    - metadata = { loss_reason, expected_value, lost_by, competitor }
12. Mettre à jour statistiques temps réel :
    - Décrémenter pipeline forecast value
    - Incrémenter compteur losses du commercial
13. Déclencher analyses automatiques :
    - Si raison "Prix trop élevé" → Incrémenter compteur global
    - Si seuil 30% atteint → Envoyer alerte direction
14. Envoyer notifications :
    - Manager commercial : "Opportunité [Company] perdue - Raison : [X]"
    - Marketing (si source tracking) : "Opportunité source [Google Ads] perdue"
15. **SI timing = "Pas prêt maintenant"** :
    - Créer tâche automatique dans CRM : "Rappeler [Company] dans 3 mois"
    - Assigner à même commercial
16. Retourner opportunity mise à jour

**Méthode approveLoss(opportunityId: string, approval: LossApprovalInput) → Promise<Opportunity>**

Gestion de l'approbation manager pour les grosses opportunités.

**Étapes détaillées :**

1. Récupérer opportunity avec status "pending_loss_approval"
2. Vérifier que le membre courant est manager (permission "opportunities.approve_loss")
3. **SI approval.approved = true** :
   - status = "lost"
   - lost_date = maintenant
   - Créer audit log "loss_approved_by_manager"
   - Notification commercial : "Votre demande de perte pour [Company] a été approuvée"
4. **SI approval.approved = false** :
   - status = "open" (repasse en cours)
   - Créer audit log "loss_rejected_by_manager"
   - Créer tâche pour commercial : "Manager demande plus d'efforts sur [Company] - Raison : [approval.rejection_reason]"
   - Notification commercial : "Votre demande de perte a été rejetée. Le manager demande : [rejection_reason]"
5. Retourner opportunity mise à jour

**Méthode reopenLostOpportunity(opportunityId: string, reopenData: ReopenInput) → Promise<Opportunity>**

Réouverture d'une opportunity perdue (client revient).

**Étapes détaillées :**

1. Récupérer opportunity avec status "lost"
2. Vérifier que lost_date < today - 90 jours (fenêtre de réouverture)
   - Si > 90 jours → throw BusinessRuleError("Cannot reopen: opportunity lost more than 90 days ago")
3. Valider reopenData.reason (obligatoire, min 20 caractères)
4. Mettre à jour opportunity :
   - status = "open"
   - stage = stage précédent (stocké dans metadata.previous_stage)
   - lost_date = NULL
   - loss_reason_id = NULL
   - Ajouter dans metadata.reopen_history : { reopened_at, reopened_by, reason }
5. Créer audit log "opportunity_reopened"
6. Créer notification manager : "[Company] réouvert par [Commercial] - Raison : [reason]"
7. Incrémenter pipeline forecast value
8. Retourner opportunity réouverte

**Méthode analyzeLossReasons(filters: AnalysisFilters) → Promise<LossAnalysis>**

Génération de l'analyse agrégée des raisons de perte pour le dashboard management.

**Étapes détaillées :**

1. Construire query SQL avec filtres (date_range, owner_id, pipeline_id)
2. Récupérer top 10 raisons de perte avec :
   - Nombre d'opportunités perdues
   - Revenus perdus (expected_value total)
   - Pourcentage sur total des pertes
3. Récupérer analyse par catégorie (price, product, competition, timing, budget)
4. Récupérer analyse par concurrent (si applicable)
5. Calculer tendances :
   - Évolution nb pertes mois par mois
   - Évolution par raison sur 6 derniers mois
6. Identifier alertes automatiques :
   - Raisons > 30% → Alerte critique
   - Concurrent gagne > 5 deals → Alerte concurrentielle
7. Générer recommandations :
   - Si prix dominant → "Considérer offre entry-level"
   - Si features dominant → "Priorité roadmap produit"
   - Si concurrent dominant → "Étude compétitive requise"
8. Retourner objet LossAnalysis complet avec graphiques data

**Méthode extractMissingFeatures(dateRange) → Promise<FeatureRequest[]>**

Extraction automatique des features demandées depuis les loss_notes.

**Étapes détaillées :**

1. Récupérer toutes opportunités lost avec loss_reason = "Features manquantes" sur période
2. Pour chaque loss_notes :
   - Parser le texte avec NLP basique (keywords matching)
   - Chercher patterns : "besoin de", "manque", "pas de", "sans", "intégration avec"
   - Extraire features mentionnées
3. Agréger les features par fréquence
4. Retourner liste triée par nb occurrences
5. Exemple résultat :

```json
[
  {
    "feature": "Intégration Talabat",
    "occurrences": 8,
    "revenue_impact": 144000
  },
  {
    "feature": "Application mobile iOS",
    "occurrences": 5,
    "revenue_impact": 90000
  },
  {
    "feature": "Facturation automatique",
    "occurrences": 4,
    "revenue_impact": 72000
  }
]
```

**Fichier à créer : `lib/repositories/crm/opportunity.repository.ts`**

Ajouter méthodes d'analyse.

**Méthode findLostOpportunities(filters) → Promise<Opportunity[]>**

Récupère toutes les opportunités perdues avec leurs raisons et détails complets.

**Méthode getLossStatistics(filters) → Promise<Statistics>**

Query SQL optimisée pour calcul des statistiques de perte (utilisée par analyzeLossReasons).

#### API REST (Endpoints)

**Fichier à créer : `app/api/v1/crm/opportunities/[id]/lose/route.ts`**

**POST /api/v1/crm/opportunities/[id]/lose**

- **Description** : Marquer une opportunity comme perdue
- **Body** :

```json
{
  "loss_reason_id": "uuid-raison",
  "loss_notes": "Client a choisi Motive car intégration Talabat native et prix 20% moins cher. Leur budget était 15k€/an max, nous étions à 18k€.",
  "competitor_id": "uuid-motive",
  "metadata": {
    "competitor_price": 15000,
    "our_price": 18000,
    "key_missing_features": ["talabat_integration", "lower_price"]
  }
}
```

- **Permissions** : opportunities.update (commercial owner ou manager)
- **Réponse 200** (si < 10k€, perte immédiate) :

```json
{
  "id": "uuid",
  "company_name": "ABC Logistics",
  "status": "lost",
  "lost_date": "2025-11-08T16:30:00Z",
  "loss_reason": {
    "id": "uuid",
    "reason_name": "Concurrent choisi",
    "category": "competition"
  },
  "competitor": {
    "id": "uuid",
    "name": "Motive"
  },
  "expected_value": 18000,
  "lost_by": {
    "id": "uuid",
    "first_name": "Karim",
    "last_name": "Al-Rashid"
  }
}
```

- **Réponse 202** (si > 10k€, en attente approbation) :

```json
{
  "id": "uuid",
  "status": "pending_loss_approval",
  "message": "Loss approval required by manager for opportunities > 10k€",
  "approval_required_from": {
    "id": "uuid-manager",
    "name": "Sarah Johnson"
  }
}
```

- **Erreurs** :
  - 400 : Validation échouée (loss_notes trop courtes, competitor manquant)
  - 404 : Opportunity non trouvée
  - 422 : Opportunity déjà closed (won ou lost)
  - 422 : Loss reason inactive ou n'existe pas

**Fichier à créer : `app/api/v1/crm/opportunities/[id]/approve-loss/route.ts`**

**POST /api/v1/crm/opportunities/[id]/approve-loss**

- **Description** : Approuver ou rejeter une perte (manager uniquement)
- **Body** :

```json
{
  "approved": true,
  "comment": "Perte justifiée, concurrent trop agressif sur pricing"
}
```

OU

```json
{
  "approved": false,
  "rejection_reason": "Je pense qu'on peut encore sauver ce deal. Propose un discount 15% et rappelle demain."
}
```

- **Permissions** : opportunities.approve_loss (manager ou director)
- **Réponse 200** : Opportunity avec status final (lost ou open)
- **Erreurs** :
  - 403 : Permission insuffisante (pas manager)
  - 404 : Opportunity non trouvée
  - 422 : Opportunity pas en status pending_loss_approval

**Fichier à créer : `app/api/v1/crm/opportunities/[id]/reopen/route.ts`**

**POST /api/v1/crm/opportunities/[id]/reopen**

- **Description** : Réouvrir une opportunity perdue (client revient)
- **Body** :

```json
{
  "reason": "Client a testé Motive pendant 2 semaines et n'est pas satisfait de l'interface. Veut revenir vers nous. Prêt à signer cette semaine.",
  "notes": "Opportunité de closer rapidement, j'ai rdv démo demain 10h"
}
```

- **Permissions** : opportunities.reopen (commercial owner ou manager)
- **Réponse 200** : Opportunity réouverte
- **Erreurs** :
  - 422 : Lost > 90 days ago (cannot reopen)
  - 404 : Opportunity non trouvée
  - 422 : Opportunity pas en status lost

**Fichier à créer : `app/api/v1/crm/opportunities/loss-analysis/route.ts`**

**GET /api/v1/crm/opportunities/loss-analysis**

- **Description** : Analyse agrégée des raisons de perte (dashboard management)
- **Query params** :
  - from_date : Date début analyse (défaut : -3 mois)
  - to_date : Date fin analyse (défaut : aujourd'hui)
  - owner_id : Filtrer par commercial (optionnel)
  - pipeline_id : Filtrer par pipeline (optionnel)
- **Permissions** : opportunities.analytics (manager ou director)
- **Réponse 200** :

```json
{
  "period": {
    "from": "2025-08-01",
    "to": "2025-11-08"
  },
  "summary": {
    "total_opportunities_lost": 35,
    "total_revenue_lost": 630000,
    "avg_deal_size_lost": 18000,
    "loss_rate": 70
  },
  "by_reason": [
    {
      "loss_reason": {
        "id": "uuid",
        "reason_name": "Prix trop élevé",
        "category": "price"
      },
      "count": 12,
      "revenue_lost": 216000,
      "percentage": 34.3,
      "avg_deal_size": 18000
    },
    {
      "loss_reason": {
        "id": "uuid",
        "reason_name": "Features manquantes",
        "category": "product"
      },
      "count": 8,
      "revenue_lost": 144000,
      "percentage": 22.9,
      "avg_deal_size": 18000
    }
  ],
  "by_category": [
    { "category": "price", "count": 12, "percentage": 34.3 },
    { "category": "product", "count": 8, "percentage": 22.9 },
    { "category": "competition", "count": 6, "percentage": 17.1 },
    { "category": "timing", "count": 5, "percentage": 14.3 },
    { "category": "budget", "count": 4, "percentage": 11.4 }
  ],
  "by_competitor": [
    {
      "competitor": {
        "id": "uuid",
        "name": "Motive"
      },
      "times_won": 8,
      "revenue_lost": 144000,
      "avg_deal_size": 18000
    },
    {
      "competitor": {
        "id": "uuid",
        "name": "Samsara"
      },
      "times_won": 5,
      "revenue_lost": 125000,
      "avg_deal_size": 25000
    }
  ],
  "trends": {
    "by_month": [
      { "month": "2025-08", "count": 10, "revenue_lost": 180000 },
      { "month": "2025-09", "count": 12, "revenue_lost": 216000 },
      { "month": "2025-10", "count": 13, "revenue_lost": 234000 }
    ]
  },
  "alerts": [
    {
      "type": "critical",
      "title": "Prix trop élevé > 30%",
      "message": "34% des opportunités perdues pour raison prix. Considérer ajustement pricing.",
      "action": "schedule_pricing_review"
    },
    {
      "type": "warning",
      "title": "Concurrent Motive gagne 8 deals",
      "message": "Motive a gagné 8 opportunités en 3 mois. Étude compétitive recommandée.",
      "action": "competitive_analysis"
    }
  ],
  "recommendations": [
    {
      "priority": "high",
      "title": "Créer offre entry-level",
      "description": "12 opportunités perdues pour prix. Offre Starter à -30% pourrait récupérer 8 deals.",
      "potential_revenue": 144000
    },
    {
      "priority": "high",
      "title": "Intégration Talabat urgente",
      "description": "8 opportunités perdues pour features manquantes (Talabat mentionné 6 fois).",
      "potential_revenue": 108000
    }
  ],
  "missing_features": [
    {
      "feature": "Intégration Talabat",
      "occurrences": 6,
      "revenue_impact": 108000
    },
    { "feature": "App mobile iOS", "occurrences": 4, "revenue_impact": 72000 },
    {
      "feature": "Facturation automatique",
      "occurrences": 3,
      "revenue_impact": 54000
    }
  ]
}
```

**Fichier à créer : `app/api/v1/crm/loss-reasons/route.ts`**

**GET /api/v1/crm/loss-reasons**

- **Description** : Liste toutes les raisons de perte actives
- **Query params** :
  - category : Filtrer par catégorie (optionnel)
- **Permissions** : opportunities.read
- **Réponse 200** :

```json
{
  "loss_reasons": [
    {
      "id": "uuid",
      "reason_code": "PRICE_TOO_HIGH",
      "reason_name": "Prix trop élevé",
      "category": "price",
      "description": "Le prospect trouve notre tarification trop élevée par rapport à son budget ou aux concurrents",
      "require_notes": true,
      "require_competitor": false,
      "display_order": 1
    },
    {
      "id": "uuid",
      "reason_code": "COMPETITOR_CHOSEN",
      "reason_name": "Concurrent choisi",
      "category": "competition",
      "description": "Le prospect a choisi une solution concurrente",
      "require_notes": true,
      "require_competitor": true,
      "display_order": 3
    }
  ]
}
```

#### Frontend (Interface Utilisateur)

**Modification fichier : `app/[locale]/crm/opportunities/page.tsx`**

Ajouter actions "Lose" sur les cartes opportunities.

**Actions sur OpportunityCard :**

- Icône ❌ "Mark as Lost" visible sur toutes les cartes status "open"
- Au clic, ouvre modal LoseOpportunityModal
- Badge rouge "Pending Approval" si status = "pending_loss_approval"

**Composant à créer : `components/crm/LoseOpportunityModal.tsx`**

Modal formulaire pour marquer une opportunity comme perdue avec validation stricte.

**Layout du modal :**

```
┌──────────────────────────────────────────────────────────┐
│ Mark Opportunity as Lost                        [X Close] │
├──────────────────────────────────────────────────────────┤
│                                                           │
│ You're about to mark "ABC Logistics" as lost             │
│ Expected value: €18,000                                   │
│                                                           │
│ ⚠️ This will remove the opportunity from your pipeline   │
│                                                           │
│ Loss Reason * (required)                                  │
│ [Dropdown ▼]                                             │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Prix trop élevé                                     │ │
│ │ Features manquantes                                 │ │
│ │ Concurrent choisi ⭐                                │ │
│ │ Timing - Pas prêt maintenant                        │ │
│ │ Budget annulé                                       │ │
│ │ Pas de réponse/ghosting                            │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                           │
│ [SI "Concurrent choisi" sélectionné]                     │
│ Which competitor? * (required)                            │
│ [Dropdown ▼]                                             │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Motive                                              │ │
│ │ Samsara                                             │ │
│ │ Geotab                                              │ │
│ │ Solution interne                                    │ │
│ │ Autre (préciser dans notes)                        │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                           │
│ Details * (required, min 20 characters)                   │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Pourquoi ce concurrent a-t-il été préféré ?        │ │
│ │ - Prix proposé par concurrent ?                     │ │
│ │ - Features spécifiques ?                            │ │
│ │ - Relation existante ?                              │ │
│ │                                                     │ │
│ │                                     0/20 characters │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                           │
│ Additional context (optional)                             │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Competitor price: €15,000/year                      │ │
│ │ Key missing features: Talabat integration           │ │
│ │                                                     │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                           │
│ [Cancel]                          [Mark as Lost] ──────► │
└──────────────────────────────────────────────────────────┘
```

**Validation temps réel :**

- Loss reason non sélectionnée → Bouton "Mark as Lost" désactivé
- Details < 20 caractères → Message d'erreur sous textarea + bouton désactivé
- Competitor requis mais non sélectionné → Message d'erreur + bouton désactivé
- Tous champs OK → Bouton "Mark as Lost" activé (couleur rouge)

**Comportement dynamique :**

- Quand loss_reason change, vérifier require_competitor et require_notes
- Si require_competitor = true, afficher dropdown concurrent
- Placeholder textarea change selon raison :
  - Prix → "Quel était leur budget ? Quel prix concurrent ?"
  - Features → "Quelles features précises manquaient ?"
  - Concurrent → "Pourquoi ce concurrent a-t-il été préféré ?"

**Soumission :**

1. Valider tous les champs
2. POST /api/v1/crm/opportunities/[id]/lose
3. Afficher loader pendant appel
4. **SI réponse 200** (perte immédiate) :
   - Fermer modal
   - Toast rouge "Opportunity marked as lost"
   - Carte disparaît du pipeline (animation fade out)
   - Compteurs pipeline mis à jour
5. **SI réponse 202** (pending approval) :
   - Fermer modal
   - Toast orange "Loss approval required by manager"
   - Carte reste visible mais badge "Pending Approval"
   - Notification manager envoyée

**Composant à créer : `components/crm/LossApprovalModal.tsx`**

Modal pour manager pour approuver/rejeter une perte (uniquement visible pour managers).

**Layout du modal :**

```
┌──────────────────────────────────────────────────────────┐
│ Loss Approval Request                           [X Close] │
├──────────────────────────────────────────────────────────┤
│                                                           │
│ Karim Al-Rashid requests to mark "ABC Logistics" as lost│
│                                                           │
│ Opportunity Details:                                      │
│ - Expected Value: €18,000                                 │
│ - Stage: Proposal                                         │
│ - Owner: Karim Al-Rashid                                 │
│ - Created: 25 days ago                                    │
│                                                           │
│ Loss Information:                                         │
│ - Reason: Concurrent choisi (Motive)                     │
│ - Details: "Client a choisi Motive car intégration      │
│   Talabat native et prix 20% moins cher. Leur budget    │
│   était 15k€/an max, nous étions à 18k€."               │
│ - Competitor Price: €15,000/year                         │
│                                                           │
│ Your Decision:                                            │
│ [Tabs: Approve | Reject]                                 │
│                                                           │
│ [TAB APPROVE SELECTED]                                    │
│ Comment (optional):                                       │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Loss justified. Competitor too aggressive on price.  │ │
│ │ Consider creating entry-level offer.                 │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                           │
│ [TAB REJECT]                                              │
│ Rejection Reason * (required):                            │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ I think we can still save this deal. Propose a 15%  │ │
│ │ discount and call back tomorrow. Emphasize our      │ │
│ │ superior customer support vs Motive.                │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                           │
│ [Cancel]              [Approve Loss] [Reject & Reopen]   │
└──────────────────────────────────────────────────────────┘
```

**Comportement :**

- Modal s'ouvre automatiquement quand manager clique sur notification
- Ou accessible depuis badge "Pending Approval" sur carte opportunity
- Tabs "Approve" / "Reject" pour switcher décision
- Si Approve : Comment optionnel
- Si Reject : Rejection reason obligatoire (min 20 caractères)

**Soumission :**

1. POST /api/v1/crm/opportunities/[id]/approve-loss
2. Afficher loader
3. Si succès :
   - Fermer modal
   - Toast "Loss approval processed"
   - Notification commercial envoyée
   - Si approved : Carte disparaît du pipeline
   - Si rejected : Carte repasse en "open", badge disparaît

**Fichier à créer : `app/[locale]/crm/opportunities/loss-analysis/page.tsx`**

Page dashboard d'analyse des pertes (management uniquement).

**Layout de la page :**

```
┌──────────────────────────────────────────────────────────────┐
│ HEADER                                                        │
│ [FleetCore Logo] CRM > Loss Analysis         [Export CSV]    │
└──────────────────────────────────────────────────────────────┘
┌──────────────────────────────────────────────────────────────┐
│ FILTRES                                                       │
│ [Period: Last 3 months ▼] [Owner: All ▼] [Pipeline: All ▼]  │
└──────────────────────────────────────────────────────────────┘
┌──────────────────────────────────────────────────────────────┐
│ KEY METRICS                                                   │
│ ┌────────────┬────────────┬────────────┬────────────┐       │
│ │Total Lost  │Revenue Lost│Avg Deal    │Loss Rate   │       │
│ │    35      │  €630,000  │  €18,000   │    70%     │       │
│ └────────────┴────────────┴────────────┴────────────┘       │
└──────────────────────────────────────────────────────────────┘
┌──────────────────────────────────────────────────────────────┐
│ ALERTS                                                        │
│ ⚠️ CRITICAL: Prix trop élevé > 30% (34% des pertes)         │
│    → Action: Schedule pricing review                          │
│ ⚠️ WARNING: Motive wins 8 deals in 3 months                 │
│    → Action: Competitive analysis required                    │
└──────────────────────────────────────────────────────────────┘
┌───────────────────────────┬──────────────────────────────────┐
│ TOP LOSS REASONS          │ LOSS REASONS BY CATEGORY         │
│                           │                                  │
│ [Bar Chart]               │ [Pie Chart]                      │
│ Prix trop élevé    34%    │ Price       34%                  │
│ Features manq.     23%    │ Product     23%                  │
│ Concurrent         17%    │ Competition 17%                  │
│ Timing             14%    │ Timing      14%                  │
│ Budget             12%    │ Budget      12%                  │
└───────────────────────────┴──────────────────────────────────┘
┌───────────────────────────┬──────────────────────────────────┐
│ COMPETITORS ANALYSIS      │ TRENDS (6 MONTHS)                │
│                           │                                  │
│ Motive         8 wins     │ [Line Chart]                     │
│ €144k lost                │ Aug: 10 losses                   │
│                           │ Sep: 12 losses                   │
│ Samsara        5 wins     │ Oct: 13 losses (↑ trending up)   │
│ €125k lost                │                                  │
└───────────────────────────┴──────────────────────────────────┘
┌──────────────────────────────────────────────────────────────┐
│ RECOMMENDATIONS                                               │
│ 🎯 HIGH PRIORITY                                             │
│ 1. Create entry-level offer (Potential: €144k recovery)      │
│    12 opps lost for price. Starter plan at -30% could save 8│
│                                                               │
│ 2. Talabat integration URGENT (Potential: €108k recovery)    │
│    6 prospects specifically requested Talabat integration    │
│                                                               │
│ 🔍 MEDIUM PRIORITY                                           │
│ 3. Competitive analysis: Motive (Lost: €144k to them)       │
│    Understand why Motive wins 8 deals. Price? Features?     │
└──────────────────────────────────────────────────────────────┘
┌──────────────────────────────────────────────────────────────┐
│ MISSING FEATURES ANALYSIS                                     │
│ Feature                    | Occurrences | Revenue Impact    │
│ ---------------------------|-------------|-------------------│
│ Intégration Talabat       | 6           | €108,000          │
│ App mobile iOS            | 4           | €72,000           │
│ Facturation automatique   | 3           | €54,000           │
│ Dashboard temps réel      | 2           | €36,000           │
└──────────────────────────────────────────────────────────────┘
```

**Fonctionnalités :**

- **Filtres temps réel** : Changement période/owner/pipeline recharge toutes les stats
- **Graphiques interactifs** : Recharts avec tooltips détaillés
- **Alerts cliquables** : Clic sur alerte → Action (schedule meeting, create task)
- **Export CSV** : Télécharge rapport complet pour Excel
- **Drill-down** : Clic sur raison → Liste des opportunités perdues pour cette raison
- **Missing features cliquable** : Clic sur feature → Crée ticket roadmap produit

**Composant à créer : `components/crm/LossAnalysisDashboard.tsx`**

Composant principal qui fetch les données et orchestre l'affichage.

**Props :**

- filters : { period, owner_id, pipeline_id }

**Gestion state :**

- React Query pour fetch GET /opportunities/loss-analysis
- Refetch automatique quand filters changent
- Loading skeletons pendant fetch
- Error boundary si API échoue

**Composant à créer : `components/crm/LossReasonsChart.tsx`**

Graphique bar chart des top raisons de perte.

**Technologies :**

- Recharts BarChart
- Couleurs selon catégorie (rouge=price, orange=product, blue=competition, etc.)
- Tooltip détaillé : raison, nb opps, revenus perdus, %

**Composant à créer : `components/crm/CompetitorAnalysisTable.tsx`**

Tableau des concurrents avec stats.

**Colonnes :**

- Concurrent (nom + logo si disponible)
- Deals won
- Revenue lost
- Avg deal size
- Actions : "View details", "Schedule competitive analysis"

### 🎬 RÉSULTAT DÉMONTRABLE

**Scénario démo complet pour le sponsor :**

**1. Opportunity en cours, échec de closing**

- Naviguer vers /crm/opportunities
- Voir pipeline avec opportunity "ABC Logistics" dans colonne "Negotiation"
- Karim (commercial) vient d'apprendre que ABC a choisi Motive
- Cliquer icône ❌ sur carte ABC Logistics

**2. Modal perte s'ouvre**

- Modal "Mark Opportunity as Lost" s'affiche
- Voir warning : "Expected value: €18,000"
- Sélectionner "Concurrent choisi" dans dropdown
- Dropdown "Competitor" apparaît automatiquement
- Sélectionner "Motive"
- Textarea placeholder change : "Pourquoi ce concurrent a-t-il été préféré ?"
- Remplir details :

```
Client a choisi Motive car :
1. Prix: 15k€/an vs nos 18k€ (-17%)
2. Intégration Talabat native (nous on l'a pas)
3. Relation commerciale existante avec Motive sur autre pays

Decision maker était le CFO, focus sur le coût.
```

- Compteur : "143/20 characters" (valide)
- Remplir additional context :

```
Competitor price: 15000
Missing features: talabat_integration
```

**3. Soumission avec approbation manager requise**

- Cliquer "Mark as Lost"
- Loader s'affiche
- API retourne 202 (pending approval car > 10k€)
- Modal se ferme
- Toast orange : "Loss approval required by manager Sarah Johnson"
- Carte ABC reste visible mais badge "⏳ Pending Approval"
- Notification envoyée à Sarah (manager)

**4. Manager reçoit notification**

- Sarah (manager) se connecte
- Notification : "Karim requests loss approval for ABC Logistics (€18k)"
- Cliquer notification → Modal LossApprovalModal s'ouvre
- Voir détails complets :
  - Opportunity details
  - Loss reason: Concurrent (Motive)
  - Details de Karim affichés
  - Competitor price comparaison

**5. Manager approuve la perte**

- Sarah lit les détails
- Tab "Approve" sélectionné
- Remplir comment :

```
Loss justified. Motive too aggressive on pricing.
Action items:
1. Create Starter plan at -30% (15k€ target)
2. Prioritize Talabat integration in Q1 roadmap
```

- Cliquer "Approve Loss"
- API appelle POST /approve-loss avec approved=true
- Toast vert "Loss approved"
- Notification envoyée à Karim
- Carte ABC disparaît du pipeline avec animation fade out
- Compteurs pipeline mis à jour :
  - Negotiation : 4 opps (était 5)
  - Forecast value : -€5,400 (18k × 30% probability)

**6. Analyse des pertes accessible**

- Sarah navigue vers /crm/opportunities/loss-analysis
- Dashboard s'affiche avec toutes les stats
- Voir alerte critique : "⚠️ Prix trop élevé > 30% (34% des pertes)"
- Voir dans "Competitors Analysis" : Motive 8 wins, €144k lost
- Voir dans "Missing Features" : Talabat integration (6 occurrences, €108k impact)

**7. Actions stratégiques déclenchées**

- Sarah clique sur alerte "Prix trop élevé"
- Modal "Schedule Action" s'ouvre
- Proposition : "Create pricing review meeting"
- Participants suggérés : CEO, CFO, Sales Director
- Date suggérée : Dans 3 jours
- Sarah confirme → Meeting créé dans calendrier

**8. Réouverture d'une opportunity perdue**

- 2 semaines plus tard, Ahmed (ABC) rappelle Karim
- "On a testé Motive, interface trop compliquée, on veut revenir"
- Karim va sur /crm/opportunities, filtre "Lost"
- Trouve carte ABC Logistics
- Cliquer bouton "↻ Reopen"
- Modal s'ouvre : "Why reopening?"
- Remplir :

```
Client unhappy with Motive after 2 weeks trial.
Main complaint: Complex interface, poor UX.
Ready to sign with us this week if we match price at 15k€.
```

- Cliquer "Reopen Opportunity"
- Carte ABC réapparaît dans pipeline (stage "Negotiation")
- Notification manager : "ABC Logistics reopened by Karim"
- Karim peut maintenant closer le deal

**Critères d'acceptation :**

- ✅ Commercial peut marquer opportunity comme lost avec raison obligatoire
- ✅ Notes détaillées obligatoires (min 20 caractères)
- ✅ Competitor obligatoire si raison = "Concurrent choisi"
- ✅ Opportunities > 10k€ nécessitent approbation manager
- ✅ Manager peut approuver ou rejeter avec commentaire
- ✅ Si rejeté, opportunity repasse en "open" avec tâche pour commercial
- ✅ Dashboard loss analysis affiche top raisons avec graphiques
- ✅ Alerts automatiques si raison > 30% ou concurrent gagne > 5 deals
- ✅ Missing features extraites et affichées avec revenue impact
- ✅ Recommendations générées automatiquement selon patterns
- ✅ Opportunity perdue réouvrable sous 90 jours
- ✅ Audit logs créés pour toute action (lost, approved, reopened)
- ✅ Notifications envoyées aux bons stakeholders

### ⏱️ ESTIMATION

- Temps backend : **12 heures**
  - markAsLost() avec validation : 3h
  - approveLoss() workflow : 2h
  - reopenLostOpportunity() : 2h
  - analyzeLossReasons() avec queries complexes : 3h
  - extractMissingFeatures() NLP basique : 2h

- Temps API : **6 heures**
  - POST /lose : 2h
  - POST /approve-loss : 1h
  - POST /reopen : 1h
  - GET /loss-analysis : 2h

- Temps frontend : **14 heures**
  - LoseOpportunityModal avec validation : 4h
  - LossApprovalModal : 3h
  - Page loss-analysis dashboard : 5h
  - Charts (Recharts) : 2h

- **TOTAL : 32 heures (4 jours)**

### 🔗 DÉPENDANCES

**Prérequis obligatoires :**

- Sprint 2 Étape 2.1 et 2.2 terminées (gestion opportunities)
- Table crm_opportunity_loss_reasons peuplée avec données
- Table ref_competitors peuplée avec concurrents principaux

**Services/composants requis :**

- OpportunityService (déjà créé)
- NotificationService (pour notifications manager/commercial)

**Données de test nécessaires :**

- 10 raisons de perte actives dans crm_opportunity_loss_reasons
- 5 concurrents dans ref_competitors (Motive, Samsara, Geotab, etc.)
- Opportunities en cours pour tests
- Manager avec permission opportunities.approve_loss

### ✅ CHECKLIST DE VALIDATION

- [ ] **Backend** : markAsLost() valide raison et notes obligatoires
- [ ] **Backend** : Opportunities > 10k€ passent en pending_loss_approval
- [ ] **Backend** : approveLoss() gère approved=true et approved=false
- [ ] **Backend** : reopenLostOpportunity() vérifie fenêtre 90 jours
- [ ] **Backend** : analyzeLossReasons() retourne stats complètes
- [ ] **Backend** : extractMissingFeatures() parse loss_notes correctement
- [ ] **API** : POST /lose retourne 200 si < 10k, 202 si > 10k
- [ ] **API** : POST /approve-loss fonctionne (approve et reject)
- [ ] **API** : POST /reopen fonctionne avec validation reason
- [ ] **API** : GET /loss-analysis retourne JSON complet avec trends
- [ ] **Frontend** : LoseOpportunityModal valide loss_reason obligatoire
- [ ] **Frontend** : Modal affiche competitor dropdown si raison = concurrent
- [ ] **Frontend** : Validation temps réel notes min 20 caractères
- [ ] **Frontend** : LossApprovalModal affiche details complets
- [ ] **Frontend** : Manager peut approve/reject avec commentaire
- [ ] **Frontend** : Page loss-analysis affiche charts et alertes
- [ ] **Frontend** : Recommendations générées et affichées
- [ ] **Frontend** : Missing features table affichée avec revenue impact
- [ ] **Tests** : 20+ tests unitaires markAsLost avec toutes validations
- [ ] **Tests** : Test E2E complet : lose → pending → approve → lost
- [ ] **Tests** : Test E2E reopen opportunity fonctionne
- [ ] **Démo** : Sponsor peut marquer opportunity comme lost
- [ ] **Démo** : Manager reçoit notification et peut approuver
- [ ] **Démo** : Dashboard loss analysis affiche toutes stats
- [ ] **Démo** : Alerts critiques affichées correctement

---

## ÉTAPE 2.4 : Win Opportunity + Création Contrat Automatique

### 🎯 RATIONNEL MÉTIER

**POURQUOI :** Gagner une opportunity (closer un deal) est le moment le plus important du cycle commercial. C'est la conversion finale de mois de travail marketing et commercial en revenus récurrents. Le passage de "Opportunity Won" à "Contrat Signé" puis "Tenant Actif" doit être automatisé au maximum pour éviter :

- Délais entre signature et activation (temps de provisioning manuel)
- Erreurs de saisie contrat (montants, dates, durées incorrectes)
- Oublis d'activation client (client signé mais jamais onboardé)
- Perte de visibilité sur le pipeline post-signature

**QUEL PROBLÈME :** Actuellement, quand une opportunity est gagnée, rien n'est automatisé. Le commercial marque "won" mais ensuite tout est manuel :

- Un autre membre de l'équipe crée le contrat à la main (risque erreurs)
- Un autre crée le tenant dans le système (risque oubli)
- Un autre envoie l'invitation onboarding au client (risque délai)
- Résultat : Client signe mais attend 5+ jours avant d'accéder à la plateforme → mauvaise première impression

**IMPACT SI ABSENT :**

- **Expérience client** : Délai entre signature et accès = frustration client
- **Revenus** : Délais activation = report démarrage facturation
- **Opérationnel** : Création manuelle contrat/tenant = erreurs + temps perdu
- **Visibilité** : Impossible de tracker "Time from Won to Activated"
- **Churn** : Clients qui signent puis abandonnent car onboarding trop lent

**CAS D'USAGE CONCRET :**

**Avant automatisation (processus manuel) :**

- Jour 1 : Commercial Karim closer ABC Logistics, Ahmed signe contrat
- Karim marque opportunity "Won" dans CRM
- Karim envoie email équipe Ops : "ABC Logistics a signé, merci de créer le compte"
- Jour 3 : Équipe Ops voit email (retard car débordés)
- Jour 4 : Ops crée tenant manuellement dans admin, erreur sur plan (Starter au lieu de Premium)
- Jour 5 : Ops découvre erreur, corrige, envoie invitation Ahmed
- Jour 6 : Ahmed reçoit invitation, crée son compte
- **Total : 6 jours entre signature et accès** → Ahmed frustré, a appelé 2 fois support

**Après automatisation (workflow automatique) :**

- Jour 1 : Commercial Karim closer ABC Logistics à 14h30
- Karim clique "Mark as Won" dans CRM
- Modal s'ouvre : "Confirm Win Details"
- Karim confirme :
  - Won value : €18,000/year
  - Won date : Aujourd'hui
  - Plan : Premium
  - Contract start : 15 Nov 2025
  - Contract duration : 12 months
- Cliquer "Confirm Win"
- **Automatisation s'enclenche en 30 secondes :**
  1. Opportunity status = "won" (14h30:00)
  2. Contract créé automatiquement avec toutes les infos (14h30:05)
  3. Contract.status = "signed" (on suppose signature déjà faite)
  4. Tenant créé automatiquement dans adm_tenants (14h30:10)
  5. Tenant.status = "trial" (14 jours trial avant facturation)
  6. Invitation admin envoyée à Ahmed automatiquement (14h30:15)
  7. Email bienvenue envoyé à Ahmed avec lien onboarding (14h30:20)
  8. Notification Customer Success : "Nouveau client ABC à onboarder" (14h30:25)
  9. Tâche créée : "Onboarding call avec Ahmed - J+2" (14h30:30)
- Jour 1 : Ahmed reçoit email à 14h31 (1 minute après win)
- Ahmed clique lien, crée son compte Clerk, accède à FleetCore à 15h
- **Total : 30 minutes entre signature et accès** → Ahmed impressionné par rapidité

**Valeur business :**

- **Time to Activation** : 6 jours → 30 minutes (réduction 99%)
- **Satisfaction client** : NPS +20 points (clients adorent la rapidité)
- **Temps équipe Ops** : 2h/client → 5 min/client (automatisation)
- **Taux d'activation** : 85% → 98% (moins d'abandons)
- **Revenus** : Facturation démarre J+1 au lieu de J+6 = 5 jours gagnés × 30 clients/mois = 150 jours de revenus récupérés/mois

**ROI :**

- Coût développement : 4 jours dev = 3,200€
- Gain temps Ops : 1h45/client × 30 clients/mois × 12 mois × 40€/h = 25,200€/an
- Gain revenus (facturation plus tôt) : 5 jours × 30 clients × 18k€/365 jours = 7,400€/an
- **ROI total : (25,200 + 7,400) / 3,200 = 1,019% ROI**

### 📊 DONNÉES ET RÈGLES MÉTIER

**Tables impliquées :**

- **crm_opportunities** (status → won, won_date, won_value)
- **crm_contracts** (création automatique)
- **adm_tenants** (création automatique si pas déjà existant)
- **adm_invitations** (création invitation admin automatique)

**Colonnes critiques de crm_opportunities pour win :**

| Colonne                  | Type    | Obligatoire | Utilité Business                                                |
| ------------------------ | ------- | ----------- | --------------------------------------------------------------- |
| **status**               | enum    | OUI         | Passe de "open" à "won"                                         |
| **won_date**             | date    | OUI si won  | Date officielle du closing                                      |
| **won_value**            | numeric | OUI si won  | Valeur réelle du contrat signé                                  |
| **contract_id**          | uuid    | AUTO        | FK vers crm_contracts (créé auto)                               |
| **tenant_id**            | uuid    | AUTO        | FK vers adm_tenants (créé auto)                                 |
| **won_by**               | uuid    | AUTO        | Membre qui a marqué comme won                                   |
| **metadata.win_context** | jsonb   | NON         | Données additionnelles (discount accordé, conditions spéciales) |

**Règles métier strictes pour marquer une opportunity comme won :**

**Règle 1 : Won value obligatoire et doit être > 0**

```
SI commercial clique "Mark as Won"
ALORS
  - Modal avec champs :
    * Won date (défaut = aujourd'hui)
    * Won value (pré-rempli avec expected_value, modifiable)
    * Plan (Starter / Standard / Premium)
    * Contract start date (défaut = aujourd'hui)
    * Contract duration (défaut = 12 mois)
    * Discount accordé (%, optionnel)
  - Won value OBLIGATOIRE
  - Won value doit être >= 100€ (contrat minimum)
  - Si won_value < expected_value → Warning "Valeur inférieure à prévu, discount ?"
  - Si won_value > expected_value → Info "Excellente négociation !"
FIN SI
```

**Règle 2 : Validation manager si discount > 20%**

```
SI (expected_value - won_value) / expected_value > 0.20
ALORS
  - Commercial ne peut pas valider seul
  - Status passe temporairement à "pending_win_approval"
  - Notification manager : "Discount 25% sur ABC (€18k → €13.5k), valider ?"
  - Manager doit approuver ou rejeter
  - Si approuvé → Continue workflow automatique
  - Si rejeté → Opportunity reste "open", notification commercial "Discount refusé, renégocier"
FIN SI

POURQUOI : Éviter que commerciaux donnent discounts excessifs pour closer rapidement
```

**Règle 3 : Création automatique contrat**

```
QUAND opportunity.status = "won"
ALORS
  - Créer ligne dans crm_contracts :
    * contract_reference : Auto-généré "CTR-2025-00123"
    * opportunity_id : ID de l'opportunity
    * lead_id : ID du lead d'origine (traçabilité complète)
    * company_name : opportunity.company_name
    * start_date : Sélectionné dans modal win
    * end_date : start_date + duration (12 mois par défaut)
    * total_value : won_value
    * currency : Selon country_code
    * billing_cycle : "monthly" par défaut
    * plan_id : Plan sélectionné dans modal
    * status : "signed" (on assume que signature déjà faite si won)
    * auto_renew : true par défaut
    * renewal_date : end_date (sera évalué 60 jours avant)
  - Renseigner opportunity.contract_id
  - Créer lifecycle event "contract_created_from_opportunity"
FIN SI
```

**Règle 4 : Création automatique tenant SI pas déjà existant**

```
APRÈS création contract
ALORS
  - Vérifier si tenant existe déjà pour cette company
  - SI tenant_id NULL dans opportunity (nouveau client) :
    * Créer tenant dans adm_tenants :
      - name : contract.company_name
      - slug : Généré depuis name (abc-logistics)
      - country_code : opportunity.country_code
      - status : "trial" (14 jours trial avant facturation)
      - trial_ends_at : today + 14 jours
      - subscription_tier : Plan du contrat (starter/standard/premium)
      - primary_contact_email : lead.email (du lead d'origine)
      - primary_contact_phone : lead.phone
      - contract_id : ID du contrat
    * Créer tenant settings par défaut (currency, timezone, etc.)
    * Créer lifecycle event "tenant_created_from_contract"
    * Renseigner opportunity.tenant_id ET contract.tenant_id
  - SI tenant_id existe déjà (client existant qui renouvelle) :
    * Utiliser tenant existant
    * Créer nouveau contrat mais pas nouveau tenant
FIN SI
```

**Règle 5 : Création automatique invitation admin**

```
APRÈS création tenant
ALORS
  - Créer invitation dans adm_invitations :
    * tenant_id : ID du tenant créé
    * email : lead.email (contact principal du lead)
    * role : "admin" (premier utilisateur = admin)
    * invitation_type : "initial_admin"
    * expires_at : today + 7 jours
    * token : UUID unique cryptographique
    * sent_at : Maintenant
  - Envoyer email invitation avec :
    * Lien : https://fleetcore.com/accept-invitation?token={token}
    * Sujet : "Bienvenue sur FleetCore - Accédez à votre compte"
    * Body : "Bonjour {first_name}, votre compte FleetCore est prêt..."
  - Créer lifecycle event "invitation_sent"
FIN SI
```

**Règle 6 : Notifications et tâches post-win**

```
APRÈS toute la séquence d'automatisation
ALORS
  - Notification Customer Success :
    * "Nouveau client ABC Logistics à onboarder"
    * "Contract value: €18,000/year"
    * "Plan: Premium"
    * "Contact: Ahmed (ahmed@abclogistics.ae)"
  - Créer tâche CRM :
    * Titre : "Onboarding call avec Ahmed Al-Mansoori"
    * Assigné à : Customer Success Manager
    * Due date : today + 2 jours
    * Priority : High
  - Notification Manager commercial :
    * "Opportunité ABC Logistics won par Karim - €18,000"
    * Mise à jour stats manager (forecast réalisé)
  - Email félicitations commercial :
    * "Bravo Karim ! Deal ABC Logistics closé avec succès"
    * "Prochaines étapes : Client recevra invitation sous 1 minute"
  - Webhook analytics/BI :
    * Envoyer event "opportunity_won" vers data warehouse
    * Données : won_value, source, campaign, duration_sales_cycle
FIN SI
```

**Règle 7 : Calcul métriques temps réel**

```
QUAND opportunity.status = "won"
ALORS
  - Calculer métriques :
    * Sales cycle duration : (won_date - created_at) en jours
    * Lead to won duration : (won_date - lead.created_at) en jours
    * Conversion rate : Won opportunities / Total opportunities
    * Win rate by source : Groupe par utm_source, calcule %
  - Mettre à jour dashboard temps réel :
    * Pipeline forecast value : -expected_value (retiré du forecast)
    * Won opportunities count : +1
    * Total won value (month) : +won_value
  - Mettre à jour stats commercial :
    * Karim.deals_won_count : +1
    * Karim.total_revenue_won_month : +won_value
    * Karim.win_rate : Recalculé
FIN SI
```

**Règles de validation et cohérence :**

**Validation 1 : Won value doit être cohérent**

```
SI won_value < (expected_value * 0.5)
ALORS
  - Warning critique : "Won value 50%+ inférieur à expected value"
  - Demander confirmation : "Êtes-vous sûr ? Cela semble anormal"
  - Obliger justification dans notes
FIN SI
```

**Validation 2 : Contract dates cohérentes**

```
SI contract_start_date < today - 30 jours
ALORS
  - Error : "Contract start date cannot be more than 30 days in the past"
FIN SI

SI contract_start_date > today + 90 jours
ALORS
  - Warning : "Contract starts in 90+ days, is this correct?"
FIN SI

SI contract_duration < 1 mois OU contract_duration > 36 mois
ALORS
  - Warning : "Unusual contract duration, please confirm"
FIN SI
```

**Validation 3 : Plan sélectionné cohérent avec pricing**

```
SI plan = "Starter" ET won_value > 10000€
ALORS
  - Warning : "Plan Starter typically for < 10k€ deals. Consider Standard/Premium"
FIN SI

SI plan = "Premium" ET won_value < 5000€
ALORS
  - Warning : "Plan Premium typically for > 5k€ deals. Consider Starter/Standard"
FIN SI
```

### 🏗️ COMPOSANTS À DÉVELOPPER

#### Backend (Service Layer)

**Modification fichier : `lib/services/crm/opportunity.service.ts`**

Ajouter la méthode de gestion des wins avec workflow automatique complet.

**Méthode markAsWon(opportunityId: string, winData: OpportunityWinInput) → Promise<WinResult>**

Workflow complet d'orchestration de toutes les actions post-win.

**Étapes détaillées :**

1. **Validation initiale**
   - Valider winData avec OpportunityWinSchema
   - Récupérer opportunity complète avec lead et owner
   - Vérifier opportunity.status = "open"
   - Si déjà "won" ou "lost" → throw BusinessRuleError

2. **Validation business rules**
   - won_value doit être >= 100€
   - Si won_value < expected_value \* 0.5 → throw ValidationError "Too low"
   - Calculer discount_percent = (expected_value - won_value) / expected_value × 100

3. **Validation discount (si applicable)**
   - SI discount_percent > 20% :
     - Vérifier si member courant est manager (permission "opportunities.approve_discount")
     - SI pas manager :
       - Status = "pending_win_approval"
       - Créer notification manager avec détails discount
       - Retourner { status: "pending_approval", message: "Discount approval required" }
       - STOP (ne pas continuer workflow)
     - SI manager :
       - Continue workflow (manager peut approuver direct)

4. **Marquer opportunity comme won**
   - Mettre à jour opportunity :
     - status = "won"
     - won_date = winData.won_date
     - won_value = winData.won_value
     - won_by = member_id courant
     - metadata.discount_percent = discount_percent
     - metadata.win_context = winData.context
   - Créer audit log "opportunity_won"

5. **Créer contract automatiquement**
   - Appeler contractService.createFromOpportunity(opportunity, winData)
   - Contract créé avec :
     - opportunity_id, lead_id (traçabilité)
     - company_name, contact_email, contact_phone
     - start_date, end_date (calculé depuis duration)
     - total_value = won_value
     - plan_id = winData.plan_id
     - status = "signed"
     - auto_renew = true
   - Renseigner opportunity.contract_id
   - Créer lifecycle event "contract_created_from_opportunity"

6. **Créer ou récupérer tenant**
   - SI opportunity.tenant_id IS NULL (nouveau client) :
     - Appeler tenantService.createFromContract(contract, lead)
     - Tenant créé avec :
       - name, slug (généré depuis company_name)
       - country_code, default_currency, timezone
       - status = "trial"
       - trial_ends_at = today + 14 jours
       - subscription_tier = plan du contrat
       - primary_contact_email/phone depuis lead
       - contract_id
     - Créer tenant_settings par défaut
     - Créer lifecycle event "tenant_created_from_contract"
     - Renseigner opportunity.tenant_id ET contract.tenant_id
   - SINON (client existant) :
     - Utiliser tenant_id existant
     - Logger "contract_added_to_existing_tenant"

7. **Créer invitation admin automatique**
   - Appeler invitationService.createInitialAdmin(tenant, lead)
   - Invitation créée avec :
     - tenant_id
     - email = lead.email
     - role = "admin"
     - invitation_type = "initial_admin"
     - expires_at = today + 7 jours
     - token = UUID unique
   - Email envoyé automatiquement avec lien onboarding
   - Créer lifecycle event "initial_admin_invitation_sent"

8. **Notifications et tâches**
   - Notification Customer Success :
     - "🎉 Nouveau client {company_name} à onboarder"
     - "Contract: €{won_value}/year - Plan: {plan}"
     - "Contact: {first_name} {last_name} ({email})"
   - Créer tâche CRM :
     - "Onboarding call avec {first_name} {last_name}"
     - Assigné à : Customer Success Manager
     - Due date : today + 2 jours
     - Priority : High
   - Notification manager commercial :
     - "Deal won par {owner_name} - {company_name} (€{won_value})"
   - Email félicitations commercial :
     - "Bravo {owner_name} ! Deal {company_name} closé 🎉"
   - Webhook analytics si configuré

9. **Métriques temps réel**
   - Calculer sales_cycle_duration = (won_date - opportunity.created_at) jours
   - Calculer lead_to_won_duration = (won_date - lead.created_at) jours
   - Mettre à jour dashboard :
     - Pipeline forecast : -expected_value
     - Won count : +1
     - Total won value month : +won_value
   - Mettre à jour stats owner :
     - deals_won_count : +1
     - total_revenue_won_month : +won_value
     - win_rate : Recalculé

10. **Retourner résultat complet**
    - Retourner objet WinResult avec :
      - opportunity (updated)
      - contract (created)
      - tenant (created or existing)
      - invitation (created)
      - metrics (sales_cycle_duration, etc.)
      - next_steps (list of actions taken)

**Méthode approveWin(opportunityId: string, approval: WinApprovalInput) → Promise<WinResult>**

Gestion approbation manager pour wins avec discount élevé.

**Étapes :**

1. Récupérer opportunity avec status "pending_win_approval"
2. Vérifier membre courant est manager
3. **SI approved = true** :
   - Appeler markAsWon() avec les données originales du win
   - Tout le workflow automatique s'enclenche
   - Notification commercial : "Discount approuvé, deal finalisé"
4. **SI approved = false** :
   - Status = "open" (repasse en négociation)
   - Créer audit log "win_rejected_by_manager"
   - Notification commercial : "Discount refusé. Raison : {rejection_reason}"
   - Créer tâche commercial : "Renégocier {company_name} sans discount"
5. Retourner résultat

**Fichier à créer : `lib/services/crm/contract.service.ts`**

Service pour gérer les contrats.

**Méthode createFromOpportunity(opportunity, winData) → Promise<Contract>**

Création d'un contrat depuis une opportunity won.

**Étapes :**

1. Générer contract_reference unique : "CTR-2025-00123"
2. Calculer end_date = start_date + duration
3. Calculer renewal_date = end_date
4. Créer contract dans DB avec toutes les infos
5. Créer lifecycle event "contract_created"
6. Retourner contract

**Méthode findAll(filters) → Promise<Contract[]>**

Liste tous les contrats avec filtres.

**Méthode findById(id) → Promise<Contract>**

Détails d'un contrat.

**Fichier existant : `lib/services/admin/tenant.service.ts` (compléter)**

Ajouter méthode de création depuis contrat.

**Méthode createFromContract(contract, lead) → Promise<Tenant>**

Création d'un tenant depuis un contrat signé.

**Étapes :**

1. Générer slug unique depuis company_name
   - "ABC Logistics" → "abc-logistics"
   - Si existe déjà, ajouter suffix : "abc-logistics-2"
2. Déterminer default_currency selon country_code :
   - AE/SA/QA → AED
   - FR → EUR
   - Autres → USD
3. Déterminer timezone selon country_code :
   - AE → "Asia/Dubai"
   - FR → "Europe/Paris"
   - SA → "Asia/Riyadh"
4. Créer tenant dans DB
5. Créer tenant_settings par défaut
6. Créer lifecycle event "tenant_created"
7. Retourner tenant

**Fichier existant : `lib/services/admin/invitation.service.ts` (compléter)**

Ajouter méthode création invitation admin initiale.

**Méthode createInitialAdmin(tenant, lead) → Promise<Invitation>**

Création invitation pour premier admin du tenant.

**Étapes :**

1. Générer token unique (UUID)
2. Créer invitation dans DB
3. Envoyer email via service email (Resend)
4. Créer lifecycle event "invitation_sent"
5. Retourner invitation

#### API REST (Endpoints)

**Fichier à créer : `app/api/v1/crm/opportunities/[id]/win/route.ts`**

**POST /api/v1/crm/opportunities/[id]/win**

- **Description** : Marquer une opportunity comme won et déclencher workflow automatique
- **Body** :

```json
{
  "won_date": "2025-11-08",
  "won_value": 18000,
  "plan_id": "uuid-premium-plan",
  "contract_start_date": "2025-11-15",
  "contract_duration_months": 12,
  "discount_percent": 10,
  "notes": "Client accepté après démo technique. Discount 10% accordé pour closing rapide.",
  "context": {
    "decision_makers": ["Ahmed Al-Mansoori (CFO)", "Sara (CTO)"],
    "key_success_factors": [
      "ROI démontré",
      "Support 24/7",
      "Talabat integration promise"
    ],
    "special_terms": "Net 30 payment terms instead of net 15"
  }
}
```

- **Permissions** : opportunities.win (commercial owner ou manager)
- **Réponse 200** (si discount < 20%, win immédiat) :

```json
{
  "success": true,
  "message": "Opportunity won successfully. Automated workflow completed.",
  "opportunity": {
    "id": "uuid",
    "status": "won",
    "won_date": "2025-11-08",
    "won_value": 18000,
    "won_by": {
      "id": "uuid",
      "name": "Karim Al-Rashid"
    }
  },
  "contract": {
    "id": "uuid",
    "contract_reference": "CTR-2025-00123",
    "start_date": "2025-11-15",
    "end_date": "2026-11-15",
    "total_value": 18000,
    "status": "signed"
  },
  "tenant": {
    "id": "uuid",
    "name": "ABC Logistics",
    "slug": "abc-logistics",
    "status": "trial",
    "trial_ends_at": "2025-11-22"
  },
  "invitation": {
    "id": "uuid",
    "email": "ahmed@abclogistics.ae",
    "expires_at": "2025-11-15",
    "invitation_url": "https://fleetcore.com/accept-invitation?token=abc123"
  },
  "metrics": {
    "sales_cycle_duration_days": 25,
    "lead_to_won_duration_days": 33
  },
  "next_steps": [
    "Contract created (CTR-2025-00123)",
    "Tenant provisioned (abc-logistics)",
    "Admin invitation sent to ahmed@abclogistics.ae",
    "Customer Success notified for onboarding",
    "Onboarding task created (due in 2 days)"
  ]
}
```

- **Réponse 202** (si discount > 20%, en attente approbation) :

```json
{
  "success": false,
  "status": "pending_approval",
  "message": "Win approval required by manager for discounts > 20%",
  "discount_percent": 25,
  "expected_value": 18000,
  "won_value": 13500,
  "discount_amount": 4500,
  "approval_required_from": {
    "id": "uuid-manager",
    "name": "Sarah Johnson"
  }
}
```

- **Erreurs** :
  - 400 : Validation échouée (won_value < 100, dates incohérentes)
  - 404 : Opportunity non trouvée
  - 422 : Opportunity déjà closed (won ou lost)
  - 422 : Won value too low (< 50% expected_value)

**Fichier à créer : `app/api/v1/crm/opportunities/[id]/approve-win/route.ts`**

**POST /api/v1/crm/opportunities/[id]/approve-win**

- **Description** : Approuver ou rejeter un win avec discount élevé (manager uniquement)
- **Body** :

```json
{
  "approved": true,
  "comment": "Discount justified. Competitor was at 13k€. Good deal to close quickly."
}
```

OU

```json
{
  "approved": false,
  "rejection_reason": "Discount too high. We can afford 15% max (15,300€). Renegotiate with client."
}
```

- **Permissions** : opportunities.approve_win (manager ou director)
- **Réponse 200** (si approved=true) : Même structure que POST /win avec workflow complet
- **Réponse 200** (si approved=false) :

```json
{
  "success": false,
  "message": "Win rejected by manager",
  "opportunity": {
    "id": "uuid",
    "status": "open",
    "stage": "negotiation"
  },
  "rejection_reason": "Discount too high. We can afford 15% max (15,300€). Renegotiate with client.",
  "task_created": {
    "title": "Renegotiate ABC Logistics (max discount 15%)",
    "assigned_to": "uuid-karim",
    "due_date": "2025-11-10"
  }
}
```

**Fichier à créer : `app/api/v1/crm/contracts/route.ts`**

**GET /api/v1/crm/contracts**

- **Description** : Liste tous les contrats du tenant
- **Query params** :
  - status : filter (signed, active, expired, terminated)
  - plan_id : filter par plan
  - from_date, to_date : filter par start_date
  - limit, offset : pagination
- **Permissions** : contracts.read
- **Réponse 200** :

```json
{
  "contracts": [
    {
      "id": "uuid",
      "contract_reference": "CTR-2025-00123",
      "company_name": "ABC Logistics",
      "start_date": "2025-11-15",
      "end_date": "2026-11-15",
      "total_value": 18000,
      "status": "signed",
      "plan": {
        "id": "uuid",
        "name": "Premium"
      },
      "tenant": {
        "id": "uuid",
        "name": "ABC Logistics",
        "status": "trial"
      }
    }
  ],
  "total": 15,
  "total_value": 270000
}
```

**POST /api/v1/crm/contracts**

- **Description** : Créer un contrat manuellement (sans opportunity)
- **Body** : ContractCreateInput
- **Permissions** : contracts.create (manager uniquement)
- **Réponse 201** : Contract créé

**Fichier à créer : `app/api/v1/crm/contracts/[id]/route.ts`**

**GET /api/v1/crm/contracts/[id]**

- **Description** : Détails complets d'un contrat
- **Permissions** : contracts.read
- **Réponse 200** : Contract avec opportunity, lead, tenant relations

#### Frontend (Interface Utilisateur)

**Modification fichier : `app/[locale]/crm/opportunities/page.tsx`**

Ajouter action "Win" sur les cartes opportunities.

**Actions sur OpportunityCard :**

- Icône ✅ "Mark as Won" visible sur toutes cartes status "open"
- Visible surtout dans colonne "Closing" (probability 90%)
- Au clic, ouvre modal WinOpportunityModal
- Badge vert "Pending Approval" si status = "pending_win_approval"

**Composant à créer : `components/crm/WinOpportunityModal.tsx`**

Modal formulaire pour marquer opportunity comme won et déclencher workflow.

**Layout du modal :**

```
┌──────────────────────────────────────────────────────────────┐
│ 🎉 Close the Deal                                  [X Close] │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│ You're about to mark "ABC Logistics" as WON!                │
│                                                               │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ OPPORTUNITY DETAILS                                     │ │
│ │ - Company: ABC Logistics                                │ │
│ │ - Expected Value: €18,000/year                         │ │
│ │ - Pipeline Stage: Closing (90% probability)            │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                               │
│ Won Date * (required)                                         │
│ [Date Picker: 08 Nov 2025] ──────────────────────────────► │
│                                                               │
│ Actual Won Value * (required)                                 │
│ [€ 18,000] ─────────────────────────────────────────────► │
│ ℹ️ Expected was €18,000 - No discount                       │
│                                                               │
│ Plan * (required)                                             │
│ [Dropdown ▼]                                                 │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ ⭐ Premium - €25/vehicle/month (Recommended)           │ │
│ │   Standard - €18.75/vehicle/month                       │ │
│ │   Starter - €12.50/vehicle/month                        │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                               │
│ Contract Start Date * (required)                              │
│ [Date Picker: 15 Nov 2025] (in 7 days) ─────────────────► │
│                                                               │
│ Contract Duration * (required)                                │
│ [Dropdown ▼: 12 months] ──────────────────────────────────► │
│ Options: 6 months, 12 months, 24 months, 36 months          │
│                                                               │
│ Contract End Date (auto-calculated)                           │
│ 📅 15 Nov 2026                                              │
│                                                               │
│ [Advanced Options ▼ collapsed]                               │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Discount (optional)                                     │ │
│ │ [10]% ⚠️ > 20% requires manager approval               │ │
│ │                                                         │ │
│ │ Special Terms (optional)                                │ │
│ │ ┌───────────────────────────────────────────────────┐ │ │
│ │ │ Net 30 payment terms                               │ │ │
│ │ │ Free onboarding included                           │ │ │
│ │ └───────────────────────────────────────────────────┘ │ │
│ │                                                         │ │
│ │ Notes (optional)                                        │ │
│ │ ┌───────────────────────────────────────────────────┐ │ │
│ │ │ Client accepted after technical demo.              │ │ │
│ │ │ Key decision makers: Ahmed (CFO), Sara (CTO)      │ │ │
│ │ └───────────────────────────────────────────────────┘ │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                               │
│ ✨ WHAT HAPPENS NEXT (automatic):                            │
│ ├─ ✅ Contract created (CTR-2025-XXXX)                      │
│ ├─ ✅ Tenant provisioned (abc-logistics)                    │
│ ├─ ✅ Admin invitation sent to ahmed@abclogistics.ae       │
│ ├─ ✅ Customer Success team notified                        │
│ └─ ✅ Onboarding task created                               │
│                                                               │
│ [Cancel]                            [🎉 Close Deal & Win] ──► │
└──────────────────────────────────────────────────────────────┘
```

**Comportement dynamique :**

**Calcul automatique discount :**

- Quand won_value change, calculer discount_percent automatiquement
- Afficher sous le champ won_value :
  - Si discount = 0% : "ℹ️ Expected was €18,000 - No discount"
  - Si discount 1-10% : "✅ €1,800 discount (10%) - Good deal"
  - Si discount 11-20% : "⚠️ €3,600 discount (20%) - High discount"
  - Si discount > 20% : "🚨 €4,500 discount (25%) - Manager approval required"

**Calcul automatique end_date :**

- Quand start_date ou duration change, calculer end_date automatiquement
- Afficher end_date calculé : "📅 15 Nov 2026"

**Validation temps réel :**

- Won value < 100€ → Erreur "Minimum contract value is €100"
- Won value < (expected_value × 0.5) → Warning "Value too low, please confirm"
- Discount > 20% → Warning banner "Manager approval will be required"
- Start date < today - 30 jours → Error "Start date cannot be more than 30 days in the past"
- Tous champs requis remplis → Bouton "Close Deal" activé

**Section "What Happens Next" :**

- Afficher preview des actions automatiques
- Inspire confiance au commercial
- Montre que tout sera automatisé

**Soumission :**

1. Valider tous les champs
2. POST /api/v1/crm/opportunities/[id]/win
3. Afficher loader avec message : "Creating contract, provisioning tenant..."
4. **SI réponse 200** (win immédiat) :
   - Fermer modal
   - Confetti animation 🎉
   - Toast vert avec son : "Deal won! Contract created, tenant provisioned, invitation sent!"
   - Carte disparaît du pipeline
   - Redirect vers page contrat : /crm/contracts/[id]
   - Afficher summary modal avec toutes les actions complétées :

```
┌──────────────────────────────────────────────┐
│ 🎉 DEAL WON SUCCESSFULLY!                   │
├──────────────────────────────────────────────┤
│ ABC Logistics - €18,000/year                 │
│                                              │
│ ✅ All automatic actions completed:         │
│ ✓ Contract created (CTR-2025-00123)        │
│ ✓ Tenant provisioned (abc-logistics)       │
│ ✓ Invitation sent to ahmed@abclogistics.ae │
│ ✓ Customer Success notified                 │
│ ✓ Onboarding task created                   │
│                                              │
│ Sales cycle: 25 days                        │
│ Lead to won: 33 days                        │
│                                              │
│ [View Contract] [View Tenant] [Close]       │
└──────────────────────────────────────────────┘
```

5. **SI réponse 202** (pending approval) :
   - Fermer modal
   - Toast orange : "Discount approval required by manager Sarah Johnson"
   - Carte reste visible mais badge "⏳ Pending Approval"
   - Notification manager envoyée

**Composant à créer : `components/crm/WinApprovalModal.tsx`**

Modal manager pour approuver/rejeter win avec discount élevé.

**Layout similaire à LossApprovalModal :**

```
┌──────────────────────────────────────────────────────────┐
│ Win Approval Request                            [X Close] │
├──────────────────────────────────────────────────────────┤
│ Karim Al-Rashid requests to close "ABC Logistics"       │
│                                                           │
│ Deal Details:                                             │
│ - Expected Value: €18,000                                 │
│ - Actual Won Value: €13,500                               │
│ - Discount: 25% (€4,500)                                  │
│ - Stage: Closing                                          │
│                                                           │
│ ⚠️ Discount exceeds 20% threshold                        │
│                                                           │
│ Commercial's Notes:                                       │
│ "Competitor Motive bid at €13k. We need to match to win" │
│                                                           │
│ Your Decision:                                            │
│ [Tabs: Approve | Reject]                                 │
│                                                           │
│ [Cancel]              [Approve Win] [Reject & Reopen]    │
└──────────────────────────────────────────────────────────┘
```

**Fichier à créer : `app/[locale]/crm/contracts/page.tsx`**

Page liste des contrats (nouveau module).

**Layout minimal (sera enrichi dans Sprint 3) :**

```
┌──────────────────────────────────────────────────────────┐
│ HEADER                                                    │
│ [FleetCore Logo] CRM > Contracts            [+ Contract] │
└──────────────────────────────────────────────────────────┘
┌──────────────────────────────────────────────────────────┐
│ FILTRES                                                   │
│ [Status ▼] [Plan ▼] [Date Range ▼]            [Search]  │
└──────────────────────────────────────────────────────────┘
┌──────────────────────────────────────────────────────────┐
│ TABLE CONTRACTS                                           │
│ Reference | Company | Value | Plan | Start | Status      │
│ ---------|---------|-------|------|-------|------------- │
│ CTR-2025-│ ABC Log.│ 18k€  │Prem. │15 Nov │ Signed       │
│ 00123    │         │       │      │ 2025  │              │
│ ---------|---------|-------|------|-------|------------- │
│ ...                                                       │
└──────────────────────────────────────────────────────────┘
```

### 🎬 RÉSULTAT DÉMONTRABLE

**Scénario démo complet pour le sponsor :**

**1. Opportunity prête à closer**

- Commercial Karim en rdv avec Ahmed (ABC Logistics)
- Ahmed dit : "OK, on signe, commençons le 15 novembre"
- Karim navigue vers /crm/opportunities
- Pipeline visible, carte "ABC Logistics" dans colonne "Closing"

**2. Marking opportunity as won**

- Karim clique icône ✅ sur carte ABC
- Modal "Close the Deal" s'ouvre
- Tous les champs pré-remplis intelligemment :
  - Won date : Aujourd'hui
  - Won value : €18,000 (expected_value)
  - Plan : Premium (recommended)
  - Start date : Aujourd'hui + 7 jours
  - Duration : 12 months
- Karim ajuste start date : 15 Nov 2025
- Won value reste 18k → Pas de discount
- Voir message : "ℹ️ No discount - Good deal!"
- Section "What Happens Next" affiche 5 actions automatiques
- Karim clique "🎉 Close Deal & Win"

**3. Workflow automatique s'enclenche**

- Loader s'affiche : "Creating contract, provisioning tenant..."
- API traite en 2-3 secondes :
  1. Opportunity marked as won ✓
  2. Contract created (CTR-2025-00123) ✓
  3. Tenant provisioned (abc-logistics) ✓
  4. Invitation sent to ahmed@abclogistics.ae ✓
  5. Customer Success notified ✓
  6. Onboarding task created ✓

**4. Success modal s'affiche**

- Confetti animation 🎉
- Modal "Deal Won Successfully"
- Liste toutes les actions complétées
- Metrics : Sales cycle 25 days, Lead to won 33 days
- Boutons : View Contract, View Tenant
- Toast vert avec son : "Deal won!"

**5. Vérification multiples systèmes**

**5a. Page contracts**

- Karim clique "View Contract"
- Redirect vers /crm/contracts/CTR-2025-00123
- Contrat visible avec tous les détails :
  - Reference : CTR-2025-00123
  - Company : ABC Logistics
  - Value : €18,000/year
  - Plan : Premium
  - Dates : 15 Nov 2025 → 15 Nov 2026
  - Status : Signed

**5b. Page tenants (admin)**

- Manager Sarah navigue /admin/tenants
- Voir nouveau tenant "ABC Logistics"
- Status : Trial (14 days)
- Trial ends : 22 Nov 2025
- Slug : abc-logistics
- Contact : ahmed@abclogistics.ae

**5c. Email Ahmed**

- Ahmed reçoit email à 14h31 (1 min après win)
- Subject : "Bienvenue sur FleetCore - Accédez à votre compte"
- Body : "Bonjour Ahmed, votre compte FleetCore est prêt..."
- Lien : https://fleetcore.com/accept-invitation?token=abc123
- Ahmed clique lien, crée son compte Clerk
- Ahmed accède à FleetCore à 14h35 (4 min après win)

**5d. Notification Customer Success**

- Customer Success Manager (Lisa) reçoit notification
- "🎉 Nouveau client ABC Logistics à onboarder"
- Details : €18k/year, Plan Premium, Contact Ahmed
- Tâche créée automatiquement : "Onboarding call avec Ahmed - Due in 2 days"
- Lisa peut cliquer pour voir tenant et préparer onboarding

**5e. Stats dashboard manager**

- Sarah (manager) voit dashboard mis à jour temps réel :
  - Pipeline forecast : -€5,400 (18k × 30% probability)
  - Deals won this month : 12 → 13
  - Total won value month : €198k → €216k
  - Karim's stats :
    - Deals won : 4 → 5
    - Revenue won month : €72k → €90k
    - Win rate : 28% → 32%

**6. Test avec discount élevé (approbation requise)**

- Autre commercial (Marie) closer "XYZ Transport"
- Expected value : €20,000
- XYZ negocie fort, Marie propose €14,000 (30% discount)
- Marie clique Win, remplit modal
- Won value : €14,000
- Voir warning : "🚨 30% discount - Manager approval required"
- Marie clique "Close Deal"
- API retourne 202 (pending approval)
- Toast orange : "Discount approval required by Sarah Johnson"
- Carte XYZ reste visible, badge "⏳ Pending Approval"
- Sarah reçoit notification immédiatement

**7. Manager approuve ou rejette**

- Sarah clique notification
- Modal WinApprovalModal s'ouvre
- Voir détails : Expected 20k, Actual 14k, Discount 30%
- Notes Marie : "Competitor at 13k, we need to match"
- Sarah décide : **APPROVE**
- Remplir comment : "Justified, competitor too aggressive"
- Cliquer "Approve Win"
- Tout le workflow automatique s'enclenche immédiatement
- XYZ tenant créé, contrat créé, invitation envoyée
- Marie notifiée : "Discount approuvé, deal finalisé"

**OU Sarah décide : REJECT**

- Tab "Reject"
- Remplir : "Max 20% discount. Renégocier à 16k€"
- Cliquer "Reject & Reopen"
- XYZ repasse en "open", stage "Negotiation"
- Tâche créée pour Marie : "Renégocier XYZ (max 16k€)"
- Marie notifiée : "Discount refusé, renégocier"

**Critères d'acceptation :**

- ✅ Commercial peut marquer opportunity comme won avec tous les détails
- ✅ Won value doit être >= 100€
- ✅ Discount > 20% nécessite approbation manager
- ✅ Contract créé automatiquement avec toutes les infos
- ✅ Tenant créé automatiquement si nouveau client
- ✅ Invitation admin envoyée automatiquement dans la minute
- ✅ Notifications envoyées (Customer Success, manager, commercial)
- ✅ Tâche onboarding créée automatiquement (due +2 jours)
- ✅ Metrics calculées (sales_cycle_duration, lead_to_won)
- ✅ Dashboard stats mises à jour temps réel
- ✅ Manager peut approuver/rejeter win avec discount élevé
- ✅ Client peut créer compte et accéder dans les minutes suivant win
- ✅ Audit logs créés pour toutes actions (won, contract_created, tenant_created)
- ✅ Traçabilité complète lead → opportunity → contract → tenant

### ⏱️ ESTIMATION

- Temps backend : **16 heures**
  - markAsWon() workflow complet : 6h
  - approveWin() : 2h
  - ContractService.createFromOpportunity() : 3h
  - TenantService.createFromContract() : 3h
  - InvitationService.createInitialAdmin() : 2h

- Temps API : **6 heures**
  - POST /win : 3h
  - POST /approve-win : 1h
  - GET /contracts : 1h
  - POST /contracts : 1h

- Temps frontend : **16 heures**
  - WinOpportunityModal avec toute validation : 6h
  - WinApprovalModal : 3h
  - Success modal avec confetti : 2h
  - Page contracts (liste basique) : 3h
  - Integration notifications : 2h

- **TOTAL : 38 heures (5 jours)**

### 🔗 DÉPENDANCES

**Prérequis obligatoires :**

- Sprint 2 Étape 2.1, 2.2, 2.3 terminées
- Table crm_contracts existante
- Table adm_tenants existante
- Table adm_invitations existante
- Billing plans créés (Starter, Standard, Premium)

**Services/composants requis :**

- OpportunityService (déjà créé)
- ContractService (nouveau)
- TenantService (existe, à compléter)
- InvitationService (existe, à compléter)
- EmailService (Resend) pour envoi invitation
- NotificationService pour toutes notifications

**Données de test nécessaires :**

- Opportunities en cours avec différents expected_value
- Billing plans (Starter/Standard/Premium) avec pricing
- Manager avec permission opportunities.approve_win
- Customer Success Manager pour recevoir notifications

### ✅ CHECKLIST DE VALIDATION

- [ ] **Backend** : markAsWon() exécute workflow complet (10 étapes)
- [ ] **Backend** : Contract créé automatiquement avec bonnes données
- [ ] **Backend** : Tenant créé automatiquement si nouveau client
- [ ] **Backend** : Slug généré correctement depuis company_name
- [ ] **Backend** : Invitation créée et email envoyé automatiquement
- [ ] **Backend** : Discount > 20% déclenche pending_win_approval
- [ ] **Backend** : approveWin() approved=true lance workflow
- [ ] **Backend** : approveWin() approved=false repasse opportunity en open
- [ ] **Backend** : Notifications envoyées (CS, manager, commercial)
- [ ] **Backend** : Tâche onboarding créée automatiquement
- [ ] **Backend** : Metrics calculées correctement (sales_cycle_duration)
- [ ] **API** : POST /win retourne 200 avec toutes données créées
- [ ] **API** : POST /win retourne 202 si discount > 20%
- [ ] **API** : POST /approve-win fonctionne (approve et reject)
- [ ] **API** : GET /contracts retourne liste
- [ ] **Frontend** : WinOpportunityModal affiche tous champs requis
- [ ] **Frontend** : Discount calculé automatiquement en temps réel
- [ ] **Frontend** : End_date calculé automatiquement
- [ ] **Frontend** : Warning si discount > 20%
- [ ] **Frontend** : Section "What Happens Next" affichée
- [ ] **Frontend** : Success modal avec confetti après win
- [ ] **Frontend** : Summary modal liste toutes actions complétées
- [ ] **Frontend** : WinApprovalModal fonctionnel pour manager
- [ ] **Frontend** : Page contracts affiche liste
- [ ] **Tests** : 30+ tests unitaires markAsWon() toutes étapes
- [ ] **Tests** : Test E2E complet : win → contract → tenant → invitation
- [ ] **Tests** : Test discount > 20% → pending → approve → workflow
- [ ] **Tests** : Test client peut accepter invitation et créer compte
- [ ] **Démo** : Sponsor peut closer un deal en 30 secondes
- [ ] **Démo** : Contract, tenant, invitation créés automatiquement
- [ ] **Démo** : Client reçoit email et peut accéder sous 1 minute
- [ ] **Démo** : Manager peut approuver discount > 20%
- [ ] **Démo** : Dashboard stats mises à jour temps réel

---

_[Document continue avec Sprint 3 dans le prochain message si nécessaire...]_
