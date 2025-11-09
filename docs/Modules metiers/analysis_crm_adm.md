# Analyse des flux métiers CRM et Administration

## Introduction et sources utilisées

Cette analyse couvre les modules **CRM** et **Administration** de la plateforme FleetCore. Elle se fonde exclusivement sur trois documents :

- les spécifications fonctionnelles `_ADM_ONLY` et `_CRM_ONLY`, qui décrivent les évolutions prévues entre la version 1 et la version 2;
- le fichier **SUPABASE_SCHEMA_REFERENCE.md** qui présente l’état réel de la base de données après implémentation (101 tables introspectées dans la production)【521462979844660†L1590-L1625】.

Le but est de documenter les processus métier de bout en bout, d’identifier les entités et relations impliquées, de cartographier les états et transitions, de lister les règles métier explicites et de distinguer ce qui a déjà été implémenté de ce qui reste à faire.

Les sections suivantes analysent successivement les flux CRM, les flux Administration, les interactions entre modules, les cas d’usage, les états et transitions, les règles métier et les métriques clés.

---

## 1 . Flux CRM – du prospect au client

### 1.1 Entités et modèle de données

Le module CRM se compose de trois entités principales : **Leads** (`crm_leads`), **Opportunities** (`crm_opportunities`) et **Contracts** (`crm_contracts`), auxquelles s’ajoutent des tables de référence indispensables comme `crm_lead_sources`, `crm_opportunity_loss_reasons`, `crm_pipelines` et `crm_addresses`【521462979844660†L2475-L2564】.  
Ces entités sont internes à FleetCore (pas de `tenant_id`) et servent à gérer un prospect jusqu’à sa conversion en client.

- **Leads** : la version 2 enrichit la table avec un identifiant stable `lead_code`, la scission du nom en `first_name` et `last_name`, la normalisation de la société (`company_name`), l’ajout de champs marketing (`industry`, `company_size`, `website_url`, `linkedin_url`, `city`), des scores de qualification (`fit_score`, `engagement_score`), des indicateurs RGPD (`gdpr_consent`, `consent_at`) et des références (`source_id`, `assigned_to`, `opportunity_id`, `next_action_date`)【521462979844660†L2510-L2554】.  
  Le schéma réel montre que tous ces champs sont présents ; il subsiste toutefois les anciens champs `full_name` et `demo_company_name` (hérités de la V1) – leur suppression n’est pas encore réalisée【521462979844660†L2510-L2554】.

- **Lead sources (`crm_lead_sources`)** : table de référence pour normaliser les canaux marketing. Présente dans le schéma avec les colonnes `name`, `description`, `is_active` et `created_at`【521462979844660†L2475-L2498】.

- **Opportunities** : reflètent les pistes commerciales dérivées d’un lead. Les évolutions V2 distinguent un **stage** (prospect → proposal → negotiation) d’un **status** (`open`, `won`, `lost`, `on_hold`, `cancelled`), ajoutent des informations financières (`currency`, `discount_amount`, `forecast_value`, `won_value`), des dates (`expected_close_date`, `won_date`, `lost_date`), des références (`plan_id` vers un plan de facturation, `contract_id` vers le contrat, `owner_id`, `pipeline_id`) et un `loss_reason_id` vers la table `crm_opportunity_loss_reasons`【521462979844660†L2614-L2651】.  
  Tous ces champs figurent dans le schéma réel, confirmant que la séparation stage / status et les liens vers d’autres modules ont été implémentés【521462979844660†L2614-L2651】.

- **Opportunity loss reasons (`crm_opportunity_loss_reasons`)** : table pour enregistrer les motifs de perte (prix, fonctionnalités, concurrence…). Elle existe avec `name`, `category`, `description` et `is_active`【521462979844660†L2729-L2743】.

- **Pipelines (`crm_pipelines`)** : permettent de configurer des pipelines de vente multiples. La table contient `name`, `description`, `stages`, `default_probability`, `is_default`, `is_active` et `created_at`【521462979844660†L2757-L2773】.

- **Contracts (`crm_contracts`)** : matérialisent l’accord final. Le modèle V2 définit un cycle de vie complet avec des statuts (`draft`, `negotiation`, `signed`, `active`, `future`, `expired`, `terminated`, `renewal_in_progress`, `cancelled`), un identifiant unique `contract_code`, la gestion du renouvellement (`renewal_type`, `auto_renew`, `renewal_date`, `notice_period_days`, `renewed_from_contract_id`), des liens forts (`opportunity_id`, `tenant_id`, `plan_id`, `subscription_id`), des informations de contact et de facturation (`company_name`, `contact_name`, `billing_address_id`), un `version_number` et un `document_url`【521462979844660†L2334-L2381】.  
  Le schéma confirme la présence de ces colonnes et des clés étrangères【521462979844660†L2334-L2381】.

- **Addresses (`crm_addresses`)** : utilisées pour stocker les adresses de facturation ou d’expédition (colonne `address_type`) avec `street_line1`, `street_line2`, `city`, `state`, `postal_code`, `country_code` et `is_default`【521462979844660†L2306-L2324】.

### 1.2 Flux métier détaillé

#### Étape 1 : capture d’un lead

1. **Origine** : un prospect soumet un formulaire (site web, évènement, recommandation, campagne marketing, etc.). Les champs collectés incluent le nom complet ou des champs séparés, l’email, le téléphone et la société.
2. **Création du lead** : l’équipe commerciale enregistre un enregistrement dans la table `crm_leads` avec les informations recueillies. La nouvelle V2 génère un `lead_code` unique et scinde `first_name` et `last_name` pour personnaliser les communications【526889723587789†L27-L59】.
3. **Source et tracking** : `source_id` référence `crm_lead_sources`; `utm_source`, `utm_medium`, `utm_campaign` permettent d’identifier la campagne marketing. Ces informations fournissent des KPIs de ROI marketing.
4. **Consentement RGPD** : la collecte du consentement marketing est stockée via `gdpr_consent` et `consent_at`; en l’absence de consentement, les communications automatisées sont désactivées【526889723587789†L60-L85】.
5. **Assignation** : un membre du support provider (`adm_provider_employees`) est assigné via `assigned_to`. L’assignation initiale peut être automatique (règles par région) ou manuelle par un manager.
6. **Action planifiée** : `next_action_date` permet de planifier des relances; l’absence de valeur est un indicateur de retard.

