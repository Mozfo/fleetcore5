# Analyse de la table `bil_payment_methods`

Cette note fournit une analyse complète de la table **`bil_payment_methods`**. Elle distingue le **modèle existant** (tel que défini dans le DDL Supabase), les **règles métiers** observées ou déduites de la spécification et du code, les **améliorations possibles** pour répondre aux bonnes pratiques (notamment PCI‑DSS), ainsi qu’un **modèle cible** intégrant ces améliorations et leur impact sur le reste du schéma.

## 1. Modèle Supabase existant

La table `bil_payment_methods` enregistre les moyens de paiement d’un tenant. Voici les principaux champs et leurs contraintes :

| Champ                                          | Type                  | Contraintes/Validation                                                              | Observations                                                                                                                                                                                 |
| ---------------------------------------------- | --------------------- | ----------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **id**                                         | `uuid`                | Clé primaire générée par `uuid_generate_v4()`                                       | Identifiant immuable du moyen de paiement.                                                                                                                                                   |
| **tenant_id**                                  | `uuid`                | **Non nul**, FK vers `adm_tenants(id)` avec `ON DELETE CASCADE`                     | Assure l’isolement multi‑tenant.                                                                                                                                                             |
| **payment_type**                               | `text`                | **Non nul**, contraint par `CHECK` à `card`, `bank` ou `paypal`                     | Seules ces trois options sont acceptées【571190288736298†L39-L45】.                                                                                                                          |
| **provider_token**                             | `text`                | **Non nul**                                                                         | Jeton sécurisé renvoyé par le prestataire (Stripe, PayPal…). Doit remplacer les données sensibles de la carte ; aucune information de carte ne doit être stockée【571190288736298†L74-L79】. |
| **expires_at**                                 | `date`                | Optionnel                                                                           | Date d’expiration pour les cartes. Null pour les comptes bancaires et PayPal.                                                                                                                |
| **status**                                     | `text`                | **Non nul**, contrainte `CHECK` : `active`, `inactive`, `expired`                   | Indique si le moyen de paiement peut être utilisé.                                                                                                                                           |
| **metadata**                                   | `jsonb`               | **Non nul**, défaut `{}`                                                            | Stocke des informations supplémentaires (ex. marque de la carte, quatre derniers chiffres). Un index GIN permet de filtrer sur ce champ.                                                     |
| **created_at**, **updated_at**                 | `timestamptz`         | **Non nuls**, défaut `now()`                                                        | Des triggers mettent à jour `updated_at` automatiquement.                                                                                                                                    |
| **created_by**, **updated_by**, **deleted_by** | `uuid`                | Références facultatives vers `adm_provider_employees(id)` avec `ON DELETE SET NULL` | Suivi des actions internes.                                                                                                                                                                  |
| **deleted_at**, **deletion_reason**            | `timestamptz`, `text` | Optionnels                                                                          | Indiquent une suppression logique.                                                                                                                                                           |

Un index unique partiel `(tenant_id, payment_type) WHERE deleted_at IS NULL` empêche un tenant d’avoir deux moyens de paiement actifs du même type. D’autres index accélèrent les recherches par `tenant_id`, `payment_type`, `expires_at` et `status`. La table applique des RLS via `tenant_id` pour que chaque client ne voie que ses propres enregistrements.

## 2. Règles métier et processus déduits

1. **Isolation multi‑tenant** : chaque enregistrement appartient à un tenant. Les méthodes de paiement d’un client ne doivent pas être visibles par un autre client.

2. **Mono‑méthode par type** : la contrainte unique `(tenant_id, payment_type)` limite chaque tenant à un seul moyen de paiement actif par type (par exemple, une seule carte bancaire). Si l’on souhaite en enregistrer plusieurs, il faut désactiver l’ancien ou modifier la contrainte.

3. **Tokenisation** : la spécification impose de ne jamais stocker les numéros de carte complets. Le champ `provider_token` doit contenir un identifiant renvoyé par le prestataire, tandis que `metadata` peut stocker la marque et les quatre derniers chiffres【571190288736298†L74-L79】. Ceci est conforme aux exigences PCI‑DSS et aux bonnes pratiques : utiliser la tokenisation pour protéger les données sensibles【768810509007740†L96-L103】.

4. **Expiration et statut** : pour les cartes, `expires_at` doit être renseigné et contrôlé. Un traitement planifié doit marquer les cartes arrivées à échéance comme `expired`. Les méthodes dont le statut est `inactive` ou `expired` ne doivent pas être utilisées pour les factures.

5. **Défaut et priorité** : le DDL actuel ne prévoit pas de champ `is_default`. En pratique, il est nécessaire de savoir quel moyen utiliser en priorité pour le paiement des abonnements ou des factures. La logique applicative doit gérer cette notion en s’appuyant sur `status` et sur l’ordre de création.

6. **Mise à jour et révocation** : lors d’un changement de carte ou d’un retrait de consentement, le champ `status` est mis à `inactive` ou l’enregistrement est soft‑deleted via `deleted_at`. L’application supprime le jeton auprès du prestataire pour respecter le RGPD.

## 3. Propositions d’amélioration et modèle cible

Pour suivre les meilleures pratiques SaaS et PCI‑DSS sans altérer les données existantes, les améliorations suivantes sont proposées :

1. **Différencier le prestataire** : ajouter une colonne `provider` (`varchar(50)`) pour spécifier l’origine du jeton (`stripe`, `adyen`, `paypal`, etc.). Renommer `provider_token` en `provider_payment_method_id` pour clarifier qu’il s’agit de l’identifiant renvoyé par le prestataire.

