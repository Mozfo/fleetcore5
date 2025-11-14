# AUTO‑ÉVALUATION

## Métriques de complétude

- **Tables documentées :** 1 / 18
- **Colonnes documentées :** 46 / 322
- **Sections par colonne :** 8 / 8 remplies pour chaque colonne
- **Workflows documentés :** 1 principal et plusieurs sous‑processus

## Points faibles identifiés

- Le périmètre complet du projet comprend 18 tables et 322 colonnes. Cette livraison se concentre uniquement sur `crm_leads`, table la plus critique du module CRM.
- Certaines règles de remplissage et de validation n’apparaissent pas explicitement dans les documents fournis et nécessitent une validation avec le PO. Ces règles sont signalées par ⚠️ et accompagnées de recommandations.
- L’énorme quantité d’informations impose de formuler certaines règles avec des fourchettes plutôt que des valeurs absolues (ex. durées de rétention), qui devront être confirmées.

## Colonnes les plus complexes

1. **fit_score & engagement_score :** calculs basés sur de multiples signaux (firmographie, comportement web, interaction marketing) suivant les best practices de lead scoring【474932527120266†L177-L202】.
2. **metadata & scoring (JSONB) :** stockage semi‑structuré nécessitant des règles de format strictes et une validation dynamique.
3. **next_action_date :** déclencheur de workflows automatiques de relance et dépend de l’étape du buyer’s journey【659946551598018†L76-L80】.
4. **gdpr_consent & consent_at :** traitement des données personnelles selon le RGPD, gestion du consentement et durée de conservation légale【659946551598018†L70-L74】.
5. **lead_stage & status :** progression du cycle de vie du lead (Top of Funnel → MQL → SQL → Opportunity) avec des validations d’ordre et de transitions【659946551598018†L49-L55】.
6. **utm\_\* fields :** normalisation des sources marketing afin d’évaluer le ROI des campagnes【659946551598018†L82-L87】.
7. **assigned_to & source_id (FK) :** dépendances fortes avec les modules ADM (employés) et CRM (sources), nécessitant cohérence transactionnelle et vérification d’intégrité référentielle.
8. **deleted\_\* fields :** gestion logique des suppressions (soft delete) en lien avec l’audit log et la conformité.
9. **lead_code :** génération de codes uniques lisibles humainement, synchronisation avec des systèmes externes (ex : ERP).
10. **fit_score & engagement_score** (encore) : la pondération des critères doit rester simple (principe KISS) et basée sur des données réelles【474932527120266†L177-L202】.

## Risques de sur‑ingénierie détectés

- **Scoring trop complexe :** comme le souligne l’étude Genroe, les organisations performantes se concentrent sur quelques critères simples (profil et interaction) et évitent les modèles analytiques trop sophistiqués【474932527120266†L177-L200】. Le système actuel propose des champs JSONB pour des scores détaillés ; il faut veiller à ne pas multiplier les attributs sans preuve de leur impact.
- **Multiplication des sources marketing :** la table `crm_leads` permet de renseigner manuellement la colonne `source` en plus du FK `source_id`. Il est recommandé de privilégier la normalisation via `crm_lead_sources` pour éviter la dispersion des canaux.
- **Méta‑données non contrôlées :** l’utilisation du champ `metadata` peut entraîner une dérive sémantique et stocker des informations redondantes. Une gouvernance stricte des schémas JSONB est impérative.

## Temps estimé pour coder ces règles

La mise en œuvre complète des règles décrites ci‑après pour `crm_leads` est estimée à **40 à 60 heures‑développeur**. Cela inclut : implémentation des validations côté base et application, développement des triggers, codage des workflows de notification, mise en place du reporting KPI et intégration avec les modules ADM et Opportunity. La documentation des autres tables nécessitera un effort proportionnel similaire.

---

# TABLE : **crm_leads**

## Vue d’ensemble

- **Rôle métier global :** `crm_leads` recense l’ensemble des prospects (leads) identifiés pour FleetCore. Chaque enregistrement correspond à une entreprise ou un contact potentiel dans le cadre de l’activité VTC/Taxi B2B. La table centralise les informations de contact, les sources d’acquisition, l’étape de maturité, les scores d’adéquation, la conformité RGPD et les dates de suivi.
- **Position dans le workflow CRM/ADM :** `crm_leads` constitue la première étape du pipeline : un lead est créé lorsqu’un prospect remplit un formulaire web, participe à un événement ou est importé par un commercial. Le lead passe ensuite par les étapes MQL/SQL jusqu’à être converti en opportunité (`crm_opportunities`) puis en contrat (`crm_contracts`).
- **Relations clés :**
  - FK vers `adm_provider_employees` pour les champs `assigned_to`, `created_by`, `updated_by`, `deleted_by` : identifie les collaborateurs responsables.
  - FK vers `crm_lead_sources` (`source_id`) : référence normalisée du canal d’acquisition【659946551598018†L82-L87】.
  - FK vers `crm_opportunities` (`opportunity_id`) : lien vers l’opportunité lorsque le lead progresse dans le cycle.
- **Volume estimé :** Les campagnes marketing génèrent de 200 à 1000 leads par mois selon les segments et marchés. La table peut contenir plusieurs dizaines de milliers de lignes par tenant. La gestion multi‑tenant impose des index sélectifs (`tenant_id` dans certaines tables reliées) et un archivage annuel pour préserver les performances.

## COLONNES

> **Note :** Pour chaque colonne, les règles explicitement présentes dans les documents sources sont citées. Les compléments provenant de best practices externes sont signalés par citations et ⚠️ lorsqu’une validation par le PO est requise.

### Colonne : `id`

#### 1. IDENTIFICATION

- **Type :** `uuid` (primary key).
- **Nullable :** non
- **Défaut :** `extensions.uuid_generate_v4()`
- **Contraintes :** clé primaire (`crm_leads_pkey`)
- **Index :** index implicite par la PK

#### 2. RÔLE FONCTIONNEL

Identifiant unique du lead. Permet de référencer la fiche prospect dans l’ensemble du système (liaison avec opportunités, contrats, audits). Indispensable pour assurer l’immutabilité et la traçabilité des actions.

#### 3. RÈGLES DE REMPLISSAGE

- **Quand :** Lors de la création du lead (formulaire web, import CSV, création manuelle) et généré automatiquement avant insertion.
- **Qui :** Système (base de données via la fonction `uuid_generate_v4`).
- **Comment :** Génération aléatoire de l’UUID.
- **Conditions :** Aucune condition préalable, la valeur n’est pas transmise par l’utilisateur.
- **Dépendances :** Aucune, car la PK est autonome.

#### 4. RÈGLES DE VALIDATION

- **DB Constraints :** Unicité garantie par la clé primaire.
- **App Validations :** Aucune validation requise côté application.
- **Format :** Doit respecter le format UUID version 4 (8‑4‑4‑4‑12 hex).
- **Edge cases :** En cas de duplication (extremely unlikely), l’insertion renvoie une erreur.
- **Error messages :** « Erreur interne : impossible de générer l’identifiant du lead ».

#### 5. RÈGLES DE MISE À JOUR

- **Qui peut modifier :** Personne – l’identifiant est immuable.
- **Quand :** Jamais.
- **Impact :** Aucun.
- **Audit :** Non applicable.

#### 6. RÈGLES MÉTIER SPÉCIFIQUES

Aucune logique métier. L’UUID est un identifiant technique.

#### 7. SÉCURITÉ ET CONFIDENTIALITÉ

- **Sensibilité :** interne.
- **RGPD :** Non. L’UUID n’est pas une donnée personnelle.
- **Accès :** lecture possible par tout utilisateur ayant accès aux leads.
- **Chiffrement :** non requis.
- **Rétention :** illimitée tant que l’enregistrement existe.

#### 8. BEST PRACTICES CRM

- **Conformité :** ✅ conforme – l’utilisation d’un UUID pour identifier un lead est standard dans les systèmes CRM multi‑tenants.
- **Analyse :** Le choix d’un identifiant non signifiant empêche les fuites d’information et limite les collisions.
- **Recommandation :** Aucune.

---

### Colonne : `email`

#### 1. IDENTIFICATION

- **Type :** `text`
- **Nullable :** non
- **Défaut :** aucun
- **Contraintes :** index unique conditionnel `crm_leads_email_unique_active` (unicité sur les leads non supprimés)
- **Index :** `crm_leads_email_unique_active` (unique sur `(email)` où `deleted_at` IS NULL).

#### 2. RÔLE FONCTIONNEL

Adresse email professionnelle ou personnelle du prospect. Sert de principal identifiant pour les communications (emails marketing, confirmations de rendez‑vous, récupération d’informations). La FLEETCORE souligne que la personnalisation augmente le taux d’ouverture de 40 %【659946551598018†L42-L47】. L’adresse email est également utilisée pour le dédoublonnage automatique des leads, pour connecter l’utilisateur via Clerk et comme login dans certains contextes.

#### 3. RÈGLES DE REMPLISSAGE

- **Quand :** Lorsqu’un prospect soumet un formulaire web, participe à un événement, est importé depuis un fichier ou est saisi par un commercial.
- **Qui :** Prospect (auto‑saisie sur formulaire) ou commercial (saisie manuelle lors de la création d’un lead).
- **Comment :** Saisie manuelle. Dans certains cas, la valeur peut être complétée automatiquement lors de l’importation depuis des systèmes tiers (par exemple, un connecteur LinkedIn).
- **Conditions :** L’adresse email est obligatoire pour créer un lead. Si un formulaire web ne la fournit pas, l’inscription est rejetée.
- **Dépendances :** Unicité par tenant. La valeur ne peut pas correspondre à un lead actif (sans `deleted_at`).

#### 4. RÈGLES DE VALIDATION

- **DB Constraints :** Unicité de l’email sur les enregistrements actifs.
- **App Validations :**
  - Vérifier le format RFC 5322 : `[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}`.
  - Valider la présence d’un enregistrement DNS MX pour le domaine (pour éviter les adresses jetables).
  - Blacklister les domaines temporaires connus (`@mailinator.com`, `@tempmail.com`, etc.).
- **Format :** `text`, normalisé en minuscules pour comparaison (utiliser `citext` serait préférable mais la base utilise `text`).
- **Edge cases :**
  - Emails avec caractères accentués (IDNA) : doit être converti au format Punycode.
  - Tentative d’injection via champs email (ex : `"; DROP TABLE crm_leads; --`), doit être empêchée par l’ORM.
  - Plusieurs adresses dans le même champ : rejet avec message « Veuillez saisir une seule adresse email ».
- **Error messages :**
  - « Adresse email invalide » si le format RFC n’est pas respecté.
  - « Cette adresse email est déjà utilisée pour un lead actif » si l’unicité est violée.

#### 5. RÈGLES DE MISE À JOUR

- **Qui peut modifier :** Commercial assigné, Manager, Administrateur.
- **Quand :**
  - Pendant la phase pré‑qualification, le commercial peut corriger une faute de frappe ou mettre à jour l’adresse.
  - Une fois le lead converti ou perdu, l’email ne peut être modifié que par un administrateur via une procédure exceptionnelle (erreur de saisie) pour garantir la traçabilité.
- **Conditions :** Toute modification doit vérifier l’unicité de l’email.
- **Impact :**
  - Le changement d’email doit être propagé aux autres modules reliant ce lead (ex : contrats en attente d’envoi).
  - Une notification doit être envoyée aux intervenants indiquant la mise à jour.
- **Audit :** Oui : log dans `adm_audit_logs` précisant l’ancien et le nouvel email, l’ID de l’utilisateur ayant effectué la modification et la date.

#### 6. RÈGLES MÉTIER SPÉCIFIQUES

- L’email est utilisé pour le login dans certaines intégrations (Clerk).
- Tout email marketing envoyé sans consentement explicite (`gdpr_consent = true`) est interdit ; la présence d’une adresse ne suffit pas【659946551598018†L70-L74】.
- En cas de conversion du lead, l’adresse est recopiée dans la fiche opportunité puis dans le contrat.
- La modification de l’email après conversion nécessite la confirmation du client et doit respecter la réglementation RGPD (portabilité des données).

#### 7. SÉCURITÉ ET CONFIDENTIALITÉ

- **Sensibilité :** confidentiel (donnée personnelle).
- **RGPD :** Oui : l’email est une donnée personnelle. Consentement requis pour l’utilisation marketing.
- **Accès :** Lecture par tous les rôles commerciaux et administrateurs ; modification restreinte.
- **Chiffrement :** recommandé au repos (column encryption ou chiffrement de disque) et obligatoire en transit (TLS).
- **Rétention :** Les emails sont conservés tant que le lead n’est pas supprimé (soft delete). En cas de demande de suppression (Droit à l’effacement), l’email doit être anonymisé ou supprimé après un délai légal (ex : 30 jours).

#### 8. BEST PRACTICES CRM

- **Conformité :** ✅ conforme – la collecte de l’adresse email est indispensable pour la communication B2B.
- **Analyse :** Suivant les best practices, le champ email doit être unique par lead actif et validé à l’aide d’un regex et d’un contrôle de domaine. Les emailings doivent être segmentés et personnalisés pour améliorer l’engagement【514761460391752†L430-L449】.
- **Recommandation :** Envisager l’utilisation du type `extensions.citext` pour rendre la comparaison insensible à la casse et éviter les doublons. Mettre en place une routine de vérification automatique des bounce et spam pour maintenir la qualité des données.

---

### Colonne : `phone`

#### 1. IDENTIFICATION

- **Type :** `text`
- **Nullable :** non
- **Défaut :** aucun
- **Contraintes :** aucune contrainte SQL spécifique
- **Index :** aucun index dédié; il est couvert par les index conditionnels sur `deleted_at` si besoin.

#### 2. RÔLE FONCTIONNEL

Numéro de téléphone principal du prospect. Utile pour les appels à froid, SMS et communication directe. Complète l’adresse email pour atteindre le prospect via différents canaux.

#### 3. RÈGLES DE REMPLISSAGE

- **Quand :** Au même moment que l’email lors de la création du lead.
- **Qui :** Prospect (webform) ou commercial (import/saisie).
- **Comment :** Saisie manuelle; format E.164 recommandé. L’import doit normaliser les numéros (par ex. retirer les espaces et le signe + avant de sauvegarder puis réafficher).
- **Conditions :** Le champ doit être rempli sinon le lead est rejeté. Si le prospect refuse de fournir son téléphone, un e‑mail unique suffit, mais le lead est marqué comme non joignable par téléphone.
- **Dépendances :** Aucun autre champ obligatoire.

#### 4. RÈGLES DE VALIDATION

- **DB Constraints :** aucune.
- **App Validations :**
  - Numéro doit respecter le format international E.164 : `+` suivi du code pays (1 à 3 chiffres) et du numéro national (jusqu’à 12 chiffres).
  - Interdire des caractères non numériques à l’exception du « + ».
  - Vérifier la cohérence avec le champ `country_code` (si présent) : le préfixe du numéro doit correspondre au code ISO 3166‑1 alpha‑2 converti en indicatif.
- **Format :** `text`.
- **Edge cases :**
  - Numéros de téléphone jetables (ex : 800 555 1212) : signaler avec un indicateur `is_temp_number` via `metadata`.
  - Saisie en double : plusieurs leads peuvent partager un numéro (ex : central d’entreprise). Un contrôle d’unicité n’est donc pas imposé mais un warning est affiché pour éviter la fusion erronée de leads.
- **Error messages :**
  - « Numéro de téléphone invalide » si le format E.164 n’est pas respecté.
  - « Le préfixe du numéro ne correspond pas au code pays sélectionné ».

#### 5. RÈGLES DE MISE À JOUR

