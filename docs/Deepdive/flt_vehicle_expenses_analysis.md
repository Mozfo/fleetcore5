# Analyse de la table `flt_vehicle_expenses`

Cette analyse suit la structure validée pour toutes les tables : **modèle existant**, **règles métier**, **propositions d’amélioration avec modèle cible** et **impact sur le modèle global**. L’objectif est d’adapter la table aux besoins des opérateurs de ride‑hailing tout en restant compatible avec le schéma Supabase actuel.

## 1. Modèle Supabase existant

La table `flt_vehicle_expenses` enregistre les dépenses liées à un véhicule et, éventuellement, à un conducteur ou à un trajet. Elle est multi‑tenant (clé `tenant_id`) et comporte les champs suivants :

| Champ                    | Type            | Description / contraintes                                                                                                                            |
| ------------------------ | --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                     | `uuid`          | Identifiant unique, clé primaire.                                                                                                                    |
| `tenant_id`              | `uuid`          | Référence vers `adm_tenants`. Obligatoire, filtre RLS.                                                                                               |
| `vehicle_id`             | `uuid`          | Référence vers `flt_vehicles` (CASCADE) : la dépense est toujours liée à un véhicule.                                                                |
| `driver_id`              | `uuid`          | Référence facultative vers `rid_drivers`. Utile lorsque la dépense est engagée par un chauffeur (ex. carburant).                                     |
| `ride_id`                | `uuid`          | Référence facultative vers `trp_trips`. Permet de lier la dépense à une course spécifique (par ex. frais de parking, lavages).                       |
| `expense_date`           | `date`          | Date de la dépense. Obligatoire.                                                                                                                     |
| `expense_category`       | `text`          | Catégorie parmi `fuel`, `toll`, `parking`, `wash`, `repair`, `fine`, `other` (contrainte CHECK).                                                     |
| `amount`                 | `numeric(10,2)` | Montant positif (CHECK `amount > 0`).                                                                                                                |
| `currency`               | `varchar(3)`    | Code ISO 4217 (défaut : `'EUR'`).                                                                                                                    |
| `payment_method`         | `text`          | Facultatif. Valeurs autorisées : `cash`, `card`, `fuel_card`, `toll_card`, `company_account` (CHECK).                                                |
| `receipt_url`            | `text`          | URL vers le justificatif (scan du ticket) ; permet la vérification et l’archivage.                                                                   |
| `odometer_reading`       | `integer`       | Kilométrage au moment de la dépense ; utile pour suivre l’usure ou vérifier les notes de carburant.                                                  |
| `quantity`, `unit_price` | `numeric(10,2)` | Facultatifs : pour les dépenses en volume (litres de carburant, nombre de lavages).                                                                  |
| `location`, `vendor`     | `text`          | Lieu et fournisseur de la dépense ; optionnels.                                                                                                      |
| `description`            | `text`          | Description libre.                                                                                                                                   |
| `reimbursed`             | `boolean`       | Indique si la dépense a été remboursée au chauffeur ou refacturée au propriétaire. Défaut : `false`.                                                 |
| `reimbursed_at`          | `timestamptz`   | Date de remboursement.                                                                                                                               |
| `reimbursed_in_batch_id` | `uuid`          | Référence vers un batch de paiements de chauffeurs (`fin_driver_payment_batches`) si applicable.                                                     |
| `notes`                  | `text`          | Notes internes supplémentaires.                                                                                                                      |
| `metadata`               | `jsonb`         | Données extensibles (clé/valeur). Défaut `{}`.                                                                                                       |
| Audit fields             | —               | `created_at`, `created_by`, `updated_at`, `updated_by`, `deleted_at`, `deleted_by`, `deletion_reason` pour la traçabilité et la suppression logique. |

Index : la table possède des index sur les colonnes `tenant_id`, `vehicle_id`, `driver_id`, `ride_id`, `expense_category`, `expense_date`, `reimbursed`, ainsi qu’un index GIN sur `metadata`. L’unicité n’est pas imposée car plusieurs dépenses peuvent être enregistrées pour le même véhicule à la même date.

## 2. Règles métier et processus

La spécification Fleetcore classe les dépenses dans des catégories standard (carburant, maintenance, assurance, péages, amendes, etc.) afin d’alimenter les indicateurs financiers par véhicule et par conducteur【567670092230000†L90-L118】. Les principales règles observées sont :

1. **Multi‑tenant et responsabilité** : chaque dépense appartient à un tenant. Les rôles Finance ou Fleet Manager créent et approuvent les dépenses. Les chauffeurs peuvent soumettre des dépenses via leur portail (catégories autorisées, justificatifs) et consulter les remboursements dans leurs relevés【567670092230000†L90-L118】.
2. **Catégorisation stricte** : les types de dépenses sont limités à un ensemble défini (`fuel`, `toll`, etc.). Cela permet de produire des KPI cohérents et de calculer automatiquement la part imputable au chauffeur, au fleet manager et aux investisseurs. Les dépenses liées à des amendes ou péages déclenchent éventuellement des pénalités et sont déduites des revenus du chauffeur【567670092230000†L90-L118】.
3. **Référencement des ressources** : chaque dépense est liée à un véhicule. Elle peut être associée à un chauffeur (`driver_id`) ou à une course (`ride_id`). Cette liaison permet d’imputer le coût au bon conducteur et de le déduire du paiement du voyage, ou de l’attribuer à l’entreprise lorsqu’il s’agit de coûts structurels (entretien, assurance).
4. **Remboursement & batch** : certaines dépenses payées par les chauffeurs (carburant, lavages) sont remboursables. Le champ `reimbursed` et la colonne `reimbursed_in_batch_id` permettent de regrouper ces remboursements dans un batch de paiements (`fin_driver_payment_batches`). Cela s’intègre au processus de paie ou de remboursement hebdomadaire.
5. **Intégration avec les modules financiers** : les dépenses alimentent la table `fin_transactions` pour les mouvements financiers et les comptes (`fin_accounts`). Les montants sont utilisés dans le calcul du revenu net des chauffeurs (`rev_driver_revenues`) et dans les rapports de performance véhicule et conducteur【567670092230000†L90-L118】.

