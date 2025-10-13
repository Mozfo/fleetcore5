# Analyse de la table `bil_tenant_invoices`

Cette note détaille la table **`bil_tenant_invoices`** qui gère les factures émises par Fleetcore à ses clients (tenants). Elle décrit les champs à valider d'après le modèle actuel, résume les règles métiers repérées dans le code existant et propose des améliorations possibles. L'objectif est de clarifier le fonctionnement sans réécrire le modèle de données : les suggestions d'ajout sont explicitement séparées.

## 1. Champs à valider (modèle actuel)

Le DDL fourni définit `bil_tenant_invoices` avec les colonnes suivantes : `id`, `tenant_id`, `invoice_number`, `invoice_date`, `due_date`, `total_amount`, `currency`, `status`, `metadata`, `created_at`, `created_by`, `updated_at`, `updated_by`, `deleted_at`, `deleted_by` et `deletion_reason`. Un index unique partiel garantit l’unicité du couple `(tenant_id, invoice_number)` pour les factures actives et des index sur les dates et le statut facilitent les requêtes. Les validations à appliquer sont :

| Champ               | Description/Type | Contraintes et validations                                                                                                                                                                                  |
| ------------------- | ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **id**              | `uuid` (PK)      | Généré par `uuid_generate_v4()`, non nul.                                                                                                                                                                   |
| **tenant_id**       | `uuid`           | **Non nul**. Référence `adm_tenants(id)`. Assure l’isolement multi‑tenant et déclenche un `ON DELETE CASCADE` si un tenant est supprimé.                                                                    |
| **invoice_number**  | `text`           | **Non nul**. Doit être unique par tenant. L’index `UNIQUE (tenant_id, invoice_number) WHERE deleted_at IS NULL` empêche les doublons. Les numéros doivent suivre une séquence logique (ex. `INV‑2025‑001`). |
| **invoice_date**    | `date`           | **Non nul**. Date d’émission de la facture.                                                                                                                                                                 |
| **due_date**        | `date`           | **Non nul**. Un `CHECK` impose que `due_date >= invoice_date`.                                                                                                                                              |
| **total_amount**    | `numeric(18,2)`  | **Non nul**. Doit être ≥ 0 grâce au `CHECK (total_amount >= 0)`. Représente le montant TTC de la facture.                                                                                                   |
| **currency**        | `varchar(3)`     | **Non nul**. Code ISO 4217 (par ex. `USD`, `AED`). Aucune valeur par défaut n’est définie, elle doit être renseignée à la création.                                                                         |
| **status**          | `text`           | **Non nul**. Contrainte `CHECK` limitant les valeurs à `draft`, `sent`, `paid` ou `overdue`. Toute tentative d’insérer une valeur différente doit échouer.                                                  |
| **metadata**        | `jsonb`          | **Non nul** (par défaut `{}`). Permet de stocker des informations supplémentaires. Un index GIN sur ce champ existe pour les requêtes avancées.                                                             |
| **created_at**      | `timestamptz`    | **Non nul**, valeur par défaut `now()`.                                                                                                                                                                     |
| **created_by**      | `uuid`           | Optionnel. Référence `adm_provider_employees(id)` via `ON DELETE SET NULL`. Indique l’employé Fleetcore qui a créé la facture.                                                                              |
| **updated_at**      | `timestamptz`    | **Non nul**, valeur par défaut `now()`. Un trigger `update_bil_tenant_invoices_updated_at` met à jour ce champ automatiquement à chaque modification.                                                       |
| **updated_by**      | `uuid`           | Optionnel. Référence `adm_provider_employees(id)` via `ON DELETE SET NULL`.                                                                                                                                 |
| **deleted_at**      | `timestamptz`    | Optionnel. Présence d’une valeur indique une suppression logique (soft delete).                                                                                                                             |
| **deleted_by**      | `uuid`           | Optionnel. Référence `adm_provider_employees(id)` via `ON DELETE SET NULL`.                                                                                                                                 |
| **deletion_reason** | `text`           | Optionnel. Motif de suppression logique.                                                                                                                                                                    |

Ces colonnes reprennent fidèlement la définition SQL fournie et forment la **structure existante** de la table. Aucun champ de période, de taxes ou de sous‑total n’est présent dans ce DDL ; ces éléments, mentionnés dans d’autres documents, relèvent de la logique applicative ou de futures évolutions.

## 2. Règles métier détectées dans le code existant

Même si le document de conception ne fournit pas de service complet pour la génération de factures, certaines règles apparaissent dans le gestionnaire de webhooks Stripe et la définition des services :