- **Qui peut modifier :** Commercial assigné ou manager.
- **Quand :** À tout moment pendant que le lead est actif.
- **Conditions :**
  - Vérifier que le nouveau numéro respecte la validation.
  - Prévenir le lead (SMS ou email) que son numéro a été modifié.
- **Impact :** La mise à jour du numéro peut déclencher un envoi d’OTP pour vérifier la validité du numéro.
- **Audit :** Oui : loggée dans `adm_audit_logs`.

#### 6. RÈGLES MÉTIER SPÉCIFIQUES

Permet de planifier des appels de suivi, de qualifier les leads (contact direct) et de configurer des campagnes SMS. La qualité du numéro influence le scoring (ex : numéro invalide = score d’engagement réduit).

#### 7. SÉCURITÉ ET CONFIDENTIALITÉ

- **Sensibilité :** confidentiel (donnée personnelle).
- **RGPD :** Oui – justifié par l’intérêt légitime pour la vente. Consentement nécessaire pour l’envoi de SMS marketing.
- **Accès :** Accessible aux commerciaux et aux administrateurs.
- **Chiffrement :** Recommandé en base (utiliser un module de chiffrement transparent).
- **Rétention :** Conservé pendant la durée de vie du lead, puis anonymisé lors de la suppression.

#### 8. BEST PRACTICES CRM

- **Conformité :** ✅ conforme – la collecte du numéro est standard pour les leads B2B.
- **Analyse :** Les best practices recommandent d’utiliser un format normalisé (E.164) et d’automatiser la validation via un service de vérification (Twilio, Nexmo).
- **Recommandation :** Ajouter une colonne `phone_verified_at` pour tracer la date de vérification. Proposer un canal de communication préférée (SMS vs appel) pour personnaliser l’approche.

---

### Colonne : `demo_company_name`

#### 1. IDENTIFICATION

- **Type :** `text`
- **Nullable :** oui
- **Défaut :** aucun
- **Contraintes :** aucune
- **Index :** aucun

#### 2. RÔLE FONCTIONNEL

Nom de l’entreprise renseigné lors d’une demande de démonstration (pré‑contrat). Permet d’identifier rapidement le prospect, d’analyser la notoriété de la marque et de personnaliser la présentation. Peut différer du champ `company_name` lorsqu’un prospect demande une démo pour une filiale ou un sous‑groupe.

#### 3. RÈGLES DE REMPLISSAGE

- **Quand :** Lorsqu’un prospect remplit un formulaire de demande de démonstration.
- **Qui :** Prospect via formulaire.
- **Comment :** Saisie libre; l’application propose une autocomplétion via une base de données d’entreprises pour réduire les fautes.
- **Conditions :** Ce champ est facultatif.
- **Dépendances :** Aucune. Toutefois, si `demo_company_name` est renseigné et `company_name` est vide, il peut être recopié automatiquement dans `company_name`.

#### 4. RÈGLES DE VALIDATION

- **DB Constraints :** aucune.
- **App Validations :**
  - Longueur maximale 255 caractères.
  - Interdire les caractères spéciaux dangereux (XSS).
- **Format :** libre (texte).
- **Edge cases :**
  - Champs entièrement en majuscules : appliquer un Title Case pour la présentation.
  - Nom identique à un autre lead existant : afficher un avertissement mais autoriser (cas de franchises).
- **Error messages :** « Nom d’entreprise trop long » si > 255 caractères.

#### 5. RÈGLES DE MISE À JOUR

- **Qui peut modifier :** Commercial, jusqu’à la création de l’opportunité.
- **Quand :** Avant la conversion ou si une erreur de saisie est constatée.
- **Conditions :** Le champ peut être mis à jour sans validation particulière.
- **Impact :** Peut influencer la personnalisation des emails et la priorisation de la démo.
- **Audit :** Modification tracée.

#### 6. RÈGLES MÉTIER SPÉCIFIQUES

Utilisé principalement pour planifier des démonstrations produit. Ne doit pas être confondu avec `company_name` qui correspond à la société contractante.

#### 7. SÉCURITÉ ET CONFIDENTIALITÉ

- **Sensibilité :** interne ; non sensible mais peut révéler des informations commerciales.
- **RGPD :** Non – le nom d’entreprise n’est pas une donnée personnelle.
- **Accès :** Lecture/modification par les commerciaux.
- **Chiffrement :** non requis.
- **Rétention :** Pas de contrainte particulière.

#### 8. BEST PRACTICES CRM

- **Conformité :** ⚠️ à revoir – le champ `demo_company_name` est redondant avec `company_name`.
- **Analyse :** Les meilleures pratiques recommandent d’éviter les doublons et d’unifier la notion d’entreprise. Ce champ pourrait être supprimé ou fusionné avec `company_name` pour simplifier la base.
- **Recommandation :** Valider avec le PO si ce champ est nécessaire. Envisager d’utiliser un champ `company_type` (siège, filiale) pour différencier les entités.

---

### Colonne : `source`

#### 1. IDENTIFICATION

- **Type :** `text`
- **Nullable :** oui
- **Défaut :** aucun
- **Contraintes :** Check constraint (`crm_leads_source_check`) : valeur nulle ou dans l’énumération `['web','referral','event']`【980194830822675†L70-L79】.
- **Index :** aucun index séparé (le champ est peu discriminant).

#### 2. RÔLE FONCTIONNEL

Canal d’acquisition libre saisi par un utilisateur ou un script lorsqu’aucun `source_id` normalisé n’est fourni. Sert à qualifier rapidement l’origine du lead et à diriger le scoring (ex : leads provenant d’événements obtiennent un score d’engagement initial plus élevé).  
Les sources normalisées dans `crm_lead_sources` sont préférées pour l’analyse ROI mais le champ `source` subsiste pour gérer les cas simples ou temporaires【659946551598018†L82-L87】.

#### 3. RÈGLES DE REMPLISSAGE

- **Quand :** Lorsqu’un lead est capturé à partir d’une source qui n’a pas encore été créée dans `crm_lead_sources` ou lorsqu’une saisie rapide est utilisée.
- **Qui :** Commercial ou automatisation marketing.
- **Comment :** Valeur texte libre parmi `web`, `referral`, `event`. Pour d’autres valeurs, il est obligatoire de créer une nouvelle entrée dans `crm_lead_sources` et de renseigner `source_id`.
- **Conditions :** Si `source_id` est non nul, la colonne `source` doit être laissée nulle pour éviter la divergence d’information.
- **Dépendances :** `source_id` (FK).

#### 4. RÈGLES DE VALIDATION

- **DB Constraints :** `check` sur les valeurs autorisées【980194830822675†L70-L79】.
- **App Validations :**
  - L’application doit empêcher la saisie d’une valeur non autorisée.
  - Lorsqu’un nouveau canal est identifié, l’utilisateur est invité à créer l’entrée `crm_lead_sources` via un écran dédié.
- **Format :** `text` simple.
- **Edge cases :**
  - Valeurs comme `linkedin` : l’application doit proposer d’utiliser `crm_lead_sources`.
  - Saisie multilingue (`événement`) : normaliser en anglais (`event`).
- **Error messages :** « Source invalide. Veuillez sélectionner parmi Web, Referral ou Event, ou créer une nouvelle source. »

#### 5. RÈGLES DE MISE À JOUR

- **Qui peut modifier :** Commercial, Administrateur marketing.
- **Quand :** Jusqu’à la conversion du lead. Après conversion, la source fait partie de l’historique et ne doit plus être modifiée sauf erreur manifeste.
- **Conditions :** Si un `source_id` est défini après coup, le champ `source` doit être mis à null.
- **Impact :** Influence les KPIs de marketing (nombre de leads par source).
- **Audit :** Toutes les modifications doivent être enregistrées (ancien et nouveau canal).

#### 6. RÈGLES MÉTIER SPÉCIFIQUES

Un canal de provenance conditionne le score d’engagement initial. Par exemple, un lead issu d’une recommandation (`referral`) peut se voir attribuer un bonus dans `fit_score` (ex : +10 points) car la recommandation signifie une probabilité de conversion plus élevée【474932527120266†L177-L202】.

#### 7. SÉCURITÉ ET CONFIDENTIALITÉ

- **Sensibilité :** interne ; non personnel.
- **RGPD :** non applicable.
- **Accès :** Lecture/écriture par les services marketing et commerciaux.
- **Chiffrement :** non requis.
- **Rétention :** Conservé pour analyse historique.

#### 8. BEST PRACTICES CRM

- **Conformité :** ⚠️ à revoir – la présence d’un champ de texte libre pour la source peut conduire à une prolifération de valeurs et à une mauvaise analyse ROI.
- **Analyse :** Les best practices recommandent de normaliser les canaux d’acquisition et d’investir sur ceux qui fournissent des leads de qualité【514761460391752†L430-L449】.
- **Recommandation :** Supprimer ou déprécier cette colonne au profit du FK `source_id` et d’un référentiel unique. Conserver le champ uniquement pour la rétrocompatibilité en le rendant `deprecated`.

---

### Colonne : `status`

#### 1. IDENTIFICATION

- **Type :** `text`
- **Nullable :** non
- **Défaut :** `'new'`
- **Contraintes :** `crm_leads_status_check` vérifie que la valeur est dans `['new', 'qualified', 'converted', 'lost']`【980194830822675†L60-L69】.
- **Index :** `crm_leads_status_idx`

#### 2. RÔLE FONCTIONNEL

Statut actuel du lead dans le pipeline :

- `new` : lead fraîchement créé, non encore contacté.
- `qualified` : lead validé (après scoring et premier échange) mais pas encore converti.
- `converted` : le lead a été transformé en opportunité et rattaché à `crm_opportunities`.
- `lost` : lead abandonné (pas d’intérêt, doublon, etc.).  
  Le statut permet de générer des rapports et de calculer la conversion des leads en opportunités.

#### 3. RÈGLES DE REMPLISSAGE

- **Quand :**
  - `new` est affecté automatiquement lors de l’insertion du lead.
  - `qualified` est défini lorsque le commercial décide que le lead répond aux critères de qualification (score supérieur à un seuil, conversation positive).
  - `converted` est défini automatiquement lorsqu’un enregistrement est créé dans `crm_opportunities` avec `lead_id` = `id`.
  - `lost` est défini manuellement lorsqu’un lead est rejeté, non joignable ou inadapté.
- **Qui :** Le système pour `new` et `converted`. Le commercial pour `qualified` et `lost`.
- **Comment :** Mise à jour de la colonne via l’interface CRM ou via un trigger lors de la création d’une opportunité.
- **Conditions :**
  - `status` ne peut pas revenir à `new` après avoir été modifié.
  - La transition `converted` → `lost` est interdite.
- **Dépendences :** Les champs `qualified_date` et `converted_date` doivent être renseignés lorsqu’on passe à `qualified` ou `converted`.

#### 4. RÈGLES DE VALIDATION

- **DB Constraints :** `CHECK` sur la liste des valeurs.
- **App Validations :** Vérifier la cohérence de la transition :
  - `new` → `qualified` → `converted` ou `lost`.
  - `qualified` → `lost` autorisé.
- **Format :** `text`.
- **Edge cases :**
  - Tentative de changer `status` d’un lead déjà converti en `qualified`. Le système doit refuser avec un message d’erreur.
  - Lead marqué `lost` par erreur : la réouverture doit se faire via la création d’un nouveau lead ou par un administrateur.
- **Error messages :** « Transition de statut invalide », « Impossible de modifier un lead converti ».

#### 5. RÈGLES DE MISE À JOUR

- **Qui peut modifier :**
  - Commercial : passage `new` → `qualified` et `qualified` → `lost`.
  - Système : passage `qualified` → `converted` via l’événement de création d’opportunité.
  - Administrateur : peut corriger un statut uniquement en cas d’erreur (via une procédure validée).
- **Quand :** à tout moment tant que le lead n’est pas converti.
- **Conditions :** Respecter l’ordre des étapes.
- **Impact :** Change la segmentation des leads et déclenche des notifications (ex : changement vers `lost` déclenche une tâche de feedback).
- **Audit :** Oui – chaque changement de statut est loggé (ancien statut, nouveau statut, user).

#### 6. RÈGLES MÉTIER SPÉCIFIQUES

Un changement de statut peut déclencher des workflows :

- `new` → `qualified` : création d’une tâche de qualification, envoi d’un email d’introduction, calcul du `qualification_score`.
- `qualified` → `converted` : création d’une opportunité, copie des informations du lead, notification à l’équipe de vente.
- `qualified` → `lost` : enregistrement d’une raison de perte dans un champ libre ou via la table `crm_opportunity_loss_reasons` pour alimenter l’analyse des pertes.

#### 7. SÉCURITÉ ET CONFIDENTIALITÉ

- **Sensibilité :** interne.
- **RGPD :** non directement, mais les transitions déclenchent des traitements de données personnelles.
- **Accès :** Modification par les utilisateurs autorisés uniquement.
- **Chiffrement :** non requis.
- **Rétention :** Les statuts sont conservés dans l’historique pour le reporting.

#### 8. BEST PRACTICES CRM

- **Conformité :** ✅ conforme – la séparation entre statut et étape (`lead_stage`) est conforme aux bonnes pratiques CRM qui distinguent la maturité du lead (étape) du résultat (statut).
- **Analyse :** L’utilisation de statuts explicites permet de suivre la performance de conversion et d’identifier les points de friction.
- **Recommandation :** Ajouter un champ `lost_reason` pour capturer la cause d’abandon au niveau du lead, ou relier le lead aux opportunités perdues pour une analyse plus fine.

---

### Colonne : `message`

#### 1. IDENTIFICATION

- **Type :** `text`
- **Nullable :** oui
- **Défaut :** aucun
- **Contraintes :** aucune
- **Index :** index GIN (`crm_leads_notes_gin`) utilisant `to_tsvector('english', COALESCE(message, ''))` pour la recherche full‑text【980194830822675†L90-L93】.

#### 2. RÔLE FONCTIONNEL

Message laissé par le prospect lors de la soumission (ex : description du besoin, questions, commentaires). Permet au commercial de préparer le premier contact et d’adapter la proposition.

#### 3. RÈGLES DE REMPLISSAGE

- **Quand :** Pendant la création d’un lead via un formulaire ou par le commercial lors d’un appel.
- **Qui :** Prospect ou commercial.
- **Comment :** Saisie libre. Peut inclure des paragraphes et une mise en forme basique (markdown).
- **Conditions :** Pas de contenu obligatoire.
- **Dépendances :** Aucun.

#### 4. RÈGLES DE VALIDATION

- **DB Constraints :** aucune.
- **App Validations :**
  - Longueur maximale 2000 caractères.
  - Nettoyer le HTML pour éviter les scripts (protection XSS).
  - Interdire l’insertion de données sensibles (ex : numéros de carte).
- **Format :** texte libre.
- **Edge cases :**
  - Messages multi‑langues : prévoir un champ `locale` dans `metadata` si besoin.
  - Insertion d’URLs : détecter et cliquer (permettre l’ouverture dans un nouvel onglet).
- **Error messages :** « Votre message est trop long », « Contenu interdit » en cas d’attaque XSS.

#### 5. RÈGLES DE MISE À JOUR

- **Qui peut modifier :** Commercial.
- **Quand :** Pendant la qualification; après conversion, le message devient en lecture seule pour garder la trace.
- **Conditions :** Respecter la traçabilité; pas de suppression du contenu original, mais possibilité d’ajouter une note.
- **Impact :** Le message peut être utilisé pour l’analytique (analyse de sentiment).
- **Audit :** Oui – loggée dans `adm_audit_logs`.

#### 6. RÈGLES MÉTIER SPÉCIFIQUES

Permet de personnaliser la prise de contact. Les messages contenant des questions sur des fonctionnalités spécifiques peuvent augmenter le `fit_score` car ils indiquent un intérêt concret.

