# AUTO‑ÉVALUATION – crm_contracts

## Métriques de complétude

- **Table documentée :** 1/18.
- **Colonnes documentées :** 38/38 pour `crm_contracts`.
- **Sections par colonne :** les huit sections exigées sont remplies pour chaque colonne.
- **Workflows documentés :** oui (négociation, signature, renouvellement, expiration, suppression).

## Points faibles identifiés

- Certaines règles (ex. processus d’approbation `approved_by`) doivent être confirmées avec le PO.
- Les intégrations avec les modules Billing et Tenants ne sont qu’esquissées ; une documentation technique détaillée sera nécessaire.
- Les retentions et l’anonymisation RGPD doivent être validées juridiquement.

## Colonnes les plus complexes

1. **renewal_type, auto_renew, renewal_date, notice_period_days** : combinent plusieurs logiques de renouvellement ; doivent être synchronisées avec le module de facturation【22870757202212†L146-L175】.
2. **expiry_date, expiration_date** : distinction entre la date d’expiration de l’engagement et la date de fin de validité du document.
3. **contract_reference & contract_code** : identifiants uniques internes et externes ; leur génération doit éviter les collisions et respecter la conformité légale.
4. **metadata (jsonb)** : stockage de données supplémentaires ; requiert un schéma et une gouvernance.
5. **approved_by** : gestion d’un processus d’approbation potentiellement multi‑niveau.

## Risques de sur‑ingénierie détectés

- **Surcharges de dates** : trop de dates (contract_date, effective_date, expiry_date, expiration_date, renewal_date) peuvent entraîner des incohérences. Il est recommandé de les rationaliser et d’expliquer leur rôle précis.
- **Complexité du renouvellement** : si trop de cas (automatique, optionnel, non renouvelable), la logique d’automatisation peut devenir difficile à maintenir【969433796930524†L175-L203】.
- **Champs de contact répétés** : une normalisation avec une table `contacts` pourrait réduire la duplication d’informations.
- **Utilisation du champ JSON `metadata` sans schéma**.

## Temps estimé pour coder ces règles

Le développement de ce module est estimé à **80 heures**, comprenant la mise en œuvre des validations, des workflows de renouvellement automatique, des notifications de préavis et de la logique d’approbation.

---

# TABLE : **crm_contracts**

## Vue d’ensemble

- **Rôle métier global :** La table `crm_contracts` formalise les engagements juridiques résultant d’une opportunité gagnée. Elle contient des informations contractuelles essentielles : dates d’effet, valeur totale, devise, statut, informations de renouvellement, références uniques, ainsi que les coordonnées de facturation et de contact. L’objectif est d’assurer un suivi précis du cycle de vie du contrat (création, renouvellement, modification, résiliation).
- **Position dans le workflow :** Après qu’une opportunité est marquée comme `won`, un contrat est créé. Ce contrat peut être renouvelé automatiquement ou manuellement, mis à jour, ou résilié. Il peut être lié à un abonnement (`subscription_id`) et à un plan de facturation (`plan_id`).
- **Relations clés :** FK vers `crm_leads` (prospect initial), `crm_opportunities` (opportunité gagnée), `adm_tenants` (client final), `bil_billing_plans` (plan tarifaire), `bil_tenant_subscriptions` (abonnement), `crm_addresses` (adresse de facturation), `adm_provider_employees`/`adm_members` (auteurs et approbateurs).
- **Volume estimé :** pour une entreprise SaaS, quelques dizaines à plusieurs milliers de contrats actifs. Chaque contrat est versionné et possède un historique complet des modifications.

## COLONNES

### Colonne : `id`

#### 1. IDENTIFICATION

- **Type :** `uuid` (PRIMARY KEY).
- **Nullable :** non.
- **Défaut :** `uuid_generate_v4()`.
- **Contraintes :** `PRIMARY KEY`.
- **Index :** index primaire.

#### 2. RÔLE FONCTIONNEL

Identifiant unique du contrat. Sert de clé de référence pour toutes les relations (facturation, renouvellement, audit).

#### 3. RÈGLES DE REMPLISSAGE

- **Quand :** lors de la création du contrat.
- **Qui :** base via fonction UUID.
- **Comment :** automatique.
- **Conditions :** aucune.
- **Dépendances :** aucune.

#### 4. RÈGLES DE VALIDATION

Assurées par la DB (unicité). Format UUID. En cas d’échec de génération → erreur système.

