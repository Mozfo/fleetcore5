# FLEETCORE - ÉVOLUTION MODÈLE V1 → V2 : ANALYSE COMPLÈTE DES 55 TABLES (VERSION 2.2)

**Date:** 21 Octobre 2025  
**Version:** 2.2 - Document complété avec modules Administration + Billing  
**Source:** Document 0_All_tables_v1.md (6386 lignes) + Analyses tables \_analysis.md  
**Ajout:** Module Billing (6 tables) documenté avec même granularité que Administration

---

Le document est une analyse EXHAUSTIVE du modèle de données complet, pas seulement d'un sous-ensemble.

---

### 💰 Domaine Billing SaaS (6 tables) - AJOUTÉ

45. `bil_billing_plans` - Plans tarifaires et quotas
46. `bil_tenant_subscriptions` - Abonnements clients
47. `bil_tenant_usage_metrics` - Métriques consommation
48. `bil_tenant_invoices` - Factures SaaS
49. `bil_tenant_invoice_lines` - Détail lignes factures
50. `bil_payment_methods` - Moyens de paiement

## ÉVOLUTIONS MAJEURES V1 → V2 - MODULE BILLING

### 💰 Évolutions sur les 6 tables Billing

#### Table 1: `bil_billing_plans` - Plans et tarification

**Existant V1:**

- Plan name et description basiques
- Monthly/annual fees simples
- Features en JSON non structuré
- Pas d'identifiant technique stable
- Pas de quotas inclus

**Évolutions V2:**

```sql
AJOUTER:
- plan_code (varchar 100) UNIQUE - Identifiant technique stable
  * Permet renommage marketing sans casser les références
  * Utilisé dans le code et intégrations (Stripe)

- max_vehicles (integer) - Quota véhicules inclus
- max_drivers (integer) - Quota conducteurs inclus
- max_users (integer) - Quota utilisateurs inclus
  * Base pour calcul des dépassements
  * NULL = illimité

- vat_rate (numeric 5,2) - Taux TVA par défaut
  * 5% pour UAE, 20% pour FR
  * Appliqué automatiquement à la facturation

- billing_interval (varchar 10) - 'month' ou 'year'
  * Intervalle de facturation par défaut

- version (integer) DEFAULT 1 - Versioning des plans
  * Permet évolutions tarifaires sans perdre historique
  * Chaque version = nouveau tarif avec date effet

MODIFIER status ENUM:
- draft, active, deprecated, archived
  * draft: préparation, non visible clients
  * active: disponible souscription
  * deprecated: plus proposé, mais existant honoré
  * archived: historique uniquement

AJOUTER intégration Stripe:
- stripe_price_id_monthly (text)
- stripe_price_id_yearly (text)
  * Références vers objets Price Stripe
  * Automatise synchronisation facturation

COLONNES PRIX (décision 21/12/2025):
- monthly_fee : prix mensuel (Decimal 14,2, NOT NULL, default 0)
- annual_fee : prix annuel (Decimal 14,2, NOT NULL, default 0)

Note: Les colonnes price_monthly/price_yearly ont été supprimées car redondantes.
Convention retenue: monthly_fee/annual_fee (noms originaux, compatibles code existant).

AJOUTER contrainte unique:
- UNIQUE (plan_code, version) WHERE deleted_at IS NULL
```

**Cas d'usage des évolutions:**

- **plan_code**: "basic-v1" reste identique même si plan_name change de "Basic" à "Essentiel"
- **Quotas**: Plan Basic inclut 10 véhicules, 20 drivers → au-delà = overage fees
- **Version**: Plan Pro passe de 99€ à 119€ → version 2 créée, anciens clients gardent v1
- **Stripe IDs**: Permet facturation automatique sans duplication de configuration

#### Table 2: `bil_tenant_subscriptions` - Abonnements clients

**Existant V1:**

- Liaison simple tenant → plan
- Dates start/end basiques
- Status limité (active, inactive, cancelled)
- Pas de gestion période facturation
- Pas de référence prestataire paiement

**Évolutions V2:**