#### Étape 2 : qualification et scoring

1. **Scoring avancé** : la version 2 introduit `lead_stage` (top_of_funnel, marketing_qualified, sales_qualified, opportunity) ainsi que `fit_score`, `engagement_score` et un champ `scoring` JSON pour stocker des critères détaillés (ex. budget, taille de flotte, secteur).
   - Le `fit_score` mesure l’adéquation du lead avec l’offre (taille de flotte, industrie).
   - L’`engagement_score` mesure l’interaction (clics, ouverture d’emails)【526889723587789†L54-L58】.
   - Ces scores permettent de prioriser les leads chauds et réduisent jusqu’à 60 % du temps passé sur des prospects peu qualifiés【526889723587789†L81-L85】.
2. **Qualification** : la qualification manuelle par un commercial ajoute des commentaires (`qualification_notes`) et un `qualification_score` et bascule éventuellement le `status` de `new` à `qualified`.
3. **Changement d’assigne** : en fonction des scores, le lead peut être réassigné à un autre commercial (`assigned_to`) ou escaladé.
4. **Validation RGPD** : l’envoi de communications marketing n’est autorisé que si `gdpr_consent` est vrai.

#### Étape 3 : conversion en opportunité

1. **Création d’une opportunité** : lorsqu’un lead est jugé prometteur, un enregistrement est créé dans `crm_opportunities` en référence au lead (`lead_id`).
   - `stage` initial = `prospect`; `status` = `open`; `expected_value` et `currency` sont renseignés.
   - `close_date`/`expected_close_date` définissent une date cible de signature.
2. **Gestion de pipeline** : l’opportunité est associée à un `pipeline_id` provenant de `crm_pipelines`, ce qui permet d’adapter le nombre d’étapes ou la probabilité par étape par marché (ex. pipeline “UAE Startups” vs “Corporate”).
3. **Assignation** : `assigned_to` renvoie le commercial responsable; `owner_id` désigne le manager ou account owner final.
4. **Prévisions** :
   - `probability` (entier de la V1) et `probability_percent` (V2) indiquent la probabilité de succès.
   - `forecast_value` est un champ généré calculant la valeur attendue × probabilité/100, améliorant la précision du budget 2025 à ±5 %【526889723587789†L140-L147】.
5. **Décision** : lorsque l’opportunité aboutit, `status` passe à `won`; sinon, `status` = `lost` et le `loss_reason_id` référence `crm_opportunity_loss_reasons` pour alimenter des analyses stratégiques.  
   Des dates `won_date` ou `lost_date` capturent le moment de la décision【521462979844660†L2614-L2651】.
6. **Liaison aux autres modules** : lors de la phase de proposition, le commercial peut associer un `plan_id` (plan SaaS) pour estimer la tarification.

#### Étape 4 : négociation et signature du contrat

1. **Rédaction du contrat** : une fois l’opportunité en phase de négociation ou d’accord, un contrat est généré dans `crm_contracts`. Le `contract_reference` (ref unique) est créé et le `contract_code` (identifiant technique) peut être utilisé pour les intégrations. Les dates `contract_date`, `effective_date` et `expiry_date` définissent la durée【526889723587789†L150-L199】.
2. **Cycle de vie du contrat** :
   - **Statuts** : `draft` (en cours de rédaction), `negotiation` (allers-retours), `signed` (signatures obtenues), `active` (effectif), `future` (signé mais pas encore effectif), `expired`, `terminated`, `renewal_in_progress` ou `cancelled`【526889723587789†L164-L167】.
   - **Renouvellement** : `renewal_type` (automatic, optional, perpetual, non_renewing) indique la politique. `auto_renew` déclenche une reconduction automatique; `renewal_date` et `notice_period_days` définissent les échéances de notification; `renewed_from_contract_id` permet de tracer l’historique des reconductions【521462979844660†L2334-L2381】.
3. **Lien systémique** : le contrat référence l’opportunité (`opportunity_id`), le futur client (`tenant_id`), le plan choisi (`plan_id`) et l’abonnement créé (`subscription_id`). Il inclut un lien vers le PDF signé (`document_url`) et enregistre les coordonnées de facturation (`contact_name`, `billing_address_id`)【526889723587789†L169-L207】.
4. **Validation** : `approved_by` stocke l’identifiant d’un membre ou provider employee ayant validé le contrat; `version_number` gère les avenants successifs.

#### Étape 5 : création du tenant et onboarding

1. **Création du tenant** : lorsque le contrat est signé (status `signed` puis `active`), un nouveau tenant est créé dans la table `adm_tenants` (voir section 2). Le `tenant_id` du contrat est renseigné.
2. **Plan et abonnement** : l’opportunité et le contrat référencent un `plan_id`; la création du tenant déclenche la création d’une subscription dans `bil_tenant_subscriptions` (module Billing) via `subscription_id`.
3. **Onboarding** : un provider employee initie une invitation (`adm_invitations`) pour l’utilisateur administrateur du nouveau tenant. La procédure d’invitation est détaillée dans la section 2.

### 1.3 États et transitions des entités CRM

Pour chaque entité principale, les documents spécifient les états possibles et les déclencheurs :

| Entité          | États / Statuts                                                                                                                                       | Transitions et déclencheurs                                                                                                                                                                                                                                   | Acteurs concernés                           |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| **Lead**        | `new` → `qualified` → `converted` → `lost` (V1) ; `lead_stage` additionnel (`top_of_funnel`, `marketing_qualified`, `sales_qualified`, `opportunity`) | Création initiale `new`; qualification manuelle/automatique via `fit_score` et `engagement_score`; conversion quand une opportunité est créée (`converted_date`); perte lorsque l’intérêt disparaît (`status = lost`)                                         | Commercial (provider employee)              |
| **Opportunity** | `open`, `on_hold`, `cancelled` (en plus de `won`/`lost`)【526889723587789†L101-L110】                                                                 | Création en `open`; progression de `stage` (prospect → proposal → negotiation) gérée via `crm_pipelines`; passage à `won` lors de l’acceptation; `lost` suite à refus; `on_hold` pour suspension temporaire; `cancelled` en cas d’annulation avant conclusion | Commercial (assigned) + Manager (owner)     |
| **Contract**    | `draft`, `negotiation`, `signed`, `active`, `future`, `expired`, `terminated`, `renewal_in_progress`, `cancelled`【526889723587789†L164-L167】        | Passages déclenchés par signature, date d’effet, expiration automatique, résiliation; `renewal_in_progress` déclenché par un traitement batch avant `renewal_date`; `terminated` après résiliation; `cancelled` en cas d’annulation avant prise d’effet       | Commercial + Système (facturation) + Client |

