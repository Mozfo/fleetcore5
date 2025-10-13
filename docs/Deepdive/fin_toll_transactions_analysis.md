# Table `fin_toll_transactions` – Analyse détaillée

Cette note s’appuie à la fois sur la définition Supabase fournie et sur la spécification fonctionnelle de Fleetcore pour analyser la table **`fin_toll_transactions`**. Elle décrit le modèle existant, les règles métiers détectées, propose des améliorations en vue d’un modèle multi‑pays plug‑and‑play et mesure l’impact de ces changements sur l’écosystème.

## 1. Modèle Supabase existant

La table `fin_toll_transactions` enregistre toutes les transactions de péage associées à des passages de véhicules sous des portiques (par exemple, le système Salik à Dubaï). Elle est multi‑tenant grâce au champ `tenant_id` et comporte les colonnes suivantes :

| Colonne             | Type            | Contraintes principales                       | Remarques                                                                        |
| ------------------- | --------------- | --------------------------------------------- | -------------------------------------------------------------------------------- |
| **id**              | `uuid`          | Clé primaire générée par `uuid_generate_v4()` | Identifiant immuable de la transaction.                                          |
| **tenant_id**       | `uuid`          | Non nul, FK vers `adm_tenants(id)`            | Sert à appliquer les politiques RLS ; permet la visibilité par tenant.           |
| **driver_id**       | `uuid`          | Non nul, FK vers `rid_drivers(id)`            | Identifie le chauffeur au moment du passage.                                     |
| **vehicle_id**      | `uuid`          | Non nul, FK vers `flt_vehicles(id)`           | Le véhicule qui a franchi le péage.                                              |
| **toll_gate**       | `text`          | Non nul                                       | Nom du portique (libre, sans référentiel).                                       |
| **toll_date**       | `date`          | Non nul                                       | Date du passage ; ne stocke pas l’heure.                                         |
| **amount**          | `numeric(14,2)` | Non négatif (`CHECK amount >= 0`)             | Montant facturé en devise locale.                                                |
| **currency**        | `varchar(3)`    | Non nul                                       | Code ISO‑4217 (ex. AED, EUR).                                                    |
| **metadata**        | `jsonb`         | Non nul, défaut `{}`                          | Informations supplémentaires (numéro de tag, id du portique, origine de l’API…). |
| **created_at**      | `timestamptz`   | Non nul, défaut `now()`                       | Date de création de l’enregistrement.                                            |
| **created_by**      | `uuid`          | Nullable, FK vers `adm_members`               | Membre interne ayant créé l’entrée (ou nul pour automatique).                    |
| **updated_at**      | `timestamptz`   | Non nul, défaut `now()`                       | Mis à jour via trigger `trigger_set_updated_at`.                                 |
| **updated_by**      | `uuid`          | Nullable, FK vers `adm_members`               | Membre ayant modifié l’entrée.                                                   |
| **deleted_at**      | `timestamptz`   | Nullable                                      | Soft‑delete.                                                                     |
| **deleted_by**      | `uuid`          | Nullable, FK vers `adm_members`               | Qui a supprimé l’entrée.                                                         |
| **deletion_reason** | `text`          | Nullable                                      | Justification de la suppression.                                                 |

Contraintes et indexes :

- Index sur `tenant_id`, `driver_id`, `vehicle_id`, `toll_date` et `deleted_at` pour les recherches par locataire, conducteur ou véhicule.
- Index GIN sur `metadata` pour les requêtes sur les clés JSON.
- **Index unique** `(tenant_id, driver_id, vehicle_id, toll_date)` excluant les entrées supprimées. Cela empêche d’enregistrer plusieurs passages par jour pour le même couple véhicule/conducteur/tenant, ce qui est restrictif car un véhicule peut passer plusieurs fois dans la même journée.
- Les FK déclenchent la suppression en cascade : si un véhicule ou un chauffeur est supprimé, les transactions liées sont supprimées.

## 2. Règles métiers & processus existants