```sql
AJOUTER gestion cycle facturation:
- billing_cycle (varchar 10) NOT NULL DEFAULT 'monthly'
  * 'monthly' ou 'yearly'
  * Détermine fréquence facturation

- current_period_start (timestamptz)
- current_period_end (timestamptz)
  * Période facturation en cours
  * Utilisé pour calcul metrics et proration

- trial_end (timestamptz)
  * Fin période essai gratuit (14 jours défaut)
  * Conversion auto en payant après cette date

- cancel_at_period_end (boolean) NOT NULL DEFAULT true
  * Si true: annulation à fin période (pas immédiate)
  * Si false: annulation et suspension immédiates

AJOUTER gestion multi-PSP:
- provider (varchar 50) - 'stripe', 'adyen', 'paypal'
  * Nom prestataire de paiement utilisé
  * Permet migration entre PSP sans perte données

- provider_subscription_id (text)
- provider_customer_id (text)
  * Identifiants chez le PSP
  * Utilisés pour webhooks et synchronisation
  * Indexés pour performance

ENRICHIR statuts:
- trialing, active, past_due, suspended, cancelling, cancelled, inactive
  * trialing: période essai
  * active: abonnement actif et payé
  * past_due: paiement échoué, en attente
  * suspended: suspendu (impayé, violation TOS)
  * cancelling: annulation programmée fin période
  * cancelled: annulé effectif
  * inactive: ancien abonnement archivé

AJOUTER historique et contexte:
- previous_plan_id (uuid) REFERENCES bil_billing_plans(id)
  * Plan précédent lors upgrade/downgrade
  * Permet calcul proration

- plan_version (integer)
  * Version du plan souscrit
  * Fige tarif même si plan évolue

- payment_method_id (uuid) REFERENCES bil_payment_methods(id)
  * Moyen paiement utilisé pour cet abonnement
  * Si NULL, utilise moyen par défaut tenant

- auto_renew (boolean) NOT NULL DEFAULT true
  * Renouvellement automatique à fin période
  * Si false, passage en cancelled à l'échéance

MODIFIER contrainte unique:
- UNIQUE (tenant_id) WHERE deleted_at IS NULL
  * Un seul abonnement actif par tenant
  * Plusieurs peuvent exister avec deleted_at
```

**Cas d'usage des évolutions:**

- **Cycle + périodes**: Facturation mensuelle du 1er au 30, metrics agrégées sur cette période
- **Trial**: 14 jours gratuit → trial_end = date_start + 14 jours → passage auto à active
- **Multi-PSP**: Client UAE sur Stripe, client FR sur Adyen → provider différent
- **past_due**: Paiement échoué → webhook → status past_due → email relance → retry auto 3 jours
- **cancel_at_period_end**: Client annule le 15 → active jusqu'au 30 → cancelled le 31
- **Versioning**: Client sur plan Basic v1 à 49€ → plan passe v2 à 59€ → client garde v1

#### Table 3: `bil_tenant_usage_metrics` - Métriques consommation

**Existant V1:**

- Metric_name en texte libre (risque erreurs)
- Metric_value simple sans unité
- Périodes en dates (pas de granularité horaire)
- Pas de distinction type période (jour/semaine/mois)
- Pas de lien avec plan/souscription

**Évolutions V2:**

```sql
CRÉER table référence types métriques:
CREATE TABLE bil_usage_metric_types (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name varchar(50) UNIQUE NOT NULL,
    * active_vehicles, active_drivers, total_trips
    * total_revenue, storage_used_mb, api_calls
    * support_tickets
  unit varchar(20) NOT NULL,
    * count, AED, USD, MB, calls
  description text
  * Documentation claire de chaque métrique
);

MODIFIER bil_tenant_usage_metrics:
REMPLACER:
- metric_name (varchar) → metric_type_id (uuid FK)
  * Référence vers table types (normalisé)
  * Évite fautes frappe et incohérences
  * Permet ajout colonnes (unité, description)

AMÉLIORER précision périodes:
- period_start (date) → period_start_ts (timestamptz)
- period_end (date) → period_end_ts (timestamptz)
  * Granularité horaire au lieu de journalière
  * Support zones horaires (critical multi-pays)
  * Permet périodes partielles précises

AJOUTER type de période:
- period_type (varchar 10) NOT NULL
  * 'day', 'week', 'month'
  * CHECK IN ('day','week','month')
  * Simplifie agrégations et requêtes
  * Permet mix plusieurs types dans table

AJOUTER contexte facturation:
- subscription_id (uuid) REFERENCES bil_tenant_subscriptions(id)
  * Lie metrics à abonnement actif
  * Facilite calcul dépassements par période

- plan_version (integer)
  * Version du plan durant cette période
  * Permet appliquer bons quotas pour calcul overage

- metric_source (varchar 20)
  * 'internal', 'api', 'import', 'calculated'
  * Traçabilité origine données

AMÉLIORER précision valeur:
- metric_value (numeric 18,2) → (numeric 20,4)
  * Plus de précision décimale
  * Support grandes valeurs (ex: revenus)

MODIFIER contrainte unique:
- (tenant_id, metric_name, period_start)
  → (tenant_id, metric_type_id, period_type, period_start_ts)
  * Plus précis avec nouveaux champs
```

**Cas d'usage des évolutions:**

- **metric_type_id**: Plus de typo "active_vehicules" vs "active_vehicles", liste contrôlée
- **Timestamps**: Période du 2025-01-15 14:30 au 2025-01-15 23:59 (changement plan en cours journée)
- **period_type**: Agrégation jour pour suivi temps réel, mois pour facturation
- **subscription_id**: Quota plan Pro = 50 véhicules, metrics période = 75 → overage 25
- **metric_source**: Valeur vient API externe → auditabilité en cas de litige
- **Précision**: Revenue 12,456.7834 AED au lieu de 12,456.78 AED

#### Table 4: `bil_tenant_invoices` - Factures SaaS

**Existant V1:**

