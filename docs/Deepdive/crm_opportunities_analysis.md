# Analyse de la table `crm_opportunities`

Cette analyse suit le même canevas que pour les autres tables : description du **modèle existant**, identification des **règles métiers et processus**, formulation de **propositions d’amélioration** et présentation d’un **modèle cible** tenant compte des meilleures pratiques CRM, ainsi qu’une discussion sur les impacts possibles sur les autres tables et services. La table `crm_opportunities` permet de gérer les opportunités commerciales créées à partir des leads qualifiés.

## 1. Modèle actuel (DDL Supabase)

Le DDL fourni définit la table `crm_opportunities` comme suit :

| Champ               | Type            | Contraintes/Validation                                                                                                                  | Observations                                                          |
| ------------------- | --------------- | --------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| **id**              | `uuid`          | Clé primaire générée par `uuid_generate_v4()`                                                                                           | Identifiant unique de l’opportunité.                                  |
| **lead_id**         | `uuid`          | **Non nul** ; FK vers `crm_leads(id)` avec suppression en cascade                                                                       | Relie l’opportunité au lead d’origine.                                |
| **stage**           | `text`          | **Non nul**, valeur par défaut `prospect` ; contrainte `CHECK` limitant les valeurs à `prospect`, `proposal`, `negotiation` ou `closed` | Représente l’étape du pipeline de vente.                              |
| **expected_value**  | `numeric(18,2)` | Optionnel ; contrainte `expected_value >= 0`                                                                                            | Montant prévu de la vente.                                            |
| **close_date**      | `date`          | Optionnel                                                                                                                               | Date ciblée de signature ou de clôture.                               |
| **assigned_to**     | `uuid`          | Optionnel ; FK vers `adm_members(id)`                                                                                                   | Commercial en charge de l’opportunité.                                |
| **metadata**        | `jsonb`         | **Non nul** ; défaut `{}`                                                                                                               | Stocke des données personnalisées (notes, références internes, etc.). |
| **probability**     | `integer`       | Optionnel                                                                                                                               | Pourcentage de probabilité de fermeture (0–100).                      |
| **created_at**      | `timestamptz`   | Non nul ; défaut `now()`                                                                                                                | Date de création.                                                     |
| **updated_at**      | `timestamptz`   | Non nul ; défaut `now()` ; mis à jour par trigger `set_updated_at`                                                                      | Date de dernière modification.                                        |
| **created_by**      | `uuid`          | Optionnel ; FK vers `adm_members(id)`                                                                                                   | Créateur de l’opportunité.                                            |
| **updated_by**      | `uuid`          | Optionnel ; FK vers `adm_members(id)`                                                                                                   | Dernier modificateur.                                                 |
| **deleted_at**      | `timestamptz`   | Optionnel                                                                                                                               | Permet la suppression logique (soft delete).                          |
| **deleted_by**      | `uuid`          | Optionnel ; FK vers `adm_members(id)`                                                                                                   | Auteur de la suppression.                                             |
| **deletion_reason** | `text`          | Optionnel                                                                                                                               | Motif de suppression.                                                 |

Des indexes sont définis sur `lead_id`, `stage`, `close_date`, `assigned_to`, `created_by`, `updated_by`, `deleted_at` et sur `metadata` (GIN) pour accélérer les requêtes. Les triggers `set_updated_at` et `trigger_set_updated_at` assurent la mise à jour de `updated_at` avant toute modification. Aucune contrainte d’unicité n’empêche plusieurs opportunités pour un même lead.

### Observations

