# Analyse de la table `adm_tenant_lifecycle_events`

Cette analyse s’inscrit dans le cadre de l’audit complet du modèle de données
Fleetcore. Elle suit le format établi précédemment : nous décrivons d’abord
le **modèle existant** tel que défini dans Supabase, puis nous identifions
les **règles métier** implémentées ou attendues dans l’application, et
enfin nous formulons des **propositions d’amélioration** en détaillant
leur impact sur le modèle cible et sur les autres tables.

## 1. Modèle existant

La table `adm_tenant_lifecycle_events` recense tous les événements qui
interviennent au cours du cycle de vie d’un tenant (organisation) : sa
création, les changements de plan, les suspensions, les réactivations et
les annulations. Le DDL fourni est le suivant :

```sql
create table public.adm_tenant_lifecycle_events (
  id uuid not null default extensions.uuid_generate_v4 (),
  tenant_id uuid not null,
  event_type character varying(50) not null,
  performed_by uuid null,
  effective_date date null,
  description text null,
  created_at timestamp with time zone not null default CURRENT_TIMESTAMP,
  constraint adm_tenant_lifecycle_events_pkey primary key (id),
  constraint adm_tenant_lifecycle_events_performed_by_fkey foreign key (performed_by) references adm_provider_employees (id) on update cascade on delete set null,
  constraint adm_tenant_lifecycle_events_tenant_id_fkey foreign key (tenant_id) references adm_tenants (id) on update cascade on delete cascade,
  constraint adm_tenant_lifecycle_events_event_type_check check ((event_type)::text = any ((array['created','plan_changed','suspended','reactivated','cancelled'])::text[]))
);
```

**Champs et contraintes :**

- `id` : identifiant UUID primaire.
- `tenant_id` : identifie le tenant concerné ; clé étrangère vers
  `adm_tenants` avec suppression en cascade. Toute suppression d’un tenant
  supprime donc ses événements.
- `event_type` : chaîne obligatoire décrivant le type d’événement. La
  contrainte `CHECK` limite la valeur à l’un des éléments suivants :
  `created`, `plan_changed`, `suspended`, `reactivated` ou `cancelled`.
- `performed_by` : UUID facultatif du salarié Fleetcore qui a déclenché
  l’événement ; référence `adm_provider_employees(id)` et utilise un ON
  DELETE SET NULL pour préserver l’historique même si l’employé est
  supprimé.
- `effective_date` : date d’effet, permettant de différer l’application
  d’un événement (par exemple suspension à la fin de la période de
  facturation).
- `description` : champ texte pour documenter la raison ou les détails.
- `created_at` : timestamp automatique indiquant la création de l’événement.

**Indexes :** le DDL crée plusieurs indexes : `adm_tenant_lifecycle_events_tenant_id_idx`,
`adm_tenant_lifecycle_events_event_type_idx`, `adm_tenant_lifecycle_events_effective_date_idx`
et un index composite `(tenant_id, event_type)` pour accélérer les
recherches par tenant et type d’événement. Il n’y a pas de colonne
`deleted_at` ou de soft‑delete : ces événements sont immuables par nature.

**RLS et accès :** le modèle de données recommande d’activer la Row Level
Security si les administrateurs de tenant doivent consulter leur propre
historique, tout en permettant aux employés Fleetcore de voir tous les
événements【310209321725136†L208-L233】.

## 2. Règles métier identifiées

L’objectif de cette table est de conserver une trace de chaque transition
importante dans la vie d’un tenant. Les règles métier suivantes peuvent être
dérivées de la spécification et du code :

### 2.1 Création du tenant

Lorsqu’un nouveau client est onboardé, une ligne `adm_tenant_lifecycle_events`
de type `created` doit être insérée. Le service d’onboarding (non montré
dans les extraits) doit également créer l’enregistrement dans
`adm_tenants` et initialiser l’état du tenant (par exemple `trial` ou
`active`). Le champ `performed_by` peut être renseigné avec l’ID de
l’employé qui a validé l’inscription. L’`effective_date` est
généralement la date de création.