- Invoice_number basique
- Total_amount unique sans détail
- Status limité (draft, sent, paid, overdue)
- Pas de périodes facturation
- Pas de gestion taxes/remises
- Pas de référence abonnement/PSP

**Évolutions V2:**

```sql
AJOUTER lien abonnement:
- subscription_id (uuid) NOT NULL REFERENCES bil_tenant_subscriptions(id)
  * Facture rattachée à quel abonnement
  * CASCADE si abonnement supprimé
  * Permet tracer historique facturation

AJOUTER périodes facturation:
- period_start (timestamptz) NOT NULL
- period_end (timestamptz) NOT NULL
  * Période couverte par la facture
  * Aligné sur current_period de subscription
  * Utilisé pour sélectionner metrics à facturer

DÉTAILLER montants:
- subtotal (numeric 18,2) NOT NULL
  * Montant HT (plan + overages)
  * Avant application taxes/remises

- tax_rate (numeric 5,2)
  * Taux TVA appliqué (5% UAE, 20% FR)
  * Peut varier selon pays tenant

- tax_amount (numeric 18,2)
  * Montant TVA calculé
  * subtotal × tax_rate

- total_amount reste inchangé
  * Montant TTC final
  * subtotal + tax_amount - discounts

AJOUTER gestion paiements:
- amount_paid (numeric 18,2) DEFAULT 0
  * Montant déjà réglé
  * Support paiements partiels

- amount_due (numeric 18,2) DEFAULT 0
  * Montant restant à payer
  * total_amount - amount_paid

- paid_at (timestamptz)
  * Date paiement effectif
  * NULL si impayé, renseigné par webhook PSP

ENRICHIR statuts:
- draft, sent, paid, overdue, void, uncollectible
  * void: facture annulée (erreur, remboursement)
  * uncollectible: créance irrécouvrable après relances

AJOUTER intégration PSP:
- stripe_invoice_id (varchar 255)
  * ID facture chez Stripe
  * Utilisé par webhooks pour maj statut
  * Indexé pour performance lookups

- document_url (text)
  * URL PDF facture générée
  * Stocké S3/CDN
  * Envoyé au client dans emails

MODIFIER types dates:
- invoice_date (date) → (timestamptz)
- due_date (date) → (timestamptz)
  * Précision horaire + timezone
  * Important pour dates limite paiement

MODIFIER contrainte unique:
- (tenant_id, invoice_number) WHERE deleted_at IS NULL
  → (tenant_id, invoice_number, deleted_at)
  * Permet réutilisation numéro après soft delete
```

**Cas d'usage des évolutions:**

- **Périodes**: Facture période 2025-01-01 00:00 → 2025-01-31 23:59, metrics agrégées sur cette période
- **Détail montants**: Plan 99€ + Overage 25€ = 124€ HT, TVA 5% = 6.20€ → Total 130.20€
- **Paiements partiels**: Total 500€, paiement 1 = 200€ → amount_due = 300€, status reste 'sent'
- **void**: Facture émise par erreur (mauvais montant) → void → nouvelle facture correcte
- **Stripe sync**: Webhook invoice.payment_succeeded → trouve facture via stripe_invoice_id → status = paid
- **document_url**: PDF généré et uploadé S3 → URL stockée → envoyé email avec lien téléchargement

#### Table 5: `bil_tenant_invoice_lines` - Détail lignes factures

**Existant V1:**

- Description texte libre
- Amount simple sans décomposition
- Quantity sans unit_price explicite
- Pas de typage des lignes
- Pas de référence source (plan, metric, etc.)

**Évolutions V2:**

```sql
AJOUTER typage ligne:
- line_type (varchar 30) NOT NULL
  * CHECK IN ('plan_fee', 'overage_fee', 'tax', 'discount', 'other')
  * plan_fee: abonnement fixe mensuel/annuel
  * overage_fee: dépassement quotas (véhicules, drivers, etc.)
  * tax: ligne TVA
  * discount: réduction (promo, fidélité)
  * other: frais divers

DÉCOMPOSER montant:
- unit_price (numeric 18,2) NOT NULL
  * Prix unitaire de l'élément
  * Ex: 5€ par véhicule supplémentaire

- quantity reste inchangé mais:
  * Utilisé pour calcul: amount = unit_price × quantity
  * Ex: 15 véhicules en overage × 5€ = 75€

- amount (numeric 18,2) GENERATED ALWAYS AS (unit_price * quantity) STORED
  * Calculé automatiquement
  * Évite incohérences
  * Peut aussi rester manuel pour flexibilité

AJOUTER détail taxes/remises par ligne:
- tax_rate (numeric 5,2)
  * Taux TVA ligne spécifique
  * NULL si pas taxable

- tax_amount (numeric 18,2)
  * Montant TVA ligne
  * NULL si pas taxable

- discount_amount (numeric 18,2)
  * Montant remise ligne
  * Négatif ou colonne séparée selon politique

AJOUTER traçabilité source:
- source_type (varchar 30)
  * 'billing_plan', 'usage_metric', 'manual', 'promotion'
  * Indique origine de la ligne

- source_id (uuid)
  * ID entité source
  * plan_id si plan_fee
  * metric_id si overage_fee
  * promotion_id si discount
  * NULL si manual

CRÉER indexes:
- CREATE INDEX ON bil_tenant_invoice_lines (line_type)
- CREATE INDEX ON bil_tenant_invoice_lines (source_type, source_id)
  * Accélère requêtes reporting
  * Analyse revenus par type

MODIFIER contrainte unique:
- (invoice_id, description) WHERE deleted_at IS NULL
  → (invoice_id, description, deleted_at)
  * Permet même description après delete
```

