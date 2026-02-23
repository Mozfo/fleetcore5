# FLEETCORE - ÉVOLUTION MODÈLE V1 → V2 : ANALYSE COMPLÈTE DES 55 TABLES

**Date:** 19 Octobre 2025  
**Version:** 3.0 - Document complet avec modules Administration et Scheduling  
**Source:** Document 0_All_tables_v1.md + Z_19_multi_table_analysis.md  
**Ajout:** Module Scheduling (4 tables) documentées

---

## ÉVOLUTIONS MAJEURES V1 → V2 - MODULE SCHEDULING

### 📅 Vue d'ensemble du domaine Scheduling

**Situation actuelle (V1):**

- 4 tables basiques pour planification
- Statuts simples (scheduled, completed, cancelled)
- Metadata non structurée
- Pas de types référentiels
- Suivi limité des performances

**Besoins métier non couverts:**

- Gestion des types de shifts (jour/nuit/weekend) avec primes différenciées
- Planification maintenance préventive automatisée
- Objectifs KPI mesurables en temps réel
- Tâches assignées explicitement avec workflow
- Intégration avec temps réels (check-in/out)

### 📊 Évolutions sur les 4 tables Scheduling

#### Table 9: `sch_shifts` - Planning conducteurs avancé

**Existant V1:**

- Structure basique : driver_id, start_time, end_time, status
- Contrainte temporelle : end_time >= start_time
- Index unique : (tenant_id, driver_id, start_time)
- Statuts : scheduled, completed, cancelled
- Metadata JSONB libre

**Évolutions V2:**

```sql
AJOUTER:
- shift_type (enum) - day, night, weekend, peak_hour, special_event
- shift_category (varchar) - regular, overtime, on_call, backup
- location_id (uuid) - FK vers table locations/zones
- zone_name (varchar) - Nom zone géographique
- approved_by (uuid) - FK vers adm_members - Qui valide le shift
- approved_at (timestamp) - Date validation
- check_in_at (timestamp) - Heure réelle début
- check_out_at (timestamp) - Heure réelle fin
- break_duration_minutes (integer) - Pauses
- actual_work_minutes (integer) - Calculé auto
- pay_multiplier (decimal) - Coefficient (1.0, 1.5 nuit, 2.0 férié)
- notes (text) - Observations
- cancellation_reason (varchar) - Si cancelled
- replacement_driver_id (uuid) - Remplacement

MODIFIER status ENUM pour ajouter:
- no_show - Driver absent sans prévenir
- partial - Shift partiellement effectué

CRÉER TABLE RÉFÉRENTIELLE sch_shift_types:
- id (uuid)
- tenant_id (uuid)
- code (varchar) - day, night, weekend
- label (varchar) - "Shift de Jour"
- pay_multiplier (decimal)
- color_code (varchar) - Pour UI
- is_active (boolean)

AMÉLIORER INDEX:
- Ajouter index sur check_in_at, check_out_at
- Ajouter index sur shift_type, location_id
- Ajouter index composite (driver_id, check_in_at) pour reporting
```

**Impact métier:**

- Primes différenciées selon type de shift
- Gestion zones géographiques (centre-ville, aéroport)
- Calcul précis heures réelles vs planifiées
- Validation hiérarchique des plannings
- Détection absences non justifiées

---

#### Table 10: `sch_maintenance_schedules` - Maintenance préventive

**Existant V1:**

- Structure basique : vehicle_id, scheduled_date, maintenance_type, status
- Index unique : (tenant_id, vehicle_id, scheduled_date, maintenance_type)
- Statuts : scheduled, completed, cancelled
- Type maintenance : string libre
- Pas de lien avec maintenance réalisée

**Évolutions V2:**