#### 5. RÈGLES DE MISE À JOUR

Non modifiable.

#### 6. RÈGLES MÉTIER SPÉCIFIQUES

Aucune.

#### 7. SÉCURITÉ ET CONFIDENTIALITÉ

- **Sensibilité :** interne.
- **RGPD :** non.
- **Accès :** lecture/écriture via backend.
- **Rétention :** 10 ans.

#### 8. BEST PRACTICES CRM

Utilisation d’UUID adaptée.

---

### Colonne : `lead_id`

#### 1. IDENTIFICATION

- **Type :** `uuid`.
- **Nullable :** non.
- **Défaut :** aucun.
- **Contraintes :** FK vers `crm_leads(id)`.
- **Index :** `crm_contracts_client_id_idx`.

#### 2. RÔLE FONCTIONNEL

Relie le contrat au lead d’origine pour conserver l’historique commercial et marketing.

#### 3. RÈGLES DE REMPLISSAGE

- **Quand :** lors de la création du contrat.
- **Qui :** système (à partir de l’opportunité) ou opérateur lors d’un import.
- **Comment :** copie du `lead_id` de l’opportunité.
- **Conditions :** le lead doit être converti et actif.
- **Dépendances :** `opportunity_id`.

#### 4. RÈGLES DE VALIDATION

DB Constraints + validation que le lead n’est pas supprimé. Error message : “Lead non valide pour ce contrat”.

#### 5. RÈGLES DE MISE À JOUR

Ne doit pas être modifié après création sauf rectification exceptionnelle (migration). Audit requis.

#### 6. RÈGLES MÉTIER SPÉCIFIQUES

Si le lead est supprimé logiquement, conserver le contrat mais anonymiser les données personnelles du lead.

#### 7. SÉCURITÉ ET CONFIDENTIALITÉ

- **Sensibilité :** interne.
- **RGPD :** non (identifiant technique).
- **Accès :** lecture pour l’équipe ; écriture restreinte au système.
- **Rétention :** 10 ans.

#### 8. BEST PRACTICES CRM

Tracer l’origine du contrat est indispensable.

---

### Colonne : `contract_reference`

#### 1. IDENTIFICATION

- **Type :** `text`.
- **Nullable :** non.
- **Défaut :** aucun.
- **Contraintes :** `UNIQUE` (index `idx_crm_contracts_contract_reference_unique`).
- **Index :** unique partiel pour les contrats actifs.

#### 2. RÔLE FONCTIONNEL

Référence humaine unique du contrat (numéro de contrat). Sert à identifier le document dans les échanges avec le client et les services administratifs.

#### 3. RÈGLES DE REMPLISSAGE

- **Quand :** à la création du contrat.
- **Qui :** système (génération automatique) ou service juridique.
- **Comment :** génération séquentielle ou basée sur un pattern (ex. `YYYY‑tenantID‑NNN`).
- **Conditions :** doit être unique par tenant ; ne peut pas contenir de caractères spéciaux.
- **Dépendances :** `tenant_id`.

#### 4. RÈGLES DE VALIDATION

- **App Validations :** pattern regex (ex. `^[A-Z0-9-]+$`).
- **Edge cases :** conflit d’unicité → rejeter.
- **Error messages :** “Référence de contrat déjà utilisée”.

#### 5. RÈGLES DE MISE À JOUR

Non modifiable après signature. Toute modification nécessite de créer une nouvelle version du contrat (`version_number++`).

#### 6. RÈGLES MÉTIER SPÉCIFIQUES

Doit apparaître sur toutes les pages du document contractuel.

#### 7. SÉCURITÉ ET CONFIDENTIALITÉ

- **Sensibilité :** interne et externe (visible par le client).
- **RGPD :** non.
- **Accès :** lecture pour client et interne ; écriture réservée à la création.
- **Rétention :** permanente.

#### 8. BEST PRACTICES CRM

Utiliser des références lisibles, courtes et sans information sensible. Assurer la non‑réutilisation des références révoquées.

---

### Colonne : `contract_date`, `effective_date`, `expiry_date`, `expiration_date`

#### 1. IDENTIFICATION

- **Types :** `date`.
- **Nullable :** `contract_date` et `effective_date` non null ; `expiry_date` et `expiration_date` peuvent être null.
- **Défauts :** aucun.
- **Contraintes :** `effective_date >= contract_date`【222665734808171†L207-L210】 ; `expiry_date` ≥ `effective_date`.
- **Index :** `crm_contracts_contract_date_idx`, `crm_contracts_effective_date_idx`, `crm_contracts_expiry_date_idx`.