**Cas d'usage des évolutions:**

- **Typage**: Facture avec 1 ligne plan_fee (99€), 2 lignes overage_fee (véhicules 25€, drivers 15€), 1 ligne tax (6.95€)
- **unit_price × quantity**: 15 véhicules excédentaires × 5€/véhicule = 75€
- **source**: Ligne "Overage véhicules" → source_type='usage_metric', source_id=UUID metric active_vehicles
- **discount**: Ligne "Promo BLACK FRIDAY -20%" → discount_amount = -19.80€ → réduit subtotal
- **tax par ligne**: Service A taxable 20%, Service B exonéré → tax_rate différent par ligne
- **Reporting**: SELECT SUM(amount) WHERE line_type='overage_fee' → revenus totaux overages

#### Table 6: `bil_payment_methods` - Moyens de paiement

**Existant V1:**

- Payment_type limité (card, bank, paypal)
- Provider_token générique sans distinction PSP
- Contrainte mono-méthode par type (1 seule carte active)
- Pas de notion "par défaut"
- Données carte non structurées (tout dans metadata)
- Pas de champ last_used

**Évolutions V2:**

```sql
AJOUTER identification PSP:
- provider (varchar 50) NOT NULL
  * 'stripe', 'adyen', 'paypal', 'checkout', etc.
  * Permet multi-PSP simultanés
  * Routage paiements selon provider

RENOMMER pour clarté:
- provider_token → provider_payment_method_id (text NOT NULL)
  * Plus explicite: c'est l'ID method côté PSP
  * Ex: pm_1234567890 (Stripe), pmt_abc123 (Adyen)

AJOUTER gestion défaut:
- is_default (boolean) NOT NULL DEFAULT false
  * Un seul moyen défaut par tenant
  * Utilisé auto pour nouvelles factures
  * Contrainte: UNIQUE (tenant_id) WHERE is_default=true AND deleted_at IS NULL

ÉTENDRE types paiement:
- payment_type enrichi:
  * CHECK IN ('card', 'bank_account', 'paypal', 'apple_pay', 'google_pay', 'other')
  * Support wallets digitaux

STRUCTURER données carte:
- card_brand (varchar 50) - 'Visa', 'Mastercard', 'Amex'
- card_last4 (char 4) - Derniers 4 chiffres
- card_exp_month (integer) - Mois expiration
- card_exp_year (integer) - Année expiration
  * Séparé de metadata pour requêtes faciles
  * Affichage client: "Visa •••• 4242 exp 12/2025"
  * Alertes expiration automatiques

STRUCTURER données compte bancaire:
- bank_name (varchar 100) - Nom banque
- bank_account_last4 (char 4) - 4 derniers chiffres IBAN
- bank_country (char 2) - Code pays ISO
  * Support SEPA, virement, prélèvement

ÉTENDRE statuts:
- active, inactive, expired, failed, pending_verification
  * pending_verification: vérification micro-dépôts en cours
  * failed: tentative utilisation échouée
  * expired: carte expirée (contrôle auto)

AJOUTER tracking usage:
- last_used_at (timestamptz)
  * Date dernière utilisation réussie
  * Identifier méthodes obsolètes
  * Proposer suppression si > 6 mois

MODIFIER contraintes:
SUPPRIMER:
- UNIQUE (tenant_id, payment_type) WHERE deleted_at IS NULL
  * Autorise multiples cartes, comptes

AJOUTER:
- UNIQUE (tenant_id) WHERE is_default=true AND deleted_at IS NULL
  * Un seul défaut par tenant

- UNIQUE (tenant_id, provider_payment_method_id) WHERE deleted_at IS NULL
  * Évite doublons même méthode

CRÉER indexes:
- CREATE INDEX ON bil_payment_methods (tenant_id, status) WHERE deleted_at IS NULL
- CREATE INDEX ON bil_payment_methods (expires_at) WHERE deleted_at IS NULL
  * Requêtes cartes expirant bientôt
```

**Cas d'usage des évolutions:**

- **Multi-cartes**: Tenant a Visa corporate + Mastercard backup → les deux actives, Visa en default
- **Multi-PSP**: Carte UAE via Stripe, carte FR via Adyen → provider différent
- **Affichage**: Client voit "Visa •••• 4242 (défaut)" et "Mastercard •••• 8888"
- **Expiration**: Cron daily vérifie card_exp_year/month → alerte 30j avant → email "renouveler carte"
- **failed**: Paiement échoué → status=failed → essai autre méthode active
- **last_used_at**: Carte non utilisée depuis 12 mois → suggestion suppression → sécurité
- **bank_account**: Client FR SEPA → bank_name="BNP Paribas", bank_country="FR", last4="5678"