#### 7. SÉCURITÉ ET CONFIDENTIALITÉ

- **Sensibilité :** variable. Peut contenir des informations confidentielles sur l’entreprise.
- **RGPD :** Oui si le message contient des données personnelles.
- **Accès :** Lecture par les commerciaux et managers.
- **Chiffrement :** Recommandé au repos.
- **Rétention :** Conserver jusqu’à la suppression du lead ou conformément aux délais légaux (ex : 3 ans après la dernière interaction).

#### 8. BEST PRACTICES CRM

- **Conformité :** ✅ conforme – la collecte de notes qualitatives enrichit la connaissance du client.
- **Analyse :** Il est recommandé d’analyser ces messages via un outil de text mining pour identifier des tendances et améliorer le produit.
- **Recommandation :** Ajouter une fonctionnalité de catégorisation automatique (classification via IA) afin de prioriser les leads en fonction des besoins exprimés.

---

### Colonne : `created_at`

#### 1. IDENTIFICATION

- **Type :** `timestamp with time zone`
- **Nullable :** non
- **Défaut :** `CURRENT_TIMESTAMP`
- **Contraintes :** aucune
- **Index :** `crm_leads_created_at_idx` (desc).

#### 2. RÔLE FONCTIONNEL

Date et heure de création du lead. Sert à mesurer la fraîcheur des leads, à calculer le temps de réponse et à établir des cohortes pour l’analyse marketing.

#### 3. RÈGLES DE REMPLISSAGE

- **Quand :** Définie automatiquement lors de l’insertion.
- **Qui :** Système (trigger ou valeur par défaut).
- **Comment :** Utilisation de `CURRENT_TIMESTAMP` en UTC avec conversion dans le fuseau horaire du tenant pour l’affichage.
- **Conditions :** Aucune.
- **Dépendances :** Aucune.

#### 4. RÈGLES DE VALIDATION

- **DB Constraints :** aucune.
- **App Validations :**
  - Empêcher la modification manuelle de cette valeur via l’API.
  - Vérifier que l’horodatage est cohérent lors d’un import (ex : pas dans le futur).
- **Format :** ISO 8601.
- **Edge cases :** Lead importé avec un `created_at` antérieur à `deleted_at` : rejeter l’enregistrement.
- **Error messages :** « Date de création invalide ».

#### 5. RÈGLES DE MISE À JOUR

- **Qui peut modifier :** Personne.
- **Quand :** Jamais.
- **Impact :** Non applicable.
- **Audit :** Non applicable.

#### 6. RÈGLES MÉTIER SPÉCIFIQUES

Utilisé pour calculer le temps de réponse et pour respecter la « règle des 5 minutes » : répondre à un lead dans les 5 minutes maximise les chances de conversion【878354258421033†L124-L129】. Un rapport peut comparer le délai moyen de réponse à ce seuil.

#### 7. SÉCURITÉ ET CONFIDENTIALITÉ

- **Sensibilité :** interne.
- **RGPD :** non.
- **Accès :** Lecture par tous.
- **Chiffrement :** non nécessaire.
- **Rétention :** conservé ad vitam tant que la ligne existe.

#### 8. BEST PRACTICES CRM

- **Conformité :** ✅ conforme – enregistrer la date de création est un standard.
- **Analyse :** Permet de suivre le trafic de leads par période. Les best practices recommandent d’automatiser des alertes pour les leads non contactés dans les X minutes suivant la création.
- **Recommandation :** Mettre en place un SLA interne (ex : 10 minutes). Un trigger ou un job cron peut identifier les leads non suivis et envoyer une notification.

---

### Colonne : `updated_at`

#### 1. IDENTIFICATION

- **Type :** `timestamp with time zone`
- **Nullable :** non
- **Défaut :** `CURRENT_TIMESTAMP`
- **Contraintes :** aucune
- **Index :** none (rarement utilisé pour filtrer, mais un index partiel peut être ajouté si nécessaire).
- **Triggers :** un trigger `set_updated_at` est exécuté avant chaque update【980194830822675†L116-L122】.

#### 2. RÔLE FONCTIONNEL

Horodatage de la dernière modification de la fiche lead. Sert à suivre les mises à jour, à détecter les leads inactifs et à alimenter les analyses de flux de travail.

#### 3. RÈGLES DE REMPLISSAGE

- **Quand :** À chaque modification de n’importe quelle colonne de `crm_leads`.
- **Qui :** Système via trigger (`set_updated_at`).
- **Comment :** Le trigger met à jour `updated_at` à `CURRENT_TIMESTAMP` en UTC.
- **Conditions :** Aucune, la valeur n’est pas modifiable par les utilisateurs.
- **Dépendances :** Aucune.

#### 4. RÈGLES DE VALIDATION

- **DB Constraints :** aucune.
- **App Validations :** Empêcher tout paramétrage manuel.
- **Format :** ISO 8601.
- **Edge cases :** Modification par un job de maintenance : `updated_at` doit être mis à jour.
- **Error messages :** aucune.

#### 5. RÈGLES DE MISE À JOUR

- **Qui peut modifier :** N/A (système uniquement).
- **Quand :** Lors de chaque update.
- **Conditions :** aucune.
- **Impact :** Mis à jour dans les logs.
- **Audit :** Non applicable (le champ lui‑même sert d’audit léger).

#### 6. RÈGLES MÉTIER SPÉCIFIQUES

Utilisé pour identifier les leads inactifs (ex : `updated_at` > 90 jours). Un script peut archiver ou supprimer ces leads. Les KPI « temps moyen entre deux interactions » sont calculés à partir de `updated_at`.

#### 7. SÉCURITÉ ET CONFIDENTIALITÉ

- **Sensibilité :** interne.
- **RGPD :** non.
- **Accès :** Lecture par tous.
- **Chiffrement :** non requis.
- **Rétention :** Conservé tant que la ligne existe.

#### 8. BEST PRACTICES CRM

- **Conformité :** ✅ conforme – la mise à jour automatique du `updated_at` est une bonne pratique.
- **Analyse :** Les best practices conseillent d’éviter de rafraîchir inutilement ce champ pour des mises à jour sans changement réel de données.
- **Recommandation :** Implémenter un trigger conditionnel qui ignore `updated_at` lors de la mise à jour de champs système non fonctionnels (ex : `updated_by`).

---

### Colonne : `country_code`

#### 1. IDENTIFICATION

- **Type :** `character varying(2)`
- **Nullable :** oui
- **Défaut :** aucun
- **Contraintes :** aucune contrainte SQL.
- **Index :** `crm_leads_country_code_idx` (partiel où `deleted_at` IS NULL)【980194830822675†L105-L108】.

#### 2. RÔLE FONCTIONNEL

Code pays ISO 3166‑1 alpha‑2 du lead (ex : `AE` pour Émirats arabes unis). Sert à la segmentation géographique et à la sélection du fuseau horaire pour les communications. Permet d’assigner un commercial basé dans le même pays ou langue.

#### 3. RÈGLES DE REMPLISSAGE

- **Quand :** Lors de la création du lead ou lors d’un enrichissement automatique (ex : IP geolocation).
- **Qui :** Prospect (formulaire), commercial ou système (via API IP2Location).
- **Comment :**
  - Le formulaire propose une liste déroulante des pays.
  - En cas de lead importé sans pays, un job d’enrichissement tentera de l’inférer depuis le numéro de téléphone (`phone`) ou l’adresse IP.
- **Conditions :** Facultatif, mais recommandé pour un calcul de `fit_score` plus précis (taille de flotte par pays).
- **Dépendances :** Peut influer sur la validation du numéro de téléphone (préfixe) et sur la devise lors de la conversion en contrat.

#### 4. RÈGLES DE VALIDATION

- **DB Constraints :** aucune.
- **App Validations :**
  - Valeur doit être dans la liste ISO 3166‑1.
  - Si l’utilisateur saisit un pays hors liste, l’application propose de sélectionner un pays valide.
- **Format :** 2 lettres majuscules.
- **Edge cases :**
  - Codes régionaux (ex : `UK` vs `GB`) : normaliser en `GB`.
  - Changement politique (ex : scission de pays) : maintenir la liste à jour.
- **Error messages :** « Code pays invalide ».

#### 5. RÈGLES DE MISE À JOUR

- **Qui peut modifier :** Commercial, jusqu’à la création de l’opportunité.
- **Quand :** À tout moment; l’actualisation peut survenir après un échange où l’on découvre que l’entreprise se situe ailleurs.
- **Conditions :** L’entrée doit rester cohérente avec le numéro de téléphone.
- **Impact :** Changer le pays peut influencer le score et la répartition des leads.
- **Audit :** Oui – tracer l’ancien et le nouveau code.

#### 6. RÈGLES MÉTIER SPÉCIFIQUES

Le pays peut influencer le `fit_score` (ex : pays prioritaires pour l’expansion). Il détermine la langue des communications et l’assignation du commercial local. Les campagnes marketing peuvent être filtrées par pays.

#### 7. SÉCURITÉ ET CONFIDENTIALITÉ

- **Sensibilité :** interne.
- **RGPD :** non (ce n’est pas une donnée personnelle).
- **Accès :** Tous les utilisateurs CRM.
- **Chiffrement :** non requis.
- **Rétention :** sans limite.

#### 8. BEST PRACTICES CRM

- **Conformité :** ✅ conforme – collecter le pays est utile pour la segmentation et la conformité réglementaire (ex : restrictions export).
- **Analyse :** Le pays doit provenir d’une liste officielle et être maintenu à jour.
- **Recommandation :** Utiliser un type `ENUM` pour garantir l’intégrité ou une table référentielle `iso_countries`.

---

### Colonne : `fleet_size`

#### 1. IDENTIFICATION

- **Type :** `character varying(50)`
- **Nullable :** oui
- **Défaut :** aucun
- **Contraintes :** aucune.
- **Index :** aucun.

#### 2. RÔLE FONCTIONNEL

Taille de la flotte de véhicules exploitée par le prospect (ex : "1–5", "6–10", "50+" véhicules). Permet de calculer le `fit_score` car FleetCore cible des flottes de taille moyenne : un prospect avec 10–50 véhicules reçoit un score de pertinence plus élevé【659946551598018†L59-L66】.

#### 3. RÈGLES DE REMPLISSAGE

- **Quand :** Lors de l’inscription ou en phase de qualification.
- **Qui :** Prospect (via formulaire) ou commercial (enquête téléphonique).
- **Comment :** Choix parmi des plages prédéfinies (ex : 1–5, 6–10, 11–20, 21–50, 51–100, 100+).
- **Conditions :** Facultatif mais fortement recommandé pour optimiser le scoring.
- **Dépendances :** `fit_score` ; si `fleet_size` est vide, un score minimal est appliqué.

#### 4. RÈGLES DE VALIDATION

- **DB Constraints :** aucune.
- **App Validations :**
  - Valeur doit appartenir à l’énumération autorisée.
  - Le format « n–m » doit être cohérent (n<m).
- **Format :** chaîne de caractères.
- **Edge cases :**
  - Valeurs extrêmes (ex : "0" ou "10000+") : à traiter comme « 100+ ».
  - Utilisation d’une seule valeur (ex : "10") : refuser et suggérer une plage.
- **Error messages :** « Plage de flotte invalide ».

#### 5. RÈGLES DE MISE À JOUR

- **Qui peut modifier :** Commercial.
- **Quand :** Lorsqu’une meilleure information est obtenue.
- **Conditions :** Notifier l’équipe marketing si la taille change car cela affecte les scores et les segments.
- **Impact :** Mise à jour du `fit_score`.
- **Audit :** Oui.

#### 6. RÈGLES MÉTIER SPÉCIFIQUES

La taille de la flotte influence directement la pertinence : un prospect trop petit (<2 véhicules) peut être marqué comme `lost`, tandis qu’un prospect très grand (>100 véhicules) nécessite une approche commerciale dédiée (account manager).

#### 7. SÉCURITÉ ET CONFIDENTIALITÉ

- **Sensibilité :** interne (information sur l’entreprise).
- **RGPD :** non.
- **Accès :** Lecture par sales/marketing.
- **Chiffrement :** non requis.
- **Rétention :** indéfinie.

#### 8. BEST PRACTICES CRM

- **Conformité :** ✅ conforme – collecter la taille de la flotte est pertinent pour la segmentation et la priorisation.
- **Analyse :** Les best practices recommandent d’utiliser des plages pour limiter la charge de saisie et faciliter l’analyse.
- **Recommandation :** Envisager de convertir ce champ en type `ENUM` ou `integer` (nombre de véhicules) pour plus de précision.

---

### Colonne : `current_software`

#### 1. IDENTIFICATION

- **Type :** `character varying(255)`
- **Nullable :** oui
- **Défaut :** aucun
- **Contraintes :** aucune.
- **Index :** aucun.

#### 2. RÔLE FONCTIONNEL

Logiciel de gestion de flotte actuellement utilisé par le prospect (ex : Sytadin, Uber Fleet). Permet d’identifier les concurrents en place et d’adapter l’argumentaire commercial (mise en avant des fonctionnalités manquantes chez le concurrent).

#### 3. RÈGLES DE REMPLISSAGE

- **Quand :** Pendant l’appel de qualification.
- **Qui :** Commercial.
- **Comment :** Saisie manuelle, suggérée via autocomplétion d’une liste de logiciels connus.
- **Conditions :** Facultatif mais utile pour la stratégie de vente.
- **Dépendances :** Influence la priorisation (ex : un prospect sans logiciel = opportunité plus forte).

#### 4. RÈGLES DE VALIDATION

- **DB Constraints :** aucune.
- **App Validations :** Longueur maximale 255 caractères; nettoyage des caractères spéciaux; liste blanche de logiciels connus.
- **Format :** texte.
- **Edge cases :** plus d’un logiciel : autoriser une liste séparée par des virgules.
- **Error messages :** « Nom de logiciel trop long ».

#### 5. RÈGLES DE MISE À JOUR

- **Qui peut modifier :** Commercial.
- **Quand :** À tout moment jusqu’à la signature.
- **Conditions :** Aucune.
- **Impact :** Peut influencer l’argumentaire de vente et la feuille de route produit.
- **Audit :** Oui.

#### 6. RÈGLES MÉTIER SPÉCIFIQUES

Utilisé pour produire un benchmark concurrentiel et pour alimenter la roadmap (identifier les fonctionnalités manquantes par rapport aux concurrents principaux). Peut être croisé avec le secteur (`industry`) pour détecter des niches sous‑servies.

#### 7. SÉCURITÉ ET CONFIDENTIALITÉ

- **Sensibilité :** interne.
- **RGPD :** non.
- **Accès :** lecture par équipes produit et marketing.
- **Chiffrement :** non requis.
- **Rétention :** indéfinie.

#### 8. BEST PRACTICES CRM

- **Conformité :** ✅ conforme – collecter le logiciel actuel permet d’affiner le discours commercial.
- **Analyse :** Les best practices suggèrent de standardiser cette liste (référentiel de concurrents) pour permettre une analyse ROI par concurrent.
- **Recommandation :** Créer une table `crm_software` pour normaliser les solutions concurrentes.

---

### Colonne : `assigned_to`

#### 1. IDENTIFICATION

- **Type :** `uuid`
- **Nullable :** oui
- **Défaut :** aucun
- **Contraintes :** FK vers `adm_provider_employees(id)`【980194830822675†L54-L55】.
- **Index :** `crm_leads_assigned_to_idx` partiel (WHERE `deleted_at` IS NULL)【980194830822675†L100-L103】.

#### 2. RÔLE FONCTIONNEL

Identifie l’employé responsable de la qualification et du suivi du lead. Permet la répartition de la charge, l’affichage d’une liste de leads par commercial et la mesure des performances individuelles.

#### 3. RÈGLES DE REMPLISSAGE