- **Pipeline simplifié** : la colonne `stage` se limite à quatre valeurs. Il n’y a pas de distinction entre une opportunité **gagnée** (closed‑won) et **perdue** (closed‑lost). Toutes les opportunités `closed` sont considérées identiques, ce qui empêche de mesurer le taux de réussite et de comprendre les raisons de perte.
- **Absence de statut explicite** : le modèle ne sépare pas clairement le **statut** (active, perdue, gagnée) de l’**étape** (prospect, proposition, négociation). Des bonnes pratiques CRM recommandent de dissocier ces concepts pour un suivi plus fin【427709730501299†L64-L70】.
- **Pas de montant réel** : l’opportunité stocke une valeur prévue, mais pas la valeur finale obtenue ni la devise. Le DDL ne prévoit pas de champ `currency` et suppose implicitement une monnaie unique.
- **Aucune référence au plan ou au contrat** : l’opportunité n’est pas directement liée à un plan tarifaire ni à un contrat ; ces informations devront être ajoutées ou mises en relation via d’autres tables (`crm_contracts`, `bil_billing_plans`).

## 2. Règles métier et processus déduits

Les règles métiers sont en grande partie implicites, mais en se basant sur le pipeline de vente standard et sur les autres modules de Fleetcore, on peut déduire les éléments suivants :

1. **Création d’une opportunité** : lorsqu’un lead passe au statut `qualified` ou `converted`, un commercial peut créer une opportunité pour suivre le processus de vente. L’opportunité est liée au lead via `lead_id` et à un membre via `assigned_to`. La valeur prévue (`expected_value`) est estimée en fonction du plan envisagé, et la date de clôture (`close_date`) reflète l’échéance du cycle de vente.
2. **Gestion des étapes** : l’opportunité évolue à travers les étapes `prospect` → `proposal` → `negotiation` → `closed`. Chaque transition nécessite des actions (envoi d’une proposition, négociation du contrat, signature) et met à jour `updated_at` et éventuellement `probability`.
3. **Probabilité de réussite** : le champ `probability` (0–100) permet de pondérer la prévision de revenus. Il peut être automatisé (ex. 25 % en phase de proposition, 50 % en négociation) ou ajusté par le commercial selon son jugement. Un forecast de revenus peut être calculé en multipliant `expected_value` par `probability/100`.
4. **Clôture** : lorsque l’opportunité est signée, la phase `stage` passe à `closed` et on crée un contrat (`crm_contracts`) ainsi qu’un enregistrement dans `adm_tenants`. En cas d’échec, l’opportunité est également fermée (`closed`) mais le système doit enregistrer la raison de perte (champ `loss_reason` à ajouter) et mettre à jour le pipeline pour l’analyse des échecs. Le code existant ne prévoit pas de différenciation entre ces deux cas【427709730501299†L64-L70】.
5. **Historique et audit** : chaque création, mise à jour ou suppression d’opportunité doit être consignée dans `adm_audit_logs` pour la traçabilité. Les changements de valeurs critiques (stage, probability, expected_value) sont particulièrement importants.
6. **Notifications et rappels** : les changements d’étape ou l’approche d’une `close_date` devraient déclencher des notifications au commercial en charge (`assigned_to`) ou à son responsable, afin d’assurer un suivi proactif.

## 3. Propositions d’amélioration et modèle cible

Plusieurs évolutions peuvent être envisagées pour rapprocher la structure de `crm_opportunities` des meilleures pratiques CRM tout en restant compatibles avec la base actuelle. Ces suggestions sont **additives** (elles ne suppriment pas les champs existants) :

### 3.1 Améliorations de la structure

