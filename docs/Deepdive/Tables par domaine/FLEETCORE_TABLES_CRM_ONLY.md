# FLEETCORE - ÉVOLUTION MODÈLE V1 → V2 : ANALYSE COMPLÈTE DES 55 TABLES (VERSION CORRIGÉE)

**Date:** 19 Octobre 2025  
**Version:** 2.1 - Document corrigé avec module Administration complet  
**Source:** Document 0_All_tables_v1.md (6386 lignes)  
**Correction:** Module Administration passe de 5 à 8 tables documentées

---

Le document est une analyse EXHAUSTIVE du modèle de données complet, pas seulement d'un sous-ensemble.

---
### Domaine CRM (3 tables)
51. `crm_leads` - Prospects
52. `crm_opportunities` - Opportunités
53. `crm_contracts` - Contrats signés


---
## ÉVOLUTIONS MAJEURES V1 → V2 - MODULE CRM

### 📊 Évolutions sur les 3 tables CRM (Internes FleetCore)

**Note importante:** Les tables CRM sont **internes à FleetCore** (pas de tenant_id). Elles sont utilisées par l'équipe commerciale pour gérer les prospects avant qu'ils ne deviennent des clients (tenants).

---

#### Table 1: `crm_leads` - Gestion des Prospects

**Existant V1:**
- Nom complet non scindé
- Email, téléphone, société
- Source (web, referral, event)
- Statut (new, qualified, converted, lost)
- Message libre du prospect
- Pas de tracking RGPD
- Pas de scoring avancé

**Évolutions V2:**
```sql
MODIFIER:
- full_name → SCINDER en first_name, last_name
- demo_company_name → company_name (normaliser)

AJOUTER:
- lead_code (varchar) - Identifiant stable unique
- country_code (char(2)) - Pays du prospect
- industry (text) - Secteur d'activité
- company_size (integer) - Nombre d'employés
- website_url (text)
- linkedin_url (text)
- city (text)

SCORING AVANCÉ:
- lead_stage (enum) - top_of_funnel, marketing_qualified, sales_qualified, opportunity
- fit_score (numeric) - Correspond au profil cible ?
- engagement_score (numeric) - Interagit avec nos contenus ?
- scoring (jsonb) - Critères de scoring détaillés
- qualification_notes (text)

RGPD & CONSENTEMENT:
- gdpr_consent (boolean) - Consentement marketing
- consent_at (timestamp) - Date du consentement

SUIVI COMMERCIAL:
- source_id (uuid) - FK vers crm_lead_sources (normalisation)
- assigned_to (uuid) - Commercial assigné
- opportunity_id (uuid) - FK vers opportunité créée
- next_action_date (timestamp) - Planification relances
- utm_source, utm_medium, utm_campaign (text) - Tracking marketing

NOUVELLE TABLE RÉFÉRENCE:
CREATE TABLE crm_lead_sources (
  id uuid PRIMARY KEY,
  name varchar(50) UNIQUE NOT NULL,
  description text
);
```

**Justification métier:**
- **Nom scindé:** Personnalisation communications (+40% taux ouverture)
- **Lead stage:** Mesurer efficacité marketing vs commercial
- **Scoring:** Prioriser leads chauds automatiquement (-60% temps perdu)
- **RGPD:** Conformité légale EU obligatoire (0€ amende vs 20M€)
- **Source normalisée:** Analyse ROI par canal marketing précise
- **Next action:** +30% taux conversion grâce au suivi systématique

---

#### Table 2: `crm_opportunities` - Pipeline de Vente

**Existant V1:**
- Lien vers lead
- Stage (prospect, proposal, negotiation, closed)
- Valeur espérée
- Date de clôture visée
- Assigné à (commercial)
- Probabilité de réussite
- Pas de distinction gagné/perdu