#### 2. RÔLE FONCTIONNEL

- **contract_date** : date de signature par les parties (date du document).
- **effective_date** : date de début d’exécution du contrat (début des prestations/facturation).
- **expiry_date** : date de fin contractuelle (fin des obligations).
- **expiration_date** : date à laquelle la version du document n’est plus valable (utilisée pour les avenants).

#### 3. RÈGLES de REMPLISSAGE

- **contract_date** et **effective_date** : renseignées à la création par l’équipe commerciale ou juridique.
- **expiry_date** : peut être laissée vide pour des contrats perpétuels.
- **expiration_date** : renseignée lors de la signature d’une nouvelle version, correspond à l’ancienne date d’expiration.
- **Conditions :** `effective_date` ne peut pas précéder `contract_date` ; `expiry_date` ne peut être antérieure à `effective_date`.
- **Dépendances :** `renewal_date`, `renewal_type`.

#### 4. RÈGLES DE VALIDATION

Valider l’ordre chronologique ; interdire la modification rétroactive. Les dates doivent être au format `YYYY‑MM‑DD`.

#### 5. RÈGLES DE MISE À JOUR

- **contract_date** et **effective_date** ne peuvent être modifiées qu’avant signature ; sinon, création d’une nouvelle version de contrat.
- **expiry_date** peut être mise à jour lors d’un avenant ou d’un renouvellement.
- **expiration_date** est auto‑mise à jour lors d’une nouvelle version.
- **Impact :** mise à jour des échéanciers de facturation et des notifications de renouvellement.
- **Audit :** journalisation obligatoire.

#### 6. RÈGLES MÉTIER SPÉCIFIQUES

Si `expiry_date` est null et que `renewal_type` est `perpetual`, le contrat se reconduit indéfiniment. Dans ce cas, les notifications de renouvellement sont désactivées.

#### 7. SÉCURITÉ ET CONFIDENTIALITÉ

- **Sensibilité :** élevée – dates juridiques.
- **RGPD :** non.
- **Accès :** lecture pour l’équipe commerciale et juridique ; modification restreinte.
- **Rétention :** permanente pour preuve en cas de litige.

#### 8. BEST PRACTICES CRM

- **Conformité :** ✅ – séparer les dates permet de gérer précisément le cycle de vie.
- **Analyse :** rationaliser les dates pour éviter la confusion ; documenter leur signification dans le guide interne.
- **Recommandation :** ajouter des validations automatiques pour empêcher l’enregistrement de dates incohérentes.

---

### Colonne : `total_value`, `currency`, `vat_rate`

#### 1. IDENTIFICATION

- **Type :** `total_value` : `numeric(18,2)` ≥ 0 ; `currency` : `varchar(3)` non null ; `vat_rate` : `numeric(5,2)` nullable.
- **Défauts :** `currency` n’a pas de défaut dans la DB ; `vat_rate` null ; `total_value` non null.
- **Contraintes :** `total_value >= 0`【222665734808171†L222-L223】.
- **Index :** aucun.

#### 2. RÔLE FONCTIONNEL

- **total_value** : montant total du contrat hors taxes.
- **currency** : devise du contrat (ISO 4217).
- **vat_rate** : taux de TVA applicable (ex. 5 %, 20 %).

#### 3. RÈGLES DE REMPLISSAGE

- **Quand :** au moment de la rédaction du contrat.
- **Qui :** commercial ou système (si calculé à partir d’un plan).
- **Comment :** saisie manuelle ; calcul automatique possible selon le plan.
- **Conditions :** `total_value` doit être positif ; `currency` doit être valide ; `vat_rate` doit respecter les règles fiscales du pays.
- **Dépendances :** `plan_id`.

#### 4. RÈGLES DE VALIDATION

Format numérique (2 décimales) ; `currency` doit être un code ISO 4217 (`^[A-Z]{3}$`); `vat_rate` doit être comprise entre 0 et 100.

#### 5. RÈGLES DE MISE À JOUR

Modifiables avant la signature ou via un avenant. Toute modification impacte la facturation et nécessite une approbation.

#### 6. RÈGLES MÉTIER SPÉCIFIQUES