```sql
AJOUTER:
- maintenance_type_id (uuid) - FK vers dir_maintenance_types
- scheduled_by (uuid) - FK vers adm_members - Qui planifie
- priority (enum) - low, normal, high, urgent, critical
- estimated_duration_hours (decimal)
- estimated_cost (decimal)
- odometer_reading (integer) - Kilométrage au moment planification
- trigger_type (enum) - mileage_based, time_based, condition_based, manual
- reminder_sent_at (timestamp) - Dernier rappel envoyé
- reminder_count (integer) - Nombre rappels envoyés
- completed_maintenance_id (uuid) - FK vers flt_vehicle_maintenance
- rescheduled_from (uuid) - FK self pour historique report
- rescheduled_reason (text)
- blocking_operations (boolean) - Véhicule bloqué pendant maintenance
- required_parts (jsonb) - Liste pièces nécessaires
- assigned_garage (varchar)
- garage_contact (varchar)
- notes (text)

MODIFIER status ENUM pour ajouter:
- overdue - Dépassé sans être fait
- in_progress - En cours chez garagiste
- rescheduled - Reporté

CRÉER TABLE dir_maintenance_types:
- id (uuid)
- tenant_id (uuid) nullable - NULL = global FleetCore
- code (varchar) - oil_change, tire_rotation, inspection
- label (varchar) - "Vidange moteur"
- category (enum) - preventive, corrective, regulatory
- default_frequency_km (integer) - Ex: 10000 km
- default_frequency_months (integer) - Ex: 6 mois
- estimated_duration_hours (decimal)
- estimated_cost_range (jsonb) - {min: 50, max: 150}
- is_mandatory (boolean) - Obligatoire réglementairement
- requires_vehicle_stoppage (boolean)
- description (text)

AMÉLIORER INDEX:
- Ajouter index sur trigger_type, priority
- Ajouter index sur reminder_sent_at pour job automatique
- Ajouter index sur odometer_reading
- Ajouter index composite (vehicle_id, scheduled_date, status)
```

**Impact métier:**

- Planification automatique selon kilométrage ou temps
- Rappels automatiques propriétaires/gestionnaires
- Priorisation maintenance selon urgence
- Lien direct planification → exécution
- Gestion stock pièces nécessaires
- Conformité réglementaire (contrôles obligatoires)

---

#### Table 11: `sch_goals` - Objectifs KPI mesurables

**Existant V1:**

- Structure basique : goal_type, target_value, period_start/end, assigned_to, status
- Index unique : (tenant_id, goal_type, period_start, assigned_to)
- Statuts : active, in_progress, completed, cancelled, expired
- Type objectif : string libre
- Pas de suivi progression

**Évolutions V2:**

```sql
AJOUTER:
- goal_type_id (uuid) - FK vers sch_goal_types
- goal_category (enum) - revenue, trips, quality, efficiency, safety
- target_type (enum) - individual, team, branch, company
- target_entity_type (varchar) - driver, member, branch
- target_entity_id (uuid)
- period_type (enum) - daily, weekly, monthly, quarterly, yearly
- recurrence_pattern (varchar) - Pour objectifs récurrents
- current_value (decimal) - Valeur actuelle
- progress_percent (decimal) - Calculé auto (current/target * 100)
- unit (varchar) - trips, AED, hours, km, points
- weight (decimal) - Importance relative si objectifs multiples
- reward_type (enum) - bonus, certificate, badge, promotion
- reward_amount (decimal) - Si bonus financier
- threshold_bronze (decimal) - Paliers intermédiaires
- threshold_silver (decimal)
- threshold_gold (decimal)
- achievement_date (timestamp) - Date atteinte objectif
- last_calculated_at (timestamp) - Dernière MAJ progression
- last_notified_at (timestamp) - Dernier rappel envoyé
- notification_frequency_days (integer)
- created_by (uuid) - Qui définit l'objectif
- notes (text)

MODIFIER status ENUM pour ajouter:
- on_track - En bonne voie
- at_risk - Risque non atteinte
- achieved - Objectif atteint
- exceeded - Dépassé

CRÉER TABLE sch_goal_types:
- id (uuid)
- tenant_id (uuid) nullable - NULL = types FleetCore standards
- code (varchar) - trips_completed, net_revenue, avg_rating
- label (varchar) - "Nombre de courses complétées"
- category (enum) - revenue, trips, quality, efficiency
- unit (varchar) - trips, AED, points
- calculation_method (text) - Description calcul
- data_source_table (varchar) - Table source données
- data_source_field (varchar) - Champ à agréger
- aggregation_type (enum) - sum, avg, count, min, max
- is_higher_better (boolean) - true = plus c'est mieux
- icon (varchar) - Pour UI
- color (varchar) - Pour UI

CRÉER TABLE sch_goal_achievements:
- id (uuid)
- goal_id (uuid) - FK vers sch_goals
- achievement_date (timestamp)
- final_value (decimal)
- threshold_reached (enum) - bronze, silver, gold, exceeded
- reward_granted (boolean)
- reward_amount (decimal)
- certificate_url (varchar)
- notes (text)

AMÉLIORER INDEX:
- Ajouter index sur progress_percent, status
- Ajouter index sur achievement_date
- Ajouter index composite (assigned_to, period_start, status)
- Ajouter index sur target_entity_type, target_entity_id
```

