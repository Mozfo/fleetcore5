# FLEETCORE - ÉVOLUTION MODÈLE V1 → V2 : ANALYSE COMPLÈTE DES 55 TABLES (VERSION MISE À JOUR FLEET)

**Date:** 19 Octobre 2025  
**Version:** 2.3 - Module Fleet détaillé (6 tables)  
**Source:** Document 0_All_tables_v1.md (6386 lignes) + analyses détaillées Fleet  
**Mise à jour:** Module Fleet avec évolutions complètes V2

---

## LES 55 TABLES EXISTANTES ANALYSÉES (MODÈLE V1)

### ⚠️ Domaine Fleet (6 tables) - DÉTAIL COMPLET V2

#### Table 15: `flt_vehicles` - Véhicules de la flotte

**Existant V1 (32 colonnes):**

- id, tenant_id - Identifiants et multi-tenant
- make_id, model_id - FK vers marques et modèles
- license_plate, vin - Identification véhicule
- year, color, seats - Caractéristiques basiques
- vehicle_class, fuel_type, transmission - Types (texte libre)
- registration_date, insurance_expiry - Dates clés
- last_inspection, next_inspection - Inspections
- odometer, ownership_type, status - État et propriété
- metadata - Données extensibles
- created_at, updated_at, deleted_at - Audit basique

**Évolutions V2 nécessaires (48 colonnes totales):**

```
AJOUTER CONFORMITÉ MULTI-PAYS:
- country_code (char(2)) - Pays d'opération du véhicule
- requires_professional_license (boolean) - Permis spécial requis
- documents_status (jsonb) - Statut documents par type

AJOUTER DIMENSIONS PHYSIQUES:
- body_type (varchar(20)) - Type carrosserie précis
- passenger_capacity (integer) - Capacité passagers réglementaire
- car_length_cm (integer) - Longueur pour éligibilité
- car_width_cm (integer) - Largeur pour parkings
- car_height_cm (integer) - Hauteur pour restrictions

AJOUTER MAINTENANCE PRÉDICTIVE:
- first_registration_date (date) - Première immatriculation
- warranty_expiry (date) - Fin garantie constructeur
- service_interval_km (integer) - Intervalle maintenance
- next_service_at_km (integer) - Prochain service kilométrique

AJOUTER ASSURANCE DÉTAILLÉE:
- insurance_policy_number (text) - Numéro police
- insurance_coverage_type (text) - Type couverture
- insurance_amount (numeric(18,2)) - Montant assuré
- insurance_issue_date (date) - Date émission police

AJOUTER PROPRIÉTÉ ET FINANCE:
- owner_id (uuid) - FK vers propriétaire/investisseur
- acquisition_date (date) - Date acquisition
- lease_end_date (date) - Fin leasing si applicable
- residual_value (numeric(18,2)) - Valeur résiduelle

AJOUTER TRAÇABILITÉ:
- status_changed_at (timestamptz) - Date changement statut
- created_by, updated_by, deleted_by - Traçabilité complète
- deletion_reason (text) - Motif suppression

MODIFIER:
- status → FK vers dir_vehicle_statuses
- ownership_type → FK vers dir_ownership_types
- vehicle_class → vehicle_class_id (FK)

CRÉER TABLES SATELLITES:
1. flt_vehicle_inspections - Historique inspections
2. flt_vehicle_equipments - Équipements fournis
3. dir_vehicle_statuses - Référentiel statuts
4. dir_ownership_types - Types propriété
```

#### Table 16: `flt_vehicle_assignments` - Affectations véhicule-driver

**Existant V1 (12 colonnes):**

- id, tenant_id - Base multi-tenant
- driver_id, vehicle_id - Liens principaux
- start_date, end_date - Période affectation
- assignment_type - permanent/temporary
- status - active/inactive
- metadata - Données additionnelles
- Champs audit basiques

**Évolutions V2 nécessaires (24 colonnes):**

