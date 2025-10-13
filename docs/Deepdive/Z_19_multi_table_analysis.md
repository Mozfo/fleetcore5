# Analyse approfondie des tables (rid_drivers, rev_revenue_imports, rid_driver_blacklists, etc.)

Cette étude compile l’analyse détaillée des principales tables restantes de Fleetcore, en suivant le format établi lors des précédentes analyses (modèle existant, règles métier/processus, propositions d’amélioration et modèle cible, impact sur les autres tables). Ces tables appartiennent aux domaines **drivers**, **scheduling**, **trips**, **revenu** et **support** et sont utilisées par les opérateurs de **ride‑hailing** (Uber/Bolt/Careem) pour gérer chauffeurs, véhicules, revenus et assistance client. Les améliorations visent à simplifier la structure pour un usage SaaS multi‑tenant et multi‑pays, tout en restant extensible.

## Table `rev_revenue_imports`

### Modèle existant

La table `rev_revenue_imports` enregistre les imports de recettes provenant des plateformes de ride‑hailing ou d’autres sources. Elle comprend l’`id`, le `tenant_id`, un `import_reference` (identifiant du fichier ou de l’export), la `import_date`, `status` (`pending`, `processing`, `completed`, `failed`, `cancelled`), `total_revenue`, `currency` et un champ `metadata`. Des index permettent de rechercher par date, statut, tenant, etc., et un index unique `(tenant_id, import_reference)` empêche les doublons. Les audits sont gérés via `created_by`, `updated_by` et `deleted_by`.

### Règles métier et processus

- **Chargement de données** : Les opérateurs importent régulièrement les revenus collectés par les plateformes partenaires (Uber, Bolt, Careem). Chaque import représente un fichier ou une API call ; le champ `import_reference` permet de tracer l’origine et d’éviter les duplications.
- **Workflow d’import** : Le statut passe de `pending` à `processing`, puis `completed` lorsque les lignes de revenu sont enregistrées. En cas d’erreur, le statut passe à `failed` ou `cancelled`.
- **Agrégation** : Le total importé est comparé aux entrées dans `rev_driver_revenues` pour contrôler que les commissions et les paiements aux chauffeurs sont cohérents.

### Propositions d’amélioration et modèle cible

1. **Origine et type d’import** : ajouter un champ `source_type` (`api`, `file_csv`, `manual`) et un champ `platform_id` pour identifier l’origine (Uber, Bolt). Cela facilite l’analyse et la détection d’erreurs.
2. **Multi‑devises et taux de change** : prévoir `source_currency` et `exchange_rate` pour les imports provenant de plateformes étrangères ; `currency` resterait la devise du tenant.
3. **Statistiques et journalisation** : ajouter `rows_count` et `errors_count` pour indiquer le nombre de lignes importées et d’erreurs, ainsi qu’un champ `file_url` pour stocker le chemin vers le fichier d’origine.
4. **Normalisation du statut** : transformer `status` en ENUM (`pending`, `processing`, `completed`, `failed`, `cancelled`), ajouter un champ `status_reason` pour la justification.

Le modèle cible pourrait être :

```sql
CREATE TYPE rev_import_status AS ENUM ('pending','processing','completed','failed','cancelled');

CREATE TABLE rev_revenue_imports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES adm_tenants(id) ON DELETE CASCADE,
  platform_id UUID NOT NULL REFERENCES dir_platforms(id) ON DELETE CASCADE,
  import_reference TEXT NOT NULL,
  import_date DATE NOT NULL,
  source_type TEXT NOT NULL,
  status rev_import_status NOT NULL DEFAULT 'pending',
  source_currency CHAR(3),
  exchange_rate NUMERIC(12,6),
  total_revenue NUMERIC(18,2) NOT NULL DEFAULT 0,
  rows_count INTEGER DEFAULT 0,
  errors_count INTEGER DEFAULT 0,
  file_url TEXT,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES adm_members(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES adm_members(id) ON DELETE SET NULL,
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES adm_members(id) ON DELETE SET NULL,
  deletion_reason TEXT,
  UNIQUE (tenant_id, import_reference) WHERE deleted_at IS NULL
);
```

### Impact sur les autres tables

Ces ajouts n’affectent pas `rev_reconciliations` ou `rev_driver_revenues`, mais ils améliorent la traçabilité lors de la réconciliation. Un champ `platform_id` permet de regrouper les imports par plateforme.

## Table `rid_driver_blacklists`

### Modèle existant

`rid_driver_blacklists` consigne les conducteurs interdits ou suspendus. Les colonnes principales : `driver_id`, `tenant_id`, `reason`, `start_date`, `end_date` (optionnelle), `status` (`active` ou `inactive`) et `metadata`. Un index unique `(tenant_id, driver_id)` sur les entrées actives empêche qu’un chauffeur soit blacklisté plusieurs fois simultanément. Les dates indiquent la période de suspension et `notes`/`metadata` peuvent stocker des détails.

