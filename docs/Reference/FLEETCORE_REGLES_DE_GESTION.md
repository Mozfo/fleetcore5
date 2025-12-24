# FLEETCORE - RÈGLES DE GESTION

## Document de Référence Permanent

**Date création :** 22 Décembre 2025  
**Dernière mise à jour :** 22 Décembre 2025  
**Statut :** DOCUMENT OBLIGATOIRE À LIRE AVANT TOUTE MODIFICATION

---

## ⛔ AVERTISSEMENT

**CE DOCUMENT CONTIENT LES RÈGLES MÉTIER NON NÉGOCIABLES.**

Tout assistant (Claude Code, Claude Assistant, ou autre) DOIT :

1. Lire ce document AVANT toute modification de code
2. Ne JAMAIS modifier une règle de gestion sans validation explicite du CEO
3. Ne JAMAIS supprimer une règle de gestion pour "corriger un bug"

**VIOLATION = ARRÊT IMMÉDIAT**

---

## 1. ARCHITECTURE MULTI-PROVIDER

### 1.1 Concept

FleetCore utilise un système multi-provider pour gérer plusieurs équipes CRM :

- Équipes locales FleetCore (France, UAE, etc.)
- Sous-traitants par pays
- Siège global (FLEETCORE_ADMIN)

### 1.2 Table `adm_providers`

| Provider        | Code                                   | Usage                      |
| --------------- | -------------------------------------- | -------------------------- |
| FLEETCORE_ADMIN | `7ad8173c-68c5-41d3-9918-686e4e941cc0` | Siège global, accès à TOUT |
| FLEETCORE_FR    | `5150b9b1-...`                         | Équipe France uniquement   |
| FLEETCORE_AE    | (à créer)                              | Équipe UAE uniquement      |

### 1.3 Règles de visibilité

| Provider de l'employé | Voit les données de                   |
| --------------------- | ------------------------------------- |
| FLEETCORE_ADMIN       | **TOUS** les providers (accès global) |
| FLEETCORE_FR          | **SEULEMENT** FLEETCORE_FR            |
| FLEETCORE_AE          | **SEULEMENT** FLEETCORE_AE            |

### 1.4 Règle provider_id OBLIGATOIRE

**TOUTE action CRM doit avoir un provider_id :**

- Création de lead → provider_id de l'employé
- Modification d'opportunity → vérifier que provider_id match
- Toutes les tables CRM ont une colonne `provider_id`

**Le provider_id identifie :**

- Qui a créé/modifié la donnée
- Quelle équipe est responsable
- Pour le reporting par équipe/département

---

## 2. EMPLOYÉS FLEETCORE

### 2.1 Table `adm_provider_employees`

Tous les employés FleetCore (y compris le CEO) sont dans cette table.

| Champ           | Description                             | Obligatoire |
| --------------- | --------------------------------------- | ----------- |
| `clerk_user_id` | ID Clerk de l'utilisateur               | ✅ OUI      |
| `provider_id`   | Équipe/département de rattachement      | ✅ OUI      |
| `email`         | Email de l'employé                      | ✅ OUI      |
| `department`    | Département (sales, support, executive) | ✅ OUI      |

### 2.2 Rattachement provider_id

**Le rattachement se fait via la table `adm_provider_employees` :**

- Colonne `provider_id` = l'équipe de l'employé
- Cette valeur doit être modifiable via une page Settings Admin

### 2.3 CEO et Fondateurs

**Le CEO et les fondateurs DOIVENT être rattachés à FLEETCORE_ADMIN :**

- provider_id = `7ad8173c-68c5-41d3-9918-686e4e941cc0`
- Accès global à toutes les données
- Peuvent voir et modifier le travail de toutes les équipes

### 2.4 Employés sans provider_id = ERREUR

Un employé sans provider_id :

- Ne peut exécuter AUCUNE action CRM
- Toutes les requêtes échoueront
- C'est une erreur de configuration à corriger

---

## 3. ISOLATION DES DONNÉES

### 3.1 Fonction `getCurrentProviderId()`

Cette fonction (dans `lib/utils/provider-context.ts`) :

1. Récupère l'utilisateur Clerk connecté
2. Cherche dans `adm_provider_employees` via `clerk_user_id`
3. Retourne le `provider_id` de l'employé

### 3.2 Fonction `buildProviderFilter(providerId)`

Cette fonction génère le filtre SQL :

- Si provider_id = FLEETCORE_ADMIN → **PAS DE FILTRE** (voit tout)
- Si provider_id = autre → `WHERE provider_id = 'xxx'`

### 3.3 Application du filtre

**TOUTES les actions CRM doivent :**

1. Appeler `getCurrentProviderId()`
2. Appliquer `buildProviderFilter()` sur les requêtes
3. Respecter l'isolation des données

---

## 4. BILLING CYCLES

### 4.1 Valeurs autorisées

