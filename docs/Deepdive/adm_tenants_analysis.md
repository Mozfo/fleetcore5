# Analyse de la table `adm_tenants`

Cette note examine la table **`adm_tenants`** du domaine d’administration. Elle se base sur le DDL fourni (structure Supabase existante) et sur la spécification de données Fleetcore. Le but est de résumer les champs actuels, d’identifier les règles métiers et les processus associés, puis de proposer des améliorations en expliquant leur impact sur le modèle cible et les autres tables.

## 1. Modèle existant

La définition SQL actuelle crée une table `adm_tenants` avec les colonnes suivantes :

| Champ                       | Type / contraintes                                          | Description                                                                                                    |
| --------------------------- | ----------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `id`                        | `uuid` (PK)                                                 | Identifiant unique généré via `uuid_generate_v4()`.                                                            |
| `name`                      | `text` NOT NULL                                             | Nom lisible de l’organisation cliente.                                                                         |
| `country_code`              | `varchar(2)` NOT NULL                                       | Code ISO 3166‑1 du pays du client (ex : `AE` pour les Émirats arabes unis).                                    |
| `clerk_organization_id`     | `text` UNIQUE                                               | Identifiant dans le fournisseur d’authentification (Clerk). Permet de lier le tenant à son organisation Clerk. |
| `vat_rate`                  | `numeric(5,2)` NULL                                         | Taux de TVA appliqué par défaut pour ce tenant.                                                                |
| `default_currency`          | `char(3)` NOT NULL DEFAULT `'EUR'`                          | Devise par défaut pour la facturation.                                                                         |
| `timezone`                  | `text` NOT NULL DEFAULT `'Europe/Paris'`                    | Fuseau horaire par défaut, utilisé pour l’affichage des dates et le calcul des périodes.                       |
| `subdomain`                 | `varchar(100)` UNIQUE                                       | Sous‑domaine attribué au tenant (ex. `acme` → `acme.fleetcore.com`).                                           |
| `created_at` / `updated_at` | `timestamptz` NOT NULL                                      | Dates de création et de mise à jour. Un trigger `set_updated_at` met à jour `updated_at` automatiquement.      |
| `deleted_at`                | `timestamptz` NULL                                          | Date de suppression logique (soft delete).                                                                     |
| `… audit …`                 | `created_by`, `updated_by`, `deleted_by`, `deletion_reason` | Référencent des employés Fleetcore (adm_provider_employees) et expliquent la suppression.                      |

Contraintes :

- **Clés uniques** : unicité sur `clerk_organization_id` et `subdomain`.
- **Index** sur `country_code`, `default_currency`, `clerk_organization_id` et `deleted_at` pour optimiser les requêtes.
- **Soft delete** : la suppression est logique via `deleted_at` pour conserver l’historique.

Dans la spécification complète, la table comporte également un champ `metadata jsonb` pour stocker des informations extensibles et un champ `status` (`active`/`inactive`)【421540084436575†L64-L90】. Ces colonnes sont absentes du DDL fourni mais seront utiles dans la cible.

## 2. Règles métiers et processus identifiés

### 2.1 Création et onboarding des tenants

Le flux d’onboarding commence lorsqu’un prospect demande une démonstration via un formulaire. Après qualification, l’équipe Fleetcore vérifie les documents du client, crée une entrée dans `adm_tenants` et dans Clerk, puis envoie une invitation au futur administrateur【421540084436575†L64-L90】. La création d’un tenant doit générer un événement de cycle de vie (`adm_tenant_lifecycle_events`) avec `event_type = created`【421540084436575†L299-L323】. Le numéro de TVA (`vat_rate`) et la devise par défaut sont saisis selon le pays et les accords commerciaux.

### 2.2 Gestion du sous‑domaine et de l’organisation Clerk

Chaque tenant se voit attribuer un sous‑domaine unique (`subdomain`) pour accéder à son espace. L’unicité partielle sur `(subdomain)` empêche deux organisations actives d’utiliser le même sous‑domaine【421540084436575†L94-L99】. La colonne `clerk_organization_id` doit être renseignée dès que l’organisation est créée dans Clerk afin de synchroniser les membres et la gestion des rôles.