---

## NOUVELLES TABLES À CRÉER - DOMAINE BILLING

### Tables complémentaires pour V2 complète

#### `bil_usage_metric_types` - Types métriques normalisés

**Rôle:** Référentiel centralisé des métriques autorisées

```sql
CREATE TABLE bil_usage_metric_types (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name varchar(50) UNIQUE NOT NULL,
    -- active_vehicles, active_drivers, total_trips, etc.
  unit varchar(20) NOT NULL,
    -- count, AED, USD, EUR, MB, calls
  description text,
    -- Documentation métrique
  aggregation_method varchar(20) NOT NULL,
    -- sum, max, avg, last
    -- Détermine comment agréger sur période
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Pré-remplir avec métriques standard
INSERT INTO bil_usage_metric_types (name, unit, aggregation_method) VALUES
  ('active_vehicles', 'count', 'max'),
  ('active_drivers', 'count', 'max'),
  ('total_trips', 'count', 'sum'),
  ('total_revenue', 'AED', 'sum'),
  ('storage_used_mb', 'MB', 'max'),
  ('api_calls', 'calls', 'sum'),
  ('support_tickets', 'count', 'sum');
```

**Bénéfices:**

- Liste contrôlée, pas de typos
- Unité explicite (count, currency, data)
- Méthode agrégation documentée
- Extensible facilement (nouvelles métriques)

#### `bil_plan_features` - Features normalisées (optionnel)

**Alternative au JSON features dans bil_billing_plans**

```sql
CREATE TABLE bil_plan_features (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  plan_id uuid NOT NULL REFERENCES bil_billing_plans(id) ON DELETE CASCADE,
  feature_key varchar(100) NOT NULL,
    -- wps_integration, advanced_analytics, priority_support, etc.
  enabled boolean NOT NULL DEFAULT true,
  limits jsonb,
    -- {"max_reports": 50, "retention_days": 90}
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (plan_id, feature_key)
);

CREATE INDEX ON bil_plan_features (plan_id);
CREATE INDEX ON bil_plan_features (feature_key);
```

**Bénéfices:**

- Features normalisées (table séparée)
- Requêtes faciles: "plans avec WPS"
- Limites par feature documentées
- Alternative si JSON features trop libre

#### `bil_promotions` - Codes promo et remises (futur)

```sql
CREATE TABLE bil_promotions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  code varchar(50) UNIQUE NOT NULL,
    -- BLACK_FRIDAY_2025
  description text,
  discount_type varchar(20) NOT NULL,
    -- percentage, fixed_amount
    -- CHECK IN ('percentage', 'fixed_amount')
  discount_value numeric(10,2) NOT NULL,
    -- 20 (pour 20%) ou 50 (pour 50€)
  currency char(3),
    -- NULL si percentage, requis si fixed_amount
  max_redemptions integer,
    -- Nombre max utilisations
  redemptions_count integer DEFAULT 0,
  valid_from timestamptz NOT NULL,
  valid_until timestamptz NOT NULL,
  applies_to varchar(20) NOT NULL,
    -- first_invoice, all_invoices, specific_plan
    -- CHECK IN ('first_invoice', 'all_invoices', 'specific_plan')
  plan_id uuid REFERENCES bil_billing_plans(id),
    -- Si applies_to = specific_plan
  status varchar(20) NOT NULL DEFAULT 'active',
    -- CHECK IN ('active', 'expired', 'exhausted', 'disabled')
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES adm_provider_employees(id)
);

CREATE INDEX ON bil_promotions (code);
CREATE INDEX ON bil_promotions (valid_from, valid_until);
CREATE INDEX ON bil_promotions (status);
```

#### `bil_promotion_usage` - Utilisation codes promo

```sql
CREATE TABLE bil_promotion_usage (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  promotion_id uuid NOT NULL REFERENCES bil_promotions(id),
  tenant_id uuid NOT NULL REFERENCES adm_tenants(id),
  invoice_id uuid REFERENCES bil_tenant_invoices(id),
    -- NULL si code appliqué à subscription mais pas encore facturé
  applied_at timestamptz NOT NULL DEFAULT now(),
  discount_amount numeric(18,2) NOT NULL,
    -- Montant remise effectivement appliquée
  UNIQUE (promotion_id, tenant_id, invoice_id)
);

CREATE INDEX ON bil_promotion_usage (promotion_id);
CREATE INDEX ON bil_promotion_usage (tenant_id);
```

---

## NOUVELLES TABLES À CRÉER - DOMAINE ADMINISTRATION

### Tables complémentaires pour V2 complète

#### `adm_role_permissions` - Permissions granulaires

```sql
CREATE TABLE adm_role_permissions (
  id uuid PRIMARY KEY,
  role_id uuid REFERENCES adm_roles(id),
  resource varchar(100), -- vehicles, drivers, revenues
  action varchar(50), -- create, read, update, delete, export
  conditions jsonb, -- {"own_only": true, "max_amount": 1000}
  created_at timestamp DEFAULT now()
);
```

