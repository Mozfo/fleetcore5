# Analyse de la table `rev_driver_revenues`

Cette analyse présente la table `rev_driver_revenues` en distinguant le modèle actuel, les règles métiers sous‑jacentes, les améliorations possibles et leur impact. La table agrège les revenus des chauffeurs sur une période et permet de calculer leurs commissions et paiements.

## 1. Modèle Supabase existant

La table `rev_driver_revenues` regroupe, par tenant et par chauffeur, les montants générés sur une période donnée :

| Champ                                      | Type                  | Description / contraintes                                     |
| ------------------------------------------ | --------------------- | ------------------------------------------------------------- |
| `id`                                       | `uuid`                | Identifiant unique.                                           |
| `tenant_id`                                | `uuid`                | Référence vers `adm_tenants`, isolement multi‑tenant.         |
| `driver_id`                                | `uuid`                | Référence vers `rid_drivers`.                                 |
| `period_start`                             | `date`                | Date de début de la période (généralement semaine ou mois).   |
| `period_end`                               | `date`                | Date de fin ; doit être ≥ `period_start`.                     |
| `total_revenue`                            | `numeric(18,2)`       | Chiffre d’affaires brut collecté par le chauffeur ; >= 0.     |
| `commission_amount`                        | `numeric(18,2)`       | Montant de la commission prélevée par le tenant (plateforme). |
| `net_revenue`                              | `numeric(18,2)`       | Revenu net versé au chauffeur ; ≥ 0.                          |
| `metadata`                                 | `jsonb`               | Données supplémentaires (ex. détails par plateforme).         |
| `created_at` / `updated_at`                | `timestamptz`         | Horodatage des opérations.                                    |
| `created_by` / `updated_by` / `deleted_by` | `uuid`                | Références vers `adm_members`.                                |
| `deleted_at` / `deletion_reason`           | `timestamptz`, `text` | Gestion du soft‑delete.                                       |

Un index unique partiel garantit qu’il n’y a qu’un seul enregistrement par combinaison `(tenant_id, driver_id, period_start)` quand la ligne n’est pas supprimée. Les check constraints imposent des montants positifs et `period_end ≥ period_start`.

## 2. Règles métier et processus

1. **Agrégation des revenus** : à partir des données importées des plateformes de ride‑hailing, Fleetcore calcule pour chaque chauffeur et chaque période ses revenus bruts, la commission de la plateforme, et donc le revenu net【567670092230000†L90-L118】. Ces agrégats alimentent les modules de paie et les KPI de performance.
2. **Périodicité flexible** : la période peut être hebdomadaire, bimensuelle ou mensuelle selon le contrat du chauffeur. Le champ `period_start` sert de clé unique avec le chauffeur et le tenant.
3. **Commissions et partage** : le montant de la commission dépend du plan de rémunération (taux fixe ou variable). Les commissions sont paramétrées dans un autre module (plans de commission), puis appliquées ici pour calculer `commission_amount` et `net_revenue`.
4. **Intégration à la paie** : les revenus nets sont utilisés pour générer les paiements de chauffeurs via `fin_driver_payments`. Les déductions (dépenses, amendes, avances) viennent en déduction dans un workflow de paie mais ne sont pas stockées dans cette table. Les modules de facturation et de reporting utilisent également ces agrégats pour produire les rapports financiers du véhicule et de l’entreprise【16518245580022†screenshot】.
5. **Multi‑plateforme et multi‑devises** : la table ne stocke pas la devise ; on suppose que `total_revenue` est libellé dans la devise par défaut du tenant. Si le tenant opère sur plusieurs devises (plates‑formes en AED et en EUR), les imports doivent convertir les montants dans la devise de référence avant insertion.

## 3. Améliorations proposées

Pour mieux s’adapter aux opérations de ride‑hailing et rendre la table extensible :