### 2.2 Changement de plan

Lorsqu’un client modifie son abonnement (upgrade ou downgrade), le type
`plan_changed` doit être enregistré avec une description précisant le
plan précédent et le nouveau plan. La table des abonnements
`bil_tenant_subscriptions` est mise à jour par le service
`SubscriptionsService` pour refléter le nouveau plan et, selon la
spécification, la facturation est proratisée【437598395974437†L493-L500】. Ce
processus doit synchroniser le statut du tenant (`adm_tenants.status`)
et créer l’événement `plan_changed` avec la date d’effet, qui peut
correspondre au début de la prochaine période de facturation.

### 2.3 Suspension et réactivation

Un tenant peut être suspendu automatiquement en cas de factures impayées
ou manuellement par l’équipe Fleetcore. La suspension est reflétée dans
la table des abonnements (`bil_tenant_subscriptions.status = 'past_due'`)
et déclenche l’envoi d’e‑mails de relance【354991504716233†L540-L556】. Elle doit
aussi mettre à jour `adm_tenants.status` à `suspended` et créer un
événement `suspended`. Lorsque le client règle sa dette ou que
l’administrateur lève la suspension, un événement `reactivated` est
créé, `adm_tenants.status` repasse à `active` et l’accès à la plateforme
est restauré. Le champ `effective_date` permet de programmer la
suspension à une date précise (ex. fin de période) ou d’indiquer la
date de réactivation.

### 2.4 Annulation

L’annulation (`cancelled`) correspond à la résiliation définitive de
l’abonnement, par exemple lorsque le client cesse d’utiliser la
plateforme. Le service `SubscriptionsService.cancelSubscription` met à
jour `bil_tenant_subscriptions.status` à `cancelled` s’il faut fermer
l’abonnement immédiatement【354991504716233†L451-L478】. Un événement
`cancelled` doit être enregistré, `adm_tenants.status` doit passer à
`cancelled` ou `inactive`, et l’accès du tenant doit être désactivé.

### 2.5 Impact sur les métriques et la facturation

Le service `UsageMetricsService` agrège les métriques uniquement pour les
tenants dont le champ `status = 'active'`【354991504716233†L569-L573】. Toute
suspension ou annulation a donc un effet direct : le tenant est exclu
des agrégats de véhicules, chauffeurs, voyages et revenus. Les
factures générées via `bil_tenant_invoices` doivent prendre en compte
les événements : une suspension peut interrompre la facturation ou
appliquer des pénalités, un changement de plan entraîne des
proratisations【437598395974437†L493-L503】, et une annulation met fin au
prélevement automatique. L’historique des événements fournit un audit
indispensable pour justifier les montants facturés et les statuts des
abonnements.

### 2.6 Notifications et support

La résolution des tickets de support est envoyée à l’email de
contact principal du tenant (`primary_contact_email`)【354991504716233†L710-L715】.
Bien que cette information ne figure pas dans `adm_tenants`, elle
suggère qu’une suspension ou une annulation doit déclencher des
notifications similaires à destination du tenant (e‑mails de
suspension, de réactivation ou de résiliation). L’événement crée un
audit trail pour ces communications et aide le support à répondre aux
questions ultérieures.

## 3. Propositions d’amélioration

### 3.1 Uniformiser les types d’événements

Le modèle Supabase autorise actuellement cinq types (`created`,
`plan_changed`, `suspended`, `reactivated`, `cancelled`), tandis que la
spécification et les modèles Prisma citent parfois d’autres valeurs
(`activated`, `renewed`)【354991504716233†L302-L304】【310209321725136†L208-L233】. Il
serait pertinent de :

- Ajouter un type `activated` pour distinguer l’activation initiale
  (fin de la période de mise en place/trial) du simple `created`.
- Remplacer `reactivated` par `renewed` si l’on souhaite suivre les
  reconductions annuelles ou l’après‑suspension ; sinon maintenir
  `reactivated` pour lever les suspensions.