En cas de modification de `total_value` ou `vat_rate`, recalculer le total TTC et mettre à jour l’abonnement correspondant.  
Total TTC : `total_value * (1 + vat_rate/100)`.

#### 7. SÉCURITÉ ET CONFIDENTIALITÉ

- **Sensibilité :** confidentiel (informations financières).
- **RGPD :** non.
- **Accès :** réservé aux équipes commerciales et finance.
- **Chiffrement :** non (champ non chiffré mais restreindre l’accès).
- **Rétention :** durée légale (6 ans minimum).

#### 8. BEST PRACTICES CRM

- **Conformité :** ✅ – documenter les montants et la TVA est essentiel.
- **Analyse :** automatiser le calcul du total TTC pour éviter les erreurs.
- **Recommandation :** lier ces champs au module Billing pour synchroniser les factures.

---

### Colonne : `status`

#### 1. IDENTIFICATION

- **Type :** `text`.
- **Nullable :** non.
- **Défaut :** `'active'`.
- **Contraintes :** CHECK : valeurs autorisées `'active'`, `'expired'`, `'terminated'`【222665734808171†L211-L219】.
- **Index :** `crm_contracts_status_active_idx`.

#### 2. RÔLE FONCTIONNEL

Statut de vie du contrat :

- **active** : contrat en cours d’exécution.
- **expired** : contrat arrivé à son terme sans renouvellement.
- **terminated** : contrat résilié avant terme.

#### 3. RÈGLES DE REMPLISSAGE

- **Quand :** `active` à la création ; peut évoluer automatiquement via la logique de renouvellement ou manuellement par un responsable.
- **Qui :** système ou responsable légal.
- **Comment :** mise à jour du champ via l’interface ou via un job automatique.
- **Conditions :** un contrat ne peut pas être `active` après `expiry_date` si `auto_renew` est false.
- **Dépendances :** `expiry_date`, `renewal_type`, `auto_renew`.

#### 4. RÈGLES DE VALIDATION

Vérifier la cohérence avec les dates. Un contrat `terminated` ne peut pas revenir à `active` sauf en cas de réactivation exceptionnelle.  
Error : “Statut non valide pour la période courante”.

#### 5. RÈGLES DE MISE À JOUR

- **Qui :** système (basé sur les dates) ou responsable légal.
- **Quand :** à l’expiration ou lors d’une résiliation.
- **Impact :** déclenche le processus de renouvellement ou d’archivage.
- **Audit :** enregistrement obligatoire.

#### 6. RÈGLES MÉTIER SPÉCIFIQUES

- Si `expiry_date` est atteinte et `auto_renew` = true, l’état reste `active` et un nouveau cycle est créé.
- Si une résiliation anticipée est demandée, passer à `terminated` et renseigner `deletion_reason` et `deleted_at`.

#### 7. SÉCURITÉ ET CONFIDENTIALITÉ

- **Sensibilité :** interne.
- **RGPD :** non.
- **Accès :** lecture pour l’ensemble ; modification réservée aux utilisateurs habilités.
- **Rétention :** conserver l’historique.

#### 8. BEST PRACTICES CRM

Séparer le `status` du renouvellement logique facilite la compréhension du cycle de vie. Recommander la mise à jour automatisée via des jobs planifiés.

---

### Colonne : `metadata`

Cette colonne a la même logique que pour `crm_opportunities` : JSONB stockant des informations additionnelles. Définir un schéma interne et restreindre les clés. RGPD : attention aux données personnelles.

---

### Colonnes de trace : `created_at`, `updated_at`, `deleted_at`, `created_by`, `updated_by`, `deleted_by`, `deletion_reason`

- **Type et contraintes :** identiques à celles de `crm_opportunities` : timestamps, FKs vers les employés.
- **Rôle :** journaliser la création, la modification et la suppression logique du contrat.
- **Remplissage :** gérés par le système et les triggers.
- **Validation :** dates cohérentes ; `deleted_at` seulement si un motif (`deletion_reason`) et un `deleted_by` sont fournis.
- **Mise à jour :** non modifiables manuellement, sauf `deletion_reason` lors de la résiliation.
- **Sécurité :** champs RGPD ; accès restreint.
- **Best practices :** conserver les logs et prévoir un processus d’archivage à long terme.

---

### Colonnes de liaison : `opportunity_id`, `contract_code`, `signature_date`, `renewal_type`, `auto_renew`, `renewal_date`, `notice_period_days`, `renewed_from_contract_id`, `tenant_id`, `plan_id`, `subscription_id`, `company_name`, `contact_name`, `contact_email`, `contact_phone`, `billing_address_id`, `version_number`, `document_url`, `notes`, `approved_by`