```
AJOUTER WORKFLOW HANDOVER COMPLET:
- handover_date (timestamptz) - Date/heure remise exacte
- handover_location (text) - Lieu de remise GPS
- handover_type (varchar) - pickup/return/transfer

ÉTAT INITIAL VÉHICULE:
- initial_odometer (integer) - Km début
- initial_fuel_level (integer) - Carburant début (%)
- initial_condition (jsonb) - État détaillé structuré:
  * exterior: {scratches[], dents[], damage[]}
  * interior: {cleanliness, seats, equipment}
  * mechanical: {engine, transmission, brakes}

PROTOCOLE PHOTOS:
- handover_photos (jsonb[]) - 6 photos obligatoires:
  * front, rear, left, right (extérieur)
  * dashboard (compteur kilométrique)
  * interior (état général)
- photos_metadata (jsonb) - timestamp, GPS, device

VALIDATION DIGITALE:
- driver_signature (text) - Signature digitale driver base64
- fleet_signature (text) - Signature agent flotte base64
- handover_checklist (jsonb) - Points vérifiés:
  * documents: {license, insurance, registration}
  * equipment: {spare_tire, jack, warning_triangle}
  * condition: {clean, fueled, functional}

RETOUR VÉHICULE:
- return_date (timestamptz) - Date retour effectif
- return_odometer (integer) - Km fin
- return_fuel_level (integer) - Carburant fin
- return_condition (jsonb) - État retour structuré
- damages_reported (jsonb) - Dommages constatés détaillés
- penalty_amount (numeric) - Pénalités calculées auto

WORKFLOW 5 ÉTAPES:
1. Pre-checks (documents, maintenance OK)
2. Photo capture (6 angles horodatés)
3. Condition record (état complet)
4. Double signature digitale
5. System actions (activation, baseline)
```

#### Table 17: `flt_vehicle_events` - Événements lifecycle

**Existant V1 (16 colonnes):**

- id, tenant_id, vehicle_id - Identification
- event_type - CHECK IN (7 types)
- event_date - Date événement
- severity - Pour accidents (minor→total_loss)
- downtime_hours - Immobilisation
- cost_amount, currency - Coûts
- details, notes - Informations libres
- Champs audit

**Évolutions V2 nécessaires (22 colonnes):**

```
AJOUTER RESPONSABILITÉS ET LIENS:
- driver_id (uuid) - Driver impliqué dans l'événement
- ride_id (uuid) - Course concernée (pour accidents)
- assignment_id (uuid) - Affectation active

GESTION RESPONSABILITÉ:
- responsible_party (varchar(20)) - fleet/driver/third_party
- fault_percentage (integer) - % responsabilité (0-100)
- liability_assessment (jsonb) - Détail évaluation

GESTION SINISTRES:
- police_report_number (text) - Référence rapport police
- police_station (text) - Commissariat
- insurance_claim_id (uuid) - Dossier assurance
- claim_status (varchar) - filed/processing/approved/rejected

GESTION RÉPARATIONS:
- repair_status (varchar(20)) - pending/approved/in_progress/completed
- repair_shop_id (uuid) - Atelier réparation
- estimated_repair_days (integer) - Durée prévue
- actual_repair_days (integer) - Durée réelle
- repair_invoice_id (uuid) - Facture réparation

ENRICHIR TYPES:
- event_type → Ajouter:
  * 'violation' (infraction code route)
  * 'recovery' (récupération vol)
  * 'impound' (mise fourrière)
  * 'theft' (vol déclaré)

STRUCTURER DÉTAILS:
- details → Structure par type événement
- photos (jsonb[]) - Photos accident/état
```

#### Table 18: `flt_vehicle_maintenance` - Maintenances planifiées

**Existant V1 (19 colonnes):**

- Planification basique (scheduled_date, status)
- Types maintenance (7 types CHECK)
- Provider info texte libre
- Coût global non ventilé
- Notes et metadata

**Évolutions V2 nécessaires (32 colonnes):**

```
CATÉGORISATION AVANCÉE:
- maintenance_category (varchar) - preventive/corrective/regulatory
- priority (varchar) - low/medium/high/urgent/emergency
- regulatory_requirement (boolean) - Obligatoire légalement
- blocking_vehicle (boolean) - Véhicule immobilisé

GESTION GARANTIES:
- warranty_covered (boolean) - Sous garantie constructeur
- warranty_claim_number (text) - Référence dossier garantie
- warranty_amount (numeric) - Montant couvert garantie
- insurance_covered (boolean) - Couvert par assurance
- insurance_claim_ref (text) - Référence assurance

WORKFLOW VALIDATION:
- requested_by (uuid) - Demandeur (driver/fleet)
- requested_at (timestamptz) - Date demande
- approved_by (uuid) - Manager validateur
- approved_at (timestamptz) - Date validation
- approval_notes (text) - Commentaires validation

VENTILATION COÛTS:
- labor_hours (numeric) - Heures main d'œuvre
- labor_rate (numeric) - Taux horaire MO
- labor_cost (numeric) - Coût MO total
- parts_cost (numeric) - Coût pièces total
- other_costs (numeric) - Autres frais
- tax_amount (numeric) - TVA
- total_cost_excl_tax (numeric) - HT
- total_cost_incl_tax (numeric) - TTC

DÉTAIL PIÈCES:
- parts_detail (jsonb[]) - Liste structurée:
  * part_number, description
  * quantity, unit_price
  * supplier, warranty_months

GESTION ATELIER:
- garage_id (uuid) - FK garage homologué
- work_order_number (text) - Numéro ordre travail
- mechanic_name (text) - Technicien responsable
- mechanic_certification (text) - Qualification
- quality_check_by (uuid) - Contrôleur qualité
- quality_check_at (timestamptz) - Date contrôle

PÉRIODES BLOCAGE:
- blocked_periods (tsrange[]) - Indisponibilités
- actual_start (timestamptz) - Début réel
- actual_end (timestamptz) - Fin réelle

WORKFLOW 5 PHASES:
1. Création (planifiée/urgente/obligatoire)
2. Validation (devis, délais, garage)
3. Exécution (suivi temps réel)
4. Contrôle qualité (vérification travaux)
5. Clôture (paiement, màj véhicule)
```