1. **Clarifier la période et la fréquence** : ajouter un champ `period_type` (`week`, `biweekly`, `month`) pour préciser la granularité et faciliter la génération des rapports.
2. **Ajouter `platform_id`** : dans le modèle actuel, les revenus de toutes les plateformes sont agrégés. Ajouter un champ facultatif `platform_id` (FK vers `dir_platforms`) permet de distinguer les revenus par plateforme (Uber, Bolt, Yango, etc.)【956389956631957†screenshot】. Si `platform_id` est nul, la ligne consolide l’ensemble des plateformes.
3. **Statut de validation** : ajouter un champ `status` (`pending`, `validated`, `adjusted`) pour indiquer si les montants ont été revus et approuvés par l’administrateur avant d’être utilisés dans la paie. Une remarque ou une justification en cas d’ajustement pourrait être stockée dans `metadata`.
4. **Référencer les imports** : inclure `import_id` (FK vers `rev_revenue_imports`) afin de savoir de quel fichier ou intégration provient le revenu et de permettre la traçabilité entre import, agrégation et paie.
5. **Support multi‑devises** : ajouter `currency` pour éviter de dépendre implicitement de la devise du tenant. Prévoir un champ `exchange_rate` ou enregistrer la devise d’origine dans `metadata` pour une conversion transparente.

### Modèle cible proposé (simplifié)

```sql
create table rev_driver_revenues (
  id uuid primary key default extensions.uuid_generate_v4(),
  tenant_id uuid not null references adm_tenants(id) on delete cascade,
  driver_id uuid not null references rid_drivers(id) on delete cascade,
  import_id uuid references rev_revenue_imports(id),
  platform_id uuid references dir_platforms(id),
  period_start date not null,
  period_end date not null,
  period_type varchar(10) not null default 'week' check (period_type in ('week','biweekly','month')),
  total_revenue numeric(18,2) not null default 0,
  commission_amount numeric(18,2) not null default 0,
  net_revenue numeric(18,2) not null default 0,
  currency char(3) not null,
  status varchar(20) not null default 'pending' check (status in ('pending','validated','adjusted')),
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  created_by uuid references adm_members(id),
  updated_at timestamptz not null default now(),
  updated_by uuid references adm_members(id),
  deleted_at timestamptz,
  deleted_by uuid references adm_members(id),
  deletion_reason text,
  check (period_end >= period_start),
  check (total_revenue >= 0 and commission_amount >= 0 and net_revenue >= 0),
  unique (tenant_id, driver_id, platform_id, period_start) where deleted_at is null
);
```

Cette version explicite la périodicité, prend en charge plusieurs plateformes et devises, et ajoute des métadonnées pour la traçabilité. Elle reste simple et cohérente avec les besoins des opérateurs de ride‑hailing.

## 4. Impacts et intégration

- **Paie des chauffeurs** : l’ajout de `platform_id` permet d’expliquer les variations de revenus par plateforme. Les montants validés seront utilisés pour créer des paiements dans `fin_driver_payments` et alimenter le module WPS ou SEPA. Le champ `status` évite d’exporter des montants non contrôlés.
- **Imports et réconciliations** : la colonne `import_id` relie l’agrégation au fichier ou à l’API d’import. En cas de recalcul ou d’annulation d’un import, on peut identifier les enregistrements à mettre à jour.
- **Reporting** : la périodicité et la devise explicites facilitent les dashboards multi‑pays et multi‑plateformes. Les administrateurs peuvent filtrer les revenus par période, par plateforme et par devise et comparer les commissions.【16518245580022†screenshot】
- **Migration** : lors de l’introduction de ce modèle, une tâche d’upgrade devra renseigner `period_type` (`month` par défaut) et `currency` (valeur de `adm_tenants.default_currency`). Les lignes existantes recevront un `platform_id` nul, signifiant consolidation.

Cette approche épurée offre aux opérateurs de ride‑hailing une vision claire des revenus par chauffeur tout en restant extensible et en facilitant l’intégration avec les modules d’import, de paie et de reporting.