### Règles métier

- **Offboarding et sanctions** : Lorsqu’un chauffeur enfreint gravement le règlement (accidents graves, fraude, violences) ou quitte l’entreprise, on l’inscrit dans la blacklist【567670092230000†L90-L118】. Seules les personnes habilitées peuvent lever la suspension.
- **Durée et statut** : si `end_date` est renseignée, la suspension est temporaire et le statut passe à `inactive` après expiration ; sinon, la suspension est permanente. Un chauffeur « blacklisté » ne peut pas être réaffecté à un véhicule ni recevoir des paiements.

### Propositions d’amélioration

1. **Ajouter `category` et `appeal_status`** : indiquer si la blacklist est liée à un motif disciplinaire, administratif ou légal. Ajouter un champ `appeal_status` pour suivre les recours (pending/accepted/rejected).
2. **Audit renforcé** : ajouter `origin_event_id` (accident ou inspection) et `reviewed_by` (membre HR) pour connaître l’origine et le responsable de la décision. Utiliser un ENUM pour `status` (`active`, `expired`, `revoked`).
3. **Historique** : stocker les dates d’expiration et de réactivation, et prévoir un champ `revoked_at`.
4. **Notifications** : ajouter un champ `notified_at` pour savoir quand le chauffeur a été informé, afin de respecter la transparence.

### Impact

Ces ajouts impliquent de mettre à jour la logique de driver onboarding/offboarding et de synchroniser `driver_status` dans `rid_drivers` avec la blacklist. Ils renforcent la conformité RGPD et la traçabilité.

## Table `rid_driver_cooperation_terms`

### Modèle existant

Cette table stocke les versions des **conditions de coopération** acceptées par chaque chauffeur. Les colonnes : `driver_id`, `terms_version`, `accepted_at`, `effective_date`, `expiry_date`, `status` (`pending`, `active`, `expired`, `terminated`), `metadata` et les champs d’audit. L’index unique `(tenant_id, driver_id, terms_version)` garantit qu’on ne duplique pas les termes pour un même chauffeur.

### Règles métier

- **Acceptation de contrat** : après la qualification, on envoie au chauffeur la dernière version des termes (rémunération, obligations). Le chauffeur peut les signer via l’app ; l’`accepted_at` est enregistré. La `effective_date` indique la date d’entrée en vigueur et `expiry_date` la date de fin éventuelle.
- **Cycle de vie** : si une nouvelle version est publiée, l’ancienne passe à `expired` et la nouvelle à `active`. En cas de rupture, le statut passe à `terminated`.

### Propositions d’amélioration

1. **Lien vers le fichier** : ajouter `terms_document_url` pour lier le PDF stocké dans `doc_documents`.
2. **Suivi des signatures** : ajouter `signed_by` (clerk_user_id) et `signature_method` (`digital`, `wet`, `app`) pour prouver la validité.
3. **Historisation** : ajouter `previous_terms_id` pour suivre la chaîne de versions. Cela facilite les audits.
4. **Paramètres dynamiques** : stocker des variables (taux de commission, frais fixes) dans le JSON `metadata` ou une table `rid_driver_compensation_terms` pour permettre l’ajustement sans modifier le texte.

### Impact

Ces modifications facilitent la gestion des contrats de coopération, l’intégration avec le module de paie (WPS) et la conformité juridique.

## Table `rid_driver_documents`

### Modèle existant

`rid_driver_documents` relie les chauffeurs à leurs documents téléchargés (permis, carte d’identité, carte professionnelle). Elle contient `document_id` (clé étrangère vers `doc_documents`), `document_type`, `expiry_date`, `verified` (booléen), `verified_by`, `verified_at` et `metadata`. Un index unique `(driver_id, document_type)` empêche deux documents actifs du même type. Les audits et la suppression logique sont gérés par les champs habituels.

### Règles métier

- **Vérification** : à l’upload, le statut `verified` est false. Un membre de l’équipe vérifie le document et met `verified` à true avec `verified_by` et `verified_at`. Si un document expire, on passe le chauffeur en statut `suspended` jusqu’au renouvellement【567670092230000†L90-L118】.
- **Types de document** : `document_type` doit appartenir à une liste restreinte (permits, ID, licence professionnelle). Le document original est stocké dans `doc_documents`. Un rappel automatique est envoyé avant l’expiration.

### Propositions d’amélioration

1. **Enum pour `document_type`** : créer un type ou une table référentielle (license, ID, proof_of_address, visa) pour garantir l’intégrité et permettre l’extension.
2. **Rappels et notifications** : ajouter `reminder_sent_at` pour savoir quand l’alerte de renouvellement a été envoyée. Ajouter `requires_renewal` booléen si certains documents n’expirent pas.
3. **Automatisation** : ajouter `verification_status` (`pending`, `verified`, `rejected`) et `rejection_reason` pour normaliser la vérification. Cela alimente l’interface de back‑office.

