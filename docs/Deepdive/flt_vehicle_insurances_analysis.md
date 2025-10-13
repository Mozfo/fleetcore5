# Analyse de la table `flt_vehicle_insurances` (opérateur ride‑hailing, plug‑and‑play)

_Généré le:_ 2025-10-11T18:33:26.057277 UTC

Cette analyse applique le prompt standard : **Modèle existant & validations**, **Règles métier détectées**, **Propositions d’amélioration & modèle cible**, **Impact sur les autres tables**. Le niveau d’ambition est volontairement **léger** (Fleetcore n’est ni un ERP comptable ni une GMAO).

---

## 1) Modèle existant & validations (d’après le DDL fourni)

### Champs & contraintes

- **id** `uuid` PK `DEFAULT uuid_generate_v4()` : identifiant unique.
- **tenant_id** `uuid` NN FK→`adm_tenants(id)` `ON DELETE CASCADE` : **isolation multi‑tenant** (toutes les requêtes doivent être filtrées par tenant).
- **vehicle_id** `uuid` NN FK→`flt_vehicles(id)` `ON DELETE CASCADE` : rattachement au véhicule assuré.
- **provider_name** `text` NN : assureur (nom libre).
- **policy_number** `text` NN : numéro de police ; **unicité** garantie par l’index unique `(tenant_id, policy_number)` (lignes actives).
- **policy_type** `text` NN `CHECK IN ('comprehensive','third_party','collision','other')` : type de couverture.
- **coverage_amount** `numeric(12,2)` : montant couvert (facultatif).
- **currency** `char(3)` NN `DEFAULT 'EUR'` : devise ISO 4217 (ex. `AED` aux EAU).
- **deductible_amount** `numeric(10,2)` : franchise (optionnel).
- **premium_amount** `numeric(10,2)` NN `> 0` : prime.
- **premium_frequency** `text` NN `DEFAULT 'annual'` `CHECK IN ('annual','semi_annual','quarterly','monthly')` : fréquence de prime.
- **start_date** `date` NN / **end_date** `date` NN `CHECK end_date > start_date` : période de validité.
- **is_active** `boolean` NN `DEFAULT true` : statut opérationnel de la police.
- **auto_renew** `boolean` NN `DEFAULT false` : renouvellement automatique.
- **contact_name/phone/email** `text` : contact assureur (optionnels).
- **document_url** `text` : lien direct vers la preuve d’assurance (optionnel; voir aussi `doc_documents`).
- **claim_count** `integer` NN `DEFAULT 0` `CHECK >= 0` : nb. sinistres connus.
- **last_claim_date** `date` : date du dernier sinistre.
- **notes** `text` : commentaire libre.
- **metadata** `jsonb` NN `DEFAULT '{}'` : extensibilité sans altérer le schéma.
- **created_at/\_by, updated_at/\_by, deleted_at/\_by, deletion_reason** : **audit & soft‑delete**.

### Index & triggers

- Index B‑tree : `tenant_id`, `vehicle_id`, `policy_number`, `policy_type`, `created_at DESC`, `is_active (actifs)`, `end_date (actifs)`.
- Index GIN : `metadata`.
- Unique partiel : `(tenant_id, policy_number)` (actifs).
- Trigger `set_updated_at_flt_vehicle_insurances` sur `UPDATE`.

> Remarque RLS : l’isolation par tenant est une exigence transversale (toutes les lectures/écritures filtrées par `tenant_id`)【985642854533900†L77-L82】.

---

## 2) Règles métier détectées (spécification & code)

- **Assurabilité opérationnelle** : un véhicule doit être **assuré** pour être exploité. Si la police est expirée, le véhicule ne doit pas être assignable ni planifiable (bloqué en exploitation)【567670092230000†L56-L84】.
- **Surveillance des expirations** : la fiche véhicule/scheduler déclenche des **alertes** à l’approche d’une date d’expiration (ex. T‑30/15/7) et impose l’arrêt si expirée【567670092230000†L74-L79】.
- **Historique simple** : un locataire peut enregistrer plusieurs polices **dans le temps** mais **une seule active** par véhicule à un instant donné (renouvellements successifs).
- **Preuve documentaire** : la police (scan PDF/photo) est gérée via le référentiel de documents (`doc_documents`), afin de centraliser la vérification/expiration des pièces. `document_url` sert de lien rapide.
- **Finance optionnelle** : la **prime d’assurance** peut être tracée comme dépense via `fin_transactions` (catégorie `insurance_premium`) sans transformer Fleetcore en comptabilité générale (intégration, pas remplacement).
- **Multi‑pays** : exigences variables (France/EAU) – **paramétrage par tenant**, pas de champs spécifiques au pays pour garder le schéma générique.

Mini‑chronologie (renouvellement type) : _Pré‑alerte_ → _saisie de la nouvelle police_ (`is_active=true`) → _ancienne police basculée_ `is_active=false` → _upload preuve_ dans `doc_documents` → _véhicule re‑autorisable_.

---

## 3) Propositions d’amélioration & modèle cible

### 3.1 Indispensable

1. **Garantir 1 police active / véhicule** (cohérence opérationnelle) :
   ```sql
   create unique index if not exists uq_vehicle_active_policy
     on public.flt_vehicle_insurances(tenant_id, vehicle_id)
     where deleted_at is null and is_active = true;
   ```
2. **Index renouvellement** (alerting & listes d’expiration rapides) :
   ```sql
   create index if not exists idx_insurance_tenant_vehicle_enddate
     on public.flt_vehicle_insurances(tenant_id, vehicle_id, end_date)
     where deleted_at is null;
   ```
3. **Alignement `is_active` ↔ période** (logique service) : si `now() > end_date` ⇒ `is_active=false` (pas de `CHECK` rigide pour éviter de bloquer les imports).

### 3.2 Optionnel (qualité & extensibilité)

- **Document management** : migrer la preuve d’assurance vers `doc_documents` (déjà en place), conserver `document_url` comme redirection.
- **Normalisation légère** : conserver `policy_type`/`premium_frequency` en `CHECK` (pas de référentiels imposés au démarrage). Éventuels ajouts locaux via `metadata`.
- **Rappels configurables** : fenêtre d’alerte paramétrable au **niveau tenant** (ex. 30/15/7 jours) sans ajouter de colonnes.

> **Modèle cible** : le DDL reste **inchangé** hormis l’index unique partiel & l’index de lecture. Pas d’autres colonnes/tables obligatoires (philosophie ride‑hailing).

---

## 4) Impact sur les autres tables

- **`flt_vehicles`** : lecture de `is_active`/`end_date` pour autoriser ou non l’assignation/planning du véhicule (blocage si expirée)【567670092230000†L56-L84】.
- **`doc_documents`** : stockage de la preuve (`entity_type='flt_vehicle'`, `document_type='insurance'`), cycle de vérification documentaire.
- **`fin_transactions`** (option) : enregistrement de la prime (`amount/currency/reference`) et rattachement via `metadata` – Fleetcore **n’est pas** la comptabilité.
- **Audit/RLS** : inchangé – isolation par `tenant_id` et traçabilité via champs d’audit.

---

### Synthèse

- Le schéma courant couvre l’essentiel (police, dates, prime, statut, preuve).
- À ajouter : **unicité “1 police active / véhicule”** + **index de renouvellement**.
- Tout le reste (documents multiples, règles locales, compta) se fait **par intégration** et **par configuration**.