#### Table 19: `flt_vehicle_expenses` - Dépenses opérationnelles

**Existant V1 (24 colonnes):**

- Catégories (fuel, toll, parking, wash, repair, fine, other)
- Liens driver/ride optionnels
- Receipt URL et remboursement basique
- Metadata extensible

**Évolutions V2 nécessaires (35 colonnes):**

```
CATÉGORISATION DÉTAILLÉE:
- expense_category → Enrichir avec:
  * 'insurance_deductible' - Franchise
  * 'registration' - Immatriculation
  * 'inspection' - Contrôle technique
  * 'permit' - Permis/autorisations
- expense_subcategory (varchar) - Sous-catégorie détaillée

LIENS MULTIPLES:
- trip_ids (uuid[]) - Courses multiples concernées
- period_start (date) - Début période (abonnements)
- period_end (date) - Fin période
- mileage_start (integer) - Km début (trajets)
- mileage_end (integer) - Km fin

CIRCUIT VALIDATION:
- requires_approval (boolean) - Validation requise
- approval_threshold (numeric) - Seuil automatique
- approval_status (varchar) - pending/approved/rejected/cancelled
- approved_by (uuid) - Manager validateur
- approved_at (timestamptz) - Date validation
- rejection_reason (text) - Motif rejet

VÉRIFICATION JUSTIFICATIFS:
- receipt_status (varchar) - pending/verified/invalid
- receipt_verified_by (uuid) - Contrôleur
- receipt_verified_at (timestamptz) - Date vérification
- receipt_issues (jsonb) - Problèmes détectés
- ocr_extracted_data (jsonb) - Données OCR

ALLOCATION COÛTS:
- allocation_rule (varchar) - driver/fleet/shared/client
- driver_share_percent (integer) - % charge driver
- fleet_share_percent (integer) - % charge flotte
- client_share_percent (integer) - % charge client
- cost_center_id (uuid) - Centre de coût

REMBOURSEMENT AUTOMATISÉ:
- payment_batch_id (uuid) - Lot paiement
- payment_status (varchar) - pending/processed/failed
- payment_date (date) - Date paiement effectif
- payment_reference (text) - Référence virement

WORKFLOW 5 ÉTAPES:
1. Soumission (upload receipt + infos)
2. Vérification (OCR scan montants)
3. Validation (seuils auto/manuel)
4. Allocation (règles répartition)
5. Remboursement (batch hebdo)
```

#### Table 20: `flt_vehicle_insurances` - Polices d'assurance

**Existant V1 (26 colonnes):**

- Une police par véhicule
- Informations basiques (dates, prime, franchise)
- Contact assureur texte libre
- Claim count simple

**Évolutions V2 nécessaires (38 colonnes):**