### Impact

Ces améliorations renforcent la gestion documentaire et peuvent s’intégrer à une vérification automatisée (OCR, reconnaissance d’identifiants). Les modifications restent compatibles avec la structure existante.

## Table `rid_driver_performances`

### Modèle existant

`rid_driver_performances` agrège les performances d’un chauffeur sur une période. Les champs clés : `period_start`, `period_end`, `trips_completed`, `trips_cancelled`, `on_time_rate` (0–100 %), `avg_rating` (0–5), `incidents_count`, `earnings_total`, `hours_online`, `metadata` et les audits. Des contraintes assurent que les compteurs sont positifs et que la période est cohérente. Un index unique `(tenant_id, driver_id, period_start)` évite les doublons sur la même période.

### Règles métier

- **Collecte automatique** : Ces statistiques proviennent des imports de revenus et de l’intégration des plateformes. Elles servent à calculer les primes, à détecter les fraudeurs et à planifier les formations.
- **KPI et reporting** : Les gestionnaires examinent la ponctualité (`on_time_rate`), la note moyenne (`avg_rating`), le nombre d’incidents et les revenus pour chaque chauffeur. Ces KPI alimentent un tableau de bord et des alertes (ex. notation < 3 : coaching).

### Propositions d’amélioration

1. **Type de période** : ajouter `period_type` (`daily`, `weekly`, `monthly`) pour indiquer la granularité. Laisser `period_end` facultatif si la période est standard.
2. **Source et plate‐forme** : ajouter `platform_id` pour distinguer les performances par plateforme (Uber vs Bolt). Ajouter `payment_method` (cash, card) pour analyser l’impact des méthodes de paiement sur les revenus.
3. **Dimension sociale** : ajouter `complaints_count` et `positive_feedback_count` pour mesurer le service client. Ces valeurs peuvent provenir de `sup_customer_feedback`.
4. **Index et partitionnement** : envisager de partitionner par `period_start` ou `driver_id` pour améliorer les performances sur de grands volumes.

### Impact

Ces changements nécessitent de mettre à jour les services qui calculent les performances, mais améliorent considérablement l’analyse et la réactivité. Ils permettent aussi des comparaisons entre plateformes et encouragent les bonnes pratiques.

## Table `rid_driver_requests`

### Modèle existant

La table `rid_driver_requests` n’est pas définie dans le DDL fourni (elle est dupliquée par erreur avec `rid_driver_performances` dans l’énoncé). Dans la spécification fonctionnelle, il s’agit du module permettant aux chauffeurs de faire des demandes (congés, remboursements, modifications de planning). Elle devrait comporter : `driver_id`, `request_type` (congé, remboursement, changement de véhicule), `description`, `status` (`pending`, `approved`, `rejected`), `submitted_at`, `resolved_at`, `metadata` et des liens vers les membres qui traitent la demande.

### Propositions d’amélioration et modèle cible

1. **Créer la table** : définir `rid_driver_requests` avec les champs ci-dessus. Ajouter un champ `reference` pour tracer la demande et un champ `platform_id` si certaines demandes concernent une plateforme spécifique. Un index unique `(tenant_id, driver_id, reference)` assure l’unicité.
2. **Cycle de vie** : un champ `status_reason` ou `resolution_notes` permet d’expliquer l’acceptation ou le refus. Les statuts peuvent être normalisés via un ENUM.
3. **Audit et notifications** : enregistrer `created_by` et `updated_by` pour tracer l’agent qui a saisi ou traité la demande. Des triggers peuvent envoyer des notifications lorsque le statut change.

### Impact

L’ajout de cette table permettra de centraliser les requêtes et d’améliorer la traçabilité, sans perturber les autres modules.

## Table `rid_driver_training`

### Modèle existant

Cette table gère les formations des chauffeurs. Elle contient `driver_id`, `training_name`, `provider`, `status` (`planned`, `in_progress`, `completed`, `expired`, `cancelled`), `assigned_at`, `due_at`, `completed_at`, `score`, `certificate_url` et `metadata`. Un index unique `(tenant_id, driver_id, training_name)` empêche les doublons.

### Règles métier

- **Formation obligatoire** : certains modules imposent des formations (sécurité, service client) ; d’autres sont facultatifs (formation VTC, nouvelles plateformes). Les chauffeurs doivent terminer la formation avant de prendre des courses spécifiques. Des rappels sont envoyés avant `due_at`.
- **Suivi de la performance** : le champ `score` mesure la réussite ; `certificate_url` stocke la preuve. Les formations expirées sont retirées du dossier du chauffeur.

### Propositions d’amélioration

1. **Types et catégories** : ajouter `training_type` et `category` pour distinguer les formations obligatoires, techniques, commerciales. Cela facilite le reporting et la gestion des agendas.
2. **Liaison avec l’évaluateur** : ajouter `evaluated_by` (membre) et un champ `feedback` pour consigner des observations. Cela encourage un accompagnement personnalisé.
3. **Référence externe** : si les formations sont dispensées par un organisme externe, ajouter `external_provider_id` et `external_reference` pour synchroniser les statuts et récupérer les certificats.
4. **Notifications** : ajouter `reminder_sent_at` et `last_contact_at` pour suivre les rappels.

