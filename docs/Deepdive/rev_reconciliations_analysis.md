# Analyse de la table `rev_reconciliations`

Cette note analyse la table `rev_reconciliations` qui sert à suivre la réconciliation des recettes importées avec les paiements reçus des plateformes ou banques. Elle examine le modèle actuel, les règles métiers, propose des améliorations et en évalue l’impact.

## 1. Modèle Supabase existant

`rev_reconciliations` contient les colonnes suivantes :

| Champ                                    | Type                  | Description / contraintes                                                       |
| ---------------------------------------- | --------------------- | ------------------------------------------------------------------------------- |
| `id`                                     | `uuid`                | Identifiant unique.                                                             |
| `tenant_id`                              | `uuid`                | Référence vers `adm_tenants`.                                                   |
| `import_id`                              | `uuid`                | Référence vers `rev_revenue_imports`; identifie le lot de données à rapprocher. |
| `reconciliation_date`                    | `date`                | Date à laquelle la réconciliation est effectuée.                                |
| `status`                                 | `text`                | Statut (`pending`, `completed`, `failed`, `cancelled`).                         |
| `notes`                                  | `text`                | Commentaires libres.                                                            |
| `metadata`                               | `jsonb`               | Données supplémentaires.                                                        |
| `created_at`, `updated_at`               | `timestamptz`         | Horodatage.                                                                     |
| `created_by`, `updated_by`, `deleted_by` | `uuid`                | Références vers `adm_members`.                                                  |
| `deleted_at`, `deletion_reason`          | `timestamptz`, `text` | Suppression logique.                                                            |

Un index unique partiel garantit qu’un tenant ne possède qu’une réconciliation par import et par date. Des index supplémentaires existent sur `tenant_id`, `import_id` et `reconciliation_date`.

## 2. Règles métier et processus

1. **Rapprochement des recettes** : après avoir importé les revenus des plateformes via `rev_revenue_imports`, l’administrateur compare les revenus attendus avec les montants versés par les plateformes ou les banques. Un enregistrement `rev_reconciliations` est créé pour chaque import afin de consigner le résultat de ce rapprochement.
2. **Cycle de statut** : `pending` indique qu’aucune action n’a été effectuée, `completed` signifie que les montants concordent et la réconciliation est validée, `failed` signale un écart ou une erreur, et `cancelled` correspond à un rapprochement annulé. Ces statuts aident à filtrer les imports dans les tableaux de bord.
3. **Traçabilité** : la relation avec `rev_revenue_imports` permet de retracer l’origine des données. Les notes et le champ `metadata` peuvent documenter les écarts constatés, les correctifs appliqués ou les justificatifs.
4. **Multi‑pays** : la table ne stocke ni devise ni plateforme. On suppose que la devise est cohérente avec celle du tenant. En cas de multi‑devises, les montants doivent être convertis au moment du rapprochement.

## 3. Améliorations proposées

1. **Ajouter `reconciliation_type`** : pour distinguer différents types de rapprochement : `platform_payment` (paiements reçus d’Uber/Bolt), `cash_collection` (collectes d’espèces), `bank_statement` (virements bancaires). Cela facilitera les rapports et les automatisations.
2. **Enregistrer les montants** : ajouter des champs `expected_amount` et `received_amount` pour quantifier les écarts sans devoir consulter d’autres tables. Un champ `difference_amount` pourrait être calculé (ou stocké) pour suivre les ajustements.
3. **Référencer la devise** : ajouter `currency` (char(3)). Même si la plupart des tenants utilisent une devise unique, cela évite toute ambiguïté pour les opérateurs multi‑pays.
4. **Détail des écarts** : une table de détail `rev_reconciliation_lines` pourrait répertorier les écarts par chauffeur ou par plateforme (driver_id, platform_id, expected_amount, received_amount, difference, notes). Cela facilite les investigations et les corrections.
5. **Enumérer le statut** : utiliser une énumération stricte (`pending`, `matched`, `mismatched`, `cancelled`) pour refléter la comparaison des montants plutôt qu’un simple champ libre. `matched` remplacerait `completed` et `mismatched` indiquerait un écart.

### Modèle cible proposé (simplifié)

```sql
create table rev_reconciliations (
  id uuid primary key default extensions.uuid_generate_v4(),
  tenant_id uuid not null references adm_tenants(id) on delete cascade,
  import_id uuid not null references rev_revenue_imports(id) on delete cascade,
  reconciliation_date date not null,
  reconciliation_type varchar(30) not null default 'platform_payment' check (reconciliation_type in ('platform_payment','cash_collection','bank_statement')),
  expected_amount numeric(18,2) not null default 0,
  received_amount numeric(18,2) not null default 0,
  currency char(3) not null,
  status varchar(20) not null default 'pending' check (status in ('pending','matched','mismatched','cancelled')),
  notes text,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  created_by uuid references adm_members(id),
  updated_at timestamptz not null default now(),
  updated_by uuid references adm_members(id),
  deleted_at timestamptz,
  deleted_by uuid references adm_members(id),
  deletion_reason text,
  unique (tenant_id, import_id, reconciliation_date) where deleted_at is null
);

create table rev_reconciliation_lines (
  id uuid primary key default extensions.uuid_generate_v4(),
  reconciliation_id uuid not null references rev_reconciliations(id) on delete cascade,
  driver_id uuid references rid_drivers(id),
  platform_id uuid references dir_platforms(id),
  expected_amount numeric(18,2) not null default 0,
  received_amount numeric(18,2) not null default 0,
  difference_amount numeric(18,2) generated always as (received_amount - expected_amount) stored,
  notes text,
  metadata jsonb not null default '{}'
);
```

Cette structure offre une meilleure traçabilité des écarts, permet d’automatiser la génération des rapports et de distinguer les sources de rapprochement. Elle reste simple et peut être étendue ultérieurement.

## 4. Impacts et intégration

- **Importations de revenus** : l’ajout des montants attendus et reçus simplifie la validation et réduit la dépendance à des scripts externes pour calculer les écarts. La clé étrangère vers `rev_revenue_imports` reste inchangée.
- **Reporting et audits** : les nouveaux champs et la table `rev_reconciliation_lines` facilitent le calcul des écarts par chauffeur et par plateforme. Ils permettent de générer automatiquement des alertes ou des tâches de correction lorsque `status = 'mismatched'`.
- **Intégration comptable** : en distinguant le type de rapprochement (`platform_payment`, etc.), on peut brancher l’outil sur différents flux financiers (transfert de plateforme, dépôt d’espèces, virement bancaire) sans alourdir la table principale.
- **Migration** : pour introduire ces champs, une migration devra initialiser `expected_amount` et `received_amount` à la valeur de `total_revenue` de l’import, fixer `currency` à celle du tenant et définir `reconciliation_type = 'platform_payment'`.

Grâce à ces améliorations, la table `rev_reconciliations` deviendra un outil puissant de contrôle financier tout en restant alignée avec les besoins opérationnels des opérateurs de ride‑hailing.