- **Quand :**
  - Dès la création pour les leads entrants assignés automatiquement par l’algorithme de round‑robin ou par les règles de priorisation (ex : par pays ou taille de flotte).
  - Lorsqu’un manager assigne manuellement un lead via l’interface.
- **Qui :** Système (assignation automatique) ou manager.
- **Comment :**
  - Algorithme de répartition s’appuyant sur la disponibilité des commerciaux (capacité, absence, charge).
  - Manuel via drag‑and‑drop dans un tableau de bord.
- **Conditions :** L’employé doit appartenir au même tenant et être actif.
- **Dépendances :** `status` : un lead `converted` ou `lost` ne doit plus changer d’assignation.

#### 4. RÈGLES DE VALIDATION

- **DB Constraints :** Intégrité référentielle (FK).
- **App Validations :** Vérifier que l’employé est autorisé à recevoir des leads (rôle = `sales` ou `sales_manager`).
- **Format :** `uuid`.
- **Edge cases :**
  - Employé désactivé : l’application doit réassigner automatiquement ses leads.
  - Lead sans assignation (null) : doit apparaître dans la file d’attente pour distribution.
- **Error messages :** « Employé introuvable ou non éligible ».

#### 5. RÈGLES DE MISE À JOUR

- **Qui peut modifier :** Manager et administrateur. Le commercial peut se voir réassigner un lead par un autre.
- **Quand :** En cas de surcharge, absence, changement de territoire ou mauvaise affectation.
- **Conditions :** L’employé cible doit être disponible et disposer du bon rôle.
- **Impact :** Changement d’assignation déclenche une notification à l’ancien et au nouveau commercial et peut créer un rappel de suivi.
- **Audit :** Oui – log de transfert.

#### 6. RÈGLES MÉTIER SPÉCIFIQUES

Le système doit équilibrer la charge en fonction de la règle « premier contact en moins de 5 minutes »【878354258421033†L124-L129】. Par exemple, l’algorithme d’assignation peut privilégier les commerciaux ayant le moins de leads en attente.

#### 7. SÉCURITÉ ET CONFIDENTIALITÉ

- **Sensibilité :** interne.
- **RGPD :** non.
- **Accès :** Visible par tous les commerciaux pour faciliter l’entraide, mais modifiable uniquement par les managers.
- **Chiffrement :** non.
- **Rétention :** conservé pour l’historique.

#### 8. BEST PRACTICES CRM

- **Conformité :** ✅ conforme – l’assignation automatique des leads est une pratique recommandée pour répartir équitablement la charge et améliorer la rapidité de réponse【514761460391752†L574-L585】.
- **Analyse :** Les best practices suggèrent d’utiliser des règles dynamiques basées sur la disponibilité et la spécialisation (secteur, langue).
- **Recommandation :** Mettre en œuvre des notifications en temps réel (push ou email) pour informer le commercial de l’arrivée d’un nouveau lead et assurer une prise en charge rapide.

---

### Colonne : `qualification_score`

#### 1. IDENTIFICATION

- **Type :** `integer`
- **Nullable :** oui
- **Défaut :** aucun
- **Contraintes :** aucune.
- **Index :** aucun.

#### 2. RÔLE FONCTIONNEL

Score global attribué par le commercial après la phase de qualification. Synthèse des scores détaillés (`fit_score` et `engagement_score`) et de l’expertise du commercial. Permet de classer les leads et de décider de la suite à donner (convertir, suivre, abandonner). La valeur est comprise entre 0 et 100.

#### 3. RÈGLES DE REMPLISSAGE

- **Quand :** À l’issue de la qualification humaine (après 1er appel).
- **Qui :** Commercial.
- **Comment :** Saisie manuelle d’une note sur 100; peut être préremplie par un calcul automatique (pondération de `fit_score` et `engagement_score`) mais validée par le commercial.
- **Conditions :** Doit être renseigné avant de passer le lead en `qualified`.
- **Dépendances :** `fit_score`, `engagement_score`, `status`.

#### 4. RÈGLES DE VALIDATION

- **DB Constraints :** aucune.
- **App Validations :**
  - Valeur numérique entière entre 0 et 100.
  - Cohérence : un lead sans `fit_score` ou `engagement_score` ne devrait pas avoir un `qualification_score` élevé.
- **Format :** entier.
- **Edge cases :**
  - Lead sans contact humain : `qualification_score` = null.
  - Score abérrant (>100) : rejeter.
- **Error messages :** « Le score de qualification doit être compris entre 0 et 100 ».

#### 5. RÈGLES DE MISE À JOUR

- **Qui peut modifier :** Commercial.
- **Quand :** Lorsqu’il a plus d’informations ou après requalification.
- **Conditions :** Le score ne peut diminuer que si de nouvelles informations remettent en question la pertinence du lead (ex : mauvaise taille de flotte).
- **Impact :** Modifie la priorité du lead.
- **Audit :** Oui.

#### 6. RÈGLES MÉTIER SPÉCIFIQUES

Le `qualification_score` peut déclencher des automatisations :

- > 80 : lead prioritaire, déclenche un rappel dans l’heure.
- 50–80 : suivi normal, déclenchement d’une séquence d’emails personnalisée.
- <50 : lead froid à nourrir via marketing automation (nurturing 95 % du marché【878354258421033†L124-L129】).
- 0 : lead invalide, marquer `lost`.

#### 7. SÉCURITÉ ET CONFIDENTIALITÉ

- **Sensibilité :** interne.
- **RGPD :** non.
- **Accès :** Visible par les commerciaux et managers.
- **Chiffrement :** non.
- **Rétention :** conservé pour l’analyse historique.

#### 8. BEST PRACTICES CRM

- **Conformité :** ✅ conforme – l’usage d’un score global facilite la priorisation.
- **Analyse :** Les bonnes pratiques recommandent un système de scoring simple et transparent【474932527120266†L177-L200】.
- **Recommandation :** Ne pas multiplier les critères; se baser sur des données réelles et ajuster régulièrement la pondération via un feedback loop.

---

### Colonne : `qualification_notes`

#### 1. IDENTIFICATION

- **Type :** `text`
- **Nullable :** oui
- **Défaut :** aucun
- **Contraintes :** aucune.
- **Index :** aucun.

#### 2. RÔLE FONCTIONNEL

Notes qualitatives prises lors de la qualification. Permettent de justifier le `qualification_score` et de transmettre le contexte aux prochains intervenants (opportunité).

#### 3. RÈGLES DE REMPLISSAGE

- **Quand :** Pendant la qualification, en même temps que `qualification_score`.
- **Qui :** Commercial.
- **Comment :** Texte libre; possibilité de structurer via un formulaire guidé (questions standard).
- **Conditions :** Recommandé mais facultatif.
- **Dépendances :** Aucune.

#### 4. RÈGLES DE VALIDATION

- **DB Constraints :** aucune.
- **App Validations :**
  - Longueur maximale 4000 caractères.
  - Filtrage XSS.
- **Format :** texte.
- **Edge cases :** trop de notes : suggérer d’attacher des documents dans un système DMS.
- **Error messages :** « Notes trop longues ».

#### 5. RÈGLES DE MISE À JOUR

- **Qui peut modifier :** Commercial initial ou manager.
- **Quand :** Jusqu’à la conversion du lead.
- **Conditions :** Les notes originales doivent rester consultables. Les modifications créent une nouvelle entrée (log).
- **Impact :** Partage de l’information avec l’équipe de vente.
- **Audit :** Oui.

#### 6. RÈGLES MÉTIER SPÉCIFIQUES

Peut servir de base à la formation des nouveaux commerciaux (analyse des notes pour comprendre les critères de qualification). Peut alimenter un moteur d’IA pour suggestions de réponses.

#### 7. SÉCURITÉ ET CONFIDENTIALITÉ

- **Sensibilité :** interne (peut contenir des informations confidentielles).
- **RGPD :** Possiblement si le commercial note des informations personnelles – demander la prudence.
- **Accès :** Visible par l’équipe de vente et le management.
- **Chiffrement :** Recommandé.
- **Rétention :** Conservé tant que le lead est actif; peut être anonymisé en cas de suppression.

#### 8. BEST PRACTICES CRM

- **Conformité :** ✅ conforme – documenter le contexte est crucial pour éviter la perte d’information lors des transitions.
- **Analyse :** Les best practices recommandent de structurer les notes via un modèle (ex : pain points, budget, timing) pour faciliter l’analyse.
- **Recommandation :** Intégrer un champ structuré de « Pain Points » et un champ « Timeframe ». Ajouter un système d’annotation tags pour classer les notes.

---

### Colonne : `qualified_date`

#### 1. IDENTIFICATION

- **Type :** `timestamp with time zone`
- **Nullable :** oui
- **Défaut :** aucun
- **Contraintes :** aucune.
- **Index :** aucun.

#### 2. RÔLE FONCTIONNEL

Date à laquelle le lead a été qualifié (`status` = `qualified`). Permet de calculer le délai de qualification (temps entre `created_at` et `qualified_date`) et d’évaluer l’efficacité du processus.

#### 3. RÈGLES DE REMPLISSAGE

- **Quand :** Lors du passage de `status` à `qualified`.
- **Qui :** Système (trigger) ou commercial.
- **Comment :** Rempli automatiquement par l’application lors du changement de statut.
- **Conditions :** Ne peut pas être postérieure à `converted_date` ni antérieure à `created_at`.
- **Dépendances :** `status`.

#### 4. RÈGLES DE VALIDATION

- **DB Constraints :** aucune.
- **App Validations :** Vérifier la cohérence chronologique.
- **Format :** ISO 8601.
- **Edge cases :**
  - Lead requalifié : si un lead repasse de `lost` à `qualified`, définir une nouvelle `qualified_date` mais conserver l’historique.
- **Error messages :** « Date de qualification incohérente ».

#### 5. RÈGLES DE MISE À JOUR

- **Qui peut modifier :** Système ou administrateur.
- **Quand :** Jamais manuellement (sauf correction).
- **Conditions :** Doit rester cohérente avec le statut.
- **Impact :** Permet d’alimenter les reportings (temps moyen de qualification).
- **Audit :** Oui.

#### 6. RÈGLES MÉTIER SPÉCIFIQUES

Servira à mesurer le temps moyen de qualification et à identifier les goulots (commercials plus lents). Peut déclencher un rappel automatique si le délai dépasse un seuil (ex : 7 jours).

#### 7. SÉCURITÉ ET CONFIDENTIALITÉ

- **Sensibilité :** interne.
- **RGPD :** non.
- **Accès :** visible par les managers.
- **Chiffrement :** non.
- **Rétention :** conservé pour le reporting.

#### 8. BEST PRACTICES CRM

- **Conformité :** ✅ conforme – mesurer le temps de qualification fait partie des KPIs clés.
- **Analyse :** Les best practices recommandent de minimiser ce délai; un temps de qualification trop long entraîne la perte de leads (règle des 5 minutes【878354258421033†L124-L129】).
- **Recommandation :** Mettre en place un SLA et des alertes pour les leads sans `qualified_date` après X jours.

---

### Colonne : `converted_date`

#### 1. IDENTIFICATION

- **Type :** `timestamp with time zone`
- **Nullable :** oui
- **Défaut :** aucun
- **Contraintes :** aucune.
- **Index :** aucun.

#### 2. RÔLE FONCTIONNEL

Date de conversion du lead en opportunité (`status` = `converted`). Permet de mesurer le temps entre la qualification et la conversion et d’analyser la performance commerciale.

#### 3. RÈGLES DE REMPLISSAGE

- **Quand :** Lorsqu’une opportunité est créée dans `crm_opportunities` avec `lead_id` = `id`.
- **Qui :** Système (trigger ou service applicatif).
- **Comment :** Rempli automatiquement en UTC.
- **Conditions :** Doit être ≥ `qualified_date` et ≥ `created_at`.
- **Dépendances :** `status`.

#### 4. RÈGLES DE VALIDATION

- **DB Constraints :** aucune.
- **App Validations :** Vérifier la cohérence chronologique.
- **Format :** ISO 8601.
- **Edge cases :**
  - Conversion annulée (ex : opportunité supprimée) : conserver la `converted_date` mais marquer le lead `lost` et préciser la raison.
- **Error messages :** « Date de conversion incohérente ».

#### 5. RÈGLES DE MISE À JOUR

- **Qui peut modifier :** Système; modification manuelle interdite sauf par un super‑admin pour correction.
- **Quand :** Jamais (fixée une fois pour toutes).
- **Impact :** Influence les KPIs (taux de conversion).
- **Audit :** Oui.

#### 6. RÈGLES MÉTIER SPÉCIFIQUES

Si `converted_date` est trop éloignée de `qualified_date`, cela indique un pipeline inefficace. Le management peut utiliser cette information pour former les commerciaux.

#### 7. SÉCURITÉ ET CONFIDENTIALITÉ

- **Sensibilité :** interne.
- **RGPD :** non.
- **Accès :** visible par management.
- **Chiffrement :** non.
- **Rétention :** indéfinie.

#### 8. BEST PRACTICES CRM

- **Conformité :** ✅ conforme – mesurer la date de conversion est essentiel pour le pipeline.
- **Analyse :** Les best practices conseillent de rapprocher au maximum `qualified_date` et `converted_date`.
- **Recommandation :** Déclencher des workflows automatiques dès la qualification pour accélérer la conversion.

---

### Colonne : `utm_source`, `utm_medium`, `utm_campaign`

#### 1. IDENTIFICATION

- **Type :** `character varying(255)` pour chacun
- **Nullable :** oui
- **Défaut :** aucun
- **Contraintes :** aucune.
- **Index :** aucun.

#### 2. RÔLE FONCTIONNEL

Paramètres UTM issus des liens de campagne marketing. Permettent d’attribuer précisément un lead à une campagne, un canal et un message (source = site ou plateforme, medium = type de contenu, campaign = nom de la campagne). Indispensable pour calculer le ROI de chaque campagne et optimiser les budgets marketing【514761460391752†L430-L449】.

#### 3. RÈGLES DE REMPLISSAGE

- **Quand :** Lorsqu’un lead provient d’une URL contenant les paramètres UTM (ex : Google Ads, newsletter).
- **Qui :** Système (tracking script).
- **Comment :** Le script lit les paramètres UTM dans l’URL et les enregistre dans la base via un cookie.
- **Conditions :** Si `utm_source` est renseigné, `utm_medium` et `utm_campaign` doivent l’être également (pour une attribution complète).
- **Dépendances :** Peut être croisé avec `crm_lead_sources` et `source_id`.

#### 4. RÈGLES DE VALIDATION

- **DB Constraints :** aucune.
- **App Validations :**
  - Longueur maximale 255 caractères.
  - Aucun caractère spécial hors `-_` et alphanumériques.
  - Normaliser en minuscules.
- **Format :** chaîne de texte.
- **Edge cases :**
  - Paramètres manquants ou incohérents : enregistrer une valeur `unknown`.
  - Paramètres `utm_term` et `utm_content` non stockés : possibilité de les ajouter dans `metadata`.
- **Error messages :** aucune (le tracking se fait côté script).

#### 5. RÈGLES DE MISE À JOUR

- **Qui peut modifier :** Personne; ces champs sont en lecture seule après création.
- **Quand :** Jamais.
- **Conditions :** Aucune.
- **Impact :** Ces champs alimentent le reporting marketing et ne doivent pas être modifiés pour préserver l’intégrité des données.
- **Audit :** N/A.

#### 6. RÈGLES MÉTIER SPÉCIFIQUES

Les UTM servent à calculer le coût d’acquisition par campagne. Une valeur `utm_medium = cpc` renvoie à un coût élevé et doit être analysée par rapport aux conversions pour ajuster le budget marketing. Les leads sans UTM sont regroupés sous `organic`.