| Valeur  | Description           |
| ------- | --------------------- |
| `month` | Facturation mensuelle |
| `year`  | Facturation annuelle  |

**AUCUNE autre valeur n'est autorisée.**

Pas de `monthly`, `quarterly`, `semi_annual`, `annual` → CE SONT DES INVENTIONS.

### 4.2 Correspondance Prisma

```prisma
enum billing_interval {
  month
  year
}
```

---

## 5. NÉGOCIATION PRICING

### 5.1 Règle générale

```
% négociation accordé = MIN(% règle hq_pricing_rules, % limite employé)
```

### 5.2 Règles par taille de flotte

**FRANCE :**
| Taille flotte | % négociation max |
|---------------|-------------------|
| 1 véhicule | 0% |
| 2-5 véhicules | 0% |
| 6-19 véhicules | 0% |
| 20+ véhicules | 15% (approbation manager) |

**UAE :**
| Taille flotte | % négociation max |
|---------------|-------------------|
| 1-19 véhicules | 0% |
| 20-49 véhicules | 10% |
| 50+ véhicules | 20% (approbation manager) |

### 5.3 Mois gratuits

| Type       | Durée    | Condition                        |
| ---------- | -------- | -------------------------------- |
| Standard   | 1 mois   | Automatique, tout nouveau client |
| Négocié    | 2-3 mois | Marchandage agressif uniquement  |
| Parrainage | +X mois  | Incentive bouche à oreille       |

---

## 6. QUOTE-TO-CASH

### 6.1 Flux

```
Lead → Opportunity → Quote → Order → Contract → Tenant → Subscription
```

### 6.2 Décisions stratégiques (NON NÉGOCIABLES)

| ID     | Décision                                                           |
| ------ | ------------------------------------------------------------------ |
| DS-001 | `unit_price` = prix catalogue, `discount` = réduction négociée     |
| DS-002 | Tarif négocié = max 12 mois, puis retour au catalogue              |
| DS-003 | Mois gratuits = alternative au discount (évite l'ancrage prix)     |
| DS-006 | Devise = pays LÉGAL de la société client (pas l'IP)                |
| DS-013 | Prix catalogue = READ-ONLY (commercial modifie seulement discount) |

---

## 7. NOMENCLATURE TABLES

### 7.1 Préfixes actuels

| Préfixe | Usage                                          |
| ------- | ---------------------------------------------- |
| `hq_`   | Pilotage CEO (règles globales)                 |
| `adm_`  | Administration (à refactorer → `hq_` + `tnt_`) |
| `tnt_`  | Tenant/Client (futur)                          |
| `crm_`  | CRM                                            |
| `bil_`  | Billing                                        |
| `flt_`  | Fleet                                          |

### 7.2 Refactoring planifié

| Actuel                   | Futur               |
| ------------------------ | ------------------- |
| `adm_provider_employees` | `hq_staff`          |
| `adm_providers`          | `hq_entities`       |
| `adm_tenants`            | `tnt_organizations` |
| `adm_members`            | `tnt_users`         |

---

## 8. PAGES SETTINGS OBLIGATOIRES

**Toute variable/règle de gestion DOIT avoir une page Settings pour modification :**

| Besoin                            | Page Settings           | Statut     |
| --------------------------------- | ----------------------- | ---------- |
| Rattachement employé → provider   | /admin/employees        | 🔜 À créer |
| Règles pricing par flotte         | /admin/hq/pricing-rules | 🔜 À créer |
| Règles offres (trial, parrainage) | /admin/hq/offer-rules   | 🔜 À créer |
| Billing cycles                    | Via table (pas UI)      | ⚪         |

**Principe : ZÉRO HARDCODING, tout configurable via UI.**

---

## 9. TESTS ET DONNÉES

### 9.1 Phase actuelle

**Tout se fait sur FLEETCORE_ADMIN pour les tests.**

Une fois la totalité validée, on affinera les autorisations par équipe.

### 9.2 Données de test

| Entité        | Provider        | Raison        |
| ------------- | --------------- | ------------- |
| Leads         | FLEETCORE_ADMIN | Tests globaux |
| Opportunities | FLEETCORE_ADMIN | Tests globaux |
| Quotes        | FLEETCORE_ADMIN | Tests globaux |

---

## 10. INTERDICTIONS ABSOLUES

| #   | Interdit                                           | Raison                      |
| --- | -------------------------------------------------- | --------------------------- |
| 1   | Modifier une règle de gestion pour corriger un bug | Carton rouge                |
| 2   | Supprimer provider_id d'une action                 | Casse l'isolation           |
| 3   | Hardcoder des valeurs                              | Doit être configurable      |
| 4   | Inventer des billing cycles                        | Seulement `month` et `year` |
| 5   | Créer du code sans lire ce document                | Erreurs garanties           |

---

**FIN DU DOCUMENT**

_Ce document doit être mis à jour à chaque nouvelle règle de gestion validée par le CEO._