### 1.4 Cas d’usage métier (CRM)

Voici des scénarios représentatifs :

#### Cas 1 : Prospection issue d’un salon professionnel

1. **Enregistrement du lead** : un commercial saisit un prospect rencontré lors d’un salon. Les champs `first_name`, `last_name`, `company_name`, `email`, `phone`, `industry` et `source_id` (valeur `event`) sont complétés.
2. **Consentement** : le prospect coche la case consentement RGPD dans le formulaire; `gdpr_consent` = true avec `consent_at` horodaté.
3. **Qualification** : après une première discussion, le commercial actualise `fit_score` sur 80 /100 et `engagement_score` sur 50 /100; `lead_stage` passe de `top_of_funnel` à `sales_qualified`.
4. **Assignation** : un manager réaffecte le lead à un autre commercial (changement de `assigned_to`).
5. **Conversion** : l’équipe crée une opportunité `crm_opportunities` avec `lead_id`, `expected_value` 10 000 EUR et `stage` = `prospect`.
6. **Négociation** : la pipeline associée contient trois étapes et applique des `default_probability` (ex. 30 %, 60 %, 80 %). Lors de la négociation, le commercial met à jour `probability_percent` selon la progression.
7. **Conclusion** : après signature, l’opportunité est marquée `won`. Un contrat est généré avec `contract_code`, `status` = `signed`, `renewal_type` = `optional`, `renewal_date` = date + 12 mois.
8. **Client actif** : un tenant est créé avec le plan choisi; l’abonnement est activé; un email d’invitation est envoyé à l’administrateur du client via `adm_invitations`.

#### Cas 2 : Perte d’une opportunité et amélioration produit

1. **Suivi des pertes** : une opportunité passe en `lost`. Le commercial sélectionne un `loss_reason_id` (`Fonctionnalités manquantes`) et ajoute un commentaire.
2. **Analyse** : le product manager consulte les statistiques des pertes pour identifier que 20 % des opportunités sont perdues pour cette raison, ce qui déclenche une évolution du roadmap produit.
3. **Réactivation** : quelques mois plus tard, suite à l’ajout des fonctionnalités, un contact réapparaît. L’ancienne opportunité ne change pas de statut, mais un nouveau lead est créé (ou le même est réactivé), ce qui constitue un nouveau cycle.

### 1.5 Règles métier explicites (CRM)

Les documents spécifient plusieurs règles :

- **Unicité** : `crm_leads.email` doit être unique parmi les leads actifs (index `crm_leads_email_unique_active`)【521462979844660†L2585-L2589】. `lead_code` est unique (`crm_leads_lead_code_key`)【521462979844660†L2590-L2592】. `crm_contracts.contract_reference` et `contract_code` sont uniques tant que `deleted_at` est null【521462979844660†L2334-L2381】.
- **Consentement RGPD** : aucun emailing marketing ne peut être envoyé sans `gdpr_consent` = true; `consent_at` doit être enregistré【526889723587789†L60-L63】.
- **Qualification obligatoire** : avant de créer une opportunité, un lead doit être qualifié (`lead_stage` = `sales_qualified`), sinon un message d’erreur est retourné.
- **Statut vs Stage** : pour `crm_opportunities`, `stage` reflète l’étape de vente tandis que `status` indique l’état final (open, won, lost…); les deux doivent être gérés séparément【526889723587789†L101-L106】.
- **Prévision automatique** : `forecast_value` est calculé par la base ou par l’ORM (expected_value × probability_percent / 100)【526889723587789†L140-L147】.
- **Renouvellement automatique** : un contrat avec `auto_renew=true` déclenche la création d’un nouveau contrat à `renewal_date` et une notification au client `notice_period_days` avant【526889723587789†L174-L179】.
- **Lien obligatoire vers plan et abonnement** : un contrat ne peut passer à `active` que si `plan_id` et `subscription_id` sont renseignés (le module Billing doit créer la subscription).
- **Soft-delete** : tous les enregistrements CRM comportent `deleted_at` et ne doivent pas être physiquement supprimés; les index uniques utilisent une condition `deleted_at IS NULL`【521462979844660†L2585-L2589】.

### 1.6 Métriques et KPIs CRM

Le modèle permet de calculer de nombreux indicateurs :

| KPI                                          | Description                                                                 | Tables et champs impliqués                            |
| -------------------------------------------- | --------------------------------------------------------------------------- | ----------------------------------------------------- |
| **Taux de conversion lead → opportunité**    | nombre d’opportunités créées / nombre total de leads qualifiés              | `crm_leads` (lead_stage), `crm_opportunities.lead_id` |
| **Taux de conversion opportunité → contrat** | opportunités avec `status=won` / opportunités totales                       | `crm_opportunities.status`                            |
| **Cycle moyen de vente**                     | moyenne de (`lost_date` ou `won_date` − `created_at`)                       | `crm_opportunities` dates                             |
| **Valeur prévisionnelle du pipeline**        | somme de `forecast_value` pour les opportunités `status=open`               | `crm_opportunities.forecast_value`                    |
| **Raisons de perte**                         | distribution des `loss_reason_id`                                           | `crm_opportunity_loss_reasons`                        |
| **Score moyen par source**                   | moyenne de `fit_score` et `engagement_score` par `source_id`                | `crm_leads`                                           |
| **Renouvellements automatiques**             | nombre de contrats avec `auto_renew=true` arrivant à échéance dans 30 jours | `crm_contracts.renewal_date`, `auto_renew`            |
| **Temps d’activation**                       | temps entre `crm_contracts.signed` et la création du `adm_tenants` associé  | `crm_contracts`, `adm_tenants.created_at`             |