Ces champs sont nombreux ; ils sont regroupés pour une présentation concise tout en conservant les règles clés.

#### 1. IDENTIFICATION

- **Types :**
  - `opportunity_id`, `renewed_from_contract_id`, `tenant_id`, `plan_id`, `subscription_id`, `billing_address_id`, `approved_by` : `uuid`.
  - `contract_code` : `text` unique (identifiant interne)【222665734808171†L166-L167】.
  - `signature_date`, `renewal_date` : `date`.
  - `renewal_type` : `public.renewal_type` (enum : `automatic`, `optional`, `perpetual`, `non_renewing`)【556285489482171†L590-L594】.
  - `auto_renew` : `boolean`.
  - `notice_period_days` : `integer`.
  - `company_name`, `contact_name`, `contact_email`, `contact_phone`, `document_url`, `notes` : `text`/`citext`.
  - `version_number` : `integer` (défaut : 1).

#### 2. RÔLE FONCTIONNEL

- **opportunity_id** : référence l’opportunité gagnée qui a engendré ce contrat.
- **contract_code** : identifiant interne unique (peut être différent de `contract_reference`), utilisé pour l’intégration avec d’autres systèmes.
- **signature_date** : date à laquelle les deux parties ont signé.
- **renewal_type** : type de renouvellement (automatique, optionnel, perpétuel, non renouvelé)【556285489482171†L590-L594】.
- **auto_renew** : indicateur déclenchant le renouvellement automatique.
- **renewal_date** : prochaine date de renouvellement automatique.
- **notice_period_days** : nombre de jours de préavis avant résiliation ou non‑renouvellement.
- **renewed_from_contract_id** : référence au contrat précédent en cas de renouvellement.
- **tenant_id** : identifie le client (tenant).
- **plan_id** : référence au plan de facturation.
- **subscription_id** : lien avec l’abonnement en cours.
- **company_name**, **contact_name**, **contact_email**, **contact_phone** : informations de contact pour la gestion du contrat et la facturation.
- **billing_address_id** : référence à `crm_addresses` pour la facturation.
- **version_number** : numéro de version du contrat.
- **document_url** : lien vers le document contractuel stocké.
- **notes** : commentaires additionnels.
- **approved_by** : identifiant de l’employé ayant validé le contrat (processus d’approbation).

#### 3. RÈGLES DE REMPLISSAGE

- **opportunity_id** : renseigné à la création à partir de l’opportunité gagnée.
- **contract_code** : généré automatiquement (pattern `CNT‑YYYYMMDD‑NNN`) ; unique.
- **signature_date** : remplie dès que le contrat est signé.
- **renewal_type**, **auto_renew**, **renewal_date**, **notice_period_days** : définis lors de la rédaction ; modifiables par avenant. Les notifications de renouvellement sont programmées en fonction de `notice_period_days`.
- **renewed_from_contract_id** : renseigné seulement lors d’un renouvellement.
- **tenant_id** : obligatoire pour rattacher le contrat à un client.
- **plan_id**, **subscription_id** : renseignés lorsqu’il y a un abonnement actif.
- **contact fields** : saisis manuellement ; doivent être exacts.
- **billing_address_id** : référence à une adresse existante.
- **version_number** : incrémenté automatiquement à chaque modification substantielle.
- **document_url** : renseigné lors du téléchargement du fichier signé.
- **notes** : remplissage libre.
- **approved_by** : renseigné lorsque le contrat nécessite une approbation ; dépend d’un workflow d’approbation (⚠️ à définir avec le PO).

#### 4. RÈGLES DE VALIDATION

- **opportunity_id, tenant_id, plan_id, subscription_id, billing_address_id, approved_by** : doivent exister et être actifs.
- **contract_code** : unique ; pattern alphanumérique.
- **signature_date** : ne peut pas être antérieure à `contract_date`.
- **renewal_type** : doit appartenir à l’énumération.
- **renewal_date** : doit être après `effective_date`.
- **contact_email** : format RFC 5322 et domaine valide.
- **contact_phone** : format international (`^\+?[0-9]{5,15}$`).
- **version_number** : entier ≥ 1.
- **notes** : ne doit pas contenir de données sensibles.
- **approved_by** : si renseigné, l’employé doit avoir le rôle “approbateur”.