```
MULTI-POLICES:
- policy_category (varchar) - main/supplementary/temporary/rider
- policy_priority (integer) - Ordre application
- parent_policy_id (uuid) - Police principale si avenant

COUVERTURE DÉTAILLÉE:
- coverage_territories (text[]) - Pays couverts
- coverage_drivers (varchar) - named/any/professional
- driver_restrictions (jsonb) - Restrictions détaillées:
  * min_age, min_experience
  * max_claims, license_types
- vehicle_usage (varchar) - commercial/private/mixed

FRANCHISES STRUCTURÉES:
- excess_details (jsonb) - Par type sinistre:
  * collision: {amount, waived_if}
  * theft: {amount, conditions}
  * glass: {amount, coverage}
  * natural: {amount, events[]}

BONUS/MALUS:
- no_claims_years (integer) - Années sans sinistre
- no_claims_bonus (integer) - Bonus en %
- claims_loading (integer) - Malus en %
- base_premium (numeric) - Prime de base
- final_premium (numeric) - Prime après bonus/malus

HISTORIQUE SINISTRES:
- claims_detail (jsonb[]) - Liste structurée:
  * date, type, amount
  * fault_percentage, status
  * impact_on_premium
- total_claims_amount (numeric) - Cumul sinistres
- claims_ratio (numeric) - Ratio S/P

GESTION RISQUE:
- risk_rating (varchar) - A/B/C/D score assureur
- risk_factors (jsonb) - Facteurs évaluation
- special_conditions (jsonb) - Conditions particulières
- exclusions (jsonb[]) - Exclusions spécifiques

GESTION COURTIER:
- broker_id (uuid) - FK courtier gestionnaire
- broker_commission (numeric) - Commission %
- broker_reference (text) - Référence dossier

RENOUVELLEMENT:
- renewal_date (date) - Date renouvellement
- renewal_notice_sent (boolean) - Préavis envoyé
- renewal_quote (numeric) - Devis renouvellement
- competitor_quotes (jsonb[]) - Devis concurrents

PAIEMENTS:
- payment_frequency (varchar) - annual/semi/quarterly/monthly
- payment_method (varchar) - direct_debit/transfer/card
- payment_schedule (jsonb[]) - Échéancier détaillé
- next_payment_date (date) - Prochaine échéance
- outstanding_amount (numeric) - Impayé

CO-ASSURANCE:
- co_insurance (boolean) - Multiple assureurs
- co_insurers (jsonb[]) - Liste co-assureurs
- lead_insurer (varchar) - Apériteur

WORKFLOW SINISTRES:
1. Déclaration (driver/fleet → assureur)
2. Instruction (expertise, responsabilité)
3. Négociation (montants, franchises)
4. Règlement (réparation/indemnisation)
5. Impact (maj prime, bonus/malus)
```

---

## ÉVOLUTIONS MAJEURES V1 → V2 - MODULE FLEET

### 📊 Synthèse des évolutions Fleet

#### Impact global sur les 6 tables

| Métrique              | V1   | V2   | Évolution    |
| --------------------- | ---- | ---- | ------------ |
| **Colonnes totales**  | ~140 | ~220 | +57%         |
| **Tables satellites** | 0    | 3    | +3 nouvelles |
| **Contraintes CHECK** | 15   | 35   | +133%        |
| **Index**             | 45   | 72   | +60%         |
| **Relations FK**      | 24   | 38   | +58%         |
| **Workflows**         | 0    | 5    | +5 complets  |

#### Nouvelles tables satellites Fleet

1. **`flt_vehicle_inspections`**
   - Historique complet inspections
   - Résultats et conformité
   - Documents associés
   - Planification automatique

2. **`flt_vehicle_equipments`**
   - Inventaire équipements fournis
   - Dates expiration/renouvellement
   - Traçabilité remise/retour
   - Valeur et amortissement

3. **`dir_vehicle_statuses`**
   - Référentiel statuts véhicule
   - Workflow transitions autorisées
   - Triggers automatiques
   - Règles validation

#### Évolutions transverses Fleet V2

**1. CONFORMITÉ MULTI-PAYS**

- Ajout `country_code` sur véhicules
- Validation automatique règles locales
- Documents requis par pays
- Adaptation inspections/maintenance

**2. WORKFLOWS COMPLETS**

- Handover protocol 5 étapes
- Maintenance avec validation
- Sinistres avec responsabilités
- Remboursements automatisés
- Renouvellements assurance

**3. TRAÇABILITÉ RENFORCÉE**

- Photos horodatées géolocalisées
- Signatures digitales doubles
- Historique état véhicule
- Audit trail complet
- Responsabilités tracées

**4. INTÉGRATION FINANCIÈRE**

- Ventilation coûts détaillée
- Allocation automatique
- Garanties et franchises
- Amortissements calculés
- ROI par véhicule

**5. PRÉDICTIF ET ALERTES**

- Maintenance prédictive ML-ready
- Alertes multi-canal contextuelles
- Planification optimisée
- Détection anomalies
- Scoring véhicules

---

## DÉPENDANCES CRITIQUES - MODULE FLEET

### Ordre d'implémentation Fleet V2

#### Phase 1 - Fondations Fleet (Semaine 1)

1. **dir_vehicle_statuses** : Créer référentiel statuts
2. **dir_ownership_types** : Types de propriété
3. **flt_vehicles évolutions** : 16 nouveaux champs
4. **flt_vehicle_inspections** : Créer table historique
5. **flt_vehicle_equipments** : Créer table équipements

