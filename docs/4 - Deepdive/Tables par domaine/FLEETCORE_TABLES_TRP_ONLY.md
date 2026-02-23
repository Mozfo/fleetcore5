# FLEETCORE - ÉVOLUTION MODÈLE V1 → V2 : ANALYSE COMPLÈTE DES 55 TABLES (VERSION CORRIGÉE)

**Date:** 19 Octobre 2025  
**Version:** 2.1 - Document corrigé avec module Administration complet  
**Source:** Document 0_All_tables_v1.md (6386 lignes)  
**Correction:** Module Administration passe de 5 à 8 tables documentées

---

## LES 55 TABLES EXISTANTES ANALYSÉES (MODÈLE V1)

### Domaine Trips (4 tables)

32. `trp_platform_accounts` - Comptes platforms
33. `trp_trips` - Courses effectuées
34. `trp_settlements` - Règlements
35. `trp_client_invoices` - Factures clients

---

## ÉVOLUTIONS MAJEURES V1 → V2 - MODULE TRIPS

### 📊 Évolutions sur les 4 tables Trips

#### Table 1: `trp_platform_accounts` - Connexion sécurisée aux plateformes

**Existant V1:**

- Liaison basique tenant-plateforme
- Stockage api_key en clair
- Pas de gestion de statut
- Pas de suivi synchronisation

**Évolutions V2:**

```sql
AJOUTER:
- status (enum) - active, inactive, suspended
- connected_at (timestamp) - Date première connexion
- last_sync_at (timestamp) - Dernière synchronisation
- last_error (text) - Dernier message d'erreur
- error_count (integer) - Compteur erreurs
- sync_frequency (interval) - Fréquence sync

SÉCURITÉ:
- Chiffrer api_key ou remplacer par provider_credentials_id
- Pointer vers Vault pour stockage sécurisé
- Ne jamais exposer clés en clair dans logs

CRÉER TABLE trp_platform_account_keys:
- account_id (uuid) - FK vers trp_platform_accounts
- key_value (text) - Chiffré
- key_type (enum) - read_only, read_write, admin
- expires_at (timestamp)
- is_active (boolean)
- created_at, revoked_at
```

#### Table 2: `trp_trips` - Courses avec cycle complet

**Existant V1:**

- Données complètes de course
- Coordonnées GPS pickup/dropoff
- Calculs fare détaillés (base, distance, time)
- Surge multiplier et tips
- Platform commission et net_earnings
- Status (completed, cancelled, rejected, no_show)

**Évolutions V2:**

```sql
RENOMMER (cohérence naming):
- start_time → started_at
- end_time → finished_at

AJOUTER (cycle complet de course):
- requested_at (timestamp) - Demande initiale
- matched_at (timestamp) - Assignation driver
- accepted_at (timestamp) - Acceptation driver
- arrived_at (timestamp) - Arrivée point pickup
- started_at (timestamp) - Début course (existant renommé)
- finished_at (timestamp) - Fin course (existant renommé)

ENRICHIR métadata pour inclure:
- incentives (bonus plateforme)
- promotions (codes promo client)
- cancellation_reason (si cancelled)
- rejection_reason (si rejected)
- quality_metrics (rating, feedback)
```

#### Table 3: `trp_settlements` - Règlements multi-types

**Existant V1:**

- Settlement basique par trip
- Amount, commission, net_amount
- Status (pending, settled, cancelled)
- Settlement_date et reference

**Évolutions V2:**

```sql
AJOUTER:
- settlement_type (enum) - platform_payout, adjustment, refund, bonus
- platform_settlement_id (varchar) - Référence externe plateforme
- paid_at (timestamp) - Date paiement effectif
- cancelled_at (timestamp) - Date annulation si applicable
- reconciled (boolean) - État réconciliation
- reconciliation_id (uuid) - FK vers rev_reconciliations

MULTI-DEVISES ET TAXES:
- tax_amount (decimal) - Montant taxe/TVA
- tax_rate (decimal) - Taux appliqué
- exchange_rate (decimal) - Taux change si multi-devises
- original_currency (varchar) - Devise d'origine si conversion
- original_amount (decimal) - Montant d'origine

CRÉER INDEX:
- (platform_settlement_id) - Recherche par ref externe
- (paid_at) - Recherches temporelles
- (reconciled) WHERE reconciled = false - Optimisation
```

#### Table 4: `trp_client_invoices` - Facturation B2B avancée

**Existant V1:**

- Factures clients basiques
- Status (draft, sent, paid, cancelled, overdue)
- Total_amount, currency, dates
- Lien client_id

**Évolutions V2:**