---

## 2 . Flux Administration – gestion du cycle de vie des tenants et des utilisateurs

### 2.1 Entités et modèle de données

Le domaine Administration comprend huit tables principales dans la version 2 et plusieurs tables complémentaires. Les entités clés sont **Tenants** (`adm_tenants`), **Members** (`adm_members`), **Roles** (`adm_roles`), **Member Roles** (`adm_member_roles`), **Provider Employees** (`adm_provider_employees`), **Audit Logs** (`adm_audit_logs`), **Tenant Lifecycle Events** (`adm_tenant_lifecycle_events`) et **Invitations** (`adm_invitations`). S’ajoutent les tables de permissions, versions et sessions.

- **Tenants (`adm_tenants`)** : identifie les organisations clientes. La version 2 ajoute un `status` (`trialing`, `active`, `suspended`, `past_due`, `cancelled`), des champs de contact (`primary_contact_email`, `primary_contact_phone`, `billing_email`), des dates (`onboarding_completed_at`, `trial_ends_at`, `next_invoice_date`)【521462979844660†L1593-L1625】. On remarque que le schéma réel inclut ces colonnes, mais ne contient pas (encore) les structures de **metadata** prévues (billing_config, feature_flags, compliance_settings, custom_fields), qui restent donc à implémenter【521462979844660†L1593-L1625】.

- **Members (`adm_members`)** : représentent les utilisateurs finaux d’un tenant. Le schéma inclut des améliorations de sécurité : `email_verified_at`, `two_factor_enabled`, `two_factor_secret`, `password_changed_at`, `failed_login_attempts`, `locked_until`, `default_role_id`, `preferred_language`, `notification_preferences`【521462979844660†L1087-L1121】. On note cependant que l’attribut `role` (string) de la V1 est encore présent; la gestion par la table `adm_member_roles` remplace partiellement ce champ.

- **Roles (`adm_roles`)** : stocke les définitions de rôles RBAC par tenant. La V2 ajoute un `slug` stable, une hiérarchie (`parent_role_id`), des indicateurs `is_system` et `is_default`, un `max_members`, des dates de validité (`valid_from` / `valid_until`) et un flag `approval_required`【521462979844660†L1360-L1389】. Le schéma montre que toutes ces colonnes sont implémentées.

- **Role permissions (`adm_role_permissions`)** : nouvelle table permettant de définir les droits par ressource (`resource`, `action`, `conditions`)【521462979844660†L1224-L1325】. Présente dans le schéma.

- **Role versions (`adm_role_versions`)** : assure l’historique des rôles avec un `permissions_snapshot` et un `version_number`【521462979844660†L1328-L1343】. Présente.

- **Member roles (`adm_member_roles`)** : table de liaison entre members et rôles. La version 2 ajoute des champs de traçabilité (`assigned_by`, `assignment_reason`), des périodes de validité (`valid_from`, `valid_until`), un indicateur `is_primary`, des scopes (`scope_type`, `scope_id`) et une `priority` pour résoudre les conflits【521462979844660†L962-L989】. Toutes ces colonnes figurent dans le schéma.

- **Member sessions (`adm_member_sessions`)** : nouvelle table pour gérer les sessions actives (jeton, IP, agent, expiration)【521462979844660†L1051-L1067】.

- **Audit logs (`adm_audit_logs`)** : enregistre chaque action avec un `entity`, `entity_id`, `action`, `changes`, `ip_address`, `user_agent` et un `timestamp`. La V2 enrichit avec `severity`, `category`, `session_id`, `request_id`, `old_values`, `new_values`, `retention_until` et des `tags`【521462979844660†L845-L865】. Le schéma confirme ces colonnes.

- **Provider employees (`adm_provider_employees`)** : représente le personnel interne FleetCore (support, sales, finance). La V2 ajoute des permissions spéciales (`permissions` JSON), un statut, la possibilité de se voir attribuer un `supervisor_id` et de gérer l’onboarding cross-tenant【521462979844660†L1224-L1248】. Le schéma inclut ces champs mais ne comporte pas des colonnes telles que `can_impersonate` ou `max_support_tickets` mentionnées dans le document, ce qui indique des évolutions encore à implémenter【613861903396476†L156-L167】.

- **Tenant lifecycle events (`adm_tenant_lifecycle_events`)** : trace tous les changements d’état d’un tenant avec `event_type`, `effective_date`, `performed_by` et `description`【521462979844660†L1452-L1466】. Le document prévoyait un contexte complet (reason, previous_status, new_status, plan changes, notifications)【613861903396476†L171-L205】; la table actuelle est simplifiée et nécessite donc des colonnes supplémentaires pour atteindre la définition V2.

- **Invitations (`adm_invitations`)** : gère l’onboarding sécurisé des nouveaux membres. La V2 prévoit un `token` unique, des dates d’expiration (`expires_at`), un statut (`pending`, `accepted`, `expired`, `revoked`), un suivi des envois (`sent_at`, `sent_count`, `last_sent_at`), l’acceptation (`accepted_at`, `accepted_from_ip`, `accepted_by_member_id`), un `invitation_type` et un lien `sent_by` vers un provider employee【613861903396476†L209-L242】. Toutes ces colonnes sont présentes dans le schéma【521462979844660†L913-L940】.

- **Tenant settings (`adm_tenant_settings`)** : stocke des paramètres clés/valeur par tenant, avec possibilité de chiffrer le contenu (`is_encrypted`)【521462979844660†L1450-L1527】.

### 2.2 Flux métier détaillé – cycle de vie des tenants

#### Étape 1 : création d’un tenant

1. **Origine** : un tenant est créé soit automatiquement lors de la signature d’un contrat CRM (voir flux CRM), soit manuellement par un provider employee pour un client pilote.
2. **Création de l’entrée** : un enregistrement est inséré dans `adm_tenants`. Les champs obligatoires sont `id`, `name`, `country_code`, `default_currency`, `timezone` et `status` (`trialing` par défaut).  
   Le document V2 préconise d’ajouter `billing_config`, `feature_flags`, `compliance_settings` et `custom_fields` dans un champ `metadata` structuré【613861903396476†L39-L44】; cette évolution n’est pas encore visible dans le schéma, ce qui limite la configuration dynamique.