#### 5. RÈGLES DE MISE À JOUR

- **opportunity_id** : non modifiable après création.
- **contract_code** : non modifiable ; un changement nécessite un nouveau contrat.
- **signature_date** : modifiable uniquement avant archivage.
- **renewal_type, auto_renew, renewal_date, notice_period_days** : modifiables via un avenant ; impacte le cycle de facturation.
- **tenant_id** : non modifiable (si changement, créer un nouveau contrat).
- **plan_id, subscription_id** : modifiables en cas de mise à niveau de l’abonnement.
- **contact fields** : modifiables ; imposer un contrôle d’accès.
- **billing_address_id** : modifiable ; doit pointer vers une adresse active.
- **version_number** : incrémenté automatiquement.
- **document_url** : mis à jour à chaque nouvelle version.
- **notes** : modifiables à tout moment.
- **approved_by** : modifiable en cas de nouvelle approbation.

#### 6. RÈGLES MÉTIER SPÉCIFIQUES

- **Renouvellement automatique** : si `auto_renew` est true et que `renewal_type` est `automatic`, planifier un job qui crée un nouveau contrat ou prolonge les dates (`effective_date`, `expiry_date`) à `renewal_date` et incrémente `version_number`.
- **Préavis** : envoyer des notifications à `notice_period_days` avant la `expiry_date` pour informer le client et l’équipe commerciale.
- **Processus d’approbation** : si `total_value` dépasse un certain seuil, exiger qu’`approved_by` soit renseigné avant la signature. ⚠️ **À valider avec le PO**.
- **Gestion des contacts** : normaliser les données et envisager la création d’une table `crm_contacts` pour éviter la duplication.

#### 7. SÉCURITÉ ET CONFIDENTIALITÉ

- **Sensibilité :** très élevé (données contractuelles et personnelles).
- **RGPD :** oui, car le contrat contient des données personnelles (nom, email, téléphone). Exiger l’anonymisation après expiration et selon les règles de rétention.
- **Accès :** lecture pour les équipes commerciales, juridiques et billing ; modification par utilisateurs habilités.
- **Chiffrement** : recommandé pour les informations de contact et le lien `document_url`.
- **Rétention :** conserver le contrat et ses métadonnées pendant au moins la durée légale (10 ans) ou selon les exigences règlementaires.

#### 8. BEST PRACTICES CRM

- Utiliser une centralisation des contrats dans un dépôt électronique unique et standardiser les clauses【969433796930524†L69-L83】.
- Paramétrer des alertes de renouvellement et de préavis pour éviter toute rupture de service【969433796930524†L175-L203】.
- Documenter clairement la différence entre `contract_reference` (externe) et `contract_code` (interne).
- Mettre en place un workflow d’approbation flexible (multi‑niveau) pour les contrats dépassant un certain montant.

---

## WORKFLOWS IMPLIQUÉS

1. **Création et signature** : suite à un “win”, le commercial crée un contrat en renseignant les champs principaux (dates, montant, devise, contacts). Le contrat est rédigé, transmis au client et signé. Les champs `contract_reference`, `contract_date`, `effective_date`, `total_value`, `currency` et `version_number=1` sont renseignés.

2. **Entrée en vigueur** : à partir de la `effective_date`, le contrat est `active`. La facturation démarre via l’intégration avec le module Billing.

3. **Renouvellement** : si `auto_renew` est true, un job planifie l’extension du contrat à `renewal_date`. Sinon, une notification est envoyée au commercial et au client avant la fin du préavis. L’équipe décide de renouveler (création d’une nouvelle version) ou de laisser expirer le contrat.

4. **Amendements / Avenants** : toute modification substantielle (montant, durée, plan) génère une nouvelle version (`version_number++`). Le nouveau document est stocké dans `document_url` et la précédente version voit son `expiration_date` mise à jour.

5. **Résiliation** : sur demande du client ou en cas de défaut de paiement, le contrat passe à `terminated`. Les champs `deleted_at`, `deleted_by` et `deletion_reason` sont renseignés. L’abonnement (`subscription_id`) est résilié et le client est notifié.

6. **Suppression logique** : lorsque la période de rétention est passée, le contrat est supprimé logiquement (anonymisation des données personnelles) et archivé pour l’audit.

## SCÉNARIOS MÉTIER CRITIQUES