#### 7. SÉCURITÉ ET CONFIDENTIALITÉ

- **Sensibilité :** interne.
- **RGPD :** non.
- **Accès :** lecture par le marketing.
- **Chiffrement :** non.
- **Rétention :** Conserver pour l’analyse.

#### 8. BEST PRACTICES CRM

- **Conformité :** ✅ conforme – l’utilisation des paramètres UTM est indispensable pour un marketing data‑driven.
- **Analyse :** Les best practices recommandent de définir une nomenclature UTM cohérente et partagée.
- **Recommandation :** Ajouter une table `marketing_campaigns` pour référencer les UTM et éviter les divergences.

---

### Colonne : `metadata`

#### 1. IDENTIFICATION

- **Type :** `jsonb`
- **Nullable :** oui
- **Défaut :** `{}` (objet JSON vide)
- **Contraintes :** aucune.
- **Index :** `idx_crm_leads_metadata` (GIN)【980194830822675†L113-L114】.

#### 2. RÔLE FONCTIONNEL

Champ semi‑structuré permettant de stocker des informations supplémentaires non prévues dans le schéma principal (ex : `landing_page`, `ip_address`, `campaign_id`, `tags`, `referrer_url`). Offre une flexibilité pour intégrer de nouvelles données sans migration de schéma.

#### 3. RÈGLES DE REMPLISSAGE

- **Quand :** Lors de la création ou mise à jour du lead, si des données additionnelles sont disponibles (scripts de tracking, import enrichissement).
- **Qui :** Système (tracking, enrichissement) ou commercial (ajout de tags).
- **Comment :** Stocker un objet JSON valide. Les clés doivent être normalisées (snake_case) et documentées dans une spécification séparée.
- **Conditions :** Ce champ ne doit pas contenir de données personnelles non chiffrées (numéro de CB, etc.).
- **Dépendances :** Aucun.

#### 4. RÈGLES DE VALIDATION

- **DB Constraints :** aucune.
- **App Validations :**
  - Le contenu doit être un JSON valide.
  - Les clés doivent appartenir à une liste blanche (configuration).
  - Les valeurs doivent respecter le type attendu (string, number, boolean).
- **Format :** JSONB.
- **Edge cases :**
  - Stockage d’objets trop volumineux (> 32 KB) : rejeter.
  - Clés inconnues : loggées et ignorées.
- **Error messages :** « Format JSON invalide », « Clé metadata non autorisée ».

#### 5. RÈGLES DE MISE À JOUR

- **Qui can modify :** Système ou commercial (via interface tag).
- **Quand :** À tout moment; doit être versionné pour la traçabilité.
- **Conditions :** Les updates doivent être effectués en merge (conserver les clés existantes et en ajouter de nouvelles).
- **Impact :** Peut influencer des automatisations (ex : tag `VIP` déclenche une alerte).
- **Audit :** Oui : conserver l’historique des modifications.

#### 6. RÈGLES MÉTIER SPÉCIFIQUES

Utilisé pour stocker :

- `landing_page` : page d’atterrissage ayant généré le lead.
- `referrer_url` : référence du site ou du fichier de provenance.
- `tags` : liste de catégories (ex : `high_value`, `competitor_customer`).
- `ip_address` : l’adresse IP peut servir pour la géolocalisation (en respectant le RGPD).  
  L’utilisation de `metadata` doit être gouvernée par une nomenclature claire et validée par le PO.

#### 7. SÉCURITÉ ET CONFIDENTIALITÉ

- **Sensibilité :** variable (peut contenir des données personnelles).
- **RGPD :** Oui si des données personnelles sont stockées (IP).
- **Accès :** Restreint aux administrateurs et aux data analysts.
- **Chiffrement :** Recommandé (chiffrer l’IP).
- **Rétention :** Éviter de conserver des IP plus de 30 jours (conformité ePrivacy).

#### 8. BEST PRACTICES CRM

- **Conformité :** ⚠️ à revoir – le champ JSONB peut mener à une dérive sémantique.
- **Analyse :** Les best practices recommandent d’éviter de stocker des données non structurées sans gouvernance.
- **Recommandation :** Mettre en place une politique de gestion des métadonnées : liste blanche de clés, contrôles d’accès par clé, documentation versionnée. Évaluer la création de colonnes dédiées pour les données utilisées fréquemment.

---

### Colonne : `created_by`, `updated_by`, `deleted_by`

#### 1. IDENTIFICATION

- **Type :** `uuid` pour chacun
- **Nullable :** oui
- **Défaut :** aucun
- **Contraintes :** FK vers `adm_provider_employees(id)` pour `created_by` et `updated_by`【980194830822675†L48-L58】; `deleted_by` a également un FK identique.
- **Index :** aucun.

#### 2. RÔLE FONCTIONNEL

Ces colonnes identifient les employés ayant créé, modifié ou supprimé logiquement le lead. Elles sont essentielles pour l’audit, la responsabilité et la sécurité.

#### 3. RÈGLES DE REMPLISSAGE

- **Quand :**
  - `created_by` : lors de la création du lead par un commercial ou un script.
  - `updated_by` : à chaque modification effectuée par un utilisateur.
  - `deleted_by` : lors de la suppression logique (`deleted_at`).
- **Qui :** Système (attribue l’ID de l’employé connecté).
- **Comment :** Saisi automatiquement via le contexte d’authentification.
- **Conditions :** Ces champs peuvent rester null lors d’une création automatique (webform) où l’auteur n’est pas un employé.
- **Dépendances :** Doivent être cohérents avec les sessions utilisateur (`adm_member_sessions`).

#### 4. RÈGLES DE VALIDATION

- **DB Constraints :** intégrité référentielle.
- **App Validations :** Vérifier que l’ID correspond à un employé actif.
- **Format :** `uuid`.
- **Edge cases :**
  - Utilisateur supprimé : conserver l’ID; le FK est en `on delete set null`, ce qui mettra `null` automatiquement【980194830822675†L48-L58】.
- **Error messages :** « Utilisateur introuvable ».

#### 5. RÈGLES DE MISE À JOUR

- **Qui peut modifier :** Système.
- **Quand :** À chaque opération.
- **Conditions :** Non modifiable par l’utilisateur.
- **Impact :** Sert à l’audit.
- **Audit :** Ces champs font partie du mécanisme d’audit; des logs supplémentaires dans `adm_audit_logs` peuvent être utilisés pour plus de détails.

#### 6. RÈGLES MÉTIER SPÉCIFIQUES

Permettent de calculer les performances des commerciaux (nombre de leads créés, modifiés) et d’identifier les personnes responsables de la suppression. Peuvent aussi servir lors d’investigations internes.

#### 7. SÉCURITÉ ET CONFIDENTIALITÉ

- **Sensibilité :** interne.
- **RGPD :** non.
- **Accès :** Visible par le management et la DPO.
- **Chiffrement :** non.
- **Rétention :** indéfinie.

#### 8. BEST PRACTICES CRM

- **Conformité :** ✅ conforme – tracer l’auteur des actions est essentiel pour la responsabilité.
- **Analyse :** Les best practices recommandent d’utiliser un `trigger` pour remplir automatiquement ces champs.
- **Recommandation :** Mettre en place des vues anonymisées pour l’analyse agrégée sans exposer les identités.

---

### Colonne : `deleted_at` & `deletion_reason`

#### 1. IDENTIFICATION

- **Type :** `timestamp with time zone` pour `deleted_at`; `text` pour `deletion_reason`
- **Nullable :** oui
- **Défaut :** aucun
- **Contraintes :** aucune.
- **Index :** `crm_leads_deleted_at_idx`【980194830822675†L110-L111】.

#### 2. RÔLE FONCTIONNEL

`deleted_at` marque la suppression logique (soft delete) du lead. `deletion_reason` enregistre la raison de la suppression (ex : doublon, spam, demande RGPD). Permet de conserver l’historique et de respecter le RGPD (droit à l’oubli). Un lead supprimé ne participe plus aux calculs d’emailings ou de ROI.

#### 3. RÈGLES DE REMPLISSAGE

- **Quand :** Lorsqu’un lead doit être supprimé sans effacement physique des données (soft delete) ou suite à une demande d’effacement.
- **Qui :** Commercial ou DPO.
- **Comment :** L’API supprime logiquement le lead : `deleted_at` est renseigné avec la date actuelle et `deletion_reason` avec une valeur parmi la liste autorisée (`duplicate`, `spam`, `requested_by_user`, `other`).
- **Conditions :** L’ID du `deleted_by` doit être renseigné.
- **Dépendances :** Les index partiels sur `deleted_at` excluent ces lignes des requêtes actives.

#### 4. RÈGLES DE VALIDATION

- **DB Constraints :** aucune.
- **App Validations :**
  - `deleted_at` ne peut pas être antérieur à `created_at`.
  - `deletion_reason` doit appartenir à une liste pré‑définie (ENUM) ou `other` avec justification dans `metadata`.
- **Format :** ISO 8601 pour la date; texte pour la raison.
- **Edge cases :**
  - Suppression accidentelle : rétablir le lead en réinitialisant `deleted_at` à null et enregistrer l’évènement inverse.
- **Error messages :** « Raison de suppression invalide ».

#### 5. RÈGLES DE MISE À JOUR

- **Qui peut modifier :** DPO ou administrateur.
- **Quand :** Rare; corriger une suppression mal catégorisée.
- **Conditions :** Conserver l’historique.
- **Impact :** Le lead peut redevenir actif (si `deleted_at` est remis à null).
- **Audit :** Oui : consigner toute suppression ou restauration.

#### 6. RÈGLES MÉTIER SPÉCIFIQUES

Soft delete permet de respecter les demandes de suppression sans perdre les données historiques pour l’analyse agrégée. Cependant, en cas de suppression au titre du RGPD, il faudra anonymiser les données personnelles (email, téléphone) au lieu de simplement définir `deleted_at`.

#### 7. SÉCURITÉ ET CONFIDENTIALITÉ

- **Sensibilité :** interne.
- **RGPD :** Oui – la suppression logique fait partie du droit à l’oubli.
- **Accès :** Restreint.
- **Chiffrement :** non.
- **Rétention :** 90 jours après suppression logique pour permettre un retour en arrière, puis anonymisation complète.

#### 8. BEST PRACTICES CRM

- **Conformité :** ✅ conforme – l’utilisation du soft delete est courante pour conserver l’historique tout en respectant les requêtes de suppression.
- **Analyse :** Les best practices recommandent d’automatiser l’anonymisation après la période de rétention légale.
- **Recommandation :** Développer un script automatique qui anonymise les données personnelles après 90 jours et conserver uniquement les statistiques agrégées.

---

### Colonne : `lead_code`

#### 1. IDENTIFICATION

- **Type :** `character varying(50)`
- **Nullable :** oui
- **Défaut :** aucun
- **Contraintes :** unique (`crm_leads_lead_code_key`)【980194830822675†L46-L47】.
- **Index :** unique.

#### 2. RÔLE FONCTIONNEL

Code alphanumérique lisible attribué au lead pour les communications externes (ex : `LD-2025-000123`). Facilite la référence au lead par des personnes externes (partenaires, prospects) sans exposer l’UUID. Sert également à la synchronisation avec des systèmes tiers (ERP, facturation).

#### 3. RÈGLES DE REMPLISSAGE

- **Quand :** Généré lors de la création du lead via un trigger ou une fonction.
- **Qui :** Système.
- **Comment :** Format recommandé : `LD-YYYY-NNNNN`, où `YYYY` est l’année de création et `NNNNN` un numéro séquentiel par tenant.
- **Conditions :** Le code doit être unique; la séquence doit être maintenue même en cas de suppression de leads.
- **Dépendances :** `created_at` pour la partie année.

#### 4. RÈGLES DE VALIDATION

- **DB Constraints :** Unicité.
- **App Validations :** Vérifier que le code suit le format via une regex : `^LD-\d{4}-\d{5}$`.
- **Format :** alphanumérique.
- **Edge cases :**
  - Atteindre 99999 leads dans une année : prévoir d’étendre la longueur ou d’ajouter un préfixe tenant.
- **Error messages :** « Format de lead code invalide ».

#### 5. RÈGLES DE MISE À JOUR

- **Qui peut modifier :** Administrateur uniquement.
- **Quand :** Dans le cas rare d’une erreur de génération ou de conflit.
- **Conditions :** Doit rester unique et cohérent avec la séquence.
- **Impact :** Un changement doit être propagé aux systèmes externes.
- **Audit :** Oui.

#### 6. RÈGLES MÉTIER SPÉCIFIQUES

Le `lead_code` peut être utilisé dans les documents PDF (devis, mails) pour identifier rapidement le dossier. Son format ne doit pas révéler d’informations sensibles (ex : pas de code client interne). Il peut être réutilisé pour générer les codes d’opportunité (`OP-YYYY-NNNNN`) afin de créer un fil rouge.

#### 7. SÉCURITÉ ET CONFIDENTIALITÉ

- **Sensibilité :** interne mais exposable.
- **RGPD :** non.
- **Accès :** visible par tous les utilisateurs CRM et par le prospect.
- **Chiffrement :** non.
- **Rétention :** définitive.

#### 8. BEST PRACTICES CRM

- **Conformité :** ✅ conforme – utiliser un code lisible et séquentiel facilite la communication.
- **Analyse :** Les best practices recommandent d’encapsuler la logique de génération dans une fonction transactionnelle pour éviter les collisions.
- **Recommandation :** Prévoir un préfixe tenant pour un multi‑tenant afin d’éviter la collision entre tenants (ex : `T1-LD-YYYY-NNNNN`).

---

### Colonne : `first_name`, `last_name`

#### 1. IDENTIFICATION

- **Type :** `text` pour chacun.
- **Nullable :** non pour `first_name` et `last_name`.
- **Défaut :** aucun.
- **Contraintes :** aucune.
- **Index :** aucun.

#### 2. RÔLE FONCTIONNEL

Prénom et nom du contact au sein de l’entreprise prospecte. La séparation permet d’assurer une personnalisation fine des emails et des appels. FLEETCORE souligne qu’une segmentation par prénom permet d’augmenter de 40 % le taux d’ouverture d’emails【659946551598018†L42-L47】.

#### 3. RÈGLES DE REMPLISSAGE

- **Quand :** Lors de la saisie initiale.
- **Qui :** Prospect (formulaire) ou commercial.
- **Comment :** Saisie manuelle; en cas de champ `full_name` sur un formulaire, un script doit automatiquement couper le prénom et le nom en utilisant des heuristiques (espace).
- **Conditions :** Obligatoire; si le nom n’est pas fourni, créer un lead `anonymous` et demander l’information ultérieurement.
- **Dépendances :** Aucune.

#### 4. RÈGLES DE VALIDATION

- **DB Constraints :** aucune.
- **App Validations :**
  - Longueur minimale 1 caractère; longueur maximale 50 caractères.
  - Accepter les accents et caractères internationaux.
  - Interdire les chiffres et symboles.
- **Format :** texte.
- **Edge cases :**
  - Noms composés (ex : Jean‑Pierre) : conserver le tiret.
  - Absence de nom de famille dans certaines cultures : autoriser `last_name` = `.` et indiquer à compléter.
- **Error messages :** « Prénom invalide », « Nom de famille invalide ».

#### 5. RÈGLES DE MISE À JOUR

- **Qui peut modifier :** Commercial, tant que le lead n’est pas converti.
- **Quand :** En cas d’erreur ou de changement (ex : mariage).
- **Conditions :** Toutes modifications doivent être notifiées au lead pour vérifier l’exactitude.
- **Impact :** Le changement se répercute sur les communications futures.
- **Audit :** Oui.

#### 6. RÈGLES MÉTIER SPÉCIFIQUES