3. **Dates importantes** : `trial_ends_at` est fixée selon la durée de la période d’essai; `next_invoice_date` est calculée en fonction du plan; `onboarding_completed_at` sera renseigné lorsque l’administrateur aura terminé l’onboarding.
4. **Contact principal** : `primary_contact_email` et `primary_contact_phone` sont renseignés afin de contacter l’administrateur en cas de problème【521462979844660†L1593-L1625】.

#### Étape 2 : onboarding des utilisateurs

1. **Création d’invitation** : un provider employee génère une entrée dans `adm_invitations` pour le futur administrateur du tenant. Le champ `token` est un code alphanumérique unique envoyé par email; `expires_at` est fixé à 72 heures (règle métier). `invitation_type` indique s’il s’agit de l’initial admin, d’un utilisateur supplémentaire, d’un changement de rôle ou d’une réactivation【613861903396476†L233-L241】.
2. **Suivi et relance** : les champs `sent_at`, `sent_count`, `last_sent_at` permettent de suivre les envois et d’automatiser les relances.
3. **Acceptation de l’invitation** : lorsque le destinataire clique sur le lien, la table est mise à jour : `accepted_at`, `accepted_from_ip`, `accepted_by_member_id` et `status = accepted`. Un enregistrement `adm_members` est créé avec `email`, `clerk_user_id` (identifiant d’authentification), `status = active`. `email_verified_at` est mis à jour après vérification par Clerk ou un service KYC.
4. **Configuration de sécurité** : si l’utilisateur choisit d’activer l’authentification multi-facteur (2FA), `two_factor_enabled` devient true et `two_factor_secret` est stocké. L’utilisateur doit changer son mot de passe (`password_changed_at`) lors de la première connexion.
5. **Attribution des rôles** :
   - Des rôles par défaut (`adm_roles.is_default=true`) sont automatiquement assignés via `adm_member_roles`.
   - Un manager ou un provider employee peut assigner des rôles supplémentaires via `adm_member_roles`, en précisant `assigned_by`, `assignment_reason`, une période de validité et éventuellement un scope (`scope_type` = global, branch, team)【521462979844660†L962-L990】.
   - `priority` permet de déterminer quel rôle prévaut lorsqu’un utilisateur cumule plusieurs rôles.
6. **Création de session** : lors de la connexion, une entrée `adm_member_sessions` est créée avec `token_hash`, `ip_address`, `user_agent` et `expires_at`. La session peut être révoquée via `revoked_at`.
7. **Audit** : toutes ces opérations génèrent des entrées dans `adm_audit_logs` avec la catégorie (`security`, `financial`, `operational`, etc.) et la sévérité (`info`, `warning`, `error`, `critical`)【521462979844660†L845-L865】. L’audit enregistre également les valeurs avant/après et des tags pour faciliter les recherches.

#### Étape 3 : gestion du cycle de vie du tenant

1. **Évènements du cycle de vie** : `adm_tenant_lifecycle_events` enregistre les transitions majeures. Le document prévoyait un `event_type` exhaustif (created, trial_started, trial_extended, activated, plan_upgraded, plan_downgraded, suspended, reactivated, cancelled, archived, deleted) et des métadonnées (reason, previous_status, new_status, plan changes, users_notified, notifications_sent, next_action_date)【613861903396476†L171-L205】. Le schéma actuel se limite à `event_type`, `effective_date`, `performed_by` et `description`【521462979844660†L1450-L1466】, ce qui ne permet pas encore d’automatiser la facturation et la notification; des colonnes supplémentaires restent donc à implémenter.
2. **Changement de statut** :
   - `trialing` → `active` lorsque le client active la plateforme (signale la fin de l’onboarding).
   - `active` → `past_due` lorsque le paiement d’une facture échoue.
   - `active` ou `past_due` → `suspended` lorsqu’une suspension est effectuée (manuellement ou automatiquement).
   - `suspended` → `reactivated` après règlement des factures.
   - `cancelled` ou `deleted` lorsqu’un client résilie ou que FleetCore supprime le tenant. Les règles RGPD imposent un `retention_until` pour l’audit.
3. **Paramètres du tenant** : `adm_tenant_settings` permet d’enregistrer des paramètres personnalisés (par exemple, activer/désactiver des modules, configurer des seuils). Chaque entrée a un `setting_key`, `setting_value`, `category` et un indicateur `is_encrypted` en cas de données sensibles【521462979844660†L1450-L1527】.
4. **RLS (Row-Level Security)** : toutes les tables Administration et celles des autres modules utilisent des policies RLS basées sur `tenant_id` et `member_id`. Les documents insistent sur l’isolement strict entre tenants et sur le contrôle des accès à chaque requête (critère de validation “0 accès cross-tenant non autorisé”)【613861903396476†L345-L350】.

### 2.3 États et transitions des entités Administration

| Entité                                                                | États / Statuts                                                                                                                                                                            | Transitions et déclencheurs                                                                                                                                                                                                                                                                                                                              | Acteurs                                              |
| --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| **Tenant (`adm_tenants.status`)**                                     | `trialing`, `active`, `suspended`, `past_due`, `cancelled`                                                                                                                                 | `trialing` → `active` lors de la fin d’onboarding; `active` → `past_due` en cas d’échec de paiement; `past_due` → `active` après règlement; `active` → `suspended` en cas d’infraction ou de non-paiement prolongé; `suspended` → `reactivated` par un provider employee; `active`/`suspended` → `cancelled` en cas de résiliation volontaire ou imposée | Provider employees (finance) + Système (facturation) |
| **Invitation (`adm_invitations.status`)**                             | `pending`, `accepted`, `expired`, `revoked`                                                                                                                                                | Création en `pending`; passage à `accepted` lorsque le lien est utilisé; `expired` après 72 heures sans action; `revoked` par un provider employee en cas d’erreur ou de sécurité                                                                                                                                                                        | Provider employees + Invité                          |
| **Member (`adm_members.status`)**                                     | `invited` (via Clerk), `active`, `suspended`, `terminated`                                                                                                                                 | `invited` → `active` après acceptation et création du compte; `active` → `suspended` en cas de violation ou de non-conformité; `suspended` → `active` après levée de la suspension; `active`/`suspended` → `terminated` lorsque l’utilisateur quitte l’organisation                                                                                      | Provider employees (support) + Système               |
| **Role (`adm_roles.status`)**                                         | `active`, `inactive`                                                                                                                                                                       | Les rôles système (`is_system=true`) sont protégés; les rôles custom peuvent être désactivés (`inactive`) ou réactivés                                                                                                                                                                                                                                   | Administrateur du tenant                             |
| **Member role**                                                       | Pas de statut, mais `valid_from`/`valid_until` et `is_primary` permettent de gérer la temporalité                                                                                          | Un rôle est actif entre `valid_from` et `valid_until`; en dehors de cette période, les permissions sont ignorées                                                                                                                                                                                                                                         | Administrateurs du tenant                            |
| **Tenant lifecycle event (`adm_tenant_lifecycle_events.event_type`)** | `created`, `trial_started`, `trial_extended`, `activated`, `plan_upgraded`, `plan_downgraded`, `suspended`, `reactivated`, `cancelled`, `archived`, `deleted`【613861903396476†L171-L205】 | Insertion d’une ligne pour chaque changement; déclenche des automatisations (ex. génération de facture, notification emails, mise à jour plan)                                                                                                                                                                                                           | Système + Provider employees + Webhooks              |

