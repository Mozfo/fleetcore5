## Table `rid_drivers`

### Modèle existant

La table `rid_drivers` recense les chauffeurs de chaque tenant. Elle contient l’identifiant du chauffeur (`id`), le `tenant_id`, les champs personnels (`first_name`, `last_name`), les coordonnées (`email`, `phone`), les informations de permis (`license_number`, `license_issue_date`, `license_expiry_date`, `professional_card_no`, `professional_expiry`) et un statut (`driver_status` : active, suspended, terminated). Un champ `rating` optionnel stocke la note moyenne des clients et `notes` sert à conserver des commentaires internes. Les index uniques `(tenant_id, email)` et `(tenant_id, license_number)` empêchent les doublons. Les contraintes vérifient que `driver_status` appartient aux valeurs autorisées. Les colonnes `created_at`, `updated_at`, `deleted_at` sont gérées automatiquement.

### Règles métier et processus

- **Onboarding et offboarding** : selon la spécification, lors de l’arrivée d’un chauffeur, l’équipe effectue une vérification des documents (permis, carte professionnelle, ID). En cas de départ, on clôture toutes les affectations et on passe le statut du chauffeur à `suspended` ou `terminated`, on archive ses documents et on anonymise ses données【567670092230000†L90-L118】.
- **Conformité des documents** : la validité du permis et de la carte professionnelle est surveillée via `license_expiry_date` et `professional_expiry`. Un chauffeur ne peut pas être activé si ses documents sont expirés ou manquants, et des rappels sont envoyés avant l’expiration【567670092230000†L153-L178】.
- **Statuts et notation** : le statut `active` est requis pour être assigné à des véhicules ou à des courses. Le champ `rating` est mis à jour à partir des retours clients ; un système simple (1–5) est suffisant pour évaluer la performance.

### Propositions d’amélioration et modèle cible

1. **Séparer les noms** : ajouter des champs `first_name` et `last_name` dans la table (le modèle existant les a déjà) et un champ `full_name` généré par trigger pour faciliter la recherche. Prévoir un champ `date_of_birth` si la réglementation impose un âge minimum.
2. **Enum et normalisation** : convertir `driver_status` en type `ENUM` (`active`, `inactive`, `suspended`, `terminated`) afin d’éviter des chaînes libres ; ajouter un champ `status_reason` pour enregistrer le motif (panne, sanction, documents expirés).
3. **Coordonnées uniques** : renforcer les contraintes uniques sur `(tenant_id, phone)` en plus de l’email et du permis pour éviter les doublons. Séparer `email` en `email` et `email_verified_at` pour améliorer la sécurité.
4. **Metadonnées et scoring** : déplacer le champ `rating` dans une table agrégée `rid_driver_performances` (déjà existante). Ajouter un champ `metadata` JSONB pour stocker des informations supplémentaires (langues parlées, préférences de planning) et des indicateurs automatiques (p. ex. nombre de courses effectuées dans le mois).
5. **Plug‑and‑play multi‑pays** : prévoir un champ `country_code` afin de gérer les règles propres à chaque pays (validité des permis, types de licences). Les champs professionnels (`professional_card_no`) peuvent être renommés en `professional_license_number` et `professional_expiry` en `professional_license_expiry` pour plus de clarté.

Un modèle cible simplifié serait :

```sql
CREATE TABLE rid_drivers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES adm_tenants(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  full_name TEXT GENERATED ALWAYS AS (first_name || ' ' || last_name) STORED,
  email CITEXT NOT NULL,
  phone TEXT NOT NULL,
  license_number TEXT NOT NULL,
  license_issue_date DATE,
  license_expiry_date DATE,
  professional_license_number TEXT,
  professional_license_expiry DATE,
  country_code CHAR(2),
  status rid_driver_status DEFAULT 'active' NOT NULL,
  status_reason TEXT,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  created_by UUID REFERENCES adm_members(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES adm_members(id) ON DELETE SET NULL,
  deleted_by UUID REFERENCES adm_members(id) ON DELETE SET NULL,
  UNIQUE (tenant_id, email) WHERE deleted_at IS NULL,
  UNIQUE (tenant_id, license_number) WHERE deleted_at IS NULL
);

CREATE TYPE rid_driver_status AS ENUM ('active','inactive','suspended','terminated');
```

### Impact sur les autres tables

Ces modifications n’affectent pas la structure des autres tables existantes. Les relations avec `rid_driver_documents`, `rid_driver_requests` ou `sch_shifts` restent valides. L’ajout d’un champ `country_code` permet de lier le chauffeur aux règles locales dans `dir_country_regulations`.
