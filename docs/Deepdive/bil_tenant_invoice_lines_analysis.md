# Analyse de la table `bil_tenant_invoice_lines`

Cette analyse se concentre sur la table **`bil_tenant_invoice_lines`**, qui détaille les postes d’une facture de tenant dans le module de facturation SaaS. Comme pour les autres tables, l’objectif est de fournir une **source unique de vérité** en séparant clairement ce qui existe dans le DDL Supabase, les règles métiers déduites des spécifications et du code, les améliorations possibles et l’impact de ces améliorations sur le reste du modèle de données.

## 1. Modèle Supabase existant

La définition SQL fournie crée une table `bil_tenant_invoice_lines` avec les colonnes suivantes :

| Champ                                          | Type            | Contraintes et validations                                                           | Observations                                                                                                          |
| ---------------------------------------------- | --------------- | ------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------- |
| **id**                                         | `uuid`          | Clé primaire avec défaut `uuid_generate_v4()`                                        | Identifiant unique immuable.                                                                                          |
| **invoice_id**                                 | `uuid`          | **Non nul**, FK vers `bil_tenant_invoices(id)` avec `ON DELETE CASCADE`              | Rattache chaque ligne à une facture parent et garantit que les lignes sont supprimées en cascade si la facture l’est. |
| **description**                                | `text`          | **Non nul**                                                                          | Désignation du poste (ex. « Abonnement Pro – 10 véhicules », « Surcoût véhicules », « TVA (5 %) »).                   |
| **amount**                                     | `numeric(18,2)` | **Non nul**, `CHECK (amount >= 0)`                                                   | Montant total de la ligne. Par défaut `0`.                                                                            |
| **quantity**                                   | `numeric(10,2)` | **Non nul**, `CHECK (quantity > 0)`                                                  | Quantité facturée (nombre de véhicules, d’heures, etc.). Par défaut `1`.                                              |
| **metadata**                                   | `jsonb`         | **Non nul**, défaut `{}`                                                             | Stocke des données supplémentaires (par exemple, l’identifiant de l’article, des notes, ou la base de calcul).        |
| **created_at**                                 | `timestamptz`   | **Non nul**, défaut `now()`                                                          | Date de création de la ligne.                                                                                         |
| **created_by**, **updated_by**, **deleted_by** | `uuid`          | Références facultatives vers `adm_provider_employees(id)`, avec `ON DELETE SET NULL` | Identifient l’employé Fleetcore ayant créé, modifié ou supprimé (soft delete) la ligne.                               |
| **updated_at**                                 | `timestamptz`   | **Non nul**, défaut `now()`                                                          | Mis à jour automatiquement par le trigger `update_bil_tenant_invoice_lines_updated_at`.                               |
| **deleted_at**                                 | `timestamptz`   | Optionnel                                                                            | Indique une suppression logique (soft delete).                                                                        |
| **deletion_reason**                            | `text`          | Optionnel                                                                            | Motif de suppression.                                                                                                 |

La table dispose d’un index unique partiel `(invoice_id, description) WHERE deleted_at IS NULL` qui empêche de facturer deux fois la même description pour une même facture active. Des index supplémentaires sur `invoice_id`, `description`, `deleted_at`, `created_by`, `updated_by` et un index GIN sur `metadata` améliorent les performances de recherche.

## 2. Règles métier et process flow

Les règles suivantes peuvent être déduites des spécifications fonctionnelles et du code :

1. **Détail des factures** : Chaque facture (`bil_tenant_invoices`) se compose de plusieurs lignes détaillées stockées dans `bil_tenant_invoice_lines`. Une ligne représente un poste : frais d’abonnement mensuel, dépassement (surcoûts), taxe (TVA), remise, etc. La description doit être suffisamment explicite pour que le client comprenne l’origine du montant.

2. **Unicité des descriptions** : L’index unique `(invoice_id, description)` impose qu’une facture ne comporte pas deux lignes avec exactement la même description tant que la ligne n’est pas supprimée. Si un même type de frais doit apparaître plusieurs fois, il convient de différencier la description (par exemple, `Surcoût véhicules – Janvier` et `Surcoût véhicules – Février`) ou d’utiliser la quantité pour cumuler les éléments.