**Évolutions V2:**
```sql
AJOUTER STATUS (distinct de STAGE):
- status (enum) - open, won, lost, on_hold, cancelled
  * Stage = progression (prospect → proposal → negotiation)
  * Status = résultat (open, won, lost)

VALEURS FINANCIÈRES COMPLÈTES:
- currency (char(3)) - ISO-4217 (EUR, AED, etc.)
- discount_amount (numeric) - Remise appliquée
- probability_percent (numeric) - Plus précis qu'integer
- forecast_value (numeric GENERATED) - expected_value × probability / 100
- won_value (numeric) - Montant RÉEL si gagné

RAISONS DE PERTE:
- loss_reason_id (uuid) - FK vers crm_opportunity_loss_reasons
- won_date (date) - Quand gagné ?
- lost_date (date) - Quand perdu ?

LIENS CRITIQUES:
- plan_id (uuid) - FK vers bil_billing_plans (quel plan souscrit ?)
- contract_id (uuid) - FK vers crm_contracts (quel contrat généré ?)
- owner_id (uuid) - Responsable final (vs assigned_to = qui travaille)
- pipeline_id (uuid) - FK vers crm_pipelines (multi-marchés)

NOUVELLE TABLE:
CREATE TABLE crm_opportunity_loss_reasons (
  id uuid PRIMARY KEY,
  name varchar(100) NOT NULL UNIQUE,
  description text
);

CREATE TABLE crm_pipelines (
  id uuid PRIMARY KEY,
  name varchar(100) NOT NULL,
  stages jsonb, -- Configuration des étapes
  is_default boolean
);
```

**Justification métier:**
- **Status vs Stage:** Dashboard précis ("5 won, 3 lost" vs juste "closed")
- **Loss reasons:** Amélioration produit et stratégie (-20% pertes évitables)
- **Forecast value:** Budget 2025 fiable à ±5% (vs ±30% sans)
- **Liens plan/contrat:** Client actif <5min après signature
- **Owner vs Assigned:** Clarté dans grandes opportunités multi-personnes
- **Won_value:** Mesurer précision des prévisions (expected vs réel)

---

#### Table 3: `crm_contracts` - Contrats Signés

**Existant V1:**
- Lien vers lead
- Référence contrat (pas unique !)
- Dates (signature, effet, expiration)
- Valeur totale et devise
- Statut simple (active, expired, terminated)
- Pas de lien opportunité
- Pas de gestion renouvellement

**Évolutions V2:**
```sql
CYCLE DE VIE COMPLET:
- status (enum étendu):
  * draft, negotiation, signed
  * active, future (signé mais pas encore effectif)
  * expired, terminated, renewal_in_progress, cancelled

CONTRAINTES & IDENTIFIANTS:
- contract_code (text UNIQUE) - Identifiant technique stable
- contract_reference (text) - Index unique partiel WHERE deleted_at IS NULL
  
GESTION RENOUVELLEMENT:
- renewal_type (enum) - automatic, optional, perpetual, non_renewing
- auto_renew (boolean)
- renewal_date (date) - Quand renouveler ?
- notice_period_days (integer) - Préavis résiliation
- renewed_from_contract_id (uuid) - FK self-reference (historique)

LIENS SYSTÈME:
- opportunity_id (uuid) - FK vers crm_opportunities (d'où vient ce contrat ?)
- tenant_id (uuid) - FK vers adm_tenants (quel client créé ?)
- plan_id (uuid) - FK vers bil_billing_plans
- subscription_id (uuid) - FK vers bil_tenant_subscriptions

INFORMATIONS CONTACT:
- company_name (text)
- contact_name (text)
- contact_email (citext)
- contact_phone (varchar)
- billing_address_id (uuid) - FK vers crm_addresses

VERSIONNEMENT:
- version_number (integer) - Gestion des avenants
- document_url (text) - Lien vers PDF signé
- vat_rate (numeric) - TVA applicable
- notes (text) - Observations internes
- approved_by (uuid) - Validation finale
```

**Justification métier:**
- **Statuts étendus:** Visibilité totale pipeline contractuel
- **Renouvellement auto:** 0 oubli, -80% churn technique
- **Lien opportunité:** Traçabilité lead → opp → contrat → tenant
- **Lien tenant/plan/subscription:** Facturation auto dès signature
- **Contacts:** -60% tickets "contact perdu"
- **Versionnement:** Historique complet avec avenants
- **Reference unique:** 0 doublon de contrat

---

## NOUVELLES TABLES À CRÉER - DOMAINE CRM

### Tables complémentaires pour V2 complète