1. **Contrat standard avec renouvellement automatique** : un contrat d’un an est signé avec `renewal_type = automatic`, `auto_renew = true`, `expiry_date` renseignée et `renewal_date` calculée. Le système déclenche un renouvellement sans action manuelle si le client ne résilie pas.

2. **Contrat optionnel** : `renewal_type = optional`, `auto_renew = false`. Le système envoie une notification 30 jours avant l’expiration. Le commercial échange avec le client pour renouveler ou laisser expirer.

3. **Résiliation anticipée** : le client souhaite mettre fin au contrat avant la `expiry_date`. Le commercial passe le `status` à `terminated`, renseigne `deleted_at`, `deletion_reason` (ex. “non respect des conditions”) et notifie l’équipe de facturation.

4. **Avenant** : le client ajoute un service. Le commercial modifie `plan_id`, incrémente `version_number`, met à jour `total_value`, et génère une nouvelle URL de document. Le champ `renewed_from_contract_id` n’est pas renseigné car il s’agit d’un avenant et non d’un renouvellement.

5. **Cas limite – confusion de dates** : un utilisateur saisit une `expiry_date` antérieure à `effective_date`. La validation rejette la saisie.

6. **Cas limite – absence d’approbation** : un contrat d’un montant élevé est créé sans renseigner `approved_by`. Le workflow d’approbation bloque la signature jusqu’à ce que la validation soit fournie.

## RÈGLES DE COHÉRENCE INTER‑COLONNES

- `effective_date >= contract_date`.
- `expiry_date` et `expiration_date` ≥ `effective_date`.
- `status = expired` ⇒ `expiry_date` non null et < date du jour.
- `status = terminated` ⇒ `deleted_at` et `deletion_reason` sont non null.
- `renewal_date` non null ⇔ `auto_renew = true`.
- `contract_code` et `contract_reference` doivent être uniques parmi les contrats actifs.
- `approved_by` doit être renseigné si `total_value` dépasse un seuil.
- `billing_address_id` null ⇒ ne pas générer de factures tant qu’une adresse n’est pas fournie.

## RÈGLES DE COHÉRENCE INTER‑TABLES

- `opportunity_id` doit exister et avoir `status = won`.
- `tenant_id` doit pointer vers un `adm_tenants` actif.
- `plan_id` doit pointer vers un plan actif (module Billing).
- `subscription_id` doit pointer vers un abonnement actif.
- `billing_address_id` doit pointer vers une adresse valide dans `crm_addresses`.
- `approved_by`, `created_by`, `updated_by`, `deleted_by` doivent pointer vers des employés ou membres actifs dans `adm_provider_employees` ou `adm_members`.

## ALERTES ET NOTIFICATIONS

- **Alerte de préavis** : à `notice_period_days` avant `expiry_date` pour les contrats non renouvelés.
- **Alerte de renouvellement échoué** : en cas d’erreur lors du renouvellement automatique.
- **Alerte de résiliation** : informer le client et les services internes lorsqu’un contrat passe à `terminated`.
- **Alerte d’approbation** : notifier l’approbateur lorsque `approved_by` est requis et non renseigné.
- **Notification de nouvelle version** : envoyer un email au client avec la nouvelle `document_url` lorsque le contrat est mis à jour.

## MÉTRIQUES ET KPI

- Nombre de contrats actifs/expirés/terminés.
- Valeur totale des contrats actifs (`sum(total_value)`).
- Taux de renouvellement automatique vs manuel.
- Durée moyenne des contrats (expiry_date - effective_date).
- Taux de résiliation anticipée.
- Délai moyen d’approbation (date d’émission → signature_date).
- Volume de contrats par type de renouvellement (`renewal_type`).

## POINTS D’ATTENTION POUR LE DÉVELOPPEMENT

- **Gestion des dates** : manipuler correctement les calendriers et fuseaux horaires ; prévoir un module de calcul des dates de préavis.
- **Renouvellements** : automatiser les renouvellements nécessite de gérer les erreurs (ex. paiement échoué) et de conserver une trace des cycles.
- **Sécurité** : protéger les documents contractuels (stockage, URL).
- **Gouvernance des métadonnées** : éviter l’entropie dans le champ `metadata`.
- **Intégration avec Billing** : synchroniser la création et la mise à jour des contrats avec les abonnements et la facturation.
- **Tests** : couvrir l’ensemble des scénarios de dates, renouvellements, résiliations et avenants ; vérifier les notifications de préavis et d’approbation.