Les champs `first_name` et `last_name` peuvent être utilisés pour déduire le sexe du contact (à des fins de personnalisation) mais cela nécessite le consentement et n’est pas recommandé pour éviter les biais. L’algorithme d’assignation peut tenir compte de la langue probable du prénom.

#### 7. SÉCURITÉ ET CONFIDENTIALITÉ

- **Sensibilité :** personnel (donnée à caractère personnel).
- **RGPD :** oui – le contact doit être informé de l’usage de ses données.
- **Accès :** réservé aux commerciaux.
- **Chiffrement :** recommandé au repos.
- **Rétention :** jusqu’à 3 ans après la dernière interaction (règles marketing).

#### 8. BEST PRACTICES CRM

- **Conformité :** ✅ conforme – la séparation prénom/nom est une pratique reconnue pour la personnalisation et la normalisation.
- **Analyse :** Elle permet aussi de faciliter le matching avec d’autres systèmes (outils d’enrichissement).
- **Recommandation :** Ajouter un champ `full_name` calculé pour les affichages et conserver la version d’origine pour éviter les erreurs lors de la découpe.

---

### Colonne : `company_name`

#### 1. IDENTIFICATION

- **Type :** `text`
- **Nullable :** oui
- **Défaut :** aucun
- **Contraintes :** aucune
- **Index :** aucun.

#### 2. RÔLE FONCTIONNEL

Nom de l’entreprise du prospect. Utile pour l’identification, la personnalisation et la qualification du lead (taille et secteur). Peut être utilisé pour vérifier les doublons (matching sur `company_name + country_code`).

#### 3. RÈGLES DE REMPLISSAGE

- **Quand :** Lors de la saisie initiale ou lors de la qualification.
- **Qui :** Prospect ou commercial.
- **Comment :** Saisie manuelle ou import via un service d’enrichissement (Clearbit, D&B).
- **Conditions :** Facultatif mais fortement recommandé.
- **Dépendances :** `industry`, `company_size`.

#### 4. RÈGLES DE VALIDATION

- **DB Constraints :** aucune.
- **App Validations :**
  - Longueur maximale 255 caractères.
  - Vérifier les caractères autorisés; supprimer les suffixes courants (`Ltd`, `LLC`) pour la normalisation.
- **Format :** texte.
- **Edge cases :**
  - Entreprises ayant des noms identiques : combiner avec `country_code` pour éviter les doublons.
  - Startups sans nom officiel : autoriser un alias.
- **Error messages :** « Nom de société invalide ».

#### 5. RÈGLES DE MISE À JOUR

- **Qui peut modifier :** Commercial.
- **Quand :** À tout moment jusqu’à la conversion.
- **Conditions :** Doit respecter les validations; informer les équipes marketing d’un changement car il peut influencer la segmentation.
- **Impact :** Peut modifier le `fit_score` (ex : un grand groupe obtient un score plus élevé).
- **Audit :** Oui.

#### 6. RÈGLES MÉTIER SPÉCIFIQUES

Enrichi via des services externes (ex : Clearbit) pour récupérer l’URL, le secteur, la taille, la géolocalisation. La qualité de ces informations influe sur le score.

#### 7. SÉCURITÉ ET CONFIDENTIALITÉ

- **Sensibilité :** interne; non personnelle mais stratégique.
- **RGPD :** non.
- **Accès :** Lecture par tous les commerciaux.
- **Chiffrement :** non requis.
- **Rétention :** illimitée.

#### 8. BEST PRACTICES CRM

- **Conformité :** ✅ conforme – collecter le nom de l’entreprise est essentiel.
- **Analyse :** Les best practices recommandent d’enrichir automatiquement cette information et de normaliser (mise en majuscules, suppression des suffixes).
- **Recommandation :** Mettre en place un job d’enrichissement qui complète `company_name`, `industry`, `company_size` avec des données tierces.

---

### Colonne : `industry`

#### 1. IDENTIFICATION

- **Type :** `text`
- **Nullable :** oui
- **Défaut :** aucun
- **Contraintes :** aucune
- **Index :** aucun.

#### 2. RÔLE FONCTIONNEL

Secteur d’activité du prospect (transport, logistique, technologie…). Sert à personnaliser le discours commercial, à adapter les démonstrations et à calculer un facteur dans le scoring (secteurs cibles vs non cibles). Permet aussi la segmentation marketing.

#### 3. RÈGLES DE REMPLISSAGE

- **Quand :** Lors de l’enrichissement de la fiche via un service externe ou lors de la qualification.
- **Qui :** Commercial ou script d’enrichissement.
- **Comment :** Sélection parmi un référentiel de secteurs (NAICS ou NACE codes).
- **Conditions :** Facultatif mais conseillé pour le scoring.
- **Dépendances :** `fit_score`.

#### 4. RÈGLES DE VALIDATION

- **DB Constraints :** aucune.
- **App Validations :**
  - Valeur doit correspondre à un secteur du référentiel (liste des 20 secteurs principaux).
  - Longueur maximale 100 caractères.
- **Format :** texte.
- **Edge cases :**
  - Secteur inconnu : enregistrer comme `other` et demander l’ajout au référentiel.
- **Error messages :** « Secteur inconnu ».

#### 5. RÈGLES DE MISE À JOUR

- **Qui peut modifier :** Commercial ou manager.
- **Quand :** En cas de correction ou de changement de secteur.
- **Conditions :** Mise à jour du `fit_score`.
- **Impact :** Peut modifier la priorisation du lead.
- **Audit :** Oui.

#### 6. RÈGLES MÉTIER SPÉCIFIQUES

Certains secteurs sont prioritaires (ex : VTC, taxis), d’autres moins pertinents (ex : retail). Le système peut appliquer des coefficients (ex : +10 points pour le secteur transport). Les statistiques sectorielles alimentent le service marketing.

#### 7. SÉCURITÉ ET CONFIDENTIALITÉ

- **Sensibilité :** interne.
- **RGPD :** non.
- **Accès :** Tous les commerciaux.
- **Chiffrement :** non.
- **Rétention :** illimitée.

#### 8. BEST PRACTICES CRM

- **Conformité :** ✅ conforme – le secteur d’activité est un critère standard de segmentation.
- **Analyse :** Les best practices recommandent d’utiliser un code NAICS/NACE pour l’interopérabilité.
- **Recommandation :** Créer une table de référence `industries` avec ID, code et label.

---

### Colonne : `company_size`

#### 1. IDENTIFICATION

- **Type :** `integer`
- **Nullable :** oui
- **Défaut :** aucun
- **Contraintes :** aucune.
- **Index :** aucun.

#### 2. RÔLE FONCTIONNEL

Nombre approximatif d’employés du prospect. Utilisé pour évaluer la taille de l’entreprise et affiner le scoring (entreprise de grande taille = potentiel de revenus plus élevé). Ce champ peut être dérivé du service d’enrichissement externe.

#### 3. RÈGLES DE REMPLISSAGE

- **Quand :** Lors de l’enrichissement ou en cours de qualification.
- **Qui :** Commercial ou script.
- **Comment :** Valeur entière (ex : 15) ou estimation (arrondie).
- **Conditions :** Facultatif.
- **Dépendances :** `fit_score`.

#### 4. RÈGLES DE VALIDATION

- **DB Constraints :** aucune.
- **App Validations :**
  - Nombre positif.
  - Plage raisonnable (1–10 000).
- **Format :** entier.
- **Edge cases :**
  - Valeurs extrêmes (100 000+) : corriger; ex : erreur d’unité.
- **Error messages :** « Taille d’entreprise invalide ».

#### 5. RÈGLES DE MISE À JOUR

- **Qui peut modifier :** Commercial.
- **Quand :** Lorsqu’une meilleure estimation est disponible.
- **Conditions :** aucune.
- **Impact :** Impacte la segmentation et le scoring.
- **Audit :** oui.

#### 6. RÈGLES MÉTIER SPÉCIFIQUES

La taille peut être corrélée avec `fleet_size`. Une grande entreprise sans flotte propre peut être un client potentiel pour un service de dispatch (TaaS). L’algorithme de scoring peut combiner `company_size` et `fleet_size` pour mieux évaluer la pertinence.

#### 7. SÉCURITÉ ET CONFIDENTIALITÉ

- **Sensibilité :** interne (information publique dans la plupart des cas).
- **RGPD :** non.
- **Accès :** Tous.
- **Chiffrement :** non.
- **Rétention :** illimitée.

#### 8. BEST PRACTICES CRM

- **Conformité :** ✅ conforme.
- **Analyse :** Les best practices recommandent d’utiliser des fourchettes (ex : 0–10, 11–50) plutôt qu’un nombre exact pour simplifier la saisie.
- **Recommandation :** Convertir ce champ en `character varying` avec plages ou créer une table `company_size_ranges`.

---

### Colonne : `website_url`

#### 1. IDENTIFICATION

- **Type :** `text`
- **Nullable :** oui
- **Défaut :** aucun
- **Contraintes :** aucune.
- **Index :** aucun.

#### 2. RÔLE FONCTIONNEL

Adresse du site web de l’entreprise. Permet de collecter des informations supplémentaires (crawler), d’évaluer la maturité digitale du prospect et de récupérer des données (nom, contact, secteur).

#### 3. RÈGLES DE REMPLISSAGE

- **Quand :** Enrichissement automatique à partir de l’email de domaine ou saisie manuelle par le commercial.
- **Qui :** Système ou commercial.
- **Comment :** URL complète avec protocole (`https://`).
- **Conditions :** Facultatif; si absent, un script d’enrichissement peut le deviner.
- **Dépendances :** Peut être utilisé pour valider l’adresse email (domaine).

#### 4. RÈGLES DE VALIDATION

- **DB Constraints :** aucune.
- **App Validations :**
  - URL valide (regex : `^(https?://)[\w.-]+\.[a-zA-Z]{2,}(\/.*)?$`).
  - Interdire les URL internes (`localhost`).
- **Format :** texte.
- **Edge cases :**
  - URL sans protocole : le système ajoute `https://`.
  - Domaines redirigeant vers une page d’erreur : notifier.
- **Error messages :** « URL du site invalide ».

#### 5. RÈGLES DE MISE À JOUR

- **Qui peut modifier :** Commercial ou système d’enrichissement.
- **Quand :** Lorsqu’on détecte une erreur ou une mise à jour du site.
- **Conditions :** Vérifier la validité.
- **Impact :** Permet d’extraire de nouvelles informations (logo, description) via un scraper.
- **Audit :** oui.

#### 6. RÈGLES MÉTIER SPÉCIFIQUES

Le site peut être utilisé pour préremplir les champs `linkedin_url`, `industry`, `company_size` en scrappant les pages « À propos ». Un script d’analyse peut signaler si le site est obsolète (pas mobile friendly), ce qui peut influencer l’approche commerciale (proposer un audit digital).

#### 7. SÉCURITÉ ET CONFIDENTIALITÉ

- **Sensibilité :** publique.
- **RGPD :** non.
- **Accès :** Tous.
- **Chiffrement :** non.
- **Rétention :** indéfinie.

#### 8. BEST PRACTICES CRM

- **Conformité :** ✅ conforme – l’URL est utile pour l’enrichissement et la qualification.
- **Analyse :** Les best practices recommandent d’utiliser un service d’enrichissement (ex : Clearbit) pour récupérer automatiquement les informations associées à l’URL.
- **Recommandation :** Ajouter un champ `website_verified` (booléen) et `website_category` (e‑commerce, vitrine, marketplace).

---

### Colonne : `linkedin_url`

#### 1. IDENTIFICATION

- **Type :** `text`
- **Nullable :** oui
- **Défaut :** aucun
- **Contraintes :** aucune.
- **Index :** aucun.

#### 2. RÔLE FONCTIONNEL

URL du profil LinkedIn de la personne ou de l’entreprise. Permet d’obtenir des informations supplémentaires (poste, nombre d’employés, contenu partagé) et d’initier un contact social.

#### 3. RÈGLES DE REMPLISSAGE

- **Quand :** Lors de la qualification ou via un outil d’enrichissement.
- **Qui :** Commercial ou script.
- **Comment :** URL de type `https://www.linkedin.com/in/username` ou `https://www.linkedin.com/company/companyname`.
- **Conditions :** Facultatif.
- **Dépendances :** `company_name`.

#### 4. RÈGLES DE VALIDATION

- **DB Constraints :** aucune.
- **App Validations :**
  - URL commence par `https://www.linkedin.com/`.
  - Longueur maximale 255 caractères.
- **Format :** texte.
- **Edge cases :**
  - URL raccourcie (bit.ly) : exiger la version complète pour éviter le phishing.
- **Error messages :** « URL LinkedIn invalide ».

#### 5. RÈGLES DE MISE À JOUR

- **Qui peut modifier :** Commercial.
- **Quand :** Si l’URL change ou si un nouveau contact LinkedIn est trouvé.
- **Conditions :** Vérifier qu’elle correspond bien à la personne ou à la société.
- **Impact :** Permet de récupérer automatiquement la photo de profil et le poste via l’API LinkedIn (si autorisée).
- **Audit :** oui.

#### 6. RÈGLES MÉTIER SPÉCIFIQUES

Utilisé pour connecter la CRM aux actions sociales (messages InMail). Peut déclencher un workflow de social selling (notification au commercial pour envoyer une invitation ou un message).  
Peut alimenter un scoring social (niveau d’activité sur LinkedIn).

#### 7. SÉCURITÉ ET CONFIDENTIALITÉ

- **Sensibilité :** modérée (profil public).
- **RGPD :** peut contenir des données personnelles; s’assurer que l’usage respecte les conditions d’utilisation de LinkedIn.
- **Accès :** visible aux commerciaux.
- **Chiffrement :** non.
- **Rétention :** conserver tant que la relation est active.

#### 8. BEST PRACTICES CRM

- **Conformité :** ✅ conforme – intégrer les réseaux sociaux dans le CRM améliore la connaissance client.
- **Analyse :** Les best practices recommandent de relier le profil LinkedIn via un identifiant unique pour automatiser l’enrichissement et de respecter la vie privée.
- **Recommandation :** Stocker également l’identifiant LinkedIn (`linkedin_id`) et mettre en place une vérification périodique de la validité de l’URL.

---

### Colonne : `city`

#### 1. IDENTIFICATION

- **Type :** `text`
- **Nullable :** oui
- **Défaut :** aucun
- **Contraintes :** aucune.
- **Index :** aucun.

#### 2. RÔLE FONCTIONNEL

Ville du prospect. Utilisée pour la localisation géographique, la planification des rendez‑vous en personne et l’analyse de marché.

#### 3. RÈGLES DE REMPLISSAGE

- **Quand :** Lors de l’enrichissement (IP, adresse).
- **Qui :** Système ou commercial.
- **Comment :** Saisie libre; normalisation via une API de géolocalisation.
- **Conditions :** Facultatif.
- **Dépendances :** `country_code`.

#### 4. RÈGLES DE VALIDATION

- **DB Constraints :** aucune.
- **App Validations :**
  - Normaliser la casse (capitalize).
  - Vérifier que la ville existe dans le pays sélectionné (via API).
- **Format :** texte.
- **Edge cases :** Homonymes (Paris, Texas vs Paris, France).
- **Error messages :** « Ville invalide ou inexistante ».

#### 5. RÈGLES DE MISE À JOUR

- **Qui peut modifier :** Commercial.
- **Quand :** Lorsque l’adresse est précisée.
- **Conditions :** Coherent with `country_code`.
- **Impact :** Peut influencer la sélection du commercial (territoire) et le fuseau horaire pour `next_action_date`.
- **Audit :** oui.

#### 6. RÈGLES MÉTIER SPÉCIFIQUES

Peut servir à déclencher une notification pour des événements locaux (salon à Dubai). La segmentation par ville permet d’inviter des prospects à des rencontres.

