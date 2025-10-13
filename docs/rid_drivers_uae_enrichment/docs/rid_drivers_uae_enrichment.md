# Enrichissement `rid_drivers` — Exigences EAU (UAE) et Opérateurs Ride‑Hailing

**Version** : 2025-10-11
**Portée** : Ajout des attributs RH et conformité pour les EAU dans `rid_drivers`, table multi‑tenant.
**Compatibilité** : PostgreSQL ≥ 15, Supabase (RLS + triggers `set_updated_at()` existants).

---

## 1) Objectif

- Rendre **opérationnel** l’onboarding chauffeur aux EAU (sponsor employeur, visa travail).
- Centraliser les **attributs RH minimaux** au niveau **profil chauffeur** pour le routage applicatif :
  - `date_of_birth`, `gender`, `nationality`, `languages` (multi‑valeurs),
  - `emergency_contact_name`, `emergency_contact_phone`,
  - `hire_date`, `employment_status`,
  - `cooperation_type` (état courant de la relation contractuelle).

---

## 2) Schéma actuel (extrait simplifié)

```sql
create table public.rid_drivers (
  id uuid primary key default extensions.uuid_generate_v4 (),
  tenant_id uuid not null references adm_tenants(id) on update cascade on delete cascade,
  first_name text not null,
  last_name  text not null,
  email text not null,
  phone text not null,
  license_number text not null,
  license_issue_date date null,
  license_expiry_date date null,
  professional_card_no text null,
  professional_expiry date null,
  driver_status varchar(50) not null default 'active',
  created_at timestamptz not null default current_timestamp,
  updated_at timestamptz not null default current_timestamp,
  deleted_at timestamptz null,
  rating numeric null,
  notes text null
);
```

> Constat : il manque des champs RH essentiels pour les EAU.

---

## 3) Champs à **ajouter** (P0) et justification

- `date_of_birth` : contrôle d’âge légal / éligibilité.
- `gender` : identitaire minimal (reporting).
- `nationality` : exigence documentaire & reporting.
- `hire_date` : relation d’emploi avec le tenant.
- `employment_status` : état RH (`active`, `on_leave`, `suspended`, `terminated`). Différent de `driver_status` (opérationnel – dispatch).
- `cooperation_type` : type courant de relation (`employee`, `contractor`, `owner_operator`, `partner_driver`).
- `emergency_contact_name`, `emergency_contact_phone` : contact d’urgence primaire.

**Multi‑valeurs (P1)** : `languages` via table `rid_driver_languages` (0..N) pour filtrage propre.

---

## 4) Migrations SQL (sans downtime)

### 4.1 ALTER TABLE `rid_drivers` (P0)

Voir **`sql/migrations/001_alter_rid_drivers_add_fields.sql`**.

```sql
-- AJOUT DES COLONNES ESSENTIELLES
ALTER TABLE public.rid_drivers
  ADD COLUMN IF NOT EXISTS date_of_birth date NULL
    CHECK (date_of_birth <= CURRENT_DATE),
  ADD COLUMN IF NOT EXISTS gender text NULL
    CHECK (gender IN ('male','female','unspecified')),
  ADD COLUMN IF NOT EXISTS nationality char(2) NULL
    CHECK (nationality ~ '^[A-Za-z]{2}$'),
  ADD COLUMN IF NOT EXISTS hire_date date NULL,
  ADD COLUMN IF NOT EXISTS employment_status text NOT NULL DEFAULT 'active'
    CHECK (employment_status IN ('active','on_leave','suspended','terminated')),
  ADD COLUMN IF NOT EXISTS cooperation_type text NULL
    CHECK (cooperation_type IN ('employee','contractor','owner_operator','partner_driver')),
  ADD COLUMN IF NOT EXISTS emergency_contact_name text NULL,
  ADD COLUMN IF NOT EXISTS emergency_contact_phone text NULL;

-- INDEX UTILES
CREATE INDEX IF NOT EXISTS rid_drivers_dob_idx
  ON public.rid_drivers (date_of_birth) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS rid_drivers_nationality_idx
  ON public.rid_drivers (nationality) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS rid_drivers_hire_date_idx
  ON public.rid_drivers (hire_date) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS rid_drivers_employment_status_idx
  ON public.rid_drivers (employment_status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS rid_drivers_cooperation_type_idx
  ON public.rid_drivers (cooperation_type) WHERE deleted_at IS NULL;
```

### 4.2 Table `rid_driver_languages` (P1)

Voir **`sql/migrations/002_create_rid_driver_languages.sql`**.