### 2.4 Cas d’usage métier (Administration)

#### Cas A : Onboarding d’un nouveau client

1. **Signature du contrat** : dans le CRM, un contrat est signé et marque `status` = `signed`. La plateforme appelle un processus qui crée un enregistrement dans `adm_tenants` avec `status=trialing`.
2. **Envoi d’invitation** : un provider employee (équipe commerciale) crée une invitation `adm_invitations` pour l’adresse e‑mail de l’administrateur client.
3. **Acceptation** : l’administrateur clique sur le lien; `adm_invitations.status` passe à `accepted` et un `adm_members` est créé. Les champs `email_verified_at` et `two_factor_enabled` sont initialisés selon les paramètres de sécurité (ex. 2FA obligatoire pour les administrateurs).
4. **Assignation de rôle** : via `adm_member_roles`, le nouvel utilisateur reçoit le rôle `admin` (`is_primary=true`, `scope_type=global`).
5. **Audit** : chaque étape (création de tenant, envoi d’invitation, acceptation, assignation de rôle) est consignée dans `adm_audit_logs` avec des catégories (`financial`, `security`) et sévérités (`info`, `warning`).
6. **Fin d’onboarding** : lorsque l’utilisateur complète la configuration (ajout de modes de paiement, chargement de documents requis, activation des modules), `onboarding_completed_at` est mis à jour et `adm_tenants.status` passe à `active`.

#### Cas B : Suspension automatique pour non-paiement

1. **Surveillance de facturation** : le module Billing repère qu’un tenant n’a pas payé la facture après deux relances.
2. **Mise à jour du statut** : un événement `plan_downgraded` ou `past_due` est inséré dans `adm_tenant_lifecycle_events`. Le `status` du tenant passe de `active` à `past_due`.
3. **Suspension** : si le paiement n’est toujours pas effectué après la période de grâce, un provider employee déclenche un événement `suspended`. Les accès sont restreints (policies RLS ou disablement de modules).
4. **Réactivation** : après règlement, un événement `reactivated` est inséré et le statut du tenant repasse à `active`.
5. **Audit** : toutes ces actions sont tracées dans `adm_audit_logs` avec `severity=warning` ou `critical` et envoyées au client.

### 2.5 Règles métier explicites (Administration)

- **Statut du tenant** : `adm_tenants.status` doit toujours refléter l’état réel; certaines opérations (création de facture, accès aux modules) sont conditionnées par ce statut.
- **2FA obligatoire** : pour les rôles sensibles (`super_admin`, `finance`), `adm_members.two_factor_enabled` doit être true; sinon l’accès est interdit.
- **Invitation expirée** : si `adm_invitations.status` reste `pending` après 72 heures (`expires_at`), l’invitation passe automatiquement à `expired` et un nouveau lien doit être généré.
- **Unicité des utilisateurs** : l’index `adm_members_tenant_email_uq` impose qu’un même email ne puisse appartenir qu’à un seul member actif dans un tenant【521462979844660†L1177-L1181】.
- **Audit** : toute action critique (création de tenant, changement de plan, assignation de rôle, suppression d’utilisateur) doit créer une ligne `adm_audit_logs` avec une sévérité appropriée.
- **Soft-delete** : les tables Administration utilisent `deleted_at` et ne suppriment pas physiquement les données; l’accès aux données `deleted_at IS NULL` est géré par RLS.
- **Permission granulaire** : les droits sont stockés dans `adm_role_permissions` (`resource`, `action`, `conditions`). Les conditions peuvent restreindre l’accès aux éléments possédés par l’utilisateur (`own_only=true`) ou plafonner des montants (ex. `max_amount=1000`).
- **Versionnement des rôles** : tout changement de permissions dans `adm_roles` doit créer une entrée `adm_role_versions` avec un `permissions_snapshot` et `change_reason`.

### 2.6 Métriques et KPIs Administration

| KPI                                     | Description                                                                                      | Tables et champs                                    |
| --------------------------------------- | ------------------------------------------------------------------------------------------------ | --------------------------------------------------- |
| **Nombre de tenants par statut**        | distribution de `adm_tenants.status` (trialing, active, suspended, past_due, cancelled)          | `adm_tenants.status`                                |
| **Temps moyen d’onboarding**            | moyenne de (`onboarding_completed_at` − `created_at`)                                            | `adm_tenants.created_at`, `onboarding_completed_at` |
| **Taux de conversion contrat → tenant** | nombre de tenants créés / nombre de contrats signés                                              | `crm_contracts.tenant_id`                           |
| **Adoption du 2FA**                     | proportion de membres ayant `two_factor_enabled=true`                                            | `adm_members.two_factor_enabled`                    |
| **Nombre d’invitations expirées**       | count des invitations avec `status=expired`                                                      | `adm_invitations.status`                            |
| **Nombre d’actions auditées**           | volume mensuel d’entrées dans `adm_audit_logs` par catégorie et sévérité                         | `adm_audit_logs.category`, `severity`               |
| **Durée moyenne des suspensions**       | moyenne de la durée entre `event_type=suspended` et `event_type=reactivated` pour un même tenant | `adm_tenant_lifecycle_events`                       |
| **Taux de rotation des membres**        | nombre de membres terminés (`status=terminated`) / membres totaux                                | `adm_members.status`                                |