### Impact

Ces améliorations amélioreront la gestion des compétences et la conformité réglementaire. Les liens avec `rid_driver_performances` permettront d’analyser l’impact des formations sur les KPI.

## Table `sch_goals`

### Modèle existant

La table `sch_goals` définit des objectifs assignés à des membres ou chauffeurs. Les colonnes : `goal_type`, `target_value`, `period_start`, `period_end`, `assigned_to`, `status` (`active`, `in_progress`, `completed`, `cancelled`, `expired`), `metadata` et les champs d’audit. Un index unique `(tenant_id, goal_type, period_start, assigned_to)` empêche la duplication.

### Règles métier

- **Définition des objectifs** : Les managers définissent des objectifs (nombre de courses, chiffre d’affaires, heures en ligne) pour une période donnée et les assignent à un chauffeur ou à un rôle (ex. dispatcher). Les objectifs peuvent être collectifs ou individuels.
- **Suivi et mise à jour** : Les performances sont comparées aux objectifs via les données de `rid_driver_performances` et `trp_trips`. Le statut passe à `in_progress` puis `completed` une fois l’objectif atteint ou `expired` si la période est écoulée sans succès.

### Propositions d’amélioration

1. **Types normalisés et unités** : créer une table `sch_goal_types` (ex. `trips_completed`, `net_revenue`, `avg_rating`) avec l’unité (courses, AED/EUR, points) et la méthode de calcul. Le champ `goal_type` devient une clé étrangère.
2. **Granularité et fréquence** : ajouter `period_type` (`daily`, `weekly`, `monthly`) et `frequency` pour gérer les objectifs récurrents.
3. **Suivi de progression** : ajouter `current_value` et `progress_percent` mis à jour automatiquement, afin d’afficher l’avancement en temps réel dans le tableau de bord.
4. **Notifications et rappels** : ajouter `last_notified_at` pour envoyer des rappels avant la fin de la période.

### Impact

Ces améliorations renforceront la motivation des chauffeurs en rendant les objectifs plus clairs et mesurables. La création d’une table `sch_goal_types` facilite l’intégration de nouveaux indicateurs. Les champs supplémentaires enrichissent les dashboards sans changer les relations existantes.

## Table `sch_shifts`

### Modèle existant

La table `sch_shifts` stocke les créneaux horaires assignés aux chauffeurs. Les colonnes : `driver_id`, `start_time`, `end_time`, `status` (`scheduled`, `completed`, `cancelled`), `metadata` et les champs d’audit. Une contrainte `check` vérifie que `end_time ≥ start_time`, et un index unique `(tenant_id, driver_id, start_time)` empêche les chevauchements de plages.

### Règles métier

- **Planification des conducteurs** : Les dispatchers planifient des shifts en tenant compte des disponibilités, des temps de repos légaux et des restrictions de la plateforme. Les shifts peuvent être modifiés ou annulés.
- **Suivi en temps réel** : Les intégrations GPS permettent de vérifier si le chauffeur est en ligne à l’heure prévue et de marquer le shift comme `completed` à la fin.
- **Rémunération** : Les heures de shift sont utilisées pour calculer les primes et pour détecter les anomalies (ex. double shift, décalage). Les sanctions pour absence sont appliquées via `rid_driver_requests`.

### Propositions d’amélioration

1. **Types de shift** : ajouter un champ `shift_type` (jour, nuit, week‑end) pour appliquer des coefficients (ex. prime de nuit). Cela peut être un ENUM ou une table référentielle.
2. **Lien avec les zones géographiques** : ajouter `location_id` ou `zone_id` pour regrouper les chauffeurs par zone (centre-ville, aéroport). Cela aide à l’optimisation du dispatch.
3. **Simplification des statuts** : utiliser un type ENUM (`scheduled`,`completed`,`cancelled`,`no_show`) pour éviter les chaînes libres ; ajouter `reason` en cas d’annulation ou d’absence.
4. **Audit complet** : ajouter `approved_by` pour savoir qui a validé le shift, et `check_in_at`/`check_out_at` pour suivre les heures réelles.

### Impact

Ces ajouts améliorent la précision de la planification et de la rémunération. La granularité supplémentaire supporte les exigences réglementaires (temps de repos) et les primes variables.

## Table `sch_tasks`

### Modèle existant

`sch_tasks` enregistre les tâches à accomplir (administratives, de maintenance ou de formation). Les champs : `task_type`, `description`, `target_id` (identifiant de l’entité concernée : véhicule, chauffeur, document), `due_at`, `status` (`pending`, `in_progress`, `completed`, `cancelled`, `overdue`), `metadata` et les audits. Les index facilitent les recherches par `tenant_id`, `target_id`, `due_at` et `status`.