#### `adm_role_versions` - Historique rôles

```sql
CREATE TABLE adm_role_versions (
  id uuid PRIMARY KEY,
  role_id uuid REFERENCES adm_roles(id),
  version_number integer,
  permissions_snapshot jsonb,
  changed_by uuid,
  change_reason text,
  created_at timestamp DEFAULT now()
);
```

#### `adm_member_sessions` - Sessions actives

```sql
CREATE TABLE adm_member_sessions (
  id uuid PRIMARY KEY,
  member_id uuid REFERENCES adm_members(id),
  token_hash varchar(256),
  ip_address inet,
  user_agent text,
  expires_at timestamp,
  revoked_at timestamp,
  created_at timestamp DEFAULT now()
);
```

#### `adm_tenant_settings` - Configuration avancée

```sql
CREATE TABLE adm_tenant_settings (
  id uuid PRIMARY KEY,
  tenant_id uuid REFERENCES adm_tenants(id),
  setting_key varchar(100),
  setting_value jsonb,
  category varchar(50),
  is_encrypted boolean DEFAULT false,
  updated_at timestamp DEFAULT now()
);
```

---

## DÉPENDANCES CRITIQUES - MODULES ADMINISTRATION + BILLING

### Ordre d'implémentation obligatoire

#### Phase 0 - Corrections critiques (IMMÉDIAT)

**Administration:**

1. **adm_tenants** : Ajouter status + contact fields
2. **adm_provider_employees** : Créer table complète
3. **adm_tenant_lifecycle_events** : Créer avec tous event types (inclure billing events)
4. **adm_invitations** : Créer pour onboarding

**Billing:** 5. **bil_billing_plans** : Ajouter plan*code, quotas, version, stripe_ids 6. **bil_usage_metric_types** : Créer table référentiel 7. **bil_payment_methods** : Ajouter provider, is_default, card*\_/bank\_\_ fields

#### Phase 1 - Sécurité, RBAC et Facturation de base (Semaine 1)

**Administration:** 8. **adm_members** : Ajouter 2FA et vérifications 9. **adm_roles** : Ajouter slug et hiérarchie 10. **adm_role_permissions** : Créer table 11. **adm_member_roles** : Ajouter contexte temporel

**Billing:** 12. **bil_tenant_subscriptions** : Ajouter cycle, périodes, provider*\*, statuts enrichis 13. **bil_tenant_invoices** : Ajouter subscription_id, périodes, montants détaillés, stripe_id 14. **bil_tenant_invoice_lines** : Ajouter line_type, unit_price, tax*\_, source\_\_

#### Phase 2 - Audit, conformité et Metrics (Semaine 2)

**Administration:** 15. **adm_audit_logs** : Enrichir avec catégories 16. **adm_role_versions** : Créer historique 17. **adm_member_sessions** : Tracking sessions 18. **adm_tenant_settings** : Configuration flexible

**Billing:** 19. **bil_tenant_usage_metrics** : Ajouter metric_type_id, period_type, subscription_id, timestamps 20. **bil_promotions** + **bil_promotion_usage** : Créer tables (optionnel, peut être Phase 3)

---

## MÉTRIQUES DE VALIDATION - ADMINISTRATION + BILLING

### Techniques Administration

- [ ] 8 tables Administration opérationnelles
- [ ] RLS unifié sur toutes tables tenant
- [ ] 2FA actif pour rôles sensibles
- [ ] Audit trail complet et immuable
- [ ] Invitations avec expiration 72h

### Techniques Billing

- [ ] 6 tables Billing opérationnelles
- [ ] Référentiel metric_types créé et rempli
- [ ] Plan avec quotas, version, stripe_ids
- [ ] Subscription avec périodes et provider\_\*
- [ ] Invoice avec détail taxes/montants
- [ ] Invoice_lines typées (plan_fee, overage_fee, tax)
- [ ] Payment_methods multi-PSP avec is_default

### Fonctionnelles Administration

- [ ] Onboarding < 5 minutes
- [ ] Support cross-tenant fonctionnel
- [ ] Historique complet des changements
- [ ] RBAC granulaire par ressource
- [ ] Conformité RGPD (retention, audit)

### Fonctionnelles Billing

- [ ] Facturation automatique mensuelle/annuelle
- [ ] Calcul overages basé quotas plan
- [ ] Gestion période essai (trial)
- [ ] Multi-PSP (Stripe + autres)
- [ ] Webhooks PSP → màj statuts invoices/subscriptions
- [ ] Génération invoice_lines détaillées
- [ ] Support paiements partiels
- [ ] Alertes expiration cartes
- [ ] Versioning plans (évolutions tarifaires)
- [ ] Multi-devises (AED, USD, EUR)

### Sécurité Billing

- [ ] 0 numéro carte stocké (tokenisation)
- [ ] PCI-DSS compliant (provider_payment_method_id uniquement)
- [ ] Encryption provider_tokens
- [ ] Logs audit sur payment_methods
- [ ] RLS strict tenant_id