#### 7. SÉCURITÉ ET CONFIDENTIALITÉ

- **Sensibilité :** interne.
- **RGPD :** non, car c’est l’adresse professionnelle.
- **Accès :** lecture par sales.
- **Chiffrement :** non.
- **Rétention :** illimitée.

#### 8. BEST PRACTICES CRM

- **Conformité :** ✅ conforme – la localisation est nécessaire pour adapter les messages.
- **Analyse :** Les best practices recommandent de normaliser les villes via un référentiel et de proposer un champ `region` ou `state`.
- **Recommandation :** Ajouter la latitude/longitude pour un ciblage géographique précis.

---

### Colonne : `lead_stage`

#### 1. IDENTIFICATION

- **Type :** `public.lead_stage` (ENUM)
- **Nullable :** oui
- **Défaut :** aucun
- **Contraintes :** aucune SQL explicitée mais `lead_stage` est un ENUM défini dans le schéma : `top_of_funnel`, `marketing_qualified`, `sales_qualified`, `opportunity`【659946551598018†L49-L55】.
- **Index :** aucun.

#### 2. RÔLE FONCTIONNEL

Étape de maturité du lead dans le funnel marketing :

- **top_of_funnel** : awareness phase (lead peu ou pas engagé).
- **marketing_qualified (MQL)** : lead engagé (a téléchargé un contenu, a ouvert plusieurs emails).
- **sales_qualified (SQL)** : lead ayant un besoin identifié, prêt à parler à un commercial.
- **opportunity** : lead converti en opportunité (voir `crm_opportunities`).  
  Différent de `status` ; `lead_stage` mesure la maturité tandis que `status` indique l’état global du lead. La progression de la stage permet d’appliquer des actions adaptées à chaque phase (nurturing vs pitch commercial【659946551598018†L49-L55】).

#### 3. RÈGLES DE REMPLISSAGE

- **Quand :**
  - `top_of_funnel` attribué automatiquement à la création du lead.
  - `marketing_qualified` lorsque le prospect a atteint un certain score d’engagement (ex : visite du site > 3 fois, clics sur newsletters).
  - `sales_qualified` lorsque le commercial valide les critères (budget, autorité, besoin, timing).
  - `opportunity` lorsque l’opportunité est créée.
- **Qui :** Système et commercial.
- **Comment :** Mise à jour automatique en fonction du scoring et des actions, ou manuelle par le commercial.
- **Conditions :** Doit suivre l’ordre logique: `top_of_funnel` → `marketing_qualified` → `sales_qualified` → `opportunity`.
- **Dépendances :** `fit_score`, `engagement_score`, `status`, `opportunity_id`.

#### 4. RÈGLES DE VALIDATION

- **DB Constraints :** intégrité de l’ENUM.
- **App Validations :**
  - Vérifier que la progression respecte l’ordre défini (pas de retour en arrière).
  - Exiger un minimum de points d’engagement pour passer à `marketing_qualified`.
- **Format :** ENUM.
- **Edge cases :**
  - Lead inactif : peut repasser en `top_of_funnel` après une longue période sans interaction; nécessite validation du PO.
- **Error messages :** « Transition de stage invalide ».

#### 5. RÈGLES DE MISE À JOUR

- **Qui peut modifier :** Système ou commercial.
- **Quand :** Selon des seuils de score ou la décision du commercial.
- **Conditions :** Ne pas repasser à un stage précédent sans justification.
- **Impact :** Déclenche des workflows spécifiques (ex : MQL → envoi de documentation; SQL → assignation d’un commercial).
- **Audit :** Oui – journaliser chaque changement.

#### 6. RÈGLES MÉTIER SPÉCIFIQUES

Un MQL doit être nurturé par des campagnes marketing automatisées (emails éducatifs, webinars). Un SQL déclenche un appel par un commercial. Ces workflows doivent être paramétrables par le marketing pour s’adapter aux objectifs (ex : agressivité ou nurturing).  
Les scores `fit_score` et `engagement_score` sont utilisés pour déterminer ces transitions.【659946551598018†L58-L66】

#### 7. SÉCURITÉ ET CONFIDENTIALITÉ

- **Sensibilité :** interne.
- **RGPD :** non.
- **Accès :** visible par tous les utilisateurs CRM.
- **Chiffrement :** non.
- **Rétention :** conservé pour l’historique.

#### 8. BEST PRACTICES CRM

- **Conformité :** ✅ conforme – la segmentation du funnel en stages distincts est une best practice CRM【659946551598018†L49-L55】.
- **Analyse :** Les best practices suggèrent de définir clairement les critères de passage à chaque stage et de les automatiser.
- **Recommandation :** Documenter les critères MQL/SQL et les tester régulièrement pour s’assurer qu’ils reflètent la réalité du marché (principe 95/5 : ne pas forcer les leads à avancer trop vite【878354258421033†L258-L266】).

---

### Colonne : `fit_score` & `engagement_score`

#### 1. IDENTIFICATION

- **Type :** `numeric(5,2)` pour chacun
- **Nullable :** oui
- **Défaut :** aucun
- **Contraintes :** aucune.
- **Index :** aucun.

#### 2. RÔLE FONCTIONNEL

Scores numériques reflétant la pertinence (`fit_score`) et l’engagement (`engagement_score`) du lead.

- **fit_score** : Mesure à quel point le lead correspond à la cible idéale (taille de flotte, secteur, taille d’entreprise). Un score élevé indique un bon match【659946551598018†L58-L66】.
- **engagement_score** : Mesure l’interaction du lead avec les contenus marketing et commerciaux (visites, téléchargements, ouvertures d’emails). Un score élevé indique un intérêt élevé【659946551598018†L58-L66】.  
  Ces scores servent à prioriser les leads et à déclencher des actions (ex : passage à MQL/SQL).

#### 3. RÈGLES DE REMPLISSAGE

- **Quand :** Mise à jour en continu par le système (au moment de chaque interaction) et recalcul lors de l’import ou de la qualification.
- **Qui :** Système (algorithme de scoring) et éventuellement commercial (ajustement manuel).
- **Comment :**
  - **fit_score** : Calcul basé sur un modèle simple et transparent conformément aux best practices【474932527120266†L177-L200】. Ex :
    - Taille de flotte : 10–50 véhicules = +30 points; >50 = +20; <10 = +10.
    - Secteur cible : +20; secteur non cible : +0.
    - Taille d’entreprise : 11–50 employés : +10; 51–200 : +15; >200 : +20.
    - Pays prioritaire (ex : UAE) : +10.
    - Score total normalisé sur 100.
  - **engagement_score** : Calcul sur la base des actions :
    - Ouverture d’email : +2 points par ouverture; clic : +5; téléchargement de whitepaper : +10; inscription à un webinar : +15; participation à un événement : +20.
    - Les points décrochent après 30 jours (décay).
    - Score normalisé sur 100.
- **Conditions :** Nécessite la disponibilité des données (tracking).
- **Dépendances :** `utm_*`, `source_id`, `industry`, `fleet_size`, `company_size`.

#### 4. RÈGLES DE VALIDATION

- **DB Constraints :** aucune.
- **App Validations :**
  - Score doit être compris entre 0 et 100.
  - 2 décimales maximum.
- **Format :** numérique.
- **Edge cases :**
  - Score manquant : par défaut, 0.
  - Score supérieur à 100 ou inférieur à 0 : corriger ou rejeter.
- **Error messages :** « Score invalide ».

#### 5. RÈGLES DE MISE À JOUR

- **Qui peut modifier :** Système; commercial peut ajuster via `qualification_score`.
- **Quand :**
  - Après chaque interaction (automatique).
  - Après l’import d’informations de firmographie.
- **Conditions :** Un recalcul complet peut être déclenché de manière hebdomadaire.
- **Impact :** Met à jour la priorisation du lead; peut changer `lead_stage`.
- **Audit :** Conserver l’historique des scores dans une table `lead_scores_history` (date, fit_score, engagement_score) pour analyse.

#### 6. RÈGLES MÉTIER SPÉCIFIQUES

Adopter la règle des 95/5 : seulement 5 % des leads sont prêts à acheter à un moment donné, il est crucial de maintenir une relation avec les 95 % restants et d’adapter les scores en conséquence【878354258421033†L124-L129】. Le score d’engagement doit être remis à zéro après X mois d’inactivité. Les leads avec un fit élevé mais un engagement faible doivent être mis dans un programme de nurturing à long terme【878354258421033†L258-L266】.

#### 7. SÉCURITÉ ET CONFIDENTIALITÉ

- **Sensibilité :** interne.
- **RGPD :** non – il s’agit de données dérivées.
- **Accès :** visibles par les commerciaux et l’IA de scoring.
- **Chiffrement :** non requis.
- **Rétention :** Historique conservé pour l’analyse.

#### 8. BEST PRACTICES CRM

- **Conformité :** ⚠️ à revoir – la complexité des scores peut mener à de l’over‑engineering.
- **Analyse :** Les best practices recommandent de se concentrer sur quelques critères clés (profil et interaction) et d’utiliser des données réelles pour calibrer le modèle【474932527120266†L177-L200】.
- **Recommandation :** Commencer avec un modèle simple, mesurer sa performance et itérer. Documenter les pondérations et éviter d’ajouter trop de variables.

---

### Colonne : `scoring` (JSONB)

#### 1. IDENTIFICATION

- **Type :** `jsonb`
- **Nullable :** oui
- **Défaut :** aucun
- **Contraintes :** aucune.
- **Index :** aucun.

#### 2. RÔLE FONCTIONNEL

Contient le détail du calcul des scores (fit et engagement) : liste des critères, poids et valeurs (ex : `{"fleet_size": 30, "industry": 20, "company_size": 15, "web_visits": 5, "email_opens": 10}`). Permet de justifier le score final et de l’ajuster.

#### 3. RÈGLES DE REMPLISSAGE

- **Quand :** Lors du calcul du score.
- **Qui :** Système.
- **Comment :** Génére un objet JSON où chaque clé correspond à un critère et chaque valeur à la contribution en points.
- **Conditions :** Doit être cohérent avec `fit_score` et `engagement_score` (la somme doit correspondre).
- **Dépendances :** `fit_score`, `engagement_score`.

#### 4. RÈGLES DE VALIDATION

- **DB Constraints :** aucune.
- **App Validations :**
  - Le JSON doit être valide.
  - Les clés doivent appartenir à un référentiel (liste blanche).
  - La somme des valeurs doit être = `fit_score + engagement_score`.
- **Format :** JSONB.
- **Edge cases :**
  - En cas d’erreur, consigner un message d’erreur et stocker la structure incomplète dans une table `scoring_errors`.
- **Error messages :** « Scoring detail invalide ».

#### 5. RÈGLES DE MISE À JOUR

- **Qui peut modifier :** Système.
- **Quand :** À chaque recalcul des scores.
- **Conditions :** Le format doit rester cohérent.
- **Impact :** Permet l’audit du scoring.
- **Audit :** Historique stocké.

#### 6. RÈGLES MÉTIER SPÉCIFIQUES

Peut être utilisé pour expliquer au commercial pourquoi un lead a un certain score. Permet de tester différents modèles de scoring (A/B testing). Les poids peuvent être ajustés par l’équipe marketing en fonction des données collectées【474932527120266†L177-L202】.

#### 7. SÉCURITÉ ET CONFIDENTIALITÉ

- **Sensibilité :** interne; contient des données dérivées.
- **RGPD :** non (pas de données personnelles directes).
- **Accès :** restreint aux admins et aux développeurs du scoring.
- **Chiffrement :** recommandé car il peut révéler des critères stratégiques.
- **Rétention :** conserver l’historique pour des analyses et audits.

#### 8. BEST PRACTICES CRM

- **Conformité :** ⚠️ à revoir – stocker des détails dans un champ JSON peut compliquer les requêtes et la maintenance.
- **Analyse :** Les best practices recommandent de conserver les détails du scoring dans une table séparée pour faciliter l’analyse et l’historique.
- **Recommandation :** Créer une table `lead_scoring_details` avec les colonnes `lead_id`, `criterion`, `weight`, `points`, `timestamp` pour chaque calcul.

---

### Colonne : `gdpr_consent` & `consent_at`

#### 1. IDENTIFICATION

- **Type :** `boolean` pour `gdpr_consent`; `timestamp with time zone` pour `consent_at`
- **Nullable :** oui
- **Défaut :** aucun
- **Contraintes :** aucune.
- **Index :** aucun.

#### 2. RÔLE FONCTIONNEL

Indique si le prospect a consenti à recevoir des communications marketing (`gdpr_consent`) et la date du consentement (`consent_at`). Obligatoire pour être conforme au RGPD : sans consentement explicite, il est interdit d’envoyer des emails marketing【659946551598018†L70-L74】.

#### 3. RÈGLES DE REMPLISSAGE

- **Quand :** Au moment où le lead coche la case de consentement sur un formulaire ou fournit son accord oral/écrit.
- **Qui :** Prospect ou commercial (sur base d’un consentement documenté).
- **Comment :** `gdpr_consent` est défini à `true` et `consent_at` à la date et l’heure du consentement.
- **Conditions :** Si `gdpr_consent` = true, `consent_at` doit être non null.
- **Dépendances :** `status` (le consentement peut devenir caduque si le lead est supprimé).

#### 4. RÈGLES DE VALIDATION

- **DB Constraints :** aucune.
- **App Validations :**
  - `consent_at` doit être >= `created_at`.
  - Le consentement doit être explicite et documenté (preuve de consentement).
- **Format :** boolean et timestamp.
- **Edge cases :**
  - Retrait du consentement : doit être enregistré; `gdpr_consent` devient false et `consent_at` reste inchangé (historique).
- **Error messages :** « Consentement manquant ».

#### 5. RÈGLES DE MISE À JOUR

- **Qui peut modifier :** Prospect via un lien de désinscription ou DPO.
- **Quand :** À tout moment.
- **Conditions :** Le retrait du consentement doit être pris en compte immédiatement : arrêter l’envoi d’emails marketing.
- **Impact :** Modifier les listes de diffusion; peut faire passer le lead en `lost` si l’intérêt est nul.
- **Audit :** Oui – conserver la trace de toutes les modifications pour prouver la conformité RGPD.

#### 6. RÈGLES MÉTIER SPÉCIFIQUES

Le consentement s’applique uniquement au marketing; les emails transactionnels restent autorisés (ex : confirmation de réunion). Les leads sans consentement sont intégrés dans un workflow de « prétendance » (nurturing passif) où seules des communications non commerciales sont envoyées.

#### 7. SÉCURITÉ ET CONFIDENTIALITÉ

- **Sensibilité :** personnel (informations sur les préférences).
- **RGPD :** Oui – nécessite un traitement conforme : preuve de consentement, droit à l’oubli, transparence.
- **Accès :** Restreint; visible uniquement par les commerciaux et DPO.
- **Chiffrement :** recommandé.
- **Rétention :** Les données de consentement doivent être conservées jusqu’à preuve du contraire (sauf demande d’effacement).

#### 8. BEST PRACTICES CRM

- **Conformité :** ✅ conforme – recueillir et tracer le consentement est obligatoire.
- **Analyse :** Les best practices conseillent de fournir un double opt‑in (email de confirmation) pour renforcer la preuve de consentement.
- **Recommandation :** Ajouter un champ `consent_proof_url` pointant vers la page de la politique de confidentialité signée ou vers un enregistrement du consentement.

---

### Colonne : `source_id`

#### 1. IDENTIFICATION

- **Type :** `uuid`
- **Nullable :** oui
- **Défaut :** aucun
- **Contraintes :** FK vers `crm_lead_sources(id)`【980194830822675†L52-L53】.
- **Index :** aucun.

#### 2. RÔLE FONCTIONNEL