### Règles métier

- **Gestion des tâches** : Les managers créent des tâches pour eux‑mêmes ou pour les membres de leur équipe (maintenance à prévoir, document à vérifier, contrat à signer). Les tâches sont assignées à un membre ou un rôle via le champ `target_id` et un lien dans `metadata`.
- **Priorisation et suivi** : Des rappels sont envoyés à l’approche de `due_at`. Les tâches `overdue` sont escaladées. La modification du statut est consignée dans les logs.

### Propositions d’amélioration

1. **Assignation explicite** : ajouter `assigned_to` et `assigned_at` pour savoir qui doit réaliser la tâche ; lier `assigned_to` à `adm_members` ou `adm_provider_employees` selon la nature de la tâche.
2. **Typologie normalisée** : créer une table `sch_task_types` (ex. `verify_document`, `schedule_maintenance`, `approve_invoice`) permettant d’associer des gabarits (deadline par défaut, étapes). Remplacer `task_type` par une clé étrangère.
3. **Commentaires et pièces jointes** : ajouter `comments` et `attachment_url` pour suivre les échanges et stocker des preuves (captured via `sup_ticket_messages`).
4. **Automatisation** : intégrer des triggers pour générer automatiquement des tâches lors d’un événement (documents expirant, entretien planifié). Les tâches générées automatiquement doivent porter un flag `auto_generated`.

### Impact

Ces améliorations feront de `sch_tasks` un outil de suivi performant, intégrable à l’ERP et aux modules support (tickets) et maintenance. Elles améliorent la visibilité et la collaboration au sein de l’équipe.

## Table `sch_maintenance_schedules`

### Modèle existant

Cette table planifie les maintenances programmées (vidange, inspection). Les colonnes : `vehicle_id`, `scheduled_date`, `maintenance_type`, `status` (`scheduled`, `completed`, `cancelled`), `metadata` et les audits. Un index unique `(tenant_id, vehicle_id, scheduled_date, maintenance_type)` évite les doublons. La table se veut complémentaire de `flt_vehicle_maintenance` et peut servir de base à un calendrier de rappel.

### Règles métier

- **Rappel et planification** : un planning est généré selon les politiques de maintenance (ex. vidange tous les 10 000 km ou tous les 6 mois). L’équipe de flotte est notifiée, et le véhicule est bloqué en période de maintenance via les tables `sch_shifts` et `flt_vehicle_events`【567670092230000†L153-L178】.
- **Suivi du statut** : un rendez‑vous passe de `scheduled` à `completed` lorsque l’entretien est réalisé, sinon à `cancelled`.

### Propositions d’amélioration

1. **Enum et référentiels** : convertir `maintenance_type` en Enum (`oil_change`, `service`, `inspection`, `brake_service`, etc.), aligné avec `flt_vehicle_maintenance`. Créer une table `dir_maintenance_types` avec la fréquence recommandée (km ou mois) et l’unité pour gérer les rappels.
2. **Notification et suivi** : ajouter `reminder_sent_at` et `scheduled_by` pour savoir qui a planifié. Ajouter un lien vers `flt_vehicle_maintenance` (colonne `maintenance_id`) une fois la maintenance réalisée, afin de relier la planification à l’exécution.
3. **Alignement multi‑pays** : ajouter `country_code` si les règles diffèrent selon le pays. Stocker des paramètres (règles d’entretien) dans `metadata`.

### Impact

Ces ajouts permettront une planification plus fine et une meilleure traçabilité des entretiens réalisés par rapport aux rappels. L’alignement avec `dir_maintenance_types` simplifie la maintenance du référentiel.

## Table `trp_client_invoices`

### Modèle existant

`trp_client_invoices` génère les factures clients pour les courses facturables à une entreprise (par exemple, contrats B2B). Les colonnes principales : `client_id`, `invoice_number`, `invoice_date`, `due_date`, `total_amount`, `currency`, `status` (`draft`, `sent`, `paid`, `cancelled`, `overdue`), `metadata` et les audits. Un index unique `(tenant_id, invoice_number)` garantit l’unicité.

### Règles métier

- **Facturation B2B** : certaines courses (trajets d’entreprise) sont facturées périodiquement à un client. Les factures peuvent regrouper plusieurs voyages ou services. Le statut évolue selon l’envoi et le paiement.
- **Gestion de la TVA et des devises** : les champs `currency` et `total_amount` permettent de gérer la facturation en devise locale. Les conditions de paiement déterminent `due_date`. Les pénalités pour retard sont appliquées lorsque le statut passe à `overdue`.

### Propositions d’amélioration