---

## IMPACT INTER-MODULES - ADMINISTRATION ↔ BILLING

### Administration → Billing

1. **adm_tenants.status** → **bil_tenant_subscriptions.status**
   - Tenant suspendu → subscription auto-suspendue
   - Tenant cancelled → subscription cancelled
   - Synchronisation bidirectionnelle

2. **adm_tenant_lifecycle_events** ← **Billing events**
   - Nouveaux event_types billing: invoice_sent, invoice_paid, invoice_overdue, invoice_void
   - Plan changé → event plan_upgraded/downgraded
   - Suspension impayés → event suspended avec reason="past_due"

3. **adm_audit_logs** ← **Billing actions**
   - Changement plan → audit log
   - Ajout payment_method → audit log
   - Génération invoice → audit log
   - Catégorie: 'financial'

4. **adm_provider_employees** → **Billing operations**
   - created_by / updated_by sur:
     - bil_billing_plans (création plans)
     - bil_tenant_invoices (ajustements manuels)
     - bil_payment_methods (support aide client)

### Billing → Administration

1. **bil_tenant_subscriptions.status = past_due** → **adm_tenants.status = suspended**
   - Webhook paiement échoué 3 fois → suspension tenant
   - adm_tenant_lifecycle_events créé

2. **bil_tenant_invoices.paid_at** → **adm_tenants réactivation**
   - Facture payée → si tenant suspended → reactivate
   - adm_tenant_lifecycle_events créé

3. **bil_billing_plans versioning** → **adm_tenants.metadata.feature_flags**
   - Upgrade plan → features débloquées
   - Downgrade plan → features bloquées
   - Metadata tenant màj

### Dépendances autres modules

**Billing → Finance:**

- bil_tenant_invoices ↔ fin_transactions (enregistrement paiements)
- bil_payment_methods.last_used_at màj lors transaction

**Billing → Documents:**

- bil_tenant_invoices.document_url → doc_documents (stockage PDF)
- Génération PDF facture → upload S3 → URL stockée

**Billing → CRM:**

- crm_contracts.signed → création bil_tenant_subscriptions
- crm_opportunities.plan_interest → bil_billing_plans suggérés

**Billing → Support:**

- bil_tenant_invoices overdue → sup_tickets auto-créés
- bil_payment_methods failed → ticket support assigné

---

## WORKFLOWS CRITIQUES BILLING

### 1. Workflow création abonnement

```
Trigger: crm_contracts signé OU tenant manuel

1. Vérifier bil_billing_plans (plan choisi existe, active)
2. Créer bil_tenant_subscriptions:
   - status = trialing
   - trial_end = now() + 14 days
   - billing_cycle = monthly ou yearly
   - current_period_start = now()
   - current_period_end = now() + 1 month
   - provider = 'stripe'
3. Créer customer chez PSP (Stripe)
4. Màj subscription.provider_customer_id
5. Créer subscription chez PSP
6. Màj subscription.provider_subscription_id
7. Créer adm_tenant_lifecycle_events:
   - event_type = trial_started
   - reason = "New customer signup"
8. Envoyer email bienvenue avec trial info
9. Scheduler tâche fin trial (trial_end date)
```

### 2. Workflow fin période essai

```
Trigger: Scheduler daily vérifie trial_end <= now()

1. Lire bil_tenant_subscriptions WHERE status=trialing AND trial_end <= now()
2. Pour chaque subscription:
   a. Vérifier bil_payment_methods (tenant a méthode active)
   b. Si OUI:
      - Générer première facture (workflow 3)
      - Tenter paiement via PSP
      - Si succès: status = active
      - Si échec: status = past_due, email relance
   c. Si NON:
      - status = suspended
      - adm_tenants.status = suspended
      - Email "ajouter moyen paiement"
3. Créer adm_tenant_lifecycle_events
   - event_type = activated OU suspended
```

### 3. Workflow génération facture mensuelle

```
Trigger: Scheduler daily vérifie subscriptions.current_period_end <= now()

1. Lire bil_tenant_subscriptions WHERE status=active AND current_period_end <= now()
2. Pour chaque subscription:
   a. Lire bil_billing_plans pour quotas
   b. Lire bil_tenant_usage_metrics période:
      - WHERE period_start >= current_period_start
      - AND period_end <= current_period_end
      - Grouper par metric_type_id
   c. Créer bil_tenant_invoices:
      - invoice_number = généré (INV-2025-01-0001)
      - subscription_id = subscription.id
      - period_start/end = current_period dates
      - due_date = invoice_date + 7 days
   d. Créer bil_tenant_invoice_lines:
      - Ligne 1 (plan_fee):
        * description = "Plan {plan_name} - {period}"
        * line_type = plan_fee
        * unit_price = plan.price_monthly ou price_yearly
        * quantity = 1
        * source_type = billing_plan, source_id = plan.id
      - Lignes overages (SI metrics > quotas):
        * Pour chaque metric > quota:
          - description = "Overage {metric_name} - {delta} units"
          - line_type = overage_fee
          - unit_price = plan.overage_rate_{metric}
          - quantity = delta (metrics - quota)
          - source_type = usage_metric, source_id = metric.id
      - Ligne taxe:
        * description = "TVA {tax_rate}%"
        * line_type = tax
        * unit_price = subtotal
        * quantity = tax_rate / 100
   e. Calculer invoice.subtotal (somme lines où type != tax)
   f. Calculer invoice.tax_amount
   g. Calculer invoice.total_amount
   h. Créer invoice chez PSP (Stripe)
   i. Màj invoice.stripe_invoice_id
   j. Envoyer invoice via PSP → email client
   k. Màj invoice.status = sent
   l. Màj subscription.current_period_start = end
   m. Màj subscription.current_period_end = end + 1 month/year
3. Créer adm_tenant_lifecycle_events (event_type = invoice_sent)
```