2. **Gestion du moyen par défaut** : ajouter une colonne booléenne `is_default` avec un index partiel `UNIQUE (tenant_id) WHERE is_default = true AND deleted_at IS NULL` afin de garantir qu’un seul moyen est désigné par défaut. Cela permet de conserver plusieurs cartes ou comptes, tout en identifiant celui qui sera utilisé en priorité.

3. **Normalisation des types et statuts** : remplacer `payment_type` et `status` par des énumérations (`ENUM`) ou des types contraints pour éviter des valeurs incohérentes. Par exemple :
   - `payment_type` : `card`, `bank_account`, `paypal`, `apple_pay`, etc.
   - `status` : `active`, `inactive`, `expired`, `failed`, `pending_verification`.

4. **Données de carte et de compte** : ajouter des colonnes facultatives pour stocker des informations non sensibles : `card_brand`, `card_last4`, `card_exp_month`, `card_exp_year`, `bank_name`, `bank_account_last4`, `bank_country`. Ces champs facilitent l’affichage au client et la gestion des échéances, tout en respectant la tokenisation【571190288736298†L74-L79】.

5. **Extension multi‑fournisseur** : si plusieurs processeurs de paiement sont utilisés, introduire un champ `provider_metadata` (`jsonb`) pour stocker des paramètres spécifiques à chaque PSP (ex. les codes d’authentification Adyen ou les IDs de source Stripe). Le champ `provider` mentionné ci‑dessus permet de router les appels au bon service.

6. **Règles supplémentaires** : ajouter un champ `last_used_at` (timestamp) pour savoir quand le moyen de paiement a été utilisé pour la dernière fois. Cette information aide à identifier les méthodes obsolètes.

7. **Modèle cible (DDL amélioré)** :

```sql
CREATE TABLE bil_payment_methods (
  id                         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id                  UUID NOT NULL REFERENCES adm_tenants(id) ON DELETE CASCADE,
  provider                   VARCHAR(50) NOT NULL,
  payment_type               VARCHAR(20) NOT NULL CHECK (payment_type IN (
    'card', 'bank_account', 'paypal', 'other'
  )),
  provider_payment_method_id TEXT NOT NULL,
  is_default                 BOOLEAN NOT NULL DEFAULT false,
  card_brand                 VARCHAR(50),
  card_last4                 CHAR(4),
  card_exp_month             INTEGER,
  card_exp_year              INTEGER,
  bank_name                  VARCHAR(100),
  bank_account_last4         CHAR(4),
  bank_country               CHAR(2),
  expires_at                 DATE,
  status                     VARCHAR(20) NOT NULL CHECK (status IN (
    'active', 'inactive', 'expired', 'failed', 'pending_verification'
  )),
  metadata                   JSONB NOT NULL DEFAULT '{}',
  last_used_at               TIMESTAMPTZ,
  created_at                 TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by                 UUID REFERENCES adm_provider_employees(id) ON DELETE SET NULL,
  updated_at                 TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by                 UUID REFERENCES adm_provider_employees(id) ON DELETE SET NULL,
  deleted_at                 TIMESTAMPTZ,
  deleted_by                 UUID REFERENCES adm_provider_employees(id) ON DELETE SET NULL,
  deletion_reason            TEXT,
  CONSTRAINT bil_payment_methods_default_uq UNIQUE (tenant_id) WHERE is_default = true AND deleted_at IS NULL,
  CONSTRAINT bil_payment_methods_token_uq UNIQUE (tenant_id, provider_payment_method_id) WHERE deleted_at IS NULL
);

CREATE INDEX bil_payment_methods_tenant_status_idx ON bil_payment_methods (tenant_id, status) WHERE deleted_at IS NULL;
CREATE INDEX bil_payment_methods_expires_idx ON bil_payment_methods (expires_at) WHERE deleted_at IS NULL;
```

Cette version cible permet d’enregistrer plusieurs moyens par type et par tenant, de désigner un moyen par défaut et d’intégrer facilement de nouveaux prestataires. Elle reste compatible avec la tokenisation : seules des données non sensibles sont stockées【571190288736298†L74-L79】【768810509007740†L96-L103】.

## 4. Impact sur les autres tables et services

Les modifications proposées n’affectent pas directement la structure des tables de facturation (`bil_tenant_invoices`, `bil_tenant_invoice_lines`), mais elles impliquent des ajustements dans les services et la logique applicative :

- **Facturation et règlement** : le champ `is_default` permet de choisir automatiquement le moyen de paiement lors de la génération d’une facture. Si le paiement échoue, le service peut tenter d’utiliser un autre moyen actif (`status = active`). L’intégration multi‑fournisseurs nécessite d’ajouter des couches d’abstraction dans la passerelle de paiement.

- **Abonnements (`bil_tenant_subscriptions`)** : lors de la création d’une souscription ou d’un renouvellement, le moyen de paiement par défaut doit être lié à la souscription. Si le client change de carte, l’ID de la source Stripe ou Adyen doit être mis à jour.

- **Support et conformité** : des rôles internes doivent être en mesure de révoquer un moyen de paiement (changement de statut `inactive`) et de déclencher des notifications. Les champs supplémentaires (banque, dates d’expiration) facilitent les communications de renouvellement et les contrôles de conformité PCI‑DSS.

- **Audits et journaux** : l’ajout de `last_used_at` et la normalisation des statuts permettront de générer des rapports plus précis. Chaque création, mise à jour ou suppression doit continuer d’être consignée dans `adm_audit_logs`, comme le prévoit le service d’audit.

En adoptant ce modèle amélioré, Fleetcore pourra gérer efficacement plusieurs moyens de paiement par tenant, intégrer différents prestataires et respecter les réglementations de sécurité sans sacrifier la compatibilité avec le schéma actuel. Les modifications proposées sont **additives** : elles enrichissent la table et les processus associés, sans supprimer les champs existants.