## 3. Propositions d’amélioration et simplification

Pour des opérateurs de ride‑hailing, il est important de garder le modèle simple tout en couvrant les principaux cas d’usage :

1. **Séparer la logique de remboursement** : remplacer `reimbursed_in_batch_id` par `driver_payment_id` (FK vers `fin_driver_payments`) afin de lier chaque remboursement à un paiement précis plutôt qu’à un batch global. Le champ `reimbursed` peut être dérivé (une dépense est remboursée si un lien existe).
2. **Clarifier les unités** : ajouter un champ `unit` (`litre`, `km`, `unit`…) pour interpréter correctement `quantity` et `unit_price`. Pour des dépenses simples (parking, péage, amende), ces champs restent `NULL`.
3. **Normaliser les catégories et méthodes** : utiliser des énumérations (`ENUM`) au lieu de `text` pour `expense_category` et `payment_method` afin d’éviter les fautes de frappe. Ces enums pourraient être gérées via des tables de référence (`dir_expense_categories`, `dir_payment_methods`) permettant aux tenants d’ajouter leurs propres catégories tout en conservant des codes internes.
4. **Diminuer la granularité** : dans le contexte ride‑hailing, les champs `odometer_reading`, `quantity`, `unit_price`, `location`, `vendor` et `description` peuvent être rendus facultatifs ou stockés dans `metadata` pour ne pas alourdir l’interface. On peut réduire l’obligation à `expense_date`, `expense_category`, `amount`, `currency` et un justificatif. Les informations supplémentaires sont saisies uniquement si disponibles.
5. **Ajouter `platform_id`** : pour lier la dépense à une plateforme (Uber, Bolt…) lorsque des frais sont directement retenus par la plateforme (péage, commission). Cela facilite la réconciliation et l’imputation.
6. **Statut de validation** : introduire un champ `approval_status` (`pending`, `approved`, `rejected`) pour permettre au Fleet Manager de valider ou non les dépenses soumises par les chauffeurs avant remboursement.

### Modèle cible simplifié

Le schéma cible ci‑dessous reflète les propositions tout en gardant la compatibilité ascendante. Les colonnes existantes sont conservées mais certaines deviennent facultatives et un champ générique de statut est ajouté.

```sql
create table flt_vehicle_expenses (
  id uuid primary key default extensions.uuid_generate_v4(),
  tenant_id uuid not null references adm_tenants(id) on delete cascade,
  vehicle_id uuid not null references flt_vehicles(id) on delete cascade,
  driver_id uuid references rid_drivers(id),
  ride_id uuid references trp_trips(id),
  expense_date date not null,
  expense_category varchar(20) not null check (expense_category in ('fuel','toll','parking','wash','repair','fine','other')),
  amount numeric(10,2) not null check (amount > 0),
  currency char(3) not null,
  payment_method varchar(20) check (payment_method in ('cash','card','fuel_card','toll_card','company_account')),
  receipt_url text,
  odometer_reading integer,
  quantity numeric(10,2),
  unit_price numeric(10,2),
  unit varchar(10),
  location text,
  vendor text,
  description text,
  approval_status varchar(20) not null default 'pending' check (approval_status in ('pending','approved','rejected')),
  driver_payment_id uuid references fin_driver_payments(id),
  notes text,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  created_by uuid references adm_members(id),
  updated_at timestamptz not null default now(),
  updated_by uuid references adm_members(id),
  deleted_at timestamptz,
  deleted_by uuid references adm_members(id),
  deletion_reason text
);
```

Cette version conserve les index existants et ajoute des index sur `approval_status` et `driver_payment_id`. Les champs `reimbursed` et `reimbursed_at` sont remplacés par `approval_status` et `driver_payment_id`. Le champ `unit` facilite l’interprétation des quantités.

## 4. Impacts sur le modèle global

- **`fin_driver_payments`** : le lien direct via `driver_payment_id` permet de simplifier la gestion des remboursements et d’éviter un champ `reimbursed_in_batch_id`. Lorsqu’un paiement est effectué, le statut de la dépense passe à `approved` et la relation est établie.
- **`rev_driver_revenues`** : les dépenses de type `repair` ou `wash` n’entrent pas dans le calcul du revenu net du chauffeur ; en revanche, les dépenses avancées par le chauffeur (carburant, parking, péage) peuvent être remboursées et compensées lors du calcul du revenu. La simplification du modèle n’affecte pas ce calcul.
- **Interfaces utilisateurs** : un formulaire de saisie peut se limiter à la date, la catégorie, le montant, la devise et un justificatif. Les champs supplémentaires (kilométrage, quantité, fournisseur) sont facultatifs. Les actions de validation (approve/reject) doivent être intégrées dans les workflows du Fleet Manager.
- **Reporting** : les tableaux de bord financiers continuent d’agréger les dépenses par catégorie et par véhicule. Les colonnes facultatives stockées dans `metadata` peuvent être analysées via des requêtes JSON si nécessaire.

En conclusion, cette simplification conserve les capacités de suivi des dépenses tout en réduisant la complexité et en alignant le modèle sur les pratiques des opérateurs de ride‑hailing. Les améliorations proposées restent rétro‑compatibles et offrent une base extensible pour l’avenir.