- **Enregistrement automatique des passages** : la spécification indique que pour certains pays (par exemple les Émirats arabes unis avec le système Salik), Fleetcore doit **enregistrer automatiquement les transactions de péage** en croisant les données GPS/AVL avec les coordonnées des portiques. La plateforme stocke les emplacements des portiques et leurs frais afin de créer des transactions à chaque passage【644406540493755†L138-L146】. Les transactions peuvent être générées par :
  - un import régulier des données du fournisseur de péage ;
  - une intégration temps réel avec le système (RFID/DSRC) ;
  - un traitement des traces GPS combiné aux positions des portiques.
- **Lien avec les véhicules et les conducteurs** : chaque transaction est liée à un **chauffeur** (`driver_id`) et un **véhicule** (`vehicle_id`). En pratique, le chauffeur correspond à la personne responsable du véhicule à la date et à l’heure du passage. Si plusieurs chauffeurs se relaient sur un véhicule, des règles doivent déterminer à qui imputer la transaction (ex. en fonction de la planification des shifts).
- **Multi‑devises et TVA** : le champ `currency` permet d’enregistrer les montants dans la devise locale (AED, EUR, etc.). Les frais de péage sont susceptibles d’être soumis à la TVA ou à d’autres taxes selon la juridiction ; cela devra être traité lors de l’agrégation dans les modules de facturation.
- **Intégration dans la gestion des dépenses** : les transactions de péage sont intégrées aux frais de véhicule. Elles peuvent être ensuite imputées au chauffeur (déduction de salaire) ou prises en charge par la société selon la politique interne. Le module Finance les agrège avec les coûts de carburant, d’entretien et d’assurance【644406540493755†L138-L146】.
- **Détection des fraudes ou anomalies** : en comparant la date et l’heure (impliquée par `toll_date` mais non stockée au niveau horaire), la plaque du véhicule et le compte Salik, la plateforme peut détecter les anomalies (paiement en double, absence de correspondance avec un trajet planifié) et déclencher des alertes.
- **Statut de la transaction** : le modèle actuel n’a pas de colonne `status` ; on suppose que chaque ligne est considérée comme facturée. En réalité, il peut y avoir des états : `pending`, `charged`, `disputed`, `refunded`.

## 3. Propositions d’amélioration

Pour faire de `fin_toll_transactions` un module extensible et adapté à plusieurs pays (Émirats, France et autres), il est recommandé d’ajouter des champs et de normaliser certaines valeurs :

1. **Horodatage précis** : remplacer `toll_date` par un champ `toll_timestamp` (`timestamptz`) pour enregistrer la date et l’heure du passage. Cela permettra de différencier plusieurs passages le même jour et d’appliquer des tarifs variables (heures de pointe vs heures creuses).
2. **Référentiel de portiques** : créer une table `dir_toll_gates` avec les colonnes `id`, `country_code`, `gate_name`, `location_lat`, `location_long`, `base_fee`, `currency`, `active_from`, `active_to`, `metadata` et `status`. Le champ `toll_gate_id` (UUID) dans `fin_toll_transactions` remplacera le champ texte `toll_gate`. Cette table facilitera le calcul automatique des frais, l’adaptation aux mises à jour des tarifs et l’ajout de portiques pour de nouveaux pays. Elle pourra être rattachée à des classes de véhicules pour appliquer des tarifs différenciés (ex. camions vs voitures).
3. **Tarifs variables par période** : certains systèmes (Salik, autoroutes françaises, ZTL italiennes) appliquent des tarifs différents selon l’heure ou le jour. On peut gérer cela soit via une table `dir_toll_rates` liée à `dir_toll_gates` (`gate_id`, `vehicle_class_id`, `start_time`, `end_time`, `fee`, `currency`), soit via un champ `rate_schedule` JSON dans `dir_toll_gates`. L’algorithme de génération de transactions sélectionnera la bonne ligne de tarif en fonction de l’heure.
4. **Source et statut** :
   - Ajouter un champ `source` (`enum`: `automatic`, `manual`, `imported`) pour indiquer l’origine de la transaction.
   - Ajouter un champ `status` (`enum`: `pending`, `charged`, `refunded`, `disputed`) pour gérer les cas d’erreur, de remboursement ou de contestation. Lorsque la transaction est contestée, un workflow de validation peut être déclenché.