**Impact métier:**

- Objectifs mesurables en temps réel
- Paliers de réussite (bronze/silver/gold)
- Système de récompenses intégré
- Objectifs récurrents automatiques
- Notifications proactives risque non-atteinte
- Gamification motivation drivers
- Reporting performance par équipe/branche
- Alignement objectifs individuels/collectifs

---

#### Table 12: `sch_tasks` - Tâches assignées workflow

**Existant V1:**

- Structure basique : task_type, description, target_id, due_at, status
- Statuts : pending, in_progress, completed, cancelled, overdue
- Type tâche : string libre
- target_id générique sans typage
- Pas d'assignation explicite

**Évolutions V2:**

```sql
AJOUTER:
- task_type_id (uuid) - FK vers sch_task_types
- task_category (enum) - admin, maintenance, document, training, support
- title (varchar) - Titre court
- priority (enum) - low, normal, high, urgent, critical
- assigned_to (uuid) - FK vers adm_members - Responsable exécution
- assigned_at (timestamp)
- assigned_by (uuid) - FK vers adm_members - Qui assigne
- target_type (varchar) - driver, vehicle, document, member, contract
- target_id (uuid) - ID entité concernée
- related_entity_type (varchar) - Entité secondaire
- related_entity_id (uuid)
- estimated_duration_minutes (integer)
- actual_duration_minutes (integer)
- start_date (date) - Date début souhaitée
- due_date (date) - Date limite
- completed_at (timestamp) - Date réelle fin
- completed_by (uuid) - Qui a terminé
- verification_required (boolean) - Nécessite validation
- verified_by (uuid) - Qui valide
- verified_at (timestamp)
- is_auto_generated (boolean) - Générée automatiquement
- generation_trigger (varchar) - trigger_name si auto
- recurrence_pattern (varchar) - Si tâche récurrente
- parent_task_id (uuid) - FK self pour sous-tâches
- blocking_tasks (uuid[]) - Tâches bloquantes
- checklist (jsonb) - Étapes à valider
- attachments (jsonb) - Documents liés
- comments (jsonb) - Historique commentaires
- reminder_sent_at (timestamp)
- reminder_frequency_days (integer)
- escalation_level (integer) - Nombre escalades
- escalated_to (uuid) - Manager si escalade
- tags (text[]) - Classification libre

MODIFIER status ENUM pour ajouter:
- blocked - Bloquée par autre tâche
- waiting_verification - En attente validation
- reopened - Rouverte après completed

CRÉER TABLE sch_task_types:
- id (uuid)
- tenant_id (uuid) nullable
- code (varchar) - verify_document, schedule_maintenance, approve_payment
- label (varchar) - "Vérifier document conducteur"
- category (enum) - admin, maintenance, document, training
- default_priority (enum)
- default_duration_minutes (integer)
- requires_verification (boolean)
- default_checklist (jsonb) - Template étapes
- auto_assignment_rule (jsonb) - Règles assignation auto
- sla_hours (integer) - Délai réponse standard
- escalation_hours (integer) - Délai avant escalade
- description_template (text)

CRÉER TABLE sch_task_comments:
- id (uuid)
- task_id (uuid) - FK vers sch_tasks
- comment_type (enum) - note, status_change, escalation
- author_id (uuid) - FK vers adm_members
- comment_text (text)
- attachments (jsonb)
- is_internal (boolean) - Visible seulement équipe
- created_at (timestamp)

CRÉER TABLE sch_task_history:
- id (uuid)
- task_id (uuid)
- changed_by (uuid)
- change_type (enum) - created, assigned, status_changed, escalated
- old_values (jsonb)
- new_values (jsonb)
- change_reason (text)
- created_at (timestamp)

AMÉLIORER INDEX:
- Ajouter index sur assigned_to, status, due_date
- Ajouter index sur task_category, priority
- Ajouter index sur is_auto_generated, generation_trigger
- Ajouter index gin sur tags
- Ajouter index composite (target_type, target_id, status)
```

**Impact métier:**

