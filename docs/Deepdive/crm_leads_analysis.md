# Analyse de la table `crm_leads`

Cette analyse adopte le même format que pour les autres tables : un examen du **modèle existant**, des **règles métiers et processus** associés, des **propositions d’amélioration** et un **modèle cible** intégrant ces améliorations, ainsi qu’une discussion sur l’impact éventuel sur les autres tables et services.  
La table `crm_leads` remplace l’ancienne table `sys_demo_lead` et est utilisée par les équipes commerciales de Fleetcore pour suivre les prospects avant qu’ils ne deviennent des clients. Elle n’est **pas multi‑tenant** : elle appartient à Fleetcore et ne comporte pas de colonne `tenant_id`.

## 1. Modèle actuel (DDL Supabase)

Le DDL fourni définit la table `crm_leads` pour stocker les prospects. Elle est interne à Fleetcore (pas de `tenant_id`) et comprend les colonnes suivantes :

| Champ                                               | Type                          | Contraintes/Validation                                                        | Observations                                                                         |
| --------------------------------------------------- | ----------------------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| **id**                                              | `uuid`                        | Clé primaire générée par `uuid_generate_v4()`                                 | Identifiant unique du prospect.                                                      |
| **full_name**                                       | `text`                        | **Non nul**                                                                   | Nom complet du prospect (libre).                                                     |
| **email**                                           | `text`                        | **Non nul** ; index unique `(email) WHERE deleted_at IS NULL`                 | Adresse e‑mail du contact. Pas de type `citext` : l’unicité est sensible à la casse. |
| **phone**                                           | `text`                        | Optionnel                                                                     | Numéro de téléphone.                                                                 |
| **demo_company_name**                               | `text`                        | Optionnel                                                                     | Nom de la société mentionné dans la demande de démo.                                 |
| **source**                                          | `text`                        | Optionnel ; contrainte `CHECK` pour `web`, `referral`, `event`                | Indique le canal par lequel le lead est arrivé.                                      |
| **status**                                          | `text`                        | **Non nul** ; contrainte `CHECK` pour `new`, `qualified`, `converted`, `lost` | Statut du lead dans le pipeline de qualification.                                    |
| **message**                                         | `text`                        | Optionnel                                                                     | Message libre saisi par le prospect.                                                 |
| **created_at**                                      | `timestamptz`                 | **Non nul** ; valeur par défaut `now()`                                       | Date de création.                                                                    |
| **updated_at**                                      | `timestamptz`                 | **Non nul** ; mis à jour via trigger `set_updated_at`                         | Date de dernière modification.                                                       |
| **country_code**                                    | `varchar(2)`                  | Optionnel                                                                     | Code pays ISO.                                                                       |
| **fleet_size**                                      | `varchar(50)`                 | Optionnel                                                                     | Taille de la flotte, saisie en texte.                                                |
| **current_software**                                | `varchar(255)`                | Optionnel                                                                     | Logiciel actuellement utilisé.                                                       |
| **assigned_to**                                     | `uuid`                        | Optionnel                                                                     | L’employé Fleetcore en charge du lead.                                               |
| **qualification_score**                             | `integer`                     | Optionnel                                                                     | Score numérique de qualification.                                                    |
| **qualification_notes**                             | `text`                        | Optionnel                                                                     | Notes de qualification.                                                              |
| **qualified_date**                                  | `timestamptz`                 | Optionnel                                                                     | Date à laquelle le lead a été qualifié.                                              |
| **converted_date**                                  | `timestamptz`                 | Optionnel                                                                     | Date de conversion en client.                                                        |
| **utm_source**, **utm_medium**, **utm_campaign**    | `varchar(255)`                | Optionnels                                                                    | Variables marketing pour le suivi des campagnes.                                     |
| **metadata**                                        | `jsonb`                       | Optionnel, défaut `{}`                                                        | Champs personnalisés.                                                                |
| **created_by**, **updated_by**                      | `uuid`                        | Optionnels                                                                    | Identifie l’employé ayant créé/mis à jour le lead.                                   |
| **deleted_at**, **deleted_by**, **deletion_reason** | `timestamptz`, `uuid`, `text` | Optionnels                                                                    | Supportent la suppression logique (soft delete).                                     |

Les contraintes du DDL imposent :

- Un **index unique** sur `(email) WHERE deleted_at IS NULL` pour empêcher les doublons de leads actifs.
- Des **contrôles d’intégrité** pour `source` et `status` : seule une liste de valeurs est autorisée (respectivement `web/referral/event` et `new/qualified/converted/lost`).
- Des **triggers** `set_updated_at` pour mettre à jour `updated_at` automatiquement.

Ce modèle de base permet de suivre l’évolution d’un prospect depuis sa création jusqu’à sa conversion ou son abandon, en conservant les informations marketing et de qualification.

## 2. Règles métier et processus déduits

Bien que la spécification fonctionnelle n’expose pas en détail le module CRM, le DDL et les documents de processus permettent d’identifier un cycle type de **prospection** :