```sql
CREATE TABLE IF NOT EXISTS public.rid_driver_languages (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  tenant_id uuid NOT NULL REFERENCES adm_tenants(id) ON UPDATE CASCADE ON DELETE CASCADE,
  driver_id uuid NOT NULL REFERENCES rid_drivers(id) ON UPDATE CASCADE ON DELETE CASCADE,
  language_code char(2) NOT NULL CHECK (language_code ~ '^[A-Za-z]{2}$'),
  proficiency text NULL CHECK (proficiency IN ('basic','conversational','fluent','native')),
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NULL REFERENCES adm_members(id) ON UPDATE CASCADE ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid NULL REFERENCES adm_members(id) ON UPDATE CASCADE ON DELETE SET NULL,
  deleted_at timestamptz NULL,
  deleted_by uuid NULL REFERENCES adm_members(id) ON UPDATE CASCADE ON DELETE SET NULL,
  deletion_reason text NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS rid_driver_languages_unique
  ON public.rid_driver_languages (tenant_id, driver_id, language_code)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS rid_driver_languages_lang_idx
  ON public.rid_driver_languages (language_code) WHERE deleted_at IS NULL;
```

### 4.3 Trigger cohérence RH → opérationnel (P1)

Voir **`sql/migrations/003_triggers_views.sql`**.

```sql
CREATE OR REPLACE FUNCTION sync_driver_status_from_employment()
RETURNS trigger AS $$
BEGIN
  IF NEW.employment_status = 'terminated' THEN
    NEW.driver_status := 'terminated';
  ELSIF NEW.employment_status = 'suspended' AND NEW.driver_status <> 'terminated' THEN
    NEW.driver_status := 'suspended';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_driver_status ON public.rid_drivers;
CREATE TRIGGER trg_sync_driver_status
BEFORE INSERT OR UPDATE OF employment_status ON public.rid_drivers
FOR EACH ROW EXECUTE FUNCTION sync_driver_status_from_employment();
```

### 4.4 Vue profil consolidé (P1)

Toujours dans **`003_triggers_views.sql`**.

```sql
CREATE OR REPLACE VIEW public.v_driver_profile AS
SELECT
  d.id AS driver_id,
  d.tenant_id,
  d.first_name, d.last_name, d.email, d.phone,
  d.date_of_birth, d.gender, d.nationality,
  d.hire_date, d.employment_status, d.driver_status,
  d.cooperation_type,
  d.emergency_contact_name, d.emergency_contact_phone,
  array_remove(array_agg(DISTINCT l.language_code) FILTER (WHERE l.deleted_at IS NULL), NULL) AS languages
FROM public.rid_drivers d
LEFT JOIN public.rid_driver_languages l
  ON l.driver_id = d.id AND l.tenant_id = d.tenant_id AND l.deleted_at IS NULL
WHERE d.deleted_at IS NULL
GROUP BY d.id, d.tenant_id, d.first_name, d.last_name, d.email, d.phone,
         d.date_of_birth, d.gender, d.nationality,
         d.hire_date, d.employment_status, d.driver_status,
         d.cooperation_type, d.emergency_contact_name, d.emergency_contact_phone;
```

### 4.5 RLS – exemples (à adapter à vos rôles) (P0)

Voir **`sql/migrations/004_policies.sql`**.

```sql
-- rid_drivers : lecture intra-tenant
CREATE POLICY IF NOT EXISTS rid_drivers_sel ON public.rid_drivers
FOR SELECT USING (
  tenant_id::text = coalesce((auth.jwt() ->> 'tenant_id'), '')
  AND deleted_at IS NULL
);

-- rid_driver_languages : lecture/écriture intra-tenant
CREATE POLICY IF NOT EXISTS rid_driver_languages_rw ON public.rid_driver_languages
FOR ALL USING (
  tenant_id::text = coalesce((auth.jwt() ->> 'tenant_id'), '')
) WITH CHECK (
  tenant_id::text = coalesce((auth.jwt() ->> 'tenant_id'), '')
);
```

### 4.6 Backfill (P0) et tâches récurrentes (P1)

Voir **`sql/migrations/005_backfill.sql`**.