- Préciser `plan_changed` en `plan_upgraded` et `plan_downgraded` pour
  différencier les montées et descentes en gamme.

Ces changements nécessitent de mettre à jour la contrainte `CHECK` et
l’application pour s’aligner sur les nouveaux enums. Ils faciliteront
l’analyse des migrations de plans et des renouvellements.

### 3.2 Ajouter des champs contextuels

Pour enrichir l’audit et automatiser certaines opérations, on peut
proposer les ajouts suivants :

- `previous_plan_id` et `new_plan_id` (UUID) : utiles pour `plan_changed`
  afin de relier l’événement à `bil_billing_plans`. Cela simplifie la
  compréhension des migrations.
- `old_status` et `new_status` : stocker l’état du tenant avant et après
  l’événement (par exemple `active` → `suspended`). Cela évite de
  consulter les tables historiques pour comprendre la transition.
- `event_date` (timestamp) : actuellement `effective_date` est une date
  sans heure ; un timestamp complet peut être préférable pour tracer la
  chronologie exacte. On peut conserver `effective_date` pour les
  échéances futures et ajouter `event_date` pour la date d’enregistrement.
- `performed_by_type` : préciser si l’action est initiée par un
  employé (provider) ou par un processus automatique (null ou
  `system`).
- `metadata` (JSONB) : stocker des informations complémentaires
  extensibles, par exemple la raison de la suspension (impayé, fraude),
  le montant dû, ou l’ID de facture liée.

### 3.3 Procédures et impact sur d’autres tables

L’ajout de ces champs et la normalisation des types d’événements
impliquent des mises à jour dans plusieurs services et tables :

- **`adm_tenants`** : chaque création, suspension, réactivation ou
  annulation doit mettre à jour le champ `status` du tenant. Il est
  donc conseillé d’implémenter un service centralisé (`TenantLifecycleService`)
  qui insère un événement et synchronise l’état du tenant.
- **`bil_tenant_subscriptions`** : lors d’un `plan_changed`, les
  colonnes `billing_plan_id`, `billing_cycle` ou `status` doivent être
  mises à jour et proratisées. La table des factures
  `bil_tenant_invoices` doit prendre en compte ces changements pour
  appliquer les nouveaux tarifs.
- **`bil_tenant_usage_metrics`** : une suspension ou annulation
  implique de ne plus générer de métriques pour le tenant et de
  redémarrer le calcul lors de la réactivation.
- **Notifications** : il faudra déclencher des e‑mails (ou tickets
  Chatwoot) lors de chaque événement. Cela impose de stocker
  l’e‑mail de contact principal dans `adm_tenants` et de l’utiliser
  systématiquement【354991504716233†L710-L715】.
- **RLS et autorisations** : les colonnes supplémentaires et les
  nouveaux types nécessiteront d’adapter les politiques RLS et le
  middleware pour que les tenants voient uniquement leurs propres
  événements. Les employés Fleetcore devront avoir accès complet pour
  assurer le support et la facturation.【966139222788857†L139-L146】 rappelle
  d’ailleurs que l’isolation par locataire est une exigence clé d’un
  SaaS multi‑tenant.

## 4. Conclusion

La table `adm_tenant_lifecycle_events` joue un rôle central dans la
traçabilité et la conformité de la plateforme : elle garantit qu’aucun
changement de statut ou d’abonnement n’est effectué sans historique.
L’étude révèle que le modèle actuel est solide mais gagnerait à être
aligné avec la spécification fonctionnelle (notamment pour le champ
`status` des tenants, les notifications de support et les règles
de facturation). Les améliorations proposées – normalisation des types
d’événements, ajout de champs contextuels et adoption d’un service de
gestion du cycle de vie – renforceront la cohérence entre la base de
données, le code et les exigences métiers. Enfin, chaque modification
d’événement doit déclencher des mises à jour en cascade sur les tables
des abonnements, des factures et des métriques afin de maintenir
l’intégrité de l’écosystème Fleetcore.