1. **Capture de leads** : les prospects proviennent du formulaire “request demo”, des appels entrants ou de campagnes marketing (canal `web`, `referral` ou `event`). L’équipe commerciale saisit ou importe les données dans `crm_leads` (nom, email, téléphone, société, message). Les champs UTM permettent de mesurer l’efficacité des campagnes.
2. **Qualification** : un commercial est assigné via `assigned_to`. Il contacte le prospect pour recueillir des informations complémentaires (taille de flotte, logiciel actuel, budget) et remplit `qualification_score` et `qualification_notes`. Le champ `status` évolue de `new` vers `qualified` lorsqu’un intérêt est confirmé ; il peut devenir `lost` si le prospect n’est pas pertinent ou s’il se désiste. Les meilleures pratiques recommandent de définir clairement les critères de passage entre ces statuts et de documenter la qualification【427709730501299†L64-L70】.
3. **Conversion** : lorsque les conditions sont réunies, le lead est converti (`status = 'converted'`) et un enregistrement est créé dans `adm_tenants` et `crm_contracts`. La date de conversion est stockée dans `converted_date`. Les informations collectées (domaine d’activité, effectif, logiciel) facilitent l’onboarding et la configuration du plan.
4. **Abandon et archivage** : si le lead ne répond plus ou ne correspond pas à la cible, son statut passe à `lost`. On peut conserver les notes pour analyse, mais ces leads n’entrent plus dans le pipeline actif.
5. **Suivi et reporting** : les champs `status`, `source`, `qualified_date`, `converted_date`, `assigned_to` et `qualification_score` servent à construire des tableaux de bord (nombre de leads par statut, taux de conversion, performance des canaux). Les champs `metadata` et UTM peuvent alimenter des analyses marketing avancées.
6. **Protection des données** : la table supporte la suppression logique grâce à `deleted_at` et `deleted_by`. Une politique de conservation doit préciser la durée de stockage des leads non convertis et assurer la purge sur demande conformément au RGPD.

## 3. Propositions d’amélioration et modèle cible

Afin d’améliorer la structure et de préparer l’intégration future avec d’autres modules (opportunités, contrats, facturation), les évolutions suivantes sont recommandées. Elles sont **additives** et peuvent coexister avec le modèle existant :

### 3.1 Améliorations de la structure

1. **Scinder le nom** : remplacer `full_name` par `first_name` et `last_name` pour faciliter la personnalisation des communications et les tris/recherches. Ajouter aussi un champ `company_name` (la colonne actuelle `demo_company_name` n’est pas normative) afin de dissocier clairement la personne et l’entreprise.
2. **Énumérations pour les statuts et les sources** : transformer les colonnes `status` et `source` en **types ENUM** ou références à des tables (`crm_lead_statuses`, `crm_lead_sources`). Les valeurs actuelles (`new`, `qualified`, `converted`, `lost` pour `status` et `web`, `referral`, `event` pour `source`) peuvent être enrichies (par exemple `contacted`, `trialing`, `archived`) selon les besoins commerciaux【427709730501299†L64-L70】. Une normalisation facilite les contrôles et la génération de statistiques.
3. **Ajout de `lead_stage`** : introduire un champ `lead_stage` pour représenter l’étape de maturité (top of funnel, marketing qualified, sales qualified, opportunity). Cela complète le statut et aligne le CRM sur les modèles de pipelines utilisés dans l’industrie.
4. **Scoring avancé et suivi** : remplacer `qualification_score` (entier) par un système plus riche (ex. `fit_score`, `engagement_score`) ou un champ JSON `scoring` pour stocker plusieurs critères. Ajouter un `next_action_date` pour planifier les relances et automatiser les notifications.
5. **Informations complémentaires** : ajouter des colonnes `industry`, `company_size`, `website_url`, `linkedin_url`, `city` et `notes` pour enrichir le profil du prospect. Introduire un champ booléen `gdpr_consent` et un horodatage `consent_at` pour tracer l’acceptation des communications marketing.
6. **Lien vers les opportunités et les contrats** : ajouter un champ `opportunity_id` (FK vers `crm_opportunities`) afin de relier un lead converti à l’opportunité créée. Pour aller plus loin, une table `crm_lead_events` pourrait journaliser toutes les actions (changement de statut, e‑mail, appel, tâche) pour mieux comprendre l’historique.
7. **Indexation** : maintenir l’unicité de l’e‑mail, mais indexer également `assigned_to`, `status`, `lead_stage` et `source` pour optimiser les requêtes filtrant les leads par responsables, canaux ou étapes. Une recherche plein texte peut être améliorée via un index GIN sur les champs `message` et `qualification_notes`.

### 3.2 Modèle cible proposé

Le schéma suivant illustre une version enrichie de `crm_leads` :