### 2.3 Mise à jour et suspension

Les informations du tenant (nom, pays, TVA, fuseau horaire, devise) peuvent être mises à jour par un super administrateur. Les modifications doivent être journalisées (audit) et déclenchent une mise à jour de `updated_at`.

Lorsqu’un abonnement est suspendu (par exemple pour facture impayée), un événement `suspended` est ajouté à `adm_tenant_lifecycle_events` avec l’employé responsable et une date d’effet【421540084436575†L299-L323】. Le statut du tenant dans l’application est alors mis à `inactive`. Ce champ `status` permet de filtrer les tenants actifs.

### 2.4 Suppression et conformité

La suppression d’un tenant est logique (`deleted_at`), permettant d’archiver les données sans perte. Le code doit empêcher toute action sur un tenant supprimé et supprimer en cascade les données dépendantes via les `ON DELETE CASCADE` des clés étrangères.

### 2.5 Sécurité et isolation

Dans une architecture multi‑tenant, l’isolement est crucial pour éviter toute fuite de données. Le DDL fourni n’inclut pas explicitement la politique RLS, mais la spécification recommande d’activer la Row‑Level Security et d’ajouter une politique d’isolement sur `tenant_id` pour chaque table client【421540084436575†L42-L46】. Frontegg rappelle que l’isolation des tenants protège la confidentialité et l’intégrité des données en combinant séparation des données et contrôles applicatifs【966139222788857†L142-L146】. De plus, la sécurité doit s’appuyer sur le chiffrement, des contrôles d’accès stricts et une surveillance continue pour prévenir l’accès non autorisé【966139222788857†L243-L247】.

## 3. Propositions d’amélioration et modèle cible

### 3.1 Ajouter des champs de gestion et de conformité

Le modèle existant ne prévoit pas de champ `status` ni de `metadata`. La spécification Fleetcore recommande de les inclure【421540084436575†L64-L90】 :

- **`status`** (`varchar(50)`, par défaut `active`) : indique l’état courant du tenant (`active`, `inactive`, `suspended`, `cancelled`). Cela permet d’activer/désactiver l’accès sans supprimer la ligne et de filtrer les tenants actifs.
- **`metadata`** (`jsonb`, non nul, par défaut `{}`) : stocke des attributs extensibles (logo, préférences, adresse complète, code TVA, contact principal). Ceci évite d’ajouter une colonne pour chaque champ optionnel.

### 3.2 Enrichir l’information du contact

Dans le code, de nombreuses fonctionnalités (facturation, support, notifications) se réfèrent à `tenant.primary_contact_email` et `tenant.company_name`. Ces champs n’existent pas dans le DDL mais sont nécessaires :

- **`company_name`** (`text` NOT NULL) : raison sociale du client, utilisée pour la facturation et les contrats.
- **`primary_contact_name`**, **`primary_contact_email`**, **`primary_contact_phone`** : coordonnées du référent principal. Ces informations sont indispensables pour les communications (factures, alertes, support).
- **`address_line1`**, `address_line2`, `city`, `postal_code`, `country_code` (déjà présent), pour l’adresse légale et la génération des factures.

L’ajout de ces champs alimente directement les modules `bil_tenant_invoices`, `sup_tickets` et `crm_leads` ; il facilite la conformité RGPD et la personnalisation des notifications.

### 3.3 Normaliser la gestion des fuseaux et des langues

- Remplacer `timezone` par un type ENUM IANA afin de limiter les valeurs valides (par exemple `Europe/Paris`, `Asia/Dubai`).
- Ajouter `default_language` (`varchar(5)`), code de langue (`fr`, `en`), pour internationaliser l’application.

### 3.4 Gestion du plan d’abonnement

Intégrer un champ `current_plan_id` (`uuid` nullable) référent à `bil_billing_plans` permet de savoir immédiatement à quel plan le tenant est rattaché et d’appliquer les quotas correspondants. Lors d’un changement de plan, un événement `plan_changed` est enregistré dans `adm_tenant_lifecycle_events`【421540084436575†L299-L323】 et le champ est mis à jour.