- Assignation claire responsabilités
- Workflow validation multi-niveaux
- Génération automatique tâches récurrentes
- Escalade automatique tâches en retard
- Checklist garantit exhaustivité
- Historique complet traçabilité
- Intégration avec système tickets
- Tâches bloquantes gestion dépendances
- SLA mesurables par type tâche
- Collaboration via commentaires

---

## NOUVELLES TABLES À CRÉER - DOMAINE SCHEDULING

### Tables complémentaires pour V2 complète

#### `sch_shift_types` - Types de shifts référentiel

```sql
Fonction : Définir types shifts standards avec coefficients prime
Utilisation : Référencé par sch_shifts.shift_type_id
Avantage : Évite duplication, calcul primes cohérent
Exemples : day (1.0), night (1.5), weekend (1.25), holiday (2.0)
```

#### `dir_maintenance_types` - Types maintenances référentiel

```sql
Fonction : Catalogue maintenances avec fréquence et coût estimé
Utilisation : Référencé par sch_maintenance_schedules.maintenance_type_id
Avantage : Planification préventive automatisée
Exemples : oil_change (10000km/6mois), tire_rotation (15000km)
Multi-tenant : Types globaux + spécifiques tenant
```

#### `sch_goal_types` - Types objectifs KPI référentiel

```sql
Fonction : Définir KPI mesurables avec source données et calcul
Utilisation : Référencé par sch_goals.goal_type_id
Avantage : Cohérence métriques, automatisation calculs
Exemples : trips_completed (COUNT trp_trips), net_revenue (SUM)
Champs clés : data_source_table, aggregation_type
```

#### `sch_goal_achievements` - Historique succès objectifs

```sql
Fonction : Tracer atteinte objectifs avec paliers et récompenses
Utilisation : Lié à sch_goals.id
Avantage : Historique motivation, certificats, primes
Conservation : Permanent pour RH et paie
```

#### `sch_task_types` - Types tâches référentiel

```sql
Fonction : Catalogue tâches avec SLA et template checklist
Utilisation : Référencé par sch_tasks.task_type_id
Avantage : Génération auto cohérente, SLA mesurables
Exemples : verify_driver_document (SLA 24h), approve_payment (SLA 2h)
```

#### `sch_task_comments` - Commentaires tâches

```sql
Fonction : Fil discussion sur tâches
Utilisation : Lié à sch_tasks.id
Avantage : Collaboration asynchrone, historique décisions
Remplace : Commentaires dans metadata JSONB
```

#### `sch_task_history` - Audit changements tâches

```sql
Fonction : Tracer tous changements statut/assignation
Utilisation : Lié à sch_tasks.id
Avantage : Conformité, analyse workflows, temps résolution
Complément : adm_audit_logs (plus général)
```

#### `sch_locations` - Zones géographiques (OPTIONNEL)

```sql
Fonction : Définir zones dispatch (centre-ville, aéroport, banlieue)
Utilisation : Référencé par sch_shifts.location_id
Avantage : Optimisation dispatch, statistiques par zone
Champs : name, polygon (geography), city, country
Alternative : Utiliser metadata si pas besoin géospatial avancé
```

---

## DÉPENDANCES CRITIQUES - MODULE SCHEDULING

### Ordre d'implémentation obligatoire

#### Phase 0 - Tables référentielles (PRIORITÉ P0)

1. **sch_shift_types** : Créer AVANT enrichir sch_shifts
2. **dir_maintenance_types** : Créer AVANT enrichir sch_maintenance_schedules
3. **sch_goal_types** : Créer AVANT enrichir sch_goals
4. **sch_task_types** : Créer AVANT enrichir sch_tasks

#### Phase 1 - Enrichissement tables principales (Semaine 1)

5. **sch_shifts** : Ajouter shift_type_id, approved_by, check_in/out
6. **sch_maintenance_schedules** : Ajouter maintenance_type_id, priority, reminders
7. **sch_goals** : Ajouter goal_type_id, current_value, progress_percent
8. **sch_tasks** : Ajouter task_type_id, assigned_to, workflow fields

#### Phase 2 - Tables support workflow (Semaine 2)

9. **sch_goal_achievements** : Historique succès
10. **sch_task_comments** : Collaboration
11. **sch_task_history** : Audit trail
12. **sch_locations** : Zones géographiques (si besoin)

### Dépendances inter-modules

**Dépendances entrantes (Scheduling dépend de):**