5. **Lien avec les lots de paiement et factures** : ajouter un champ `payment_batch_id` (FK vers `fin_driver_payment_batches`) ou `driver_payment_id` (FK vers `fin_driver_payments`) pour relier la transaction à un paiement spécifique. Cela simplifiera l’imputation des frais aux chauffeurs et facilitera le rapprochement des comptes.
6. **Durée et distance** : facultativement, stocker `trip_id` ou `distance_km` lorsque le péage est intégré dans un trajet, afin d’analyser le coût kilométrique et de générer des rapports d’optimisation.
7. **Sécurité et audit** : ajouter les champs `created_by`, `updated_by`, `deleted_by`, `deleted_at` (déjà présents) et activer les logs dans `adm_audit_logs` pour chaque transaction créée automatiquement ou manuellement.
8. **Indexes et RLS** : mettre à jour l’index unique pour inclure `toll_timestamp` et `toll_gate_id` au lieu de `toll_date`; ajouter des indexes sur `status`, `source`, `toll_timestamp` et `toll_gate_id`. Les règles RLS doivent s’assurer que chaque tenant ne voit que ses propres transactions.

## 4. Modèle cible proposé

Voici un exemple de DDL pour `fin_toll_transactions` dans un modèle enrichi :

```sql
-- Table de référence des portiques
create table public.dir_toll_gates (
  id uuid primary key default extensions.uuid_generate_v4(),
  country_code char(2) not null references dir_country_regulations(country_code) on update cascade on delete cascade,
  gate_name text not null,
  location point null, -- peut être remplacé par deux colonnes latitude/longitude
  base_fee numeric(12, 2) not null default 0,
  currency char(3) not null,
  rate_schedule jsonb null default '{}',
  status text not null default 'active',
  active_from date null,
  active_to date null,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint dir_toll_gates_country_gate_name_uq unique (country_code, gate_name)
);

-- Table des transactions de péage
create table public.fin_toll_transactions (
  id uuid primary key default extensions.uuid_generate_v4(),
  tenant_id uuid not null references adm_tenants(id) on update cascade on delete cascade,
  driver_id uuid not null references rid_drivers(id) on update cascade on delete cascade,
  vehicle_id uuid not null references flt_vehicles(id) on update cascade on delete cascade,
  toll_gate_id uuid not null references dir_toll_gates(id) on update cascade on delete cascade,
  toll_timestamp timestamptz not null,
  amount numeric(14,2) not null check (amount >= 0),
  currency char(3) not null,
  source text not null default 'automatic' check (source in ('automatic','manual','imported')),
  status text not null default 'pending' check (status in ('pending','charged','refunded','disputed')),
  payment_batch_id uuid null references fin_driver_payment_batches(id) on update cascade on delete set null,
  driver_payment_id uuid null references fin_driver_payments(id) on update cascade on delete set null,
  trip_id uuid null references trips(id) on update cascade on delete set null,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  created_by uuid null references adm_members(id) on update cascade on delete set null,
  updated_at timestamptz not null default now(),
  updated_by uuid null references adm_members(id) on update cascade on delete set null,
  deleted_at timestamptz null,
  deleted_by uuid null references adm_members(id) on update cascade on delete set null,
  deletion_reason text null,
  constraint fin_toll_transactions_tenant_driver_vehicle_gate_time_uq unique (tenant_id, driver_id, vehicle_id, toll_gate_id, toll_timestamp) where deleted_at is null
);

create index on fin_toll_transactions (tenant_id, toll_timestamp desc);
create index on fin_toll_transactions (driver_id);
create index on fin_toll_transactions (vehicle_id);
create index on fin_toll_transactions (status) where deleted_at is null;
create index on fin_toll_transactions (source);
create index on fin_toll_transactions (payment_batch_id);
create index on fin_toll_transactions (toll_gate_id);
-- Les règles RLS, les triggers de mise à jour, l’audit et le soft‑delete seraient similaires aux autres tables.
```

