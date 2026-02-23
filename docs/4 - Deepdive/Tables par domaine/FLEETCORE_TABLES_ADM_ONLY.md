## LES 55 TABLES EXISTANTES ANALYSÉES (MODÈLE V1)

### ⚠️ Domaine Administration (8 tables) - CORRIGÉ

**Tables Core (5 tables)**

1. `adm_tenants` - Organisations multi-tenant avec isolation
2. `adm_members` - Utilisateurs par tenant avec authentification Clerk
3. `adm_roles` - Définition des rôles RBAC par tenant
4. `adm_member_roles` - Attribution des rôles aux membres
5. `adm_audit_logs` - Journal d'audit immuable

**Tables Support Provider (3 tables) - CRITIQUES** 6. `adm_provider_employees` - Staff FleetCore avec permissions cross-tenant 7. `adm_tenant_lifecycle_events` - Historique changements statut tenants 8. `adm_invitations` - Gestion invitations et onboarding sécurisé

---

## ÉVOLUTIONS MAJEURES V1 → V2 - MODULE ADMINISTRATION

### 📊 Évolutions sur les 8 tables Administration

#### Table 1: `adm_tenants` - Évolutions critiques

**Existant V1:**

- Structure basique multi-tenant
- Metadata non structurée
- Pas de statut explicite

**Évolutions V2:**

```sql
AJOUTER:
- status (enum) - trialing, active, suspended, past_due, cancelled
- primary_contact_email (varchar) - Pour notifications
- primary_contact_phone (varchar) - Urgences
- billing_email (varchar) - Factures
- onboarding_completed_at (timestamp)
- trial_ends_at (timestamp)
- next_invoice_date (date)

MODIFIER metadata pour inclure:
- billing_config (plan_id, billing_cycle, payment_method_id)
- feature_flags (modules activés dynamiquement)
- compliance_settings (RGPD, KYC status)
- custom_fields (spécifiques métier)
```

#### Table 2: `adm_members` - Sécurité renforcée

**Existant V1:**

- Authentification basique
- Rôle unique string
- Statut binaire

**Évolutions V2:**

```sql
AJOUTER:
- email_verified_at (timestamp) - KYC obligatoire
- two_factor_enabled (boolean) - Sécurité
- two_factor_secret (text) - Encrypted
- password_changed_at (timestamp)
- failed_login_attempts (integer)
- locked_until (timestamp)
- default_role_id (uuid) - FK vers adm_roles
- preferred_language (varchar)
- notification_preferences (jsonb)

MODIFIER status ENUM:
- invited, active, suspended, terminated
```

#### Table 3: `adm_roles` - RBAC avancé

**Existant V1:**

- Permissions JSON libre
- Pas de versioning
- Scope simple

**Évolutions V2:**

```sql
AJOUTER:
- slug (varchar) - Identifiant stable unique
- parent_role_id (uuid) - Hiérarchie
- is_system (boolean) - Rôles protégés
- is_default (boolean) - Assignation auto
- max_members (integer) - Limite
- valid_from/valid_until (timestamp)
- approval_required (boolean)

CRÉER TABLE adm_role_permissions:
- role_id (uuid)
- resource (varchar)
- action (varchar)
- conditions (jsonb)

CRÉER TABLE adm_role_versions:
- Pour historique complet
```

#### Table 4: `adm_member_roles` - Attribution flexible

**Existant V1:**

- Simple liaison M-N
- Pas de contexte

**Évolutions V2:**

```sql
AJOUTER:
- assigned_by (uuid) - Traçabilité
- assignment_reason (text)
- valid_from (timestamp)
- valid_until (timestamp)
- is_primary (boolean)
- scope_type (enum) - global, branch, team
- scope_id (uuid) - Context
- priority (integer) - Résolution conflits
```

#### Table 5: `adm_audit_logs` - Conformité renforcée

**Existant V1:**

- Logs basiques
- JSON non structuré
- Pas de classification

**Évolutions V2:**

```sql
AJOUTER:
- severity (enum) - info, warning, error, critical
- category (enum) - security, financial, compliance, operational
- session_id (uuid) - Tracking session
- request_id (uuid) - Correlation
- old_values (jsonb) - Avant modification
- new_values (jsonb) - Après modification
- retention_until (timestamp) - RGPD
- tags (text[]) - Recherche

CRÉER INDEX:
- btree (category, severity, timestamp)
- gin (tags)
```

#### Table 6: `adm_provider_employees` - Staff Provider

**Rôle critique:**

- Gestion cross-tenant pour support
- Permissions spéciales système
- Séparation claire provider/client

**Structure complète V2:**

```sql
STRUCTURE:
- id (uuid)
- employee_number (varchar) - ID interne
- clerk_user_id (varchar) - Auth
- first_name, last_name
- email (citext) - Unique
- department (enum) - support, tech, finance, sales
- title (varchar)
- role (enum) - support_agent, admin, super_admin
- permissions (jsonb) - Spécifiques

PERMISSIONS SPÉCIALES:
- can_impersonate (boolean)
- can_override_limits (boolean)
- accessible_tenants (uuid[] ou ALL)
- max_support_tickets (integer)

TRACKING RH:
- hire_date (date)
- termination_date (date)
- contract_type (enum)
- supervisor_id (uuid)
- last_activity_at (timestamp)
```

#### Table 7: `adm_tenant_lifecycle_events` - Historique critique

**Rôle crucial:**

- Trace tous changements tenant
- Déclenche automatisations
- Base pour facturation

**Structure complète V2:**

```sql
STRUCTURE:
- id (uuid)
- tenant_id (uuid)
- event_type (enum) EXHAUSTIF:
  * created, trial_started, trial_extended
  * activated, plan_upgraded, plan_downgraded
  * suspended, reactivated
  * cancelled, archived, deleted
- event_date (timestamp)
- effective_date (timestamp)
- performed_by (uuid) - Employee ou system
- performed_by_type (enum) - system, employee, api

CONTEXTE:
- reason (text) - Obligatoire
- previous_status (varchar)
- new_status (varchar)
- previous_plan_id (uuid)
- new_plan_id (uuid)
- related_invoice_id (uuid)
- support_ticket_id (uuid)

IMPACT:
- features_affected (jsonb)
- users_notified (uuid[])
- notifications_sent (jsonb)
- next_action_required (varchar)
- next_action_date (timestamp)
```

#### Table 8: `adm_invitations` - Onboarding sécurisé

**Rôle essentiel:**

- Contrôle accès nouveaux users
- Traçabilité complète
- Sécurité renforcée

**Structure complète V2:**

```sql
STRUCTURE:
- id (uuid)
- tenant_id (uuid)
- email (citext)
- token (varchar) - Unique, sécurisé
- role (varchar) - Rôle proposé
- expires_at (timestamp) - 72h défaut
- status (enum) - pending, accepted, expired, revoked

TRACKING:
- sent_at (timestamp)
- sent_count (integer) - Renvois
- last_sent_at (timestamp)
- accepted_at (timestamp)
- accepted_from_ip (inet)
- accepted_by_member_id (uuid)

CONTEXTE:
- invitation_type (enum):
  * initial_admin
  * additional_user
  * role_change
  * reactivation
- custom_message (text)
- metadata (jsonb)
- sent_by (uuid) - Provider employee
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