1. **Synchronisation avec Stripe** : Lorsqu’un paiement est réussi (`invoice.payment_succeeded`), le service met à jour toutes les factures dont `stripe_invoice_id` correspond et modifie `status` à `paid`, en renseignant `paid_at`【821672388420112†L540-L560】. L’email de reçu est envoyé au client. En cas d’échec (`invoice.payment_failed`), l’abonnement du client passe en `past_due` et un e‑mail de relance est envoyé【821672388420112†L563-L583】.
2. **Numérotation unique** : Le champ `invoice_number` est unique par tenant. Cela impose de générer un numéro séquentiel ou un identifiant structuré lors de la création et de vérifier qu’il n’existe pas déjà pour ce tenant (ex. `INV‑<année><mois><compteur>`).
3. **Envoi et paiement** : Le statut suit un workflow simple reflétant la réalité du DDL : `draft` lors de la création, `sent` lorsque la facture est transmise au client, `paid` lorsqu’elle est réglée et `overdue` si elle est toujours impayée à la date d’échéance. Le code des webhooks Stripe montre que lors d’un paiement réussi, la facture passe en `paid` et la date de paiement est enregistrée dans un champ complémentaire (`paid_at`), non présent dans le DDL mais géré au niveau applicatif【821672388420112†L540-L560】. En cas d’échec, le statut reste `sent` et des rappels peuvent être envoyés.
4. **RLS et soft‑delete** : La table utilise un `tenant_id` et applique des politiques RLS pour que chaque client ne voie que ses factures. Les suppressions logiques via `deleted_at` permettent de conserver un historique tout en masquant les factures annulées.
5. **Relations avec les lignes de facture** : Les détails de facturation sont enregistrés dans `bil_tenant_invoice_lines`, chaque ligne représentant un article (plan d’abonnement, surcoût, taxe). Un index unique `(invoice_id, description) WHERE deleted_at IS NULL` empêche la duplication d’une même description pour une même facture【670985086569191†L930-L935】.

## 3. Structure proposée et améliorations (ajouts non destructifs)

L’objectif est d’améliorer la robustesse et la conformité de la table **sans supprimer les champs existants** :

1. **Uniformiser et préciser les champs** : bien que le DDL actuel n’inclue pas de périodes ni de taxes, il peut être utile d’ajouter certaines colonnes pour mieux suivre la facturation. Par exemple, vous pouvez envisager d’ajouter un `subscription_id` (FK vers la souscription en cours), ainsi que `period_start` et `period_end` pour délimiter la période de facturation. Ces ajouts ne remplacent aucun champ existant ; ils complètent la table afin de refléter la structure du cycle d’abonnement telle qu’elle est décrite dans certains services.

2. **Champs complémentaires suggérés** : si vous souhaitez gérer les paiements partiels ou les remises, vous pouvez ajouter des colonnes facultatives comme `amount_paid`, `amount_due`, `discount_amount`, `promotion_code` ou `notes`. Pour les taxes, une colonne `tax_details` (`jsonb`) ou des champs séparés (`tax_rate`, `tax_amount`) aideraient à calculer le montant total. Une colonne `period_usage_summary` (`jsonb`) pourrait stocker un récapitulatif des ressources facturées (par exemple, nombre de véhicules ou chauffeurs actifs). Aucune de ces colonnes n’existe dans le DDL : elles sont proposées comme extensions non destructives.

3. **Contraintes et index supplémentaires** : vous pouvez renforcer les contraintes existantes en indexant `status`, `invoice_date`, `due_date` et `tenant_id` pour accélérer les requêtes. Si vous ajoutez `subscription_id` et des champs Stripe (`stripe_invoice_id`), prévoyez des index sur ceux‑ci. Conservez la contrainte unique `(tenant_id, invoice_number)` et ajoutez, si nécessaire, un index partiel pour le statut `paid` afin de faciliter les rapports.

4. **Services et intégrations** : pour un système de facturation complet, il est recommandé d’implémenter un `InvoiceService` qui compile les métriques d’usage, calcule le montant selon le plan, crée la facture et ses lignes, puis interfère avec Stripe. L’identifiant Stripe (`stripe_invoice_id`) et l’URL du document (`document_url`) seraient stockés dans des colonnes supplémentaires proposées ci‑dessus.

5. **Conformité fiscale et légale** : les numéros de facture doivent suivre une séquence stricte sans trou. Si vous gérez des clients internationaux, la table doit stocker la devise d’origine et éventuellement un champ `vat_number` (identifiant fiscal du client) dans `metadata`. Toutes ces informations peuvent être ajoutées sans modifier la structure existante.

En appliquant ces suggestions, la table conservera sa compatibilité avec votre DDL actuel tout en offrant la flexibilité nécessaire pour supporter un cycle de facturation plus complet. Aucune de ces améliorations ne supprime ni ne modifie les champs existants ; elles s’ajoutent pour enrichir le modèle en fonction des besoins futurs.

## 4. Modèle de données cible et impact sur les autres tables

Pour préparer la plateforme à la facturation SaaS à grande échelle, il est utile de définir un **modèle cible** qui intègre les améliorations précédentes et s’aligne sur les services décrits dans la spécification. Le schéma ci‑dessous reprend les champs actuels et ajoute ceux nécessaires au suivi des périodes, des taxes et des paiements :