Identifie la source marketing normalisée du lead via un référentiel `crm_lead_sources`. Permet d’éviter la dispersion des valeurs et d’analyser précisément les canaux (SEO, SEA, salon, parrainage). Ce champ est préféré à `source` pour le reporting【659946551598018†L82-L87】.

#### 3. RÈGLES DE REMPLISSAGE

- **Quand :** Lorsqu’une source connue est utilisée (campagne, canal).
- **Qui :** Système (tracking) ou commercial.
- **Comment :** L’ID est récupéré en consultant la table `crm_lead_sources` à partir des paramètres UTM ou du choix de l’utilisateur.
- **Conditions :** Si `source_id` est renseigné, le champ `source` doit être null.
- **Dépendances :** `crm_lead_sources`.

#### 4. RÈGLES DE VALIDATION

- **DB Constraints :** intégrité référentielle.
- **App Validations :** Vérifier que l’ID existe et correspond au tenant.
- **Format :** `uuid`.
- **Edge cases :** Source supprimée ou modifiée : mettre à jour le mapping.
- **Error messages :** « Source inconnue ».

#### 5. RÈGLES DE MISE À JOUR

- **Qui peut modifier :** Administrateur marketing ou commercial.
- **Quand :** Lorsqu’un mapping UTM → source est mis à jour.
- **Conditions :** Coherence; mettre `source` à null.
- **Impact :** Mise à jour du reporting.
- **Audit :** oui.

#### 6. RÈGLES MÉTIER SPÉCIFIQUES

Un changement de source peut déclencher un recalcul de score ou un changement de segment marketing (ex : leads d’événements obtiennent un traitement VIP). Permet d’identifier les canaux les plus rentables.

#### 7. SÉCURITÉ ET CONFIDENTIALITÉ

- **Sensibilité :** interne.
- **RGPD :** non.
- **Accès :** Marketing, commercial.
- **Chiffrement :** non.
- **Rétention :** illimitée.

#### 8. BEST PRACTICES CRM

- **Conformité :** ✅ conforme – l’utilisation d’une table de référence pour les sources est une best practice.
- **Analyse :** Simplifie l’analyse ROI.
- **Recommandation :** Forcer la saisie d’un `source_id` en rendant le champ obligatoire et déprécier `source`.

---

### Colonne : `opportunity_id`

#### 1. IDENTIFICATION

- **Type :** `uuid`
- **Nullable :** oui
- **Défaut :** aucun
- **Contraintes :** FK vers `crm_opportunities(id)`【980194830822675†L50-L51】.
- **Index :** aucun.

#### 2. RÔLE FONCTIONNEL

Relie le lead à l’opportunité créée à partir de ce lead. Permet de suivre la progression et d’éviter les duplications (un lead ne doit donner qu’une seule opportunité active). Sert à passer du module CRM (prospection) au module deals/opportunités (négociation).

#### 3. RÈGLES DE REMPLISSAGE

- **Quand :** Lors de la création d’une opportunité.
- **Qui :** Système.
- **Comment :** Automatique : lorsqu’un enregistrement est inséré dans `crm_opportunities` avec `lead_id` = `id`.
- **Conditions :** Le lead doit avoir un `status` = `qualified`.
- **Dépendances :** `status`, `lead_stage`.

#### 4. RÈGLES DE VALIDATION

- **DB Constraints :** intégrité référentielle.
- **App Validations :** Un lead ne peut avoir qu’une seule opportunité active ; s’il existe déjà une opportunité liée, prévenir.
- **Format :** `uuid`.
- **Edge cases :**
  - Opportunité abandonnée : `opportunity_id` peut être laissé pour l’historique mais `status` passe à `lost`.
- **Error messages :** « Opportunité déjà existante pour ce lead ».

#### 5. RÈGLES DE MISE À JOUR

- **Qui peut modifier :** Système.
- **Quand :** Lors de la création ou clôture d’une opportunité.
- **Conditions :** Ne peut pas être modifié manuellement.
- **Impact :** Fixe le lien entre les entités.
- **Audit :** Oui.

#### 6. RÈGLES MÉTIER SPÉCIFIQUES

Permet de naviguer rapidement de la fiche lead à l’opportunité. Le processus de conversion doit créer l’opportunité, copier les informations pertinentes du lead et verrouiller certains champs du lead (ex : `company_name`).

#### 7. SÉCURITÉ ET CONFIDENTIALITÉ

- **Sensibilité :** interne.
- **RGPD :** non.
- **Accès :** visible par les équipes de vente.
- **Chiffrement :** non.
- **Rétention :** illimitée.

#### 8. BEST PRACTICES CRM

- **Conformité :** ✅ conforme – établir un lien fort entre le lead et l’opportunité est essentiel pour la traçabilité.
- **Analyse :** Les best practices recommandent d’automatiser la copie des données et d’éviter les modifications manuelles après la conversion.
- **Recommandation :** Ajouter un champ `converted_by` pour tracer l’utilisateur ayant converti le lead.

---

### Colonne : `next_action_date`

#### 1. IDENTIFICATION

- **Type :** `timestamp with time zone`
- **Nullable :** oui
- **Défaut :** aucun
- **Contraintes :** aucune.
- **Index :** aucun.

#### 2. RÔLE FONCTIONNEL

Date de la prochaine action planifiée par le commercial (appel, email, réunion). Permet de ne jamais laisser un lead sans suivi, ce qui améliore le taux de conversion【659946551598018†L76-L80】.

#### 3. RÈGLES DE REMPLISSAGE

- **Quand :**
  - Après chaque interaction (ex : appel, meeting).
  - Lors de la création du lead (peut être initialisée à +2 jours pour rappel).
- **Qui :** Commercial ou système (workflow automation).
- **Comment :** Saisie manuelle ou calcul par la logique business (ex : `next_action_date` = `now() + 14 days` pour un lead en nurturing).
- **Conditions :** `next_action_date` doit toujours être dans le futur; si dépassé, une alerte est déclenchée.
- **Dépendances :** `status`, `lead_stage`, `qualification_score`.

#### 4. RÈGLES DE VALIDATION

- **DB Constraints :** aucune.
- **App Validations :**
  - La date doit être > `now()`.
  - Ne doit pas être antérieure à `created_at`.
- **Format :** ISO 8601.
- **Edge cases :**
  - Absence de prochaine action : déclencher une alerte pour assigner une date.
- **Error messages :** « Date de prochaine action invalide ».

#### 5. RÈGLES DE MISE À JOUR

- **Qui peut modifier :** Commercial ou système.
- **Quand :** Après chaque interaction ou lorsqu’un lead change de stage/score.
- **Conditions :** La nouvelle date doit être supérieure à la précédente (sauf annulation).
- **Impact :** Génère des tâches dans l’agenda du commercial, déclenche des notifications à la date prévue.
- **Audit :** Oui – conserver l’historique pour mesurer le temps entre actions.

#### 6. RÈGLES MÉTIER SPÉCIFIQUES

La planification d’une prochaine action est obligatoire pour tous les leads `qualified`. Un script tourne quotidiennement pour identifier les leads avec `next_action_date` passée et envoyer des rappels. Les leads sans action depuis X jours sont marqués en risque de perte.

#### 7. SÉCURITÉ ET CONFIDENTIALITÉ

- **Sensibilité :** interne.
- **RGPD :** non.
- **Accès :** Commerciaux et managers.
- **Chiffrement :** non.
- **Rétention :** Historique conservé.

#### 8. BEST PRACTICES CRM

- **Conformité :** ✅ conforme – planifier la prochaine action est une best practice pour éviter l’oubli des leads【659946551598018†L76-L80】.
- **Analyse :** Les best practices recommandent d’utiliser des workflows automatiques pour générer des tâches et de respecter la règle des 5 minutes (répondre rapidement)【878354258421033†L124-L129】.
- **Recommandation :** Mettre en place un tableau de bord des actions à venir et un rappel par SMS/email.

---

## WORKFLOWS IMPLIQUÉS

1. **Création de lead (webform)** :
   - Prospect remplit un formulaire (nom, email, téléphone, pays, flotte).
   - Un script capture les UTM et IP; remplit `utm_*`, `metadata`.
   - Le système crée le lead (`status` = `new`, `lead_stage` = `top_of_funnel`) avec `created_at`, `assigned_to` via round‑robin.
   - Une notification est envoyée au commercial assigné et un `next_action_date` est fixé à +1 jour.

2. **Qualification** :
   - Commercial contacte le lead dans les 5 minutes suivant la création【878354258421033†L124-L129】.
   - Complète les champs `fleet_size`, `current_software`, `industry`.
   - Le système calcule `fit_score` et `engagement_score` selon les critères (firms, interactions).
   - Le commercial attribue un `qualification_score` et change `status` en `qualified`, `lead_stage` en `sales_qualified` le cas échéant; `qualified_date` est fixé.
   - Mise à jour du `next_action_date` (ex : réunion de démo dans 3 jours).

3. **Nurturing** :
   - Pour les leads `top_of_funnel` ou `marketing_qualified` avec un faible engagement, le système envoie une série d’emails éducatifs.
   - Les interactions (ouvertures, clics) mettent à jour l’`engagement_score`.
   - Si le lead montre un intérêt (score élevé), il est requalifié en `sales_qualified`.
   - Sinon, il reste dans la boucle (95 % du marché n’est pas prêt à acheter【878354258421033†L124-L129】).

4. **Conversion en opportunité** :
   - Lorsque le lead est prêt, le commercial crée une opportunité via l’interface.
   - Le système crée un enregistrement dans `crm_opportunities`, copie les données du lead, fixe `opportunity_id` et `converted_date`, change `status` en `converted` et `lead_stage` en `opportunity`.
   - Les champs du lead deviennent en lecture seule (nom, email, etc.).

5. **Perte ou abandon** :
   - Si le lead est jugé non pertinent ou non joignable, le commercial passe le `status` à `lost` et renseigne `deletion_reason`, et un workflow de feedback se déclenche (collecte de la raison, automatisation d’un email de « désolé »).
   - Les leads perdus peuvent être ré‑engagés via des campagnes spécifiques.

6. **Suppression et anonymisation** :
   - Sur demande du prospect ou après expiration du délai légal, le DPO anonymise les données.
   - Les champs personnels (email, phone, first_name, last_name) sont remplacés par des valeurs anonymes ou hachées, `deleted_at` et `deletion_reason` sont renseignés.
   - Les données agrégées (scores, dates) restent pour les analyses statistiques.

## SCÉNARIOS MÉTIER CRITIQUES

1. **Lead chaud converti** : Un prospect remplit le formulaire, un commercial le contacte immédiatement, qualifie le lead comme pertinent (score 85), planifie une démo, puis crée une opportunité. Le processus se déroule sans friction; le lead est converti en moins d’une semaine.
2. **Lead froid nurturé** : Un lead top of funnel ayant un faible `fit_score` mais un potentiel à long terme reste dans les campagnes marketing pendant plusieurs mois. Il passe en `sales_qualified` lorsqu’il télécharge un livre blanc et demande une démo. Les scores se mettent à jour automatiquement. Le prospect est converti plus tard.
3. **Lead perdu** : Un lead est jugé non pertinent (flotte de 1 véhicule, sans budget). Le commercial met `status` à `lost` et renseigne `deletion_reason` = `no_budget`. Le système déclenche un workflow de feedback et retire le lead des campagnes. Les données restent pour l’analyse des raisons de perte.
4. **Erreur de saisie** : Une adresse email erronée est détectée; le commercial corrige l’email. Le système vérifie l’unicité, met à jour `updated_at` et envoie une notification de correction. Les données des campagnes sont réattribuées à la nouvelle adresse.
5. **Demande RGPD** : Un lead demande la suppression de ses données. Le DPO renseigne `deleted_at`, `deletion_reason` = `requested_by_user`, anonymise les champs personnels et supprime le lead des listes marketing. Le système conserve des informations agrégées pour la statistique.

## RÈGLES DE COHÉRENCE INTER‑COLONNES

- `status`, `lead_stage`, `qualified_date`, `converted_date` et `opportunity_id` doivent évoluer de manière cohérente (pas de date de conversion sans opportunité).
- Si `gdpr_consent` = true, `consent_at` doit être non null.
- Si `status` = `converted`, `opportunity_id` doit être non null.
- `qualification_score` ne peut être non nul que si `fit_score` et `engagement_score` sont renseignés.
- `next_action_date` doit toujours être ultérieure à `updated_at`.
- Si `deleted_at` est non null, tous les champs personnels (email, phone, first_name, last_name) doivent être anonymisés ou inaccessibles.

## RÈGLES DE COHÉRENCE INTER‑TABLES

- `assigned_to`, `created_by`, `updated_by`, `deleted_by` doivent référencer des IDs existants dans `adm_provider_employees` et appartenant au même tenant.
- `source_id` doit référencer un `crm_lead_sources` actif et appartenant au même tenant.
- `opportunity_id` doit référencer une opportunité dont `lead_id` = `id`.
- Un lead converti doit avoir exactement une opportunité active et au plus un contrat en cours (`crm_contracts`).
- Les index partiels sur `deleted_at` doivent s’aligner avec les triggers de soft delete.
- Toute modification du lead doit créer une entrée dans `adm_audit_logs`.

## ALERTES ET NOTIFICATIONS

- **Nouvelle création de lead** : notifier le commercial assigné via email/app mobile.
- **Lead sans action** : envoyer un rappel 24 h avant et le jour même si `next_action_date` approche.
- **Lead sans contact** : alerte si aucun `updated_at` depuis 7 jours.
- **Changement de statut** : informer le manager.
- **Retrait de consentement** : notifier l’équipe marketing pour retirer le lead des listes.
- **Suppression de lead** : alerter la DPO et supprimer l’entrée des systèmes externes.

## MÉTRIQUES ET KPI

- **Taux de qualification** : % de leads `qualified` / leads `new`.
- **Taux de conversion** : % de leads `converted` / leads `qualified`.
- **Délai moyen de réponse** : temps entre `created_at` et première mise à jour (`updated_at`).
- **Temps de qualification** : `qualified_date` – `created_at`.
- **Temps de conversion** : `converted_date` – `qualified_date`.
- **Score moyen** : moyennes de `fit_score`, `engagement_score`, `qualification_score`.
- **ROI par source** : nombre d’opportunités/clients générés par `source_id` ou `utm_campaign`.
- **Taux de désabonnement** : nombre de leads qui retirent leur consentement.
- **Taux de perte** : % de leads `lost`.

## POINTS D’ATTENTION POUR LE DÉVELOPPEMENT

- **Performance** : Les champs JSONB (`metadata`, `scoring`) nécessitent des index GIN et une gouvernance stricte.
- **Triggers** : Vérifier l’ordre d’exécution des triggers `set_updated_at` et des triggers spécifiques (ex : génération de `lead_code`).
- **Internationalisation** : Les dates (`next_action_date`) doivent tenir compte des fuseaux horaires des prospects (fuseau du tenant).
- **Sécurité** : Utiliser des politiques Row Level Security (RLS) pour isoler les données entre tenants et contrôler l’accès aux leads.
- **RGPD** : Mettre en place des procédures d’anonymisation et de purge automatisée.
- **Scoring** : Garder le modèle transparent et simple pour éviter l’over‑engineering. Basé sur les best practices (persona, firmographics, interactions)【474932527120266†L177-L200】.
- **Synchronisation** : Lors de la conversion, synchroniser les données du lead vers l’opportunité et le contrat de manière transactionnelle pour éviter les incohérences.
- **Tests** : Prévoir des tests unitaires et d’intégration couvrant les cas limites (emails invalides, changements de statut interdits, absence de consentement).
- **Documentation** : Mettre à jour régulièrement les référentiels (sources, industries, plages de flotte) et les publier pour les utilisateurs.