1. **Séparation du statut et de l’étape** : conserver `stage` pour refléter la progression (`prospect`, `proposal`, `negotiation`) et ajouter un champ `status` (`open`, `won`, `lost`, `on_hold`, `cancelled`). Cela permet de distinguer les opportunités clôturées positivement ou négativement et de réaliser des rapports plus précis【427709730501299†L64-L70】.
2. **Enumérisations** : remplacer `stage` par un type `ENUM` ou une table de référence `crm_opportunity_stages` et définir `status` comme `ENUM`. Cela évite les erreurs de frappe et facilite l’évolution du pipeline.
3. **Champs financiers** : ajouter `currency` (ISO‑4217), `discount_amount`, `probability_percent` (de type `numeric` pour plus de précision), `forecast_value` (calculé) et `won_value` (valeur finale si `status = won`). Cela permettra de suivre les revenus prévisionnels et réels.
4. **Lien vers les plans et contrats** : ajouter `plan_id` (FK vers `bil_billing_plans`) et `contract_id` (FK vers `crm_contracts`) afin de rattacher l’opportunité au produit/service et au contrat final. Cela simplifie la facturation et l’analyse des revenus.
5. **Raisons de gain/perte** : introduire un champ `loss_reason` (`text` ou FK vers une table `crm_opportunity_loss_reasons`) et `won_date`/`lost_date` (dates) pour analyser les causes de victoire ou d’échec. On peut également prévoir `stage_change_at` (timestamp) et un champ JSON `history` pour enregistrer l’historique des étapes.
6. **Gestion des responsabilités** : ajouter `owner_id` (FK vers `adm_members`) pour différencier le responsable principal (`owner`) de la personne qui a créé l’opportunité. Prévoir un champ `team_id` ou `pipeline_id` si plusieurs équipes ou pipelines différents existent.
7. **Amélioration de l’indexation** : définir un index unique `(lead_id, stage) WHERE deleted_at IS NULL` pour éviter de créer deux opportunités identiques à la même étape pour un même lead. Créer des indexes sur `status`, `owner_id`, `plan_id` et `probability_percent` pour optimiser les rapports.

### 3.2 Modèle cible proposé

Le schéma ci-dessous illustre une version enrichie de `crm_opportunities` : il introduit des types ENUM pour `stage` et `status`, ajoute des informations financières et de gestion, et normalise les raisons de perte.

```sql
-- Types pour le pipeline et le statut
CREATE TYPE crm_opportunity_stage AS ENUM ('prospect','proposal','negotiation');
CREATE TYPE crm_opportunity_status AS ENUM ('open','won','lost','on_hold','cancelled');

CREATE TABLE crm_opportunities (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id             UUID NOT NULL REFERENCES crm_leads(id) ON DELETE CASCADE,
  stage               crm_opportunity_stage NOT NULL DEFAULT 'prospect',
  status              crm_opportunity_status NOT NULL DEFAULT 'open',
  expected_value      NUMERIC(18,2) CHECK (expected_value >= 0),
  currency            CHAR(3) NOT NULL DEFAULT 'EUR',
  discount_amount     NUMERIC(18,2) DEFAULT 0,
  probability_percent NUMERIC(5,2) CHECK (probability_percent BETWEEN 0 AND 100),
  forecast_value      NUMERIC(18,2) GENERATED ALWAYS AS (expected_value * probability_percent / 100) STORED,
  won_value           NUMERIC(18,2),
  close_date          DATE,
  won_date            DATE,
  lost_date           DATE,
  loss_reason_id      UUID REFERENCES crm_opportunity_loss_reasons(id),
  plan_id             UUID REFERENCES bil_billing_plans(id),
  contract_id         UUID REFERENCES crm_contracts(id),
  assigned_to         UUID REFERENCES adm_members(id),
  owner_id            UUID REFERENCES adm_members(id),
  pipeline_id         UUID REFERENCES crm_pipelines(id),
  metadata            JSONB NOT NULL DEFAULT '{}',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by          UUID REFERENCES adm_members(id) ON DELETE SET NULL,
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by          UUID REFERENCES adm_members(id) ON DELETE SET NULL,
  deleted_at          TIMESTAMPTZ,
  deleted_by          UUID REFERENCES adm_members(id) ON DELETE SET NULL,
  deletion_reason     TEXT,
  CONSTRAINT crm_opportunities_lead_stage_unq UNIQUE (lead_id, stage) WHERE deleted_at IS NULL
);

CREATE TABLE crm_opportunity_loss_reasons (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        VARCHAR(100) NOT NULL UNIQUE,
  description TEXT
);

-- Indexes supplémentaires
CREATE INDEX crm_opportunities_status_idx       ON crm_opportunities (status) WHERE deleted_at IS NULL;
CREATE INDEX crm_opportunities_assigned_idx     ON crm_opportunities (assigned_to) WHERE deleted_at IS NULL;
CREATE INDEX crm_opportunities_owner_idx        ON crm_opportunities (owner_id) WHERE deleted_at IS NULL;
CREATE INDEX crm_opportunities_close_date_idx   ON crm_opportunities (close_date) WHERE deleted_at IS NULL;
CREATE INDEX crm_opportunities_plan_idx         ON crm_opportunities (plan_id) WHERE deleted_at IS NULL;
CREATE INDEX crm_opportunities_pipeline_idx     ON crm_opportunities (pipeline_id) WHERE deleted_at IS NULL;
```