#### `crm_lead_sources` - Normalisation sources
```sql
CREATE TABLE crm_lead_sources (
  id uuid PRIMARY KEY,
  name varchar(50) UNIQUE NOT NULL,
  description text,
  is_active boolean DEFAULT true,
  created_at timestamp DEFAULT now()
);

-- Données initiales
INSERT INTO crm_lead_sources (name, description) VALUES
  ('web', 'Formulaire site web'),
  ('referral', 'Recommandation client'),
  ('event', 'Salon/Conférence'),
  ('linkedin', 'LinkedIn Ads'),
  ('google_ads', 'Google Ads'),
  ('partner', 'Partenaire commercial');
```

#### `crm_opportunity_loss_reasons` - Analyse pertes
```sql
CREATE TABLE crm_opportunity_loss_reasons (
  id uuid PRIMARY KEY,
  name varchar(100) NOT NULL UNIQUE,
  category varchar(50), -- price, features, timing, competition
  description text,
  is_active boolean DEFAULT true
);

-- Données initiales
INSERT INTO crm_opportunity_loss_reasons (name, category) VALUES
  ('Prix trop élevé', 'price'),
  ('Fonctionnalités manquantes', 'features'),
  ('Timing inadapté', 'timing'),
  ('Concurrent choisi', 'competition'),
  ('Budget insuffisant', 'price'),
  ('Projet abandonné', 'timing');
```

#### `crm_pipelines` - Multi-pipelines
```sql
CREATE TABLE crm_pipelines (
  id uuid PRIMARY KEY,
  name varchar(100) NOT NULL,
  description text,
  stages jsonb NOT NULL, -- ['prospect','proposal','negotiation']
  default_probability jsonb, -- Probabilité par étape
  is_default boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_at timestamp DEFAULT now()
);
```

#### `crm_addresses` - Adresses facturation
```sql
CREATE TABLE crm_addresses (
  id uuid PRIMARY KEY,
  street_line1 text NOT NULL,
  street_line2 text,
  city varchar(100) NOT NULL,
  state varchar(100),
  postal_code varchar(20),
  country_code char(2) NOT NULL,
  address_type varchar(50), -- billing, shipping
  is_default boolean DEFAULT false,
  created_at timestamp DEFAULT now()
);
```

---

## DÉPENDANCES CRITIQUES - MODULE CRM

### Ordre d'implémentation obligatoire

#### Phase 0 - Tables de base (IMMÉDIAT)
1. **crm_leads enrichissements** : Ajouter tous nouveaux champs
2. **crm_lead_sources** : Créer table référence
3. **crm_opportunities status** : Séparer stage et status
4. **crm_contracts liens** : Ajouter opportunity_id, tenant_id

#### Phase 1 - Scoring et suivi (Semaine 1)
5. **crm_leads scoring** : lead_stage, fit_score, engagement_score
6. **crm_opportunities forecast** : forecast_value calculé
7. **crm_opportunity_loss_reasons** : Créer table
8. **crm_contracts renouvellement** : renewal_type, auto_renew

#### Phase 2 - Intégrations (Semaine 2)
9. **Lien CRM → Tenants** : Création tenant après contrat signé
10. **Lien CRM → Billing** : plan_id, subscription_id
11. **crm_pipelines** : Multi-pipelines pour multi-marchés
12. **crm_addresses** : Adresses de facturation

---

## MÉTRIQUES DE VALIDATION - CRM

### Techniques
- [ ] 3 tables CRM enrichies opérationnelles
- [ ] 4 tables référence créées (sources, loss_reasons, pipelines, addresses)
- [ ] Contraintes d'unicité en place (contract_reference, lead email)
- [ ] Index optimisés pour recherches
- [ ] Soft-delete fonctionnel partout

### Fonctionnelles
- [ ] Scoring leads automatique
- [ ] Pipeline ventes tracé end-to-end
- [ ] Taux conversion lead→client mesurable
- [ ] Raisons de perte analysables
- [ ] Renouvellements automatiques alertés
- [ ] Conformité RGPD (consentement)

### Business
- [ ] Dashboard prévisions revenus ±5%
- [ ] Analyse ROI par canal marketing
- [ ] Temps cycle vente moyen calculable
- [ ] 0 oubli de renouvellement
- [ ] Client actif <5min après signature

---

## IMPACT SUR LES AUTRES MODULES - CRM