### 4. Workflow paiement facture (webhook PSP)

```
Trigger: Webhook PSP "invoice.payment_succeeded"

1. Parser webhook payload:
   - Extraire stripe_invoice_id
   - Extraire amount_paid
   - Extraire paid_date
2. Trouver bil_tenant_invoices WHERE stripe_invoice_id = payload.id
3. Si trouvé:
   a. Màj invoice:
      - status = paid
      - paid_at = payload.paid_date
      - amount_paid = payload.amount_paid
      - amount_due = 0
   b. Si tenant était suspended:
      - Màj adm_tenants.status = active
      - Màj bil_tenant_subscriptions.status = active
      - Créer adm_tenant_lifecycle_events (reactivated)
   c. Envoyer email reçu paiement
   d. Màj bil_payment_methods.last_used_at = now()
4. Créer adm_tenant_lifecycle_events (invoice_paid)
5. Créer adm_audit_logs (category=financial, severity=info)
```

### 5. Workflow échec paiement (webhook PSP)

```
Trigger: Webhook PSP "invoice.payment_failed"

1. Parser webhook payload
2. Trouver bil_tenant_invoices WHERE stripe_invoice_id = payload.id
3. Si trouvé:
   a. Incrémenter retry_count (dans metadata)
   b. Si retry_count < 3:
      - Garder status = sent
      - Programmer retry automatique J+3
      - Email relance "paiement échoué, retry prévu"
   c. Si retry_count >= 3:
      - Màj invoice.status = overdue
      - Màj subscription.status = past_due
      - Màj adm_tenants.status = suspended
      - Email "compte suspendu, paiement urgent"
      - Créer sup_tickets (support follow-up)
4. Màj bil_payment_methods.status = failed (si même méthode)
5. Créer adm_tenant_lifecycle_events (suspended si retry=3)
6. Créer adm_audit_logs
```

### 6. Workflow changement plan (upgrade/downgrade)

```
Trigger: Client change plan dans UI OU API

1. Valider:
   - Nouveau plan existe et active
   - Tenant a subscription active
2. Lire subscription actuelle
3. Calculer proration:
   - Jours restants période = (current_period_end - now()) / total_days_period
   - Crédit ancien plan = old_plan.price × jours_restants
   - Débit nouveau plan = new_plan.price × jours_restants
   - Delta = new - old
4. Si upgrade (delta > 0):
   - Générer invoice immédiate avec delta
   - Appliquer quotas nouveaux immédiatement
   - Màj features dans adm_tenants.metadata
5. Si downgrade (delta < 0):
   - Crédit stocké, appliqué facture suivante
   - Quotas baissés à fin période courante
   - Features désactivées à fin période
6. Màj bil_tenant_subscriptions:
   - previous_plan_id = old plan
   - plan_id = new plan
   - plan_version = new plan version
7. Màj chez PSP (Stripe)
8. Créer adm_tenant_lifecycle_events:
   - event_type = plan_upgraded OU plan_downgraded
   - previous_plan_id, new_plan_id renseignés
9. Email confirmation changement
```

### 7. Workflow ajout moyen paiement

```
Trigger: Client ajoute carte/compte dans UI

1. Créer payment_method chez PSP:
   - Stripe.js frontend tokenize card
   - Backend reçoit token sécurisé
   - Créer PaymentMethod chez Stripe
2. Créer bil_payment_methods:
   - provider = 'stripe'
   - provider_payment_method_id = pm_xxx
   - payment_type détecté (card, bank_account)
   - card_brand, card_last4, card_exp extrait metadata PSP
   - status = active OU pending_verification (si bank)
   - is_default = true si premier, false sinon
3. Si is_default = true:
   - Màj ancienne méthode.is_default = false
4. Attacher PaymentMethod au Customer Stripe
5. Si subscription existe:
   - Màj subscription.payment_method_id = new method
   - Màj default payment method chez PSP
6. Email confirmation "nouveau moyen ajouté"
7. Créer adm_audit_logs (category=financial)
```

---

**Document complété avec les 6 tables Billing documentées**  
**Même niveau de détail que Administration**  
**Workflows critiques inter-modules documentés**  
**Prochaine étape:** Implémenter les évolutions prioritaires P0