### 3.5 Nomenclature et bonnes pratiques

La littérature recommande d’utiliser un nom générique pour le modèle de haut niveau. L’article “Ultimate guide to multi‑tenant SaaS data modelling” suggère d’utiliser **`Organization`** comme nom du modèle plutôt que des termes ambiguës comme `Account` ou `Team`【540541453038143†L69-L96】. Renommer `adm_tenants` en `adm_organizations` améliorerait la lisibilité et refléterait mieux son rôle.

### 3.6 Impact sur les autres tables

Les modifications ci‑dessus ont plusieurs impacts :

- **Ajout de `status` et `metadata`** : ces colonnes n’affectent pas les clés étrangères existantes, mais elles nécessitent d’adapter les requêtes des services pour filtrer par `status` et exploiter le JSON `metadata`.
- **Champs de contact et d’adresse** : ces informations seront utilisées par `bil_tenant_invoices` (adresse sur les factures), `crm_leads` (conversion de prospects en clients) et `sup_support_tickets` (coordonnées pour la communication). Les modules correspondants devront ajouter des jointures ou étendre leurs modèles pour tirer parti de ces nouvelles colonnes.
- **`current_plan_id`** : la table des abonnements (`bil_tenant_subscriptions`) reste la source de vérité, mais avoir la clé du plan sur le tenant facilite les requêtes et améliore les performances du dashboard. Il faudra mettre à jour cette colonne lors de la création ou du changement d’abonnement et veiller à la cohérence avec `bil_tenant_subscriptions`.
- **Renommage en `adm_organizations`** : impliquerait un changement de préfixe dans toutes les clés étrangères (par exemple `tenant_id` deviendrait `organization_id`) et nécessiterait une migration globale du schéma et du code. Ce changement est coûteux ; il peut être réservé à une future refonte majeure.

## 4. Représentation du modèle cible (diagramme textuel)

```
adm_tenants (ou adm_organizations)
  - id : uuid (PK)
  - name : text (public name)
  - company_name : text (legal name)
  - subdomain : varchar(100) UNIQUE
  - country_code : char(2)
  - clerk_organization_id : varchar(255) UNIQUE
  - vat_rate : numeric(5,2) NULL
  - default_currency : char(3)
  - timezone : varchar(50)
  - default_language : varchar(5) NULL
  - status : varchar(50) DEFAULT 'active'
  - metadata : jsonb DEFAULT '{}'
  - primary_contact_name : text
  - primary_contact_email : citext
  - primary_contact_phone : varchar(50)
  - address_line1 : text
  - address_line2 : text NULL
  - city : text
  - postal_code : text
  - current_plan_id : uuid NULL → bil_billing_plans(id)
  - created_at / created_by / updated_at / updated_by / deleted_at / deleted_by / deletion_reason

Indexes
  - UNIQUE (subdomain) WHERE deleted_at IS NULL
  - UNIQUE (clerk_organization_id) WHERE deleted_at IS NULL
  - btree on country_code, status, default_currency, deleted_at
  - GIN on metadata

RLS policies
  - Read: allow super admins to read all; allow tenant admins to read their own row
  - Write: only provider employees or automated processes can update/create tenants
```

Cette structure cible conserve les colonnes existantes tout en ajoutant des champs nécessaires pour la facturation, le support, l’internationalisation et la gestion des plans. L’architecture multi‑tenant reste protégée par des politiques RLS et des clés uniques.

## 5. Conclusion

La table `adm_tenants` constitue le pivot de l’architecture multi‑tenant de Fleetcore. Elle stocke l’identité et les paramètres de chaque client. Le DDL actuel couvre les éléments essentiels, mais l’analyse montre qu’ajouter des champs de contact, un statut, un JSON de métadonnées et un lien vers le plan d’abonnement améliorera la cohérence du système et facilitera les processus de facturation, support et reporting. Ces évolutions doivent être coordonnées avec les autres tables (abonnements, factures, support) et s’accompagner d’une mise à jour des services pour maintenir l’intégrité des données.