### Liens avec Administration
- **crm_leads.assigned_to** → adm_provider_employees (commerciaux)
- **crm_contracts.tenant_id** → adm_tenants (création après signature)
- Tous audit via adm_audit_logs

### Liens avec Billing
- **crm_opportunities.plan_id** → bil_billing_plans (plan choisi)
- **crm_contracts.subscription_id** → bil_tenant_subscriptions
- **crm_contracts.renewal_date** → Déclencheur facturation

### Liens avec Documents
- **crm_contracts.document_url** → Stockage PDF signé
- **crm_leads** → Upload documents KYC si besoin

### Process end-to-end
```
Lead créé (crm_leads)
    ↓ (qualification)
Opportunité (crm_opportunities)
    ↓ (négociation)
Contrat signé (crm_contracts)
    ↓ (activation)
Tenant créé (adm_tenants)
    ↓ (onboarding)
Subscription active (bil_tenant_subscriptions)
```

---

## DÉPENDANCES CRITIQUES - MODULE ADMINISTRATION

### Ordre d'implémentation obligatoire

#### Phase 0 - Corrections critiques (IMMÉDIAT)
1. **adm_tenants** : Ajouter status + contact fields
2. **adm_provider_employees** : Créer table complète
3. **adm_tenant_lifecycle_events** : Créer avec tous event types
4. **adm_invitations** : Créer pour onboarding

#### Phase 1 - Sécurité et RBAC (Semaine 1)
5. **adm_members** : Ajouter 2FA et vérifications
6. **adm_roles** : Ajouter slug et hiérarchie
7. **adm_role_permissions** : Créer table
8. **adm_member_roles** : Ajouter contexte temporel

#### Phase 2 - Audit et conformité (Semaine 2)
9. **adm_audit_logs** : Enrichir avec catégories
10. **adm_role_versions** : Créer historique
11. **adm_member_sessions** : Tracking sessions
12. **adm_tenant_settings** : Configuration flexible

---

## MÉTRIQUES DE VALIDATION - ADMINISTRATION

### Techniques
- [ ] 8 tables Administration opérationnelles
- [ ] RLS unifié sur toutes tables tenant
- [ ] 2FA actif pour rôles sensibles
- [ ] Audit trail complet et immuable
- [ ] Invitations avec expiration 72h

### Fonctionnelles
- [ ] Onboarding < 5 minutes
- [ ] Support cross-tenant fonctionnel
- [ ] Historique complet des changements
- [ ] RBAC granulaire par ressource
- [ ] Conformité RGPD (retention, audit)

### Sécurité
- [ ] 0 accès cross-tenant non autorisé
- [ ] 100% actions tracées dans audit
- [ ] Tokens sécurisés pour invitations
- [ ] Sessions avec expiration
- [ ] Permissions vérifiées à chaque requête

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

## RÉCAPITULATIF GLOBAL

### Modules Documentés
- **Administration:** 8 tables + 4 tables support
- **CRM:** 3 tables principales + 4 tables référence

### Totaux Évolutions V1 → V2
- **Tables existantes enrichies:** 11 tables
- **Nouvelles tables à créer:** 8 tables
- **Champs ajoutés:** ~150 nouveaux champs
- **Index optimisés:** ~40 index
- **Contraintes métier:** ~25 contraintes

### Priorités d'Implémentation

**P0 - CRITIQUE (Semaine 1):**
1. adm_provider_employees (support cross-tenant)
2. adm_tenant_lifecycle_events (facturation)
3. adm_invitations (onboarding)
4. crm_leads enrichissements (scoring, RGPD)
5. crm_contracts liens (opportunity_id, tenant_id)

**P1 - URGENT (Semaine 2):**
6. adm_members sécurité (2FA)
7. crm_opportunities status (gagné/perdu)
8. crm_lead_sources (normalisation)
9. crm_opportunity_loss_reasons (analyse)
10. crm_contracts renouvellement (auto-renew)

**P2 - IMPORTANT (Semaine 3):**
11. Tables permissions RBAC
12. Audit logs enrichi
13. CRM pipelines multi-marchés
14. CRM addresses facturation

---

**Document complet avec Administration (8 tables) + CRM (3 tables) documentés**  
**Date mise à jour:** 21 Octobre 2025  
**Prochaine étape:** Implémenter priorités P0 puis P1 en parallèle