## 5. Modèle cible (proposé)

Le tableau ci‑dessous présente un exemple de **DDL cible** intégrant les
améliorations évoquées ci‑dessus. Il élargit la table pour capturer
d’avantage de contexte et aligner la nomenclature des types
d’événements avec les besoins fonctionnels :

```sql
create table public.adm_tenant_lifecycle_events (
  id uuid not null default extensions.uuid_generate_v4 (),
  tenant_id uuid not null references adm_tenants (id) on delete cascade,
  -- Type d'événement normalisé
  event_type varchar(50) not null check (
    event_type in (
      'created',
      'activated',
      'plan_upgraded',
      'plan_downgraded',
      'suspended',
      'reactivated',
      'renewed',
      'cancelled'
    )
  ),
  -- Identifiants des plans avant et après (facultatifs)
  previous_plan_id uuid null references bil_billing_plans(id),
  new_plan_id     uuid null references bil_billing_plans(id),
  -- Statuts avant/après pour trace complète
  old_status varchar(50) null,
  new_status varchar(50) null,
  -- Date et heure de l'enregistrement de l'événement
  event_date timestamptz not null default current_timestamp,
  -- Date d'effet (p. ex. fin de période pour une suspension)
  effective_date timestamptz null,
  -- Employé qui a initié l'action, ou null si automatique
  performed_by uuid null references adm_provider_employees(id) on delete set null,
  -- Type d'émetteur (provider_staff, system, scheduler)
  performed_by_type varchar(50) null,
  -- Description libre et metadonnées extensibles
  description text null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default current_timestamp,
  constraint adm_tenant_lifecycle_events_pkey primary key (id),
  constraint adm_tenant_lifecycle_events_tenant_status_fk check (
    -- Si old_status ou new_status sont renseignés, ils doivent être des valeurs valides de adm_tenants.status
    (old_status is null or old_status in ('trialing','active','suspended','past_due','cancelled','archived')) and
    (new_status is null or new_status in ('trialing','active','suspended','past_due','cancelled','archived'))
  )
);

-- Indexes proposés pour optimiser les recherches
create index if not exists adm_tle_tenant_event_idx on public.adm_tenant_lifecycle_events (tenant_id, event_type);
create index if not exists adm_tle_event_date_idx on public.adm_tenant_lifecycle_events (event_date desc);
create index if not exists adm_tle_effective_date_idx on public.adm_tenant_lifecycle_events (effective_date desc);
create index if not exists adm_tle_performed_by_idx on public.adm_tenant_lifecycle_events (performed_by);
```

**Principales évolutions :**

- **Normalisation des types** : en remplaçant `plan_changed` par
  `plan_upgraded`/`plan_downgraded` et en ajoutant `activated` et
  `renewed`, on distingue mieux les transitions et on aligne l’énum
  avec les valeurs utilisées dans la spécification et le code【354991504716233†L302-L304】.
- **Champs contextuels** : `previous_plan_id`, `new_plan_id`, `old_status` et
  `new_status` donnent une visibilité explicite sur la transition.
- **Horodatage précis** : `event_date` remplace le simple `created_at`
  pour situer l’action dans le temps, tandis que `effective_date` peut
  différer l’application de l’événement.
- **Émetteur et métadonnées** : `performed_by_type` et `metadata` offrent
  plus de flexibilité pour indiquer si l’événement provient d’une
  opération manuelle, d’un job planifié ou d’un webhook, et pour
  stocker des données supplémentaires (identifiant de facture, motif,
  etc.).

Cette structure cible nécessite d’adapter les services (création de
tenant, changement de plan, suspension, réactivation, annulation) afin
de renseigner les nouveaux champs et de maintenir la cohérence avec
`adm_tenants` et `bil_tenant_subscriptions`. Les nouvelles colonnes
restent facultatives pour assurer la compatibilité ascendante : la
transition vers ce modèle peut se faire progressivement en renseignant
les nouveaux champs uniquement quand ils sont pertinents.