```sql
-- Types ENUM pour les statuts et les étapes du cycle de vie
CREATE TYPE crm_lead_status AS ENUM ('new','contacted','qualified','converted','lost','archived');
CREATE TYPE crm_lead_stage AS ENUM ('top_of_funnel','marketing_qualified','sales_qualified','opportunity');

CREATE TABLE crm_leads (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_code          TEXT NOT NULL,              -- identifiant interne stable
  first_name         TEXT NOT NULL,
  last_name          TEXT NOT NULL,
  company_name       TEXT NOT NULL,              -- nouvelle colonne (remplace demo_company_name)
  email              CITEXT NOT NULL,
  phone              VARCHAR(50),
  country_code       CHAR(2),
  industry           TEXT,
  company_size       INTEGER,
  website_url        TEXT,
  linkedin_url       TEXT,
  city               TEXT,
  fleet_size         INTEGER,
  current_software   TEXT,
  message            TEXT,
  status             crm_lead_status NOT NULL DEFAULT 'new',
  lead_stage         crm_lead_stage NOT NULL DEFAULT 'top_of_funnel',
  source_id          UUID REFERENCES crm_lead_sources(id),
  assigned_to        UUID REFERENCES adm_members(id),
  fit_score          NUMERIC(5,2),
  engagement_score   NUMERIC(5,2),
  scoring            JSONB NOT NULL DEFAULT '{}',
  qualification_notes TEXT,
  utm_source         TEXT,
  utm_medium         TEXT,
  utm_campaign       TEXT,
  gdpr_consent       BOOLEAN NOT NULL DEFAULT FALSE,
  consent_at         TIMESTAMPTZ,
  opportunity_id     UUID REFERENCES crm_opportunities(id),
  next_action_date   TIMESTAMPTZ,
  metadata           JSONB NOT NULL DEFAULT '{}',
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by         UUID REFERENCES adm_provider_employees(id) ON DELETE SET NULL,
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by         UUID REFERENCES adm_provider_employees(id) ON DELETE SET NULL,
  deleted_at         TIMESTAMPTZ,
  deleted_by         UUID REFERENCES adm_provider_employees(id) ON DELETE SET NULL,
  deletion_reason    TEXT,
  CONSTRAINT crm_leads_email_unq UNIQUE (email) WHERE deleted_at IS NULL,
  CONSTRAINT crm_leads_code_unq  UNIQUE (lead_code) WHERE deleted_at IS NULL
);

CREATE TABLE crm_lead_sources (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        VARCHAR(50) UNIQUE NOT NULL,
  description TEXT
);

-- Indexes pour optimiser les recherches
CREATE INDEX crm_leads_assigned_idx ON crm_leads (assigned_to) WHERE deleted_at IS NULL;
CREATE INDEX crm_leads_status_idx   ON crm_leads (status) WHERE deleted_at IS NULL;
CREATE INDEX crm_leads_stage_idx    ON crm_leads (lead_stage) WHERE deleted_at IS NULL;
CREATE INDEX crm_leads_source_idx   ON crm_leads (source_id) WHERE deleted_at IS NULL;
```

Cette version enrichie introduit des statuts et des étapes de cycle de vie plus fins, normalise la source du lead, permet un scoring avancé et intègre les informations de consentement RGPD. Les colonnes additionnelles sont facultatives et n’empêchent pas l’utilisation du modèle existant. Les champs `lead_code` et `email` font l’objet de contraintes d’unicité. La table `crm_lead_sources` centralise la liste des canaux d’acquisition.

## 4. Impact sur les autres tables et services

- **CRM Opportunities et Contracts** : en ajoutant `opportunity_id`, le lead devient directement lié à l’opportunité créée lors de la qualification. Les données collectées (nom, entreprise, coordonnées) peuvent être reprises automatiquement lors de la création du contrat. L’ajout de `tenant_id` n’est pas nécessaire tant que les leads restent internes à Fleetcore.
- **Support et Notifications** : les champs `status`, `lead_stage`, `assigned_to` et `next_action_date` peuvent être utilisés pour déclencher des rappels et des notifications automatiques (appels de suivi, envoi de devis). Les modules de support n’auront pas accès à ces informations, mais les notifications peuvent générer des tickets internes.
- **Marketing & Analytics** : l’enregistrement des `utm_*`, de la source et du score permet d’analyser l’efficacité des campagnes marketing. Les informations enrichies (industry, fleet_size) alimentent la segmentation. Les modifications proposées requièrent de mettre à jour les tableaux de bord pour tenir compte des nouveaux statuts et étapes.
- **RGPD & Consentement** : l’ajout de `gdpr_consent` et `consent_at` impose de modifier les formulaires de capture de leads pour recueillir le consentement et de mettre à jour les processus d’export et de suppression en cas de demande d’effacement.
- **RLS & Sécurité** : la table restant interne à Fleetcore, il est inutile d’appliquer des politiques RLS multi‑tenant. L’accès doit être limité aux employés autorisés (rôle `provider_staff`), et les opérations doivent être auditées via `adm_audit_logs`.

En conclusion, la table `crm_leads` joue un rôle essentiel dans la prospection commerciale. Le modèle actuel est simple mais suffisant pour un MVP. Les améliorations proposées (statuts étendus, normalisation des sources, scoring, consentement RGPD, liens vers opportunités) préparent la table à une croissance future et à une intégration fluide avec les autres modules (opportunités, contrats, facturation et reporting) tout en restant compatible avec les données déjà enregistrées.