---

## 3 . Interactions inter-modules (CRM ↔ Administration)

L’intégration entre CRM et Administration est critique pour transformer un prospect en client et gérer son cycle de vie. Les principaux points de jonction sont :

1. **Assignation des leads et opportunités** : `crm_leads.assigned_to` et `crm_opportunities.assigned_to` référencent des `adm_provider_employees` (commerciaux). Ces employés appartiennent à FleetCore et ont des permissions cross-tenant【521462979844660†L2508-L2564】. Ainsi, l’équipe commerciale agit au nom de FleetCore et non d’un tenant.

2. **Création du tenant** : lorsque l’opportunité est gagnée et qu’un contrat est signé, le système crée un enregistrement dans `adm_tenants` avec les informations de facturation et le plan sélectionné. Le champ `crm_contracts.tenant_id` référence ce tenant【526889723587789†L180-L186】. Cette liaison est fondamentale pour déclencher l’abonnement et l’activation des modules.

3. **Plan et abonnements** : `crm_opportunities.plan_id` et `crm_contracts.plan_id` référencent `bil_billing_plans`; `crm_contracts.subscription_id` référence `bil_tenant_subscriptions` (module Billing).

4. **Invitation et membres** : un provider employee crée une invitation dans `adm_invitations` pour permettre au futur client d’accéder à la plateforme. Lors de l’acceptation, un enregistrement dans `adm_members` est créé et lié au `tenant_id`.

5. **Audit et traçabilité** : toutes les actions issues du CRM (création du contrat, modifications d’opportunités, etc.) qui impactent un tenant doivent être enregistrées dans `adm_audit_logs` avec le `tenant_id` approprié.

6. **Rôles et permissions** : une fois le tenant créé, l’administrateur du tenant se voit attribuer un rôle via `adm_member_roles`. Les rôles définissent les droits pour accéder aux modules CRM (ex. consultation de leads historiques), Finance, Fleet, etc.

7. **Lifecycle events** : la création d’un tenant insère un événement `created` dans `adm_tenant_lifecycle_events`. D’autres événements comme `plan_upgraded`, `cancelled` ou `deleted` peuvent être déclenchés par la signature d’avenants ou la résiliation de contrats dans le CRM.

---

## 4 . Synthèse des fonctionnalités implémentées vs à implémenter

| Composant                                    | Fonctionnalités V2 implémentées (schéma réel)                                                                                                                                                                                                                                                                                                                  | Fonctionnalités V2 manquantes ou partielles                                                                                                                                                                                                                                     |
| -------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **CRM – Leads**                              | _Champs scindés (`first_name`, `last_name`), identifiant `lead_code`, infos société (`company_name`, `industry`, `company_size`), tracking marketing (utm), scores (`fit_score`, `engagement_score`, `scoring`), RGPD (`gdpr_consent`), liens (`source_id`, `assigned_to`, `opportunity_id`), `next_action_date`, `lead_stage`_【521462979844660†L2510-L2554】 | Suppression des anciens champs `full_name` et `demo_company_name` non réalisée.                                                                                                                                                                                                 |
| **CRM – Lead sources**                       | Table `crm_lead_sources` créée avec `is_active`【521462979844660†L2475-L2498】                                                                                                                                                                                                                                                                                 | RAS                                                                                                                                                                                                                                                                             |
| **CRM – Opportunities**                      | Séparation `stage`/`status`; champs financiers (`currency`, `discount_amount`, `probability_percent`, `forecast_value`, `won_value`); dates (`expected_close_date`, `won_date`, `lost_date`); liens (`plan_id`, `contract_id`, `pipeline_id`, `owner_id`); `loss_reason_id`【521462979844660†L2614-L2651】                                                     | RAS                                                                                                                                                                                                                                                                             |
| **CRM – Loss reasons**                       | Table `crm_opportunity_loss_reasons` créée avec `category` et `is_active`【521462979844660†L2729-L2743】                                                                                                                                                                                                                                                       | Peut nécessiter une gestion multilingue.                                                                                                                                                                                                                                        |
| **CRM – Pipelines**                          | Table `crm_pipelines` avec `stages`, `default_probability`, `is_default`, `is_active`【521462979844660†L2757-L2773】                                                                                                                                                                                                                                           | RAS                                                                                                                                                                                                                                                                             |
| **CRM – Contracts**                          | Cycle de vie complet avec statuts étendus, gestion du renouvellement, identifiants (`contract_reference`, `contract_code`), versioning (`version_number`), liaisons (`opportunity_id`, `tenant_id`, `plan_id`, `subscription_id`), informations de contact et facturation【521462979844660†L2334-L2381】                                                       | Noms de statuts stockés en texte et non en ENUM dédié (amélioration possible).                                                                                                                                                                                                  |
| **CRM – Addresses**                          | Table `crm_addresses` présente【521462979844660†L2306-L2324】                                                                                                                                                                                                                                                                                                  | Intégrer les règles de validation (code postal, pays) et associations multiples par tenant.                                                                                                                                                                                     |
| **Administration – Tenants**                 | `status`, `primary_contact_*`, `billing_email`, dates (`onboarding_completed_at`, `trial_ends_at`, `next_invoice_date`), `subdomain`, `default_currency`【521462979844660†L1593-L1625】                                                                                                                                                                        | Absence du champ `metadata` structuré prévu pour `billing_config`, `feature_flags`, `compliance_settings`, `custom_fields`【613861903396476†L39-L44】.                                                                                                                          |
| **Administration – Members**                 | Champs de sécurité et préférences (`email_verified_at`, `two_factor_enabled`, `two_factor_secret`, `password_changed_at`, `failed_login_attempts`, `locked_until`, `default_role_id`, `preferred_language`, `notification_preferences`)【521462979844660†L1087-L1121】                                                                                         | Le champ `role` (string) de la V1 est encore présent; la migration vers des rôles via `adm_member_roles` devrait supprimer cette colonne.                                                                                                                                       |
| **Administration – Roles**                   | Ajout de `slug`, `parent_role_id`, `is_system`, `is_default`, `max_members`, `valid_from`, `valid_until`, `approval_required`【521462979844660†L1360-L1389】                                                                                                                                                                                                   | Faut-il ajouter un champ `scope_type`/`scope_id` au niveau du rôle pour des permissions contextuelles ?                                                                                                                                                                         |
| **Administration – Role permissions**        | Table `adm_role_permissions` créée【521462979844660†L1224-L1325】                                                                                                                                                                                                                                                                                              | Reste à implémenter une gestion d’interface et des conditions complexes (ex. quantités, propres données).                                                                                                                                                                       |
| **Administration – Role versions**           | Table `adm_role_versions` créée【521462979844660†L1328-L1343】                                                                                                                                                                                                                                                                                                 | Besoin d’intégrer ce versioning dans l’outil d’administration.                                                                                                                                                                                                                  |
| **Administration – Member roles**            | Champs de traçabilité, validité, scope, priorité implémentés【521462979844660†L962-L990】                                                                                                                                                                                                                                                                      | RAS                                                                                                                                                                                                                                                                             |
| **Administration – Provider employees**      | Table existe avec les champs de base et un champ `permissions`【521462979844660†L1224-L1248】                                                                                                                                                                                                                                                                  | Les champs fonctionnels prévus (department enum, role enum, can_impersonate, can_override_limits, accessible_tenants, max_support_tickets, hire_date, termination_date, contract_type, supervisor_id, last_activity_at) ne sont pas tous présents【613861903396476†L143-L168】. |
| **Administration – Audit logs**              | Enrichissements (severity, category, session_id, request_id, old_values, new_values, retention_until, tags) implémentés【521462979844660†L845-L865】                                                                                                                                                                                                           | Doit ajouter un index GIN sur `tags` (prévu).                                                                                                                                                                                                                                   |
| **Administration – Tenant lifecycle events** | Table créée, mais ne contient que `event_type`, `effective_date`, `performed_by`, `description`【521462979844660†L1450-L1466】                                                                                                                                                                                                                                 | Les colonnes prévues pour stocker `reason`, `previous_status`, `new_status`, `previous_plan_id`, `new_plan_id`, `users_notified`, `notifications_sent`, `next_action_required`, `next_action_date` restent à implémenter【613861903396476†L171-L205】.                          |
| **Administration – Invitations**             | Table complète avec suivi d’envois et acceptation【521462979844660†L913-L940】                                                                                                                                                                                                                                                                                 | OK                                                                                                                                                                                                                                                                              |
| **Administration – Tenant settings**         | Table présente【521462979844660†L1450-L1527】                                                                                                                                                                                                                                                                                                                  | À enrichir pour chiffrer certaines clés et définir une politique de version.                                                                                                                                                                                                    |