#### Phase 2 - Workflows Fleet (Semaine 2)

6. **flt_vehicle_assignments** : Ajouter handover protocol
7. **flt_vehicle_events** : Ajouter responsabilités
8. **Workflow handover** : Implémenter 5 étapes
9. **Photos et signatures** : Système stockage sécurisé

#### Phase 3 - Finance Fleet (Semaine 3)

10. **flt_vehicle_maintenance** : Workflow validation complet
11. **flt_vehicle_expenses** : Circuit approbation
12. **flt_vehicle_insurances** : Multi-polices et sinistres
13. **Intégrations finance** : Liens avec fin\_\* tables

#### Phase 4 - Intelligence Fleet (Semaine 4)

14. **Maintenance prédictive** : Modèles ML sur historique
15. **Scoring véhicules** : Algorithmes performance
16. **Alertes contextuelles** : Multi-canal intelligent
17. **Dashboard KPIs** : ROI temps réel par véhicule

---

## MÉTRIQUES DE VALIDATION - MODULE FLEET

### Fleet Core - Validation

- [ ] 6 tables Fleet avec évolutions V2
- [ ] 3 tables satellites créées
- [ ] 48 colonnes sur flt_vehicles
- [ ] Handover protocol 5 étapes
- [ ] Photos 6 angles obligatoires

### Fleet Workflows - Validation

- [ ] Signatures digitales fonctionnelles
- [ ] Validation maintenance multi-niveaux
- [ ] Circuit expenses automatisé
- [ ] Sinistres avec responsabilités
- [ ] Remboursements batch hebdo

### Fleet Finance - Validation

- [ ] Ventilation coûts MO/pièces
- [ ] Garanties constructeur tracées
- [ ] Multi-polices assurance
- [ ] Allocation coûts driver/fleet
- [ ] ROI par véhicule calculé

### Fleet Intelligence - Validation

- [ ] Maintenance prédictive active
- [ ] Alertes multi-pays configurées
- [ ] Scoring utilisation optimale
- [ ] Détection anomalies active
- [ ] ML-ready sur historique

---

## IMPACT BUSINESS - MODULE FLEET V2

### ROI Financier Fleet

**Économies directes:**

- **-25% coûts maintenance** : Optimisation garanties (200k€/an)
- **-15% primes assurance** : Négociation data-driven (150k€/an)
- **-70% litiges handover** : Protection juridique (100k€/an)
- **-40% temps admin** : Automatisations (2 ETP = 120k€/an)

**Gains indirects:**

- **+20% utilisation véhicules** : Planning optimisé
- **+95% compliance** : Conformité automatique
- **-20% downtime** : Maintenance prédictive
- **+15% revenus** : Tarification dynamique

### KPIs Opérationnels Fleet

**Avant (V1):**

- Handover : 45 min papier
- Maintenance : Planning manuel
- Expenses : Validation 3 jours
- Compliance : 70% conformité
- ROI : Calcul trimestriel

**Après (V2):**

- Handover : 10 min digital
- Maintenance : Prédictif ML
- Expenses : Validation 2h auto
- Compliance : 95% temps réel
- ROI : Dashboard live

### Avantages Concurrentiels Fleet

**1. Protection juridique**

- Handover incontestable
- Photos géolocalisées
- Signatures légales
- Historique complet

**2. Intelligence artificielle**

- Maintenance prédictive
- Détection fraudes
- Optimisation routes
- Scoring drivers

**3. Multi-pays natif**

- Règles par pays
- Documents adaptés
- Inspections locales
- Devises multiples

---

## IMPACT SUR LES AUTRES MODULES

### Module Fleet - Impacts

**Dépendances entrantes:**

- **Directory** : Marques, modèles, classes
- **Administration** : Tenant, membres, audit
- **Drivers** : Assignments, handovers
- **Documents** : Stockage photos, polices

**Dépendances sortantes:**

- **Trips** : Véhicules pour courses
- **Finance** : Coûts et revenus
- **Revenue** : Calculs par véhicule
- **Scheduling** : Planification maintenance
- **Support** : Incidents véhicules

### Intégrations critiques Fleet

**Avec Finance:**

- Ventilation automatique coûts
- Calcul amortissements
- ROI temps réel
- Provisions comptables

**Avec Revenue:**

- Performance par véhicule
- Optimisation affectations
- Tarification dynamique
- Bonus/malus drivers

**Avec Scheduling:**

- Blocage maintenance
- Planning inspections
- Rotation véhicules
- Shifts drivers

---

**Document mis à jour avec détails complets module Fleet V2**  
**Prochaine étape:** Implémenter évolutions Fleet priorité P0