```sql
ENRICHIR STATUS:
- Ajouter 'viewed' - Client a ouvert la facture
- Ajouter 'partially_paid' - Paiement partiel
- Ajouter 'disputed' - Litige en cours

AJOUTER CONTEXTE COMMERCIAL:
- pricing_plan_id (uuid) - Plan tarifaire appliqué
- client_po_number (varchar) - Numéro commande client
- paid_at (timestamp) - Date paiement complet
- payment_reference (varchar) - Référence transaction
- payment_method (enum) - bank_transfer, card, check, cash
- discount_amount (decimal) - Remise appliquée
- discount_reason (text) - Justification remise

CRÉER TABLE trp_client_invoice_lines:
- invoice_id (uuid) - FK vers trp_client_invoices
- line_number (integer) - Ordre ligne
- description (text) - Libellé
- trip_id (uuid) - FK vers trp_trips (nullable)
- quantity (decimal) - Nombre courses/forfait
- unit_price (decimal) - Prix unitaire
- tax_rate (decimal) - Taux TVA
- line_amount (decimal) - Montant ligne
- metadata (jsonb) - Détails additionnels

AUTOMATISATION:
- Génération automatique selon périodicité
- Agrégation trips par client et période
- Calcul automatique taxes selon pays
- Envoi email automatique
```

---

## NOUVELLES TABLES À CRÉER - DOMAINE TRIPS

### Tables complémentaires pour V2 complète

#### `trp_platform_account_keys` - Gestion multi-clés

```sql
CREATE TABLE trp_platform_account_keys (
  id uuid PRIMARY KEY,
  account_id uuid REFERENCES trp_platform_accounts(id),
  key_value text, -- Chiffré
  key_type varchar(50), -- read_only, read_write, admin
  expires_at timestamp,
  is_active boolean DEFAULT true,
  last_used_at timestamp,
  created_at timestamp DEFAULT now(),
  revoked_at timestamp,
  revoked_by uuid,
  revoke_reason text
);
```

#### `trp_client_invoice_lines` - Détail facturation

```sql
CREATE TABLE trp_client_invoice_lines (
  id uuid PRIMARY KEY,
  invoice_id uuid REFERENCES trp_client_invoices(id),
  line_number integer NOT NULL,
  description text NOT NULL,
  trip_id uuid REFERENCES trp_trips(id),
  quantity decimal(10,2) NOT NULL,
  unit_price decimal(14,2) NOT NULL,
  tax_rate decimal(5,2),
  line_amount decimal(14,2) NOT NULL,
  metadata jsonb DEFAULT '{}',
  created_at timestamp DEFAULT now()
);
```

---

## DÉPENDANCES CRITIQUES - MODULE TRIPS

### Ordre d'implémentation obligatoire

#### Phase 0 - Sécurité et stabilité (IMMÉDIAT)

1. **trp_platform_accounts.status** : Gérer activations/suspensions
2. **trp_platform_account_keys** : Rotation sécurisée des clés
3. **trp_trips timestamps** : Renommer pour cohérence
4. **trp_settlements.settlement_type** : Distinguer types règlements

#### Phase 1 - Réconciliation et reporting (Semaine 1)

5. **trp_settlements.reconciled** : État réconciliation
6. **trp_settlements taxes** : Calculs multi-pays
7. **trp_client_invoice_lines** : Détail facturation
8. **trp_trips cycle complet** : Tracking timestamps

#### Phase 2 - Automatisation (Semaine 2)

9. **Génération automatique factures** : Selon périodicité
10. **Alertes erreurs sync** : Monitoring plateformes
11. **Rotation automatique clés** : Sécurité renforcée
12. **Réconciliation automatique** : Matching settlements/revenues

---

## MÉTRIQUES DE VALIDATION - TRIPS

### Techniques

- [ ] 4 tables Trips V2 opérationnelles
- [ ] Clés API chiffrées ou dans Vault
- [ ] Timestamps cohérents (started_at, finished_at)
- [ ] Status enrichis avec tous les cas d'usage
- [ ] Indexes optimisés pour recherches

### Fonctionnelles

- [ ] Import plateformes < 5 min pour 1000 courses
- [ ] Réconciliation automatique > 95% précision
- [ ] Facturation B2B automatisée par période
- [ ] 0 clé API exposée en clair
- [ ] Rotation clés sans interruption service

### Sécurité

- [ ] 0 fuite de credentials plateforme
- [ ] Audit complet accès clés API
- [ ] Encryption at-rest pour sensitive data
- [ ] Multi-clés avec droits granulaires
- [ ] Expiration automatique clés

---

## IMPACT SUR LES AUTRES MODULES

### Dépendances entrantes

- **Tous modules** : Dépendent de tenant_id pour isolation
- **Tous modules** : Utilisent member_id pour audit
- **Finance/Revenue** : Lisent tenant status pour calculs
- **Support** : Utilise provider_employees pour assignation

### Dépendances sortantes

- **CRM** : Crée tenant après signature contrat
- **Billing** : Lit lifecycle_events pour facturation
- **Documents** : Vérifie permissions via roles
- **Tous** : Appliquent RLS via GUCs

---

**Document mis à jour avec 12 tables documentées (8 Administration + 4 Trips)**  
**Prochaine étape:** Documenter les modules restants (Directory, Fleet, Drivers, etc.)