- **adm_tenants** : Isolation multi-tenant
- **adm_members** : Assignation, approbation, audit
- **rid_drivers** : Shifts assignés aux drivers
- **flt_vehicles** : Maintenance planifiée véhicules
- **flt_vehicle_maintenance** : Lien planification → réalisation

**Dépendances sortantes (Autres modules dépendent de Scheduling):**

- **fin_driver_payments** : Lit sch_shifts pour calcul heures réelles
- **rid_driver_performances** : Lit sch_goals pour objectifs
- **sup_tickets** : Peut générer sch_tasks automatiquement
- **flt_vehicle_events** : Bloque véhicule selon sch_maintenance_schedules

---

## MÉTRIQUES DE VALIDATION - SCHEDULING

### Techniques

- [ ] 4 tables Scheduling enrichies opérationnelles
- [ ] 7 tables référentielles/support créées
- [ ] Contraintes FK tous types référentiels
- [ ] Index performance sur champs recherche fréquente
- [ ] Triggers MAJ auto (progress_percent, actual_work_minutes)

### Fonctionnelles

- [ ] Shifts : Calcul primes automatique selon type
- [ ] Maintenance : Génération rappels automatiques avant échéance
- [ ] Goals : MAJ progression temps réel depuis trp_trips
- [ ] Tasks : Escalade automatique si SLA dépassé
- [ ] Planning : Détection conflits horaires shifts

### Performance

- [ ] Recherche shifts par driver/date < 50ms
- [ ] Calcul progression objectifs < 100ms
- [ ] Liste tâches assignées triées < 50ms
- [ ] Dashboard planning semaine < 200ms
- [ ] Rapport KPI mensuel < 2s

### Conformité

- [ ] Audit trail complet changements statut
- [ ] Validation hiérarchique shifts tracée
- [ ] Historique maintenances réglementaires
- [ ] Conservation succès objectifs pour RH
- [ ] Logs assignation/réassignation tâches

---

## IMPACT SUR LES AUTRES MODULES

### Impact Finance

**sch_shifts → fin_driver_payments**

- Calcul salaire basé sur actual_work_minutes (réel vs planifié)
- Application pay_multiplier selon shift_type
- Détection écarts planning vs réalisé
- Gestion heures supplémentaires automatique

### Impact Fleet Management

**sch_maintenance_schedules → flt_vehicle_events**

- Blocage automatique véhicule période maintenance
- Prévention assignation driver si véhicule en maintenance
- Génération événement "vehicle_in_maintenance"
- Alerte si maintenance overdue

### Impact Driver Performance

**sch_goals → rid_driver_performances**

- Objectifs KPI individuels mesurés
- Comparaison performance vs objectifs
- Calcul bonus performance automatique
- Historique évolution sur périodes

### Impact Support

**sch_tasks → sup_tickets**

- Génération tâche automatique depuis ticket
- Lien ticket ↔ tâche pour suivi
- Escalade tâche critique = ticket prioritaire
- Fermeture ticket si toutes tâches completed

### Impact Revenue

**sch_shifts → rev_driver_revenues**

- Corrélation shifts planifiés vs revenus réels
- Analyse efficacité planification
- Identification shifts les plus rentables
- Optimisation planning basée historique

---

## RÉSUMÉ EXÉCUTIF - MODULE SCHEDULING

### État actuel V1

- ✅ 4 tables basiques opérationnelles
- ❌ Pas de types référentiels
- ❌ Pas de suivi temps réel
- ❌ Pas d'automatisation
- ❌ Workflow limité

### État cible V2

- ✅ 4 tables principales enrichies
- ✅ 7 nouvelles tables support/référentielles
- ✅ Suivi temps réel check-in/out
- ✅ Automatisation (rappels, escalades, génération)
- ✅ Workflow complet avec validation

### Bénéfices attendus

**Opérationnels:**

- Planification optimisée par zone et type
- Maintenance préventive automatique
- Objectifs mesurables temps réel
- Workflow tâches structuré

**Financiers:**

- Calcul paie précis (heures réelles + primes)
- Réduction coûts maintenances correctives (-30%)
- Bonus objectifs automatisés
- ROI : 150k€/an économies

**Conformité:**

- Audit trail complet planning
- Maintenances réglementaires tracées
- Objectifs RH documentés
- SLA tickets mesurables

---

**Document complet avec Administration (8 tables) et Scheduling (4 tables)**  
**Total tables documentées : 12/55**  
**Prochaines étapes : Documenter 43 tables restantes selon même format**