1. **Lien avec un plan tarifaire** : ajouter `pricing_plan_id` pour savoir quel tarif a été utilisé (ex. forfait mensuel, tarif par course). Ajouter `client_po_number` pour la référence client.
2. **Détail des lignes** : créer une table `trp_client_invoice_lines` pour stocker les détails (course, quantité, prix unitaire). Cela permet de générer des rapports précis et d’aligner la facturation sur le module de revenus.
3. **Statut enrichi** : utiliser un ENUM (`draft`, `sent`, `viewed`, `paid`, `partially_paid`, `cancelled`, `overdue`). Ajouter `paid_at`, `payment_reference` et `payment_method` pour suivre le règlement.
4. **Automatisation** : générer les factures automatiquement à partir des données de `trp_trips` et de `rev_driver_revenues`, selon la périodicité (mensuelle/trimestrielle). Les factures peuvent être envoyées par email via le module Support.

### Impact

La création de lignes de facture implique des modifications mineures sur le module financier et sur l’API de facturation. La gestion du statut enrichi améliore la relation client et la gestion des paiements.

## Table `trp_platform_accounts`

### Modèle existant

`trp_platform_accounts` stocke les identifiants des comptes de chaque tenant sur les plateformes partenaires (Uber, Bolt, etc.). Les colonnes principales : `platform_id`, `account_identifier` (numéro de compte ou email), `api_key` (jeton pour l’API), `metadata` et les audits. Un index unique `(tenant_id, platform_id)` empêche d’avoir plusieurs comptes pour la même plateforme.

### Règles métier

- **Connexion aux plateformes** : chaque tenant doit relier son compte entreprise sur les plateformes de covoiturage. Les identifiants et API keys sont utilisés pour importer les courses, les revenus et gérer les statuts en temps réel【611243862873268†L268-L280】. Les clés secrètes doivent être stockées de manière sécurisée.
- **Paramétrage** : des paramètres propres au tenant et à la plateforme sont stockés dans `metadata` (par exemple, commissions, taxes locales, autorisations de paiement en cash). En cas de changement d’API, la colonne `api_key` est mise à jour.

### Propositions d’amélioration

1. **Champ `status`** : ajouter un champ `status` (`active`, `inactive`, `suspended`) pour permettre la désactivation temporaire d’un compte sans le supprimer. Ajouter `connected_at` pour savoir quand la connexion a été réalisée.
2. **Gestion multi‑clés** : permettre plusieurs clés par compte en ajoutant une table `trp_platform_account_keys` (clé, type, date d’expiration). Cela facilite la rotation des clés et la gestion des permissions (lecture seule, écriture).
3. **Sécurité et chiffrement** : stocker le `api_key` sous une forme chiffrée ou remplacer ce champ par `provider_credentials_id` pointant vers un coffre‑fort (Vault). L’application ne devrait pas stocker les clés en clair.
4. **Audit détaillé** : ajouter `last_sync_at`, `last_error` et `error_count` pour suivre l’état de la synchronisation et améliorer le support.

### Impact

Ces améliorations renforcent la sécurité et la résilience de l’intégration avec les plateformes. Elles impliquent de mettre à jour les services d’import et de synchronisation.

## Table `trp_settlements`

### Modèle existant

`trp_settlements` enregistre les règlements (settlements) effectués par les plateformes pour les courses. Elle contient `trip_id`, `settlement_reference`, `amount`, `currency`, `platform_commission`, `net_amount`, `settlement_date`, `status` (`pending`, `settled`, `cancelled`), `metadata` et les audits. Un index unique `(tenant_id, trip_id, settlement_reference)` garantit l’unicité par course.

### Règles métier

- **Liquidation des courses** : Les plateformes paient les courses aux opérateurs selon un rythme défini (quotidien, hebdomadaire). Le `platform_commission` est déduit et `net_amount` correspond à la somme reversée au tenant, qui servira à payer le chauffeur et l’investisseur. Les statuts reflètent le traitement de chaque paiement.
- **Réconciliation** : Les `settlements` sont comparés aux revenus importés ; en cas d’écart, une réconciliation est créée dans `rev_reconciliations`.

### Propositions d’amélioration

1. **Statut détaillé et dates** : ajouter `paid_at` et `cancelled_at` pour connaître les dates de paiement ou d’annulation. Ajouter un champ `settlement_type` (`platform_payout`, `adjustment`, `refund`) pour distinguer les types de règlements.
2. **Reférences externes** : ajouter `platform_settlement_id` pour stocker la référence fournie par la plateforme. Cela facilite la vérification.
3. **Multi‑devises et taxes** : ajouter `tax_amount` et `tax_rate` pour calculer la TVA ou l’impôt retenu ; ajouter `exchange_rate` si le paiement est dans une devise différente.
4. **État analytique** : inclure un booléen `reconciled` ou un lien `reconciliation_id` vers `rev_reconciliations` afin de savoir si le settlement a été rapproché.

### Impact

Ces évolutions simplifient la gestion des règlements et permettent un suivi précis des paiements, améliorant la transparence vis-à-vis des chauffeurs et des investisseurs.

## Table `trp_trips`

### Modèle existant