```sql
-- Backfill employment_status simple depuis driver_status
UPDATE public.rid_drivers
SET employment_status = CASE driver_status
  WHEN 'active' THEN 'active'
  WHEN 'suspended' THEN 'suspended'
  WHEN 'terminated' THEN 'terminated'
  ELSE 'active'
END,
updated_at = now()
WHERE employment_status IS NULL;

-- Job récurrent (ex: Supabase cron) pour synchroniser cooperation_type depuis terms actifs
-- (ajouter une fonction si besoin ; exemple logique)
UPDATE public.rid_drivers d
SET cooperation_type = COALESCE(v.cooperation_type,'contractor'),
    updated_at = now()
FROM (
  SELECT t.tenant_id, t.driver_id,
         COALESCE(t.metadata->>'cooperation_type','contractor') AS cooperation_type
  FROM public.rid_driver_cooperation_terms t
  WHERE t.deleted_at IS NULL
    AND (t.expiry_date IS NULL OR t.expiry_date >= CURRENT_DATE)
    AND (t.effective_date IS NULL OR t.effective_date <= CURRENT_DATE)
) v
WHERE v.driver_id = d.id AND v.tenant_id = d.tenant_id
  AND d.deleted_at IS NULL;
```

---

## 5) Flux Onboarding (résumé)

1. Création fiche chauffeur (profil + DOB, gender, nationality, hire_date, employment_status, cooperation_type, emergency contact).
2. Dépôt documents (visa, Emirates ID, permis, assurance) → `doc_documents` + `rid_driver_documents`.
3. Enregistrement termes de coopération → `rid_driver_cooperation_terms` (source historique).
4. Ajout langues (optionnel) → `rid_driver_languages`.
5. Contrôles d’éligibilité (statuts, dates d’expiration).
6. Activation opérationnelle (affectations, plateformes).

---

## 6) Diagramme (Mermaid) – Domaine Drivers (extrait)

```mermaid
erDiagram
  ADM_TENANTS ||--o{ RID_DRIVERS : "tenant_id"
  RID_DRIVERS ||--o{ RID_DRIVER_LANGUAGES : "driver_id"
  RID_DRIVERS ||--o{ RID_DRIVER_DOCUMENTS : "driver_id"
  RID_DRIVERS ||--o{ RID_DRIVER_COOPERATION_TERMS : "driver_id"
  DOC_DOCUMENTS ||--o{ RID_DRIVER_DOCUMENTS : "document_id"

  RID_DRIVERS {{
    uuid id PK
    uuid tenant_id FK
    text first_name
    text last_name
    text email
    text phone
    date date_of_birth
    text gender
    char(2) nationality
    date hire_date
    text employment_status
    text cooperation_type
    text emergency_contact_name
    text emergency_contact_phone
    text driver_status
  }}

  RID_DRIVER_LANGUAGES {{
    uuid id PK
    uuid tenant_id FK
    uuid driver_id FK
    char(2) language_code
    text proficiency
  }}
```

---

## 7) Tests de validation (DB)

- Contraintes :
  - `date_of_birth <= current_date`.
  - `employment_status ∈ (active,on_leave,suspended,terminated)`.
  - `cooperation_type ∈ (employee,contractor,owner_operator,partner_driver)`.
  - `nationality` ISO‑2 (`^[A-Za-z]{2}$`).
- Triggers : `set_updated_at()` et `trg_sync_driver_status`.
- Index : utilisés dans les filtres admin.
- RLS : accès intra‑tenant uniquement.

---

## 8) Plan & priorisation (effort réaliste)

| Élément                                   | Priorité | Estimation |
| ----------------------------------------- | -------: | ---------: |
| Ajout colonnes P0 (`rid_drivers`) + index |       P0 |    0.5–1 j |
| RLS policies supplémentaires              |       P0 |     0.25 j |
| Table `rid_driver_languages` + index      |       P1 |      0.5 j |
| Trigger cohérence RH→opérationnel         |       P1 |     0.25 j |
| Vue `v_driver_profile`                    |       P1 |     0.25 j |
| Backfill + job récurrent                  |       P1 |     0.25 j |
| (Option) multi‑contacts d’urgence         |       P2 |      0.5 j |

---

## 9) Rollback

- `DROP VIEW IF EXISTS public.v_driver_profile;`
- `DROP TRIGGER IF EXISTS trg_sync_driver_status ON public.rid_drivers;`
- `DROP FUNCTION IF EXISTS sync_driver_status_from_employment();`
- `DROP TABLE IF EXISTS public.rid_driver_languages;`
- `ALTER TABLE public.rid_drivers DROP COLUMN …` (dans l’ordre inverse si nécessaire).

---

## 10) Notes d’implémentation (Supabase / Next.js)

- **Supabase** : vérifier que le JWT inclut `tenant_id` pour les policies.
- **Next.js 15 (App Router)** : formulaires d’onboarding : validations front (DOB passée, ISO‑2, téléphone).
- **Confidentialité** : masquer `emergency_contact_*` dans les listes, exposer uniquement dans vues détaillées/roles autorisés.