---

## 5 . Ambiguïtés et points à clarifier

- **Metadata des tenants** : le document V2 spécifie un champ `metadata` structuré dans `adm_tenants` pour stocker la configuration de facturation, les fonctionnalités activées et les paramètres de conformité【613861903396476†L39-L44】. Le schéma actuel ne comporte pas ce champ. Il faudra soit l’ajouter, soit créer une table dédiée de paramètres (l’actuelle `adm_tenant_settings` ne couvre pas la totalité des besoins).

- **Events du cycle de vie** : la table `adm_tenant_lifecycle_events` est trop minimaliste par rapport au cahier des charges. Les colonnes permettant de stocker l’état précédent, l’état nouveau et le contexte des changements doivent être ajoutées pour automatiser la facturation et la notification.

- **Provider employees** : le modèle attendu inclut des champs RH (hire_date, termination_date, contract_type) et des permissions spécifiques (can_impersonate, accessible_tenants)【613861903396476†L143-L168】. La table actuelle ne contient que des champs basiques; il faudra vérifier si ces données sont stockées ailleurs ou non implémentées.

- **Suppression des anciens champs** : dans `crm_leads`, les champs `full_name` et `demo_company_name` sont toujours présents malgré l’évolution V2【521462979844660†L2510-L2554】. Il est recommandé d’ajouter une migration pour les migrer dans `first_name`/`last_name`/`company_name` et supprimer les champs obsolètes.

- **Usage du champ `role` dans `adm_members`** : la gestion des rôles devrait passer exclusivement par `adm_member_roles`. La présence du champ `role` (string) génère une ambiguïté entre l’ancien et le nouveau système.

- **Enum vs texte pour les statuts** : certaines colonnes (ex. `crm_opportunities.status`, `crm_contracts.status`) sont de type `text` plutôt que de type `enum`. L’utilisation d’un `enum` assurerait une meilleure intégrité.

- **Table `adm_tenant_vehicle_classes`** : cette table apparait dans le schéma mais n’est pas décrite dans les documents CRM/Administration. Elle semble gérer des classes de véhicules par tenant. Son rôle exact et son impact sur le module Administration nécessitent clarification.

---

## Conclusion

Cette analyse détaille les flux métier des modules **CRM** et **Administration** de FleetCore, en se basant sur les spécifications fonctionnelles et sur le schéma réel de la base de données. Les principales étapes – de la génération d’un lead à la signature d’un contrat et à la création d’un tenant – sont décrites, ainsi que l’onboarding des utilisateurs, la gestion des rôles et la traçabilité via l’audit.

La comparaison entre les documents `*_ONLY` et le schéma `SUPABASE_SCHEMA_REFERENCE` montre que de nombreuses évolutions prévues en V2 ont été implémentées (séparation stage/status dans les opportunités, cycle de vie complet des contrats, 2FA pour les membres, hiérarchie des rôles, etc.), mais qu’il subsiste des écarts : absence du champ `metadata` structuré dans `adm_tenants`, simplification de `adm_tenant_lifecycle_events`, champs RH manquants pour `adm_provider_employees` et suppression incomplète des colonnes obsolètes.

En clarifiant ces points et en finalisant les migrations restantes, la plateforme FleetCore pourra bénéficier d’un CRM performant et d’une gestion multi-tenant sécurisée et conforme aux exigences métier.