`trp_trips` représente chaque course réalisée. Les champs clés : `driver_id`, `vehicle_id`, `platform_id`, `pickup_latitude/longitude`, `start_time`, `dropoff_latitude/longitude`, `end_time`, `distance_km`, `duration_minutes`, `payment_method` (cash/card/wallet/invoice), `platform_commission`, `net_earnings`, `status` (`completed`,`cancelled`,`rejected`,`no_show`), `client_id`, `trip_date`, `fare_base`, `fare_distance`, `fare_time`, `surge_multiplier`, `tip_amount`, `metadata` et les audits. Des index facilitent les recherches par date, chauffeur, véhicule, plateforme, etc.

### Règles métier

- **Enregistrement des courses** : les données proviennent des plateformes via l’API ou via les imports. Elles comprennent les coordonnées GPS, les heures de début et de fin, la distance, la durée et les revenus.
- **Calcul des revenus et commissions** : les champs `platform_commission` et `net_earnings` sont calculés selon les règles de la plateforme. Les commissions sont ensuite réparties entre le chauffeur et, le cas échéant, l’investisseur.
- **Statuts et annulations** : Les statuts permettent de gérer les annulations ou refus ; un `rejected` ou `no_show` peut déclencher une pénalité ou une protection contre la fraude.
- **Multi‑plateformes** : `platform_id` indique l’origine de la course. Chaque plateforme peut avoir ses propres champs additionnels (surge multiplier, incentive). Ces données sont stockées dans `metadata`.

### Propositions d’amélioration

1. **Timestamps unifiés** : renommer `start_time` et `end_time` en `started_at` et `finished_at` pour plus de cohérence. Ajouter `requested_at` et `matched_at` si l’on veut suivre toutes les étapes du cycle d’une course (demande, acceptation, départ, arrivée). Cela peut aider à améliorer l’assignation.
2. **Enum et tables de référence** : transformer `payment_method` et `status` en ENUM ou en tables référentielles pour assurer la cohérence ; ajouter un champ `reason` pour les annulations/rejets.
3. **Intégration de la géolocalisation** : créer une table `trp_trip_segments` permettant de stocker un chemin approximatif (itinéraire et vitesse) pour les analyses de sécurité et de performance ; ou stocker un `polyline` compressé dans `metadata`.
4. **Analytique** : ajouter `wait_time` (temps d’attente avant le départ) et `idle_time` (entre l’arrivée et la prochaine course) pour calculer la productivité. Ajouter `service_type` (UberX, Comfort, BoltBlack) pour déterminer les catégories de revenus.
5. **Off-boarding** : ajouter `cancelled_at` ou `rejected_at` pour dater l’annulation et stocker l’identifiant du client ou du chauffeur à l’origine de la demande.

### Impact

Ces modifications amélioreront l’analyse des performances (durées d’attente et idle), la prédiction des revenus et la transparence vis-à-vis des chauffeurs. Elles nécessitent d’ajuster les importateurs.

## Table `sup_tickets`

### Modèle existant

`sup_tickets` gère les tickets de support. Elle contient `raised_by` (membre du tenant), `subject`, `description`, `status` (`open`,`pending`,`resolved`,`closed`), `priority` (`low`,`medium`,`high`), `assigned_to` (employé de Fleetcore), `metadata`, et les audits. Un index unique `(tenant_id, raised_by, created_at)` garantit l’unicité pour un même utilisateur dans un laps de temps.

### Règles métier

- **Gestion des demandes** : les administrateurs et chauffeurs créent des tickets pour signaler des problèmes (bugs, erreurs de facturation, demandes de fonctionnalités). Les tickets passent par plusieurs statuts jusqu’à leur résolution. La priorité oriente l’ordre de traitement.
- **Assignment** : Les tickets peuvent être assignés à un employé (via `assigned_to`) ou laissés dans la file d’attente. Lorsqu’un ticket est résolu, un mail est envoyé au demandeur.
- **Intégration avec l’historique** : les tickets et leur conversation sont liés à la table `sup_ticket_messages` ; un ticket résolu peut générer une note de satisfaction dans `sup_customer_feedback`.

### Propositions d’amélioration

1. **Typologie et catégories** : ajouter `category` (support technique, facturation, formation) et `sub_category` pour mieux orienter les tickets. Ces champs peuvent être des clés étrangères vers des tables référentielles.
2. **Statuts enrichis et SLA** : utiliser un Enum (`new`,`open`,`waiting_client`,`waiting_internal`,`resolved`,`closed`) et ajouter `sla_due_at` pour suivre les délais de traitement. Ajouter `closed_at` et `resolution_notes`.
3. **Multilingue** : si la plateforme est multilingue, prévoir `language` pour savoir dans quelle langue répondre. Ajouter `attachments_url` pour que les utilisateurs puissent envoyer des captures d’écran ou des documents.
4. **Ciblage** : ajouter `source_platform` (`web`, `mobile`, `api`) et `raised_by_type` (`admin`, `driver`, `client`) pour aider à prioriser.