```sql
CREATE TABLE bil_tenant_invoices (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id        UUID NOT NULL REFERENCES adm_tenants(id) ON DELETE CASCADE,
  subscription_id  UUID NOT NULL REFERENCES bil_tenant_subscriptions(id) ON DELETE CASCADE,
  invoice_number   TEXT NOT NULL,
  invoice_date     TIMESTAMPTZ NOT NULL,
  due_date         TIMESTAMPTZ NOT NULL,
  period_start     TIMESTAMPTZ NOT NULL,
  period_end       TIMESTAMPTZ NOT NULL,
  subtotal         NUMERIC(18,2) NOT NULL,
  tax_rate         NUMERIC(5,2),
  tax_amount       NUMERIC(18,2),
  total_amount     NUMERIC(18,2) NOT NULL,
  currency         CHAR(3) NOT NULL,
  status           VARCHAR(50) NOT NULL CHECK (status IN (
    'draft', 'sent', 'paid', 'overdue', 'void', 'uncollectible'
  )),
  amount_paid      NUMERIC(18,2) DEFAULT 0,
  amount_due       NUMERIC(18,2) DEFAULT 0,
  paid_at          TIMESTAMPTZ,
  stripe_invoice_id VARCHAR(255),
  document_url     TEXT,
  metadata         JSONB NOT NULL DEFAULT '{}',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by       UUID REFERENCES adm_provider_employees(id) ON DELETE SET NULL,
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by       UUID REFERENCES adm_provider_employees(id) ON DELETE SET NULL,
  deleted_at       TIMESTAMPTZ,
  deleted_by       UUID REFERENCES adm_provider_employees(id) ON DELETE SET NULL,
  deletion_reason  TEXT,
  CONSTRAINT bil_tenant_invoices_unique_num UNIQUE (tenant_id, invoice_number, deleted_at)
);

-- Indexes pour accélérer les recherches
CREATE INDEX bil_tenant_invoices_tenant_status_idx ON bil_tenant_invoices (tenant_id, status) WHERE deleted_at IS NULL;
CREATE INDEX bil_tenant_invoices_date_idx ON bil_tenant_invoices (invoice_date, due_date);
CREATE INDEX bil_tenant_invoices_stripe_idx ON bil_tenant_invoices (stripe_invoice_id);
```

### Impact sur les autres tables et services

- **`bil_tenant_subscriptions`** : l’ajout d’un champ `subscription_id` établit un lien explicite entre une facture et la souscription dont elle découle. Cela permet de calculer facilement les périodes de facturation (`period_start` / `period_end`) et de gérer les changements de plan ou les suspensions. La table des souscriptions devra prévoir un champ `current_period_start` et `current_period_end` pour être alignée avec la facture.

- **`bil_tenant_invoice_lines`** : les lignes de facturation continueront à référencer chaque facture via `invoice_id`. Si vous ajoutez des taxes et des remises sur la facture principale, les lignes pourront inclure des champs `tax_amount` ou `discount_amount` pour ventiler les montants. Une colonne `line_type` (`plan_fee`, `overage_charge`, `tax`, `discount`) peut être introduite pour clarifier la nature de chaque ligne.

- **`bil_tenant_usage_metrics`** : le service de facturation agrège les métriques (nombre de véhicules, de chauffeurs, de trajets, appels API, etc.) pour déterminer le montant des surcoûts【535592711015414†L482-L505】. L’introduction de `period_start` et `period_end` dans la table des factures implique que les métriques doivent être segmentées par période. Les index existants `(tenant_id, metric_name, period_start)` assurent que cette requête reste performante.

- **`bil_payment_methods`** : aucune modification structurelle n’est nécessaire, mais l’intégration avec Stripe est renforcée. Le champ `stripe_invoice_id` permet de concilier les factures internes et celles de Stripe. Les notifications de paiement réussi ou échoué continuent de mettre à jour le statut de la facture et d’envoyer des emails via la méthode existante【821672388420112†L540-L560】【821672388420112†L563-L583】.

- **`adm_tenant_lifecycle_events`** : des événements supplémentaires (`invoice_sent`, `invoice_paid`, `invoice_overdue`, `invoice_void`) peuvent être ajoutés dans l’énumération `event_type`. À chaque changement de statut de facture, un enregistrement dans cette table doit être créé afin de tracer l’historique de facturation et faciliter les audits. Cela nécessitera d’étendre le `CHECK` de `event_type` pour inclure ces valeurs et d’ajouter une logique dans le service de facturation pour insérer les événements correspondants.

- **Services et workflows** : l’introduction du champ `amount_due` permet de gérer les paiements partiels. En cas de paiement partiel, la facture reste `sent` jusqu’à ce que `amount_paid >= total_amount`. Le service doit mettre à jour `amount_paid` et ajuster le `status` en conséquence. La nouvelle colonne `document_url` permet de stocker l’URL du PDF émis par le service de génération de facture.

En adoptant ce modèle cible, vous alignez la table sur les meilleures pratiques SaaS (facturation par période, gestion des taxes et des remises, intégration Stripe) tout en garantissant la compatibilité ascendante. Les modifications proposées n’affectent pas les champs existants : elles les complètent et créent des relations explicites avec les autres domaines (souscriptions, métriques, événements, méthodes de paiement), rendant l’ensemble du data model cohérent et extensible.