## 5. Impacts et intégration

### 5.1 Impact sur les autres tables

1. **`dir_toll_gates`** : la création de cette table ajoute un référentiel central des portiques. Elle doit être alimentée avec les portiques et les tarifs de chaque pays et tenant. Pour Dubaï, les données Salik pourraient être préchargées (emplacements et tarifs)【644406540493755†L138-L146】. Pour la France, les péages autoroutiers et les zones à faibles émissions pourraient également être intégrés.
2. **`fin_driver_payment_batches` et `fin_driver_payments`** : en ajoutant des FK sur les lots de paiement et les paiements individuels, on simplifie le rapprochement entre les transactions de péage et les déductions opérées sur le salaire du chauffeur. Les statuts de la transaction pourraient se synchroniser avec ceux du paiement (ex. une transaction remboursée entraîne le passage du statut `completed` à `refunded`).
3. **`rid_drivers` et `flt_vehicles`** : les règles d’imputation du péage nécessitent de s’assurer que `driver_id` et `vehicle_id` correspondent aux affectations actives au moment du passage (gestion des shifts). Une intégrité fonctionnelle devra donc être vérifiée dans les services métiers.
4. **`trips`** : si on ajoute le champ `trip_id`, chaque transaction de péage pourra être liée au trajet correspondant, ce qui facilitera le calcul du coût par trajet et la facturation sur la plateforme de ride‑hailing. Cette liaison n’existe pas dans le modèle initial.
5. **`fin_transactions` / `fin_accounts`** : les transactions de péage peuvent être intégrées dans un flux financier global. Selon que les frais sont avancés par la plateforme ou par le chauffeur, un mouvement pourra être enregistré dans `fin_transactions` (compte de trésorerie vs compte du chauffeur). Cette intégration doit suivre les bonnes pratiques de comptabilité et inclure la TVA si applicable.
6. **`dir_country_regulations`** : le référentiel des péages devra s’aligner sur les paramètres réglementaires de chaque pays (tarifs minima, TVA, type de licence). Les règles métier devront donc consulter à la fois `dir_country_regulations` et `dir_toll_gates` pour valider un passage et déterminer le montant.

### 5.2 Impact sur les services et l’interface

- **Service de synchronisation** : un service d’intégration (ex. `TollSyncService`) devra importer les données des fournisseurs de péage (Salik, Télépéage, etc.), créer ou mettre à jour les portiques dans `dir_toll_gates`, et générer les transactions dans `fin_toll_transactions`. Il devra gérer les tentatives et les erreurs de synchronisation (API non disponible, réponse mal formée, etc.) avec un mécanisme de retry et d’alerte.
- **API backoffice** : des endpoints devront permettre aux opérateurs d’ajouter/modifier des portiques, de corriger les transactions erronées ou de traiter des contestations. Les filtres incluront la date, le véhicule, le chauffeur, le statut et la source.
- **Interface utilisateur** : les gestionnaires pourront visualiser les frais de péage par véhicule, par chauffeur, par portique ou par période, détecter les anomalies et générer des rapports. Ils pourront configurer la prise en charge des péages (facturer au chauffeur, partager les frais avec l’entreprise ou appliquer un plafond mensuel).
- **Audit et conformité** : chaque création ou modification de transaction sera journalisée dans `adm_audit_logs`, et des règles RLS empêcheront un tenant d’accéder aux transactions des autres.

## 6. Conclusion

Le modèle actuel de `fin_toll_transactions` permet un enregistrement simple des transactions de péage, mais il est insuffisant pour un produit multi‑pays et multi‑tenants. Les améliorations proposées – ajout d’un horodatage précis, introduction d’un référentiel des portiques, gestion de tarifs variables et des sources, statuts de traitement et liens avec les paiements – constituent une évolution nécessaire pour rendre Fleetcore plug‑and‑play. En adoptant ces modifications, la plateforme pourra intégrer rapidement de nouvelles juridictions, appliquer les réglementations locales (Salik aux Émirats, péages autoroutiers en Europe, etc.), et proposer une gestion fine des coûts et des remboursements.