Cette version améliore la granularité du pipeline de vente, sépare clairement l’étape et le statut, enrichit les informations financières et permet d’identifier les raisons de perte. Les champs `forecast_value`, `won_value`, `probability_percent`, `owner_id`, `plan_id`, `contract_id` et `pipeline_id` facilitent les prévisions, l’analyse de performance et l’intégration avec la facturation.

## 4. Impact sur les autres tables et services

### Liens avec `crm_leads`

- Lorsqu’un lead est converti en opportunité, le champ `lead_id` pointe vers l’enregistrement `crm_leads(id)`. La suppression d’un lead doit entraîner la suppression en cascade des opportunités associées (déjà configuré dans le DDL). L’ajout de `status` et de nouvelles étapes impose d’adapter les règles de conversion dans les services CRM.

### Liens avec `adm_members` et les rôles

- La distinction entre `assigned_to` (la personne qui travaille sur l’opportunité) et `owner_id` (le responsable commercial) peut nécessiter d’étendre la table `adm_member_roles` pour gérer ces fonctions. Les dashboards doivent être mis à jour pour afficher les opportunités par propriétaire ou assigné.

### Interaction avec `crm_contracts` et `bil_billing_plans`

- En ajoutant `contract_id` et `plan_id`, l’opportunité devient la pièce maîtresse reliant la phase de vente au contrat et au plan de facturation. Ces relations facilitent la création automatique de contrats et d’abonnements lors de la conclusion d’une vente. Elles nécessitent une adaptation des services d’onboarding pour renseigner les liens appropriés.

### Système d’audit et RLS

- L’augmentation du nombre de colonnes sensibles (probabilité, valeur prévisionnelle, raison de perte) renforce la nécessité d’un **journal d’audit**. Chaque modification doit être consignées dans `adm_audit_logs` avec l’`entity_type = 'crm_opportunities'` et les `changes` détaillés.
- La table `crm_opportunities` reste interne à Fleetcore ; elle n’a pas de `tenant_id` et ne nécessite pas de RLS multi‑tenant. Toutefois, l’accès doit être limité aux employés commerciaux via des rôles dans `adm_roles`.

### Impact sur les rapports et prévisions

- La séparation du statut et de l’étape, l’ajout de `probability_percent` et de `forecast_value` permettent de construire des **tableaux de bord de prévision** (forecasting) plus précis. Les équipes financières peuvent utiliser ces données pour estimer les revenus futurs et comparer les prévisions aux valeurs réelles (`won_value`).

En résumé, la table `crm_opportunities` actuelle fournit une base simple pour suivre les ventes, mais elle manque de granularité et de différenciation entre les situations “gagné” et “perdu”. Les améliorations proposées introduisent des champs structurés et des références pour enrichir l’analyse commerciale, préparer l’intégration avec les modules de facturation et de contrats, et améliorer la qualité des prévisions, tout en respectant les normes de traçabilité et de sécurité des données.