### Impact

Ces évolutions amélioreront l’efficacité du support, faciliteront l’analyse des tickets et permettront un meilleur reporting sur les SLA. Elles n’impactent pas la structure de `sup_ticket_messages` ou `sup_customer_feedback`, mais nécessitent de mettre à jour l’interface utilisateur et les notifications.

## Table `sup_ticket_messages`

### Modèle existant

Les messages liés aux tickets sont stockés ici. Les champs clés : `ticket_id` (FK vers `sup_tickets`), `sender_id` (membre ou employé), `message_body`, `sent_at`, `metadata` et les audits. Aucune contrainte sur le contenu ; les messages peuvent être écrits par les deux parties.

### Règles métier

- **Traçabilité** : chaque message appartient à un ticket et doit être horodaté. Les conversations sont visibles par l’initiateur du ticket et par l’équipe support. Les messages effacés sont conservés (soft delete).
- **Notifications** : dès qu’un message est posté, une notification par e‑mail ou push est envoyée à l’autre partie. Les réponses doivent rester dans le contexte du ticket.

### Propositions d’amélioration

1. **Thread et typologie** : ajouter un champ `message_type` (`public`, `internal`, `note`) pour distinguer les messages visibles par le client de ceux destinés uniquement à l’équipe. Ajouter un champ `parent_message_id` pour permettre des réponses en fil (thread).
2. **Média et pièces jointes** : ajouter `attachment_url` et `attachment_type` (image, PDF) pour permettre l’envoi de fichiers. Un micro‑service de stockage (comme Supabase Storage ou S3) peut gérer les fichiers.
3. **Multilingue et contenu structuré** : ajouter `language` pour faciliter la traduction et permettre un chatbot. Ajouter `metadata` (ex. sentiment score) pour alimenter des outils d’IA.

### Impact

Ces ajouts enrichissent les interactions avec les utilisateurs et permettent une meilleure collaboration interne, tout en restant compatibles avec la table `sup_tickets`.

## Table `sup_customer_feedback`

### Modèle existant

Cette table stocke les retours et notes des utilisateurs (chauffeurs, clients, invités) sur un ticket ou un service. Les colonnes : `submitted_by`, `submitter_type` (driver/client/member/guest), `feedback_text`, `rating` (1–5), `metadata` et les audits. Elle ne contient pas de `tenant_id` dans le DDL d’origine mais enregistre quand même les feedbacks par tenant via la colonne `tenant_id`. Les index facilitent la recherche par tenant et par date.

### Règles métier

- **Collecte de feedback** : après la résolution d’un ticket ou d’une prestation, une enquête est envoyée à l’utilisateur. Le feedback est utilisé pour améliorer le service et pour évaluer la performance de l’équipe support【241590307805986†L138-L146】.
- **Notation** : la note (1–5) est utilisée pour calculer la satisfaction moyenne, et peut influer sur les primes des agents. Les commentaires détaillés sont utilisés pour l’analytique.

### Propositions d’amélioration

1. **Lien avec le ticket et le chauffeur** : ajouter `ticket_id` (si le feedback concerne un ticket) et `driver_id` (si le retour concerne un chauffeur). Ajouter `service_type` (`ride`, `support`) pour savoir quel module est évalué.
2. **Multilingue et sentiment** : ajouter `language` et `sentiment_score` pour permettre un traitement automatique des retours. Utiliser l’IA pour catégoriser les retours (positif, neutre, négatif).
3. **Anonymat et RGPD** : ajouter un champ `is_anonymous` pour laisser la possibilité aux clients de rester anonymes. Ajouter `deleted_at` et `deleted_by` pour permettre la suppression des feedbacks à la demande.
4. **Reporting** : intégrer le feedback avec `rid_driver_performances` pour ajuster les formations des chauffeurs ; agréger les notes par période et par type de service.

### Impact

Ces améliorations permettent de mieux exploiter les retours clients, d’identifier les tendances et d’orienter les actions de formation et de support. Elles améliorent la conformité RGPD et la transparence vis-à-vis des utilisateurs.

---

### Conclusion générale

L’ensemble des améliorations proposées s’inscrit dans une démarche de **simplification et de plug‑and‑play** adaptée aux opérateurs de ride‑hailing. Plutôt que de gérer des processus lourds de maintenance ou de comptabilité, la plateforme se concentre sur des objets métier essentiels (chauffeurs, véhicules, revenus, courses, support) et s’intègre aux services externes (ride‑hailing platforms, GPS, fuel & maintenance, paiement & comptabilité)【611243862873268†L268-L280】. En normalisant les statuts via des ENUM et en ajoutant des références vers des tables spécialisées (types de documents, objectifs, tâches, etc.), Fleetcore garantit une **cohérence multi‑tenant** et une **extensibilité multi‑pays**. Les données restent faciles à exploiter pour la facturation, la paie, la planification et le support client.