3. **Calculs et agrégation** : Le champ `amount` représente le total (unit_price × quantity). Aucune colonne `unit_price` n’est stockée ; le calcul est effectué dans le service de facturation. La somme des lignes d’une facture doit être cohérente avec le `total_amount` de `bil_tenant_invoices`【535592711015414†L482-L505】. Les lignes peuvent être générées automatiquement à partir des métriques d’usage (nombre de véhicules, de chauffeurs, etc.) et des tarifs du plan, puis validées par un opérateur.

4. **Types de lignes** : Les spécifications mentionnent trois composantes principales d’une facture : la base mensuelle du plan, les frais de dépassement (surcoûts) et la TVA (5 % pour les Émirats, 20 % pour la France)【535592711015414†L482-L505】. Toutefois, le DDL ne distingue pas ces types : c’est le `metadata` ou la logique applicative qui identifie s’il s’agit d’un frais d’abonnement, d’un surcoût ou d’une taxe.

5. **Gestion des remises ou promotions** : Les remises éventuelles (codes promo, réductions de fidélité) ne sont pas prises en charge explicitement. Elles peuvent être intégrées en utilisant une ligne de type « Discount » avec un `amount` négatif (si la politique comptable le permet), ou en ajustant directement `total_amount` de la facture.

6. **RLS et isolation** : La table `bil_tenant_invoice_lines` n’a pas de colonne `tenant_id` car elle est liée à un `invoice_id` qui référence déjà un tenant via `bil_tenant_invoices`. Les règles d’accès sont donc héritées de la facture : seules les factures du tenant connecté sont visibles. Le soft delete via `deleted_at` permet de conserver un historique sans exposer les lignes supprimées aux clients.

## 3. Propositions d’amélioration et modèle cible

Pour supporter des scénarios de facturation plus complexes (par exemple, factures différenciant clairement les éléments et facilitant les rapports), vous pouvez ajouter des champs facultatifs **sans supprimer les colonnes existantes** :

1. **Type de ligne** : Ajouter une colonne `line_type` (`varchar(30)`) pour indiquer la nature du poste : `plan_fee`, `overage_fee`, `tax`, `discount`, etc. Utiliser une contrainte `CHECK` ou une énumération pour valider les valeurs.

2. **Prix unitaire et base de calcul** : Ajouter un champ `unit_price` (`numeric(18,2)`) et calculer `amount = unit_price × quantity`. Cela facilite les ajustements (par exemple, si la TVA ou le tarif unitaire change) et améliore la transparence vis‑à‑vis du client. Une colonne `base_metric` (`varchar`) ou `resource_count` (`jsonb`) pourrait indiquer sur quelle métrique repose le calcul (nombre de véhicules, de chauffeurs, minutes de trajets).

3. **Taxe et remise par ligne** : Ajouter des champs `tax_rate` (`numeric(5,2)`), `tax_amount` (`numeric(18,2)`), `discount_amount` (`numeric(18,2)`) pour ventiler les taxes et remises ligne par ligne. Cela permet de recalculer aisément la TVA ou d’appliquer des réductions spécifiques. Les remises doivent être stockées avec un signe négatif ou dans une colonne dédiée.

4. **Référence au plan ou au service** : Introduire une colonne `source_type` (`varchar(30)`) et `source_id` (`uuid`) pour lier la ligne à l’entité qui l’a générée : par exemple `billing_plan` + `plan_id`, `usage_metric` + `metric_id`, `manual_adjustment` + `null`. Cette approche facilite les audits et la traçabilité.

5. **Modèle cible (DDL amélioré)** :

```sql
CREATE TABLE bil_tenant_invoice_lines (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id    UUID NOT NULL REFERENCES bil_tenant_invoices(id) ON DELETE CASCADE,
  description   TEXT NOT NULL,
  line_type     VARCHAR(30) NOT NULL CHECK (line_type IN (
    'plan_fee', 'overage_fee', 'tax', 'discount', 'other'
  )),
  unit_price    NUMERIC(18,2) NOT NULL,
  quantity      NUMERIC(10,2) NOT NULL CHECK (quantity > 0),
  amount        NUMERIC(18,2) GENERATED ALWAYS AS (unit_price * quantity) STORED,
  tax_rate      NUMERIC(5,2),
  tax_amount    NUMERIC(18,2),
  discount_amount NUMERIC(18,2),
  source_type   VARCHAR(30),
  source_id     UUID,
  metadata      JSONB NOT NULL DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by    UUID REFERENCES adm_provider_employees(id) ON DELETE SET NULL,
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by    UUID REFERENCES adm_provider_employees(id) ON DELETE SET NULL,
  deleted_at    TIMESTAMPTZ,
  deleted_by    UUID REFERENCES adm_provider_employees(id) ON DELETE SET NULL,
  deletion_reason TEXT,
  CONSTRAINT bil_tenant_invoice_lines_unique UNIQUE (invoice_id, description, deleted_at)
);

CREATE INDEX bil_tenant_invoice_lines_type_idx ON bil_tenant_invoice_lines (line_type);
CREATE INDEX bil_tenant_invoice_lines_source_idx ON bil_tenant_invoice_lines (source_type, source_id);
```

Cette version « cible » ajoute des informations explicites sur la nature de chaque ligne, ventile les taxes et les remises, et établit un lien clair vers la source du poste. Elle conserve les champs d’audit et de suppression logique afin de maintenir la traçabilité.

## 4. Impact sur les autres tables et services

- **`bil_tenant_invoices`** : l’ajout de colonnes comme `unit_price`, `tax_amount` ou `discount_amount` par ligne impose d’ajuster le calcul du `total_amount` et des champs dérivés (montant de base, TVA). Le service de facturation devra sommer `amount` (y compris taxes et remises) pour alimenter `subtotal`, `tax_amount` et `total_amount` de la facture parent【535592711015414†L482-L505】. Le workflow de génération et de mise à jour des factures doit être adapté pour prendre en compte les nouveaux champs.

- **`bil_billing_plans`** et **`bil_tenant_subscriptions`** : la facturation des plans et des surcoûts dépend des quotas définis dans ces tables. Si un champ `line_type = 'plan_fee'` est ajouté, le service devra créer une ligne pour le tarif fixe du plan avec `unit_price` correspondant au prix du plan et `quantity = 1`. Pour les dépassements (`line_type = 'overage_fee'`), les métriques calculées dans `bil_tenant_usage_metrics` servent à déterminer la `quantity`.

- **`bil_tenant_usage_metrics`** : les agrégations journalières doivent être exploitables pour générer les lignes de dépassement. Les index `(tenant_id, metric_name, period_start)` restent pertinents, mais il peut être utile d’ajouter une vue matérialisée ou un service pour convertir ces données en lignes de facturation.

- **Services de facturation** : un `InvoiceService` doit orchestrer la création de factures et de lignes. Il calcule le montant du plan, détecte les dépassements, applique la TVA en fonction du pays du tenant (5 % pour l’AE ou 20 % pour la FR)【535592711015414†L482-L505】, applique les remises et envoie la facture au client. Les colonnes `source_type` et `source_id` facilitent la consolidation des différentes sources de facturation.

- **Interfaces et reporting** : grâce à `line_type`, les interfaces utilisateur peuvent distinguer clairement les différentes composantes d’une facture (frais fixes, surcoûts, taxes, remises) et générer des rapports plus précis. Les colonnes `unit_price` et `quantity` permettent d’afficher aux clients comment chaque montant a été calculé.

En synthèse, l’évolution de la table `bil_tenant_invoice_lines` en un modèle plus descriptif améliore la lisibilité des factures, la traçabilité des calculs et la conformité réglementaire sans remettre en cause les données existantes. Les modifications proposées sont additives : elles enrichissent la table et requièrent des ajustements dans les services de facturation et les tables connexes, mais ne suppriment aucun champ ni contrainte du modèle actuel.
